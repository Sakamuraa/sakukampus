'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import { AnimatePresence, motion } from 'framer-motion';
import { ArrowSquareOut } from '@phosphor-icons/react/dist/csr/ArrowSquareOut';
import { ArrowRight } from '@phosphor-icons/react/dist/csr/ArrowRight';
import { MagnifyingGlass } from '@phosphor-icons/react/dist/csr/MagnifyingGlass';
import { SealCheck } from '@phosphor-icons/react/dist/csr/SealCheck';
import { SlidersHorizontal } from '@phosphor-icons/react/dist/csr/SlidersHorizontal';
import { Warning } from '@phosphor-icons/react/dist/csr/Warning';
import { X } from '@phosphor-icons/react/dist/csr/X';
import type { Candidate, Profile } from '@/lib/match';
import {
  Caveat,
  Reasons,
  rp,
  tanggal,
  STATE_LABEL,
  STAGE_LABEL,
  StateBadge,
  TIER_LABEL,
} from '@/components/ui';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Field, Input, Select } from '@/components/ui/input';
import { Reveal, Stagger } from '@/components/motion/reveal';
import { cn } from '@/lib/utils';

type KampusRingkas = {
  kode: string;
  nama: string;
  jenis: string;
  punya_ukt: boolean;
  jumlah_prodi: number;
};

type KampusDetail = {
  kode: string;
  nama: string;
  jenis: string;
  ukt_model: string;
  ukt_note: string;
  prodi_terdaftar: {
    nama: string;
    fakultas: string | null;
    ada_data_ukt: boolean;
    golongan: number;
  }[];
  contoh_ukt: { kelompok: number; label: string; nominal: number | null }[];
  prodi_contoh?: string | null;
};

type Hasil = Candidate & { stageStatus: keyof typeof STAGE_LABEL };

const GROUP_ORDER = ['lolos', 'perlu_data', 'tidak', 'tutup'] as const;

const GROUP_TINT: Record<string, string> = {
  lolos: 'ok',
  perlu_data: 'warn',
  tidak: 'neutral',
  tutup: 'neutral',
};

function Step({ n, title, note, children }: { n: number; title: string; note?: string; children: React.ReactNode }) {
  return (
    <Reveal className="relative pl-11">
      <span className="absolute top-0 left-0 grid h-7 w-7 place-items-center rounded-full border border-line bg-surface-2 font-mono text-[12px] font-semibold text-accent">
        {n}
      </span>
      <div className="pb-1">
        <h2 className="text-[15px] font-semibold text-ink">{title}</h2>
        {note && <p className="mt-1 text-[13.5px] text-ink-faint">{note}</p>}
      </div>
      <div className="pt-4">{children}</div>
    </Reveal>
  );
}

