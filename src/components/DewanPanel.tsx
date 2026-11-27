/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Trophy, Shield, Award, HelpCircle, CheckCircle, CheckCircle2, AlertTriangle, 
  Sun, Moon, RotateCcw, Flag, Lock, Unlock, Maximize2, Minimize2, 
  Undo2, Play, Pause, RefreshCw, Zap, X, ChevronLeft, Activity
} from 'lucide-react';
import { MatchState, MatchHistory } from '../types';
import { playBeep } from '../utils/sound';
import { generateAllMatchesReportPdf } from '../utils/generateMatchReportPdf';
import ThemePaletteSelector from './ThemePaletteSelector';
import AnimatedScore from './AnimatedScore';
import { useThemePalette } from '../services/themeService';
import DewanPanelTechnical from './DewanPanelTechnical';
import {
  Binaan1Icon,
  Binaan2Icon,
  Teguran1Icon,
  Teguran2Icon,
  Peringatan1Icon,
  Peringatan2Icon,
  DisqualifikasiIcon
} from './PenaltyIcons';

interface DewanPanelProps {
  state: MatchState;
  dispatch: (action: string, payload?: any) => void;
  onBack: () => void;
  theme: 'dark' | 'light';
  onToggleTheme: () => void;
  histories?: MatchHistory[];
  tgrState?: any;
}

const getPenaltyInfo = (type: string) => {
  switch (type) {
    case 'binaan1':
      return {
        title: 'Binaan 1 👉',
        desc: 'Peringatan lisan tingkat 1 (Tidak mengurangi nilai poin). Sinyal wasit: Satu jari ke samping (👉).',
        colorClass: 'text-yellow-500 border-yellow-500',
        badgeColor: 'bg-yellow-500/10 text-yellow-600 border-yellow-500/35',
      };
    case 'binaan2':
      return {
        title: 'Binaan 2 👉👉',
        desc: 'Peringatan lisan tingkat 2 (Tidak mengurangi nilai poin). Sinyal wasit: Dua jari ke samping (👉👉).',
        colorClass: 'text-yellow-500 border-yellow-500',
        badgeColor: 'bg-yellow-500/10 text-yellow-600 border-yellow-500/35',
      };
    case 'teguran1':
      return {
        title: 'Teguran 1 ☝️',
        desc: 'Pelanggaran Ringan pertama. Mengurangi 1 poin dari total nilai. Sinyal wasit: Satu jari ke atas (☝️).',
        colorClass: 'text-amber-500 border-amber-500',
        badgeColor: 'bg-amber-500/10 text-amber-600 border-amber-500/35',
      };
    case 'teguran2':
      return {
        title: 'Teguran 2 ✌️',
        desc: 'Pelanggaran Ringan kedua. Mengurangi 2 poin dari total nilai. Sinyal wasit: Dua jari ke atas bentuk V (✌️).',
        colorClass: 'text-amber-500 border-amber-500',
        badgeColor: 'bg-amber-500/10 text-amber-600 border-amber-500/35',
      };
    case 'peringatan1':
      return {
        title: 'Peringatan 1',
        desc: 'Pelanggaran Berat pertama. Mengurangi 5 poin dari total nilai.',
        colorClass: 'text-red-500 border-red-500',
        badgeColor: 'bg-red-500/10 text-red-600 border-red-500/35',
      };
    case 'peringatan2':
      return {
        title: 'Peringatan 2',
        desc: 'Pelanggaran Berat kedua. Mengurangi 10 poin dari total nilai.',
        colorClass: 'text-red-500 border-red-500',
        badgeColor: 'bg-red-500/10 text-red-600 border-red-500/35',
      };
    case 'disqualified':
      return {
        title: 'Diskualifikasi',
        desc: 'Diskualifikasi atlet. Atlet langsung dinyatakan kalah, dan sudut lawan otomatis keluar sebagai pemenang.',
        colorClass: 'text-red-600 border-red-600 font-bold',
        badgeColor: 'bg-red-600/20 text-red-600 border-red-500/50',
      };
    default:
      return {
        title: 'Pelanggaran',
        desc: 'Perubahan status hukuman.',
        colorClass: 'text-slate-400 border-slate-500',
        badgeColor: 'bg-slate-500/10 text-slate-400 border-slate-500/30',
      };
  }
};

