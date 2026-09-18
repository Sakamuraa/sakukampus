'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import { MagnifyingGlass } from '@phosphor-icons/react/dist/csr/MagnifyingGlass';
import { SlidersHorizontal } from '@phosphor-icons/react/dist/csr/SlidersHorizontal';
import { X } from '@phosphor-icons/react/dist/csr/X';
import { ArrowSquareOut } from '@phosphor-icons/react/dist/csr/ArrowSquareOut';
import { Warning } from '@phosphor-icons/react/dist/csr/Warning';
import { SealCheck } from '@phosphor-icons/react/dist/csr/SealCheck';
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

  useEffect(() => {
    if (!kampus || kampus.ukt_model !== 'ptkin_kma' || !prodi) return;
    if (kampus.prodi_contoh === prodi) return;
    let batal = false;
    (async () => {
      const d = await muatKampus(kampus.kode, prodi);
      if (!batal) setKampus(d);
    })();
    return () => { batal = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [prodi, kampus?.kode]);

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

  const totalTutup = hasil?.filter((h) => h.stageStatus === 'tutup').length ?? 0;

  return (
    <div className="wrap">
      <main>
        {/* Header */}
        <section className="hero" style={{ paddingBottom: 28 }}>
          <h1 className="hero-title" style={{ fontSize: 'clamp(22px, 4vw, 32px)' }}>
            Cek kelayakan beasiswa
          </h1>
          <p className="hero-sub">
            Pilih kampus dan golongan UKT-mu. Kolom lain boleh dikosongkan, hasilnya akan jujur berkata perlu data.
          </p>
        </section>

        {/* Step 1: Search campus */}
        <section className="section" style={{ paddingTop: 0 }}>
          <div className="section-head">
            <span className="section-title">Langkah 1 — Kampus</span>
          </div>

          <div className="field" style={{ position: 'relative', maxWidth: 480 }}>
            <label htmlFor="cari" className="label">Cari nama kampus</label>
            <div style={{ position: 'relative' }}>
              <MagnifyingGlass
                size={17}
                aria-hidden="true"
                style={{
                  position: 'absolute', left: 13, top: '50%', transform: 'translateY(-50%)',
                  color: 'var(--ink-faint)', pointerEvents: 'none',
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
              />
            </div>
            <p className="hint">Ketik minimal tiga huruf. Katalog dari PDDikti.</p>
          </div>

          {mencari && (
            <div style={{ marginTop: 12 }}>
              {[0, 1, 2].map((i) => (
                <div key={i} className="skeleton" style={{ height: 52, marginBottom: 8 }} />
              ))}
            </div>
          )}

          {!mencari && kandidat.length > 0 && (
            <div className="grouped" style={{ marginTop: 12 }} role="list">
              {kandidat.map((k) => (
                <button
                  key={k.kode}
                  type="button"
                  role="listitem"
                  onClick={() => pilihKampus(k)}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 12,
                    width: '100%', textAlign: 'left', padding: '14px 16px',
                    background: 'transparent', border: 'none', color: 'inherit',
                    cursor: 'pointer', borderBottom: '1px solid var(--line)',
                  }}
                >
                  <span style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontWeight: 600, fontSize: 14 }}>{k.nama}</div>
                    <div className="tiny faint" style={{ marginTop: 3 }}>
                      {k.kode} · {k.jenis.toLowerCase()}
                      {' · '}
                      {k.punya_ukt ? `${k.jumlah_prodi} prodi berdata UKT` : 'UKT belum terverifikasi'}
                    </div>
                  </span>
                  <span style={{ color: 'var(--ink-faint)' }}>›</span>
                </button>
              ))}
            </div>
          )}

          {!mencari && q.trim().length >= 3 && kandidat.length === 0 && (
            <p className="tiny faint" style={{ marginTop: 12 }}>Tidak ada kampus yang cocok.</p>
          )}
        </section>

        {/* Selected campus */}
        {kampus && (
          <section className="section-tight">
            <div className="card" style={{
              borderColor: kampus.ukt_model === 'ptkin_kma' ? 'var(--accent)' : undefined,
              borderWidth: kampus.ukt_model === 'ptkin_kma' ? 2 : 1,
            }}>
              <div className="row-between">
                <div>
                  <h3 style={{ margin: 0, fontSize: 16 }}>{kampus.nama}</h3>
                  <p className="tiny faint" style={{ margin: '3px 0 0' }}>
                    {kampus.kode} · {kampus.jenis.toLowerCase()}
                  </p>
                </div>
                {kampus.ukt_model === 'ptkin_kma' ? (
                  <span className="badge badge-ok"><SealCheck size={12} weight="fill" /> Terverifikasi</span>
                ) : (
                  <span className="badge badge-warn">Manual</span>
                )}
              </div>
              <p className="tiny faint" style={{ margin: '10px 0 0' }}>{kampus.ukt_note}</p>
            </div>
          </section>
        )}

        {/* Step 2: UKT selection */}
        {kampus && (
          <section className="section-tight">
            <div className="section-head">
              <span className="section-title">Langkah 2 — UKT</span>
            </div>

            {kampus.ukt_model !== 'ptkin_kma' && (
              <div className="notice" style={{ marginBottom: 14, fontSize: 13 }}>
                Kampus ini belum punya tabel UKT terverifikasi. Isi nominal UKT per semester yang kamu bayar.
              </div>
            )}

            <button
              type="button"
              className="btn btn-ghost"
              onClick={bukaSheet}
              style={{ width: '100%', justifyContent: 'flex-start', gap: 10, textAlign: 'left', padding: '14px 16px' }}
            >
              <SlidersHorizontal size={18} />
              <span>{ringkasPilihan ?? 'Atur pilihan UKT'}</span>
            </button>
          </section>
        )}

        {/* Step 3: Academic profile */}
        {kampus && (
          <section className="section-tight">
            <div className="section-head">
              <span className="section-title">Langkah 3 — Profil akademik</span>
            </div>
            <p className="tiny faint" style={{ marginBottom: 16 }}>Semua opsional. Yang kosong akan muncul sebagai perlu data.</p>

            <div className="grid-2" style={{ gap: 14 }}>
              <div className="field">
                <label className="label" htmlFor="jenjang">Jenjang</label>
                <select id="jenjang" className="select" value={jenjang} onChange={(e) => setJenjang(e.target.value)}>
                  {['S1', 'D4', 'D3', 'S2'].map((x) => <option key={x}>{x}</option>)}
                </select>
              </div>

              <div className="field">
                <label className="label" htmlFor="semester">Semester</label>
                <input id="semester" className="input" value={semester}
                  onChange={(e) => setSemester(e.target.value.replace(/\D/g, '').slice(0, 2))}
                  inputMode="numeric" placeholder="5" />
              </div>

              <div className="field">
                <label className="label" htmlFor="ipk">IPK</label>
                <input id="ipk" className="input" value={ipk}
                  onChange={(e) => setIpk(e.target.value.replace(/[^\d.]/g, '').slice(0, 4))}
                  inputMode="decimal" placeholder="3.62" />
              </div>

              <div className="field">
                <label className="label" htmlFor="desil">Desil DTSEN</label>
                <input id="desil" className="input" value={desil}
                  onChange={(e) => setDesil(e.target.value.replace(/\D/g, '').slice(0, 2))}
                  inputMode="numeric" placeholder="1–10" />
                <p className="hint">Tertera di kartu KIP atau surat keterangan kampus.</p>
              </div>

              <div className="field">
                <label className="label" htmlFor="lain">Beasiswa lain?</label>
                <select id="lain" className="select" value={beasiswaLain} onChange={(e) => setBeasiswaLain(e.target.value)}>
                  <option value="">Belum dijawab</option>
                  <option value="tidak">Tidak</option>
                  <option value="ya">Ya</option>
                </select>
              </div>

              <div className="field">
                <label className="label" htmlFor="kip">Pemegang KIP?</label>
                <select id="kip" className="select" value={kip} onChange={(e) => setKip(e.target.value)}>
                  <option value="">Belum dijawab</option>
                  <option value="tidak">Tidak</option>
                  <option value="ya">Ya</option>
                </select>
              </div>
            </div>
          </section>
        )}

        {/* Check button */}
        {kampus && (
          <section className="section-tight" style={{ paddingBottom: 0 }}>
            <button
              type="button"
              className="btn"
              onClick={cek}
              disabled={!bisaCek || memuat}
              style={{ width: '100%', padding: '15px 20px', fontSize: 15, justifyContent: 'center' }}
            >
              {memuat ? (
                <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span className="skeleton" style={{ width: 16, height: 16, borderRadius: '50%', margin: 0 }} />
                  Menghitung...
                </span>
              ) : 'Cek kelayakan beasiswa'}
            </button>
            {!bisaCek && (
              <p className="hint" style={{ marginTop: 10, textAlign: 'center' }}>
                Pilih golongan UKT atau isi nominalnya dulu.
              </p>
            )}
          </section>
        )}

        {/* Error */}
        {galat && (
          <section className="section-tight">
            <div className="notice">{galat}</div>
          </section>
        )}

        {/* Loading skeletons */}
        {memuat && (
          <section className="section-tight">
            {[86, 112, 98].map((h, i) => (
              <div key={i} className="skeleton" style={{ height: h, marginBottom: 12 }} />
            ))}
          </section>
        )}

        {/* Results */}
        {hasil && (
          <div ref={hasilRef}>
            <section className="section">
              <div className="row-between" style={{ marginBottom: 16 }}>
                <h2 style={{ fontSize: 18, fontWeight: 600 }}>{hasil.length} beasiswa diperiksa</h2>
                <Link href="/beasiswa" className="tiny" style={{ color: 'var(--accent)', fontWeight: 600, textDecoration: 'none' }}>
                  Lihat katalog lengkap →
                </Link>
              </div>

              {uktInfo && (
                <div className="card" style={{ padding: 14, marginBottom: 16 }}>
                  <div className="row-between">
                    <span className="tiny faint">UKT yang dipakai</span>
                    <span className="num" style={{ fontWeight: 600, fontSize: 16 }}>{rp(uktInfo.dipakai)}</span>
                  </div>
                  <div className="row-between" style={{ marginTop: 8 }}>
                    <span className="tiny faint">Sumber</span>
                    <span className="tiny">{uktInfo.sumber === 'kma' ? 'KMA 204/2026' : uktInfo.sumber === 'manual' ? 'Input kamu' : '—'}</span>
                  </div>
                </div>
              )}

              {totalTutup > 0 && (
                <p className="tiny faint" style={{ marginBottom: 16 }}>
                  {totalTutup} beasiswa sudah tutup, dikelompokkan terpisah di bawah.
                </p>
              )}
            </section>

            {terkelompok?.map(({ state, items }) => (
              <section key={state} className="section-tight" style={{ borderTop: '1px solid var(--line)' }}>
                <div className="section-head">
                  <span className={`badge ${state === 'lolos' ? 'badge-ok' : state === 'perlu_data' ? 'badge-warn' : 'badge-no'}`}>
                    {STATE_LABEL[state]}
                  </span>
                  <span className="tiny faint">{items.length} beasiswa</span>
                </div>
                <div style={{ display: 'grid', gap: 12 }}>
                  {items.map((h) => (
                    <article key={h.slug} className="scholarship-card">
                      <div className="scholarship-card-header">
                        <div>
                          <div className="scholarship-card-name">{h.name}</div>
                          <div className="scholarship-card-provider">{h.provider}</div>
                        </div>
                        <StateBadge state={h.displayState} />
                      </div>

                      <div className="scholarship-card-tags">
                        <span className="badge">{TIER_LABEL[h.tier] ?? h.tier}</span>
                        <span className="badge">{h.stageStatus === 'buka' ? 'Sedang dibuka' : STAGE_LABEL[h.stageStatus]}</span>
                      </div>

                      {h.uktRequirement && (
                        <p className="tiny" style={{ color: 'var(--ink-dim)', margin: '8px 0' }}>
                          Syarat UKT:{' '}
                          <span className="num" style={{ color: 'var(--ink)', fontWeight: 600 }}>{h.uktRequirement}</span>
                          {h.uktUnverified && <span className="faint"> (manual)</span>}
                        </p>
                      )}

                      <Reasons reasons={h.reasons} />

                      {h.missing.length > 0 && (
                        <p className="tiny faint" style={{ marginTop: 10 }}>
                          Lengkapi: {h.missing.join(', ')}.
                        </p>
                      )}

                      <div className="scholarship-card-actions">
                        <a className="btn btn-sm" href={h.source_url} target="_blank" rel="noreferrer noopener">
                          Sumber resmi <ArrowSquareOut size={12} />
                        </a>
                        {h.deadline !== null && (
                          <span className="tiny faint">
                            {h.displayState === 'tutup' ? 'Tutup' : 'Tenggat'} {tanggal(h.deadline)}
                          </span>
                        )}
                      </div>
                    </article>
                  ))}
                </div>
              </section>
            ))}
          </div>
        )}

        {/* Sheet modal - PTkin KMA */}
        {kampus?.ukt_model === 'ptkin_kma' && (
          <dialog ref={sheetRef} className="sheet" aria-labelledby="sheet-title">
            <div className="sheet-head">
              <div>
                <h3 id="sheet-title" style={{ margin: 0, fontSize: 15 }}>Prodi dan golongan UKT</h3>
                <p className="tiny faint" style={{ margin: '3px 0 0' }}>{kampus.nama}</p>
              </div>
              <button type="button" className="btn btn-quiet btn-sm" onClick={tutupSheet} style={{ padding: '6px 10px', fontSize: 18, lineHeight: 1 }}>×</button>
            </div>
            <div style={{ padding: 20, display: 'flex', flexDirection: 'column', gap: 18 }}>
              <div className="field">
                <label className="label" htmlFor="prodi-sheet">Program studi</label>
                <select id="prodi-sheet" className="select" value={prodi} onChange={(e) => setProdi(e.target.value)}>
                  {kampus.prodi_terdaftar.map((p) => (
                    <option key={p.nama} value={p.nama}>{p.nama}{p.fakultas ? ` (${p.fakultas})` : ''}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="label" style={{ marginBottom: 10 }}>Golongan UKT</label>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(100px, 1fr))', gap: 8 }}>
                  {kelompokOptions.map((u) => (
                    <button key={u.kelompok} type="button"
                      onClick={() => { setKelompok(u.kelompok); setManual(''); }}
                      aria-pressed={kelompok === u.kelompok}
                      style={{
                        padding: '10px 12px', borderRadius: 8, border: `1px solid ${kelompok === u.kelompok ? 'var(--accent)' : 'var(--line)'}`,
                        background: kelompok === u.kelompok ? 'var(--accent)' : 'var(--surface-2)',
                        color: kelompok === u.kelompok ? 'var(--accent-ink)' : 'var(--ink-dim)',
                        cursor: 'pointer', textAlign: 'left', transition: 'all .15s',
                      }}
                    >
                      <div style={{ fontWeight: 600, fontSize: 13 }}>{u.kelompok === 8 ? 'KIP' : `Gol ${u.kelompok}`}</div>
                      <div style={{ fontSize: 11, opacity: 0.8, fontFamily: 'monospace' }}>{u.nominal ? rp(u.nominal) : '—'}</div>
                    </button>
                  ))}
                </div>
              </div>

              {uktTerpilih && (
                <div style={{ padding: 12, borderRadius: 8, background: 'var(--surface-2)', border: '1px solid var(--line)' }}>
                  <p className="tiny" style={{ margin: 0, color: 'var(--ink-dim)' }}>
                    UKT-mu: <span className="num" style={{ color: 'var(--accent)', fontWeight: 600 }}>{rp(uktTerpilih.nominal)}</span>
                  </p>
                </div>
              )}

              {kelompokOptions.some((u) => u.nominal === null) && (
                <div style={{ display: 'flex', gap: 8, alignItems: 'flex-start' }}>
                  <Warning size={14} style={{ flexShrink: 0, marginTop: 2, color: 'var(--warn)' }} aria-hidden="true" />
                  <p className="hint" style={{ margin: 0 }}>Sebagian golongan tidak dicantumkan di dekrit.</p>
                </div>
              )}

              <button type="button" className="btn btn-block" onClick={tutupSheet} style={{ padding: 14 }}>
                Simpan pilihan
              </button>
            </div>
          </dialog>
        )}

        {/* Sheet modal - manual UKT */}
        {kampus && kampus.ukt_model !== 'ptkin_kma' && (
          <dialog ref={sheetRef} className="sheet" aria-labelledby="sheet-title2">
            <div className="sheet-head">
              <h3 id="sheet-title2" style={{ margin: 0, fontSize: 15 }}>Nominal UKT-mu</h3>
              <button type="button" className="btn btn-quiet btn-sm" onClick={tutupSheet} style={{ padding: '6px 10px', fontSize: 18 }}>×</button>
            </div>
            <div style={{ padding: 20 }}>
              <div className="field">
                <label className="label" htmlFor="manual-sheet">Nominal UKT per semester (rupiah)</label>
                <input id="manual-sheet" className="input mono" value={manual}
                  onChange={(e) => setManual(e.target.value.replace(/[^\d]/g, '').slice(0, 12))}
                  inputMode="numeric" placeholder="3500000" />
                {manual && <p className="hint">Terbaca <span className="num">{rp(Number(manual))}</span></p>}
              </div>
              <button type="button" className="btn btn-block" onClick={tutupSheet} style={{ marginTop: 16 }}>Simpan</button>
            </div>
          </dialog>
        )}
      </main>
    </div>
  );
}
