// docx 組版の共通部品。build-shiori.js（佐賀・福岡）と
// build-chichibu.js（秩父）の両方から使う。
// makeKit(C, FONT) で、その旅の配色・フォントに束ねた道具一式を返す。

const {
  Paragraph, TextRun, ImageRun, Table, TableRow, TableCell,
  WidthType, ShadingType, AlignmentType, VerticalAlign, BorderStyle,
} = require('docx');
const fs = require('fs');
const path = require('path');

function makeKit(C, FONT, IMG) {
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
        cantSplit: true,
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
        cantSplit: true,
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
      cantSplit: true,
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
      cantSplit: true,
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
      cantSplit: true,
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
      cantSplit: true,
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
          out.push(...figure(b.key, b.w, b.cap, { maxH: b.maxH || 4.3 }));
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

  return {
    PAGE_W, MARGIN, CONTENT_DXA, CONTENT_IN, TIME_COL, BODY_COL,
    img, run, P, spacer, none, noBorders, line, cell, table,
    picture, caption, figure, figurePair, chapter, sub, bullet, circled,
    dataTable, noteBox, dayPalette, slotRow, bannerRow, highlightRow,
    freetimeRow, renderDay, dayHeader,
  };
}

module.exports = { makeKit };
