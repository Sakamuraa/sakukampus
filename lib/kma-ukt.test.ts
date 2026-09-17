import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import {
  parseKma,
  findPtkIn,
  findProdi,
  golonganKeRupiah,
  summarizeUkt,
  splitGolongan,
  nominaisDari,
  normalizeNominalText,
  GOL1_NOMINAL,
} from './kma-ukt';

const fixture = JSON.parse(
  readFileSync(resolve(__dirname, '../data/fixtures/kma-ukt-2026.lines.json'), 'utf8'),
) as { pages: { s: string; x: number; y: number }[][] };

const blocks = parseKma(fixture.pages);
const jakarta = findPtkIn(blocks, 'SYARIF HIDAYATULLAH')!;

describe('normalisasi nominal', () => {
  it('tiga cara penulisan golongan 1 jadi satu nilai', () => {
    expect(normalizeNominalText('0 - 400.000')).toBe('400.000');
    expect(normalizeNominalText('0 – 400.000')).toBe('400.000');
    expect(normalizeNominalText('0-400,000')).toBe('400.000');
  });

  it('koma ribuan jadi titik', () => {
    expect(normalizeNominalText('4,270,000')).toBe('4.270.000');
  });

  it('sel golongan 1 yang dipecah tiga item tetap terbaca', () => {
    // Nyata terjadi di IAIN Bone: "0" "–" "400.000" sebagai tiga item terpisah.
    expect(nominaisDari('0 – 400.000 1.700.000')).toEqual([400_000, 1_700_000]);
  });

  it('tanda pisah kosong tidak menghasilkan nominal palsu', () => {
    expect(nominaisDari('-')).toEqual([]);
    expect(nominaisDari('')).toEqual([]);
  });
});

describe('splitGolongan — posisi kolom tidak pernah bergeser', () => {
  it('memisahkan KIP sebagai golongan 8', () => {
    const { gol, kip } = splitGolongan([400000, 4270000, 4895000, 5150000, 6500000, 7810000, 9000000, 2400000]);
    expect(gol).toHaveLength(7);
    expect(kip).toBe(2_400_000);
  });

  it('golongan 1 yang hilang jadi null, bukan menggeser golongan 2', () => {
    // UIN Imam Bonjol "Sistem Informasi": sel golongan 1 benar-benar tidak ada.
    const { gol } = splitGolongan([1_700_000, 2_100_000, 2_500_000, 3_300_000, 3_700_000, 4_100_000, 2_400_000]);
    expect(gol[0]).toBeNull();
    expect(gol[1]).toBe(1_700_000);
  });

  it('baris parsial (< 7 golongan) tetap tidak ditebak', () => {
    const { gol, kip } = splitGolongan([400000, 1250000, 1550000]);
    expect(gol).toEqual([400000, 1250000, 1550000]);
    expect(kip).toBeNull();
  });
});

describe('parseKma — struktur', () => {
  it('menemukan 58 PTKIN bernomor 1..58 tanpa blok kosong', () => {
    expect(blocks).toHaveLength(58);
    expect(blocks.map((b) => b.kodeNo)).toEqual(Array.from({ length: 58 }, (_, i) => i + 1));
    expect(blocks.every((b) => b.prodi.length > 0)).toBe(true);
  });

  it('nama kampus yang panjang tersambung utuh (yang awalnya terpotong)', () => {
    const byNo = new Map(blocks.map((b) => [b.kodeNo, b.kampus]));
    // Delapan kasus yang tadinya terpotong di tengah jalan.
    expect(byNo.get(2)).toBe('UIN SUNAN KALIJAGA YOGYAKARTA');
    expect(byNo.get(3)).toBe('UIN MAULANA MALIK IBRAHIM MALANG');
    expect(byNo.get(6)).toBe('UIN SULTAN SYARIF KASIM RIAU');
    expect(byNo.get(19)).toBe('UIN PROF. KIAI HAJI SAIFUDDIN ZUHRI PURWOKERTO');
    expect(byNo.get(22)).toBe('UIN K.H. AHMAD SIDDIQ JEMBER');
    expect(byNo.get(26)).toBe('UIN KH ABDURRAHMAN WAHID PEKALONGAN');
    expect(byNo.get(51)).toBe('IAIN SYAIKH ABDURRAHMAN SIDDIK BANGKA BELITUNG');
    expect(byNo.get(54)).toBe('IAIN DATUK LAKSEMANA BENGKALIS');
  });

  it('nama kampus pendek yang memang begitu di dekrit tetap diterima', () => {
    // UIN Mataram / UIN Kudus / IAIN Bone: di KMA namanya memang singkat.
    const byNo = new Map(blocks.map((b) => [b.kodeNo, b.kampus]));
    expect(byNo.get(16)).toBe('UIN MATARAM');
    expect(byNo.get(35)).toBe('UIN KUDUS');
    expect(byNo.get(31)).toBe('IAIN BONE');
  });

  it('nama kampus tidak menelan token nama fakultas', () => {
    for (const b of blocks) {
      expect(b.kampus).not.toMatch(/\bTarbiyah\b|\bKeguruan\b|\bSyariah dan\b|\bFakultas\b/);
    }
  });

  it('ringkasan: 58 PTKIN, >1500 prodi, >1000 golongan lengkap', () => {
    const s = summarizeUkt(blocks);
    expect(s.ptkin).toBe(58);
    expect(s.prodi).toBeGreaterThan(1500);
    expect(s.prodiGolonganLengkap).toBeGreaterThan(1000);
  });

  it('tidak ada prodi duplikat di dalam satu kampus', () => {
    for (const b of blocks) {
      const names = b.prodi.map((p) => p.prodi);
      expect(new Set(names).size).toBe(names.length);
    }
  });

  it('footer halaman tidak pernah jadi fakultas', () => {
    for (const b of blocks) {
      for (const r of b.prodi) {
        expect(r.fakultas ?? '').not.toMatch(/Karo Hukum|KLN|Imam Syaukani|Kamaruddin|Ditjen Pendis|Sekretaris Jenderal/);
      }
    }
  });

  it('seluruh baris dengan 7 golongan punya golongan 1 = Rp400.000', () => {
    const rows = blocks.flatMap((b) => b.prodi).filter((r) => r.gol.length === 7 && r.gol[0] !== null);
    expect(rows.length).toBeGreaterThan(900);
    expect(rows.every((r) => r.gol[0] === GOL1_NOMINAL)).toBe(true);
  });
});

