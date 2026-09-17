'use client';

import { useEffect, useMemo, useState } from 'react';
import type { Profile } from '@/lib/match';

export type Hasil = {
  slug: string;
  name: string;
  provider: string;
  tier: string;
  scope: string;
  verdict: 'lolos' | 'tidak' | 'perlu_data';
  score: number;
  reasons: { label: string; ok: boolean | null; soft: boolean; skipped?: boolean }[];
  missing: string[];
  deadline: number | null;
  source_url: string;
  last_verified_at: string;
  uktRequirement: string | null;
  uktUnverified: boolean;
  stage_status?: string;
};

type KampusRingkas = { kode: string; nama: string; jenis: string; punya_ukt: boolean; jumlah_prodi: number };
type KampusDetail = {
  kode: string;
  nama: string;
  jenis: string;
  ukt_model: string;
  ukt_note: string;
  prodi_terdaftar: { nama: string; fakultas: string | null; ada_data_ukt: boolean; golongan: number }[];
  contoh_ukt: { kelompok: number; label: string; nominal: number | null }[];
  prodi_contoh?: string | null;
};

const rp = (n: number | null) => (n === null ? '—' : `Rp${n.toLocaleString('id-ID')}`);
const tgl = (s: string | number | null) => {
  if (s === null) return '—';
  const d = typeof s === 'number' ? new Date(s) : new Date(s);
  return d.toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' });
};

const VERDICT_LABEL: Record<Hasil['verdict'], string> = {
  lolos: 'Lolos',
  perlu_data: 'Perlu data',
  tidak: 'Belum memenuhi',
};

