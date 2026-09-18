import type { Metadata } from 'next';
import Link from 'next/link';
import { scholarships } from '@/lib/data';
import { Section, tanggal, sisaHari } from '@/components/ui';

export const revalidate = 1800;

export const metadata: Metadata = {
  title: 'Jadwal dan tenggat beasiswa',
  description:
    'Pantau tenggat pendaftaran beasiswa terkini. Diurutkan berdasarkan countdown hari tersisa. Peringatan otomatis untuk tenggat <7 hari.',
  alternates: {
    canonical: '/jadwal',
  },
  openGraph: {
    title: 'Jadwal Tenggat Beasiswa — SakuKampus',
    url: '/jadwal',
    description: 'Countdown tenggat pendaftaran beasiswa dari sumber resmi.',
  },
};

const DEADLINE_STAGES = new Set(['pendaftaran', 'pendaftaran_akun', 'mandiri_ptn_pts']);

export default function JadwalPage() {
  const now = Date.now();

  const baris = scholarships.flatMap((s) =>
    s.stages
      .filter((st) => DEADLINE_STAGES.has(st.name) && st.closes_at)
      .map((st) => ({
        slug: s.slug,
        nama: s.name,
        penyelenggara: s.provider,
        tenggat: Date.parse(st.closes_at!),
        buka: st.opens_at ? Date.parse(st.opens_at) : null,
        sumber: s.source_url,
        daftar: s.url_pendaftaran ?? null,
      })),
  );

  const mendatang = baris.filter((r) => r.tenggat >= now).sort((a, b) => a.tenggat - b.tenggat);
  const lewat = baris.filter((r) => r.tenggat < now).sort((a, b) => b.tenggat - a.tenggat);

  return (
    <div className="wrap">
      <main>
        {/* Header */}
        <section className="hero" style={{ paddingBottom: 28 }}>
          <h1 className="hero-title" style={{ fontSize: 'clamp(22px, 4vw, 32px)' }}>
            Jadwal dan tenggat
          </h1>
          <p className="hero-sub">
            Diurutkan dari tenggat terdekat. Periksa ulang di sumber sebelum menutup pendaftaran.
          </p>
        </section>

        {/* Upcoming deadlines */}
        <section className="section" style={{ paddingTop: 0 }}>
          <div className="section-head">
            <span className="section-title">Masih bisa didaftar</span>
            <span className="tiny faint">{mendatang.length} tahap</span>
          </div>

          {mendatang.length === 0 ? (
            <div className="card" style={{ textAlign: 'center', padding: '40px 24px' }}>
              <p style={{ fontWeight: 600, color: 'var(--ink)', margin: '0 0 6px' }}>
                Belum ada tenggat yang akan datang.
              </p>
              <p className="tiny" style={{ margin: '0 0 16px' }}>
                Siklus berikutnya biasanya mengikuti pola tahun sebelumnya.
              </p>
              <Link href="/beasiswa" className="btn btn-sm">
                Lihat katalog beasiswa
              </Link>
            </div>
          ) : (
            <div className="grouped">
              {mendatang.map((r) => {
                const hari = sisaHari(r.tenggat);
                const mendesak = hari <= 7;
                return (
                  <div key={r.slug} className={`jadwal-row${mendesak ? ' urgent' : ''}`}>
                    <div className="jadwal-info">
                      <div className="jadwal-name">{r.nama}</div>
                      <div className="jadwal-provider">{r.penyelenggara}</div>
                      <div className="jadwal-dates">
                        <span className="mono">{tanggal(r.tenggat)}</span>
                        {r.buka !== null && <> · dibuka {tanggal(r.buka)}</>}
                      </div>
                      <div style={{ display: 'flex', gap: 12, marginTop: 8 }}>
                        {r.daftar && (
                          <Link href={r.daftar} target="_blank" rel="noreferrer" className="tiny" style={{ color: 'var(--accent)', fontWeight: 600, textDecoration: 'none' }}>
                            Daftar →
                          </Link>
                        )}
                        <a href={r.sumber} target="_blank" rel="noreferrer" className="tiny faint" style={{ textDecoration: 'underline', textUnderlineOffset: 3 }}>
                          Sumber
                        </a>
                      </div>
                    </div>
                    <div className="jadwal-countdown">
                      <div className={`jadwal-days${mendesak ? ' urgent' : ''}`}>
                        {hari <= 0 ? 'hari ini' : hari}
                      </div>
                      {hari > 0 && <div className="jadwal-label">hari lagi</div>}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </section>

        {/* Past deadlines */}
        {lewat.length > 0 && (
          <section className="section-tight">
            <details style={{ border: '1px solid var(--line)', borderRadius: 'var(--radius)', overflow: 'hidden', background: 'var(--surface)' }}>
              <summary style={{ padding: '14px 18px', cursor: 'pointer', fontSize: 14, fontWeight: 500, color: 'var(--ink-dim)', display: 'flex', alignItems: 'center', gap: 8 }}>
                ← {lewat.length} tahap sudah tutup
              </summary>
              <div style={{ borderTop: '1px solid var(--line)' }}>
                {lewat.map((r) => (
                  <div key={r.slug} className="jadwal-row" style={{ padding: '12px 18px' }}>
                    <div>
                      <div className="jadwal-name" style={{ fontSize: 13 }}>{r.nama}</div>
                      <div className="jadwal-provider" style={{ fontSize: 12 }}>{r.penyelenggara}</div>
                    </div>
                    <span className="mono tiny faint">{tanggal(r.tenggat)}</span>
                  </div>
                ))}
              </div>
            </details>
          </section>
        )}
      </main>
    </div>
  );
}