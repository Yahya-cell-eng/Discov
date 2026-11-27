/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';

export type ThemePaletteId = 
  | 'default_dark' 
  | 'default_light' 
  | 'high_contrast' 
  | 'professional_navy' 
  | 'crimson' 
  | 'emerald'
  | 'technical_system';

export interface ThemePaletteConfig {
  id: ThemePaletteId;
  name: string;
  label: string;
  tagline: string;
  isDark: boolean;
  accentColor: string;
  preview: {
    bg: string;
    card: string;
    border: string;
    text: string;
    blueAccent: string;
    redAccent: string;
    goldAccent: string;
  };
  classes: {
    bg: string;
    card: string;
    cardSubtle: string;
    border: string;
    borderAccent: string;
    textPrimary: string;
    textSecondary: string;
    headerBg: string;
    blueCornerBg: string;
    redCornerBg: string;
  };
}

export const THEME_PALETTES: Record<ThemePaletteId, ThemePaletteConfig> = {
  default_dark: {
    id: 'default_dark',
    name: 'Modern Dark',
    label: 'Modern Dark (Default)',
    tagline: 'Standard IPSI tournament midnight theme with smooth slate accents',
    isDark: true,
    accentColor: '#3b82f6',
    preview: {
      bg: '#0b0f19',
      card: '#151d30',
      border: '#1e293b',
      text: '#f8fafc',
      blueAccent: '#2563eb',
      redAccent: '#dc2626',
      goldAccent: '#eab308'
    },
    classes: {
      bg: 'bg-[#0b0f19]',
      card: 'bg-[#151d30]',
      cardSubtle: 'bg-[#0f172a]',
      border: 'border-[#1e293b]',
      borderAccent: 'border-blue-500/40',
      textPrimary: 'text-slate-100',
      textSecondary: 'text-slate-400',
      headerBg: 'bg-[#151d30]',
      blueCornerBg: 'bg-blue-600',
      redCornerBg: 'bg-red-600'
    }
  },
  default_light: {
    id: 'default_light',
    name: 'Clean Light',
    label: 'Clean Light Arena',
    tagline: 'High clarity executive day theme for bright arenas and outdoor scoring',
    isDark: false,
    accentColor: '#2563eb',
    preview: {
      bg: '#f1f5f9',
      card: '#ffffff',
      border: '#cbd5e1',
      text: '#0f172a',
      blueAccent: '#2563eb',
      redAccent: '#dc2626',
      goldAccent: '#d97706'
    },
    classes: {
      bg: 'bg-[#f1f5f9]',
      card: 'bg-white',
      cardSubtle: 'bg-slate-100',
      border: 'border-slate-300',
      borderAccent: 'border-blue-400',
      textPrimary: 'text-slate-900',
      textSecondary: 'text-slate-600',
      headerBg: 'bg-slate-200',
      blueCornerBg: 'bg-blue-600',
      redCornerBg: 'bg-red-600'
    }
  },
  high_contrast: {
    id: 'high_contrast',
    name: 'High Contrast',
    label: 'High Contrast (Arena Max)',
    tagline: 'Pure black backdrop with hyper-vivid neon accents for long-range display readability',
    isDark: true,
    accentColor: '#facc15',
    preview: {
      bg: '#000000',
      card: '#09090b',
      border: '#e4e4e7',
      text: '#ffffff',
      blueAccent: '#3b82f6',
      redAccent: '#ef4444',
      goldAccent: '#facc15'
    },
    classes: {
      bg: 'bg-black',
      card: 'bg-[#0a0a0a]',
      cardSubtle: 'bg-[#121212]',
      border: 'border-zinc-700',
      borderAccent: 'border-yellow-400',
      textPrimary: 'text-white',
      textSecondary: 'text-zinc-300',
      headerBg: 'bg-[#0f0f0f]',
      blueCornerBg: 'bg-blue-600',
      redCornerBg: 'bg-red-600'
    }
  },
  professional_navy: {
    id: 'professional_navy',
    name: 'Professional Navy',
    label: 'Professional Navy & Ice Cyan (Official Tournament)',
    tagline: 'Deep royal navy blue with gold foil & ice cyan accents for prestigious championships',
    isDark: true,
    accentColor: '#0091ff',
    preview: {
      bg: '#03102c',
      card: '#02132e',
      border: '#0091ff',
      text: '#ffffff',
      blueAccent: '#004bbd',
      redAccent: '#d5001c',
      goldAccent: '#ffd200'
    },
    classes: {
      bg: 'bg-[#03102c]',
      card: 'bg-[#02132e]',
      cardSubtle: 'bg-[#071d3d]',
      border: 'border-[#0091ff]',
      borderAccent: 'border-[#00e5ff]',
      textPrimary: 'text-white',
      textSecondary: 'text-slate-300',
      headerBg: 'bg-[#03102c]',
      blueCornerBg: 'bg-[#004bbd]',
      redCornerBg: 'bg-[#d5001c]'
    }
  },
  crimson: {
    id: 'crimson',
    name: 'Crimson Prestige',
    label: 'Crimson & Champagne',
    tagline: 'Rich royal velvet maroon with champagne gold for martial arts tournament heritage',
    isDark: true,
    accentColor: '#f43f5e',
    preview: {
      bg: '#140508',
      card: '#250b10',
      border: '#881337',
      text: '#fff1f2',
      blueAccent: '#2563eb',
      redAccent: '#f43f5e',
      goldAccent: '#fbbf24'
    },
    classes: {
      bg: 'bg-[#140508]',
      card: 'bg-[#250b10]',
      cardSubtle: 'bg-[#1c080c]',
      border: 'border-[#881337]',
      borderAccent: 'border-rose-500/50',
      textPrimary: 'text-rose-50',
      textSecondary: 'text-rose-200/70',
      headerBg: 'bg-[#2e0e15]',
      blueCornerBg: 'bg-indigo-600',
      redCornerBg: 'bg-rose-600'
    }
  },
  emerald: {
    id: 'emerald',
    name: 'Emerald Arena',
    label: 'Emerald & Jade Prestige',
    tagline: 'Deep forest jade with mint highlights honoring traditional Pencak Silat green insignia',
    isDark: true,
    accentColor: '#10b981',
    preview: {
      bg: '#041611',
      card: '#092920',
      border: '#065f46',
      text: '#ecfdf5',
      blueAccent: '#0ea5e9',
      redAccent: '#dc2626',
      goldAccent: '#fbbf24'
    },
    classes: {
      bg: 'bg-[#041611]',
      card: 'bg-[#092920]',
      cardSubtle: 'bg-[#061e17]',
      border: 'border-[#065f46]',
      borderAccent: 'border-emerald-500/50',
      textPrimary: 'text-emerald-50',
      textSecondary: 'text-emerald-200/70',
      headerBg: 'bg-[#0d3b2e]',
      blueCornerBg: 'bg-teal-600',
      redCornerBg: 'bg-red-600'
    }
  },
  technical_system: {
    id: 'technical_system',
    name: 'Technical System',
    label: 'Technical System (Variation 5)',
    tagline: 'Cyber-industrial apparatus console with dot matrix grid, high-tech cyan accents & Syne typography',
    isDark: true,
    accentColor: '#00f2ff',
    preview: {
      bg: '#0c0c0e',
      card: '#141418',
      border: '#27272a',
      text: '#ffffff',
      blueAccent: '#3b82f6',
      redAccent: '#ff3b3b',
      goldAccent: '#ffcc00'
    },
    classes: {
      bg: 'bg-[#0c0c0e]',
      card: 'bg-[#141418]',
      cardSubtle: 'bg-[#0e0e12]',
      border: 'border-white/10',
      borderAccent: 'border-cyan-400',
      textPrimary: 'text-white',
      textSecondary: 'text-zinc-400',
      headerBg: 'bg-[#101014]',
      blueCornerBg: 'bg-blue-600',
      redCornerBg: 'bg-red-600'
    }
  }
};

