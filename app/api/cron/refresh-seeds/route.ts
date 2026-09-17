import { NextResponse } from 'next/server';
import { institutions, scholarships, seedsMeta } from '@/lib/data';

export const dynamic = 'force-dynamic';

/**
 * Vercel Cron harian (Hobby: hanya sekali sehari).
 *
 * Tugasnya bukan mengunduh data — mengunduh dilakukan skrip di repositori dan
 * hasilnya di-commit, supaya tidak ada kejutan di produksi. Tugas cron di sini
 * adalah MEMERIKSA KESEHATAN data: pastikan seed yang ter-deploy masih masuk
 * akal, dan berteriak kalau tidak.
 */
export async function GET(req: Request) {
  const secret = process.env.CRON_SECRET;
  const auth = req.headers.get('authorization');

  if (secret && auth !== `Bearer ${secret}`) {
    return NextResponse.json({ status: 'error', message: 'unauthorized' }, { status: 401 });
  }

  const masalah: string[] = [];

  if (institutions.length < 3000) masalah.push(`katalog kampus mencurigakan: ${institutions.length}`);
  const denganUkt = institutions.filter((i) => i.ukt).length;
  if (denganUkt < 40) masalah.push(`kampus ber-UKT hanya ${denganUkt}`);
  if (Number(seedsMeta.ukt.prodi) < 1000) masalah.push(`baris prodi UKT hanya ${seedsMeta.ukt.prodi}`);

  for (const s of scholarships) {
    if (!s.source_url?.startsWith('https://')) masalah.push(`${s.slug}: source_url tidak valid`);
    if (!Number.isFinite(Date.parse(s.last_verified_at))) masalah.push(`${s.slug}: last_verified_at rusak`);
    if (s.scope === 'nasional' && s.ukt_max_golongan !== undefined) {
      masalah.push(`${s.slug}: beasiswa nasional memakai nomor golongan (§5 dilanggar)`);
    }
  }

  const umurHari = Math.floor(
    (Date.now() - Date.parse(seedsMeta.institutions.generated_at as string)) / 86_400_000,
  );
  if (umurHari > 45) masalah.push(`katalog kampus berumur ${umurHari} hari — jalankan refresh shard`);

  return NextResponse.json(
    {
      status: masalah.length === 0 ? 'success' : 'warning',
      checked_at: new Date().toISOString(),
      ringkasan: {
        kampus: institutions.length,
        kampus_ber_ukt: denganUkt,
        prodi_ukt: seedsMeta.ukt.prodi,
        beasiswa: scholarships.length,
        umur_katalog_hari: umurHari,
      },
      masalah,
    },
    { status: masalah.length === 0 ? 200 : 500 },
  );
}