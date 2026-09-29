"""Generate Open Graph card + favicons for SakuKampus.

Run: /home/container/venv/bin/python scripts/make-og.py
Outputs public/og.png (1200x630) and app/icon.png (64x64).
"""
from PIL import Image, ImageDraw, ImageFont
import pathlib

ROOT = pathlib.Path(__file__).resolve().parent.parent
PUBLIC = ROOT / "public"
APP = ROOT / "app"

BG = (10, 12, 16)
ACCENT = (245, 166, 35)
INK = (232, 236, 244)
DIM = (154, 164, 184)
LINE = (38, 44, 57)

BOLD = "/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf"
REG = "/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf"
MONO = "/usr/share/fonts/truetype/dejavu/DejaVuSansMono.ttf"


def build_og() -> None:
    W, H = 1200, 630
    im = Image.new("RGB", (W, H), BG)
    d = ImageDraw.Draw(im, "RGBA")

    # Faint column rhythm, right third only. Keeps the card quiet.
    for x in range(W - 420, W + 1, 42):
        d.line([(x, 0), (x, H)], fill=(255, 255, 255, 5), width=1)

    # Amber glow, top-right, single accent moment.
    glow = Image.new("RGBA", (W, H), (0, 0, 0, 0))
    gd = ImageDraw.Draw(glow)
    gd.ellipse([W - 520, -260, W + 240, 500], fill=(245, 166, 35, 46))
    gd.ellipse([W - 300, -140, W + 60, 260], fill=(245, 166, 35, 34))
    glow = glow.filter(__import__("PIL.ImageFilter", fromlist=["ImageFilter"]).GaussianBlur(90))
    im = Image.alpha_composite(im.convert("RGBA"), glow)
    d = ImageDraw.Draw(im, "RGBA")

    # Top rule
    d.rectangle([0, 0, W, 7], fill=ACCENT)

    # Logo shield
    logo = Image.open(PUBLIC / "logo.png").convert("RGBA")
    side = 168
    logo = logo.resize((side, side), Image.LANCZOS)
    lx, ly = 96, 168
    im.alpha_composite(logo, (lx, ly))
    d = ImageDraw.Draw(im, "RGBA")

    tx = lx + side + 44

    title = ImageFont.truetype(BOLD, 96)
    tag = ImageFont.truetype(REG, 33)
    dom = ImageFont.truetype(MONO, 27)
    eyebrow = ImageFont.truetype(MONO, 22)

    d.text((tx, 172), "SakuKampus", font=title, fill=INK)

    # Rule under wordmark
    tw = d.textlength("SakuKampus", font=title)
    d.rectangle([tx, 300, tx + tw, 303], fill=ACCENT)

    d.text((tx, 334), "Cek kelayakan beasiswa", font=tag, fill=DIM)
    d.text((tx, 378), "dari UKT riil, bukan nomor golongan", font=tag, fill=DIM)

    # Bottom band
    d.line([(96, 512), (W - 96, 512)], fill=LINE + (255,), width=2)
    d.text((96, 546), "sakukampus.onheil.fun", font=dom, fill=ACCENT)
    domain_w = d.textlength("sakukampus.onheil.fun", font=dom)
    d.text(
        (96 + domain_w + 28, 552),
        "UKT dari KMA 204/2026  ·  Katalog dari PDDikti",
        font=eyebrow,
        fill=(107, 117, 136),
    )

    im.convert("RGB").save(PUBLIC / "og.png", "PNG", optimize=True)
    print("og.png", (W, H))


def build_icon() -> None:
    APP.mkdir(exist_ok=True)
    logo = Image.open(PUBLIC / "logo.png").convert("RGBA")
    logo.resize((64, 64), Image.LANCZOS).save(APP / "icon.png", "PNG", optimize=True)
    logo.resize((180, 180), Image.LANCZOS).save(PUBLIC / "apple-touch-icon.png", "PNG", optimize=True)
    print("icon.png 64x64 + apple-touch-icon 180x180")


if __name__ == "__main__":
    build_og()
    build_icon()
