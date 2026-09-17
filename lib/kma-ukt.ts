/**
 * Parser KMA UKT (Keputusan Menteri Agama) — sumber UKT otoritatif untuk PTKIN.
 *
 * Sumber: https://asset.uinjkt.ac.id/uploads/fmXyXwZY/2026/04/kma-ukt-2026.pdf
 * Dekrit: KMA 204/2026, TA 2026/2027.
 *
 * KENAPA BERBASIS KOORDINAT, BUKAN URUTAN TEKS
 * -------------------------------------------
 * Enam bug nyata dari percobaan parser berbasis teks-baris, semuanya hilang
 * begitu kolom x dipakai:
 *   1. Nama prodi panjang pecah dua baris TANPA penanda ("Bimbingan dan
 *      Konseling" / "Pendidikan Islam"), tak bisa dibedakan dari nama fakultas.
 *   2. Sel golongan 1 punya y sendiri ~5 px di atas nominal lain, sehingga satu
 *      baris prodi terbelah dua.
 *   3. Tiga cara menulis golongan 1: "0 - 400.000", "0 – 400.000", "0-400,000".
 *   4. Nama fakultas adalah SEL GABUNGAN: teksnya diletakkan di tengah kumpulan
 *      baris (bisa di bawah baris pertama), bukan selalu di atas.
 *   5. Baris header PTKIN bercampur kolom: "3 UIN MAULANA | Pendidikan Agama
 *      Islam" — header harus dicari dari ITEM, bukan dari klasifikasi baris.
 *   6. Nama kampus terpotong ke baris lanjutan ("MALIK IBRAHIM", "MALANG"),
 *      yang harus dibedakan dari nama fakultas.
 *
 * Kolom x, diukur langsung dari PDF:
 *     x < 220    -> nama fakultas / lanjutan nama kampus
 *     x ≈ 269    -> nama program studi
 *     x >= 400   -> delapan kolom nominal (gol 1..7 + gol 8 KIP)
 *
 * File ini murni: tanpa fs, tanpa jaringan. PDF -> koordinat dilakukan sekali
 * oleh `scripts/extract-kma-lines.mjs`; hasilnya fixture yang di-commit.
 */

export type PdfItem = { s: string; x: number; y: number };

export type UktRow = {
  prodi: string;
  fakultas: string | null;
  /**
   * gol[i] = nominal golongan (i+1) dalam rupiah, ATAU null bila sumber tidak
   * mencantumkan sel itu. Panjangnya 3..7. `null` dipakai supaya posisi
   * golongan tidak pernah bergeser — kalau golongan 1 kosong di PDF (terjadi
   * pada 57 baris karena selnya benar-benar hilang dari text layer), golongan 2
   * tetap di index 1, bukan naik ke index 0.
   */
  gol: (number | null)[];
  /** golongan 8 (KIP Kuliah), atau null bila sumber tidak mencantumkan. */
  kip: number | null;
};

export type PtkIn = {
  kodeNo: number;
  kampus: string;
  prodi: UktRow[];
};

export type UktSeed = {
  _meta: {
    source_url: string;
    decree: string;
    academic_year: string;
    ptkin: number;
    prodi: number;
    prodi_golongan_lengkap: number;
  };
  ptkin: PtkIn[];
};

export const COLUMN = {
  fakultasMax: 220,
  prodiMin: 220,
  prodiMax: 400,
  nomorMin: 400,
} as const;

/** Band vertikal nama prodi terhadap klaster nominal. */
export const BAND_ABOVE = 4;
export const BAND_BELOW = 13;
/** Jarak maksimum fragmen fakultas agar dianggap satu label. */
export const FAKULTAS_FRAGMENT_GAP = 14;
/** Nominal satu baris digabung bila jarak y <= ini (spasi baris ~20 px). */
export const CLUSTER_TOL = 8;

export const KIP_VALUES = new Set([2_400_000, 2_450_000]);

