import type { Metadata, Viewport } from 'next';
import { Plus_Jakarta_Sans, IBM_Plex_Mono } from 'next/font/google';
import './globals.css';
import { TopNav, TabBar } from '@/components/nav';
import Logo from '@/components/ui/logo';

const display = Plus_Jakarta_Sans({
  subsets: ['latin'],
  weight: ['200', '400', '500', '600', '700', '800'],
  variable: '--font-display',
  display: 'swap',
});

const numeric = IBM_Plex_Mono({
  subsets: ['latin'],
  weight: ['400', '500', '600'],
  variable: '--font-numeric',
  display: 'swap',
});

export const metadata: Metadata = {
  metadataBase: new URL('https://sakukampus.onheil.fun'),
  title: {
    default: 'SakuKampus — Cek Beasiswa Pakai UKT Kampusmu',
    template: '%s · SakuKampus',
  },
  description:
    'Platform agregator beasiswa Indonesia. Nilai kelayakan dari nominal rupiah UKT kampusmu, bukan nomor golongan. Katalog 3.690+ kampus PDDikti.',
  alternates: {
    canonical: '/',
    languages: {
      'id-ID': '/',
    },
  },
  openGraph: {
    type: 'website',
    locale: 'id_ID',
    url: '/',
    siteName: 'SakuKampus',
    title: 'SakuKampus — Cek Beasiswa Pakai UKT Kampusmu',
    description: 'Agregasi beasiswa kampus, pemerintah, dan swasta. Kelayakan dihitung dari rupiah UKT riil.',
    images: [
      {
        url: '/og-home.png',
        width: 1200,
        height: 630,
        alt: 'SakuKampus preview',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'SakuKampus — Cek Beasiswa Pakai UKT Kampusmu',
    description: 'Agregasi beasiswa dari 3.690+ kampus Indonesia.',
    images: ['/og-home.png'],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  verification: {
    other: {
      'viewport-width': 'device-width',
    },
  },
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  viewportFit: 'cover',
  // Keyboard Android mengecilkan viewport, bukan menutupi isian. Tanpa ini,
  // kolom pencarian kampus tertutup keyboard saat diketik.
  interactiveWidget: 'resizes-content',
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#f6f7f5' },
    { media: '(prefers-color-scheme: dark)', color: '#0f1210' },
  ],
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="id" className={`${display.variable} ${numeric.variable}`}>
      <body>
        <a
          href="#isi"
          className="small"
          style={{
            position: 'absolute',
            left: -9999,
            top: 0,
            padding: 10,
            background: 'var(--color-accent)',
            color: 'var(--color-accent-ink)',
            zIndex: 100,
          }}
        >
          Lompat ke isi
        </a>
        <TopNav />
        <main id="isi">{children}</main>
        <footer>
          <div className="wrap" style={{ paddingTop: 28, paddingBottom: 80 }}>
            <p className="tiny faint" style={{ margin: '0 0 6px', maxWidth: '68ch' }}>
              Nominal UKT diambil dari Keputusan Menteri Agama (KMA 204/2026), katalog kampus dari
              PDDikti, jadwal beasiswa dari pengumuman resmi masing-masing penyelenggara. Setiap
              angka punya tautan sumbernya.
            </p>
            <p className="tiny faint" style={{ margin: '0 0 6px', maxWidth: '68ch' }}>
              SakuKampus tidak menyelenggarakan beasiswa dan tidak menerima pendaftaran. Semua
              tautan pendaftaran mengarah ke situs resmi penyelenggara.
            </p>
            <p className="tiny faint" style={{ margin: '12px 0 0', opacity: 0.7 }}>
              © Kelompok TURUNKAN UKT, Teknik Informatika UIN Jakarta 2026
            </p>
          </div>
        </footer>
        <TabBar />
      </body>
    </html>
  );
}