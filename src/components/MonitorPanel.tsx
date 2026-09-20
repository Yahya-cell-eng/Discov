/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useState, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Trophy, Shield, Play, AlertTriangle, HelpCircle, CheckCircle, 
  Sun, Moon, Maximize2, Minimize2, Volume2, VolumeX, Sparkles, 
  X, BellRing, Award, Tv, Smartphone, Tablet, Monitor, RotateCcw, 
  ZoomIn, ZoomOut, Check, Menu, User
} from 'lucide-react';
import { MatchState } from '../types';
import { playBeep, announceWinnerVoice } from '../utils/sound';
import ThemePaletteSelector from './ThemePaletteSelector';
import { useThemePalette } from '../services/themeService';
import AnimatedScore from './AnimatedScore';
import RunningTournamentHeader from './RunningTournamentHeader';
import {
  Binaan1Icon,
  Binaan2Icon,
  Teguran1Icon,
  Teguran2Icon,
  Peringatan1Icon,
  Peringatan2Icon,
  DisqualifikasiIcon
} from './PenaltyIcons';

interface MonitorPanelProps {
  state: MatchState;
  onBack: () => void;
  theme: 'dark' | 'light';
  onToggleTheme: () => void;
}

const FistPunchCenterIcon = () => (
  <div className="w-7 h-7 md:w-8 md:h-8 flex items-center justify-center">
    <svg viewBox="0 0 24 24" className="w-full h-full" fill="none">
      <rect x="5" y="8" width="14" height="11" rx="4" fill="#f59e0b" stroke="#000000" strokeWidth="1.2" />
      <rect x="6.5" y="5" width="2.8" height="6" rx="1.4" fill="#fbbf24" stroke="#000000" strokeWidth="1" />
      <rect x="9.8" y="4" width="2.8" height="7" rx="1.4" fill="#f59e0b" stroke="#000000" strokeWidth="1" />
      <rect x="13.1" y="4.5" width="2.8" height="6.5" rx="1.4" fill="#f59e0b" stroke="#000000" strokeWidth="1" />
      <rect x="16.2" y="6" width="2.5" height="5" rx="1.2" fill="#d97706" stroke="#000000" strokeWidth="1" />
      <path d="M5 11 C5 9 8 9 9 11 L9 15 C8 16 5 15 5 13 Z" fill="#fbbf24" stroke="#000000" strokeWidth="1" />
    </svg>
  </div>
);

const SilatKickCenterIcon = () => (
  <div className="w-7 h-7 md:w-8 md:h-8 flex items-center justify-center">
    <svg viewBox="0 0 24 24" className="w-full h-full" fill="none">
      <defs>
        <linearGradient id="legGrad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#f59e0b" />
          <stop offset="100%" stopColor="#d97706" />
        </linearGradient>
        <linearGradient id="kickPants" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#1e293b" />
          <stop offset="100%" stopColor="#0f172a" />
        </linearGradient>
      </defs>
      {/* Celana Silat Hitam di paha */}
      <path d="M4 11 L10 13 L8 18 L2 15 Z" fill="url(#kickPants)" stroke="#475569" strokeWidth="0.8" />
      {/* Sabuk Putih Silat */}
      <rect x="3" y="11" width="4" height="1.5" rx="0.5" fill="#f8fafc" stroke="#94a3b8" strokeWidth="0.5" />
      {/* Kaki menendang melayang horizontal (Warna kulit natural) */}
      <path
        d="M8 14 L18 7 C19 6.2 20.5 6.5 21 7.5 L22.5 10.5 C22.8 11.2 22.2 12 21.5 12 L19 12 L12 16.5 Z"
        fill="url(#legGrad)"
        stroke="#b45309"
        strokeWidth="1"
      />
      {/* Pelindung tulang kering / Shin Guard Merah/Biru netral atau pelindung kaki */}
      <path d="M11 13.5 L17.5 9 L19 11 L12.5 15.5 Z" fill="#ef4444" opacity="0.85" stroke="#991b1b" strokeWidth="0.6" />
      {/* Telapak kaki menendang (kicking foot/heel) */}
      <path d="M19 7 L22 9 L21.5 11.5 L18.5 10 Z" fill="#fbbf24" stroke="#b45309" strokeWidth="0.8" />
      {/* Garis aksi efek tendangan (kinetic whoosh lines) */}
      <path d="M19 5.5 C21 6 23 8 23 10.5" stroke="#f59e0b" strokeWidth="1.2" strokeLinecap="round" opacity="0.8" />
      <path d="M21 4 C23 5 24 7 24 9.5" stroke="#ef4444" strokeWidth="1" strokeLinecap="round" opacity="0.6" />
    </svg>
  </div>
);

const renderShape = (shape: 'circle' | 'square' | 'triangle' | 'star', color: string, size: number) => {
  switch (shape) {
    case 'circle':
      return <div style={{ width: size, height: size, backgroundColor: color, borderRadius: '50%' }} />;
    case 'square':
      return <div style={{ width: size, height: size, backgroundColor: color }} />;
    case 'triangle':
      return (
        <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
          <path d="M12 2L2 22H22L12 2Z" fill={color} />
        </svg>
      );
    case 'star':
      return (
        <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
          <path d="M12 17.27L18.18 21L16.54 13.97L22 9.24L14.81 8.63L12 2L9.19 8.63L2 9.24L7.46 13.97L5.82 21L12 17.27Z" fill={color} />
        </svg>
      );
  }
};

