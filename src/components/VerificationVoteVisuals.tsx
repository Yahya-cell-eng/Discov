/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { motion } from 'motion/react';
import { Check, X, Shield, Sparkles, Award } from 'lucide-react';

export type VerificationVoteType = 'BIRU' | 'TIDAK_SAH' | 'MERAH';

/**
 * 1. ICON VISUAL SAH BIRU (SVG Badge)
 * Badging visual resmi untuk Sudut Biru Sah (+3 Poin Jatuhan / Sah Pelanggaran)
 */
export const IconVisualSahBiru: React.FC<{ className?: string; animated?: boolean }> = ({ 
  className = "w-12 h-12",
  animated = false
}) => {
  return (
    <div className={`relative inline-flex items-center justify-center ${className}`}>
      {animated && (
        <span className="absolute inset-0 rounded-2xl bg-cyan-400/30 blur-md animate-pulse" />
      )}
      <svg
        viewBox="0 0 100 100"
        className="w-full h-full drop-shadow-[0_4px_12px_rgba(0,102,246,0.5)]"
        xmlns="http://www.w3.org/2000/svg"
      >
        <defs>
          <linearGradient id="gradBlueShield" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#00b4d8" />
            <stop offset="40%" stopColor="#0066f6" />
            <stop offset="100%" stopColor="#001858" />
          </linearGradient>
          <linearGradient id="gradBlueBorder" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#90e0ef" />
            <stop offset="50%" stopColor="#00e5ff" />
            <stop offset="100%" stopColor="#0052cc" />
          </linearGradient>
          <linearGradient id="gradBlueGlow" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#ffffff" stopOpacity="0.4" />
            <stop offset="100%" stopColor="#ffffff" stopOpacity="0" />
          </linearGradient>
        </defs>

        {/* Outer Shield with Glowing Border */}
        <path
          d="M50 6 L88 18 C88 56 68 84 50 94 C32 84 12 56 12 18 Z"
          fill="url(#gradBlueShield)"
          stroke="url(#gradBlueBorder)"
          strokeWidth="3.5"
          strokeLinejoin="round"
        />

        {/* Glossy Top Reflection */}
        <path
          d="M50 9 L84 20 C84 46 72 65 50 76 C28 65 16 46 16 20 Z"
          fill="url(#gradBlueGlow)"
        />

        {/* Speed / Arena Stripes */}
        <path d="M22 36 L78 36" stroke="#00d4ff" strokeWidth="1" strokeOpacity="0.35" strokeDasharray="3 3" />
        <path d="M26 44 L74 44" stroke="#00d4ff" strokeWidth="1" strokeOpacity="0.35" strokeDasharray="3 3" />
        <path d="M32 52 L68 52" stroke="#00d4ff" strokeWidth="1" strokeOpacity="0.35" strokeDasharray="3 3" />

        {/* Central Circular Verified Backdrop */}
        <circle cx="50" cy="50" r="23" fill="#001a4e" stroke="#00e5ff" strokeWidth="2.5" />

        {/* Bold White Checkmark with Shadow */}
        <path
          d="M37 50 L46 60 L64 39"
          fill="none"
          stroke="#ffffff"
          strokeWidth="6"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <path
          d="M37 50 L46 60 L64 39"
          fill="none"
          stroke="#00e5ff"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />

        {/* Top Mini Stars / Persilat Accent */}
        <circle cx="50" cy="18" r="2.5" fill="#ffffff" />
      </svg>
    </div>
  );
};

/**
 * 2. ICON VISUAL TIDAK SAH (SVG Badge)
 * Badging visual resmi untuk keputusan Tidak Sah / Batal (0 Poin / Pelanggaran Tidak Terbukti)
 */
