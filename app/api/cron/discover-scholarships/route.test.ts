import { afterEach, describe, expect, it } from 'vitest';
import { POST } from './route';

const originalCronSecret = process.env.CRON_SECRET;
const originalDatabaseUrl = process.env.DATABASE_URL;
const originalRouterUrl = process.env.SCHOLARSHIP_LLM_API_URL;
const originalRouterModel = process.env.SCHOLARSHIP_LLM_MODEL;

afterEach(() => {
  for (const [key, value] of [
    ['CRON_SECRET', originalCronSecret],
    ['DATABASE_URL', originalDatabaseUrl],
    ['SCHOLARSHIP_LLM_API_URL', originalRouterUrl],
    ['SCHOLARSHIP_LLM_MODEL', originalRouterModel],
  ] as const) {
    if (value === undefined) delete process.env[key];
    else process.env[key] = value;
  }
});

describe('POST /api/cron/discover-scholarships', () => {
  it('refuses to run when the cron secret is not configured', async () => {
    delete process.env.CRON_SECRET;

    const response = await POST(new Request('https://example.test/api/cron/discover-scholarships', {
      method: 'POST',
    }));

    expect(response.status).toBe(503);
  });

  it('rejects requests without the configured bearer token', async () => {
    process.env.CRON_SECRET = 'test-secret';

    const response = await POST(new Request('https://example.test/api/cron/discover-scholarships', {
      method: 'POST',
      headers: { authorization: 'Bearer wrong-secret' },
    }));

    expect(response.status).toBe(401);
  });

  it('reports missing provider and database configuration before starting work', async () => {
    process.env.CRON_SECRET = 'test-secret';
    delete process.env.DATABASE_URL;
    delete process.env.SCHOLARSHIP_LLM_API_URL;
    delete process.env.SCHOLARSHIP_LLM_MODEL;

    const response = await POST(new Request('https://example.test/api/cron/discover-scholarships', {
      method: 'POST',
      headers: { authorization: 'Bearer test-secret' },
    }));
    const body = await response.json();

    expect(response.status).toBe(503);
    expect(body.missing).toEqual([
      'DATABASE_URL',
      'SCHOLARSHIP_LLM_API_URL',
      'SCHOLARSHIP_LLM_MODEL',
    ]);
  });
});
