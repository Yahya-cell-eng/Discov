/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { initializeApp, getApps, getApp } from 'firebase/app';
import {
  getAuth,
  GoogleAuthProvider,
  signInWithPopup,
  signOut,
  onAuthStateChanged,
  User
} from 'firebase/auth';
import {
  getFirestore,
  doc,
  getDoc,
  setDoc,
  updateDoc,
  deleteDoc,
  collection,
  query,
  where,
  onSnapshot,
  getDocFromServer,
  serverTimestamp,
  Timestamp
} from 'firebase/firestore';
import firebaseConfig from '../../firebase-applet-config.json';
import type { MatchState, TGRState, MatchHistory, GelanggangInfo, MasterDataState } from '../types';

export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

export interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
    isAnonymous?: boolean | null;
    tenantId?: string | null;
    providerInfo?: {
      providerId?: string | null;
      email?: string | null;
    }[];
  };
}

const typedFirebaseConfig = firebaseConfig as typeof firebaseConfig & { firestoreDatabaseId?: string };
const app = getApps().length > 0 ? getApp() : initializeApp(typedFirebaseConfig);
export const db = typedFirebaseConfig.firestoreDatabaseId
  ? getFirestore(app, typedFirebaseConfig.firestoreDatabaseId)
  : getFirestore(app);
export const auth = getAuth(app);

export const SCOPES = [
  'https://www.googleapis.com/auth/drive.file',
];

const googleProvider = new GoogleAuthProvider();
SCOPES.forEach((scope) => googleProvider.addScope(scope));

// Strictly in-memory OAuth access token cache (never stored in localStorage/sessionStorage)
let cachedDriveAccessToken: string | null = null;
const driveTokenListeners = new Set<(token: string | null) => void>();

function setCachedDriveAccessToken(token: string | null) {
  cachedDriveAccessToken = token;
  driveTokenListeners.forEach((cb) => cb(token));
}

export function getDriveAccessToken(): string | null {
  return cachedDriveAccessToken;
}

export function clearDriveAccessToken(): void {
  setCachedDriveAccessToken(null);
}

export function subscribeDriveAccessToken(callback: (token: string | null) => void): () => void {
  driveTokenListeners.add(callback);
  callback(cachedDriveAccessToken);
  return () => {
    driveTokenListeners.delete(callback);
  };
}

export const FIREBASE_PROJECT_INFO = {
  projectId: typedFirebaseConfig.projectId,
  databaseId: typedFirebaseConfig.firestoreDatabaseId || '(default)',
  authDomain: typedFirebaseConfig.authDomain,
  hasFirestoreDatabase: Boolean(typedFirebaseConfig.firestoreDatabaseId)
};

export function handleFirestoreError(
  error: unknown,
  operationType: OperationType,
  path: string | null
): never {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
      isAnonymous: auth.currentUser?.isAnonymous,
      tenantId: auth.currentUser?.tenantId,
      providerInfo: auth.currentUser?.providerData?.map((provider) => ({
        providerId: provider.providerId,
        email: provider.email,
      })) || []
    },
    operationType,
    path
  };
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

// Validate connection to Firestore on boot (only when Firestore DB is configured)
async function testConnection() {
  if (!typedFirebaseConfig.firestoreDatabaseId) return;
  try {
    await getDocFromServer(doc(db, 'test', 'connection'));
  } catch (error) {
    if (error instanceof Error && error.message.includes('the client is offline')) {
      console.error('Please check your Firebase configuration (client is offline).');
    }
  }
}
testConnection();

export function sanitizeId(raw: string, fallback = 'default_id'): string {
  const cleaned = (raw || fallback).replace(/[^a-zA-Z0-9_-]/g, '_').slice(0, 128);
  return cleaned.length > 0 ? cleaned : fallback;
}

export function getDefaultTournamentId(uid: string): string {
  return sanitizeId(`trn_${uid.slice(0, 24)}`, 'trn_default');
}

const MAX_SAFE_DOC_BYTES = 550000;
const MAX_CHUNK_BYTES = 350000;

function estimateJsonBytes(value: any): number {
  try {
    const json = JSON.stringify(value);
    if (typeof TextEncoder !== 'undefined') {
      return new TextEncoder().encode(json).length;
    }
    return json.length * 2;
  } catch {
    return 0;
  }
}

function isBase64DataUrl(val: string): boolean {
  return val.startsWith('data:') && val.includes(';base64,');
}

/**
 * Recursively strips undefined values and oversized base64 data URLs
 * so documents always fit comfortably within Firestore's 1MB limit.
 */
