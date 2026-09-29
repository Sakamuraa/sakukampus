"""Generate the SakuKampus development progress report (HTML -> PDF).

Inti perubahan saja, tanpa rincian commit. Dibuat untuk dipakai sebagai bahan
laporan progres pengembangan.

Run: /home/container/venv/bin/python scripts/make-progress-pdf.py
"""
import base64
import pathlib
import subprocess
import time

ROOT = pathlib.Path(__file__).resolve().parent.parent
CHROME = "/home/container/.cloakbrowser/chromium-146.0.7680.177.5/chrome"
OUT_PDF = ROOT / "SakuKampus-Laporan-Progres.pdf"

ACCENT = "#c8811a"
INK = "#14171d"
DIM = "#5c6472"
LINE = "#e2e6ec"
PAPER = "#ffffff"

# (judul, rentang, fokus, [poin inti perubahan])
PHASES = [
    (
        "Fondasi produk",
        "17 September 2026",
        "Membangun seluruh kerangka situs dalam satu langkah awal.",
        [
            "Halaman pertama sudah memuat katalog kampus, katalog beasiswa, dan alur "
            "pemeriksaan kelayakan sekaligus.",
            "Menetapkan prinsip penilaian utama: kelayakan dihitung dari nominal rupiah "
            "UKT, bukan dari nomor golongan, karena golongan yang sama bernilai berbeda "
            "di tiap kampus.",
            "Katalog kampus diambil dari API PDDikti, data UKT dari dekrit KMA 204/2026, "
            "dan jadwal dari pengumuman resmi penyelenggara.",
            "Penataan README dan konfigurasi deploy ke Vercel.",
        ],
    ),
    (
        "Penataan tampilan dan sistem gaya",
        "18 September 2026",
        "Menyusun antarmuka sampai stabil di desktop maupun ponsel.",
        [
            "Seluruh halaman ditata ulang: desktop memakai tata letak lebar penuh, "
            "ponsel memakai tab bar menempel di bagian bawah layar.",
            "Navigasi atas untuk desktop dan tab bar untuk ponsel dipisah lewat media "
            "query, sehingga keduanya tidak saling menutupi.",
            "Sistem token warna diperkenalkan agar komponen yang sudah ada tetap hidup "
            "setelah sistem gaya diganti.",
            "Komponen antarmuka dibuat terpisah: tombol, kartu, lencana status, kolom "
            "isi, kolom pencarian beranimasi, dan kartu kaca.",
            "Logo resmi dipasang pada navigasi, lengkap dengan penyesuaian ukuran, "
            "posisi, dan latar belakang.",
            "SEO per halaman: judul, deskripsi, canonical, dan kartu Open Graph.",
            "Perbaikan pada modal yang tidak bisa digulir, tata letak chip, dan jarak "
            "isi di ponsel agar tidak tertutup tab bar.",
        ],
    ),
    (
        "Pembenahan data dan penyediaan API",
        "19-20 September 2026",
        "Memperbesar isi katalog dan membuka data ke publik.",
        [
            "Jumlah beasiswa bertambah dari 8 menjadi 19 entri, diambil dari penyelenggara "
            "resmi seperti LPDP, KIP Kuliah, Djarum, Astra, Adaro, BRILiaN, Tanoto "
            "Foundation, Pertamina, dan Bank Indonesia.",
            "Katalog kampus bertambah dari 3.690 menjadi 3.693, termasuk kampus yang "
            "terlewat pada pengambilan awal seperti Universitas Mercu Buana dan "
            "Universitas Budi Luhur.",
            "Dibuat modal dokumentasi API yang menampilkan contoh cURL dan balasan JSON "
            "untuk kelima endpoint publik, lengkap dengan tombol salin.",
            "Tampilan \"pemeriksaan terakhir\" diubah memakai waktu berjalan di server "
            "alih-alih stempel waktu tetap pada berkas data.",
            "Serangkaian perbaikan tampilan: dialog agar tepat di tengah layar, "
            "geser ke atas pada ponsel, garis tepi dan latar dialog yang sempat hilang, "
            "serta jarak antar bagian pada halaman data dan beasiswa.",
        ],
    ),
    (
        "Pengerjaan ulang tampilan secara menyeluruh",
        "29 September 2026",
        "Menulis ulang seluruh halaman mengikuti pedoman anti-AI-slop.",
        [
            "Tailwind v4 dipasang kembali dengan token didefinisikan lewat blok @theme, "
            "disertai framer-motion untuk animasi masuk dan transisi dialog.",
            "Seluruh halaman ditulis ulang: judul beranda dipindah ke posisi asimetris "
            "dengan contoh perbandingan UKT nyata di sebelahnya, tata letak tiap bagian "
            "dibuat berbeda-beda, dan seluruh produk memakai satu warna aksen.",
            "Komponen dasar disamakan dengan gaya shadcn dan 21st.dev: Button, Card, "
            "Badge, Field, Input, serta Select.",
            "Pembersihan bahasa: penggunaan tanda em-dash dihapus dari seluruh tampilan, "
            "dan judul beranda disederhanakan menjadi kalimat biasa.",
            "Label pada tombol navigasi dan penyaring dihaluskan agar benar-benar "
            "ter tengah, karena sebelumnya memakai elemen inline yang tingginya tidak "
            "berlaku.",
            "Kartu Open Graph berukuran 1200 kali 630 dibuat bersama favicon dan "
            "apple-touch-icon. Sebelumnya berkas gambar yang dirujuk tidak tersedia "
            "sehingga logo tidak muncul saat tautan dibagikan.",
            "Dropdown kustom menggantikan elemen select bawaan peramban, dilengkapi "
            "kolom pencarian untuk memilih program studi pada kampus terverifikasi.",
            "Ditambahkan skrip pembuat laporan perkembangan ini.",
        ],
    ),
]

