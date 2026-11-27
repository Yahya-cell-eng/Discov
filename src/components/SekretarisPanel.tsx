/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useRef, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  FileText, Play, RotateCcw, Award, CheckCircle, 
  Trash2, Download, Upload, Image as ImageIcon, ChevronRight, HelpCircle, Power, Sun, Moon, QrCode, Maximize2, Minimize2,
  Search, Filter, ListOrdered, ChevronLeft, X, AlertTriangle, CheckCircle2, Printer, Activity
} from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';
import { MatchState, MatchHistory, BaganCategory, BaganMatch } from '../types';
import { playBeep } from '../utils/sound';
import { 
  generateMatchReportPdf, 
  generateAllMatchesReportPdf, 
  generateRekapitulasiNilaiAkhirPdf 
} from '../utils/generateMatchReportPdf';
import RekapitulasiNilaiPdfModal from './RekapitulasiNilaiPdfModal';
import EventLog from './EventLog';
import sekretarisImg from '../assets/images/sekretaris_panel_1782782300726.jpg';
import BaganTab from './BaganTab';
import JadwalTab from './JadwalTab';
import RegistrasiDataPanel from './RegistrasiDataPanel';
import ThemePaletteSelector from './ThemePaletteSelector';
import SekretarisSeniMultiPesertaPanel from './SekretarisSeniMultiPesertaPanel';
import { TGRState } from '../types';

interface SekretarisPanelProps {
  state: MatchState;
  tgrState?: TGRState | null;
  histories: MatchHistory[];
  dispatch: (type: string, payload?: any) => Promise<any>;
  onBack: () => void;
  theme: 'dark' | 'light';
  onToggleTheme: () => void;
}

