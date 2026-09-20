/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { motion } from 'motion/react';
import { X, Trophy, Medal, Save, RotateCcw, AlertCircle, Check } from 'lucide-react';
import { playBeep } from '../utils/sound';

interface EditMedaliKontingenModalProps {
  isOpen: boolean;
  onClose: () => void;
  kontingenName: string;
  initialGold: number;
  initialSilver: number;
  initialBronze: number;
  existingAdjustment?: { gold: number; silver: number; bronze: number; note?: string };
  onSave: (adj: { gold: number; silver: number; bronze: number; note?: string }) => void;
}

export default function EditMedaliKontingenModal({
  isOpen,
  onClose,
  kontingenName,
  initialGold,
  initialSilver,
  initialBronze,
  existingAdjustment,
  onSave
}: EditMedaliKontingenModalProps) {
  const [adjGold, setAdjGold] = useState(existingAdjustment?.gold || 0);
  const [adjSilver, setAdjSilver] = useState(existingAdjustment?.silver || 0);
  const [adjBronze, setAdjBronze] = useState(existingAdjustment?.bronze || 0);
  const [note, setNote] = useState(existingAdjustment?.note || '');

  if (!isOpen) return null;

  const totalCalculatedGold = Math.max(0, initialGold + adjGold);
  const totalCalculatedSilver = Math.max(0, initialSilver + adjSilver);
  const totalCalculatedBronze = Math.max(0, initialBronze + adjBronze);
  const totalCalculatedMedals = totalCalculatedGold + totalCalculatedSilver + totalCalculatedBronze;

  const handleSave = () => {
    playBeep('valid');
    onSave({
      gold: adjGold,
      silver: adjSilver,
      bronze: adjBronze,
      note
    });
    onClose();
  };

  const handleReset = () => {
    playBeep('click');
    setAdjGold(0);
    setAdjSilver(0);
    setAdjBronze(0);
    setNote('');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md">
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 10 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 10 }}
        className="w-full max-w-lg bg-slate-900 border border-slate-700/80 rounded-3xl shadow-2xl overflow-hidden flex flex-col"
      >
        {/* Header */}
        <div className="p-5 border-b border-slate-800 bg-slate-950 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-400">
              <Medal className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-black font-sport tracking-wider text-white uppercase">
                SESUAIKAN MEDALI KONTINGEN
              </h3>
              <p className="text-xs font-mono font-bold text-amber-400 uppercase">
                {kontingenName}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl bg-slate-800 text-slate-400 hover:text-white"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 space-y-5">
          <p className="text-xs font-mono text-slate-400">
            Fitur ini digunakan panitia untuk melakukan penyesuaian medali (misal: medali kehormatan, hasil walkover, atau keputusan dewan juri).
          </p>

          {/* Stepper Counters for Medals */}
          <div className="grid grid-cols-3 gap-3">
            {/* Gold */}
            <div className="p-3.5 rounded-2xl bg-amber-950/30 border border-amber-500/40 flex flex-col items-center">
              <span className="text-[10px] font-mono font-bold text-amber-400 uppercase mb-1">
                EMAS 🥇
              </span>
              <span className="text-2xl font-black font-sport text-amber-300 my-1">
                {totalCalculatedGold}
              </span>
              <div className="flex items-center gap-2 mt-2">
                <button
                  type="button"
                  onClick={() => setAdjGold(prev => prev - 1)}
                  className="w-7 h-7 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 font-mono font-bold flex items-center justify-center cursor-pointer"
                >
                  -
                </button>
                <span className="text-xs font-mono font-bold text-amber-400">
                  {adjGold > 0 ? `+${adjGold}` : adjGold}
                </span>
                <button
                  type="button"
                  onClick={() => setAdjGold(prev => prev + 1)}
                  className="w-7 h-7 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 font-mono font-bold flex items-center justify-center cursor-pointer"
                >
                  +
                </button>
              </div>
            </div>

            {/* Silver */}
            <div className="p-3.5 rounded-2xl bg-slate-800/40 border border-slate-500/40 flex flex-col items-center">
              <span className="text-[10px] font-mono font-bold text-slate-300 uppercase mb-1">
                PERAK 🥈
              </span>
              <span className="text-2xl font-black font-sport text-slate-200 my-1">
                {totalCalculatedSilver}
              </span>
              <div className="flex items-center gap-2 mt-2">
                <button
                  type="button"
                  onClick={() => setAdjSilver(prev => prev - 1)}
                  className="w-7 h-7 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 font-mono font-bold flex items-center justify-center cursor-pointer"
                >
                  -
                </button>
                <span className="text-xs font-mono font-bold text-slate-300">
                  {adjSilver > 0 ? `+${adjSilver}` : adjSilver}
                </span>
                <button
                  type="button"
                  onClick={() => setAdjSilver(prev => prev + 1)}
                  className="w-7 h-7 rounded-lg bg-slate-200 hover:bg-white text-slate-950 font-mono font-bold flex items-center justify-center cursor-pointer"
                >
                  +
                </button>
              </div>
            </div>

            {/* Bronze */}
            <div className="p-3.5 rounded-2xl bg-amber-950/20 border border-amber-700/40 flex flex-col items-center">
              <span className="text-[10px] font-mono font-bold text-amber-600 uppercase mb-1">
                PERUNGGU 🥉
              </span>
              <span className="text-2xl font-black font-sport text-amber-500 my-1">
                {totalCalculatedBronze}
              </span>
              <div className="flex items-center gap-2 mt-2">
                <button
                  type="button"
                  onClick={() => setAdjBronze(prev => prev - 1)}
                  className="w-7 h-7 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 font-mono font-bold flex items-center justify-center cursor-pointer"
                >
                  -
                </button>
                <span className="text-xs font-mono font-bold text-amber-600">
                  {adjBronze > 0 ? `+${adjBronze}` : adjBronze}
                </span>
                <button
                  type="button"
                  onClick={() => setAdjBronze(prev => prev + 1)}
                  className="w-7 h-7 rounded-lg bg-amber-700 hover:bg-amber-600 text-white font-mono font-bold flex items-center justify-center cursor-pointer"
                >
                  +
                </button>
              </div>
            </div>
          </div>

          {/* Note Input */}
          <div>
            <label className="block text-xs font-mono font-bold text-slate-300 uppercase mb-1">
              Catatan Penyesuaian (Opsional)
            </label>
            <input
              type="text"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="misal: Juara 3 Bersama tambahan atau koreksi teknis"
              className="w-full px-3.5 py-2 rounded-xl bg-slate-950 border border-slate-700 text-slate-100 font-mono text-xs focus:outline-none focus:border-amber-500"
            />
          </div>

          <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-between text-xs font-mono">
            <span className="text-slate-400">Total Medali Akhir:</span>
            <span className="text-emerald-400 font-black font-sport text-base">
              {totalCalculatedMedals} MEDALI
            </span>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-800 bg-slate-950 flex items-center justify-between">
          <button
            type="button"
            onClick={handleReset}
            className="px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-mono font-bold flex items-center gap-1.5"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Reset Penyesuaian</span>
          </button>

          <button
            type="button"
            onClick={handleSave}
            className="px-5 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-mono font-black uppercase flex items-center gap-1.5 shadow"
          >
            <Save className="w-4 h-4" />
            <span>Simpan Penyesuaian</span>
          </button>
        </div>
      </motion.div>
    </div>
  );
}
