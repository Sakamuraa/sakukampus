import { NextResponse } from 'next/server';
import { scholarships } from '@/lib/data';
import type { ScholarshipSeed } from '@/lib/match';

export const revalidate = 3600;

/** GET /api/v1/calendar?from=&to= — tenggat semua beasiswa + tahapannya. */
export async function GET() {
  const events = scholarships.flatMap((s: ScholarshipSeed) =>
    s.stages
      .filter((st) => st.closes_at)
      .map((st) => ({
        slug: s.slug,
        scholarship: s.name,
        provider: s.provider,
        tier: s.tier,
        tahap: st.name,
        mulai: st.opens_at ?? null,
        tenggat: st.closes_at!,
        url_pendaftaran: s.url_pendaftaran ?? null,
        source_url: s.source_url,
      })),
  );

  events.sort((a, b) => Date.parse(a.tenggat) - Date.parse(b.tenggat));

  return NextResponse.json({
    status: 'success',
    data: events,
    meta: { jumlah: events.length, waktu_server: new Date().toISOString() },
  });
}