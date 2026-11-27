/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { TGRState, TGRPeserta } from '../types';
import { playBeep } from '../utils/sound';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Maximize2, Minimize2, ArrowLeft, RefreshCw, Info, Check, 
  ShieldAlert, Award, Lock, Play, HelpCircle, Layers, Sliders, 
  CheckCircle2, Clock, RotateCcw, AlertTriangle, UserCheck, 
  ChevronRight, BookOpen, ChevronDown, CheckCircle, Unlock, 
  Volume2, VolumeX, Eye
} from 'lucide-react';

interface TGRJuriPanelProps {
  juriId: string; // e.g. "juri1", "juri2"
  state: TGRState;
  dispatch: (type: string, payload?: any) => Promise<any>;
  onBack: () => void;
  theme: 'dark' | 'light';
}

// Jurus Tunggal IPSI reference
const JURUS_TUNGGAL_DATA = [
  { no: 1, fase: 'KOSONG', nama: 'Jurus 1 - Tangan Kosong', gerakan: 7, desc: 'Salam, Pasang 1, Elakan, Pukulan Lurus' },
  { no: 2, fase: 'KOSONG', nama: 'Jurus 2 - Tangan Kosong', gerakan: 6, desc: 'Pasang 2, Tangkisan Luar, Tendangan Lurus' },
  { no: 3, fase: 'KOSONG', nama: 'Jurus 3 - Tangan Kosong', gerakan: 6, desc: 'Pasang 3, Tangkisan Atas, Pukulan Bandul' },
  { no: 4, fase: 'KOSONG', nama: 'Jurus 4 - Tangan Kosong', gerakan: 7, desc: 'Pasang 4, Tangkisan Bawah, Tendangan Samping' },
  { no: 5, fase: 'KOSONG', nama: 'Jurus 5 - Tangan Kosong', gerakan: 6, desc: 'Pasang 5, Sikuan, Tendangan Sabit' },
  { no: 6, fase: 'KOSONG', nama: 'Jurus 6 - Tangan Kosong', gerakan: 8, desc: 'Pasang 6, Pukulan Pedang, Kuda-kuda Depan' },
  { no: 7, fase: 'KOSONG', nama: 'Jurus 7 - Tangan Kosong', gerakan: 8, desc: 'Pasang 7, Tangkisan Silang, Sembahan Penutup Kosong' },
  { no: 8, fase: 'GOLOK', nama: 'Jurus 8 - Senjata Golok', gerakan: 7, desc: 'Hormat Senjata, Cabut Golok, Tebasan 1' },
  { no: 9, fase: 'GOLOK', nama: 'Jurus 9 - Senjata Golok', gerakan: 7, desc: 'Tebasan Mendatar, Putaran Golok, Tusukan' },
  { no: 10, fase: 'GOLOK', nama: 'Jurus 10 - Senjata Golok', gerakan: 6, desc: 'Tebasan Silang, Tangkisan Golok, Sarungkan' },
  { no: 11, fase: 'TOYA', nama: 'Jurus 11 - Senjata Toya', gerakan: 6, desc: 'Ambil Toya, Putaran Atas, Pukulan Bawah' },
  { no: 12, fase: 'TOYA', nama: 'Jurus 12 - Senjata Toya', gerakan: 6, desc: 'Tusukan Toya, Putaran Belakang Leher' },
  { no: 13, fase: 'TOYA', nama: 'Jurus 13 - Senjata Toya', gerakan: 6, desc: 'Sodokan Bawah, Putaran Bunga Toya' },
  { no: 14, fase: 'TOYA', nama: 'Jurus 14 - Senjata Toya', gerakan: 7, desc: 'Pukulan Silang Toya, Kuncian Akhir, Sembahan Toya' },
];

