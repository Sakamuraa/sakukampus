import { describe, expect, it } from 'vitest';
import {
  validateExtractedItem,
  type ExtractedItem,
  type SourcePage,
} from './scholarship-discovery';

const now = new Date('2026-11-19T00:00:00.000Z');

function fixture() {
  const page: SourcePage = {
    url: 'https://beasiswa.example.org/afirmasi-2027',
    title: 'Beasiswa Afirmasi 2027',
    description: 'Program untuk mahasiswa aktif.',
    text: [
      'Program Beasiswa Afirmasi 2027 diterbitkan oleh Yayasan Pendidikan Indonesia.',
      'Program menyediakan bantuan pendidikan sebesar Rp5.000.000.',
      'Program ini tersedia untuk mahasiswa aktif jenjang S1.',
      'Pendaftaran dibuka 1 Januari 2027 dan ditutup 31 Januari 2027.',
      'Syarat pendaftar adalah mahasiswa aktif jenjang S1.',
    ].join(' '),
    links: ['https://beasiswa.example.org/daftar'],
    detailLinks: [],
    contentHash: 'page-hash',
  };
  const item: ExtractedItem = {
    source_url: page.url,
    official_source: true,
    official_evidence: 'Program Beasiswa Afirmasi 2027 diterbitkan oleh Yayasan Pendidikan Indonesia.',
    is_duplicate: false,
    unsupported_requirements: [],
    confidence: 96,
    scholarship: {
      name: 'Beasiswa Afirmasi 2027',
      provider: 'Yayasan Pendidikan Indonesia',
      tier: 'swasta',
      scope: 'nasional',
      coverage: 'partial',
      benefit_summary: 'Bantuan pendidikan sebesar Rp5.000.000.',
      jenjang: ['S1'],
      url_pendaftaran: 'https://beasiswa.example.org/daftar',
      academic_year: '2027',
      stages: [
        {
          name: 'pendaftaran',
          opens_at: '2027-01-01T00:00:00Z',
          closes_at: '2027-01-31T23:59:00Z',
        },
      ],
      rule: {
        all: [
          {
            fact: 'jenjang',
            op: 'in',
            value: ['S1'],
            label: 'Mahasiswa aktif S1',
          },
        ],
      },
    },
    evidence: {
      name: 'Program Beasiswa Afirmasi 2027 diterbitkan oleh Yayasan Pendidikan Indonesia.',
      provider: 'Yayasan Pendidikan Indonesia.',
      benefit_summary: 'Program menyediakan bantuan pendidikan sebesar Rp5.000.000.',
      jenjang: 'Program ini tersedia untuk mahasiswa aktif jenjang S1.',
      requirements: [
        {
          label: 'Mahasiswa aktif S1',
          quote: 'Syarat pendaftar adalah mahasiswa aktif jenjang S1.',
        },
      ],
      stages: [
        {
          name: 'pendaftaran',
          quote: 'Pendaftaran dibuka 1 Januari 2027 dan ditutup 31 Januari 2027.',
        },
      ],
    },
  };

  return { page, item };
}

