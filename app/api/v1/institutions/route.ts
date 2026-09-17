import { NextResponse } from 'next/server';
import {
  institutions,
  institutionsByKode,
  searchInstitutions,
  seedsMeta,
  scholarships,
} from '@/lib/data';
import { uktTabel } from '@/lib/match';

export const revalidate = 3600;

/**
 * GET /api/v1/institutions?q=&jenis=&limit=&kode=
 * Tanpa `q`: kembalikan ringkasan sumber + jumlah katalog (untuk halaman status).
 */
export async function GET(req: Request) {
  const url = new URL(req.url);
  const kode = url.searchParams.get('kode');
  const prodiDiminta = url.searchParams.get('prodi');

  if (kode) {
    const item = institutionsByKode.get(kode);
    if (!item) {
      return NextResponse.json({ status: 'error', message: 'kampus tidak ditemukan', kode }, { status: 404 });
    }
    return NextResponse.json({
      status: 'success',
      data: {
        kode: item.kode,
        nama: item.nama,
        jenis: item.jenis,
        ukt_model: item.ukt ? 'ptkin_kma' : 'manual',
        ukt_source_url: item.ukt ? seedsMeta.ukt.source_url : null,
        ukt_note: item.ukt
          ? `KMA 204/2026, TA ${seedsMeta.ukt.academic_year}`
          : 'Kampus ini belum punya data UKT terverifikasi. Isi nominal UKT-mu secara manual.',
        prodi_terdaftar: item.ukt
          ? item.ukt.prodi.map((p) => ({
              nama: p.prodi,
              fakultas: p.fakultas,
              ada_data_ukt: p.gol.some((g) => g !== null),
              golongan: p.gol.length + (p.kip !== null ? 1 : 0),
            }))
          : [],
        // Tabel UKT untuk prodi yang diminta; kalau tidak disebut, pakai prodi
        // pertama sebagai contoh. Nominal selalu dari prodi itu, tidak dirata-ratakan.
        contoh_ukt: item.ukt
          ? uktTabel(item.ukt, prodiDiminta ?? item.ukt.prodi[0].prodi)
          : [],
        prodi_contoh: item.ukt ? (prodiDiminta ?? item.ukt.prodi[0].prodi) : null,
      },
    });
  }

  const q = url.searchParams.get('q') ?? '';
  const jenis = url.searchParams.get('jenis') ?? undefined;
  const limit = Number(url.searchParams.get('limit') ?? 30);

  if (!q) {
    return NextResponse.json({
      status: 'success',
      data: {
        total: institutions.length,
        dengan_ukt_terverifikasi: institutions.filter((i) => i.ukt).length,
        sumber: {
          katalog: seedsMeta.institutions,
          ukt: seedsMeta.ukt,
          beasiswa: seedsMeta.scholarships,
        },
      },
    });
  }

  const hasil = searchInstitutions(q, { jenis, limit });
  return NextResponse.json({
    status: 'success',
    data: hasil.map((i) => ({
      kode: i.kode,
      nama: i.nama,
      jenis: i.jenis,
      punya_ukt: Boolean(i.ukt),
      jumlah_prodi: i.ukt?.prodi.length ?? 0,
    })),
  });
}