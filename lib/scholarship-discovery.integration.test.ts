import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { EventEmitter } from 'node:events';
import { Readable } from 'node:stream';

const stores = vi.hoisted(() => ({
  getPublishedScholarships: vi.fn(),
  publishScholarship: vi.fn(),
  httpsRequest: vi.fn(),
}));

vi.mock('@/lib/scholarship-store', () => stores);
vi.mock('node:https', () => ({ request: stores.httpsRequest }));
vi.mock('node:dns/promises', () => ({
  lookup: vi.fn(async () => [{ address: '93.184.216.34', family: 4 }]),
}));

import { discoverScholarships } from './scholarship-discovery';

const envKeys = [
  'DATABASE_URL',
  'SCHOLARSHIP_LLM_API_URL',
  'SCHOLARSHIP_LLM_MODEL',
] as const;
const originalEnv = Object.fromEntries(envKeys.map((key) => [key, process.env[key]]));
const originalFetch = globalThis.fetch;
let directSearchUnavailable = false;
let bingUnavailable = false;
let readerUnavailable = false;
let routerStreamsResponse = false;
let routerTruncatesFirstResponse = false;
let routerRateLimitsFirstResponse = false;
let routerRequests = 0;

const pageUrl = 'https://beasiswa.example.org/afirmasi-2027';
const quotes = {
  official: 'Program Beasiswa Afirmasi 2027 diterbitkan oleh Yayasan Pendidikan Indonesia.',
  benefit: 'Program menyediakan bantuan pendidikan sebesar Rp5.000.000.',
  jenjang: 'Program ini tersedia untuk mahasiswa aktif jenjang S1.',
  registration: 'Pendaftaran dibuka 1 Januari 2027 dan ditutup 31 Januari 2027.',
  requirement: 'Syarat pendaftar adalah mahasiswa aktif jenjang S1.',
};

const extractedItem = {
  source_url: pageUrl,
  official_source: true,
  official_evidence: quotes.official,
  is_duplicate: false,
  unsupported_requirements: [],
  confidence: 96,
  scholarship: {
    name: 'Beasiswa Afirmasi 2027',
    provider: 'Yayasan Pendidikan Indonesia',
    tier: 'swasta',
    scope: 'nasional',
    coverage: 'partial',
    benefit_summary: 'Bantuan pendidikan sebesar Rp5.000.000.',
    jenjang: ['S1'],
    url_pendaftaran: 'https://beasiswa.example.org/daftar',
    academic_year: '2027',
    stages: [{
      name: 'pendaftaran',
      opens_at: '2027-01-01T00:00:00Z',
      closes_at: '2027-01-31T23:59:00Z',
    }],
    rule: {
      all: [{
        fact: 'jenjang',
        op: 'in',
        value: ['S1'],
        label: 'Mahasiswa aktif S1',
      }],
    },
  },
  evidence: {
    name: quotes.official,
    provider: 'Yayasan Pendidikan Indonesia.',
    benefit_summary: quotes.benefit,
    jenjang: quotes.jenjang,
    requirements: [{ label: 'Mahasiswa aktif S1', quote: quotes.requirement }],
    stages: [{ name: 'pendaftaran', quote: quotes.registration }],
  },
};

const pageHtml = `<html><head><title>Beasiswa Afirmasi 2027</title></head><body>
  <main>
    ${quotes.official}
    ${quotes.benefit}
    ${quotes.jenjang}
    ${quotes.registration}
    ${quotes.requirement}
    Informasi lengkap mengenai program bantuan pendidikan untuk mahasiswa Indonesia tersedia pada halaman ini.
  </main>
  <a href="/daftar">Pendaftaran</a>
</body></html>`;
const searchHtml = `<div class="result">
  <a class="result__a" href="https://duckduckgo.com/l/?uddg=${encodeURIComponent(pageUrl)}">Beasiswa Afirmasi 2027</a>
  <a class="result__snippet">Program bantuan.</a>
</div>`;
const searchMarkdown = `Title: Beasiswa Afirmasi 2027 at DuckDuckGo

## [Beasiswa Afirmasi 2027](https://duckduckgo.com/l/?uddg=${encodeURIComponent(pageUrl)})

Program bantuan.`;
const bingSearchHtml = `<html><body><ol id="b_results">
  <li class="b_algo">
    <h2><a href="https://www.bing.com/ck/a?!&&p=abc&u=a1${Buffer.from(pageUrl).toString('base64url')}&ntb=1">Beasiswa Afirmasi 2027</a></h2>
    <div class="b_caption"><p>Program bantuan.</p></div>
  </li>
</ol></body></html>`;

