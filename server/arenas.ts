/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import type { MatchState, MatchHistory, JuriHit, ScoreBreakdown, DewanPenaltyCorner, BaganCategory, BaganMatch, TGRState, TGRPeserta, GelanggangInfo, ArenaSummary } from '../src/types.ts';

export interface ArenaContainer {
  info: GelanggangInfo;
  state: MatchState & {
    juriRawScores: {
      juri1: { merah: { [key: number]: number }; biru: { [key: number]: number } };
      juri2: { merah: { [key: number]: number }; biru: { [key: number]: number } };
      juri3: { merah: { [key: number]: number }; biru: { [key: number]: number } };
    };
  };
  tgrState: TGRState;
  histories: MatchHistory[];
}

// Default tournament bracket database (empty by default)
export const defaultBaganData: BaganCategory[] = [];

export const createInitialMatchState = (gelanggangName: string = "GELANGGANG A"): MatchState => ({
  namaEvent: "PENCAK SILAT",
  gelanggang: gelanggangName,
  partai: "01",
  kelas: "TANDING KELAS",
  gender: "Putra",
  atletMerah: { nama: "", kontingen: "" },
  atletBiru: { nama: "", kontingen: "" },
  selectedWaktu: 120,
  timerActive: false,
  timerSeconds: 120,
  currentBabak: 1,
  matchStatus: "idle",
  logoKanan: null,
  logoKiri: null,
  logoTengah: null,
  juriHits: [],
  scores: {
    merah: { babak1: 0, babak2: 0, babak3: 0, total: 0 },
    biru: { babak1: 0, babak2: 0, babak3: 0, total: 0 }
  },
  dewanPenalties: {
    merah: { binaan1: false, binaan2: false, teguran1: false, teguran2: false, peringatan1: false, peringatan2: false, disqualified: false },
    biru: { binaan1: false, binaan2: false, teguran1: false, teguran2: false, peringatan1: false, peringatan2: false, disqualified: false }
  },
  accumulatedPenaltyDeductions: { merah: 0, biru: 0 },
  directPoints: { merah: 0, biru: 0 },
  verification: {
    active: false,
    type: null,
    votes: { juri1: null, juri2: null, juri3: null },
    result: null
  },
  lastValidScore: null,
  winner: null,
  juryPenaltyAccess: false,
  baganCategories: [],
  activeBaganCategoryId: null,
  activeBaganMatchId: null
});

export const createInitialTGRPeserta = (): TGRPeserta[] => [];

export const createInitialTGRState = (gelanggangName: string = "Gelanggang 1"): TGRState => ({
  namaEvent: "Kejuaraan TGR Pencak Silat IPSI",
  gelanggang: gelanggangName,
  partai: "PARTAI 1",
  babak: "PENYISIHAN",
  sistemSeni: "pool",
  activePesertaId: null,
  pesertaList: [],
  partaiPoolList: [],
  jumlahJuri: 5,
  sessionStatus: "open",
  timerActive: false,
  timerSeconds: 0,
  selectedWaktu: 0,
  auditLogs: [
    { id: "log_1", timestamp: new Date().toISOString(), user: "Sistem", action: `Inisialisasi sistem TGR di ${gelanggangName} Berhasil` }
  ],
  juriCorrections: {},
  logoKanan: null,
  logoKiri: null,
  logoTengah: null
});

export const recalculateArenaScores = (arena: ArenaContainer) => {
  const state = arena.state;
  let totalMerah = state.scores.merah.babak1 + state.scores.merah.babak2 + state.scores.merah.babak3 + state.directPoints.merah;
  let totalBiru = state.scores.biru.babak1 + state.scores.biru.babak2 + state.scores.biru.babak3 + state.directPoints.biru;

  // Subtract accumulated penalties from previous rounds
  if (state.accumulatedPenaltyDeductions) {
    totalMerah -= (state.accumulatedPenaltyDeductions.merah || 0);
    totalBiru -= (state.accumulatedPenaltyDeductions.biru || 0);
  }

  const penM = state.dewanPenalties.merah;
  if (penM.teguran1) totalMerah -= 1;
  if (penM.teguran2) totalMerah -= 2;
  if (penM.peringatan1) totalMerah -= 5;
  if (penM.peringatan2) totalMerah -= 10;

  const penB = state.dewanPenalties.biru;
  if (penB.teguran1) totalBiru -= 1;
  if (penB.teguran2) totalBiru -= 2;
  if (penB.peringatan1) totalBiru -= 5;
  if (penB.peringatan2) totalBiru -= 10;

  state.scores.merah.total = totalMerah;
  state.scores.biru.total = totalBiru;
};

