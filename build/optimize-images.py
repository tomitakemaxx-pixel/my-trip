#!/usr/bin/env python3
"""assets/img の写真を、しおり用に適正サイズへ縮小する。
Word で最大 6.77 インチ表示 → 1300px あれば約190dpi 相当で十分。"""
from PIL import Image, ImageOps
import os, json, sys

IMG = os.path.join(os.path.dirname(__file__), '..', 'assets', 'img')
MAXW = {'cover_romon': 2000, 'mf_sakura_day': 2000, 'mf_sakura_night': 2000,
        'cb_bukozan': 2000, 'cb_km_pamphlet': 1200, 'cb_km_farmmap': 1400,
        'cb_km_calendar': 1400, 'cb_mp_map': 2200, 'map_wide': 1600, 'map_chichibu': 1400}
DEFAULT_MAX = 1300
QUALITY = 82
DONE = os.path.join(IMG, '.optimised.json')   # 二重圧縮を避けるための処理済み記録

def optimise():
    done = json.load(open(DONE)) if os.path.exists(DONE) else []
    total_before = total_after = 0
    for f in sorted(os.listdir(IMG)):
        if not f.endswith('.jpg'):
            continue
        p = os.path.join(IMG, f)
        key = f[:-4]
        if key in done:
            continue
        before = os.path.getsize(p)
        im = Image.open(p)
        im = ImageOps.exif_transpose(im).convert('RGB')
        mx = MAXW.get(key, DEFAULT_MAX)
        if im.width > mx:
            im = im.resize((mx, round(im.height * mx / im.width)), Image.LANCZOS)
        im.save(p, 'JPEG', quality=QUALITY, optimize=True, progressive=True)
        after = os.path.getsize(p)
        total_before += before; total_after += after
        done.append(key)
        print(f"{key:18s} {im.width:5d}x{im.height:<5d} {before//1024:5d}KB -> {after//1024:5d}KB")
    json.dump(sorted(set(done)), open(DONE, 'w'), indent=1)
    print(f"\ntotal {total_before/1024/1024:.1f}MB -> {total_after/1024/1024:.1f}MB")

def crop_banner(src_key, dst_key, ratio=2.55, top_frac=0.30, quality=86):
    """横長バナーを切り出す（表紙用）。top_frac は上を何割落とすか。"""
    src = Image.open(os.path.join(IMG, src_key + '.jpg')).convert('RGB')
    h = round(src.width / ratio)
    top = max(0, min(round(src.height * top_frac), src.height - h))
    out = src.crop((0, top, src.width, top + h))
    out.save(os.path.join(IMG, dst_key + '.jpg'), 'JPEG', quality=quality, optimize=True, progressive=True)
    print(dst_key, out.size)

def banner():
    crop_banner('cover_romon', 'cover_banner', top_frac=0.30)
    crop_banner('mf_sakura_day', 'cover_sakura', top_frac=0.22)
    crop_banner('mf_sakura_night', 'cover_sakura_night', top_frac=0.10)
    crop_banner('cb_bukozan', 'cb_cover', ratio=2.45, top_frac=0.26)

if __name__ == '__main__':
    optimise()
    banner()
