// 秩父ファミリー旅行しおり — Word ビルダー
//   node build/build-chichibu.js
// A4縦 / 日本語フォント統一 / 見出しは Ⅰ・(1)・① / 作成者「髙山浩和」

const fs = require('fs');
const path = require('path');
const {
  Document, Packer, Paragraph, TextRun, Table, TableRow, TableCell,
  WidthType, ShadingType, AlignmentType, VerticalAlign, BorderStyle,
  PageBreak, Footer, PageNumber, TabStopType, TabStopPosition,
} = require('docx');
const { makeKit } = require('./docx-kit.js');

const D = require('./content-chichibu.js');
const { C } = D;

const ROOT = path.join(__dirname, '..');
const IMG = path.join(ROOT, 'assets', 'img');
const OUT = path.join(ROOT, 'dist');
const FONT_JA = process.env.SHIORI_FONT || 'Yu Gothic';
const FONT = { ascii: FONT_JA, eastAsia: FONT_JA, hAnsi: FONT_JA, cs: FONT_JA };

const K = makeKit(C, FONT, IMG);
// 内容がページ末ちょうどで終わったときに空白ページができないよう、
// PageBreak 段落ではなく pageBreakBefore を使う
const pageBreak = () => new Paragraph({
  children: [], pageBreakBefore: true, spacing: { before: 0, after: 0, line: 20 },
});

const {
  PAGE_W, MARGIN, CONTENT_DXA, CONTENT_IN,
  img, run, P, spacer, none, noBorders, line, cell, table,
  picture, caption, figure, figurePair, chapter, sub, bullet, circled,
  dataTable, noteBox, renderDay, dayHeader,
} = K;


// ═══════════════════════════════════════════════════════════
//  座席図（ラビューの号車内の並び）
// ═══════════════════════════════════════════════════════════
// 席番はA・B・C・Dが進行方向に向かって左から。A＝左窓／D＝右窓。
const SEAT_W = [1146, 1975, 1975, 700, 1975, 1975];

function seatFill(v) {
  if (v === '大人') return { bg: C.brandBg, fg: C.brand };
  if (v === '子ども') return { bg: C.d1bg, fg: C.d1 };
  if (v === '‖') return { bg: C.hair2, fg: C.muted };
  return { bg: C.paper, fg: C.muted };            // 他のお客さま
}

function seatMap(block) {
  const out = [];
  out.push(P(block.title, { size: 19, bold: true, color: C.brand, after: 70, line: 260, keepNext: true }));
  out.push(P('↑ 進行方向', { size: 16, bold: true, color: C.muted, align: AlignmentType.CENTER, after: 40, line: 230, keepNext: true }));

  const rs = [];
  rs.push(new TableRow({
    tableHeader: true, cantSplit: true,
    children: D.SEATS.head.map((h, i) => cell(
      P(h, { size: 15, bold: true, color: C.white, align: AlignmentType.CENTER, after: 0, line: 220 }),
      { w: SEAT_W[i], fill: C.brandMid, valign: VerticalAlign.CENTER, mt: 70, mb: 70 })),
  }));
  block.rows.forEach((r) => {
    rs.push(new TableRow({
      cantSplit: true,
      children: r.map((v, i) => {
        if (i === 0) {
          return cell(P(v, { size: 16, bold: true, color: C.ink, align: AlignmentType.CENTER, after: 0, line: 230 }),
            { w: SEAT_W[i], fill: C.cream, valign: VerticalAlign.CENTER, mt: 110, mb: 110 });
        }
        const f = seatFill(v);
        return cell(P(v === '‖' ? '' : v,
          { size: v === '大人' || v === '子ども' ? 19 : 14, bold: v === '大人' || v === '子ども',
            color: f.fg, align: AlignmentType.CENTER, after: 0, line: 230 }),
          { w: SEAT_W[i], fill: f.bg, valign: VerticalAlign.CENTER, mt: 110, mb: 110 });
      }),
    }));
  });
  out.push(table(rs, { cols: SEAT_W }));
  return out;
}

