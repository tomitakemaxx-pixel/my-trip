#!/usr/bin/env python3
"""assets/img の写真を、しおり用に適正サイズへ縮小する。
Word で最大 6.77 インチ表示 → 1300px あれば約190dpi 相当で十分。"""
from PIL import Image, ImageOps
import os, json, sys

IMG = os.path.join(os.path.dirname(__file__), '..', 'assets', 'img')
MAXW = {'cover_romon': 2000}   # 表紙は少し大きめ
DEFAULT_MAX = 1300
QUALITY = 82

def optimise():
    total_before = total_after = 0
    for f in sorted(os.listdir(IMG)):
        if not f.endswith('.jpg'):
            continue
        p = os.path.join(IMG, f)
        key = f[:-4]
        before = os.path.getsize(p)
        im = Image.open(p)
        im = ImageOps.exif_transpose(im).convert('RGB')
        mx = MAXW.get(key, DEFAULT_MAX)
        if im.width > mx:
            im = im.resize((mx, round(im.height * mx / im.width)), Image.LANCZOS)
        im.save(p, 'JPEG', quality=QUALITY, optimize=True, progressive=True)
        after = os.path.getsize(p)
        total_before += before; total_after += after
        print(f"{key:16s} {im.width:5d}x{im.height:<5d} {before//1024:5d}KB -> {after//1024:5d}KB")
    print(f"\ntotal {total_before//1024//1024}MB -> {total_after//1024//1024}MB")

def banner():
    """表紙用に楼門の写真を横長バナーへ切り出す。"""
    src = Image.open(os.path.join(IMG, 'cover_romon.jpg')).convert('RGB')
    ratio = 2.55
    h = round(src.width / ratio)
    top = round(src.height * 0.30)               # 空を落として楼門を中央に
    top = max(0, min(top, src.height - h))
    out = src.crop((0, top, src.width, top + h))
    out.save(os.path.join(IMG, 'cover_banner.jpg'), 'JPEG', quality=86, optimize=True, progressive=True)
    print('cover_banner', out.size)

if __name__ == '__main__':
    optimise()
    banner()
