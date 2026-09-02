// ==UserScript==
// @name         Fallen London UX Enhancers
// @author       Tilo
// @namespace    https://github.com/TiloBuechsenschuss
// @downloadURL  https://raw.githubusercontent.com/TiloBuechsenschuss/userscripts/refs/heads/main/FallenLondon/ux-enhancers.js
// @version      0.9
// @description  A grab-bag of small quality-of-life tweaks for Fallen London. (1) A floating "UX" button opens a menu of reference panels; the first is Factions, a table of every faction with your current Renown and Favours (read off the Myself tab and remembered, so it is there from anywhere in London), the three Renown items each unlocks at Renown 10/25/40, and the Faction Item that turns Favours into Renown, with where to buy it and what it costs. Renown and Favours come off the Myself tab and which items you hold off Possessions; both are remembered, and opening the panel refreshes them in the background. A Renown item you could go and collect right now -- Renown reached and the Favours in hand -- gets a filled "!" badge and is listed at the top; one whose Renown is high enough but whose Favours are still short gets an outlined "!"; and any faction whose Favours have hit the cap of 7 and are being thrown away is called out too. Each row has a "use" button that opens that faction's item on the Possessions tab so its options appear. (2) In The Crowds of Spite (the Pickpocket's Promenade) every opportunity card gets a rating badge showing the bonus Pickpocket's Trophies it pays on a successful pickpocket (+0 to +9), colour-coded from grey to gold, with a dagger when the card draws from the inferior skill table, and a tooltip carrying the Shadowy challenge, the pass-by option and what a failed pickpocket costs. Watchful Eyes and the Rat-Catcher, which give no trophies at all, are labelled instead of scored. Built as a feature registry so further tweaks can be added as entries.
// @match        https://www.fallenlondon.com/*
// @match        https://fallenlondon.com/*
// @run-at       document-idle
// @noframes
// @grant        none
// ==/UserScript==