export default function TGRJuriPanel({ juriId: initialJuriId, state, dispatch, onBack, theme }: TGRJuriPanelProps) {
  // Current active juri ID (allows switching in case of tablet reassignment)
  const [activeJuriId, setActiveJuriId] = useState<string>(initialJuriId);
  const [showJuriSwitcher, setShowJuriSwitcher] = useState<boolean>(false);

  // Standard mode states (Tunggal & Regu)
  const [wrongMoveCount, setWrongMoveCount] = useState<number>(0);
  const [kemantapanTunggal, setKemantapanTunggal] = useState<number>(0.05); // 0.00 - 0.10 default mid
  const [isJuriFullscreen, setIsJuriFullscreen] = useState(false);
  const [hasSubmitted, setHasSubmitted] = useState(false);
  const [isCorrecting, setIsCorrecting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [showConfirmModal, setShowConfirmModal] = useState<boolean>(false);
  const [showJurusGuide, setShowJurusGuide] = useState<boolean>(false);
  const [activeJurusStep, setActiveJurusStep] = useState<number>(1);

  // Ganda & Solo Kreatif Tuning Sub-scores (0.01 - 0.30 per category)
  const [cat1Score, setCat1Score] = useState<number>(0.00); // Teknik Serang Bela / Kekayaan Gerak
  const [cat2Score, setCat2Score] = useState<number>(0.00); // Kemantapan & Harmonisasi
  const [cat3Score, setCat3Score] = useState<number>(0.00); // Penjiwaan & Penghayatan

  // Current active competitor
  const activePeserta = useMemo(() => {
    return state.pesertaList.find(p => p.id === state.activePesertaId);
  }, [state.pesertaList, state.activePesertaId]);

  // Determine whether current competitor category is Ganda or Bebas/Creative
  const isAutoGandaOrBebas = useMemo(() => {
    if (!activePeserta) return false;
    const kat = activePeserta.kategori.toLowerCase();
    return kat.includes('ganda') || kat.includes('bebas') || kat.includes('solo') || kat.includes('duo') || kat.includes('creative') || kat.includes('kreatif');
  }, [activePeserta]);

  // Scoring Mode: 'standard' (Tunggal & Regu Kebenaran) vs 'ganda_bebas' (Ganda/Tunggal Bebas/Solo Kreatif)
  const [scoringMode, setScoringMode] = useState<'standard' | 'ganda_bebas'>('standard');

  useEffect(() => {
    if (isAutoGandaOrBebas) {
      setScoringMode('ganda_bebas');
    } else {
      setScoringMode('standard');
    }
  }, [isAutoGandaOrBebas, activePeserta?.id, activePeserta?.kategori]);

  // Sync initialJuriId prop changes
  useEffect(() => {
    setActiveJuriId(initialJuriId);
  }, [initialJuriId]);

  // Synchronize score from parent state when active competitor or score changes on server
  useEffect(() => {
    if (activePeserta) {
      const existingScore = activePeserta.scores[activeJuriId];
      const existingKebenaran = activePeserta.kebenaranScores[activeJuriId];
      const isFinalized = activePeserta.finalizedJuries?.includes(activeJuriId) || false;

      // Restoring tuning scores if available
      if (activePeserta.tuningScores && activePeserta.tuningScores[activeJuriId]) {
        const t = activePeserta.tuningScores[activeJuriId];
        setCat1Score(t.cat1 || 0.00);
        setCat2Score(t.cat2 || 0.00);
        setCat3Score(t.cat3 || 0.00);
      } else if (existingScore !== undefined && isAutoGandaOrBebas) {
        // Estimate tuning total from score if base 9.00
        const rem = Math.max(0, parseFloat((existingScore - 9.00).toFixed(2)));
        setCat1Score(parseFloat((rem / 3).toFixed(2)));
        setCat2Score(parseFloat((rem / 3).toFixed(2)));
        setCat3Score(parseFloat((rem / 3).toFixed(2)));
      } else {
        setCat1Score(0.00);
        setCat2Score(0.00);
        setCat3Score(0.00);
      }

      // Base accuracy score starts at 9.90 for standard mode
      const kebVal = existingKebenaran !== undefined ? existingKebenaran : 9.90;
      const derivedWrongMoves = Math.max(0, Math.round((9.90 - kebVal) / 0.01));

      setWrongMoveCount(derivedWrongMoves);

      // Restore Kemantapan if existingScore is higher than kebenaran
      if (existingScore !== undefined && !isAutoGandaOrBebas) {
        const derivedKemantapan = parseFloat(Math.max(0, Math.min(0.10, existingScore - kebVal)).toFixed(2));
        setKemantapanTunggal(derivedKemantapan > 0 ? derivedKemantapan : 0.05);
      } else {
        setKemantapanTunggal(0.05);
      }

      setHasSubmitted(isFinalized);
    } else {
      setWrongMoveCount(0);
      setKemantapanTunggal(0.05);
      setCat1Score(0.00);
      setCat2Score(0.00);
      setCat3Score(0.00);
      setHasSubmitted(false);
    }
    setIsCorrecting(false);
    setErrorMessage(null);
    setSuccessMessage(null);
  }, [state.activePesertaId, activeJuriId, activePeserta, isAutoGandaOrBebas]);

  // Handle Juri Fullscreen
  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsJuriFullscreen(!!document.fullscreenElement);
    };
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
  }, []);

  const toggleJuriFullscreen = () => {
    playBeep('click');
    const elem = document.documentElement;
    if (!document.fullscreenElement) {
      elem.requestFullscreen().catch(err => console.warn(err));
    } else {
      document.exitFullscreen().catch(err => console.warn(err));
    }
  };

  // Dispatch score helper for standard Tunggal & Regu
  const submitStandardScoreUpdate = useCallback((newWrongMoves: number, newKemantapan: number, finalize: boolean = false) => {
    if (!activePeserta) return;
    const calculatedKebenaran = parseFloat((9.90 - newWrongMoves * 0.01).toFixed(2));
    const calculatedTotal = parseFloat((calculatedKebenaran + newKemantapan).toFixed(2));

    dispatch('TGR_SUBMIT_JURI_SCORE', {
      pesertaId: activePeserta.id,
      juriId: activeJuriId,
      score: calculatedTotal,
      kebenaranScore: calculatedKebenaran,
      finalize
    }).catch(err => {
      console.error("Error submitting TGR score:", err);
      setErrorMessage("Koneksi server terputus.");
    });
  }, [activePeserta, activeJuriId, dispatch]);

  // Dispatch score helper for Ganda / Jurus Bebas / Solo Kreatif
  const submitGandaBebasScoreUpdate = useCallback((c1: number, c2: number, c3: number, finalize: boolean = false) => {
    if (!activePeserta) return;
    const totalTuning = parseFloat((c1 + c2 + c3).toFixed(2));
    const calculatedTotal = parseFloat((9.00 + totalTuning).toFixed(2));

    dispatch('TGR_SUBMIT_JURI_SCORE', {
      pesertaId: activePeserta.id,
      juriId: activeJuriId,
      score: calculatedTotal,
      kebenaranScore: calculatedTotal,
      tuningScores: { cat1: c1, cat2: c2, cat3: c3 },
      finalize
    }).catch(err => {
      console.error("Error submitting TGR Ganda/Bebas score:", err);
      setErrorMessage("Koneksi server terputus.");
    });
  }, [activePeserta, activeJuriId, dispatch]);

  // Standard Wrong Move Handlers
  const handleWrongMoveClick = () => {
    if (hasSubmitted && !isCorrecting) return;
    playBeep('warning');
    const nextCount = wrongMoveCount + 1;
    setWrongMoveCount(nextCount);
    submitStandardScoreUpdate(nextCount, kemantapanTunggal, false);
  };

  const handleBackspaceClick = () => {
    if (hasSubmitted && !isCorrecting) return;
    if (wrongMoveCount === 0) {
      playBeep('click');
      return;
    }
    playBeep('click');
    const nextCount = wrongMoveCount - 1;
    setWrongMoveCount(nextCount);
    submitStandardScoreUpdate(nextCount, kemantapanTunggal, false);
  };

  const handleResetWrongMoves = () => {
    if (hasSubmitted && !isCorrecting) return;
    playBeep('click');
    setWrongMoveCount(0);
    submitStandardScoreUpdate(0, kemantapanTunggal, false);
  };

  const handleKemantapanChange = (val: number) => {
    if (hasSubmitted && !isCorrecting) return;
    playBeep('click');
    const clamped = Math.max(0.00, Math.min(0.10, parseFloat(val.toFixed(2))));
    setKemantapanTunggal(clamped);
    submitStandardScoreUpdate(wrongMoveCount, clamped, false);
  };

  // Tuning button click handler for Ganda & Jurus Bebas
  const handleTuningSelect = (catIndex: 1 | 2 | 3, value: number) => {
    if (hasSubmitted && !isCorrecting) return;
    playBeep('click');

    let newC1 = cat1Score;
    let newC2 = cat2Score;
    let newC3 = cat3Score;

    if (catIndex === 1) {
      newC1 = cat1Score === value ? 0.00 : value;
      setCat1Score(newC1);
    } else if (catIndex === 2) {
      newC2 = cat2Score === value ? 0.00 : value;
      setCat2Score(newC2);
    } else if (catIndex === 3) {
      newC3 = cat3Score === value ? 0.00 : value;
      setCat3Score(newC3);
    }

    submitGandaBebasScoreUpdate(newC1, newC2, newC3, false);
  };

  // Quick increment/decrement tuning helper
  const handleStepTuning = (catIndex: 1 | 2 | 3, delta: number) => {
    if (hasSubmitted && !isCorrecting) return;
    playBeep('click');

    let current = catIndex === 1 ? cat1Score : catIndex === 2 ? cat2Score : cat3Score;
    let next = Math.max(0.00, Math.min(0.30, parseFloat((current + delta).toFixed(2))));

    if (catIndex === 1) {
      setCat1Score(next);
      submitGandaBebasScoreUpdate(next, cat2Score, cat3Score, false);
    } else if (catIndex === 2) {
      setCat2Score(next);
      submitGandaBebasScoreUpdate(cat1Score, next, cat3Score, false);
    } else if (catIndex === 3) {
      setCat3Score(next);
      submitGandaBebasScoreUpdate(cat1Score, cat2Score, next, false);
    }
  };

  // Reset Ganda / Jurus Bebas tuning values
  const handleResetTuning = () => {
    if (hasSubmitted && !isCorrecting) return;
    playBeep('click');
    setCat1Score(0.00);
    setCat2Score(0.00);
    setCat3Score(0.00);
    submitGandaBebasScoreUpdate(0.00, 0.00, 0.00, false);
  };

  // Submit final score
  const executeSubmitScore = async () => {
    if (!activePeserta) return;
    setShowConfirmModal(false);
    playBeep('valid');
    setErrorMessage(null);
    setSuccessMessage(null);

    let calculatedTotal = 0;
    if (scoringMode === 'standard') {
      const calculatedKebenaran = parseFloat((9.90 - wrongMoveCount * 0.01).toFixed(2));
      calculatedTotal = parseFloat((calculatedKebenaran + kemantapanTunggal).toFixed(2));
    } else {
      const totalTuning = parseFloat((cat1Score + cat2Score + cat3Score).toFixed(2));
      calculatedTotal = parseFloat((9.00 + totalTuning).toFixed(2));
    }

    try {
      if (isCorrecting) {
        // Submit correction request to Ketua
        await dispatch('TGR_SUBMIT_JURI_CORRECTION', {
          juriId: activeJuriId,
          pesertaId: activePeserta.id,
          original: activePeserta.scores[activeJuriId] || (scoringMode === 'standard' ? 9.90 : 9.00),
          requested: calculatedTotal
        });
        await dispatch('TGR_ADD_AUDIT_LOG', {
          user: `Juri ${activeJuriId.replace('juri', '')}`,
          action: `Mengajukan koreksi nilai TGR (${scoringMode}) untuk ${activePeserta.nama} menjadi ${calculatedTotal.toFixed(2)}`
        });
        setSuccessMessage('Koreksi diajukan! Menunggu persetujuan Ketua Pertandingan.');
        setIsCorrecting(false);
      } else {
        // Standard final submit
        if (scoringMode === 'standard') {
          submitStandardScoreUpdate(wrongMoveCount, kemantapanTunggal, true);
        } else {
          submitGandaBebasScoreUpdate(cat1Score, cat2Score, cat3Score, true);
        }

        await dispatch('TGR_ADD_AUDIT_LOG', {
          user: `Juri ${activeJuriId.replace('juri', '')}`,
          action: `Mengirimkan hasil nilai final TGR (${scoringMode}) ${calculatedTotal.toFixed(2)} untuk ${activePeserta.nama}`
        });
        setSuccessMessage('Nilai resmi berhasil dikirim & dikunci!');
        setHasSubmitted(true);
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'Gagal mengirim nilai ke server.');
    }
  };

  const handleRequestCorrectionMode = () => {
    playBeep('click');
    setIsCorrecting(true);
  };

  // Pre-calculated values for UI display
  const calculatedKebenaran = parseFloat((9.90 - wrongMoveCount * 0.01).toFixed(2));
  const calculatedTunggalTotal = parseFloat((calculatedKebenaran + kemantapanTunggal).toFixed(2));
  const totalTuning = parseFloat((cat1Score + cat2Score + cat3Score).toFixed(2));
  const calculatedGandaTotal = parseFloat((9.00 + totalTuning).toFixed(2));

  const currentDisplayScore = scoringMode === 'standard' ? calculatedTunggalTotal : calculatedGandaTotal;
  const juriNumberStr = activeJuriId.replace('juri', '');

  // 30 Tuning button values (0.01 to 0.30)
  const tuningValues = useMemo(() => {
    const vals: number[] = [];
    for (let i = 1; i <= 30; i++) {
      vals.push(parseFloat((i * 0.01).toFixed(2)));
    }
    return vals;
  }, []);

  // Format MM:SS for match timer
  const formatTimer = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  };

  // Timer status styling
  const timerSecs = state.timerSeconds ?? 180;
  const isOvertime = timerSecs > 180;
  const isNearEnd = timerSecs >= 170 && timerSecs <= 180;

  return (
    <div className={`min-h-screen h-full w-full flex flex-col bg-[#030714] text-slate-100 font-sans select-none overflow-x-hidden ${
      isJuriFullscreen ? 'fixed inset-0 z-[99999]' : 'relative'
    }`}>
      {/* Background glow effects */}
      <div className="absolute top-0 left-1/4 w-[30rem] h-[30rem] rounded-full blur-[140px] pointer-events-none bg-blue-950/20" />
      <div className="absolute bottom-0 right-1/4 w-[30rem] h-[30rem] rounded-full blur-[140px] pointer-events-none bg-indigo-950/15" />

      {/* ========================================================
          A. HEADER BAR WITH ARENA, TIMER & JURI SELECTOR
      ======================================================== */}
      <header className="z-20 bg-slate-950/95 border-b border-slate-800/80 px-3 py-2 sm:px-4 sm:py-2.5 flex items-center justify-between shadow-xl shrink-0 gap-2">
        {/* Left Section: Competitor Metadata */}
        <div className="flex items-center gap-2 sm:gap-3">
          <button
            onClick={onBack}
            className="p-1.5 cursor-pointer rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-400 hover:text-white transition-colors flex items-center justify-center shadow-sm"
            title="Kembali ke Pemilihan Peran"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          
          <div className="flex flex-col">
            <div className="flex items-center gap-1.5 flex-wrap">
              <span className="text-[9px] sm:text-[10px] font-bold tracking-widest text-slate-400 font-mono uppercase truncate max-w-[140px] sm:max-w-none">
                {activePeserta ? activePeserta.kontingen.toUpperCase() : 'BELUM ADA PESILAT AKTIF'}
              </span>
              {activePeserta && (
                <span className="px-1.5 py-0.2 rounded bg-slate-800 text-[8.5px] font-mono text-cyan-400 font-bold">
                  UNDIAN #{activePeserta.noUndian || activePeserta.noUrut || 1}
                </span>
              )}
            </div>
            <h1 className="text-xs sm:text-sm font-black tracking-wider text-sky-400 font-sport uppercase leading-tight mt-0.5 truncate max-w-[180px] sm:max-w-[300px]">
              {activePeserta ? activePeserta.nama.toUpperCase() : 'MENUNGGU KETUA PERTANDINGAN'}
            </h1>
          </div>
        </div>

        {/* Center Section: Live Stopwatch & Category Mode Switcher */}
        <div className="flex items-center gap-2 sm:gap-3">
          {/* Live Arena Performance Timer */}
          <div className={`flex items-center gap-1.5 px-3 py-1 rounded-xl border font-mono shadow-inner ${
            isOvertime
              ? 'bg-red-950/80 border-red-500/80 text-rose-300 animate-pulse'
              : isNearEnd
              ? 'bg-amber-950/80 border-amber-500/80 text-amber-300'
              : state.timerActive
              ? 'bg-emerald-950/60 border-emerald-500/60 text-emerald-300'
              : 'bg-slate-900 border-slate-800 text-slate-300'
          }`}>
            <Clock className={`w-3.5 h-3.5 ${state.timerActive ? 'animate-spin text-emerald-400' : 'text-slate-400'}`} />
            <div className="flex flex-col items-center">
              <span className="text-xs sm:text-sm font-black tracking-wider leading-none">
                {formatTimer(timerSecs)}
              </span>
              <span className="text-[7.5px] font-bold uppercase tracking-wider text-slate-400 mt-0.5">
                {state.timerActive ? 'WAKTU TAMPIL' : 'STANDBY'}
              </span>
            </div>
          </div>

          {/* Mode Switcher Button */}
          <button
            onClick={() => {
              playBeep('click');
              setScoringMode(prev => prev === 'standard' ? 'ganda_bebas' : 'standard');
            }}
            className="hidden md:flex items-center gap-1.5 px-3 py-1.5 bg-slate-900 hover:bg-slate-800 border border-amber-500/40 text-amber-300 rounded-xl text-[10px] font-extrabold uppercase tracking-wider cursor-pointer transition-all shadow-sm"
            title="Klik untuk ganti mode penilaian (Tunggal/Regu vs Ganda/Bebas)"
          >
            <Sliders className="w-3.5 h-3.5 text-amber-400" />
            <span>MODE: {scoringMode === 'ganda_bebas' ? 'GANDA / BEBAS' : 'TUNGGAL / REGU'}</span>
          </button>
        </div>

        {/* Right Section: Gelanggang Info & Juri Designation */}
        <div className="flex items-center gap-2 sm:gap-3 text-right">
          <div className="hidden sm:flex flex-col">
            <span className="text-[9px] sm:text-[10px] font-mono font-semibold text-slate-400 uppercase">
              {state.gelanggang.toUpperCase()} • PARTAI {state.partai?.replace(/\D/g, '') || '1'}
            </span>
            <span className="text-[10px] sm:text-xs font-black font-sport text-amber-400 tracking-wider uppercase mt-0.5">
              {activePeserta ? activePeserta.kategori.toUpperCase() : 'SENI IPSI'}
            </span>
          </div>

          <div className="flex items-center gap-1.5 sm:gap-2">
            {/* Juri Designation Label with Quick Switch Popover */}
            <div className="relative">
              <button
                onClick={() => {
                  playBeep('click');
                  setShowJuriSwitcher(prev => !prev);
                }}
                className="px-2.5 sm:px-3 py-1 rounded-xl bg-gradient-to-r from-blue-900 to-indigo-900 hover:from-blue-800 hover:to-indigo-800 border border-blue-500/60 text-white font-black font-sport text-xs sm:text-sm flex items-center gap-1 cursor-pointer transition-all shadow-md shadow-blue-950/40"
                title="Klik untuk ganti ID Juri"
              >
                <span>JURI {juriNumberStr}</span>
                <ChevronDown className="w-3.5 h-3.5 text-blue-300" />
              </button>

              {/* Juri Switcher Dropdown */}
              <AnimatePresence>
                {showJuriSwitcher && (
                  <motion.div
                    initial={{ opacity: 0, y: 8, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 8, scale: 0.95 }}
                    className="absolute right-0 top-full mt-2 w-48 bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl p-2 z-50 text-left"
                  >
                    <span className="text-[9px] font-mono font-bold text-slate-400 uppercase block px-2 py-1">
                      PILIH KURSI JURI:
                    </span>
                    <div className="grid grid-cols-2 gap-1.5 mt-1">
                      {Array.from({ length: state.jumlahJuri || 6 }, (_, idx) => idx + 1).map((n) => {
                        const targetId = `juri${n}`;
                        const isCurrent = activeJuriId === targetId;
                        return (
                          <button
                            key={targetId}
                            onClick={() => {
                              playBeep('click');
                              setActiveJuriId(targetId);
                              setShowJuriSwitcher(false);
                            }}
                            className={`py-1.5 px-2 rounded-lg text-xs font-black font-sport uppercase tracking-wider text-center cursor-pointer transition-colors ${
                              isCurrent
                                ? 'bg-blue-600 text-white shadow-md'
                                : 'bg-slate-800 hover:bg-slate-700 text-slate-300'
                            }`}
                          >
                            JURI {n}
                          </button>
                        );
                      })}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            <button
              onClick={toggleJuriFullscreen}
              className="p-1.5 cursor-pointer rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-400 hover:text-white transition-all"
              title="Toggle Fullscreen Layar Juri"
            >
              {isJuriFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
            </button>
          </div>
        </div>
      </header>

      {/* ========================================================
          B. STATUS BANNER / STANDBY STATE
      ======================================================== */}
      {!activePeserta ? (
        <div className="flex-1 flex flex-col items-center justify-center p-6 text-center z-10">
          <div className="w-20 h-20 rounded-3xl bg-slate-900 border-2 border-slate-800 flex items-center justify-center text-amber-400 mb-4 shadow-xl">
            <Info className="w-10 h-10 animate-pulse" />
          </div>
          <h2 className="text-xl sm:text-2xl font-black font-sport text-white tracking-wide uppercase">
            MENUNGGU PESILAT DARI KETUA PERTANDINGAN
          </h2>
          <p className="text-xs sm:text-sm text-slate-400 max-w-md mt-2 font-mono">
            Ketua Pertandingan atau Sekretaris belum memilih atlet yang sedang tampil di {state.gelanggang}. Panel juri akan otomatis aktif saat atlet dipanggil ke gelanggang.
          </p>

          <div className="mt-6 flex items-center gap-3">
            <div className="px-4 py-2 rounded-xl bg-slate-900 border border-slate-800 text-xs font-mono text-cyan-400 font-bold">
              Status Perangkat: SIAGA SEBAGAI JURI {juriNumberStr}
            </div>
            <button
              onClick={() => window.location.reload()}
              className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-black text-xs uppercase font-sport tracking-wider flex items-center gap-2 cursor-pointer transition-all shadow-md"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>Refresh Status</span>
            </button>
          </div>
        </div>
      ) : (
        /* ========================================================
            C. MAIN INTERACTIVE SCORING CONTENT
        ======================================================== */
        <main className="flex-1 flex flex-col justify-between p-2 sm:p-3 z-10 gap-2 sm:gap-3 overflow-y-auto min-h-0">
          
          {/* ========================================================
              MODE 1: GANDA / JURUS BEBAS / SOLO KREATIF (TUNING MATRIX)
          ======================================================== */}
          {scoringMode === 'ganda_bebas' ? (
            <div className="flex-1 flex flex-col justify-between gap-2 overflow-y-auto min-h-0">
              
              {/* Outer Container */}
              <div className="border border-slate-800/90 rounded-2xl bg-slate-950/70 shadow-2xl flex-1 flex flex-col overflow-hidden">
                
                {/* Table Header Row */}
                <div className="bg-slate-900/90 border-b border-slate-800 px-3 py-2 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Sliders className="w-4 h-4 text-amber-400" />
                    <span className="text-xs font-black font-sport uppercase tracking-wider text-slate-200">
                      PENILAIAN TUNING KATEGORI {activePeserta.kategori.toUpperCase()} (BASE SCORE: 9.00)
                    </span>
                  </div>
                  <span className="text-[10px] font-mono text-slate-400 font-bold">
                    RENTANG NILAI: 0.01 - 0.30 PER KRITERIA
                  </span>
                </div>

                {/* 3 Categories Form */}
                <div className="flex-1 p-3 space-y-3 overflow-y-auto divide-y divide-slate-800/60">
                  
                  {/* Category 1: Teknik Serang Bela / Kekayaan Teknik */}
                  <div className="pt-2 first:pt-0 space-y-2">
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="text-xs sm:text-sm font-black uppercase tracking-wider text-sky-400 font-sport">
                          1. {activePeserta.kategori.toLowerCase().includes('ganda') ? 'TEKNIK SERANG BELA' : 'KEKAYAAN TEKNIK GERAK & SENJATA'}
                        </h3>
                        <span className="text-[9px] font-mono text-slate-400 font-semibold">
                          Efektivitas gerak, keberanian teknik, keragaman serangan dan tangkisan (0.01 - 0.30)
                        </span>
                      </div>
                      
                      {/* Sub-score Display & Stepper */}
                      <div className="flex items-center gap-2">
                        <button
                          disabled={hasSubmitted && !isCorrecting}
                          onClick={() => handleStepTuning(1, -0.01)}
                          className="w-7 h-7 rounded-lg bg-slate-900 hover:bg-slate-800 border border-slate-800 text-sky-300 font-black font-mono text-xs cursor-pointer flex items-center justify-center disabled:opacity-40"
                        >
                          -
                        </button>
                        <span className="px-3 py-1 rounded-xl bg-sky-950/80 border border-sky-500/50 text-sky-300 font-black font-sport text-base sm:text-lg min-w-[3.5rem] text-center shadow-inner">
                          {cat1Score.toFixed(2)}
                        </span>
                        <button
                          disabled={hasSubmitted && !isCorrecting}
                          onClick={() => handleStepTuning(1, 0.01)}
                          className="w-7 h-7 rounded-lg bg-slate-900 hover:bg-slate-800 border border-slate-800 text-sky-300 font-black font-mono text-xs cursor-pointer flex items-center justify-center disabled:opacity-40"
                        >
                          +
                        </button>
                      </div>
                    </div>

                    {/* Quick Button Matrix */}
                    <div className="grid grid-cols-5 sm:grid-cols-10 gap-1 sm:gap-1.5">
                      {tuningValues.map((val) => {
                        const isActive = cat1Score === val;
                        return (
                          <button
                            key={`cat1-${val}`}
                            disabled={hasSubmitted && !isCorrecting}
                            onClick={() => handleTuningSelect(1, val)}
                            className={`py-1.5 px-0.5 sm:px-1 text-[9px] sm:text-[10px] md:text-[11px] font-mono font-black rounded-lg border transition-all cursor-pointer text-center leading-none ${
                              isActive
                                ? 'bg-sky-500 border-sky-400 text-slate-950 shadow-[0_0_12px_rgba(56,189,248,0.6)] scale-105 z-10'
                                : 'bg-slate-900/80 border-slate-800/90 text-slate-300 hover:bg-slate-800 hover:border-slate-700'
                            } ${hasSubmitted && !isCorrecting ? 'opacity-50 cursor-not-allowed' : ''}`}
                          >
                            {val.toFixed(2)}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Category 2: Kemantapan & Harmonisasi */}
                  <div className="pt-3 space-y-2">
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="text-xs sm:text-sm font-black uppercase tracking-wider text-amber-400 font-sport">
                          2. KEMANTAPAN & HARMONISASI GERAK
                        </h3>
                        <span className="text-[9px] font-mono text-slate-400 font-semibold">
                          Ketepatan ritme, kekompakan pasangan/atlet, stamina, dan kelancaran alur gerak (0.01 - 0.30)
                        </span>
                      </div>
                      
                      <div className="flex items-center gap-2">
                        <button
                          disabled={hasSubmitted && !isCorrecting}
                          onClick={() => handleStepTuning(2, -0.01)}
                          className="w-7 h-7 rounded-lg bg-slate-900 hover:bg-slate-800 border border-slate-800 text-amber-300 font-black font-mono text-xs cursor-pointer flex items-center justify-center disabled:opacity-40"
                        >
                          -
                        </button>
                        <span className="px-3 py-1 rounded-xl bg-amber-950/80 border border-amber-500/50 text-amber-300 font-black font-sport text-base sm:text-lg min-w-[3.5rem] text-center shadow-inner">
                          {cat2Score.toFixed(2)}
                        </span>
                        <button
                          disabled={hasSubmitted && !isCorrecting}
                          onClick={() => handleStepTuning(2, 0.01)}
                          className="w-7 h-7 rounded-lg bg-slate-900 hover:bg-slate-800 border border-slate-800 text-amber-300 font-black font-mono text-xs cursor-pointer flex items-center justify-center disabled:opacity-40"
                        >
                          +
                        </button>
                      </div>
                    </div>

                    <div className="grid grid-cols-5 sm:grid-cols-10 gap-1 sm:gap-1.5">
                      {tuningValues.map((val) => {
                        const isActive = cat2Score === val;
                        return (
                          <button
                            key={`cat2-${val}`}
                            disabled={hasSubmitted && !isCorrecting}
                            onClick={() => handleTuningSelect(2, val)}
                            className={`py-1.5 px-0.5 sm:px-1 text-[9px] sm:text-[10px] md:text-[11px] font-mono font-black rounded-lg border transition-all cursor-pointer text-center leading-none ${
                              isActive
                                ? 'bg-amber-500 border-amber-400 text-slate-950 shadow-[0_0_12px_rgba(245,158,11,0.6)] scale-105 z-10'
                                : 'bg-slate-900/80 border-slate-800/90 text-slate-300 hover:bg-slate-800 hover:border-slate-700'
                            } ${hasSubmitted && !isCorrecting ? 'opacity-50 cursor-not-allowed' : ''}`}
                          >
                            {val.toFixed(2)}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Category 3: Penjiwaan & Penghayatan */}
                  <div className="pt-3 space-y-2">
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="text-xs sm:text-sm font-black uppercase tracking-wider text-purple-400 font-sport">
                          3. PENJIWAAN, PENGHAYATAN & KREATIFITAS
                        </h3>
                        <span className="text-[9px] font-mono text-slate-400 font-semibold">
                          Ekspresi wajah, penghayatan karakter pendekar, estetika dan daya pikat (0.01 - 0.30)
                        </span>
                      </div>
                      
                      <div className="flex items-center gap-2">
                        <button
                          disabled={hasSubmitted && !isCorrecting}
                          onClick={() => handleStepTuning(3, -0.01)}
                          className="w-7 h-7 rounded-lg bg-slate-900 hover:bg-slate-800 border border-slate-800 text-purple-300 font-black font-mono text-xs cursor-pointer flex items-center justify-center disabled:opacity-40"
                        >
                          -
                        </button>
                        <span className="px-3 py-1 rounded-xl bg-purple-950/80 border border-purple-500/50 text-purple-300 font-black font-sport text-base sm:text-lg min-w-[3.5rem] text-center shadow-inner">
                          {cat3Score.toFixed(2)}
                        </span>
                        <button
                          disabled={hasSubmitted && !isCorrecting}
                          onClick={() => handleStepTuning(3, 0.01)}
                          className="w-7 h-7 rounded-lg bg-slate-900 hover:bg-slate-800 border border-slate-800 text-purple-300 font-black font-mono text-xs cursor-pointer flex items-center justify-center disabled:opacity-40"
                        >
                          +
                        </button>
                      </div>
                    </div>

                    <div className="grid grid-cols-5 sm:grid-cols-10 gap-1 sm:gap-1.5">
                      {tuningValues.map((val) => {
                        const isActive = cat3Score === val;
                        return (
                          <button
                            key={`cat3-${val}`}
                            disabled={hasSubmitted && !isCorrecting}
                            onClick={() => handleTuningSelect(3, val)}
                            className={`py-1.5 px-0.5 sm:px-1 text-[9px] sm:text-[10px] md:text-[11px] font-mono font-black rounded-lg border transition-all cursor-pointer text-center leading-none ${
                              isActive
                                ? 'bg-purple-500 border-purple-400 text-slate-950 shadow-[0_0_12px_rgba(168,85,247,0.6)] scale-105 z-10'
                                : 'bg-slate-900/80 border-slate-800/90 text-slate-300 hover:bg-slate-800 hover:border-slate-700'
                            } ${hasSubmitted && !isCorrecting ? 'opacity-50 cursor-not-allowed' : ''}`}
                          >
                            {val.toFixed(2)}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                </div>

                {/* Table Footer Summary & Submit Bar */}
                <div className="bg-slate-900 border-t border-slate-800 p-3 flex flex-wrap items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className="flex flex-col">
                      <span className="text-[9px] font-mono font-bold text-slate-400 uppercase">
                        TOTAL TUNING (0.00 - 0.90)
                      </span>
                      <span className="text-lg font-black font-sport text-cyan-400 leading-none">
                        +{totalTuning.toFixed(2)}
                      </span>
                    </div>

                    <div className="h-7 w-px bg-slate-800" />

                    <div className="flex flex-col">
                      <span className="text-[9px] font-mono font-bold text-slate-400 uppercase">
                        NILAI AKHIR JURI {juriNumberStr} (BASE 9.00 + TUNING)
                      </span>
                      <span className="text-2xl font-black font-sport text-amber-400 leading-none">
                        {calculatedGandaTotal.toFixed(2)}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      disabled={hasSubmitted && !isCorrecting}
                      onClick={handleResetTuning}
                      className="px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-black font-sport uppercase tracking-wider cursor-pointer disabled:opacity-40"
                    >
                      RESET
                    </button>

                    <button
                      onClick={hasSubmitted && !isCorrecting ? handleRequestCorrectionMode : () => setShowConfirmModal(true)}
                      className={`px-5 py-2.5 rounded-xl border text-xs font-black font-sport tracking-wider uppercase transition-all cursor-pointer shadow-lg flex items-center gap-2 ${
                        hasSubmitted && !isCorrecting
                          ? 'bg-rose-950/60 border-rose-500/40 text-rose-300 hover:bg-rose-900/80'
                          : 'bg-gradient-to-r from-blue-600 via-indigo-600 to-blue-700 hover:from-blue-500 hover:to-indigo-500 border-blue-400 text-white active:scale-95'
                      }`}
                    >
                      {hasSubmitted && !isCorrecting ? (
                        <>
                          <Lock className="w-4 h-4 text-rose-400" />
                          <span>AJUKAN KOREKSI NILAI</span>
                        </>
                      ) : (
                        <>
                          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                          <span>KIRIM & KUNCI NILAI ({calculatedGandaTotal.toFixed(2)})</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>

              </div>

            </div>
          ) : (
            /* ========================================================
                MODE 2: STANDARD TUNGGAL & REGU (KEBENARAN & KEMANTAPAN)
            ======================================================== */
            <div className="flex-1 flex flex-col justify-between gap-3 overflow-y-auto">
              
              {/* Category Info & Jurus Guide Toggle */}
              <div className="bg-slate-900/80 border border-slate-800 px-3 py-2 rounded-2xl flex items-center justify-between gap-2 shadow-inner">
                <div className="flex items-center gap-2">
                  <Award className="w-4 h-4 text-amber-400" />
                  <span className="text-xs font-black font-sport uppercase tracking-wider text-slate-200">
                    PENILAIAN {activePeserta.kategori.toUpperCase()} • KEBENARAN GERAK (DASAR: 9.90) & KEMANTAPAN (0.00 - 0.10)
                  </span>
                </div>

                <button
                  onClick={() => {
                    playBeep('click');
                    setShowJurusGuide(prev => !prev);
                  }}
                  className="px-2.5 py-1 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-cyan-300 text-[10px] font-black uppercase font-sport tracking-wider flex items-center gap-1.5 cursor-pointer transition-colors"
                >
                  <BookOpen className="w-3.5 h-3.5" />
                  <span>{showJurusGuide ? 'TUTUP PANDUAN' : 'PANDUAN 14 JURUS'}</span>
                </button>
              </div>

              {/* Jurus 14 Reference Box (Toggleable) */}
              <AnimatePresence>
                {showJurusGuide && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    className="overflow-hidden bg-slate-950/90 border border-cyan-500/30 rounded-2xl p-3 shadow-xl space-y-2"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-mono font-bold text-cyan-400 uppercase">
                        STANDAR JURUS TUNGGAL BAKU IPSI (14 JURUS / 100 GERAKAN):
                      </span>
                      <span className="text-[9px] font-mono text-slate-400">
                        Klik nomor jurus untuk menandai posisi saat ini
                      </span>
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-7 gap-1.5">
                      {JURUS_TUNGGAL_DATA.map((j) => {
                        const isCurrent = activeJurusStep === j.no;
                        return (
                          <div
                            key={j.no}
                            onClick={() => {
                              playBeep('click');
                              setActiveJurusStep(j.no);
                            }}
                            className={`p-2 rounded-xl border text-left cursor-pointer transition-all ${
                              isCurrent
                                ? 'bg-cyan-950 border-cyan-400 shadow-md shadow-cyan-950/50 scale-[1.02]'
                                : j.fase === 'KOSONG'
                                ? 'bg-slate-900/80 border-slate-800 hover:border-slate-700'
                                : j.fase === 'GOLOK'
                                ? 'bg-amber-950/30 border-amber-800/40 hover:border-amber-700'
                                : 'bg-purple-950/30 border-purple-800/40 hover:border-purple-700'
                            }`}
                          >
                            <div className="flex justify-between items-center text-[9px] font-mono font-bold">
                              <span className={isCurrent ? 'text-cyan-300' : 'text-slate-400'}>JURUS {j.no}</span>
                              <span className="text-[8px] px-1 rounded bg-black/40 text-slate-400">{j.gerakan} GRK</span>
                            </div>
                            <span className="text-[9.5px] font-black uppercase font-sport text-white block mt-0.5 truncate">
                              {j.nama.replace(/Jurus \d+ - /, '')}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Main Interactive Grid (Wrong Move Button & Action Buttons) */}
              <div className="grid grid-cols-1 md:grid-cols-12 gap-3 flex-1 items-stretch">
                
                {/* Left Section: GIANT WRONG MOVE BUTTON */}
                <button
                  disabled={hasSubmitted && !isCorrecting}
                  onClick={handleWrongMoveClick}
                  className={`md:col-span-7 rounded-3xl border-2 transition-all duration-200 flex flex-col justify-between p-5 sm:p-7 cursor-pointer relative overflow-hidden group shadow-2xl active:scale-[0.98] ${
                    hasSubmitted && !isCorrecting
                      ? 'bg-slate-950/60 border-slate-900 opacity-60 pointer-events-none'
                      : 'bg-gradient-to-b from-red-950/80 via-slate-950/95 to-red-950/90 border-red-600/70 hover:border-red-400 hover:shadow-[0_0_35px_rgba(239,68,68,0.3)]'
                  }`}
                >
                  <div className="w-full flex items-center justify-between text-xs font-mono font-bold text-red-400 uppercase">
                    <span className="px-2.5 py-0.5 rounded-full bg-red-950/80 border border-red-500/40">
                      SALAH GERAK / URUTAN (-0.01)
                    </span>
                    <span className="text-[10px] text-slate-400">
                      KLIK UNTUK TAMBAH
                    </span>
                  </div>

                  <div className="w-full text-center my-3">
                    <span className="block text-6xl sm:text-8xl font-black font-sport text-red-500 tracking-wider drop-shadow-[0_4px_20px_rgba(239,68,68,0.4)]">
                      {wrongMoveCount}
                    </span>
                    <span className="text-xl sm:text-3xl font-black font-sport tracking-widest text-white group-hover:text-red-300 transition-colors uppercase block mt-1">
                      WRONG MOVE
                    </span>
                  </div>

                  <div className="w-full flex items-center justify-between pt-2 border-t border-red-900/40 text-[10px] font-mono text-slate-300 font-semibold">
                    <span>NILAI KEBENARAN:</span>
                    <span className="text-base font-black text-cyan-400 font-sport">
                      {calculatedKebenaran.toFixed(2)}
                    </span>
                  </div>
                </button>

                {/* Right Section: KEMANTAPAN SLIDER & SUMMARY */}
                <div className="md:col-span-5 bg-slate-950/80 border border-slate-800 rounded-3xl p-4 sm:p-5 flex flex-col justify-between gap-3 shadow-xl">
                  
                  {/* Wrong Move Control Toolbar */}
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      disabled={hasSubmitted && !isCorrecting || wrongMoveCount === 0}
                      onClick={handleBackspaceClick}
                      className="py-2.5 px-3 rounded-xl bg-amber-950/30 hover:bg-amber-900/50 border border-amber-600/60 text-amber-300 font-black text-xs font-sport tracking-wider uppercase flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-40 transition-colors"
                      title="Batalkan 1 salah gerak terakhir"
                    >
                      <RotateCcw className="w-3.5 h-3.5" />
                      <span>UNDO (-1)</span>
                    </button>

                    <button
                      disabled={hasSubmitted && !isCorrecting || wrongMoveCount === 0}
                      onClick={handleResetWrongMoves}
                      className="py-2.5 px-3 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-700 text-slate-400 hover:text-white font-black text-xs font-sport tracking-wider uppercase flex items-center justify-center gap-1 cursor-pointer disabled:opacity-40 transition-colors"
                    >
                      <span>RESET (0)</span>
                    </button>
                  </div>

                  {/* Kemantapan Sub-score Evaluator (0.00 - 0.10) */}
                  <div className="p-3 bg-slate-900/90 border border-slate-800 rounded-2xl space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-black font-sport uppercase tracking-wider text-amber-400">
                        NILAI KEMANTAPAN (0.00 - 0.10):
                      </span>
                      <span className="text-base font-black font-sport text-amber-300">
                        +{kemantapanTunggal.toFixed(2)}
                      </span>
                    </div>

                    <div className="grid grid-cols-5 gap-1">
                      {[0.00, 0.02, 0.04, 0.06, 0.08, 0.10].map((val) => {
                        const isSel = Math.abs(kemantapanTunggal - val) < 0.005;
                        return (
                          <button
                            key={val}
                            disabled={hasSubmitted && !isCorrecting}
                            onClick={() => handleKemantapanChange(val)}
                            className={`py-1 text-[10px] font-mono font-black rounded-lg border transition-all cursor-pointer ${
                              isSel
                                ? 'bg-amber-500 border-amber-400 text-slate-950 shadow-md font-extrabold'
                                : 'bg-slate-900 border-slate-800 text-slate-300 hover:bg-slate-800'
                            } disabled:opacity-40`}
                          >
                            {val.toFixed(2)}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Total Display */}
                  <div className="p-3 bg-gradient-to-r from-blue-950/60 to-indigo-950/60 border border-blue-500/40 rounded-2xl flex items-center justify-between shadow-inner">
                    <div className="flex flex-col">
                      <span className="text-[9px] font-mono font-bold text-slate-400 uppercase">
                        TOTAL NILAI JURI {juriNumberStr}
                      </span>
                      <span className="text-[10px] text-cyan-300 font-mono">
                        Kebenaran ({calculatedKebenaran.toFixed(2)}) + Mantap ({kemantapanTunggal.toFixed(2)})
                      </span>
                    </div>
                    <span className="text-3xl font-black font-sport text-amber-400 tracking-wide">
                      {calculatedTunggalTotal.toFixed(2)}
                    </span>
                  </div>

                  {/* Ready / Submit Button */}
                  <button
                    onClick={hasSubmitted && !isCorrecting ? handleRequestCorrectionMode : () => setShowConfirmModal(true)}
                    className={`w-full py-3 px-4 rounded-2xl border text-xs sm:text-sm font-black font-sport tracking-wider uppercase transition-all cursor-pointer shadow-xl flex items-center justify-center gap-2 ${
                      hasSubmitted && !isCorrecting
                        ? 'bg-rose-950/60 border-rose-500/40 text-rose-300 hover:bg-rose-900/80'
                        : 'bg-gradient-to-r from-blue-600 via-indigo-600 to-blue-700 hover:from-blue-500 hover:to-indigo-500 border-blue-400 text-white active:scale-98 shadow-blue-600/30'
                    }`}
                  >
                    {hasSubmitted && !isCorrecting ? (
                      <>
                        <Lock className="w-4 h-4 text-rose-400" />
                        <span>AJUKAN KOREKSI NILAI</span>
                      </>
                    ) : (
                      <>
                        <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                        <span>KIRIM & KUNCI NILAI FINAL ({calculatedTunggalTotal.toFixed(2)})</span>
                      </>
                    )}
                  </button>

                </div>

              </div>

            </div>
          )}

          {/* ========================================================
              D. SYSTEM ALERTS & TOASTS
          ======================================================== */}
          <AnimatePresence mode="wait">
            {errorMessage && (
              <motion.div
                initial={{ opacity: 0, y: 5 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -5 }}
                className="p-2.5 bg-red-950/70 border border-red-500/40 text-red-300 rounded-xl text-xs uppercase font-bold font-mono flex items-center justify-between gap-2 shadow-lg"
              >
                <div className="flex items-center gap-2">
                  <ShieldAlert className="w-4 h-4 text-red-400 animate-pulse shrink-0" />
                  <span>Sistem Alert: {errorMessage}</span>
                </div>
                <button onClick={() => setErrorMessage(null)} className="text-slate-400 hover:text-white">
                  ✕
                </button>
              </motion.div>
            )}

            {successMessage && (
              <motion.div
                initial={{ opacity: 0, y: 5 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -5 }}
                className="p-2.5 bg-emerald-950/70 border border-emerald-500/40 text-emerald-300 rounded-xl text-xs uppercase font-bold font-mono flex items-center justify-between gap-2 shadow-lg"
              >
                <div className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span>Status: {successMessage}</span>
                </div>
                <button onClick={() => setSuccessMessage(null)} className="text-slate-400 hover:text-white">
                  ✕
                </button>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Locked State Notification */}
          {hasSubmitted && !isCorrecting && (
            <div className="bg-emerald-950/40 border border-emerald-500/30 rounded-2xl p-2.5 flex items-center justify-between px-4">
              <div className="flex items-center gap-2 text-xs font-mono text-emerald-300 font-bold">
                <Lock className="w-4 h-4 text-emerald-400" />
                <span>Nilai Juri {juriNumberStr} telah tersimpan resmi: {currentDisplayScore.toFixed(2)}</span>
              </div>
              <span className="text-[10px] font-mono text-slate-400">
                Menunggu dewan menyelesaikan partai
              </span>
            </div>
          )}

        </main>
      )}

      {/* ========================================================
          E. CONFIRMATION SUBMIT MODAL
      ======================================================== */}
      <AnimatePresence>
        {showConfirmModal && activePeserta && (
          <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-slate-900 border-2 border-amber-400/80 rounded-3xl p-6 max-w-md w-full shadow-2xl text-center space-y-4"
            >
              <div className="w-14 h-14 rounded-2xl bg-amber-500/20 border border-amber-400/50 flex items-center justify-center text-amber-400 mx-auto">
                <CheckCircle2 className="w-8 h-8" />
              </div>

              <div>
                <h3 className="text-lg font-black font-sport uppercase tracking-wider text-white">
                  KONFIRMASI PENGIRIMAN NILAI
                </h3>
                <p className="text-xs text-slate-300 font-mono mt-1">
                  Pastikan nilai Anda sudah benar sebelum dikunci dan dikirim ke Dewan Juri:
                </p>
              </div>

              <div className="bg-slate-950/90 border border-slate-800 rounded-2xl p-4 space-y-2 text-left text-xs font-mono">
                <div className="flex justify-between">
                  <span className="text-slate-400">Pesilat:</span>
                  <span className="font-bold text-white uppercase">{activePeserta.nama}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Kontingen:</span>
                  <span className="font-bold text-white uppercase">{activePeserta.kontingen}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Kategori:</span>
                  <span className="font-bold text-cyan-400 uppercase">{activePeserta.kategori}</span>
                </div>
                <div className="flex justify-between pt-2 border-t border-slate-800 text-sm">
                  <span className="font-bold text-slate-300">NILAI AKHIR JURI {juriNumberStr}:</span>
                  <span className="font-black text-amber-400 text-lg font-sport">
                    {currentDisplayScore.toFixed(2)}
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 pt-2">
                <button
                  onClick={() => setShowConfirmModal(false)}
                  className="py-2.5 px-4 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs uppercase cursor-pointer transition-colors"
                >
                  Kembali
                </button>
                <button
                  onClick={executeSubmitScore}
                  className="py-2.5 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-black text-xs font-sport tracking-wider uppercase cursor-pointer transition-all shadow-lg shadow-emerald-950/50"
                >
                  Ya, Kirim & Kunci
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ========================================================
          F. FOOTER BRANDING & COMPLIANCE
      ======================================================== */}
      <footer className="z-20 bg-slate-950 border-t border-slate-900 px-4 py-1.5 flex items-center justify-between text-[8.5px] font-mono tracking-wider text-slate-400 uppercase shrink-0">
        <span className="font-bold">
          SISTEM SCORING PENCAK SILAT IPSI (REGULASI 2022) • KATEGORI SENI (TUNGGAL, GANDA, REGU & SOLO KREATIF)
        </span>
        <span className="font-black text-blue-500 tracking-widest">
          DISCORS SILAT • JURI {juriNumberStr}
        </span>
      </footer>
    </div>
  );
}