function cleanForFirestore(
  obj: any,
  opts: { maxDataUrlLength?: number; stripAllDataUrls?: boolean } = {}
): any {
  const maxDataUrlLength = opts.maxDataUrlLength ?? 32000;
  const stripAllDataUrls = opts.stripAllDataUrls ?? false;

  if (obj === null || obj === undefined) return null;
  if (typeof obj === 'string') {
    if (isBase64DataUrl(obj)) {
      if (stripAllDataUrls || obj.length > maxDataUrlLength) {
        return null;
      }
    }
    if (obj.length > 100000) {
      return obj.slice(0, 100000);
    }
    return obj;
  }
  if (typeof obj === 'number' || typeof obj === 'boolean') return obj;
  if (obj instanceof Date) return obj.toISOString();
  if (obj instanceof Timestamp) return obj;
  if (Array.isArray(obj)) {
    return obj.map((item) => cleanForFirestore(item, opts)).filter((v) => v !== undefined);
  }
  if (typeof obj === 'object') {
    const out: Record<string, any> = {};
    for (const [k, v] of Object.entries(obj)) {
      if (v === undefined) continue;
      if (
        (k === 'logoKiri' || k === 'logoKanan' || k === 'logoTengah' || k === 'foto' || k === 'photo') &&
        typeof v === 'string' &&
        isBase64DataUrl(v) &&
        (stripAllDataUrls || v.length > maxDataUrlLength)
      ) {
        out[k] = null;
      } else {
        out[k] = cleanForFirestore(v, opts);
      }
    }
    return out;
  }
  return null;
}

let isSigningInWithGoogle = false;

function formatGoogleAuthError(err: any): Error {
  const code = err?.code || '';
  if (code === 'auth/popup-blocked') {
    return new Error('Jendela popup Google diblokir oleh browser. Izinkan popup untuk domain ini lalu coba lagi.');
  }
  if (code === 'auth/popup-closed-by-user' || code === 'auth/cancelled-popup-request') {
    return new Error('Proses masuk Google dibatalkan sebelum selesai.');
  }
  if (code === 'auth/unauthorized-domain') {
    const activeHost = typeof window !== 'undefined' && window.location.hostname ? window.location.hostname : '(domain aktif)';
    return new Error(
      `Domain "${activeHost}" belum diotorisasi pada Firebase Authentication (Proyek: ${FIREBASE_PROJECT_INFO.projectId}). Tambahkan "${activeHost}" di Firebase Console -> Authentication -> Settings -> Authorized domains.`
    );
  }
  return err instanceof Error ? err : new Error(err?.message || 'Gagal terhubung ke akun Google.');
}

export async function signInWithGoogleServer(): Promise<User> {
  isSigningInWithGoogle = true;
  try {
    const result = await signInWithPopup(auth, googleProvider);
    const credential = GoogleAuthProvider.credentialFromResult(result);
    if (credential?.accessToken) {
      setCachedDriveAccessToken(credential.accessToken);
    }
    return result.user;
  } catch (err: any) {
    throw formatGoogleAuthError(err);
  } finally {
    isSigningInWithGoogle = false;
  }
}

export async function connectGoogleDriveServer(): Promise<{ user: User; accessToken: string }> {
  isSigningInWithGoogle = true;
  try {
    const driveProvider = new GoogleAuthProvider();
    SCOPES.forEach((scope) => driveProvider.addScope(scope));
    driveProvider.setCustomParameters({
      prompt: 'consent',
      include_granted_scopes: 'true',
      ...(auth.currentUser?.email ? { login_hint: auth.currentUser.email } : {})
    });
    const result = await signInWithPopup(auth, driveProvider);
    const credential = GoogleAuthProvider.credentialFromResult(result);
    if (!credential?.accessToken) {
      throw new Error('Gagal mendapatkan token akses Google Drive. Pastikan izin Google Drive disetujui pada layar persetujuan Google.');
    }
    setCachedDriveAccessToken(credential.accessToken);
    return { user: result.user, accessToken: credential.accessToken };
  } catch (err: any) {
    throw formatGoogleAuthError(err);
  } finally {
    isSigningInWithGoogle = false;
  }
}

export async function signOutGoogleServer(): Promise<void> {
  setCachedDriveAccessToken(null);
  await signOut(auth);
}

export function subscribeAuthState(callback: (user: User | null) => void): () => void {
  return onAuthStateChanged(auth, (user) => {
    if (!user && !isSigningInWithGoogle) {
      setCachedDriveAccessToken(null);
    }
    callback(user);
  });
}

/**
 * Ensures the signed-in user's profile, private email record, and tournament document exist in Firestore.
 */