(function () {
  'use strict';

  // This script is a container for several unrelated Fallen London tweaks, in
  // the same spirit as KingdomOfLoathing/ux-enhancers.js. The difference is
  // what a feature is scoped BY. KoL is server-rendered, so each of its
  // features declares the `.php` path it belongs to and runs once. Fallen
  // London is a single-page React app: there is one URL, and storylets, cards
  // and results are swapped into the DOM client-side with no page navigation.
  // So there is no path to gate on and no single document-idle pass that sees
  // everything -- every feature here is instead scoped by the markup it finds,
  // and is re-run on a debounced MutationObserver.
  //
  // Adding a feature:
  //   1. Write a `run()` that finds its own markup and bails harmlessly when
  //      that markup isn't on screen. It will be called on the initial pass and
  //      again on every debounced DOM change, so it must be IDEMPOTENT and
  //      cheap -- use `attachBadge` (or the same dataset-flag trick) rather
  //      than blindly injecting.
  //   2. Add a `{ name, run }` entry to FEATURES at the bottom. A feature that
  //      throws is logged and cannot stop the others.
  //   3. Give it its own badge class and dataset flag so two features can
  //      decorate the same element without fighting over one flag.
  //
  // A feature that wants a screen of its own rather than a decoration should
  // instead register a PANEL -- see the launcher section further down.

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

  // === shared: where you are =============================================
  //
  // Fallen London keeps a screen-reader-only block at the top of every page:
  //
  //   <div id="accessible-sidebar" class="accessible-sidebar u-visually-hidden">
  //     <h1 class="welcome"><span>It's <a href="/profile/TheFairUnknown">…</a>!</span>
  //      Welcome to Spite, delicious friend!</h1>
  //
  // Verified identical on /myself and /possessions, in both the wide and the
  // narrow layout. It is the only place the current area is stated in plain
  // text, and it is there no matter which tab you are on.
  function currentArea(doc) {
    const el = (doc || document).querySelector('#accessible-sidebar .welcome');
    const text = el ? el.textContent.replace(/\s+/g, ' ') : '';
    const m = text.match(/Welcome to (.+?),\s*delicious friend/i);
    return m ? m[1].trim() : null;
  }

  // === shared: badges ====================================================

  // Every badge this script injects carries BADGE_CLASS plus a per-feature
  // class. The shared class is what lets `headingName` below recognise our own
  // decorations, whichever feature added them.
  const BADGE_CLASS = 'fl-ux-badge';

  // A badge is described by a plain { text, color, title } spec, so the
  // deciding (per feature, pure, testable) stays separate from the drawing.
  function makeBadge(spec, extraClass) {
    const el = document.createElement('span');
    el.className = extraClass ? BADGE_CLASS + ' ' + extraClass : BADGE_CLASS;
    el.textContent = spec.text;
    el.title = spec.title;
    // Inline styles only (repo convention): @grant none rules out GM_addStyle,
    // and a stylesheet is one more thing a React re-render could drop.
    el.style.cssText =
      'display:inline-block;margin-left:4px;padding:0 4px;' +
      'font-family:arial,sans-serif;font-size:10px;font-weight:bold;' +
      'line-height:14px;color:#fff;border-radius:2px;' +
      'background:' + spec.color + ';' +
      'text-shadow:none;white-space:nowrap;vertical-align:middle;cursor:help;';
    return el;
  }

  // Read a storylet/card name off a heading WITHOUT the badges hung inside it
  // by us or by another script. wiki-links.js appends its "W" anchor into the
  // very same heading element, so a plain `textContent` here would yield
  // "A drunkW" and match nothing.
  function headingName(el) {
    let out = '';
    for (const node of el.childNodes) {
      if (node.nodeType === 3) { out += node.nodeValue; continue; }
      if (node.nodeType !== 1) continue;
      const cls = node.className;
      if (typeof cls === 'string' &&
          (cls.indexOf(BADGE_CLASS) !== -1 || cls.indexOf('fl-wiki-link') !== -1)) continue;
      out += node.textContent;
    }
    return out.trim();
  }

  // Attach one badge to `host`, idempotently.
  //
  //   flag   dataset property this feature owns (e.g. 'flSpite'). One per
  //          feature, so two features can badge the same element.
  //   value  the identity of what is being badged -- normally the name. The
  //          flag stores this rather than a boolean because React REUSES these
  //          container nodes: play a card and the next one is rendered into the
  //          same node, so a boolean "already done" flag would leave the old
  //          card's badge on the new card. A changed value redraws.
  //   spec   { text, color, title }, or null to mean "nothing to say here" --
  //          which also clears a badge left over from a previous occupant.
  //   place  'append' (last child -- for the image-only card containers) or
  //          'after' (next sibling -- for headings; putting a badge INSIDE a
  //          heading would corrupt wiki-links.js's textContent read of it).
  //   style  optional extra inline styles, e.g. to position an overlay.
  function attachBadge(host, opts) {
    const cls = opts.cls;
    // The flag records BOTH the value and whether a badge was drawn for it
    // ('+' / '-'). Storing only the value would make the clearing path
    // ("this card is known, but say nothing about it here") a no-op on a host
    // that already carries a badge for that same name -- which is exactly what
    // happens when a gate turns a feature off while its cards are on screen.
    const key = (opts.spec ? '+' : '-') + (opts.value == null ? '' : opts.value);
    if (host.dataset[opts.flag] === key) return;

    const inside = host.querySelector('.' + cls);
    if (inside && inside.parentNode === host) inside.remove();
    const next = host.nextElementSibling;
    if (next && next.classList && next.classList.contains(cls)) next.remove();

    host.dataset[opts.flag] = key;
    if (!opts.spec) return;

    const badge = makeBadge(opts.spec, cls);
    if (opts.style) Object.assign(badge.style, opts.style);
    if (opts.place === 'append') host.appendChild(badge);
    else host.after(badge);
  }

  // === shared: the opportunity hand ======================================
  //
  // Where an opportunity card's name can be read, in all three shapes. These
  // selectors are shared with wiki-links.js and verified there against real
  // game HTML -- the two files rise and fall together, so if one moves, fix
  // both. `visit(host, name, place, style)` is called once per card found.

  function eachCardName(visit) {
    // Full-width hand layout: the card is image-only, with NO heading anywhere,
    // and the name lives solely in `.hand__image`'s alt/aria-label -- so a
    // decoration has to be overlaid on the container. wiki-links.js already
    // owns this container's TOP-RIGHT corner, hence top-left here. Empty deck
    // slots render as `.card--empty` with no `.hand__card-container`, so they
    // fall out naturally.
    document.querySelectorAll('.hand__card-container').forEach(function (container) {
      const img = container.querySelector('.hand__image');
      const name = img && (img.getAttribute('alt') || img.getAttribute('aria-label'));
      if (!name || !name.trim()) return;
      if (getComputedStyle(container).position === 'static') container.style.position = 'relative';
      visit(container, name.trim(), 'append', {
        position: 'absolute', top: '2px', left: '2px', marginLeft: '0', zIndex: '5',
      });
    });

    // Compact (small-media) hand layout: here the card DOES have a title, a
    // bare `<h2 class="media__heading">` under `.hand .small-card__body`. The
    // `.hand` scope is what keeps this off the "Opportunity deck" label and the
    // other headings that share that class.
    document.querySelectorAll('.hand .small-card__body .media__heading').forEach(function (h) {
      const name = headingName(h);
      if (name) visit(h, name, 'after', null);
    });

    // The card you have opened -- the same heading as any opened storylet, and
    // worth decorating: that is the screen where you choose what to do with it.
    document.querySelectorAll('.storylet-root__heading').forEach(function (h) {
      const name = headingName(h);
      if (name) visit(h, name, 'after', null);
    });
  }

  // === feature: The Crowds of Spite card ratings =========================
  //
  // Rates the opportunity cards of The Crowds of Spite (the Pickpocket's
  // Promenade) by how many bonus Pickpocket's Trophies they pay.
  //
  // Nothing here is gated on "am I in the Crowds of Spite?", because there is
  // no verified selector for the area header. The card table IS the scope: a
  // card whose name isn't in it gets no badge, and the names in it ("A
  // mould-spangled curiosity shop", "A... pickpocket?", "Watchful Eyes")
  // belong to this one area. If a name ever collides with an unrelated
  // storylet elsewhere in London, gating is the fix -- not a shorter table.

  // From The Crowds of Spite (Guide) on fallenlondon.wiki. `bonus` is the
  // EXTRA Pickpocket's Trophies a successful pickpocket gives on top of the
  // trophies your base Shadowy earns you from the skill table -- it is the
  // number the badge shows. `null` means the card pays no trophies at all and
  // needs a word instead of a score (`badge`).
  //
  // `inferior` marks the two targets that draw from the *inferior* skill
  // table: their Shadowy-based trophies come off a shallower curve, so at most
  // Shadowy levels they pay one trophy less than every other card before their
  // bonus is even added. That is the difference the dagger on the badge flags.
  //
  // Every card gives Approaching your Destination +1 unless `pass`/`fail`/
  // `note` says otherwise; `pass` is the non-pickpocketing option, `fail` is
  // what a failed pickpocket costs.
  //
  // To add or correct a card: edit this array. Nothing else knows the names.
  const SPITE_CARDS = [
    {
      name: 'A drunk', shadowy: 3, bonus: 0, inferior: true,
      fail: 'Unseen -1',
    },
    {
      name: 'A mould-spangled curiosity shop', shadowy: 5, bonus: 1, inferior: true,
      pass: 'Window-shopping: Unseen +1, AYD -1',
      fail: 'Unseen -1',
      note: 'The only card in the area that can lower Approaching your Destination.',
    },
    {
      name: 'A Street Performer', shadowy: 5, bonus: 1,
      pass: 'Unseen +1', fail: 'Unseen -1',
    },
    {
      name: 'An Argument', shadowy: 10, bonus: 1,
      pass: 'Unseen +1', fail: 'Unseen -1',
    },
    {
      name: 'Gaoler', shadowy: 10, bonus: 1,
      fail: 'Unseen -1',
      note: 'The pickpocket also gives Nightmares.',
    },
    {
      name: 'The Costermonger', shadowy: 12, bonus: 1,
      fail: 'Unseen -1',
    },
    {
      name: 'The Rat-Catcher', shadowy: 12, bonus: null, badge: 'rats',
      fail: 'Unseen -1, Wounds +1 CP',
      note: 'No trophies. Gives Rat on a String +11 and Venge-Rat Corpse +1, ' +
            'and does not raise Approaching your Destination.',
    },
    {
      name: 'The Actress', shadowy: 15, bonus: 2,
      fail: 'Unseen -1',
    },
    {
      name: 'A Shopkeeper', shadowy: 20, bonus: 2,
      fail: 'Unseen -1',
    },
    {
      name: 'Watchful Eyes', shadowy: 30, bonus: null, badge: 'AYD!', warn: true,
      fail: 'Unseen -1',
      note: 'No trophies, and EVERY option gives AYD +2. Leave it in your hand ' +
            'unless you actually want the promenade to end.',
    },
    {
      name: 'A Constable!', shadowy: 30, bonus: 3,
      pass: 'AYD +2', fail: 'AYD +3, Unseen -2',
      note: 'The pickpocket itself gives AYD +2.',
    },
    {
      name: 'A Special Constable', shadowy: 40, bonus: 4,
      fail: 'AYD +2, Unseen -2',
    },
    {
      name: 'A... pickpocket?', shadowy: 50, bonus: 4,
      fail: "Pickpocket's Trophy -3",
    },
    {
      name: 'Jack!', shadowy: 60, bonus: 9,
      pass: 'AYD +3, Unseen +1', fail: 'Wounds +3 CP',
      note: 'The pickpocket gives AYD +2. A second option (Dangerous 100) pays no ' +
            'trophies but gives Unseen +1, a Touching Love Story and Urchin/' +
            'Constable favours, and leaves AYD alone.',
    },
    {
      name: 'The Opera Singer', shadowy: 60, bonus: 6, early: true,
      fail: 'Unseen -1',
    },
    {
      name: 'The Novelist', shadowy: 63, bonus: 7, early: true,
      fail: 'Unseen -1',
    },
    {
      name: 'The Confidence Artist', shadowy: 65, bonus: 8, early: true,
      fail: 'Unseen -1',
    },
  ];

  // Names are matched loosely: lowercased, with every run of non-alphanumerics
  // squashed to one space. That absorbs the punctuation the game and the wiki
  // can disagree about -- "A Constable!" / "A Constable", "A... pickpocket?" /
  // "A pickpocket" -- and the hyphen in "The Rat-Catcher". None of the squashed
  // keys collide with each other.
  function normalizeName(name) {
    return String(name == null ? '' : name)
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, ' ')
      .trim();
  }

  const SPITE_BY_NAME = new Map(
    SPITE_CARDS.map(function (c) { return [normalizeName(c.name), c]; }));

  function lookupSpiteCard(name) {
    return SPITE_BY_NAME.get(normalizeName(name)) || null;
  }

  // Grey at +0 through to gold at +9. The point of the colour is that a hand
  // can be read at a glance, without stopping to compare numbers.
  const RATING_COLORS = [
    '#6b6b6b', // +0
    '#7a5c3a', // +1
    '#8a6d3b', // +2
    '#78733a', // +3
    '#68763a', // +4
    '#54783e', // +5
    '#417a4c', // +6
    '#357a62', // +7
    '#2f7378', // +8
    '#b8912f', // +9
  ];
  const COLOR_NO_TROPHIES = '#3f5f8a'; // pays in something other than trophies
  const COLOR_WARN = '#8a3b3b';        // playing this is usually a mistake

  const SPITE_CLASS = 'fl-ux-spite';
  const SPITE_FLAG = 'flUxSpite';
  const INFERIOR_MARK = '†'; // dagger

  // What to draw for a card: the label, its colour and the tooltip. Kept pure
  // (card in, description out) so it can be unit-tested without a DOM.
  function spiteBadgeSpec(card) {
    const scored = typeof card.bonus === 'number';
    const text = scored
      ? '+' + card.bonus + (card.inferior ? INFERIOR_MARK : '')
      : (card.badge || '?');
    const color = card.warn
      ? COLOR_WARN
      : (scored ? (RATING_COLORS[card.bonus] || RATING_COLORS[0]) : COLOR_NO_TROPHIES);

    const lines = [card.name];
    lines.push(scored
      ? 'Bonus trophies: +' + card.bonus + ' (on top of what your base Shadowy gives)'
      : 'Bonus trophies: none');
    lines.push('Pickpocket challenge: Shadowy ' + card.shadowy);
    if (card.inferior) {
      lines.push(INFERIOR_MARK + ' Uses the INFERIOR skill table: the trophies your ' +
        'base Shadowy contributes come off a lower curve, costing you about one ' +
        'trophy compared with every other target.');
    }
    if (card.early) lines.push('Only appears while Approaching your Destination is below 5.');
    if (card.pass) lines.push('Pass by: ' + card.pass);
    if (card.fail) lines.push('Pickpocket failure: ' + card.fail);
    if (card.note) lines.push(card.note);
    lines.push('Unless stated otherwise, every action here gives AYD +1.');
    return { text: text, color: color, title: lines.join('\n') };
  }

  // The area gate. FL states the area in the screen-reader greeting on every
  // page, and during a promenade that greeting reads, verbatim:
  //
  //   "It's <name>! Welcome to The Crowds of Spite, delicious friend!"
  //
  // CONFIRMED in-game (2026-09-02), which is what let this be tightened from
  // "allow anything we don't recognise" to an exact list. It used to carry the
  // four route names (The Tenterhooks, Smashtile Alley, Blythenhale,
  // Strung-Up Street) as guesses at what the promenade might call itself, plus
  // a LONDON_ELSEWHERE deny-list to make the permissive default survivable.
  // Both are gone, on the evidence of the same capture: the accessible map
  // (`#accessible-sidebar .accessible-map-menu`) lists every area you can
  // reach, and it contains "Spite", "The Crowds of Spite" and "Area-Diving in
  // Spite" but NONE of the four route names -- so the routes are storylets
  // inside the area, not areas, and the greeting never names one.
  //
  // "Spite" is the parent area and is kept for the boundary either side of a
  // promenade; it costs nothing, since the cards only exist in the Crowds.
  const SPITE_AREAS = [
    'The Crowds of Spite',
    'Spite',
  ].map(normalizeName);

  // The one remaining fail-open: if the greeting can't be read at all -- FL
  // renamed the block, say -- fall back to allowing badges, since the card
  // table still scopes them and losing the feature outright is the worse
  // outcome. An area that IS readable and isn't ours now blocks, which is the
  // whole point of the tightening.
  function inCrowdsOfSpite() {
    const area = normalizeName(currentArea());
    if (!area) return true;
    return SPITE_AREAS.indexOf(area) !== -1;
  }

  function spiteCardRatings() {
    if (!inCrowdsOfSpite()) {
      // Clear any badge left over from before you walked out.
      eachCardName(function (host, name, place, style) {
        attachBadge(host, {
          cls: SPITE_CLASS, flag: SPITE_FLAG, value: name, spec: null,
          place: place, style: style,
        });
      });
      return;
    }
    eachCardName(function (host, name, place, style) {
      const card = lookupSpiteCard(name);
      attachBadge(host, {
        cls: SPITE_CLASS,
        flag: SPITE_FLAG,
        value: name,
        spec: card ? spiteBadgeSpec(card) : null,
        place: place,
        style: style,
      });
    });
  }

  // === shared: the launcher ==============================================
  //
  // A floating button, bottom-right, that opens a menu of reference PANELS.
  //
  // It is deliberately `position:fixed` on document.body rather than injected
  // into Fallen London's own header. There is no verified selector for the
  // header, and a floating button needs none -- it cannot be knocked out by a
  // React re-render, works in both the wide and the narrow layout, and can't
  // shove the game's own chrome around. If a header anchor is ever wanted,
  // `mountLauncher` is the only place that has to change.

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

  // A panel is a screen of its own behind the launcher menu. Add one by
  // pushing a { id, icon, label, hint, render } entry: `render()` returns the
  // element to show, and is called fresh on every open so a panel showing live
  // values never has to invalidate a cache.
  const PANELS = [
    {
      id: 'factions',
      icon: '⚔',
      label: 'Factions',
      hint: 'Renown, Favours, Renown items and each faction’s Faction Item',
      render: renderFactionsPanel,
    },
  ];

  function btnStyle(extra) {
    return Object.assign({
      display: 'block', width: '100%', textAlign: 'left', boxSizing: 'border-box',
      padding: '7px 12px', margin: '0', border: '0', background: 'transparent',
      color: UI.text, font: '13px ' + UI.font, cursor: 'pointer',
    }, extra || {});
  }

  function mountLauncher() {
    if (document.getElementById(LAUNCHER_ID)) return;

    const panelHost = h('div', {
      css: 'display:none;margin-bottom:8px;width:min(660px,calc(100vw - 32px));'
        + 'max-height:70vh;overflow:auto;background:' + UI.bg + ';color:' + UI.text
        + ';border:1px solid ' + UI.line + ';border-radius:4px;'
        + 'box-shadow:0 6px 24px rgba(0,0,0,.55);font:13px ' + UI.font + ';',
    });

    const menu = h('div', {
      css: 'display:none;margin-bottom:8px;min-width:230px;background:' + UI.bg
        + ';border:1px solid ' + UI.line + ';border-radius:4px;overflow:hidden;'
        + 'box-shadow:0 6px 24px rgba(0,0,0,.55);',
    }, PANELS.map(function (panel) {
      return h('button', {
        type: 'button',
        title: panel.hint || '',
        style: btnStyle(),
        on: {
          click: function () { closeMenu(); openPanel(panel); },
          mouseenter: function (e) { e.currentTarget.style.background = UI.bgAlt; },
          mouseleave: function (e) { e.currentTarget.style.background = 'transparent'; },
        },
      }, [panel.icon + '  ' + panel.label]);
    }));

    const button = h('button', {
      type: 'button',
      title: 'Fallen London UX Enhancers',
      css: 'align-self:flex-end;padding:10px 18px;border:1px solid ' + UI.line
        + ';border-radius:20px;background:' + UI.bg + ';color:' + UI.accent
        + ';font:bold 15px ' + UI.font + ';letter-spacing:.04em;cursor:pointer;'
        + 'box-shadow:0 2px 12px rgba(0,0,0,.55);',
      on: { click: toggleMenu },
    }, ['⚙ UX']);

    const root = h('div', {
      id: LAUNCHER_ID,
      css: 'position:fixed;right:16px;bottom:16px;z-index:99999;'
        + 'display:flex;flex-direction:column;align-items:flex-end;',
    }, [panelHost, menu, button]);

    function toggleMenu() {
      menu.style.display = menu.style.display === 'none' ? 'block' : 'none';
    }
    function closeMenu() { menu.style.display = 'none'; }
    function closePanel() {
      panelHost.style.display = 'none';
      panelHost.textContent = '';
    }
    // The header stays put and only the body is rebuilt, so a panel that
    // refreshes itself doesn't make the whole thing flicker or lose its
    // scroll position. `ctx.rerender()` is how a panel asks for that.
    function openPanel(panel) {
      panelHost.textContent = '';
      panelHost.appendChild(h('div', {
        css: 'position:sticky;top:0;display:flex;align-items:center;gap:8px;'
          + 'padding:8px 12px;background:' + UI.bg + ';border-bottom:1px solid ' + UI.line + ';',
      }, [
        h('span', { css: 'font:bold 14px ' + UI.font + ';color:' + UI.accent + ';flex:1;' },
          [panel.icon + '  ' + panel.label]),
        h('button', {
          type: 'button', title: 'Close',
          css: 'border:0;background:transparent;color:' + UI.dim
            + ';font:16px sans-serif;line-height:1;cursor:pointer;padding:0 2px;',
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
    document.addEventListener('click', function (e) {
      if (!root.contains(e.target)) closeMenu();
    });

    document.body.appendChild(root);
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
      if (!m) return null;
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

  function itemNameFromLabel(label) {
    return String(label || '').split(';')[0].replace(/\s*[×x]\s*\d+\s*$/, '').trim();
  }

  // Returns a Set of normalised item names, or null when this isn't the
  // Possessions tab. The null matters: the Myself tab has no
  // `[data-quality-id]` at all, so an empty result there would otherwise read
  // as "you own nothing".
  function readPossessions(doc) {
    const d = doc || document;
    const nodes = d.querySelectorAll(OWNED_MARKER);
    if (!nodes.length) return null;
    const owned = new Set();
    nodes.forEach(function (el) {
      const labelled = el.getAttribute('aria-label') != null ? el : el.querySelector('[aria-label]');
      const name = labelled && itemNameFromLabel(labelled.getAttribute('aria-label'));
      if (name) owned.add(normalizeName(name));
    });
    return owned;
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
      v: 1, at: Date.now(), character: characterName() || null,
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
      const rec = loadCache(ITEMS_KEY, 1);
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
            return items.owned.has(normalizeName(i.name));
          });
        }
        rec.hasItem = items.owned.has(normalizeName(faction.item.name));
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

  function refreshFactionState() {
    if (refreshing) return refreshing;
    refreshing = (async function () {
      let changed = false;
      // Sequential, not parallel: two copies of the SPA booting at once is a
      // lot of work for the browser, and nothing here is urgent.
      if (!readQualities()) {
        const scan = await loadInFrame('/myself', function (doc) {
          const got = readQualities(doc);
          // Wait for a list that actually has faction qualities in it -- a
          // half-rendered page can show a handful and would bank a page of
          // false zeroes otherwise.
          if (!got) return null;
          for (const key of got.values.keys()) {
            if (/^(Renown|Favours|Connected):/.test(key)) return got;
          }
          return null;
        });
        if (bankQualities(scan)) changed = true;
      }
      const here = readPossessions();
      if (!here || !here.size) {
        const owned = await loadInFrame('/possessions', function (doc) {
          const got = readPossessions(doc);
          return got && got.size > 20 ? got : null;
        });
        if (bankPossessions(owned)) changed = true;
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
      refreshFactionState().then(function () { ctx.rerender(); });
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
              refreshFactionState().then(function () { ctx.rerender(); });
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
    { name: 'spite-card-ratings', run: spiteCardRatings },
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

  scan();
  new MutationObserver(schedule).observe(document.body, { childList: true, subtree: true });
})();
