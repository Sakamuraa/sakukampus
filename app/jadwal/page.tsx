import type { Metadata } from 'next';
import Link from 'next/link';
import { ArrowUpRight } from '@phosphor-icons/react/dist/ssr/ArrowUpRight';
import { scholarships } from '@/lib/data';
import { tanggal, sisaHari } from '@/components/ui';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Reveal, Stagger } from '@/components/motion/reveal';

export const revalidate = 1800;

export const metadata: Metadata = {
  title: 'Jadwal dan tenggat beasiswa',
  description:
    'Tenggat pendaftaran beasiswa dari pengumuman resmi, diurutkan dari yang terdekat.',
  alternates: { canonical: '/jadwal' },
  openGraph: { title: 'Jadwal Tenggat Beasiswa', url: '/jadwal' },
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
    <>
      <section className="border-b border-line">
        <div className="wrap py-12 lg:py-16">
          <Reveal>
            <h1 className="max-w-[16ch] text-[clamp(1.9rem,4.5vw,2.9rem)] leading-[1.06] font-extrabold tracking-[-0.035em] text-ink">
              Jadwal dan tenggat
            </h1>
            <p className="mt-4 max-w-[54ch] text-[16px] leading-relaxed text-ink-dim">
              Dihitung mundur dari hari ini. Periksa ulang di situs resmi sebelum menutup
              pendaftaran.
            </p>
          </Reveal>
        </div>
      </section>

      <section className="section-pad">
        <div className="wrap">
          <Reveal className="flex flex-wrap items-baseline justify-between gap-3">
            <h2 className="text-[clamp(1.25rem,2.4vw,1.6rem)] font-bold tracking-[-0.025em] text-ink">
              Masih bisa didaftar
            </h2>
            <span className="text-[13.5px] text-ink-faint">{mendatang.length} tahap terbuka</span>
          </Reveal>

          {mendatang.length === 0 ? (
            <Reveal delay={0.05}>
              <Card className="mt-6">
                <CardContent className="py-12 text-center">
                  <p className="text-[15px] font-semibold text-ink">
                    Belum ada tenggat yang akan datang
                  </p>
                  <p className="mt-1.5 text-[13.5px] text-ink-faint">
                    Siklus berikutnya biasanya mengikuti pola tahun sebelumnya.
                  </p>
                  <Link href="/beasiswa" className="mt-5 inline-block">
                    <Button variant="secondary" size="sm">
                      Lihat katalog beasiswa
                    </Button>
                  </Link>
                </CardContent>
              </Card>
            </Reveal>
          ) : (
            <Stagger className="mt-6 grid gap-3" gap={0.05}>
              {mendatang.map((r) => {
                const hari = sisaHari(r.tenggat);
                const mendesak = hari <= 7;
                return (
                  <Card
                    key={r.slug}
                    interactive
                    className={mendesak ? 'border-warn/45 bg-warn-soft/40' : undefined}
                  >
                    <CardContent className="flex items-start gap-5 py-5">
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <h3 className="text-[15px] font-semibold text-ink">{r.nama}</h3>
                          {mendesak && <Badge variant="warn">Mendesak</Badge>}
                        </div>
                        <p className="mt-1 text-[13px] text-ink-faint">{r.penyelenggara}</p>
                        <p className="num mt-3 text-[13px] text-ink-dim">
                          Tutup {tanggal(r.tenggat)}
                          {r.buka !== null && <span className="text-ink-faint"> · buka {tanggal(r.buka)}</span>}
                        </p>

                        <div className="mt-3 flex flex-wrap gap-4">
                          {r.daftar && (
                            <a
                              href={r.daftar}
                              target="_blank"
                              rel="noreferrer noopener"
                              className="press inline-flex items-center gap-1 text-[13px] font-semibold text-accent hover:underline"
                            >
                              Daftar
                              <ArrowUpRight size={13} weight="bold" />
                            </a>
                          )}
                          <a
                            href={r.sumber}
                            target="_blank"
                            rel="noreferrer noopener"
                            className="press text-[13px] text-ink-faint underline decoration-line underline-offset-4 hover:text-ink-dim"
                          >
                            Sumber resmi
                          </a>
                        </div>
                      </div>

                      <div className="shrink-0 text-right">
                        <p
                          className={`num text-[clamp(1.5rem,4vw,2rem)] leading-none font-bold ${
                            mendesak ? 'text-warn' : 'text-ink'
                          }`}
                        >
                          {hari <= 0 ? 'Hari ini' : hari}
                        </p>
                        {hari > 0 && (
                          <p className="mt-1.5 text-[11.5px] text-ink-faint">hari lagi</p>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </Stagger>
          )}

          {lewat.length > 0 && (
            <Reveal delay={0.1}>
              <details className="mt-8 overflow-hidden rounded-card border border-line bg-surface">
                <summary className="cursor-pointer px-5 py-4 text-[14px] font-medium text-ink-dim select-none hover:text-ink">
                  {lewat.length} tahap sudah lewat
                </summary>
                <div className="divide-y divide-line border-t border-line">
                  {lewat.map((r) => (
                    <div
                      key={r.slug}
                      className="flex items-center justify-between gap-4 px-5 py-3.5"
                    >
                      <div className="min-w-0">
                        <p className="truncate text-[13.5px] text-ink-dim">{r.nama}</p>
                        <p className="truncate text-[12px] text-ink-faint">{r.penyelenggara}</p>
                      </div>
                      <span className="num shrink-0 text-[12.5px] text-ink-faint">
                        {tanggal(r.tenggat)}
                      </span>
                    </div>
                  ))}
                </div>
              </details>
            </Reveal>
          )}
        </div>
      </section>
    </>
  );
}
