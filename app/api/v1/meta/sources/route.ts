import { NextResponse } from 'next/server';
import { institutions, seedsMeta, scholarships } from '@/lib/data';

export const revalidate = 600;

/**
 * GET /api/v1/meta/sources
 *
 * Status keterbukaan data. Dipakai halaman publik "Status data" supaya setiap
 * angka di aplikasi bisa ditelusuri asalnya.
 */
export async function GET() {
  const withUkt = institutions.filter((i) => i.ukt).length;

  return NextResponse.json({
    status: 'success',
    data: {
      katalog: {
        sumber: 'api-pddikti.kemdiktisaintek.go.id /pencarian/pt/{q}',
        metode: seedsMeta.institutions.method,
        jumlah_pt: institutions.length,
        digenerate: seedsMeta.institutions.generated_at,
        catatan: 'API PDDikti tidak berdokumentasi resmi; header Origin wajib dikirim.',
        unofficial: true,
      },
      ukt: {
        sumber: seedsMeta.ukt.source_url,
        dekrit: seedsMeta.ukt.decree,
        tahun_akademik: seedsMeta.ukt.academic_year,
        ptkin: seedsMeta.ukt.ptkin,
        prodi: seedsMeta.ukt.prodi,
        prodi_golongan_lengkap: seedsMeta.ukt.prodiGolonganLengkap,
        kampus_terpasang: withUkt,
        catatan:
          'Nomor golongan tidak sebanding antar kampus. Beasiswa nasional dinilai memakai plafon rupiah, bukan nomor golongan.',
      },
      beasiswa: {
        jumlah: scholarships.length,
        resmi: scholarships.filter((s) => s.source_kind === 'resmi').length,
        agregator: scholarships.filter((s) => s.source_kind === 'agregator').length,
        catatan: 'Setiap entri wajib membawa source_url dan last_verified_at.',
        pemeriksaan_terakhir: new Date().toISOString(),
      },
    },
  });
}