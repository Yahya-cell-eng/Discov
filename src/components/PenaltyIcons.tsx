/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';

export interface PenaltyIconProps {
  active?: boolean;
  side?: 'biru' | 'merah';
  className?: string;
}

/**
 * BINAAN 1 Icon (Bukan siluet - Ilustrasi tangan realistis berbusana wasit/kulit natural):
 * Simbol tangan wasit menunjuk 1 jari telunjuk ke samping / arah atlet (👉 Pointing Hand).
 * Desain berwarna penuh (full color illustration) dengan detail ruas jari, kuku, jempol, dan lengan baju wasit putih.
 */
export const Binaan1Icon: React.FC<PenaltyIconProps> = ({
  className = 'w-7 h-7'
}) => (
  <div className="flex items-center justify-center">
    <svg
      viewBox="0 0 36 36"
      className={className}
      xmlns="http://www.w3.org/2000/svg"
    >
      <defs>
        {/* Gradasi warna kulit natural tangan */}
        <linearGradient id="skinGradB1" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#fcd34d" />
          <stop offset="60%" stopColor="#f59e0b" />
          <stop offset="100%" stopColor="#d97706" />
        </linearGradient>
        {/* Gradasi lengan baju putih wasit */}
        <linearGradient id="sleeveGradB1" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#ffffff" />
          <stop offset="100%" stopColor="#cbd5e1" />
        </linearGradient>
      </defs>

      {/* Lengan kemeja wasit (putih dengan bayangan halus) */}
      <rect x="2" y="11" width="5.5" height="14" rx="2" fill="url(#sleeveGradB1)" stroke="#475569" strokeWidth="1" />
      <line x1="7.5" y1="11" x2="7.5" y2="25" stroke="#334155" strokeWidth="1.2" />

      {/* Telapak kepalan tangan dasar */}
      <rect x="7" y="12" width="10" height="12" rx="3" fill="url(#skinGradB1)" stroke="#b45309" strokeWidth="1" />

      {/* Telunjuk menunjuk lurus ke samping (horizontal 1 jari 👉) */}
      <path
        d="M13 12.5 H31 C32.4 12.5 33.5 13.6 33.5 15 C33.5 16.4 32.4 17.5 31 17.5 H16"
        fill="url(#skinGradB1)"
        stroke="#b45309"
        strokeWidth="1"
      />
      {/* Kuku jari telunjuk */}
      <path
        d="M29 13.5 H31.5 C32.3 13.5 32.8 14.1 32.8 15 C32.8 15.9 32.3 16.5 31.5 16.5 H29"
        fill="#fef08a"
        stroke="#d97706"
        strokeWidth="0.6"
      />
      {/* Ruas jari telunjuk */}
      <line x1="22" y1="13" x2="22" y2="17" stroke="#b45309" strokeWidth="0.7" />

      {/* Jempol melipat di depan jari-jari */}
      <path
        d="M10 12 C10 9.8 12.5 8.5 15 9.5 C16.5 10.2 17.5 12 17.5 14 L17.5 17.5 L12 17.5 Z"
        fill="#fbbf24"
        stroke="#b45309"
        strokeWidth="1"
      />
      {/* Kuku jempol */}
      <path
        d="M13.2 9.8 C14 9.4 15.2 9.8 15.6 10.6 C15.8 11.2 15.6 11.8 15 12.2"
        fill="none"
        stroke="#fef08a"
        strokeWidth="1"
      />

      {/* Lipatan jari tengah, jari manis, kelingking terkatup rapat di bawah telunjuk */}
      <rect x="13.5" y="17.2" width="7" height="3" rx="1.5" fill="#f59e0b" stroke="#b45309" strokeWidth="0.8" />
      <rect x="12" y="20" width="7.5" height="3" rx="1.5" fill="#d97706" stroke="#92400e" strokeWidth="0.8" />
      <rect x="10.5" y="22.5" width="7.5" height="2.5" rx="1.25" fill="#b45309" stroke="#78350f" strokeWidth="0.8" />
    </svg>
  </div>
);

/**
 * BINAAN 2 Icon (Bukan siluet - Ilustrasi tangan realistis 2 JARI KE SAMPING 👉👉):
 * Simbol tangan wasit menunjuk 2 jari (telunjuk & jari tengah) terentang lurus horizontal ke samping.
 * Memiliki celah pemisah yang tegas dan nyata antara kedua jari, kuku lengkap, ruas jari,
 * jempol terlipat, serta lengan baju wasit.
 */
