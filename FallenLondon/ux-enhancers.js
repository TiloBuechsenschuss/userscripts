// ==UserScript==
// @name         Fallen London UX Enhancers
// @author       Tilo
// @namespace    https://github.com/TiloBuechsenschuss
// @downloadURL  https://raw.githubusercontent.com/TiloBuechsenschuss/userscripts/refs/heads/main/FallenLondon/ux-enhancers.js
// @version      3.0
// @description  A grab-bag of small quality-of-life tweaks for Fallen London. A "UX" button docked INTO Fallen London's own chrome beside its travel control -- under the big Travel button on the wide layout, as one more icon in the banner on the narrow one -- so it takes up space in the page like any other control and covers nothing. It opens a menu of reference panels; the last line of that menu switches it back to floating over the page if you preferred it that way, and it falls back to floating on its own if Fallen London's chrome cannot be found. Every panel's header carries a fullscreen button beside its close button, which takes the panel off the popover and over the whole screen and back; the choice is remembered, so a long panel opens at full size every time rather than needing the button pressed again. The first panel is Factions, a table of every faction with your current Renown and Favours (read off the Myself tab and remembered, so it is there from anywhere in London), the three Renown items each unlocks at Renown 10/25/40, and the Faction Item that turns Favours into Renown, with where to buy it and what it costs. Renown and Favours come off the Myself tab and which items you hold off Possessions; both are remembered, and opening the panel refreshes them in the background. A Renown item you could go and collect right now -- Renown reached and the Favours in hand -- gets a filled "!" badge and is listed at the top; one whose Renown is high enough but whose Favours are still short gets an outlined "!"; and any faction whose Favours have hit the cap of 7 and are being thrown away is called out too. Each row has a "use" button that opens that faction's item on the Possessions tab so its options appear. Fallen London Choice Helper, a separate script, adds its own panels -- Zailing, Port Carnelian, Scientific Voyages and Fruits of the Zee -- to the same menu when it is installed; the rating badges on cards and storylets that were part of this script until 3.0 live there now. Built as a feature registry so further tweaks can be added as entries.
// @match        https://www.fallenlondon.com/*
// @match        https://fallenlondon.com/*
// @run-at       document-idle
// @noframes
// @grant        none
// ==/UserScript==

