/**
 * Ekstraksi geometri PDF KMA -> fixture baris JSON.
 *
 * Jalankan: node scripts/extract-kma-lines.mjs
 * Output:   data/fixtures/kma-ukt-2026.lines.json   (di-commit)
 *
 * Kenapa dipisah: parser sebenarnya hidup di `lib/kma-ukt.ts` dan diuji vitest.
 * Script ini hanya mengubah PDF -> koordinat, sehingga tidak ada dua
 * implementasi parser yang bisa berbeda perilaku.
 *
 * Bentuk output: array halaman, tiap halaman array item { s, x, y }.
 * Item kosong dibuang. Nilai dibulatkan supaya fixture stabil antar-jalankan.
 */
import fs from 'node:fs';
import { getDocumentProxy } from 'unpdf';

const PDF = process.argv[2] ?? 'data/fixtures/kma-ukt-2026.pdf';
const OUT = process.argv[3] ?? 'data/fixtures/kma-ukt-2026.lines.json';

const pdf = await getDocumentProxy(new Uint8Array(fs.readFileSync(PDF)));
const pages = [];

for (let p = 1; p <= pdf.numPages; p++) {
  const page = await pdf.getPage(p);
  const tc = await page.getTextContent();
  const items = [];
  for (const it of tc.items) {
    const s = it.str;
    if (!s || !s.trim()) continue;
    items.push({
      s,
      x: Math.round(it.transform[4] * 10) / 10,
      y: Math.round(it.transform[5] * 10) / 10,
    });
  }
  pages.push(items);
}

const payload = {
  _meta: {
    generated_at: new Date().toISOString(),
    source_pdf: 'https://asset.uinjkt.ac.id/uploads/fmXyXwZY/2026/04/kma-ukt-2026.pdf',
    decree: 'KMA 204/2026',
    academic_year: '2026/2027',
    pages: pages.length,
    items: pages.reduce((a, b) => a + b.length, 0),
    extractor: 'unpdf 1.8.1 getTextContent()',
  },
  pages,
};

fs.writeFileSync(OUT, JSON.stringify(payload));
console.log(`pages=${payload._meta.pages} items=${payload._meta.items} -> ${OUT}`);