export const recalculateArenaTGRScores = (arena: ArenaContainer) => {
  const tgrState = arena.tgrState;
  const JCount = tgrState.jumlahJuri;

  const getMedian = (arr: number[]): number => {
    if (arr.length === 0) return 0;
    const sorted = [...arr].sort((a, b) => a - b);
    const mid = Math.floor(sorted.length / 2);
    if (sorted.length % 2 !== 0) {
      return sorted[mid];
    } else {
      return (sorted[mid - 1] + sorted[mid]) / 2;
    }
  };

  const getStandardDeviation = (arr: number[]): number => {
    if (arr.length <= 1) return 0;
    const mean = arr.reduce((acc, v) => acc + v, 0) / arr.length;
    const variance = arr.reduce((acc, v) => acc + Math.pow(v - mean, 2), 0) / arr.length;
    return Math.sqrt(variance);
  };

  tgrState.pesertaList.forEach(peserta => {
    const scoresArr = Object.entries(peserta.scores)
      .filter(([key]) => {
        const jNum = parseInt(key.replace('juri', ''));
        return jNum >= 1 && jNum <= JCount;
      })
      .map(([_, val]) => val);

    if (scoresArr.length >= JCount) {
      const baseScore = getMedian(scoresArr);
      const finalScore = parseFloat((baseScore - peserta.deductions).toFixed(3));
      peserta.finalScore = finalScore;
      peserta.status = "Sudah Menilai";
    } else {
      peserta.status = peserta.id === tgrState.activePesertaId ? "Sedang Tampil" : "Belum Menilai";
      delete peserta.finalScore;
    }
  });

  const getKebenaranSum = (p: TGRPeserta) => {
    const kebArr = Object.entries(p.kebenaranScores)
      .filter(([key]) => {
        const jNum = parseInt(key.replace('juri', ''));
        return jNum >= 1 && jNum <= JCount;
      })
      .map(([_, v]) => v);
    return kebArr.reduce((sum, v) => sum + v, 0);
  };

  const getStdDev = (p: TGRPeserta) => {
    const scoresArr = Object.entries(p.scores)
      .filter(([key]) => {
        const jNum = parseInt(key.replace('juri', ''));
        return jNum >= 1 && jNum <= JCount;
      })
      .map(([_, val]) => val);
    return getStandardDeviation(scoresArr);
  };

  const comparePeserta = (a: TGRPeserta, b: TGRPeserta) => {
    if (b.finalScore! !== a.finalScore!) {
      return b.finalScore! - a.finalScore!;
    }
    const kebA = getKebenaranSum(a);
    const kebB = getKebenaranSum(b);
    if (kebB !== kebA) return kebB - kebA;

    const penaltyA = a.deductions || 0;
    const penaltyB = b.deductions || 0;
    if (penaltyA !== penaltyB) return penaltyA - penaltyB;

    const diffA = Math.abs((a.waktuTampil || 0) - 180);
    const diffB = Math.abs((b.waktuTampil || 0) - 180);
    if (diffA !== diffB) return diffA - diffB;

    const stdDevA = getStdDev(a);
    const stdDevB = getStdDev(b);
    if (stdDevA !== stdDevB) return stdDevA - stdDevB;

    const decA = a.dewanDecisionScore || 0;
    const decB = b.dewanDecisionScore || 0;
    return decB - decA;
  };

  const rankedPeserta = [...tgrState.pesertaList]
    .filter(p => p.finalScore !== undefined)
    .sort(comparePeserta);

  tgrState.pesertaList.forEach(peserta => {
    if (peserta.finalScore !== undefined) {
      const idx = rankedPeserta.findIndex(rp => rp.id === peserta.id);
      peserta.ranking = idx + 1;
    } else {
      delete peserta.ranking;
    }
  });

  const uniquePools = Array.from(new Set(tgrState.pesertaList.map(p => p.pool || p.poolName || 'Pool A')));
  uniquePools.forEach(poolName => {
    const poolAthletes = tgrState.pesertaList
      .filter(p => (p.pool || p.poolName || 'Pool A') === poolName && p.finalScore !== undefined)
      .sort(comparePeserta);

    poolAthletes.forEach((p, idx) => {
      const target = tgrState.pesertaList.find(item => item.id === p.id);
      if (target) {
        target.rankingInPool = idx + 1;
      }
    });
  });

  if (tgrState.sistemSeni === 'prestasi' && tgrState.activeVSMatch) {
    const mP = tgrState.pesertaList.find(p => p.id === tgrState.activeVSMatch?.merahPesertaId);
    const bP = tgrState.pesertaList.find(p => p.id === tgrState.activeVSMatch?.biruPesertaId);
    if (mP && bP && mP.finalScore !== undefined && bP.finalScore !== undefined) {
      if (mP.finalScore > bP.finalScore) {
        tgrState.activeVSMatch.winner = 'merah';
      } else if (bP.finalScore > mP.finalScore) {
        tgrState.activeVSMatch.winner = 'biru';
      } else {
        const cmp = comparePeserta(mP, bP);
        tgrState.activeVSMatch.winner = cmp < 0 ? 'merah' : 'biru';
      }
    }
  }
};

