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

  it('skips scholarships with requirements the eligibility engine cannot represent', () => {
    const { page, item } = fixture();
    item.unsupported_requirements = ['Wajib mengunggah esai dengan tema tertentu'];

    expect(() => validateExtractedItem(item, page, [], now)).toThrow(
      'Ada syarat yang belum dapat dipetakan ke pemeriksa kelayakan.',
    );
  });
});