export default function SekretarisPanel({ state, tgrState, histories, dispatch, onBack, theme, onToggleTheme }: SekretarisPanelProps) {
  const [isFullscreen, setIsFullscreen] = useState(false);

  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
  }, []);

  const toggleFullscreen = () => {
    playBeep('click');
    const elem = document.documentElement;
    if (!document.fullscreenElement) {
      elem.requestFullscreen().catch(err => console.warn(err));
    } else {
      document.exitFullscreen().catch(err => console.warn(err));
    }
  };

  const [showRegistrasiPage, setShowRegistrasiPage] = useState(false);
  // Navigation inside panel: "config", "control", "events" (Event Log), "jadwal" (Cetak Jadwal PDF), "seni" (Manajemen Seni Pool)
  const [activeTab, setActiveTab ] = useState<'config' | 'control' | 'events' | 'jadwal' | 'seni'>('control');

  const [showNextBabakConfirm, setShowNextBabakConfirm ] = useState(false);
  const [showRekapModal, setShowRekapModal] = useState(false);
  const [showQrModal, setShowQrModal] = useState(false);
  const [showLogoModal, setShowLogoModal] = useState(false);
  const [showPilihPartaiModal, setShowPilihPartaiModal] = useState(false);
  const [partaiSearchQuery, setPartaiSearchQuery] = useState('');
  const [partaiFilterStatus, setPartaiFilterStatus] = useState<'all' | 'unfinished' | 'finished'>('all');
  const [confirmLoadPartai, setConfirmLoadPartai] = useState<any | null>(null);
  const [customPartaiInput, setCustomPartaiInput] = useState('');
  const [toastMsg, setToastMsg] = useState<string | null>(null);
  const fileInputKiriRef = useRef<HTMLInputElement>(null);
  const fileInputKananRef = useRef<HTMLInputElement>(null);
  const fileInputTengahRef = useRef<HTMLInputElement>(null);

  // Client-side image compressor for lightweight, instantaneous logo synchronization
  const compressImage = (file: File, maxWidth = 400, maxHeight = 400): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        const img = new Image();
        img.onload = () => {
          let width = img.width;
          let height = img.height;
          if (width > maxWidth || height > maxHeight) {
            if (width > height) {
              height = Math.round((height * maxWidth) / width);
              width = maxWidth;
            } else {
              width = Math.round((width * maxHeight) / height);
              height = maxHeight;
            }
          }
          const canvas = document.createElement('canvas');
          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          if (ctx) {
            ctx.drawImage(img, 0, 0, width, height);
            resolve(canvas.toDataURL('image/png', 0.9));
          } else {
            resolve(reader.result as string);
          }
        };
        img.onerror = reject;
        img.src = e.target?.result as string;
      };
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  };

  interface FlattenedScheduled {
    uniqueId: string;
    catId: string;
    categoryName: string;
    gender: 'Putra' | 'Putri';
    category: { id: string; name: string; gender: 'Putra' | 'Putri' };
    round: string;
    match: BaganMatch;
    num: number;
    partaiLabel: string;
    isFinished: boolean;
    isActive: boolean;
  }

  // Find all scheduled matches from baganCategories, baganData, or saved storage
  const scheduledList: FlattenedScheduled[] = useMemo(() => {
    let categories = state.baganCategories || state.baganData || [];
    if (!categories || categories.length === 0) {
      try {
        const saved = localStorage.getItem('silat_bagan_data') || localStorage.getItem('silat_bagan_categories');
        if (saved) {
          const parsed = JSON.parse(saved);
          if (Array.isArray(parsed) && parsed.length > 0) {
            categories = parsed;
          }
        }
      } catch (e) {
        console.warn('Failed parsing saved bagan data', e);
      }
    }

    const list: FlattenedScheduled[] = [];
    const curNum = parseInt((state.partai || '').replace(/\D/g, ''), 10);

    categories.forEach(cat => {
      cat.matches.forEach(m => {
        const rawPartai = m.partai || `Partai ${m.id}`;
        let num = parseInt(rawPartai.replace(/\D/g, ''), 10);
        if (isNaN(num)) num = m.id;

        const isFinished = Boolean(m.winner) || histories.some(h => {
          const hNum = parseInt((h.partai || '').replace(/\D/g, ''), 10);
          return hNum === num;
        });
        const isActive = !isNaN(curNum) && curNum === num;

        list.push({
          uniqueId: `${cat.id}_${m.id}`,
          catId: cat.id,
          categoryName: cat.name,
          gender: cat.gender,
          category: {
            id: cat.id,
            name: cat.name,
            gender: cat.gender
          },
          round: m.round,
          match: {
            ...m,
            partai: rawPartai
          },
          num,
          partaiLabel: rawPartai.startsWith('Partai') ? rawPartai : `Partai ${rawPartai}`,
          isFinished,
          isActive
        });
      });
    });

    return list.sort((a, b) => a.num - b.num);
  }, [state.baganCategories, state.baganData, state.partai, histories]);

  const getPrevMatch = () => {
    if (scheduledList.length === 0) return null;
    const curPartaiNum = parseInt(state.partai.replace(/\D/g, ''), 10);
    const currentIndex = scheduledList.findIndex(item => item.num === curPartaiNum);
    if (currentIndex > 0) {
      return scheduledList[currentIndex - 1];
    }
    return null;
  };

  const getNextMatch = () => {
    if (scheduledList.length === 0) return null;
    const curPartaiNum = parseInt(state.partai.replace(/\D/g, ''), 10);
    const currentIndex = scheduledList.findIndex(item => item.num === curPartaiNum);
    if (currentIndex !== -1 && currentIndex + 1 < scheduledList.length) {
      return scheduledList[currentIndex + 1];
    } else if (currentIndex === -1) {
      return scheduledList.find(item => item.num > curPartaiNum) || null;
    }
    return null;
  };

  const nextMatchInfo = getNextMatch();

  const handleExecuteLoadMatch = async (item: FlattenedScheduled) => {
    playBeep('valid');
    const cleanKelas = item.categoryName.replace(/\s*\(.*\)/, '');
    await dispatch('LOAD_BAGAN_MATCH', {
      namaEvent: state.namaEvent || "Kejuaraan Pencak Silat",
      partai: item.match.partai.replace(/Partai\s+/i, '').trim(),
      kelas: cleanKelas,
      gender: item.gender,
      selectedWaktu: state.selectedWaktu || 120,
      activeBaganCategoryId: item.catId,
      activeBaganMatchId: item.match.id,
      atletMerah: {
        nama: item.match.atletMerah.nama || "Sudut Merah",
        kontingen: item.match.atletMerah.kontingen || "SUDUT MERAH"
      },
      atletBiru: {
        nama: item.match.atletBiru.nama || "Sudut Biru",
        kontingen: item.match.atletBiru.kontingen || "SUDUT BIRU"
      }
    });
    setToastMsg(`Partai ${item.match.partai} berhasil dimuat ke gelanggang!`);
    setTimeout(() => setToastMsg(null), 3000);
    setShowPilihPartaiModal(false);
    setConfirmLoadPartai(null);
  };

  const handleLoadMatch = (item: FlattenedScheduled) => {
    // If current match is running or has scores, warn before replacing
    if (state.matchStatus === 'running' || state.matchStatus === 'paused' || state.scores.merah.total > 0 || state.scores.biru.total > 0) {
      setConfirmLoadPartai(item);
    } else {
      handleExecuteLoadMatch(item);
    }
  };

  const handleSelectScheduledMatch = async (uniqueId: string) => {
    const item = scheduledList.find(x => x.uniqueId === uniqueId);
    if (!item) return;
    handleLoadMatch(item);
  };

  const handleLoadCustomPartai = async (partaiStr: string) => {
    if (!partaiStr.trim()) return;
    const cleanNum = partaiStr.replace(/Partai\s*/i, '').trim();
    const num = parseInt(cleanNum, 10);
    const existing = scheduledList.find(x => x.num === num);
    if (existing) {
      handleLoadMatch(existing);
    } else {
      playBeep('click');
      await dispatch('UPDATE_EVENT_INFO', {
        partai: cleanNum.padStart(2, '0')
      });
      setToastMsg(`Nomor partai diatur ke Partai ${cleanNum}`);
      setTimeout(() => setToastMsg(null), 3000);
      setShowPilihPartaiModal(false);
      setCustomPartaiInput('');
    }
  };

  const filteredPartaiList = useMemo(() => {
    return scheduledList.filter(item => {
      if (partaiFilterStatus === 'unfinished' && item.isFinished) return false;
      if (partaiFilterStatus === 'finished' && !item.isFinished) return false;

      if (partaiSearchQuery.trim()) {
        const q = partaiSearchQuery.toLowerCase().trim();
        const numStr = item.num.toString();
        const pStr = item.partaiLabel.toLowerCase();
        const catStr = item.categoryName.toLowerCase();
        const roundStr = (item.round || '').toLowerCase();
        const redName = (item.match.atletMerah.nama || '').toLowerCase();
        const redKt = (item.match.atletMerah.kontingen || '').toLowerCase();
        const blueName = (item.match.atletBiru.nama || '').toLowerCase();
        const blueKt = (item.match.atletBiru.kontingen || '').toLowerCase();

        return (
          numStr.includes(q) ||
          pStr.includes(q) ||
          catStr.includes(q) ||
          roundStr.includes(q) ||
          redName.includes(q) ||
          redKt.includes(q) ||
          blueName.includes(q) ||
          blueKt.includes(q)
        );
      }
      return true;
    });
  }, [scheduledList, partaiFilterStatus, partaiSearchQuery]);

  // Read server state when mounted or updated to set appropriate initial tab
  useEffect(() => {
    if (state.matchStatus === 'running' || state.matchStatus === 'paused' || state.matchStatus === 'babak_habis') {
      if (activeTab === 'config') {
        setActiveTab('control');
      }
    }
  }, [state.matchStatus]);

  const handleUpdateInfo = (fields: Partial<MatchState>) => {
    dispatch('UPDATE_EVENT_INFO', fields);
  };

  const handleUpdateAthlete = (corner: 'merah' | 'biru', field: 'nama' | 'kontingen', val: string) => {
    const payload = corner === 'merah' 
      ? { atletMerah: { ...state.atletMerah, [field]: val } }
      : { atletBiru: { ...state.atletBiru, [field]: val } };
    dispatch('UPDATE_ATHLETES', payload);
  };

  // Turn image select into optimized base64 url
  const handleLogoUpload = async (corner: 'kiri' | 'kanan' | 'tengah', e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    playBeep('click');
    try {
      const base64 = await compressImage(file, 400, 400);
      const key = corner === 'kiri' ? 'logoKiri' : corner === 'kanan' ? 'logoKanan' : 'logoTengah';
      await dispatch('UPLOAD_LOGOS', { [key]: base64 });
      setToastMsg(`Logo ${corner === 'kiri' ? 'Kiri' : corner === 'kanan' ? 'Kanan' : 'Tengah'} berhasil disinkronkan ke Layar Monitor!`);
      setTimeout(() => setToastMsg(null), 3500);
    } catch (err) {
      console.error('Failed to compress/upload logo:', err);
    }
  };

  // CSV Roster Importer
  const handleImportCSV = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    playBeep('click');
    const reader = new FileReader();
    reader.onload = () => {
      const text = reader.result as string;
      const lines = text.split('\n');
      if (lines.length > 1) {
        // Parse CSV headers: event, partido, kelas, gender, atletMerah, kontMerah, atletBiru, kontBiru, waktu
        const firstValueLine = lines[1].split(',');
        if (firstValueLine.length >= 8) {
          const rosters = [{
            namaEvent: firstValueLine[0]?.replace(/"/g, '').trim(),
            partai: firstValueLine[1]?.replace(/"/g, '').trim(),
            kelas: firstValueLine[2]?.replace(/"/g, '').trim(),
            gender: (firstValueLine[3]?.replace(/"/g, '').trim() as any) || 'Putra',
            namaAtletMerah: firstValueLine[4]?.replace(/"/g, '').trim(),
            kontingenMerah: firstValueLine[5]?.replace(/"/g, '').trim(),
            namaAtletBiru: firstValueLine[6]?.replace(/"/g, '').trim(),
            kontingenBiru: firstValueLine[7]?.replace(/"/g, '').trim(),
            waktu: firstValueLine[8]?.replace(/"/g, '').trim() || "120"
          }];
          dispatch('IMPORT_ROSTERS', { rosters });
          alert("CSV Roster berhasil di-import!");
        }
      }
    };
    reader.readAsText(file);
  };

  // Generate blank template CSV
  const downloadTemplateCSV = () => {
    playBeep('click');
    const headers = 'Nama Event,Partai,Kelas,Gender,Nama Atlet Merah,Kontingen Merah,Nama Atlet Biru,Kontingen Biru,Skor Waktu Detik\n';
    const sample = '"Kejuaraan Silat Merdeka","02","B","Putra","Fajar Ramadhan","Banten","Galang Perkasa","Sumatra Barat","120"\n';
    const blob = new Blob([headers + sample], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.setAttribute('href', url);
    a.setAttribute('download', 'silat_roster_template.csv');
    a.click();
  };

  const startMatchGame = () => {
    playBeep('valid');
    dispatch('START_MATCH');
    setActiveTab('control');
  };

  const toggleTimer = () => {
    playBeep('click');
    dispatch('TOGGLE_TIMER');
  };

  // Shortcut Tombol SPASI untuk Mulai / Jeda Timer Tanding
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.code === 'Space' || e.key === ' ' || e.keyCode === 32) {
        const target = e.target as HTMLElement;
        const tagName = target?.tagName?.toLowerCase();
        if (tagName === 'input' || tagName === 'textarea' || target?.isContentEditable) {
          return;
        }
        e.preventDefault();
        toggleTimer();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const resetTimer = () => {
    playBeep('warning');
    dispatch('RESET_TIMER');
  };

  const handleSelectRound = (babakNum: 1 | 2 | 3) => {
    playBeep('click');
    dispatch('SET_BABAK', { babak: babakNum });
  };

  // Next Babak approval
  const handleProceedNextBabak = () => {
    playBeep('click');
    dispatch('APPROVE_NEXT_BABAK');
    setShowNextBabakConfirm(false);
  };

  const resetOrNextPartai = () => {
    playBeep('warning');
    dispatch('RESET_OR_NEXT_PARTAI');
    setActiveTab('config');
  };

  const clearMatchHistoriesList = () => {
    if (confirm("Apakah Anda yakin menghapus semua histori pertandingan?")) {
      playBeep('warning');
      dispatch('CLEAR_HISTORY');
    }
  };

  const handleExportCSV = () => {
    playBeep('click');
    if (histories.length === 0 && !state.partai) {
      alert("Tidak ada data pertandingan yang aktif atau histori yang dapat diekspor.");
      return;
    }

    let csvContent = "\uFEFF"; // BOM for Excel encoding support
    csvContent += "No,Partai,Kelas,Gender,Nama Atlet Merah,Kontingen Merah,Skor Akhir Merah,Nama Atlet Biru,Kontingen Biru,Skor Akhir Biru,Pemenang,Status/Tanggal\n";

    // 1. Export Current Match (if any)
    if (state.partai) {
      const winnerLabel = state.winner === 'merah' ? 'MERAH' : state.winner === 'biru' ? 'BIRU' : 'BELUM SELESAI';
      const row = [
        "AKTIF",
        `"${state.partai}"`,
        `"${state.kelas}"`,
        `"${state.gender}"`,
        `"${state.atletMerah.nama.replace(/"/g, '""')}"`,
        `"${state.atletMerah.kontingen.replace(/"/g, '""')}"`,
        state.scores.merah.total,
        `"${state.atletBiru.nama.replace(/"/g, '""')}"`,
        `"${state.atletBiru.kontingen.replace(/"/g, '""')}"`,
        state.scores.biru.total,
        `"${winnerLabel}"`,
        `"Sedang Berlangsung (${state.matchStatus})"`
      ].join(",");
      csvContent += row + "\n";
    }

    // 2. Export History list
    histories.forEach((h, index) => {
      const winnerLabel = h.winner === 'merah' ? 'MERAH' : h.winner === 'biru' ? 'BIRU' : 'SERI';
      const row = [
        index + 1,
        `"${h.partai}"`,
        `"${h.kelas}"`,
        `"${h.gender}"`,
        `"${h.atletMerah.nama.replace(/"/g, '""')}"`,
        `"${h.atletMerah.kontingen.replace(/"/g, '""')}"`,
        h.skorAkhirMerah,
        `"${h.atletBiru.nama.replace(/"/g, '""')}"`,
        `"${h.atletBiru.kontingen.replace(/"/g, '""')}"`,
        h.skorAkhirBiru,
        `"${winnerLabel}"`,
        `"${h.tanggal}"`
      ].join(",");
      csvContent += row + "\n";
    });

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `Dokumen_Skoring_Silat_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleExportPDF = () => {
    playBeep('click');
    generateRekapitulasiNilaiAkhirPdf({
      state,
      histories,
      tournamentTitle: state.namaEvent,
      gelanggang: state.gelanggang,
      jenisKemenangan: state.winner ? 'Menang Angka' : 'Pertandingan Sedang Berlangsung'
    });
  };

  const handleOpenRekapModal = () => {
    playBeep('click');
    setShowRekapModal(true);
  };

  const handleExportAllPDF = () => {
    playBeep('click');
    generateAllMatchesReportPdf({
      state,
      histories,
      baganData: state.baganData,
      tgrState,
      gelanggang: state.gelanggang,
      tournamentTitle: state.namaEvent
    });
  };

  // Watch state change to show "Lanjut ke Babak Selanjutnya" modal dialogue
  useEffect(() => {
    if (state.matchStatus === 'babak_habis' && state.currentBabak < 3) {
      setShowNextBabakConfirm(true);
    } else {
      setShowNextBabakConfirm(false);
    }
  }, [state.matchStatus, state.currentBabak]);

  const formatTimer = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const closeBack = () => {
    playBeep('click');
    onBack();
  };

  if (showRegistrasiPage) {
    return (
      <RegistrasiDataPanel
        theme={theme}
        state={state}
        dispatch={dispatch}
        onClose={() => {
          playBeep('click');
          setShowRegistrasiPage(false);
        }}
      />
    );
  }

  return (
    <div className={`w-full h-full flex flex-col p-2 sm:p-3 overflow-hidden select-none transition-colors duration-300 relative ${
      theme === 'dark' ? 'text-slate-100 bg-slate-950' : 'text-slate-800 bg-slate-50'
    }`}>
      
      {/* 1. Header Display - Responsive for Mobile, Tablet, Laptop */}
      <div className={`flex flex-col lg:flex-row lg:items-center justify-between gap-2 sm:gap-2.5 pb-2.5 sm:pb-3 border px-2.5 sm:px-4 py-2 rounded-xl shadow-lg flex-shrink-0 transition-all duration-300 ${
        theme === 'dark' 
          ? 'border-slate-805 bg-gradient-to-r from-slate-900/40 via-slate-900 to-slate-900/40 text-slate-100' 
          : 'border-slate-205 bg-gradient-to-r from-slate-200/40 via-slate-200 to-slate-200/40 text-slate-800'
      }`}>
        {/* Top row on mobile / Left group on desktop */}
        <div className="flex items-center justify-between lg:justify-start gap-1.5 sm:gap-2 flex-wrap">
          <div className="flex items-center gap-1.5 sm:gap-2">
            <button 
              onClick={closeBack}
              className={`px-2.5 py-1 text-xs cursor-pointer rounded transition-colors font-bold uppercase ${
                theme === 'dark' 
                  ? 'bg-slate-800 hover:bg-slate-705 border border-slate-700 text-slate-300' 
                  : 'bg-white hover:bg-slate-100 border border-slate-300 text-slate-755'
              }`}
            >
              ← Keluar
            </button>
            <button
              onClick={onToggleTheme}
              className={`p-1.5 rounded transition-colors cursor-pointer ${theme === 'dark' ? 'hover:bg-slate-800 text-amber-400' : 'hover:bg-slate-200 text-slate-600'}`}
              title={theme === 'dark' ? 'Mode Terang' : 'Mode Gelap'}
            >
              {theme === 'dark' ? <Sun className="w-3.5 h-3.5" /> : <Moon className="w-3.5 h-3.5" />}
            </button>

            <ThemePaletteSelector compact={true} />
            
            <button
              onClick={toggleFullscreen}
              className={`p-1.5 rounded transition-colors cursor-pointer ${theme === 'dark' ? 'hover:bg-slate-800 text-slate-300' : 'hover:bg-slate-200 text-slate-600'}`}
              title="Toggle Fullscreen"
            >
              {isFullscreen ? <Minimize2 className="w-3.5 h-3.5" /> : <Maximize2 className="w-3.5 h-3.5" />}
            </button>
            
            <button
              onClick={() => { playBeep('click'); setShowQrModal(true); }}
              className={`px-2 sm:px-2.5 py-1 text-[11px] sm:text-xs cursor-pointer rounded transition-colors font-bold uppercase flex items-center gap-1 ${
                theme === 'dark' 
                  ? 'bg-indigo-950/40 hover:bg-indigo-900/60 border border-indigo-900 text-indigo-300' 
                  : 'bg-indigo-50 hover:bg-indigo-100 border border-indigo-200 text-indigo-700'
              }`}
              title="Sambungkan Device / QR Barcode"
            >
              <QrCode className="w-3.5 h-3.5 text-indigo-400" />
              <span className="hidden sm:inline">Barcode System</span>
            </button>

            <div className={`hidden sm:block h-4 w-[1px] ${theme === 'dark' ? 'bg-slate-800' : 'bg-slate-300'}`} />
            <div className="flex items-center gap-1.5">
              <div className="w-6 h-6 sm:w-7 sm:h-7 rounded-full overflow-hidden border border-purple-500/70 bg-slate-950 flex items-center justify-center p-0.5 shadow-[0_0_10px_rgba(168,85,247,0.4)] shrink-0">
                <img
                  src={sekretarisImg}
                  alt="Sekretaris Utama"
                  className="w-full h-full object-contain rounded-full"
                  referrerPolicy="no-referrer"
                />
              </div>
              <span className={`text-[11px] sm:text-xs font-mono font-black uppercase tracking-wider truncate max-w-[120px] sm:max-w-none ${theme === 'dark' ? 'text-slate-200' : 'text-slate-700'}`}>
                SEKRETARIS
              </span>
            </div>
          </div>

          {/* Quick Select Partai for Mobile/Tablet */}
          <div className="flex lg:hidden items-center gap-1">
            <button
              type="button"
              onClick={() => {
                playBeep('click');
                setShowPilihPartaiModal(true);
              }}
              title="Pilih Partai Pertandingan"
              className="px-2.5 py-1 rounded-lg font-black text-[11px] uppercase flex items-center gap-1 bg-gradient-to-r from-amber-500 to-yellow-500 text-slate-950 shadow-sm border border-amber-300/80 cursor-pointer active:scale-95"
            >
              <ListOrdered className="w-3 h-3 text-slate-950" />
              <span>P{state.partai || '01'}</span>
            </button>
          </div>
        </div>

        {/* Tab Selection (Smooth Horizontal Scroll for Mobile / HP & Tablet) */}
        <div className={`w-full lg:w-auto overflow-x-auto no-scrollbar flex items-center gap-1 p-1 rounded-lg border shrink-0 scroll-smooth ${
          theme === 'dark' ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-250'
        }`}>
          <button
            onClick={() => { playBeep('click'); setShowRegistrasiPage(true); }}
            className="px-2.5 sm:px-3 py-1 text-[11px] sm:text-xs uppercase font-black cursor-pointer rounded transition-all bg-emerald-600 text-white shadow shadow-emerald-990/40 hover:bg-emerald-500 hover:scale-105 active:scale-95 duration-250 whitespace-nowrap shrink-0"
          >
            🏆 REGISTRASI DATA
          </button>
          <div className={`h-4 w-[1px] ${theme === 'dark' ? 'bg-slate-800' : 'bg-slate-300'} mx-0.5 shrink-0`} />
          <button
            onClick={() => { playBeep('click'); setActiveTab('config'); }}
            className={`px-2.5 sm:px-3 py-1 text-[11px] sm:text-xs uppercase font-extrabold cursor-pointer rounded transition-all whitespace-nowrap shrink-0 ${activeTab === 'config' ? 'bg-emerald-600 text-white shadow shadow-emerald-990/40' : 'text-slate-400 hover:text-slate-600'}`}
          >
            Registrasi Atlet
          </button>
          <button
            onClick={() => { playBeep('click'); setActiveTab('control'); }}
            className={`px-2.5 sm:px-3 py-1 text-[11px] sm:text-xs uppercase font-extrabold cursor-pointer rounded transition-all whitespace-nowrap shrink-0 ${activeTab === 'control' ? 'bg-emerald-600 text-white shadow shadow-emerald-990/40' : 'text-slate-400 hover:text-slate-600'}`}
          >
            Kontrol Partai
          </button>
          <button
            onClick={() => { playBeep('click'); setActiveTab('events'); }}
            className={`px-2.5 sm:px-3 py-1 text-[11px] sm:text-xs uppercase font-black cursor-pointer rounded transition-all flex items-center gap-1.5 whitespace-nowrap shrink-0 ${
              activeTab === 'events'
                ? 'bg-gradient-to-r from-emerald-600 to-teal-600 text-white shadow shadow-emerald-990/40 scale-105'
                : 'bg-emerald-950/30 text-emerald-400 border border-emerald-800/40 hover:bg-emerald-900/40 hover:text-white'
            }`}
            title="Buka Log Peristiwa Pertandingan Real-Time (Jatuhan, Pelanggaran, VAR, Skor)"
          >
            <Activity className="w-3.5 h-3.5 text-emerald-400 animate-pulse" />
            <span>⚡ EVENT LOG</span>
          </button>
          <button
            onClick={() => { playBeep('click'); setActiveTab('jadwal'); }}
            className={`px-2.5 sm:px-3 py-1 text-[11px] sm:text-xs uppercase font-extrabold cursor-pointer rounded transition-all whitespace-nowrap shrink-0 ${activeTab === 'jadwal' ? 'bg-emerald-600 text-white shadow shadow-emerald-990/40' : 'text-slate-400 hover:text-slate-600'}`}
          >
            📅 Cetak Jadwal
          </button>
          <button
            onClick={handleOpenRekapModal}
            className={`px-2.5 sm:px-3 py-1 text-[11px] sm:text-xs uppercase font-black cursor-pointer rounded transition-all flex items-center gap-1.5 whitespace-nowrap shrink-0 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-yellow-400 text-slate-950 shadow-md shadow-amber-950/30 active:scale-95`}
            title="Cetak Formulir Rekapitulasi Nilai Akhir Pertandingan Resmi (PDF)"
          >
            <Printer className="w-3.5 h-3.5 text-slate-950" />
            <span>📄 CETAK REKAP NILAI</span>
          </button>
          <div className={`h-4 w-[1px] ${theme === 'dark' ? 'bg-slate-800' : 'bg-slate-300'} mx-0.5 shrink-0`} />
          <button
            onClick={() => { playBeep('click'); setActiveTab('seni'); }}
            className={`px-2.5 sm:px-3 py-1 text-[11px] sm:text-xs uppercase font-black cursor-pointer rounded transition-all flex items-center gap-1.5 whitespace-nowrap shrink-0 ${
              activeTab === 'seni'
                ? 'bg-gradient-to-r from-purple-600 via-indigo-600 to-amber-600 text-white shadow-lg shadow-purple-950/50 scale-105'
                : 'bg-purple-950/30 text-purple-300 border border-purple-800/40 hover:bg-purple-900/40 hover:text-white'
            }`}
            title="Pengaturan Seni: 3-4 Peserta per Partai / Sistem Pool"
          >
            <span className="text-amber-400">🥋</span>
            <span>SENI POOL</span>
          </button>
          <div className={`h-4 w-[1px] ${theme === 'dark' ? 'bg-slate-800' : 'bg-slate-300'} mx-0.5 shrink-0`} />
          <button
            onClick={() => { playBeep('click'); setShowLogoModal(true); }}
            className={`px-2.5 sm:px-3 py-1 text-[11px] sm:text-xs uppercase font-black cursor-pointer rounded transition-all flex items-center gap-1.5 whitespace-nowrap shrink-0 ${
              state.logoKiri || state.logoKanan
                ? 'bg-amber-600/30 text-amber-300 border border-amber-500/50 hover:bg-amber-500/40'
                : 'bg-slate-800 text-slate-300 border border-slate-700 hover:bg-slate-700'
            }`}
            title="Ubah Logo Layar Monitor (Kiri & Kanan)"
          >
            <span>🖼️</span>
            <span>LOGO MONITOR</span>
            {(state.logoKiri || state.logoKanan) && (
              <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
            )}
          </button>
        </div>

        {/* Match Tracker right aligned (visible on lg+) */}
        <div className={`hidden lg:flex text-right text-[11px] font-mono items-center gap-2 shrink-0 ${theme === 'dark' ? 'text-slate-400' : 'text-slate-500'}`}>
          {/* Quick Prev / Next Stepper */}
          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={() => {
                const prev = getPrevMatch();
                if (prev) handleLoadMatch(prev);
              }}
              disabled={!getPrevMatch()}
              title={getPrevMatch() ? `Partai Sebelumnya: P${getPrevMatch()?.num}` : 'Tidak ada partai sebelumnya'}
              className="p-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 disabled:opacity-30 disabled:pointer-events-none text-slate-300 border border-slate-800 cursor-pointer transition-all active:scale-95"
            >
              <ChevronLeft className="w-3.5 h-3.5" />
            </button>
            <button
              type="button"
              onClick={() => {
                const next = getNextMatch();
                if (next) handleLoadMatch(next);
              }}
              disabled={!getNextMatch()}
              title={getNextMatch() ? `Partai Selanjutnya: P${getNextMatch()?.num}` : 'Tidak ada partai selanjutnya'}
              className="p-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 disabled:opacity-30 disabled:pointer-events-none text-slate-300 border border-slate-800 cursor-pointer transition-all active:scale-95"
            >
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Tombol PILIH PARTAI Header Button */}
          <button
            type="button"
            onClick={() => {
              playBeep('click');
              setShowPilihPartaiModal(true);
            }}
            title="Klik untuk membuka daftar dan memilih partai pertandingan"
            className="px-3 py-1.5 rounded-xl font-black text-xs uppercase flex items-center gap-1.5 bg-gradient-to-r from-amber-500 via-yellow-500 to-amber-600 hover:from-amber-400 hover:to-yellow-400 text-slate-950 shadow-md shadow-amber-950/40 cursor-pointer transition-all active:scale-95 border border-amber-300/80"
          >
            <ListOrdered className="w-3.5 h-3.5 text-slate-950" />
            <span>PILIH PARTAI</span>
            <span className="bg-slate-950/20 text-slate-950 px-1.5 py-0.5 rounded text-[11px] font-mono font-black">
              P{state.partai || '01'}
            </span>
          </button>

          <div className="hidden xl:flex items-center gap-1.5">
            <span className="text-slate-500">|</span>
            <span className="text-slate-400 text-[10px]">KELAS:</span>
            <span className={`font-bold ${theme === 'dark' ? 'text-white' : 'text-slate-800'}`}>{state.kelas || '-'}</span>
          </div>
        </div>
      </div>

      {/* 2. Main Tab Body Contents */}
      {activeTab === 'config' ? (
        
        /* ATLET REGISTRATION GRID CONFIG */
        <div className="flex-1 my-2 min-h-0 overflow-y-auto custom-scrollbar pr-1 pb-6 overscroll-contain">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-3 bg-slate-900/10 p-3 rounded-xl border border-slate-900 min-h-full">
            
            {/* LEFT: Core Match Metadata fields (Col 4 on desktop) */}
            <div className="lg:col-span-4 flex flex-col gap-2 bg-slate-900/40 p-3 rounded-lg border border-slate-800/80">
            <h4 className="text-[11px] font-black uppercase text-emerald-400 tracking-wider flex items-center gap-1.5 border-b border-slate-800 pb-1.5">
              <span>●</span> Data Tournament & Partai
            </h4>

            <div>
              <label className="block text-[10px] text-slate-500 font-mono uppercase font-bold mb-0.5">Nama Event</label>
              <input 
                type="text" 
                value={state.namaEvent}
                onChange={(e) => handleUpdateInfo({ namaEvent: e.target.value })}
                className="w-full text-xs bg-slate-900 border border-slate-800 focus:border-emerald-500 px-2 py-1.5 rounded-md outline-none text-white font-bold"
              />
            </div>

            {/* Box Pemilihan Partai Terjadwal */}
            <div className="p-3 bg-slate-950/80 rounded-xl border border-emerald-500/40 shadow-inner flex flex-col gap-2">
              <div className="flex items-center justify-between">
                <label className="text-[10px] text-emerald-400 font-mono uppercase font-black flex items-center gap-1.5">
                  <ListOrdered className="w-4 h-4 text-emerald-400" />
                  <span>PILIH PARTAI PERTANDINGAN</span>
                </label>
                <span className="text-[10px] font-mono text-slate-400 font-bold bg-slate-900 px-2 py-0.5 rounded border border-slate-800">
                  {scheduledList.length} Partai
                </span>
              </div>

              <button
                type="button"
                onClick={() => {
                  playBeep('click');
                  setShowPilihPartaiModal(true);
                }}
                className="w-full py-2.5 px-3 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-black text-xs uppercase rounded-lg shadow-md flex items-center justify-center gap-2 cursor-pointer transition-all active:scale-[0.98]"
              >
                <Search className="w-4 h-4 text-emerald-200" />
                <span>Buka Daftar & Pilih Partai</span>
              </button>

              {scheduledList.length > 0 && (
                <div className="flex flex-col gap-1 mt-0.5">
                  <span className="text-[9px] font-mono uppercase text-slate-400 font-bold">Pilih Cepat dari Dropdown:</span>
                  <select
                    value={scheduledList.find(x => x.num === parseInt(state.partai.replace(/\D/g, ''), 10))?.uniqueId || ""}
                    onChange={(e) => {
                      if (e.target.value) {
                        const target = scheduledList.find(x => x.uniqueId === e.target.value);
                        if (target) handleLoadMatch(target);
                      }
                    }}
                    className="w-full text-xs bg-slate-900 border border-emerald-900/60 focus:border-emerald-500 px-2 py-1.5 rounded-md outline-none text-emerald-300 font-bold font-mono"
                  >
                    <option value="" className="text-slate-500 bg-slate-950">-- Pilih Dari Dropdown --</option>
                    {scheduledList.map((item, idx) => (
                      <option key={`${item.uniqueId}__${idx}`} value={item.uniqueId} className="text-slate-200 bg-slate-950">
                        P{item.num.toString().padStart(2, '0')} - {item.categoryName.replace(/\s*\(.*\)/, '')} ({item.match.atletMerah.nama || 'TBD'} vs {item.match.atletBiru.nama || 'TBD'}) {item.isFinished ? '✓' : ''}
                      </option>
                    ))}
                  </select>
                </div>
              )}
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-[10px] text-slate-500 font-mono uppercase font-bold mb-0.5">Partai No</label>
                <input 
                  type="text"
                  value={state.partai}
                  onChange={(e) => handleUpdateInfo({ partai: e.target.value })}
                  className="w-full text-xs bg-slate-900 border border-slate-800 focus:border-emerald-500 px-2 py-1.5 rounded-md outline-none text-white font-bold font-mono"
                />
              </div>
              <div>
                <label className="block text-[10px] text-slate-500 font-mono uppercase font-bold mb-0.5">Kelas/Nomor</label>
                <input 
                  type="text"
                  value={state.kelas}
                  onChange={(e) => handleUpdateInfo({ kelas: e.target.value })}
                  className="w-full text-xs bg-slate-900 border border-slate-800 focus:border-emerald-500 px-2 py-1.5 rounded-md outline-none text-white font-bold"
                />
              </div>
            </div>

            {/* Gender Toggle putra/putri */}
            <div>
              <label className="block text-[10px] text-slate-500 font-mono uppercase font-bold mb-1">Kategori Gender</label>
              <div className="grid grid-cols-2 gap-1 bg-slate-950 p-1 border border-slate-800 rounded-md">
                <button
                  type="button"
                  onClick={() => { playBeep('click'); handleUpdateInfo({ gender: 'Putra' }); }}
                  className={`py-1 cursor-pointer rounded font-black text-xs uppercase ${state.gender === 'Putra' ? 'bg-emerald-600 text-white shadow' : 'text-slate-400 hover:text-slate-200'}`}
                >
                  Putra
                </button>
                <button
                  type="button"
                  onClick={() => { playBeep('click'); handleUpdateInfo({ gender: 'Putri' }); }}
                  className={`py-1 cursor-pointer rounded font-black text-xs uppercase ${state.gender === 'Putri' ? 'bg-emerald-600 text-white shadow' : 'text-slate-400 hover:text-slate-200'}`}
                >
                  Putri
                </button>
              </div>
            </div>

            {/* Custom Input Durasi Babak */}
            <div className="bg-slate-900/30 p-2.5 rounded-lg border border-slate-800/80">
              <label className="block text-[10px] text-slate-400 font-mono uppercase font-bold mb-2">
                Durasi Waktu Babak
              </label>
              
              {/* Preset buttons */}
              <div className="grid grid-cols-4 gap-1 mb-2.5">
                {[60, 90, 120, 180].map((sec) => {
                  const m = Math.floor(sec / 60);
                  const s = sec % 60;
                  const label = `${m}:${s === 0 ? '00' : s}`;
                  return (
                    <button
                      key={sec}
                      type="button"
                      onClick={() => {
                        playBeep('click');
                        handleUpdateInfo({ selectedWaktu: sec });
                      }}
                      className={`py-1 cursor-pointer rounded border text-[10px] font-bold font-mono transition-all ${
                        state.selectedWaktu === sec
                          ? 'bg-emerald-600/20 border-emerald-500 text-emerald-400 shadow-sm'
                          : 'bg-slate-900 border-slate-800 hover:bg-slate-850 text-slate-400'
                      }`}
                    >
                      {label}
                    </button>
                  );
                })}
              </div>

              {/* Advanced minute/second stepper */}
              <div className="flex items-center gap-2">
                {/* Menit Stepper */}
                <div className="flex-1">
                  <span className="block text-[8px] text-slate-500 font-mono uppercase mb-0.5">Menit</span>
                  <div className="flex items-center bg-slate-950 border border-slate-800 rounded-md p-0.5">
                    <button
                      type="button"
                      onClick={() => {
                        playBeep('click');
                        const curM = Math.floor(state.selectedWaktu / 60);
                        const curS = state.selectedWaktu % 60;
                        const newM = Math.max(0, curM - 1);
                        handleUpdateInfo({ selectedWaktu: newM * 60 + curS });
                      }}
                      className="px-2 py-0.5 text-xs font-black text-slate-400 hover:text-white hover:bg-slate-900 rounded cursor-pointer"
                    >
                      -
                    </button>
                    <input
                      type="number"
                      min={0}
                      max={59}
                      value={Math.floor(state.selectedWaktu / 60)}
                      onChange={(e) => {
                        const m = Math.max(0, parseInt(e.target.value, 10) || 0);
                        const s = state.selectedWaktu % 60;
                        handleUpdateInfo({ selectedWaktu: m * 60 + s });
                      }}
                      className="w-full bg-transparent text-center text-xs font-bold font-mono text-white outline-none [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                    />
                    <button
                      type="button"
                      onClick={() => {
                        playBeep('click');
                        const curM = Math.floor(state.selectedWaktu / 60);
                        const curS = state.selectedWaktu % 60;
                        const newM = curM + 1;
                        handleUpdateInfo({ selectedWaktu: newM * 60 + curS });
                      }}
                      className="px-2 py-0.5 text-xs font-black text-slate-400 hover:text-white hover:bg-slate-900 rounded cursor-pointer"
                    >
                      +
                    </button>
                  </div>
                </div>

                {/* Separator */}
                <span className="text-slate-600 font-mono font-bold mt-3">:</span>

                {/* Detik Stepper */}
                <div className="flex-1">
                  <span className="block text-[8px] text-slate-500 font-mono uppercase mb-0.5">Detik</span>
                  <div className="flex items-center bg-slate-950 border border-slate-800 rounded-md p-0.5">
                    <button
                      type="button"
                      onClick={() => {
                        playBeep('click');
                        const curM = Math.floor(state.selectedWaktu / 60);
                        const curS = state.selectedWaktu % 60;
                        const newS = (curS - 5 + 60) % 60;
                        handleUpdateInfo({ selectedWaktu: curM * 60 + newS });
                      }}
                      className="px-2 py-0.5 text-xs font-black text-slate-400 hover:text-white hover:bg-slate-900 rounded cursor-pointer"
                    >
                      -
                    </button>
                    <input
                      type="number"
                      min={0}
                      max={59}
                      value={state.selectedWaktu % 60}
                      onChange={(e) => {
                        const s = Math.max(0, Math.min(59, parseInt(e.target.value, 10) || 0));
                        const m = Math.floor(state.selectedWaktu / 60);
                        handleUpdateInfo({ selectedWaktu: m * 60 + s });
                      }}
                      className="w-full bg-transparent text-center text-xs font-bold font-mono text-white outline-none [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                    />
                    <button
                      type="button"
                      onClick={() => {
                        playBeep('click');
                        const curM = Math.floor(state.selectedWaktu / 60);
                        const curS = state.selectedWaktu % 60;
                        const newS = (curS + 5) % 60;
                        handleUpdateInfo({ selectedWaktu: curM * 60 + newS });
                      }}
                      className="px-2 py-0.5 text-xs font-black text-slate-400 hover:text-white hover:bg-slate-900 rounded cursor-pointer"
                    >
                      +
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* Full-Featured Logo Manager Card for Layar Monitor */}
            <div className="border-t border-slate-800 pt-3 mt-1 bg-slate-950/40 p-3 rounded-lg border border-slate-800/60">
              <div className="flex items-center justify-between mb-2">
                <span className="block text-[11px] text-amber-400 font-mono uppercase font-black tracking-wider flex items-center gap-1.5">
                  <span>🖼️</span> LOGO LAYAR MONITOR
                </span>
                {(state.logoKiri || state.logoKanan || state.logoTengah) && (
                  <button
                    type="button"
                    onClick={() => {
                      playBeep('warning');
                      dispatch('UPLOAD_LOGOS', { logoKiri: null, logoKanan: null, logoTengah: null });
                      setToastMsg('Semua logo telah dikembalikan ke logo IPSI bawaan!');
                      setTimeout(() => setToastMsg(null), 3500);
                    }}
                    className="text-[9px] text-red-400 hover:text-red-300 font-bold uppercase tracking-wider bg-red-950/40 border border-red-800/40 px-2 py-0.5 rounded cursor-pointer transition-colors"
                  >
                    Reset ke IPSI
                  </button>
                )}
              </div>

              <div className="grid grid-cols-2 gap-2.5">
                {/* Logo Kiri Card */}
                <div className="flex flex-col items-center bg-slate-900/80 p-2.5 rounded-xl border border-slate-800 text-center">
                  <span className="text-[10px] font-bold text-slate-400 uppercase mb-1.5">Logo Kiri</span>
                  <div className="w-16 h-16 rounded-xl bg-white border-2 border-slate-300 flex items-center justify-center p-1 overflow-hidden shadow-inner mb-2">
                    {state.logoKiri ? (
                      <img src={state.logoKiri} alt="Logo Kiri" className="w-full h-full object-contain" />
                    ) : (
                      <div className="flex flex-col items-center justify-center text-slate-400">
                        <span className="text-xl">🛡️</span>
                        <span className="text-[8px] font-black text-slate-600">IPSI</span>
                      </div>
                    )}
                  </div>
                  <div className="flex flex-col w-full gap-1">
                    <button
                      type="button"
                      onClick={() => { playBeep('click'); fileInputKiriRef.current?.click(); }}
                      className="w-full py-1 px-1.5 cursor-pointer bg-blue-600 hover:bg-blue-500 text-white font-bold text-[10px] uppercase rounded tracking-wider transition-all shadow-sm"
                    >
                      {state.logoKiri ? 'Ganti Logo' : 'Unggah Logo'}
                    </button>
                    {state.logoKiri && (
                      <button
                        type="button"
                        onClick={() => {
                          playBeep('click');
                          dispatch('UPLOAD_LOGOS', { logoKiri: null });
                          setToastMsg('Logo kiri dikembalikan ke logo IPSI bawaan!');
                          setTimeout(() => setToastMsg(null), 3500);
                        }}
                        className="w-full py-0.5 text-[8px] text-slate-400 hover:text-red-400 font-bold uppercase transition-colors"
                      >
                        Reset ke IPSI
                      </button>
                    )}
                  </div>
                  <input
                    type="file"
                    ref={fileInputKiriRef}
                    accept="image/*"
                    onChange={(e) => handleLogoUpload('kiri', e)}
                    className="hidden"
                  />
                </div>

                {/* Logo Kanan Card */}
                <div className="flex flex-col items-center bg-slate-900/80 p-2.5 rounded-xl border border-slate-800 text-center">
                  <span className="text-[10px] font-bold text-slate-400 uppercase mb-1.5">Logo Kanan</span>
                  <div className="w-16 h-16 rounded-xl bg-white border-2 border-slate-300 flex items-center justify-center p-1 overflow-hidden shadow-inner mb-2">
                    {state.logoKanan ? (
                      <img src={state.logoKanan} alt="Logo Kanan" className="w-full h-full object-contain" />
                    ) : (
                      <div className="flex flex-col items-center justify-center text-slate-400">
                        <span className="text-xl">🛡️</span>
                        <span className="text-[8px] font-black text-slate-600">IPSI</span>
                      </div>
                    )}
                  </div>
                  <div className="flex flex-col w-full gap-1">
                    <button
                      type="button"
                      onClick={() => { playBeep('click'); fileInputKananRef.current?.click(); }}
                      className="w-full py-1 px-1.5 cursor-pointer bg-blue-600 hover:bg-blue-500 text-white font-bold text-[10px] uppercase rounded tracking-wider transition-all shadow-sm"
                    >
                      {state.logoKanan ? 'Ganti Logo' : 'Unggah Logo'}
                    </button>
                    {state.logoKanan && (
                      <button
                        type="button"
                        onClick={() => {
                          playBeep('click');
                          dispatch('UPLOAD_LOGOS', { logoKanan: null });
                          setToastMsg('Logo kanan dikembalikan ke logo IPSI bawaan!');
                          setTimeout(() => setToastMsg(null), 3500);
                        }}
                        className="w-full py-0.5 text-[8px] text-slate-400 hover:text-red-400 font-bold uppercase transition-colors"
                      >
                        Reset ke IPSI
                      </button>
                    )}
                  </div>
                  <input
                    type="file"
                    ref={fileInputKananRef}
                    accept="image/*"
                    onChange={(e) => handleLogoUpload('kanan', e)}
                    className="hidden"
                  />
                </div>
              </div>

              <p className="text-[9px] text-slate-400 font-mono mt-2 text-center">
                *Logo otomatis tampil di sudut kiri dan kanan atas Layar Monitor Tanding secara real-time.
              </p>
            </div>
          </div>

          {/* MIDDLE + RIGHT: Athlete inputs & Roster Import options (Col 8 on desktop) */}
          <div className="lg:col-span-8 flex flex-col gap-3 min-h-0">
            
            {/* Athlete detail configuration cards */}
            <div className="grid grid-cols-2 gap-3">
              {/* SUDUT BIRU FIELD CONFIG */}
              <div className="bg-gradient-to-b from-blue-950/20 to-slate-900/55 p-3 rounded-lg border border-blue-900/40">
                <span className="text-[9px] font-black uppercase text-cyan-400 tracking-wider">REGISTRASI SUDUT BIRU</span>
                <div className="mt-2.5 flex flex-col gap-1.5">
                  <div>
                    <label className="block text-[9px] text-slate-500 uppercase font-mono">Nama Atlet</label>
                    <input 
                      type="text" 
                      value={state.atletBiru.nama}
                      onChange={(e) => handleUpdateAthlete('biru', 'nama', e.target.value)}
                      className="w-full text-xs bg-slate-900/80 border border-slate-800 px-2 py-1.5 rounded-md focus:border-blue-500 outline-none font-bold mt-0.5 text-white"
                      placeholder="Nama Lengkap"
                    />
                  </div>
                  <div>
                    <label className="block text-[9px] text-slate-500 uppercase font-mono">Kontingen / Pengda</label>
                    <input 
                      type="text" 
                      value={state.atletBiru.kontingen}
                      onChange={(e) => handleUpdateAthlete('biru', 'kontingen', e.target.value)}
                      className="w-full text-xs bg-slate-900/80 border border-slate-800 px-2 py-1.5 rounded-md focus:border-blue-500 outline-none font-bold mt-0.5 text-white"
                      placeholder="Kontingen"
                    />
                  </div>
                </div>
              </div>

              {/* SUDUT MERAH FIELD CONFIG */}
              <div className="bg-gradient-to-b from-red-950/20 to-slate-900/55 p-3 rounded-lg border border-red-900/40">
                <span className="text-[9px] font-black uppercase text-red-500 tracking-wider">REGISTRASI SUDUT MERAH</span>
                <div className="mt-2.5 flex flex-col gap-1.5">
                  <div>
                    <label className="block text-[9px] text-slate-500 uppercase font-mono">Nama Atlet</label>
                    <input 
                      type="text" 
                      value={state.atletMerah.nama}
                      onChange={(e) => handleUpdateAthlete('merah', 'nama', e.target.value)}
                      className="w-full text-xs bg-slate-900/80 border border-slate-800 px-2 py-1.5 rounded-md focus:border-red-500 outline-none font-bold mt-0.5 text-white"
                      placeholder="Nama Lengkap"
                    />
                  </div>
                  <div>
                    <label className="block text-[9px] text-slate-500 uppercase font-mono">Kontingen / Pengda</label>
                    <input 
                      type="text" 
                      value={state.atletMerah.kontingen}
                      onChange={(e) => handleUpdateAthlete('merah', 'kontingen', e.target.value)}
                      className="w-full text-xs bg-slate-900/80 border border-slate-800 px-2 py-1.5 rounded-md focus:border-red-500 outline-none font-bold mt-0.5 text-white"
                      placeholder="Kontingen"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Mass CSV roster setup panel */}
            <div className="bg-slate-900/30 p-3 rounded-lg border border-slate-800/70 flex flex-col justify-between">
              <div>
                <h5 className="text-[10px] font-black uppercase text-slate-300 tracking-wider">Import Roster Atlit Secara Massal</h5>
                <p className="text-[10px] text-slate-500 mt-0.5">
                  Upload file roster CSV untuk dengan mudah mengonfigurasi rincian partai dan nama atlet sekaligus secara cepat.
                </p>
              </div>

              <div className="flex gap-2.5 mt-2.5">
                <button
                  onClick={downloadTemplateCSV}
                  className="flex-1 py-1.5 bg-slate-900 hover:bg-slate-800 border border-slate-800 cursor-pointer text-xs font-bold uppercase rounded-lg text-slate-300 flex items-center justify-center gap-1.5 transition-all w-full"
                >
                  <Download className="w-3.5 h-3.5" />
                  Template CSV
                </button>

                <label className="flex-1 py-1.5 bg-slate-900 hover:bg-slate-800 border border-slate-800 cursor-pointer text-xs font-bold uppercase rounded-lg text-slate-300 flex items-center justify-center gap-1.5 transition-all text-center w-full">
                  <Upload className="w-3.5 h-3.5 text-emerald-400" />
                  Upload CSV
                  <input
                    type="file"
                    accept=".csv"
                    onChange={handleImportCSV}
                    className="hidden"
                  />
                </label>
              </div>
            </div>

            {/* Match History management */}
            <div className="bg-slate-950/20 p-2 rounded-lg border border-slate-900 max-h-[7rem] overflow-y-auto">
              <div className="flex justify-between items-center mb-1.5">
                <span className="text-[9px] font-black uppercase text-slate-400 tracking-wide font-mono">PERSISTED HISTORY LOGS ({histories.length})</span>
                {histories.length > 0 && (
                  <button 
                    onClick={clearMatchHistoriesList}
                    className="p-1 text-[9px] font-bold text-red-500 hover:text-red-400 flex items-center gap-1 bg-red-950/20 rounded cursor-pointer border border-red-900/30 font-mono text-[9px]"
                  >
                    <Trash2 className="w-3 h-3" /> Hapus History
                  </button>
                )}
              </div>
              
              {histories.length === 0 ? (
                <div className="text-center text-[10px] py-3 text-slate-600 font-mono italic">Tidak ada pertarungan yang terekam.</div>
              ) : (
                <div className="flex flex-col gap-1">
                  {histories.map((h, i) => (
                    <div key={`${h.id || 'hist'}__${i}`} className="text-[10px] font-mono flex justify-between bg-slate-900/40 px-2 py-1 rounded border border-slate-800">
                      <span>P{h.partai} - {h.kelas} - {h.gender}</span>
                      <span className="text-slate-400">{h.atletMerah.nama} ({h.skorAkhirMerah}) vs {h.atletBiru.nama} ({h.skorAkhirBiru})</span>
                      <span className="font-bold text-emerald-400">PEMENANG: {h.winner === 'merah' ? 'MERAH' : h.winner === 'biru' ? 'BIRU' : 'SERI'}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Core Action Button: Mulai Pertandingan */}
            <button
              onClick={startMatchGame}
              className="w-full cursor-pointer py-3.5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 font-black tracking-widest text-white text-xs uppercase rounded-xl shadow-lg shadow-emerald-950/30 active:scale-[0.98] transition-all flex items-center justify-center gap-1.5"
            >
              <Power className="w-4 h-4" />
              Mulai Pertandingan (Luncurkan Engine)
            </button>
          </div>

        </div>
      </div>
      ) : activeTab === 'control' ? (
        
        /* MATCH CONTROL PANEL ACTIVE DASHBOARD */
        <div className="flex-1 my-2 min-h-0 overflow-y-auto custom-scrollbar pr-1 pb-6 overscroll-contain">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-3 min-h-full">
            
            {/* LEFT COLUMN: Controls, Round selectors, timers (Col 7 on desktop) */}
            <div className="lg:col-span-7 flex flex-col gap-3 bg-slate-900/40 p-4 rounded-xl border border-slate-800/80">
            
            {/* Timer Giant Display Board */}
            <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 text-center relative overflow-hidden shadow-inner">
              <span className="text-[9px] font-black text-slate-500 uppercase font-mono tracking-widest">DIGITAL SHOCK TIMER</span>
              
              <div className="text-[4.5rem] leading-none font-black text-transparent bg-clip-text bg-gradient-to-b from-teal-400 to-cyan-300 font-mono my-2 tracking-wide filter drop-shadow">
                {formatTimer(state.timerSeconds)}
              </div>

              {/* Status flag */}
              <div className="inline-flex items-center gap-1.5 bg-slate-900/80 px-2.5 py-1 rounded-full text-[10px] font-mono border border-slate-800 text-slate-300">
                <span className={`w-2 h-2 rounded-full ${state.timerActive ? 'bg-green-500 animate-ping' : 'bg-amber-500'}`} />
                <span className="font-bold uppercase">{state.matchStatus}</span>
              </div>
            </div>

            {/* Main Action Controllers: Play, Pause, Reset */}
            <div className="flex gap-3 my-3">
              <button
                onClick={toggleTimer}
                title="Tekan Spasi (Space) pada keyboard untuk Mulai / Jeda Timer"
                className={`flex-1 py-3 px-3 cursor-pointer rounded-xl font-bold text-xs uppercase tracking-widest text-white flex items-center justify-center gap-2 transition-all shadow ${
                  state.timerActive 
                    ? 'bg-amber-600 hover:bg-amber-500 shadow-lg shadow-amber-950/30' 
                    : 'bg-emerald-600 hover:bg-emerald-500 shadow-lg shadow-emerald-950/30'
                }`}
              >
                <Play className={`w-4 h-4 ${state.timerActive ? 'hidden' : 'block'}`} />
                <span className="text-white font-extrabold">{state.timerActive ? 'Jeda Pertandingan (PAUSE)' : 'JALANKAN WAKTU (PLAY)'}</span>
                <span className="text-[10px] font-mono font-bold px-1.5 py-0.5 rounded bg-black/30 text-white/90 border border-white/20">
                  SPASI
                </span>
              </button>

              <button
                onClick={resetTimer}
                className="px-6 py-3 cursor-pointer bg-slate-900 border border-slate-800 hover:bg-slate-800 rounded-xl text-xs font-bold uppercase tracking-wider text-slate-300 flex items-center justify-center gap-1.5"
                title="Reset timer ke durasi awal"
              >
                <RotateCcw className="w-4 h-4 text-slate-400" />
                Reset
              </button>
            </div>

            {/* Official Tournament Round selectors */}
            <div className="bg-slate-950/60 p-3 rounded-lg border border-slate-800">
              <span className="block text-[10px] text-slate-500 font-mono uppercase font-black tracking-widest mb-2.5">AKTIFKAN BABAK PERTANDINGAN</span>
              
              <div className="grid grid-cols-3 gap-2">
                {[1, 2, 3].map((num) => (
                  <button
                    key={num}
                    onClick={() => handleSelectRound(num as any)}
                    className={`py-2 px-4 cursor-pointer text-xs font-black rounded-lg transition-all border ${
                      state.currentBabak === num 
                        ? 'bg-gradient-to-r from-emerald-600 to-teal-600 border-emerald-500 text-white shadow-lg' 
                        : 'bg-slate-900 border-slate-800 hover:bg-slate-800 text-slate-400'
                    }`}
                  >
                    BABAK {num}
                  </button>
                ))}
              </div>
            </div>

            {/* Extended Match & Score Control Panel */}
            <div className="bg-slate-950/80 p-3 rounded-lg border border-slate-800 mt-3 flex flex-col gap-2.5 text-left">
              <span className="block text-[10px] text-emerald-400 font-mono uppercase font-black tracking-widest">KONTROL PARTAI & KOREKSI SEBAGAI SEKRETARIS</span>
              
              {/* Row 1: Quick Navigation for Partai Number with direct modal launcher */}
              <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-900 pb-2">
                <div className="flex items-center gap-2">
                  <span className="text-[10px] text-slate-400 font-bold uppercase">Navigasi Partai:</span>
                  <button
                    onClick={() => { playBeep('click'); setShowPilihPartaiModal(true); }}
                    className="px-2.5 py-1 text-[10px] font-black uppercase bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/50 rounded-md cursor-pointer transition-all flex items-center gap-1 shadow-sm"
                    title="Buka modal daftar partai pertandingan"
                  >
                    <ListOrdered className="w-3 h-3 text-amber-300" />
                    <span>PILIH PARTAI</span>
                  </button>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => { playBeep('click'); dispatch('SEKRETARIS_ADJUST_PARTAI', { offset: -1 }); }}
                    className="px-2.5 py-1 text-[10px] font-black uppercase bg-slate-900 border border-slate-800 text-slate-300 hover:bg-slate-800 rounded-md cursor-pointer transition-all"
                  >
                    ← P -1
                  </button>
                  <span className="text-xs font-mono font-black text-amber-400 px-1.5 self-center">P{state.partai}</span>
                  <button
                    onClick={() => { playBeep('click'); dispatch('SEKRETARIS_ADJUST_PARTAI', { offset: 1 }); }}
                    className="px-2.5 py-1 text-[10px] font-black uppercase bg-slate-900 border border-slate-800 text-slate-300 hover:bg-slate-800 rounded-md cursor-pointer transition-all"
                  >
                    P +1 →
                  </button>
                </div>
              </div>

              {/* Row 2: Manual Score Correction Offset */}
              <div className="grid grid-cols-2 gap-3 border-b border-slate-900 pb-2">
                {/* Blue Side Adjustment */}
                <div className="flex flex-col gap-1 text-left">
                  <span className="text-[8px] font-black uppercase text-cyan-400">Koreksi Skor Biru:</span>
                  <div className="flex gap-1.5">
                    <button
                      onClick={() => { playBeep('warning'); dispatch('SEKRETARIS_ADJUST_SCORE', { sudut: 'biru', amount: -1 }); }}
                      className="flex-1 py-1 bg-rose-950/20 hover:bg-rose-950/40 border border-rose-900/30 text-rose-400 text-[10px] font-black rounded-md cursor-pointer"
                    >
                      -1
                    </button>
                    <button
                      onClick={() => { playBeep('valid'); dispatch('SEKRETARIS_ADJUST_SCORE', { sudut: 'biru', amount: 1 }); }}
                      className="flex-1 py-1 bg-cyan-950/20 hover:bg-cyan-950/40 border border-cyan-900/30 text-cyan-400 text-[10px] font-black rounded-md cursor-pointer"
                    >
                      +1
                    </button>
                  </div>
                </div>

                {/* Red Side Adjustment */}
                <div className="flex flex-col gap-1 text-left">
                  <span className="text-[8px] font-black uppercase text-red-500">Koreksi Skor Merah:</span>
                  <div className="flex gap-1.5">
                    <button
                      onClick={() => { playBeep('warning'); dispatch('SEKRETARIS_ADJUST_SCORE', { sudut: 'merah', amount: -1 }); }}
                      className="flex-1 py-1 bg-rose-950/20 hover:bg-rose-950/40 border border-rose-900/30 text-rose-400 text-[10px] font-black rounded-md cursor-pointer"
                    >
                      -1
                    </button>
                    <button
                      onClick={() => { playBeep('valid'); dispatch('SEKRETARIS_ADJUST_SCORE', { sudut: 'merah', amount: 1 }); }}
                      className="flex-1 py-1 bg-red-950/40 hover:bg-red-900/40 border border-red-900/30 text-red-400 text-[10px] font-black rounded-md cursor-pointer"
                    >
                      +1
                    </button>
                  </div>
                </div>
              </div>

              {/* Row 3: Declare Direct Decision UD */}
              <div className="flex flex-col gap-1 text-left">
                <span className="text-[8px] font-black uppercase text-slate-400 block">Sahkan Keputusan Partai (Direct Win / UD):</span>
                <div className="grid grid-cols-2 gap-2 mt-1">
                  <button
                    onClick={() => {
                      if (confirm(`Sahkan Kemenangan UD (Undur Diri) untuk Sudut MERAH?`)) {
                        playBeep('valid');
                        dispatch('SEKRETARIS_DECLARE_WINNER', { winner: 'merah' });
                      }
                    }}
                    className="py-1 bg-red-950/40 hover:bg-red-900/40 border border-red-900/50 text-red-400 text-[9px] md:text-[10px] font-black uppercase rounded-md cursor-pointer transition-all"
                  >
                    Menang UD MERAH
                  </button>
                  <button
                    onClick={() => {
                      if (confirm(`Sahkan Kemenangan UD (Undur Diri) untuk Sudut BIRU?`)) {
                        playBeep('valid');
                        dispatch('SEKRETARIS_DECLARE_WINNER', { winner: 'biru' });
                      }
                    }}
                    className="py-1 bg-blue-950/40 hover:bg-blue-900/40 border border-blue-900/50 text-blue-400 text-[9px] md:text-[10px] font-black uppercase rounded-md cursor-pointer transition-all"
                  >
                    Menang UD BIRU
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* RIGHT COLUMN: Active profiles, Score summary (Col 5 on desktop) */}
          <div className="lg:col-span-5 flex flex-col gap-3 bg-slate-900/40 p-4 rounded-xl border border-slate-800/80">
            
            {/* Active profile headers summary cards */}
            <div className="flex flex-col gap-2.5">
              <span className="text-[10px] font-black uppercase text-slate-500 tracking-widest font-mono">Laporan Atlet Aktif</span>
              
              {/* Blue corner info */}
              <div className="bg-gradient-to-r from-blue-950/20 to-slate-900/55 p-2.5 rounded border border-blue-900/40 flex justify-between items-center shadow-md">
                <div className="truncate max-w-[12rem]">
                  <span className="text-[8px] font-black uppercase text-cyan-400">SUDUT BIRU</span>
                  <div className="text-xs font-black text-white uppercase truncate">{state.atletBiru.nama}</div>
                  <div className="text-[10px] text-blue-400 font-mono truncate">{state.atletBiru.kontingen}</div>
                </div>
                <div className="text-xl font-mono text-cyan-400 font-black">{state.scores.biru.total}</div>
              </div>

              {/* Red corner info */}
              <div className="bg-gradient-to-r from-red-950/20 to-slate-900/55 p-2.5 rounded border border-red-900/40 flex justify-between items-center shadow-md">
                <div className="truncate max-w-[12rem]">
                  <span className="text-[8px] font-black uppercase text-red-500">SUDUT MERAH</span>
                  <div className="text-xs font-black text-white uppercase truncate">{state.atletMerah.nama}</div>
                  <div className="text-[10px] text-red-400 font-mono truncate">{state.atletMerah.kontingen}</div>
                </div>
                <div className="text-xl font-mono text-red-500 font-black">{state.scores.merah.total}</div>
              </div>
            </div>

            {/* Real-Time Event Log Compact Feed Widget */}
            <div className="h-72 flex flex-col shrink-0">
              <EventLog
                state={state}
                theme={theme}
                compact={true}
                onExpand={() => {
                  playBeep('click');
                  setActiveTab('events');
                }}
              />
            </div>

            {/* PARTAI SELANJUTNYA (NEXT MATCH) */}
            {nextMatchInfo && (
              <div className={`mt-3 p-3 rounded-xl border ${
                theme === 'dark' 
                  ? 'bg-slate-950/60 border-slate-900/60' 
                  : 'bg-white border-slate-200'
              } shadow-sm`}>
                <div className="flex justify-between items-center mb-2">
                  <span className="text-[10px] font-black uppercase tracking-wider text-amber-500 font-mono flex items-center gap-1">
                    <span>⏭️</span> Partai Selanjutnya
                  </span>
                  <span className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded border ${
                    theme === 'dark' ? 'bg-slate-900 text-slate-300 border-slate-800' : 'bg-slate-100 text-slate-700 border-slate-300'
                  }`}>
                    {nextMatchInfo.match.partai}
                  </span>
                </div>

                <div className={`text-[11px] font-black truncate mb-2 uppercase ${theme === 'dark' ? 'text-slate-300' : 'text-slate-700'}`}>
                  {nextMatchInfo.category.name}
                </div>

                <div className="grid grid-cols-2 gap-2 text-xs mb-3">
                  {/* Sudut Merah */}
                  <div className={`border rounded p-1.5 truncate text-left ${
                    theme === 'dark' ? 'bg-red-950/15 border-red-900/30' : 'bg-red-50/50 border-red-200/50'
                  }`}>
                    <span className="text-[8px] font-black uppercase text-red-500 block">MERAH</span>
                    <div className={`font-extrabold truncate ${theme === 'dark' ? 'text-slate-100' : 'text-slate-900'}`}>
                      {nextMatchInfo.match.atletMerah.nama || '................'}
                    </div>
                    <div className={`text-[9px] truncate ${theme === 'dark' ? 'text-slate-400' : 'text-slate-500'}`}>
                      {nextMatchInfo.match.atletMerah.kontingen || '................'}
                    </div>
                  </div>

                  {/* Sudut Biru */}
                  <div className={`border rounded p-1.5 truncate text-left ${
                    theme === 'dark' ? 'bg-blue-950/15 border-blue-900/30' : 'bg-blue-50/50 border-blue-200/50'
                  }`}>
                    <span className="text-[8px] font-black uppercase text-cyan-505 block">BIRU</span>
                    <div className={`font-extrabold truncate ${theme === 'dark' ? 'text-slate-100' : 'text-slate-900'}`}>
                      {nextMatchInfo.match.atletBiru.nama || '................'}
                    </div>
                    <div className={`text-[9px] truncate ${theme === 'dark' ? 'text-slate-400' : 'text-slate-500'}`}>
                      {nextMatchInfo.match.atletBiru.kontingen || '................'}
                    </div>
                  </div>
                </div>

                <button
                  onClick={async () => {
                    playBeep('valid');
                    const cleanKelas = nextMatchInfo.category.name.replace(/\s*\(.*\)/, '');
                    await dispatch('LOAD_BAGAN_MATCH', {
                      namaEvent: state.namaEvent || "Kejuaraan Pencak Silat",
                      partai: nextMatchInfo.match.partai.replace(/Partai\s+/i, ''),
                      kelas: cleanKelas,
                      gender: nextMatchInfo.category.gender,
                      selectedWaktu: state.selectedWaktu || 120,
                      activeBaganCategoryId: nextMatchInfo.category.id,
                      activeBaganMatchId: nextMatchInfo.match.id,
                      atletMerah: {
                        nama: nextMatchInfo.match.atletMerah.nama || "Sudut Merah",
                        kontingen: nextMatchInfo.match.atletMerah.kontingen || "SUDUT MERAH"
                      },
                      atletBiru: {
                        nama: nextMatchInfo.match.atletBiru.nama || "Sudut Biru",
                        kontingen: nextMatchInfo.match.atletBiru.kontingen || "SUDUT BIRU"
                      }
                    });
                  }}
                  className="w-full py-1.5 bg-indigo-600 hover:bg-indigo-550 text-white font-extrabold uppercase text-[10px] rounded-lg tracking-wider transition-all active:scale-95 flex items-center justify-center gap-1 cursor-pointer border-0"
                >
                  <Play className="w-3 h-3" />
                  Muat Partai Selanjutnya
                </button>

                <button
                  type="button"
                  onClick={() => {
                    playBeep('click');
                    setShowPilihPartaiModal(true);
                  }}
                  className="w-full mt-2 py-2 bg-slate-900 hover:bg-slate-800 text-amber-400 border border-amber-500/30 font-black uppercase text-[10px] rounded-lg tracking-wider transition-all active:scale-95 flex items-center justify-center gap-1.5 cursor-pointer shadow-sm"
                >
                  <ListOrdered className="w-3.5 h-3.5 text-amber-400" />
                  <span>Pilih Partai Lainnya (Daftar Partai)</span>
                </button>
              </div>
            )}

            {!nextMatchInfo && (
              <div className={`mt-3 p-3 rounded-xl border ${theme === 'dark' ? 'bg-slate-950/60 border-slate-900/60' : 'bg-white border-slate-200'} shadow-sm text-center flex flex-col gap-2`}>
                <span className="text-[10px] font-mono uppercase text-slate-400 font-bold">Navigasi Pertandingan:</span>
                <button
                  type="button"
                  onClick={() => {
                    playBeep('click');
                    setShowPilihPartaiModal(true);
                  }}
                  className="w-full py-2.5 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-yellow-400 text-slate-950 font-black uppercase text-xs rounded-lg tracking-wider transition-all active:scale-95 flex items-center justify-center gap-2 cursor-pointer shadow-md"
                >
                  <ListOrdered className="w-4 h-4 text-slate-950" />
                  <span>PILIH PARTAI PERTANDINGAN</span>
                </button>
              </div>
            )}

            {/* Complete downloadable logs history database */}
            <div className="mt-4 border-t border-slate-800 pt-3 flex flex-col gap-2">
              <span className="text-[9px] font-black uppercase text-amber-400 tracking-widest font-mono flex items-center justify-between">
                <span>Dokumen Resmi & Rekapitulasi Nilai</span>
                <span className="text-[8px] px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-300 font-sans font-bold">PB IPSI PDF</span>
              </span>

              {/* Primary Action Button: Cetak Rekapitulasi Nilai Akhir PDF */}
              <button
                type="button"
                onClick={handleOpenRekapModal}
                title="Buka dialog resmi pencetakan lembar rekapitulasi nilai akhir partai (PDF)"
                className="w-full py-2.5 px-3 bg-gradient-to-r from-amber-500 via-amber-600 to-yellow-500 hover:from-amber-400 hover:to-yellow-400 text-slate-950 font-black text-xs uppercase tracking-wider rounded-xl shadow-lg shadow-amber-950/40 border border-amber-400/60 flex items-center justify-center gap-2 cursor-pointer transition-all active:scale-[0.98]"
              >
                <Printer className="w-4 h-4 text-slate-950" />
                <span>Cetak Rekapitulasi Nilai Akhir (PDF)</span>
              </button>

              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={handleExportPDF}
                  title="Unduh langsung PDF rekapitulasi nilai akhir partai saat ini"
                  className="py-2 px-2 bg-slate-900 hover:bg-slate-800 border border-slate-700/80 rounded-lg text-amber-300 font-bold text-[10px] sm:text-[11px] uppercase tracking-wider flex items-center justify-center gap-1 cursor-pointer transition-colors shadow-sm"
                >
                  <FileText className="w-3.5 h-3.5 text-amber-400" />
                  <span>Cetak Cepat Partai Ini</span>
                </button>
                <button
                  onClick={handleExportCSV}
                  title="Unduh seluruh rekap riwayat pertandingan dalam format Excel / CSV"
                  className="py-2 px-2 bg-slate-900 hover:bg-slate-800 border border-slate-800 rounded-lg text-slate-350 font-bold text-[10px] sm:text-[11px] uppercase tracking-wider flex items-center justify-center gap-1 cursor-pointer transition-colors"
                >
                  <Download className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Ekspor CSV</span>
                </button>
              </div>

              {/* Tombol Laporan Keseluruhan Seluruh Pertandingan */}
              <button
                onClick={handleExportAllPDF}
                title="Unduh Buku Laporan Resmi Seluruh Pertandingan Lengkap (Semua Partai Tanding, Kategori Seni & Medali) dalam format PDF"
                className="w-full py-2 px-3 bg-slate-900 hover:bg-slate-800 text-slate-300 hover:text-white font-extrabold text-[11px] uppercase tracking-wider rounded-lg border border-slate-800 hover:border-slate-700 flex items-center justify-center gap-2 cursor-pointer transition-all active:scale-[0.98]"
              >
                <FileText className="w-3.5 h-3.5 text-blue-400" />
                <span>Buku Rekap Seluruh Partai (PDF)</span>
              </button>
            </div>

            {/* Back to roster option */}
            <button
              onClick={resetOrNextPartai}
              className="mt-2 py-2.5 bg-red-950/40 hover:bg-red-900/40 cursor-pointer text-red-400 border border-red-900/60 rounded-lg text-xs font-bold uppercase transition-transform active:scale-[0.98] text-center"
            >
              Reset/Selesaikan Pertandingan Ini
            </button>
          </div>

        </div>
      </div>
      ) : activeTab === 'events' ? (
        <div className="flex-1 my-2 min-h-0 overflow-hidden flex flex-col">
          <EventLog state={state} theme={theme} />
        </div>
      ) : activeTab === 'jadwal' ? (
        <div className="flex-1 my-2 min-h-0 overflow-hidden flex flex-col">
          <JadwalTab theme={theme} state={state} tgrState={tgrState} dispatch={dispatch} />
        </div>
      ) : activeTab === 'seni' ? (
        <div className="flex-1 my-2 min-h-0 overflow-hidden flex flex-col">
          <SekretarisSeniMultiPesertaPanel
            tgrState={tgrState || ({} as any)}
            state={state}
            dispatch={dispatch}
            onClose={() => setActiveTab('control')}
            theme={theme}
            onToggleTheme={onToggleTheme}
          />
        </div>
      ) : null}

      {/* 3. Popup Dialogue Modals */}
      <AnimatePresence>
        
        {/* Proceed to next round confirmation warning popup */}
        {showNextBabakConfirm && (
          <div className="fixed inset-0 bg-slate-950/85 backdrop-blur-md z-[9999] flex items-center justify-center p-4">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-slate-900 border border-slate-800 max-w-sm w-full p-6 rounded-2xl shadow-2xl text-center"
            >
              <HelpCircle className="w-12 h-12 text-emerald-400 mx-auto mb-3 animate-pulse" />
              <h3 className="text-base font-black text-white uppercase tracking-tight mb-1.5">
                LANJUT KE BABAK BERIKUTNYA?
              </h3>
              <p className="text-xs text-slate-400 mb-6">
                Waktu babak berjalan telah habis. Apakah Anda yakin ingin memajukan pertandingan ke babak selanjutnya? Tindakan ini akan secara otomatis melepas kunci panel Juri.
              </p>

              <div className="flex gap-3">
                <button
                  onClick={handleProceedNextBabak}
                  className="flex-1 py-2.5 bg-emerald-600 hover:bg-emerald-500 font-bold text-xs uppercase tracking-wider rounded-lg transition-transform active:scale-95"
                >
                  Ya, Lanjutkan
                </button>
                <button
                  onClick={() => { playBeep('click'); setShowNextBabakConfirm(false); }}
                  className="flex-1 py-2.5 bg-slate-800 hover:bg-slate-705 text-slate-350 text-xs font-bold uppercase tracking-wider border border-slate-700/50 rounded-lg transition-transform active:scale-95"
                >
                  Tidak
                </button>
              </div>
            </motion.div>
          </div>
        )}

        {/* Dynamic Multi-Device Connection QR Modal (Barcode System) */}
        {showQrModal && (
          <div className="fixed inset-0 bg-slate-950/90 backdrop-blur-md z-[9999] flex items-center justify-center p-4">
            <motion.div
              initial={{ scale: 0.95, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 20 }}
              className="bg-slate-950 border border-slate-800 max-w-4xl w-full p-6 md:p-8 rounded-3xl shadow-2xl relative overflow-hidden text-slate-100"
            >
              {/* Neon accent spotlight behind cards */}
              <div className="absolute top-1/4 left-1/3 w-[300px] h-[300px] bg-indigo-500/10 rounded-full blur-[100px] pointer-events-none" />
              
              <div className="flex justify-between items-start mb-6 pb-4 border-b border-slate-800/80">
                <div>
                  <h3 className="text-xl font-black uppercase tracking-tight flex items-center gap-2 text-indigo-400">
                    <QrCode className="w-6 h-6 text-indigo-400" /> FITUR SAMBUNGAN MULTI-PANEL (BARCODE/QR)
                  </h3>
                  <p className="text-xs text-slate-400 mt-1">
                    Scan Barcode/QR Code di bawah menggunakan Handphone atau Tablet untuk menyambungkan perangkat langsung ke sistem scoring sebagai Juri, Dewan, atau Monitor.
                  </p>
                </div>
                <button
                  onClick={() => { playBeep('click'); setShowQrModal(false); }}
                  className="px-3 py-1.5 bg-slate-900 border border-slate-800 hover:bg-slate-800 rounded-lg text-xs font-bold text-slate-400 transition-colors cursor-pointer"
                >
                  Tutup
                </button>
              </div>

              {/* Grid of roles */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 max-h-[60vh] overflow-y-auto pr-1">
                
                {[
                  { id: 'juri1', label: 'JURI 1', color: 'border-amber-500/40 bg-amber-950/10 text-amber-400' },
                  { id: 'juri2', label: 'JURI 2', color: 'border-emerald-500/40 bg-emerald-950/10 text-emerald-400' },
                  { id: 'juri3', label: 'JURI 3', color: 'border-sky-500/40 bg-sky-950/10 text-sky-400' },
                  { id: 'dewan', label: 'DEWAN JURI', color: 'border-purple-500/40 bg-purple-950/10 text-purple-400' },
                  { id: 'monitor', label: 'LAYAR MONITOR', color: 'border-blue-500/40 bg-blue-950/10 text-blue-400' },
                  { id: 'sekretaris', label: 'SEKRETARIS', color: 'border-rose-500/40 bg-rose-950/10 text-rose-400' },
                ].map((item) => {
                  const url = `${window.location.origin}${window.location.pathname}?role=${item.id}`;
                  
                  return (
                    <div 
                      key={item.id} 
                      className={`flex flex-col items-center p-4 rounded-2xl border ${item.color} relative overflow-hidden transition-all duration-300 hover:scale-[1.02] shadow-md`}
                    >
                      <span className="text-[10px] uppercase font-black tracking-widest bg-slate-900/90 px-2.5 py-0.5 rounded-full border border-slate-800 mb-3">
                        {item.label}
                      </span>
                      
                      {/* White high-contrast frame for ideal scanning response */}
                      <div className="p-3 bg-white rounded-xl shadow-lg border border-slate-200 transition-transform active:scale-95 duration-200">
                        <QRCodeSVG 
                          value={url} 
                          size={120} 
                          bgColor="#ffffff" 
                          fgColor="#0f172a" 
                          includeMargin={false} 
                          level="H"
                        />
                      </div>

                      <div className="mt-3 w-full text-center">
                        <p className="text-[10px] text-slate-400 select-all truncate mb-2 font-mono px-1 py-0.5 bg-slate-900 rounded border border-slate-850" title={url}>
                          {url}
                        </p>
                        <button
                          onClick={() => {
                            playBeep('valid');
                            navigator.clipboard.writeText(url);
                            setToastMsg(`Link ${item.label} berhasil disalin!`);
                            setTimeout(() => setToastMsg(null), 3000);
                          }}
                          className="w-full py-1 text-[9px] uppercase font-bold tracking-wider rounded bg-slate-900 border border-slate-800 text-slate-300 hover:text-white hover:bg-slate-800 transition-colors"
                        >
                          Salin Link
                        </button>
                      </div>
                    </div>
                  );
                })}

              </div>

              <div className="mt-6 flex flex-col md:flex-row items-center justify-between text-slate-500 text-[10px] border-t border-slate-900 pt-4 font-mono">
                <div>
                  Koneksi terjalin menggunakan protokol <span className="text-emerald-400 font-bold">WebSocket Real-Time Sync</span>.
                </div>
                <div className="mt-1 md:mt-0">
                  Semua panel akan menyinkronkan status pertandingan secara instan.
                </div>
              </div>
            </motion.div>
          </div>
        )}

        {/* Logo Monitor Modal Dialog */}
        {showLogoModal && (
          <div className="fixed inset-0 bg-slate-950/90 backdrop-blur-md z-[9999] flex items-center justify-center p-4">
            <motion.div
              initial={{ scale: 0.95, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 20 }}
              className="bg-slate-950 border border-slate-800 max-w-xl w-full p-6 rounded-3xl shadow-2xl relative overflow-hidden text-slate-100"
            >
              <div className="flex justify-between items-start mb-5 pb-3 border-b border-slate-800">
                <div>
                  <h3 className="text-lg font-black uppercase tracking-tight flex items-center gap-2 text-amber-400">
                    <span>🖼️</span> PENGATURAN LOGO LAYAR MONITOR
                  </h3>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Ubah logo yang tampil di sudut kiri dan kanan atas Layar Monitor Pertandingan.
                  </p>
                </div>
                <button
                  onClick={() => { playBeep('click'); setShowLogoModal(false); }}
                  className="px-3 py-1.5 bg-slate-900 border border-slate-800 hover:bg-slate-800 rounded-lg text-xs font-bold text-slate-400 transition-colors cursor-pointer"
                >
                  Tutup
                </button>
              </div>

              <div className="grid grid-cols-2 gap-4">
                {/* Logo Kiri Card */}
                <div className="flex flex-col items-center bg-slate-900/90 p-4 rounded-2xl border border-slate-800 text-center">
                  <span className="text-xs font-bold text-slate-300 uppercase mb-2">Logo Kiri</span>
                  <div className="w-24 h-24 rounded-2xl bg-white border-2 border-slate-300 flex items-center justify-center p-2 overflow-hidden shadow-inner mb-3">
                    {state.logoKiri ? (
                      <img src={state.logoKiri} alt="Logo Kiri" className="w-full h-full object-contain" />
                    ) : (
                      <div className="flex flex-col items-center justify-center text-slate-400">
                        <span className="text-3xl">🛡️</span>
                        <span className="text-[10px] font-black text-slate-600 mt-1">IPSI ASLI</span>
                      </div>
                    )}
                  </div>
                  <div className="flex flex-col w-full gap-1.5">
                    <button
                      type="button"
                      onClick={() => { playBeep('click'); fileInputKiriRef.current?.click(); }}
                      className="w-full py-2 px-3 cursor-pointer bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs uppercase rounded-xl tracking-wider transition-all shadow-sm"
                    >
                      {state.logoKiri ? 'Ganti Logo Kiri' : 'Unggah Logo Kiri'}
                    </button>
                    {state.logoKiri && (
                      <button
                        type="button"
                        onClick={() => {
                          playBeep('click');
                          dispatch('UPLOAD_LOGOS', { logoKiri: null });
                          setToastMsg('Logo kiri dikembalikan ke logo IPSI bawaan!');
                          setTimeout(() => setToastMsg(null), 3500);
                        }}
                        className="w-full py-1 text-[10px] text-slate-400 hover:text-red-400 font-bold uppercase transition-colors"
                      >
                        Reset ke Logo IPSI
                      </button>
                    )}
                  </div>
                </div>

                {/* Logo Kanan Card */}
                <div className="flex flex-col items-center bg-slate-900/90 p-4 rounded-2xl border border-slate-800 text-center">
                  <span className="text-xs font-bold text-slate-300 uppercase mb-2">Logo Kanan</span>
                  <div className="w-24 h-24 rounded-2xl bg-white border-2 border-slate-300 flex items-center justify-center p-2 overflow-hidden shadow-inner mb-3">
                    {state.logoKanan ? (
                      <img src={state.logoKanan} alt="Logo Kanan" className="w-full h-full object-contain" />
                    ) : (
                      <div className="flex flex-col items-center justify-center text-slate-400">
                        <span className="text-3xl">🛡️</span>
                        <span className="text-[10px] font-black text-slate-600 mt-1">IPSI ASLI</span>
                      </div>
                    )}
                  </div>
                  <div className="flex flex-col w-full gap-1.5">
                    <button
                      type="button"
                      onClick={() => { playBeep('click'); fileInputKananRef.current?.click(); }}
                      className="w-full py-2 px-3 cursor-pointer bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs uppercase rounded-xl tracking-wider transition-all shadow-sm"
                    >
                      {state.logoKanan ? 'Ganti Logo Kanan' : 'Unggah Logo Kanan'}
                    </button>
                    {state.logoKanan && (
                      <button
                        type="button"
                        onClick={() => {
                          playBeep('click');
                          dispatch('UPLOAD_LOGOS', { logoKanan: null });
                          setToastMsg('Logo kanan dikembalikan ke logo IPSI bawaan!');
                          setTimeout(() => setToastMsg(null), 3500);
                        }}
                        className="w-full py-1 text-[10px] text-slate-400 hover:text-red-400 font-bold uppercase transition-colors"
                      >
                        Reset ke Logo IPSI
                      </button>
                    )}
                  </div>
                </div>
              </div>

              <div className="mt-4 pt-3 border-t border-slate-800 flex items-center justify-between">
                {(state.logoKiri || state.logoKanan) ? (
                  <button
                    type="button"
                    onClick={() => {
                      playBeep('warning');
                      dispatch('UPLOAD_LOGOS', { logoKiri: null, logoKanan: null, logoTengah: null });
                      setToastMsg('Semua logo telah dikembalikan ke logo IPSI bawaan!');
                      setTimeout(() => setToastMsg(null), 3500);
                    }}
                    className="px-3 py-1.5 text-xs text-red-400 hover:text-red-300 font-bold uppercase tracking-wider bg-red-950/40 border border-red-800/40 rounded-lg cursor-pointer transition-colors"
                  >
                    Reset Semua ke IPSI Bawaan
                  </button>
                ) : (
                  <span className="text-[11px] text-slate-500 font-mono">Status: Menggunakan Logo IPSI Bawaan</span>
                )}

                <button
                  type="button"
                  onClick={() => { playBeep('click'); setShowLogoModal(false); }}
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs uppercase rounded-xl tracking-wider transition-all shadow-md ml-auto"
                >
                  Selesai
                </button>
              </div>
            </motion.div>
          </div>
        )}

        {/* Modal Pilih Partai Pertandingan */}
        {showPilihPartaiModal && (
          <div className="fixed inset-0 bg-slate-950/85 backdrop-blur-md z-[9999] flex items-center justify-center p-3 sm:p-5">
            <motion.div
              initial={{ scale: 0.95, opacity: 0, y: 15 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 15 }}
              className="bg-slate-950 border border-slate-800 max-w-4xl w-full max-h-[92vh] flex flex-col rounded-3xl shadow-2xl relative overflow-hidden text-slate-100"
            >
              {/* Modal Header */}
              <div className="flex justify-between items-center p-4 sm:p-5 border-b border-slate-850 bg-slate-900/60">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-2xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-400 shadow-inner">
                    <ListOrdered className="w-5 h-5 text-amber-400" />
                  </div>
                  <div>
                    <h3 className="text-base sm:text-lg font-black uppercase tracking-tight flex items-center gap-2 text-white">
                      <span>PILIH PARTAI PERTANDINGAN</span>
                    </h3>
                    <p className="text-xs text-slate-400 mt-0.5">
                      Pilih dan muat partai tanding ke sistem scoring gelanggang aktif
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <div className="hidden sm:flex items-center gap-1.5 px-3 py-1 bg-slate-900 border border-slate-800 rounded-xl text-xs font-mono">
                    <span className="text-slate-400">Aktif Sekarang:</span>
                    <span className="font-black text-amber-400">P{state.partai || '01'}</span>
                  </div>
                  <button
                    onClick={() => { playBeep('click'); setShowPilihPartaiModal(false); }}
                    className="p-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-white border border-slate-800 cursor-pointer transition-colors"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
              </div>

              {/* Toolbar: Search, Status Filter & Direct Custom Partai Input */}
              <div className="p-4 border-b border-slate-850 bg-slate-900/30 flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between">
                {/* Search Box */}
                <div className="relative flex-1">
                  <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                  <input
                    type="text"
                    value={partaiSearchQuery}
                    onChange={(e) => setPartaiSearchQuery(e.target.value)}
                    placeholder="Cari no. partai, atlet, kontingen, kelas..."
                    className="w-full pl-9 pr-8 py-2 text-xs bg-slate-900 border border-slate-800 rounded-xl text-white placeholder-slate-500 focus:border-amber-500 focus:outline-none font-bold"
                  />
                  {partaiSearchQuery && (
                    <button
                      onClick={() => setPartaiSearchQuery('')}
                      className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white p-0.5"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>

                {/* Filter Tabs */}
                <div className="flex items-center gap-1 bg-slate-900 p-1 rounded-xl border border-slate-800 self-start sm:self-auto">
                  <button
                    type="button"
                    onClick={() => { playBeep('click'); setPartaiFilterStatus('all'); }}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                      partaiFilterStatus === 'all'
                        ? 'bg-amber-500 text-slate-950 shadow-sm'
                        : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    Semua ({scheduledList.length})
                  </button>
                  <button
                    type="button"
                    onClick={() => { playBeep('click'); setPartaiFilterStatus('unfinished'); }}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                      partaiFilterStatus === 'unfinished'
                        ? 'bg-amber-500 text-slate-950 shadow-sm'
                        : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    Belum Main ({scheduledList.filter(x => !x.isFinished).length})
                  </button>
                  <button
                    type="button"
                    onClick={() => { playBeep('click'); setPartaiFilterStatus('finished'); }}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                      partaiFilterStatus === 'finished'
                        ? 'bg-amber-500 text-slate-950 shadow-sm'
                        : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    Selesai ({scheduledList.filter(x => x.isFinished).length})
                  </button>
                </div>

                {/* Jump to Custom Partai Box */}
                <div className="flex items-center gap-1.5 bg-slate-900/90 p-1 pl-2.5 rounded-xl border border-amber-500/30">
                  <span className="text-[10px] font-mono font-bold text-amber-400 uppercase tracking-wider">P</span>
                  <input
                    type="text"
                    value={customPartaiInput}
                    onChange={(e) => setCustomPartaiInput(e.target.value)}
                    placeholder="No Partai"
                    className="w-16 py-1 px-1.5 text-xs bg-slate-950 border border-slate-800 rounded-lg text-white font-mono font-bold text-center outline-none focus:border-amber-400"
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') handleLoadCustomPartai(customPartaiInput);
                    }}
                  />
                  <button
                    type="button"
                    onClick={() => handleLoadCustomPartai(customPartaiInput)}
                    disabled={!customPartaiInput.trim()}
                    className="py-1 px-2.5 bg-amber-500 hover:bg-amber-400 disabled:opacity-30 disabled:pointer-events-none text-slate-950 font-black text-xs uppercase rounded-lg transition-all cursor-pointer"
                  >
                    Terapkan
                  </button>
                </div>
              </div>

              {/* Match Card Grid / List Area */}
              <div className="flex-1 overflow-y-auto p-4 custom-scrollbar max-h-[60vh] overscroll-contain">
                {scheduledList.length === 0 ? (
                  <div className="flex flex-col items-center justify-center p-8 text-center bg-slate-900/30 rounded-2xl border border-dashed border-slate-800">
                    <div className="w-14 h-14 rounded-2xl bg-slate-850 flex items-center justify-center text-slate-400 mb-3 text-2xl">
                      📋
                    </div>
                    <h4 className="text-sm font-bold text-slate-200 uppercase">
                      Belum Ada Partai di Bagan Pertandingan
                    </h4>
                    <p className="text-xs text-slate-400 max-w-md mt-1 mb-4">
                      Belum ada jadwal pertandingan yang dibuat atau diimpor di sistem bagan. Anda dapat memasukkan nomor partai secara manual menggunakan kotak di atas, atau membuka tab Bagan untuk membuat jadwal pertandingan.
                    </p>
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => {
                          setShowPilihPartaiModal(false);
                          setActiveTab('config');
                        }}
                        className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs uppercase rounded-xl transition-all shadow-md cursor-pointer"
                      >
                        Buka Tab Pengaturan / Bagan
                      </button>
                    </div>
                  </div>
                ) : filteredPartaiList.length === 0 ? (
                  <div className="flex flex-col items-center justify-center p-8 text-center bg-slate-900/30 rounded-2xl border border-slate-800">
                    <p className="text-sm text-slate-400">
                      Tidak ada partai yang cocok dengan kata kunci <span className="text-amber-400 font-bold">"{partaiSearchQuery}"</span>
                    </p>
                    <button
                      type="button"
                      onClick={() => {
                        setPartaiSearchQuery('');
                        setPartaiFilterStatus('all');
                      }}
                      className="mt-3 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-xs font-bold text-slate-200 rounded-lg cursor-pointer transition-colors"
                    >
                      Reset Filter & Pencarian
                    </button>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {filteredPartaiList.map((item, idx) => (
                      <div
                        key={`${item.uniqueId}__${idx}`}
                        className={`p-3.5 rounded-2xl border transition-all duration-200 flex flex-col justify-between ${
                          item.isActive
                            ? 'bg-emerald-950/30 border-emerald-500 shadow-lg shadow-emerald-950/40 ring-1 ring-emerald-500/40'
                            : item.isFinished
                            ? 'bg-slate-900/40 border-slate-800/80 hover:border-slate-700 opacity-90'
                            : 'bg-slate-900/70 border-slate-800 hover:border-amber-500/50 hover:bg-slate-900 shadow-sm'
                        }`}
                      >
                        {/* Card Top: Partai Badge, Category & Round */}
                        <div>
                          <div className="flex items-center justify-between gap-2 mb-2">
                            <div className="flex items-center gap-2">
                              <span className={`px-2.5 py-0.5 rounded-lg font-mono font-black text-xs border ${
                                item.isActive
                                  ? 'bg-emerald-500 text-slate-950 border-emerald-400'
                                  : item.isFinished
                                  ? 'bg-slate-800 text-slate-300 border-slate-700'
                                  : 'bg-amber-500/20 text-amber-400 border-amber-500/40'
                              }`}>
                                P{item.num.toString().padStart(2, '0')}
                              </span>
                              <span className="text-[11px] font-bold text-slate-300 truncate max-w-[14rem]" title={item.categoryName}>
                                [{item.gender.toUpperCase()}] {item.categoryName.replace(/\s*\(.*\)/, '')}
                              </span>
                            </div>

                            {/* Status Badge */}
                            <div>
                              {item.isActive ? (
                                <span className="px-2 py-0.5 rounded-full text-[9px] font-black bg-emerald-500 text-slate-950 animate-pulse">
                                  ● AKTIF
                                </span>
                              ) : item.isFinished ? (
                                <span className="px-2 py-0.5 rounded-full text-[9px] font-bold bg-slate-800 text-emerald-400 border border-emerald-900/40">
                                  ✓ SELESAI
                                </span>
                              ) : (
                                <span className="px-2 py-0.5 rounded-full text-[9px] font-bold bg-slate-800/80 text-amber-400 border border-amber-900/40">
                                  ⏳ TERJADWAL
                                </span>
                              )}
                            </div>
                          </div>

                          <div className="text-[10px] font-mono text-slate-400 uppercase font-bold mb-2.5">
                            {item.round}
                          </div>

                          {/* Matchup VS */}
                          <div className="grid grid-cols-2 gap-2 text-xs mb-3">
                            {/* Sudut Merah */}
                            <div className="p-2 rounded-xl bg-red-950/20 border border-red-900/30 flex flex-col justify-between">
                              <div>
                                <span className="text-[8px] font-black uppercase text-red-400 block tracking-wider">
                                  SUDUT MERAH
                                </span>
                                <div className="font-black text-slate-100 uppercase truncate mt-0.5 text-[11px]" title={item.match.atletMerah.nama || 'TBD'}>
                                  {item.match.atletMerah.nama || 'Belum Ditentukan'}
                                </div>
                                <div className="text-[9px] text-red-300/80 font-mono truncate" title={item.match.atletMerah.kontingen || '-'}>
                                  {item.match.atletMerah.kontingen || '-'}
                                </div>
                              </div>
                              {item.match.winner === 'merah' && (
                                <span className="text-[9px] font-black text-red-400 flex items-center gap-1 mt-1">
                                  🏆 MENANG
                                </span>
                              )}
                            </div>

                            {/* Sudut Biru */}
                            <div className="p-2 rounded-xl bg-blue-950/20 border border-blue-900/30 flex flex-col justify-between">
                              <div>
                                <span className="text-[8px] font-black uppercase text-cyan-400 block tracking-wider">
                                  SUDUT BIRU
                                </span>
                                <div className="font-black text-slate-100 uppercase truncate mt-0.5 text-[11px]" title={item.match.atletBiru.nama || 'TBD'}>
                                  {item.match.atletBiru.nama || 'Belum Ditentukan'}
                                </div>
                                <div className="text-[9px] text-cyan-300/80 font-mono truncate" title={item.match.atletBiru.kontingen || '-'}>
                                  {item.match.atletBiru.kontingen || '-'}
                                </div>
                              </div>
                              {item.match.winner === 'biru' && (
                                <span className="text-[9px] font-black text-cyan-400 flex items-center gap-1 mt-1">
                                  🏆 MENANG
                                </span>
                              )}
                            </div>
                          </div>
                        </div>

                        {/* Card Action Button */}
                        <div>
                          {item.isActive ? (
                            <div className="w-full text-center py-2 text-xs font-black text-emerald-400 bg-emerald-950/40 border border-emerald-800/40 rounded-xl">
                              Partai Ini Sedang Aktif di Gelanggang
                            </div>
                          ) : (
                            <button
                              type="button"
                              onClick={() => handleLoadMatch(item)}
                              className={`w-full py-2 px-3 font-black text-xs uppercase rounded-xl flex items-center justify-center gap-2 cursor-pointer transition-all active:scale-[0.98] ${
                                item.isFinished
                                  ? 'bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700'
                                  : 'bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white shadow-md'
                              }`}
                            >
                              <Play className="w-3.5 h-3.5" />
                              <span>{item.isFinished ? 'Muat Ulang Partai Ini' : 'Muat Partai Ini ke Gelanggang'}</span>
                            </button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Modal Footer */}
              <div className="p-3.5 sm:p-4 border-t border-slate-850 bg-slate-900/60 flex items-center justify-between text-xs text-slate-400">
                <span className="font-mono text-[11px]">
                  Total: <strong className="text-white">{filteredPartaiList.length}</strong> partai ditampilkan
                </span>
                <button
                  type="button"
                  onClick={() => { playBeep('click'); setShowPilihPartaiModal(false); }}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs uppercase rounded-xl transition-colors cursor-pointer"
                >
                  Tutup
                </button>
              </div>
            </motion.div>
          </div>
        )}

        {/* Modal Konfirmasi Ganti Partai (Bila sedang berlangsung / ada skor) */}
        {confirmLoadPartai && (
          <div className="fixed inset-0 bg-slate-950/90 backdrop-blur-md z-[10000] flex items-center justify-center p-4">
            <motion.div
              initial={{ scale: 0.95, opacity: 0, y: 15 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 15 }}
              className="bg-slate-950 border border-amber-500/50 max-w-lg w-full p-6 rounded-3xl shadow-2xl relative overflow-hidden text-slate-100"
            >
              <div className="flex items-center gap-3 mb-4">
                <div className="w-12 h-12 rounded-2xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-400">
                  <AlertTriangle className="w-6 h-6 text-amber-400" />
                </div>
                <div>
                  <h3 className="text-base font-black uppercase text-amber-400 tracking-tight">
                    Ganti Partai Pertandingan?
                  </h3>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Konfirmasi pergantian pertandingan yang sedang aktif
                  </p>
                </div>
              </div>

              <div className="p-4 bg-slate-900/80 rounded-2xl border border-slate-800 text-xs text-slate-300 space-y-2 mb-5">
                <p>
                  Partai saat ini (<strong className="text-amber-400">P{state.partai || '01'}</strong>) sedang berlangsung atau telah memiliki skor:
                </p>
                <div className="flex items-center justify-center gap-4 py-2 font-mono text-sm font-black bg-slate-950 rounded-xl border border-slate-850">
                  <span className="text-red-400">MERAH: {state.scores.merah.total}</span>
                  <span className="text-slate-600">vs</span>
                  <span className="text-cyan-400">BIRU: {state.scores.biru.total}</span>
                </div>
                <p className="text-[11px] text-slate-400">
                  Memuat <strong className="text-white">Partai P{confirmLoadPartai.num.toString().padStart(2, '0')} - {confirmLoadPartai.categoryName}</strong> akan mereset skor dan ronde ke awal untuk pertandingan baru tersebut.
                </p>
              </div>

              <div className="flex items-center justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => { playBeep('click'); setConfirmLoadPartai(null); }}
                  className="px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-300 font-bold text-xs uppercase cursor-pointer transition-colors border border-slate-800"
                >
                  Batal
                </button>
                <button
                  type="button"
                  onClick={() => handleExecuteLoadMatch(confirmLoadPartai)}
                  className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-yellow-400 text-slate-950 font-black text-xs uppercase cursor-pointer shadow-lg shadow-amber-950/40 transition-all active:scale-95"
                >
                  Ya, Muat Partai P{confirmLoadPartai.num.toString().padStart(2, '0')}
                </button>
              </div>
            </motion.div>
          </div>
        )}

        {/* Global Toast Notification */}
        {toastMsg && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="fixed top-5 left-1/2 -translate-x-1/2 z-[10000] px-5 py-2.5 rounded-full bg-emerald-600 text-white font-bold text-xs shadow-2xl border border-emerald-400 flex items-center gap-2"
          >
            <span>✓</span>
            <span>{toastMsg}</span>
          </motion.div>
        )}

        {/* Modal Rekapitulasi Nilai Akhir PDF */}
        <RekapitulasiNilaiPdfModal
          isOpen={showRekapModal}
          onClose={() => setShowRekapModal(false)}
          state={state}
          histories={histories}
          theme={theme}
        />

      </AnimatePresence>
    </div>
  );
}