(function () {
  'use strict';

  // This script is a container for small Fallen London quality-of-life tweaks,
  // in the same spirit as KingdomOfLoathing/ux-enhancers.js. The difference is
  // what a feature is scoped BY. KoL is server-rendered, so each of its
  // features declares the `.php` path it belongs to and runs once. Fallen
  // London is a single-page React app: there is one URL, and storylets, cards
  // and results are swapped into the DOM client-side with no page navigation.
  // So there is no path to gate on and no single document-idle pass that sees
  // everything -- every feature here is instead scoped by the markup it finds,
  // and is re-run on a debounced MutationObserver.
  //
  // Advice on what a storylet or a card does -- the rating badges and the
  // reference panels built on the same tables -- is not in here. That is
  // FallenLondon/choice-helper.js, split out of this file at 3.0; its panels
  // still open from the launcher below, through the registry described in
  // "the other Fallen London script".
  //
  // Adding a feature:
  //   1. Write a `run()` that finds its own markup and bails harmlessly when
  //      that markup isn't on screen. It will be called on the initial pass and
  //      again on every debounced DOM change, so it must be IDEMPOTENT and
  //      cheap -- use a dataset flag or an id guard rather than blindly
  //      injecting.
  //   2. Add a `{ name, run }` entry to FEATURES at the bottom. A feature that
  //      throws is logged and cannot stop the others.
  //
  // A feature that wants a screen of its own rather than a decoration should
  // instead register a PANEL -- see the launcher section further down.

  const SCRIPT_ID = 'FL UX Enhancers';

  // === shared: small DOM helpers =========================================

  // Minimal hyperscript. The panels below are a few hundred nodes of table, and
  // this keeps them readable without an innerHTML string (which would be one
  // more place to get escaping wrong the first time a piece of data is not
  // hardcoded). `props` sets properties, except `style` which is merged and
  // `title`/`href`/... which are plain properties anyway.
  function h(tag, props, children) {
    const el = document.createElement(tag);
    if (props) {
      for (const key of Object.keys(props)) {
        const value = props[key];
        if (value == null) continue;
        if (key === 'style') Object.assign(el.style, value);
        else if (key === 'css') el.style.cssText = value;
        else if (key === 'on') for (const ev of Object.keys(value)) el.addEventListener(ev, value[ev]);
        else el[key] = value;
      }
    }
    for (const child of [].concat(children || []).flat(Infinity)) {
      if (child == null || child === false) continue;
      el.appendChild(typeof child === 'string' || typeof child === 'number'
        ? document.createTextNode(String(child))
        : child);
    }
    return el;
  }

  // A link to the Fallen London wiki, by the same "Go" search wiki-links.js
  // uses: an exact title redirects straight to the article, anything else lands
  // on the search results for the text rather than a dead redlink.
  function wikiHref(name) {
    const t = String(name == null ? '' : name).trim().replace(/\s+/g, ' ');
    if (!t) return null;
    return 'https://fallenlondon.wiki/wiki/Special:Search?'
      + new URLSearchParams({ search: t, go: 'Go' }).toString();
  }

  function wikiLink(name, text, style) {
    const href = wikiHref(name);
    if (!href) return document.createTextNode(text || String(name || ''));
    return h('a', {
      href: href, target: '_blank', rel: 'noopener',
      textContent: text || name,
      title: 'FL wiki: ' + name,
      style: Object.assign({ color: 'inherit', textDecoration: 'none', borderBottom: '1px dotted currentColor' }, style || {}),
    });
  }

  // === shared: names =====================================================

  // Names are matched loosely: lowercased, with every run of non-alphanumerics
  // squashed to one space. That absorbs the punctuation the game and the wiki
  // can disagree about -- "A Constable!" / "A Constable", "A... pickpocket?" /
  // "A pickpocket" -- and the hyphen in "The Rat-Catcher". None of the squashed
  // keys collide with each other.
  //
  // HTML TAGS COME OFF FIRST, and they have to: Fallen London writes markup
  // into the names it hands us. A festival ship's Possessions label italicises
  // its class -- the attribute holds `&lt;i&gt;Obstinate&lt;/i&gt;-class
  // Cruiser`, which the HTML parser decodes, so `getAttribute` returns real
  // tags. Squashing that straight away does not remove the tags, it DISSOLVES
  // them: `<` `>` and `/` go, and their letters stay behind as words, giving
  // "i obstinate i class cruiser" where the table says "obstinate class
  // cruiser". A ship the player was wearing therefore read as un-owned
  // (reported 2026-09-10, with the capture).
  //
  // Only a real tag is taken -- `</?tag …>` -- and never any pair of angle
  // brackets, so prose that happens to contain `a < b > c` still loses the
  // brackets to the squash and keeps every word around them.
  const TAG_RE = /<\/?[a-z][a-z0-9]*(?:\s[^<>]*)?>/gi;

  function normalizeName(name) {
    return String(name == null ? '' : name)
      .replace(TAG_RE, ' ')
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, ' ')
      .trim();
  }

  // The key an ITEM is filed under: `normalizeName` with a leading article
  // thrown away as well.
  //
  // Every table in this file takes an item's name from its WIKI PAGE TITLE,
  // which keeps the article -- "A Faceted Decanter of Drownie Effluvia", "An
  // Inquisitive Lamp-cat". Fallen London's own Possessions markup drops it:
  // the captured `aria-label` reads "Scrimshander Carving Knife", not "A
  // Scrimshander Carving Knife". So the two vocabularies disagree on a word
  // that carries no meaning, and a straight `normalizeName` comparison filed
  // them as two different items -- which is exactly what happened (reported
  // 2026-09-10: the checklist called a Decanter missing that was sitting in
  // the player's hold).
  //
  // Patching the table entry would have fixed ONE row. It is a whole class:
  // the same table already spells the Knife the game's way and the Jillyfleur
  // Cloak the wiki's, and every faction and Renown item is transcribed from
  // the wiki too. So the gap is closed once, here, at the one boundary where a
  // wiki name is compared against a game name -- and the tables go on citing
  // their source, which is what makes them checkable.
  //
  // Used on BOTH sides: the possessions map is keyed by it and every lookup
  // goes through it, so it does not matter which side has the article. It is
  // deliberately NOT what card and storylet names use -- there a leading "A"
  // is part of a title Fallen London and the wiki agree on ("A Reef of
  // Wrecks"), and throwing it away would only invite a collision.
  function itemKey(name) {
    const key = normalizeName(name);
    // Never down to nothing: an item actually called "The" keeps its name.
    const bare = key.replace(/^(?:a|an|the) +/, '');
    return bare || key;
  }

  // === shared: the other Fallen London script ============================
  //
  // UX Enhancers and Choice Helper were one file until UX Enhancers 3.0. A
  // userscript has no imports, so the two share no code: every helper both
  // need is carried by both, byte for byte (FallenLondon/test/fl-shared-
  // helpers.test.mjs holds them to it). What they share at RUN time goes
  // through the page instead, as one array and one event on `window` --
  // both scripts are `@grant none`, so both see the page's own `window`.
  //
  //  - PANEL_REGISTRY is the launcher menu as far as the other script is
  //    concerned. Choice Helper pushes its panels onto it; UX Enhancers reads
  //    it every time the menu is drawn, so which of the two loaded first does
  //    not matter.
  //  - FRAME_EVENT hands a hidden frame's document across while the frame is
  //    still up. A background refresh boots the whole SPA a second time, and
  //    before the split ONE boot of /myself banked the Factions, festival and
  //    Port Carnelian numbers together. Two scripts each booting their own
  //    would double that, so whoever loads a page shares it, the other banks
  //    its own numbers off it, and its cache is then fresh enough that its
  //    own refresh has nothing to do.
  //
  // Only SCRIPT_ID differs between the two files, and it is declared outside
  // this block.
  const PANEL_REGISTRY = '__flUxPanels';
  const FRAME_EVENT = 'fl-ux-shared-frame';

  function pageWindow() {
    return typeof window !== 'undefined' && window && window.addEventListener ? window : null;
  }

  // The shared panel list, created by whichever script asks first.
  function sharedPanels() {
    const w = pageWindow();
    if (!w) return null;
    if (!Array.isArray(w[PANEL_REGISTRY])) w[PANEL_REGISTRY] = [];
    return w[PANEL_REGISTRY];
  }

  // Called from inside a frame's `extract`, which is the only moment the
  // document is guaranteed to still be there: `loadInFrame` removes the frame
  // as soon as `extract` answers. The listeners run synchronously, so they
  // are done reading before that happens.
  function shareFrame(path, doc) {
    const w = pageWindow();
    if (!w || !w.dispatchEvent || typeof CustomEvent !== 'function') return;
    try {
      w.dispatchEvent(new CustomEvent(FRAME_EVENT, {
        detail: { from: SCRIPT_ID, path: path, doc: doc },
      }));
    } catch (e) { /* the other script just refreshes on its own */ }
  }

  function onSharedFrame(handler) {
    const w = pageWindow();
    if (!w) return;
    w.addEventListener(FRAME_EVENT, function (e) {
      const d = e && e.detail;
      if (!d || d.from === SCRIPT_ID || !d.doc) return;
      try {
        handler(d.path, d.doc);
      } catch (err) {
        console.error(SCRIPT_ID + ': reading a shared frame failed.', err);
      }
    });
  }

  // When a frame's page counts as loaded. Shared, so the page one script
  // shares is always one the other would have accepted from its own frame.
  function myselfLoaded(doc) {
    const got = readQualities(doc);
    // Wait for a list that actually has faction qualities in it -- a
    // half-rendered page can show a handful and would bank a page of false
    // zeroes otherwise.
    if (!got) return null;
    for (const key of got.values.keys()) {
      if (/^(Renown|Favours|Connected):/.test(key)) return got;
    }
    return null;
  }

  function possessionsLoaded(doc) {
    const got = readPossessionCounts(doc);
    return got && got.size > 20 ? got : null;
  }

  // === shared: the launcher ==============================================
  //
  // A floating button, parked beside FL's own travel control, that opens a
  // menu of reference PANELS.
  //
  // It is deliberately `position:fixed` on document.body rather than injected
  // into Fallen London's own chrome: nothing injected there survives a React
  // re-render, and nothing of the game's gets shoved around this way. Only the
  // POINT it is fixed to is read off the game -- see "where the launcher sits"
  // below, which is the one place that decides it.

  const UI = {
    bg: '#1c1a17',
    bgAlt: '#242119',
    line: '#3d372c',
    text: '#e4dcc5',
    dim: '#a2977c',
    accent: '#b8912f',
    font: '"Roboto Slab", Georgia, serif',
  };

  const LAUNCHER_ID = 'fl-ux-launcher';
  // The button has an id of its own because it no longer lives inside the
  // root: docked, it is somewhere in Fallen London's chrome, and both the
  // travel-anchor search and the outside-click handler have to recognise it
  // there.
  // Both ids are also a CROSS-FILE CONTRACT: Choice Helper finds this button
  // by id to dock its dive-depth control immediately behind it, and tells a
  // floating button from a docked one by whether its parent is LAUNCHER_ID.
  // Change them in both scripts or not at all.
  const LAUNCHER_BUTTON_ID = 'fl-ux-launcher-button';

  // A panel is a screen of its own behind the launcher menu. Add one by
  // pushing a { id, icon, label, hint, render } entry: `render(ctx)` returns the
  // element to show, and is called fresh on every open so a panel showing live
  // values never has to invalidate a cache.
  //
  // These are this script's own. The menu also offers whatever the other
  // Fallen London script has put on the shared registry -- Choice Helper's
  // Zailing, Port Carnelian, Scientific Voyages and Fruits of the Zee -- after
  // these, in the order they were registered.
  const PANELS = [
    {
      id: 'factions',
      icon: '⚔',
      label: 'Factions',
      hint: 'Renown, Favours, Renown items and each faction’s Faction Item',
      render: renderFactionsPanel,
    },
  ];

  // Ours first, then the registry's, each id once. An entry without a `render`
  // is dropped rather than drawn as a button that throws when it is pressed.
  function menuPanels() {
    const out = PANELS.slice();
    const shared = sharedPanels();
    if (!shared) return out;
    for (const panel of shared) {
      if (!panel || !panel.id || typeof panel.render !== 'function') continue;
      if (out.some(function (p) { return p.id === panel.id; })) continue;
      out.push(panel);
    }
    return out;
  }

  function btnStyle(extra) {
    return Object.assign({
      display: 'block', width: '100%', textAlign: 'left', boxSizing: 'border-box',
      padding: '7px 12px', margin: '0', border: '0', background: 'transparent',
      color: UI.text, font: '13px ' + UI.font, cursor: 'pointer',
    }, extra || {});
  }

  // --- where the launcher sits -------------------------------------------
  //
  // It used to be pinned to the bottom-right corner of the viewport, full
  // stop. On the narrow (mobile) layout that is exactly where Fallen London
  // puts its own fixed bottom bar, so the "UX" button sat on top of it.
  //
  // It is still `position:fixed` on `document.body` -- nothing is injected
  // into FL's chrome, so a React re-render still cannot knock it out and it
  // still cannot shove anything around -- but the point it is fixed to is now
  // computed from FL's own TRAVEL control. All three of its shapes are
  // VERIFIED against real markup (2026-09-02), and there are three because FL
  // renders a different one per layout:
  //
  //   wide desktop, in the right-hand sidebar's `div.travel`:
  //     <button class="button button--primary travel-button--infobar"
  //             type="button">Travel</button>
  //
  //   narrower desktop, above the storylet list -- note this one has NO class
  //   of its own, only its container names it:
  //     <div class="storylets__welcome-and-travel"> ...
  //       <button class="button button--primary" type="button">Travel</button>
  //
  //   mobile, the compass in the banner:
  //     <li class="banner-item"><button class="button--link banner__button"
  //           title="Map" type="button">
  //       <i class="fa fa-compass fa-3x icon--has-transition"></i>
  //       <span class="u-visually-hidden">Map</span></button></li>
  //
  // The mobile one is the reason `crowdedLeft` exists: it is one `li` in a row
  // of them, so the space beside it belongs to the next icon along, and the
  // launcher has to go over the row rather than into it.
  //
  // If every selector misses, `findTravelAnchor` returns null and the launcher
  // goes back to the corner -- lifted clear of a bottom bar if one can be
  // found, which is the complaint that started this. Null is a supported
  // outcome, not a failure.

  const LAUNCHER_GAP = 8;   // breathing room between the launcher and the anchor
  const LAUNCHER_EDGE = 8;  // and never closer than this to a viewport edge

  const TRAVEL_SELECTORS = [
    // Wide desktop: the sidebar's Travel button, by its own class and then by
    // its container, since only one of the two has to survive a reskin.
    '.travel-button--infobar',
    '.travel button.button--primary',
    // Narrower desktop: the button with no class of its own.
    '.storylets__welcome-and-travel button',
    // Mobile: the compass. Both the `title` and the visually-hidden label say
    // "Map"; the icon is the `.fa-compass` inside it.
    'button[title="Map"]',
    '.banner__button .fa-compass',
    '.fa-compass',
  ];

  let launcherRoot = null;
  let launcherPanelHost = null;
  let launcherMenu = null;
  let launcherButton = null;
  let launcherDock = null;    // the wrapper the button sits in inside FL's chrome
  let launcherDocked = false; // ...or false, when it is floating after all
  let launcherBound = false;
  let travelAnchor = null;

  // Docked by default. The floating button was the original design and it is
  // still the fallback -- but a fixed button is over the page by definition,
  // and beside the wide layout's Travel button that means over the storylet
  // column. Docking puts it IN the page, where it takes up space like any
  // other control and covers nothing.
  const DOCK_KEY = 'fl-ux-launcher-dock';

  function dockPreferred() {
    try {
      return localStorage.getItem(DOCK_KEY) !== 'float';
    } catch (e) {
      return true;
    }
  }

  function setDockPreferred(on) {
    try {
      localStorage.setItem(DOCK_KEY, on ? 'dock' : 'float');
    } catch (e) { /* private mode; it just won't be remembered */ }
  }

  // Fullscreen, and it is REMEMBERED between panels on purpose (added
  // 2026-09-06). The popover is sized to hang off the launcher button, which
  // is the right shape for a lookup table and the wrong one for the festival
  // checklist -- that one runs to several screens and is close to unreadable
  // in a 660px box on a phone. Someone who wanted the whole screen for one
  // panel wants it for the next, and having to press the same button on every
  // open is the annoyance this setting exists to remove. It lives beside the
  // dock preference for the same reason that one does: it is the answer to
  // "this box is in the way", which is a thought you have while looking at
  // the box, not while looking for a settings screen.
  // **Confirmed in-game by the author on 2026-09-06**, the carry-over to the
  // next panel included -- so the fixed-child-of-a-fixed-root trick really does
  // step out of the launcher's flex column without disturbing the dock.
  const FULLSCREEN_KEY = 'fl-ux-panel-fullscreen';

  function fullscreenPreferred() {
    try {
      return localStorage.getItem(FULLSCREEN_KEY) === 'on';
    } catch (e) {
      return false;
    }
  }

  function setFullscreenPreferred(on) {
    try {
      localStorage.setItem(FULLSCREEN_KEY, on ? 'on' : 'off');
    } catch (e) { /* private mode; it just won't be remembered */ }
  }

  // The two shapes the panel takes, one style patch each, so the toggle is a
  // single assignment and nothing has to reconstruct the windowed values by
  // hand. Fullscreen is `position:fixed` rather than a move in the DOM: the
  // launcher root is itself fixed and carries no transform or filter, so a
  // fixed CHILD is measured against the viewport and simply steps out of the
  // root's flex column, which leaves the docked button, the menu and the
  // placement code untouched. The windowed patch restores only what the
  // fullscreen one overwrote -- `maxWidth`, `maxHeight` and `margin` belong to
  // `applyLauncherStack`, which puts them back on the next placement.
  const PANEL_FULLSCREEN_CSS = {
    position: 'fixed', left: '0', top: '0', right: '0', bottom: '0',
    width: 'auto', height: 'auto', maxWidth: 'none', maxHeight: 'none',
    margin: '0', borderRadius: '0', borderWidth: '0', zIndex: '100000',
  };

  const PANEL_WINDOWED_CSS = {
    position: 'static', left: 'auto', top: 'auto', right: 'auto', bottom: 'auto',
    width: 'min(660px,calc(100vw - 32px))', height: 'auto',
    borderRadius: '4px', borderWidth: '1px', zIndex: 'auto',
  };

  // No viewport means nothing to position against -- which is also how this
  // file is evaluated outside a browser, by the tests.
  function viewportSize() {
    if (typeof window === 'undefined') return null;
    if (!window.innerWidth || !window.innerHeight) return null;
    return { width: window.innerWidth, height: window.innerHeight };
  }

  // Drawn at all. FL renders the layout it isn't using as `display:none`, so a
  // zero-sized box is how the wide layout's Travel button reads on a phone.
  function rendered(el) {
    if (!el || !el.isConnected || !el.getBoundingClientRect) return false;
    const r = el.getBoundingClientRect();
    return r.width > 0 && r.height > 0;
  }

  // Stricter, and only used when CHOOSING an anchor: it also has to be on
  // screen. An anchor already chosen is kept even after it scrolls away (the
  // wide layout's Travel button scrolls with the sidebar), because letting go
  // of it there would make the launcher jump to the corner and back on every
  // scroll; the placement clamps instead.
  function inViewport(el) {
    if (!rendered(el)) return false;
    const view = viewportSize();
    if (!view) return true;
    const r = el.getBoundingClientRect();
    return r.right > 0 && r.left < view.width && r.bottom > 0 && r.top < view.height;
  }

  // The clickable thing rather than the icon inside it: `.fa-compass` is an
  // `<i>` in the middle of the button we actually want to sit beside.
  function clickableOf(el) {
    return (el.closest && el.closest('a, button, [role="button"]')) || el;
  }

  function findTravelAnchor() {
    if (rendered(travelAnchor)) return travelAnchor;
    travelAnchor = null;
    const ours = document.getElementById(LAUNCHER_ID);
    // Our own button has to be skipped explicitly now that it can be DOCKED
    // into the very containers these selectors look in: parked in
    // `.storylets__welcome-and-travel`, it is a `button` inside
    // `.storylets__welcome-and-travel` and matches. Taking ourselves for the
    // travel control would be a quiet little infinite regress.
    const mine = document.getElementById(LAUNCHER_BUTTON_ID);
    const isOurs = function (el) {
      return !!((ours && ours.contains(el)) || (mine && (mine === el || mine.contains(el))));
    };
    for (const sel of TRAVEL_SELECTORS) {
      let hits;
      try {
        hits = document.querySelectorAll(sel);
      } catch (e) {
        continue; // a selector this browser will not parse is just skipped
      }
      for (const hit of hits) {
        const el = clickableOf(hit);
        if (isOurs(el) || !inViewport(el)) continue;
        travelAnchor = el;
        return travelAnchor;
      }
    }
    // Backstop for the one shape that has no class of its own: anything
    // clickable whose accessible name is the travel control's. Name first,
    // rect second -- this sweep sees every clickable element on the page, and
    // the rect is the half that costs a layout.
    //
    // "View map" is in there because that is what the wide layout's
    // `.travel-button--infobar` actually says (captured 2026-09-03); the
    // classless one this backstop is really for has never been read, so it
    // takes both wordings rather than betting on the older one.
    for (const el of document.querySelectorAll('a, button, [role="button"]')) {
      const name = (el.getAttribute('aria-label') || el.title || el.textContent || '')
        .replace(/\s+/g, ' ').trim().toLowerCase();
      if (!/^(travel\b|view map\b)/.test(name)) continue;
      if (isOurs(el) || !inViewport(el)) continue;
      travelAnchor = el;
      return travelAnchor;
    }
    return null;
  }

  // The bar the travel control lives in, if it lives in one: the nearest
  // `fixed`/`sticky` ancestor that spans the width, touches the top or the
  // bottom edge, and isn't the whole screen. It matters because clearing the
  // compass is not the same as clearing the bar the compass sits in.
  function enclosingBar(el, view) {
    if (typeof window === 'undefined' || !window.getComputedStyle) return null;
    for (let node = el; node && node !== document.body; node = node.parentElement) {
      const pos = window.getComputedStyle(node).position;
      if (pos !== 'fixed' && pos !== 'sticky') continue;
      const r = node.getBoundingClientRect();
      if (r.width >= view.width * 0.9
        && r.height < view.height / 2
        && (r.bottom >= view.height - 4 || r.top <= 4)) return r;
    }
    return null;
  }

  // With no travel control to walk up from, look for the bar directly: what is
  // under the bottom edge of the screen? That needs no selector at all, which
  // is the point -- it is the safety net for FL having renamed everything.
  function bottomBarAt(view) {
    if (!document.elementsFromPoint) return null;
    const stack = document.elementsFromPoint(Math.round(view.width / 2), view.height - 2) || [];
    for (const el of stack) {
      if (launcherRoot && launcherRoot.contains && launcherRoot.contains(el)) continue;
      const bar = enclosingBar(el, view);
      if (bar) return bar;
    }
    return null;
  }

  // Is the space immediately left of the travel control already spoken for by
  // something in its OWN container? That is the mobile compass exactly: one
  // `li.banner-item` among several, where sitting beside it means sitting on
  // the next icon. Siblings only, deliberately -- on the wide layout what is
  // left of the sidebar's Travel button is the main content column, and
  // floating over that is fine and always has been.
  function crowdedLeft(el, box, size) {
    const cell = (el.closest && el.closest('li, td')) || el;
    const parent = cell.parentElement;
    if (!parent) return false;
    const wanted = box.left - LAUNCHER_GAP - size.width;
    for (const sib of parent.children) {
      if (sib === cell || sib.contains(el)) continue;
      const r = sib.getBoundingClientRect();
      if (!r.width || !r.height) continue;
      if (r.top < box.bottom && r.bottom > box.top && r.left < box.left && r.right > wanted) {
        return true;
      }
    }
    return false;
  }

  // Pure: boxes in, offsets out, so the placement rule can be reasoned about
  // (and tested) without a layout engine. All CSS pixels; the result is the
  // `right`/`bottom` the fixed launcher gets, measured from those edges.
  //
  //   anchor   the travel control's box, or null if it could not be found
  //   bar      the full-width fixed bar it sits in, or null
  //   view     { width, height } of the viewport
  //   size     { width, height } of the launcher button
  //   crowded  whether the space beside it belongs to its own neighbours
  //
  // Out: `{ side, right, bottom, down }` -- the two fixed offsets, the name of
  // the rule that produced them (for reading, and for the tests), and which
  // way the menu and panels stack away from the button.
  function launcherPlacement(anchor, bar, view, size, crowded) {
    const gap = LAUNCHER_GAP;
    const edge = LAUNCHER_EDGE;
    // Clamped, so a travel control at a screen edge -- or one that has
    // scrolled out of view -- can never carry the launcher off with it.
    //
    // `down` is the other half of the answer: the menu and the panels stack
    // AWAY from the button, and which way that is depends on where the button
    // ended up. Pinned near the top of the screen -- a compass in a top
    // banner, or a Travel button high in the sidebar -- a stack that opened
    // upward would be off the top of the screen, which is no menu at all. So
    // it opens towards whichever side has more room.
    function fit(right, bottom, side) {
      const atRight = Math.min(Math.max(edge, right), Math.max(edge, view.width - size.width - edge));
      const atBottom = Math.min(Math.max(edge, bottom), Math.max(edge, view.height - size.height - edge));
      return {
        side: side,
        right: atRight,
        bottom: atBottom,
        // Room below the button (its own `bottom` offset) against room above
        // it (everything left over once the button and that offset are taken).
        down: atBottom > view.height - atBottom - size.height,
      };
    }
    if (!anchor) {
      // The old corner, but clear of a BOTTOM bar if there is one: that
      // overlap is the bug this whole section exists for, and it is worth
      // fixing even when the travel control itself cannot be found. A bar at
      // the top of the screen is not in the corner's way.
      const clears = bar && bar.bottom >= view.height - 4;
      return fit(16, clears ? view.height - bar.top + gap : 16, 'corner');
    }
    // Beside it, bottoms level, is what reads as "next to" -- when the space
    // is actually free and the launcher fits in it.
    if (!bar && !crowded && anchor.left - gap - size.width >= edge) {
      return fit(view.width - anchor.left + gap, view.height - anchor.bottom, 'beside');
    }
    // Otherwise stack it against the control, right edges level, clearing the
    // whole bar rather than just the icon in it. Above by preference; below
    // when the control is too near the top of the screen for above to fit,
    // which is what a travel control in a top banner gets.
    const right = view.width - anchor.right;
    const top = bar ? Math.min(bar.top, anchor.top) : anchor.top;
    const foot = bar ? Math.max(bar.bottom, anchor.bottom) : anchor.bottom;
    if (top - gap - size.height >= edge) return fit(right, view.height - top + gap, 'above');
    return fit(right, view.height - foot - gap - size.height, 'below');
  }

  // --- docking it into the page ------------------------------------------
  //
  // The floating button was over the page by definition, and beside the wide
  // layout's Travel button that means over the storylet column -- `crowdedLeft`
  // counts siblings only, so overlapping the main content was allowed on
  // purpose. Docking is the fix: put the button INTO Fallen London's chrome,
  // where it takes up space like any other control and covers nothing.
  //
  // Where: beside the travel control, because that is the one piece of FL's
  // chrome whose markup is verified in all three layouts, and because a second
  // navigation control belongs next to the first. Two shapes, and the mobile
  // banner is the difference: there the control is one `li.banner-item` in a
  // row of them, so ours has to be another `li` in the same row rather than a
  // stray button inside theirs. Everywhere else it goes in beside the travel
  // button, as the last child of its container.
  //
  // Why this is safe against React, which owns those containers: we only ever
  // APPEND, and only our own node. React tracks its children by reference, not
  // by index, so an extra node at the end of a container it manages does not
  // disturb its inserts or its removes -- and if a re-render drops ours, the
  // next debounced scan puts it back, which is the same re-mount loop the
  // floating version has always relied on.
  // Split out from `findDockHost` so the CHOICE -- which of the two shapes,
  // whose container, and whereabouts in it -- can be tested with a few fake
  // nodes instead of a layout engine. The `UL`/`OL` test is what keeps `li`
  // mode honest: a bare `closest('li')` would also fire for a Travel button
  // that merely happens to sit inside some list somewhere up the tree.
  //
  // `after` is the node to sit immediately behind, or null for "append". It
  // exists because appending is WRONG for the wide layout, which was reported
  // and then confirmed from real markup (2026-09-03): `div.travel` is not a
  // little box around the Travel button, it is the whole right-hand column --
  // the welcome heading, the "View map" button, a Steam ad, and two `.snippet`
  // blocks. Appending to it put the launcher at the bottom of all that, a
  // screenful below the control it is supposed to be beside. So in `span` mode
  // the anchor itself is what we sit behind. The banner keeps appending: there
  // the container really is just the row of icons, and adding one to the end
  // of it is exactly right.
  function dockHostFor(anchor) {
    if (!anchor || !anchor.parentElement) return null;
    const item = anchor.closest && anchor.closest('li');
    if (item && item.parentElement && /^[OU]L$/.test(item.parentElement.tagName)) {
      return {
        container: item.parentElement, tag: 'li', className: item.className || '', after: null,
      };
    }
    return { container: anchor.parentElement, tag: 'span', className: '', after: anchor };
  }

  function findDockHost() {
    return dockHostFor(findTravelAnchor());
  }

  // Three looks for one button, because it ends up in three different sorts of
  // company: floating over the page, standing beside the Travel button, or
  // lined up with the icons in the mobile banner -- where a pill reading
  // "⚙ UX" would be twice the width of everything next to it, so it loses the
  // word and keeps the cog. `launcherLook` is what stops this being rewritten
  // on every scan.
  let launcherLook = null;
  function styleLauncherButton(look) {
    if (launcherLook === look) return;
    launcherLook = look;
    const style = launcherButton.style;
    const banner = look === 'banner';
    const docked = look !== 'float';
    launcherButton.textContent = banner ? '⚙' : '⚙ UX';
    style.alignSelf = docked ? 'auto' : 'flex-end';
    style.margin = docked ? (banner ? '0 0 0 4px' : '4px 0 4px 8px') : '0';
    style.padding = docked ? (banner ? '5px 9px' : '6px 12px') : '10px 18px';
    style.fontSize = docked ? (banner ? '15px' : '13px') : '15px';
    // The shadow is what lifts a floating button off the page. Docked, it is
    // ON the page, and the shadow just reads as grubby.
    style.boxShadow = docked ? 'none' : '0 2px 12px rgba(0,0,0,.55)';
  }

  // Put the button where it belongs, and move it when FL swaps layout. Called
  // on every scan, so it must be idempotent and must not thrash the DOM: every
  // branch here checks where the node already is before moving it.
  function dockLauncher() {
    if (!launcherRoot || !launcherButton) return;
    const host = dockPreferred() ? findDockHost() : null;

    if (!host) {
      // Floating: the button goes back inside the popover root, which is the
      // pre-dock behaviour and the fallback whenever FL's chrome can't be
      // found. `launcherPlacement` then does the whole job, as it always did.
      if (launcherDock) {
        launcherDock.remove();
        launcherDock = null;
      }
      if (launcherButton.parentNode !== launcherRoot) launcherRoot.appendChild(launcherButton);
      styleLauncherButton('float');
      launcherDocked = false;
      return;
    }

    if (!launcherDock || launcherDock.tagName !== host.tag.toUpperCase()) {
      if (launcherDock) launcherDock.remove();
      launcherDock = h(host.tag, {
        // Wearing the container's own item class (`banner-item`) is what makes
        // the button line up with the icons already in the row.
        className: host.className,
        css: 'display:inline-flex;align-items:center;justify-content:center;'
          + 'margin:0;padding:0;list-style:none;',
      });
    } else if (launcherDock.className !== host.className) {
      launcherDock.className = host.className;
    }
    if (launcherButton.parentNode !== launcherDock) launcherDock.appendChild(launcherButton);
    // Where in the container, not just which container: `host.after` means sit
    // immediately behind that node, and drifting away from it (React inserting
    // something between the two on a re-render) has to count as being in the
    // wrong place, or the launcher walks off down the sidebar again.
    // `previousElementSibling`, not `previousSibling`: a stray whitespace text
    // node between the two would otherwise read as "misplaced" forever and
    // re-insert on every single scan.
    const misplaced = host.after
      ? launcherDock.previousElementSibling !== host.after
      : launcherDock.parentNode !== host.container;
    if (misplaced) {
      if (host.after) host.container.insertBefore(launcherDock, host.after.nextSibling);
      else host.container.appendChild(launcherDock);
    }
    styleLauncherButton(host.tag === 'li' ? 'banner' : 'inline');
    launcherDocked = true;
  }

  // Pure, like `launcherPlacement`, and the docked mode's half of the same
  // job. The button is part of the page now, so the only thing left to place
  // is the popover -- the menu and the panel -- which still has to be
  // `position:fixed`, because a 660px reference table cannot live inside a
  // sidebar column.
  //
  //   anchor  the docked button's box
  //   view    { width, height } of the viewport
  //   want    { width } the popover would like to be
  //
  // Out: `{ down, right, top, bottom, maxWidth, maxHeight }`. Exactly one of
  // `top`/`bottom` is a number and the other is null -- that is the pin, the
  // same one-flag trick the floating rule uses. The anchor is clamped into the
  // viewport first, because a DOCKED button scrolls with the page and the
  // popover must not be dragged off the screen with it.
  function popoverPlacement(anchor, view, want) {
    const gap = LAUNCHER_GAP;
    const edge = LAUNCHER_EDGE;
    const top = Math.min(Math.max(anchor.top, 0), view.height);
    const foot = Math.min(Math.max(anchor.bottom, 0), view.height);
    const above = top - gap - edge;
    const below = view.height - foot - gap - edge;
    const down = below >= above;

    // Right-aligned with the button, then pulled back in far enough that the
    // popover's LEFT edge stays on screen too.
    const width = Math.min((want && want.width) || 660, Math.max(240, view.width - 2 * edge));
    const right = Math.min(
      Math.max(edge, view.width - anchor.right),
      Math.max(edge, view.width - width - edge));

    return {
      down: down,
      right: right,
      top: down ? Math.min(Math.max(edge, foot + gap), Math.max(edge, view.height - 120)) : null,
      bottom: down ? null : Math.max(edge, view.height - top + gap),
      maxWidth: width,
      maxHeight: Math.max(160, down ? below : above),
    };
  }

  // The stack's gap has to move to the other side with it, or it sits between
  // the menu and nothing; and the panel only ever has the room on its own side
  // to live in, or a panel taller than that scrolls the page instead of
  // scrolling inside itself.
  function applyLauncherStack(down, maxWidth, maxHeight) {
    const stackGap = down ? LAUNCHER_GAP + 'px 0 0 0' : '0 0 ' + LAUNCHER_GAP + 'px 0';
    if (launcherMenu) launcherMenu.style.margin = stackGap;
    // A fullscreen panel is not in the stack any more -- it is a fixed box on
    // the viewport -- so sizing it to the room beside the button would put the
    // 660px cap straight back on.
    if (launcherPanelHost && !fullscreenPreferred()) {
      launcherPanelHost.style.margin = stackGap;
      launcherPanelHost.style.maxWidth = Math.max(240, maxWidth) + 'px';
      launcherPanelHost.style.maxHeight = Math.max(160, maxHeight) + 'px';
    }
  }

  // Put the panel into whichever shape is preferred. Called on every open, so
  // a preference set on one panel is already in force when the next one is
  // drawn, and on the toggle itself.
  function applyPanelFullscreen() {
    const host = launcherPanelHost;
    if (!host || !host.style) return;
    Object.assign(host.style, fullscreenPreferred()
      ? PANEL_FULLSCREEN_CSS : PANEL_WINDOWED_CSS);
    // Leaving fullscreen drops the panel back into the stack with no size on
    // it at all, which is `applyLauncherStack`'s job to restore.
    if (!fullscreenPreferred()) positionLauncher();
  }

  function positionLauncher() {
    const root = launcherRoot;
    if (!root || !root.isConnected || !root.style) return;
    const view = viewportSize();
    if (!view) return;

    // Docked: the button is in the page and needs no placing at all. Only the
    // popover does, and it hangs off wherever the button ended up.
    if (launcherDocked) {
      // Mid-re-render, FL may have taken the button away for a moment. Leave
      // the popover exactly where it is rather than falling through to the
      // floating rule, which would fling it across the screen and back once
      // the next scan re-docks.
      if (!rendered(launcherButton)) return;
      const at = popoverPlacement(launcherButton.getBoundingClientRect(), view, { width: 660 });
      root.style.right = at.right + 'px';
      root.style.flexDirection = at.down ? 'column-reverse' : 'column';
      root.style.top = at.down ? at.top + 'px' : 'auto';
      root.style.bottom = at.down ? 'auto' : at.bottom + 'px';
      applyLauncherStack(at.down, at.maxWidth, at.maxHeight - 2 * LAUNCHER_GAP);
      return;
    }

    const anchor = findTravelAnchor();
    const box = anchor ? anchor.getBoundingClientRect() : null;
    const size = {
      width: (launcherButton && launcherButton.offsetWidth) || 90,
      height: (launcherButton && launcherButton.offsetHeight) || 40,
    };
    const at = launcherPlacement(
      box,
      anchor ? enclosingBar(anchor, view) : bottomBarAt(view),
      view,
      size,
      anchor ? crowdedLeft(anchor, box, size) : false);
    root.style.right = at.right + 'px';
    // Opening downward means the root grows from the BUTTON's top edge, so it
    // is pinned by `top` instead, and `column-reverse` puts the button back
    // at the head of the stack. (The children are in DOM order panel, menu,
    // button precisely so one flag flips the whole thing.)
    const top = view.height - at.bottom - size.height;
    root.style.flexDirection = at.down ? 'column-reverse' : 'column';
    root.style.top = at.down ? top + 'px' : 'auto';
    root.style.bottom = at.down ? 'auto' : at.bottom + 'px';
    // The panel hangs off the same corner, so it only has the room left on
    // that side to live in -- otherwise moving the launcher inwards pushes it
    // off the other edge.
    applyLauncherStack(
      at.down,
      view.width - at.right - 16,
      (at.down ? at.bottom : top) - 3 * LAUNCHER_GAP);
  }

  let positionQueued = false;
  function schedulePosition() {
    if (positionQueued) return;
    positionQueued = true;
    requestAnimationFrame(function () {
      positionQueued = false;
      positionLauncher();
    });
  }

  let remountQueued = false;
  function scheduleRemount() {
    if (remountQueued) return;
    remountQueued = true;
    requestAnimationFrame(function () {
      remountQueued = false;
      mountLauncher();
    });
  }

  // Three steps, and they are separate because they answer to different
  // things: the pieces are built once, the button is re-docked whenever FL
  // re-renders or swaps layout (which is every scan), and the popover is
  // re-placed whenever anything moves at all.
  function mountLauncher() {
    buildLauncher();
    dockLauncher();
    positionLauncher();
  }

  function buildLauncher() {
    // Already up. Note the guard is the popover root, which lives on the body
    // and is ours alone; the BUTTON is a separate question, because FL can
    // take that one away from us at any re-render -- `dockLauncher` is what
    // notices and puts it back.
    if (document.getElementById(LAUNCHER_ID)) return;

    // Building means every reference below is about to be replaced, and the
    // dock wrapper has to go with them: it belongs to the button we are
    // discarding, and reusing it would re-attach that dead button alongside
    // the new one. (Only reachable if something removes our root from the
    // body, which FL itself does not do -- but "we rebuilt half of it" is a
    // bad state to leave reachable at all.)
    if (launcherDock) launcherDock.remove();
    launcherDock = null;
    launcherDocked = false;

    const panelHost = h('div', {
      css: 'display:none;margin-bottom:8px;width:min(660px,calc(100vw - 32px));'
        + 'max-height:70vh;overflow:auto;background:' + UI.bg + ';color:' + UI.text
        + ';border:1px solid ' + UI.line + ';border-radius:4px;'
        + 'box-shadow:0 6px 24px rgba(0,0,0,.55);font:13px ' + UI.font + ';',
    });

    // Last line of the menu, under a rule: which of the two placements you
    // want. It is here rather than in a settings screen because it is the
    // answer to "this thing is in my way", and that is a thought you have
    // while looking at the button, not while looking for preferences.
    const dockToggle = h('button', {
      type: 'button',
      style: btnStyle({ color: UI.dim, font: '12px ' + UI.font }),
      on: {
        click: function () {
          setDockPreferred(!dockPreferred());
          syncDockToggle();
          dockLauncher();
          positionLauncher();
        },
        mouseenter: function (e) { e.currentTarget.style.background = UI.bgAlt; },
        mouseleave: function (e) { e.currentTarget.style.background = 'transparent'; },
      },
    });

    function syncDockToggle() {
      const docked = dockPreferred();
      dockToggle.textContent = docked ? '⤓  Docked in the page' : '⤢  Floating over the page';
      dockToggle.title = docked
        ? 'The button sits in Fallen London’s own chrome, beside Travel, and takes up '
          + 'space there. Click to float it over the page instead.'
        : 'The button floats over the page beside the travel control. Click to dock it '
          + 'into Fallen London’s chrome instead, where it covers nothing.';
    }
    syncDockToggle();

    // The panel buttons, redrawn whenever the list has changed by the time the
    // menu opens. Choice Helper's panels arrive through the shared registry,
    // and nothing promises that script ran before this one built the menu.
    const menuItems = h('div');
    let menuSig = null;
    function syncMenu() {
      const panels = menuPanels();
      const sig = panels.map(function (p) { return p.id; }).join('|');
      if (sig === menuSig) return;
      menuSig = sig;
      menuItems.textContent = '';
      for (const panel of panels) {
        menuItems.appendChild(h('button', {
          type: 'button',
          title: panel.hint || '',
          style: btnStyle(),
          on: {
            click: function () { closeMenu(); openPanel(panel); },
            mouseenter: function (e) { e.currentTarget.style.background = UI.bgAlt; },
            mouseleave: function (e) { e.currentTarget.style.background = 'transparent'; },
          },
        }, [panel.icon + '  ' + panel.label]));
      }
    }
    syncMenu();

    const menu = h('div', {
      css: 'display:none;margin-bottom:8px;min-width:230px;background:' + UI.bg
        + ';border:1px solid ' + UI.line + ';border-radius:4px;overflow:hidden;'
        + 'box-shadow:0 6px 24px rgba(0,0,0,.55);',
    }, [
      menuItems,
      h('div', { css: 'border-top:1px solid ' + UI.line + ';' }, [dockToggle]),
    ]);

    const button = h('button', {
      id: LAUNCHER_BUTTON_ID,
      type: 'button',
      title: 'Fallen London UX Enhancers',
      css: 'padding:10px 18px;border:1px solid ' + UI.line
        + ';border-radius:20px;background:' + UI.bg + ';color:' + UI.accent
        + ';font:bold 15px ' + UI.font + ';letter-spacing:.04em;cursor:pointer;'
        + 'white-space:nowrap;line-height:normal;'
        // See the root below: this is not optional, and leaving it off is what
        // made the floating button unclickable (reported 2026-09-03).
        + 'pointer-events:auto;',
      on: { click: toggleMenu },
    }, ['⚙ UX']);

    // The button is NOT a child of this root any more unless it is floating --
    // `dockLauncher` decides, and moves it. What is always here is the
    // popover: the panel and the menu, in that DOM order, so one
    // `flex-direction` flip re-stacks the pair when it has to open downward.
    const root = h('div', {
      id: LAUNCHER_ID,
      css: 'position:fixed;right:16px;bottom:16px;z-index:99999;'
        + 'display:flex;flex-direction:column;align-items:flex-end;'
        + 'pointer-events:none;',
    }, [panelHost, menu]);

    // The root is a fixed box sized to whatever the popover needs, so it would
    // otherwise swallow clicks on the game behind it. `none` on the root and
    // `auto` on each real child is the fix -- and EVERY child has to opt back
    // in, which is the trap: the floating button is a child of this root too
    // (docked, it isn't, which is why this went unnoticed), and without its
    // own `auto` it inherited `none` and stopped responding to clicks. Since
    // the docked/floating choice is remembered in localStorage, that left no
    // way to open the menu and switch back -- not even by reloading. If you
    // ever add a fourth thing in here, opt it in as well.
    panelHost.style.pointerEvents = 'auto';
    menu.style.pointerEvents = 'auto';
    button.style.pointerEvents = 'auto';

    // Both openers re-place the popover on the way out: it hangs off the
    // button, and the button has been free to move (it is in the page now, and
    // the page scrolls) since the last time anything was placed.
    function toggleMenu() {
      if (menu.style.display === 'none') syncMenu();
      menu.style.display = menu.style.display === 'none' ? 'block' : 'none';
      positionLauncher();
    }
    function closeMenu() { menu.style.display = 'none'; }
    function closePanel() {
      panelHost.style.display = 'none';
      panelHost.textContent = '';
    }
    // The header stays put and only the body is rebuilt, so a panel that
    // refreshes itself doesn't make the whole thing flicker or lose its
    // scroll position. `ctx.rerender()` is how a panel asks for that.
    // The header's icon buttons, styled alike so the pair reads as one control
    // group. `position:sticky` on the header is what keeps them reachable in a
    // panel several screens long -- which is the whole argument for the
    // fullscreen one being here rather than in the menu.
    const HEADER_BTN = 'border:0;background:transparent;color:' + UI.dim
      + ';font:16px sans-serif;line-height:1;cursor:pointer;padding:0 2px;';

    // Toggles the panel between the popover it hangs off the button as and
    // the whole viewport. The glyph is the state you would be MOVING to, and
    // it is re-synced rather than rebuilt so the panel's scroll position
    // survives the press.
    const fullscreenButton = h('button', { type: 'button', css: HEADER_BTN });
    function syncFullscreenButton() {
      const on = fullscreenPreferred();
      fullscreenButton.textContent = on ? '⤡' : '⤢';
      fullscreenButton.title = on ? 'Leave fullscreen' : 'Fullscreen';
    }
    fullscreenButton.addEventListener('click', function () {
      setFullscreenPreferred(!fullscreenPreferred());
      syncFullscreenButton();
      applyPanelFullscreen();
    });

    function openPanel(panel) {
      panelHost.textContent = '';
      syncFullscreenButton();
      panelHost.appendChild(h('div', {
        css: 'position:sticky;top:0;display:flex;align-items:center;gap:8px;'
          + 'padding:8px 12px;background:' + UI.bg + ';border-bottom:1px solid ' + UI.line + ';',
      }, [
        h('span', { css: 'font:bold 14px ' + UI.font + ';color:' + UI.accent + ';flex:1;' },
          [panel.icon + '  ' + panel.label]),
        fullscreenButton,
        h('button', {
          type: 'button', title: 'Close',
          css: HEADER_BTN,
          on: { click: closePanel },
        }, ['✕']),
      ]));
      const bodyHost = h('div');
      panelHost.appendChild(bodyHost);
      const ctx = {
        close: closePanel,
        rerender: function () {
          // Do nothing if the panel was closed while a refresh was in flight.
          if (!bodyHost.parentNode) return;
          const top = panelHost.scrollTop;
          bodyHost.textContent = '';
          bodyHost.appendChild(panel.render(ctx));
          panelHost.scrollTop = top;
        },
      };
      ctx.rerender();
      panelHost.style.display = 'block';
      panelHost.scrollTop = 0;
      positionLauncher();
      // After the placement, not before: `applyPanelFullscreen` is what has
      // the last word on the panel's box, and this is where the remembered
      // preference reaches a panel that was opened fresh.
      applyPanelFullscreen();
    }

    // Escape closes the menu first, then the panel. Clicking anywhere outside
    // the launcher closes the menu but LEAVES the panel open -- these panels
    // are reference tables you read while playing, so a stray click on the game
    // should not throw one away.
    document.addEventListener('keydown', function (e) {
      if (e.key !== 'Escape') return;
      if (menu.style.display !== 'none') closeMenu();
      else closePanel();
    });
    // The button is no longer inside `root`, so it has to be excused here by
    // name: without this, its own click would open the menu and this handler
    // would immediately shut it again.
    // CAPTURE, so a click that something else swallows still closes the menu.
    // The badges stop propagation on their own taps (they sit on top of cards
    // that would otherwise be played), and on the bubble this handler never
    // saw those at all -- the menu stayed open behind a tapped badge. Capture
    // runs before any of that, and the two exemptions below are target checks,
    // which read the same in either phase.
    document.addEventListener('click', function (e) {
      if (root.contains(e.target)) return;
      if (button === e.target || button.contains(e.target)) return;
      closeMenu();
    }, true);

    document.body.appendChild(root);
    launcherRoot = root;
    launcherPanelHost = panelHost;
    launcherMenu = menu;
    launcherButton = button;
    launcherLook = null; // a fresh button has none of the old one's styling
    styleLauncherButton('float');
    // A resize or a scroll moves things without changing the DOM, so the
    // debounced scan alone would not notice either. Resize goes through the
    // full mount, because FL can swap layout on a media query alone -- no
    // mutation, but the container the button is docked in has just become
    // `display:none` and it needs re-docking into the one that replaced it.
    if (!launcherBound && typeof window !== 'undefined' && window.addEventListener) {
      launcherBound = true;
      window.addEventListener('resize', scheduleRemount);
      window.addEventListener('scroll', schedulePosition, true);
    }
  }

  // === panel: factions ===================================================
  //
  // Transcribed from Factions (Guide) on fallenlondon.wiki -- the "Faction
  // Items" table (what turns Favours into Renown, where to buy it, what it
  // costs) and the "Renown Items" table (the three pieces of equipment each
  // faction's Renown unlocks, at Renown 10 / 25 / 40).
  //
  // `stat` is the wiki's "Renown Stat" column for the Faction Item.
  // `bis` marks the wiki's best-in-slot annotations: 'strict' (bold there) or
  // 'shared' (italic). `upperRiver` marks the three items the guide underlines
  // as a warning -- they permanently add a card to your Upper River deck;
  // `replacesCard` marks the two that add one but lock another, so the deck
  // ends up the same size.
  //
  // To add or correct a faction: edit this array. Nothing else knows the names.
  const RENOWN_TIERS = [
    { at: 10, favours: 3 },
    { at: 25, favours: 5 },
    { at: 40, favours: 7 },
  ];

  const FACTIONS = [
    {
      key: 'bohemians', name: 'Bohemians', stat: 'Persuasive',
      item: { name: 'Ornate Typewriter', shop: 'Nikolas Pawnbrokers', cost: 60 },
      items: [
        { name: 'Barrel with Leather Shoulder-Straps', slot: 'Clothing', stats: 'Dangerous +4, Scandal +1', from: 'faction card' },
        { name: 'The DF', slot: 'Weapon', stats: 'Persuasive +7, Dreaded +1', from: 'Mahogany Hall', upperRiver: true },
        { name: 'Oneiric Key', slot: 'Home Comfort', stats: 'Shadowy +8', from: 'The Mirror-Marches', bis: 'strict' },
      ],
    },
    {
      key: 'church', name: 'The Church', stat: 'Watchful',
      item: { name: 'Tiny Jewelled Reliquary', shop: 'Nikolas Pawnbrokers', cost: 40 },
      items: [
        { name: 'Angelic Publications', slot: 'Weapon', stats: 'Persuasive +4', from: 'faction card' },
        { name: 'The Very Teeth of St George!', slot: 'Home Comfort', stats: 'Dangerous +4', from: 'The Flit' },
        { name: 'Beatific Stone', slot: 'Home Comfort', stats: 'Persuasive +8', from: 'Corpsecage Island', bis: 'strict' },
      ],
    },
    {
      key: 'constables', name: 'Constables', stat: 'Dangerous',
      item: { name: "Antique Constable's Badge", shop: 'Nikolas Pawnbrokers', cost: 30 },
      items: [
        { name: 'Bully Belvedere', slot: 'Adornment', stats: 'Dangerous +4', from: 'faction card' },
        { name: 'The Chap on the Corner', slot: 'Companion', stats: 'Watchful +7, Bizarre +1', from: 'Flit' },
        { name: 'The Place Where they Bury the Bodies', slot: 'Boots', stats: 'Shadowy +10, Dreaded +1', from: 'a slow boat passing a dark beach on a silent river', bis: 'strict' },
      ],
    },
    {
      key: 'criminals', name: 'Criminals', stat: 'Shadowy',
      item: { name: 'Old Bone Skeleton Key', shop: 'Nikolas Pawnbrokers', cost: 62.5 },
      items: [
        { name: 'Ace of Hats', slot: 'Weapon', stats: 'Shadowy +4', from: 'faction card' },
        { name: 'Pair of Defenestrating Boots', slot: 'Boots', stats: 'Dangerous +7, Respectable +1', from: 'Flit', bis: 'shared', replacesCard: true },
        { name: 'One Who Pulls the Strings', slot: 'Companion', stats: 'Shadowy +10, Dreaded +1', from: 'New Newgate Prison' },
      ],
    },
    {
      key: 'docks', name: 'The Docks', stat: 'Dangerous',
      item: { name: 'Engraved Pewter Tankard', shop: 'Nikolas Pawnbrokers', cost: 50 },
      items: [
        { name: 'Ex-Privateer Charter Clerk', slot: 'Companion', stats: 'Watchful +4', from: 'faction card' },
        { name: 'Chelatic Mitten', slot: 'Gloves', stats: 'Watchful +7, Bizarre +1', from: 'Wolfstack Docks', upperRiver: true },
        { name: 'Unexploded Mine', slot: 'Weapon', stats: 'Persuasive +10, Dreaded +1', from: 'The Pillared Sea', bis: 'shared' },
      ],
    },
    {
      key: 'great-game', name: 'The Great Game', stat: 'Persuasive',
      item: { name: 'Copper Cipher Ring', shop: 'Nikolas Pawnbrokers', cost: 40 },
      items: [
        { name: 'A Subscription to the Gazette and a Whetted Pair of Scissors', slot: 'Hat', stats: 'Shadowy +4', from: 'faction card' },
        { name: 'The Seal of St Joshua', slot: 'Weapon', stats: 'Watchful +7, Dreaded +1', from: "Wilmot's End" },
        { name: 'The Great Game', slot: 'Affiliation', stats: 'Watchful +5, Shadowy +2', from: 'The Mirror-Marches', bis: 'shared' },
      ],
    },
    {
      key: 'hell', name: 'Hell', stat: 'Persuasive',
      item: { name: 'Bright Brass Skull', shop: 'Merrigans Exchange', cost: 62.5 },
      items: [
        { name: 'Diabolical Fascinator', slot: 'Hat', stats: 'Dangerous +4', from: 'faction card' },
        { name: 'Hellish Hymn', slot: 'Hat', stats: 'Watchful +7, Dreaded +1, Neathproofed +1', from: 'The Shuttered Palace' },
        { name: 'Infernal Vinification Apparatus', slot: 'Weapon', stats: 'Watchful +10, Dreaded +1', from: 'The Iron Republic', bis: 'strict' },
      ],
    },
    {
      key: 'revolutionaries', name: 'Revolutionaries', stat: 'Shadowy',
      item: { name: 'Red-Feathered Pin', shop: 'Nikolas Pawnbrokers', cost: 40 },
      items: [
        { name: 'Implausible Beartrap', slot: 'Weapon', stats: 'Dangerous +4', from: 'faction card' },
        { name: 'Language of Laces', slot: 'Boots', stats: 'Watchful +7, Dreaded +1', from: 'Spite', bis: 'shared', replacesCard: true },
        { name: 'Gleaming Buttons', slot: 'Home Comfort', stats: 'Dangerous +8', from: 'A state of some confusion', bis: 'strict' },
      ],
    },
    {
      key: 'rubbery-men', name: 'Rubbery Men', stat: 'Persuasive',
      item: { name: 'Nodule of Pulsating Amber', shop: 'Merrigans Exchange', cost: 100 },
      items: [
        { name: 'Amber Cello', slot: 'Weapon', stats: 'Persuasive +4', from: 'faction card' },
        { name: 'Rubbery Bellringer', slot: 'Companion', stats: 'Persuasive +7, Dreaded +1', from: 'The University' },
        { name: 'Location of an Underground Organ', slot: 'Weapon', stats: 'Persuasive +10, Bizarre +1', from: 'Flute Street (Fate) or Helicon House', bis: 'shared' },
      ],
    },
    {
      key: 'society', name: 'Society', stat: 'Dangerous',
      item: { name: "Entry in Slowcake's Exceptionals", shop: 'Nikolas Pawnbrokers', cost: 30 },
      items: [
        { name: 'Antique Ring Worth Killing For', slot: 'Adornment', stats: 'Persuasive +4', from: 'faction card' },
        { name: 'Unassuming Judge', slot: 'Companion', stats: 'Shadowy +7, Respectable +1', from: 'The Shuttered Palace' },
        { name: "Most Humbling Expression of Her Majesty's Esteem", slot: 'Transport', stats: 'Persuasive +8', from: 'Port Carnelian or Your Activities', bis: 'strict' },
      ],
    },
    {
      key: 'tomb-colonies', name: 'Tomb-Colonies', stat: 'Dangerous',
      item: { name: 'Diary of the Dead', shop: 'Crawcase Cryptics', cost: 62.5 },
      items: [
        { name: 'Cup of Dustwine', slot: 'Weapon', stats: 'Dangerous +4', from: 'faction card' },
        { name: 'Your Very Own Bandages!', slot: 'Hat', stats: 'Persuasive +7, Dreaded +1', from: 'Mahogany Hall', upperRiver: true },
        { name: 'Newly-Born Frost-Moth', slot: 'Companion', stats: 'Persuasive +10, Bizarre +1', from: 'Tomb-Colonies', bis: 'shared' },
      ],
    },
    {
      key: 'urchins', name: 'Urchins', stat: 'Shadowy',
      item: { name: 'Rookery Password', shop: 'Crawcase Cryptics', cost: 62.5 },
      items: [
        { name: 'A Feathered Bonnet', slot: 'Hat', stats: 'Persuasive +4', from: 'faction card' },
        { name: 'Constant Cufflinks', slot: 'Adornment', stats: 'Shadowy +7, Bizarre +1', from: 'Wolfstack Docks' },
        { name: 'What Might Be A Thunderbolt', slot: 'Weapon', stats: 'Shadowy +10, Bizarre +1', from: 'Mind of a Long-Dead God', bis: 'strict' },
      ],
    },
    // These two have a Faction Item but run on the older Connected quality
    // instead of Renown/Favours, so they have no Renown item ladder. They are
    // in the table because the item is the thing you came looking for.
    {
      key: 'university', name: 'University (Benthic & Summerset)', connected: true,
      connectedNames: ['Benthic', 'Summerset'],
      item: { name: 'Endowment of a University Fellowship', shop: 'Nikolas Pawnbrokers', cost: 100 },
      items: [],
    },
    {
      key: 'widow', name: 'The Widow', connected: true,
      connectedNames: ['The Widow'],
      item: {
        name: "O'Boyle's Practical Primer in the Various Languages of Nippon, "
          + 'Tartary, Cathay and the Princedoms of the Raj',
        short: "O'Boyle's Practical Primer",
        shop: 'Crawcase Cryptics', cost: 30,
      },
      items: [],
    },
  ];

  // --- live values -------------------------------------------------------
  //
  // Read off the Myself tab (/myself). Selectors verified against real game
  // HTML in BOTH the wide and the narrow layout -- for qualities the two are
  // identical, so one set covers both -- and CONFIRMED LIVE in-game
  // (2026-09-02): the Renown and Favours the panel showed were the right ones.
  //
  //   <li class="quality-item">
  //     <div class="icon icon--circular quality-item__icon" data-branch-id="133830">
  //       <img alt="Renown: Bohemians" ...>
  //     <div class="quality-item__body">
  //       <span class="... quality-item__name"><span>Renown: Bohemians 27/55 - Known to ...
  //
  // The img's `alt` is the quality's name WITHOUT the level, and that is what
  // makes it the key. The visible text glues the level and a descriptive
  // suffix onto the same string, with no separator you could rely on:
  // "Renown: Society 34/55 -  Known in the homes of..." (note the double
  // space) and "Renown: Rubbery Men 12/55 - !kathakathoti!". Anything parsing
  // the name out of that text would be guessing where the name ends; strip the
  // alt off the front instead and the level is all that is left.
  //
  // The faction names FL uses here match FACTIONS[].name exactly, for all
  // twelve -- "The Church", "The Docks", "The Great Game", "Tomb-Colonies",
  // "Rubbery Men" and the rest -- so the quality is just "Renown: " + name.

  // Fallback for an item with no usable alt. Anchored on the three prefixes we
  // care about so a quality whose NAME contains a number can't be mis-split.
  const FACTION_QUALITY_RE =
    /^((?:Renown|Favours|Connected):\s*.+?)\s+(\d+)(?:\s*\/\s*(\d+))?(?:\s*[-–].*)?$/;

  function parseQualityItem(li) {
    const nameEl = li.querySelector('.quality-item__name');
    const text = nameEl ? nameEl.textContent.replace(/\s+/g, ' ').trim() : '';
    if (!text) return null;

    const img = li.querySelector('img[alt]');
    const alt = img ? (img.getAttribute('alt') || '').trim() : '';
    if (alt && text.slice(0, alt.length).toLowerCase() === alt.toLowerCase()) {
      const m = /^\s*(\d+)(?:\s*\/\s*(\d+))?/.exec(text.slice(alt.length));
      // An ACCOMPLISHMENT has no number anywhere -- FL renders it as the name
      // and nothing else ("Discovered: the Pentamerous Bride", captured from
      // /myself on 2026-09-06). Returning null for those dropped every one of
      // them on the floor, which is why the festival panel kept sending
      // someone who had already met the Bride back down to the bottom of the
      // trench. You either have an Accomplishment or you do not, so the level
      // it is missing is 1.
      if (!m) return { quality: alt, level: 1, cap: null };
      return { quality: alt, level: Number(m[1]), cap: m[2] ? Number(m[2]) : null };
    }

    const m = FACTION_QUALITY_RE.exec(text);
    if (!m) return null;
    return { quality: m[1].trim(), level: Number(m[2]), cap: m[3] ? Number(m[3]) : null };
  }

  // Every quality currently on screen, by name. `filtered` matters: the Myself
  // tab has a search box, and while it has text in it the list shows only the
  // matches -- so a quality being ABSENT stops meaning "you have none of it".
  // Returns null when there is no quality list at all (any other tab).
  function readQualities(doc) {
    const d = doc || document;
    const items = d.querySelectorAll('li.quality-item');
    if (!items.length) return null;
    const search = d.querySelector('input.input--item-search');
    const values = new Map();
    items.forEach(function (li) {
      const q = parseQualityItem(li);
      if (q) values.set(q.quality, q);
    });
    return { values: values, filtered: !!(search && search.value && search.value.trim()) };
  }

  // --- what you own ------------------------------------------------------
  //
  // The Possessions tab (/possessions). Verified against real game HTML, again
  // byte-identical between the two layouts, and CONFIRMED LIVE in-game
  // (2026-09-02): held / not-held came out right for a real character. Every
  // item is a
  // `[data-quality-id]` wrapping something with an `aria-label` whose first
  // semicolon-separated field is the name:
  //
  //   <li class="item"><div ... data-quality-id="755">
  //     <div aria-label="Ornate Typewriter × 2; A Fine, Elegant and Robust …">
  //   <li class="available-item-list__item"><div ... data-quality-id="126352">
  //     <div aria-label="Amber Cello; Persuasive +4; Steel ribs and amber …">
  //   <div data-quality-id="340" class="equipped-item">
  //     <div aria-label="Patent Scrutinizer Deluxe!; Watchful +7; …">
  //
  // Reading every `[data-quality-id]` rather than a per-section selector is
  // what makes the three shapes -- inventory, the available-to-equip drawer,
  // and the slot you are actually WEARING -- all count as owned. Miss the
  // third and anyone wearing their Renown item is told they don't have it.
  //
  // `data-quality-id` is a stable numeric id and would be a better key than a
  // name, but only the ids of items this character owns are visible, so there
  // is no way to build the full table from here. Names it is; they matched the
  // wiki's exactly for all nineteen faction and Renown items in the capture.
  const OWNED_MARKER = '[data-quality-id]';

  const ITEM_COUNT_RE = /\s*[×x]\s*(\d+)\s*$/;

  function itemNameFromLabel(label) {
    return String(label || '').split(';')[0].replace(ITEM_COUNT_RE, '').trim();
  }

  // How many of it you hold. The label only carries "× N" when N > 1, and an
  // equipped item never carries one, so a bare name means one.
  function itemCountFromLabel(label) {
    const m = ITEM_COUNT_RE.exec(String(label || '').split(';')[0]);
    return m ? Number(m[1]) : 1;
  }

  // ...and the label is not where EQUIPMENT states it. FL writes the count in
  // two places and never in the same one: an inventory item carries it in the
  // aria-label ("Witch-Stone × 20; A pebble…") and again in a
  // `.js-item-value` span beside the label, but a piece of equipment in the
  // equip drawer -- which is the only place a spare weapon, hat or pair of
  // boots ever appears -- carries no "× N" at all and only the span:
  //
  //   <div class="icon icon--available-item" data-quality-id="127763">
  //     <div aria-label="Scrimshander Carving Knife; Watchful +3; …">…</div>
  //     <span class="js-item-value icon__value">4</span>
  //
  // Reading the label alone therefore counted every duplicate piece of
  // equipment as one, and a character sitting on four Scrimshander Carving
  // Knives was told they had no spares to trade in (reported 2026-09-06, and
  // the markup above is that character's; the fix is confirmed in-game the
  // same day). The span wins wherever it is
  // there; the label stays as the fallback, and an equipped item (`.equipped-
  // item`, which has neither) still reads as the one you are wearing.
  function itemCountFromNode(el, label) {
    const value = el && el.querySelector ? el.querySelector('.js-item-value') : null;
    const n = value ? Number(String(value.textContent).replace(/[^0-9]/g, '')) : NaN;
    if (n > 0) return n;
    return itemCountFromLabel(label);
  }

  // Every item on the Possessions tab as a Map of normalised name ->
  // { name, count }, or null when this isn't that tab. The null matters: the
  // Myself tab has no `[data-quality-id]` at all, so an empty result there
  // would otherwise read as "you own nothing".
  //
  // Counts are taken as a MAX and never summed, because the same item shows up
  // more than once: an item you are wearing is both `div.equipped-item` and a
  // row in the equip drawer. Summing would report two of everything equipped.
  function readPossessionCounts(doc) {
    const d = doc || document;
    const nodes = d.querySelectorAll(OWNED_MARKER);
    if (!nodes.length) return null;
    const held = new Map();
    nodes.forEach(function (el) {
      const labelled = el.getAttribute('aria-label') != null ? el : el.querySelector('[aria-label]');
      const label = labelled && labelled.getAttribute('aria-label');
      const name = label && itemNameFromLabel(label);
      if (!name) return;
      const key = itemKey(name);
      const count = itemCountFromNode(el, label);
      const seen = held.get(key);
      if (!seen) held.set(key, { name: name, count: count });
      else if (count > seen.count) seen.count = count;
    });
    return held;
  }

  // Returns a Set of normalised item names, or null when this isn't the
  // Possessions tab. The set is exactly the counts' keys -- one reader, so the
  // two can't drift apart.
  function readPossessions(doc) {
    const held = readPossessionCounts(doc);
    return held ? new Set(held.keys()) : null;
  }

  // The player's own name, from the screen-reader sidebar's "It's <name>!"
  // greeting. That block is on every page, not just the Myself tab, which is
  // what makes it usable as the cache's identity check. Other /profile/ links
  // on a page can belong to other people, so this is scoped to that greeting.
  function characterName(doc) {
    const a = (doc || document).querySelector('#accessible-sidebar .welcome a[href^="/profile/"]');
    const href = a ? (a.getAttribute('href') || '') : '';
    const m = href.match(/^\/profile\/(.+)$/);
    try {
      return m ? decodeURIComponent(m[1]) : null;
    } catch (e) {
      return m ? m[1] : null;
    }
  }

  // Renown and Favours are read where they are shown -- the Myself tab -- but
  // wanted while you are anywhere else, so the last good read is cached. The
  // cache is always LABELLED with its age in the panel; it is a stale answer
  // offered as a stale answer, never passed off as current.
  // Two records, refreshed independently, because the two tabs are.
  const CACHE_KEY = 'fl-ux-factions';
  const ITEMS_KEY = 'fl-ux-possessions';

  function loadCache(key, version) {
    try {
      const raw = localStorage.getItem(key);
      if (!raw) return null;
      const rec = JSON.parse(raw);
      if (!rec || rec.v !== version) return null;
      // A different character's numbers are worse than none. When the current
      // name is unreadable we can't check, so the record's own name is shown.
      const who = characterName();
      if (who && rec.character && who !== rec.character) return null;
      return rec;
    } catch (e) {
      return null; // private mode, quota, corrupt JSON -- all mean "no cache"
    }
  }

  function saveCache(key, rec) {
    try {
      localStorage.setItem(key, JSON.stringify(rec));
    } catch (e) { /* storage unavailable; the live read still works */ }
  }

  // Turn a scrape of the Myself tab into the per-faction record the panel
  // wants. A faction quality you have none of is simply not rendered by FL, so
  // absent means 0 -- but ONLY when the list isn't filtered, otherwise absent
  // means "not on screen" and has to stay unknown.
  function factionsFromQualities(scan) {
    const values = {};
    const zeroIsSafe = !scan.filtered;
    for (const faction of FACTIONS) {
      const rec = {};
      if (faction.connectedNames) {
        const got = faction.connectedNames.map(function (n) {
          const q = scan.values.get('Connected: ' + n);
          return q ? q.level : (zeroIsSafe ? 0 : null);
        });
        if (got.some(function (v) { return v != null; })) rec.connected = got;
      } else {
        const renown = scan.values.get('Renown: ' + faction.name);
        const favours = scan.values.get('Favours: ' + faction.name);
        if (renown) rec.renown = renown.level;
        else if (zeroIsSafe) rec.renown = 0;
        if (favours) { rec.favours = favours.level; rec.favoursCap = favours.cap || 7; }
        else if (zeroIsSafe) { rec.favours = 0; rec.favoursCap = 7; }
      }
      // `claimed` -- which of the three Renown items you actually hold -- is
      // NOT on the Myself tab; those are possessions. Left undefined on
      // purpose, which the renderer shows as unknown rather than "not held".
      if (Object.keys(rec).length) values[faction.key] = rec;
    }
    return values;
  }

  // Called on every scan. Cheap on any page but the Myself tab (one failed
  // querySelectorAll), and re-scrapes there only when something changed, since
  // this runs on every debounced mutation and the list is a few hundred items.
  let lastScrapeSig = null;
  function captureFactionState() {
    const items = document.querySelectorAll('li.quality-item');
    const owned = document.querySelectorAll(OWNED_MARKER);
    if (!items.length && !owned.length) { lastScrapeSig = null; return; }
    const search = document.querySelector('input.input--item-search');
    const sig = items.length + '/' + owned.length + '|' + (search ? search.value : '');
    if (sig === lastScrapeSig) return;
    lastScrapeSig = sig;
    bankQualities(readQualities());
    bankPossessions(readPossessions());
  }

  function bankQualities(scan) {
    if (!scan) return false;
    const values = factionsFromQualities(scan);
    if (!Object.keys(values).length) return false; // filtered to nothing useful
    saveCache(CACHE_KEY, {
      v: 1, at: Date.now(), character: characterName() || null,
      partial: scan.filtered, values: values,
    });
    return true;
  }

  function bankPossessions(owned) {
    if (!owned || !owned.size) return false;
    saveCache(ITEMS_KEY, {
      v: 2, at: Date.now(), character: characterName() || null,
      owned: [...owned],
    });
    return true;
  }

  // The panel's one source of truth. Returns null for "nothing to show", or
  // { live, at, character, partial, values } where `values` is a Map keyed by
  // FACTIONS[].key holding { renown, favours, favoursCap, connected, claimed }.
  // Any field may be missing and the renderer shows a dash for it, so a
  // partial answer is still worth returning -- but a MISSING field must never
  // be filled in with a zero here. "0 Favours" and "we couldn't tell" look the
  // same on screen otherwise, and Favours genuinely can be 0.
  function readFactionState() {
    // Qualities: live if the Myself tab is on screen, else the banked answer.
    let qualities = null;
    const scan = readQualities();
    if (scan) {
      const values = factionsFromQualities(scan);
      if (Object.keys(values).length) {
        qualities = {
          live: true, at: Date.now(), character: characterName(),
          partial: scan.filtered, values: values,
        };
      }
    }
    if (!qualities) {
      const rec = loadCache(CACHE_KEY, 1);
      if (rec) {
        qualities = {
          live: false, at: rec.at, character: rec.character,
          partial: !!rec.partial, values: rec.values,
        };
      }
    }

    // Items: same, off the Possessions tab.
    let items = null;
    const live = readPossessions();
    if (live && live.size) {
      items = { live: true, at: Date.now(), owned: live };
    } else {
      // Version 2: version 1 was keyed by `normalizeName`, so every article-
      // carrying name in it is filed under a key nothing looks up any more.
      const rec = loadCache(ITEMS_KEY, 2);
      if (rec && rec.owned) items = { live: false, at: rec.at, owned: new Set(rec.owned) };
    }

    if (!qualities && !items) return null;

    // Compose. Each faction's record is whatever we know, and nothing more --
    // a faction with neither a quality nor an item simply isn't in the map.
    const values = new Map();
    for (const faction of FACTIONS) {
      const rec = Object.assign({}, (qualities && qualities.values[faction.key]) || {});
      if (items) {
        if (faction.items.length) {
          rec.claimed = faction.items.map(function (i) {
            return items.owned.has(itemKey(i.name));
          });
        }
        rec.hasItem = items.owned.has(itemKey(faction.item.name));
      }
      if (Object.keys(rec).length) values.set(faction.key, rec);
    }

    return {
      live: !!(qualities && qualities.live),
      at: qualities ? qualities.at : null,
      character: (qualities && qualities.character) || null,
      partial: !!(qualities && qualities.partial),
      itemsAt: items ? items.at : null,
      itemsLive: !!(items && items.live),
      values: values,
    };
  }

  // --- refreshing without leaving the page -------------------------------
  //
  // `fetch('/myself')` does NOT work here, and it is worth writing down why so
  // nobody tries it again: Fallen London is a client-rendered React app, and
  // the HTML routes serve a ~4.7KB shell whose <div id="root"> holds a loading
  // splash and nothing else. There is no quality list in the response to
  // parse. (Checked against the live site, not assumed.)
  //
  // What does work is a hidden same-origin iframe: point it at the route, let
  // the app boot inside it, and read its document once the markup we want has
  // appeared. It costs a second boot of the SPA -- a few seconds and some
  // bandwidth -- which is why it is throttled below and can be switched off.
  // /myself and /possessions are plain views; loading them spends no actions.
  //
  // VERIFIED WORKING in-game (reported 2026-09-02). The guards below stay
  // anyway: if the iframe ever comes back empty, every caller treats that as
  // "no refresh" and falls through to the cache, so the failure mode is the
  // panel you had before, never a wrong number.

  const REFRESH_TIMEOUT_MS = 20000;

  function loadInFrame(path, extract) {
    return new Promise(function (resolve) {
      let frame;
      let poll = null;
      let timer = null;
      let settled = false;
      const finish = function (value) {
        if (settled) return;
        settled = true;
        if (poll) clearInterval(poll);
        if (timer) clearTimeout(timer);
        if (frame && frame.parentNode) frame.remove();
        resolve(value || null);
      };
      try {
        frame = h('iframe', {
          src: path,
          title: 'UX Enhancers background refresh',
          // Off-screen rather than display:none -- a display:none iframe is
          // allowed to skip layout, and the app inside needs to actually run.
          css: 'position:fixed;left:-10000px;top:0;width:1280px;height:900px;'
            + 'border:0;opacity:0;pointer-events:none;',
        });
        frame.setAttribute('aria-hidden', 'true');
        frame.setAttribute('tabindex', '-1');
        document.body.appendChild(frame);
        poll = setInterval(function () {
          let doc = null;
          try {
            doc = frame.contentDocument;
          } catch (e) {
            return finish(null); // cross-origin redirect (logged out, say)
          }
          if (!doc || !doc.body) return;
          let got = null;
          try {
            got = extract(doc);
          } catch (e) {
            return finish(null);
          }
          if (got) finish(got);
        }, 300);
        timer = setTimeout(function () { finish(null); }, REFRESH_TIMEOUT_MS);
      } catch (e) {
        finish(null);
      }
    });
  }

  // One refresh at a time, and never two of these racing each other.
  let refreshing = null;

  // Refreshes what the Factions panel reads, off the same two page loads
  // Choice Helper uses -- and shares each page it loads, so Choice Helper banks
  // its own numbers off the same boot rather than paying for another.
  function refreshBackgroundState() {
    if (refreshing) return refreshing;
    refreshing = (async function () {
      let changed = false;
      // Sequential, not parallel: two copies of the SPA booting at once is a
      // lot of work for the browser, and nothing here is urgent.
      if (!readQualities()) {
        const scan = await loadInFrame('/myself', function (doc) {
          const got = myselfLoaded(doc);
          if (got) shareFrame('/myself', doc);
          return got;
        });
        if (bankQualities(scan)) changed = true;
      }
      const here = readPossessions();
      if (!here || !here.size) {
        const held = await loadInFrame('/possessions', function (doc) {
          const got = possessionsLoaded(doc);
          if (got) shareFrame('/possessions', doc);
          return got;
        });
        if (bankPossessions(held ? new Set(held.keys()) : null)) changed = true;
      }
      return changed;
    })().catch(function (e) {
      console.error('FL UX Enhancers: background refresh failed.', e);
      return false;
    }).then(function (v) {
      refreshing = null;
      return v;
    });
    return refreshing;
  }

  // Auto-refresh is on by default but remembered, so a slow connection can
  // turn it off and keep the (labelled) cached numbers.
  const AUTO_KEY = 'fl-ux-auto-refresh';

  function autoRefreshEnabled() {
    try {
      return localStorage.getItem(AUTO_KEY) !== '0';
    } catch (e) {
      return true;
    }
  }

  function setAutoRefresh(on) {
    try {
      localStorage.setItem(AUTO_KEY, on ? '1' : '0');
    } catch (e) { /* nothing to do */ }
  }

  // Don't boot the SPA again for numbers that are already a minute old.
  const FRESH_MS = 60 * 1000;

  function stateIsFresh(state) {
    if (!state) return false;
    const q = state.live || (state.at && Date.now() - state.at < FRESH_MS);
    const i = state.itemsLive || (state.itemsAt && Date.now() - state.itemsAt < FRESH_MS);
    return !!(q && i);
  }

  function ageText(ms) {
    const mins = Math.max(0, Math.round((Date.now() - ms) / 60000));
    if (mins < 1) return 'moments ago';
    if (mins < 60) return mins + (mins === 1 ? ' minute ago' : ' minutes ago');
    const hours = Math.round(mins / 60);
    if (hours < 24) return hours + (hours === 1 ? ' hour ago' : ' hours ago');
    const days = Math.round(hours / 24);
    return days + (days === 1 ? ' day ago' : ' days ago');
  }

  // --- using a Faction Item ----------------------------------------------
  //
  // CONFIRMED WORKING in-game (2026-09-02): this opens the item's options.
  //
  // The item lives on the Possessions tab, where every item is a
  // `[data-quality-id]` wrapping a `[role="button"][tabindex]` that FL's own
  // React handler opens the item's options panel from. So "use" here means:
  // get to Possessions, find that element, and click it. This script still
  // never picks an option -- the Favours are spent by you, on FL's own screen.
  //
  // Two ways to get there, and the difference matters. FL's visible nav is a
  // real `<a class="cursor-pointer" href="/possessions">` driven by the
  // router, so clicking it changes route WITHOUT a reload and the panel and
  // this script survive. `location.assign` is the fallback and does reload,
  // which is why the request is parked in sessionStorage rather than kept in a
  // variable: either path then finishes the same way, in `runPendingItem`
  // below, when the scan next sees the Possessions markup.

  const PENDING_KEY = 'fl-ux-pending-item';
  const PENDING_MAX_MS = 30000; // a parked request older than this is stale

  function readPending() {
    try {
      const rec = JSON.parse(sessionStorage.getItem(PENDING_KEY) || 'null');
      if (!rec || !rec.name) return null;
      if (Date.now() - (rec.at || 0) > PENDING_MAX_MS) { clearPending(); return null; }
      return rec;
    } catch (e) {
      return null;
    }
  }

  function writePending(name) {
    try {
      sessionStorage.setItem(PENDING_KEY, JSON.stringify({ name: name, at: Date.now() }));
    } catch (e) { /* the click just won't be replayed after a reload */ }
  }

  function clearPending() {
    try {
      sessionStorage.removeItem(PENDING_KEY);
    } catch (e) { /* nothing to do */ }
  }

  // The clickable element for an item by name, on a Possessions page.
  function findItemNode(name, doc) {
    const want = normalizeName(name);
    const nodes = (doc || document).querySelectorAll(OWNED_MARKER);
    for (const el of nodes) {
      const labelled = el.getAttribute('aria-label') != null ? el : el.querySelector('[aria-label]');
      if (!labelled) continue;
      if (normalizeName(itemNameFromLabel(labelled.getAttribute('aria-label'))) !== want) continue;
      // Prefer the element FL actually made focusable -- that is the one its
      // click handler is bound to.
      return el.querySelector('[role="button"]') || labelled || el;
    }
    return null;
  }

  // React-controlled inputs ignore a plain `value =`; the native setter plus an
  // input event is what makes the component notice. Only used as the fallback
  // when the item itself can't be found, so you at least land on a filtered
  // list instead of a wall of possessions.
  function setSearchBox(text) {
    const input = document.querySelector('input.input--item-search');
    if (!input) return false;
    try {
      const proto = Object.getPrototypeOf(input);
      const desc = Object.getOwnPropertyDescriptor(proto, 'value');
      if (desc && desc.set) desc.set.call(input, text);
      else input.value = text;
      input.dispatchEvent(new Event('input', { bubbles: true }));
      return true;
    } catch (e) {
      return false;
    }
  }

  function clickItem(name) {
    const node = findItemNode(name);
    if (!node) return false;
    try {
      if (node.scrollIntoView) node.scrollIntoView({ block: 'center' });
    } catch (e) { /* older browsers; the click still works */ }
    node.click();
    return true;
  }

  // Runs on every scan. Does nothing unless a request is parked AND we are
  // looking at a Possessions page, so it costs one sessionStorage read
  // elsewhere.
  function runPendingItem() {
    const pending = readPending();
    if (!pending) return;
    if (!document.querySelector(OWNED_MARKER)) return; // not there yet
    if (clickItem(pending.name)) { clearPending(); return; }
    // The page is up and the item is not on it: stop retrying, and leave the
    // list filtered to the name so it's obvious what was looked for.
    if (setSearchBox(pending.name)) clearPending();
  }

  // What the panel's "use" control does.
  function openItem(name) {
    if (clickItem(name)) return 'clicked';
    writePending(name);
    const link = document.querySelector('a.cursor-pointer[href="/possessions"]')
      || document.querySelector('nav a[href="/possessions"]')
      || document.querySelector('a[href="/possessions"]');
    if (link) { link.click(); return 'navigating'; }
    try {
      location.assign('/possessions');
      return 'navigating';
    } catch (e) {
      clearPending();
      return 'failed';
    }
  }

  // --- rendering ---------------------------------------------------------

  const TH = 'padding:5px 8px;text-align:left;font:bold 11px ' + UI.font
    + ';letter-spacing:.05em;text-transform:uppercase;color:' + UI.dim
    + ';border-bottom:1px solid ' + UI.line + ';white-space:nowrap;';
  const TD = 'padding:5px 8px;vertical-align:top;border-bottom:1px solid ' + UI.line + ';';

  // Two more colours for the pips: an item you could go and get right now, and
  // one whose Renown gate you have passed but whose Favours you have not saved
  // up. Seeing the first at a glance is the whole point of the column -- a
  // Renown item sits there unclaimed for months otherwise.
  const COLOR_READY = '#9ab73c';    // Renown reached AND Favours in hand
  const COLOR_UNLOCKED = '#8a6d3b'; // Renown reached, Favours short
  // Favours cap at 7 and every one earned past that is simply thrown away, so
  // this is the only state on the page that is actively costing you something
  // while you look at it. Orange, not the green of "you could do this" -- a
  // different kind of urgency.
  const COLOR_FULL = '#d4761c';

  // What a single Renown item is to this character. Pure, so all six states
  // can be checked without a DOM.
  //
  //   'claimed'   you have it
  //   'ready'     Renown gate passed and you have the Favours -- go and get it
  //   'unlocked'  Renown gate passed, not enough Favours yet
  //   'locked'    Renown too low
  //   'unheld'    you don't have it, and we can't say why (no Renown reading)
  //   'unknown'   your possessions haven't been read at all
  function itemStatus(tier, state) {
    const claimed = Array.isArray(state.claimed) ? state.claimed[tier.index] : undefined;
    if (typeof claimed !== 'boolean') return 'unknown';
    if (claimed) return 'claimed';
    if (typeof state.renown !== 'number') return 'unheld';
    if (state.renown < tier.at) return 'locked';
    if (typeof state.favours !== 'number') return 'unlocked';
    return state.favours >= tier.favours ? 'ready' : 'unlocked';
  }

  function tierAt(index) {
    return { at: RENOWN_TIERS[index].at, favours: RENOWN_TIERS[index].favours, index: index };
  }

  // One Renown item, as a pip. Filled when you have it, hollow when you don't,
  // and a dash while there is no source for that answer -- three glyphs, so an
  // unknown is never mistaken for a "no". Colour carries the fourth thing:
  // whether the hollow one is actually within reach.
  function itemPip(faction, index, state) {
    const item = faction.items[index];
    if (!item) return null;
    const tier = tierAt(index);
    const status = itemStatus(tier, state);

    // Three tiers of loudness, and the shape carries the first split. Anything
    // whose Renown gate you have already passed gets an exclamation mark --
    // there is something to do about it -- while the states you can't act on
    // stay diamonds. Then the fill separates the two exclamations: `ready` is
    // solid dark-on-green (go now), `unlocked` is an outline in brown (nearly:
    // save the Favours). A hollow diamond among hollow diamonds was too quiet
    // for either.
    const actionable = status === 'ready' || status === 'unlocked';
    const glyph = actionable ? '!'
      : (status === 'unknown' ? '\u2013' : (status === 'claimed' ? '\u25c6' : '\u25c7'));
    const color = status === 'ready' ? '#17190c'
      : (status === 'claimed' ? UI.accent
        : (status === 'unlocked' ? COLOR_UNLOCKED : UI.dim));

    const say = {
      claimed: 'You have this.',
      ready: 'READY: Renown ' + tier.at + ' reached and you have the '
        + tier.favours + ' Favours. Go and get it.',
      unlocked: 'Renown ' + tier.at + ' reached'
        + (typeof state.favours === 'number'
          ? ' \u2014 needs ' + tier.favours + ' Favours, you have ' + state.favours + '.'
          : ' \u2014 needs ' + tier.favours + ' Favours.'),
      locked: 'Needs Renown ' + tier.at
        + (typeof state.renown === 'number' ? ' \u2014 you have ' + state.renown + '.' : '.'),
      unheld: 'Not held.',
      unknown: '(Whether you have it has not been read yet.)',
    }[status];

    const title = [
      'Renown ' + tier.at + ' \u2014 ' + tier.favours + ' Favours',
      item.name + ' (' + item.slot + ', ' + item.stats + ')',
      'From: ' + item.from,
      item.bis === 'strict' ? 'Strict best in slot.'
        : (item.bis === 'shared' ? 'Shared best in slot.' : null),
      item.upperRiver ? 'WARNING: permanently adds a card to your Upper River deck.'
        : (item.replacesCard ? 'Adds an Upper River card but locks another; deck size unchanged.' : null),
      say,
    ].filter(Boolean).join('\n');

    // Solid for the one meant to be findable from across the table; an outline
    // for the one that is only worth noticing once you are already reading the
    // row. Both keep the same box so the column stays aligned.
    const chip = status === 'ready'
      ? 'background:' + COLOR_READY + ';border:1px solid ' + COLOR_READY
        + ';border-radius:3px;font-weight:bold;box-shadow:0 0 6px rgba(154,183,60,.55);'
      : (status === 'unlocked'
        ? 'background:#2a2113;border:1px solid ' + COLOR_UNLOCKED
          + ';border-radius:3px;font-weight:bold;'
        : 'border:1px solid transparent;');

    return h('a', {
      href: wikiHref(item.name), target: '_blank', rel: 'noopener', title: title,
      css: 'display:inline-block;min-width:1.35em;text-align:center;text-decoration:none;'
        + 'font-size:13px;line-height:15px;margin-right:1px;color:' + color + ';' + chip
        + (item.upperRiver ? 'border-bottom:1px solid #8a3b3b;' : ''),
    }, [glyph]);
  }

  // Favours are capped (at 7), and anything gained past the cap is lost. A
  // faction sitting at the cap is therefore wasting every Favour it earns
  // until you spend some -- which is worth shouting about, not colouring in.
  function fullFavours(state) {
    const out = [];
    if (!state) return out;
    for (const faction of FACTIONS) {
      const rec = state.values.get(faction.key);
      if (!rec || faction.connectedNames) continue;
      const cap = rec.favoursCap || 7;
      if (typeof rec.favours === 'number' && rec.favours >= cap) {
        out.push({ faction: faction, favours: rec.favours, cap: cap });
      }
    }
    return out;
  }

  // Everything this character could go and claim right now. Drives the line at
  // the top of the panel, which is what makes the state findable without
  // reading every row.
  function readyItems(state) {
    const out = [];
    if (!state) return out;
    for (const faction of FACTIONS) {
      const rec = state.values.get(faction.key);
      if (!rec) continue;
      faction.items.forEach(function (item, i) {
        if (itemStatus(tierAt(i), rec) === 'ready') {
          out.push({ faction: faction, item: item, tier: tierAt(i) });
        }
      });
    }
    return out;
  }

  function factionRow(faction, state, ctx) {
    const s = state || {};
    const dash = '–';
    const num = function (v) { return typeof v === 'number' ? String(v) : dash; };

    const claimed = Array.isArray(s.claimed) ? s.claimed : [];
    const pips = faction.items.length
      ? faction.items.map(function (_, i) { return itemPip(faction, i, s); })
      : [h('span', { css: 'color:' + UI.dim + ';font-size:11px;' }, ['Connected'])];

    const allClaimed = faction.items.length > 0
      && claimed.length === faction.items.length
      && claimed.every(Boolean);
    const anyReady = faction.items.some(function (_, i) {
      return itemStatus(tierAt(i), s) === 'ready';
    });

    const it = faction.item;

    // Connected factions show their Connected level in the Renown column --
    // it is the quality that plays the same role -- and nothing under Favours,
    // which they don't have. The University has two, so both are listed.
    const renownCell = faction.connectedNames
      ? (Array.isArray(s.connected)
        ? s.connected.map(function (v) { return typeof v === 'number' ? String(v) : dash; }).join(' · ')
        : faction.connectedNames.map(function () { return dash; }).join(' · '))
      : num(s.renown);
    const renownTitle = faction.connectedNames
      ? 'Connected: ' + faction.connectedNames.join(', ')
      : null;

    const favoursCap = s.favoursCap || 7;
    const favoursFull = !faction.connectedNames
      && typeof s.favours === 'number' && s.favours >= favoursCap;
    const favoursCell = faction.connectedNames
      ? dash
      : (typeof s.favours === 'number' ? s.favours + '/' + favoursCap : dash);

    return h('tr', null, [
      h('td', {
        // A row that wants something done gets an accent edge, so the eye finds
        // it without reading fourteen rows of pips. Ready wins over capped when
        // both are true, because then they are the same action: spend the
        // Favours on the item.
        css: TD + (anyReady
          ? 'box-shadow:inset 3px 0 0 ' + COLOR_READY + ';'
          : (favoursFull ? 'box-shadow:inset 3px 0 0 ' + COLOR_FULL + ';' : '')),
      }, [
        wikiLink(faction.connected ? faction.name : 'Faction: ' + faction.name, faction.name,
          { fontWeight: 'bold' }),
        faction.stat
          ? h('div', { css: 'color:' + UI.dim + ';font-size:11px;' }, [faction.stat])
          : null,
      ]),
      h('td', {
        css: TD + 'text-align:right;font-variant-numeric:tabular-nums;white-space:nowrap;',
        title: renownTitle,
      }, [renownCell]),
      h('td', {
        css: TD + 'text-align:right;font-variant-numeric:tabular-nums;white-space:nowrap;',
      }, [
        favoursFull
          // Filled, like the ready badge, because a plain colour change reads
          // as decoration. This one means you are losing Favours right now.
          ? h('span', {
            title: 'FULL: at the ' + favoursCap + '-Favour cap. Every Favour you earn for '
              + faction.name + ' from now on is thrown away. Spend some.',
            css: 'display:inline-block;padding:0 5px;border-radius:3px;font-weight:bold;'
              + 'color:#17190c;background:' + COLOR_FULL + ';cursor:help;'
              + 'box-shadow:0 0 6px rgba(212,118,28,.6);',
          }, [favoursCell])
          : favoursCell,
      ]),
      h('td', {
        css: TD + 'white-space:nowrap;' + (allClaimed ? 'color:' + UI.accent + ';' : ''),
        title: allClaimed ? 'All three Renown items claimed.' : '',
      }, pips),
      h('td', { css: TD }, [
        // A ✦ when you actually have the item. Without it the Favours can't be
        // converted at all, so it's the first thing worth knowing about a row.
        s.hasItem === true
          ? h('span', {
            title: 'You have this.',
            css: 'color:' + UI.accent + ';margin-right:3px;',
          }, ['✦'])
          : null,
        wikiLink(it.name, it.short || it.name),
        h('div', { css: 'color:' + UI.dim + ';font-size:11px;' },
          [it.shop + ' · £' + it.cost.toFixed(2)]),
      ]),
      h('td', { css: TD }, [
        h('button', {
          type: 'button',
          title: s.hasItem === false
            ? 'You do not appear to own ' + it.name + '. This opens Possessions anyway.'
            : 'Open ' + it.name + ' on the Possessions tab so its options appear. '
              + 'Nothing is spent \u2014 you still pick the option yourself.',
          css: 'border:1px solid ' + UI.line + ';border-radius:3px;background:transparent;'
            + 'color:' + (s.hasItem === false ? UI.dim : UI.accent) + ';'
            + 'font:11px ' + UI.font + ';padding:1px 7px;cursor:pointer;',
          on: {
            click: function () {
              if (openItem(it.name) !== 'failed' && ctx && ctx.close) ctx.close();
            },
          },
        }, ['use']),
      ]),
    ]);
  }

  function renderFactionsPanel(ctx) {
    const state = readFactionState();
    const get = function (key) { return state ? state.values.get(key) : null; };

    // Kick a background refresh the first time the panel is opened on stale
    // data, then redraw when it lands. Nothing blocks on it: the panel is
    // already on screen with whatever was known.
    let busy = false;
    if (ctx && autoRefreshEnabled() && !stateIsFresh(state)) {
      busy = true;
      refreshBackgroundState().then(function () { ctx.rerender(); });
    }

    // Say plainly where the numbers came from and how old they are. A stale
    // read is useful; a stale read presented as current is not.
    const notice = function (color, text) {
      return h('div', {
        css: 'margin:10px 0;padding:8px 10px;border-left:3px solid ' + color
          + ';background:' + UI.bgAlt + ';color:' + UI.dim + ';font-size:12px;line-height:1.5;',
      }, text);
    };

    const banners = [];
    if (busy) banners.push(notice(UI.accent, ['Refreshing in the background…']));

    // Capped Favours first: it is the only thing on the page that is costing
    // you something while you read it.
    const full = fullFavours(state);
    if (full.length) {
      banners.push(h('div', {
        css: 'margin:10px 0 0;padding:8px 10px;border-left:3px solid ' + COLOR_FULL
          + ';background:#2e1d0c;color:' + UI.text + ';font-size:12px;line-height:1.6;',
      }, [
        h('div', { css: 'color:' + COLOR_FULL + ';font-weight:bold;' }, [
          h('span', {
            css: 'display:inline-block;color:#17190c;background:' + COLOR_FULL
              + ';border-radius:3px;padding:0 5px;margin-right:6px;',
          }, ['!']),
          full.length === 1
            ? 'Favours full for ' + full[0].faction.name + ' \u2014 spend them'
            : 'Favours full for ' + full.length + ' factions \u2014 spend them',
        ]),
        h('div', { css: 'color:' + UI.dim + ';' }, [
          full.map(function (f) { return f.faction.name; }).join(', '),
          ' \u2014 every further Favour is thrown away.',
        ]),
      ]));
    }

    // The headline. Everything else on this page is reference material; this
    // is the bit that says "go and do something".
    const ready = readyItems(state);
    if (ready.length) {
      banners.push(h('div', {
        css: 'margin:10px 0 0;padding:8px 10px;border-left:3px solid ' + COLOR_READY
          + ';background:#23280f;color:' + UI.text + ';font-size:12px;line-height:1.6;',
      }, [
        h('div', { css: 'color:' + COLOR_READY + ';font-weight:bold;' }, [
          h('span', {
            css: 'display:inline-block;color:#17190c;background:' + COLOR_READY
              + ';border-radius:3px;padding:0 5px;margin-right:6px;',
          }, ['!']),
          ready.length === 1
            ? '1 Renown item you can claim right now'
            : ready.length + ' Renown items you can claim right now',
        ]),
        ready.map(function (r) {
          return h('div', null, [
            wikiLink(r.item.name, r.item.name),
            h('span', { css: 'color:' + UI.dim + ';' },
              [' — ' + r.faction.name + ', Renown ' + r.tier.at + ', '
                + r.tier.favours + ' Favours · ' + r.item.from]),
          ]);
        }),
      ]));
    }
    if (!state) {
      banners.push(notice(UI.accent, [
        'No Renown or Favours to show yet. Open the ',
        h('a', { href: '/myself', css: 'color:' + UI.text + ';' }, ['Myself']),
        ' tab once and they will be read from it and remembered here.',
      ]));
    } else {
      if (state.partial) {
        banners.push(notice('#8a6b3b', ['The Myself tab’s search box is filtering the list '
          + '— anything not on screen is shown as – rather than guessed at 0.']));
      }
      // Say where each half came from and how old it is, and offer the two
      // controls next to it rather than in a settings screen nobody opens.
      const where = 'Renown & Favours: ' + (state.live ? 'live' : ageText(state.at))
        + '  ·  items: '
        + (state.itemsAt ? (state.itemsLive ? 'live' : ageText(state.itemsAt)) : 'never read')
        + (state.character ? '  ·  ' + state.character : '');
      banners.push(h('div', {
        css: 'margin:10px 0 0;display:flex;align-items:center;gap:10px;flex-wrap:wrap;'
          + 'color:' + UI.dim + ';font-size:11px;',
      }, [
        h('span', null, [where]),
        h('button', {
          type: 'button',
          disabled: busy,
          title: 'Load /myself and /possessions in a hidden frame and re-read them.',
          css: 'border:1px solid ' + UI.line + ';border-radius:3px;background:transparent;color:'
            + (busy ? UI.dim : UI.accent) + ';font:11px ' + UI.font + ';padding:1px 7px;'
            + 'cursor:' + (busy ? 'default' : 'pointer') + ';',
          on: {
            click: function () {
              if (busy || !ctx) return;
              busy = true;
              ctx.rerender();
              refreshBackgroundState().then(function () { ctx.rerender(); });
            },
          },
        }, [busy ? 'Refreshing…' : 'Refresh']),
        h('label', {
          title: 'Refresh automatically when this panel opens on stale numbers.',
          css: 'display:inline-flex;align-items:center;gap:4px;cursor:pointer;',
        }, [
          h('input', {
            type: 'checkbox',
            checked: autoRefreshEnabled(),
            on: { change: function (e) { setAutoRefresh(!!e.currentTarget.checked); } },
          }),
          'auto',
        ]),
      ]));
    }

    const body = h('div', { css: 'padding:0 12px 12px;' }, [
      banners,

      h('table', { css: 'width:100%;border-collapse:collapse;margin-top:10px;' }, [
        h('thead', null, [h('tr', null, [
          h('th', { css: TH }, ['Faction']),
          h('th', { css: TH + 'text-align:right;', title: 'Renown: raised with the Faction Item, and it never falls.' }, ['Ren.']),
          h('th', { css: TH + 'text-align:right;', title: 'Favours, capped at 7.' }, ['Fav.']),
          h('th', { css: TH, title: 'The three Renown items, at Renown 10 / 25 / 40.\n◆ held  ◇ not held  – unknown' }, ['Items']),
          h('th', { css: TH, title: 'Spend Favours on this to raise Renown. It is NOT consumed.' }, ['Faction Item']),
          h('th', { css: TH }, ['']),
        ])]),
        h('tbody', null, FACTIONS.map(function (f) { return factionRow(f, get(f.key), ctx); })),
      ]),

      h('div', { css: 'margin-top:12px;color:' + UI.dim + ';font-size:11px;line-height:1.6;' }, [
        h('div', null, ['Renown items cost 3 / 5 / 7 Favours at Renown 10 / 25 / 40.']),
        h('div', null, ['Faction Items are not consumed when used. The action costs 1 Favour per CP '
          + 'below Renown 8, 2 CP and £2.50 from 8–15, and 4 CP and about £12.50 from 16–55 '
          + '(Constables £18.90, Docks £17.50, Criminals £14.50, Tomb-Colonies £12).']),
        h('div', null, ['Below Renown 5, Mrs Plenty’s Carnival raises Renown and gives a Favour '
          + 'for 2 actions and a Carnival Ticket — far cheaper than the item.']),
        h('div', { css: 'color:#8a6b6b;' }, ['A red underline marks an item that permanently adds a '
          + 'card to your Upper River deck.']),
        h('div', null, ['◆ held · ◇ not held · – not read yet. A ',
          h('span', {
            css: 'color:#17190c;background:' + COLOR_READY + ';border-radius:3px;'
              + 'padding:0 5px;font-weight:bold;',
          }, ['!']),
          ' is claimable right now; an outlined ',
          h('span', {
            css: 'color:' + COLOR_UNLOCKED + ';background:#2a2113;border:1px solid '
              + COLOR_UNLOCKED + ';border-radius:3px;padding:0 5px;font-weight:bold;',
          }, ['!']),
          ' means the Renown is there but the Favours are not yet. '
          + 'A ✦ on the Faction Item means you own it.']),
        h('div', null, ['A ',
          h('span', {
            css: 'color:#17190c;background:' + COLOR_FULL + ';border-radius:3px;'
              + 'padding:0 4px;font-weight:bold;',
          }, ['7/7']),
          ' in the Favours column means you are at the cap and losing every '
          + 'Favour you earn for that faction.']),
        h('div', { css: 'margin-top:6px;' }, ['Data from ',
          wikiLink('Factions (Guide)', 'Factions (Guide)'), ' on the Fallen London wiki.']),
      ]),
    ]);

    return body;
  }

  // === feature registry ==================================================

  const FEATURES = [
    { name: 'launcher', run: mountLauncher },
    // Not a visible tweak: it watches for the Myself tab going by and banks
    // what it says, so the Factions panel has something to show from anywhere
    // else in London.
    { name: 'faction-capture', run: captureFactionState },
    // Finishes a "use" click that had to change route to get to Possessions.
    { name: 'pending-item', run: runPendingItem },
  ];

  // === dispatch ==========================================================

  let pending = false;
  function scan() {
    pending = false;
    for (const feature of FEATURES) {
      try {
        feature.run();
      } catch (e) {
        console.error('FL UX Enhancers: feature "' + feature.name + '" failed.', e);
      }
    }
  }
  function schedule() {
    if (pending) return;
    pending = true;
    requestAnimationFrame(scan);
  }

  // A page Choice Helper loaded in a hidden frame is a page this script would
  // otherwise load again for itself.
  onSharedFrame(function (path, doc) {
    if (path === '/myself') bankQualities(readQualities(doc));
    else if (path === '/possessions') bankPossessions(readPossessions(doc));
  });

  scan();
  new MutationObserver(schedule).observe(document.body, { childList: true, subtree: true });
})();
