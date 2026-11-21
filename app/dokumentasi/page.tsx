import type { Metadata } from 'next';
import Link from 'next/link';
import { ArrowRight } from '@phosphor-icons/react/dist/ssr/ArrowRight';
import { ArrowUpRight } from '@phosphor-icons/react/dist/ssr/ArrowUpRight';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Reveal, Stagger } from '@/components/motion/reveal';
import Karakter from '@/components/dokumentasi/karakter';

export const metadata: Metadata = {
  title: 'Dokumentasi',
  description:
    'Tentang SakuKampus dan tim di baliknya: Kelompok TURUNKAN UKT, Rekayasa Perangkat Lunak kelas A, Teknik Informatika UIN Jakarta.',
  alternates: { canonical: '/dokumentasi' },
  openGraph: {
    title: 'Dokumentasi · SakuKampus',
    description:
      'Tentang SakuKampus dan tim di baliknya: Kelompok TURUNKAN UKT, RPL kelas A, Teknik Informatika UIN Jakarta.',
    url: '/dokumentasi',
  },
};

const PRINSIP = [
  {
    k: 'Rupiah',
    t: 'Nomor golongan tidak bisa dibandingkan antar kampus',
    d: 'Golongan 2 di satu kampus bisa dua kali lipat lebih mahal daripada golongan 2 di kampus lain. Karena itu setiap syarat beasiswa kami terjemahkan ke nominal rupiah lebih dulu.',
  },
  {
    k: 'Sumber',
    t: 'Semua angka punya asal yang bisa ditelusuri',
    d: 'Nominal UKT dari KMA 204/2026, katalog kampus dari PDDikti, jadwal dan syarat dari pengumuman resmi penyelenggara. Tiap baris membawa cap sumbernya sendiri.',
  },
  {
    k: 'Jujur',
    t: 'Data yang kurang dilaporkan sebagai kurang',
    d: 'Kalau ada syarat yang datanya belum bisa kamu penuhi, hasilnya “perlu data”, bukan “tidak lolos”. Kami tidak menebak.',
  },
] as const;

const TIM = [
  {
    nama: 'Alvin Rizky Haryadi',
    peran: 'Lead developer',
    tugas: 'Arsitektur aplikasi, pipeline pencarian beasiswa, dan arah produk.',
    lead: true,
  },
  {
    nama: 'Salman Fariz Avisena',
    peran: 'Anggota',
    tugas: 'Halaman cek kelayakan dan logika pencocokan syarat.',
    lead: false,
  },
  {
    nama: 'Bona Rizki',
    peran: 'Anggota',
    tugas: 'Katalog beasiswa dan penelusuran sumber pengumuman resmi.',
    lead: false,
  },
  {
    nama: 'Sulthan Biyan Hasyim',
    peran: 'Anggota',
    tugas: 'Penyaringan data UKT dan validasi baris prodi.',
    lead: false,
  },
  {
    nama: 'Yazid Baihaqi',
    peran: 'Anggota',
    tugas: 'Antarmuka, sistem desain, dan aksesibilitas.',
    lead: false,
  },
] as const;

const FAKTA = [
  { k: 'Nama kelompok', v: 'TURUNKAN UKT' },
  { k: 'Mata kuliah', v: 'Rekayasa Perangkat Lunak (RPL)' },
  { k: 'Kelas', v: 'A' },
  { k: 'Program studi', v: 'Teknik Informatika' },
  { k: 'Institusi', v: 'UIN Syarif Hidayatullah Jakarta' },
  { k: 'Anggota', v: '5 orang' },
] as const;

