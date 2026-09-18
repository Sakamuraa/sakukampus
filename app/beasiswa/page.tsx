import type { Metadata } from 'next';
import Link from 'next/link';
import { scholarships } from '@/lib/data';
import { stageStatus, type StageStatus } from '@/lib/match';
import { rp, tanggal, STAGE_LABEL, TIER_LABEL } from '@/components/ui';

export const revalidate = 3600;

export const metadata: Metadata = {
  title: 'Katalog beasiswa',
  description:
    '8 beasiswa kampus, pemerintah, dan swasta untuk mahasiswa Indonesia. Syarat UKT ditulis dalam rupiah sesuai dekrit KMA 204/2026. Filter per jenjang dan status pendaftaran.',
  alternates: {
    canonical: '/beasiswa',
  },
  openGraph: {
    title: 'Katalog Beasiswa — SakuKampus',
    url: '/beasiswa',
    description: 'Filter 8 beasiswa berdasarkan jenjang (S1/D3/D4/S2) dan status (buka/tertutup).',
  },
};

const TIERS = ['kampus', 'pemerintah', 'swasta'] as const;

const STATUS_BADGE: Record<StageStatus, string> = {
  buka: 'badge badge-ok',
  akan_datang: 'badge badge-warn',
  tutup: 'badge badge-no',
  tanpa_jadwal: 'badge',
};

const ORDER: Record<StageStatus, number> = { buka: 0, akan_datang: 1, tanpa_jadwal: 2, tutup: 3 };

export default async function BeasiswaPage({
  searchParams,
}: {
  searchParams: Promise<{ tier?: string; status?: string }>;
}) {
  const { tier, status } = await searchParams;
  const now = Date.now();

  const semua = scholarships.map((s) => ({ s, st: stageStatus(s, now) }));

  const list = semua
    .filter((x) => !tier || x.s.tier === tier)
    .filter((x) => !status || x.st === status)
    .sort(
      (a, b) =>
        ORDER[a.st] - ORDER[b.st] ||
        (b.s.confidence ?? 0) - (a.s.confidence ?? 0) ||
        a.s.name.localeCompare(b.s.name),
    );

  const hitung = (t?: string) => semua.filter((x) => !t || x.s.tier === t).length;

  return (
    <div className="wrap">
      <main>
        {/* Header */}
        <section className="hero" style={{ paddingBottom: 28 }}>
          <h1 className="hero-title" style={{ fontSize: 'clamp(22px, 4vw, 32px)' }}>
            Katalog beasiswa
          </h1>
          <p className="hero-sub">
            {semua.length} beasiswa dari kampus, pemerintah, dan swasta.
          </p>
        </section>

        {/* Filters */}
        <section className="section-tight" style={{ paddingBottom: 0 }}>
          <div className="chip-rail">
            <Link className="chip" href="/beasiswa" data-on={!tier && !status} scroll={false}>
              Semua ({semua.length})
            </Link>
            {TIERS.map((t) => (
              <Link
                key={t}
                className="chip"
                href={`/beasiswa?tier=${t}`}
                data-on={tier === t}
                scroll={false}
              >
                {TIER_LABEL[t]} ({hitung(t)})
              </Link>
            ))}
            <Link
              className="chip"
              href="/beasiswa?status=buka"
              data-on={status === 'buka'}
              scroll={false}
            >
              Buka ({hitung('buka')})
            </Link>
          </div>
        </section>

        {/* Cards */}
        <section className="section" style={{ paddingTop: 0 }}>
          {list.length === 0 ? (
            <div className="card" style={{ textAlign: 'center', padding: '40px 24px' }}>
              <p style={{ fontWeight: 600, fontSize: 15, color: 'var(--ink)', margin: '0 0 6px' }}>
                Tidak ada hasil
              </p>
              <p className="tiny" style={{ margin: '0 0 16px' }}>Coba ubah filter di atas.</p>
              <Link href="/beasiswa" className="btn btn-sm">
                Tampilkan semua
              </Link>
            </div>
          ) : (
            <div style={{ display: 'grid', gap: 12 }}>
              {list.map(({ s, st }) => (
                <article key={s.slug} className="scholarship-card">
                  <div className="scholarship-card-header">
                    <div style={{ minWidth: 0 }}>
                      <div className="scholarship-card-name">{s.name}</div>
                      <div className="scholarship-card-provider">{s.provider}</div>
                    </div>
                    <span className={STATUS_BADGE[st]}>{STAGE_LABEL[st]}</span>
                  </div>

                  {s.benefit_summary && (
                    <p className="scholarship-card-desc">{s.benefit_summary}</p>
                  )}

                  <div className="scholarship-card-tags">
                    <span className="badge">{TIER_LABEL[s.tier] ?? s.tier}</span>
                    <span className="badge">{s.jenjang.join(' / ')}</span>
                    {s.ukt_max_idr !== undefined && (
                      <span className="badge badge-warn">
                        UKT maks <span className="mono">{rp(s.ukt_max_idr)}</span>
                      </span>
                    )}
                    {s.ukt_max_golongan !== undefined && (
                      <span className="badge badge-warn">
                        Gol. 1–{s.ukt_max_golongan}
                      </span>
                    )}
                  </div>

                  {s.stages.length > 0 && (
                    <div className="scholarship-card-stages">
                      {s.stages.slice(0, 3).map((stg) => (
                        <div key={stg.name} className="scholarship-card-stage">
                          <span className="scholarship-card-stage-name">
                            {stg.name.replace(/_/g, ' ')}
                          </span>
                          <span className="scholarship-card-stage-date">
                            {stg.closes_at ? tanggal(stg.closes_at) : '—'}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}

                  <div className="scholarship-card-actions">
                    {s.url_pendaftaran && (
                      <a
                        className="btn btn-sm"
                        href={s.url_pendaftaran}
                        target="_blank"
                        rel="noreferrer noopener"
                      >
                        Buka pendaftaran
                      </a>
                    )}
                    <a
                      className="btn btn-ghost btn-sm"
                      href={s.source_url}
                      target="_blank"
                      rel="noreferrer noopener"
                      style={{ fontSize: 12, padding: '7px 12px' }}
                    >
                      Sumber resmi · {tanggal(s.last_verified_at)}
                    </a>
                  </div>
                </article>
              ))}
            </div>
          )}
        </section>
      </main>
    </div>
  );
}