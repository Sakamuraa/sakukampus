import type { Metadata } from 'next';
import { institutions, scholarships, seedsMeta } from '@/lib/data';

export const revalidate = 600;

export const metadata: Metadata = {
  title: 'Status data & sumber',
  description:
    'Dari mana setiap angka di SakuKampus berasal: katalog kampus, tabel UKT, dan jadwal beasiswa — lengkap dengan tanggal dan catatan keterbatasannya.',
};

const tgl = (s: string) => new Date(s).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' });
const n = (x: unknown) => Number(x).toLocaleString('id-ID');

export default function DataPage() {
  const denganUkt = institutions.filter((i) => i.ukt);
  const tanpaUkt = institutions.length - denganUkt.length;

  return (
    <>
      <h1>Status data &amp; sumber</h1>
      <p className="lede">
        Aplikasi ini tidak meminta kamu percaya begitu saja. Setiap bagian di bawah menyebutkan asal
        datanya, kapan terakhir diambil, dan apa yang belum lengkap.
      </p>

      <div className="card">
        <h3>Katalog kampus</h3>
        <p className="tiny" style={{ marginTop: 6 }}>
          Sumber: <span className="mono">{seedsMeta.institutions.source as string}</span>
        </p>
        <div className="grid-2" style={{ marginTop: 10 }}>
          <div className="ukt-cell">
            <b>Kampus terindeks</b>
            <div className="v mono">{n(seedsMeta.institutions.count)}</div>
          </div>
          <div className="ukt-cell">
            <b>Diambil</b>
            <div className="v" style={{ fontSize: 14 }}>{tgl(seedsMeta.institutions.generated_at as string)}</div>
          </div>
        </div>
        <p className="tiny" style={{ marginTop: 10 }}>
          Metode: {seedsMeta.institutions.method as string}
        </p>
        <div className="notice" style={{ marginTop: 12 }}>
          API PDDikti tidak berdokumentasi resmi dan mensyaratkan header <span className="mono">Origin</span> yang
          tepat. Katalog disimpan sebagai berkas di repositori, jadi situs tetap jalan walau API itu berubah.
        </div>
      </div>

      <div className="card">
        <h3>Nominal UKT per golongan</h3>
        <p className="tiny" style={{ marginTop: 6 }}>
          Sumber: <span className="mono">{seedsMeta.ukt.source_url as string}</span>
        </p>
        <div className="grid-2" style={{ marginTop: 10 }}>
          <div className="ukt-cell">
            <b>Dekrit</b>
            <div className="v" style={{ fontSize: 14 }}>{seedsMeta.ukt.decree as string}</div>
          </div>
          <div className="ukt-cell">
            <b>Tahun akademik</b>
            <div className="v" style={{ fontSize: 14 }}>{seedsMeta.ukt.academic_year as string}</div>
          </div>
          <div className="ukt-cell">
            <b>PTKIN</b>
            <div className="v mono">{n(seedsMeta.ukt.ptkin)}</div>
          </div>
          <div className="ukt-cell">
            <b>Baris prodi</b>
            <div className="v mono">{n(seedsMeta.ukt.prodi)}</div>
          </div>
          <div className="ukt-cell">
            <b>Golongan lengkap 1–7</b>
            <div className="v mono">{n(seedsMeta.ukt.prodiGolonganLengkap)}</div>
          </div>
          <div className="ukt-cell">
            <b>Kampus dengan UKT</b>
            <div className="v mono">{denganUkt.length}</div>
          </div>
        </div>
        <p className="tiny" style={{ marginTop: 12 }}>
          <strong>Nomor golongan tidak sebanding antar kampus.</strong> Golongan 2 di UIN Jakarta
          setara Rp4.270.000, sementara di UIN Malang Rp1.653.000. Karena itu beasiswa nasional
          dinilai memakai plafon rupiah, dan nomor golongan hanya dipakai untuk beasiswa yang memang
          terikat satu kampus.
        </p>
      </div>

      <div className="card">
        <h3>Beasiswa</h3>
        <div className="grid-2" style={{ marginTop: 10 }}>
          <div className="ukt-cell">
            <b>Entri</b>
            <div className="v mono">{n(scholarships.length)}</div>
          </div>
          <div className="ukt-cell">
            <b>Sumber resmi</b>
            <div className="v mono">{n(scholarships.filter((s) => s.source_kind === 'resmi').length)}</div>
          </div>
          <div className="ukt-cell">
            <b>Agregator</b>
            <div className="v mono">{n(scholarships.filter((s) => s.source_kind === 'agregator').length)}</div>
          </div>
          <div className="ukt-cell">
            <b>Terverifikasi</b>
            <div className="v" style={{ fontSize: 14 }}>{tgl(scholarships[0]?.last_verified_at ?? new Date().toISOString())}</div>
          </div>
        </div>
        <p className="tiny" style={{ marginTop: 12 }}>
          Data dari agregator tidak pernah menimpa data dari sumber resmi, dan ditandai dengan tingkat
          keyakinan lebih rendah.
        </p>
      </div>

      <div className="card">
        <h3>Yang belum lengkap — dikatakan terang-terangan</h3>
        <ul className="reasons">
          <li data-ok="false">
            <span className="m">×</span>
            <span>
              {n(tanpaUkt)} dari {n(institutions.length)} kampus belum punya tabel UKT terverifikasi.
              Untuk kampus-kampus itu, kamu bisa mengisi nominal UKT sendiri dan hasilnya ditandai
              “belum diverifikasi”.
            </span>
          </li>
          <li data-ok="false">
            <span className="m">×</span>
            <span>
              Sebagian baris UKT hanya mencantumkan sebagian golongan di dekrit (terjadi pada PTKIN
              kecil). Nilai yang tidak ada dibiarkan kosong, tidak dikarang.
            </span>
          </li>
          <li data-ok="false">
            <span className="m">×</span>
            <span>
              Untuk beberapa kampus, nama pada dekrit UKT berbeda dengan nama pada katalog sehingga
              belum terpasang otomatis.
            </span>
          </li>
        </ul>
      </div>
    </>
  );
}