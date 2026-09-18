import Link from 'next/link';
import { ArrowRight } from '@phosphor-icons/react/dist/ssr/ArrowRight';
import { institutions, scholarships, seedsMeta } from '@/lib/data';
import { stageStatus } from '@/lib/match';
import { Section, SectionHead, Caveat, rp, tanggal } from '@/components/ui';

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
    <>
      {/* ------------------------------------------------------------- hero */}
      <div className="wrap" style={{ paddingTop: 32, paddingBottom: 20 }}>
        <div className="row" style={{ alignItems: 'center', gap: 28 }}>
          <div style={{ flex: 1, minWidth: 0 }}>
            <h1 style={{ fontSize: 26, lineHeight: 1.2, letterSpacing: '-0.025em', margin: '0 0 10px', fontWeight: 640 }}>
              Golongan 4 di kampusmu belum tentu sama artinya dengan golongan 4 di kampus lain.
            </h1>
            <p className="lede" style={{ margin: '0 0 22px', maxWidth: '48ch' }}>
              SakuKampus menilai kelayakan beasiswamu dari nominal rupiah UKT yang benar-benar kamu
              bayar.
            </p>
            <div className="chips" style={{ marginTop: 0 }}>
              <Link href="/cek" className="btn">
                Cek kelayakanku
                <ArrowRight size={15} aria-hidden="true" />
              </Link>
              <Link href="/beasiswa" className="btn btn-ghost">
                Lihat katalog
              </Link>
            </div>
          </div>

          {/* Real figures from KMA — two-column comparison card */}
          {a && b && (
            <div className="card" style={{ flex: '0 0 auto', minWidth: 260, maxWidth: 340 }}>
              <p className="tiny" style={{ margin: '0 0 12px', fontWeight: 600, color: 'var(--ink)' }}>
                Prodi Teknik Informatika, golongan 2
              </p>
              <div className="ukt-grid" style={{ marginBottom: 10 }}>
                <div className="ukt-cell" data-active="false">
                  <b>UIN Jakarta</b>
                  <span className="v mono">{rp(a.gol[1])}</span>
                </div>
                <div className="ukt-cell" data-active="false">
                  <b>UIN Malang</b>
                  <span className="v mono">{rp(b.gol[1])}</span>
                </div>
              </div>
              <p className="tiny" style={{ margin: 0, color: 'var(--ok)', lineHeight: 1.45 }}>
                Selisih 2,6 kali untuk golongan yang sama. Itu sebabnya penilaian memakai rupiah.
              </p>
            </div>
          )}
        </div>
      </div>

      {/* ------------------------------------------------------- comparison */}
      <Section>
        <SectionHead
          title="Cara penilaiannya"
          note="Empat aturan yang berlaku di seluruh aplikasi ini, bukan hanya di halaman penjelasan."
        />
        <div className="grouped">
          {[
            {
              n: '1',
              t: 'Beasiswa nasional dinilai dengan plafon rupiah',
              d: 'Syarat ditulis sebagai "UKT maksimal Rp2.400.000", bukan "golongan 1 sampai 4".',
            },
            {
              n: '2',
              t: 'Nomor golongan hanya sah untuk beasiswa satu kampus',
              d: 'Beasiswa internal UIN Jakarta boleh menyebut golongan, karena hanya berlaku di sana.',
            },
            {
              n: '3',
              t: 'Prioritas bukan syarat wajib',
              d: 'Kriteria bertanda prioritas dicatat sebagai catatan dan tidak pernah menggugurkan.',
            },
            {
              n: '4',
              t: 'Data kurang berarti perlu data, bukan tidak lolos',
              d: 'Kami tidak memberi vonis dari data yang belum kamu isi.',
            },
          ].map((row) => (
            <div key={row.n} className="card-tight row">
              <span className="badge" style={{ flexShrink: 0, borderRadius: '50%', width: 24, height: 24, padding: 0, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, background: 'var(--surface-2)', color: 'var(--ink-dim)' }}>
                {row.n}
              </span>
              <div>
                <p style={{ margin: '0 0 4px', fontWeight: 600, fontSize: 14 }}>{row.t}</p>
                <p className="tiny" style={{ margin: 0, lineHeight: 1.5 }}>{row.d}</p>
              </div>
            </div>
          ))}
        </div>
      </Section>

      {/* ----------------------------------------------------------- jadwal */}
      {buka.length > 0 && (
        <Section tight>
          <SectionHead
            title="Sedang dibuka"
            note={`Per ${tanggal(now)}. Tenggat lengkap ada di halaman jadwal.`}
            action={
              <Link className="tiny" href="/jadwal" style={{ fontWeight: 600, color: 'var(--accent)' }}>
                Semua jadwal
              </Link>
            }
          />
          <div className="chips" style={{ margin: 0, overflowX: 'auto', paddingBottom: 2 }}>
            {buka.map(({ s }) => (
              <article key={s.slug} className="card" style={{ minWidth: 260, flex: '0 0 auto' }}>
                <div className="row-between">
                  <h3 style={{ margin: 0, flex: 1, minWidth: 0 }}>{s.name}</h3>
                  <span className="badge badge-ok">Buka</span>
                </div>
                <p className="tiny" style={{ margin: '6px 0 0' }}>{s.provider}</p>
                {s.ukt_max_golongan !== undefined && (
                  <p className="tiny" style={{ margin: '8px 0 0', color: 'var(--ink)' }}>
                    Prioritas golongan 1 sampai {s.ukt_max_golongan} di kampus ini
                  </p>
                )}
                {s.ukt_max_idr !== undefined && (
                  <p className="tiny" style={{ margin: '4px 0 0', color: 'var(--ink)' }}>
                    Syarat UKT maksimal{' '}
                    <span className="mono" style={{ fontWeight: 600, color: 'var(--ink)' }}>
                      {rp(s.ukt_max_idr)}
                    </span>
                  </p>
                )}
                <Link
                  href="/cek"
                  className="tiny"
                  style={{ display: 'inline-flex', alignItems: 'center', gap: 4, marginTop: 12, fontWeight: 600, color: 'var(--accent)', textDecoration: 'none' }}
                >
                  Cek syaratku
                  <ArrowRight size={12} aria-hidden="true" />
                </Link>
              </article>
            ))}
          </div>
        </Section>
      )}

      {/* ---------------------------------------------------------- cakupan */}
      <Section tight>
        <SectionHead
          title="Cakupan data"
          note="Angka ini bergerak setiap kali dekrit UKT baru terbit atau jadwal beasiswa diperbarui."
        />
        <div className="grid-2">
          {[
            { k: 'Kampus terindeks', v: institutions.length.toLocaleString('id-ID'), s: 'PDDikti' },
            { k: 'Kampus dengan UKT per golongan', v: denganUkt.toLocaleString('id-ID'), s: 'KMA 204/2026' },
            { k: 'Baris prodi berdata UKT', v: Number(seedsMeta.ukt.prodi).toLocaleString('id-ID'), s: 'KMA 204/2026' },
            { k: 'Beasiswa dengan jadwal dan syarat', v: scholarships.length.toLocaleString('id-ID'), s: 'Pengumuman resmi' },
          ].map((row) => (
            <div key={row.k} className="card-tight row-between">
              <div>
                <p style={{ margin: 0, fontWeight: 600, fontSize: 14 }}>{row.k}</p>
                <p className="tiny" style={{ margin: '2px 0 0' }}>{row.s}</p>
              </div>
              <span className="mono" style={{ fontSize: 18, fontWeight: 620 }}>{row.v}</span>
            </div>
          ))}
        </div>

        <div style={{ marginTop: 16 }}>
          <Caveat>
            UKT baru terverifikasi penuh untuk <strong>{denganUkt} kampus</strong> (PTKIN di bawah
            Kementerian Agama). Untuk {institutions.length - denganUkt} kampus lain kamu tetap bisa
            memakai SakuKampus dengan memasukkan nominal UKT sendiri, dan hasilnya ditandai belum
            diverifikasi. Katalog kampus terakhir diperbarui {umurKatalog} hari lalu.
          </Caveat>
        </div>
      </Section>

      {/* ----------------------------------------------------------- CTA */}
      <Section tight>
        <div className="card">
          <h2 style={{ margin: '0 0 6px', fontSize: 17 }}>Kampusmu belum ada data UKT-nya?</h2>
          <p className="tiny" style={{ margin: '0 0 16px', maxWidth: '58ch', lineHeight: 1.55 }}>
            Isi nominal UKT yang kamu bayar sekarang. Perhitungannya jalan, hanya ditandai belum
            diverifikasi supaya kamu tahu bedanya.
          </p>
          <Link href="/cek" className="btn">
            Mulai dari kampusku
          </Link>
        </div>
      </Section>
    </>
  );
}