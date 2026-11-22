from pathlib import Path
from PIL import Image

source = Path("public/dokumentasi/rem-hands.png")
target = source.with_name("rem-hands-layer.png")
image = Image.open(source).convert("RGBA")
alpha = image.getchannel("A")
mask = alpha.point(lambda value: 255 if value >= 24 else 0)
bounds = mask.getbbox()
if bounds is None:
    raise ValueError("Hand layer has no visible pixels")
image.putalpha(alpha.point(lambda value: 0 if value < 24 else value))
image.crop(bounds).save(target, optimize=True)
print(f"Wrote {target} ({bounds[2] - bounds[0]}x{bounds[3] - bounds[1]})")