export default function DokumentasiPage() {
  return (
    <>
      {/* ─────────────────────────────────────── HERO */}
      <section className="border-b border-line-strong">
        <div className="wrap grid items-start gap-12 pt-14 pb-14 lg:grid-cols-[1.1fr_0.9fr] lg:gap-20 lg:pt-20 lg:pb-20">
          <div className="min-w-0">
            <Reveal>
              <p className="eyebrow">Dokumentasi</p>
            </Reveal>

            <Reveal delay={0.06}>
              <h1 className="mt-5 max-w-[15ch] font-display text-[clamp(2.2rem,5vw,3.4rem)] leading-[1.03] font-semibold tracking-[-0.03em] text-ink">
                Proyek kecil soal <span className="italic text-accent">UKT</span> yang terlalu sering ditanyakan.
              </h1>
            </Reveal>

            <Reveal delay={0.12}>
              <div className="mt-7 h-px w-full bg-line-strong" />
              <p className="mt-6 max-w-[52ch] text-[16px] leading-relaxed text-ink-dim">
                SakuKampus dibuat untuk satu pertanyaan yang muncul tiap semester: beasiswa mana
                yang benar-benar cocok dengan UKT yang aku bayar? Halaman ini menjelaskan apa itu
                SakuKampus dan siapa yang membangunnya.
              </p>
            </Reveal>

            <Reveal delay={0.18}>
              <div className="mt-9 flex flex-wrap items-center gap-4">
                <Link href="/cek">
                  <Button size="lg">
                    Coba cek kelayakan
                    <ArrowRight size={16} weight="bold" />
                  </Button>
                </Link>
                <Link
                  href="/data"
                  className="press inline-flex items-center gap-1.5 text-[14.5px] font-semibold text-ink underline decoration-line-strong decoration-1 underline-offset-[6px] hover:text-accent hover:decoration-accent"
                >
                  Lihat status data
                  <ArrowUpRight size={14} weight="bold" />
                </Link>
              </div>
            </Reveal>
          </div>

          <Reveal delay={0.24} y={24} className="min-w-0">
            <Karakter
              headSrc="/dokumentasi/rem-head.png"
              bodySrc="/dokumentasi/rem-body.png"
              alt="Rem, karakter dari anime Re:Zero kara Hajimeru Isekai Seikatsu"
              caption="Rem · Re:Zero kara Hajimeru Isekai Seikatsu"
            />
          </Reveal>
        </div>
      </section>

      {/* ─────────────────────────────────────── TENTANG SAKUKAMPUS */}
      <section className="section-pad border-b border-line-strong">
        <div className="wrap">
          <Reveal>
            <p className="eyebrow">Tentang SakuKampus</p>
            <h2 className="mt-4 max-w-[24ch] font-display text-[clamp(1.8rem,3.6vw,2.6rem)] leading-[1.08] font-semibold tracking-[-0.028em] text-ink">
              UKT dalam rupiah, bukan nomor golongan
            </h2>
            <p className="mt-5 max-w-[62ch] text-[15px] leading-relaxed text-ink-dim">
              SakuKampus adalah alat bantu pemeriksaan kelayakan beasiswa untuk mahasiswa
              Indonesia. Kamu memasukkan kampus dan golongan UKT-mu, lalu kami bandingkan dengan
              plafon rupiah tiap beasiswa dan laporkan apa yang sudah cocok, apa yang belum, dan
              apa yang datanya masih kurang.
            </p>
          </Reveal>

          <div className="mt-12 border-t border-line-strong">
            <Stagger className="divide-y divide-line">
              {PRINSIP.map((p, i) => (
                <div key={p.k} className="grid gap-3 py-8 sm:grid-cols-[96px_1fr] sm:gap-10">
                  <span className="num pt-1 text-[12px] font-semibold tracking-[0.1em] whitespace-nowrap text-accent">
                    {String(i + 1).padStart(2, '0')} · {p.k}
                  </span>
                  <div>
                    <p className="font-display text-[19px] leading-snug font-semibold text-ink">
                      {p.t}
                    </p>
                    <p className="mt-2.5 max-w-[62ch] text-[14px] leading-relaxed text-ink-faint">
                      {p.d}
                    </p>
                  </div>
                </div>
              ))}
            </Stagger>
          </div>

          <Reveal delay={0.1}>
            <div className="mt-10 flex flex-wrap items-center gap-3">
              <Badge variant="accent">KMA 204/2026</Badge>
              <Badge variant="neutral">PDDikti</Badge>
              <Badge variant="neutral">Pengumuman resmi</Badge>
              <span className="text-[13px] text-ink-faint">
                Sumber data yang dipakai di seluruh halaman.
              </span>
            </div>
          </Reveal>
        </div>
      </section>

      {/* ─────────────────────────────────────── TENTANG KAMI */}
      <section className="section-pad border-b border-line-strong">
        <div className="wrap">
          <Reveal>
            <p className="eyebrow">Tentang Kami</p>
            <h2 className="mt-4 max-w-[26ch] font-display text-[clamp(1.8rem,3.6vw,2.6rem)] leading-[1.08] font-semibold tracking-[-0.028em] text-ink">
              Kelompok TURUNKAN UKT
            </h2>
            <p className="mt-5 max-w-[62ch] text-[15px] leading-relaxed text-ink-dim">
              SakuKampus dikerjakan sebagai proyek mata kuliah Rekayasa Perangkat Lunak (RPL),
              kelas A, Program Studi Teknik Informatika, UIN Syarif Hidayatullah Jakarta, oleh lima
              orang.
            </p>
          </Reveal>

          <Reveal delay={0.08}>
            <dl className="mt-10 grid gap-x-10 gap-y-6 border-t border-line-strong pt-8 sm:grid-cols-2 lg:grid-cols-3">
              {FAKTA.map((f) => (
                <div key={f.k}>
                  <dt className="text-[11.5px] font-semibold tracking-[0.09em] uppercase text-ink-faint">
                    {f.k}
                  </dt>
                  <dd className="mt-2 font-display text-[16.5px] leading-snug font-semibold text-ink">
                    {f.v}
                  </dd>
                </div>
              ))}
            </dl>
          </Reveal>

          <Reveal delay={0.12}>
            <h3 className="mt-14 font-display text-[clamp(1.3rem,2.4vw,1.7rem)] font-semibold tracking-[-0.022em] text-ink">
              Anggota
            </h3>
          </Reveal>

          <Stagger className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3" gap={0.06}>
            {TIM.map((m, i) => (
              <Card key={m.nama} className="h-full">
                <CardContent className="flex h-full flex-col gap-3">
                  <div className="flex items-start justify-between gap-3">
                    <span className="num text-[12px] font-semibold tracking-[0.1em] text-accent">
                      {String(i + 1).padStart(2, '0')}
                    </span>
                    {m.lead && <Badge variant="accent">Lead</Badge>}
                  </div>
                  <div>
                    <p className="font-display text-[17px] leading-snug font-semibold text-ink">
                      {m.nama}
                    </p>
                    <p className="mt-1 text-[12.5px] font-semibold tracking-[0.06em] uppercase text-ink-faint">
                      {m.peran}
                    </p>
                  </div>
                  <p className="mt-auto pt-2 text-[13px] leading-relaxed text-ink-dim">{m.tugas}</p>
                </CardContent>
              </Card>
            ))}
          </Stagger>
        </div>
      </section>

      {/* ─────────────────────────────────────── CTA */}
      <section className="section-pad">
        <div className="wrap">
          <Reveal>
            <div className="relative overflow-hidden rounded-card border border-accent/25 bg-accent-soft/45 px-6 py-10 sm:px-10 sm:py-12">
              <div aria-hidden className="absolute inset-y-0 left-0 w-[3px] bg-accent" />
              <div className="flex flex-col items-start gap-6 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <h2 className="max-w-[26ch] font-display text-[clamp(1.5rem,2.8vw,2rem)] leading-[1.15] font-semibold tracking-[-0.022em] text-ink">
                    Ada data yang salah atau beasiswa yang belum tercatat?
                  </h2>
                  <p className="mt-4 max-w-[54ch] text-[14.5px] leading-relaxed text-ink-dim">
                    SakuKampus terbuka untuk koreksi. Semua sumber yang kami pakai bisa kamu
                    periksa di halaman status data.
                  </p>
                </div>
                <Link href="/data" className="shrink-0">
                  <Button size="lg">
                    Buka status data
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