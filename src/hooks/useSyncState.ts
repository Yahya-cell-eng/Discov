/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import type { User } from 'firebase/auth';
import { MatchState, MatchHistory, TGRState, GelanggangInfo, ArenaSummary, MasterDataState } from '../types';
import {
  getServerBaseUrl,
  createDefaultMatchState,
  createDefaultTGRState,
  defaultArenasList
} from '../utils/defaultClientState';
import {
  subscribeAuthState,
  signInWithGoogleServer,
  connectGoogleDriveServer,
  signOutGoogleServer,
  subscribeDriveAccessToken,
  getDriveAccessToken,
  ensureUserAndTournament,
  syncArenaToFirestore,
  syncHistoryToFirestore,
  syncMasterDataToFirestore,
  syncRegistryDataToFirestore,
  subscribeTournamentArenas,
  subscribeTournamentHistories,
  subscribeTournamentConfigs,
  createCloudBackupSnapshot,
  subscribeCloudBackups,
  deleteCloudBackupSnapshot,
  collectLocalRegistryStorage,
  applyLocalRegistryStorage,
  FIREBASE_PROJECT_INFO,
  CloudArenaDoc,
  CloudBackupItem
} from '../services/firebaseService';
import {
  MAIN_DRIVE_FILE_NAME,
  SCHEDULE_DRIVE_PDF_NAME,
  FINAL_REPORT_DRIVE_PDF_NAME,
  DriveFolderInfo,
  DriveStorageFile,
  listDriveStorageFiles,
  uploadNewDriveFile,
  updateExistingDriveFile,
  uploadNewDriveBlobFile,
  updateExistingDriveBlobFile,
  downloadDriveFileJson,
  downloadDriveFileBlob,
  deleteDriveFile
} from '../services/googleDriveService';
import { buildTournamentSchedulePdfBlob } from '../utils/generateSchedulePdf';
import { buildAllMatchesReportPdfBlob } from '../utils/generateMatchReportPdf';

