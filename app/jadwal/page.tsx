import type { Metadata } from 'next';
import Link from 'next/link';
import { Clock } from '@phosphor-icons/react/dist/ssr/Clock';
import { scholarships } from '@/lib/data';
import { Section, tanggal, sisaHari, TIER_LABEL } from '@/components/ui';

export const revalidate = 1800;

export const metadata: Metadata = {
  title: 'Jadwal dan tenggat beasiswa',
  description:
    'Tahapan dan tenggat setiap beasiswa, diurutkan dari yang paling dekat. Setiap baris bertaut ke pengumuman resminya.',
};

/* Only intake stages count as deadlines. Interview and announcement dates do
   not belong in a "how long do I have left" countdown. */
const DEADLINE_STAGES = new Set(['pendaftaran', 'pendaftaran_akun', 'mandiri_ptn_pts']);

export default function JadwalPage() {
  const now = Date.now();

  const baris = scholarships.flatMap((s) =>
    s.stages
      .filter((st) => DEADLINE_STAGES.has(st.name) && st.closes_at)
      .map((st) => ({
        slug: s.slug,
        nama: s.name,
        penyelenggara: s.provider,
        tier: s.tier,
        tenggat: Date.parse(st.closes_at!),
        buka: st.opens_at ? Date.parse(st.opens_at) : null,
        sumber: s.source_url,
        daftar: s.url_pendaftaran ?? null,
      })),
  );

  const mendatang = baris.filter((r) => r.tenggat >= now).sort((a, b) => a.tenggat - b.tenggat);
  const lewat = baris.filter((r) => r.tenggat < now).sort((a, b) => b.tenggat - a.tenggat);

  return (
    <>
      <Section tight>
        <h1 className="h1" style={{ fontSize: 'clamp(1.5rem, 4.5vw, 2.1rem)' }}>
          Jadwal dan tenggat
        </h1>
        <p className="lede" style={{ marginTop: 10, maxWidth: '54ch' }}>
          Diurutkan dari tenggat terdekat. Tanggal diambil dari pengumuman resmi tiap penyelenggara,
          dan jadwal bisa diperpanjang, jadi periksa ulang di sumbernya sebelum menutup pendaftaran.
        </p>
      </Section>

      <Section tight>
        <div className="flex items-baseline justify-between gap-3" style={{ marginBottom: 14 }}>
          <h2 className="h2">Masih bisa didaftar</h2>
          <span className="small faint">{mendatang.length} tahap</span>
        </div>

        {mendatang.length === 0 ? (
          <div className="card" style={{ display: 'grid', gap: 10, padding: '26px 20px' }}>
            <p style={{ margin: 0, fontWeight: 600 }}>Belum ada tenggat yang akan datang.</p>
            <p className="small muted" style={{ margin: 0 }}>
              Siklus berikutnya biasanya mengikuti pola tahun sebelumnya. Halaman ini diperbarui
              setiap kali jadwal baru terbit.
            </p>
            <div>
              <Link className="btn btn-quiet" href="/beasiswa">
                Lihat katalog beasiswa
              </Link>
            </div>
          </div>
        ) : (
          <div className="grid-rows">
            {mendatang.map((r) => {
              const hari = sisaHari(r.tenggat);
              const mendesak = hari <= 7;
              return (
                <div
                  key={r.slug}
                  className="grid-row"
                  style={{
                    gridTemplateColumns: '1fr auto',
                    alignItems: 'start',
                    gap: 16,
                    padding: '15px 16px',
                    background: mendesak ? 'var(--color-warn-soft)' : undefined,
                  }}
                >
                  <div style={{ minWidth: 0 }}>
                    <p style={{ margin: 0, fontWeight: 600, fontSize: '0.9375rem' }}>{r.nama}</p>
                    <p className="small muted" style={{ margin: '3px 0 0' }}>
                      {r.penyelenggara} · {TIER_LABEL[r.tier] ?? r.tier}
                    </p>
                    <p className="small faint" style={{ margin: '6px 0 0' }}>
                      <span className="num">{tanggal(r.tenggat)}</span>
                      {r.buka !== null && <> · dibuka <span className="num">{tanggal(r.buka)}</span></>}
                    </p>
                    <div className="flex gap-3" style={{ marginTop: 8, flexWrap: 'wrap' }}>
                      {r.daftar && (
                        <a
                          className="small"
                          href={r.daftar}
                          target="_blank"
                          rel="noreferrer noopener"
                          style={{ fontWeight: 600, color: 'var(--color-accent)' }}
                        >
                          Halaman pendaftaran
                        </a>
                      )}
                      <a
                        className="small faint"
                        href={r.sumber}
                        target="_blank"
                        rel="noreferrer noopener"
                        style={{ textDecoration: 'underline', textUnderlineOffset: 3 }}
                      >
                        Sumber resmi
                      </a>
                    </div>
                  </div>

                  <div style={{ textAlign: 'right', flexShrink: 0 }}>
                    <p
                      className="num"
                      style={{
                        margin: 0,
                        fontSize: '1.35rem',
                        fontWeight: 640,
                        lineHeight: 1,
                        color: mendesak ? 'var(--color-warn)' : undefined,
                      }}
                    >
                      {hari <= 0 ? 'hari ini' : hari}
                    </p>
                    {hari > 0 && (
                      <p className="small faint" style={{ margin: '3px 0 0' }}>
                        hari lagi
                      </p>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </Section>

      {lewat.length > 0 && (
        <Section tight>
          <div className="flex items-baseline justify-between gap-3" style={{ marginBottom: 6 }}>
            <h2 className="h2">Sudah lewat</h2>
            <span className="small faint">{lewat.length} tahap</span>
          </div>
          <p className="small muted" style={{ margin: '0 0 14px', maxWidth: '54ch' }}>
            Disimpan sebagai riwayat supaya kamu bisa memperkirakan kapan siklus berikutnya dibuka.
          </p>

          {/* Disclosure: eleven closed rows should not push the useful part of
              the page out of reach. */}
          <details
            style={{
              border: '1px solid var(--color-line)',
              borderRadius: 'var(--radius-card)',
              background: 'var(--color-surface)',
              overflow: 'hidden',
            }}
          >
            <summary
              style={{
                padding: '14px 16px',
                cursor: 'pointer',
                fontSize: '0.9375rem',
                fontWeight: 560,
                display: 'flex',
                alignItems: 'center',
                gap: 8,
              }}
            >
              <Clock size={16} aria-hidden="true" />
              Tampilkan {lewat.length} tahap yang sudah tutup
            </summary>
            <div style={{ borderTop: '1px solid var(--color-line)' }}>
              {lewat.map((r) => (
                <div
                  key={r.slug}
                  className="grid-row"
                  style={{ borderTop: '1px solid var(--color-line)' }}
                >
                  <div style={{ minWidth: 0 }}>
                    <p style={{ margin: 0, fontSize: '0.875rem' }}>{r.nama}</p>
                    <p className="small faint" style={{ margin: '2px 0 0' }}>
                      {r.penyelenggara}
                    </p>
                  </div>
                  <span className="num small faint" style={{ flexShrink: 0 }}>
                    {tanggal(r.tenggat)}
                  </span>
                </div>
              ))}
            </div>
          </details>
        </Section>
      )}
    </>
  );
}