/**
 * Bangun ulang data/institutions.seed.json dari PDDikti (sumber resmi, API tak berdokumentasi).
 *
 * Kenapa skrip ini ada: health check harian (/api/cron/refresh-seeds) menjerit kalau
 * katalog lebih tua dari 45 hari. Sebelumnya repo menyebut skrip ini di komentar
 * lib/pddikti.ts tapi filenya tidak pernah di-commit — inilah versi yang benar.
 *
 * Dua fase, keduanya bisa di-resume lewat cache:
 *
 *   FASE 1 — paginasi penuh
 *     GET /api/v2/pt/search/filter?page=N&limit=100
 *     -> 6964 PT (per Nov 2026), TANPA kolom kode. Halaman dalam bisa 30-145 detik
 *        di sisi server, jadi timeout sengaja 95 detik dan jalan 3 paralel.
 *
 *   FASE 2 — resolve kode
 *     GET /api/pencarian/pt/{nama}  (cap 10 hasil, fuzzy, cocok case-insensitive)
 *     -> kolom kode+nama. Dipakai untuk nama yang tidak ada di seed lama.
 *        Rate limit 60 req/menit (header ratelimit-*), 429 -> tidur sampai reset.
 *
 * Kenapa tidak semua lewat fase 2? Karena 6964 nama = 6964 request = ~2,3 jam di
 * rate limit. Seed lama sudah menyimpan 3691 kodes yang valid, tinggal dipakai
 * ulang lewat kecocokan nama ternormalisasi.
 *
 * Pakai:
 *   node scripts/build-catalog.mjs                          # penuh (fetch sendiri)
 *   node scripts/build-catalog.mjs --pages X.jsonl --kode Y.jsonl   # pakai cache
 *   node scripts/build-catalog.mjs --dry-run                # hitung saja, tidak menulis
 *
 * Setelah seed berubah: jalankan test (`npx vitest run`) lalu commit data + skripnya.
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const OUT_SEED = path.join(ROOT, 'data', 'institutions.seed.json');
const SEED_LAMA = OUT_SEED;
const CACHE_DIR = path.join(ROOT, 'data', '.catalog-cache');
const PAGES_JSONL = path.join(CACHE_DIR, 'pages.jsonl');
const KODE_JSONL = path.join(CACHE_DIR, 'kode.jsonl');

const ORIGIN = 'https://pddikti.kemdiktisaintek.go.id';
const UA =
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36';
const HEADERS = {
  Origin: ORIGIN,
  Referer: ORIGIN + '/',
  'User-Agent': UA,
  accept: 'application/json, text/plain, */*',
  'sec-fetch-site': 'same-origin',
  'sec-fetch-mode': 'cors',
  'sec-fetch-dest': 'empty',
};

