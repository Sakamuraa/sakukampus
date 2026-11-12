// Tarik katalog PT lengkap dari PDDikti (paginasi penuh) — cache JSONL per
// halaman, bisa di-resume.
//
//   GET /api/v2/pt/search/filter?page=N&limit=100
//   -> { data: { data[], page, limit, totalItems, totalPages } }
//
// Catatan lapangan:
//   - halaman dalam bisa 30-145 detik di sisi server -> timeout 95 detik
//   - 3 request paralel tetap aman; 4+ memicu WAF (403 HTML)
//   - WAF memblokir User-Agent non-browser -> wajib pakai UA browser +
//     header Origin/Referer
//
// Pakai: node scripts/fetch-catalog-pages.mjs [--out <file.jsonl>]
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const args = process.argv.slice(2);
const outIdx = args.indexOf('--out');
const OUT =
  outIdx >= 0 ? args[outIdx + 1] : path.join(ROOT, 'data', '.catalog-cache', 'pages.jsonl');

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

const PARALEL = 3;
const TIMEOUT_MS = 95_000;
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

fs.mkdirSync(path.dirname(OUT), { recursive: true });

const sudah = new Set();
if (fs.existsSync(OUT)) {
  for (const line of fs.readFileSync(OUT, 'utf8').split('\n')) {
    if (!line.trim()) continue;
    try {
      sudah.add(JSON.parse(line).page);
    } catch {
      /* baris setengah tulis saat proses dibatalkan */
    }
  }
}
console.log(`halaman di cache: ${sudah.size}`);

async function halaman(page) {
  const url = `${ORIGIN}/api/v2/pt/search/filter?page=${page}&limit=100`;
  for (let coba = 0; coba < 6; coba++) {
    try {
      const res = await fetch(url, {
        headers: HEADERS,
        signal: AbortSignal.timeout(TIMEOUT_MS),
      });
      if (res.status === 429) {
        const reset = Number(res.headers.get('ratelimit-reset') || 60);
        console.log(`  429 di halaman ${page}, tidur ${reset + 3}s`);
        await sleep((reset + 3) * 1000);
        continue;
      }
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const teks = await res.text();
      // WAF kadang membalas halaman HTML alih-alih JSON. Perlakukan itu
      // sebagai kegagalan supaya di-retry, bukan crash.
      if (!teks.trimStart().startsWith('{')) {
        throw new Error('respons bukan JSON (WAF)');
      }
      return JSON.parse(teks).data;
    } catch (e) {
      console.log(`  halaman ${page} coba ${coba + 1} gagal: ${e.message}`);
      if (coba === 5) throw e;
      await sleep(12_000);
    }
  }
}

// Wrapper respons memuat totalItems/totalPages; halaman 1 sekaligus jadi
// cache pertama.
const wrapper = await halaman(1);

if (!sudah.has(1)) {
  fs.appendFileSync(OUT, JSON.stringify({ page: 1, rows: wrapper.data }) + '\n');
  sudah.add(1);
}
console.log(`totalItems=${wrapper.totalItems} totalPages=${wrapper.totalPages}`);

const antre = [];
for (let p = 2; p <= wrapper.totalPages; p++) if (!sudah.has(p)) antre.push(p);

let selesai = sudah.size;
await Promise.all(
  Array.from({ length: PARALEL }, async () => {
    for (;;) {
      const p = antre.shift();
      if (!p) return;
      const t0 = Date.now();
      const w = await halaman(p);
      const rows = w.data;
      fs.appendFileSync(OUT, JSON.stringify({ page: p, rows }) + '\n');
      sudah.add(p);
      selesai++;
      console.log(
        `halaman ${p} ok (${rows.length} baris, ${((Date.now() - t0) / 1000) | 0}s) — ${selesai}/${wrapper.totalPages}`,
      );
      await sleep(1200);
    }
  }),
);

const semua = [];
for (const line of fs.readFileSync(OUT, 'utf8').split('\n')) {
  if (!line.trim()) continue;
  try {
    semua.push(...JSON.parse(line).rows);
  } catch {
    /* abaikan baris rusak */
  }
}
console.log(`SELESAI: ${semua.length} baris dari ${sudah.size} halaman -> ${OUT}`);
