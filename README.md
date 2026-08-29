# 三十路会 佐賀・福岡旅行しおり

2027年3月20日(土)〜22日(月・振休)、2泊3日の旅のしおり一式です。
引き継ぎ資料（`Ⅰ〜Ⅹ`）の仕様に沿って、**Word / PDF / Web** の3形態を同じ原稿から生成しています。

作成：高山

## 成果物

| ファイル | 用途 |
|---|---|
| `dist/三十路会_佐賀福岡旅行しおり_ver01.docx` | 編集用。A4縦・26ページ・Yu Gothic・文書プロパティの作成者は「高山」 |
| `dist/三十路会_佐賀福岡旅行しおり_ver01.pdf` | LINEグループ配布用 |
| `dist/shiori-web.html` | 旅行中にスマホで開く用（写真は data URI で内蔵、単一ファイル） |

## 構成

```
表紙（御船山楽園の夜桜／三大目玉／2023年との差分）
Ⅰ. 参加メンバーと集合について   ← 日程より前
Ⅱ. 日程　(1) 3/20  (2) 3/21  (3) 3/22
Ⅲ. 予約の分担
Ⅳ. 見積
Ⅴ. 持ち物・注意事項
Ⅵ. 連絡先
Ⅶ. 現時点で確定していないこと（要確認リスト）
Ⅷ. 写真について（クレジット）
```

見出しは `Ⅰ / Ⅱ / Ⅲ` → `(1) (2) (3)` → `① ② ③` の階層です。
Day1（茜）／Day2（藍）／Day3（松）で色を変えています。

## ビルド

原稿は `build/content.js` の1か所だけにあり、Word版とWeb版の両方がそこから生成されます。
**原稿を直すときは `build/content.js` を編集してください。**

```bash
npm install                        # docx (npm)
python3 -m pip install Pillow      # 画像の縮小に使用

# Word版
node build/build-shiori.js

# PDF（LibreOffice。日本語グリフのため JP フォントを明示して書き出す）
SHIORI_FONT="Noto Sans CJK JP" SHIORI_OUT="_pdfsrc.docx" node build/build-shiori.js
soffice --headless --convert-to pdf --outdir dist dist/_pdfsrc.docx
mv dist/_pdfsrc.pdf "dist/三十路会_佐賀福岡旅行しおり_ver01.pdf" && rm dist/_pdfsrc.docx

# Web版
python3 build/make-web-images.py && node build/build-web.js
```

`SHIORI_FONT` を指定しない場合は **Yu Gothic** で組まれます（配布する .docx はこちら）。
PDFを書き出すときだけ JP フォントを指定するのは、LibreOffice が "Yu Gothic" の代替に
Noto Sans CJK **SC**（簡体字）を選んでしまい、一部の漢字が中国語字形になるためです。

## 写真について

出所は2つです。一覧は [`IMAGE_CREDITS.md`](IMAGE_CREDITS.md) を参照してください。

1. **各施設の公式サイト**（25点）— らかんの湯の薪サウナ・水風呂・外気浴、佐賀牛のセイロ蒸し、
   楽園鍋、別邸内庫所、御船山楽園の夜桜、カンデオのスカイスパ、喜水丸の料理など。
   施設そのものを正確に伝えるため、各施設が公開している写真を使っています。
   著作権は各施設に帰属し、私的利用の範囲での掲載です（再配布はしません）。
2. **ウィキメディア・コモンズ**（27点）— 博多駅・福岡空港・成田・787系・屋台・中洲など、
   街の風景。自由利用可能なライセンスの画像です。

画像を追加・差し替えたら `python3 build/optimize-images.py` を実行してください。
処理済みのキーは `assets/img/.optimised.json` に記録され、二重圧縮されません。

## 確定していないこと

2027年3月の旅程のため、以下は現時点で確定できません。しおり本文にも（要確認）と明記しています。

- 特急リレーかもめの時刻（2027年3月のダイヤ改正で数分ずれる可能性）
- 御船山楽園 花まつりの2027年の期間（2026年は3/13-4/5、夜間18:30-22:00）
- 送迎バスの予約要否、らかんの湯の男女入替時間、各店の祝日営業
- 博多⇔武雄温泉の運賃

確認が取れ次第、`build/content.js` を更新して版を上げてください。