const PALETTE_STORAGE_KEY = 'silat_theme_palette';

export function getStoredPalette(): ThemePaletteId {
  if (typeof window === 'undefined') return 'professional_navy';
  const stored = localStorage.getItem(PALETTE_STORAGE_KEY) as ThemePaletteId;
  if (stored && THEME_PALETTES[stored]) {
    // If stored was legacy technical_system, upgrade to professional_navy for the official tournament theme
    if (stored === 'technical_system') {
      localStorage.setItem(PALETTE_STORAGE_KEY, 'professional_navy');
      return 'professional_navy';
    }
    return stored;
  }
  // Fallback to legacy theme key
  const legacyTheme = localStorage.getItem('theme');
  if (legacyTheme === 'light') return 'default_light';
  return 'professional_navy';
}

export function setStoredPalette(paletteId: ThemePaletteId) {
  if (!THEME_PALETTES[paletteId]) return;
  const config = THEME_PALETTES[paletteId];
  
  if (typeof window !== 'undefined') {
    localStorage.setItem(PALETTE_STORAGE_KEY, paletteId);
    localStorage.setItem('theme', config.isDark ? 'dark' : 'light');
    
    // Set dataset attributes on <html> for CSS selector targeting
    document.documentElement.setAttribute('data-theme-palette', paletteId);
    document.documentElement.setAttribute('data-theme', config.isDark ? 'dark' : 'light');
    
    if (config.isDark) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }

    // Dispatch global event for instant reactive component updates
    window.dispatchEvent(new CustomEvent('silat_palette_changed', { detail: { palette: paletteId, config } }));
  }
}

export function useThemePalette() {
  const [currentPaletteId, setCurrentPaletteId] = useState<ThemePaletteId>(() => getStoredPalette());

  useEffect(() => {
    // Initial sync
    setStoredPalette(currentPaletteId);

    const handleCustomChange = (e: Event) => {
      const customEvent = e as CustomEvent<{ palette: ThemePaletteId }>;
      if (customEvent.detail && customEvent.detail.palette) {
        setCurrentPaletteId(customEvent.detail.palette);
      }
    };

    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === PALETTE_STORAGE_KEY && e.newValue) {
        setCurrentPaletteId(e.newValue as ThemePaletteId);
      }
    };

    window.addEventListener('silat_palette_changed', handleCustomChange);
    window.addEventListener('storage', handleStorageChange);

    return () => {
      window.removeEventListener('silat_palette_changed', handleCustomChange);
      window.removeEventListener('storage', handleStorageChange);
    };
  }, []);

  const changePalette = (newPaletteId: ThemePaletteId) => {
    setCurrentPaletteId(newPaletteId);
    setStoredPalette(newPaletteId);
  };

  const toggleLightDark = () => {
    const isCurrentlyDark = THEME_PALETTES[currentPaletteId]?.isDark ?? true;
    const nextId: ThemePaletteId = isCurrentlyDark ? 'default_light' : 'default_dark';
    changePalette(nextId);
  };

  return {
    paletteId: currentPaletteId,
    palette: THEME_PALETTES[currentPaletteId] || THEME_PALETTES.default_dark,
    allPalettes: Object.values(THEME_PALETTES),
    changePalette,
    toggleLightDark,
    isDark: THEME_PALETTES[currentPaletteId]?.isDark ?? true
  };
}
