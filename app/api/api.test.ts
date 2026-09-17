import { describe, it, expect } from 'vitest';
import { GET as getInstitutions } from './v1/institutions/route';
import { GET as getScholarships } from './v1/scholarships/route';
import { GET as getCalendar } from './v1/calendar/route';
import { GET as getMeta } from './v1/meta/sources/route';
import { POST as postCheck } from './v1/eligibility/check/route';
import { GET as getCron } from './cron/refresh-seeds/route';

const req = (url: string, init?: RequestInit) => new Request(url, init);

describe('GET /api/v1/institutions', () => {
  it('tanpa q: mengembalikan ringkasan sumber + jumlah katalog', async () => {
    const r = await getInstitutions(req('http://x/api/v1/institutions'));
    const j = await r.json();
    expect(r.status).toBe(200);
    expect(j.data.total).toBeGreaterThan(3600);
    expect(j.data.dengan_ukt_terverifikasi).toBeGreaterThan(40);
    expect(j.data.sumber.ukt.decree).toBe('KMA 204/2026');
  });

  it('q=racks: mencari kampus dan menandai mana yang punya UKT', async () => {
    const r = await getInstitutions(req('http://x/api/v1/institutions?q=syarif%20hidayatullah'));
    const j = await r.json();
    expect(j.data[0].kode).toBe('201001');
    expect(j.data[0].punya_ukt).toBe(true);
  });

  it('kode: mengembalikan detail + tabel UKT + catatan sumber', async () => {
    const r = await getInstitutions(req('http://x/api/v1/institutions?kode=201001&prodi=Teknik%20Informatika'));
    const j = await r.json();
    expect(j.data.ukt_model).toBe('ptkin_kma');
    expect(j.data.ukt_note).toContain('KMA 204/2026');
    expect(j.data.prodi_terdaftar.length).toBeGreaterThan(40);
    expect(j.data.contoh_ukt).toHaveLength(8); // golongan 1-7 + KIP
    expect(j.data.contoh_ukt.find((x: { kelompok: number }) => x.kelompok === 2).nominal).toBe(4_270_000);
    expect(j.data.contoh_ukt.find((x: { kelompok: number }) => x.kelompok === 8).nominal).toBe(2_400_000);
  });

  it('tabel UKT mengikuti prodi yang diminta, bukan selalu prodi pertama', async () => {
    const a = await (await getInstitutions(req('http://x/api/v1/institutions?kode=201001&prodi=Sistem%20Informasi'))).json();
    expect(a.data.prodi_contoh).toBe('Sistem Informasi');
    const b = await (await getInstitutions(req('http://x/api/v1/institutions?kode=201001&prodi=Farmasi'))).json();
    // Farmasi jauh lebih mahal daripada TI di kampus yang sama.
    const farmasi7 = b.data.contoh_ukt.find((x: { kelompok: number }) => x.kelompok === 7).nominal;
    const ti7 = a.data.contoh_ukt.find((x: { kelompok: number }) => x.kelompok === 7).nominal;
    expect(farmasi7).not.toBe(ti7);
  });

  it('kode tidak dikenal -> 404, bukan 500', async () => {
    const r = await getInstitutions(req('http://x/api/v1/institutions?kode=000000'));
    expect(r.status).toBe(404);
    expect((await r.json()).status).toBe('error');
  });
});