export async function ensureUserAndTournament(
  user: User,
  namaEvent: string = 'Kejuaraan Pencak Silat'
): Promise<string> {
  const uid = sanitizeId(user.uid);
  const tournamentId = getDefaultTournamentId(uid);

  // 1. Public Profile: /users/{uid}
  const userPath = `users/${uid}`;
  const userRef = doc(db, 'users', uid);
  const displayName = (user.displayName || user.email?.split('@')[0] || 'Ofisial Silat').slice(0, 100);
  const photoURL = (user.photoURL || '').slice(0, 500);

  try {
    const userSnap = await getDoc(userRef);
    if (!userSnap.exists()) {
      await setDoc(userRef, {
        uid,
        displayName,
        ...(photoURL ? { photoURL } : {}),
        activeTournamentId: tournamentId,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      });
    } else {
      await updateDoc(userRef, {
        displayName,
        ...(photoURL ? { photoURL } : {}),
        activeTournamentId: tournamentId,
        updatedAt: serverTimestamp()
      });
    }
  } catch (err) {
    handleFirestoreError(err, OperationType.WRITE, userPath);
  }

  // 2. Private PII Info: /users/{uid}/private/info
  if (user.email) {
    const privatePath = `users/${uid}/private/info`;
    const privateRef = doc(db, 'users', uid, 'private', 'info');
    try {
      const privSnap = await getDoc(privateRef);
      const safeEmail = user.email.slice(0, 254);
      if (!privSnap.exists()) {
        await setDoc(privateRef, {
          uid,
          email: safeEmail,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp()
        });
      } else if (privSnap.data()?.email !== safeEmail) {
        await updateDoc(privateRef, {
          email: safeEmail,
          updatedAt: serverTimestamp()
        });
      }
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, privatePath);
    }
  }

  // 3. Tournament Root Document: /tournaments/{tournamentId}
  const trnPath = `tournaments/${tournamentId}`;
  const trnRef = doc(db, 'tournaments', tournamentId);
  const safeEventName = (namaEvent || 'Kejuaraan Pencak Silat').slice(0, 160);
  try {
    const trnSnap = await getDoc(trnRef);
    if (!trnSnap.exists()) {
      await setDoc(trnRef, {
        id: tournamentId,
        ownerId: uid,
        namaEvent: safeEventName,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      });
    }
  } catch (err) {
    handleFirestoreError(err, OperationType.WRITE, trnPath);
  }

  return tournamentId;
}

export async function syncArenaToFirestore(
  user: User,
  tournamentId: string,
  arenaId: string,
  info: Partial<GelanggangInfo>,
  matchState: MatchState,
  tgrState: TGRState
): Promise<void> {
  const safeTrnId = sanitizeId(tournamentId);
  const safeArenaId = sanitizeId(arenaId);
  const uid = sanitizeId(user.uid);
  const arenaPath = `tournaments/${safeTrnId}/arenas/${safeArenaId}`;
  const arenaRef = doc(db, 'tournaments', safeTrnId, 'arenas', safeArenaId);

  const safeNama = (info.nama || matchState.gelanggang || safeArenaId).slice(0, 100);
  const safeKode = (info.kode || '1').slice(0, 20);
  const safeKet = (info.keterangan || '').slice(0, 160);
  const modeAktif = info.modeAktif === 'seni' ? 'seni' : 'tanding';
  const status = info.status === 'istirahat' || info.status === 'selesai' ? info.status : 'aktif';

  let sanitizedMatchState = cleanForFirestore(matchState);
  let sanitizedTgrState = cleanForFirestore(tgrState);

  if (estimateJsonBytes({ m: sanitizedMatchState, t: sanitizedTgrState }) > MAX_SAFE_DOC_BYTES) {
    sanitizedMatchState = cleanForFirestore(matchState, { stripAllDataUrls: true });
    sanitizedTgrState = cleanForFirestore(tgrState, { stripAllDataUrls: true });
  }

  if (estimateJsonBytes({ m: sanitizedMatchState, t: sanitizedTgrState }) > MAX_SAFE_DOC_BYTES) {
    if (sanitizedMatchState && typeof sanitizedMatchState === 'object') {
      sanitizedMatchState = {
        ...sanitizedMatchState,
        baganCategories: undefined,
        baganData: undefined,
        histories: Array.isArray(sanitizedMatchState.histories) ? sanitizedMatchState.histories.slice(0, 20) : undefined,
        juriHits: Array.isArray(sanitizedMatchState.juriHits) ? sanitizedMatchState.juriHits.slice(-150) : []
      };
      sanitizedMatchState = cleanForFirestore(sanitizedMatchState, { stripAllDataUrls: true });
    }
    if (sanitizedTgrState && typeof sanitizedTgrState === 'object') {
      sanitizedTgrState = {
        ...sanitizedTgrState,
        auditLogs: Array.isArray(sanitizedTgrState.auditLogs) ? sanitizedTgrState.auditLogs.slice(0, 30) : []
      };
    }
  }

  try {
    const snap = await getDoc(arenaRef);
    if (!snap.exists()) {
      await setDoc(arenaRef, {
        arenaId: safeArenaId,
        ownerId: uid,
        nama: safeNama,
        kode: safeKode,
        ...(safeKet ? { keterangan: safeKet } : {}),
        modeAktif,
        status,
        matchState: sanitizedMatchState,
        tgrState: sanitizedTgrState,
        updatedBy: uid,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      });
    } else {
      await updateDoc(arenaRef, {
        nama: safeNama,
        kode: safeKode,
        ...(safeKet ? { keterangan: safeKet } : {}),
        modeAktif,
        status,
        matchState: sanitizedMatchState,
        tgrState: sanitizedTgrState,
        updatedBy: uid,
        updatedAt: serverTimestamp()
      });
    }
  } catch (err) {
    handleFirestoreError(err, OperationType.WRITE, arenaPath);
  }
}

