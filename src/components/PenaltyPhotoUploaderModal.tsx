/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Upload, X, Sparkles, Check, RefreshCw, Sliders, Eye, Scissors,
  Palette, Image as ImageIcon, RotateCcw, AlertCircle, ShieldAlert,
  ArrowRight, CheckCircle2, Shield
} from 'lucide-react';
import { 
  PenaltyIconConfig, 
  renderPenaltyIcon, 
  STANDARDIZED_BADGE_CATALOG, 
  STANDARDIZED_PENALTY_ASSETS 
} from './PenaltyIconSet';
import { removeImageBackground, BackgroundRemovalOptions, DEFAULT_BG_OPTIONS } from '../utils/backgroundRemover';

interface PenaltyPhotoUploaderModalProps {
  isOpen: boolean;
  onClose: () => void;
  targetSlot: keyof PenaltyIconConfig;
  currentConfig: PenaltyIconConfig;
  onApplyPhoto: (slot: keyof PenaltyIconConfig, transparentDataUrl: string) => void;
}

const SLOT_INFOS: { slot: keyof PenaltyIconConfig; label: string; sub: string; points: string; color: string }[] = [
  { slot: 'slot1', label: 'Binaan 1', sub: 'Peringatan Lisan 1', points: '0 Poin', color: 'border-amber-400 text-amber-400' },
  { slot: 'slot2', label: 'Binaan 2', sub: 'Peringatan Lisan 2', points: '0 Poin', color: 'border-amber-400 text-amber-400' },
  { slot: 'slot3', label: 'Teguran 1', sub: 'Teguran Resmi 1', points: '-1 Poin', color: 'border-orange-500 text-orange-400' },
  { slot: 'slot4', label: 'Teguran 2', sub: 'Teguran Resmi 2', points: '-2 Poin', color: 'border-orange-500 text-orange-400' },
  { slot: 'slot5', label: 'Peringatan 1', sub: 'Peringatan Keras 1', points: '-5 Poin', color: 'border-red-500 text-red-400' },
  { slot: 'slot6', label: 'Peringatan 2', sub: 'Peringatan Keras 2', points: '-10 Poin', color: 'border-red-500 text-red-400' },
];

