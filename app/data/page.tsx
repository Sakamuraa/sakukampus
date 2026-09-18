import type { Metadata } from 'next';
import { institutions, scholarships, seedsMeta } from '@/lib/data';
import { Section, Caveat, tanggal } from '@/components/ui';

export const revalidate = 600;

export const metadata: Metadata = {
  title: 'Status data dan sumber',
  description:
    'Asal setiap angka di SakuKampus: katalog kampus, tabel UKT, dan jadwal beasiswa, lengkap dengan tanggal dan keterbatasannya.',
};

const n = (x: unknown) => Number(x).toLocaleString('id-ID');

export default function DataPage() {
  const denganUkt = institutions.filter((i) => i.ukt);
  const tanpaUkt = institutions.length - denganUkt.length;
  const lengkap = Number(seedsMeta.ukt.prodiGolonganLengkap);
  const totalProdi = Number(seedsMeta.ukt.prodi);
  const sebagian = totalProdi - lengkap;

  return (
    <>
      <Section tight>
        <h1 className="h1" style={{ fontSize: 'clamp(1.5rem, 4.5vw, 2.1rem)' }}>
          Status data dan sumber
        </h1>
        <p className="lede" style={{ marginTop: 10, maxWidth: '56ch' }}>
          Halaman ini menyebutkan asal setiap angka di aplikasi, kapan terakhir diambil, dan apa
          yang masih belum lengkap.
        </p>
      </Section>

      {/* ------------------------------------------------- katalog kampus */}
      <Section tight>
        <h2 className="h2">Katalog kampus</h2>
        <div className="grid-rows" style={{ marginTop: 14 }}>
          <Row k="Kampus terindeks" v={n(seedsMeta.institutions.count)} />
          <Row k="Diambil" v={tanggal(seedsMeta.institutions.generated_at as string)} />
          <Row k="Sumber" v="api-pddikti.kemdiktisaintek.go.id" mono />
        </div>
        <p className="small muted" style={{ margin: '12px 0 0', maxWidth: '66ch' }}>
          API PDDikti tidak berdokumentasi resmi dan mensyaratkan header <code>Origin</code> yang
          tepat. Paginasi di sisi server juga diabaikan, jadi katalog disusun lewat penelusuran per
          kata kunci. Hasilnya disimpan sebagai berkas di repositori supaya situs tetap jalan walau
          API itu berubah.
        </p>
      </Section>

      {/* ------------------------------------------------------------ UKT */}
      <Section tight>
        <h2 className="h2">Nominal UKT per golongan</h2>
        <div className="grid-rows" style={{ marginTop: 14 }}>
          <Row k="Dekrit" v={String(seedsMeta.ukt.decree)} />
          <Row k="Tahun akademik" v={String(seedsMeta.ukt.academic_year)} />
          <Row k="PTKIN tercakup" v={n(seedsMeta.ukt.ptkin)} />
          <Row k="Baris prodi" v={n(seedsMeta.ukt.prodi)} />
          <Row k="Golongan lengkap 1 sampai 7" v={n(lengkap)} />
          <Row k="Kampus dengan data UKT" v={n(denganUkt.length)} emphasised />
        </div>

        <div style={{ marginTop: 16, display: 'grid', gap: 12 }}>
          <div
            className="card"
            style={{
              display: 'grid',
              gap: 8,
              background: 'var(--color-accent-soft)',
              borderColor: 'transparent',
            }}
          >
            <p style={{ margin: 0, fontWeight: 620, color: 'var(--color-ok)' }}>
              Nomor golongan tidak sebanding antar kampus
            </p>
            <p className="small" style={{ margin: 0, color: 'var(--color-ok)', maxWidth: '66ch' }}>
              Golongan 2 di UIN Jakarta setara Rp4.270.000, sementara di UIN Malang Rp1.653.000.
              Karena itu beasiswa lintas kampus dinilai memakai plafon rupiah, dan nomor golongan
              hanya dipakai untuk beasiswa yang memang terikat satu kampus.
            </p>
          </div>
        </div>
      </Section>

      {/* -------------------------------------------------------- beasiswa */}
      <Section tight>
        <h2 className="h2">Beasiswa</h2>
        <div className="grid-rows" style={{ marginTop: 14 }}>
          <Row k="Entri" v={n(scholarships.length)} />
          <Row
            k="Dari sumber resmi penyelenggara"
            v={n(scholarships.filter((s) => s.source_kind === 'resmi').length)}
          />
          <Row
            k="Dari agregator"
            v={n(scholarships.filter((s) => s.source_kind === 'agregator').length)}
          />
          <Row
            k="Pemeriksaan terakhir"
            v={tanggal(scholarships[0]?.last_verified_at ?? new Date().toISOString())}
          />
        </div>
        <p className="small muted" style={{ margin: '12px 0 0', maxWidth: '66ch' }}>
          Data dari agregator tidak pernah menimpa data dari sumber resmi, dan selalu ditandai dengan
          tingkat keyakinan yang lebih rendah pada kartunya.
        </p>
      </Section>

      {/* ------------------------------------------------------ keterbatasan */}
      <Section tight>
        <h2 className="h2">Yang masih belum lengkap</h2>
        <p className="small muted" style={{ margin: '8px 0 14px', maxWidth: '60ch' }}>
          Disebutkan terbuka supaya kamu tahu batas keandalan tiap angka, bukan supaya kamu percaya
          begitu saja.
        </p>

        <div style={{ display: 'grid', gap: 12 }}>
          <Caveat>
            {n(tanpaUkt)} dari {n(institutions.length)} kampus belum punya tabel UKT terverifikasi.
            Untuk kampus itu kamu bisa mengisi nominal UKT sendiri, dan hasilnya ditandai belum
            diverifikasi.
          </Caveat>
          <Caveat>
            {n(sebagian)} dari {n(totalProdi)} baris prodi hanya mencantumkan sebagian golongan di
            dekrit, umumnya di PTKIN kecil. Sel yang tidak ada dibiarkan kosong, bukan diisi angka
            karangan.
          </Caveat>
          <Caveat>
            Sebagian blok PTKIN di dekrit memakai nama yang berbeda dari katalog PDDikti, sehingga
            belum semuanya terpasang otomatis. Blok itu tetap tersimpan dan ditandai belum
            terpasangkan.
          </Caveat>
        </div>
      </Section>

      {/* ------------------------------------------------------------- api */}
      <Section tight>
        <h2 className="h2">API publik</h2>
        <p className="small muted" style={{ margin: '8px 0 14px', maxWidth: '60ch' }}>
          Semua data yang dipakai halaman ini tersedia lewat API yang sama, tanpa kunci dan tanpa
          pembatasan khusus di luar pembatasan laju per alamat IP.
        </p>
        <div className="grid-rows">
          {[
            ['/api/v1/institutions', 'Cari kampus, atau ambil detail satu kampus beserta tabel UKT'],
            ['/api/v1/scholarships', 'Katalog beasiswa dengan jadwal dan syarat'],
            ['/api/v1/calendar', 'Semua tenggat, terurut'],
            ['/api/v1/meta/sources', 'Halaman ini dalam bentuk JSON'],
            ['/api/v1/eligibility/check', 'Periksa kelayakan, metode POST'],
          ].map(([path, desc]) => (
            <div
              key={path}
              className="grid-row"
              style={{ gridTemplateColumns: '1fr', gap: 4 }}
            >
              <code className="num small" style={{ fontWeight: 600 }}>
                {path}
              </code>
              <span className="small muted">{desc}</span>
            </div>
          ))}
        </div>
      </Section>
    </>
  );
}

function Row({ k, v, mono, emphasised }: { k: string; v: string; mono?: boolean; emphasised?: boolean }) {
  return (
    <div className="grid-row" data-emph={emphasised || undefined}>
      <span className="muted">{k}</span>
      <span className={mono ? 'num small' : 'num'} style={{ fontWeight: 600, textAlign: 'right' }}>
        {v}
      </span>
    </div>
  );
}