export async function syncHistoryToFirestore(
  user: User,
  tournamentId: string,
  arenaId: string,
  history: MatchHistory
): Promise<void> {
  const safeTrnId = sanitizeId(tournamentId);
  const safeArenaId = sanitizeId(arenaId);
  const safeHistoryId = sanitizeId(history.id, `hist_${Date.now()}`);
  const uid = sanitizeId(user.uid);
  const histPath = `tournaments/${safeTrnId}/histories/${safeHistoryId}`;
  const histRef = doc(db, 'tournaments', safeTrnId, 'histories', safeHistoryId);

  try {
    const snap = await getDoc(histRef);
    if (!snap.exists()) {
      await setDoc(histRef, {
        id: safeHistoryId,
        arenaId: safeArenaId,
        ownerId: uid,
        partai: (history.partai || '01').slice(0, 40),
        kelas: (history.kelas || 'Tanding').slice(0, 80),
        gender: history.gender === 'Putri' ? 'Putri' : 'Putra',
        atletMerah: cleanForFirestore(history.atletMerah || { nama: '', kontingen: '' }),
        atletBiru: cleanForFirestore(history.atletBiru || { nama: '', kontingen: '' }),
        winner: history.winner || null,
        skorAkhirMerah: Number(history.skorAkhirMerah || 0),
        skorAkhirBiru: Number(history.skorAkhirBiru || 0),
        tanggal: (history.tanggal || new Date().toISOString()).slice(0, 60),
        createdAt: serverTimestamp()
      });
    }
  } catch (err) {
    handleFirestoreError(err, OperationType.CREATE, histPath);
  }
}

export interface CloudArenaDoc {
  arenaId: string;
  ownerId: string;
  nama: string;
  kode: string;
  keterangan?: string;
  modeAktif: 'tanding' | 'seni';
  status: 'aktif' | 'istirahat' | 'selesai';
  matchState: MatchState;
  tgrState: TGRState;
  updatedBy: string;
}

export function subscribeTournamentArenas(
  tournamentId: string,
  ownerUid: string,
  onUpdate: (arenas: Record<string, CloudArenaDoc>) => void,
  onErr?: (err: Error) => void
): () => void {
  const safeTrnId = sanitizeId(tournamentId);
  const uid = sanitizeId(ownerUid);
  const colPath = `tournaments/${safeTrnId}/arenas`;
  const q = query(collection(db, 'tournaments', safeTrnId, 'arenas'), where('ownerId', '==', uid));

  return onSnapshot(
    q,
    (snapshot) => {
      const result: Record<string, CloudArenaDoc> = {};
      snapshot.forEach((d) => {
        const data = d.data() as CloudArenaDoc;
        if (data && data.arenaId) {
          result[data.arenaId] = data;
        }
      });
      onUpdate(result);
    },
    (error) => {
      try {
        handleFirestoreError(error, OperationType.LIST, colPath);
      } catch (wrapped: any) {
        if (onErr) onErr(wrapped);
      }
    }
  );
}

export function subscribeTournamentHistories(
  tournamentId: string,
  ownerUid: string,
  onUpdate: (histories: MatchHistory[]) => void,
  onErr?: (err: Error) => void
): () => void {
  const safeTrnId = sanitizeId(tournamentId);
  const uid = sanitizeId(ownerUid);
  const colPath = `tournaments/${safeTrnId}/histories`;
  const q = query(collection(db, 'tournaments', safeTrnId, 'histories'), where('ownerId', '==', uid));

  return onSnapshot(
    q,
    (snapshot) => {
      const list: MatchHistory[] = [];
      snapshot.forEach((d) => {
        const data = d.data() as any;
        list.push({
          id: data.id,
          namaEvent: data.namaEvent || '',
          partai: data.partai,
          kelas: data.kelas,
          gender: data.gender,
          atletMerah: data.atletMerah,
          atletBiru: data.atletBiru,
          winner: data.winner || null,
          skorAkhirMerah: data.skorAkhirMerah,
          skorAkhirBiru: data.skorAkhirBiru,
          tanggal: data.tanggal || ''
        });
      });
      onUpdate(list);
    },
    (error) => {
      try {
        handleFirestoreError(error, OperationType.LIST, colPath);
      } catch (wrapped: any) {
        if (onErr) onErr(wrapped);
      }
    }
  );
}

