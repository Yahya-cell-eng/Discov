/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Upload,
  FileSpreadsheet,
  Download,
  CheckCircle2,
  AlertCircle,
  FileText,
  X,
  Search,
  Shield,
  RefreshCw,
  Users,
  Sparkles,
  Check,
  Building,
  Plus
} from 'lucide-react';
import { playBeep } from '../utils/sound';
import { parseExcelFile, parseRawAthletesData, downloadOfficialExcelTemplate, ParsedAthleteRecord } from '../utils/smartDataParser';

interface UploadKontingenModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccessUpload: () => void;
}

export default function UploadKontingenModal({
  isOpen,
  onClose,
  onSuccessUpload
}: UploadKontingenModalProps) {
  const [activeTab, setActiveTab] = useState<'excel' | 'paste' | 'manual'>('excel');
  const [isDragging, setIsDragging] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [fileName, setFileName] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [parsedAthletes, setParsedAthletes] = useState<ParsedAthleteRecord[]>([]);
  const [pastedText, setPastedText] = useState('');

  // Manual input state
  const [manualKontingen, setManualKontingen] = useState('');
  const [manualNama, setManualNama] = useState('');
  const [manualKategori, setManualKategori] = useState('Tanding');
  const [manualKelas, setManualKelas] = useState('Kelas A');

  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  // Process File Excel
  const handleFileSelected = async (file: File) => {
    setIsLoading(true);
    setErrorMsg(null);
    setFileName(file.name);

    try {
      const records = await parseExcelFile(file);
      if (records.length === 0) {
        setErrorMsg("Tidak ada data atlet/kontingen yang terbaca dari file. Pastikan format file sesuai.");
        setParsedAthletes([]);
      } else {
        setParsedAthletes(records);
        playBeep('valid');
      }
    } catch (err: any) {
      console.error(err);
      setErrorMsg("Gagal memproses file Excel: " + (err.message || 'Format tidak valid.'));
      setParsedAthletes([]);
    } finally {
      setIsLoading(false);
    }
  };

  // Process Pasted Text
  const handleProcessPastedText = () => {
    if (!pastedText.trim()) {
      setErrorMsg("Mohon masukkan teks daftar atlet / kontingen terlebih dahulu.");
      return;
    }

    setIsLoading(true);
    setErrorMsg(null);

    try {
      const records = parseRawAthletesData(pastedText);
      if (records.length === 0) {
        // Fallback: If lines only contain contingent names (one per line)
        const lines = pastedText.split('\n').map(l => l.trim()).filter(Boolean);
        const fallbackRecords: ParsedAthleteRecord[] = lines.map((line, idx) => ({
          id: `contingent_pasted_${idx}_${Date.now()}`,
          originalText: line,
          nama: `Pesilat ${line}`,
          kontingen: line.toUpperCase(),
          kategoriType: 'Tanding',
          kategoriUsia: 'Dewasa',
          kelas: 'Umum',
          gender: 'Putra',
          kelasDisplay: 'Umum',
          isValid: true
        }));
        setParsedAthletes(fallbackRecords);
      } else {
        setParsedAthletes(records);
      }
      playBeep('valid');
    } catch (err: any) {
      setErrorMsg("Gagal memproses teks: " + err.message);
    } finally {
      setIsLoading(false);
    }
  };

  // Apply and Save Data to Storage
  const handleSaveToContingents = () => {
    if (parsedAthletes.length === 0) {
      setErrorMsg("Tidak ada data yang dapat disimpan.");
      return;
    }

    try {
      // 1. Get existing registered athletes
      const savedAthletes = localStorage.getItem('silat_registered_athletes');
      const existing = savedAthletes ? JSON.parse(savedAthletes) : [];
      const existingKeys = new Set(existing.map((a: any) => `${a.nama?.toLowerCase()}_${a.kontingen?.toLowerCase()}`));

      const newToAdd: any[] = [];
      parsedAthletes.forEach((item, idx) => {
        const k = `${item.nama.toLowerCase()}_${item.kontingen.toLowerCase()}`;
        if (!existingKeys.has(k)) {
          existingKeys.add(k);
          newToAdd.push({
            id: item.id || `ath_${Date.now()}_${idx}`,
            nama: item.nama,
            kontingen: item.kontingen.toUpperCase(),
            kelas: item.kelas,
            usia: item.kategoriUsia,
            gender: item.gender
          });
        }
      });

      const updated = [...existing, ...newToAdd];
      localStorage.setItem('silat_registered_athletes', JSON.stringify(updated));

      // 2. Also save to custom contingents list
      const customList = localStorage.getItem('silat_custom_contingents');
      const existingCustom = customList ? JSON.parse(customList) : [];
      const existingContingents = new Set(existingCustom.map((c: any) => (typeof c === 'string' ? c : c.kontingen)));

      parsedAthletes.forEach(item => {
        if (!existingContingents.has(item.kontingen)) {
          existingContingents.add(item.kontingen);
          existingCustom.push({
            id: `custom_${Date.now()}_${Math.random()}`,
            kontingen: item.kontingen,
            nama: item.nama,
            kategori: `${item.kategoriType} ${item.kelas}`,
            kelas: item.kelas,
            usia: item.kategoriUsia,
            gender: item.gender
          });
        }
      });
      localStorage.setItem('silat_custom_contingents', JSON.stringify(existingCustom));

      playBeep('valid');
      onSuccessUpload();
      onClose();
    } catch (e: any) {
      setErrorMsg("Gagal menyimpan data kontingen: " + e.message);
    }
  };

  // Add Manual Contingent
  const handleAddManual = (e: React.FormEvent) => {
    e.preventDefault();
    if (!manualKontingen.trim()) {
      setErrorMsg("Nama kontingen wajib diisi!");
      return;
    }

    const newRecord: ParsedAthleteRecord = {
      id: `manual_${Date.now()}`,
      originalText: manualKontingen,
      nama: manualNama.trim() || `Pesilat ${manualKontingen.trim().toUpperCase()}`,
      kontingen: manualKontingen.trim().toUpperCase(),
      kategoriType: manualKategori as any,
      kategoriUsia: 'Dewasa',
      kelas: manualKelas,
      gender: 'Putra',
      kelasDisplay: manualKelas,
      isValid: true
    };

    setParsedAthletes(prev => [...prev, newRecord]);
    setManualKontingen('');
    setManualNama('');
    playBeep('valid');
  };

  // Summary Metrics of Parsed Data
  const uniqueContingents = Array.from(new Set(parsedAthletes.map(a => a.kontingen))).sort();

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md overflow-y-auto">
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 20 }}
        className="w-full max-w-3xl bg-slate-900 border border-slate-700/80 rounded-3xl shadow-2xl overflow-hidden flex flex-col my-auto max-h-[90vh]"
      >
        {/* Modal Header */}
        <div className="p-5 sm:p-6 border-b border-slate-800 bg-slate-950/80 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-400">
              <Building className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base sm:text-lg font-black font-sport tracking-wider text-white uppercase">
                UNGGAH DATA KONTINGEN & PESILAT
              </h3>
              <p className="text-[11px] font-mono text-slate-400">
                Impor data kontingen dan pesilat untuk disinkronkan otomatis dengan tabel rekapitulasi medali
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl bg-slate-800 text-slate-400 hover:text-white hover:bg-slate-700 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Tabs */}
        <div className="px-6 pt-4 pb-2 border-b border-slate-800 bg-slate-900 flex items-center gap-2">
          <button
            onClick={() => { setActiveTab('excel'); playBeep('click'); }}
            className={`px-4 py-2 rounded-xl text-xs font-bold font-mono tracking-wider uppercase transition-all flex items-center gap-2 ${
              activeTab === 'excel'
                ? 'bg-amber-500 text-slate-950 shadow-md font-black'
                : 'text-slate-400 hover:text-white hover:bg-slate-800'
            }`}
          >
            <FileSpreadsheet className="w-4 h-4" />
            <span>File Excel / CSV</span>
          </button>

          <button
            onClick={() => { setActiveTab('paste'); playBeep('click'); }}
            className={`px-4 py-2 rounded-xl text-xs font-bold font-mono tracking-wider uppercase transition-all flex items-center gap-2 ${
              activeTab === 'paste'
                ? 'bg-amber-500 text-slate-950 shadow-md font-black'
                : 'text-slate-400 hover:text-white hover:bg-slate-800'
            }`}
          >
            <FileText className="w-4 h-4" />
            <span>Tempel Teks</span>
          </button>

          <button
            onClick={() => { setActiveTab('manual'); playBeep('click'); }}
            className={`px-4 py-2 rounded-xl text-xs font-bold font-mono tracking-wider uppercase transition-all flex items-center gap-2 ${
              activeTab === 'manual'
                ? 'bg-amber-500 text-slate-950 shadow-md font-black'
                : 'text-slate-400 hover:text-white hover:bg-slate-800'
            }`}
          >
            <Plus className="w-4 h-4" />
            <span>Input Manual</span>
          </button>

          <div className="ml-auto">
            <button
              onClick={downloadOfficialExcelTemplate}
              className="text-[11px] font-mono font-bold text-amber-400 hover:text-amber-300 underline flex items-center gap-1.5"
              title="Unduh Template Excel Format Standar IPSI"
            >
              <Download className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Unduh Template Excel</span>
            </button>
          </div>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto flex-1 space-y-4">
          {errorMsg && (
            <div className="p-3.5 rounded-2xl bg-red-950/70 border border-red-800 text-red-200 text-xs font-mono flex items-center gap-2.5">
              <AlertCircle className="w-4 h-4 shrink-0 text-red-400" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* TAB 1: FILE EXCEL / CSV */}
          {activeTab === 'excel' && (
            <div className="space-y-4">
              <div
                onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
                onDragLeave={() => setIsDragging(false)}
                onDrop={(e) => {
                  e.preventDefault();
                  setIsDragging(false);
                  if (e.dataTransfer.files && e.dataTransfer.files[0]) {
                    handleFileSelected(e.dataTransfer.files[0]);
                  }
                }}
                onClick={() => fileInputRef.current?.click()}
                className={`border-2 border-dashed rounded-3xl p-8 text-center cursor-pointer transition-all flex flex-col items-center justify-center ${
                  isDragging
                    ? 'border-amber-400 bg-amber-950/30'
                    : 'border-slate-700 hover:border-amber-500/60 bg-slate-950/60'
                }`}
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".xlsx, .xls, .csv"
                  className="hidden"
                  onChange={(e) => {
                    if (e.target.files && e.target.files[0]) {
                      handleFileSelected(e.target.files[0]);
                    }
                  }}
                />

                <div className="w-14 h-14 rounded-2xl bg-emerald-950/80 border border-emerald-500/40 flex items-center justify-center text-emerald-400 mb-3 shadow-lg">
                  <FileSpreadsheet className="w-7 h-7" />
                </div>

                <h4 className="text-sm font-black font-sport tracking-wider text-slate-200 uppercase mb-1">
                  PILIH ATAU TARIK FILE EXCEL (.XLSX / .XLS / .CSV)
                </h4>
                <p className="text-xs font-mono text-slate-400 max-w-md">
                  Mendukung kolom nama atlet, nama kontingen/daerah, kelas, dan kategori. Sistem otomatis mengenali struktur tabel Anda.
                </p>

                {fileName && (
                  <div className="mt-4 px-3 py-1.5 rounded-full bg-emerald-950/90 border border-emerald-500/50 text-emerald-300 text-xs font-mono font-bold flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4" />
                    <span>File Terpilih: {fileName}</span>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* TAB 2: TEMPEL TEKS */}
          {activeTab === 'paste' && (
            <div className="space-y-3">
              <label className="block text-xs font-mono font-bold text-slate-300 uppercase">
                Tempel Data Teks (Dari Excel / Spreadsheet / Notepad)
              </label>
              <textarea
                value={pastedText}
                onChange={(e) => setPastedText(e.target.value)}
                rows={6}
                placeholder={`Contoh baris tabel:
1   HIDAYAT LIMONU   SULAWESI UTARA   Tanding   Kelas B   Putra
2   YUDHA MAHENDRI   RIAU             Tanding   Kelas B   Putra
3   MUH ISKANDAR     PAPUA            Tanding   Kelas B   Putra

Atau cukup daftar kontingen per baris:
KONTINGEN JAWA BARAT
KONTINGEN DKI JAKARTA
KONTINGEN JAWA TIMUR`}
                className="w-full p-4 rounded-2xl bg-slate-950 border border-slate-700 text-slate-200 font-mono text-xs focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500"
              />
              <button
                type="button"
                onClick={handleProcessPastedText}
                disabled={isLoading}
                className="px-4 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-mono font-black uppercase transition-all shadow flex items-center gap-2 cursor-pointer"
              >
                <Sparkles className="w-4 h-4" />
                <span>Analisis & Proses Teks</span>
              </button>
            </div>
          )}

          {/* TAB 3: INPUT MANUAL */}
          {activeTab === 'manual' && (
            <form onSubmit={handleAddManual} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-mono font-bold text-slate-300 uppercase mb-1">
                    Nama Kontingen *
                  </label>
                  <input
                    type="text"
                    required
                    value={manualKontingen}
                    onChange={(e) => setManualKontingen(e.target.value)}
                    placeholder="misal: TAPAK SUCI BANDUNG / JAWA BARAT"
                    className="w-full px-3.5 py-2 rounded-xl bg-slate-950 border border-slate-700 text-slate-100 font-mono text-xs focus:outline-none focus:border-amber-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-mono font-bold text-slate-300 uppercase mb-1">
                    Nama Pesilat / Atlet (Opsional)
                  </label>
                  <input
                    type="text"
                    value={manualNama}
                    onChange={(e) => setManualNama(e.target.value)}
                    placeholder="misal: Ahmad Fauzi"
                    className="w-full px-3.5 py-2 rounded-xl bg-slate-950 border border-slate-700 text-slate-100 font-mono text-xs focus:outline-none focus:border-amber-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-mono font-bold text-slate-300 uppercase mb-1">
                    Kategori Lomba
                  </label>
                  <select
                    value={manualKategori}
                    onChange={(e) => setManualKategori(e.target.value)}
                    className="w-full px-3.5 py-2 rounded-xl bg-slate-950 border border-slate-700 text-slate-100 font-mono text-xs focus:outline-none focus:border-amber-500"
                  >
                    <option value="Tanding">Tanding</option>
                    <option value="Tunggal">Seni Tunggal</option>
                    <option value="Ganda">Seni Ganda</option>
                    <option value="Regu">Seni Regu</option>
                    <option value="Solo Kreatif">Solo Kreatif</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-mono font-bold text-slate-300 uppercase mb-1">
                    Kelas / Detail
                  </label>
                  <input
                    type="text"
                    value={manualKelas}
                    onChange={(e) => setManualKelas(e.target.value)}
                    placeholder="misal: Kelas A (45-50 kg)"
                    className="w-full px-3.5 py-2 rounded-xl bg-slate-950 border border-slate-700 text-slate-100 font-mono text-xs focus:outline-none focus:border-amber-500"
                  />
                </div>
              </div>

              <button
                type="submit"
                className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-mono font-black uppercase transition-all shadow flex items-center gap-1.5 cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                <span>Tambahkan ke Daftar Unggah</span>
              </button>
            </form>
          )}

          {/* PREVIEW OF PARSED DATA */}
          {parsedAthletes.length > 0 && (
            <div className="pt-4 border-t border-slate-800 space-y-3">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center gap-3">
                  <span className="px-2.5 py-1 rounded-lg bg-emerald-950 border border-emerald-700 text-emerald-300 font-mono text-xs font-black">
                    {uniqueContingents.length} KONTINGEN TERDETEKSI
                  </span>
                  <span className="text-xs font-mono text-slate-400">
                    Total {parsedAthletes.length} Atlet
                  </span>
                </div>

                <button
                  type="button"
                  onClick={() => setParsedAthletes([])}
                  className="text-xs font-mono text-red-400 hover:text-red-300 underline"
                >
                  Bersihkan
                </button>
              </div>

              {/* Contingents Tags Grid */}
              <div className="flex flex-wrap gap-1.5 max-h-32 overflow-y-auto p-2 rounded-xl bg-slate-950 border border-slate-800">
                {uniqueContingents.map(k => (
                  <span
                    key={k}
                    className="px-2 py-0.5 rounded bg-slate-900 border border-slate-700 text-slate-200 text-[10px] font-mono font-bold uppercase"
                  >
                    {k}
                  </span>
                ))}
              </div>

              {/* Sample Table Preview */}
              <div className="border border-slate-800 rounded-2xl bg-slate-950/80 overflow-hidden max-h-48 overflow-y-auto text-xs font-mono">
                <table className="w-full text-left">
                  <thead className="bg-slate-900 text-slate-400 text-[10px] uppercase font-bold sticky top-0">
                    <tr>
                      <th className="p-2.5">No</th>
                      <th className="p-2.5">Nama Atlet</th>
                      <th className="p-2.5">Kontingen</th>
                      <th className="p-2.5">Kategori / Kelas</th>
                      <th className="p-2.5">Gender</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800 text-slate-300">
                    {parsedAthletes.slice(0, 50).map((ath, idx) => (
                      <tr key={idx} className="hover:bg-slate-900/50">
                        <td className="p-2.5 text-slate-500">{idx + 1}</td>
                        <td className="p-2.5 font-bold text-white">{ath.nama}</td>
                        <td className="p-2.5 text-amber-300 font-bold uppercase">{ath.kontingen}</td>
                        <td className="p-2.5">{ath.kategoriType} {ath.kelas}</td>
                        <td className="p-2.5 text-slate-400">{ath.gender}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="p-5 border-t border-slate-800 bg-slate-950/90 flex items-center justify-between gap-3">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-mono font-bold uppercase transition-all"
          >
            Batal
          </button>

          <button
            type="button"
            onClick={handleSaveToContingents}
            disabled={parsedAthletes.length === 0 || isLoading}
            className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 text-xs font-mono font-black uppercase transition-all shadow-lg flex items-center gap-2 disabled:opacity-50 cursor-pointer"
          >
            <Check className="w-4 h-4" />
            <span>Terapkan & Simpan ke Rekapitulasi Medali ({parsedAthletes.length} Atlet)</span>
          </button>
        </div>
      </motion.div>
    </div>
  );
}
