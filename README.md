# 旅のしおり

2つの旅のしおりを、同じ仕組みで **Word / PDF / Web** の3形態に組んでいます。

| 旅 | 日程 | 人数 |
|---|---|---|
| 三十路会 佐賀・福岡旅行 | 2027年3月20日(土)〜22日(月・振休) 2泊3日 | 友人5人 |
| 秩父ファミリー旅行 | 2026年9月21日(月・敬老の日)〜22日(火・国民の休日) 1泊2日 | 髙山家6人 |

## 成果物

```
dist/三十路会_佐賀福岡旅行しおり_ver01.docx   A4縦26ページ / Yu Gothic / 作成者「高山」
dist/三十路会_佐賀福岡旅行しおり_ver01.pdf    LINE配布用
dist/shiori-web.html                          スマホ用（写真内蔵の単一HTML）

dist/秩父ファミリー旅行しおり_ver02.docx      A4縦29ページ / Yu Gothic / 作成者「髙山浩和」
dist/秩父ファミリー旅行しおり_ver02.pdf       配布用
dist/chichibu-web.html                        スマホ用（写真・地図内蔵の単一HTML）
```

## 仕組み

原稿は `build/content*.js` の1か所にあり、Word版とWeb版の両方がそこから生成されます。
**文面を直すときは content ファイルだけを編集してください。**両方の版が自動で揃います。

```
build/
  content.js              佐賀・福岡の原稿
  content-chichibu.js     秩父の原稿
  docx-kit.js             Word組版の共通部品（両方から利用）
  web-kit.js              Web版の共通部品（両方から利用）
  build-shiori.js         佐賀・福岡 → docx
  build-chichibu.js       秩父 → docx
  build-web.js            佐賀・福岡 → html
  build-web-chichibu.js   秩父 → html
  optimize-images.py      assets/img の写真を適正サイズへ（処理済みは .optimised.json で記録）
  make-web-images.py      Web版用にさらに小さく（build/web-img へ）
  make-maps.py            OpenStreetMap のタイルから地図を作る
```

## ビルド

```bash
npm install                     # docx (npm)
pip install Pillow requests     # 画像と地図の生成に使用

# Word版
node build/build-shiori.js
node build/build-chichibu.js

# PDF（LibreOffice。日本語グリフのため JP フォントを明示して書き出す）
SHIORI_FONT="Noto Sans CJK JP" SHIORI_OUT="_tmp.docx" node build/build-chichibu.js
soffice --headless --convert-to pdf --outdir dist dist/_tmp.docx
mv dist/_tmp.pdf "dist/秩父ファミリー旅行しおり_ver02.pdf" && rm dist/_tmp.docx

# Web版
python3 build/make-web-images.py
node build/build-web.js
node build/build-web-chichibu.js

# 地図を作り直すとき
python3 build/make-maps.py
```

`SHIORI_FONT` を指定しなければ **Yu Gothic** で組まれます（配布する .docx はこちら）。
PDFのときだけ JP フォントを指定するのは、LibreOffice が "Yu Gothic" の代替に
Noto Sans CJK **SC**（簡体字）を選び、一部の漢字が中国語字形になってしまうためです。

## 写真と地図

出どころは3種類です。一覧は [`IMAGE_CREDITS.md`](IMAGE_CREDITS.md) にあります。

1. **各施設の公式サイト** — らかんの湯、佐賀牛、御船山楽園の夜桜、小松沢レジャー農園、
   PICA秩父、秩父ミューズパーク、祭の湯など。施設そのものを正確に伝えるために使っています。
   著作権は各施設にあり、私的利用の範囲での掲載です（再配布はしません）。
2. **ウィキメディア・コモンズ** — 駅、街の風景、特急ラビュー、武甲山、食べ物など。
3. **OpenStreetMap** — 秩父版の地図2枚は `build/make-maps.py` でタイルから生成しています。
   地図データ © OpenStreetMap contributors（ODbL）。

画像を足したら `python3 build/optimize-images.py` を実行してください。
処理済みのキーは `assets/img/.optimised.json` に記録され、二重圧縮されません。

## 秩父版について：元の計画書からの変更

もとの計画書（`chichibu_trip_20260921_22.md`）を各施設の公式サイトで検証したところ、
16点の相違が見つかりました。全部しおりのⅤ章に表で載せています。主なものは次のとおりです。

- **樹音の湯は宿泊者無料**（計画書は1,250円を計上）。タオルも無料貸出
- **農園の開園は9:45**、お食事処は11:00〜15:00（L.O.14:00）
- **マスのつかみ取りは10月末まで**（公式パンフレット）→ 9/21は問題なし
- **営業カレンダー上、9/21・9/22とも営業予定**（ぶどう狩り可・お食事処営業）
- **樹音の湯に朝風呂 7:30〜9:30 がある**（計画書に記載なし）
- **祭の湯は幼児（2歳以下）無料**、こどもは3歳〜小学生
- スカイトレインは素の「火曜日定休」で祝日の例外がなく、9/22は休みと想定すべき

あわせて、4歳・2歳連れに合わせて次の組み替えを提案しています。

- 昼も夜もBBQになっていたので、**昼は単品に落とす**
- おむつの子は湯船に入れないため、**朝風呂で済ませて祭の湯は食事のみ**にする
- **展望ちびっこ広場をオプションから推奨に格上げ**（この年齢にいちばん刺さる）
