'use client';

import { useState } from 'react';
import ApiDocModal from '@/components/ui/api-doc-modal';

const API_ENDPOINTS = [
  ['/api/v1/institutions', 'Cari kampus atau ambil detail UKT'],
  ['/api/v1/scholarships', 'Katalog beasiswa dengan jadwal dan syarat'],
  ['/api/v1/calendar', 'Semua tenggat, terurut'],
  ['/api/v1/meta/sources', 'Halaman ini dalam JSON'],
  ['/api/v1/eligibility/check', 'Periksa kelayakan (POST)'],
] as const;

export default function DataPageClient() {
  const [showApiDocs, setShowApiDocs] = useState(false);

  return (
    <>
      <div className="data-section-title" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
        <span>API publik</span>
        <button
          onClick={() => setShowApiDocs(true)}
          style={{
            padding: '6px 12px',
            borderRadius: 8,
            border: '1px solid var(--line)',
            background: 'var(--surface-2)',
            color: 'var(--ink-dim)',
            fontSize: 12,
            cursor: 'pointer',
            transition: 'all .15s',
          }}
          onMouseEnter={(e) => {
            (e.currentTarget as HTMLButtonElement).style.borderColor = 'var(--accent)';
            (e.currentTarget as HTMLButtonElement).style.color = 'var(--accent)';
          }}
          onMouseLeave={(e) => {
            (e.currentTarget as HTMLButtonElement).style.borderColor = 'var(--line)';
            (e.currentTarget as HTMLButtonElement).style.color = 'var(--ink-dim)';
          }}
        >
          Lihat dokumentasi
        </button>
      </div>
      <p className="tiny faint" style={{ marginBottom: 12 }}>Semua data tersedia lewat API tanpa kunci.</p>
      <div className="grouped">
        {API_ENDPOINTS.map(([path, desc]) => (
          <div
            key={path}
            className="grid-row"
            style={{ padding: '12px 16px', cursor: 'pointer' }}
            onClick={() => setShowApiDocs(true)}
          >
            <code className="mono" style={{ fontSize: 13, color: 'var(--accent)', fontWeight: 500 }}>{path}</code>
            <span className="tiny faint">{desc}</span>
          </div>
        ))}
      </div>
      {showApiDocs && <ApiDocModal onClose={() => setShowApiDocs(false)} />}
    </>
  );
}
