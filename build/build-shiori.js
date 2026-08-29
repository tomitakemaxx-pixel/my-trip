// 三十路会 佐賀・福岡旅行しおり — Word ビルダー
//   node build/build-shiori.js
// A4縦 / 日本語フォント統一 / 見出しは Ⅰ・(1)・① / 作成者「高山」

const fs = require('fs');
const path = require('path');
const {
  Document, Packer, Paragraph, TextRun, Table, TableRow, TableCell,
  WidthType, ShadingType, AlignmentType, VerticalAlign, BorderStyle,
  PageBreak, Footer, PageNumber, TabStopType, TabStopPosition,
} = require('docx');
const { makeKit } = require('./docx-kit.js');

const D = require('./content.js');
const { C } = D;

const ROOT = path.join(__dirname, '..');
const IMG = path.join(ROOT, 'assets', 'img');
const OUT = path.join(ROOT, 'dist');
const FONT_JA = process.env.SHIORI_FONT || 'Yu Gothic';
const FONT = { ascii: FONT_JA, eastAsia: FONT_JA, hAnsi: FONT_JA, cs: FONT_JA };

const K = makeKit(C, FONT, IMG);
const {
  PAGE_W, MARGIN, CONTENT_DXA, CONTENT_IN, TIME_COL, BODY_COL,
  img, run, P, spacer, none, noBorders, line, cell, table,
  picture, caption, figure, figurePair, chapter, sub, bullet, circled,
  dataTable, noteBox, dayPalette, slotRow, bannerRow, highlightRow,
  freetimeRow, renderDay, dayHeader,
} = K;

// ═══════════════════════════════════════════════════════════
//  表紙
// ═══════════════════════════════════════════════════════════
function cover() {
  const out = [];
  out.push(...figure('cover_sakura_night', CONTENT_IN, null, { before: 0 }));
  out.push(spacer(40));

  out.push(table([new TableRow({
    children: [cell([
      P('三十路会 ／ 第4回', { size: 18, bold: true, color: C.gold, align: AlignmentType.CENTER, after: 90, line: 240 }),
      P('佐賀・福岡旅行（案）', { size: 52, bold: true, color: C.brand, align: AlignmentType.CENTER, after: 80, line: 560 }),
      P('武雄温泉 らかんの湯 ／ 博多・中洲', { size: 21, bold: true, color: C.brandMid, align: AlignmentType.CENTER, after: 110, line: 280 }),
      P('2027年3月20日(土) − 22日(月・振休)　2泊3日', { size: 22, bold: true, color: C.ink, align: AlignmentType.CENTER, after: 0, line: 290 }),
    ], { w: CONTENT_DXA, fill: C.brandBg, mt: 260, mb: 260, ml: 200, mr: 200,
      borders: { top: line(C.brand, 12), bottom: line(C.brand, 12), left: none, right: none } })],
  })], { cols: [CONTENT_DXA] }));
  out.push(spacer(150));

  out.push(P('この旅の三大目玉', { size: 22, bold: true, color: C.brand, align: AlignmentType.CENTER, after: 100, line: 280 }));

  const gap = 140, cw = (CONTENT_DXA - gap * 2) / 3;
  const card = (mark, t, subLines, color, bg) => cell([
    P(mark, { size: 30, align: AlignmentType.CENTER, after: 30, line: 360, color }),
    P(t, { size: 19, bold: true, color, align: AlignmentType.CENTER, after: 45, line: 250 }),
    ...subLines.map((s, i) => P(s, {
      size: 15, color: C.ink2, align: AlignmentType.CENTER,
      after: i === subLines.length - 1 ? 0 : 10, line: 230,
    })),
  ], { w: cw, fill: bg, mt: 130, mb: 130, ml: 90, mr: 90,
    borders: { top: line(color, 14), bottom: none, left: none, right: none } });

  out.push(table([new TableRow({
    children: [
      card('🔥', '復活した薪サウナ', ['2023年は火災で入れず。', '2024年3月に復活'], C.d1, C.d1bg),
      cell(P('', { after: 0 }), { w: gap, ml: 0, mr: 0 }),
      card('🥩', '佐賀牛A5＋楽園鍋', ['プレミアム会席に', 'グレードアップ'], C.gold, C.goldBg),
      cell(P('', { after: 0 }), { w: gap, ml: 0, mr: 0 }),
      card('🌸', '御船山楽園の夜桜', ['九州最大級のライトアップ。', '宿泊者は入園無料'], C.d3, C.d3bg),
    ],
  })], { cols: [cw, gap, cw, gap, cw] }));

  out.push(spacer(170));
  out.push(P('2023年7月の福岡旅行と、ここが違います', { size: 19, bold: true, color: C.brand, after: 80, line: 260 }));
  out.push(dataTable(D.DIFF.head, D.DIFF.rows, [2500, 3123, 4123], { color: C.brand }));

  out.push(spacer(150));
  out.push(P('作成：高山　／　2026年8月29日　ver.01', { size: 17, color: C.muted, align: AlignmentType.CENTER, after: 0, line: 250 }));
  out.push(new Paragraph({ children: [new PageBreak()] }));
  return out;
}

