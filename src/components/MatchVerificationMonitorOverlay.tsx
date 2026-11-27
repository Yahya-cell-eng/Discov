/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Shield, CheckCircle2, AlertTriangle, Scale, Clock, 
  Sparkles, Check, X, Award, ChevronDown, ChevronUp,
  Flame, CheckCircle
} from 'lucide-react';
import { MatchState } from '../types';
import { 
  VisualVoteCard, 
  VisualVotePill, 
  RenderVerificationIcon, 
  IconVisualSahBiru, 
  IconVisualTidakSah, 
  IconVisualSahMerah,
  VerificationVoteType 
} from './VerificationVoteVisuals';

export interface VerificationResultData {
  type: 'JATUHAN' | 'PELANGGARAN';
  result: 'MERAH' | 'BIRU' | 'TIDAK_SAH';
  votes: {
    juri1: 'MERAH' | 'BIRU' | 'TIDAK_SAH';
    juri2: 'MERAH' | 'BIRU' | 'TIDAK_SAH';
    juri3: 'MERAH' | 'BIRU' | 'TIDAK_SAH';
  };
  timestamp?: number;
  atletNama?: string;
  kontingen?: string;
  babak?: number;
  partai?: string;
}

interface MatchVerificationMonitorOverlayProps {
  state: MatchState;
  customResult?: VerificationResultData | null;
  dispatch?: (action: string, payload?: any) => void;
  onClose?: () => void;
  autoCloseSeconds?: number;
}

