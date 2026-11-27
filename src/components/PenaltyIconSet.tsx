/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import {
  Binaan1Icon,
  Binaan2Icon,
  Teguran1Icon,
  Teguran2Icon,
  Peringatan1Icon,
  Peringatan2Icon,
  DisqualifikasiIcon
} from './PenaltyIcons';

export type PenaltyIconType =
  | 'silat_sweep'
  | 'silat_kick_t'
  | 'silat_defense'
  | 'silat_kick_sabit'
  | 'silat_guard'
  | 'silat_kuda_kuda'
  | 'fist'
  | 'pointing'
  | 'peace'
  | 'hand'
  | 'kick_t'
  | 'kick_sabit'
  | 'binaan1'
  | 'binaan2'
  | 'teguran1'
  | 'teguran2'
  | 'peringatan1'
  | 'peringatan2'
  | 'disqualified'
  | 'stance'
  | 'punch_pose';

export interface PenaltyIconConfig {
  slot1: PenaltyIconType | string; // Slot 1
  slot2: PenaltyIconType | string; // Slot 2
  slot3: PenaltyIconType | string; // Slot 3
  slot4: PenaltyIconType | string; // Slot 4
  slot5: PenaltyIconType | string; // Slot 5
  slot6: PenaltyIconType | string; // Slot 6
  customImages?: Record<string, string>;
}

export const DEFAULT_PENALTY_ICONS: PenaltyIconConfig = {
  slot1: 'binaan1',
  slot2: 'binaan2',
  slot3: 'teguran1',
  slot4: 'teguran2',
  slot5: 'peringatan1',
  slot6: 'peringatan2',
};

export const PERSILAT_PENALTY_ICONS: PenaltyIconConfig = {
  slot1: 'binaan1',
  slot2: 'binaan2',
  slot3: 'teguran1',
  slot4: 'teguran2',
  slot5: 'peringatan1',
  slot6: 'peringatan2',
};

// Preset Sesuai Gambar Referensi Monitor Tanding (Tinju, Telunjuk, Dua Jari, dsb)
export const NEW_REFERENCE_PENALTY_ICONS: PenaltyIconConfig = {
  slot1: 'fist',
  slot2: 'pointing',
  slot3: 'peace',
  slot4: 'hand',
  slot5: 'kick_t',
  slot6: 'kick_sabit',
};

export const ACTION_PENALTY_ICONS: PenaltyIconConfig = {
  slot1: 'fist',
  slot2: 'punch_pose',
  slot3: 'stance',
  slot4: 'peace',
  slot5: 'kick_t',
  slot6: 'kick_sabit',
};

// Standardized visual icons generated for Pencak Silat penalties (Transparent PNGs)
export const STANDARDIZED_PENALTY_ASSETS = {
  teguran1: '/src/assets/images/silat_teguran_one_transparent.png',
  teguran2: '/src/assets/images/silat_teguran_two_transparent.png',
  warning1: '/src/assets/images/silat_warning_one_transparent.png',
  warning2: '/src/assets/images/silat_warning_two_transparent.png',
  disqualification: '/src/assets/images/silat_disqualification_transparent.png',
};

// Official Standardized Imagen visual icons preset for Monitor Panel
export const STANDARDIZED_IMAGEN_PRESET: PenaltyIconConfig = {
  slot1: 'binaan1',
  slot2: 'binaan2',
  slot3: STANDARDIZED_PENALTY_ASSETS.teguran1,
  slot4: STANDARDIZED_PENALTY_ASSETS.teguran2,
  slot5: STANDARDIZED_PENALTY_ASSETS.warning1,
  slot6: STANDARDIZED_PENALTY_ASSETS.warning2,
};

// Disqualification focus preset
export const STANDARDIZED_DQ_PRESET: PenaltyIconConfig = {
  slot1: 'binaan1',
  slot2: STANDARDIZED_PENALTY_ASSETS.teguran1,
  slot3: STANDARDIZED_PENALTY_ASSETS.teguran2,
  slot4: STANDARDIZED_PENALTY_ASSETS.warning1,
  slot5: STANDARDIZED_PENALTY_ASSETS.warning2,
  slot6: STANDARDIZED_PENALTY_ASSETS.disqualification,
};

// 0. Silat Action Silhouettes matching the official tournament videotron screenshot
export const IconSilatSweep = ({ className = "w-9 h-9", flip = false }: { className?: string; flip?: boolean }) => (
  <svg viewBox="0 0 50 50" className={`${className} ${flip ? 'scale-x-[-1]' : ''}`} fill="currentColor">
    <circle cx="15" cy="16" r="4.2" />
    <path d="M 12 21 C 14 20, 20 20, 21 23 L 20 32 C 18 34, 13 34, 11 32 Z" />
    <path d="M 13 25 L 7 34 L 5 34" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" />
    <path d="M 19 25 L 24 32 L 27 32" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" />
    <path d="M 12 32 L 10 40 L 16 40 L 17 34 Z" />
    <path d="M 19 32 L 32 37 L 44 39 L 44 42 L 31 42 L 17 36 Z" />
  </svg>
);

