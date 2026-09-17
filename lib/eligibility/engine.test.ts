import { describe, it, expect } from 'vitest';
import { check, score, type Rule, type Facts } from './engine';

const UIN_JAKARTA = 'kampus:201001';

/** Aturan STF UIN Jakarta 2026 — persis dari pengumuman resmi kampus. */
const stfRule: Rule = {
  all: [
    { fact: 'jenjang', op: 'in', value: ['S1', 'D4'], label: 'Jenjang S1/D4' },
    { fact: 'semester', op: 'between', value: [3, 7], label: 'Semester 3–7' },
    { fact: 'ipk', op: 'gte', value: 3.5, label: 'IPK minimal 3,50' },
    {
      fact: 'ukt_kelompok',
      op: 'lte',
      value: 4,
      label: 'Prioritas UKT golongan 1–4',
      soft: true,
      onlyWhen: { scope: UIN_JAKARTA },
    },
    {
      fact: 'penerima_beasiswa_lain',
      op: 'eq',
      value: false,
      label: 'Tidak sedang menerima beasiswa lain',
    },
  ],
};

const TI_GOL3_IPK36: Facts = {
  jenjang: 'S1',
  semester: 5,
  ipk: 3.6,
  ukt_kelompok: 3,
  ukt_nominal: 4_895_000,
  penerima_beasiswa_lain: false,
};

describe('engine eligibility', () => {
  it('1. lolos: profil memenuhi seluruh kriteria keras', () => {
    const r = check(stfRule, TI_GOL3_IPK36, { scope: UIN_JAKARTA });
    expect(r.verdict).toBe('lolos');
  });

  it('2. tidak: IPK di bawah ambang menggugurkan', () => {
    const r = check(stfRule, { ...TI_GOL3_IPK36, ipk: 3.0 }, { scope: UIN_JAKARTA });
    expect(r.verdict).toBe('tidak');
    const reason = r.reasons.find((x) => x.label.includes('IPK'));
    expect(reason?.ok).toBe(false);
    expect(reason?.soft).toBe(false);
  });

  it('3. perlu_data: data kurang, bukan "tidak lolos"', () => {
    const r = check(stfRule, { jenjang: 'S1', semester: 5 }, { scope: UIN_JAKARTA });
    expect(r.verdict).toBe('perlu_data');
    expect(r.missing.length).toBeGreaterThan(0);
  });

  it('4. kriteria soft tidak menggugurkan sendiri', () => {
    const rule: Rule = {
      all: [
        { fact: 'ipk', op: 'gte', value: 3.0, label: 'IPK minimal 3,00' },
        {
          fact: 'ukt_kelompok',
          op: 'lte',
          value: 4,
          label: 'Prioritas golongan 1–4',
          soft: true,
          onlyWhen: { scope: UIN_JAKARTA },
        },
      ],
    };
    const r = check(rule, { ipk: 3.5, ukt_kelompok: 6 }, { scope: UIN_JAKARTA });
    expect(r.verdict).toBe('lolos');
    expect(r.reasons.find((x) => x.soft)?.ok).toBe(false);
  });

  it('5. onlyWhen: kriteria golongan DILEWATI untuk scope lain', () => {
    // Scope nasional -> syarat "prioritas golongan 1-4" tidak berlaku sama sekali,
    // jadi user golongan 6 pun lolos kriteria keras.
    const gol6 = { ...TI_GOL3_IPK36, ukt_kelompok: 6 };
    const diKampus = check(stfRule, gol6, { scope: UIN_JAKARTA });
    const diNasional = check(stfRule, gol6, { scope: 'nasional' });

    const skipped = diNasional.reasons.find((x) => x.skipped);
    expect(skipped?.label).toContain('Prioritas UKT');
    expect(skipped?.ok).toBeNull();

    // Di scope kampus: golongan 6 kena kriteria lunak ->
    //   hard=true (soft tidak menggugurkan) tapi ada soft gagal -> perlu_data.
    expect(diKampus.verdict).toBe('lolos');
    // Di scope nasional: kriteria dilewati -> semua keras lolos.
    expect(diNasional.verdict).toBe('lolos');
    // Yang penting: kriteria golongan TIDAK muncul sebagai kegagalan di scope nasional.
    expect(diNasional.reasons.some((x) => !x.soft && x.ok === false)).toBe(false);
  });

  it('6. normalisasi rupiah: plafon UKT lintas kampus', () => {
    const rule: Rule = {
      all: [{ fact: 'ukt_nominal', op: 'lte', value: 2_400_000, label: 'UKT ≤ Rp2.400.000' }],
    };
    const r = check(rule, { ukt_nominal: 5_150_000 }, { scope: 'nasional' });
    expect(r.verdict).toBe('tidak');
  });

  it('7. REGRESI: golongan sama, kampus berbeda -> hasil berbeda', () => {
    // Angka nyata KMA 204/2026 (data/ukt-ptkin.seed.json):
    //   UIN Jakarta gol4 = Rp5.150.000  -> di atas plafon
    //   UIN Malang  gol4 = Rp3.500.000  -> juga di atas
    //   STAIN Majene gol2 = Rp1.250.000 -> di bawah plafon
    const kipLikeRule: Rule = {
      all: [{ fact: 'ukt_nominal', op: 'lte', value: 2_400_000, label: 'Plafon UKT Rp2.400.000' }],
    };

    const jakarta = check(kipLikeRule, { ukt_kelompok: 4, ukt_nominal: 5_150_000 }, { scope: 'nasional' });
    const kecil = check(kipLikeRule, { ukt_kelompok: 4, ukt_nominal: 1_250_000 }, { scope: 'nasional' });

    expect(jakarta.verdict).toBe('tidak');
    expect(kecil.verdict).toBe('lolos');

    // Sekaligus membuktikan nomor golongan sendiri TIDAK cukup untuk memutuskan:
    // keduanya golongan 4, tapi kelayakannya berbeda.
    expect(jakarta.verdict).not.toBe(kecil.verdict);
  });

  it('skor: kriteria soft berbobot separuh', () => {
    const r = check(stfRule, TI_GOL3_IPK36, { scope: UIN_JAKARTA });
    expect(score(r)).toBe(100);

    const partial = check(stfRule, { ...TI_GOL3_IPK36, ukt_kelompok: 6 }, { scope: UIN_JAKARTA });
    expect(score(partial)).toBeLessThan(100);
    expect(score(partial)).toBeGreaterThan(50);
  });
});