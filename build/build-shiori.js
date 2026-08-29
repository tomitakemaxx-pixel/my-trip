// 三十路会 佐賀・福岡旅行しおり — Word ビルダー
//   node build/build-shiori.js
// A4縦 / 日本語フォント統一 / 見出しは Ⅰ・(1)・① / 作成者「高山」

const fs = require('fs');
const path = require('path');
const {
  Document, Packer, Paragraph, TextRun, ImageRun, Table, TableRow, TableCell,
  WidthType, ShadingType, AlignmentType, VerticalAlign, BorderStyle,
  PageBreak, Footer, PageNumber, TabStopType, TabStopPosition,
} = require('docx');

const D = require('./content.js');
const { C } = D;

const ROOT = path.join(__dirname, '..');
const IMG = path.join(ROOT, 'assets', 'img');
const OUT = path.join(ROOT, 'dist');
const FONT_JA = process.env.SHIORI_FONT || 'Yu Gothic';
const FONT = { ascii: FONT_JA, eastAsia: FONT_JA, hAnsi: FONT_JA, cs: FONT_JA };

// ── ページ幾何 ───────────────────────────────────────────
const PAGE_W = 11906, MARGIN = 1080;
const CONTENT_DXA = PAGE_W - MARGIN * 2;          // 9746
const CONTENT_IN = CONTENT_DXA / 1440;            // 6.768"
const TIME_COL = 1300, BODY_COL = CONTENT_DXA - TIME_COL;

// ── JPEG 寸法 ────────────────────────────────────────────
function jpegSize(buf) {
  let i = 2;
  while (i < buf.length) {
    if (buf[i] !== 0xff) { i++; continue; }
    const m = buf[i + 1];
    if (m >= 0xc0 && m <= 0xcf && m !== 0xc4 && m !== 0xc8 && m !== 0xcc) {
      return { h: buf.readUInt16BE(i + 5), w: buf.readUInt16BE(i + 7) };
    }
    i += 2 + buf.readUInt16BE(i + 2);
  }
  throw new Error('no SOF');
}
const imgCache = {};
function img(key) {
  if (!imgCache[key]) {
    const buf = fs.readFileSync(path.join(IMG, key + '.jpg'));
    imgCache[key] = { buf, ...jpegSize(buf) };
  }
  return imgCache[key];
}

// ── ランとパラグラフ ─────────────────────────────────────
const run = (text, o = {}) => new TextRun({
  text, font: FONT, size: o.size || 19, bold: !!o.bold,
  color: o.color || C.ink, italics: !!o.italics, break: o.break,
});

function P(text, o = {}) {
  const children = Array.isArray(text) ? text : [run(text, o)];
  return new Paragraph({
    children,
    alignment: o.align || AlignmentType.LEFT,
    spacing: { before: o.before || 0, after: o.after === undefined ? 40 : o.after,
      line: o.line || 264, lineRule: 'auto' },
    indent: o.indent,
    keepNext: o.keepNext,
    border: o.border,
    shading: o.fill ? { type: ShadingType.CLEAR, fill: o.fill, color: 'auto' } : undefined,
  });
}
const spacer = (h = 90) => new Paragraph({ children: [], spacing: { before: 0, after: h, line: 20 } });

// ── 罫線 ────────────────────────────────────────────────
const none = { style: BorderStyle.NONE, size: 0, color: 'FFFFFF' };
const noBorders = { top: none, bottom: none, left: none, right: none,
  insideHorizontal: none, insideVertical: none };
const line = (color, size = 4) => ({ style: BorderStyle.SINGLE, size, color });

// ── セル ────────────────────────────────────────────────
function cell(children, o = {}) {
  return new TableCell({
    children: Array.isArray(children) ? children : [children],
    width: { size: o.w, type: WidthType.DXA },
    columnSpan: o.span,
    shading: o.fill ? { type: ShadingType.CLEAR, fill: o.fill, color: 'auto' } : undefined,
    verticalAlign: o.valign || VerticalAlign.TOP,
    margins: { top: o.mt === undefined ? 90 : o.mt, bottom: o.mb === undefined ? 90 : o.mb,
      left: o.ml === undefined ? 130 : o.ml, right: o.mr === undefined ? 130 : o.mr },
    borders: o.borders || noBorders,
  });
}
const table = (rows, o = {}) => new Table({
  rows, width: { size: o.w || CONTENT_DXA, type: WidthType.DXA },
  columnWidths: o.cols, borders: o.borders || noBorders,
  layout: 'fixed',
});