export const IconVisualTidakSah: React.FC<{ className?: string; animated?: boolean }> = ({ 
  className = "w-12 h-12",
  animated = false
}) => {
  return (
    <div className={`relative inline-flex items-center justify-center ${className}`}>
      {animated && (
        <span className="absolute inset-0 rounded-2xl bg-amber-400/25 blur-md animate-pulse" />
      )}
      <svg
        viewBox="0 0 100 100"
        className="w-full h-full drop-shadow-[0_4px_12px_rgba(245,158,11,0.4)]"
        xmlns="http://www.w3.org/2000/svg"
      >
        <defs>
          <linearGradient id="gradNeutralShield" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#475569" />
            <stop offset="45%" stopColor="#1e293b" />
            <stop offset="100%" stopColor="#090d16" />
          </linearGradient>
          <linearGradient id="gradNeutralBorder" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#fbbf24" />
            <stop offset="50%" stopColor="#f59e0b" />
            <stop offset="100%" stopColor="#b45309" />
          </linearGradient>
          <linearGradient id="gradNeutralGlow" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#ffffff" stopOpacity="0.25" />
            <stop offset="100%" stopColor="#ffffff" stopOpacity="0" />
          </linearGradient>
        </defs>

        {/* Octagonal Shield */}
        <path
          d="M32 10 L68 10 L88 30 L88 70 L68 90 L32 90 L12 70 L12 30 Z"
          fill="url(#gradNeutralShield)"
          stroke="url(#gradNeutralBorder)"
          strokeWidth="3.5"
          strokeLinejoin="round"
        />

        {/* Top Gloss */}
        <path
          d="M34 13 L66 13 L84 31 L84 55 Q50 65 16 55 L16 31 Z"
          fill="url(#gradNeutralGlow)"
        />

        {/* Inner Hazard Stripes */}
        <line x1="22" y1="36" x2="78" y2="36" stroke="#f59e0b" strokeWidth="1" strokeOpacity="0.3" strokeDasharray="3 3" />
        <line x1="22" y1="64" x2="78" y2="64" stroke="#f59e0b" strokeWidth="1" strokeOpacity="0.3" strokeDasharray="3 3" />

        {/* Center Circular Hazard Ring */}
        <circle cx="50" cy="50" r="23" fill="#0f172a" stroke="#f59e0b" strokeWidth="2.5" />

        {/* Bold X Mark (Tidak Sah) */}
        <line x1="37" y1="37" x2="63" y2="63" stroke="#fcd34d" strokeWidth="6" strokeLinecap="round" />
        <line x1="63" y1="37" x2="37" y2="63" stroke="#fcd34d" strokeWidth="6" strokeLinecap="round" />
        <line x1="37" y1="37" x2="63" y2="63" stroke="#ffffff" strokeWidth="2.5" strokeLinecap="round" />
        <line x1="63" y1="37" x2="37" y2="63" stroke="#ffffff" strokeWidth="2.5" strokeLinecap="round" />

        {/* Top Indicator */}
        <circle cx="50" cy="18" r="2.5" fill="#fbbf24" />
      </svg>
    </div>
  );
};

/**
 * 3. ICON VISUAL SAH MERAH (SVG Badge)
 * Badging visual resmi untuk Sudut Merah Sah (+3 Poin Jatuhan / Sah Pelanggaran)
 */
