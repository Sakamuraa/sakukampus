import type { Metadata } from 'next';
import Link from 'next/link';
import { ArrowUpRight } from '@phosphor-icons/react/dist/ssr/ArrowUpRight';
import { institutions, scholarships, seedsMeta } from '@/lib/data';
import DataPageClient from './DataPageClient';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Reveal, Stagger } from '@/components/motion/reveal';

export const revalidate = 600;

export const metadata: Metadata = {
  title: 'Status data dan sumber',
  description:
    'Asal setiap angka di SakuKampus: UKT dari KMA 204/2026, katalog kampus dari PDDikti, jadwal dari pengumuman resmi.',
  alternates: { canonical: '/data' },
  openGraph: {
    title: 'Status Data dan Sumber',
    url: '/data',
    description: 'Transparansi asal data UKT, kampus, dan beasiswa.',
  },
};

const n = (x: unknown) => Number(x).toLocaleString('id-ID');

function Row({ k, v, mono }: { k: string; v: string; mono?: boolean }) {
  return (
    <div className="flex items-baseline justify-between gap-6 py-3">
      <span className="text-[13.5px] text-ink-faint">{k}</span>
      <span className={`text-right text-[13.5px] font-medium text-ink ${mono ? 'num' : ''}`}>
        {v}
      </span>
    </div>
  );
}

type GapFn = (t?: string, c?: string) => string;

const GAPS: GapFn[] = [
  (t, c) => `${t} dari ${c} kampus belum punya tabel UKT terverifikasi.`,
  (t, c) => `${t} dari ${c} baris prodi hanya mencantumkan sebagian golongan.`,
  () => 'Sebagian blok PTKIN memakai nama berbeda dari katalog PDDikti.',
];

