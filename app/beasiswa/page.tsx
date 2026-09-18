import type { Metadata } from 'next';
import Link from 'next/link';
import { ArrowSquareOut } from '@phosphor-icons/react/dist/ssr/ArrowSquareOut';
import { scholarships } from '@/lib/data';
import { stageStatus, type StageStatus } from '@/lib/match';
import { Section, SourceStamp, rp, tanggal, STAGE_LABEL, TIER_LABEL } from '@/components/ui';

export const revalidate = 3600;

export const metadata: Metadata = {
  title: 'Katalog beasiswa',
  description:
    'Beasiswa kampus, pemerintah, dan swasta untuk mahasiswa Indonesia. Setiap entri membawa tautan sumber resmi dan tanggal pemeriksaan.',
};

const TIERS = ['kampus', 'pemerintah', 'swasta'] as const;

const STATUS_BADGE: Record<StageStatus, string> = {
  buka: 'badge badge-ok',
  akan_datang: 'badge badge-warn',
  tutup: 'badge badge-off',
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
    <>
      <Section tight>
        <h1 className="h1" style={{ fontSize: 'clamp(1.5rem, 4.5vw, 2.1rem)' }}>
          Katalog beasiswa
        </h1>
        <p className="lede" style={{ marginTop: 10, maxWidth: '54ch' }}>
          {semua.length} beasiswa dari kampus, pemerintah, dan swasta. Syarat UKT ditulis dalam
          rupiah untuk beasiswa lintas kampus, dan dalam nomor golongan hanya untuk beasiswa yang
          memang terikat satu kampus.
        </p>
      </Section>

      {/* Filter chips. Rail on mobile so the row never wraps into two lines and
          pushes the first card below the fold. */}
      <Section tight>
        <div className="chip-rail">
          <Link className="chip" href="/beasiswa" data-on={!tier && !status} scroll={false}>
            Semua {semua.length}
          </Link>
          {TIERS.map((t) => (
            <Link
              key={t}
              className="chip"
              href={`/beasiswa?tier=${t}`}
              data-on={tier === t}
              scroll={false}
            >
              {TIER_LABEL[t]} {hitung(t)}
            </Link>
          ))}
          <Link
            className="chip"
            href="/beasiswa?status=buka"
            data-on={status === 'buka'}
            scroll={false}
          >
            Sedang dibuka
          </Link>
        </div>
      </Section>

      <Section tight>
        <div className="grid gap-4 md:grid-cols-2">
          {list.map(({ s, st }) => (
            <article key={s.slug} className="card" style={{ display: 'grid', alignContent: 'start' }}>
              <div className="flex items-start justify-between gap-3">
                <div style={{ minWidth: 0 }}>
                  <h2 className="h3">{s.name}</h2>
                  <p className="small muted" style={{ margin: '4px 0 0' }}>
                    {s.provider}
                  </p>
                </div>
                <span className={STATUS_BADGE[st]}>{STAGE_LABEL[st]}</span>
              </div>

              {s.benefit_summary && (
                <p className="small" style={{ margin: '12px 0 0' }}>
                  {s.benefit_summary}
                </p>
              )}

              <div
                className="flex flex-wrap items-center gap-2"
                style={{ marginTop: 14 }}
              >
                <span className="badge">{TIER_LABEL[s.tier] ?? s.tier}</span>
                <span className="badge">{s.jenjang.join(' / ')}</span>
                {s.ukt_max_idr !== undefined && (
                  <span className="badge badge-warn">
                    UKT maksimal <span className="num">{rp(s.ukt_max_idr)}</span>
                  </span>
                )}
                {s.ukt_max_golongan !== undefined && (
                  <span className="badge badge-warn">
                    Prioritas golongan 1 sampai {s.ukt_max_golongan}
                  </span>
                )}
              </div>

              {s.stages.length > 0 && (
                <div style={{ marginTop: 16 }}>
                  <p className="small faint" style={{ margin: '0 0 8px' }}>
                    Tahapan
                  </p>
                  <div style={{ display: 'grid', gap: 0 }}>
                    {s.stages.map((stg, i) => (
                      <div
                        key={stg.name}
                        className="small"
                        style={{
                          display: 'flex',
                          justifyContent: 'space-between',
                          gap: 14,
                          padding: '7px 0',
                          borderTop: i === 0 ? 'none' : '1px solid var(--color-line)',
                        }}
                      >
                        <span className="muted" style={{ textTransform: 'capitalize' }}>
                          {stg.name.replace(/_/g, ' ')}
                        </span>
                        <span className="num faint" style={{ textAlign: 'right' }}>
                          {stg.opens_at ? tanggal(stg.opens_at) : 'tanpa tanggal'}
                          {' sampai '}
                          {stg.closes_at ? tanggal(stg.closes_at) : 'tanpa batas'}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div style={{ marginTop: 16 }}>
                <SourceStamp
                  url={s.source_url}
                  verifiedAt={s.last_verified_at}
                  confidence={s.confidence}
                />
              </div>

              {s.url_pendaftaran && (
                <div style={{ marginTop: 14 }}>
                  <a
                    className="btn"
                    href={s.url_pendaftaran}
                    target="_blank"
                    rel="noreferrer noopener"
                    style={{ minHeight: 42, padding: '0 16px', fontSize: '0.875rem' }}
                  >
                    Buka pendaftaran
                    <ArrowSquareOut size={14} aria-hidden="true" />
                  </a>
                </div>
              )}
            </article>
          ))}
        </div>

        {list.length === 0 && (
          <div
            className="card"
            style={{ textAlign: 'left', padding: '28px 22px', display: 'grid', gap: 10 }}
          >
            <p style={{ margin: 0, fontWeight: 600 }}>Tidak ada yang cocok dengan filter ini.</p>
            <p className="small muted" style={{ margin: 0 }}>
              Coba lepaskan salah satu filter.
            </p>
            <div>
              <Link className="btn btn-quiet" href="/beasiswa" scroll={false}>
                Tampilkan semua
              </Link>
            </div>
          </div>
        )}
      </Section>
    </>
  );
}