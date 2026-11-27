/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { Download, Check, Smartphone, Sparkles } from 'lucide-react';
import { playBeep } from '../utils/sound';
import { usePWAInstall } from '../hooks/usePWAInstall';
import InstallAppModal from './InstallAppModal';

interface PWAInstallButtonProps {
  className?: string;
  variant?: 'badge' | 'button' | 'compact';
}

export const PWAInstallButton: React.FC<PWAInstallButtonProps> = ({
  className = '',
  variant = 'button'
}) => {
  const { isInstalled, isInstallable } = usePWAInstall();
  const [showModal, setShowModal] = useState(false);

  const handleClick = () => {
    playBeep('click');
    setShowModal(true);
  };

  return (
    <>
      {variant === 'compact' ? (
        <button
          onClick={handleClick}
          title="Pasang Aplikasi (PWA Standalone)"
          className={`p-1.5 rounded-full border border-blue-500/50 bg-blue-950/70 hover:bg-blue-900/80 text-blue-300 shadow transition-all cursor-pointer ${className}`}
        >
          <Download className="w-3.5 h-3.5 text-cyan-400" />
        </button>
      ) : variant === 'badge' ? (
        <button
          onClick={handleClick}
          className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-mono font-bold uppercase transition-all cursor-pointer ${
            isInstalled
              ? 'border border-emerald-500/50 bg-emerald-950/70 text-emerald-300'
              : 'border border-cyan-500/50 bg-cyan-950/70 hover:bg-cyan-900/80 text-cyan-300 shadow-[0_0_15px_rgba(6,182,212,0.3)]'
          } ${className}`}
        >
          {isInstalled ? (
            <>
              <Check className="w-3 h-3 text-emerald-400" />
              <span>TERPASANG</span>
            </>
          ) : (
            <>
              <Download className="w-3 h-3 text-cyan-400 animate-bounce" />
              <span>PASANG APLIKASI</span>
            </>
          )}
        </button>
      ) : (
        <button
          onClick={handleClick}
          className={`inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full border border-blue-500/60 bg-gradient-to-r from-blue-950/80 via-indigo-950/80 to-cyan-950/80 hover:from-blue-900 hover:to-indigo-900 text-xs font-mono font-bold uppercase text-cyan-300 shadow-[0_0_15px_rgba(37,99,235,0.3)] transition-all cursor-pointer active:scale-95 ${className}`}
          title="Pasang aplikasi ke Layar Utama / Desktop tanpa instalasi file eksternal"
        >
          <Download className="w-3.5 h-3.5 text-cyan-400" />
          <span>{isInstalled ? 'APLIKASI TERPASANG' : 'PASANG APLIKASI'}</span>
        </button>
      )}

      {/* Modal Dialog */}
      <InstallAppModal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
      />
    </>
  );
};

export default PWAInstallButton;
