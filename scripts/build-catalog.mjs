/**
 * Tarik katalog PT + resolve kode lewat browser sungguhan.
 *
 * Kenapa browser, bukan fetch biasa: API PDDikti sekarang mewajibkan token
 * reCAPTCHA v3 di header X-Recaptcha-Token, dan WAF (Cloudflare + CrowdSec)
 * memblokir request yang datang dari luar browser. Jadi request dikirim dari
 * DALAM tab PDDikti yang terbuka di Chrome: token asli, Origin asli, cookie
 * asli, tidak ada yang perlu ditiru.
 *
 * Dois skrip, dua cache JSONL (bisa di-resume):
 *
 *   FASE 1 — paginasi penuh
 *     GET api-pddikti.kemdiktisaintek.go.id/api/v2/pt/search/filter?page=N&limit=100
 *     -> semua PT (6.9k-an per Nov 2026), TANPA kolom kode.
 *     -> cache: data/.catalog-cache/pages.jsonl
 *
 *   FASE 2 — resolve kode
 *     GET api-pddikti.kemdiktisaintek.go.id/api/pencarian/pt/{nama}
 *     -> kolom kode + nama (cap 10 hasil, fuzzy, case-insensitive).
 *     -> cache: data/.catalog-cache/kode.jsonl
 *
 * Kenapa fase 2 tidak untuk semua orang? 6.9k nama = 6.9k request, masing-masing
 * butuh token reCAPTCHA baru. Seed lama sudah menyimpan ribuan kode valid,
 * jadi kodenya dipakai ulang lewat kecocokan nama ternormalisasi; hanya sisanya
 * yang perlu ditanyakan.
 *
 * PERSYARATAN: Chrome harus berjalan dengan remote debugging dan tab PDDikti
 * terbuka:
 *
 *   chrome --remote-debugging-port=9341 https://pddikti.kemdiktisaintek.go.id/
 *
 * Pakai:
 *   node scripts/fetch-catalog-browser.mjs             # fase 1 (halaman)
 *   node scripts/fetch-catalog-browser.mjs --kode      # fase 2 (kode)
 *   node scripts/build-catalog.mjs                     # rakit seed dari cache
 *   node scripts/build-catalog.mjs --dry-run           # hitung saja, tidak tulis
 *
 * Setelah seed berubah: `npx vitest run`, lalu commit data + skripnya.
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const CACHE_DIR = path.join(ROOT, 'data', '.catalog-cache');
const PAGES_JSONL = path.join(CACHE_DIR, 'pages.jsonl');
const KODE_JSONL = path.join(CACHE_DIR, 'kode.jsonl');

const PORT = Number(process.env.CDP_PORT || 9341);
const JEDA_MS = Number(process.env.JEDA_MS || 1400);
const SITES = 'https://pddikti.kemdiktisaintek.go.id';
const API = 'https://api-pddikti.kemdiktisaintek.go.id';
const SITE_KEY = '6LdqjDstAAAAAMW1whjCNKyvqmPBOIssWETjbLbh';

const args = process.argv.slice(2);
const DRY = args.includes('--dry-run');
const MULAI_KODE = args.includes('--kode');
/** Tarik alias kota dari cache lalu rakit seed, tanpa menarik halaman baru. */
const HANYA_RAKIT = args.includes('--rakit');

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

/* ---------------------------------------------------------------- browser */

const list = await (await fetch(`http://127.0.0.1:${PORT}/json/list`)).json();
// Host tab harus persis pddikti.kemdiktisaintek.go.id. Perbandingan substring
// salah: api-pddikti.kemdiktisaintek.go.id juga memuat "pddikti.kemdiktisaintek.go.id".
const isTabSitus = (t) => {
  try {
    return new URL(t.url).hostname === 'pddikti.kemdiktisaintek.go.id';
  } catch {
    return false;
  }
};
const target = list.find((t) => t.type === 'page' && isTabSitus(t));
if (!target) {
  console.error(
    'Tab PDDikti tidak ditemukan. Buka Chrome headed dengan:\n' +
      `  chrome --remote-debugging-port=${PORT} ${SITES}/\n` +
      'lalu jalankan ulang skrip ini.',
  );
  process.exit(1);
}

const ws = new WebSocket(target.webSocketDebuggerUrl);
let id = 0;
const pending = new Map();
const send = (method, params = {}) =>
  new Promise((res) => {
    const i = ++id;
    pending.set(i, res);
    ws.send(JSON.stringify({ id: i, method, params }));
  });
ws.addEventListener('message', (ev) => {
  const m = JSON.parse(ev.data);
  if (m.id && pending.has(m.id)) {
    pending.get(m.id)(m.result);
    pending.delete(m.id);
  }
});
await new Promise((r) => ws.addEventListener('open', r));
await send('Runtime.enable');

