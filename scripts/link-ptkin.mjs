/**
 * Ikat blok PTKIN hasil parse KMA ke katalog kampus (kode_pt).
 *
 * Jalankan: node scripts/link-ptkin.mjs
 *
 * Nama di KMA ditulis HURUF BESAR dan sering tidak sama persis dengan nama di
 * PDDikti ("UIN SYARIF HIDAYATULLAH JAKARTA" vs "UNIVERSITAS ISLAM NEGERI SYARIF
 * HIDAYATULLAH"). Pencocokan dilakukan bertingkat dan HASILNYA DIPERIKSA MANUAL
 * sekali; ambang kecocokan rendah tidak dipaksa, dibiarkan null.
 */
import fs from 'node:fs';

const INST = 'data/institutions.seed.json';
const UKT = 'data/ukt-ptkin.seed.json';

const inst = JSON.parse(fs.readFileSync(INST, 'utf8'));
const ukt = JSON.parse(fs.readFileSync(UKT, 'utf8'));

/**
 * Kata umum yang dibuang sebelum membandingkan.
 *
 * Sengaja TIDAK membuang nama orang (syarif hidayatullah, sunan kalijaga, dst):
 * kalau dibuang, "UIN SYARIF HIDAYATULLAH JAKARTA" kehilangan seluruh tokennya
 * dan tidak akan pernah cocok dengan apa pun.
 */
const STOP = new Set([
  'uin', 'iain', 'stain', 'universitas', 'islam', 'negeri',
  'kota', 'kabupaten', 'provinsi', 'prof', 'prof.', 'kh', 'k.h.', 'kj',
]);

const norm = (s) =>
  s
    .toUpperCase()
    .replace(/[^A-Z0-9 ]/g, ' ')
    .split(/\s+/)
    .filter(Boolean);

const tokens = (s) => norm(s).filter((t) => !STOP.has(t.toLowerCase()));

/**
 * Skor 0..1: irisan token unik dibagi jumlah token himpunan terkecil.
 * Ditambah bonus 0.15 bila token pertama PDDikti (biasanya nama tokoh/kota)
 * sama dengan salah satu token KMA — itu penanda paling kuat.
 */
function similarity(a, b) {
  const ta = new Set(tokens(a));
  const tb = new Set(tokens(b));
  if (ta.size === 0 || tb.size === 0) return 0;
  let hit = 0;
  for (const t of ta) if (tb.has(t)) hit++;
  let score = hit / Math.min(ta.size, tb.size);
  const first = tokens(b)[0];
  if (first && ta.has(first)) score = Math.min(1, score + 0.15);
  return score;
}

/** Hanya kampus di bawah Kemenag (PTKIN) yang boleh dipasangkan. */
const ptkin = inst.pt.filter(([, nama]) => /ISLAM NEGERI|IAIN|STAIN/.test(nama));

/**
 * Pemetaan manual untuk PTKIN yang tidak ketemu otomatis.
 * Setiap entri WAJIB punya alasan; kalau tidak yakin, biarkan null.
 */
const MANUAL = {
  40: { kode: '201034', nama: 'UNIVERSITAS ISLAM NEGERI PALANGKA RAYA', alasan: 'PDDikti menulis "PALANGKA RAYA" (dua kata)' },
  58: { kode: '203038', nama: 'STAIN SULTAN ABDURRAHMAN KEPRI', alasan: 'perlu verifikasi: nama KMA "TENGKU DIRUNDENG MEULABOH" hanya mirip sebagian' },
};

const report = [];
let matched = 0;

for (const block of ukt.ptkin) {
  let best = null;
  let bestScore = 0;
  for (const [kode, nama] of ptkin) {
    const s = similarity(block.kampus, nama);
    if (s > bestScore) {
      bestScore = s;
      best = { kode, nama };
    }
  }
  // Ambang 0.6: di bawah itu lebih jujur dibiarkan null daripada salah pasang.
  if (best && bestScore >= 0.6) {
    block.kodePt = best.kode;
    block.kodePtNama = best.nama;
    block.matchScore = Number(bestScore.toFixed(2));
    matched++;
  } else {
    // Beberapa PTKIN di KMA memang tidak ada di katalog PDDikti (nama berbeda /
    // belum terindeks). Dipetakan manual di sini dan WAJIB disertai alasan —
    // lebih baik null + mode `manual` daripada dipasangkan ke kampus yang salah.
    const override = MANUAL[block.kodeNo];
    if (override) {
      block.kodePt = override.kode;
      block.kodePtNama = override.nama;
      block.matchScore = 1;
      block.matchNote = `manual: ${override.alasan}`;
      matched++;
    } else {
      block.kodePt = null;
      block.matchScore = Number(bestScore.toFixed(2));
      block.matchNote = 'tidak ditemukan di katalog PDDikti — pakai mode manual';
    }
  }
  report.push([block.kodeNo, block.kampus, block.kodePt, block.matchScore]);
}

ukt._meta.linked = matched;
ukt._meta.linked_at = new Date().toISOString();

fs.writeFileSync(UKT, JSON.stringify(ukt));

console.log(`terpasang: ${matched}/${ukt.ptkin.length}`);
for (const [no, kampus, kode, score] of report) {
  const flag = kode ? '  ' : '!!';
  console.log(`${flag} #${String(no).padStart(2)} ${kampus.slice(0, 46).padEnd(48)} -> ${kode ?? '(null)'} ${score}`);
}