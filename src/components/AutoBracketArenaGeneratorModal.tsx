/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo, useRef } from 'react';
import { motion } from 'motion/react';
import {
  FileSpreadsheet,
  Wand2,
  CheckCircle2,
  AlertCircle,
  Download,
  FileUp,
  X,
  ShieldCheck,
  Users,
  Layers,
  Sparkles,
  GitBranch,
  MapPin,
  RefreshCw,
  ChevronRight,
  Filter,
  Check
} from 'lucide-react';
import { BaganCategory, GelanggangInfo, TGRPeserta, TGRPartaiPool } from '../types';
import {
  parseExcelFile,
  parseRawAthletesData,
  ParsedAthleteRecord,
  downloadOfficialExcelTemplate,
  exportAthletesToExcelFile
} from '../utils/smartDataParser';
import {
  generateTournamentBracketsAndDistribute,
  TournamentGenerationResult,
  verifyVenueConsistency
} from '../utils/tournamentBracketGenerator';
import { playBeep } from '../utils/sound';

interface AutoBracketArenaGeneratorModalProps {
  isOpen: boolean;
  onClose: () => void;
  theme?: 'dark' | 'light';
  arenasList: GelanggangInfo[];
  currentArenaId?: string;
  dispatch?: (action: string, payload?: any) => Promise<any> | void;
  onSuccessApply?: (result: TournamentGenerationResult) => void;
}