export const IconVisualSahMerah: React.FC<{ className?: string; animated?: boolean }> = ({ 
  className = "w-12 h-12",
  animated = false
}) => {
  return (
    <div className={`relative inline-flex items-center justify-center ${className}`}>
      {animated && (
        <span className="absolute inset-0 rounded-2xl bg-rose-500/30 blur-md animate-pulse" />
      )}
      <svg
        viewBox="0 0 100 100"
        className="w-full h-full drop-shadow-[0_4px_12px_rgba(220,38,38,0.5)]"
        xmlns="http://www.w3.org/2000/svg"
      >
        <defs>
          <linearGradient id="gradRedShield" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#ff4d6d" />
            <stop offset="40%" stopColor="#dc2626" />
            <stop offset="100%" stopColor="#59000d" />
          </linearGradient>
          <linearGradient id="gradRedBorder" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#ff99aa" />
            <stop offset="50%" stopColor="#ff3366" />
            <stop offset="100%" stopColor="#b91c1c" />
          </linearGradient>
          <linearGradient id="gradRedGlow" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#ffffff" stopOpacity="0.4" />
            <stop offset="100%" stopColor="#ffffff" stopOpacity="0" />
          </linearGradient>
        </defs>

        {/* Outer Shield with Glowing Border */}
        <path
          d="M50 6 L88 18 C88 56 68 84 50 94 C32 84 12 56 12 18 Z"
          fill="url(#gradRedShield)"
          stroke="url(#gradRedBorder)"
          strokeWidth="3.5"
          strokeLinejoin="round"
        />

        {/* Glossy Top Reflection */}
        <path
          d="M50 9 L84 20 C84 46 72 65 50 76 C28 65 16 46 16 20 Z"
          fill="url(#gradRedGlow)"
        />

        {/* Speed / Arena Stripes */}
        <path d="M22 36 L78 36" stroke="#ff8599" strokeWidth="1" strokeOpacity="0.35" strokeDasharray="3 3" />
        <path d="M26 44 L74 44" stroke="#ff8599" strokeWidth="1" strokeOpacity="0.35" strokeDasharray="3 3" />
        <path d="M32 52 L68 52" stroke="#ff8599" strokeWidth="1" strokeOpacity="0.35" strokeDasharray="3 3" />

        {/* Central Circular Verified Backdrop */}
        <circle cx="50" cy="50" r="23" fill="#450a0a" stroke="#ff3366" strokeWidth="2.5" />

        {/* Bold White Checkmark with Shadow */}
        <path
          d="M37 50 L46 60 L64 39"
          fill="none"
          stroke="#ffffff"
          strokeWidth="6"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <path
          d="M37 50 L46 60 L64 39"
          fill="none"
          stroke="#ff8599"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />

        {/* Top Mini Stars / Persilat Accent */}
        <circle cx="50" cy="18" r="2.5" fill="#ffffff" />
      </svg>
    </div>
  );
};

/**
 * Universal Icon Selector based on vote type
 */
export const RenderVerificationIcon: React.FC<{
  type: VerificationVoteType;
  className?: string;
  animated?: boolean;
}> = ({ type, className = "w-10 h-10", animated = false }) => {
  if (type === 'BIRU') return <IconVisualSahBiru className={className} animated={animated} />;
  if (type === 'MERAH') return <IconVisualSahMerah className={className} animated={animated} />;
  return <IconVisualTidakSah className={className} animated={animated} />;
};

/**
 * VISUAL VOTE CARD COMPONENT
 * Renders the complete, prominent Visual UI card (Sah Biru / Tidak Sah / Sah Merah)
 */
interface VisualVoteCardProps {
  vote: VerificationVoteType;
  size?: 'sm' | 'md' | 'lg' | 'hero';
  isSelected?: boolean;
  category?: 'JATUHAN' | 'PELANGGARAN' | null;
  count?: number;
  onClick?: () => void;
  showPoints?: boolean;
  athleteName?: string;
}

