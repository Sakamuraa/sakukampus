import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  // Build SELALU di Vercel. Panel dev tidak pernah menjalankan `next build`.
  reactStrictMode: true,
  poweredByHeader: false,
  // Halaman katalog di-cache di CDN; data berubah harian, bukan per detik.
  // Ini juga yang menjaga pemakaian DB tetap rendah saat Postgres diaktifkan.
  experimental: {},
};

export default nextConfig;