export const PenaltyPhotoUploaderModal: React.FC<PenaltyPhotoUploaderModalProps> = ({
  isOpen,
  onClose,
  targetSlot,
  currentConfig,
  onApplyPhoto,
}) => {
  const [selectedSlot, setSelectedSlot] = useState<keyof PenaltyIconConfig>(targetSlot);
  const [originalFile, setOriginalFile] = useState<File | null>(null);
  const [originalDataUrl, setOriginalDataUrl] = useState<string | null>(null);
  const [processedDataUrl, setProcessedDataUrl] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [processError, setProcessError] = useState<string | null>(null);

  // Background removal options
  const [bgMode, setBgMode] = useState<BackgroundRemovalOptions['mode']>('auto-light');
  const [tolerance, setTolerance] = useState<number>(35);
  const [feather, setFeather] = useState<number>(2);
  const [silhouetteColor, setSilhouetteColor] = useState<string>('#ffffff');
  const [customColor, setCustomColor] = useState<string>('#ffffff');
  const [trimTransparent, setTrimTransparent] = useState<boolean>(true);
  const [invert, setInvert] = useState<boolean>(false);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Reset or initialize when modal opens or targetSlot changes
  useEffect(() => {
    if (isOpen) {
      setSelectedSlot(targetSlot);
      // If current slot already has a custom image, load it as preview
      const existing = currentConfig.customImages?.[targetSlot] || 
        (typeof currentConfig[targetSlot] === 'string' && (currentConfig[targetSlot] as string).startsWith('data:image/') ? currentConfig[targetSlot] as string : null);
      if (existing) {
        setOriginalDataUrl(existing);
        setProcessedDataUrl(existing);
      }
    }
  }, [isOpen, targetSlot, currentConfig]);

  // Read file to data URL
  const handleFileChange = (file: File) => {
    if (!file) return;
    const isImage = (file.type && file.type.startsWith('image/')) ||
      /\.(jpe?g|png|webp|svg|bmp|avif)$/i.test(file.name);
    if (!isImage) {
      setProcessError('Silakan pilih berkas gambar yang valid (JPG, PNG, WebP, SVG).');
      return;
    }
    setOriginalFile(file);
    setProcessError(null);

    const reader = new FileReader();
    reader.onerror = () => {
      setProcessError('Gagal membaca berkas gambar dari perangkat.');
    };
    reader.onload = (e) => {
      const url = e.target?.result as string;
      if (url) {
        setOriginalDataUrl(url);
      } else {
        setProcessError('Berkas gambar kosong.');
      }
    };
    reader.readAsDataURL(file);
  };

  // Re-process image when parameters change
  useEffect(() => {
    if (!originalDataUrl) return;

    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }

    debounceTimerRef.current = setTimeout(async () => {
      setIsProcessing(true);
      setProcessError(null);
      try {
        const hex = customColor.replace('#', '');
        const r = parseInt(hex.substring(0, 2), 16) || 255;
        const g = parseInt(hex.substring(2, 4), 16) || 255;
        const b = parseInt(hex.substring(4, 6), 16) || 255;

        const result = await removeImageBackground(originalDataUrl, {
          mode: bgMode,
          tolerance,
          feather,
          silhouetteColor,
          customColor: { r, g, b },
          trimTransparent,
          invert,
          maxSize: 220,
        });
        setProcessedDataUrl(result);
      } catch (err: any) {
        setProcessError(err.message || 'Gagal memproses penghapusan background.');
        // Fallback to original image so user is not blocked
        setProcessedDataUrl(prev => prev || originalDataUrl);
      } finally {
        setIsProcessing(false);
      }
    }, 150);

    return () => {
      if (debounceTimerRef.current) clearTimeout(debounceTimerRef.current);
    };
  }, [originalDataUrl, bgMode, tolerance, feather, silhouetteColor, customColor, trimTransparent, invert]);

  const handleApply = () => {
    if (!processedDataUrl) return;
    onApplyPhoto(selectedSlot, processedDataUrl);
    onClose();
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const file = e.dataTransfer.files?.[0];
    if (file) handleFileChange(file);
  };

  const handleSelectStandardBadge = (src: string) => {
    setOriginalFile(null);
    setOriginalDataUrl(src);
    setBgMode('auto-light');
    setTolerance(32);
    setTrimTransparent(true);
  };

  const handleApplyDirectly = (slot: keyof PenaltyIconConfig, src: string) => {
    onApplyPhoto(slot, src);
    onClose();
  };

  if (!isOpen) return null;

  const currentSlotMeta = SLOT_INFOS.find(s => s.slot === selectedSlot) || SLOT_INFOS[0];

  return (
    <AnimatePresence>
      <div className="fixed inset-0 bg-black/80 backdrop-blur-md z-[99999] flex items-center justify-center p-3 sm:p-5 select-none overflow-y-auto">
        <motion.div
          initial={{ opacity: 0, scale: 0.94 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.94 }}
          className="bg-slate-900 border border-slate-700 rounded-3xl shadow-2xl max-w-4xl w-full text-slate-100 relative max-h-[92vh] flex flex-col overflow-hidden"
        >
          {/* Header */}
          <div className="p-5 border-b border-slate-800 bg-slate-950/70 flex items-center justify-between shrink-0">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center text-white shadow-lg shadow-emerald-500/25">
                <Scissors className="w-5 h-5" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-base sm:text-lg font-black text-white">
                    Upload & Pilih Foto Layar Hukuman Tanpa Background
                  </h3>
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 uppercase">
                    Transparan Otomatis
                  </span>
                </div>
                <p className="text-xs text-slate-400">
                  Gunakan icon terstandarisasi (Warning 1, Warning 2, Diskualifikasi) atau upload foto gestur wasit sendiri tanpa background.
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={onClose}
              className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Modal Body */}
          <div className="p-5 overflow-y-auto space-y-6 flex-1">
            {/* 1. Target Slot Selector */}
            <div className="bg-slate-950/70 p-3.5 rounded-2xl border border-slate-800 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                  <Shield className="w-3.5 h-3.5 text-amber-400" />
                  Pilih Target Slot Hukuman yang Diterapkan:
                </span>
                <span className="text-xs font-mono font-bold text-emerald-400">
                  Target: {currentSlotMeta.label} ({currentSlotMeta.points})
                </span>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-2">
                {SLOT_INFOS.map((item) => {
                  const isSelected = selectedSlot === item.slot;
                  const customImg = currentConfig.customImages?.[item.slot];
                  const hasCustom = !!customImg || (typeof currentConfig[item.slot] === 'string' && (currentConfig[item.slot] as string).startsWith('data:image/'));

                  return (
                    <button
                      key={item.slot}
                      type="button"
                      onClick={() => setSelectedSlot(item.slot)}
                      className={`p-2 rounded-xl border-2 transition-all cursor-pointer flex flex-col items-center justify-center text-center ${
                        isSelected
                          ? 'border-emerald-500 bg-emerald-950/40 text-emerald-200 ring-2 ring-emerald-500/30'
                          : 'border-slate-800 bg-slate-900/60 hover:border-slate-700 text-slate-300'
                      }`}
                    >
                      <div className="w-7 h-7 my-0.5 flex items-center justify-center">
                        {renderPenaltyIcon(currentConfig[item.slot], 'w-6 h-6', false, currentConfig.customImages)}
                      </div>
                      <span className="text-[11px] font-bold leading-tight mt-0.5 truncate w-full">
                        {item.label}
                      </span>
                      <span className="text-[9px] font-mono text-slate-400">
                        {item.points}
                      </span>
                      {hasCustom && (
                        <span className="text-[8px] text-teal-400 font-extrabold uppercase mt-0.5">
                          PNG Kustom
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* 2. Standar Visual Imagen Badges Gallery (Pencak Silat) */}
            <div className="bg-slate-950/70 p-4 rounded-2xl border border-slate-800 space-y-3">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-emerald-400" />
                  <span className="text-xs font-bold text-white uppercase tracking-wider">
                    Icon Hukuman Terstandarisasi Imagen
                  </span>
                  <span className="text-[10px] bg-emerald-500/20 text-emerald-300 px-2 py-0.5 rounded-full border border-emerald-500/30">
                    Badge Resmi
                  </span>
                </div>
                <span className="text-[11px] text-slate-400">
                  Klik badge untuk preview & hapus latar putih, atau terapkan langsung
                </span>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3">
                {STANDARDIZED_BADGE_CATALOG.map((badge) => (
                  <div
                    key={badge.type}
                    className="p-3 rounded-2xl bg-slate-900/90 border border-slate-800 hover:border-emerald-500/60 flex flex-col items-center justify-between text-center transition-all group hover:bg-slate-850"
                  >
                    <div className="w-14 h-14 rounded-xl bg-slate-950 border border-slate-800 p-1.5 flex items-center justify-center shadow-md mb-2 overflow-hidden group-hover:scale-105 transition-transform">
                      <img
                        src={badge.src}
                        alt={badge.label}
                        referrerPolicy="no-referrer"
                        className="w-full h-full object-contain filter drop-shadow-sm"
                      />
                    </div>
                    <span className="text-xs font-bold text-white block leading-tight">
                      {badge.label}
                    </span>
                    <span className="text-[10px] font-mono text-emerald-400 font-bold block mb-2">
                      {badge.points}
                    </span>

                    <div className="w-full space-y-1">
                      <button
                        type="button"
                        onClick={() => handleSelectStandardBadge(badge.src)}
                        className="w-full py-1 px-2 rounded-lg bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 border border-emerald-500/40 text-[10px] font-bold flex items-center justify-center gap-1 cursor-pointer transition-colors"
                        title="Buka di editor untuk hapus background putih menjadi transparan"
                      >
                        <Scissors className="w-3 h-3" />
                        <span>Hapus Background</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => handleApplyDirectly(selectedSlot, badge.src)}
                        className="w-full py-1 px-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-[10px] font-semibold cursor-pointer transition-colors"
                        title="Langsung pasang ke slot target"
                      >
                        Pasang Langsung
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* 3. File Upload / Dropzone or Background Remover Workspace */}
            {!originalDataUrl ? (
              <div
                onDragOver={handleDragOver}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
                className="border-2 border-dashed border-slate-700 hover:border-emerald-500 bg-slate-950/50 hover:bg-emerald-950/10 rounded-3xl p-8 sm:p-12 text-center cursor-pointer transition-all flex flex-col items-center justify-center space-y-4 group"
              >
                <div className="w-16 h-16 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400 group-hover:scale-110 transition-transform">
                  <Upload className="w-8 h-8" />
                </div>
                <div className="space-y-1">
                  <p className="text-sm sm:text-base font-bold text-white">
                    Atau Upload Berkas Foto Sendiri (Tanpa Background)
                  </p>
                  <p className="text-xs text-slate-400 max-w-md mx-auto">
                    Mendukung JPG, PNG, WebP, SVG. Background foto (putih, hitam, atau warna lain) akan otomatis dihapus menjadi transparan murni untuk layar hukuman.
                  </p>
                </div>
                <span className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-slate-950 font-bold text-xs flex items-center gap-2 shadow-lg shadow-emerald-500/20">
                  <ImageIcon className="w-4 h-4" />
                  Pilih Foto dari Komputer / HP
                </span>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*,.jpg,.jpeg,.png,.webp,.svg"
                  className="hidden"
                  onChange={(e) => {
                    const f = e.target.files?.[0];
                    if (f) handleFileChange(f);
                    e.target.value = '';
                  }}
                />
              </div>
            ) : (
              <div className="space-y-5">
                {/* File Info Bar & Switch Photo Button */}
                <div className="flex flex-wrap items-center justify-between gap-3 bg-slate-950 p-3 rounded-2xl border border-slate-800">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-emerald-500/20 text-emerald-400 flex items-center justify-center font-bold text-xs">
                      PNG
                    </div>
                    <div>
                      <p className="text-xs font-bold text-white">
                        {originalFile ? originalFile.name : 'Foto Gestur Hukuman'}
                      </p>
                      <p className="text-[10px] text-emerald-400">
                        {isProcessing ? 'Memproses transparansi...' : 'Background berhasil diolah transparan'}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        setOriginalDataUrl(null);
                        setProcessedDataUrl(null);
                        setOriginalFile(null);
                      }}
                      className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
                      title="Kembali ke pilihan icon standar atau pilih foto lain"
                    >
                      <RotateCcw className="w-3.5 h-3.5" />
                      Ganti / Pilih Lain
                    </button>
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="px-3 py-1.5 rounded-xl bg-emerald-700 hover:bg-emerald-600 text-white text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
                    >
                      <RefreshCw className="w-3.5 h-3.5" />
                      Unggah File Baru
                    </button>
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*,.jpg,.jpeg,.png,.webp,.svg"
                      className="hidden"
                      onChange={(e) => {
                        const f = e.target.files?.[0];
                        if (f) handleFileChange(f);
                        e.target.value = '';
                      }}
                    />
                  </div>
                </div>

                {/* 3. Previews & Background Removal Settings Side-by-Side */}
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
                  {/* Left Column: Live Previews (6 Cols) */}
                  <div className="lg:col-span-6 space-y-4">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                        <Eye className="w-3.5 h-3.5 text-blue-400" />
                        Hasil Pratinjau Transparan:
                      </span>
                      {isProcessing && (
                        <span className="text-[10px] text-amber-400 flex items-center gap-1 font-mono">
                          <RefreshCw className="w-3 h-3 animate-spin" /> Memperbarui...
                        </span>
                      )}
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      {/* Box 1: Checkerboard Transparent Canvas */}
                      <div className="bg-slate-950 p-3 rounded-2xl border border-slate-800 flex flex-col items-center justify-between">
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wide mb-2">
                          1. Papan Catur (Transparan)
                        </span>

                        <div
                          className="w-full aspect-square max-w-[170px] rounded-xl flex items-center justify-center p-2 relative overflow-hidden shadow-inner border border-slate-700"
                          style={{
                            backgroundImage: `
                              linear-gradient(45deg, #2a3342 25%, transparent 25%), 
                              linear-gradient(-45deg, #2a3342 25%, transparent 25%), 
                              linear-gradient(45deg, transparent 75%, #2a3342 75%), 
                              linear-gradient(-45deg, transparent 75%, #2a3342 75%)
                            `,
                            backgroundSize: '16px 16px',
                            backgroundPosition: '0 0, 0 8px, 8px -8px, -8px 0px',
                            backgroundColor: '#1a202c',
                          }}
                        >
                          {processedDataUrl ? (
                            <img
                              src={processedDataUrl}
                              alt="Hasil Transparan"
                              className="w-full h-full object-contain filter drop-shadow-md"
                            />
                          ) : (
                            <div className="text-xs text-slate-500">Memproses...</div>
                          )}
                        </div>

                        <span className="text-[9px] text-slate-500 mt-2 text-center">
                          Kotak abu membuktikan background transparan
                        </span>
                      </div>

                      {/* Box 2: Monitor Videotron Match Appearance */}
                      <div className="bg-slate-950 p-3 rounded-2xl border border-blue-900/40 flex flex-col items-center justify-between">
                        <span className="text-[10px] font-bold text-blue-400 uppercase tracking-wide mb-2">
                          2. Layar Videotron Gelanggang
                        </span>

                        <div className="w-full aspect-square max-w-[170px] rounded-xl bg-gradient-to-br from-slate-900 via-blue-950 to-slate-900 p-2 flex flex-col items-center justify-center relative overflow-hidden border border-blue-700/50 shadow-inner">
                          {/* Penalty Slot simulated frame */}
                          <div className="w-16 h-16 rounded-xl bg-slate-900/90 border-2 border-amber-400/80 shadow-[0_0_12px_rgba(251,191,36,0.3)] flex items-center justify-center p-1.5">
                            {processedDataUrl ? (
                              <img
                                src={processedDataUrl}
                                alt="Monitor Preview"
                                className="w-full h-full object-contain filter drop-shadow-md"
                              />
                            ) : null}
                          </div>
                          <span className="text-[9px] font-bold text-amber-300 mt-2">
                            {currentSlotMeta.label}
                          </span>
                        </div>

                        <span className="text-[9px] text-slate-400 mt-2 text-center">
                          Simulasi pada monitor penonton/official
                        </span>
                      </div>
                    </div>

                    {/* Original vs Processed side comparison preview */}
                    <div className="bg-slate-950/60 p-3 rounded-xl border border-slate-800 flex items-center justify-between text-xs text-slate-400">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded bg-slate-900 border border-slate-800 overflow-hidden flex items-center justify-center">
                          <img src={originalDataUrl} alt="Asli" className="w-full h-full object-contain" />
                        </div>
                        <span className="text-[11px]">Foto Asli (Input)</span>
                      </div>
                      <ArrowRight className="w-4 h-4 text-emerald-400" />
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded bg-slate-900 border border-emerald-500/50 overflow-hidden flex items-center justify-center p-0.5">
                          <img src={processedDataUrl || originalDataUrl} alt="Hasil" className="w-full h-full object-contain" />
                        </div>
                        <span className="text-[11px] font-bold text-emerald-400">Tanpa Background</span>
                      </div>
                    </div>
                  </div>

                  {/* Right Column: Settings & Fine-Tuning Controls (6 Cols) */}
                  <div className="lg:col-span-6 space-y-4">
                    <span className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                      <Sliders className="w-3.5 h-3.5 text-emerald-400" />
                      Mode Pembersihan Background:
                    </span>

                    {/* Mode selection chips */}
                    <div className="grid grid-cols-2 gap-2">
                      {[
                        {
                          id: 'auto-light' as const,
                          name: 'Latar Putih / Terang',
                          desc: 'Cocok untuk foto kertas / dinding putih',
                          icon: '🪄',
                        },
                        {
                          id: 'auto-dark' as const,
                          name: 'Latar Hitam / Gelap',
                          desc: 'Hapus background warna hitam/gelap',
                          icon: '🌑',
                        },
                        {
                          id: 'sample-corner' as const,
                          name: 'Deteksi Sudut Otomatis',
                          desc: 'Deteksi warna latar dari 4 sudut foto',
                          icon: '🎯',
                        },
                        {
                          id: 'silhouette' as const,
                          name: 'Siluet Monokrom',
                          desc: 'Ubah menjadi siluet tajam transparan',
                          icon: '🥋',
                        },
                        {
                          id: 'color' as const,
                          name: 'Pilih Warna Manual',
                          desc: 'Hapus warna tertentu pilihan Anda',
                          icon: '🎨',
                        },
                        {
                          id: 'none' as const,
                          name: 'Pertahankan Asli',
                          desc: 'Gunakan gambar apa adanya (PNG transparan)',
                          icon: '🖼️',
                        },
                      ].map((modeItem) => {
                        const isSelected = bgMode === modeItem.id;
                        return (
                          <button
                            key={modeItem.id}
                            type="button"
                            onClick={() => setBgMode(modeItem.id)}
                            className={`p-2.5 rounded-xl border text-left transition-all cursor-pointer flex flex-col justify-between ${
                              isSelected
                                ? 'border-emerald-500 bg-emerald-950/40 text-emerald-200 ring-1 ring-emerald-500/30'
                                : 'border-slate-800 bg-slate-950/70 hover:border-slate-700 text-slate-300'
                            }`}
                          >
                            <div className="flex items-center gap-1.5 font-bold text-xs text-white">
                              <span>{modeItem.icon}</span>
                              <span className="truncate">{modeItem.name}</span>
                            </div>
                            <p className="text-[10px] text-slate-400 mt-1 leading-snug">
                              {modeItem.desc}
                            </p>
                          </button>
                        );
                      })}
                    </div>

                    {/* Fine-Tuning Sliders if not 'none' */}
                    {bgMode !== 'none' && (
                      <div className="bg-slate-950 p-3.5 rounded-2xl border border-slate-800 space-y-3">
                        {/* Tolerance Slider */}
                        <div className="space-y-1">
                          <div className="flex items-center justify-between text-xs">
                            <span className="text-slate-300 font-semibold flex items-center gap-1.5">
                              Tingkat Toleransi / Sensitivitas Background:
                            </span>
                            <span className="font-mono font-bold text-emerald-400">{tolerance}%</span>
                          </div>
                          <input
                            type="range"
                            min="5"
                            max="90"
                            value={tolerance}
                            onChange={(e) => setTolerance(Number(e.target.value))}
                            className="w-full h-2 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-emerald-500"
                          />
                          <div className="flex justify-between text-[9px] text-slate-500">
                            <span>Sedikit (Hanya warna identik)</span>
                            <span>Banyak (Lebih agresif)</span>
                          </div>
                        </div>

                        {/* Feathering Slider */}
                        <div className="space-y-1">
                          <div className="flex items-center justify-between text-xs">
                            <span className="text-slate-300 font-semibold flex items-center gap-1.5">
                              Kehalusan Tepi (Feather / Anti-alias):
                            </span>
                            <span className="font-mono font-bold text-emerald-400">{feather}px</span>
                          </div>
                          <input
                            type="range"
                            min="0"
                            max="6"
                            value={feather}
                            onChange={(e) => setFeather(Number(e.target.value))}
                            className="w-full h-2 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-emerald-500"
                          />
                        </div>

                        {/* Silhouette Color Picker if silhouette mode */}
                        {bgMode === 'silhouette' && (
                          <div className="space-y-1 pt-1 border-t border-slate-800">
                            <label className="text-xs font-semibold text-slate-300 block">
                              Warna Siluet Gestur:
                            </label>
                            <div className="flex items-center gap-2">
                              {['#ffffff', '#fbbf24', '#f87171', '#60a5fa', '#0f172a'].map((color) => (
                                <button
                                  key={color}
                                  type="button"
                                  onClick={() => setSilhouetteColor(color)}
                                  className={`w-7 h-7 rounded-lg border-2 transition-all cursor-pointer ${
                                    silhouetteColor === color ? 'border-emerald-400 scale-110 shadow-md' : 'border-slate-700'
                                  }`}
                                  style={{ backgroundColor: color }}
                                />
                              ))}
                              <input
                                type="color"
                                value={silhouetteColor}
                                onChange={(e) => setSilhouetteColor(e.target.value)}
                                className="w-8 h-7 bg-transparent rounded cursor-pointer"
                                title="Pilih warna siluet khusus"
                              />
                            </div>
                          </div>
                        )}

                        {/* Manual Color Picker if color mode */}
                        {bgMode === 'color' && (
                          <div className="space-y-1 pt-1 border-t border-slate-800">
                            <label className="text-xs font-semibold text-slate-300 block">
                              Warna Latar Belakang yang Dihapus:
                            </label>
                            <div className="flex items-center gap-2">
                              <input
                                type="color"
                                value={customColor}
                                onChange={(e) => setCustomColor(e.target.value)}
                                className="w-9 h-8 bg-transparent rounded cursor-pointer"
                              />
                              <input
                                type="text"
                                value={customColor}
                                onChange={(e) => setCustomColor(e.target.value)}
                                className="bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1 text-xs font-mono text-white w-24"
                              />
                              <span className="text-[11px] text-slate-400">Pilih warna latar</span>
                            </div>
                          </div>
                        )}

                        {/* Auto-Trim and Invert Toggles */}
                        <div className="pt-2 border-t border-slate-800 flex flex-wrap items-center gap-4">
                          <label className="flex items-center gap-2 text-xs text-slate-300 cursor-pointer">
                            <input
                              type="checkbox"
                              checked={trimTransparent}
                              onChange={(e) => setTrimTransparent(e.target.checked)}
                              className="rounded border-slate-700 text-emerald-500 focus:ring-emerald-400 w-4 h-4 cursor-pointer"
                            />
                            <span>Pangkas Otomatis Area Kosong (Trim & Center)</span>
                          </label>

                          <label className="flex items-center gap-2 text-xs text-slate-300 cursor-pointer">
                            <input
                              type="checkbox"
                              checked={invert}
                              onChange={(e) => setInvert(e.target.checked)}
                              className="rounded border-slate-700 text-emerald-500 focus:ring-emerald-400 w-4 h-4 cursor-pointer"
                            />
                            <span>Balik Seleksi (Invert)</span>
                          </label>
                        </div>
                      </div>
                    )}

                    {processError && (
                      <div className="p-3 bg-red-950/60 border border-red-800 rounded-xl text-red-300 text-xs flex items-center gap-2">
                        <AlertCircle className="w-4 h-4 shrink-0" />
                        <span>{processError}</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Modal Footer Actions */}
          <div className="p-4 border-t border-slate-800 bg-slate-950/80 flex flex-wrap items-center justify-between gap-3 shrink-0">
            <div className="flex items-center gap-2 text-xs text-slate-400">
              <Sparkles className="w-4 h-4 text-emerald-400" />
              <span>
                Gambar akan otomatis disimpan berformat PNG transparan berkualitas tinggi.
              </span>
            </div>

            <div className="flex items-center gap-2.5">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white text-xs font-semibold transition-colors cursor-pointer"
              >
                Batalkan
              </button>

              <button
                type="button"
                disabled={!processedDataUrl || isProcessing}
                onClick={handleApply}
                className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 active:scale-95 text-slate-950 font-bold text-xs shadow-lg shadow-emerald-500/25 transition-all flex items-center gap-2 cursor-pointer disabled:opacity-40"
              >
                {isProcessing ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    <span>Memproses...</span>
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="w-4 h-4" />
                    <span>Terapkan ke {currentSlotMeta.label} Tanpa Background</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};

export default PenaltyPhotoUploaderModal;