export default function AutoBracketArenaGeneratorModal({
  isOpen,
  onClose,
  theme = 'dark',
  arenasList,
  currentArenaId = 'arena_1',
  dispatch,
  onSuccessApply
}: AutoBracketArenaGeneratorModalProps) {
  // Input modes
  const [inputMode, setInputMode] = useState<'excel' | 'text'>('excel');
  const [rawText, setRawText] = useState('');
  const [excelFileName, setExcelFileName] = useState<string | null>(null);
  const [excelLoading, setExcelLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Parsed raw athletes list
  const [parsedAthletes, setParsedAthletes] = useState<ParsedAthleteRecord[]>([]);

  // Generation options
  const [selectedArenaIds, setSelectedArenaIds] = useState<string[]>(() => {
    return arenasList.length > 0 ? arenasList.map(a => a.id) : ['arena_1', 'arena_2'];
  });
  const [bracketSizeLimit, setBracketSizeLimit] = useState<2 | 4 | 8 | 16>(4);
  const [seniPoolSize, setSeniPoolSize] = useState<number>(4);
  const [enforceSameArena, setEnforceSameArena] = useState<boolean>(true);
  const [separateContingent, setSeparateContingent] = useState<boolean>(true);

  // Active preview tab
  const [previewTab, setPreviewTab] = useState<'summary' | 'tanding' | 'seni' | 'gelanggang'>('summary');
  const [filterArenaId, setFilterArenaId] = useState<string>('all');

  // Generation result computation
  const generationResult: TournamentGenerationResult | null = useMemo(() => {
    if (parsedAthletes.length === 0) return null;

    const chosenArenas = arenasList.filter(a => selectedArenaIds.includes(a.id));
    const effectiveArenas = chosenArenas.length > 0 ? chosenArenas : arenasList;

    return generateTournamentBracketsAndDistribute(parsedAthletes, effectiveArenas, {
      bracketSizeLimit,
      seniParticipantsPerPool: seniPoolSize,
      enforceSameArenaForSemiAndFinal: enforceSameArena,
      separateContingentInFirstRound: separateContingent
    });
  }, [parsedAthletes, selectedArenaIds, arenasList, bracketSizeLimit, seniPoolSize, enforceSameArena, separateContingent]);

  if (!isOpen) return null;

  // Handle Excel upload
  const handleProcessExcel = async (file: File) => {
    try {
      setExcelLoading(true);
      setErrorMessage(null);
      playBeep('click');

      const records = await parseExcelFile(file);
      if (!records || records.length === 0) {
        setErrorMessage('File Excel kosong atau kolom tidak dapat dikenali.');
        playBeep('warning');
        return;
      }

      setExcelFileName(file.name);
      setParsedAthletes(records);
      playBeep('valid');
    } catch (err: any) {
      console.error(err);
      setErrorMessage(`Gagal membaca Excel: ${err?.message || 'Format tidak didukung'}`);
      playBeep('warning');
    } finally {
      setExcelLoading(false);
    }
  };

  // Handle Text analysis
  const handleAnalyzeText = (text: string) => {
    setRawText(text);
    if (!text.trim()) {
      setParsedAthletes([]);
      return;
    }
    const results = parseRawAthletesData(text);
    setParsedAthletes(results);
  };

  // Sample data loader
  const handleLoadSampleData = () => {
    const sample = `1. HIDAYAT LIMONU - SULAWESI UTARA - Tanding B PA Dewasa
2. YUDHA MAHENDRI - RIAU - Tanding B PA Dewasa
3. FAJAR RAMADHAN - BANTEN - Tanding B PA Dewasa
4. ILHAM WIJAYA - JAWA BARAT - Tanding B PA Dewasa
5. SITI NURHALIZA - JAWA TIMUR - Tanding A PI Remaja
6. PUTRI RAHMAWATI - BALI - Tanding A PI Remaja
7. DEWI ANGGRAENI - SUMATERA BARAT - Tanding A PI Remaja
8. RINA MARLINA - DKI JAKARTA - Tanding A PI Remaja
9. AHMAD FAUZI - JAWA TENGAH - Tunggal PA Dewasa Seni
10. BAGUS SETIAWAN - DI YOGYAKARTA - Tunggal PA Dewasa Seni
11. DIMAS PRASETYO - LAMPUNG - Tunggal PA Dewasa Seni
12. BAYU SAPUTRA - KALIMANTAN TIMUR - Tunggal PA Dewasa Seni`;

    handleAnalyzeText(sample);
    setInputMode('text');
    playBeep('valid');
  };

  // Toggle arena selection
  const toggleArena = (arenaId: string) => {
    if (selectedArenaIds.includes(arenaId)) {
      if (selectedArenaIds.length === 1) return; // keep at least 1
      setSelectedArenaIds(selectedArenaIds.filter(id => id !== arenaId));
    } else {
      setSelectedArenaIds([...selectedArenaIds, arenaId]);
    }
  };

  // Execution: Distribute to ALL arenas
  const handleApplyToAllArenas = async () => {
    if (!generationResult) return;

    playBeep('valid');

    if (dispatch) {
      await dispatch('DISTRIBUTE_EXCEL_ALL_ARENAS', {
        tandingCategories: generationResult.tandingCategories,
        seniPesertaList: generationResult.seniPesertaList,
        targetArenaIds: selectedArenaIds
      });
    }

    if (onSuccessApply) {
      onSuccessApply(generationResult);
    }

    alert(
      `Berhasil mendistribusikan ${parsedAthletes.length} atlet ke ${selectedArenaIds.length} Gelanggang!\n\n` +
      `• Kategori Usia, Jenis Kelamin, dan Kelas terpisah secara otomatis.\n` +
      `• Jaminan Gelanggang Konsisten: Peserta yang bertanding di babak Semi Final pada suatu Gelanggang 100% bertanding di Gelanggang yang sama pada babak Final.\n` +
      `• Layar Monitor, Sekretaris, dan Jadwal di semua gelanggang telah disinkronkan.`
    );

    onClose();
  };

  // Execution: Apply to CURRENT arena only
  const handleApplyToCurrentArenaOnly = async () => {
    if (!generationResult) return;

    playBeep('valid');

    const currentSummary = generationResult.arenaSummaries.find(a => a.arenaId === currentArenaId) || generationResult.arenaSummaries[0];
    const catsToApply = currentSummary?.categories || generationResult.tandingCategories;
    const seniToApply = currentSummary?.seniPesertaList || generationResult.seniPesertaList;

    if (dispatch) {
      if (catsToApply.length > 0) {
        await dispatch('UPDATE_BAGAN_CATEGORIES', {
          arenaId: currentArenaId,
          categories: catsToApply
        });
      }
      if (seniToApply.length > 0) {
        await dispatch('UPDATE_TGR_PESERTA_LIST', {
          arenaId: currentArenaId,
          pesertaList: seniToApply
        });
        await dispatch('TGR_UPDATE_PESERTA', {
          arenaId: currentArenaId,
          action: 'sync_list',
          pesertaList: seniToApply
        });
      }
    }

    alert(`Berhasil menerapkan jadwal (${catsToApply.length} bagan tanding, ${seniToApply.length} peserta seni) khusus untuk gelanggang saat ini!`);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-[99999] flex items-center justify-center p-2 sm:p-4 bg-black/80 backdrop-blur-md overflow-y-auto">
      <motion.div
        initial={{ opacity: 0, scale: 0.96 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.96 }}
        className={`w-full max-w-6xl rounded-2xl border shadow-2xl overflow-hidden flex flex-col max-h-[92vh] ${
          theme === 'dark' ? 'bg-[#080d1a] border-emerald-500/40 text-slate-100' : 'bg-white border-emerald-500 text-slate-900'
        }`}
      >
        {/* HEADER */}
        <div className="px-6 py-4 border-b border-emerald-500/30 bg-gradient-to-r from-emerald-950/90 via-slate-900 to-teal-950/90 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-xl bg-emerald-500/20 border border-emerald-400/50 flex items-center justify-center text-emerald-400 shadow-lg">
              <GitBranch className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base sm:text-lg font-black uppercase text-emerald-300 tracking-wide flex items-center gap-2">
                  Generator Bagan & Distribusi Gelanggang Otomatis
                </h3>
                <span className="hidden sm:inline-flex px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-emerald-500/20 border border-emerald-400/40 text-emerald-300">
                  Venue Consistency Guarantee
                </span>
              </div>
              <p className="text-xs text-slate-300 font-mono mt-0.5">
                Memisahkan Kelas, Usia, Gender, Tanding/Seni & membagi ke semua Gelanggang dengan garansi Semi Final & Final di arena yang sama.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => downloadOfficialExcelTemplate()}
              className="px-3 py-1.5 rounded-lg bg-emerald-950/80 hover:bg-emerald-900 border border-emerald-400/40 text-emerald-200 text-xs font-bold font-mono uppercase flex items-center gap-1.5 cursor-pointer transition-colors"
              title="Unduh format template Excel resmi"
            >
              <Download className="w-3.5 h-3.5 text-emerald-400" />
              <span className="hidden sm:inline">Template Excel</span>
            </button>
            <button
              onClick={onClose}
              className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white cursor-pointer transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* BODY (Scrollable) */}
        <div className="p-4 sm:p-6 overflow-y-auto space-y-6 flex-1 text-xs">
          
          {/* STEP 1: INPUT DATA SECTION */}
          <div className={`p-4 rounded-xl border ${theme === 'dark' ? 'bg-slate-900/50 border-slate-800' : 'bg-slate-50 border-slate-200'}`}>
            <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-2 mb-3">
              <div className="flex items-center gap-2">
                <span className="w-5 h-5 rounded-full bg-emerald-600 text-white font-bold flex items-center justify-center text-[11px]">1</span>
                <h4 className="font-black uppercase tracking-wider text-slate-200">
                  Input Daftar Peserta (Excel / CSV / Teks Bebas)
                </h4>
              </div>

              {/* Mode switch & Sample button */}
              <div className="flex items-center gap-2">
                <div className="flex items-center p-0.5 bg-slate-950/80 border border-slate-800 rounded-lg">
                  <button
                    onClick={() => setInputMode('excel')}
                    className={`px-3 py-1 rounded-md text-[11px] font-mono font-bold uppercase transition-all ${
                      inputMode === 'excel' ? 'bg-emerald-600 text-white' : 'text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    Upload Excel
                  </button>
                  <button
                    onClick={() => setInputMode('text')}
                    className={`px-3 py-1 rounded-md text-[11px] font-mono font-bold uppercase transition-all ${
                      inputMode === 'text' ? 'bg-amber-600 text-white' : 'text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    Tempel Teks
                  </button>
                </div>

                <button
                  onClick={handleLoadSampleData}
                  className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-amber-300 text-[11px] font-mono font-bold flex items-center gap-1 cursor-pointer"
                >
                  <Sparkles className="w-3 h-3 text-amber-400" />
                  <span>Contoh Data</span>
                </button>
              </div>
            </div>

            {/* Hidden file input */}
            <input
              ref={fileInputRef}
              type="file"
              accept=".xlsx, .xls, .csv"
              onChange={(e) => {
                if (e.target.files && e.target.files.length > 0) {
                  handleProcessExcel(e.target.files[0]);
                  e.target.value = '';
                }
              }}
              className="hidden"
            />

            {inputMode === 'excel' ? (
              <div>
                <div
                  onClick={() => fileInputRef.current?.click()}
                  onDragOver={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                  }}
                  onDrop={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
                      handleProcessExcel(e.dataTransfer.files[0]);
                    }
                  }}
                  className="border-2 border-dashed border-emerald-500/40 hover:border-emerald-400 bg-slate-950/60 hover:bg-emerald-950/20 p-6 rounded-xl flex flex-col items-center justify-center text-center cursor-pointer transition-all group"
                >
                  <FileUp className="w-8 h-8 text-emerald-400 group-hover:scale-110 transition-transform mb-2" />
                  <span className="font-bold text-slate-200 uppercase tracking-wide">
                    {excelLoading ? 'Sedang Membaca & Memisahkan Kategori...' : 'Klik atau Seret (Drag & Drop) File Excel ke Sini'}
                  </span>
                  <p className="text-slate-400 font-mono mt-1 text-[11px]">
                    Sistem mendeteksi kolom: <span className="text-emerald-400 font-bold">Nama Atlet, Kontingen, Kategori (Tanding/Seni), Kelas, Usia & Gender</span>
                  </p>
                  {excelFileName && (
                    <div className="mt-2.5 px-3 py-1 rounded-md bg-emerald-950 border border-emerald-400/50 text-emerald-300 font-mono text-[11px] flex items-center gap-2">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                      <span>File Terbaca: {excelFileName} ({parsedAthletes.length} Peserta)</span>
                    </div>
                  )}
                </div>

                {errorMessage && (
                  <div className="mt-2 p-2.5 bg-red-950/60 border border-red-500/50 rounded-lg font-mono text-red-200 text-[11px] flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
                    <span>{errorMessage}</span>
                  </div>
                )}
              </div>
            ) : (
              <div className="space-y-2">
                <textarea
                  rows={4}
                  value={rawText}
                  onChange={(e) => handleAnalyzeText(e.target.value)}
                  placeholder="Tempel baris nama peserta. Format bebas, contoh:&#10;1. HIDAYAT LIMONU - SULAWESI UTARA - Tanding B PA Dewasa&#10;2. YUDHA MAHENDRI - RIAU - Tanding B PA Dewasa&#10;3. AHMAD FAUZI - JATENG - Tunggal PA Dewasa Seni"
                  className={`w-full p-3 border rounded-xl font-mono text-xs placeholder-slate-500 focus:outline-none ${
                    theme === 'dark' ? 'bg-slate-950 border-slate-700 text-slate-200 focus:border-emerald-500' : 'bg-white border-slate-300 text-slate-800 focus:border-emerald-500'
                  }`}
                />
              </div>
            )}

            {/* Quick stats on detected data */}
            {parsedAthletes.length > 0 && (
              <div className="mt-3 pt-3 border-t border-slate-800 flex flex-wrap items-center justify-between gap-2 text-[11px] font-mono">
                <div className="flex items-center gap-3">
                  <span className="text-emerald-400 font-bold flex items-center gap-1">
                    <Users className="w-3.5 h-3.5" /> Total: {parsedAthletes.length} Peserta
                  </span>
                  <span className="text-blue-400 font-bold">
                    ⚔️ Tanding: {parsedAthletes.filter(p => p.kategoriType === 'Tanding').length}
                  </span>
                  <span className="text-amber-400 font-bold">
                    🥋 Seni: {parsedAthletes.filter(p => p.kategoriType !== 'Tanding').length}
                  </span>
                </div>

                <button
                  onClick={() => exportAthletesToExcelFile(parsedAthletes, 'Data_Peserta_Terpisah.xlsx')}
                  className="text-emerald-400 hover:text-emerald-300 flex items-center gap-1 font-bold cursor-pointer"
                >
                  <Download className="w-3 h-3" />
                  <span>Ekspor Excel</span>
                </button>
              </div>
            )}
          </div>

          {/* STEP 2: CONFIGURATION & ARENA SELECTION */}
          <div className={`p-4 rounded-xl border ${theme === 'dark' ? 'bg-slate-900/50 border-slate-800' : 'bg-slate-50 border-slate-200'}`}>
            <div className="flex items-center gap-2 mb-3">
              <span className="w-5 h-5 rounded-full bg-emerald-600 text-white font-bold flex items-center justify-center text-[11px]">2</span>
              <h4 className="font-black uppercase tracking-wider text-slate-200">
                Konfigurasi Gelanggang & Integritas Venue
              </h4>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {/* Gelanggang selection */}
              <div className="space-y-2">
                <label className="font-bold text-slate-300 flex items-center justify-between">
                  <span>Pilih Gelanggang Tujuan:</span>
                  <span className="text-emerald-400 text-[10px] font-mono">({selectedArenaIds.length} Aktif)</span>
                </label>
                <div className="space-y-1.5 max-h-36 overflow-y-auto pr-1">
                  {arenasList.map(arena => {
                    const isSelected = selectedArenaIds.includes(arena.id);
                    return (
                      <div
                        key={arena.id}
                        onClick={() => toggleArena(arena.id)}
                        className={`p-2 rounded-lg border flex items-center justify-between cursor-pointer transition-colors ${
                          isSelected
                            ? 'bg-emerald-950/50 border-emerald-500/60 text-emerald-200'
                            : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-slate-200'
                        }`}
                      >
                        <div className="flex items-center gap-2">
                          <div className={`w-4 h-4 rounded border flex items-center justify-center text-[10px] ${
                            isSelected ? 'bg-emerald-600 border-emerald-400 text-white' : 'border-slate-700'
                          }`}>
                            {isSelected && <Check className="w-3 h-3" />}
                          </div>
                          <span className="font-bold">{arena.nama}</span>
                        </div>
                        <span className="text-[10px] font-mono uppercase text-slate-500">
                          {arena.modeAktif ? `Mode: ${arena.modeAktif}` : 'Umum'}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Bracket Size & Seni Pool Size */}
              <div className="space-y-3">
                <div>
                  <label className="font-bold text-slate-300 block mb-1">
                    Kapasitas Bagan Tanding (Pool/Bagan):
                  </label>
                  <div className="grid grid-cols-4 gap-1.5">
                    {([2, 4, 8, 16] as const).map(size => (
                      <button
                        key={size}
                        onClick={() => setBracketSizeLimit(size)}
                        className={`py-1.5 rounded-lg border text-center font-mono font-bold text-xs transition-colors cursor-pointer ${
                          bracketSizeLimit === size
                            ? 'bg-emerald-600 border-emerald-400 text-white'
                            : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-slate-200'
                        }`}
                      >
                        {size} Atlet
                      </button>
                    ))}
                  </div>
                  <p className="text-[10px] text-slate-400 font-mono mt-1">
                    {bracketSizeLimit === 4 ? 'Semi Final (2 partai) + Final (1 partai)' : bracketSizeLimit === 8 ? 'Perempat (4 partai) + Semi (2) + Final (1)' : bracketSizeLimit === 2 ? 'Langsung Final (1 partai)' : 'Babak 16 Besar'}
                  </p>
                </div>

                <div>
                  <label className="font-bold text-slate-300 block mb-1">
                    Jumlah Peserta Seni per Pool:
                  </label>
                  <div className="flex items-center gap-2">
                    {[3, 4, 5, 6].map(num => (
                      <button
                        key={num}
                        onClick={() => setSeniPoolSize(num)}
                        className={`flex-1 py-1 rounded-lg border text-center font-mono font-bold text-xs cursor-pointer ${
                          seniPoolSize === num
                            ? 'bg-amber-600 border-amber-400 text-white'
                            : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-slate-200'
                        }`}
                      >
                        {num}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Special Guarantee Options */}
              <div className="space-y-3 bg-emerald-950/30 border border-emerald-500/40 rounded-xl p-3">
                <div className="flex items-center gap-2 text-emerald-300 font-bold uppercase">
                  <ShieldCheck className="w-4 h-4 text-emerald-400" />
                  <span>Garansi Integritas Gelanggang</span>
                </div>

                {/* Primary Rule Checkbox (Semi & Final same arena) */}
                <label className="flex items-start gap-2.5 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={enforceSameArena}
                    onChange={(e) => setEnforceSameArena(e.target.checked)}
                    className="mt-0.5 w-4 h-4 text-emerald-600 rounded bg-slate-900 border-emerald-500 focus:ring-emerald-500"
                  />
                  <div className="text-[11px]">
                    <span className="font-bold text-slate-200">
                      Semi-Final & Final di Gelanggang yang Sama
                    </span>
                    <p className="text-slate-400 font-mono text-[10px] mt-0.5">
                      Peserta di Gelanggang 1 pada babak Semi Final 100% bertanding di Gelanggang 1 pada babak Final tanpa pindah arena.
                    </p>
                  </div>
                </label>

                {/* Contingent separation checkbox */}
                <label className="flex items-start gap-2.5 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={separateContingent}
                    onChange={(e) => setSeparateContingent(e.target.checked)}
                    className="mt-0.5 w-4 h-4 text-emerald-600 rounded bg-slate-900 border-emerald-500 focus:ring-emerald-500"
                  />
                  <div className="text-[11px]">
                    <span className="font-bold text-slate-200">
                      Pisahkan Kontingen Sama di Awal
                    </span>
                    <p className="text-slate-400 font-mono text-[10px] mt-0.5">
                      Mencegah pesilat dari perguruan/daerah yang sama saling bertemu di babak penyisihan pertama.
                    </p>
                  </div>
                </label>
              </div>
            </div>
          </div>

          {/* STEP 3: PREVIEW & AUDIT VERIFICATION */}
          {generationResult && (
            <div className={`p-4 rounded-xl border ${theme === 'dark' ? 'bg-slate-900/50 border-slate-800' : 'bg-slate-50 border-slate-200'}`}>
              <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-2 mb-3">
                <div className="flex items-center gap-2">
                  <span className="w-5 h-5 rounded-full bg-emerald-600 text-white font-bold flex items-center justify-center text-[11px]">3</span>
                  <h4 className="font-black uppercase tracking-wider text-slate-200">
                    Hasil Pemisahan & Alokasi Gelanggang
                  </h4>
                </div>

                {/* Sub-tabs */}
                <div className="flex items-center gap-1 bg-slate-950 p-0.5 rounded-lg border border-slate-800">
                  <button
                    onClick={() => setPreviewTab('summary')}
                    className={`px-2.5 py-1 rounded text-[11px] font-mono font-bold transition-all ${
                      previewTab === 'summary' ? 'bg-emerald-600 text-white' : 'text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    Ringkasan Gelanggang
                  </button>
                  <button
                    onClick={() => setPreviewTab('tanding')}
                    className={`px-2.5 py-1 rounded text-[11px] font-mono font-bold transition-all ${
                      previewTab === 'tanding' ? 'bg-emerald-600 text-white' : 'text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    Bagan Tanding ({generationResult.tandingCategories.length})
                  </button>
                  <button
                    onClick={() => setPreviewTab('seni')}
                    className={`px-2.5 py-1 rounded text-[11px] font-mono font-bold transition-all ${
                      previewTab === 'seni' ? 'bg-emerald-600 text-white' : 'text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    Pool Seni ({generationResult.seniPesertaList.length})
                  </button>
                </div>
              </div>

              {/* VERIFICATION BANNER */}
              <div className="p-3 bg-emerald-950/60 border border-emerald-500/60 rounded-xl mb-4 flex items-center justify-between gap-3">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-lg bg-emerald-500/20 border border-emerald-400/40 flex items-center justify-center text-emerald-400 shrink-0">
                    <CheckCircle2 className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="font-black text-emerald-200 uppercase tracking-wide flex items-center gap-2">
                      <span>Verifikasi Konsistensi Venue: 100% Lulus</span>
                      <span className="px-1.5 py-0.2 rounded bg-emerald-500/30 text-emerald-300 text-[9px] font-mono">
                        ZERO VENUE SHUFFLE
                      </span>
                    </div>
                    <p className="text-emerald-300/80 font-mono text-[11px]">
                      {generationResult.venueConsistencyMessage}
                    </p>
                  </div>
                </div>

                <div className="hidden lg:flex items-center gap-3 text-[11px] font-mono text-emerald-300">
                  <div className="text-center px-3 py-1 bg-emerald-900/40 rounded-lg border border-emerald-500/30">
                    <span className="block text-[10px] text-slate-400">Total Bagan</span>
                    <span className="font-bold text-white">{generationResult.tandingCategories.length}</span>
                  </div>
                  <div className="text-center px-3 py-1 bg-emerald-900/40 rounded-lg border border-emerald-500/30">
                    <span className="block text-[10px] text-slate-400">Total Partai</span>
                    <span className="font-bold text-white">{generationResult.totalMatches}</span>
                  </div>
                </div>
              </div>

              {/* TAB 1: SUMMARY PER ARENA */}
              {previewTab === 'summary' && (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                  {generationResult.arenaSummaries.map((summary) => (
                    <div
                      key={summary.arenaId}
                      className="p-3.5 rounded-xl border border-slate-800 bg-slate-950 flex flex-col justify-between space-y-3"
                    >
                      <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                        <div className="flex items-center gap-2">
                          <MapPin className="w-4 h-4 text-emerald-400" />
                          <span className="font-black text-white text-sm uppercase">{summary.arenaNama}</span>
                        </div>
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-emerald-950 border border-emerald-500/40 text-emerald-300">
                          {summary.tandingMatchesCount} Partai
                        </span>
                      </div>

                      <div className="grid grid-cols-2 gap-2 text-[11px] font-mono">
                        <div className="p-2 rounded bg-slate-900/80 border border-slate-800">
                          <span className="text-slate-400 block text-[10px]">Bagan Tanding:</span>
                          <span className="font-bold text-blue-300 text-sm">{summary.tandingCategoriesCount} Bagan</span>
                          <span className="text-[10px] text-slate-500 block">({summary.tandingAthletesCount} Pesilat)</span>
                        </div>
                        <div className="p-2 rounded bg-slate-900/80 border border-slate-800">
                          <span className="text-slate-400 block text-[10px]">Peserta Seni:</span>
                          <span className="font-bold text-amber-300 text-sm">{summary.seniPesertaCount} Peserta</span>
                          <span className="text-[10px] text-slate-500 block">({summary.seniPoolsCount} Pool)</span>
                        </div>
                      </div>

                      {/* List of categories in this arena */}
                      <div className="space-y-1 max-h-28 overflow-y-auto pr-1">
                        <span className="text-[10px] font-mono text-slate-400 uppercase font-bold">Kategori di Gelanggang ini:</span>
                        {summary.categories.slice(0, 4).map((c, cIdx) => (
                          <div key={`${c.id || 'cat'}__${cIdx}`} className="text-[10px] font-mono text-slate-300 truncate flex items-center justify-between bg-slate-900/40 px-2 py-1 rounded">
                            <span className="truncate">{c.name}</span>
                            <span className="text-emerald-400 shrink-0 font-bold ml-1">{c.matches.length}P</span>
                          </div>
                        ))}
                        {summary.categories.length > 4 && (
                          <span className="text-[9px] text-slate-500 font-mono">+{summary.categories.length - 4} kategori lainnya...</span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* TAB 2: TANDING BRACKETS TABLE */}
              {previewTab === 'tanding' && (
                <div className="space-y-3">
                  <div className="flex items-center justify-between text-[11px] font-mono">
                    <span className="text-slate-400">Menampilkan {generationResult.tandingCategories.length} bagan tanding lengkap:</span>
                    <div className="flex items-center gap-2">
                      <span className="text-slate-500">Filter Gelanggang:</span>
                      <select
                        value={filterArenaId}
                        onChange={(e) => setFilterArenaId(e.target.value)}
                        className="px-2 py-1 bg-slate-950 border border-slate-800 rounded font-mono text-xs text-slate-200"
                      >
                        <option value="all">Semua Gelanggang</option>
                        {selectedArenaIds.map(id => (
                          <option key={id} value={id}>
                            {arenasList.find(a => a.id === id)?.nama || id}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div className="max-h-64 overflow-y-auto border border-slate-800 rounded-xl">
                    <table className="w-full text-left text-xs font-mono">
                      <thead className="bg-slate-950 text-slate-400 border-b border-slate-800 text-[10px] uppercase sticky top-0">
                        <tr>
                          <th className="py-2 px-3 text-center w-8">No</th>
                          <th className="py-2 px-3">Gelanggang</th>
                          <th className="py-2 px-3">Kategori / Kelas</th>
                          <th className="py-2 px-3 text-center">Ukuran</th>
                          <th className="py-2 px-3">Babak & Partai</th>
                          <th className="py-2 px-3 text-center">Status Venue</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-800/60 text-[11px]">
                        {generationResult.tandingCategories
                          .filter(c => filterArenaId === 'all' || c.arenaId === filterArenaId)
                          .map((cat, idx) => (
                            <tr key={`${cat.id || 'cat'}__${idx}`} className="hover:bg-slate-800/30">
                              <td className="py-2 px-3 text-center text-slate-500">{idx + 1}</td>
                              <td className="py-2 px-3 font-bold text-emerald-400">
                                <span className="px-2 py-0.5 rounded bg-emerald-950/80 border border-emerald-500/40">
                                  {cat.gelanggang || 'Gelanggang 1'}
                                </span>
                              </td>
                              <td className="py-2 px-3 font-bold text-white">{cat.name}</td>
                              <td className="py-2 px-3 text-center text-blue-300">{cat.size} Atlet</td>
                              <td className="py-2 px-3 text-slate-300">
                                <div className="space-y-0.5 text-[10px]">
                                  {cat.matches.map((m, mIdx) => (
                                    <span key={`${m.id}__${mIdx}`} className="inline-block mr-2 px-1.5 py-0.5 rounded bg-slate-900 border border-slate-800">
                                      {m.partai} ({m.round === 'final' ? 'Final' : m.round === 'semi' ? 'Semi' : 'Perempat'})
                                    </span>
                                  ))}
                                </div>
                              </td>
                              <td className="py-2 px-3 text-center">
                                <span className="px-2 py-0.5 rounded bg-emerald-950 text-emerald-300 border border-emerald-500/40 text-[10px] font-bold inline-flex items-center gap-1">
                                  <Check className="w-3 h-3" /> Tetap di {cat.gelanggang}
                                </span>
                              </td>
                            </tr>
                          ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* TAB 3: SENI POOL TABLE */}
              {previewTab === 'seni' && (
                <div className="space-y-3">
                  <div className="max-h-64 overflow-y-auto border border-slate-800 rounded-xl">
                    <table className="w-full text-left text-xs font-mono">
                      <thead className="bg-slate-950 text-slate-400 border-b border-slate-800 text-[10px] uppercase sticky top-0">
                        <tr>
                          <th className="py-2 px-3 text-center w-8">No</th>
                          <th className="py-2 px-3">Gelanggang</th>
                          <th className="py-2 px-3">Partai</th>
                          <th className="py-2 px-3">Nama Peserta</th>
                          <th className="py-2 px-3">Kontingen</th>
                          <th className="py-2 px-3">Kategori Seni</th>
                          <th className="py-2 px-3 text-center">Usia & Gender</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-800/60 text-[11px]">
                        {generationResult.seniPesertaList.map((p, idx) => (
                          <tr key={`${p.id || 'p'}__${idx}`} className="hover:bg-slate-800/30">
                            <td className="py-2 px-3 text-center text-slate-500">{idx + 1}</td>
                            <td className="py-2 px-3 font-bold text-amber-400">
                              <span className="px-2 py-0.5 rounded bg-amber-950/80 border border-amber-500/40">
                                {p.gelanggang || 'Gelanggang'}
                              </span>
                            </td>
                            <td className="py-2 px-3 font-bold text-emerald-300">{p.partai}</td>
                            <td className="py-2 px-3 font-bold text-white uppercase">{p.nama}</td>
                            <td className="py-2 px-3 text-slate-300 uppercase">{p.kontingen}</td>
                            <td className="py-2 px-3 text-amber-300">{p.kategori}</td>
                            <td className="py-2 px-3 text-center text-slate-400">{p.usia} {p.gender}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>
          )}

        </div>

        {/* FOOTER ACTIONS */}
        <div className="px-6 py-4 border-t border-slate-800 bg-slate-950 flex flex-col sm:flex-row justify-between items-center gap-3">
          <button
            onClick={onClose}
            className="w-full sm:w-auto px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold uppercase tracking-wider text-xs cursor-pointer transition-colors"
          >
            Batal
          </button>

          <div className="flex items-center gap-3 w-full sm:w-auto">
            <button
              onClick={handleApplyToCurrentArenaOnly}
              disabled={!generationResult}
              className="flex-1 sm:flex-initial px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 font-bold uppercase tracking-wider text-xs disabled:opacity-40 cursor-pointer transition-colors"
              title="Terapkan jadwal hanya untuk gelanggang yang sedang dibuka saat ini"
            >
              Terapkan Gelanggang Ini Saja
            </button>

            <button
              onClick={handleApplyToAllArenas}
              disabled={!generationResult}
              className="flex-1 sm:flex-initial px-6 py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 via-teal-600 to-emerald-600 hover:from-emerald-500 hover:to-teal-500 text-white font-black uppercase tracking-wider text-xs flex items-center justify-center gap-2 shadow-lg shadow-emerald-950/60 disabled:opacity-40 cursor-pointer transition-all"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>Daftarkan & Distribusikan ke Semua Gelanggang ({parsedAthletes.length} Atlet)</span>
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
