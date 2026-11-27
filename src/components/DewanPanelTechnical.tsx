import React, { useState } from 'react';
import {
  Shield,
  Clock,
  Play,
  Pause,
  RotateCcw,
  Maximize2,
  Minimize2,
  AlertTriangle,
  X,
  CheckCircle2,
  Trophy,
  Award,
  Zap,
  Undo2,
  Flag,
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { MatchState, MatchHistory } from '../types';
import { playBeep } from '../utils/sound';
import { generateAllMatchesReportPdf } from '../utils/generateMatchReportPdf';
import ThemePaletteSelector from './ThemePaletteSelector';
import AnimatedScore from './AnimatedScore';
import { useThemePalette } from '../services/themeService';

export interface DewanPanelTechnicalProps {
  state: MatchState;
  dispatch: (action: string, payload?: any) => void;
  onBack: () => void;
  theme: 'dark' | 'light';
  onToggleTheme: () => void;
  histories?: MatchHistory[];
  tgrState?: any;
}

export default function DewanPanelTechnical({
  state,
  dispatch,
  onBack,
  theme,
  onToggleTheme,
  histories = [],
  tgrState,
}: DewanPanelTechnicalProps) {
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showVerifyModal, setShowVerifyModal] = useState(false);
  const [penaltyConfirm, setPenaltyConfirm] = useState<{
    sudut: 'merah' | 'biru';
    type: 'binaan1' | 'binaan2' | 'teguran1' | 'teguran2' | 'peringatan1' | 'peringatan2' | 'disqualified';
  } | null>(null);
  const [kTeknikConfirm, setKTeknikConfirm] = useState<'merah' | 'biru' | null>(null);
  const [undoConfirm, setUndoConfirm] = useState<'merah' | 'biru' | null>(null);
  const [undurDiriConfirm, setUndurDiriConfirm] = useState<'merah' | 'biru' | null>(null);
  const [wmpConfirm, setWmpConfirm] = useState<'merah' | 'biru' | null>(null);
  const [showQuickUndoModal, setShowQuickUndoModal] = useState(false);
  const [showQuickKTeknikModal, setShowQuickKTeknikModal] = useState(false);

  const { changePalette } = useThemePalette();

  const [systemLogs, setSystemLogs] = useState<string[]>([
    `[${new Date().toLocaleTimeString('id-ID')}] System Dewan Tanding Siaga.`,
    `[${new Date().toLocaleTimeString('id-ID')}] Verifikasi 3 Juri Terhubung.`,
  ]);

  const addLog = (msg: string) => {
    const timestamp = new Date().toLocaleTimeString('id-ID');
    setSystemLogs(prev => [`[${timestamp}] ${msg}`, ...prev.slice(0, 6)]);
  };

  React.useEffect(() => {
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

  const formatTimer = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  // Shortcut Tombol SPASI untuk Mulai / Jeda Timer Tanding
  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.code === 'Space' || e.key === ' ' || e.keyCode === 32) {
        const target = e.target as HTMLElement;
        const tagName = target?.tagName?.toLowerCase();
        if (tagName === 'input' || tagName === 'textarea' || target?.isContentEditable) {
          return;
        }
        e.preventDefault();
        playBeep('click');
        dispatch('TOGGLE_TIMER');
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [dispatch]);

  const handlePenaltyClick = (
    sudut: 'merah' | 'biru',
    type: 'binaan1' | 'binaan2' | 'teguran1' | 'teguran2' | 'peringatan1' | 'peringatan2' | 'disqualified'
  ) => {
    playBeep('warning');
    setPenaltyConfirm({ sudut, type });
  };

  const handleApplyPenalty = () => {
    if (!penaltyConfirm) return;
    const { sudut, type } = penaltyConfirm;
    playBeep('warning');
    dispatch('DEWAN_PENALTY', { sudut, type });
    addLog(`Hukuman ${type.toUpperCase()} diberikan ke Sudut ${sudut.toUpperCase()}`);
    setPenaltyConfirm(null);
  };

  const handleKTeknikClick = (sudut: 'merah' | 'biru') => {
    playBeep('warning');
    setKTeknikConfirm(sudut);
  };

  const handleApplyKTeknik = () => {
    if (!kTeknikConfirm) return;
    playBeep('valid');
    dispatch('DEWAN_K_TEKNIK', { sudut: kTeknikConfirm });
    addLog(`Keputusan Teknik (TKO/KO) disahkan untuk Sudut ${kTeknikConfirm.toUpperCase()}`);
    setKTeknikConfirm(null);
  };

  const handleUndoClick = (sudut: 'merah' | 'biru') => {
    playBeep('click');
    setUndoConfirm(sudut);
  };

  const handleApplyUndo = () => {
    if (!undoConfirm) return;
    playBeep('click');
    dispatch('DEWAN_UNDO_LAST', { sudut: undoConfirm });
    addLog(`Batal (Undo) tindakan terakhir pada Sudut ${undoConfirm.toUpperCase()}`);
    setUndoConfirm(null);
  };

  const handleUndurDiriClick = (sudut: 'merah' | 'biru') => {
    playBeep('warning');
    setUndurDiriConfirm(sudut);
  };

  const handleApplyUndurDiri = () => {
    if (!undurDiriConfirm) return;
    playBeep('warning');
    dispatch('DEWAN_UNDUR_DIRI', { withdrawingCorner: undurDiriConfirm });
    addLog(`Sudut ${undurDiriConfirm.toUpperCase()} dinyatakan Mengundurkan Diri`);
    setUndurDiriConfirm(null);
  };

  const handleWmpClick = (winnerCorner: 'merah' | 'biru') => {
    playBeep('warning');
    setWmpConfirm(winnerCorner);
  };

  const handleApplyWmp = () => {
    if (!wmpConfirm) return;
    playBeep('warning');
    dispatch('DEWAN_WMP', { winnerCorner: wmpConfirm });
    addLog(`WMP disahkan: Pemenang Sudut ${wmpConfirm.toUpperCase()}`);
    setWmpConfirm(null);
  };

  const handleJatuhan = (sudut: 'merah' | 'biru') => {
    playBeep('valid');
    dispatch('DEWAN_JATUHAN', { sudut });
    addLog(`Poin Sah Jatuhan (+3) Sudut ${sudut.toUpperCase()}`);
  };

  const handleVerifyTrigger = (verifyType: 'JATUHAN' | 'PELANGGARAN') => {
    playBeep('click');
    dispatch('DEWAN_VERIFY_TRIGGER', { type: verifyType });
    addLog(`Memulai Verifikasi Juri: ${verifyType}`);
    setShowVerifyModal(false);
  };

  const handleResolveVerify = () => {
    playBeep('click');
    dispatch('DEWAN_VERIFY_RESOLVE');
    addLog('Verifikasi Juri telah diselesaikan Dewan.');
  };

  const redPen = state.dewanPenalties.merah;
  const bluePen = state.dewanPenalties.biru;
  const v = state.verification;

  return (
    <div className="technical-system-root w-full h-full min-h-screen flex flex-col justify-between select-none overflow-y-auto md:overflow-hidden relative">
      
      {/* Variation 5 Technical System Header Shell */}
      <header className="px-4 py-2.5 border-b border-white/10 flex justify-between items-center bg-white/[0.02] flex-shrink-0">
        <div className="sys-info flex gap-4 md:gap-6 items-center">
          <div className="label font-mono font-bold" style={{ opacity: 1, color: 'var(--accent, #00f2ff)' }}>
            Skoring Silat v2.4
          </div>
          <div className="label hidden sm:inline">Dewan Hakim System</div>
        </div>
        <div className="flex gap-2 sm:gap-4 items-center">
          <button
            onClick={() => {
              playBeep('click');
              dispatch('TOGGLE_JURY_PENALTY_ACCESS');
              addLog(`Akses Juri: ${!state.juryPenaltyAccess ? 'AKTIF' : 'NONAKTIF'}`);
            }}
            className={`status-pill cursor-pointer font-mono text-[10px] px-2.5 py-0.5 rounded border transition-all ${
              state.juryPenaltyAccess
                ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400'
                : 'bg-rose-500/10 border-rose-500/30 text-rose-400'
            }`}
            title="Klik untuk toggle izin akses juri"
          >
            Akses Juri: {state.juryPenaltyAccess ? 'Aktif' : 'Nonaktif'}
          </button>
          <div className="label hidden md:inline text-slate-400">
            {state.atletMerah.nama || 'Atlet Merah'} vs {state.atletBiru.nama || 'Atlet Biru'}
          </div>
          <div className="label hidden sm:inline" style={{ color: 'var(--warning, #ffcc00)' }}>
            Modus: Pertandingan
          </div>
          <ThemePaletteSelector compact={true} />
          <button
            onClick={toggleFullscreen}
            className="p-1 rounded text-slate-400 hover:text-white border border-white/10 hover:border-white/30 transition-all cursor-pointer"
            title="Layar Penuh"
          >
            {isFullscreen ? <Minimize2 className="w-3.5 h-3.5" /> : <Maximize2 className="w-3.5 h-3.5" />}
          </button>
        </div>
      </header>

      {/* Variation 5 Main Grid */}
      <main className="flex-1 grid grid-cols-1 lg:grid-cols-[1fr_340px_1fr] p-3 md:p-4 gap-3 md:gap-4 technical-grid-bg min-h-0 items-stretch overflow-y-auto">
        {/* Red Corner */}
        <div className="corner-panel flex flex-col gap-3">
          <div className="athlete-card red">
            <div className="flex items-center justify-between">
              <div className="label text-red-400 font-bold">Sudut Merah</div>
              <div className="mono text-[9px] text-red-300/80 border border-red-500/30 px-1.5 py-0.5 rounded">
                {state.dewanPenalties.merah.disqualified ? 'DISKUALIFIKASI' : 'AKTIF'}
              </div>
            </div>
            <div className="athlete-name mt-1 text-white truncate" title={state.atletMerah.nama}>
              {state.atletMerah.nama || 'ATLET MERAH'}
            </div>
            <div className="font-mono text-[11px] text-slate-400 uppercase truncate">
              {state.atletMerah.kontingen || 'KONTINGEN MERAH'}
            </div>
            <div className="score-display text-white">
              <AnimatedScore value={state.scores.merah.total} showDeltaBadge={true} />
            </div>
            <div className="stats-grid flex gap-3 mt-2 border-t border-white/10 pt-2">
              <div>
                <div className="label">Binaan</div>
                <div className="mono text-xs font-bold text-amber-300">
                  {redPen.binaan2 ? 'B2' : redPen.binaan1 ? 'B1' : '-'}
                </div>
              </div>
              <div>
                <div className="label">Teguran</div>
                <div className="mono text-xs font-bold text-amber-400">
                  {redPen.teguran2 ? 'T2 (-2)' : redPen.teguran1 ? 'T1 (-1)' : '-'}
                </div>
              </div>
              <div>
                <div className="label">Peringatan</div>
                <div className="mono text-xs font-bold text-rose-400">
                  {redPen.peringatan2 ? 'P2 (-10)' : redPen.peringatan1 ? 'P1 (-5)' : '-'}
                </div>
              </div>
              <div>
                <div className="label">Jatuhan</div>
                <div className="mono text-xs font-bold text-cyan-300">
                  +{state.directPoints.merah}
                </div>
              </div>
            </div>
          </div>

          <div className="controls-grid">
            <button 
              type="button"
              onClick={() => handlePenaltyClick('merah', 'binaan1')}
              className={`btn ${redPen.binaan1 ? 'border-yellow-400 bg-yellow-500/20 text-yellow-300' : ''}`}
            >
              <span>Binaan 1 👉</span>
            </button>
            <button 
              type="button"
              onClick={() => handlePenaltyClick('merah', 'binaan2')}
              className={`btn ${redPen.binaan2 ? 'border-yellow-400 bg-yellow-500/20 text-yellow-300' : ''}`}
            >
              <span>Binaan 2 👉👉</span>
            </button>
            <button 
              type="button"
              onClick={() => handlePenaltyClick('merah', 'teguran1')}
              className={`btn ${redPen.teguran1 ? 'border-amber-400 bg-amber-500/20 text-amber-300' : ''}`}
            >
              <span>Teguran 1 ☝️</span>
            </button>
            <button 
              type="button"
              onClick={() => handlePenaltyClick('merah', 'teguran2')}
              className={`btn ${redPen.teguran2 ? 'border-amber-400 bg-amber-500/20 text-amber-300' : ''}`}
            >
              <span>Teguran 2 ✌️</span>
            </button>
            <button 
              type="button"
              onClick={() => handlePenaltyClick('merah', 'peringatan1')}
              className={`btn ${redPen.peringatan1 ? 'border-rose-400 bg-rose-500/20 text-rose-300' : ''}`}
            >
              <span>Peringatan 1</span>
            </button>
            <button 
              type="button"
              onClick={() => handlePenaltyClick('merah', 'peringatan2')}
              className={`btn ${redPen.peringatan2 ? 'border-rose-400 bg-rose-500/20 text-rose-300' : ''}`}
            >
              <span>Peringatan 2</span>
            </button>
            <button 
              type="button"
              onClick={() => handleJatuhan('merah')}
              className="btn btn-primary"
              style={{ gridColumn: 'span 2' }}
            >
              Jatuhan (+3)
            </button>
            <button 
              type="button"
              onClick={() => handlePenaltyClick('merah', 'disqualified')}
              className="btn btn-danger"
              style={{ gridColumn: 'span 2' }}
            >
              Diskualifikasi
            </button>
          </div>
        </div>

        {/* Center Timer & Global Controls */}
        <div className="center-column flex flex-col gap-3 justify-between">
          <div className="timer-box">
            <div className="label">Match Timer</div>
            <div className="timer-val">{formatTimer(state.timerSeconds)}</div>
            <div className="flex gap-2 mt-4">
              <button 
                type="button"
                onClick={() => {
                  playBeep('click');
                  dispatch('TOGGLE_TIMER');
                  addLog(state.timerActive ? 'Timer Dijeda' : 'Timer Mulai Berjalan');
                }}
                className={`btn ${state.timerActive ? 'btn-warning' : 'btn-primary'} flex-1 py-3 text-sm font-black`}
              >
                {state.timerActive ? 'Jeda' : 'Mulai'}
              </button>
              <button 
                type="button"
                onClick={() => {
                  playBeep('click');
                  dispatch('RESET_TIMER');
                  addLog('Timer Direset');
                }}
                className="btn flex-1 py-3 text-sm font-bold"
              >
                Reset
              </button>
            </div>
          </div>

          <div className="partai-info">
            <div className="label">Pertandingan</div>
            <div className="athlete-name" style={{ fontSize: '1.25rem' }}>
              Partai {state.partai || '01'}
            </div>
            <div className="babak-nav">
              <button
                type="button"
                onClick={() => { playBeep('click'); dispatch('SET_BABAK', { babak: 1 }); addLog('Pindah ke Babak I'); }}
                className={`babak-btn ${state.currentBabak === 1 ? 'active' : ''}`}
              >
                I
              </button>
              <button
                type="button"
                onClick={() => { playBeep('click'); dispatch('SET_BABAK', { babak: 2 }); addLog('Pindah ke Babak II'); }}
                className={`babak-btn ${state.currentBabak === 2 ? 'active' : ''}`}
              >
                II
              </button>
              <button
                type="button"
                onClick={() => { playBeep('click'); dispatch('SET_BABAK', { babak: 3 }); addLog('Pindah ke Babak III'); }}
                className={`babak-btn ${state.currentBabak === 3 ? 'active' : ''}`}
              >
                III
              </button>
            </div>
          </div>

          {v.active ? (
            <div className="p-3 border border-amber-400 bg-amber-500/10 rounded text-center">
              <div className="label text-amber-400 font-bold mb-1">VERIFIKASI {v.type} AKTIF</div>
              <div className="text-[11px] font-mono text-white mb-2">
                Status Voting Juri: {Object.values(v.votes).filter(Boolean).length}/3 Juri
              </div>
              <button
                onClick={handleResolveVerify}
                className="btn btn-primary w-full py-2 text-xs font-mono"
              >
                Selesaikan Verifikasi
              </button>
            </div>
          ) : (
            <button 
              type="button"
              onClick={() => { playBeep('click'); setShowVerifyModal(true); }}
              className="btn btn-warning py-3 text-xs tracking-wider"
            >
              Vote Verification
            </button>
          )}

          <div className="flex-1 border border-white/10 p-3 bg-white/[0.01] rounded flex flex-col justify-between min-h-[110px]">
            <div>
              <div className="label mb-2 text-slate-400 flex items-center justify-between">
                <span>System Log</span>
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              </div>
              <div className="space-y-1 overflow-y-auto max-h-[85px] pr-1">
                {systemLogs.map((log, idx) => (
                  <div key={idx} className="font-mono text-[10px] text-slate-300 leading-tight tracking-tight">
                    {log}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Blue Corner */}
        <div className="corner-panel flex flex-col gap-3">
          <div className="athlete-card blue">
            <div className="flex items-center justify-between">
              <div className="mono text-[9px] text-blue-300/80 border border-blue-500/30 px-1.5 py-0.5 rounded">
                {state.dewanPenalties.biru.disqualified ? 'DISKUALIFIKASI' : 'AKTIF'}
              </div>
              <div className="label text-blue-400 font-bold">Sudut Biru</div>
            </div>
            <div className="athlete-name mt-1 text-white truncate text-right" title={state.atletBiru.nama}>
              {state.atletBiru.nama || 'ATLET BIRU'}
            </div>
            <div className="font-mono text-[11px] text-slate-400 uppercase truncate text-right">
              {state.atletBiru.kontingen || 'KONTINGEN BIRU'}
            </div>
            <div className="score-display text-white text-right">
              <AnimatedScore value={state.scores.biru.total} showDeltaBadge={true} />
            </div>
            <div className="stats-grid flex gap-3 mt-2 border-t border-white/10 pt-2 justify-end">
              <div>
                <div className="label">Binaan</div>
                <div className="mono text-xs font-bold text-amber-300">
                  {bluePen.binaan2 ? 'B2' : bluePen.binaan1 ? 'B1' : '-'}
                </div>
              </div>
              <div>
                <div className="label">Teguran</div>
                <div className="mono text-xs font-bold text-amber-400">
                  {bluePen.teguran2 ? 'T2 (-2)' : bluePen.teguran1 ? 'T1 (-1)' : '-'}
                </div>
              </div>
              <div>
                <div className="label">Peringatan</div>
                <div className="mono text-xs font-bold text-rose-400">
                  {bluePen.peringatan2 ? 'P2 (-10)' : bluePen.peringatan1 ? 'P1 (-5)' : '-'}
                </div>
              </div>
              <div>
                <div className="label">Jatuhan</div>
                <div className="mono text-xs font-bold text-cyan-300">
                  +{state.directPoints.biru}
                </div>
              </div>
            </div>
          </div>

          <div className="controls-grid">
            <button 
              type="button"
              onClick={() => handlePenaltyClick('biru', 'binaan1')}
              className={`btn ${bluePen.binaan1 ? 'border-yellow-400 bg-yellow-500/20 text-yellow-300' : ''}`}
            >
              <span>Binaan 1 👉</span>
            </button>
            <button 
              type="button"
              onClick={() => handlePenaltyClick('biru', 'binaan2')}
              className={`btn ${bluePen.binaan2 ? 'border-yellow-400 bg-yellow-500/20 text-yellow-300' : ''}`}
            >
              <span>Binaan 2 👉👉</span>
            </button>
            <button 
              type="button"
              onClick={() => handlePenaltyClick('biru', 'teguran1')}
              className={`btn ${bluePen.teguran1 ? 'border-amber-400 bg-amber-500/20 text-amber-300' : ''}`}
            >
              <span>Teguran 1 ☝️</span>
            </button>
            <button 
              type="button"
              onClick={() => handlePenaltyClick('biru', 'teguran2')}
              className={`btn ${bluePen.teguran2 ? 'border-amber-400 bg-amber-500/20 text-amber-300' : ''}`}
            >
              <span>Teguran 2 ✌️</span>
            </button>
            <button 
              type="button"
              onClick={() => handlePenaltyClick('biru', 'peringatan1')}
              className={`btn ${bluePen.peringatan1 ? 'border-rose-400 bg-rose-500/20 text-rose-300' : ''}`}
            >
              <span>Peringatan 1</span>
            </button>
            <button 
              type="button"
              onClick={() => handlePenaltyClick('biru', 'peringatan2')}
              className={`btn ${bluePen.peringatan2 ? 'border-rose-400 bg-rose-500/20 text-rose-300' : ''}`}
            >
              <span>Peringatan 2</span>
            </button>
            <button 
              type="button"
              onClick={() => handleJatuhan('biru')}
              className="btn btn-primary"
              style={{ gridColumn: 'span 2' }}
            >
              Jatuhan (+3)
            </button>
            <button 
              type="button"
              onClick={() => handlePenaltyClick('biru', 'disqualified')}
              className="btn btn-danger"
              style={{ gridColumn: 'span 2' }}
            >
              Diskualifikasi
            </button>
          </div>
        </div>
      </main>

      {/* Variation 5 Footer */}
      <footer className="px-4 py-2.5 border-t border-white/10 flex flex-col sm:flex-row justify-between items-center gap-2 bg-white/[0.02] flex-shrink-0">
        <div className="action-bar flex flex-wrap gap-2 items-center">
          <button className="mini-btn cursor-pointer" onClick={onBack}>
            ← Keluar
          </button>
          <button className="mini-btn cursor-pointer" onClick={() => changePalette('default_light')}>
            Mode Terang
          </button>
          <button className="mini-btn cursor-pointer" onClick={() => changePalette('default_dark')}>
            Modern Dark
          </button>
          <button className="mini-btn cursor-pointer text-cyan-400 border-cyan-400/40" onClick={() => changePalette('technical_system')}>
            Technical System
          </button>
          <button className="mini-btn cursor-pointer" onClick={toggleFullscreen}>
            {isFullscreen ? 'Keluar Layar Penuh' : 'Layar Penuh'}
          </button>
        </div>
        
        <div className="action-bar flex flex-wrap gap-2 items-center">
          <button 
            className="mini-btn cursor-pointer" 
            style={{ color: 'var(--red-corner, #ff3b3b)', borderColor: 'rgba(255,59,59,0.3)' }}
            onClick={() => handleUndurDiriClick('merah')}
          >
            UD Merah
          </button>
          <button 
            className="mini-btn cursor-pointer" 
            style={{ color: 'var(--blue-corner, #3b82f6)', borderColor: 'rgba(59,130,246,0.3)' }}
            onClick={() => handleUndurDiriClick('biru')}
          >
            UD Biru
          </button>
          <button 
            className="mini-btn cursor-pointer" 
            style={{ color: 'var(--warning, #ffcc00)', borderColor: 'rgba(255,204,0,0.3)' }}
            onClick={() => handleWmpClick('merah')}
          >
            WMP Merah
          </button>
          <button 
            className="mini-btn cursor-pointer" 
            style={{ color: 'var(--warning, #ffcc00)', borderColor: 'rgba(255,204,0,0.3)' }}
            onClick={() => handleWmpClick('biru')}
          >
            WMP Biru
          </button>
          <button 
            className="mini-btn cursor-pointer" 
            style={{ background: 'rgba(255,255,255,0.08)' }}
            onClick={() => setShowQuickUndoModal(true)}
          >
            Undo (Del)
          </button>
          <button 
            className="mini-btn cursor-pointer" 
            style={{ color: 'var(--accent, #00f2ff)', borderColor: 'rgba(0,242,255,0.3)' }}
            onClick={() => setShowQuickKTeknikModal(true)}
          >
            K. Teknik
          </button>
        </div>
      </footer>

      {/* Modals & Dialogs */}
      <AnimatePresence>
        {/* Vote Verification Modal */}
        {showVerifyModal && (
          <div className="fixed inset-0 bg-[#000000d0] backdrop-blur-md z-[9999] flex items-center justify-center p-4">
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-[#121217] border border-cyan-400/50 max-w-sm w-full p-6 rounded-xl shadow-2xl text-white relative font-sans"
            >
              <button
                onClick={() => { playBeep('click'); setShowVerifyModal(false); }}
                className="absolute top-4 right-4 p-1 text-slate-400 hover:text-white rounded cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>

              <h3 className="text-base font-black text-center text-cyan-400 mb-1 uppercase tracking-wider font-mono">
                MULAI VERIFIKASI DEWAN
              </h3>
              <p className="text-xs text-slate-400 text-center mb-5">
                Pilih kategori verifikasi yang akan diajukan ke voting 3 Juri Penilai.
              </p>

              <div className="flex flex-col gap-3">
                <button
                  onClick={() => handleVerifyTrigger('JATUHAN')}
                  className="btn btn-primary py-3 text-xs tracking-widest font-mono"
                >
                  VERIFIKASI JATUHAN (3 PT)
                </button>
                <button
                  onClick={() => handleVerifyTrigger('PELANGGARAN')}
                  className="btn btn-danger py-3 text-xs tracking-widest font-mono"
                >
                  VERIFIKASI PELANGGARAN
                </button>
              </div>

              <button
                onClick={() => { playBeep('click'); setShowVerifyModal(false); }}
                className="w-full text-center text-xs font-mono text-slate-400 hover:text-white mt-4 block cursor-pointer"
              >
                [ Batal ]
              </button>
            </motion.div>
          </div>
        )}

        {/* Penalty Confirmation Popup */}
        {penaltyConfirm && (() => {
          const targetAthlete = penaltyConfirm.sudut === 'merah' ? state.atletMerah : state.atletBiru;
          const isMerah = penaltyConfirm.sudut === 'merah';
          const penaltyLabels: Record<string, { label: string; desc: string; point: string }> = {
            binaan1: { label: 'BINAAN 1', desc: 'Peringatan Lisan Pertama (Tanpa Pengurangan Poin)', point: '0' },
            binaan2: { label: 'BINAAN 2', desc: 'Peringatan Lisan Kedua (Tanpa Pengurangan Poin)', point: '0' },
            teguran1: { label: 'TEGURAN 1', desc: 'Teguran Resmi Pertama', point: '-1' },
            teguran2: { label: 'TEGURAN 2', desc: 'Teguran Resmi Kedua', point: '-2' },
            peringatan1: { label: 'PERINGATAN 1', desc: 'Peringatan Keras Pertama', point: '-5' },
            peringatan2: { label: 'PERINGATAN 2', desc: 'Peringatan Keras Kedua', point: '-10' },
            disqualified: { label: 'DISKUALIFIKASI', desc: 'Dikeluarkan dari Pertandingan (Kalah Mutlak)', point: 'DISQ' },
          };
          const info = penaltyLabels[penaltyConfirm.type] || { label: penaltyConfirm.type, desc: '', point: '' };

          return (
            <div className="fixed inset-0 bg-[#000000d0] backdrop-blur-md z-[9999] flex items-center justify-center p-4">
              <motion.div
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.9, opacity: 0 }}
                className={`bg-[#121217] border-2 max-w-sm w-full p-6 rounded-xl shadow-2xl text-white relative font-sans ${
                  isMerah ? 'border-red-500/60' : 'border-blue-500/60'
                }`}
              >
                <div className="flex items-center gap-2 mb-3">
                  <AlertTriangle className={`w-5 h-5 ${isMerah ? 'text-red-400' : 'text-blue-400'}`} />
                  <span className={`text-xs font-mono font-bold uppercase tracking-wider ${isMerah ? 'text-red-400' : 'text-blue-400'}`}>
                    Konfirmasi Hukuman Dewan
                  </span>
                </div>

                <div className="border border-white/10 p-3 rounded mb-4 bg-white/[0.02]">
                  <div className="text-xs text-slate-400 uppercase font-mono">Target Pesilat:</div>
                  <div className="text-base font-bold text-white uppercase">{targetAthlete.nama || 'Pesilat'}</div>
                  <div className="text-xs text-slate-400 font-mono uppercase">{targetAthlete.kontingen}</div>
                </div>

                <div className="text-center py-2 mb-4 bg-white/[0.04] border border-white/10 rounded">
                  <div className="text-xs text-amber-400 font-mono uppercase">Jenis Hukuman:</div>
                  <div className="text-lg font-black tracking-wider text-white font-mono mt-0.5">{info.label}</div>
                  <div className="text-xs text-slate-400 mt-1">{info.desc}</div>
                </div>

                <div className="flex gap-2">
                  <button
                    onClick={handleApplyPenalty}
                    className={`flex-1 py-2.5 btn font-mono font-bold text-xs uppercase cursor-pointer ${
                      isMerah ? 'btn-danger' : 'btn-primary'
                    }`}
                  >
                    Terapkan
                  </button>
                  <button
                    onClick={() => { playBeep('click'); setPenaltyConfirm(null); }}
                    className="flex-1 py-2.5 btn text-xs font-mono uppercase cursor-pointer"
                  >
                    Batal
                  </button>
                </div>
              </motion.div>
            </div>
          );
        })()}

        {/* Quick Undo Modal */}
        {showQuickUndoModal && (
          <div className="fixed inset-0 bg-[#000000d0] backdrop-blur-md z-[9999] flex items-center justify-center p-4">
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-[#121217] border border-white/20 max-w-sm w-full p-6 rounded-xl shadow-2xl text-white relative font-sans"
            >
              <h3 className="text-sm font-mono font-bold text-center text-slate-200 mb-2 uppercase tracking-wider">
                PILIH SUDUT UNTUK UNDO (DEL)
              </h3>
              <p className="text-xs text-slate-400 text-center mb-4">
                Membatalkan poin jatuhan atau hukuman terakhir yang sah.
              </p>
              <div className="flex gap-3">
                <button
                  onClick={() => {
                    setShowQuickUndoModal(false);
                    handleUndoClick('merah');
                  }}
                  className="flex-1 py-3 btn btn-danger font-mono text-xs font-bold"
                >
                  Sudut Merah
                </button>
                <button
                  onClick={() => {
                    setShowQuickUndoModal(false);
                    handleUndoClick('biru');
                  }}
                  className="flex-1 py-3 btn btn-primary font-mono text-xs font-bold"
                >
                  Sudut Biru
                </button>
              </div>
              <button
                onClick={() => setShowQuickUndoModal(false)}
                className="w-full text-center text-xs font-mono text-slate-400 mt-4 block cursor-pointer"
              >
                [ Tutup ]
              </button>
            </motion.div>
          </div>
        )}

        {/* Quick K. Teknik Modal */}
        {showQuickKTeknikModal && (
          <div className="fixed inset-0 bg-[#000000d0] backdrop-blur-md z-[9999] flex items-center justify-center p-4">
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-[#121217] border border-cyan-400/50 max-w-sm w-full p-6 rounded-xl shadow-2xl text-white relative font-sans"
            >
              <h3 className="text-sm font-mono font-bold text-center text-cyan-400 mb-2 uppercase tracking-wider">
                PILIH PEMENANG KEPUTUSAN TEKNIK (TKO)
              </h3>
              <p className="text-xs text-slate-400 text-center mb-4">
                Sahkan kemenangan mutlak akibat keputusan teknik atau medis.
              </p>
              <div className="flex gap-3">
                <button
                  onClick={() => {
                    setShowQuickKTeknikModal(false);
                    handleKTeknikClick('merah');
                  }}
                  className="flex-1 py-3 btn btn-danger font-mono text-xs font-bold"
                >
                  Menang Merah
                </button>
                <button
                  onClick={() => {
                    setShowQuickKTeknikModal(false);
                    handleKTeknikClick('biru');
                  }}
                  className="flex-1 py-3 btn btn-primary font-mono text-xs font-bold"
                >
                  Menang Biru
                </button>
              </div>
              <button
                onClick={() => setShowQuickKTeknikModal(false)}
                className="w-full text-center text-xs font-mono text-slate-400 mt-4 block cursor-pointer"
              >
                [ Tutup ]
              </button>
            </motion.div>
          </div>
        )}

        {/* Undo Confirmation Popup */}
        {undoConfirm && (
          <div className="fixed inset-0 bg-[#000000d0] backdrop-blur-md z-[9999] flex items-center justify-center p-4">
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-[#121217] border border-white/20 max-w-sm w-full p-6 rounded-xl shadow-2xl text-white relative font-sans"
            >
              <h3 className="text-sm font-mono font-bold text-center text-slate-200 mb-2 uppercase tracking-wider">
                KONFIRMASI BATAL (UNDO)
              </h3>
              <p className="text-xs text-slate-300 text-center mb-4">
                Apakah Anda yakin ingin membatalkan aksi poin/hukuman terakhir pada sudut{' '}
                <strong className={undoConfirm === 'merah' ? 'text-red-400' : 'text-blue-400'}>
                  {undoConfirm.toUpperCase()}
                </strong>?
              </p>
              <div className="flex gap-2">
                <button
                  onClick={handleApplyUndo}
                  className="flex-1 py-2 btn btn-primary font-mono text-xs font-bold cursor-pointer"
                >
                  Ya, Batalkan
                </button>
                <button
                  onClick={() => setUndoConfirm(null)}
                  className="flex-1 py-2 btn font-mono text-xs cursor-pointer"
                >
                  Batal
                </button>
              </div>
            </motion.div>
          </div>
        )}

        {/* Undur Diri Confirmation Popup */}
        {undurDiriConfirm && (
          <div className="fixed inset-0 bg-[#000000d0] backdrop-blur-md z-[9999] flex items-center justify-center p-4">
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-[#121217] border border-red-500/60 max-w-sm w-full p-6 rounded-xl shadow-2xl text-white relative font-sans"
            >
              <h3 className="text-sm font-mono font-bold text-center text-red-400 mb-2 uppercase tracking-wider">
                KONFIRMASI UNDUR DIRI (UD)
              </h3>
              <p className="text-xs text-slate-300 text-center mb-4">
                Nyatakan sudut <strong className="text-red-400">{undurDiriConfirm.toUpperCase()}</strong> mengundurkan diri (cedera/menyerah)? Lawan akan dinyatakan menang mutlak.
              </p>
              <div className="flex gap-2">
                <button
                  onClick={handleApplyUndurDiri}
                  className="flex-1 py-2 btn btn-danger font-mono text-xs font-bold cursor-pointer"
                >
                  Sahkan Undur Diri
                </button>
                <button
                  onClick={() => setUndurDiriConfirm(null)}
                  className="flex-1 py-2 btn font-mono text-xs cursor-pointer"
                >
                  Batal
                </button>
              </div>
            </motion.div>
          </div>
        )}

        {/* WMP Confirmation Popup */}
        {wmpConfirm && (
          <div className="fixed inset-0 bg-[#000000d0] backdrop-blur-md z-[9999] flex items-center justify-center p-4">
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-[#121217] border border-amber-400/60 max-w-sm w-full p-6 rounded-xl shadow-2xl text-white relative font-sans"
            >
              <h3 className="text-sm font-mono font-bold text-center text-amber-400 mb-2 uppercase tracking-wider">
                SAHKAN WASIT MENGHENTIKAN PERTANDINGAN (WMP)
              </h3>
              <p className="text-xs text-slate-300 text-center mb-4">
                Sahkan kemenangan sudut <strong className="text-amber-400">{wmpConfirm.toUpperCase()}</strong> karena wasit menghentikan pertandingan demi keselamatan atlet?
              </p>
              <div className="flex gap-2">
                <button
                  onClick={handleApplyWmp}
                  className="flex-1 py-2 btn btn-warning font-mono text-xs font-bold cursor-pointer"
                >
                  Sahkan WMP
                </button>
                <button
                  onClick={() => setWmpConfirm(null)}
                  className="flex-1 py-2 btn font-mono text-xs cursor-pointer"
                >
                  Batal
                </button>
              </div>
            </motion.div>
          </div>
        )}

        {/* K. Teknik Confirmation Popup */}
        {kTeknikConfirm && (
          <div className="fixed inset-0 bg-[#000000d0] backdrop-blur-md z-[9999] flex items-center justify-center p-4">
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-[#121217] border border-cyan-400/60 max-w-sm w-full p-6 rounded-xl shadow-2xl text-white relative font-sans"
            >
              <h3 className="text-sm font-mono font-bold text-center text-cyan-400 mb-2 uppercase tracking-wider">
                SAHKAN KEPUTUSAN TEKNIK (KO/TKO)
              </h3>
              <p className="text-xs text-slate-300 text-center mb-4">
                Sahkan kemenangan sudut <strong className="text-cyan-400">{kTeknikConfirm.toUpperCase()}</strong> dengan status Menang Keputusan Teknik?
              </p>
              <div className="flex gap-2">
                <button
                  onClick={handleApplyKTeknik}
                  className="flex-1 py-2 btn btn-primary font-mono text-xs font-bold cursor-pointer"
                >
                  Sahkan Menang
                </button>
                <button
                  onClick={() => setKTeknikConfirm(null)}
                  className="flex-1 py-2 btn font-mono text-xs cursor-pointer"
                >
                  Batal
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
}
