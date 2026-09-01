// 秩父ファミリー旅行しおり — Web版ビルダー
//   python3 build/make-web-images.py && node build/build-web-chichibu.js
// Word版と同じ build/content-chichibu.js を読むので、原稿は常に一致する。

const fs = require('fs');
const path = require('path');
const D = require('./content-chichibu.js');
const { makeWebKit } = require('./web-kit.js');

const ROOT = path.join(__dirname, '..');
const OUT = path.join(ROOT, 'dist', 'chichibu-web.html');
const K = makeWebKit(path.join(__dirname, 'web-img'));
const { dataUri, esc, photo, renderDay, tableHtml } = K;

const CREDS = JSON.parse(fs.readFileSync(path.join(ROOT, 'assets', 'img', 'credits.json'), 'utf8'));
function creditRows(kind) {
  return Object.keys(CREDS).sort()
    .filter((k) => (k.startsWith('cb_') || k.startsWith('map_')) && CREDS[k].source === kind)
    .map((k) => {
      const c = CREDS[k];
      return [c.file.replace(/^File:/, ''), (c.artist || '不明').replace(/\s+/g, ' ').slice(0, 44), c.lic];
    });
}


// 座席図。表ではなくグリッドで組む（狭い画面でも6列が崩れないように）
const SEAT_LABEL = { '大人': ['大人', 'ad'], '子ども': ['子ども', 'kid'], '‖': ['', 'aisle'] };

function seatMapHtml(block) {
  const head = D.SEATS.head.map((h, i) => {
    if (i === 0) return '<div class="sm-corner"></div>';
    if (i === 3) return '<div class="sm-aisle"></div>';   // 通路。狭いので見出しは出さない
    const [a, b] = String(h).split('（');
    return `<div class="sm-h">${esc(a)}${b ? `<span>${esc(b.replace('）', ''))}</span>` : ''}</div>`;
  }).join('');
  const body = block.rows.map((r) => r.map((v, i) => {
    if (i === 0) return `<div class="sm-row">${esc(v)}</div>`;
    const m = SEAT_LABEL[v];
    if (!m) return '<div class="sm-cell sm-other">ほかの<br>お客さま</div>';
    return `<div class="sm-cell sm-${m[1]}">${esc(m[0])}</div>`;
  }).join('')).join('');
  return `<figure class="seatmap">
    <figcaption>${esc(block.title)}</figcaption>
    <p class="sm-dir">↑ 進行方向</p>
    <div class="sm-grid">${head}${body}</div>
  </figure>`;
}

const DAYS = [
  { n: 1, key: 'd1', date: '9月21日', wd: '月・敬老の日', route: '東京 → 横瀬 → ミューズパーク',
    lead: '川でマスをつかまえて、ぶどうを食べて、夜はコテージのテラスでBBQ。', blocks: D.DAY1 },
  { n: 2, key: 'd2', date: '9月22日', wd: '火・国民の休日', route: 'ミューズパーク → 西武秩父 → 東京',
    lead: '朝風呂、虫さがし、トランポリン、ピアノの形の展望台。夕方には家に着きます。', blocks: D.DAY2 },
];

