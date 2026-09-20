/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import * as XLSX from 'xlsx';
import { MatchHistory, TGRPeserta, MatchState, BaganCategory, BaganMatch, GelanggangInfo } from '../types';

export interface ContingentAthlete {
  id: string;
  nama: string;
  kontingen: string;
  kategori: string;
  kelas?: string;
  usia?: string;
  gender?: 'Putra' | 'Putri';
  type: 'tanding' | 'seni';
}

export interface CategoryMedalist {
  category: string;
  atletNama: string;
  kontingen: string;
  medalType: 'gold' | 'silver' | 'bronze';
  scoreOrDetail?: string;
  matchType: 'tanding' | 'seni';
}

export interface ContingentMedalRecord {
  kontingen: string;
  totalAtlet: number;
  athletes: ContingentAthlete[];
  gold: number;
  silver: number;
  bronze: number;
  total: number;
  points: number; // Emas = 5, Perak = 3, Perunggu = 1
  rank: number;
  byCategory: {
    tanding: { gold: number; silver: number; bronze: number };
    tunggal: { gold: number; silver: number; bronze: number };
    ganda: { gold: number; silver: number; bronze: number };
    regu: { gold: number; silver: number; bronze: number };
    bebas: { gold: number; silver: number; bronze: number };
  };
  medalists: CategoryMedalist[];
  manualAdjustment?: {
    gold: number;
    silver: number;
    bronze: number;
    note?: string;
  };
}

export interface CategoryMedalWinnerGroup {
  categoryKey: string;
  categoryName: string;
  type: 'TANDING' | 'SENI';
  goldWinner?: { nama: string; kontingen: string; scoreInfo: string };
  silverWinner?: { nama: string; kontingen: string; scoreInfo: string };
  bronzeWinners: { nama: string; kontingen: string; scoreInfo: string }[];
}

/**
 * Load all registered/uploaded athletes from localStorage & current state
 */
export function loadAllUploadedAthletes(): ContingentAthlete[] {
  const result: ContingentAthlete[] = [];
  const seenKey = new Set<string>();

  // 1. Tanding registered athletes from localStorage
  try {
    const savedTanding = localStorage.getItem('silat_registered_athletes');
    if (savedTanding) {
      const parsed = JSON.parse(savedTanding);
      if (Array.isArray(parsed)) {
        parsed.forEach((a: any, idx: number) => {
          if (!a.nama || !a.kontingen) return;
          const k = `${a.nama.trim().toLowerCase()}_${a.kontingen.trim().toLowerCase()}_tanding`;
          if (!seenKey.has(k)) {
            seenKey.add(k);
            result.push({
              id: a.id || `tanding_ath_${idx}_${Date.now()}`,
              nama: a.nama.trim(),
              kontingen: a.kontingen.trim().toUpperCase(),
              kategori: `Tanding ${a.kelas || ''} ${a.gender ? `(${a.gender})` : ''}`.trim(),
              kelas: a.kelas,
              usia: a.usia,
              gender: a.gender,
              type: 'tanding'
            });
          }
        });
      }
    }
  } catch (e) {
    console.error("Failed to load silat_registered_athletes", e);
  }

  // 2. Seni registered athletes from localStorage
  try {
    const savedSeni = localStorage.getItem('silat_tgr_registered_athletes');
    if (savedSeni) {
      const parsed = JSON.parse(savedSeni);
      if (Array.isArray(parsed)) {
        parsed.forEach((a: any, idx: number) => {
          if (!a.nama || !a.kontingen) return;
          const k = `${a.nama.trim().toLowerCase()}_${a.kontingen.trim().toLowerCase()}_seni`;
          if (!seenKey.has(k)) {
            seenKey.add(k);
            result.push({
              id: a.id || `seni_ath_${idx}_${Date.now()}`,
              nama: a.nama.trim(),
              kontingen: a.kontingen.trim().toUpperCase(),
              kategori: `Seni ${a.kelas || a.kategori || 'Tunggal'} ${a.gender ? `(${a.gender})` : ''}`.trim(),
              kelas: a.kelas || a.kategori,
              usia: a.usia,
              gender: a.gender,
              type: 'seni'
            });
          }
        });
      }
    }
  } catch (e) {
    console.error("Failed to load silat_tgr_registered_athletes", e);
  }

  // 3. Custom contingents uploaded via Rekapitulasi modal
  try {
    const customList = localStorage.getItem('silat_custom_contingents');
    if (customList) {
      const parsed = JSON.parse(customList);
      if (Array.isArray(parsed)) {
        parsed.forEach((c: any, idx: number) => {
          const kontingen = (typeof c === 'string' ? c : c.kontingen || '').trim().toUpperCase();
          if (!kontingen) return;
          const nama = (typeof c === 'object' && c.nama) ? c.nama.trim() : `Pesilat ${kontingen}`;
          const k = `${nama.toLowerCase()}_${kontingen.toLowerCase()}`;
          if (!seenKey.has(k)) {
            seenKey.add(k);
            result.push({
              id: (typeof c === 'object' && c.id) ? c.id : `custom_ath_${idx}_${Date.now()}`,
              nama,
              kontingen,
              kategori: (typeof c === 'object' && c.kategori) ? c.kategori : 'Pesilat Kontingen',
              kelas: (typeof c === 'object' && c.kelas) ? c.kelas : undefined,
              usia: (typeof c === 'object' && c.usia) ? c.usia : undefined,
              gender: (typeof c === 'object' && c.gender) ? c.gender : 'Putra',
              type: 'tanding'
            });
          }
        });
      }
    }
  } catch (e) {
    console.error("Failed to load silat_custom_contingents", e);
  }

  return result;
}

