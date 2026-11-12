/**
 * Sumber data untuk API.
 *
 * Saat ini dibaca dari seed JSON yang di-commit (deterministik, cepat, dan
 * tidak butuh DB untuk deploy pertama). Ketika Postgres/Neon diaktifkan,
 * fungsi-fungsi di sini yang diganti implementasinya — rute API tidak berubah.
 */
import institutionsSeed from '@/data/institutions.seed.json';
import aliasesSeed from '@/data/aliases.seed.json';
import uktSeed from '@/data/ukt-ptkin.seed.json';
import scholarshipsSeed from '@/data/scholarships.seed.json';
import type { PtkIn } from '@/lib/kma-ukt';
import type { ScholarshipSeed } from '@/lib/match';

export type InstitutionIndex = {
  kode: string;
  nama: string;
  jenis: string;
  /**
   * Nama yang biasa dipakai orang ("UIN SYARIF HIDAYATULLAH JAKARTA").
   * Nama resmi PDDikti tidak memuat kota, dan API PDDikti sekarang sedang
   * tidak bisa ditarik, jadi ini disimpan dari dekrit KMA 204/2026.
   */
  namaPopuler: string | null;
  /** Kabupaten/kota according to PDDikti, mis. "Bogor". */
  kota: string | null;
  /** Semua kota untuk nama yang dipakai lebih dari satu kampus. */
  kotaAlternatif: string[];
  /** Nama singkat resmi PDDikti, mis. "UIN Jakarta". */
  singkat: string | null;
  /** Blok UKT PTKIN yang terpasang, atau null kalau kampus belum punya data. */
  ukt: PtkIn | null;
};

const JENIS = (nama: string): string => {
  if (nama.startsWith('SEKOLAH TINGGI')) return 'SEKOLAH TINGGI';
  if (nama.startsWith('AKADEMI')) return 'AKADEMI';
  if (nama.includes('POLITEKNIK')) return 'POLITEKNIK';
  if (nama.startsWith('INSTITUT')) return 'INSTITUT';
  if (nama.includes('UNIVERSITAS')) return 'UNIVERSITAS';
  return 'LAIN';
};

/** Peta kode_pt -> blok UKT, dibangun dari hasil pemetaan scripts/link-ptkin.mjs. */
const uktByKode = new Map<string, PtkIn>();
for (const block of (uktSeed as unknown as { ptkin: (PtkIn & { kodePt: string | null })[] }).ptkin) {
  if (block.kodePt) uktByKode.set(block.kodePt, block as PtkIn);
}

const PT_ROWS = (institutionsSeed as unknown as { pt: [string, string][] }).pt;

