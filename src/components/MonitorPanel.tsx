/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useState, useRef, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Trophy, Sparkles, Volume2, X, CheckCircle, HelpCircle, ArrowLeft, RotateCcw,
  Palette, Settings, Check, RefreshCw, Upload, Image as ImageIcon, Pencil,
  Maximize2, Minimize2, Sun, Moon, Shield, Scissors, Scale, AlertTriangle, BarChart3
} from 'lucide-react';
import { PenaltyPhotoUploaderModal } from './PenaltyPhotoUploaderModal';
import { MatchVerificationMonitorOverlay } from './MatchVerificationMonitorOverlay';
import { MonitorAnalyticsModal } from './MonitorAnalyticsModal';
import { MatchState, MatchHistory } from '../types';
import { playBeep, announceWinnerVoice } from '../utils/sound';
import { 
  PenaltyIconConfig, 
  PenaltyIconType, 
  DEFAULT_PENALTY_ICONS, 
  PERSILAT_PENALTY_ICONS, 
  NEW_REFERENCE_PENALTY_ICONS,
  ACTION_PENALTY_ICONS, 
  STANDARDIZED_IMAGEN_PRESET,
  STANDARDIZED_DQ_PRESET,
  STANDARDIZED_PENALTY_ASSETS,
  ICON_CATALOG, 
  renderPenaltyIcon, 
  IconWasitGesture, 
  IconSilatKicker,
  IconFist 
} from './PenaltyIconSet';
import { optimizePenaltyPng } from '../utils/imageCompressor';
import { useThemePalette, THEME_PALETTES, ThemePaletteId } from '../services/themeService';
import ThemePaletteSelector from './ThemePaletteSelector';

interface MonitorPanelProps {
  state: MatchState;
  histories?: MatchHistory[];
  dispatch?: any;
  onBack: () => void;
  theme: 'dark' | 'light';
  onToggleTheme: () => void;
  onResetScores?: () => void;
  onSelectBabak?: (babak: number) => void;
  serverPenaltyConfig?: PenaltyIconConfig;
}

// Vector IPSI Official Shield Badge or Custom Uploaded Logo from Sekretaris Panel
const IpsiShieldBadge = ({ logoUrl, className = "w-14 h-16 sm:w-16 sm:h-18 md:w-20 md:h-22" }: { logoUrl?: string | null; className?: string }) => {
  if (logoUrl) {
    return (
      <div className={`${className} flex items-center justify-center p-1 drop-shadow-md shrink-0 bg-white rounded-2xl border-2 border-slate-200 overflow-hidden`}>
        <img src={logoUrl} alt="Logo" className="w-full h-full object-contain" referrerPolicy="no-referrer" />
      </div>
    );
  }

  return (
    <div className={`flex items-center justify-center ${className} drop-shadow-lg shrink-0 select-none`}>
      <svg viewBox="0 0 100 115" className="w-full h-full" fill="none" xmlns="http://www.w3.org/2000/svg">
        {/* Outer Shield Shape with Red Border */}
        <path
          d="M50 4 C78 4, 94 14, 94 38 C94 72, 70 96, 50 111 C30 96, 6 72, 6 38 C6 14, 22 4, 50 4 Z"
          fill="#ffffff"
          stroke="#d61e27"
          strokeWidth="4.5"
          strokeLinejoin="round"
        />
        {/* Inner Gold ring outline */}
        <path
          d="M50 9 C74 9, 88 18, 88 39 C88 68, 68 89, 50 103 C32 89, 12 68, 12 39 C12 18, 26 9, 50 9 Z"
          fill="#ffffff"
          stroke="#eab308"
          strokeWidth="1.5"
        />
        {/* Left Green Rice Stalk (Padi) */}
        <path
          d="M30 32 C30 52 40 64 47 70 C41 60 36 46 36 32 Z"
          fill="#16a34a"
        />
        <circle cx="34" cy="36" r="2.2" fill="#22c55e" />
        <circle cx="37" cy="46" r="2.2" fill="#22c55e" />
        <circle cx="42" cy="56" r="2.2" fill="#22c55e" />

        {/* Right Gold Cotton Flowers (Kapas) */}
        <circle cx="64" cy="38" r="3.5" fill="#facc15" stroke="#ca8a04" strokeWidth="0.7" />
        <circle cx="67" cy="48" r="3.5" fill="#facc15" stroke="#ca8a04" strokeWidth="0.7" />
        <circle cx="63" cy="58" r="3.5" fill="#facc15" stroke="#ca8a04" strokeWidth="0.7" />

        {/* Trisula Center Weapon */}
        <path
          d="M50 16 L50 68 M43 28 C43 40 57 40 57 28"
          stroke="#0f172a"
          strokeWidth="3.2"
          strokeLinecap="round"
        />

        {/* Flaming Torch (Red Outer Flame, Yellow Inner Core) */}
        <path
          d="M50 18 C46 25 43 32 45 38 C47 44 53 44 55 38 C57 32 54 25 50 18 Z"
          fill="#dc2626"
        />
        <path
          d="M50 24 C48 28 47 33 48 36 C49 39 51 39 52 36 C53 33 52 28 50 24 Z"
          fill="#facc15"
        />

        {/* Base Weapon Pedestal */}
        <rect x="42" y="66" width="16" height="4" rx="2" fill="#0f172a" />

        {/* IPSI Text underneath */}
        <text
          x="50"
          y="88"
          textAnchor="middle"
          fill="#0f172a"
          fontSize="11"
          fontWeight="900"
          fontFamily="system-ui, sans-serif"
          letterSpacing="1.5"
        >
          IPSI
        </text>
      </svg>
    </div>
  );
};

// Official Indonesian Merah Putih waving flag badge
const IndonesiaFlagWaving = ({ className = "w-9 h-6 sm:w-11 sm:h-7" }: { className?: string }) => (
  <svg viewBox="0 0 48 32" className={`${className} drop-shadow-xs shrink-0 select-none`} fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M2 5 C 14 2, 22 9, 34 5 C 40 3, 44 4, 46 6 L 46 17 C 44 15, 40 14, 34 16 C 22 20, 14 13, 2 16 Z" fill="#e11d48" />
    <path d="M2 16 C 14 13, 22 20, 34 16 C 40 14, 44 15, 46 17 L 46 28 C 44 26, 40 25, 34 27 C 22 31, 14 24, 2 27 Z" fill="#ffffff" stroke="#cbd5e1" strokeWidth="0.5" />
    <path d="M2 3 L 2 30" stroke="#94a3b8" strokeWidth="2.5" strokeLinecap="round" />
  </svg>
);

// Official Indonesian Merah Putih rectangular badge
const IndonesiaFlagBadge = ({ className = "w-8 h-5 sm:w-10 sm:h-6" }: { className?: string }) => (
  <div className={`${className} rounded overflow-hidden shadow-xs border border-white/60 shrink-0 flex flex-col select-none`}>
    <div className="w-full h-1/2 bg-[#d5001c]" />
    <div className="w-full h-1/2 bg-[#ffffff]" />
  </div>
);

// Silat Tournament Official Championship Logo (Flying side kick with Indonesian ribbon swooshes)
const SilatTournamentLogo = ({ className = "w-16 h-16 sm:w-20 sm:h-20" }: { className?: string }) => (
  <div className={`${className} flex items-center justify-center p-1 drop-shadow-md shrink-0 select-none`}>
    <svg viewBox="0 0 100 100" className="w-full h-full" fill="none" xmlns="http://www.w3.org/2000/svg">
      {/* Cyan/Blue circular speed arc */}
      <path
        d="M 16 50 C 16 24, 42 10, 75 14 C 88 16, 94 24, 88 32 C 82 39, 74 38, 64 32 C 45 22, 28 34, 28 50 C 28 66, 45 78, 64 68 C 74 62, 82 61, 88 68 C 94 76, 88 84, 75 86 C 42 90, 16 76, 16 50 Z"
        fill="#0091ff"
      />
      {/* Indonesian Merah Putih and Gold Ribbon Swooshes */}
      <path
        d="M 48 83 C 64 83, 85 79, 93 70 C 89 74, 76 80, 58 80 Z"
        fill="#d5001c"
      />
      <path
        d="M 52 86 C 68 86, 89 82, 96 73 C 92 77, 79 83, 62 83 Z"
        fill="#ffffff"
      />
      <path
        d="M 56 89 C 72 89, 93 85, 98 76 C 94 80, 83 86, 66 86 Z"
        fill="#ffd200"
      />
      {/* White Silat Fighter Silhouette executing flying side kick */}
      <circle cx="56" cy="33" r="5.5" fill="#ffffff" />
      <path d="M 50 39 L 64 42 L 58 54 L 46 50 Z" fill="#ffffff" />
      <path d="M 64 42 L 78 37 L 85 35 L 83 40 L 74 44 Z" fill="#ffffff" />
      <path d="M 50 39 L 41 43 L 37 47 L 41 49 L 47 45 Z" fill="#ffffff" />
      <path d="M 58 54 L 72 49 L 93 41 L 96 46 L 76 56 L 62 57 Z" fill="#ffffff" />
      <path d="M 46 50 L 37 56 L 35 68 L 41 68 L 43 60 L 50 54 Z" fill="#ffffff" />
    </svg>
  </div>
);

// Boxing Gloves Icon for Judge Punch row
const BoxingGlovesIcon = ({ className = "w-7 h-7" }: { className?: string }) => (
  <svg viewBox="0 0 44 32" className={`${className} select-none drop-shadow-xs`} fill="none" xmlns="http://www.w3.org/2000/svg">
    {/* Left Glove */}
    <g transform="translate(3, 2)">
      <rect x="1" y="14" width="9" height="7" rx="2" fill="#00e5ff" stroke="#ffffff" strokeWidth="1" />
      <path d="M 3 14 C 3 6, 7 2, 13 2 C 18 2, 20 6, 20 12 L 20 15 C 20 18, 17 20, 13 20 L 6 20 C 3 20, 3 16, 3 14 Z" fill="#00e5ff" stroke="#ffffff" strokeWidth="1" />
      <path d="M 13 6 C 15 6, 16 8, 16 11" stroke="#ffffff" strokeWidth="1.2" strokeLinecap="round" />
    </g>
    {/* Right Glove */}
    <g transform="translate(21, 2) scale(-1, 1) translate(-22, 0)">
      <rect x="1" y="14" width="9" height="7" rx="2" fill="#00e5ff" stroke="#ffffff" strokeWidth="1" />
      <path d="M 3 14 C 3 6, 7 2, 13 2 C 18 2, 20 6, 20 12 L 20 15 C 20 18, 17 20, 13 20 L 6 20 C 3 20, 3 16, 3 14 Z" fill="#00e5ff" stroke="#ffffff" strokeWidth="1" />
      <path d="M 13 6 C 15 6, 16 8, 16 11" stroke="#ffffff" strokeWidth="1.2" strokeLinecap="round" />
    </g>
  </svg>
);

// Athlete User Profile Avatar with soft glowing silhouette
const UserAvatarSilhouette = ({ className = "w-11 h-13 sm:w-13 sm:h-15" }: { className?: string }) => (
  <svg viewBox="0 0 60 70" className={`${className} drop-shadow-md select-none`} fill="none" xmlns="http://www.w3.org/2000/svg">
    <defs>
      <linearGradient id="userAvatarGlow" x1="0%" y1="0%" x2="0%" y2="100%">
        <stop offset="0%" stopColor="#ffffff" stopOpacity="0.95" />
        <stop offset="45%" stopColor="#cde4ff" stopOpacity="0.9" />
        <stop offset="100%" stopColor="#7db4f5" stopOpacity="0.85" />
      </linearGradient>
    </defs>
    <circle cx="30" cy="22" r="13" fill="url(#userAvatarGlow)" />
    <path d="M 8 62 C 8 44, 18 42, 30 42 C 42 42, 52 44, 52 62 Z" fill="url(#userAvatarGlow)" />
  </svg>
);

