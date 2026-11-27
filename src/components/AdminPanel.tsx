/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useMemo } from 'react';
import {
  ShieldCheck,
  Lock,
  UserCheck,
  Trophy,
  Users,
  LayoutGrid,
  FileText,
  CheckCircle2,
  AlertTriangle,
  Plus,
  Pencil,
  Trash2,
  Save,
  RefreshCw,
  Search,
  Filter,
  Eye,
  EyeOff,
  LogOut,
  ArrowLeft,
  Shield,
  Award,
  Sliders,
  Download,
  Upload,
  Check,
  X,
  MapPin,
  Calendar,
  Building,
  User,
  KeyRound,
  ExternalLink,
  Database,
  HardDrive,
  FolderArchive,
  Server,
  Clock,
  FileCheck,
  Cpu,
  Zap,
  Palette,
  Sparkles,
  Monitor,
  RotateCcw,
  Scissors,
  Image as ImageIcon,
  Cloud,
  CloudOff,
  UploadCloud,
  LogIn,
  History
} from 'lucide-react';
import type { User as FirebaseUser } from 'firebase/auth';
import type { CloudBackupItem } from '../services/firebaseService';
import GoogleDriveStoragePanel, { GoogleDriveStorageProps } from './GoogleDriveStoragePanel';
import { PenaltyPhotoUploaderModal } from './PenaltyPhotoUploaderModal';
import { playBeep } from '../utils/sound';
import {
  MasterTournamentInfo,
  MasterReferee,
  ArenaAssignment,
  MasterDataState,
  AdminUser,
  GelanggangInfo,
  StorageStatus,
  StorageFileInfo,
  PenaltyIconConfig,
  PenaltyIconType,
  MatchState,
  TGRState,
  MatchHistory
} from '../types';
import {
  DEFAULT_PENALTY_ICONS,
  PERSILAT_PENALTY_ICONS,
  NEW_REFERENCE_PENALTY_ICONS,
  ACTION_PENALTY_ICONS,
  STANDARDIZED_IMAGEN_PRESET,
  STANDARDIZED_DQ_PRESET,
  STANDARDIZED_PENALTY_ASSETS,
  ICON_CATALOG,
  renderPenaltyIcon
} from './PenaltyIconSet';
import { optimizePenaltyPng } from '../utils/imageCompressor';

interface AdminPanelProps extends GoogleDriveStorageProps {
  onBackToPortal: () => void;
  masterData: MasterDataState | null;
  arenasList?: GelanggangInfo[];
  currentArenaId?: string;
  onSelectArena?: (id: string) => void;
  state?: MatchState;
  tgrState?: TGRState;
  histories?: MatchHistory[];
  dispatch?: (type: string, payload?: any) => void;
  allArenasMap?: Record<string, { state: MatchState; tgrState: TGRState; histories: MatchHistory[]; info: any }>;
  allArenasSummary?: any[];
  googleUser?: FirebaseUser | null;
  googleSyncEnabled?: boolean;
  onToggleGoogleSync?: (enabled: boolean) => void;
  googleSyncStatus?: 'disconnected' | 'connecting' | 'synced' | 'error';
  googleError?: string | null;
  cloudTournamentId?: string | null;
  cloudBackups?: CloudBackupItem[];
  lastCloudSyncAt?: string | null;
  onSignInGoogle?: () => Promise<any>;
  onSignOutGoogle?: () => Promise<void>;
  onPushAllToGoogleCloud?: () => Promise<void>;
  onCreateGoogleBackup?: (label?: string) => Promise<CloudBackupItem | undefined>;
  onRestoreGoogleBackup?: (backup: CloudBackupItem) => Promise<void>;
  onDeleteGoogleBackup?: (backupId: string) => Promise<void>;
  firebaseProjectInfo?: {
    projectId: string;
    databaseId: string;
    authDomain: string;
    hasFirestoreDatabase?: boolean;
  };
}

