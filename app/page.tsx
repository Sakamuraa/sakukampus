import Link from 'next/link';
import { institutions, scholarships, seedsMeta } from '@/lib/data';
import { stageStatus } from '@/lib/match';

export const revalidate = 3600;

const rp = (n: number) => `Rp${n.toLocaleString('id-ID')}`;

export default function Home() {
  const now = Date.now();
  const denganUkt = institutions.filter((i) => i.ukt).length;
  const buka = scholarships
    .map((s) => ({ s, st: stageStatus(s, now) }))
    .filter((x) => x.st === 'buka');

  // Contoh nyata yang membuktikan §5: satu golongan, dua kampus, rupiah berbeda.
  const jakarta = institutions.find((i) => i.kode === '201001');
  const kampusContoh = jakarta?.ukt?.prodi.find((p) => p.prodi === 'Teknik Informatika');

  return (
    <>
      <h1>Cek beasiswa dari golongan UKT kampusmu.</h1>
      <p className="lede">
        Golongan 4 di satu kampus tidak sama artinya dengan golongan 4 di kampus lain. SakuKampus
        menghitung kelayakanmu dari <strong>nominal rupiah UKT</strong> kampusmu, bukan dari nomor
        golongan.
      </p>

      {kampusContoh && (
        <div className="card">
          <div className="row-between">
            <h3>Kenapa rupiah, bukan nomor golongan?</h3>
            <span className="badge badge-verified">contoh nyata</span>
          </div>
          <p className="tiny" style={{ marginTop: 6 }}>
            UIN Syarif Hidayatullah Jakarta · Teknik Informatika · KMA 204/2026
          </p>
          <div className="ukt-grid" style={{ marginTop: 10 }}>
            <div className="ukt-cell">
              <b>Golongan 2</b>
              <div className="v mono">{rp(kampusContoh.gol[1] ?? 0)}</div>
            </div>
            <div className="ukt-cell">
              <b>Golongan 4</b>
              <div className="v mono">{rp(kampusContoh.gol[3] ?? 0)}</div>
            </div>
            <div className="ukt-cell">
              <b>Golongan 7</b>
              <div className="v mono">{rp(kampusContoh.gol[6] ?? 0)}</div>
            </div>
            <div className="ukt-cell">
              <b>KIP Kuliah</b>
              <div className="v mono">{rp(kampusContoh.kip ?? 0)}</div>
            </div>
          </div>
          <p className="tiny" style={{ marginTop: 10 }}>
            Di UIN Malang, golongan 2 prodi yang sama hanya Rp1.653.000. Selisihnya hampir tiga kali.
            Beasiswa berplafon “UKT ≤ Rp2.400.000” adil untuk keduanya hanya kalau dibandingkan dalam
            rupiah.
          </p>
        </div>
      )}

      <h2>Mulai dari mana</h2>
      <div className="grid-2">
        <Link href="/cek" className="card card-tight">
          <h3>Cek kelayakan →</h3>
          <p className="tiny">Pilih kampus, prodi, dan golongan UKT-mu. Hasilnya per beasiswa.</p>
        </Link>
        <Link href="/beasiswa" className="card card-tight">
          <h3>Lihat katalog →</h3>
          <p className="tiny">
            {scholarships.length} beasiswa kampus, pemerintah, dan swasta — semua bertaut sumber.
          </p>
        </Link>
        <Link href="/jadwal" className="card card-tight">
          <h3>Jadwal &amp; tenggat →</h3>
          <p className="tiny">Tahapan tiap beasiswa, diurutkan dari tenggat terdekat.</p>
        </Link>
        <Link href="/data" className="card card-tight">
          <h3>Status data →</h3>
          <p className="tiny">Dari mana setiap angka berasal, dan kapan terakhir diperiksa.</p>
        </Link>
      </div>

      {buka.length > 0 && (
        <>
          <h2>Sedang dibuka</h2>
          <div className="stack">
            {buka.map(({ s }) => (
              <div key={s.slug} className="card card-tight">
                <div className="row-between">
                  <h3>{s.name}</h3>
                  <span className="badge">{s.tier}</span>
                </div>
                <p className="tiny" style={{ marginTop: 4 }}>{s.provider}</p>
                {s.ukt_max_idr && (
                  <p className="tiny" style={{ marginTop: 6 }}>
                    Syarat UKT: ≤ {rp(s.ukt_max_idr)}
                  </p>
                )}
                {s.ukt_max_golongan && (
                  <p className="tiny" style={{ marginTop: 6 }}>
                    Syarat UKT: prioritas golongan 1–{s.ukt_max_golongan} (khusus kampus ini)
                  </p>
                )}
              </div>
            ))}
          </div>
        </>
      )}

      <div className="divider" />

      <h2>Cakupan data saat ini</h2>
      <div className="grid-2">
        <div className="card card-tight">
          <b className="mono">{(institutions.length).toLocaleString('id-ID')}</b>
          <p className="tiny">kampus terindeks dari PDDikti</p>
        </div>
        <div className="card card-tight">
          <b className="mono">{denganUkt}</b>
          <p className="tiny">kampus dengan nominal UKT per golongan</p>
        </div>
        <div className="card card-tight">
          <b className="mono">{(seedsMeta.ukt.prodi as number).toLocaleString('id-ID')}</b>
          <p className="tiny">baris prodi dari {seedsMeta.ukt.decree as string}</p>
        </div>
        <div className="card card-tight">
          <b className="mono">{scholarships.length}</b>
          <p className="tiny">beasiswa dengan jadwal &amp; syarat</p>
        </div>
      </div>

      <div className="notice" style={{ marginTop: 16 }}>
        UKT baru terverifikasi lengkap untuk <strong>{denganUkt} kampus</strong> (PTKIN di bawah
        Kementerian Agama). Untuk kampus lain, kamu tetap bisa memakai SakuKampus dengan memasukkan
        nominal UKT-mu sendiri — hasilnya ditandai “belum diverifikasi”.
      </div>
    </>
  );
}