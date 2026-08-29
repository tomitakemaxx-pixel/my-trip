// 三十路会 佐賀・福岡旅行しおり — Web版ビルダー
//   python3 build/make-web-images.py && node build/build-web.js
// Word版と同じ build/content.js を読むので、原稿は常に一致する。
// Artifact の CSP は外部画像を通さないため、写真は data URI で埋め込む。

const fs = require('fs');
const path = require('path');
const D = require('./content.js');

const ROOT = path.join(__dirname, '..');
const WEBIMG = path.join(__dirname, 'web-img');
const OUT = path.join(ROOT, 'dist', 'shiori-web.html');

const { makeWebKit } = require('./web-kit.js');
const { dataUri, esc, photo, photoPair, renderDay, tableHtml } = makeWebKit(WEBIMG);

// ── ページ ──────────────────────────────────────────────
const DAYS = [
  { n: 1, key: 'd1', date: '3月20日', wd: '土', route: '東京 → 博多 → 武雄温泉',
    lead: '集合、博多の海鮮、特急、そして薪サウナと佐賀牛。今回の山場は初日です。', blocks: D.DAY1 },
  { n: 2, key: 'd2', date: '3月21日', wd: '日', route: '武雄温泉 → 博多・天神',
    lead: '朝の入替サウナから、ラーメン、自由行動、もつ鍋、屋台、締めのサウナへ。', blocks: D.DAY2 },
  { n: 3, key: 'd3', date: '3月22日', wd: '月・振休', route: '天神 → 長浜 → 博多 → 成田',
    lead: '朝ウナ、市場の寿司、お土産。ゆっくり目に締めて解散します。', blocks: D.DAY3 },
];

const HIGHLIGHTS = [
  ['🔥', '復活した薪サウナ', '2023年は火災で入れず。2024年3月に復活', 'd1'],
  ['🥩', '佐賀牛A5＋楽園鍋', 'プレミアム会席にグレードアップ', 'gold'],
  ['🌸', '御船山楽園の夜桜', '九州最大級のライトアップ。宿泊者は入園無料', 'd3'],
];

const CREDS = JSON.parse(fs.readFileSync(path.join(ROOT, 'assets', 'img', 'credits.json'), 'utf8'));
function creditRows(kind) {
  return Object.keys(CREDS).sort()
    .filter((k) => (kind === 'official') === (CREDS[k].source === 'official'))
    .map((k) => {
      const c = CREDS[k];
      return [c.file.replace(/^File:/, ''), (c.artist || '不明').replace(/\s+/g, ' ').slice(0, 46), c.lic];
    });
}