export interface RegistryStoragePayload {
  registeredAthletes?: any[];
  tgrRegisteredAthletes?: any[];
  customContingents?: any[];
  baganData?: any[];
  tgrPesertaList?: any[];
  contingentMedalAdjustments?: Record<string, any>;
}

const safeParseJson = <T,>(raw: string | null, fallback: T): T => {
  if (!raw) return fallback;
  try {
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
};

export function collectLocalRegistryStorage(): RegistryStoragePayload {
  if (typeof window === 'undefined') return {};
  return {
    registeredAthletes: safeParseJson(localStorage.getItem('silat_registered_athletes'), []),
    tgrRegisteredAthletes: safeParseJson(localStorage.getItem('silat_tgr_registered_athletes'), []),
    customContingents: safeParseJson(localStorage.getItem('silat_custom_contingents'), []),
    baganData: safeParseJson(localStorage.getItem('silat_bagan_data'), []),
    tgrPesertaList: safeParseJson(localStorage.getItem('tgr_peserta_list'), []),
    contingentMedalAdjustments: safeParseJson(localStorage.getItem('silat_contingent_medal_adjustments'), {})
  };
}

export function applyLocalRegistryStorage(payload: RegistryStoragePayload): void {
  if (typeof window === 'undefined' || !payload || typeof payload !== 'object') return;
  try {
    if (Array.isArray(payload.registeredAthletes)) {
      localStorage.setItem('silat_registered_athletes', JSON.stringify(payload.registeredAthletes));
    }
    if (Array.isArray(payload.tgrRegisteredAthletes)) {
      localStorage.setItem('silat_tgr_registered_athletes', JSON.stringify(payload.tgrRegisteredAthletes));
    }
    if (Array.isArray(payload.customContingents)) {
      localStorage.setItem('silat_custom_contingents', JSON.stringify(payload.customContingents));
    }
    if (Array.isArray(payload.baganData)) {
      localStorage.setItem('silat_bagan_data', JSON.stringify(payload.baganData));
      localStorage.setItem('silat_bagan_categories', JSON.stringify(payload.baganData));
    }
    if (Array.isArray(payload.tgrPesertaList)) {
      localStorage.setItem('tgr_peserta_list', JSON.stringify(payload.tgrPesertaList));
    }
    if (payload.contingentMedalAdjustments && typeof payload.contingentMedalAdjustments === 'object') {
      localStorage.setItem('silat_contingent_medal_adjustments', JSON.stringify(payload.contingentMedalAdjustments));
    }
    window.dispatchEvent(new CustomEvent('silat-cloud-registry-updated'));
  } catch (err) {
    console.warn('Gagal menerapkan registry storage lokal dari Google Firestore:', err);
  }
}

export async function syncMasterDataToFirestore(
  user: User,
  tournamentId: string,
  masterData: MasterDataState | null,
  arenasList: GelanggangInfo[]
): Promise<void> {
  const safeTrnId = sanitizeId(tournamentId);
  const uid = sanitizeId(user.uid);
  const cfgPath = `tournaments/${safeTrnId}/configs/master_data`;
  const cfgRef = doc(db, 'tournaments', safeTrnId, 'configs', 'master_data');

  const boundedMasterData = masterData
    ? {
        ...masterData,
        auditLogs: Array.isArray(masterData.auditLogs) ? masterData.auditLogs.slice(0, 50) : []
      }
    : null;

  let payload = cleanForFirestore({
    masterData: boundedMasterData,
    arenasList: arenasList || []
  });

  if (estimateJsonBytes(payload) > MAX_SAFE_DOC_BYTES) {
    const trimmedMaster = masterData
      ? {
          ...masterData,
          auditLogs: Array.isArray(masterData.auditLogs) ? masterData.auditLogs.slice(0, 15) : []
        }
      : null;
    payload = cleanForFirestore(
      {
        masterData: trimmedMaster,
        arenasList: arenasList || []
      },
      { stripAllDataUrls: true }
    );
  }

  try {
    const snap = await getDoc(cfgRef);
    if (!snap.exists()) {
      await setDoc(cfgRef, {
        configId: 'master_data',
        ownerId: uid,
        payload,
        updatedBy: uid,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      });
    } else {
      await updateDoc(cfgRef, {
        payload,
        updatedBy: uid,
        updatedAt: serverTimestamp()
      });
    }

    // Keep root tournament metadata aligned with master tournament info
    if (masterData?.tournament?.namaEvent) {
      const trnRef = doc(db, 'tournaments', safeTrnId);
      const trnSnap = await getDoc(trnRef);
      if (trnSnap.exists()) {
        await updateDoc(trnRef, {
          namaEvent: String(masterData.tournament.namaEvent).slice(0, 160),
          ...(masterData.tournament.lokasi ? { lokasi: String(masterData.tournament.lokasi).slice(0, 160) } : {}),
          ...(masterData.tournament.penyelenggara ? { penyelenggara: String(masterData.tournament.penyelenggara).slice(0, 160) } : {}),
          ...(masterData.tournament.tanggalMulai ? { tanggalMulai: String(masterData.tournament.tanggalMulai).slice(0, 40) } : {}),
          ...(masterData.tournament.tanggalSelesai ? { tanggalSelesai: String(masterData.tournament.tanggalSelesai).slice(0, 40) } : {}),
          updatedAt: serverTimestamp()
        });
      }
    }
  } catch (err) {
    handleFirestoreError(err, OperationType.WRITE, cfgPath);
  }
}

async function upsertConfigDoc(
  uid: string,
  safeTrnId: string,
  configId: string,
  payload: Record<string, any>
): Promise<void> {
  const safeCfgId = sanitizeId(configId);
  const cfgPath = `tournaments/${safeTrnId}/configs/${safeCfgId}`;
  const cfgRef = doc(db, 'tournaments', safeTrnId, 'configs', safeCfgId);

  try {
    const snap = await getDoc(cfgRef);
    if (!snap.exists()) {
      await setDoc(cfgRef, {
        configId: safeCfgId,
        ownerId: uid,
        payload,
        updatedBy: uid,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      });
    } else {
      await updateDoc(cfgRef, {
        payload,
        updatedBy: uid,
        updatedAt: serverTimestamp()
      });
    }
  } catch (err) {
    handleFirestoreError(err, OperationType.WRITE, cfgPath);
  }
}

async function writeChunkedConfigDataset(
  uid: string,
  safeTrnId: string,
  baseConfigId: string,
  rawData: any
): Promise<any> {
  let cleaned = cleanForFirestore(rawData, { maxDataUrlLength: 80000 });
  if (!Array.isArray(cleaned) && estimateJsonBytes(cleaned) > MAX_CHUNK_BYTES) {
    cleaned = cleanForFirestore(rawData, { stripAllDataUrls: true });
  }

  if (Array.isArray(cleaned) && estimateJsonBytes(cleaned) > MAX_CHUNK_BYTES) {
    const chunks: any[][] = [];
    let currentChunk: any[] = [];
    let currentBytes = 2;
    const sanitizedItems: any[] = [];

    for (const item of cleaned) {
      let safeItem = item;
      if (estimateJsonBytes(safeItem) > MAX_CHUNK_BYTES) {
        safeItem = cleanForFirestore(item, { stripAllDataUrls: true });
      }
      sanitizedItems.push(safeItem);
      const itemBytes = estimateJsonBytes(safeItem) + 1;
      if (currentChunk.length > 0 && currentBytes + itemBytes > MAX_CHUNK_BYTES) {
        chunks.push(currentChunk);
        currentChunk = [safeItem];
        currentBytes = itemBytes + 2;
      } else {
        currentChunk.push(safeItem);
        currentBytes += itemBytes;
      }
    }
    if (currentChunk.length > 0) {
      chunks.push(currentChunk);
    }

    for (let i = 0; i < chunks.length; i++) {
      await upsertConfigDoc(uid, safeTrnId, `${baseConfigId}__c${i}`, {
        items: chunks[i]
      });
    }

    await upsertConfigDoc(uid, safeTrnId, baseConfigId, {
      chunked: true,
      chunkCount: chunks.length
    });
    return sanitizedItems;
  } else {
    await upsertConfigDoc(uid, safeTrnId, baseConfigId, {
      chunked: false,
      data: cleaned
    });
    return cleaned;
  }
}

const REGISTRY_CONFIG_MAP: { key: keyof RegistryStoragePayload; configId: string }[] = [
  { key: 'registeredAthletes', configId: 'reg_registered_athletes' },
  { key: 'tgrRegisteredAthletes', configId: 'reg_tgr_registered_athletes' },
  { key: 'customContingents', configId: 'reg_custom_contingents' },
  { key: 'baganData', configId: 'reg_bagan_data' },
  { key: 'tgrPesertaList', configId: 'reg_tgr_peserta_list' },
  { key: 'contingentMedalAdjustments', configId: 'reg_medal_adjustments' }
];

export async function syncRegistryDataToFirestore(
  user: User,
  tournamentId: string,
  registryPayload?: RegistryStoragePayload
): Promise<RegistryStoragePayload> {
  const safeTrnId = sanitizeId(tournamentId);
  const uid = sanitizeId(user.uid);
  const source = registryPayload || collectLocalRegistryStorage();

  // Remove legacy oversized monolithic registry_data doc if present
  try {
    const legacyRef = doc(db, 'tournaments', safeTrnId, 'configs', 'registry_data');
    const legacySnap = await getDoc(legacyRef);
    if (legacySnap.exists()) {
      await deleteDoc(legacyRef);
    }
  } catch {
    // Non-fatal cleanup
  }

  const writtenPayload: RegistryStoragePayload = {};
  for (const entry of REGISTRY_CONFIG_MAP) {
    const val = source[entry.key];
    if (val === undefined) continue;
    (writtenPayload as any)[entry.key] = await writeChunkedConfigDataset(uid, safeTrnId, entry.configId, val);
  }
  return writtenPayload;
}

export interface CloudConfigsState {
  masterData?: MasterDataState | null;
  arenasList?: GelanggangInfo[];
  registryData?: RegistryStoragePayload;
}

export function subscribeTournamentConfigs(
  tournamentId: string,
  ownerUid: string,
  onUpdate: (configs: CloudConfigsState) => void,
  onErr?: (err: Error) => void
): () => void {
  const safeTrnId = sanitizeId(tournamentId);
  const uid = sanitizeId(ownerUid);
  const colPath = `tournaments/${safeTrnId}/configs`;
  const q = query(collection(db, 'tournaments', safeTrnId, 'configs'), where('ownerId', '==', uid));

  return onSnapshot(
    q,
    (snapshot) => {
      const result: CloudConfigsState = {};
      const docsById: Record<string, any> = {};

      snapshot.forEach((d) => {
        const data = d.data() as any;
        if (data?.configId) {
          docsById[data.configId] = data;
        }
      });

      const masterDoc = docsById['master_data'];
      if (masterDoc?.payload) {
        if (masterDoc.payload.masterData) result.masterData = masterDoc.payload.masterData;
        if (Array.isArray(masterDoc.payload.arenasList)) result.arenasList = masterDoc.payload.arenasList;
      }

      // Reassemble per-key & chunked registry docs
      const assembledRegistry: RegistryStoragePayload = {};
      let foundSplitRegistry = false;

      for (const entry of REGISTRY_CONFIG_MAP) {
        const cfgDoc = docsById[entry.configId];
        if (!cfgDoc?.payload) continue;
        foundSplitRegistry = true;

        if (cfgDoc.payload.chunked) {
          const count = Number(cfgDoc.payload.chunkCount || 0);
          const merged: any[] = [];
          for (let i = 0; i < count; i++) {
            const chunkDoc = docsById[`${entry.configId}__c${i}`];
            if (Array.isArray(chunkDoc?.payload?.items)) {
              merged.push(...chunkDoc.payload.items);
            }
          }
          (assembledRegistry as any)[entry.key] = merged;
        } else if (cfgDoc.payload.data !== undefined) {
          (assembledRegistry as any)[entry.key] = cfgDoc.payload.data;
        }
      }

      if (foundSplitRegistry) {
        result.registryData = assembledRegistry;
      } else if (docsById['registry_data']?.payload) {
        result.registryData = docsById['registry_data'].payload as RegistryStoragePayload;
      }

      onUpdate(result);
    },
    (error) => {
      try {
        handleFirestoreError(error, OperationType.LIST, colPath);
      } catch (wrapped: any) {
        if (onErr) onErr(wrapped);
      }
    }
  );
}

export interface CloudBackupItem {
  id: string;
  ownerId: string;
  label: string;
  totalArenas: number;
  totalHistories: number;
  payload: {
    masterData?: MasterDataState | null;
    arenasList?: GelanggangInfo[];
    arenas?: Record<string, { state: MatchState; tgrState: TGRState; histories: MatchHistory[]; info: GelanggangInfo }>;
    registryData?: RegistryStoragePayload;
  };
  createdBy: string;
  createdAt?: string;
}

export async function createCloudBackupSnapshot(
  user: User,
  tournamentId: string,
  label: string,
  snapshotData: CloudBackupItem['payload']
): Promise<CloudBackupItem> {
  const safeTrnId = sanitizeId(tournamentId);
  const uid = sanitizeId(user.uid);
  const backupId = sanitizeId(`bkp_${Date.now()}`);
  const backupPath = `tournaments/${safeTrnId}/backups/${backupId}`;
  const backupRef = doc(db, 'tournaments', safeTrnId, 'backups', backupId);

  const arenasObj = snapshotData.arenas || {};
  const totalArenas = Object.keys(arenasObj).length;
  let totalHistories = 0;
  for (const a of Object.values(arenasObj)) {
    totalHistories += Array.isArray(a?.histories) ? a.histories.length : 0;
  }

  let cleanPayload = cleanForFirestore(
    {
      ...snapshotData,
      masterData: snapshotData.masterData
        ? {
            ...snapshotData.masterData,
            auditLogs: Array.isArray(snapshotData.masterData.auditLogs)
              ? snapshotData.masterData.auditLogs.slice(0, 30)
              : []
          }
        : null
    },
    { maxDataUrlLength: 16000 }
  );

  if (estimateJsonBytes(cleanPayload) > MAX_SAFE_DOC_BYTES) {
    const compactedArenas: Record<string, any> = {};
    for (const [k, v] of Object.entries(arenasObj)) {
      compactedArenas[k] = {
        info: v.info,
        state: v.state ? { ...v.state, baganCategories: undefined, baganData: undefined, histories: undefined } : v.state,
        tgrState: v.tgrState,
        histories: Array.isArray(v.histories) ? v.histories.slice(0, 40) : []
      };
    }
    cleanPayload = cleanForFirestore(
      {
        masterData: snapshotData.masterData
          ? { ...snapshotData.masterData, auditLogs: (snapshotData.masterData.auditLogs || []).slice(0, 15) }
          : null,
        arenasList: snapshotData.arenasList,
        arenas: compactedArenas,
        registryData: snapshotData.registryData
      },
      { stripAllDataUrls: true }
    );
  }

  if (estimateJsonBytes(cleanPayload) > MAX_SAFE_DOC_BYTES) {
    cleanPayload = cleanForFirestore(
      {
        masterData: cleanPayload.masterData,
        arenasList: cleanPayload.arenasList,
        arenas: cleanPayload.arenas
      },
      { stripAllDataUrls: true }
    );
  }

  const safeLabel = (label || `Snapshot ${new Date().toLocaleString('id-ID')}`).slice(0, 120);

  try {
    await setDoc(backupRef, {
      id: backupId,
      ownerId: uid,
      label: safeLabel,
      totalArenas,
      totalHistories,
      payload: cleanPayload,
      createdBy: uid,
      createdAt: serverTimestamp()
    });
    return {
      id: backupId,
      ownerId: uid,
      label: safeLabel,
      totalArenas,
      totalHistories,
      payload: cleanPayload,
      createdBy: uid,
      createdAt: new Date().toISOString()
    };
  } catch (err) {
    handleFirestoreError(err, OperationType.CREATE, backupPath);
  }
}

export function subscribeCloudBackups(
  tournamentId: string,
  ownerUid: string,
  onUpdate: (backups: CloudBackupItem[]) => void,
  onErr?: (err: Error) => void
): () => void {
  const safeTrnId = sanitizeId(tournamentId);
  const uid = sanitizeId(ownerUid);
  const colPath = `tournaments/${safeTrnId}/backups`;
  const q = query(collection(db, 'tournaments', safeTrnId, 'backups'), where('ownerId', '==', uid));

  return onSnapshot(
    q,
    (snapshot) => {
      const items: CloudBackupItem[] = [];
      snapshot.forEach((d) => {
        const data = d.data() as any;
        const createdIso =
          data.createdAt && typeof data.createdAt.toDate === 'function'
            ? data.createdAt.toDate().toISOString()
            : typeof data.createdAt === 'string'
            ? data.createdAt
            : new Date().toISOString();
        items.push({
          id: data.id,
          ownerId: data.ownerId,
          label: data.label,
          totalArenas: Number(data.totalArenas || 0),
          totalHistories: Number(data.totalHistories || 0),
          payload: data.payload || {},
          createdBy: data.createdBy,
          createdAt: createdIso
        });
      });
      items.sort((a, b) => (b.createdAt || '').localeCompare(a.createdAt || ''));
      onUpdate(items);
    },
    (error) => {
      try {
        handleFirestoreError(error, OperationType.LIST, colPath);
      } catch (wrapped: any) {
        if (onErr) onErr(wrapped);
      }
    }
  );
}

export async function deleteCloudBackupSnapshot(
  tournamentId: string,
  backupId: string
): Promise<void> {
  const safeTrnId = sanitizeId(tournamentId);
  const safeBackupId = sanitizeId(backupId);
  const backupPath = `tournaments/${safeTrnId}/backups/${safeBackupId}`;
  const backupRef = doc(db, 'tournaments', safeTrnId, 'backups', safeBackupId);

  try {
    await deleteDoc(backupRef);
  } catch (err) {
    handleFirestoreError(err, OperationType.DELETE, backupPath);
  }
}