export default function CekClient() {
  const [q, setQ] = useState('');
  const [kandidat, setKandidat] = useState<KampusRingkas[]>([]);
  const [mencari, setMencari] = useState(false);
  const [kampus, setKampus] = useState<KampusDetail | null>(null);
  const [prodi, setProdi] = useState('');
  const [kelompok, setKelompok] = useState<number | null>(null);
  const [manual, setManual] = useState('');
  const [jenjang, setJenjang] = useState('S1');
  const [semester, setSemester] = useState('');
  const [ipk, setIpk] = useState('');
  const [beasiswaLain, setBeasiswaLain] = useState('');
  const [desil, setDesil] = useState('');
  const [kip, setKip] = useState('');
  const [hasil, setHasil] = useState<Hasil[] | null>(null);
  const [uktInfo, setUktInfo] = useState<{
    dipakai: number | null;
    sumber: string;
    catatan: string;
  } | null>(null);
  const [memuat, setMemuat] = useState(false);
  const [galat, setGalat] = useState<string | null>(null);
  const [sheet, setSheet] = useState<'ukt' | 'manual' | null>(null);

  const sheetRef = useRef<HTMLDialogElement>(null);
  const hasilRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const term = q.trim();
    if (term.length < 3) {
      setKandidat([]);
      return;
    }
    const ctrl = new AbortController();
    setMencari(true);
    const t = setTimeout(async () => {
      try {
        const r = await fetch(
          `/api/v1/institutions?q=${encodeURIComponent(term)}&limit=12`,
          { signal: ctrl.signal },
        );
        const j = await r.json();
        setKandidat(j.data ?? []);
      } catch {
        /* offline */
      } finally {
        setMencari(false);
      }
    }, 200);
    return () => {
      clearTimeout(t);
      ctrl.abort();
    };
  }, [q]);

  const muatKampus = useCallback(async (kode: string, prodiPilih?: string) => {
    const qs = new URLSearchParams({ kode });
    if (prodiPilih) qs.set('prodi', prodiPilih);
    const r = await fetch(`/api/v1/institutions?${qs}`);
    const j = await r.json();
    setKampus(j.data);
    return j.data as KampusDetail;
  }, []);

  async function pilihKampus(k: KampusRingkas) {
    setKandidat([]);
    setQ(k.nama);
    setKelompok(null);
    setManual('');
    setHasil(null);
    const d = await muatKampus(k.kode);
    setProdi(d?.prodi_terdaftar?.[0]?.nama ?? '');
  }

  useEffect(() => {
    if (!kampus || kampus.ukt_model !== 'ptkin_kma' || !prodi) return;
    if (kampus.prodi_contoh === prodi) return;
    let batal = false;
    (async () => {
      const d = await muatKampus(kampus.kode, prodi);
      if (!batal) setKampus(d);
    })();
    return () => {
      batal = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [prodi, kampus?.kode]);

  const tutupSheet = useCallback(() => sheetRef.current?.close(), []);
  useEffect(() => {
    if (sheet) sheetRef.current?.showModal();
  }, [sheet]);

  const uktTerpilih = useMemo(() => {
    if (!kampus || kelompok === null) return null;
    return kampus.contoh_ukt.find((x) => x.kelompok === kelompok) ?? null;
  }, [kampus, kelompok]);

  const prodiTerpilih = useMemo(
    () => kampus?.prodi_terdaftar.find((p) => p.nama === prodi) ?? null,
    [kampus, prodi],
  );

  const uktSiap = kelompok !== null || manual.trim().length > 0;
  const bisaCek = Boolean(kampus) && uktSiap;

  const ringkasPilihan = useMemo(() => {
    if (!kampus) return null;
    if (kampus.ukt_model === 'ptkin_kma') {
      return `${prodi || 'prodi belum dipilih'} · ${
        kelompok === null ? 'golongan belum dipilih' : `golongan ${kelompok}`
      }`;
    }
    return manual ? rp(Number(manual)) : 'nominal UKT belum diisi';
  }, [kampus, prodi, kelompok, manual]);

  async function cek() {
    if (!kampus) return;
    setMemuat(true);
    setGalat(null);
    setHasil(null);
    tutupSheet();
    const profil: Profile = {
      jenjang,
      fakultas: prodiTerpilih?.fakultas ?? undefined,
      ipk: ipk ? Number(ipk) : undefined,
      semester: semester ? Number(semester) : undefined,
      penerima_beasiswa_lain: beasiswaLain === '' ? undefined : beasiswaLain === 'ya',
      desil_dtsen: desil ? Number(desil) : undefined,
      pemegang_kip: kip === '' ? undefined : kip === 'ya',
    };
    try {
      const r = await fetch('/api/v1/eligibility/check', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          kode_pt: kampus.kode,
          prodi: kampus.ukt_model === 'ptkin_kma' ? prodi : null,
          kelompok,
          nominal_manual: manual ? Number(manual) : null,
          profil,
        }),
      });
      const j = await r.json();
      if (j.status !== 'success') throw new Error(j.message ?? 'permintaan gagal');
      setHasil(j.data.hasil as Hasil[]);
      setUktInfo(j.data.ukt);
      requestAnimationFrame(() =>
        hasilRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }),
      );
    } catch (e) {
      setGalat(
        e instanceof Error && e.message !== 'Failed to fetch'
          ? e.message
          : 'Tidak bisa menghubungi server.',
      );
    } finally {
      setMemuat(false);
    }
  }

  const kelompokOptions = kampus?.contoh_ukt ?? [];

  const terkelompok = useMemo(() => {
    if (!hasil) return null;
    return GROUP_ORDER.map((state) => ({
      state,
      items: hasil.filter((h) => h.displayState === state && h.stageStatus !== 'tutup'),
    })).filter((g) => g.items.length > 0);
  }, [hasil]);

  const totalTutup = hasil?.filter((h) => h.stageStatus === 'tutup').length ?? 0;

  return (
    <>
      <section className="border-b border-line">
        <div className="wrap max-w-3xl py-12 lg:py-16">
          <Reveal>
            <h1 className="text-[clamp(1.9rem,4.5vw,2.9rem)] leading-[1.06] font-extrabold tracking-[-0.035em] text-ink">
              Cek kelayakan beasiswa
            </h1>
            <p className="mt-4 max-w-[56ch] text-[16px] leading-relaxed text-ink-dim">
              Pilih kampus dan golongan UKT-mu. Kolom lain boleh dikosongkan — hasilnya akan jujur
              berkata <span className="text-warn">perlu data</span>, bukan menolak.
            </p>
          </Reveal>
        </div>
      </section>

      <section className="section-pad">
        <div className="wrap max-w-3xl">
          <div className="grid gap-10">
            {/* ── 1. Campus */}
            <Step
              n={1}
              title="Kampus"
              note="Cari nama kampus atau perguruan tinggi tempatmu berkuliah."
            >
              <div className="relative">
                <MagnifyingGlass
                  size={17}
                  className="pointer-events-none absolute top-1/2 left-4 -translate-y-1/2 text-ink-faint"
                />
                <Input
                  value={q}
                  onChange={(e) => {
                    setQ(e.target.value);
                    setHasil(null);
                  }}
                  placeholder="UIN Syarif Hidayatullah"
                  aria-label="Cari kampus"
                  autoComplete="off"
                  className="h-13 pl-11"
                />
                {mencari && (
                  <span className="absolute top-1/2 right-4 -translate-y-1/2 text-[12px] text-ink-faint">
                    mencari…
                  </span>
                )}
              </div>

              <div className="mt-3 grid gap-2">
                {mencari &&
                  [0, 1, 2].map((i) => (
                    <div
                      key={i}
                      className="h-[62px] animate-pulse rounded-card border border-line bg-surface"
                    />
                  ))}

                {!mencari &&
                  kandidat.map((k) => (
                    <button
                      key={k.kode}
                      type="button"
                      onClick={() => pilihKampus(k)}
                      className="press flex w-full items-center gap-4 rounded-card border border-line bg-surface px-4 py-3.5 text-left hover:border-accent/50 hover:bg-surface-2"
                    >
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-[14.5px] font-semibold text-ink">{k.nama}</p>
                        <p className="mt-0.5 text-[12.5px] text-ink-faint">
                          {k.kode} · {k.jenis.toLowerCase()} ·{' '}
                          {k.punya_ukt ? `${k.jumlah_prodi} prodi berdata` : 'UKT manual'}
                        </p>
                      </div>
                      <ArrowRight size={15} className="shrink-0 text-ink-faint" />
                    </button>
                  ))}

                {!mencari && q.trim().length >= 3 && kandidat.length === 0 && (
                  <p className="rounded-card border border-line bg-surface px-4 py-3.5 text-[13.5px] text-ink-faint">
                    Tidak ada kampus yang cocok dengan “{q.trim()}”.
                  </p>
                )}
              </div>
            </Step>

            {/* ── Selected campus */}
            {kampus && (
              <Reveal>
                <Card
                  className={cn(
                    kampus.ukt_model === 'ptkin_kma' && 'border-accent/40 bg-accent/6',
                  )}
                >
                  <CardContent className="flex flex-wrap items-start justify-between gap-3 py-5">
                    <div className="min-w-0">
                      <p className="text-[15.5px] font-semibold text-ink">{kampus.nama}</p>
                      <p className="mt-1 text-[12.5px] text-ink-faint">
                        {kampus.kode} · {kampus.jenis.toLowerCase()}
                      </p>
                      <p className="mt-2 max-w-[52ch] text-[13px] leading-relaxed text-ink-dim">
                        {kampus.ukt_note}
                      </p>
                    </div>
                    {kampus.ukt_model === 'ptkin_kma' ? (
                      <Badge variant="ok">
                        <SealCheck size={12} weight="fill" />
                        Terverifikasi
                      </Badge>
                    ) : (
                      <Badge variant="warn">Isi manual</Badge>
                    )}
                  </CardContent>
                </Card>
              </Reveal>
            )}

            {/* ── 2. UKT */}
            {kampus && (
              <Step n={2} title="UKT" note="Tentukan golongan atau nominal yang kamu bayar.">
                {kampus.ukt_model !== 'ptkin_kma' && (
                  <div className="mb-3 flex items-start gap-2.5 rounded-ctl border border-warn/35 bg-warn-soft px-4 py-3">
                    <Warning size={15} className="mt-0.5 shrink-0 text-warn" />
                    <p className="text-[13px] leading-relaxed text-ink-dim">
                      Kampus ini belum punya tabel UKT terverifikasi. Isi nominal per semester yang
                      kamu bayar.
                    </p>
                  </div>
                )}

                <button
                  type="button"
                  onClick={() =>
                    setSheet(kampus.ukt_model === 'ptkin_kma' ? 'ukt' : 'manual')
                  }
                  className="press flex w-full items-center gap-3 rounded-card border border-line bg-surface px-4 py-4 text-left hover:border-accent/50 hover:bg-surface-2"
                >
                  <SlidersHorizontal size={17} className="shrink-0 text-accent" />
                  <span className="min-w-0 flex-1 truncate text-[14px] text-ink">
                    {ringkasPilihan ?? 'Atur pilihan UKT'}
                  </span>
                  <span className="shrink-0 text-[13px] text-accent">Ubah</span>
                </button>
              </Step>
            )}

            {/* ── 3. Profile */}
            {kampus && (
              <Step
                n={3}
                title="Profil akademik"
                note="Semua opsional. Yang dikosongkan dilaporkan sebagai perlu data."
              >
                <div className="grid gap-4 sm:grid-cols-2">
                  <Field label="Jenjang" htmlFor="jenjang">
                    <Select id="jenjang" value={jenjang} onChange={(e) => setJenjang(e.target.value)}>
                      {['S1', 'D4', 'D3', 'S2'].map((x) => (
                        <option key={x}>{x}</option>
                      ))}
                    </Select>
                  </Field>
                  <Field label="Semester" htmlFor="semester">
                    <Input
                      id="semester"
                      value={semester}
                      onChange={(e) => setSemester(e.target.value.replace(/\D/g, '').slice(0, 2))}
                      inputMode="numeric"
                      placeholder="5"
                    />
                  </Field>
                  <Field label="IPK" htmlFor="ipk">
                    <Input
                      id="ipk"
                      value={ipk}
                      onChange={(e) => setIpk(e.target.value.replace(/[^\d.]/g, '').slice(0, 4))}
                      inputMode="decimal"
                      placeholder="3.62"
                    />
                  </Field>
                  <Field
                    label="Desil DTSEN"
                    htmlFor="desil"
                    hint="Tertera di kartu KIP atau surat keterangan kampus."
                  >
                    <Input
                      id="desil"
                      value={desil}
                      onChange={(e) => setDesil(e.target.value.replace(/\D/g, '').slice(0, 2))}
                      inputMode="numeric"
                      placeholder="1–10"
                    />
                  </Field>
                  <Field label="Beasiswa lain?" htmlFor="lain">
                    <Select
                      id="lain"
                      value={beasiswaLain}
                      onChange={(e) => setBeasiswaLain(e.target.value)}
                    >
                      <option value="">Belum dijawab</option>
                      <option value="tidak">Tidak</option>
                      <option value="ya">Ya</option>
                    </Select>
                  </Field>
                  <Field label="Pemegang KIP?" htmlFor="kip">
                    <Select id="kip" value={kip} onChange={(e) => setKip(e.target.value)}>
                      <option value="">Belum dijawab</option>
                      <option value="tidak">Tidak</option>
                      <option value="ya">Ya</option>
                    </Select>
                  </Field>
                </div>
              </Step>
            )}

            {/* ── Submit */}
            {kampus && (
              <Reveal className="pt-1">
                <Button size="lg" className="w-full" disabled={!bisaCek || memuat} onClick={cek}>
                  {memuat ? 'Menghitung…' : 'Cek kelayakan beasiswa'}
                </Button>
                {!bisaCek && (
                  <p className="mt-3 text-center text-[13px] text-ink-faint">
                    Pilih golongan UKT atau isi nominalnya dulu.
                  </p>
                )}
              </Reveal>
            )}

            {galat && (
              <div className="rounded-ctl border border-[#5c2226] bg-[#3a1518] px-4 py-3 text-[13.5px] text-[#ff8f8f]">
                {galat}
              </div>
            )}
          </div>

          {/* ── Results */}
          <AnimatePresence>
            {hasil && (
              <motion.div
                ref={hasilRef}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="mt-14"
              >
                <div className="flex flex-wrap items-baseline justify-between gap-3 border-b border-line pb-4">
                  <h2 className="text-[clamp(1.3rem,2.4vw,1.6rem)] font-bold tracking-[-0.025em] text-ink">
                    {hasil.length} beasiswa diperiksa
                  </h2>
                  <Link
                    href="/beasiswa"
                    className="press text-[13.5px] font-semibold text-accent hover:underline"
                  >
                    Lihat katalog
                  </Link>
                </div>

                {uktInfo && (
                  <div className="mt-4 flex flex-wrap items-center justify-between gap-4 rounded-card border border-line bg-surface px-5 py-4">
                    <div>
                      <p className="text-[12.5px] text-ink-faint">UKT yang dipakai</p>
                      <p className="num mt-0.5 text-[20px] font-bold text-accent">
                        {rp(uktInfo.dipakai)}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-[12.5px] text-ink-faint">Sumber</p>
                      <p className="mt-0.5 text-[13.5px] text-ink">
                        {uktInfo.sumber === 'kma'
                          ? 'KMA 204/2026'
                          : uktInfo.sumber === 'manual'
                            ? 'Input kamu'
                            : '—'}
                      </p>
                    </div>
                  </div>
                )}

                {totalTutup > 0 && (
                  <p className="mt-4 text-[13px] text-ink-faint">
                    {totalTutup} beasiswa lain sudah tutup dan tidak dihitung.
                  </p>
                )}

                <Caveat />

                <div className="mt-8 grid gap-8">
                  {terkelompok?.map(({ state, items }) => (
                    <div key={state}>
                      <div className="mb-3 flex items-center gap-3">
                        <Badge variant={GROUP_TINT[state] as 'ok' | 'warn' | 'neutral'}>
                          {STATE_LABEL[state]}
                        </Badge>
                        <span className="text-[13px] text-ink-faint">{items.length} beasiswa</span>
                      </div>

                      <Stagger className="grid gap-3" gap={0.04}>
                        {items.map((h) => (
                          <Card key={h.slug}>
                            <CardHeader>
                              <div className="flex items-start justify-between gap-3">
                                <div className="min-w-0">
                                  <CardTitle className="text-[15px] leading-snug">
                                    {h.name}
                                  </CardTitle>
                                  <CardDescription className="mt-1">{h.provider}</CardDescription>
                                </div>
                                <StateBadge state={h.displayState} />
                              </div>
                            </CardHeader>

                            <CardContent className="grid gap-3.5">
                              <div className="flex flex-wrap gap-1.5">
                                <Badge variant="neutral">{TIER_LABEL[h.tier] ?? h.tier}</Badge>
                                <Badge variant="neutral">
                                  {h.stageStatus === 'buka'
                                    ? 'Sedang dibuka'
                                    : STAGE_LABEL[h.stageStatus]}
                                </Badge>
                              </div>

                              {h.uktRequirement && (
                                <p className="text-[13.5px] text-ink-dim">
                                  Syarat UKT:{' '}
                                  <span className="num font-semibold text-ink">
                                    {h.uktRequirement}
                                  </span>
                                  {h.uktUnverified && (
                                    <span className="text-ink-faint"> (manual)</span>
                                  )}
                                </p>
                              )}

                              <Reasons reasons={h.reasons} />

                              {h.missing.length > 0 && (
                                <p className="text-[13px] text-ink-faint">
                                  Lengkapi: {h.missing.join(', ')}.
                                </p>
                              )}

                              <div className="flex flex-wrap items-center gap-3 pt-1">
                                <a
                                  href={h.source_url}
                                  target="_blank"
                                  rel="noreferrer noopener"
                                  className="press inline-flex items-center gap-1.5 text-[13px] font-semibold text-accent hover:underline"
                                >
                                  Sumber resmi
                                  <ArrowSquareOut size={13} />
                                </a>
                                {h.deadline !== null && (
                                  <span className="num text-[13px] text-ink-faint">
                                    {h.displayState === 'tutup' ? 'Tutup' : 'Tenggat'}{' '}
                                    {tanggal(h.deadline)}
                                  </span>
                                )}
                              </div>
                            </CardContent>
                          </Card>
                        ))}
                      </Stagger>
                    </div>
                  ))}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </section>

      {/* ── UKT dialog */}
      <dialog
        ref={sheetRef}
        className="sheet"
        aria-labelledby="sheet-title"
        onClose={() => setSheet(null)}
      >
        {sheet === 'ukt' && kampus?.ukt_model === 'ptkin_kma' && (
          <div className="flex max-h-[86dvh] flex-col overflow-hidden rounded-card border border-line bg-surface">
            <div className="flex shrink-0 items-start justify-between gap-4 border-b border-line px-5 py-4">
              <div className="min-w-0">
                <h3 id="sheet-title" className="text-[15.5px] font-semibold text-ink">
                  Prodi dan golongan UKT
                </h3>
                <p className="mt-0.5 truncate text-[12.5px] text-ink-faint">{kampus.nama}</p>
              </div>
              <button
                onClick={tutupSheet}
                aria-label="Tutup"
                className="press grid h-8 w-8 shrink-0 place-items-center rounded-ctl border border-line text-ink-faint hover:border-line-strong hover:text-ink"
              >
                <X size={15} />
              </button>
            </div>

            <div className="min-h-0 flex-1 overflow-y-auto px-5 py-5">
              <div className="grid gap-5">
                <Field label="Program studi" htmlFor="prodi-sheet">
                  <Select
                    id="prodi-sheet"
                    value={prodi}
                    onChange={(e) => setProdi(e.target.value)}
                  >
                    {kampus.prodi_terdaftar.map((p) => (
                      <option key={p.nama} value={p.nama}>
                        {p.nama}
                        {p.fakultas ? ` (${p.fakultas})` : ''}
                      </option>
                    ))}
                  </Select>
                </Field>

                <div>
                  <p className="mb-2 text-[13px] font-medium text-ink-dim">Golongan UKT</p>
                  <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
                    {kelompokOptions.map((u) => {
                      const on = kelompok === u.kelompok;
                      return (
                        <button
                          key={u.kelompok}
                          type="button"
                          aria-pressed={on}
                          onClick={() => {
                            setKelompok(u.kelompok);
                            setManual('');
                          }}
                          className={cn(
                            'press rounded-ctl border px-3 py-2.5 text-left',
                            on
                              ? 'border-accent bg-accent text-[#14100a]'
                              : 'border-line bg-surface-2 text-ink-dim hover:border-line-strong',
                          )}
                        >
                          <span className="block text-[13px] font-semibold">
                            {u.kelompok === 8 ? 'KIP Kuliah' : `Gol ${u.kelompok}`}
                          </span>
                          <span className="num mt-0.5 block text-[11.5px] opacity-80">
                            {u.nominal ? rp(u.nominal) : '—'}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {uktTerpilih && (
                  <div className="rounded-ctl border border-line bg-surface-2 px-4 py-3">
                    <span className="text-[13px] text-ink-dim">UKT-mu </span>
                    <span className="num text-[17px] font-bold text-accent">
                      {rp(uktTerpilih.nominal)}
                    </span>
                  </div>
                )}

                {kelompokOptions.some((u) => u.nominal === null) && (
                  <div className="flex items-start gap-2">
                    <Warning size={14} className="mt-0.5 shrink-0 text-warn" />
                    <p className="text-[13px] text-ink-faint">
                      Sebagian golongan tidak dicantumkan di dekrit.
                    </p>
                  </div>
                )}
              </div>
            </div>

            <div className="shrink-0 border-t border-line px-5 py-4">
              <Button className="w-full" onClick={tutupSheet}>
                Simpan pilihan
              </Button>
            </div>
          </div>
        )}

        {sheet === 'manual' && kampus && kampus.ukt_model !== 'ptkin_kma' && (
          <div className="flex max-h-[86dvh] flex-col overflow-hidden rounded-card border border-line bg-surface">
            <div className="flex shrink-0 items-center justify-between gap-4 border-b border-line px-5 py-4">
              <h3 id="sheet-title" className="text-[15.5px] font-semibold text-ink">
                Nominal UKT-mu
              </h3>
              <button
                onClick={tutupSheet}
                aria-label="Tutup"
                className="press grid h-8 w-8 shrink-0 place-items-center rounded-ctl border border-line text-ink-faint hover:border-line-strong hover:text-ink"
              >
                <X size={15} />
              </button>
            </div>

            <div className="min-h-0 flex-1 overflow-y-auto px-5 py-5">
              <Field
                label="Nominal UKT per semester (rupiah)"
                htmlFor="manual-sheet"
                hint={manual ? `Terbaca ${rp(Number(manual))}` : 'Angka saja, tanpa titik.'}
              >
                <Input
                  id="manual-sheet"
                  className="num"
                  value={manual}
                  onChange={(e) => setManual(e.target.value.replace(/[^\d]/g, '').slice(0, 12))}
                  inputMode="numeric"
                  placeholder="3500000"
                />
              </Field>
            </div>

            <div className="shrink-0 border-t border-line px-5 py-4">
              <Button className="w-full" onClick={tutupSheet}>
                Simpan
              </Button>
            </div>
          </div>
        )}
      </dialog>
    </>
  );
}
