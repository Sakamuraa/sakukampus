import type { Metadata } from 'next';
import { scholarships } from '@/lib/data';

export const revalidate = 3600;

export const metadata: Metadata = {
  title: 'Jadwal & tenggat beasiswa',
  description:
    'Tahapan dan tenggat setiap beasiswa, diurutkan dari yang paling dekat. Setiap baris bertaut ke pengumuman resminya.',
};

const tgl = (s: string) => new Date(s).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' });

const DEADLINE_STAGES = ['pendaftaran', 'pendaftaran_akun', 'mandiri_ptn_pts'];

export default function JadwalPage() {
  const now = Date.now();

  const rows = scholarships.flatMap((s) =>
    s.stages.map((st) => ({
      slug: s.slug,
      name: s.name,
      provider: s.provider,
      tier: s.tier,
      tahap: st.name,
      opens: st.opens_at ? Date.parse(st.opens_at) : null,
      closes: st.closes_at ? Date.parse(st.closes_at) : null,
      source_url: s.source_url,
      isDeadline: DEADLINE_STAGES.includes(st.name) && st.closes_at,
    })),
  );

  const mendatang = rows
    .filter((r) => r.closes && r.closes >= now)
    .sort((a, b) => (a.closes ?? 0) - (b.closes ?? 0));

  const lewat = rows
    .filter((r) => r.closes && r.closes < now)
    .sort((a, b) => (b.closes ?? 0) - (a.closes ?? 0))
    .slice(0, 12);

  const sisaHari = (t: number) => Math.ceil((t - now) / 86_400_000);

  return (
    <>
      <h1>Jadwal &amp; tenggat</h1>
      <p className="lede">
        Diurutkan dari tenggat terdekat. Tanggal diambil dari pengumuman resmi tiap penyelenggara —
        selalu periksa ulang di sumbernya, karena jadwal bisa diperpanjang.
      </p>

      <h2>Akan datang</h2>
      {mendatang.length === 0 && <p className="tiny">Tidak ada tenggat yang akan datang.</p>}
      <div className="stack">
        {mendatang.map((r) => {
          const hari = sisaHari(r.closes!);
          return (
            <div key={`${r.slug}-${r.tahap}`} className="card card-tight">
              <div className="row-between">
                <div>
                  <h3 style={{ fontSize: 14.5 }}>{r.name}</h3>
                  <p className="tiny" style={{ marginTop: 2 }}>
                    {r.tahap.replace(/_/g, ' ')} · {r.provider}
                  </p>
                </div>
                <span className={`badge ${hari <= 7 ? 'badge-warn' : ''}`}>
                  {hari <= 0 ? 'hari ini' : `${hari} hari lagi`}
                </span>
              </div>
              <div className="tiny mono" style={{ marginTop: 8 }}>
                {tgl(new Date(r.closes!).toISOString())}
                {r.opens ? ` · dibuka ${tgl(new Date(r.opens).toISOString())}` : ''}
              </div>
              <a className="tiny" href={r.source_url} target="_blank" rel="noreferrer noopener" style={{ display: 'inline-block', marginTop: 8, color: 'var(--accent)' }}>
                Sumber resmi ↗
              </a>
            </div>
          );
        })}
      </div>

      {lewat.length > 0 && (
        <>
          <h2>Baru lewat</h2>
          <p className="tiny" style={{ marginBottom: 12 }}>
            Ditampilkan sebagai riwayat; siklus berikutnya biasanya mengikuti pola yang sama.
          </p>
          <div className="stack">
            {lewat.map((r) => (
              <div key={`${r.slug}-${r.tahap}-past`} className="card card-tight" style={{ opacity: 0.72 }}>
                <div className="row-between">
                  <div>
                    <h3 style={{ fontSize: 14 }}>{r.name}</h3>
                    <p className="tiny" style={{ marginTop: 2 }}>
                      {r.tahap.replace(/_/g, ' ')}
                    </p>
                  </div>
                  <span className="badge badge-no">tutup {tgl(new Date(r.closes!).toISOString())}</span>
                </div>
              </div>
            ))}
          </div>
        </>
      )}
    </>
  );
}