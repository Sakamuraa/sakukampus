import Link from 'next/link';
import { ArrowRight } from '@phosphor-icons/react/dist/ssr/ArrowRight';
import { institutions, scholarships, seedsMeta } from '@/lib/data';
import { stageStatus } from '@/lib/match';
import { rp, tanggal } from '@/components/ui';

export const revalidate = 3600;

export default function Home() {
  const now = Date.now();
  const denganUkt = institutions.filter((i) => i.ukt).length;

  const jakarta = institutions.find((i) => i.kode === '201001')?.ukt;
  const malang = institutions.find((i) => i.kode === '201003')?.ukt;

  const ti = (pt: typeof jakarta) => pt?.prodi.find((p) => p.prodi === 'Teknik Informatika');
  const a = ti(jakarta);
  const b = ti(malang);

  const buka = scholarships
    .map((s) => ({ s, st: stageStatus(s, now) }))
    .filter((x) => x.st === 'buka')
    .slice(0, 4);

  const umurKatalog = Math.floor(
    (now - Date.parse(seedsMeta.institutions.generated_at as string)) / 86_400_000,
  );

  return (
    <div className="wrap">
      <main>
        {/* ------------------------------------------------------- HERO */}
        <section className="hero">
          <div style={{ display: 'grid', gap: 32, alignItems: 'center' }}>
            <div>
              <h1 className="hero-title">
                UKT riil. Beasiswa cocok.
              </h1>
              <p className="hero-sub">
                SakuKampus menilai kelayakan beasiswamu dari nominal rupiah UKT yang benar-benar kamu bayar.
              </p>
              <div className="hero-actions">
                <Link href="/cek" className="btn">
                  Cek kelayakanku
                  <ArrowRight size={16} weight="bold" aria-hidden="true" />
                </Link>
                <Link href="/beasiswa" className="btn btn-ghost">
                  Lihat katalog
                </Link>
              </div>
            </div>

            {/* Comparison visual */}
            {a && b && (
              <div className="hero-visual">
                <div className="hero-visual-header">
                  Prodi Teknik Informatika · Golongan 2
                </div>
                <div className="hero-visual-body">
                  <div className="hero-visual-cell">
                    <div className="hero-visual-label">UIN Jakarta</div>
                    <div className="hero-visual-value">{rp(a.gol[1])}</div>
                  </div>
                  <div className="hero-visual-cell">
                    <div className="hero-visual-label">UIN Malang</div>
                    <div className="hero-visual-value">{rp(b.gol[1])}</div>
                  </div>
                </div>
                <div className="hero-visual-footer">
                  Selisih 2,6× untuk golongan yang sama. Penilaian memakai rupiah.
                </div>
              </div>
            )}
          </div>
        </section>

        {/* ------------------------------------------------------- RULES */}
        <section className="section">
          <div className="section-head">
            <span className="section-title">Cara penilaiannya</span>
          </div>
          <div className="grouped">
            {[
              { n: '1', t: 'Beasiswa nasional dinilai dengan plafon rupiah', d: "Syarat ditulis sebagai 'UKT maksimal Rp2.400.000', bukan 'golongan 1 sampai 4'." },
              { n: '2', t: 'Nomor golongan hanya sah untuk beasiswa satu kampus', d: "Beasiswa internal UIN Jakarta boleh menyebut golongan, karena hanya berlaku di sana." },
              { n: '3', t: 'Prioritas bukan syarat wajib', d: 'Kriteria bertanda prioritas dicatat sebagai catatan dan tidak pernah menggugurkan.' },
              { n: '4', t: 'Data kurang berarti perlu data, bukan tidak lolos', d: 'Kami tidak memberi vonis dari data yang belum kamu isi.' },
            ].map((row) => (
              <div key={row.n} className="card-tight flex items-center gap-3">
                <span className="badge" style={{ minWidth: 28, justifyContent: 'center', background: 'var(--surface-2)', color: 'var(--ink-dim)' }}>
                  {row.n}
                </span>
                <div>
                  <div style={{ fontWeight: 600, fontSize: 14, color: 'var(--ink)' }}>{row.t}</div>
                  <div className="tiny" style={{ marginTop: 2 }}>{row.d}</div>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* ------------------------------------------------------- OPEN SCHOLARSHIPS */}
        {buka.length > 0 && (
          <section className="section-tight">
            <div className="section-head">
              <div>
                <span className="section-title">Sedang dibuka</span>
                <p className="tiny faint" style={{ marginTop: 3 }}>Per {tanggal(now)}. Tenggat lengkap di halaman jadwal.</p>
              </div>
              <Link href="/jadwal" className="tiny" style={{ fontWeight: 600, color: 'var(--accent)', textDecoration: 'none' }}>
                Semua jadwal →
              </Link>
            </div>
            <div className="rail">
              {buka.map(({ s }) => (
                <article key={s.slug} className="card" style={{ minWidth: 270, maxWidth: 300, flex: '0 0 auto' }}>
                  <div className="row-between" style={{ marginBottom: 8 }}>
                    <h3 style={{ margin: 0, flex: 1, minWidth: 0, fontSize: 14 }}>{s.name}</h3>
                    <span className="badge badge-ok">Buka</span>
                  </div>
                  <p className="tiny" style={{ margin: '0 0 8px' }}>{s.provider}</p>
                  {s.ukt_max_golongan !== undefined && (
                    <p className="tiny" style={{ color: 'var(--ink-dim)', margin: '0 0 4px' }}>
                      Prioritas gol. 1–{s.ukt_max_golongan}
                    </p>
                  )}
                  {s.ukt_max_idr !== undefined && (
                    <p className="tiny" style={{ color: 'var(--ink-dim)', margin: '0 0 10px' }}>
                      Plafon UKT <span className="mono" style={{ color: 'var(--ink)', fontWeight: 600 }}>{rp(s.ukt_max_idr)}</span>
                    </p>
                  )}
                  <Link href="/cek" className="tiny" style={{ display: 'inline-flex', alignItems: 'center', gap: 4, fontWeight: 600, color: 'var(--accent)', textDecoration: 'none' }}>
                    Cek syaratku <ArrowRight size={11} aria-hidden="true" />
                  </Link>
                </article>
              ))}
            </div>
          </section>
        )}

        {/* ------------------------------------------------------- COVERAGE */}
        <section className="section-tight">
          <div className="section-head">
            <div>
              <span className="section-title">Cakupan data</span>
              <p className="tiny faint" style={{ marginTop: 3 }}>Angka diperbarui setiap kali dekrit UKT atau jadwal baru terbit.</p>
            </div>
          </div>
          <div className="stat-list">
            {[
              { k: 'Kampus terindeks', v: institutions.length.toLocaleString('id-ID'), s: 'PDDikti' },
              { k: 'Kampus berdata UKT', v: denganUkt.toLocaleString('id-ID'), s: 'KMA 204/2026' },
              { k: 'Baris prodi berdata UKT', v: Number(seedsMeta.ukt.prodi).toLocaleString('id-ID'), s: 'KMA 204/2026' },
              { k: 'Beasiswa tersimpan', v: scholarships.length.toLocaleString('id-ID'), s: 'Pengumuman resmi' },
            ].map((row) => (
              <div key={row.k} className="stat-row">
                <div>
                  <div className="stat-label">{row.k}</div>
                  <div className="stat-source">{row.s}</div>
                </div>
                <div className="stat-value">{row.v}</div>
              </div>
            ))}
          </div>
          <p className="tiny faint" style={{ marginTop: 12, lineHeight: 1.55 }}>
            UKT terverifikasi penuh untuk <strong style={{ color: 'var(--ink-dim)' }}>{denganUkt} kampus</strong> (PTKIN Kemenag).{' '}
            {institutions.length - denganUkt} kampus lain masih bisa dipakai dengan input manual. Katalog terakhir diperbarui {umurKatalog} hari lalu.
          </p>
        </section>

        {/* ------------------------------------------------------- CTA */}
        <section className="section-tight">
          <div className="card" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 20, flexWrap: 'wrap' }}>
            <div>
              <h2 style={{ margin: '0 0 4px', fontSize: 17 }}>Kampusmu belum ada data UKT?</h2>
              <p className="tiny" style={{ margin: 0, color: 'var(--ink-dim)', maxWidth: '48ch' }}>
                Isi nominal UKT yang kamu bayar. Perhitungannya jalan, hasilnya ditandai belum diverifikasi.
              </p>
            </div>
            <Link href="/cek" className="btn">
              Mulai dari kampusku
            </Link>
          </div>
        </section>
      </main>

      {/* Sticky CTA bar for mobile */}
      <div className="cta-bar" style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
        <Link href="/cek" className="btn" style={{ flex: 1 }}>
          Cek kelayakanku
        </Link>
        <Link href="/beasiswa" className="btn btn-ghost" style={{ flex: 1 }}>
          Lihat katalog
        </Link>
      </div>
    </div>
  );
}