export const Binaan2Icon: React.FC<PenaltyIconProps> = ({
  className = 'w-7 h-7'
}) => (
  <div className="flex items-center justify-center">
    <svg
      viewBox="0 0 36 36"
      className={className}
      xmlns="http://www.w3.org/2000/svg"
    >
      <defs>
        <linearGradient id="skinGradB2" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#fde047" />
          <stop offset="50%" stopColor="#f59e0b" />
          <stop offset="100%" stopColor="#d97706" />
        </linearGradient>
        <linearGradient id="sleeveGradB2" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#ffffff" />
          <stop offset="100%" stopColor="#cbd5e1" />
        </linearGradient>
      </defs>

      {/* Lengan kemeja wasit */}
      <rect x="1.5" y="10" width="6" height="15" rx="2" fill="url(#sleeveGradB2)" stroke="#475569" strokeWidth="1" />
      <line x1="7.5" y1="10" x2="7.5" y2="25" stroke="#334155" strokeWidth="1.2" />

      {/* Telapak tangan dasar kepalan */}
      <rect x="7" y="10" width="10" height="15" rx="3" fill="url(#skinGradB2)" stroke="#b45309" strokeWidth="1" />

      {/* JARI 1 KE SAMPING: Telunjuk menunjuk horizontal ke kanan */}
      <path
        d="M13 9.5 H30.5 C32 9.5 33 10.5 33 11.8 C33 13.1 32 14.1 30.5 14.1 H15"
        fill="url(#skinGradB2)"
        stroke="#b45309"
        strokeWidth="1"
      />
      {/* Kuku jari telunjuk */}
      <path
        d="M28.5 10.3 H31 C31.8 10.3 32.3 10.9 32.3 11.8 C32.3 12.7 31.8 13.3 31 13.3 H28.5"
        fill="#fef08a"
        stroke="#d97706"
        strokeWidth="0.6"
      />
      {/* Garis ruas telunjuk */}
      <line x1="22" y1="10" x2="22" y2="13.8" stroke="#b45309" strokeWidth="0.7" />

      {/* BAYANGAN CELAH PEMISAH ANTAR DUA JARI (Jelas & Terbuka) */}
      <path d="M14 14.2 H28" stroke="#92400e" strokeWidth="1" strokeLinecap="round" />

      {/* JARI 2 KE SAMPING: Jari tengah menunjuk horizontal ke kanan */}
      <path
        d="M13 16.5 H30 C31.5 16.5 32.5 17.5 32.5 18.8 C32.5 20.1 31.5 21.1 30 21.1 H15"
        fill="url(#skinGradB2)"
        stroke="#b45309"
        strokeWidth="1"
      />
      {/* Kuku jari tengah */}
      <path
        d="M28 17.3 H30.5 C31.3 17.3 31.8 17.9 31.8 18.8 C31.8 19.7 31.3 20.3 30.5 20.3 H28"
        fill="#fef08a"
        stroke="#d97706"
        strokeWidth="0.6"
      />
      {/* Garis ruas jari tengah */}
      <line x1="21.5" y1="17" x2="21.5" y2="20.8" stroke="#b45309" strokeWidth="0.7" />

      {/* Jempol melipat di depan kepalan */}
      <path
        d="M9 11.5 C9 9 12 7.8 14.5 9 C16 9.8 16.8 11.5 16.8 13.5 L16.8 17.5 L11.5 17.5 Z"
        fill="#fbbf24"
        stroke="#b45309"
        strokeWidth="1"
      />
      {/* Kuku jempol */}
      <path
        d="M12.8 9.3 C13.6 8.9 14.7 9.2 15.1 10 C15.3 10.6 15.1 11.2 14.5 11.6"
        fill="none"
        stroke="#fef08a"
        strokeWidth="0.9"
      />

      {/* Lipatan jari manis & kelingking di bawah jari tengah */}
      <rect x="11" y="21.8" width="7" height="2.8" rx="1.4" fill="#d97706" stroke="#92400e" strokeWidth="0.8" />
      <rect x="9.5" y="24.4" width="7" height="2.4" rx="1.2" fill="#b45309" stroke="#78350f" strokeWidth="0.8" />
    </svg>
  </div>
);

/**
 * TEGURAN 1 Icon (Bukan siluet - Ilustrasi tangan realistis 1 jari tegak ke atas ☝️):
 * Simbol tangan wasit mengacungkan 1 jari telunjuk tegak ke atas.
 * Penuh detail berwarna natural.
 */
