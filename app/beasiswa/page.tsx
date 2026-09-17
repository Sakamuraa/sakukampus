import type { Metadata } from 'next';
import Link from 'next/link';
import { scholarships } from '@/lib/data';
import { stageStatus } from '@/lib/match';

export const revalidate = 3600;

export const metadata: Metadata = {
  title: 'Katalog beasiswa',
  description:
    'Beasiswa kampus, pemerintah, dan swasta untuk mahasiswa Indonesia. Setiap entri membawa sumber resmi dan tanggal verifikasi.',
};

const rp = (n: number) => `Rp${n.toLocaleString('id-ID')}`;
const tgl = (s: string) => new Date(s).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' });

const STATUS_LABEL: Record<string, string> = {
  buka: 'Sedang dibuka',
  akan_datang: 'Akan datang',
  tutup: 'Sudah tutup',
  tanpa_jadwal: 'Tanpa jadwal',
};

const TIER_LABEL: Record<string, string> = {
  kampus: 'Kampus',
  pemerintah: 'Pemerintah',
  swasta: 'Swasta',
};

export default async function BeasiswaPage({
  searchParams,
}: {
  searchParams: Promise<{ tier?: string }>;
}) {
  const { tier } = await searchParams;
  const now = Date.now();

  const list = scholarships
    .filter((s) => !tier || s.tier === tier)
    .map((s) => ({ s, st: stageStatus(s, now) }))
    .sort((a, b) => {
      const order = { buka: 0, akan_datang: 1, tanpa_jadwal: 2, tutup: 3 } as Record<string, number>;
      return (order[a.st] ?? 9) - (order[b.st] ?? 9) || a.s.name.localeCompare(b.s.name);
    });

  return (
    <>
      <h1>Katalog beasiswa</h1>
      <p className="lede">
        Dikelompokkan per penyelenggara. Syarat UKT ditampilkan dalam rupiah untuk beasiswa
        nasional, dan dalam nomor golongan hanya untuk beasiswa yang memang terikat satu kampus.
      </p>

      <div className="chips">
        <Link className="chip" href="/beasiswa" data-on={!tier}>
          Semua
        </Link>
        {(['kampus', 'pemerintah', 'swasta'] as const).map((t) => (
          <Link key={t} className="chip" href={`/beasiswa?tier=${t}`} data-on={tier === t}>
            {TIER_LABEL[t]}
          </Link>
        ))}
      </div>

      <div className="stack">
        {list.map(({ s, st }) => (
          <article key={s.slug} className="card">
            <div className="row-between">
              <div>
                <h3>{s.name}</h3>
                <p className="tiny" style={{ marginTop: 3 }}>{s.provider}</p>
              </div>
              <span
                className={`badge ${st === 'buka' ? 'badge-ok' : st === 'akan_datang' ? 'badge-warn' : 'badge-no'}`}
              >
                {STATUS_LABEL[st]}
              </span>
            </div>

            {s.benefit_summary && <p style={{ marginTop: 10 }}>{s.benefit_summary}</p>}

            <div className="row" style={{ gap: 8, flexWrap: 'wrap', marginTop: 4 }}>
              <span className="badge">{TIER_LABEL[s.tier]}</span>
              <span className="badge">{s.jenjang.join(' / ')}</span>
              {s.ukt_max_idr && <span className="badge badge-warn">UKT ≤ {rp(s.ukt_max_idr)}</span>}
              {s.ukt_max_golongan && (
                <span className="badge badge-warn">Prioritas gol. 1–{s.ukt_max_golongan}</span>
              )}
            </div>

            {s.stages.length > 0 && (
              <div className="tl" style={{ marginTop: 14 }}>
                {s.stages.map((stg) => (
                  <div key={stg.name} className="tl-item" data-state={st}>
                    <div style={{ fontSize: 13.5 }}>{stg.name.replace(/_/g, ' ')}</div>
                    <div className="tiny mono">
                      {stg.opens_at ? tgl(stg.opens_at) : '—'} → {stg.closes_at ? tgl(stg.closes_at) : '—'}
                    </div>
                  </div>
                ))}
              </div>
            )}

            <div className="row" style={{ gap: 10, marginTop: 12, flexWrap: 'wrap' }}>
              <span className="badge badge-verified">Terverifikasi {tgl(s.last_verified_at)}</span>
              {s.confidence < 100 && <span className="badge">keyakinan {s.confidence}%</span>}
            </div>

            <div className="row" style={{ gap: 8, marginTop: 12, flexWrap: 'wrap' }}>
              {s.url_pendaftaran && (
                <a className="btn btn-sm" href={s.url_pendaftaran} target="_blank" rel="noreferrer noopener">
                  Buka pendaftaran resmi
                </a>
              )}
              <a className="btn btn-ghost btn-sm" href={s.source_url} target="_blank" rel="noreferrer noopener">
                Sumber
              </a>
            </div>
          </article>
        ))}
      </div>
    </>
  );
}