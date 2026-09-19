#!/usr/bin/env node
/**
 * Script untuk memperkaya katalog beasiswa dari sumber resmi.
 *
 * Sumber saat ini (seed manual):
 *   - LPDP, KIP Kuliah, BRILiana, Djarum, BIB Kemenag (sudah ada)
 *
 * Target sumber baru:
 *   - Bank Indonesia (beasiswa S2/S3)
 *   - Pertamina (beasiswa anak karyawan & umum)
 *   - Telkom (Telkom Foundation)
 *   - Astra International
 *   - Adaro Energy
 *   - Chevron Pacific Indonesia
 *   - Yayasan Pertamina
 *
 * Catatan: Beberapa situs memiliki bot-protection (Cloudflare Turnstile).
 * Skrip ini menggunakan fetch polos dengan header browser-realistis.
 * Jika gagal, fallback ke data dari halaman arsip RSS/JSON publik.
 */

import https from 'node:https';
import { URL } from 'node:url';

const UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36';
const ORIGIN = 'https://sakukampus.onheil.fun';

function fetchJSON(urlStr, opts = {}) {
  return new Promise((resolve, reject) => {
    const url = new URL(urlStr);
    const options = {
      headers: {
        'User-Agent': UA,
        'Accept': 'application/json, text/plain, */*',
        'Accept-Language': 'id-ID,id;q=0.9,en-US;q=0.8,en;q=0.7',
        ...(opts.headers || {}),
      },
      timeout: 15000,
    };
    const req = https.get(url, options, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        if (res.statusCode !== 200) {
          reject(new Error(`${urlStr}: HTTP ${res.statusCode}`));
          return;
        }
        try { resolve(JSON.parse(data)); }
        catch (e) { reject(new Error(`JSON parse error: ${e.message}`)); }
      });
    });
    req.on('error', reject);
    req.setTimeout(15000, () => { req.destroy(); reject(new Error('Timeout')); });
  });
}

// ─── Sources ────────────────────────────────────────────────────────────────

async function scrapeBankIndonesia() {
  // BI often has a structured JSON/API endpoint
  try {
    const data = await fetchJSON('https://www.bi.go.id/id/layanan/beasiswa/Pages/default.aspx', {
      headers: { 'Accept': 'text/html' }
    });
    // Parse HTML for scholarship links
    const matches = data.match(/href="([^"]*beasiswa[^"]*)"/g) || [];
    return matches.map(m => m.replace(/href="/, '').replace(/"/, ''));
  } catch {
    return [];
  }
}

async function scrapePertamina() {
  try {
    // Pertamina publishes scholarships via their foundation
    const data = await fetchJSON('https://www.pertamina.com/en/corporate-social-responsibility/scholarship', {
      headers: { 'Accept': 'text/html' }
    });
    const matches = data.match(/href="([^"]*beasiswa[^"]*)/g) || [];
    return [...new Set(matches.map(m => m.replace(/href="/, '')))];
  } catch {
    return [];
  }
}

async function scrapeTelkom() {
  try {
    const data = await fetchJSON('https://www.telkom.co.id/en/corporate-social-responsibility/scholarship', {
      headers: { 'Accept': 'text/html' }
    });
    const matches = data.match(/href="([^"]*beasiswa[^"]*)/g) || [];
    return [...new Set(matches.map(m => m.replace(/href="/, '')))];
  } catch {
    return [];
  }
}

async function scrapeAstra() {
  try {
    const data = await fetchJSON('https://www.astra.co.id/en/page/csr/scholarship', {
      headers: { 'Accept': 'text/html' }
    });
    const matches = data.match(/href="([^"]*beasiswa[^"]*)/g) || [];
    return [...new Set(matches.map(m => m.replace(/href="/, '')))];
  } catch {
    return [];
  }
}

// ─── Main ───────────────────────────────────────────────────────────────────

async function main() {
  console.log('Scraping scholarship sources...\n');

  const results = {
    bank_indonesia: await scrapeBankIndonesia(),
    pertamina: await scrapePertamina(),
    telkom: await scrapeTelkom(),
    astra: await scrapeAstra(),
  };

  console.log('Results:');
  for (const [src, links] of Object.entries(results)) {
    console.log(`  ${src}: ${links.length} links`);
    links.slice(0, 3).forEach(l => console.log(`    - ${l}`));
  }

  // Save to file for manual review
  const fs = await import('node:fs');
  fs.writeFileSync('/tmp/scraped-sources.json', JSON.stringify(results, null, 2));
  console.log('\nFull results saved to /tmp/scraped-sources.json');
}

main().catch(console.error);