export const Teguran1Icon: React.FC<PenaltyIconProps> = ({
  className = 'w-7 h-7'
}) => (
  <div className="flex items-center justify-center">
    <svg
      viewBox="0 0 36 36"
      className={className}
      xmlns="http://www.w3.org/2000/svg"
    >
      <defs>
        <linearGradient id="skinGradT1" x1="0%" y1="100%" x2="0%" y2="0%">
          <stop offset="0%" stopColor="#d97706" />
          <stop offset="50%" stopColor="#f59e0b" />
          <stop offset="100%" stopColor="#fcd34d" />
        </linearGradient>
        <linearGradient id="sleeveGradT1" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#ffffff" />
          <stop offset="100%" stopColor="#cbd5e1" />
        </linearGradient>
      </defs>

      {/* Lengan kemeja wasit di bawah */}
      <rect x="11" y="26.5" width="14" height="6.5" rx="2" fill="url(#sleeveGradT1)" stroke="#475569" strokeWidth="1" />
      <line x1="11" y1="26.5" x2="25" y2="26.5" stroke="#334155" strokeWidth="1.2" />

      {/* Telapak tangan bagian kepalan */}
      <rect x="9.5" y="14" width="17" height="13" rx="4" fill="url(#skinGradT1)" stroke="#b45309" strokeWidth="1" />

      {/* Jari telunjuk mengacung tegak lurus ke atas */}
      <path
        d="M12.5 17 V5.5 C12.5 4.1 13.6 3 15 3 C16.4 3 17.5 4.1 17.5 5.5 V17"
        fill="url(#skinGradT1)"
        stroke="#b45309"
        strokeWidth="1"
      />
      {/* Kuku telunjuk */}
      <path
        d="M13.5 4.5 C13.5 3.7 14.1 3.2 15 3.2 C15.9 3.2 16.5 3.7 16.5 4.5 V7.5 H13.5 Z"
        fill="#fef08a"
        stroke="#d97706"
        strokeWidth="0.6"
      />
      {/* Garis ruas telunjuk */}
      <line x1="13.2" y1="9" x2="16.8" y2="9" stroke="#b45309" strokeWidth="0.8" />
      <line x1="13.2" y1="13" x2="16.8" y2="13" stroke="#b45309" strokeWidth="0.8" />

      {/* Lipatan jari tengah, manis, kelingking */}
      <rect x="17.5" y="14.5" width="4" height="7.5" rx="2" fill="#fbbf24" stroke="#b45309" strokeWidth="0.8" />
      <rect x="21" y="15.5" width="3.8" height="7" rx="1.9" fill="#f59e0b" stroke="#b45309" strokeWidth="0.8" />
      <rect x="24.2" y="17" width="3.2" height="6" rx="1.6" fill="#d97706" stroke="#92400e" strokeWidth="0.8" />

      {/* Jempol melipat di depan */}
      <path
        d="M10 21 C10 18 13.5 17 17 18.5 C17.8 19 17.8 21.5 16.5 22.5 L12.5 23.5 Z"
        fill="#fcd34d"
        stroke="#b45309"
        strokeWidth="0.9"
      />
      <path
        d="M15.5 19 C16 19.5 16.5 20.2 16.2 21"
        fill="none"
        stroke="#d97706"
        strokeWidth="0.8"
      />
    </svg>
  </div>
);

/**
 * TEGURAN 2 Icon (Bukan siluet - Ilustrasi tangan 2 jari tegak V sign ✌️):
 * Simbol tangan wasit mengacungkan 2 jari tegak ke atas membentuk huruf V.
 * Detail kuku, celah antar jari, warna kulit bergradasi, dan kemeja wasit.
 */
