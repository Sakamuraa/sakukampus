'use client';

import type { Metadata } from 'next';
import { institutions, scholarships, seedsMeta } from '@/lib/data';
import { Section, tanggal } from '@/components/ui';
import ApiDocModal from '@/components/ui/api-doc-modal';
import { useState } from 'react';

export const revalidate = 600;

export const metadata: Metadata = {
  title: 'Status data dan sumber',
  description:
    'Audit transparansi data SakuKampus. Sumber UKT dari KMA 204/2026, katalog kampus dari PDDikti, jadwal dari pengumuman resmi. Termasuk daftar API publik.',
  alternates: {
    canonical: '/data',
  },
  openGraph: {
    title: 'Status Data & Sumber — SakuKampus',
    url: '/data',
    description: 'Transparansi asal data UKT, kampus, dan beasiswa.',
  },
};

const n = (x: unknown) => Number(x).toLocaleString('id-ID');

function Row({ k, v, mono }: { k: string; v: string; mono?: boolean }) {
  return (
    <tr>
      <td style={{ color: 'var(--ink-dim)', fontSize: 13, width: '40%' }}>{k}</td>
      <td className={mono ? 'mono' : ''} style={{ fontWeight: 500, fontSize: 13 }}>{v}</td>
    </tr>
  );
}

export default function DataPage() {
  const denganUkt = institutions.filter((i) => i.ukt).length;
  const tanpaUkt = institutions.length - denganUkt;
  const lengkap = Number(seedsMeta.ukt.prodiGolonganLengkap);
  const totalProdi = Number(seedsMeta.ukt.prodi);
  const sebagian = totalProdi - lengkap;
  const [showApiDocs, setShowApiDocs] = useState(false);

  return (
    <div className="wrap">
      <main>
        {/* Header */}
        <section className="hero" style={{ paddingBottom: 28 }}>
          <h1 className="hero-title" style={{ fontSize: 'clamp(22px, 4vw, 32px)' }}>
            Status data dan sumber
          </h1>
          <p className="hero-sub">
            Asal setiap angka, kapan terakhir diambil, dan apa yang masih belum lengkap.
          </p>
        </section>

        {/* Kampus */}
        <section className="section" style={{ paddingTop: 0 }}>
          <div className="data-section">
            <div className="data-section-title">Katalog kampus</div>
            <table className="data-table">
              <tbody>
                <Row k="Kampus terindeks" v={n(seedsMeta.institutions.count)} />
                <Row k="Diambil" v={tanggal(seedsMeta.institutions.generated_at as string)} />
                <Row k="Sumber" v="api-pddikti.kemdiktisaintek.go.id" mono />
              </tbody>
            </table>
            <p className="tiny faint" style={{ marginTop: 12, lineHeight: 1.55 }}>
              API PDDikti mensyaratkan header <code>Origin</code> yang tepat. Paginasi diabaikan, jadi katalog disusun per kata kunci.
            </p>
          </div>

          {/* UKT */}
          <div className="data-section" style={{ marginTop: 32 }}>
            <div className="data-section-title">Nominal UKT per golongan</div>
            <table className="data-table">
              <tbody>
                <Row k="Dekrit" v={String(seedsMeta.ukt.decree)} />
                <Row k="Tahun akademik" v={String(seedsMeta.ukt.academic_year)} />
                <Row k="PTKIN tercakup" v={n(seedsMeta.ukt.ptkin)} />
                <Row k="Baris prodi" v={n(seedsMeta.ukt.prodi)} />
                <Row k="Golongan lengkap 1–7" v={n(lengkap)} />
                <Row k="Kampus dengan data UKT" v={String(denganUkt)} />
              </tbody>
            </table>
            <div className="card" style={{ marginTop: 14, background: 'var(--ok-dim)', borderColor: 'rgba(52, 211, 153, 0.2)' }}>
              <p style={{ margin: '0 0 4px', fontWeight: 600, color: 'var(--ok)', fontSize: 14 }}>
                Nomor golongan tidak sebanding antar kampus
              </p>
              <p className="tiny" style={{ margin: 0, color: 'var(--ink-dim)', lineHeight: 1.55 }}>
                Golongan 2 di UIN Jakarta = Rp4.270.000, di UIN Malang = Rp1.653.000. Beasiswa lintas kampus dinilai memakai plafon rupiah.
              </p>
            </div>
          </div>

          {/* Beasiswa */}
          <div className="data-section" style={{ marginTop: 32 }}>
            <div className="data-section-title">Beasiswa</div>
            <table className="data-table">
              <tbody>
                <Row k="Entri beasiswa" v={n(scholarships.length)} />
                <Row k="Dari sumber resmi" v={n(scholarships.filter((s) => s.source_kind === 'resmi').length)} />
                <Row k="Dari agregator" v={n(scholarships.filter((s) => s.source_kind === 'agregator').length)} />
                <Row k="Pemeriksaan terakhir" v={tanggal(scholarships[0]?.last_verified_at ?? new Date().toISOString())} />
              </tbody>
            </table>
          </div>

          {/* Limitations */}
          <div className="data-section" style={{ marginTop: 32 }}>
            <div className="data-section-title">Yang masih belum lengkap</div>
            <div style={{ display: 'grid', gap: 10 }}>
              {[
                `${n(tanpaUkt)} dari ${n(institutions.length)} kampus belum punya tabel UKT terverifikasi.`,
                `${n(sebagian)} dari ${n(totalProdi)} baris prodi hanya mencantumkan sebagian golongan.`,
                'Sebagian blok PTKIN memakai nama berbeda dari katalog PDDikti.',
              ].map((text, i) => (
                <div key={i} className="notice" style={{ fontSize: 13, lineHeight: 1.55 }}>
                  {text}
                </div>
              ))}
            </div>
          </div>

          {/* API */}
          <div className="data-section" style={{ marginTop: 32 }}>
            <div className="data-section-title" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
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
              {[
                ['/api/v1/institutions', 'Cari kampus atau ambil detail UKT'],
                ['/api/v1/scholarships', 'Katalog beasiswa dengan jadwal dan syarat'],
                ['/api/v1/calendar', 'Semua tenggat, terurut'],
                ['/api/v1/meta/sources', 'Halaman ini dalam JSON'],
                ['/api/v1/eligibility/check', 'Periksa kelayakan (POST)'],
              ].map(([path, desc]) => (
                <div key={path as string} className="grid-row" style={{ padding: '12px 16px', cursor: 'pointer' }}
                  onClick={() => setShowApiDocs(true)}
                >
                  <code className="mono" style={{ fontSize: 13, color: 'var(--accent)', fontWeight: 500 }}>{path}</code>
                  <span className="tiny faint">{desc}</span>
                </div>
              ))}
            </div>
          </div>
        </section>
      </main>

      {/* API Docs Modal */}
      {showApiDocs && <ApiDocModal onClose={() => setShowApiDocs(false)} />}
    </div>
  );
}
