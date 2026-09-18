/**
 * Kompilasi CSS Tailwind sekali jalan untuk membuktikan stylesheet benar-benar
 * terbentuk. Ini BUKAN `next build` (yang hanya boleh jalan di Vercel): hanya
 * memanggil PostCSS langsung, tanpa bundling JavaScript sama sekali.
 *
 * Jalankan: node scripts/check-css.mjs
 */
import postcss from 'postcss';
import tailwind from '@tailwindcss/postcss';
import fs from 'node:fs';

const src = fs.readFileSync('app/globals.css', 'utf8');

const result = await postcss([tailwind()]).process(src, {
  from: 'app/globals.css',
  to: 'app/globals.out.css',
});

const css = result.css;
const checks = {
  'token canvas ada': css.includes('--color-canvas'),
  'token accent ada': css.includes('--color-accent'),
  'font-family var dipakai': css.includes('--font-display'),
  'kelas .card ada': /\.card\s*\{/.test(css),
  'kelas .btn ada': /\.btn\s*\{/.test(css),
  'kelas .tabbar ada': /\.tabbar\s*\{/.test(css),
  'kelas .rail ada': /\.rail\s*\{/.test(css),
  'kelas .sheet ada': /\.sheet\s*\{/.test(css),
  'dark mode override ada': css.includes('prefers-color-scheme: dark'),
  'reduced motion ada': css.includes('prefers-reduced-motion'),
};

let gagal = 0;
for (const [nama, ok] of Object.entries(checks)) {
  if (!ok) gagal++;
  console.log(`${ok ? 'OK  ' : 'GAGAL'} ${nama}`);
}

console.log(`\nukuran CSS: ${(css.length / 1024).toFixed(1)} KB`);
if (!/\.h1\s*\{/.test(css)) {
  console.log('GAGAL .h1 tidak terbentuk');
  gagal++;
}

// Bukti tidak ada dash dekoratif yang lolos ke berkas yang dilihat pengguna.
const dashes = (css.match(/[\u2013\u2014]/g) ?? []).length;
console.log(`dash dekoratif (en/em) di CSS: ${dashes}`);

process.exit(gagal === 0 ? 0 : 1);