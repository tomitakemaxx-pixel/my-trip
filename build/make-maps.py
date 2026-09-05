#!/usr/bin/env python3
"""OpenStreetMap のタイルをつないで、しおり用の地図を描く。

タイルは openstreetmap.org のものを使うため、
- 低頻度でしか取得しない（1枚ずつ間隔を空ける）
- 生成した画像に必ず「© OpenStreetMap contributors」を入れる
の2点を守っている。出力は build/web-img と assets/img の両方から使える
assets/img/ に置く。
"""
import io
import math
import os
import time

import requests
from PIL import Image, ImageDraw, ImageFont

OUT = os.path.join(os.path.dirname(__file__), '..', 'assets', 'img')
CACHE = os.path.join(os.path.dirname(__file__), 'tile-cache')
TILE = 'https://tile.openstreetmap.org/{z}/{x}/{y}.png'
UA = 'FamilyTripItineraryBuilder/1.0 (private family itinerary; low volume)'
FONT_B = '/usr/share/fonts/opentype/noto/NotoSansCJK-Bold.ttc'
FONT_R = '/usr/share/fonts/opentype/noto/NotoSansCJK-Regular.ttc'

S = requests.Session()
S.headers.update({'User-Agent': UA})


# ── タイル座標 ────────────────────────────────────────────
def deg2num(lat, lon, z):
    n = 2.0 ** z
    x = (lon + 180.0) / 360.0 * n
    y = (1.0 - math.log(math.tan(math.radians(lat)) + 1 / math.cos(math.radians(lat))) / math.pi) / 2.0 * n
    return x, y


def fetch_tile(z, x, y):
    os.makedirs(CACHE, exist_ok=True)
    p = os.path.join(CACHE, f'{z}_{x}_{y}.png')
    if os.path.exists(p) and os.path.getsize(p) > 500:
        return Image.open(p).convert('RGB')
    for attempt in range(5):
        r = S.get(TILE.format(z=z, x=x, y=y), timeout=60)
        if r.status_code == 200 and len(r.content) > 500:
            open(p, 'wb').write(r.content)
            time.sleep(0.6)
            return Image.open(io.BytesIO(r.content)).convert('RGB')
        time.sleep(4 * (attempt + 1))
    raise RuntimeError(f'tile {z}/{x}/{y} failed')


def render(lat0, lon0, lat1, lon1, z, pad=0):
    """指定した緯度経度の範囲をタイルからつなぐ。戻り値は (画像, 緯度経度→ピクセル関数)"""
    x0, y0 = deg2num(max(lat0, lat1), min(lon0, lon1), z)
    x1, y1 = deg2num(min(lat0, lat1), max(lon0, lon1), z)
    tx0, ty0 = int(math.floor(x0)) - pad, int(math.floor(y0)) - pad
    tx1, ty1 = int(math.floor(x1)) + pad, int(math.floor(y1)) + pad
    w, h = (tx1 - tx0 + 1) * 256, (ty1 - ty0 + 1) * 256
    im = Image.new('RGB', (w, h), '#eee')
    for tx in range(tx0, tx1 + 1):
        for ty in range(ty0, ty1 + 1):
            im.paste(fetch_tile(z, tx, ty), ((tx - tx0) * 256, (ty - ty0) * 256))

    def to_px(lat, lon):
        x, y = deg2num(lat, lon, z)
        return (x - tx0) * 256, (y - ty0) * 256

    return im, to_px


# ── 描画 ────────────────────────────────────────────────
def soften(im, amount=0.35):
    """地図を少し白っぽくして、上に載せるラベルを読みやすくする。"""
    white = Image.new('RGB', im.size, 'white')
    return Image.blend(im, white, amount)


