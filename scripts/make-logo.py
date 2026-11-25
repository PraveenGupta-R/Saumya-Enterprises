"""Build transparent logo variants from the client's original logo (cream emblem on dark teal).

Usage: python scripts/make-logo.py <original-logo-file>
Outputs to public/assets/logo/.
"""
import sys
from pathlib import Path
from PIL import Image, ImageFilter

src = Path(sys.argv[1])
out = Path(__file__).resolve().parent.parent / "public" / "assets" / "logo"
out.mkdir(parents=True, exist_ok=True)

img = Image.open(src).convert("RGB")
lum = img.convert("L")
bg = lum.getpixel((5, 5))  # flat background colour
fg = max(lum.getdata())     # brightest pixel = cream emblem
scale = 255.0 / max(1, fg - bg)
alpha = lum.point(lambda v: max(0, min(255, int((v - bg) * scale))))

box = alpha.point(lambda v: 255 if v > 20 else 0).getbbox()
pad = 40
box = (max(0, box[0] - pad), max(0, box[1] - pad), min(img.width, box[2] + pad), min(img.height, box[3] + pad))
alpha = alpha.crop(box)


def make(color, a, name, upscale=1):
    if upscale != 1:
        a = a.resize((a.width * upscale, a.height * upscale), Image.LANCZOS)
    solid = Image.new("RGBA", a.size, color + (255,))
    solid.putalpha(a)
    solid.save(out / name, optimize=True)
    return solid.size


INK = (6, 27, 30)
CREAM = (244, 236, 222)
ORANGE = (217, 106, 11)

# Regular weight (large display) and a bolder weight so hairlines survive at header size.
bold = alpha.filter(ImageFilter.MaxFilter(5)).filter(ImageFilter.GaussianBlur(1.2))
print("dark       ", make(INK, alpha, "logo-dark.png", 2))
print("light      ", make(CREAM, alpha, "logo-light.png", 2))
print("dark-bold  ", make(INK, bold, "logo-dark-bold.png"))
print("light-bold ", make(CREAM, bold, "logo-light-bold.png"))
print("orange     ", make(ORANGE, bold, "logo-orange.png"))

# Original file kept as supplied
Image.open(src).save(out / "logo-original.webp", "WEBP", quality=95)

# Favicon: cream emblem on dark rounded square
size = 256
tile = Image.new("RGBA", (size, size), (0, 0, 0, 0))
from PIL import ImageDraw
ImageDraw.Draw(tile).rounded_rectangle((0, 0, size - 1, size - 1), radius=56, fill=INK + (255,))
emb = Image.new("RGBA", bold.size, CREAM + (255,))
emb.putalpha(bold)
emb.thumbnail((size - 60, size - 60), Image.LANCZOS)
tile.alpha_composite(emb, ((size - emb.width) // 2, (size - emb.height) // 2))
tile.save(out / "favicon.png", optimize=True)
tile.resize((48, 48), Image.LANCZOS).save(out.parent.parent / "favicon.ico", sizes=[(48, 48), (32, 32), (16, 16)])
print("done")