describe('POST /api/v1/eligibility/check', () => {
  const body = (over: Record<string, unknown> = {}) =>
    JSON.stringify({
      kode_pt: '201001',
      prodi: 'Teknik Informatika',
      kelompok: 3,
      profil: { jenjang: 'S1', semester: 5, ipk: 3.6, penerima_beasiswa_lain: false },
      ...over,
    });

  it('profil unggul -> ada yang lolos, dan tiap hasil membawa sumber + tanggal', async () => {
    const r = await postCheck(req('http://x', { method: 'POST', body: body() }));
    const j = await r.json();
    expect(r.status).toBe(200);
    expect(j.data.ukt.sumber).toBe('kma');
    expect(j.data.ukt.terverifikasi).toBe(true);
    expect(j.data.hasil.length).toBeGreaterThan(5);
    for (const h of j.data.hasil) {
      expect(h.source_url).toMatch(/^https:\/\//);
      expect(Number.isFinite(Date.parse(h.last_verified_at))).toBe(true);
    }
    expect(j.data.hasil.some((h: { verdict: string }) => h.verdict === 'lolos')).toBe(true);
  });

  it('tiap hasil menyertakan status jadwal', async () => {
    const r = await postCheck(req('http://x', { method: 'POST', body: body() }));
    const j = await r.json();
    for (const h of j.data.hasil) {
      expect(['buka', 'tutup', 'akan_datang', 'tanpa_jadwal']).toContain(h.stage_status);
    }
  });

  it('kampus tanpa data UKT: tetap jalan lewat nominal manual, ditandai belum terverifikasi', async () => {
    const r = await postCheck(
      req('http://x', {
        method: 'POST',
        body: JSON.stringify({
          kode_pt: '213284', // STAI Teungku Dirundeng Meulaboh — belum punya data UKT
          kelompok: null,
          nominal_manual: 1_500_000,
          profil: { jenjang: 'S1', desil_dtsen: 2 },
        }),
      }),
    );
    const j = await r.json();
    expect(r.status).toBe(200);
    expect(j.data.ukt.sumber).toBe('manual');
    expect(j.data.ukt.terverifikasi).toBe(false);
    expect(j.data.ukt.catatan).toContain('belum punya data UKT');
    // Plafon rupiah tetap dihormati walau UKT dari input manual.
    const kip = j.data.hasil.find((h: { slug: string }) => h.slug === 'kip-kuliah-2026');
    expect(kip.verdict).toBe('lolos');
  });

  it('kode_pt kosong -> 400', async () => {
    const r = await postCheck(req('http://x', { method: 'POST', body: JSON.stringify({}) }));
    expect(r.status).toBe(400);
  });

  it('body bukan JSON -> 400, bukan 500', async () => {
    const r = await postCheck(req('http://x', { method: 'POST', body: 'bukan json' }));
    expect(r.status).toBe(400);
  });
});

describe('GET /api/v1/scholarships', () => {
  it('mengembalikan katalog dengan syarat UKT dalam bentuk yang bisa dibaca', async () => {
    const r = await getScholarships(req('http://x/api/v1/scholarships'));
    const j = await r.json();
    expect(j.data.length).toBeGreaterThan(5);
    const kip = j.data.find((s: { slug: string }) => s.slug === 'kip-kuliah-2026');
    expect(kip.ukt_syarat).toContain('Rp');
    const stf = j.data.find((s: { slug: string }) => s.slug === 'stf-uin-jakarta-2026');
    expect(stf.ukt_syarat).toContain('golongan');
  });

  it('filter tier bekerja', async () => {
    const r = await getScholarships(req('http://x/api/v1/scholarships?tier=pemerintah'));
    const j = await r.json();
    expect(j.data.length).toBeGreaterThan(0);
    expect(j.data.every((s: { tier: string }) => s.tier === 'pemerintah')).toBe(true);
  });
});

describe('GET /api/v1/calendar', () => {
  it('terurut dari tenggat terdekat dan hanya berisi tahap yang punya tenggat', async () => {
    const r = await getCalendar();
    const j = await r.json();
    expect(j.data.length).toBeGreaterThan(5);
    const times = j.data.map((e: { tenggat: string }) => Date.parse(e.tenggat));
    expect(times).toEqual([...times].sort((a, b) => a - b));
    for (const e of j.data) expect(e.source_url).toMatch(/^https:\/\//);
  });
});

describe('GET /api/v1/meta/sources', () => {
  it('menyatakan keterbatasan data secara terbuka', async () => {
    const r = await getMeta();
    const j = await r.json();
    expect(j.data.katalog.unofficial).toBe(true);
    expect(j.data.ukt.catatan).toContain('tidak sebanding');
    expect(j.data.beasiswa.resmi).toBeGreaterThan(0);
  });
});

describe('GET /api/cron/refresh-seeds', () => {
  it('tanpa CRON_SECRET di env: memeriksa dan melaporkan keadaan data', async () => {
    const r = await getCron(req('http://x/api/cron/refresh-seeds'));
    const j = await r.json();
    expect(j.ringkasan.kampus).toBeGreaterThan(3600);
    expect(j.ringkasan.kampus_ber_ukt).toBeGreaterThan(40);
    expect(Array.isArray(j.masalah)).toBe(true);
  });

  it('menolak bila CRON_SECRET diset dan header tidak cocok', async () => {
    process.env.CRON_SECRET = 'rahasia-uji';
    const r = await getCron(req('http://x/api/cron/refresh-seeds'));
    expect(r.status).toBe(401);
    const ok = await getCron(
      req('http://x/api/cron/refresh-seeds', { headers: { authorization: 'Bearer rahasia-uji' } }),
    );
    expect(ok.status).not.toBe(401);
    delete process.env.CRON_SECRET;
  });
});