// ═══════════════════════════════════════════════════════════
//  Ⅰ. 参加メンバーと集合について
// ═══════════════════════════════════════════════════════════
function chapter1() {
  const out = [];
  out.push(...chapter('Ⅰ', '参加メンバーと集合について'));

  out.push(noteBox([
    '今回は飛行機を各自で手配します。同じ便に乗る必要はありません。',
    '空港での集合はありません。全体の集合は 3月20日 11:00・博多駅です。',
    '1日だけの参加、途中合流、途中離脱、いずれも歓迎です。',
  ], { title: '最初に、ここだけ読んでください', color: C.brand, bg: C.brandBg }));
  out.push(spacer(160));

  out.push(sub('(1) 参加メンバー'));
  out.push(dataTable(D.MEMBERS.head, D.MEMBERS.rows, [2600, 2600, 4546], { color: C.brand }));

  out.push(sub('(2) 飛行機は各自手配です'));
  out.push(bullet('航空券は各自で予約するため、乗る便も座席もバラバラです。同じ便に乗る必要はありません。'));
  out.push(bullet('幹事（高山）が乗る便は下記のとおりですが、あくまで参考情報です。'));
  out.push(spacer(80));
  out.push(dataTable(D.FLIGHTS.head, D.FLIGHTS.rows, [1100, 2500, 4646, 1500], { color: C.brand }));
  out.push(spacer(110));
  out.push(bullet('近くの席に座りたい人は、予約時に1列目付近を指定してください（1列目は席数が限られ、追加料金がかかる場合があります）。'));
  out.push(bullet('浅野は福岡在住のため、飛行機の手配はありません。'));

  out.push(sub('(3) 全体の集合は「3月20日 11:00 博多駅」です'));
  out.push(spacer(30));
  out.push(table([new TableRow({
    children: [cell([
      P('3月20日(土)　11:00　博多駅', { size: 26, bold: true, color: C.white, align: AlignmentType.CENTER, after: 40, line: 300 }),
      P('空港での集合はありません', { size: 18, bold: true, color: C.white, align: AlignmentType.CENTER, after: 0, line: 250 }),
    ], { w: CONTENT_DXA, fill: C.brand, mt: 170, mb: 170 })],
  })], { cols: [CONTENT_DXA] }));
  out.push(spacer(120));
  out.push(bullet('東京組は各自の便で福岡空港に到着し、地下鉄で博多駅へ向かってください（福岡空港駅から博多駅まで2駅・約6分）。'));
  out.push(bullet('浅野は天神から博多駅へ直接来ます。'));
  out.push(bullet('全員が博多駅に11:00集合し、そこから昼食 → 武雄温泉へ移動します。'));
  out.push(spacer(80));
  out.push(...figure('hakata_station', 6.4, '博多駅。地下鉄空港線で福岡空港から2駅・約6分', { maxH: 3.5 }));

  out.push(sub('(4) 途中合流・途中離脱について'));
  const patt = [
    ['朝が早すぎる人', [
      '昼の便（例：ジェットスター GK509　11:30成田発 → 13:55福岡着）でも参加できます。',
      '博多14:35頃発の特急に乗れば、夕食18:00に間に合います。サウナは夜の部から合流。',
    ]],
    ['武雄温泉から合流する人', [
      '武雄温泉駅に13:55集合でも可（2023年に浅野が使った方式）。',
    ]],
    ['途中で帰る人（森本を想定）', [
      '案A：3/21の夜、福岡発の最終便で帰京（カンデオ泊なし・もつ鍋まで参加）。',
      '案B：3/21はカンデオに泊まり、3/22の朝に離脱。',
    ]],
  ];
  patt.forEach(([t, ls], i) => {
    const kids = [P([
      run(circled[i] + '　', { size: 20, bold: true, color: C.brand }),
      run(t, { size: 20, bold: true, color: C.brand }),
    ], { after: 50, line: 260 })];
    ls.forEach((l, j) => kids.push(P(l, { size: 17, color: C.ink2, after: j === ls.length - 1 ? 0 : 26, line: 258 })));
    out.push(table([new TableRow({
      children: [cell(kids, { w: CONTENT_DXA, fill: i % 2 ? C.paper : C.brandBg, ml: 220, mr: 200, mt: 130, mb: 130,
        borders: { left: line(C.brandMid, 14), top: none, right: none, bottom: none } })],
    })], { cols: [CONTENT_DXA] }));
    out.push(spacer(70));
  });
  out.push(spacer(60));
  out.push(P('どちらでも成立します。1日だけの参加も歓迎です。', { size: 18, bold: true, color: C.brand, after: 0, line: 260 }));

  out.push(new Paragraph({ children: [new PageBreak()] }));
  return out;
}

