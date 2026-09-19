# SakuKampus Scholarship Sources Reference

## Sources Terverifikasi (Sudah Ada di Seed)

| Slug | Source URL | Source Kind | Confidence |
|------|-----------|-------------|------------|
| stf-uin-jakarta-2026 | https://uinjkt.ac.id/id/pendaftaran-beasiswa-stf-uin-jakarta-2026- | resmi | 95 |
| kip-kuliah-2026 | https://ridwan.kemendikbud.go.id/ | resmi | 98 |
| bright-scholarship-2026 | https://ybmbrilian.id/ | resmi | 92 |
| djarum-beasiswa-plus-2026 | https://djarumbeasiswaplus.org/our-program/regulation-djarum-beasiswa-plus | resmi | 95 |
| bib-s1-unggulan-keagamaan-2026 | https://kemenag.go.id/ | resmi | 90 |
| beasiswa-blu-uin-jakarta | https://uinjkt.ac.id/ | resmi | 93 |
| student-achievement-awards-uin-2026 | https://uinjkt.ac.id/ | resmi | 88 |
| beasiswa-prestasi-stf-professor-husni-rahim | https://uinjkt.ac.id/ | resmi | 90 |

## Sources Baru (Per September 2026)

| Slug | Source URL | Status | Cara Akses |
|------|-----------|--------|------------|
| pertamina-sobat-bumi-2026 | https://www.pertaminafoundation.org/ | Open | scrape via r.jina.ai |
| beasiswa-bank-indonesia-2026 | https://bi.go.id | Open | per PT mitra |
| lpdp-tahap-2-2026 | https://lpdp.kemenkeu.go.id | Blocked | via r.jina.ai |
| beasiswa-bca-finance-peduli-2026 | https://bcafinance.co.id | Aggregator | idntimes.com |

## Cara Scrape yang Berhasil

### Via r.jina.ai (fallback untuk site yang bloqueir datacenter)
```bash
curl -s "https://r.jina.ai/<url>" -H "User-Agent: Mozilla/5.0" | head -100
```

Contoh berhasil:
- `https://r.jina.ai/https://djarumbeasiswaplus.org/our-program/regulation-djarum-beasiswa-plus` ✓
- `https://r.jina.ai/https://lpdp.kemenkeu.go.id` ✗ (DNS bermasalah)
- `https://r.jina.ai/https://www.bri.co.id/id/private-banking/beasiswa-brilian` ✓ (tapi halaman kosong)

### Direct fetch (untuk site yang tidak proteksi)
```javascript
const res = await fetch(url, {
  headers: { 'User-Agent': 'Mozilla/5.0 ...', 'Origin': 'https://target.com' }
});
```

### Sumber agregator (lebih reliable)
- indonesiabeasiswa.com
- indbeasiswa.com
- berkahbeasiswa.com
- beasiswaku.net
- indonesiana.id

## Script Generator

```bash
# Tambah beasiswa baru ke seed
node --experimental-strip-types scripts/add-scholarships.mjs

# Scrape sumber (manual review needed)
node --experimental-strip-types scripts/seed-scholarships.mjs
```

## Aturan Entry Baru

Setiap beasiswa HARUS punya:
1. `slug` unik
2. `source_url` → halaman resmi atau sumber tepercaya
3. `last_verified_at` → tanggal verifikasi terakhir
4. `confidence` 0-100
5. `rule` → JSON deklaratif sesuai engine schema
6. `stages` → timeline pendaftaran (opens_at, closes_at)
7. `jenjang` → array string ['S1'], ['S2', 'S3'], dll

JANGAN pakai `ukt_max_golongan` untuk beasiswa nasional (harus `ukt_max_idr`).