const ev = async (expr) => {
  const r = await send('Runtime.evaluate', {
    expression: expr,
    returnByValue: true,
    awaitPromise: true,
    userGesture: true,
  });
  if (r?.exceptionDetails) {
    throw new Error(r.exceptionDetails.exception?.description || r.exceptionDetails.text);
  }
  return r?.result?.value;
};

/**
 * Satu request API dari dalam browser, dengan token reCAPTCHA BARU.
 *
 * Token reCAPTCHA v3 bersifat sekali pakai di sisi PDDikti: token yang sudah
 * dipakai akan ditolak (403). selain itu reCAPTCHA sendiri kadang menerbitkan
 * token dengan skor rendah yang juga ditolak — pengukuran lapangan menunjukkan
 * ±40% request ditolak walau jeda sudah 2,5 detik. Jadi: token baru + retry
 * sampai berhasil, dengan jeda antar percobaan.
 *
 * Mengembalikan { status, body } supaya pemanggil bisa menilai sendiri.
 */
const panggil = async (path, tries = 8) => {
  const script = `(async () => {
    const KEY = ${JSON.stringify(SITE_KEY)};
    if (typeof grecaptcha === 'undefined') return JSON.stringify({ status: 0, error: 'grecaptcha tidak termuat' });
    const token = () => new Promise((res, rej) => {
      grecaptcha.ready(() => grecaptcha.execute(KEY, { action: 'api_request' }).then(res, rej));
      setTimeout(() => rej(new Error('token timeout')), 15000);
    });
    for (let attempt = 0; attempt < ${tries}; attempt++) {
      try {
        const t = await token();
        const r = await fetch(${JSON.stringify(API)} + ${JSON.stringify(path)}, {
          headers: { 'X-Recaptcha-Token': t },
        });
        const txt = await r.text();
        if (!txt.trimStart().startsWith('{')) {
          if (attempt === ${tries} - 1) return JSON.stringify({ status: r.status, body: txt.slice(0, 200) });
          await new Promise(r2 => setTimeout(r2, 4000));
          continue;
        }
        const j = JSON.parse(txt);
        if (j.status !== 'success') {
          // 403 reCAPTCHA -> token baru, coba lagi.
          if (attempt === ${tries} - 1) return JSON.stringify({ status: r.status, body: txt });
          await new Promise(r2 => setTimeout(r2, 4000));
          continue;
        }
        return JSON.stringify({ status: r.status, body: txt });
      } catch (e) {
        if (attempt === ${tries} - 1) return JSON.stringify({ status: 0, error: String(e.message) });
        await new Promise(r2 => setTimeout(r2, 4000));
      }
    }
  })()`;
  return JSON.parse(await ev(script));
};

function bacaJsonl(file) {
  const hasil = [];
  if (!fs.existsSync(file)) return hasil;
  for (const line of fs.readFileSync(file, 'utf8').split('\n')) {
    if (!line.trim()) continue;
    try {
      hasil.push(JSON.parse(line));
    } catch {
      /* baris setengah tulis */
    }
  }
  return hasil;
}