export const createDefaultArena = (
  id: string,
  nama: string,
  kode: string,
  keterangan: string = '',
  modeAktif: 'tanding' | 'seni' = 'tanding'
): ArenaContainer => {
  const matchState = createInitialMatchState(nama);
  const tgrState = createInitialTGRState(nama);

  const container: ArenaContainer = {
    info: {
      id,
      nama,
      kode,
      keterangan,
      modeAktif,
      status: 'aktif',
      createdAt: new Date().toISOString()
    },
    state: {
      ...matchState,
      juriRawScores: {
        juri1: { merah: { 1: 0, 2: 0, 3: 0 }, biru: { 1: 0, 2: 0, 3: 0 } },
        juri2: { merah: { 1: 0, 2: 0, 3: 0 }, biru: { 1: 0, 2: 0, 3: 0 } },
        juri3: { merah: { 1: 0, 2: 0, 3: 0 }, biru: { 1: 0, 2: 0, 3: 0 } }
      }
    },
    tgrState,
    histories: [
      {
        id: `hist_${id}_01`,
        namaEvent: "Kejuaraan Pencak Silat Nasional",
        partai: "Partai 01",
        kelas: "Kelas A",
        gender: "Putra",
        atletMerah: { nama: "Fajar Ramadhan", kontingen: "Banten" },
        atletBiru: { nama: "Galang Perkasa", kontingen: "Sumatra Barat" },
        winner: "merah",
        skorAkhirMerah: 28,
        skorAkhirBiru: 19,
        tanggal: new Date(Date.now() - 7200000).toISOString()
      }
    ]
  };

  recalculateArenaTGRScores(container);
  recalculateArenaScores(container);

  return container;
};

// Authoritative in-memory Multi-Arena Map
export const arenasMap: Record<string, ArenaContainer> = {
  arena_1: createDefaultArena("arena_1", "GELANGGANG A", "A", "Matras A - Arena Utama", "tanding"),
  arena_2: createDefaultArena("arena_2", "GELANGGANG B", "B", "Matras B - Arena B", "tanding"),
  arena_3: createDefaultArena("arena_3", "GELANGGANG C", "C", "Matras C - Arena Seni", "seni")
};