export const IconSilatKickT = ({ className = "w-9 h-9", flip = false }: { className?: string; flip?: boolean }) => (
  <svg viewBox="0 0 50 50" className={`${className} ${flip ? 'scale-x-[-1]' : ''}`} fill="currentColor">
    <circle cx="17" cy="13" r="4" />
    <path d="M 14 18 C 16 17, 21 17, 23 19 L 22 27 C 20 28, 15 28, 13 27 Z" />
    <path d="M 16 20 L 10 22 L 11 27 M 21 21 L 26 24 L 25 29" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" />
    <path d="M 15 27 L 14 37 L 14 43 L 18 43 L 18 37 L 19 27 Z" />
    <path d="M 21 25 L 30 24 L 43 22 L 44 25 L 32 27 L 22 29 Z" />
    <path d="M 42 19 L 45 20 L 44 26 L 41 25 Z" />
  </svg>
);

export const IconSilatDefense = ({ className = "w-9 h-9", flip = false }: { className?: string; flip?: boolean }) => (
  <svg viewBox="0 0 50 50" className={`${className} ${flip ? 'scale-x-[-1]' : ''}`} fill="currentColor">
    <circle cx="19" cy="15" r="4" />
    <path d="M 16 20 C 18 18, 23 18, 25 20 L 24 29 C 22 30, 17 30, 15 29 Z" />
    <path d="M 18 21 L 12 26 L 15 31 M 23 21 L 28 27 L 25 32" stroke="currentColor" strokeWidth="2.8" strokeLinecap="round" />
    <path d="M 15 29 L 9 37 L 7 43 L 13 43 L 16 37 L 18 31 Z" />
    <path d="M 22 29 L 28 37 L 35 43 L 39 43 L 32 36 L 25 31 Z" />
  </svg>
);

export const IconSilatKickSabit = ({ className = "w-9 h-9", flip = false }: { className?: string; flip?: boolean }) => (
  <svg viewBox="0 0 50 50" className={`${className} ${flip ? 'scale-x-[-1]' : ''}`} fill="currentColor">
    <circle cx="15" cy="15" r="4" />
    <path d="M 12 20 C 14 18, 19 18, 20 20 L 20 28 C 18 30, 13 30, 12 28 Z" />
    <path d="M 15 21 L 9 23 L 10 28 M 19 21 L 24 23 L 24 29" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" />
    <path d="M 14 28 L 13 37 L 13 43 L 17 43 L 17 37 L 18 28 Z" />
    <path d="M 19 26 L 27 22 L 39 15 L 41 18 L 31 25 L 21 29 Z" />
    <path d="M 38 11 L 43 13 L 41 19 L 37 16 Z" />
  </svg>
);

export const IconSilatGuard = ({ className = "w-9 h-9", flip = false }: { className?: string; flip?: boolean }) => (
  <svg viewBox="0 0 50 50" className={`${className} ${flip ? 'scale-x-[-1]' : ''}`} fill="currentColor">
    <circle cx="22" cy="13" r="4" />
    <path d="M 19 18 C 21 17, 26 17, 27 18 L 27 28 C 25 29, 20 29, 19 28 Z" />
    <path d="M 20 19 L 13 15 L 15 10 M 26 19 L 32 15 L 30 10" stroke="currentColor" strokeWidth="2.8" strokeLinecap="round" />
    <path d="M 20 28 L 14 36 L 11 43 L 15 43 L 18 36 L 22 30 Z" />
    <path d="M 25 28 L 30 36 L 36 43 L 40 43 L 34 36 L 28 30 Z" />
  </svg>
);

export const IconSilatKudaKuda = ({ className = "w-9 h-9", flip = false }: { className?: string; flip?: boolean }) => (
  <svg viewBox="0 0 50 50" className={`${className} ${flip ? 'scale-x-[-1]' : ''}`} fill="currentColor">
    <circle cx="24" cy="12" r="4" />
    <path d="M 21 17 C 23 16, 26 16, 27 17 L 27 26 C 25 27, 23 27, 21 26 Z" />
    <path d="M 21 19 L 14 21 L 14 27 M 27 19 L 33 22 L 32 28" stroke="currentColor" strokeWidth="2.8" strokeLinecap="round" />
    <path d="M 21 26 L 13 32 L 9 43 L 14 43 L 17 35 L 23 29 Z" />
    <path d="M 27 26 L 35 32 L 39 43 L 34 43 L 31 35 L 25 29 Z" />
  </svg>
);