describe('automated scholarship verification', () => {
  it('accepts a current-cycle scholarship only when its required facts have source quotes', () => {
    const { page, item } = fixture();

    const result = validateExtractedItem(item, page, [], now);

    expect(result.scholarship.source_kind).toBe('resmi');
    expect(result.scholarship.confidence).toBe(96);
    expect(result.scholarship.scope).toBe('nasional');
    expect(result.scholarship.last_verified_at).toBe(now.toISOString());
  });

  it('rejects a fabricated quote even when the model reports high confidence', () => {
    const { page, item } = fixture();
    item.evidence.benefit_summary = 'Memberikan beasiswa penuh hingga lulus.';

    expect(() => validateExtractedItem(item, page, [], now)).toThrow(
      'Kutipan verifikasi tidak ditemukan persis di halaman sumber.',
    );
  });

  it('rejects national scholarships whose eligibility rule uses campus UKT groups', () => {
    const { page, item } = fixture();
    item.scholarship.rule = {
      all: [
        {
          fact: 'ukt_kelompok',
          op: 'lte',
          value: 4,
          label: 'Golongan UKT maksimal 4',
        },
      ],
    };
    item.evidence.requirements = [
      {
        label: 'Golongan UKT maksimal 4',
        quote: 'Syarat pendaftar adalah mahasiswa aktif jenjang S1.',
      },
    ];

    expect(() => validateExtractedItem(item, page, [], now)).toThrow(
      'Syarat kelayakan tidak valid atau melanggar aturan UKT.',
    );
  });

  it('keeps scholarships whose extra requirements the engine cannot check, as notes', () => {
    const { page, item } = fixture();
    item.unsupported_requirements = ['Wajib mengunggah esai dengan tema tertentu'];

    const { scholarship } = validateExtractedItem(item, page, [], now);
    expect(scholarship.catatan).toEqual(['Wajib mengunggah esai dengan tema tertentu']);
  });

  it('rejects a malformed unsupported_requirements field', () => {
    const { page, item } = fixture();
    (item as unknown as { unsupported_requirements: unknown }).unsupported_requirements = 'bukan array';

    expect(() => validateExtractedItem(item, page, [], now)).toThrow(
      'Daftar syarat yang belum dapat dipetakan tidak valid.',
    );
  });

  it('maps stage names written as page prose onto the known stage vocabulary', () => {
    const { page, item } = fixture();
    page.text += ' Assessment Online digelar 5 Februari 2027.';
    item.scholarship.stages = [
      { name: 'Pendaftaran', opens_at: '2027-01-01T00:00:00Z', closes_at: '2027-01-31T23:59:00Z' },
      { name: 'Assessment Online', opens_at: '2027-02-05T00:00:00Z', closes_at: '2027-02-05T00:00:00Z' },
    ];
    item.evidence.stages = [
      { name: 'Pendaftaran', quote: 'Pendaftaran dibuka 1 Januari 2027 dan ditutup 31 Januari 2027.' },
      { name: 'Assessment Online', quote: 'Assessment Online digelar 5 Februari 2027.' },
    ];

    const { scholarship } = validateExtractedItem(item, page, [], now);
    expect(scholarship.stages.map((stage) => stage.name)).toEqual(['pendaftaran', 'tes_online']);
  });

  it('rejects a stage name that maps to nothing', () => {
    const { page, item } = fixture();
    item.scholarship.stages = [
      { name: 'Pendaftaran', opens_at: '2027-01-01T00:00:00Z', closes_at: '2027-01-31T23:59:00Z' },
      { name: 'Kopdar Alumni', opens_at: '2027-02-05T00:00:00Z', closes_at: '2027-02-05T00:00:00Z' },
    ];
    item.evidence.stages = [
      { name: 'Pendaftaran', quote: 'Pendaftaran dibuka 1 Januari 2027 dan ditutup 31 Januari 2027.' },
      { name: 'Kopdar Alumni', quote: 'Pendaftaran dibuka 1 Januari 2027 dan ditutup 31 Januari 2027.' },
    ];

    expect(() => validateExtractedItem(item, page, [], now)).toThrow(
      'Nama atau tanggal tahap tidak didukung.',
    );
  });

  it('matches evidence quotes across typographic punctuation', () => {
    const { page, item } = fixture();
    page.text = page.text.replace(
      'Syarat pendaftar adalah mahasiswa aktif jenjang S1.',
      'Syarat pendaftar adalah mahasiswa aktif jenjang S1 \u2014 belum menikah \u2018dan\u2019 tidak bekerja.',
    );
    item.evidence.requirements[0].quote =
      "Syarat pendaftar adalah mahasiswa aktif jenjang S1 - belum menikah 'dan' tidak bekerja.";

    const { scholarship } = validateExtractedItem(item, page, [], now);
    expect(scholarship.name).toBe('Beasiswa Afirmasi 2027');
  });

  it('does not repeat the academic year in the slug when the name already carries it', () => {
    const { page, item } = fixture();
    item.scholarship.name = 'Beasiswa Afirmasi 2027';
    item.scholarship.academic_year = '2027';
    item.evidence.name = 'Program Beasiswa Afirmasi 2027 diterbitkan oleh Yayasan Pendidikan Indonesia.';

    const { scholarship } = validateExtractedItem(item, page, [], now);
    expect(scholarship.slug).toBe('beasiswa-afirmasi-2027');
  });
});
