import type { Metadata } from 'next';
import Link from 'next/link';
import { scholarships } from '@/lib/data';
import { tanggal, sisaHari } from '@/components/ui';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

export const revalidate = 1800;

export const metadata: Metadata = {
  title: 'Jadwal dan tenggat beasiswa',
  description: 'Pantau tenggat pendaftaran beasiswa terkini dari sumber resmi.',
  alternates: { canonical: '/jadwal' },
  openGraph: { title: 'Jadwal Tenggat Beasiswa — SakuKampus', url: '/jadwal' },
};

const DEADLINE_STAGES = new Set(['pendaftaran', 'pendaftaran_akun', 'mandiri_ptn_pts']);

export default function JadwalPage() {
  const now = Date.now();
  const baris = scholarships.flatMap((s) =>
    s.stages.filter((st) => DEADLINE_STAGES.has(st.name) && st.closes_at).map((st) => ({
      slug: s.slug,
      nama: s.name,
      penyelenggara: s.provider,
      tenggat: Date.parse(st.closes_at!),
      buka: st.opens_at ? Date.parse(st.opens_at) : null,
      sumber: s.source_url,
      daftar: s.url_pendaftaran ?? null,
    }))
  );

  const mendatang = baris.filter((r) => r.tenggat >= now).sort((a, b) => a.tenggat - b.tenggat);
  const lewat = baris.filter((r) => r.tenggat < now).sort((a, b) => b.tenggat - a.tenggat);

  return (
    <div className="wrap">
      <main>
        <section className="hero" style={{ paddingBottom: 28 }}>
          <Badge variant="secondary" style={{ marginBottom: 12, fontSize: 12 }}>
            Kalender Beasiswa
          </Badge>
          <h1 className="hero-title" style={{ fontSize: 'clamp(22px, 4vw, 32px)' }}>
            Jadwal dan tenggat
          </h1>
          <p className="hero-sub">
            Diurutkan dari tenggat terdekat. Periksa ulang di sumber sebelum menutup pendaftaran.
          </p>
        </section>

        {/* Upcoming */}
        <section className="section" style={{ paddingTop: 0 }}>
          <div className="section-head">
            <span className="section-title">Masih bisa didaftar</span>
            <span className="tiny faint">{mendatang.length} tahap terbuka</span>
          </div>

          {mendatang.length === 0 ? (
            <Card>
              <CardContent style={{ textAlign: 'center', padding: '48px 24px' }}>
                <p style={{ fontWeight: 600, color: 'var(--ink)', margin: '0 0 6px' }}>Belum ada tenggat yang akan datang.</p>
                <p className="tiny faint" style={{ margin: '0 0 16px' }}>Siklus berikutnya biasanya mengikuti pola tahun sebelumnya.</p>
                <Link href="/beasiswa">
                  <button className="btn btn-sm">Tampilkan semua</button>
                </Link>
              </CardContent>
            </Card>
          ) : (
            <div style={{ display: 'grid', gap: 12 }}>
              {mendatang.map((r) => {
                const hari = sisaHari(r.tenggat);
                const mendesak = hari <= 7;
                return (
                  <Card key={r.slug} style={mendesak ? { borderColor: 'var(--warn)', background: 'var(--warn-dim)' } : undefined}>
                    <CardContent style={{ padding: '20px 24px' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 16 }}>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ fontWeight: 600, fontSize: 15, color: 'var(--ink)', marginBottom: 4 }}>{r.nama}</div>
                          <div className="tiny faint">{r.penyelenggara}</div>
                          <div className="tiny faint" style={{ marginTop: 8, fontFamily: 'monospace' }}>
                            {tanggal(r.tenggat)}
                            {r.buka !== null && <> · Dibuka {tanggal(r.buka)}</>}
                          </div>
                          <div style={{ display: 'flex', gap: 12, marginTop: 12 }}>
                            {r.daftar && (
                              <Link href={r.daftar} target="_blank" rel="noreferrer" style={{ color: 'var(--accent)', fontWeight: 600, textDecoration: 'none', fontSize: 13 }}>
                                Daftar →
                              </Link>
                            )}
                            <a href={r.sumber} target="_blank" rel="noreferrer" style={{ color: 'var(--ink-faint)', fontSize: 13, textDecoration: 'underline', textUnderlineOffset: 3 }}>
                              Sumber
                            </a>
                          </div>
                        </div>
                        <div style={{ textAlign: 'right', flexShrink: 0 }}>
                          <div className="mono" style={{ fontSize: 28, fontWeight: 700, color: mendesak ? 'var(--warn)' : 'var(--ink)', lineHeight: 1 }}>
                            {hari <= 0 ? 'Hari ini' : hari}
                          </div>
                          <div className="tiny faint" style={{ marginTop: 4 }}>{hari > 0 ? 'hari lagi' : ''}</div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </section>

        {/* Past */}
        {lewat.length > 0 && (
          <section className="section-tight">
            <details style={{ border: '1px solid var(--line)', borderRadius: 'var(--radius)', overflow: 'hidden', background: 'var(--surface)' }}>
              <summary style={{ padding: '16px 20px', cursor: 'pointer', fontSize: 14, fontWeight: 500, color: 'var(--ink-dim)', display: 'flex', alignItems: 'center', gap: 8 }}>
                ← {lewat.length} tahap sudah tutup
              </summary>
              <div style={{ borderTop: '1px solid var(--line)' }}>
                {lewat.map((r) => (
                  <div key={r.slug} style={{ padding: '14px 20px', borderBottom: '1px solid var(--line)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                      <div className="tiny" style={{ fontWeight: 500, color: 'var(--ink)' }}>{r.nama}</div>
                      <div className="tiny faint">{r.penyelenggara}</div>
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
