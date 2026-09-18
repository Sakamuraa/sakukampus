import type { Metadata } from 'next';
import CekClient from './CekClient';

export const metadata: Metadata = {
  title: 'Cek kelayakan beasiswa',
  description:
    'Cek kelayakan beasiswa berdasarkan UKT riil kampusmu. Masukkan prodi dan golongan, lihat daftar beasiswa yang cocok dengan prioritas lolos/need data/sudah tutup.',
  alternates: {
    canonical: '/cek',
  },
  openGraph: {
    title: 'Cek Kelayakan Beasiswa — SakuKampus',
    url: '/cek',
    description: 'Simulasi gratis: masukkan profil akademik untuk filter beasiswa yang cocok.',
  },
};

export default function CekPage() {
  return <CekClient />;
}