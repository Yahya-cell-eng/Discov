/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  X, BarChart3, PieChart as PieChartIcon, Activity, TrendingUp, 
  ShieldCheck, Crosshair, Trophy, Award, Zap, ChevronRight, Filter
} from 'lucide-react';
import { 
  ResponsiveContainer, 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  Tooltip, 
  Legend, 
  PieChart, 
  Pie, 
  Cell, 
  AreaChart, 
  Area, 
  CartesianGrid 
} from 'recharts';
import { MatchState, MatchHistory, JuriHit } from '../types';
import { playBeep } from '../utils/sound';

interface MonitorAnalyticsModalProps {
  state: MatchState;
  histories?: MatchHistory[];
  onClose: () => void;
  theme?: 'dark' | 'light';
}

export function MonitorAnalyticsModal({
  state,
  histories = [],
  onClose,
  theme = 'dark'
}: MonitorAnalyticsModalProps) {
  const [activeTab, setActiveTab] = useState<'live' | 'history' | 'kontingen'>('live');

  // 1. ANALISIS PERTANDINGAN LIVE DARI JURI HITS
  const liveStats = useMemo(() => {
    const hits = state.juriHits || [];
    
    // Corner Breakdown
    const merahHits = hits.filter(h => h.sudut === 'merah');
    const biruHits = hits.filter(h => h.sudut === 'biru');

    const merahMasuk = merahHits.filter(h => h.isMatched).length;
    const merahKeluar = merahHits.filter(h => !h.isMatched).length;
    const biruMasuk = biruHits.filter(h => h.isMatched).length;
    const biruKeluar = biruHits.filter(h => !h.isMatched).length;

    const totalMasuk = merahMasuk + biruMasuk;
    const totalKeluar = merahKeluar + biruKeluar;
    const totalSerangan = hits.length;

    const akurasiMerah = merahHits.length > 0 ? Math.round((merahMasuk / merahHits.length) * 100) : 0;
    const akurasiBiru = biruHits.length > 0 ? Math.round((biruMasuk / biruHits.length) * 100) : 0;
    const akurasiTotal = totalSerangan > 0 ? Math.round((totalMasuk / totalSerangan) * 100) : 0;

    // Aksi Breakdown (Pukulan vs Tendangan)
    const punchHits = hits.filter(h => h.aksi === 'punch');
    const kickHits = hits.filter(h => h.aksi === 'kick');

    const punchMasuk = punchHits.filter(h => h.isMatched).length;
    const punchKeluar = punchHits.filter(h => !h.isMatched).length;
    const kickMasuk = kickHits.filter(h => h.isMatched).length;
    const kickKeluar = kickHits.filter(h => !h.isMatched).length;

    // Per Babak Breakdown
    const babakData = [1, 2, 3].map(b => {
      const bHits = hits.filter(h => h.babak === b);
      const bMerahMasuk = bHits.filter(h => h.sudut === 'merah' && h.isMatched).length;
      const bMerahKeluar = bHits.filter(h => h.sudut === 'merah' && !h.isMatched).length;
      const bBiruMasuk = bHits.filter(h => h.sudut === 'biru' && h.isMatched).length;
      const bBiruKeluar = bHits.filter(h => h.sudut === 'biru' && !h.isMatched).length;

      return {
        babak: `Babak ${b}`,
        merahMasuk: bMerahMasuk,
        merahKeluar: bMerahKeluar,
        biruMasuk: bBiruMasuk,
        biruKeluar: bBiruKeluar,
        totalMasuk: bMerahMasuk + bBiruMasuk,
        totalKeluar: bMerahKeluar + bBiruKeluar,
        skorMerah: state.scores.merah[`babak${b}` as keyof typeof state.scores.merah] || 0,
        skorBiru: state.scores.biru[`babak${b}` as keyof typeof state.scores.biru] || 0,
      };
    });

    // Pie Data: Rasio Serangan Masuk vs Keluar
    const pieMasukKeluar = [
      { name: 'Serangan Masuk (Sah)', value: totalMasuk > 0 ? totalMasuk : 1, color: '#10b981' },
      { name: 'Serangan Keluar (Gagal)', value: totalKeluar > 0 ? totalKeluar : (totalMasuk > 0 ? 0 : 1), color: '#ef4444' }
    ];

    // Pie Data: Pukulan vs Tendangan Masuk
    const piePukulanTendangan = [
      { name: 'Pukulan Masuk (👊)', value: punchMasuk > 0 ? punchMasuk : 1, color: '#38bdf8' },
      { name: 'Tendangan Masuk (🦵)', value: kickMasuk > 0 ? kickMasuk : (punchMasuk > 0 ? 0 : 1), color: '#f59e0b' }
    ];

    return {
      merahMasuk,
      merahKeluar,
      biruMasuk,
      biruKeluar,
      totalMasuk,
      totalKeluar,
      totalSerangan,
      akurasiMerah,
      akurasiBiru,
      akurasiTotal,
      punchMasuk,
      punchKeluar,
      kickMasuk,
      kickKeluar,
      babakData,
      pieMasukKeluar,
      piePukulanTendangan
    };
  }, [state]);

  // 2. ANALISIS DATA HISTORI SELURUH PERTANDINGAN
  const historyStats = useMemo(() => {
    const list = [...histories];

    // Tren skor dan serangan per partai
    const trendData = list.map((h, index) => {
      const partaiClean = (h.partai || `P${index + 1}`).replace(/^partai\s*/i, 'P.');
      const skorM = Number(h.skorAkhirMerah) || 0;
      const skorB = Number(h.skorAkhirBiru) || 0;
      const totalSkor = skorM + skorB;
      const selisih = Math.abs(skorM - skorB);

      return {
        partai: partaiClean,
        kelas: h.kelas || '-',
        merah: skorM,
        biru: skorB,
        totalSkor,
        selisih,
        atletMerah: h.atletMerah.nama,
        atletBiru: h.atletBiru.nama,
        winner: h.winner
      };
    });

    const totalMatches = list.length;
    const merahWins = list.filter(h => h.winner === 'merah').length;
    const biruWins = list.filter(h => h.winner === 'biru').length;
    const seriMatches = list.filter(h => !h.winner || h.winner === null).length;

    const totalSkorMerah = list.reduce((acc, h) => acc + (Number(h.skorAkhirMerah) || 0), 0);
    const totalSkorBiru = list.reduce((acc, h) => acc + (Number(h.skorAkhirBiru) || 0), 0);
    const totalPoinMasuk = totalSkorMerah + totalSkorBiru;

    const rataPoinPartai = totalMatches > 0 ? (totalPoinMasuk / totalMatches).toFixed(1) : '0';

    const winDistribution = [
      { name: 'Kemenangan Sudut Merah', value: merahWins, color: '#ef4444' },
      { name: 'Kemenangan Sudut Biru', value: biruWins, color: '#0284c7' },
      ...(seriMatches > 0 ? [{ name: 'Partai Seri', value: seriMatches, color: '#f59e0b' }] : [])
    ];

    // Analisis Kontingen (Poin Masuk vs Kebobolan)
    const kontingenMap: { [kontingen: string]: { masuk: number; kebobolan: number; tanding: number; menang: number } } = {};

    list.forEach(h => {
      const kM = (h.atletMerah.kontingen || 'Umum').trim();
      const kB = (h.atletBiru.kontingen || 'Umum').trim();

      if (!kontingenMap[kM]) kontingenMap[kM] = { masuk: 0, kebobolan: 0, tanding: 0, menang: 0 };
      if (!kontingenMap[kB]) kontingenMap[kB] = { masuk: 0, kebobolan: 0, tanding: 0, menang: 0 };

      kontingenMap[kM].masuk += Number(h.skorAkhirMerah) || 0;
      kontingenMap[kM].kebobolan += Number(h.skorAkhirBiru) || 0;
      kontingenMap[kM].tanding += 1;
      if (h.winner === 'merah') kontingenMap[kM].menang += 1;

      kontingenMap[kB].masuk += Number(h.skorAkhirBiru) || 0;
      kontingenMap[kB].kebobolan += Number(h.skorAkhirMerah) || 0;
      kontingenMap[kB].tanding += 1;
      if (h.winner === 'biru') kontingenMap[kB].menang += 1;
    });

    const kontingenRanking = Object.entries(kontingenMap).map(([name, data]) => {
      const rasio = data.kebobolan > 0 ? (data.masuk / data.kebobolan).toFixed(2) : data.masuk.toFixed(2);
      return {
        name,
        masuk: data.masuk,
        kebobolan: data.kebobolan,
        tanding: data.tanding,
        menang: data.menang,
        rasio: parseFloat(rasio)
      };
    }).sort((a, b) => b.masuk - a.masuk).slice(0, 8);

    return {
      totalMatches,
      merahWins,
      biruWins,
      seriMatches,
      totalSkorMerah,
      totalSkorBiru,
      totalPoinMasuk,
      rataPoinPartai,
      trendData,
      winDistribution,
      kontingenRanking
    };
  }, [histories]);

  return (
    <AnimatePresence>
      <div className="fixed inset-0 bg-slate-950/85 backdrop-blur-md z-[9999] flex items-center justify-center p-3 sm:p-5 select-none">
        <motion.div
          initial={{ scale: 0.94, opacity: 0, y: 15 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.94, opacity: 0, y: 15 }}
          transition={{ duration: 0.22, ease: 'easeOut' }}
          className={`w-full max-w-5xl max-h-[92vh] flex flex-col rounded-2xl border shadow-2xl overflow-hidden ${
            theme === 'dark' ? 'bg-[#080d1e] border-cyan-500/30 shadow-cyan-950/40 text-slate-100' : 'bg-slate-900 border-slate-700 text-white'
          }`}
        >
          {/* MODAL HEADER */}
          <div className="px-5 py-3.5 bg-gradient-to-r from-slate-900 via-cyan-950/40 to-slate-900 border-b border-cyan-500/20 flex items-center justify-between flex-shrink-0">
            <div className="flex items-center gap-2.5">
              <div className="p-2 rounded-xl bg-cyan-500/20 border border-cyan-400/40 text-cyan-400 shadow-md">
                <BarChart3 className="w-5 h-5" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-base font-black uppercase font-mono tracking-wider text-white">
                    STATISTIK & ANALISIS SERANGAN
                  </h3>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-cyan-500/20 text-cyan-300 font-bold border border-cyan-500/30">
                    RECHARTS VISUALIZER
                  </span>
                </div>
                <p className="text-[11px] text-slate-400 font-medium">
                  Rasio serangan masuk vs keluar, efektivitas pukulan/tendangan, dan tren histori pertandingan.
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              {/* Tab Navigation */}
              <div className="flex bg-slate-950/80 p-1 rounded-xl border border-slate-800">
                <button
                  onClick={() => { playBeep('click'); setActiveTab('live'); }}
                  className={`px-3 py-1 rounded-lg text-xs font-bold uppercase transition-all cursor-pointer ${
                    activeTab === 'live' 
                      ? 'bg-cyan-500 text-slate-950 font-black shadow-md' 
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  Partai Live
                </button>
                <button
                  onClick={() => { playBeep('click'); setActiveTab('history'); }}
                  className={`px-3 py-1 rounded-lg text-xs font-bold uppercase transition-all cursor-pointer ${
                    activeTab === 'history' 
                      ? 'bg-cyan-500 text-slate-950 font-black shadow-md' 
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  Histori Turnamen ({histories.length})
                </button>
                <button
                  onClick={() => { playBeep('click'); setActiveTab('kontingen'); }}
                  className={`px-3 py-1 rounded-lg text-xs font-bold uppercase transition-all cursor-pointer ${
                    activeTab === 'kontingen' 
                      ? 'bg-cyan-500 text-slate-950 font-black shadow-md' 
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  Rasio Kontingen
                </button>
              </div>

              <button
                onClick={() => { playBeep('click'); onClose(); }}
                className="p-1.5 rounded-lg bg-slate-800/80 hover:bg-slate-700 text-slate-300 hover:text-white transition-all cursor-pointer border border-slate-700"
                title="Tutup Modal"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* MODAL BODY */}
          <div className="flex-1 overflow-y-auto p-5 custom-scrollbar space-y-5">
            {/* 1. TAB: PARTAI LIVE */}
            {activeTab === 'live' && (
              <div className="space-y-5">
                {/* Top Metrics Cards */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  <div className="bg-slate-900/60 border border-emerald-500/30 p-3 rounded-xl flex flex-col justify-between">
                    <span className="text-[10px] font-mono uppercase text-slate-400 font-bold">Total Serangan Masuk (Sah)</span>
                    <div className="flex items-baseline justify-between mt-1">
                      <span className="text-2xl font-black font-mono text-emerald-400">{liveStats.totalMasuk}</span>
                      <span className="text-xs font-bold font-mono text-emerald-300/80 bg-emerald-950/60 px-1.5 py-0.5 rounded border border-emerald-500/30">
                        {liveStats.akurasiTotal}% Akurasi
                      </span>
                    </div>
                  </div>

                  <div className="bg-slate-900/60 border border-rose-500/30 p-3 rounded-xl flex flex-col justify-between">
                    <span className="text-[10px] font-mono uppercase text-slate-400 font-bold">Serangan Keluar (Gagal)</span>
                    <div className="flex items-baseline justify-between mt-1">
                      <span className="text-2xl font-black font-mono text-rose-400">{liveStats.totalKeluar}</span>
                      <span className="text-xs font-bold font-mono text-slate-400 bg-slate-950 px-1.5 py-0.5 rounded border border-slate-800">
                        {liveStats.totalSerangan} Percobaan
                      </span>
                    </div>
                  </div>

                  <div className="bg-slate-900/60 border border-blue-500/30 p-3 rounded-xl flex flex-col justify-between">
                    <span className="text-[10px] font-mono uppercase text-blue-400 font-bold">Serangan Masuk Biru</span>
                    <div className="flex items-baseline justify-between mt-1">
                      <span className="text-2xl font-black font-mono text-cyan-400">{liveStats.biruMasuk}</span>
                      <span className="text-xs font-bold font-mono text-cyan-300 bg-blue-950/60 px-1.5 py-0.5 rounded border border-blue-500/30">
                        {liveStats.akurasiBiru}% Rasio
                      </span>
                    </div>
                  </div>

                  <div className="bg-slate-900/60 border border-red-500/30 p-3 rounded-xl flex flex-col justify-between">
                    <span className="text-[10px] font-mono uppercase text-red-400 font-bold">Serangan Masuk Merah</span>
                    <div className="flex items-baseline justify-between mt-1">
                      <span className="text-2xl font-black font-mono text-red-400">{liveStats.merahMasuk}</span>
                      <span className="text-xs font-bold font-mono text-rose-300 bg-red-950/60 px-1.5 py-0.5 rounded border border-red-500/30">
                        {liveStats.akurasiMerah}% Rasio
                      </span>
                    </div>
                  </div>
                </div>

                {/* Charts Row: Bar Chart per Babak & Pie Chart Rasio */}
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
                  {/* Left: Bar Chart Serangan Masuk vs Keluar per Babak */}
                  <div className="lg:col-span-8 bg-slate-900/50 border border-slate-800 rounded-xl p-4 flex flex-col">
                    <div className="flex items-center justify-between mb-3 border-b border-slate-800 pb-2">
                      <h4 className="text-xs font-black uppercase text-slate-200 tracking-wider font-mono flex items-center gap-1.5">
                        <Activity className="w-3.5 h-3.5 text-cyan-400" />
                        <span>Distribusi Serangan Masuk vs Keluar per Babak</span>
                      </h4>
                      <span className="text-[10px] font-mono text-slate-400">Partai {state.partai} - {state.kelas}</span>
                    </div>

                    <div className="h-64 w-full">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={liveStats.babakData} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                          <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" opacity={0.6} />
                          <XAxis dataKey="babak" stroke="#64748b" tick={{ fill: '#94a3b8', fontSize: 11 }} />
                          <YAxis stroke="#64748b" tick={{ fill: '#94a3b8', fontSize: 11 }} />
                          <Tooltip 
                            contentStyle={{ backgroundColor: '#090d1a', borderColor: '#334155', borderRadius: '8px', fontSize: '11px', color: '#fff' }}
                            itemStyle={{ padding: '2px 0' }}
                          />
                          <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '8px' }} />
                          <Bar dataKey="merahMasuk" name="Merah Masuk (Sah)" fill="#ef4444" radius={[4, 4, 0, 0]} />
                          <Bar dataKey="merahKeluar" name="Merah Keluar (Gagal)" fill="#991b1b" opacity={0.6} radius={[4, 4, 0, 0]} />
                          <Bar dataKey="biruMasuk" name="Biru Masuk (Sah)" fill="#0ea5e9" radius={[4, 4, 0, 0]} />
                          <Bar dataKey="biruKeluar" name="Biru Keluar (Gagal)" fill="#0369a1" opacity={0.6} radius={[4, 4, 0, 0]} />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  </div>

                  {/* Right: Pie Charts (Rasio Serangan Masuk vs Keluar & Pukulan vs Tendangan) */}
                  <div className="lg:col-span-4 flex flex-col gap-4">
                    {/* Donut 1: Masuk vs Keluar */}
                    <div className="bg-slate-900/50 border border-slate-800 rounded-xl p-3.5 flex flex-col items-center">
                      <span className="text-[10px] font-black uppercase text-slate-400 font-mono self-start mb-1">
                        Rasio Masuk vs Keluar
                      </span>
                      <div className="h-36 w-full flex items-center justify-center">
                        <ResponsiveContainer width="100%" height="100%">
                          <PieChart>
                            <Pie
                              data={liveStats.pieMasukKeluar}
                              cx="50%"
                              cy="50%"
                              innerRadius={32}
                              outerRadius={52}
                              paddingAngle={4}
                              dataKey="value"
                            >
                              {liveStats.pieMasukKeluar.map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={entry.color} />
                              ))}
                            </Pie>
                            <Tooltip contentStyle={{ backgroundColor: '#090d1a', borderColor: '#334155', borderRadius: '8px', fontSize: '11px' }} />
                          </PieChart>
                        </ResponsiveContainer>
                      </div>
                      <div className="flex justify-around w-full text-[10px] font-mono mt-1 pt-2 border-t border-slate-800/80">
                        <div className="flex items-center gap-1.5">
                          <span className="w-2 h-2 rounded-full bg-emerald-500" />
                          <span className="text-slate-300">Masuk: {liveStats.totalMasuk}</span>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <span className="w-2 h-2 rounded-full bg-red-500" />
                          <span className="text-slate-300">Keluar: {liveStats.totalKeluar}</span>
                        </div>
                      </div>
                    </div>

                    {/* Donut 2: Pukulan vs Tendangan */}
                    <div className="bg-slate-900/50 border border-slate-800 rounded-xl p-3.5 flex flex-col items-center">
                      <span className="text-[10px] font-black uppercase text-slate-400 font-mono self-start mb-1">
                        Jenis Serangan Masuk
                      </span>
                      <div className="h-36 w-full flex items-center justify-center">
                        <ResponsiveContainer width="100%" height="100%">
                          <PieChart>
                            <Pie
                              data={liveStats.piePukulanTendangan}
                              cx="50%"
                              cy="50%"
                              innerRadius={32}
                              outerRadius={52}
                              paddingAngle={4}
                              dataKey="value"
                            >
                              {liveStats.piePukulanTendangan.map((entry, index) => (
                                <Cell key={`cell-action-${index}`} fill={entry.color} />
                              ))}
                            </Pie>
                            <Tooltip contentStyle={{ backgroundColor: '#090d1a', borderColor: '#334155', borderRadius: '8px', fontSize: '11px' }} />
                          </PieChart>
                        </ResponsiveContainer>
                      </div>
                      <div className="flex justify-around w-full text-[10px] font-mono mt-1 pt-2 border-t border-slate-800/80">
                        <div className="flex items-center gap-1.5">
                          <span className="w-2 h-2 rounded-full bg-sky-400" />
                          <span className="text-slate-300">Pukul: {liveStats.punchMasuk}</span>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <span className="w-2 h-2 rounded-full bg-amber-500" />
                          <span className="text-slate-300">Tendang: {liveStats.kickMasuk}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* 2. TAB: HISTORI TURNAMEN */}
            {activeTab === 'history' && (
              <div className="space-y-5">
                {histories.length === 0 ? (
                  <div className="py-16 text-center text-slate-400 font-mono text-xs bg-slate-900/30 border border-dashed border-slate-800 rounded-2xl flex flex-col items-center justify-center gap-2">
                    <Crosshair className="w-8 h-8 text-slate-600" />
                    <span>Belum ada histori pertandingan tanding yang tersimpan.</span>
                    <span className="text-[10px] text-slate-500">Selesaikan partai pertandingan di panel Sekretaris untuk mengumpulkan riwayat statistik analitik turnamen.</span>
                  </div>
                ) : (
                  <>
                    {/* Metrics Row */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                      <div className="bg-slate-900/60 border border-slate-800 p-3 rounded-xl flex flex-col justify-between">
                        <span className="text-[10px] font-mono uppercase text-slate-400 font-bold">Total Partai Selesai</span>
                        <div className="text-2xl font-black font-mono text-white mt-1">{historyStats.totalMatches}</div>
                      </div>
                      <div className="bg-slate-900/60 border border-emerald-500/30 p-3 rounded-xl flex flex-col justify-between">
                        <span className="text-[10px] font-mono uppercase text-slate-400 font-bold">Total Poin Masuk</span>
                        <div className="text-2xl font-black font-mono text-emerald-400 mt-1">{historyStats.totalPoinMasuk}</div>
                      </div>
                      <div className="bg-slate-900/60 border border-cyan-500/30 p-3 rounded-xl flex flex-col justify-between">
                        <span className="text-[10px] font-mono uppercase text-slate-400 font-bold">Rata-rata Skor per Partai</span>
                        <div className="text-2xl font-black font-mono text-cyan-400 mt-1">{historyStats.rataPoinPartai}</div>
                      </div>
                      <div className="bg-slate-900/60 border border-purple-500/30 p-3 rounded-xl flex flex-col justify-between">
                        <span className="text-[10px] font-mono uppercase text-slate-400 font-bold">Dominasi Pemenang</span>
                        <div className="text-xs font-mono font-bold mt-1 text-slate-200">
                          <span className="text-red-400 font-black">{historyStats.merahWins} Merah</span> vs <span className="text-cyan-400 font-black">{historyStats.biruWins} Biru</span>
                        </div>
                      </div>
                    </div>

                    {/* Area Chart: Tren Skor Masuk Berdasarkan Histori Partai */}
                    <div className="bg-slate-900/50 border border-slate-800 rounded-xl p-4">
                      <div className="flex items-center justify-between mb-3 border-b border-slate-800 pb-2">
                        <h4 className="text-xs font-black uppercase text-slate-200 tracking-wider font-mono flex items-center gap-1.5">
                          <TrendingUp className="w-3.5 h-3.5 text-emerald-400" />
                          <span>Tren Poin Serangan Masuk per Partai Pertandingan</span>
                        </h4>
                        <span className="text-[10px] font-mono text-slate-400">Merah vs Biru</span>
                      </div>

                      <div className="h-64 w-full">
                        <ResponsiveContainer width="100%" height="100%">
                          <AreaChart data={historyStats.trendData} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                            <defs>
                              <linearGradient id="colorMerah" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor="#ef4444" stopOpacity={0.7}/>
                                <stop offset="95%" stopColor="#ef4444" stopOpacity={0.05}/>
                              </linearGradient>
                              <linearGradient id="colorBiru" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor="#0ea5e9" stopOpacity={0.7}/>
                                <stop offset="95%" stopColor="#0ea5e9" stopOpacity={0.05}/>
                              </linearGradient>
                            </defs>
                            <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" opacity={0.6} />
                            <XAxis dataKey="partai" stroke="#64748b" tick={{ fill: '#94a3b8', fontSize: 11 }} />
                            <YAxis stroke="#64748b" tick={{ fill: '#94a3b8', fontSize: 11 }} />
                            <Tooltip 
                              contentStyle={{ backgroundColor: '#090d1a', borderColor: '#334155', borderRadius: '8px', fontSize: '11px', color: '#fff' }}
                            />
                            <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '8px' }} />
                            <Area type="monotone" dataKey="merah" name="Poin Masuk Merah" stroke="#ef4444" fillOpacity={1} fill="url(#colorMerah)" />
                            <Area type="monotone" dataKey="biru" name="Poin Masuk Biru" stroke="#0ea5e9" fillOpacity={1} fill="url(#colorBiru)" />
                          </AreaChart>
                        </ResponsiveContainer>
                      </div>
                    </div>

                    {/* Table of Historic Matches */}
                    <div className="bg-slate-900/50 border border-slate-800 rounded-xl p-3.5">
                      <span className="text-xs font-black uppercase text-slate-300 font-mono block mb-2">
                        Tabel Log Poin & Kemenangan Partai
                      </span>
                      <div className="overflow-x-auto max-h-48 custom-scrollbar">
                        <table className="w-full text-left text-xs font-mono border-collapse">
                          <thead>
                            <tr className="border-b border-slate-800 text-slate-400 text-[10px] uppercase">
                              <th className="py-2 px-3">Partai</th>
                              <th className="py-2 px-3">Kelas</th>
                              <th className="py-2 px-3 text-red-400">Sudut Merah</th>
                              <th className="py-2 px-3 text-center">Skor Akhir</th>
                              <th className="py-2 px-3 text-blue-400">Sudut Biru</th>
                              <th className="py-2 px-3">Pemenang</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-800/60">
                            {historyStats.trendData.map((h, i) => (
                              <tr key={i} className="hover:bg-slate-800/30">
                                <td className="py-1.5 px-3 font-bold text-amber-400">{h.partai}</td>
                                <td className="py-1.5 px-3 text-slate-300">{h.kelas}</td>
                                <td className="py-1.5 px-3 text-red-300 truncate max-w-[10rem]">{h.atletMerah}</td>
                                <td className="py-1.5 px-3 text-center font-bold">
                                  <span className="text-red-400">{h.merah}</span> - <span className="text-cyan-400">{h.biru}</span>
                                </td>
                                <td className="py-1.5 px-3 text-blue-300 truncate max-w-[10rem]">{h.atletBiru}</td>
                                <td className="py-1.5 px-3 font-bold">
                                  {h.winner === 'merah' ? (
                                    <span className="text-red-400">MERAH</span>
                                  ) : h.winner === 'biru' ? (
                                    <span className="text-cyan-400">BIRU</span>
                                  ) : (
                                    <span className="text-amber-400">SERI</span>
                                  )}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  </>
                )}
              </div>
            )}

            {/* 3. TAB: RASIO KONTINGEN */}
            {activeTab === 'kontingen' && (
              <div className="space-y-4">
                <div className="bg-slate-900/50 border border-slate-800 rounded-xl p-4">
                  <div className="flex items-center justify-between mb-3 border-b border-slate-800 pb-2">
                    <h4 className="text-xs font-black uppercase text-slate-200 tracking-wider font-mono flex items-center gap-1.5">
                      <ShieldCheck className="w-3.5 h-3.5 text-cyan-400" />
                      <span>Perbandingan Poin Masuk (Menyerang) vs Kebobolan (Keluar) per Kontingen</span>
                    </h4>
                    <span className="text-[10px] font-mono text-slate-400">Top 8 Kontingen</span>
                  </div>

                  {historyStats.kontingenRanking.length === 0 ? (
                    <div className="py-12 text-center text-slate-400 font-mono text-xs">
                      Belum ada data kontingen dari riwayat pertandingan.
                    </div>
                  ) : (
                    <div className="h-72 w-full">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={historyStats.kontingenRanking} margin={{ top: 10, right: 10, left: -10, bottom: 20 }}>
                          <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" opacity={0.6} />
                          <XAxis dataKey="name" stroke="#64748b" tick={{ fill: '#94a3b8', fontSize: 10 }} interval={0} angle={-15} textAnchor="end" />
                          <YAxis stroke="#64748b" tick={{ fill: '#94a3b8', fontSize: 11 }} />
                          <Tooltip 
                            contentStyle={{ backgroundColor: '#090d1a', borderColor: '#334155', borderRadius: '8px', fontSize: '11px', color: '#fff' }}
                          />
                          <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '15px' }} />
                          <Bar dataKey="masuk" name="Poin Masuk (Offense)" fill="#10b981" radius={[4, 4, 0, 0]} />
                          <Bar dataKey="kebobolan" name="Poin Kebobolan (Defense)" fill="#f43f5e" radius={[4, 4, 0, 0]} />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  )}
                </div>

                {/* Kontingen Stat Cards */}
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
                  {historyStats.kontingenRanking.slice(0, 4).map((k, idx) => (
                    <div key={idx} className="bg-slate-900/60 border border-slate-800 p-3 rounded-xl flex flex-col justify-between">
                      <div className="flex justify-between items-center mb-1">
                        <span className="text-[9px] font-mono uppercase text-amber-400 font-bold">Peringkat {idx + 1}</span>
                        <span className="text-[9px] font-mono text-slate-400">{k.tanding} Partai</span>
                      </div>
                      <div className="text-xs font-black text-white uppercase truncate">{k.name}</div>
                      <div className="mt-2 flex items-center justify-between text-[10px] font-mono border-t border-slate-800 pt-1.5">
                        <span className="text-emerald-400 font-bold">+{k.masuk} Poin</span>
                        <span className="text-rose-400 font-bold">-{k.kebobolan} Poin</span>
                        <span className="text-cyan-300 font-bold bg-cyan-950/60 px-1 rounded">R: {k.rasio}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* MODAL FOOTER */}
          <div className="px-5 py-3 bg-slate-950/80 border-t border-slate-800/80 flex items-center justify-between text-[11px] font-mono text-slate-400">
            <span>Sistem Skoring Pencak Silat • Analitik Grafis Recharts Real-Time</span>
            <button
              onClick={() => { playBeep('click'); onClose(); }}
              className="px-4 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-white font-bold transition-all cursor-pointer text-xs uppercase"
            >
              Tutup
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
