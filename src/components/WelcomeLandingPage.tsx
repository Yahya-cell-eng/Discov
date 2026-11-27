/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { motion } from 'motion/react';
import {
  Shield,
  Award,
  Users,
  Radio,
  FileDown,
  Maximize2,
  Minimize2,
  ChevronRight,
  Sparkles,
  Wifi,
  WifiOff,
  HardDrive,
  CheckCircle2,
  Tv,
  Calendar,
  Layers,
  ArrowRight,
  FileSpreadsheet,
  Settings,
  HelpCircle,
  Cloud
} from 'lucide-react';
import type { User } from 'firebase/auth';
import { playBeep } from '../utils/sound';
import ykLogo from '../assets/images/yk_logo.jpg';
import { MatchHistory, TGRState, MatchState, GelanggangInfo, ArenaSummary } from '../types';
import ThemePaletteSelector from './ThemePaletteSelector';
import PWAInstallButton from './PWAInstallButton';
import { generateSchedulePdf, ScheduleMetadata, ScheduleMatchRow } from '../utils/generateSchedulePdf';
import ServerConnectionModal from './ServerConnectionModal';
import type { GoogleDriveStorageProps } from './GoogleDriveStoragePanel';

interface WelcomeLandingPageProps extends GoogleDriveStorageProps {
  onSelectMode: (mode: 'tanding' | 'seni' | 'monitor_urutan' | 'admin', targetRole?: string) => void;
  theme: 'dark' | 'light';
  onToggleTheme: () => void;
  histories?: MatchHistory[];
  tgrState?: TGRState | null;
  state?: MatchState | null;
  dispatch?: (type: string, payload?: any) => void;
  currentArenaId?: string;
  onSelectArena?: (arenaId: string) => void;
  arenasList?: GelanggangInfo[];
  allArenasSummary?: ArenaSummary[];
  allArenasMap?: Record<string, { state: MatchState; tgrState: TGRState; histories: MatchHistory[]; info: GelanggangInfo }>;
  masterData?: any;
  connected?: boolean;
  onReconnect?: () => void;
  onOpenGelanggangTab?: () => void;
  onOpenRekapitulasiTab?: () => void;
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

export default function WelcomeLandingPage({
  onSelectMode,
  theme,
  onToggleTheme,
  histories = [],
  tgrState = null,
  state = null,
  dispatch = () => {},
  currentArenaId = 'arena_1',
  onSelectArena = () => {},
  arenasList = [],
  allArenasSummary = [],
  allArenasMap = {},
  masterData = null,
  connected = false,
  onReconnect = () => {},
  onOpenGelanggangTab,
  onOpenRekapitulasiTab,
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
}: WelcomeLandingPageProps) {
  const [showServerModal, setShowServerModal] = useState<boolean>(false);
  const [activeCategoryFilter, setActiveCategoryFilter] = useState<'all' | 'tanding' | 'seni'>('all');

  // Fullscreen toggle state
  const [isFullscreen, setIsFullscreen] = useState<boolean>(() => {
    if (typeof document !== 'undefined') {
      return !!(
        document.fullscreenElement ||
        (document as any).webkitFullscreenElement ||
        (document as any).mozFullScreenElement ||
        (document as any).msFullscreenElement
      );
    }
    return false;
  });

  const toggleFullscreen = () => {
    playBeep('click');
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().then(() => setIsFullscreen(true)).catch(() => {});
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen().then(() => setIsFullscreen(false)).catch(() => {});
      }
    }
  };

  // Download PDF schedule helper
  const handleDownloadSchedule = () => {
    playBeep('click');
    const currentArena = arenasList.find(a => a.id === currentArenaId) || arenasList[0] || {
      id: 'arena_1',
      nama: 'Gelanggang 1',
      kode: '1'
    };
    const digits = (currentArena.kode || currentArena.nama).match(/\d+/);
    const num = digits ? parseInt(digits[0], 10) : 1;
    const roman = ['I', 'II', 'III', 'IV', 'V', 'VI', 'VII', 'VIII'][num - 1] || 'I';
    const arenaFormatted = `GELANGGANG ${roman}`;

    const metadata: ScheduleMetadata = {
      headerTitle: "JADWAL PERTANDINGAN KEJUARAAN PENCAK SILAT",
      headerSubtitle: state?.namaEvent || 'YK DIGITAL SCORING CUP',
      headerLocationDate: new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' }),
      lokasiTanggal: new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' }),
      gelanggang: arenaFormatted,
      hariTanggal: new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' }),
      sesiNama: "1",
      sesiWaktu: "08:00 - SELESAI",
      pukul: "08:00 - SELESAI",
      showSignatures: false
    };

    const rows: ScheduleMatchRow[] = [];
    if (state?.baganCategories && state.baganCategories.length > 0) {
      let partaiNum = 1;
      state.baganCategories.forEach(cat => {
        cat.matches.forEach(m => {
          const roundLabel = m.round === 'final' ? 'FINAL' : m.round === 'semi' ? 'SEMI FINAL' : 'PENYISIHAN';
          rows.push({
            no: rows.length + 1,
            partai: (m.partai?.replace(/\D/g, '') || `${partaiNum++}`).padStart(2, '0'),
            kelas: `${cat.name} (${cat.gender || 'PA'})`,
            roundLabel,
            merahNama: m.atletMerah.nama || 'SUDUT MERAH',
            merahKontingen: m.atletMerah.kontingen || '-',
            biruNama: m.atletBiru.nama || 'SUDUT BIRU',
            biruKontingen: m.atletBiru.kontingen || '-',
            winner: m.winner,
            remark: m.winner ? `Pemenang: ${m.winner.toUpperCase()}` : 'Belum Mulai'
          });
        });
      });
    }

    generateSchedulePdf(metadata, rows);
  };

  const currentArenaObj = arenasList.find(a => a.id === currentArenaId) || arenasList[0];

  return (
    <div className="min-h-screen w-full flex flex-col justify-between items-center bg-[#020617] text-slate-100 relative overflow-x-hidden font-sans select-none">
      
      {/* Dynamic Martial Arts Lighting & Geometric Grid Background */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        {/* Subtle grid mesh */}
        <div className="absolute inset-0 bg-[linear-gradient(to_right,rgba(255,255,255,0.03)_1px,transparent_1px),linear-gradient(to_bottom,rgba(255,255,255,0.03)_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)]" />
        
        {/* Glowing Red & Blue Aura (Matching Sudut Merah & Sudut Biru) */}
        <div className="absolute -top-40 -left-40 w-96 h-96 bg-red-600/15 rounded-full blur-[140px]" />
        <div className="absolute -top-40 -right-40 w-96 h-96 bg-blue-600/15 rounded-full blur-[140px]" />
        <div className="absolute top-1/3 left-1/2 -translate-x-1/2 w-[40rem] h-[30rem] bg-gradient-to-b from-red-500/10 via-blue-500/10 to-transparent rounded-full blur-[160px]" />
      </div>

      {/* 1. TOP STATUS & NAV BAR */}
      <header className="w-full max-w-7xl z-20 px-4 sm:px-6 pt-4 pb-2 flex flex-wrap items-center justify-between gap-3">
        {/* Left: Official Badge & Arena Selector */}
        <div className="flex flex-wrap items-center gap-2.5">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full border border-red-500/30 bg-red-950/40 text-[10px] font-mono tracking-widest font-black uppercase text-red-300 shadow-[0_0_15px_rgba(239,68,68,0.2)]">
            <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
            <span>YK DIGITAL SCORING SYSTEM</span>
          </div>

          <div className="relative inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-slate-700/80 bg-slate-900/90 text-xs font-mono font-bold text-slate-200 shadow-md">
            <span className="w-2 h-2 rounded-full bg-cyan-400" />
            <span className="text-[10px] text-slate-400 uppercase hidden sm:inline">GELANGGANG AKTIF:</span>
            <select
              value={currentArenaId}
              onChange={(e) => {
                playBeep('click');
                onSelectArena(e.target.value);
              }}
              aria-label="Pilih Gelanggang Aktif"
              className="bg-transparent text-white font-extrabold text-xs cursor-pointer focus:outline-none uppercase pr-2"
            >
              {arenasList.map(a => (
                <option key={a.id} value={a.id} className="bg-slate-900 text-white">
                  {a.nama.toUpperCase()} ({a.kode})
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Right: Actions */}
        <div className="flex flex-wrap items-center gap-2.5">
          <PWAInstallButton variant="button" />
          <ThemePaletteSelector compact={false} />

          <button
            onClick={toggleFullscreen}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-slate-700 bg-slate-900/80 hover:bg-slate-800 text-xs font-mono font-bold uppercase text-slate-300 shadow transition-all cursor-pointer"
            title="Mode Layar Penuh (F11)"
          >
            <Maximize2 className="w-3.5 h-3.5 text-cyan-400" />
            <span className="hidden sm:inline">FULLSCREEN</span>
          </button>

          <button
            onClick={handleDownloadSchedule}
            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full border border-emerald-500/50 bg-emerald-950/70 hover:bg-emerald-900/80 text-xs font-mono font-bold uppercase text-emerald-300 shadow transition-all cursor-pointer"
            title="Unduh Jadwal Pertandingan Format PDF A4"
          >
            <FileDown className="w-3.5 h-3.5 text-emerald-400" />
            <span className="hidden sm:inline">JADWAL PDF</span>
          </button>

          <button
            onClick={() => {
              playBeep('click');
              setShowServerModal(true);
            }}
            className={`inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full border text-xs font-mono font-bold uppercase transition-all cursor-pointer ${
              driveConnected
                ? 'border-emerald-500/60 bg-emerald-950/70 text-emerald-300 shadow-[0_0_15px_rgba(16,185,129,0.3)]'
                : googleUser && googleSyncEnabled && googleSyncStatus === 'synced'
                ? 'border-blue-500/60 bg-blue-950/70 text-blue-300 shadow-[0_0_15px_rgba(59,130,246,0.3)]'
                : connected
                ? 'border-emerald-500/60 bg-emerald-950/70 text-emerald-300 shadow-[0_0_15px_rgba(16,185,129,0.3)]'
                : 'border-amber-500/60 bg-amber-950/70 text-amber-300 shadow-[0_0_15px_rgba(245,158,11,0.3)]'
            }`}
            title="Pengaturan Penyimpanan Google Drive, Google Cloud & Server Lokal Wi-Fi"
          >
            {driveConnected ? (
              <HardDrive className="w-3.5 h-3.5 text-emerald-400" />
            ) : googleUser && googleSyncEnabled && googleSyncStatus === 'synced' ? (
              <Cloud className="w-3.5 h-3.5 text-blue-400" />
            ) : connected ? (
              <Wifi className="w-3.5 h-3.5 text-emerald-400" />
            ) : (
              <WifiOff className="w-3.5 h-3.5 text-amber-400" />
            )}
            <span className="hidden sm:inline">
              {driveConnected
                ? 'DRIVE TERHUBUNG'
                : googleUser && googleSyncEnabled && googleSyncStatus === 'synced'
                ? 'SERVER GOOGLE AKTIF'
                : googleSyncStatus === 'connecting'
                ? 'MENYAMBUNG GOOGLE...'
                : connected
                ? 'SERVER TERHUBUNG'
                : 'SETUP SERVER'}
            </span>
          </button>
        </div>
      </header>

      {/* 2. HERO WELCOME SECTION WITH THE PROMINENT YK DIGITAL SCORING LOGO */}
      <main className="w-full max-w-6xl z-10 px-4 py-4 flex flex-col items-center text-center">
        
        {/* LOGO CONTAINER WITH GLOWING CHAMPIONSHIP RINGS */}
        <motion.div
          initial={{ scale: 0.85, opacity: 0, y: -20 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
          className="relative my-2 flex items-center justify-center group"
        >
          {/* Animated concentric rings inspired by tournament circle */}
          <div className="absolute -inset-6 rounded-full bg-gradient-to-tr from-red-600/30 via-red-500/10 to-blue-600/30 blur-2xl group-hover:blur-3xl transition-all duration-500" />
          <div className="absolute -inset-2 rounded-full border-2 border-red-500/30 border-dashed animate-[spin_40s_linear_infinite]" />
          
          {/* Main Logo Graphic Badge */}
          <div className="relative w-44 h-44 sm:w-56 sm:h-56 md:w-64 md:h-64 rounded-3xl p-1 bg-gradient-to-b from-red-500 via-slate-800 to-slate-950 shadow-[0_10px_40px_rgba(239,68,68,0.35)] overflow-hidden">
            <img
              src={ykLogo}
              alt="YK Digital Scoring Pencak Silat Official Logo"
              referrerPolicy="no-referrer"
              className="w-full h-full object-contain rounded-[22px] bg-black/80 filter drop-shadow-[0_0_20px_rgba(239,68,68,0.5)] transition-transform duration-500 group-hover:scale-105"
            />
          </div>
        </motion.div>

        {/* HERO TITLE & TYPOGRAPHY */}
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="mt-4 space-y-2 max-w-3xl"
        >
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-slate-900/90 border border-slate-700/80 text-xs font-mono uppercase tracking-widest text-slate-300">
            <Sparkles className="w-3.5 h-3.5 text-amber-400" />
            <span>SISTEM SKORING RESMI STANDAR PERSILAT & IPSI</span>
          </div>

          <h1 className="text-3xl sm:text-5xl md:text-6xl font-black tracking-tight text-white uppercase leading-none">
            SELAMAT DATANG DI <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-red-500 via-red-400 to-red-600 drop-shadow-[0_0_25px_rgba(239,68,68,0.4)]">
              YK DIGITAL SCORING
            </span>
          </h1>

          <p className="text-xs sm:text-sm md:text-base text-slate-300 font-medium max-w-2xl mx-auto leading-relaxed">
            Aplikasi Skoring Digital Pencak Silat Berbasis Sinkronisasi Real-Time Nirkabel, Multi-Gelanggang, Multi-Device (Laptop, Tablet Juri, dan Layar Monitor LED).
          </p>
        </motion.div>

        {/* QUICK ACCESS MODE PORTALS (TANDING, SENI, MONITOR URUTAN, ADMIN PANEL) */}
        <div className="w-full mt-8 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 text-left">
          
          {/* CARD 1: KATEGORI TANDING */}
          <motion.div
            whileHover={{ y: -6, scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => {
              playBeep('click');
              onSelectMode('tanding');
            }}
            className="group relative flex flex-col justify-between p-5 rounded-2xl bg-gradient-to-b from-slate-900/90 to-slate-950/90 border border-red-500/30 hover:border-red-500/70 shadow-lg hover:shadow-red-500/20 backdrop-blur-sm cursor-pointer transition-all duration-300 overflow-hidden"
          >
            <div className="absolute top-0 right-0 w-24 h-24 bg-red-600/10 rounded-full blur-2xl group-hover:bg-red-600/20 transition-all" />
            
            <div>
              <div className="w-12 h-12 rounded-xl bg-red-950/80 border border-red-500/40 flex items-center justify-center text-red-400 mb-3 shadow-inner group-hover:scale-110 transition-transform">
                <Shield className="w-6 h-6" />
              </div>
              <span className="text-[10px] font-mono tracking-widest uppercase font-bold text-red-400">KATEGORI TANDING</span>
              <h2 className="text-lg font-black text-white mt-1 group-hover:text-red-300 transition-colors uppercase">
                PERTANDINGAN TANDING
              </h2>
              <p className="text-xs text-slate-400 mt-2 leading-relaxed">
                Panel Dewan, Juri Sudut 1-3, Sekretaris Pertandingan, dan Layar Monitor Penonton dengan timer audio buzzer.
              </p>
            </div>

            <div className="mt-4 pt-3 border-t border-slate-800/80 flex items-center justify-between text-xs font-bold text-red-400 group-hover:text-red-300">
              <span>MASUK KE TANDING</span>
              <ArrowRight className="w-4 h-4 transform group-hover:translate-x-1 transition-transform" />
            </div>
          </motion.div>

          {/* CARD 2: KATEGORI SENI (TGR) */}
          <motion.div
            whileHover={{ y: -6, scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => {
              playBeep('click');
              onSelectMode('seni');
            }}
            className="group relative flex flex-col justify-between p-5 rounded-2xl bg-gradient-to-b from-slate-900/90 to-slate-950/90 border border-blue-500/30 hover:border-blue-500/70 shadow-lg hover:shadow-blue-500/20 backdrop-blur-sm cursor-pointer transition-all duration-300 overflow-hidden"
          >
            <div className="absolute top-0 right-0 w-24 h-24 bg-blue-600/10 rounded-full blur-2xl group-hover:bg-blue-600/20 transition-all" />
            
            <div>
              <div className="w-12 h-12 rounded-xl bg-blue-950/80 border border-blue-500/40 flex items-center justify-center text-blue-400 mb-3 shadow-inner group-hover:scale-110 transition-transform">
                <Award className="w-6 h-6" />
              </div>
              <span className="text-[10px] font-mono tracking-widest uppercase font-bold text-blue-400">KATEGORI SENI</span>
              <h2 className="text-lg font-black text-white mt-1 group-hover:text-blue-300 transition-colors uppercase">
                TGR / SENI SILAT
              </h2>
              <p className="text-xs text-slate-400 mt-2 leading-relaxed">
                Tunggal, Ganda, Regu, dan Solo Kreatif. Skor kebenaran gerak, kemantapan, penalti waktu, dan ranking per pool.
              </p>
            </div>

            <div className="mt-4 pt-3 border-t border-slate-800/80 flex items-center justify-between text-xs font-bold text-blue-400 group-hover:text-blue-300">
              <span>MASUK KE SENI</span>
              <ArrowRight className="w-4 h-4 transform group-hover:translate-x-1 transition-transform" />
            </div>
          </motion.div>

          {/* CARD 3: MONITOR URUTAN PARTAI */}
          <motion.div
            whileHover={{ y: -6, scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => {
              playBeep('click');
              onSelectMode('monitor_urutan');
            }}
            className="group relative flex flex-col justify-between p-5 rounded-2xl bg-gradient-to-b from-slate-900/90 to-slate-950/90 border border-cyan-500/30 hover:border-cyan-500/70 shadow-lg hover:shadow-cyan-500/20 backdrop-blur-sm cursor-pointer transition-all duration-300 overflow-hidden"
          >
            <div className="absolute top-0 right-0 w-24 h-24 bg-cyan-600/10 rounded-full blur-2xl group-hover:bg-cyan-600/20 transition-all" />
            
            <div>
              <div className="w-12 h-12 rounded-xl bg-cyan-950/80 border border-cyan-500/40 flex items-center justify-center text-cyan-400 mb-3 shadow-inner group-hover:scale-110 transition-transform">
                <Tv className="w-6 h-6" />
              </div>
              <span className="text-[10px] font-mono tracking-widest uppercase font-bold text-cyan-400">LAYAR GOR</span>
              <h2 className="text-lg font-black text-white mt-1 group-hover:text-cyan-300 transition-colors uppercase">
                MONITOR URUTAN PARTAI
              </h2>
              <p className="text-xs text-slate-400 mt-2 leading-relaxed">
                Tampilan jadwal real-time untuk TV proyektor penonton, memantau partai berjalan dan antrean berikutnya.
              </p>
            </div>

            <div className="mt-4 pt-3 border-t border-slate-800/80 flex items-center justify-between text-xs font-bold text-cyan-400 group-hover:text-cyan-300">
              <span>TAMPILKAN LAYAR GOR</span>
              <ArrowRight className="w-4 h-4 transform group-hover:translate-x-1 transition-transform" />
            </div>
          </motion.div>

          {/* CARD 4: ADMIN PANEL & DATA MASTER */}
          <motion.div
            whileHover={{ y: -6, scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => {
              playBeep('click');
              onSelectMode('admin');
            }}
            className="group relative flex flex-col justify-between p-5 rounded-2xl bg-gradient-to-b from-slate-900/90 to-slate-950/90 border border-amber-500/30 hover:border-amber-500/70 shadow-lg hover:shadow-amber-500/20 backdrop-blur-sm cursor-pointer transition-all duration-300 overflow-hidden"
          >
            <div className="absolute top-0 right-0 w-24 h-24 bg-amber-600/10 rounded-full blur-2xl group-hover:bg-amber-600/20 transition-all" />
            
            <div>
              <div className="w-12 h-12 rounded-xl bg-amber-950/80 border border-amber-500/40 flex items-center justify-center text-amber-400 mb-3 shadow-inner group-hover:scale-110 transition-transform">
                <Settings className="w-6 h-6" />
              </div>
              <span className="text-[10px] font-mono tracking-widest uppercase font-bold text-amber-400">ADMINISTRASI</span>
              <h2 className="text-lg font-black text-white mt-1 group-hover:text-amber-300 transition-colors uppercase">
                ADMIN PANEL & BAGAN
              </h2>
              <p className="text-xs text-slate-400 mt-2 leading-relaxed">
                Generator Bagan & Gelanggang Otomatis, kelola data atlet, undian bagan pisah kontingen, dan penugasan juri.
              </p>
            </div>

            <div className="mt-4 pt-3 border-t border-slate-800/80 flex items-center justify-between text-xs font-bold text-amber-400 group-hover:text-amber-300">
              <span>BUKA ADMIN PANEL</span>
              <ArrowRight className="w-4 h-4 transform group-hover:translate-x-1 transition-transform" />
            </div>
          </motion.div>

        </div>

        {/* 3. SYSTEM KEY HIGHLIGHTS / KEUNGGULAN SISTEM */}
        <div className="w-full mt-8 p-5 sm:p-6 rounded-2xl bg-slate-900/60 border border-slate-800/80 backdrop-blur-md">
          <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-800/80 pb-4 mb-4 text-left">
            <div>
              <h3 className="text-base font-extrabold text-white flex items-center gap-2 uppercase tracking-wide">
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                FITUR & KEUNGGULAN SISTEM YK DIGITAL SCORING
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">
                Dirancang khusus untuk kelancaran turnamen dari tingkat daerah hingga kejuaraan nasional.
              </p>
            </div>

            <div className="flex items-center gap-2">
              {onOpenGelanggangTab && (
                <button
                  onClick={() => {
                    playBeep('click');
                    onOpenGelanggangTab();
                  }}
                  className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs font-bold text-slate-300 border border-slate-700 transition cursor-pointer"
                >
                  Manajemen Gelanggang
                </button>
              )}
              {onOpenRekapitulasiTab && (
                <button
                  onClick={() => {
                    playBeep('click');
                    onOpenRekapitulasiTab();
                  }}
                  className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs font-bold text-slate-300 border border-slate-700 transition cursor-pointer"
                >
                  Rekapitulasi Nilai
                </button>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 text-left">
            <div className="p-3.5 rounded-xl bg-slate-950/60 border border-slate-800">
              <span className="text-xs font-bold text-red-400 flex items-center gap-1.5">
                ⚡ Sinkronisasi Nirkabel
              </span>
              <p className="text-[11px] text-slate-400 mt-1 leading-relaxed">
                Respon penilaian 0 ms antar juri dan dewan melalui Local Server LAN Wi-Fi tanpa kuota internet luar.
              </p>
            </div>

            <div className="p-3.5 rounded-xl bg-slate-950/60 border border-slate-800">
              <span className="text-xs font-bold text-blue-400 flex items-center gap-1.5">
                🥋 Standar Baku IPSI
              </span>
              <p className="text-[11px] text-slate-400 mt-1 leading-relaxed">
                Logika validasi pukulan, tendangan, jatuhan sah, binaan, teguran, peringatan, dan verifikasi juri otomatis.
              </p>
            </div>

            <div className="p-3.5 rounded-xl bg-slate-950/60 border border-slate-800">
              <span className="text-xs font-bold text-emerald-400 flex items-center gap-1.5">
                📊 Generator Bagan Cerdas
              </span>
              <p className="text-[11px] text-slate-400 mt-1 leading-relaxed">
                Distribusi multi-gelanggang otomatis dengan jaminan konsistensi arena semi-final & final serta pisah kontingen.
              </p>
            </div>

            <div className="p-3.5 rounded-xl bg-slate-950/60 border border-slate-800">
              <span className="text-xs font-bold text-amber-400 flex items-center gap-1.5">
                🖨️ Format PDF & Excel Siap Cetak
              </span>
              <p className="text-[11px] text-slate-400 mt-1 leading-relaxed">
                Cetak jadwal partai, lembar penilaian, bagan kompetisi, dan hasil rekapitulasi juara secara instan.
              </p>
            </div>
          </div>
        </div>

      </main>

      {/* 4. PROFESSIONAL BRAND FOOTER */}
      <footer className="w-full max-w-7xl z-10 px-4 py-4 mt-4 border-t border-slate-900 flex flex-wrap items-center justify-between gap-3 text-xs text-slate-500 font-mono">
        <div className="flex items-center gap-2">
          <img
            src={ykLogo}
            alt="YK Small Logo"
            className="w-5 h-5 object-contain rounded-full border border-red-500/40"
          />
          <span className="font-bold text-slate-400">YK DIGITAL SCORING</span>
          <span>•</span>
          <span>VERSI 3.5 RESMI IPSI</span>
        </div>

        <div className="flex flex-wrap items-center gap-4">
          <span>
            SERVER GOOGLE:{' '}
            {googleUser
              ? googleSyncStatus === 'synced'
                ? 'TERHUBUNG'
                : googleSyncStatus === 'connecting'
                ? 'MENYAMBUNG'
                : googleSyncStatus === 'error'
                ? 'ERROR'
                : 'NONAKTIF'
              : 'BELUM MASUK'}
          </span>
          <span>
            GOOGLE DRIVE: {driveConnected ? 'TERHUBUNG' : 'BELUM TERHUBUNG'}
          </span>
          <span>•</span>
          <span>SERVER LOCAL: {connected ? 'TERHUBUNG (PORT 3000)' : 'STANDALONE OFFLINE'}</span>
          <span>•</span>
          <span>ARENA AKTIF: {currentArenaObj?.nama?.toUpperCase()}</span>
        </div>
      </footer>

      {/* Server connection setup modal for Google Cloud, Google Drive & juri tablets */}
      <ServerConnectionModal
        isOpen={showServerModal}
        onClose={() => setShowServerModal(false)}
        connected={connected}
        onReconnect={onReconnect}
        googleUser={googleUser}
        googleSyncEnabled={googleSyncEnabled}
        onToggleGoogleSync={onToggleGoogleSync}
        googleSyncStatus={googleSyncStatus}
        googleError={googleError}
        cloudTournamentId={cloudTournamentId}
        onSignInGoogle={onSignInGoogle}
        onSignOutGoogle={onSignOutGoogle}
        onPushAllToGoogleCloud={onPushAllToGoogleCloud}
        firebaseProjectInfo={firebaseProjectInfo}
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

    </div>
  );
}