export const VisualVoteCard: React.FC<VisualVoteCardProps> = ({
  vote,
  size = 'md',
  isSelected = false,
  category = 'JATUHAN',
  count,
  onClick,
  showPoints = true,
  athleteName,
}) => {
  const isBlue = vote === 'BIRU';
  const isRed = vote === 'MERAH';
  const isNeutral = vote === 'TIDAK_SAH';

  // Config per vote type
  const config = {
    BIRU: {
      title: 'SAH BIRU',
      cornerText: 'SUDUT BIRU',
      pointsText: category === 'JATUHAN' ? '+3 POIN' : 'SAH',
      descText: category === 'JATUHAN' ? 'Jatuhan Sah Sudut Biru' : 'Pelanggaran Sudut Biru',
      bgClass: 'bg-gradient-to-b from-blue-900/90 via-blue-950 to-slate-950',
      borderClass: isSelected 
        ? 'border-cyan-400 ring-2 ring-cyan-400/50 shadow-[0_0_25px_rgba(0,180,216,0.6)]' 
        : 'border-blue-500/60 hover:border-cyan-400/80',
      textGlow: 'text-cyan-300',
      badgeBg: 'bg-cyan-500/20 text-cyan-300 border-cyan-400/40',
      buttonBg: 'bg-gradient-to-r from-blue-600 to-cyan-500 hover:from-blue-500 hover:to-cyan-400 text-white',
    },
    MERAH: {
      title: 'SAH MERAH',
      cornerText: 'SUDUT MERAH',
      pointsText: category === 'JATUHAN' ? '+3 POIN' : 'SAH',
      descText: category === 'JATUHAN' ? 'Jatuhan Sah Sudut Merah' : 'Pelanggaran Sudut Merah',
      bgClass: 'bg-gradient-to-b from-red-900/90 via-red-950 to-slate-950',
      borderClass: isSelected 
        ? 'border-rose-400 ring-2 ring-rose-400/50 shadow-[0_0_25px_rgba(220,38,38,0.6)]' 
        : 'border-red-500/60 hover:border-rose-400/80',
      textGlow: 'text-rose-300',
      badgeBg: 'bg-rose-500/20 text-rose-300 border-rose-400/40',
      buttonBg: 'bg-gradient-to-r from-red-600 to-rose-500 hover:from-red-500 hover:to-rose-400 text-white',
    },
    TIDAK_SAH: {
      title: 'TIDAK SAH',
      cornerText: 'NETRAL / BATAL',
      pointsText: '0 POIN',
      descText: 'Teknik Gugur / Tidak Sah',
      bgClass: 'bg-gradient-to-b from-slate-800 via-slate-900 to-slate-950',
      borderClass: isSelected 
        ? 'border-amber-400 ring-2 ring-amber-400/50 shadow-[0_0_25px_rgba(245,158,11,0.5)]' 
        : 'border-slate-700 hover:border-amber-400/70',
      textGlow: 'text-amber-300',
      badgeBg: 'bg-amber-500/20 text-amber-300 border-amber-400/40',
      buttonBg: 'bg-gradient-to-r from-slate-700 to-slate-600 hover:from-slate-600 hover:to-slate-500 text-slate-100',
    }
  }[vote];

  // Sizing definitions
  if (size === 'sm') {
    return (
      <div 
        onClick={onClick}
        className={`px-2.5 py-1.5 rounded-xl border flex items-center gap-2 transition-all ${config.bgClass} ${config.borderClass} ${onClick ? 'cursor-pointer active:scale-95' : ''}`}
      >
        <RenderVerificationIcon type={vote} className="w-5 h-5 shrink-0" />
        <div className="leading-tight text-left">
          <span className="text-[11px] font-black uppercase text-white font-mono block">
            {config.title}
          </span>
          {showPoints && (
            <span className={`text-[9px] font-bold ${config.textGlow}`}>
              {config.pointsText}
            </span>
          )}
        </div>
      </div>
    );
  }

  if (size === 'hero') {
    return (
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ type: 'spring', damping: 20, stiffness: 300 }}
        className={`w-full p-6 sm:p-8 rounded-3xl border-2 text-center relative overflow-hidden shadow-2xl ${config.bgClass} ${config.borderClass}`}
      >
        {/* Glow Effects */}
        <div className={`absolute -top-24 left-1/2 -translate-x-1/2 w-72 h-72 rounded-full blur-3xl pointer-events-none ${
          isBlue ? 'bg-cyan-500/25' : isRed ? 'bg-rose-500/25' : 'bg-amber-500/20'
        }`} />

        <div className="relative z-10 flex flex-col items-center">
          {/* Hero Icon */}
          <div className="mb-4">
            <RenderVerificationIcon type={vote} className="w-20 h-20 sm:w-24 sm:h-24" animated={true} />
          </div>

          {/* Subtitle Badge */}
          <div className="flex items-center gap-2 mb-2">
            <span className={`px-3 py-1 rounded-full text-xs font-black font-mono uppercase tracking-widest border ${config.badgeBg}`}>
              KEPUTUSAN RESMI WASIT JURI
            </span>
            {showPoints && category === 'JATUHAN' && (
              <span className="px-3 py-1 rounded-full text-xs font-black font-mono bg-white text-slate-950 shadow-md">
                {config.pointsText}
              </span>
            )}
          </div>

          {/* Hero Title */}
          <h2 className="text-3xl sm:text-5xl font-black uppercase tracking-tight text-white font-sans drop-shadow-md">
            {config.title}
          </h2>

          {/* Athlete / Consequence Details */}
          {athleteName ? (
            <p className="text-sm sm:text-base text-slate-200 mt-2 font-semibold">
              Keputusan disahkan untuk atlet <strong className={`uppercase ${config.textGlow}`}>{athleteName}</strong>
            </p>
          ) : (
            <p className="text-xs sm:text-sm text-slate-300 mt-2 font-medium max-w-md">
              {config.descText} berdasarkan hasil akumulasi suara mayoritas 3 Juri Penilai.
            </p>
          )}

          {count !== undefined && (
            <div className="mt-4 px-4 py-1.5 rounded-xl bg-slate-950/80 border border-slate-800 text-xs font-mono text-slate-300">
              Didukung oleh <strong className="text-white">{count} dari 3 Juri</strong>
            </div>
          )}
        </div>
      </motion.div>
    );
  }

  // Default 'md' and 'lg' size for cards
  return (
    <div
      onClick={onClick}
      className={`p-3.5 sm:p-4 rounded-2xl border transition-all flex flex-col items-center text-center justify-between relative group ${config.bgClass} ${config.borderClass} ${
        onClick ? 'cursor-pointer hover:scale-[1.02] active:scale-95' : ''
      }`}
    >
      {/* Top Header Tag */}
      <div className="w-full flex items-center justify-between mb-2">
        <span className={`text-[10px] font-mono font-black uppercase px-2 py-0.5 rounded border ${config.badgeBg}`}>
          {config.cornerText}
        </span>
        {count !== undefined && (
          <span className="text-[10px] font-mono font-bold text-slate-400 bg-slate-950 px-2 py-0.5 rounded border border-slate-800">
            {count} Suara
          </span>
        )}
      </div>

      {/* Main Visual Badge Icon */}
      <div className="my-2 group-hover:scale-105 transition-transform">
        <RenderVerificationIcon 
          type={vote} 
          className={size === 'lg' ? 'w-16 h-16' : 'w-12 h-12'} 
          animated={isSelected}
        />
      </div>

      {/* Label and Points */}
      <div className="w-full mt-1 space-y-0.5">
        <div className="text-sm sm:text-base font-black text-white uppercase font-sans tracking-tight">
          {config.title}
        </div>
        <div className={`text-[11px] font-mono font-bold ${config.textGlow}`}>
          {config.pointsText}
        </div>
        <div className="text-[10px] text-slate-400 truncate">
          {config.descText}
        </div>
      </div>
    </div>
  );
};

