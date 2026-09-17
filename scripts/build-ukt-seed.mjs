/**
 * Bangun data/ukt-ptkin.seed.json dari fixture koordinat PDF KMA.
 *
 * Jalankan: node scripts/build-ukt-seed.mjs
 *
 * Parser sebenarnya ada di lib/kma-ukt.ts (diuji vitest). Script ini memanggil
 * logika yang sama lewat import dinamis dari hasil build esbuild-like sederhana:
 * untuk menghindari duplikasi implementasi, script menulis ulang TS ke JS
 * sementara memakai `tsx`-style loader bawaan Node 22 (--experimental-strip-types).
 */
import fs from 'node:fs';
import { parseKma, summarizeUkt, findPtkIn, findProdi } from '../lib/kma-ukt.ts';

const LINES = 'data/fixtures/kma-ukt-2026.lines.json';
const OUT = 'data/ukt-ptkin.seed.json';

const fixture = JSON.parse(fs.readFileSync(LINES, 'utf8'));
const blocks = parseKma(fixture.pages);
const summary = summarizeUkt(blocks);

const seed = {
  _meta: {
    generated_at: new Date().toISOString(),
    source_url: fixture._meta.source_pdf,
    decree: fixture._meta.decree,
    academic_year: fixture._meta.academic_year,
    ...summary,
  },
  ptkin: blocks,
};

fs.writeFileSync(OUT, JSON.stringify(seed));

const jakarta = findPtkIn(blocks, 'SYARIF HIDAYATULLAH');
const ti = jakarta ? findProdi(jakarta, 'Teknik Informatika') : undefined;
console.log(`ptkin=${summary.ptkin} prodi=${summary.prodi} lengkap=${summary.prodiGolonganLengkap}`);
console.log('GOLDEN TI UIN JKT:', JSON.stringify(ti));

if (!ti || ti.gol[1] !== 4_270_000 || ti.kip !== 2_400_000) {
  console.error('GOLDEN TEST GAGAL — seed tidak boleh dipakai');
  process.exit(1);
}