FEATURES = [
    (
        "Halaman",
        [
            "Beranda: ringkasan produk, contoh perbandingan UKT, aturan penilaian, "
            "beasiswa yang sedang terbuka, cakupan data.",
            "Cek kelayakan (/cek): pencarian kampus, pilihan prodi dan golongan UKT, "
            "profil akademik opsional, lalu daftar hasil berkelompok.",
            "Katalog beasiswa (/beasiswa): penyaring per tingkat penyelenggara dan "
            "status pendaftaran.",
            "Jadwal tenggat (/jadwal): hitung mundur pendaftaran yang masih terbuka "
            "beserta daftar yang sudah lewat.",
            "Status data (/data): asal setiap angka, kapan terakhir diambil, apa yang "
            "masih kurang, dan dokumentasi API.",
        ]
    ),
    (
        "API publik tanpa kunci",
        [
            "GET /api/v1/institutions: cari kampus atau ambil tabel UKT per program studi.",
            "GET /api/v1/scholarships: katalog beasiswa dengan jadwal dan syarat.",
            "GET /api/v1/calendar: seluruh tenggat pendaftaran, terurut.",
            "GET /api/v1/meta/sources: metadata asal dan waktu pengambilan data.",
            "POST /api/v1/eligibility/check: periksa kelayakan berdasarkan profil.",
        ]
    ),
    (
        "Cara penilaian",
        [
            "Empat status hasil: lolos, perlu data, belum memenuhi, pendaftaran tutup.",
            "Beasiswa yang pendaftarannya sudah ditutup tidak pernah dilaporkan sebagai "
            "\"perlu data\", karena tidak ada lagi data yang bisa dilengkapi.",
            "Syarat khusus dicatat sebagai informasi prioritas, bukan sebagai penentu "
            "kelolosan.",
            "Data yang belum tersedia dilaporkan apa adanya, bukan ditebak.",
            "Setiap beasiswa memuat alamat sumber resmi dan tanggal pemeriksaan terakhir.",
        ]
    ),
]

