import { NextResponse } from 'next/server';
import { institutionsByKode, scholarships, seedsMeta } from '@/lib/data';
import { matchAll, type Profile } from '@/lib/match';

export const dynamic = 'force-dynamic';

type Body = {
  kode_pt?: string;
  prodi?: string;
  kelompok?: number | null;
  nominal_manual?: number | null;
  /** Jawaban kuesioner finansial yang disimpan di device (bukan data pribadi). */
  profil?: Profile;
};

export type CheckResponse = {
  status: 'success';
  data: {
    kampus: { kode: string; nama: string; ukt_model: string };
    ukt: {
      dipakai: number | null;
      sumber: 'kma' | 'manual' | 'tidak_ada';
      terverifikasi: boolean;
      catatan: string;
    };
    hasil: ReturnType<typeof matchAll>;
  };
};

export async function POST(req: Request) {
  let body: Body;
  try {
    body = (await req.json()) as Body;
  } catch {
    return NextResponse.json({ status: 'error', message: 'body bukan JSON' }, { status: 400 });
  }

  const kode = body.kode_pt?.trim();
  if (!kode) {
    return NextResponse.json({ status: 'error', message: 'kode_pt wajib' }, { status: 400 });
  }

  const item = institutionsByKode.get(kode);
  if (!item) {
    return NextResponse.json({ status: 'error', message: 'kampus tidak ditemukan', kode }, { status: 404 });
  }

  const now = Date.now();
  const profil: Profile = body.profil ?? {};

  const hasil = matchAll(
    scholarships,
    {
      kodePt: kode,
      ptkin: item.ukt,
      prodi: body.prodi ?? null,
      kelompok: body.kelompok ?? null,
      nominalManual: body.nominal_manual ?? null,
      profile: profil,
    },
    now,
  );

  const terverifikasi = Boolean(item.ukt && body.kelompok != null && !hasil.every((h) => h.uktUnverified));
  const nominal = hasil[0]?.uktUnverified ? (body.nominal_manual ?? null) : null;

  const data: CheckResponse['data'] = {
    kampus: {
      kode: item.kode,
      nama: item.nama,
      ukt_model: item.ukt ? 'ptkin_kma' : 'manual',
    },
    ukt: {
      dipakai: nominal,
      sumber: item.ukt && body.kelompok != null ? 'kma' : body.nominal_manual ? 'manual' : 'tidak_ada',
      terverifikasi,
      catatan: item.ukt
        ? `Nominal UKT diambil dari KMA 204/2026 (TA ${seedsMeta.ukt.academic_year}).`
        : 'Kampus ini belum punya data UKT terverifikasi; hasil dihitung dari nominal yang kamu masukkan.',
    },
    // stageStatus + displayState sudah ikut dari matchOne; tidak dihitung ulang.
    hasil,
  };

  return NextResponse.json({ status: 'success', data });
}