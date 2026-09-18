/**
 * Pemindai pra-terbang untuk aturan desain yang bisa diperiksa mesin.
 *
 * Jalankan: node scripts/preflight.mjs
 *
 * Yang diperiksa hanya aturan yang bisa dibuktikan dari berkas. Aturan yang
 * butuh mata manusia (hierarki, ritme, kontras visual) tidak diklaim di sini.
 */
import fs from 'node:fs';
import path from 'node:path';

const VISIBLE = ['app', 'components'];

function walk(dir) {
  return fs.readdirSync(dir, { withFileTypes: true }).flatMap((e) => {
    const p = path.join(dir, e.name);
    if (e.isDirectory()) return walk(p);
    return /\.(tsx|ts|css)$/.test(e.name) ? [p] : [];
  });
}

const files = VISIBLE.flatMap(walk).filter((f) => !f.endsWith('.test.ts'));

const read = (f) => fs.readFileSync(f, 'utf8');

const problems = [];
const notes = [];

/* ------------------------------------------------------------------ dash */
/* Em-dash dan en-dash dilarang total di teks yang terlihat pengguna. */
const DASH = /[\u2013\u2014]/;
for (const f of files) {
  const src = read(f);
  src.split('\n').forEach((line, i) => {
    if (DASH.test(line)) problems.push(`dash dekoratif: ${f}:${i + 1} ${line.trim().slice(0, 80)}`);
  });
}

/* ------------------------------------------------------------------ eyebrow */
/* Maksimal satu label huruf besar ber-tracking per tiga seksi. */
const eyebrowRe = /uppercase\s+tracking-|tracking-\[0\.[12]/g;
let eyebrowCount = 0;
for (const f of files) {
  const m = read(f).match(eyebrowRe);
  if (m) eyebrowCount += m.length;
}
notes.push(`eyebrow ber-tracking: ${eyebrowCount} (batas 1 per 3 seksi)`);
if (eyebrowCount > 3) problems.push(`eyebrow terlalu banyak: ${eyebrowCount}`);

/* ------------------------------------------------------------- h-screen */
for (const f of files) {
  const src = read(f);
  if (/h-screen/.test(src)) problems.push(`h-screen dipakai, harus min-h dvh: ${f}`);
  if (/100vh/.test(src) && !/100dvh/.test(src)) problems.push(`100vh tanpa fallback dvh: ${f}`);
}

/* ------------------------------------------------------------- warna liar */
/* Satu aksen saja. Warna Tailwind arbitrary (mis. bg-purple-500) = bocor. */
const tailwindColor = /\b(bg|text|border)-(purple|violet|fuchsia|pink|indigo|blue|cyan|teal|emerald|lime|yellow|orange|red|rose|sky|amber)-[0-9]{3}\b/g;
for (const f of files) {
  const m = read(f).match(tailwindColor);
  if (m) problems.push(`warna Tailwind langsung (harus token): ${f} -> ${[...new Set(m)].join(', ')}`);
}

/* ------------------------------------------------------- window scroll */
for (const f of files) {
  if (/addEventListener\(\s*['"]scroll['"]/.test(read(f))) {
    problems.push(`window scroll listener: ${f}`);
  }
}

/* ------------------------------------------------------------- hex bebas */
/* Hex hanya boleh hidup di globals.css sebagai token. */
const hexRe = /#[0-9a-fA-F]{3,8}\b/g;
for (const f of files) {
  if (f.endsWith('globals.css')) continue;
  const src = read(f);
  const hits = (src.match(hexRe) ?? []).filter((h) => !/^#(fff|ffffff|000)$/i.test(h));
  if (hits.length) problems.push(`hex di luar token: ${f} -> ${[...new Set(hits)].join(', ')}`);
}

/* ------------------------------------------------------------- reduced motion */
const css = read('app/globals.css');
const hasAnim = /@keyframes/.test(css);
const hasReduced = /prefers-reduced-motion/.test(css);
if (hasAnim && !hasReduced) problems.push('ada @keyframes tapi tanpa prefers-reduced-motion');

/* ------------------------------------------------------------ tap targets */
/* Tombol minimal 44px di mobile. Diperiksa dari CSS kelas, bukan tiap inline. */
if (!/min-height:\s*46px/.test(css)) problems.push('.btn tidak punya min-height 46px');
if (!/min-height:\s*46px/.test(css)) problems.push('.input/.select tidak punya min-height 46px');

/* ------------------------------------------------------------- ukuran output */
const totalLines = files.reduce((a, f) => a + read(f).split('\n').length, 0);
notes.push(`berkas diperiksa: ${files.length}, ${totalLines} baris`);

/* ------------------------------------------------------------------ laporan */
for (const n of notes) console.log(`catatan  ${n}`);
if (problems.length === 0) {
  console.log('\nLULUS: tidak ada pelanggaran yang bisa diperiksa mesin.');
  process.exit(0);
}
console.log('');
for (const p of problems) console.log(`GAGAL    ${p}`);
console.log(`\n${problems.length} pelanggaran.`);
process.exit(1);