/**
 * Load manual adjustments for contingent medals
 */
export function loadContingentMedalAdjustments(): Record<string, { gold: number; silver: number; bronze: number; note?: string }> {
  try {
    const saved = localStorage.getItem('silat_contingent_medal_adjustments');
    if (saved) {
      return JSON.parse(saved);
    }
  } catch (e) {
    console.error("Failed to load silat_contingent_medal_adjustments", e);
  }
  return {};
}

/**
 * Save manual adjustments for contingent medals
 */
export function saveContingentMedalAdjustments(adjustments: Record<string, { gold: number; silver: number; bronze: number; note?: string }>) {
  try {
    localStorage.setItem('silat_contingent_medal_adjustments', JSON.stringify(adjustments));
  } catch (e) {
    console.error("Failed to save silat_contingent_medal_adjustments", e);
  }
}

/**
 * Main Calculator for Contingent Medal Recapitulation
 */
export function calculateContingentMedals({
  histories = [],
  tgrPeserta = [],
  state = null,
  allArenasMap = {},
  uploadedAthletes = [],
  adjustments = {},
  sortBy = 'medals' // 'medals' | 'points' | 'name' | 'athletes'
}: {
  histories?: MatchHistory[];
  tgrPeserta?: TGRPeserta[];
  state?: MatchState | null;
  allArenasMap?: Record<string, { state: MatchState; tgrState: any; histories: MatchHistory[]; info: GelanggangInfo }>;
  uploadedAthletes?: ContingentAthlete[];
  adjustments?: Record<string, { gold: number; silver: number; bronze: number; note?: string }>;
  sortBy?: 'medals' | 'points' | 'name' | 'athletes';
}): {
  records: ContingentMedalRecord[];
  categoryGroups: CategoryMedalWinnerGroup[];
  allContingentsList: string[];
  totalGold: number;
  totalSilver: number;
  totalBronze: number;
  totalMedals: number;
  totalRegisteredAthletes: number;
} {
  // 1. Gather all histories from current arena + all other arenas in allArenasMap
  const combinedHistories: MatchHistory[] = [...histories];
  const seenHistoryIds = new Set<string>(histories.map(h => h.id || `${h.partai}_${h.kelas}`));

  if (allArenasMap && typeof allArenasMap === 'object') {
    Object.values(allArenasMap).forEach(arenaData => {
      if (arenaData && Array.isArray(arenaData.histories)) {
        arenaData.histories.forEach(h => {
          const key = h.id || `${h.partai}_${h.kelas}`;
          if (!seenHistoryIds.has(key)) {
            seenHistoryIds.add(key);
            combinedHistories.push(h);
          }
        });
      }
    });
  }

  // 2. Gather all completed Seni participants
  const combinedSeni: TGRPeserta[] = [...tgrPeserta];
  const seenSeniIds = new Set<string>(tgrPeserta.map(p => p.id || `${p.nama}_${p.kontingen}`));

  if (allArenasMap && typeof allArenasMap === 'object') {
    Object.values(allArenasMap).forEach(arenaData => {
      if (arenaData?.tgrState?.pesertaList && Array.isArray(arenaData.tgrState.pesertaList)) {
        arenaData.tgrState.pesertaList.forEach((p: TGRPeserta) => {
          const key = p.id || `${p.nama}_${p.kontingen}`;
          if (!seenSeniIds.has(key) && (p.status === 'Sudah Menilai' || p.finalScore !== undefined)) {
            seenSeniIds.add(key);
            combinedSeni.push(p);
          }
        });
      }
    });
  }

  // 3. Gather Bracket categories (from state, allArenasMap, or localStorage)
  const baganCategories: BaganCategory[] = [];
  const seenCatIds = new Set<string>();

  if (state?.baganCategories && Array.isArray(state.baganCategories)) {
    state.baganCategories.forEach(c => {
      if (!seenCatIds.has(c.id)) {
        seenCatIds.add(c.id);
        baganCategories.push(c);
      }
    });
  }

  if (allArenasMap && typeof allArenasMap === 'object') {
    Object.values(allArenasMap).forEach(arenaData => {
      if (arenaData?.state?.baganCategories && Array.isArray(arenaData.state.baganCategories)) {
        arenaData.state.baganCategories.forEach(c => {
          if (!seenCatIds.has(c.id)) {
            seenCatIds.add(c.id);
            baganCategories.push(c);
          }
        });
      }
    });
  }

  try {
    const savedBagan = localStorage.getItem('silat_bagan_data');
    if (savedBagan) {
      const parsed = JSON.parse(savedBagan);
      if (Array.isArray(parsed)) {
        parsed.forEach((c: BaganCategory) => {
          if (!seenCatIds.has(c.id)) {
            seenCatIds.add(c.id);
            baganCategories.push(c);
          }
        });
      }
    }
  } catch (e) {
    console.error("Failed to parse silat_bagan_data", e);
  }

  // 4. Initialize Contingent Records Map
  const contingentMap: Record<string, ContingentMedalRecord> = {};

  const getOrCreate = (rawName: string): ContingentMedalRecord => {
    const clean = rawName.trim().toUpperCase();
    if (!contingentMap[clean]) {
      contingentMap[clean] = {
        kontingen: clean,
        totalAtlet: 0,
        athletes: [],
        gold: 0,
        silver: 0,
        bronze: 0,
        total: 0,
        points: 0,
        rank: 1,
        byCategory: {
          tanding: { gold: 0, silver: 0, bronze: 0 },
          tunggal: { gold: 0, silver: 0, bronze: 0 },
          ganda: { gold: 0, silver: 0, bronze: 0 },
          regu: { gold: 0, silver: 0, bronze: 0 },
          bebas: { gold: 0, silver: 0, bronze: 0 },
        },
        medalists: []
      };
    }
    return contingentMap[clean];
  };

  // 5. Populate All Uploaded Athletes into their Contingents
  uploadedAthletes.forEach(ath => {
    if (!ath.kontingen) return;
    const rec = getOrCreate(ath.kontingen);
    rec.athletes.push(ath);
  });

  // Calculate unique athletes per contingent
  Object.values(contingentMap).forEach(rec => {
    const uniqueNames = new Set(rec.athletes.map(a => a.nama.toLowerCase().trim()));
    rec.totalAtlet = uniqueNames.size || rec.athletes.length;
  });

  // 6. Track Category Winners Group
  const categoryGroupsMap: Record<string, CategoryMedalWinnerGroup> = {};

  // 7. Calculate Medals from Tanding Brackets & Match Histories
  // A. Process Bracket Categories (Bagan)
  baganCategories.forEach(cat => {
    const catName = cat.name || `Tanding ${cat.kelas || ''} (${cat.gender || ''})`.trim();
    const catKey = `TANDING_${cat.id || catName}`;

    if (!categoryGroupsMap[catKey]) {
      categoryGroupsMap[catKey] = {
        categoryKey: catKey,
        categoryName: `TANDING - ${catName.toUpperCase()}`,
        type: 'TANDING',
        bronzeWinners: []
      };
    }

    const matches = cat.matches || [];
    // Final match in bracket
    const finalMatch = matches.find(m => m.round === 'final');
    if (finalMatch && finalMatch.winner) {
      const isRedWin = finalMatch.winner === 'merah';
      const goldAth = isRedWin ? finalMatch.atletMerah : finalMatch.atletBiru;
      const silvAth = isRedWin ? finalMatch.atletBiru : finalMatch.atletMerah;

      if (goldAth?.kontingen) {
        const rec = getOrCreate(goldAth.kontingen);
        rec.gold += 1;
        rec.byCategory.tanding.gold += 1;
        rec.medalists.push({
          category: `TANDING - ${catName.toUpperCase()}`,
          atletNama: goldAth.nama,
          kontingen: goldAth.kontingen.toUpperCase(),
          medalType: 'gold',
          scoreOrDetail: `Juara 1 (Babak Final)`,
          matchType: 'tanding'
        });
        categoryGroupsMap[catKey].goldWinner = {
          nama: goldAth.nama,
          kontingen: goldAth.kontingen.toUpperCase(),
          scoreInfo: `Pemenang Babak Final (${finalMatch.partai || 'Partai Final'})`
        };
      }

      if (silvAth?.kontingen) {
        const rec = getOrCreate(silvAth.kontingen);
        rec.silver += 1;
        rec.byCategory.tanding.silver += 1;
        rec.medalists.push({
          category: `TANDING - ${catName.toUpperCase()}`,
          atletNama: silvAth.nama,
          kontingen: silvAth.kontingen.toUpperCase(),
          medalType: 'silver',
          scoreOrDetail: `Juara 2 / Perak (Finalis)`,
          matchType: 'tanding'
        });
        categoryGroupsMap[catKey].silverWinner = {
          nama: silvAth.nama,
          kontingen: silvAth.kontingen.toUpperCase(),
          scoreInfo: `Finalis / Runner-up (${finalMatch.partai || 'Partai Final'})`
        };
      }
    }

    // Semifinal matches in bracket -> Losers get Perunggu Bersama (Bronze 1 & Bronze 2)
    const semiMatches = matches.filter(m => m.round === 'semi');
    semiMatches.forEach((sm, smIdx) => {
      if (sm.winner) {
        // The loser of semifinal receives bronze
        const loser = sm.winner === 'merah' ? sm.atletBiru : sm.atletMerah;
        if (loser?.kontingen && loser.nama && loser.nama.toLowerCase() !== 'bye') {
          const rec = getOrCreate(loser.kontingen);
          rec.bronze += 1;
          rec.byCategory.tanding.bronze += 1;
          rec.medalists.push({
            category: `TANDING - ${catName.toUpperCase()}`,
            atletNama: loser.nama,
            kontingen: loser.kontingen.toUpperCase(),
            medalType: 'bronze',
            scoreOrDetail: `Juara 3 Bersama (Semifinalis)`,
            matchType: 'tanding'
          });
          categoryGroupsMap[catKey].bronzeWinners.push({
            nama: loser.nama,
            kontingen: loser.kontingen.toUpperCase(),
            scoreInfo: `Semifinalis (${sm.partai || `Semifinal ${smIdx + 1}`})`
          });
        }
      }
    });
  });

  // B. Process Completed Match Histories (for matches not already counted via brackets)
  combinedHistories.forEach(h => {
    const isFinalPartai = (h.partai || '').toLowerCase().includes('final') && !(h.partai || '').toLowerCase().includes('semi') && !(h.partai || '').toLowerCase().includes('perempat');
    const isSemiPartai = (h.partai || '').toLowerCase().includes('semi');

    const catName = `TANDING ${h.kelas || ''} (${h.gender || ''})`.trim().toUpperCase();
    const catKey = `TANDING_${catName}`;

    // If bracket hasn't already awarded medals for this category, or if history was final
    if (!categoryGroupsMap[catKey]) {
      categoryGroupsMap[catKey] = {
        categoryKey: catKey,
        categoryName: `TANDING - ${catName}`,
        type: 'TANDING',
        bronzeWinners: []
      };
    }

    // Only process if category group doesn't have gold winner yet and this match is marked final
    if (!categoryGroupsMap[catKey].goldWinner && (isFinalPartai || baganCategories.length === 0)) {
      if (h.winner === 'merah' || h.winner === 'biru') {
        const goldAth = h.winner === 'merah' ? h.atletMerah : h.atletBiru;
        const silvAth = h.winner === 'merah' ? h.atletBiru : h.atletMerah;
        const scoreStr = h.winner === 'merah' ? `${h.skorAkhirMerah} - ${h.skorAkhirBiru}` : `${h.skorAkhirBiru} - ${h.skorAkhirMerah}`;

        if (goldAth?.kontingen) {
          const rec = getOrCreate(goldAth.kontingen);
          rec.gold += 1;
          rec.byCategory.tanding.gold += 1;
          rec.medalists.push({
            category: `TANDING - ${catName}`,
            atletNama: goldAth.nama,
            kontingen: goldAth.kontingen.toUpperCase(),
            medalType: 'gold',
            scoreOrDetail: `Skor ${scoreStr} (Partai ${h.partai})`,
            matchType: 'tanding'
          });
          categoryGroupsMap[catKey].goldWinner = {
            nama: goldAth.nama,
            kontingen: goldAth.kontingen.toUpperCase(),
            scoreInfo: `Partai ${h.partai} (Skor ${scoreStr})`
          };
        }

        if (silvAth?.kontingen) {
          const rec = getOrCreate(silvAth.kontingen);
          rec.silver += 1;
          rec.byCategory.tanding.silver += 1;
          rec.medalists.push({
            category: `TANDING - ${catName}`,
            atletNama: silvAth.nama,
            kontingen: silvAth.kontingen.toUpperCase(),
            medalType: 'silver',
            scoreOrDetail: `Partai ${h.partai}`,
            matchType: 'tanding'
          });
          categoryGroupsMap[catKey].silverWinner = {
            nama: silvAth.nama,
            kontingen: silvAth.kontingen.toUpperCase(),
            scoreInfo: `Partai ${h.partai}`
          };
        }
      }
    } else if (isSemiPartai && categoryGroupsMap[catKey].bronzeWinners.length < 2) {
      // Award bronze to loser of semifinal
      if (h.winner === 'merah' || h.winner === 'biru') {
        const loser = h.winner === 'merah' ? h.atletBiru : h.atletMerah;
        if (loser?.kontingen && !categoryGroupsMap[catKey].bronzeWinners.some(bw => bw.nama === loser.nama)) {
          const rec = getOrCreate(loser.kontingen);
          rec.bronze += 1;
          rec.byCategory.tanding.bronze += 1;
          rec.medalists.push({
            category: `TANDING - ${catName}`,
            atletNama: loser.nama,
            kontingen: loser.kontingen.toUpperCase(),
            medalType: 'bronze',
            scoreOrDetail: `Semifinalis (Partai ${h.partai})`,
            matchType: 'tanding'
          });
          categoryGroupsMap[catKey].bronzeWinners.push({
            nama: loser.nama,
            kontingen: loser.kontingen.toUpperCase(),
            scoreInfo: `Partai ${h.partai}`
          });
        }
      }
    }
  });

  // 8. Calculate Medals from Completed Seni (TGR) Participants
  const seniByCategory: Record<string, TGRPeserta[]> = {};
  combinedSeni.forEach(p => {
    const k = (p.kategori || 'Tunggal').toUpperCase().trim();
    if (!seniByCategory[k]) seniByCategory[k] = [];
    seniByCategory[k].push(p);
  });

  Object.entries(seniByCategory).forEach(([katName, pList]) => {
    const sorted = [...pList].sort((a, b) => (b.finalScore || 0) - (a.finalScore || 0));
    const catKey = `SENI_${katName}`;

    if (!categoryGroupsMap[catKey]) {
      categoryGroupsMap[catKey] = {
        categoryKey: catKey,
        categoryName: `SENI - ${katName}`,
        type: 'SENI',
        bronzeWinners: []
      };
    }

    const katLower = katName.toLowerCase();
    let katGroup: 'tunggal' | 'ganda' | 'regu' | 'bebas' = 'tunggal';
    if (katLower.includes('ganda')) katGroup = 'ganda';
    else if (katLower.includes('regu')) katGroup = 'regu';
    else if (katLower.includes('bebas') || katLower.includes('solo')) katGroup = 'bebas';

    // Rank 1: Gold 🥇
    if (sorted[0] && sorted[0].kontingen) {
      const p = sorted[0];
      const rec = getOrCreate(p.kontingen);
      rec.gold += 1;
      rec.byCategory[katGroup].gold += 1;
      const scoreStr = `Nilai ${p.finalScore != null ? p.finalScore.toFixed(3) : '-'}`;
      rec.medalists.push({
        category: `SENI - ${katName}`,
        atletNama: p.nama,
        kontingen: p.kontingen.toUpperCase(),
        medalType: 'gold',
        scoreOrDetail: scoreStr,
        matchType: 'seni'
      });
      categoryGroupsMap[catKey].goldWinner = {
        nama: p.nama,
        kontingen: p.kontingen.toUpperCase(),
        scoreInfo: scoreStr
      };
    }

    // Rank 2: Silver 🥈
    if (sorted[1] && sorted[1].kontingen) {
      const p = sorted[1];
      const rec = getOrCreate(p.kontingen);
      rec.silver += 1;
      rec.byCategory[katGroup].silver += 1;
      const scoreStr = `Nilai ${p.finalScore != null ? p.finalScore.toFixed(3) : '-'}`;
      rec.medalists.push({
        category: `SENI - ${katName}`,
        atletNama: p.nama,
        kontingen: p.kontingen.toUpperCase(),
        medalType: 'silver',
        scoreOrDetail: scoreStr,
        matchType: 'seni'
      });
      categoryGroupsMap[catKey].silverWinner = {
        nama: p.nama,
        kontingen: p.kontingen.toUpperCase(),
        scoreInfo: scoreStr
      };
    }

    // Rank 3: Bronze 🥉
    if (sorted[2] && sorted[2].kontingen) {
      const p = sorted[2];
      const rec = getOrCreate(p.kontingen);
      rec.bronze += 1;
      rec.byCategory[katGroup].bronze += 1;
      const scoreStr = `Nilai ${p.finalScore != null ? p.finalScore.toFixed(3) : '-'}`;
      rec.medalists.push({
        category: `SENI - ${katName}`,
        atletNama: p.nama,
        kontingen: p.kontingen.toUpperCase(),
        medalType: 'bronze',
        scoreOrDetail: scoreStr,
        matchType: 'seni'
      });
      categoryGroupsMap[catKey].bronzeWinners.push({
        nama: p.nama,
        kontingen: p.kontingen.toUpperCase(),
        scoreInfo: scoreStr
      });
    }
  });

  // 9. Apply Manual Adjustments & Calculate Totals / Points
  Object.values(contingentMap).forEach(rec => {
    const adj = adjustments[rec.kontingen];
    if (adj) {
      rec.manualAdjustment = adj;
      rec.gold += (adj.gold || 0);
      rec.silver += (adj.silver || 0);
      rec.bronze += (adj.bronze || 0);
      if (adj.gold > 0) rec.byCategory.tanding.gold += adj.gold;
    }

    rec.total = rec.gold + rec.silver + rec.bronze;
    // Standard IPSI Scoring: Emas = 5 poin, Perak = 3 poin, Perunggu = 1 poin
    rec.points = (rec.gold * 5) + (rec.silver * 3) + (rec.bronze * 1);
  });

  // 10. Sort Contingent Records
  let records = Object.values(contingentMap);

  if (sortBy === 'points') {
    records.sort((a, b) => b.points - a.points || b.gold - a.gold || b.silver - a.silver || b.bronze - a.bronze || b.totalAtlet - a.totalAtlet || a.kontingen.localeCompare(b.kontingen));
  } else if (sortBy === 'name') {
    records.sort((a, b) => a.kontingen.localeCompare(b.kontingen));
  } else if (sortBy === 'athletes') {
    records.sort((a, b) => b.totalAtlet - a.totalAtlet || b.gold - a.gold || b.points - a.points || a.kontingen.localeCompare(b.kontingen));
  } else {
    // Default: 'medals' (Gold -> Silver -> Bronze -> Total -> Points -> Total Athletes -> Alphabetical)
    records.sort((a, b) => 
      b.gold - a.gold || 
      b.silver - a.silver || 
      b.bronze - a.bronze || 
      b.total - a.total || 
      b.points - a.points || 
      b.totalAtlet - a.totalAtlet || 
      a.kontingen.localeCompare(b.kontingen)
    );
  }

  // Assign Ranks
  records.forEach((rec, idx) => {
    rec.rank = idx + 1;
  });

  // Calculate Global Summary Totals
  let totalGold = 0;
  let totalSilver = 0;
  let totalBronze = 0;
  let totalRegisteredAthletes = 0;

  records.forEach(r => {
    totalGold += r.gold;
    totalSilver += r.silver;
    totalBronze += r.bronze;
    totalRegisteredAthletes += r.totalAtlet;
  });

  const totalMedals = totalGold + totalSilver + totalBronze;
  const allContingentsList = records.map(r => r.kontingen).sort();
  const categoryGroups = Object.values(categoryGroupsMap);

  return {
    records,
    categoryGroups,
    allContingentsList,
    totalGold,
    totalSilver,
    totalBronze,
    totalMedals,
    totalRegisteredAthletes
  };
}