// ── 画像 ────────────────────────────────────────────────
function picture(key, widthIn, o = {}) {
  const im = img(key);
  let w = widthIn, h = widthIn * (im.h / im.w);
  if (o.maxH && h > o.maxH) { h = o.maxH; w = h * (im.w / im.h); }
  return new Paragraph({
    children: [new ImageRun({
      data: im.buf, type: 'jpg',
      transformation: { width: Math.round(w * 96), height: Math.round(h * 96) },
    })],
    alignment: AlignmentType.CENTER,
    spacing: { before: o.before === undefined ? 60 : o.before, after: 30 },
    keepNext: true,
  });
}
const caption = (t, color) => P(t, {
  size: 15, color: color || C.muted, align: AlignmentType.CENTER, after: 150, line: 220,
});

function figure(key, widthIn, cap, o = {}) {
  const out = [picture(key, Math.min(widthIn, CONTENT_IN), o)];
  if (cap) out.push(caption(cap, o.capColor));
  return out;
}

// 2枚並べ
function figurePair(a, b, capA, capB, colColor) {
  const gap = 160, colW = (CONTENT_DXA - gap) / 2;
  const inW = colW / 1440 - 0.06;
  const mk = (k, c) => cell([picture(k, inW, { before: 0 }), caption(c, colColor)],
    { w: colW, ml: 0, mr: 0, mt: 0, mb: 0 });
  return table([new TableRow({
    children: [mk(a, capA), cell(P('', { after: 0 }), { w: gap, ml: 0, mr: 0 }), mk(b, capB)],
  })], { cols: [colW, gap, colW] });
}

// ── 見出し ──────────────────────────────────────────────
function chapter(numeral, title, opts = {}) {
  const color = opts.color || C.brand;
  const bg = opts.bg || C.brandBg;
  return [
    new Table({
      rows: [new TableRow({
        children: [
          cell(P(numeral, { size: 30, bold: true, color: C.white, align: AlignmentType.CENTER, after: 0, line: 240 }),
            { w: 700, fill: color, valign: VerticalAlign.CENTER, ml: 40, mr: 40, mt: 110, mb: 110 }),
          cell(P(title, { size: 26, bold: true, color, after: 0, line: 260 }),
            { w: CONTENT_DXA - 700, fill: bg, valign: VerticalAlign.CENTER, ml: 190 }),
        ],
      })],
      width: { size: CONTENT_DXA, type: WidthType.DXA },
      columnWidths: [700, CONTENT_DXA - 700],
      borders: noBorders, layout: 'fixed',
    }),
    spacer(140),
  ];
}

const sub = (t, color) => P(t, {
  size: 21, bold: true, color: color || C.brandMid, before: 190, after: 90, keepNext: true,
  border: { bottom: { ...line(color ? color : C.hair, 6), space: 4 } },
});

const bullet = (t, o = {}) => P([
  run('・', { color: o.color || C.brandMid, bold: true, size: o.size || 19 }),
  run(t, { color: o.textColor || C.ink2, size: o.size || 19 }),
], { indent: { left: o.left === undefined ? 120 : o.left, hanging: 200 }, after: o.after === undefined ? 55 : o.after, line: 260 });

const circled = ['①', '②', '③', '④', '⑤', '⑥', '⑦', '⑧', '⑨'];

// ── 汎用テーブル ────────────────────────────────────────
function dataTable(head, rows, cols, o = {}) {
  const color = o.color || C.brand;
  const rs = [];
  rs.push(new TableRow({
    tableHeader: true,
    children: head.map((h, i) => cell(
      P(h, { size: 17, bold: true, color: C.white, after: 0, line: 240,
        align: i === 0 ? AlignmentType.LEFT : (o.centerHead ? AlignmentType.CENTER : AlignmentType.LEFT) }),
      { w: cols[i], fill: color, valign: VerticalAlign.CENTER, mt: 80, mb: 80 })),
  }));
  rows.forEach((r, ri) => {
    rs.push(new TableRow({
      children: r.map((v, i) => cell(
        P(String(v), {
          size: 17, color: i === 0 ? C.ink : C.ink2, bold: i === 0 && !o.plainFirst,
          after: 0, line: 250,
        }),
        { w: cols[i],
          fill: i === 0 ? (o.firstFill || C.cream) : (ri % 2 ? C.paper : C.white),
          valign: VerticalAlign.CENTER, mt: 76, mb: 76,
          borders: { top: none, left: none, right: none, bottom: line(C.hair2, 4) } })),
    }));
  });
  if (o.total) {
    rs.push(new TableRow({
      children: o.total.map((v, i) => cell(
        P(String(v), { size: i === 1 ? 20 : 17, bold: i < 2, color: i === 1 ? color : C.ink, after: 0, line: 250 }),
        { w: cols[i], fill: o.totalFill || C.goldBg, valign: VerticalAlign.CENTER, mt: 90, mb: 90,
          borders: { top: line(color, 8), left: none, right: none, bottom: none } })),
    }));
  }
  return table(rs, { cols });
}

