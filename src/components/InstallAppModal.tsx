/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Download, 
  Smartphone, 
  X, 
  Check, 
  Laptop, 
  ExternalLink, 
  Share2, 
  PlusSquare, 
  ShieldCheck, 
  Wifi, 
  HelpCircle,
  Sparkles,
  Layers
} from 'lucide-react';
import { playBeep } from '../utils/sound';
import { usePWAInstall } from '../hooks/usePWAInstall';

interface InstallAppModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function InstallAppModal({ isOpen, onClose }: InstallAppModalProps) {
  const { 
    isInstallable, 
    isInstalled, 
    isIOS, 
    isInIframe, 
    install, 
    openInNewTab 
  } = usePWAInstall();

  const [activeTab, setActiveTab] = useState<'otomatis' | 'panduan'>('otomatis');
  const [installSuccess, setInstallSuccess] = useState(false);

  const handleInstallClick = async () => {
    playBeep('valid');
    const success = await install();
    if (success) {
      setInstallSuccess(true);
    }
  };

  const handleOpenExternal = () => {
    playBeep('click');
    openInNewTab();
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-md overflow-y-auto">
        <motion.div
          initial={{ opacity: 0, scale: 0.94, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.94, y: 20 }}
          transition={{ type: 'spring', damping: 25, stiffness: 350 }}
          className="relative w-full max-w-lg bg-gradient-to-b from-[#09153a] via-[#040d28] to-[#020617] border-2 border-blue-500/50 rounded-3xl p-6 sm:p-7 text-white shadow-[0_0_60px_rgba(37,99,235,0.45)] my-8 overflow-hidden"
        >
          {/* Subtle glowing ambient background effect */}
          <div className="absolute top-0 right-0 w-48 h-48 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute bottom-0 left-0 w-48 h-48 bg-indigo-600/10 rounded-full blur-3xl pointer-events-none" />

          {/* Close button */}
          <button
            id="close-install-modal-btn"
            onClick={() => {
              playBeep('click');
              onClose();
            }}
            className="absolute top-4 right-4 p-2 rounded-full bg-white/10 hover:bg-white/20 text-slate-300 hover:text-white transition-all cursor-pointer"
            aria-label="Tutup modal"
          >
            <X className="w-5 h-5" />
          </button>

          {/* App Header & Icon preview */}
          <div className="flex items-center gap-4 mb-5 pr-8">
            <div className="w-16 h-16 sm:w-18 sm:h-18 rounded-2xl bg-[#03091e] p-1.5 border-2 border-amber-400/90 shadow-[0_0_25px_rgba(245,158,11,0.35)] flex items-center justify-center shrink-0">
              <img 
                src="/icons/icon.svg" 
                alt="Logo Skoring Silat" 
                className="w-full h-full object-contain" 
              />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-xl sm:text-2xl font-black tracking-tight text-white">
                  Skoring Pencak Silat
                </h3>
              </div>
              <p className="text-xs text-blue-300 font-mono mt-0.5">
                Aplikasi Standalone Resmi Turnamen Silat
              </p>
              <div className="flex flex-wrap items-center gap-1.5 mt-1.5">
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-500/20 border border-emerald-400/40 text-[10px] text-emerald-300 font-bold">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                  <span>PWA Standalone</span>
                </span>
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-cyan-500/20 border border-cyan-400/40 text-[10px] text-cyan-300 font-bold">
                  <Wifi className="w-2.5 h-2.5" />
                  <span>Offline Ready</span>
                </span>
              </div>
            </div>
          </div>

          {/* Status Alert for Iframe vs Direct Window */}
          {isInIframe && (
            <div className="mb-4 p-3.5 rounded-2xl bg-amber-950/60 border border-amber-500/50 text-amber-200 text-xs leading-relaxed">
              <div className="flex items-center gap-2 font-bold text-amber-300 mb-1">
                <ExternalLink className="w-4 h-4 text-amber-400 shrink-0" />
                <span>Pratinjau Terdeteksi di Jendela AI Studio (Iframe)</span>
              </div>
              <p className="text-[11px] text-amber-200/90 mb-2.5">
                Fitur pemasangan aplikasi (PWA) memerlukan akses jendela mandiri browser. Klik tombol di bawah untuk membuka aplikasi di tab browser penuh agar prompt pasang aktif:
              </p>
              <button
                id="open-in-new-tab-install-btn"
                onClick={handleOpenExternal}
                className="w-full py-2.5 px-4 rounded-xl bg-gradient-to-r from-amber-600 via-orange-600 to-amber-500 hover:from-amber-500 hover:to-orange-400 text-white font-black text-xs uppercase tracking-wider shadow-md flex items-center justify-center gap-2 transition-all cursor-pointer"
              >
                <ExternalLink className="w-4 h-4" />
                <span>Buka di Tab Baru untuk Memasang</span>
              </button>
            </div>
          )}

          {/* Tab selector */}
          <div className="flex items-center bg-slate-900/80 p-1 rounded-xl border border-slate-800 mb-4 text-xs font-bold">
            <button
              onClick={() => setActiveTab('otomatis')}
              className={`flex-1 py-1.5 rounded-lg transition-all text-center flex items-center justify-center gap-1.5 ${
                activeTab === 'otomatis'
                  ? 'bg-blue-600 text-white shadow'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>Pemasangan Cepat</span>
            </button>
            <button
              onClick={() => setActiveTab('panduan')}
              className={`flex-1 py-1.5 rounded-lg transition-all text-center flex items-center justify-center gap-1.5 ${
                activeTab === 'panduan'
                  ? 'bg-blue-600 text-white shadow'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <HelpCircle className="w-3.5 h-3.5" />
              <span>Panduan Manual</span>
            </button>
          </div>

          {activeTab === 'otomatis' ? (
            <div className="space-y-3.5 mb-6 text-xs text-slate-300">
              {/* Feature Highlights */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                <div className="flex items-start gap-2.5 bg-blue-950/40 border border-blue-500/30 rounded-2xl p-3">
                  <Smartphone className="w-4 h-4 text-cyan-400 shrink-0 mt-0.5" />
                  <div>
                    <span className="font-bold text-white block">Layar Penuh Standalone</span>
                    <span className="text-[11px] text-slate-300 leading-tight block mt-0.5">
                      Bebas gangguan address bar, mirip aplikasi native Android & iOS.
                    </span>
                  </div>
                </div>

                <div className="flex items-start gap-2.5 bg-blue-950/40 border border-blue-500/30 rounded-2xl p-3">
                  <Laptop className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                  <div>
                    <span className="font-bold text-white block">Semua Perangkat</span>
                    <span className="text-[11px] text-slate-300 leading-tight block mt-0.5">
                      Cocok untuk Laptop Layar Arena, Tablet Dewan, & HP Wasit/Juri.
                    </span>
                  </div>
                </div>
              </div>

              {/* iOS Guide Notice if detected */}
              {isIOS && (
                <div className="bg-amber-950/40 border border-amber-500/50 rounded-2xl p-3.5 text-amber-200">
                  <div className="flex items-center gap-2 font-bold text-amber-300 mb-1">
                    <Share2 className="w-4 h-4 text-amber-400" />
                    <span>Panduan Pasang di iPhone / iPad (Safari)</span>
                  </div>
                  <ol className="list-decimal list-inside space-y-1 text-[11px] text-amber-100">
                    <li>
                      Ketuk tombol <strong className="text-white">Bagikan (Share)</strong> <Share2 className="inline w-3.5 h-3.5 text-blue-300" /> di Safari.
                    </li>
                    <li>
                      Gulir ke bawah dan ketuk <strong className="text-white">"Tambah ke Layar Utama" (Add to Home Screen)</strong> <PlusSquare className="inline w-3.5 h-3.5 text-emerald-300" />.
                    </li>
                    <li>
                      Ketuk <strong className="text-white">Tambah</strong> di pojok kanan atas.
                    </li>
                  </ol>
                </div>
              )}
            </div>
          ) : (
            /* Manual Guides Tab */
            <div className="space-y-3 mb-6 text-xs text-slate-300">
              <div className="bg-slate-900/70 border border-slate-800 rounded-2xl p-3">
                <span className="font-bold text-cyan-300 block mb-1 flex items-center gap-1.5">
                  <Laptop className="w-4 h-4" />
                  <span>Google Chrome & Microsoft Edge (PC / Laptop):</span>
                </span>
                <p className="text-[11px] text-slate-300">
                  1. Perhatikan ikon <strong className="text-white">Komputer / Panah Pasang</strong> di ujung kanan kolom alamat web (URL address bar).<br />
                  2. Klik ikon tersebut, lalu pilih <strong className="text-white">"Pasang" (Install)</strong>.<br />
                  3. Atau klik menu titik tiga <strong className="text-white">⋮ &gt; Simpan & Bagikan &gt; Pasang Halaman Sebagai Aplikasi</strong>.
                </p>
              </div>

              <div className="bg-slate-900/70 border border-slate-800 rounded-2xl p-3">
                <span className="font-bold text-emerald-300 block mb-1 flex items-center gap-1.5">
                  <Smartphone className="w-4 h-4" />
                  <span>Google Chrome di HP Android:</span>
                </span>
                <p className="text-[11px] text-slate-300">
                  1. Ketuk ikon titik tiga <strong className="text-white">⋮</strong> di pojok kanan atas Chrome.<br />
                  2. Pilih menu <strong className="text-white">"Pasang aplikasi" (Install app)</strong> atau <strong className="text-white">"Tambahkan ke Layar Utama"</strong>.<br />
                  3. Ikon Skoring Silat akan muncul langsung di layar utama smartphone Anda.
                </p>
              </div>

              <div className="bg-slate-900/70 border border-slate-800 rounded-2xl p-3">
                <span className="font-bold text-amber-300 block mb-1 flex items-center gap-1.5">
                  <Share2 className="w-4 h-4" />
                  <span>Safari di iPhone / iPad (iOS):</span>
                </span>
                <p className="text-[11px] text-slate-300">
                  1. Buka halaman ini di browser <strong className="text-white">Safari</strong>.<br />
                  2. Ketuk ikon <strong className="text-white">Share</strong> (kotak panah ke atas di bawah layar).<br />
                  3. Pilih <strong className="text-white">"Tambah ke Layar Utama" (Add to Home Screen)</strong>.
                </p>
              </div>
            </div>
          )}

          {/* Action Buttons Area */}
          <div className="space-y-2 pt-2 border-t border-slate-800/80">
            {isInstalled || installSuccess ? (
              <div className="w-full py-3.5 px-4 rounded-2xl bg-emerald-600/25 border-2 border-emerald-500/50 text-emerald-300 font-black text-sm text-center flex items-center justify-center gap-2">
                <Check className="w-5 h-5 text-emerald-400" />
                <span>Aplikasi Skoring Silat Sudah Terpasang</span>
              </div>
            ) : isInstallable ? (
              <button
                id="native-install-pwa-btn"
                onClick={handleInstallClick}
                className="w-full py-3.5 px-6 rounded-2xl bg-gradient-to-r from-blue-600 via-indigo-600 to-cyan-500 hover:from-blue-500 hover:to-cyan-400 text-white font-black text-sm uppercase tracking-wider shadow-[0_0_30px_rgba(37,99,235,0.6)] flex items-center justify-center gap-2.5 cursor-pointer transition-all hover:scale-[1.02] active:scale-[0.98]"
              >
                <Download className="w-5 h-5" />
                <span>Pasang Aplikasi Sekarang</span>
              </button>
            ) : isInIframe ? (
              <button
                id="modal-open-new-tab-btn"
                onClick={handleOpenExternal}
                className="w-full py-3.5 px-6 rounded-2xl bg-gradient-to-r from-blue-600 via-indigo-600 to-cyan-500 hover:from-blue-500 hover:to-cyan-400 text-white font-black text-sm uppercase tracking-wider shadow-[0_0_30px_rgba(37,99,235,0.6)] flex items-center justify-center gap-2.5 cursor-pointer transition-all hover:scale-[1.02] active:scale-[0.98]"
              >
                <ExternalLink className="w-5 h-5" />
                <span>Buka di Tab Baru untuk Pasang</span>
              </button>
            ) : isIOS ? (
              <button
                onClick={() => setActiveTab('panduan')}
                className="w-full py-3.5 px-6 rounded-2xl bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-500 hover:to-orange-500 text-white font-black text-sm uppercase tracking-wider shadow-md flex items-center justify-center gap-2.5 cursor-pointer transition-all"
              >
                <Share2 className="w-5 h-5" />
                <span>Lihat Panduan Pasang iOS</span>
              </button>
            ) : (
              <button
                id="modal-trigger-install-btn"
                onClick={() => {
                  playBeep('click');
                  setActiveTab('panduan');
                }}
                className="w-full py-3.5 px-6 rounded-2xl bg-gradient-to-r from-blue-600 via-indigo-600 to-cyan-500 hover:from-blue-500 hover:to-cyan-400 text-white font-black text-sm uppercase tracking-wider shadow-[0_0_30px_rgba(37,99,235,0.6)] flex items-center justify-center gap-2.5 cursor-pointer transition-all hover:scale-[1.02] active:scale-[0.98]"
              >
                <Download className="w-5 h-5" />
                <span>Lihat Cara Pasang di Browser Ini</span>
              </button>
            )}

            <button
              onClick={() => {
                playBeep('click');
                onClose();
              }}
              className="w-full py-2.5 px-4 rounded-xl text-slate-400 hover:text-white text-xs font-bold uppercase tracking-wider text-center cursor-pointer transition-all hover:bg-white/5"
            >
              Tutup
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