const html = `<title>三十路会 佐賀・福岡しおり</title>
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Shippori+Mincho:wght@500;700&family=Zen+Kaku+Gothic+New:wght@400;500;700&display=swap">
<style>
/* ── 藍鉄の夜。単一テーマで振り切る（配色は全て明示指定） ── */
:root{
  --ink:#0E1219; --panel:#161C26; --panel2:#1E2734; --rule:#2B3543; --rule-soft:#222B38;
  --text:#E9E4D9; --dim:#A2ABB7; --mut:#727C89;
  --shu:#D4553A; --shu-soft:#3A2019;
  --ai:#79A9CF;  --ai-soft:#182533;
  --matsu:#82BA9B; --matsu-soft:#16261F;
  --gold:#E0AC53; --gold-soft:#2C2314;
  --sakura:#E3A2B0;
  --disp:"Shippori Mincho","Hiragino Mincho ProN","Yu Mincho",serif;
  --body:"Zen Kaku Gothic New","Hiragino Kaku Gothic ProN","Yu Gothic",Meiryo,sans-serif;
  --wrap:44rem;
}
*{box-sizing:border-box}
html{-webkit-text-size-adjust:100%;scroll-behavior:smooth}
@media (prefers-reduced-motion:reduce){html{scroll-behavior:auto} *{animation:none!important;transition:none!important}}
body{
  margin:0;background:var(--ink);color:var(--text);
  font-family:var(--body);font-size:16px;line-height:1.85;
  font-feature-settings:"palt" 1;
}
img{display:block;max-width:100%}

/* ── ヒーロー ── */
.hero{position:relative;isolation:isolate;overflow:hidden}
.hero img{width:100%;height:min(64vh,30rem);object-fit:cover;object-position:center 58%}
.hero::after{content:"";position:absolute;inset:0;
  background:linear-gradient(180deg,rgba(14,18,25,.30) 0%,rgba(14,18,25,.55) 45%,var(--ink) 100%)}
.hero-in{position:absolute;inset:auto 0 0 0;z-index:1;padding:0 1.25rem 1.6rem;text-align:center}
.kicker{font-family:var(--body);font-size:.72rem;font-weight:700;letter-spacing:.28em;
  color:var(--gold);margin:0 0 .55rem;text-transform:none}
.hero h1{font-family:var(--disp);font-weight:700;margin:0 0 .5rem;
  font-size:clamp(1.9rem,8.5vw,3.1rem);line-height:1.22;text-wrap:balance;
  color:#F6F2E9;text-shadow:0 2px 24px rgba(0,0,0,.6)}
.hero .place{font-size:.9rem;color:#D8D2C6;margin:0 0 .5rem;letter-spacing:.06em}
.hero .when{font-family:var(--disp);font-size:1.02rem;color:#F1EADC;margin:0;
  font-variant-numeric:tabular-nums;letter-spacing:.02em}

/* ── ナビ ── */
nav{position:sticky;top:0;z-index:20;background:rgba(14,18,25,.94);
  backdrop-filter:blur(10px);border-bottom:1px solid var(--rule)}
.nav-in{max-width:var(--wrap);margin:0 auto;display:flex;gap:.4rem;padding:.55rem .8rem;
  overflow-x:auto;scrollbar-width:none}
.nav-in::-webkit-scrollbar{display:none}
nav a{flex:0 0 auto;font-size:.79rem;font-weight:500;text-decoration:none;
  color:var(--dim);padding:.34rem .7rem;border-radius:999px;border:1px solid var(--rule);
  white-space:nowrap;transition:color .15s,border-color .15s,background .15s}
nav a:hover,nav a:focus-visible{color:var(--text);border-color:var(--mut);background:var(--panel)}
nav a[aria-current]{background:var(--panel2);border-color:var(--gold);color:var(--gold)}
nav a.n1[aria-current]{border-color:var(--shu);color:var(--shu)}
nav a.n2[aria-current]{border-color:var(--ai);color:var(--ai)}
nav a.n3[aria-current]{border-color:var(--matsu);color:var(--matsu)}
nav a.n1{color:var(--shu);border-color:#4A2A21}
nav a.n2{color:var(--ai);border-color:#243547}
nav a.n3{color:var(--matsu);border-color:#20362B}

main{max-width:var(--wrap);margin:0 auto;padding:0 1.1rem 5rem}
section{padding-top:2.6rem;scroll-margin-top:3.6rem}
:focus-visible{outline:2px solid var(--gold);outline-offset:3px;border-radius:4px}

/* ── 章見出し ── */
.ch{display:flex;align-items:center;gap:.7rem;margin:0 0 1.1rem;
  padding-bottom:.55rem;border-bottom:1px solid var(--rule)}
.ch .num{flex:0 0 auto;font-family:var(--disp);font-size:.95rem;font-weight:700;
  color:var(--ink);background:var(--gold);line-height:1;
  min-width:1.85rem;height:1.85rem;border-radius:7px;display:grid;place-items:center;
  letter-spacing:0;padding:0 .3rem}
.ch h2{font-family:var(--disp);font-weight:700;font-size:1.32rem;margin:0;letter-spacing:.03em}
h3{font-size:1rem;font-weight:700;margin:2rem 0 .7rem;color:var(--text);
  padding-left:.62rem;border-left:3px solid var(--gold)}

/* ── 目玉カード ── */
.hi{display:grid;gap:.7rem;grid-template-columns:1fr;margin:1.3rem 0 0}
@media(min-width:38rem){.hi{grid-template-columns:repeat(3,1fr)}}
.hi-c{background:var(--panel);border:1px solid var(--rule);border-radius:14px;
  padding:1.1rem .9rem;text-align:center}
.hi-c .em{font-size:1.7rem;line-height:1;display:block;margin-bottom:.5rem}
.hi-c b{display:block;font-size:.95rem;margin-bottom:.3rem}
.hi-c span.d{font-size:.79rem;color:var(--dim);line-height:1.6;display:block}
.hi-c.d1{border-top:3px solid var(--shu)} .hi-c.d1 b{color:var(--shu)}
.hi-c.gold{border-top:3px solid var(--gold)} .hi-c.gold b{color:var(--gold)}
.hi-c.d3{border-top:3px solid var(--matsu)} .hi-c.d3 b{color:var(--matsu)}

/* ── 呼びかけ枠 ── */
.call{background:var(--panel);border:1px solid var(--rule);border-left:4px solid var(--gold);
  border-radius:0 12px 12px 0;padding:1rem 1.1rem;margin:1.2rem 0}
.call b{display:block;color:var(--gold);font-size:.9rem;margin-bottom:.45rem}
.call ul{margin:0;padding-left:1.05rem}
.call li{font-size:.89rem;color:var(--dim);margin:.28rem 0;line-height:1.75}
.meet{background:linear-gradient(135deg,#1B2534,#131A24);border:1px solid #2E3B4B;
  border-radius:14px;padding:1.4rem 1rem;text-align:center;margin:1.2rem 0}
.meet .big{font-family:var(--disp);font-size:clamp(1.25rem,5.6vw,1.7rem);font-weight:700;
  color:#F2ECDF;display:block;margin-bottom:.35rem;font-variant-numeric:tabular-nums}
.meet .sm{font-size:.84rem;color:var(--gold)}

/* ── 日ヘッダ ── */
.day{display:flex;gap:.85rem;align-items:flex-start;border-radius:14px;padding:.95rem 1rem;margin:0 0 1.2rem}
.day .badge{flex:0 0 auto;width:3rem;text-align:center;font-family:var(--disp);line-height:1;padding-top:.1rem}
.day .badge small{display:block;font-size:.56rem;letter-spacing:.18em;opacity:.85;margin-bottom:.15rem}
.day .badge strong{font-size:1.9rem;font-weight:700}
.day .dd{font-family:var(--disp);font-size:1.16rem;font-weight:700;margin:0 0 .1rem}
.day .rt{font-size:.83rem;font-weight:700;margin:0 0 .15rem;color:var(--text)}
.day .ld{font-size:.78rem;color:var(--dim);margin:0;line-height:1.65}
.day.d1{background:var(--shu-soft);border:1px solid #4A2A21}
.day.d1 .badge,.day.d1 .dd{color:var(--shu)}
.day.d2{background:var(--ai-soft);border:1px solid #243547}
.day.d2 .badge,.day.d2 .dd{color:var(--ai)}
.day.d3{background:var(--matsu-soft);border:1px solid #20362B}
.day.d3 .badge,.day.d3 .dd{color:var(--matsu)}

/* ── タイムライン ── */
.tl{list-style:none;margin:0;padding:0}
.ev{display:grid;grid-template-columns:3.6rem 1fr;gap:.85rem;position:relative;
  padding:.75rem 0 .85rem}
.ev+.ev{border-top:1px solid var(--rule-soft)}
.ev-t{text-align:right;padding-top:.1rem}
.hh{font-family:var(--disp);font-size:1rem;font-weight:700;font-variant-numeric:tabular-nums;
  letter-spacing:.01em;display:block}
.ic{font-size:.86rem;display:block;margin-top:.15rem;opacity:.85}
.ev-b h4{font-size:.96rem;font-weight:700;margin:0 0 .2rem;line-height:1.6}
.ev.big .ev-b h4{font-size:1.05rem}
.ev-b .meta{font-size:.76rem;color:var(--mut);margin:.1rem 0 .3rem;line-height:1.65}
.ev-b .ln{font-size:.845rem;color:var(--dim);margin:.14rem 0;line-height:1.78}
.ev-b .ln.warn{color:var(--gold)}
#d1 .hh{color:var(--shu)} #d2 .hh{color:var(--ai)} #d3 .hh{color:var(--matsu)}

.ev.hl .ev-b{background:var(--panel);border:1px solid var(--rule);border-radius:13px;
  padding:.95rem 1rem;margin-top:-.15rem}
#d1 .ev.hl .ev-b{background:linear-gradient(160deg,#2A1811,#171C25);border-color:#4E2C22}
#d2 .ev.hl .ev-b{background:linear-gradient(160deg,#152230,#171C25);border-color:#2A3D52}
.tag{display:inline-block;font-size:.66rem;font-weight:700;letter-spacing:.14em;
  padding:.14rem .5rem;border-radius:999px;margin-bottom:.45rem}
#d1 .tag{background:var(--shu);color:#160C09} #d2 .tag{background:var(--ai);color:#0C1620}
.hl-title{font-family:var(--disp);font-size:1.18rem!important;margin-bottom:.45rem!important}
#d1 .hl-title{color:var(--shu)} #d2 .hl-title{color:var(--ai)}
.route{font-size:.85rem;font-weight:700;margin:.65rem 0 0;padding:.5rem .7rem;
  border-radius:8px;background:rgba(255,255,255,.05);line-height:1.6}
#d1 .route{color:var(--shu)} #d2 .route{color:var(--ai)}

.ev.ft .ev-b{background:var(--panel);border:1px solid var(--rule);border-radius:13px;padding:.95rem 1rem}
.ft-list{list-style:none;margin:0;padding:0;counter-reset:f}
.ft-list li{counter-increment:f;margin:0 0 .6rem;padding-left:1.5rem;position:relative}
.ft-list li::before{content:counter(f);position:absolute;left:0;top:.15rem;
  font-size:.68rem;font-weight:700;width:1.05rem;height:1.05rem;border-radius:50%;
  display:grid;place-items:center;background:var(--ai);color:#0C1620}
.ft-list b{display:block;font-size:.92rem}
.ft-list span{display:block;font-size:.8rem;color:var(--dim);line-height:1.65}
.ft-foot{font-size:.83rem;font-weight:700;color:var(--ai);margin:.2rem 0 0}

.mark{text-align:center;font-family:var(--disp);font-weight:700;
  font-size:clamp(.98rem,4.3vw,1.16rem);margin:1.3rem 0;padding:.8rem .7rem;border-radius:12px;
  font-variant-numeric:tabular-nums;line-height:1.5}
.mark-d1{background:var(--shu);color:#1A0D09}
.mark-d2{background:var(--ai);color:#0B1520}
.mark-d3{background:var(--matsu);color:#0B1A13}

/* ── 写真 ── */
.ph{margin:1.15rem 0;padding:0}
.ph img{width:100%;height:auto;border-radius:13px;border:1px solid var(--rule);cursor:zoom-in;
  background:var(--panel)}
.ph figcaption{font-size:.735rem;color:var(--mut);margin-top:.45rem;line-height:1.7;text-align:center}
.ph-pair{display:grid;gap:.7rem;grid-template-columns:1fr}
@media(min-width:32rem){.ph-pair{grid-template-columns:1fr 1fr}}
.ph-pair .ph{margin:1.15rem 0 0}

/* ── 表 ── */
.tw{overflow-x:auto;-webkit-overflow-scrolling:touch;margin:.9rem 0;
  border:1px solid var(--rule);border-radius:12px}
table{border-collapse:collapse;width:100%;min-width:30rem;font-size:.82rem}
th,td{text-align:left;padding:.62rem .7rem;border-bottom:1px solid var(--rule-soft);
  vertical-align:top;line-height:1.7}
thead th{background:var(--panel2);color:var(--text);font-weight:700;font-size:.75rem;
  letter-spacing:.05em;white-space:nowrap;border-bottom:1px solid var(--rule)}
tbody th{font-weight:700;color:var(--text);background:rgba(255,255,255,.022)}
td{color:var(--dim)}
tbody tr:last-child th,tbody tr:last-child td{border-bottom:0}
tr.total th,tr.total td{background:var(--gold-soft);color:var(--gold);font-weight:700;
  border-top:2px solid var(--gold);font-size:.9rem}
.tw.money tbody th{color:var(--gold)}

/* 狭い画面では表を1件ずつのカードに畳む（横スクロールさせない） */
@media(max-width:33.9rem){
  .tw{border:0;border-radius:0;overflow:visible}
  table{min-width:0}
  thead{position:absolute;width:1px;height:1px;margin:-1px;overflow:hidden;clip-path:inset(50%)}
  tbody tr{display:block;background:var(--panel);border:1px solid var(--rule);
    border-radius:11px;padding:.75rem .9rem;margin-bottom:.55rem}
  tbody th{display:block;background:none;padding:0 0 .4rem;border:0;font-size:.9rem;line-height:1.6}
  tbody td{display:grid;grid-template-columns:4.6rem 1fr;gap:.55rem;align-items:baseline;
    padding:.18rem 0;border:0;font-size:.8rem;line-height:1.72}
  tbody td::before{content:attr(data-l);color:var(--mut);font-size:.7rem;font-weight:700;
    letter-spacing:.03em}
  tbody td:empty{display:none}
  tbody tr.total{border-color:var(--gold);border-top-width:2px}
  tr.total th,tr.total td{background:none}
}

/* ── リスト ── */
.nums{list-style:none;counter-reset:n;margin:.7rem 0;padding:0}
.nums li{counter-increment:n;position:relative;padding-left:1.75rem;margin:.5rem 0;
  font-size:.88rem;color:var(--dim);line-height:1.8}
.nums li::before{content:counter(n);position:absolute;left:0;top:.28rem;
  width:1.2rem;height:1.2rem;border-radius:50%;background:var(--panel2);color:var(--gold);
  font-size:.7rem;font-weight:700;display:grid;place-items:center}
.nums li b{color:var(--text)}
.plain{margin:.6rem 0;padding-left:1.1rem}
.plain li{font-size:.87rem;color:var(--dim);margin:.35rem 0;line-height:1.8}

/* ── 連絡先 ── */
.tel{display:grid;gap:.55rem;margin:1rem 0}
.tel a{display:flex;justify-content:space-between;align-items:center;gap:.8rem;
  background:var(--panel);border:1px solid var(--rule);border-radius:11px;
  padding:.8rem .95rem;text-decoration:none;color:var(--text);transition:border-color .15s}
.tel a:hover,.tel a:focus-visible{border-color:var(--gold)}
.tel .nm{font-size:.88rem;font-weight:700;line-height:1.5}
.tel .no{font-size:.85rem;color:var(--gold);font-variant-numeric:tabular-nums;white-space:nowrap}
.tel .sub{display:block;font-size:.72rem;color:var(--mut);font-weight:400;margin-top:.12rem}

.end{text-align:center;margin:3.2rem 0 0;padding:1.7rem 1rem;
  background:linear-gradient(135deg,#1B2534,#131A24);border:1px solid #2E3B4B;border-radius:14px}
.end .l1{font-family:var(--disp);font-size:clamp(1.1rem,5vw,1.4rem);font-weight:700;
  color:#F2ECDF;margin:0 0 .35rem;font-variant-numeric:tabular-nums}
.end .l2{font-size:.8rem;color:var(--mut);margin:0}
.foot{text-align:center;font-size:.72rem;color:var(--mut);margin-top:1.6rem;line-height:1.9}

/* ── 拡大表示 ── */
.lb{position:fixed;inset:0;z-index:60;background:rgba(8,10,14,.96);display:none;
  place-items:center;padding:1rem;cursor:zoom-out}
.lb[data-open="1"]{display:grid}
.lb img{max-width:100%;max-height:82vh;width:auto;height:auto;border-radius:10px;object-fit:contain}
.lb p{color:var(--dim);font-size:.78rem;text-align:center;margin:.8rem auto 0;max-width:34rem;line-height:1.7}
</style>

<header class="hero">
  <img src="${dataUri('cover_sakura_night')}" alt="夜桜にライトアップされた御船山楽園">
  <div class="hero-in">
    <p class="kicker">三十路会 ／ 第4回</p>
    <h1>佐賀・福岡旅行</h1>
    <p class="place">武雄温泉 らかんの湯 ／ 博多・中洲</p>
    <p class="when">2027年3月20日(土) − 22日(月・振休)　2泊3日</p>
  </div>
</header>

<nav>
  <div class="nav-in">
    <a href="#intro">集合</a>
    <a href="#d1" class="n1">Day1 武雄温泉</a>
    <a href="#d2" class="n2">Day2 博多</a>
    <a href="#d3" class="n3">Day3 長浜</a>
    <a href="#book">予約</a>
    <a href="#money">見積</a>
    <a href="#pack">持ち物</a>
    <a href="#tel">連絡先</a>
  </div>
</nav>

<main>

<section id="intro">
  <div class="ch"><span class="num">Ⅰ</span><h2>参加メンバーと集合について</h2></div>

  <div class="call">
    <b>最初に、ここだけ読んでください</b>
    <ul>
      <li>今回は飛行機を各自で手配します。同じ便に乗る必要はありません。</li>
      <li>空港での集合はありません。全体の集合は 3月20日 11:00・博多駅です。</li>
      <li>1日だけの参加、途中合流、途中離脱、いずれも歓迎です。</li>
    </ul>
  </div>

  <div class="hi">
    ${HIGHLIGHTS.map(([em, t, d, c]) => `<div class="hi-c ${c}">
      <span class="em">${em}</span><b>${esc(t)}</b><span class="d">${esc(d)}</span></div>`).join('')}
  </div>

  <h3>(1) 参加メンバー</h3>
  ${tableHtml(D.MEMBERS.head, D.MEMBERS.rows)}

  <h3>(2) 飛行機は各自手配です</h3>
  <ul class="plain">
    <li>航空券は各自で予約するため、乗る便も座席もバラバラです。同じ便に乗る必要はありません。</li>
    <li>幹事（高山）が乗る便は下記のとおりですが、あくまで参考情報です。</li>
  </ul>
  ${tableHtml(D.FLIGHTS.head, D.FLIGHTS.rows)}
  <ul class="plain">
    <li>近くの席に座りたい人は、予約時に1列目付近を指定してください（1列目は席数が限られ、追加料金がかかる場合があります）。</li>
    <li>浅野は福岡在住のため、飛行機の手配はありません。</li>
  </ul>

  <h3>(3) 全体の集合</h3>
  <div class="meet">
    <span class="big">3月20日(土)　11:00　博多駅</span>
    <span class="sm">空港での集合はありません</span>
  </div>
  ${photo('hakata_station', '博多駅。地下鉄空港線で福岡空港から2駅・約6分')}
  <ul class="plain">
    <li>東京組は各自の便で福岡空港に到着し、地下鉄で博多駅へ向かってください（2駅・約6分）。</li>
    <li>浅野は天神から博多駅へ直接来ます。</li>
    <li>全員が博多駅に11:00集合し、そこから昼食 → 武雄温泉へ移動します。</li>
  </ul>

  <h3>(4) 途中合流・途中離脱</h3>
  <ol class="nums">
    <li><b>朝が早すぎる人</b><br>昼の便（例：ジェットスター GK509　11:30成田発 → 13:55福岡着）でも参加できます。博多14:35頃発の特急に乗れば、夕食18:00に間に合います。サウナは夜の部から合流。</li>
    <li><b>武雄温泉から合流する人</b><br>武雄温泉駅に13:55集合でも可（2023年に浅野が使った方式）。</li>
    <li><b>途中で帰る人（森本を想定）</b><br>案A：3/21の夜、福岡発の最終便で帰京（カンデオ泊なし・もつ鍋まで参加）。案B：3/21はカンデオに泊まり、3/22の朝に離脱。</li>
  </ol>
</section>

${DAYS.map((d) => `<section id="${d.key}">
  ${d.n === 1 ? '<div class="ch"><span class="num">Ⅱ</span><h2>日程</h2></div>' : ''}
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