describe('parseKma — golden test UIN Jakarta (KMA 204/2026)', () => {
  it('Teknik Informatika: golongan 2, 7, dan KIP persis dekrit', () => {
    const ti = findProdi(jakarta, 'Teknik Informatika')!;
    expect(ti.gol).toEqual([400_000, 4_270_000, 4_895_000, 5_150_000, 6_500_000, 7_810_000, 9_000_000]);
    expect(ti.kip).toBe(2_400_000);
    expect(ti.fakultas).toBe('Sains dan Teknologi');
  });

  it('Sistem Informasi identik dengan Teknik Informatika', () => {
    expect(findProdi(jakarta, 'Sistem Informasi')!.gol).toEqual([
      400_000, 4_270_000, 4_895_000, 5_150_000, 6_500_000, 7_810_000, 9_000_000,
    ]);
  });

  it('Kedokteran golongan 7 = Rp50.000.000 (tertinggi di UIN Jakarta)', () => {
    expect(findProdi(jakarta, 'Kedokteran')!.gol.at(-1)).toBe(50_000_000);
  });

  it('nama prodi yang terpotong antar-baris disatukan', () => {
    expect(findProdi(jakarta, 'Bimbingan dan Penyuluhan Islam')?.prodi).toBe('Bimbingan dan Penyuluhan Islam');
  });
});

describe('golonganKeRupiah — inti normalisasi §5 plan', () => {
  it('gol4 UIN Jakarta Rp5.150.000 vs UIN Palangkaraya jauh lebih murah', () => {
    const palangkaraya = findPtkIn(blocks, 'PALANGKARAYA')!;
    const jkt4 = golonganKeRupiah(jakarta, 'Teknik Informatika', 4);
    const plk4 = golonganKeRupiah(palangkaraya, palangkaraya.prodi[0].prodi, 4);
    expect(jkt4).toBe(5_150_000);
    expect(plk4).not.toBeNull();
    expect(plk4!).toBeLessThan(jkt4!);
  });

  it('REGRESI §5: golongan sama, kampus berbeda -> rupiah berbeda', () => {
    // Angka nyata dari KMA 204/2026, keduanya prodi Teknik Informatika:
    //   UIN Jakarta  gol2 = Rp4.270.000
    //   UIN Malang   gol2 = Rp1.653.000
    const malang = findPtkIn(blocks, 'MAULANA MALIK')!;
    const ga = golonganKeRupiah(jakarta, 'Teknik Informatika', 2, { exactOnly: true });
    const gb = golonganKeRupiah(malang, 'Teknik Informatika', 2, { exactOnly: true });
    expect(ga).toBe(4_270_000);
    expect(gb).toBe(1_653_000);
    expect(ga).not.toBe(gb);
  });

  it('golongan 8 mengembalikan nominal KIP', () => {
    expect(golonganKeRupiah(jakarta, 'Teknik Informatika', 8)).toBe(2_400_000);
  });

  it('golongan di luar rentang -> null, bukan angka palsu', () => {
    const majene = findPtkIn(blocks, 'MAJENE')!;
    expect(golonganKeRupiah(majene, majene.prodi[0].prodi, 7, { exactOnly: true })).toBeNull();
  });
});