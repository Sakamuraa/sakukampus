'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import { MagnifyingGlass } from '@phosphor-icons/react/dist/csr/MagnifyingGlass';
import { SlidersHorizontal } from '@phosphor-icons/react/dist/csr/SlidersHorizontal';
import { X } from '@phosphor-icons/react/dist/csr/X';
import { CaretRight } from '@phosphor-icons/react/dist/csr/CaretRight';
import { ArrowSquareOut } from '@phosphor-icons/react/dist/csr/ArrowSquareOut';
import { Warning } from '@phosphor-icons/react/dist/csr/Warning';
import { SealCheck } from '@phosphor-icons/react/dist/csr/SealCheck';
import type { Candidate, Profile } from '@/lib/match';
import {
  Caveat,
  Reasons,
  Section,
  rp,
  tanggal,
  STATE_LABEL,
  STAGE_LABEL,
  StateBadge,
  TIER_LABEL,
} from '@/components/ui';

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

/* ---------------------------------------------------------------------------
   Sorting into what the student needs to see first. Closed intakes go last:
   there is nothing to complete for a door that has already shut, which is why
   they must never be labelled "perlu data".
   ------------------------------------------------------------------------- */
/* Closed intakes go last: there is nothing to complete for a door that has
   already shut, which is why they must never be labelled "perlu data". */
