import type { Metadata, Viewport } from 'next';
import { Plus_Jakarta_Sans, IBM_Plex_Mono } from 'next/font/google';
import './globals.css';
import { TopNav, TabBar } from '@/components/nav';

/* Self-hosted through next/font so there is no render-blocking Google request,
   no layout shift, and no third-party connection on a page students open on
   metered mobile data. */
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
  title: {
    default: 'SakuKampus: cek beasiswa pakai UKT kampusmu',
    template: '%s · SakuKampus',
  },
  description:
    'Katalog beasiswa kampus, pemerintah, dan swasta untuk seluruh perguruan tinggi Indonesia. Kelayakan dihitung dari nominal rupiah UKT kampusmu, bukan nomor golongan.',
  metadataBase: new URL('https://sakukampus.onheil.fun'),
  openGraph: {
    type: 'website',
    locale: 'id_ID',
    siteName: 'SakuKampus',
    title: 'SakuKampus: cek beasiswa pakai UKT kampusmu',
    description:
      'Beasiswa kampus, pemerintah, dan swasta. Kelayakan dihitung dari rupiah UKT kampusmu.',
  },
  robots: { index: true, follow: true },
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
          <div className="shell" style={{ padding: '28px 20px 40px' }}>
            <p className="small faint" style={{ margin: '0 0 8px', maxWidth: '68ch' }}>
              Nominal UKT diambil dari Keputusan Menteri Agama (KMA 204/2026), katalog kampus dari
              PDDikti, jadwal beasiswa dari pengumuman resmi masing-masing penyelenggara. Setiap
              angka punya tautan sumbernya.
            </p>
            <p className="small faint" style={{ margin: 0, maxWidth: '68ch' }}>
              SakuKampus tidak menyelenggarakan beasiswa dan tidak menerima pendaftaran. Semua
              tautan pendaftaran mengarah ke situs resmi penyelenggara.
            </p>
          </div>
        </footer>
        <TabBar />
      </body>
    </html>
  );
}