/** Nominal golongan 1 untuk seluruh PTKIN — dipakai memverifikasi posisi kolom. */
export const GOL1_NOMINAL = 400_000;

const PT_HEADER_RE = /^\s*(\d{1,3})\s+((?:UIN|IAIN|STAIN|UNIVERSITAS ISLAM NEGERI)\b.*)$/;
const RUPIAH_TOKEN_RE = /\d{1,3}(?:\.\d{3})+/g;

export const FOOTER_NOISE = new Set([
  'Imam Syaukani',
  'Sahiron',
  'M. Arskal Salim GP',
  'Kamaruddin Amin',
  'Karo Hukum dan KLN',
  'Dir. Diktis',
  'Ses. Ditjen Pendis',
  'Sekretaris Jenderal',
]);

const PAGE_MARK_RE = /^-\s*\d+\s*-$/;

/** Token yang selalu bagian dari baris footer penandatangan, bukan nama kampus. */
export const FOOTER_TOKENS = new Set([
  'karo', 'kln', 'dir', 'diktis', 'ses', 'ditjen', 'pendis', 'sekretaris', 'jenderal',
  'imam', 'syaukani', 'sahiron', 'arskal', 'salim', 'gp', 'kamaruddin', 'amin',
]);

/** true bila potongan teks jelas bagian baris footer halaman. */
export function isFooterText(text: string): boolean {
  const t = text.toLowerCase();
  if (!t) return true;
  return [...FOOTER_NOISE].some((n) => t.includes(n.toLowerCase()));
}

/**
 * Kosakata nama fakultas. Dipakai untuk memisahkan lanjutan nama kampus dari
 * nama fakultas, karena keduanya duduk di kolom x yang sama dan sering berada
 * pada baris yang sama pula ("ABDURRAHMAN Tarbiyah dan Ilmu").
 */
export const FACULTY_TOKENS = new Set([
  'fakultas', 'tarbiyah', 'keguruan', 'syariah', 'syari', 'hukum', 'dakwah',
  'komunikasi', 'adab', 'humaniora', 'ushuluddin', 'psikologi', 'ekonomi',
  'bisnis', 'sains', 'teknologi', 'ilmu', 'ilmu-ilmu', 'kesehatan', 'kedokteran',
  'sosial', 'politik', 'dan', 'islam', 'negeri', 'pemikiran', 'budaya', 'usuluddin',
  'pascasarjana', 'profesi', 'kedokteran', 'dirasat', 'syariah', 'syariyah',
]);

/** Fragmen nama kampus ditulis HURUF BESAR, nama fakultas Title Case. */
export const isAllCaps = (s: string) =>
  s.length > 1 && s === s.toUpperCase() && /[A-Z]/.test(s) && !/[a-z]/.test(s);

/** Normalisasi potongan teks angka: koma ribuan -> titik, buang "0 - " di depan. */
export function normalizeNominalText(s: string): string {
  return s
    .replace(/[\u2013\u2014]/g, '-')
    .replace(/(?<=\d),(?=\d{3}\b)/g, '.')
    // "0 - 400.000" / "0-400.000" / "0 – 400.000" di mana pun -> "400.000"
    .replace(/\b0\s*-\s*(?=400\.000)/g, '')
    .replace(/\b0\b(?!\d)/g, '');
}

/** Nominal dari satu potongan teks (bisa >1 bila sel menyatu). */
export function nominaisDari(s: string): number[] {
  const normalized = normalizeNominalText(s);
  const found = normalized.match(RUPIAH_TOKEN_RE);
  return found ? found.map((f) => Number(f.replace(/\./g, ''))) : [];
}

export type Line = {
  page: number;
  y: number;
  items: PdfItem[];
  text: string;
  /** Teks kolom prodi saja (x 220..400) — nominal yang menempel tidak ikut. */
  prodiText: string;
  /** Teks kolom fakultas saja (x < 220). */
  fakText: string;
  column: 'fakultas' | 'prodi' | 'angka' | 'campur';
};

