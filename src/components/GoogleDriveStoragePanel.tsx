/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import type { User } from 'firebase/auth';
import {
  HardDrive,
  FolderOpen,
  RefreshCw,
  UploadCloud,
  Download,
  Trash2,
  RotateCcw,
  ExternalLink,
  CheckCircle2,
  AlertTriangle,
  FileJson,
  FileText,
  Calendar,
  Award,
  Save,
  ShieldAlert,
  X
} from 'lucide-react';
import {
  DriveFolderInfo,
  DriveStorageFile,
  MAIN_DRIVE_FILE_NAME,
  SCHEDULE_DRIVE_PDF_NAME,
  FINAL_REPORT_DRIVE_PDF_NAME,
  formatDriveBytes
} from '../services/googleDriveService';

export interface GoogleDriveStorageProps {
  googleUser?: User | null;
  driveConnected?: boolean;
  driveFolder?: DriveFolderInfo | null;
  driveFiles?: DriveStorageFile[];
  driveMainFile?: DriveStorageFile | null;
  driveSchedulePdfFile?: DriveStorageFile | null;
  driveFinalReportPdfFile?: DriveStorageFile | null;
  driveStatus?: 'idle' | 'loading' | 'ready' | 'error';
  driveError?: string | null;
  lastDriveSyncAt?: string | null;
  onConnectGoogleDrive?: () => Promise<any>;
  onRefreshDriveFiles?: () => Promise<any>;
  onSaveNewDriveSnapshot?: (label?: string) => Promise<any>;
  onCreateMainDriveFile?: () => Promise<any>;
  onOverwriteMainDriveFile?: (fileId: string) => Promise<any>;
  onSaveSchedulePdfToDrive?: (overwriteFileId?: string, asTimestampedCopy?: boolean) => Promise<any>;
  onSaveFinalReportPdfToDrive?: (overwriteFileId?: string, asTimestampedCopy?: boolean) => Promise<any>;
  onRestoreFromDriveFile?: (fileId: string) => Promise<void>;
  onDownloadDriveFile?: (fileId: string, fileName: string, mimeType?: string) => Promise<void>;
  onDeleteDriveFile?: (fileId: string) => Promise<void>;
  compact?: boolean;
}

type ConfirmActionState =
  | { type: 'overwrite_main'; file: DriveStorageFile }
  | { type: 'overwrite_schedule_pdf'; file: DriveStorageFile }
  | { type: 'overwrite_report_pdf'; file: DriveStorageFile }
  | { type: 'restore_file'; file: DriveStorageFile }
  | { type: 'delete_file'; file: DriveStorageFile }
  | null;

