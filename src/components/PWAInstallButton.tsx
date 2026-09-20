/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { Download, Check } from 'lucide-react';
import { playBeep } from '../utils/sound';
import { usePWAInstall } from '../hooks/usePWAInstall';
import InstallAppModal from './InstallAppModal';

interface PWAInstallButtonProps {
  className?: string;
  variant?: 'badge' | 'button' | 'compact';
}

export const PWAInstallButton: React.FC<PWAInstallButtonProps> = ({
  className = '',
  variant = 'badge'
}) => {
  const { isInstalled, isInstallable, isInIframe } = usePWAInstall();
  const [showModal, setShowModal] = useState(false);

  // If already running in standalone mode, optionally hide or show installed badge
  if (isInstalled) {
    return null;
  }

  const handleClick = () => {
    playBeep('click');
    setShowModal(true);
  };

  return (
    <>
      {variant === 'compact' ? (
        <button
          id="pwa-install-compact-btn"
          onClick={handleClick}
          className={`inline-flex items-center justify-center p-2 rounded-xl bg-pink-950/80 hover:bg-pink-900 border border-pink-500/50 text-pink-300 shadow-sm transition-all cursor-pointer ${className}`}
          title="Pasang Aplikasi (PWA Standalone)"
          aria-label="Pasang Aplikasi"
        >
          <Download className="w-4 h-4 text-pink-400" />
        </button>
      ) : variant === 'button' ? (
        <button
          id="pwa-install-full-btn"
          onClick={handleClick}
          className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-blue-600 via-indigo-600 to-cyan-500 hover:from-blue-500 hover:to-cyan-400 text-white font-black text-xs uppercase tracking-wider shadow-lg shadow-blue-950/50 transition-all cursor-pointer active:scale-95 ${className}`}
        >
          <Download className="w-4 h-4" />
          <span>Pasang Aplikasi</span>
        </button>
      ) : (
        <button
          id="pwa-install-badge-btn"
          onClick={handleClick}
          className={`inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full border border-pink-500/60 bg-gradient-to-r from-fuchsia-950/90 via-pink-950/80 to-purple-950/90 hover:from-pink-900 hover:to-purple-900 text-[10px] font-mono tracking-wider font-extrabold uppercase text-pink-300 shadow-[0_0_20px_rgba(236,72,153,0.35)] transition-all cursor-pointer ${className}`}
          title="Pasang aplikasi ke layar utama Laptop / HP (PWA Standalone)"
        >
          <Download className="w-3.5 h-3.5 text-pink-400" />
          <span>PASANG APLIKASI</span>
        </button>
      )}

      <InstallAppModal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
      />
    </>
  );
};

export default PWAInstallButton;