export const AdminPanel: React.FC<AdminPanelProps> = ({
  onBackToPortal,
  masterData: liveMasterData,
  arenasList = [
    { id: 'arena_1', nama: 'Gelanggang 1', kode: '1', keterangan: 'Matras 1 - Arena Utama A', modeAktif: 'tanding', status: 'aktif' },
    { id: 'arena_2', nama: 'Gelanggang 2', kode: '2', keterangan: 'Matras 2 - Arena B', modeAktif: 'tanding', status: 'aktif' },
    { id: 'arena_3', nama: 'Gelanggang 3', kode: '3', keterangan: 'Matras 3 - Arena Seni C', modeAktif: 'seni', status: 'aktif' }
  ],
  currentArenaId = 'arena_1',
  onSelectArena,
  state,
  tgrState,
  histories,
  dispatch,
  allArenasMap,
  allArenasSummary,
  googleUser = null,
  googleSyncEnabled = true,
  onToggleGoogleSync,
  googleSyncStatus = 'disconnected',
  googleError = null,
  cloudTournamentId = null,
  cloudBackups = [],
  lastCloudSyncAt = null,
  onSignInGoogle,
  onSignOutGoogle,
  onPushAllToGoogleCloud,
  onCreateGoogleBackup,
  onRestoreGoogleBackup,
  onDeleteGoogleBackup,
  firebaseProjectInfo,
  driveConnected = false,
  driveFolder = null,
  driveFiles = [],
  driveMainFile = null,
  driveSchedulePdfFile = null,
  driveFinalReportPdfFile = null,
  driveStatus = 'idle' as NonNullable<GoogleDriveStorageProps['driveStatus']>,
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
}) => {
  // Authentication state
  const [token, setToken] = useState<string | null>(() => {
    return typeof window !== 'undefined' ? (sessionStorage.getItem('admin_auth_token') || localStorage.getItem('admin_auth_token')) : null;
  });
  const [currentUser, setCurrentUser] = useState<AdminUser | null>(null);
  const [authLoading, setAuthLoading] = useState<boolean>(true);
  const [authError, setAuthError] = useState<string | null>(null);

  // Login form state
  const [loginUsername, setLoginUsername] = useState('admin');
  const [loginPassword, setLoginPassword] = useState('admin@silat2026');
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmittingLogin, setIsSubmittingLogin] = useState(false);

  // Active Admin Tabs: 'tournament' | 'referees' | 'assignments' | 'penalty_icons' | 'storage' | 'security' | 'reset_total'
  const [activeTab, setActiveTab] = useState<'tournament' | 'referees' | 'assignments' | 'penalty_icons' | 'storage' | 'security' | 'reset_total'>('tournament');

  // Local Server Storage State
  const [storageStatus, setStorageStatus] = useState<StorageStatus | null>(null);
  const [isLoadingStorage, setIsLoadingStorage] = useState<boolean>(false);
  const [isSavingDisk, setIsSavingDisk] = useState<boolean>(false);
  const [isCreatingBackup, setIsCreatingBackup] = useState<boolean>(false);

  // Google Cloud Firestore Storage UI State
  const [isGoogleActionBusy, setIsGoogleActionBusy] = useState<boolean>(false);
  const [cloudBackupLabel, setCloudBackupLabel] = useState<string>('');

  // Node.js Auto-Build State
  const [buildStatus, setBuildStatus] = useState<{
    isBuilding: boolean;
    hasBuild: boolean;
    lastBuiltAt: string | null;
    lastBuildError: string | null;
    builtFilesCount: number;
  } | null>(null);
  const [isTriggeringBuild, setIsTriggeringBuild] = useState<boolean>(false);

  // Local Master Data State (initialized from liveMasterData or fetched via API)
  const [localTournament, setLocalTournament] = useState<MasterTournamentInfo>({
    namaEvent: "Kejuaraan Nasional Pencak Silat IPSI 2026",
    subJudul: "Piala Menpora RI & Ketua Umum Pengurus Besar IPSI",
    lokasi: "Padepokan Pencak Silat Indonesia, TMII, Jakarta Timur",
    tanggalMulai: "2026-09-15",
    tanggalSelesai: "2026-09-20",
    tingkatKejuaraan: "Nasional",
    penyelenggara: "Pengurus Besar Ikatan Pencak Silat Indonesia (PB IPSI)",
    delegasiTeknis: "Drs. H. M. Taufik, M.Si (Technical Delegate IPSI)",
    ketuaPertandinganUtama: "Dr. H. Suwandi, M.Pd (Wasit Juri Internasional)",
    dewanWasitUtama: "Drs. Bambang Sutrisno, M.M",
    aturanVersi: "Peraturan Pertandingan IPSI 2022 (Terbaru)"
  });

  const [localReferees, setLocalReferees] = useState<MasterReferee[]>([]);
  const [localAssignments, setLocalAssignments] = useState<Record<string, ArenaAssignment>>({});
  const [localLogs, setLocalLogs] = useState<any[]>([]);

  // Penalty Icons configuration for Monitor Screen
  const [localPenaltyIcons, setLocalPenaltyIcons] = useState<PenaltyIconConfig>(() => {
    if (liveMasterData?.penaltyIcons) return liveMasterData.penaltyIcons;
    try {
      const saved = localStorage.getItem('silat_penalty_icons_config');
      if (saved) return JSON.parse(saved);
    } catch (e) {}
    return DEFAULT_PENALTY_ICONS;
  });
  const [isSavingPenaltyIcons, setIsSavingPenaltyIcons] = useState<boolean>(false);
  const [editingPenaltySlot, setEditingPenaltySlot] = useState<keyof PenaltyIconConfig | null>(null);

  // Fetch penalty icons from server
  const fetchPenaltyIcons = async () => {
    try {
      const res = await fetch('/api/admin/penalty-icons');
      if (res.ok) {
        const data = await res.json();
        if (data.success && data.penaltyIcons) {
          setLocalPenaltyIcons(data.penaltyIcons);
          try {
            localStorage.setItem('silat_penalty_icons_config', JSON.stringify(data.penaltyIcons));
          } catch (e) {}
        }
      }
    } catch (err) {
      console.warn('Gagal memuat icon hukuman dari server:', err);
    }
  };

  // Notification Toast / Alert
  const [alertNotice, setAlertNotice] = useState<{ type: 'success' | 'error' | 'info'; message: string } | null>(null);
  const showAlert = (type: 'success' | 'error' | 'info', message: string) => {
    setAlertNotice({ type, message });
    setTimeout(() => setAlertNotice(null), 4500);
  };

  // Selected Arena for Arena Assignment tab
  const [selectedArenaForAssign, setSelectedArenaForAssign] = useState<string>(currentArenaId || 'arena_1');

  // Referee Filter & Search state
  const [searchRefQuery, setSearchRefQuery] = useState('');
  const [filterLisensi, setFilterLisensi] = useState<string>('Semua');
  const [filterKategori, setFilterKategori] = useState<string>('Semua');

  // Referee Modal (Add/Edit)
  const [showRefModal, setShowRefModal] = useState(false);
  const [editingReferee, setEditingReferee] = useState<MasterReferee | null>(null);
  const [refForm, setRefForm] = useState<Partial<MasterReferee>>({
    nama: '',
    lisensi: 'Nasional 1',
    pengprov: 'Jawa Barat',
    kategoriTugas: 'Semua',
    nomorRegistrasi: '',
    telepon: '',
    status: 'aktif',
    catatan: ''
  });

  // Password change state
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  // 1. Verify token on mount or token change
  useEffect(() => {
    let isMounted = true;

    const verify = async () => {
      if (!token) {
        setAuthLoading(false);
        return;
      }
      try {
        const res = await fetch('/api/admin/verify', {
          headers: { Authorization: `Bearer ${token}` }
        });
        if (res.ok) {
          const data = await res.json();
          if (isMounted && data.success) {
            setCurrentUser(data.user);
            if (data.masterData) {
              setLocalTournament(data.masterData.tournament || localTournament);
              setLocalReferees(data.masterData.referees || []);
              setLocalAssignments(data.masterData.assignments || {});
              setLocalLogs(data.masterData.auditLogs || []);
              if (data.masterData.penaltyIcons) {
                setLocalPenaltyIcons(data.masterData.penaltyIcons);
              }
            }
          }
        } else {
          // Token expired or invalid
          sessionStorage.removeItem('admin_auth_token');
          localStorage.removeItem('admin_auth_token');
          setToken(null);
          setCurrentUser(null);
        }
      } catch (err) {
        console.warn("Admin token verification error:", err);
      } finally {
        if (isMounted) setAuthLoading(false);
      }
    };

    verify();

    return () => {
      isMounted = false;
    };
  }, [token]);

  // 2. Sync with liveMasterData if available
  useEffect(() => {
    if (liveMasterData) {
      if (liveMasterData.tournament) setLocalTournament(liveMasterData.tournament);
      if (liveMasterData.referees) setLocalReferees(liveMasterData.referees);
      if (liveMasterData.assignments) setLocalAssignments(liveMasterData.assignments);
      if (liveMasterData.auditLogs) setLocalLogs(liveMasterData.auditLogs);
      if (liveMasterData.penaltyIcons) setLocalPenaltyIcons(liveMasterData.penaltyIcons);
    }
  }, [liveMasterData]);

  // Fetch local server storage health & status
  const fetchStorageStatus = async () => {
    try {
      setIsLoadingStorage(true);
      const res = await fetch('/api/storage/status');
      if (res.ok) {
        const data = await res.json();
        if (data.success) {
          setStorageStatus(data);
        }
      }
    } catch (err) {
      console.warn('Gagal memuat status penyimpanan lokal:', err);
    } finally {
      setIsLoadingStorage(false);
    }
  };

  // Fetch Node.js Auto-Build status
  const fetchBuildStatus = async () => {
    try {
      const res = await fetch('/api/system/build-status');
      if (res.ok) {
        const data = await res.json();
        if (data.success) {
          setBuildStatus(data);
        }
      }
    } catch {
      // ignore
    }
  };

  useEffect(() => {
    fetchStorageStatus();
    fetchBuildStatus();
    const interval = setInterval(() => {
      fetchStorageStatus();
      fetchBuildStatus();
    }, 10000);
    return () => clearInterval(interval);
  }, []);

  // Trigger Node.js Auto-Build directly
  const handleTriggerNodeBuild = async () => {
    try {
      setIsTriggeringBuild(true);
      showAlert('info', 'Memulai auto-build frontend langsung di Node.js. Mohon tunggu beberapa detik...');
      const res = await fetch('/api/system/build', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ force: true })
      });
      const data = await res.json();
      if (data.success) {
        showAlert('success', 'Build Node.js berhasil diselesaikan! Aplikasi siap digunakan secara offline & mandiri.');
        fetchBuildStatus();
      } else {
        showAlert('error', data.error || 'Gagal menjalankan build Node.js');
      }
    } catch (err: any) {
      showAlert('error', 'Gagal memicu build Node.js: ' + (err.message || String(err)));
    } finally {
      setIsTriggeringBuild(false);
    }
  };

  // Force Save to Local Server Disk Now
  const handleSaveToLocalDisk = async () => {
    try {
      setIsSavingDisk(true);
      const res = await fetch('/api/storage/save', { method: 'POST' });
      const data = await res.json();
      if (data.success) {
        showAlert('success', data.message || 'Data berhasil disimpan ke disk server lokal!');
        if (data.status) setStorageStatus(data.status);
      } else {
        showAlert('error', data.error || 'Gagal menyimpan ke server lokal.');
      }
    } catch (err: any) {
      showAlert('error', 'Error: ' + err.message);
    } finally {
      setIsSavingDisk(false);
    }
  };

  // Create Local Snapshot Backup on Server
  const handleCreateLocalBackup = async () => {
    try {
      setIsCreatingBackup(true);
      const res = await fetch('/api/storage/backup', { method: 'POST' });
      const data = await res.json();
      if (data.success) {
        showAlert('success', data.message || 'Snapshot cadangan lokal berhasil dibuat!');
        if (data.status) setStorageStatus(data.status);
      } else {
        showAlert('error', data.error || 'Gagal membuat file cadangan.');
      }
    } catch (err: any) {
      showAlert('error', 'Error: ' + err.message);
    } finally {
      setIsCreatingBackup(false);
    }
  };

  // Restore Database from uploaded JSON file
  const handleRestoreDatabase = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!window.confirm(`PERINGATAN: Memulihkan database dari file "${file.name}" akan menimpa seluruh data pertandingan dan pengaturan gelanggang saat ini. Lanjutkan?`)) {
      e.target.value = '';
      return;
    }

    const reader = new FileReader();
    reader.onload = async (ev) => {
      try {
        const raw = ev.target?.result as string;
        const parsed = JSON.parse(raw);
        const res = await fetch('/api/storage/import', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ dump: parsed })
        });
        const data = await res.json();
        if (data.success) {
          showAlert('success', data.message || 'Database berhasil dipulihkan!');
          if (data.status) setStorageStatus(data.status);
          setTimeout(() => {
            window.location.reload();
          }, 1000);
        } else {
          showAlert('error', data.error || 'Gagal memulihkan database.');
        }
      } catch (err: any) {
        showAlert('error', 'Format file JSON tidak valid: ' + err.message);
      } finally {
        e.target.value = '';
      }
    };
    reader.readAsText(file);
  };

  // Google Cloud Firestore Storage Handlers
  const handleAdminGoogleSignIn = async () => {
    if (!onSignInGoogle) return;
    try {
      setIsGoogleActionBusy(true);
      await onSignInGoogle();
      showAlert('success', 'Berhasil masuk ke akun Google! Penyimpanan Cloud Firestore aktif.');
    } catch (err: any) {
      showAlert('error', err?.message || 'Gagal masuk dengan akun Google.');
    } finally {
      setIsGoogleActionBusy(false);
    }
  };

  const handleAdminGoogleSyncNow = async () => {
    if (!onPushAllToGoogleCloud) return;
    try {
      setIsGoogleActionBusy(true);
      await onPushAllToGoogleCloud();
      showAlert('success', 'Seluruh data turnamen, wasit, gelanggang, bagan & riwayat berhasil disimpan ke Google Cloud Firestore!');
    } catch (err: any) {
      showAlert('error', err?.message || 'Gagal menyimpan data ke Google Firestore.');
    } finally {
      setIsGoogleActionBusy(false);
    }
  };

  const handleAdminCreateGoogleBackup = async () => {
    if (!onCreateGoogleBackup) return;
    try {
      setIsGoogleActionBusy(true);
      const label = cloudBackupLabel.trim() || undefined;
      await onCreateGoogleBackup(label);
      setCloudBackupLabel('');
      showAlert('success', 'Snapshot cadangan berhasil disimpan permanen ke Google Cloud Firestore!');
    } catch (err: any) {
      showAlert('error', err?.message || 'Gagal membuat snapshot Google Cloud.');
    } finally {
      setIsGoogleActionBusy(false);
    }
  };

  const handleAdminRestoreGoogleBackup = async (backup: CloudBackupItem) => {
    if (!onRestoreGoogleBackup) return;
    if (!window.confirm(`Pulihkan seluruh data turnamen dari snapshot Google "${backup.label}"? Data saat ini akan diganti dengan isi snapshot.`)) {
      return;
    }
    try {
      setIsGoogleActionBusy(true);
      await onRestoreGoogleBackup(backup);
      showAlert('success', `Snapshot "${backup.label}" berhasil dipulihkan dari Google Cloud Firestore!`);
    } catch (err: any) {
      showAlert('error', err?.message || 'Gagal memulihkan snapshot dari Google Cloud.');
    } finally {
      setIsGoogleActionBusy(false);
    }
  };

  const handleAdminDeleteGoogleBackup = async (backup: CloudBackupItem) => {
    if (!onDeleteGoogleBackup) return;
    if (!window.confirm(`Hapus snapshot "${backup.label}" dari Google Cloud Firestore?`)) {
      return;
    }
    try {
      setIsGoogleActionBusy(true);
      await onDeleteGoogleBackup(backup.id);
      showAlert('info', `Snapshot "${backup.label}" telah dihapus dari Google Cloud.`);
    } catch (err: any) {
      showAlert('error', err?.message || 'Gagal menghapus snapshot Google Cloud.');
    } finally {
      setIsGoogleActionBusy(false);
    }
  };

  // Handle Login
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError(null);
    setIsSubmittingLogin(true);

    try {
      const res = await fetch('/api/admin/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: loginUsername, password: loginPassword })
      });
      const data = await res.json();

      if (data.success && data.token) {
        sessionStorage.setItem('admin_auth_token', data.token);
        localStorage.setItem('admin_auth_token', data.token);
        setToken(data.token);
        setCurrentUser(data.user);
        if (data.masterData) {
          setLocalTournament(data.masterData.tournament || localTournament);
          setLocalReferees(data.masterData.referees || []);
          setLocalAssignments(data.masterData.assignments || {});
          setLocalLogs(data.masterData.auditLogs || []);
          if (data.masterData.penaltyIcons) {
            setLocalPenaltyIcons(data.masterData.penaltyIcons);
          }
        }
        showAlert('success', `Selamat datang kembali, ${data.user.displayName}!`);
      } else {
        setAuthError(data.error || 'Login gagal. Periksa username dan password Anda.');
      }
    } catch (err: any) {
      setAuthError('Gagal menghubungi server autentikasi: ' + (err.message || 'Koneksi error'));
    } finally {
      setIsSubmittingLogin(false);
    }
  };

  // Handle Logout
  const handleLogout = async () => {
    if (token) {
      try {
        await fetch('/api/admin/logout', {
          method: 'POST',
          headers: { Authorization: `Bearer ${token}` }
        });
      } catch (err) {
        // ignore
      }
    }
    sessionStorage.removeItem('admin_auth_token');
    localStorage.removeItem('admin_auth_token');
    setToken(null);
    setCurrentUser(null);
    showAlert('info', 'Anda telah berhasil logout dari AdminPanel.');
  };

  // Quick autofill credentials helper
  const handleAutofillAdmin = () => {
    setLoginUsername('admin');
    setLoginPassword('admin@silat2026');
    setAuthError(null);
  };

  // -------------------------------------------------------------
  // Save Tournament Information
  // -------------------------------------------------------------
  const [isSavingTournament, setIsSavingTournament] = useState(false);
  const handleSaveTournament = async () => {
    if (!token) return;
    setIsSavingTournament(true);
    try {
      const res = await fetch('/api/admin/tournament', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ tournament: localTournament })
      });
      const data = await res.json();
      if (data.success) {
        setLocalTournament(data.tournament);
        showAlert('success', 'Data turnamen berhasil disimpan dan disinkronkan ke seluruh gelanggang!');
      } else {
        showAlert('error', data.error || 'Gagal menyimpan data turnamen.');
      }
    } catch (err: any) {
      showAlert('error', 'Error: ' + err.message);
    } finally {
      setIsSavingTournament(false);
    }
  };

  // Preset tournaments
  const applyTournamentPreset = (presetKey: string) => {
    if (presetKey === 'kejurnas') {
      setLocalTournament(prev => ({
        ...prev,
        namaEvent: "Kejuaraan Nasional Pencak Silat IPSI 2026",
        subJudul: "Piala Menpora RI & Ketua Umum Pengurus Besar IPSI",
        lokasi: "Padepokan Pencak Silat Indonesia, TMII, Jakarta Timur",
        tingkatKejuaraan: "Nasional",
        penyelenggara: "Pengurus Besar Ikatan Pencak Silat Indonesia (PB IPSI)",
        aturanVersi: "Peraturan Pertandingan IPSI 2022 (Terbaru)"
      }));
      showAlert('info', 'Preset Kejurnas IPSI diterapkan.');
    } else if (presetKey === 'pon') {
      setLocalTournament(prev => ({
        ...prev,
        namaEvent: "Pekan Olahraga Nasional (PON) XXI - Cabor Pencak Silat",
        subJudul: "Babak Final Perebutan Medali Emas & Juara Umum",
        lokasi: "GOR Veteran Disporasu, Medan, Sumatra Utara",
        tingkatKejuaraan: "Nasional",
        penyelenggara: "KONI & PB IPSI",
        aturanVersi: "Peraturan Pertandingan IPSI 2022 (Terbaru)"
      }));
      showAlert('info', 'Preset PON XXI diterapkan.');
    } else if (presetKey === 'kejurda') {
      setLocalTournament(prev => ({
        ...prev,
        namaEvent: "Kejuaraan Daerah Pencak Silat Jawa Barat 2026",
        subJudul: "Piala Gubernur & Seleksi Daerah Babak Kualifikasi",
        lokasi: "GOR Tri Lomba Juang Pajajaran, Kota Bandung",
        tingkatKejuaraan: "Provinsi",
        penyelenggara: "Pengprov IPSI Jawa Barat",
        aturanVersi: "Peraturan Pertandingan IPSI 2022 (Terbaru)"
      }));
      showAlert('info', 'Preset Kejurda Jabar diterapkan.');
    } else if (presetKey === 'presiden') {
      setLocalTournament(prev => ({
        ...prev,
        namaEvent: "Piala Presiden Pencak Silat International Championship 2026",
        subJudul: "World Pencak Silat Federation & IPSI",
        lokasi: "Istora Senayan, Gelora Bung Karno, Jakarta Pusat",
        tingkatKejuaraan: "Internasional",
        penyelenggara: "Persekutuan Pencak Silat Antarabangsa (PERSILAT) & PB IPSI",
        aturanVersi: "Peraturan Pertandingan IPSI 2022 (Terbaru)"
      }));
      showAlert('info', 'Preset Piala Presiden diterapkan.');
    }
  };

  // Handle Logo Upload
  const handleLogoUpload = (type: 'kiri' | 'tengah' | 'kanan', file: File) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const dataUrl = e.target?.result as string;
      if (type === 'kiri') setLocalTournament(prev => ({ ...prev, logoKiri: dataUrl }));
      if (type === 'tengah') setLocalTournament(prev => ({ ...prev, logoTengah: dataUrl }));
      if (type === 'kanan') setLocalTournament(prev => ({ ...prev, logoKanan: dataUrl }));
      showAlert('success', `Logo ${type} berhasil diunggah.`);
    };
    reader.readAsDataURL(file);
  };

  // -------------------------------------------------------------
  // Referee CRUD Operations
  // -------------------------------------------------------------
  const filteredReferees = useMemo(() => {
    return localReferees.filter(ref => {
      const matchQuery =
        ref.nama.toLowerCase().includes(searchRefQuery.toLowerCase()) ||
        (ref.nomorRegistrasi && ref.nomorRegistrasi.toLowerCase().includes(searchRefQuery.toLowerCase())) ||
        ref.pengprov.toLowerCase().includes(searchRefQuery.toLowerCase());

      const matchLisensi = filterLisensi === 'Semua' || ref.lisensi === filterLisensi;
      const matchKategori = filterKategori === 'Semua' || ref.kategoriTugas === filterKategori || ref.kategoriTugas === 'Semua';

      return matchQuery && matchLisensi && matchKategori;
    });
  }, [localReferees, searchRefQuery, filterLisensi, filterKategori]);

  const handleOpenAddReferee = () => {
    setEditingReferee(null);
    setRefForm({
      nama: '',
      lisensi: 'Nasional 1',
      pengprov: 'Jawa Barat',
      kategoriTugas: 'Semua',
      nomorRegistrasi: `WJ-${Math.floor(1000 + Math.random() * 9000)}`,
      telepon: '0812-',
      status: 'aktif',
      catatan: ''
    });
    setShowRefModal(true);
  };

  const handleOpenEditReferee = (ref: MasterReferee) => {
    setEditingReferee(ref);
    setRefForm({ ...ref });
    setShowRefModal(true);
  };

  const handleSaveRefereeModal = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token) return;
    if (!refForm.nama?.trim()) {
      showAlert('error', 'Nama wasit/juri wajib diisi!');
      return;
    }

    try {
      const action = editingReferee ? 'update' : 'add';
      const refereePayload = {
        ...(editingReferee || {}),
        ...refForm,
        id: editingReferee ? editingReferee.id : `ref_${Date.now()}`
      };

      const res = await fetch('/api/admin/referees', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ action, referee: refereePayload })
      });
      const data = await res.json();
      if (data.success) {
        setLocalReferees(data.referees);
        setShowRefModal(false);
        showAlert('success', `Wasit ${refForm.nama} berhasil ${editingReferee ? 'diperbarui' : 'ditambahkan'}!`);
      } else {
        showAlert('error', data.error || 'Gagal menyimpan data wasit.');
      }
    } catch (err: any) {
      showAlert('error', 'Error: ' + err.message);
    }
  };

  const handleDeleteReferee = async (id: string, nama: string) => {
    if (!window.confirm(`Yakin ingin menghapus wasit "${nama}" dari daftar master?`)) return;
    if (!token) return;

    try {
      const res = await fetch('/api/admin/referees', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ action: 'delete', id })
      });
      const data = await res.json();
      if (data.success) {
        setLocalReferees(data.referees);
        showAlert('success', `Wasit ${nama} berhasil dihapus.`);
      } else {
        showAlert('error', data.error || 'Gagal menghapus wasit.');
      }
    } catch (err: any) {
      showAlert('error', 'Error: ' + err.message);
    }
  };

  // -------------------------------------------------------------
  // Arena Assignment Operations & Seni Judge Configuration
  // -------------------------------------------------------------
  const [applyJudgeCountToAllArenas, setApplyJudgeCountToAllArenas] = useState<boolean>(false);

  const activeAssignment: ArenaAssignment = useMemo(() => {
    const existing = localAssignments[selectedArenaForAssign];
    if (existing) {
      return {
        ...existing,
        seniJumlahJuri: existing.seniJumlahJuri || 5,
        seniJuriIds: existing.seniJuriIds || {}
      };
    }
    return {
      arenaId: selectedArenaForAssign,
      namaGelanggang: arenasList.find(a => a.id === selectedArenaForAssign)?.nama || `Gelanggang ${selectedArenaForAssign}`,
      shift: 'Sesi 1 (Pagi - Siang)',
      status: 'bertugas',
      seniJumlahJuri: 5,
      seniJuriIds: {}
    };
  }, [localAssignments, selectedArenaForAssign, arenasList]);

  const handleSetSeniJumlahJuri = async (count: number, applyToAll = false) => {
    const validatedCount = Math.min(10, Math.max(1, count));
    playBeep('click');

    setLocalAssignments(prev => {
      const next = { ...prev };
      if (applyToAll) {
        arenasList.forEach(a => {
          next[a.id] = {
            ...(next[a.id] || { arenaId: a.id, namaGelanggang: a.nama }),
            seniJumlahJuri: validatedCount
          };
        });
      } else {
        next[selectedArenaForAssign] = {
          ...activeAssignment,
          seniJumlahJuri: validatedCount
        };
      }
      return next;
    });

    if (dispatch) {
      dispatch('TGR_SET_JUMLAH_JURI', {
        jumlahJuri: validatedCount,
        applyToAllArenas: applyToAll
      });
    }

    try {
      await fetch('/api/action', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'TGR_SET_JUMLAH_JURI',
          arenaId: selectedArenaForAssign,
          payload: {
            jumlahJuri: validatedCount,
            applyToAllArenas: applyToAll
          }
        })
      });
    } catch (e) {}

    playBeep('valid');
    showAlert(
      'success',
      `Jumlah Juri Seni aktif bertugas diatur ke ${validatedCount} Juri ${
        applyToAll ? '(Diterapkan ke SEMUA Gelanggang)' : `(${activeAssignment.namaGelanggang})`
      }. Sistem scoring dan slot penugasan otomatis disinkronkan.`
    );
  };

  const [isSavingAssignment, setIsSavingAssignment] = useState(false);
  const handleSaveAssignment = async () => {
    if (!token) return;
    setIsSavingAssignment(true);
    try {
      const assignmentToSave = {
        ...activeAssignment,
        seniJumlahJuri: activeAssignment.seniJumlahJuri || 5
      };

      const res = await fetch('/api/admin/assignments', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          arenaId: selectedArenaForAssign,
          assignment: assignmentToSave
        })
      });
      const data = await res.json();
      if (data.success) {
        setLocalAssignments(data.assignments);
        if (dispatch) {
          dispatch('TGR_SET_JUMLAH_JURI', {
            jumlahJuri: assignmentToSave.seniJumlahJuri
          });
        }
        showAlert('success', `Penugasan wasit/juri untuk ${activeAssignment.namaGelanggang} berhasil disimpan dan disinkronkan (Juri Seni: ${assignmentToSave.seniJumlahJuri} Juri)!`);
      } else {
        showAlert('error', data.error || 'Gagal menyimpan penugasan.');
      }
    } catch (err: any) {
      showAlert('error', 'Error: ' + err.message);
    } finally {
      setIsSavingAssignment(false);
    }
  };

  const handleUpdateAssignmentField = (field: keyof ArenaAssignment, val: any) => {
    setLocalAssignments(prev => ({
      ...prev,
      [selectedArenaForAssign]: {
        ...activeAssignment,
        [field]: val
      }
    }));
  };

  const handleUpdateSeniJuri = (juriKey: string, refId: string | null) => {
    const currentSeni = activeAssignment.seniJuriIds || {};
    setLocalAssignments(prev => ({
      ...prev,
      [selectedArenaForAssign]: {
        ...activeAssignment,
        seniJuriIds: {
          ...currentSeni,
          [juriKey]: refId
        }
      }
    }));
  };

  // Auto-Assign (Smart Referee Rotation)
  const handleAutoAssign = () => {
    if (localReferees.length < 5) {
      showAlert('error', 'Diperlukan minimal 5 wasit terdaftar untuk menjalankan rotasi otomatis.');
      return;
    }

    const availableRefs = [...localReferees].filter(r => r.status === 'aktif');
    if (availableRefs.length === 0) {
      showAlert('error', 'Tidak ada wasit dengan status aktif.');
      return;
    }

    const shuffled = [...availableRefs].sort(() => 0.5 - Math.random());

    const ketua = shuffled.find(r => r.lisensi === 'Internasional' || r.lisensi === 'Nasional 1') || shuffled[0];
    const dewan = shuffled.find(r => r.id !== ketua.id && (r.lisensi === 'Nasional 1' || r.lisensi === 'Nasional 2')) || shuffled[1];
    const wasitPanggung = shuffled.find(r => r.id !== ketua.id && r.id !== dewan.id) || shuffled[2];
    const remain = shuffled.filter(r => r.id !== ketua.id && r.id !== dewan.id && r.id !== wasitPanggung.id);

    const juri1 = remain[0] || shuffled[0];
    const juri2 = remain[1] || shuffled[1];
    const juri3 = remain[2] || shuffled[2];
    const juriCad = remain[3] || null;

    const seniCount = activeAssignment.seniJumlahJuri || 5;
    const dynamicSeniJuriIds: Record<string, string | null> = {};
    for (let i = 1; i <= seniCount; i++) {
      const assignedRef = remain[(i - 1) % remain.length] || shuffled[(i - 1) % shuffled.length];
      dynamicSeniJuriIds[`juri${i}`] = assignedRef ? assignedRef.id : null;
    }

    const newAssignment: ArenaAssignment = {
      ...activeAssignment,
      ketuaPertandinganId: ketua.id,
      dewanId: dewan.id,
      wasitUtamaId: wasitPanggung.id,
      juri1Id: juri1.id,
      juri2Id: juri2.id,
      juri3Id: juri3.id,
      juriCadanganId: juriCad?.id || null,
      seniJumlahJuri: seniCount,
      seniJuriIds: dynamicSeniJuriIds
    };

    setLocalAssignments(prev => ({
      ...prev,
      [selectedArenaForAssign]: newAssignment
    }));

    showAlert('success', `Rotasi otomatis wasit & ${seniCount} juri seni berhasil diatur untuk ${activeAssignment.namaGelanggang}. Klik "Terapkan & Simpan" untuk konfirmasi.`);
  };

  // -------------------------------------------------------------
  // Reset Data Total Operations
  // -------------------------------------------------------------
  const [resetScope, setResetScope] = useState<'all_arenas' | 'single_arena'>('all_arenas');
  const [resetTargetArenaId, setResetTargetArenaId] = useState<string>(selectedArenaForAssign || currentArenaId || 'arena_1');
  const [resetType, setResetType] = useState<'all' | 'scores_only' | 'seni_only' | 'tanding_only' | 'history_only' | 'peserta_kontingen'>('all');
  const [resetNote, setResetNote] = useState<string>('');
  const [isResetModalOpen, setIsResetModalOpen] = useState<boolean>(false);
  const [resetConfirmText, setResetConfirmText] = useState<string>('');
  const [isConfirmUnderstood, setIsConfirmUnderstood] = useState<boolean>(false);
  const [isExecutingReset, setIsExecutingReset] = useState<boolean>(false);

  const handleOpenResetModal = () => {
    playBeep('warning');
    setResetConfirmText('');
    setIsConfirmUnderstood(false);
    setIsResetModalOpen(true);
  };

  const handleExecuteResetDataTotal = async () => {
    if (resetConfirmText.trim().toUpperCase() !== 'RESET') {
      showAlert('error', 'Silakan ketik kata "RESET" dengan huruf kapital untuk konfirmasi.');
      playBeep('warning');
      return;
    }
    if (!isConfirmUnderstood) {
      showAlert('error', 'Silakan centang persetujuan verifikasi terlebih dahulu.');
      playBeep('warning');
      return;
    }

    setIsExecutingReset(true);
    playBeep('warning');

    try {
      const res = await fetch('/api/admin/reset-total', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          scope: resetScope,
          targetArenaId: resetScope === 'single_arena' ? resetTargetArenaId : undefined,
          resetType,
          note: resetNote.trim() || undefined
        })
      });

      const data = await res.json();

      if (dispatch) {
        dispatch('RESET_DATA_TOTAL', {
          scope: resetScope,
          targetArenaId: resetScope === 'single_arena' ? resetTargetArenaId : undefined,
          resetType
        });
      }

      if (data.success) {
        if (resetType === 'peserta_kontingen' || resetType === 'all') {
          try {
            localStorage.removeItem('silat_registered_athletes');
            localStorage.removeItem('silat_bagan_categories');
            localStorage.removeItem('silat_bagan_data');
            localStorage.removeItem('silat_tgr_registered_athletes');
          } catch (e) {
            console.warn('Storage clear warning:', e);
          }
        }
        playBeep('valid');
        showAlert('success', data.message || 'Reset data total berhasil dieksekusi!');
        setIsResetModalOpen(false);
        setResetConfirmText('');
        setIsConfirmUnderstood(false);
        setResetNote('');
        fetchStorageStatus();
      } else {
        showAlert('error', data.error || 'Gagal mengeksekusi reset data total.');
        playBeep('alert');
      }
    } catch (err: any) {
      showAlert('error', 'Gagal menghubungi server: ' + err.message);
      playBeep('alert');
    } finally {
      setIsExecutingReset(false);
    }
  };

  // -------------------------------------------------------------
  // System Security: Change Password & Reset Master Data
  // -------------------------------------------------------------
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token) return;
    if (newPassword.length < 4) {
      showAlert('error', 'Password baru minimal 4 karakter.');
      return;
    }
    if (newPassword !== confirmPassword) {
      showAlert('error', 'Konfirmasi password tidak cocok.');
      return;
    }

    setIsChangingPassword(true);
    try {
      const res = await fetch('/api/admin/change-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ newPassword, confirmPassword })
      });
      const data = await res.json();
      if (data.success) {
        setNewPassword('');
        setConfirmPassword('');
        showAlert('success', 'Password administrator berhasil diperbarui.');
      } else {
        showAlert('error', data.error || 'Gagal mengubah password.');
      }
    } catch (err: any) {
      showAlert('error', 'Error: ' + err.message);
    } finally {
      setIsChangingPassword(false);
    }
  };

  const handleResetMasterData = async () => {
    if (!window.confirm("PERINGATAN: Anda akan mereset seluruh data master (turnamen, wasit, penugasan) ke template resmi standar IPSI. Lanjutkan?")) {
      return;
    }
    if (!token) return;

    try {
      const res = await fetch('/api/admin/reset-master-data', {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      if (data.success) {
        setLocalTournament(data.masterData.tournament);
        setLocalReferees(data.masterData.referees);
        setLocalAssignments(data.masterData.assignments);
        setLocalLogs(data.masterData.auditLogs);
        showAlert('success', 'Master data berhasil direset ke standar resmi IPSI!');
      } else {
        showAlert('error', data.error || 'Gagal mereset data.');
      }
    } catch (err: any) {
      showAlert('error', 'Error: ' + err.message);
    }
  };

  // Helper to find referee by ID
  const getRefName = (id?: string | null) => {
    if (!id) return '- Belum Ditugaskan -';
    const found = localReferees.find(r => r.id === id);
    if (!found) return id;
    return `${found.nama} (${found.lisensi} - ${found.pengprov})`;
  };

  // -------------------------------------------------------------
  // Penalty Icons Management Handlers (Layar Monitor Tanding)
  // -------------------------------------------------------------
  const handleSavePenaltyIcons = async () => {
    if (!token) return;
    setIsSavingPenaltyIcons(true);
    try {
      const res = await fetch('/api/admin/penalty-icons', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ penaltyIcons: localPenaltyIcons })
      });
      const data = await res.json();
      if (data.success) {
        // Persist locally and broadcast across tabs & windows
        try {
          localStorage.setItem('silat_penalty_icons_config', JSON.stringify(localPenaltyIcons));
          window.dispatchEvent(new CustomEvent('silat_penalty_icons_updated', { detail: localPenaltyIcons }));
          if (typeof BroadcastChannel !== 'undefined') {
            const bc = new BroadcastChannel('silat_penalty_icons');
            bc.postMessage(localPenaltyIcons);
            bc.close();
          }
        } catch (e) {
          console.error(e);
        }
        showAlert('success', 'Konfigurasi icon hukuman monitor tanding berhasil disimpan dan disinkronkan ke seluruh gelanggang!');
      } else {
        showAlert('error', data.error || 'Gagal menyimpan konfigurasi icon hukuman.');
      }
    } catch (err: any) {
      showAlert('error', 'Koneksi error: ' + (err.message || 'Gagal menghubungi server'));
    } finally {
      setIsSavingPenaltyIcons(false);
    }
  };

  const handleResetPenaltyIcons = () => {
    setLocalPenaltyIcons(DEFAULT_PENALTY_ICONS);
    showAlert('info', 'Icon dikembalikan ke bawaan referensi. Klik "Simpan & Terapkan Perubahan" untuk konfirmasi.');
  };

  const handleSelectPenaltyPreset = (preset: PenaltyIconConfig) => {
    setLocalPenaltyIcons(preset);
    showAlert('info', 'Preset icon dipilih. Klik "Simpan & Terapkan Perubahan" untuk menyinkronkan.');
  };

  const handleSelectPenaltySlotIcon = (slot: keyof PenaltyIconConfig, iconType: PenaltyIconType) => {
    setLocalPenaltyIcons(prev => ({ ...prev, [slot]: iconType }));
    setEditingPenaltySlot(null);
  };

  const getPenaltySlotMeta = (slot: keyof PenaltyIconConfig) => {
    switch (slot) {
      case 'slot1':
        return { name: 'Binaan 1', desc: 'Peringatan Lisan Pertama', rule: 'Tanpa pengurangan nilai', color: 'text-amber-400 border-amber-500/40 bg-amber-500/10' };
      case 'slot2':
        return { name: 'Binaan 2', desc: 'Peringatan Lisan Kedua', rule: 'Tanpa pengurangan nilai', color: 'text-amber-400 border-amber-500/40 bg-amber-500/10' };
      case 'slot3':
        return { name: 'Teguran 1', desc: 'Teguran Resmi Pertama', rule: 'Pengurangan -1 Poin', color: 'text-orange-400 border-orange-500/40 bg-orange-500/10' };
      case 'slot4':
        return { name: 'Teguran 2', desc: 'Teguran Resmi Kedua', rule: 'Pengurangan -2 Poin', color: 'text-orange-400 border-orange-500/40 bg-orange-500/10' };
      case 'slot5':
        return { name: 'Peringatan 1', desc: 'Peringatan Keras Pertama', rule: 'Pengurangan -5 Poin', color: 'text-red-400 border-red-500/40 bg-red-500/10' };
      case 'slot6':
        return { name: 'Peringatan 2', desc: 'Peringatan Keras Kedua', rule: 'Pengurangan -10 Poin', color: 'text-red-400 border-red-500/40 bg-red-500/10' };
    }
  };

  // Upload & Process Custom PNG Icon for Penalty Slots (with background removal)
  const [isProcessingPng, setIsProcessingPng] = useState(false);
  const [isPhotoUploaderOpen, setIsPhotoUploaderOpen] = useState(false);
  const [photoUploaderTargetSlot, setPhotoUploaderTargetSlot] = useState<keyof PenaltyIconConfig>('slot1');

  const handleOpenPhotoUploader = (slot: keyof PenaltyIconConfig) => {
    setPhotoUploaderTargetSlot(slot);
    setIsPhotoUploaderOpen(true);
  };

  const handleApplyUploadedPhoto = (slot: keyof PenaltyIconConfig, transparentDataUrl: string) => {
    setLocalPenaltyIcons(prev => ({
      ...prev,
      [slot]: transparentDataUrl,
      customImages: {
        ...(prev.customImages || {}),
        [slot]: transparentDataUrl
      }
    }));
    setEditingPenaltySlot(null);
    showAlert('success', `Foto tanpa background berhasil diterapkan untuk ${getPenaltySlotMeta(slot).name}! Silakan klik "Simpan & Terapkan Perubahan".`);
  };

  const handleUploadSlotPng = async (slot: keyof PenaltyIconConfig, file: File) => {
    if (!file) return;
    setIsProcessingPng(true);
    try {
      // Automatically clean white/light background on direct upload
      const optimizedDataUrl = await optimizePenaltyPng(file, 220, { mode: 'auto-light', tolerance: 35 });
      setLocalPenaltyIcons(prev => ({
        ...prev,
        [slot]: optimizedDataUrl,
        customImages: {
          ...(prev.customImages || {}),
          [slot]: optimizedDataUrl
        }
      }));
      setEditingPenaltySlot(null);
      showAlert('success', `Foto tanpa background berhasil diunggah untuk ${getPenaltySlotMeta(slot).name}! Jangan lupa klik tombol "Simpan & Terapkan Perubahan".`);
    } catch (err: any) {
      showAlert('error', err.message || 'Gagal memproses gambar.');
    } finally {
      setIsProcessingPng(false);
    }
  };

  const handleRemoveSlotPng = (slot: keyof PenaltyIconConfig) => {
    const defaultIcon = DEFAULT_PENALTY_ICONS[slot];
    setLocalPenaltyIcons(prev => {
      const updatedCustom = { ...(prev.customImages || {}) };
      delete updatedCustom[slot];
      return {
        ...prev,
        [slot]: defaultIcon,
        customImages: updatedCustom
      };
    });
    showAlert('info', `Gambar PNG untuk ${getPenaltySlotMeta(slot).name} dihapus dan kembali ke icon standar.`);
  };

  // =========================================================================
  // VIEW 1: UN-AUTHENTICATED LOGIN SCREEN
  // =========================================================================
  if (!token || !currentUser) {
    return (
      <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col justify-center items-center p-4 sm:p-6 relative overflow-hidden">
        {/* Background Subtle Ambience */}
        <div className="absolute inset-0 opacity-10 pointer-events-none bg-[radial-gradient(#3b82f6_1px,transparent_1px)] [background-size:24px_24px]" />
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />

        {/* Back to Portal Top Bar */}
        <div className="w-full max-w-md mb-6 flex justify-between items-center z-10">
          <button
            id="admin-login-back-btn"
            onClick={onBackToPortal}
            className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-slate-400 hover:text-white transition-colors bg-slate-900/80 border border-slate-800 px-3.5 py-2 rounded-xl"
          >
            <ArrowLeft className="w-4 h-4" />
            Kembali ke Portal
          </button>
          <div className="flex items-center gap-2 px-3 py-1 bg-amber-500/10 border border-amber-500/30 text-amber-400 text-xs font-semibold rounded-full">
            <Shield className="w-3.5 h-3.5" />
            IPSI Master Control
          </div>
        </div>

        {/* Main Authentication Card */}
        <div className="w-full max-w-md bg-slate-900/90 border border-slate-800 backdrop-blur-xl rounded-2xl shadow-2xl p-6 sm:p-8 z-10">
          {/* Header */}
          <div className="text-center mb-8">
            <div className="w-16 h-16 bg-gradient-to-tr from-amber-600 to-amber-400 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg shadow-amber-500/20 border border-amber-300/30">
              <Lock className="w-8 h-8 text-slate-950 stroke-[2.5]" />
            </div>
            <h1 className="text-2xl font-bold tracking-tight text-white mb-1.5">
              Portal Admin Sistem
            </h1>
            <p className="text-xs text-slate-400 leading-relaxed max-w-xs mx-auto">
              Akses terproteksi pengelolaan data master kejuaraan, daftar wasit & juri, dan distribusi gelanggang.
            </p>
          </div>

          {/* Error Alert */}
          {authError && (
            <div className="mb-5 p-3.5 bg-red-950/60 border border-red-800/80 text-red-200 rounded-xl text-xs flex items-start gap-2.5 animate-in fade-in duration-200">
              <AlertTriangle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
              <span>{authError}</span>
            </div>
          )}

          {/* Login Form */}
          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1.5">
                Username Administrator
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500">
                  <User className="w-4 h-4" />
                </div>
                <input
                  id="admin-username-input"
                  type="text"
                  required
                  value={loginUsername}
                  onChange={(e) => setLoginUsername(e.target.value)}
                  placeholder="admin"
                  className="w-full pl-10 pr-4 py-2.5 bg-slate-950/80 border border-slate-700/80 rounded-xl text-sm text-white placeholder-slate-500 focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500 transition-colors"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1.5">
                Password Administrator
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500">
                  <KeyRound className="w-4 h-4" />
                </div>
                <input
                  id="admin-password-input"
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={loginPassword}
                  onChange={(e) => setLoginPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full pl-10 pr-10 py-2.5 bg-slate-950/80 border border-slate-700/80 rounded-xl text-sm text-white placeholder-slate-500 focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500 transition-colors"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-500 hover:text-slate-300"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <button
              id="admin-submit-login-btn"
              type="submit"
              disabled={isSubmittingLogin}
              className="w-full mt-2 py-3 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 active:scale-[0.99] text-slate-950 font-bold text-sm rounded-xl shadow-lg shadow-amber-500/20 transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
            >
              {isSubmittingLogin ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  Memverifikasi Kredensial...
                </>
              ) : (
                <>
                  <ShieldCheck className="w-4 h-4" />
                  Masuk ke AdminPanel
                </>
              )}
            </button>
          </form>

          {/* Quick Credential Helper for Reviewers */}
          <div className="mt-6 pt-5 border-t border-slate-800/80">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">
                Kredensial Default Sistem
              </span>
              <button
                type="button"
                onClick={handleAutofillAdmin}
                className="text-[11px] text-amber-400 hover:text-amber-300 font-semibold underline underline-offset-2 cursor-pointer"
              >
                Isi Otomatis
              </button>
            </div>
            <div className="bg-slate-950/60 rounded-lg p-2.5 border border-slate-800/60 font-mono text-[11px] text-slate-300 space-y-1">
              <div className="flex justify-between">
                <span className="text-slate-500">Username:</span>
                <span className="text-amber-300 font-semibold">admin</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Password:</span>
                <span className="text-amber-300 font-semibold">admin@silat2026</span>
              </div>
            </div>
          </div>
        </div>

        {/* Footer info */}
        <p className="mt-6 text-xs text-slate-600 text-center">
          Sistem Skoring Digital & Manajemen Pertandingan Pencak Silat © 2026 IPSI
        </p>
      </div>
    );
  }

  // =========================================================================
  // VIEW 2: AUTHENTICATED SYSTEM ADMIN DASHBOARD
  // =========================================================================
  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col">
      {/* Toast Alert Banner */}
      {alertNotice && (
        <div
          className={`fixed top-4 right-4 z-50 px-4 py-3 rounded-xl shadow-2xl border text-sm font-medium flex items-center gap-3 animate-in slide-in-from-top-3 duration-200 ${
            alertNotice.type === 'success'
              ? 'bg-emerald-950 border-emerald-700 text-emerald-200'
              : alertNotice.type === 'error'
              ? 'bg-red-950 border-red-700 text-red-200'
              : 'bg-blue-950 border-blue-700 text-blue-200'
          }`}
        >
          {alertNotice.type === 'success' && <CheckCircle2 className="w-5 h-5 text-emerald-400" />}
          {alertNotice.type === 'error' && <AlertTriangle className="w-5 h-5 text-red-400" />}
          {alertNotice.type === 'info' && <Shield className="w-5 h-5 text-blue-400" />}
          <span>{alertNotice.message}</span>
        </div>
      )}

      {/* Top Navbar */}
      <header className="bg-slate-900/90 border-b border-slate-800 sticky top-0 z-30 backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              id="admin-header-back-btn"
              onClick={onBackToPortal}
              className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider"
              title="Kembali ke Portal Gelanggang"
            >
              <ArrowLeft className="w-4 h-4" />
              <span className="hidden sm:inline">Portal Gelanggang</span>
            </button>
            <div className="h-6 w-px bg-slate-800" />
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-400 font-bold text-sm">
                <ShieldCheck className="w-5 h-5" />
              </div>
              <div>
                <h1 className="text-sm font-bold text-white flex items-center gap-2">
                  AdminPanel
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30">
                    MASTER DATA
                  </span>
                </h1>
                <p className="text-[11px] text-slate-400 truncate max-w-xs sm:max-w-md">
                  {localTournament.namaEvent}
                </p>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {/* Live Cloud / Local Storage Status Indicator Badge */}
            <button
              onClick={() => {
                setActiveTab('storage');
                fetchStorageStatus();
              }}
              className={`hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-950 border text-xs transition-all cursor-pointer shadow-sm ${
                googleUser && googleSyncEnabled && googleSyncStatus === 'synced'
                  ? 'border-blue-500/50 text-blue-300 hover:border-blue-400 hover:bg-blue-950/40'
                  : 'border-emerald-500/40 text-emerald-300 hover:border-emerald-400 hover:bg-emerald-950/40'
              }`}
              title="Klik untuk membuka tab Penyimpanan Google Cloud & Lokal"
            >
              <span
                className={`w-2 h-2 rounded-full animate-pulse ${
                  googleUser && googleSyncEnabled && googleSyncStatus === 'synced' ? 'bg-blue-400' : 'bg-emerald-400'
                }`}
              />
              <span className="font-bold text-[11px] font-mono">
                {googleUser && googleSyncEnabled ? 'GOOGLE CLOUD:' : 'PENYIMPANAN:'}
              </span>
              <span className="text-[11px] font-medium">
                {googleUser && googleSyncEnabled
                  ? googleSyncStatus === 'synced'
                    ? 'Tersimpan'
                    : googleSyncStatus === 'connecting'
                    ? 'Menyinkronkan...'
                    : 'Error'
                  : storageStatus?.status === 'saving'
                  ? 'Menyimpan...'
                  : 'Lokal Aktif'}
              </span>
            </button>

            <div className="hidden md:flex flex-col text-right">
              <span className="text-xs font-bold text-slate-200">{currentUser.displayName}</span>
              <span className="text-[10px] text-emerald-400 flex items-center justify-end gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                Sesi Terautentikasi ({currentUser.role})
              </span>
            </div>

            <button
              id="admin-logout-btn"
              onClick={handleLogout}
              className="px-3 py-1.5 bg-red-950/40 hover:bg-red-900/60 border border-red-800/60 text-red-300 hover:text-red-100 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Keluar</span>
            </button>
          </div>
        </div>

        {/* Tab Navigation Navigation Bar */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 flex gap-2 overflow-x-auto border-t border-slate-800/60 py-2">
          <button
            id="tab-btn-tournament"
            onClick={() => setActiveTab('tournament')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-wider transition-all cursor-pointer whitespace-nowrap ${
              activeTab === 'tournament'
                ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/20'
                : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
            }`}
          >
            <Trophy className="w-4 h-4" />
            Master Turnamen
          </button>

          <button
            id="tab-btn-referees"
            onClick={() => setActiveTab('referees')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-wider transition-all cursor-pointer whitespace-nowrap ${
              activeTab === 'referees'
                ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/20'
                : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
            }`}
          >
            <Users className="w-4 h-4" />
            Master Wasit & Juri
            <span className="ml-1 px-1.5 py-0.2 rounded-full text-[10px] bg-slate-900 text-slate-300">
              {localReferees.length}
            </span>
          </button>

          <button
            id="tab-btn-assignments"
            onClick={() => setActiveTab('assignments')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-wider transition-all cursor-pointer whitespace-nowrap ${
              activeTab === 'assignments'
                ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/20'
                : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
            }`}
          >
            <LayoutGrid className="w-4 h-4" />
            Penugasan Gelanggang
          </button>

          <button
            id="tab-btn-penalty-icons"
            onClick={() => {
              setActiveTab('penalty_icons');
              fetchPenaltyIcons();
            }}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-wider transition-all cursor-pointer whitespace-nowrap ${
              activeTab === 'penalty_icons'
                ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/20'
                : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
            }`}
          >
            <Palette className="w-4 h-4" />
            Icon Hukuman Monitor
          </button>

          <button
            id="tab-btn-storage"
            onClick={() => {
              setActiveTab('storage');
              fetchStorageStatus();
            }}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-wider transition-all cursor-pointer whitespace-nowrap ${
              activeTab === 'storage'
                ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/20'
                : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
            }`}
          >
            <Cloud className="w-4 h-4" />
            Penyimpanan Google & Lokal
            <span
              className={`w-2 h-2 rounded-full animate-pulse ${
                googleUser && googleSyncStatus === 'synced' ? 'bg-blue-400' : 'bg-emerald-400'
              }`}
            />
          </button>

          <button
            id="tab-btn-security"
            onClick={() => setActiveTab('security')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-wider transition-all cursor-pointer whitespace-nowrap ${
              activeTab === 'security'
                ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/20'
                : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
            }`}
          >
            <Shield className="w-4 h-4" />
            Keamanan & Audit Log
          </button>

          <button
            id="tab-btn-reset-total"
            onClick={() => {
              playBeep('click');
              setActiveTab('reset_total');
            }}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-wider transition-all cursor-pointer whitespace-nowrap ${
              activeTab === 'reset_total'
                ? 'bg-rose-600 text-white shadow-md shadow-rose-600/30 ring-1 ring-rose-400'
                : 'text-rose-400 hover:text-white hover:bg-rose-950/50 border border-rose-900/40'
            }`}
          >
            <RotateCcw className="w-4 h-4" />
            Reset Data Total
            <span className="px-1.5 py-0.2 rounded-full text-[9px] font-black bg-rose-500 text-slate-950">
              RESET
            </span>
          </button>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6">
        {/* =================================================================== */}
        {/* TAB 1: MASTER TURNAMEN */}
        {/* =================================================================== */}
        {activeTab === 'tournament' && (
          <div className="space-y-6">
            {/* Quick Presets Banner */}
            <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-4 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
              <div>
                <h3 className="text-xs font-bold uppercase tracking-wider text-amber-400 flex items-center gap-2">
                  <Sliders className="w-4 h-4" />
                  Preset Cepat Kejuaraan
                </h3>
                <p className="text-xs text-slate-400">
                  Gunakan template resmi untuk mengisi data turnamen secara instan:
                </p>
              </div>
              <div className="flex flex-wrap gap-2">
                <button
                  onClick={() => applyTournamentPreset('kejurnas')}
                  className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-xs text-slate-200 font-medium rounded-lg border border-slate-700 transition-colors cursor-pointer"
                >
                  Kejurnas IPSI
                </button>
                <button
                  onClick={() => applyTournamentPreset('pon')}
                  className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-xs text-slate-200 font-medium rounded-lg border border-slate-700 transition-colors cursor-pointer"
                >
                  PON XXI
                </button>
                <button
                  onClick={() => applyTournamentPreset('kejurda')}
                  className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-xs text-slate-200 font-medium rounded-lg border border-slate-700 transition-colors cursor-pointer"
                >
                  Kejurda Jabar
                </button>
                <button
                  onClick={() => applyTournamentPreset('presiden')}
                  className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-xs text-slate-200 font-medium rounded-lg border border-slate-700 transition-colors cursor-pointer"
                >
                  Piala Presiden
                </button>
              </div>
            </div>

            {/* Quick Access Card: Pengaturan Icon Hukuman Layar Monitor */}
            <div className="bg-gradient-to-r from-blue-950/40 via-slate-900 to-amber-950/30 border border-amber-500/30 rounded-2xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-lg shadow-black/40">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-400 shrink-0">
                  <Palette className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-white flex items-center gap-2">
                    Icon Hukuman Layar Monitor Tanding
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30">
                      DAPAT DIUBAH
                    </span>
                  </h4>
                  <p className="text-xs text-slate-400">
                    Kustomisasi 6 gestur icon hukuman (Binaan, Teguran, Peringatan) pada layar monitor pertandingan penonton/official gelanggang.
                  </p>
                </div>
              </div>
              <button
                onClick={() => {
                  setActiveTab('penalty_icons');
                  fetchPenaltyIcons();
                }}
                className="px-4 py-2 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-bold text-xs rounded-xl shadow-md transition-all flex items-center gap-2 shrink-0 cursor-pointer self-start sm:self-auto"
              >
                <Palette className="w-4 h-4" />
                <span>Buka Konfigurasi Icon</span>
              </button>
            </div>

            {/* Tournament Details Form */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2 bg-slate-900/80 border border-slate-800 rounded-2xl p-5 sm:p-6 space-y-5">
                <div className="border-b border-slate-800 pb-3 flex items-center justify-between">
                  <div>
                    <h2 className="text-base font-bold text-white flex items-center gap-2">
                      <Trophy className="w-5 h-5 text-amber-400" />
                      Informasi Utama Turnamen
                    </h2>
                    <p className="text-xs text-slate-400">
                      Data ini ditampilkan pada seluruh monitor gelanggang, papan skor, dan sertifikat resmi.
                    </p>
                  </div>
                  <button
                    id="save-tournament-btn"
                    onClick={handleSaveTournament}
                    disabled={isSavingTournament}
                    className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-xl shadow-lg shadow-emerald-600/20 flex items-center gap-2 transition-all cursor-pointer disabled:opacity-50"
                  >
                    {isSavingTournament ? (
                      <>
                        <RefreshCw className="w-4 h-4 animate-spin" />
                        Menyimpan...
                      </>
                    ) : (
                      <>
                        <Save className="w-4 h-4" />
                        Simpan & Sinkronkan
                      </>
                    )}
                  </button>
                </div>

                <div className="space-y-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1">
                      Nama Resmi Turnamen / Kejuaraan <span className="text-amber-400">*</span>
                    </label>
                    <input
                      id="input-tournament-nama"
                      type="text"
                      required
                      value={localTournament.namaEvent}
                      onChange={(e) => setLocalTournament({ ...localTournament, namaEvent: e.target.value })}
                      className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-700 rounded-xl text-sm font-semibold text-white focus:outline-none focus:border-amber-500"
                      placeholder="e.g. Kejuaraan Nasional Pencak Silat IPSI 2026"
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-semibold text-slate-300 mb-1">
                        Sub-Judul / Perebutan Piala
                      </label>
                      <input
                        type="text"
                        value={localTournament.subJudul || ''}
                        onChange={(e) => setLocalTournament({ ...localTournament, subJudul: e.target.value })}
                        className="w-full px-3.5 py-2 bg-slate-950 border border-slate-700 rounded-xl text-sm text-slate-200 focus:outline-none focus:border-amber-500"
                        placeholder="e.g. Piala Menpora RI"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-300 mb-1">
                        Tingkat Kejuaraan
                      </label>
                      <select
                        value={localTournament.tingkatKejuaraan || 'Nasional'}
                        onChange={(e) => setLocalTournament({ ...localTournament, tingkatKejuaraan: e.target.value })}
                        className="w-full px-3.5 py-2 bg-slate-950 border border-slate-700 rounded-xl text-sm text-slate-200 focus:outline-none focus:border-amber-500"
                      >
                        <option value="Internasional">Internasional (PERSILAT)</option>
                        <option value="Nasional">Nasional (PB IPSI / Kejurnas)</option>
                        <option value="Provinsi">Provinsi (Pengprov IPSI / Kejurda / Porprov)</option>
                        <option value="Daerah">Kabupaten / Kota (Pengkab / Pengkot)</option>
                        <option value="Terbuka">Kejuaraan Terbuka / Open Tournament</option>
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1 flex items-center gap-1.5">
                      <MapPin className="w-3.5 h-3.5 text-amber-400" />
                      Lokasi / Venue Pertandingan
                    </label>
                    <input
                      type="text"
                      value={localTournament.lokasi || ''}
                      onChange={(e) => setLocalTournament({ ...localTournament, lokasi: e.target.value })}
                      className="w-full px-3.5 py-2 bg-slate-950 border border-slate-700 rounded-xl text-sm text-slate-200 focus:outline-none focus:border-amber-500"
                      placeholder="e.g. Padepokan Pencak Silat Indonesia, TMII Jakarta"
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-semibold text-slate-300 mb-1 flex items-center gap-1.5">
                        <Calendar className="w-3.5 h-3.5 text-amber-400" />
                        Tanggal Mulai
                      </label>
                      <input
                        type="date"
                        value={localTournament.tanggalMulai || ''}
                        onChange={(e) => setLocalTournament({ ...localTournament, tanggalMulai: e.target.value })}
                        className="w-full px-3.5 py-2 bg-slate-950 border border-slate-700 rounded-xl text-sm text-slate-200 focus:outline-none focus:border-amber-500"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-300 mb-1 flex items-center gap-1.5">
                        <Calendar className="w-3.5 h-3.5 text-amber-400" />
                        Tanggal Selesai
                      </label>
                      <input
                        type="date"
                        value={localTournament.tanggalSelesai || ''}
                        onChange={(e) => setLocalTournament({ ...localTournament, tanggalSelesai: e.target.value })}
                        className="w-full px-3.5 py-2 bg-slate-950 border border-slate-700 rounded-xl text-sm text-slate-200 focus:outline-none focus:border-amber-500"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-semibold text-slate-300 mb-1 flex items-center gap-1.5">
                        <Building className="w-3.5 h-3.5 text-amber-400" />
                        Penyelenggara Resmi
                      </label>
                      <input
                        type="text"
                        value={localTournament.penyelenggara || ''}
                        onChange={(e) => setLocalTournament({ ...localTournament, penyelenggara: e.target.value })}
                        className="w-full px-3.5 py-2 bg-slate-950 border border-slate-700 rounded-xl text-sm text-slate-200 focus:outline-none focus:border-amber-500"
                        placeholder="Pengurus Besar IPSI"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-300 mb-1">
                        Versi Aturan Pertandingan
                      </label>
                      <input
                        type="text"
                        value={localTournament.aturanVersi || ''}
                        onChange={(e) => setLocalTournament({ ...localTournament, aturanVersi: e.target.value })}
                        className="w-full px-3.5 py-2 bg-slate-950 border border-slate-700 rounded-xl text-sm text-slate-200 focus:outline-none focus:border-amber-500"
                        placeholder="Peraturan Pertandingan IPSI 2022"
                      />
                    </div>
                  </div>

                  <div className="pt-2 border-t border-slate-800 space-y-4">
                    <h4 className="text-xs font-bold uppercase tracking-wider text-amber-400">
                      Pejabat Teknis Tertinggi
                    </h4>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-medium text-slate-300 mb-1">
                          Delegasi Teknis (Technical Delegate)
                        </label>
                        <input
                          type="text"
                          value={localTournament.delegasiTeknis || ''}
                          onChange={(e) => setLocalTournament({ ...localTournament, delegasiTeknis: e.target.value })}
                          className="w-full px-3.5 py-2 bg-slate-950 border border-slate-700 rounded-xl text-sm text-slate-200 focus:outline-none focus:border-amber-500"
                          placeholder="Nama Technical Delegate"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-slate-300 mb-1">
                          Ketua Pertandingan Utama
                        </label>
                        <input
                          type="text"
                          value={localTournament.ketuaPertandinganUtama || ''}
                          onChange={(e) => setLocalTournament({ ...localTournament, ketuaPertandinganUtama: e.target.value })}
                          className="w-full px-3.5 py-2 bg-slate-950 border border-slate-700 rounded-xl text-sm text-slate-200 focus:outline-none focus:border-amber-500"
                          placeholder="Nama Ketua Pertandingan"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Logos & Live Preview Column */}
              <div className="space-y-6">
                <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-5 space-y-4">
                  <h3 className="text-sm font-bold text-white flex items-center gap-2">
                    <Award className="w-4 h-4 text-amber-400" />
                    Logo Resmi Turnamen
                  </h3>
                  <p className="text-xs text-slate-400">
                    Logo didistribusikan ke seluruh layar gelanggang tanding dan seni.
                  </p>

                  {/* Logo Kiri */}
                  <div className="bg-slate-950 p-3 rounded-xl border border-slate-800 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-semibold text-slate-300">Logo Kiri (IPSI / Penyelenggara)</span>
                      {localTournament.logoKiri && (
                        <button
                          type="button"
                          onClick={() => setLocalTournament({ ...localTournament, logoKiri: null })}
                          className="text-[10px] text-red-400 hover:text-red-300"
                        >
                          Hapus
                        </button>
                      )}
                    </div>
                    {localTournament.logoKiri ? (
                      <div className="h-16 flex items-center justify-center bg-slate-900 rounded-lg p-2">
                        <img src={localTournament.logoKiri} alt="Logo Kiri" className="max-h-full object-contain" />
                      </div>
                    ) : (
                      <label className="flex flex-col items-center justify-center h-16 border border-dashed border-slate-700 hover:border-amber-500 rounded-lg cursor-pointer bg-slate-900/40 transition-colors">
                        <Upload className="w-4 h-4 text-slate-400 mb-1" />
                        <span className="text-[11px] text-slate-400">Unggah Gambar Logo</span>
                        <input
                          type="file"
                          accept="image/*"
                          className="hidden"
                          onChange={(e) => e.target.files?.[0] && handleLogoUpload('kiri', e.target.files[0])}
                        />
                      </label>
                    )}
                  </div>

                  {/* Logo Kanan */}
                  <div className="bg-slate-950 p-3 rounded-xl border border-slate-800 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-semibold text-slate-300">Logo Kanan (Kemenpora / Sponsor)</span>
                      {localTournament.logoKanan && (
                        <button
                          type="button"
                          onClick={() => setLocalTournament({ ...localTournament, logoKanan: null })}
                          className="text-[10px] text-red-400 hover:text-red-300"
                        >
                          Hapus
                        </button>
                      )}
                    </div>
                    {localTournament.logoKanan ? (
                      <div className="h-16 flex items-center justify-center bg-slate-900 rounded-lg p-2">
                        <img src={localTournament.logoKanan} alt="Logo Kanan" className="max-h-full object-contain" />
                      </div>
                    ) : (
                      <label className="flex flex-col items-center justify-center h-16 border border-dashed border-slate-700 hover:border-amber-500 rounded-lg cursor-pointer bg-slate-900/40 transition-colors">
                        <Upload className="w-4 h-4 text-slate-400 mb-1" />
                        <span className="text-[11px] text-slate-400">Unggah Gambar Logo</span>
                        <input
                          type="file"
                          accept="image/*"
                          className="hidden"
                          onChange={(e) => e.target.files?.[0] && handleLogoUpload('kanan', e.target.files[0])}
                        />
                      </label>
                    )}
                  </div>
                </div>

                {/* Banner Preview Card */}
                <div className="bg-gradient-to-br from-slate-900 to-slate-950 border border-amber-500/30 rounded-2xl p-4 shadow-xl">
                  <div className="text-[10px] font-bold uppercase tracking-wider text-amber-400 mb-2 flex items-center gap-1.5">
                    <Check className="w-3 h-3 text-emerald-400" />
                    Preview Tampilan di Gelanggang
                  </div>
                  <div className="bg-black/60 p-4 rounded-xl border border-slate-800 text-center">
                    <h4 className="text-sm font-extrabold text-white tracking-wide uppercase">
                      {localTournament.namaEvent}
                    </h4>
                    {localTournament.subJudul && (
                      <p className="text-xs text-amber-300 font-medium mt-0.5">{localTournament.subJudul}</p>
                    )}
                    <p className="text-[11px] text-slate-400 mt-2">
                      {localTournament.lokasi || 'Padepokan Silat'} • {localTournament.tingkatKejuaraan}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* =================================================================== */}
        {/* TAB 2: MASTER WASIT & JURI */}
        {/* =================================================================== */}
        {activeTab === 'referees' && (
          <div className="space-y-6">
            {/* Top Stat Summary & Actions */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="bg-slate-900/80 border border-slate-800 p-3.5 rounded-xl">
                <span className="text-[11px] font-semibold text-slate-400 uppercase">Total Wasit / Juri</span>
                <p className="text-xl font-bold text-white mt-1">{localReferees.length}</p>
              </div>
              <div className="bg-slate-900/80 border border-slate-800 p-3.5 rounded-xl">
                <span className="text-[11px] font-semibold text-emerald-400 uppercase">Status Aktif</span>
                <p className="text-xl font-bold text-emerald-400 mt-1">
                  {localReferees.filter(r => r.status === 'aktif').length}
                </p>
              </div>
              <div className="bg-slate-900/80 border border-slate-800 p-3.5 rounded-xl">
                <span className="text-[11px] font-semibold text-amber-400 uppercase">Lisensi Nasional+</span>
                <p className="text-xl font-bold text-amber-400 mt-1">
                  {localReferees.filter(r => r.lisensi === 'Internasional' || r.lisensi === 'Nasional 1').length}
                </p>
              </div>
              <div className="bg-slate-900/80 border border-slate-800 p-3.5 rounded-xl">
                <span className="text-[11px] font-semibold text-blue-400 uppercase">Pengprov Terwakili</span>
                <p className="text-xl font-bold text-blue-400 mt-1">
                  {new Set(localReferees.map(r => r.pengprov)).size}
                </p>
              </div>
            </div>

            {/* Filter and Search Bar */}
            <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-4 flex flex-col md:flex-row gap-3 items-stretch md:items-center justify-between">
              <div className="flex-1 flex flex-col sm:flex-row gap-3">
                <div className="relative flex-1">
                  <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="text"
                    value={searchRefQuery}
                    onChange={(e) => setSearchRefQuery(e.target.value)}
                    placeholder="Cari nama wasit, no KTA, atau Pengprov..."
                    className="w-full pl-10 pr-4 py-2 bg-slate-950 border border-slate-700 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-500"
                  />
                </div>

                <div className="flex gap-2">
                  <select
                    value={filterLisensi}
                    onChange={(e) => setFilterLisensi(e.target.value)}
                    className="px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-xs text-slate-200 focus:outline-none focus:border-amber-500"
                  >
                    <option value="Semua">Semua Lisensi</option>
                    <option value="Internasional">Internasional</option>
                    <option value="Nasional 1">Nasional 1</option>
                    <option value="Nasional 2">Nasional 2</option>
                    <option value="Daerah">Daerah</option>
                  </select>

                  <select
                    value={filterKategori}
                    onChange={(e) => setFilterKategori(e.target.value)}
                    className="px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-xs text-slate-200 focus:outline-none focus:border-amber-500"
                  >
                    <option value="Semua">Semua Tugas</option>
                    <option value="Tanding">Tanding</option>
                    <option value="Seni">Seni (TGR)</option>
                  </select>
                </div>
              </div>

              <div className="flex gap-2">
                <button
                  id="add-referee-btn"
                  onClick={handleOpenAddReferee}
                  className="px-3.5 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs rounded-xl shadow-md flex items-center gap-1.5 transition-all cursor-pointer whitespace-nowrap"
                >
                  <Plus className="w-4 h-4" />
                  Tambah Wasit Baru
                </button>
              </div>
            </div>

            {/* Referees Table */}
            <div className="bg-slate-900/80 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs text-slate-300">
                  <thead className="bg-slate-950 text-slate-400 uppercase tracking-wider text-[11px] border-b border-slate-800">
                    <tr>
                      <th className="py-3 px-4 font-bold">Nama & Gelar</th>
                      <th className="py-3 px-4 font-bold">No. Registrasi / KTA</th>
                      <th className="py-3 px-4 font-bold">Lisensi</th>
                      <th className="py-3 px-4 font-bold">Pengprov / Asal</th>
                      <th className="py-3 px-4 font-bold">Tugas</th>
                      <th className="py-3 px-4 font-bold">Status</th>
                      <th className="py-3 px-4 font-bold text-right">Aksi</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60">
                    {filteredReferees.length === 0 ? (
                      <tr>
                        <td colSpan={7} className="py-8 text-center text-slate-500">
                          Tidak ada data wasit/juri yang sesuai dengan pencarian atau filter.
                        </td>
                      </tr>
                    ) : (
                      filteredReferees.map((ref) => (
                        <tr key={ref.id} className="hover:bg-slate-800/40 transition-colors">
                          <td className="py-3.5 px-4">
                            <div className="font-bold text-white text-sm">{ref.nama}</div>
                            {ref.catatan && <div className="text-[11px] text-slate-400">{ref.catatan}</div>}
                          </td>
                          <td className="py-3.5 px-4 font-mono text-[11px] text-slate-300">
                            {ref.nomorRegistrasi || '-'}
                          </td>
                          <td className="py-3.5 px-4">
                            <span
                              className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                                ref.lisensi === 'Internasional'
                                  ? 'bg-purple-500/20 text-purple-300 border border-purple-500/30'
                                  : ref.lisensi === 'Nasional 1'
                                  ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                                  : ref.lisensi === 'Nasional 2'
                                  ? 'bg-blue-500/20 text-blue-300 border border-blue-500/30'
                                  : 'bg-slate-700/50 text-slate-300'
                              }`}
                            >
                              {ref.lisensi}
                            </span>
                          </td>
                          <td className="py-3.5 px-4 font-medium text-slate-200">{ref.pengprov}</td>
                          <td className="py-3.5 px-4">
                            <span className="px-2 py-0.5 bg-slate-800 rounded text-[10px] text-slate-300">
                              {ref.kategoriTugas}
                            </span>
                          </td>
                          <td className="py-3.5 px-4">
                            <span
                              className={`inline-flex items-center gap-1 text-[11px] font-semibold ${
                                ref.status === 'aktif'
                                  ? 'text-emerald-400'
                                  : ref.status === 'cadangan'
                                  ? 'text-amber-400'
                                  : 'text-slate-400'
                              }`}
                            >
                              <span
                                className={`w-1.5 h-1.5 rounded-full ${
                                  ref.status === 'aktif'
                                    ? 'bg-emerald-400'
                                    : ref.status === 'cadangan'
                                    ? 'bg-amber-400'
                                    : 'bg-slate-400'
                                }`}
                              />
                              {ref.status.toUpperCase()}
                            </span>
                          </td>
                          <td className="py-3.5 px-4 text-right">
                            <div className="flex items-center justify-end gap-1.5">
                              <button
                                onClick={() => handleOpenEditReferee(ref)}
                                className="p-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white rounded-lg transition-colors cursor-pointer"
                                title="Edit Wasit"
                              >
                                <Pencil className="w-3.5 h-3.5" />
                              </button>
                              <button
                                onClick={() => handleDeleteReferee(ref.id, ref.nama)}
                                className="p-1.5 bg-red-950/40 hover:bg-red-900/60 text-red-400 hover:text-red-200 rounded-lg transition-colors cursor-pointer"
                                title="Hapus Wasit"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Modal: Add or Edit Referee */}
            {showRefModal && (
              <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in duration-150">
                <div className="bg-slate-900 border border-slate-800 w-full max-w-lg rounded-2xl shadow-2xl p-6 relative">
                  <div className="flex items-center justify-between border-b border-slate-800 pb-3 mb-4">
                    <h3 className="text-base font-bold text-white flex items-center gap-2">
                      <UserCheck className="w-5 h-5 text-amber-400" />
                      {editingReferee ? 'Edit Data Wasit / Juri' : 'Tambah Wasit / Juri Baru'}
                    </h3>
                    <button
                      onClick={() => setShowRefModal(false)}
                      className="text-slate-400 hover:text-white p-1 rounded-lg"
                    >
                      <X className="w-5 h-5" />
                    </button>
                  </div>

                  <form onSubmit={handleSaveRefereeModal} className="space-y-4">
                    <div>
                      <label className="block text-xs font-semibold text-slate-300 mb-1">
                        Nama Lengkap & Gelar <span className="text-amber-400">*</span>
                      </label>
                      <input
                        type="text"
                        required
                        value={refForm.nama || ''}
                        onChange={(e) => setRefForm({ ...refForm, nama: e.target.value })}
                        className="w-full px-3.5 py-2 bg-slate-950 border border-slate-700 rounded-xl text-sm text-white focus:outline-none focus:border-amber-500"
                        placeholder="e.g. Dr. H. Suwandi, M.Pd"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-semibold text-slate-300 mb-1">
                          Lisensi Resmi
                        </label>
                        <select
                          value={refForm.lisensi || 'Nasional 1'}
                          onChange={(e: any) => setRefForm({ ...refForm, lisensi: e.target.value })}
                          className="w-full px-3.5 py-2 bg-slate-950 border border-slate-700 rounded-xl text-sm text-slate-200 focus:outline-none focus:border-amber-500"
                        >
                          <option value="Internasional">Internasional (PERSILAT)</option>
                          <option value="Nasional 1">Wasit Juri Nasional 1</option>
                          <option value="Nasional 2">Wasit Juri Nasional 2</option>
                          <option value="Daerah">Wasit Juri Daerah</option>
                          <option value="Kader">Kader / Magang</option>
                        </select>
                      </div>

                      <div>
                        <label className="block text-xs font-semibold text-slate-300 mb-1">
                          Pengprov / Daerah Asal
                        </label>
                        <input
                          type="text"
                          required
                          value={refForm.pengprov || ''}
                          onChange={(e) => setRefForm({ ...refForm, pengprov: e.target.value })}
                          className="w-full px-3.5 py-2 bg-slate-950 border border-slate-700 rounded-xl text-sm text-white focus:outline-none focus:border-amber-500"
                          placeholder="e.g. Jawa Barat, DKI, dsb"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-semibold text-slate-300 mb-1">
                          Kategori Tugas
                        </label>
                        <select
                          value={refForm.kategoriTugas || 'Semua'}
                          onChange={(e: any) => setRefForm({ ...refForm, kategoriTugas: e.target.value })}
                          className="w-full px-3.5 py-2 bg-slate-950 border border-slate-700 rounded-xl text-sm text-slate-200 focus:outline-none focus:border-amber-500"
                        >
                          <option value="Semua">Semua (Tanding & Seni)</option>
                          <option value="Tanding">Khusus Tanding</option>
                          <option value="Seni">Khusus Seni (TGR)</option>
                        </select>
                      </div>

                      <div>
                        <label className="block text-xs font-semibold text-slate-300 mb-1">
                          Status Kesiapan
                        </label>
                        <select
                          value={refForm.status || 'aktif'}
                          onChange={(e: any) => setRefForm({ ...refForm, status: e.target.value })}
                          className="w-full px-3.5 py-2 bg-slate-950 border border-slate-700 rounded-xl text-sm text-slate-200 focus:outline-none focus:border-amber-500"
                        >
                          <option value="aktif">Aktif Bertugas</option>
                          <option value="cadangan">Wasit Cadangan</option>
                          <option value="istirahat">Istirahat / Rotasi</option>
                        </select>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-semibold text-slate-300 mb-1">
                          No. KTA / Registrasi IPSI
                        </label>
                        <input
                          type="text"
                          value={refForm.nomorRegistrasi || ''}
                          onChange={(e) => setRefForm({ ...refForm, nomorRegistrasi: e.target.value })}
                          className="w-full px-3.5 py-2 bg-slate-950 border border-slate-700 rounded-xl text-sm text-white focus:outline-none focus:border-amber-500"
                          placeholder="e.g. WJ-NAS1-1029"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-semibold text-slate-300 mb-1">
                          No. Telepon / WhatsApp
                        </label>
                        <input
                          type="text"
                          value={refForm.telepon || ''}
                          onChange={(e) => setRefForm({ ...refForm, telepon: e.target.value })}
                          className="w-full px-3.5 py-2 bg-slate-950 border border-slate-700 rounded-xl text-sm text-white focus:outline-none focus:border-amber-500"
                          placeholder="0812-xxxx-xxxx"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-300 mb-1">
                        Catatan Khusus
                      </label>
                      <input
                        type="text"
                        value={refForm.catatan || ''}
                        onChange={(e) => setRefForm({ ...refForm, catatan: e.target.value })}
                        className="w-full px-3.5 py-2 bg-slate-950 border border-slate-700 rounded-xl text-sm text-white focus:outline-none focus:border-amber-500"
                        placeholder="e.g. Koordinator Matras Utama, Dewan Hakim"
                      />
                    </div>

                    <div className="pt-3 border-t border-slate-800 flex justify-end gap-3">
                      <button
                        type="button"
                        onClick={() => setShowRefModal(false)}
                        className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold rounded-xl"
                      >
                        Batal
                      </button>
                      <button
                        type="submit"
                        className="px-5 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-bold rounded-xl shadow-lg shadow-amber-500/20 cursor-pointer"
                      >
                        {editingReferee ? 'Perbarui Wasit' : 'Simpan Wasit'}
                      </button>
                    </div>
                  </form>
                </div>
              </div>
            )}
          </div>
        )}

        {/* =================================================================== */}
        {/* TAB 3: PENUGASAN GELANGGANG */}
        {/* =================================================================== */}
        {activeTab === 'assignments' && (
          <div className="space-y-6">
            {/* Arena Selection Bar */}
            <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
                  Pilih Gelanggang:
                </span>
                <div className="flex gap-2">
                  {arenasList.map((arena) => (
                    <button
                      key={arena.id}
                      onClick={() => {
                        setSelectedArenaForAssign(arena.id);
                        if (onSelectArena) onSelectArena(arena.id);
                      }}
                      className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                        selectedArenaForAssign === arena.id
                          ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/20'
                          : 'bg-slate-950 border border-slate-700 text-slate-300 hover:text-white'
                      }`}
                    >
                      {arena.nama} ({arena.modeAktif === 'seni' ? 'Seni' : 'Tanding'})
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  id="auto-assign-btn"
                  onClick={handleAutoAssign}
                  className="px-3.5 py-2 bg-blue-600/20 hover:bg-blue-600/30 border border-blue-500/40 text-blue-300 hover:text-blue-100 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
                  title="Rotasi Wasit Otomatis"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                  Rotasi Otomatis
                </button>
                <button
                  id="save-assignment-btn"
                  onClick={handleSaveAssignment}
                  disabled={isSavingAssignment}
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded-xl shadow-lg shadow-emerald-600/20 flex items-center gap-2 transition-all cursor-pointer disabled:opacity-50"
                >
                  {isSavingAssignment ? (
                    <>
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                      Menyimpan...
                    </>
                  ) : (
                    <>
                      <Save className="w-3.5 h-3.5" />
                      Terapkan & Simpan
                    </>
                  )}
                </button>
              </div>
            </div>

            {/* Matras Layout & Assignment Board */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Left 2 Cols: Assignment Slots */}
              <div className="lg:col-span-2 space-y-6">
                {/* General Session / Shift */}
                <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-5 space-y-4">
                  <h3 className="text-sm font-bold text-white flex items-center gap-2 border-b border-slate-800 pb-3">
                    <LayoutGrid className="w-4 h-4 text-amber-400" />
                    Penugasan Pimpinan Gelanggang & Dewan ({activeAssignment.namaGelanggang})
                  </h3>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-semibold text-slate-300 mb-1">
                        Sesi / Shift Tugas
                      </label>
                      <select
                        value={activeAssignment.shift || 'Sesi 1 (Pagi - Siang)'}
                        onChange={(e) => handleUpdateAssignmentField('shift', e.target.value)}
                        className="w-full px-3.5 py-2 bg-slate-950 border border-slate-700 rounded-xl text-xs text-slate-200 focus:outline-none focus:border-amber-500"
                      >
                        <option value="Sesi 1 (Pagi - Siang)">Sesi 1 (Pagi - Siang: 08:00 - 12:00)</option>
                        <option value="Sesi 2 (Siang - Sore)">Sesi 2 (Siang - Sore: 13:00 - 17:30)</option>
                        <option value="Sesi 3 (Malam)">Sesi 3 (Malam: 19:00 - 22:30)</option>
                        <option value="Sepanjang Hari">Sepanjang Hari (All Day)</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-300 mb-1">
                        Status Kesiapan Gelanggang
                      </label>
                      <select
                        value={activeAssignment.status || 'bertugas'}
                        onChange={(e) => handleUpdateAssignmentField('status', e.target.value)}
                        className="w-full px-3.5 py-2 bg-slate-950 border border-slate-700 rounded-xl text-xs text-slate-200 focus:outline-none focus:border-amber-500"
                      >
                        <option value="bertugas">Sedang Bertugas (Siap Memimpin)</option>
                        <option value="siap">Standby / Menunggu Partai</option>
                        <option value="rotasi">Proses Rotasi / Pergantian Shift</option>
                      </select>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                    <div>
                      <label className="block text-xs font-semibold text-amber-300 mb-1">
                        Ketua Pertandingan Gelanggang
                      </label>
                      <select
                        value={activeAssignment.ketuaPertandinganId || ''}
                        onChange={(e) => handleUpdateAssignmentField('ketuaPertandinganId', e.target.value || null)}
                        className="w-full px-3.5 py-2 bg-slate-950 border border-slate-700 rounded-xl text-xs text-white font-medium focus:outline-none focus:border-amber-500"
                      >
                        <option value="">- Pilih dari Wasit Terdaftar -</option>
                        {localReferees.map(r => (
                          <option key={r.id} value={r.id}>
                            {r.nama} ({r.lisensi} - {r.pengprov})
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-amber-300 mb-1">
                        Dewan Wasit / Hakim Juri
                      </label>
                      <select
                        value={activeAssignment.dewanId || ''}
                        onChange={(e) => handleUpdateAssignmentField('dewanId', e.target.value || null)}
                        className="w-full px-3.5 py-2 bg-slate-950 border border-slate-700 rounded-xl text-xs text-white font-medium focus:outline-none focus:border-amber-500"
                      >
                        <option value="">- Pilih dari Wasit Terdaftar -</option>
                        {localReferees.map(r => (
                          <option key={r.id} value={r.id}>
                            {r.nama} ({r.lisensi} - {r.pengprov})
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                </div>

                {/* TANDING OFFICIALS */}
                <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-5 space-y-4">
                  <h3 className="text-sm font-bold text-white flex items-center justify-between border-b border-slate-800 pb-3">
                    <span className="flex items-center gap-2">
                      <Shield className="w-4 h-4 text-emerald-400" />
                      Perangkat Pertandingan Kategori TANDING
                    </span>
                    <span className="text-[10px] font-bold px-2 py-0.5 bg-emerald-950/60 border border-emerald-700/60 text-emerald-300 rounded-full">
                      1 Wasit Panggung + 3 Juri Sudut
                    </span>
                  </h3>

                  {/* Wasit Utama */}
                  <div>
                    <label className="block text-xs font-bold text-emerald-300 mb-1">
                      Wasit Utama (Wasit Panggung / Wasit Gelanggang)
                    </label>
                    <select
                      value={activeAssignment.wasitUtamaId || ''}
                      onChange={(e) => handleUpdateAssignmentField('wasitUtamaId', e.target.value || null)}
                      className="w-full px-3.5 py-2 bg-slate-950 border border-slate-700 rounded-xl text-xs text-white font-medium focus:outline-none focus:border-amber-500"
                    >
                      <option value="">- Pilih Wasit Panggung -</option>
                      {localReferees.filter(r => r.kategoriTugas !== 'Seni').map(r => (
                        <option key={r.id} value={r.id}>
                          {r.nama} ({r.lisensi} - {r.pengprov})
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Juri 1, 2, 3 */}
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
                    <div className="bg-slate-950 p-3 rounded-xl border border-slate-800">
                      <label className="block text-[11px] font-bold text-slate-300 mb-1">
                        Juri Sudut 1
                      </label>
                      <select
                        value={activeAssignment.juri1Id || ''}
                        onChange={(e) => handleUpdateAssignmentField('juri1Id', e.target.value || null)}
                        className="w-full px-2.5 py-1.5 bg-slate-900 border border-slate-700 rounded-lg text-xs text-white focus:outline-none focus:border-amber-500"
                      >
                        <option value="">- Pilih Juri 1 -</option>
                        {localReferees.map(r => (
                          <option key={r.id} value={r.id}>
                            {r.nama} ({r.lisensi})
                          </option>
                        ))}
                      </select>
                    </div>

                    <div className="bg-slate-950 p-3 rounded-xl border border-slate-800">
                      <label className="block text-[11px] font-bold text-slate-300 mb-1">
                        Juri Sudut 2
                      </label>
                      <select
                        value={activeAssignment.juri2Id || ''}
                        onChange={(e) => handleUpdateAssignmentField('juri2Id', e.target.value || null)}
                        className="w-full px-2.5 py-1.5 bg-slate-900 border border-slate-700 rounded-lg text-xs text-white focus:outline-none focus:border-amber-500"
                      >
                        <option value="">- Pilih Juri 2 -</option>
                        {localReferees.map(r => (
                          <option key={r.id} value={r.id}>
                            {r.nama} ({r.lisensi})
                          </option>
                        ))}
                      </select>
                    </div>

                    <div className="bg-slate-950 p-3 rounded-xl border border-slate-800">
                      <label className="block text-[11px] font-bold text-slate-300 mb-1">
                        Juri Sudut 3
                      </label>
                      <select
                        value={activeAssignment.juri3Id || ''}
                        onChange={(e) => handleUpdateAssignmentField('juri3Id', e.target.value || null)}
                        className="w-full px-2.5 py-1.5 bg-slate-900 border border-slate-700 rounded-lg text-xs text-white focus:outline-none focus:border-amber-500"
                      >
                        <option value="">- Pilih Juri 3 -</option>
                        {localReferees.map(r => (
                          <option key={r.id} value={r.id}>
                            {r.nama} ({r.lisensi})
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  {/* Cadangan */}
                  <div className="pt-2">
                    <label className="block text-[11px] font-medium text-slate-400 mb-1">
                      Wasit / Juri Cadangan (Standby)
                    </label>
                    <select
                      value={activeAssignment.juriCadanganId || ''}
                      onChange={(e) => handleUpdateAssignmentField('juriCadanganId', e.target.value || null)}
                      className="w-full px-3 py-1.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-300 focus:outline-none focus:border-amber-500"
                    >
                      <option value="">- Tanpa Cadangan Khusus -</option>
                      {localReferees.map(r => (
                        <option key={r.id} value={r.id}>
                          {r.nama} ({r.lisensi} - {r.pengprov})
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* SENI OFFICIALS */}
                <div className="bg-slate-900/80 border border-purple-900/40 rounded-2xl p-5 space-y-4 shadow-lg shadow-purple-950/20">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-3">
                    <div>
                      <h3 className="text-sm font-bold text-white flex items-center gap-2">
                        <Award className="w-4 h-4 text-purple-400" />
                        Perangkat Pertandingan Kategori SENI (TGR & Solo Kreatif)
                      </h3>
                      <p className="text-xs text-slate-400">
                        Atur jumlah juri penilai yang bertugas aktif untuk kategori seni pada gelanggang ini.
                      </p>
                    </div>
                    <div className="flex items-center gap-2 self-start sm:self-auto">
                      <span className="text-[11px] font-bold px-3 py-1 bg-purple-950/80 border border-purple-500/50 text-purple-200 rounded-full flex items-center gap-1.5 shadow-sm">
                        <span className="w-2 h-2 rounded-full bg-purple-400 animate-pulse" />
                        {activeAssignment.seniJumlahJuri || 5} Juri Bertugas Aktif
                      </span>
                    </div>
                  </div>

                  {/* Pengaturan Berapa Juri yang Bertugas Aktif untuk Seni */}
                  <div className="bg-slate-950 p-4 rounded-xl border border-purple-800/40 space-y-3">
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
                      <div>
                        <label className="text-xs font-bold text-purple-300 flex items-center gap-1.5">
                          <Sliders className="w-3.5 h-3.5 text-purple-400" />
                          Pengaturan Jumlah Juri Seni yang Bertugas Aktif:
                        </label>
                        <p className="text-[11px] text-slate-400 mt-0.5">
                          Sistem penilaian otomatis menghitung median (nilai tengah) & deviasi standar dari jumlah juri ini.
                        </p>
                      </div>

                      {/* Stepper & Counter */}
                      <div className="flex items-center gap-2 self-start md:self-auto">
                        <div className="flex items-center bg-slate-900 border border-slate-700 rounded-xl p-1">
                          <button
                            type="button"
                            onClick={() => handleSetSeniJumlahJuri(Math.max(1, (activeAssignment.seniJumlahJuri || 5) - 1), applyJudgeCountToAllArenas)}
                            disabled={(activeAssignment.seniJumlahJuri || 5) <= 1}
                            className="w-7 h-7 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 flex items-center justify-center font-bold text-sm disabled:opacity-40 cursor-pointer"
                            title="Kurangi 1 Juri"
                          >
                            -
                          </button>
                          <span className="w-12 text-center font-black text-sm text-purple-300 font-mono">
                            {activeAssignment.seniJumlahJuri || 5}
                          </span>
                          <button
                            type="button"
                            onClick={() => handleSetSeniJumlahJuri(Math.min(10, (activeAssignment.seniJumlahJuri || 5) + 1), applyJudgeCountToAllArenas)}
                            disabled={(activeAssignment.seniJumlahJuri || 5) >= 10}
                            className="w-7 h-7 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 flex items-center justify-center font-bold text-sm disabled:opacity-40 cursor-pointer"
                            title="Tambah 1 Juri"
                          >
                            +
                          </button>
                        </div>
                        <span className="text-xs font-bold text-slate-400">Juri (1-10)</span>
                      </div>
                    </div>

                    {/* Quick Presets Buttons */}
                    <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-slate-800/80">
                      <span className="text-[11px] font-semibold text-slate-400">Preset Resmi:</span>
                      {[
                        { count: 3, label: '3 Juri', badge: 'Cepat/Lokal' },
                        { count: 5, label: '5 Juri', badge: 'Standar PB IPSI' },
                        { count: 6, label: '6 Juri', badge: 'Standar 6' },
                        { count: 8, label: '8 Juri', badge: 'Standar 8' },
                        { count: 10, label: '10 Juri', badge: 'PERSILAT Internasional' }
                      ].map(preset => {
                        const isActive = (activeAssignment.seniJumlahJuri || 5) === preset.count;
                        return (
                          <button
                            key={preset.count}
                            type="button"
                            onClick={() => handleSetSeniJumlahJuri(preset.count, applyJudgeCountToAllArenas)}
                            className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                              isActive
                                ? 'bg-purple-600 text-white shadow-md shadow-purple-600/30 ring-1 ring-purple-400'
                                : 'bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-700 hover:border-slate-600'
                            }`}
                          >
                            <span>{preset.label}</span>
                            <span className={`text-[9px] px-1.5 py-0.2 rounded-full font-semibold ${
                              isActive ? 'bg-purple-950 text-purple-200' : 'bg-slate-800 text-slate-400'
                            }`}>
                              {preset.badge}
                            </span>
                          </button>
                        );
                      })}
                    </div>

                    {/* Checkbox: Terapkan ke semua gelanggang */}
                    <div className="flex items-center justify-between pt-1 text-xs">
                      <label className="flex items-center gap-2 cursor-pointer text-slate-300 hover:text-white select-none">
                        <input
                          type="checkbox"
                          checked={applyJudgeCountToAllArenas}
                          onChange={(e) => setApplyJudgeCountToAllArenas(e.target.checked)}
                          className="w-4 h-4 rounded text-purple-600 focus:ring-purple-500 bg-slate-900 border-slate-700 cursor-pointer"
                        />
                        <span className="text-[11px] font-medium">
                          Terapkan pengaturan jumlah juri ini ke <strong className="text-purple-300">SEMUA Gelanggang</strong> sekaligus
                        </span>
                      </label>
                    </div>
                  </div>

                  {/* Dynamic Slots Penugasan Juri Seni 1..N */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-xs text-slate-400">
                      <span className="font-semibold">
                        Slot Penugasan Juri Seni Aktif (Juri 1 s/d Juri {activeAssignment.seniJumlahJuri || 5}):
                      </span>
                      <span className="text-[11px] text-purple-300 font-mono">
                        {Array.from({ length: activeAssignment.seniJumlahJuri || 5 }, (_, i) => `juri${i + 1}`)
                          .filter(k => !!activeAssignment.seniJuriIds?.[k]).length} dari {activeAssignment.seniJumlahJuri || 5} terisi
                      </span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                      {Array.from({ length: activeAssignment.seniJumlahJuri || 5 }, (_, i) => i + 1).map((num) => {
                        const key = `juri${num}`;
                        const val = activeAssignment.seniJuriIds?.[key] || '';
                        return (
                          <div key={key} className="bg-slate-950 p-2.5 rounded-xl border border-slate-800 hover:border-purple-800/60 transition-colors">
                            <label className="block text-[10px] font-bold uppercase text-purple-300 mb-1 flex items-center justify-between">
                              <span>Juri Seni {num}</span>
                              {val ? (
                                <span className="w-2 h-2 rounded-full bg-emerald-400" title="Terisi" />
                              ) : (
                                <span className="text-[9px] text-amber-400 font-normal">Belum Diisi</span>
                              )}
                            </label>
                            <select
                              value={val}
                              onChange={(e) => handleUpdateSeniJuri(key, e.target.value || null)}
                              className="w-full px-2 py-1.5 bg-slate-900 border border-slate-700 rounded-lg text-xs text-white focus:outline-none focus:border-purple-500 font-medium"
                            >
                              <option value="">- Kosongkan Slot -</option>
                              {localReferees.map(r => (
                                <option key={r.id} value={r.id}>
                                  {r.nama} ({r.lisensi})
                                </option>
                              ))}
                            </select>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
              </div>

              {/* Right Col: Visual Arena Status & Roster Board */}
              <div className="space-y-6">
                <div className="bg-gradient-to-br from-slate-900 to-slate-950 border border-amber-500/30 rounded-2xl p-5 shadow-2xl">
                  <div className="flex items-center justify-between mb-4">
                    <span className="text-xs font-bold text-amber-400 uppercase tracking-wider flex items-center gap-1.5">
                      <ShieldCheck className="w-4 h-4 text-amber-400" />
                      Roster Terpasang di {activeAssignment.namaGelanggang}
                    </span>
                    <span className="text-[10px] font-bold px-2 py-0.5 bg-emerald-950 border border-emerald-700 text-emerald-300 rounded-full">
                      Siap
                    </span>
                  </div>

                  <div className="space-y-3 font-sans text-xs">
                    <div className="bg-slate-950/80 p-3 rounded-xl border border-slate-800">
                      <span className="text-[10px] uppercase font-bold text-slate-400 block mb-0.5">
                        Ketua Pertandingan
                      </span>
                      <p className="font-bold text-amber-300 text-sm">
                        {getRefName(activeAssignment.ketuaPertandinganId)}
                      </p>
                    </div>

                    <div className="bg-slate-950/80 p-3 rounded-xl border border-slate-800">
                      <span className="text-[10px] uppercase font-bold text-slate-400 block mb-0.5">
                        Dewan Wasit / Hakim
                      </span>
                      <p className="font-bold text-slate-200">
                        {getRefName(activeAssignment.dewanId)}
                      </p>
                    </div>

                    <div className="bg-slate-950/80 p-3 rounded-xl border border-emerald-900/60">
                      <span className="text-[10px] uppercase font-bold text-emerald-400 block mb-0.5">
                        Wasit Panggung (Utama)
                      </span>
                      <p className="font-bold text-emerald-300">
                        {getRefName(activeAssignment.wasitUtamaId)}
                      </p>
                    </div>

                    <div className="bg-slate-950/80 p-3 rounded-xl border border-slate-800 space-y-1.5">
                      <span className="text-[10px] uppercase font-bold text-slate-400 block mb-1">
                        Juri Sudut Tanding (3 Juri)
                      </span>
                      <div className="flex justify-between items-center text-xs">
                        <span className="text-slate-400">Juri 1:</span>
                        <span className="font-semibold text-slate-200">{getRefName(activeAssignment.juri1Id)}</span>
                      </div>
                      <div className="flex justify-between items-center text-xs">
                        <span className="text-slate-400">Juri 2:</span>
                        <span className="font-semibold text-slate-200">{getRefName(activeAssignment.juri2Id)}</span>
                      </div>
                      <div className="flex justify-between items-center text-xs">
                        <span className="text-slate-400">Juri 3:</span>
                        <span className="font-semibold text-slate-200">{getRefName(activeAssignment.juri3Id)}</span>
                      </div>
                    </div>

                    {/* Seni Judges Roster */}
                    <div className="bg-slate-950/80 p-3 rounded-xl border border-purple-900/60 space-y-1.5">
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] uppercase font-bold text-purple-400 block">
                          Juri Seni Aktif ({activeAssignment.seniJumlahJuri || 5} Juri)
                        </span>
                        <span className="text-[10px] font-mono text-purple-300">
                          {(activeAssignment.seniJumlahJuri || 5) <= 5 ? 'PB IPSI' : 'PERSILAT'}
                        </span>
                      </div>
                      <div className="grid grid-cols-2 gap-1.5 text-[11px] pt-1">
                        {Array.from({ length: activeAssignment.seniJumlahJuri || 5 }, (_, i) => i + 1).map((num) => {
                          const key = `juri${num}`;
                          const refId = activeAssignment.seniJuriIds?.[key];
                          return (
                            <div key={key} className="flex items-center justify-between text-slate-300 bg-slate-900/60 px-2 py-1 rounded">
                              <span className="text-slate-400 text-[10px]">Juri {num}:</span>
                              <span className="font-semibold truncate max-w-[85px] text-purple-200">
                                {refId ? getRefName(refId) : '-'}
                              </span>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  </div>

                  <button
                    onClick={handleSaveAssignment}
                    className="w-full mt-5 py-2.5 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-bold text-xs rounded-xl shadow-lg shadow-amber-500/20 transition-all flex items-center justify-center gap-2 cursor-pointer"
                  >
                    <Save className="w-4 h-4" />
                    Simpan Perubahan Penugasan
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* =================================================================== */}
        {/* TAB: ICON HUKUMAN MONITOR TANDING */}
        {/* =================================================================== */}
        {activeTab === 'penalty_icons' && (
          <div className="space-y-6">
            {/* 1. Header Banner & Quick Actions */}
            <div className="bg-gradient-to-r from-slate-900 via-slate-900/90 to-blue-950/40 border border-slate-800 rounded-2xl p-6 shadow-xl relative overflow-hidden">
              <div className="absolute top-0 right-0 w-80 h-80 bg-amber-500/5 rounded-full blur-3xl pointer-events-none" />

              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 relative z-10">
                <div className="space-y-2">
                  <div className="flex flex-wrap items-center gap-2.5">
                    <div className="w-10 h-10 rounded-xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-400">
                      <Palette className="w-5 h-5" />
                    </div>
                    <div>
                      <h2 className="text-lg font-bold text-white flex items-center gap-2">
                        Konfigurasi Icon Hukuman Layar Monitor Tanding
                        <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 uppercase tracking-wide flex items-center gap-1.5">
                          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                          Sinkron Otomatis
                        </span>
                      </h2>
                      <p className="text-xs text-slate-400">
                        Ubah dan sesuaikan 6 gestur icon hukuman (Binaan 1 & 2, Teguran 1 & 2, Peringatan 1 & 2) yang tampil pada layar monitor pertandingan gelanggang.
                      </p>
                    </div>
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-2.5">
                  <button
                    type="button"
                    onClick={() => handleOpenPhotoUploader('slot1')}
                    className="px-3.5 py-2 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer shadow-lg shadow-emerald-950/40"
                    title="Upload foto dan hilangkan latar belakang otomatis untuk layar hukuman"
                  >
                    <Scissors className="w-3.5 h-3.5" />
                    <span>Upload Foto Bebas Background</span>
                  </button>

                  <button
                    type="button"
                    onClick={handleResetPenaltyIcons}
                    className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer border border-slate-700"
                    title="Kembalikan semua icon ke susunan bawaan referensi gambar"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                    <span>Reset Bawaan</span>
                  </button>

                  <button
                    type="button"
                    onClick={handleSavePenaltyIcons}
                    disabled={isSavingPenaltyIcons}
                    className="px-4 py-2 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 active:scale-95 text-slate-950 font-bold text-xs shadow-lg shadow-amber-500/25 transition-all flex items-center gap-2 cursor-pointer disabled:opacity-50"
                    title="Simpan konfigurasi ke basis data server lokal & sinkronkan ke semua monitor"
                  >
                    {isSavingPenaltyIcons ? (
                      <>
                        <RefreshCw className="w-4 h-4 animate-spin" />
                        <span>Menyimpan...</span>
                      </>
                    ) : (
                      <>
                        <Save className="w-4 h-4" />
                        <span>Simpan & Terapkan Perubahan</span>
                      </>
                    )}
                  </button>
                </div>
              </div>

              {/* Status Indicator Badges */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-6 pt-5 border-t border-slate-800/80 text-xs">
                <div className="bg-slate-950/70 p-2.5 rounded-xl border border-slate-800/60">
                  <span className="text-[10px] text-slate-400 block font-sans">Status Sinkronisasi</span>
                  <span className="text-xs font-bold text-emerald-300 flex items-center gap-1 mt-0.5">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                    Tersambung Real-Time
                  </span>
                </div>
                <div className="bg-slate-950/70 p-2.5 rounded-xl border border-slate-800/60">
                  <span className="text-[10px] text-slate-400 block font-sans">Jumlah Slot Gestur</span>
                  <span className="text-xs font-bold text-amber-300 mt-0.5 block">
                    6 Slot (2 Binaan, 2 Teguran, 2 Peringatan)
                  </span>
                </div>
                <div className="bg-slate-950/70 p-2.5 rounded-xl border border-slate-800/60">
                  <span className="text-[10px] text-slate-400 block font-sans">Pilihan Icon Resmi</span>
                  <span className="text-xs font-bold text-cyan-300 mt-0.5 block">
                    14 Gestur & Siluet Silat
                  </span>
                </div>
                <div className="bg-slate-950/70 p-2.5 rounded-xl border border-slate-800/60">
                  <span className="text-[10px] text-slate-400 block font-sans">Target Monitor</span>
                  <span className="text-xs font-bold text-white mt-0.5 block">
                    Layar Tanding Sudut Biru & Merah
                  </span>
                </div>
              </div>
            </div>

            {/* 2. Preset Cepat (Quick Template Presets) */}
            <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-5 space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-800 pb-3">
                <div>
                  <h3 className="text-sm font-bold text-white flex items-center gap-2">
                    <Sliders className="w-4 h-4 text-amber-400" />
                    Preset Cepat Susunan Icon Hukuman
                  </h3>
                  <p className="text-xs text-slate-400">
                    Pilih salah satu template siap pakai atau atur per slot secara mandiri di bawah:
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {/* Preset 1: Standar Visual Imagen (Warning 1, Warning 2, Teguran) */}
                <div className="bg-slate-950 p-4 rounded-xl border border-emerald-500/50 flex flex-col justify-between hover:border-emerald-400 transition-all group ring-1 ring-emerald-500/20">
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-emerald-300">
                        Standar Visual Imagen
                      </span>
                      <span className="text-[10px] uppercase font-extrabold px-2 py-0.5 bg-emerald-500/20 text-emerald-300 rounded border border-emerald-500/30">
                        Resmi
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-400 leading-relaxed">
                      Icon visual terstandarisasi untuk hukuman Pencak Silat: Teguran 1 (-1), Teguran 2 (-2), Peringatan 1 (-5), Peringatan 2 (-10), dan Diskualifikasi (DQ).
                    </p>
                    <div className="flex items-center gap-1.5 py-2 overflow-x-auto text-emerald-400">
                      <div className="p-1 rounded bg-slate-900 border border-slate-800" title="Binaan 1">{renderPenaltyIcon('binaan1', 'w-5 h-5')}</div>
                      <div className="p-1 rounded bg-slate-900 border border-slate-800" title="Binaan 2">{renderPenaltyIcon('binaan2', 'w-5 h-5')}</div>
                      <div className="p-1 rounded bg-slate-900 border border-slate-800" title="Teguran 1">{renderPenaltyIcon(STANDARDIZED_PENALTY_ASSETS.teguran1, 'w-5 h-5')}</div>
                      <div className="p-1 rounded bg-slate-900 border border-slate-800" title="Teguran 2">{renderPenaltyIcon(STANDARDIZED_PENALTY_ASSETS.teguran2, 'w-5 h-5')}</div>
                      <div className="p-1 rounded bg-slate-900 border border-slate-800" title="Peringatan 1">{renderPenaltyIcon(STANDARDIZED_PENALTY_ASSETS.warning1, 'w-5 h-5')}</div>
                      <div className="p-1 rounded bg-slate-900 border border-slate-800" title="Peringatan 2">{renderPenaltyIcon(STANDARDIZED_PENALTY_ASSETS.warning2, 'w-5 h-5')}</div>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleSelectPenaltyPreset(STANDARDIZED_IMAGEN_PRESET)}
                    className="w-full mt-3 py-2 bg-emerald-600 hover:bg-emerald-500 text-slate-950 font-bold text-xs rounded-lg transition-colors cursor-pointer shadow-sm"
                  >
                    Terapkan Preset Standar
                  </button>
                </div>

                {/* Preset 2: Referensi Gambar Baru (Default) */}
                <div className="bg-slate-950 p-4 rounded-xl border border-amber-500/40 flex flex-col justify-between hover:border-amber-400 transition-all group">
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-amber-300">
                        Referensi Gambar Baru
                      </span>
                      <span className="text-[10px] uppercase font-extrabold px-2 py-0.5 bg-amber-500/20 text-amber-300 rounded border border-amber-500/30">
                        Default
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-400 leading-relaxed">
                      Sesuai gambar referensi monitor tanding terbaru: Tinju, Telunjuk, Dua Jari, Telapak Tangan, Tendangan T, dan Tendangan Sabit.
                    </p>
                    <div className="flex items-center gap-1.5 py-2 overflow-x-auto text-amber-400">
                      <div className="p-1 rounded bg-slate-900 border border-slate-800">{renderPenaltyIcon('fist', 'w-5 h-5')}</div>
                      <div className="p-1 rounded bg-slate-900 border border-slate-800">{renderPenaltyIcon('pointing', 'w-5 h-5')}</div>
                      <div className="p-1 rounded bg-slate-900 border border-slate-800">{renderPenaltyIcon('peace', 'w-5 h-5')}</div>
                      <div className="p-1 rounded bg-slate-900 border border-slate-800">{renderPenaltyIcon('hand', 'w-5 h-5')}</div>
                      <div className="p-1 rounded bg-slate-900 border border-slate-800">{renderPenaltyIcon('kick_t', 'w-5 h-5')}</div>
                      <div className="p-1 rounded bg-slate-900 border border-slate-800">{renderPenaltyIcon('kick_sabit', 'w-5 h-5')}</div>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleSelectPenaltyPreset(NEW_REFERENCE_PENALTY_ICONS)}
                    className="w-full mt-3 py-2 bg-slate-800 hover:bg-amber-500 hover:text-slate-950 text-slate-200 font-semibold text-xs rounded-lg transition-colors cursor-pointer"
                  >
                    Terapkan Preset Ini
                  </button>
                </div>

                {/* Preset 3: Standar Resmi Persilat */}
                <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 flex flex-col justify-between hover:border-slate-700 transition-all group">
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-slate-200">
                        Standar Resmi Persilat
                      </span>
                      <span className="text-[10px] uppercase font-bold px-2 py-0.5 bg-slate-800 text-slate-400 rounded">
                        Klasik
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-400 leading-relaxed">
                      Sinyal isyarat tangan wasit konvensional: Binaan 1 & 2 (manset), Teguran 1 & 2 (jari tegak), Peringatan 1 & 2 (telapak tangan).
                    </p>
                    <div className="flex items-center gap-1.5 py-2 overflow-x-auto text-slate-300">
                      <div className="p-1 rounded bg-slate-900 border border-slate-800">{renderPenaltyIcon('binaan1', 'w-5 h-5')}</div>
                      <div className="p-1 rounded bg-slate-900 border border-slate-800">{renderPenaltyIcon('binaan2', 'w-5 h-5')}</div>
                      <div className="p-1 rounded bg-slate-900 border border-slate-800">{renderPenaltyIcon('teguran1', 'w-5 h-5')}</div>
                      <div className="p-1 rounded bg-slate-900 border border-slate-800">{renderPenaltyIcon('teguran2', 'w-5 h-5')}</div>
                      <div className="p-1 rounded bg-slate-900 border border-slate-800">{renderPenaltyIcon('peringatan1', 'w-5 h-5')}</div>
                      <div className="p-1 rounded bg-slate-900 border border-slate-800">{renderPenaltyIcon('peringatan2', 'w-5 h-5')}</div>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleSelectPenaltyPreset(PERSILAT_PENALTY_ICONS)}
                    className="w-full mt-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold text-xs rounded-lg transition-colors cursor-pointer"
                  >
                    Terapkan Preset Ini
                  </button>
                </div>

                {/* Preset 4: Siluet Aksi Silat */}
                <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 flex flex-col justify-between hover:border-slate-700 transition-all group">
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-slate-200">
                        Siluet Aksi Silat
                      </span>
                      <span className="text-[10px] uppercase font-bold px-2 py-0.5 bg-slate-800 text-slate-400 rounded">
                        Dinamis
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-400 leading-relaxed">
                      Gerakan aktif pesilat di atas matras: Tinju, Pukulan Lurus, Pasang Kuda-kuda, Dua Jari, Tendangan T, dan Tendangan Sabit.
                    </p>
                    <div className="flex items-center gap-1.5 py-2 overflow-x-auto text-slate-300">
                      <div className="p-1 rounded bg-slate-900 border border-slate-800">{renderPenaltyIcon('fist', 'w-5 h-5')}</div>
                      <div className="p-1 rounded bg-slate-900 border border-slate-800">{renderPenaltyIcon('punch_pose', 'w-5 h-5')}</div>
                      <div className="p-1 rounded bg-slate-900 border border-slate-800">{renderPenaltyIcon('stance', 'w-5 h-5')}</div>
                      <div className="p-1 rounded bg-slate-900 border border-slate-800">{renderPenaltyIcon('peace', 'w-5 h-5')}</div>
                      <div className="p-1 rounded bg-slate-900 border border-slate-800">{renderPenaltyIcon('kick_t', 'w-5 h-5')}</div>
                      <div className="p-1 rounded bg-slate-900 border border-slate-800">{renderPenaltyIcon('kick_sabit', 'w-5 h-5')}</div>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleSelectPenaltyPreset(ACTION_PENALTY_ICONS)}
                    className="w-full mt-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold text-xs rounded-lg transition-colors cursor-pointer"
                  >
                    Terapkan Preset Ini
                  </button>
                </div>
              </div>
            </div>

            {/* 3. Live Monitor Simulation Preview */}
            <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-5 space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-800 pb-3">
                <div>
                  <h3 className="text-sm font-bold text-white flex items-center gap-2">
                    <Monitor className="w-4 h-4 text-cyan-400" />
                    Simulasi Tampilan Layar Monitor (Live Preview)
                  </h3>
                  <p className="text-xs text-slate-400">
                    Berikut simulasi bagaimana 6 icon hukuman akan terlihat pada layar monitor tanding penonton & official gelanggang:
                  </p>
                </div>
                <span className="text-[11px] font-mono text-cyan-300 bg-cyan-950/60 px-3 py-1 rounded-lg border border-cyan-800/60 self-start sm:self-auto">
                  Pratinjau Sudut Biru & Merah
                </span>
              </div>

              {/* Simulation Grid Box */}
              <div className="bg-slate-950 p-4 sm:p-6 rounded-2xl border border-slate-800/80 grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* SUDUT BIRU MONITOR SIMULATION */}
                <div className="bg-slate-900/90 rounded-2xl border-2 border-blue-600/60 p-4 shadow-xl shadow-blue-950/30 space-y-3">
                  <div className="flex items-center justify-between border-b border-blue-900/60 pb-2">
                    <div className="flex items-center gap-2">
                      <span className="w-3 h-3 rounded-full bg-blue-500 shadow-sm shadow-blue-400" />
                      <span className="text-xs font-black uppercase tracking-wider text-blue-400">
                        SUDUT BIRU
                      </span>
                    </div>
                    <span className="text-[10px] font-mono text-slate-400">
                      PESILAT BIRU (DKI JAKARTA)
                    </span>
                  </div>

                  {/* 2x3 Grid Display for Blue Corner */}
                  <div className="flex items-stretch gap-3">
                    {/* Score preview box */}
                    <div className="w-20 bg-blue-600 text-white rounded-xl flex flex-col items-center justify-center p-2 shadow-inner">
                      <span className="text-[9px] uppercase font-bold text-blue-100">SKOR</span>
                      <span className="text-2xl font-black font-mono">18</span>
                    </div>

                    {/* 2x3 Penalty Grid */}
                    <div className="flex-1 grid grid-cols-2 gap-2 bg-slate-950/80 p-2.5 rounded-xl border border-blue-900/40">
                      {/* Row 1: Binaan 1 & 2 */}
                      <div className="bg-slate-900/80 rounded-lg p-2 flex flex-col items-center justify-center border border-slate-800 text-blue-400">
                        <span className="text-[9px] font-bold text-slate-400 uppercase">Binaan 1</span>
                        <div className="my-1">{renderPenaltyIcon(localPenaltyIcons.slot1, "w-8 h-8")}</div>
                        <span className="text-[8px] text-slate-400 font-mono">0 Poin</span>
                      </div>
                      <div className="bg-slate-900/80 rounded-lg p-2 flex flex-col items-center justify-center border border-slate-800 text-blue-400">
                        <span className="text-[9px] font-bold text-slate-400 uppercase">Binaan 2</span>
                        <div className="my-1">{renderPenaltyIcon(localPenaltyIcons.slot2, "w-8 h-8")}</div>
                        <span className="text-[8px] text-slate-400 font-mono">0 Poin</span>
                      </div>

                      {/* Row 2: Teguran 1 & 2 */}
                      <div className="bg-slate-900/80 rounded-lg p-2 flex flex-col items-center justify-center border border-slate-800 text-blue-400">
                        <span className="text-[9px] font-bold text-orange-400 uppercase">Teguran 1</span>
                        <div className="my-1">{renderPenaltyIcon(localPenaltyIcons.slot3, "w-8 h-8")}</div>
                        <span className="text-[8px] text-orange-300/80 font-mono">-1 Poin</span>
                      </div>
                      <div className="bg-slate-900/80 rounded-lg p-2 flex flex-col items-center justify-center border border-slate-800 text-blue-400">
                        <span className="text-[9px] font-bold text-orange-400 uppercase">Teguran 2</span>
                        <div className="my-1">{renderPenaltyIcon(localPenaltyIcons.slot4, "w-8 h-8")}</div>
                        <span className="text-[8px] text-orange-300/80 font-mono">-2 Poin</span>
                      </div>

                      {/* Row 3: Peringatan 1 & 2 */}
                      <div className="bg-slate-900/80 rounded-lg p-2 flex flex-col items-center justify-center border border-slate-800 text-blue-400">
                        <span className="text-[9px] font-bold text-red-400 uppercase">Peringatan 1</span>
                        <div className="my-1">{renderPenaltyIcon(localPenaltyIcons.slot5, "w-8 h-8")}</div>
                        <span className="text-[8px] text-red-300/80 font-mono">-5 Poin</span>
                      </div>
                      <div className="bg-slate-900/80 rounded-lg p-2 flex flex-col items-center justify-center border border-slate-800 text-blue-400">
                        <span className="text-[9px] font-bold text-red-400 uppercase">Peringatan 2</span>
                        <div className="my-1">{renderPenaltyIcon(localPenaltyIcons.slot6, "w-8 h-8")}</div>
                        <span className="text-[8px] text-red-300/80 font-mono">-10 Poin</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* SUDUT MERAH MONITOR SIMULATION */}
                <div className="bg-slate-900/90 rounded-2xl border-2 border-red-600/60 p-4 shadow-xl shadow-red-950/30 space-y-3">
                  <div className="flex items-center justify-between border-b border-red-900/60 pb-2">
                    <span className="text-[10px] font-mono text-slate-400">
                      PESILAT MERAH (JAWA BARAT)
                    </span>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-black uppercase tracking-wider text-red-400">
                        SUDUT MERAH
                      </span>
                      <span className="w-3 h-3 rounded-full bg-red-500 shadow-sm shadow-red-400" />
                    </div>
                  </div>

                  {/* 2x3 Grid Display for Red Corner */}
                  <div className="flex items-stretch gap-3">
                    {/* 2x3 Penalty Grid */}
                    <div className="flex-1 grid grid-cols-2 gap-2 bg-slate-950/80 p-2.5 rounded-xl border border-red-900/40">
                      {/* Row 1: Binaan 1 & 2 */}
                      <div className="bg-slate-900/80 rounded-lg p-2 flex flex-col items-center justify-center border border-slate-800 text-red-400">
                        <span className="text-[9px] font-bold text-slate-400 uppercase">Binaan 1</span>
                        <div className="my-1">{renderPenaltyIcon(localPenaltyIcons.slot1, "w-8 h-8", true)}</div>
                        <span className="text-[8px] text-slate-400 font-mono">0 Poin</span>
                      </div>
                      <div className="bg-slate-900/80 rounded-lg p-2 flex flex-col items-center justify-center border border-slate-800 text-red-400">
                        <span className="text-[9px] font-bold text-slate-400 uppercase">Binaan 2</span>
                        <div className="my-1">{renderPenaltyIcon(localPenaltyIcons.slot2, "w-8 h-8", true)}</div>
                        <span className="text-[8px] text-slate-400 font-mono">0 Poin</span>
                      </div>

                      {/* Row 2: Teguran 1 & 2 */}
                      <div className="bg-slate-900/80 rounded-lg p-2 flex flex-col items-center justify-center border border-slate-800 text-red-400">
                        <span className="text-[9px] font-bold text-orange-400 uppercase">Teguran 1</span>
                        <div className="my-1">{renderPenaltyIcon(localPenaltyIcons.slot3, "w-8 h-8", true)}</div>
                        <span className="text-[8px] text-orange-300/80 font-mono">-1 Poin</span>
                      </div>
                      <div className="bg-slate-900/80 rounded-lg p-2 flex flex-col items-center justify-center border border-slate-800 text-red-400">
                        <span className="text-[9px] font-bold text-orange-400 uppercase">Teguran 2</span>
                        <div className="my-1">{renderPenaltyIcon(localPenaltyIcons.slot4, "w-8 h-8", true)}</div>
                        <span className="text-[8px] text-orange-300/80 font-mono">-2 Poin</span>
                      </div>

                      {/* Row 3: Peringatan 1 & 2 */}
                      <div className="bg-slate-900/80 rounded-lg p-2 flex flex-col items-center justify-center border border-slate-800 text-red-400">
                        <span className="text-[9px] font-bold text-red-400 uppercase">Peringatan 1</span>
                        <div className="my-1">{renderPenaltyIcon(localPenaltyIcons.slot5, "w-8 h-8", true)}</div>
                        <span className="text-[8px] text-red-300/80 font-mono">-5 Poin</span>
                      </div>
                      <div className="bg-slate-900/80 rounded-lg p-2 flex flex-col items-center justify-center border border-slate-800 text-red-400">
                        <span className="text-[9px] font-bold text-red-400 uppercase">Peringatan 2</span>
                        <div className="my-1">{renderPenaltyIcon(localPenaltyIcons.slot6, "w-8 h-8", true)}</div>
                        <span className="text-[8px] text-red-300/80 font-mono">-10 Poin</span>
                      </div>
                    </div>

                    {/* Score preview box */}
                    <div className="w-20 bg-red-600 text-white rounded-xl flex flex-col items-center justify-center p-2 shadow-inner">
                      <span className="text-[9px] uppercase font-bold text-red-100">SKOR</span>
                      <span className="text-2xl font-black font-mono">24</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* 4. Slot Configuration Cards (6 Interactive Slots) */}
            <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-5 space-y-4">
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <div>
                  <h3 className="text-sm font-bold text-white flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-amber-400" />
                    Kustomisasi 6 Slot Icon Hukuman
                  </h3>
                  <p className="text-xs text-slate-400">
                    Klik tombol "Ganti Icon" pada setiap slot untuk memilih gestur yang Anda kehendaki:
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {(['slot1', 'slot2', 'slot3', 'slot4', 'slot5', 'slot6'] as (keyof PenaltyIconConfig)[]).map((slotKey, idx) => {
                  const meta = getPenaltySlotMeta(slotKey);
                  const currentIconType = localPenaltyIcons[slotKey];
                  const currentCatalogItem = ICON_CATALOG.find(c => c.type === currentIconType);
                  const isCustomPng = typeof currentIconType === 'string' && (currentIconType.startsWith('data:image/') || currentIconType.startsWith('http') || currentIconType.startsWith('/') || !!localPenaltyIcons.customImages?.[slotKey]);

                  return (
                    <div
                      key={slotKey}
                      className="bg-slate-950 p-4 rounded-xl border border-slate-800 hover:border-slate-700 transition-all flex flex-col justify-between space-y-3"
                    >
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="text-[11px] font-bold text-slate-300 font-mono">
                            SLOT {idx + 1}
                          </span>
                          <div className="flex items-center gap-1.5">
                            {isCustomPng && (
                              <span className="text-[9px] font-extrabold px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 uppercase tracking-wide flex items-center gap-1">
                                <ImageIcon className="w-3 h-3 text-emerald-400" />
                                PNG Kustom
                              </span>
                            )}
                            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${meta.color}`}>
                              {meta.name}
                            </span>
                          </div>
                        </div>

                        <div>
                          <h4 className="text-xs font-bold text-white">{meta.desc}</h4>
                          <p className="text-[11px] text-slate-400">{meta.rule}</p>
                        </div>

                        {/* Large Icon Preview */}
                        <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-4 flex flex-col items-center justify-center my-2 text-amber-400 min-h-[100px]">
                          <div className="scale-125 my-1 flex items-center justify-center">
                            {renderPenaltyIcon(currentIconType, "w-10 h-10", false, localPenaltyIcons.customImages)}
                          </div>
                          <span className="text-[11px] font-semibold text-slate-300 mt-2 text-center truncate max-w-full">
                            {isCustomPng ? 'Gambar PNG Kustom (Diunggah)' : (currentCatalogItem?.label || currentIconType)}
                          </span>
                        </div>
                      </div>

                      <div className="space-y-2 pt-1">
                        <div className="grid grid-cols-2 gap-2">
                          {/* Upload Foto Tanpa Background Button */}
                          <button
                            type="button"
                            onClick={() => handleOpenPhotoUploader(slotKey)}
                            className="py-2 px-2 bg-gradient-to-r from-emerald-950/90 to-teal-950/90 hover:from-emerald-900 hover:to-teal-900 border border-emerald-600/70 hover:border-emerald-400 text-emerald-200 font-bold text-xs rounded-xl transition-all flex items-center justify-center gap-1.5 cursor-pointer text-center shadow-xs"
                            title="Upload foto & hapus background transparan otomatis"
                          >
                            <Scissors className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                            <span className="truncate">Foto Bebas BG</span>
                          </button>

                          {/* Choose from Catalog Button */}
                          <button
                            type="button"
                            onClick={() => setEditingPenaltySlot(slotKey)}
                            className="py-2 px-2 bg-slate-800 hover:bg-amber-500 hover:text-slate-950 text-slate-200 font-bold text-xs rounded-xl transition-all flex items-center justify-center gap-1.5 cursor-pointer border border-slate-700 hover:border-amber-400 text-center"
                          >
                            <Pencil className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                            <span className="truncate">Katalog Icon</span>
                          </button>
                        </div>

                        {/* Reset PNG button if custom PNG is active */}
                        {isCustomPng && (
                          <button
                            type="button"
                            onClick={() => handleRemoveSlotPng(slotKey)}
                            className="w-full py-1.5 bg-red-950/40 hover:bg-red-900/60 border border-red-800/40 text-red-300 font-medium text-[11px] rounded-lg transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
                            title="Hapus gambar PNG ini dan kembalikan ke icon standar"
                          >
                            <RotateCcw className="w-3 h-3 text-red-400" />
                            <span>Hapus PNG & Kembalikan Bawaan</span>
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* 5. Bottom Save Confirmation Bar */}
            <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4 flex flex-col sm:flex-row items-center justify-between gap-4 sticky bottom-4 shadow-2xl backdrop-blur-md">
              <div className="flex items-center gap-2.5 text-xs text-slate-400">
                <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>
                  Perubahan icon (termasuk berkas PNG) akan disimpan ke database server lokal dan langsung terdistribusi ke seluruh layar monitor pertandingan.
                </span>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                <button
                  type="button"
                  onClick={handleResetPenaltyIcons}
                  className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold cursor-pointer"
                >
                  Reset
                </button>
                <button
                  type="button"
                  onClick={handleSavePenaltyIcons}
                  disabled={isSavingPenaltyIcons || isProcessingPng}
                  className="px-5 py-2 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 active:scale-95 text-slate-950 font-bold text-xs rounded-xl shadow-lg shadow-amber-500/25 transition-all flex items-center gap-2 cursor-pointer disabled:opacity-50"
                >
                  {isSavingPenaltyIcons ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin" />
                      <span>Menyimpan...</span>
                    </>
                  ) : (
                    <>
                      <Save className="w-4 h-4" />
                      <span>Simpan & Terapkan Perubahan</span>
                    </>
                  )}
                </button>
              </div>
            </div>

            {/* 6. Icon Picker & PNG Upload Modal Dialog */}
            {editingPenaltySlot !== null && (
              <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
                <div className="bg-slate-900 border border-slate-700 rounded-2xl max-w-2xl w-full p-6 space-y-5 shadow-2xl max-h-[90vh] overflow-y-auto">
                  <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                    <div>
                      <h3 className="text-base font-bold text-white flex items-center gap-2">
                        <Palette className="w-5 h-5 text-amber-400" />
                        Pilih atau Upload Icon untuk {getPenaltySlotMeta(editingPenaltySlot).name}
                      </h3>
                      <p className="text-xs text-slate-400">
                        {getPenaltySlotMeta(editingPenaltySlot).desc} • {getPenaltySlotMeta(editingPenaltySlot).rule}
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => setEditingPenaltySlot(null)}
                      className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition-colors cursor-pointer"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>

                  {/* Section A: Upload File PNG Kustom */}
                  <div className="p-4 rounded-xl border-2 border-dashed border-emerald-600/50 bg-emerald-950/20 space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="p-2 rounded-lg bg-emerald-500/20 text-emerald-400">
                          <Upload className="w-4 h-4" />
                        </div>
                        <div>
                          <h4 className="text-xs font-bold text-white flex items-center gap-1.5">
                            Unggah Gambar PNG Kustom Sendiri
                            <span className="px-1.5 py-0.2 rounded text-[9px] bg-emerald-500/30 text-emerald-300 font-extrabold uppercase">
                              Disarankan
                            </span>
                          </h4>
                          <p className="text-[11px] text-slate-400">
                            Pilih gambar PNG dengan latar transparan. Sistem otomatis mengoptimasi ukuran (<span className="text-emerald-300">~25KB</span>) agar tajam di layar.
                          </p>
                        </div>
                      </div>
                    </div>

                    <div className="flex flex-col sm:flex-row items-center gap-3 pt-2">
                      <button
                        type="button"
                        onClick={() => handleOpenPhotoUploader(editingPenaltySlot)}
                        className="w-full sm:w-auto px-4 py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-slate-950 font-bold text-xs flex items-center justify-center gap-2 cursor-pointer shadow-lg shadow-emerald-950/40 transition-all"
                      >
                        <Scissors className="w-4 h-4" />
                        <span>Upload Foto & Hapus Background (Transparan)</span>
                      </button>

                      <label className="w-full sm:w-auto px-3.5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold text-xs flex items-center justify-center gap-2 cursor-pointer border border-slate-700 transition-all">
                        <ImageIcon className="w-4 h-4 text-emerald-400" />
                        <span>{isProcessingPng ? 'Memproses...' : 'Upload Berkas Langsung'}</span>
                        <input
                          type="file"
                          accept="image/*,.jpg,.jpeg,.png,.webp,.svg"
                          className="hidden"
                          disabled={isProcessingPng}
                          onChange={(e) => {
                            const file = e.target.files?.[0];
                            if (file) {
                              handleUploadSlotPng(editingPenaltySlot, file);
                              e.target.value = '';
                            }
                          }}
                        />
                      </label>

                      {/* If current slot has a custom PNG, show its preview & clear button */}
                      {(typeof localPenaltyIcons[editingPenaltySlot] === 'string' && (localPenaltyIcons[editingPenaltySlot].startsWith('data:image/') || !!localPenaltyIcons.customImages?.[editingPenaltySlot])) && (
                        <div className="flex items-center gap-2 w-full sm:w-auto justify-between sm:justify-start bg-slate-950/80 px-3 py-1.5 rounded-xl border border-slate-800">
                          <div className="flex items-center gap-2">
                            <div className="w-7 h-7 rounded bg-slate-900 border border-slate-800 flex items-center justify-center">
                              {renderPenaltyIcon(localPenaltyIcons[editingPenaltySlot], "w-6 h-6", false, localPenaltyIcons.customImages)}
                            </div>
                            <span className="text-[11px] font-semibold text-emerald-400">PNG Sedang Digunakan</span>
                          </div>
                          <button
                            type="button"
                            onClick={() => handleRemoveSlotPng(editingPenaltySlot)}
                            className="text-xs text-red-400 hover:text-red-300 font-semibold underline cursor-pointer"
                          >
                            Hapus
                          </button>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Section B: Atau Pilih dari Katalog Icon Vektor Silat */}
                  <div className="space-y-3">
                    <div className="flex items-center gap-2 border-b border-slate-800 pb-2">
                      <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
                        Atau Pilih dari Pilihan Icon Standar Silat:
                      </span>
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                      {ICON_CATALOG.map((item) => {
                        const isSelected = localPenaltyIcons[editingPenaltySlot] === item.type;

                        return (
                          <button
                            key={item.type}
                            type="button"
                            onClick={() => handleSelectPenaltySlotIcon(editingPenaltySlot, item.type)}
                            className={`p-3.5 rounded-xl border flex flex-col items-center justify-center gap-2 text-center transition-all cursor-pointer ${
                              isSelected
                                ? 'bg-amber-500/20 border-amber-500 text-amber-300 ring-2 ring-amber-500/50'
                                : 'bg-slate-950 border-slate-800 hover:border-slate-700 text-slate-300 hover:text-white hover:bg-slate-800/40'
                            }`}
                          >
                            <div className="scale-125 my-1">
                              {renderPenaltyIcon(item.type, "w-8 h-8")}
                            </div>
                            <span className="text-xs font-semibold">{item.label}</span>
                            {isSelected && (
                              <span className="text-[10px] font-bold text-amber-400 flex items-center gap-1">
                                <Check className="w-3 h-3" />
                                Terpilih
                              </span>
                            )}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  <div className="flex justify-end pt-3 border-t border-slate-800">
                    <button
                      type="button"
                      onClick={() => setEditingPenaltySlot(null)}
                      className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold rounded-xl cursor-pointer"
                    >
                      Tutup
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* =================================================================== */}
        {/* TAB 4: KEAMANAN & AUDIT LOG */}
        {/* =================================================================== */}
        {activeTab === 'security' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Left Col: Security Settings & Password Change */}
            <div className="space-y-6">
              <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-5 space-y-4">
                <h3 className="text-sm font-bold text-white flex items-center gap-2 border-b border-slate-800 pb-3">
                  <KeyRound className="w-4 h-4 text-amber-400" />
                  Ganti Password Administrator
                </h3>

                <form onSubmit={handleChangePassword} className="space-y-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1">
                      Password Baru
                    </label>
                    <input
                      type="password"
                      required
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      placeholder="Minimal 4 karakter"
                      className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-xs text-white focus:outline-none focus:border-amber-500"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1">
                      Konfirmasi Password Baru
                    </label>
                    <input
                      type="password"
                      required
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="Ketik ulang password baru"
                      className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-xs text-white focus:outline-none focus:border-amber-500"
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={isChangingPassword}
                    className="w-full py-2.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs rounded-xl shadow-md transition-colors flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50"
                  >
                    <Save className="w-3.5 h-3.5" />
                    Simpan Password Baru
                  </button>
                </form>
              </div>

              {/* Reset to Factory Defaults */}
              <div className="bg-slate-900/80 border border-red-900/40 rounded-2xl p-5 space-y-3">
                <h3 className="text-sm font-bold text-red-400 flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 text-red-400" />
                  Zona Tindakan Kritis
                </h3>
                <p className="text-xs text-slate-400 leading-relaxed">
                  Mereset data master turnamen, wasit & juri, dan penugasan ke template resmi standar IPSI.
                </p>
                <button
                  onClick={handleResetMasterData}
                  className="w-full py-2.5 bg-red-950/60 hover:bg-red-900/80 border border-red-800 text-red-200 font-bold text-xs rounded-xl transition-colors cursor-pointer flex items-center justify-center gap-2"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                  Reset Master Data ke Standar IPSI
                </button>

                <div className="pt-2 border-t border-red-900/40">
                  <p className="text-[11px] text-slate-400 mb-2 leading-relaxed">
                    Perlu membersihkan skor live tanding/seni atau arsip riwayat tanpa mereset template wasit?
                  </p>
                  <button
                    type="button"
                    onClick={() => {
                      playBeep('click');
                      setActiveTab('reset_total');
                    }}
                    className="w-full py-2.5 bg-gradient-to-r from-rose-700 to-red-700 hover:from-rose-600 hover:to-red-600 text-white font-bold text-xs rounded-xl transition-all cursor-pointer flex items-center justify-center gap-2 shadow-md shadow-rose-950/40"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                    Buka Panel Reset Data Total
                  </button>
                </div>
              </div>
            </div>

            {/* Right 2 Cols: Real-time Audit Trail */}
            <div className="lg:col-span-2 bg-slate-900/80 border border-slate-800 rounded-2xl p-5 space-y-4">
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <div>
                  <h3 className="text-sm font-bold text-white flex items-center gap-2">
                    <FileText className="w-4 h-4 text-amber-400" />
                    Jejak Audit Sistem (Audit Log)
                  </h3>
                  <p className="text-xs text-slate-400">
                    Catatan riwayat perubahan data master dan aktivitas administrator.
                  </p>
                </div>
                <span className="text-[11px] font-mono text-slate-400 bg-slate-950 px-2.5 py-1 rounded-lg border border-slate-800">
                  {localLogs.length} Entri Tercatat
                </span>
              </div>

              <div className="space-y-2 max-h-[520px] overflow-y-auto pr-1">
                {localLogs.length === 0 ? (
                  <p className="text-xs text-slate-500 py-6 text-center">Belum ada riwayat aktivitas.</p>
                ) : (
                  localLogs.map((log, logIdx) => (
                    <div
                      key={`${log.id || 'log'}__${logIdx}`}
                      className="bg-slate-950/80 p-3 rounded-xl border border-slate-800/80 text-xs flex items-start justify-between gap-3 hover:border-slate-700 transition-colors"
                    >
                      <div className="space-y-0.5">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-amber-300 font-mono text-[11px]">
                            [{log.action}]
                          </span>
                          <span className="text-[11px] font-semibold text-slate-300">
                            oleh <span className="text-white">{log.admin}</span>
                          </span>
                        </div>
                        {log.details && (
                          <p className="text-slate-300 text-xs leading-relaxed">{log.details}</p>
                        )}
                      </div>
                      <span className="text-[10px] font-mono text-slate-500 shrink-0 text-right">
                        {new Date(log.timestamp).toLocaleTimeString('id-ID', {
                          hour: '2-digit',
                          minute: '2-digit',
                          second: '2-digit'
                        })}
                      </span>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        )}

        {/* =================================================================== */}
        {/* TAB 5: PENYIMPANAN GOOGLE CLOUD & SERVER LOKAL */}
        {/* =================================================================== */}
        {activeTab === 'storage' && (
          <div className="space-y-6">
            {/* 0. GOOGLE CLOUD FIRESTORE STORAGE CARD */}
            <div className="bg-gradient-to-r from-slate-900 via-slate-900/95 to-blue-950/50 border border-blue-500/40 rounded-2xl p-6 shadow-xl relative overflow-hidden">
              <div className="absolute top-0 right-0 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />

              <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 relative z-10">
                <div className="space-y-1.5">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-blue-500/20 border border-blue-500/40 flex items-center justify-center text-blue-400">
                      {googleUser ? <Cloud className="w-5 h-5" /> : <CloudOff className="w-5 h-5 text-slate-400" />}
                    </div>
                    <div>
                      <h2 className="text-lg font-bold text-white flex flex-wrap items-center gap-2">
                        Penyimpanan Google Cloud (Firebase Firestore)
                        {googleUser && googleSyncEnabled && googleSyncStatus === 'synced' ? (
                          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-blue-500/20 text-blue-300 border border-blue-500/40 uppercase tracking-wide flex items-center gap-1.5">
                            <span className="w-2 h-2 rounded-full bg-blue-400 animate-pulse" />
                            Tersimpan di Google Cloud
                          </span>
                        ) : googleSyncStatus === 'connecting' ? (
                          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-amber-500/20 text-amber-300 border border-amber-500/40 uppercase">
                            Menyambungkan...
                          </span>
                        ) : (
                          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-slate-800 text-slate-300 border border-slate-700 uppercase">
                            {googleUser ? 'Sinkronisasi Dijeda' : 'Belum Masuk Akun Google'}
                          </span>
                        )}
                      </h2>
                      <p className="text-xs text-slate-300">
                        Menyimpan seluruh data turnamen, wasit, atlet/kontingen, bagan, skor gelanggang, dan riwayat partai langsung di database Google Firestore.
                      </p>
                    </div>
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-2.5">
                  {!googleUser ? (
                    <button
                      type="button"
                      onClick={handleAdminGoogleSignIn}
                      disabled={isGoogleActionBusy}
                      className="px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs shadow-lg shadow-blue-600/30 transition-all flex items-center gap-2 cursor-pointer disabled:opacity-50"
                    >
                      {isGoogleActionBusy ? <RefreshCw className="w-4 h-4 animate-spin" /> : <LogIn className="w-4 h-4" />}
                      <span>Masuk dengan Google & Aktifkan Penyimpanan</span>
                    </button>
                  ) : (
                    <>
                      <button
                        type="button"
                        onClick={handleAdminGoogleSyncNow}
                        disabled={isGoogleActionBusy || !googleSyncEnabled}
                        className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs shadow-lg shadow-blue-600/25 transition-all flex items-center gap-2 cursor-pointer disabled:opacity-50"
                      >
                        {isGoogleActionBusy ? <RefreshCw className="w-4 h-4 animate-spin" /> : <UploadCloud className="w-4 h-4" />}
                        <span>Simpan Semua Data ke Google Sekarang</span>
                      </button>
                      {onSignOutGoogle && (
                        <button
                          type="button"
                          onClick={onSignOutGoogle}
                          disabled={isGoogleActionBusy}
                          className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-red-950/60 border border-slate-700 hover:border-red-500/40 text-slate-300 hover:text-red-300 text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
                        >
                          <LogOut className="w-3.5 h-3.5" />
                          <span>Keluar Google</span>
                        </button>
                      )}
                    </>
                  )}
                </div>
              </div>

              {/* Google Cloud Metadata Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5 mt-5 pt-4 border-t border-slate-800/80 font-mono text-xs relative z-10">
                <div className="bg-slate-950/70 p-3 rounded-xl border border-slate-800/70">
                  <span className="text-[11px] text-slate-400 block font-sans">Akun Google Aktif</span>
                  <span className="text-xs font-bold text-white truncate block mt-1">
                    {googleUser ? googleUser.email || googleUser.displayName : 'Belum masuk'}
                  </span>
                </div>
                <div className="bg-slate-950/70 p-3 rounded-xl border border-slate-800/70">
                  <span className="text-[11px] text-slate-400 block font-sans">Database Google Firestore</span>
                  <span className="text-xs font-bold text-cyan-300 truncate block mt-1" title={firebaseProjectInfo?.databaseId}>
                    {firebaseProjectInfo?.hasFirestoreDatabase === false
                      ? 'Tidak Aktif (Mode Google Drive)'
                      : firebaseProjectInfo?.databaseId || 'ai-studio-firestore'}
                  </span>
                </div>
                <div className="bg-slate-950/70 p-3 rounded-xl border border-slate-800/70">
                  <span className="text-[11px] text-slate-400 block font-sans">Sinkronisasi Terakhir</span>
                  <span className="text-xs font-bold text-emerald-300 block mt-1">
                    {lastCloudSyncAt
                      ? new Date(lastCloudSyncAt).toLocaleTimeString('id-ID', {
                          hour: '2-digit',
                          minute: '2-digit',
                          second: '2-digit'
                        }) + ' WIB'
                      : googleUser
                      ? 'Menunggu sinkronisasi...'
                      : '-'}
                  </span>
                </div>
                <div className="bg-slate-950/70 p-3 rounded-xl border border-slate-800/70 flex items-center justify-between gap-2">
                  <div>
                    <span className="text-[11px] text-slate-400 block font-sans">Auto-Save Google</span>
                    <span className="text-xs font-bold text-blue-300 block mt-1">
                      {googleSyncEnabled ? 'Otomatis Aktif' : 'Nonaktif'}
                    </span>
                  </div>
                  {onToggleGoogleSync && (
                    <button
                      type="button"
                      role="switch"
                      aria-checked={googleSyncEnabled}
                      onClick={() => onToggleGoogleSync(!googleSyncEnabled)}
                      className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors ${
                        googleSyncEnabled ? 'bg-blue-500' : 'bg-slate-700'
                      }`}
                    >
                      <span
                        className={`inline-block h-5 w-5 transform rounded-full bg-white shadow transition ${
                          googleSyncEnabled ? 'translate-x-5' : 'translate-x-0'
                        }`}
                      />
                    </button>
                  )}
                </div>
              </div>

              {firebaseProjectInfo?.hasFirestoreDatabase === false && (
                <div className="mt-4 p-3 rounded-xl bg-emerald-950/40 border border-emerald-500/40 text-xs text-emerald-200 flex items-center gap-2 relative z-10">
                  <HardDrive className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span>
                    Proyek OAuth ini aktif menggunakan <strong>Penyimpanan Google Drive</strong> (lihat panel di bawah). Database Firestore tidak dikonfigurasi pada proyek ini.
                  </span>
                </div>
              )}

              {googleError && (
                <div className="mt-4 p-3 rounded-xl bg-red-950/50 border border-red-700/50 text-xs text-red-200 flex items-center gap-2 relative z-10">
                  <AlertTriangle className="w-4 h-4 text-red-400 shrink-0" />
                  <span className="break-words">{googleError}</span>
                </div>
              )}

              {/* Cloud Snapshot Creation & Restore History */}
              {googleUser && (
                <div className="mt-5 pt-5 border-t border-slate-800/80 space-y-4 relative z-10">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div>
                      <h3 className="text-sm font-bold text-white flex items-center gap-2">
                        <History className="w-4 h-4 text-blue-400" />
                        Snapshot Cadangan di Google Cloud Firestore ({cloudBackups.length})
                      </h3>
                      <p className="text-xs text-slate-400">
                        Simpan titik pemulihan permanen di server Google dan pulihkan kapan saja di perangkat mana pun.
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <input
                        type="text"
                        value={cloudBackupLabel}
                        onChange={(e) => setCloudBackupLabel(e.target.value)}
                        placeholder="Label snapshot (opsional)..."
                        className="bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 w-48 sm:w-56"
                      />
                      <button
                        type="button"
                        onClick={handleAdminCreateGoogleBackup}
                        disabled={isGoogleActionBusy}
                        className="px-3.5 py-2 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white font-bold text-xs flex items-center gap-1.5 transition-all cursor-pointer disabled:opacity-50 shrink-0"
                      >
                        <Save className="w-3.5 h-3.5" />
                        <span>Simpan Snapshot Cloud</span>
                      </button>
                    </div>
                  </div>

                  {cloudBackups.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      {cloudBackups.slice(0, 6).map((bkp) => (
                        <div
                          key={bkp.id}
                          className="p-3.5 rounded-xl bg-slate-950/75 border border-slate-800 flex items-center justify-between gap-3"
                        >
                          <div className="min-w-0">
                            <div className="text-xs font-bold text-white truncate">{bkp.label}</div>
                            <div className="text-[11px] text-slate-400 font-mono mt-0.5">
                              {bkp.totalArenas} Arena • {bkp.totalHistories} Partai •{' '}
                              {bkp.createdAt ? new Date(bkp.createdAt).toLocaleString('id-ID') : ''}
                            </div>
                          </div>
                          <div className="flex items-center gap-1.5 shrink-0">
                            <button
                              type="button"
                              onClick={() => handleAdminRestoreGoogleBackup(bkp)}
                              disabled={isGoogleActionBusy}
                              className="px-2.5 py-1.5 rounded-lg bg-blue-600/20 hover:bg-blue-600 text-blue-300 hover:text-white border border-blue-500/40 text-[11px] font-bold transition-colors cursor-pointer"
                            >
                              Pulihkan
                            </button>
                            <button
                              type="button"
                              onClick={() => handleAdminDeleteGoogleBackup(bkp)}
                              disabled={isGoogleActionBusy}
                              className="p-1.5 rounded-lg bg-slate-800 hover:bg-red-950 text-slate-400 hover:text-red-300 border border-slate-700 transition-colors cursor-pointer"
                              title="Hapus snapshot"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="p-4 rounded-xl bg-slate-950/50 border border-slate-800/80 text-xs text-slate-400 text-center">
                      Belum ada snapshot cadangan di Google Cloud. Klik <strong>Simpan Snapshot Cloud</strong> untuk membuat titik pemulihan pertama.
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* 0.5 GOOGLE DRIVE STORAGE CARD */}
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
            />

            {/* 1. Header Overview Card (Local Server Disk Fallback) */}
            <div className="bg-gradient-to-r from-slate-900 via-slate-900/90 to-emerald-950/40 border border-slate-800 rounded-2xl p-6 shadow-xl relative overflow-hidden">
              <div className="absolute top-0 right-0 w-80 h-80 bg-emerald-500/5 rounded-full blur-3xl pointer-events-none" />

              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 relative z-10">
                <div className="space-y-2">
                  <div className="flex flex-wrap items-center gap-2.5">
                    <div className="w-9 h-9 rounded-xl bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-emerald-400">
                      <HardDrive className="w-5 h-5" />
                    </div>
                    <div>
                      <h2 className="text-lg font-bold text-white flex items-center gap-2">
                        Penyimpanan Data Server Lokal
                        <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 uppercase tracking-wide flex items-center gap-1.5">
                          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                          Aktif & Tersimpan
                        </span>
                      </h2>
                      <p className="text-xs text-slate-400">
                        Sistem persistensi berkas lokal mandiri: Semua turnamen, wasit, dan penilaian arena disimpan di hard drive server.
                      </p>
                    </div>
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-2.5">
                  <button
                    id="admin-storage-refresh-btn"
                    onClick={fetchStorageStatus}
                    disabled={isLoadingStorage}
                    className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer disabled:opacity-50"
                    title="Segarkan status berkas"
                  >
                    <RefreshCw className={`w-3.5 h-3.5 ${isLoadingStorage ? 'animate-spin' : ''}`} />
                    <span>Segarkan</span>
                  </button>

                  <button
                    id="admin-storage-save-now-btn"
                    onClick={handleSaveToLocalDisk}
                    disabled={isSavingDisk}
                    className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 active:scale-95 text-white font-bold text-xs shadow-lg shadow-emerald-600/30 transition-all flex items-center gap-2 cursor-pointer disabled:opacity-50"
                    title="Paksa tulis seluruh data memori ke disk server saat ini juga"
                  >
                    {isSavingDisk ? (
                      <>
                        <RefreshCw className="w-4 h-4 animate-spin" />
                        <span>Menyimpan ke Disk...</span>
                      </>
                    ) : (
                      <>
                        <Save className="w-4 h-4" />
                        <span>Simpan ke Server Sekarang</span>
                      </>
                    )}
                  </button>
                </div>
              </div>

              {/* Status Metric Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5 mt-6 pt-5 border-t border-slate-800/80 font-mono text-xs">
                <div className="bg-slate-950/70 p-3 rounded-xl border border-slate-800/60">
                  <span className="text-[11px] text-slate-400 block font-sans">Direktori Penyimpanan</span>
                  <span className="text-xs font-bold text-amber-300 truncate block mt-1" title={storageStatus?.folderPath || './data'}>
                    📁 {storageStatus?.folderPath || './data'}
                  </span>
                </div>

                <div className="bg-slate-950/70 p-3 rounded-xl border border-slate-800/60">
                  <span className="text-[11px] text-slate-400 block font-sans">Terakhir Disimpan</span>
                  <span className="text-xs font-bold text-emerald-300 block mt-1">
                    {storageStatus?.lastSaved
                      ? new Date(storageStatus.lastSaved).toLocaleTimeString('id-ID', {
                          hour: '2-digit',
                          minute: '2-digit',
                          second: '2-digit'
                        }) + ' WIB'
                      : 'Baru saja'}
                  </span>
                </div>

                <div className="bg-slate-950/70 p-3 rounded-xl border border-slate-800/60">
                  <span className="text-[11px] text-slate-400 block font-sans">Frekuensi Auto-Save</span>
                  <span className="text-xs font-bold text-cyan-300 block mt-1">
                    {storageStatus?.saveCount || 1} kali flush
                  </span>
                </div>

                <div className="bg-slate-950/70 p-3 rounded-xl border border-slate-800/60">
                  <span className="text-[11px] text-slate-400 block font-sans">Jumlah Gelanggang</span>
                  <span className="text-xs font-bold text-white block mt-1">
                    {storageStatus?.stats.totalArenas || Object.keys(arenasList).length} Arena Aktif
                  </span>
                </div>
              </div>
            </div>

            {/* 2. File Database Registry Table */}
            <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-5 space-y-4">
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <div>
                  <h3 className="text-sm font-bold text-white flex items-center gap-2">
                    <Database className="w-4 h-4 text-emerald-400" />
                    Daftar Berkas Basis Data Server Lokal
                  </h3>
                  <p className="text-xs text-slate-400">
                    Berkas JSON terstruktur yang tersimpan secara permanen pada direktori server lokal.
                  </p>
                </div>
                <span className="text-[11px] font-mono text-emerald-300 bg-emerald-950/60 px-3 py-1 rounded-lg border border-emerald-800/60 flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                  Format JSON Terarsip
                </span>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="border-b border-slate-800 text-slate-400 font-semibold uppercase text-[10px] tracking-wider">
                      <th className="py-2.5 px-3">Berkas</th>
                      <th className="py-2.5 px-3">Deskripsi Konten</th>
                      <th className="py-2.5 px-3 text-center">Ukuran</th>
                      <th className="py-2.5 px-3 text-center">Data Terdata</th>
                      <th className="py-2.5 px-3">Waktu Diperbarui</th>
                      <th className="py-2.5 px-3 text-center">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60 font-sans">
                    {storageStatus?.files && storageStatus.files.length > 0 ? (
                      storageStatus.files.map((file: StorageFileInfo, idx: number) => (
                        <tr key={idx} className="hover:bg-slate-800/40 transition-colors">
                          <td className="py-3 px-3 font-mono font-bold text-amber-300 flex items-center gap-2">
                            <FileCheck className="w-4 h-4 text-emerald-400 shrink-0" />
                            <span>{file.name}</span>
                          </td>
                          <td className="py-3 px-3 text-slate-300">
                            {file.description}
                          </td>
                          <td className="py-3 px-3 text-center font-mono text-slate-200">
                            {file.formattedSize}
                          </td>
                          <td className="py-3 px-3 text-center font-mono text-cyan-300">
                            {file.itemCount !== undefined ? `${file.itemCount} item` : '-'}
                          </td>
                          <td className="py-3 px-3 text-slate-400 font-mono text-[11px]">
                            {file.lastModified ? new Date(file.lastModified).toLocaleString('id-ID') : '-'}
                          </td>
                          <td className="py-3 px-3 text-center">
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-950 border border-emerald-700/60 text-emerald-300">
                              <CheckCircle2 className="w-3 h-3" />
                              Tersimpan
                            </span>
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan={6} className="py-6 text-center text-slate-500">
                          Memuat rincian berkas penyimpanan server lokal...
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {/* 3. Action Center: Backup, Export, and Restore */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Card 1: Snapshot & Export */}
              <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-5 space-y-4">
                <div className="border-b border-slate-800 pb-3">
                  <h3 className="text-sm font-bold text-white flex items-center gap-2">
                    <FolderArchive className="w-4 h-4 text-cyan-400" />
                    Pencadangan Data (Backup Snapshot)
                  </h3>
                  <p className="text-xs text-slate-400">
                    Buat salinan data ber-timestamp atau unduh arsip data turnamen untuk arsip panitia.
                  </p>
                </div>

                <div className="space-y-3">
                  <button
                    id="admin-create-backup-btn"
                    onClick={handleCreateLocalBackup}
                    disabled={isCreatingBackup}
                    className="w-full py-3 bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white font-bold text-xs rounded-xl shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                  >
                    {isCreatingBackup ? (
                      <>
                        <RefreshCw className="w-4 h-4 animate-spin" />
                        <span>Membuat Salinan Cadangan...</span>
                      </>
                    ) : (
                      <>
                        <FolderArchive className="w-4 h-4" />
                        <span>Buat Snapshot Cadangan di Server Lokal</span>
                      </>
                    )}
                  </button>

                  <a
                    id="admin-export-db-btn"
                    href="/api/storage/export"
                    download={`silat_backup_${new Date().toISOString().slice(0, 10)}.json`}
                    className="w-full py-3 bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white font-bold text-xs rounded-xl border border-slate-700 transition-colors flex items-center justify-center gap-2 cursor-pointer"
                  >
                    <Download className="w-4 h-4 text-emerald-400" />
                    <span>Unduh Arsip Lengkap Database (.JSON)</span>
                  </a>
                </div>

                <div className="bg-slate-950/60 p-3 rounded-xl border border-slate-800 text-[11px] text-slate-400 space-y-1">
                  <span className="text-slate-300 font-semibold block">Lokasi Snapshot di Server:</span>
                  <span className="font-mono text-cyan-300">./data/backups/silat_backup_YYYYMMDD_HHMMSS.json</span>
                </div>
              </div>

              {/* Card 2: Restore from Backup */}
              <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-5 space-y-4">
                <div className="border-b border-slate-800 pb-3">
                  <h3 className="text-sm font-bold text-white flex items-center gap-2">
                    <Upload className="w-4 h-4 text-amber-400" />
                    Pemulihan Data (Restore Database)
                  </h3>
                  <p className="text-xs text-slate-400">
                    Pulihkan seluruh data pertandingan, wasit, dan turnamen dari berkas cadangan JSON yang valid.
                  </p>
                </div>

                <div className="space-y-3">
                  <label
                    htmlFor="restore-file-input"
                    className="w-full py-3 bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/40 text-amber-300 hover:text-amber-200 font-bold text-xs rounded-xl transition-all flex items-center justify-center gap-2 cursor-pointer"
                  >
                    <Upload className="w-4 h-4" />
                    <span>Pilih Berkas Cadangan JSON untuk Dipulihkan</span>
                  </label>
                  <input
                    id="restore-file-input"
                    type="file"
                    accept=".json"
                    onChange={handleRestoreDatabase}
                    className="hidden"
                  />

                  <div className="bg-amber-950/30 border border-amber-800/40 p-3 rounded-xl text-[11px] text-amber-200/90 leading-relaxed flex items-start gap-2.5">
                    <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                    <span>
                      <strong>Perhatian:</strong> Pemulihan data akan menggantikan status turnamen, gelanggang, dan wasit saat ini di server lokal dengan isi berkas backup.
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* 4. Node.js Auto-Build & APK Readiness Card */}
            <div className="bg-gradient-to-r from-amber-950/40 via-slate-900/90 to-slate-900 border border-amber-500/30 rounded-2xl p-6 shadow-xl relative overflow-hidden">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="space-y-1.5">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-400">
                      <Cpu className="w-4 h-4" />
                    </div>
                    <h3 className="text-sm font-bold text-white flex items-center gap-2">
                      Auto-Build Otomatis di Node.js (APK & Standalone)
                      {buildStatus?.isBuilding ? (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-amber-500/20 text-amber-300 border border-amber-500/40 animate-pulse flex items-center gap-1">
                          <RefreshCw className="w-2.5 h-2.5 animate-spin" />
                          Sedang Mengompilasi...
                        </span>
                      ) : buildStatus?.hasBuild ? (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 flex items-center gap-1">
                          <Check className="w-2.5 h-2.5" />
                          Siap & Terkompilasi ({buildStatus.builtFilesCount} Berkas)
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-amber-500/20 text-amber-300 border border-amber-500/40">
                          Auto-Build Siaga
                        </span>
                      )}
                    </h3>
                  </div>
                  <p className="text-xs text-slate-300 leading-relaxed max-w-2xl">
                    Sistem otomatis mengompilasi bundel Vite secara langsung di lingkungan Node.js saat pertama kali masuk ke aplikasi / APK. Anda juga dapat memicu build manual kapan pun.
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    id="admin-trigger-build-btn"
                    onClick={handleTriggerNodeBuild}
                    disabled={isTriggeringBuild || buildStatus?.isBuilding}
                    className="px-4 py-2.5 rounded-xl bg-amber-600 hover:bg-amber-500 active:scale-95 text-slate-950 font-black text-xs shadow-lg shadow-amber-600/30 transition-all flex items-center gap-2 cursor-pointer disabled:opacity-50"
                  >
                    {isTriggeringBuild || buildStatus?.isBuilding ? (
                      <>
                        <RefreshCw className="w-4 h-4 animate-spin" />
                        <span>Mengompilasi Vite di Node.js...</span>
                      </>
                    ) : (
                      <>
                        <Zap className="w-4 h-4" />
                        <span>Jalankan Build Node.js Sekarang</span>
                      </>
                    )}
                  </button>
                </div>
              </div>

              {buildStatus?.lastBuiltAt && (
                <div className="mt-3 pt-3 border-t border-slate-800/80 flex items-center gap-2 text-[11px] text-slate-400 font-mono">
                  <Clock className="w-3.5 h-3.5 text-amber-400" />
                  <span>Terakhir di-build di Node.js:</span>
                  <span className="text-amber-300 font-bold">
                    {new Date(buildStatus.lastBuiltAt).toLocaleString('id-ID')}
                  </span>
                </div>
              )}
            </div>

            {/* 5. Technical Architecture Callout */}
            <div className="bg-slate-900/60 border border-slate-800/90 rounded-2xl p-5">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-300 flex items-center gap-2 mb-3">
                <Server className="w-4 h-4 text-blue-400" />
                Arsitektur Ketahanan Penyimpanan Lokal (Local Persistence Engine)
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs text-slate-400 leading-relaxed">
                <div className="bg-slate-950/60 p-3.5 rounded-xl border border-slate-800/70">
                  <span className="font-bold text-slate-200 block mb-1">🛡️ Penulisan Berkas Atomik</span>
                  Data ditulis ke berkas sementara (.tmp) sebelum diganti secara atomik (`fs.renameSync`). File database tidak akan pernah korup meskipun terjadi mati lampu mendadak.
                </div>
                <div className="bg-slate-950/60 p-3.5 rounded-xl border border-slate-800/70">
                  <span className="font-bold text-slate-200 block mb-1">⚡ Auto-Debounce Non-Blocking</span>
                  Setiap aksi juri, wasit, dan timer dijadwalkan secara pintar (600ms debounce) sehingga I/O server tetap kencang tanpa lag pada perangkat juri.
                </div>
                <div className="bg-slate-950/60 p-3.5 rounded-xl border border-slate-800/70">
                  <span className="font-bold text-slate-200 block mb-1">📶 Offline-First & Mandiri</span>
                  Berjalan 100% pada jaringan lokal (LAN / Router Wi-Fi) di arena pertandingan tanpa perlu koneksi internet cloud eksternal.
                </div>
              </div>
            </div>
          </div>
        )}

        {/* =================================================================== */}
        {/* TAB 7: RESET DATA TOTAL */}
        {/* =================================================================== */}
        {activeTab === 'reset_total' && (
          <div className="space-y-6">
            {/* Header Banner */}
            <div className="bg-gradient-to-r from-red-950/80 via-slate-900 to-rose-950/60 border border-red-500/30 rounded-2xl p-6 shadow-2xl relative overflow-hidden">
              <div className="absolute top-0 right-0 w-80 h-80 bg-rose-500/10 rounded-full blur-3xl pointer-events-none" />

              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 relative z-10">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-2xl bg-rose-500/20 border border-rose-500/40 flex items-center justify-center text-rose-400 shrink-0 shadow-lg shadow-rose-950/50">
                    <RotateCcw className="w-6 h-6 animate-pulse" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h2 className="text-lg font-bold text-white">
                        Pusat Reset Data Total Turnamen & Gelanggang
                      </h2>
                      <span className="text-[10px] font-black px-2 py-0.5 rounded-full bg-rose-500 text-slate-950 uppercase tracking-wider">
                        ZONA KRITIS
                      </span>
                    </div>
                    <p className="text-xs text-slate-300 mt-1 max-w-2xl leading-relaxed">
                      Kelola pembersihan data menyeluruh: Skor live tanding & seni, hit juri, babak pertandingan, deduksi dewan, bagan bracket, dan arsip riwayat pertandingan dengan perlindungan verifikasi ganda.
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={handleOpenResetModal}
                    className="px-5 py-3 rounded-xl bg-gradient-to-r from-rose-600 to-red-600 hover:from-rose-500 hover:to-red-500 active:scale-95 text-white font-black text-xs shadow-xl shadow-rose-950/50 transition-all flex items-center gap-2 cursor-pointer border border-rose-400/40"
                  >
                    <AlertTriangle className="w-4 h-4" />
                    <span>Lanjutkan ke Konfirmasi Reset Total</span>
                  </button>
                </div>
              </div>

              {/* Status metric overview */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5 mt-6 pt-5 border-t border-slate-800/80 text-xs font-mono">
                <div className="bg-slate-950/70 p-3 rounded-xl border border-slate-800/60">
                  <span className="text-[10px] text-slate-400 block font-sans">Total Gelanggang:</span>
                  <span className="text-sm font-bold text-white mt-0.5 block">
                    {arenasList.length} Gelanggang
                  </span>
                </div>
                <div className="bg-slate-950/70 p-3 rounded-xl border border-slate-800/60">
                  <span className="text-[10px] text-slate-400 block font-sans">Riwayat Match di Gelanggang Ini:</span>
                  <span className="text-sm font-bold text-rose-300 mt-0.5 block">
                    {histories?.length || 0} Arsip Riwayat
                  </span>
                </div>
                <div className="bg-slate-950/70 p-3 rounded-xl border border-slate-800/60">
                  <span className="text-[10px] text-slate-400 block font-sans">Kategori Seni Aktif:</span>
                  <span className="text-sm font-bold text-purple-300 mt-0.5 block">
                    {tgrState?.pesertaList?.length || 0} Atlet Terdaftar
                  </span>
                </div>
                <div className="bg-slate-950/70 p-3 rounded-xl border border-slate-800/60">
                  <span className="text-[10px] text-slate-400 block font-sans">Koneksi Persistence:</span>
                  <span className="text-sm font-bold text-emerald-300 mt-0.5 flex items-center gap-1.5">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                    Server Lokal Siap
                  </span>
                </div>
              </div>
            </div>

            {/* Step 1 & 2 Grid: Scope & Reset Options */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              {/* Left: Scope Selection */}
              <div className="lg:col-span-5 bg-slate-900/80 border border-slate-800 rounded-2xl p-5 space-y-4">
                <div className="border-b border-slate-800 pb-3">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-rose-400 block mb-1">
                    LANGKAH 1
                  </span>
                  <h3 className="text-sm font-bold text-white flex items-center gap-2">
                    <LayoutGrid className="w-4 h-4 text-rose-400" />
                    Pilih Cakupan Gelanggang yang Direset
                  </h3>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Tentukan apakah reset berlaku ke seluruh turnamen atau gelanggang tertentu saja.
                  </p>
                </div>

                <div className="space-y-3">
                  {/* Option: Semua Gelanggang */}
                  <label
                    onClick={() => { playBeep('click'); setResetScope('all_arenas'); }}
                    className={`block p-4 rounded-xl border cursor-pointer transition-all ${
                      resetScope === 'all_arenas'
                        ? 'bg-rose-950/30 border-rose-500 ring-2 ring-rose-500/40 text-white'
                        : 'bg-slate-950 border-slate-800 hover:border-slate-700 text-slate-300'
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <input
                        type="radio"
                        name="reset_scope"
                        checked={resetScope === 'all_arenas'}
                        onChange={() => setResetScope('all_arenas')}
                        className="mt-1 w-4 h-4 text-rose-600 focus:ring-rose-500 bg-slate-900 border-slate-700"
                      />
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-bold">Semua Gelanggang (Turnamen Penuh)</span>
                          <span className="text-[9px] font-black px-2 py-0.5 rounded-full bg-rose-500 text-slate-950 uppercase">
                            SEMUA MATRAS
                          </span>
                        </div>
                        <p className="text-xs text-slate-400 leading-relaxed">
                          Mereset seluruh gelanggang terdaftar ({arenasList.map(a => a.nama).join(', ')}) secara serentak. Sangat cocok sebelum turnamen resmi dimulai atau saat ganti hari tanding.
                        </p>
                      </div>
                    </div>
                  </label>

                  {/* Option: Gelanggang Tertentu */}
                  <label
                    onClick={() => { playBeep('click'); setResetScope('single_arena'); }}
                    className={`block p-4 rounded-xl border cursor-pointer transition-all ${
                      resetScope === 'single_arena'
                        ? 'bg-rose-950/30 border-rose-500 ring-2 ring-rose-500/40 text-white'
                        : 'bg-slate-950 border-slate-800 hover:border-slate-700 text-slate-300'
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <input
                        type="radio"
                        name="reset_scope"
                        checked={resetScope === 'single_arena'}
                        onChange={() => setResetScope('single_arena')}
                        className="mt-1 w-4 h-4 text-rose-600 focus:ring-rose-500 bg-slate-900 border-slate-700"
                      />
                      <div className="space-y-2 flex-1">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-bold">Hanya Gelanggang Tertentu Saja</span>
                          <span className="text-[9px] font-black px-2 py-0.5 rounded-full bg-slate-800 text-slate-300">
                            1 MATRAS
                          </span>
                        </div>
                        <p className="text-xs text-slate-400 leading-relaxed">
                          Hanya membersihkan data gelanggang yang Anda pilih di bawah tanpa mengganggu gelanggang lain yang sedang berjalan.
                        </p>

                        {resetScope === 'single_arena' && (
                          <div className="pt-2">
                            <label className="block text-[11px] font-bold text-slate-300 mb-1">
                              Pilih Gelanggang Target:
                            </label>
                            <select
                              value={resetTargetArenaId}
                              onChange={(e) => setResetTargetArenaId(e.target.value)}
                              className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-xs text-white focus:outline-none focus:border-rose-500 font-semibold"
                            >
                              {arenasList.map(a => (
                                <option key={a.id} value={a.id}>
                                  {a.nama} ({a.modeAktif === 'seni' ? 'Kategori Seni' : 'Kategori Tanding'}) - {a.keterangan || a.id}
                                </option>
                              ))}
                            </select>
                          </div>
                        )}
                      </div>
                    </div>
                  </label>
                </div>

                {/* Audit Note input */}
                <div className="pt-2">
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Catatan Alasan Reset (Opsional untuk Jejak Audit):
                  </label>
                  <input
                    type="text"
                    value={resetNote}
                    onChange={(e) => setResetNote(e.target.value)}
                    placeholder="e.g. Simulasi uji coba selesai, persiapan babak final"
                    className="w-full px-3.5 py-2 bg-slate-950 border border-slate-700 rounded-xl text-xs text-white focus:outline-none focus:border-rose-500"
                  />
                </div>
              </div>

              {/* Right: Reset Target Options */}
              <div className="lg:col-span-7 bg-slate-900/80 border border-slate-800 rounded-2xl p-5 space-y-4">
                <div className="border-b border-slate-800 pb-3 flex items-center justify-between">
                  <div>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-rose-400 block mb-1">
                      LANGKAH 2
                    </span>
                    <h3 className="text-sm font-bold text-white flex items-center gap-2">
                      <Sliders className="w-4 h-4 text-rose-400" />
                      Pilih Target Data yang Akan Direset
                    </h3>
                  </div>
                </div>

                <div className="space-y-3">
                  {/* Preset 1: Total Factory Reset */}
                  <label
                    onClick={() => { playBeep('click'); setResetType('all'); }}
                    className={`block p-3.5 rounded-xl border cursor-pointer transition-all ${
                      resetType === 'all'
                        ? 'bg-red-950/40 border-red-500 ring-2 ring-red-500/40 text-white'
                        : 'bg-slate-950 border-slate-800 hover:border-slate-700 text-slate-300'
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <input
                        type="radio"
                        name="reset_type"
                        checked={resetType === 'all'}
                        onChange={() => setResetType('all')}
                        className="mt-1 w-4 h-4 text-red-600 focus:ring-red-500 bg-slate-900 border-slate-700"
                      />
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-bold text-red-300">
                            🔴 RESET DATA TOTAL TURNAMEN (PABRIK / KOMPLIT)
                          </span>
                          <span className="text-[9px] font-black px-2 py-0.5 rounded-full bg-red-600 text-white uppercase">
                            PALING LENGKAP
                          </span>
                        </div>
                        <p className="text-xs text-slate-400 leading-relaxed">
                          Mereset total skor tanding (0-0), mengosongkan nilai juri seni 1..10, mengembalikan status peserta seni ke "Belum Menilai", mereset pemenang bagan/bracket kembali ke awal, dan mengosongkan seluruh arsip riwayat pertandingan (Match History).
                        </p>
                      </div>
                    </div>
                  </label>

                  {/* Preset 2: Scores Live Only */}
                  <label
                    onClick={() => { playBeep('click'); setResetType('scores_only'); }}
                    className={`block p-3.5 rounded-xl border cursor-pointer transition-all ${
                      resetType === 'scores_only'
                        ? 'bg-amber-950/40 border-amber-500 ring-2 ring-amber-500/40 text-white'
                        : 'bg-slate-950 border-slate-800 hover:border-slate-700 text-slate-300'
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <input
                        type="radio"
                        name="reset_type"
                        checked={resetType === 'scores_only'}
                        onChange={() => setResetType('scores_only')}
                        className="mt-1 w-4 h-4 text-amber-500 focus:ring-amber-400 bg-slate-900 border-slate-700"
                      />
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-bold text-amber-300">
                            🟠 Reset Skor Live Tanding & Seni Saja
                          </span>
                          <span className="text-[9px] font-black px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30">
                            BAGAN AMAN
                          </span>
                        </div>
                        <p className="text-xs text-slate-400 leading-relaxed">
                          Mengosongkan skor live pertandingan di matras (babak tanding dan nilai juri seni), namun daftar atlet, susunan bagan bracket, dan arsip riwayat pertandingan tetap dipertahankan.
                        </p>
                      </div>
                    </div>
                  </label>

                  {/* Preset 3: Seni Only */}
                  <label
                    onClick={() => { playBeep('click'); setResetType('seni_only'); }}
                    className={`block p-3.5 rounded-xl border cursor-pointer transition-all ${
                      resetType === 'seni_only'
                        ? 'bg-purple-950/40 border-purple-500 ring-2 ring-purple-500/40 text-white'
                        : 'bg-slate-950 border-slate-800 hover:border-slate-700 text-slate-300'
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <input
                        type="radio"
                        name="reset_type"
                        checked={resetType === 'seni_only'}
                        onChange={() => setResetType('seni_only')}
                        className="mt-1 w-4 h-4 text-purple-600 focus:ring-purple-500 bg-slate-900 border-slate-700"
                      />
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-bold text-purple-300">
                            🟣 Reset Kategori Seni / TGR Saja
                          </span>
                        </div>
                        <p className="text-xs text-slate-400 leading-relaxed">
                          Mengosongkan skor semua juri seni, reset waktu tampil ke 0, hapus deduksi dewan, dan kembalikan status peserta seni ke "Belum Menilai". Pertandingan tanding tidak terpengaruh.
                        </p>
                      </div>
                    </div>
                  </label>

                  {/* Preset 4: Tanding Only */}
                  <label
                    onClick={() => { playBeep('click'); setResetType('tanding_only'); }}
                    className={`block p-3.5 rounded-xl border cursor-pointer transition-all ${
                      resetType === 'tanding_only'
                        ? 'bg-blue-950/40 border-blue-500 ring-2 ring-blue-500/40 text-white'
                        : 'bg-slate-950 border-slate-800 hover:border-slate-700 text-slate-300'
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <input
                        type="radio"
                        name="reset_type"
                        checked={resetType === 'tanding_only'}
                        onChange={() => setResetType('tanding_only')}
                        className="mt-1 w-4 h-4 text-blue-600 focus:ring-blue-500 bg-slate-900 border-slate-700"
                      />
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-bold text-blue-300">
                            🔵 Reset Kategori Tanding Saja
                          </span>
                        </div>
                        <p className="text-xs text-slate-400 leading-relaxed">
                          Mengosongkan skor live sudut merah dan biru (kembali 0-0), reset hit juri 1-3, reset binaan/teguran dewan, dan kembalikan ke Babak 1 timer awal. Kategori seni tidak terpengaruh.
                        </p>
                      </div>
                    </div>
                  </label>

                  {/* Preset 5: Histories Only */}
                  <label
                    onClick={() => { playBeep('click'); setResetType('history_only'); }}
                    className={`block p-3.5 rounded-xl border cursor-pointer transition-all ${
                      resetType === 'history_only'
                        ? 'bg-slate-800/80 border-slate-500 ring-2 ring-slate-500/40 text-white'
                        : 'bg-slate-950 border-slate-800 hover:border-slate-700 text-slate-300'
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <input
                        type="radio"
                        name="reset_type"
                        checked={resetType === 'history_only'}
                        onChange={() => setResetType('history_only')}
                        className="mt-1 w-4 h-4 text-slate-400 focus:ring-slate-400 bg-slate-900 border-slate-700"
                      />
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-bold text-slate-200">
                            ⚪ Kosongkan Arsip Riwayat Pertandingan (History Clean) Saja
                          </span>
                        </div>
                        <p className="text-xs text-slate-400 leading-relaxed">
                          Hanya menghapus daftar riwayat match history yang tersimpan di server tanpa mengubah skor atau jalannya partai yang sedang berlangsung di matras.
                        </p>
                      </div>
                    </div>
                  </label>

                  {/* Preset 6: Peserta & Kontingen */}
                  <label
                    onClick={() => { playBeep('click'); setResetType('peserta_kontingen'); }}
                    className={`block p-3.5 rounded-xl border cursor-pointer transition-all ${
                      resetType === 'peserta_kontingen'
                        ? 'bg-emerald-950/40 border-emerald-500 ring-2 ring-emerald-500/40 text-white'
                        : 'bg-slate-950 border-slate-800 hover:border-slate-700 text-slate-300'
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <input
                        type="radio"
                        name="reset_type"
                        checked={resetType === 'peserta_kontingen'}
                        onChange={() => setResetType('peserta_kontingen')}
                        className="mt-1 w-4 h-4 text-emerald-500 focus:ring-emerald-400 bg-slate-900 border-slate-700"
                      />
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-bold text-emerald-300">
                            🟢 Reset Data Kontingen & Peserta Semua Panel
                          </span>
                          <span className="text-[9px] font-black px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                            SEMUA MATRAS & BAGAN
                          </span>
                        </div>
                        <p className="text-xs text-slate-400 leading-relaxed">
                          Mereset nama atlet & kontingen tanding kembali ke default, mengosongkan seluruh bagan pertandingan/bracket, serta membersihkan seluruh data atlet & pool kategori seni TGR di semua gelanggang.
                        </p>
                      </div>
                    </div>
                  </label>
                </div>

                <div className="pt-3 border-t border-slate-800 flex justify-end">
                  <button
                    type="button"
                    onClick={handleOpenResetModal}
                    className="w-full sm:w-auto px-6 py-3 rounded-xl bg-gradient-to-r from-rose-600 to-red-600 hover:from-rose-500 hover:to-red-500 text-white font-black text-xs shadow-lg shadow-rose-950/40 transition-all flex items-center justify-center gap-2 cursor-pointer"
                  >
                    <RotateCcw className="w-4 h-4" />
                    <span>Lanjutkan ke Konfirmasi Reset Total</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </main>

      {/* MODAL DOUBLE CONFIRMATION RESET DATA TOTAL */}
      {isResetModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-rose-500/50 rounded-2xl max-w-lg w-full p-6 shadow-2xl shadow-rose-950/60 space-y-5 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 rounded-xl bg-rose-500/20 border border-rose-500/50 flex items-center justify-center text-rose-400 shrink-0">
                <AlertTriangle className="w-6 h-6 animate-bounce" />
              </div>
              <div className="space-y-1">
                <h3 className="text-base font-bold text-white flex items-center gap-2">
                  Konfirmasi Eksekusi Reset Data Total
                </h3>
                <p className="text-xs text-rose-300 font-medium">
                  Tindakan ini permanen dan akan langsung disinkronkan ke seluruh perangkat & layar monitor.
                </p>
              </div>
            </div>

            <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-2 text-xs">
              <div className="flex justify-between items-center py-1 border-b border-slate-800/80">
                <span className="text-slate-400">Cakupan Gelanggang:</span>
                <span className="font-bold text-white">
                  {resetScope === 'all_arenas' ? 'SEMUA Gelanggang' : `Gelanggang ${resetTargetArenaId}`}
                </span>
              </div>
              <div className="flex justify-between items-center py-1 border-b border-slate-800/80">
                <span className="text-slate-400">Target Reset:</span>
                <span className="font-bold text-rose-300">
                  {resetType === 'all' ? 'RESET DATA TOTAL (Pabrik / Komplit)' :
                   resetType === 'scores_only' ? 'Reset Skor Live Tanding & Seni Saja' :
                   resetType === 'seni_only' ? 'Reset Kategori Seni Saja' :
                   resetType === 'tanding_only' ? 'Reset Kategori Tanding Saja' :
                   resetType === 'peserta_kontingen' ? 'Reset Data Kontingen & Peserta Semua Panel' :
                   'Kosongkan Riwayat Pertandingan Saja'}
                </span>
              </div>
              {resetNote && (
                <div className="flex justify-between items-center py-1">
                  <span className="text-slate-400">Catatan Audit:</span>
                  <span className="font-medium text-slate-300 truncate max-w-[200px]">{resetNote}</span>
                </div>
              )}
            </div>

            {/* Checkbox agreement */}
            <label className="flex items-start gap-3 p-3 bg-rose-950/30 border border-rose-900/60 rounded-xl cursor-pointer">
              <input
                type="checkbox"
                checked={isConfirmUnderstood}
                onChange={(e) => setIsConfirmUnderstood(e.target.checked)}
                className="mt-0.5 w-4 h-4 rounded text-rose-600 focus:ring-rose-500 bg-slate-900 border-rose-700"
              />
              <span className="text-xs text-rose-200 leading-relaxed select-none">
                Saya menyatakan memahami bahwa data yang dipilih akan direset dan tindakan ini tidak dapat dibatalkan.
              </span>
            </label>

            {/* Type RESET verification */}
            <div className="space-y-1.5">
              <label className="block text-xs font-semibold text-slate-300">
                Ketik <strong className="text-rose-400 font-mono tracking-wider">RESET</strong> dengan huruf kapital untuk mengaktifkan tombol eksekusi:
              </label>
              <input
                type="text"
                value={resetConfirmText}
                onChange={(e) => setResetConfirmText(e.target.value)}
                placeholder="RESET"
                className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-700 rounded-xl text-sm font-mono font-bold text-white focus:outline-none focus:border-rose-500 text-center tracking-widest placeholder:text-slate-600"
              />
            </div>

            <div className="pt-2 flex items-center justify-end gap-3 border-t border-slate-800">
              <button
                type="button"
                onClick={() => { playBeep('click'); setIsResetModalOpen(false); }}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold rounded-xl cursor-pointer"
              >
                Batal (Aman)
              </button>
              <button
                type="button"
                onClick={handleExecuteResetDataTotal}
                disabled={isExecutingReset || !isConfirmUnderstood || resetConfirmText.trim().toUpperCase() !== 'RESET'}
                className="px-5 py-2.5 bg-rose-600 hover:bg-rose-500 active:scale-95 text-white text-xs font-black rounded-xl shadow-lg shadow-rose-950/60 flex items-center gap-2 cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
              >
                {isExecutingReset ? (
                  <>
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    <span>Mengeksekusi Reset...</span>
                  </>
                ) : (
                  <>
                    <RotateCcw className="w-3.5 h-3.5" />
                    <span>Eksekusi Reset Sekarang</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL UPLOAD FOTO LAYAR HUKUMAN TANPA BACKGROUND */}
      <PenaltyPhotoUploaderModal
        isOpen={isPhotoUploaderOpen}
        onClose={() => setIsPhotoUploaderOpen(false)}
        targetSlot={photoUploaderTargetSlot}
        currentConfig={localPenaltyIcons}
        onApplyPhoto={handleApplyUploadedPhoto}
      />
    </div>
  );
};
