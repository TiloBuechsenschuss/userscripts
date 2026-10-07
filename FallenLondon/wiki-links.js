// ==UserScript==
// @name         Fallen London Wiki Links
// @author       Tilo
// @namespace    https://github.com/TiloBuechsenschuss
// @downloadURL  https://raw.githubusercontent.com/TiloBuechsenschuss/userscripts/refs/heads/main/FallenLondon/wiki-links.js
// @version      0.9
// @description  Adds a small "W" badge linking storylets and cards to the Fallen London wiki.
// @match        https://www.fallenlondon.com/*
// @match        https://fallenlondon.com/*
// @run-at       document-idle
// @grant        none
// ==/UserScript==

/*
 * Fallen London Wiki Links
 *
 * Adds a small "W" badge linking to the Fallen London wiki (fallenlondon.wiki) next to storylet
 * titles in the game -- in a storylet list, at the top of an opened storylet, and on each
 * opportunity card in your hand (both the compact and the full-width card layouts). Clicking opens
 * the wiki article for that storylet/card in a new tab (straight to the article, never the
 * Anubis-challenged search page -- see "Wiki URL" below). The individual branch/choice titles inside
 * an opened storylet are intentionally left unlinked. Selectors verified against real game HTML.
 */

(function () {
  'use strict';

  // --- BEGIN tm-fl-ui-settings (keep byte-identical across scripts) ---
  // Shared "show / hide this piece of UI" switches, co-owned by every Fallen London script that
  // carries this block (wiki-links.js, ux-enhancers.js, choice-helper.js). Each script has its
  // own copy and registers what it can switch in one catalogue on the page window, so the
  // settings view lists whichever scripts are installed, in any load order.
  // Only HIDDEN features are stored ({ "<scriptId>.<featureId>": true }), so a feature added
  // later is shown by default. Storage trouble reads as "everything shown".
  const FL_UI_KEY = 'tm-fl-hidden-ui';
  const FL_UI_EVENT = 'fl-ui-settings-change';
  const FL_UI_CATALOGUE = '__flUiFeatures';
  const FL_UI_GROUPS = [
    'Wiki links', 'UX tweaks', 'London', 'Airs of London', 'Zailing', 'Parabola', 'Firmament',
    'Railway & beyond', 'Seasonal', 'Menu entries',
  ];

  function flUiLoad() {
    try {
      const o = JSON.parse(localStorage.getItem(FL_UI_KEY) || '{}');
      return o && typeof o === 'object' && !Array.isArray(o) ? o : {};
    } catch (e) {
      return {};
    }
  }

  function flUiHidden(scriptId, featureId) {
    return flUiLoad()[scriptId + '.' + featureId] === true;
  }

  // Read-modify-write on a fresh read, so two scripts toggling never clobber each other.
  // `storage` events never fire in the document that wrote, and Fallen London is one document,
  // so the change is also announced on the window for this page's own scripts.
  function flUiSetHidden(scriptId, featureId, hidden) {
    const o = flUiLoad();
    const k = scriptId + '.' + featureId;
    if (hidden) o[k] = true; else delete o[k];
    try {
      localStorage.setItem(FL_UI_KEY, JSON.stringify(o));
    } catch (e) { /* storage blocked: the switch just does not stick */ }
    try {
      flUiWin().dispatchEvent(new CustomEvent(FL_UI_EVENT));
    } catch (e) { /* no CustomEvent: the next scan still applies the switch */ }
  }

  // Without a window (a test harness) there is nothing to listen to and nothing to switch.
  function flUiWin() {
    return typeof window === 'object' && window ? window : null;
  }

  function flUiOnChange(fn) {
    const w = flUiWin();
    if (!w) return;
    w.addEventListener(FL_UI_EVENT, function () { fn(); });
    w.addEventListener('storage', function (e) {
      if (e.key === FL_UI_KEY || e.key === null) fn();
    });
  }

  // Add this script's switchable things to the shared catalogue. `features` is
  // [{ id, label, group }]; the same scriptId registered twice merges by feature id.
  function flUiRegister(scriptId, title, features) {
    const w = flUiWin();
    if (!w) return;
    if (!Array.isArray(w[FL_UI_CATALOGUE])) w[FL_UI_CATALOGUE] = [];
    const cat = w[FL_UI_CATALOGUE];
    let entry = cat.find(function (e) { return e.scriptId === scriptId; });
    if (!entry) {
      entry = { scriptId: scriptId, title: title, features: [] };
      cat.push(entry);
    }
    features.forEach(function (f) {
      if (!entry.features.some(function (o) { return o.id === f.id; })) entry.features.push(f);
    });
  }

  // The settings view: one collapsible section per group, a group checkbox (dash = some shown)
  // and one "Show <label>" checkbox per feature. Checked means shown. Plain DOM, so any of the
  // three scripts can draw it (the launcher panel, or a box in the page).
  function flUiRenderSettings() {
    const w = flUiWin();
    const cat = w && Array.isArray(w[FL_UI_CATALOGUE]) ? w[FL_UI_CATALOGUE] : [];
    const byGroup = {};
    cat.forEach(function (entry) {
      entry.features.forEach(function (f) {
        const g = f.group || 'Other';
        (byGroup[g] = byGroup[g] || []).push({ scriptId: entry.scriptId, id: f.id, label: f.label });
      });
    });
    const names = Object.keys(byGroup).sort(function (a, b) {
      const ia = FL_UI_GROUPS.indexOf(a), ib = FL_UI_GROUPS.indexOf(b);
      return (ia < 0 ? 99 : ia) - (ib < 0 ? 99 : ib) || (a < b ? -1 : 1);
    });

    const root = document.createElement('div');
    root.id = 'fl-ui-settings';
    root.style.cssText = 'font:13px/1.4 sans-serif;text-align:left;';
    const intro = document.createElement('p');
    intro.style.cssText = 'margin:0 0 8px;';
    intro.textContent = 'Tick what you want to see. Changes apply at once.';
    root.appendChild(intro);

    names.forEach(function (g) {
      const rows = byGroup[g].slice().sort(function (a, b) {
        return a.label < b.label ? -1 : a.label > b.label ? 1 : 0;
      });
      const det = document.createElement('details');
      det.style.cssText = 'margin:0 0 6px;border:1px solid rgba(128,128,128,.6);border-radius:3px;';
      const sum = document.createElement('summary');
      sum.style.cssText = 'cursor:pointer;padding:6px 8px;min-height:20px;';
      const all = document.createElement('input');
      all.type = 'checkbox';
      all.style.cssText = 'margin:0 8px 0 0;vertical-align:middle;';
      all.addEventListener('click', function (e) { e.stopPropagation(); });
      const title = document.createElement('span');
      title.textContent = g + ' (' + rows.length + ')';
      sum.appendChild(all);
      sum.appendChild(title);
      det.appendChild(sum);

      const boxes = [];
      const refresh = function () {
        const on = boxes.filter(function (b) { return b.checked; }).length;
        all.checked = on === boxes.length;
        all.indeterminate = on > 0 && on < boxes.length;
      };
      rows.forEach(function (r) {
        const label = document.createElement('label');
        label.style.cssText = 'display:block;cursor:pointer;padding:6px 8px 6px 28px;min-height:20px;';
        const box = document.createElement('input');
        box.type = 'checkbox';
        box.checked = !flUiHidden(r.scriptId, r.id);
        box.style.cssText = 'margin:0 8px 0 0;vertical-align:middle;';
        box.addEventListener('change', function () {
          flUiSetHidden(r.scriptId, r.id, !box.checked);
          refresh();
        });
        boxes.push(box);
        label.appendChild(box);
        label.appendChild(document.createTextNode('Show ' + r.label));
        det.appendChild(label);
      });
      all.addEventListener('change', function () {
        boxes.forEach(function (b, i) {
          if (b.checked === all.checked) return;
          b.checked = all.checked;
          flUiSetHidden(rows[i].scriptId, rows[i].id, !all.checked);
        });
        refresh();
      });
      refresh();
      root.appendChild(det);
    });
    return root;
  }
  // FL's own Account page (/account): the settings view as a box after the page's tabs. Appending
  // our own node at the end of the React-managed container is the one safe shape here, and the
  // next scan puts it back if a re-render drops it. The first script to get here creates it;
  // the others find it by id and redraw it only when the catalogue has grown.
  function flUiMountAccountBox() {
    if (typeof location !== 'object' || !location || location.pathname !== '/account') return;
    const host = document.querySelector('.account');
    if (!host) return;
    const w = flUiWin();
    const cat = w && Array.isArray(w[FL_UI_CATALOGUE]) ? w[FL_UI_CATALOGUE] : [];
    const count = cat.reduce(function (n, e) { return n + e.features.length; }, 0);
    let box = document.getElementById('fl-ui-settings-box');
    if (box && box.parentNode === host && box.dataset.count === String(count)) return;
    if (!box) {
      box = document.createElement('section');
      box.id = 'fl-ui-settings-box';
      box.style.cssText = 'margin-top:24px;';
    }
    box.textContent = '';
    const head = document.createElement('h2');
    head.className = 'heading heading--2';
    head.textContent = 'Userscript settings';
    box.appendChild(head);
    box.appendChild(flUiRenderSettings());
    box.dataset.count = String(count);
    if (box.parentNode !== host) host.appendChild(box);
  }
  // --- END tm-fl-ui-settings ---

  // Fallen London is a single-page React app: storylets, branches and results
  // are swapped into the DOM client-side without any page navigation. So unlike
  // the server-rendered KoL/TH scripts (one document-idle pass), this one must
  // re-scan whenever the DOM changes -- see the MutationObserver at the bottom.

  const WIKI_BASE = 'https://fallenlondon.wiki/';

  // --- Wiki URL ---------------------------------------------------------
  // The wiki is MediaWiki (+ Semantic MediaWiki) behind Anubis proof-of-work.
  // Anubis lets article views (/wiki/Title) and the API straight through but
  // puts Special:Search behind a difficulty-6 challenge -- a wait of many
  // seconds, repeated whenever the pass cookie lapses. So a link must never
  // land on the search page when it can avoid it:
  //   - wikiHref() points straight at the article, /wiki/Title.
  //   - resolveWikiLinks() then asks the API (no challenge, CORS open) which of
  //     the linked names are not pages, and re-points just those at the search
  //     ("Go" search: an exact title would have redirected, anything else lands
  //     on the results rather than a dead redlink). An unanswered lookup leaves
  //     the article link, whose worst case is the wiki's 404 page.
  // The same block is in choice-helper.js and ux-enhancers.js, and they share
  // the lookups through sessionStorage. Keep the three identical.
  const WIKI_BAD_TITLE = /[#<>\[\]{}|]/;
  function wikiCleanName(name) {
    return String(name == null ? '' : name).trim().replace(/\s+/g, ' ');
  }
  function wikiSearchHref(name) {
    return WIKI_BASE + 'wiki/Special:Search?'
      + new URLSearchParams({ search: wikiCleanName(name), go: 'Go' }).toString();
  }
  function wikiHref(name) {
    const t = wikiCleanName(name);
    if (!t) return null;
    // Characters no page title can hold: the search is the only useful target.
    if (WIKI_BAD_TITLE.test(t)) return wikiSearchHref(t);
    return WIKI_BASE + 'wiki/' + encodeURIComponent(t.replace(/ /g, '_'))
      .replace(/%3A/gi, ':').replace(/%2F/gi, '/');
  }
  // Marks a link for resolveWikiLinks(). Names that cannot be titles are
  // already search links, so there is nothing to look up.
  function wikiTag(a, name) {
    const t = wikiCleanName(name);
    if (t && !WIKI_BAD_TITLE.test(t)) a.dataset.flWikiTitle = t;
  }

  const WIKI_EXISTS_KEY = 'fl-wiki-exists';
  const wikiInFlight = new Set();
  const wikiFailed = new Set();
  function wikiKnownRead() {
    try { return JSON.parse(sessionStorage.getItem(WIKI_EXISTS_KEY)) || {}; } catch (e) { return {}; }
  }
  function wikiKnownWrite(known) {
    try { sessionStorage.setItem(WIKI_EXISTS_KEY, JSON.stringify(known)); } catch (e) { /* uncached */ }
  }
  function wikiLookup(names) {
    names.forEach(function (n) { wikiInFlight.add(n); });
    const url = WIKI_BASE + 'w/api.php?action=query&redirects=1&format=json&formatversion=2&origin=*'
      + '&titles=' + names.map(encodeURIComponent).join('%7C');
    fetch(url)
      .then(function (r) { if (!r.ok) throw new Error('HTTP ' + r.status); return r.json(); })
      .then(function (data) {
        const q = data && data.query;
        if (!q) throw new Error('no query in reply');
        // A name maps to its page through `normalized` (case of the first
        // letter, underscores) and then `redirects`; `pages` are the targets.
        const norm = {}, redir = {}, found = {};
        (q.normalized || []).forEach(function (x) { norm[x.from] = x.to; });
        (q.redirects || []).forEach(function (x) { redir[x.from] = x.to; });
        (q.pages || []).forEach(function (p) { found[p.title] = !p.missing && !p.invalid; });
        const known = wikiKnownRead();
        names.forEach(function (n) {
          const t0 = norm[n] || n;
          known[n] = found[redir[t0] || t0] === true;
        });
        wikiKnownWrite(known);
      })
      .catch(function () { names.forEach(function (n) { wikiFailed.add(n); }); })
      .then(function () {
        names.forEach(function (n) { wikiInFlight.delete(n); });
        resolveWikiLinks();
      });
  }
  function resolveWikiLinks() {
    const anchors = document.querySelectorAll('a[data-fl-wiki-title]:not([data-fl-wiki-checked])');
    if (!anchors.length) return;
    const known = wikiKnownRead();
    const need = new Set();
    anchors.forEach(function (a) {
      const name = a.dataset.flWikiTitle;
      if (name in known) {
        a.dataset.flWikiChecked = '1';
        if (!known[name]) a.href = wikiSearchHref(name);
      } else if (!wikiInFlight.has(name) && !wikiFailed.has(name)) {
        need.add(name);
      }
    });
    const names = Array.from(need);
    for (let i = 0; i < names.length; i += 50) wikiLookup(names.slice(i, i + 50));
  }

  // The "W" badge. Small, opens in a new tab so a misclick mid-story does not
  // navigate the game away. Marked with a class for the idempotency check
  // below. Inline styles only (repo convention).
  function makeBadge(name) {
    const href = wikiHref(name);
    if (!href) return null;
    const a = document.createElement('a');
    a.className = 'fl-wiki-link';
    a.href = href;
    a.target = '_blank';
    a.rel = 'noopener';
    a.textContent = 'W';
    a.title = 'FL wiki: ' + name.trim();
    wikiTag(a, name);
    a.style.cssText =
      'display:inline-block;margin-left:4px;padding:0 3px;' +
      'font-family:arial,sans-serif;font-size:9px;font-weight:bold;' +
      'line-height:13px;color:#fff;background:#8a6d3b;border-radius:2px;' +
      'text-decoration:none;vertical-align:middle;cursor:pointer;';
    return a;
  }

  // Badge `el`, once, deriving the wiki title from `name` (defaults to the
  // element's own text). `place` is 'after' (badge becomes the next sibling --
  // good for inline names) or 'append' (badge becomes the last child -- good
  // for headings, so the W sits on the heading line). The data-fl-wiki flag
  // makes this idempotent: the observer re-runs this on every DOM change, and
  // the name is read before the badge is added either way.
  function addBadge(el, place, name) {
    if (!el || el.dataset.flWiki) return;
    name = (name != null ? name : el.textContent).trim();
    if (!name) return;
    const badge = makeBadge(name);
    if (!badge) return;
    el.dataset.flWiki = '1';
    if (place === 'append') el.appendChild(badge);
    else el.after(badge);
  }

  // --- Storylet titles -------------------------------------------------
  // A storylet's title appears in two shapes, both VERIFIED against real game
  // HTML and both wanted:
  //   - In a storylet list: `.media.storylet` > ... >
  //     `<h2 class="media__heading heading heading--3 storylet__heading">`
  //     (e.g. "A Stroll around the Hill").
  //   - At the top of an opened storylet: `.media--root` > ... >
  //     `<h1 class="media__heading heading heading--2 storylet-root__heading">`
  //     (e.g. "Making your Name: the Infestation").
  // So `.storylet__heading, .storylet-root__heading` tags exactly the storylet
  // names and nothing else.
  //
  // A third shape, also wanted: each opportunity card in your hand, in the
  // COMPACT (narrow / small-media) layout. Its title is a plain
  // `<h2 class="media__heading heading heading--3">` -- no card-specific class --
  // inside `.hand` > `.small-card-container` > `.small-card__body`. That bare
  // `.media__heading` is shared with headings we must NOT badge (the
  // "Opportunity deck" label, "Pick a card from your hand (1/3)"), but those sit
  // OUTSIDE `.hand`, so scoping under `.hand .small-card__body` selects exactly
  // the in-hand cards (e.g. "The Calendrical Confusion of 1899"). The full-width
  // layout of the same hand has NO heading and is handled separately by
  // linkHandCards() below.
  //
  // Deliberately NOT matched:
  //   - The broader `.media__heading` on storylet headings and on the deck
  //     labels -- it is reused for other headings across the SPA and would
  //     over-badge non-article text. (We only reach it via the scoped hand
  //     selector above.)
  //   - `.branch__title` -- the per-choice titles inside an opened storylet
  //     (e.g. "Visit the Department of Menace Eradication"). These are choices,
  //     not their own wiki articles, so they get no badge by request.
  //
  // Titles are taken verbatim (no article stripping) -- FL wiki pages keep the
  // full title. This list is the single place to change which titles get a
  // badge; the badge/observer plumbing around it does not change.
  const TITLE_SELECTORS = [
    '.storylet__heading',                 // storylet in a list
    '.storylet-root__heading',            // title atop an opened storylet
    '.hand .small-card__body .media__heading', // opportunity card in hand
  ];

  function linkStorylets() {
    document.querySelectorAll(TITLE_SELECTORS.join(',')).forEach(function (el) {
      addBadge(el, 'append');
    });
  }

  // --- Opportunity cards (full-width hand layout) ----------------------
  // In the wide browser layout an in-hand card is image-only: there is NO
  // heading element, just
  //   .hand__card-container > .hand__card > .hand__border > div[role=button]
  //     > img.hand__image
  // and the card title lives ONLY in that image's alt / aria-label (e.g.
  // "The Calendrical Confusion of 1899"). So the text-element approach above
  // does not apply; derive the name from the image attribute and overlay a
  // badge in the card's corner instead. Empty deck slots render as
  // `.card--empty` (no `.hand__card-container`, no image), so they fall out
  // naturally. The flag lives on the container, matching addBadge's dataset
  // convention, so repeated observer passes stay idempotent.
  function linkHandCards() {
    document.querySelectorAll('.hand__card-container').forEach(function (card) {
      if (card.dataset.flWiki) return;
      const img = card.querySelector('.hand__image');
      const name = img && (img.getAttribute('alt') || img.getAttribute('aria-label'));
      if (!name || !name.trim()) return;
      const badge = makeBadge(name);
      if (!badge) return;
      card.dataset.flWiki = '1';
      // Overlay top-right of the card. Small and out of the way of the card's
      // own play (click) / Discard controls; opens the wiki in a new tab.
      if (getComputedStyle(card).position === 'static') card.style.position = 'relative';
      badge.style.position = 'absolute';
      badge.style.top = '2px';
      badge.style.right = '2px';
      badge.style.marginLeft = '0';
      badge.style.zIndex = '5';
      card.appendChild(badge);
    });
  }

  // --- Dispatch ---------------------------------------------------------
  // SPA: run once now, then re-run (debounced) on every DOM mutation so newly
  // drawn storylets get badged too (e.g. opening a storylet swaps the list out
  // for the root view). addBadge's per-element flag keeps
  // repeated passes idempotent. Observe document.body since the React root is
  // replaced wholesale during navigation.
  // Switchable from the shared UI settings (see tm-fl-ui-settings). Switching off removes every
  // "W" this script drew and its flags, so switching on draws them again on the next scan.
  const WIKI_UI_ID = 'wiki';
  flUiRegister(WIKI_UI_ID, 'Wiki Links', [
    { id: 'badge', label: 'wiki “W” badges', group: 'Wiki links' },
  ]);

  function removeWikiBadges() {
    document.querySelectorAll('.fl-wiki-link').forEach(function (a) { a.remove(); });
    document.querySelectorAll('[data-fl-wiki]').forEach(function (el) { delete el.dataset.flWiki; });
  }

  let pending = false;
  function scan() {
    pending = false;
    flUiMountAccountBox();
    if (!flUiHidden(WIKI_UI_ID, 'badge')) {
      linkStorylets();
      linkHandCards();
      resolveWikiLinks();
    }
  }
  function schedule() {
    if (pending) return;
    pending = true;
    requestAnimationFrame(scan);
  }

  flUiOnChange(function () {
    if (flUiHidden(WIKI_UI_ID, 'badge')) removeWikiBadges();
    schedule();
  });

  scan();
  new MutationObserver(schedule).observe(document.body, {
    childList: true,
    subtree: true,
  });
})();
