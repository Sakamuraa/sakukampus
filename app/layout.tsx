import type { Metadata, Viewport } from 'next';
import Link from 'next/link';
import './globals.css';

export const metadata: Metadata = {
  title: {
    default: 'SakuKampus — cek beasiswa sesuai golongan UKT kampusmu',
    template: '%s · SakuKampus',
  },
  description:
    'Katalog beasiswa kampus, pemerintah, dan swasta untuk seluruh perguruan tinggi Indonesia. Cek kelayakan otomatis berdasarkan golongan UKT kampusmu, lengkap dengan sumber resmi dan tanggal verifikasi.',
  metadataBase: new URL('https://sakukampus.onheil.fun'),
  openGraph: {
    type: 'website',
    locale: 'id_ID',
    siteName: 'SakuKampus',
    title: 'SakuKampus — cek beasiswa sesuai golongan UKT kampusmu',
    description:
      'Beasiswa kampus, pemerintah, dan swasta. Kelayakan dihitung dari rupiah UKT kampusmu, bukan nomor golongan.',
  },
  robots: { index: true, follow: true },
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  viewportFit: 'cover',
};

const NAV = [
  { href: '/', label: 'Beranda' },
  { href: '/cek', label: 'Cek kelayakan' },
  { href: '/beasiswa', label: 'Beasiswa' },
  { href: '/jadwal', label: 'Jadwal' },
  { href: '/data', label: 'Status data' },
];

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="id">
      <body>
        <header className="top">
          <div className="top-in">
            <Link href="/" className="brand">
              Saku<span>Kampus</span>
            </Link>
            <nav className="nav">
              {NAV.map((n) => (
                <Link key={n.href} href={n.href}>
                  {n.label}
                </Link>
              ))}
            </nav>
          </div>
        </header>
        <main className="wrap">{children}</main>
        <footer className="wrap">
          <p className="tiny">
            Setiap angka di aplikasi ini menempel pada sumber resminya. Nominal UKT diambil dari
            Keputusan Menteri Agama (KMA), katalog kampus dari PDDikti, jadwal beasiswa dari
            pengumuman resmi masing-masing penyelenggara.
          </p>
          <p className="tiny">
            SakuKampus tidak menyelenggarakan beasiswa dan tidak menerima pendaftaran. Semua tautan
            pendaftaran mengarah ke situs resmi penyelenggara.
          </p>
        </footer>
      </body>
    </html>
  );
}