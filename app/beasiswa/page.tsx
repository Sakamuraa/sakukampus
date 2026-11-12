import type { Metadata } from 'next';
import Link from 'next/link';
import { ArrowUpRight, SealCheck } from '@phosphor-icons/react/dist/ssr';
import { scholarships } from '@/lib/data';
import { stageStatus, type StageStatus } from '@/lib/match';
import { rp, tanggal, TIER_LABEL } from '@/components/ui';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Reveal, Stagger } from '@/components/motion/reveal';

export const revalidate = 3600;

export const metadata: Metadata = {
  title: 'Katalog beasiswa',
  description:
    'Beasiswa kampus, pemerintah, dan swasta untuk mahasiswa Indonesia. Syarat UKT ditulis dalam rupiah sesuai dekrit KMA 204/2026.',
  alternates: { canonical: '/beasiswa' },
  openGraph: {
    title: 'Katalog Beasiswa',
    url: '/beasiswa',
    description: 'Beasiswa dengan syarat UKT dinyatakan dalam rupiah.',
  },
};

const TIERS = ['kampus', 'pemerintah', 'swasta'] as const;

const STATUS: Record<StageStatus, { label: string; variant: 'ok' | 'warn' | 'neutral' }> = {
  buka: { label: 'Buka', variant: 'ok' },
  akan_datang: { label: 'Segera dibuka', variant: 'warn' },
  tutup: { label: 'Ditutup', variant: 'neutral' },
  tanpa_jadwal: { label: 'Tanpa jadwal', variant: 'neutral' },
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

  const count = (t?: string) => semua.filter((x) => !t || x.s.tier === t).length;
  const on = (t?: string) => (!tier && !status) || (!!t && tier === t && !status);

  return (
    <>
      <section className="border-b border-line-strong">
        <div className="wrap pt-14 pb-10 lg:pt-20 lg:pb-14">
          <Reveal>
            <p className="eyebrow">Katalog</p>
            <h1 className="mt-4 max-w-[16ch] font-display text-[clamp(2.2rem,5vw,3.4rem)] leading-[1.03] font-semibold tracking-[-0.03em] text-ink">
              Katalog beasiswa
            </h1>
            <div className="mt-6 h-px w-full bg-line-strong" />
            <p className="mt-5 max-w-[54ch] text-[16px] leading-relaxed text-ink-dim">
              {semua.length} program dari kampus, pemerintah, dan swasta. Setiap syarat UKT
              diterjemahkan ke rupiah.
            </p>
          </Reveal>
        </div>
      </section>

      {/* Filter rail — single scrollable line, wraps on desktop */}
      <div className="sticky top-0 z-30 border-b border-line-strong bg-bg/92 backdrop-blur-md lg:top-[72px]">
        <div className="wrap flex gap-2 overflow-x-auto py-3.5 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          <Link
            href="/beasiswa"
            className={`press inline-flex h-9 shrink-0 items-center justify-center rounded-ctl border px-3.5 text-[13px] font-medium whitespace-nowrap ${
              on() && !tier
                ? 'border-accent bg-accent text-accent-ink'
                : 'border-line-strong bg-surface text-ink-dim hover:border-ink hover:text-ink'
            }`}
          >
            Semua ({semua.length})
          </Link>
          {TIERS.map((t) => (
            <Link
              key={t}
              href={`/beasiswa?tier=${t}`}
              className={`press inline-flex h-9 shrink-0 items-center justify-center rounded-ctl border px-3.5 text-[13px] font-medium whitespace-nowrap ${
                tier === t
                  ? 'border-accent bg-accent text-accent-ink'
                  : 'border-line-strong bg-surface text-ink-dim hover:border-ink hover:text-ink'
              }`}
            >
              {TIER_LABEL[t]} ({count(t)})
            </Link>
          ))}
          <Link
            href="/beasiswa?status=buka"
            className={`press inline-flex h-9 shrink-0 items-center justify-center rounded-ctl border px-3.5 text-[13px] font-medium whitespace-nowrap ${
              status === 'buka'
                ? 'border-ok bg-ok text-white'
                : 'border-line-strong bg-surface text-ink-dim hover:border-ink hover:text-ink'
            }`}
          >
            Masih terbuka ({count('buka')})
          </Link>
        </div>
      </div>

      <section className="section-pad">
        <div className="wrap">
          {list.length === 0 ? (
            <Reveal>
              <Card className="mx-auto max-w-[460px] text-center">
                <CardContent className="py-12">
                  <p className="font-display text-[16px] font-semibold text-ink">Tidak ada hasil</p>
                  <p className="mt-1.5 text-[13.5px] text-ink-faint">
                    Coba ubah filter di atas.
                  </p>
                  <Link href="/beasiswa" className="mt-5 inline-block">
                    <Button variant="secondary" size="sm">
                      Tampilkan semua
                    </Button>
                  </Link>
                </CardContent>
              </Card>
            </Reveal>
          ) : (
            <Stagger className="grid gap-4 md:grid-cols-2" gap={0.05}>
              {list.map(({ s, st }) => (
                <Card key={s.slug} interactive className="flex h-full flex-col">
                  <CardHeader>
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <CardTitle className="leading-snug">{s.name}</CardTitle>
                        <CardDescription className="mt-1.5 flex items-center gap-1.5">
                          <SealCheck size={13} weight="bold" className="shrink-0 text-ok" />
                          {s.provider}
                        </CardDescription>
                      </div>
                      <Badge variant={STATUS[st].variant}>{STATUS[st].label}</Badge>
                    </div>
                  </CardHeader>

                  <CardContent className="flex flex-1 flex-col gap-4">
                    {s.benefit_summary && (
                      <p className="text-[13.5px] leading-relaxed text-ink-dim">
                        {s.benefit_summary}
                      </p>
                    )}

                    <div className="flex flex-wrap gap-1.5">
                      <Badge variant="neutral">{TIER_LABEL[s.tier]}</Badge>
                      <Badge variant="neutral">{s.jenjang.join(' · ')}</Badge>
                      {s.ukt_max_idr !== undefined && (
                        <Badge variant="accent">UKT ≤ {rp(s.ukt_max_idr)}</Badge>
                      )}
                      {s.ukt_max_golongan !== undefined && (
                        <Badge variant="warn">Gol. 1–{s.ukt_max_golongan}</Badge>
                      )}
                    </div>

                    <div className="mt-auto flex flex-wrap items-center gap-2 pt-1">
                      {s.url_pendaftaran && (
                        <a href={s.url_pendaftaran} target="_blank" rel="noreferrer noopener">
                          <Button size="sm">
                            Buka pendaftaran
                            <ArrowUpRight size={13} weight="bold" />
                          </Button>
                        </a>
                      )}
                      <a href={s.source_url} target="_blank" rel="noreferrer noopener">
                        <Button size="sm" variant="ghost">
                          Sumber · {tanggal(s.last_verified_at)}
                        </Button>
                      </a>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </Stagger>
          )}
        </div>
      </section>
    </>
  );
}