function DewanPanelStandard({ state, dispatch, onBack, theme, onToggleTheme, histories = [], tgrState }: DewanPanelProps) {
  const [isFullscreen, setIsFullscreen] = useState(false);

  React.useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
  }, []);

  const toggleFullscreen = () => {
    playBeep('click');
    const elem = document.documentElement;
    if (!document.fullscreenElement) {
      elem.requestFullscreen().catch(err => console.warn(err));
    } else {
      document.exitFullscreen().catch(err => console.warn(err));
    }
  };

  const [showVerifyModal, setShowVerifyModal] = useState(false);
  const [penaltyConfirm, setPenaltyConfirm] = useState<{
    sudut: 'merah' | 'biru';
    type: 'binaan1' | 'binaan2' | 'teguran1' | 'teguran2' | 'peringatan1' | 'peringatan2' | 'disqualified';
  } | null>(null);
  const [kTeknikConfirm, setKTeknikConfirm] = useState<'merah' | 'biru' | null>(null);
  const [undoConfirm, setUndoConfirm] = useState<'merah' | 'biru' | null>(null);
  const [undurDiriConfirm, setUndurDiriConfirm] = useState<'merah' | 'biru' | null>(null);
  const [wmpConfirm, setWmpConfirm] = useState<'merah' | 'biru' | null>(null);
  const [showQuickUndoModal, setShowQuickUndoModal] = useState(false);
  const [showQuickKTeknikModal, setShowQuickKTeknikModal] = useState(false);

  const { changePalette } = useThemePalette();

  const [systemLogs, setSystemLogs] = useState<string[]>([
    `[${new Date().toLocaleTimeString('id-ID')}] System Dewan Tanding Siaga.`,
    `[${new Date().toLocaleTimeString('id-ID')}] Verifikasi 3 Juri Terhubung.`,
  ]);

  const addLog = (msg: string) => {
    const timestamp = new Date().toLocaleTimeString('id-ID');
    setSystemLogs(prev => [`[${timestamp}] ${msg}`, ...prev.slice(0, 6)]);
  };

  const formatTimer = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  // Shortcut Tombol SPASI untuk Mulai / Jeda Timer Tanding
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.code === 'Space' || e.key === ' ' || e.keyCode === 32) {
        const target = e.target as HTMLElement;
        const tagName = target?.tagName?.toLowerCase();
        if (tagName === 'input' || tagName === 'textarea' || target?.isContentEditable) {
          return;
        }
        e.preventDefault();
        playBeep('click');
        dispatch('TOGGLE_TIMER');
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [dispatch]);

  const handlePenaltyClick = (
    sudut: 'merah' | 'biru',
    type: 'binaan1' | 'binaan2' | 'teguran1' | 'teguran2' | 'peringatan1' | 'peringatan2' | 'disqualified'
  ) => {
    playBeep('warning');
    setPenaltyConfirm({ sudut, type });
  };

  const handleApplyPenalty = () => {
    if (!penaltyConfirm) return;
    const { sudut, type } = penaltyConfirm;
    playBeep('warning');
    dispatch('DEWAN_PENALTY', { sudut, penaltyType: type });
    setPenaltyConfirm(null);
  };

  const handleKTeknikClick = (sudut: 'merah' | 'biru') => {
    playBeep('warning');
    setKTeknikConfirm(sudut);
  };

  const handleApplyKTeknik = () => {
    if (!kTeknikConfirm) return;
    playBeep('warning');
    dispatch('DEWAN_K_TEKNIK', { winnerCorner: kTeknikConfirm });
    setKTeknikConfirm(null);
  };

  const handleUndoClick = (sudut: 'merah' | 'biru') => {
    playBeep('warning');
    setUndoConfirm(sudut);
  };

  const handleApplyUndo = () => {
    if (!undoConfirm) return;
    playBeep('warning');
    dispatch('DEWAN_UNDO', { sudut: undoConfirm });
    setUndoConfirm(null);
  };

  const handleUndurDiriClick = (sudut: 'merah' | 'biru') => {
    playBeep('warning');
    setUndurDiriConfirm(sudut);
  };

  const handleApplyUndurDiri = () => {
    if (!undurDiriConfirm) return;
    playBeep('warning');
    dispatch('DEWAN_UNDUR_DIRI', { sudut: undurDiriConfirm });
    setUndurDiriConfirm(null);
  };

  const handleWmpClick = (sudut: 'merah' | 'biru') => {
    playBeep('warning');
    setWmpConfirm(sudut);
  };

  const handleApplyWmp = () => {
    if (!wmpConfirm) return;
    playBeep('warning');
    dispatch('DEWAN_WMP', { winnerCorner: wmpConfirm });
    setWmpConfirm(null);
  };

  const handleJatuhan = (sudut: 'merah' | 'biru') => {
    playBeep('valid');
    dispatch('DEWAN_JATUHAN', { sudut });
  };

  const handleVerifyTrigger = (verifyType: 'JATUHAN' | 'PELANGGARAN') => {
    playBeep('click');
    dispatch('DEWAN_VERIFY_TRIGGER', { type: verifyType });
    setShowVerifyModal(false);
  };

  const handleResolveVerify = () => {
    playBeep('click');
    dispatch('DEWAN_VERIFY_RESOLVE');
  };

  const redPen = state.dewanPenalties.merah;
  const bluePen = state.dewanPenalties.biru;
  const v = state.verification;

  return (
    <div className={`w-full h-full flex flex-col justify-between p-2 md:p-3 transition-colors duration-300 select-none overflow-y-auto md:overflow-hidden relative font-sans ${
      theme === 'dark' 
        ? 'bg-gradient-to-b from-[#070d18] via-[#0c1322] to-[#060a12] text-slate-100' 
        : 'bg-gradient-to-b from-[#f8fafc] via-[#f1f5f9] to-[#e2e8f0] text-slate-900'
    }`}>
      
      {/* Ambient stadium lighting accents */}
      {theme === 'dark' && (
        <>
          <div className="absolute top-0 left-0 w-96 h-96 bg-red-600/10 rounded-full blur-3xl pointer-events-none -translate-x-1/2 -translate-y-1/2" />
          <div className="absolute top-0 right-0 w-96 h-96 bg-blue-600/10 rounded-full blur-3xl pointer-events-none translate-x-1/2 -translate-y-1/2" />
          <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-80 h-32 bg-amber-500/5 rounded-full blur-2xl pointer-events-none" />
        </>
      )}

      {/* 1. TOP UTILITY BAR (Glassmorphic Command Header) */}
      <div className={`flex items-center justify-between px-3 py-2 rounded-2xl border mb-2 flex-shrink-0 backdrop-blur-md shadow-lg z-10 ${
        theme === 'dark' 
          ? 'bg-slate-900/85 border-slate-700/70 shadow-black/40' 
          : 'bg-white/90 border-slate-250 shadow-slate-200/50'
      }`}>
        <div className="flex items-center gap-2 flex-wrap">
          <button 
            onClick={onBack}
            className="flex items-center gap-1 px-3 py-1.5 text-[11px] cursor-pointer rounded-xl font-black uppercase tracking-wider transition-all bg-slate-800 hover:bg-slate-700 active:scale-95 text-white shadow-sm border border-slate-700/60"
            title="Kembali ke Menu Utama"
          >
            <ChevronLeft className="w-3.5 h-3.5" />
            <span>Keluar</span>
          </button>

          {/* Arena / Gelanggang Pill */}
          <div className={`hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded-xl text-[10px] font-mono font-bold uppercase tracking-wider border ${
            theme === 'dark' ? 'bg-slate-800/80 border-slate-700 text-cyan-400' : 'bg-slate-100 border-slate-250 text-slate-700'
          }`}>
            <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse" />
            <span>GELANGGANG {state.gelanggang || '1'}</span>
          </div>

          {/* Kategori / Kelas Pill */}
          {(state.gender || state.kelas) && (
            <div className={`hidden md:flex items-center gap-1 px-2.5 py-1 rounded-xl text-[10px] font-mono font-semibold uppercase tracking-wider border ${
              theme === 'dark' ? 'bg-slate-800/60 border-slate-700/80 text-slate-300' : 'bg-slate-100 border-slate-250 text-slate-700'
            }`}>
              <span>{state.gender || 'PUTRA'}</span>
              <span className="opacity-40">•</span>
              <span>{state.kelas || 'KELAS A'}</span>
            </div>
          )}

          <div className="h-4 w-[1px] bg-slate-700/50 hidden sm:block" />

          {/* Theme Toggle */}
          <button
            onClick={onToggleTheme}
            className={`p-1.5 rounded-xl transition-all cursor-pointer border ${
              theme === 'dark' 
                ? 'bg-slate-800/80 hover:bg-slate-700 border-slate-700 text-amber-400' 
                : 'bg-slate-100 hover:bg-slate-200 border-slate-250 text-slate-700'
            }`}
            title={theme === 'dark' ? 'Mode Terang' : 'Mode Gelap'}
          >
            {theme === 'dark' ? <Sun className="w-3.5 h-3.5" /> : <Moon className="w-3.5 h-3.5" />}
          </button>

          {/* Theme Palette Selector */}
          <ThemePaletteSelector compact={true} />

          {/* Fullscreen Toggle */}
          <button
            onClick={toggleFullscreen}
            className={`p-1.5 rounded-xl transition-all cursor-pointer border ${
              theme === 'dark' 
                ? 'bg-slate-800/80 hover:bg-slate-700 border-slate-700 text-slate-300' 
                : 'bg-slate-100 hover:bg-slate-200 border-slate-250 text-slate-700'
            }`}
            title="Layar Penuh (Fullscreen)"
          >
            {isFullscreen ? <Minimize2 className="w-3.5 h-3.5" /> : <Maximize2 className="w-3.5 h-3.5" />}
          </button>

          {/* Akses Juri Switch Button */}
          <button
            onClick={() => {
              playBeep('click');
              dispatch('TOGGLE_JURY_PENALTY_ACCESS');
            }}
            className={`flex items-center gap-1.5 px-3 py-1 rounded-xl text-[10px] font-black uppercase tracking-wider transition-all cursor-pointer border shadow-sm ${
              state.juryPenaltyAccess
                ? 'bg-emerald-500/15 border-emerald-500/50 text-emerald-400 shadow-emerald-500/10'
                : theme === 'dark'
                  ? 'bg-slate-800/80 border-slate-700 text-slate-400 hover:text-slate-300'
                  : 'bg-slate-100 border-slate-250 text-slate-600 hover:text-slate-800'
            }`}
            title="Atur hak akses juri untuk memberikan hukuman"
          >
            <span className={`w-2 h-2 rounded-full ${state.juryPenaltyAccess ? 'bg-emerald-400 shadow-[0_0_8px_#34d399] animate-pulse' : 'bg-slate-500'}`} />
            {state.juryPenaltyAccess ? <Unlock className="w-3 h-3 text-emerald-400" /> : <Lock className="w-3 h-3 text-slate-400" />}
            <span>Akses Juri: {state.juryPenaltyAccess ? 'AKTIF' : 'NONAKTIF'}</span>
          </button>
        </div>

        {/* Council Badge & Laporan PDF */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => {
              playBeep('click');
              generateAllMatchesReportPdf({
                state,
                histories,
                baganData: state.baganData,
                tgrState,
                gelanggang: state.gelanggang,
                tournamentTitle: state.namaEvent
              });
            }}
            title="Cetak Buku Laporan Resmi Seluruh Pertandingan Lengkap (PDF)"
            className="px-2.5 py-1 text-[10px] font-bold uppercase rounded-xl bg-emerald-950/50 hover:bg-emerald-900/60 border border-emerald-500/40 text-emerald-300 flex items-center gap-1.5 cursor-pointer shadow transition-all active:scale-95"
          >
            <Award className="w-3.5 h-3.5 text-emerald-400" />
            <span className="hidden sm:inline">Laporan Pertandingan (PDF)</span>
          </button>

          <div className="flex items-center gap-2 px-3 py-1 rounded-xl border border-amber-500/30 bg-amber-500/10 text-amber-400 font-mono shadow-sm">
            <Shield className="w-4 h-4 text-amber-400 drop-shadow-[0_0_6px_rgba(245,158,11,0.5)]" />
            <span className="text-xs font-black uppercase tracking-wider">DEWAN PERTANDINGAN</span>
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping ml-1" />
          </div>
        </div>
      </div>

      {/* 2. HEADER BANNER (Sudut Merah | Center Core | Sudut Biru) */}
      <div className="grid grid-cols-1 sm:grid-cols-12 gap-2 md:gap-3 items-stretch flex-shrink-0 z-10">
        
        {/* Sudut Merah Banner (5 Cols on tablet/laptop, 12 on mobile) */}
        <div className="sm:col-span-5 bg-gradient-to-r from-red-950/90 via-red-900/80 to-slate-900/90 text-white p-2.5 sm:p-3 rounded-2xl shadow-lg shadow-red-950/40 border border-red-500/40 flex flex-col justify-between min-h-[64px] sm:min-h-[72px] relative overflow-hidden backdrop-blur-md">
          <div className="absolute top-0 left-0 w-2 h-full bg-gradient-to-b from-red-500 to-rose-600" />
          <div className="flex justify-between items-center pl-2">
            <span className="text-[10px] font-black uppercase tracking-widest text-red-300 flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-red-500 shadow-[0_0_8px_#ef4444] animate-pulse" />
              SUDUT MERAH
            </span>
            <div className="bg-black/50 px-2.5 sm:px-3 py-0.5 rounded-xl border border-red-500/40 inline-flex items-center gap-1.5 shadow-inner">
              <span className="text-[9px] font-mono text-slate-300 uppercase font-bold">TOTAL:</span>
              <span className="text-base sm:text-lg font-mono font-black text-amber-300 tracking-tight">
                <AnimatedScore value={state.scores.merah.total} showDeltaBadge={true} badgeClassName="top-[-10px] right-[-10px]" />
              </span>
            </div>
          </div>
          <div className="pl-2 mt-1">
            <h2 className="text-xs sm:text-sm md:text-base font-black truncate uppercase tracking-tight text-white drop-shadow-sm">
              {state.atletMerah.nama || "ATLET MERAH"}
            </h2>
            <div className="text-[9px] sm:text-[10px] md:text-[11px] font-bold text-red-200/90 truncate uppercase tracking-wider mt-0.5">
              {state.atletMerah.kontingen || "KONTINGEN MERAH"}
            </div>
          </div>
        </div>

        {/* Center Core: PARTAI & ROUNDS (2 Cols on tablet/laptop, 12 on mobile) */}
        <div className="sm:col-span-2 flex sm:flex-col items-center justify-between sm:justify-center gap-1.5 bg-slate-900/40 p-2 sm:p-0 rounded-xl sm:bg-transparent border sm:border-0 border-slate-800">
          {/* Partai Emblem Badge */}
          <div className="bg-gradient-to-b from-slate-900 to-slate-950 border-2 border-amber-400/80 text-white px-3 py-1 sm:py-1.5 rounded-2xl shadow-xl text-center flex flex-col items-center justify-center w-auto sm:w-full max-w-[120px] relative">
            <span className="text-[8px] font-black tracking-widest text-amber-400 uppercase leading-none drop-shadow">
              PARTAI
            </span>
            <span className="text-sm sm:text-base md:text-lg font-mono font-black text-white leading-none mt-0.5 sm:mt-1 tracking-tight drop-shadow-[0_0_8px_rgba(255,255,255,0.4)]">
              {state.partai || "001"}
            </span>
          </div>

          {/* Round Selector Indicators */}
          <div className="flex items-center gap-1 sm:gap-1.5 w-auto sm:w-full max-w-[120px] justify-center">
            {[1, 2, 3].map((r) => {
              const isActive = state.currentBabak === r;
              return (
                <button
                  key={r}
                  onClick={() => {
                    playBeep('click');
                    dispatch('SET_BABAK', { babak: r });
                  }}
                  className={`px-2.5 sm:px-0 sm:flex-1 py-1 rounded-xl text-[10px] font-mono font-black uppercase transition-all cursor-pointer border text-center ${
                    isActive
                      ? 'bg-emerald-500 border-emerald-400 text-slate-950 font-black shadow-[0_0_12px_rgba(16,185,129,0.5)] scale-105'
                      : 'bg-slate-900/90 border-slate-700/80 text-slate-400 hover:text-white hover:bg-slate-800'
                  }`}
                  title={`Ganti ke Babak ${r}`}
                >
                  {r === 1 ? 'I' : r === 2 ? 'II' : 'III'}
                </button>
              );
            })}
          </div>
        </div>

        {/* Sudut Biru Banner (5 Cols on tablet/laptop, 12 on mobile) */}
        <div className="sm:col-span-5 bg-gradient-to-r from-slate-900/90 via-blue-900/80 to-blue-950/90 text-white p-2.5 sm:p-3 rounded-2xl shadow-lg shadow-blue-950/40 border border-blue-500/40 flex flex-col justify-between min-h-[64px] sm:min-h-[72px] text-right relative overflow-hidden backdrop-blur-md">
          <div className="absolute top-0 right-0 w-2 h-full bg-gradient-to-b from-blue-500 to-cyan-500" />
          <div className="flex justify-between items-center pr-2">
            <div className="bg-black/50 px-2.5 sm:px-3 py-0.5 rounded-xl border border-blue-500/40 inline-flex items-center gap-1.5 shadow-inner">
              <span className="text-[9px] font-mono text-slate-300 uppercase font-bold">TOTAL:</span>
              <span className="text-base sm:text-lg font-mono font-black text-amber-300 tracking-tight">
                <AnimatedScore value={state.scores.biru.total} showDeltaBadge={true} badgeClassName="top-[-10px] left-[-10px]" />
              </span>
            </div>
            <span className="text-[10px] font-black uppercase tracking-widest text-blue-300 flex items-center gap-1.5">
              SUDUT BIRU
              <span className="w-2 h-2 rounded-full bg-blue-500 shadow-[0_0_8px_#3b82f6] animate-pulse" />
            </span>
          </div>
          <div className="pr-2 mt-1">
            <h2 className="text-xs sm:text-sm md:text-base font-black truncate uppercase tracking-tight text-white drop-shadow-sm">
              {state.atletBiru.nama || "ATLET BIRU"}
            </h2>
            <div className="text-[9px] sm:text-[10px] md:text-[11px] font-bold text-blue-200/90 truncate uppercase tracking-wider mt-0.5">
              {state.atletBiru.kontingen || "KONTINGEN BIRU"}
            </div>
          </div>
        </div>

      </div>

      {/* 3. MAIN 3-COLUMN INTERACTIVE CONTROL DECK */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-2 md:gap-3 my-2 flex-1 min-h-0 items-stretch z-10 overflow-y-auto lg:overflow-visible custom-scrollbar">
        
        {/* LEFT COLUMN: SUDUT MERAH CONTROLS */}
        <div className="lg:col-span-5 flex flex-col gap-2 justify-between">
          
          {/* Status Indicator Bar Rows (Red Corner Telemetry) */}
          <div className="grid grid-cols-4 gap-1.5 flex-shrink-0">
            {/* BINAAN */}
            <div className={`p-1.5 rounded-xl border text-[9px] font-mono flex flex-col items-center justify-center transition-all ${
              redPen.binaan1 || redPen.binaan2
                ? 'bg-amber-400/20 border-amber-400 text-amber-300 font-black shadow-[0_0_10px_rgba(251,191,36,0.3)]'
                : theme === 'dark' ? 'bg-slate-900/70 border-slate-800 text-slate-400' : 'bg-white border-slate-200 text-slate-600'
            }`}>
              <span className="text-[8px] font-bold opacity-75 uppercase">Binaan</span>
              <span className="text-xs font-black mt-0.5">{redPen.binaan2 ? 'B2' : redPen.binaan1 ? 'B1' : '-'}</span>
            </div>

            {/* TEGURAN */}
            <div className={`p-1.5 rounded-xl border text-[9px] font-mono flex flex-col items-center justify-center transition-all ${
              redPen.teguran1 || redPen.teguran2
                ? 'bg-amber-500/25 border-amber-400 text-amber-300 font-black shadow-[0_0_10px_rgba(245,158,11,0.3)] animate-pulse'
                : theme === 'dark' ? 'bg-slate-900/70 border-slate-800 text-slate-400' : 'bg-white border-slate-200 text-slate-600'
            }`}>
              <span className="text-[8px] font-bold opacity-75 uppercase">Teguran</span>
              <span className="text-xs font-black mt-0.5">{redPen.teguran2 ? 'T2 (-2)' : redPen.teguran1 ? 'T1 (-1)' : '-'}</span>
            </div>

            {/* PERINGATAN */}
            <div className={`p-1.5 rounded-xl border text-[9px] font-mono flex flex-col items-center justify-center transition-all ${
              redPen.peringatan1 || redPen.peringatan2
                ? 'bg-red-500/25 border-red-400 text-red-300 font-black shadow-[0_0_10px_rgba(239,68,68,0.3)] animate-pulse'
                : theme === 'dark' ? 'bg-slate-900/70 border-slate-800 text-slate-400' : 'bg-white border-slate-200 text-slate-600'
            }`}>
              <span className="text-[8px] font-bold opacity-75 uppercase">Peringatan</span>
              <span className="text-xs font-black mt-0.5">{redPen.peringatan2 ? 'P2 (-10)' : redPen.peringatan1 ? 'P1 (-5)' : '-'}</span>
            </div>

            {/* JATUHAN */}
            <div className={`p-1.5 rounded-xl border text-[9px] font-mono flex flex-col items-center justify-center transition-all ${
              state.directPoints.merah > 0
                ? 'bg-emerald-500/25 border-emerald-400 text-emerald-300 font-black shadow-[0_0_10px_rgba(16,185,129,0.3)]'
                : theme === 'dark' ? 'bg-slate-900/70 border-slate-800 text-slate-400' : 'bg-white border-slate-200 text-slate-600'
            }`}>
              <span className="text-[8px] font-bold opacity-75 uppercase">Jatuhan</span>
              <span className="text-xs font-black mt-0.5">+{state.directPoints.merah} PT</span>
            </div>
          </div>

          {/* Action Buttons Grid (2 cols x 5 rows) */}
          <div className="grid grid-cols-2 gap-1.5 md:gap-2 flex-1 min-h-0">
            {/* Row 1: BINAAN 1 | BINAAN 2 */}
            <button
              onClick={() => handlePenaltyClick('merah', 'binaan1')}
              className={`rounded-2xl border-2 font-black uppercase text-xs md:text-sm flex items-center justify-center gap-2 transition-all shadow-sm cursor-pointer p-2 active:scale-95 ${
                redPen.binaan1
                  ? 'bg-gradient-to-r from-amber-400 to-yellow-400 border-amber-300 text-slate-950 shadow-md shadow-amber-400/30'
                  : theme === 'dark'
                    ? 'bg-slate-900/90 border-red-900/50 text-red-300 hover:border-red-500/60 hover:bg-red-950/40'
                    : 'bg-white border-red-200 text-red-700 hover:bg-red-50'
              }`}
            >
              <Binaan1Icon active={!!redPen.binaan1} side="merah" className="w-5 h-5 flex-shrink-0" />
              <span>BINAAN 1 👉</span>
            </button>

            <button
              onClick={() => handlePenaltyClick('merah', 'binaan2')}
              className={`rounded-2xl border-2 font-black uppercase text-xs md:text-sm flex items-center justify-center gap-2 transition-all shadow-sm cursor-pointer p-2 active:scale-95 ${
                redPen.binaan2
                  ? 'bg-gradient-to-r from-amber-400 to-yellow-400 border-amber-300 text-slate-950 shadow-md shadow-amber-400/30'
                  : theme === 'dark'
                    ? 'bg-slate-900/90 border-red-900/50 text-red-300 hover:border-red-500/60 hover:bg-red-950/40'
                    : 'bg-white border-red-200 text-red-700 hover:bg-red-50'
              }`}
            >
              <Binaan2Icon active={!!redPen.binaan2} side="merah" className="w-5 h-5 flex-shrink-0" />
              <span>BINAAN 2 👉👉</span>
            </button>

            {/* Row 2: TEGURAN 1 | TEGURAN 2 */}
            <button
              onClick={() => handlePenaltyClick('merah', 'teguran1')}
              className={`rounded-2xl border-2 font-black uppercase text-xs md:text-sm flex items-center justify-center gap-2 transition-all shadow-sm cursor-pointer p-2 active:scale-95 ${
                redPen.teguran1
                  ? 'bg-gradient-to-r from-amber-500 to-orange-500 border-amber-300 text-slate-950 shadow-md shadow-amber-500/30 animate-pulse'
                  : theme === 'dark'
                    ? 'bg-slate-900/90 border-red-900/50 text-red-300 hover:border-red-500/60 hover:bg-red-950/40'
                    : 'bg-white border-red-200 text-red-700 hover:bg-red-50'
              }`}
            >
              <Teguran1Icon active={!!redPen.teguran1} side="merah" className="w-5 h-5 flex-shrink-0" />
              <span>TEGURAN 1 ☝️ (-1)</span>
            </button>

            <button
              onClick={() => handlePenaltyClick('merah', 'teguran2')}
              className={`rounded-2xl border-2 font-black uppercase text-xs md:text-sm flex items-center justify-center gap-2 transition-all shadow-sm cursor-pointer p-2 active:scale-95 ${
                redPen.teguran2
                  ? 'bg-gradient-to-r from-amber-500 to-orange-500 border-amber-300 text-slate-950 shadow-md shadow-amber-500/30 animate-pulse'
                  : theme === 'dark'
                    ? 'bg-slate-900/90 border-red-900/50 text-red-300 hover:border-red-500/60 hover:bg-red-950/40'
                    : 'bg-white border-red-200 text-red-700 hover:bg-red-50'
              }`}
            >
              <Teguran2Icon active={!!redPen.teguran2} side="merah" className="w-5 h-5 flex-shrink-0" />
              <span>TEGURAN 2 ✌️ (-2)</span>
            </button>

            {/* Row 3: PERINGATAN 1 | PERINGATAN 2 */}
            <button
              onClick={() => handlePenaltyClick('merah', 'peringatan1')}
              className={`rounded-2xl border-2 font-black uppercase text-xs md:text-sm flex items-center justify-center gap-2 transition-all shadow-sm cursor-pointer p-2 active:scale-95 ${
                redPen.peringatan1
                  ? 'bg-gradient-to-r from-red-600 to-rose-600 border-red-400 text-white shadow-md shadow-red-600/40'
                  : theme === 'dark'
                    ? 'bg-slate-900/90 border-red-900/50 text-red-400 hover:border-red-500/60 hover:bg-red-950/40'
                    : 'bg-white border-red-200 text-red-700 hover:bg-red-50'
              }`}
            >
              <Peringatan1Icon active={!!redPen.peringatan1} side="merah" className="w-5 h-5 flex-shrink-0" />
              <span>PERINGATAN 1 (-5)</span>
            </button>

            <button
              onClick={() => handlePenaltyClick('merah', 'peringatan2')}
              className={`rounded-2xl border-2 font-black uppercase text-xs md:text-sm flex items-center justify-center gap-2 transition-all shadow-sm cursor-pointer p-2 active:scale-95 ${
                redPen.peringatan2
                  ? 'bg-gradient-to-r from-red-700 to-rose-800 border-red-400 text-white shadow-md shadow-red-700/40'
                  : theme === 'dark'
                    ? 'bg-slate-900/90 border-red-900/50 text-red-400 hover:border-red-500/60 hover:bg-red-950/40'
                    : 'bg-white border-red-200 text-red-700 hover:bg-red-50'
              }`}
            >
              <Peringatan2Icon active={!!redPen.peringatan2} side="merah" className="w-5 h-5 flex-shrink-0" />
              <span>PERINGATAN 2 (-10)</span>
            </button>

            {/* Row 4: JATUHAN (+3) | UNDO (DEL) */}
            <button
              onClick={() => handleJatuhan('merah')}
              className="rounded-2xl border-2 border-emerald-400/60 bg-gradient-to-r from-emerald-600 via-teal-600 to-emerald-500 hover:from-emerald-500 hover:to-teal-400 text-white font-black uppercase text-xs md:text-sm flex items-center justify-center gap-2 transition-all shadow-lg shadow-emerald-950/40 active:scale-95 cursor-pointer p-2"
            >
              <Award className="w-5 h-5 text-emerald-200 flex-shrink-0" />
              <span>JATUHAN (+3)</span>
            </button>

            <button
              onClick={() => handleUndoClick('merah')}
              className="rounded-2xl border-2 border-amber-400/60 bg-gradient-to-r from-amber-500 to-yellow-500 hover:from-amber-400 hover:to-yellow-400 text-slate-950 font-black uppercase text-xs md:text-sm flex items-center justify-center gap-2 transition-all shadow-md active:scale-95 cursor-pointer p-2"
            >
              <Undo2 className="w-5 h-5 text-slate-950 flex-shrink-0" />
              <span>UNDO (DEL)</span>
            </button>

            {/* Row 5: DISKUALIFIKASI | K. TEKNIK */}
            <button
              onClick={() => handlePenaltyClick('merah', 'disqualified')}
              className={`rounded-2xl border-2 font-black uppercase text-xs md:text-sm flex items-center justify-center gap-2 transition-all shadow-sm cursor-pointer p-2 active:scale-95 ${
                redPen.disqualified
                  ? 'bg-gradient-to-r from-red-800 to-rose-900 border-red-400 text-white shadow-lg shadow-red-900/50'
                  : 'bg-red-950/40 border-red-900/60 hover:bg-red-900/40 text-red-400 hover:border-red-700'
              }`}
            >
              <DisqualifikasiIcon active={!!redPen.disqualified} className="w-5 h-5 flex-shrink-0" />
              <span>DISKUALIFIKASI</span>
            </button>

            <button
              onClick={() => handleKTeknikClick('merah')}
              className="rounded-2xl border-2 border-blue-400/60 bg-gradient-to-r from-blue-700 via-indigo-700 to-blue-600 hover:from-blue-600 hover:to-indigo-500 text-white font-black uppercase text-xs md:text-sm flex items-center justify-center gap-2 transition-all shadow-lg shadow-blue-950/40 active:scale-95 cursor-pointer p-2"
            >
              <Zap className="w-5 h-5 text-amber-300 flex-shrink-0" />
              <span>K. TEKNIK</span>
            </button>
          </div>
        </div>

        {/* CENTER COLUMN: TIMER & VOTE VERIFICATION (2 Cols on desktop, full width on mobile) */}
        <div className="lg:col-span-2 flex flex-col items-center justify-between order-first lg:order-none px-1 py-1 bg-slate-900/30 lg:bg-transparent rounded-2xl border lg:border-0 border-slate-800 my-1 lg:my-0">
          
          {/* VS Matchup Shield */}
          <div className="flex items-center justify-center gap-2 my-1">
            <div className="w-9 h-9 sm:w-10 sm:h-10 md:w-11 md:h-11 bg-gradient-to-br from-red-500 to-rose-700 rounded-xl flex items-center justify-center text-white font-black text-sm sm:text-base shadow-lg shadow-red-950/40 border border-red-300/40">
              M
            </div>
            <div className="flex flex-col items-center">
              <span className="text-amber-400 font-black tracking-widest text-xs italic drop-shadow">VS</span>
            </div>
            <div className="w-9 h-9 sm:w-10 sm:h-10 md:w-11 md:h-11 bg-gradient-to-br from-blue-500 to-cyan-700 rounded-xl flex items-center justify-center text-white font-black text-sm sm:text-base shadow-lg shadow-blue-950/40 border border-blue-300/40">
              B
            </div>
          </div>

          {/* Stadium Digital Clock Console */}
          <div className="flex flex-col items-center justify-center w-full my-auto">
            <div 
              onClick={() => {
                playBeep('click');
                dispatch('TOGGLE_TIMER');
              }}
              title="Klik atau tekan Spasi (Space) untuk Mulai / Jeda Timer"
              className={`w-full py-2.5 sm:py-3 px-2 rounded-2xl border-2 text-center shadow-xl backdrop-blur-md relative overflow-hidden cursor-pointer transition-all hover:scale-[1.01] active:scale-[0.99] group ${
                theme === 'dark' 
                  ? 'bg-slate-950/90 border-slate-700/80 hover:border-emerald-500/60 shadow-black/60' 
                  : 'bg-slate-900 border-slate-700 hover:border-emerald-400 shadow-slate-300/60'
              }`}
            >
              <div className="flex items-center justify-center gap-1.5 mb-1">
                <span className={`w-1.5 h-1.5 rounded-full ${state.timerActive ? 'bg-emerald-400 animate-pulse' : 'bg-amber-400'}`} />
                <span className="text-[8px] font-mono font-bold tracking-widest text-slate-400 uppercase">
                  {state.timerActive ? 'WAKTU BERJALAN' : 'WAKTU JEDA'}
                </span>
                <span className="text-[8px] font-mono font-bold px-1.5 py-0.2 rounded bg-slate-800 text-slate-300 border border-slate-700">
                  SPASI
                </span>
              </div>
              <div className="text-2xl sm:text-3xl lg:text-4xl font-mono font-black tracking-widest leading-none drop-shadow-[0_0_12px_rgba(52,211,153,0.5)] text-emerald-400">
                {formatTimer(state.timerSeconds)}
              </div>
            </div>

            {/* Timer Tactical Controls */}
            <div className="flex items-center gap-1.5 mt-2 w-full">
              <button
                onClick={() => {
                  playBeep('click');
                  dispatch('TOGGLE_TIMER');
                }}
                title="Tekan Spasi (Space) pada keyboard untuk Mulai / Jeda Timer"
                className={`flex-1 py-2 px-2 rounded-xl font-black text-[11px] uppercase tracking-wider flex items-center justify-center gap-1.5 transition-all cursor-pointer shadow-md active:scale-95 border ${
                  state.timerActive
                    ? 'bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-slate-950 border-amber-300 shadow-amber-500/20'
                    : 'bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white border-emerald-400 shadow-emerald-500/20'
                }`}
              >
                {state.timerActive ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
                <span>{state.timerActive ? 'JEDA' : 'MULAI'}</span>
                <span className="text-[9px] font-mono font-bold px-1 py-0.5 rounded bg-black/30 text-white/90 border border-white/20">
                  SPASI
                </span>
              </button>

              <button
                onClick={() => {
                  playBeep('click');
                  dispatch('RESET_TIMER');
                }}
                className="p-2 bg-slate-800 hover:bg-slate-700 active:scale-95 text-slate-300 rounded-xl cursor-pointer border border-slate-700 shadow-sm"
                title="Reset Waktu Babak"
              >
                <RefreshCw className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {/* VOTE VERIFICATION Command Button */}
          <div className="w-full mt-2">
            <button
              onClick={() => {
                playBeep('click');
                setShowVerifyModal(true);
              }}
              disabled={v.active}
              className={`w-full py-2.5 sm:py-3 px-2 font-black text-xs md:text-sm uppercase tracking-wider text-slate-950 rounded-2xl flex items-center justify-center gap-2 transition-all shadow-xl border-2 cursor-pointer ${
                v.active
                  ? 'bg-slate-800 text-slate-500 border-slate-700 cursor-not-allowed opacity-60'
                  : 'bg-gradient-to-r from-amber-400 via-yellow-400 to-amber-500 hover:from-amber-300 hover:to-yellow-300 border-amber-200 active:scale-95 shadow-amber-500/20'
              }`}
            >
              <HelpCircle className="w-4 h-4 text-slate-950 flex-shrink-0" />
              <span>VOTE VERIFIKASI</span>
            </button>
          </div>

        </div>

        {/* RIGHT COLUMN: SUDUT BIRU CONTROLS (5 Cols on desktop, 12 on mobile) */}
        <div className="lg:col-span-5 flex flex-col gap-2 justify-between">
          
          {/* Status Indicator Bar Rows (Blue Corner Telemetry) */}
          <div className="grid grid-cols-4 gap-1.5 flex-shrink-0">
            {/* BINAAN */}
            <div className={`p-1.5 rounded-xl border text-[9px] font-mono flex flex-col items-center justify-center transition-all ${
              bluePen.binaan1 || bluePen.binaan2
                ? 'bg-amber-400/20 border-amber-400 text-amber-300 font-black shadow-[0_0_10px_rgba(251,191,36,0.3)]'
                : theme === 'dark' ? 'bg-slate-900/70 border-slate-800 text-slate-400' : 'bg-white border-slate-200 text-slate-600'
            }`}>
              <span className="text-[8px] font-bold opacity-75 uppercase">Binaan</span>
              <span className="text-xs font-black mt-0.5">{bluePen.binaan2 ? 'B2' : bluePen.binaan1 ? 'B1' : '-'}</span>
            </div>

            {/* TEGURAN */}
            <div className={`p-1.5 rounded-xl border text-[9px] font-mono flex flex-col items-center justify-center transition-all ${
              bluePen.teguran1 || bluePen.teguran2
                ? 'bg-amber-500/25 border-amber-400 text-amber-300 font-black shadow-[0_0_10px_rgba(245,158,11,0.3)] animate-pulse'
                : theme === 'dark' ? 'bg-slate-900/70 border-slate-800 text-slate-400' : 'bg-white border-slate-200 text-slate-600'
            }`}>
              <span className="text-[8px] font-bold opacity-75 uppercase">Teguran</span>
              <span className="text-xs font-black mt-0.5">{bluePen.teguran2 ? 'T2 (-2)' : bluePen.teguran1 ? 'T1 (-1)' : '-'}</span>
            </div>

            {/* PERINGATAN */}
            <div className={`p-1.5 rounded-xl border text-[9px] font-mono flex flex-col items-center justify-center transition-all ${
              bluePen.peringatan1 || bluePen.peringatan2
                ? 'bg-red-500/25 border-red-400 text-red-300 font-black shadow-[0_0_10px_rgba(239,68,68,0.3)] animate-pulse'
                : theme === 'dark' ? 'bg-slate-900/70 border-slate-800 text-slate-400' : 'bg-white border-slate-200 text-slate-600'
            }`}>
              <span className="text-[8px] font-bold opacity-75 uppercase">Peringatan</span>
              <span className="text-xs font-black mt-0.5">{bluePen.peringatan2 ? 'P2 (-10)' : bluePen.peringatan1 ? 'P1 (-5)' : '-'}</span>
            </div>

            {/* JATUHAN */}
            <div className={`p-1.5 rounded-xl border text-[9px] font-mono flex flex-col items-center justify-center transition-all ${
              state.directPoints.biru > 0
                ? 'bg-emerald-500/25 border-emerald-400 text-emerald-300 font-black shadow-[0_0_10px_rgba(16,185,129,0.3)]'
                : theme === 'dark' ? 'bg-slate-900/70 border-slate-800 text-slate-400' : 'bg-white border-slate-200 text-slate-600'
            }`}>
              <span className="text-[8px] font-bold opacity-75 uppercase">Jatuhan</span>
              <span className="text-xs font-black mt-0.5">+{state.directPoints.biru} PT</span>
            </div>
          </div>

          {/* Action Buttons Grid (2 cols x 5 rows) */}
          <div className="grid grid-cols-2 gap-1.5 md:gap-2 flex-1 min-h-0">
            {/* Row 1: BINAAN 1 | BINAAN 2 */}
            <button
              onClick={() => handlePenaltyClick('biru', 'binaan1')}
              className={`rounded-2xl border-2 font-black uppercase text-xs md:text-sm flex items-center justify-center gap-2 transition-all shadow-sm cursor-pointer p-2 active:scale-95 ${
                bluePen.binaan1
                  ? 'bg-gradient-to-r from-amber-400 to-yellow-400 border-amber-300 text-slate-950 shadow-md shadow-amber-400/30'
                  : theme === 'dark'
                    ? 'bg-slate-900/90 border-blue-900/50 text-blue-300 hover:border-blue-500/60 hover:bg-blue-950/40'
                    : 'bg-white border-blue-200 text-blue-700 hover:bg-blue-50'
              }`}
            >
              <Binaan1Icon active={!!bluePen.binaan1} side="biru" className="w-5 h-5 flex-shrink-0" />
              <span>BINAAN 1 👉</span>
            </button>

            <button
              onClick={() => handlePenaltyClick('biru', 'binaan2')}
              className={`rounded-2xl border-2 font-black uppercase text-xs md:text-sm flex items-center justify-center gap-2 transition-all shadow-sm cursor-pointer p-2 active:scale-95 ${
                bluePen.binaan2
                  ? 'bg-gradient-to-r from-amber-400 to-yellow-400 border-amber-300 text-slate-950 shadow-md shadow-amber-400/30'
                  : theme === 'dark'
                    ? 'bg-slate-900/90 border-blue-900/50 text-blue-300 hover:border-blue-500/60 hover:bg-blue-950/40'
                    : 'bg-white border-blue-200 text-blue-700 hover:bg-blue-50'
              }`}
            >
              <Binaan2Icon active={!!bluePen.binaan2} side="biru" className="w-5 h-5 flex-shrink-0" />
              <span>BINAAN 2 👉👉</span>
            </button>

            {/* Row 2: TEGURAN 1 | TEGURAN 2 */}
            <button
              onClick={() => handlePenaltyClick('biru', 'teguran1')}
              className={`rounded-2xl border-2 font-black uppercase text-xs md:text-sm flex items-center justify-center gap-2 transition-all shadow-sm cursor-pointer p-2 active:scale-95 ${
                bluePen.teguran1
                  ? 'bg-gradient-to-r from-amber-500 to-orange-500 border-amber-300 text-slate-950 shadow-md shadow-amber-500/30 animate-pulse'
                  : theme === 'dark'
                    ? 'bg-slate-900/90 border-blue-900/50 text-blue-300 hover:border-blue-500/60 hover:bg-blue-950/40'
                    : 'bg-white border-blue-200 text-blue-700 hover:bg-blue-50'
              }`}
            >
              <Teguran1Icon active={!!bluePen.teguran1} side="biru" className="w-5 h-5 flex-shrink-0" />
              <span>TEGURAN 1 ☝️ (-1)</span>
            </button>

            <button
              onClick={() => handlePenaltyClick('biru', 'teguran2')}
              className={`rounded-2xl border-2 font-black uppercase text-xs md:text-sm flex items-center justify-center gap-2 transition-all shadow-sm cursor-pointer p-2 active:scale-95 ${
                bluePen.teguran2
                  ? 'bg-gradient-to-r from-amber-500 to-orange-500 border-amber-300 text-slate-950 shadow-md shadow-amber-500/30 animate-pulse'
                  : theme === 'dark'
                    ? 'bg-slate-900/90 border-blue-900/50 text-blue-300 hover:border-blue-500/60 hover:bg-blue-950/40'
                    : 'bg-white border-blue-200 text-blue-700 hover:bg-blue-50'
              }`}
            >
              <Teguran2Icon active={!!bluePen.teguran2} side="biru" className="w-5 h-5 flex-shrink-0" />
              <span>TEGURAN 2 ✌️ (-2)</span>
            </button>

            {/* Row 3: PERINGATAN 1 | PERINGATAN 2 */}
            <button
              onClick={() => handlePenaltyClick('biru', 'peringatan1')}
              className={`rounded-2xl border-2 font-black uppercase text-xs md:text-sm flex items-center justify-center gap-2 transition-all shadow-sm cursor-pointer p-2 active:scale-95 ${
                bluePen.peringatan1
                  ? 'bg-gradient-to-r from-red-600 to-rose-600 border-red-400 text-white shadow-md shadow-red-600/40'
                  : theme === 'dark'
                    ? 'bg-slate-900/90 border-blue-900/50 text-blue-400 hover:border-blue-500/60 hover:bg-blue-950/40'
                    : 'bg-white border-blue-200 text-blue-700 hover:bg-blue-50'
              }`}
            >
              <Peringatan1Icon active={!!bluePen.peringatan1} side="biru" className="w-5 h-5 flex-shrink-0" />
              <span>PERINGATAN 1 (-5)</span>
            </button>

            <button
              onClick={() => handlePenaltyClick('biru', 'peringatan2')}
              className={`rounded-2xl border-2 font-black uppercase text-xs md:text-sm flex items-center justify-center gap-2 transition-all shadow-sm cursor-pointer p-2 active:scale-95 ${
                bluePen.peringatan2
                  ? 'bg-gradient-to-r from-red-700 to-rose-800 border-red-400 text-white shadow-md shadow-red-700/40'
                  : theme === 'dark'
                    ? 'bg-slate-900/90 border-blue-900/50 text-blue-400 hover:border-blue-500/60 hover:bg-blue-950/40'
                    : 'bg-white border-blue-200 text-blue-700 hover:bg-blue-50'
              }`}
            >
              <Peringatan2Icon active={!!bluePen.peringatan2} side="biru" className="w-5 h-5 flex-shrink-0" />
              <span>PERINGATAN 2 (-10)</span>
            </button>

            {/* Row 4: UNDO (DEL) | JATUHAN (+3) */}
            <button
              onClick={() => handleUndoClick('biru')}
              className="rounded-2xl border-2 border-amber-400/60 bg-gradient-to-r from-amber-500 to-yellow-500 hover:from-amber-400 hover:to-yellow-400 text-slate-950 font-black uppercase text-xs md:text-sm flex items-center justify-center gap-2 transition-all shadow-md active:scale-95 cursor-pointer p-2"
            >
              <Undo2 className="w-5 h-5 text-slate-950 flex-shrink-0" />
              <span>UNDO (DEL)</span>
            </button>

            <button
              onClick={() => handleJatuhan('biru')}
              className="rounded-2xl border-2 border-emerald-400/60 bg-gradient-to-r from-emerald-600 via-teal-600 to-emerald-500 hover:from-emerald-500 hover:to-teal-400 text-white font-black uppercase text-xs md:text-sm flex items-center justify-center gap-2 transition-all shadow-lg shadow-emerald-950/40 active:scale-95 cursor-pointer p-2"
            >
              <Award className="w-5 h-5 text-emerald-200 flex-shrink-0" />
              <span>JATUHAN (+3)</span>
            </button>

            {/* Row 5: K. TEKNIK | DISKUALIFIKASI */}
            <button
              onClick={() => handleKTeknikClick('biru')}
              className="rounded-2xl border-2 border-blue-400/60 bg-gradient-to-r from-blue-700 via-indigo-700 to-blue-600 hover:from-blue-600 hover:to-indigo-500 text-white font-black uppercase text-xs md:text-sm flex items-center justify-center gap-2 transition-all shadow-lg shadow-blue-950/40 active:scale-95 cursor-pointer p-2"
            >
              <Zap className="w-5 h-5 text-amber-300 flex-shrink-0" />
              <span>K. TEKNIK</span>
            </button>

            <button
              onClick={() => handlePenaltyClick('biru', 'disqualified')}
              className={`rounded-2xl border-2 font-black uppercase text-xs md:text-sm flex items-center justify-center gap-2 transition-all shadow-sm cursor-pointer p-2 active:scale-95 ${
                bluePen.disqualified
                  ? 'bg-gradient-to-r from-red-800 to-rose-900 border-red-400 text-white shadow-lg shadow-red-900/50'
                  : 'bg-red-950/40 border-red-900/60 hover:bg-red-900/40 text-red-400 hover:border-red-700'
              }`}
            >
              <DisqualifikasiIcon active={!!bluePen.disqualified} className="w-5 h-5 flex-shrink-0" />
              <span>DISKUALIFIKASI</span>
            </button>
          </div>
        </div>

      </div>

      {/* 4. BOTTOM TELEMETRY CONSOLE BAR */}
      <div className={`flex flex-col md:flex-row items-center justify-between gap-2 p-2.5 rounded-2xl border flex-shrink-0 backdrop-blur-md shadow-lg z-10 ${
        theme === 'dark' 
          ? 'bg-slate-900/85 border-slate-700/70 shadow-black/40' 
          : 'bg-white/90 border-slate-250 shadow-slate-200/50'
      }`}>
        {/* Verification Status & Real-Time Jury Voting Pods */}
        <div className="flex items-center gap-2 text-xs font-mono">
          {v.active ? (
            <div className="flex items-center gap-2 flex-wrap">
              <span className="w-2.5 h-2.5 rounded-full bg-amber-400 animate-ping" />
              <span className="font-black text-amber-400 uppercase tracking-wider">
                VERIFIKASI AKTIF ({v.type})
              </span>
              <div className="flex items-center gap-1.5 text-[10px] ml-2">
                {(['juri1', 'juri2', 'juri3'] as const).map((jk, idx) => {
                  const val = v.votes[jk];
                  let badgeColor = 'bg-slate-800 text-slate-400 border-slate-700';
                  if (val === 'BIRU') badgeColor = 'bg-blue-600 text-white border-cyan-400 font-bold shadow-[0_0_8px_rgba(59,130,246,0.5)]';
                  else if (val === 'MERAH') badgeColor = 'bg-red-600 text-white border-rose-400 font-bold shadow-[0_0_8px_rgba(239,68,68,0.5)]';
                  else if (val === 'TIDAK_SAH') badgeColor = 'bg-slate-800 text-amber-300 border-amber-400 font-bold';
                  return (
                    <span key={jk} className={`px-2.5 py-1 rounded-xl border ${badgeColor}`}>
                      J{idx + 1}: {val || '?'}
                    </span>
                  );
                })}
              </div>
              {v.votes.juri1 && v.votes.juri2 && v.votes.juri3 && (
                <button
                  onClick={handleResolveVerify}
                  className="ml-2 px-3 py-1 bg-gradient-to-r from-emerald-600 to-teal-500 hover:from-emerald-500 hover:to-teal-400 text-white font-black text-[10px] uppercase rounded-xl shadow-md cursor-pointer border border-emerald-300 active:scale-95"
                >
                  SELESAIKAN ({v.result})
                </button>
              )}
            </div>
          ) : (
            <div className="flex items-center gap-2 text-slate-400">
              <span className="w-2 h-2 rounded-full bg-emerald-400 shadow-[0_0_8px_#34d399] animate-pulse" />
              <span className="text-[11px] font-bold text-slate-300 tracking-wide">
                Sistem Dewan Tanding Siaga • Terhubung ke 3 Juri Penilai
              </span>
            </div>
          )}
        </div>

        {/* Extra Decision Actions (UD & WMP) */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => handleUndurDiriClick('merah')}
            className="px-3 py-1.5 bg-rose-950/50 hover:bg-rose-900/60 active:scale-95 border border-rose-800/80 text-rose-300 font-black text-[10px] uppercase rounded-xl cursor-pointer flex items-center gap-1.5 shadow-sm transition-all"
            title="Sahkan Atlet Merah Mengundurkan Diri"
          >
            <Flag className="w-3.5 h-3.5 text-rose-400" />
            <span>UD MERAH</span>
          </button>
          <button
            onClick={() => handleUndurDiriClick('biru')}
            className="px-3 py-1.5 bg-rose-950/50 hover:bg-rose-900/60 active:scale-95 border border-rose-800/80 text-rose-300 font-black text-[10px] uppercase rounded-xl cursor-pointer flex items-center gap-1.5 shadow-sm transition-all"
            title="Sahkan Atlet Biru Mengundurkan Diri"
          >
            <Flag className="w-3.5 h-3.5 text-rose-400" />
            <span>UD BIRU</span>
          </button>
          
          <div className="w-[1px] h-4 bg-slate-700/60" />
          
          <button
            onClick={() => handleWmpClick('merah')}
            className="px-3 py-1.5 bg-amber-950/50 hover:bg-amber-900/60 active:scale-95 border border-amber-800/80 text-amber-300 font-black text-[10px] uppercase rounded-xl cursor-pointer flex items-center gap-1.5 shadow-sm transition-all"
            title="Sahkan Wasit Menghentikan Pertandingan (Pemenang Merah)"
          >
            <Trophy className="w-3.5 h-3.5 text-amber-400" />
            <span>WMP MERAH</span>
          </button>
          <button
            onClick={() => handleWmpClick('biru')}
            className="px-3 py-1.5 bg-amber-950/50 hover:bg-amber-900/60 active:scale-95 border border-amber-800/80 text-amber-300 font-black text-[10px] uppercase rounded-xl cursor-pointer flex items-center gap-1.5 shadow-sm transition-all"
            title="Sahkan Wasit Menghentikan Pertandingan (Pemenang Biru)"
          >
            <Trophy className="w-3.5 h-3.5 text-amber-400" />
            <span>WMP BIRU</span>
          </button>
        </div>
      </div>

      {/* 5. MODALS AND CONFIRMATION DIALOGS (Glassmorphic) */}
      <AnimatePresence>
        {/* Vote Verification Modal */}
        {showVerifyModal && (
          <div className="fixed inset-0 bg-black/75 backdrop-blur-md z-[9999] flex items-center justify-center p-4">
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-slate-900 border-2 border-amber-400/80 max-w-sm w-full p-6 rounded-3xl shadow-2xl text-slate-100 relative"
            >
              <button
                onClick={() => { playBeep('click'); setShowVerifyModal(false); }}
                className="absolute top-4 right-4 p-1.5 text-slate-400 hover:text-white rounded-xl hover:bg-slate-800 cursor-pointer transition-all"
              >
                <X className="w-5 h-5" />
              </button>

              <div className="flex justify-center mb-2">
                <div className="p-3 bg-amber-500/10 border border-amber-500/30 rounded-2xl text-amber-400">
                  <HelpCircle className="w-8 h-8" />
                </div>
              </div>

              <h3 className="text-base font-black text-center text-white mb-1 uppercase tracking-wider">
                MULAI VERIFIKASI DEWAN
              </h3>
              <p className="text-xs text-slate-400 text-center mb-5 font-sans leading-relaxed">
                Pilih kategori verifikasi yang akan diajukan ke voting 3 Juri Penilai secara serentak.
              </p>

              <div className="flex flex-col gap-3">
                <button
                  onClick={() => handleVerifyTrigger('JATUHAN')}
                  className="w-full py-3.5 bg-gradient-to-r from-blue-600 to-cyan-500 hover:from-blue-500 hover:to-cyan-400 text-white font-black text-xs tracking-widest rounded-2xl transition-all shadow-lg shadow-blue-900/30 active:scale-95 cursor-pointer border border-blue-400/50"
                >
                  VERIFIKASI JATUHAN (3 PT)
                </button>
                <button
                  onClick={() => handleVerifyTrigger('PELANGGARAN')}
                  className="w-full py-3.5 bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-500 hover:to-rose-500 text-white font-black text-xs tracking-widest rounded-2xl transition-all shadow-lg shadow-red-900/30 active:scale-95 cursor-pointer border border-red-400/50"
                >
                  VERIFIKASI PELANGGARAN
                </button>
              </div>

              <button
                onClick={() => { playBeep('click'); setShowVerifyModal(false); }}
                className="w-full text-center text-xs font-bold text-slate-400 hover:text-slate-200 mt-4 block cursor-pointer transition-colors"
              >
                Batalkan
              </button>
            </motion.div>
          </div>
        )}

        {/* Penalty Confirmation Popup */}
        {penaltyConfirm && (() => {
          const targetAthlete = penaltyConfirm.sudut === 'merah' ? state.atletMerah : state.atletBiru;
          const isCurrentlyActive = state.dewanPenalties[penaltyConfirm.sudut][penaltyConfirm.type];
          const penaltyInfo = getPenaltyInfo(penaltyConfirm.type);
          const cornerText = penaltyConfirm.sudut === 'merah' ? 'SUDUT MERAH' : 'SUDUT BIRU';
          const cornerColorClass = penaltyConfirm.sudut === 'merah' ? 'text-red-400 border-red-500/40 bg-red-950/40' : 'text-blue-400 border-blue-500/40 bg-blue-950/40';
          const modalBorderClass = penaltyConfirm.sudut === 'merah' ? 'border-red-500/60' : 'border-blue-500/60';

          return (
            <div className="fixed inset-0 bg-black/75 backdrop-blur-md z-[9999] flex items-center justify-center p-4">
              <motion.div
                initial={{ scale: 0.95, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.95, opacity: 0 }}
                className={`bg-slate-900 border-2 max-w-sm w-full p-6 rounded-3xl shadow-2xl text-slate-100 ${modalBorderClass}`}
              >
                <div className="flex justify-between items-start mb-3">
                  <div className={`px-3 py-1 rounded-full border text-[10px] font-black tracking-wide ${cornerColorClass}`}>
                    {cornerText}
                  </div>
                  <div className={`px-3 py-1 rounded-full border text-[10px] font-bold ${penaltyInfo.badgeColor}`}>
                    {penaltyInfo.title}
                  </div>
                </div>

                <div className="text-center mb-3">
                  <AlertTriangle className={`w-10 h-10 mx-auto mb-2 animate-pulse ${penaltyInfo.colorClass}`} />
                  <h3 className="text-base font-black uppercase text-white tracking-tight">
                    Sahkan Keputusan Dewan
                  </h3>
                  <p className="text-[11px] text-slate-400 mt-0.5">
                    Konfirmasi keputusan dewan pertandingan untuk menyetor nilai hukuman.
                  </p>
                </div>

                <div className="bg-slate-800/80 border border-slate-700/80 p-3 rounded-2xl mb-3 text-left">
                  <span className="text-[9px] uppercase font-black text-slate-400 block tracking-wider">Atlet Terpilih</span>
                  <div className="text-sm font-black text-white uppercase mt-0.5">{targetAthlete.nama || 'ATLET'}</div>
                  <div className="text-[10px] text-slate-400 uppercase font-bold">{targetAthlete.kontingen || '-'}</div>
                </div>

                <div className="p-3.5 rounded-2xl border mb-4 text-left bg-slate-800/60 border-slate-700/80">
                  <div className="text-xs font-bold text-slate-200">
                    Hukuman: <span className="text-amber-400 font-black">{penaltyInfo.title}</span>
                  </div>
                  <p className="text-[11px] text-slate-400 mt-1 leading-relaxed">
                    {penaltyInfo.desc}
                  </p>
                  <div className="h-[1px] bg-slate-700/60 my-2" />
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-xs font-bold text-slate-300">Status Tindakan:</span>
                    <span className={`text-[10px] px-2 py-0.5 rounded-lg font-black uppercase tracking-wider ${
                      isCurrentlyActive ? 'bg-amber-500/20 text-amber-300 border border-amber-400/40' : 'bg-emerald-500/20 text-emerald-300 border border-emerald-400/40'
                    }`}>
                      {isCurrentlyActive ? 'MENCABUT (NON-AKTIF)' : 'MEMBERIKAN (AKTIF)'}
                    </span>
                  </div>
                </div>

                <div className="flex gap-2">
                  <button
                    onClick={handleApplyPenalty}
                    className="flex-1 py-2.5 cursor-pointer bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-black uppercase tracking-widest rounded-xl shadow-lg transition-all border border-emerald-400/60 active:scale-95"
                  >
                    Sahkan Nilai
                  </button>
                  <button
                    onClick={() => { playBeep('click'); setPenaltyConfirm(null); }}
                    className="flex-1 py-2.5 cursor-pointer bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-black uppercase tracking-widest rounded-xl transition-all active:scale-95 border border-slate-700"
                  >
                    Batal
                  </button>
                </div>
              </motion.div>
            </div>
          );
        })()}

        {/* Keputusan Teknik (K. Teknik) Confirmation Popup */}
        {kTeknikConfirm && (() => {
          const targetAthlete = kTeknikConfirm === 'merah' ? state.atletMerah : state.atletBiru;
          const cornerText = kTeknikConfirm === 'merah' ? 'SUDUT MERAH' : 'SUDUT BIRU';
          const cornerColorClass = kTeknikConfirm === 'merah' ? 'text-red-400 border-red-500/40 bg-red-950/40' : 'text-blue-400 border-blue-500/40 bg-blue-950/40';

          return (
            <div className="fixed inset-0 bg-black/75 backdrop-blur-md z-[9999] flex items-center justify-center p-4">
              <motion.div
                initial={{ scale: 0.95, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.95, opacity: 0 }}
                className="bg-slate-900 border-2 border-amber-400/80 max-w-sm w-full p-6 rounded-3xl shadow-2xl text-slate-100"
              >
                <div className="flex justify-between items-start mb-3">
                  <div className={`px-3 py-1 rounded-full border text-[10px] font-black tracking-wide ${cornerColorClass}`}>
                    {cornerText}
                  </div>
                  <div className="px-3 py-1 rounded-full border border-amber-400/40 bg-amber-500/15 text-[10px] font-black text-amber-300">
                    Keputusan Teknik (KO/TKO)
                  </div>
                </div>

                <div className="text-center mb-3">
                  <Zap className="w-10 h-10 mx-auto mb-2 text-amber-400 animate-bounce" />
                  <h3 className="text-base font-black uppercase text-white tracking-tight">
                    Sahkan Menang Keputusan Teknik?
                  </h3>
                  <p className="text-[11px] text-slate-400 mt-1 leading-normal font-sans">
                    Tindakan ini akan menghentikan pertandingan dan memenangkan <span className="font-bold text-amber-300">{cornerText}</span> secara mutlak.
                  </p>
                </div>

                <div className="bg-slate-800/80 border border-slate-700/80 p-3 rounded-2xl mb-4 text-left">
                  <span className="text-[9px] uppercase font-black text-slate-400 block tracking-wider">Atlet Pemenang (K. TEKNIK)</span>
                  <div className="text-sm font-black text-white uppercase mt-0.5">{targetAthlete.nama}</div>
                  <div className="text-[10px] text-slate-400 uppercase font-semibold">{targetAthlete.kontingen}</div>
                </div>

                <div className="flex gap-2">
                  <button
                    onClick={handleApplyKTeknik}
                    className="flex-1 py-2.5 cursor-pointer bg-gradient-to-r from-amber-400 to-yellow-400 hover:from-amber-300 hover:to-yellow-300 text-slate-950 text-xs font-black uppercase tracking-widest rounded-xl shadow-lg transition-all border border-amber-200 active:scale-95"
                  >
                    Ya, Sahkan K. Teknik
                  </button>
                  <button
                    onClick={() => { playBeep('click'); setKTeknikConfirm(null); }}
                    className="flex-1 py-2.5 cursor-pointer bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-black uppercase tracking-widest rounded-xl transition-all active:scale-95 border border-slate-700"
                  >
                    Batal
                  </button>
                </div>
              </motion.div>
            </div>
          );
        })()}

        {/* Undo Confirmation Popup */}
        {undoConfirm && (() => {
          const cornerText = undoConfirm === 'merah' ? 'SUDUT MERAH' : 'SUDUT BIRU';
          const cornerColorClass = undoConfirm === 'merah' ? 'text-red-400 border-red-500/40 bg-red-950/40' : 'text-blue-400 border-blue-500/40 bg-blue-950/40';

          return (
            <div className="fixed inset-0 bg-black/75 backdrop-blur-md z-[9999] flex items-center justify-center p-4">
              <motion.div
                initial={{ scale: 0.95, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.95, opacity: 0 }}
                className="bg-slate-900 border-2 border-amber-400/80 max-w-sm w-full p-6 rounded-3xl shadow-2xl text-slate-100"
              >
                <div className="flex justify-between items-start mb-3">
                  <div className={`px-3 py-1 rounded-full border text-[10px] font-black tracking-wide ${cornerColorClass}`}>
                    {cornerText}
                  </div>
                  <div className="px-3 py-1 rounded-full border border-amber-400/40 bg-amber-500/15 text-[10px] font-black text-amber-300">
                    Batal / Undo (DEL)
                  </div>
                </div>

                <div className="text-center mb-3">
                  <Undo2 className="w-10 h-10 mx-auto mb-2 text-amber-400" />
                  <h3 className="text-base font-black uppercase text-white tracking-tight">
                    Batalkan Tindakan Terakhir?
                  </h3>
                  <p className="text-[11px] text-slate-400 mt-1 leading-normal font-sans">
                    Tindakan ini akan membatalkan jatuhan atau hukuman terakhir yang diberikan pada <span className="font-bold text-amber-300">{cornerText}</span>.
                  </p>
                </div>

                <div className="flex gap-2 mt-4">
                  <button
                    onClick={handleApplyUndo}
                    className="flex-1 py-2.5 cursor-pointer bg-gradient-to-r from-amber-400 to-yellow-400 hover:from-amber-300 hover:to-yellow-300 text-slate-950 text-xs font-black uppercase tracking-widest rounded-xl shadow-lg transition-all border border-amber-200 active:scale-95"
                  >
                    Ya, Batalkan (Undo)
                  </button>
                  <button
                    onClick={() => { playBeep('click'); setUndoConfirm(null); }}
                    className="flex-1 py-2.5 cursor-pointer bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-black uppercase tracking-widest rounded-xl transition-all active:scale-95 border border-slate-700"
                  >
                    Batal
                  </button>
                </div>
              </motion.div>
            </div>
          );
        })()}

        {/* Undur Diri Confirmation Popup */}
        {undurDiriConfirm && (() => {
          const targetAthlete = undurDiriConfirm === 'merah' ? state.atletMerah : state.atletBiru;
          const cornerText = undurDiriConfirm === 'merah' ? 'SUDUT MERAH' : 'SUDUT BIRU';
          const cornerColorClass = undurDiriConfirm === 'merah' ? 'text-red-400 border-red-500/40 bg-red-950/40' : 'text-blue-400 border-blue-500/40 bg-blue-950/40';

          return (
            <div className="fixed inset-0 bg-black/75 backdrop-blur-md z-[9999] flex items-center justify-center p-4">
              <motion.div
                initial={{ scale: 0.95, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.95, opacity: 0 }}
                className="bg-slate-900 border-2 border-red-500/80 max-w-sm w-full p-6 rounded-3xl shadow-2xl text-slate-100"
              >
                <div className="flex justify-between items-start mb-3">
                  <div className={`px-3 py-1 rounded-full border text-[10px] font-black tracking-wide ${cornerColorClass}`}>
                    {cornerText}
                  </div>
                  <div className="px-3 py-1 rounded-full border border-rose-500/40 bg-rose-500/15 text-[10px] font-black text-rose-300">
                    Undur Diri (UD)
                  </div>
                </div>

                <div className="text-center mb-3">
                  <Flag className="w-10 h-10 mx-auto mb-2 text-rose-500" />
                  <h3 className="text-base font-black uppercase text-white tracking-tight">
                    Sahkan Atlet Undur Diri?
                  </h3>
                  <p className="text-[11px] text-slate-400 mt-1 leading-normal font-sans">
                    Tindakan ini akan menghentikan pertandingan dan memenangkan sudut lawan.
                  </p>
                </div>

                <div className="bg-slate-800/80 border border-slate-700/80 p-3 rounded-2xl mb-4 text-left">
                  <span className="text-[9px] uppercase font-black text-slate-400 block tracking-wider">Atlet Mundur</span>
                  <div className="text-sm font-black text-white uppercase mt-0.5">{targetAthlete.nama}</div>
                  <div className="text-[10px] text-slate-400 uppercase font-semibold">{targetAthlete.kontingen}</div>
                </div>

                <div className="flex gap-2">
                  <button
                    onClick={handleApplyUndurDiri}
                    className="flex-1 py-2.5 cursor-pointer bg-red-600 hover:bg-red-500 text-white text-xs font-black uppercase tracking-widest rounded-xl shadow-lg transition-all border border-red-400 active:scale-95"
                  >
                    Ya, Sahkan UD
                  </button>
                  <button
                    onClick={() => { playBeep('click'); setUndurDiriConfirm(null); }}
                    className="flex-1 py-2.5 cursor-pointer bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-black uppercase tracking-widest rounded-xl transition-all active:scale-95 border border-slate-700"
                  >
                    Batal
                  </button>
                </div>
              </motion.div>
            </div>
          );
        })()}

        {/* WMP Confirmation Popup */}
        {wmpConfirm && (() => {
          const targetAthlete = wmpConfirm === 'merah' ? state.atletMerah : state.atletBiru;
          const cornerText = wmpConfirm === 'merah' ? 'SUDUT MERAH' : 'SUDUT BIRU';
          const cornerColorClass = wmpConfirm === 'merah' ? 'text-red-400 border-red-500/40 bg-red-950/40' : 'text-blue-400 border-blue-500/40 bg-blue-950/40';

          return (
            <div className="fixed inset-0 bg-black/75 backdrop-blur-md z-[9999] flex items-center justify-center p-4">
              <motion.div
                initial={{ scale: 0.95, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.95, opacity: 0 }}
                className="bg-slate-900 border-2 border-amber-400/80 max-w-sm w-full p-6 rounded-3xl shadow-2xl text-slate-100"
              >
                <div className="flex justify-between items-start mb-3">
                  <div className={`px-3 py-1 rounded-full border text-[10px] font-black tracking-wide ${cornerColorClass}`}>
                    {cornerText}
                  </div>
                  <div className="px-3 py-1 rounded-full border border-amber-400/40 bg-amber-500/15 text-[10px] font-black text-amber-300">
                    Menang WMP (RSC)
                  </div>
                </div>

                <div className="text-center mb-3">
                  <Trophy className="w-10 h-10 mx-auto mb-2 text-amber-400 animate-bounce" />
                  <h3 className="text-base font-black uppercase text-white tracking-tight">
                    Sahkan Menang WMP?
                  </h3>
                  <p className="text-[11px] text-slate-400 mt-1 leading-normal font-sans">
                    Wasit Menghentikan Pertandingan dan menyatakan <span className="font-bold text-amber-300">{cornerText}</span> sebagai PEMENANG mutlak.
                  </p>
                </div>

                <div className="bg-slate-800/80 border border-slate-700/80 p-3 rounded-2xl mb-4 text-left">
                  <span className="text-[9px] uppercase font-black text-slate-400 block tracking-wider">Atlet Pemenang (WMP)</span>
                  <div className="text-sm font-black text-white uppercase mt-0.5">{targetAthlete.nama}</div>
                  <div className="text-[10px] text-slate-400 uppercase font-semibold">{targetAthlete.kontingen}</div>
                </div>

                <div className="flex gap-2">
                  <button
                    onClick={handleApplyWmp}
                    className="flex-1 py-2.5 cursor-pointer bg-gradient-to-r from-amber-400 to-yellow-400 hover:from-amber-300 hover:to-yellow-300 text-slate-950 text-xs font-black uppercase tracking-widest rounded-xl shadow-lg transition-all border border-amber-200 active:scale-95"
                  >
                    Ya, Sahkan WMP
                  </button>
                  <button
                    onClick={() => { playBeep('click'); setWmpConfirm(null); }}
                    className="flex-1 py-2.5 cursor-pointer bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-black uppercase tracking-widest rounded-xl transition-all active:scale-95 border border-slate-700"
                  >
                    Batal
                  </button>
                </div>
              </motion.div>
            </div>
          );
        })()}
      </AnimatePresence>

    </div>
  );
}

export default function DewanPanel(props: DewanPanelProps) {
  const { paletteId } = useThemePalette();

  if (paletteId === 'technical_system') {
    return <DewanPanelTechnical {...props} />;
  }

  return <DewanPanelStandard {...props} />;
}
