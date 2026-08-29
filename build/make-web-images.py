#!/usr/bin/env python3
"""Web版しおり用に、画像を小さく作り直して build/web-img/ に置く。
CSP の都合で HTML には data URI として埋め込むため、印刷用より小さくする。"""
from PIL import Image
import os

SRC = os.path.join(os.path.dirname(__file__), '..', 'assets', 'img')
DST = os.path.join(os.path.dirname(__file__), 'web-img')
os.makedirs(DST, exist_ok=True)
WIDTHS = {'cover_banner': 1500}
DEFAULT = 900
Q = 74

total = 0
for f in sorted(os.listdir(SRC)):
    if not f.endswith('.jpg'):
        continue
    key = f[:-4]
    im = Image.open(os.path.join(SRC, f)).convert('RGB')
    mx = WIDTHS.get(key, DEFAULT)
    if im.width > mx:
        im = im.resize((mx, round(im.height * mx / im.width)), Image.LANCZOS)
    out = os.path.join(DST, f)
    im.save(out, 'JPEG', quality=Q, optimize=True, progressive=True)
    sz = os.path.getsize(out)
    total += sz
    print(f"{key:16s} {im.width:5d}x{im.height:<5d} {sz//1024:4d}KB")
print(f"\ntotal {total/1024/1024:.2f}MB  -> base64 approx {total*4/3/1024/1024:.2f}MB")
