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

dist/秩父ファミリー旅行しおり_ver02.docx      A4縦37ページ / Yu Gothic / 作成者「髙山浩和」
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

## 秩父版 ver.02 の内容

妻のご両親が加わって6名になったこと、特急券を往復6名ぶん購入したことを反映しています。

- Ⅰ章に **座席図** を入れました（往路4号車／復路5号車。誰がどこに座るか）
- Ⅸ章を **「出発までにやること」** に組み替え、日付つきのチェックリストを先頭に置きました
- 車内で購入確認を求められたときは **Smoozの「購入内容の確認」画面** を見せる旨を明記
  （購入完了メールの画面や、その印刷では乗車できないため）

### 運賃まわりの検証と訂正

「4歳以下でも乗車券が要るのか」を西武鉄道の一次情報で確かめ、Ⅰ章(3)を書き直しました。

- **要ります。**[旅客の年令区分](https://www.seiburailway.jp/railway/ticket/ticket/ticketrule/)に
  「特急列車・座席指定列車の座席を幼児、または乳児だけで使用されるとき」は
  **小児運賃・料金**が必要とあり、特急料金だけでなく運賃（乗車券）も含みます
- 逆に膝の上なら両方とも0円でした。席を取った時点で小児あつかいになります
- 大人運賃を **2026年3月14日改定後の公式運賃表** で取り直しました。
  池袋→横瀬 IC 781円／池袋→西武秩父 IC 800円（改定前の値を載せていました）
- 東京メトロ 木場⇔池袋は **IC 252円／きっぷ 260円**。260円をIC運賃と書いていたのを訂正
- 「幼児は小児用PASMOを作れない」と書いていたのは裏が取れず削除。
  [PASMO公式](https://www.pasmo.co.jp/buy/kids/)に下限年齢の定めはありません

### Ⅹ章「2日目をどうするか」を追加

「祭の湯に入らずフードコートだけ」という ver.02 の推奨は、**大人2名の前提で書いたもの**でした。
妻のご両親が加わって大人4名になったので、一次情報を取り直して組み替えています。

- **特急券は変更できる**（発車前・空席があれば2回まで・手数料なし）。
  100円は払いもどしのときだけで、しかも1席につき。[Smoozご利用案内](https://www.seiburailway.jp/railway/reservedtrain/smooz/info/)
- **樹音の湯には露天風呂も水風呂もない**（大浴場とサウナのみ）。祭の湯は露天4種＋内湯4種。
  同じ「風呂」でも別ものなので、比較表をⅩ章(3)に入れました
- **SLパレオエクスプレス**が御花畑駅を14:33に出ます。9/21・9/22とも運転日
  （[公式カレンダー](https://www.chichibu-railway.co.jp/slpaleo/calendar.html)の凡例で確認）
- **秩父漫遊きっぷ**（池袋発 大人2,380円）＝往復乗車券＋高麗〜西武秩父2日フリー＋祭の湯の入館券。
  温泉に入っても入らなくても、乗車券を別に買うより安くなります
- 復路の候補を土休日ダイヤの公式PDFから起こして表にしました（14:24／14:49／15:24／16:24／17:24）