// Helper to safely get an arena
export const getArena = (arenaId?: string): ArenaContainer => {
  if (arenaId && arenasMap[arenaId]) {
    return arenasMap[arenaId];
  }
  // If specific ID requested but doesn't exist, create it dynamically
  if (arenaId && arenaId.trim()) {
    const cleanId = arenaId.trim().toLowerCase().replace(/[^a-z0-9_]/g, '_');
    const displayNum = Object.keys(arenasMap).length + 1;
    arenasMap[cleanId] = createDefaultArena(cleanId, `Gelanggang ${displayNum}`, `${displayNum}`, `Matras ${displayNum}`);
    return arenasMap[cleanId];
  }
  // Default to arena_1 or first available
  const firstKey = Object.keys(arenasMap)[0] || 'arena_1';
  if (!arenasMap[firstKey]) {
    arenasMap[firstKey] = createDefaultArena(firstKey, "Gelanggang 1", "1", "Matras 1");
  }
  return arenasMap[firstKey];
};

export const getArenasList = (): GelanggangInfo[] => {
  return Object.values(arenasMap).map(a => a.info);
};

export const getArenasSummary = (): ArenaSummary[] => {
  return Object.values(arenasMap).map(a => {
    const s = a.state;
    const t = a.tgrState;
    const activePeserta = t.pesertaList.find(p => p.id === t.activePesertaId);

    return {
      id: a.info.id,
      nama: a.info.nama,
      kode: a.info.kode,
      keterangan: a.info.keterangan,
      modeAktif: a.info.modeAktif || 'tanding',
      status: a.info.status || 'aktif',
      // Tanding
      tandingPartai: s.partai || '01',
      tandingBabak: s.currentBabak,
      tandingKelas: s.kelas || 'A',
      tandingMerahNama: s.atletMerah.nama,
      tandingMerahKontingen: s.atletMerah.kontingen,
      tandingMerahSkor: s.scores.merah.total,
      tandingBiruNama: s.atletBiru.nama,
      tandingBiruKontingen: s.atletBiru.kontingen,
      tandingBiruSkor: s.scores.biru.total,
      tandingTimerActive: s.timerActive,
      tandingTimerSeconds: s.timerSeconds,
      tandingMatchStatus: s.matchStatus,
      tandingWinner: s.winner,
      // Seni
      seniPartai: activePeserta?.partai || t.partai || (activePeserta ? `PARTAI ${activePeserta.noUrut}` : 'PARTAI 1'),
      seniBabak: t.babak,
      seniKategori: activePeserta?.kategori || 'Tunggal',
      seniActivePesertaNama: activePeserta?.nama || '-',
      seniActivePesertaKontingen: activePeserta?.kontingen || '-',
      seniActivePesertaSkor: activePeserta?.finalScore,
      seniTimerActive: t.timerActive,
      seniTimerSeconds: t.timerSeconds,
      totalPesertaSeni: t.pesertaList.length,
      totalHistories: a.histories.length
    };
  });
};