// 1. Clenched Fist (Tinju)
export const IconFist = ({ className = "w-9 h-9", flip = false }: { className?: string; flip?: boolean }) => (
  <svg 
    viewBox="0 0 44 44" 
    className={`${className} ${flip ? 'scale-x-[-1]' : ''}`} 
    fill="currentColor"
  >
    {/* Clenched fist silhouette angled forward */}
    <path d="M 12 28 C 11 25, 11 21, 12.5 18 C 14 15, 17 14, 20.5 14 C 22.5 14, 24 14.8, 25.5 16 C 27 15, 29 14.5, 31 15 C 33 15.5, 34.5 17, 35 18.5 C 36.5 18.5, 38 19.5, 38.5 21 C 39 23, 38.5 25.5, 38 27 C 37 31, 34 34, 29 35 L 21 35 C 16.5 35, 13 32, 12 28 Z" />
    {/* Curled thumb locked over front */}
    <path d="M 16 19 C 18 19, 21 20.5, 23 23 C 24 24.5, 24.5 26.5, 23 28 C 21.5 29.5, 18.5 29.5, 16 28 C 14.5 27, 14 24.5, 14.5 22.5 C 15 20.5, 15.5 19.5, 16 19 Z" opacity="0.95" />
    {/* Subtle knuckle cut grooves */}
    <path d="M 23 16.5 L 23 21 M 30 17 L 30 22 M 35 20 L 35 24" stroke="white" strokeWidth="1.2" strokeLinecap="round" />
  </svg>
);

// 2. Pointing Hand (Telunjuk 👉) - matching Slot 2 of uploaded screenshot
export const IconPointing = ({ className = "w-9 h-9", flip = false }: { className?: string; flip?: boolean }) => (
  <svg 
    viewBox="0 0 48 38" 
    className={`${className} ${flip ? 'scale-x-[-1]' : ''}`} 
    fill="currentColor"
  >
    {/* Wrist */}
    <rect x="5" y="12" width="6" height="15" rx="2" />
    {/* Clenched body & extended index finger */}
    <path d="M 11 13.5 C 13 11, 16 10, 19.5 10.5 C 22 11, 23.5 12, 24 13.5 L 41 13.5 C 43.5 13.5, 45 15, 45 17 C 45 19, 43.5 20.5, 41 20.5 L 24 20.5 C 24.5 21.5, 24.8 23, 23.5 24.5 C 22 26.5, 19 27, 16 27 C 13.5 27, 11 25.5, 11 23 Z" />
    {/* Curled thumb underneath index finger */}
    <path d="M 16 16 C 18 16, 20 17.5, 20.5 19.5 C 21 21.5, 19.5 23, 17.5 23.5 C 15 24, 13 22, 13.5 19.5 C 14 17.5, 15 16, 16 16 Z" opacity="0.9" />
  </svg>
);

// 3. Two Fingers V-sign (✌️) - matching Slot 3 of uploaded screenshot
export const IconPeace = ({ className = "w-9 h-9" }: { className?: string }) => (
  <svg viewBox="0 0 44 48" className={className} fill="currentColor">
    {/* Wrist */}
    <rect x="16" y="38" width="12" height="7" rx="2" />
    {/* Fist body */}
    <path d="M 14 26 C 13 29, 13 33, 15 36 C 16.5 38, 19 39, 22 39 C 25 39, 27.5 38, 29 36 C 31 33, 31 29, 30 26 Z" />
    {/* Left Index Finger angled slightly left */}
    <rect x="13.5" y="7" width="5.5" height="22" rx="2.75" transform="rotate(-6 16 18)" />
    {/* Right Middle Finger angled slightly right */}
    <rect x="25" y="7" width="5.5" height="22" rx="2.75" transform="rotate(6 28 18)" />
    {/* Folded thumb across the palm */}
    <path d="M 15 28 C 17 26, 23 26, 27 28 C 28.5 29.5, 28 32, 26 33 C 23 34, 17 33, 15 31 Z" opacity="0.95" />
  </svg>
);

// 4. Open Palm (✋) - matching Slot 4 of uploaded screenshot
export const IconOpenHand = ({ className = "w-9 h-9" }: { className?: string }) => (
  <svg viewBox="0 0 44 48" className={className} fill="currentColor">
    {/* Wrist */}
    <path d="M 17 40 L 18 46 H 26 L 27 40 Z" />
    {/* Palm Center */}
    <path d="M 16 26 C 14 28, 14 34, 16 38 C 18 40, 26 40, 28 38 C 30 34, 30 28, 28 26 Z" />
    {/* Thumb spread out to the left */}
    <path d="M 15 30 C 13 29, 10 27, 8 24 C 6.5 22, 7 19.5, 9 19 C 11 18.5, 13 20, 15 23 Z" />
    {/* 4 Fingers pointing straight UP */}
    <rect x="14" y="11" width="4" height="17" rx="2" />
    <rect x="19" y="6" width="4" height="22" rx="2" />
    <rect x="24" y="9" width="4" height="19" rx="2" />
    <rect x="29" y="14" width="3.8" height="14" rx="1.9" />
  </svg>
);

