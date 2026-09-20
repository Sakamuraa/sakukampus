'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import { SlidersHorizontal, Warning, SealCheck, ArrowSquareOut } from '@phosphor-icons/react';
import { AnimatedSearchInput } from '@/components/ui/animated-search';
import { GlassCard } from '@/components/ui/glass-card';
import { ShimmerButton } from '@/components/ui/shimmer-button';
import { BadgePill } from '@/components/ui/badge-pill';
import type { Candidate, Profile } from '@/lib/match';
import { Caveat, Reasons, rp, tanggal, STATE_LABEL, STAGE_LABEL, StateBadge, TIER_LABEL } from '@/components/ui';

type KampusRingkas = { kode: string; nama: string; jenis: string; punya_ukt: boolean; jumlah_prodi: number };
type KampusDetail = {
  kode: string; nama: string; jenis: string; ukt_model: string; ukt_note: string;
  prodi_terdaftar: { nama: string; fakultas: string | null; ada_data_ukt: boolean; golongan: number }[];
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
  const [uktInfo, setUktInfo] = useState<{ dipakai: number | null; sumber: string; catatan: string } | null>(null);
  const [memuat, setMemuat] = useState(false);
  const [galat, setGalat] = useState<string | null>(null);
  const sheetRef = useRef<HTMLDialogElement>(null);
  const hasilRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const term = q.trim();
    if (term.length < 3) { setKandidat([]); return; }
    const ctrl = new AbortController();
    setMencari(true);
    const t = setTimeout(async () => {
      try { const r = await fetch(`/api/v1/institutions?q=${encodeURIComponent(term)}&limit=12`, { signal: ctrl.signal }); const j = await r.json(); setKandidat(j.data ?? []); } catch { /* offline */ } finally { setMencari(false); }
    }, 200);
    return () => { clearTimeout(t); ctrl.abort(); };
  }, [q]);

  const muatKampus = useCallback(async (kode: string, prodiPilih?: string) => {
    const qs = new URLSearchParams({ kode }); if (prodiPilih) qs.set('prodi', prodiPilih);
    const r = await fetch(`/api/v1/institutions?${qs}`); const j = await r.json(); setKampus(j.data); return j.data as KampusDetail;
  }, []);

  async function pilihKampus(k: KampusRingkas) {
    setKandidat([]); setQ(k.nama); setKelompok(null); setManual(''); setHasil(null);
    const d = await muatKampus(k.kode); setProdi(d?.prodi_terdaftar?.[0]?.nama ?? '');
  }

  useEffect(() => {
    if (!kampus || kampus.ukt_model !== 'ptkin_kma' || !prodi) return;
    if (kampus.prodi_contoh === prodi) return;
    let batal = false;
    (async () => { const d = await muatKampus(kampus.kode, prodi); if (!batal) setKampus(d); })();
    return () => { batal = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [prodi, kampus?.kode]);

  const bukaSheet = () => sheetRef.current?.showModal();
  const tutupSheet = () => sheetRef.current?.close();

  const uktTerpilih = useMemo(() => {
    if (!kampus || kelompok === null) return null;
    return kampus.contoh_ukt.find((x) => x.kelompok === kelompok) ?? null;
  }, [kampus, kelompok]);

  const prodiTerpilih = useMemo(() => kampus?.prodi_terdaftar.find((p) => p.nama === prodi) ?? null, [kampus, prodi]);
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
    setMemuat(true); setGalat(null); setHasil(null); tutupSheet();
    const profil: Profile = {
      jenjang, fakultas: prodiTerpilih?.fakultas ?? undefined, ipk: ipk ? Number(ipk) : undefined,
      semester: semester ? Number(semester) : undefined, penerima_beasiswa_lain: beasiswaLain === '' ? undefined : beasiswaLain === 'ya',
      desil_dtsen: desil ? Number(desil) : undefined, pemegang_kip: kip === '' ? undefined : kip === 'ya',
    };
    try {
      const r = await fetch('/api/v1/eligibility/check', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ kode_pt: kampus.kode, prodi: kampus.ukt_model === 'ptkin_kma' ? prodi : null, kelompok, nominal_manual: manual ? Number(manual) : null, profil }) });
      const j = await r.json();
      if (j.status !== 'success') throw new Error(j.message ?? 'permintaan gagal');
      setHasil(j.data.hasil as Hasil[]); setUktInfo(j.data.ukt);
      requestAnimationFrame(() => hasilRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }));
    } catch (e) {
      setGalat(e instanceof Error && e.message !== 'Failed to fetch' ? e.message : 'Tidak bisa menghubungi server.');
    } finally { setMemuat(false); }
  }

  const kelompokOptions = kampus?.contoh_ukt ?? [];
  const terkelompok = useMemo(() => {
    if (!hasil) return null;
    return GROUP_ORDER.map((state) => ({ state, items: hasil.filter((h) => h.displayState === state && h.stageStatus !== 'tutup') })).filter((g) => g.items.length > 0);
  }, [hasil]);
  const totalTutup = hasil?.filter((h) => h.stageStatus === 'tutup').length ?? 0;

  return (
    <div className="wrap">
      <main>
        {/* Hero */}
        <section className="hero" style={{ paddingBottom: 32 }}>
          <h1 className="hero-title" style={{ fontSize: 'clamp(24px, 5vw, 36px)' }}>
            Cek kelayakan beasiswa
          </h1>
          <p className="hero-sub">
            Pilih kampus dan golongan UKT-mu. Kolom lain boleh dikosongkan, hasilnya akan jujur berkata perlu data.
          </p>
        </section>

        {/* Step 1: Search */}
        <section className="section" style={{ paddingTop: 0 }}>
          <div className="section-head"><span className="section-title">Langkah 1 — Kampus</span></div>
          <AnimatedSearchInput value={q} onChange={(v) => { setQ(v); setHasil(null); }} placeholder="UIN Syarif Hidayatullah" isLoading={mencari} />

          {mencari && (
            <div style={{ marginTop: 16, display: 'grid', gap: 10 }}>
              {[0, 1, 2].map((i) => <div key={i} className="skeleton" style={{ height: 64, borderRadius: 12 }} />)}
            </div>
          )}

          {!mencari && kandidat.length > 0 && (
            <div style={{ marginTop: 16, display: 'grid', gap: 10 }}>
              {kandidat.map((k) => (
                <button key={k.kode} type="button" onClick={() => pilihKampus(k)}
                  style={{ display: 'flex', alignItems: 'center', gap: 14, width: '100%', padding: '16px 18px', background: 'var(--surface)', border: '1px solid var(--line)', borderRadius: 12, cursor: 'pointer', textAlign: 'left', transition: 'all .2s', color: 'inherit' }}
                  onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.borderColor = 'var(--accent)'; (e.currentTarget as HTMLButtonElement).style.transform = 'translateY(-1px)'; }}
                  onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.borderColor = 'var(--line)'; (e.currentTarget as HTMLButtonElement).style.transform = 'translateY(0)'; }}
                >
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontWeight: 600, fontSize: 15, color: 'var(--ink)' }}>{k.nama}</div>
                    <div className="tiny faint" style={{ marginTop: 4 }}>
                      {k.kode} · {k.jenis.toLowerCase()} · {k.punya_ukt ? `${k.jumlah_prodi} prodi berdata` : 'UKT manual'}
                    </div>
                  </div>
                  <span style={{ color: 'var(--ink-faint)', fontSize: 20 }}>›</span>
                </button>
              ))}
            </div>
          )}

          {!mencari && q.trim().length >= 3 && kandidat.length === 0 && (
            <p className="tiny faint" style={{ marginTop: 16 }}>Tidak ada kampus yang cocok.</p>
          )}
        </section>

        {/* Selected campus */}
        {kampus && (
          <section className="section-tight">
            <GlassCard accent={kampus.ukt_model === 'ptkin_kma'}>
              <div style={{ padding: 20 }}>
                <div className="row-between">
                  <div>
                    <h3 style={{ margin: 0, fontSize: 16, color: 'var(--ink)' }}>{kampus.nama}</h3>
                    <p className="tiny faint" style={{ margin: '4px 0 0' }}>{kampus.kode} · {kampus.jenis.toLowerCase()}</p>
                  </div>
                  {kampus.ukt_model === 'ptkin_kma' ? (
                    <BadgePill variant="success"><SealCheck size={12} weight="fill" /> Terverifikasi</BadgePill>
                  ) : (
                    <BadgePill variant="warning">Manual</BadgePill>
                  )}
                </div>
                <p className="tiny faint" style={{ margin: '12px 0 0', lineHeight: 1.5 }}>{kampus.ukt_note}</p>
              </div>
            </GlassCard>
          </section>
        )}

        {/* Step 2: UKT */}
        {kampus && (
          <section className="section-tight">
            <div className="section-head"><span className="section-title">Langkah 2 — UKT</span></div>
            {kampus.ukt_model !== 'ptkin_kma' && (
              <div className="notice" style={{ marginBottom: 14, fontSize: 13 }}>Kampus ini belum punya tabel UKT terverifikasi. Isi nominal UKT per semester yang kamu bayar.</div>
            )}
            <button type="button" className="btn btn-ghost" onClick={bukaSheet}
              style={{ width: '100%', justifyContent: 'flex-start', gap: 12, padding: '16px 20px', borderRadius: 12, fontSize: 14 }}>
              <SlidersHorizontal size={20} />
              <span>{ringkasPilihan ?? 'Atur pilihan UKT'}</span>
            </button>
          </section>
        )}

        {/* Step 3: Profile */}
        {kampus && (
          <section className="section-tight">
            <div className="section-head"><span className="section-title">Langkah 3 — Profil akademik</span></div>
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
                <input id="semester" className="input" value={semester} onChange={(e) => setSemester(e.target.value.replace(/\D/g, '').slice(0, 2))} inputMode="numeric" placeholder="5" />
              </div>
              <div className="field">
                <label className="label" htmlFor="ipk">IPK</label>
                <input id="ipk" className="input" value={ipk} onChange={(e) => setIpk(e.target.value.replace(/[^\d.]/g, '').slice(0, 4))} inputMode="decimal" placeholder="3.62" />
              </div>
              <div className="field">
                <label className="label" htmlFor="desil">Desil DTSEN</label>
                <input id="desil" className="input" value={desil} onChange={(e) => setDesil(e.target.value.replace(/\D/g, '').slice(0, 2))} inputMode="numeric" placeholder="1–10" />
                <p className="hint">Tertera di kartu KIP atau surat keterangan kampus.</p>
              </div>
              <div className="field">
                <label className="label" htmlFor="lain">Beasiswa lain?</label>
                <select id="lain" className="select" value={beasiswaLain} onChange={(e) => setBeasiswaLain(e.target.value)}>
                  <option value="">Belum dijawab</option><option value="tidak">Tidak</option><option value="ya">Ya</option>
                </select>
              </div>
              <div className="field">
                <label className="label" htmlFor="kip">Pemegang KIP?</label>
                <select id="kip" className="select" value={kip} onChange={(e) => setKip(e.target.value)}>
                  <option value="">Belum dijawab</option><option value="tidak">Tidak</option><option value="ya">Ya</option>
                </select>
              </div>
            </div>
          </section>
        )}

        {/* Check button */}
        {kampus && (
          <section className="section-tight" style={{ paddingBottom: 0 }}>
            <ShimmerButton onClick={cek} disabled={!bisaCek || memuat}
              style={{ width: '100%', padding: '16px 24px', fontSize: 15, borderRadius: 12, background: 'var(--accent)', color: 'var(--accent-ink)', border: 'none', cursor: bisaCek && !memuat ? 'pointer' : 'not-allowed', fontWeight: 600, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
              {memuat ? (
                <><div className="skeleton" style={{ width: 18, height: 18, borderRadius: '50%', margin: 0 }} /> Menghitung...</>
              ) : 'Cek kelayakan beasiswa'}
            </ShimmerButton>
            {!bisaCek && <p className="hint" style={{ marginTop: 12, textAlign: 'center' }}>Pilih golongan UKT atau isi nominalnya dulu.</p>}
          </section>
        )}

        {/* Error */}
        {galat && <section className="section-tight"><div className="notice">{galat}</div></section>}

        {/* Results */}
        {hasil && (
          <div ref={hasilRef}>
            <section className="section">
              <div className="row-between" style={{ marginBottom: 20 }}>
                <h2 style={{ fontSize: 18, fontWeight: 600 }}>{hasil.length} beasiswa diperiksa</h2>
                <Link href="/beasiswa" className="tiny" style={{ color: 'var(--accent)', fontWeight: 600, textDecoration: 'none' }}>Lihat katalog →</Link>
              </div>
              {uktInfo && (
                <GlassCard style={{ marginBottom: 16, padding: 16 }}>
                  <div className="row-between">
                    <span className="tiny faint">UKT yang dipakai</span>
                    <span className="num" style={{ fontWeight: 600, fontSize: 18 }}>{rp(uktInfo.dipakai)}</span>
                  </div>
                  <div className="row-between" style={{ marginTop: 8 }}>
                    <span className="tiny faint">Sumber</span>
                    <span className="tiny">{uktInfo.sumber === 'kma' ? 'KMA 204/2026' : uktInfo.sumber === 'manual' ? 'Input kamu' : '—'}</span>
                  </div>
                </GlassCard>
              )}
              {totalTutup > 0 && <p className="tiny faint" style={{ marginBottom: 16 }}>{totalTutup} beasiswa sudah tutup.</p>}
            </section>

            {terkelompok?.map(({ state, items }) => (
              <section key={state} className="section-tight" style={{ borderTop: '1px solid var(--line)' }}>
                <div className="section-head">
                  <BadgePill variant={state === 'lolos' ? 'success' : state === 'perlu_data' ? 'warning' : 'default'}>{STATE_LABEL[state]}</BadgePill>
                  <span className="tiny faint">{items.length} beasiswa</span>
                </div>
                <div style={{ display: 'grid', gap: 12 }}>
                  {items.map((h) => (
                    <GlassCard key={h.slug} style={{ padding: 20 }}>
                      <div className="scholarship-card-header">
                        <div>
                          <div className="scholarship-card-name">{h.name}</div>
                          <div className="scholarship-card-provider">{h.provider}</div>
                        </div>
                        <StateBadge state={h.displayState} />
                      </div>
                      <div className="scholarship-card-tags" style={{ marginTop: 12 }}>
                        <BadgePill>{TIER_LABEL[h.tier] ?? h.tier}</BadgePill>
                        <BadgePill>{h.stageStatus === 'buka' ? 'Sedang dibuka' : STAGE_LABEL[h.stageStatus]}</BadgePill>
                      </div>
                      {h.uktRequirement && <p className="tiny" style={{ color: 'var(--ink-dim)', margin: '10px 0' }}>Syarat UKT: <span className="num" style={{ color: 'var(--ink)', fontWeight: 600 }}>{h.uktRequirement}</span>{h.uktUnverified && <span className="faint"> (manual)</span>}</p>}
                      <Reasons reasons={h.reasons} />
                      {h.missing.length > 0 && <p className="tiny faint" style={{ marginTop: 10 }}>Lengkapi: {h.missing.join(', ')}.</p>}
                      <div className="scholarship-card-actions" style={{ marginTop: 16 }}>
                        <a className="btn btn-sm" href={h.source_url} target="_blank" rel="noreferrer noopener">Sumber resmi <ArrowSquareOut size={12} /></a>
                        {h.deadline !== null && <span className="tiny faint">{h.displayState === 'tutup' ? 'Tutup' : 'Tenggat'} {tanggal(h.deadline)}</span>}
                      </div>
                    </GlassCard>
                  ))}
                </div>
              </section>
            ))}
          </div>
        )}

        {/* Sheet modal */}
        {kampus?.ukt_model === 'ptkin_kma' && (
          <dialog ref={sheetRef} className="sheet" aria-labelledby="sheet-title">
            <div className="sheet-inner">
              <div className="sheet-head">
                <div><h3 id="sheet-title" style={{ margin: 0, fontSize: 15 }}>Prodi dan golongan UKT</h3><p className="tiny faint" style={{ margin: '3px 0 0' }}>{kampus.nama}</p></div>
                <button type="button" className="btn btn-quiet btn-sm" onClick={tutupSheet} style={{ padding: '6px 10px', fontSize: 18 }}>×</button>
              </div>
              <div style={{ padding: 24, display: 'flex', flexDirection: 'column', gap: 20 }}>
              <div className="field">
                <label className="label" htmlFor="prodi-sheet">Program studi</label>
                <select id="prodi-sheet" className="select" value={prodi} onChange={(e) => setProdi(e.target.value)}>
                  {kampus.prodi_terdaftar.map((p) => (<option key={p.nama} value={p.nama}>{p.nama}{p.fakultas ? ` (${p.fakultas})` : ''}</option>))}
                </select>
              </div>
              <div>
                <label className="label" style={{ marginBottom: 10, display: 'block' }}>Golongan UKT</label>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(100px, 1fr))', gap: 8 }}>
                  {kelompokOptions.map((u) => (
                    <button key={u.kelompok} type="button" onClick={() => { setKelompok(u.kelompok); setManual(''); }} aria-pressed={kelompok === u.kelompok}
                      style={{ padding: '12px 14px', borderRadius: 10, border: `2px solid ${kelompok === u.kelompok ? 'var(--accent)' : 'var(--line)'}`, background: kelompok === u.kelompok ? 'var(--accent)' : 'var(--surface-2)', color: kelompok === u.kelompok ? 'var(--accent-ink)' : 'var(--ink-dim)', cursor: 'pointer', textAlign: 'left', transition: 'all .15s', fontWeight: 600, fontSize: 13 }}>
                      <div style={{ marginBottom: 4 }}>{u.kelompok === 8 ? 'KIP Kuliah' : `Gol ${u.kelompok}`}</div>
                      <div style={{ fontSize: 11, opacity: 0.8, fontFamily: 'monospace' }}>{u.nominal ? rp(u.nominal) : '—'}</div>
                    </button>
                  ))}
                </div>
              </div>
              {uktTerpilih && <div style={{ padding: 14, borderRadius: 10, background: 'var(--surface-2)', border: '1px solid var(--line)' }}><p className="tiny" style={{ margin: 0, color: 'var(--ink-dim)' }}>UKT-mu: <span className="num" style={{ color: 'var(--accent)', fontWeight: 600, fontSize: 16 }}>{rp(uktTerpilih.nominal)}</span></p></div>}
              {kelompokOptions.some((u) => u.nominal === null) && <div style={{ display: 'flex', gap: 8, alignItems: 'flex-start' }}><Warning size={16} style={{ flexShrink: 0, marginTop: 2, color: 'var(--warn)' }} aria-hidden="true" /><p className="hint" style={{ margin: 0 }}>Sebagian golongan tidak dicantumkan di dekrit.</p></div>}
              <button type="button" className="btn btn-block" onClick={tutupSheet} style={{ padding: 16, marginTop: 8 }}>Simpan pilihan</button>
              </div>
            </div>
          </dialog>
        )}

        {kampus && kampus.ukt_model !== 'ptkin_kma' && (
          <dialog ref={sheetRef} className="sheet" aria-labelledby="sheet-title2">
            <div className="sheet-inner">
              <div className="sheet-head"><h3 id="sheet-title2" style={{ margin: 0, fontSize: 15 }}>Nominal UKT-mu</h3><button type="button" className="btn btn-quiet btn-sm" onClick={tutupSheet} style={{ padding: '6px 10px', fontSize: 18 }}>×</button></div>
              <div style={{ padding: 24 }}>
              <div className="field">
                <label className="label" htmlFor="manual-sheet">Nominal UKT per semester (rupiah)</label>
                <input id="manual-sheet" className="input mono" value={manual} onChange={(e) => setManual(e.target.value.replace(/[^\d]/g, '').slice(0, 12))} inputMode="numeric" placeholder="3500000" />
                {manual && <p className="hint">Terbaca <span className="num">{rp(Number(manual))}</span></p>}
              </div>
              <button type="button" className="btn btn-block" onClick={tutupSheet} style={{ marginTop: 16, padding: 16 }}>Simpan</button>
              </div>
            </div>
          </dialog>
        )}
      </main>
    </div>
  );
}