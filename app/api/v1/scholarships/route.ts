import { NextResponse } from 'next/server';
import { scholarships } from '@/lib/data';
import { stageStatus } from '@/lib/match';

export const revalidate = 3600;

/** GET /api/v1/scholarships?tier=&status=&q= */
export async function GET(req: Request) {
  const url = new URL(req.url);
  const tier = url.searchParams.get('tier');
  const status = url.searchParams.get('status');
  const q = (url.searchParams.get('q') ?? '').trim().toUpperCase();
  const now = Date.now();

  let list = scholarships;
  if (tier) list = list.filter((s) => s.tier === tier);
  if (q) list = list.filter((s) => s.name.toUpperCase().includes(q) || s.provider.toUpperCase().includes(q));

  const withStatus = list.map((s) => ({ s, status: stageStatus(s, now) }));
  const filtered = status ? withStatus.filter((x) => x.status === status) : withStatus;

  return NextResponse.json({
    status: 'success',
    data: filtered.map(({ s, status: st }) => ({
      slug: s.slug,
      name: s.name,
      provider: s.provider,
      tier: s.tier,
      scope: s.scope,
      coverage: s.coverage ?? null,
      benefit_summary: s.benefit_summary ?? null,
      jenjang: s.jenjang,
      status: st,
      url_pendaftaran: s.url_pendaftaran ?? null,
      source_url: s.source_url,
      last_verified_at: s.last_verified_at,
      confidence: s.confidence,
      // Syarat UKT ditampilkan dalam rupiah untuk beasiswa nasional, nomor
      // golongan hanya untuk beasiswa kampus — sesuai aturan §5.
      ukt_syarat: s.ukt_max_idr
        ? `UKT ≤ Rp${s.ukt_max_idr.toLocaleString('id-ID')}`
        : s.ukt_max_golongan
          ? `Prioritas golongan 1–${s.ukt_max_golongan} (kampus ini)`
          : null,
      stages: s.stages,
    })),
  });
}