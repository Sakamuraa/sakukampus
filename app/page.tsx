import Link from 'next/link';
import { ArrowRight } from '@phosphor-icons/react/dist/ssr/ArrowRight';
import { institutions, scholarships, seedsMeta } from '@/lib/data';
import { stageStatus } from '@/lib/match';
import { rp, tanggal } from '@/components/ui';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

export const revalidate = 3600;

export default function Home() {
  const now = Date.now();
  const denganUkt = institutions.filter((i) => i.ukt).length;
  const buka = scholarships
    .map((s) => ({ s, st: stageStatus(s, now) }))
    .filter((x) => x.st === 'buka')
    .slice(0, 4);

  return (
    <div className="wrap">
      <main>
        {/* Hero Section */}
        <section className="hero">
          <div style={{ display: 'grid', gap: 40, alignItems: 'center' }}>
            <div>
              <Badge variant="secondary" style={{ marginBottom: 16, fontSize: 12 }}>
                Platform Beasiswa Mahasiswa Indonesia
              </Badge>
              <h1 className="hero-title">
                UKT riil. Beasiswa cocok.
              </h1>
              <p className="hero-sub" style={{ marginTop: 16 }}>
                SakuKampus menilai kelayakan beasiswamu dari nominal rupiah UKT yang benar-benar kamu bayar — bukan sekadar nomor golongan.
              </p>
              <div className="hero-actions" style={{ marginTop: 24, display: 'flex', gap: 12 }}>
                <Link href="/cek">
                  <Button size="lg">
                    Cek kelayakanku
                    <ArrowRight size={16} weight="bold" />
                  </Button>
                </Link>
                <Link href="/beasiswa">
                  <Button variant="outline" size="lg">
                    Lihat katalog
                  </Button>
                </Link>
              </div>
            </div>

            {/* Comparison visual */}
            <ComparisonCard />
          </div>
        </section>

        {/* How it works */}
        <section className="section">
          <div className="section-head">
            <span className="section-title">Cara penilaiannya</span>
          </div>
          <div style={{ display: 'grid', gap: 12, gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))' }}>
            {[
              { n: '1', t: 'Beasiswa nasional dinilai dengan plafon rupiah', d: "Syarat ditulis sebagai 'UKT maksimal Rp2.400.000', bukan 'golongan 1 sampai 4'." },
              { n: '2', t: 'Nomor golongan hanya sah untuk beasiswa satu kampus', d: "Beasiswa internal UIN Jakarta boleh menyebut golongan, karena hanya berlaku di sana." },
              { n: '3', t: 'Prioritas bukan syarat wajib', d: 'Kriteria bertanda prioritas dicatat sebagai catatan dan tidak pernah menggugurkan.' },
              { n: '4', t: 'Data kurang berarti perlu data, bukan tidak lolos', d: 'Kami tidak memberi vonis dari data yang belum kamu isi.' },
            ].map((row) => (
              <Card key={row.n}>
                <CardContent style={{ padding: '20px 24px' }}>
                  <div style={{ display: 'flex', gap: 16, alignItems: 'flex-start' }}>
                    <div style={{ 
                      width: 32, 
                      height: 32, 
                      borderRadius: '50%', 
                      background: 'var(--accent-dim)', 
                      color: 'var(--accent)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontWeight: 700,
                      fontSize: 14,
                      flexShrink: 0
                    }}>
                      {row.n}
                    </div>
                    <div>
                      <div style={{ fontWeight: 600, fontSize: 15, color: 'var(--ink)', marginBottom: 4 }}>
                        {row.t}
                      </div>
                      <div className="tiny faint" style={{ lineHeight: 1.55 }}>
                        {row.d}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>

        {/* Open Scholarships */}
        {buka.length > 0 && (
          <section className="section-tight">
            <div className="section-head">
              <div>
                <span className="section-title">Sedang dibuka</span>
                <p className="tiny faint" style={{ marginTop: 3 }}>
                  Per {tanggal(now)}. Tenggat lengkap di halaman jadwal.
                </p>
              </div>
              <Link href="/jadwal" style={{ fontWeight: 600, color: 'var(--accent)', textDecoration: 'none', fontSize: 13 }}>
                Semua jadwal →
              </Link>
            </div>
            <div className="rail">
              {buka.map(({ s }) => (
                <article key={s.slug} className="card" style={{ minWidth: 280, maxWidth: 320, flex: '0 0 auto' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
                    <h3 style={{ margin: 0, flex: 1, minWidth: 0, fontSize: 15, fontWeight: 600, color: 'var(--ink)' }}>{s.name}</h3>
                    <span className="badge badge-ok" style={{ flexShrink: 0 }}>Buka</span>
                  </div>
                  <p className="tiny" style={{ margin: '0 0 8px', color: 'var(--ink-faint)' }}>{s.provider}</p>
                  {s.ukt_max_idr !== undefined && (
                    <p className="tiny" style={{ margin: '0 0 4px', color: 'var(--ink-dim)' }}>
                      Plafon UKT <span className="mono" style={{ color: 'var(--ink)', fontWeight: 600 }}>{rp(s.ukt_max_idr)}</span>
                    </p>
                  )}
                  {s.ukt_max_golongan !== undefined && (
                    <p className="tiny" style={{ margin: '0 0 12px', color: 'var(--ink-dim)' }}>
                      Prioritas gol. 1–{s.ukt_max_golongan}
                    </p>
                  )}
                  <Link href="/cek" style={{ display: 'inline-flex', alignItems: 'center', gap: 4, fontWeight: 600, color: 'var(--accent)', textDecoration: 'none', fontSize: 13 }}>
                    Cek syaratku <ArrowRight size={12} />
                  </Link>
                </article>
              ))}
            </div>
          </section>
        )}

        {/* Stats */}
        <section className="section-tight">
          <div className="section-head">
            <div>
              <span className="section-title">Cakupan data</span>
              <p className="tiny faint" style={{ marginTop: 3 }}>
                Diperbarui setiap kali dekrit UKT atau jadwal baru terbit.
              </p>
            </div>
          </div>
          <div style={{ display: 'grid', gap: 12, gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))' }}>
            {[
              { k: 'Kampus terindeks', v: institutions.length.toLocaleString('id-ID'), s: 'PDDikti' },
              { k: 'Kampus berdata UKT', v: denganUkt.toLocaleString('id-ID'), s: 'KMA 204/2026' },
              { k: 'Baris prodi berdata', v: Number(seedsMeta.ukt.prodi).toLocaleString('id-ID'), s: 'KMA 204/2026' },
              { k: 'Beasiswa tersimpan', v: scholarships.length.toLocaleString('id-ID'), s: 'Pengumuman resmi' },
            ].map((row) => (
              <Card key={row.k}>
                <CardContent style={{ padding: '20px 24px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
                    <div>
                      <div className="stat-label">{row.k}</div>
                      <div className="stat-source">{row.s}</div>
                    </div>
                    <div className="stat-value">{row.v}</div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>

        {/* CTA */}
        <section className="section-tight">
          <Card style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 24, flexWrap: 'wrap' }}>
            <div>
              <h2 style={{ margin: '0 0 8px', fontSize: 18 }}>Kampusmu belum ada data UKT?</h2>
              <p className="tiny faint" style={{ margin: 0, maxWidth: '48ch' }}>
                Isi nominal UKT yang kamu bayar. Perhitungannya jalan, hasilnya ditandai belum diverifikasi.
              </p>
            </div>
            <Link href="/cek">
              <Button>Mulai dari kampusku</Button>
            </Link>
          </Card>
        </section>
      </main>
    </div>
  );
}

function ComparisonCard() {
  const jakarta = institutions.find((i) => i.kode === '201001')?.ukt;
  const malang = institutions.find((i) => i.kode === '201003')?.ukt;
  const ti = (pt: typeof jakarta) => pt?.prodi.find((p) => p.prodi === 'Teknik Informatika');
  const a = ti(jakarta);
  const b = ti(malang);

  if (!a || !b) return null;

  return (
    <Card style={{ minWidth: 300 }}>
      <CardHeader>
        <CardTitle style={{ fontSize: 14 }}>Prodi Teknik Informatika · Golongan 2</CardTitle>
        <CardDescription>Perbandingan nominal UKT antar kampus</CardDescription>
      </CardHeader>
      <CardContent>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
          <div style={{ textAlign: 'center', padding: 16, background: 'var(--surface-2)', borderRadius: 8 }}>
            <div className="tiny faint" style={{ marginBottom: 4 }}>UIN Jakarta</div>
            <div className="mono" style={{ fontSize: 20, fontWeight: 700, color: 'var(--ink)' }}>
              {rp(a.gol[1])}
            </div>
          </div>
          <div style={{ textAlign: 'center', padding: 16, background: 'var(--surface-2)', borderRadius: 8 }}>
            <div className="tiny faint" style={{ marginBottom: 4 }}>UIN Malang</div>
            <div className="mono" style={{ fontSize: 20, fontWeight: 700, color: 'var(--ink)' }}>
              {rp(b.gol[1])}
            </div>
          </div>
        </div>
        <div style={{ marginTop: 16, padding: '12px 16px', background: 'var(--ok-dim)', borderRadius: 8, borderLeft: '3px solid var(--ok)' }}>
          <div className="tiny" style={{ color: 'var(--ok)', fontWeight: 600 }}>
            Selisih 2,6× untuk golongan yang sama
          </div>
          <div className="tiny faint" style={{ marginTop: 4 }}>
            Penilaian memakai rupiah, bukan nomor golongan
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
