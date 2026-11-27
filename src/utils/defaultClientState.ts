/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { MatchState, TGRState, GelanggangInfo } from '../types';

export const SERVER_HOST_STORAGE_KEY = 'silat_server_host_url';

/**
 * Normalize a host/domain/IP string into a full HTTP/HTTPS origin.
 * Localhost, private LAN IPs, and explicit port hosts default to http://;
 * public custom domains default to https:// (or current browser protocol).
 */
export function normalizeServerUrlInput(raw: string): string {
  const cleaned = (raw || '').trim().replace(/\/+$/, '');
  if (!cleaned) return '';
  if (cleaned.startsWith('http://') || cleaned.startsWith('https://')) {
    return cleaned;
  }
  const lower = cleaned.toLowerCase();
  const isLocalHost =
    lower.startsWith('localhost') ||
    lower.startsWith('127.') ||
    lower.startsWith('192.168.') ||
    lower.startsWith('10.') ||
    /^172\.(1[6-9]|2\d|3[0-1])\./.test(lower) ||
    /:\d+($|\/)/.test(lower);

  if (isLocalHost) {
    return `http://${cleaned}`;
  }
  const defaultProtocol =
    typeof window !== 'undefined' && window.location.protocol === 'http:' ? 'http://' : 'https://';
  return `${defaultProtocol}${cleaned}`;
}

/**
 * Return the active public origin (either explicit custom server or current browser domain).
 */
export function getPublicAppOrigin(): string {
  const configured = getServerBaseUrl();
  if (configured) return configured;
  if (typeof window !== 'undefined' && window.location.origin && window.location.origin !== 'null') {
    return window.location.origin;
  }
  return '';
}

/**
 * Get the server base URL for network calls.
 * Allows Android APK / WebView to connect to a specific server IP or custom domain
 */
export function getServerBaseUrl(): string {
  if (typeof window === 'undefined') return '';

  // 1. Check URL query parameter (e.g., ?server=https://silat.domainanda.com)
  try {
    const params = new URLSearchParams(window.location.search);
    const serverParam = params.get('server');
    if (serverParam) {
      return normalizeServerUrlInput(serverParam);
    }
  } catch {
    // Ignore URL parse error
  }

  // 2. Check localStorage custom server IP / domain
  try {
    const saved = localStorage.getItem(SERVER_HOST_STORAGE_KEY);
    if (saved && saved.trim()) {
      return normalizeServerUrlInput(saved);
    }
  } catch {
    // localStorage might fail in restricted file:// WebViews
  }

  // 3. If running inside an APK via file:// or capacitor:// or without HTTP host
  try {
    if (window.location.protocol === 'file:' || window.location.origin === 'null' || window.location.hostname === '') {
      return 'http://localhost:3000';
    }
  } catch {
    // ignore
  }

  // Default: relative path for standard web and custom domain reverse-proxy
  return '';
}

/**
 * Persist server base URL in localStorage
 */
export function setServerBaseUrl(url: string): void {
  if (typeof window === 'undefined') return;
  try {
    const formatted = normalizeServerUrlInput(url);
    if (!formatted) {
      localStorage.removeItem(SERVER_HOST_STORAGE_KEY);
    } else {
      localStorage.setItem(SERVER_HOST_STORAGE_KEY, formatted);
    }
  } catch (err) {
    console.warn('Failed to save server URL to localStorage:', err);
  }
}

/**
 * Format relative API paths with configured server host for APK/WebView environments
 */
export function apiUrl(path: string): string {
  const base = getServerBaseUrl();
  if (base && path.startsWith('/')) {
    return `${base}${path}`;
  }
  return path;
}

/**
 * Safe fetch wrapper that automatically prefixes API base URL
 */
export function apiFetch(input: RequestInfo | URL, init?: RequestInit): Promise<Response> {
  if (typeof input === 'string' && input.startsWith('/api/')) {
    const base = getServerBaseUrl();
    if (base) {
      return fetch(`${base}${input}`, init);
    }
  }
  return fetch(input, init);
}
export function createDefaultMatchState(gelanggangName: string = "GELANGGANG A"): MatchState {
  return {
    namaEvent: "PENCAK SILAT",
    gelanggang: gelanggangName,
    partai: "01",
    kelas: "TANDING KELAS",
    gender: "Putra",
    atletMerah: { nama: "", kontingen: "" },
    atletBiru: { nama: "", kontingen: "" },
    selectedWaktu: 120,
    timerActive: false,
    timerSeconds: 120,
    currentBabak: 1,
    matchStatus: "idle",
    logoKanan: null,
    logoKiri: null,
    logoTengah: null,
    juriHits: [],
    scores: {
      merah: { babak1: 0, babak2: 0, babak3: 0, total: 0 },
      biru: { babak1: 0, babak2: 0, babak3: 0, total: 0 }
    },
    dewanPenalties: {
      merah: { binaan1: false, binaan2: false, teguran1: false, teguran2: false, peringatan1: false, peringatan2: false, disqualified: false },
      biru: { binaan1: false, binaan2: false, teguran1: false, teguran2: false, peringatan1: false, peringatan2: false, disqualified: false }
    },
    accumulatedPenaltyDeductions: { merah: 0, biru: 0 },
    directPoints: { merah: 0, biru: 0 },
    verification: {
      active: false,
      type: null,
      votes: { juri1: null, juri2: null, juri3: null },
      result: null
    },
    lastValidScore: null,
    winner: null,
    juryPenaltyAccess: true,
    baganCategories: []
  };
}

/**
 * Default fallback TGRState for offline APK operation
 */
export function createDefaultTGRState(gelanggangName: string = "Gelanggang 1"): TGRState {
  return {
    namaEvent: "Kejuaraan Pencak Silat Nasional",
    gelanggang: gelanggangName,
    partai: "01",
    babak: "Penyisihan",
    sistemSeni: 'pool',
    activePesertaId: null,
    pesertaList: [],
    jumlahJuri: 5,
    sessionStatus: 'open',
    timerActive: false,
    timerSeconds: 180,
    selectedWaktu: 180,
    auditLogs: [],
    juriCorrections: {},
    logoKanan: null,
    logoKiri: null,
    logoTengah: null
  };
}

export const defaultArenasList: GelanggangInfo[] = [
  { id: 'arena_1', nama: 'Gelanggang 1', kode: '1', keterangan: 'Matras 1 - Arena Utama A', modeAktif: 'tanding', status: 'aktif' },
  { id: 'arena_2', nama: 'Gelanggang 2', kode: '2', keterangan: 'Matras 2 - Arena B', modeAktif: 'tanding', status: 'aktif' },
  { id: 'arena_3', nama: 'Gelanggang 3', kode: '3', keterangan: 'Matras 3 - Arena Seni C', modeAktif: 'seni', status: 'aktif' }
];
