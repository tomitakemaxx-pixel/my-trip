// Web版しおりの共通部品。build-web.js（佐賀・福岡）と
// build-web-chichibu.js（秩父）の両方から使う。
// Artifact の CSP は外部画像を通さないため、写真はすべて data URI で埋め込む。

const fs = require('fs');
const path = require('path');

function makeWebKit(WEBIMG) {
// JPEG の SOF マーカーから実寸を読む（img に width/height を出して
  // 遅延読み込み時のガタつき＝レイアウトシフトを防ぐ）
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
    throw new Error('no SOF in ' + buf.length);
  }
  
  const cache = {};
  function asset(key) {
    if (!cache[key]) {
      const buf = fs.readFileSync(path.join(WEBIMG, key + '.jpg'));
      cache[key] = { uri: 'data:image/jpeg;base64,' + buf.toString('base64'), ...jpegSize(buf) };
    }
    return cache[key];
  }
  const dataUri = (key) => asset(key).uri;
  
  const esc = (s) => String(s)
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  
  // ── 部品 ────────────────────────────────────────────────
  function photo(key, cap, cls = '') {
    const a = asset(key);
    return `<figure class="ph ${cls}">
        <img src="${a.uri}" alt="${esc(cap || '')}" width="${a.w}" height="${a.h}" loading="lazy" decoding="async">
        ${cap ? `<figcaption>${esc(cap)}</figcaption>` : ''}
      </figure>`;
  }
  
  function photoPair(a, b, capA, capB) {
    return `<div class="ph-pair">${photo(a, capA)}${photo(b, capB)}</div>`;
  }
  
  function slot(b) {
    const lines = b.lines.map((l) => {
      const warn = l.includes('要確認');
      return `<p class="ln${warn ? ' warn' : ''}">${esc(l)}</p>`;
    }).join('');
    return `<li class="ev${b.big ? ' big' : ''}">
        <div class="ev-t"><span class="hh">${esc(b.time)}</span>${b.icon ? `<span class="ic">${b.icon}</span>` : ''}</div>
        <div class="ev-b">
          <h4>${esc(b.title)}</h4>
          ${b.sub ? `<p class="meta">${esc(b.sub)}</p>` : ''}
          ${lines}
        </div>
      </li>`;
  }
  
  function highlight(b) {
    return `<li class="ev hl">
        <div class="ev-t"><span class="hh">${esc(b.time)}</span></div>
        <div class="ev-b">
          <span class="tag">${esc(b.label)}</span>
          <h4 class="hl-title">${esc(b.title)}</h4>
          ${b.lines.map((l) => `<p class="ln">${esc(l)}</p>`).join('')}
          ${b.route ? `<p class="route">${esc(b.route)}</p>` : ''}
        </div>
      </li>`;
  }
  
  function freetime(b) {
    return `<li class="ev ft">
        <div class="ev-t"></div>
        <div class="ev-b">
          <ol class="ft-list">
            ${b.items.map((it) => `<li><b>${esc(it[0])}</b><span>${esc(it[1])}</span></li>`).join('')}
          </ol>
          <p class="ft-foot">${esc(b.foot)}</p>
        </div>
      </li>`;
  }
  
  function renderDay(blocks, dayKey) {
    const out = [];
    let evs = [];
    const flush = () => { if (evs.length) { out.push(`<ol class="tl">${evs.join('')}</ol>`); evs = []; } };
    for (const b of blocks) {
      switch (b.t) {
        case 'slot': evs.push(slot(b)); break;
        case 'highlight': evs.push(highlight(b)); break;
        case 'freetime': evs.push(freetime(b)); break;
        case 'banner':
          flush();
          out.push(`<p class="mark mark-${b.color}">${esc(b.text)}</p>`);
          break;
        case 'img': flush(); out.push(photo(b.key, b.cap)); break;
        case 'imgpair': flush(); out.push(photoPair(b.a, b.b, b.capA, b.capB)); break;
        default: break;
      }
    }
    flush();
    return out.join('\n');
  }
  
  // 狭い画面では CSS 側でカード表示に切り替わるので、
  // 各セルに見出し名を data-l として持たせておく。
  function tableHtml(head, rows, o = {}) {
    const cells = (r, cls = '') => r.map((v, i) => (i === 0
      ? `<th scope="row">${esc(v)}</th>`
      : `<td data-l="${esc(head[i] || '')}"${cls}>${esc(v)}</td>`)).join('');
    const total = o.total ? `<tr class="total">${cells(o.total)}</tr>` : '';
    return `<div class="tw"><table>
        <thead><tr>${head.map((h) => `<th>${esc(h)}</th>`).join('')}</tr></thead>
        <tbody>${rows.map((r) => `<tr>${cells(r)}</tr>`).join('')}
        ${total}</tbody>
      </table></div>`;
  }

  return { jpegSize, asset, dataUri, esc, photo, photoPair, slot, highlight,
           freetime, renderDay, tableHtml };
}

module.exports = { makeWebKit };
