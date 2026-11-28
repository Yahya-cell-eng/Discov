/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import type { User } from 'firebase/auth';
import {
  Wifi,
  WifiOff,
  Server,
  Check,
  X,
  RefreshCw,
  Laptop,
  AlertCircle,
  Cloud,
  CloudOff,
  LogIn,
  LogOut,
  UploadCloud,
  ShieldCheck,
  HardDrive,
  Globe,
  Copy
} from 'lucide-react';
import {
  getServerBaseUrl,
  setServerBaseUrl,
  normalizeServerUrlInput,
  PRIMARY_CUSTOM_DOMAIN,
  PRIMARY_CUSTOM_ORIGIN,
  isRegisteredCustomDomain
} from '../utils/defaultClientState';
import GoogleDriveStoragePanel, { GoogleDriveStorageProps } from './GoogleDriveStoragePanel';

interface ServerConnectionModalProps extends GoogleDriveStorageProps {
  isOpen: boolean;
  onClose: () => void;
  connected: boolean;
  onReconnect: () => void;
  googleUser?: User | null;
  googleSyncEnabled?: boolean;
  onToggleGoogleSync?: (enabled: boolean) => void;
  googleSyncStatus?: 'disconnected' | 'connecting' | 'synced' | 'error';
  googleError?: string | null;
  cloudTournamentId?: string | null;
  onSignInGoogle?: () => Promise<any>;
  onSignOutGoogle?: () => Promise<void>;
  onPushAllToGoogleCloud?: () => Promise<void>;
  firebaseProjectInfo?: {
    projectId: string;
    databaseId: string;
    authDomain: string;
    hasFirestoreDatabase?: boolean;
  };
}

