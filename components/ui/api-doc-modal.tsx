'use client';

import { useState } from 'react';
import { X, Copy } from '@phosphor-icons/react';

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
    description: 'Semua tenggat pendaftaran, terurut kronologis.',
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
            scholarships: { count: 18, last_verified: '2026-09-19T14:47:13Z' }
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
        curl: 'curl -X POST "https://sakukampus.onheil.fun/api/v1/eligibility/check" \\\n  -H "Content-Type: application/json" \\\n  -d \'{"kode_pt": "001019", "nominal_manual": 3500000, "profil": {"jenjang": "S1"}}\'',
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
        curl: 'curl -X POST "https://sakukampus.onheil.fun/api/v1/eligibility/check" \\\n  -H "Content-Type: application/json" \\\n  -d \'{"kode_pt": "201001", "prodi": "Teknik Informatika", "kelompok": 2, "profil": {"jenjang": "S1", "ipk": 3.5, "semester": 5}}\'',
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
  const [showSidebar, setShowSidebar] = useState(false);

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
        zIndex: 9999,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 16,
      }}
    >
      {/* Backdrop */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          background: 'rgba(0,0,0,0.8)',
          backdropFilter: 'blur(8px)',
        }}
        onClick={onClose}
      />

      {/* Modal container */}
      <div
        style={{
          position: 'relative',
          background: 'var(--surface)',
          border: '1px solid var(--line)',
          borderRadius: 16,
          maxWidth: 720,
          width: '100%',
          maxHeight: '90vh',
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column',
          boxShadow: '0 24px 80px rgba(0,0,0,0.6)',
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
            flexShrink: 0,
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            {/* Mobile menu toggle */}
            <button
              onClick={() => setShowSidebar(!showSidebar)}
              style={{
                background: 'var(--surface-2)',
                border: '1px solid var(--line)',
                borderRadius: 8,
                padding: '6px 12px',
                color: 'var(--ink-dim)',
                fontSize: 12,
                cursor: 'pointer',
                display: window.innerWidth < 768 ? 'flex' : 'none',
                alignItems: 'center',
                gap: 4,
              }}
              className="mobile-menu-btn"
            >
              ☰ Menu
            </button>
            <div>
              <h3 style={{ margin: 0, fontSize: 16, fontWeight: 600 }}>API Dokumentasi</h3>
              <p style={{ margin: '2px 0 0', fontSize: 12, color: 'var(--ink-faint)' }}>
                Contoh penggunaan endpoint SakuKampus
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            style={{
              background: 'transparent',
              border: 'none',
              cursor: 'pointer',
              color: 'var(--ink-faint)',
              fontSize: 24,
              padding: 4,
              lineHeight: 1,
            }}
          >
            ×
          </button>
        </div>

        {/* Content */}
        <div style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>
          {/* Sidebar - hidden on mobile by default */}
          <div
            style={{
              width: showSidebar || window.innerWidth >= 768 ? '220px' : '0',
              borderRight: showSidebar || window.innerWidth >= 768 ? '1px solid var(--line)' : 'none',
              overflowY: 'auto',
              flexShrink: 0,
              transition: 'all 0.2s ease',
              background: showSidebar || window.innerWidth >= 768 ? 'var(--surface)' : 'transparent',
            }}
            className="api-sidebar"
          >
            <div style={{ padding: '12px 16px', borderBottom: '1px solid var(--line)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: 11, fontWeight: 600, color: 'var(--ink-faint)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Endpoints</span>
              {showSidebar && (
                <button 
                  onClick={() => setShowSidebar(false)} 
                  style={{ background: 'none', border: 'none', color: 'var(--ink-faint)', cursor: 'pointer', fontSize: 18, padding: '4px 8px' }}
                >
                  ←
                </button>
              )}
            </div>
            {API_DOCS.map((api) => (
              <button
                key={api.path}
                onClick={() => { 
                  setSelected(api); 
                  setActiveMethod(0); 
                  if (window.innerWidth < 768) setShowSidebar(false); 
                }}
                style={{
                  display: 'block',
                  width: '100%',
                  padding: '14px 16px',
                  background: selected === api ? 'var(--accent-dim)' : 'transparent',
                  border: 'none',
                  borderLeft: selected === api ? '3px solid var(--accent)' : '3px solid transparent',
                  textAlign: 'left',
                  cursor: 'pointer',
                  color: selected === api ? 'var(--accent)' : 'var(--ink-dim)',
                  fontSize: 13,
                  fontWeight: selected === api ? 600 : 400,
                  transition: 'all 0.15s',
                }}
              >
                <div style={{ fontFamily: 'monospace', fontSize: 11, marginBottom: 4, opacity: 0.7 }}>{api.path}</div>
                <div style={{ fontSize: 13 }}>{api.title}</div>
              </button>
            ))}
          </div>

          {/* Main content */}
          <div style={{ flex: 1, overflowY: 'auto', padding: 20 }}>
            <p style={{ color: 'var(--ink-dim)', marginBottom: 20, fontSize: 13, lineHeight: 1.5 }}>
              {selected.description}
            </p>

            {selected.methods.map((method, i) => (
              <div key={i} style={{ marginBottom: 24 }}>
                <button
                  onClick={() => setActiveMethod(i)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 10,
                    padding: '12px 16px',
                    background: activeMethod === i ? 'var(--surface-2)' : 'transparent',
                    border: `1px solid ${activeMethod === i ? 'var(--line-strong)' : 'var(--line)'}`,
                    borderRadius: 10,
                    cursor: 'pointer',
                    width: '100%',
                    textAlign: 'left',
                    color: 'inherit',
                    fontSize: 13,
                    transition: 'all 0.15s',
                  }}
                >
                  <span style={{
                    padding: '3px 8px',
                    borderRadius: 6,
                    background: method.method === 'POST' ? 'var(--ok-dim)' : 'var(--accent-dim)',
                    color: method.method === 'POST' ? 'var(--ok)' : 'var(--accent)',
                    fontWeight: 700,
                    fontSize: 11,
                    letterSpacing: '0.05em',
                  }}>
                    {method.method}
                  </span>
                  <span style={{ color: 'var(--ink)', flex: 1 }}>{method.desc}</span>
                  <span style={{ color: 'var(--ink-faint)', fontSize: 18 }}>›</span>
                </button>

                {activeMethod === i && (
                  <div style={{ marginTop: 12, animation: 'fadeIn 0.2s ease' }}>
                    {/* Curl */}
                    <div style={{ marginBottom: 16 }}>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
                        <span style={{ fontSize: 11, fontWeight: 600, color: 'var(--ink-faint)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>cURL</span>
                        <button
                          onClick={() => copyCurl(method.curl)}
                          style={{
                            background: 'transparent',
                            border: '1px solid var(--line)',
                            borderRadius: 6,
                            cursor: 'pointer',
                            color: 'var(--ink-faint)',
                            fontSize: 11,
                            padding: '4px 10px',
                            display: 'flex',
                            alignItems: 'center',
                            gap: 4,
                            transition: 'all 0.15s',
                          }}
                          onMouseEnter={(e) => {
                            (e.currentTarget as HTMLButtonElement).style.borderColor = 'var(--accent)';
                            (e.currentTarget as HTMLButtonElement).style.color = 'var(--accent)';
                          }}
                          onMouseLeave={(e) => {
                            (e.currentTarget as HTMLButtonElement).style.borderColor = 'var(--line)';
                            (e.currentTarget as HTMLButtonElement).style.color = 'var(--ink-faint)';
                          }}
                        >
                          <Copy size={12} />
                          {copied ? 'Disalin!' : 'Salin'}
                        </button>
                      </div>
                      <pre style={{
                        background: 'var(--surface-2)',
                        border: '1px solid var(--line)',
                        borderRadius: 10,
                        padding: '14px 16px',
                        fontSize: 12,
                        fontFamily: '"IBM Plex Mono", monospace',
                        color: 'var(--ink)',
                        overflowX: 'auto',
                        whiteSpace: 'pre-wrap',
                        wordBreak: 'break-all',
                        lineHeight: 1.6,
                      }}>
                        {method.curl}
                      </pre>
                    </div>

                    {/* Response */}
                    <div>
                      <span style={{ fontSize: 11, fontWeight: 600, color: 'var(--ink-faint)', textTransform: 'uppercase', letterSpacing: '0.05em', display: 'block', marginBottom: 8 }}>Response</span>
                      <pre style={{
                        background: 'var(--surface-2)',
                        border: '1px solid var(--line)',
                        borderRadius: 10,
                        padding: '14px 16px',
                        fontSize: 12,
                        fontFamily: '"IBM Plex Mono", monospace',
                        color: 'var(--ok)',
                        overflowX: 'auto',
                        whiteSpace: 'pre-wrap',
                        wordBreak: 'break-all',
                        lineHeight: 1.6,
                      }}>
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

      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(-8px); }
          to { opacity: 1; transform: translateY(0); }
        }
        
        /* Mobile responsive */
        @media (max-width: 767px) {
          .api-sidebar {
            position: absolute;
            inset: 0;
            z-index: 10;
            background: var(--surface);
          }
          .mobile-menu-btn {
            display: inline-flex !important;
          }
        }
        
        @media (min-width: 768px) {
          .mobile-menu-btn {
            display: none !important;
          }
        }
      `}</style>
    </div>
  );
}
