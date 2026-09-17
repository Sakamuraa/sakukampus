/**
 * Eligibility engine — inti produk SakuKampus.
 *
 * Rule = JSON deklaratif per siklus beasiswa. Fakta berasal dari profil user
 * + data kampus yang dipilih (UKT). Tiga hal yang membedakan engine ini:
 *
 * 1. `soft`  — kriteria yang hanya jadi CATATAN: tidak pernah menggugurkan dan
 *              tidak pernah menahan verdict. Contoh: "prioritas golongan 1–4"
 *              di STF UIN Jakarta. Kalau ini ikut menggugurkan, mahasiswa
 *              golongan 5 yang sebenarnya boleh mendaftar akan tertolak.
 * 2. `onlyWhen.scope` — kriteria yang HANYA berlaku untuk scope tertentu.
 *              Pengaman terhadap jebakan golongan UKT (§5 plan): beasiswa
 *              nasional yang syaratnya ditulis dalam nomor golongan akan salah
 *              menilai mahasiswa dari kampus lain, jadi kriterianya DILEWATI.
 * 3. verdict `perlu_data` — tidak pernah ditampilkan sebagai "tidak lolos".
 *
 * Murni fungsi: tanpa DB, tanpa jaringan.
 */

export type Verdict = 'lolos' | 'tidak' | 'perlu_data';

export type Operator = 'eq' | 'neq' | 'gte' | 'lte' | 'gt' | 'lt' | 'in' | 'between' | 'exists';

export type Criterion = {
  fact: string;
  op: Operator;
  value?: unknown;
  label: string;
  /** Kriteria lunak: hanya catatan, tidak memengaruhi verdict. */
  soft?: boolean;
  /** Kriteria hanya berlaku kalau scope cocok (mis. 'kampus:201001'). */
  onlyWhen?: { scope?: string };
};

export type Rule = Criterion | { all: Rule[] } | { any: Rule[] } | { not: Rule };

export type Facts = Record<string, unknown>;

export type Context = {
  /** Scope beasiswa: 'nasional' atau 'kampus:<kode_pt>'. */
  scope: string;
};

export type Reason = {
  label: string;
  ok: boolean | null;
  soft: boolean;
  /** true = kriteria dilewati karena scope-nya tidak cocok. */
  skipped?: boolean;
};

export type CheckResult = {
  verdict: Verdict;
  reasons: Reason[];
  /** Label kriteria wajib yang datanya belum ada. */
  missing: string[];
};

/**
 * Hasil evaluasi satu node:
 *   true / false -> memengaruhi verdict
 *   null         -> data belum ada, menahan verdict
 *   SKIP         -> tidak memengaruhi apa pun (kriteria lunak atau scope beda)
 */
const SKIP = Symbol('skip');
type Tri = boolean | null | typeof SKIP;

type Predicate = (a: unknown, b: unknown) => boolean;

const CMP: Record<Operator, Predicate> = {
  eq: (a, b) => a === b,
  neq: (a, b) => a !== b,
  gte: (a, b) => (a as number) >= (b as number),
  lte: (a, b) => (a as number) <= (b as number),
  gt: (a, b) => (a as number) > (b as number),
  lt: (a, b) => (a as number) < (b as number),
  in: (a, b) => Array.isArray(b) && b.includes(a),
  between: (a, b) =>
    Array.isArray(b) && (a as number) >= (b[0] as number) && (a as number) <= (b[1] as number),
  exists: (a) => a !== null && a !== undefined && a !== '',
};

const isCriterion = (n: Rule): n is Criterion => 'fact' in n && 'op' in n;

/** Kriteria dengan onlyWhen.scope hanya berlaku bila scope-nya cocok. */
export function scopeApplies(c: Criterion, ctx: Context): boolean {
  const wanted = c.onlyWhen?.scope;
  return !wanted || wanted === ctx.scope;
}

/** Agregasi: SKIP dibuang; null menahan; false menggugurkan. */
const and = (v: Tri[]): Tri => {
  const real = v.filter((x) => x !== SKIP);
  if (real.length === 0) return SKIP;
  if (real.includes(false)) return false;
  return real.includes(null) ? null : true;
};

const or = (v: Tri[]): Tri => {
  const real = v.filter((x) => x !== SKIP);
  if (real.length === 0) return SKIP;
  if (real.includes(true)) return true;
  return real.includes(null) ? null : false;
};

export function check(rule: Rule, facts: Facts, ctx: Context = { scope: 'nasional' }): CheckResult {
  const reasons: Reason[] = [];

  const evalNode = (n: Rule): Tri => {
    if ('all' in n) return and(n.all.map(evalNode));
    if ('any' in n) return or(n.any.map(evalNode));
    if ('not' in n) {
      const r = evalNode(n.not);
      if (r === SKIP) return SKIP;
      return r === null ? null : !r;
    }
    if (!isCriterion(n)) return SKIP;

    // Dilewati: tidak memengaruhi verdict, tapi tetap dicatat supaya UI bisa
    // bilang "syarat ini tidak berlaku untuk kampusmu".
    if (!scopeApplies(n, ctx)) {
      reasons.push({ label: n.label, ok: null, soft: !!n.soft, skipped: true });
      return SKIP;
    }

    const raw = facts[n.fact];
    if (raw === undefined || raw === null) {
      reasons.push({ label: n.label, ok: null, soft: !!n.soft });
      return null;
    }

    const predicate = CMP[n.op];
    if (!predicate) {
      reasons.push({ label: n.label, ok: null, soft: !!n.soft });
      return null;
    }

    let ok: boolean;
    try {
      ok = predicate(raw, n.value);
    } catch {
      ok = false;
    }
    reasons.push({ label: n.label, ok, soft: !!n.soft });

    // Inti aturan `soft`: dicatat, tapi tidak pernah ikut menentukan verdict.
    return n.soft ? SKIP : ok;
  };

  const hard = evalNode(rule);

  const hardFailed = reasons.some((r) => !r.soft && r.ok === false);
  const missing = reasons
    .filter((r) => !r.soft && !r.skipped && r.ok === null)
    .map((r) => r.label);

  let verdict: Verdict;
  if (hard === true) verdict = 'lolos';
  else if (hard === false) verdict = hardFailed ? 'tidak' : 'perlu_data';
  else verdict = 'perlu_data'; // SKIP atau null -> belum bisa dipastikan

  return { verdict, reasons, missing };
}

/** Skor 0–100 untuk pengurutan: kriteria lunak berbobot separuh. */
export function score(result: CheckResult): number {
  const scored = result.reasons.filter((r) => r.ok !== null);
  if (scored.length === 0) return 0;
  const total = scored.reduce((a, r) => a + (r.soft ? 0.5 : 1), 0);
  const got = scored.reduce((a, r) => a + (r.ok ? (r.soft ? 0.5 : 1) : 0), 0);
  return Math.round((got / total) * 100);
}