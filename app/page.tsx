import Link from 'next/link';
import { ArrowRight } from '@phosphor-icons/react/dist/ssr/ArrowRight';
import { ArrowUpRight } from '@phosphor-icons/react/dist/ssr/ArrowUpRight';
import { institutions, scholarships, seedsMeta } from '@/lib/data';
import { stageStatus } from '@/lib/match';
import { rp, tanggal } from '@/components/ui';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Reveal, Stagger } from '@/components/motion/reveal';

export const revalidate = 3600;

const RULES = [
  {
    k: 'Nomor',
    t: 'Golongan cuma berlaku di kampusnya sendiri',
    d: 'Golongan 2 di UIN Jakarta Rp4.270.000, di UIN Malang Rp1.653.000. Angka yang sama, beban yang beda.',
  },
  {
    k: 'Rupiah',
    t: 'Beasiswa nasional dinilai pakai plafon rupiah',
    d: 'Syarat ditulis sebagai “UKT maksimal Rp2.400.000”, bukan “golongan 1 sampai 4”.',
  },
  {
    k: 'Catatan',
    t: 'Kriteria prioritas tidak pernah menggugurkan',
    d: 'Label prioritas dicatat sebagai informasi tambahan, bukan penentu lolos atau tidak.',
  },
  {
    k: 'Jujur',
    t: 'Data kurang dilaporkan sebagai kurang',
    d: 'Kami tidak menebak dari data yang belum kamu isi. Hasilnya “perlu data”, bukan “tidak lolos”.',
  },
] as const;

