/**
 * Tambah katalog beasiswa dari sumber yang sudah diverifikasi.
 *
 * Sekaligus merapikan slug ganda yang terlanjur masuk lewat
 * scripts/add-scholarships.mjs (bright-scholarship-2026 dan
 * djarum-beasiswa-plus-2026 masing-masing muncul dua kali).
 *
 * Jalankan: node scripts/add-more-scholarships.mjs
 */
import fs from 'node:fs';

const SEED_PATH = 'data/scholarships.seed.json';
const VERIFIED_AT = '2026-10-29T00:00:00Z';

const seed = JSON.parse(fs.readFileSync(SEED_PATH, 'utf8'));
const initialCount = seed.scholarships.length;

/**
 * Gabungkan dua entri dengan slug sama. Entri dengan tahapan paling lengkap
 * dipakai sebagai sumber utama (tes jadwal Djarum bergantung pada 5 tahap),
 * lalu field yang kosong diisi dari entri satunya.
 */
function mergeDuplicate(a, b) {
  const primary = (b.stages?.length ?? 0) > (a.stages?.length ?? 0) ? b : a;
  const secondary = primary === a ? b : a;
  const out = { ...secondary, ...primary };

  for (const key of [
    'coverage',
    'benefit_summary',
    'ukt_max_idr',
    'ukt_max_golongan',
    'ukt_scope_note',
    'needs_test',
    'academic_year',
    'url_pendaftaran',
    'source_kind',
    'confidence',
    'last_verified_at',
  ]) {
    if (out[key] === undefined || out[key] === null) out[key] = secondary[key];
  }

  out.stages = primary.stages ?? secondary.stages ?? [];
  out.rule = primary.rule ?? secondary.rule;
  return out;
}

const bySlug = new Map();
for (const s of seed.scholarships) {
  const prev = bySlug.get(s.slug);
  bySlug.set(s.slug, prev ? mergeDuplicate(prev, s) : s);
}