const GROUP_ORDER = ['lolos', 'perlu_data', 'tidak', 'tutup'] as const;

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

  const sheetRef = useRef<HTMLDialogElement>(null);
  const hasilRef = useRef<HTMLDivElement>(null);

  /* ------------------------------------------------------------- kampus cari */
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
        const r = await fetch(`/api/v1/institutions?q=${encodeURIComponent(term)}&limit=12`, {
          signal: ctrl.signal,
        });
        const j = await r.json();
        setKandidat(j.data ?? []);
      } catch {
        /* dibatalkan atau offline */
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

  // Ganti prodi mengubah tabel UKT. Dalam satu kampus, Farmasi dan Teknik
  // Informatika bisa berbeda jutaan rupiah, jadi tabelnya wajib ikut berubah.
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

  /* ------------------------------------------------------------ sheet kontrol */
  const bukaSheet = () => sheetRef.current?.showModal();
  const tutupSheet = () => sheetRef.current?.close();

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

  // Ringkasan pilihan untuk tombol: mahasiswa harus bisa melihat apa yang akan
  // dinilai tanpa membuka sheet lagi.
  const ringkasPilihan = useMemo(() => {
    if (!kampus) return null;
    const bagian: string[] = [];
    if (kampus.ukt_model === 'ptkin_kma') {
      bagian.push(prodi || 'prodi belum dipilih');
      bagian.push(kelompok === null ? 'golongan belum dipilih' : `golongan ${kelompok}`);
    } else {
      bagian.push(manual ? rp(Number(manual)) : 'nominal UKT belum diisi');
    }
    return bagian.join(' · ');
  }, [kampus, prodi, kelompok, manual]);

  /* -------------------------------------------------------------------- cek */
  async function cek() {
    if (!kampus) return;
    setMemuat(true);
    setGalat(null);
    setHasil(null);
    tutupSheet();

    const profil: Profile = {
      jenjang,
      // Fakultas ikut dari prodi yang dipilih. Satu pertanyaan lebih sedikit
      // yang harus dijawab mahasiswa, dan jawabannya lebih akurat.
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
          : 'Tidak bisa menghubungi server. Periksa koneksimu lalu coba lagi.',
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

  const totalTutup = hasil?.filter((h) => h.displayState === 'tutup').length ?? 0;

  return (
    <>
      {/* --------------------------------------------------------------- intro */}
      <Section tight>
        <h1 className="h1" style={{ fontSize: 'clamp(1.5rem, 4.5vw, 2.1rem)' }}>
          Cek kelayakan beasiswa
        </h1>
        <p className="lede" style={{ marginTop: 10, maxWidth: '52ch' }}>
          Pilih kampus dan golongan UKT-mu. Kolom lain boleh dikosongkan, dan hasilnya akan jujur
          berkata perlu data.
        </p>
      </Section>

      {/* ------------------------------------------------------------ langkah 1 */}
      <Section tight>
        <div className="flex items-center gap-2" style={{ marginBottom: 12 }}>
          <span className="badge badge-ok">1</span>
          <h2 className="h3">Kampusmu</h2>
        </div>

        <div className="field" style={{ position: 'relative' }}>
          <label className="label" htmlFor="cari">
            Cari nama kampus
          </label>
          <div style={{ position: 'relative' }}>
            <MagnifyingGlass
              size={17}
              aria-hidden="true"
              style={{
                position: 'absolute',
                left: 13,
                top: '50%',
                transform: 'translateY(-50%)',
                color: 'var(--color-ink-faint)',
                pointerEvents: 'none',
              }}
            />
            <input
              id="cari"
              className="input"
              style={{ paddingLeft: 38 }}
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="UIN Syarif Hidayatullah"
              autoComplete="off"
              inputMode="search"
              enterKeyHint="search"
              aria-describedby="cari-hint"
            />
          </div>
          <p className="hint" id="cari-hint">
            Ketik minimal tiga huruf. Katalognya berasal dari PDDikti, dan cakupannya bisa dilihat
            di halaman status data.
          </p>
        </div>

        {mencari && (
          <div style={{ marginTop: 10 }}>
            {[0, 1, 2].map((i) => (
              <div key={i} className="skeleton" style={{ height: 54, marginBottom: 8 }} />
            ))}
          </div>
        )}

        {!mencari && kandidat.length > 0 && (
          <div className="grouped" style={{ marginTop: 10 }} role="list">
            {kandidat.map((k) => (
              <button
                key={k.kode}
                type="button"
                role="listitem"
                onClick={() => pilihKampus(k)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 12,
                  width: '100%',
                  textAlign: 'left',
                  padding: '13px 15px',
                  background: 'transparent',
                  border: 0,
                  color: 'inherit',
                  font: 'inherit',
                  cursor: 'pointer',
                }}
              >
                <span style={{ flex: 1, minWidth: 0 }}>
                  <span
                    style={{ display: 'block', fontSize: '0.9375rem', fontWeight: 560 }}
                  >
                    {k.nama}
                  </span>
                  <span className="small faint" style={{ display: 'block', marginTop: 2 }}>
                    {k.kode} · {k.jenis.toLowerCase()}
                    {k.punya_ukt
                      ? ` · ${k.jumlah_prodi} prodi berdata UKT`
                      : ' · UKT belum terverifikasi'}
                  </span>
                </span>
                <CaretRight size={15} aria-hidden="true" style={{ flexShrink: 0, opacity: 0.5 }} />
              </button>
            ))}
          </div>
        )}

        {!mencari && q.trim().length >= 3 && kandidat.length === 0 && (
          <p className="small muted" style={{ marginTop: 12 }}>
            Tidak ada kampus yang cocok. Coba ejaan lain, atau nama kotanya.
          </p>
        )}
      </Section>

      {/* ------------------------------------------------------------ kampus terpilih */}
      {kampus && (
        <Section tight>
          <div
            className="card"
            style={{
              display: 'grid',
              gap: 4,
              borderColor: kampus.ukt_model === 'ptkin_kma' ? 'var(--color-accent)' : undefined,
            }}
          >
            <div className="flex items-start justify-between gap-3">
              <div style={{ minWidth: 0 }}>
                <h2 className="h3">{kampus.nama}</h2>
                <p className="small faint" style={{ margin: '3px 0 0' }}>
                  {kampus.kode} · {kampus.jenis.toLowerCase()}
                </p>
              </div>
              {kampus.ukt_model === 'ptkin_kma' ? (
                <span className="badge badge-ok">
                  <SealCheck size={12} weight="fill" aria-hidden="true" />
                  UKT terverifikasi
                </span>
              ) : (
                <span className="badge badge-warn">UKT manual</span>
              )}
            </div>
            <p className="small muted" style={{ margin: '10px 0 0' }}>
              {kampus.ukt_note}
            </p>
          </div>
        </Section>
      )}

      {/* --------------------------------------------------------- langkah 2 (sheet) */}
      {kampus && (
        <Section tight>
          <div className="flex items-center gap-2" style={{ marginBottom: 12 }}>
            <span className="badge badge-ok">2</span>
            <h2 className="h3">
              {kampus.ukt_model === 'ptkin_kma' ? 'Prodi dan golongan UKT' : 'Nominal UKT-mu'}
            </h2>
          </div>

          {kampus.ukt_model !== 'ptkin_kma' && (
            <div style={{ marginBottom: 14 }}>
              <Caveat>
                Kampus ini belum punya tabel UKT terverifikasi. Isi nominal UKT per semester yang
                kamu bayar sekarang, dan hasilnya akan ditandai belum diverifikasi.
              </Caveat>
            </div>
          )}

          <button type="button" className="btn btn-quiet btn-block" onClick={bukaSheet}>
            <SlidersHorizontal size={16} aria-hidden="true" />
            {ringkasPilihan ?? 'Atur pilihan'}
          </button>
        </Section>
      )}

      {/* ------------------------------------------------------------ langkah 3 */}
      {kampus && (
        <Section tight>
          <div className="flex items-center gap-2" style={{ marginBottom: 12 }}>
            <span className="badge" style={{ background: 'var(--color-sunken)' }}>
              3
            </span>
            <h2 className="h3">Kondisi akademik dan finansial</h2>
          </div>
          <p className="small muted" style={{ margin: '0 0 14px', maxWidth: '56ch' }}>
            Semuanya opsional. Yang kamu kosongkan akan muncul sebagai perlu data, bukan sebagai
            penolakan.
          </p>

          <div className="grid gap-4 md:grid-cols-2">
            <div className="field">
              <label className="label" htmlFor="jenjang">
                Jenjang
              </label>
              <select
                id="jenjang"
                className="select"
                value={jenjang}
                onChange={(e) => setJenjang(e.target.value)}
              >
                {['S1', 'D4', 'D3', 'S2'].map((x) => (
                  <option key={x}>{x}</option>
                ))}
              </select>
            </div>

            <div className="field">
              <label className="label" htmlFor="semester">
                Semester sekarang
              </label>
              <input
                id="semester"
                className="input"
                value={semester}
                onChange={(e) => setSemester(e.target.value.replace(/\D/g, '').slice(0, 2))}
                inputMode="numeric"
                enterKeyHint="next"
                placeholder="5"
              />
            </div>

            <div className="field">
              <label className="label" htmlFor="ipk">
                IPK
              </label>
              <input
                id="ipk"
                className="input"
                value={ipk}
                onChange={(e) => setIpk(e.target.value.replace(/[^\d.]/g, '').slice(0, 4))}
                inputMode="decimal"
                enterKeyHint="next"
                placeholder="3.62"
              />
            </div>

            <div className="field">
              <label className="label" htmlFor="desil">
                Desil DTSEN, kalau tahu
              </label>
              <input
                id="desil"
                className="input"
                value={desil}
                onChange={(e) => setDesil(e.target.value.replace(/\D/g, '').slice(0, 2))}
                inputMode="numeric"
                enterKeyHint="done"
                placeholder="1 sampai 10"
              />
              <p className="hint">Tertera di kartu KIP atau surat keterangan desil kampusmu.</p>
            </div>

            <div className="field">
              <label className="label" htmlFor="lain">
                Sedang menerima beasiswa lain?
              </label>
              <select
                id="lain"
                className="select"
                value={beasiswaLain}
                onChange={(e) => setBeasiswaLain(e.target.value)}
              >
                <option value="">Belum dijawab</option>
                <option value="tidak">Tidak</option>
                <option value="ya">Ya</option>
              </select>
            </div>

            <div className="field">
              <label className="label" htmlFor="kip">
                Pemegang KIP Pendidikan Menengah?
              </label>
              <select
                id="kip"
                className="select"
                value={kip}
                onChange={(e) => setKip(e.target.value)}
              >
                <option value="">Belum dijawab</option>
                <option value="tidak">Tidak</option>
                <option value="ya">Ya</option>
              </select>
            </div>
          </div>
        </Section>
      )}

      {/* ---------------------------------------------------------------- CTA */}
      {kampus && (
        <div className="cta-bar">
          <div className="shell" style={{ padding: 0 }}>
            <button
              type="button"
              className="btn btn-block"
              onClick={cek}
              disabled={!bisaCek || memuat}
            >
              {memuat ? 'Menghitung…' : 'Lihat beasiswa yang cocok'}
            </button>
            {!bisaCek && (
              <p className="hint" style={{ marginTop: 8, textAlign: 'center' }}>
                Pilih golongan UKT atau isi nominalnya dulu.
              </p>
            )}
          </div>
        </div>
      )}

      {galat && (
        <Section tight>
          <Caveat>{galat}</Caveat>
        </Section>
      )}

      {/* ------------------------------------------------------------- memuat */}
      {memuat && (
        <Section tight>
          {[86, 112, 98].map((h, i) => (
            <div key={i} className="skeleton" style={{ height: h, marginBottom: 12 }} />
          ))}
        </Section>
      )}

      {/* -------------------------------------------------------------- hasil */}
      {hasil && (
        <div ref={hasilRef}>
          <Section tight>
            <div className="flex items-baseline justify-between gap-3" style={{ flexWrap: 'wrap' }}>
              <h2 className="h2">
                {hasil.length} beasiswa diperiksa
              </h2>
              <Link href="/beasiswa" className="small" style={{ fontWeight: 600 }}>
                Lihat katalog lengkap
              </Link>
            </div>

            {uktInfo && (
              <div
                className="grid-rows"
                style={{ marginTop: 14 }}
                role="group"
                aria-label="UKT yang dipakai"
              >
                <div className="grid-row">
                  <span className="muted">UKT yang dipakai</span>
                  <span className="num" style={{ fontWeight: 600 }}>
                    {rp(uktInfo.dipakai)}
                  </span>
                </div>
                <div className="grid-row">
                  <span className="muted">Sumber</span>
                  <span>
                    {uktInfo.sumber === 'kma'
                      ? 'KMA 204/2026'
                      : uktInfo.sumber === 'manual'
                        ? 'Input kamu, belum diverifikasi'
                        : 'Tidak ada'}
                  </span>
                </div>
              </div>
            )}

            {totalTutup > 0 && (
              <p className="small faint" style={{ marginTop: 12 }}>
                {totalTutup} beasiswa pendaftarannya sudah tutup, jadi dikelompokkan terpisah di
                bawah dan tidak dihitung sebagai perlu data.
              </p>
            )}
          </Section>

          {terkelompok?.map(({ state, items }) => (
            <Section key={state} tight>
              <SectionHeadInline
                title={STATE_LABEL[state]}
                count={items.length}
                tone={state}
              />
              <div className="grid gap-4 md:grid-cols-2">
                {items.map((h) => (
                  <article key={h.slug} className="card">
                    <div className="flex items-start justify-between gap-3">
                      <div style={{ minWidth: 0 }}>
                        <h3 className="h3">{h.name}</h3>
                        <p className="small muted" style={{ margin: '4px 0 0' }}>
                          {h.provider}
                        </p>
                      </div>
                      <StateBadge state={h.displayState} />
                    </div>

                    <div
                      className="flex flex-wrap gap-2"
                      style={{ marginTop: 12, alignItems: 'center' }}
                    >
                      <span className="badge">{TIER_LABEL[h.tier] ?? h.tier}</span>
                      <span className="badge">
                        {h.stageStatus === 'buka' ? 'Sedang dibuka' : STAGE_LABEL[h.stageStatus]}
                      </span>
                    </div>

                    {h.uktRequirement && (
                      <p className="small" style={{ margin: '12px 0 0' }}>
                        Syarat UKT: {/* Angka rupiah selalu tabular supaya kolomnya lurus. */}
                        <span className="num">{h.uktRequirement}</span>
                        {h.uktUnverified && (
                          <span className="faint"> · dihitung dari input manualmu</span>
                        )}
                      </p>
                    )}

                    <div style={{ marginTop: 10, paddingTop: 4 }}>
                      <Reasons reasons={h.reasons} />
                    </div>

                    {h.missing.length > 0 && (
                      <p className="small muted" style={{ margin: '10px 0 0' }}>
                        Lengkapi {h.missing.length} data untuk memastikan: {h.missing.join(', ')}.
                      </p>
                    )}

                    <div
                      className="flex flex-wrap items-center gap-x-4 gap-y-2"
                      style={{ marginTop: 14 }}
                    >
                      {h.deadline !== null && (
                        <span className="small faint">
                          {h.displayState === 'tutup' ? 'Tutup' : 'Tenggat'} {tanggal(h.deadline)}
                        </span>
                      )}
                      <span className="small faint">Diperiksa {tanggal(h.last_verified_at)}</span>
                    </div>

                    <div className="flex flex-wrap gap-2" style={{ marginTop: 14 }}>
                      <a
                        className="btn btn-quiet"
                        href={h.source_url}
                        target="_blank"
                        rel="noreferrer noopener"
                        style={{ minHeight: 40, padding: '0 14px', fontSize: '0.875rem' }}
                      >
                        Sumber resmi
                        <ArrowSquareOut size={14} aria-hidden="true" />
                      </a>
                    </div>
                  </article>
                ))}
              </div>
            </Section>
          ))}
        </div>
      )}

      {/* --------------------------------------------------------- sheet modal
          Native <dialog>: focus trap, Esc, and backdrop come from the platform
          instead of being reimplemented and getting the details wrong. */}
      {kampus?.ukt_model === 'ptkin_kma' && (
        <dialog ref={sheetRef} className="sheet" aria-labelledby="sheet-title">
          <div className="sheet-head">
            <div>
              <h2 className="h3" id="sheet-title" style={{ margin: 0 }}>
                Prodi dan golongan UKT
              </h2>
              <p className="tiny" style={{ margin: '3px 0 0', color: 'var(--ink-faint)' }}>
                {kampus.nama}
              </p>
            </div>
            <button
              type="button"
              className="btn btn-quiet"
              onClick={tutupSheet}
              style={{ minHeight: 32, padding: '0 10px', fontSize: 18, lineHeight: 1 }}
              aria-label="Tutup"
            >
              ×
            </button>
          </div>

          <div style={{ padding: '20px 20px calc(24px + env(safe-area-inset-bottom))', display: 'flex', flexDirection: 'column', gap: 20 }}>
            {/* Prodi selector */}
            <div className="field">
              <label className="label" htmlFor="prodi-sheet">
                Program studi
              </label>
              <select
                id="prodi-sheet"
                className="select"
                value={prodi}
                onChange={(e) => setProdi(e.target.value)}
                style={{ background: 'var(--surface-2)', color: 'var(--ink)', borderColor: 'var(--line)', fontSize: 14, padding: '10px 12px' }}
              >
                {kampus.prodi_terdaftar.map((p) => (
                  <option key={p.nama} value={p.nama}>
                    {p.nama}
                    {p.fakultas ? ` (${p.fakultas})` : ''}
                  </option>
                ))}
              </select>
            </div>

            {/* Golongan selector */}
            <div>
              <span className="label" style={{ marginBottom: 10, display: 'block' }}>
                Golongan UKT
              </span>
              <div
                className="chip-rail"
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fill, minmax(110px, 1fr))',
                  gap: 8,
                }}
              >
                {kelompokOptions.map((u) => (
                  <button
                    key={u.kelompok}
                    type="button"
                    className="chip"
                    data-on={kelompok === u.kelompok}
                    onClick={() => {
                      setKelompok(u.kelompok);
                      setManual('');
                    }}
                    aria-pressed={kelompok === u.kelompok}
                    style={{
                      padding: '10px 12px',
                      textAlign: 'left',
                      fontSize: 12,
                      transition: 'all .15s ease',
                      border: `1px solid ${kelompok === u.kelompok ? 'var(--accent)' : 'var(--line)'}`,
                      background: kelompok === u.kelompok ? 'var(--accent)' : 'var(--surface)',
                      color: kelompok === u.kelompok ? 'var(--accent-ink)' : 'var(--ink-dim)',
                    }}
                  >
                    <div style={{ fontWeight: 600, fontSize: 13, marginBottom: 2 }}>
                      {u.kelompok === 8 ? 'KIP Kuliah' : `Gol ${u.kelompok}`}
                    </div>
                    <div style={{ opacity: 0.8, fontSize: 11, fontFamily: 'monospace' }}>
                      {u.nominal ? rp(u.nominal) : '—'}
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* Selected info */}
            {uktTerpilih && (
              <div
                style={{
                  padding: '12px 14px',
                  borderRadius: 'var(--radius-sm)',
                  background: 'var(--surface-2)',
                  border: '1px solid var(--line)',
                }}
              >
                <p className="tiny" style={{ margin: 0, color: 'var(--ink-dim)' }}>
                  UKT-mu: <span className="num" style={{ color: 'var(--accent)', fontWeight: 600 }}>{rp(uktTerpilih.nominal)}</span>
                </p>
                <p className="hint" style={{ margin: '4px 0 0' }}>
                  Angka inilah yang dibandingkan dengan plafon rupiah beasiswa nasional.
                </p>
              </div>
            )}

            {/* Warning for null nominations */}
            {kelompokOptions.some((u) => u.nominal === null) && (
              <div style={{ display: 'flex', gap: 8, alignItems: 'flex-start' }}>
                <Warning size={14} aria-hidden="true" style={{ flexShrink: 0, marginTop: 2, color: 'var(--warn)' }} />
                <p className="hint" style={{ margin: 0 }}>
                  Sebagian golongan tidak dicantumkan di dekrit untuk prodi ini, jadi ditandai tidak
                  dicantumkan, bukan diisi angka karangan.
                </p>
              </div>
            )}

            {/* Save button */}
            <button
              type="button"
              className="btn btn-block"
              onClick={tutupSheet}
              style={{ marginTop: 4, padding: '14px 16px', fontSize: 15 }}
            >
              Simpan pilihan
            </button>
          </div>
        </dialog>
      )}

      {/* Sheet untuk kampus tanpa tabel UKT: hanya satu isian. */}
      {kampus && kampus.ukt_model !== 'ptkin_kma' && (
        <dialog ref={sheetRef} className="sheet" aria-labelledby="sheet-title2">
          <div className="sheet-head">
            <h2 className="h3" id="sheet-title2">
              Nominal UKT-mu
            </h2>
            <button
              type="button"
              className="btn btn-quiet"
              onClick={tutupSheet}
              style={{ minHeight: 36, padding: '0 12px' }}
              aria-label="Tutup"
            >
              <X size={16} aria-hidden="true" />
            </button>
          </div>
          <div style={{ padding: '18px 18px calc(24px + env(safe-area-inset-bottom))' }}>
            <div className="field">
              <label className="label" htmlFor="manual-sheet">
                Nominal UKT per semester, dalam rupiah
              </label>
              <input
                id="manual-sheet"
                className="input num"
                value={manual}
                onChange={(e) => setManual(e.target.value.replace(/[^\d]/g, '').slice(0, 12))}
                inputMode="numeric"
                enterKeyHint="done"
                placeholder="3500000"
              />
              {manual && (
                <p className="hint">
                  Terbaca <span className="num">{rp(Number(manual))}</span>
                </p>
              )}
            </div>
            <button
              type="button"
              className="btn btn-block"
              onClick={tutupSheet}
              style={{ marginTop: 20 }}
            >
              Simpan
            </button>
          </div>
        </dialog>
      )}
    </>
  );
}

/* Heading for a verdict group. Count sits beside the label so the reader knows
   how much is in a collapsed-looking group before reading it. */
function SectionHeadInline({
  title,
  count,
  tone,
}: {
  title: string;
  count: number;
  tone: string;
}) {
  const cls =
    tone === 'lolos'
      ? 'badge badge-ok'
      : tone === 'perlu_data'
        ? 'badge badge-warn'
        : 'badge badge-off';
  return (
    <div className="flex items-center gap-2" style={{ marginBottom: 14 }}>
      <span className={cls}>{title}</span>
      <span className="small faint">{count} beasiswa</span>
    </div>
  );
}