def draw_map(name, points, z, margin=0.02, soft=0.30, size=(1600, 1000),
             lines=None, title=None):
    mlat, mlon = margin if isinstance(margin, tuple) else (margin, margin)
    lats = [p[1] for p in points]
    lons = [p[2] for p in points]
    im, to_px = render(min(lats) - mlat, min(lons) - mlon,
                       max(lats) + mlat, max(lons) + mlon, z, pad=0)
    im = soften(im, soft)
    d = ImageDraw.Draw(im, 'RGBA')

    if lines:
        for a, b in lines:
            pa, pb = to_px(*a), to_px(*b)
            d.line([pa, pb], fill=(196, 74, 46, 200), width=7)

    fb = ImageFont.truetype(FONT_B, 30)
    for i, pt in enumerate(points):
        label, lat, lon, colour = pt[0], pt[1], pt[2], pt[3]
        dy = pt[4] if len(pt) > 4 else 0
        x, y = to_px(lat, lon)
        r = 13
        d.ellipse([x - r - 3, y - r - 3, x + r + 3, y + r + 3], fill=(255, 255, 255, 235))
        d.ellipse([x - r, y - r, x + r, y + r], fill=colour, outline='white', width=3)
        tw = d.textbbox((0, 0), label, font=fb)
        w, h = tw[2] - tw[0], tw[3] - tw[1]
        lx, ly = x + r + 10, y - h // 2 - 8 + dy
        if lx + w + 18 > im.width:
            lx = x - r - 18 - w
        d.rounded_rectangle([lx - 9, ly - 7, lx + w + 9, ly + h + 13], 9,
                            fill=(255, 255, 255, 238), outline=colour, width=3)
        d.text((lx, ly), label, font=fb, fill=(24, 30, 38))

    # 帰属表示（OSM タイル利用の条件）
    fr = ImageFont.truetype(FONT_R, 20)
    cred = '© OpenStreetMap contributors'
    cb = d.textbbox((0, 0), cred, font=fr)
    d.rectangle([im.width - (cb[2] - cb[0]) - 20, im.height - (cb[3] - cb[1]) - 18,
                 im.width, im.height], fill=(255, 255, 255, 220))
    d.text((im.width - (cb[2] - cb[0]) - 12, im.height - (cb[3] - cb[1]) - 12),
           cred, font=fr, fill=(70, 80, 90))

    if title:
        ft = ImageFont.truetype(FONT_B, 34)
        tb = d.textbbox((0, 0), title, font=ft)
        d.rounded_rectangle([18, 18, 18 + (tb[2] - tb[0]) + 34, 18 + (tb[3] - tb[1]) + 28], 11,
                            fill=(23, 57, 79, 236))
        d.text((35, 30), title, font=ft, fill='white')

    im.thumbnail(size, Image.LANCZOS)
    os.makedirs(OUT, exist_ok=True)
    p = os.path.join(OUT, name + '.jpg')
    im.convert('RGB').save(p, 'JPEG', quality=84, optimize=True, progressive=True)
    print(f'{name}: {im.size[0]}x{im.size[1]} {os.path.getsize(p)//1024}KB')


# ── 座標（駅・山は OSM/Nominatim で確認済み） ──────────────
KIBA = (35.6694, 139.8065)
IKEBUKURO = (35.7295, 139.7100)
YOKOZE = (35.9857, 139.0985)
SEIBU_CHICHIBU = (35.9896, 139.0840)
MATSURI = (35.9904, 139.0837)
BUKO = (35.9516, 139.0978)
MUSE = (35.9930, 139.0518)
TABIDACHI = (36.0036, 139.0604)

# ミューズパーク園内（Overpass で取得。公園は南北に約3km ある）
PICA = (35.98779, 139.04838)          # PICA秩父（園の南のはし）
JUNE = (35.98754, 139.04788)          # 樹音の湯（PICAのとなり）
SPORTS = (35.98990, 139.04790)        # スポーツの森（テニスコート一帯。バス停はこのあたり）
MP_CENTER = (35.99374, 139.05309)     # ミューズパーク中央バス停
ONGAKUDO = (35.99716, 139.05498)      # 音楽堂・野外ステージ
SHIBAFU = (35.99874, 139.05767)       # 芝生広場

# 西武秩父駅まわり（Nominatim で取得）
MATSURI_YU = (35.99039, 139.08366)    # 祭の湯
OHANABATAKE = (35.99251, 139.08376)   # 御花畑駅（SLが停まる）
CHICHIBU_JINJA = (35.99758, 139.08424)
MATSURI_KAIKAN = (35.99721, 139.08527)
CHICHIBU_STA = (35.99863, 139.08566)  # 秩父鉄道 秩父駅
MICHINOEKI = (35.99732, 139.08846)
KOEN_BASHI = (36.00176, 139.07556)    # 秩父公園橋（ぐるりん号が荒川を渡るところ）

