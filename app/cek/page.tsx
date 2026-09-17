import type { Metadata } from 'next';
import CekClient from './CekClient';

export const metadata: Metadata = {
  title: 'Cek kelayakan beasiswa',
  description:
    'Pilih kampus dan golongan UKT-mu, lihat beasiswa yang benar-benar cocok. Kelayakan dihitung dari nominal rupiah UKT kampusmu, lengkap dengan alasan per syarat.',
};

export default function CekPage() {
  return <CekClient />;
}