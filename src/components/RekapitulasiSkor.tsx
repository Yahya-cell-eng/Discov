/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Trophy,
  Medal,
  Award,
  Search,
  Filter,
  Download,
  CheckCircle2,
  Users,
  Shield,
  Flame,
  Printer,
  ChevronRight,
  Sparkles,
  FileSpreadsheet,
  X,
  Star,
  ExternalLink,
  Upload,
  RefreshCw,
  Edit3,
  Building,
  UserCheck,
  ChevronDown
} from 'lucide-react';
import * as XLSX from 'xlsx';
import { MatchHistory, TGRPeserta, TGRState, MatchState, GelanggangInfo } from '../types';
import { playBeep } from '../utils/sound';
import {
  loadAllUploadedAthletes,
  calculateContingentMedals,
  exportContingentMedalsToExcel,
  loadContingentMedalAdjustments,
  saveContingentMedalAdjustments,
  ContingentAthlete,
  ContingentMedalRecord,
  CategoryMedalWinnerGroup
} from '../utils/contingentMedalCalculator';
import UploadKontingenModal from './UploadKontingenModal';
import EditMedaliKontingenModal from './EditMedaliKontingenModal';

interface RekapitulasiSkorProps {
  histories?: MatchHistory[];
  tgrPeserta?: TGRPeserta[];
  tgrState?: TGRState | null;
  state?: MatchState | null;
  allArenasMap?: Record<string, { state: MatchState; tgrState: any; histories: MatchHistory[]; info: GelanggangInfo }>;
  title?: string;
  subtitle?: string;
  className?: string;
  isEmbedded?: boolean;
}

