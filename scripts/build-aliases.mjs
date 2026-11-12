// Bangun data/aliases.seed.json: kota + provinsi + nama singkat per nama PT.
//
// Sumber (dua, digabung):
//   data/.catalog-cache/bulk.json  — tarikan satu-request (scripts/fetch-alias-bulk.mjs)
//   data/.catalog-cache/pages.jsonl — tarikan paginasi v2 (scripts/build-catalog.mjs)
//
// Kenapa perlu: nama resmi PDDikti tidak memuat kota ("UNIVERSITAS ISLAM NEGERI
// SYARIF HIDAYATULLAH"), padahal orang menulis "UIN Jakarta" atau "Akademi
// Kebidanan Binalita Sudama Deli Serdang". Tanpa kota, semua pencarian berbasis
// lokasi nihil.
//
// Key memakai nama ternormalisasi (bukan urutan baris), jadi file ini aman
// ditulis ulang kapan pun tanpa harus sinkron dengan seed.
//
// Pakai:
//   node scripts/fetch-alias-bulk.mjs   # tarik data wilayah (satu request)
//   node scripts/build-aliases.mjs      # rakit alias
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const PAGES = path.join(ROOT, 'data', '.catalog-cache', 'pages.jsonl');
const BULK = path.join(ROOT, 'data', '.catalog-cache', 'bulk.json');
const OUT = path.join(ROOT, 'data', 'aliases.seed.json');

const norm = (s) =>
  String(s ?? '')
    .toUpperCase()
    .replace(/\s+/g, ' ')
    .replace(/[",.]/g, '')
    .trim();

/** Buang imbuhan wilayah yang tidak pernah jadi kata kunci pencarian. */
const BUANG_WILAYAH = /^(KOTA|KAB\.?|KABUPATEN|PROV\.?|PROVINSI)\s+/i;

const meta = new Map();
let baris = 0;

const catat = (r) => {
  const n = norm(r.nama_pt);
  if (!n || meta.has(n)) return;
  meta.set(n, {
    kota: String(r.kab_kota_pt ?? '').replace(BUANG_WILAYAH, '').trim(),
    prov: String(r.provinsi_pt ?? '').replace(BUANG_WILAYAH, '').trim(),
    singkat: String(r.nama_singkat ?? '').trim(),
  });
};

if (fs.existsSync(BULK)) {
  const rows = JSON.parse(fs.readFileSync(BULK, 'utf8'));
  for (const r of rows) { baris++; catat(r); }
  console.log(`bulk.json: ${rows.length} baris`);
}
if (fs.existsSync(PAGES)) {
  for (const line of fs.readFileSync(PAGES, 'utf8').split('\n')) {
    if (!line.trim()) continue;
    let hal;
    try {
      hal = JSON.parse(line);
    } catch {
      continue;
    }
    for (const r of hal.rows ?? []) { baris++; catat(r); }
  }
}
console.log(`total baris dipindai: ${baris}`);

const alias = {};
for (const [nama, m] of meta) {
  if (!m.kota && !m.prov && !m.singkat) continue;
  alias[nama] = m;
}

fs.writeFileSync(
  OUT,
  JSON.stringify(
    {
      _meta: {
        generated_at: new Date().toISOString(),
        source: 'pddikti.kemdiktisaintek.go.id/api/v2/pt/search/filter',
        note: 'Key = nama ternormalisasi. Nilai: kota, provinsi, nama singkat.',
        rows_scanned: baris,
        entries: Object.keys(alias).length,
      },
      alias,
    },
    null,
    1,
  ) + '\n',
  'utf8',
);
console.log(
  `tulis ${OUT}: ${baris} baris dipindai, ${Object.keys(alias).length} entri alias`,
);