export const Teguran2Icon: React.FC<PenaltyIconProps> = ({
  className = 'w-7 h-7'
}) => (
  <div className="flex items-center justify-center">
    <svg
      viewBox="0 0 36 36"
      className={className}
      xmlns="http://www.w3.org/2000/svg"
    >
      <defs>
        <linearGradient id="skinGradT2" x1="0%" y1="100%" x2="0%" y2="0%">
          <stop offset="0%" stopColor="#d97706" />
          <stop offset="50%" stopColor="#f59e0b" />
          <stop offset="100%" stopColor="#fcd34d" />
        </linearGradient>
        <linearGradient id="sleeveGradT2" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#ffffff" />
          <stop offset="100%" stopColor="#cbd5e1" />
        </linearGradient>
      </defs>

      {/* Lengan baju wasit di bawah */}
      <rect x="11" y="26.5" width="14" height="6.5" rx="2" fill="url(#sleeveGradT2)" stroke="#475569" strokeWidth="1" />
      <line x1="11" y1="26.5" x2="25" y2="26.5" stroke="#334155" strokeWidth="1.2" />

      {/* Telapak kepalan */}
      <rect x="9.5" y="14" width="17" height="13" rx="4" fill="url(#skinGradT2)" stroke="#b45309" strokeWidth="1" />

      {/* Jari 1: Telunjuk condong sedikit ke kiri */}
      <path
        d="M12 17 L10 5.8 C9.8 4.4 10.7 3.2 12.1 3 C13.5 2.8 14.7 3.7 14.9 5.1 L16 16"
        fill="url(#skinGradT2)"
        stroke="#b45309"
        strokeWidth="1"
      />
      {/* Kuku jari telunjuk */}
      <path
        d="M10.8 4.2 C11.3 3.6 12.2 3.4 12.8 3.8 C13.4 4.2 13.6 5 13.4 5.6 L12.5 7.8 L10.4 6.8 Z"
        fill="#fef08a"
        stroke="#d97706"
        strokeWidth="0.5"
      />

      {/* Jari 2: Jari tengah condong ke kanan */}
      <path
        d="M17 16 L20 5.2 C20.3 3.8 21.6 3 23 3.3 C24.4 3.6 25.2 4.9 24.9 6.3 L22 17"
        fill="url(#skinGradT2)"
        stroke="#b45309"
        strokeWidth="1"
      />
      {/* Kuku jari tengah */}
      <path
        d="M21.5 4.5 C22.2 4 23.1 4.2 23.6 4.8 C24.1 5.4 24 6.3 23.5 6.9 L21.8 8.8 L20.2 7.5 Z"
        fill="#fef08a"
        stroke="#d97706"
        strokeWidth="0.5"
      />

      {/* Ruas jari */}
      <line x1="12" y1="9" x2="14.5" y2="9.5" stroke="#b45309" strokeWidth="0.8" />
      <line x1="20" y1="9.5" x2="22.5" y2="10" stroke="#b45309" strokeWidth="0.8" />

      {/* Jari manis dan kelingking melipat */}
      <rect x="21" y="16" width="4.5" height="6.5" rx="2.2" fill="#f59e0b" stroke="#b45309" strokeWidth="0.8" />
      <rect x="23.8" y="17.5" width="3.2" height="5" rx="1.6" fill="#d97706" stroke="#92400e" strokeWidth="0.8" />

      {/* Jempol mengunci di depan */}
      <path
        d="M10 21.5 C10 18.5 13.5 17.5 17.5 18.8 C18.5 19.3 18.2 21.8 17 22.8 L12.5 24 Z"
        fill="#fcd34d"
        stroke="#b45309"
        strokeWidth="0.9"
      />
    </svg>
  </div>
);

/**
 * PERINGATAN 1 Icon (Bukan siluet - Lencana medali 3D warna resmi):
 * Lingkaran biru/merah dengan bezel berkilau, highlight 3D, dan tanda seru tebal putih.
 */
export const Peringatan1Icon: React.FC<PenaltyIconProps> = ({
  side = 'biru',
  className = 'w-6 h-6'
}) => (
  <div className="flex items-center justify-center">
    <svg viewBox="0 0 28 28" className={className} xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id={`per1Grad_${side}`} x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor={side === 'biru' ? '#38bdf8' : '#f87171'} />
          <stop offset="45%" stopColor={side === 'biru' ? '#0284c7' : '#dc2626'} />
          <stop offset="100%" stopColor={side === 'biru' ? '#0369a1' : '#991b1b'} />
        </linearGradient>
        <radialGradient id={`per1Glow_${side}`} cx="35%" cy="30%" r="65%">
          <stop offset="0%" stopColor="#ffffff" stopOpacity="0.7" />
          <stop offset="50%" stopColor="#ffffff" stopOpacity="0" />
        </radialGradient>
      </defs>

      {/* Lingkaran luar berbingkai emas/perak */}
      <circle cx="14" cy="14" r="13" fill={`url(#per1Grad_${side})`} stroke="#ffffff" strokeWidth="1.2" />
      {/* Pantulan cahaya atas (kaca mengkilap) */}
      <ellipse cx="14" cy="8" rx="8" ry="4" fill="white" opacity="0.25" />
      
      {/* Tanda seru putih tebal dengan bayangan */}
      <rect x="12.5" y="6.5" width="3" height="9" rx="1.5" fill="#ffffff" filter="drop-shadow(0px 1px 1px rgba(0,0,0,0.4))" />
      <circle cx="14" cy="19.5" r="1.8" fill="#ffffff" filter="drop-shadow(0px 1px 1px rgba(0,0,0,0.4))" />
    </svg>
  </div>
);

/**
 * PERINGATAN 2 Icon (Bukan siluet - Rambu segitiga bahaya 3D warna resmi):
 * Segitiga hazard bervolume dengan border tebal putih dan tanda seru tebal.
 */