RED, BLUE, GREEN, GOLD, INK = '#C0452B', '#2C5F8A', '#2F6B52', '#B5851F', '#17394F'

if __name__ == '__main__':
    # ① 東京 → 秩父の広域
    draw_map('map_wide', [
        ('木場（自宅）', *KIBA, RED),
        ('池袋', *IKEBUKURO, BLUE),
        ('横瀬', *YOKOZE, GREEN),
        ('西武秩父', *SEIBU_CHICHIBU, INK),
    ], z=11, margin=0.05, soft=0.34, size=(1700, 1300),
        lines=[(KIBA, IKEBUKURO), (IKEBUKURO, YOKOZE)],
        title='東京 → 秩父　特急ラビューで約80分')

    # ② 秩父エリア
    draw_map('map_chichibu', [
        ('横瀬駅', *YOKOZE, GREEN),
        ('西武秩父駅／祭の湯', *SEIBU_CHICHIBU, INK),
        ('PICA秩父（泊）', *PICA, BLUE),
        ('旅立ちの丘・展望ちびっこ広場', *TABIDACHI, GOLD),
        ('武甲山 1,304m', *BUKO, RED),
    ], z=14, margin=(0.006, 0.030), soft=0.30, size=(1700, 1250),
        title='秩父エリアの位置関係')

    # ③ 2日目・ミューズパークの中（南北に細長い）
    draw_map('map_day2_park', [
        ('PICA秩父（泊）・樹音の湯', *PICA, RED),
        ('スポーツの森（バス停）', *SPORTS, GOLD, -6),
        ('ミューズパーク中央', *MP_CENTER, BLUE),
        ('音楽堂・野外ステージ', *ONGAKUDO, GREEN),
        ('芝生広場', *SHIBAFU, GREEN),
        ('旅立ちの丘・展望ちびっこ広場', *TABIDACHI, GOLD),
    ], z=16, margin=(0.0016, 0.0030), soft=0.34, size=(1700, 1500),
        lines=[(PICA, SPORTS), (SPORTS, MP_CENTER), (MP_CENTER, ONGAKUDO),
               (ONGAKUDO, SHIBAFU), (SHIBAFU, TABIDACHI)],
        title='2日目①　ミューズパークの中（南北に細長い公園です）')

    # ④ 2日目・西武秩父駅のまわり
    draw_map('map_day2_town', [
        ('西武秩父駅・祭の湯', *MATSURI_YU, RED),
        ('御花畑駅（SL）', *OHANABATAKE, GOLD),
        ('秩父まつり会館', *MATSURI_KAIKAN, BLUE),
        ('秩父神社', *CHICHIBU_JINJA, GREEN, -34),
        ('秩父駅', *CHICHIBU_STA, INK),
        ('道の駅ちちぶ', *MICHINOEKI, GOLD, 26),
    ], z=17, margin=(0.0010, 0.0022), soft=0.34, size=(1700, 1500),
        lines=[(MATSURI_YU, OHANABATAKE), (OHANABATAKE, MATSURI_KAIKAN)],
        title='2日目②　西武秩父駅のまわり')

    # ⑤ 2日目・ぐるりん号でパークから駅へ出るまでの動線
    draw_map('map_day2_route', [
        ('PICA秩父（泊）', *PICA, RED, -6),
        ('スポーツの森（乗る）', *SPORTS, GOLD, 22),
        ('旅立ちの丘・展望ちびっこ広場', *TABIDACHI, GOLD),
        ('秩父公園橋', *KOEN_BASHI, BLUE),
        ('西武秩父駅・祭の湯', *SEIBU_CHICHIBU, INK),
    ], z=15, margin=(0.006, 0.008), soft=0.36, size=(1700, 1200),
        lines=[(PICA, SPORTS), (SPORTS, MP_CENTER), (MP_CENTER, TABIDACHI),
               (TABIDACHI, KOEN_BASHI), (KOEN_BASHI, SEIBU_CHICHIBU)],
        title='2日目③　ぐるりん号の動線　パーク → 荒川を渡る → 西武秩父駅')
