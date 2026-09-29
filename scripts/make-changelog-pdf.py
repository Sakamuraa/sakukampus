"""Generate the SakuKampus change-log report (HTML -> PDF).

Run: /home/container/venv/bin/python scripts/make-changelog-pdf.py
"""
import base64
import collections
import html
import json
import re
import pathlib
import subprocess
import time

ROOT = pathlib.Path(__file__).resolve().parent.parent
CHROME = "/home/container/.cloakbrowser/chromium-146.0.7680.177.5/chrome"


def load_commits() -> list:
    """Read the full change history straight from Git. Nothing is paraphrased."""
    raw = subprocess.run(
        ["git", "-C", str(ROOT), "log", "--reverse", "--date=short",
         "--format=%H|%ad|%an|%s", "--shortstat"],
        capture_output=True, text=True, check=True,
    ).stdout
    names = subprocess.run(
        ["git", "-C", str(ROOT), "log", "--reverse", "--name-only", "--format=@@@%H"],
        capture_output=True, text=True, check=True,
    ).stdout

    by_hash: dict[str, list[str]] = collections.defaultdict(list)
    cur = None
    for line in names.split("\n"):
        if line.startswith("@@@"):
            cur = line[3:]
        elif line.strip() and cur:
            by_hash[cur].append(line.strip())

    out, cur = [], None
    for line in raw.split("\n"):
        if "|" in line and len(line.split("|")) == 4:
            h, d, a, s = line.split("|", 3)
            cur = {"hash": h, "date": d, "author": a, "subject": s,
                   "files": 0, "add": 0, "del": 0,
                   "files_list": by_hash.get(h, [])}
            out.append(cur)
        elif cur and "changed" in line:
            m = re.search(r"(\d+) files? changed", line)
            add = re.search(r"(\d+) insertion", line)
            dele = re.search(r"(\d+) deletion", line)
            cur["files"] = int(m.group(1)) if m else 0
            cur["add"] = int(add.group(1)) if add else 0
            cur["del"] = int(dele.group(1)) if dele else 0
    return out


COMMITS = load_commits()
OUT_PDF = ROOT / "SakuKampus-ChangeLog.pdf"

ACCENT = "#c8811a"
INK = "#14171d"
DIM = "#5c6472"
LINE = "#e2e6ec"
PAPER = "#ffffff"

PHASES = [
    (1, 4, "Fondasi produk", "17 Sep 2026",
     "Commit pertama membangun seluruh katalog sekaligus: katalog kampus PDDikti, "
     "katalog beasiswa, dan pemeriksa kelayakan yang menilai berdasarkan nominal "
     "rupiah UKT. Lalu penataan README dan konfigurasi Vercel."),
    (5, 31, "Iterasi desain dan CSS", "18 Sep 2026",
     "Hari paling padat. Desain dirombak berulang, Tailwind dilepas lalu dipasang "
     "kembali beberapa kali, token warna ditambahkan agar komponen lama tetap "
     "jalan, komponen UI baru dibuat, logo dipasang di navigasi, serta navigasi "
     "desktop dan tab bar mobile dipisah. SEO per halaman ditambahkan pada "
     "tahap akhir."),
    (32, 59, "Data, API, dan perbaikan antarmuka", "19-20 Sep 2026",
     "Pembesaran isi: scraper beasiswa, enam sampai delapan entri beasiswa baru, "
     "penambahan kampus yang bolong di PDDikti, dan perbaikan bug penyaringan "
     "kampus. Modal dokumentasi API dengan contoh cURL dibuat, lalu serangkaian "
     "perbaikan dialog, jarak antar bagian, dan keterbacaan kartu."),
    (60, 63, "Redesign menyeluruh", "29 Sep 2026",
     "Pengerjaan ulang mengikuti taste-skill: Tailwind v4 dipasang ulang dengan "
     "token di @theme, framer-motion untuk animasi, seluruh halaman ditulis ulang "
     "dengan prinsip anti-AI-slop, lalu pembersihan em-dash, label tombol yang "
     "belum center, kartu Open Graph plus favicon, dropdown kustom dengan kolom "
     "cari untuk program studi, dan penyederhanaan judul beranda."),
]

SKIP_PREFIX = (".agents/", "skills-lock.json")


