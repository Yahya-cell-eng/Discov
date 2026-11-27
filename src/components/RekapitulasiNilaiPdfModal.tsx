/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  X, Printer, FileText, CheckCircle2, Trophy, Award, 
  Calendar, Shield, UserCheck, AlertTriangle, Layers, Download
} from 'lucide-react';
import { MatchState, MatchHistory } from '../types';
import { playBeep } from '../utils/sound';
import { 
  generateRekapitulasiNilaiAkhirPdf, 
  generateAllMatchesReportPdf 
} from '../utils/generateMatchReportPdf';

interface RekapitulasiNilaiPdfModalProps {
  isOpen: boolean;
  onClose: () => void;
  state: MatchState;
  histories?: MatchHistory[];
  theme?: 'dark' | 'light';
}

export default function RekapitulasiNilaiPdfModal({
  isOpen,
  onClose,
  state,
  histories = [],
  theme = 'dark'
}: RekapitulasiNilaiPdfModalProps) {
  // Target match selection: 'active' or history id
  const [targetMatchId, setTargetMatchId] = useState<string>('active');

  // Form states for official signatories
  const [secretaryName, setSecretaryName] = useState<string>(() => {
    try {
      return localStorage.getItem('silat_rekap_sekretaris_name') || 'Sekretaris Pertandingan';
    } catch {
      return 'Sekretaris Pertandingan';
    }
  });

  const [kpName, setKpName] = useState<string>(() => {
    try {
      return localStorage.getItem('silat_rekap_kp_name') || 'Ketua Pertandingan';
    } catch {
      return 'Ketua Pertandingan';
    }
  });

  const [dewanName, setDewanName] = useState<string>(() => {
    try {
      return localStorage.getItem('silat_rekap_dewan_name') || 'Ketua Dewan Wasit Juri';
    } catch {
      return 'Ketua Dewan Wasit Juri';
    }
  });

  const [wasitName, setWasitName] = useState<string>(() => {
    try {
      return localStorage.getItem('silat_rekap_wasit_name') || 'Wasit Panggung';
    } catch {
      return 'Wasit Panggung';
    }
  });

  const [jenisKemenangan, setJenisKemenangan] = useState<string>('Menang Angka');
  const [catatanKhusus, setCatatanKhusus] = useState<string>('');
  const [isGenerating, setIsGenerating] = useState<boolean>(false);

  // Selected match data resolution
  const selectedMatch = useMemo(() => {
    if (targetMatchId === 'active') {
      return {
        isHistory: false,
        partai: state.partai || '01',
        kelas: state.kelas || 'Tanding Kelas',
        gender: state.gender || 'Putra',
        atletMerah: state.atletMerah?.nama || 'SUDUT MERAH',
        kontingenMerah: state.atletMerah?.kontingen || 'KONTINGEN MERAH',
        skorMerah: state.scores?.merah?.total ?? 0,
        atletBiru: state.atletBiru?.nama || 'SUDUT BIRU',
        kontingenBiru: state.atletBiru?.kontingen || 'KONTINGEN BIRU',
        skorBiru: state.scores?.biru?.total ?? 0,
        winner: state.winner,
        historyRecord: null
      };
    }

    const hist = histories.find(h => h.id === targetMatchId);
    if (hist) {
      return {
        isHistory: true,
        partai: hist.partai || '01',
        kelas: hist.kelas || 'Tanding Kelas',
        gender: hist.gender || 'Putra',
        atletMerah: hist.atletMerah?.nama || 'SUDUT MERAH',
        kontingenMerah: hist.atletMerah?.kontingen || 'KONTINGEN MERAH',
        skorMerah: hist.skorAkhirMerah,
        atletBiru: hist.atletBiru?.nama || 'SUDUT BIRU',
        kontingenBiru: hist.atletBiru?.kontingen || 'KONTINGEN BIRU',
        skorBiru: hist.skorAkhirBiru,
        winner: hist.winner,
        historyRecord: hist
      };
    }

    return null;
  }, [targetMatchId, state, histories]);

  if (!isOpen) return null;

  const handlePrintPDF = () => {
    playBeep('valid');
    setIsGenerating(true);

    try {
      // Save signatory names to local storage for subsequent prints
      localStorage.setItem('silat_rekap_sekretaris_name', secretaryName);
      localStorage.setItem('silat_rekap_kp_name', kpName);
      localStorage.setItem('silat_rekap_dewan_name', dewanName);
      localStorage.setItem('silat_rekap_wasit_name', wasitName);
    } catch {
      // ignore
    }

    try {
      generateRekapitulasiNilaiAkhirPdf({
        state,
        history: selectedMatch?.historyRecord || null,
        histories,
        tournamentTitle: state.namaEvent,
        gelanggang: state.gelanggang,
        secretaryName: secretaryName.trim() || 'Sekretaris Pertandingan',
        ketuaPertandinganName: kpName.trim() || 'Ketua Pertandingan',
        dewanName: dewanName.trim() || 'Ketua Dewan Wasit Juri',
        wasitName: wasitName.trim() || 'Wasit Panggung',
        jenisKemenangan,
        catatanKhusus: catatanKhusus.trim()
      });
    } catch (err) {
      console.error('Failed to generate Rekapitulasi PDF:', err);
    } finally {
      setIsGenerating(false);
      onClose();
    }
  };

  const handlePrintAllTournaments = () => {
    playBeep('click');
    setIsGenerating(true);
    try {
      generateAllMatchesReportPdf({
        state,
        histories,
        baganData: state.baganData || state.baganCategories,
        tournamentTitle: state.namaEvent,
        gelanggang: state.gelanggang
      });
    } catch (err) {
      console.error('Failed to generate all matches report PDF:', err);
    } finally {
      setIsGenerating(false);
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-[10000] bg-black/80 backdrop-blur-md flex items-center justify-center p-3 sm:p-5 overflow-y-auto">
      <motion.div
        initial={{ opacity: 0, scale: 0.96, y: 15 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.96, y: 15 }}
        className={`w-full max-w-2xl rounded-2xl border shadow-2xl overflow-hidden flex flex-col my-auto ${
          theme === 'dark' 
            ? 'bg-slate-950 border-amber-500/40 text-slate-100 shadow-amber-950/40' 
            : 'bg-white border-amber-500/50 text-slate-800 shadow-xl'
        }`}
      >
        {/* Modal Header */}
        <div className="bg-gradient-to-r from-slate-900 via-slate-900 to-amber-950/80 p-4 sm:p-5 border-b border-amber-500/30 flex items-center justify-between relative">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-400 shrink-0 shadow-lg shadow-amber-950/50">
              <Printer className="w-5 h-5 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-black px-2 py-0.5 rounded-full bg-amber-500 text-slate-950 uppercase tracking-wider">
                  DOKUMEN RESMI PB IPSI
                </span>
                <span className="text-[10px] text-slate-400 font-mono">
                  {state.gelanggang || 'Gelanggang 1'}
                </span>
              </div>
              <h2 className="text-base sm:text-lg font-black text-white tracking-tight mt-0.5">
                Cetak Rekapitulasi Nilai Akhir (PDF)
              </h2>
            </div>
          </div>

          <button
            onClick={() => { playBeep('click'); onClose(); }}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-4 sm:p-6 space-y-5 overflow-y-auto max-h-[75vh]">
          
          {/* 1. Target Match Selector */}
          <div className="space-y-2">
            <label className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5 font-mono">
              <Layers className="w-3.5 h-3.5 text-amber-400" />
              <span>Pilih Partai yang Ingin Dicetak Rekapitulasinya:</span>
            </label>
            <select
              value={targetMatchId}
              onChange={(e) => setTargetMatchId(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl border bg-slate-900 border-slate-700 text-xs text-white font-bold focus:outline-none focus:border-amber-500 transition-all cursor-pointer"
            >
              <option value="active">
                ⚡ Partai Aktif Saat Ini: Partai {state.partai || '01'} ({state.kelas || 'Tanding'}) - {state.atletMerah?.nama || 'Merah'} vs {state.atletBiru?.nama || 'Biru'}
              </option>
              {histories.length > 0 && (
                <optgroup label="── Riwayat Partai Selesai (Histori) ──">
                  {histories.map((h, idx) => (
                    <option key={h.id || idx} value={h.id}>
                      Partai {h.partai} - {h.kelas} ({h.gender}) : {h.atletMerah?.nama} ({h.skorAkhirMerah}) vs {h.atletBiru?.nama} ({h.skorAkhirBiru}) - Pemenang: {h.winner ? h.winner.toUpperCase() : 'SERI'}
                    </option>
                  ))}
                </optgroup>
              )}
            </select>
          </div>

          {/* 2. Match Preview Card */}
          {selectedMatch && (
            <div className="p-3.5 sm:p-4 rounded-xl border border-slate-800 bg-slate-900/90 space-y-3">
              <div className="flex items-center justify-between border-b border-slate-800/80 pb-2 text-[11px] font-mono">
                <span className="font-bold text-amber-400">
                  PARTAI {selectedMatch.partai} | {selectedMatch.kelas} ({selectedMatch.gender})
                </span>
                <span className="text-slate-400">
                  {selectedMatch.isHistory ? 'Status: Arsip Riwayat' : 'Status: Pertandingan Aktif'}
                </span>
              </div>

              {/* Athletes comparison grid */}
              <div className="grid grid-cols-2 gap-3 text-xs">
                {/* Red side */}
                <div className="p-2.5 rounded-lg bg-red-950/30 border border-red-500/30">
                  <span className="text-[9px] font-black uppercase text-red-400 block mb-0.5">SUDUT MERAH</span>
                  <div className="font-extrabold text-white text-sm truncate">{selectedMatch.atletMerah}</div>
                  <div className="text-[10px] text-red-300 font-mono truncate">{selectedMatch.kontingenMerah}</div>
                  <div className="mt-2 text-lg font-mono font-black text-red-400">
                    Skor: {selectedMatch.skorMerah}
                  </div>
                </div>

                {/* Blue side */}
                <div className="p-2.5 rounded-lg bg-blue-950/30 border border-blue-500/30">
                  <span className="text-[9px] font-black uppercase text-cyan-400 block mb-0.5">SUDUT BIRU</span>
                  <div className="font-extrabold text-white text-sm truncate">{selectedMatch.atletBiru}</div>
                  <div className="text-[10px] text-blue-300 font-mono truncate">{selectedMatch.kontingenBiru}</div>
                  <div className="mt-2 text-lg font-mono font-black text-cyan-400">
                    Skor: {selectedMatch.skorBiru}
                  </div>
                </div>
              </div>

              {/* Decision badge */}
              <div className="flex items-center justify-between pt-1 text-xs font-mono">
                <span className="text-slate-400">Hasil Akhir:</span>
                <span className={`font-bold px-2.5 py-0.5 rounded ${
                  selectedMatch.winner === 'merah'
                    ? 'bg-red-500/20 text-red-300 border border-red-500/40'
                    : selectedMatch.winner === 'biru'
                    ? 'bg-blue-500/20 text-blue-300 border border-blue-500/40'
                    : 'bg-slate-800 text-slate-300'
                }`}>
                  {selectedMatch.winner === 'merah' 
                    ? `🏆 Sudut MERAH Menang (${selectedMatch.skorMerah} - ${selectedMatch.skorBiru})`
                    : selectedMatch.winner === 'biru'
                    ? `🏆 Sudut BIRU Menang (${selectedMatch.skorBiru} - ${selectedMatch.skorMerah})`
                    : 'Pertandingan Seri / Sedang Berlangsung'}
                </span>
              </div>
            </div>
          )}

          {/* 3. Decision Type & Verification */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Jenis Keputusan Kemenangan:
              </label>
              <select
                value={jenisKemenangan}
                onChange={(e) => setJenisKemenangan(e.target.value)}
                className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-xs text-white focus:outline-none focus:border-amber-500 font-medium cursor-pointer"
              >
                <option value="Menang Angka">Menang Angka (Points Decision)</option>
                <option value="Menang Teknik (WMP)">Menang Teknik (WMP / Wasit Menghentikan Pertandingan)</option>
                <option value="Menang Mutlak">Menang Mutlak (Absolute Victory)</option>
                <option value="Menang Diskualifikasi">Menang Diskualifikasi (Disqualification)</option>
                <option value="Menang Undur Diri (UD)">Menang Undur Diri (Walkover / Forfeit)</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Catatan Khusus / Insiden / VAR (Opsional):
              </label>
              <input
                type="text"
                value={catatanKhusus}
                onChange={(e) => setCatatanKhusus(e.target.value)}
                placeholder="Contoh: Verifikasi video review jatuhan sah di babak 2"
                className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-xs text-white focus:outline-none focus:border-amber-500 font-medium"
              />
            </div>
          </div>

          {/* 4. Official Signatories Inputs */}
          <div className="space-y-2 pt-2 border-t border-slate-800">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-300 flex items-center gap-1.5 font-mono">
              <UserCheck className="w-3.5 h-3.5 text-amber-400" />
              <span>Nama Pejabat Penandatangan Resmi (Official Signatories):</span>
            </span>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              <div>
                <label className="block text-[11px] text-slate-400 mb-0.5 font-medium">Ketua Pertandingan (KP):</label>
                <input
                  type="text"
                  value={kpName}
                  onChange={(e) => setKpName(e.target.value)}
                  className="w-full px-3 py-1.5 bg-slate-900 border border-slate-700 rounded-lg text-xs text-white font-medium focus:border-amber-500"
                />
              </div>

              <div>
                <label className="block text-[11px] text-slate-400 mb-0.5 font-medium">Ketua Dewan Wasit Juri:</label>
                <input
                  type="text"
                  value={dewanName}
                  onChange={(e) => setDewanName(e.target.value)}
                  className="w-full px-3 py-1.5 bg-slate-900 border border-slate-700 rounded-lg text-xs text-white font-medium focus:border-amber-500"
                />
              </div>

              <div>
                <label className="block text-[11px] text-slate-400 mb-0.5 font-medium">Wasit Panggung:</label>
                <input
                  type="text"
                  value={wasitName}
                  onChange={(e) => setWasitName(e.target.value)}
                  className="w-full px-3 py-1.5 bg-slate-900 border border-slate-700 rounded-lg text-xs text-white font-medium focus:border-amber-500"
                />
              </div>

              <div>
                <label className="block text-[11px] text-slate-400 mb-0.5 font-medium">Sekretaris Pertandingan:</label>
                <input
                  type="text"
                  value={secretaryName}
                  onChange={(e) => setSecretaryName(e.target.value)}
                  className="w-full px-3 py-1.5 bg-slate-900 border border-slate-700 rounded-lg text-xs text-white font-medium focus:border-amber-500"
                />
              </div>
            </div>
            <p className="text-[10px] text-slate-500 italic">
              * Nama pejabat yang Anda ketik akan otomatis disimpan di browser sehingga tidak perlu diketik ulang di partai selanjutnya.
            </p>
          </div>
        </div>

        {/* Modal Footer Actions */}
        <div className="p-4 sm:p-5 bg-slate-900/90 border-t border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-3">
          <button
            type="button"
            onClick={handlePrintAllTournaments}
            title="Cetak Rekapitulasi Keseluruhan Seluruh Partai Tanding & Seni dalam 1 Dokumen Lengkap"
            className="w-full sm:w-auto px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs uppercase flex items-center justify-center gap-1.5 transition-colors cursor-pointer border border-slate-700"
          >
            <Download className="w-3.5 h-3.5 text-emerald-400" />
            <span>Buku Rekap Seluruh Partai</span>
          </button>

          <div className="flex items-center gap-2.5 w-full sm:w-auto justify-end">
            <button
              type="button"
              onClick={() => { playBeep('click'); onClose(); }}
              className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs uppercase cursor-pointer transition-colors"
            >
              Batal
            </button>
            <button
              type="button"
              onClick={handlePrintPDF}
              disabled={isGenerating}
              className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-yellow-400 text-slate-950 font-black text-xs uppercase shadow-lg shadow-amber-950/40 flex items-center justify-center gap-2 cursor-pointer transition-all active:scale-95 disabled:opacity-50"
            >
              <Printer className="w-4 h-4 text-slate-950" />
              <span>Cetak Rekapitulasi Nilai Akhir (PDF)</span>
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