FIXES = [
    ("Penyaringan kampus",
     "Beasiswa yang hanya berlaku di satu kampus sempat muncul pada kampus lain. "
     "Penyaringan lingkup sekarang menolaknya sebelum hasil disusun."),
    ("Tipe data UKT",
     "Nilai UKT berupa null lolos dari pemeriksaan yang hanya membandingkan dengan "
     "undefined, sehingga menimbulkan galat saat format rupiah dibuat. Pengecekan "
     "kini memperlakukan null sebagai ketiadaan data."),
    ("Tautan gambar media sosial",
     "Kartu Open Graph menunjuk berkas yang tidak ada di server, sehingga logo tidak "
     "terbawa saat alamat situs dibagikan. Kini merujuk berkas yang benar-benar ada."),
    ("Dialog pilihan UKT",
     "Dialog pilihan golongan tidak berada di tengah layar, menempel di bagian atas, "
     "serta kehilangan garis tepi dan latarnya. Sudah diperbaiki untuk desktop dan "
     "ponsel sekaligus."),
    ("Tab bar menutupi tombol",
     "Tab bar ponsel menempel pada titik yang sama dengan tombol ajakan di bagian "
     "bawah layar sehingga saling menutupi. Tombol tersebut kini hanya tampil di "
     "desktop dan tinggi tab bar sudah diperhitungkan pada jarak isi."),
]

QUALITY = [
    "Seluruh pemeriksaan TypeScript lolos tanpa galat.",
    "85 dari 85 tes otomatis lulus.",
    "Kompilasi Tailwind v4 bersih menghasilkan sekitar 43 KB CSS.",
    "Lima halaman dan kelima endpoint API menjawab dengan kode 200 tanpa galat runtime.",
    "Katalog akhir: 3.693 kampus, 19 beasiswa, 58 kampus PTKIN berdata UKT, "
    "1.550 baris program studi.",
]