// ═══════════════════════════════════════════════════════════
//  表紙
// ═══════════════════════════════════════════════════════════
function cover() {
  const out = [];
  out.push(...figure('cb_cover', CONTENT_IN, null, { before: 0 }));
  out.push(caption('武甲山（1,304m）。秩父のどこからでも見える、この町の目印です', C.muted));
  out.push(spacer(30));

  out.push(table([new TableRow({
    children: [cell([
      P('髙山家 ／ 1泊2日', { size: 18, bold: true, color: C.gold, align: AlignmentType.CENTER, after: 90, line: 240 }),
      P('秩父ファミリー旅行', { size: 50, bold: true, color: C.brand, align: AlignmentType.CENTER, after: 80, line: 540 }),
      P('小松沢レジャー農園 ／ PICA秩父 ／ 秩父ミューズパーク', { size: 20, bold: true, color: C.brandMid, align: AlignmentType.CENTER, after: 110, line: 280 }),
      P('2026年9月21日(月・敬老の日) − 22日(火・国民の休日)', { size: 21, bold: true, color: C.ink, align: AlignmentType.CENTER, after: 0, line: 290 }),
    ], { w: CONTENT_DXA, fill: C.brandBg, mt: 250, mb: 250, ml: 200, mr: 200,
      borders: { top: line(C.brand, 12), bottom: line(C.brand, 12), left: none, right: none } })],
  })], { cols: [CONTENT_DXA] }));
  out.push(spacer(150));

  out.push(P('この旅の3つのお楽しみ', { size: 22, bold: true, color: C.brand, align: AlignmentType.CENTER, after: 100, line: 280 }));

  const gap = 140, cw = (CONTENT_DXA - gap * 2) / 3;
  const palette = { d1: [C.d1, C.d1bg], d2: [C.d2, C.d2bg], gold: [C.gold, C.goldBg] };
  const card = (mark, t, subLines, key) => {
    const [color, bg] = palette[key];
    return cell([
      P(mark, { size: 30, align: AlignmentType.CENTER, after: 30, line: 360, color }),
      P(t, { size: 19, bold: true, color, align: AlignmentType.CENTER, after: 45, line: 250 }),
      ...subLines.map((s, i) => P(s, {
        size: 15, color: C.ink2, align: AlignmentType.CENTER,
        after: i === subLines.length - 1 ? 0 : 10, line: 230,
      })),
    ], { w: cw, fill: bg, mt: 130, mb: 130, ml: 90, mr: 90,
      borders: { top: line(color, 14), bottom: none, left: none, right: none } });
  };
  const cards = [];
  D.HIGHLIGHTS.forEach((h, i) => {
    if (i) cards.push(cell(P('', { after: 0 }), { w: gap, ml: 0, mr: 0 }));
    cards.push(card(h[0], h[1], h[2], h[3]));
  });
  out.push(table([new TableRow({ children: cards })], { cols: [cw, gap, cw, gap, cw] }));

  out.push(spacer(230));
  out.push(P('作成：髙山浩和　／　2026年9月1日　ver.02（6名版）', { size: 17, color: C.muted, align: AlignmentType.CENTER, after: 0, line: 250 }));
  out.push(pageBreak());
  return out;
}