// ═══════════════════════════════════════════════════════════
//  Ⅱ. 日程
// ═══════════════════════════════════════════════════════════
function chapter2() {
  const out = [];
  out.push(...chapter('Ⅱ', '日程'));

  out.push(...dayHeader(1, '3月20日', '土', '東京 → 博多 → 武雄温泉',
    '集合、博多の海鮮、特急、そして薪サウナと佐賀牛。今回の山場は初日です。', 'd1'));
  out.push(...renderDay(D.DAY1, 'd1'));
  out.push(new Paragraph({ children: [new PageBreak()] }));

  out.push(...dayHeader(2, '3月21日', '日', '武雄温泉 → 博多・天神',
    '朝の入替サウナから、ラーメン、自由行動、もつ鍋、屋台、締めのサウナへ。', 'd2'));
  out.push(...renderDay(D.DAY2, 'd2'));
  out.push(new Paragraph({ children: [new PageBreak()] }));

  out.push(...dayHeader(3, '3月22日', '月・振休', '天神 → 長浜 → 博多 → 成田',
    '朝ウナ、市場の寿司、お土産。ゆっくり目に締めて解散します。', 'd3'));
  out.push(...renderDay(D.DAY3, 'd3'));
  out.push(new Paragraph({ children: [new PageBreak()] }));
  return out;
}