export default function RekapitulasiSkor({
  histories = [],
  tgrPeserta = [],
  tgrState,
  state,
  allArenasMap,
  title = "REKAPITULASI MEDALI & KLASEMEN KONTINGEN",
  subtitle = "PEROLEHAN MEDALI RESMI BERDASARKAN DATA KONTINGEN & HASIL PERTANDINGAN",
  className = "",
  isEmbedded = false
}: RekapitulasiSkorProps) {
  const [activeTab, setActiveTab] = useState<'klasemen_kontingen' | 'klasemen_kategori' | 'daftar_atlet' | 'tanding' | 'seni'>('klasemen_kontingen');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategoryFilter, setSelectedCategoryFilter] = useState<string>('semua');
  const [filterMode, setFilterMode] = useState<'all' | 'with_medals'>('all'); // all = show all uploaded contingents
  const [sortBy, setSortBy] = useState<'medals' | 'points' | 'name' | 'athletes'>('medals');
  const [expandedKontingen, setExpandedKontingen] = useState<string | null>(null);
  
  // Modals state
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [editingKontingen, setEditingKontingen] = useState<ContingentMedalRecord | null>(null);

  // Uploaded athletes and adjustments from storage
  const [uploadedAthletes, setUploadedAthletes] = useState<ContingentAthlete[]>([]);
  const [adjustments, setAdjustments] = useState<Record<string, { gold: number; silver: number; bronze: number; note?: string }>>({});
  const [isSyncing, setIsSyncing] = useState(false);

  // Sync / Refresh function from local storage
  const handleRefreshData = () => {
    setIsSyncing(true);
    playBeep('click');
    const aths = loadAllUploadedAthletes();
    const adjs = loadContingentMedalAdjustments();
    setUploadedAthletes(aths);
    setAdjustments(adjs);
    setTimeout(() => {
      setIsSyncing(false);
    }, 400);
  };

  // Initial load
  useEffect(() => {
    handleRefreshData();
  }, []);

  // Effective Seni participants
  const effectiveTgrPeserta = useMemo(() => {
    if (tgrPeserta && tgrPeserta.length > 0) return tgrPeserta;
    if (tgrState?.pesertaList) return tgrState.pesertaList;
    return [];
  }, [tgrPeserta, tgrState]);

  // Completed TGR
  const completedTgr = useMemo(() => {
    return effectiveTgrPeserta
      .filter(p => p.status === 'Sudah Menilai' || p.finalScore !== undefined)
      .sort((a, b) => (b.finalScore || 0) - (a.finalScore || 0));
  }, [effectiveTgrPeserta]);

  // Main Calculation from Calculator Engine
  const {
    records: contingentRecords,
    categoryGroups,
    allContingentsList,
    totalGold,
    totalSilver,
    totalBronze,
    totalMedals,
    totalRegisteredAthletes
  } = useMemo(() => {
    return calculateContingentMedals({
      histories,
      tgrPeserta: effectiveTgrPeserta,
      state,
      allArenasMap,
      uploadedAthletes,
      adjustments,
      sortBy
    });
  }, [histories, effectiveTgrPeserta, state, allArenasMap, uploadedAthletes, adjustments, sortBy]);

  // Filtered Contingent Records based on search & filterMode
  const filteredContingents = useMemo(() => {
    let list = contingentRecords;

    // Filter mode
    if (filterMode === 'with_medals') {
      list = list.filter(r => r.total > 0);
    }

    // Search query
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      list = list.filter(r => {
        if (r.kontingen.toLowerCase().includes(q)) return true;
        // Search inside medalists or athletes
        const matchMedalist = r.medalists.some(m => m.atletNama.toLowerCase().includes(q) || m.category.toLowerCase().includes(q));
        if (matchMedalist) return true;
        const matchAthlete = r.athletes.some(a => a.nama.toLowerCase().includes(q) || a.kategori.toLowerCase().includes(q));
        return matchAthlete;
      });
    }

    return list;
  }, [contingentRecords, filterMode, searchQuery]);

  // Filtered Category Groups
  const filteredCategoryGroups = useMemo(() => {
    let list = categoryGroups;

    if (selectedCategoryFilter !== 'semua') {
      const filterLower = selectedCategoryFilter.toLowerCase();
      list = list.filter(g => g.categoryName.toLowerCase().includes(filterLower));
    }

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      list = list.filter(g =>
        g.categoryName.toLowerCase().includes(q) ||
        g.goldWinner?.nama.toLowerCase().includes(q) ||
        g.goldWinner?.kontingen.toLowerCase().includes(q) ||
        g.silverWinner?.nama.toLowerCase().includes(q) ||
        g.silverWinner?.kontingen.toLowerCase().includes(q) ||
        g.bronzeWinners.some(b => b.nama.toLowerCase().includes(q) || b.kontingen.toLowerCase().includes(q))
      );
    }

    return list;
  }, [categoryGroups, selectedCategoryFilter, searchQuery]);

  // Filtered Tanding Histories
  const filteredHistories = useMemo(() => {
    if (!searchQuery.trim()) return histories;
    const q = searchQuery.toLowerCase().trim();
    return histories.filter(h =>
      h.atletMerah.nama.toLowerCase().includes(q) ||
      h.atletMerah.kontingen.toLowerCase().includes(q) ||
      h.atletBiru.nama.toLowerCase().includes(q) ||
      h.atletBiru.kontingen.toLowerCase().includes(q) ||
      (h.partai || '').toLowerCase().includes(q) ||
      (h.kelas || '').toLowerCase().includes(q)
    );
  }, [histories, searchQuery]);

  // Filtered TGR
  const filteredTgr = useMemo(() => {
    if (!searchQuery.trim()) return completedTgr;
    const q = searchQuery.toLowerCase().trim();
    return completedTgr.filter(p =>
      p.nama.toLowerCase().includes(q) ||
      p.kontingen.toLowerCase().includes(q) ||
      (p.kategori || '').toLowerCase().includes(q) ||
      `no ${p.noUrut}`.includes(q)
    );
  }, [completedTgr, searchQuery]);

  // Top Contingent (Champion)
  const topContingent = contingentRecords.length > 0 && contingentRecords[0].total > 0 ? contingentRecords[0] : null;

  // Handle Save Medal Adjustments
  const handleSaveAdjustment = (adj: { gold: number; silver: number; bronze: number; note?: string }) => {
    if (!editingKontingen) return;
    const updated = {
      ...adjustments,
      [editingKontingen.kontingen]: adj
    };
    setAdjustments(updated);
    saveContingentMedalAdjustments(updated);
  };

  // Export to Excel
  const handleExportExcel = () => {
    playBeep('click');
    exportContingentMedalsToExcel({
      records: contingentRecords,
      categoryGroups,
      tournamentName: title
    });
  };

  // Export to CSV
  const handleExportCSV = () => {
    playBeep('click');
    let csvContent = "data:text/csv;charset=utf-8,";

    csvContent += "=== REKAPITULASI MEDALI SESUAI DATA KONTINGEN TERUPLOAD ===\n";
    csvContent += "Peringkat,Nama Kontingen,Jumlah Atlet Terdaftar,Emas (Gold),Perak (Silver),Perunggu (Bronze),Total Medali,Total Poin,Emas Tanding,Emas Tunggal,Emas Ganda,Emas Regu\n";

    contingentRecords.forEach(r => {
      csvContent += `${r.rank},"${r.kontingen}",${r.totalAtlet},${r.gold},${r.silver},${r.bronze},${r.total},${r.points},${r.byCategory.tanding.gold},${r.byCategory.tunggal.gold},${r.byCategory.ganda.gold},${r.byCategory.regu.gold}\n`;
    });

    csvContent += "\n=== DAFTAR JUARA MEDALI PER KATEGORI ===\n";
    csvContent += "Kategori,Tipe,Juara 1 (Emas),Kontingen Emas,Juara 2 (Perak),Kontingen Perak,Juara 3 Bersama 1,Kontingen Perunggu 1,Juara 3 Bersama 2,Kontingen Perunggu 2\n";

    categoryGroups.forEach(g => {
      const gNama = g.goldWinner ? `"${g.goldWinner.nama}"` : '"-"';
      const gKont = g.goldWinner ? `"${g.goldWinner.kontingen}"` : '"-"';
      const sNama = g.silverWinner ? `"${g.silverWinner.nama}"` : '"-"';
      const sKont = g.silverWinner ? `"${g.silverWinner.kontingen}"` : '"-"';
      const b1Nama = g.bronzeWinners[0] ? `"${g.bronzeWinners[0].nama}"` : '"-"';
      const b1Kont = g.bronzeWinners[0] ? `"${g.bronzeWinners[0].kontingen}"` : '"-"';
      const b2Nama = g.bronzeWinners[1] ? `"${g.bronzeWinners[1].nama}"` : '"-"';
      const b2Kont = g.bronzeWinners[1] ? `"${g.bronzeWinners[1].kontingen}"` : '"-"';

      csvContent += `"${g.categoryName}","${g.type}",${gNama},${gKont},${sNama},${sKont},${b1Nama},${b1Kont},${b2Nama},${b2Kont}\n`;
    });

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `Rekapitulasi_Medali_Kontingen_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Print official recap
  const handlePrint = () => {
    playBeep('click');
    window.print();
  };

  return (
    <div className={`w-full max-w-7xl mx-auto ${className}`}>
      
      {/* 1. MAIN BANNER & CONTROL BAR */}
      <div className="relative border border-amber-500/30 rounded-3xl p-5 sm:p-7 bg-gradient-to-b from-[#0b081b]/95 via-[#070514]/95 to-[#03020b]/95 backdrop-blur-xl shadow-[0_0_50px_rgba(245,158,11,0.12)] overflow-hidden">
        
        {/* Visual background lights */}
        <div className="absolute top-0 right-0 w-96 h-96 bg-amber-500/10 rounded-full blur-[120px] pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-96 h-96 bg-purple-500/10 rounded-full blur-[120px] pointer-events-none" />
        
        {/* Top Header Row */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 z-10 relative pb-6 border-b border-slate-800/80">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-amber-500/40 bg-amber-950/40 text-[9px] font-mono font-black tracking-widest text-amber-300 uppercase mb-2">
              <Trophy className="w-3.5 h-3.5 text-amber-400 animate-pulse" />
              <span>REKAPITULASI RESMI MEDALI KONTINGEN TERINTEGRASI</span>
            </div>
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-black font-sport tracking-wider text-transparent bg-clip-text bg-gradient-to-r from-amber-300 via-white to-amber-500 uppercase">
              {title}
            </h2>
            <p className="text-[10px] sm:text-xs font-mono font-bold text-slate-400 mt-1 uppercase tracking-wider">
              {subtitle}
            </p>
          </div>

          {/* Action Buttons: Upload, Sync, Export & Print */}
          <div className="flex flex-wrap items-center gap-2.5 shrink-0">
            {/* Upload Kontingen Button */}
            <button
              onClick={() => { playBeep('click'); setIsUploadModalOpen(true); }}
              className="px-3.5 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 text-[10px] font-mono font-black tracking-wider uppercase transition-all shadow-md flex items-center gap-2 cursor-pointer active:scale-95"
              title="Unggah file Excel / CSV data kontingen dan pesilat"
            >
              <Upload className="w-4 h-4" />
              <span>UNGGAH DATA KONTINGEN</span>
            </button>

            {/* Sync Button */}
            <button
              onClick={handleRefreshData}
              disabled={isSyncing}
              className="px-3 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-700 text-slate-300 hover:text-white text-[10px] font-mono font-bold tracking-wider uppercase transition-all flex items-center gap-1.5 cursor-pointer"
              title="Sinkronkan ulang seluruh data kontingen dan medali dari sistem"
            >
              <RefreshCw className={`w-3.5 h-3.5 text-amber-400 ${isSyncing ? 'animate-spin' : ''}`} />
              <span>SINKRONKAN</span>
            </button>

            {/* Export Excel (.xlsx) */}
            <button
              onClick={handleExportExcel}
              className="px-3.5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-[10px] font-mono font-black tracking-wider uppercase transition-all shadow-md flex items-center gap-2 cursor-pointer active:scale-95"
              title="Ekspor seluruh hasil rekapitulasi ke file Excel (.xlsx) resmi"
            >
              <FileSpreadsheet className="w-4 h-4 text-emerald-200" />
              <span className="hidden sm:inline">EKSPOR EXCEL</span>
            </button>

            {/* Print */}
            <button
              onClick={handlePrint}
              className="px-3.5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 border border-amber-500/30 text-amber-300 text-[10px] font-sport font-black tracking-wider uppercase transition-all shadow flex items-center gap-2 cursor-pointer active:scale-95"
              title="Cetak lembar rekapitulasi hasil resmi IPSI"
            >
              <Printer className="w-4 h-4" />
              <span className="hidden sm:inline">CETAK RESMI</span>
            </button>
          </div>
        </div>

        {/* 2. STATS OVERVIEW CARDS */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 my-6 z-10 relative">
          {/* Card 1: Total Uploaded Contingents */}
          <div className="border border-slate-800/90 rounded-2xl p-3.5 bg-slate-950/70 flex flex-col justify-between">
            <span className="text-[9px] font-mono font-bold text-slate-400 uppercase tracking-wider block mb-1 flex items-center gap-1.5">
              <Building className="w-3.5 h-3.5 text-cyan-400" />
              <span>TOTAL KONTINGEN TERUPLOAD</span>
            </span>
            <div className="flex items-baseline justify-between mt-1">
              <span className="text-2xl sm:text-3xl font-black font-sport text-cyan-400 tracking-wider">
                {contingentRecords.length}
              </span>
              <span className="text-[9px] font-mono text-slate-500 uppercase">KONTINGEN</span>
            </div>
          </div>

          {/* Card 2: Total Registered Athletes */}
          <div className="border border-slate-800/90 rounded-2xl p-3.5 bg-slate-950/70 flex flex-col justify-between">
            <span className="text-[9px] font-mono font-bold text-slate-400 uppercase tracking-wider block mb-1 flex items-center gap-1.5">
              <Users className="w-3.5 h-3.5 text-purple-400" />
              <span>TOTAL PESILAT TERDAFTAR</span>
            </span>
            <div className="flex items-baseline justify-between mt-1">
              <span className="text-2xl sm:text-3xl font-black font-sport text-purple-400 tracking-wider">
                {totalRegisteredAthletes}
              </span>
              <span className="text-[9px] font-mono text-slate-500 uppercase">PESILAT</span>
            </div>
          </div>

          {/* Card 3: Total Medals Distributed */}
          <div className="border border-slate-800/90 rounded-2xl p-3.5 bg-slate-950/70 flex flex-col justify-between">
            <span className="text-[9px] font-mono font-bold text-slate-400 uppercase tracking-wider block mb-1 flex items-center gap-1.5">
              <Medal className="w-3.5 h-3.5 text-amber-400" />
              <span>TOTAL MEDALI TERDISTRIBUSI</span>
            </span>
            <div className="flex items-baseline justify-between mt-1">
              <span className="text-2xl sm:text-3xl font-black font-sport text-amber-400 tracking-wider">
                {totalMedals}
              </span>
              <div className="flex items-center gap-1 text-[9px] font-mono font-bold">
                <span className="text-amber-300">🥇{totalGold}</span>
                <span className="text-slate-300">🥈{totalSilver}</span>
                <span className="text-amber-600">🥉{totalBronze}</span>
              </div>
            </div>
          </div>

          {/* Card 4: Top Leading Contingent */}
          <div className="border border-amber-500/30 rounded-2xl p-3.5 bg-amber-950/20 flex flex-col justify-between">
            <span className="text-[9px] font-mono font-bold text-amber-400 uppercase tracking-wider block mb-1 flex items-center gap-1.5">
              <Trophy className="w-3.5 h-3.5 text-amber-400" />
              <span>JUARA UMUM 1 SEMENTARA</span>
            </span>
            <div className="flex items-center justify-between mt-1 truncate">
              <span className="text-sm sm:text-base font-black font-sport text-amber-300 truncate uppercase">
                {topContingent ? topContingent.kontingen : 'BELUM ADA'}
              </span>
              {topContingent && (
                <span className="px-2 py-0.5 rounded-full bg-amber-500 text-slate-950 text-[9px] font-extrabold font-mono shrink-0">
                  {topContingent.gold} 🥇 ({topContingent.points} POIN)
                </span>
              )}
            </div>
          </div>
        </div>

        {/* 3. TABS & FILTER SELECTORS BAR */}
        <div className="flex flex-col gap-3 z-10 relative pt-2">
          <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-3">
            
            {/* Navigation Tabs */}
            <div className="flex items-center gap-1.5 p-1 rounded-xl bg-slate-950 border border-slate-800 overflow-x-auto">
              <button
                onClick={() => { playBeep('click'); setActiveTab('klasemen_kontingen'); }}
                className={`px-3.5 py-1.5 rounded-lg text-[10px] font-black font-sport tracking-wider uppercase transition-all cursor-pointer whitespace-nowrap flex items-center gap-1.5 ${
                  activeTab === 'klasemen_kontingen'
                    ? 'bg-amber-500 text-slate-950 shadow-md'
                    : 'text-slate-400 hover:text-white hover:bg-slate-900'
                }`}
              >
                <Trophy className="w-3.5 h-3.5" />
                <span>KLASEMEN KONTINGEN ({contingentRecords.length})</span>
              </button>

              <button
                onClick={() => { playBeep('click'); setActiveTab('klasemen_kategori'); }}
                className={`px-3.5 py-1.5 rounded-lg text-[10px] font-black font-sport tracking-wider uppercase transition-all cursor-pointer whitespace-nowrap flex items-center gap-1.5 ${
                  activeTab === 'klasemen_kategori'
                    ? 'bg-emerald-500 text-slate-950 shadow-md'
                    : 'text-slate-400 hover:text-white hover:bg-slate-900'
                }`}
              >
                <Medal className="w-3.5 h-3.5" />
                <span>MEDALI PER KATEGORI ({categoryGroups.length})</span>
              </button>

              <button
                onClick={() => { playBeep('click'); setActiveTab('daftar_atlet'); }}
                className={`px-3.5 py-1.5 rounded-lg text-[10px] font-black font-sport tracking-wider uppercase transition-all cursor-pointer whitespace-nowrap flex items-center gap-1.5 ${
                  activeTab === 'daftar_atlet'
                    ? 'bg-purple-500 text-slate-950 shadow-md'
                    : 'text-slate-400 hover:text-white hover:bg-slate-900'
                }`}
              >
                <Users className="w-3.5 h-3.5" />
                <span>ATLET TERUPLOAD ({totalRegisteredAthletes})</span>
              </button>

              <button
                onClick={() => { playBeep('click'); setActiveTab('tanding'); }}
                className={`px-3.5 py-1.5 rounded-lg text-[10px] font-black font-sport tracking-wider uppercase transition-all cursor-pointer whitespace-nowrap ${
                  activeTab === 'tanding'
                    ? 'bg-cyan-500 text-slate-950 shadow-md'
                    : 'text-slate-400 hover:text-white hover:bg-slate-900'
                }`}
              >
                HASIL TANDING ({histories.length})
              </button>

              <button
                onClick={() => { playBeep('click'); setActiveTab('seni'); }}
                className={`px-3.5 py-1.5 rounded-lg text-[10px] font-black font-sport tracking-wider uppercase transition-all cursor-pointer whitespace-nowrap ${
                  activeTab === 'seni'
                    ? 'bg-pink-500 text-slate-950 shadow-md'
                    : 'text-slate-400 hover:text-white hover:bg-slate-900'
                }`}
              >
                HASIL SENI ({completedTgr.length})
              </button>
            </div>

            {/* Filter & Sorting Controls */}
            <div className="flex flex-wrap items-center gap-2">
              {/* Filter Mode Toggle: All Contingents vs Medals Only */}
              {activeTab === 'klasemen_kontingen' && (
                <div className="flex items-center gap-1 p-1 rounded-xl bg-slate-950 border border-slate-800 text-[10px] font-mono">
                  <button
                    onClick={() => { playBeep('click'); setFilterMode('all'); }}
                    className={`px-2.5 py-1 rounded-lg transition-all ${
                      filterMode === 'all'
                        ? 'bg-amber-500 text-slate-950 font-bold'
                        : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    Semua ({contingentRecords.length})
                  </button>
                  <button
                    onClick={() => { playBeep('click'); setFilterMode('with_medals'); }}
                    className={`px-2.5 py-1 rounded-lg transition-all ${
                      filterMode === 'with_medals'
                        ? 'bg-amber-500 text-slate-950 font-bold'
                        : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    Peraih Medali
                  </button>
                </div>
              )}

              {/* Sort By Selector */}
              {activeTab === 'klasemen_kontingen' && (
                <select
                  value={sortBy}
                  onChange={(e) => { playBeep('click'); setSortBy(e.target.value as any); }}
                  className="px-2.5 py-1.5 rounded-xl bg-slate-950 border border-slate-800 text-slate-300 text-[10px] font-mono focus:outline-none focus:border-amber-500"
                >
                  <option value="medals">Urutkan: Medali Emas 🥇</option>
                  <option value="points">Urutkan: Total Poin</option>
                  <option value="athletes">Urutkan: Jumlah Atlet</option>
                  <option value="name">Urutkan: Nama Kontingen (A-Z)</option>
                </select>
              )}

              {/* Search Box */}
              <div className="relative flex-1 sm:w-56">
                <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Cari kontingen / atlet..."
                  className="w-full pl-8 pr-7 py-1.5 rounded-xl bg-slate-950 border border-slate-800 text-slate-200 text-xs font-mono placeholder:text-slate-600 focus:outline-none focus:border-amber-500"
                />
                {searchQuery && (
                  <button
                    onClick={() => setSearchQuery('')}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-500 hover:text-white"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            </div>

          </div>
        </div>

        {/* 4. CONTENT DISPLAY */}
        <div className="mt-6 z-10 relative min-h-[300px]">

          {/* TAB 1: KLASEMEN MEDALI KONTINGEN */}
          {activeTab === 'klasemen_kontingen' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-black font-sport tracking-wider text-amber-400 uppercase flex items-center gap-2">
                  <Trophy className="w-4 h-4 text-amber-400" />
                  <span>KLASEMEN PEROLEHAN MEDALI KONTINGEN (SESUAI DATA TERUPLOAD)</span>
                </h3>
                <span className="text-[10px] font-mono text-slate-500 uppercase">
                  {filteredContingents.length} KONTINGEN DITAMPILKAN
                </span>
              </div>

              {filteredContingents.length === 0 ? (
                <div className="p-10 text-center border border-slate-800/80 rounded-3xl bg-slate-950/50">
                  <Building className="w-10 h-10 text-slate-600 mx-auto mb-2" />
                  <p className="text-xs font-mono text-slate-400 uppercase font-bold mb-3">
                    Belum ada data kontingen yang terupload atau sesuai pencarian.
                  </p>
                  <button
                    onClick={() => setIsUploadModalOpen(true)}
                    className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-mono font-black uppercase transition-all inline-flex items-center gap-2"
                  >
                    <Upload className="w-4 h-4" />
                    <span>Unggah Data Kontingen Sekarang</span>
                  </button>
                </div>
              ) : (
                <div className="border border-slate-800/90 rounded-2xl bg-slate-950/80 overflow-hidden shadow-xl">
                  {/* Table Header */}
                  <div className="grid grid-cols-12 bg-slate-900/90 text-[9.5px] font-black font-mono uppercase tracking-wider text-slate-400 py-3 px-3 border-b border-slate-800 text-center items-center">
                    <div className="col-span-1 text-left pl-2">NO</div>
                    <div className="col-span-4 lg:col-span-3 text-left">KONTINGEN / DAERAH</div>
                    <div className="hidden lg:block lg:col-span-2 text-center text-slate-500">PESILAT TERDAFTAR</div>
                    <div className="col-span-2 lg:col-span-1 text-amber-400 font-bold">EMAS 🥇</div>
                    <div className="col-span-2 lg:col-span-1 text-slate-300 font-bold">PERAK 🥈</div>
                    <div className="col-span-2 lg:col-span-1 text-amber-600 font-bold">PERUNGGU 🥉</div>
                    <div className="col-span-1 text-emerald-400 font-extrabold text-center">TOTAL</div>
                    <div className="hidden sm:block col-span-1 text-amber-300 font-extrabold pr-2 text-right">POIN</div>
                  </div>

                  {/* Table Rows */}
                  <div className="divide-y divide-slate-800/70">
                    {filteredContingents.map((item, idx) => {
                      const isExpanded = expandedKontingen === item.kontingen;

                      return (
                        <div key={item.kontingen} className="transition-colors">
                          <div
                            onClick={() => { playBeep('click'); setExpandedKontingen(isExpanded ? null : item.kontingen); }}
                            className={`grid grid-cols-12 items-center p-3 text-xs cursor-pointer hover:bg-slate-900/80 transition-colors ${
                              item.rank === 1 && item.gold > 0 ? 'bg-amber-950/20' : ''
                            }`}
                          >
                            {/* Rank */}
                            <div className="col-span-1 font-mono font-bold text-slate-500 pl-2 flex items-center gap-1">
                              <span className={item.rank <= 3 ? 'text-amber-400 font-black' : ''}>
                                #{item.rank}
                              </span>
                              <ChevronRight className={`w-3 h-3 text-slate-500 transition-transform ${isExpanded ? 'rotate-90 text-amber-400' : ''}`} />
                            </div>

                            {/* Contingent Name */}
                            <div className="col-span-4 lg:col-span-3 font-black font-sport uppercase text-slate-100 truncate pr-2 flex items-center gap-1.5">
                              <span className="truncate">{item.kontingen}</span>
                              {item.rank === 1 && item.gold > 0 && (
                                <span className="px-1.5 py-0.5 rounded bg-amber-500 text-slate-950 text-[8px] font-extrabold font-mono shrink-0">
                                  JUARA UMUM
                                </span>
                              )}
                              {item.manualAdjustment && (
                                <span className="px-1.5 py-0.2 rounded bg-purple-950 border border-purple-700 text-purple-300 text-[8px] font-mono shrink-0" title="Terdapat penyesuaian medali manual">
                                  MOD
                                </span>
                              )}
                            </div>

                            {/* Registered Athletes Count */}
                            <div className="hidden lg:flex lg:col-span-2 items-center justify-center gap-1 text-[10px] font-mono text-slate-400">
                              <Users className="w-3 h-3 text-slate-500" />
                              <span>{item.totalAtlet} Pesilat</span>
                            </div>

                            {/* Medals */}
                            <div className="col-span-2 lg:col-span-1 text-center font-black font-sport text-amber-400 text-sm">
                              {item.gold}
                            </div>
                            <div className="col-span-2 lg:col-span-1 text-center font-black font-sport text-slate-300 text-sm">
                              {item.silver}
                            </div>
                            <div className="col-span-2 lg:col-span-1 text-center font-black font-sport text-amber-600 text-sm">
                              {item.bronze}
                            </div>
                            <div className="col-span-1 text-center font-black font-sport text-emerald-400 text-sm">
                              {item.total}
                            </div>
                            <div className="hidden sm:block col-span-1 text-right font-black font-sport text-amber-300 text-sm pr-2">
                              {item.points}
                            </div>
                          </div>

                          {/* Expandable Details Accordion */}
                          <AnimatePresence>
                            {isExpanded && (
                              <motion.div
                                initial={{ opacity: 0, height: 0 }}
                                animate={{ opacity: 1, height: 'auto' }}
                                exit={{ opacity: 0, height: 0 }}
                                className="bg-slate-900/90 border-t border-b border-slate-800 p-4 font-mono text-xs space-y-4"
                              >
                                <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-800 pb-3">
                                  <div>
                                    <h5 className="text-[11px] font-black font-sport text-amber-400 uppercase tracking-wider flex items-center gap-1.5">
                                      <Building className="w-4 h-4 text-amber-400" />
                                      <span>RINCIAN RESMI: {item.kontingen}</span>
                                    </h5>
                                    <span className="text-[10px] text-slate-400">
                                      Total {item.totalAtlet} Pesilat Terdaftar | {item.total} Medali Diraih | {item.points} Poin
                                    </span>
                                  </div>

                                  <div className="flex items-center gap-2">
                                    <button
                                      type="button"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        setEditingKontingen(item);
                                      }}
                                      className="px-2.5 py-1 rounded-lg bg-amber-500/20 hover:bg-amber-500/30 border border-amber-500/40 text-amber-300 text-[10px] font-mono font-bold flex items-center gap-1 cursor-pointer"
                                    >
                                      <Edit3 className="w-3 h-3" />
                                      <span>Sesuaikan Medali</span>
                                    </button>
                                  </div>
                                </div>

                                {/* Category Breakdown Badges */}
                                <div className="flex flex-wrap items-center gap-2 text-[10px]">
                                  <span className="text-slate-400 uppercase font-bold">Rincian Emas:</span>
                                  <span className="px-2 py-0.5 rounded bg-cyan-950 border border-cyan-800 text-cyan-300">
                                    Tanding: {item.byCategory.tanding.gold}
                                  </span>
                                  <span className="px-2 py-0.5 rounded bg-purple-950 border border-purple-800 text-purple-300">
                                    Seni Tunggal: {item.byCategory.tunggal.gold}
                                  </span>
                                  <span className="px-2 py-0.5 rounded bg-indigo-950 border border-indigo-800 text-indigo-300">
                                    Seni Ganda: {item.byCategory.ganda.gold}
                                  </span>
                                  <span className="px-2 py-0.5 rounded bg-emerald-950 border border-emerald-800 text-emerald-300">
                                    Seni Regu: {item.byCategory.regu.gold}
                                  </span>
                                </div>

                                {/* Medalists List */}
                                <div>
                                  <h6 className="text-[10px] font-black font-sport text-slate-300 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                                    <Medal className="w-3.5 h-3.5 text-amber-400" />
                                    <span>DAFTAR ATLET PERAIH MEDALI ({item.medalists.length})</span>
                                  </h6>

                                  {item.medalists.length === 0 ? (
                                    <p className="text-[10px] text-slate-500 italic">
                                      Belum ada perolehan medali yang tercatat untuk kontingen ini.
                                    </p>
                                  ) : (
                                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2">
                                      {item.medalists.map((m, mIdx) => (
                                        <div
                                          key={mIdx}
                                          className={`p-2 rounded-xl border flex items-center justify-between text-xs ${
                                            m.medalType === 'gold'
                                              ? 'bg-amber-950/40 border-amber-500/40 text-amber-200'
                                              : m.medalType === 'silver'
                                              ? 'bg-slate-800/40 border-slate-600/40 text-slate-200'
                                              : 'bg-amber-950/20 border-amber-700/40 text-amber-400'
                                          }`}
                                        >
                                          <div>
                                            <div className="font-bold font-sport uppercase">{m.atletNama}</div>
                                            <div className="text-[9px] text-slate-400">{m.category}</div>
                                          </div>
                                          <div className="text-right shrink-0">
                                            <span className="text-xs">
                                              {m.medalType === 'gold' ? '🥇 EMAS' : m.medalType === 'silver' ? '🥈 PERAK' : '🥉 PERUNGGU'}
                                            </span>
                                          </div>
                                        </div>
                                      ))}
                                    </div>
                                  )}
                                </div>

                                {/* Uploaded Athletes from this Contingent */}
                                <div>
                                  <h6 className="text-[10px] font-black font-sport text-slate-300 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                                    <Users className="w-3.5 h-3.5 text-purple-400" />
                                    <span>DAFTAR ATLET TERDAFTAR DARI KONTINGEN INI ({item.athletes.length})</span>
                                  </h6>

                                  {item.athletes.length === 0 ? (
                                    <p className="text-[10px] text-slate-500 italic">
                                      Tidak ada data rincian atlet terdaftar individual (kontingen dimasukkan dari riwayat pertandingan).
                                    </p>
                                  ) : (
                                    <div className="flex flex-wrap gap-1.5 max-h-36 overflow-y-auto p-2 rounded-xl bg-slate-950 border border-slate-800">
                                      {item.athletes.map((ath, aIdx) => (
                                        <span
                                          key={aIdx}
                                          className="px-2 py-0.5 rounded bg-slate-900 border border-slate-800 text-[10px] text-slate-300 font-mono"
                                        >
                                          {ath.nama} <span className="text-slate-500">({ath.kategori})</span>
                                        </span>
                                      ))}
                                    </div>
                                  )}
                                </div>
                              </motion.div>
                            )}
                          </AnimatePresence>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* TAB 2: MEDALI PER KATEGORI */}
          {activeTab === 'klasemen_kategori' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-black font-sport tracking-wider text-emerald-400 uppercase flex items-center gap-2">
                  <Medal className="w-4 h-4 text-emerald-400" />
                  <span>DAFTAR JUARA & PERAIH MEDALI PER KATEGORI PERTANDINGAN</span>
                </h3>
                <span className="text-[10px] font-mono text-slate-500 uppercase">
                  {filteredCategoryGroups.length} KATEGORI
                </span>
              </div>

              {filteredCategoryGroups.length === 0 ? (
                <div className="p-8 text-center border border-slate-800/80 rounded-2xl bg-slate-950/50">
                  <p className="text-xs font-mono text-slate-400 uppercase">
                    Belum ada kategori yang selesai atau cocok dengan kriteria pencarian.
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {filteredCategoryGroups.map((g) => (
                    <div
                      key={g.categoryKey}
                      className="border border-slate-800 rounded-2xl p-4 bg-slate-950/80 space-y-3 shadow-lg"
                    >
                      <div className="flex items-center justify-between border-b border-slate-800 pb-2.5">
                        <h4 className="text-xs font-black font-sport text-slate-200 uppercase tracking-wider truncate">
                          {g.categoryName}
                        </h4>
                        <span className={`px-2 py-0.5 rounded text-[9px] font-mono font-bold uppercase ${
                          g.type === 'TANDING'
                            ? 'bg-cyan-950 border border-cyan-800 text-cyan-300'
                            : 'bg-purple-950 border border-purple-800 text-purple-300'
                        }`}>
                          {g.type}
                        </span>
                      </div>

                      {/* Winners Grid */}
                      <div className="space-y-2 text-xs font-mono">
                        {/* Gold */}
                        <div className="flex items-center justify-between p-2 rounded-xl bg-amber-950/30 border border-amber-500/30">
                          <div className="flex items-center gap-2">
                            <span className="text-base">🥇</span>
                            <div>
                              <div className="font-bold text-amber-300 uppercase">
                                {g.goldWinner?.nama || 'Belum Ditentukan'}
                              </div>
                              <div className="text-[9px] text-amber-400/80 uppercase">
                                {g.goldWinner?.kontingen || '-'}
                              </div>
                            </div>
                          </div>
                          <span className="text-[9px] text-slate-500">{g.goldWinner?.scoreInfo || ''}</span>
                        </div>

                        {/* Silver */}
                        <div className="flex items-center justify-between p-2 rounded-xl bg-slate-800/30 border border-slate-600/30">
                          <div className="flex items-center gap-2">
                            <span className="text-base">🥈</span>
                            <div>
                              <div className="font-bold text-slate-200 uppercase">
                                {g.silverWinner?.nama || 'Belum Ditentukan'}
                              </div>
                              <div className="text-[9px] text-slate-400 uppercase">
                                {g.silverWinner?.kontingen || '-'}
                              </div>
                            </div>
                          </div>
                          <span className="text-[9px] text-slate-500">{g.silverWinner?.scoreInfo || ''}</span>
                        </div>

                        {/* Bronze 1 & 2 */}
                        {g.bronzeWinners.length > 0 ? (
                          g.bronzeWinners.map((bw, bwIdx) => (
                            <div key={bwIdx} className="flex items-center justify-between p-2 rounded-xl bg-amber-950/20 border border-amber-700/30">
                              <div className="flex items-center gap-2">
                                <span className="text-base">🥉</span>
                                <div>
                                  <div className="font-bold text-amber-500 uppercase">{bw.nama}</div>
                                  <div className="text-[9px] text-amber-600 uppercase">{bw.kontingen}</div>
                                </div>
                              </div>
                              <span className="text-[9px] text-slate-500">{bw.scoreInfo}</span>
                            </div>
                          ))
                        ) : (
                          <div className="p-2 rounded-xl bg-slate-900/40 border border-slate-800 text-slate-500 text-[10px]">
                            🥉 Juara 3 Bersama belum ditentukan
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* TAB 3: DAFTAR SELURUH ATLET TERUPLOAD */}
          {activeTab === 'daftar_atlet' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-black font-sport tracking-wider text-purple-400 uppercase flex items-center gap-2">
                  <Users className="w-4 h-4 text-purple-400" />
                  <span>DAFTAR SELURUH ATLET TERUPLOAD PER KONTINGEN</span>
                </h3>
                <span className="text-[10px] font-mono text-slate-500 uppercase">
                  {totalRegisteredAthletes} TOTAL ATLET
                </span>
              </div>

              <div className="border border-slate-800/90 rounded-2xl bg-slate-950/80 overflow-hidden shadow-xl">
                <div className="max-h-[500px] overflow-y-auto">
                  <table className="w-full text-left text-xs font-mono">
                    <thead className="bg-slate-900 text-slate-400 text-[10px] uppercase font-bold sticky top-0 border-b border-slate-800">
                      <tr>
                        <th className="p-3">No</th>
                        <th className="p-3">Nama Atlet</th>
                        <th className="p-3">Kontingen</th>
                        <th className="p-3">Kategori Lomba</th>
                        <th className="p-3">Kelas</th>
                        <th className="p-3">Gender</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800/70 text-slate-300">
                      {uploadedAthletes.length === 0 ? (
                        <tr>
                          <td colSpan={6} className="p-8 text-center text-slate-500 italic">
                            Belum ada data atlet yang diunggah. Silakan klik tombol "Unggah Data Kontingen".
                          </td>
                        </tr>
                      ) : (
                        uploadedAthletes
                          .filter(ath => {
                            if (!searchQuery.trim()) return true;
                            const q = searchQuery.toLowerCase().trim();
                            return ath.nama.toLowerCase().includes(q) || ath.kontingen.toLowerCase().includes(q) || ath.kategori.toLowerCase().includes(q);
                          })
                          .map((ath, idx) => (
                            <tr key={ath.id || idx} className="hover:bg-slate-900/60">
                              <td className="p-3 text-slate-500">{idx + 1}</td>
                              <td className="p-3 font-bold text-white uppercase">{ath.nama}</td>
                              <td className="p-3 text-amber-300 font-bold uppercase">{ath.kontingen}</td>
                              <td className="p-3">{ath.kategori}</td>
                              <td className="p-3 text-slate-400">{ath.kelas || '-'}</td>
                              <td className="p-3 text-slate-400">{ath.gender || '-'}</td>
                            </tr>
                          ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* TAB 4: DETAIL LAGA TANDING */}
          {activeTab === 'tanding' && (
            <div className="space-y-4">
              <h3 className="text-xs font-black font-sport tracking-wider text-cyan-400 uppercase flex items-center gap-2">
                <Shield className="w-4 h-4 text-cyan-400" />
                <span>DAFTAR HASIL PERTANDINGAN TANDING ({filteredHistories.length} PARTAI)</span>
              </h3>

              <div className="border border-slate-800/90 rounded-2xl bg-slate-950/80 overflow-hidden shadow-xl">
                <div className="max-h-[500px] overflow-y-auto">
                  <table className="w-full text-left text-xs font-mono">
                    <thead className="bg-slate-900 text-slate-400 text-[10px] uppercase font-bold sticky top-0 border-b border-slate-800">
                      <tr>
                        <th className="p-3">Partai</th>
                        <th className="p-3">Kelas</th>
                        <th className="p-3">Sudut Merah</th>
                        <th className="p-3 text-center">Skor</th>
                        <th className="p-3">Sudut Biru</th>
                        <th className="p-3">Pemenang</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800/70 text-slate-300">
                      {filteredHistories.map((h, idx) => (
                        <tr key={h.id || idx} className="hover:bg-slate-900/60">
                          <td className="p-3 font-bold text-slate-400">Partai {h.partai}</td>
                          <td className="p-3 text-slate-300">{h.kelas} ({h.gender})</td>
                          <td className={`p-3 font-bold ${h.winner === 'merah' ? 'text-red-400' : 'text-slate-400'}`}>
                            {h.atletMerah.nama}
                            <span className="block text-[9px] text-slate-500">{h.atletMerah.kontingen}</span>
                          </td>
                          <td className="p-3 text-center font-sport font-black text-white text-sm">
                            <span className="text-red-400">{h.skorAkhirMerah}</span> - <span className="text-blue-400">{h.skorAkhirBiru}</span>
                          </td>
                          <td className={`p-3 font-bold ${h.winner === 'biru' ? 'text-blue-400' : 'text-slate-400'}`}>
                            {h.atletBiru.nama}
                            <span className="block text-[9px] text-slate-500">{h.atletBiru.kontingen}</span>
                          </td>
                          <td className="p-3 font-bold text-amber-300">
                            {h.winner === 'merah' ? `${h.atletMerah.nama} (Merah)` : h.winner === 'biru' ? `${h.atletBiru.nama} (Biru)` : 'DRAW'}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* TAB 5: DETAIL HASIL SENI TGR */}
          {activeTab === 'seni' && (
            <div className="space-y-4">
              <h3 className="text-xs font-black font-sport tracking-wider text-pink-400 uppercase flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-pink-400" />
                <span>DAFTAR HASIL PERTANDINGAN SENI TGR ({filteredTgr.length} PENAMPILAN)</span>
              </h3>

              <div className="border border-slate-800/90 rounded-2xl bg-slate-950/80 overflow-hidden shadow-xl">
                <div className="max-h-[500px] overflow-y-auto">
                  <table className="w-full text-left text-xs font-mono">
                    <thead className="bg-slate-900 text-slate-400 text-[10px] uppercase font-bold sticky top-0 border-b border-slate-800">
                      <tr>
                        <th className="p-3">Peringkat</th>
                        <th className="p-3">No Urut</th>
                        <th className="p-3">Nama Pesilat</th>
                        <th className="p-3">Kontingen</th>
                        <th className="p-3">Kategori</th>
                        <th className="p-3 text-right">Nilai Akhir</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800/70 text-slate-300">
                      {filteredTgr.map((p, idx) => (
                        <tr key={p.id || idx} className="hover:bg-slate-900/60">
                          <td className="p-3 font-black text-amber-400">#{p.ranking || (idx + 1)}</td>
                          <td className="p-3 text-slate-400">{p.noUrut}</td>
                          <td className="p-3 font-bold text-white uppercase">{p.nama}</td>
                          <td className="p-3 text-amber-300 font-bold uppercase">{p.kontingen}</td>
                          <td className="p-3 text-slate-300">{p.kategori}</td>
                          <td className="p-3 text-right font-sport font-black text-emerald-400 text-sm">
                            {p.finalScore != null ? p.finalScore.toFixed(3) : '-'}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

        </div>

      </div>

      {/* PRINT-ONLY OFFICIAL IPSI REPORT SHEET */}
      <div className="hidden print:block print:p-6 print:text-black print:bg-white text-xs font-serif">
        <div className="text-center border-b-2 border-black pb-4 mb-4">
          <h1 className="text-xl font-bold uppercase tracking-wider">IKATAN PENCAK SILAT INDONESIA (IPSI)</h1>
          <h2 className="text-base font-bold uppercase tracking-wider mt-1">{title}</h2>
          <p className="text-xs font-mono mt-1">LEMBAR REKAPITULASI RESMI PEROLEHAN MEDALI KONTINGEN</p>
          <p className="text-[10px] text-gray-600 mt-1">Tanggal Cetak: {new Date().toLocaleDateString('id-ID', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</p>
        </div>

        <table className="w-full border-collapse border border-black text-[11px] mb-6">
          <thead>
            <tr className="bg-gray-100">
              <th className="border border-black p-1.5 text-center">Peringkat</th>
              <th className="border border-black p-1.5 text-left">Nama Kontingen</th>
              <th className="border border-black p-1.5 text-center">Jumlah Atlet</th>
              <th className="border border-black p-1.5 text-center">Emas 🥇</th>
              <th className="border border-black p-1.5 text-center">Perak 🥈</th>
              <th className="border border-black p-1.5 text-center">Perunggu 🥉</th>
              <th className="border border-black p-1.5 text-center">Total Medali</th>
              <th className="border border-black p-1.5 text-center">Poin</th>
            </tr>
          </thead>
          <tbody>
            {contingentRecords.map((r) => (
              <tr key={r.kontingen}>
                <td className="border border-black p-1 text-center font-bold">{r.rank}</td>
                <td className="border border-black p-1 font-bold">{r.kontingen}</td>
                <td className="border border-black p-1 text-center">{r.totalAtlet}</td>
                <td className="border border-black p-1 text-center font-bold">{r.gold}</td>
                <td className="border border-black p-1 text-center">{r.silver}</td>
                <td className="border border-black p-1 text-center">{r.bronze}</td>
                <td className="border border-black p-1 text-center font-bold">{r.total}</td>
                <td className="border border-black p-1 text-center font-bold">{r.points}</td>
              </tr>
            ))}
          </tbody>
          <tfoot>
            <tr className="font-bold bg-gray-100">
              <td colSpan={2} className="border border-black p-1.5 text-center uppercase">TOTAL KESELURUHAN</td>
              <td className="border border-black p-1.5 text-center">{totalRegisteredAthletes}</td>
              <td className="border border-black p-1.5 text-center">{totalGold}</td>
              <td className="border border-black p-1.5 text-center">{totalSilver}</td>
              <td className="border border-black p-1.5 text-center">{totalBronze}</td>
              <td className="border border-black p-1.5 text-center">{totalMedals}</td>
              <td className="border border-black p-1.5 text-center">-</td>
            </tr>
          </tfoot>
        </table>

        {/* Signatures */}
        <div className="grid grid-cols-2 text-center mt-12 pt-8">
          <div>
            <p className="text-xs">Mengetahui,</p>
            <p className="text-xs font-bold uppercase mt-1">Ketua Pertandingan</p>
            <div className="h-16"></div>
            <p className="text-xs font-bold underline">( ........................................ )</p>
          </div>
          <div>
            <p className="text-xs">Diverifikasi Oleh,</p>
            <p className="text-xs font-bold uppercase mt-1">Sekretaris Pertandingan</p>
            <div className="h-16"></div>
            <p className="text-xs font-bold underline">( ........................................ )</p>
          </div>
        </div>
      </div>

      {/* Upload Kontingen Modal */}
      <UploadKontingenModal
        isOpen={isUploadModalOpen}
        onClose={() => setIsUploadModalOpen(false)}
        onSuccessUpload={handleRefreshData}
      />

      {/* Edit Medali Kontingen Modal */}
      {editingKontingen && (
        <EditMedaliKontingenModal
          isOpen={!!editingKontingen}
          onClose={() => setEditingKontingen(null)}
          kontingenName={editingKontingen.kontingen}
          initialGold={editingKontingen.gold - (editingKontingen.manualAdjustment?.gold || 0)}
          initialSilver={editingKontingen.silver - (editingKontingen.manualAdjustment?.silver || 0)}
          initialBronze={editingKontingen.bronze - (editingKontingen.manualAdjustment?.bronze || 0)}
          existingAdjustment={editingKontingen.manualAdjustment}
          onSave={handleSaveAdjustment}
        />
      )}

    </div>
  );
}
