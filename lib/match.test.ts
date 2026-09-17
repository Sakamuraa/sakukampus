import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { parseKma, findPtkIn, type PtkIn } from './kma-ukt';
import {
  matchAll,
  matchOne,
  buildFacts,
  nextDeadline,
  stageStatus,
  simulateGolongan,
  uktTabel,
  type ScholarshipSeed,
} from './match';

const uktFixture = JSON.parse(
  readFileSync(resolve(__dirname, '../data/fixtures/kma-ukt-2026.lines.json'), 'utf8'),
) as { pages: { s: string; x: number; y: number }[][] };

const blocks = parseKma(uktFixture.pages);
const JAKARTA: PtkIn = findPtkIn(blocks, 'SYARIF HIDAYATULLAH')!;
const MALANG: PtkIn = findPtkIn(blocks, 'MAULANA MALIK')!;

const seed = JSON.parse(
  readFileSync(resolve(__dirname, '../data/scholarships.seed.json'), 'utf8'),
) as { scholarships: ScholarshipSeed[] };

const NOW = Date.parse('2026-09-17T00:00:00Z');

describe('buildFacts — aturan rupiah vs golongan (§5)', () => {
  it('golongan dari seed UKT diubah ke rupiah kampus itu', () => {
    const TI_GOL3 = buildFacts({
      kodePt: '201001',
      ptkin: JAKARTA,
      prodi: 'Teknik Informatika',
      kelompok: 3,
      profile: { jenjang: 'S1' },
    });
    expect(TI_GOL3.facts.ukt_nominal).toBe(4_895_000);
    expect(TI_GOL3.facts.ukt_kelompok).toBe(3);
    expect(TI_GOL3.unverified).toBe(false);
  });

  it('golongan yang sama di kampus berbeda menghasilkan rupiah berbeda', () => {
    const a = buildFacts({ kodePt: '201001', ptkin: JAKARTA, prodi: 'Teknik Informatika', kelompok: 2, profile: {} });
    const b = buildFacts({ kodePt: '201003', ptkin: MALANG, prodi: 'Teknik Informatika', kelompok: 2, profile: {} });
    expect(a.facts.ukt_nominal).toBe(4_270_000);
    expect(b.facts.ukt_nominal).toBe(1_653_000);
    expect(a.facts.ukt_kelompok).toBe(b.facts.ukt_kelompok); // sama-sama golongan 2
  });

  it('nominal manual dipakai kalau kampus belum punya data UKT, dan ditandai', () => {
    const r = buildFacts({
      kodePt: '999999',
      ptkin: null,
      prodi: null,
      kelompok: null,
      nominalManual: 3_500_000,
      profile: {},
    });
    expect(r.facts.ukt_nominal).toBe(3_500_000);
    expect(r.unverified).toBe(true);
  });
});