export default function Home() {
  const now = Date.now();
  const denganUkt = institutions.filter((i) => i.ukt).length;

  const jakarta = institutions.find((i) => i.kode === '201001')?.ukt;
  const malang = institutions.find((i) => i.kode === '201003')?.ukt;
  const ti = (pt: typeof jakarta) => pt?.prodi.find((p) => p.prodi === 'Teknik Informatika');
  const a = ti(jakarta);
  const b = ti(malang);

  const buka = scholarships
    .map((s) => ({ s, st: stageStatus(s, now) }))
    .filter((x) => x.st === 'buka')
    .slice(0, 3);

  const stats = [
    { v: institutions.length.toLocaleString('id-ID'), k: 'Kampus terindeks', s: 'PDDikti' },
    { v: String(denganUkt), k: 'Kampus dengan UKT terverifikasi', s: 'KMA 204/2026' },
    { v: Number(seedsMeta.ukt.prodi).toLocaleString('id-ID'), k: 'Baris prodi berdata', s: 'KMA 204/2026' },
    { v: String(scholarships.length), k: 'Beasiswa dipantau', s: 'Pengumuman resmi' },
  ];

  return (
    <>
      {/* ─────────────────────────────────────── HERO
          Anti-center: copy left, live proof right. Asymmetric split. */}
      <section className="border-b border-line">
        <div className="wrap grid items-center gap-10 py-14 lg:grid-cols-[1.05fr_0.95fr] lg:gap-16 lg:py-20">
          <div>
            <Reveal delay={0}>
              <Badge variant="accent" className="mb-5">
                Beasiswa untuk mahasiswa Indonesia
              </Badge>
            </Reveal>

            <Reveal delay={0.06}>
              <h1 className="max-w-[15ch] text-[clamp(2.1rem,6vw,3.6rem)] leading-[1.03] font-extrabold tracking-[-0.035em] text-ink">
                Cek beasiswa yang cocok sama <span className="text-accent">UKT-mu</span>.
              </h1>
            </Reveal>

            <Reveal delay={0.12}>
              <p className="mt-5 max-w-[52ch] text-[17px] leading-relaxed text-ink-dim">
                Masukkan kampus dan golonganmu. Kami bandingkan dengan plafon rupiah tiap beasiswa
                dan laporkan apa yang sudah cocok, apa yang belum.
              </p>
            </Reveal>

            <Reveal delay={0.18}>
              <div className="mt-8 flex flex-wrap gap-3">
                <Link href="/cek">
                  <Button size="lg">
                    Cek kelayakanku
                    <ArrowRight size={16} weight="bold" />
                  </Button>
                </Link>
                <Link href="/beasiswa">
                  <Button size="lg" variant="secondary">
                    Lihat katalog
                  </Button>
                </Link>
              </div>
            </Reveal>
          </div>

          {/* Live component preview — the real UI, not a fake screenshot. */}
          {a && b && (
            <Reveal delay={0.24} y={24}>
              <div className="relative">
                <div
                  aria-hidden
                  className="pointer-events-none absolute -inset-6 -z-10 rounded-full bg-accent/10 blur-3xl"
                />
                <Card className="overflow-hidden">
                  <div className="flex items-center justify-between border-b border-line bg-surface-2 px-5 py-3.5">
                    <p className="text-[12.5px] font-medium text-ink-dim">
                      Teknik Informatika · Golongan 2
                    </p>
                    <Badge variant="ok">Data terverifikasi</Badge>
                  </div>

                  <div className="divide-y divide-line">
                    {[
                      { n: 'UIN Syarif Hidayatullah Jakarta', v: a.gol[1] },
                      { n: 'UIN Maulana Malik Ibrahim Malang', v: b.gol[1] },
                    ].map((r) => (
                      <div key={r.n} className="flex items-baseline justify-between gap-4 px-5 py-4">
                        <span className="text-[13.5px] text-ink-dim">{r.n}</span>
                        <span className="num text-[17px] font-semibold text-ink">{rp(r.v)}</span>
                      </div>
                    ))}
                  </div>

                  <div className="flex items-start gap-3 border-t border-line bg-accent/8 px-5 py-4">
                    <span className="mt-0.5 text-[12px] font-bold text-accent">2,6×</span>
                    <p className="text-[13px] leading-relaxed text-ink-dim">
                      Selisih untuk golongan yang sama. Nomor golongan tidak sebanding antar kampus.
                    </p>
                  </div>
                </Card>
              </div>
            </Reveal>
          )}
        </div>
      </section>

      {/* ─────────────────────────────────────── RULES
          Layout family: ruled definition list, not cards. */}
      <section className="section-pad border-b border-line">
        <div className="wrap">
          <Reveal>
            <h2 className="max-w-[20ch] text-[clamp(1.5rem,3vw,2.1rem)] leading-[1.15] font-bold tracking-[-0.03em] text-ink">
              Cara kami menilainya
            </h2>
          </Reveal>

          <div className="mt-8 border-t border-line">
            <Stagger className="divide-y divide-line">
              {RULES.map((r) => (
                <div
                  key={r.k}
                  className="group grid gap-2 py-6 sm:grid-cols-[110px_1fr] sm:gap-8"
                >
                  <span className="num pt-1 text-[12px] font-semibold tracking-[0.1em] text-accent uppercase">
                    {r.k}
                  </span>
                  <div>
                    <p className="text-[16px] font-semibold text-ink">{r.t}</p>
                    <p className="mt-1.5 max-w-[62ch] text-[14px] leading-relaxed text-ink-faint">
                      {r.d}
                    </p>
                  </div>
                </div>
              ))}
            </Stagger>
          </div>
        </div>
      </section>

      {/* ─────────────────────────────────────── OPEN CALLS
          Layout family: horizontal rail. */}
      {buka.length > 0 && (
        <section className="section-pad border-b border-line">
          <div className="wrap">
            <Reveal className="flex flex-wrap items-end justify-between gap-4">
              <div>
                <h2 className="text-[clamp(1.35rem,2.6vw,1.8rem)] font-bold tracking-[-0.025em] text-ink">
                  Pendaftaran yang masih terbuka
                </h2>
                <p className="mt-2 text-[14px] text-ink-faint">
                  Diperbarui {tanggal(now)} · lengkap di halaman jadwal
                </p>
              </div>
              <Link
                href="/jadwal"
                className="press inline-flex items-center gap-1.5 text-[13.5px] font-semibold text-accent hover:underline"
              >
                Semua jadwal
                <ArrowUpRight size={14} weight="bold" />
              </Link>
            </Reveal>

            <div className="mt-7 -mx-5 flex snap-x gap-4 overflow-x-auto px-5 pb-2 [scrollbar-width:thin] lg:mx-0 lg:overflow-visible lg:px-0">
              {buka.map(({ s }, i) => (
                <Reveal
                  key={s.slug}
                  delay={i * 0.06}
                  className="w-[300px] shrink-0 snap-start lg:w-auto lg:flex-1"
                >
                  <Card interactive className="h-full">
                    <CardContent className="flex h-full flex-col gap-3">
                      <div className="flex items-start justify-between gap-3">
                        <h3 className="text-[15px] leading-snug font-semibold text-ink">
                          {s.name}
                        </h3>
                        <Badge variant="ok">Buka</Badge>
                      </div>
                      <p className="text-[13px] text-ink-faint">{s.provider}</p>

                      {s.ukt_max_idr !== undefined && (
                        <p className="num mt-auto pt-2 text-[13px] text-ink-dim">
                          Plafon UKT{' '}
                          <span className="font-semibold text-accent">{rp(s.ukt_max_idr)}</span>
                        </p>
                      )}
                      {s.ukt_max_golongan !== undefined && (
                        <p className="num mt-auto pt-2 text-[13px] text-ink-dim">
                          Prioritas gol. 1–{s.ukt_max_golongan}
                        </p>
                      )}

                      <Link
                        href="/cek"
                        className="press inline-flex items-center gap-1 text-[13px] font-semibold text-accent hover:underline"
                      >
                        Cek syaratku
                        <ArrowRight size={13} weight="bold" />
                      </Link>
                    </CardContent>
                  </Card>
                </Reveal>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ─────────────────────────────────────── COVERAGE
          Layout family: display-number grid, no card chrome. */}
      <section className="section-pad border-b border-line">
        <div className="wrap">
          <Reveal>
            <h2 className="max-w-[22ch] text-[clamp(1.35rem,2.6vw,1.8rem)] font-bold tracking-[-0.025em] text-ink">
              Data apa saja yang kami pegang
            </h2>
          </Reveal>

          <Stagger className="mt-8 grid grid-cols-2 gap-x-6 gap-y-8 lg:grid-cols-4" gap={0.06}>
            {stats.map((s) => (
              <div key={s.k} className="border-t border-line-strong pt-4">
                <p className="num text-[clamp(1.7rem,4vw,2.5rem)] leading-none font-bold text-ink">
                  {s.v}
                </p>
                <p className="mt-2.5 text-[13.5px] leading-snug text-ink-dim">{s.k}</p>
                <p className="mt-1 text-[12px] text-ink-faint">{s.s}</p>
              </div>
            ))}
          </Stagger>

          <Reveal delay={0.1}>
            <p className="mt-8 max-w-[70ch] text-[13.5px] leading-relaxed text-ink-faint">
              UKT terverifikasi penuh untuk {denganUkt} kampus PTKIN. {institutions.length - denganUkt}{' '}
              kampus lain tetap bisa dipakai dengan nominal yang kamu isi sendiri, ditandai belum
              diverifikasi.
            </p>
          </Reveal>
        </div>
      </section>

      {/* ─────────────────────────────────────── CTA BAND */}
      <section className="section-pad">
        <div className="wrap">
          <Reveal>
            <div className="relative overflow-hidden rounded-card border border-accent/25 bg-accent/8 px-6 py-9 sm:px-10 sm:py-12">
              <div className="flex flex-col items-start gap-6 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <h2 className="max-w-[24ch] text-[clamp(1.3rem,2.4vw,1.7rem)] leading-tight font-bold tracking-[-0.025em] text-ink">
                    Kampusmu belum ada di tabel UKT?
                  </h2>
                  <p className="mt-2 max-w-[54ch] text-[14.5px] leading-relaxed text-ink-dim">
                    Isi nominal yang kamu bayar sendiri. Perhitungannya tetap jalan, hasilnya
                    ditandai belum diverifikasi.
                  </p>
                </div>
                <Link href="/cek" className="shrink-0">
                  <Button size="lg">
                    Cek kelayakanku
                    <ArrowRight size={16} weight="bold" />
                  </Button>
                </Link>
              </div>
            </div>
          </Reveal>
        </div>
      </section>
    </>
  );
}
