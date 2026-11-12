// Tarik data wilayah (kota, provinsi, nama singkat) untuk SELURUH kampus
// dalam SATU request.
//
// Endpoint v1 (/api/pt/search/filter?limit=20000) tidak membungkus hasil dan
// mengabaikan paginasi — satu request mengembalikan seluruh katalog (~6.8k
// baris), lengkap dengan kab_kota_pt. Endpoint v2 yang dipakai untuk seed
// perlu 70 request, jadi jauh lebih berat; untuk alias wilayah, v1 cukup.
//
// Syarat: Chrome headed dengan remote debugging + tab PDDikti terbuka
//   chrome --remote-debugging-port=9341 https://pddikti.kemdiktisaintek.go.id/
//
// Output: data/.catalog-cache/bulk.json
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const OUT = path.join(ROOT, 'data', '.catalog-cache', 'bulk.json');
const PORT = Number(process.env.CDP_PORT || 9341);
const API = 'https://api-pddikti.kemdiktisaintek.go.id';
const SITE_KEY = '6LdqjDstAAAAAMW1whjCNKyvqmPBOIssWETjbLbh';
const SITES = 'https://pddikti.kemdiktisaintek.go.id';

const list = await (await fetch(`http://127.0.0.1:${PORT}/json/list`)).json();
const isTabSitus = (t) => {
  try {
    return new URL(t.url).hostname === 'pddikti.kemdiktisaintek.go.id';
  } catch {
    return false;
  }
};
const target = list.find((t) => t.type === 'page' && isTabSitus(t));
if (!target) {
  console.error(
    'Tab PDDikti tidak ditemukan. Buka Chrome headed dengan:\n' +
      `  chrome --remote-debugging-port=${PORT} ${SITES}/\n`,
  );
  process.exit(1);
}

const ws = new WebSocket(target.webSocketDebuggerUrl);
let id = 0;
const pending = new Map();
const send = (method, params = {}) =>
  new Promise((res) => {
    const i = ++id;
    pending.set(i, res);
    ws.send(JSON.stringify({ id: i, method, params }));
  });
ws.addEventListener('message', (ev) => {
  const m = JSON.parse(ev.data);
  if (m.id && pending.has(m.id)) {
    pending.get(m.id)(m.result);
    pending.delete(m.id);
  }
});
await new Promise((r) => ws.addEventListener('open', r));
await send('Runtime.enable');
await send('Page.enable');

const ev = async (expr) => {
  const r = await send('Runtime.evaluate', {
    expression: expr,
    returnByValue: true,
    awaitPromise: true,
    userGesture: true,
  });
  if (r?.exceptionDetails) {
    throw new Error(r.exceptionDetails.exception?.description || r.exceptionDetails.text);
  }
  return r?.result?.value;
};

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

// Pastikan reCAPTCHA termuat (kalau IP kena Turnstile, halamannya diganti).
for (let i = 0; i < 4; i++) {
  await send('Page.navigate', { url: SITES + '/' });
  await sleep(9000);
  if ((await ev('typeof grecaptcha')) === 'object') break;
  console.error(`percobaan ${i + 1}: grecaptcha belum termuat`);
}
if ((await ev('typeof grecaptcha')) !== 'object') {
  console.error('grecaptcha tidak termuat — IP ini sedang diblokir CrowdSec/Turnstile.');
  process.exit(1);
}

console.log('mengambil katalog penuh (satu request)...');
const script = `(async () => {
  const KEY = ${JSON.stringify(SITE_KEY)};
  const token = () => new Promise((res, rej) => {
    grecaptcha.ready(() => grecaptcha.execute(KEY, { action: 'api_request' }).then(res, rej));
    setTimeout(() => rej(new Error('token timeout')), 15000);
  });
  for (let a = 0; a < 10; a++) {
    try {
      const t = await token();
      const r = await fetch(${JSON.stringify(API)} + '/api/pt/search/filter?limit=20000', {
        headers: { 'X-Recaptcha-Token': t },
      });
      const x = await r.text();
      if (!x.trimStart().startsWith('{')) { await new Promise(r2 => setTimeout(r2, 4000)); continue; }
      const j = JSON.parse(x);
      if (j.status !== 'success') { await new Promise(r2 => setTimeout(r2, 4000)); continue; }
      const rows = Array.isArray(j.data) ? j.data : (j.data?.data ?? []);
      return JSON.stringify({ rows });
    } catch (e) {
      await new Promise(r2 => setTimeout(r2, 4000));
    }
  }
  return JSON.stringify({ error: 'gagal setelah 10 percobaan' });
})()`;

const out = JSON.parse(await ev(script));
if (out.error) {
  console.error('ERR:', out.error);
  process.exit(1);
}

fs.mkdirSync(path.dirname(OUT), { recursive: true });
fs.writeFileSync(OUT, JSON.stringify(out.rows), 'utf8');
console.log(`tulis ${OUT}: ${out.rows.length} baris`);