// ═══════════════════════════════════════════════════════════
//  Ⅰ. この旅について
// ═══════════════════════════════════════════════════════════
function chapter1() {
  const out = [];
  out.push(...chapter('Ⅰ', 'この旅について'));

  out.push(noteBox([
    '9月21日は敬老の日、22日は国民の休日。どちらも祝日なので電車は土休日ダイヤです。',
    '小松沢レジャー農園は、営業カレンダー上どちらの日も開いています（ぶどう狩り可・お食事処営業）。',
    '宿のPICA秩父は支払済み。当日いちばん読めないのは、農園からPICAへのタクシーです。',
  ], { title: 'まず、この3つ', color: C.brand, bg: C.brandBg }));
  out.push(spacer(160));

  out.push(sub('(1) 基本情報'));
  out.push(dataTable(D.BASIC.head, D.BASIC.rows, [2200, 7546], { color: C.brand }));

  out.push(sub('(2) メンバー'));
  out.push(dataTable(D.MEMBERS.head, D.MEMBERS.rows, [1900, 1500, 6346], { color: C.brand }));

  out.push(sub('(3) 特急ラビューの予約状況'));
  out.push(dataTable(D.TRAIN.head, D.TRAIN.rows, [1900, 4200, 1500, 2146], { color: C.d1, firstFill: C.d1bg }));
  out.push(spacer(130));
  out.push(noteBox(D.TRAIN.notes, { color: C.d1, bg: C.d1bg }));
  out.push(spacer(170));
  out.push(P('子どもの運賃と特急料金', { size: 19, bold: true, color: C.brandMid, after: 80, line: 260 }));
  out.push(dataTable(D.KIDS_FARE.head, D.KIDS_FARE.rows, [2900, 6846], { color: C.brandMid }));
  out.push(spacer(130));
  out.push(noteBox(D.KIDS_FARE.notes, { color: C.brandMid, bg: C.brandBg }));

  out.push(pageBreak());
  out.push(sub('(4) 座席の並び'));
  out.push(P('席番はA・B・C・Dが、進行方向に向かって左から順に並びます。Aが左の窓側、Dが右の窓側です。',
    { size: 18, color: C.ink2, after: 130, line: 265 }));
  out.push(...seatMap(D.SEATS.out));
  out.push(spacer(190));
  out.push(...seatMap(D.SEATS.back));
  out.push(spacer(150));
  out.push(noteBox(D.SEATS.notes, { color: C.brandMid, bg: C.brandBg }));

  out.push(sub('(5) 9月下旬の秩父'));
  out.push(dataTable(D.WEATHER.head, D.WEATHER.rows, [2200, 7546], { color: C.brand }));

  out.push(sub('(6) どこに何があるか'));
  out.push(...figure('map_wide', CONTENT_IN, '東京から秩父まで、特急ラビューで約80分。乗り換えは池袋の1回だけです', { maxH: 3.8 }));
  out.push(spacer(70));
  out.push(...figure('map_chichibu', CONTENT_IN, '横瀬駅と西武秩父駅は隣どうし。ミューズパークは荒川をはさんで西の尾根の上にあります', { maxH: 4.1 }));
  out.push(spacer(60));
  out.push(bullet('1日目は 横瀬駅 → 小松沢レジャー農園（横瀬）→ ミューズパーク（PICA秩父）と動きます。'));
  out.push(bullet('2日目は ミューズパークの中で遊んでから、ぐるりん号で西武秩父駅へ出ます。'));
  out.push(bullet('武甲山は石灰岩を採るために山肌が階段状に削られた、秩父のシンボルです。'));

  out.push(pageBreak());
  return out;
}

// ═══════════════════════════════════════════════════════════
//  Ⅱ・Ⅲ. 日程
// ═══════════════════════════════════════════════════════════
function days() {
  const out = [];
  out.push(...chapter('Ⅱ', '1日目：9月21日（月・敬老の日）'));
  out.push(...dayHeader(1, '9月21日', '月・敬老の日', '東京 → 横瀬 → ミューズパーク',
    '川でマスをつかまえて、ぶどうを食べて、夜はコテージのテラスでBBQ。', 'd1'));
  out.push(...renderDay(D.DAY1, 'd1'));
  out.push(pageBreak());

  out.push(...chapter('Ⅲ', '2日目：9月22日（火・国民の休日）'));
  out.push(...dayHeader(2, '9月22日', '火・国民の休日', 'ミューズパーク → 西武秩父 → 東京',
    '朝風呂、虫さがし、トランポリン、ピアノの形の展望台。夕方には家に着きます。', 'd2'));
  out.push(...renderDay(D.DAY2, 'd2'));

  out.push(spacer(150));
  out.push(...figure('cb_mp_map', CONTENT_IN, '秩父ミューズパークの公園ガイドマップ。⑤⑥⑦がPICA秩父と樹音の湯、⑬がソト遊びの森、㉑が展望結いまち広場、㉔が旅立ちの丘です', { maxH: 5.0 }));
  out.push(pageBreak());
  return out;
}