def build_html() -> str:
    def bullets(items):
        return "".join(f"<li>{t}</li>" for t in items)

    phases = ""
    for i, (title, when, focus, points) in enumerate(PHASES, 1):
        phases += f"""
        <div class="phase">
          <div class="phase-head">
            <span class="phase-idx">Tahap {i}</span>
            <span class="phase-name">{title}</span>
            <span class="phase-when">{when}</span>
          </div>
          <p class="phase-focus">{focus}</p>
          <ul class="bullets">{bullets(points)}</ul>
        </div>"""

    feats = ""
    for title, items in FEATURES:
        feats += f"""
        <div class="feat">
          <h3>{title}</h3>
          <ul class="bullets">{bullets(items)}</ul>
        </div>"""

    fixes = "".join(
        f'<div class="fix"><b>{t}</b><p>{d}</p></div>' for t, d in FIXES
    )

    return f"""<!doctype html>
<html lang="id"><head><meta charset="utf-8">
<style>
  @page {{ size: A4; margin: 20mm 16mm 22mm; }}
  * {{ box-sizing: border-box; }}
  body {{
    margin: 0; color: {INK}; background: {PAPER};
    font: 10.5pt/1.6 "DejaVu Sans", "Liberation Sans", sans-serif;
    -webkit-print-color-adjust: exact; print-color-adjust: exact;
  }}
  .mono {{ font-family: "DejaVu Sans Mono", monospace; }}

  .cover {{ page-break-after: always; padding-top: 8mm; }}
  .rule {{ height: 4px; background: {ACCENT}; width: 100%; margin-bottom: 10mm; }}
  .kicker {{ font: 600 9pt/1 "DejaVu Sans Mono", monospace; letter-spacing: .16em;
             text-transform: uppercase; color: {ACCENT}; }}
  h1 {{ font-size: 33pt; line-height: 1.08; margin: 6mm 0 0; letter-spacing: -.02em; }}
  h1 span {{ display: block; font-size: 17pt; font-weight: 600; margin-top: 3mm;
             color: {DIM}; letter-spacing: -.01em; }}
  .sub {{ font-size: 12pt; color: {DIM}; margin: 6mm 0 0; max-width: 130mm; }}
  .meta {{ margin-top: 14mm; border-top: 1px solid {LINE}; padding-top: 5mm;
           font-size: 9.5pt; color: {DIM}; }}
  .meta div {{ display: flex; gap: 4mm; padding: 1.5mm 0; }}
  .meta b {{ width: 36mm; color: {INK}; font-weight: 600; }}

  h2 {{ font-size: 15pt; letter-spacing: -.01em; margin: 0 0 4mm;
        padding-bottom: 2.5mm; border-bottom: 2px solid {ACCENT}; }}
  h2 .idx {{ color: {ACCENT}; font-family: "DejaVu Sans Mono", monospace;
             font-size: 11pt; margin-right: 3mm; }}
  section {{ margin-bottom: 9mm; }}
  p.lead {{ color: {DIM}; margin: 0 0 5mm; max-width: 152mm; }}

  .phase {{ border-left: 3px solid {ACCENT}; padding-left: 5mm; margin-bottom: 6.5mm;
            page-break-inside: avoid; }}
  .phase-head {{ display: flex; align-items: baseline; gap: 3.5mm; }}
  .phase-idx {{ font: 700 9pt/1 "DejaVu Sans Mono", monospace; color: {ACCENT};
                letter-spacing: .05em; }}
  .phase-name {{ font-size: 12pt; font-weight: 700; }}
  .phase-when {{ margin-left: auto; font-size: 9pt; color: {DIM}; }}
  .phase-focus {{ margin: 1.5mm 0 0; font-style: italic; color: {DIM}; font-size: 10pt; }}

  .bullets {{ margin: 3mm 0 0; padding-left: 5mm; }}
  .bullets li {{ margin-bottom: 1.8mm; }}
  .bullets li::marker {{ color: {ACCENT}; }}

  .feat {{ page-break-inside: avoid; margin-bottom: 6mm;
           padding-bottom: 4mm; border-bottom: 1px solid {LINE}; }}
  .feat:last-child {{ border-bottom: none; }}
  .feat h3 {{ font-size: 11.5pt; margin: 0; letter-spacing: -.01em; }}
  .feat .bullets {{ margin-top: 2mm; }}

  .fix {{ page-break-inside: avoid; margin-bottom: 4mm; padding: 3.5mm 4mm;
          background: #fbfaf8; border-left: 3px solid {ACCENT}; }}
  .fix b {{ display: block; font-size: 10.5pt; margin-bottom: 1mm; }}
  .fix p {{ margin: 0; font-size: 10pt; color: {DIM}; }}

  .qual {{ background: #fdf7ef; border: 1px solid #f0dfc4;
           border-left: 3px solid {ACCENT}; padding: 4.5mm 5mm;
           page-break-inside: avoid; }}
  .qual .bullets {{ margin-top: 0; }}
</style></head>
<body>

  <div class="cover">
    <div class="rule"></div>
    <div class="kicker">Laporan progres pengembangan</div>
    <h1>SakuKampus<span>Katalog beasiswa dan pemeriksa kelayakan berbasis nominal UKT</span></h1>
    <p class="sub">Rangkuman inti perubahan dari pembuatan pertama sampai
       kondisi akhir situs.</p>

    <div class="meta">
      <div><b>Alamat situs</b><span>sakukampus.onheil.fun</span></div>
      <div><b>Repositori</b><span>github.com/Sakamuraa/sakukampus</span></div>
      <div><b>Periode</b><span>17 September 2026 sampai 29 September 2026</span></div>
      <div><b>Tahap kerja</b><span>4 tahap</span></div>
      <div><b>Teknologi</b><span>Next.js, TypeScript, Tailwind v4, framer-motion, Vercel</span></div>
      <div><b>Bahasa isi</b><span>Bahasa Indonesia</span></div>
      <div><b>Penyunting</b><span>Sakamuraa</span></div>
    </div>
  </div>

  <section>
    <h2><span class="idx">01</span>Ringkasan proyek</h2>
    <p class="lead">SakuKampus membantu mahasiswa Indonesia menentukan beasiswa mana
       yang sesuai dengan biaya kuliahnya. Pengguna memilih kampus dan golongan UKT,
       lalu sistem membandingkan nominal rupiah yang harus dibayarkan dengan syarat
       plafon tiap beasiswa.</p>
    <p class="lead">Masalah yang dijawab: nomor golongan tidak dapat dibandingkan
       antar kampus. Golongan 2 di UIN Syarif Hidayatullah Jakarta bernilai
       Rp4.270.000, sedangkan golongan 2 di UIN Maulana Malik Ibrahim Malang
       bernilai Rp1.653.000. Karena itu penilaian selalu memakai angka rupiah,
       bukan nomor golongan.</p>
  </section>

  <section>
    <h2><span class="idx">02</span>Progres pengembangan</h2>
    {phases}
  </section>

  <section>
    <h2><span class="idx">03</span>Fitur yang tersedia</h2>
    {feats}
  </section>

  <section>
    <h2><span class="idx">04</span>Perbaikan yang dilakukan</h2>
    <p class="lead">Kerusakan yang ditemukan selama pengujian dan penanganannya.</p>
    {fixes}
  </section>

  <section>
    <h2><span class="idx">05</span>Kondisi akhir</h2>
    <div class="qual">
      <ul class="bullets">{bullets(QUALITY)}</ul>
    </div>
  </section>

</body></html>"""