const html = `<title>秩父ファミリー旅行しおり</title>
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Zen+Maru+Gothic:wght@500;700&family=Zen+Kaku+Gothic+New:wght@400;500;700&display=swap">
<style>
/* ── 杉林の緑と柿色。明るい紙のうえに組む ── */
:root{
  --paper:#F6F8F3; --card:#FFFFFF; --card2:#EFF3EA; --rule:#DBE3D6; --rule-soft:#E8EDE3;
  --ink:#22302A; --dim:#54655C; --mut:#83918A;
  --sugi:#2C6B4A; --sugi-soft:#E6F0E8;
  --kaki:#BC5227; --kaki-soft:#FBEDE5;
  --sora:#2A6E96; --sora-soft:#E6F0F6;
  --gold:#96700F; --gold-soft:#FAF2DF;
  --shadow:0 1px 2px rgba(34,48,42,.05),0 6px 18px rgba(34,48,42,.06);
  --disp:"Zen Maru Gothic","Hiragino Maru Gothic ProN","Yu Gothic",sans-serif;
  --body:"Zen Kaku Gothic New","Hiragino Kaku Gothic ProN","Yu Gothic",Meiryo,sans-serif;
  --wrap:44rem;
}
@media (prefers-color-scheme:dark){
  :root:not([data-theme="light"]){
    --paper:#141A16; --card:#1C231E; --card2:#232B25; --rule:#313B34; --rule-soft:#28312B;
    --ink:#E7EDE7; --dim:#A6B3AA; --mut:#7A867E;
    --sugi:#7FBF9A; --sugi-soft:#1A2A21;
    --kaki:#E08A5E; --kaki-soft:#2C1D16;
    --sora:#77B4D6; --sora-soft:#16242E;
    --gold:#D9AE55; --gold-soft:#2A2315;
    --shadow:0 1px 2px rgba(0,0,0,.3),0 6px 18px rgba(0,0,0,.28);
  }
}
:root[data-theme="dark"]{
  --paper:#141A16; --card:#1C231E; --card2:#232B25; --rule:#313B34; --rule-soft:#28312B;
  --ink:#E7EDE7; --dim:#A6B3AA; --mut:#7A867E;
  --sugi:#7FBF9A; --sugi-soft:#1A2A21;
  --kaki:#E08A5E; --kaki-soft:#2C1D16;
  --sora:#77B4D6; --sora-soft:#16242E;
  --gold:#D9AE55; --gold-soft:#2A2315;
  --shadow:0 1px 2px rgba(0,0,0,.3),0 6px 18px rgba(0,0,0,.28);
}
*{box-sizing:border-box}
html{-webkit-text-size-adjust:100%;scroll-behavior:smooth}
@media (prefers-reduced-motion:reduce){html{scroll-behavior:auto} *{animation:none!important;transition:none!important}}
body{margin:0;background:var(--paper);color:var(--ink);
  font-family:var(--body);font-size:16px;line-height:1.85;font-feature-settings:"palt" 1}
img{display:block;max-width:100%}

/* ── ヒーロー ── */
.hero{position:relative;isolation:isolate;overflow:hidden}
.hero img{width:100%;height:min(52vh,24rem);object-fit:cover;object-position:center 42%}
.hero::after{content:"";position:absolute;inset:0;
  background:linear-gradient(180deg,rgba(20,26,22,.05) 0%,rgba(20,26,22,.42) 58%,rgba(20,26,22,.72) 100%)}
.hero-in{position:absolute;inset:auto 0 0 0;z-index:1;padding:0 1.25rem 1.4rem;text-align:center}
.kicker{font-size:.72rem;font-weight:700;letter-spacing:.26em;color:#F2D9A8;margin:0 0 .5rem}
.hero h1{font-family:var(--disp);font-weight:700;margin:0 0 .45rem;
  font-size:clamp(1.9rem,8.5vw,3rem);line-height:1.24;text-wrap:balance;
  color:#FFFFFF;text-shadow:0 2px 20px rgba(0,0,0,.55)}
.hero .place{font-size:clamp(.74rem,3.2vw,.86rem);color:#E4E9E1;margin:0 0 .45rem;text-wrap:balance;padding:0 .5rem}
.hero .when{font-family:var(--disp);font-size:1rem;color:#FFF8EA;margin:0;font-variant-numeric:tabular-nums}

/* ── 座席図 ── */
.seatmap{margin:1.1rem 0 0;padding:0}
.seatmap figcaption{font-family:var(--disp);font-weight:700;font-size:.95rem;color:var(--sugi);
  margin-bottom:.15rem}
.sm-dir{margin:0 0 .35rem;font-size:.72rem;font-weight:700;color:var(--mut);text-align:center;
  letter-spacing:.12em}
.sm-grid{display:grid;grid-template-columns:2.5rem 1fr 1fr .55rem 1fr 1fr;gap:.24rem;
  background:var(--card);border:1px solid var(--rule);border-radius:.7rem;padding:.4rem;
  box-shadow:var(--shadow)}
.sm-h{font-size:.66rem;font-weight:700;color:var(--dim);text-align:center;line-height:1.35;
  padding:.2rem 0;align-self:end}
.sm-h span{display:block;font-weight:500;font-size:.6rem;color:var(--mut)}
.sm-corner{}
.sm-row{font-size:.72rem;font-weight:700;color:var(--dim);text-align:center;
  display:flex;align-items:center;justify-content:center}
.sm-cell{display:flex;align-items:center;justify-content:center;text-align:center;
  min-height:2.9rem;border-radius:.42rem;font-size:.88rem;font-weight:700;line-height:1.3}
.sm-ad{background:var(--sugi-soft);color:var(--sugi);border:1px solid color-mix(in srgb,var(--sugi) 32%,transparent)}
.sm-kid{background:var(--kaki-soft);color:var(--kaki);border:1px solid color-mix(in srgb,var(--kaki) 34%,transparent)}
.sm-other{background:var(--card2);color:var(--mut);border:1px dashed var(--rule);
  font-size:.62rem;font-weight:500}
.sm-aisle,.sm-cell.sm-aisle{background:none;border:0;min-height:0}

/* ── ナビ ── */
nav{position:sticky;top:0;z-index:20;background:color-mix(in srgb,var(--paper) 92%,transparent);
  backdrop-filter:blur(10px);border-bottom:1px solid var(--rule)}
.nav-in{max-width:var(--wrap);margin:0 auto;display:flex;gap:.4rem;padding:.55rem .8rem;
  overflow-x:auto;scrollbar-width:none}
.nav-in::-webkit-scrollbar{display:none}
nav a{flex:0 0 auto;font-size:.79rem;font-weight:700;text-decoration:none;color:var(--dim);
  padding:.34rem .72rem;border-radius:999px;border:1px solid var(--rule);white-space:nowrap;
  background:var(--card);transition:color .15s,border-color .15s}
nav a:hover,nav a:focus-visible{color:var(--ink);border-color:var(--mut)}
nav a.n1{color:var(--kaki)} nav a.n2{color:var(--sora)}
nav a[aria-current]{border-color:var(--sugi);color:var(--sugi);background:var(--sugi-soft)}
nav a.n1[aria-current]{border-color:var(--kaki);color:var(--kaki);background:var(--kaki-soft)}
nav a.n2[aria-current]{border-color:var(--sora);color:var(--sora);background:var(--sora-soft)}

main{max-width:var(--wrap);margin:0 auto;padding:0 1.1rem 5rem}
section{padding-top:2.6rem;scroll-margin-top:3.6rem}
:focus-visible{outline:2px solid var(--sugi);outline-offset:3px;border-radius:4px}

/* ── 見出し ── */
.ch{display:flex;align-items:center;gap:.7rem;margin:0 0 1.1rem;padding-bottom:.55rem;
  border-bottom:2px solid var(--rule)}
.ch .num{flex:0 0 auto;font-family:var(--disp);font-size:.95rem;font-weight:700;color:#fff;
  background:var(--sugi);min-width:1.9rem;height:1.9rem;border-radius:9px;
  display:grid;place-items:center;padding:0 .3rem}
.ch h2{font-family:var(--disp);font-weight:700;font-size:1.3rem;margin:0}
h3{font-size:1rem;font-weight:700;margin:2rem 0 .7rem;padding-left:.62rem;border-left:4px solid var(--gold)}

/* ── お楽しみカード ── */
.hi{display:grid;gap:.7rem;grid-template-columns:1fr;margin:1.3rem 0 0}
@media(min-width:38rem){.hi{grid-template-columns:repeat(3,1fr)}}
.hi-c{background:var(--card);border:1px solid var(--rule);border-radius:16px;padding:1.1rem .9rem;
  text-align:center;box-shadow:var(--shadow)}
.hi-c .em{font-size:1.8rem;line-height:1;display:block;margin-bottom:.5rem}
.hi-c b{display:block;font-family:var(--disp);font-size:.98rem;margin-bottom:.3rem}
.hi-c span.d{font-size:.79rem;color:var(--dim);line-height:1.6;display:block}
.hi-c.d1{border-top:4px solid var(--kaki)} .hi-c.d1 b{color:var(--kaki)}
.hi-c.gold{border-top:4px solid var(--gold)} .hi-c.gold b{color:var(--gold)}
.hi-c.d2{border-top:4px solid var(--sora)} .hi-c.d2 b{color:var(--sora)}

.call{background:var(--card);border:1px solid var(--rule);border-left:5px solid var(--sugi);
  border-radius:0 14px 14px 0;padding:1rem 1.1rem;margin:1.2rem 0;box-shadow:var(--shadow)}
.call.warn{border-left-color:var(--kaki);background:var(--kaki-soft)}
.call b{display:block;font-family:var(--disp);color:var(--sugi);font-size:.95rem;margin-bottom:.45rem}
.call ul{margin:0;padding-left:1.05rem}
.call li{font-size:.89rem;color:var(--dim);margin:.28rem 0;line-height:1.75}

/* ── 日ヘッダ ── */
.day{display:flex;gap:.85rem;align-items:flex-start;border-radius:16px;padding:.95rem 1rem;margin:0 0 1.2rem}
.day .badge{flex:0 0 auto;width:3rem;text-align:center;font-family:var(--disp);line-height:1;padding-top:.1rem}
.day .badge small{display:block;font-size:.56rem;letter-spacing:.16em;opacity:.85;margin-bottom:.15rem}
.day .badge strong{font-size:1.9rem;font-weight:700}
.day .dd{font-family:var(--disp);font-size:1.14rem;font-weight:700;margin:0 0 .1rem}
.day .rt{font-size:.83rem;font-weight:700;margin:0 0 .15rem}
.day .ld{font-size:.78rem;color:var(--dim);margin:0;line-height:1.65}
.day.d1{background:var(--kaki-soft);border:1px solid color-mix(in srgb,var(--kaki) 26%,transparent)}
.day.d1 .badge,.day.d1 .dd{color:var(--kaki)}
.day.d2{background:var(--sora-soft);border:1px solid color-mix(in srgb,var(--sora) 26%,transparent)}
.day.d2 .badge,.day.d2 .dd{color:var(--sora)}

/* ── タイムライン ── */
.tl{list-style:none;margin:0;padding:0}
.ev{display:grid;grid-template-columns:3.6rem 1fr;gap:.85rem;padding:.75rem 0 .85rem}
.ev+.ev{border-top:1px solid var(--rule-soft)}
.ev-t{text-align:right;padding-top:.1rem}
.hh{font-family:var(--disp);font-size:1rem;font-weight:700;font-variant-numeric:tabular-nums;display:block}
.ic{font-size:.86rem;display:block;margin-top:.15rem}
.ev-b h4{font-family:var(--disp);font-size:.98rem;font-weight:700;margin:0 0 .2rem;line-height:1.6}
.ev.big .ev-b h4{font-size:1.06rem}
.ev-b .meta{font-size:.76rem;color:var(--mut);margin:.1rem 0 .3rem;line-height:1.65}
.ev-b .ln{font-size:.845rem;color:var(--dim);margin:.14rem 0;line-height:1.78}
.ev-b .ln.warn{color:var(--gold);font-weight:500}
#d1 .hh{color:var(--kaki)} #d2 .hh{color:var(--sora)}

.ev.hl .ev-b{border-radius:14px;padding:.95rem 1rem;margin-top:-.15rem;box-shadow:var(--shadow)}
#d1 .ev.hl .ev-b{background:var(--kaki-soft);border:1px solid color-mix(in srgb,var(--kaki) 30%,transparent)}
#d2 .ev.hl .ev-b{background:var(--sora-soft);border:1px solid color-mix(in srgb,var(--sora) 30%,transparent)}
.tag{display:inline-block;font-size:.66rem;font-weight:700;letter-spacing:.1em;
  padding:.16rem .55rem;border-radius:999px;margin-bottom:.45rem;color:#fff}
#d1 .tag{background:var(--kaki)} #d2 .tag{background:var(--sora)}
.hl-title{font-size:1.16rem!important;margin-bottom:.45rem!important}
#d1 .hl-title{color:var(--kaki)} #d2 .hl-title{color:var(--sora)}
.route{font-size:.85rem;font-weight:700;margin:.65rem 0 0;padding:.5rem .7rem;border-radius:10px;
  background:var(--card);line-height:1.6}
#d1 .route{color:var(--kaki)} #d2 .route{color:var(--sora)}

.mark{text-align:center;font-family:var(--disp);font-weight:700;color:#fff;
  font-size:clamp(.98rem,4.3vw,1.14rem);margin:1.3rem 0;padding:.85rem .7rem;border-radius:14px;
  font-variant-numeric:tabular-nums;line-height:1.5}
.mark-d1{background:var(--kaki)} .mark-d2{background:var(--sora)}

/* ── 写真 ── */
.ph{margin:1.15rem 0;padding:0}
.ph img{width:100%;height:auto;border-radius:14px;border:1px solid var(--rule);cursor:zoom-in;background:var(--card)}
.ph figcaption{font-size:.735rem;color:var(--mut);margin-top:.45rem;line-height:1.7;text-align:center}
.ph-pair{display:grid;gap:.7rem;grid-template-columns:1fr}
@media(min-width:32rem){.ph-pair{grid-template-columns:1fr 1fr}}
.ph-pair .ph{margin:1.15rem 0 0}

/* ── 表 ── */
.tw{overflow-x:auto;-webkit-overflow-scrolling:touch;margin:.9rem 0;
  border:1px solid var(--rule);border-radius:14px;background:var(--card)}
table{border-collapse:collapse;width:100%;min-width:30rem;font-size:.82rem}
th,td{text-align:left;padding:.62rem .7rem;border-bottom:1px solid var(--rule-soft);
  vertical-align:top;line-height:1.7}
thead th{background:var(--sugi);color:#fff;font-weight:700;font-size:.75rem;white-space:nowrap}
tbody th{font-weight:700;color:var(--ink);background:var(--card2)}
td{color:var(--dim)}
tbody tr:last-child th,tbody tr:last-child td{border-bottom:0}
tr.total th,tr.total td{background:var(--gold-soft);color:var(--gold);font-weight:700;
  border-top:2px solid var(--gold);font-size:.9rem}
.tw.warn thead th{background:var(--kaki)}
@media(max-width:33.9rem){
  .tw{border:0;border-radius:0;overflow:visible;background:none}
  table{min-width:0}
  thead{position:absolute;width:1px;height:1px;margin:-1px;overflow:hidden;clip-path:inset(50%)}
  tbody tr{display:block;background:var(--card);border:1px solid var(--rule);border-radius:13px;
    padding:.75rem .9rem;margin-bottom:.55rem;box-shadow:var(--shadow)}
  tbody th{display:block;background:none;padding:0 0 .4rem;border:0;font-size:.92rem;line-height:1.6}
  tbody td{display:grid;grid-template-columns:4.4rem 1fr;gap:.55rem;align-items:baseline;
    padding:.18rem 0;border:0;font-size:.8rem;line-height:1.72}
  tbody td::before{content:attr(data-l);color:var(--mut);font-size:.7rem;font-weight:700}
  tbody td:empty{display:none}
  tbody tr.total{border-color:var(--gold);border-top-width:3px}
  tr.total th,tr.total td{background:none}
}

/* ── リスト ── */
.nums{list-style:none;counter-reset:n;margin:.7rem 0;padding:0}
.nums li{counter-increment:n;position:relative;padding-left:1.8rem;margin:.55rem 0;
  font-size:.88rem;color:var(--dim);line-height:1.8}
.nums li::before{content:counter(n);position:absolute;left:0;top:.3rem;width:1.25rem;height:1.25rem;
  border-radius:50%;background:var(--sugi);color:#fff;font-size:.7rem;font-weight:700;
  display:grid;place-items:center}
.nums li b{color:var(--ink)}
.nums.warn li::before{background:var(--kaki)}
.plain{margin:.6rem 0;padding-left:1.1rem}
.plain li{font-size:.87rem;color:var(--dim);margin:.35rem 0;line-height:1.8}

/* ── 連絡先 ── */
.tel{display:grid;gap:.55rem;margin:1rem 0}
.tel a{display:flex;justify-content:space-between;align-items:center;gap:.8rem;background:var(--card);
  border:1px solid var(--rule);border-radius:13px;padding:.8rem .95rem;text-decoration:none;
  color:var(--ink);box-shadow:var(--shadow);transition:border-color .15s}
.tel a:hover,.tel a:focus-visible{border-color:var(--sugi)}
.tel .nm{font-size:.88rem;font-weight:700;line-height:1.5}
.tel .no{font-size:.88rem;color:var(--sugi);font-weight:700;font-variant-numeric:tabular-nums;white-space:nowrap}
.tel .sub{display:block;font-size:.72rem;color:var(--mut);font-weight:400;margin-top:.12rem}

.end{text-align:center;margin:3.2rem 0 0;padding:1.8rem 1rem;background:var(--sugi);border-radius:16px}
.end .l1{font-family:var(--disp);font-size:clamp(1.1rem,5vw,1.38rem);font-weight:700;color:#fff;
  margin:0 0 .35rem;font-variant-numeric:tabular-nums}
.end .l2{font-size:.8rem;color:#CFE3D6;margin:0}
.foot{text-align:center;font-size:.72rem;color:var(--mut);margin-top:1.6rem;line-height:1.9}

.lb{position:fixed;inset:0;z-index:60;background:rgba(12,16,13,.95);display:none;place-items:center;
  padding:1rem;cursor:zoom-out}
.lb[data-open="1"]{display:grid}
.lb img{max-width:100%;max-height:82vh;width:auto;height:auto;border-radius:10px;object-fit:contain}
.lb p{color:#C9D3CC;font-size:.78rem;text-align:center;margin:.8rem auto 0;max-width:34rem;line-height:1.7}
</style>

<header class="hero">
  <img src="${dataUri('cb_cover')}" alt="秩父のシンボル・武甲山">
  <div class="hero-in">
    <p class="kicker">髙山家 ／ 1泊2日</p>
    <h1>秩父ファミリー旅行</h1>
    <p class="place">小松沢レジャー農園 ／ PICA秩父 ／ 秩父ミューズパーク</p>
    <p class="when">2026年9月21日(月・敬老の日) − 22日(火・国民の休日)</p>
  </div>
</header>

<nav>
  <div class="nav-in">
    <a href="#intro">この旅について</a>
    <a href="#d1" class="n1">1日目 農園</a>
    <a href="#d2" class="n2">2日目 公園</a>
    <a href="#farm">農園の料金</a>
    <a href="#fixes">変えたところ</a>
    <a href="#money">見積</a>
    <a href="#pack">持ち物</a>
    <a href="#todo">やること</a>
    <a href="#tel">連絡先</a>
  </div>
</nav>

<main>

<section id="intro">
  <div class="ch"><span class="num">Ⅰ</span><h2>この旅について</h2></div>

  <div class="call">
    <b>まず、この3つ</b>
    <ul>
      <li>9月21日は敬老の日、22日は国民の休日。どちらも祝日なので電車は土休日ダイヤです。</li>
      <li>小松沢レジャー農園は、営業カレンダー上どちらの日も開いています（ぶどう狩り可・お食事処営業）。</li>
      <li>宿のPICA秩父は支払済み。当日いちばん読めないのは、農園からPICAへのタクシーです。</li>
    </ul>
  </div>

  <div class="hi">
    ${D.HIGHLIGHTS.map(([em, t, d, c]) => `<div class="hi-c ${c}">
      <span class="em">${em}</span><b>${esc(t)}</b><span class="d">${d.map(esc).join('<br>')}</span></div>`).join('')}
  </div>

  <h3>(1) 基本情報</h3>
  ${tableHtml(D.BASIC.head, D.BASIC.rows)}
  <h3>(2) メンバー</h3>
  ${tableHtml(D.MEMBERS.head, D.MEMBERS.rows)}
  <h3>(3) 特急ラビューの予約状況</h3>
  ${tableHtml(D.TRAIN.head, D.TRAIN.rows)}
  <div class="call"><ul>${D.TRAIN.notes.map((n) => `<li>${esc(n)}</li>`).join('')}</ul></div>
  <h3>子どもの席を取るかどうか</h3>
  ${tableHtml(D.KIDS_FARE.head, D.KIDS_FARE.rows)}

  <h3>(4) 座席の並び</h3>
  <p class="ld" style="font-size:.88rem;color:var(--dim);margin:.4rem 0">席番はA・B・C・Dが、進行方向に向かって左から順に並びます。Aが左の窓側、Dが右の窓側です。</p>
  ${seatMapHtml(D.SEATS.out)}
  ${seatMapHtml(D.SEATS.back)}
  <div class="call"><ul>${D.SEATS.notes.map((n) => `<li>${esc(n)}</li>`).join('')}</ul></div>

  <h3>(5) 9月下旬の秩父</h3>
  ${tableHtml(D.WEATHER.head, D.WEATHER.rows)}

  <h3>(6) どこに何があるか</h3>
  ${photo('map_wide', '東京から秩父まで、特急ラビューで約80分。乗り換えは池袋の1回だけです')}
  ${photo('map_chichibu', '横瀬駅と西武秩父駅は隣どうし。ミューズパークは荒川をはさんで西の尾根の上にあります')}
  <ul class="plain">
    <li>1日目は 横瀬駅 → 小松沢レジャー農園（横瀬）→ ミューズパーク（PICA秩父）と動きます。</li>
    <li>2日目は ミューズパークの中で遊んでから、ぐるりん号で西武秩父駅へ出ます。</li>
    <li>武甲山は石灰岩を採るために山肌が階段状に削られた、秩父のシンボルです。</li>
  </ul>
</section>

${DAYS.map((d) => `<section id="${d.key}">
  <div class="ch"><span class="num">${d.n === 1 ? 'Ⅱ' : 'Ⅲ'}</span><h2>${d.n}日目：${esc(d.date)}（${esc(d.wd)}）</h2></div>
  <div class="day ${d.key}">
    <div class="badge"><small>DAY</small><strong>${d.n}</strong></div>
    <div>
      <p class="dd">${esc(d.date)}（${esc(d.wd)}）</p>
      <p class="rt">${esc(d.route)}</p>
      <p class="ld">${esc(d.lead)}</p>
    </div>
  </div>
  ${renderDay(d.blocks, d.key)}
