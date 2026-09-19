'use client';

import { useState } from 'react';
import { X, Copy } from '@phosphor-icons/react/dist/csr';

const API_DOCS = [
  {
    path: '/api/v1/institutions',
    title: 'Katalog Kampus',
    description: 'Cari kampus atau ambil detail UKT per prodi.',
    methods: [
      {
        method: 'GET',
        desc: 'Cari kampus berdasarkan nama',
        curl: 'curl "https://sakukampus.onheil.fun/api/v1/institutions?q=brawijaya&limit=5"',
        response: {
          status: 'success',
          data: [
            { kode: '001019', nama: 'UNIVERSITAS BRAWIJAYA', jenis: 'UNIVERSITAS', punya_ukt: false, jumlah_prodi: 0 }
          ]
        }
      },
      {
        method: 'GET',
        desc: 'Detail satu kampus + tabel UKT',
        curl: 'curl "https://sakukampus.onheil.fun/api/v1/institutions?kode=201001"',
        response: {
          status: 'success',
          data: {
            kode: '201001',
            nama: 'UIN SYARIF HIDAYATULLAH JAKARTA',
            jenis: 'UNIVERSITAS',
            ukt_model: 'ptkin_kma',
            ukt_note: 'KMA 204/2026, TA 2026/2027',
            prodi_terdaftar: [{ nama: 'Teknik Informatika', fakultas: 'FTI', ada_data_ukt: true, golongan: 8 }],
            contoh_ukt: [
              { kelompok: 1, label: 'Golongan 1', nominal: 400000 },
              { kelompok: 2, label: 'Golongan 2', nominal: 4270000 }
            ]
          }
        }
      }
    ]
  },
  {
    path: '/api/v1/scholarships',
    title: 'Katalog Beasiswa',
    description: 'Daftar beasiswa dengan filter tier & status.',
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
              stages: [{ name: 'pendaftaran', opens_at: '2026-06-01T00:00:00Z', closes_at: '2026-07-31T23:59:00Z' }]
            }
          ]
        }
      },
      {
        method: 'GET',
        desc: 'Filter berdasarkan tier',
        curl: 'curl "https://sakukampus.onheil.fun/api/v1/scholarships?tier=kampus"',
        response: {
          status: 'success',
          data: [
            { slug: 'stf-uin-jakarta-2026', name: 'Beasiswa STF UIN Jakarta 2026', tier: 'kampus', status: 'tutup' }
          ]
        }
      }
    ]
  },
  {
    path: '/api/v1/calendar',
    title: 'Kalender Tenggat',
    description: 'Semua tenggat pendaftaran, terurutchronologis.',
    methods: [
      {
        method: 'GET',
        desc: 'Ambil semua tenggat',
        curl: 'curl "https://sakukampus.onheil.fun/api/v1/calendar"',
        response: {
          status: 'success',
          data: [
            { slug: 'kip-kuliah-2026', name: 'KIP Kuliah 2026', tenggat: '2026-07-31T23:59:00Z', sisa_hari: 42 },
            { slug: 'djarum-beasiswa-plus-2026', name: 'Djarum Beasiswa Plus 2026', tenggat: '2026-06-10T23:59:00Z', sisa_hari: 2 }
          ]
        }
      }
    ]
  },
  {
    path: '/api/v1/meta/sources',
    title: 'Metadata Sumber',
    description: 'Info sumber data: kapan diupdate, dari mana, dll.',
    methods: [
      {
        method: 'GET',
        desc: 'Meta seluruh sumber',
        curl: 'curl "https://sakukampus.onheil.fun/api/v1/meta/sources"',
        response: {
          status: 'success',
          data: {
            institutions: { count: 3690, generated_at: '2026-09-19T14:56:56Z', source: 'PDDikti' },
            ukt: { decree: 'KMA 204/2026', academic_year: '2026/2027', ptkin: 58, prodi: 1550 },
            scholarships: { count: 14, last_verified: '2026-09-19T14:47:13Z' }
          }
        }
      }
    ]
  },
  {
    path: '/api/v1/eligibility/check',
    title: 'Cek Kelayakan',
    description: 'POST endpoint — cocokkan profil dengan beasiswa.',
    methods: [
      {
        method: 'POST',
        desc: 'Cek beasiswa untuk Brawijaya (manual UKT)',
        curl: `curl -X POST "https://sakukampus.onheil.fun/api/v1/eligibility/check" \\\n  -H "Content-Type: application/json" \\\n  -d '{
    "kode_pt": "001019",
    "nominal_manual": 3500000,
    "profil": { "jenjang": "S1" }
  }'`,
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
                reasons: [{ label: 'Jenjang S1', ok: true, soft: false }],
                missing: []
              }
            ]
          }
        }
      },
      {
        method: 'POST',
        desc: 'Cek untuk UIN Jakarta (golongan UKT)',
        curl: `curl -X POST "https://sakukampus.onheil.fun/api/v1/eligibility/check" \\\n  -H "Content-Type: application/json" \\\n  -d '{
    "kode_pt": "201001",
    "prodi": "Teknik Informatika",
    "kelompok": 2,
    "profil": { "jenjang": "S1", "ipk": 3.5, "semester": 5 }
  }'`,
        response: {
          status: 'success',
          data: {
            kampus: { kode: '201001', nama: 'UIN SYARIF HIDAYATULLAH JAKARTA', ukt_model: 'ptkin_kma' },
            ukt: { dipakai: 4270000, sumber: 'kma', terverifikasi: true },
            hasil: [
              {
                slug: 'stf-uin-jakarta-2026',
                name: 'Beasiswa STF UIN Jakarta 2026',
                verdict: 'perlu_data',
                score: 80,
                reasons: [
                  { label: 'Mahasiswa S1', ok: true, soft: false },
                  { label: 'Semester 3–7', ok: true, soft: false },
                  { label: 'IPK minimal 3,50', ok: true, soft: false },
                  { label: 'Prioritas UKT golongan 1–4', ok: false, soft: true }
                ],
                missing: ['Tidak sedang menerima beasiswa lain']
              }
            ]
          }
        }
      }
    ]
  }
];