describe('automated discovery pipeline', () => {
  beforeEach(() => {
    directSearchUnavailable = false;
    bingUnavailable = false;
    readerUnavailable = false;
    routerStreamsResponse = false;
    routerTruncatesFirstResponse = false;
    routerRateLimitsFirstResponse = false;
    routerRequests = 0;
    process.env.DATABASE_URL = 'postgres://test';
    process.env.SCHOLARSHIP_LLM_API_URL = 'https://router.example/v1/chat/completions';
    process.env.SCHOLARSHIP_LLM_MODEL = 'test-model';
    process.env.SCHOLARSHIP_LLM_RETRY_BASE_MS = '1';
    stores.getPublishedScholarships.mockResolvedValue([]);
    stores.publishScholarship.mockResolvedValue(undefined);
    stores.httpsRequest.mockImplementation((_url, _options, callback) => {
      const request = new EventEmitter() as EventEmitter & { end: () => void };
      request.end = () => {
        const response = Readable.from([Buffer.from(pageHtml)]) as Readable & {
          statusCode: number;
          headers: Record<string, string>;
        };
        response.statusCode = 200;
        response.headers = { 'content-type': 'text/html; charset=utf-8' };
        callback(response);
      };
      return request;
    });

    globalThis.fetch = vi.fn(async (input, init) => {
      const url = new URL(
        typeof input === 'string' ? input : input instanceof URL ? input.href : input.url,
      );
      if (url.hostname === 'html.duckduckgo.com') {
        if (directSearchUnavailable) throw new Error('direct search blocked');
        return new Response(searchHtml, {
          headers: { 'content-type': 'text/html; charset=utf-8' },
        });
      }
      if (url.hostname === 'www.bing.com') {
        if (bingUnavailable) throw new Error('bing blocked');
        return new Response(bingSearchHtml, {
          headers: { 'content-type': 'text/html; charset=utf-8' },
        });
      }
      if (url.hostname === 'r.jina.ai') {
        if (readerUnavailable) return new Response('reader blocked', { status: 403 });
        return new Response(searchMarkdown, {
          headers: { 'content-type': 'text/plain; charset=utf-8' },
        });
      }
      if (url.hostname === 'router.example' && init?.method === 'POST') {
        routerRequests += 1;
        if (routerRateLimitsFirstResponse && routerRequests === 1) {
          return new Response(
            JSON.stringify({ error: { message: 'another request is still using this account' } }),
            { status: 429, headers: { 'content-type': 'application/json' } },
          );
        }
        if (routerTruncatesFirstResponse && routerRequests === 1) {
          return Response.json({
            choices: [{
              message: { content: '{"items":[{"source_url":"https://beasiswa.example.org/afirmasi-2027","scholarship":{' },
              finish_reason: 'length',
            }],
          });
        }
        if (routerStreamsResponse) {
          const content = JSON.stringify({ items: [extractedItem] });
          const midpoint = Math.floor(content.length / 2);
          const events = [content.slice(0, midpoint), content.slice(midpoint)]
            .map((chunk) =>
              `data: ${JSON.stringify({ choices: [{ delta: { content: chunk } }] })}\n\n`,
            )
            .join('');
          return new Response(`${events}data: [DONE]\n\n`, {
            headers: { 'content-type': 'text/event-stream' },
          });
        }
        return Response.json({
          choices: [{ message: { content: JSON.stringify({ items: [extractedItem] }) } }],
        });
      }
      throw new Error(`Unexpected request: ${url.href}`);
    }) as typeof fetch;
  });

  afterEach(() => {
    globalThis.fetch = originalFetch;
    for (const key of envKeys) {
      const value = originalEnv[key];
      if (value === undefined) delete process.env[key];
      else process.env[key] = value;
    }
    stores.getPublishedScholarships.mockReset();
    stores.publishScholarship.mockReset();
  });

  it('searches, verifies citations, and publishes accepted records in one cron run', async () => {
    const result = await discoverScholarships();

    expect(result).toMatchObject({
      queried: 6,
      search_errors: 0,
      fetched: 1,
      published: 1,
      skipped: 0,
    });
    expect(stores.publishScholarship).toHaveBeenCalledOnce();
    expect(stores.publishScholarship.mock.calls[0][0]).toMatchObject({
      name: 'Beasiswa Afirmasi 2027',
      source_kind: 'resmi',
      scope: 'nasional',
    });
  });

  it('parses streamed SSE responses from the router', async () => {
    routerStreamsResponse = true;

    const result = await discoverScholarships();

    expect(result).toMatchObject({
      fetched: 1,
      published: 1,
      skipped: 0,
    });
  });

  it('uses Jina Reader when direct DuckDuckGo requests are blocked', async () => {
    directSearchUnavailable = true;

    const result = await discoverScholarships();

    expect(result).toMatchObject({
      queried: 6,
      search_errors: 0,
      fetched: 1,
      published: 1,
      skipped: 0,
    });
    expect(
      vi.mocked(globalThis.fetch).mock.calls.filter(([input]) => {
        const url = new URL(
          typeof input === 'string' ? input : input instanceof URL ? input.href : input.url,
        );
        return url.hostname === 'r.jina.ai';
      }),
    ).toHaveLength(6);
  });

  it('falls back to Bing when direct DuckDuckGo and Jina Reader are blocked', async () => {
    directSearchUnavailable = true;
    readerUnavailable = true;

    const result = await discoverScholarships();

    expect(result).toMatchObject({
      queried: 6,
      search_errors: 0,
      fetched: 1,
      published: 1,
      skipped: 0,
    });
    expect(
      vi.mocked(globalThis.fetch).mock.calls.filter(([input]) => {
        const url = new URL(
          typeof input === 'string' ? input : input instanceof URL ? input.href : input.url,
        );
        return url.hostname === 'www.bing.com';
      }),
    ).toHaveLength(6);
  });

  it('retries with a larger token budget when the router truncates the JSON', async () => {
    routerTruncatesFirstResponse = true;

    const result = await discoverScholarships();

    expect(result).toMatchObject({ fetched: 1, published: 1, skipped: 0 });
    expect(routerRequests).toBe(2);
  });

  it('retries a rate-limited extraction instead of dropping the whole batch', async () => {
    routerRateLimitsFirstResponse = true;

    const result = await discoverScholarships();

    expect(result).toMatchObject({ fetched: 1, published: 1, skipped: 0, errors: [] });
    expect(routerRequests).toBe(2);
  });

  it('surfaces provider errors when every search engine fails', async () => {
    directSearchUnavailable = true;
    bingUnavailable = true;
    readerUnavailable = true;

    await expect(discoverScholarships()).rejects.toThrow(
      /^Semua kueri pencarian gagal\. kueri 1: DuckDuckGo langsung: direct search blocked; Jina Reader: Jina Reader merespons HTTP 403\.; Bing langsung: bing blocked/,
    );
    expect(stores.publishScholarship).not.toHaveBeenCalled();
  });

  it('skips login-gated sources so their empty pages do not consume the budget', async () => {
    const gatedUrl = 'https://satubeasiswa.kemdiktisaintek.go.id/beasiswa';
    const gatedHtml = `<div class="result">
      <a class="result__a" href="https://duckduckgo.com/l/?uddg=${encodeURIComponent(gatedUrl)}">Beasiswa</a>
      <a class="result__snippet">Daftar beasiswa.</a>
    </div>`;
    const fetchMock = vi.mocked(globalThis.fetch);
    const original = fetchMock.getMockImplementation()!;
    fetchMock.mockImplementation(async (input, init) => {
      const url = new URL(
        typeof input === 'string' ? input : input instanceof URL ? input.href : input.url,
      );
      if (url.hostname === 'html.duckduckgo.com') {
        return new Response(gatedHtml, {
          headers: { 'content-type': 'text/html; charset=utf-8' },
        });
      }
      return original(input, init);
    });

    const result = await discoverScholarships();

    expect(result).toMatchObject({ fetched: 0, published: 0, skipped: 0 });
    expect(stores.publishScholarship).not.toHaveBeenCalled();
  });
});