export default function MonitorPanel({ state, onBack, theme, onToggleTheme }: MonitorPanelProps) {
  const { palette } = useThemePalette();
  const [isFullscreen, setIsFullscreen] = useState(false);

  useEffect(() => {
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

  const [flashBlue, setFlashBlue] = useState(false);
  const [flashRed, setFlashRed] = useState(false);

  // Winner Toast & Audio Notification State
  const [matchToast, setMatchToast] = useState<{
    show: boolean;
    winner: 'merah' | 'biru' | null;
    winnerName: string;
    kontingen: string;
    scoreMerah: number;
    scoreBiru: number;
    partai: string;
    isSpeaking: boolean;
  } | null>(null);

  const [voiceEnabled, setVoiceEnabled] = useState(() => {
    return localStorage.getItem('monitor_voice_enabled') !== 'false';
  });

  // Controls visibility (sembunyikan tombol kontrol header pada monitor)
  const [showControls, setShowControls] = useState(() => {
    return localStorage.getItem('monitor_show_controls') === 'true';
  });

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Tombol shortcut 'c' atau 'C' untuk menampilkan/menyembunyikan kontrol jika diperlukan
      if (e.key === 'c' || e.key === 'C') {
        setShowControls(prev => {
          const next = !prev;
          localStorage.setItem('monitor_show_controls', next ? 'true' : 'false');
          return next;
        });
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const toggleVoice = () => {
    playBeep('click');
    setVoiceEnabled(prev => {
      const next = !prev;
      localStorage.setItem('monitor_voice_enabled', next ? 'true' : 'false');
      if (!next && typeof window !== 'undefined' && 'speechSynthesis' in window) {
        window.speechSynthesis.cancel();
      }
      return next;
    });
  };

  const prevStatusRef = useRef(state.matchStatus);
  const announcedMatchKeyRef = useRef<string>('');

  // Device layout preset: 'auto' | 'tv' | 'pc' | 'tablet' | 'hp'
  const [devicePreset, setDevicePreset] = useState<'auto' | 'tv' | 'pc' | 'tablet' | 'hp'>(() => {
    return (localStorage.getItem('monitor_device_preset') as any) || 'tablet';
  });

  // Window dimension tracking
  const [windowSize, setWindowSize] = useState(() => ({
    width: typeof window !== 'undefined' ? window.innerWidth : 1280,
    height: typeof window !== 'undefined' ? window.innerHeight : 720
  }));

  useEffect(() => {
    const handleResize = () => {
      setWindowSize({
        width: window.innerWidth,
        height: window.innerHeight
      });
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Determine effective device profile
  const effectiveProfile = React.useMemo(() => {
    if (devicePreset !== 'auto') return devicePreset;
    const { width, height } = windowSize;
    if (width < 640 || (width < 768 && height > width)) return 'hp';
    if (width >= 640 && width < 1024) return 'tablet';
    if (width >= 1920 || (width >= 1440 && isFullscreen)) return 'tv';
    return 'pc';
  }, [devicePreset, windowSize, isFullscreen]);

  // High-Resolution Scale multiplier state for LED and TV setups
  const [scaleFactor, setScaleFactor] = useState(() => {
    const saved = localStorage.getItem('monitor_zoom');
    return saved ? parseFloat(saved) : 0.65;
  });

  const handleDevicePresetChange = (preset: 'auto' | 'tv' | 'pc' | 'tablet' | 'hp') => {
    playBeep('click');
    setDevicePreset(preset);
    localStorage.setItem('monitor_device_preset', preset);
    if (preset === 'tv') {
      setScaleFactor(1.15);
    } else if (preset === 'tablet') {
      setScaleFactor(0.9);
    } else if (preset === 'hp') {
      setScaleFactor(1.0);
    } else if (preset === 'pc') {
      setScaleFactor(1.0);
    }
  };

  const handleZoomChange = (delta: number) => {
    playBeep('click');
    setScaleFactor(prev => {
      const next = Math.max(0.6, Math.min(2.0, prev + delta));
      localStorage.setItem('monitor_zoom', next.toFixed(2));
      return parseFloat(next.toFixed(2));
    });
  };

  const handleFitScreen = () => {
    playBeep('click');
    setScaleFactor(1.0);
    localStorage.setItem('monitor_zoom', '1.00');
  };

  // Poll for valid score chimes & screen flashes in real-time
  useEffect(() => {
    if (state.lastValidScore) {
      const scaleAge = Date.now() - state.lastValidScore.timestamp;
      if (scaleAge < 1100) {
        // Trigger visual flash
        if (state.lastValidScore.sudut === 'biru') {
          setFlashBlue(true);
          setTimeout(() => setFlashBlue(false), 900);
        } else {
          setFlashRed(true);
          setTimeout(() => setFlashRed(false), 950);
        }
        
        // Play dual chimes sound on Monitor
        playBeep('valid');
      }
    }
  }, [state.lastValidScore]);

  // Play warning sirens when game transitions to babak habis
  useEffect(() => {
    if (state.matchStatus === 'babak_habis') {
      playBeep('alert');
    }
  }, [state.matchStatus]);

  // Automatic Sound Alert & Voice Announcement on Match End
  useEffect(() => {
    const currentMatchKey = `${state.partai}_${state.kelas}_${state.matchStatus}_${state.winner}_${state.scores.biru.total}_${state.scores.merah.total}`;

    if (state.matchStatus === 'selesai' && (prevStatusRef.current !== 'selesai' || announcedMatchKeyRef.current !== currentMatchKey)) {
      announcedMatchKeyRef.current = currentMatchKey;

      // 1. Play celebratory fanfare sound alert
      playBeep('victory');

      const winnerCorner = state.winner;
      const winnerName = winnerCorner === 'biru' 
        ? state.atletBiru.nama 
        : winnerCorner === 'merah' 
        ? state.atletMerah.nama 
        : 'Pertandingan Seri';
      
      const kontingen = winnerCorner === 'biru' 
        ? state.atletBiru.kontingen 
        : winnerCorner === 'merah' 
        ? state.atletMerah.kontingen 
        : '';

      // 2. Trigger dynamic Toast notification
      setMatchToast({
        show: true,
        winner: state.winner,
        winnerName,
        kontingen,
        scoreMerah: state.scores.merah.total,
        scoreBiru: state.scores.biru.total,
        partai: state.partai,
        isSpeaking: voiceEnabled
      });

      // 3. Trigger Voice Announcement automatically
      if (voiceEnabled) {
        const ttsTimer = setTimeout(() => {
          announceWinnerVoice({
            winner: state.winner,
            winnerName,
            winnerKontingen: kontingen,
            kelas: state.kelas,
            partai: state.partai,
            skorMerah: state.scores.merah.total,
            skorBiru: state.scores.biru.total
          }, () => {
            setMatchToast(prev => prev ? { ...prev, isSpeaking: false } : null);
          });
        }, 450);

        return () => clearTimeout(ttsTimer);
      }
    } else if (state.matchStatus !== 'selesai' && prevStatusRef.current === 'selesai') {
      // Clear toast when leaving finish status
      setMatchToast(null);
      if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
        window.speechSynthesis.cancel();
      }
    }

    prevStatusRef.current = state.matchStatus;
  }, [state.matchStatus, state.winner, state.partai, state.kelas, state.scores.merah.total, state.scores.biru.total, state.atletBiru.nama, state.atletBiru.kontingen, state.atletMerah.nama, state.atletMerah.kontingen, voiceEnabled]);

  const handleReplayAnnouncement = () => {
    playBeep('click');
    if (!matchToast) return;
    playBeep('victory');
    setMatchToast(prev => prev ? { ...prev, isSpeaking: true } : null);
    setTimeout(() => {
      announceWinnerVoice({
        winner: matchToast.winner,
        winnerName: matchToast.winnerName,
        winnerKontingen: matchToast.kontingen,
        kelas: state.kelas,
        partai: matchToast.partai,
        skorMerah: matchToast.scoreMerah,
        skorBiru: matchToast.scoreBiru
      }, () => {
        setMatchToast(prev => prev ? { ...prev, isSpeaking: false } : null);
      });
    }, 350);
  };

  const formatTimer = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  // Calculate Juri Hits filtered by type
  const getJuriActionCount = (jNum: 1 | 2 | 3, sudut: 'merah' | 'biru', aksi: 'punch' | 'kick', babakNum: number) => {
    if (!state.juriHits) return 0;
    return state.juriHits.filter(h => h.juriId === jNum && h.sudut === sudut && h.aksi === aksi && h.babak === babakNum).length;
  };

  const redPen = state.dewanPenalties.merah;
  const bluePen = state.dewanPenalties.biru;
  const v = state.verification;

  return (
    <div className="w-full h-full flex flex-col justify-between p-3 md:p-4 transition-colors duration-300 select-none overflow-hidden relative bg-[#03091e] text-slate-100">
      
      {/* Decorative clean ambient stadium gradient */}
      <div className="absolute inset-0 pointer-events-none transition-all duration-300 bg-gradient-to-b from-[#020718] via-[#05112e] to-[#010514]" />

      {/* Dynamic Watermark background logo in deep center of screen */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-0 overflow-hidden select-none">
        {(state.logoTengah || state.logoKiri || state.logoKanan) ? (
          <img 
            src={state.logoTengah || state.logoKiri || state.logoKanan || undefined} 
            alt="Watermark Logo" 
            className="w-[45%] h-[45%] object-contain opacity-[0.04] dark:opacity-[0.06] transition-all duration-300"
            referrerPolicy="no-referrer"
          />
        ) : (
          <div className="text-slate-500/5 dark:text-slate-400/5 text-[9vw] font-black uppercase tracking-[1.5rem] select-none text-center">
            Pencak Silat
          </div>
        )}
      </div>

      {/* Symmetrical High-Res Scale Container to prevent bounds overflowing while blowing up crisp graphics */}
      <div 
        className="w-full h-full flex flex-col justify-between z-10"
        style={{
          transform: `scale(${scaleFactor})`,
          width: `${100 / scaleFactor}%`,
          height: `${100 / scaleFactor}%`,
          transformOrigin: 'top left',
          transition: 'transform 0.25s cubic-bezier(0.4, 0, 0.2, 1), width 0.25s cubic-bezier(0.4, 0, 0.2, 1), height 0.25s cubic-bezier(0.4, 0, 0.2, 1)'
        }}
      >

        {/* 1. Header (Monitor Match Stats & Logos with Prominent Tournament Name & Partai) */}
        <div className="rounded-2xl shadow-xl z-20 flex-shrink-0 transition-all duration-300 bg-[#040e2b] border border-blue-600/40 px-3 py-2 md:px-5 md:py-2.5">
          <div className="flex items-center justify-between gap-2.5 sm:gap-4">
            
            {/* Left Controls group */}
            <div className="flex items-center gap-1.5 md:gap-2 shrink-0">
              <button 
                onClick={() => { playBeep('click'); onBack(); }}
                className="px-3 py-1.5 rounded-xl bg-[#07153d] hover:bg-blue-950 border border-blue-500/40 text-white font-black text-xs uppercase flex items-center gap-1.5 transition-all cursor-pointer shadow-sm"
              >
                <Menu className="w-3.5 h-3.5" />
                <span>MENU</span>
              </button>

              {/* Device Layout Switcher */}
              <div className={`${showControls ? 'flex' : 'hidden'} items-center bg-[#07153d] border border-blue-500/30 rounded-xl p-0.5 text-[10px] font-mono shadow-inner gap-0.5`}>
                <button
                  onClick={() => handleDevicePresetChange('auto')}
                  className={`px-2 py-1 rounded-lg transition-all font-bold flex items-center gap-1 cursor-pointer ${
                    devicePreset === 'auto'
                      ? 'bg-blue-600 text-white shadow-md shadow-blue-500/30'
                      : 'text-slate-300 hover:text-white'
                  }`}
                  title="Deteksi Ukuran Layar Otomatis"
                >
                  <RotateCcw className="w-3 h-3" />
                  <span className="hidden md:inline">Auto</span>
                </button>
                <button
                  onClick={() => handleDevicePresetChange('hp')}
                  className={`px-1.5 py-1 rounded-lg transition-all font-bold flex items-center gap-0.5 cursor-pointer ${
                    devicePreset === 'hp'
                      ? 'bg-blue-600 text-white shadow-md shadow-blue-500/30'
                      : 'text-slate-300 hover:text-white'
                  }`}
                  title="Tampilan HP / Mobile"
                >
                  <Smartphone className="w-3 h-3" />
                  <span className="hidden md:inline">HP</span>
                </button>
                <button
                  onClick={() => handleDevicePresetChange('tablet')}
                  className={`px-1.5 py-1 rounded-lg transition-all font-bold flex items-center gap-0.5 cursor-pointer ${
                    devicePreset === 'tablet'
                      ? 'bg-blue-600 text-white shadow-md shadow-blue-500/30'
                      : 'text-slate-300 hover:text-white'
                  }`}
                  title="Tampilan Tablet"
                >
                  <Tablet className="w-3 h-3" />
                  <span className="hidden md:inline">Tab</span>
                </button>
                <button
                  onClick={() => handleDevicePresetChange('pc')}
                  className={`px-1.5 py-1 rounded-lg transition-all font-bold flex items-center gap-0.5 cursor-pointer ${
                    devicePreset === 'pc'
                      ? 'bg-blue-600 text-white shadow-md shadow-blue-500/30'
                      : 'text-slate-300 hover:text-white'
                  }`}
                  title="Tampilan PC / Laptop"
                >
                  <Monitor className="w-3 h-3" />
                  <span className="hidden md:inline">PC</span>
                </button>
                <button
                  onClick={() => handleDevicePresetChange('tv')}
                  className={`px-1.5 py-1 rounded-lg transition-all font-bold flex items-center gap-0.5 cursor-pointer ${
                    devicePreset === 'tv'
                      ? 'bg-blue-600 text-white shadow-md shadow-blue-500/30'
                      : 'text-slate-300 hover:text-white'
                  }`}
                  title="Tampilan Layar TV / LED Videotron"
                >
                  <Tv className="w-3 h-3" />
                  <span className="hidden md:inline">TV</span>
                </button>
              </div>

              {/* Theme Palette Switcher */}
              <div className={showControls ? 'inline-block' : 'hidden'}>
                <ThemePaletteSelector compact={true} />
              </div>

              {/* Voice Alert & Announcement Toggle */}
              <button
                onClick={toggleVoice}
                className={`${showControls ? 'flex' : 'hidden'} p-1.5 px-2 rounded-xl border border-blue-500/40 transition-colors cursor-pointer items-center justify-center ${
                  voiceEnabled 
                    ? 'bg-cyan-950/80 text-cyan-400 border-cyan-400/50 shadow-sm' 
                    : 'bg-[#07153d] text-slate-400 hover:text-white'
                }`}
                title={voiceEnabled ? 'Pengumuman Suara Otomatis: AKTIF' : 'Pengumuman Suara Otomatis: NONAKTIF'}
              >
                {voiceEnabled ? <Volume2 className="w-3.5 h-3.5" /> : <VolumeX className="w-3.5 h-3.5" />}
              </button>

              <button
                onClick={toggleFullscreen}
                className={`${showControls ? 'flex' : 'hidden'} p-1.5 px-2 rounded-xl border border-blue-500/40 bg-[#07153d] hover:bg-blue-900/60 text-white transition-colors cursor-pointer items-center justify-center shadow-sm`}
                title="Toggle Fullscreen"
              >
                {isFullscreen ? <Minimize2 className="w-3.5 h-3.5" /> : <Maximize2 className="w-3.5 h-3.5" />}
              </button>
            </div>

            {/* Center: NAMA KEJUARAAN (High Visibility, Bold, Centered, No Collision) */}
            <div className="flex-1 flex flex-col items-center justify-center min-w-0 px-2 sm:px-4 text-center">
              <div className="flex items-center justify-center gap-1.5 sm:gap-2 max-w-full">
                <span className="text-amber-400 text-xs sm:text-sm md:text-base shrink-0">🏆</span>
                <h1 className="text-sm sm:text-base md:text-lg lg:text-xl xl:text-2xl font-black text-amber-300 uppercase tracking-wider truncate drop-shadow-[0_2px_8px_rgba(0,0,0,0.85)] font-sans">
                  {state.namaEvent || "KEJUARAAN PENCAK SILAT NASIONAL"}
                </h1>
                <span className="text-amber-400 text-xs sm:text-sm md:text-base shrink-0">🏆</span>
              </div>
              <div className="flex items-center justify-center gap-2 text-[9px] sm:text-[10px] md:text-[11px] font-mono font-bold text-blue-200/90 tracking-wider uppercase mt-0.5">
                <span className="px-2 py-0.5 rounded bg-blue-900/70 border border-blue-600/70 text-cyan-300">
                  GELANGGANG {state.gelanggang || '1'}
                </span>
                <span className="text-blue-400">•</span>
                <span className="text-slate-300/90 truncate">PERSATUAN PENCAK SILAT INDONESIA</span>
              </div>
            </div>

            {/* Right Controls group */}
            <div className="flex items-center gap-2 md:gap-2.5 shrink-0">
              {/* Zoom Selector */}
              <div className={`${showControls ? 'flex' : 'hidden'} items-center bg-[#07153d] border border-blue-500/30 rounded-xl px-2.5 py-1 text-xs font-mono font-bold text-white gap-2 shadow-inner`}>
                <Sun className="w-3.5 h-3.5 text-amber-400" />
                <span>{Math.round(scaleFactor * 100)}%</span>
                <button 
                  onClick={() => handleZoomChange(0.05)} 
                  className="hover:text-blue-400 font-black cursor-pointer px-1"
                  title="Zoom In"
                >
                  +
                </button>
              </div>

              <button
                onClick={handleFitScreen}
                className={`${showControls ? 'inline-block' : 'hidden'} px-2.5 py-1.5 rounded-xl bg-[#07153d] border border-blue-500/30 text-white font-black text-xs hover:bg-blue-900/60 uppercase cursor-pointer shadow-sm`}
                title="Reset Ukuran (Fit Screen)"
              >
                FTT
              </button>

              {/* PARTAI badge (Very Prominent, High Contrast, Large) */}
              <div className="flex flex-col items-center justify-center bg-gradient-to-b from-[#0e2764] via-[#0b1d47] to-[#040f2b] border-2 border-cyan-400/80 rounded-2xl px-3 sm:px-4 md:px-5 py-0.5 md:py-1 shadow-xl ring-2 ring-cyan-500/30 shrink-0">
                <span className="text-[8.5px] sm:text-[9.5px] md:text-[10px] font-black text-cyan-300 tracking-widest uppercase leading-none mb-0.5">PARTAI</span>
                <span className="text-xl sm:text-2xl md:text-3xl lg:text-4xl font-black text-white font-mono leading-none drop-shadow-md">
                  {String(state.partai || 1).padStart(2, '0')}
                </span>
              </div>
              
              {/* IPSI Logo Badge */}
              <div className="w-8 h-8 md:w-8.5 md:h-8.5 rounded-full bg-white border border-blue-400 flex items-center justify-center font-black text-[9px] text-[#0f2b5c] shadow-md overflow-hidden p-0.5 shrink-0">
                {state.logoKanan ? (
                  <img src={state.logoKanan} alt="Logo IPSI" className="w-full h-full object-contain" referrerPolicy="no-referrer" />
                ) : (
                  "IPSI"
                )}
              </div>

              {/* Indonesian Flag */}
              <div className="flex flex-col w-7 h-[18px] border border-slate-300 rounded overflow-hidden shadow-sm flex-shrink-0">
                <div className="bg-[#e01a22] h-1/2 w-full" />
                <div className="bg-white h-1/2 w-full" />
              </div>
            </div>

          </div>
        </div>

        {/* CONDITIONAL RENDER: MOBILE PORTRAIT LAYOUT vs WIDESCREEN ARENA LAYOUT */}
        {effectiveProfile === 'hp' && (windowSize.height > windowSize.width || devicePreset === 'hp') ? (
          /* ========================================================
             📱 DEDICATED MOBILE PORTRAIT SCOREBOARD LAYOUT
             ======================================================== */
          <div className="flex-1 flex flex-col justify-between my-2 overflow-y-auto z-10 gap-2">
            
            {/* 1. Mobile Match Header Badge */}
            <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-2.5 flex items-center justify-between text-xs font-mono">
              <div className="flex items-center gap-2">
                <span className="bg-blue-600 border border-blue-400 text-white px-2.5 py-1 rounded-lg font-black text-xs uppercase shadow-sm">
                  PARTAI {String(state.partai || 1).padStart(2, '0')}
                </span>
                <span className="bg-blue-900/60 border border-blue-700 text-blue-300 px-2 py-0.5 rounded font-black text-[10px] uppercase">
                  GEL {state.gelanggang || 'A'}
                </span>
                <span className="text-slate-300 font-bold text-[11px] uppercase">
                  {state.kelas} {state.gender}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <span className="bg-amber-950/80 border border-amber-500/40 text-amber-400 px-2 py-0.5 rounded font-black text-[10px] uppercase">
                  BABAK {state.currentBabak}
                </span>
              </div>
            </div>

            {/* 2. Timer Countdown in Mobile */}
            <div className="bg-gradient-to-b from-slate-900 to-slate-950 border border-slate-800 rounded-2xl py-3 px-4 flex items-center justify-between shadow-lg">
              <div className="flex items-center gap-2">
                <div className={`w-3 h-3 rounded-full ${state.timerActive ? 'bg-green-500 animate-pulse' : 'bg-amber-500'}`} />
                <span className="text-[10px] font-mono font-bold uppercase text-slate-400">
                  {state.timerActive ? 'PERTANDINGAN BERLANGSUNG' : 'TIMER DIJEDA'}
                </span>
              </div>
              <div className={`text-4xl font-mono font-black tracking-wider ${state.timerActive ? 'text-green-400' : 'text-amber-400'}`}>
                {formatTimer(state.timerSeconds)}
              </div>
            </div>

            {/* 3. Dual Giant Scores (Biru vs Merah) */}
            <div className="grid grid-cols-2 gap-2 flex-1 min-h-[160px]">
              
              {/* Blue Score Card */}
              <div className={`rounded-2xl p-3 flex flex-col justify-between relative overflow-hidden shadow-lg border-2 bg-gradient-to-br from-[#03315a] to-[#01a2e2] ${
                flashBlue ? 'border-cyan-300 shadow-[0_0_30px_rgba(34,211,238,0.5)] scale-[1.02]' : 'border-blue-500/40'
              }`}>
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-black tracking-widest text-cyan-200 uppercase">SUDUT BIRU</span>
                  <div className="w-5 h-5 rounded-full bg-blue-500/30 border border-blue-400 flex items-center justify-center text-[10px] text-white font-bold">B</div>
                </div>

                <div className="my-1">
                  <div className="text-sm font-black text-white truncate leading-tight">{state.atletBiru.nama || "Pesilat Biru"}</div>
                  <div className="text-[10px] text-cyan-200/80 font-mono truncate">{state.atletBiru.kontingen || "Kontingen"}</div>
                </div>

                <div className="text-center my-auto py-1">
                  <div className="text-6xl sm:text-7xl font-mono font-black text-white leading-none drop-shadow-md">
                    <AnimatedScore value={state.scores.biru.total} showDeltaBadge={true} badgeClassName="top-2 right-2 text-xs px-2 py-0.5" />
                  </div>
                </div>
              </div>

              {/* Red Score Card */}
              <div className={`rounded-2xl p-3 flex flex-col justify-between relative overflow-hidden shadow-lg border-2 bg-gradient-to-br from-[#980005] to-[#eb0505] ${
                flashRed ? 'border-orange-300 shadow-[0_0_30px_rgba(249,115,22,0.5)] scale-[1.02]' : 'border-red-500/40'
              }`}>
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-black tracking-widest text-red-200 uppercase">SUDUT MERAH</span>
                  <div className="w-5 h-5 rounded-full bg-red-500/30 border border-red-400 flex items-center justify-center text-[10px] text-white font-bold">M</div>
                </div>

                <div className="my-1">
                  <div className="text-sm font-black text-white truncate leading-tight">{state.atletMerah.nama || "Pesilat Merah"}</div>
                  <div className="text-[10px] text-red-200/80 font-mono truncate">{state.atletMerah.kontingen || "Kontingen"}</div>
                </div>

                <div className="text-center my-auto py-1">
                  <div className="text-6xl sm:text-7xl font-mono font-black text-white leading-none drop-shadow-md">
                    <AnimatedScore value={state.scores.merah.total} showDeltaBadge={true} badgeClassName="top-2 left-2 text-xs px-2 py-0.5" />
                  </div>
                </div>
              </div>

            </div>

            {/* 4. Penalties Mobile Comparison Bar */}
            <div className="grid grid-cols-2 gap-2 bg-slate-900/90 border border-slate-800 rounded-xl p-2 text-[8px] font-mono">
              {/* Blue Penalties */}
              <div className="space-y-1 pr-1 border-r border-slate-800">
                <div className="text-[9px] font-bold text-blue-400 uppercase">Hukuman Biru</div>
                <div className="grid grid-cols-4 gap-1 text-center">
                  <span className={`py-1 rounded font-bold text-[8.5px] ${bluePen.binaan1 || bluePen.binaan2 ? 'bg-amber-400 text-slate-950 font-black' : 'bg-slate-800 text-slate-500'}`}>
                    BIN {bluePen.binaan2 ? '2 👉👉' : bluePen.binaan1 ? '1 👉' : '-'}
                  </span>
                  <span className={`py-1 rounded font-bold text-[8.5px] ${bluePen.teguran1 || bluePen.teguran2 ? 'bg-amber-500 text-slate-950 font-black animate-pulse' : 'bg-slate-800 text-slate-500'}`}>
                    TEG {bluePen.teguran2 ? '2 ✌️' : bluePen.teguran1 ? '1 ☝️' : '-'}
                  </span>
                  <span className={`py-1 rounded font-bold text-[8.5px] ${bluePen.peringatan1 || bluePen.peringatan2 ? 'bg-red-600 text-white font-black' : 'bg-slate-800 text-slate-500'}`}>
                    PER {bluePen.peringatan2 ? '2' : bluePen.peringatan1 ? '1' : '-'}
                  </span>
                  <span className={`py-1 rounded font-bold text-[8.5px] ${bluePen.disqualified ? 'bg-red-800 text-white font-black' : 'bg-slate-800 text-slate-500'}`}>
                    {bluePen.disqualified ? 'DSK' : '-'}
                  </span>
                </div>
              </div>

              {/* Red Penalties */}
              <div className="space-y-1 pl-1">
                <div className="text-[9px] font-bold text-red-400 uppercase">Hukuman Merah</div>
                <div className="grid grid-cols-4 gap-1 text-center">
                  <span className={`py-1 rounded font-bold text-[8.5px] ${redPen.binaan1 || redPen.binaan2 ? 'bg-amber-400 text-slate-950 font-black' : 'bg-slate-800 text-slate-500'}`}>
                    BIN {redPen.binaan2 ? '2 👉👉' : redPen.binaan1 ? '1 👉' : '-'}
                  </span>
                  <span className={`py-1 rounded font-bold text-[8.5px] ${redPen.teguran1 || redPen.teguran2 ? 'bg-amber-500 text-slate-950 font-black animate-pulse' : 'bg-slate-800 text-slate-500'}`}>
                    TEG {redPen.teguran2 ? '2 ✌️' : redPen.teguran1 ? '1 ☝️' : '-'}
                  </span>
                  <span className={`py-1 rounded font-bold text-[8.5px] ${redPen.peringatan1 || redPen.peringatan2 ? 'bg-red-600 text-white font-black' : 'bg-slate-800 text-slate-500'}`}>
                    PER {redPen.peringatan2 ? '2' : redPen.peringatan1 ? '1' : '-'}
                  </span>
                  <span className={`py-1 rounded font-bold text-[8.5px] ${redPen.disqualified ? 'bg-red-800 text-white font-black' : 'bg-slate-800 text-slate-500'}`}>
                    {redPen.disqualified ? 'DSK' : '-'}
                  </span>
                </div>
              </div>
            </div>

            {/* 5. Juri Hits Mobile Summary */}
            <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-2">
              <div className="flex items-center justify-between text-[9px] font-mono font-bold text-slate-400 mb-1">
                <span>SUARA JURI (BABAK {state.currentBabak})</span>
                <span className="text-slate-500">Pukulan ✊ | Tendangan 🦵</span>
              </div>
              <div className="grid grid-cols-3 gap-1.5 text-center font-mono text-[10px]">
                {[1, 2, 3].map((num) => (
                  <div key={num} className="bg-slate-950 border border-slate-800 rounded-lg p-1.5">
                    <div className="text-[8px] text-slate-500 font-bold uppercase mb-1">JURI {num}</div>
                    <div className="flex items-center justify-around">
                      <span className="text-blue-400 font-black">
                        {getJuriActionCount(num as any, 'biru', 'punch', state.currentBabak)}p / {getJuriActionCount(num as any, 'biru', 'kick', state.currentBabak)}t
                      </span>
                      <span className="text-slate-600">|</span>
                      <span className="text-red-400 font-black">
                        {getJuriActionCount(num as any, 'merah', 'punch', state.currentBabak)}p / {getJuriActionCount(num as any, 'merah', 'kick', state.currentBabak)}t
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

          </div>
        ) : (
          /* ========================================================
             💻 WIDESCREEN / TABLET / PC / TV ARENA LAYOUT
             ======================================================== */
          <>

        {/* 1.5 Sub Header: Athlete Information with Flag, User Circles & Countdown Timer */}
        <div className="bg-white text-slate-900 rounded-3xl md:rounded-[28px] p-3 md:px-6 md:py-3.5 shadow-xl border border-slate-200 mt-2.5 flex items-center justify-between flex-shrink-0">
          
          {/* Blue corner athlete description */}
          <div className="flex items-center gap-3 max-w-[33%]">
            <div className="flex flex-col w-9 h-6 md:w-10 md:h-7 border border-slate-300 rounded-md overflow-hidden shadow-sm shrink-0">
              <div className="bg-[#e01a22] h-1/2 w-full" />
              <div className="bg-white h-1/2 w-full" />
            </div>
            
            <div className="w-12 h-12 md:w-13 md:h-13 rounded-full border-2 border-blue-500 bg-blue-50 flex items-center justify-center text-blue-500 shrink-0 shadow-inner">
              <User className="w-7 h-7 fill-blue-500 text-blue-500" />
            </div>

            <div className="flex flex-col min-w-0">
              <h2 className="text-lg md:text-xl font-black text-slate-900 leading-tight truncate">
                {state.atletBiru.nama || "Atlet Biru"}
              </h2>
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider truncate">
                {state.atletBiru.kontingen || "KONTINGEN"}
              </span>
              <span className="mt-0.5 px-3 py-0.5 rounded-full bg-blue-100 text-blue-700 text-[11px] font-black uppercase tracking-wider self-start">
                SUDUT BIRU
              </span>
            </div>
          </div>

          {/* TIMER COUNTDOWN */}
          <div className="flex flex-col items-center justify-center px-4 shrink-0">
            <div className="flex items-center gap-1.5 mb-1">
              <span className="px-2.5 py-0.5 rounded-full bg-blue-900 border border-blue-500 text-cyan-300 text-xs font-mono font-black uppercase tracking-wider shadow-sm">
                PARTAI {String(state.partai || 1).padStart(2, '0')}
              </span>
              <span className="px-2.5 py-0.5 rounded-full bg-slate-100 border border-slate-300 text-slate-800 text-[11px] md:text-xs font-mono font-bold uppercase">
                {state.kelas} {state.gender}
              </span>
              <span className="px-2 py-0.5 rounded-full bg-amber-100 border border-amber-300 text-amber-900 text-[11px] md:text-xs font-mono font-black uppercase">
                BABAK {state.currentBabak}
              </span>
            </div>
            <div className={`text-5xl md:text-6xl lg:text-[4.2rem] font-mono leading-none tracking-normal text-slate-950 font-black select-none ${state.timerActive ? 'text-green-600 animate-pulse' : ''}`}>
              {formatTimer(state.timerSeconds)}
            </div>
          </div>

          {/* Red corner athlete description */}
          <div className="flex items-center gap-3 max-w-[33%] justify-end text-right">
            <div className="flex flex-col items-end min-w-0">
              <h2 className="text-lg md:text-xl font-black text-slate-900 leading-tight truncate text-right">
                {state.atletMerah.nama || "Atlet Merah"}
              </h2>
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider text-right truncate">
                {state.atletMerah.kontingen || "KONTINGEN"}
              </span>
              <span className="mt-0.5 px-3 py-0.5 rounded-full bg-red-100 text-red-600 text-[11px] font-black uppercase tracking-wider self-end">
                SUDUT MERAH
              </span>
            </div>

            <div className="w-12 h-12 md:w-13 md:h-13 rounded-full border-2 border-red-500 bg-red-50 flex items-center justify-center text-red-500 shrink-0 shadow-inner">
              <User className="w-7 h-7 fill-red-500 text-red-500" />
            </div>

            <div className="flex flex-col w-9 h-6 md:w-10 md:h-7 border border-slate-300 rounded-md overflow-hidden shadow-sm shrink-0">
              <div className="bg-[#e01a22] h-1/2 w-full" />
              <div className="bg-white h-1/2 w-full" />
            </div>
          </div>

        </div>

        {/* 2. Main Arena Symmetrical Grid Wrapper */}
        <div className="grid grid-cols-12 gap-3 md:gap-4 flex-1 my-3 min-h-0 z-10 items-stretch" style={{ gridTemplateRows: '1fr' }}>
          
          {/* LEFT CORNER BLUE PENALTY CONTAINER GRID */}
          <div className="col-span-12 md:col-span-2 flex flex-col justify-between gap-2 h-full">
            
            {/* ROW 1: Binaan 1 & 2 */}
            <div className="grid grid-cols-2 gap-2 flex-1">
              <div className={`border rounded-2xl flex flex-col items-center justify-center p-1.5 transition-all shadow-sm ${bluePen.binaan1 ? 'bg-amber-400 border-amber-300 text-slate-950 font-black shadow-md scale-95' : 'bg-[#05112e] border-blue-500/70 text-white hover:border-blue-400'}`}>
                <Binaan1Icon active={!!bluePen.binaan1} side="biru" className="w-7 h-7" />
                <span className="text-[8px] md:text-[9px] font-black uppercase tracking-wider mt-1">BINAAN 1 👉</span>
              </div>
              <div className={`border rounded-2xl flex flex-col items-center justify-center p-1.5 transition-all shadow-sm ${bluePen.binaan2 ? 'bg-amber-400 border-amber-300 text-slate-950 font-black shadow-md scale-95' : 'bg-[#05112e] border-blue-500/70 text-white hover:border-blue-400'}`}>
                <Binaan2Icon active={!!bluePen.binaan2} side="biru" className="w-7 h-7" />
                <span className="text-[8px] md:text-[9px] font-black uppercase tracking-wider mt-1">BINAAN 2 👉👉</span>
              </div>
            </div>

            {/* ROW 2: Teguran 1 & 2 */}
            <div className="grid grid-cols-2 gap-2 flex-1">
              <div className={`border rounded-2xl flex flex-col items-center justify-center p-1.5 transition-all shadow-sm ${bluePen.teguran1 ? 'bg-amber-400 border-amber-300 text-slate-950 font-black shadow-md scale-95 animate-pulse' : 'bg-[#05112e] border-blue-500/70 text-white hover:border-blue-400'}`}>
                <Teguran1Icon active={!!bluePen.teguran1} className="w-7 h-7" />
                <span className="text-[8px] md:text-[9px] font-black uppercase tracking-wider mt-1">TEGURAN 1 ☝️</span>
              </div>
              <div className={`border rounded-2xl flex flex-col items-center justify-center p-1.5 transition-all shadow-sm ${bluePen.teguran2 ? 'bg-amber-400 border-amber-300 text-slate-950 font-black shadow-md scale-95 animate-pulse' : 'bg-[#05112e] border-blue-500/70 text-white hover:border-blue-400'}`}>
                <Teguran2Icon active={!!bluePen.teguran2} className="w-7 h-7" />
                <span className="text-[8px] md:text-[9px] font-black uppercase tracking-wider mt-1">TEGURAN 2 ✌️</span>
              </div>
            </div>

            {/* ROW 3: Peringatan 1, 2 & Disqualified */}
            <div className="grid grid-cols-3 gap-1.5 flex-1">
              <div className={`border rounded-2xl flex flex-col items-center justify-center p-1 transition-all shadow-sm ${bluePen.peringatan1 ? 'bg-blue-600 border-cyan-400 text-white shadow-md' : 'bg-[#05112e] border-blue-500/70 text-white hover:border-blue-400'}`}>
                <Peringatan1Icon active={!!bluePen.peringatan1} side="biru" className="w-6 h-6" />
                <span className="text-[7.5px] font-black uppercase tracking-wider mt-1">PER 1</span>
              </div>
              <div className={`border rounded-2xl flex flex-col items-center justify-center p-1 transition-all shadow-sm ${bluePen.peringatan2 ? 'bg-blue-700 border-cyan-400 text-white shadow-md' : 'bg-[#05112e] border-blue-500/70 text-white hover:border-blue-400'}`}>
                <Peringatan2Icon active={!!bluePen.peringatan2} side="biru" className="w-6 h-6" />
                <span className="text-[7.5px] font-black uppercase tracking-wider mt-1">PER 2</span>
              </div>
              <div className={`border rounded-2xl flex flex-col items-center justify-center p-1 transition-all shadow-sm ${bluePen.disqualified ? 'bg-red-700 border-red-500 text-white shadow-md' : 'bg-[#05112e] border-blue-500/70 text-white hover:border-blue-400'}`}>
                <DisqualifikasiIcon active={!!bluePen.disqualified} className="w-6 h-6" />
                <span className="text-[7.5px] font-black uppercase tracking-wider mt-1">DSK</span>
              </div>
            </div>

          </div>

          {/* BLUE SCORE PANEL (3 columns) */}
          <div 
            className={`col-span-12 md:col-span-3 rounded-[28px] overflow-hidden shadow-[0_0_35px_rgba(0,128,255,0.4)] border-2 border-cyan-400 transition-all duration-300 relative flex flex-col justify-between items-center bg-gradient-to-b from-[#0080ff] to-[#0052cc] p-4 ${
              flashBlue ? 'scale-[1.01] brightness-125' : ''
            }`}
          >
            <span className="absolute top-4 left-6 text-white font-black text-xs md:text-sm tracking-widest uppercase">
              SUDUT BIRU
            </span>

            {/* Giant Score */}
            <div className="relative flex items-center justify-center my-auto select-none">
              <div className="text-[9rem] md:text-[11.5rem] lg:text-[13rem] font-sans font-black leading-none text-white tracking-tighter drop-shadow-[0_4px_12px_rgba(0,0,0,0.35)]">
                <AnimatedScore value={state.scores.biru.total} showDeltaBadge={true} badgeClassName="top-4 right-4 text-sm md:text-base px-2.5 py-1 shadow-2xl" />
              </div>
              {state.scores.biru.total === 0 && (
                <div className="w-3.5 h-3.5 md:w-4.5 md:h-4.5 bg-white rounded-full absolute pointer-events-none" />
              )}
            </div>

            <span className="text-white/60 text-[9.5px] md:text-[10px] font-mono tracking-widest font-extrabold uppercase pb-1">
              IPSI OFFICIAL DIGITAL
            </span>
          </div>

          {/* CENTER STACK COLUMN: Logo & Single Babak Indicator */}
          <div className="col-span-12 md:col-span-2 flex flex-col justify-between items-center h-full py-2 gap-3">
            
            {/* Event Logo circular container */}
            <div className="flex-1 flex items-center justify-center w-full">
              <div className="w-20 h-20 md:w-24 md:h-24 rounded-full border-2 border-dashed border-blue-400/60 bg-[#05112e] flex flex-col items-center justify-center text-blue-300 shadow-inner overflow-hidden p-1.5">
                {state.logoTengah ? (
                  <img 
                    src={state.logoTengah} 
                    alt="Event Logo" 
                    className="w-full h-full object-contain filter drop-shadow-md"
                    referrerPolicy="no-referrer"
                  />
                ) : (
                  <span className="text-[10px] font-black uppercase tracking-wider">NO LOGO</span>
                )}
              </div>
            </div>

            {/* Babak Indicator Box */}
            <div className="w-22 md:w-26 border-2 border-amber-400 bg-[#05112e] rounded-2xl py-3 px-3 flex flex-col items-center justify-center shadow-lg shadow-amber-950/30">
              <span className="text-amber-400 font-black text-xs md:text-sm uppercase tracking-widest leading-none font-sans">
                BABAK
              </span>
              <span className="text-4xl md:text-5xl font-mono font-black text-white pt-1 w-full text-center leading-none">
                {state.currentBabak}
              </span>
            </div>

          </div>

          {/* RED SCORE PANEL (3 columns) */}
          <div 
            className={`col-span-12 md:col-span-3 rounded-[28px] overflow-hidden shadow-[0_0_35px_rgba(230,0,0,0.4)] border-2 border-red-500 transition-all duration-300 relative flex flex-col justify-between items-center bg-gradient-to-b from-[#e60000] to-[#b30000] p-4 ${
              flashRed ? 'scale-[1.01] brightness-125' : ''
            }`}
          >
            <span className="absolute top-4 right-6 text-white font-black text-xs md:text-sm tracking-widest uppercase">
              SUDUT MERAH
            </span>

            {/* Giant Score */}
            <div className="relative flex items-center justify-center my-auto select-none">
              <div className="text-[9rem] md:text-[11.5rem] lg:text-[13rem] font-sans font-black leading-none text-white tracking-tighter drop-shadow-[0_4px_12px_rgba(0,0,0,0.35)]">
                <AnimatedScore value={state.scores.merah.total} showDeltaBadge={true} badgeClassName="top-4 left-4 text-sm md:text-base px-2.5 py-1 shadow-2xl" />
              </div>
              {state.scores.merah.total === 0 && (
                <div className="w-3.5 h-3.5 md:w-4.5 md:h-4.5 bg-white rounded-full absolute pointer-events-none" />
              )}
            </div>

            <span className="text-white/60 text-[9.5px] md:text-[10px] font-mono tracking-widest font-extrabold uppercase pb-1">
              IPSI OFFICIAL DIGITAL
            </span>
          </div>

          {/* RIGHT CORNER RED PENALTY CONTAINER GRID */}
          <div className="col-span-12 md:col-span-2 flex flex-col justify-between gap-2 h-full">
            
            {/* ROW 1: BINAAN 1 & 2 */}
            <div className="grid grid-cols-2 gap-2 flex-1">
              <div className={`border rounded-2xl flex flex-col items-center justify-center p-1.5 transition-all shadow-sm ${redPen.binaan1 ? 'bg-amber-400 border-amber-300 text-slate-950 font-black shadow-md scale-95' : 'bg-[#240609] border-red-500/70 text-white hover:border-red-400'}`}>
                <Binaan1Icon active={!!redPen.binaan1} side="merah" className="w-7 h-7" />
                <span className="text-[8px] md:text-[9px] font-black uppercase tracking-wider mt-1">BINAAN 1 👉</span>
              </div>
              <div className={`border rounded-2xl flex flex-col items-center justify-center p-1.5 transition-all shadow-sm ${redPen.binaan2 ? 'bg-amber-400 border-amber-300 text-slate-950 font-black shadow-md scale-95' : 'bg-[#240609] border-red-500/70 text-white hover:border-red-400'}`}>
                <Binaan2Icon active={!!redPen.binaan2} side="merah" className="w-7 h-7" />
                <span className="text-[8px] md:text-[9px] font-black uppercase tracking-wider mt-1">BINAAN 2 👉👉</span>
              </div>
            </div>

            {/* ROW 2: TEGURAN 1 & 2 */}
            <div className="grid grid-cols-2 gap-2 flex-1">
              <div className={`border rounded-2xl flex flex-col items-center justify-center p-1.5 transition-all shadow-sm ${redPen.teguran1 ? 'bg-amber-400 border-amber-300 text-slate-950 font-black shadow-md scale-95 animate-pulse' : 'bg-[#240609] border-red-500/70 text-white hover:border-red-400'}`}>
                <Teguran1Icon active={!!redPen.teguran1} className="w-7 h-7" />
                <span className="text-[8px] md:text-[9px] font-black uppercase tracking-wider mt-1">TEGURAN 1 ☝️</span>
              </div>
              <div className={`border rounded-2xl flex flex-col items-center justify-center p-1.5 transition-all shadow-sm ${redPen.teguran2 ? 'bg-amber-400 border-amber-300 text-slate-950 font-black shadow-md scale-95 animate-pulse' : 'bg-[#240609] border-red-500/70 text-white hover:border-red-400'}`}>
                <Teguran2Icon active={!!redPen.teguran2} className="w-7 h-7" />
                <span className="text-[8px] md:text-[9px] font-black uppercase tracking-wider mt-1">TEGURAN 2 ✌️</span>
              </div>
            </div>

            {/* ROW 3: Peringatan 1, 2 & Disqualified */}
            <div className="grid grid-cols-3 gap-1.5 flex-1">
              <div className={`border rounded-2xl flex flex-col items-center justify-center p-1 transition-all shadow-sm ${redPen.peringatan1 ? 'bg-red-600 border-red-400 text-white shadow-md' : 'bg-[#05112e] border-red-500/70 text-white hover:border-red-400'}`}>
                <Peringatan1Icon active={!!redPen.peringatan1} side="merah" className="w-6 h-6" />
                <span className="text-[7.5px] font-black uppercase tracking-wider mt-1">PER 1</span>
              </div>
              <div className={`border rounded-2xl flex flex-col items-center justify-center p-1 transition-all shadow-sm ${redPen.peringatan2 ? 'bg-red-700 border-red-400 text-white shadow-md' : 'bg-[#05112e] border-red-500/70 text-white hover:border-red-400'}`}>
                <Peringatan2Icon active={!!redPen.peringatan2} side="merah" className="w-6 h-6" />
                <span className="text-[7.5px] font-black uppercase tracking-wider mt-1">PER 2</span>
              </div>
              <div className={`border rounded-2xl flex flex-col items-center justify-center p-1 transition-all shadow-sm ${redPen.disqualified ? 'bg-red-800 border-red-400 text-white shadow-md' : 'bg-[#05112e] border-red-500/70 text-white hover:border-red-400'}`}>
                <DisqualifikasiIcon active={!!redPen.disqualified} className="w-6 h-6" />
                <span className="text-[7.5px] font-black uppercase tracking-wider mt-1">DSK</span>
              </div>
            </div>

          </div>

        </div>

        {/* 3. Bottom Row: Symmetrical Juri Hits Breakdown */}
        {/* Row 1 (Punches 👊) */}
        <div className="grid grid-cols-12 gap-3 items-center mt-1 flex-shrink-0">
          
          {/* Blue Corner Juri punches */}
          <div className="col-span-5 grid grid-cols-3 gap-2">
            {[1, 2, 3].map((num) => (
              <div key={num} className="bg-white rounded-xl py-2 px-1 shadow-sm text-center font-mono border border-slate-200">
                <span className="text-[8.5px] text-slate-800 font-extrabold uppercase block leading-none">JURI {num}</span>
                <span className="text-xl md:text-2xl font-black text-blue-600 tracking-tight leading-none block mt-1">
                  {getJuriActionCount(num as any, 'biru', 'punch', state.currentBabak)}
                </span>
              </div>
            ))}
          </div>

          {/* Center Punch Indicator 👊 */}
          <div className="col-span-2 flex justify-center">
            <div className="w-11 h-11 border border-slate-200 bg-white rounded-xl shadow-sm flex items-center justify-center text-slate-800" title="Kategori Pukulan (+1)">
              <FistPunchCenterIcon />
            </div>
          </div>

          {/* Red Corner Juri punches */}
          <div className="col-span-5 grid grid-cols-3 gap-2">
            {[1, 2, 3].map((num) => (
              <div key={num} className="bg-white rounded-xl py-2 px-1 shadow-sm text-center font-mono border border-slate-200">
                <span className="text-[8.5px] text-slate-800 font-extrabold uppercase block leading-none">JURI {num}</span>
                <span className="text-xl md:text-2xl font-black text-red-600 tracking-tight leading-none block mt-1">
                  {getJuriActionCount(num as any, 'merah', 'punch', state.currentBabak)}
                </span>
              </div>
            ))}
          </div>

        </div>

        {/* Row 2 (Kicks 🦵) */}
        <div className="grid grid-cols-12 gap-3 items-center mt-2 flex-shrink-0">
          
          {/* Blue Corner Juri kicks */}
          <div className="col-span-5 grid grid-cols-3 gap-2">
            {[1, 2, 3].map((num) => (
              <div key={num} className="bg-white rounded-xl py-2 px-1 shadow-sm text-center font-mono border border-slate-200">
                <span className="text-[8.5px] text-slate-800 font-extrabold uppercase block leading-none">JURI {num}</span>
                <span className="text-xl md:text-2xl font-black text-blue-600 tracking-tight leading-none block mt-1">
                  {getJuriActionCount(num as any, 'biru', 'kick', state.currentBabak)}
                </span>
              </div>
            ))}
          </div>

          {/* Center Kick Indicator (Silat Kick Silhouette) */}
          <div className="col-span-2 flex justify-center">
            <div className="w-11 h-11 border border-slate-200 bg-white rounded-xl shadow-sm flex items-center justify-center text-slate-800" title="Kategori Tendangan (+2)">
              <SilatKickCenterIcon />
            </div>
          </div>

          {/* Red Corner Juri kicks */}
          <div className="col-span-5 grid grid-cols-3 gap-2">
            {[1, 2, 3].map((num) => (
              <div key={num} className="bg-white rounded-xl py-2 px-1 shadow-sm text-center font-mono border border-slate-200">
                <span className="text-[8.5px] text-slate-800 font-extrabold uppercase block leading-none">JURI {num}</span>
                <span className="text-xl md:text-2xl font-black text-red-600 tracking-tight leading-none block mt-1">
                  {getJuriActionCount(num as any, 'merah', 'kick', state.currentBabak)}
                </span>
              </div>
            ))}
          </div>

        </div>
        </>
        )}

        {/* 4. Overlay & Alerts */}
        <AnimatePresence>
          {/* TOAST NOTIFICATION: Triggered on Match End */}
          {matchToast && matchToast.show && (
            <motion.div
              initial={{ y: -60, opacity: 0, scale: 0.95 }}
              animate={{ y: 0, opacity: 1, scale: 1 }}
              exit={{ y: -60, opacity: 0, scale: 0.95 }}
              transition={{ type: 'spring', damping: 20, stiffness: 300 }}
              className="fixed top-4 right-4 z-[9999] max-w-md w-full shadow-2xl rounded-2xl overflow-hidden border-2 border-yellow-400/80 bg-slate-950 text-white select-none pointer-events-auto"
            >
              {/* Toast Header */}
              <div className="bg-gradient-to-r from-amber-500 via-yellow-400 to-amber-500 px-4 py-1.5 flex items-center justify-between text-slate-950 font-mono font-black text-xs">
                <div className="flex items-center gap-1.5">
                  <BellRing className="w-3.5 h-3.5 animate-bounce text-slate-950" />
                  <span className="tracking-wider uppercase">PENGUMUMAN HASIL AKHIR</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-[10px] bg-slate-950/20 px-2 py-0.5 rounded font-bold">
                    PARTAI {matchToast.partai}
                  </span>
                  <button
                    onClick={() => setMatchToast(null)}
                    className="p-0.5 rounded hover:bg-slate-950/20 text-slate-950 cursor-pointer"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              {/* Toast Body */}
              <div className="p-4 space-y-3">
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className={`w-11 h-11 rounded-2xl flex items-center justify-center shadow-md flex-shrink-0 ${
                      matchToast.winner === 'biru' ? 'bg-blue-600 border border-blue-400 text-white' : matchToast.winner === 'merah' ? 'bg-red-600 border border-red-400 text-white' : 'bg-amber-600 text-white'
                    }`}>
                      <Trophy className="w-6 h-6 text-yellow-300" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className={`text-[10px] font-black uppercase px-2 py-0.5 rounded font-mono ${
                          matchToast.winner === 'biru' ? 'bg-blue-900/80 text-blue-300 border border-blue-700' : matchToast.winner === 'merah' ? 'bg-red-900/80 text-red-300 border border-red-700' : 'bg-slate-800 text-amber-300'
                        }`}>
                          {matchToast.winner === 'biru' ? 'PEMENANG: SUDUT BIRU' : matchToast.winner === 'merah' ? 'PEMENANG: SUDUT MERAH' : 'HASIL: SERI'}
                        </span>
                      </div>
                      <h4 className="text-base font-black text-white mt-1 leading-tight">
                        {matchToast.winnerName}
                      </h4>
                      {matchToast.kontingen && (
                        <p className="text-xs text-slate-400 font-mono">
                          Kontingen: <span className="text-slate-200 font-bold">{matchToast.kontingen}</span>
                        </p>
                      )}
                    </div>
                  </div>
                </div>

                {/* Score bar */}
                <div className="grid grid-cols-2 gap-2 bg-slate-900/90 p-2.5 rounded-xl border border-slate-800 font-mono text-center">
                  <div className="border-r border-slate-800 pr-2">
                    <span className="text-[9px] text-blue-400 font-bold block uppercase">SKOR BIRU</span>
                    <span className="text-xl font-black text-blue-400">{matchToast.scoreBiru}</span>
                  </div>
                  <div className="pl-2">
                    <span className="text-[9px] text-red-400 font-bold block uppercase">SKOR MERAH</span>
                    <span className="text-xl font-black text-red-400">{matchToast.scoreMerah}</span>
                  </div>
                </div>

                {/* Voice Status & Replay Control */}
                <div className="flex items-center justify-between pt-1 border-t border-slate-800 text-xs font-mono">
                  <div className="flex items-center gap-1.5 text-slate-400 text-[11px]">
                    {matchToast.isSpeaking ? (
                      <span className="flex items-center gap-1.5 text-cyan-400 animate-pulse font-bold">
                        <Volume2 className="w-3.5 h-3.5" />
                        Mengumumkan via suara...
                      </span>
                    ) : (
                      <span className="flex items-center gap-1.5 text-slate-400">
                        <Volume2 className="w-3.5 h-3.5" />
                        Audio pengumuman siap
                      </span>
                    )}
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={handleReplayAnnouncement}
                      className="px-2.5 py-1 rounded-lg bg-cyan-950 hover:bg-cyan-900 border border-cyan-500/40 text-cyan-300 text-[10px] font-bold transition-all flex items-center gap-1 cursor-pointer"
                      title="Putar Ulang Pengumuman Suara"
                    >
                      <Volume2 className="w-3 h-3" />
                      Ulangi Suara
                    </button>
                    <button
                      onClick={() => setMatchToast(null)}
                      className="px-2 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-[10px] font-bold transition-all cursor-pointer"
                    >
                      Tutup
                    </button>
                  </div>
                </div>
              </div>
            </motion.div>
          )}

          {v.active && (
            <div className="fixed bottom-16 left-1/2 -translate-x-1/2 w-full max-w-xl z-[9990] px-4">
              <motion.div
                initial={{ y: 50, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                exit={{ y: 50, opacity: 0 }}
                className="bg-[#1e293b] border-2 border-yellow-500 p-4 rounded-xl flex items-center justify-between shadow-2xl text-white"
              >
                <div className="flex items-center gap-3">
                  <HelpCircle className="w-5 h-5 text-yellow-500 animate-spin" />
                  <div className="font-mono text-[11px]">
                    <div className="font-black text-yellow-400 uppercase tracking-widest leading-none">PROSES VERIFIKASI DEWAN</div>
                    <div className="text-slate-300 mt-1">Kategori: <span className="text-white font-bold">{v.type}</span></div>
                  </div>
                </div>

                <div className="text-right">
                  {v.votes.juri1 && v.votes.juri2 && v.votes.juri3 ? (
                    <div className="text-xs font-mono font-black uppercase text-green-400 border border-green-800/40 bg-green-950/40 px-3 py-1.5 rounded-lg flex items-center gap-1.5 animate-pulse">
                      <CheckCircle className="w-4 h-4 text-green-400" />
                      KEPUTUSAN: {v.result === 'TIDAK_SAH' ? 'TIDAK SAH' : `${v.result}`}
                    </div>
                  ) : (
                    <div className="text-xs font-mono font-bold text-yellow-400 uppercase tracking-widest animate-pulse">
                      MENANTAI SUARA JURI...
                    </div>
                  )}
                </div>
              </motion.div>
            </div>
          )}
        </AnimatePresence>

        <AnimatePresence>
          {state.matchStatus === 'selesai' && (
            <div className="fixed inset-0 bg-[#000000d0] backdrop-blur-sm z-[9999] flex items-center justify-center p-4 overflow-hidden select-none">
              
              {/* WINNER MODAL BLOCK WITH HIGHLIGHT ACCENT BORDER AND VOICE BROADCAST CONTROLS */}
              <div
                className={`bg-white border-4 max-w-lg w-full p-8 rounded-3xl shadow-2xl text-center relative overflow-hidden z-10 ${
                  state.winner === 'biru' ? 'border-blue-500' : state.winner === 'merah' ? 'border-red-500' : 'border-amber-400'
                }`}
              >
                <div className="relative inline-block mb-3">
                  <Trophy className="w-16 h-16 text-yellow-500 mx-auto" />
                  <Sparkles className="w-5 h-5 text-amber-400 absolute -top-1 -right-1 animate-pulse" />
                </div>
                
                <div className="flex items-center justify-center gap-2 mb-2">
                  <span className="text-xs font-black tracking-widest text-[#003366] uppercase font-mono bg-blue-50 border border-blue-200 px-3 py-1 rounded-full">
                    PERTANDINGAN SELESAI
                  </span>
                  <span className="text-xs font-mono font-bold px-2.5 py-1 rounded-full bg-slate-100 border border-slate-300 text-slate-700">
                    PARTAI {state.partai}
                  </span>
                </div>

                <div className="mt-2">
                  <span className={`text-xs font-mono font-black uppercase tracking-wider px-3 py-1 rounded-full ${
                    state.winner === 'biru' ? 'bg-blue-600 text-white' : state.winner === 'merah' ? 'bg-red-600 text-white' : 'bg-amber-500 text-white'
                  }`}>
                    {state.winner === 'biru' ? 'PEMENANG SUDUT BIRU' : state.winner === 'merah' ? 'PEMENANG SUDUT MERAH' : 'HASIL SERI'}
                  </span>
                </div>

                <h3 className="text-3xl font-black uppercase mt-4 text-slate-900 tracking-tight leading-normal border-b border-slate-200 pb-3">
                  {state.winner === 'biru' ? state.atletBiru.nama : state.winner === 'merah' ? state.atletMerah.nama : 'PERTANDINGAN SERI'}
                </h3>

                {(state.winner === 'biru' ? state.atletBiru.kontingen : state.atletMerah.kontingen) && (
                  <p className="text-xs font-mono font-bold text-slate-500 mt-1 uppercase">
                    Kontingen: {state.winner === 'biru' ? state.atletBiru.kontingen : state.atletMerah.kontingen}
                  </p>
                )}

                <div className="grid grid-cols-2 gap-4 max-w-sm mx-auto mt-5 font-mono text-center">
                  <div className="bg-blue-50 p-3 rounded-xl border border-blue-200">
                    <span className="text-[10px] text-blue-700 uppercase font-bold block">TOTAL BIRU</span>
                    <div className="text-3xl font-black text-blue-900 mt-1">{state.scores.biru.total}</div>
                  </div>
                  <div className="bg-red-50 p-3 rounded-xl border border-red-200">
                    <span className="text-[10px] text-red-700 uppercase font-bold block">TOTAL MERAH</span>
                    <div className="text-3xl font-black text-red-900 mt-1">{state.scores.merah.total}</div>
                  </div>
                </div>

                {/* Voice Announcement Action in Modal */}
                <div className="mt-5 pt-3 border-t border-slate-200 flex items-center justify-center gap-3">
                  <button
                    onClick={handleReplayAnnouncement}
                    className="px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-mono text-xs font-bold transition-all flex items-center gap-2 shadow-md cursor-pointer"
                  >
                    <Volume2 className="w-4 h-4 text-cyan-400" />
                    <span>Putar Ulang Pengumuman Suara</span>
                  </button>
                </div>

                <p className="text-[10px] text-slate-500 font-mono mt-4">
                  Menanti admin sekretaris menyetel partai selanjutnya untuk memulai skoring kembali.
                </p>
              </div>
            </div>
          )}
        </AnimatePresence>

        {/* Decorative Brand footer credit */}
        <div className="absolute bottom-1 left-2 text-slate-450 text-[9px] font-mono leading-none tracking-widest uppercase font-bold select-none opacity-60">
          IPSI OFFICIAL MONITOR BOARD SYSTEM
        </div>

      </div> {/* End Scalable Container */}
    </div>
  );
}