def main():
    doc = build_html()
    html_path = pathlib.Path("/tmp/progres.html")
    html_path.write_text(doc, encoding="utf-8")
    print("html", html_path, len(doc), "chars")

    import urllib.request, websocket

    chrome = subprocess.Popen(
        [CHROME, "--headless=new", "--disable-gpu", "--no-sandbox",
         "--remote-debugging-port=9222", "--remote-allow-origins=*",
         "--hide-scrollbars", "--user-data-dir=/tmp/chrome-pdf-profile", "about:blank"],
        stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL,
    )

    tabs = None
    for _ in range(40):
        try:
            tabs = json.load(urllib.request.urlopen("http://127.0.0.1:9222/json/list", timeout=2))
            if tabs:
                break
        except Exception:
            time.sleep(0.5)
    if not tabs:
        chrome.kill()
        raise RuntimeError("chrome debugging endpoint never came up")

    ws = websocket.create_connection(
        tabs[0]["webSocketDebuggerUrl"], timeout=60, suppress_origin=True
    )
    seq = [0]

    def call(method, **params):
        seq[0] += 1
        ws.send(json.dumps({"id": seq[0], "method": method, "params": params}))
        while True:
            msg = json.loads(ws.recv())
            if msg.get("id") == seq[0]:
                return msg.get("result", {})

    call("Page.enable")
    call("Page.navigate", url=html_path.as_uri())
    time.sleep(2)
    call("Emulation.setEmulatedMedia", media="print")
    time.sleep(1)

    res = call(
        "Page.printToPDF",
        printBackground=True,
        preferCSSPageSize=True,
        displayHeaderFooter=True,
        headerTemplate="<span></span>",
        footerTemplate="""
          <div style="font-size:7.5px;width:100%;padding:0 16mm;color:#8a919e;
                      font-family:'DejaVu Sans Mono',monospace;
                      display:flex;justify-content:space-between;">
            <span>SakuKampus &middot; Laporan progres pengembangan</span>
            <span><span class="pageNumber"></span> / <span class="totalPages"></span></span>
          </div>""",
    )
    OUT_PDF.write_bytes(base64.b64decode(res["data"]))
    ws.close()
    chrome.terminate()
    try:
        chrome.wait(timeout=10)
    except Exception:
        chrome.kill()
    print("pdf", OUT_PDF, OUT_PDF.stat().st_size, "bytes")


if __name__ == "__main__":
    import json
    main()