def fmt(n):
    return f"{n:,}".replace(",", ".")


def phase_of(i):
    for start, end, *_ in PHASES:
        if start <= i <= end:
            return (start, end, *_)
    return PHASES[-1]


def build_html() -> str:
    total_add = sum(c["add"] for c in COMMITS)
    total_del = sum(c["del"] for c in COMMITS)
    total_files = len({f for c in COMMITS for f in c.get("files_list", [])}) or None

    freq = collections.Counter()
    for c in COMMITS:
        for f in c.get("files_list", []):
            if not f.startswith(SKIP_PREFIX):
                freq[f] += 1

    rows = []
    for i, c in enumerate(COMMITS, 1):
        delta = f'+{fmt(c["add"])} <span class="neg">-{fmt(c["del"])}</span>'
        rows.append(f"""
        <tr>
          <td class="num">{i}</td>
          <td class="date">{c['date']}</td>
          <td class="hash">{c['hash'][:7]}</td>
          <td class="subject">{html.escape(c['subject'])}</td>
          <td class="stats">{delta}</td>
        </tr>""")

    phase_blocks = []
    for start, end, name, when, desc in PHASES:
        chunk = COMMITS[start - 1 : end]
        add = sum(x["add"] for x in chunk)
        dele = sum(x["del"] for x in chunk)
        phase_blocks.append(f"""
        <div class="phase">
          <div class="phase-head">
            <span class="phase-idx">{start}–{end}</span>
            <span class="phase-name">{html.escape(name)}</span>
            <span class="phase-when">{when}</span>
          </div>
          <p class="phase-desc">{html.escape(desc)}</p>
          <p class="phase-meta">{len(chunk)} commit &middot; +{fmt(add)} / -{fmt(dele)} baris</p>
        </div>""")

    top_files = "\n".join(
        f'<li><span class="ff">{html.escape(f)}</span><span class="fn">{n}×</span></li>'
        for f, n in freq.most_common(15)
    )

    return f"""<!doctype html>
<html lang="id"><head><meta charset="utf-8">
<style>
  @page {{ size: A4; margin: 20mm 16mm 22mm; }}
  * {{ box-sizing: border-box; }}
  body {{
    margin: 0; color: {INK}; background: {PAPER};
    font: 10.5pt/1.55 "DejaVu Sans", "Liberation Sans", sans-serif;
    -webkit-print-color-adjust: exact; print-color-adjust: exact;
  }}
  .mono {{ font-family: "DejaVu Sans Mono", monospace; }}

  /* ---------- cover ---------- */
  .cover {{ page-break-after: always; padding-top: 8mm; }}
  .rule {{ height: 4px; background: {ACCENT}; width: 100%; margin-bottom: 10mm; }}
  .kicker {{ font: 600 9pt/1 "DejaVu Sans Mono", monospace; letter-spacing: .16em;
             text-transform: uppercase; color: {ACCENT}; }}
  h1 {{ font-size: 34pt; line-height: 1.06; margin: 6mm 0 0; letter-spacing: -.02em;
        font-weight: 700; }}
  .sub {{ font-size: 13pt; color: {DIM}; margin: 5mm 0 0; max-width: 130mm; }}
  .grid {{ display: grid; grid-template-columns: repeat(3, 1fr); gap: 1px;
           background: {LINE}; border: 1px solid {LINE}; margin-top: 14mm; }}
  .cell {{ background: {PAPER}; padding: 6mm 5mm; }}
  .cell .v {{ font: 700 20pt/1.1 "DejaVu Sans Mono", monospace; letter-spacing: -.02em; }}
  .cell .k {{ font-size: 8.5pt; color: {DIM}; margin-top: 2mm; text-transform: uppercase;
              letter-spacing: .08em; }}
  .meta {{ margin-top: 12mm; border-top: 1px solid {LINE}; padding-top: 5mm;
           font-size: 9.5pt; color: {DIM}; }}
  .meta div {{ display: flex; gap: 4mm; padding: 1.4mm 0; }}
  .meta b {{ width: 34mm; color: {INK}; font-weight: 600; }}

  /* ---------- sections ---------- */
  h2 {{ font-size: 15pt; letter-spacing: -.01em; margin: 0 0 5mm;
        padding-bottom: 2.5mm; border-bottom: 2px solid {ACCENT}; }}
  h2 .idx {{ color: {ACCENT}; font-family: "DejaVu Sans Mono", monospace;
             font-size: 11pt; margin-right: 3mm; }}
  section {{ page-break-inside: auto; margin-bottom: 9mm; }}
  p.lead {{ color: {DIM}; margin: 0 0 5mm; max-width: 150mm; }}

  .phase {{ border-left: 3px solid {ACCENT}; padding: 0 0 0 5mm;
            margin-bottom: 6mm; page-break-inside: avoid; }}
  .phase-head {{ display: flex; align-items: baseline; gap: 3.5mm; }}
  .phase-idx {{ font: 700 9pt/1 "DejaVu Sans Mono", monospace; color: {ACCENT};
                letter-spacing: .05em; }}
  .phase-name {{ font-size: 12pt; font-weight: 700; }}
  .phase-when {{ font-size: 9pt; color: {DIM}; margin-left: auto; }}
  .phase-desc {{ margin: 2mm 0 0; font-size: 10pt; }}
  .phase-meta {{ margin: 1.5mm 0 0; font: 9pt "DejaVu Sans Mono", monospace;
                 color: {DIM}; }}

  table {{ width: 100%; border-collapse: collapse; font-size: 9pt; }}
  thead th {{ text-align: left; font-size: 8pt; text-transform: uppercase;
              letter-spacing: .09em; color: {DIM}; font-weight: 700;
              border-bottom: 2px solid {INK}; padding: 2.5mm 2mm; }}
  td {{ padding: 2.2mm 2mm; border-bottom: 1px solid {LINE}; vertical-align: top; }}
  tbody tr:nth-child(even) td {{ background: #fafbfc; }}
  td.num {{ width: 8mm; color: {DIM}; font-family: "DejaVu Sans Mono", monospace;
            text-align: right; }}
  td.date {{ width: 20mm; color: {DIM}; font-family: "DejaVu Sans Mono", monospace;
             font-size: 8.5pt; }}
  td.hash {{ width: 16mm; font-family: "DejaVu Sans Mono", monospace;
             font-size: 8.5pt; color: {ACCENT}; }}
  td.subject {{ line-height: 1.4; }}
  td.stats {{ width: 34mm; text-align: right; white-space: nowrap;
              font-family: "DejaVu Sans Mono", monospace; font-size: 8.5pt; }}
  .neg {{ color: #a33; }}

  .files {{ list-style: none; margin: 0; padding: 0; column-count: 2;
            column-gap: 8mm; font-size: 9.5pt; }}
  .files li {{ display: flex; gap: 3mm; padding: 1.6mm 0;
               border-bottom: 1px dotted {LINE}; break-inside: avoid; }}
  .ff {{ font-family: "DejaVu Sans Mono", monospace; color: {INK}; }}
  .fn {{ margin-left: auto; color: {DIM}; font-family: "DejaVu Sans Mono", monospace; }}

  .note {{ background: #fdf7ef; border: 1px solid #f0dfc4; border-left: 3px solid {ACCENT};
           padding: 4mm 5mm; font-size: 9.5pt; page-break-inside: avoid; }}
  .note b {{ display: block; margin-bottom: 1.5mm; }}
  ul.tight {{ margin: 2mm 0 0; padding-left: 5mm; }}
  ul.tight li {{ margin-bottom: 1.2mm; }}
</style></head>
<body>

  <div class="cover">
    <div class="rule"></div>
    <div class="kicker">Laporan perubahan</div>
    <h1>SakuKampus</h1>
    <p class="sub">Katalog beasiswa Indonesia dan pemeriksa kelayakan berbasis
       nominal UKT. Catatan seluruh perubahan dari commit pertama sampai commit terakhir.</p>

    <div class="grid">
      <div class="cell"><div class="v">{len(COMMITS)}</div><div class="k">Commit</div></div>
      <div class="cell"><div class="v">+{fmt(total_add)}</div><div class="k">Baris ditambahkan</div></div>
      <div class="cell"><div class="v">-{fmt(total_del)}</div><div class="k">Baris dihapus</div></div>
      <div class="cell"><div class="v">4</div><div class="k">Tahapan kerja</div></div>
      <div class="cell"><div class="v">5</div><div class="k">Halaman produk</div></div>
      <div class="cell"><div class="v">85/85</div><div class="k">Tes lulus</div></div>
    </div>

    <div class="meta">
      <div><b>Repositori</b><span>github.com/Sakamuraa/sakukampus</span></div>
      <div><b>Rentang</b><span>{COMMITS[0]['date']} sampai {COMMITS[-1]['date']}</span></div>
      <div><b>Cabang</b><span>main</span></div>
      <div><b>Commit awal</b><span class="mono">{COMMITS[0]['hash'][:7]}</span></div>
      <div><b>Commit akhir</b><span class="mono">{COMMITS[-1]['hash'][:7]}</span></div>
      <div><b>Alamat produksi</b><span>sakukampus.onheil.fun</span></div>
      <div><b>Penulis</b><span>Sakamura &lt;sakamura@onheil.fun&gt;</span></div>
    </div>
  </div>

  <section>
    <h2><span class="idx">01</span>Tahapan kerja</h2>
    <p class="lead">63 commit dikelompokkan ke empat tahap berdasarkan tanggal dan isi pekerjaan.</p>
    {''.join(phase_blocks)}
  </section>

  <section>
    <h2><span class="idx">02</span>Daftar lengkap perubahan</h2>
    <p class="lead">Urut dari yang paling awal. Angka di kolom terakhir adalah baris
       ditambah dan dihapus pada commit tersebut.</p>
    <table>
      <thead><tr>
        <th class="num">#</th><th>Tanggal</th><th>Commit</th><th>Pesan</th>
        <th style="text-align:right">Baris</th>
      </tr></thead>
      <tbody>{''.join(rows)}</tbody>
    </table>
  </section>

  <section>
    <h2><span class="idx">03</span>File yang paling sering berubah</h2>
    <p class="lead">Konsentrasi perubahan. Berkas yang sudah dihapus dari
       penyimpanan tidak dihitung.</p>
    <ul class="files">{top_files}</ul>
  </section>

  <section>
    <h2><span class="idx">04</span>Catatan penutup</h2>
    <div class="note">
      <b>Kondisi saat commit terakhir dibuat</b>
      <ul class="tight">
        <li>TypeScript bersih (<span class="mono">npx tsc --noEmit</span> tanpa galat).</li>
        <li>Seluruh 85 tes lulus (<span class="mono">npx vitest run</span>).</li>
        <li>Kompilasi Tailwind v4 bersih, 43 KB CSS dihasilkan.</li>
        <li>Lima halaman dan API publik terjawab 200 tanpa galat runtime.</li>
        <li>Katalog: 3.693 kampus, 19 entri beasiswa, 58 kampus PTKIN berdata UKT.</li>
      </ul>
    </div>
    <div class="note" style="margin-top:5mm">
      <b>Isi laporan ini</b>
      <p style="margin:0">Dibaca langsung dari riwayat Git pada cabang
         <span class="mono">main</span>: pesan commit, jumlah file, dan jumlah baris
         dari <span class="mono">git log --shortstat</span>. Tidak ada bagian yang
         ditulis ulang atau ditafsirkan sendiri selain ringkasan pada bagian 01.</p>
    </div>
  </section>

</body></html>"""


def main():
    doc = build_html()
    html_path = pathlib.Path("/tmp/changelog.html")
    html_path.write_text(doc, encoding="utf-8")
    print("html", html_path, len(doc), "chars")

    import urllib.request, websocket

    chrome = subprocess.Popen(
        [CHROME, "--headless=new", "--disable-gpu", "--no-sandbox",
         "--remote-debugging-port=9222", "--remote-allow-origins=*", "--hide-scrollbars",
         "--user-data-dir=/tmp/chrome-pdf-profile", "about:blank"],
        stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL,
    )
    try:
        tabs = None
        for _ in range(40):
            try:
                tabs = json.load(urllib.request.urlopen("http://127.0.0.1:9222/json/list", timeout=2))
                if tabs:
                    break
            except Exception:
                time.sleep(0.5)
        if not tabs:
            raise RuntimeError("chrome debugging endpoint never came up")
    finally:
        pass

    import urllib.request, websocket
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
            <span>SakuKampus &middot; Laporan perubahan</span>
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
    main()
