/**
 * Pencocokan beasiswa ↔ (kampus, prodi, golongan UKT).
 *
 * Fungsi murni. Sengaja TIDAK menyentuh DB supaya bisa diuji tanpa setup
 * apa pun, dan supaya aturan §5 plan (golongan vs rupiah) bisa dibuktikan
 * lewat tes, bukan lewat inspeksi query SQL.
 */

import type { PtkIn, UktRow } from './kma-ukt';
import { golonganKeRupiah } from './kma-ukt';
import { check, score, type CheckResult, type Facts, type Rule } from './eligibility/engine';

export type ScholarshipSeed = {
  slug: string;
  name: string;
  provider: string;
  tier: 'kampus' | 'pemerintah' | 'swasta';
  scope: string;
  coverage?: string | null;
  benefit_summary?: string | null;
  jenjang: string[];
  url_pendaftaran?: string | null;
  source_url: string;
  source_kind: 'resmi' | 'agregator';
  confidence: number;
  last_verified_at: string;
  ukt_max_idr?: number;
  ukt_max_golongan?: number;
  ukt_scope_note?: string;
  needs_test?: boolean;
  academic_year?: string;
  stages: { name: string; opens_at?: string; closes_at?: string }[];
  rule: Rule;
};

export type Candidate = {
  slug: string;
  name: string;
  provider: string;
  tier: ScholarshipSeed['tier'];
  scope: string;
  verdict: CheckResult['verdict'];
  score: number;
  reasons: CheckResult['reasons'];
  missing: string[];
  /** Batas pendaftaran terdekat, epoch ms. null bila tidak ada. */
  deadline: number | null;
  source_url: string;
  last_verified_at: string;
  confidence: number;
  /** Syarat UKT yang benar-benar dipakai, untuk ditampilkan di UI. */
  uktRequirement: string | null;
  /** true bila UKT user diambil dari input manual (belum terverifikasi). */
  uktUnverified: boolean;
  /**
   * Keadaan jadwal beasiswa saat ini. Dibawa di dalam Candidate supaya klien
   * tidak perlu tahu struktur `stages` dan supaya label tidak pernah berbeda
   * antara halaman satu dan halaman lain.
   */
  stageStatus: StageStatus;
  /**
   * Label yang benar-benar ditampilkan. Berbeda dari `verdict` hanya pada satu
   * hal: beasiswa yang pendaftarannya SUDAH TUTUP tidak pernah dilabeli
   * "perlu data" — menawarkan "lengkapi data" untuk pintu yang sudah tertutup
   * itu menyesatkan.
   */
  displayState: DisplayState;
};

export type Profile = {
  jenjang?: string;
  semester?: number;
  ipk?: number;
  fakultas?: string;
  penerima_beasiswa_lain?: boolean;
  pemegang_kip?: boolean;
  desil_dtsen?: number;
  panti_sosial?: boolean;
  penghasilan_di_bawah_ump?: boolean;
  aktif_organisasi?: boolean;
  prestasi?: string[];
  afiliasi_kemenag?: boolean;
  skor_bahasa?: string;
  pt_mitra?: boolean;
  kondisi_ekonomi_lemah?: boolean;
  surat_aktif_fakultas?: boolean;
  [key: string]: unknown;
};

export type MatchInput = {
  kodePt: string;
  /** Blok PTKIN dari seed UKT, bila kampus ini punya data KMA. */
  ptkin: PtkIn | null;
  prodi: string | null;
  /** Golongan 1..8. Boleh kosong kalau user mengisi nominal manual. */
  kelompok?: number | null;
  /** Nominal UKT manual (rupiah) — dipakai bila kelompok tidak diketahui. */
  nominalManual?: number | null;
  profile: Profile;
  now?: number;
};

/**
 * Bangun fakta untuk engine dari profil + UKT kampus yang dipilih.
 *
 * Yang penting di sini: `ukt_kelompok` hanya diisi bila beasiswa memang terikat
 * kampus ini (dicek engine lewat onlyWhen), sedangkan `ukt_nominal` selalu
 * diisi. Itu yang membuat beasiswa nasional dibandingkan lewat rupiah.
 */
export function buildFacts(input: MatchInput): { facts: Facts; uktNominal: number | null; unverified: boolean } {
  const { ptkin, prodi, kelompok, nominalManual, profile } = input;

  let uktNominal: number | null = null;
  let unverified = false;

  if (ptkin && prodi && typeof kelompok === 'number') {
    uktNominal = golonganKeRupiah(ptkin, prodi, kelompok, { exactOnly: true });
  }
  if (uktNominal === null && typeof nominalManual === 'number') {
    uktNominal = nominalManual;
    unverified = true;
  }

  const facts: Facts = {
    ...profile,
    ukt_kelompok: typeof kelompok === 'number' ? kelompok : undefined,
    ukt_nominal: uktNominal ?? undefined,
    ukt_verified: !unverified,
  };

  return { facts, uktNominal, unverified };
}

const DEADLINE_STAGES = ['pendaftaran', 'pendaftaran_akun', 'mandiri_ptn_pts'];

/** Batas waktu terdekat yang masih akan datang (atau yang paling baru lewat). */
export function nextDeadline(s: ScholarshipSeed, now: number): number | null {
  const times: number[] = [];
  for (const st of s.stages) {
    if (!st.closes_at) continue;
    if (!DEADLINE_STAGES.includes(st.name)) continue;
    const t = Date.parse(st.closes_at);
    if (Number.isFinite(t)) times.push(t);
  }
  if (times.length === 0) return null;
  const upcoming = times.filter((t) => t >= now).sort((a, b) => a - b)[0];
  return upcoming ?? times.sort((a, b) => b - a)[0];
}