export const Peringatan2Icon: React.FC<PenaltyIconProps> = ({
  side = 'biru',
  className = 'w-6 h-6'
}) => (
  <div className="flex items-center justify-center">
    <svg viewBox="0 0 28 28" className={className} xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id={`per2Grad_${side}`} x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor={side === 'biru' ? '#38bdf8' : '#f87171'} />
          <stop offset="60%" stopColor={side === 'biru' ? '#0284c7' : '#dc2626'} />
          <stop offset="100%" stopColor={side === 'biru' ? '#0c4a6e' : '#7f1d1d'} />
        </linearGradient>
      </defs>

      {/* Segitiga utama dengan sudut tumpul halus */}
      <path
        d="M14 2.5 L2.2 24.2 C1.5 25.5 2.5 27 4.1 27 H23.9 C25.5 27 26.5 25.5 25.8 24.2 L14 2.5 Z"
        fill={`url(#per2Grad_${side})`}
        stroke="#ffffff"
        strokeWidth="1.2"
        strokeLinejoin="round"
      />
      {/* Highlight kilap segitiga bagian dalam */}
      <path
        d="M14 5 L5 23 H23 Z"
        fill="none"
        stroke="#ffffff"
        strokeWidth="0.8"
        opacity="0.3"
      />

      {/* Tanda seru putih bervolume */}
      <rect x="12.5" y="10" width="3" height="7.5" rx="1.5" fill="#ffffff" filter="drop-shadow(0px 1px 1px rgba(0,0,0,0.4))" />
      <circle cx="14" cy="21.5" r="1.7" fill="#ffffff" filter="drop-shadow(0px 1px 1px rgba(0,0,0,0.4))" />
    </svg>
  </div>
);

/**
 * DISKUALIFIKASI (DSK) Icon (Bukan siluet - Ilustrasi Kartu Merah Resmi Wasit):
 * Kartu merah 3D mengkilap yang dipegang tegak oleh tangan wasit berbusana resmi,
 * dengan tulisan tegas "DSK" berwarna emas/putih berkilau.
 */
export const DisqualifikasiIcon: React.FC<PenaltyIconProps> = ({
  className = 'w-6 h-6'
}) => (
  <div className="flex items-center justify-center">
    <svg viewBox="0 0 32 32" className={className} xmlns="http://www.w3.org/2000/svg">
      <defs>
        {/* Gradasi kartu merah cerah menyala */}
        <linearGradient id="redCardGrad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#ff4d4f" />
          <stop offset="50%" stopColor="#e60000" />
          <stop offset="100%" stopColor="#990000" />
        </linearGradient>
        {/* Kilau kartu */}
        <linearGradient id="cardSheen" x1="0%" y1="0%" x2="100%" y2="50%">
          <stop offset="0%" stopColor="#ffffff" stopOpacity="0.6" />
          <stop offset="100%" stopColor="#ffffff" stopOpacity="0" />
        </linearGradient>
        {/* Gradasi tangan */}
        <linearGradient id="dskHand" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#fcd34d" />
          <stop offset="100%" stopColor="#d97706" />
        </linearGradient>
      </defs>

      {/* Kartu Merah 3D dengan sudut halus dan border tipis putih */}
      <rect
        x="6"
        y="2"
        width="20"
        height="26"
        rx="2.5"
        fill="url(#redCardGrad)"
        stroke="#ffffff"
        strokeWidth="1.2"
        filter="drop-shadow(0px 2px 4px rgba(0,0,0,0.5))"
      />
      {/* Efek pantulan cahaya diagonal di permukaan kartu */}
      <path
        d="M6 2 H18 L6 18 Z"
        fill="url(#cardSheen)"
      />

      {/* Teks DSK tercetak tebal di tengah kartu */}
      <text
        x="16"
        y="17"
        textAnchor="middle"
        fontSize="8"
        fontWeight="900"
        fontFamily="sans-serif"
        fill="#ffffff"
        letterSpacing="0.5"
      >
        DSK
      </text>

      {/* Tangan dan jari wasit yang memegang tepi bawah kartu */}
      {/* Lengan kemeja wasit putih */}
      <rect x="18" y="27" width="8" height="5" rx="1.5" fill="#f8fafc" stroke="#475569" strokeWidth="0.8" />
      {/* Jempol dan jari tangan mencengkeram tepi kartu */}
      <path
        d="M17 23 C17 21.5 19 21.5 20 23 L22 26 C22.5 27 21 28 20 28 L17 26 Z"
        fill="url(#dskHand)"
        stroke="#b45309"
        strokeWidth="0.8"
      />
    </svg>
  </div>
);