export default function MonitorPanel({
  state,
  histories = [],
  dispatch,
  onBack,
  theme,
  onToggleTheme,
  onResetScores,
  onSelectBabak,
  serverPenaltyConfig
}: MonitorPanelProps) {
  // Theme Palette Hook
  const { paletteId, palette, allPalettes, changePalette, isDark } = useThemePalette();
  const [modalTab, setModalTab] = useState<'theme' | 'icons' | 'verification'>('theme');
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [dismissedVerificationTimestamp, setDismissedVerificationTimestamp] = useState<number>(0);
  const [previewVerificationResult, setPreviewVerificationResult] = useState<any>(null);
  const [showAnalyticsModal, setShowAnalyticsModal] = useState<boolean>(false);

  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!(document.fullscreenElement || (document as any).webkitFullscreenElement));
    };
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    document.addEventListener('webkitfullscreenchange', handleFullscreenChange);
    return () => {
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
      document.removeEventListener('webkitfullscreenchange', handleFullscreenChange);
    };
  }, []);

  const toggleFullscreen = () => {
    playBeep('click');
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen?.().catch(() => {});
    } else {
      document.exitFullscreen?.().catch(() => {});
    }
  };

  // Dynamic theme colors matching the uploaded tournament layout
  const themeColors = useMemo(() => {
    const isLight = paletteId === 'default_light';
    const isHighContrast = paletteId === 'high_contrast';
    
    if (isLight) {
      return {
        bg: '#f1f5f9',
        cardBg: '#ffffff',
        borderColor: '#0284c7',
        text: '#0f172a',
        subtleText: '#475569',
        dividerBg: '#e2e8f0',
        topGlowColor: '#93c5fd',
        waveColor1: '#38bdf8',
        waveColor2: '#0284c7',
        yellowPillBg: '#ffd200',
        yellowPillText: '#000000',
        blueCardBg: '#004bbd',
        blueScoreBg: '#0070ea',
        redCardBg: '#b50016',
        redScoreBg: '#d5001c',
        gelanggangColor: '#d97706'
      };
    }

    if (isHighContrast) {
      return {
        bg: '#000000',
        cardBg: '#0a0a0a',
        borderColor: '#facc15',
        text: '#ffffff',
        subtleText: '#d4d4d8',
        dividerBg: '#18181b',
        topGlowColor: '#facc1533',
        waveColor1: '#facc15',
        waveColor2: '#eab308',
        yellowPillBg: '#ffd200',
        yellowPillText: '#000000',
        blueCardBg: '#004bbd',
        blueScoreBg: '#0070ea',
        redCardBg: '#b50016',
        redScoreBg: '#d5001c',
        gelanggangColor: '#ffd200'
      };
    }

    // Default & Official Championship Theme (Matches the uploaded reference image)
    return {
      bg: '#03102c',
      cardBg: '#02132e',
      borderColor: '#0091ff',
      text: '#ffffff',
      subtleText: '#94a3b8',
      dividerBg: '#071d3d',
      topGlowColor: '#0a3580',
      waveColor1: '#0052cc',
      waveColor2: '#0091ff',
      yellowPillBg: '#ffd200',
      yellowPillText: '#000000',
      blueCardBg: '#004bbd',
      blueScoreBg: '#0070ea',
      redCardBg: '#b50016',
      redScoreBg: '#d5001c',
      gelanggangColor: '#ffd200'
    };
  }, [paletteId]);

  // Configurable Penalty Icons state
  const [penaltyConfig, setPenaltyConfig] = useState<PenaltyIconConfig>(() => {
    if (serverPenaltyConfig) return serverPenaltyConfig;
    try {
      const saved = localStorage.getItem('silat_penalty_icons_config');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed && parsed.slot1) {
          return parsed;
        }
      }
    } catch (e) {
      console.error(e);
    }
    return DEFAULT_PENALTY_ICONS;
  });

  // Modal State for Changing Penalty Icons & Themes
  const [isIconModalOpen, setIsIconModalOpen] = useState(false);
  const [editingSlot, setEditingSlot] = useState<keyof PenaltyIconConfig | null>(null);

  // Sync when server config prop updates
  useEffect(() => {
    if (serverPenaltyConfig) {
      setPenaltyConfig(serverPenaltyConfig);
    }
  }, [serverPenaltyConfig]);

  // Sync from server endpoint on mount & listen to real-time events / broadcast across tabs
  useEffect(() => {
    fetch('/api/admin/penalty-icons')
      .then(res => res.json())
      .then(data => {
        if (data.success && data.penaltyIcons) {
          setPenaltyConfig(data.penaltyIcons);
          try {
            localStorage.setItem('silat_penalty_icons_config', JSON.stringify(data.penaltyIcons));
          } catch (e) {}
        }
      })
      .catch(() => {});

    const handleCustomUpdate = (e: any) => {
      if (e.detail) {
        setPenaltyConfig(e.detail);
      }
    };
    window.addEventListener('silat_penalty_icons_updated', handleCustomUpdate);

    const handleStorage = (e: StorageEvent) => {
      if (e.key === 'silat_penalty_icons_config' && e.newValue) {
        try {
          setPenaltyConfig(JSON.parse(e.newValue));
        } catch (err) {}
      }
    };
    window.addEventListener('storage', handleStorage);

    let bc: BroadcastChannel | null = null;
    if (typeof BroadcastChannel !== 'undefined') {
      try {
        bc = new BroadcastChannel('silat_penalty_icons');
        bc.onmessage = (ev) => {
          if (ev.data) {
            setPenaltyConfig(ev.data);
          }
        };
      } catch (err) {}
    }

    return () => {
      window.removeEventListener('silat_penalty_icons_updated', handleCustomUpdate);
      window.removeEventListener('storage', handleStorage);
      if (bc) bc.close();
    };
  }, []);

  const savePenaltyConfig = (newConfig: PenaltyIconConfig) => {
    setPenaltyConfig(newConfig);
    try {
      localStorage.setItem('silat_penalty_icons_config', JSON.stringify(newConfig));
      window.dispatchEvent(new CustomEvent('silat_penalty_icons_updated', { detail: newConfig }));
      if (typeof BroadcastChannel !== 'undefined') {
        const bc = new BroadcastChannel('silat_penalty_icons');
        bc.postMessage(newConfig);
        bc.close();
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleSelectPreset = (preset: PenaltyIconConfig) => {
    playBeep('click');
    savePenaltyConfig(preset);
  };

  const handleSelectIconForSlot = (slot: keyof PenaltyIconConfig, iconType: PenaltyIconType | string) => {
    playBeep('click');
    const updated = { ...penaltyConfig, [slot]: iconType };
    savePenaltyConfig(updated);
    setEditingSlot(null);
  };

  const [isPhotoUploaderOpen, setIsPhotoUploaderOpen] = useState(false);
  const [photoUploaderTargetSlot, setPhotoUploaderTargetSlot] = useState<keyof PenaltyIconConfig>('slot1');

  const handleOpenPhotoUploader = (slot: keyof PenaltyIconConfig) => {
    setPhotoUploaderTargetSlot(slot);
    setIsPhotoUploaderOpen(true);
  };

  const handleApplyUploadedPhoto = (slot: keyof PenaltyIconConfig, transparentDataUrl: string) => {
    playBeep('valid');
    const updated = {
      ...penaltyConfig,
      [slot]: transparentDataUrl,
      customImages: {
        ...(penaltyConfig.customImages || {}),
        [slot]: transparentDataUrl
      }
    };
    savePenaltyConfig(updated);
    setEditingSlot(null);
  };

  const handleUploadSlotPng = async (slot: keyof PenaltyIconConfig, file: File) => {
    if (!file) return;
    try {
      playBeep('click');
      // Automatically clean background on direct upload
      const optimized = await optimizePenaltyPng(file, 220, { mode: 'auto-light', tolerance: 35 });
      const updated = {
        ...penaltyConfig,
        [slot]: optimized,
        customImages: {
          ...(penaltyConfig.customImages || {}),
          [slot]: optimized
        }
      };
      savePenaltyConfig(updated);
      setEditingSlot(null);
    } catch (e) {
      console.error(e);
    }
  };

  const handleRemoveSlotPng = (slot: keyof PenaltyIconConfig) => {
    playBeep('click');
    const defaultIcon = DEFAULT_PENALTY_ICONS[slot];
    const updatedCustom = { ...(penaltyConfig.customImages || {}) };
    delete updatedCustom[slot];
    const updated = {
      ...penaltyConfig,
      [slot]: defaultIcon,
      customImages: updatedCustom
    };
    savePenaltyConfig(updated);
    setEditingSlot(null);
  };

  const handleTogglePenalty = (corner: 'biru' | 'merah', type: string) => {
    if (!dispatch) return;
    playBeep('click');
    dispatch('TOGGLE_DEWAN_PENALTY', { corner, penaltyType: type });
  };

  const [matchToast, setMatchToast] = useState<{
    show: boolean;
    winner: 'merah' | 'biru' | 'seri';
    winnerName: string;
    kontingen: string;
    partai: string | number;
    scoreMerah: number;
    scoreBiru: number;
    isSpeaking?: boolean;
  } | null>(null);

  const prevStatusRef = useRef(state.matchStatus);

  // Victory Announcement triggers automatically when match ends
  useEffect(() => {
    if (state.matchStatus === 'selesai' && prevStatusRef.current !== 'selesai') {
      const winnerName = state.winner === 'biru' 
        ? state.atletBiru.nama 
        : state.winner === 'merah' 
        ? state.atletMerah.nama 
        : 'Pertandingan Seri';
      
      const kontingen = state.winner === 'biru'
        ? state.atletBiru.kontingen
        : state.winner === 'merah'
        ? state.atletMerah.kontingen
        : '';

      playBeep('victory');

      setMatchToast({
        show: true,
        winner: state.winner || 'seri',
        winnerName,
        kontingen,
        partai: state.partai,
        scoreMerah: state.scores.merah.total,
        scoreBiru: state.scores.biru.total,
        isSpeaking: true
      });

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
    } else if (state.matchStatus !== 'selesai' && prevStatusRef.current === 'selesai') {
      setMatchToast(null);
      if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
        window.speechSynthesis.cancel();
      }
    }

    prevStatusRef.current = state.matchStatus;
  }, [state.matchStatus, state.winner, state.partai, state.kelas, state.scores.merah.total, state.scores.biru.total, state.atletBiru.nama, state.atletBiru.kontingen, state.atletMerah.nama, state.atletMerah.kontingen]);

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

  // Gelanggang, Round & Category clean formatted labels
  const eventTitle = state.namaEvent || "AMPANA OPEN CHAMPIONSHIP 2026";
  const rawGelanggang = (state.gelanggang || '1').toString().trim();
  const cleanGelanggang = rawGelanggang.replace(/^gelanggang\s*/i, '').trim() || '1';
  const gelanggangLabel = `GELANGGANG ${cleanGelanggang.toUpperCase()}`;

  const currentBabakRoman = state.currentBabak === 1 ? 'I' : state.currentBabak === 2 ? 'II' : 'III';
  const babakNama = (state as any).babakNama || `IPSI BESAR (PENYISIHAN)`;

  const rawKelas = (state.kelas || 'KELAS D ( -30 - 42 KG) - PRA REMAJA (PUTRA)').toString().trim();
  const kelasLabel = rawKelas;

  // Nomor Partai clean formatted labels & quick edit state
  const rawPartai = (state.partai || '01').toString().trim();
  const cleanPartaiNum = rawPartai.replace(/^partai\s*[-–—:]*\s*/i, '').trim() || '01';
  const partaiLabel = `PARTAI ${cleanPartaiNum}`;

  const [editingPartaiModal, setEditingPartaiModal] = useState(false);
  const [newPartaiInput, setNewPartaiInput] = useState(cleanPartaiNum);

  useEffect(() => {
    setNewPartaiInput(cleanPartaiNum);
  }, [cleanPartaiNum]);

  const atletBiruNama = state.atletBiru?.nama || "SUDUT BIRU";
  const atletBiruKontingen = state.atletBiru?.kontingen || "KONTINGEN BIRU";
  const atletMerahNama = state.atletMerah?.nama || "SUDUT MERAH";
  const atletMerahKontingen = state.atletMerah?.kontingen || "KONTINGEN MERAH";

  const skorBiru = state.scores?.biru?.total ?? 0;
  const skorMerah = state.scores?.merah?.total ?? 0;

  // Score transition animation effects
  const prevBlueScoreRef = useRef(skorBiru);
  const prevRedScoreRef = useRef(skorMerah);
  const prevBabakRef = useRef(state.currentBabak || 1);

  const [blueScoreAnim, setBlueScoreAnim] = useState<{
    active: boolean;
    delta: number;
    key: number;
  }>({ active: false, delta: 0, key: 0 });

  const [redScoreAnim, setRedScoreAnim] = useState<{
    active: boolean;
    delta: number;
    key: number;
  }>({ active: false, delta: 0, key: 0 });

  // Synchronize score refs when babak changes or match is reset/idle
  useEffect(() => {
    if (
      state.currentBabak !== prevBabakRef.current ||
      state.matchStatus === 'idle' ||
      state.matchStatus === 'selesai'
    ) {
      prevBabakRef.current = state.currentBabak;
      prevBlueScoreRef.current = skorBiru;
      prevRedScoreRef.current = skorMerah;
      setBlueScoreAnim({ active: false, delta: 0, key: 0 });
      setRedScoreAnim({ active: false, delta: 0, key: 0 });
      return;
    }

    if (skorBiru > prevBlueScoreRef.current) {
      const delta = skorBiru - prevBlueScoreRef.current;
      setBlueScoreAnim({ active: true, delta, key: Date.now() });
      try { playBeep('valid'); } catch { /* ignore */ }
      const timer = setTimeout(() => {
        setBlueScoreAnim(prev => ({ ...prev, active: false }));
      }, 1600);
      prevBlueScoreRef.current = skorBiru;
      return () => clearTimeout(timer);
    }
    prevBlueScoreRef.current = skorBiru;
  }, [skorBiru, state.currentBabak, state.matchStatus]);

  useEffect(() => {
    if (
      state.currentBabak !== prevBabakRef.current ||
      state.matchStatus === 'idle' ||
      state.matchStatus === 'selesai'
    ) {
      prevRedScoreRef.current = skorMerah;
      return;
    }

    if (skorMerah > prevRedScoreRef.current) {
      const delta = skorMerah - prevRedScoreRef.current;
      setRedScoreAnim({ active: true, delta, key: Date.now() });
      try { playBeep('valid'); } catch { /* ignore */ }
      const timer = setTimeout(() => {
        setRedScoreAnim(prev => ({ ...prev, active: false }));
      }, 1600);
      prevRedScoreRef.current = skorMerah;
      return () => clearTimeout(timer);
    }
    prevRedScoreRef.current = skorMerah;
  }, [skorMerah, state.currentBabak, state.matchStatus]);

  // Periodic refresh ticker while recent hits exist to ensure active hit badges unlight after 2.5s
  const [activeHitsTick, setActiveHitsTick] = useState(0);
  useEffect(() => {
    const hasRecent = (state.juriHits || []).some(h => (Date.now() - h.timestamp) < 3000);
    if (!hasRecent) return;
    const interval = setInterval(() => {
      setActiveHitsTick(t => t + 1);
    }, 250);
    return () => clearInterval(interval);
  }, [state.juriHits, activeHitsTick]);

  const jatuhanBiru = (state as any).jatuhanCount?.biru ?? Math.floor((state.directPoints?.biru || 0) / 3);
  const jatuhanMerah = (state as any).jatuhanCount?.merah ?? Math.floor((state.directPoints?.merah || 0) / 3);

  // Digital clock display: formatted MM:SS for match timer
  const sec = (state.timerSeconds !== undefined && state.timerSeconds !== null) ? state.timerSeconds : (state.selectedWaktu || 120);
  const timerDisplay = formatTimer(sec);

  // Shortcut Tombol SPASI untuk Mulai / Jeda Timer Tanding
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
          dispatch('TOGGLE_TIMER');
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [dispatch]);

  const v = state.verification;

  // Active penalties from Dewan Juri
  const bluePen = state.dewanPenalties?.biru || {
    binaan1: false, binaan2: false, teguran1: false, teguran2: false, peringatan1: false, peringatan2: false, disqualified: false
  };
  const redPen = state.dewanPenalties?.merah || {
    binaan1: false, binaan2: false, teguran1: false, teguran2: false, peringatan1: false, peringatan2: false, disqualified: false
  };

  // Helper to render live/recent hit in Juri box (Row 1 = Punch, Row 2 = Kick)
  const getJuriHitDisplay = (corner: 'biru' | 'merah', juriId: 1 | 2 | 3, aksi: 'punch' | 'kick') => {
    const now = Date.now();
    const currentB = state.currentBabak || 1;
    // Find latest hit for this corner, jury, and action in the current babak
    const recentHit = [...(state.juriHits || [])].reverse().find(
      h => h.juriId === juriId && h.sudut === corner && h.aksi === aksi && h.babak === currentB && (now - h.timestamp) < 2500
    );

    if (recentHit) {
      const isPunch = aksi === 'punch';
      return (
        <div className={`jury-hit-active ${corner === 'biru' ? 'jury-hit-blue' : 'jury-hit-red'}`}>
          <span className="jury-hit-pts">{isPunch ? '+1' : '+2'}</span>
          {recentHit.isMatched && (
            <span className="jury-hit-sah">SAH</span>
          )}
        </div>
      );
    }

    // Total registered hits for this judge and action in the current round
    const hitCount = (state.juriHits || []).filter(
      h => h.juriId === juriId && h.sudut === corner && h.aksi === aksi && h.babak === currentB
    ).length;

    return (
      <span className={`jury-score-count ${hitCount > 0 ? (corner === 'biru' ? 'text-[#00e5ff]' : 'text-[#ff6b7a]') : 'text-white/40'}`}>
        {hitCount}
      </span>
    );
  };

  // "Hanya menampilkan hasil voting dari verifikasi"
  // Overlay only appears when an actual voting result has been computed (all 3 voted or recent saved result)
  // It NEVER appears during the waiting/in-progress voting phase.
  const hasActiveResult = Boolean(
    v?.active &&
    v?.result &&
    v.votes?.juri1 &&
    v.votes?.juri2 &&
    v.votes?.juri3
  );

  const lastRes = state.lastVerificationResult;
  const hasRecentCompletedResult = Boolean(
    lastRes &&
    lastRes.result &&
    lastRes.timestamp &&
    lastRes.timestamp > dismissedVerificationTimestamp &&
    Date.now() - lastRes.timestamp < 15000
  );

  const isVerificationResultVisible = Boolean(
    previewVerificationResult || hasActiveResult || hasRecentCompletedResult
  );

  return (
    <div className="scoreboard-container select-none">
      {/* Stadium Ring Glow Decorations */}
      <div className="bg-decoration-left" />
      <div className="bg-decoration-left-inner" />
      <div className="bg-decoration-right" />
      <div className="bg-decoration-right-inner" />

      {/* Embedded CSS matching modern professional stadium videotron display */}
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800;900&family=Oswald:wght@500;600;700&family=JetBrains+Mono:wght@700;800&display=swap');

        .scoreboard-container {
          width: 100vw;
          height: 100vh;
          max-width: 100%;
          max-height: 100%;
          background: radial-gradient(circle at 50% 15%, #051438 0%, #02091d 60%, #01040f 100%);
          position: relative;
          display: flex;
          flex-direction: column;
          overflow: hidden;
          font-family: 'Plus Jakarta Sans', system-ui, -apple-system, sans-serif;
          color: white;
          box-shadow: inset 0 0 80px rgba(0, 0, 0, 0.85);
        }

        /* Modern subtle grid canvas texture */
        .scoreboard-container::before {
          content: '';
          position: absolute;
          inset: 0;
          background-image: 
            radial-gradient(circle at 50% 0%, rgba(59, 130, 246, 0.12) 0%, transparent 60%),
            linear-gradient(to right, rgba(255, 255, 255, 0.02) 1px, transparent 1px),
            linear-gradient(to bottom, rgba(255, 255, 255, 0.02) 1px, transparent 1px);
          background-size: 100% 100%, 36px 36px, 36px 36px;
          pointer-events: none;
          z-index: 1;
        }

        /* Refined stadium geometric light arcs */
        .bg-decoration-left {
          position: absolute;
          bottom: -180px;
          left: -120px;
          width: 520px;
          height: 520px;
          border-radius: 50%;
          border: 1.5px solid rgba(0, 180, 255, 0.22);
          background: radial-gradient(circle, rgba(0, 140, 255, 0.08) 0%, transparent 70%);
          box-shadow: 0 0 60px rgba(0, 140, 255, 0.25);
          z-index: 1;
          pointer-events: none;
        }

        .bg-decoration-left-inner {
          position: absolute;
          bottom: -130px;
          left: -80px;
          width: 380px;
          height: 380px;
          border-radius: 50%;
          border: 1px dashed rgba(56, 189, 248, 0.28);
          z-index: 1;
          pointer-events: none;
        }

        .bg-decoration-right {
          position: absolute;
          bottom: -220px;
          right: -160px;
          width: 650px;
          height: 650px;
          border-radius: 50%;
          border: 1.5px solid rgba(239, 68, 68, 0.2);
          background: radial-gradient(circle, rgba(220, 38, 38, 0.07) 0%, transparent 70%);
          box-shadow: 0 0 60px rgba(220, 38, 38, 0.2);
          z-index: 1;
          pointer-events: none;
        }

        .bg-decoration-right-inner {
          position: absolute;
          bottom: -170px;
          right: -110px;
          width: 480px;
          height: 480px;
          border-radius: 50%;
          border: 1px dashed rgba(248, 113, 113, 0.25);
          z-index: 1;
          pointer-events: none;
        }

        .content-wrapper {
          position: relative;
          z-index: 10;
          display: flex;
          flex-direction: column;
          height: 100%;
          padding: 0.75rem 1.4rem;
          box-sizing: border-box;
          gap: 0.65rem;
        }

        /* 1. HEADER (Broadcast Title Bar) */
        .header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 0.5rem 1rem;
          background: rgba(10, 22, 54, 0.65);
          backdrop-filter: blur(14px);
          -webkit-backdrop-filter: blur(14px);
          border: 1px solid rgba(255, 255, 255, 0.1);
          border-radius: 16px;
          box-shadow: 0 4px 20px rgba(0, 0, 0, 0.4), inset 0 1px 0 rgba(255, 255, 255, 0.12);
          position: relative;
        }

        .header-text {
          text-align: center;
          flex-grow: 1;
          padding: 0 1rem;
        }

        .logo-box {
          width: 64px;
          height: 64px;
          background: linear-gradient(135deg, rgba(255, 255, 255, 0.12) 0%, rgba(255, 255, 255, 0.03) 100%);
          border-radius: 14px;
          display: flex;
          justify-content: center;
          align-items: center;
          border: 1px solid rgba(255, 255, 255, 0.2);
          box-shadow: 0 4px 15px rgba(0, 0, 0, 0.35), inset 0 1px 0 rgba(255, 255, 255, 0.25);
          overflow: hidden;
          cursor: pointer;
          transition: all 0.25s cubic-bezier(0.16, 1, 0.3, 1);
          flex-shrink: 0;
        }
        .logo-box:hover {
          transform: translateY(-2px) scale(1.04);
          border-color: rgba(255, 255, 255, 0.5);
          box-shadow: 0 8px 24px rgba(0, 0, 0, 0.5), 0 0 15px rgba(56, 189, 248, 0.4);
        }

        /* 2. INFO BAR (Athlete Cards & High-Tech Timer Box) */
        .info-bar {
          display: flex;
          justify-content: space-between;
          align-items: stretch;
          gap: 0.75rem;
          min-height: 68px;
        }

        .player-info {
          flex: 1;
          display: flex;
          align-items: center;
          border-radius: 16px;
          padding: 0.4rem 0.6rem;
          overflow: hidden;
          position: relative;
          box-shadow: 0 8px 24px rgba(0, 0, 0, 0.45);
          transition: all 0.25s ease;
        }

        .player-info.blue {
          background: linear-gradient(135deg, rgba(2, 36, 107, 0.9) 0%, rgba(10, 75, 185, 0.8) 55%, rgba(6, 26, 75, 0.95) 100%);
          border: 1.5px solid rgba(56, 189, 248, 0.55);
          box-shadow: 0 8px 25px rgba(0, 0, 0, 0.5), inset 0 1px 0 rgba(255, 255, 255, 0.2), 0 0 20px rgba(14, 165, 233, 0.2);
        }

        .player-info.red {
          background: linear-gradient(225deg, rgba(130, 10, 24, 0.9) 0%, rgba(195, 22, 42, 0.8) 55%, rgba(90, 8, 18, 0.95) 100%);
          border: 1.5px solid rgba(248, 113, 113, 0.55);
          flex-direction: row-reverse;
          box-shadow: 0 8px 25px rgba(0, 0, 0, 0.5), inset 0 1px 0 rgba(255, 255, 255, 0.2), 0 0 20px rgba(239, 68, 68, 0.2);
        }

        .avatar-box {
          width: 52px;
          height: 52px;
          background: rgba(255, 255, 255, 0.12);
          backdrop-filter: blur(6px);
          display: flex;
          justify-content: center;
          align-items: center;
          border-radius: 12px;
          border: 1px solid rgba(255, 255, 255, 0.2);
          flex-shrink: 0;
          box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.3);
        }

        .name-details {
          flex: 1;
          display: flex;
          flex-direction: column;
          justify-content: center;
          padding: 0 0.85rem;
          overflow: hidden;
        }

        .player-info.red .name-details {
          align-items: flex-end;
          text-align: right;
        }

        .flag-box {
          display: flex;
          justify-content: center;
          align-items: center;
          padding: 0 0.4rem;
          flex-shrink: 0;
        }

        .flag {
          width: 36px;
          height: 23px;
          background: white;
          border: 1px solid rgba(255, 255, 255, 0.6);
          position: relative;
          border-radius: 4px;
          overflow: hidden;
          box-shadow: 0 3px 8px rgba(0,0,0,0.4);
        }
        .flag::before {
          content: '';
          position: absolute;
          top: 0;
          left: 0;
          width: 100%;
          height: 50%;
          background: #e11d48;
        }

        .timer-box {
          min-width: 260px;
          background: linear-gradient(180deg, #040e2b 0%, #020718 100%) !important;
          border: 1.5px solid rgba(245, 158, 11, 0.45) !important;
          border-radius: 16px;
          padding: 0.35rem 1rem;
          display: flex;
          flex-direction: column;
          justify-content: center;
          align-items: center;
          box-shadow: 0 10px 30px rgba(0, 0, 0, 0.65), inset 0 1px 0 rgba(255, 255, 255, 0.15), 0 0 25px rgba(245, 158, 11, 0.15);
          flex-shrink: 0;
          position: relative;
          overflow: hidden;
        }

        .timer-box::after {
          content: '';
          position: absolute;
          top: 0;
          left: 20%;
          right: 20%;
          height: 1px;
          background: linear-gradient(90deg, transparent, rgba(245, 158, 11, 0.8), transparent);
        }

        /* 3. MAIN SCORE AREA */
        .main-score-area {
          display: flex;
          flex: 1;
          gap: 0.75rem;
          min-height: 0;
          align-items: stretch;
        }

        .side-panel {
          width: 12.5%;
          display: flex;
          flex-direction: column;
          gap: 6px;
          flex-shrink: 0;
        }

        .jatuhan-box {
          background: linear-gradient(180deg, rgba(15, 28, 64, 0.85) 0%, rgba(8, 15, 38, 0.95) 100%);
          border: 1px solid rgba(255, 255, 255, 0.14);
          border-radius: 12px;
          padding: 6px 8px;
          text-align: center;
          box-shadow: 0 4px 14px rgba(0, 0, 0, 0.4), inset 0 1px 0 rgba(255, 255, 255, 0.1);
        }

        .penalty-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          grid-template-rows: repeat(3, 1fr);
          gap: 5px;
          flex: 1;
        }

        .penalty-slot {
          background: linear-gradient(135deg, rgba(16, 29, 64, 0.55) 0%, rgba(7, 14, 34, 0.75) 100%);
          border: 1px solid rgba(255, 255, 255, 0.12);
          border-radius: 10px;
          display: flex;
          justify-content: center;
          align-items: center;
          color: rgba(255,255,255,0.45);
          cursor: pointer;
          transition: all 0.2s cubic-bezier(0.16, 1, 0.3, 1);
          overflow: hidden;
          padding: 4px;
          position: relative;
          box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.08);
        }
        .penalty-slot:hover {
          background: rgba(30, 58, 115, 0.6);
          border-color: rgba(255, 255, 255, 0.3);
          transform: translateY(-1px) scale(1.02);
        }
        .penalty-slot img {
          max-width: 90%;
          max-height: 90%;
          object-fit: contain;
          transition: all 0.2s ease;
        }
        .penalty-slot:not(.active-yellow):not(.active-red) img {
          opacity: 0.5;
          filter: grayscale(35%) contrast(0.9);
        }
        .penalty-slot:not(.active-yellow):not(.active-red):hover img {
          opacity: 0.95;
          filter: grayscale(0%);
        }
        .penalty-slot.active-yellow {
          background: linear-gradient(135deg, #f59e0b 0%, #eab308 100%) !important;
          border-color: #fef08a !important;
          color: #0f172a !important;
          box-shadow: 0 0 20px rgba(245, 158, 11, 0.8), inset 0 1px 0 rgba(255, 255, 255, 0.6) !important;
          opacity: 1 !important;
        }
        .penalty-slot.active-yellow img {
          opacity: 1 !important;
          filter: drop-shadow(0 0 4px rgba(0,0,0,0.6)) !important;
          transform: scale(1.1);
        }
        .penalty-slot.active-red {
          background: linear-gradient(135deg, #dc2626 0%, #b91c1c 100%) !important;
          border-color: #fca5a5 !important;
          color: #fff !important;
          box-shadow: 0 0 20px rgba(220, 38, 38, 0.85), inset 0 1px 0 rgba(255, 255, 255, 0.5) !important;
          opacity: 1 !important;
        }
        .penalty-slot.active-red img {
          opacity: 1 !important;
          filter: drop-shadow(0 0 6px rgba(255,255,255,0.9)) !important;
          transform: scale(1.1);
        }

        /* MODERN BROADCAST SCORE CARDS */
        .score-card {
          flex: 1;
          border-radius: 20px;
          display: flex;
          justify-content: center;
          align-items: center;
          position: relative;
          overflow: hidden;
          transition: transform 0.3s cubic-bezier(0.34, 1.56, 0.64, 1), box-shadow 0.3s ease, border-color 0.3s ease;
        }

        .score-card.blue {
          background: radial-gradient(circle at 50% 25%, #024ebb 0%, #012b7a 50%, #00174a 100%);
          border: 2px solid rgba(56, 189, 248, 0.6);
          box-shadow: 0 14px 40px rgba(0, 0, 0, 0.7), inset 0 1px 0 rgba(255, 255, 255, 0.25), 0 0 35px rgba(2, 78, 187, 0.35);
        }

        .score-card.red {
          background: radial-gradient(circle at 50% 25%, #c81e2e 0%, #870f1a 50%, #52060e 100%);
          border: 2px solid rgba(248, 113, 113, 0.6);
          box-shadow: 0 14px 40px rgba(0, 0, 0, 0.7), inset 0 1px 0 rgba(255, 255, 255, 0.25), 0 0 35px rgba(200, 30, 46, 0.35);
        }

        /* Subtle sheen overlay on score cards */
        .score-card::before {
          content: '';
          position: absolute;
          inset: 0;
          background: linear-gradient(180deg, rgba(255, 255, 255, 0.12) 0%, transparent 40%, rgba(0, 0, 0, 0.3) 100%);
          pointer-events: none;
        }

        .score-card-pop-blue {
          animation: shockwaveBlue 1.6s ease-out;
          border-color: #38bdf8 !important;
        }

        .score-card-pop-red {
          animation: shockwaveRed 1.6s ease-out;
          border-color: #f87171 !important;
        }

        @keyframes shockwaveBlue {
          0% {
            transform: scale(1);
          }
          20% {
            transform: scale(1.025);
            border-color: #38bdf8;
            box-shadow: 0 0 65px rgba(56, 189, 248, 0.95), inset 0 0 45px rgba(56, 189, 248, 0.5);
          }
          50% {
            transform: scale(1.01);
            box-shadow: 0 0 40px rgba(56, 189, 248, 0.6);
          }
          100% {
            transform: scale(1);
          }
        }

        @keyframes shockwaveRed {
          0% {
            transform: scale(1);
          }
          20% {
            transform: scale(1.025);
            border-color: #f87171;
            box-shadow: 0 0 65px rgba(248, 113, 113, 0.95), inset 0 0 45px rgba(248, 113, 113, 0.5);
          }
          50% {
            transform: scale(1.01);
            box-shadow: 0 0 40px rgba(248, 113, 113, 0.6);
          }
          100% {
            transform: scale(1);
          }
        }

        .score-number {
          font-family: 'Oswald', sans-serif;
          font-variant-numeric: tabular-nums;
          font-size: 15vw;
          line-height: 0.9;
          font-weight: 700;
          letter-spacing: -0.02em;
          background: linear-gradient(180deg, #ffffff 0%, #e2e8f0 70%, #cbd5e1 100%);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          filter: drop-shadow(0 10px 18px rgba(0, 0, 0, 0.7));
          user-select: none;
          transition: transform 0.25s ease, filter 0.25s ease;
          display: inline-block;
          position: relative;
          z-index: 2;
        }

        .score-number-pop-blue {
          animation: scorePopBlue 1.6s cubic-bezier(0.2, 0.9, 0.3, 1.2);
        }

        .score-number-pop-red {
          animation: scorePopRed 1.6s cubic-bezier(0.2, 0.9, 0.3, 1.2);
        }

        @keyframes scorePopBlue {
          0% {
            transform: scale(1);
          }
          22% {
            transform: scale(1.18);
            filter: drop-shadow(0 0 40px #38bdf8) drop-shadow(0 0 65px rgba(14, 165, 233, 0.9));
          }
          50% {
            transform: scale(1.06);
            filter: drop-shadow(0 0 25px #38bdf8);
          }
          100% {
            transform: scale(1);
          }
        }

        @keyframes scorePopRed {
          0% {
            transform: scale(1);
          }
          22% {
            transform: scale(1.18);
            filter: drop-shadow(0 0 40px #f87171) drop-shadow(0 0 65px rgba(239, 68, 68, 0.9));
          }
          50% {
            transform: scale(1.06);
            filter: drop-shadow(0 0 25px #f87171);
          }
          100% {
            transform: scale(1);
          }
        }

        /* Point Notification Pill */
        .score-delta-badge {
          position: absolute;
          top: 15%;
          left: 50%;
          transform: translate(-50%, 0);
          z-index: 30;
          padding: 6px 18px;
          border-radius: 9999px;
          font-family: 'JetBrains Mono', monospace;
          font-variant-numeric: tabular-nums;
          font-size: 1.3vw;
          font-weight: 800;
          letter-spacing: 0.05em;
          text-transform: uppercase;
          pointer-events: none;
          white-space: nowrap;
          animation: floatUpFade 1.6s cubic-bezier(0.16, 1, 0.3, 1) forwards;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .score-delta-badge.blue {
          background: linear-gradient(135deg, #0284c7 0%, #0369a1 100%);
          color: #ffffff;
          border: 1.5px solid #7dd3fc;
          box-shadow: 0 0 25px rgba(56, 189, 248, 0.8), 0 4px 15px rgba(0, 0, 0, 0.6);
        }

        .score-delta-badge.red {
          background: linear-gradient(135deg, #e11d48 0%, #be123c 100%);
          color: #ffffff;
          border: 1.5px solid #fda4af;
          box-shadow: 0 0 25px rgba(244, 63, 94, 0.8), 0 4px 15px rgba(0, 0, 0, 0.6);
        }

        @keyframes floatUpFade {
          0% {
            opacity: 0;
            transform: translate(-50%, 15px) scale(0.8);
          }
          20% {
            opacity: 1;
            transform: translate(-50%, -4px) scale(1.1);
          }
          50% {
            opacity: 1;
            transform: translate(-50%, -12px) scale(1);
          }
          100% {
            opacity: 0;
            transform: translate(-50%, -28px) scale(0.95);
          }
        }

        /* Center Round Box */
        .round-box {
          width: 72px;
          display: flex;
          flex-direction: column;
          justify-content: center;
          align-items: center;
          gap: 10px;
          background: linear-gradient(180deg, rgba(8, 18, 44, 0.85) 0%, rgba(3, 8, 24, 0.95) 100%);
          border-radius: 16px;
          padding: 10px 0;
          border: 1px solid rgba(255, 255, 255, 0.15);
          box-shadow: 0 8px 24px rgba(0, 0, 0, 0.5), inset 0 1px 0 rgba(255, 255, 255, 0.1);
          flex-shrink: 0;
        }

        .round-indicator {
          width: 48px;
          height: 44px;
          background: rgba(255, 255, 255, 0.06);
          border-radius: 10px;
          display: flex;
          justify-content: center;
          align-items: center;
          font-family: 'Oswald', sans-serif;
          font-size: 1.35rem;
          font-weight: 700;
          color: rgba(255, 255, 255, 0.4);
          border: 1px solid rgba(255, 255, 255, 0.1);
          cursor: pointer;
          transition: all 0.2s cubic-bezier(0.16, 1, 0.3, 1);
          user-select: none;
        }
        .round-indicator:hover {
          background: rgba(255, 255, 255, 0.15);
          color: white;
          transform: scale(1.05);
        }
        .round-indicator.active {
          background: linear-gradient(135deg, #10b981 0%, #059669 100%);
          color: white;
          border-color: #6ee7b7;
          box-shadow: 0 0 20px rgba(16, 185, 129, 0.75), inset 0 1px 0 rgba(255, 255, 255, 0.4);
          transform: scale(1.06);
        }

        /* 4. BOTTOM TABLE (Judges Scores - High-Density Precision Grid) */
        .judges-table {
          width: 100%;
          background: linear-gradient(180deg, rgba(10, 22, 54, 0.85) 0%, rgba(4, 10, 28, 0.95) 100%);
          border-radius: 16px;
          border: 1px solid rgba(255, 255, 255, 0.15);
          overflow: hidden;
          display: flex;
          flex-direction: column;
          box-shadow: 0 10px 28px rgba(0, 0, 0, 0.55), inset 0 1px 0 rgba(255, 255, 255, 0.12);
          flex-shrink: 0;
        }

        .table-row {
          display: flex;
          align-items: stretch;
          border-bottom: 1px solid rgba(255, 255, 255, 0.07);
        }
        .table-row:last-child {
          border-bottom: none;
        }

        .table-cell {
          flex: 1;
          padding: 8px 10px;
          text-align: center;
          border-right: 1px solid rgba(255, 255, 255, 0.07);
          font-weight: 700;
          display: flex;
          align-items: center;
          justify-content: center;
          font-variant-numeric: tabular-nums;
        }
        .table-cell:last-child {
          border-right: none;
        }

        .table-header {
          background: linear-gradient(180deg, rgba(15, 32, 75, 0.8) 0%, rgba(8, 18, 45, 0.9) 100%);
          font-weight: 800;
          color: #94a3b8;
          font-size: 0.85rem;
          letter-spacing: 0.08em;
          text-transform: uppercase;
        }

        .score-val {
          font-family: 'JetBrains Mono', monospace;
          font-variant-numeric: tabular-nums;
          font-weight: 800;
          font-size: 1.25rem;
        }

        .score-val.blue-val {
          color: #38bdf8;
        }

        .score-val.red-val {
          color: #f87171;
        }

        /* Active jury hit inside bottom table */
        .jury-hit-active {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          gap: 6px;
          padding: 3px 12px;
          border-radius: 8px;
          animation: juryHitBounce 1.2s cubic-bezier(0.34, 1.56, 0.64, 1);
        }

        .jury-hit-blue {
          background: rgba(14, 165, 233, 0.3);
          color: #38bdf8;
          border: 1.5px solid #38bdf8;
          box-shadow: 0 0 20px rgba(56, 189, 248, 0.8);
        }

        .jury-hit-red {
          background: rgba(239, 68, 68, 0.3);
          color: #f87171;
          border: 1.5px solid #f87171;
          box-shadow: 0 0 20px rgba(248, 113, 113, 0.8);
        }

        .jury-hit-pts {
          font-family: 'JetBrains Mono', monospace;
          font-variant-numeric: tabular-nums;
          font-weight: 800;
          font-size: 1.3rem;
          line-height: 1;
        }

        .jury-hit-sah {
          font-size: 0.65rem;
          font-weight: 900;
          background: #10b981;
          color: #ffffff;
          padding: 2px 5px;
          border-radius: 4px;
          letter-spacing: 0.08em;
          box-shadow: 0 0 10px rgba(16, 185, 129, 0.8);
        }

        @keyframes juryHitBounce {
          0% {
            transform: scale(0.6);
            opacity: 0;
          }
          30% {
            transform: scale(1.2);
            opacity: 1;
          }
          60% {
            transform: scale(0.95);
          }
          100% {
            transform: scale(1);
            opacity: 1;
          }
        }

        .jury-score-count {
          font-family: 'JetBrains Mono', monospace;
          font-variant-numeric: tabular-nums;
          font-size: 1.3rem;
          font-weight: 800;
          user-select: none;
          transition: color 0.2s ease;
        }

        .top-controls {
          position: absolute;
          right: 14px;
          top: 12px;
          display: flex;
          align-items: center;
          gap: 6px;
          z-index: 50;
        }

        .ctrl-btn {
          background: rgba(15, 23, 42, 0.65);
          border: 1px solid rgba(255, 255, 255, 0.15);
          color: #cbd5e1;
          border-radius: 10px;
          padding: 6px 10px;
          font-size: 0.8rem;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: all 0.2s cubic-bezier(0.16, 1, 0.3, 1);
          backdrop-filter: blur(8px);
          -webkit-backdrop-filter: blur(8px);
        }
        .ctrl-btn:hover {
          background: rgba(30, 41, 59, 0.85);
          color: white;
          border-color: rgba(255, 255, 255, 0.3);
          transform: translateY(-1px);
        }
      `}</style>

      {/* Top right quick controls */}
      <div className="top-controls">
        <button
          onClick={() => {
            playBeep('click');
            setShowAnalyticsModal(true);
          }}
          className="ctrl-btn bg-cyan-950/70 hover:bg-cyan-900/90 text-cyan-300 border-cyan-500/40 hover:border-cyan-300 font-bold"
          title="Buka Analisis Statistik Serangan (Recharts)"
        >
          <BarChart3 size={13} className="text-cyan-400" />
          <span className="hidden sm:inline text-[11px] font-mono ml-1 font-bold">Statistik</span>
        </button>
        <button
          onClick={toggleFullscreen}
          className="ctrl-btn"
          title={isFullscreen ? "Keluar Layar Penuh" : "Layar Penuh"}
        >
          {isFullscreen ? <Minimize2 size={13} /> : <Maximize2 size={13} />}
        </button>
        {dispatch && (
          <button
            onClick={() => {
              playBeep('click');
              if (v?.active) {
                dispatch('DEWAN_VERIFY_RESOLVE');
              } else {
                dispatch('DEWAN_VERIFY_TRIGGER', { type: 'JATUHAN' });
              }
            }}
            className={`ctrl-btn ${v?.active ? 'bg-amber-500 text-slate-950 font-bold border-amber-300 animate-pulse' : ''}`}
            title={v?.active ? "Selesaikan Layar Verifikasi" : "Uji Layar Verifikasi (Jatuhan)"}
          >
            <Scale size={13} />
          </button>
        )}
        <button
          onClick={() => {
            playBeep('click');
            setIsIconModalOpen(true);
          }}
          className="ctrl-btn"
          title="Pengaturan Layar"
        >
          <Settings size={13} />
        </button>
        <button
          onClick={onBack}
          className="ctrl-btn"
          title="Kembali ke Menu"
        >
          <ArrowLeft size={13} />
        </button>
      </div>

      <div className="content-wrapper">
        {/* 1. HEADER */}
        {/* 1. HEADER (Broadcast Championship Banner) */}
        <div className="header">
          <div 
            className="logo-box"
            onClick={onBack}
            title="Kembali ke Menu Utama"
          >
            {state.logoKiri ? (
              <img src={state.logoKiri} alt="Logo" className="w-full h-full object-contain p-1" />
            ) : (
              <IpsiShieldBadge className="w-[85%] h-[85%]" />
            )}
          </div>

          <div className="header-text">
            <h3 className="text-[11px] md:text-xs font-bold tracking-[0.2em] text-cyan-300 uppercase m-0">
              KEJUARAAN NASIONAL PENCAK SILAT
            </h3>
            <h1 className="text-lg md:text-2xl lg:text-3xl font-black text-white tracking-wide uppercase drop-shadow-md my-0.5 font-sans">
              {eventTitle}
            </h1>
            <div className="flex items-center justify-center flex-wrap gap-2 md:gap-3 my-0.5 text-xs">
              <button
                type="button"
                onClick={() => dispatch && setEditingPartaiModal(true)} 
                style={{ cursor: dispatch ? 'pointer' : 'default' }}
                title={dispatch ? "Ubah Nomor Partai" : undefined}
                className="inline-flex items-center gap-1.5 px-3 py-0.5 rounded-lg bg-amber-500/20 hover:bg-amber-500/30 border border-amber-400/50 text-amber-300 shadow-[0_0_15px_rgba(245,158,11,0.2)] hover:border-amber-300 transition-all cursor-pointer font-sans"
              >
                <span className="text-[10px] md:text-xs font-bold uppercase tracking-wider text-amber-400">
                  NOMOR PARTAI:
                </span>
                <span className="text-xs md:text-sm font-black text-white font-mono tracking-wider">
                  {cleanPartaiNum}
                </span>
              </button>
              <span className="text-slate-600 font-bold">•</span>
              <span className="text-xs md:text-sm font-bold text-slate-200 uppercase tracking-wide">
                {kelasLabel}
              </span>
              <span className="text-slate-600 font-bold">•</span>
              <span className="text-xs md:text-sm font-extrabold text-cyan-300 uppercase tracking-wider">
                {babakNama}
              </span>
            </div>
          </div>

          <div 
            className="logo-box"
            onClick={() => setIsIconModalOpen(true)}
            title="Pengaturan Tampilan"
          >
            {state.logoKanan ? (
              <img src={state.logoKanan} alt="Logo" className="w-full h-full object-contain p-1" />
            ) : (
              <div className="flex flex-col items-center justify-center text-center leading-tight">
                <span className="text-amber-400 font-black text-[10px] tracking-wider uppercase">PENCAK</span>
                <span className="text-white font-black text-[12px] tracking-wider uppercase">SILAT</span>
              </div>
            )}
          </div>
        </div>

        {/* 2. INFO BAR (Names, Timer, Flags) */}
        <div className="info-bar">
          {/* Blue Corner Athlete */}
          <div className="player-info blue">
            <div className="avatar-box">
              <UserAvatarSilhouette className="w-8 h-8 text-sky-200" />
            </div>
            <div className="name-details">
              <div className="flex items-center gap-1.5">
                <span className="text-[10px] md:text-xs font-black tracking-widest text-sky-300 uppercase bg-sky-950/60 px-2 py-0.5 rounded border border-sky-400/30">
                  SUDUT BIRU
                </span>
                <span className="text-xs md:text-sm font-extrabold text-amber-300 tracking-wider uppercase drop-shadow-xs truncate">
                  {atletBiruKontingen}
                </span>
              </div>
              <span className="text-base md:text-xl lg:text-2xl font-black text-white tracking-wide uppercase drop-shadow-sm truncate mt-0.5">
                {atletBiruNama}
              </span>
            </div>
            <div className="flag-box">
              <div className="flag" />
            </div>
          </div>

          {/* Center Digital Precision Timer */}
          <div 
            onClick={() => {
              if (dispatch) {
                playBeep('click');
                dispatch('TOGGLE_TIMER');
              }
            }}
            title="Klik atau tekan Tombol Spasi (Space) untuk Mulai / Jeda Timer"
            className="timer-box cursor-pointer group hover:scale-[1.01] transition-transform select-none"
          >
            <div className="flex items-center justify-center gap-2 flex-wrap">
              <span className="text-[10px] md:text-xs font-extrabold text-slate-300 tracking-[0.15em] uppercase">
                {gelanggangLabel}
              </span>
              <span className="text-amber-400 font-bold text-xs">•</span>
              <button 
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  dispatch && setEditingPartaiModal(true);
                }}
                className="text-[10px] md:text-xs font-black text-amber-300 bg-amber-500/20 hover:bg-amber-500/35 px-2 py-0.5 rounded border border-amber-400/50 tracking-wider uppercase cursor-pointer transition-colors"
                title="Nomor Partai (Klik untuk ubah)"
              >
                PARTAI {cleanPartaiNum}
              </button>
              <span className="text-[9px] font-mono font-bold px-1.5 py-0.2 rounded bg-black/40 text-emerald-300 border border-emerald-500/30">
                SPASI
              </span>
            </div>
            <div className="text-2xl md:text-4xl lg:text-5xl font-black font-mono text-white tracking-widest drop-shadow-[0_2px_12px_rgba(255,255,255,0.4)] my-0.5 group-hover:text-emerald-300 transition-colors">
              {timerDisplay}
            </div>
            {v?.active && !v?.result && (
              <span className="text-[9px] font-mono font-bold text-amber-300 animate-pulse px-2.5 py-0.5 rounded-full bg-amber-500/20 border border-amber-400/40 mt-0.5">
                ⚖️ VERIFIKASI AKTIF
              </span>
            )}
          </div>

          {/* Red Corner Athlete */}
          <div className="player-info red">
            <div className="avatar-box">
              <UserAvatarSilhouette className="w-8 h-8 text-rose-200" />
            </div>
            <div className="name-details">
              <div className="flex items-center justify-end gap-1.5">
                <span className="text-xs md:text-sm font-extrabold text-amber-300 tracking-wider uppercase drop-shadow-xs truncate">
                  {atletMerahKontingen}
                </span>
                <span className="text-[10px] md:text-xs font-black tracking-widest text-rose-300 uppercase bg-rose-950/60 px-2 py-0.5 rounded border border-rose-400/30">
                  SUDUT MERAH
                </span>
              </div>
              <span className="text-base md:text-xl lg:text-2xl font-black text-white tracking-wide uppercase drop-shadow-sm truncate mt-0.5">
                {atletMerahNama}
              </span>
            </div>
            <div className="flag-box">
              <div className="flag" />
            </div>
          </div>
        </div>

        {/* 3. MAIN SCORE AREA */}
        <div className="main-score-area">
          {/* Left Jatuhan & Icons */}
          <div className="side-panel">
            <div className="jatuhan-box">
              <div className="text-[0.7rem] md:text-xs font-bold text-slate-300 tracking-wider">JATUHAN</div>
              <div className="text-2xl md:text-3xl font-black text-white leading-none my-1">{jatuhanBiru ?? 0}</div>
            </div>

            <div className="penalty-grid">
              {[
                { slot: 'slot1' as const, key: 'binaan1', label: 'Binaan 1' },
                { slot: 'slot2' as const, key: 'binaan2', label: 'Binaan 2' },
                { slot: 'slot3' as const, key: 'teguran1', label: 'Teguran 1' },
                { slot: 'slot4' as const, key: 'teguran2', label: 'Teguran 2' },
                { slot: 'slot5' as const, key: 'peringatan1', label: 'Peringatan 1' },
                { slot: 'slot6' as const, key: 'peringatan2', label: 'Peringatan 2' },
              ].map((item) => {
                const isActive = (bluePen as any)[item.key];
                const isRedAlert = item.key === 'peringatan1' || item.key === 'peringatan2' || bluePen.disqualified;

                return (
                  <div
                    key={item.slot}
                    onClick={() => handleTogglePenalty('biru', item.key)}
                    className={`penalty-slot ${isActive ? (isRedAlert ? 'active-red' : 'active-yellow') : ''}`}
                    title={`Sudut Biru: ${item.label}`}
                  >
                    {renderPenaltyIcon(penaltyConfig[item.slot] || item.key as any, "w-6 h-6 md:w-8 md:h-8", false, penaltyConfig.customImages)}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Blue Big Score */}
          <div className={`score-card blue ${blueScoreAnim.active ? 'score-card-pop-blue' : ''}`}>
            {blueScoreAnim.active && (
              <div key={blueScoreAnim.key} className="score-delta-badge blue">
                +{blueScoreAnim.delta} POIN
              </div>
            )}
            <div className={`score-number ${blueScoreAnim.active ? 'score-number-pop-blue' : ''}`}>
              {skorBiru}
            </div>
          </div>

          {/* Center Round 1, 2, 3 */}
          <div className="round-box">
            {[1, 2, 3].map((roundNum) => (
              <div
                key={roundNum}
                className={`round-indicator ${(state.currentBabak || 1) === roundNum ? 'active' : ''}`}
                onClick={() => {
                  playBeep('click');
                  onSelectBabak?.(roundNum);
                }}
              >
                {roundNum}
              </div>
            ))}
          </div>

          {/* Red Big Score */}
          <div className={`score-card red ${redScoreAnim.active ? 'score-card-pop-red' : ''}`}>
            {redScoreAnim.active && (
              <div key={redScoreAnim.key} className="score-delta-badge red">
                +{redScoreAnim.delta} POIN
              </div>
            )}
            <div className={`score-number ${redScoreAnim.active ? 'score-number-pop-red' : ''}`}>
              {skorMerah}
            </div>
          </div>

          {/* Right Jatuhan & Icons */}
          <div className="side-panel">
            <div className="jatuhan-box">
              <div className="text-[0.7rem] md:text-xs font-bold text-slate-300 tracking-wider">JATUHAN</div>
              <div className="text-2xl md:text-3xl font-black text-white leading-none my-1">{jatuhanMerah ?? 0}</div>
            </div>

            <div className="penalty-grid">
              {[
                { slot: 'slot1' as const, key: 'binaan1', label: 'Binaan 1' },
                { slot: 'slot2' as const, key: 'binaan2', label: 'Binaan 2' },
                { slot: 'slot3' as const, key: 'teguran1', label: 'Teguran 1' },
                { slot: 'slot4' as const, key: 'teguran2', label: 'Teguran 2' },
                { slot: 'slot5' as const, key: 'peringatan1', label: 'Peringatan 1' },
                { slot: 'slot6' as const, key: 'peringatan2', label: 'Peringatan 2' },
              ].map((item) => {
                const isActive = (redPen as any)[item.key];
                const isRedAlert = item.key === 'peringatan1' || item.key === 'peringatan2' || redPen.disqualified;

                return (
                  <div
                    key={item.slot}
                    onClick={() => handleTogglePenalty('merah', item.key)}
                    className={`penalty-slot ${isActive ? (isRedAlert ? 'active-red' : 'active-yellow') : ''}`}
                    title={`Sudut Merah: ${item.label}`}
                  >
                    {renderPenaltyIcon(penaltyConfig[item.slot] || item.key as any, "w-6 h-6 md:w-8 md:h-8", true, penaltyConfig.customImages)}
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* 4. BOTTOM TABLE (Judges Scores - Live Digital Scoring Grid) */}
        <div className="judges-table">
          <div className="table-row table-header">
            <div className="table-cell text-sky-400 font-extrabold tracking-wider">JURI 1</div>
            <div className="table-cell text-sky-400 font-extrabold tracking-wider">JURI 2</div>
            <div className="table-cell text-sky-400 font-extrabold tracking-wider">JURI 3</div>
            <div className="table-cell font-black text-slate-100 tracking-[0.18em] uppercase">AKSI / JURI</div>
            <div className="table-cell text-rose-400 font-extrabold tracking-wider">JURI 1</div>
            <div className="table-cell text-rose-400 font-extrabold tracking-wider">JURI 2</div>
            <div className="table-cell text-rose-400 font-extrabold tracking-wider">JURI 3</div>
          </div>

          {/* Row 1: Pukulan */}
          <div className="table-row">
            <div className="table-cell score-val blue-val">{getJuriHitDisplay('biru', 1, 'punch')}</div>
            <div className="table-cell score-val blue-val">{getJuriHitDisplay('biru', 2, 'punch')}</div>
            <div className="table-cell score-val blue-val">{getJuriHitDisplay('biru', 3, 'punch')}</div>
            <div className="table-cell flex items-center justify-center gap-2 font-black text-sky-300 text-xs md:text-sm">
              <BoxingGlovesIcon className="w-5 h-5 text-sky-400 drop-shadow-[0_0_10px_rgba(56,189,248,0.7)]" />
              <span className="tracking-wider">PUKULAN (+1)</span>
            </div>
            <div className="table-cell score-val red-val">{getJuriHitDisplay('merah', 1, 'punch')}</div>
            <div className="table-cell score-val red-val">{getJuriHitDisplay('merah', 2, 'punch')}</div>
            <div className="table-cell score-val red-val">{getJuriHitDisplay('merah', 3, 'punch')}</div>
          </div>

          {/* Row 2: Tendangan */}
          <div className="table-row">
            <div className="table-cell score-val blue-val">{getJuriHitDisplay('biru', 1, 'kick')}</div>
            <div className="table-cell score-val blue-val">{getJuriHitDisplay('biru', 2, 'kick')}</div>
            <div className="table-cell score-val blue-val">{getJuriHitDisplay('biru', 3, 'kick')}</div>
            <div className="table-cell flex items-center justify-center gap-2 font-black text-amber-300 text-xs md:text-sm">
              <IconSilatKicker className="w-5 h-5 text-amber-400 drop-shadow-[0_0_10px_rgba(245,158,11,0.7)]" />
              <span className="tracking-wider">TENDANGAN (+2)</span>
            </div>
            <div className="table-cell score-val red-val">{getJuriHitDisplay('merah', 1, 'kick')}</div>
            <div className="table-cell score-val red-val">{getJuriHitDisplay('merah', 2, 'kick')}</div>
            <div className="table-cell score-val red-val">{getJuriHitDisplay('merah', 3, 'kick')}</div>
          </div>
        </div>
      </div>

      {/* ========================================================
          MODAL: UBAH ICON HUKUMAN (CUSTOMIZE PENALTY ICONS)
      ======================================================== */}
      <AnimatePresence>
        {isIconModalOpen && (
          <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-[9999] flex items-center justify-center p-4 select-none">
            <motion.div
              initial={{ scale: 0.92, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.92, opacity: 0 }}
              className="bg-white rounded-3xl shadow-2xl border border-slate-200 max-w-2xl w-full p-6 text-slate-900 relative max-h-[90vh] overflow-y-auto"
            >
              {/* Close button */}
              <button
                onClick={() => {
                  playBeep('click');
                  setIsIconModalOpen(false);
                  setEditingSlot(null);
                }}
                className="absolute top-4 right-4 p-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-600 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>

              {/* Header Title */}
              <div className="flex items-center gap-2.5 mb-1">
                <Palette className="w-6 h-6 text-blue-600" />
                <h3 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
                  Pengaturan Layar Monitor Tanding
                </h3>
              </div>
              <p className="text-xs sm:text-sm text-slate-500 mb-4">
                Sesuaikan tema warna tampilan layar monitor videotron dan icon isyarat hukuman wasit.
              </p>

              {/* Navigation Tabs */}
              <div className="flex items-center gap-2 mb-5 p-1 bg-slate-100 rounded-2xl border border-slate-200">
                <button
                  type="button"
                  onClick={() => { playBeep('click'); setModalTab('theme'); }}
                  className={`flex-1 py-2 px-3 rounded-xl font-bold text-xs sm:text-sm flex items-center justify-center gap-2 transition-all cursor-pointer ${
                    modalTab === 'theme'
                      ? 'bg-blue-600 text-white shadow-md'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
                  }`}
                >
                  <Palette className="w-4 h-4" />
                  <span>Tema Warna ({palette.name})</span>
                </button>
                <button
                  type="button"
                  onClick={() => { playBeep('click'); setModalTab('icons'); }}
                  className={`flex-1 py-2 px-3 rounded-xl font-bold text-xs sm:text-sm flex items-center justify-center gap-2 transition-all cursor-pointer ${
                    modalTab === 'icons'
                      ? 'bg-blue-600 text-white shadow-md'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
                  }`}
                >
                  <Settings className="w-4 h-4" />
                  <span>Icon Hukuman Wasit</span>
                </button>
                <button
                  type="button"
                  onClick={() => { playBeep('click'); setModalTab('verification'); }}
                  className={`flex-1 py-2 px-3 rounded-xl font-bold text-xs sm:text-sm flex items-center justify-center gap-2 transition-all cursor-pointer ${
                    modalTab === 'verification'
                      ? 'bg-blue-600 text-white shadow-md'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
                  }`}
                >
                  <Scale className="w-4 h-4" />
                  <span>Layar Verifikasi</span>
                </button>
              </div>

              {/* ========================================================
                  TAB 1: TEMA WARNA LAYAR MONITOR
              ======================================================== */}
              {modalTab === 'theme' && (
                <div className="space-y-4 mb-6">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
                      Pilih Tema Tampilan Monitor (Klik untuk Menerapkan)
                    </span>
                    <span className="text-xs font-bold text-blue-600">
                      Aktif: {palette.name}
                    </span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-[50vh] overflow-y-auto pr-1">
                    {allPalettes.map((p) => {
                      const isSelected = paletteId === p.id;
                      const isRefNavy = p.id === 'professional_navy';

                      return (
                        <button
                          key={p.id}
                          type="button"
                          onClick={() => {
                            playBeep('click');
                            changePalette(p.id);
                          }}
                          className={`p-3.5 rounded-2xl border-2 text-left transition-all cursor-pointer relative flex flex-col justify-between ${
                            isSelected
                              ? 'border-blue-600 bg-blue-50/70 ring-2 ring-blue-500/30 shadow-md'
                              : 'border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50'
                          }`}
                        >
                          {/* Recommended badge for uploaded reference theme */}
                          {isRefNavy && (
                            <span className="absolute -top-2.5 right-3 bg-amber-400 text-slate-950 font-black text-[9px] uppercase px-2 py-0.5 rounded-full shadow-xs tracking-wider">
                              ⭐ Sesuai Gambar Referensi Turnamen
                            </span>
                          )}

                          <div className="flex items-start justify-between gap-2 mb-2">
                            <div>
                              <div className="flex items-center gap-1.5">
                                <span 
                                  className="w-3.5 h-3.5 rounded-full border border-white/50 shadow-sm shrink-0" 
                                  style={{ backgroundColor: p.accentColor }} 
                                />
                                <h4 className="font-black text-sm text-slate-900 leading-snug">
                                  {p.name}
                                </h4>
                              </div>
                              <p className="text-[11px] text-slate-500 mt-1 leading-snug">
                                {p.tagline}
                              </p>
                            </div>

                            {isSelected && (
                              <div className="w-5 h-5 rounded-full bg-blue-600 text-white flex items-center justify-center shrink-0">
                                <Check className="w-3 h-3 stroke-[3]" />
                              </div>
                            )}
                          </div>

                          {/* Mini visual swatch bar */}
                          <div className="flex items-center gap-1.5 pt-2 border-t border-slate-100">
                            <span className="text-[10px] text-slate-400 font-semibold mr-1">Palet:</span>
                            <div className="w-4 h-4 rounded-md border border-slate-300 shadow-xs" style={{ backgroundColor: p.preview.bg }} title="Latar Belakang" />
                            <div className="w-4 h-4 rounded-md border border-slate-300 shadow-xs" style={{ backgroundColor: p.preview.card }} title="Kartu" />
                            <div className="w-4 h-4 rounded-md border border-slate-300 shadow-xs" style={{ backgroundColor: p.accentColor }} title="Garis / Aksen" />
                            <div className="w-4 h-4 rounded-md border border-slate-300 shadow-xs" style={{ backgroundColor: p.preview.blueAccent }} title="Sudut Biru" />
                            <div className="w-4 h-4 rounded-md border border-slate-300 shadow-xs" style={{ backgroundColor: p.preview.redAccent }} title="Sudut Merah" />
                            <div className="w-4 h-4 rounded-md border border-slate-300 shadow-xs" style={{ backgroundColor: p.preview.goldAccent }} title="Aksen Emas" />
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* ========================================================
                  TAB 2: ICON HUKUMAN
              ======================================================== */}
              {modalTab === 'icons' && (
                <>
                  {/* 1. Quick Presets */}
                  <div className="mb-6">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs font-bold uppercase tracking-wider text-slate-400 block">
                        Preset Cepat & Foto Hukuman
                      </span>
                      <button
                        type="button"
                        onClick={() => {
                          playBeep('click');
                          handleOpenPhotoUploader('slot1');
                        }}
                        className="px-3 py-1.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold text-xs flex items-center gap-1.5 transition-all cursor-pointer shadow-sm"
                        title="Upload foto gestur hukuman wasit dan hilangkan background menjadi transparan"
                      >
                        <Scissors className="w-3.5 h-3.5" />
                        <span>Upload Foto Tanpa Background</span>
                      </button>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5">
                      
                      {/* Preset 0: Standar Visual Imagen */}
                      <button
                        type="button"
                        onClick={() => handleSelectPreset(STANDARDIZED_IMAGEN_PRESET)}
                        className="p-3 rounded-2xl border-2 border-emerald-500 bg-emerald-50/70 hover:bg-emerald-100/70 text-left transition-all cursor-pointer flex flex-col justify-between shadow-sm ring-1 ring-emerald-500/30"
                      >
                        <div>
                          <div className="flex items-center justify-between">
                            <span className="font-bold text-xs sm:text-sm text-emerald-950">Standar Imagen</span>
                            <span className="text-[9px] uppercase font-extrabold px-1.5 py-0.5 bg-emerald-600 text-white rounded">Resmi</span>
                          </div>
                          <div className="text-[11px] text-emerald-800 mt-0.5">Teguran 1/2, Warning 1/2 (Badge Standar)</div>
                        </div>
                        <div className="flex items-center gap-1 mt-2 text-emerald-900">
                          {renderPenaltyIcon('binaan1', 'w-4 h-4')}
                          {renderPenaltyIcon('binaan2', 'w-4 h-4')}
                          {renderPenaltyIcon(STANDARDIZED_PENALTY_ASSETS.teguran1, 'w-4 h-4')}
                          {renderPenaltyIcon(STANDARDIZED_PENALTY_ASSETS.teguran2, 'w-4 h-4')}
                          {renderPenaltyIcon(STANDARDIZED_PENALTY_ASSETS.warning1, 'w-4 h-4')}
                          {renderPenaltyIcon(STANDARDIZED_PENALTY_ASSETS.warning2, 'w-4 h-4')}
                        </div>
                      </button>

                      {/* Preset 1: Default Gambar */}
                      <button
                        type="button"
                        onClick={() => handleSelectPreset(NEW_REFERENCE_PENALTY_ICONS)}
                        className="p-3 rounded-2xl border-2 border-slate-200 hover:border-blue-500 bg-slate-50 hover:bg-blue-50/40 text-left transition-all cursor-pointer flex flex-col justify-between"
                      >
                        <div>
                          <div className="font-bold text-xs sm:text-sm text-slate-900">Referensi Gambar Baru</div>
                          <div className="text-[11px] text-slate-500 mt-0.5">Tinju, Telunjuk, Peace, Telapak, Tendangan</div>
                        </div>
                        <div className="flex items-center gap-1 mt-2 text-slate-700">
                          {renderPenaltyIcon('fist', 'w-4 h-4')}
                          {renderPenaltyIcon('pointing', 'w-4 h-4')}
                          {renderPenaltyIcon('peace', 'w-4 h-4')}
                          {renderPenaltyIcon('hand', 'w-4 h-4')}
                          {renderPenaltyIcon('kick_t', 'w-4 h-4')}
                          {renderPenaltyIcon('kick_sabit', 'w-4 h-4')}
                        </div>
                      </button>

                      {/* Preset 2: Standar Persilat */}
                      <button
                        type="button"
                        onClick={() => handleSelectPreset(PERSILAT_PENALTY_ICONS)}
                        className="p-3 rounded-2xl border-2 border-slate-200 hover:border-blue-500 bg-slate-50 hover:bg-blue-50/40 text-left transition-all cursor-pointer flex flex-col justify-between"
                      >
                        <div>
                          <div className="font-bold text-xs sm:text-sm text-slate-900">Standar Persilat</div>
                          <div className="text-[11px] text-slate-500 mt-0.5">Binaan 1/2, Teguran 1/2, Peringatan 1/2</div>
                        </div>
                        <div className="flex items-center gap-1 mt-2 text-slate-700">
                          {renderPenaltyIcon('binaan1', 'w-4 h-4')}
                          {renderPenaltyIcon('binaan2', 'w-4 h-4')}
                          {renderPenaltyIcon('teguran1', 'w-4 h-4')}
                          {renderPenaltyIcon('teguran2', 'w-4 h-4')}
                          {renderPenaltyIcon('peringatan1', 'w-4 h-4')}
                          {renderPenaltyIcon('peringatan2', 'w-5 h-4')}
                        </div>
                      </button>

                      {/* Preset 3: Siluet Aksi Silat */}
                      <button
                        type="button"
                        onClick={() => handleSelectPreset(ACTION_PENALTY_ICONS)}
                        className="p-3 rounded-2xl border-2 border-slate-200 hover:border-blue-500 bg-slate-50 hover:bg-blue-50/40 text-left transition-all cursor-pointer flex flex-col justify-between"
                      >
                        <div>
                          <div className="font-bold text-xs sm:text-sm text-slate-900">Siluet Aksi Silat</div>
                          <div className="text-[11px] text-slate-500 mt-0.5">Tinju, Pukulan, Pasang, Tendangan</div>
                        </div>
                        <div className="flex items-center gap-1 mt-2 text-slate-700">
                          {renderPenaltyIcon('fist', 'w-4 h-4')}
                          {renderPenaltyIcon('punch_pose', 'w-4 h-4')}
                          {renderPenaltyIcon('stance', 'w-4 h-4')}
                          {renderPenaltyIcon('peace', 'w-4 h-4')}
                          {renderPenaltyIcon('kick_t', 'w-4 h-4')}
                          {renderPenaltyIcon('kick_sabit', 'w-4 h-4')}
                        </div>
                      </button>

                    </div>
                  </div>

                  {/* 2. Interactive 6 Slots Configuration */}
                  <div className="mb-6">
                    <span className="text-xs font-bold uppercase tracking-wider text-slate-400 block mb-2">
                      Konfigurasi Tiap Slot Hukuman (Klik untuk Mengganti)
                    </span>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                      {[
                        { slot: 'slot1' as const, label: 'Slot 1 (Binaan 1)' },
                        { slot: 'slot2' as const, label: 'Slot 2 (Binaan 2)' },
                        { slot: 'slot3' as const, label: 'Slot 3 (Teguran 1)' },
                        { slot: 'slot4' as const, label: 'Slot 4 (Teguran 2)' },
                        { slot: 'slot5' as const, label: 'Slot 5 (Peringatan 1)' },
                        { slot: 'slot6' as const, label: 'Slot 6 (Peringatan 2)' },
                      ].map(({ slot, label }) => {
                        const isSelected = editingSlot === slot;
                        return (
                          <button
                            key={slot}
                            onClick={() => {
                              playBeep('click');
                              setEditingSlot(isSelected ? null : slot);
                            }}
                            className={`p-3 rounded-2xl border-2 flex flex-col items-center justify-center transition-all cursor-pointer ${
                              isSelected 
                                ? 'border-blue-600 bg-blue-50 ring-2 ring-blue-500/30' 
                                : 'border-slate-200 bg-white hover:border-slate-400 shadow-sm'
                            }`}
                          >
                            <div className="w-12 h-12 rounded-xl bg-slate-100 flex items-center justify-center text-slate-800 mb-2">
                              {renderPenaltyIcon(penaltyConfig[slot], "w-8 h-8")}
                            </div>
                            <span className="text-xs font-bold text-slate-800 text-center">
                              {label}
                            </span>
                            <span className="text-[10px] text-blue-600 font-semibold mt-0.5">
                              {isSelected ? 'Pilih di bawah ↓' : 'Ganti Icon'}
                            </span>
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* 3. Icon Selection Drawer when a slot is clicked */}
                  {editingSlot && (
                    <div className="mb-6 p-4 rounded-2xl bg-slate-100 border border-slate-200 animate-in fade-in zoom-in duration-150 space-y-3">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-xs font-bold uppercase tracking-wider text-slate-700">
                          Pilih Icon untuk: {editingSlot.toUpperCase()}
                        </span>
                        <button
                          onClick={() => setEditingSlot(null)}
                          className="text-xs text-slate-500 hover:text-slate-800 font-bold cursor-pointer"
                        >
                          Tutup Pilihan ✕
                        </button>
                      </div>

                      {/* Upload Foto Tanpa Background Button inside Monitor modal */}
                      <div className="p-3 bg-white rounded-xl border border-dashed border-emerald-500/50 flex flex-wrap items-center justify-between gap-2">
                        <div className="flex items-center gap-2">
                          <div className="p-1.5 rounded-lg bg-emerald-50 text-emerald-600">
                            <Scissors className="w-4 h-4" />
                          </div>
                          <div>
                            <span className="text-xs font-bold text-slate-800 block">
                              Upload Foto Tanpa Background
                            </span>
                            <span className="text-[10px] text-slate-500 block">
                              Hilangkan latar belakang foto otomatis menjadi transparan
                            </span>
                          </div>
                        </div>

                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => handleOpenPhotoUploader(editingSlot)}
                            className="px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold text-xs flex items-center gap-1.5 cursor-pointer shadow-sm transition-all"
                          >
                            <Scissors className="w-3.5 h-3.5" />
                            <span>Hapus Background Foto</span>
                          </button>

                          <label className="px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs flex items-center gap-1.5 cursor-pointer">
                            <ImageIcon className="w-3.5 h-3.5" />
                            <span>File Langsung</span>
                            <input
                              type="file"
                              accept="image/*,.jpg,.jpeg,.png,.webp,.svg"
                              className="hidden"
                              onChange={(e) => {
                                const file = e.target.files?.[0];
                                if (file && editingSlot) {
                                  handleUploadSlotPng(editingSlot, file);
                                  e.target.value = '';
                                }
                              }}
                            />
                          </label>

                          {/* Clear PNG button if active */}
                          {(typeof penaltyConfig[editingSlot] === 'string' && (penaltyConfig[editingSlot].startsWith('data:image/') || !!penaltyConfig.customImages?.[editingSlot])) && (
                            <button
                              type="button"
                              onClick={() => handleRemoveSlotPng(editingSlot)}
                              className="px-2.5 py-1.5 rounded-lg bg-red-50 hover:bg-red-100 text-red-600 text-xs font-semibold cursor-pointer"
                            >
                              Hapus PNG
                            </button>
                          )}
                        </div>
                      </div>

                      <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-7 gap-2 pt-1">
                        {ICON_CATALOG.map((item) => {
                          const isActive = penaltyConfig[editingSlot] === item.type;
                          return (
                            <button
                              key={item.type}
                              onClick={() => handleSelectIconForSlot(editingSlot, item.type)}
                              className={`p-2.5 rounded-xl border flex flex-col items-center justify-center gap-1.5 transition-all cursor-pointer ${
                                isActive 
                                  ? 'border-blue-600 bg-white text-blue-600 ring-2 ring-blue-500 shadow-sm font-bold' 
                                  : 'border-slate-200 bg-white hover:border-blue-300 text-slate-700'
                              }`}
                            >
                              <div className="w-7 h-7 flex items-center justify-center">
                                {item.icon}
                              </div>
                              <span className="text-[9px] text-center leading-tight truncate max-w-full">
                                {item.label}
                              </span>
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </>
              )}

              {/* ========================================================
                  TAB 3: LAYAR VERIFIKASI DEWAN (PERSILAT / IPSI)
              ======================================================== */}
              {modalTab === 'verification' && (
                <div className="space-y-4 mb-6">
                  <div className="bg-amber-50 border border-amber-200 p-4 rounded-2xl text-slate-800 space-y-2">
                    <div className="flex items-center gap-2">
                      <Scale className="w-5 h-5 text-amber-600 shrink-0" />
                      <h4 className="font-black text-sm uppercase text-slate-900 tracking-tight">
                        Fitur Verifikasi Wasit & Dewan Pertandingan
                      </h4>
                    </div>
                    <p className="text-xs text-slate-600 leading-relaxed">
                      Sesuai Peraturan Pertandingan PERSILAT/IPSI, Dewan Pertandingan dapat mengajukan verifikasi video/voting kepada 3 Juri Penilai (misalnya untuk menguji keabsahan Jatuhan 3 Poin atau Pelanggaran). Layar monitor pertandingan akan otomatis menampilkan layar verifikasi resmi dengan status suara real-time masing-masing Juri.
                    </p>
                  </div>

                  <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-slate-600 uppercase">Status Verifikasi Saat Ini:</span>
                      <span className={`px-2.5 py-0.5 rounded-full text-xs font-black font-mono ${
                        v?.active ? 'bg-amber-100 text-amber-700 border border-amber-300 animate-pulse' : 'bg-slate-200 text-slate-600'
                      }`}>
                        {v?.active ? `AKTIF (${v.type})` : 'TIDAK AKTIF'}
                      </span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                      <button
                        type="button"
                        onClick={() => {
                          playBeep('click');
                          if (dispatch) dispatch('DEWAN_VERIFY_TRIGGER', { type: 'JATUHAN' });
                          setIsIconModalOpen(false);
                        }}
                        className="p-3 rounded-xl bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-500 hover:to-cyan-500 text-white font-black text-xs uppercase flex items-center justify-center gap-2 shadow-md cursor-pointer transition-all"
                      >
                        <Shield className="w-4 h-4" />
                        <span>Mulai Verifikasi Jatuhan (+3 PT)</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => {
                          playBeep('click');
                          if (dispatch) dispatch('DEWAN_VERIFY_TRIGGER', { type: 'PELANGGARAN' });
                          setIsIconModalOpen(false);
                        }}
                        className="p-3 rounded-xl bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-500 hover:to-rose-500 text-white font-black text-xs uppercase flex items-center justify-center gap-2 shadow-md cursor-pointer transition-all"
                      >
                        <AlertTriangle className="w-4 h-4" />
                        <span>Mulai Verifikasi Pelanggaran</span>
                      </button>
                    </div>

                    {/* Preview Simulasi Hasil Voting Verifikasi (Visual UIN) */}
                    <div className="pt-2 border-t border-slate-200">
                      <span className="text-[11px] font-bold text-slate-600 uppercase block mb-1.5 font-mono">
                        Simulasi Preview Layar Hasil Voting:
                      </span>
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                        <button
                          type="button"
                          onClick={() => {
                            playBeep('click');
                            setPreviewVerificationResult({
                              type: 'JATUHAN',
                              result: 'BIRU',
                              votes: { juri1: 'BIRU', juri2: 'BIRU', juri3: 'TIDAK_SAH' },
                              atletNama: state.atletBiru?.nama || 'Atlet Biru',
                              kontingen: state.atletBiru?.kontingen || 'KONTINGEN BIRU',
                              timestamp: Date.now()
                            });
                            setIsIconModalOpen(false);
                          }}
                          className="p-2 rounded-xl bg-blue-50 hover:bg-blue-100 border border-blue-300 text-blue-800 text-[11px] font-bold flex flex-col items-center gap-0.5 cursor-pointer transition-colors"
                        >
                          <span className="font-black text-blue-700">Preview Sah Biru</span>
                          <span className="text-[10px] text-blue-600">J1:Biru, J2:Biru, J3:T.Sah</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => {
                            playBeep('click');
                            setPreviewVerificationResult({
                              type: 'JATUHAN',
                              result: 'TIDAK_SAH',
                              votes: { juri1: 'TIDAK_SAH', juri2: 'TIDAK_SAH', juri3: 'BIRU' },
                              timestamp: Date.now()
                            });
                            setIsIconModalOpen(false);
                          }}
                          className="p-2 rounded-xl bg-amber-50 hover:bg-amber-100 border border-amber-300 text-amber-900 text-[11px] font-bold flex flex-col items-center gap-0.5 cursor-pointer transition-colors"
                        >
                          <span className="font-black text-amber-800">Preview Tidak Sah</span>
                          <span className="text-[10px] text-amber-700">J1:T.Sah, J2:T.Sah, J3:Biru</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => {
                            playBeep('click');
                            setPreviewVerificationResult({
                              type: 'JATUHAN',
                              result: 'MERAH',
                              votes: { juri1: 'MERAH', juri2: 'MERAH', juri3: 'MERAH' },
                              atletNama: state.atletMerah?.nama || 'Atlet Merah',
                              kontingen: state.atletMerah?.kontingen || 'KONTINGEN MERAH',
                              timestamp: Date.now()
                            });
                            setIsIconModalOpen(false);
                          }}
                          className="p-2 rounded-xl bg-red-50 hover:bg-red-100 border border-red-300 text-red-800 text-[11px] font-bold flex flex-col items-center gap-0.5 cursor-pointer transition-colors"
                        >
                          <span className="font-black text-red-700">Preview Sah Merah</span>
                          <span className="text-[10px] text-red-600">3 Suara Merah (Mutlak)</span>
                        </button>
                      </div>
                    </div>

                    {v?.active && (
                      <div className="pt-2">
                        <button
                          type="button"
                          onClick={() => {
                            playBeep('click');
                            if (dispatch) dispatch('DEWAN_VERIFY_RESOLVE');
                          }}
                          className="w-full py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-black text-xs uppercase tracking-wider flex items-center justify-center gap-2 cursor-pointer transition-colors"
                        >
                          <X className="w-4 h-4 text-rose-400" />
                          <span>Selesaikan / Batalkan Verifikasi</span>
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex items-center justify-between pt-4 border-t border-slate-200">
                <button
                  onClick={() => {
                    playBeep('click');
                    handleSelectPreset(DEFAULT_PENALTY_ICONS);
                  }}
                  className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                  <span>Reset ke Bawaan</span>
                </button>

                <button
                  onClick={() => {
                    playBeep('click');
                    setIsIconModalOpen(false);
                    setEditingSlot(null);
                  }}
                  className="px-6 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs sm:text-sm font-bold shadow-md transition-all cursor-pointer flex items-center gap-2"
                >
                  <Check className="w-4 h-4" />
                  <span>Terapkan & Selesai</span>
                </button>
              </div>

            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ========================================================
          OVERLAYS & MODALS:
          - Match Verification Voting Result Screen (Hanya Menampilkan Hasil Voting)
          - Winner Announcement Modal (When match finishes)
      ======================================================== */}
      <AnimatePresence>
        {isVerificationResultVisible && (
          <MatchVerificationMonitorOverlay
            state={state}
            customResult={previewVerificationResult}
            dispatch={dispatch}
            onClose={() => {
              setDismissedVerificationTimestamp(Date.now());
              setPreviewVerificationResult(null);
            }}
          />
        )}
      </AnimatePresence>

      {/* Winner Modal */}
      <AnimatePresence>
        {state.matchStatus === 'selesai' && (
          <div className="fixed inset-0 bg-black/75 backdrop-blur-sm z-[9999] flex items-center justify-center p-4 overflow-hidden select-none">
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className={`bg-white border-4 max-w-lg w-full p-8 rounded-3xl shadow-2xl text-center relative overflow-hidden z-10 ${
                state.winner === 'biru' ? 'border-[#0066f6]' : state.winner === 'merah' ? 'border-[#dc2626]' : 'border-amber-400'
              }`}
            >
              <div className="relative inline-block mb-2">
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
                  state.winner === 'biru' ? 'bg-[#0066f6] text-white' : state.winner === 'merah' ? 'bg-[#dc2626] text-white' : 'bg-amber-500 text-white'
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
                  <div className="text-3xl font-black text-[#0066f6] mt-1">{state.scores.biru.total}</div>
                </div>
                <div className="bg-red-50 p-3 rounded-xl border border-red-200">
                  <span className="text-[10px] text-red-700 uppercase font-bold block">TOTAL MERAH</span>
                  <div className="text-3xl font-black text-[#dc2626] mt-1">{state.scores.merah.total}</div>
                </div>
              </div>

              <div className="mt-5 pt-3 border-t border-slate-200 flex items-center justify-center gap-3">
                <button
                  onClick={handleReplayAnnouncement}
                  className="px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-mono text-xs font-bold transition-all flex items-center gap-2 shadow-md cursor-pointer"
                >
                  <Volume2 className="w-4 h-4 text-cyan-400" />
                  <span>Putar Ulang Pengumuman Suara</span>
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ========================================================
          MODAL: QUICK EDIT NOMOR PARTAI
      ======================================================== */}
      <AnimatePresence>
        {editingPartaiModal && (
          <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-[9999] flex items-center justify-center p-4 select-none">
            <motion.div
              initial={{ scale: 0.92, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.92, opacity: 0 }}
              className="bg-white rounded-3xl shadow-2xl border border-slate-200 max-w-sm w-full p-6 text-slate-900 relative"
            >
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-lg font-black text-slate-900">
                  Ubah Nomor Partai
                </h3>
                <button
                  type="button"
                  onClick={() => setEditingPartaiModal(false)}
                  className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
              <p className="text-xs text-slate-500 mb-4">
                Masukkan nomor partai pertandingan untuk ditampilkan secara langsung pada layar monitor gelanggang.
              </p>
              
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  if (dispatch && newPartaiInput.trim()) {
                    playBeep('click');
                    dispatch('UPDATE_MATCH_INFO', { partai: newPartaiInput.trim() });
                    setEditingPartaiModal(false);
                  }
                }}
                className="space-y-4"
              >
                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">
                    Nomor Partai
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      value={newPartaiInput}
                      onChange={(e) => setNewPartaiInput(e.target.value)}
                      placeholder="Contoh: 01, 12, atau 105"
                      className="w-full px-4 py-2.5 rounded-xl border border-slate-300 font-mono font-bold text-lg text-slate-900 focus:outline-none focus:ring-2 focus:ring-amber-500/50 focus:border-amber-500"
                      autoFocus
                    />
                  </div>
                </div>

                <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={() => setEditingPartaiModal(false)}
                    className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition-colors cursor-pointer"
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
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* MODAL UPLOAD FOTO HUKUMAN TANPA BACKGROUND */}
      <PenaltyPhotoUploaderModal
        isOpen={isPhotoUploaderOpen}
        onClose={() => setIsPhotoUploaderOpen(false)}
        targetSlot={photoUploaderTargetSlot}
        currentConfig={penaltyConfig}
        onApplyPhoto={handleApplyUploadedPhoto}
      />

      {/* MODAL ANALISIS STATISTIK SERANGAN (RECHARTS) */}
      {showAnalyticsModal && (
        <MonitorAnalyticsModal
          state={state}
          histories={histories || []}
          onClose={() => setShowAnalyticsModal(false)}
          theme={theme}
        />
      )}
    </div>
  );
}