export type StageStatus = 'buka' | 'tutup' | 'akan_datang' | 'tanpa_jadwal';

/**
 * Label tampilan. `tutup` hanya muncul kalau jadwal pendaftaran sudah lewat;
 * selain itu sama dengan verdict.
 */
export type DisplayState = 'lolos' | 'perlu_data' | 'tidak' | 'tutup';

export function displayState(verdict: Candidate['verdict'], status: StageStatus): DisplayState {
  return status === 'tutup' ? 'tutup' : verdict;
}

export function stageStatus(s: ScholarshipSeed, now: number): StageStatus {
  const opens = s.stages
    .map((st) => (st.opens_at ? Date.parse(st.opens_at) : NaN))
    .filter((t) => Number.isFinite(t));
  const closes = s.stages
    .map((st) => (st.closes_at ? Date.parse(st.closes_at) : NaN))
    .filter((t) => Number.isFinite(t));

  if (closes.length === 0 && opens.length === 0) return 'tanpa_jadwal';
  if (opens.length && now < Math.min(...opens)) return 'akan_datang';
  if (closes.length && now > Math.max(...closes)) return 'tutup';
  return 'buka';
}

/** Cocokkan satu beasiswa terhadap satu profil kampus. */
export function matchOne(
  s: ScholarshipSeed,
  input: MatchInput,
  now: number,
): Candidate {
  const { facts, unverified } = buildFacts(input);
  const result = check(s.rule, facts, { scope: s.scope });

  // Beasiswa nasional WAJIB memakai rupiah; nomor golongan hanya sah bila
  // beasiswa itu memang terikat kampus yang sedang dilihat (§5 plan).
  let uktRequirement: string | null = null;
  if (s.ukt_max_idr !== undefined) {
    uktRequirement = `UKT ≤ Rp${s.ukt_max_idr.toLocaleString('id-ID')}`;
  } else if (s.ukt_max_golongan !== undefined && s.scope === `kampus:${input.kodePt}`) {
    uktRequirement = `Prioritas golongan 1–${s.ukt_max_golongan}`;
  }

  const status = stageStatus(s, now);

  return {
    slug: s.slug,
    name: s.name,
    provider: s.provider,
    tier: s.tier,
    scope: s.scope,
    verdict: result.verdict,
    score: score(result),
    reasons: result.reasons,
    missing: result.missing,
    deadline: nextDeadline(s, now),
    source_url: s.source_url,
    last_verified_at: s.last_verified_at,
    confidence: s.confidence,
    uktRequirement,
    uktUnverified: unverified,
    stageStatus: status,
    displayState: displayState(result.verdict, status),
  };
}

/** Cocokkan seluruh beasiswa, urutkan: lolos → perlu_data → tidak. */
export function matchAll(
  scholarships: ScholarshipSeed[],
  input: MatchInput,
  now = Date.now(),
): Candidate[] {
  // Yang tutup selalu di belakang, apa pun verdict-nya: tidak ada gunanya
  // menaruh pintu yang sudah tertutup di atas pintu yang masih terbuka.
  const order = { lolos: 0, perlu_data: 1, tidak: 2, tutup: 3 } as const;
  return scholarships
    .map((s) => matchOne(s, input, now))
    .sort((a, b) => {
      if (order[a.displayState] !== order[b.displayState]) {
        return order[a.displayState] - order[b.displayState];
      }
      if (b.score !== a.score) return b.score - a.score;
      const da = a.deadline ?? Infinity;
      const db = b.deadline ?? Infinity;
      return da - db;
    });
}

/** Simulasi "kalau golongan UKT-mu turun ke N": pakai engine yang sama. */
export function simulateGolongan(
  scholarships: ScholarshipSeed[],
  input: MatchInput,
  kelompokBaru: number,
  now = Date.now(),
): { slug: string; sebelum: Candidate['verdict']; sesudah: Candidate['verdict'] }[] {
  const before = new Map(matchAll(scholarships, input, now).map((c) => [c.slug, c.verdict]));
  const after = matchAll(scholarships, { ...input, kelompok: kelompokBaru }, now);
  return after
    .filter((c) => before.get(c.slug) !== c.verdict)
    .map((c) => ({ slug: c.slug, sebelum: before.get(c.slug)!, sesudah: c.verdict }));
}

/** Baris UKT untuk ditampilkan (dipakai halaman kampus). */
export function uktTabel(pt: PtkIn, prodi?: string | null): { kelompok: number; label: string; nominal: number | null }[] {
  const row: UktRow | undefined = prodi
    ? pt.prodi.find((r) => r.prodi.toLowerCase() === prodi.toLowerCase()) ?? pt.prodi[0]
    : pt.prodi[0];
  if (!row) return [];
  const out: { kelompok: number; label: string; nominal: number | null }[] = [];
  for (let i = 0; i < row.gol.length; i++) {
    out.push({ kelompok: i + 1, label: `Golongan ${i + 1}`, nominal: row.gol[i] });
  }
  if (row.kip !== null) out.push({ kelompok: 8, label: 'Golongan 8 (KIP Kuliah)', nominal: row.kip });
  return out;
}
