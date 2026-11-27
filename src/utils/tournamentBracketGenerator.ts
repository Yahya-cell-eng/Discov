/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { BaganCategory, BaganMatch, GelanggangInfo, TGRPeserta, TGRPartaiPool } from '../types';
import { ParsedAthleteRecord } from './smartDataParser';
import { distributeAthletesAvoidSameContingent } from './contingentDrawing';
import { propagateBracketWithAutoAdvance } from './bracketProgression';
import { organizeSeniIntoPools } from './seniPoolManager';

export interface TournamentBracketOptions {
  bracketSizeLimit?: 2 | 4 | 8 | 16;
  seniParticipantsPerPool?: number;
  enforceSameArenaForSemiAndFinal?: boolean; // Default true: Peserta di semi final arena X tetap di arena X untuk final
  distributionMethod?: 'balanced_load' | 'round_robin' | 'by_age_category';
  separateContingentInFirstRound?: boolean;
}

export interface ArenaDistributionSummary {
  arenaId: string;
  arenaNama: string;
  tandingCategoriesCount: number;
  tandingMatchesCount: number;
  tandingAthletesCount: number;
  seniPoolsCount: number;
  seniPesertaCount: number;
  categories: BaganCategory[];
  seniPesertaList: TGRPeserta[];
}

export interface TournamentGenerationResult {
  tandingCategories: BaganCategory[];
  seniPesertaList: TGRPeserta[];
  seniPartaiPoolList: TGRPartaiPool[];
  arenaSummaries: ArenaDistributionSummary[];
  totalTandingAthletes: number;
  totalSeniAthletes: number;
  totalMatches: number;
  venueConsistencyVerified: boolean;
  venueConsistencyMessage: string;
}

/**
 * Verifies that for every category and pool, participants in semi-finals
 * are guaranteed to compete in the exact same arena for the final.
 */
export function verifyVenueConsistency(categories: BaganCategory[]): {
  isConsistent: boolean;
  violations: string[];
  message: string;
} {
  const violations: string[] = [];

  categories.forEach((cat) => {
    const semiMatches = cat.matches.filter(m => m.round === 'semi');
    const finalMatches = cat.matches.filter(m => m.round === 'final');

    if (semiMatches.length > 0 && finalMatches.length > 0) {
      const finalArena = finalMatches[0].arenaId || finalMatches[0].gelanggang;
      
      semiMatches.forEach((sm) => {
        const semiArena = sm.arenaId || sm.gelanggang;
        if (semiArena && finalArena && semiArena !== finalArena) {
          violations.push(
            `Kategori "${cat.name}": Semi-final (${sm.partai}) di ${semiArena} berbeda dengan Final (${finalMatches[0].partai}) di ${finalArena}`
          );
        }
      });
    }
  });

  const isConsistent = violations.length === 0;
  const message = isConsistent
    ? '100% Konsistensi Gelanggang Terverifikasi: Setiap peserta yang bertanding di babak Semi Final pada suatu Gelanggang dipastikan bertanding di Gelanggang yang sama pada babak Final.'
    : `Ditemukan ${violations.length} ketidaksesuaian gelanggang antara Semi Final dan Final.`;

  return { isConsistent, violations, message };
}

/**
 * Automated Tournament Bracket Generator & Arena Pool Allocator.
 * Takes parsed athlete records, categorizes by:
 * - Kategori Perlombaan (Tanding vs Seni)
 * - Kategori Usia (Usia Dini 1, Usia Dini 2, Usia Dini, Pra Remaja, Remaja, Dewasa, Master)
 * - Jenis Kelamin / Gender (Putra vs Putri)
 * - Kelas Tanding (Under, A, B, C, D, E, F, G, H, I, J, K, L, M, Bebas, Open, dst)
 *
 * Then distributes the brackets across all target arenas while strictly guaranteeing that
 * participants who play semi-finals in Arena X remain in Arena X for their final match!
 */
