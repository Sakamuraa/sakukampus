# SakuKampus

Katalog beasiswa Indonesia + pemeriksa kelayakan berdasarkan **golongan UKT kampus masing-masing**.

Web app Next.js (App Router). Data diambil dari sumber resmi dan setiap fakta
menempel pada `source_url` + `last_verified_at`, tidak ada angka tanpa asal.

---

## Kenapa ini bukan sekadar daftar beasiswa

Golongan UKT **tidak sebanding antar kampus.** Angka nyata dari KMA 204/2026:

| Kampus (prodi Teknik Informatika) | Golongan 2 | Golongan 7 |
|---|---|---|
| UIN Syarif Hidayatullah Jakarta | Rp4.270.000 | Rp9.000.000 |
| UIN Maulana Malik Ibrahim Malang | Rp1.653.000 | Rp9.719.000 |
| STAIN Majene (hanya 3 golongan) | Rp1.250.000 | — |

Beasiswa bersyarat "prioritas UKT golongan 1–4" akan menerima mahasiswa UIN Jakarta golongan 4
(Rp5.150.000) sekaligus menolak mahasiswa kampus lain dengan UKT Rp2.000.000. Itu bukan penyaringan
yang adil, itu bug.

**Karena itu aturannya:**

1. Beasiswa **nasional** wajib menyatakan syarat UKT dalam **rupiah** (`ukt_max_idr`).
2. Nomor golongan (`ukt_max_golongan`) hanya sah untuk beasiswa yang **terikat satu kampus**
   (`scope = "kampus:<kode_pt>"`).
3. Kriteria ber-`soft` (mis. "prioritas golongan 1–4") hanya jadi catatan, **tidak pernah**
   menggugurkan pendaftar.
4. Data yang belum ada menghasilkan verdict **`perlu_data`**, tidak pernah "tidak lolos".

Aturan ini ditegakkan kode: `lib/eligibility/engine.ts`, dan diuji di
`lib/match.test.ts`, termasuk satu tes regresi yang membandingkan golongan yang sama di dua
kampus dan menuntut hasil berbeda.

---

## Sumber data

| Data | Sumber |
|---|---|
| Katalog kampus (3.690 PT) | `api-pddikti.kemdiktisaintek.go.id` |
| Nominal UKT per golongan (58 PTKIN) | KMA 204/2026, PDF 82 halaman |
| Jadwal & syarat beasiswa | pengumuman resmi (KIP Kuliah, Djarum, YBR BRILiaN, STF UIN, BIB Kemenag–LPDP) |

Keterbatasan diakui terbuka di halaman `/data` di dalam aplikasi, bukan hanya di README.

---

## Quick Start

```bash
npm install
npm test        # 61 tes: parser KMA, engine, pencocokan, data
npm run typecheck
npm run dev     # http://localhost:3000
```

---

## Struktur

```
app/                     halaman + API route (Next.js App Router)
  api/v1/                institutions · scholarships · eligibility/check · calendar · meta/sources
  cek/                   pemeriksa kelayakan (client)
  beasiswa/  jadwal/  data/
lib/
  pddikti.ts             klien PDDikti (header Origin wajib)
  kma-ukt.ts             parser KMA berbasis koordinat + konversi golongan→rupiah
  eligibility/engine.ts  rule JSON: all/any/not + soft + onlyWhen
  match.ts               pencocokan beasiswa ↔ (kampus, prodi, golongan)
  data.ts                pembacaan seed + pencarian kampus
data/
  institutions.seed.json  3.690 kampus (PDDikti)
  ukt-ptkin.seed.json     58 PTKIN × golongan (KMA 204/2026)
  scholarships.seed.json  beasiswa + jadwal + rule
  fixtures/               PDF KMA + koordinat hasil ekstraksi (dipakai tes)
scripts/
  extract-kma-lines.mjs   PDF → koordinat (sekali, hasilnya di-commit)
  build-ukt-seed.mjs      koordinat → seed UKT (dengan golden test)
  link-ptkin.mjs          pasangkan blok KMA ↔ kode kampus PDDikti
  normalize-ukt-rules.mjs ubah syarat golongan → rupiah untuk beasiswa nasional
```

---

## Menambah beasiswa

1. Tambahkan entri di `data/scholarships.seed.json`.
2. Wajib ada: `source_url`, `last_verified_at`, `confidence`, `scope`, `stages`, `rule`.
3. Kalau syarat UKT ditulis sebagai nomor golongan dan beasiswanya nasional → jalankan
   `node scripts/normalize-ukt-rules.mjs` supaya dikonversi ke rupiah. Ada tes yang gagal kalau
   ini dilewati.
4. `npm test`.

## Menambah kampus dengan UKT

- **PTKIN**: seluruhnya sudah tercakup dari KMA. Kalau KMA baru terbit, ganti PDF di
  `data/fixtures/`, jalankan `scripts/extract-kma-lines.mjs` → `scripts/build-ukt-seed.mjs`.
- **PTN non-PTKIN**: belum terpusat (tidak ada API nasional). Sementara pengguna mengisi nominal
  UKT sendiri; halaman `/data` menyebutkan ini.

---

## Data pribadi

Tanpa login. Profil (IPK, golongan UKT, kondisi finansial) hanya dipakai untuk menghitung di
server dan tidak dikirim ke pihak ketiga. Tidak ada pendaftaran yang diproses di sini, semua
tautan mengarah ke situs resmi penyelenggara.

## Lisensi

MIT untuk kode. Data tetap milik penerbitnya masing-masing (Kementerian Agama, PDDikti,
penyelenggara beasiswa); repositori ini hanya menyimpan field yang dipakai beserta tautan sumbernya.