export function useSyncState() {
  // Initialize current arena from URL param or localStorage or default 'arena_1'
  const getInitialArenaId = () => {
    if (typeof window !== 'undefined') {
      try {
        const urlParams = new URLSearchParams(window.location.search);
        const paramArena = urlParams.get('arena');
        if (paramArena) return paramArena;
        const saved = localStorage.getItem('active_gelanggang_id');
        if (saved) return saved;
      } catch {
        // ignore
      }
    }
    return 'arena_1';
  };

  const [currentArenaId, setCurrentArenaIdState] = useState<string>(getInitialArenaId);

  // Initial cached state loader for instant APK & offline loading
  const getCachedState = (): MatchState => {
    if (typeof window !== 'undefined') {
      try {
        const saved = localStorage.getItem(`silat_cached_state_${currentArenaId}`);
        if (saved) return JSON.parse(saved);
      } catch {
        // ignore
      }
    }
    return createDefaultMatchState("Gelanggang 1");
  };

  const getCachedTGRState = (): TGRState => {
    if (typeof window !== 'undefined') {
      try {
        const saved = localStorage.getItem(`silat_cached_tgr_${currentArenaId}`);
        if (saved) return JSON.parse(saved);
      } catch {
        // ignore
      }
    }
    return createDefaultTGRState("Gelanggang 1");
  };

  const [state, setState] = useState<MatchState>(getCachedState);
  const [tgrState, setTgrState] = useState<TGRState>(getCachedTGRState);
  const [histories, setHistories] = useState<MatchHistory[]>([]);
  const [arenasList, setArenasList] = useState<GelanggangInfo[]>(defaultArenasList);
  const [allArenasSummary, setAllArenasSummary] = useState<ArenaSummary[]>([]);
  const [allArenasMap, setAllArenasMap] = useState<Record<string, { state: MatchState; tgrState: TGRState; histories: MatchHistory[]; info: GelanggangInfo }>>({});
  const [masterData, setMasterData] = useState<MasterDataState | null>(null);
  const [connected, setConnected] = useState(false);
  const [reconnectTrigger, setReconnectTrigger] = useState<number>(0);

  // Google Server (Firebase Firestore) State
  const [googleUser, setGoogleUser] = useState<User | null>(null);
  const [googleSyncEnabled, setGoogleSyncEnabledState] = useState<boolean>(() => {
    if (typeof window === 'undefined') return true;
    const saved = localStorage.getItem('silat_google_sync_enabled');
    return saved === null ? true : saved === 'true';
  });
  const [googleSyncStatus, setGoogleSyncStatus] = useState<'disconnected' | 'connecting' | 'synced' | 'error'>('disconnected');
  const [googleError, setGoogleError] = useState<string | null>(null);
  const [cloudTournamentId, setCloudTournamentId] = useState<string | null>(null);
  const [cloudBackups, setCloudBackups] = useState<CloudBackupItem[]>([]);
  const [lastCloudSyncAt, setLastCloudSyncAt] = useState<string | null>(null);

  // Google Drive Storage State (token cached strictly in memory)
  const [driveAccessToken, setDriveAccessToken] = useState<string | null>(() => getDriveAccessToken());
  const [driveFolder, setDriveFolder] = useState<DriveFolderInfo | null>(null);
  const [driveFiles, setDriveFiles] = useState<DriveStorageFile[]>([]);
  const [driveStatus, setDriveStatus] = useState<'idle' | 'loading' | 'ready' | 'error'>('idle');
  const [driveError, setDriveError] = useState<string | null>(null);
  const [lastDriveSyncAt, setLastDriveSyncAt] = useState<string | null>(null);

  const eventSourceRef = useRef<EventSource | null>(null);
  const broadcastRef = useRef<BroadcastChannel | null>(null);
  const currentArenaIdRef = useRef<string>(currentArenaId);
  currentArenaIdRef.current = currentArenaId;
  const googleUserRef = useRef<User | null>(null);
  googleUserRef.current = googleUser;
  const googleSyncEnabledRef = useRef<boolean>(googleSyncEnabled);
  googleSyncEnabledRef.current = googleSyncEnabled;
  const cloudTournamentIdRef = useRef<string | null>(cloudTournamentId);
  cloudTournamentIdRef.current = cloudTournamentId;
  const arenasListRef = useRef<GelanggangInfo[]>(arenasList);
  arenasListRef.current = arenasList;
  const masterDataRef = useRef<MasterDataState | null>(masterData);
  masterDataRef.current = masterData;
  const allArenasMapRef = useRef(allArenasMap);
  allArenasMapRef.current = allArenasMap;
  const stateRef = useRef<MatchState>(state);
  stateRef.current = state;
  const tgrStateRef = useRef<TGRState>(tgrState);
  tgrStateRef.current = tgrState;
  const lastCloudSyncSignatureRef = useRef<string>('');
  const lastCloudMasterSigRef = useRef<string>('');
  const lastCloudRegistrySigRef = useRef<string>('');
  const lastLocalRegistrySigRef = useRef<string>('');
  const isPushingConfigsRef = useRef<boolean>(false);
  const needsCloudPushRef = useRef<boolean>(false);
  const pendingDriveRefreshRef = useRef<Promise<DriveStorageFile[]> | null>(null);

  // Persist state to cache whenever updated
  useEffect(() => {
    if (state && typeof window !== 'undefined') {
      try {
        localStorage.setItem(`silat_cached_state_${currentArenaId}`, JSON.stringify(state));
      } catch {
        // ignore
      }
    }
  }, [state, currentArenaId]);

  useEffect(() => {
    if (tgrState && typeof window !== 'undefined') {
      try {
        localStorage.setItem(`silat_cached_tgr_${currentArenaId}`, JSON.stringify(tgrState));
      } catch {
        // ignore
      }
    }
  }, [tgrState, currentArenaId]);

  const reconnect = useCallback(() => {
    setReconnectTrigger(prev => prev + 1);
  }, []);

  const setGoogleSyncEnabled = useCallback((enabled: boolean) => {
    setGoogleSyncEnabledState(enabled);
    if (typeof window !== 'undefined') {
      localStorage.setItem('silat_google_sync_enabled', String(enabled));
    }
  }, []);

  const signInGoogle = useCallback(async () => {
    setGoogleError(null);
    setGoogleSyncStatus('connecting');
    try {
      const user = await signInWithGoogleServer();
      setGoogleUser(user);
      if (!FIREBASE_PROJECT_INFO.hasFirestoreDatabase) {
        setGoogleSyncStatus('disconnected');
      }
      return user;
    } catch (err: any) {
      const msg = err?.message || 'Gagal masuk dengan akun Google';
      setGoogleError(msg);
      setGoogleSyncStatus('error');
      throw err;
    }
  }, []);

  const signOutGoogle = useCallback(async () => {
    await signOutGoogleServer();
    setGoogleUser(null);
    setCloudTournamentId(null);
    setGoogleSyncStatus('disconnected');
    setGoogleError(null);
  }, []);

  const pushArenaToCloud = useCallback(async (
    arenaId: string,
    arenaMatchState: MatchState,
    arenaTgrState: TGRState,
    arenaInfo?: Partial<GelanggangInfo>,
    arenaHistories?: MatchHistory[]
  ) => {
    if (!FIREBASE_PROJECT_INFO.hasFirestoreDatabase) return;
    const user = googleUserRef.current;
    const trnId = cloudTournamentIdRef.current;
    if (!user || !trnId || !googleSyncEnabledRef.current) return;

    try {
      const info = arenaInfo || arenasListRef.current.find(a => a.id === arenaId) || {
        id: arenaId,
        nama: arenaMatchState.gelanggang || arenaId,
        kode: arenaId.replace('arena_', '') || '1',
        modeAktif: 'tanding',
        status: 'aktif'
      };
      const sig = JSON.stringify({ arenaId, m: arenaMatchState, t: arenaTgrState });
      lastCloudSyncSignatureRef.current = sig;

      await syncArenaToFirestore(user, trnId, arenaId, info, arenaMatchState, arenaTgrState);
      if (Array.isArray(arenaHistories) && arenaHistories.length > 0) {
        const latestHist = arenaHistories[0];
        if (latestHist && latestHist.id) {
          await syncHistoryToFirestore(user, trnId, arenaId, latestHist);
        }
      }
      setLastCloudSyncAt(new Date().toISOString());
      setGoogleSyncStatus('synced');
      setGoogleError(null);
    } catch (err: any) {
      console.warn('Google Firestore sync warning:', err);
      setGoogleError(err?.message || 'Gagal sinkronisasi ke Server Google');
      setGoogleSyncStatus('error');
    }
  }, []);

  const pushConfigsToCloud = useCallback(async (
    overrideMaster?: MasterDataState | null,
    overrideArenasList?: GelanggangInfo[]
  ) => {
    if (!FIREBASE_PROJECT_INFO.hasFirestoreDatabase) return;
    const user = googleUserRef.current;
    const trnId = cloudTournamentIdRef.current;
    if (!user || !trnId || !googleSyncEnabledRef.current) return;

    isPushingConfigsRef.current = true;
    try {
      const mData = overrideMaster !== undefined ? overrideMaster : masterDataRef.current;
      const aList = overrideArenasList !== undefined ? overrideArenasList : arenasListRef.current;
      const regData = collectLocalRegistryStorage();

      const mSig = JSON.stringify({ masterData: mData, arenasList: aList });
      lastCloudMasterSigRef.current = mSig;
      lastLocalRegistrySigRef.current = JSON.stringify(regData);

      const [, writtenRegistry] = await Promise.all([
        syncMasterDataToFirestore(user, trnId, mData, aList),
        syncRegistryDataToFirestore(user, trnId, regData)
      ]);
      lastCloudRegistrySigRef.current = JSON.stringify(writtenRegistry);
      setLastCloudSyncAt(new Date().toISOString());
      setGoogleSyncStatus('synced');
      setGoogleError(null);
    } catch (err: any) {
      console.warn('Google Firestore config sync warning:', err);
      setGoogleError(err?.message || 'Gagal menyimpan konfigurasi ke Google Firestore');
      setGoogleSyncStatus('error');
    } finally {
      isPushingConfigsRef.current = false;
    }
  }, []);

  useEffect(() => {
    if (needsCloudPushRef.current && googleUserRef.current && googleSyncEnabledRef.current && cloudTournamentIdRef.current) {
      needsCloudPushRef.current = false;
      pushArenaToCloud(currentArenaIdRef.current, state, tgrState, undefined, histories);
      pushConfigsToCloud();
    }
  }, [state, tgrState, histories, pushArenaToCloud, pushConfigsToCloud]);

  // Auto-persist local athlete/contingent/bagan/masterData edits to Google Cloud Firestore when changed
  useEffect(() => {
    if (!googleUser || !googleSyncEnabled || !cloudTournamentId) return;

    const timer = setInterval(() => {
      if (isPushingConfigsRef.current) return;
      const currentReg = collectLocalRegistryStorage();
      const regSig = JSON.stringify(currentReg);
      const masterSig = JSON.stringify({
        masterData: masterDataRef.current,
        arenasList: arenasListRef.current
      });

      if (regSig !== lastLocalRegistrySigRef.current || masterSig !== lastCloudMasterSigRef.current) {
        pushConfigsToCloud(masterDataRef.current, arenasListRef.current);
      }
    }, 5000);

    return () => clearInterval(timer);
  }, [googleUser, googleSyncEnabled, cloudTournamentId, pushConfigsToCloud]);

  const pushAllToGoogleCloud = useCallback(async () => {
    const user = googleUserRef.current;
    if (!user) return;
    if (!FIREBASE_PROJECT_INFO.hasFirestoreDatabase) {
      setGoogleSyncStatus('disconnected');
      throw new Error('Database Google Firestore tidak aktif pada konfigurasi OAuth Google Drive ini. Gunakan panel Penyimpanan Google Drive untuk menyimpan data ke Google.');
    }
    setGoogleSyncStatus('connecting');
    try {
      const trnId = cloudTournamentIdRef.current || await ensureUserAndTournament(user, stateRef.current?.namaEvent);
      setCloudTournamentId(trnId);
      cloudTournamentIdRef.current = trnId;

      const entries = Object.entries(allArenasMapRef.current) as [
        string,
        { state: MatchState; tgrState: TGRState; histories: MatchHistory[]; info: GelanggangInfo }
      ][];
      if (entries.length > 0) {
        for (const [aId, container] of entries) {
          await syncArenaToFirestore(user, trnId, aId, container.info || {}, container.state, container.tgrState);
          for (const hist of (container.histories || []).slice(0, 20)) {
            await syncHistoryToFirestore(user, trnId, aId, hist);
          }
        }
      } else {
        await pushArenaToCloud(currentArenaIdRef.current, stateRef.current, tgrStateRef.current, undefined, histories);
      }

      await pushConfigsToCloud(masterDataRef.current, arenasListRef.current);

      setLastCloudSyncAt(new Date().toISOString());
      setGoogleSyncStatus('synced');
      setGoogleError(null);
    } catch (err: any) {
      setGoogleError(err?.message || 'Gagal sinkronisasi massal ke Server Google');
      setGoogleSyncStatus('error');
    }
  }, [histories, pushArenaToCloud, pushConfigsToCloud]);

  const createGoogleBackup = useCallback(async (label?: string) => {
    const user = googleUserRef.current;
    if (!user) throw new Error('Silakan masuk dengan akun Google terlebih dahulu.');
    if (!FIREBASE_PROJECT_INFO.hasFirestoreDatabase) {
      throw new Error('Database Google Firestore tidak aktif pada konfigurasi OAuth Google Drive ini. Gunakan tombol Simpan Snapshot Baru di panel Google Drive.');
    }
    const trnId = cloudTournamentIdRef.current || await ensureUserAndTournament(user, stateRef.current?.namaEvent);
    setCloudTournamentId(trnId);
    cloudTournamentIdRef.current = trnId;

    const arenasSnapshot = { ...allArenasMapRef.current };
    const activeId = currentArenaIdRef.current || 'arena_1';
    if (!arenasSnapshot[activeId]) {
      arenasSnapshot[activeId] = {
        state: stateRef.current,
        tgrState: tgrStateRef.current,
        histories,
        info: arenasListRef.current.find(a => a.id === activeId) || {
          id: activeId,
          nama: stateRef.current?.gelanggang || 'Gelanggang 1',
          kode: '1',
          modeAktif: 'tanding',
          status: 'aktif'
        }
      };
    }

    const created = await createCloudBackupSnapshot(
      user,
      trnId,
      label || `Backup ${stateRef.current?.namaEvent || 'Turnamen'} - ${new Date().toLocaleString('id-ID')}`,
      {
        masterData: masterDataRef.current,
        arenasList: arenasListRef.current,
        arenas: arenasSnapshot,
        registryData: collectLocalRegistryStorage()
      }
    );
    setLastCloudSyncAt(new Date().toISOString());
    return created;
  }, [histories]);

  const restoreGoogleBackup = useCallback(async (backup: CloudBackupItem) => {
    if (!backup || !backup.payload) throw new Error('Data snapshot Google tidak valid.');
    const p = backup.payload;

    if (p.registryData) {
      applyLocalRegistryStorage(p.registryData);
    }
    if (p.masterData) {
      setMasterData(p.masterData);
    }
    if (Array.isArray(p.arenasList) && p.arenasList.length > 0) {
      setArenasList(p.arenasList);
    }
    if (p.arenas && typeof p.arenas === 'object') {
      setAllArenasMap(p.arenas);
      const activeId = currentArenaIdRef.current;
      const activeContainer = p.arenas[activeId] || Object.values(p.arenas)[0];
      if (activeContainer) {
        if (activeContainer.state) setState(activeContainer.state);
        if (activeContainer.tgrState) setTgrState(activeContainer.tgrState);
        if (Array.isArray(activeContainer.histories)) setHistories(activeContainer.histories);
      }
    }

    // Also attempt to push restored dump to local Express server if available
    try {
      const serverBase = getServerBaseUrl();
      await fetch(`${serverBase}/api/storage/import`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          dump: {
            masterData: p.masterData,
            arenas: p.arenas
          }
        })
      });
    } catch {
      // Standalone/cloud-only mode: ignore local server error
    }

    // Re-sync restored live state to Firestore collections
    const user = googleUserRef.current;
    const trnId = cloudTournamentIdRef.current;
    if (user && trnId) {
      if (p.arenas) {
        for (const [aId, container] of Object.entries(p.arenas)) {
          await syncArenaToFirestore(user, trnId, aId, container.info || {}, container.state, container.tgrState);
        }
      }
      await pushConfigsToCloud(p.masterData || masterDataRef.current, p.arenasList || arenasListRef.current);
    }
    setLastCloudSyncAt(new Date().toISOString());
  }, [pushConfigsToCloud]);

  const deleteGoogleBackup = useCallback(async (backupId: string) => {
    const trnId = cloudTournamentIdRef.current;
    if (!trnId) return;
    await deleteCloudBackupSnapshot(trnId, backupId);
  }, []);

  // =========================================================================
  // GOOGLE DRIVE STORAGE INTEGRATION (Client-Side OAuth Bearer Token)
  // =========================================================================
  const refreshGoogleDriveFiles = useCallback(async (explicitToken?: string | null) => {
    const token = explicitToken ?? getDriveAccessToken();
    if (!token) {
      setDriveFiles([]);
      setDriveFolder(null);
      setDriveStatus('idle');
      return [];
    }
    if (pendingDriveRefreshRef.current) {
      return pendingDriveRefreshRef.current;
    }

    const promise = (async () => {
      setDriveStatus('loading');
      setDriveError(null);
      try {
        const { folder, files } = await listDriveStorageFiles(token);
        setDriveFolder(folder);
        setDriveFiles(files);
        setDriveStatus('ready');
        return files;
      } catch (err: any) {
        setDriveError(err?.message || 'Gagal memuat daftar berkas Google Drive.');
        setDriveStatus('error');
        throw err;
      } finally {
        pendingDriveRefreshRef.current = null;
      }
    })();

    pendingDriveRefreshRef.current = promise;
    return promise;
  }, []);

  useEffect(() => {
    const unsubToken = subscribeDriveAccessToken((token) => {
      setDriveAccessToken(token);
      if (token) {
        refreshGoogleDriveFiles(token).catch(() => {});
      } else {
        setDriveFolder(null);
        setDriveFiles([]);
        setDriveStatus('idle');
      }
    });
    return () => unsubToken();
  }, [refreshGoogleDriveFiles]);

  const connectGoogleDrive = useCallback(async () => {
    setDriveError(null);
    setDriveStatus('loading');
    try {
      const { user, accessToken } = await connectGoogleDriveServer();
      setGoogleUser(user);
      await refreshGoogleDriveFiles(accessToken);
      return accessToken;
    } catch (err: any) {
      setDriveError(err?.message || 'Gagal menghubungkan Google Drive.');
      setDriveStatus('error');
      throw err;
    }
  }, [refreshGoogleDriveFiles]);

  const buildDriveStorageDump = useCallback(() => {
    const arenasSnapshot = { ...allArenasMapRef.current };
    const activeId = currentArenaIdRef.current || 'arena_1';
    if (!arenasSnapshot[activeId]) {
      arenasSnapshot[activeId] = {
        state: stateRef.current,
        tgrState: tgrStateRef.current,
        histories,
        info: arenasListRef.current.find(a => a.id === activeId) || {
          id: activeId,
          nama: stateRef.current?.gelanggang || 'Gelanggang 1',
          kode: '1',
          modeAktif: 'tanding',
          status: 'aktif'
        }
      };
    }

    return {
      app: 'YK Digital Scoring Pencak Silat',
      version: '2.0',
      exportedAt: new Date().toISOString(),
      tournamentName: masterDataRef.current?.tournament?.namaEvent || stateRef.current?.namaEvent || 'Kejuaraan Pencak Silat',
      masterData: masterDataRef.current,
      arenasList: arenasListRef.current,
      arenas: arenasSnapshot,
      registryData: collectLocalRegistryStorage()
    };
  }, [histories]);

  const saveNewDriveSnapshot = useCallback(async (customLabel?: string) => {
    const token = getDriveAccessToken();
    if (!token) {
      throw new Error('Google Drive belum terhubung. Silakan klik "Sign in with Google" terlebih dahulu.');
    }
    setDriveStatus('loading');
    setDriveError(null);
    try {
      const now = new Date();
      const pad = (n: number) => String(n).padStart(2, '0');
      const stamp = `${now.getFullYear()}${pad(now.getMonth() + 1)}${pad(now.getDate())}_${pad(now.getHours())}${pad(now.getMinutes())}${pad(now.getSeconds())}`;
      const cleanLabel = (customLabel || '').trim().replace(/[^a-zA-Z0-9_-]/g, '_').slice(0, 48);
      const fileName = cleanLabel ? `silat_${cleanLabel}_${stamp}.json` : `silat_backup_${stamp}.json`;
      const dump = buildDriveStorageDump();
      const uploaded = await uploadNewDriveFile(
        token,
        fileName,
        dump,
        `Snapshot Turnamen: ${dump.tournamentName} (${new Date().toLocaleString('id-ID')})`
      );
      setLastDriveSyncAt(new Date().toISOString());
      await refreshGoogleDriveFiles(token);
      return uploaded;
    } catch (err: any) {
      setDriveError(err?.message || 'Gagal menyimpan snapshot ke Google Drive.');
      setDriveStatus('error');
      throw err;
    }
  }, [buildDriveStorageDump, refreshGoogleDriveFiles]);

  const createMainDriveFile = useCallback(async () => {
    const token = getDriveAccessToken();
    if (!token) {
      throw new Error('Google Drive belum terhubung.');
    }
    setDriveStatus('loading');
    setDriveError(null);
    try {
      const dump = buildDriveStorageDump();
      const uploaded = await uploadNewDriveFile(
        token,
        MAIN_DRIVE_FILE_NAME,
        dump,
        `Penyimpanan Utama Turnamen: ${dump.tournamentName}`
      );
      setLastDriveSyncAt(new Date().toISOString());
      await refreshGoogleDriveFiles(token);
      return uploaded;
    } catch (err: any) {
      setDriveError(err?.message || 'Gagal membuat file penyimpanan utama di Google Drive.');
      setDriveStatus('error');
      throw err;
    }
  }, [buildDriveStorageDump, refreshGoogleDriveFiles]);

  const overwriteMainDriveFile = useCallback(async (fileId: string) => {
    const token = getDriveAccessToken();
    if (!token) {
      throw new Error('Google Drive belum terhubung.');
    }
    setDriveStatus('loading');
    setDriveError(null);
    try {
      const dump = buildDriveStorageDump();
      const updated = await updateExistingDriveFile(
        token,
        fileId,
        MAIN_DRIVE_FILE_NAME,
        dump,
        `Penyimpanan Utama Turnamen: ${dump.tournamentName} (Diperbarui ${new Date().toLocaleString('id-ID')})`
      );
      setLastDriveSyncAt(new Date().toISOString());
      await refreshGoogleDriveFiles(token);
      return updated;
    } catch (err: any) {
      setDriveError(err?.message || 'Gagal memperbarui file Google Drive.');
      setDriveStatus('error');
      throw err;
    }
  }, [buildDriveStorageDump, refreshGoogleDriveFiles]);

  const restoreFromGoogleDriveFile = useCallback(async (fileId: string) => {
    const token = getDriveAccessToken();
    if (!token) {
      throw new Error('Google Drive belum terhubung.');
    }
    setDriveStatus('loading');
    setDriveError(null);
    try {
      const p = await downloadDriveFileJson(token, fileId);
      if (!p || typeof p !== 'object') {
        throw new Error('Format isi berkas JSON dari Google Drive tidak valid.');
      }

      if (p.registryData) {
        applyLocalRegistryStorage(p.registryData);
        lastLocalRegistrySigRef.current = JSON.stringify(collectLocalRegistryStorage());
      }
      if (p.masterData) {
        setMasterData(p.masterData);
      }
      if (Array.isArray(p.arenasList) && p.arenasList.length > 0) {
        setArenasList(p.arenasList);
      }
      if (p.arenas && typeof p.arenas === 'object') {
        setAllArenasMap(p.arenas);
        const activeId = currentArenaIdRef.current;
        const activeContainer = p.arenas[activeId] || Object.values(p.arenas)[0];
        if (activeContainer) {
          if (activeContainer.state) setState(activeContainer.state);
          if (activeContainer.tgrState) setTgrState(activeContainer.tgrState);
          if (Array.isArray(activeContainer.histories)) setHistories(activeContainer.histories);
        }
      }

      try {
        const serverBase = getServerBaseUrl();
        await fetch(`${serverBase}/api/storage/import`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            dump: {
              masterData: p.masterData,
              arenas: p.arenas
            }
          })
        });
      } catch {
        // Standalone/cloud-only mode
      }

      const user = googleUserRef.current;
      const trnId = cloudTournamentIdRef.current;
      if (user && trnId && FIREBASE_PROJECT_INFO.hasFirestoreDatabase) {
        try {
          if (p.arenas) {
            for (const [aId, container] of Object.entries<any>(p.arenas)) {
              await syncArenaToFirestore(user, trnId, aId, container.info || {}, container.state, container.tgrState);
            }
          }
          await pushConfigsToCloud(p.masterData || masterDataRef.current, p.arenasList || arenasListRef.current);
        } catch (fsErr) {
          console.warn('Sinkronisasi ulang ke Firestore setelah restore Drive dilewati:', fsErr);
        }
      }

      setLastDriveSyncAt(new Date().toISOString());
      setDriveStatus('ready');
    } catch (err: any) {
      setDriveError(err?.message || 'Gagal memulihkan data dari Google Drive.');
      setDriveStatus('error');
      throw err;
    }
  }, [pushConfigsToCloud]);

  const saveSchedulePdfToDrive = useCallback(async (overwriteFileId?: string, asTimestampedCopy?: boolean) => {
    const token = getDriveAccessToken();
    if (!token) {
      throw new Error('Google Drive belum terhubung.');
    }
    setDriveStatus('loading');
    setDriveError(null);
    try {
      const tournamentName =
        masterDataRef.current?.tournament?.namaEvent || stateRef.current?.namaEvent || 'Kejuaraan Pencak Silat';
      const { blob } = buildTournamentSchedulePdfBlob({
        tournamentName,
        arenasList: arenasListRef.current,
        allArenasMap: allArenasMapRef.current,
        activeArenaId: currentArenaIdRef.current,
        activeState: stateRef.current,
        activeTgrState: tgrStateRef.current
      });

      const now = new Date();
      const pad = (n: number) => String(n).padStart(2, '0');
      const stamp = `${now.getFullYear()}${pad(now.getMonth() + 1)}${pad(now.getDate())}_${pad(now.getHours())}${pad(now.getMinutes())}${pad(now.getSeconds())}`;
      const targetName = asTimestampedCopy ? `Jadwal_Pertandingan_${stamp}.pdf` : SCHEDULE_DRIVE_PDF_NAME;
      const desc = `Jadwal Pertandingan Resmi (${tournamentName}) - ${now.toLocaleString('id-ID')}`;

      const result = overwriteFileId && !asTimestampedCopy
        ? await updateExistingDriveBlobFile(token, overwriteFileId, targetName, blob, 'application/pdf', desc)
        : await uploadNewDriveBlobFile(token, targetName, blob, 'application/pdf', desc);

      setLastDriveSyncAt(new Date().toISOString());
      await refreshGoogleDriveFiles(token);
      return result;
    } catch (err: any) {
      setDriveError(err?.message || 'Gagal menyimpan PDF Jadwal Pertandingan ke Google Drive.');
      setDriveStatus('error');
      throw err;
    }
  }, [refreshGoogleDriveFiles]);

  const saveFinalReportPdfToDrive = useCallback(async (overwriteFileId?: string, asTimestampedCopy?: boolean) => {
    const token = getDriveAccessToken();
    if (!token) {
      throw new Error('Google Drive belum terhubung.');
    }
    setDriveStatus('loading');
    setDriveError(null);
    try {
      const tournamentName =
        masterDataRef.current?.tournament?.namaEvent || stateRef.current?.namaEvent || 'Kejuaraan Pencak Silat';
      const arenasMap = (allArenasMapRef.current || {}) as Record<
        string,
        { state?: MatchState; tgrState?: TGRState; histories?: MatchHistory[]; info?: GelanggangInfo }
      >;

      const combinedHistories: MatchHistory[] = [];
      const histIds = new Set<string>();
      const pushHistory = (h: MatchHistory) => {
        const key = h?.id || `${h?.partai}_${h?.tanggal || ''}`;
        if (!histIds.has(key)) {
          histIds.add(key);
          combinedHistories.push(h);
        }
      };

      histories.forEach(pushHistory);
      Object.values(arenasMap).forEach((container) => {
        (container?.histories || []).forEach(pushHistory);
      });

      const combinedBagan: any[] = [];
      const seenCatKeys = new Set<string>();
      const addBaganCats = (cats?: any[]) => {
        if (!Array.isArray(cats)) return;
        cats.forEach((cat) => {
          const cKey = cat?.id || `${cat?.name}_${cat?.gender || ''}`;
          if (!seenCatKeys.has(cKey)) {
            seenCatKeys.add(cKey);
            combinedBagan.push(cat);
          }
        });
      };

      addBaganCats((stateRef.current as any)?.baganCategories || stateRef.current?.baganData);
      Object.values(arenasMap).forEach((container) => {
        addBaganCats((container?.state as any)?.baganCategories || container?.state?.baganData);
      });

      const combinedTgrPeserta: any[] = [];
      const seenPeserta = new Set<string>();
      const addTgrPeserta = (list?: any[]) => {
        if (!Array.isArray(list)) return;
        list.forEach((p) => {
          const pKey = p?.id || `${p?.nama}_${p?.kontingen}_${p?.kategori}`;
          if (!seenPeserta.has(pKey)) {
            seenPeserta.add(pKey);
            combinedTgrPeserta.push(p);
          }
        });
      };

      addTgrPeserta(tgrStateRef.current?.pesertaList);
      Object.values(arenasMap).forEach((container) => {
        addTgrPeserta(container?.tgrState?.pesertaList);
      });

      const mergedTgrState = tgrStateRef.current
        ? { ...tgrStateRef.current, pesertaList: combinedTgrPeserta }
        : undefined;

      const activeArenaObj = arenasListRef.current.find((a) => a.id === currentArenaIdRef.current);
      const { blob } = buildAllMatchesReportPdfBlob({
        state: stateRef.current,
        histories: combinedHistories,
        baganData: combinedBagan,
        tgrState: mergedTgrState,
        tournamentTitle: tournamentName,
        gelanggang:
          arenasListRef.current.length > 1
            ? `Semua Gelanggang (${arenasListRef.current.length})`
            : activeArenaObj?.nama || stateRef.current?.gelanggang || 'Gelanggang Utama'
      });

      const now = new Date();
      const pad = (n: number) => String(n).padStart(2, '0');
      const stamp = `${now.getFullYear()}${pad(now.getMonth() + 1)}${pad(now.getDate())}_${pad(now.getHours())}${pad(now.getMinutes())}${pad(now.getSeconds())}`;
      const targetName = asTimestampedCopy ? `Laporan_Akhir_Turnamen_${stamp}.pdf` : FINAL_REPORT_DRIVE_PDF_NAME;
      const desc = `Laporan Akhir Resmi Turnamen (${tournamentName}) - ${now.toLocaleString('id-ID')}`;

      const result = overwriteFileId && !asTimestampedCopy
        ? await updateExistingDriveBlobFile(token, overwriteFileId, targetName, blob, 'application/pdf', desc)
        : await uploadNewDriveBlobFile(token, targetName, blob, 'application/pdf', desc);

      setLastDriveSyncAt(new Date().toISOString());
      await refreshGoogleDriveFiles(token);
      return result;
    } catch (err: any) {
      setDriveError(err?.message || 'Gagal menyimpan PDF Laporan Akhir ke Google Drive.');
      setDriveStatus('error');
      throw err;
    }
  }, [histories, refreshGoogleDriveFiles]);

  const downloadDriveFileToLocal = useCallback(async (fileId: string, fileName: string, mimeType?: string) => {
    const token = getDriveAccessToken();
    if (!token) {
      throw new Error('Google Drive belum terhubung.');
    }
    const isPdf = mimeType === 'application/pdf' || fileName.toLowerCase().endsWith('.pdf');
    let blob: Blob;
    if (isPdf) {
      blob = await downloadDriveFileBlob(token, fileId);
    } else {
      const json = await downloadDriveFileJson(token, fileId);
      blob = new Blob([JSON.stringify(json, null, 2)], { type: 'application/json' });
    }
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = fileName || (isPdf ? 'dokumen_silat.pdf' : 'silat_drive_backup.json');
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }, []);

  const deleteGoogleDriveFile = useCallback(async (fileId: string) => {
    const token = getDriveAccessToken();
    if (!token) {
      throw new Error('Google Drive belum terhubung.');
    }
    setDriveStatus('loading');
    setDriveError(null);
    try {
      await deleteDriveFile(token, fileId);
      await refreshGoogleDriveFiles(token);
    } catch (err: any) {
      setDriveError(err?.message || 'Gagal menghapus berkas dari Google Drive.');
      setDriveStatus('error');
      throw err;
    }
  }, [refreshGoogleDriveFiles]);

  // Listen to Google Firebase Auth & Realtime Firestore Subscriptions
  useEffect(() => {
    let unsubArenas: (() => void) | null = null;
    let unsubHistories: (() => void) | null = null;
    let unsubConfigs: (() => void) | null = null;
    let unsubBackups: (() => void) | null = null;

    const unsubAuth = subscribeAuthState(async (user) => {
      setGoogleUser(user);
      if (unsubArenas) {
        unsubArenas();
        unsubArenas = null;
      }
      if (unsubHistories) {
        unsubHistories();
        unsubHistories = null;
      }
      if (unsubConfigs) {
        unsubConfigs();
        unsubConfigs = null;
      }
      if (unsubBackups) {
        unsubBackups();
        unsubBackups = null;
      }

      if (!user) {
        setCloudTournamentId(null);
        setCloudBackups([]);
        setGoogleSyncStatus('disconnected');
        return;
      }

      if (!googleSyncEnabledRef.current) {
        setGoogleSyncStatus('disconnected');
        return;
      }

      if (!FIREBASE_PROJECT_INFO.hasFirestoreDatabase) {
        setCloudTournamentId(null);
        cloudTournamentIdRef.current = null;
        setGoogleSyncStatus('disconnected');
        setGoogleError(null);
        return;
      }

      setGoogleSyncStatus('connecting');
      try {
        const trnId = await ensureUserAndTournament(user, stateRef.current?.namaEvent || 'Kejuaraan Pencak Silat');
        setCloudTournamentId(trnId);
        cloudTournamentIdRef.current = trnId;

        unsubArenas = subscribeTournamentArenas(
          trnId,
          user.uid,
          (remoteArenas: Record<string, CloudArenaDoc>) => {
            const remoteKeys = Object.keys(remoteArenas);
            if (remoteKeys.length === 0) {
              // Seed initial arenas to Google Firestore if cloud is empty
              const localEntries = Object.entries(allArenasMapRef.current) as [
                string,
                { state: MatchState; tgrState: TGRState; histories: MatchHistory[]; info: GelanggangInfo }
              ][];
              if (localEntries.length > 0) {
                for (const [aId, container] of localEntries) {
                  pushArenaToCloud(aId, container.state, container.tgrState, container.info, container.histories);
                }
              } else {
                pushArenaToCloud(currentArenaIdRef.current, stateRef.current, tgrStateRef.current);
              }
              setGoogleSyncStatus('synced');
              return;
            }

            const activeId = currentArenaIdRef.current;
            const activeRemote = remoteArenas[activeId];
            if (activeRemote) {
              const incomingSig = JSON.stringify({
                arenaId: activeId,
                m: activeRemote.matchState,
                t: activeRemote.tgrState
              });
              if (incomingSig !== lastCloudSyncSignatureRef.current) {
                lastCloudSyncSignatureRef.current = incomingSig;
                if (activeRemote.matchState) setState(activeRemote.matchState);
                if (activeRemote.tgrState) setTgrState(activeRemote.tgrState);
              }
            }

            setAllArenasMap(prev => {
              const next = { ...prev };
              for (const [aId, docData] of Object.entries(remoteArenas)) {
                next[aId] = {
                  state: docData.matchState,
                  tgrState: docData.tgrState,
                  histories: prev[aId]?.histories || [],
                  info: {
                    id: docData.arenaId,
                    nama: docData.nama,
                    kode: docData.kode,
                    keterangan: docData.keterangan || '',
                    modeAktif: docData.modeAktif,
                    status: docData.status
                  }
                };
              }
              return next;
            });

            setLastCloudSyncAt(new Date().toISOString());
            setGoogleSyncStatus('synced');
            setGoogleError(null);
          },
          (err) => {
            setGoogleError(err.message);
            setGoogleSyncStatus('error');
          }
        );

        unsubHistories = subscribeTournamentHistories(
          trnId,
          user.uid,
          (remoteHists) => {
            if (remoteHists.length > 0) {
              setHistories(prev => {
                const existingIds = new Set(prev.map(h => h.id));
                const merged = [...prev];
                for (const rh of remoteHists) {
                  if (!existingIds.has(rh.id)) merged.push(rh);
                }
                return merged;
              });
            }
          },
          (err) => {
            setGoogleError(err.message);
          }
        );

        unsubConfigs = subscribeTournamentConfigs(
          trnId,
          user.uid,
          (configs) => {
            const hasMaster = Boolean(configs.masterData || (configs.arenasList && configs.arenasList.length > 0));
            const hasRegistry = Boolean(configs.registryData);

            if (!hasMaster && !hasRegistry) {
              // Seed initial masterData + arenasList + local registries into Google Firestore
              pushConfigsToCloud(masterDataRef.current, arenasListRef.current);
              return;
            }

            if (configs.masterData || configs.arenasList) {
              const incomingMSig = JSON.stringify({
                masterData: configs.masterData || masterDataRef.current,
                arenasList: configs.arenasList || arenasListRef.current
              });
              if (incomingMSig !== lastCloudMasterSigRef.current) {
                lastCloudMasterSigRef.current = incomingMSig;
                if (configs.masterData) setMasterData(configs.masterData);
                if (Array.isArray(configs.arenasList) && configs.arenasList.length > 0) {
                  setArenasList(configs.arenasList);
                }
              }
            }

            if (isPushingConfigsRef.current) return;

            if (configs.registryData) {
              const incomingRSig = JSON.stringify(configs.registryData);
              if (incomingRSig !== lastCloudRegistrySigRef.current) {
                lastCloudRegistrySigRef.current = incomingRSig;
                applyLocalRegistryStorage(configs.registryData);
                lastLocalRegistrySigRef.current = JSON.stringify(collectLocalRegistryStorage());
              }
            }
          },
          (err) => {
            setGoogleError(err.message);
          }
        );

        unsubBackups = subscribeCloudBackups(
          trnId,
          user.uid,
          (backups) => {
            setCloudBackups(backups);
          },
          (err) => {
            setGoogleError(err.message);
          }
        );
      } catch (err: any) {
        setGoogleError(err?.message || 'Gagal menginisialisasi Server Google Firestore');
        setGoogleSyncStatus('error');
      }
    });

    return () => {
      unsubAuth();
      if (unsubArenas) unsubArenas();
      if (unsubHistories) unsubHistories();
      if (unsubConfigs) unsubConfigs();
      if (unsubBackups) unsubBackups();
    };
  }, [googleSyncEnabled, pushArenaToCloud, pushConfigsToCloud]);

  const selectArena = useCallback((newArenaId: string) => {
    if (!newArenaId) return;
    setCurrentArenaIdState(newArenaId);
    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem('active_gelanggang_id', newArenaId);
        const url = new URL(window.location.href);
        url.searchParams.set('arena', newArenaId);
        window.history.replaceState({}, '', url.toString());
      } catch {
        // ignore
      }
    }

    // If we already have the arena data locally in allArenasMap, switch immediately
    if (allArenasMap[newArenaId]) {
      setState(allArenasMap[newArenaId].state);
      setTgrState(allArenasMap[newArenaId].tgrState);
      setHistories(allArenasMap[newArenaId].histories || []);
    } else {
      const serverBase = getServerBaseUrl();
      fetch(`${serverBase}/api/state?arena=${encodeURIComponent(newArenaId)}`)
        .then(res => res.json())
        .then(data => {
          if (data.state) setState(data.state);
          if (data.tgrState) setTgrState(data.tgrState);
          if (data.histories) setHistories(data.histories);
          if (data.arenasList) setArenasList(data.arenasList);
          if (data.allArenasSummary) setAllArenasSummary(data.allArenasSummary);
          if (data.arenas) setAllArenasMap(data.arenas);
          if (data.masterData) setMasterData(data.masterData);
        })
        .catch(err => console.warn('Failed to switch arena data:', err));
    }
  }, [allArenasMap]);

  useEffect(() => {
    // Setup local BroadcastChannel for zero-latency cross-tab synchronization
    if (typeof window !== 'undefined' && 'BroadcastChannel' in window) {
      try {
        const channel = new BroadcastChannel('silat_scoring_realtime_sync');
        broadcastRef.current = channel;
        channel.onmessage = (event) => {
          if (event.data && event.data.type === 'LOCAL_STATE_SYNC') {
            if (event.data.arenasList) setArenasList(event.data.arenasList);
            if (event.data.allArenasSummary) setAllArenasSummary(event.data.allArenasSummary);
            if (event.data.arenas) setAllArenasMap(event.data.arenas);
            if (event.data.masterData) setMasterData(event.data.masterData);

            // If the broadcast is for our current arena or all arenas, update current active view
            const activeId = currentArenaIdRef.current;
            if (event.data.arenaId === activeId || !event.data.arenaId) {
              if (event.data.state) setState(event.data.state);
              if (event.data.tgrState) setTgrState(event.data.tgrState);
              if (event.data.histories) setHistories(event.data.histories);
            } else if (event.data.arenas && event.data.arenas[activeId]) {
              setState(event.data.arenas[activeId].state);
              setTgrState(event.data.arenas[activeId].tgrState);
              setHistories(event.data.arenas[activeId].histories || []);
            }
          }
        };
      } catch (err) {
        console.warn("BroadcastChannel not supported or failed to initialize:", err);
      }
    }

    // Fetch initial HTTP state once with quick fallback
    const serverBase = getServerBaseUrl();
    const activeId = currentArenaId;

    fetch(`${serverBase}/api/state?arena=${encodeURIComponent(activeId)}`)
      .then(res => {
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        return res.json();
      })
      .then(data => {
        if (data.state) setState(data.state);
        if (data.tgrState) setTgrState(data.tgrState);
        if (data.histories) setHistories(data.histories);
        if (data.arenasList) setArenasList(data.arenasList);
        if (data.allArenasSummary) setAllArenasSummary(data.allArenasSummary);
        if (data.arenas) setAllArenasMap(data.arenas);
        if (data.masterData) setMasterData(data.masterData);
        setConnected(true);
      })
      .catch(err => {
        console.warn('Initial server state fetch failed (operating in offline/APK standalone mode):', err);
        setConnected(false);
      });

    // Open SSE stream for network real-time syncing tied to currentArenaId
    let isSubscribed = true;
    let reconnectTimeoutId: any = null;

    const connect = () => {
      if (!isSubscribed) return;
      if (eventSourceRef.current) {
        eventSourceRef.current.close();
      }

      try {
        const ev = new EventSource(`${serverBase}/api/events?arena=${encodeURIComponent(activeId)}`);
        eventSourceRef.current = ev;

        ev.onopen = () => {
          if (isSubscribed) setConnected(true);
        };

        ev.onmessage = (event) => {
          if (!isSubscribed) return;
          try {
            const data = JSON.parse(event.data);
            if (data.type === 'STATE_UPDATE') {
              if (data.arenasList) setArenasList(data.arenasList);
              if (data.allArenasSummary) setAllArenasSummary(data.allArenasSummary);
              if (data.masterData) setMasterData(data.masterData);
              if (data.arenas) {
                setAllArenasMap(data.arenas);
              }

              const currentActive = currentArenaIdRef.current;
              if (data.arenas && data.arenas[currentActive]) {
                setState(data.arenas[currentActive].state);
                setTgrState(data.arenas[currentActive].tgrState);
                setHistories(data.arenas[currentActive].histories || []);
              } else {
                if (data.state) setState(data.state);
                if (data.tgrState) setTgrState(data.tgrState);
                if (data.histories) setHistories(data.histories);
              }

              // Also notify local BroadcastChannel
              if (broadcastRef.current) {
                broadcastRef.current.postMessage({
                  type: 'LOCAL_STATE_SYNC',
                  arenaId: data.arenaId,
                  state: data.state,
                  tgrState: data.tgrState,
                  histories: data.histories,
                  arenasList: data.arenasList,
                  allArenasSummary: data.allArenasSummary,
                  arenas: data.arenas,
                  masterData: data.masterData
                });
              }
            }
          } catch (e) {
            console.error("Failed to parse sync state package:", e);
          }
        };

        ev.onerror = () => {
          if (!isSubscribed) return;
          setConnected(false);
          ev.close();
          reconnectTimeoutId = setTimeout(connect, 4000);
        };
      } catch (err) {
        console.warn('EventSource initialization failed (offline mode):', err);
        setConnected(false);
        reconnectTimeoutId = setTimeout(connect, 5000);
      }
    };

    connect();

    return () => {
      isSubscribed = false;
      if (reconnectTimeoutId) clearTimeout(reconnectTimeoutId);
      if (eventSourceRef.current) {
        eventSourceRef.current.close();
      }
      if (broadcastRef.current) {
        broadcastRef.current.close();
      }
    };
  }, [currentArenaId, reconnectTrigger]);

  const dispatch = useCallback(async (type: string, payload: any = {}) => {
    const targetArenaId = payload.arenaId || currentArenaIdRef.current || 'arena_1';
    const serverBase = getServerBaseUrl();

    try {
      const bodyPayload = {
        type,
        arenaId: targetArenaId,
        payload: {
          ...payload,
          arenaId: targetArenaId
        }
      };

      const res = await fetch(`${serverBase}/api/action`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(bodyPayload)
      });

      if (!res.ok) {
        throw new Error(`Server returned HTTP ${res.status}`);
      }
      const data = await res.json();
      if (data.success) {
        if (data.arenasList) setArenasList(data.arenasList);
        if (data.allArenasSummary) setAllArenasSummary(data.allArenasSummary);

        if (targetArenaId === currentArenaIdRef.current) {
          if (data.state) setState(data.state);
          if (data.tgrState) setTgrState(data.tgrState);
          if (data.histories) setHistories(data.histories);
        }

        // Sync updated arena state & configs to Google Server (Firebase Firestore) if connected
        if (googleUserRef.current && googleSyncEnabledRef.current) {
          if (data.state && data.tgrState) {
            pushArenaToCloud(targetArenaId, data.state, data.tgrState, undefined, data.histories);
          }
          pushConfigsToCloud(masterDataRef.current, data.arenasList || arenasListRef.current);
        }

        if (broadcastRef.current) {
          broadcastRef.current.postMessage({
            type: 'LOCAL_STATE_SYNC',
            arenaId: targetArenaId,
            state: data.state,
            tgrState: data.tgrState,
            histories: data.histories || histories,
            arenasList: data.arenasList,
            allArenasSummary: data.allArenasSummary
          });
        }
      }
      return data;
    } catch (e) {
      console.warn(`Dispatch action ${type} over network failed, applying local fallback:`, e);

      // Helper to compute tanding total score
      const calcScoreTotal = (scoresObj: any, direct: number = 0, accum: number = 0, pen: any = {}) => {
        let tot = (scoresObj?.babak1 || 0) + (scoresObj?.babak2 || 0) + (scoresObj?.babak3 || 0) + (direct || 0) - (accum || 0);
        if (pen?.teguran1) tot -= 1;
        if (pen?.teguran2) tot -= 2;
        if (pen?.peringatan1) tot -= 5;
        if (pen?.peringatan2) tot -= 10;
        return tot;
      };

      // Offline optimistic local updates for APK/standalone use
      if (type === 'TOGGLE_TIMER') {
        setState(prev => ({ ...prev, timerActive: !prev.timerActive }));
      } else if (type === 'RESET_TIMER') {
        setState(prev => ({ ...prev, timerActive: false, timerSeconds: prev.selectedWaktu }));
      } else if (type === 'TGR_START_TIMER') {
        setTgrState(prev => ({ ...prev, timerActive: true }));
      } else if (type === 'TGR_PAUSE_TIMER') {
        setTgrState(prev => ({ ...prev, timerActive: false }));
      } else if (type === 'TGR_TOGGLE_TIMER') {
        setTgrState(prev => ({ ...prev, timerActive: !prev.timerActive }));
      } else if (type === 'TGR_RESET_TIMER') {
        setTgrState(prev => ({ ...prev, timerActive: false, timerSeconds: 0 }));
      } else if (type === 'CHANGE_BABAK' || type === 'SET_BABAK') {
        const nextBabak = typeof payload === 'number' ? payload : (payload?.babak || 1);
        setState(prev => {
          let addM = 0;
          let addB = 0;
          if (nextBabak !== prev.currentBabak && prev.dewanPenalties) {
            const pM = prev.dewanPenalties.merah;
            if (pM.teguran1) addM += 1;
            if (pM.teguran2) addM += 2;
            if (pM.peringatan1) addM += 5;
            if (pM.peringatan2) addM += 10;

            const pB = prev.dewanPenalties.biru;
            if (pB.teguran1) addB += 1;
            if (pB.teguran2) addB += 2;
            if (pB.peringatan1) addB += 5;
            if (pB.peringatan2) addB += 10;
          }

          const newAccumM = (prev.accumulatedPenaltyDeductions?.merah || 0) + addM;
          const newAccumB = (prev.accumulatedPenaltyDeductions?.biru || 0) + addB;
          const newPenM = {
            binaan1: false,
            binaan2: false,
            teguran1: false,
            teguran2: false,
            peringatan1: false,
            peringatan2: false,
            disqualified: prev.dewanPenalties?.merah?.disqualified || false
          };
          const newPenB = {
            binaan1: false,
            binaan2: false,
            teguran1: false,
            teguran2: false,
            peringatan1: false,
            peringatan2: false,
            disqualified: prev.dewanPenalties?.biru?.disqualified || false
          };

          return {
            ...prev,
            currentBabak: nextBabak,
            timerActive: false,
            timerSeconds: prev.selectedWaktu,
            accumulatedPenaltyDeductions: {
              merah: newAccumM,
              biru: newAccumB,
            },
            dewanPenalties: {
              merah: newPenM,
              biru: newPenB
            },
            scores: {
              ...prev.scores,
              merah: {
                ...prev.scores.merah,
                total: calcScoreTotal(prev.scores?.merah, prev.directPoints?.merah, newAccumM, newPenM)
              },
              biru: {
                ...prev.scores.biru,
                total: calcScoreTotal(prev.scores?.biru, prev.directPoints?.biru, newAccumB, newPenB)
              }
            }
          };
        });
      } else if (type === 'APPROVE_NEXT_BABAK') {
        setState(prev => {
          let addM = 0;
          let addB = 0;
          if (prev.dewanPenalties) {
            const pM = prev.dewanPenalties.merah;
            if (pM.teguran1) addM += 1;
            if (pM.teguran2) addM += 2;
            if (pM.peringatan1) addM += 5;
            if (pM.peringatan2) addM += 10;

            const pB = prev.dewanPenalties.biru;
            if (pB.teguran1) addB += 1;
            if (pB.teguran2) addB += 2;
            if (pB.peringatan1) addB += 5;
            if (pB.peringatan2) addB += 10;
          }

          const newAccumM = (prev.accumulatedPenaltyDeductions?.merah || 0) + addM;
          const newAccumB = (prev.accumulatedPenaltyDeductions?.biru || 0) + addB;
          const newPenM = {
            binaan1: false,
            binaan2: false,
            teguran1: false,
            teguran2: false,
            peringatan1: false,
            peringatan2: false,
            disqualified: prev.dewanPenalties?.merah?.disqualified || false
          };
          const newPenB = {
            binaan1: false,
            binaan2: false,
            teguran1: false,
            teguran2: false,
            peringatan1: false,
            peringatan2: false,
            disqualified: prev.dewanPenalties?.biru?.disqualified || false
          };

          return {
            ...prev,
            currentBabak: Math.min(3, (prev.currentBabak || 1) + 1),
            timerActive: false,
            timerSeconds: prev.selectedWaktu,
            accumulatedPenaltyDeductions: {
              merah: newAccumM,
              biru: newAccumB,
            },
            dewanPenalties: {
              merah: newPenM,
              biru: newPenB
            },
            scores: {
              ...prev.scores,
              merah: {
                ...prev.scores.merah,
                total: calcScoreTotal(prev.scores?.merah, prev.directPoints?.merah, newAccumM, newPenM)
              },
              biru: {
                ...prev.scores.biru,
                total: calcScoreTotal(prev.scores?.biru, prev.directPoints?.biru, newAccumB, newPenB)
              }
            }
          };
        });
      } else if (type === 'DEWAN_PENALTY' || type === 'TOGGLE_DEWAN_PENALTY') {
        const sudut = (payload.sudut || payload.corner) as 'merah' | 'biru';
        const pType = payload.penaltyType;
        if (sudut && pType) {
          setState(prev => {
            const currentPen = prev.dewanPenalties?.[sudut] || {
              binaan1: false,
              binaan2: false,
              teguran1: false,
              teguran2: false,
              peringatan1: false,
              peringatan2: false,
              disqualified: false
            };
            const updatedCornerPen = {
              ...currentPen,
              [pType]: !(currentPen as any)[pType]
            };
            const updatedDewanPenalties = {
              ...prev.dewanPenalties,
              [sudut]: updatedCornerPen
            };

            const totM = calcScoreTotal(
              prev.scores?.merah,
              prev.directPoints?.merah,
              prev.accumulatedPenaltyDeductions?.merah,
              updatedDewanPenalties.merah
            );
            const totB = calcScoreTotal(
              prev.scores?.biru,
              prev.directPoints?.biru,
              prev.accumulatedPenaltyDeductions?.biru,
              updatedDewanPenalties.biru
            );

            return {
              ...prev,
              dewanPenalties: updatedDewanPenalties,
              scores: {
                ...prev.scores,
                merah: { ...prev.scores.merah, total: totM },
                biru: { ...prev.scores.biru, total: totB }
              }
            };
          });
        }
      } else if (type === 'JURI_HIT') {
        setState(prev => {
          const hit = {
            id: String(Date.now()),
            juriId: payload.juriId,
            sudut: payload.sudut,
            aksi: payload.aksi,
            babak: prev.currentBabak,
            timestamp: Date.now(),
            isMatched: false
          };
          return {
            ...prev,
            juriHits: [...prev.juriHits, hit]
          };
        });
      } else if (type === 'DEWAN_VERIFY_TRIGGER') {
        const vType = payload.type || 'JATUHAN';
        setState(prev => ({
          ...prev,
          verification: {
            active: true,
            type: vType,
            votes: { juri1: null, juri2: null, juri3: null },
            result: null
          }
        }));
      } else if (type === 'JURI_VERIFY_VOTE') {
        const { juriId, vote } = payload;
        setState(prev => {
          if (!prev.verification?.active) return prev;
          const votes = {
            ...prev.verification.votes,
            [`juri${juriId}`]: vote
          };
          let result = prev.verification.result;
          let directPoints = { ...prev.directPoints };

          if (votes.juri1 && votes.juri2 && votes.juri3) {
            const counts = { MERAH: 0, BIRU: 0, TIDAK_SAH: 0 };
            counts[votes.juri1]++;
            counts[votes.juri2]++;
            counts[votes.juri3]++;

            let maj: 'MERAH' | 'BIRU' | 'TIDAK_SAH' = 'TIDAK_SAH';
            if (counts.MERAH >= 2) maj = 'MERAH';
            else if (counts.BIRU >= 2) maj = 'BIRU';
            result = maj;

            if (prev.verification.type === 'JATUHAN') {
              if (maj === 'MERAH') directPoints.merah = (directPoints.merah || 0) + 3;
              else if (maj === 'BIRU') directPoints.biru = (directPoints.biru || 0) + 3;
            }
          }

          const lastVerificationResult = result ? {
            type: prev.verification.type,
            result,
            votes: { ...votes },
            timestamp: Date.now(),
            atletNama: result === 'BIRU' ? prev.atletBiru?.nama : result === 'MERAH' ? prev.atletMerah?.nama : undefined,
            kontingen: result === 'BIRU' ? prev.atletBiru?.kontingen : result === 'MERAH' ? prev.atletMerah?.kontingen : undefined,
            babak: prev.currentBabak,
            partai: prev.partai
          } : prev.lastVerificationResult;

          return {
            ...prev,
            directPoints,
            lastVerificationResult,
            verification: {
              ...prev.verification,
              votes,
              result
            }
          };
        });
      } else if (type === 'DEWAN_VERIFY_RESOLVE') {
        setState(prev => ({
          ...prev,
          verification: {
            active: false,
            type: null,
            votes: { juri1: null, juri2: null, juri3: null },
            result: null
          }
        }));
      } else if (type === 'TGR_SUBMIT_JURI_SCORE') {
        const { pesertaId, juriId, score, kebenaranScore, finalize, tuningScores } = payload;
        setTgrState(prev => {
          const pesertaList = prev.pesertaList.map(p => {
            if (p.id !== pesertaId) return p;
            const newScores = { ...p.scores, [juriId]: score };
            const newKebenaran = { ...p.kebenaranScores, [juriId]: kebenaranScore };
            const newTuning = tuningScores ? { ...(p.tuningScores || {}), [juriId]: tuningScores } : p.tuningScores;
            let finalizedJuries = [...(p.finalizedJuries || [])];
            if (finalize) {
              if (!finalizedJuries.includes(juriId)) finalizedJuries.push(juriId);
            } else {
              finalizedJuries = finalizedJuries.filter(id => id !== juriId);
            }
            return {
              ...p,
              scores: newScores,
              kebenaranScores: newKebenaran,
              tuningScores: newTuning,
              finalizedJuries
            };
          });
          return { ...prev, pesertaList };
        });
      } else if (type === 'TGR_SUBMIT_JURI_CORRECTION') {
        const { juriId, pesertaId, original, requested } = payload;
        setTgrState(prev => ({
          ...prev,
          juriCorrections: {
            ...prev.juriCorrections,
            [juriId]: {
              pesertaId,
              original,
              requested,
              status: 'pending'
            }
          }
        }));
      } else if (type === 'UPDATE_MATCH_INFO' || type === 'UPDATE_EVENT_INFO') {
        setState(prev => ({
          ...prev,
          ...(payload.partai !== undefined ? { partai: payload.partai } : {}),
          ...(payload.kelas !== undefined ? { kelas: payload.kelas } : {}),
          ...(payload.gender !== undefined ? { gender: payload.gender } : {}),
          ...(payload.namaEvent !== undefined ? { namaEvent: payload.namaEvent } : {}),
          ...(payload.gelanggang !== undefined ? { gelanggang: payload.gelanggang } : {}),
        }));
      } else if (type === 'TGR_SET_PARTAI' || type === 'TGR_UPDATE_EVENT_INFO') {
        setTgrState(prev => {
          const newPartai = (payload.partai !== undefined ? payload.partai : (typeof payload === 'string' ? payload : prev.partai));
          return {
            ...prev,
            ...(newPartai ? { partai: newPartai } : {}),
            ...(payload.namaEvent ? { namaEvent: payload.namaEvent } : {}),
            ...(payload.gelanggang ? { gelanggang: payload.gelanggang } : {}),
            ...(payload.babak ? { babak: payload.babak } : {}),
            pesertaList: newPartai ? prev.pesertaList.map(p => 
              p.id === prev.activePesertaId ? { ...p, partai: newPartai } : p
            ) : prev.pesertaList
          };
        });
      }

      if (googleUserRef.current && googleSyncEnabledRef.current) {
        needsCloudPushRef.current = true;
      }

      return { success: true, offline: true };
    }
  }, [histories, pushArenaToCloud, pushConfigsToCloud]);

  return {
    state,
    histories,
    connected,
    dispatch,
    tgrState,
    currentArenaId,
    selectArena,
    arenasList,
    allArenasSummary,
    allArenasMap,
    masterData,
    setMasterData,
    reconnect,
    googleUser,
    googleSyncEnabled,
    setGoogleSyncEnabled,
    googleSyncStatus,
    googleError,
    cloudTournamentId,
    cloudBackups,
    lastCloudSyncAt,
    signInGoogle,
    signOutGoogle,
    pushAllToGoogleCloud,
    createGoogleBackup,
    restoreGoogleBackup,
    deleteGoogleBackup,
    firebaseProjectInfo: FIREBASE_PROJECT_INFO,
    driveConnected: Boolean(driveAccessToken),
    driveFolder,
    driveFiles,
    driveMainFile: driveFiles.find((f) => f.name === MAIN_DRIVE_FILE_NAME) || null,
    driveSchedulePdfFile: driveFiles.find((f) => f.name === SCHEDULE_DRIVE_PDF_NAME) || null,
    driveFinalReportPdfFile: driveFiles.find((f) => f.name === FINAL_REPORT_DRIVE_PDF_NAME) || null,
    driveStatus,
    driveError,
    lastDriveSyncAt,
    connectGoogleDrive,
    refreshGoogleDriveFiles,
    saveNewDriveSnapshot,
    createMainDriveFile,
    overwriteMainDriveFile,
    saveSchedulePdfToDrive,
    saveFinalReportPdfToDrive,
    restoreFromGoogleDriveFile,
    downloadDriveFileToLocal,
    deleteGoogleDriveFile
  };
}