// 5. Silat Kicking Stance (Tendangan T) - matching Slot 5 of uploaded screenshot
export const IconKickT = ({ className = "w-9 h-9", flip = false }: { className?: string; flip?: boolean }) => (
  <svg 
    viewBox="0 0 48 48" 
    className={`${className} ${flip ? 'scale-x-[-1]' : ''}`} 
    fill="currentColor"
  >
    {/* Head with silat headband/destar */}
    <circle cx="21" cy="11" r="3.8" />
    {/* Torso tilted horizontally */}
    <path d="M 17 16 C 18 14.5, 23 14.5, 24 16 L 24 23 C 23 24.5, 18 24.5, 17 23 Z" />
    {/* Guarding Arms (Sikap Pasang / Tangkisan) */}
    <path d="M 21 16 L 15 19 L 16 23 M 23 17 L 27 20 L 26 24" stroke="currentColor" strokeWidth="2.8" strokeLinecap="round" strokeLinejoin="round" fill="none" />
    {/* Supporting Standing Leg (vertical to ground) */}
    <path d="M 19 23 L 18 34 L 18 42 L 22 42 L 21 34 L 21 23 Z" />
    {/* Foot on floor */}
    <path d="M 16 41 H 23 V 43 H 16 Z" />
    {/* Extended Kicking Leg (Side Kick / Tendangan T straight to the right) */}
    <path d="M 23 21 L 32 20 L 41 18 L 42 21 L 34 23 L 24 25 Z" />
    {/* Kicking Foot/Heel blade */}
    <path d="M 40 16 L 43 17 L 43 23 L 40 22 Z" />
  </svg>
);

// 6. Silat Kicking Pose 2 (Tendangan Sabit / Front Kick) - matching Slot 6 of uploaded screenshot
export const IconKickSabit = ({ className = "w-9 h-9", flip = false }: { className?: string; flip?: boolean }) => (
  <svg 
    viewBox="0 0 48 48" 
    className={`${className} ${flip ? 'scale-x-[-1]' : ''}`} 
    fill="currentColor"
  >
    {/* Head */}
    <circle cx="19" cy="11" r="3.8" />
    {/* Torso */}
    <path d="M 16 16 C 17 14.5, 22 14.5, 23 16 L 23 24 C 22 25.5, 17 25.5, 16 24 Z" />
    {/* Guarding Arms */}
    <path d="M 19 16 L 14 18 L 15 22 M 22 17 L 26 19 L 27 24" stroke="currentColor" strokeWidth="2.8" strokeLinecap="round" strokeLinejoin="round" fill="none" />
    {/* Supporting Leg */}
    <path d="M 18 24 L 17 34 L 17 42 L 21 42 L 20 34 L 20 24 Z" />
    <path d="M 15 41 H 22 V 43 H 15 Z" />
    {/* High angled Roundhouse Kick (Tendangan Sabit) */}
    <path d="M 22 22 L 31 18 L 40 13 L 42 16 L 33 21 L 23 25 Z" />
    <path d="M 39 10 L 43 12 L 42 17 L 39 15 Z" />
  </svg>
);

// 7. Silat Stance (Sikap Pasang Silat)
export const IconStance = ({ className = "w-9 h-9" }: { className?: string }) => (
  <svg viewBox="0 0 48 48" className={className} fill="currentColor">
    <circle cx="24" cy="10" r="3.6" />
    <path d="M 21 14 C 22 13.5, 26 13.5, 27 14 L 27 24 C 26 25, 22 25, 21 24 Z" />
    <path d="M 21 16 L 14 19 L 14 24 M 27 16 L 34 19 L 34 24" stroke="currentColor" strokeWidth="2.8" strokeLinecap="round" strokeLinejoin="round" fill="none" />
    <path d="M 22 24 L 16 33 L 14 41 L 18 41 L 19 35 L 23 26 Z" />
    <path d="M 26 24 L 32 33 L 34 41 L 30 41 L 29 35 L 25 26 Z" />
  </svg>
);

// 8. Silat Punch Pose (Pukulan Lurus)
export const IconPunchPose = ({ className = "w-9 h-9", flip = false }: { className?: string; flip?: boolean }) => (
  <svg 
    viewBox="0 0 48 48" 
    className={`${className} ${flip ? 'scale-x-[-1]' : ''}`} 
    fill="currentColor"
  >
    <circle cx="18" cy="12" r="3.6" />
    <path d="M 15 16 C 16 15, 21 15, 22 16 L 22 26 C 21 27, 16 27, 15 26 Z" />
    {/* Front straight punch extending right */}
    <path d="M 21 17 L 38 17 L 41 18 L 41 21 L 38 21 L 21 21 Z" />
    {/* Guard hand */}
    <path d="M 16 17 L 12 21 L 14 24" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" fill="none" />
    {/* Stance legs */}
    <path d="M 17 26 L 12 36 L 10 42 H 14 L 16 36 L 19 28 Z" />
    <path d="M 20 26 L 27 36 L 29 42 H 25 L 23 36 L 21 28 Z" />
  </svg>
);