export default function GoogleDriveStoragePanel({
  googleUser = null,
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
  onDeleteDriveFile,
  compact = false
}: GoogleDriveStorageProps) {
  const [snapshotLabel, setSnapshotLabel] = useState<string>('');
  const [busyAction, setBusyAction] = useState<boolean>(false);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [confirmAction, setConfirmAction] = useState<ConfirmActionState>(null);

  const handleConnect = async () => {
    if (!onConnectGoogleDrive) return;
    setBusyAction(true);
    setFeedback(null);
    try {
      await onConnectGoogleDrive();
      setFeedback({ type: 'success', text: 'Google Drive berhasil terhubung ke folder penyimpanan turnamen.' });
    } catch (err: any) {
      setFeedback({ type: 'error', text: err?.message || 'Gagal menghubungkan Google Drive.' });
    } finally {
      setBusyAction(false);
    }
  };

  const handleRefresh = async () => {
    if (!onRefreshDriveFiles) return;
    setBusyAction(true);
    setFeedback(null);
    try {
      await onRefreshDriveFiles();
      setFeedback({ type: 'success', text: 'Daftar berkas Google Drive diperbarui.' });
    } catch (err: any) {
      setFeedback({ type: 'error', text: err?.message || 'Gagal memuat daftar berkas Google Drive.' });
    } finally {
      setBusyAction(false);
    }
  };

  const handleSaveSnapshot = async () => {
    if (!onSaveNewDriveSnapshot) return;
    setBusyAction(true);
    setFeedback(null);
    try {
      const uploaded = await onSaveNewDriveSnapshot(snapshotLabel.trim() || undefined);
      setSnapshotLabel('');
      setFeedback({
        type: 'success',
        text: `Snapshot "${uploaded?.name || 'baru'}" berhasil disimpan ke Google Drive!`
      });
    } catch (err: any) {
      setFeedback({ type: 'error', text: err?.message || 'Gagal menyimpan snapshot ke Google Drive.' });
    } finally {
      setBusyAction(false);
    }
  };

  const handleMainSyncClick = async () => {
    if (driveMainFile) {
      // Explicit user confirmation required before overwriting/updating existing Drive file
      setConfirmAction({ type: 'overwrite_main', file: driveMainFile });
      return;
    }
    if (!onCreateMainDriveFile) return;
    setBusyAction(true);
    setFeedback(null);
    try {
      const created = await onCreateMainDriveFile();
      setFeedback({
        type: 'success',
        text: `File utama "${created?.name || MAIN_DRIVE_FILE_NAME}" berhasil dibuat di Google Drive!`
      });
    } catch (err: any) {
      setFeedback({ type: 'error', text: err?.message || 'Gagal membuat file utama di Google Drive.' });
    } finally {
      setBusyAction(false);
    }
  };

  const handleSchedulePdfClick = async (asTimestampedCopy = false) => {
    if (!onSaveSchedulePdfToDrive) return;
    if (!asTimestampedCopy && driveSchedulePdfFile) {
      // Explicit confirmation required before updating/overwriting existing PDF file
      setConfirmAction({ type: 'overwrite_schedule_pdf', file: driveSchedulePdfFile });
      return;
    }
    setBusyAction(true);
    setFeedback(null);
    try {
      const created = await onSaveSchedulePdfToDrive(undefined, asTimestampedCopy);
      setFeedback({
        type: 'success',
        text: `Jadwal Pertandingan PDF ("${created?.name || SCHEDULE_DRIVE_PDF_NAME}") berhasil disimpan ke Google Drive!`
      });
    } catch (err: any) {
      setFeedback({ type: 'error', text: err?.message || 'Gagal menyimpan PDF Jadwal ke Google Drive.' });
    } finally {
      setBusyAction(false);
    }
  };

  const handleFinalReportPdfClick = async (asTimestampedCopy = false) => {
    if (!onSaveFinalReportPdfToDrive) return;
    if (!asTimestampedCopy && driveFinalReportPdfFile) {
      // Explicit confirmation required before updating/overwriting existing PDF file
      setConfirmAction({ type: 'overwrite_report_pdf', file: driveFinalReportPdfFile });
      return;
    }
    setBusyAction(true);
    setFeedback(null);
    try {
      const created = await onSaveFinalReportPdfToDrive(undefined, asTimestampedCopy);
      setFeedback({
        type: 'success',
        text: `Laporan Akhir PDF ("${created?.name || FINAL_REPORT_DRIVE_PDF_NAME}") berhasil disimpan ke Google Drive!`
      });
    } catch (err: any) {
      setFeedback({ type: 'error', text: err?.message || 'Gagal menyimpan PDF Laporan Akhir ke Google Drive.' });
    } finally {
      setBusyAction(false);
    }
  };

  const executeConfirmedAction = async () => {
    if (!confirmAction) return;
    const action = confirmAction;
    setConfirmAction(null);
    setBusyAction(true);
    setFeedback(null);

    try {
      if (action.type === 'overwrite_main' && onOverwriteMainDriveFile) {
        await onOverwriteMainDriveFile(action.file.id);
        setFeedback({
          type: 'success',
          text: `File "${action.file.name}" di Google Drive berhasil diperbarui dengan data terbaru.`
        });
      } else if (action.type === 'overwrite_schedule_pdf' && onSaveSchedulePdfToDrive) {
        await onSaveSchedulePdfToDrive(action.file.id, false);
        setFeedback({
          type: 'success',
          text: `Jadwal Pertandingan PDF ("${action.file.name}") di Google Drive berhasil diperbarui.`
        });
      } else if (action.type === 'overwrite_report_pdf' && onSaveFinalReportPdfToDrive) {
        await onSaveFinalReportPdfToDrive(action.file.id, false);
        setFeedback({
          type: 'success',
          text: `Laporan Akhir Turnamen PDF ("${action.file.name}") di Google Drive berhasil diperbarui.`
        });
      } else if (action.type === 'restore_file' && onRestoreFromDriveFile) {
        await onRestoreFromDriveFile(action.file.id);
        setFeedback({
          type: 'success',
          text: `Seluruh data berhasil dipulihkan dari Google Drive ("${action.file.name}").`
        });
      } else if (action.type === 'delete_file' && onDeleteDriveFile) {
        await onDeleteDriveFile(action.file.id);
        setFeedback({
          type: 'success',
          text: `Berkas "${action.file.name}" telah dihapus dari Google Drive.`
        });
      }
    } catch (err: any) {
      setFeedback({ type: 'error', text: err?.message || 'Operasi Google Drive gagal dijalankan.' });
    } finally {
      setBusyAction(false);
    }
  };

  const handleDownload = async (file: DriveStorageFile) => {
    if (!onDownloadDriveFile) return;
    setBusyAction(true);
    setFeedback(null);
    try {
      await onDownloadDriveFile(file.id, file.name, file.mimeType);
    } catch (err: any) {
      setFeedback({ type: 'error', text: err?.message || 'Gagal mengunduh file dari Google Drive.' });
    } finally {
      setBusyAction(false);
    }
  };

  const isPdfFile = (file: DriveStorageFile) =>
    file.mimeType === 'application/pdf' || file.name.toLowerCase().endsWith('.pdf');

  return (
    <div className="bg-gradient-to-br from-slate-900 via-slate-900/95 to-emerald-950/30 border border-emerald-500/40 rounded-2xl p-5 sm:p-6 shadow-xl relative overflow-hidden space-y-4">
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 rounded-xl bg-emerald-500/15 border border-emerald-500/40 flex items-center justify-center text-emerald-400 shrink-0">
            <HardDrive className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-base sm:text-lg font-bold text-white flex flex-wrap items-center gap-2">
              <span>Penyimpanan Google Drive</span>
              {driveConnected ? (
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 uppercase tracking-wide flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                  Terhubung ke Drive
                </span>
              ) : (
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-slate-800 text-slate-300 border border-slate-700 uppercase">
                  Perlu Izin Akses Drive
                </span>
              )}
            </h3>
            <p className="text-xs text-slate-300 mt-0.5">
              Simpan arsip lengkap database kejuaraan (JSON) serta dokumen resmi <strong>Jadwal Pertandingan (PDF)</strong> dan <strong>Laporan Akhir Turnamen (PDF)</strong> langsung ke Google Drive Anda.
            </p>
          </div>
        </div>

        {driveConnected && (
          <div className="flex flex-wrap items-center gap-2 shrink-0">
            {driveFolder?.webViewLink && (
              <a
                href={driveFolder.webViewLink}
                target="_blank"
                rel="noopener noreferrer"
                className="px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-emerald-300 border border-emerald-500/30 text-xs font-bold flex items-center gap-1.5 transition-colors"
              >
                <FolderOpen className="w-3.5 h-3.5" />
                <span>Buka Folder Drive</span>
                <ExternalLink className="w-3 h-3" />
              </a>
            )}
            <button
              type="button"
              onClick={handleRefresh}
              disabled={busyAction || driveStatus === 'loading'}
              className="px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer disabled:opacity-50"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${driveStatus === 'loading' ? 'animate-spin' : ''}`} />
              <span>Segarkan</span>
            </button>
          </div>
        )}
      </div>

      {/* Auth Gate: Official Sign in with Google button when Drive token is not available */}
      {!driveConnected ? (
        <div className="p-5 rounded-xl bg-slate-950/80 border border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="text-xs font-bold text-white">
              {googleUser
                ? `Akun ${googleUser.email || googleUser.displayName} perlu memberikan izin penyimpanan Google Drive untuk sesi ini`
                : 'Masuk dengan akun Google untuk menghubungkan penyimpanan Google Drive'}
            </div>
            <p className="text-[11px] text-slate-400">
              Aplikasi hanya mengakses folder dan berkas khusus kejuaraan (database, jadwal PDF & laporan akhir PDF) yang dibuat oleh aplikasi ini di Google Drive Anda.
            </p>
          </div>

          <button
            type="button"
            onClick={handleConnect}
            disabled={busyAction}
            className="gsi-material-button inline-flex items-center gap-3 px-4 py-2.5 rounded-xl bg-white hover:bg-slate-100 text-slate-900 font-semibold text-xs shadow-lg border border-slate-300 transition-all cursor-pointer disabled:opacity-50 shrink-0"
          >
            <div className="w-5 h-5 shrink-0">
              <svg version="1.1" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48" style={{ display: 'block' }}>
                <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z" />
                <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z" />
                <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z" />
                <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z" />
                <path fill="none" d="M0 0h48v48H0z" />
              </svg>
            </div>
            <span>{busyAction ? 'Menghubungkan...' : 'Sign in with Google'}</span>
          </button>
        </div>
      ) : (
        <>
          {/* Folder & Sync Status Grid */}
          <div className={`grid grid-cols-1 ${compact ? 'sm:grid-cols-2' : 'sm:grid-cols-3'} gap-3 text-xs`}>
            <div className="bg-slate-950/70 p-3 rounded-xl border border-slate-800/80">
              <span className="text-[11px] text-slate-400 block">Folder Google Drive</span>
              <span className="text-xs font-bold text-emerald-300 truncate block mt-1">
                {driveFolder?.name || 'Skoring Pencak Silat - Storage'}
              </span>
            </div>
            <div className="bg-slate-950/70 p-3 rounded-xl border border-slate-800/80">
              <span className="text-[11px] text-slate-400 block">Jumlah Berkas Arsip</span>
              <span className="text-xs font-bold text-white block mt-1 font-mono">
                {driveFiles.length} file (JSON & PDF)
              </span>
            </div>
            {!compact && (
              <div className="bg-slate-950/70 p-3 rounded-xl border border-slate-800/80">
                <span className="text-[11px] text-slate-400 block">Sinkronisasi Drive Terakhir</span>
                <span className="text-xs font-bold text-cyan-300 block mt-1 font-mono">
                  {lastDriveSyncAt
                    ? new Date(lastDriveSyncAt).toLocaleTimeString('id-ID', {
                        hour: '2-digit',
                        minute: '2-digit',
                        second: '2-digit'
                      }) + ' WIB'
                    : driveMainFile?.modifiedTime
                    ? new Date(driveMainFile.modifiedTime).toLocaleTimeString('id-ID', {
                        hour: '2-digit',
                        minute: '2-digit'
                      }) + ' WIB'
                    : '-'}
                </span>
              </div>
            )}
          </div>

          {/* Primary Database Sync & New Snapshot Controls */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5">
            <button
              type="button"
              onClick={handleMainSyncClick}
              disabled={busyAction || driveStatus === 'loading'}
              className="px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-lg shadow-emerald-600/25 flex items-center justify-center gap-2 transition-all cursor-pointer disabled:opacity-50"
            >
              <UploadCloud className="w-4 h-4" />
              <span>
                {driveMainFile
                  ? `Perbarui ${MAIN_DRIVE_FILE_NAME} di Drive`
                  : `Simpan File Utama (${MAIN_DRIVE_FILE_NAME})`}
              </span>
            </button>

            <div className="flex flex-1 items-center gap-2">
              <input
                type="text"
                value={snapshotLabel}
                onChange={(e) => setSnapshotLabel(e.target.value)}
                placeholder="Nama snapshot JSON baru (opsional)..."
                className="flex-1 min-w-0 bg-slate-950 border border-slate-700 rounded-xl px-3 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500"
              />
              <button
                type="button"
                onClick={handleSaveSnapshot}
                disabled={busyAction || driveStatus === 'loading'}
                className="px-3.5 py-2.5 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white font-bold text-xs flex items-center gap-1.5 transition-all cursor-pointer disabled:opacity-50 shrink-0"
              >
                <Save className="w-3.5 h-3.5" />
                <span>Simpan Snapshot Baru</span>
              </button>
            </div>
          </div>

          {/* Official PDF Documents Upload Section (Jadwal PDF & Laporan Akhir PDF) */}
          <div className="p-3.5 rounded-xl bg-slate-950/60 border border-slate-800 space-y-2.5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-white flex items-center gap-2">
                <FileText className="w-4 h-4 text-rose-400" />
                Dokumen PDF Resmi di Google Drive (Siap Cetak)
              </span>
              <span className="text-[10px] font-mono text-slate-400 uppercase">Format PDF A4</span>
            </div>

            <div className={`grid grid-cols-1 ${compact ? 'sm:grid-cols-1' : 'md:grid-cols-2'} gap-3`}>
              {/* Jadwal Pertandingan PDF Card */}
              <div className="p-3 rounded-xl bg-slate-900/90 border border-slate-800 flex flex-col justify-between gap-2.5">
                <div className="flex items-start gap-2.5">
                  <div className="p-2 rounded-lg bg-amber-500/15 border border-amber-500/30 text-amber-400 shrink-0">
                    <Calendar className="w-4 h-4" />
                  </div>
                  <div className="min-w-0">
                    <div className="text-xs font-bold text-white">Jadwal Pertandingan (PDF)</div>
                    <p className="text-[11px] text-slate-400 mt-0.5">
                      {driveSchedulePdfFile
                        ? `Tersimpan: ${formatDriveBytes(driveSchedulePdfFile.size)} • ${
                            driveSchedulePdfFile.modifiedTime
                              ? new Date(driveSchedulePdfFile.modifiedTime).toLocaleString('id-ID')
                              : ''
                          }`
                        : 'Simpan jadwal seluruh partai tanding & seni dalam format PDF ke Drive.'}
                    </p>
                  </div>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <button
                    type="button"
                    onClick={() => handleSchedulePdfClick(false)}
                    disabled={busyAction || driveStatus === 'loading' || !onSaveSchedulePdfToDrive}
                    className="flex-1 px-3 py-2 rounded-lg bg-amber-600 hover:bg-amber-500 text-white font-bold text-[11px] flex items-center justify-center gap-1.5 transition-colors cursor-pointer disabled:opacity-50"
                  >
                    <UploadCloud className="w-3.5 h-3.5" />
                    <span>
                      {driveSchedulePdfFile ? `Perbarui ${SCHEDULE_DRIVE_PDF_NAME}` : 'Simpan Jadwal PDF ke Drive'}
                    </span>
                  </button>
                  <button
                    type="button"
                    onClick={() => handleSchedulePdfClick(true)}
                    disabled={busyAction || driveStatus === 'loading' || !onSaveSchedulePdfToDrive}
                    className="px-2.5 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-amber-300 border border-slate-700 font-semibold text-[11px] transition-colors cursor-pointer disabled:opacity-50"
                    title="Simpan salinan PDF jadwal baru dengan stempel waktu tanpa menimpa file utama"
                  >
                    + Arsip Baru
                  </button>
                </div>
              </div>

              {/* Laporan Akhir Turnamen PDF Card */}
              <div className="p-3 rounded-xl bg-slate-900/90 border border-slate-800 flex flex-col justify-between gap-2.5">
                <div className="flex items-start gap-2.5">
                  <div className="p-2 rounded-lg bg-rose-500/15 border border-rose-500/30 text-rose-400 shrink-0">
                    <Award className="w-4 h-4" />
                  </div>
                  <div className="min-w-0">
                    <div className="text-xs font-bold text-white">Laporan Akhir Turnamen (PDF)</div>
                    <p className="text-[11px] text-slate-400 mt-0.5">
                      {driveFinalReportPdfFile
                        ? `Tersimpan: ${formatDriveBytes(driveFinalReportPdfFile.size)} • ${
                            driveFinalReportPdfFile.modifiedTime
                              ? new Date(driveFinalReportPdfFile.modifiedTime).toLocaleString('id-ID')
                              : ''
                          }`
                        : 'Simpan buku laporan resmi akhir (hasil tanding, seni & perolehan medali) ke Drive.'}
                    </p>
                  </div>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <button
                    type="button"
                    onClick={() => handleFinalReportPdfClick(false)}
                    disabled={busyAction || driveStatus === 'loading' || !onSaveFinalReportPdfToDrive}
                    className="flex-1 px-3 py-2 rounded-lg bg-rose-600 hover:bg-rose-500 text-white font-bold text-[11px] flex items-center justify-center gap-1.5 transition-colors cursor-pointer disabled:opacity-50"
                  >
                    <UploadCloud className="w-3.5 h-3.5" />
                    <span>
                      {driveFinalReportPdfFile
                        ? `Perbarui ${FINAL_REPORT_DRIVE_PDF_NAME}`
                        : 'Simpan Laporan Akhir PDF ke Drive'}
                    </span>
                  </button>
                  <button
                    type="button"
                    onClick={() => handleFinalReportPdfClick(true)}
                    disabled={busyAction || driveStatus === 'loading' || !onSaveFinalReportPdfToDrive}
                    className="px-2.5 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-rose-300 border border-slate-700 font-semibold text-[11px] transition-colors cursor-pointer disabled:opacity-50"
                    title="Simpan salinan PDF laporan akhir baru dengan stempel waktu tanpa menimpa file utama"
                  >
                    + Arsip Baru
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Drive Files List */}
          <div className="space-y-2">
            <div className="text-xs font-bold text-slate-200 flex items-center justify-between">
              <span>Berkas Tersimpan di Google Drive ({driveFiles.length})</span>
              {driveMainFile && (
                <span className="text-[11px] font-mono text-emerald-400">
                  File utama aktif: {formatDriveBytes(driveMainFile.size)}
                </span>
              )}
            </div>

            {driveFiles.length > 0 ? (
              <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
                {driveFiles.map((file) => {
                  const pdf = isPdfFile(file);
                  return (
                    <div
                      key={file.id}
                      className="p-3 rounded-xl bg-slate-950/75 border border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5"
                    >
                      <div className="flex items-start gap-2.5 min-w-0">
                        {pdf ? (
                          <FileText className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
                        ) : (
                          <FileJson className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                        )}
                        <div className="min-w-0">
                          <div className="text-xs font-bold text-white truncate flex items-center gap-1.5">
                            <span className="truncate">{file.name}</span>
                            {pdf && (
                              <span className="px-1.5 py-0.5 rounded bg-rose-500/20 text-rose-300 border border-rose-500/30 text-[9px] font-extrabold uppercase shrink-0">
                                PDF
                              </span>
                            )}
                            {file.name === MAIN_DRIVE_FILE_NAME && (
                              <span className="px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-[9px] font-extrabold uppercase shrink-0">
                                Utama
                              </span>
                            )}
                          </div>
                          <div className="text-[11px] text-slate-400 font-mono mt-0.5">
                            {formatDriveBytes(file.size)} •{' '}
                            {file.modifiedTime ? new Date(file.modifiedTime).toLocaleString('id-ID') : '-'}
                          </div>
                        </div>
                      </div>

                      <div className="flex flex-wrap items-center gap-1.5 shrink-0">
                        {!pdf && (
                          <button
                            type="button"
                            onClick={() => setConfirmAction({ type: 'restore_file', file })}
                            disabled={busyAction}
                            className="px-2.5 py-1.5 rounded-lg bg-blue-600/20 hover:bg-blue-600 text-blue-300 hover:text-white border border-blue-500/40 text-[11px] font-bold flex items-center gap-1 transition-colors cursor-pointer disabled:opacity-50"
                          >
                            <RotateCcw className="w-3 h-3" />
                            <span>Pulihkan</span>
                          </button>
                        )}

                        <button
                          type="button"
                          onClick={() => handleDownload(file)}
                          disabled={busyAction}
                          className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 transition-colors cursor-pointer disabled:opacity-50"
                          title={pdf ? 'Unduh file PDF' : 'Unduh file JSON'}
                        >
                          <Download className="w-3.5 h-3.5" />
                        </button>

                        {file.webViewLink && (
                          <a
                            href={file.webViewLink}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-emerald-300 border border-slate-700 transition-colors"
                            title="Lihat di Google Drive"
                          >
                            <ExternalLink className="w-3.5 h-3.5" />
                          </a>
                        )}

                        <button
                          type="button"
                          onClick={() => setConfirmAction({ type: 'delete_file', file })}
                          disabled={busyAction}
                          className="p-1.5 rounded-lg bg-slate-800 hover:bg-red-950 text-slate-400 hover:text-red-300 border border-slate-700 transition-colors cursor-pointer disabled:opacity-50"
                          title="Hapus file dari Google Drive"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="p-4 rounded-xl bg-slate-950/50 border border-slate-800/80 text-xs text-slate-400 text-center">
                Folder Google Drive masih kosong. Anda dapat menyimpan <strong>File Database Utama (JSON)</strong>, <strong>Jadwal Pertandingan (PDF)</strong>, atau <strong>Laporan Akhir Turnamen (PDF)</strong> melalui tombol di atas.
              </div>
            )}
          </div>
        </>
      )}

      {(feedback || driveError) && (
        <div
          className={`p-3 rounded-xl text-xs flex items-start gap-2 border ${
            feedback?.type === 'success' && !driveError
              ? 'bg-emerald-950/50 text-emerald-200 border-emerald-700/50'
              : 'bg-red-950/50 text-red-200 border-red-700/50'
          }`}
        >
          {feedback?.type === 'success' && !driveError ? (
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
          ) : (
            <AlertTriangle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
          )}
          <span className="break-words">{driveError || feedback?.text}</span>
        </div>
      )}

      {/* Explicit Confirmation Modal for Overwrite, Restore, and Delete operations */}
      {confirmAction && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl max-w-md w-full p-5 text-slate-100 shadow-2xl space-y-4">
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-center gap-2.5">
                <div
                  className={`p-2 rounded-xl border ${
                    confirmAction.type === 'delete_file'
                      ? 'bg-red-500/15 border-red-500/40 text-red-400'
                      : 'bg-amber-500/15 border-amber-500/40 text-amber-400'
                  }`}
                >
                  <ShieldAlert className="w-5 h-5" />
                </div>
                <h4 className="text-sm font-bold text-white">
                  {confirmAction.type === 'overwrite_main' ||
                  confirmAction.type === 'overwrite_schedule_pdf' ||
                  confirmAction.type === 'overwrite_report_pdf'
                    ? 'Konfirmasi Perbarui File Google Drive'
                    : confirmAction.type === 'delete_file'
                    ? 'Konfirmasi Hapus File Google Drive'
                    : 'Konfirmasi Pulihkan Data dari Google Drive'}
                </h4>
              </div>
              <button
                type="button"
                onClick={() => setConfirmAction(null)}
                className="p-1 text-slate-400 hover:text-white rounded-lg cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-3 rounded-xl bg-slate-950/80 border border-slate-800 text-xs text-slate-300 space-y-1.5 leading-relaxed">
              {(confirmAction.type === 'overwrite_main' ||
                confirmAction.type === 'overwrite_schedule_pdf' ||
                confirmAction.type === 'overwrite_report_pdf') && (
                <>
                  <p>
                    Anda akan menimpa dan memperbarui isi berkas{' '}
                    <strong className="text-white">{confirmAction.file.name}</strong> di Google Drive dengan versi terbaru saat ini.
                  </p>
                  <p className="text-[11px] text-slate-400 font-mono">
                    Ukuran sebelumnya: {formatDriveBytes(confirmAction.file.size)}
                  </p>
                </>
              )}
              {confirmAction.type === 'delete_file' && (
                <>
                  <p>
                    Apakah Anda yakin ingin menghapus permanen berkas{' '}
                    <strong className="text-red-300">{confirmAction.file.name}</strong> dari Google Drive Anda?
                  </p>
                  <p className="text-[11px] text-slate-400">
                    Tindakan ini tidak dapat dibatalkan setelah file dihapus dari Drive.
                  </p>
                </>
              )}
              {confirmAction.type === 'restore_file' && (
                <>
                  <p>
                    Seluruh data pertandingan, registrasi atlet, bagan, dan pengaturan master lokal saat ini akan diganti dengan isi berkas{' '}
                    <strong className="text-blue-300">{confirmAction.file.name}</strong> dari Google Drive.
                  </p>
                  <p className="text-[11px] text-slate-400 font-mono">
                    Terakhir diubah:{' '}
                    {confirmAction.file.modifiedTime ? new Date(confirmAction.file.modifiedTime).toLocaleString('id-ID') : '-'}
                  </p>
                </>
              )}
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setConfirmAction(null)}
                className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold cursor-pointer"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={executeConfirmedAction}
                className={`px-4 py-2 rounded-xl text-white text-xs font-bold cursor-pointer ${
                  confirmAction.type === 'delete_file'
                    ? 'bg-red-600 hover:bg-red-500'
                    : confirmAction.type === 'restore_file'
                    ? 'bg-blue-600 hover:bg-blue-500'
                    : 'bg-emerald-600 hover:bg-emerald-500'
                }`}
              >
                {confirmAction.type === 'delete_file'
                  ? 'Ya, Hapus File'
                  : confirmAction.type === 'restore_file'
                  ? 'Ya, Pulihkan Data'
                  : 'Ya, Perbarui File'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
