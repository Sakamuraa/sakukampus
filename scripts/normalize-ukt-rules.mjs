/**
 * Ubah syarat UKT dalam nomor golongan -> plafon RUPIAH, untuk beasiswa
 * LINTAS KAMPUS. Ini implementasi aturan §5: nomor golongan tidak sebanding
 * antar kampus (gol2 UIN Malang Rp1.653.000 vs UIN Jakarta Rp4.270.000), jadi
 * beasiswa nasional tidak boleh membandingkan nomor golongan.
 *
 * Jalankan: node --experimental-strip-types scripts/normalize-ukt-rules.mjs
 *
 * Aturan:
 *  - scope === 'kampus:<kode>'  -> nomor golongan SAH dipakai apa adanya.
 *  - scope === 'nasional'       -> ukt_max_golongan DILARANG; kalau ada,
 *                                  dikonversi ke ukt_max_idr memakai nominal
 *                                  kampus yang paling tinggi (konservatif:
 *                                  jangan sampai mengklaim orang layak padahal
 *                                  di kampusnya UKT-nya lebih tinggi).
 */
import fs from 'node:fs';

const SCH = 'data/scholarships.seed.json';
const UKT = 'data/ukt-ptkin.seed.json';

const sch = JSON.parse(fs.readFileSync(SCH, 'utf8'));
const ukt = JSON.parse(fs.readFileSync(UKT, 'utf8'));

/** Nominal golongan N untuk satu kampus: ambil yang TERTINGGI di kampus itu. */
function maxNominalGolongan(kelompok) {
  let max = 0;
  for (const block of ukt.ptkin) {
    for (const row of block.prodi) {
      const v = row.gol[kelompok - 1];
      if (typeof v === 'number' && v > max) max = v;
    }
  }
  return max;
}

let converted = 0;
for (const s of sch.scholarships) {
  const national = s.scope === 'nasional';
  if (!national) continue;

  if (typeof s.ukt_max_golongan === 'number') {
    const nominal = maxNominalGolongan(s.ukt_max_golongan);
    s.ukt_max_idr = nominal;
    s.ukt_normalized_from = { golongan: s.ukt_max_golongan, basis: 'nominal tertinggi di seluruh PTKIN' };
    delete s.ukt_max_golongan; // DILARANG dipakai untuk beasiswa nasional
    converted++;
  }
}

sch._meta.normalized_at = new Date().toISOString();
sch._meta.normalized_count = converted;
fs.writeFileSync(SCH, JSON.stringify(sch, null, 2));

console.log(`dikonversi: ${converted}`);
for (const s of sch.scholarships) {
  const tag = s.scope === 'nasional' ? `idr=${s.ukt_max_idr ?? '-'}` : `gol<=${s.ukt_max_golongan ?? '-'}`;
  console.log(`  ${s.scope.padEnd(16)} ${tag.padEnd(14)} ${s.slug}`);
}

// Pemeriksaan penutup: beasiswa nasional tidak boleh menyisakan nomor golongan.
const bad = sch.scholarships.filter((s) => s.scope === 'nasional' && s.ukt_max_golongan !== undefined);
if (bad.length) {
  console.error('GAGAL: masih ada beasiswa nasional bersyarat nomor golongan:', bad.map((s) => s.slug));
  process.exit(1);
}
console.log('OK: nol beasiswa nasional memakai nomor golongan.');