<section id="book">
  <div class="ch"><span class="num">Ⅲ</span><h2>予約の分担</h2></div>
  ${tableHtml(D.BOOKINGS.head, D.BOOKINGS.rows)}
  <div class="call"><ul>${D.BOOKINGS.notes.map((n) => `<li>${esc(n)}</li>`).join('')}</ul></div>
</section>

<section id="money">
  <div class="ch"><span class="num">Ⅳ</span><h2>見積</h2></div>
  ${tableHtml(D.BUDGET.head, D.BUDGET.rows, { total: D.BUDGET.total }).replace('class="tw"', 'class="tw money"')}
  <div class="call"><ul>${D.BUDGET.notes.map((n) => `<li>${esc(n)}</li>`).join('')}</ul></div>
</section>

<section id="pack">
  <div class="ch"><span class="num">Ⅴ</span><h2>持ち物・注意事項</h2></div>
  <h3>(1) 持ち物</h3>
  <ol class="nums">${D.PACKING.map(([t, s]) => `<li><b>${esc(t)}</b>${s ? '　— ' + esc(s) : ''}</li>`).join('')}</ol>
  <h3>(2) 服装</h3>
  <p class="ld" style="font-size:.88rem;color:var(--dim);margin:.5rem 0">3月下旬の九州は、日中は過ごしやすいものの朝晩は冷えます。羽織るものが1枚あると安心です。</p>
  <h3>(3) 注意事項</h3>
  <ol class="nums">${D.CAUTIONS.map((t) => `<li>${esc(t)}</li>`).join('')}</ol>
