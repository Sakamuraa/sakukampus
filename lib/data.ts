/**
 * Sumber data untuk API.
 *
 * Saat ini dibaca dari seed JSON yang di-commit (deterministik, cepat, dan
 * tidak butuh DB untuk deploy pertama). Ketika Postgres/Neon diaktifkan,
 * fungsi-fungsi di sini yang diganti implementasinya — rute API tidak berubah.
 */
import institutionsSeed from '@/data/institutions.seed.json';
import uktSeed from '@/data/ukt-ptkin.seed.json';
import scholarshipsSeed from '@/data/scholarships.seed.json';
import type { PtkIn } from '@/lib/kma-ukt';
import type { ScholarshipSeed } from '@/lib/match';

export type InstitutionIndex = {
  kode: string;
  nama: string;
  jenis: string;
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

export const institutions: InstitutionIndex[] = (
  (institutionsSeed as unknown as { pt: [string, string][] }).pt
).map(([kode, nama]) => ({
  kode,
  nama,
  jenis: JENIS(nama),
  ukt: uktByKode.get(kode) ?? null,
}));

export const institutionsByKode = new Map(institutions.map((i) => [i.kode, i]));

export const scholarships = (scholarshipsSeed as unknown as { scholarships: ScholarshipSeed[] })
  .scholarships;

export const seedsMeta = {
  institutions: (institutionsSeed as unknown as { _meta: Record<string, unknown> })._meta,
  ukt: (uktSeed as unknown as { _meta: Record<string, unknown> })._meta,
  scholarships: (scholarshipsSeed as unknown as { _meta: Record<string, unknown> })._meta,
};

/**
 * Pencarian kampus sederhana: cocokkan potongan kata berurutan.
 * Di Postgres nanti ini diganti `similarity()` dari pg_trgm.
 */
export function searchInstitutions(q: string, opts: { jenis?: string; limit?: number } = {}) {
  const needle = q.trim().toUpperCase();
  const limit = Math.min(opts.limit ?? 30, 100);
  if (!needle) return [];

  const terms = needle.split(/\s+/).filter(Boolean);
  const scored: { item: InstitutionIndex; score: number }[] = [];

  for (const item of institutions) {
    if (opts.jenis && item.jenis !== opts.jenis) continue;
    const hay = item.nama.toUpperCase();
    let score = 0;
    let all = true;
    for (const t of terms) {
      const at = hay.indexOf(t);
      if (at < 0) {
        all = false;
        break;
      }
      // makin awal posisinya, makin relevan
      score += 1000 - Math.min(at, 900);
      score += t.length;
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