// ═══════════════════════════════════════════════════════════
//  Ⅲ〜Ⅵ
// ═══════════════════════════════════════════════════════════
function chapter3to6() {
  const out = [];

  // Ⅲ 予約の分担
  out.push(...chapter('Ⅲ', '予約の分担'));
  out.push(P('誰が何を取るのかを、はっきりさせておきます。', { size: 18, color: C.ink2, after: 120, line: 260 }));
  out.push(dataTable(D.BOOKINGS.head, D.BOOKINGS.rows, [2700, 1750, 1750, 3546], { color: C.brand }));
  out.push(spacer(140));
  out.push(noteBox(D.BOOKINGS.notes, { color: C.brandMid, bg: C.brandBg }));
  out.push(spacer(230));

  // Ⅳ 見積
  out.push(...chapter('Ⅳ', '見積'));
  out.push(dataTable(D.BUDGET.head, D.BUDGET.rows, [3900, 2100, 3746],
    { color: C.gold, total: D.BUDGET.total, firstFill: C.goldBg, totalFill: C.goldBg }));
  out.push(spacer(140));
  out.push(noteBox(D.BUDGET.notes, { color: C.gold, bg: C.goldBg }));
  out.push(new Paragraph({ children: [new PageBreak()] }));

  // Ⅴ 持ち物・注意事項
  out.push(...chapter('Ⅴ', '持ち物・注意事項'));
  out.push(sub('(1) 持ち物'));
  D.PACKING.forEach(([t, s], i) => {
    out.push(P([
      run(circled[i] + '　', { size: 19, bold: true, color: C.brandMid }),
      run(t, { size: 19, bold: true, color: C.ink }),
      run(s ? '　— ' + s : '', { size: 17, color: C.ink2 }),
    ], { after: 60, line: 265 }));
  });

  out.push(sub('(2) 服装'));
  out.push(P('3月下旬の九州は、日中は過ごしやすいものの朝晩は冷えます。羽織るものが1枚あると安心です。',
    { size: 18, color: C.ink2, after: 0, line: 265 }));

  out.push(sub('(3) 注意事項'));
  D.CAUTIONS.forEach((t, i) => {
    out.push(P([
      run(circled[i] + '　', { size: 19, bold: true, color: C.d1 }),
      run(t, { size: 18, color: C.ink2 }),
    ], { after: 60, line: 265, indent: { left: 260, hanging: 260 } }));
  });

  out.push(spacer(240));

  // Ⅵ 連絡先
  out.push(...chapter('Ⅵ', '連絡先'));
  out.push(dataTable(D.CONTACTS.head, D.CONTACTS.rows, [3400, 2300, 4046], { color: C.brand }));
  out.push(spacer(200));
  out.push(P('参加メンバーの連絡先', { size: 19, bold: true, color: C.brand, after: 40, line: 260 }));
  out.push(P('（各自で書き込んでください）', { size: 16, color: C.muted, after: 110, line: 240 }));
  const rows = D.CONTACTS.blank.map((n) => new TableRow({
    children: [
      cell(P(n, { size: 19, bold: true, color: C.ink, after: 0, line: 260 }),
        { w: 2400, fill: C.cream, valign: VerticalAlign.CENTER, mt: 150, mb: 150,
          borders: { bottom: line(C.hair, 6), top: none, left: none, right: none } }),
      cell(P('', { after: 0 }),
        { w: CONTENT_DXA - 2400, fill: C.white, mt: 150, mb: 150,
          borders: { bottom: line(C.hair, 6), top: none, left: none, right: none } }),
    ],
  }));
  out.push(table(rows, { cols: [2400, CONTENT_DXA - 2400] }));

  out.push(spacer(260));
  out.push(table([new TableRow({
    children: [cell([
      P('それでは、3月20日 11:00　博多駅で。', { size: 24, bold: true, color: C.white, align: AlignmentType.CENTER, after: 50, line: 300 }),
      P('作成：高山', { size: 17, color: C.white, align: AlignmentType.CENTER, after: 0, line: 250 }),
    ], { w: CONTENT_DXA, fill: C.brand, mt: 200, mb: 200 })],
  })], { cols: [CONTENT_DXA] }));

  return out;
}

// ═══════════════════════════════════════════════════════════
//  付録：要確認リスト
// ═══════════════════════════════════════════════════════════
function appendixToCheck() {
  const out = [];
  out.push(new Paragraph({ children: [new PageBreak()] }));
  out.push(...chapter('Ⅶ', '現時点で確定していないこと', { color: C.alert, bg: C.alertBg }));
  out.push(P('しおり本文中に「要確認」と書いてある項目の一覧です。確定次第、版を上げて配り直します。',
    { size: 17, color: C.ink2, after: 120, line: 260 }));
  out.push(dataTable(D.TOCHECK.head, D.TOCHECK.rows, [2300, 4746, 2700], { color: C.alert, firstFill: C.alertBg }));
  out.push(spacer(220));
  out.push(P('しおり作成時点で確認が取れたもの', { size: 19, bold: true, color: C.d3, after: 90, line: 260 }));
  out.push(dataTable(D.TOCHECK.head, D.TOCHECK.resolved, [2300, 4746, 2700], { color: C.d3, firstFill: C.d3bg }));
  return out;
}

