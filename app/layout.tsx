import type { Metadata, Viewport } from 'next';
import Link from 'next/link';
import { Plus_Jakarta_Sans, IBM_Plex_Mono } from 'next/font/google';
import './globals.css';
import { TopNav, TabBar } from '@/components/nav';

const display = Plus_Jakarta_Sans({
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
  metadataBase: new URL('https://sakukampus.onheil.fun'),
  title: {
    default: 'SakuKampus: cek kelayakan beasiswa dari UKT riil',
    template: '%s · SakuKampus',
  },
  description:
    'Katalog 3.693+ kampus PDDikti dan 19 beasiswa dengan syarat UKT dinyatakan dalam rupiah, bukan nomor golongan.',
  alternates: { canonical: '/', languages: { 'id-ID': '/' } },
  openGraph: {
    type: 'website',
    locale: 'id_ID',
    url: '/',
    siteName: 'SakuKampus',
    title: 'SakuKampus: cek kelayakan beasiswa dari UKT riil',
    description: 'Kelayakan beasiswa dihitung dari nominal rupiah UKT kampusmu.',
    images: [{ url: '/og.png', width: 1200, height: 630, alt: 'SakuKampus' }],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'SakuKampus: cek kelayakan beasiswa dari UKT riil',
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
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#0a0c10' },
    { media: '(prefers-color-scheme: dark)', color: '#0a0c10' },
  ],
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="id" className={`${display.variable} ${numeric.variable}`}>
      <body className="min-h-dvh bg-bg text-ink antialiased">
        <a
          href="#isi"
          className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[100] focus:rounded-ctl focus:bg-accent focus:px-4 focus:py-2 focus:font-semibold focus:text-[#14100a]"
        >
          Lompat ke isi
        </a>

        <TopNav />

        <main id="isi" className="pb-24 lg:pb-0">
          {children}
        </main>

        <footer className="border-t border-line pb-24 lg:pb-10">
          <div className="wrap grid gap-6 pt-10 sm:grid-cols-2 lg:grid-cols-[1.4fr_1fr_1fr]">
            <div className="flex items-start gap-2.5">
              <img src="/logo.png" alt="" className="mt-0.5 h-6 w-6 rounded-md object-contain" />
              <div>
                <p className="text-[13.5px] font-bold text-ink">SakuKampus</p>
                <p className="mt-1 max-w-[46ch] text-[13px] leading-relaxed text-ink-faint">
                  Nominal UKT dari KMA 204/2026, katalog kampus dari PDDikti, jadwal dari
                  pengumuman resmi penyelenggara.
                </p>
              </div>
            </div>

            <div>
              <p className="text-[12px] font-semibold tracking-[0.06em] text-ink-faint uppercase">
                Produk
              </p>
              <ul className="mt-3 grid gap-2 text-[13.5px] text-ink-dim">
                <li><Link href="/cek" className="press hover:text-accent">Cek kelayakan</Link></li>
                <li><Link href="/beasiswa" className="press hover:text-accent">Katalog beasiswa</Link></li>
                <li><Link href="/jadwal" className="press hover:text-accent">Jadwal tenggat</Link></li>
              </ul>
            </div>

            <div>
              <p className="text-[12px] font-semibold tracking-[0.06em] text-ink-faint uppercase">
                Transparansi
              </p>
              <ul className="mt-3 grid gap-2 text-[13.5px] text-ink-dim">
                <li><Link href="/data" className="press hover:text-accent">Status data</Link></li>
                <li><Link href="/data" className="press hover:text-accent">API publik</Link></li>
                <li><span className="text-ink-faint">Sumber &amp; metode</span></li>
              </ul>
            </div>
          </div>

          <div className="wrap mt-8 flex flex-col gap-2 border-t border-line pt-6 text-[12.5px] text-ink-faint sm:flex-row sm:items-center sm:justify-between">
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