// ── 注記ボックス ────────────────────────────────────────
function noteBox(lines, o = {}) {
  const color = o.color || C.alert;
  const bg = o.bg || C.alertBg;
  const kids = [];
  if (o.title) kids.push(P(o.title, { size: 18, bold: true, color, after: 70, line: 250 }));
  lines.forEach((l, i) => kids.push(P([
    run('・', { color, bold: true, size: 17 }),
    run(l, { color: o.textColor || C.ink2, size: 17 }),
  ], { indent: { left: 120, hanging: 190 }, after: i === lines.length - 1 ? 0 : 55, line: 255 })));
  return table([new TableRow({
    children: [cell(kids, { w: CONTENT_DXA, fill: bg, ml: 200, mr: 200, mt: 130, mb: 130,
      borders: { left: line(color, 18), top: none, right: none, bottom: none } })],
  })], { cols: [CONTENT_DXA] });
}

// ═══════════════════════════════════════════════════════════
//  タイムライン
// ═══════════════════════════════════════════════════════════
function dayPalette(k) {
  return {
    d1: { main: C.d1, bg: C.d1bg, bg2: C.d1bg2 },
    d2: { main: C.d2, bg: C.d2bg, bg2: C.d2bg2 },
    d3: { main: C.d3, bg: C.d3bg, bg2: C.d3bg2 },
  }[k];
}

function slotRow(b, pal) {
  const timeKids = [
    P(b.time, { size: b.big ? 22 : 20, bold: true, color: pal.main,
      align: AlignmentType.CENTER, after: 0, line: 240 }),
  ];
  if (b.icon) timeKids.push(P(b.icon, { size: 18, align: AlignmentType.CENTER, after: 0, line: 220, color: pal.main }));

  const body = [P(b.title, { size: b.big ? 21 : 20, bold: true,
    color: b.big ? pal.main : C.ink, after: b.sub || b.lines.length ? 46 : 0, line: 258 })];
  if (b.sub) body.push(P(b.sub, { size: 16, color: C.muted, after: b.lines.length ? 46 : 0, line: 240 }));
  b.lines.forEach((l, i) => body.push(P(l, {
    size: 17, color: C.ink2, after: i === b.lines.length - 1 ? 0 : 26, line: 258,
  })));

  return new TableRow({
    children: [
      cell(timeKids, { w: TIME_COL, fill: pal.bg, valign: VerticalAlign.TOP, mt: 110, mb: 110, ml: 40, mr: 40,
        borders: { bottom: line(C.white, 8), top: none, left: none, right: none } }),
      cell(body, { w: BODY_COL, fill: C.white, mt: 110, mb: 110, ml: 200,
        borders: { bottom: line(C.hair2, 6), top: none, left: none, right: none } }),
    ],
  });
}

function bannerRow(text, pal) {
  return new TableRow({
    children: [cell(
      P(text, { size: 22, bold: true, color: C.white, align: AlignmentType.CENTER, after: 0, line: 260 }),
      { w: CONTENT_DXA, span: 2, fill: pal.main, mt: 140, mb: 140 })],
  });
}

function highlightRow(b, pal) {
  const kids = [
    P(b.label, { size: 16, bold: true, color: pal.main, after: 60, line: 230 }),
    P(b.title, { size: 24, bold: true, color: pal.main, after: 80, line: 270 }),
  ];
  b.lines.forEach((l, i) => kids.push(P(l, {
    size: 18, color: C.ink, after: i === b.lines.length - 1 ? 90 : 30, line: 268,
  })));
  if (b.route) kids.push(P(b.route, {
    size: 18, bold: true, color: pal.main, after: 0, line: 250, fill: C.white,
  }));
  return new TableRow({
    children: [
      cell(P(b.time, { size: 24, bold: true, color: pal.main, align: AlignmentType.CENTER, after: 0, line: 250 }),
        { w: TIME_COL, fill: pal.bg2, valign: VerticalAlign.CENTER, ml: 40, mr: 40,
          borders: { bottom: line(C.white, 8), top: none, left: none, right: none } }),
      cell(kids, { w: BODY_COL, fill: pal.bg, mt: 150, mb: 150, ml: 200, mr: 200,
        borders: { bottom: line(C.white, 8), top: none, left: none, right: none } }),
    ],
  });
}