function classify(it: PdfItem): 'fakultas' | 'prodi' | 'angka' {
  if (it.x < COLUMN.fakultasMax) return 'fakultas';
  if (it.x < COLUMN.prodiMax) return 'prodi';
  return 'angka';
}

/** Susun teks satu baris; sisipkan spasi saat ada lompatan x yang berarti. */
export function joinItems(items: PdfItem[]): string {
  let out = '';
  for (let i = 0; i < items.length; i++) {
    const it = items[i];
    const prev = items[i - 1];
    const prevEnd = prev ? prev.x + prev.s.length * 4.2 : -Infinity;
    if (out && it.x - prevEnd > 1.5 && !out.endsWith(' ')) out += ' ';
    out += it.s;
  }
  return out.replace(/\s+/g, ' ').trim();
}

/** Kelompokkan item menjadi baris berdasar y. */
export function groupIntoLines(items: PdfItem[], page = 0, tolerance = 2.5): Line[] {
  const buckets = new Map<number, PdfItem[]>();
  for (const it of items) {
    if (!it.s.trim()) continue;
    const key = Math.round(it.y / tolerance) * tolerance;
    const b = buckets.get(key);
    if (b) b.push(it);
    else buckets.set(key, [it]);
  }

  return [...buckets.entries()]
    .map(([y, its]) => {
      const sorted = its.slice().sort((a, b) => a.x - b.x);
      const cols = sorted.map(classify);
      const column: Line['column'] = cols.every((c) => c === 'fakultas')
        ? 'fakultas'
        : cols.every((c) => c === 'angka')
          ? 'angka'
          : cols.some((c) => c === 'prodi')
            ? 'prodi'
            : 'campur';
      return {
        page,
        y,
        items: sorted,
        text: joinItems(sorted),
        prodiText: joinItems(sorted.filter((i) => classify(i) === 'prodi')),
        fakText: joinItems(sorted.filter((i) => classify(i) === 'fakultas')),
        column,
      };
    })
    .filter((l) => l.text.length > 0)
    .sort((a, b) => b.y - a.y);
}

/** Buang token fakultas & footer dari potongan nama kampus. */
export function stripCampusName(text: string): string {
  return text
    .replace(/\s+/g, ' ')
    .trim()
    .split(' ')
    .map((t) => t.trim())
    .filter(Boolean)
    .filter((t) => {
      const low = t.toLowerCase().replace(/[.,]/g, '');
      if (!low) return false;
      if (FACULTY_TOKENS.has(low)) return false;
      if (FOOTER_TOKENS.has(low)) return false;
      return true;
    })
    .join(' ');
}

type Cluster = {
  page: number;
  lo: number;
  hi: number;
  nums: number[];
  prodi: string[];
};

/** Rumpun nominal per halaman (y di-reset tiap halaman — jangan dicampur). */
export function buildClusters(items: PdfItem[], page = 0): Cluster[] {
  const byY = new Map<number, Cluster>();
  const nominal = items
    .filter((it) => it.x >= COLUMN.nomorMin && it.s.trim())
    .sort((a, b) => b.y - a.y);

  const clusters: Cluster[] = [];
  for (const it of nominal) {
    const last = clusters.at(-1);
    if (last && last.lo - it.y <= CLUSTER_TOL) {
      last.lo = Math.min(last.lo, it.y);
      last.hi = Math.max(last.hi, it.y);
    } else {
      clusters.push({ page, lo: it.y, hi: it.y, nums: [], prodi: [] });
    }
  }
  // Isi nominal per klaster: gabungkan SELURUH potongan kolom angka dalam band,
  // urut posisi x, baru di-parse. Ini wajib karena golongan 1 di sebagian PTKIN
  // dipecah menjadi tiga item terpisah ("0", "–", "400.000") sehingga kalau
  // diparse per item, golongan 1 akan hilang dan seluruh kolom bergeser.
  for (const c of clusters) {
    const inBand = items
      .filter(
        (it) => it.x >= COLUMN.nomorMin && it.s.trim() && it.y >= c.lo - 1 && it.y <= c.hi + 1,
      )
      .sort((a, b) => a.x - b.x);
    const joined = inBand.map((it) => it.s).join(' ');
    c.nums = nominaisDari(joined);
  }
  void byY;
  return clusters;
}