const additions = [
  {
    slug: 'beasiswa-unggulan-2026',
    name: 'Beasiswa Unggulan 2026',
    provider: 'Kementerian Pendidikan Dasar dan Menengah',
    tier: 'pemerintah',
    scope: 'nasional',
    coverage: 'ukt_penuh+allowance',
    benefit_summary:
      'Pembiayaan UKT, biaya hidup, dan biaya buku untuk masyarakat berprestasi jenjang S1/S2/S3 di perguruan tinggi dalam dan luar negeri',
    jenjang: ['S1', 'S2', 'S3'],
    url_pendaftaran: 'https://beasiswaunggulan.kemendikdasmen.go.id/',
    source_url: 'https://beasiswaunggulan.kemendikdasmen.go.id/',
    source_kind: 'resmi',
    confidence: 92,
    last_verified_at: VERIFIED_AT,
    needs_test: true,
    academic_year: '2026',
    stages: [
      {
        name: 'pendaftaran',
        opens_at: '2026-08-20T00:00:00Z',
        closes_at: '2026-08-24T23:59:00Z',
      },
    ],
    rule: {
      all: [
        {
          fact: 'jenjang',
          op: 'in',
          value: ['S1', 'S2', 'S3'],
          label: 'Jenjang S1/S2/S3',
        },
        {
          fact: 'penerima_beasiswa_lain',
          op: 'eq',
          value: false,
          label: 'Tidak sedang menerima beasiswa lain',
        },
      ],
    },
  },
  {
    slug: 'beasiswa-pendidikan-indonesia-2026',
    name: 'Beasiswa Pendidikan Indonesia (BPI) 2026',
    provider: 'Kementerian Pendidikan Tinggi, Sains, dan Teknologi × LPDP',
    tier: 'pemerintah',
    scope: 'nasional',
    coverage: 'ukt_penuh+allowance',
    benefit_summary:
      'Biaya pendidikan penuh, biaya hidup bulanan, tunjangan buku, dana penelitian, transportasi/visa, dan asuransi kesehatan untuk studi S1/S2/S3 dalam dan luar negeri',
    jenjang: ['S1', 'S2', 'S3'],
    url_pendaftaran: 'https://beasiswa.kemdiktisaintek.go.id/',
    source_url: 'https://satubeasiswa.kemdiktisaintek.go.id/beasiswa/fpc9',
    source_kind: 'agregator',
    confidence: 88,
    last_verified_at: VERIFIED_AT,
    academic_year: '2026',
    stages: [
      {
        name: 'pendaftaran',
        opens_at: '2026-05-01T00:00:00Z',
        closes_at: '2026-06-30T23:59:00Z',
      },
    ],
    rule: {
      all: [
        {
          fact: 'jenjang',
          op: 'in',
          value: ['S1', 'S2', 'S3'],
          label: 'Jenjang S1/S2/S3',
        },
        {
          fact: 'penerima_beasiswa_lain',
          op: 'eq',
          value: false,
          label: 'Tidak sedang menerima beasiswa lain',
        },
      ],
    },
  },
  {
    slug: 'bib-pesantren-magister-doktor-2026',
    name: 'Beasiswa Indonesia Bangkit: Pesantren Magister & Doktor 2026',
    provider: 'Kementerian Agama RI × LPDP',
    tier: 'pemerintah',
    scope: 'nasional',
    coverage: 'ukt_penuh+allowance',
    benefit_summary:
      'Pembiayaan penuh studi magister/doktor bagi santri dan pengajar pesantren di lingkungan Kementerian Agama',
    jenjang: ['S2', 'S3'],
    url_pendaftaran: 'https://beasiswa.kemenag.go.id/',
    source_url: 'https://beasiswa.kemenag.go.id/',
    source_kind: 'resmi',
    confidence: 82,
    last_verified_at: VERIFIED_AT,
    academic_year: '2026',
    stages: [],
    rule: {
      all: [
        {
          fact: 'jenjang',
          op: 'in',
          value: ['S2', 'S3'],
          label: 'Jenjang S2/S3',
        },
        {
          fact: 'afiliasi_kemenag',
          op: 'eq',
          value: true,
          label: 'Berafiliasi dengan pesantren/lembaga Kemenag',
        },
      ],
    },
  },
  {
    slug: 'bib-beasiswa-santri-2026',
    name: 'Beasiswa Indonesia Bangkit: Beasiswa Santri 2026',
    provider: 'Kementerian Agama RI × LPDP',
    tier: 'pemerintah',
    scope: 'nasional',
    coverage: 'ukt_penuh+allowance',
    benefit_summary:
      'Pembiayaan studi sarjana bagi santri berprestasi di lingkungan pesantren/Kementerian Agama',
    jenjang: ['S1'],
    url_pendaftaran: 'https://beasiswa.kemenag.go.id/',
    source_url: 'https://beasiswa.kemenag.go.id/',
    source_kind: 'resmi',
    confidence: 80,
    last_verified_at: VERIFIED_AT,
    academic_year: '2026',
    stages: [],
    rule: {
      all: [
        {
          fact: 'jenjang',
          op: 'in',
          value: ['S1'],
          label: 'Jenjang S1',
        },
        {
          fact: 'afiliasi_kemenag',
          op: 'eq',
          value: true,
          label: 'Berafiliasi dengan pesantren/lembaga Kemenag',
        },
      ],
    },
  },
  {
    slug: 'beasiswa-kse-2025-2026',
    name: 'Beasiswa KSE (Karya Salemba Empat) 2025/2026',
    provider: 'Yayasan Karya Salemba Empat (KSE)',
    tier: 'swasta',
    scope: 'nasional',
    coverage: 'ukt_sebagian+allowance',
    benefit_summary:
      'Dukungan finansial pendidikan, pelatihan kepemimpinan, soft skill, career coaching, dan jejaring alumni untuk mahasiswa S1',
    jenjang: ['S1'],
    url_pendaftaran: 'https://kse.or.id/',
    source_url: 'https://kse.or.id/',
    source_kind: 'resmi',
    confidence: 80,
    last_verified_at: VERIFIED_AT,
    academic_year: '2025/2026',
    stages: [],
    rule: {
      all: [
        {
          fact: 'jenjang',
          op: 'in',
          value: ['S1'],
          label: 'Mahasiswa S1',
        },
        {
          fact: 'desil_dtsen',
          op: 'lte',
          value: 4,
          label: 'Prioritas desil DTSEN ≤ 4',
        },
        {
          fact: 'penerima_beasiswa_lain',
          op: 'eq',
          value: false,
          label: 'Tidak sedang menerima beasiswa lain',
        },
      ],
    },
  },
  {
    slug: 'beasiswa-cendekia-baznas-2026',
    name: 'Beasiswa Cendekia BAZNAS 2026',
    provider: 'Badan Amil Zakat Nasional (BAZNAS)',
    tier: 'pemerintah',
    scope: 'nasional',
    coverage: 'ukt_penuh+allowance',
    benefit_summary:
      'Bantuan biaya pendidikan dan dukungan penuh selama masa studi bagi mahasiswa kurang mampu',
    jenjang: ['S1'],
    url_pendaftaran: 'https://baznas.go.id/',
    source_url: 'https://uinjkt.ac.id/id/beasiswa-dan-bantuan-biaya-pendidikan',
    source_kind: 'agregator',
    confidence: 72,
    last_verified_at: VERIFIED_AT,
    academic_year: '2026',
    stages: [],
    rule: {
      all: [
        {
          fact: 'jenjang',
          op: 'in',
          value: ['S1'],
          label: 'Mahasiswa S1',
        },
        {
          fact: 'desil_dtsen',
          op: 'lte',
          value: 4,
          label: 'Prioritas desil DTSEN ≤ 4',
        },
        {
          fact: 'penerima_beasiswa_lain',
          op: 'eq',
          value: false,
          label: 'Tidak sedang menerima beasiswa lain',
        },
      ],
    },
  },
  {
    slug: 'beasiswa-baznas-jateng-uin-walisongo-2026',
    name: 'Beasiswa BAZNAS Provinsi Jawa Tengah 2026 (UIN Walisongo)',
    provider: 'BAZNAS Provinsi Jawa Tengah × UIN Walisongo Semarang',
    tier: 'kampus',
    scope: 'kampus:201010',
    coverage: 'ukt_sebagian',
    benefit_summary:
      'Bantuan biaya pendidikan dari BAZNAS Provinsi Jawa Tengah; pendaftaran diumumkan 15 Oktober 2026',
    jenjang: ['S1'],
    url_pendaftaran: 'https://walisongo.ac.id/',
    source_url: 'https://walisongo.ac.id/',
    source_kind: 'resmi',
    confidence: 80,
    last_verified_at: VERIFIED_AT,
    academic_year: '2026',
    stages: [],
    rule: {
      all: [
        {
          fact: 'jenjang',
          op: 'in',
          value: ['S1'],
          label: 'Mahasiswa S1',
        },
        {
          fact: 'desil_dtsen',
          op: 'lte',
          value: 4,
          label: 'Prioritas desil DTSEN ≤ 4',
        },
        {
          fact: 'penerima_beasiswa_lain',
          op: 'eq',
          value: false,
          label: 'Tidak sedang menerima beasiswa lain',
        },
      ],
    },
  },
  {
    slug: 'beasiswa-teladan-uin-malang-2026',
    name: 'Beasiswa Teladan UIN Maulana Malik Ibrahim Malang 2026',
    provider: 'UIN Maulana Malik Ibrahim Malang',
    tier: 'kampus',
    scope: 'kampus:201003',
    coverage: 'ukt_penuh',
    benefit_summary:
      'UKT Rp0 selama 8 semester + bebas biaya pengembangan institusi dan ma’had 2 semester pertama; kategori Tahfidz 30 juz, Qira’atul Kutub/Alfiyah, Hadis Arbain, atau prestasi seni/olahraga',
    jenjang: ['S1'],
    url_pendaftaran: 'https://uin-malang.ac.id/',
    source_url: 'https://uin-malang.ac.id/',
    source_kind: 'resmi',
    confidence: 85,
    last_verified_at: VERIFIED_AT,
    academic_year: '2026/2027',
    stages: [],
    rule: {
      all: [
        {
          fact: 'jenjang',
          op: 'in',
          value: ['S1'],
          label: 'Mahasiswa S1',
        },
        {
          fact: 'semester',
          op: 'eq',
          value: 1,
          label: 'Semester 1',
        },
        {
          fact: 'prestasi',
          op: 'exists',
          label:
            'Prestasi sesuai kategori: Tahfidz 30 juz, Qira’atul Kutub/Alfiyah, Hadis Arbain, seni, atau olahraga',
        },
      ],
    },
  },
  {
    slug: 'beasiswa-bakti-bca-2026',
    name: 'Beasiswa Bakti BCA 2026',
    provider: 'PT Bank Central Asia Tbk',
    tier: 'swasta',
    scope: 'nasional',
    coverage: 'ukt_sebagian+allowance',
    benefit_summary:
      'Tunjangan biaya hidup dan dukungan dana pendidikan bagi mahasiswa S1 semester 3 di PTN mitra BCA',
    jenjang: ['S1'],
    url_pendaftaran: 'https://satubeasiswa.kemdiktisaintek.go.id/beasiswa/ihnm',
    source_url: 'https://satubeasiswa.kemdiktisaintek.go.id/beasiswa/ihnm',
    source_kind: 'agregator',
    confidence: 82,
    last_verified_at: VERIFIED_AT,
    needs_test: true,
    academic_year: '2026/2027',
    stages: [
      {
        name: 'pendaftaran',
        opens_at: '2026-08-03T00:00:00Z',
        closes_at: '2026-11-01T23:59:00Z',
      },
    ],
    rule: {
      all: [
        {
          fact: 'jenjang',
          op: 'in',
          value: ['S1'],
          label: 'Mahasiswa S1 (non-vokasi)',
        },
        {
          fact: 'semester',
          op: 'eq',
          value: 3,
          label: 'Semester 3',
        },
        {
          fact: 'ipk',
          op: 'gte',
          value: 3,
          label: 'IPK minimal 3,00',
        },
        {
          fact: 'aktif_organisasi',
          op: 'eq',
          value: true,
          label: 'Aktif berorganisasi',
        },
        {
          fact: 'penerima_beasiswa_lain',
          op: 'eq',
          value: false,
          label: 'Tidak sedang menerima beasiswa lain',
        },
        {
          fact: 'pt_mitra',
          op: 'eq',
          value: true,
          label: 'Kampus termasuk PT mitra BCA',
        },
      ],
    },
  },
];

let added = 0;
for (const s of additions) {
  if (bySlug.has(s.slug)) continue;
  bySlug.set(s.slug, s);
  added++;
}

seed.scholarships = [...bySlug.values()];
seed._meta.generated_at = VERIFIED_AT;
seed._meta.normalized_at = VERIFIED_AT;
seed._meta.entry_count = seed.scholarships.length;
seed._meta.unique_count = seed.scholarships.length;
seed._meta.normalized_count = seed.scholarships.length;

fs.writeFileSync(SEED_PATH, `${JSON.stringify(seed, null, 2)}\n`);

console.log(`entri awal: ${initialCount}`);
console.log(`setelah dedupe: ${seed.scholarships.length - added} entri unik`);
console.log(`entri baru: ${added}`);
console.log(`total: ${seed.scholarships.length}`);