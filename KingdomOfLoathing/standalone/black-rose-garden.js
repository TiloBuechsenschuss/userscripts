// ==UserScript==
// @name         KoL Black Rose Garden
// @author       Tilo
// @namespace    https://github.com/TiloBuechsenschuss
// @downloadURL  https://raw.githubusercontent.com/TiloBuechsenschuss/userscripts/refs/heads/main/KingdomOfLoathing/standalone/black-rose-garden.js
// @version      1.2
// @description  Draws a top-down map of the Black Rose Garden maze beside its 3D view.
// @match        https://www.kingdomofloathing.com/choice.php*
// @match        https://kingdomofloathing.com/choice.php*
// @grant        none

// ==/UserScript==

/*
 * KoL Black Rose Garden
 *
 * Draws a top-down map of the Black Rose Garden (choice.php whichchoice=1637) beside its 3D
 *   view: hedge, floor, start, your own position and facing (which follows you as you walk),
 *   a table of the things to fight or take (pending vs done) and a legend table side by side
 *   under it, and the cipher plaque letters. The game's own list of buttons that take you to
 *   each thing, which it otherwise shows only when you press Tab twice, is shown as well
 *   (confirmed on the live page, 2026-10-05). The map is kept between visits and shows when it was
 *   started; "Reset map" starts a new one. The garden changes
 *   every KoL day, and the page shows the whole new maze from the first visit, so a new
 *   garden replaces the old map by itself. One map is stored per browser, not per character.
 *   Confirmed against the live page: the map draws from an explored maze, the arrow follows
 *   movement, and the layout holds side by side at 125% zoom (2026-10-01); the whole maze is
 *   there on the first visit of a new day (2026-10-02). Not yet confirmed: Reset map and the
 *   switch to a new map when the garden changes.
 *
 * This is a STANDALONE script: it lives alone in KingdomOfLoathing/standalone/, is not part of the all-in-one
 *   loader, and has no settings -- installing it is what turns the map on. It is an extra
 *   offer for players who want only the map: KoL IotM Menu (iotm.js) still carries the same
 *   map, byte for byte (tests/black-rose-garden.test.mjs checks that), and shares its storage
 *   key (tm-iotm-rosegarden) and element ids, so having both installed draws one map, not two.
 */