/**
 * Pisahkan golongan 1..7 dari KIP (golongan 8).
 *
 * Sekaligus menjaga POSISI: kalau nilai pertama bukan 400.000, itu berarti sel
 * golongan 1 hilang dari text layer (bukan berarti golongan 2). Kasus ini nyata
 * pada 57 baris di KMA 204/2026 — nilainya di-prepend `null`, bukan digeser.
 */
export function splitGolongan(nums: number[]): { gol: (number | null)[]; kip: number | null } {
  const last = nums.at(-1);
  const hasKip = last !== undefined && nums.length >= 4 && KIP_VALUES.has(last);
  const gol: (number | null)[] = hasKip ? nums.slice(0, -1) : nums.slice();
  if (gol.length > 0 && gol[0] !== GOL1_NOMINAL) gol.unshift(null);
  return { gol, kip: hasKip ? last! : null };
}

type FakGroup = { page: number; y: number; text: string };

/** Satukan fragmen fakultas yang berdekatan secara vertikal jadi satu label. */
export function groupFakultas(fragments: Line[]): FakGroup[] {
  const out: FakGroup[] = [];
  const byPage = new Map<number, Line[]>();
  for (const f of fragments) {
    const arr = byPage.get(f.page);
    if (arr) arr.push(f);
    else byPage.set(f.page, [f]);
  }
  for (const [page, fs] of byPage) {
    const sorted = fs.slice().sort((a, b) => b.y - a.y); // atas -> bawah
    let cur: FakGroup | null = null;
    for (const f of sorted) {
      if (cur && cur.y - f.y <= FAKULTAS_FRAGMENT_GAP) {
        cur.text = `${cur.text} ${f.fakText}`.replace(/\s+/g, ' ').trim();
        cur.y = f.y;
      } else {
        if (cur) out.push(cur);
        cur = { page, y: f.y, text: f.fakText };
      }
    }
    if (cur) out.push(cur);
  }
  return out;
}

/**
 * Parse satu segmen (satu PTKIN) menjadi baris prodi.
 *
 * Fakultas di-assign dengan aturan sel-gabungan: label memiliki baris-baris
 * antara titik tengah ke label tetangga atas dan bawahnya. Itu menangani fakultas
 * yang teksnya berada di TENGAH kelompok barisnya, bukan hanya di atas.
 */