export default function ServerConnectionModal({
  isOpen,
  onClose,
  connected,
  onReconnect,
  googleUser = null,
  googleSyncEnabled = true,
  onToggleGoogleSync = () => {},
  googleSyncStatus = 'disconnected',
  googleError = null,
  cloudTournamentId = null,
  onSignInGoogle,
  onSignOutGoogle,
  onPushAllToGoogleCloud,
  firebaseProjectInfo,
  driveConnected = false,
  driveFolder = null,
  driveFiles = [],
  driveMainFile = null,
  driveSchedulePdfFile = null,
  driveFinalReportPdfFile = null,
  driveStatus = 'idle',
  driveError = null,
  lastDriveSyncAt = null,
  onConnectGoogleDrive,
  onRefreshDriveFiles,
  onSaveNewDriveSnapshot,
  onCreateMainDriveFile,
  onOverwriteMainDriveFile,
  onSaveSchedulePdfToDrive,
  onSaveFinalReportPdfToDrive,
  onRestoreFromDriveFile,
  onDownloadDriveFile,
  onDeleteDriveFile
}: ServerConnectionModalProps) {
  const [activeTab, setActiveTab] = useState<'google' | 'drive' | 'local'>(() =>
    firebaseProjectInfo?.hasFirestoreDatabase === false ? 'drive' : 'google'
  );
  const [serverUrl, setServerUrl] = useState<string>('');
  const [isTesting, setIsTesting] = useState<boolean>(false);
  const [testResult, setTestResult] = useState<{ success: boolean; message: string } | null>(null);
  const [googleBusy, setGoogleBusy] = useState<boolean>(false);
  const [localGoogleMsg, setLocalGoogleMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [domainCopied, setDomainCopied] = useState<boolean>(false);
  const [primaryCopied, setPrimaryCopied] = useState<boolean>(false);

  const activeOrigin = typeof window !== 'undefined' ? window.location.origin : '';
  const activeHostname = typeof window !== 'undefined' ? window.location.hostname : '';
  const isHttpsDomain = typeof window !== 'undefined' ? window.location.protocol === 'https:' : false;
  const isPrimaryCustomActive = isRegisteredCustomDomain(activeHostname);
  const isLocalHost =
    activeHostname === 'localhost' ||
    activeHostname === '127.0.0.1' ||
    activeHostname.startsWith('192.168.') ||
    activeHostname.startsWith('10.');

  const handleCopyHostname = () => {
    if (!activeHostname || typeof navigator === 'undefined' || !navigator.clipboard) return;
    navigator.clipboard.writeText(activeHostname).then(() => {
      setDomainCopied(true);
      setTimeout(() => setDomainCopied(false), 2000);
    }).catch(() => {});
  };

  const handleCopyPrimaryDomain = () => {
    if (typeof navigator === 'undefined' || !navigator.clipboard) return;
    navigator.clipboard.writeText(PRIMARY_CUSTOM_DOMAIN).then(() => {
      setPrimaryCopied(true);
      setTimeout(() => setPrimaryCopied(false), 2000);
    }).catch(() => {});
  };

  useEffect(() => {
    if (isOpen) {
      setServerUrl(getServerBaseUrl());
      setTestResult(null);
      setLocalGoogleMsg(null);
    }
  }, [isOpen]);

  const handleTestConnection = async () => {
    setIsTesting(true);
    setTestResult(null);
    try {
      const target = normalizeServerUrlInput(serverUrl);
      const testEndpoint = target ? `${target}/api/health` : '/api/health';
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 4000);

      const res = await fetch(testEndpoint, { signal: controller.signal });
      clearTimeout(timeoutId);

      if (res.ok) {
        setTestResult({
          success: true,
          message: 'Koneksi ke server berhasil (endpoint /api/health aktif)!'
        });
      } else {
        setTestResult({
          success: false,
          message: `Server merespons dengan status HTTP ${res.status}`
        });
      }
    } catch {
      setTestResult({
        success: false,
        message: 'Gagal terhubung ke server. Pastikan domain (HTTPS) atau IP & Port (3000) sudah benar dan dapat dijangkau.'
      });
    } finally {
      setIsTesting(false);
    }
  };

  const handleSave = () => {
    setServerBaseUrl(serverUrl);
    onReconnect();
    onClose();
  };

  const handleUseDefault = () => {
    setServerUrl('');
    setServerBaseUrl('');
    onReconnect();
    onClose();
  };

  const handleGoogleLoginClick = async () => {
    if (!onSignInGoogle) return;
    setGoogleBusy(true);
    setLocalGoogleMsg(null);
    try {
      await onSignInGoogle();
      setLocalGoogleMsg({ type: 'success', text: 'Berhasil masuk & terhubung ke Server Google Firestore.' });
    } catch (err: any) {
      setLocalGoogleMsg({ type: 'error', text: err?.message || 'Gagal masuk dengan akun Google.' });
    } finally {
      setGoogleBusy(false);
    }
  };

  const handleGooglePushClick = async () => {
    if (!onPushAllToGoogleCloud) return;
    setGoogleBusy(true);
    setLocalGoogleMsg(null);
    try {
      await onPushAllToGoogleCloud();
      setLocalGoogleMsg({ type: 'success', text: 'Seluruh data gelanggang & riwayat berhasil disinkronkan ke Server Google.' });
    } catch (err: any) {
      setLocalGoogleMsg({ type: 'error', text: err?.message || 'Gagal sinkronisasi ke Server Google.' });
    } finally {
      setGoogleBusy(false);
    }
  };

  const handleGoogleLogoutClick = async () => {
    if (!onSignOutGoogle) return;
    setGoogleBusy(true);
    setLocalGoogleMsg(null);
    try {
      await onSignOutGoogle();
      setLocalGoogleMsg({ type: 'success', text: 'Berhasil keluar dari akun Google.' });
    } catch (err: any) {
      setLocalGoogleMsg({ type: 'error', text: err?.message || 'Gagal keluar akun Google.' });
    } finally {
      setGoogleBusy(false);
    }
  };

  if (!isOpen) return null;

  const isGoogleConnected = Boolean(googleUser && googleSyncEnabled && googleSyncStatus === 'synced');

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          className="bg-slate-900 border border-slate-700 rounded-2xl max-w-xl w-full p-6 text-slate-100 shadow-2xl relative overflow-hidden max-h-[92vh] overflow-y-auto"
        >
          {/* Header */}
          <div className="flex items-center justify-between pb-4 mb-4 border-b border-slate-800">
            <div className="flex items-center gap-3">
              <div
                className={`p-2.5 rounded-xl border ${
                  isGoogleConnected || driveConnected || connected
                    ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30'
                    : 'bg-amber-500/20 text-amber-400 border-amber-500/30'
                }`}
              >
                {activeTab === 'google' ? (
                  <Cloud className="w-5 h-5" />
                ) : activeTab === 'drive' ? (
                  <HardDrive className="w-5 h-5" />
                ) : (
                  <Server className="w-5 h-5" />
                )}
              </div>
              <div>
                <h3 className="text-base font-bold text-white flex items-center gap-2">
                  Pengaturan Server & Sinkronisasi
                </h3>
                <p className="text-xs text-slate-400">
                  Pilih Penyimpanan Google Drive, Google Cloud Firestore, atau Server Lokal Wi-Fi
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Tab Switcher */}
          <div className="grid grid-cols-3 gap-2 p-1 rounded-xl bg-slate-950 border border-slate-800 mb-5">
            <button
              type="button"
              onClick={() => setActiveTab('google')}
              className={`py-2 px-2.5 rounded-lg text-xs font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                activeTab === 'google'
                  ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/25'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
              }`}
            >
              <Cloud className="w-4 h-4 shrink-0" />
              <span className="truncate">Google Cloud</span>
              {isGoogleConnected && <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse shrink-0" />}
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('drive')}
              className={`py-2 px-2.5 rounded-lg text-xs font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                activeTab === 'drive'
                  ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-600/25'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
              }`}
            >
              <HardDrive className="w-4 h-4 shrink-0" />
              <span className="truncate">Google Drive</span>
              {driveConnected && <span className="w-2 h-2 rounded-full bg-emerald-300 animate-pulse shrink-0" />}
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('local')}
              className={`py-2 px-2.5 rounded-lg text-xs font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                activeTab === 'local'
                  ? 'bg-amber-500 text-slate-950 shadow-lg shadow-amber-500/25'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
              }`}
            >
              <Server className="w-4 h-4 shrink-0" />
              <span className="truncate">Server Lokal</span>
              {connected && <span className="w-2 h-2 rounded-full bg-emerald-400 shrink-0" />}
            </button>
          </div>

          {/* Domain & HTTPS Readiness Bar */}
          {activeOrigin && (
            <div className="mb-4 p-3 rounded-xl bg-slate-950/80 border border-slate-800 flex flex-col gap-2 text-[11px]">
              <div className="flex items-center justify-between gap-2 flex-wrap">
                <div className="flex items-center gap-2 min-w-0">
                  <Globe className={`w-3.5 h-3.5 shrink-0 ${isHttpsDomain ? 'text-emerald-400' : 'text-amber-400'}`} />
                  <span className="font-bold text-slate-300">Domain Utama:</span>
                  <span className="font-mono text-emerald-300 font-bold">{PRIMARY_CUSTOM_DOMAIN}</span>
                  {isPrimaryCustomActive && (
                    <span className="px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 text-[9px] font-bold">
                      Aktif Sekarang
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-1.5 shrink-0">
                  <span
                    className={`px-2 py-0.5 rounded-md font-bold text-[10px] border ${
                      isHttpsDomain
                        ? 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30'
                        : 'bg-amber-500/15 text-amber-300 border-amber-500/30'
                    }`}
                  >
                    {isHttpsDomain ? 'HTTPS Siap' : 'HTTP Lokal'}
                  </span>
                  <button
                    type="button"
                    onClick={handleCopyPrimaryDomain}
                    className="px-2 py-0.5 rounded-md bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-[10px] font-semibold flex items-center gap-1 cursor-pointer"
                    title="Salin domain utama untuk Authorized Domains & OAuth"
                  >
                    {primaryCopied ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                    <span>{primaryCopied ? 'Tersalin' : `Salin ${PRIMARY_CUSTOM_DOMAIN}`}</span>
                  </button>
                </div>
              </div>
              {!isPrimaryCustomActive && activeHostname && (
                <div className="flex items-center justify-between gap-2 text-[10px] text-slate-400">
                  <span className="truncate">
                    Host pratinjau aktif: <span className="font-mono text-cyan-300">{activeHostname}</span>
                  </span>
                  <button
                    type="button"
                    onClick={handleCopyHostname}
                    className="px-1.5 py-0.5 rounded bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-700 text-[10px] flex items-center gap-1 shrink-0 cursor-pointer"
                  >
                    {domainCopied ? <Check className="w-2.5 h-2.5 text-emerald-400" /> : <Copy className="w-2.5 h-2.5" />}
                    <span>{domainCopied ? 'Tersalin' : 'Salin Host'}</span>
                  </button>
                </div>
              )}
              {!isLocalHost && (
                <p className="text-[10px] text-slate-400 leading-snug">
                  Pastikan <span className="font-mono text-slate-300">{PRIMARY_CUSTOM_DOMAIN}</span>
                  {!isPrimaryCustomActive && activeHostname ? (
                    <> dan <span className="font-mono text-slate-300">{activeHostname}</span></>
                  ) : null}{' '}
                  terdaftar di <strong className="text-slate-300">Firebase Authentication → Authorized domains</strong> &{' '}
                  <strong className="text-slate-300">Google Cloud OAuth Authorized JavaScript origins</strong> untuk login Google Drive.
                </p>
              )}
            </div>
          )}

          {/* TAB 1: SERVER GOOGLE CLOUD (FIREBASE FIRESTORE) */}
          {activeTab === 'google' && (
            <div className="space-y-4">
              {/* Google Cloud Status Banner */}
              <div
                className={`p-3.5 rounded-xl border flex items-center justify-between text-xs ${
                  googleSyncStatus === 'synced'
                    ? 'bg-emerald-950/40 border-emerald-500/40 text-emerald-300'
                    : googleSyncStatus === 'connecting'
                    ? 'bg-blue-950/40 border-blue-500/40 text-blue-300'
                    : googleSyncStatus === 'error'
                    ? 'bg-red-950/40 border-red-500/40 text-red-300'
                    : 'bg-slate-950/70 border-slate-700 text-slate-300'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  {googleSyncStatus === 'synced' ? (
                    <Cloud className="w-4 h-4 text-emerald-400 shrink-0" />
                  ) : googleSyncStatus === 'connecting' ? (
                    <RefreshCw className="w-4 h-4 text-blue-400 animate-spin shrink-0" />
                  ) : (
                    <CloudOff className="w-4 h-4 text-slate-400 shrink-0" />
                  )}
                  <div>
                    <span className="font-bold">
                      {googleSyncStatus === 'synced'
                        ? 'Server Google Aktif & Tersinkronisasi'
                        : googleSyncStatus === 'connecting'
                        ? 'Menghubungkan ke Google Cloud Firestore...'
                        : googleSyncStatus === 'error'
                        ? 'Terjadi Kendala Sinkronisasi Google'
                        : 'Server Google Belum Aktif'}
                    </span>
                    <p className="text-[11px] opacity-80 mt-0.5">
                      {googleUser
                        ? 'Data skor, babak, penalti, dan riwayat pertandingan otomatis tersimpan ke Google Cloud Firestore.'
                        : 'Masuk dengan akun Google Anda untuk mengaktifkan database cloud real-time antar perangkat.'}
                    </p>
                  </div>
                </div>
              </div>

              {/* Firebase Project Info */}
              {firebaseProjectInfo && (
                <div className="p-3 rounded-xl bg-slate-950/70 border border-slate-800 text-[11px] font-mono space-y-1 text-slate-400">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-slate-500">PROJECT ID:</span>
                    <span className="text-slate-200 truncate">{firebaseProjectInfo.projectId}</span>
                  </div>
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-slate-500">FIRESTORE DB:</span>
                    <span className="text-cyan-300 truncate">
                      {firebaseProjectInfo.hasFirestoreDatabase === false ? 'Tidak Aktif (Mode OAuth Drive)' : firebaseProjectInfo.databaseId}
                    </span>
                  </div>
                  {cloudTournamentId && (
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-slate-500">TOURNAMENT ID:</span>
                      <span className="text-emerald-300 truncate">{cloudTournamentId}</span>
                    </div>
                  )}
                </div>
              )}

              {firebaseProjectInfo?.hasFirestoreDatabase === false && (
                <div className="p-3.5 rounded-xl bg-emerald-950/40 border border-emerald-500/40 text-xs text-emerald-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div>
                    <div className="font-bold text-emerald-300">Penyimpanan Google Drive Aktif untuk Proyek Ini</div>
                    <p className="text-[11px] text-emerald-200/80 mt-0.5">
                      Database Firestore tidak dikonfigurasi pada proyek OAuth ini. Gunakan tab Google Drive untuk menyimpan & memulihkan data turnamen.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setActiveTab('drive')}
                    className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold shrink-0 cursor-pointer"
                  >
                    Buka Google Drive
                  </button>
                </div>
              )}

              {/* Account Area */}
              {!googleUser ? (
                <div className="p-5 rounded-xl bg-slate-950/80 border border-slate-800 text-center space-y-3">
                  <div className="w-11 h-11 rounded-full bg-blue-500/15 border border-blue-500/30 flex items-center justify-center mx-auto text-blue-400">
                    <ShieldCheck className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-white">Gunakan Server Google Firebase</h4>
                    <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                      Semua tablet juri, dewan, sekretaris, dan layar monitor yang masuk dengan akun yang sama akan langsung tersinkronisasi melalui server Google tanpa perlu mengatur alamat IP LAN.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={handleGoogleLoginClick}
                    disabled={googleBusy}
                    className="w-full py-2.5 px-4 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold flex items-center justify-center gap-2 transition-all shadow-lg shadow-blue-600/25 cursor-pointer disabled:opacity-50"
                  >
                    {googleBusy ? <RefreshCw className="w-4 h-4 animate-spin" /> : <LogIn className="w-4 h-4" />}
                    <span>Masuk dengan Google & Aktifkan Server Google</span>
                  </button>
                </div>
              ) : (
                <div className="space-y-3">
                  {/* Signed-in User Card */}
                  <div className="p-3.5 rounded-xl bg-slate-950/80 border border-slate-800 flex items-center justify-between gap-3">
                    <div className="flex items-center gap-3 min-w-0">
                      {googleUser.photoURL ? (
                        <img
                          src={googleUser.photoURL}
                          alt={googleUser.displayName || 'Google User'}
                          referrerPolicy="no-referrer"
                          className="w-10 h-10 rounded-full border border-slate-700 object-cover shrink-0"
                        />
                      ) : (
                        <div className="w-10 h-10 rounded-full bg-blue-600/30 border border-blue-500/40 flex items-center justify-center text-sm font-bold text-blue-300 shrink-0">
                          {(googleUser.displayName || googleUser.email || 'G')[0].toUpperCase()}
                        </div>
                      )}
                      <div className="min-w-0">
                        <div className="text-xs font-bold text-white truncate flex items-center gap-1.5">
                          <span>{googleUser.displayName || 'Ofisial Pencak Silat'}</span>
                          <Check className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                        </div>
                        <div className="text-[11px] text-slate-400 truncate">{googleUser.email}</div>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={handleGoogleLogoutClick}
                      disabled={googleBusy}
                      className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-red-950/70 hover:text-red-300 hover:border-red-500/40 border border-slate-700 text-xs font-semibold text-slate-300 flex items-center gap-1.5 transition-colors cursor-pointer shrink-0 disabled:opacity-50"
                    >
                      <LogOut className="w-3.5 h-3.5" />
                      <span>Keluar</span>
                    </button>
                  </div>

                  {/* Auto-Sync Toggle */}
                  <div className="p-3.5 rounded-xl bg-slate-950/60 border border-slate-800 flex items-center justify-between gap-3">
                    <div>
                      <div className="text-xs font-bold text-slate-200">Sinkronisasi Real-Time Otomatis</div>
                      <div className="text-[11px] text-slate-400">
                        Kirim & terima pembaruan skor langsung dari Server Google Firestore
                      </div>
                    </div>
                    <button
                      type="button"
                      role="switch"
                      aria-checked={googleSyncEnabled}
                      onClick={() => onToggleGoogleSync(!googleSyncEnabled)}
                      className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ${
                        googleSyncEnabled ? 'bg-emerald-500' : 'bg-slate-700'
                      }`}
                    >
                      <span
                        className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow transition duration-200 ${
                          googleSyncEnabled ? 'translate-x-5' : 'translate-x-0'
                        }`}
                      />
                    </button>
                  </div>

                  {/* Manual Push Button */}
                  <button
                    type="button"
                    onClick={handleGooglePushClick}
                    disabled={googleBusy || !googleSyncEnabled || firebaseProjectInfo?.hasFirestoreDatabase === false}
                    className="w-full py-2.5 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold flex items-center justify-center gap-2 transition-all shadow-lg shadow-emerald-600/20 cursor-pointer disabled:opacity-50"
                  >
                    {googleBusy ? <RefreshCw className="w-4 h-4 animate-spin" /> : <UploadCloud className="w-4 h-4" />}
                    <span>Sinkronkan Semua Data ke Server Google Sekarang</span>
                  </button>
                </div>
              )}

              {(localGoogleMsg || googleError) && (
                <div
                  className={`p-3 rounded-xl text-xs flex items-start gap-2 border ${
                    localGoogleMsg?.type === 'success' && !googleError
                      ? 'bg-emerald-950/50 text-emerald-300 border-emerald-700/50'
                      : 'bg-red-950/50 text-red-300 border-red-700/50'
                  }`}
                >
                  {localGoogleMsg?.type === 'success' && !googleError ? (
                    <Check className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                  ) : (
                    <AlertCircle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
                  )}
                  <span className="break-words">{googleError || localGoogleMsg?.text}</span>
                </div>
              )}

              <div className="flex items-center justify-end pt-2 border-t border-slate-800">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold transition-colors cursor-pointer"
                >
                  Tutup
                </button>
              </div>
            </div>
          )}

          {/* TAB 2: PENYIMPANAN GOOGLE DRIVE */}
          {activeTab === 'drive' && (
            <div className="space-y-4">
              <GoogleDriveStoragePanel
                googleUser={googleUser}
                driveConnected={driveConnected}
                driveFolder={driveFolder}
                driveFiles={driveFiles}
                driveMainFile={driveMainFile}
                driveSchedulePdfFile={driveSchedulePdfFile}
                driveFinalReportPdfFile={driveFinalReportPdfFile}
                driveStatus={driveStatus}
                driveError={driveError}
                lastDriveSyncAt={lastDriveSyncAt}
                onConnectGoogleDrive={onConnectGoogleDrive}
                onRefreshDriveFiles={onRefreshDriveFiles}
                onSaveNewDriveSnapshot={onSaveNewDriveSnapshot}
                onCreateMainDriveFile={onCreateMainDriveFile}
                onOverwriteMainDriveFile={onOverwriteMainDriveFile}
                onSaveSchedulePdfToDrive={onSaveSchedulePdfToDrive}
                onSaveFinalReportPdfToDrive={onSaveFinalReportPdfToDrive}
                onRestoreFromDriveFile={onRestoreFromDriveFile}
                onDownloadDriveFile={onDownloadDriveFile}
                onDeleteDriveFile={onDeleteDriveFile}
                compact
              />
              <div className="flex items-center justify-end pt-2 border-t border-slate-800">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold transition-colors cursor-pointer"
                >
                  Tutup
                </button>
              </div>
            </div>
          )}

          {/* TAB 3: SERVER LOKAL LAN */}
          {activeTab === 'local' && (
            <div>
              {/* Status Banner */}
              <div
                className={`p-3.5 rounded-xl mb-4 border flex items-center justify-between text-xs ${
                  connected
                    ? 'bg-emerald-950/40 border-emerald-500/40 text-emerald-300'
                    : 'bg-amber-950/40 border-amber-500/40 text-amber-300'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  {connected ? (
                    <Wifi className="w-4 h-4 text-emerald-400 shrink-0" />
                  ) : (
                    <WifiOff className="w-4 h-4 text-amber-400 shrink-0" />
                  )}
                  <div>
                    <span className="font-bold">
                      {connected ? 'Status Lokal: Terhubung ke Server LAN' : 'Status Lokal: Offline / Mode Mandiri'}
                    </span>
                    <p className="text-[11px] opacity-80 mt-0.5">
                      {connected
                        ? 'Sinkronisasi real-time multi-juri & dewan aktif melalui server lokal.'
                        : 'Aplikasi beroperasi dalam mode offline mandiri atau sedang mencari server LAN.'}
                    </p>
                  </div>
                </div>
              </div>

              {/* Input IP */}
              <div className="space-y-3 mb-5">
                <div className="flex items-center justify-between gap-2">
                  <label className="block text-xs font-semibold text-slate-300">
                    Alamat Domain HTTPS atau IP Server Laptop
                  </label>
                  <button
                    type="button"
                    onClick={() => setServerUrl(PRIMARY_CUSTOM_ORIGIN)}
                    className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-emerald-500/15 text-emerald-300 border border-emerald-500/30 hover:bg-emerald-500/25 transition-colors cursor-pointer"
                  >
                    Pakai {PRIMARY_CUSTOM_DOMAIN}
                  </button>
                </div>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={serverUrl}
                    onChange={(e) => setServerUrl(e.target.value)}
                    placeholder={`Contoh: ${PRIMARY_CUSTOM_ORIGIN} atau http://192.168.1.100:3000`}
                    className="flex-1 bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-500 font-mono"
                  />
                  <button
                    type="button"
                    onClick={handleTestConnection}
                    disabled={isTesting}
                    className="px-3.5 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold rounded-xl border border-slate-600 transition-all flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                  >
                    <RefreshCw className={`w-3.5 h-3.5 ${isTesting ? 'animate-spin' : ''}`} />
                    <span>Tes</span>
                  </button>
                </div>

                {testResult && (
                  <div
                    className={`p-2.5 rounded-lg text-xs flex items-start gap-2 ${
                      testResult.success
                        ? 'bg-emerald-950/50 text-emerald-300 border border-emerald-700/50'
                        : 'bg-red-950/50 text-red-300 border border-red-700/50'
                    }`}
                  >
                    {testResult.success ? (
                      <Check className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                    ) : (
                      <AlertCircle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
                    )}
                    <span>{testResult.message}</span>
                  </div>
                )}

                <div className="bg-slate-950/60 p-3 rounded-xl border border-slate-800 text-[11px] text-slate-400 space-y-1.5 leading-relaxed">
                  <div className="flex items-center gap-1.5 text-slate-300 font-semibold">
                    <Laptop className="w-3.5 h-3.5 text-blue-400" />
                    <span>Petunjuk Penggunaan APK di Tablet / HP Juri (LAN Wi-Fi):</span>
                  </div>
                  <p>1. Hubungkan tablet/HP ke jaringan Wi-Fi atau hotspot yang sama dengan laptop server.</p>
                  <p>2. Masukkan alamat IP laptop server (misal: <code>http://192.168.43.1:3000</code>).</p>
                  <p>3. Klik <strong>Tes Sambungan</strong>, lalu simpan. Aplikasi APK akan otomatis tersinkronisasi.</p>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center justify-between pt-2 border-t border-slate-800">
                <button
                  type="button"
                  onClick={handleUseDefault}
                  className="text-xs text-slate-400 hover:text-slate-200 hover:underline cursor-pointer"
                >
                  Reset ke Otomatis
                </button>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={onClose}
                    className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold transition-colors cursor-pointer"
                  >
                    Tutup
                  </button>
                  <button
                    type="button"
                    onClick={handleSave}
                    className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-bold transition-all shadow-lg shadow-amber-500/20 cursor-pointer"
                  >
                    Simpan & Sambungkan
                  </button>
                </div>
              </div>
            </div>
          )}
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
