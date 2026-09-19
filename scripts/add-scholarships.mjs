/**
 * Generate additional scholarship entries from public sources.
 * Run: node --experimental-strip-types scripts/add-scholarships.mjs
 */
import fs from 'node:fs';
import path from 'node:path';

const SEED_PATH = 'data/scholarships.seed.json';

// Read existing seed
const seedFile = fs.readFileSync(SEED_PATH, 'utf8');
const seed = JSON.parse(seedFile);

// New scholarships from verified sources
const newScholarships = [
  {
    slug: 'bright-scholarship-2026',
    name: 'Bright Scholarship 2026',
    provider: 'Yayasan Baitul Maal BRILiaN (Bank BRI)',
    tier: 'swasta',
    scope: 'nasional',
    coverage: 'ukt_penuh+allowance+asrama',
    benefit_summary: 'Fully funded: UKT penuh, tunjangan bulanan, asrama gratis, pembinaan karakter.',
    jenjang: ['S1', 'D4'],
    url_pendaftaran: 'https://brilianscholarship.id/bright/pendaftaran',
    source_url: 'https://ybmbrilian.id/ybm-brilian-resmi-buka-pendaftaran-bright-scholarship-2026/',
    source_kind: 'resmi',
    confidence: 92,
    last_verified_at: '2026-09-18T00:00:00Z',
    ukt_max_idr: null, // Fully funded, no UKT cap
    academic_year: '2026/2027',
    stages: [
      { name: 'pendaftaran', opens_at: '2026-07-13T00:00:00Z', closes_at: '2026-07-31T23:59:00Z' },
      { name: 'seleksi_berkas', opens_at: '2026-08-01T00:00:00Z', closes_at: '2026-08-15T23:59:00Z' },
      { name: 'pengumuman', opens_at: '2026-08-20T00:00:00Z' },
    ],
    rule: {
      all: [
        { fact: 'warga_negara', op: 'eq', value: true, label: 'Warga Negara Indonesia (WNI)' },
        { fact: 'jenjang', op: 'in', value: ['S1', 'D4'], label: 'Mahasiswa S1/D4 semester 1' },
        { fact: 'semester', op: 'eq', value: 1, label: 'Semester 1' },
        { fact: 'penerima_beasiswa_lain', op: 'eq', value: false, label: 'Tidak sedang menerima beasiswa lain' },
        { fact: 'panti_sosial', op: 'eq', value: true, label: 'Keluarga pra sejahtera / dhuafa' },
        { fact: 'aktif_organisasi', op: 'exists', value: true, label: 'Aktif berorganisasi' },
      ]
    }
  },
  {
    slug: 'djarum-beasiswa-plus-2026',
    name: 'Djarum Beasiswa Plus 2026/2027',
    provider: 'Djarum Foundation',
    tier: 'swasta',
    scope: 'nasional',
    coverage: 'ukt_penuh+allowance+pelatihan',
    benefit_summary: 'Bantuan UKT penuh, tunjangan bulanan, pelatihan soft skills & leadership, jaringan alumni.',
    jenjang: ['S1', 'D4'],
    url_pendaftaran: 'https://register.djarumbeasiswaplus.org',
    source_url: 'https://djarumbeasiswaplus.org/our-program/regulation-djarum-beasiswa-plus',
    source_kind: 'resmi',
    confidence: 95,
    last_verified_at: '2026-09-18T00:00:00Z',
    ukt_max_idr: null,
    academic_year: '2026/2027',
    stages: [
      { name: 'pendaftaran', opens_at: '2026-04-08T00:00:00Z', closes_at: '2026-06-10T23:59:00Z' },
      { name: 'tes_tulis', opens_at: '2026-06-15T00:00:00Z', closes_at: '2026-06-20T23:59:00Z' },
      { name: 'wawancara', opens_at: '2026-07-01T00:00:00Z', closes_at: '2026-07-15T23:59:00Z' },
      { name: 'pengumuman', opens_at: '2026-07-20T00:00:00Z' },
    ],
    rule: {
      all: [
        { fact: 'jenjang', op: 'in', value: ['S1', 'D4'], label: 'Mahasiswa S1/D4' },
        { fact: 'semester', op: 'between', value: [4, 4], label: 'Semester IV' },
        { fact: 'ipk', op: 'gte', value: 3.0, label: 'IPK minimal 3.00' },
        { fact: 'aktif_organisasi', op: 'eq', value: true, label: 'Aktif berorganisasi' },
        { fact: 'penerima_beasiswa_lain', op: 'eq', value: false, label: 'Tidak sedang menerima beasiswa lain' },
        { fact: 'pt_mitra', op: 'eq', value: true, label: 'Kampus mitra Djarum Beasiswa Plus' },
      ]
    }
  },
  {
    slug: 'pertamina-sobat-bumi-2026',
    name: 'Beasiswa Pertamina Sobat Bumi 2026',
    provider: 'Pertamina Foundation',
    tier: 'swasta',
    scope: 'nasional',
    coverage: 'ukt_penuh+allowance+green_program',
    benefit_summary: 'Bantuan UKT/SPP, tunjangan hidup, green initiative program, capacity building.',
    jenjang: ['S1', 'D4', 'D3'],
    url_pendaftaran: 'https://www.pertaminafoundation.org/',
    source_url: 'https://ap.undip.ac.id/2026/06/03/beasiswa-pertamina-sobat-bumi-2026/',
    source_kind: 'resmi',
    confidence: 90,
    last_verified_at: '2026-09-18T00:00:00Z',
    ukt_max_idr: null,
    academic_year: '2026/2027',
    stages: [
      { name: 'pendaftaran', opens_at: '2026-01-01T00:00:00Z', closes_at: '2026-05-31T23:59:00Z' },
      { name: 'seleksi_berkas', opens_at: '2026-06-01T00:00:00Z', closes_at: '2026-06-15T23:59:00Z' },
      { name: 'pengumuman', opens_at: '2026-06-20T00:00:00Z' },
    ],
    rule: {
      all: [
        { fact: 'warga_negara', op: 'eq', value: true, label: 'Warga Negara Indonesia (WNI)' },
        { fact: 'jenjang', op: 'in', value: ['S1', 'D4', 'D3'], label: 'Mahasiswa S1/D4/D3' },
        { fact: 'semester', op: 'between', value: [2, 6], label: 'Semester 2–6 (S1/D4) atau 2–4 (D3)' },
        { fact: 'ipk', op: 'gte', value: 3.0, label: 'IPK minimal 3.00' },
        { fact: 'penerima_beasiswa_lain', op: 'eq', value: false, label: 'Tidak menerima beasiswa lain' },
        { fact: 'pt_mitra', op: 'eq', value: true, label: 'Kampus mitra Pertamina Foundation' },
      ]
    }
  },
  {
    slug: 'beasiswa-bank-indonesia-2026',
    name: 'Beasiswa Bank Indonesia 2026',
    provider: 'Bank Indonesia',
    tier: 'pemerintah',
    scope: 'nasional',
    coverage: 'ukt_sebagian+genbi',
    benefit_summary: 'Bantuan biaya pendidikan sebagian, keanggotaan GenBI, pengembangan soft skills.',
    jenjang: ['S1', 'D4', 'D3'],
    url_pendaftaran: 'Tergantung PT mitra masing-masing',
    source_url: 'https://uinjambi.ac.id/penerimaan-beasiswa-bank-indonesia-2026',
    source_kind: 'resmi',
    confidence: 88,
    last_verified_at: '2026-09-18T00:00:00Z',
    ukt_max_idr: 5000000,
    academic_year: '2026/2027',
    stages: [
      { name: 'pendaftaran', opens_at: '2026-04-27T00:00:00Z', closes_at: '2026-05-05T23:59:00Z' },
      { name: 'wawancara', opens_at: '2026-05-10T00:00:00Z', closes_at: '2026-05-20T23:59:00Z' },
      { name: 'pengumuman', opens_at: '2026-05-25T00:00:00Z' },
    ],
    rule: {
      all: [
        { fact: 'warga_negara', op: 'eq', value: true, label: 'Warga Negara Indonesia (WNI)' },
        { fact: 'jenjang', op: 'in', value: ['S1', 'D4', 'D3'], label: 'Mahasiswa S1/D4/D3' },
        { fact: 'semester', op: 'gte', value: 3, label: 'Minimal semester 3' },
        { fact: 'ipk', op: 'gte', value: 3.0, label: 'IPK minimal 3.00' },
        { fact: 'penerima_beasiswa_lain', op: 'eq', value: false, label: 'Tidak menerima beasiswa lain' },
        { fact: 'kondisi_ekonomi_lemah', op: 'eq', value: true, label: 'Keluarga pra sejahtera' },
      ]
    }
  },
  {
    slug: 'lpdp-tahap-2-2026',
    name: 'LPDP Beasiswa Tahap 2 2026',
    provider: 'Lembaga Pengelola Dana Pendidikan (Kemenkeu)',
    tier: 'pemerintah',
    scope: 'nasional',
    coverage: 'ukt_penuh+allowance+luar_negeri',
    benefit_summary: 'Biaya studi penuh di dalam/luar negeri, tunjangan hidup, tiket pesawat.',
    jenjang: ['S2', 'S3'],
    url_pendaftaran: 'https://beasiswalpdp-terintegrasi.kemenkeu.go.id',
    source_url: 'https://lpdp.kemenkeu.go.id/en/beasiswa/pendaftaran-beasiswa',
    source_kind: 'resmi',
    confidence: 94,
    last_verified_at: '2026-09-18T00:00:00Z',
    ukt_max_idr: null,
    academic_year: '2026/2027',
    stages: [
      { name: 'pendaftaran', opens_at: '2026-06-30T00:00:00Z', closes_at: '2026-07-31T23:59:00Z' },
      { name: 'seleksi_administrasi', opens_at: '2026-08-03T00:00:00Z', closes_at: '2026-08-03T23:59:00Z' },
      { name: 'tes_bakat_skolastik', opens_at: '2026-09-29T00:00:00Z', closes_at: '2026-10-04T23:59:00Z' },
      { name: 'seleksi_substansi', opens_at: '2026-10-14T00:00:00Z', closes_at: '2026-11-20T23:59:00Z' },
      { name: 'pengumuman', opens_at: '2026-11-30T00:00:00Z' },
    ],
    rule: {
      all: [
        { fact: 'jenjang', op: 'in', value: ['S2', 'S3'], label: 'Magister/Doktoral' },
        { fact: 'ipk', op: 'gte', value: 3.0, label: 'IPK minimal 3.00' },
        { fact: 'skor_bahasa', op: 'exists', value: true, label: 'Skor bahasa Inggris valid (TOEFL/IELTS)' },
      ]
    }
  },
  {
    slug: 'beasiswa-bca-finance-peduli-2026',
    name: 'BCA Finance Peduli Beasiswa 2026',
    provider: 'PT BCA Finance',
    tier: 'swasta',
    scope: 'nasional',
    coverage: 'ukt_sebagian',
    benefit_summary: 'Bantuan biaya pendidikan partial untuk mahasiswa berprestasi dari keluarga kurang mampu.',
    jenjang: ['S1', 'D4'],
    url_pendaftaran: 'https://bcafinance.co.id/Pendaftaran-Beasiswa-BCA-Finance-Peduli-2026-Dibuka',
    source_url: 'https://www.idntimes.com/life/education/beasiswa-juni-2026-c1c2-01-k7db6-n3f87d',
    source_kind: 'agregator',
    confidence: 75,
    last_verified_at: '2026-09-18T00:00:00Z',
    ukt_max_idr: 4000000,
    academic_year: '2026/2027',
    stages: [
      { name: 'pendaftaran', opens_at: '2026-06-01T00:00:00Z', closes_at: '2026-07-31T23:59:00Z' },
      { name: 'pengumuman', opens_at: '2026-08-15T00:00:00Z' },
    ],
    rule: {
      all: [
        { fact: 'jenjang', op: 'in', value: ['S1', 'D4'], label: 'Mahasiswa S1/D4' },
        { fact: 'semester', op: 'between', value: [4, 6], label: 'Semester 4–6' },
        { fact: 'ipk', op: 'gte', value: 3.0, label: 'IPK minimal 3.00' },
        { fact: 'panti_sosial', op: 'eq', value: true, label: 'Keluarga kurang mampu' },
      ]
    }
  },
];

// Add new scholarships
seed.scholarships.push(...newScholarships);

// Update meta
seed._meta.generated_at = new Date().toISOString();
seed._meta.normalized_count = seed.scholarships.length;

// Write back
fs.writeFileSync(SEED_PATH, JSON.stringify(seed, null, 2));
console.log(`Added ${newScholarships.length} scholarships. Total: ${seed.scholarships.length}`);