</section>`).join('\n')}

<section id="parkmap">
  ${photo('cb_mp_map', '秩父ミューズパークの公園ガイドマップ。⑤⑥⑦がPICA秩父と樹音の湯、⑬がソト遊びの森、㉑が展望結いまち広場、㉔が旅立ちの丘です')}
</section>

<section id="farm">
  <div class="ch"><span class="num">Ⅳ</span><h2>小松沢レジャー農園の料金</h2></div>
  <p class="ld" style="font-size:.88rem;color:var(--dim);margin:.4rem 0">当日どれをやるかは現地で決められます。全部の値段を載せておきます。</p>
  <h3>単品でやる場合</h3>
  ${tableHtml(D.FARM_MENU.head, D.FARM_MENU.rows)}
  ${photo('cb_km_calendar', '農園の年間収穫カレンダー。9月下旬はぶどう・しいたけ・さつまいもの時期です')}
  <h3>セットでやる場合</h3>
  ${tableHtml(D.FARM_MENU.set.head, D.FARM_MENU.set.rows)}
  <div class="call">
    <b>どちらを選ぶか</b>
    <ul>
      <li>セットは「ぶどう狩り＋食事＋体験ひとつ」で一式。体験を全部やるつもりなら割安です。</li>
      <li>逆に、昼を軽くして体験を絞るなら単品の方が安く上がります。</li>
      <li>しいたけを焼くなら、BBQと一緒にすればプレート代（700円〜）がかかりません。</li>
    </ul>
  </div>
  ${photo('cb_km_pamphlet', '小松沢レジャー農園「秋のぶどう狩りセット」（2026年6月版）')}
</section>

<section id="fixes">
  <div class="ch"><span class="num">Ⅴ</span><h2>元のプランから変えたところ</h2></div>
  <p class="ld" style="font-size:.88rem;color:var(--dim);margin:.4rem 0">
    もとの計画書を各施設の公式サイトで確認したところ、いくつか事実が違っていました（確認日：2026年8月29日）。</p>
  ${tableHtml(D.FIXES.head, D.FIXES.rows).replace('class="tw"', 'class="tw warn"')}
</section>

<section id="book">
  <div class="ch"><span class="num">Ⅵ</span><h2>予約・購入が必要なもの</h2></div>
  ${tableHtml(D.BOOKINGS.head, D.BOOKINGS.rows)}
</section>

<section id="money">
  <div class="ch"><span class="num">Ⅶ</span><h2>見積</h2></div>
  ${tableHtml(D.BUDGET.head, D.BUDGET.rows, { total: D.BUDGET.total })}
  <div class="call"><ul>${D.BUDGET.notes.map((n) => `<li>${esc(n)}</li>`).join('')}</ul></div>
</section>

<section id="pack">
  <div class="ch"><span class="num">Ⅷ</span><h2>持ち物・注意事項</h2></div>
  <h3>持ち物</h3>
  <ol class="nums">${D.PACKING.map(([t, s]) => `<li><b>${esc(t)}</b>${s ? '　— ' + esc(s) : ''}</li>`).join('')}</ol>
  <h3>注意事項</h3>
  <ol class="nums warn">${D.CAUTIONS.map((t) => `<li>${esc(t)}</li>`).join('')}</ol>
</section>

<section id="todo">
  <div class="ch"><span class="num">Ⅸ</span><h2>出発までにやること</h2></div>
  <p class="ld" style="font-size:.88rem;color:var(--dim);margin:.4rem 0">上から順に片づければ、出発前日には何も残りません。</p>
  ${tableHtml(D.TODO.head, D.TODO.rows).replace('class="tw"', 'class="tw warn"')}
  <div class="call warn"><ul>${D.TODO.notes.map((n) => `<li>${esc(n)}</li>`).join('')}</ul></div>

  <h3>電話で確認すること</h3>
  <p class="ld" style="font-size:.88rem;color:var(--dim);margin:.4rem 0">農園への電話ついでに、まとめて聞いてしまうのが早いです。</p>
  ${tableHtml(D.TOCHECK.head, D.TOCHECK.rows).replace('class="tw"', 'class="tw warn"')}
  <h3>確認が取れたもの</h3>
  ${tableHtml(D.TOCHECK.head, D.TOCHECK.resolved)}
</section>

<section id="tel">
  <div class="ch"><span class="num">Ⅹ</span><h2>連絡先</h2></div>
  <div class="tel">
    ${D.CONTACTS.rows.map(([nm, no, sub]) => `<a href="tel:${no.replace(/-/g, '')}">
      <span class="nm">${esc(nm)}${sub ? `<span class="sub">${esc(sub)}</span>` : ''}</span>
      <span class="no">${esc(no)}</span></a>`).join('')}
  </div>
  <p class="foot">タップでそのまま電話できます。</p>
</section>

<section id="cred">
  <div class="ch"><span class="num">付</span><h2>写真と地図について</h2></div>
  <p class="ld" style="font-size:.83rem;color:var(--dim);margin:.4rem 0 .6rem">
    髙山家4人のための私的な文書です。施設の写真は各施設の公式サイト、特急・山・駅・食べ物などはウィキメディア・コモンズ、地図2枚は OpenStreetMap から作りました。</p>
  <h3>各施設の公式サイト</h3>
  ${tableHtml(['ファイル', '提供', '出所'], creditRows('official'))}
  <h3>ウィキメディア・コモンズ</h3>
  ${tableHtml(['ファイル', '撮影者', 'ライセンス'], creditRows('commons'))}
  <h3>地図</h3>
  ${tableHtml(['ファイル', '出典', 'ライセンス'], creditRows('osm'))}
  <p class="foot">地図データ © OpenStreetMap contributors（ODbL）</p>
</section>

<div class="end">
  <p class="l1">それでは、9月21日 7時45分に出発です。</p>
  <p class="l2">作成：髙山浩和　／　2026年9月1日　ver.02（6名版）</p>
</div>

</main>

<div class="lb" id="lb" role="dialog" aria-modal="true" aria-label="写真の拡大表示">
  <div><img id="lbi" src="" alt=""><p id="lbc"></p></div>
</div>

<script>
(function(){
  var lb=document.getElementById('lb'), lbi=document.getElementById('lbi'), lbc=document.getElementById('lbc');
  document.addEventListener('click',function(e){
    var img=e.target.closest('.ph img');
    if(img){ lbi.src=img.src; lbi.alt=img.alt||'';
      var c=img.parentNode.querySelector('figcaption');
      lbc.textContent=c?c.textContent:''; lb.dataset.open='1'; return; }
    if(e.target.closest('#lb')){ lb.dataset.open='0'; lbi.src=''; }
  });
  document.addEventListener('keydown',function(e){
    if(e.key==='Escape'&&lb.dataset.open==='1'){ lb.dataset.open='0'; lbi.src=''; }
  });
  var links={}; [].forEach.call(document.querySelectorAll('nav a'),function(a){
    links[a.getAttribute('href').slice(1)]=a;
  });
  if('IntersectionObserver' in window){
    var io=new IntersectionObserver(function(es){
      es.forEach(function(en){
        var a=links[en.target.id];
        if(a && en.isIntersecting){
          [].forEach.call(document.querySelectorAll('nav a'),function(x){x.removeAttribute('aria-current')});
          a.setAttribute('aria-current','true');
        }
      });
    },{rootMargin:'-45% 0px -50% 0px'});
    [].forEach.call(document.querySelectorAll('main section'),function(s){io.observe(s)});
  }
})();
</script>
`;

fs.mkdirSync(path.dirname(OUT), { recursive: true });
fs.writeFileSync(OUT, html);
console.log('wrote', OUT, (Buffer.byteLength(html) / 1024 / 1024).toFixed(2) + 'MB');