export const MatchVerificationMonitorOverlay: React.FC<MatchVerificationMonitorOverlayProps> = ({
  state,
  customResult,
  dispatch,
  onClose,
  autoCloseSeconds = 12,
}) => {
  const v = state.verification;
  const lastRes = state.lastVerificationResult;
  const [countdown, setCountdown] = useState<number>(autoCloseSeconds);
  const [isPaused, setIsPaused] = useState<boolean>(false);

  // Extract resolved voting result
  // "Hanya menampilkan hasil voting dari verifikasi"
  let type: 'JATUHAN' | 'PELANGGARAN' = 'JATUHAN';
  let result: 'MERAH' | 'BIRU' | 'TIDAK_SAH' | null = null;
  let votes: {
    juri1: 'MERAH' | 'BIRU' | 'TIDAK_SAH' | null;
    juri2: 'MERAH' | 'BIRU' | 'TIDAK_SAH' | null;
    juri3: 'MERAH' | 'BIRU' | 'TIDAK_SAH' | null;
  } = { juri1: null, juri2: null, juri3: null };

  let athleteName: string | undefined = undefined;
  let contingentName: string | undefined = undefined;

  if (customResult && customResult.result) {
    type = customResult.type;
    result = customResult.result;
    votes = customResult.votes;
    athleteName = customResult.atletNama;
    contingentName = customResult.kontingen;
  } else if (v && v.active && v.result && v.votes?.juri1 && v.votes?.juri2 && v.votes?.juri3) {
    type = v.type || 'JATUHAN';
    result = v.result;
    votes = v.votes;
    if (result === 'BIRU') {
      athleteName = state.atletBiru?.nama;
      contingentName = state.atletBiru?.kontingen;
    } else if (result === 'MERAH') {
      athleteName = state.atletMerah?.nama;
      contingentName = state.atletMerah?.kontingen;
    }
  } else if (lastRes && lastRes.result && lastRes.votes) {
    type = lastRes.type || 'JATUHAN';
    result = lastRes.result;
    votes = lastRes.votes;
    athleteName = lastRes.atletNama || (
      result === 'BIRU' ? state.atletBiru?.nama : result === 'MERAH' ? state.atletMerah?.nama : undefined
    );
    contingentName = lastRes.kontingen || (
      result === 'BIRU' ? state.atletBiru?.kontingen : result === 'MERAH' ? state.atletMerah?.kontingen : undefined
    );
  }

  // Only render if a final voting result is available
  // If no voting result yet (e.g. still waiting for judges), do not display anything!
  if (!result || !votes.juri1 || !votes.juri2 || !votes.juri3) {
    return null;
  }

  // Auto-close countdown
  useEffect(() => {
    setCountdown(autoCloseSeconds);
  }, [result, autoCloseSeconds]);

  useEffect(() => {
    if (isPaused) return;
    const timer = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          if (onClose) onClose();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [isPaused, onClose]);

  // Vote counts
  const voteList = [votes.juri1, votes.juri2, votes.juri3];
  const biruVotes = voteList.filter((x) => x === 'BIRU').length;
  const merahVotes = voteList.filter((x) => x === 'MERAH').length;
  const tidakSahVotes = voteList.filter((x) => x === 'TIDAK_SAH').length;

  const resultVoteCount = result === 'BIRU' ? biruVotes : result === 'MERAH' ? merahVotes : tidakSahVotes;

  const handleDismiss = () => {
    if (v?.active && dispatch) {
      dispatch('DEWAN_VERIFY_RESOLVE');
    }
    if (onClose) {
      onClose();
    }
  };

  const getJudgeVoteDetails = (jVote: 'BIRU' | 'MERAH' | 'TIDAK_SAH') => {
    if (jVote === 'BIRU') {
      return {
        label: 'SAH BIRU',
        sub: type === 'JATUHAN' ? '+3 Poin' : 'Disahkan',
        icon: <IconVisualSahBiru className="w-12 h-12" animated={false} />,
        cardBg: 'bg-gradient-to-b from-blue-950/90 to-blue-900/60 border-blue-500/60 shadow-blue-950/40',
        textColor: 'text-cyan-300',
        badgeBg: 'bg-blue-500/20 border-blue-400/50 text-cyan-300',
      };
    }
    if (jVote === 'MERAH') {
      return {
        label: 'SAH MERAH',
        sub: type === 'JATUHAN' ? '+3 Poin' : 'Disahkan',
        icon: <IconVisualSahMerah className="w-12 h-12" animated={false} />,
        cardBg: 'bg-gradient-to-b from-red-950/90 to-red-900/60 border-red-500/60 shadow-red-950/40',
        textColor: 'text-rose-300',
        badgeBg: 'bg-red-500/20 border-red-400/50 text-rose-300',
      };
    }
    return {
      label: 'TIDAK SAH',
      sub: '0 Poin / Batal',
      icon: <IconVisualTidakSah className="w-12 h-12" animated={false} />,
      cardBg: 'bg-gradient-to-b from-slate-900/90 to-slate-950 border-amber-500/50 shadow-slate-950/50',
      textColor: 'text-amber-300',
      badgeBg: 'bg-amber-500/20 border-amber-400/50 text-amber-300',
    };
  };

  return (
    <div className="fixed inset-0 z-[9990] bg-slate-950/90 backdrop-blur-xl flex flex-col items-center justify-center p-3 sm:p-6 overflow-y-auto select-none">
      {/* Background Ambience Glow */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {result === 'BIRU' && (
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[700px] rounded-full bg-blue-600/20 blur-3xl animate-pulse" />
        )}
        {result === 'MERAH' && (
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[700px] rounded-full bg-red-600/20 blur-3xl animate-pulse" />
        )}
        {result === 'TIDAK_SAH' && (
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[700px] rounded-full bg-amber-500/15 blur-3xl animate-pulse" />
        )}
      </div>

      <motion.div
        initial={{ scale: 0.93, opacity: 0, y: 15 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.93, opacity: 0, y: 15 }}
        transition={{ type: 'spring', damping: 25, stiffness: 320 }}
        onMouseEnter={() => setIsPaused(true)}
        onMouseLeave={() => setIsPaused(false)}
        className="relative w-full max-w-4xl bg-gradient-to-b from-slate-900/98 via-slate-950 to-slate-900/98 border-2 border-amber-400/80 rounded-3xl shadow-[0_0_90px_rgba(245,158,11,0.3)] p-5 sm:p-7 text-white flex flex-col justify-between overflow-hidden"
      >
        {/* ========================================================
            TOP BROADCAST HEADER
        ======================================================== */}
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-800 pb-4 mb-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-amber-500/20 border-2 border-amber-400/80 flex items-center justify-center text-amber-400 shadow-lg shadow-amber-500/30">
              <Scale className="w-6 h-6 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <span className="flex items-center gap-1.5 px-3 py-0.5 rounded-full bg-emerald-500/20 border border-emerald-500/60 text-emerald-300 text-[10px] font-black uppercase tracking-widest font-mono">
                  <CheckCircle className="w-3 h-3 text-emerald-400" />
                  HASIL VOTING VERIFIKASI RESMI
                </span>
                <span className="text-[11px] font-mono text-slate-400 font-bold uppercase">
                  PARTAI {state.partai || '01'} • BABAK {state.currentBabak || 1} • {state.kelas || 'TANDING'}
                </span>
              </div>
              <h2 className="text-xl sm:text-2xl font-black uppercase tracking-tight text-white mt-1 flex items-center gap-2">
                {type === 'JATUHAN' ? (
                  <>
                    <span>HASIL VERIFIKASI JATUHAN</span>
                    <span className="text-xs font-mono font-black px-2.5 py-0.5 rounded-lg bg-blue-500/25 text-cyan-300 border border-blue-400/50">
                      +3 POIN
                    </span>
                  </>
                ) : (
                  <>
                    <span>HASIL VERIFIKASI PELANGGARAN</span>
                    <span className="text-xs font-mono font-black px-2.5 py-0.5 rounded-lg bg-rose-500/25 text-rose-300 border border-rose-400/50">
                      TINDAKAN WASIT
                    </span>
                  </>
                )}
              </h2>
            </div>
          </div>

          {/* Auto-Dismiss Timer / Close Button */}
          <div className="flex items-center gap-2.5">
            <div 
              className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-950 border border-slate-800 font-mono text-xs text-amber-300 shadow-inner"
              title="Arahkan kursor untuk menjeda penutupan otomatis"
            >
              <Clock className="w-3.5 h-3.5 text-amber-400" />
              <span className="font-bold">
                {isPaused ? 'Dijeda' : `${countdown}s`}
              </span>
            </div>

            <button
              type="button"
              onClick={handleDismiss}
              className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors cursor-pointer"
              title="Tutup Hasil Verifikasi"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Competitor Matchup Mini Cards */}
        <div className="grid grid-cols-1 md:grid-cols-11 gap-3 items-center mb-4">
          <div className="md:col-span-5 bg-gradient-to-r from-blue-950/80 to-blue-900/40 p-3 rounded-2xl border border-blue-500/40 flex items-center justify-between">
            <div className="truncate">
              <span className="text-[10px] font-black uppercase tracking-wider text-blue-400 block font-mono">
                SUDUT BIRU
              </span>
              <p className="text-sm font-black text-white uppercase truncate">
                {state.atletBiru?.nama || 'Atlet Biru'}
              </p>
              <p className="text-[11px] text-blue-200/80 uppercase truncate">
                {state.atletBiru?.kontingen || 'KONTINGEN BIRU'}
              </p>
            </div>
            <div className="text-right pl-3 font-mono">
              <span className="text-[10px] text-blue-300 block">SKOR</span>
              <span className="text-2xl font-black text-white">
                {state.scores?.biru?.total ?? 0}
              </span>
            </div>
          </div>

          <div className="md:col-span-1 flex justify-center py-1 md:py-0">
            <div className="w-8 h-8 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center font-black text-[10px] text-amber-400 font-mono shadow-md">
              VS
            </div>
          </div>

          <div className="md:col-span-5 bg-gradient-to-l from-red-950/80 to-red-900/40 p-3 rounded-2xl border border-red-500/40 flex items-center justify-between">
            <div className="text-left font-mono pr-3 order-2 md:order-1">
              <span className="text-[10px] text-red-300 block">SKOR</span>
              <span className="text-2xl font-black text-white">
                {state.scores?.merah?.total ?? 0}
              </span>
            </div>
            <div className="truncate text-right order-1 md:order-2">
              <span className="text-[10px] font-black uppercase tracking-wider text-red-400 block font-mono">
                SUDUT MERAH
              </span>
              <p className="text-sm font-black text-white uppercase truncate">
                {state.atletMerah?.nama || 'Atlet Merah'}
              </p>
              <p className="text-[11px] text-red-200/80 uppercase truncate">
                {state.atletMerah?.kontingen || 'KONTINGEN MERAH'}
              </p>
            </div>
          </div>
        </div>

        {/* ========================================================
            HASIL VOTING DARI 3 JURI PENILAI (INDIVIDUAL VOTES)
        ======================================================== */}
        <div className="bg-slate-950/90 rounded-2xl p-4 sm:p-5 border border-slate-800 space-y-4 mb-4 shadow-inner">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-amber-400" />
              <h3 className="text-xs font-mono font-black uppercase tracking-wider text-slate-300">
                HASIL SUARA 3 JURI PENILAI PERSILAT:
              </h3>
            </div>
            <span className="text-[11px] font-mono font-bold text-emerald-400 bg-emerald-500/10 border border-emerald-500/30 px-2.5 py-0.5 rounded-full">
              3/3 Suara Terkumpul Lengkap
            </span>
          </div>

          {/* 3 Jury Voting Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
            {[1, 2, 3].map((num) => {
              const jKey = `juri${num}` as 'juri1' | 'juri2' | 'juri3';
              const jVote = votes[jKey] as 'BIRU' | 'MERAH' | 'TIDAK_SAH';
              const details = getJudgeVoteDetails(jVote);

              return (
                <div
                  key={num}
                  className={`p-4 rounded-2xl border transition-all flex flex-col items-center justify-between text-center shadow-lg ${details.cardBg}`}
                >
                  <div className="w-full flex items-center justify-between mb-2">
                    <span className="text-xs font-black uppercase tracking-widest text-white font-mono bg-black/40 px-2 py-0.5 rounded-md border border-white/10">
                      JURI {num}
                    </span>
                    <span className="inline-flex items-center gap-1 text-[10px] font-mono text-emerald-300 bg-emerald-950/60 border border-emerald-500/40 px-2 py-0.5 rounded-full">
                      <Check className="w-3 h-3 text-emerald-400" />
                      Tercatat
                    </span>
                  </div>

                  {/* Visual UIN Badge */}
                  <div className="my-2 flex flex-col items-center">
                    <div className="w-16 h-16 rounded-2xl bg-black/40 border border-white/15 flex items-center justify-center mb-2 shadow-inner">
                      {details.icon}
                    </div>
                    <span className={`text-base font-black uppercase font-sans tracking-wide ${details.textColor}`}>
                      {details.label}
                    </span>
                    <span className="text-[11px] font-mono text-slate-300 font-semibold mt-0.5">
                      {details.sub}
                    </span>
                  </div>

                  {/* Visual Pill */}
                  <div className="w-full pt-2 border-t border-white/10 flex justify-center">
                    <VisualVotePill vote={jVote as VerificationVoteType} />
                  </div>
                </div>
              );
            })}
          </div>

          {/* ========================================================
              KEPUTUSAN AKHIR / HASIL KEPUTUSAN TERPILIH (HERO CARD)
          ======================================================== */}
          <div className="pt-2">
            <VisualVoteCard
              vote={result as VerificationVoteType}
              size="hero"
              category={type}
              isSelected={true}
              athleteName={athleteName}
              count={resultVoteCount}
              showPoints={true}
            />
          </div>

          {/* Akumulasi & Rangkuman Keputusan */}
          <div className="bg-slate-900/80 rounded-xl p-3 border border-slate-800 flex flex-wrap items-center justify-between gap-2 text-xs font-mono">
            <div className="flex items-center gap-3">
              <span className="text-slate-400 font-semibold">Akumulasi Suara Juri:</span>
              <span className="px-2 py-0.5 rounded bg-blue-500/20 text-cyan-300 border border-blue-500/40 font-bold">
                Biru: {biruVotes}
              </span>
              <span className="px-2 py-0.5 rounded bg-red-500/20 text-rose-300 border border-red-500/40 font-bold">
                Merah: {merahVotes}
              </span>
              <span className="px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-500/40 font-bold">
                Tidak Sah: {tidakSahVotes}
              </span>
            </div>

            <div className="text-emerald-400 font-bold flex items-center gap-1.5">
              <Award className="w-4 h-4 text-emerald-400" />
              <span>
                Keputusan Mayoritas ({resultVoteCount} dari 3 Juri)
              </span>
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
          <div className="flex items-center gap-2 text-xs text-slate-400 font-mono">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span>
              {type === 'JATUHAN' && result !== 'TIDAK_SAH' 
                ? 'Poin +3 telah secara otomatis ditambahkan ke papan skor pertandingan.'
                : 'Keputusan verifikasi telah disahkan sesuai aturan IPSI/PERSILAT.'}
            </span>
          </div>

          <div className="flex items-center gap-2.5">
            <button
              type="button"
              onClick={handleDismiss}
              className="px-5 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 active:scale-95 text-slate-950 font-black text-xs uppercase tracking-wider flex items-center gap-2 transition-all cursor-pointer shadow-lg shadow-emerald-500/30"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>Tutup Tampilan Hasil</span>
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export default MatchVerificationMonitorOverlay;