export default function ApiDocModal({ onClose }: { onClose: () => void }) {
  const [selected, setSelected] = useState(API_DOCS[0]);
  const [activeMethod, setActiveMethod] = useState(0);
  const [copied, setCopied] = useState(false);

  const copyCurl = (curl: string) => {
    navigator.clipboard.writeText(curl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 100,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 20,
      }}
    >
      {/* Backdrop */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          background: 'rgba(0,0,0,0.7)',
          backdropFilter: 'blur(4px)',
        }}
        onClick={onClose}
      />

      {/* Modal */}
      <div
        style={{
          position: 'relative',
          background: 'var(--surface)',
          border: '1px solid var(--line)',
          borderRadius: 16,
          maxWidth: 720,
          width: '100%',
          maxHeight: '85vh',
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column',
          boxShadow: '0 24px 80px rgba(0,0,0,0.5)',
        }}
      >
        {/* Header */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '16px 20px',
            borderBottom: '1px solid var(--line)',
          }}
        >
          <div>
            <h3 style={{ margin: 0, fontSize: 16, fontWeight: 600 }}>API Dokumentasi</h3>
            <p className="tiny faint" style={{ margin: '2px 0 0' }}>Contoh penggunaan endpoint SakuKampus</p>
          </div>
          <button
            onClick={onClose}
            style={{
              background: 'transparent',
              border: 'none',
              cursor: 'pointer',
              color: 'var(--ink-faint)',
              fontSize: 20,
              padding: 4,
              lineHeight: 1,
            }}
          >
            ×
          </button>
        </div>

        {/* Content */}
        <div style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>
          {/* Sidebar */}
          <div
            style={{
              width: 200,
              borderRight: '1px solid var(--line)',
              overflowY: 'auto',
              flexShrink: 0,
            }}
          >
            {API_DOCS.map((api, i) => (
              <button
                key={api.path}
                onClick={() => { setSelected(api); setActiveMethod(0); }}
                style={{
                  display: 'block',
                  width: '100%',
                  padding: '12px 16px',
                  background: selected === api ? 'var(--accent-dim)' : 'transparent',
                  border: 'none',
                  borderRight: selected === api ? `2px solid var(--accent)` : 'none',
                  textAlign: 'left',
                  cursor: 'pointer',
                  color: selected === api ? 'var(--accent)' : 'var(--ink-dim)',
                  fontSize: 13,
                  fontWeight: selected === api ? 600 : 400,
                }}
              >
                <div style={{ fontFamily: 'monospace', fontSize: 11, marginBottom: 2 }}>{api.path}</div>
                <div>{api.title}</div>
              </button>
            ))}
          </div>

          {/* Main */}
          <div style={{ flex: 1, overflowY: 'auto', padding: 20 }}>
            <p className="tiny" style={{ color: 'var(--ink-dim)', marginBottom: 16 }}>
              {selected.description}
            </p>

            {selected.methods.map((method, i) => (
              <div key={i} style={{ marginBottom: 20 }}>
                <button
                  onClick={() => setActiveMethod(i)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 8,
                    padding: '8px 12px',
                    background: activeMethod === i ? 'var(--surface-2)' : 'transparent',
                    border: '1px solid var(--line)',
                    borderRadius: 8,
                    cursor: 'pointer',
                    width: '100%',
                    textAlign: 'left',
                    color: 'inherit',
                    fontSize: 13,
                  }}
                >
                  <span
                    style={{
                      padding: '2px 6px',
                      borderRadius: 4,
                      background: method.method === 'POST' ? 'var(--ok-dim)' : 'var(--accent-dim)',
                      color: method.method === 'POST' ? 'var(--ok)' : 'var(--accent)',
                      fontWeight: 600,
                      fontSize: 11,
                    }}
                  >
                    {method.method}
                  </span>
                  <span style={{ color: 'var(--ink)' }}>{method.desc}</span>
                </button>

                {activeMethod === i && (
                  <div style={{ marginTop: 12 }}>
                    {/* Curl */}
                    <div style={{ position: 'relative' }}>
                      <div
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          marginBottom: 6,
                        }}
                      >
                        <span className="tiny" style={{ color: 'var(--ink-faint)' }}>cURL</span>
                        <button
                          onClick={() => copyCurl(method.curl)}
                          style={{
                            background: 'transparent',
                            border: 'none',
                            cursor: 'pointer',
                            color: 'var(--ink-faint)',
                            fontSize: 11,
                            display: 'flex',
                            alignItems: 'center',
                            gap: 4,
                          }}
                        >
                          <Copy size={12} />
                          {copied ? 'Disalin!' : 'Salin'}
                        </button>
                      </div>
                      <pre
                        style={{
                          background: 'var(--surface-2)',
                          border: '1px solid var(--line)',
                          borderRadius: 8,
                          padding: 14,
                          fontSize: 12,
                          fontFamily: 'IBM Plex Mono, monospace',
                          color: 'var(--ink)',
                          overflowX: 'auto',
                          whiteSpace: 'pre-wrap',
                          wordBreak: 'break-all',
                          lineHeight: 1.5,
                        }}
                      >
                        {method.curl}
                      </pre>
                    </div>

                    {/* Response */}
                    <div style={{ marginTop: 12 }}>
                      <span className="tiny" style={{ color: 'var(--ink-faint)' }}>Response</span>
                      <pre
                        style={{
                          background: 'var(--surface-2)',
                          border: '1px solid var(--line)',
                          borderRadius: 8,
                          padding: 14,
                          fontSize: 12,
                          fontFamily: 'IBM Plex Mono, monospace',
                          color: 'var(--ok)',
                          overflowX: 'auto',
                          whiteSpace: 'pre-wrap',
                          wordBreak: 'break-all',
                          lineHeight: 1.5,
                          marginTop: 6,
                        }}
                      >
                        {JSON.stringify(method.response, null, 2)}
                      </pre>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
