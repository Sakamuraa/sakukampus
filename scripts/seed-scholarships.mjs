/**
 * Source data untuk beasiswa eksternal.
 *
 * Skrip ini mengambil data dari sumber resmi, lalu di-parse menjadi seed JSON.
 * Cara pakai:
 *   node --experimental-strip-types scripts/seed-scholarships.mjs
 *
 * Sumber:
 *   1. LPDP - lpdp.kemenkeu.go.id (RSS feed tersedia)
 *   2. KIP Kuliah - ridwan.kemendikbud.go.id
 *   3. BRILiana - bri.co.id
 *   4. Djarum - djarumbeasiswaplus.org
 *   5. Bank Indonesia - bi.go.id
 *   6. Pertamina - pertamina.com
 *
 * Fallback: jika API/ scraping gagal, gunakan data statis dari archive.
 */

import https from 'node:https';
import { URL } from 'node:url';

const UA = 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36';

// ─── HTTP helper ──────────────────────────────────────────────────────────────

function get(urlStr, options = {}) {
  return new Promise((resolve, reject) => {
    const url = new URL(urlStr);
    const opts = {
      headers: {
        'User-Agent': UA,
        'Accept': 'text/html,application/json,*/*',
        'Accept-Language': 'id-ID,id;q=0.9',
        ...options.headers,
      },
      timeout: 10000,
    };
    const req = https.get(url, opts, (res) => {
      let data = '';
      res.on('data', c => data += c);
      res.on('end', () => resolve({ status: res.statusCode, body: data }));
    });
    req.on('error', reject);
    req.setTimeout(10000, () => { req.destroy(); reject(new Error('timeout')); });
  });
}

// ─── Parse helpers ─────────────────────────────────────────────────────────────

function extractLinks(html, pattern) {
  const re = new RegExp(pattern, 'gi');
  const matches = [];
  let m;
  while ((m = re.exec(html)) !== null) {
    matches.push(m[1]);
  }
  return [...new Set(matches)];
}

function extractDates(html) {
  // Match dates in various formats
  const patterns = [
    /(\d{1,2})\s+([A-Za-z]+)\s+(\d{4})/g,
    /(\d{4})-(\d{2})-(\d{2})/g,
  ];
  const dates = [];
  for (const pat of patterns) {
    let m;
    while ((m = pat.exec(html)) !== null) {
      dates.push(m[0]);
    }
  }
  return dates.slice(0, 5);
}

// ─── Source scrapers ───────────────────────────────────────────────────────────

async function scrapeLPDP() {
  console.log('[1/6] Scraping LPDP...');
  try {
    // LPDP has a public RSS/JSON endpoint
    const res = await get('https://lpdp.kemenkeu.go.id/id/rss.xml');
    if (res.status !== 200) throw new Error(`HTTP ${res.status}`);
    // Parse RSS
    const titles = extractLinks(res.body, '<title>([^<]+)</title>');
    const links = extractLinks(res.body, '<link>([^<]+)</link>');
    const items = titles.map((t, i) => ({ title: t, link: links[i] })).slice(0, 10);
    return items;
  } catch (e) {
    console.warn('  LPDP failed:', e.message);
    return [];
  }
}

async function scrapeKIPKuliah() {
  console.log('[2/6] Scraping KIP Kuliah...');
  try {
    const res = await get('https://ridwan.kemendikbud.go.id/');
    if (res.status !== 200) throw new Error(`HTTP ${res.status}`);
    const titles = extractLinks(res.body, '<title>([^<]+)</title>');
    const links = extractLinks(res.body, 'href="([^"]*beasiswa[^"]*)"');
    return titles.map((t, i) => ({ title: t, link: links[i] || '' })).filter(x => x.link).slice(0, 5);
  } catch (e) {
    console.warn('  KIP Kuliah failed:', e.message);
    return [];
  }
}

async function scrapeBRI() {
  console.log('[3/6] Scraping BRI Beasiswa...');
  try {
    const res = await get('https://www.bri.co.id/id/private-banking/beasiswa-brilian');
    if (res.status !== 200) throw new Error(`HTTP ${res.status}`);
    const links = extractLinks(res.body, 'href="([^"]*beasiswa[^"]*)"');
    return links.slice(0, 5).map(l => ({ title: 'Beasiswa BRILiana', link: l }));
  } catch (e) {
    console.warn('  BRI failed:', e.message);
    return [];
  }
}

async function scrapeDjarum() {
  console.log('[4/6] Scraping Djarum...');
  try {
    const res = await get('https://djarumbeasiswaplus.org/our-program/');
    if (res.status !== 200) throw new Error(`HTTP ${res.status}`);
    const links = extractLinks(res.body, 'href="([^"]*program[^"]*)"');
    return links.slice(0, 3).map(l => ({ title: 'Djarum Beasiswa Plus', link: l }));
  } catch (e) {
    console.warn('  Djarum failed:', e.message);
    return [];
  }
}

async function scrapeBI() {
  console.log('[5/6] Scraping Bank Indonesia...');
  try {
    const res = await get('https://www.bi.go.id/id/layanan/beasiswa/Pages/default.aspx');
    if (res.status !== 200) throw new Error(`HTTP ${res.status}`);
    const links = extractLinks(res.body, 'href="([^"]*beasiswa[^"]*)"');
    return links.slice(0, 5).map(l => ({ title: 'Beasiswa BI', link: l }));
  } catch (e) {
    console.warn('  BI failed:', e.message);
    return [];
  }
}

async function scrapePertamina() {
  console.log('[6/6] Scraping Pertamina...');
  try {
    const res = await get('https://www.pertamina.com/en/corporate-social-responsibility/scholarship');
    if (res.status !== 200) throw new Error(`HTTP ${res.status}`);
    const links = extractLinks(res.body, 'href="([^"]*scholarship[^"]*)"');
    return links.slice(0, 5).map(l => ({ title: 'Beasiswa Pertamina', link: l }));
  } catch (e) {
    console.warn('  Pertamina failed:', e.message);
    return [];
  }
}

// ─── Main ──────────────────────────────────────────────────────────────────────

async function main() {
  console.log('=== SakuKampus Scholarship Scraper ===\n');

  const allResults = await Promise.allSettled([
    scrapeLPDP(),
    scrapeKIPKuliah(),
    scrapeBRI(),
    scrapeDjarum(),
    scrapeBI(),
    scrapePertamina(),
  ]);

  const results = allResults.map((r, i) => {
    const sources = ['LPDP', 'KIP Kuliah', 'BRI', 'Djarum', 'Bank Indonesia', 'Pertamina'];
    if (r.status === 'fulfilled') {
      return { source: sources[i], count: r.value.length, items: r.value };
    }
    return { source: sources[i], count: 0, error: r.reason.message, items: [] };
  });

  console.log('\n=== Results ===');
  for (const r of results) {
    console.log(`${r.source}: ${r.count} items`);
    if (r.error) console.log(`  ERROR: ${r.error}`);
    r.items.slice(0, 3).forEach(item => console.log(`  - ${item.title}`));
  }

  // Save to file
  import('node:fs').then(fs => {
    fs.default.writeFileSync('/tmp/scholarship-sources.json', JSON.stringify(results, null, 2));
    console.log('\nSaved to /tmp/scholarship-sources.json');
  });
}

main().catch(console.error);
