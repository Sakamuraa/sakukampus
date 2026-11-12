import type { Metadata, Viewport } from 'next';
import Link from 'next/link';
import { Newsreader, Plus_Jakarta_Sans, IBM_Plex_Mono } from 'next/font/google';
import './globals.css';
import { TopNav, TabBar } from '@/components/nav';

/* Serif carries the editorial voice (headlines, section openers).
   Sans carries the reading. Mono carries every number. */
const display = Newsreader({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
  style: ['normal', 'italic'],
  variable: '--font-newsreader',
  display: 'swap',
});

const sans = Plus_Jakarta_Sans({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700', '800'],
  variable: '--font-plus-jakarta',
  display: 'swap',
});

const numeric = IBM_Plex_Mono({
  subsets: ['latin'],
  weight: ['400', '500', '600'],
  variable: '--font-plex-mono',
  display: 'swap',
});

export const metadata: Metadata = {
  metadataBase: new URL('https://sakukampus.web.id'),
  title: {
    default: 'SakuKampus: cek kelayakan beasiswa dari UKT asli',
    template: '%s · SakuKampus',
  },
  description:
    'Katalog 6.891+ kampus PDDikti dan 26 beasiswa dengan syarat UKT dinyatakan dalam rupiah, bukan nomor golongan.',
  alternates: { canonical: '/', languages: { 'id-ID': '/' } },
  openGraph: {
    type: 'website',
    locale: 'id_ID',
    url: '/',
    siteName: 'SakuKampus',
    title: 'SakuKampus: cek kelayakan beasiswa dari UKT asli',
    description: 'Kelayakan beasiswa dihitung dari nominal rupiah UKT kampusmu.',
    images: [{ url: '/og.png', width: 1200, height: 630, alt: 'SakuKampus' }],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'SakuKampus: cek kelayakan beasiswa dari UKT asli',
    description: 'Kelayakan beasiswa dihitung dari nominal rupiah UKT kampusmu.',
    images: ['/og.png'],
  },
  robots: { index: true, follow: true },
  icons: {
    icon: [{ url: '/icon.png', sizes: '64x64', type: 'image/png' }],
    apple: [{ url: '/apple-touch-icon.png', sizes: '180x180' }],
  },
  appleWebApp: { title: 'SakuKampus', statusBarStyle: 'black-translucent' },
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  viewportFit: 'cover',
  // Android keyboard resizes the viewport instead of covering inputs.
  interactiveWidget: 'resizes-content',
  themeColor: [{ media: '(prefers-color-scheme: light)', color: '#f4f1e9' }],
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="id" className={`${display.variable} ${sans.variable} ${numeric.variable}`}>
      <body className="min-h-dvh bg-bg text-ink antialiased">
        {/* Tanpa JavaScript, blok reveal akan menyembunyikan isi selamanya.
            <noscript> hanya dirender browser yang JS-nya mati, jadi di sana
            kita buka lagi semua elemen yang menunggu reveal. */}
        <noscript>
          <style>{`[data-reveal]{opacity:1!important;transform:none!important}`}</style>
        </noscript>
        <a
          href="#isi"
          className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[100] focus:rounded-ctl focus:bg-accent focus:px-4 focus:py-2 focus:font-semibold focus:text-accent-ink"
        >
          Lompat ke isi
        </a>

        <TopNav />

        <main id="isi" className="pb-24 lg:pb-0">
          {children}
        </main>

        <footer className="border-t border-line-strong bg-surface-2 pb-24 lg:pb-12">
          <div className="wrap grid gap-10 pt-14 sm:grid-cols-2 lg:grid-cols-[1.6fr_1fr_1fr]">
            <div className="max-w-[44ch]">
              <div className="flex items-start gap-3">
                <img src="/logo.png" alt="" className="mt-1 h-7 w-7 rounded-[7px] object-contain" />
                <p className="font-display text-[19px] leading-none font-semibold tracking-[-0.02em] text-ink">
                  SakuKampus
                </p>
              </div>
              <p className="mt-4 text-[13.5px] leading-relaxed text-ink-dim">
                Nominal UKT dari KMA 204/2026, katalog kampus dari PDDikti, jadwal dari
                pengumuman resmi penyelenggara.
              </p>
              <p className="eyebrow mt-5">UKT dalam rupiah, bukan nomor golongan</p>
            </div>

            <div>
              <p className="eyebrow">Produk</p>
              <ul className="mt-4 grid gap-2.5 text-[13.5px] text-ink-dim">
                <li><Link href="/cek" className="press hover:text-accent">Cek kelayakan</Link></li>
                <li><Link href="/beasiswa" className="press hover:text-accent">Katalog beasiswa</Link></li>
                <li><Link href="/jadwal" className="press hover:text-accent">Jadwal tenggat</Link></li>
              </ul>
            </div>

            <div>
              <p className="eyebrow">Transparansi</p>
              <ul className="mt-4 grid gap-2.5 text-[13.5px] text-ink-dim">
                <li><Link href="/data" className="press hover:text-accent">Status data</Link></li>
                <li><Link href="/data" className="press hover:text-accent">API publik</Link></li>
                <li><span className="text-ink-faint">Sumber &amp; metode</span></li>
              </ul>
            </div>
          </div>

          <div className="wrap mt-12 flex flex-col gap-2 border-t border-line pt-6 text-[12.5px] text-ink-faint sm:flex-row sm:items-center sm:justify-between">
            <p>
              SakuKampus tidak menyelenggarakan beasiswa. Semua tautan pendaftaran mengarah ke
              situs resmi penyelenggara.
            </p>
            <p>© 2026 Kelompok TURUNKAN UKT, UIN Jakarta</p>
          </div>
        </footer>

        <TabBar />
      </body>
    </html>
  );
}