(function () {
  'use strict';

  // === Black Rose Garden map (choice.php, whichchoice=1637) ============
  // The garden is a first-person maze whose layout changes every KoL day. The page
  // hands the whole state to its renderer as `var RG = {w, grid, pos, pois, plaques}`
  // (okf/kingdom-of-loathing/black-rose-garden.md): grid chars 0 floor, 1 wall, 2 rocks,
  // 3 decor, 4 poi, 8 start, 5/6/7 wall art; pos.f 0=N 1=E 2=S 3=W. The grid is the whole
  // maze from the first visit of a day, so it is taken from the page as it is; a hedge
  // layout unlike the stored one is a new garden and starts a new map, so no clock is
  // needed to tell the days apart. We keep a copy in localStorage for the start time and
  // the union of plaques, and draw it top-down beside the 3D view. The renderer saves the
  // player's cell with an XHR (choice.php option=4, rgx/rgy/rgf) whenever a run of moves
  // ends; hooking that gives the live position without touching the game's script.
  const ROSE_CHOICE = '1637';
  const ROSE_KEY = 'tm-iotm-rosegarden';
  const ROSE_ARROWS = ['▲', '▶', '▼', '◀'];   // N E S W
  const ROSE_FACING = ['north', 'east', 'south', 'west'];
  const ROSE_POI_GLYPH = {
    monster: 'M', fountain: 'F', food: 'f', booze: 'b', spleen: 's', chest: 'C'
  };

  // The `var RG = {...};` object out of page HTML, or null.
  function parseRoseGarden(html) {
    const m = /var RG = (\{.*?\});\s*<\/script>/.exec(html || '');
    if (!m) return null;
    try {
      const rg = JSON.parse(m[1]);
      return rg && typeof rg.grid === 'string' && rg.w > 0 ? rg : null;
    } catch (e) { return null; }
  }

  function roseCopyPois(rg) {
    const out = {};
    (rg.pois || []).forEach(function (p) {
      out[p.i] = { x: p.x, y: p.y, k: p.k, label: p.label, d: p.d ? 1 : 0 };
    });
    return out;
  }
  function roseCopyPlaques(rg) {
    return (rg.plaques || []).map(function (q) {
      return { x: q.x, y: q.y, f: q.f, icon: q.icon || '' };
    });
  }

  function roseWall(ch) { return ch === '1' || ch === '5' || ch === '6' || ch === '7'; }

  // Whether two grids are the same garden: same size, hedge in the same cells.
  function sameGarden(a, b) {
    if (a.length !== b.length) return false;
    for (let i = 0; i < a.length; i++) {
      if (roseWall(a.charAt(i)) !== roseWall(b.charAt(i))) return false;
    }
    return true;
  }

  // A new stored map from one page load's RG.
  function freshMap(rg, now) {
    return {
      v: 1,
      startedAt: now,
      w: rg.w,
      grid: rg.grid,
      pos: { x: rg.pos.x, y: rg.pos.y, f: rg.pos.f },
      pois: roseCopyPois(rg),
      plaques: roseCopyPlaques(rg)
    };
  }

  // Fold one page load into the stored map: a different garden starts a new map at
  // `now`; otherwise the grid is the page's, pois are replaced by id, plaques are a
  // union by x,y,f, and position follows the page.
  function mergeMap(map, rg, now) {
    if (!sameGarden(map.grid, rg.grid)) return freshMap(rg, now);
    const plaques = map.plaques.slice();
    roseCopyPlaques(rg).forEach(function (q) {
      const seen = plaques.some(function (o) {
        return o.x === q.x && o.y === q.y && o.f === q.f;
      });
      if (!seen) plaques.push(q);
    });
    const pois = Object.assign({}, map.pois, roseCopyPois(rg));
    return {
      v: 1, startedAt: map.startedAt, w: rg.w, grid: rg.grid,
      pos: { x: rg.pos.x, y: rg.pos.y, f: rg.pos.f }, pois: pois, plaques: plaques
    };
  }

  // {x, y, f} out of the renderer's position-save body, else null.
  function parsePosBody(body) {
    if (typeof body !== 'string') return null;
    const q = new URLSearchParams(body);
    if (q.get('option') !== '4') return null;
    const x = parseInt(q.get('rgx'), 10);
    const y = parseInt(q.get('rgy'), 10);
    const f = parseInt(q.get('rgf'), 10);
    if (!(x >= 0 && y >= 0 && f >= 0 && f <= 3)) return null;
    return { x: x, y: y, f: f };
  }

  // The box around every non-hedge cell plus a one-cell margin (plaques hang on the
  // hedge next to open floor), clamped to the grid. All hedge: the whole grid.
  function mapBounds(grid, w) {
    const h = Math.floor(grid.length / w);
    let x0 = w, x1 = -1, y0 = h, y1 = -1;
    for (let i = 0; i < grid.length; i++) {
      if (grid.charAt(i) === '1') continue;
      const x = i % w, y = Math.floor(i / w);
      if (x < x0) x0 = x;
      if (x > x1) x1 = x;
      if (y < y0) y0 = y;
      if (y > y1) y1 = y;
    }
    if (x1 < 0) return { x0: 0, x1: w - 1, y0: 0, y1: h - 1 };
    return {
      x0: Math.max(0, x0 - 1), x1: Math.min(w - 1, x1 + 1),
      y0: Math.max(0, y0 - 1), y1: Math.min(h - 1, y1 + 1)
    };
  }

  // Cipher letter of a plaque icon: icon_u.png -> U; a blank plaque -> a dot.
  function plaqueLetter(icon) {
    if (!icon) return '·';
    const m = /(?:^|\/)icon_([a-z])\.png$/i.exec(icon);
    return m ? m[1].toUpperCase() : '?';
  }

  function loadRoseMap() {
    try {
      const o = JSON.parse(localStorage.getItem(ROSE_KEY));
      if (o && o.v === 1 && typeof o.grid === 'string') return o;
    } catch (e) { /* fall through */ }
    return null;
  }
  function saveRoseMap(map) {
    try { localStorage.setItem(ROSE_KEY, JSON.stringify(map)); }
    catch (e) { /* storage unavailable */ }
  }

  function roseStamp(ms) {
    const d = new Date(ms);
    function p(n) { return (n < 10 ? '0' : '') + n; }
    return d.getFullYear() + '-' + p(d.getMonth() + 1) + '-' + p(d.getDate()) +
      ' ' + p(d.getHours()) + ':' + p(d.getMinutes());
  }

  // One map cell. Shape carries the meaning (letters, arrows, marks); colour only
  // backs it up. The player is blue on yellow, a pending thing is on pale blue.
  function roseCell(map, x, y) {
    const ch = map.grid.charAt(y * map.w + x);
    const el = document.createElement('div');
    el.style.cssText = 'width:15px;height:15px;line-height:15px;text-align:center;' +
      'font:bold 11px/15px monospace;overflow:hidden';
    if (roseWall(ch)) {
      el.style.background = '#3a3a3a';
      el.style.color = '#fff';
      const here = map.plaques.filter(function (q) { return q.x === x && q.y === y; });
      if (here.length) {
        el.textContent = plaqueLetter(here[0].icon);
        el.style.fontSize = '9px';
        el.title = 'Plaque ' + here.map(function (q) {
          return plaqueLetter(q.icon) + ' (seen facing ' + ROSE_FACING[q.f] + ')';
        }).join(', ');
      }
      return el;
    }
    el.style.background = '#f1ead2';
    el.style.color = '#555';
    if (ch === '3') el.textContent = '•';
    if (ch === '8') { el.textContent = '○'; el.title = 'Start'; }
    Object.keys(map.pois).forEach(function (id) {
      const p = map.pois[id];
      if (p.x !== x || p.y !== y) return;
      el.title = p.label + (p.d ? ' (done)' : '');
      if (p.d) {
        el.textContent = '×';
        el.style.color = '#999';
      } else {
        el.textContent = ROSE_POI_GLYPH[p.k] || '?';
        el.style.background = '#cfe0ff';
        el.style.color = '#000';
      }
    });
    if (map.pos.x === x && map.pos.y === y) {
      el.textContent = ROSE_ARROWS[map.pos.f];
      el.style.background = '#ffd400';
      el.style.color = '#0033cc';
      el.title = 'You, facing ' + ROSE_FACING[map.pos.f];
    }
    return el;
  }

  const ROSE_LEGEND = [
    ['▲▶▼◀', 'you, facing'],
    ['M', 'monster'], ['F', 'fountain'], ['f', 'food'], ['b', 'booze'], ['s', 'spleen'],
    ['C', 'chest'], ['×', 'done'], ['○', 'start'], ['•', 'decor'],
    ['dark', 'hedge; a letter on it is a cipher plaque']
  ];

  // A small captioned table; `empty` is shown instead of the rows when there are none.
  function roseTable(caption, heads, rows, empty) {
    const t = document.createElement('table');
    t.style.cssText = 'border-collapse:collapse;font-size:11px;background:#fff';
    const cap = document.createElement('caption');
    cap.style.cssText = 'font-weight:bold;text-align:left';
    cap.textContent = caption;
    t.appendChild(cap);
    const hr = document.createElement('tr');
    heads.forEach(function (h) {
      const th = document.createElement('th');
      th.style.cssText = 'border:1px solid #999;padding:1px 4px;background:#eee;text-align:left';
      th.textContent = h;
      hr.appendChild(th);
    });
    t.appendChild(hr);
    if (!rows.length) {
      const tr = document.createElement('tr');
      const td = document.createElement('td');
      td.colSpan = heads.length;
      td.style.cssText = 'border:1px solid #999;padding:1px 4px;color:#555';
      td.textContent = empty || '';
      tr.appendChild(td);
      t.appendChild(tr);
    }
    rows.forEach(function (r) {
      const tr = document.createElement('tr');
      r.forEach(function (c, i) {
        const td = document.createElement('td');
        td.style.cssText = 'border:1px solid #999;padding:1px 4px' +
          (i === 0 ? ';font:bold 11px monospace;text-align:center' : '');
        td.textContent = c;
        tr.appendChild(td);
      });
      t.appendChild(tr);
    });
    return t;
  }

  function buildRosePanel(map, onReset) {
    const wrap = document.createElement('div');
    wrap.id = 'tm-rosegarden';
    wrap.style.cssText = 'flex:0 1 auto;min-width:0;padding:6px;border:1px solid #888;' +
      'background:#fff;text-align:center;font-size:12px';

    const head = document.createElement('div');
    head.style.cssText = 'margin-bottom:4px';
    const title = document.createElement('b');
    title.textContent = 'Garden map — started ' + roseStamp(map.startedAt) + ' ';
    head.appendChild(title);
    const reset = document.createElement('button');
    reset.type = 'button';
    reset.className = 'button';
    reset.textContent = 'Reset map';
    reset.addEventListener('click', function () {
      if (window.confirm('Throw away this map and start mapping again?')) onReset();
    });
    head.appendChild(reset);
    wrap.appendChild(head);

    const b = mapBounds(map.grid, map.w);
    const grid = document.createElement('div');
    grid.style.cssText = 'display:inline-grid;gap:1px;background:#999;border:1px solid #999;' +
      'grid-template-columns:repeat(' + (b.x1 - b.x0 + 1) + ',15px)';
    for (let y = b.y0; y <= b.y1; y++) {
      for (let x = b.x0; x <= b.x1; x++) grid.appendChild(roseCell(map, x, y));
    }
    wrap.appendChild(grid);

    // The checklist and the legend as tables, side by side under the map. They are
    // also the touch path: cell tooltips never show on a phone.
    const pois = Object.keys(map.pois).map(function (id) { return map.pois[id]; });
    const things = roseTable('Things', ['', 'What', 'State'], pois.map(function (p) {
      return [ROSE_POI_GLYPH[p.k] || '?', p.label, p.d ? '× done' : 'pending'];
    }), 'None seen yet.');
    const key = roseTable('Legend', ['', 'Means'], ROSE_LEGEND);
    const tables = document.createElement('div');
    tables.style.cssText = 'display:flex;flex-wrap:wrap;gap:8px;justify-content:center;' +
      'align-items:flex-start;margin-top:6px;text-align:left';
    tables.appendChild(things);
    tables.appendChild(key);
    wrap.appendChild(tables);

    const letters = map.plaques.slice().sort(function (a, c) { return a.y - c.y || a.x - c.x; })
      .map(function (q) { return plaqueLetter(q.icon); });
    const plq = document.createElement('div');
    plq.style.cssText = 'margin-top:4px';
    plq.textContent = letters.length ? 'Plaques, top to bottom: ' + letters.join(' ') : 'No plaques seen yet.';
    wrap.appendChild(plq);
    return wrap;
  }

  // The game's own list of things (#rgpois): one form (class rgpoi) per point of
  // interest, each with a button that takes you to it. Once the 3D view is up the page
  // hides the list as screen-reader-only (class rgsr), so a sighted player only reaches
  // it by pressing Tab into it. Show it: swap rgsr for a class of our own. Any non-empty
  // class also keeps the renderer, which sets rgsr only on a list with no class at all,
  // from hiding it again should it run after us. A list with no class (the page's
  // fallback when the 3D view cannot start) is already shown and is left alone.
  function showRosePois() {
    const list = document.getElementById('rgpois');
    if (list && list.className === 'rgsr') list.className = 'tm-rgpois';
  }

  // Each rgpoi form carries the player's cell (rgx, rgy, rgf) as the page was loaded;
  // the renderer fills in the current one only on the form it submits for F. Keep them
  // all current, so a button pressed after walking sends where you stand.
  function syncRosePoiForms(pos) {
    const forms = document.getElementsByClassName('rgpoi');
    for (let i = 0; i < forms.length; i++) {
      const f = forms[i];
      if (!f.rgx || !f.rgy || !f.rgf) continue;
      f.rgx.value = pos.x;
      f.rgy.value = pos.y;
      f.rgf.value = pos.f;
    }
  }

  function initRoseGarden() {
    if (document.getElementById('tm-rosegarden')) return;
    if (!document.querySelector(
        'input[name="whichchoice"][value="' + ROSE_CHOICE + '"]')) {
      return;
    }
    const rg = (window.RG && typeof window.RG.grid === 'string' && window.RG) ||
      parseRoseGarden(document.documentElement.innerHTML);
    if (!rg) return;
    const anchor = document.getElementById('rgwrap') || document.getElementById('rgtext');
    if (!anchor || !anchor.parentNode) return;
    showRosePois();

    const stored = loadRoseMap();
    let map = stored ? mergeMap(stored, rg, Date.now()) : freshMap(rg, Date.now());
    saveRoseMap(map);

    // Map beside the 3D view, not under it, so both are on screen at once. The view
    // and its key legend (#rgwrap) go into a flex row with the panel that never wraps:
    // the view takes what the panel leaves (down to the renderer's minimum width) and
    // the panel's two tables wrap inside it when space is short. The renderer sizes the view from
    // #rgwrap's width on resize, so give it one after the move.
    let layout = null;
    if (anchor.id === 'rgwrap') {
      layout = document.createElement('div');
      layout.id = 'tm-rosegarden-layout';
      layout.style.cssText = 'display:flex;flex-wrap:nowrap;gap:8px;justify-content:center;' +
        'align-items:flex-start';
      anchor.parentNode.insertBefore(layout, anchor);
      layout.appendChild(anchor);
      anchor.style.width = 'auto';
      anchor.style.margin = '0';
      anchor.style.flex = '1 1 0';
      anchor.style.minWidth = '240px';   // the renderer's own minimum view width
      try { window.dispatchEvent(new Event('resize')); } catch (e) { /* no resize event */ }
    }

    let panel = null;
    function draw() {
      const next = buildRosePanel(map, function () {
        const keep = map.pos;
        map = freshMap(rg, Date.now());
        map.pos = keep;
        saveRoseMap(map);
        draw();
      });
      if (panel && panel.parentNode) panel.parentNode.replaceChild(next, panel);
      else if (layout) layout.appendChild(next);
      else anchor.parentNode.insertBefore(next, anchor);
      panel = next;
    }
    draw();

    // The renderer's position save: follow it, then pass the request on untouched.
    const proto = window.XMLHttpRequest && window.XMLHttpRequest.prototype;
    if (proto && !proto.tmRoseGardenHooked) {
      proto.tmRoseGardenHooked = true;
      const send = proto.send;
      proto.send = function (body) {
        const pos = parsePosBody(body);
        if (pos) {
          map.pos = pos;
          saveRoseMap(map);
          draw();
          syncRosePoiForms(pos);
        }
        return send.apply(this, arguments);
      };
    }
  }

  initRoseGarden();
})();