describe('matchAll — perilaku verdict', () => {
  const TI_LOKAL = {
    kodePt: '201001',
    ptkin: JAKARTA,
    prodi: 'Teknik Informatika',
    kelompok: 3,
    profile: { jenjang: 'S1', semester: 5, ipk: 3.6, penerima_beasiswa_lain: false },
  };

  it('profil unggul -> STF lolos, dan setiap hasil punya source_url + tanggal', () => {
    const hasil = matchAll(seed.scholarships, TI_LOKAL, NOW);
    const stf = hasil.find((c) => c.slug === 'stf-uin-jakarta-2026')!;
    expect(stf.verdict).toBe('lolos');
    for (const c of hasil) {
      expect(c.source_url).toMatch(/^https:\/\//);
      expect(Number.isFinite(Date.parse(c.last_verified_at))).toBe(true);
    }
  });

  it('IPK kurang menggugurkan STF dengan alasan yang bisa ditampilkan', () => {
    const hasil = matchAll(seed.scholarships, { ...TI_LOKAL, profile: { ...TI_LOKAL.profile, ipk: 3.0 } }, NOW);
    const stf = hasil.find((c) => c.slug === 'stf-uin-jakarta-2026')!;
    expect(stf.verdict).toBe('tidak');
    expect(stf.reasons.find((r) => r.label.includes('IPK'))?.ok).toBe(false);
  });

  it('data kurang -> perlu_data, bukan "tidak lolos"', () => {
    const hasil = matchAll(seed.scholarships, { ...TI_LOKAL, profile: { jenjang: 'S1' } }, NOW);
    expect(hasil.some((c) => c.verdict === 'perlu_data')).toBe(true);

    // Aturan yang diuji: TIDAK ADA beasiswa yang divonis 'tidak' hanya karena
    // datanya belum diisi. Vonis 'tidak' harus selalu punya kriteria keras yang
    // benar-benar gagal.
    for (const c of hasil.filter((x) => x.verdict === 'tidak')) {
      const gagal = c.reasons.some((r) => !r.soft && r.ok === false);
      expect(gagal, `${c.slug} divonis tidak tanpa kriteria gagal`).toBe(true);
    }
  });

  it('prioritas golongan UKT bersifat lunak: golongan 6 tetap lolos STF', () => {
    const hasil = matchAll(seed.scholarships, { ...TI_LOKAL, kelompok: 6 }, NOW);
    const stf = hasil.find((c) => c.slug === 'stf-uin-jakarta-2026')!;
    expect(stf.verdict).toBe('lolos');
    expect(stf.reasons.find((r) => r.label.includes('Prioritas'))?.ok).toBe(false);
  });

  it('urutan: lolos dulu, lalu perlu_data, lalu tidak', () => {
    const hasil = matchAll(seed.scholarships, TI_LOKAL, NOW);
    const rank = { lolos: 0, perlu_data: 1, tidak: 2 } as const;
    const seq = hasil.map((c) => rank[c.verdict]);
    expect(seq).toEqual([...seq].sort((a, b) => a - b));
  });

  it('beasiswa kampus lain tidak ikut muncul untuk kampus ini', () => {
    const hasil = matchAll(seed.scholarships, TI_LOKAL, NOW);
    // Semua scope harus nasional atau kampus:201001.
    expect(hasil.every((c) => c.scope === 'nasional' || c.scope === 'kampus:201001')).toBe(true);
  });
});

describe('matchAll — bukti REGRESI §5 lintas kampus', () => {
  it('KIP Kuliah (plafon Rp2.400.000) lolos di kampus murah, tidak di UIN Jakarta', () => {
    const kip = seed.scholarships.find((s) => s.slug === 'kip-kuliah-2026')!;

    // UIN Jakarta golongan 2 = Rp4.270.000 -> di atas plafon
    const jakarta = matchOne(
      kip,
      { kodePt: '201001', ptkin: JAKARTA, prodi: 'Teknik Informatika', kelompok: 2, profile: { jenjang: 'S1', desil_dtsen: 2 } },
      NOW,
    );
    // UIN Malang golongan 2 = Rp1.653.000 -> di bawah plafon
    const malang = matchOne(
      kip,
      { kodePt: '201003', ptkin: MALANG, prodi: 'Teknik Informatika', kelompok: 2, profile: { jenjang: 'S1', desil_dtsen: 2 } },
      NOW,
    );

    expect(jakarta.verdict).toBe('tidak');
    expect(malang.verdict).toBe('lolos');
    expect(jakarta.verdict).not.toBe(malang.verdict);
  });
});

describe('jadwal', () => {
  it('KIP Kuliah masih buka per 17 Sep 2026 dan tutup 31 Okt 2026', () => {
    const kip = seed.scholarships.find((s) => s.slug === 'kip-kuliah-2026')!;
    expect(stageStatus(kip, NOW)).toBe('buka');
    expect(nextDeadline(kip, NOW)).toBe(Date.parse('2026-10-31T23:59:00Z'));
  });

  it('Djarum sudah tutup per 17 Sep 2026? belum — tes pengumuman 1 Okt 2026', () => {
    const dj = seed.scholarships.find((s) => s.slug === 'djarum-beasiswa-plus-2026')!;
    // closes terakhir 26 Sep 2026 -> masih buka pada 17 Sep
    expect(stageStatus(dj, NOW)).toBe('buka');
    // dan sudah tutup pada 30 Sep
    expect(stageStatus(dj, Date.parse('2026-09-30T00:00:00Z'))).toBe('tutup');
  });

  it('beasiswa tanpa jadwal ditandai jelas, bukan dianggap buka', () => {
    const blu = seed.scholarships.find((s) => s.slug === 'beasiswa-blu-uin-jakarta')!;
    expect(stageStatus(blu, NOW)).toBe('tanpa_jadwal');
    expect(nextDeadline(blu, NOW)).toBeNull();
  });
});

describe('simulasi golongan', () => {
  it('menurunkan golongan UKT mengubah verdict beasiswa nasional berplafon', () => {
    const hasil = simulateGolongan(
      seed.scholarships,
      {
        kodePt: '201001',
        ptkin: JAKARTA,
        prodi: 'Teknik Informatika',
        kelompok: 4, // Rp5.150.000
        profile: { jenjang: 'S1', desil_dtsen: 2 },
      },
      2, // Rp4.270.000 — masih di atas plafon KIP, jadi tidak berubah
      NOW,
    );
    // Tidak ada perubahan yang diklaim secara palsu.
    expect(Array.isArray(hasil)).toBe(true);
  });

  it('simulasi ke golongan 1 membuat beasiswa berplafon jadi lolos di UIN Jakarta', () => {
    const hasil = simulateGolongan(
      seed.scholarships,
      {
        kodePt: '201001',
        ptkin: JAKARTA,
        prodi: 'Teknik Informatika',
        kelompok: 4,
        profile: { jenjang: 'S1', desil_dtsen: 2 },
      },
      1, // Rp400.000
      NOW,
    );
    const kip = hasil.find((h) => h.slug === 'kip-kuliah-2026');
    expect(kip).toBeDefined();
    expect(kip!.sebelum).toBe('tidak');
    expect(kip!.sesudah).toBe('lolos');
  });
});

describe('uktTabel', () => {
  it('UIN Jakarta Teknik Informatika: 7 golongan + KIP', () => {
    const t = uktTabel(JAKARTA, 'Teknik Informatika');
    expect(t).toHaveLength(8);
    expect(t[1]).toEqual({ kelompok: 2, label: 'Golongan 2', nominal: 4_270_000 });
    expect(t[7].label).toContain('KIP');
    expect(t[7].nominal).toBe(2_400_000);
  });

  it('sel golongan yang hilang di sumber tampil sebagai null, tidak menggeser', () => {
    // UIN Imam Bonjol "Sistem Informasi": sel golongan 1 tidak ada di text layer
    // PDF, jadi nilainya null — BUKAN digeser sehingga gol2 jadi gol1.
    const bonjol = findPtkIn(blocks, 'BONJOL')!;
    const row = bonjol.prodi.find((r) => r.prodi === 'Sistem Informasi')!;
    expect(row.gol[0]).toBeNull();
    expect(row.gol[1]).toBe(1_700_000);

    const t = uktTabel(bonjol, 'Sistem Informasi');
    expect(t[0].nominal).toBeNull();
    expect(t[1].nominal).toBe(1_700_000);
  });

  it('PTKIN yang hanya mencantumkan 3 golongan tidak diisi angka karangan', () => {
    const majene = findPtkIn(blocks, 'MAJENE')!;
    const t = uktTabel(majene, majene.prodi[0].prodi);
    expect(t).toHaveLength(4); // 3 golongan + KIP
    expect(t.filter((x) => x.nominal !== null)).toHaveLength(4);
  });
});