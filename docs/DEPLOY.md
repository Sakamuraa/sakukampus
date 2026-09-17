# Vercel — SakuKampus
#
# Build SELALU di Vercel, tidak pernah di panel dev.
# Project ini memakai akun Vercel yang sama dengan Onheil-site, tetapi
# merupakan PROJECT TERPISAH (nama: sakukampus).

## Environment Variables wajib

| Nama | Nilai | Dipakai untuk |
|---|---|---|
| `CRON_SECRET` | string acak (mis. `openssl rand -hex 32`) | mengunci `/api/cron/refresh-seeds` |

Opsional (belum aktif — seed masih dibaca dari berkas di repositori):

| Nama | Nilai | Catatan |
|---|---|---|
| `DATABASE_URL` | connection string Neon (pooled) | baru dipakai kalau data dipindah dari berkas seed ke Postgres |

## Domain

`sakukampus.onheil.fun`

1. Tambahkan domain di dashboard Vercel (project `sakukampus` → Settings → Domains).
2. Vercel memberi target CNAME: `cname.vercel-dns.com`.
3. Di Cloudflare, zona `onheil.fun`, buat record:

   ```
   Type    : CNAME
   Name    : sakukampus
   Target  : cname.vercel-dns.com
   Proxy   : DNS only  (awan ORANGE dimatikan)
   ```

   **Proxy harus OFF.** Kalau proxy Cloudflare dibiarkan ON, Vercel tidak bisa
   menerbitkan sertifikat TLS-nya sendiri dan akan terjadi dobel-CDN.

4. Tunggu verifikasi Vercel (`Valid Configuration`), sertifikat terbit otomatis.

## Deploy

1. Import repo `Sakamuraa/sakukampus` di Vercel → Framework Preset: Next.js (otomatis).
2. Root Directory: root repositori. Build Command & Output: default.
3. Deploy. Preview Deployment dibuat otomatis untuk setiap push ke branch selain `main`.
4. Production dari branch `main`.

## Cron

`vercel.json` mendaftarkan satu cron harian:

```json
{ "crons": [{ "path": "/api/cron/refresh-seeds", "schedule": "0 3 * * *" }] }
```

Plan Hobby hanya mengizinkan **sekali per hari**. Cron ini tidak mengunduh data —
ia memeriksa kesehatan seed yang ter-deploy (jumlah kampus, jumlah baris UKT,
validitas `source_url`, dan kepatuhan aturan "beasiswa nasional tidak boleh
memakai nomor golongan"). Kalau ada masalah, ia membalas 500 supaya kegagalan
terlihat di dashboard Cron Vercel.

Refresh data yang sesungguhnya dilakukan manual lewat skrip di `scripts/`
(lihat README), lalu hasilnya di-commit. Itu disengaja: tidak ada perubahan data
yang terjadi diam-diam di produksi.

## Setelah deploy — yang harus diperiksa

```bash
BASE=https://sakukampus.onheil.fun

curl -s $BASE/api/v1/meta/sources | head -c 400
curl -s "$BASE/api/v1/institutions?q=syarif%20hidayatullah"
curl -s "$BASE/api/v1/institutions?kode=201001&prodi=Teknik%20Informatika" | head -c 600
curl -s "$BASE/api/v1/scholarships?tier=pemerintah"
curl -s -X POST $BASE/api/v1/eligibility/check \
  -H 'content-type: application/json' \
  -d '{"kode_pt":"201001","prodi":"Teknik Informatika","kelompok":3,"profil":{"jenjang":"S1","semester":5,"ipk":3.6,"penerima_beasiswa_lain":false}}'
curl -s $BASE/api/cron/refresh-seeds | head -c 400

# Bukti aturan §5: golongan yang sama, hasil berbeda antar kampus
curl -s -X POST $BASE/api/v1/eligibility/check -H 'content-type: application/json' \
  -d '{"kode_pt":"201001","kelompok":2,"profil":{"jenjang":"S1","desil_dtsen":2}}' \
  | python3 -c "import json,sys;d=json.load(sys.stdin);print('JAKARTA:',[h['verdict'] for h in d['data']['hasil'] if h['slug']=='kip-kuliah-2026'][0])"
curl -s -X POST $BASE/api/v1/eligibility/check -H 'content-type: application/json' \
  -d '{"kode_pt":"201003","prodi":"Teknik Informatika","kelompok":2,"profil":{"jenjang":"S1","desil_dtsen":2}}' \
  | python3 -c "import json,sys;d=json.load(sys.stdin);print('MALANG :',[h['verdict'] for h in d['data']['hasil'] if h['slug']=='kip-kuliah-2026'][0])"
```

Dua baris terakhir **harus berbeda** (`tidak` vs `lolos`). Kalau sama, aturan §5
sedang dilanggar di produksi.

## Cek realitas di frontend (setelah live)

Buka di HP, bukan cuma di desktop:

1. `/` — kartu "Kenapa rupiah, bukan nomor golongan?" menampilkan 4 nominal UIN Jakarta.
2. `/cek` — cari "syarif" → pilih kampus → daftar golongan muncul dengan nominal rupiah;
   ganti prodi ke **Farmasi** → nominal golongan 7 ikut berubah.
3. `/cek` — pilih kampus yang **belum** punya UKT (mis. cari "teungku dirundeng") →
   muncul peringatan "belum terverifikasi" dan input nominal manual; hasil tetap muncul.
4. `/beasiswa` — tiap kartu punya badge "Terverifikasi &lt;tanggal&gt;" dan tombol sumber.
5. `/jadwal` — KIP Kuliah tampil dengan sisa hari menuju 31 Okt 2026.
6. `/data` — halaman ini harus terbuka tanpa angka kosong.
7. Matikan data seluler → halaman yang sudah dibuka masih tampil dari cache.

Kalau ada yang tidak sesuai, laporkan dengan URL + langkah + apa yang terlihat.