// ═══════════════════════════════════════════════════════════
//  Ⅳ. 小松沢のメニューと料金
// ═══════════════════════════════════════════════════════════
function chapterFarm() {
  const out = [];
  out.push(...chapter('Ⅳ', '小松沢レジャー農園のメニューと料金'));
  out.push(P('当日どれをやるかは現地で決められます。ここに全部の値段を載せておきます。',
    { size: 18, color: C.ink2, after: 130, line: 265 }));

  out.push(sub('(1) 単品でやる場合'));
  out.push(dataTable(D.FARM_MENU.head, D.FARM_MENU.rows, [2500, 2000, 3746, 1500], { color: C.brand }));

  out.push(spacer(120));
  out.push(...figure('cb_km_calendar', 6.4, '農園の年間収穫カレンダー。9月下旬はぶどう・しいたけ・さつまいもの時期です', { maxH: 2.2 }));

  out.push(sub('(2) セットでやる場合'));
  out.push(dataTable(D.FARM_MENU.set.head, D.FARM_MENU.set.rows, [2000, 7746], { color: C.gold, firstFill: C.goldBg }));
  out.push(spacer(130));
  out.push(noteBox([
    'セットは「ぶどう狩り＋食事＋体験ひとつ」で一式。体験を全部やるつもりなら割安です。',
    '逆に、昼を軽くして体験を絞るなら単品の方が安く上がります。',
    'しいたけを焼くなら、BBQと一緒にすればプレート代（700円〜）がかかりません。',
  ], { title: 'どちらを選ぶか', color: C.gold, bg: C.goldBg }));

  out.push(pageBreak());
  return out;
}

// ═══════════════════════════════════════════════════════════
//  Ⅴ. 元プランからの変更
// ═══════════════════════════════════════════════════════════
function chapterFixes() {
  const out = [];
  out.push(...chapter('Ⅴ', '元のプランから変えたところ', { color: C.alert, bg: C.alertBg }));
  out.push(P('もとの計画書を各施設の公式サイトで確認したところ、いくつか事実が違っていました。'
    + 'ここに全部並べておきます（確認日：2026年8月29日）。',
  { size: 18, color: C.ink2, after: 130, line: 265 }));
  out.push(dataTable(D.FIXES.head, D.FIXES.rows, [2300, 3200, 4246], { color: C.alert, firstFill: C.alertBg }));
  out.push(pageBreak());
  return out;
}