export default function DataPage() {
  const denganUkt = institutions.filter((i) => i.ukt).length;
  const tanpaUkt = institutions.length - denganUkt;
  const lengkap = Number(seedsMeta.ukt.prodiGolonganLengkap);
  const totalProdi = Number(seedsMeta.ukt.prodi);
  const sebagian = totalProdi - lengkap;
  const resmi = scholarships.filter((s) => s.source_kind === 'resmi').length;

  const generatedAt = seedsMeta.institutions.generated_at
    ? new Date(seedsMeta.institutions.generated_at as string).toLocaleDateString('id-ID', {
        day: 'numeric',
        month: 'long',
        year: 'numeric',
      })
    : '-';

  return (
    <>
      <section className="border-b border-line">
        <div className="wrap py-12 lg:py-16">
          <Reveal>
            <h1 className="max-w-[16ch] text-[clamp(1.9rem,4.5vw,2.9rem)] leading-[1.06] font-extrabold tracking-[-0.035em] text-ink">
              Status data dan sumber
            </h1>
            <p className="mt-4 max-w-[58ch] text-[16px] leading-relaxed text-ink-dim">
              Asal setiap angka, kapan terakhir diambil, dan mana yang masih kurang.
            </p>
          </Reveal>
        </div>
      </section>

      <section className="section-pad">
        <div className="wrap grid gap-4 lg:grid-cols-2">
          <Reveal>
            <Card className="h-full">
              <CardHeader>
                <CardTitle>Katalog kampus</CardTitle>
                <CardDescription>Institusi pendidikan tinggi Indonesia</CardDescription>
              </CardHeader>
              <CardContent className="divide-y divide-line">
                <Row k="Kampus terindeks" v={n(seedsMeta.institutions.count)} />
                <Row k="Diambil terakhir" v={generatedAt} />
                <Row k="Sumber" v="api-pddikti.kemdiktisaintek.go.id" mono />
              </CardContent>
            </Card>
          </Reveal>

          <Reveal delay={0.05}>
            <Card className="h-full">
              <CardHeader>
                <CardTitle>Nominal UKT per golongan</CardTitle>
                <CardDescription>Dasar perhitungan kelayakan</CardDescription>
              </CardHeader>
              <CardContent className="divide-y divide-line">
                <Row k="Dekrit" v={String(seedsMeta.ukt.decree)} />
                <Row k="Tahun akademik" v={String(seedsMeta.ukt.academic_year)} />
                <Row k="PTKIN tercakup" v={n(seedsMeta.ukt.ptkin)} />
                <Row k="Baris prodi" v={n(seedsMeta.ukt.prodi)} />
                <Row k="Golongan lengkap 1–7" v={n(lengkap)} />
                <Row k="Kampus berdata UKT" v={String(denganUkt)} />
              </CardContent>
            </Card>
          </Reveal>

          <Reveal delay={0.1} className="lg:col-span-2">
            <div className="rounded-card border border-ok/30 bg-ok-soft/60 px-5 py-5 sm:px-6">
              <p className="text-[15px] font-semibold text-ok">
                Nomor golongan tidak sebanding antar kampus
              </p>
              <p className="mt-2 max-w-[76ch] text-[14px] leading-relaxed text-ink-dim">
                Golongan 2 di UIN Jakarta Rp4.270.000, di UIN Malang Rp1.653.000. Beasiswa lintas
                kampus selalu dinilai memakai plafon rupiah, bukan nomor golongan.
              </p>
            </div>
          </Reveal>

          <Reveal delay={0.05}>
            <Card className="h-full">
              <CardHeader>
                <CardTitle>Katalog beasiswa</CardTitle>
                <CardDescription>Program yang dipantau</CardDescription>
              </CardHeader>
              <CardContent className="divide-y divide-line">
                <Row k="Entri beasiswa" v={n(scholarships.length)} />
                <Row k="Dari sumber resmi" v={n(resmi)} />
                <Row k="Dari agregator" v={n(scholarships.length - resmi)} />
                <Row k="Pemeriksaan terakhir" v="hari ini" />
              </CardContent>
            </Card>
          </Reveal>

          <Reveal delay={0.1}>
            <Card className="h-full">
              <CardHeader>
                <CardTitle>Yang masih kurang</CardTitle>
              </CardHeader>
              <CardContent>
                <Stagger className="grid gap-2.5" gap={0.06}>
                  {[
                    GAPS[0](n(tanpaUkt), n(institutions.length)),
                    GAPS[1](n(sebagian), n(totalProdi)),
                    GAPS[2]() as string,
                  ].map((text, i) => (
                    <div
                      key={i}
                      className="border-l-2 border-warn bg-surface-2 px-4 py-3 text-[13.5px] leading-relaxed text-ink-dim"
                    >
                      {text}
                    </div>
                  ))}
                </Stagger>
              </CardContent>
            </Card>
          </Reveal>

          <div className="lg:col-span-2">
            <DataPageClient />
          </div>
        </div>
      </section>

      <section className="section-pad border-t border-line">
        <div className="wrap">
          <Reveal>
            <h2 className="text-[clamp(1.25rem,2.4vw,1.6rem)] font-bold tracking-[-0.025em] text-ink">
              Keterbatasan metode
            </h2>
          </Reveal>
          <Stagger className="mt-6 grid gap-4 sm:grid-cols-3" gap={0.06}>
            {[
              ['Origin header', 'API PDDikti mensyaratkan header Origin yang tepat, dan paginasi diabaikan. Katalog disusun per kata kunci.'],
              ['Sumber UKT', 'Nominal per golongan berasal dari dekrit KMA 204/2026. Kampus lain memakai input manual dan ditandai belum diverifikasi.'],
              ['Bukan penyelenggara', 'Kami tidak menerima pendaftaran. Semua tautan mengarah ke situs resmi penyelenggara.'],
            ].map(([t, d]) => (
              <div key={t} className="border-t border-line-strong pt-4">
                <p className="text-[14px] font-semibold text-ink">{t}</p>
                <p className="mt-1.5 text-[13.5px] leading-relaxed text-ink-faint">{d}</p>
              </div>
            ))}
          </Stagger>

          <Reveal delay={0.1}>
            <Link
              href="/cek"
              className="press mt-8 inline-flex items-center gap-1.5 text-[13.5px] font-semibold text-accent hover:underline"
            >
              Cek kelayakanku
              <ArrowUpRight size={14} weight="bold" />
            </Link>
          </Reveal>
        </div>
      </section>
    </>
  );
}