export function generateTournamentBracketsAndDistribute(
  records: ParsedAthleteRecord[],
  arenas: GelanggangInfo[],
  options: TournamentBracketOptions = {}
): TournamentGenerationResult {
  const {
    bracketSizeLimit = 4,
    seniParticipantsPerPool = 4,
    enforceSameArenaForSemiAndFinal = true,
    separateContingentInFirstRound = true
  } = options;

  // Fallback if no arenas provided
  const targetArenas = arenas && arenas.length > 0
    ? arenas
    : [
        { id: 'arena_1', nama: 'Gelanggang 1', kode: '1', modeAktif: 'tanding', status: 'aktif' as const },
        { id: 'arena_2', nama: 'Gelanggang 2', kode: '2', modeAktif: 'tanding', status: 'aktif' as const }
      ];

  // 1. Separate records into Tanding vs Seni
  const tandingRecords = records.filter(r => r.kategoriType === 'Tanding');
  const seniRecords = records.filter(r => r.kategoriType !== 'Tanding');

  // 2. Determine arena availability by mode
  let tandingArenas = targetArenas.filter(a => a.modeAktif === 'tanding' || !a.modeAktif);
  let seniArenas = targetArenas.filter(a => a.modeAktif === 'seni');

  if (tandingArenas.length === 0) tandingArenas = targetArenas;
  if (seniArenas.length === 0) seniArenas = targetArenas;

  // --- TANDING PROCESSING ---
  // Group by: Usia + Gender + Kelas
  const tandingGroups = new Map<string, ParsedAthleteRecord[]>();
  tandingRecords.forEach(rec => {
    const groupKey = `${rec.kategoriUsia}___${rec.gender}___${rec.kelas}`;
    if (!tandingGroups.has(groupKey)) {
      tandingGroups.set(groupKey, []);
    }
    tandingGroups.get(groupKey)!.push(rec);
  });

  // Create brackets for each group
  interface RawBracketUnit {
    firstRecord: ParsedAthleteRecord;
    chunkAthletes: ParsedAthleteRecord[];
    bracketIndex: number;
    totalChunks: number;
  }

  const rawBrackets: RawBracketUnit[] = [];

  tandingGroups.forEach((groupAthletes) => {
    const first = groupAthletes[0];
    const sizeLimit = bracketSizeLimit;

    // Distribute athletes into brackets with contingent separation
    const chunks: ParsedAthleteRecord[][] = separateContingentInFirstRound
      ? distributeAthletesAvoidSameContingent(groupAthletes, sizeLimit)
      : chunkArray(groupAthletes, sizeLimit);

    chunks.forEach((chunk, chunkIdx) => {
      rawBrackets.push({
        firstRecord: first,
        chunkAthletes: chunk,
        bracketIndex: chunkIdx,
        totalChunks: chunks.length
      });
    });
  });

  // Distribute brackets evenly across tanding arenas
  // Rule: each bracket is an indivisible unit assigned entirely to ONE arena!
  const arenaCategoriesMap = new Map<string, BaganCategory[]>();
  tandingArenas.forEach(a => arenaCategoriesMap.set(a.id, []));

  // Balanced load allocation: assign bracket to the arena with fewest estimated matches
  const arenaMatchCount = new Map<string, number>();
  tandingArenas.forEach(a => arenaMatchCount.set(a.id, 0));

  rawBrackets.forEach((rb, bIdx) => {
    // Find arena with lowest match load (or round-robin if tie)
    let selectedArena = tandingArenas[bIdx % tandingArenas.length];
    let minMatches = Infinity;

    tandingArenas.forEach(a => {
      const count = arenaMatchCount.get(a.id) || 0;
      if (count < minMatches) {
        minMatches = count;
        selectedArena = a;
      }
    });

    const size = bracketSizeLimit;
    const chunk = rb.chunkAthletes;
    const first = rb.firstRecord;

    const catName = rb.totalChunks > 1
      ? `${first.kelas} ${first.gender} ${first.kategoriUsia} (Bagan ${rb.bracketIndex + 1})`
      : `${first.kelas} ${first.gender} ${first.kategoriUsia}`;

    const poolLabel = rb.totalChunks > 1
      ? `Pool ${String.fromCharCode(65 + rb.bracketIndex)}`
      : 'Pool A';

    const matches: BaganMatch[] = [];

    // Construct matches inside this bracket.
    // ALL MATCHES IN THIS BRACKET ARE ASSIGNED TO selectedArena!
    if (size === 2) {
      matches.push({
        id: 1,
        round: 'final',
        partai: `Partai 01`,
        gelanggang: selectedArena.nama,
        arenaId: selectedArena.id,
        atletMerah: chunk[0] ? { nama: chunk[0].nama, kontingen: chunk[0].kontingen } : { nama: '', kontingen: '' },
        atletBiru: chunk[1] ? { nama: chunk[1].nama, kontingen: chunk[1].kontingen } : { nama: '', kontingen: '' },
        winner: null
      });
    } else if (size === 4) {
      // Semi 1
      matches.push({
        id: 1,
        round: 'semi',
        partai: `Partai 01`,
        gelanggang: selectedArena.nama,
        arenaId: selectedArena.id,
        atletMerah: chunk[0] ? { nama: chunk[0].nama, kontingen: chunk[0].kontingen } : { nama: '', kontingen: '' },
        atletBiru: chunk[1] ? { nama: chunk[1].nama, kontingen: chunk[1].kontingen } : { nama: '', kontingen: '' },
        winner: null
      });
      // Semi 2
      matches.push({
        id: 2,
        round: 'semi',
        partai: `Partai 02`,
        gelanggang: selectedArena.nama,
        arenaId: selectedArena.id,
        atletMerah: chunk[2] ? { nama: chunk[2].nama, kontingen: chunk[2].kontingen } : { nama: '', kontingen: '' },
        atletBiru: chunk[3] ? { nama: chunk[3].nama, kontingen: chunk[3].kontingen } : { nama: '', kontingen: '' },
        winner: null
      });
      // Final (GUARANTEED in selectedArena)
      matches.push({
        id: 3,
        round: 'final',
        partai: `Partai 03`,
        gelanggang: selectedArena.nama,
        arenaId: selectedArena.id,
        atletMerah: { nama: '', kontingen: '' },
        atletBiru: { nama: '', kontingen: '' },
        winner: null
      });
    } else if (size === 8) {
      // Quarters 1-4
      for (let q = 1; q <= 4; q++) {
        const mIdx = (q - 1) * 2;
        matches.push({
          id: q,
          round: 'quarter',
          partai: `Partai ${q < 10 ? '0' + q : q}`,
          gelanggang: selectedArena.nama,
          arenaId: selectedArena.id,
          atletMerah: chunk[mIdx] ? { nama: chunk[mIdx].nama, kontingen: chunk[mIdx].kontingen } : { nama: '', kontingen: '' },
          atletBiru: chunk[mIdx + 1] ? { nama: chunk[mIdx + 1].nama, kontingen: chunk[mIdx + 1].kontingen } : { nama: '', kontingen: '' },
          winner: null
        });
      }
      // Semis 5-6 (GUARANTEED in selectedArena)
      matches.push({
        id: 5,
        round: 'semi',
        partai: `Partai 05`,
        gelanggang: selectedArena.nama,
        arenaId: selectedArena.id,
        atletMerah: { nama: '', kontingen: '' },
        atletBiru: { nama: '', kontingen: '' },
        winner: null
      });
      matches.push({
        id: 6,
        round: 'semi',
        partai: `Partai 06`,
        gelanggang: selectedArena.nama,
        arenaId: selectedArena.id,
        atletMerah: { nama: '', kontingen: '' },
        atletBiru: { nama: '', kontingen: '' },
        winner: null
      });
      // Final 7 (GUARANTEED in selectedArena)
      matches.push({
        id: 7,
        round: 'final',
        partai: `Partai 07`,
        gelanggang: selectedArena.nama,
        arenaId: selectedArena.id,
        atletMerah: { nama: '', kontingen: '' },
        atletBiru: { nama: '', kontingen: '' },
        winner: null
      });
    } else if (size === 16) {
      // Eighths 1-8
      for (let e = 1; e <= 8; e++) {
        const mIdx = (e - 1) * 2;
        matches.push({
          id: e,
          round: 'eighth',
          partai: `Partai ${e < 10 ? '0' + e : e}`,
          gelanggang: selectedArena.nama,
          arenaId: selectedArena.id,
          atletMerah: chunk[mIdx] ? { nama: chunk[mIdx].nama, kontingen: chunk[mIdx].kontingen } : { nama: '', kontingen: '' },
          atletBiru: chunk[mIdx + 1] ? { nama: chunk[mIdx + 1].nama, kontingen: chunk[mIdx + 1].kontingen } : { nama: '', kontingen: '' },
          winner: null
        });
      }
      // Quarters 9-12
      for (let q = 9; q <= 12; q++) {
        matches.push({
          id: q,
          round: 'quarter',
          partai: `Partai ${q}`,
          gelanggang: selectedArena.nama,
          arenaId: selectedArena.id,
          atletMerah: { nama: '', kontingen: '' },
          atletBiru: { nama: '', kontingen: '' },
          winner: null
        });
      }
      // Semis 13-14 (GUARANTEED in selectedArena)
      matches.push({ id: 13, round: 'semi', partai: `Partai 13`, gelanggang: selectedArena.nama, arenaId: selectedArena.id, atletMerah: { nama: '', kontingen: '' }, atletBiru: { nama: '', kontingen: '' }, winner: null });
      matches.push({ id: 14, round: 'semi', partai: `Partai 14`, gelanggang: selectedArena.nama, arenaId: selectedArena.id, atletMerah: { nama: '', kontingen: '' }, atletBiru: { nama: '', kontingen: '' }, winner: null });
      // Final 15 (GUARANTEED in selectedArena)
      matches.push({ id: 15, round: 'final', partai: `Partai 15`, gelanggang: selectedArena.nama, arenaId: selectedArena.id, atletMerah: { nama: '', kontingen: '' }, atletBiru: { nama: '', kontingen: '' }, winner: null });
    }

    // Auto-advance BYE
    const initialMatchCount = size / 2;
    for (let i = 0; i < initialMatchCount; i++) {
      const m = matches[i];
      if (m.atletMerah.nama && !m.atletBiru.nama) {
        m.atletBiru = { nama: 'BYE', kontingen: 'AUTOMATIC' };
        m.winner = 'merah';
      } else if (!m.atletMerah.nama && m.atletBiru.nama) {
        m.atletMerah = { nama: 'BYE', kontingen: 'AUTOMATIC' };
        m.winner = 'biru';
      }
    }

    const finalMatches = propagateBracketWithAutoAdvance(matches, size);

    const newCategory: BaganCategory = {
      id: `cat_${selectedArena.id}_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
      name: catName,
      gender: first.gender,
      size,
      kelas: first.kelas,
      usia: first.kategoriUsia,
      pool: poolLabel,
      gelanggang: selectedArena.nama,
      arenaId: selectedArena.id,
      matches: finalMatches
    };

    arenaCategoriesMap.get(selectedArena.id)!.push(newCategory);
    arenaMatchCount.set(selectedArena.id, (arenaMatchCount.get(selectedArena.id) || 0) + matches.length);
  });

  // Renumber partais sequentially PER ARENA
  const allTandingCategories: BaganCategory[] = [];
  tandingArenas.forEach(arena => {
    const cats = arenaCategoriesMap.get(arena.id) || [];
    let partaiNum = 1;

    cats.forEach(cat => {
      cat.gelanggang = arena.nama;
      cat.arenaId = arena.id;
      cat.matches.forEach(m => {
        m.gelanggang = arena.nama;
        m.arenaId = arena.id;
        m.partai = `Partai ${partaiNum < 10 ? '0' + partaiNum : partaiNum}`;
        partaiNum++;
      });
      allTandingCategories.push(cat);
    });
  });

  // --- SENI PROCESSING ---
  const initialSeniPeserta: TGRPeserta[] = seniRecords.map((s, idx) => ({
    id: s.id,
    noUrut: idx + 1,
    nama: s.nama,
    kontingen: s.kontingen,
    kategori: s.kategoriType,
    gender: s.gender,
    usia: s.kategoriUsia,
    status: 'Belum Menilai',
    scores: {},
    kebenaranScores: {},
    isLocked: false,
    decisions: ['Sah'],
    deductions: 0
  }));

  const { updatedPesertaList, partaiPoolList } = organizeSeniIntoPools(
    initialSeniPeserta,
    seniParticipantsPerPool,
    1
  );

  // Distribute seni pools across seni arenas
  const arenaSeniMap = new Map<string, TGRPeserta[]>();
  seniArenas.forEach(a => arenaSeniMap.set(a.id, []));

  // Distribute pool by pool so an entire pool is in the same arena
  const poolGroups = new Map<string, TGRPeserta[]>();
  updatedPesertaList.forEach(p => {
    const poolKey = p.partai || `Pool_${p.pool || 'A'}`;
    if (!poolGroups.has(poolKey)) {
      poolGroups.set(poolKey, []);
    }
    poolGroups.get(poolKey)!.push(p);
  });

  let seniArenaIdx = 0;
  poolGroups.forEach((participants) => {
    const targetArena = seniArenas[seniArenaIdx % seniArenas.length];
    seniArenaIdx++;

    participants.forEach(p => {
      p.arenaId = targetArena.id;
      p.gelanggang = targetArena.nama;
      arenaSeniMap.get(targetArena.id)!.push(p);
    });
  });

  // Renumber Seni partais per arena
  const allSeniPesertaList: TGRPeserta[] = [];
  seniArenas.forEach(arena => {
    const pList = arenaSeniMap.get(arena.id) || [];
    let pPartaiCounter = 1;

    pList.forEach((p, idx) => {
      p.noUrut = idx + 1;
      p.partaiNumber = pPartaiCounter;
      p.partai = `PARTAI ${pPartaiCounter < 10 ? '0' + pPartaiCounter : pPartaiCounter}`;
      p.gelanggang = arena.nama;
      p.arenaId = arena.id;
      if ((idx + 1) % seniParticipantsPerPool === 0) {
        pPartaiCounter++;
      }
      allSeniPesertaList.push(p);
    });
  });

  // Build arena summaries
  const arenaSummaries: ArenaDistributionSummary[] = targetArenas.map(a => {
    const cats = arenaCategoriesMap.get(a.id) || [];
    const seniList = arenaSeniMap.get(a.id) || [];
    const tMatches = cats.reduce((acc, c) => acc + c.matches.length, 0);
    const tAthletes = cats.reduce((acc, c) => {
      const athSet = new Set<string>();
      c.matches.forEach(m => {
        if (m.atletMerah.nama && m.atletMerah.nama !== 'BYE') athSet.add(m.atletMerah.nama);
        if (m.atletBiru.nama && m.atletBiru.nama !== 'BYE') athSet.add(m.atletBiru.nama);
      });
      return acc + athSet.size;
    }, 0);

    return {
      arenaId: a.id,
      arenaNama: a.nama,
      tandingCategoriesCount: cats.length,
      tandingMatchesCount: tMatches,
      tandingAthletesCount: tAthletes,
      seniPoolsCount: Math.ceil(seniList.length / seniParticipantsPerPool),
      seniPesertaCount: seniList.length,
      categories: cats,
      seniPesertaList: seniList
    };
  });

  const totalMatches = allTandingCategories.reduce((acc, c) => acc + c.matches.length, 0);

  // Perform rigorous verification of venue consistency
  const verification = verifyVenueConsistency(allTandingCategories);

  return {
    tandingCategories: allTandingCategories,
    seniPesertaList: allSeniPesertaList,
    seniPartaiPoolList: partaiPoolList,
    arenaSummaries,
    totalTandingAthletes: tandingRecords.length,
    totalSeniAthletes: seniRecords.length,
    totalMatches,
    venueConsistencyVerified: verification.isConsistent,
    venueConsistencyMessage: verification.message
  };
}

function chunkArray<T>(array: T[], size: number): T[][] {
  const result: T[][] = [];
  for (let i = 0; i < array.length; i += size) {
    result.push(array.slice(i, i + size));
  }
  return result;
}
