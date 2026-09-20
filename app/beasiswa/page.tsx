import type { Metadata } from 'next';
import Link from 'next/link';
import { scholarships } from '@/lib/data';
import { stageStatus, type StageStatus } from '@/lib/match';
import { rp, tanggal, STAGE_LABEL, TIER_LABEL } from '@/components/ui';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';

export const revalidate = 3600;

export const metadata: Metadata = {
  title: 'Katalog beasiswa',
  description:
    '14+ beasiswa kampus, pemerintah, dan swasta untuk mahasiswa Indonesia. Syarat UKT ditulis dalam rupiah sesuai dekrit KMA 204/2026.',
  alternates: { canonical: '/beasiswa' },
  openGraph: {
    title: 'Katalog Beasiswa — SakuKampus',
    url: '/beasiswa',
    description: 'Filter 14+ beasiswa berdasarkan jenjang dan status pendaftaran.',
  },
};

const TIERS = ['kampus', 'pemerintah', 'swasta'] as const;
const STATUS_BADGE: Record<StageStatus, { label: string; variant: 'default' | 'secondary' | 'outline' }> = {
  buka: { label: 'Buka', variant: 'default' },
  akan_datang: { label: 'Akan dibuka', variant: 'secondary' },
  tutup: { label: 'Tutup', variant: 'outline' },
  tanpa_jadwal: { label: 'Tanpa jadwal', variant: 'outline' },
};
const ORDER: Record<StageStatus, number> = { buka: 0, akan_datang: 1, tanpa_jadwal: 2, tutup: 3 };

export default async function BeasiswaPage({ searchParams }: { searchParams: Promise<{ tier?: string; status?: string }> }) {
  const { tier, status } = await searchParams;
  const now = Date.now();
  const semua = scholarships.map((s) => ({ s, st: stageStatus(s, now) }));
  const list = semua
    .filter((x) => !tier || x.s.tier === tier)
    .filter((x) => !status || x.st === status)
    .sort((a, b) => ORDER[a.st] - ORDER[b.st] || (b.s.confidence ?? 0) - (a.s.confidence ?? 0));

  return (
    <div className="wrap">
      <main>
        <section className="hero" style={{ paddingBottom: 28 }}>
          <Badge variant="secondary" style={{ marginBottom: 12, fontSize: 12 }}>
            Katalog Beasiswa
          </Badge>
          <h1 className="hero-title" style={{ fontSize: 'clamp(22px, 4vw, 32px)' }}>
            {semua.length} beasiswa tersedia
          </h1>
          <p className="hero-sub">
            Dari kampus, pemerintah, hingga swasta. Semua syarat ditulis dalam rupiah yang riil.
          </p>
        </section>

        {/* Filters */}
        <section className="section-tight" style={{ paddingBottom: 0 }}>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            <Link href="/beasiswa">
              <Button variant={!tier && !status ? 'default' : 'outline'} size="sm">
                Semua ({semua.length})
              </Button>
            </Link>
            {TIERS.map((t) => (
              <Link key={t} href={`/beasiswa?tier=${t}`}>
                <Button variant={tier === t ? 'default' : 'outline'} size="sm">
                  {TIER_LABEL[t]}
                </Button>
              </Link>
            ))}
            <Link href="/beasiswa?status=buka">
              <Button variant={status === 'buka' ? 'default' : 'outline'} size="sm">
                Buka saja
              </Button>
            </Link>
          </div>
        </section>

        {/* Cards */}
        <section className="section" style={{ paddingTop: 24 }}>
          {list.length === 0 ? (
            <Card>
              <CardContent style={{ textAlign: 'center', padding: '48px 24px' }}>
                <p style={{ fontWeight: 600, fontSize: 15, color: 'var(--ink)', margin: '0 0 6px' }}>Tidak ada hasil</p>
                <p className="tiny faint" style={{ margin: '0 0 16px' }}>Coba ubah filter di atas.</p>
                <Link href="/beasiswa">
                  <Button size="sm">Tampilkan semua</Button>
                </Link>
              </CardContent>
            </Card>
          ) : (
            <div style={{ display: 'grid', gap: 16 }}>
              {list.map(({ s, st }) => (
                <article key={s.slug}>
                  <Card>
                    <CardHeader>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 12 }}>
                        <div style={{ minWidth: 0 }}>
                          <CardTitle>{s.name}</CardTitle>
                          <CardDescription style={{ marginTop: 4 }}>{s.provider}</CardDescription>
                        </div>
                        <Badge variant={STATUS_BADGE[st].variant}>{STATUS_BADGE[st].label}</Badge>
                      </div>
                    </CardHeader>
                    <CardContent>
                      {s.benefit_summary && (
                        <p className="tiny faint" style={{ margin: '0 0 12px', lineHeight: 1.6 }}>{s.benefit_summary}</p>
                      )}
                      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 16 }}>
                        <Badge variant="secondary">{TIER_LABEL[s.tier]}</Badge>
                        <Badge variant="secondary">{s.jenjang.join(', ')}</Badge>
                        {s.ukt_max_idr !== undefined && (
                          <Badge variant="outline">UKT ≤ {rp(s.ukt_max_idr)}</Badge>
                        )}
                        {s.ukt_max_golongan !== undefined && (
                          <Badge variant="outline">Gol. 1–{s.ukt_max_golongan}</Badge>
                        )}
                      </div>
                      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                        {s.url_pendaftaran && (
                          <a href={s.url_pendaftaran} target="_blank" rel="noreferrer noopener">
                            <Button size="sm">Buka pendaftaran</Button>
                          </a>
                        )}
                        <a href={s.source_url} target="_blank" rel="noreferrer">
                          <Button variant="ghost" size="sm">
                            Sumber resmi · {tanggal(s.last_verified_at)}
                          </Button>
                        </a>
                      </div>
                    </CardContent>
                  </Card>
                </article>
              ))}
            </div>
          )}
        </section>
      </main>
    </div>
  );
}
