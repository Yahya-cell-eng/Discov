/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  ShieldAlert, Award, Zap, CheckCircle2, Clock, 
  Filter, Search, Download, Trash2, Plus, 
  Copy, Check, RefreshCw, FileText, Activity, AlertTriangle, ArrowUpDown, ChevronDown
} from 'lucide-react';
import { MatchState, DewanPenaltyCorner } from '../types';
import { playBeep } from '../utils/sound';

export interface MatchEvent {
  id: string;
  timestamp: number;
  timeString: string;
  babak: number;
  timerSnapshot: string;
  type: 'jatuhan' | 'pelanggaran' | 'verifikasi' | 'skor' | 'status' | 'manual';
  sudut: 'merah' | 'biru' | 'netral';
  title: string;
  detail: string;
  pointsDelta?: number;
  penaltyType?: string;
  varVotes?: {
    juri1: 'MERAH' | 'BIRU' | 'TIDAK_SAH' | null;
    juri2: 'MERAH' | 'BIRU' | 'TIDAK_SAH' | null;
    juri3: 'MERAH' | 'BIRU' | 'TIDAK_SAH' | null;
  };
  varResult?: string;
  atletNama?: string;
  kontingen?: string;
}

interface EventLogProps {
  state: MatchState;
  theme?: 'dark' | 'light';
  compact?: boolean; // When rendered as a compact widget inside Control panel
  onExpand?: () => void;
}