const args = process.argv.slice(2);
const ambilFlag = (nama) => {
  const i = args.indexOf(nama);
  return i >= 0 ? args[i + 1] : undefined;
};
const DRY = args.includes('--dry-run');
const PAGES_IN = ambilFlag('--pages');
const KODE_IN = ambilFlag('--kode');

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const norm = (s) =>
  String(s ?? '')
    .toUpperCase()
    .replace(/\s+/g, ' ')
    .replace(/[",.]/g, '')
    .trim();

/** GET JSON dengan retry + hormati rate limit. */
async function getJson(url, timeoutMs = 95_000) {
  for (let coba = 0; coba < 5; coba++) {
    let res;
    try {
      res = await fetch(url, { headers: HEADERS, signal: AbortSignal.timeout(timeoutMs) });
    } catch (e) {
      if (coba === 4) throw e;
      await sleep(6000 * (coba + 1));
      continue;
    }
    if (res.status === 429) {
      const reset = Number(res.headers.get('ratelimit-reset') || 60);
      console.log(`  429 -> tidur ${reset + 3}s`);
      await sleep((reset + 3) * 1000);
      continue;
    }
    if (res.status === 400) return { tolak: true };
    if (!res.ok) {
      if (coba === 4) throw new Error(`HTTP ${res.status} ${url}`);
      await sleep(4000 * (coba + 1));
      continue;
    }
    return await res.json();
  }
  return null;
}

function bacaJsonl(file) {
  const hasil = [];
  if (!fs.existsSync(file)) return hasil;
  for (const line of fs.readFileSync(file, 'utf8').split('\n')) {
    if (!line.trim()) continue;
    try {
      hasil.push(JSON.parse(line));
    } catch {
      /* baris yang tertulis setengah saat proses dibatalkan */
    }
  }
  return hasil;
}

// ---------------------------------------------------------------- FASE 1
async function fase1() {
  if (PAGES_IN) {
    console.log(`[fase 1] pakai cache halaman: ${PAGES_IN}`);
    return bacaJsonl(PAGES_IN);
  }
  fs.mkdirSync(CACHE_DIR, { recursive: true });
  const sudah = new Set(bacaJsonl(PAGES_JSONL).map((h) => h.page));
  console.log(`[fase 1] halaman di cache: ${sudah.size}`);

  const pertama = await getJson(`${ORIGIN}/api/v2/pt/search/filter?page=1&limit=100`);
  const totalHalaman = pertama.data.totalPages;
  console.log(`[fase 1] totalItems=${pertama.data.totalItems} totalPages=${totalHalaman}`);
  if (!sudah.has(1)) {
    fs.appendFileSync(PAGES_JSONL, JSON.stringify({ page: 1, rows: pertama.data.data }) + '\n');
    sudah.add(1);
  }

  const antre = [];
  for (let p = 2; p <= totalHalaman; p++) if (!sudah.has(p)) antre.push(p);
  const PARALEL = 3;
  await Promise.all(
    Array.from({ length: PARALEL }, async () => {
      for (;;) {
        const p = antre.shift();
        if (!p) return;
        const t0 = Date.now();
        const w = await getJson(`${ORIGIN}/api/v2/pt/search/filter?page=${p}&limit=100`);
        fs.appendFileSync(PAGES_JSONL, JSON.stringify({ page: p, rows: w.data.data }) + '\n');
        console.log(`[fase 1] halaman ${p} ok (${((Date.now() - t0) / 1000) | 0}s)`);
        await sleep(1500);
      }
    }),
  );
  return bacaJsonl(PAGES_JSONL);
}

// ---------------------------------------------------------------- FASE 2
async function fase2(namaButuh) {
  if (KODE_IN) {
    console.log(`[fase 2] pakai cache kode: ${KODE_IN}`);
    return new Map(bacaJsonl(KODE_IN).map((o) => [o.nama, o.kode]));
  }
  fs.mkdirSync(CACHE_DIR, { recursive: true });
  const sudah = new Map(bacaJsonl(KODE_JSONL).map((o) => [o.nama, o.kode]));
  const antre = [...namaButuh.entries()].filter(([n]) => !sudah.has(n));
  console.log(`[fase 2] butuh ${namaButuh.size} kode, cache ${sudah.size}, antrean ${antre.length}`);
  if (!antre.length) return sudah;

  const keluar = fs.createWriteStream(KODE_JSONL, { flags: 'a' });
  const PARALEL = 4;
  const JEDA_MS = 1150;

  const cari = async (namaAsli) => {
    const bersih = namaAsli.replace(/\s*\([^)]*\)\s*/g, ' ').replace(/\s+/g, ' ').trim();
    const kueri = [namaAsli];
    if (bersih !== namaAsli) kueri.push(bersih);
    const kata = bersih.split(' ');
    if (kata.length > 4) kueri.push(kata.slice(-4).join(' '));
    if (kata.length > 4) kueri.push(kata.slice(0, 4).join(' '));
    for (const q of kueri) {
      const j = await getJson(`${ORIGIN}/api/pencarian/pt/${encodeURIComponent(q)}`, 30_000);
      await sleep(JEDA_MS);
      if (!j || j.tolak) continue;
      const persis = (j.data ?? []).find((r) => norm(r.nama) === norm(namaAsli));
      if (persis) return persis.kode;
    }
    return null;
  };

  let logTerakhir = 0;
  await Promise.all(
    Array.from({ length: PARALEL }, async (id) => {
      for (;;) {
        const item = antre.shift();
        if (!item) return;
        const [n, namaAsli] = item;
        try {
          const kode = await cari(namaAsli);
          keluar.write(JSON.stringify({ nama: n, kode, asli: namaAsli }) + '\n');
          sudah.set(n, kode);
        } catch (e) {
          console.log(`  [fase2 w${id}] ${namaAsli}: ${e.message} -> tunda 15s`);
          await sleep(15000);
          antre.push(item);
          continue;
        }
        if (Date.now() - logTerakhir > 60_000) {
          console.log(`[fase 2] ${sudah.size}/${namaButuh.size} (sisa ${antre.length})`);
          logTerakhir = Date.now();
        }
      }
    }),
  );
  keluar.end();
  return sudah;
}

// ---------------------------------------------------------------- UTAMA
const halaman = await fase1();

const baris = [];
const seen = new Set();
for (const h of halaman) {
  for (const r of h.rows ?? []) {
    if (seen.has(r.id_sp)) continue;
    seen.add(r.id_sp);
    baris.push(r);
  }
}
console.log(`baris unik katalog: ${baris.length}`);

const seedLama = JSON.parse(fs.readFileSync(SEED_LAMA, 'utf8'));
const kodeLama = new Map(seedLama.pt.map(([kode, nama]) => [norm(nama), kode]));

const butuh = new Map();
for (const r of baris) {
  const n = norm(r.nama_pt);
  if (!n || kodeLama.has(n)) continue;
  if (!butuh.has(n)) butuh.set(n, r.nama_pt.trim());
}
const kodeBaru = await fase2(butuh);

// rakit seed: nama resmi dari katalog baru, kode dari seed lama atau hasil resolve
const perKode = new Map();
let tanpaKode = 0;
let kembarDibuang = 0;
for (const r of baris) {
  const n = norm(r.nama_pt);
  if (!n) continue;
  const kode = kodeLama.get(n) ?? kodeBaru.get(n) ?? null;
  if (!kode) {
    tanpaKode++;
    continue;
  }
  if (perKode.has(kode)) {
    kembarDibuang++;
    continue; // nama kembar / id_sp ganda -> satu entri per kode
  }
  perKode.set(kode, [kode, r.nama_pt.toUpperCase().replace(/\s+/g, ' ').trim()]);
}
const pt = [...perKode.values()].sort((a, b) => a[0].localeCompare(b[0]));

const meta = {
  generated_at: new Date().toISOString(),
  source: `${ORIGIN}/api/v2/pt/search/filter (paginasi) + /api/pencarian/pt (kode)`,
  method:
    'paginasi limit=100 semua halaman, join nama ke seed lama untuk kode lama, resolve kode sisa lewat pencarian pt',
  count: pt.length,
  note:
    'pddikti_unofficial=1; tanpa filter status_pt (Aktif + Alih Bentuk + Tutup dst, sama seperti seed sebelumnya); ' +
    `baris tanpa kode dibuang: ${tanpaKode}; entri kembar pada kode sama: ${kembarDibuang}`,
};

console.log(`\nhasil: ${pt.length} kampus, tanpa kode ${tanpaKode}, kembar ${kembarDibuang}`);
console.log(`seed lama: ${seedLama.pt.length} -> baru: ${pt.length}`);

if (DRY) {
  console.log('dry-run: file tidak ditulis');
} else {
  fs.writeFileSync(OUT_SEED, JSON.stringify({ _meta: meta, pt }, null, 1) + '\n', 'utf8');
  console.log(`tulis ${OUT_SEED}`);
}