// 9. Binaan 1 Classic (1 Jari Horizontal + Manset)
export const IconBinaan1Classic = ({ className = "w-9 h-9", flip = false }: { className?: string; flip?: boolean }) => (
  <svg 
    viewBox="0 0 54 38" 
    className={`${className} ${flip ? 'scale-x-[-1]' : ''}`} 
    fill="currentColor"
  >
    <rect x="4" y="9.5" width="5.5" height="19" rx="1.6" />
    <rect x="9.5" y="13.5" width="4.5" height="11" />
    <path d="M 14 13.5 C 16 9, 21 8.5, 25 8.8 C 27 9, 28 10.5, 28 12 L 45 12 C 47.5 12, 49 13.3, 49 15.2 C 49 17.1, 47.5 18.5, 45 18.5 L 27.5 18.5 C 29 19.8, 29 23, 27.5 25 C 25.5 27.5, 22 28.5, 17 28.5 C 14.5 28.5, 14 26, 14 24.5 Z" />
  </svg>
);

// 10. Binaan 2 Classic (2 Jari Horizontal + Manset)
export const IconBinaan2Classic = ({ className = "w-9 h-9", flip = false }: { className?: string; flip?: boolean }) => (
  <svg 
    viewBox="0 0 54 38" 
    className={`${className} ${flip ? 'scale-x-[-1]' : ''}`} 
    fill="currentColor"
  >
    <rect x="4" y="9.5" width="5.5" height="19" rx="1.6" />
    <rect x="9.5" y="13.5" width="4.5" height="11" />
    <path d="M 14 13.5 C 16 9, 20.5 8.5, 24 8.8 L 44 7.2 C 46.5 7, 48 8.4, 48 10.2 C 48 12, 46.5 13.2, 44 13.5 L 26.5 15.5 C 26.2 16.5, 26.2 17.5, 26.5 18.5 L 43.5 19 C 46 19, 47.5 20.4, 47.5 22.2 C 47.5 24, 46 25.2, 43.5 25.2 L 27 25 C 25 27.5, 22 28.5, 17 28.5 C 14.5 28.5, 14 26, 14 24.5 Z" />
  </svg>
);

// 11. Teguran 1 Classic (1 Jari Tegak Ke Atas)
export const IconTeguran1Classic = ({ className = "w-9 h-9" }: { className?: string }) => (
  <svg viewBox="0 0 44 48" className={className} fill="currentColor">
    <path d="M 16.5 40 L 17.5 46.5 H 26.5 L 27.5 40 Z" />
    <path d="M 17 40 C 12.5 40, 10.5 35.5, 10.5 29.5 C 10.5 24.5, 13 21.5, 16 21 L 19 21 L 19 5.5 C 19 3, 20.5 1.5, 22.5 1.5 C 24.5 1.5, 26 3, 26 5.5 L 26 21 L 28 21 C 31 21.5, 33.5 24.5, 33.5 29.5 C 33.5 35.5, 31.5 40, 27 40 Z" />
  </svg>
);

// 12. Teguran 2 Classic (2 Jari V-sign Tegak Ke Atas)
export const IconTeguran2Classic = ({ className = "w-9 h-9" }: { className?: string }) => (
  <svg viewBox="0 0 44 48" className={className} fill="currentColor">
    <path d="M 16.5 40 L 17.5 46.5 H 26.5 L 27.5 40 Z" />
    <path d="M 17 40 C 12.5 40, 10.5 35.5, 10.5 29.5 C 10.5 24.5, 13 21.5, 16 21 L 12.8 6.5 C 12.2 4.2, 13.8 2.2, 16 2.2 C 18 2.2, 19.5 3.8, 19.8 6 L 22 20.5 L 24.2 6 C 24.5 3.8, 26 2.2, 28 2.2 C 30.2 2.2, 31.8 4.2, 31.2 6.5 L 28 21 C 31 21.5, 33.5 24.5, 33.5 29.5 C 33.5 35.5, 31.5 40, 27 40 Z" />
  </svg>
);

// 13. Peringatan 1 Classic (1 Telapak Tangan)
export const IconPeringatan1Classic = ({ className = "w-9 h-9" }: { className?: string }) => (
  <svg viewBox="0 0 44 48" className={className} fill="currentColor">
    <path d="M 17.5 39.5 L 18.5 46.5 H 25.5 L 26.5 39.5 Z" />
    <path d="M 17.5 39.5 C 14.5 39.5, 12 36, 12 31 C 12 28.5, 13 26.5, 14 25 L 30 25 C 31 26.5, 32 28.5, 32 31 C 32 36, 29.5 39.5, 26.5 39.5 Z" />
    <path d="M 13.5 29 C 11.5 28.5, 9.5 27, 7.5 24.5 C 6 22.8, 6.2 20.5, 7.8 19.2 C 9.5 18, 11.8 18.5, 13.2 20.5 L 15 23 Z" />
    <rect x="13.5" y="9.5" width="4.2" height="16" rx="2.1" />
    <rect x="18.5" y="4.5" width="4.2" height="21" rx="2.1" />
    <rect x="23.5" y="7" width="4.2" height="18.5" rx="2.1" />
    <rect x="28.5" y="12" width="4" height="13.5" rx="2" />
  </svg>
);