export default function EventLog({ state, theme = 'dark', compact = false, onExpand }: EventLogProps) {
  // Storage key based on partai & match
  const storageKey = useMemo(() => {
    const p = (state.partai || '01').replace(/\D/g, '') || '01';
    return `silat_event_log_P${p}_${state.kelas || 'Tanding'}`;
  }, [state.partai, state.kelas]);

  // Event list state with localStorage initialization
  const [events, setEvents] = useState<MatchEvent[]>(() => {
    try {
      const p = (state.partai || '01').replace(/\D/g, '') || '01';
      const saved = localStorage.getItem(`silat_event_log_P${p}_${state.kelas || 'Tanding'}`);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) return parsed;
      }
    } catch (e) {
      console.warn('Failed to parse saved event log', e);
    }
    return [];
  });

  // Track state transitions across renders
  const prevDirectPointsRef = useRef<{ merah: number; biru: number }>({
    merah: state.directPoints?.merah || 0,
    biru: state.directPoints?.biru || 0
  });

  const prevPenaltiesRef = useRef<{
    merah: DewanPenaltyCorner;
    biru: DewanPenaltyCorner;
  }>({
    merah: { ...state.dewanPenalties?.merah },
    biru: { ...state.dewanPenalties?.biru }
  });

  const prevVerificationRef = useRef<any>(state.lastVerificationResult);
  const prevValidScoreRef = useRef<any>(state.lastValidScore);
  const prevBabakRef = useRef<number>(state.currentBabak);
  const prevMatchStatusRef = useRef<string>(state.matchStatus);
  const prevWinnerRef = useRef<string | null>(state.winner);
  const prevPartaiRef = useRef<string>(state.partai);

  // Filters & Search
  const [filterType, setFilterType] = useState<string>('all');
  const [filterSudut, setFilterSudut] = useState<'all' | 'merah' | 'biru' | 'netral'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [sortOrder, setSortOrder] = useState<'desc' | 'asc'>('desc');
  const [copied, setCopied] = useState(false);

  // Manual event modal / form
  const [showAddManual, setShowAddManual] = useState(false);
  const [manualTitle, setManualTitle] = useState('');
  const [manualDetail, setManualDetail] = useState('');
  const [manualSudut, setManualSudut] = useState<'merah' | 'biru' | 'netral'>('netral');
  const [manualType, setManualType] = useState<'manual' | 'pelanggaran' | 'status'>('manual');

  // Save to local storage whenever events change
  useEffect(() => {
    try {
      localStorage.setItem(storageKey, JSON.stringify(events));
    } catch (e) {
      console.warn('Failed to save events to localStorage', e);
    }
  }, [events, storageKey]);

  // Handle party switch: reload corresponding storage
  useEffect(() => {
    if (prevPartaiRef.current !== state.partai) {
      prevPartaiRef.current = state.partai;
      try {
        const saved = localStorage.getItem(storageKey);
        if (saved) {
          const parsed = JSON.parse(saved);
          if (Array.isArray(parsed)) {
            setEvents(parsed);
            return;
          }
        }
      } catch (e) {
        console.warn(e);
      }
      setEvents([]);
    }
  }, [state.partai, storageKey]);

  // Helper to format remaining timer seconds
  const formatTimerSnapshot = (sec: number) => {
    const m = Math.floor(sec / 60);
    const s = sec % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  const getNowTimeString = () => {
    const now = new Date();
    return now.toTimeString().split(' ')[0];
  };

  // Helper to add event safely
  const appendEvent = (ev: Omit<MatchEvent, 'id' | 'timestamp' | 'timeString' | 'babak' | 'timerSnapshot'>) => {
    const newEvent: MatchEvent = {
      ...ev,
      id: `evt_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      timestamp: Date.now(),
      timeString: getNowTimeString(),
      babak: state.currentBabak,
      timerSnapshot: formatTimerSnapshot(state.timerSeconds)
    };
    setEvents(prev => [newEvent, ...prev]);
  };

  // 1. Detect Direct Points (JATUHAN: +3)
  useEffect(() => {
    const curMerah = state.directPoints?.merah || 0;
    const curBiru = state.directPoints?.biru || 0;
    const prevMerah = prevDirectPointsRef.current.merah;
    const prevBiru = prevDirectPointsRef.current.biru;

    if (curMerah > prevMerah) {
      const delta = curMerah - prevMerah;
      appendEvent({
        type: 'jatuhan',
        sudut: 'merah',
        title: `Jatuhan Sudut Merah (+${delta})`,
        detail: `Sudut Merah (${state.atletMerah?.nama || 'Merah'}) mencatatkan Jatuhan Sah Senilai +${delta} Poin.`,
        pointsDelta: delta,
        atletNama: state.atletMerah?.nama,
        kontingen: state.atletMerah?.kontingen
      });
    }

    if (curBiru > prevBiru) {
      const delta = curBiru - prevBiru;
      appendEvent({
        type: 'jatuhan',
        sudut: 'biru',
        title: `Jatuhan Sudut Biru (+${delta})`,
        detail: `Sudut Biru (${state.atletBiru?.nama || 'Biru'}) mencatatkan Jatuhan Sah Senilai +${delta} Poin.`,
        pointsDelta: delta,
        atletNama: state.atletBiru?.nama,
        kontingen: state.atletBiru?.kontingen
      });
    }

    prevDirectPointsRef.current = { merah: curMerah, biru: curBiru };
  }, [state.directPoints]);

  // 2. Detect Dewan Penalties (PELANGGARAN)
  useEffect(() => {
    const curP = state.dewanPenalties;
    const prevP = prevPenaltiesRef.current;

    if (!curP) return;

    const penaltyDefs: Array<{
      key: keyof DewanPenaltyCorner;
      label: string;
      deduction: number;
    }> = [
      { key: 'binaan1', label: 'Binaan I (Teguran Lisan / Pembinaan)', deduction: 0 },
      { key: 'binaan2', label: 'Binaan II (Teguran Lisan / Pembinaan)', deduction: 0 },
      { key: 'teguran1', label: 'Teguran I (-1 Poin)', deduction: -1 },
      { key: 'teguran2', label: 'Teguran II (-2 Poin)', deduction: -2 },
      { key: 'peringatan1', label: 'Peringatan I (-5 Poin)', deduction: -5 },
      { key: 'peringatan2', label: 'Peringatan II (-10 Poin)', deduction: -10 },
      { key: 'disqualified', label: 'DISKUALIFIKASI (Pelanggaran Berat)', deduction: 0 }
    ];

    // Check Merah
    if (curP.merah && prevP.merah) {
      penaltyDefs.forEach(p => {
        if (curP.merah[p.key] && !prevP.merah[p.key]) {
          appendEvent({
            type: 'pelanggaran',
            sudut: 'merah',
            title: `Pelanggaran: ${p.label}`,
            detail: `Dewan memberikan sanksi ${p.label} kepada Sudut Merah (${state.atletMerah?.nama || 'Merah'}).`,
            penaltyType: p.key,
            pointsDelta: p.deduction,
            atletNama: state.atletMerah?.nama,
            kontingen: state.atletMerah?.kontingen
          });
        }
      });
    }

    // Check Biru
    if (curP.biru && prevP.biru) {
      penaltyDefs.forEach(p => {
        if (curP.biru[p.key] && !prevP.biru[p.key]) {
          appendEvent({
            type: 'pelanggaran',
            sudut: 'biru',
            title: `Pelanggaran: ${p.label}`,
            detail: `Dewan memberikan sanksi ${p.label} kepada Sudut Biru (${state.atletBiru?.nama || 'Biru'}).`,
            penaltyType: p.key,
            pointsDelta: p.deduction,
            atletNama: state.atletBiru?.nama,
            kontingen: state.atletBiru?.kontingen
          });
        }
      });
    }

    prevPenaltiesRef.current = {
      merah: { ...(curP.merah || {}) as DewanPenaltyCorner },
      biru: { ...(curP.biru || {}) as DewanPenaltyCorner }
    };
  }, [state.dewanPenalties]);

  // 3. Detect VAR Verification Results
  useEffect(() => {
    const curVar = state.lastVerificationResult;
    const prevVar = prevVerificationRef.current;

    if (curVar && (!prevVar || curVar.timestamp !== prevVar.timestamp)) {
      const resultSudut = curVar.result === 'MERAH' ? 'merah' : curVar.result === 'BIRU' ? 'biru' : 'netral';
      const votesText = `Juri 1: ${curVar.votes?.juri1 || '-'} | Juri 2: ${curVar.votes?.juri2 || '-'} | Juri 3: ${curVar.votes?.juri3 || '-'}`;
      
      appendEvent({
        type: 'verifikasi',
        sudut: resultSudut,
        title: `Verifikasi VAR: ${curVar.type || 'JATUHAN'} ➔ ${curVar.result}`,
        detail: `Keputusan Sidang Verifikasi: ${curVar.result}. Rekap Suara [${votesText}].`,
        varVotes: curVar.votes,
        varResult: curVar.result || undefined,
        atletNama: resultSudut === 'merah' ? state.atletMerah?.nama : resultSudut === 'biru' ? state.atletBiru?.nama : undefined
      });
    }

    prevVerificationRef.current = curVar;
  }, [state.lastVerificationResult]);

  // 4. Detect Valid Score Hits (Pukulan +1 / Tendangan +2)
  useEffect(() => {
    const curHit = state.lastValidScore;
    const prevHit = prevValidScoreRef.current;

    if (curHit && (!prevHit || curHit.timestamp !== prevHit.timestamp)) {
      const isPunch = curHit.aksi === 'punch';
      const pts = isPunch ? 1 : 2;
      appendEvent({
        type: 'skor',
        sudut: curHit.sudut,
        title: `${isPunch ? 'Pukulan' : 'Tendangan'} Sah Sudut ${curHit.sudut === 'merah' ? 'Merah' : 'Biru'} (+${pts})`,
        detail: `Serangan ${isPunch ? 'Pukulan (+1)' : 'Tendangan (+2)'} terverifikasi masuk oleh mayoritas juri.`,
        pointsDelta: pts,
        atletNama: curHit.sudut === 'merah' ? state.atletMerah?.nama : state.atletBiru?.nama
      });
    }

    prevValidScoreRef.current = curHit;
  }, [state.lastValidScore]);

  // 5. Detect Babak Change
  useEffect(() => {
    if (prevBabakRef.current !== state.currentBabak) {
      appendEvent({
        type: 'status',
        sudut: 'netral',
        title: `Babak ${state.currentBabak} Dimulai`,
        detail: `Pertandingan resmi memasuki Babak ${state.currentBabak}.`
      });
      prevBabakRef.current = state.currentBabak;
    }
  }, [state.currentBabak]);

  // 6. Detect Match Status Changes (Running, Paused, Babak Habis, Selesai)
  useEffect(() => {
    if (prevMatchStatusRef.current !== state.matchStatus) {
      let title = '';
      let detail = '';

      if (state.matchStatus === 'running' && prevMatchStatusRef.current === 'paused') {
        title = 'Pertandingan Dilanjutkan';
        detail = 'Timer dijalankan kembali oleh Sekretaris/Timer Pertandingan.';
      } else if (state.matchStatus === 'running' && prevMatchStatusRef.current === 'idle') {
        title = `Pertandingan Dimulai (Babak ${state.currentBabak})`;
        detail = `Timer babak ${state.currentBabak} mulai berdetak.`;
      } else if (state.matchStatus === 'paused') {
        title = 'Pertandingan Dijeda (PAUSE)';
        detail = `Waktu dihentikan sementara pada sisa waktu ${formatTimerSnapshot(state.timerSeconds)}.`;
      } else if (state.matchStatus === 'babak_habis') {
        title = `Waktu Babak ${state.currentBabak} Telah Habis`;
        detail = `Gong/Bel babak ${state.currentBabak} berbunyi. Skor sementara: Merah ${state.scores?.merah?.total || 0} - ${state.scores?.biru?.total || 0} Biru.`;
      } else if (state.matchStatus === 'selesai') {
        title = 'Pertandingan Resmi Selesai';
        detail = `Seluruh babak partai telah ditutup. Skor Akhir: Merah ${state.scores?.merah?.total || 0} - ${state.scores?.biru?.total || 0} Biru.`;
      }

      if (title) {
        appendEvent({
          type: 'status',
          sudut: 'netral',
          title,
          detail
        });
      }

      prevMatchStatusRef.current = state.matchStatus;
    }
  }, [state.matchStatus]);

  // 7. Detect Winner Declaration
  useEffect(() => {
    if (state.winner && prevWinnerRef.current !== state.winner) {
      const winnerName = state.winner === 'merah' ? state.atletMerah?.nama : state.atletBiru?.nama;
      const winnerKont = state.winner === 'merah' ? state.atletMerah?.kontingen : state.atletBiru?.kontingen;
      appendEvent({
        type: 'status',
        sudut: state.winner,
        title: `🏆 PEMENANG: SUDUT ${state.winner.toUpperCase()}`,
        detail: `Kemenangan disahkan untuk ${winnerName || `Sudut ${state.winner.toUpperCase()}`} (${winnerKont || '-'}). Skor: Merah ${state.scores?.merah?.total || 0} - ${state.scores?.biru?.total || 0} Biru.`,
        atletNama: winnerName,
        kontingen: winnerKont
      });
      prevWinnerRef.current = state.winner;
    }
  }, [state.winner]);

  // KPI Calculations
  const stats = useMemo(() => {
    let jatuhanMerah = 0;
    let jatuhanBiru = 0;
    let pelanggaranMerah = 0;
    let pelanggaranBiru = 0;
    let totalVar = 0;
    let totalSkorHits = 0;

    events.forEach(e => {
      if (e.type === 'jatuhan') {
        if (e.sudut === 'merah') jatuhanMerah++;
        if (e.sudut === 'biru') jatuhanBiru++;
      } else if (e.type === 'pelanggaran') {
        if (e.sudut === 'merah') pelanggaranMerah++;
        if (e.sudut === 'biru') pelanggaranBiru++;
      } else if (e.type === 'verifikasi') {
        totalVar++;
      } else if (e.type === 'skor') {
        totalSkorHits++;
      }
    });

    return {
      jatuhanMerah,
      jatuhanBiru,
      pelanggaranMerah,
      pelanggaranBiru,
      totalVar,
      totalSkorHits,
      totalEvents: events.length
    };
  }, [events]);

  // Filtered & Sorted events list
  const filteredEvents = useMemo(() => {
    return events.filter(e => {
      // Type filter
      if (filterType !== 'all' && e.type !== filterType) {
        return false;
      }
      // Corner filter
      if (filterSudut !== 'all' && e.sudut !== filterSudut) {
        return false;
      }
      // Search query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const inTitle = e.title.toLowerCase().includes(q);
        const inDetail = e.detail.toLowerCase().includes(q);
        const inTime = e.timeString.toLowerCase().includes(q);
        const inSnap = e.timerSnapshot.toLowerCase().includes(q);
        const inAthlete = (e.atletNama || '').toLowerCase().includes(q);
        const inKont = (e.kontingen || '').toLowerCase().includes(q);
        return inTitle || inDetail || inTime || inSnap || inAthlete || inKont;
      }
      return true;
    }).sort((a, b) => {
      return sortOrder === 'desc' ? b.timestamp - a.timestamp : a.timestamp - b.timestamp;
    });
  }, [events, filterType, filterSudut, searchQuery, sortOrder]);

  // Export CSV
  const handleExportCSV = () => {
    playBeep('click');
    if (events.length === 0) {
      alert('Belum ada data peristiwa/event yang terekam untuk diekspor.');
      return;
    }

    const headers = ['No', 'Waktu Jam', 'Babak', 'Sisa Timer', 'Kategori Event', 'Sudut', 'Judul Peristiwa', 'Detail Keterangan', 'Atlet', 'Kontingen'];
    const rows = events.map((e, idx) => [
      idx + 1,
      `"${e.timeString}"`,
      `"Babak ${e.babak}"`,
      `"${e.timerSnapshot}"`,
      `"${e.type.toUpperCase()}"`,
      `"${e.sudut.toUpperCase()}"`,
      `"${e.title.replace(/"/g, '""')}"`,
      `"${e.detail.replace(/"/g, '""')}"`,
      `"${(e.atletNama || '-').replace(/"/g, '""')}"`,
      `"${(e.kontingen || '-').replace(/"/g, '""')}"`
    ]);

    const csvContent = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `EventLog_Partai_${state.partai || '01'}_${Date.now()}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  // Copy timeline to clipboard
  const handleCopyTimeline = () => {
    playBeep('click');
    if (events.length === 0) return;

    const lines = [
      `=== LOG PERISTIWA PERTANDINGAN PENCAK SILAT ===`,
      `Partai: ${state.partai || '01'} | Kelas: ${state.kelas || '-'} | Gender: ${state.gender || '-'}`,
      `Merah: ${state.atletMerah?.nama || '-'} (${state.atletMerah?.kontingen || '-'})`,
      `Biru: ${state.atletBiru?.nama || '-'} (${state.atletBiru?.kontingen || '-'})`,
      `Tanggal: ${new Date().toLocaleDateString('id-ID')}`,
      `----------------------------------------------------`,
      ...events.map(e => `[${e.timeString} | B${e.babak} ${e.timerSnapshot}] [${e.sudut.toUpperCase()}] ${e.title} -> ${e.detail}`),
      `----------------------------------------------------`,
      `Skor Akhir: Merah ${state.scores?.merah?.total || 0} - ${state.scores?.biru?.total || 0} Biru`
    ].join('\n');

    navigator.clipboard.writeText(lines).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    }).catch(err => console.warn(err));
  };

  // Clear Log
  const handleClearLog = () => {
    playBeep('warning');
    if (window.confirm(`Bersihkan semua log peristiwa partai ${state.partai || '01'}? Tindakan ini tidak dapat dibatalkan.`)) {
      setEvents([]);
      try {
        localStorage.removeItem(storageKey);
      } catch (e) {
        console.warn(e);
      }
    }
  };

  // Add manual note
  const handleAddManualEvent = (e: React.FormEvent) => {
    e.preventDefault();
    if (!manualTitle.trim()) return;

    playBeep('valid');
    appendEvent({
      type: manualType,
      sudut: manualSudut,
      title: manualTitle.trim(),
      detail: manualDetail.trim() || 'Catatan manual dimasukkan oleh Sekretaris Pertandingan.',
      atletNama: manualSudut === 'merah' ? state.atletMerah?.nama : manualSudut === 'biru' ? state.atletBiru?.nama : undefined,
      kontingen: manualSudut === 'merah' ? state.atletMerah?.kontingen : manualSudut === 'biru' ? state.atletBiru?.kontingen : undefined
    });

    setManualTitle('');
    setManualDetail('');
    setShowAddManual(false);
  };

  // Event category badge styling
  const getTypeBadge = (type: MatchEvent['type']) => {
    switch (type) {
      case 'jatuhan':
        return {
          icon: <Award className="w-3.5 h-3.5 text-amber-400" />,
          label: 'JATUHAN',
          bg: 'bg-amber-950/40 text-amber-300 border-amber-700/50'
        };
      case 'pelanggaran':
        return {
          icon: <ShieldAlert className="w-3.5 h-3.5 text-rose-400" />,
          label: 'HUKUMAN',
          bg: 'bg-rose-950/40 text-rose-300 border-rose-700/50'
        };
      case 'verifikasi':
        return {
          icon: <CheckCircle2 className="w-3.5 h-3.5 text-indigo-400" />,
          label: 'VAR DEWAN',
          bg: 'bg-indigo-950/40 text-indigo-300 border-indigo-700/50'
        };
      case 'skor':
        return {
          icon: <Zap className="w-3.5 h-3.5 text-emerald-400" />,
          label: 'POIN SAH',
          bg: 'bg-emerald-950/40 text-emerald-300 border-emerald-700/50'
        };
      case 'status':
        return {
          icon: <Activity className="w-3.5 h-3.5 text-cyan-400" />,
          label: 'STATUS',
          bg: 'bg-cyan-950/40 text-cyan-300 border-cyan-700/50'
        };
      case 'manual':
      default:
        return {
          icon: <FileText className="w-3.5 h-3.5 text-purple-400" />,
          label: 'CATATAN',
          bg: 'bg-purple-950/40 text-purple-300 border-purple-700/50'
        };
    }
  };

  // Corner style helper
  const getCornerPill = (sudut: MatchEvent['sudut']) => {
    if (sudut === 'merah') {
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-wider bg-red-950/60 text-red-300 border border-red-700/60">
          <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse" />
          MERAH
        </span>
      );
    }
    if (sudut === 'biru') {
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-wider bg-blue-950/60 text-cyan-300 border border-blue-700/60">
          <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse" />
          BIRU
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-wider bg-slate-800 text-slate-300 border border-slate-700">
        NETRAL
      </span>
    );
  };

  return (
    <div className={`w-full h-full flex flex-col overflow-hidden rounded-xl border ${
      theme === 'dark' 
        ? 'bg-slate-950/90 border-slate-800/90 text-slate-100 shadow-xl' 
        : 'bg-white border-slate-200 text-slate-800 shadow-md'
    }`}>
      
      {/* 1. Header Toolbar */}
      <div className={`p-3 border-b flex flex-wrap items-center justify-between gap-2.5 shrink-0 ${
        theme === 'dark' 
          ? 'border-slate-800 bg-gradient-to-r from-slate-900 via-slate-900/90 to-slate-900' 
          : 'border-slate-200 bg-gradient-to-r from-slate-100 via-slate-50 to-slate-100'
      }`}>
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-lg bg-emerald-600/20 text-emerald-400 border border-emerald-500/30">
            <Activity className="w-4 h-4 animate-pulse" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-xs sm:text-sm font-black uppercase tracking-wider">
                Event Log Pertandingan Real-Time
              </h3>
              <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
                LIVE • P{state.partai || '01'}
              </span>
            </div>
            <p className="text-[10px] font-mono text-slate-400">
              Pelacakan otomatis & kronologis untuk Jatuhan, Pelanggaran, Verifikasi VAR, dan Skor.
            </p>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-1.5 flex-wrap">
          <button
            type="button"
            onClick={() => { playBeep('click'); setShowAddManual(true); }}
            className="px-2.5 py-1.5 rounded-lg text-xs font-black uppercase tracking-wider bg-emerald-600 hover:bg-emerald-500 text-white shadow-sm flex items-center gap-1 cursor-pointer transition-all active:scale-95"
            title="Tambah catatan insiden atau verifikasi manual"
          >
            <Plus className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Tambah Catatan</span>
          </button>

          <button
            type="button"
            onClick={handleExportCSV}
            className={`px-2.5 py-1.5 rounded-lg text-xs font-bold uppercase tracking-wider border flex items-center gap-1 cursor-pointer transition-all active:scale-95 ${
              theme === 'dark' 
                ? 'bg-slate-900 border-slate-700 text-slate-300 hover:bg-slate-800' 
                : 'bg-slate-100 border-slate-300 text-slate-700 hover:bg-slate-200'
            }`}
            title="Unduh log peristiwa dalam format CSV"
          >
            <Download className="w-3.5 h-3.5 text-emerald-400" />
            <span className="hidden sm:inline">CSV</span>
          </button>

          <button
            type="button"
            onClick={handleCopyTimeline}
            className={`px-2.5 py-1.5 rounded-lg text-xs font-bold uppercase tracking-wider border flex items-center gap-1 cursor-pointer transition-all active:scale-95 ${
              theme === 'dark' 
                ? 'bg-slate-900 border-slate-700 text-slate-300 hover:bg-slate-800' 
                : 'bg-slate-100 border-slate-300 text-slate-700 hover:bg-slate-200'
            }`}
            title="Salin rekap timeline ke clipboard"
          >
            {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5 text-cyan-400" />}
            <span className="hidden sm:inline">{copied ? 'Tersalin!' : 'Salin'}</span>
          </button>

          {events.length > 0 && (
            <button
              type="button"
              onClick={handleClearLog}
              className="p-1.5 rounded-lg text-xs font-bold text-rose-400 hover:text-rose-300 bg-rose-950/20 border border-rose-900/40 hover:bg-rose-900/30 cursor-pointer transition-all active:scale-95"
              title="Bersihkan seluruh log peristiwa saat ini"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          )}

          {compact && onExpand && (
            <button
              type="button"
              onClick={onExpand}
              className="px-2 py-1.5 rounded-lg text-xs font-black uppercase text-amber-400 bg-amber-950/30 border border-amber-600/40 hover:bg-amber-900/40 cursor-pointer"
            >
              Perbesar
            </button>
          )}
        </div>
      </div>

      {/* 2. KPI Summary Banner */}
      <div className={`grid grid-cols-2 sm:grid-cols-4 gap-2 p-2.5 border-b shrink-0 ${
        theme === 'dark' ? 'bg-slate-900/40 border-slate-800/80' : 'bg-slate-100/60 border-slate-200'
      }`}>
        {/* Jatuhan Metric */}
        <div className={`p-2 rounded-lg border flex flex-col justify-between ${
          theme === 'dark' ? 'bg-slate-950/60 border-slate-800' : 'bg-white border-slate-200'
        }`}>
          <div className="flex items-center justify-between text-[10px] font-mono text-slate-400 uppercase">
            <span className="flex items-center gap-1 font-bold">
              <Award className="w-3 h-3 text-amber-400" /> Total Jatuhan
            </span>
            <span className="font-black text-amber-400">{stats.jatuhanMerah + stats.jatuhanBiru}</span>
          </div>
          <div className="flex items-center justify-between mt-1 text-xs font-mono font-black">
            <span className="text-red-400">🔴 {stats.jatuhanMerah}</span>
            <span className="text-cyan-400">🔵 {stats.jatuhanBiru}</span>
          </div>
        </div>

        {/* Pelanggaran Metric */}
        <div className={`p-2 rounded-lg border flex flex-col justify-between ${
          theme === 'dark' ? 'bg-slate-950/60 border-slate-800' : 'bg-white border-slate-200'
        }`}>
          <div className="flex items-center justify-between text-[10px] font-mono text-slate-400 uppercase">
            <span className="flex items-center gap-1 font-bold">
              <ShieldAlert className="w-3 h-3 text-rose-400" /> Hukuman Dewan
            </span>
            <span className="font-black text-rose-400">{stats.pelanggaranMerah + stats.pelanggaranBiru}</span>
          </div>
          <div className="flex items-center justify-between mt-1 text-xs font-mono font-black">
            <span className="text-red-400">🔴 {stats.pelanggaranMerah}</span>
            <span className="text-cyan-400">🔵 {stats.pelanggaranBiru}</span>
          </div>
        </div>

        {/* VAR Metric */}
        <div className={`p-2 rounded-lg border flex flex-col justify-between ${
          theme === 'dark' ? 'bg-slate-950/60 border-slate-800' : 'bg-white border-slate-200'
        }`}>
          <div className="flex items-center justify-between text-[10px] font-mono text-slate-400 uppercase">
            <span className="flex items-center gap-1 font-bold">
              <CheckCircle2 className="w-3 h-3 text-indigo-400" /> Verifikasi VAR
            </span>
            <span className="font-black text-indigo-400">{stats.totalVar}</span>
          </div>
          <div className="text-[11px] font-mono font-bold text-slate-300 mt-1 truncate">
            {state.lastVerificationResult ? `Terakhir: ${state.lastVerificationResult.result || '-'}` : 'Belum ada'}
          </div>
        </div>

        {/* Poin Sah Metric */}
        <div className={`p-2 rounded-lg border flex flex-col justify-between ${
          theme === 'dark' ? 'bg-slate-950/60 border-slate-800' : 'bg-white border-slate-200'
        }`}>
          <div className="flex items-center justify-between text-[10px] font-mono text-slate-400 uppercase">
            <span className="flex items-center gap-1 font-bold">
              <Zap className="w-3 h-3 text-emerald-400" /> Serangan Masuk
            </span>
            <span className="font-black text-emerald-400">{stats.totalSkorHits}</span>
          </div>
          <div className="flex items-center justify-between mt-1 text-xs font-mono font-black">
            <span className="text-slate-400 text-[10px]">Skor Total:</span>
            <span className="text-white">
              <span className="text-red-400">{state.scores?.merah?.total || 0}</span> - <span className="text-cyan-400">{state.scores?.biru?.total || 0}</span>
            </span>
          </div>
        </div>
      </div>

      {/* 3. Search and Filtering Bar */}
      <div className={`p-2.5 border-b flex flex-wrap items-center justify-between gap-2 shrink-0 ${
        theme === 'dark' ? 'bg-slate-900/30 border-slate-800/80' : 'bg-slate-50 border-slate-200'
      }`}>
        {/* Category Filters */}
        <div className="flex items-center gap-1 overflow-x-auto pb-1 max-w-full">
          {[
            { id: 'all', label: 'Semua' },
            { id: 'jatuhan', label: '🏆 Jatuhan' },
            { id: 'pelanggaran', label: '⚠️ Hukuman' },
            { id: 'verifikasi', label: '📺 VAR' },
            { id: 'skor', label: '⚡ Poin Sah' },
            { id: 'status', label: '⏱️ Babak/Status' },
            { id: 'manual', label: '📝 Catatan' }
          ].map(f => (
            <button
              key={f.id}
              onClick={() => { playBeep('click'); setFilterType(f.id); }}
              className={`px-2.5 py-1 text-[10px] sm:text-xs font-bold rounded-md whitespace-nowrap cursor-pointer transition-all ${
                filterType === f.id
                  ? 'bg-emerald-600 text-white shadow-sm font-black'
                  : theme === 'dark'
                    ? 'bg-slate-900 text-slate-400 hover:text-slate-200 border border-slate-800'
                    : 'bg-white text-slate-600 hover:text-slate-900 border border-slate-200'
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>

        {/* Corner Filter & Search Box */}
        <div className="flex items-center gap-2 w-full sm:w-auto">
          {/* Sudut Filter Selector */}
          <div className="flex items-center gap-1 bg-slate-900 border border-slate-800 rounded-md p-0.5">
            <button
              type="button"
              onClick={() => { playBeep('click'); setFilterSudut('all'); }}
              className={`px-2 py-0.5 text-[10px] font-bold rounded cursor-pointer ${
                filterSudut === 'all' ? 'bg-slate-700 text-white' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Semua
            </button>
            <button
              type="button"
              onClick={() => { playBeep('click'); setFilterSudut('merah'); }}
              className={`px-2 py-0.5 text-[10px] font-bold rounded cursor-pointer ${
                filterSudut === 'merah' ? 'bg-red-600 text-white' : 'text-red-400 hover:text-red-300'
              }`}
            >
              Merah
            </button>
            <button
              type="button"
              onClick={() => { playBeep('click'); setFilterSudut('biru'); }}
              className={`px-2 py-0.5 text-[10px] font-bold rounded cursor-pointer ${
                filterSudut === 'biru' ? 'bg-cyan-600 text-white' : 'text-cyan-400 hover:text-cyan-300'
              }`}
            >
              Biru
            </button>
          </div>

          {/* Search Input */}
          <div className="relative flex-1 sm:w-48">
            <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-500" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Cari peristiwa..."
              className={`w-full text-xs pl-8 pr-2.5 py-1 rounded-md border outline-none font-mono ${
                theme === 'dark'
                  ? 'bg-slate-900/80 border-slate-800 text-white placeholder-slate-500 focus:border-emerald-500'
                  : 'bg-white border-slate-300 text-slate-900 placeholder-slate-400 focus:border-emerald-500'
              }`}
            />
          </div>

          {/* Sort order toggle */}
          <button
            type="button"
            onClick={() => {
              playBeep('click');
              setSortOrder(prev => prev === 'desc' ? 'asc' : 'desc');
            }}
            className="p-1 rounded-md bg-slate-900 border border-slate-800 text-slate-400 hover:text-slate-200 cursor-pointer"
            title={sortOrder === 'desc' ? 'Urutan: Terbaru di atas' : 'Urutan: Terlama di atas'}
          >
            <ArrowUpDown className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* 4. Event List Feed */}
      <div className="flex-1 min-h-0 overflow-y-auto p-2 sm:p-3 flex flex-col gap-2">
        {filteredEvents.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-center p-6 text-slate-500">
            <Activity className="w-8 h-8 mb-2 opacity-30 text-emerald-400" />
            <p className="text-xs font-mono font-bold">
              {searchQuery || filterType !== 'all' || filterSudut !== 'all'
                ? 'Tidak ada peristiwa yang cocok dengan filter yang dipilih.'
                : 'Belum ada peristiwa signifikan tercatat pada partai ini.'}
            </p>
            <p className="text-[10px] text-slate-500 mt-1 max-w-sm">
              Peristiwa seperti Jatuhan (+3), Hukuman (Teguran/Peringatan), Verifikasi VAR, dan Poin Sah akan otomatis terekam saat pertandingan berjalan.
            </p>
            <button
              type="button"
              onClick={() => { playBeep('click'); setShowAddManual(true); }}
              className="mt-3 px-3 py-1.5 text-xs font-bold text-emerald-400 bg-emerald-950/30 border border-emerald-800/40 rounded-lg hover:bg-emerald-900/40 cursor-pointer"
            >
              + Tambah Catatan Manual
            </button>
          </div>
        ) : (
          <AnimatePresence initial={false}>
            {filteredEvents.map((evt, idx) => {
              const typeBadge = getTypeBadge(evt.type);
              return (
                <motion.div
                  key={evt.id}
                  initial={{ opacity: 0, y: -8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  transition={{ duration: 0.18 }}
                  className={`p-2.5 sm:p-3 rounded-xl border flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2.5 transition-all ${
                    evt.sudut === 'merah'
                      ? theme === 'dark' 
                        ? 'bg-gradient-to-r from-red-950/25 via-slate-900/60 to-slate-900/40 border-red-900/40 hover:border-red-800/60'
                        : 'bg-red-50/60 border-red-200 hover:border-red-300'
                      : evt.sudut === 'biru'
                        ? theme === 'dark'
                          ? 'bg-gradient-to-r from-blue-950/25 via-slate-900/60 to-slate-900/40 border-blue-900/40 hover:border-blue-800/60'
                          : 'bg-blue-50/60 border-blue-200 hover:border-blue-300'
                        : theme === 'dark'
                          ? 'bg-slate-900/60 border-slate-800 hover:border-slate-700'
                          : 'bg-white border-slate-200 hover:border-slate-300'
                  }`}
                >
                  {/* Left: Indicator, Type badge, Timing, Details */}
                  <div className="flex items-start gap-2.5 flex-1 min-w-0">
                    <div className="mt-0.5">
                      <div className={`p-1.5 rounded-lg border ${typeBadge.bg}`}>
                        {typeBadge.icon}
                      </div>
                    </div>

                    <div className="flex-1 min-w-0">
                      {/* Top Meta info */}
                      <div className="flex items-center gap-2 flex-wrap mb-1">
                        {getCornerPill(evt.sudut)}

                        <span className={`px-2 py-0.5 rounded text-[9px] font-mono font-bold uppercase border ${typeBadge.bg}`}>
                          {typeBadge.label}
                        </span>

                        <span className="text-[10px] font-mono text-slate-400 flex items-center gap-1">
                          <Clock className="w-3 h-3 text-slate-500" />
                          <span>Babak {evt.babak}</span>
                          <span className="text-slate-600">•</span>
                          <span className="text-amber-400 font-bold">{evt.timerSnapshot}</span>
                          <span className="text-slate-600">•</span>
                          <span>{evt.timeString}</span>
                        </span>

                        {evt.pointsDelta !== undefined && evt.pointsDelta !== 0 && (
                          <span className={`text-[10px] font-mono font-black px-1.5 py-0.2 rounded ${
                            evt.pointsDelta > 0 
                              ? 'bg-emerald-950/50 text-emerald-400 border border-emerald-800/50' 
                              : 'bg-rose-950/50 text-rose-400 border border-rose-800/50'
                          }`}>
                            {evt.pointsDelta > 0 ? `+${evt.pointsDelta}` : evt.pointsDelta} Poin
                          </span>
                        )}
                      </div>

                      {/* Main Title & Description */}
                      <h4 className="text-xs sm:text-sm font-black text-slate-100 flex items-center gap-1.5">
                        <span>{evt.title}</span>
                      </h4>
                      <p className="text-[11px] text-slate-400 font-mono mt-0.5 break-words">
                        {evt.detail}
                      </p>

                      {/* Athlete sub-badge if available */}
                      {evt.atletNama && (
                        <div className="mt-1 flex items-center gap-1 text-[10px] font-mono text-slate-400">
                          <span className="text-slate-500">Atlet:</span>
                          <span className="font-bold text-slate-300">{evt.atletNama}</span>
                          {evt.kontingen && (
                            <>
                              <span className="text-slate-600">•</span>
                              <span className="text-slate-400">{evt.kontingen}</span>
                            </>
                          )}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Right side: Delete single event button */}
                  <div className="shrink-0 flex items-center self-end sm:self-center">
                    <button
                      type="button"
                      onClick={() => {
                        playBeep('click');
                        setEvents(prev => prev.filter(e => e.id !== evt.id));
                      }}
                      className="p-1 text-slate-500 hover:text-rose-400 cursor-pointer rounded transition-colors"
                      title="Hapus baris peristiwa ini"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </motion.div>
              );
            })}
          </AnimatePresence>
        )}
      </div>

      {/* 5. Bottom Status Footer */}
      <div className={`p-2 px-3 border-t flex items-center justify-between text-[10px] font-mono shrink-0 ${
        theme === 'dark' ? 'bg-slate-950 border-slate-800/80 text-slate-500' : 'bg-slate-100 border-slate-200 text-slate-600'
      }`}>
        <div className="flex items-center gap-2">
          <span>Menampilkan <strong className="text-slate-300">{filteredEvents.length}</strong> dari <strong className="text-slate-300">{events.length}</strong> peristiwa</span>
          <span>•</span>
          <span className="text-emerald-400 font-bold">Auto-sync aktif</span>
        </div>
        <div>
          <span>Partai: P{state.partai || '01'} ({state.kelas || 'Tanding'} {state.gender || ''})</span>
        </div>
      </div>

      {/* Modal: Tambah Catatan Manual */}
      <AnimatePresence>
        {showAddManual && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-3 bg-black/75 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className={`w-full max-w-md rounded-2xl p-4 border shadow-2xl flex flex-col gap-3 ${
                theme === 'dark' ? 'bg-slate-900 border-slate-800 text-white' : 'bg-white border-slate-300 text-slate-900'
              }`}
            >
              <div className="flex items-center justify-between border-b pb-2">
                <div className="flex items-center gap-2">
                  <div className="p-1.5 rounded-lg bg-emerald-600/20 text-emerald-400">
                    <Plus className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="text-xs sm:text-sm font-black uppercase">Tambah Catatan Acara Manual</h3>
                    <p className="text-[10px] text-slate-400 font-mono">Untuk insiden medis, permohonan wasit, atau catatan dewan</p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setShowAddManual(false)}
                  className="p-1 text-slate-400 hover:text-white cursor-pointer"
                >
                  ✕
                </button>
              </div>

              <form onSubmit={handleAddManualEvent} className="flex flex-col gap-2.5">
                {/* Preset Chips */}
                <div>
                  <label className="block text-[10px] font-mono text-slate-400 uppercase mb-1">Template Cepat:</label>
                  <div className="flex flex-wrap gap-1">
                    {[
                      { title: 'Pemeriksaan Dokter Pertandingan (Medis)', type: 'status' as const },
                      { title: 'VAR Challenge oleh Manajer', type: 'verifikasi' as const },
                      { title: 'Peringatan Pendamping Sudut', type: 'pelanggaran' as const },
                      { title: 'Pergantian Wasit Panggung', type: 'status' as const },
                      { title: 'Koreksi Nilai oleh Sekretaris', type: 'manual' as const }
                    ].map(p => (
                      <button
                        key={p.title}
                        type="button"
                        onClick={() => {
                          setManualTitle(p.title);
                          setManualType(p.type as any);
                        }}
                        className="px-2 py-0.5 text-[10px] font-mono bg-slate-800 hover:bg-slate-700 text-slate-300 rounded border border-slate-700 cursor-pointer"
                      >
                        + {p.title}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Sudut selector */}
                <div>
                  <label className="block text-[10px] font-mono text-slate-400 uppercase mb-1">Sudut Terkait:</label>
                  <div className="grid grid-cols-3 gap-1 bg-slate-950 p-1 rounded-lg border border-slate-800">
                    <button
                      type="button"
                      onClick={() => setManualSudut('netral')}
                      className={`py-1 text-xs font-bold uppercase rounded cursor-pointer ${
                        manualSudut === 'netral' ? 'bg-slate-700 text-white' : 'text-slate-400 hover:text-white'
                      }`}
                    >
                      Netral
                    </button>
                    <button
                      type="button"
                      onClick={() => setManualSudut('merah')}
                      className={`py-1 text-xs font-bold uppercase rounded cursor-pointer ${
                        manualSudut === 'merah' ? 'bg-red-600 text-white' : 'text-red-400 hover:text-red-200'
                      }`}
                    >
                      Merah
                    </button>
                    <button
                      type="button"
                      onClick={() => setManualSudut('biru')}
                      className={`py-1 text-xs font-bold uppercase rounded cursor-pointer ${
                        manualSudut === 'biru' ? 'bg-cyan-600 text-white' : 'text-cyan-400 hover:text-cyan-200'
                      }`}
                    >
                      Biru
                    </button>
                  </div>
                </div>

                {/* Judul Peristiwa */}
                <div>
                  <label className="block text-[10px] font-mono text-slate-400 uppercase mb-1">Judul Peristiwa:</label>
                  <input
                    type="text"
                    required
                    value={manualTitle}
                    onChange={(e) => setManualTitle(e.target.value)}
                    placeholder="Contoh: Pemeriksaan Medis Sudut Merah"
                    className="w-full text-xs px-2.5 py-1.5 rounded-lg bg-slate-950 border border-slate-800 text-white outline-none focus:border-emerald-500 font-bold"
                  />
                </div>

                {/* Keterangan Rinci */}
                <div>
                  <label className="block text-[10px] font-mono text-slate-400 uppercase mb-1">Keterangan / Rincian:</label>
                  <textarea
                    rows={2}
                    value={manualDetail}
                    onChange={(e) => setManualDetail(e.target.value)}
                    placeholder="Rincian keputusan wasit, dokter, atau dewan juri..."
                    className="w-full text-xs px-2.5 py-1.5 rounded-lg bg-slate-950 border border-slate-800 text-white outline-none focus:border-emerald-500 font-mono"
                  />
                </div>

                {/* Action Buttons */}
                <div className="flex justify-end gap-2 mt-1">
                  <button
                    type="button"
                    onClick={() => setShowAddManual(false)}
                    className="px-3 py-1.5 text-xs font-bold uppercase text-slate-400 hover:text-white cursor-pointer"
                  >
                    Batal
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-1.5 text-xs font-black uppercase tracking-wider bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg shadow-md cursor-pointer transition-all active:scale-95"
                  >
                    Simpan Peristiwa
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