const norm = (s) =>
  String(s ?? '')
    .toUpperCase()
    .replace(/\s+/g, ' ')
    .replace(/[",.]/g, '')
    .trim();

/* --------------------------------------------------------------- FASE 1 */

/**
 * Tarik katalog PT.
 *
 * Dua jalur, untuk preferred:
 *
 *   A) SATU request ke /api/pt/search/filter?limit=20000
 *      Endpoint v1 tidak membungkus hasil dan mengabaikan paginasi — satu
 *      request mengembalikan SELURUH katalog (6.8k baris, diukur Nov 2026).
 *      Ini jalur utama: satu token, bukan 70.
 *
 *   B) Paginasi /api/v2/pt/search/filter?page=N&limit=100
 *      Cadangan kalau v1 berubah. Butuh ~70 request, jadi jauh lebih lambat dan
 *      rawan kena penolakan reCAPTCHA.
 */
async function fase1() {
  fs.mkdirSync(CACHE_DIR, { recursive: true });

  // Jalur A: satu request untuk semuanya.
  console.log('[fase 1] mencoba jalur A (satu request penuh)...');
  for (let percobaan = 1; percobaan <= 6; percobaan++) {
    const r = await panggil('/api/pt/search/filter?limit=20000');
    if (r.status === 200 && !r.error) {
      const j = JSON.parse(r.body);
      const rows = Array.isArray(j.data)
        ? j.data
        : j.data && Array.isArray(j.data.data)
          ? j.data.data
          : [];
      if (rows.length > 6000) {
        fs.writeFileSync(
          PAGES_JSONL,
          JSON.stringify({ page: 1, rows, totalItems: rows.length, totalPages: 1 }) + '\n',
        );
        console.log(`[fase 1] jalur A berhasil: ${rows.length} baris dalam satu request`);
        return;
      }
      console.error(`[fase 1] jalur A percobaan ${percobaan}: hanya ${rows.length} baris`);
    } else {
      console.error(
        `[fase 1] jalur A percobaan ${percobaan} gagal: ${r.error || 'HTTP ' + r.status}`,
      );
    }
    await sleep(percobaan * 20_000);
  }

  // Jalur B: paginasi, resumable per halaman.
  console.log('[fase 1] jatuh ke jalur B (paginasi)...');
  const sudah = new Set(bacaJsonl(PAGES_JSONL).map((h) => h.page));
  console.log(`[fase 1] halaman di cache: ${sudah.size}`);

  let totalPages = 0;
  let totalItems = 0;
  for (let page = 1; page <= 200; page++) {
    if (sudah.has(page)) continue;
    // Halaman yang gagal DIULANG, bukan dilewati: satu halaman hilang = 100
    // kampus hilang dari katalog. Jeda panjang setelah gagal, karena reCAPTCHA
    // sedang menurunkan skor token kita.
    let berhasil = false;
    for (let percobaan = 1; percobaan <= 8 && !berhasil; percobaan++) {
      const r = await panggil(`/api/v2/pt/search/filter?page=${page}&limit=100`);
      if (r.status !== 200 || r.error) {
        console.error(
          `[fase 1] halaman ${page} percobaan ${percobaan} gagal: ${r.error || 'HTTP ' + r.status}`,
        );
        await sleep(percobaan * 20_000);
        continue;
      }
      const j = JSON.parse(r.body);
      if (j.status !== 'success') {
        console.error(`[fase 1] halaman ${page}: ${j.message || j.status}`);
        await sleep(percobaan * 20_000);
        continue;
      }
      const d = j.data && j.data.data ? j.data : j;
      fs.appendFileSync(
        PAGES_JSONL,
        JSON.stringify({
          page,
          rows: d.data || [],
          totalItems: d.totalItems,
          totalPages: d.totalPages,
        }) + '\n',
      );
      totalItems = d.totalItems ?? totalItems;
      totalPages = d.totalPages ?? totalPages;
      berhasil = true;
    }
    if (!berhasil) {
      console.error(`[fase 1] halaman ${page} GAGAL TOTAL — dilewati (kurang ${100} baris)`);
      continue;
    }
    if (page % 5 === 0 || page === 1) {
      console.log(`[fase 1] halaman ${page}/${totalPages || '?'}`);
    }
    await sleep(JEDA_MS);
    if (totalPages && page >= totalPages) break;
  }
  console.log(`[fase 1] selesai: totalItems=${totalItems} totalPages=${totalPages}`);
}

/* --------------------------------------------------------------- FASE 2 */

async function fase2() {
  const seed = JSON.parse(fs.readFileSync(path.join(ROOT, 'data', 'institutions.seed.json'), 'utf8'));
  const kodeLama = new Map(seed.pt.map(([kode, nama]) => [norm(nama), kode]));

  // Nama yang ada di katalog tapi belum punya kode di seed lama.
  const namaKatalog = new Map();
  for (const h of bacaJsonl(PAGES_JSONL)) {
    for (const r of h.rows ?? []) {
      const n = norm(r.nama_pt);
      if (n && !namaKatalog.has(n)) namaKatalog.set(n, r.nama_pt.trim());
    }
  }
  const butuh = [...namaKatalog.entries()].filter(([n]) => !kodeLama.has(n));
  console.log(`[fase 2] nama butuh kode: ${butuh.length} dari ${namaKatalog.size}`);

  const sudah = new Map(bacaJsonl(KODE_JSONL).map((o) => [o.nama, o.kode]));
  const antre = butuh.filter(([n]) => !sudah.has(n));
  console.log(`[fase 2] cache ${sudah.size}, antrean ${antre.length}`);

  const keluar = fs.createWriteStream(KODE_JSONL, { flags: 'a' });
  let kosong = 0;
  for (const [n, namaAsli] of antre) {
    const bersih = namaAsli.replace(/\s*\([^)]*\)\s*/g, ' ').replace(/\s+/g, ' ').trim();
    const kandidat = [namaAsli];
    if (bersih !== namaAsli) kandidat.push(bersih);
    const kata = bersih.split(' ');
    if (kata.length > 4) kandidat.push(kata.slice(-4).join(' '));
    if (kata.length > 4) kandidat.push(kata.slice(0, 4).join(' '));

    let kode = null;
    for (const q of kandidat) {
      const r = await panggil(`/api/pencarian/pt/${encodeURIComponent(q)}`);
      if (r.status !== 200 || r.error) {
        await sleep(6000);
        continue;
      }
      const j = JSON.parse(r.body);
      const data = j.data ?? [];
      const persis = Array.isArray(data)
        ? data.find((x) => norm(x.nama) === norm(namaAsli))
        : null;
      if (persis) { kode = persis.kode; break; }
      await sleep(JEDA_MS);
    }
    keluar.write(JSON.stringify({ nama: n, kode, asli: namaAsli }) + '\n');
    sudah.set(n, kode);
    if (!kode) kosong++;
    if (sudah.size % 25 === 0) {
      console.log(`[fase 2] ${sudah.size}/${butuh.length} (kosong ${kosong})`);
    }
    await sleep(JEDA_MS);
  }
  keluar.end();
  console.log(`[fase 2] selesai, kosong ${kosong}`);
}

/* ---------------------------------------------------------------- UTAMA */

console.log('tab:', target.url);

/**
 * Pastikan tab berada di beranda yang sudah memuat reCAPTCHA.
 *
 * Kalau IP kena "__VERIFIKASI KEAMANAN__" (CrowdSec + Turnstile), situs
 * mengganti halamannya dan grecaptcha hilang. Memuat ulang beranda adalah
 * satu-satunya jalan keluar yang wajar; kalau challenge tetap muncul, API
 * sedang memblokir IP kita dan skrip harus berhenti dengan pesan jelas.
 */
async function pastikanRecaptcha() {
  for (let i = 0; i < 4; i++) {
    await send('Page.navigate', { url: SITES + '/' });
    await sleep(9000);
    const status = await ev(`typeof grecaptcha`);
    if (status === 'object') return true;
    console.error(`[browser] grecaptcha belum termuat (percobaan ${i + 1}) — memuat ulang beranda`);
  }
  const judul = await ev('document.title');
  console.error(
    `\nGagal: reCAPTCHA tidak tersedia di tab PDDikti (judul halaman: "${judul}").\n` +
      'Kalau halaman menampilkan "Verifikasi Keamanan", IP ini sedang diblokir\n' +
      'CrowdSec/Turnstile. Tunggu cooldown, atau buka PDDikti manual di browser\n' +
      'ini sampai halaman normal muncul, lalu jalankan ulang skrip.',
  );
  return false;
}

if (!(await pastikanRecaptcha())) process.exit(1);
console.log('grecaptcha: object');

if (!DRY && !HANYA_RAKIT) {
  await fase1();
  await fase2();
}

// Rakit seed dari cache.
const halaman = bacaJsonl(PAGES_JSONL);
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

/**
 * GUARD: jangan pernah menulis seed dari katalog yang belum lengkap.
 * Cache 5 halaman berisi 500 baris — memakainya berarti katalog 6.891
 * jadi 500 dan seluruh UKT PTKIN ikut hilang. Katalog hanya dianggap lengkap
 * kalau jumlah halamannya sama dengan totalPages yang diumumkan API (dan
 * tidak ada halaman yang tercatat gagal).
 */
const halamanGagal = halaman.filter((h) => h.error).map((h) => h.page);
const totalPagesApi = halaman.find((h) => h.totalPages)?.totalPages ?? 0;
if (halamanGagal.length) {
  console.error(`\nBATAL: ${halamanGagal.length} halaman gagal: ${halamanGagal.join(', ')}`);
  process.exit(1);
}
if (totalPagesApi && halaman.length < totalPagesApi) {
  console.error(
    `\nBATAL: katalog belum lengkap — ${halaman.length} dari ${totalPagesApi} halaman. ` +
      'Seed lama dipertahankan.',
  );
  process.exit(1);
}
if (baris.length < 6000) {
  console.error(`\nBATAL: hanya ${baris.length} baris — jauh di bawah 6.000. Seed lama dipertahankan.`);
  process.exit(1);
}

const seedLama = JSON.parse(fs.readFileSync(path.join(ROOT, 'data', 'institutions.seed.json'), 'utf8'));
const kodeLama = new Map(seedLama.pt.map(([kode, nama]) => [norm(nama), kode]));
const kodeBaru = new Map(bacaJsonl(KODE_JSONL).map((o) => [o.nama, o.kode]));

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
    continue;
  }
  perKode.set(kode, [kode, r.nama_pt.toUpperCase().replace(/\s+/g, ' ').trim()]);
}
const pt = [...perKode.values()].sort((a, b) => a[0].localeCompare(b[0]));

const meta = {
  generated_at: new Date().toISOString(),
  source:
    'api-pddikti.kemdiktisaintek.go.id/api/v2/pt/search/filter (paginasi) + /api/pencarian/pt (kode)',
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
  const out = path.join(ROOT, 'data', 'institutions.seed.json');
  fs.writeFileSync(out, JSON.stringify({ _meta: meta, pt }, null, 1) + '\n', 'utf8');
  console.log(`tulis ${out}`);
}

process.exit(0);