// 14. Peringatan 2 Classic (2 Telapak Tangan)
export const IconPeringatan2Classic = ({ className = "w-11 h-9" }: { className?: string }) => (
  <svg viewBox="0 0 78 48" className={className} fill="currentColor">
    <g transform="translate(1, 0)">
      <path d="M 17.5 39.5 L 18.5 46.5 H 25.5 L 26.5 39.5 Z" />
      <path d="M 17.5 39.5 C 14.5 39.5, 12 36, 12 31 C 12 28.5, 13 26.5, 14 25 L 30 25 C 31 26.5, 32 28.5, 32 31 C 32 36, 29.5 39.5, 26.5 39.5 Z" />
      <path d="M 13.5 29 C 11.5 28.5, 9.5 27, 7.5 24.5 C 6 22.8, 6.2 20.5, 7.8 19.2 C 9.5 18, 11.8 18.5, 13.2 20.5 L 15 23 Z" />
      <rect x="13.5" y="9.5" width="4.2" height="16" rx="2.1" />
      <rect x="18.5" y="4.5" width="4.2" height="21" rx="2.1" />
      <rect x="23.5" y="7" width="4.2" height="18.5" rx="2.1" />
      <rect x="28.5" y="12" width="4" height="13.5" rx="2" />
    </g>
    <g transform="translate(38, 0)">
      <path d="M 17.5 39.5 L 18.5 46.5 H 25.5 L 26.5 39.5 Z" />
      <path d="M 17.5 39.5 C 14.5 39.5, 12 36, 12 31 C 12 28.5, 13 26.5, 14 25 L 30 25 C 31 26.5, 32 28.5, 32 31 C 32 36, 29.5 39.5, 26.5 39.5 Z" />
      <path d="M 13.5 29 C 11.5 28.5, 9.5 27, 7.5 24.5 C 6 22.8, 6.2 20.5, 7.8 19.2 C 9.5 18, 11.8 18.5, 13.2 20.5 L 15 23 Z" />
      <rect x="13.5" y="9.5" width="4.2" height="16" rx="2.1" />
      <rect x="18.5" y="4.5" width="4.2" height="21" rx="2.1" />
      <rect x="23.5" y="7" width="4.2" height="18.5" rx="2.1" />
      <rect x="28.5" y="12" width="4" height="13.5" rx="2" />
    </g>
  </svg>
);

// Silhouette: Referee / Wasit Gesturing (at bottom center of reference image)
export const IconWasitGesture = ({ className = "w-10 h-12" }: { className?: string }) => (
  <svg viewBox="0 0 50 60" className={className} fill="currentColor">
    {/* Head with short referee hair */}
    <circle cx="26" cy="11" r="5.5" />
    {/* Body / Suit jacket & Tie */}
    <path d="M 18 20 C 20 18, 30 18, 33 20 L 37 36 C 36 38, 15 38, 14 36 Z" />
    {/* Tie */}
    <path d="M 25 19 L 27 19 L 26.5 28 L 25.5 28 Z" fill="white" />
    {/* Left Arm raised to ear/head (Wireless headset/earpiece signaling) */}
    <path d="M 20 21 L 14 18 L 19 9 L 22 10 L 17 17 L 22 22 Z" />
    {/* Right Arm at side */}
    <path d="M 33 21 L 36 28 L 35 34 L 32 34 L 33 27 Z" />
  </svg>
);

// Silhouette: Silat Fighter Kicking (at bottom center of reference image)
export const IconSilatKicker = ({ className = "w-12 h-12" }: { className?: string }) => (
  <svg viewBox="0 0 60 60" className={className} fill="currentColor">
    {/* Head */}
    <circle cx="25" cy="14" r="5" />
    {/* Torso horizontal */}
    <path d="M 20 20 C 22 18, 28 18, 30 20 L 30 29 C 28 31, 22 31, 20 29 Z" />
    {/* Guard arms */}
    <path d="M 25 20 L 17 24 L 18 30 M 28 21 L 34 25 L 33 31" stroke="currentColor" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round" fill="none" />
    {/* Standing support leg */}
    <path d="M 23 29 L 22 43 L 22 54 L 27 54 L 26 43 L 26 29 Z" />
    <path d="M 20 53 H 28 V 56 H 20 Z" />
    {/* Straight Side Kick (Tendangan T) to right */}
    <path d="M 29 26 L 40 25 L 53 23 L 54 27 L 43 30 L 30 31 Z" />
    <path d="M 52 20 L 56 21 L 55 29 L 52 27 Z" />
  </svg>
);

