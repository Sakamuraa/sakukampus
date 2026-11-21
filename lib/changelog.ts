/* Satu sumber kebenaran untuk versi rilis dan ringkasan perubahannya.
   Dipakai oleh popup "yang baru" di layout global; ubah di sini saja. */

export const APP_VERSION = '2026.11.21';

export type ChangelogEntry = {
  /** Label pendek, tampil sebagai rubric mono di kiri butir. */
  label: string;
  /** Satu kalimat; jangan lebih, popup ini bukan halaman rilis. */
  text: string;
};

export const CHANGELOG: ChangelogEntry[] = [
  {
    label: 'Pencarian',
    text: 'Fallback berlapis DuckDuckGo → Jina Reader → Bing, kueri berjangkar tahun akademik berikutnya, plus penyaring host agregator dan ber-login.',
  },
  {
    label: 'Pengambilan halaman',
    text: 'Halaman detail tiap beasiswa ikut diambil, bukan hanya halaman daftar; blokir WAF dideteksi dan diulang dengan agen peramban.',
  },
  {
    label: 'Ekstraksi AI',
    text: 'LLM mengekstrak data sekaligus mengutip bukti dari teks halaman, dengan kerangka JSON eksplisit dan penanganan JSON terpotong.',
  },
  {
    label: 'Penyaringan',
    text: 'Nama kampus dicocokkan berbasis token-set dengan sinonim; syarat yang tak dapat diperiksa mesin menjadi catatan, bukan penolakan.',
  },
  {
    label: 'Publikasi',
    text: 'Penjadwal internal tiap 12 jam; hasil valid langsung tampil di katalog, jadwal, API, dan pemeriksa kelayakan tanpa build ulang.',
  },
  {
    label: 'Hasil',
    text: 'Waktu proses turun dari sekitar 143 detik ke 65 detik; 114 uji otomatis lulus.',
  },
];
