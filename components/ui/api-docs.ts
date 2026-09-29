export type ApiMethod = {
  method: 'GET' | 'POST';
  desc: string;
  curl: string;
  response: unknown;
};

export type ApiDoc = {
  path: string;
  title: string;
  description: string;
  methods: ApiMethod[];
};

export const API_DOCS: ApiDoc[] = [
  {
    path: '/api/v1/institutions',
    title: 'Katalog Kampus',
    description: 'Cari kampus atau ambil detail tabel UKT per prodi.',
    methods: [
      {
        method: 'GET',
        desc: 'Cari kampus berdasarkan nama',
        curl: 'curl "https://sakukampus.onheil.fun/api/v1/institutions?q=brawijaya&limit=5"',
        response: {
          status: 'success',
          data: [
            {
              kode: '001019',
              nama: 'UNIVERSITAS BRAWIJAYA',
              jenis: 'UNIVERSITAS',
              punya_ukt: false,
              jumlah_prodi: 0,
            },
          ],
        },
      },
      {
        method: 'GET',
        desc: 'Detail satu kampus beserta tabel UKT',
        curl: 'curl "https://sakukampus.onheil.fun/api/v1/institutions?kode=201001"',
        response: {
          status: 'success',
          data: {
            kode: '201001',
            nama: 'UIN SYARIF HIDAYATULLAH JAKARTA',
            jenis: 'UNIVERSITAS',
            ukt_model: 'ptkin_kma',
            ukt_note: 'KMA 204/2026, TA 2026/2027',
            prodi_terdaftar: [
              { nama: 'Teknik Informatika', fakultas: 'FTI', ada_data_ukt: true, golongan: 8 },
            ],
            contoh_ukt: [
              { kelompok: 1, label: 'Golongan 1', nominal: 400000 },
              { kelompok: 2, label: 'Golongan 2', nominal: 4270000 },
            ],
          },
        },
      },
    ],
  },
  {
    path: '/api/v1/scholarships',
    title: 'Katalog Beasiswa',
    description: 'Daftar beasiswa dengan filter tingkat dan status pendaftaran.',
    methods: [
      {
        method: 'GET',
        desc: 'Semua beasiswa',
        curl: 'curl "https://sakukampus.onheil.fun/api/v1/scholarships"',
        response: {
          status: 'success',
          data: [
            {
              slug: 'kip-kuliah-2026',
              name: 'Kartu Indonesia Pintar (KIP) Kuliah 2026',
              provider: 'Kemdikbud Ristek',
              tier: 'pemerintah',
              scope: 'nasional',
              status: 'buka',
              ukt_syarat: 'UKT ≤ Rp2.400.000',
              stages: [
                {
                  name: 'pendaftaran',
                  opens_at: '2026-06-01T00:00:00Z',
                  closes_at: '2026-07-31T23:59:00Z',
                },
              ],
            },
          ],
        },
      },
      {
        method: 'GET',
        desc: 'Filter berdasarkan tingkat penyelenggara',
        curl: 'curl "https://sakukampus.onheil.fun/api/v1/scholarships?tier=kampus"',
        response: {
          status: 'success',
          data: [
            {
              slug: 'stf-uin-jakarta-2026',
              name: 'Beasiswa STF UIN Jakarta 2026',
              tier: 'kampus',
              status: 'tutup',
            },
          ],
        },
      },
    ],
  },
  {
    path: '/api/v1/calendar',
    title: 'Kalender Tenggat',
    description: 'Seluruh tenggat pendaftaran, terurut kronologis.',
    methods: [
      {
        method: 'GET',
        desc: 'Ambil semua tenggat',
        curl: 'curl "https://sakukampus.onheil.fun/api/v1/calendar"',
        response: {
          status: 'success',
          data: [
            {
              slug: 'kip-kuliah-2026',
              name: 'KIP Kuliah 2026',
              tenggat: '2026-07-31T23:59:00Z',
              sisa_hari: 42,
            },
          ],
        },
      },
    ],
  },
  {
    path: '/api/v1/meta/sources',
    title: 'Metadata Sumber',
    description: 'Kapan tiap dataset terakhir diambil, dan dari mana asalnya.',
    methods: [
      {
        method: 'GET',
        desc: 'Meta seluruh sumber',
        curl: 'curl "https://sakukampus.onheil.fun/api/v1/meta/sources"',
        response: {
          status: 'success',
          data: {
            katalog: { jumlah_pt: 3693, digenerate: '2026-09-19T14:56:56Z' },
            ukt: { dekrit: 'KMA 204/2026', ptkin: 58, prodi: 1550 },
            beasiswa: { jumlah: 19, pemeriksaan_terakhir: '2026-09-19T14:47:13Z' },
          },
        },
      },
    ],
  },
  {
    path: '/api/v1/eligibility/check',
    title: 'Cek Kelayakan',
    description: 'POST — cocokkan profil akademikmu dengan seluruh katalog beasiswa.',
    methods: [
      {
        method: 'POST',
        desc: 'Kampus tanpa data UKT (nominal diisi manual)',
        curl:
          'curl -X POST "https://sakukampus.onheil.fun/api/v1/eligibility/check" \\\n' +
          '  -H "Content-Type: application/json" \\\n' +
          `  -d '{"kode_pt":"001019","nominal_manual":3500000,"profil":{"jenjang":"S1"}}'`,
        response: {
          status: 'success',
          data: {
            kampus: { kode: '001019', nama: 'UNIVERSITAS BRAWIJAYA', ukt_model: 'manual' },
            ukt: { dipakai: 3500000, sumber: 'manual', terverifikasi: false },
            hasil: [
              {
                slug: 'kip-kuliah-2026',
                name: 'KIP Kuliah 2026',
                verdict: 'lolos',
                score: 100,
                missing: [],
              },
            ],
          },
        },
      },
      {
        method: 'POST',
        desc: 'PTKIN (golongan UKT dari dekrit)',
        curl:
          'curl -X POST "https://sakukampus.onheil.fun/api/v1/eligibility/check" \\\n' +
          '  -H "Content-Type: application/json" \\\n' +
          `  -d '{"kode_pt":"201001","prodi":"Teknik Informatika","kelompok":2,"profil":{"jenjang":"S1","ipk":3.5,"semester":5}}'`,
        response: {
          status: 'success',
          data: {
            kampus: { kode: '201001', nama: 'UIN SYARIF HIDAYATULLAH', ukt_model: 'ptkin_kma' },
            ukt: { dipakai: 4270000, sumber: 'kma', terverifikasi: true },
            hasil: [
              {
                slug: 'stf-uin-jakarta-2026',
                name: 'Beasiswa STF UIN Jakarta 2026',
                verdict: 'perlu_data',
                missing: ['Tidak sedang menerima beasiswa lain'],
              },
            ],
          },
        },
      },
    ],
  },
];