// Universal renderer
export function renderPenaltyIcon(
  type: PenaltyIconType | string, 
  className: string = "w-8 h-8 sm:w-10 sm:h-10", 
  flip: boolean = false,
  customImages?: Record<string, string>,
  imgStyle?: React.CSSProperties
) {
  // Check if type is an image data URL, URL path, or found in customImages dictionary
  const imgSrc = (customImages && customImages[type])
    ? customImages[type]
    : (typeof type === 'string' && (type.startsWith('data:image/') || type.startsWith('http://') || type.startsWith('https://') || type.startsWith('/') || type.startsWith('blob:')))
    ? type
    : null;

  if (imgSrc) {
    return (
      <img
        src={imgSrc}
        alt="Icon Hukuman PNG"
        style={imgStyle}
        referrerPolicy="no-referrer"
        className={`${className} object-contain select-none drop-shadow-sm ${flip ? 'scale-x-[-1]' : ''}`}
        loading="lazy"
      />
    );
  }

  switch (type) {
    case 'silat_sweep':
      return <IconSilatSweep className={className} flip={flip} />;
    case 'silat_kick_t':
      return <IconSilatKickT className={className} flip={flip} />;
    case 'silat_defense':
      return <IconSilatDefense className={className} flip={flip} />;
    case 'silat_kick_sabit':
      return <IconSilatKickSabit className={className} flip={flip} />;
    case 'silat_guard':
      return <IconSilatGuard className={className} flip={flip} />;
    case 'silat_kuda_kuda':
      return <IconSilatKudaKuda className={className} flip={flip} />;
    case 'fist':
      return <IconFist className={className} flip={flip} />;
    case 'pointing':
      return <IconPointing className={className} flip={flip} />;
    case 'peace':
      return <IconPeace className={className} />;
    case 'hand':
      return <IconOpenHand className={className} />;
    case 'kick_t':
      return <IconKickT className={className} flip={flip} />;
    case 'kick_sabit':
      return <IconKickSabit className={className} flip={flip} />;
    case 'stance':
      return <IconStance className={className} />;
    case 'punch_pose':
      return <IconPunchPose className={className} flip={flip} />;
    case 'binaan1':
      return <Binaan1Icon active={false} side={flip ? 'merah' : 'biru'} className={className} />;
    case 'binaan2':
      return <Binaan2Icon active={false} side={flip ? 'merah' : 'biru'} className={className} />;
    case 'teguran1':
      return <Teguran1Icon active={false} side={flip ? 'merah' : 'biru'} className={className} />;
    case 'teguran2':
      return <Teguran2Icon active={false} side={flip ? 'merah' : 'biru'} className={className} />;
    case 'peringatan1':
      return <Peringatan1Icon side={flip ? 'merah' : 'biru'} className={className} />;
    case 'peringatan2':
      return <Peringatan2Icon side={flip ? 'merah' : 'biru'} className={className} />;
    case 'disqualified':
      return <DisqualifikasiIcon className={className} />;
    case 'binaan1_classic':
      return <IconBinaan1Classic className={className} flip={flip} />;
    case 'binaan2_classic':
      return <IconBinaan2Classic className={className} flip={flip} />;
    case 'teguran1_classic':
      return <IconTeguran1Classic className={className} />;
    case 'teguran2_classic':
      return <IconTeguran2Classic className={className} />;
    case 'peringatan1_classic':
      return <IconPeringatan1Classic className={className} />;
    case 'peringatan2_classic':
      return <IconPeringatan2Classic className={className} />;
    default:
      return <IconSilatSweep className={className} flip={flip} />;
  }
}

export const STANDARDIZED_BADGE_CATALOG: { type: string; label: string; sub: string; points: string; src: string }[] = [
  { type: STANDARDIZED_PENALTY_ASSETS.warning1, label: 'Peringatan 1 (Official Shield)', sub: 'Warning 1 Kuning Transparan', points: '-5 Poin', src: STANDARDIZED_PENALTY_ASSETS.warning1 },
  { type: STANDARDIZED_PENALTY_ASSETS.warning2, label: 'Peringatan 2 (Official Dual)', sub: 'Warning 2 Oranye Transparan', points: '-10 Poin', src: STANDARDIZED_PENALTY_ASSETS.warning2 },
  { type: STANDARDIZED_PENALTY_ASSETS.disqualification, label: 'Diskualifikasi (DQ Shield)', sub: 'Red Card / Stop Shield Transparan', points: 'Diskualifikasi', src: STANDARDIZED_PENALTY_ASSETS.disqualification },
  { type: STANDARDIZED_PENALTY_ASSETS.teguran1, label: 'Teguran 1 (Satu Jari Badge)', sub: 'Reprimand 1 Emas & Biru Transparan', points: '-1 Poin', src: STANDARDIZED_PENALTY_ASSETS.teguran1 },
  { type: STANDARDIZED_PENALTY_ASSETS.teguran2, label: 'Teguran 2 (Dua Jari Badge)', sub: 'Reprimand 2 Emas & Biru Transparan', points: '-2 Poin', src: STANDARDIZED_PENALTY_ASSETS.teguran2 },
];

