# SakuKampus

Katalog beasiswa Indonesia + pemeriksa kelayakan berdasarkan **golongan UKT kampus masing-masing**.

Web app Next.js (App Router). Data diambil dari sumber resmi dan setiap fakta
menempel pada `source_url` + `last_verified_at`, tidak ada angka tanpa asal.


## Tujuan
Kenapa aplikasi ini dibuat? 
Aplikasi SatuKampus ini dibuat untuk membantu para mahasiswa mendapatkan informasi beasiswa se-Indonesia dengan mudah.

Dan tujuan lainnya yaitu untuk memenuhi tugas mata kuliah Rekayasa Perangkat Lunak, Teknik Informatika 3C yang diampu oleh pak Muhammad Sobri, S.Kom.,M.Kom.,Ph.D.

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
| Jadwal & syarat beasiswa | pengumuman resmi (KIP Kuliah, Beasiswa Unggulan, BPI, Djarum, YBR BRILiaN, STF UIN, BIB Kemenag–LPDP, KSE, BAZNAS, Bakti BCA) + portal SatuBeasiswa |

Keterbatasan diakui terbuka di halaman `/data` di dalam aplikasi, bukan hanya di README.

---

## Quick Start

```bash
npm install
npm test        # 90 tes: parser KMA, engine, pencocokan, data
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
  add-more-scholarships.mjs tambah entri + rapikan slug ganda
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

## Penemuan beasiswa otomatis

Endpoint `POST /api/cron/discover-scholarships` mencari program baru melalui
DuckDuckGo HTML (tanpa API key berbayar). Jika akses langsung dari server
diblokir, pencarian dicoba ulang ke Bing, lalu melalui Jina Reader, seperti
fallback `web_search` di ai-chat. Hasilnya dipakai untuk mengambil halaman
sumber, lalu router OpenAI-compatible mengekstrak dan mengutip bukti. Program
yang lolos validasi disimpan di PostgreSQL dan langsung ikut tampil di katalog,
detail, jadwal, API, dan pemeriksa kelayakan; tidak perlu rebuild untuk setiap
entri baru.

Salin template [.env.example](./.env.example) ke pengaturan environment server
dan ganti semua placeholder. Jangan commit file `.env` atau mengirim key lewat
chat.

| Variable | Isi |
|---|---|
| `CRON_SECRET` | Rahasia acak untuk header autentikasi cron |
| `SCHOLARSHIP_DISCOVERY_AUTO` | Opsional; set `0` untuk mematikan scheduler internal |
| `SCHOLARSHIP_DISCOVERY_INTERVAL_HOURS` | Opsional; interval scheduler internal, default `12` |
| `DATABASE_URL` | Connection string PostgreSQL; user harus boleh membuat tabel |
| `SCHOLARSHIP_LLM_API_URL` | URL lengkap endpoint Chat Completions milik router |
| `SCHOLARSHIP_LLM_MODEL` | Nama model pada router; pilih model yang patuh instruksi JSON, mis. `claude-opus-5-5` |
| `SCHOLARSHIP_LLM_API_KEY` | Key router; opsional jika router tidak memerlukan autentikasi |
| `SCHOLARSHIP_LLM_RETRY_BASE_MS` | Opsional; jeda dasar percobaan ulang router, default `5000` |

Jika memakai manager deployment `Vercel-Project/server.js`, scheduler internal
akan berjalan otomatis ketika `CRON_SECRET` tersedia: run pertama sekitar dua
menit setelah server mulai, lalu setiap 12 jam. Atur
`SCHOLARSHIP_DISCOVERY_INTERVAL_HOURS=24` untuk sekali sehari, atau
`SCHOLARSHIP_DISCOVERY_AUTO=0` untuk menonaktifkannya. Scheduler memanggil port
lokal dengan batas tunggu 300 detik, jadi tidak terkena batas timeout
cron-job.org dan tidak memerlukan cron sistem. Cron-job.org tetap bisa dipakai
opsional dengan method `POST` dan header `Authorization: Bearer <CRON_SECRET>`.
Request ke router ditunggu hingga 120 detik dan mendukung respons JSON maupun
SSE. Balasan `429` dan `503` dari router hampir selalu bersifat sesaat — akun
upstream dipakai pemanggil lain — sehingga permintaan diulang hingga tiga kali
dengan jeda yang bertambah (5 detik, 10 detik) dan menghormati header
`Retry-After`. Seluruh tahap ekstraksi dibatasi 240 detik agar cron tidak
berjalan tanpa ujung.

Setiap pemanggilan menjalankan beberapa kueri pencarian di belakang satu request
dan memproses paling banyak enam halaman kandidat. Pengambilan tiap halaman
sumber dibatasi 30 detik. Layanan pencarian gratis
dan Jina Reader tidak memiliki SLA dan dapat sewaktu-waktu dibatasi atau berubah
format; jika semuanya gagal, endpoint melaporkan error dan tidak menerbitkan kandidat yang gagal
diverifikasi. Sistem hanya menerbitkan
hasil dengan sumber yang dinilai resmi, kutipan bukti yang benar-benar ditemukan
di halaman, syarat yang bisa dipetakan ke eligibility engine, periode akademik
berjalan/berikutnya, serta confidence model minimal 90. Kandidat duplikat,
ambigu, halaman yang gagal diambil, atau syarat yang belum didukung akan
dilewati dan dicatat pada respons cron. Ini otomatis, tetapi confidence model
bukan jaminan kebenaran mutlak; verifikasi sumber tetap penting untuk keputusan
pendaftaran.

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
