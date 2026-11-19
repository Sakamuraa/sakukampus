import { timingSafeEqual } from 'node:crypto';
import { NextResponse } from 'next/server';
import { discoverScholarships } from '@/lib/scholarship-discovery';

export const dynamic = 'force-dynamic';

function isAuthorized(request: Request, secret: string) {
  const provided = request.headers.get('authorization')?.replace(/^Bearer\s+/i, '') ?? '';
  const expectedBuffer = Buffer.from(secret);
  const providedBuffer = Buffer.from(provided);
  return (
    expectedBuffer.length === providedBuffer.length &&
    timingSafeEqual(expectedBuffer, providedBuffer)
  );
}

export async function POST(request: Request) {
  const secret = process.env.CRON_SECRET;
  if (!secret) {
    return NextResponse.json(
      { status: 'error', message: 'CRON_SECRET belum dikonfigurasi di server.' },
      { status: 503 },
    );
  }
  if (!isAuthorized(request, secret)) {
    return NextResponse.json({ status: 'error', message: 'unauthorized' }, { status: 401 });
  }

  const required = [
    'DATABASE_URL',
    'SCHOLARSHIP_LLM_API_URL',
    'SCHOLARSHIP_LLM_MODEL',
  ];
  const missing = required.filter((name) => !process.env[name]);
  if (missing.length > 0) {
    return NextResponse.json(
      { status: 'error', message: 'Konfigurasi belum lengkap.', missing },
      { status: 503 },
    );
  }

  try {
    const result = await discoverScholarships();
    return NextResponse.json({
      status: result.errors.length > 0 || result.search_errors > 0 ? 'partial' : 'success',
      completed_at: new Date().toISOString(),
      ...result,
    });
  } catch (error) {
    console.error('Automated scholarship discovery failed.', error);
    return NextResponse.json(
      {
        status: 'error',
        message: error instanceof Error ? error.message : 'Automated discovery failed.',
      },
      { status: 502 },
    );
  }
}