function freetimeRow(b, pal) {
  const kids = [];
  b.items.forEach((it, i) => {
    kids.push(P([
      run(circled[i] + ' ', { color: pal.main, bold: true, size: 19 }),
      run(it[0], { color: C.ink, bold: true, size: 19 }),
    ], { after: 20, line: 250 }));
    kids.push(P(it[1], { size: 17, color: C.ink2, indent: { left: 300 }, after: 60, line: 245 }));
  });
  kids.push(P(b.foot, { size: 17, color: pal.main, bold: true, after: 0, line: 245 }));
  return new TableRow({
    children: [cell(kids, { w: CONTENT_DXA, span: 2, fill: pal.bg, ml: 260, mr: 260, mt: 140, mb: 140 })],
  });
}

// 画像は表の外に出す（表内画像は折返しが不安定なため）
function renderDay(blocks, palKey) {
  const pal = dayPalette(palKey);
  const out = [];
  let rows = [];
  const flush = () => { if (rows.length) { out.push(table(rows, { cols: [TIME_COL, BODY_COL] })); rows = []; } };

  for (const b of blocks) {
    switch (b.t) {
      case 'slot': rows.push(slotRow(b, pal)); break;
      case 'banner': rows.push(bannerRow(b.text, dayPalette(b.color))); break;
      case 'highlight': rows.push(highlightRow(b, dayPalette(b.color))); break;
      case 'freetime': rows.push(freetimeRow(b, dayPalette(b.color))); break;
      case 'img':
        flush(); out.push(spacer(60));
        out.push(...figure(b.key, b.w, b.cap, { maxH: 4.3 }));
        break;
      case 'imgpair':
        flush(); out.push(spacer(60));
        out.push(figurePair(b.a, b.b, b.capA, b.capB));
        out.push(spacer(60));
        break;
      default: break;
    }
  }
  flush();
  return out;
}

function dayHeader(n, dateLabel, weekday, title, lead, palKey) {
  const pal = dayPalette(palKey);
  return [
    table([new TableRow({
      children: [
        cell([
          P('DAY', { size: 15, bold: true, color: C.white, align: AlignmentType.CENTER, after: 0, line: 200 }),
          P(String(n), { size: 44, bold: true, color: C.white, align: AlignmentType.CENTER, after: 0, line: 440 }),
        ], { w: 1150, fill: pal.main, valign: VerticalAlign.CENTER, ml: 40, mr: 40, mt: 90, mb: 90 }),
        cell([
          P(`${dateLabel}（${weekday}）`, { size: 24, bold: true, color: pal.main, after: 40, line: 280 }),
          P(title, { size: 19, bold: true, color: C.ink, after: 40, line: 250 }),
          P(lead, { size: 16, color: C.ink2, after: 0, line: 245 }),
        ], { w: CONTENT_DXA - 1150, fill: pal.bg, valign: VerticalAlign.CENTER, ml: 220, mr: 200, mt: 110, mb: 110 }),
      ],
    })], { cols: [1150, CONTENT_DXA - 1150] }),
    spacer(150),
  ];
}

// ═══════════════════════════════════════════════════════════
//  表紙
// ═══════════════════════════════════════════════════════════
function cover() {
  const out = [];
  out.push(...figure('cover_banner', CONTENT_IN, null, { before: 0 }));
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
    '集合、うどん、特急、そして薪サウナと佐賀牛。今回の山場は初日です。', 'd1'));
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
  ['cover_romon', 'hakata_station'].forEach((k) => used.add(k));

  out.push(new Paragraph({ children: [new PageBreak()] }));
  out.push(...chapter('Ⅷ', '写真について'));
  out.push(P('このしおりの写真は、ウィキメディア・コモンズで公開されている自由利用可能な画像を使用しています。'
    + '施設内部（らかんの湯の薪サウナ・露天風呂など）の写真は公開されているものがないため、'
    + '雰囲気の近い別の場所の写真を「イメージ」として掲載しています。実際の設備とは異なります。',
  { size: 17, color: C.ink2, after: 140, line: 265 }));

  const rows = [...used].sort().filter((k) => creds[k]).map((k) => {
    const c = creds[k];
    const who = (c.artist || '不明').replace(/\s+/g, ' ').slice(0, 46);
    return [c.file.replace(/^File:/, ''), who, c.lic];
  });
  out.push(dataTable(['ファイル', '撮影者', 'ライセンス'], rows, [5100, 2900, 1746],
    { color: C.brandMid, plainFirst: true }));
  out.push(spacer(120));
  out.push(P('出典：ウィキメディア・コモンズ（commons.wikimedia.org）　CC BY / CC BY-SA / CC0 / パブリックドメイン',
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