function parseSegment(lines: Line[]): UktRow[] {
  const isHeaderLine = (l: Line) => PT_HEADER_RE.test(l.fakText);

  const clusters = lines.flatMap((l) =>
    l === lines.find((x) => x.page === l.page && x.y === l.y)
      ? []
      : [],
  );
  void clusters;

  // Klaster per halaman.
  const allClusters: Cluster[] = [];
  const pages = new Map<number, Line[]>();
  for (const l of lines) {
    const arr = pages.get(l.page);
    if (arr) arr.push(l);
    else pages.set(l.page, [l]);
  }
  for (const [page, ls] of pages) {
    allClusters.push(...buildClusters(ls.flatMap((l) => l.items), page));
  }

  const prodiLines = lines.filter((l) => l.prodiText.length > 0 && !isHeaderLine(l));
  const isNoiseFragment = (t: string) => {
    if (!t) return true;
    if (FOOTER_NOISE.has(t)) return true;
    for (const n of FOOTER_NOISE) if (t.includes(n)) return true;
    return false;
  };
  void isNoiseFragment;

  const fakLabels = groupFakultas(
    lines.filter(
      (l) =>
        l.fakText.length > 1 &&
        !isHeaderLine(l) &&
        !isNoiseFragment(l.fakText) &&
        !PAGE_MARK_RE.test(l.text) &&
        // Fragmen nama kampus (ALL CAPS) bukan nama fakultas.
        !isAllCaps(l.fakText),
    ),
  );

  // 1. Ikat nama prodi ke klaster terdekat (halaman sama).
  for (const line of prodiLines) {
    let best: Cluster | null = null;
    let bestDist = Infinity;
    for (const c of allClusters) {
      if (c.page !== line.page) continue;
      if (line.y < c.lo - BAND_ABOVE || line.y > c.hi + BAND_BELOW) continue;
      const d = Math.abs(line.y - c.hi);
      if (d < bestDist) {
        bestDist = d;
        best = c;
      }
    }
    best?.prodi.push(line.prodiText);
  }

  const rowClusters = allClusters
    .filter((c) => c.prodi.length > 0)
    .sort((a, b) => b.hi - a.hi);

  // 2. Batas wilayah tiap label fakultas (titik tengah ke tetangga).
  const bounds = fakLabels.map((g, i) => {
    const samePage = fakLabels.filter((x) => x.page === g.page).sort((a, b) => b.y - a.y);
    const idx = samePage.findIndex((x) => x === g);
    const above = samePage[idx - 1];
    const below = samePage[idx + 1];
    return {
      group: g,
      top: above ? (g.y + above.y) / 2 : Infinity,
      bottom: below ? (g.y + below.y) / 2 : -Infinity,
    };
  });

  const rows: UktRow[] = [];
  for (const c of rowClusters) {
    const hit = bounds.find(
      (b) => b.group.page === c.page && c.hi <= b.top && c.hi > b.bottom,
    );
    const prodi = c.prodi.join(' ').replace(/\s+/g, ' ').trim();
    if (!prodi || c.nums.length < 3) continue;
    const { gol, kip } = splitGolongan(c.nums);
    rows.push({ prodi, fakultas: hit?.group.text ?? null, gol, kip });
  }

  return rows;
}

/**
 * Parse seluruh dokumen: array halaman -> blok PTKIN.
 *
 * Segmen 0 (sebelum header bernomor pertama) = UIN Jakarta, entri nomor 1 —
 * di dokumen ini entri #1 memang tidak punya baris header bernomor.
 */
export function parseKma(pages: PdfItem[][]): PtkIn[] {
  const all: Line[] = [];
  pages.forEach((items, idx) => all.push(...groupIntoLines(items, idx)));

  // Header dideteksi dari TEKS KOLOM FAKULTAS hasil gabungan baris, bukan dari
  // item tunggal: nomor urut ("3") dan nama ("UIN MAULANA") adalah dua item
  // terpisah, jadi regex hanya cocok setelah keduanya disatukan.
  const headerIdx: number[] = [];
  for (let i = 0; i < all.length; i++) {
    if (PT_HEADER_RE.test(all[i].fakText)) headerIdx.push(i);
  }

  const blocks: PtkIn[] = [];

  const firstCut = headerIdx.length ? headerIdx[0] : all.length;
  const head1 = parseSegment(all.slice(0, firstCut));
  if (head1.length) {
    blocks.push({ kodeNo: 1, kampus: 'UIN SYARIF HIDAYATULLAH JAKARTA', prodi: head1 });
  }

  for (let k = 0; k < headerIdx.length; k++) {
    const start = headerIdx[k];
    const end = k + 1 < headerIdx.length ? headerIdx[k + 1] : all.length;

    // Nama kampus = item header + lanjutan HURUF BESAR di bawahnya (maks 3).
    const headerLine = all[start];
    const m = PT_HEADER_RE.exec(headerLine.fakText)!;

    // Lanjutan nama kampus: token di kolom fakultas pada baris berikutnya yang
    // BUKAN kosakata fakultas. Nama kampus dan nama fakultas duduk di kolom x
    // yang sama dan sering berbagi baris ("ABDURRAHMAN Tarbiyah dan Ilmu"),
    // jadi penyaringan harus per-token, bukan per-baris.
    // Nama kampus dan nama fakultas bisa berada di BARIS YANG SAMA dengan kolom
    // x yang sama ("44 IAIN PONTIANAK Tarbiyah dan Ilmu"), jadi penyaringan
    // token fakultas harus diterapkan sejak capture pertama, bukan hanya ke
    // baris lanjutan.
    let endName = start;
    const parts = [stripCampusName(m[2])].filter(Boolean);
    for (let j = start + 1; j < Math.min(start + 6, end); j++) {
      const cand = all[j];
      if (cand.page !== headerLine.page) break;
      if (headerLine.y - cand.y > 45) break;
      if (PT_HEADER_RE.test(cand.fakText)) break;

      const extra = stripCampusName(cand.fakText).split(/\s+/).filter(Boolean);
      // Baris nominal di sela (tanpa teks) tidak boleh memutus rantai; baris
      // footer harus memutusnya.
      if (extra.length === 0) {
        // Baris tanpa teks kolom fakultas = baris nominal di sela -> lanjut.
        // Baris footer penandatangan -> berhenti, jangan menelan tanda tangan.
        if (cand.fakText.trim() && isFooterText(cand.fakText)) break;
        continue;
      }
      parts.push(...extra);
      endName = j;
      if (parts.join(' ').length > 42) break;
    }

    const rows = parseSegment(all.slice(endName + 1, end));
    if (rows.length) {
      blocks.push({
        kodeNo: Number(m[1]),
        kampus: parts.join(' ').replace(/\s+/g, ' ').trim(),
        prodi: rows,
      });
    }
  }

  return blocks;
}