/**
 * Multi-Sheet Excel (.xlsx) Export for Contingent Medal Recapitulation
 */
export function exportContingentMedalsToExcel({
  records,
  categoryGroups,
  tournamentName = 'KEJUARAAN PENCAK SILAT NASIONAL',
  fileName
}: {
  records: ContingentMedalRecord[];
  categoryGroups: CategoryMedalWinnerGroup[];
  tournamentName?: string;
  fileName?: string;
}) {
  const wb = XLSX.utils.book_new();

  // Sheet 1: Klasemen Medali Kontingen
  const medaliSheetData = records.map(r => ({
    'Peringkat': r.rank,
    'Nama Kontingen': r.kontingen,
    'Jumlah Atlet': r.totalAtlet,
    'Emas (Gold 🥇)': r.gold,
    'Perak (Silver 🥈)': r.silver,
    'Perunggu (Bronze 🥉)': r.bronze,
    'Total Medali': r.total,
    'Total Poin': r.points,
    'Emas Tanding': r.byCategory.tanding.gold,
    'Emas Seni Tunggal': r.byCategory.tunggal.gold,
    'Emas Seni Ganda': r.byCategory.ganda.gold,
    'Emas Seni Regu': r.byCategory.regu.gold,
    'Emas Solo/Bebas': r.byCategory.bebas.gold
  }));
  const wsMedali = XLSX.utils.json_to_sheet(medaliSheetData);
  XLSX.utils.book_append_sheet(wb, wsMedali, 'Klasemen Medali Kontingen');

  // Sheet 2: Daftar Juara Per Kategori
  const juaraSheetData = categoryGroups.map((g, idx) => ({
    'No': idx + 1,
    'Kategori Pertandingan': g.categoryName,
    'Jenis Cabang': g.type,
    'Juara 1 (Emas)': g.goldWinner?.nama || '-',
    'Kontingen Emas': g.goldWinner?.kontingen || '-',
    'Juara 2 (Perak)': g.silverWinner?.nama || '-',
    'Kontingen Perak': g.silverWinner?.kontingen || '-',
    'Juara 3 Bersama 1': g.bronzeWinners[0]?.nama || '-',
    'Kontingen Perunggu 1': g.bronzeWinners[0]?.kontingen || '-',
    'Juara 3 Bersama 2': g.bronzeWinners[1]?.nama || '-',
    'Kontingen Perunggu 2': g.bronzeWinners[1]?.kontingen || '-'
  }));
  const wsJuara = XLSX.utils.json_to_sheet(juaraSheetData);
  XLSX.utils.book_append_sheet(wb, wsJuara, 'Juara Per Kategori');

  // Sheet 3: Daftar Seluruh Atlet Terupload Per Kontingen
  const allAthletesData: any[] = [];
  records.forEach(r => {
    r.athletes.forEach((ath, athIdx) => {
      allAthletesData.push({
        'Nama Kontingen': r.kontingen,
        'No': athIdx + 1,
        'Nama Atlet': ath.nama,
        'Kategori': ath.kategori,
        'Kelas': ath.kelas || '-',
        'Kategori Usia': ath.usia || '-',
        'Jenis Kelamin': ath.gender || '-'
      });
    });
  });

  if (allAthletesData.length > 0) {
    const wsAthletes = XLSX.utils.json_to_sheet(allAthletesData);
    XLSX.utils.book_append_sheet(wb, wsAthletes, 'Data Atlet Terupload');
  }

  // Generate filename and save
  const actualFileName = fileName || `Rekapitulasi_Medali_Kontingen_${new Date().toISOString().slice(0, 10)}.xlsx`;
  XLSX.writeFile(wb, actualFileName);
}