/** Normalisasi nama: huruf besar, spasi rapat, tanda baca dibuang. */
const normNama = (s: string): string =>
  String(s ?? '')
    .toUpperCase()
    .replace(/\s+/g, ' ')
    .replace(/[",.]/g, '')
    .trim();

/**
 * Nama populer per kode PT. PTKIN punya nama yang berbeda dari nama resmi
 * PDDikti: "UNIVERSITAS ISLAM NEGERI SYARIF HIDAYATULLAH" (nama resmi)
 * vs "UIN SYARIF HIDAYATULLAH JAKARTA" (nama yang dipakai orang). Tanpa
 * ini, mengetik "UIN Jakarta" tidak menemukan apa pun.
 *
 * Sumber: data/ukt-ptkin.seed.json (dekrit KMA 204/2026).
 */
const namaPopulerByKode = new Map<string, string>();
for (const blok of (
  uktSeed as unknown as { ptkin: (PtkIn & { kodePt: string | null; kampus: string })[] }
).ptkin) {
  if (blok.kodePt && blok.kampus) namaPopulerByKode.set(blok.kodePt, blok.kampus);
}

/**
 * Alias wilayah per nama ternormalisasi, dari data/aliases.seed.json
 * (dibangun scripts/build-aliases.mjs). Dipakai supaya pencarian bisa
 * mencocokkan kota: "Akademi Kebidanan Binalita Sudama Deli Serdang".
 */
const aliasByNama = (
  aliasesSeed as unknown as {
    alias: Record<
      string,
      { kota?: string; prov?: string; singkat?: string; kotaAlt?: string[] }
    >;
  }
).alias ?? {};

export const institutions: InstitutionIndex[] = PT_ROWS.map(([kode, nama]) => {
  const a = aliasByNama[normNama(nama)];
  return {
    kode,
    nama,
    jenis: JENIS(nama),
    namaPopuler: namaPopulerByKode.get(kode) ?? null,
    kota: a?.kota && a.kota !== 'Tidak Diisi' ? a.kota : null,
    kotaAlternatif: a?.kotaAlt ?? [],
    singkat: a?.singkat || null,
    ukt: uktByKode.get(kode) ?? null,
  };
});

export const institutionsByKode = new Map(institutions.map((i) => [i.kode, i]));

export const scholarships = (scholarshipsSeed as unknown as { scholarships: ScholarshipSeed[] })
  .scholarships;

export const seedsMeta = {
  institutions: (institutionsSeed as unknown as { _meta: Record<string, unknown> })._meta,
  ukt: (uktSeed as unknown as { _meta: Record<string, unknown> })._meta,
  scholarships: (scholarshipsSeed as unknown as { _meta: Record<string, unknown> })._meta,
};

/* ---------------------------------------------------------------------
   PENCARIAN
   ---------------------------------------------------------------------
   Nama resmi PDDikti tidak memuat kota: "UNIVERSITAS ISLAM NEGERI SYARIF
   HIDAYATULLAH" tidak ada kata "JAKARTA" di dalamnya. Padahal orang
   searching menulis "UIN Jakarta". Jadi haystack searched bukan cuma nama:
   nama + nama singkat + kab/kota + provinsi.

   Query juga dinormalisasi lewat singkatan yang dipakai sehari-hari
   (UIN -> UNIVERSITAS ISLAM NEGERI, POLTEK -> POLITEKNIK, dst).
   --------------------------------------------------------------------- */

/** Singkatan lazim -> bentuk resmi yang dipakai PDDikti. */
const SINGKATAN: Record<string, string[]> = {
  UIN: ['UNIVERSITAS ISLAM NEGERI'],
  IAIN: ['INSTITUT AGAMA ISLAM'],
  UNIV: ['UNIVERSITAS'],
  POLTEK: ['POLITEKNIK'],
  POLTEKG: ['POLITEKNIK'],
  STT: ['SEKOLAH TINGGI'],
  STE: ['SEKOLAH TINGGI'],
  STIKES: ['SEKOLAH TINGGI KESEHATAN', 'STIKES'],
  AKPER: ['AKADEMI KEPERAWATAN'],
  AMIK: ['AKADEMI MANAJEMEN INFORMASI DAN KOMPUTER'],
  AKAB: ['AKADEMI'],
  AKBID: ['AKADEMI KEBIDANAN'],
  PRANATA: ['PRAKARYA'],
  UGM: ['UNIVERSITAS GADJAH MADA'],
  UI: ['UNIVERSITAS INDONESIA'],
  ITB: ['INSTITUT TEKNOLOGI BANDUNG'],
};

const haystackCache = new Map<string, string>();

/**
 * Teks yang dicari. Huruf besar, disusun dari:
 *   nama resmi  — "UNIVERSITAS ISLAM NEGERI SYARIF HIDAYATULLAH"
 *   nama populer — "UIN SYARIF HIDAYATULLAH JAKARTA" (dari dekrit KMA)
 *   nama singkat — "UIN Jakarta" (dari PDDikti; sering memuat kata kota)
 *   kota + alternatif — "BOGOR", "DELI SERDANG"
 *
 * Nama populer juga diikutkan TANPA prefiks UIN/IAI supaya "syarif
 * hidayatullah jakarta" tetap kena.
 */
function haystack(i: InstitutionIndex): string {
  let h = haystackCache.get(i.kode);
  if (h === undefined) {
    const populer = i.namaPopuler ?? '';
    const tanpaPrefiks = populer.replace(/^(UIN|IAIN)\s+/i, '');
    h = [
      i.nama,
      populer,
      tanpaPrefiks,
      i.singkat ?? '',
      i.kota ?? '',
      ...i.kotaAlternatif,
    ]
      .filter(Boolean)
      .join(' ')
      .toUpperCase();
    haystackCache.set(i.kode, h);
  }
  return h;
}

/** Pola yang boleh mencocokkan satu kata query. */
function polaUntuk(term: string): string[] {
  const t = term.toUpperCase();
  const out = [t];
  const ekspansi = SINGKATAN[t];
  if (ekspansi) out.push(...ekspansi);
  return out;
}

/**
 * Pencarian kampus: semua kata query harus punya satu kecocokan.
 * Skor naik kalau kecocokan di awal nama, atau persis sebuah kata.
 */
export function searchInstitutions(q: string, opts: { jenis?: string; limit?: number } = {}) {
  const needle = q.trim().toUpperCase();
  const limit = Math.min(opts.limit ?? 30, 100);
  if (!needle) return [];

  const terms = needle.split(/\s+/).filter(Boolean);
  const scored: { item: InstitutionIndex; score: number }[] = [];

  for (const item of institutions) {
    if (opts.jenis && item.jenis !== opts.jenis) continue;
    const hay = haystack(item);
    let score = 0;
    let all = true;

    for (const t of terms) {
      const pola = polaUntuk(t);
      let termScore = -1;
      for (const p of pola) {
        const at = hay.indexOf(p);
        if (at < 0) continue;
        // Persis sebuah kata lebih kuat daripada potongan di tengah.
        const batas = at === 0 || hay[at - 1] === ' ';
        const s = (batas ? 1000 : 600) - Math.min(at, 500) + p.length * 2;
        if (s > termScore) termScore = s;
      }
      if (termScore < 0) {
        all = false;
        break;
      }
      score += termScore;
    }
    if (!all) continue;
    if (hay.startsWith(needle)) score += 5000;
    scored.push({ item, score });
  }

  return scored
    .sort((a, b) => b.score - a.score || a.item.nama.localeCompare(b.item.nama))
    .slice(0, limit)
    .map((s) => s.item);
}