// ═══════════════════════════════════════════════════════════
//  画像クレジット
// ═══════════════════════════════════════════════════════════
function credits() {
  const out = [];
  const creds = JSON.parse(fs.readFileSync(path.join(IMG, 'credits.json'), 'utf8'));
  const used = new Set();
  const walk = (bs) => bs.forEach((b) => {
    if (b.t === 'img') used.add(b.key);
    if (b.t === 'imgpair') { used.add(b.a); used.add(b.b); }
  });
  walk(D.DAY1); walk(D.DAY2); walk(D.DAY3);
  ['cover_romon', 'hakata_station', 'mf_sakura_night'].forEach((k) => used.add(k));

  out.push(new Paragraph({ children: [new PageBreak()] }));
  out.push(...chapter('Ⅷ', '写真について'));
  out.push(P('このしおりは、参加メンバー5人に配る私的な文書です。写真の出所は次の2つです。',
    { size: 17, color: C.ink2, after: 110, line: 265 }));
  out.push(bullet('らかんの湯・料理・客室・庭園など、施設の写真は各施設の公式サイトのものです。'));
  out.push(bullet('博多駅・空港・屋台・中洲など、街の風景はウィキメディア・コモンズの自由利用可能な画像です。'));
  out.push(spacer(140));

  const mk = (list) => list.map((k) => {
    const c = creds[k];
    return [c.file.replace(/^File:/, ''), (c.artist || '不明').replace(/\s+/g, ' ').slice(0, 46), c.lic];
  });
  const keys = [...used].filter((k) => creds[k]).sort();
  const official = keys.filter((k) => creds[k].source === 'official');
  const commons = keys.filter((k) => creds[k].source !== 'official');

  out.push(P('(1) 各施設の公式サイト', { size: 19, bold: true, color: C.brandMid, after: 80, line: 260 }));
  out.push(dataTable(['ファイル', '提供', '出所'], mk(official), [4700, 3200, 1846],
    { color: C.brandMid, plainFirst: true }));
  out.push(spacer(180));
  out.push(P('(2) ウィキメディア・コモンズ', { size: 19, bold: true, color: C.brandMid, after: 80, line: 260 }));
  out.push(dataTable(['ファイル', '撮影者', 'ライセンス'], mk(commons), [4700, 3200, 1846],
    { color: C.brandMid, plainFirst: true }));
  out.push(spacer(120));
  out.push(P('コモンズ分の出典：commons.wikimedia.org　CC BY / CC BY-SA / CC0 / パブリックドメイン',
    { size: 15, color: C.muted, after: 0, line: 245 }));
  return out;
}

// ═══════════════════════════════════════════════════════════
function build() {
  const doc = new Document({
    creator: '高山', lastModifiedBy: '高山',
    title: '三十路会 佐賀・福岡旅行しおり',
    description: '2027年3月20日-22日 佐賀・福岡 2泊3日',
    styles: {
      default: {
        document: { run: { font: FONT, size: 19, color: C.ink }, paragraph: { spacing: { line: 264, lineRule: 'auto' } } },
      },
    },
    sections: [{
      properties: {
        page: { size: { width: PAGE_W, height: 16838 },
          margin: { top: 1080, right: MARGIN, bottom: 1000, left: MARGIN, header: 600, footer: 480 } },
      },
      footers: {
        default: new Footer({
          children: [new Paragraph({
            tabStops: [{ type: TabStopType.RIGHT, position: TabStopPosition.MAX }],
            spacing: { before: 60, after: 0, line: 240 },
            border: { top: { ...line(C.hair, 4), space: 6 } },
            children: [
              new TextRun({ text: '三十路会 佐賀・福岡旅行しおり ver.01', font: FONT, size: 15, color: C.muted }),
              new TextRun({ text: '\t', font: FONT, size: 15 }),
              new TextRun({ children: ['− ', PageNumber.CURRENT, ' −'], font: FONT, size: 15, color: C.muted }),
            ],
          })],
        }),
      },
      children: [...cover(), ...chapter1(), ...chapter2(), ...chapter3to6(), ...appendixToCheck(), ...credits()],
    }],
  });

  fs.mkdirSync(OUT, { recursive: true });
  const name = process.env.SHIORI_OUT || '三十路会_佐賀福岡旅行しおり_ver01.docx';
  return Packer.toBuffer(doc).then((buf) => {
    const p = path.join(OUT, name);
    fs.writeFileSync(p, buf);
    console.log('wrote', p, (buf.length / 1024 / 1024).toFixed(2) + 'MB');
  });
}

build().catch((e) => { console.error(e); process.exit(1); });
