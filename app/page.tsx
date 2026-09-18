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
      {/* ------------------------------------------------------------- hero
          Asymmetric split with real-time comparison. Mobile-first: stack 
          vertically with generous spacing. Desktop: side-by-side. */}
      <section className="min-h-[100dvh] flex items-center py-12 md:py-24">
        <div className="shell">
          <div className="grid gap-12 lg:grid-cols-[minmax(0,1fr)_minmax(0,0.92fr)] lg:items-center">
            <div>
              <h1 className="h1">
                Golongan 4 di kampusmu belum tentu sama artinya dengan golongan 4 di kampus lain.
              </h1>
              <p className="lede mt-4 max-w-[46ch]">
                SakuKampus menilai kelayakan beasiswamu dari nominal rupiah UKT yang benar-benar kamu
                bayar.
              </p>
              <div className="flex flex-wrap gap-3 mt-8">
                <Link href="/cek" className="btn btn-primary">
                  Cek kelayakanku
                  <ArrowRight size={16} weight="bold" aria-hidden="true" />
                </Link>
                <Link href="/beasiswa" className="btn btn-quiet">
                  Lihat katalog
                </Link>
              </div>
            </div>

            {/* Real figures from KMA 204/2026, rendered as a high-contrast card. */}
            {a && b && (
              <div className="relative group">
                <div className="absolute inset-0 bg-gradient-to-br from-sky-500/10 to-emerald-500/10 rounded-2xl blur-xl opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                <div className="relative bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl overflow-hidden shadow-sm hover:shadow-md transition-shadow">
                  <div className="px-5 py-4 border-b border-zinc-100 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-900/50">
                    <p className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
                      Prodi Teknik Informatika, golongan 2
                    </p>
                  </div>

                  <div className="grid grid-cols-2 divide-x divide-zinc-100 dark:divide-zinc-800">
                    <div className="p-5">
                      <p className="text-xs font-medium text-zinc-500 mb-1.5">UIN Jakarta</p>
                      <p className="text-2xl font-bold text-zinc-900 dark:text-zinc-100 tabular-nums">
                        {rp(a.gol[1])}
                      </p>
                    </div>
                    <div className="p-5">
                      <p className="text-xs font-medium text-zinc-500 mb-1.5">UIN Malang</p>
                      <p className="text-2xl font-bold text-zinc-900 dark:text-zinc-100 tabular-nums">
                        {rp(b.gol[1])}
                      </p>
                    </div>
                  </div>

                  <div className="px-5 py-3 bg-emerald-50/50 dark:bg-emerald-900/10 border-t border-emerald-100 dark:border-emerald-900/30">
                    <p className="text-xs text-emerald-700 dark:text-emerald-400 font-medium">
                      Selisih 2,6 kali untuk golongan yang sama. Itu sebabnya penilaian memakai rupiah.
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* ------------------------------------------------------- comparison
          Grouped rows, not a card per row: the reader is comparing three
          numbers, so elevation would add nothing. */}
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
            <div
              key={row.n}
              className="flex gap-4 p-4 hover:bg-zinc-50/50 dark:hover:bg-zinc-800/30 transition-colors"
            >
              <span className="flex-shrink-0 w-6 h-6 rounded-full bg-zinc-100 dark:bg-zinc-800 text-zinc-500 dark:text-zinc-400 text-xs font-bold flex items-center justify-center">
                {row.n}
              </span>
              <div>
                <p className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">{row.t}</p>
                <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1 leading-relaxed">
                  {row.d}
                </p>
              </div>
            </div>
          ))}
        </div>
      </Section>

      {/* ----------------------------------------------------------- jadwal
          Horizontal snap rail on mobile, two-column on desktop. This is where
          the mobile-first affordance actually earns its place. */}
      {buka.length > 0 && (
        <Section tight>
          <SectionHead
            title="Sedang dibuka"
            note={`Per ${tanggal(now)}. Tenggat lengkap ada di halaman jadwal.`}
            action={
              <Link className="text-sm font-semibold text-sky-600 dark:text-sky-400 hover:underline" href="/jadwal">
                Semua jadwal
              </Link>
            }
          />
          <div className="rail">
            {buka.map(({ s }) => (
              <article key={s.slug} className="card min-w-[280px] snap-start hover:border-sky-200 dark:hover:border-sky-800 transition-colors group">
                <div className="flex items-start justify-between gap-3">
                  <h3 className="text-base font-semibold text-zinc-900 dark:text-zinc-100 group-hover:text-sky-600 dark:group-hover:text-sky-400 transition-colors">{s.name}</h3>
                  <span className="badge badge-ok">Buka</span>
                </div>
                <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1.5">
                  {s.provider}
                </p>
                {s.ukt_max_golongan !== undefined && (
                  <p className="text-xs mt-3 text-zinc-700 dark:text-zinc-300">
                    Prioritas golongan 1 sampai {s.ukt_max_golongan} di kampus ini
                  </p>
                )}
                {s.ukt_max_idr !== undefined && (
                  <p className="text-xs mt-3 text-zinc-700 dark:text-zinc-300">
                    Syarat UKT maksimal <span className="font-mono font-semibold">{rp(s.ukt_max_idr)}</span>
                  </p>
                )}
                <Link
                  href="/cek"
                  className="inline-flex items-center gap-1.5 text-xs font-semibold text-sky-600 dark:text-sky-400 mt-4 group-hover:translate-x-1 transition-transform"
                >
                  Cek syaratku
                  <ArrowRight size={12} weight="bold" aria-hidden="true" />
                </Link>
              </article>
            ))}
          </div>
        </Section>
      )}

      {/* ---------------------------------------------------------- cakupan
          Numbers get a small labelled list instead of four identical tiles.
          Three-equal-cards is the default this project deliberately avoids. */}
      <Section tight>
        <SectionHead
          title="Cakupan data"
          note="Angka ini bergerak setiap kali dekrit UKT baru terbit atau jadwal beasiswa diperbarui."
        />
        <div className="grid gap-x-8 gap-y-0 md:grid-cols-2">
          {[
            { k: 'Kampus terindeks', v: institutions.length.toLocaleString('id-ID'), s: 'PDDikti' },
            {
              k: 'Kampus dengan UKT per golongan',
              v: denganUkt.toLocaleString('id-ID'),
              s: 'KMA 204/2026',
            },
            {
              k: 'Baris prodi berdata UKT',
              v: Number(seedsMeta.ukt.prodi).toLocaleString('id-ID'),
              s: 'KMA 204/2026',
            },
            {
              k: 'Beasiswa dengan jadwal dan syarat',
              v: scholarships.length.toLocaleString('id-ID'),
              s: 'Pengumuman resmi',
            },
          ].map((row) => (
            <div
              key={row.k}
              className="flex items-baseline justify-between gap-4 py-3.5 border-b border-zinc-100 dark:border-zinc-800"
            >
              <div>
                <p className="text-sm text-zinc-900 dark:text-zinc-100">{row.k}</p>
                <p className="text-xs text-zinc-400 mt-0.5">{row.s}</p>
              </div>
              <p className="text-lg font-bold text-zinc-900 dark:text-zinc-100 tabular-nums">
                {row.v}
              </p>
            </div>
          ))}
        </div>

        <div className="mt-6">
          <Caveat>
            UKT baru terverifikasi penuh untuk <strong>{denganUkt} kampus</strong> (PTKIN di bawah
            Kementerian Agama). Untuk {institutions.length - denganUkt} kampus lain kamu tetap bisa
            memakai SakuKampus dengan memasukkan nominal UKT sendiri, dan hasilnya ditandai belum
            diverifikasi. Katalog kampus terakhir diperbarui {umurKatalog} hari lalu.
          </Caveat>
        </div>
      </Section>

      <Section tight>
        <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl p-6 shadow-sm">
          <div>
            <h2 className="text-xl font-bold text-zinc-900 dark:text-zinc-100">Kampusmu belum ada data UKT-nya?</h2>
            <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-2 max-w-[58ch]">
              Isi nominal UKT yang kamu bayar sekarang. Perhitungannya jalan, hanya ditandai belum
              diverifikasi supaya kamu tahu bedanya.
            </p>
          </div>
          <div className="mt-5">
            <Link href="/cek" className="btn btn-primary">
              Mulai dari kampusku
            </Link>
          </div>
        </div>
      </Section>
    </>
  );
}