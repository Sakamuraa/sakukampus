/**
 * PDDikti — klien API katalog perguruan tinggi Indonesia.
 *
 * TEMUAN PENTING (diuji 17 Sep 2026, satu variabel per satu):
 *   tanpa header            -> 401
 *   hanya User-Agent        -> 401
 *   hanya accept            -> 401
 *   hanya referer           -> 401
 *   HANYA origin (== situs) -> 200
 *   origin: evil.com        -> 401
 *   origin: kemdikbud.go.id -> 401
 *
 * Jadi yang membuka pintu adalah header `Origin` yang cocok persis, bukan TLS
 * fingerprinting dan bukan spoofing User-Agent. Karena itu jalur ini bisa jalan
 * di runtime Node/Vercel tanpa binari native apa pun.
 *
 * API ini TIDAK berdokumentasi resmi -> semua data ditandai pddikti_unofficial.
 */

export const PDDIKTI_ORIGIN = 'https://pddikti.kemdiktisaintek.go.id';
export const PDDIKTI_BASE = 'https://api-pddikti.kemdiktisaintek.go.id';

const HEADERS = {
  origin: PDDIKTI_ORIGIN,
  accept: 'application/json, text/plain, */*',
} as const;

export type PddiktiPt = {
  id: string;
  kode: string;
  nama_singkat: string;
  nama: string;
};

export type PddiktiProdi = {
  id: string;
  nama: string;
  jenjang: string;
  pt: string;
  pt_singkat: string;
};

export type PddiktiProdiDiPt = {
  id_sms: string;
  kode_prodi: string;
  nama_prodi: string;
  akreditasi: string;
  jenjang_prodi: string;
  status_prodi: string;
  jumlah_mahasiswa: number;
  rasio: string;
};

export class PddiktiError extends Error {
  constructor(
    message: string,
    readonly status: number,
    readonly path: string,
  ) {
    super(message);
    this.name = 'PddiktiError';
  }
}

/** Satu panggilan mentah. Melempar saat gagal — jangan pernah diam-diam kosong. */
export async function pddikti<T>(
  path: string,
  params?: Record<string, string | number>,
  init?: { timeoutMs?: number; retries?: number },
): Promise<T> {
  const url = new URL(PDDIKTI_BASE + path);
  for (const [k, v] of Object.entries(params ?? {})) url.searchParams.set(k, String(v));

  const timeoutMs = init?.timeoutMs ?? 25_000;
  const retries = init?.retries ?? 2;

  let lastErr: unknown;
  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      const res = await fetch(url, {
        headers: HEADERS,
        signal: AbortSignal.timeout(timeoutMs),
        cache: 'no-store',
      });

      if (res.status === 401) {
        // Ini regresi terpenting yang mungkin terjadi: header origin berhenti diterima.
        throw new PddiktiError('pddikti_origin_rejected', 401, path);
      }
      if (!res.ok) throw new PddiktiError(`pddikti_http_${res.status}`, res.status, path);

      const json = (await res.json()) as { status?: string; data?: T };
      if (json.data === undefined) {
        throw new PddiktiError('pddikti_no_data', res.status, path);
      }
      return json.data;
    } catch (err) {
      lastErr = err;
      if (err instanceof PddiktiError && err.status === 401) throw err; // tidak ada gunanya retry
      if (attempt < retries) await sleep(500 * (attempt + 1));
    }
  }
  throw lastErr instanceof Error ? lastErr : new PddiktiError('pddikti_unknown', 0, path);
}

/** Cari perguruan tinggi berdasarkan kata kunci. Plafon server = 100 hasil. */
export const cariPt = (q: string, limit = 100) =>
  pddikti<PddiktiPt[]>('/pencarian/pt/' + encodeURIComponent(q), { limit });

export const cariProdi = (q: string, limit = 100) =>
  pddikti<PddiktiProdi[]>('/pencarian/prodi/' + encodeURIComponent(q), { limit });

export const detailPt = (id: string) => pddikti<Record<string, unknown>>(`/pt/detail/${id}`);

/** Prodi aktif sebuah PT pada satu semester (mis. '20241'). UIN Jakarta -> 96 baris. */
export const prodiPt = (id: string, semester = '20241') =>
  pddikti<PddiktiProdiDiPt[]>(`/pt/prodi/${id}/${semester}`);

/**
 * Enumerasi katalog.
 *
 * CATATAN: parameter `page` DIABAIKAN server (page=1 dan page=90 mengembalikan
 * 100 baris yang sama, overlap 100/100). Jadi satu-satunya cara mengumpulkan
 * katalog adalah shard per kata kunci. Dipakai oleh scripts/build-catalog.mjs.
 */
export const PAGE_PARAM_IGNORED = true;

/** Kata kunci shard: 26 huruf + tipe PT + provinsi/kota besar. */
export const SHARD_KEYWORDS: readonly string[] = [
  ...'abcdefghijklmnopqrstuvwxyz',
  'universitas',
  'institut',
  'politeknik',
  'sekolah tinggi',
  'akademi',
  'islam negeri',
  'negeri',
  'kesehatan',
  'teknik',
  ...['jakarta', 'bandung', 'surabaya', 'yogyakarta', 'medan', 'makassar', 'semarang', 'malang',
      'palembang', 'banten', 'aceh', 'padang', 'riau', 'lampung', 'jambi', 'bengkulu',
      'kalimantan', 'sulawesi', 'papua', 'bali', 'solo', 'cirebon', 'purwokerto', 'pekalongan',
      'serang', 'bekasi', 'depok', 'bogor', 'tangerang', 'gorontalo', 'ambon', 'manado',
      'kupang', 'mataram', 'samarinda', 'banjarmasin', 'pontianak', 'jember', 'kediri',
      'madiun', 'surakarta', 'magelang', 'salatiga', 'tegal', 'garut', 'karawang', 'sukabumi'],
];

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

/** Rate limit sopan: 1 permintaan/detik/host. */
export const POLITE_DELAY_MS = 110;