</section>

<section id="tel">
  <div class="ch"><span class="num">Ⅵ</span><h2>連絡先</h2></div>
  <div class="tel">
    ${D.CONTACTS.rows.map(([nm, no, sub]) => `<a href="tel:${no.replace(/-/g, '')}">
      <span class="nm">${esc(nm)}<span class="sub">${esc(sub)}</span></span>
      <span class="no">${esc(no)}</span></a>`).join('')}
  </div>
  <p class="foot">タップでそのまま電話できます。</p>
</section>

<section id="check">
  <div class="ch"><span class="num">Ⅶ</span><h2>現時点で確定していないこと</h2></div>
  <p class="ld" style="font-size:.85rem;color:var(--dim);margin:.4rem 0 .2rem">本文中に「要確認」と書いてある項目です。確定次第、版を上げて配り直します。</p>
  ${tableHtml(D.TOCHECK.head, D.TOCHECK.rows)}
  <h3>確認が取れたもの</h3>
  ${tableHtml(D.TOCHECK.head, D.TOCHECK.resolved)}
</section>

<section id="diff">
  <div class="ch"><span class="num">Ⅷ</span><h2>2023年7月と、ここが違います</h2></div>
  ${tableHtml(D.DIFF.head, D.DIFF.rows)}
</section>

<section id="cred">
  <div class="ch"><span class="num">Ⅸ</span><h2>写真について</h2></div>
  <p class="ld" style="font-size:.83rem;color:var(--dim);margin:.4rem 0 .6rem">
    このしおりは参加メンバー5人に配る私的な文書です。らかんの湯・料理・客室・庭園など施設の写真は各施設の公式サイトのもの、博多駅・空港・屋台・中洲など街の風景はウィキメディア・コモンズの自由利用可能な画像です。</p>
  <h3>各施設の公式サイト</h3>
  ${tableHtml(['ファイル', '提供', '出所'], creditRows('official'))}
  <h3>ウィキメディア・コモンズ</h3>
  ${tableHtml(['ファイル', '撮影者', 'ライセンス'], creditRows('commons'))}
</section>

<div class="end">
  <p class="l1">それでは、3月20日 11:00　博多駅で。</p>
  <p class="l2">作成：高山　／　2026年8月29日　ver.01</p>
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
  // 読んでいる章のタブに印を付ける
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
