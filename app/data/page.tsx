import type { Metadata } from 'next';
import { institutions, scholarships, seedsMeta } from '@/lib/data';
import DataPageClient from './DataPageClient';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

export const revalidate = 600;

export const metadata: Metadata = {
  title: 'Status data dan sumber',
  description: 'Audit transparansi data SakuKampus. Sumber UKT dari KMA 204/2026, katalog kampus dari PDDikti.',
  alternates: { canonical: '/data' },
  openGraph: { title: 'Status Data & Sumber — SakuKampus', url: '/data' },
};

const n = (x: unknown) => Number(x).toLocaleString('id-ID');

function InfoRow({ k, v, mono }: { k: string; v: string; mono?: boolean }) {
  return (
    <tr>
      <td style={{ color: 'var(--ink-faint)', fontSize: 13, width: '40%', padding: '12px 0' }}>{k}</td>
      <td style={{ fontWeight: 500, fontSize: 13, padding: '12px 0', fontFamily: mono ? 'monospace' : 'inherit' }}>{v}</td>
    </tr>
  );
}

export default function DataPage() {
  const denganUkt = institutions.filter((i) => i.ukt).length;
  const tanpaUkt = institutions.length - denganUkt;
  const lengkap = Number(seedsMeta.ukt.prodiGolonganLengkap);
  const totalProdi = Number(seedsMeta.ukt.prodi);
  const sebagian = totalProdi - lengkap;
  const generatedAt = seedsMeta.institutions.generated_at 
    ? new Date(seedsMeta.institutions.generated_at as string).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })
    : '-';
  const verifiedAt = new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' });

  return (
    <div className="wrap">
      <main>
        <section className="hero" style={{ paddingBottom: 28 }}>
          <Badge variant="secondary" style={{ marginBottom: 12, fontSize: 12 }}>
            Transparansi Data
          </Badge>
          <h1 className="hero-title" style={{ fontSize: 'clamp(22px, 4vw, 32px)' }}>
            Status data dan sumber
          </h1>
          <p className="hero-sub">
            Asal setiap angka, kapan terakhir diambil, dan apa yang masih belum lengkap.
          </p>
        </section>

        {/* Kampus */}
        <section className="section" style={{ paddingTop: 0 }}>
          <Card>
            <CardHeader>
              <CardTitle>Katalog kampus</CardTitle>
              <CardDescription>Data institusi pendidikan tinggi Indonesia</CardDescription>
            </CardHeader>
            <CardContent>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <tbody>
                  <InfoRow k="Kampus terindeks" v={n(seedsMeta.institutions.count)} />
                  <InfoRow k="Diambil terakhir" v={generatedAt} />
                  <InfoRow k="Sumber" v="api-pddikti.kemdiktisaintek.go.id" mono />
                </tbody>
              </table>
              <p className="tiny faint" style={{ marginTop: 16, lineHeight: 1.55 }}>
                API PDDikti mensyaratkan header <code style={{ background: 'var(--surface-2)', padding: '2px 6px', borderRadius: 4, fontFamily: 'monospace' }}>Origin</code> yang tepat. Paginasi diabaikan, jadi katalog disusun per kata kunci.
              </p>
            </CardContent>
          </Card>

          {/* UKT */}
          <Card style={{ marginTop: 16 }}>
            <CardHeader>
              <CardTitle>Nominal UKT per golongan</CardTitle>
              <CardDescription>Dasar perhitungan kelayakan beasiswa</CardDescription>
            </CardHeader>
            <CardContent>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <tbody>
                  <InfoRow k="Dekrit" v={String(seedsMeta.ukt.decree)} />
                  <InfoRow k="Tahun akademik" v={String(seedsMeta.ukt.academic_year)} />
                  <InfoRow k="PTKIN tercakup" v={n(seedsMeta.ukt.ptkin)} />
                  <InfoRow k="Baris prodi" v={n(seedsMeta.ukt.prodi)} />
                  <InfoRow k="Golongan lengkap 1–7" v={n(lengkap)} />
                  <InfoRow k="Kampus dengan data UKT" v={String(denganUkt)} />
                </tbody>
              </table>
              <div style={{ marginTop: 16, padding: '14px 16px', background: 'var(--ok-dim)', borderRadius: 8, borderLeft: '3px solid var(--ok)' }}>
                <div style={{ fontWeight: 600, fontSize: 14, color: 'var(--ok)', margin: '0 0 4px' }}>
                  Nomor golongan tidak sebanding antar kampus
                </div>
                <p className="tiny" style={{ margin: 0, color: 'var(--ink-dim)', lineHeight: 1.55 }}>
                  Golongan 2 di UIN Jakarta = Rp4.270.000, di UIN Malang = Rp1.653.000. Beasiswa lintas kampus dinilai memakai plafon rupiah.
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Beasiswa */}
          <Card style={{ marginTop: 16 }}>
            <CardHeader>
              <CardTitle>Katalog beasiswa</CardTitle>
              <CardDescription>Data beasiswa yang dipantau</CardDescription>
            </CardHeader>
            <CardContent>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <tbody>
                  <InfoRow k="Entri beasiswa" v={n(scholarships.length)} />
                  <InfoRow k="Dari sumber resmi" v={n(scholarships.filter((s) => s.source_kind === 'resmi').length)} />
                  <InfoRow k="Dari agregator" v={n(scholarships.filter((s) => s.source_kind === 'agregator').length)} />
                  <InfoRow k="Pemeriksaan terakhir" v={verifiedAt} />
                </tbody>
              </table>
            </CardContent>
          </Card>

          {/* Limitations */}
          <Card style={{ marginTop: 16 }}>
            <CardHeader>
              <CardTitle>Yang masih belum lengkap</CardTitle>
            </CardHeader>
            <CardContent>
              <div style={{ display: 'grid', gap: 10 }}>
                {[
                  `${n(tanpaUkt)} dari ${n(institutions.length)} kampus belum punya tabel UKT terverifikasi.`,
                  `${n(sebagian)} dari ${n(totalProdi)} baris prodi hanya mencantumkan sebagian golongan.`,
                  'Sebagian blok PTKIN memakai nama berbeda dari katalog PDDikti.',
                ].map((text, i) => (
                  <div key={i} style={{ padding: '12px 16px', background: 'var(--surface-2)', borderRadius: 8, borderLeft: '3px solid var(--warn)', fontSize: 13, color: 'var(--ink-dim)', lineHeight: 1.55 }}>
                    {text}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* API */}
          <div style={{ marginTop: 32 }}>
            <DataPageClient />
          </div>
        </section>
      </main>
    </div>
  );
}
