/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo } from 'react';
import {
  ResponsiveContainer,
  ComposedChart,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ReferenceLine,
  Cell,
  Line
} from 'recharts';
import { 
  BarChart3, 
  Layers, 
  TrendingUp, 
  Scale, 
  Info, 
  X, 
  CheckCircle2, 
  AlertTriangle,
  Award,
  Maximize2,
  Minimize2,
  ChevronRight
} from 'lucide-react';
import { TGRPeserta } from '../types';

export interface TGRJuriScoreDistributionChartProps {
  peserta: TGRPeserta;
  jumlahJuri?: number;
  theme?: 'dark' | 'light';
  title?: string;
  isCompact?: boolean;
  onClose?: () => void;
  showModalOverlay?: boolean;
}

export const TGRJuriScoreDistributionChart: React.FC<TGRJuriScoreDistributionChartProps> = ({
  peserta,
  jumlahJuri = 6,
  theme = 'dark',
  title,
  isCompact = false,
  onClose,
  showModalOverlay = false,
}) => {
  const [activeTab, setActiveTab] = useState<'total' | 'breakdown' | 'deviation'>('total');

  // Compute jury score data
  const { chartData, median, mean, stdDev, minScore, maxScore, range, allFinalized, finalizedCount } = useMemo(() => {
    const rawScores: { num: number; key: string; score: number; kebenaran: number; kemantapan: number; isFinalized: boolean }[] = [];
    const validScores: number[] = [];

    const totalJ = Math.max(3, Math.min(jumlahJuri || 6, 10));

    for (let i = 1; i <= totalJ; i++) {
      const key = `juri${i}`;
      const score = peserta.scores && peserta.scores[key] !== undefined ? peserta.scores[key] : 9.90;
      const kebenaran = peserta.kebenaranScores && peserta.kebenaranScores[key] !== undefined ? peserta.kebenaranScores[key] : score;
      const kemantapan = parseFloat(Math.max(0, score - kebenaran).toFixed(3));
      const isFinalized = peserta.finalizedJuries?.includes(key) || false;

      rawScores.push({
        num: i,
        key,
        score,
        kebenaran,
        kemantapan,
        isFinalized,
      });

      if (peserta.scores && peserta.scores[key] !== undefined) {
        validScores.push(score);
      }
    }

    // Median calculation (IPSI Standard)
    const sorted = [...(validScores.length > 0 ? validScores : rawScores.map(r => r.score))].sort((a, b) => a - b);
    let med = 9.90;
    if (sorted.length > 0) {
      const mid = Math.floor(sorted.length / 2);
      med = sorted.length % 2 !== 0 ? sorted[mid] : (sorted[mid - 1] + sorted[mid]) / 2;
    }

    // Mean calculation
    const currentScores = validScores.length > 0 ? validScores : rawScores.map(r => r.score);
    const avg = currentScores.reduce((sum, v) => sum + v, 0) / (currentScores.length || 1);

    // Standard deviation
    const variance = currentScores.reduce((acc, v) => acc + Math.pow(v - avg, 2), 0) / (currentScores.length || 1);
    const sd = Math.sqrt(variance);

    const min = Math.min(...currentScores);
    const max = Math.max(...currentScores);

    // Map chart items with deviations
    const data = rawScores.map(item => {
      const diff = parseFloat((item.score - med).toFixed(3));
      const isAtMedian = Math.abs(diff) < 0.005;

      return {
        juri: `Juri ${item.num}`,
        juriShort: `J${item.num}`,
        juriNum: item.num,
        score: parseFloat(item.score.toFixed(3)),
        kebenaran: parseFloat(item.kebenaran.toFixed(3)),
        kemantapan: parseFloat(item.kemantapan.toFixed(3)),
        medianRef: parseFloat(med.toFixed(3)),
        meanRef: parseFloat(avg.toFixed(3)),
        diffFromMedian: diff,
        isFinalized: item.isFinalized,
        isAtMedian,
      };
    });

    const finCount = rawScores.filter(r => r.isFinalized).length;

    return {
      chartData: data,
      median: parseFloat(med.toFixed(3)),
      mean: parseFloat(avg.toFixed(3)),
      stdDev: parseFloat(sd.toFixed(4)),
      minScore: min,
      maxScore: max,
      range: parseFloat((max - min).toFixed(3)),
      allFinalized: finCount >= totalJ,
      finalizedCount: finCount,
    };
  }, [peserta, jumlahJuri]);

  // Dynamic Y-Axis Domain so subtle score variances (e.g. 9.85 to 9.92) are prominent and readable
  const yDomain = useMemo(() => {
    const margin = 0.08;
    const low = Math.max(0, Math.floor((minScore - margin) * 20) / 20);
    const high = Math.min(10, Math.ceil((maxScore + margin) * 20) / 20);
    return [low, high];
  }, [minScore, maxScore]);

  // Custom Glassmorphic Tooltip
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-slate-950/95 border-2 border-cyan-500/60 p-3 rounded-2xl shadow-2xl backdrop-blur-xl text-left text-xs font-mono space-y-1.5 min-w-[200px]">
          <div className="flex items-center justify-between border-b border-slate-800 pb-1.5">
            <span className="font-black text-white font-sport text-sm">{data.juri}</span>
            <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold ${
              data.isFinalized ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40' : 'bg-amber-500/20 text-amber-300'
            }`}>
              {data.isFinalized ? 'TERKUNCI ✓' : 'DRAFT'}
            </span>
          </div>

          <div className="flex justify-between items-center text-slate-300">
            <span>Nilai Total Juri:</span>
            <span className="font-black text-amber-400 text-sm">{data.score.toFixed(3)}</span>
          </div>

          <div className="flex justify-between items-center text-slate-400 text-[11px]">
            <span>- Nilai Kebenaran:</span>
            <span className="text-cyan-300 font-bold">{data.kebenaran.toFixed(3)}</span>
          </div>

          <div className="flex justify-between items-center text-slate-400 text-[11px]">
            <span>- Kemantapan/Tuning:</span>
            <span className="text-purple-300 font-bold">+{data.kemantapan.toFixed(3)}</span>
          </div>

          <div className="pt-1.5 border-t border-slate-800 flex justify-between items-center text-[10px]">
            <span className="text-slate-400">Selisih vs Median:</span>
            <span className={`font-black ${
              data.diffFromMedian === 0 ? 'text-emerald-400' : data.diffFromMedian > 0 ? 'text-cyan-300' : 'text-rose-400'
            }`}>
              {data.diffFromMedian > 0 ? `+${data.diffFromMedian.toFixed(3)}` : data.diffFromMedian.toFixed(3)}
            </span>
          </div>
        </div>
      );
    }
    return null;
  };

  // Color generator for bars
  const getBarColor = (item: any) => {
    if (item.isAtMedian) return '#10b981'; // Emerald for median
    if (item.diffFromMedian > 0) return '#06b6d4'; // Cyan for higher
    return '#6366f1'; // Indigo for lower
  };

  const content = (
    <div className={`w-full flex flex-col ${
      theme === 'dark' 
        ? 'bg-gradient-to-b from-slate-950/95 via-slate-900/98 to-slate-950/95 text-slate-100 border-slate-800' 
        : 'bg-white text-slate-900 border-slate-200'
    } border-2 rounded-3xl shadow-2xl p-4 sm:p-6 overflow-hidden relative select-none`}>
      
      {/* Decorative background glow */}
      <div className="absolute top-0 right-0 w-80 h-80 rounded-full bg-cyan-600/10 blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-80 h-80 rounded-full bg-amber-600/10 blur-3xl pointer-events-none" />

      {/* Header Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-800 pb-3 mb-4 z-10">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-cyan-500/20 border-2 border-cyan-400/60 flex items-center justify-center text-cyan-400 shadow-lg shadow-cyan-500/20">
            <BarChart3 className="w-5 h-5 animate-pulse" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-full bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 text-[9.5px] font-mono font-black uppercase tracking-wider">
                EVALUASI TRANSPARAN RECHARTS
              </span>
              <span className="text-[10px] font-mono text-slate-400">
                {peserta.kategori.toUpperCase()} • UNDIAN #{peserta.noUndian || peserta.noUrut || 1}
              </span>
            </div>
            <h2 className="text-base sm:text-lg font-black uppercase font-sport tracking-wide text-white mt-0.5 flex items-center gap-2">
              <span>{title || 'GRAFIK DISTRIBUSI NILAI JURI SENI'}</span>
              <span className="text-amber-400 font-mono text-xs font-bold">
                ({peserta.nama} - {peserta.kontingen})
              </span>
            </h2>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* View Mode Tabs */}
          <div className="flex bg-slate-900 p-1 rounded-xl border border-slate-800">
            <button
              onClick={() => setActiveTab('total')}
              className={`px-3 py-1 rounded-lg text-xs font-black font-sport uppercase tracking-wider transition-all cursor-pointer ${
                activeTab === 'total' 
                  ? 'bg-cyan-500 text-slate-950 shadow-md' 
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Nilai Total
            </button>
            <button
              onClick={() => setActiveTab('breakdown')}
              className={`px-3 py-1 rounded-lg text-xs font-black font-sport uppercase tracking-wider transition-all cursor-pointer ${
                activeTab === 'breakdown' 
                  ? 'bg-cyan-500 text-slate-950 shadow-md' 
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Kebenaran & Tuning
            </button>
            <button
              onClick={() => setActiveTab('deviation')}
              className={`px-3 py-1 rounded-lg text-xs font-black font-sport uppercase tracking-wider transition-all cursor-pointer ${
                activeTab === 'deviation' 
                  ? 'bg-cyan-500 text-slate-950 shadow-md' 
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Deviasi Median
            </button>
          </div>

          {onClose && (
            <button
              onClick={onClose}
              className="p-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors cursor-pointer"
              title="Tutup Grafik Evaluasi"
            >
              <X className="w-5 h-5" />
            </button>
          )}
        </div>
      </div>

      {/* Summary KPI Badges */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-2.5 mb-4 z-10">
        {/* 1. Nilai Median IPSI */}
        <div className="bg-slate-900/90 border-2 border-emerald-500/50 rounded-2xl p-3 flex flex-col justify-between shadow-md shadow-emerald-950/20">
          <span className="text-[9px] font-black uppercase tracking-wider text-emerald-400 font-mono flex items-center gap-1">
            <Scale className="w-3.5 h-3.5" />
            MEDIAN (SKOR RESMI)
          </span>
          <div className="mt-1 flex items-baseline justify-between">
            <span className="text-2xl font-black font-mono text-emerald-300">
              {median.toFixed(3)}
            </span>
            <span className="text-[9px] text-slate-400 font-mono font-bold">IPSI 2022</span>
          </div>
        </div>

        {/* 2. Rata-Rata (Mean) */}
        <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-3 flex flex-col justify-between">
          <span className="text-[9px] font-black uppercase tracking-wider text-cyan-400 font-mono flex items-center gap-1">
            <TrendingUp className="w-3.5 h-3.5" />
            RATA-RATA (MEAN)
          </span>
          <div className="mt-1 flex items-baseline justify-between">
            <span className="text-2xl font-black font-mono text-cyan-300">
              {mean.toFixed(3)}
            </span>
            <span className="text-[9px] text-slate-400 font-mono">Semua Juri</span>
          </div>
        </div>

        {/* 3. Standar Deviasi */}
        <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-3 flex flex-col justify-between">
          <span className="text-[9px] font-black uppercase tracking-wider text-amber-400 font-mono flex items-center gap-1">
            <Info className="w-3.5 h-3.5" />
            STANDAR DEVIASI
          </span>
          <div className="mt-1 flex items-baseline justify-between">
            <span className="text-2xl font-black font-mono text-amber-300">
              {stdDev.toFixed(4)}
            </span>
            <span className={`text-[9px] font-bold font-mono ${stdDev < 0.05 ? 'text-emerald-400' : 'text-amber-400'}`}>
              {stdDev < 0.05 ? 'KONSISTEN' : 'VARIATIF'}
            </span>
          </div>
        </div>

        {/* 4. Rentang Selisih (Range) */}
        <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-3 flex flex-col justify-between">
          <span className="text-[9px] font-black uppercase tracking-wider text-purple-400 font-mono">
            RENTANG (MAX - MIN)
          </span>
          <div className="mt-1 flex items-baseline justify-between">
            <span className="text-2xl font-black font-mono text-purple-300">
              {range.toFixed(3)}
            </span>
            <span className="text-[9px] text-slate-400 font-mono">{minScore.toFixed(2)} - {maxScore.toFixed(2)}</span>
          </div>
        </div>

        {/* 5. Status Verifikasi Juri */}
        <div className="col-span-2 sm:col-span-1 bg-slate-900/80 border border-slate-800 rounded-2xl p-3 flex flex-col justify-between">
          <span className="text-[9px] font-black uppercase tracking-wider text-slate-400 font-mono flex items-center gap-1">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
            STATUS JURI
          </span>
          <div className="mt-1 flex items-baseline justify-between">
            <span className="text-xl font-black font-mono text-white">
              {finalizedCount}/{chartData.length}
            </span>
            <span className={`text-[9px] font-bold font-mono ${allFinalized ? 'text-emerald-400' : 'text-amber-400'}`}>
              {allFinalized ? 'LENGKAP' : 'LIVE PROGRES'}
            </span>
          </div>
        </div>
      </div>

      {/* Main Recharts Visualization Canvas */}
      <div className="w-full bg-slate-950/80 border border-slate-800/90 rounded-2xl p-3 sm:p-4 mb-4 shadow-inner relative z-10">
        <div className="w-full h-64 sm:h-72">
          <ResponsiveContainer width="100%" height="100%">
            {activeTab === 'total' ? (
              <ComposedChart data={chartData} margin={{ top: 15, right: 20, left: 0, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
                <XAxis 
                  dataKey="juri" 
                  stroke="#94a3b8" 
                  fontSize={11} 
                  fontWeight="bold"
                  tickLine={false} 
                />
                <YAxis 
                  domain={yDomain} 
                  stroke="#94a3b8" 
                  fontSize={11} 
                  tickFormatter={(v) => v.toFixed(2)}
                  tickCount={6}
                />
                <Tooltip content={<CustomTooltip />} />
                
                {/* Reference Line for Median (IPSI Anchor) */}
                <ReferenceLine 
                  y={median} 
                  stroke="#10b981" 
                  strokeDasharray="4 4" 
                  strokeWidth={2.5}
                  label={{
                    value: `MEDIAN: ${median.toFixed(3)}`,
                    fill: '#34d399',
                    position: 'top',
                    fontSize: 10,
                    fontWeight: 'bold',
                  }} 
                />

                {/* Reference Line for Mean */}
                <ReferenceLine 
                  y={mean} 
                  stroke="#06b6d4" 
                  strokeDasharray="2 2" 
                  strokeWidth={1.5}
                  label={{
                    value: `MEAN: ${mean.toFixed(3)}`,
                    fill: '#22d3ee',
                    position: 'bottom',
                    fontSize: 9,
                  }} 
                />

                {/* The Judge Score Bars */}
                <Bar dataKey="score" radius={[8, 8, 0, 0]} maxBarSize={45}>
                  {chartData.map((entry, index) => (
                    <Cell 
                      key={`cell-${index}`} 
                      fill={getBarColor(entry)} 
                      stroke={entry.isAtMedian ? '#34d399' : '#0891b2'}
                      strokeWidth={entry.isAtMedian ? 2 : 1}
                    />
                  ))}
                </Bar>
              </ComposedChart>
            ) : activeTab === 'breakdown' ? (
              /* Stacked Component Breakdown: Kebenaran + Kemantapan/Tuning */
              <BarChart data={chartData} margin={{ top: 15, right: 20, left: 0, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
                <XAxis dataKey="juri" stroke="#94a3b8" fontSize={11} fontWeight="bold" />
                <YAxis domain={yDomain} stroke="#94a3b8" fontSize={11} tickFormatter={(v) => v.toFixed(2)} />
                <Tooltip content={<CustomTooltip />} />
                <Legend 
                  verticalAlign="top" 
                  height={36} 
                  formatter={(val) => <span className="text-xs font-mono font-bold text-slate-300">{val}</span>} 
                />
                
                <ReferenceLine y={median} stroke="#10b981" strokeDasharray="4 4" strokeWidth={2} />
                
                <Bar dataKey="kebenaran" name="Nilai Kebenaran" stackId="a" fill="#0284c7" radius={[0, 0, 0, 0]} maxBarSize={45} />
                <Bar dataKey="kemantapan" name="Kemantapan / Tuning" stackId="a" fill="#a855f7" radius={[8, 8, 0, 0]} maxBarSize={45} />
              </BarChart>
            ) : (
              /* Deviation Chart from Median */
              <BarChart data={chartData} margin={{ top: 15, right: 20, left: 0, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
                <XAxis dataKey="juri" stroke="#94a3b8" fontSize={11} fontWeight="bold" />
                <YAxis 
                  stroke="#94a3b8" 
                  fontSize={11} 
                  tickFormatter={(v) => (v > 0 ? `+${v.toFixed(3)}` : v.toFixed(3))}
                />
                <Tooltip content={<CustomTooltip />} />
                <ReferenceLine y={0} stroke="#10b981" strokeWidth={2} label={{ value: 'MEDIAN 0.000', fill: '#34d399', fontSize: 10 }} />
                
                <Bar dataKey="diffFromMedian" name="Deviasi dari Median" radius={[4, 4, 4, 4]} maxBarSize={45}>
                  {chartData.map((entry, index) => (
                    <Cell 
                      key={`dev-cell-${index}`} 
                      fill={entry.diffFromMedian === 0 ? '#10b981' : entry.diffFromMedian > 0 ? '#06b6d4' : '#f43f5e'} 
                    />
                  ))}
                </Bar>
              </BarChart>
            )}
          </ResponsiveContainer>
        </div>

        {/* Legend color key */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-slate-800/80 text-[10px] font-mono">
          <div className="flex items-center gap-4 flex-wrap">
            <span className="flex items-center gap-1.5 text-slate-300">
              <span className="w-3 h-3 rounded-md bg-emerald-500 inline-block" />
              <span>Nilai Median ({median.toFixed(3)})</span>
            </span>
            <span className="flex items-center gap-1.5 text-slate-300">
              <span className="w-3 h-3 rounded-md bg-cyan-500 inline-block" />
              <span>Nilai di Atas Median</span>
            </span>
            <span className="flex items-center gap-1.5 text-slate-300">
              <span className="w-3 h-3 rounded-md bg-indigo-500 inline-block" />
              <span>Nilai di Bawah Median</span>
            </span>
          </div>

          <span className="text-slate-400 font-semibold">
            Standar IPSI: Nilai Median adalah konsensus resmi penentuan ranking.
          </span>
        </div>
      </div>

      {/* Detailed Table Matrix of Judge Scores */}
      <div className="w-full overflow-x-auto rounded-2xl border border-slate-800 bg-slate-900/60 z-10">
        <table className="w-full text-xs font-mono text-left">
          <thead className="bg-slate-950 text-slate-400 text-[10px] uppercase font-bold border-b border-slate-800">
            <tr>
              <th className="py-2.5 px-3">Juri</th>
              <th className="py-2.5 px-3">Kebenaran</th>
              <th className="py-2.5 px-3">Tuning / Mantap</th>
              <th className="py-2.5 px-3">Total Nilai</th>
              <th className="py-2.5 px-3">Selisih vs Median</th>
              <th className="py-2.5 px-3 text-right">Status Penilaian</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/60">
            {chartData.map((row) => (
              <tr 
                key={row.juri} 
                className={`hover:bg-slate-800/40 transition-colors ${
                  row.isAtMedian ? 'bg-emerald-950/20 font-bold' : ''
                }`}
              >
                <td className="py-2 px-3 flex items-center gap-1.5">
                  <span className="font-bold text-white font-sport">{row.juri}</span>
                  {row.isAtMedian && (
                    <span className="px-1.5 py-0.2 rounded bg-emerald-500/20 text-emerald-300 text-[8px] font-bold border border-emerald-500/40">
                      MEDIAN
                    </span>
                  )}
                </td>
                <td className="py-2 px-3 text-cyan-300">{row.kebenaran.toFixed(3)}</td>
                <td className="py-2 px-3 text-purple-300">+{row.kemantapan.toFixed(3)}</td>
                <td className="py-2 px-3 text-amber-400 font-black text-sm">{row.score.toFixed(3)}</td>
                <td className="py-2 px-3">
                  <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                    row.diffFromMedian === 0 
                      ? 'text-emerald-400 bg-emerald-950/40' 
                      : row.diffFromMedian > 0 
                      ? 'text-cyan-300 bg-cyan-950/40' 
                      : 'text-rose-400 bg-rose-950/40'
                  }`}>
                    {row.diffFromMedian === 0 ? '0.000 (PAS)' : row.diffFromMedian > 0 ? `+${row.diffFromMedian.toFixed(3)}` : row.diffFromMedian.toFixed(3)}
                  </span>
                </td>
                <td className="py-2 px-3 text-right">
                  {row.isFinalized ? (
                    <span className="text-emerald-400 inline-flex items-center gap-1 text-[10px] font-bold">
                      <CheckCircle2 className="w-3 h-3" />
                      Terkunci Resmi
                    </span>
                  ) : (
                    <span className="text-amber-400 inline-flex items-center gap-1 text-[10px]">
                      ● Menunggu Kunci
                    </span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Footer Transparency Assurance */}
      <div className="pt-3 mt-3 border-t border-slate-800/80 flex flex-wrap items-center justify-between gap-2 text-[10px] font-mono text-slate-400 z-10">
        <span className="flex items-center gap-1.5">
          <Award className="w-3.5 h-3.5 text-amber-400" />
          <span>Sistem Scoring Digital Pencak Silat IPSI menjamin transparansi & independensi penjurian.</span>
        </span>
        <span className="font-bold text-cyan-400">
          Evaluasi Selesai • Gelanggang {peserta.gelanggang || 'A'}
        </span>
      </div>

    </div>
  );

  // If used as a modal overlay (e.g. over the monitor or secretary panel)
  if (showModalOverlay) {
    return (
      <div className="fixed inset-0 z-[9999] bg-black/85 backdrop-blur-md flex items-center justify-center p-3 sm:p-6 overflow-y-auto">
        <div className="w-full max-w-5xl my-auto">
          {content}
        </div>
      </div>
    );
  }

  return content;
};

export default TGRJuriScoreDistributionChart;