export default function CekClient() {
  const [q, setQ] = useState('');
  const [kandidat, setKandidat] = useState<KampusRingkas[]>([]);
  const [kampus, setKampus] = useState<KampusDetail | null>(null);
  const [prodi, setProdi] = useState<string>('');
  const [kelompok, setKelompok] = useState<number | ''>('');
  const [manual, setManual] = useState<string>('');

  const [ipk, setIpk] = useState('');
  const [semester, setSemester] = useState('');
  const [jenjang, setJenjang] = useState('S1');
  const [beasiswaLain, setBeasiswaLain] = useState<'tidak' | 'ya' | ''>('');
  const [desil, setDesil] = useState('');
  const [kip, setKip] = useState<'tidak' | 'ya' | ''>('');

  const [hasil, setHasil] = useState<Hasil[] | null>(null);
  const [uktInfo, setUktInfo] = useState<{ dipakai: number | null; sumber: string; catatan: string } | null>(null);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    if (q.trim().length < 3) {
      setKandidat([]);
      return;
    }
    const ctrl = new AbortController();
    const t = setTimeout(async () => {
      try {
        const r = await fetch(`/api/v1/institutions?q=${encodeURIComponent(q)}&limit=12`, { signal: ctrl.signal });
        const j = await r.json();
        setKandidat(j.data ?? []);
      } catch {
        /* dibatalkan */
      }
    }, 220);
    return () => {
      clearTimeout(t);
      ctrl.abort();
    };
  }, [q]);

  async function muatKampus(kode: string, prodiPilih?: string) {
    const qs = new URLSearchParams({ kode });
    if (prodiPilih) qs.set('prodi', prodiPilih);
    const r = await fetch(`/api/v1/institutions?${qs}`);
    const j = await r.json();
    setKampus(j.data);
    return j.data as KampusDetail;
  }

  async function pilihKampus(k: KampusRingkas) {
    setKandidat([]);
    setQ(k.nama);
    setKelompok('');
    setHasil(null);
    const d = await muatKampus(k.kode);
    setProdi(d?.prodi_terdaftar?.[0]?.nama ?? '');
  }

  // Ganti prodi -> tabel UKT-nya ikut berubah. Ini penting: dalam satu kampus,
  // Farmasi dan Teknik Informatika bisa berbeda jauh nominalnya.
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

  const uktTerpilih = useMemo(() => {
    if (!kampus || kelompok === '') return null;
    return kampus.contoh_ukt.find((x) => x.kelompok === kelompok) ?? null;
  }, [kampus, kelompok]);

  const bisaCek = Boolean(kampus) && (kelompok !== '' || manual.trim().length > 0);

  async function cek() {
    if (!kampus) return;
    setLoading(true);
    setErr(null);
    setHasil(null);

    const profil: Profile = {
      jenjang,
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
          kelompok: kelompok === '' ? null : kelompok,
          nominal_manual: manual ? Number(manual.replace(/\D/g, '')) : null,
          profil,
        }),
      });
      const j = await r.json();
      if (j.status !== 'success') throw new Error(j.message ?? 'gagal');
      setHasil(j.data.hasil as Hasil[]);
      setUktInfo(j.data.ukt);
    } catch (e) {
      setErr(e instanceof Error ? e.message : 'gagal menghubungi server');
    } finally {
      setLoading(false);
    }
  }

  const kelompokOptions = kampus?.contoh_ukt ?? [];

  return (
    <>
      <h1>Cek kelayakan beasiswa</h1>
      <p className="lede">
        Isi kampus dan golongan UKT-mu. Sisanya opsional — kalau ada yang belum diisi, hasilnya
        ditandai “perlu data”, bukan “tidak lolos”.
      </p>

      <h2>1. Kampusmu</h2>
      <div className="field">
        <label htmlFor="cari">Cari kampus</label>
        <input
          id="cari"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="mis. UIN Syarif Hidayatullah"
          autoComplete="off"
        />
      </div>

      {kandidat.length > 0 && (
        <div className="card" style={{ padding: 6 }}>
          {kandidat.map((k) => (
            <button
              key={k.kode}
              onClick={() => pilihKampus(k)}
              className="btn-ghost"
              style={{
                display: 'block',
                width: '100%',
                textAlign: 'left',
                background: 'transparent',
                border: 0,
                padding: '11px 12px',
                borderRadius: 9,
                cursor: 'pointer',
              }}
            >
              <div style={{ fontSize: 14 }}>{k.nama}</div>
              <div className="tiny">
                {k.kode} · {k.jenis}
                {k.punya_ukt ? ` · ${k.jumlah_prodi} prodi berdata UKT` : ' · UKT belum terverifikasi'}
              </div>
            </button>
          ))}
        </div>
      )}

      {kampus && (
        <div className="card">
          <div className="row-between">
            <div>
              <h3>{kampus.nama}</h3>
              <p className="tiny">
                {kampus.kode} · {kampus.jenis}
              </p>
            </div>
            <span className={`badge ${kampus.ukt_model === 'ptkin_kma' ? 'badge-ok' : 'badge-warn'}`}>
              {kampus.ukt_model === 'ptkin_kma' ? 'UKT terverifikasi' : 'UKT manual'}
            </span>
          </div>
          <p className="tiny" style={{ marginTop: 8 }}>{kampus.ukt_note}</p>
        </div>
      )}

      {kampus?.ukt_model === 'ptkin_kma' && (
        <>
          <h2>2. Prodi &amp; golongan UKT</h2>
          <div className="field">
            <label htmlFor="prodi">Program studi</label>
            <select id="prodi" value={prodi} onChange={(e) => setProdi(e.target.value)}>
              {kampus.prodi_terdaftar.map((p) => (
                <option key={p.nama} value={p.nama}>
                  {p.nama}
                  {p.fakultas ? ` — ${p.fakultas}` : ''}
                </option>
              ))}
            </select>
          </div>
          <div className="field">
            <label>Golongan UKT</label>
            <div className="chips">
              {kelompokOptions.map((u) => (
                <button
                  key={u.kelompok}
                  className="chip"
                  data-on={kelompok === u.kelompok}
                  onClick={() => {
                    setKelompok(u.kelompok);
                    setManual('');
                  }}
                >
                  {u.kelompok === 8 ? 'KIP' : `Gol ${u.kelompok}`} · {rp(u.nominal)}
                </button>
              ))}
            </div>
            {uktTerpilih && (
              <p className="tiny">
                UKT-mu: <span className="mono">{rp(uktTerpilih.nominal)}</span> — angka inilah yang
                dibandingkan dengan plafon rupiah beasiswa nasional.
              </p>
            )}
          </div>
        </>
      )}

      {kampus && kampus.ukt_model !== 'ptkin_kma' && (
        <>
          <h2>2. Nominal UKT-mu</h2>
          <div className="notice" style={{ marginBottom: 14 }}>
            Kampus ini belum punya tabel UKT terverifikasi. Masukkan nominal UKT per semester yang
            kamu bayar sekarang — hasilnya akan ditandai <strong>belum diverifikasi</strong>.
          </div>
          <div className="field">
            <label htmlFor="manual">Nominal UKT per semester (rupiah)</label>
            <input
              id="manual"
              value={manual}
              onChange={(e) => setManual(e.target.value.replace(/[^\d]/g, ''))}
              inputMode="numeric"
              placeholder="mis. 3500000"
            />
            {manual && <p className="tiny">Terbaca: <span className="mono">{rp(Number(manual))}</span></p>}
          </div>
        </>
      )}

      <h2>3. Kondisi akademik &amp; finansial</h2>
      <div className="grid-2">
        <div className="field">
          <label htmlFor="jenjang">Jenjang</label>
          <select id="jenjang" value={jenjang} onChange={(e) => setJenjang(e.target.value)}>
            {['S1', 'D4', 'D3', 'S2'].map((x) => (
              <option key={x}>{x}</option>
            ))}
          </select>
        </div>
        <div className="field">
          <label htmlFor="semester">Semester sekarang</label>
          <input id="semester" value={semester} onChange={(e) => setSemester(e.target.value.replace(/\D/g, ''))} inputMode="numeric" placeholder="mis. 5" />
        </div>
        <div className="field">
          <label htmlFor="ipk">IPK</label>
          <input id="ipk" value={ipk} onChange={(e) => setIpk(e.target.value.replace(/[^\d.]/g, ''))} inputMode="decimal" placeholder="mis. 3.62" />
        </div>
        <div className="field">
          <label htmlFor="desil">Desil DTSEN (kalau tahu)</label>
          <input id="desil" value={desil} onChange={(e) => setDesil(e.target.value.replace(/\D/g, ''))} inputMode="numeric" placeholder="1–10" />
        </div>
        <div className="field">
          <label htmlFor="lain">Sedang menerima beasiswa lain?</label>
          <select id="lain" value={beasiswaLain} onChange={(e) => setBeasiswaLain(e.target.value as never)}>
            <option value="">Belum dijawab</option>
            <option value="tidak">Tidak</option>
            <option value="ya">Ya</option>
          </select>
        </div>
        <div className="field">
          <label htmlFor="kip">Pemegang KIP Pendidikan Menengah?</label>
          <select id="kip" value={kip} onChange={(e) => setKip(e.target.value as never)}>
            <option value="">Belum dijawab</option>
            <option value="tidak">Tidak</option>
            <option value="ya">Ya</option>
          </select>
        </div>
      </div>

      <button className="btn" onClick={cek} disabled={!bisaCek || loading} style={{ width: '100%' }}>
        {loading ? 'Menghitung…' : 'Lihat beasiswa yang cocok'}
      </button>
      {!bisaCek && (
        <p className="tiny" style={{ marginTop: 8 }}>
          Pilih kampus dan golongan UKT (atau isi nominal UKT) dulu.
        </p>
      )}
      {err && <p className="tiny" style={{ color: 'var(--warn)', marginTop: 8 }}>{err}</p>}

      {loading && (
        <div style={{ marginTop: 20 }}>
          <div className="skeleton" />
          <div className="skeleton" />
          <div className="skeleton" />
        </div>
      )}

      {hasil && (
        <>
          <div className="divider" />
          <h2>Hasil</h2>
          {uktInfo && (
            <p className="tiny" style={{ marginBottom: 14 }}>
              UKT yang dipakai: <span className="mono">{rp(uktInfo.dipakai)}</span> ·{' '}
              {uktInfo.sumber === 'kma' ? 'KMA 204/2026' : uktInfo.sumber === 'manual' ? 'input kamu (belum diverifikasi)' : 'tidak ada'} —{' '}
              {uktInfo.catatan}
            </p>
          )}

          {hasil.map((h) => (
            <div key={h.slug} className="card">
              <div className="row-between">
                <div>
                  <h3>{h.name}</h3>
                  <p className="tiny" style={{ marginTop: 3 }}>
                    {h.provider} · {h.tier}
                  </p>
                </div>
                <span
                  className={`badge ${h.verdict === 'lolos' ? 'badge-ok' : h.verdict === 'perlu_data' ? 'badge-warn' : 'badge-no'}`}
                >
                  {VERDICT_LABEL[h.verdict]}
                </span>
              </div>

              {h.uktRequirement && (
                <p className="tiny" style={{ marginTop: 8 }}>
                  Syarat UKT: {h.uktRequirement}
                  {h.uktUnverified && ' · dihitung dari input manualmu'}
                </p>
              )}

              <ul className="reasons">
                {h.reasons.map((r) => (
                  <li key={r.label} data-ok={String(r.ok)} data-soft={String(r.soft)} data-skip={String(!!r.skipped)}>
                    <span className="m">{r.skipped ? '–' : r.ok === true ? '✓' : r.ok === false ? '×' : '?'}</span>
                    <span>
                      {r.label}
                      {r.skipped && ' (tidak berlaku untuk kampusmu)'}
                      {r.soft && !r.skipped && ' — prioritas, bukan syarat wajib'}
                    </span>
                  </li>
                ))}
              </ul>

              {h.missing.length > 0 && (
                <p className="tiny" style={{ marginTop: 10 }}>
                  Lengkapi {h.missing.length} data lagi untuk memastikan: {h.missing.join(', ')}.
                </p>
              )}

              <div className="row" style={{ marginTop: 12, gap: 10, flexWrap: 'wrap' }}>
                {h.deadline && <span className="badge">Tenggat {tgl(h.deadline)}</span>}
                <span className="badge badge-verified">Terverifikasi {tgl(h.last_verified_at)}</span>
              </div>

              <a
                className="btn btn-ghost btn-sm"
                href={h.source_url}
                target="_blank"
                rel="noreferrer noopener"
                style={{ marginTop: 12 }}
              >
                Buka sumber resmi
              </a>
            </div>
          ))}
        </>
      )}
    </>
  );
}