export function findPtkIn(blocks: PtkIn[], needle: string): PtkIn | undefined {
  const n = needle.toUpperCase();
  return blocks.find((b) => b.kampus.toUpperCase().includes(n));
}

export function findProdi(pt: PtkIn, name: string): UktRow | undefined {
  const n = name.toLowerCase();
  return (
    pt.prodi.find((r) => r.prodi.toLowerCase() === n) ??
    pt.prodi.find((r) => r.prodi.toLowerCase().includes(n))
  );
}

/**
 * Normalisasi syarat UKT berbasis nomor golongan menjadi plafon RUPIAH.
 *
 * Inti §5 plan: nomor golongan TIDAK sebanding antar kampus (gol2 UIN Malang
 * Rp1.106.000 vs UIN Mataram Rp2.461.000). Untuk beasiswa lintas kampus, syarat
 * "prioritas golongan 1–4" harus dikonversi ke rupiah memakai kampus itu.
 *
 * `exactOnly: true` -> null kalau prodi/golongan tidak persis ada (jangan menebak).
 */
export function golonganKeRupiah(
  pt: PtkIn,
  prodi: string,
  kelompok: number,
  opts: { exactOnly?: boolean } = {},
): number | null {
  if (kelompok === 8) {
    const row = findProdi(pt, prodi) ?? pt.prodi[0];
    return row?.kip ?? null;
  }

  const exact = findProdi(pt, prodi)?.gol[kelompok - 1];
  if (exact !== undefined && exact !== null) return exact;
  if (opts.exactOnly) return null;

  // Modus kampus — perkiraan tingkat kampus; pemanggil wajib menandainya.
  const tally = new Map<number, number>();
  for (const r of pt.prodi) {
    const v = r.gol[kelompok - 1];
    if (v !== undefined && v !== null) tally.set(v, (tally.get(v) ?? 0) + 1);
  }
  if (tally.size === 0) return null;
  return [...tally.entries()].sort((a, b) => b[1] - a[1])[0][0];
}

export function summarizeUkt(blocks: PtkIn[]) {
  const totalProdi = blocks.reduce((a, b) => a + b.prodi.length, 0);
  const lengkap = blocks.reduce(
    (a, b) => a + b.prodi.filter((p) => p.gol.length === 7 && p.gol.every((g) => g !== null)).length,
    0,
  );
  return { ptkin: blocks.length, prodi: totalProdi, prodiGolonganLengkap: lengkap };
}