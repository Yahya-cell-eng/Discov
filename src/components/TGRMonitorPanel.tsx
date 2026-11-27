/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { TGRState, TGRPeserta } from '../types';
import { Maximize2, Minimize2, Shield, BarChart3, X, Edit3 } from 'lucide-react';
import { playBeep } from '../utils/sound';
import TGRJuriScoreDistributionChart from './TGRJuriScoreDistributionChart';

interface TGRMonitorPanelProps {
  state: TGRState;
  dispatch?: (type: string, payload?: any) => Promise<any> | void;
  onBack: () => void;
  theme: 'dark' | 'light';
}

export default function TGRMonitorPanel({ state, dispatch, onBack, theme }: TGRMonitorPanelProps) {
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showDistributionModal, setShowDistributionModal] = useState(false);

  // Formatting & State for Nomor Partai
  const activePeserta = state.pesertaList.find(p => p.id === state.activePesertaId);
  const rawTgrPartai = (activePeserta?.partai || state.partai || (state.activePartaiId ? state.partaiPoolList?.find(p => p.id === state.activePartaiId)?.partai : null) || '1').toString().trim();
  const cleanTgrPartaiNum = rawTgrPartai.replace(/^partai\s*[-–—:]*\s*/i, '').trim() || '1';
  const tgrPartaiLabel = `PARTAI ${cleanTgrPartaiNum}`;

  const [editingPartaiModal, setEditingPartaiModal] = useState(false);
  const [newPartaiInput, setNewPartaiInput] = useState(cleanTgrPartaiNum);

  useEffect(() => {
    setNewPartaiInput(cleanTgrPartaiNum);
  }, [cleanTgrPartaiNum]);

  const handleSavePartai = (e: React.FormEvent) => {
    e.preventDefault();
    if (newPartaiInput.trim()) {
      const formatted = newPartaiInput.trim();
      if (dispatch) {
        dispatch('TGR_UPDATE_EVENT_INFO', { partai: formatted });
        dispatch('TGR_SET_PARTAI', { partai: formatted });
      }
      setEditingPartaiModal(false);
    }
  };

  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
  }, []);

  const toggleFullscreen = () => {
    const elem = document.documentElement;
    if (!document.fullscreenElement) {
      elem.requestFullscreen().catch(err => console.warn(err));
    } else {
      document.exitFullscreen().catch(err => console.warn(err));
    }
  };

  // Formatting timer seconds to MM:SS
  const formatTime = (totalSecs: number) => {
    const mins = Math.floor(totalSecs / 60);
    const secs = totalSecs % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  // Shortcut Tombol SPASI untuk Mulai / Jeda Timer Seni (TGR)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.code === 'Space' || e.key === ' ' || e.keyCode === 32) {
        const target = e.target as HTMLElement;
        const tagName = target?.tagName?.toLowerCase();
        if (tagName === 'input' || tagName === 'textarea' || target?.isContentEditable) {
          return;
        }
        if (dispatch) {
          e.preventDefault();
          playBeep('click');
          if (state.timerActive) {
            dispatch('TGR_PAUSE_TIMER');
          } else {
            dispatch('TGR_START_TIMER');
          }
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [dispatch, state.timerActive]);

  const getMedian = (arr: number[]): number => {
    if (arr.length === 0) return 0;
    const sorted = [...arr].sort((a, b) => a - b);
    const mid = Math.floor(sorted.length / 2);
    if (sorted.length % 2 !== 0) {
      return sorted[mid];
    } else {
      return (sorted[mid - 1] + sorted[mid]) / 2;
    }
  };

  const getStandardDeviation = (arr: number[]): number => {
    if (arr.length <= 1) return 0;
    const mean = arr.reduce((acc, v) => acc + v, 0) / arr.length;
    const variance = arr.reduce((acc, v) => acc + Math.pow(v - mean, 2), 0) / arr.length;
    return Math.sqrt(variance);
  };

  const activeScores = activePeserta
    ? Object.entries(activePeserta.scores)
        .filter(([key]) => {
          const jNum = parseInt(key.replace('juri', ''));
          return jNum >= 1 && jNum <= state.jumlahJuri;
        })
        .map(([_, v]) => v)
    : [];

  const activeKebenaran = activePeserta
    ? Object.entries(activePeserta.kebenaranScores)
        .filter(([key]) => {
          const jNum = parseInt(key.replace('juri', ''));
          return jNum >= 1 && jNum <= state.jumlahJuri;
        })
        .map(([_, v]) => v)
    : [];

  const totalKebenaran = activeKebenaran.reduce((sum, v) => sum + v, 0);
  const medianScore = getMedian(activeScores);
  const stdDevScore = getStandardDeviation(activeScores);

  // Prestasi (VS) Match participants
  const merahPeserta = state.activeVSMatch?.merahPesertaId 
    ? state.pesertaList.find(p => p.id === state.activeVSMatch?.merahPesertaId) 
    : state.pesertaList.find(p => p.sudut === 'merah');
    
  const biruPeserta = state.activeVSMatch?.biruPesertaId 
    ? state.pesertaList.find(p => p.id === state.activeVSMatch?.biruPesertaId) 
    : state.pesertaList.find(p => p.sudut === 'biru');

  const merahScores = merahPeserta
    ? Object.entries(merahPeserta.scores)
        .filter(([key]) => {
          const jNum = parseInt(key.replace('juri', ''));
          return jNum >= 1 && jNum <= state.jumlahJuri;
        })
        .map(([_, v]) => v)
    : [];
  const merahStdDev = getStandardDeviation(merahScores);

  const biruScores = biruPeserta
    ? Object.entries(biruPeserta.scores)
        .filter(([key]) => {
          const jNum = parseInt(key.replace('juri', ''));
          return jNum >= 1 && jNum <= state.jumlahJuri;
        })
        .map(([_, v]) => v)
    : [];
  const biruStdDev = getStandardDeviation(biruScores);

  // High-fidelity vector IPSI Pentagon/Circular Logo Component matching the screenshot
  const IPSICrestLogo = () => (
    <div className="w-12 h-12 md:w-16 md:h-16 flex items-center justify-center flex-shrink-0 drop-shadow-[0_0_12px_rgba(34,197,94,0.4)]">
      <svg viewBox="0 0 100 100" className="w-full h-full select-none">
        {/* Outer Green Pentagon with gold border */}
        <polygon 
          points="50,5 93,36 77,87 23,87 7,36" 
          fill="#065f2a" 
          stroke="#f59e0b" 
          strokeWidth="3.5" 
        />
        {/* Outer white thin circle */}
        <circle cx="50" cy="50" r="28" fill="none" stroke="#ffffff" strokeWidth="1.5" />
        {/* Inner green circle base */}
        <circle cx="50" cy="50" r="24" fill="#0b7336" stroke="#ffffff" strokeWidth="1.5" />
        {/* Crossed weapons / trident symbol */}
        <path 
          d="M50,26 L50,70 M30,50 L70,50" 
          stroke="#ffffff" 
          strokeWidth="3" 
          strokeLinecap="round" 
        />
        {/* Red target circle center */}
        <circle cx="50" cy="50" r="11" fill="#dc2626" stroke="#ffffff" strokeWidth="1.5" />
        {/* Inner target dot */}
        <circle cx="50" cy="50" r="3.5" fill="#ffffff" />
      </svg>
    </div>
  );

  return (
    <div className="min-h-screen w-full flex flex-col bg-[#070114] text-slate-100 font-sans select-none overflow-hidden relative">
      
      {/* 1. TOP UTILITY ACTION BAR (Clean compact display) */}
      <div className="z-30 bg-[#04000a] border-b border-purple-950/40 px-3 md:px-4 py-1.5 flex items-center justify-between text-xs font-mono relative flex-wrap gap-2">
        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={onBack}
            className="flex items-center gap-1.5 bg-[#470b1b] hover:bg-[#5c0e22] border border-red-800 text-red-100 text-[10px] px-3 py-1 uppercase tracking-wider font-extrabold rounded cursor-pointer transition-colors"
          >
            ← KEMBALI
          </button>

          <button
            onClick={toggleFullscreen}
            className="flex items-center gap-1.5 bg-purple-950/40 border border-purple-800/60 hover:bg-purple-900/60 text-purple-300 text-[10px] px-2.5 py-1 uppercase tracking-wider font-extrabold rounded cursor-pointer transition-colors"
          >
            {isFullscreen ? <Minimize2 className="w-3.5 h-3.5" /> : <Maximize2 className="w-3.5 h-3.5" />}
            <span className="hidden sm:inline">{isFullscreen ? 'Exit' : 'Fullscreen'}</span>
          </button>

          <button
            onClick={() => setShowDistributionModal(prev => !prev)}
            className={`flex items-center gap-1.5 border text-[10px] px-2.5 py-1 uppercase tracking-wider font-extrabold rounded cursor-pointer transition-all ${
              showDistributionModal
                ? 'bg-cyan-500 border-cyan-400 text-slate-950 shadow-md shadow-cyan-500/30 font-black'
                : 'bg-cyan-950/50 border-cyan-700/60 hover:bg-cyan-900/70 text-cyan-300'
            }`}
            title="Tampilkan grafik evaluasi distribusi nilai juri (Recharts)"
          >
            <BarChart3 className="w-3.5 h-3.5 text-cyan-400" />
            <span>Grafik Evaluasi Juri</span>
          </button>

          <button
            type="button"
            onClick={() => setEditingPartaiModal(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-amber-500/20 hover:bg-amber-500/30 border border-amber-400/50 text-amber-300 text-[11px] md:text-xs font-black tracking-wider transition-colors cursor-pointer shadow-sm"
            title="Klik untuk ubah Nomor Partai"
          >
            <span className="text-amber-400/80 text-[10px]">PARTAI</span>
            <span className="text-white font-mono">{cleanTgrPartaiNum}</span>
            <Edit3 className="w-3 h-3 text-amber-300 ml-0.5" />
          </button>
        </div>

        <div className="flex items-center gap-2 text-[10px] md:text-xs text-slate-300 font-bold tracking-widest uppercase truncate">
          {(state.logoTengah || state.logoKiri) && (
            <img src={state.logoTengah || state.logoKiri || undefined} alt="Logo Kejuaraan" className="w-4 h-4 object-contain rounded" referrerPolicy="no-referrer" />
          )}
          <span className="truncate max-w-[240px] md:max-w-none">{state.namaEvent?.toUpperCase() || 'KEJUARAAN NASIONAL PENCAK SILAT 2026'}</span>
        </div>
      </div>

      {/* Symmetrical High-Res Display Container */}
      <div className="flex-1 flex flex-col justify-between z-10 overflow-hidden relative w-full h-full">

        {/* 2. TOP BANNER HEADER WITH RUNNING TITLE */}
        <header className="w-full pt-3 md:pt-4 pb-2 px-4 md:px-8 flex items-center justify-between relative z-10 border-b border-purple-950/50 bg-gradient-to-b from-purple-950/20 to-transparent">
          {/* Top Left Logo (Kejuaraan or IPSI Crest) */}
          <div className="flex items-center justify-start min-w-[70px]">
            {(state.logoKiri || state.logoTengah) ? (
              <div className="w-12 h-12 md:w-16 md:h-16 rounded-2xl bg-white/10 p-1 border-2 border-emerald-500/60 shadow-[0_0_20px_rgba(16,185,129,0.4)] flex items-center justify-center overflow-hidden flex-shrink-0 backdrop-blur-sm">
                <img src={state.logoKiri || state.logoTengah || undefined} alt="Logo Kejuaraan" className="w-full h-full object-contain" referrerPolicy="no-referrer" />
              </div>
            ) : (
              <IPSICrestLogo />
            )}
          </div>

          {/* Top Center: Golden Running Title (Header Berjalan Nama Kejuaraan) & White Subtitle */}
          <div className="flex-1 text-center px-4 min-w-0 overflow-hidden">
            <div className="w-full max-w-4xl mx-auto overflow-hidden relative py-0.5 select-none">
              {/* Left and right edge gradient masks */}
              <div className="pointer-events-none absolute left-0 top-0 bottom-0 w-8 md:w-16 bg-gradient-to-r from-[#030712] to-transparent z-10" />
              <div className="pointer-events-none absolute right-0 top-0 bottom-0 w-8 md:w-16 bg-gradient-to-l from-[#030712] to-transparent z-10" />

              <motion.div
                animate={{ x: ['0%', '-50%'] }}
                transition={{ duration: 25, repeat: Infinity, ease: 'linear' }}
                className="inline-flex items-center gap-10 whitespace-nowrap will-change-transform"
              >
                <span className="text-xl sm:text-2xl md:text-3xl lg:text-4xl font-black tracking-wider text-[#f59e0b] uppercase font-sans drop-shadow-[0_2px_10px_rgba(245,158,11,0.3)]">
                  🏆 {state.namaEvent?.toUpperCase() || 'KEJUARAAN NASIONAL PENCAK SILAT 2026'}
                </span>
                <span className="text-amber-500/60 font-bold">•</span>
                <span className="text-lg sm:text-xl md:text-2xl font-black tracking-wider text-amber-200/90 uppercase font-sans">
                  PERSATUAN PENCAK SILAT INDONESIA (IPSI)
                </span>
                <span className="text-amber-500/60 font-bold">•</span>
                <span className="text-lg sm:text-xl md:text-2xl font-black tracking-wider text-cyan-300 uppercase font-sans">
                  GELANGGANG {state.gelanggang || 'A'}
                </span>
                <span className="text-amber-500/60 font-bold">•</span>
                <span className="text-lg sm:text-xl md:text-2xl font-black tracking-wider text-amber-300 uppercase font-sans">
                  NOMOR PARTAI {cleanTgrPartaiNum}
                </span>
                <span className="text-amber-500/60 font-bold">•</span>

                {/* Seamless repetition for infinite continuous marquee */}
                <span className="text-xl sm:text-2xl md:text-3xl lg:text-4xl font-black tracking-wider text-[#f59e0b] uppercase font-sans drop-shadow-[0_2px_10px_rgba(245,158,11,0.3)]">
                  🏆 {state.namaEvent?.toUpperCase() || 'KEJUARAAN NASIONAL PENCAK SILAT 2026'}
                </span>
                <span className="text-amber-500/60 font-bold">•</span>
                <span className="text-lg sm:text-xl md:text-2xl font-black tracking-wider text-amber-200/90 uppercase font-sans">
                  PERSATUAN PENCAK SILAT INDONESIA (IPSI)
                </span>
                <span className="text-amber-500/60 font-bold">•</span>
                <span className="text-lg sm:text-xl md:text-2xl font-black tracking-wider text-cyan-300 uppercase font-sans">
                  GELANGGANG {state.gelanggang || 'A'}
                </span>
                <span className="text-amber-500/60 font-bold">•</span>
                <span className="text-lg sm:text-xl md:text-2xl font-black tracking-wider text-amber-300 uppercase font-sans">
                  NOMOR PARTAI {cleanTgrPartaiNum}
                </span>
                <span className="text-amber-500/60 font-bold">•</span>
              </motion.div>
            </div>

            <div className="flex items-center justify-center flex-wrap gap-2 md:gap-3 text-xs sm:text-sm md:text-base lg:text-lg font-extrabold tracking-widest text-white uppercase mt-0.5 md:mt-1 font-sans">
              <button
                type="button"
                onClick={() => setEditingPartaiModal(true)}
                className="inline-flex items-center gap-1.5 px-3 py-0.5 rounded-lg bg-gradient-to-r from-amber-500/25 via-yellow-500/20 to-amber-500/25 border border-amber-400/50 text-amber-300 font-black cursor-pointer hover:border-amber-300 hover:scale-[1.02] transition-all shadow-[0_0_15px_rgba(245,158,11,0.25)]"
                title="Klik untuk ubah Nomor Partai"
              >
                <span className="text-[10px] md:text-xs text-amber-400/90 font-bold uppercase tracking-wider">NOMOR PARTAI:</span>
                <span className="text-sm md:text-base text-white font-mono">{cleanTgrPartaiNum}</span>
              </button>
              <span className="text-amber-500/70">•</span>
              <span>{state.babak ? `BABAK ${state.babak}` : (state.sistemSeni === 'pool' ? (activePeserta?.pool || 'POOL A') : 'BABAK FINAL')}</span>
              <span className="text-amber-500/70">•</span>
              <span>{activePeserta ? activePeserta.kategori.toUpperCase() : 'TUNGGAL'}</span>
              {activePeserta?.noUndian && (
                <>
                  <span className="text-amber-500/70">•</span>
                  <span className="text-cyan-300 font-bold">NO. UNDIAN {activePeserta.noUndian}</span>
                </>
              )}
            </div>
          </div>

          {/* Top Right Logo (IPSI Crest or custom logo) */}
          <div className="flex items-center justify-end min-w-[70px]">
            {state.logoKanan ? (
              <div className="w-12 h-12 md:w-16 md:h-16 rounded-2xl bg-white/10 p-1 border-2 border-emerald-500/60 shadow-[0_0_20px_rgba(16,185,129,0.4)] flex items-center justify-center overflow-hidden flex-shrink-0 backdrop-blur-sm">
                <img src={state.logoKanan} alt="Logo IPSI" className="w-full h-full object-contain" referrerPolicy="no-referrer" />
              </div>
            ) : (
              <IPSICrestLogo />
            )}
          </div>
        </header>

        {/* 3. MAIN ARENA CONTENT (WATERMARK + ATHLETE BANNER ON LEFT, SCOREBOARD ON RIGHT) */}
        <main className="flex-1 flex flex-col lg:flex-row items-stretch justify-between px-3 md:px-8 py-2 md:py-4 gap-4 md:gap-8 z-10 relative overflow-hidden">
          
          {/* LEFT AREA: Watermark + Athlete & Kontingen Banner */}
          <div className="lg:w-[32%] flex flex-col justify-between relative py-2 min-h-[140px] lg:min-h-0">
            {/* Center Watermark silhouette / Logo */}
            <div className="my-auto flex items-center justify-center opacity-20 pointer-events-none select-none py-4">
              {(state.logoTengah || state.logoKiri || state.logoKanan) ? (
                <img 
                  src={state.logoTengah || state.logoKiri || state.logoKanan || undefined} 
                  alt="Watermark Logo" 
                  className="w-36 h-36 md:w-48 md:h-48 object-contain filter grayscale contrast-200"
                  referrerPolicy="no-referrer"
                />
              ) : (
                <svg viewBox="0 0 100 100" className="w-32 h-32 md:w-44 md:h-44 text-slate-400">
                  <path d="M50 10 L85 30 L85 70 L50 90 L15 70 L15 30 Z" fill="none" stroke="currentColor" strokeWidth="3" />
                  <path d="M35 50 L50 35 L65 50 L50 65 Z" fill="none" stroke="currentColor" strokeWidth="2.5" />
                  <text x="50" y="55" fontSize="11" fontWeight="bold" textAnchor="middle" fill="currentColor" fontFamily="sans-serif">PENCAK SILAT</text>
                </svg>
              )}
            </div>

            {/* Prominent Nomor Partai Badge Card */}
            <div className="w-full bg-gradient-to-r from-[#001f5c] via-[#002b80] to-[#001f5c] border-2 border-amber-400/60 rounded-lg p-2.5 shadow-[0_0_20px_rgba(245,158,11,0.2)] mb-2 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-lg bg-amber-500/20 border border-amber-400/50 flex flex-col items-center justify-center text-amber-300 font-black">
                  <span className="text-[9px] leading-none uppercase text-amber-400/90 font-bold">PARTAI</span>
                  <span className="text-sm font-mono leading-none mt-0.5">{cleanTgrPartaiNum}</span>
                </div>
                <div>
                  <div className="text-[10px] uppercase font-bold text-amber-300/90 tracking-wider">
                    NOMOR PARTAI
                  </div>
                  <div className="text-base sm:text-lg font-black text-white uppercase tracking-wider font-sans leading-tight">
                    {tgrPartaiLabel}
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2">
                {activePeserta?.noUndian && (
                  <div className="text-right border-r border-blue-400/30 pr-2">
                    <div className="text-[9px] uppercase font-bold text-slate-300 tracking-wider">
                      UNDIAN
                    </div>
                    <div className="text-base font-black text-cyan-300 font-mono leading-none">
                      #{activePeserta.noUndian}
                    </div>
                  </div>
                )}
                <button
                  type="button"
                  onClick={() => setEditingPartaiModal(true)}
                  title="Ubah Nomor Partai"
                  className="p-1.5 rounded-md bg-white/10 hover:bg-white/20 text-slate-200 hover:text-white transition-colors cursor-pointer text-xs font-bold"
                >
                  <Edit3 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            {/* Bottom-Left Athlete Banner (Exact Blue Bar from screenshot) */}
            <div className="w-full bg-[#002277] border-l-4 border-cyan-400 border-y border-r border-[#003db3] rounded-r-lg p-2.5 md:p-3.5 shadow-xl flex items-center justify-between gap-3">
              <div className="flex-1 min-w-0">
                <div className="text-sm md:text-lg font-black text-white uppercase tracking-wider font-sans leading-tight truncate">
                  {activePeserta ? (activePeserta.kontingen || 'KONTINGEN') : 'BANGKEP'}
                </div>
                <div className="text-xs md:text-sm font-bold text-cyan-300 uppercase tracking-wide font-sans mt-0.5 truncate">
                  {activePeserta ? (activePeserta.nama || 'ATLET') : 'ANDREAS'}
                </div>
              </div>
              {/* Optional Shield/Badge Icon */}
              <div className="w-8 h-8 md:w-10 md:h-10 rounded-full bg-cyan-950/60 border border-cyan-400/40 flex items-center justify-center flex-shrink-0 text-cyan-300">
                <Shield className="w-4 h-4 md:w-5 md:h-5" />
              </div>
            </div>
          </div>

          {/* RIGHT AREA: EXACT 2-ROW HIGH-CONTRAST SCOREBOARD GRID */}
          <div className="lg:w-[68%] flex flex-col justify-center my-auto w-full">
            <div className="w-full border-2 border-[#0055d4] rounded-lg overflow-hidden shadow-[0_0_30px_rgba(0,85,212,0.25)] bg-[#001035]">
              
              {/* ROW 1: MEDIAN (Col 1), PENALTY (Col 2), TIME PERFORMANCE (Col 3) */}
              <div className="grid grid-cols-12 border-b-2 border-[#0055d4]">
                {/* 1. MEDIAN */}
                <div className="col-span-4 border-r-2 border-[#0055d4] flex flex-col">
                  <div className="bg-[#00a859] py-1.5 md:py-2 text-center text-white font-black text-xs sm:text-sm md:text-base uppercase tracking-widest font-sans">
                    MEDIAN
                  </div>
                  <div className="bg-[#0038b8] flex-1 py-4 sm:py-6 md:py-8 flex items-center justify-center text-center">
                    <span className="text-3xl sm:text-5xl md:text-6xl lg:text-7xl font-black text-white font-mono tracking-wider drop-shadow-md">
                      {activeScores.length >= state.jumlahJuri ? medianScore.toFixed(3) : (medianScore > 0 ? medianScore.toFixed(3) : '9.900')}
                    </span>
                  </div>
                </div>

                {/* 2. PENALTY / HUKUMAN */}
                <div className="col-span-3 border-r-2 border-[#0055d4] flex flex-col">
                  <div className="bg-[#00a859] py-1.5 md:py-2 text-center text-white font-black text-xs sm:text-sm md:text-base uppercase tracking-widest font-sans">
                    PENALTY
                  </div>
                  <div className="bg-[#0038b8] flex-1 py-4 sm:py-6 md:py-8 flex items-center justify-center text-center">
                    <span className="text-3xl sm:text-5xl md:text-6xl lg:text-7xl font-black text-white font-mono tracking-wider drop-shadow-md">
                      {activePeserta ? (activePeserta.deductions > 0 ? activePeserta.deductions.toFixed(2) : '0.00') : '0.00'}
                    </span>
                  </div>
                </div>

                {/* 3. TIME PERFORMANCE (ARENA TIMER) */}
                <div 
                  onClick={() => {
                    if (dispatch) {
                      playBeep('click');
                      if (state.timerActive) {
                        dispatch('TGR_PAUSE_TIMER');
                      } else {
                        dispatch('TGR_START_TIMER');
                      }
                    }
                  }}
                  title="Klik atau tekan Tombol Spasi (Space) untuk Mulai / Jeda Timer Seni"
                  className="col-span-5 flex flex-col cursor-pointer group select-none"
                >
                  <div className="bg-[#00a859] py-1.5 md:py-2 text-center text-white font-black text-xs sm:text-sm md:text-base uppercase tracking-widest font-sans flex items-center justify-center gap-2">
                    <span>TIME PERFORMANCE</span>
                    <span className="text-[9px] font-mono font-bold px-1.5 py-0.2 rounded bg-black/35 text-emerald-200 border border-emerald-300/40">
                      SPASI
                    </span>
                  </div>
                  <div className="bg-[#0038b8] flex-1 py-4 sm:py-6 md:py-8 flex items-center justify-center text-center group-hover:bg-[#002f9c] transition-colors">
                    <span className={`text-3xl sm:text-5xl md:text-6xl lg:text-7xl font-black font-mono tracking-wider drop-shadow-md transition-colors ${
                      state.timerActive ? 'text-emerald-300 animate-pulse' : 'text-white'
                    }`}>
                      {formatTime(state.timerSeconds)}
                    </span>
                  </div>
                </div>
              </div>

              {/* ROW 2: STANDARD DEVIATION (Cols 1-2 Span 7), TOTAL SCORE (Col 3 Span 5) */}
              <div className="grid grid-cols-12">
                {/* 4. STANDARD DEVIATION (Spans 7 cols under Median & Penalty) */}
                <div className="col-span-7 border-r-2 border-[#0055d4] flex flex-col">
                  <div className="bg-[#00a859] py-1.5 md:py-2 text-center text-white font-black text-xs sm:text-sm md:text-base uppercase tracking-widest font-sans">
                    STANDARD DEVIATION
                  </div>
                  <div className="bg-[#0038b8] flex-1 py-4 sm:py-6 md:py-8 flex items-center justify-center text-center px-2">
                    <span className="text-2xl sm:text-4xl md:text-5xl lg:text-6xl font-black text-white font-mono tracking-wide drop-shadow-md truncate">
                      {activeScores.length >= state.jumlahJuri ? stdDevScore.toFixed(9) : (stdDevScore > 0 ? stdDevScore.toFixed(9) : '0.000000000')}
                    </span>
                  </div>
                </div>

                {/* 5. TOTAL SCORE (Gold Header with White Bold Score) */}
                <div className="col-span-5 flex flex-col">
                  <div className="bg-[#f59e0b] py-1.5 md:py-2 text-center text-slate-950 font-black text-xs sm:text-sm md:text-base uppercase tracking-widest font-sans">
                    TOTAL SCORE
                  </div>
                  <div className="bg-[#0038b8] flex-1 py-4 sm:py-6 md:py-8 flex items-center justify-center text-center">
                    <span className="text-3xl sm:text-5xl md:text-6xl lg:text-7xl font-black text-white font-mono tracking-wider drop-shadow-md">
                      {activePeserta?.finalScore !== undefined ? activePeserta.finalScore.toFixed(3) : '9.900'}
                    </span>
                  </div>
                </div>
              </div>

            </div>
          </div>

        </main>

        {/* 4. BOTTOM JURI SCORING STRIP MATCHING SCREENSHOT */}
        <footer className="w-full z-20 px-3 md:px-8 pb-3 md:pb-5">
          <div className="w-full grid border-2 border-[#0055d4] rounded-lg overflow-hidden bg-[#001035] shadow-[0_0_20px_rgba(0,85,212,0.2)]"
            style={{
              gridTemplateColumns: `repeat(${Math.max(4, Math.min(state.jumlahJuri || 4, 10))}, minmax(0, 1fr))`
            }}
          >
            {Array.from({ length: Math.max(4, Math.min(state.jumlahJuri || 4, 10)) }).map((_, idx) => {
              const juriNum = idx + 1;
              const key = `juri${juriNum}`;
              
              const hasScore = activePeserta && activePeserta.scores[key] !== undefined;
              const scoreVal = hasScore ? activePeserta.scores[key] : 9.90;
              
              // In the screenshot: Juri 2 & 3 have green headers, Juri 1 & 4 have blue headers
              // Or middle juries (calculating median) have green headers
              const totalJuries = Math.max(4, Math.min(state.jumlahJuri || 4, 10));
              const isMiddleGreen = (totalJuries === 4 && (juriNum === 2 || juriNum === 3)) ||
                                    (totalJuries === 5 && (juriNum === 2 || juriNum === 3 || juriNum === 4)) ||
                                    (totalJuries > 5 && juriNum > 1 && juriNum < totalJuries);

              const headerBg = isMiddleGreen ? 'bg-[#00a859]' : 'bg-[#0038b8]';

              return (
                <div 
                  key={juriNum} 
                  className={`flex flex-col ${idx > 0 ? 'border-l-2 border-[#0055d4]' : ''}`}
                >
                  {/* Juri Header */}
                  <div className={`${headerBg} py-1 text-center text-white font-black text-[10px] sm:text-xs md:text-sm uppercase tracking-wider font-sans`}>
                    JURI {juriNum}
                  </div>
                  {/* Juri Score Box */}
                  <div className="bg-[#002e99] py-2 sm:py-3.5 md:py-5 flex items-center justify-center text-center">
                    <span className="text-xl sm:text-3xl md:text-4xl lg:text-5xl font-black text-white font-mono tracking-wider">
                      {scoreVal.toFixed(2)}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </footer>


      </div>

      {/* 6. TRANSPARENT JURY SCORE DISTRIBUTION MODAL (RECHARTS) */}
      {showDistributionModal && activePeserta && (
        <TGRJuriScoreDistributionChart
          peserta={activePeserta}
          jumlahJuri={state.jumlahJuri}
          showModalOverlay={true}
          onClose={() => setShowDistributionModal(false)}
        />
      )}

      {/* 7. UBAH NOMOR PARTAI MODAL */}
      {editingPartaiModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl p-6 max-w-sm w-full shadow-2xl text-white">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-lg font-black text-white flex items-center gap-2">
                <span>Ubah Nomor Partai</span>
                <span className="text-[10px] px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-400/30 font-bold">SENI</span>
              </h3>
              <button
                type="button"
                onClick={() => setEditingPartaiModal(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <p className="text-xs text-slate-400 mb-4">
              Masukkan nomor partai penampilan seni untuk ditampilkan langsung pada layar monitor gelanggang.
            </p>
            
            <form onSubmit={handleSavePartai} className="space-y-4">
              <div>
                <label className="text-xs font-bold text-slate-300 block mb-1">
                  Nomor Partai
                </label>
                <input
                  type="text"
                  value={newPartaiInput}
                  onChange={(e) => setNewPartaiInput(e.target.value)}
                  placeholder="Contoh: 01, 12, atau 105"
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-700 bg-slate-950 font-mono font-bold text-lg text-white focus:outline-none focus:ring-2 focus:ring-amber-500/50 focus:border-amber-500"
                  autoFocus
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setEditingPartaiModal(false)}
                  className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold transition-colors cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-amber-500 hover:bg-amber-600 text-slate-950 font-black text-xs transition-colors shadow-sm cursor-pointer"
                >
                  Simpan Perubahan
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