/**
 * VISUAL VOTE PILL (Used for individual jury decision chips)
 */
export const VisualVotePill: React.FC<{ vote: VerificationVoteType }> = ({ vote }) => {
  if (vote === 'BIRU') {
    return (
      <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl bg-gradient-to-r from-blue-900/90 to-blue-800 border-2 border-cyan-400 shadow-[0_0_15px_rgba(0,180,216,0.4)] text-white">
        <RenderVerificationIcon type="BIRU" className="w-5 h-5 shrink-0" />
        <div className="text-left leading-none font-mono">
          <span className="text-xs font-black block text-cyan-200">SAH BIRU</span>
          <span className="text-[9px] text-blue-200/80 font-bold">+3 POIN</span>
        </div>
      </div>
    );
  }

  if (vote === 'MERAH') {
    return (
      <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl bg-gradient-to-r from-red-900/90 to-red-800 border-2 border-rose-400 shadow-[0_0_15px_rgba(220,38,38,0.4)] text-white">
        <RenderVerificationIcon type="MERAH" className="w-5 h-5 shrink-0" />
        <div className="text-left leading-none font-mono">
          <span className="text-xs font-black block text-rose-200">SAH MERAH</span>
          <span className="text-[9px] text-rose-200/80 font-bold">+3 POIN</span>
        </div>
      </div>
    );
  }

  return (
    <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl bg-gradient-to-r from-slate-900 to-slate-800 border-2 border-amber-400 shadow-[0_0_15px_rgba(245,158,11,0.3)] text-white">
      <RenderVerificationIcon type="TIDAK_SAH" className="w-5 h-5 shrink-0" />
      <div className="text-left leading-none font-mono">
        <span className="text-xs font-black block text-amber-300">TIDAK SAH</span>
        <span className="text-[9px] text-slate-400 font-bold">BATAL</span>
      </div>
    </div>
  );
};