export const updateArenaBaganWinner = (arena: ArenaContainer, catId: string, matchId: number, winner: 'merah' | 'biru' | null) => {
  const state = arena.state;
  if (!state.baganCategories) return;

  state.baganCategories = state.baganCategories.map(cat => {
    if (cat.id !== catId) return cat;

    const updatedMatches = cat.matches.map(m => ({
      ...m,
      atletMerah: { ...m.atletMerah },
      atletBiru: { ...m.atletBiru },
      winner: m.id === matchId ? winner : m.winner
    }));

    const size = cat.size || 4;
    const numInitialMatches = Math.max(1, Math.floor(size / 2));

    // Clear all downstream matches beyond round 1, except preserving resolved winner matches if valid
    for (let i = numInitialMatches; i < updatedMatches.length; i++) {
      updatedMatches[i].atletMerah = { nama: '', kontingen: '' };
      updatedMatches[i].atletBiru = { nama: '', kontingen: '' };
    }

    // Topological progression: Athletes stay strictly in this arena's bracket
    for (let i = 0; i < updatedMatches.length; i++) {
      const match = updatedMatches[i];
      const mId = match.id;
      const w = match.winner;
      const advAthlete = w === 'merah'
        ? { ...match.atletMerah }
        : w === 'biru'
        ? { ...match.atletBiru }
        : { nama: '', kontingen: '' };

      if (size === 4) {
        if (mId === 1 && updatedMatches[2]) updatedMatches[2].atletMerah = advAthlete;
        else if (mId === 2 && updatedMatches[2]) updatedMatches[2].atletBiru = advAthlete;
      } else if (size === 8) {
        if (mId === 1 && updatedMatches[4]) updatedMatches[4].atletMerah = advAthlete;
        else if (mId === 2 && updatedMatches[4]) updatedMatches[4].atletBiru = advAthlete;
        else if (mId === 3 && updatedMatches[5]) updatedMatches[5].atletMerah = advAthlete;
        else if (mId === 4 && updatedMatches[5]) updatedMatches[5].atletBiru = advAthlete;
        else if (mId === 5 && updatedMatches[6]) updatedMatches[6].atletMerah = advAthlete;
        else if (mId === 6 && updatedMatches[6]) updatedMatches[6].atletBiru = advAthlete;
      } else if (size === 16) {
        // Matches 1-8 -> 9-12 (indices 8-11)
        if (mId === 1 && updatedMatches[8]) updatedMatches[8].atletMerah = advAthlete;
        else if (mId === 2 && updatedMatches[8]) updatedMatches[8].atletBiru = advAthlete;
        else if (mId === 3 && updatedMatches[9]) updatedMatches[9].atletMerah = advAthlete;
        else if (mId === 4 && updatedMatches[9]) updatedMatches[9].atletBiru = advAthlete;
        else if (mId === 5 && updatedMatches[10]) updatedMatches[10].atletMerah = advAthlete;
        else if (mId === 6 && updatedMatches[10]) updatedMatches[10].atletBiru = advAthlete;
        else if (mId === 7 && updatedMatches[11]) updatedMatches[11].atletMerah = advAthlete;
        else if (mId === 8 && updatedMatches[11]) updatedMatches[11].atletBiru = advAthlete;
        // Matches 9-12 -> 13-14 (indices 12-13)
        else if (mId === 9 && updatedMatches[12]) updatedMatches[12].atletMerah = advAthlete;
        else if (mId === 10 && updatedMatches[12]) updatedMatches[12].atletBiru = advAthlete;
        else if (mId === 11 && updatedMatches[13]) updatedMatches[13].atletMerah = advAthlete;
        else if (mId === 12 && updatedMatches[13]) updatedMatches[13].atletBiru = advAthlete;
        // Matches 13-14 -> 15 (index 14)
        else if (mId === 13 && updatedMatches[14]) updatedMatches[14].atletMerah = advAthlete;
        else if (mId === 14 && updatedMatches[14]) updatedMatches[14].atletBiru = advAthlete;
      }
    }

    return {
      ...cat,
      matches: updatedMatches
    };
  });
};

export const determineArenaWinner = (arena: ArenaContainer) => {
  const state = arena.state;
  if (state.dewanPenalties.merah.disqualified) {
    state.winner = 'biru';
    state.matchStatus = 'selesai';
  } else if (state.dewanPenalties.biru.disqualified) {
    state.winner = 'merah';
    state.matchStatus = 'selesai';
  } else {
    if (state.scores.merah.total > state.scores.biru.total) {
      state.winner = 'merah';
    } else if (state.scores.biru.total > state.scores.merah.total) {
      state.winner = 'biru';
    } else {
      state.winner = null;
    }
    state.matchStatus = 'selesai';
  }

  const newHistory: MatchHistory = {
    id: Math.random().toString(36).substring(2),
    namaEvent: state.namaEvent,
    partai: state.partai,
    kelas: state.kelas,
    gender: state.gender,
    atletMerah: { ...state.atletMerah },
    atletBiru: { ...state.atletBiru },
    winner: state.winner,
    skorAkhirMerah: state.scores.merah.total,
    skorAkhirBiru: state.scores.biru.total,
    tanggal: new Date().toISOString()
  };
  arena.histories.push(newHistory);

  if (state.activeBaganCategoryId && state.activeBaganMatchId) {
    updateArenaBaganWinner(arena, state.activeBaganCategoryId, state.activeBaganMatchId, state.winner);
  }
};