// ═══════════════════════════════════════════════════════════
//  Ⅵ〜Ⅹ
// ═══════════════════════════════════════════════════════════
function rest() {
  const out = [];

  out.push(...chapter('Ⅵ', '予約・購入が必要なもの'));
  out.push(dataTable(D.BOOKINGS.head, D.BOOKINGS.rows, [3200, 2000, 4546], { color: C.brand }));
  out.push(spacer(230));

  out.push(...chapter('Ⅶ', '見積'));
  out.push(dataTable(D.BUDGET.head, D.BUDGET.rows, [3700, 2200, 3846],
    { color: C.gold, total: D.BUDGET.total, firstFill: C.goldBg, totalFill: C.goldBg }));
  out.push(spacer(140));
  out.push(noteBox(D.BUDGET.notes, { color: C.gold, bg: C.goldBg }));
  out.push(pageBreak());

  out.push(...chapter('Ⅷ', '持ち物・注意事項'));
  out.push(sub('(1) 持ち物'));
  D.PACKING.forEach(([t, s], i) => {
    out.push(P([
      run(circled[i] + '　', { size: 19, bold: true, color: C.brandMid }),
      run(t, { size: 19, bold: true, color: C.ink }),
      run(s ? '　— ' + s : '', { size: 17, color: C.ink2 }),
    ], { after: 60, line: 265, indent: { left: 300, hanging: 300 } }));
  });
  out.push(sub('(2) 注意事項'));
  D.CAUTIONS.forEach((t, i) => {
    out.push(P([
      run(circled[i] + '　', { size: 19, bold: true, color: C.d1 }),
      run(t, { size: 18, color: C.ink2 }),
    ], { after: 60, line: 265, indent: { left: 300, hanging: 300 } }));
  });
  out.push(pageBreak());

  out.push(...chapter('Ⅸ', '出発までにやること'));

  out.push(sub('(1) 日付つきのやることリスト', C.alert));
  out.push(P('上から順に片づければ、出発前日には何も残りません。',
    { size: 18, color: C.ink2, after: 120, line: 265 }));
  out.push(dataTable(D.TODO.head, D.TODO.rows, [1900, 3300, 4546], { color: C.alert, firstFill: C.alertBg }));
  out.push(spacer(140));
  out.push(noteBox(D.TODO.notes, { color: C.alert, bg: C.alertBg }));
  out.push(pageBreak());

  out.push(sub('(2) 電話で確認すること', C.alert));
  out.push(P('電話で聞けばすぐ済むものばかりです。農園への電話ついでに、まとめて聞いてしまうのが早いです。',
    { size: 18, color: C.ink2, after: 120, line: 265 }));
  out.push(dataTable(D.TOCHECK.head, D.TOCHECK.rows, [2600, 4400, 2746], { color: C.alert, firstFill: C.alertBg }));
  out.push(spacer(200));
  out.push(sub('(3) しおり作成時点で確認が取れたもの'));
  out.push(dataTable(D.TOCHECK.head, D.TOCHECK.resolved, [2600, 4400, 2746], { color: C.brand, firstFill: C.brandBg }));
  out.push(pageBreak());

  // ── Ⅹ. 2日目をどうするか ─────────────────────────────
  out.push(...chapter('Ⅹ', '2日目をどうするか', { color: C.d2, bg: C.d2bg }));
  out.push(P('特急券は変更できます。変えるかどうかを決めるための材料をまとめました。',
    { size: 18, color: C.ink2, after: 130, line: 265 }));

  out.push(sub('(1) 特急券は変更できるのか', C.d2));
  out.push(dataTable(D.TICKET_RULES.head, D.TICKET_RULES.rows, [2600, 7146], { color: C.d2, firstFill: C.d2bg }));
  out.push(spacer(130));
  out.push(noteBox(D.TICKET_RULES.notes, { color: C.d2, bg: C.d2bg }));

  out.push(sub('(2) 復路の候補', C.d2));
  out.push(dataTable(D.RETURN_TRAINS.head, D.RETURN_TRAINS.rows, [2300, 1250, 1150, 1350, 3696],
    { color: C.d2, firstFill: C.d2bg }));
  out.push(spacer(130));
  out.push(noteBox(D.RETURN_TRAINS.notes, { color: C.d2, bg: C.d2bg }));
  out.push(pageBreak());

  out.push(sub('(3) 樹音の湯と祭の湯はどう違うか', C.d2));
  out.push(dataTable(D.ONSEN.head, D.ONSEN.rows, [1700, 3100, 4946], { color: C.d2, firstFill: C.d2bg, centerHead: true }));
  out.push(spacer(130));
  out.push(noteBox(D.ONSEN.notes, { color: C.d2, bg: C.d2bg }));
  out.push(spacer(150));
  out.push(figurePair('cb_mat_rotenburo', 'cb_mat_bath',
    '露天風呂。武甲山を眺めながら入れます', '内湯。高濃度人工炭酸泉やシルク湯があります'));
  out.push(pageBreak());

  out.push(sub('(4) 2日目に足せるもの', C.d2));
  out.push(dataTable(D.DAY2_EXTRA.head, D.DAY2_EXTRA.rows, [1900, 3000, 1500, 3346], { color: C.d2, firstFill: C.d2bg }));
  out.push(spacer(130));
  out.push(noteBox(D.DAY2_EXTRA.notes, { color: C.d2, bg: C.d2bg }));

  out.push(sub('(5) 秩父漫遊きっぷ', C.gold));
  out.push(dataTable(D.MANYU.head, D.MANYU.rows, [2400, 7346], { color: C.gold, firstFill: C.goldBg }));
  out.push(spacer(130));
  out.push(noteBox(D.MANYU.notes, { color: C.gold, bg: C.goldBg }));
  out.push(pageBreak());

  out.push(sub('(6) おすすめ', C.alert));
  out.push(dataTable(D.PROPOSAL.head, D.PROPOSAL.rows, [1900, 7846], { color: C.alert, firstFill: C.alertBg }));
  out.push(spacer(130));
  out.push(noteBox(D.PROPOSAL.notes, { color: C.alert, bg: C.alertBg }));
  out.push(pageBreak());

  out.push(...chapter('Ⅺ', '連絡先'));
  out.push(dataTable(D.CONTACTS.head, D.CONTACTS.rows, [3400, 2300, 4046], { color: C.brand }));

  out.push(spacer(260));
  out.push(table([new TableRow({
    children: [cell([
      P('それでは、9月21日 7時45分に出発です。', { size: 24, bold: true, color: C.white, align: AlignmentType.CENTER, after: 50, line: 300 }),
      P('作成：髙山浩和', { size: 17, color: C.white, align: AlignmentType.CENTER, after: 0, line: 250 }),
    ], { w: CONTENT_DXA, fill: C.brand, mt: 200, mb: 200 })],
  })], { cols: [CONTENT_DXA] }));
  return out;
}