export const ICON_CATALOG: { type: PenaltyIconType | string; label: string; icon: React.ReactNode }[] = [
  // Official referee gesture vector icons (PERSILAT Standard)
  { type: 'binaan1', label: 'Binaan 1 (Isyarat 1 Jari)', icon: <Binaan1Icon className="w-6 h-6" /> },
  { type: 'binaan2', label: 'Binaan 2 (Isyarat 2 Jari)', icon: <Binaan2Icon className="w-6 h-6" /> },
  { type: 'teguran1', label: 'Teguran 1 (Telunjuk ☝️ -1)', icon: <Teguran1Icon className="w-6 h-6" /> },
  { type: 'teguran2', label: 'Teguran 2 (Dua Jari ✌️ -2)', icon: <Teguran2Icon className="w-6 h-6" /> },
  { type: 'peringatan1', label: 'Peringatan 1 (Badge -5)', icon: <Peringatan1Icon className="w-6 h-6" /> },
  { type: 'peringatan2', label: 'Peringatan 2 (Hazard -10)', icon: <Peringatan2Icon className="w-6 h-6" /> },
  { type: 'disqualified', label: 'Diskualifikasi (Kartu Merah)', icon: <DisqualifikasiIcon className="w-6 h-6" /> },

  // Standardized visual badges generated with Imagen (Transparent PNGs)
  { 
    type: STANDARDIZED_PENALTY_ASSETS.warning1, 
    label: 'Shield Peringatan 1 (-5)', 
    icon: <img src={STANDARDIZED_PENALTY_ASSETS.warning1} alt="Warning 1" referrerPolicy="no-referrer" className="w-6 h-6 object-contain" /> 
  },
  { 
    type: STANDARDIZED_PENALTY_ASSETS.warning2, 
    label: 'Shield Peringatan 2 (-10)', 
    icon: <img src={STANDARDIZED_PENALTY_ASSETS.warning2} alt="Warning 2" referrerPolicy="no-referrer" className="w-6 h-6 object-contain" /> 
  },
  { 
    type: STANDARDIZED_PENALTY_ASSETS.disqualification, 
    label: 'Shield Diskualifikasi (DQ)', 
    icon: <img src={STANDARDIZED_PENALTY_ASSETS.disqualification} alt="DQ" referrerPolicy="no-referrer" className="w-6 h-6 object-contain" /> 
  },
  { 
    type: STANDARDIZED_PENALTY_ASSETS.teguran1, 
    label: 'Badge Teguran 1 (-1)', 
    icon: <img src={STANDARDIZED_PENALTY_ASSETS.teguran1} alt="Teguran 1" referrerPolicy="no-referrer" className="w-6 h-6 object-contain" /> 
  },
  { 
    type: STANDARDIZED_PENALTY_ASSETS.teguran2, 
    label: 'Badge Teguran 2 (-2)', 
    icon: <img src={STANDARDIZED_PENALTY_ASSETS.teguran2} alt="Teguran 2" referrerPolicy="no-referrer" className="w-6 h-6 object-contain" /> 
  },

  // Gesture & Action Silhouettes from match screen reference
  { type: 'fist', label: 'Tinju (Fist)', icon: <IconFist className="w-6 h-6" /> },
  { type: 'pointing', label: 'Telunjuk (Pointing)', icon: <IconPointing className="w-6 h-6" /> },
  { type: 'peace', label: 'Dua Jari (Peace / V)', icon: <IconPeace className="w-6 h-6" /> },
  { type: 'hand', label: 'Telapak Terbuka', icon: <IconOpenHand className="w-6 h-6" /> },
  { type: 'kick_t', label: 'Tendangan T Silat', icon: <IconKickT className="w-6 h-6" /> },
  { type: 'kick_sabit', label: 'Tendangan Sabit Silat', icon: <IconKickSabit className="w-6 h-6" /> },
  { type: 'silat_sweep', label: 'Siluet Sapuan Bawah', icon: <IconSilatSweep className="w-6 h-6" /> },
  { type: 'silat_defense', label: 'Siluet Pasang Bawah', icon: <IconSilatDefense className="w-6 h-6" /> },
  { type: 'silat_guard', label: 'Siluet Pasang Atas', icon: <IconSilatGuard className="w-6 h-6" /> },
  { type: 'silat_kuda_kuda', label: 'Siluet Kuda-Kuda', icon: <IconSilatKudaKuda className="w-6 h-6" /> },
  { type: 'stance', label: 'Pasang Silat', icon: <IconStance className="w-6 h-6" /> },
  { type: 'punch_pose', label: 'Pukulan Silat', icon: <IconPunchPose className="w-6 h-6" /> },
  { type: 'binaan1_classic', label: 'Binaan 1 (Siluet Klasik)', icon: <IconBinaan1Classic className="w-6 h-6" /> },
  { type: 'binaan2_classic', label: 'Binaan 2 (Siluet Klasik)', icon: <IconBinaan2Classic className="w-6 h-6" /> },
  { type: 'teguran1_classic', label: 'Teguran 1 (Siluet Klasik)', icon: <IconTeguran1Classic className="w-6 h-6" /> },
  { type: 'teguran2_classic', label: 'Teguran 2 (Siluet Klasik)', icon: <IconTeguran2Classic className="w-6 h-6" /> },
  { type: 'peringatan1_classic', label: 'Peringatan 1 (Siluet Klasik)', icon: <IconPeringatan1Classic className="w-6 h-6" /> },
  { type: 'peringatan2_classic', label: 'Peringatan 2 (Siluet Klasik)', icon: <IconPeringatan2Classic className="w-7 h-6" /> },
];