// ═══════════════════════════════════════════════════════════
//  付. 写真と地図について
// ═══════════════════════════════════════════════════════════
function credits() {
  const out = [];
  const creds = JSON.parse(fs.readFileSync(path.join(IMG, 'credits.json'), 'utf8'));
  const used = new Set(['cb_bukozan', 'map_wide', 'map_chichibu']);
  const walk = (bs) => bs.forEach((b) => {
    if (b.t === 'img') used.add(b.key);
    if (b.t === 'imgpair') { used.add(b.a); used.add(b.b); }
  });
  walk(D.DAY1); walk(D.DAY2);
  ['cb_mp_map', 'cb_km_calendar'].forEach((k) => used.add(k));

  out.push(pageBreak());
  out.push(...chapter('付', '写真と地図について'));
  out.push(P('このしおりは髙山家4人のための私的な文書です。写真と地図の出どころは3つあります。',
    { size: 17, color: C.ink2, after: 110, line: 265 }));
  out.push(bullet('施設の写真（小松沢レジャー農園・PICA秩父・秩父ミューズパーク・祭の湯）は、各施設の公式サイトのものです。'));
  out.push(bullet('特急ラビュー、武甲山、駅、ぶどう、マス、ヤギなどはウィキメディア・コモンズの自由利用可能な画像です。'));
  out.push(bullet('地図2枚は OpenStreetMap のデータから作りました（ODbL）。'));
  out.push(spacer(140));

  const mk = (list) => list.map((k) => {
    const c = creds[k];
    return [c.file.replace(/^File:/, ''), (c.artist || '不明').replace(/\s+/g, ' ').slice(0, 44), c.lic];
  });
  const keys = [...used].filter((k) => creds[k]).sort();
  const official = keys.filter((k) => creds[k].source === 'official');
  const commons = keys.filter((k) => creds[k].source === 'commons');
  const osm = keys.filter((k) => creds[k].source === 'osm');

  out.push(P('(1) 各施設の公式サイト', { size: 19, bold: true, color: C.brandMid, after: 80, line: 260 }));
  out.push(dataTable(['ファイル', '提供', '出所'], mk(official), [4700, 3200, 1846],
    { color: C.brandMid, plainFirst: true }));
  out.push(spacer(180));
  out.push(P('(2) ウィキメディア・コモンズ', { size: 19, bold: true, color: C.brandMid, after: 80, line: 260 }));
  out.push(dataTable(['ファイル', '撮影者', 'ライセンス'], mk(commons), [4700, 3200, 1846],
    { color: C.brandMid, plainFirst: true }));
  if (osm.length) {
    out.push(spacer(180));
    out.push(P('(3) 地図', { size: 19, bold: true, color: C.brandMid, after: 80, line: 260 }));
    out.push(dataTable(['ファイル', '出典', 'ライセンス'], mk(osm), [4700, 3200, 1846],
      { color: C.brandMid, plainFirst: true }));
  }
  out.push(spacer(120));
  out.push(P('地図データ © OpenStreetMap contributors（ODbL）　／　コモンズ分：CC BY・CC BY-SA・CC0 ほか',
    { size: 15, color: C.muted, after: 0, line: 245 }));
  return out;
}

// ═══════════════════════════════════════════════════════════
function build() {
  const doc = new Document({
    creator: '髙山浩和', lastModifiedBy: '髙山浩和',
    title: '秩父ファミリー旅行しおり',
    description: '2026年9月21日-22日 秩父 1泊2日 髙山家',
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
              new TextRun({ text: '秩父ファミリー旅行しおり ver.02', font: FONT, size: 15, color: C.muted }),
              new TextRun({ text: '\t', font: FONT, size: 15 }),
              new TextRun({ children: ['− ', PageNumber.CURRENT, ' −'], font: FONT, size: 15, color: C.muted }),
            ],
          })],
        }),
      },
      children: [...cover(), ...chapter1(), ...days(), ...chapterFarm(),
        ...chapterFixes(), ...rest(), ...credits()],
    }],
  });

  fs.mkdirSync(OUT, { recursive: true });
  const name = process.env.SHIORI_OUT || '秩父ファミリー旅行しおり_ver02.docx';
  return Packer.toBuffer(doc).then((buf) => {
    const p = path.join(OUT, name);
    fs.writeFileSync(p, buf);
    console.log('wrote', p, (buf.length / 1024 / 1024).toFixed(2) + 'MB');
  });
}

build().catch((e) => { console.error(e); process.exit(1); });
