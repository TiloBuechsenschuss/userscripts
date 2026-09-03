// ==UserScript==
// @name         Fallen London UX Enhancers
// @author       Tilo
// @namespace    https://github.com/TiloBuechsenschuss
// @downloadURL  https://raw.githubusercontent.com/TiloBuechsenschuss/userscripts/refs/heads/main/FallenLondon/ux-enhancers.js
// @version      1.7
// @description  A grab-bag of small quality-of-life tweaks for Fallen London. (1) A "UX" button docked INTO Fallen London's own chrome beside its travel control -- under the big Travel button on the wide layout, as one more icon in the banner on the narrow one -- so it takes up space in the page like any other control and covers nothing. It opens a menu of reference panels; the last line of that menu switches it back to floating over the page if you preferred it that way, and it falls back to floating on its own if Fallen London's chrome cannot be found. The first panel is Factions, a table of every faction with your current Renown and Favours (read off the Myself tab and remembered, so it is there from anywhere in London), the three Renown items each unlocks at Renown 10/25/40, and the Faction Item that turns Favours into Renown, with where to buy it and what it costs. Renown and Favours come off the Myself tab and which items you hold off Possessions; both are remembered, and opening the panel refreshes them in the background. A Renown item you could go and collect right now -- Renown reached and the Favours in hand -- gets a filled "!" badge and is listed at the top; one whose Renown is high enough but whose Favours are still short gets an outlined "!"; and any faction whose Favours have hit the cap of 7 and are being thrown away is called out too. Each row has a "use" button that opens that faction's item on the Possessions tab so its options appear. (2) In The Crowds of Spite (the Pickpocket's Promenade) every opportunity card gets a rating badge showing the bonus Pickpocket's Trophies it pays on a successful pickpocket (+0 to +9), colour-coded from grey to gold, with a dagger when the card draws from the inferior skill table, and a tooltip carrying the Shadowy challenge, the pass-by option and what a failed pickpocket costs. Watchful Eyes and the Rat-Catcher, which give no trophies at all, are labelled instead of scored. (3) While zailing the Unterzee every opportunity card gets a badge showing what the best line you can take with nothing special in hand costs you in Troubled Waters, in change points, and whether it makes full progress, half, or none -- with a tooltip carrying every option on the card: its challenge, what it is gated on, what it gives, and what a failure costs. Black (urgent) cards are marked as the blockages they are. A second panel, Zailing, holds the numbers behind a voyage: how much Zailing... each route needs and roughly what that costs in actions per ship, the Zee Peril of every region, what Troubled Waters does at 7 and at 8 and which zee-threat turns it into which black card, where the safe docks are, the three winds and the dreams they start, and the whole card table, searchable. (4) During the Fruits of the Zee Festival every wreck-diving card gets a badge showing the Thalassic Favour its treasure trades for at the Fruit Market, coloured from grey to gold, with a star when the card also offers a rare item you have not got yet, a tick when you already hold everything it offers, and a question mark when your Possessions have not been read so neither can be claimed. Every value at this festival depends on how deep you are, so the badge quotes the figure for your depth when Full Fathom Five can be read or you set it in the panel, and otherwise shows the range across the depths rather than a number it cannot justify. A depth you set by hand is forgotten the moment you surface, so it can never quietly go wrong. A coral pays no Favour and is labelled instead, gold while any of the three items it turns into is still missing, with how many of that coral you are already carrying in brackets so two coral cards never read alike. The tooltip carries every claim the card offers at that depth, what it gives, and -- for a coral -- which band of Sights at the Festival yields which of the three. A third panel, Fruits of the Zee, is the checklist: how much Favour, Devotion, depth and Sights you have, and how many actions it takes to reach each Devotion level, which of the twenty-eight collectable items you are still missing (the fifteen coral items, the six that only turn up while diving, the six sold at the stalls and the Bride’s Litter-Cyst) and how to get each one, a depth-by-depth list of the unique rewards you have not got yet -- currency-only cards left out of it -- marking the ones a deeper dive would throw away, since a dive commits you to a depth and some rewards are only in the shallows, what your treasures and spare equipment would fetch if you traded them in, the whole card-by-depth table, and the stall price list marked with what you can afford. Anything you could collect right now -- a coral in hand while Sights sits in the right band, or an item you have the Favour for -- is called out at the top. On Supplication on the Shore itself, each option is badged in the game with the attribute its reward scales off -- every option pays the same Devotion, so that is the only thing separating them, and since which options you are offered depends on Airs of a Barren Zee (re-rolled every time you act) the useful question is which of the two or three in front of you right now matches your best stat. The two branches that raise no Devotion are labelled instead: the Custodial Chef as free, and the Fathomking’s servant as 7 Fate for a jump straight to Devotion 11. Built as a feature registry so further tweaks can be added as entries.
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
  // Two places say it, and both are verified against real markup.
  //
  // 1. The screen-reader-only block at the top of every page:
  //
  //      <div id="accessible-sidebar" class="accessible-sidebar u-visually-hidden">
  //        <h1 class="welcome"><span>It's <a href="/profile/TheFairUnknown">…</a>!</span>
  //         Welcome to Spite, delicious friend!</h1>
  //
  //    Verified identical on /myself and /possessions, in both the wide and
  //    the narrow layout, and it is there no matter which tab you are on --
  //    which is what makes it the primary. The area has to be dug out of the
  //    sentence, hence the regex.
  //
  // 2. The wide layout's VISIBLE greeting, in the sidebar's `div.travel`
  //    (captured 2026-09-03, on Mutton Island during the Fruits of the Zee):
  //
  //      <p class="heading heading--3"><span>It's <a …>TheFairUnknown</a>!</span>
  //        <br>Welcome to</p>
  //      <p class="heading heading--2 welcome__current-area">Mutton Island,</p>
  //      <p class="heading heading--3">delicious friend!</p>
  //
  //    Here the area sits in an element of its OWN, `.welcome__current-area`,
  //    with nothing to parse but a trailing comma -- so where the sentence in
  //    (1) is split across three paragraphs and its regex can't match, this
  //    still reads cleanly. It is the backstop rather than the primary only
  //    because it belongs to the wide layout's sidebar and nothing has
  //    confirmed it exists in the narrow one.
  function currentArea(doc) {
    const d = doc || document;
    const el = d.querySelector('#accessible-sidebar .welcome');
    const text = el ? el.textContent.replace(/\s+/g, ' ') : '';
    const m = text.match(/Welcome to (.+?),\s*delicious friend/i);
    if (m) return m[1].trim();

    const visible = d.querySelector('.welcome__current-area');
    // Trailing comma from "Mutton Island," -- and a trailing full stop or
    // exclamation mark too, since nothing promises the punctuation.
    const name = visible ? visible.textContent.replace(/\s+/g, ' ').trim().replace(/[,.;!]+$/, '').trim() : '';
    return name || null;
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

  // === feature: Zailing the Unterzee card ratings ========================
  //
  // Rates the opportunity cards you draw while zailing. Zailing is a race
  // between two numbers: Zailing... (progress towards your destination, 80 for
  // a direct route, 160 or 220 across regions) and Troubled Waters, which at 8
  // kills you. Zee cards are NOT discardable, so the only decision you ever
  // make out there is which of the cards in your hand to play next -- which is
  // exactly what a badge on each card can answer.
  //
  // Everything below is transcribed from Zailing (Guide) and from the
  // individual card and option pages under Category:Cards - Zailing the
  // Unterzee on fallenlondon.wiki. Where the guide's summary table and a
  // card's own page disagreed, the card page won (it is the page the wiki
  // keeps up to date): the guide says A Spit of Land's island stop is -2
  // Troubled Waters, its own option page says -1, and -1 is what is here.
  //
  // To add or correct a card: edit ZEE_CARDS. Nothing else knows the names.

  // How far you have to get, and roughly what that costs in actions. From the
  // guide's "Gaining progress" table. Most options give Zailing Speed + 1-5,
  // and a failure usually gives half of that.
  const ZEE_ROUTES = [
    { name: 'Direct route', of: 'a destination in the region you are already in', need: 80, tramp: '2', other: '1.5', clipper: '1.5, rarely 1' },
    { name: 'Along the currents', of: 'a region reached the way the currents run (anticlockwise)', need: 160, tramp: '3.5', other: '3', clipper: '2.5, rarely 2' },
    { name: 'Through the Snares', of: 'the shortcut across the middle; needs Zeefaring 3', need: 160, tramp: '3.5', other: '3', clipper: '2.5, rarely 2' },
    { name: 'Against the currents', of: 'a region reached the wrong way round', need: 220, tramp: '5', other: '4', clipper: '3' },
  ];

  // Zee Peril per region: the difficulty of every broad challenge out there.
  // The narrow column is what a skill challenge (Zeefaring, Shapeling Arts...)
  // scales to; the Zeefaring checks on the non-piracy cards do not scale.
  const ZEE_REGIONS = [
    { name: 'Home Waters', peril: 100, narrow: 3, note: 'London and Mutton Island are here' },
    { name: "Shepherd's Wash", peril: 110, narrow: 3, note: 'Southern Wind is found here' },
    { name: 'Stormbones', peril: 110, narrow: 3, note: 'Northern Wind is found here' },
    { name: 'The Sea of Voices', peril: 150, narrow: 5, note: 'passing by discovers Mangrove College' },
    { name: 'The Salt Steppe', peril: 200, narrow: 9, note: 'Eastern Wind is found here; passing by discovers the Khanate' },
    { name: 'The Pillared Sea', peril: 210, narrow: 9, note: 'passing by discovers Irem' },
    { name: 'The Snares', peril: 250, narrow: 12, note: 'needs Zeefaring 3; passing by discovers Corsair’s Forest' },
  ];

  // The six zee-threats. Each one on its own does little; each one TOGETHER
  // with Troubled Waters 7 puts its own black card in your hand, and black
  // cards are urgent, so they crowd out everything else until you clear them.
  const ZEE_MENACES = [
    { name: 'Rumbling Stomachs', from: 'your crew going hungry', card: 'A Worrying Appetite' },
    { name: 'Silent Stalker', from: 'zee-monsters noticing you', card: 'Signs of Pursuit' },
    { name: 'Creeping Fear', from: 'frightening your crew', card: 'A Growing Concern' },
    { name: 'Groaning Hull', from: 'damaging the ship', card: 'Taking in Water' },
    { name: 'Mutinous Whispers', from: 'disrespecting your crew', card: 'Signs of Disloyalty' },
    { name: 'Unwelcome on the Waters', from: 'failed piracy', card: 'Zeeborne Pariahs' },
  ];

  // Safe docks: arriving at one wipes Troubled Waters and every zee-threat
  // (not Wounds or Nightmares). From the guide's location table -- note that
  // being a port is not the same as being safe: Port Cecil, Godfall, Irem,
  // Gaider's Mourn and Tanah-Chook are all ports and none of them is a reset.
  const ZEE_SAFE_DOCKS = [
    { region: 'Home Waters', names: ['Wolfstack Docks (London)', 'Mutton Island'] },
    { region: "Shepherd's Wash", names: ['The Convent (Abbey Rock)', 'The Court of the Wakeful Eye', 'Heartscross House (Port Carnelian)', 'Apis Meet (Fate)'] },
    { region: 'The Sea of Voices', names: ['Polythreme Docks'] },
    { region: 'The Salt Steppe', names: ['The Copper Quarter (Khan’s Heart)'] },
    { region: 'Stormbones', names: ['The Chapel of Lights — which puts you in Your Lodgings'] },
    { region: 'The Pillared Sea', names: ['none'] },
    { region: 'The Snares', names: ['none'] },
  ];

  // The three winds, each of which starts a dream storyline back in London.
  const ZEE_WINDS = [
    { name: 'Southern Wind', where: "Shepherd's Wash", card: 'The Light of the Mountain', dream: 'I Shot the Albatross', cost: '15 CP of Nightmares over 11 cards' },
    { name: 'Northern Wind', where: 'Stormbones', card: 'A Wind from the North', dream: 'Betwixt Us and the Sun', cost: '16-19 CP of Nightmares over 11 cards' },
    { name: 'Eastern Wind', where: 'The Salt Steppe', card: 'A Distant Gleam', dream: 'Upon a Painted Sea', cost: 'no Nightmares at all, over 11 cards' },
  ];

  // --- the cards ---------------------------------------------------------
  //
  // Each entry is one opportunity card:
  //
  //   where      'any' (drawn in every region) or the regions it belongs to.
  //   freq       the wiki's Frequency. 'High Urgency' is a black/sinister
  //              card: urgent, so it is dealt before anything else.
  //   urgent     set on those, because it changes how the badge reads -- an
  //              urgent card is not a choice, it is a blockage.
  //   strictZee  only badge this card when the area actually reads as a zee
  //              region (see inZee below). Exactly one card needs it.
  //   prefix     match on the card's opening words instead of the whole name,
  //              for the two piracy cards whose title carries your quarry's
  //              ship type.
  //   cardNeeds  what has to be true for the card to be in your deck at all.
  //
  // and each option:
  //
  //   ch     the challenge, if any. A broad one ("Watchful vs Zee Peril") is
  //          against the region's Zee Peril, so it gets harder the further
  //          out you are; a narrow one ("Zeefaring 5") mostly does not.
  //   need   what the option is gated on. `piracy` marks the ones gated on
  //          Corsair's Colours or a bounty -- a whole separate game the
  //          Zailing guide deliberately does not cover.
  //   hidden the option disappears when this is true.
  //   tw     Troubled Waters change in CP on a success (or outright, for an
  //          option with no challenge). `twRange` keeps the wiki's wording
  //          when it recorded a range, `twText` when it sets a level instead.
  //   prog   Zailing progress as a multiple of your Zailing Speed: 1, 0.5, 0
  //          for none, and 'flat80' for the one option in the whole deck that
  //          ignores your ship and simply hands you 80.
  //   fail   what a failed challenge costs. `rare` is the rare success.
  const ZEE_CARDS = [
    // --- Drawn anywhere at zee ---
    {
      name: 'A Blank Space on the Charts',
      where: ['any'],
      freq: 'High Urgency',
      urgent: true,
      cardNeeds: 'Troubled Waters 7, Zailing... 60',
      note: 'Black card: drawn at Troubled Waters 7 whatever your other menaces are.',
      opts: [
        { text: 'There\'s an island here', ch: 'Luck 50%', tw: -5, prog: 0, men: 'Creeping Fear', fail: 'Troubled Waters set to 4, no progress, Creeping Fear, Nightmares +3' },
        { text: 'Fortuitous fragments', need: 'Partial Map 2 x', tw: null, twText: 'Troubled Waters set to 5', prog: 0, gain: 'costs Partial Map 2' },
        { text: 'Search the uncharted waters for your quarry', ch: 'Zeefaring 6', need: 'Chasing Down Your Bounty, Corsair\'s Colours 2', tw: -1, prog: 1, gain: 'Chasing Down Your Bounty', rare: 'TW -2-6, full speed', fail: 'TW -5, half speed, Creeping Fear', piracy: true },
      ],
    },
    {
      name: 'A Bounty Upon Your Head',
      where: ['any'],
      freq: 'Standard',
      cardNeeds: 'Corsair\'s Colours 2, Chasing Down Your Bounty',
      opts: [
        { text: 'Open fire!', ch: 'Zeefaring 13', tw: 5, prog: 1, gain: 'Pieces of Plunder Weighing Down Your Hold [See below]', rare: 'TW +3, full speed', fail: 'TW +12, half speed, Unwelcome on the Waters', piracy: true },
        { text: 'Signal the HMS Ramillies for support', ch: 'Zeefaring 11', need: 'The Crew of HMS Ramillies', tw: 5, prog: 1, gain: 'Pieces of Plunder Weighing Down Your Hold [See below]', rare: 'TW +3, full speed', fail: 'TW +12, half speed, Unwelcome on the Waters', piracy: true },
        { text: 'Evade them!', ch: 'Zailing Speed vs Zee Peril', tw: 2, twRange: '+2-3', prog: 1, fail: 'TW +8, full speed, Unwelcome on the Waters', piracy: true },
      ],
    },
    {
      name: 'A Corvette of Her Majesty\'s Navy',
      where: ['any'],
      freq: 'Standard',
      note: 'The semaphore line is full speed for -2 Troubled Waters, but it is hidden above Suspicion 5. Flying Corsair\'s Colours replaces the card with a piracy version.',
      opts: [
        { text: 'Exchange pleasantries via semaphore', hidden: 'Suspicion 5, Corsair\'s Colours 2', tw: -2, prog: 1 },
        { text: 'They\'re not slowing', ch: 'Zailing Speed vs Zee Peril', need: 'Suspicion 5', tw: 3, prog: 1, men: 'Suspicion +3', fail: 'TW +9, full speed, Silent Stalker' },
        { text: 'Rely on the Commodore\'s old codes', ch: 'A Player of Chess 5', need: 'Overworked Commodore 1 x, A Player of Chess', tw: null, twText: 'Troubled Waters falls by an amount the wiki does not record', prog: 1, men: 'clears Suspicion -3', fail: 'TW +8, full speed, Suspicion +4' },
        { text: 'Exchange information via semaphore', ch: 'Persuasive vs Zee Peril', need: 'Chasing Down Your Bounty', tw: -2, prog: 1, gain: 'Chasing Down Your Bounty +8', fail: 'TW +6, half speed, Suspicion +2, Unwelcome on the Waters', piracy: true },
        { text: 'Take them for all they\'ve got', ch: 'Zeefaring 5', need: 'Corsair\'s Colours 2', tw: 4, prog: 1, men: 'Suspicion +1, Unwelcome on the Waters', gain: 'Pieces of Plunder Weighing Down Your Hold 250', rare: 'TW +4, full speed', fail: 'TW +8, half speed, Suspicion +4, Unwelcome on the Waters', piracy: true },
      ],
    },
    {
      name: 'A Dream of a Cup',
      where: ['any'],
      freq: 'Infrequent',
      cardNeeds: 'Delighted, Nightmares',
      opts: [
        { text: 'Drink the wine', need: 'Having Recurring Dreams: Rosy Colours Leaping on the Wall exactly 6', tw: 0, prog: 0, men: 'Nightmares +3', gain: 'Having Recurring Dreams: Rosy Colours Leaping on the Wall +4' },
        { text: 'Awaken from a familiar dream', need: 'Still Waiting on the Host', tw: 0, prog: 0, men: 'clears Nightmares -3', gain: 'costs Having Recurring Dreams: Rosy Colours Leaping on the Wall' },
      ],
    },
    {
      name: 'A Dream of a Table',
      where: ['any'],
      freq: 'Infrequent',
      cardNeeds: 'Delighted, Nightmares',
      opts: [
        { text: 'Join them at their table', need: 'Having Recurring Dreams: Rosy Colours Leaping on the Wall exactly 5', tw: 0, prog: 0, men: 'Nightmares +3', gain: 'Having Recurring Dreams: Rosy Colours Leaping on the Wall +6' },
        { text: 'Awaken from a familiar dream', need: 'Still Waiting on the Host', tw: 0, prog: 0, men: 'clears Nightmares -3', gain: 'costs Having Recurring Dreams: Rosy Colours Leaping on the Wall' },
      ],
    },
    {
      name: 'A Dream of Ascent',
      where: ['any'],
      freq: 'Infrequent',
      cardNeeds: 'Delighted, Nightmares',
      opts: [
        { text: 'Fly higher', need: 'Having Recurring Dreams: Rosy Colours Leaping on the Wall exactly 4', tw: 0, prog: 0, men: 'Nightmares +3', gain: 'Having Recurring Dreams: Rosy Colours Leaping on the Wall +5' },
        { text: 'Awaken from a familiar dream', need: 'Still Waiting on the Host', tw: 0, prog: 0, men: 'clears Nightmares -3', gain: 'costs Having Recurring Dreams: Rosy Colours Leaping on the Wall' },
      ],
    },
    {
      name: 'A Dream of Designs',
      where: ['any'],
      freq: 'Infrequent',
      cardNeeds: 'Delighted, Nightmares',
      opts: [
        { text: 'Sunbathe in the light', need: 'Having Recurring Dreams: Rosy Colours Leaping on the Wall exactly 7', tw: 0, prog: 0, men: 'Nightmares +3', gain: 'Still Waiting on the Host, Whirring Contraption 11, Whirring Contraption 4' },
        { text: 'Awaken from a familiar dream', need: 'Still Waiting on the Host', tw: 0, prog: 0, men: 'clears Nightmares -3', gain: 'costs Having Recurring Dreams: Rosy Colours Leaping on the Wall' },
      ],
    },
    {
      name: 'A Dream of Stained-Glass',
      where: ['any'],
      freq: 'Infrequent',
      cardNeeds: 'Delighted, Nightmares',
      opts: [
        { text: 'Look into the light', need: 'Having Recurring Dreams: Rosy Colours Leaping on the Wall 1-2', tw: 0, prog: 0, men: 'Nightmares +2', gain: 'Having Recurring Dreams: Rosy Colours Leaping on the Wall +3' },
        { text: 'Awaken from a familiar dream', need: 'Still Waiting on the Host', tw: 0, prog: 0, men: 'clears Nightmares -3', gain: 'costs Having Recurring Dreams: Rosy Colours Leaping on the Wall' },
      ],
    },
    {
      name: 'A Dream of Sunbeams',
      where: ['any'],
      freq: 'Infrequent',
      cardNeeds: 'Delighted, Nightmares',
      opts: [
        { text: 'Stare through the glare', need: 'Having Recurring Dreams: Rosy Colours Leaping on the Wall exactly 0', tw: 0, prog: 0, men: 'Nightmares +2', gain: 'Having Recurring Dreams: Rosy Colours Leaping on the Wall +3' },
        { text: 'Awaken from a familiar dream', need: 'Still Waiting on the Host', tw: 0, prog: 0, men: 'clears Nightmares -3', gain: 'costs Having Recurring Dreams: Rosy Colours Leaping on the Wall' },
      ],
    },
    {
      name: 'A Flock of Prophets',
      where: ['any'],
      freq: 'Standard',
      cardNeeds: 'Chasing Down Your Bounty, Corsair\'s Colours 2',
      opts: [
        { text: 'Take auspices', ch: 'Zeefaring 13', tw: 4, prog: 1, gain: 'Chasing Down Your Bounty [See below]', rare: 'full speed', fail: 'TW +10, half speed', piracy: true },
        { text: 'Zail around them', tw: 2, prog: 1, piracy: true },
      ],
    },
    {
      name: 'A Giant Angler Crab',
      where: ['any'],
      freq: 'Infrequent',
      note: '"Ready the guns" is the good line if you have Monstrous Anatomy 3 - full speed and -2 Troubled Waters.',
      opts: [
        { text: 'Full reverse! Turn us away!', ch: 'Shadowy vs Zee Peril', tw: 0, prog: 0.5, fail: 'TW +8, half speed, Silent Stalker' },
        { text: 'Ready the guns and fire at its soft spots', ch: 'Monstrous Anatomy 3', tw: -2, prog: 1, fail: 'TW +8, no progress, Silent Stalker 1' },
        { text: 'Pursue it to its spawning grounds', ch: 'Shadowy vs Zee Peril', need: 'Zailing to Destination: Angler Crab Spawning Grounds', tw: 2, prog: 1, note: 'Zailing Speed + a flat 11 rather than the usual +1-5.', fail: 'TW +2, half speed' },
        { text: 'Reach for your harpoon; call for ramming speed!', need: 'A Notched Bone Harpoon', tw: 1, prog: 0, men: 'clears Rumbling Stomachs', gain: 'Deep-zee Catch 5' },
      ],
    },
    {
      name: 'A Growing Concern',
      where: ['any'],
      freq: 'High Urgency',
      urgent: true,
      cardNeeds: 'Troubled Waters 7, Creeping Fear',
      note: 'Black card: Troubled Waters 7 plus Creeping Fear.',
      opts: [
        { text: 'Investigate', ch: 'Luck 50%', tw: -5, prog: 0, fail: 'Troubled Waters set to 5, no progress, Nightmares +8' },
        { text: 'Double the zailors\' rations', need: 'Crate of Incorruptible Biscuits 1 x, Foxfire Candle Stub 100 x, Bottle of Greyfields 1882 100 x', tw: null, twText: 'Troubled Waters set to 5', prog: 0, men: 'Rumbling Stomachs', gain: 'costs Crate of Incorruptible Biscuits 1, costs Foxfire Candle Stub 100, costs Bottle of Greyfields 1882 100' },
      ],
    },
    {
      name: 'A Huge Terrible Beast of the Unterzee!',
      where: ['any'],
      freq: 'Infrequent',
      note: 'Both lines leave your crew with Rumbling Stomachs, which is one of the six menaces that turns Troubled Waters 7 into a black card.',
      opts: [
        { text: 'Delicious, delicious lumps', ch: 'Dangerous vs Zee Peril', tw: 0, prog: 1, men: 'Rumbling Stomachs', gain: 'Appalling Secret 2, Unaccountably Peckish 1, Someone Is Coming +1, Tale of Terror!! 4', fail: 'TW +10, no progress, Rumbling Stomachs' },
        { text: 'Steam on by', tw: 3, twRange: '+3-5', prog: 1, men: 'Silent Stalker' },
      ],
    },
    {
      name: 'A Message in a Bottle',
      where: ['any'],
      freq: 'Very Infrequent',
      cardNeeds: 'Corsair\'s Colours',
      opts: [
        { text: 'Unfurl the paper', tw: 0, prog: 0, gain: 'Directions to a Hidden Stash for one of eight ports', piracy: true },
      ],
    },
    {
      name: 'A Navigation Error',
      where: ['any'],
      freq: 'Infrequent',
      note: 'A success on any of the first three lines is full speed for no Troubled Waters; the failures cost +8 or +9 and half the progress.',
      opts: [
        { text: 'Correct your course', ch: 'Watchful vs Zee Peril', tw: 0, prog: 1, gain: 'Map Scrap 10', fail: 'TW +8, half speed' },
        { text: 'Listen to the Zee', ch: 'Zeefaring 5', need: 'Zeefaring', tw: 0, prog: 1, gain: 'Map Scrap 12', fail: 'TW +9, half speed' },
        { text: 'Consider what you learned from the Starved Men', ch: 'Watchful vs Zee Peril', need: 'Written in the Glim (Quality) 3000', tw: 0, prog: 1, gain: 'Map Scrap 13', fail: 'TW +9, half speed' },
        { text: 'Let your own star guide you', ch: 'Persuasive vs Zee Peril', need: 'A False-Star of your Own', tw: -5, prog: 1, fail: 'full speed' },
        { text: 'Use your disorientation to your advantage', ch: 'Zeefaring 5', need: 'Chasing Down Your Bounty, Corsair\'s Colours 2', tw: 2, twRange: '+2-3', prog: 1, gain: 'Chasing Down Your Bounty [See below]', rare: 'TW -1, full speed', fail: 'TW +8, full speed', piracy: true },
      ],
    },
    {
      name: 'A Promising Wreck',
      where: ['any'],
      freq: 'Standard',
      cardNeeds: 'Corsair\'s Colours 2',
      opts: [
        { text: 'Dive for salvage', ch: 'Zeefaring 13', tw: 2, prog: 1, gain: 'Pieces of Plunder Weighing Down Your Hold [see below], Unprovenanced Artefact 1', rare: 'full speed', fail: 'TW +8, half speed, Creeping Fear', piracy: true },
        { text: 'Zail on by', tw: 4, prog: 1, piracy: true },
      ],
    },
    {
      name: 'A Ragtag Flotilla',
      where: ['any'],
      freq: 'Standard',
      cardNeeds: 'Remaining Mass of the Ravenous Lifeberg',
      note: 'Only appears while a Ravenous Lifeberg is loose in the world.',
      opts: [
        { text: 'Hail a ship and inquire about their purpose', tw: -2, prog: 0.5, gain: 'Tale of Terror!! 1' },
        { text: 'Steam on by', tw: 4, prog: 1 },
      ],
    },
    {
      name: 'A Ship of Zealots',
      where: ['any'],
      freq: 'Infrequent',
      cardNeeds: 'Troubled Waters 4-7',
      note: 'Only drawn at Troubled Waters 4-7.',
      opts: [
        { text: 'See them off', ch: 'Dangerous vs Zee Peril', tw: 2, prog: 1, fail: 'TW +10, full speed' },
        { text: 'Race away from these lunatics', need: 'Zailing Speed 75', tw: 1, prog: 1 },
        { text: 'Preach a variant creed', ch: 'Mithridacy 3', tw: 2, prog: 1, fail: 'TW +10, half speed' },
        { text: 'Signal your experience on the Samaritan', need: 'The Banker\'s Daughter', tw: 2, prog: 1 },
        { text: 'Send them down to the Fathomking\'s court', ch: 'Zeefaring 5', need: 'Corsair\'s Colours 2', tw: 2, prog: 1, gain: 'Pieces of Plunder Weighing Down Your Hold [See below], Pieces of Plunder Weighing Down Your Hold [See below]', fail: 'TW +8, half speed', piracy: true },
      ],
    },
    {
      name: 'A Sighting of the (Bounty)',
      prefix: 'A Sighting of the',
      where: ['any'],
      freq: 'Standard',
      cardNeeds: 'Chasing Down Your Bounty, Corsair\'s Colours 2',
      note: 'Piracy card. In game the name carries your quarry\'s ship type in place of "(Bounty)", so it is matched on its opening words.',
      opts: [
        { text: 'Follow that ship!', ch: 'Zeefaring 13', tw: 4, prog: 1, gain: 'Chasing Down Your Bounty [See below]', rare: 'TW +2, full speed', fail: 'TW +10, half speed', piracy: true },
        { text: 'Let them pass over the horizon', tw: 6, prog: 1, piracy: true },
      ],
    },
    {
      name: 'A Spit of Land',
      where: ['any'],
      freq: 'Infrequent',
      note: 'A coin flip: -1 Troubled Waters at half speed, or +8 at half speed.',
      opts: [
        { text: 'Steam on by', hidden: 'Rumbling Stomachs', tw: 1, prog: 1 },
        { text: 'Stop briefly at the island', ch: 'Luck 50%', tw: -1, twFail: 8, prog: 0.5, fail: 'TW +8, half speed' },
        { text: 'Stop at the behest of your crew', need: 'Shipful of Schemers', tw: 1, prog: 0.5, gain: 'Vienna Opening 1' },
        { text: 'The Heart\'s suggestion', need: 'The Cladery Heart', tw: -1, prog: 1, gain: 'Tin of Zzoup 1' },
      ],
    },
    {
      name: 'A Wily Zailor',
      where: ['any'],
      freq: 'Standard',
      cardNeeds: 'An Experienced Zailor:',
      note: 'Not an ordinary voyage: this card belongs to a journey measured in Approaching Journey\'s End rather than Zailing..., so it makes no Zailing progress.',
      opts: [
        { text: 'Zail around the Pelagic Upheavals', tw: 4, prog: 0, gain: 'Approaching Journey\'s End +6' },
        { text: 'Skirt the Howling Shoals', need: 'An Experienced Zailor: A Well-Known Navigator', tw: 4, prog: 0, gain: 'Approaching Journey\'s End +7' },
        { text: 'Steam straight through the Beechey Currents', need: 'An Experienced Zailor: A Zee-Voyager of Note', tw: 4, prog: 0, gain: 'Approaching Journey\'s End +8, Zee-Ztory 1' },
        { text: '"I\'ll be in my bunk." (8 FATE)', need: 'An Experienced Zailor: A Seasoned Captain, A Well-Known Navigator or A Zee-Voyager of Note', tw: 0, prog: 0 },
      ],
    },
    {
      name: 'A Worrying Appetite',
      where: ['any'],
      freq: 'High Urgency',
      urgent: true,
      cardNeeds: 'Troubled Waters 7, Rumbling Stomachs',
      note: 'Black card: Troubled Waters 7 plus Rumbling Stomachs. The one black-card option that raises Troubled Waters instead of lowering it is "You, too, have an appetite".',
      opts: [
        { text: 'Scour the hold for anything edible', ch: 'Luck 50%', tw: -5, twFail: 10, prog: 0, fail: 'TW +10, no progress, Nightmares +8' },
        { text: 'You, too, have an appetite', need: 'Unaccountably Peckish 1', tw: 2, prog: 0, men: 'Nightmares +1, clears Rumbling Stomachs', gain: 'Unaccountably Peckish 1' },
      ],
    },
    {
      name: 'An Architect\'s Dream',
      where: ['any'],
      freq: 'Infrequent',
      cardNeeds: 'Delighted, Nightmares',
      opts: [
        { text: 'Hand him a hammer', need: 'Having Recurring Dreams: Rosy Colours Leaping on the Wall exactly 3', tw: 0, prog: 0, men: 'Nightmares +2', gain: 'Having Recurring Dreams: Rosy Colours Leaping on the Wall +4' },
        { text: 'Awaken from a familiar dream', need: 'Still Waiting on the Host', tw: 0, prog: 0, men: 'clears Nightmares -3', gain: 'costs Having Recurring Dreams: Rosy Colours Leaping on the Wall' },
      ],
    },
    {
      name: 'Bearing Witness to a Pilgrimage',
      where: ['any'],
      freq: 'Standard',
      cardNeeds: 'The Midnight Whale: Distance from the Gant Pole 1000',
      opts: [
        { text: 'Hail a passing steamship', tw: 0, prog: 0.5, gain: 'Romantic Notion 25' },
        { text: 'Steam on by', tw: 4, prog: 1, note: 'Full Zailing Speed, but without the usual +1-5 bonus.' },
      ],
    },
    {
      name: 'Cornering the (Bounty) at Last',
      prefix: 'Cornering the',
      where: ['any'],
      freq: 'High Urgency',
      urgent: true,
      cardNeeds: 'Chasing Down Your Bounty 15',
      note: 'Piracy card. In game the name carries your quarry\'s ship type in place of "(Bounty)", so it is matched on its opening words.',
      opts: [
        { text: 'Strike them down', ch: 'Zeefaring 11', need: 'Chosen Bounty Ship Type 100', tw: 3, prog: 0, gain: 'A Prolific Pirate 1, costs Chasing Down Your Bounty, Pieces of Plunder Weighing Down Your Hold [See below], In Pursuit of Wrack-Iron 1', fail: 'TW +12, no progress, Unwelcome on the Waters', piracy: true },
        { text: 'Call off the approach', tw: -7, prog: 0, men: 'Wounds +2', gain: 'costs Chasing Down Your Bounty', piracy: true },
      ],
    },
    {
      name: 'Creaking from Above',
      where: ['any'],
      freq: 'Standard',
      opts: [
        { text: 'Glim-fall!', ch: 'Luck 50%', tw: 2, twFail: 9, prog: 1, men: 'Silent Stalker', gain: 'Shard of Glim (2 x Zee Peril), Someone Is Coming +1', fail: 'TW +9, full speed, Silent Stalker' },
      ],
    },
    {
      name: 'Passing a Lightship',
      where: ['any'],
      freq: 'Infrequent',
      note: '"Zail on" is a rare thing: full speed for no Troubled Waters at all, with no challenge.',
      opts: [
        { text: 'Stop and exchange news', need: 'Zee-Ztory 7 x', tw: 0, prog: 0, gain: 'costs Zee-Ztory 7, Tale of Terror!! 2-10, Scrap of Incendiary Gossip 1-10' },
        { text: 'Zail on', tw: 0, prog: 1 },
        { text: 'Stop and exchange news', ch: 'Shadowy vs Zee Peril', need: 'Chasing Down Your Bounty, Corsair\'s Colours 2', tw: 0, prog: 1, gain: 'Chasing Down Your Bounty [See below]', fail: 'TW +7, half speed, Unwelcome on the Waters', piracy: true },
      ],
    },
    {
      name: 'Rats in the hold',
      where: ['any'],
      freq: 'Infrequent',
      opts: [
        { text: 'Negotiate with them', ch: 'Persuasive vs Zee Peril', tw: 0, prog: 1, fail: 'TW +8, full speed, Creeping Fear' },
        { text: 'Fill the hold with traps', ch: 'Dangerous vs Zee Peril', tw: 2, prog: 1, gain: 'Rat on a String 50', fail: 'TW +8, full speed, Mutinous Whispers' },
        { text: 'Permit Blackpelt to deal with them', need: 'Blackpelt, Venge-Pirate', tw: 0, prog: 1, gain: 'Rat on a String 4, Maniac\'s Prayer 13' },
        { text: 'Go on a rat-catching expedition', need: 'A Notched Bone Harpoon or Ratting Piece', tw: 0, prog: 1, gain: 'Rat on a String 100' },
        { text: 'Question them about other ships', ch: 'Dangerous vs Zee Peril', need: 'Chasing Down Your Bounty, Corsair\'s Colours 2', tw: 3, prog: 1, gain: 'Chasing Down Your Bounty [See below]', rare: 'TW +2-3, full speed', fail: 'TW +6, full speed', piracy: true },
      ],
    },
    {
      name: 'Share your Research with a Fellow Scholar',
      where: ['any', 'The Sea of Voices'],
      freq: 'Infrequent',
      cardNeeds: 'Embarking on a Voyage of Scientific Discovery 3',
      note: 'Belongs to a journey measured in Approaching Journey\'s End rather than Zailing...',
      opts: [
        { text: 'Correspond with a Fellow Scholar', need: 'Sulky Bat 10 x, Page of Cryptopalaeontological Notes 50 x, Page of Prelapsarian Archaeological Notes 50 x, Page of Theosophistical Notes 50 x, Embarking on a Voyage of Scientific Discovery 3', tw: 2, prog: 0, gain: 'Approaching Journey\'s End +3, 20 of each Page of Notes, Sulky Bat 4-8' },
      ],
    },
    {
      name: 'Signs of Disloyalty',
      where: ['any'],
      freq: 'High Urgency',
      urgent: true,
      cardNeeds: 'Troubled Waters 7, Mutinous Whispers',
      note: 'Black card: Troubled Waters 7 plus Mutinous Whispers.',
      opts: [
        { text: 'A few private conversations', ch: 'Luck 50%', tw: -5, twFail: 2, prog: 0.5, fail: 'TW +2, half speed' },
        { text: 'Double their pay', need: 'Shard of Glim 250 x, Moon-Pearl 250 x', tw: null, twText: 'Troubled Waters set to 5', prog: 0, gain: 'costs Shard of Glim 250, costs Moon-Pearl 250' },
        { text: 'Remind them of their right and proper duty', ch: 'Persuasive vs Zee Peril', need: 'Most Presentable Company', tw: null, twText: 'Troubled Waters set to 5', prog: 0.5, fail: 'TW +2, half speed' },
        { text: 'Put your money where your mouth is', ch: 'Luck 40%', need: 'High-Rolling Rantipoles, Corsair\'s Colours 2, Pieces of Plunder Weighing Down Your Hold 500 x', tw: -2, prog: 0.5, gain: 'Pieces of Plunder Weighing Down Your Hold 550', fail: 'Troubled Waters set to 5, half speed, clears Mutinous Whispers', piracy: true },
      ],
    },
    {
      name: 'Signs of Pursuit',
      where: ['any'],
      freq: 'High Urgency',
      urgent: true,
      cardNeeds: 'Troubled Waters 7, Silent Stalker',
      note: 'Black card: Troubled Waters 7 plus Silent Stalker. Its challenge is Dangerous against a difficulty well above Zee Peril.',
      opts: [
        { text: 'Turn around and confront it', ch: 'Dangerous vs Zee Peril', tw: -5, prog: 0.5, fail: 'Troubled Waters set to 5, no progress, clears Silent Stalker, Groaning Hull' },
        { text: 'Throw bait overboard', need: 'Deep-zee Catch 10 x', hidden: 'Rumbling Stomachs', tw: null, twText: 'Troubled Waters set to 5', prog: 0, men: 'Rumbling Stomachs', gain: 'costs Deep-zee Catch 10' },
      ],
    },
    {
      name: 'Spiralling Into Sorrow',
      where: ['any'],
      freq: 'Frequent',
      cardNeeds: 'Associating with a Youthful Naturalist exactly 590, Spiralling Regrets',
      opts: [
        { text: 'Dive with the (diving-bell)', need: 'Appalling Secret', hidden: 'Wounds, A Consignment of Capricious Cargo', tw: null, twText: 'Troubled Waters set to 0', prog: 0, gain: 'Associating with a Youthful Naturalist, Shard of Glim 777, costs Zee Peril' },
      ],
    },
    {
      name: 'Submerge',
      where: ['any', 'The Sea of Voices'],
      freq: 'Standard',
      cardNeeds: 'Zubmarine 1 x',
      note: 'Belongs to a journey measured in Approaching Journey\'s End rather than Zailing...',
      opts: [
        { text: 'Run deep, run quiet', tw: -4, prog: 0, gain: 'Approaching Journey\'s End +2, Approaching the Gates of the Garden +?' },
      ],
    },
    {
      name: 'Taking in Water',
      where: ['any'],
      freq: 'High Urgency',
      urgent: true,
      cardNeeds: 'Troubled Waters 7, Groaning Hull',
      note: 'Black card: Troubled Waters 7 plus Groaning Hull. The Luck 70% raises Troubled Waters either way; the brass repair is the real fix.',
      opts: [
        { text: 'Seal the compartment and run the pumps', ch: 'Luck 70%', tw: 2, twFail: 3, prog: 0.5, fail: 'TW +3, no progress, Wounds +3' },
        { text: 'Stop and make field repairs', need: 'Nevercold Brass Sliver 500 x', tw: -7, prog: 0, men: 'clears Groaning Hull, Creeping Fear', gain: 'costs Nevercold Brass Sliver 500' },
      ],
    },
    {
      name: 'The Clinging Coral Mass',
      where: ['any'],
      freq: 'Infrequent',
      opts: [
        { text: '"Put your backs into it, lads!"', ch: 'Persuasive vs Zee Peril', tw: 2, prog: 1, rare: 'full speed', fail: 'TW +10, full speed, Mutinous Whispers' },
        { text: 'Grab a hammer yourself', ch: 'Dangerous vs Zee Peril', tw: 2, prog: 1, fail: 'TW +10, full speed, Mutinous Whispers' },
      ],
    },
    {
      name: 'The Fleet of Truth',
      where: ['any'],
      freq: 'Infrequent',
      cardNeeds: 'Embarking on a Voyage of Scientific Discovery 3, Troubled Waters 3-7',
      opts: [
        { text: 'Villainy!', ch: 'Dangerous vs Zee Peril', tw: 4, prog: 1, gain: 'Page of Cryptopalaeontological Notes 5, Page of Prelapsarian Archaeological Notes 5, Page of Theosophistical Notes 5', fail: 'TW +8, full speed' },
        { text: 'Subterfuge', ch: 'Shadowy vs Zee Peril', need: 'Fraught Research Assistant', tw: 4, prog: 1, gain: 'Page of Cryptopalaeontological Notes 7, Page of Prelapsarian Archaeological Notes 7, Page of Theosophistical Notes 7', fail: 'TW +8, full speed' },
        { text: 'Engage in a little bit of \'peer review\'', ch: 'Persuasive vs Zee Peril', need: 'Chasing Down Your Bounty, Corsair\'s Colours 2', tw: 2, prog: 1, gain: 'Chasing Down Your Bounty [See below]', rare: 'full speed', fail: 'TW +8, half speed, Unwelcome on the Waters', piracy: true },
        { text: 'Hatch plans with two Shifty Scholars', need: 'Associating with a Youthful Naturalist 510-549, Favour in High Places 2 x', hidden: 'Organic Comprehension', tw: 2, prog: 0.5, gain: 'Organic Comprehension, costs Favour in High Places 2' },
        { text: 'Rendezvous with two Shifty Scholars', need: 'Associating with a Youthful Naturalist 510-549, Organic Comprehension exactly 7', tw: 2, prog: 0.5, men: 'Silent Stalker', gain: 'Organic Comprehension, Associating with a Youthful Naturalist 10, Unearthly Fossil 10' },
      ],
    },
    {
      name: 'The Killing Wind',
      where: ['any'],
      freq: 'Standard',
      cardNeeds: 'Troubled Waters 4-7',
      note: 'Only drawn at Troubled Waters 4-7. Without Zubmersibility the only line is a coin flip that costs +4 on a success and +12 on a failure - leave it in hand while you can.',
      opts: [
        { text: 'Outrun the storm front', ch: 'Luck 50%', tw: 4, twFail: 12, prog: 1, men: 'Creeping Fear', fail: 'TW +12, no progress, Creeping Fear' },
        { text: 'Make ready to dive', need: 'Zubmersibility', tw: -2, prog: 1, gain: 'Zee-Ztory 3–6' },
        { text: 'Chart a course through the storm using your Storm in a Teacup', ch: 'Luck 60%', need: 'Ornamental Storm in a Teacup', tw: null, twText: 'Troubled Waters up by an unrecorded amount', twFail: 10, prog: 1, men: 'Creeping Fear', gain: 'Zee-Ztory 2', fail: 'TW +10, no progress, Creeping Fear' },
      ],
    },
    {
      name: 'The Sound of Wings',
      where: ['any'],
      freq: 'Infrequent',
      strictZee: true,
      cardNeeds: 'Wings of Change',
      note: 'Fallen London draws a card of this name in eight different places; only the Unterzee one is described here, which is why it is only badged when the area reads as a zee region.',
      opts: [
        { text: 'Full power to the engines!', ch: 'Zeefaring 7', tw: 0, prog: 1, men: 'Wounds 2-3', gain: 'Royal-Blue Feather 6, Aeolian Scream 1', fail: 'TW +6, half speed, Wounds 3, Nightmares 1-3' },
        { text: 'Confront it', hidden: 'Wings of Change (Not here. Not even with cannonfire.)', tw: 0, prog: 0 },
      ],
    },
    {
      name: 'Toward the Canal',
      where: ['any'],
      freq: 'Very Infrequent',
      cardNeeds: 'A Person of Some Importance - is: A Shattering Force, A Legendary Charisma, An Invisible Eminence, An Extraordinary Mind, A Paramount Presence',
      opts: [
        { text: 'Contemplate the journey', tw: 0, prog: 1 },
        { text: 'Commit to the choice', need: 'The Date - After Certain Neathy Affairs are Complete', tw: 0, prog: 0 },
      ],
    },
    {
      name: 'What do the Drownies Sing?',
      where: ['any'],
      freq: 'Standard',
      note: 'With a Faceted Decanter of Drownie Effluvia and Kataleptic Toxicology, this is full speed for -5 Troubled Waters.',
      opts: [
        { text: 'Keep the crew from listening', ch: 'Persuasive vs Zee Peril', tw: 2, prog: 1, fail: 'TW +9, full speed, Creeping Fear' },
        { text: 'Drown out the drownies', ch: 'Dangerous vs Zee Peril', tw: 2, prog: 1, fail: 'TW +9, full speed, Groaning Hull' },
        { text: 'Cure the ignorance of your zailors', ch: 'Kataleptic Toxicology 3', need: 'A Faceted Decanter of Drownie Effluvia, Kataleptic Toxicology', tw: -5, prog: 1, fail: 'TW +12, full speed, Creeping Fear' },
        { text: 'Listen to the songs, and for your quarry', ch: 'Monstrous Anatomy 13', need: 'Chasing Down Your Bounty, Corsair\'s Colours 2', tw: 2, prog: 1, gain: 'Chasing Down Your Bounty', rare: 'full speed', fail: 'TW +6, half speed, Nightmares +4, Silent Stalker', piracy: true },
      ],
    },
    {
      name: 'When the Carousing Stops',
      where: ['any'],
      freq: 'Standard',
      cardNeeds: 'Corsair\'s Colours 2',
      opts: [
        { text: 'Discipline your crew', ch: 'Dangerous vs Zee Peril', tw: 4, prog: 1, fail: 'TW +10, half speed, Mutinous Whispers', piracy: true },
        { text: 'Restart the party', ch: 'Persuasive vs Zee Peril', tw: 4, prog: 1, gain: 'Pieces of Plunder Weighing Down Your Hold [see below], Bottle of Broken Giant 1844 1', rare: 'TW +2, full speed', fail: 'TW +10, half speed, Mutinous Whispers', piracy: true },
      ],
    },
    {
      name: 'Your False-Star',
      where: ['any'],
      freq: 'Standard',
      cardNeeds: 'Looked Upon Fondly',
      note: 'The best card in the deck: full Zailing Speed and Troubled Waters -5, no challenge, no cost. Needs the Looked Upon Fondly quality from the Fingerkings.',
      opts: [
        { text: 'Navigate by the light of your star', tw: -5, prog: 1 },
      ],
    },
    {
      name: 'Zeeborne Pariahs',
      where: ['any'],
      freq: 'High Urgency',
      urgent: true,
      cardNeeds: 'Troubled Waters 7, Unwelcome on the Waters',
      note: 'Black card: Troubled Waters 7 plus Unwelcome on the Waters, which comes from failed piracy.',
      opts: [
        { text: 'Evade them!', ch: 'Luck 70%', tw: 2, twFail: 4, prog: 0.5, fail: 'TW +4, no progress, Wounds +4' },
        { text: 'Put your crew to work disguising the ship', need: 'Inkling of Identity 50 x', tw: -7, prog: 0, men: 'clears Unwelcome on the Waters, Mutinous Whispers', gain: 'costs Inkling of Identity 50' },
      ],
    },

    // --- Home Waters ---
    {
      name: 'A Steamer full of Passengers',
      where: ['Home Waters', 'Shepherd\'s Wash'],
      freq: 'Standard',
      cardNeeds: 'Zailing on: Home Waters or Shepherd\'s Wash',
      opts: [
        { text: 'Steam past them', tw: 2, prog: 1 },
        { text: 'Invite them aboard for a party', need: 'Luxurious', tw: 0, prog: 0, men: 'Scandal +2', gain: 'Hedonist, Pair of Scarlet Stockings of Dubious Origin 1, Secluded Address 6, costs Austere -3' },
        { text: 'Recognise your quarry', ch: 'Dangerous vs Zee Peril', need: 'A List of Aliases, Writ in Gant', tw: 5, prog: 1, gain: 'Piece of Rostygold 250', fail: 'TW +2, full speed' },
        { text: 'Rob them blind', ch: 'Dangerous vs Zee Peril', need: 'Corsair\'s Colours 2', tw: 2, prog: 1, gain: 'Pieces of Plunder Weighing Down Your Hold 300', rare: 'TW +1, full speed', fail: 'TW +8, half speed, Unwelcome on the Waters', piracy: true },
      ],
    },
    {
      name: 'Amber in the Water',
      where: ['Home Waters'],
      freq: 'Abundant',
      cardNeeds: 'The Lorn-Fluke\'s Fury, Wayland\'s Teeth Involvement Flag 2',
      opts: [
        { text: 'Identify a course through less viscous waters', ch: 'Zeefaring + Kataleptic Toxicology 20', tw: 2, prog: 1, fail: 'TW +7, half speed, Creeping Fear' },
        { text: 'Revel in the delays', need: 'Luxurious', tw: 0, prog: 0.5, gain: 'Nodule of Warm Amber 10, Nodule of Deep Amber 200' },
        { text: 'Mount your Fluke-Core upon the prow', need: 'Fluke-Core 1 x', tw: 2, prog: 1 },
      ],
    },
    {
      name: 'Enspired Shallows',
      where: ['Home Waters'],
      freq: 'Abundant',
      cardNeeds: 'The Lorn-Fluke\'s Fury, Wayland\'s Teeth Involvement Flag 2',
      opts: [
        { text: 'Chart a careful course', ch: 'Zeefaring + Shapeling Arts 20', tw: 2, prog: 1, fail: 'TW +7, a third speed, Groaning Hull' },
        { text: 'Navigate with the aid of your amber vision', need: 'Amber Vision of the Sea of Spines', tw: 1, prog: 1 },
        { text: 'Barrel through', ch: 'Zailing Speed vs Zee Peril', tw: 2, prog: 1, fail: 'TW +7, no progress, Groaning Hull' },
      ],
    },
    {
      name: 'She\'s Going Down!',
      where: ['Home Waters'],
      freq: 'Standard',
      note: 'Rescuing them spends the action for no progress, but it is -2 Troubled Waters and a point of Steadfast.',
      opts: [
        { text: 'Stop and rescue them', tw: -2, prog: 0, gain: 'Steadfast Quirk cap=10, costs Heartless -3' },
        { text: 'Let the Unterzee have them', tw: 1, prog: 1, gain: 'Heartless Quirk cap=10, costs Magnanimous -3' },
        { text: 'Loot the wreckage', ch: 'Zeefaring 5', need: 'Corsair\'s Colours 2', tw: 3, prog: 1, gain: 'Pieces of Plunder Weighing Down Your Hold 250', rare: 'TW +2, full speed', fail: 'TW +8, full speed, Creeping Fear', piracy: true },
      ],
    },
    {
      name: 'Shipcatcher Webs',
      where: ['Home Waters'],
      freq: 'Abundant',
      cardNeeds: 'Wayland\'s Teeth Involvement Flag 2 , Saplings in the Forest of Years',
      opts: [
        { text: 'Extrapolate a pattern from fragments', ch: 'Zeefaring 20', tw: 3, prog: 1, fail: 'TW +7, half speed, Creeping Fear' },
        { text: 'Take the time to cut it down', need: 'Luxurious', tw: 0, prog: 0.5, gain: 'Silk Scrap 100, Whisper-Satin Scrap 4' },
        { text: 'Look upon the labyrinth as a spider would', need: 'at least one of: Senatorial Gauze, A Disquieting Suspicion That You Might Be Spiders, Spider-Infested Eyeball', tw: 1, prog: 1 },
      ],
    },
    {
      name: 'Spiders in the Shallows',
      where: ['Home Waters'],
      freq: 'Abundant',
      cardNeeds: 'Saplings in the Forest of Years',
      opts: [
        { text: 'Dive, dive, dive!', need: 'Zubmersibility', tw: 2, prog: 1 },
        { text: 'Blast them apart', ch: 'Zeefaring 20', tw: 1, prog: 1, fail: 'TW +7, half speed, Silent Stalker' },
        { text: 'Let your arachnid allies plead your case', need: 'at least one of: Fairly Tame Sorrow-Spider, Luxuriantly Coiffed Sorrow-Spider, Senatorial Spider, Spider of Silken Marvels ("You require but one arachnid ally." when locked)', tw: 2, prog: 1 },
      ],
    },
    {
      name: 'The Ebb and Flow of Regret',
      where: ['Home Waters', 'Shepherd\'s Wash', 'The Sea of Voices', 'The Salt Steppe', 'The Pillared Sea', 'Stormbones', 'The Snares'],
      freq: 'Abundant',
      cardNeeds: 'Associating with a Youthful Naturalist 580-587, Spiralling Regrets',
      note: 'An Evolution storyline card: one "Chart the sorrows of ..." option per region, each building the Comprehension of that region. The wiki lists its options under per-region headings rather than as one set, so no per-option numbers are transcribed here.',
      opts: [
      ],
    },
    {
      name: 'Tongues of Flame',
      where: ['Home Waters'],
      freq: 'Abundant',
      cardNeeds: 'The Lorn-Fluke\'s Fury, Wayland\'s Teeth Involvement Flag 2',
      opts: [
        { text: 'Dive, dive, dive!', need: 'Zubmersibility', tw: 1, prog: 1 },
        { text: 'Weave through the warring sigils', ch: 'Zeefaring + A Scholar of the Correspondence 20', tw: 2, twRange: '+2-3', prog: 1, fail: 'TW +7, a third speed, Creeping Fear' },
        { text: 'Lead your vessel on a merry dance through the fires', need: 'The Rose Giveth Its Verses to Devils and Also to You', tw: 1, twRange: '+1-2', prog: 1 },
      ],
    },
    {
      name: 'Venom-Tides',
      where: ['Home Waters'],
      freq: 'Abundant',
      cardNeeds: 'Wayland\'s Teeth Involvement Flag 2 , Saplings in the Forest of Years',
      opts: [
        { text: 'Charge on through', ch: 'Zailing Speed vs Zee Peril', tw: 1, prog: 1, fail: 'TW +6, half speed, Groaning Hull' },
        { text: 'Neutralise the toxins', ch: 'Zeefaring 20', tw: 2, prog: 1, fail: 'TW +7, half speed, Rumbling Stomachs' },
        { text: 'Go for a swim', need: 'Water in the Blood', tw: 1, prog: 1 },
      ],
    },

    // --- Shepherd's Wash ---
    {
      name: 'A Corsair Galley',
      where: ['Shepherd\'s Wash'],
      freq: 'Standard',
      opts: [
        { text: 'Full steam ahead!', ch: 'Zailing Speed vs Zee Peril', tw: 3, prog: 1, fail: 'TW +10, half speed, Groaning Hull' },
        { text: 'Fire a warning shot', ch: 'Dangerous vs Zee Peril', tw: 2, prog: 1, fail: 'TW +12, half speed, Groaning Hull' },
        { text: 'Fight back!', ch: 'Artisan of the Red Science 6', need: 'Corsair\'s Colours 2', tw: 4, prog: 1, gain: 'Pieces of Plunder Weighing Down Your Hold 300', rare: 'TW +2, full speed', fail: 'TW +10, a quarter speed, Unwelcome on the Waters', piracy: true },
      ],
    },
    {
      name: 'Row, row, row',
      where: ['Shepherd\'s Wash'],
      freq: 'Standard',
      note: '"Ask the monks from where they hail" is one of the two ways to discover Godfall.',
      opts: [
        { text: 'Zail on by', ch: 'Zailing Speed vs Zee Peril', tw: 0, prog: 1, fail: 'TW +8, half speed' },
        { text: 'Brawl with the monks', ch: 'Dangerous vs Zee Peril', tw: 0, prog: 0, gain: 'Bottle of Broken Giant 1844 1, Zee-Ztory 2', fail: 'TW +8, no progress' },
        { text: 'Ask the monks from where they hail', need: 'Cellar of Wine 1 x, Bottle of Morelways 1872 100 x', hidden: 'Discovered: Godfall', tw: 0, prog: 0, gain: 'costs Cellar of Wine 1, costs Bottle of Morelways 1872 100, Discovered: Godfall' },
        { text: 'Gather your crew and engage in a proper dust-up', ch: 'Dangerous vs Zee Peril', need: 'Staunch Comrades', tw: 0, prog: 0.5, gain: 'Apostate\'s Psalm 1, Bottle of Morelways 1872 20', fail: 'TW +6, no progress, Wounds +2' },
      ],
    },
    {
      name: 'The Light of the Mountain',
      where: ['Shepherd\'s Wash'],
      freq: 'Standard',
      note: 'The card that first grants Southern Wind, which starts I Shot the Albatross back in London.',
      opts: [
        { text: 'Fix a looking-glass on the Mountain', tw: 2, prog: 1, gain: 'Southern Wind +4 CP, or +1 CP if already present, Memory of Distant Shores 5' },
      ],
    },
    {
      name: 'The Wax-Wind',
      where: ['Shepherd\'s Wash'],
      freq: 'Standard',
      note: 'Also grants Southern Wind. Hiding belowdecks is -2 Troubled Waters but spends the action; with Zubmersibility, "Dive!" is -1 and full speed.',
      opts: [
        { text: 'Shut off the engines and hide belowdecks', tw: -2, prog: 0, gain: 'Zee-Ztory 1' },
        { text: 'Zail into the wind', ch: 'Shadowy vs Zee Peril', tw: 2, prog: 0.5, gain: 'Southern Wind, Zee-Ztory 1', fail: 'TW +4, no progress' },
        { text: 'Dive!', need: 'Zubmersibility', tw: -1, prog: 1, gain: 'Southern Wind' },
        { text: 'Zail into the eye of the storm', ch: 'Zeefaring 5', need: 'Zeefaring, Stormy-Eyed', tw: 0, prog: 0.5, gain: 'Memory of Distant Shores 1, Zee-Ztory 1, Memory of Light 1, Southern Wind' },
      ],
    },

    // --- The Sea of Voices ---
    {
      name: 'A Good Meal',
      where: ['The Sea of Voices'],
      freq: 'Standard',
      cardNeeds: 'Embarking on a Voyage of Scientific Discovery 3',
      opts: [
        { text: 'And a little bonus', tw: 3, prog: 1, gain: 'Page of Cryptopalaeontological Notes 3, Page of Prelapsarian Archaeological Notes 3, Page of Theosophistical Notes 3, Moon-Pearl 1' },
      ],
    },
    {
      name: 'A Hazard to Shipping',
      where: ['The Sea of Voices'],
      freq: 'Standard',
      opts: [
        { text: 'Set a course around the thing', ch: 'Watchful vs Zee Peril', tw: 2, prog: 1, rare: 'full speed', fail: 'TW +2, half speed, Silent Stalker' },
      ],
    },
    {
      name: 'A Light in the Fog',
      where: ['The Sea of Voices'],
      freq: 'Standard',
      opts: [
        { text: 'Get as close as you dare', tw: 3, prog: 0.5, gain: 'Walking the Falling Cities +5, Zee-Ztory 5' },
        { text: 'Keep away from the lighthouse', tw: 1, prog: 1 },
        { text: 'Listen for news of your quarry', ch: 'Watchful vs Zee Peril', need: 'Chasing Down Your Bounty, Corsair\'s Colours 2', tw: 3, prog: 1, gain: 'Chasing Down Your Bounty +10', rare: 'full speed', fail: 'TW +8, full speed, Groaning Hull', piracy: true },
      ],
    },
    {
      name: 'Crossing Paths',
      where: ['The Sea of Voices'],
      freq: 'Standard',
      opts: [
        { text: 'Hail the ship and have a chat with the captain', tw: -2, prog: 0.5, gain: 'Zee-Ztory 1, Walking the Falling Cities +5' },
        { text: 'Demand to duel the steamer\'s captain', ch: 'Zeefaring 6', need: 'Corsair\'s Colours 2, Flexile Sabre', tw: 3, prog: 1, gain: 'Pieces of Plunder Weighing Down Your Hold 350', rare: 'TW +1, full speed', fail: 'TW +7, half speed', piracy: true },
        { text: 'Steam on by', tw: 4, prog: 1 },
      ],
    },
    {
      name: 'Fury of the Unterzee: Lost but not Alone',
      where: ['The Sea of Voices'],
      freq: 'Standard',
      cardNeeds: 'Troubled Waters 10',
      note: 'Drawn at Troubled Waters 10, on a voyage measured in Approaching Journey\'s End.',
      opts: [
        { text: 'A tapping on the hull', ch: 'Luck 50%', tw: -2, twRange: '-2-6', prog: 0, gain: 'Approaching Journey\'s End +2-6', fail: 'Troubled Waters cleared, no progress, Nightmares +3' },
        { text: 'Avert what comes', need: 'Ostentatious Diamond 20 x, Whispered Hint 100 x', tw: -5, prog: 0, gain: 'Approaching Journey\'s End +2, costs Whispered Hint 100, costs Ostentatious Diamond 20' },
      ],
    },
    {
      name: 'Fury of the Unterzee: Taken',
      where: ['The Sea of Voices'],
      freq: 'Standard',
      cardNeeds: 'Troubled Waters 10',
      note: 'Drawn at Troubled Waters 10, on a voyage measured in Approaching Journey\'s End.',
      opts: [
        { text: 'Oh no', ch: 'Luck 50%', tw: -5, prog: 0, gain: 'Walking the Falling Cities, Approaching Journey\'s End +2', fail: 'Troubled Waters cleared, no progress' },
        { text: 'Use your store of sea-lore', need: 'Zee-Ztory 20 x', tw: 0, prog: 0, gain: 'Approaching Journey\'s End, costs Zee-Ztory 20' },
      ],
    },
    {
      name: 'Listen to the Wind',
      where: ['The Sea of Voices'],
      freq: 'Standard',
      opts: [
        { text: 'Listen to the Voices', ch: 'Luck 50%', hidden: 'Aeolian Sensitivity', tw: 2, twFail: 7, prog: 1, gain: 'Eastern Wind +1, Northern Wind +1, Southern Wind +1, Zee-Ztory 1, Walking the Falling Cities +5', fail: 'TW +7, full speed, Creeping Fear' },
        { text: 'Listen closely to the Voices', ch: 'Luck 60%', need: 'Aeolian Sensitivity', tw: 2, twFail: 7, prog: 1, gain: 'Zee-Ztory 1, Walking the Falling Cities +5, Eastern Wind +1, Northern Wind +1, Southern Wind +1', fail: 'TW +7, full speed, Creeping Fear' },
        { text: 'Steam the way the voices tell you', need: 'A Scholar of the Correspondence 1', tw: 3, prog: 1 },
      ],
    },
    {
      name: 'Meeting a Local Steamer',
      where: ['The Sea of Voices'],
      freq: 'Standard',
      opts: [
        { text: 'Hail the steamer to exchange news', tw: -2, prog: 0.5, gain: 'Zee-Ztory 1, Walking the Falling Cities +5' },
        { text: 'Steam on by', tw: 2, prog: 1 },
        { text: 'I say, must you do that?', need: 'Luxurious', tw: -1, prog: 1, gain: 'Zee-Ztory 4' },
        { text: 'Hail the steamer to exchange news, and let your Boots translate', need: 'Polythremean Captain\'s Boots', tw: 1, prog: 1, gain: 'Zee-Ztory 3, Walking the Falling Cities +5' },
        { text: 'Board her!', ch: 'Persuasive vs Zee Peril', need: 'Corsair\'s Colours 2, Russet Brachiator', tw: 3, prog: 1, gain: 'Pieces of Plunder Weighing Down Your Hold 350', rare: 'TW +2, full speed', fail: 'TW +7, half speed', piracy: true },
      ],
    },
    {
      name: 'The Giant of the Unterzee',
      where: ['The Sea of Voices'],
      freq: 'Standard',
      note: 'The jackpot. A success is a flat Zailing... 80 - an entire direct leg in one action - for Troubled Waters +5. A failure is only half speed and +8.',
      opts: [
        { text: 'Erm, hello?', ch: 'Persuasive vs Zee Peril', tw: 5, prog: 'flat80', fail: 'TW +8, half speed' },
      ],
    },
    {
      name: 'The Iceberg',
      where: ['The Sea of Voices'],
      freq: 'Standard',
      cardNeeds: 'Troubled Waters 4 - 7',
      note: 'Only drawn at Troubled Waters 4-7. With Zubmersibility it is full speed and -2 Troubled Waters.',
      opts: [
        { text: 'Keep a prudent distance', ch: 'Luck 50%', tw: 4, twFail: 8, prog: 1, gain: 'Walking the Falling Cities +5', fail: 'TW +8, no progress, Creeping Fear' },
        { text: 'Have a look around under the iceberg', need: 'Zubmersibility 1 x', tw: -2, prog: 1, gain: 'Zee-Ztory 2, Walking the Falling Cities +5' },
      ],
    },
    {
      name: 'Unfinished Pirates!',
      where: ['The Sea of Voices'],
      freq: 'Standard',
      cardNeeds: 'Troubled Waters 4 - 7',
      note: 'Only drawn at Troubled Waters 4-7.',
      opts: [
        { text: 'Repel Boarders!', ch: 'Dangerous vs Zee Peril', tw: 3, prog: 0.5, gain: 'Zee-Ztory 1', fail: 'TW +9, half speed, Groaning Hull' },
        { text: 'Show them the might of your broadside', ch: 'Zeefaring 7', need: 'Corsair\'s Colours 2', tw: 4, prog: 1, gain: 'Pieces of Plunder Weighing Down Your Hold 350', rare: 'TW +2, full speed', fail: 'TW +8, half speed, Unwelcome on the Waters', piracy: true },
        { text: 'Outpace them', need: 'Zailing Speed 75 x', tw: 4, prog: 1 },
      ],
    },

    // --- The Salt Steppe ---
    {
      name: 'A Chelonite Hunting Ketch',
      where: ['The Salt Steppe'],
      freq: 'Standard',
      note: 'None of these lines make any Zailing progress at all - this is a trading card, not a travelling one.',
      opts: [
        { text: 'Hail them and purchase a bag of assorted bones', need: 'Moon-Pearl 500 x, Shard of Glim 500 x', tw: 0, prog: 0, gain: 'costs Moon-Pearl 500, costs Shard of Glim 500, Fin Bones, Collected 1-9, Withered Tentacle 2-10, Crustacean Pincer 1-5', rare: 'no progress' },
        { text: 'Offer to help a Sharp Hunter', need: 'Chirurgical Touch', tw: 0, prog: 0, gain: 'Crystallised Curio 2' },
        { text: 'Hail them and exchange stories', need: 'Zee-Ztory 10 x', tw: 0, prog: 0, gain: 'costs Zee-Ztory 10, Tale of Terror!! 15, costs Zee-Ztory 10, Extraordinary Implication 3' },
        { text: 'Regale them with tales of your own hunts', need: 'A Notched Bone Harpoon, Tale of Terror!! 10 x', tw: -4, prog: 0, gain: 'costs Tale of Terror!! 10, Moon-Pearl 250, Shard of Glim 250, Fin Bones, Collected 5' },
        { text: 'Open fire!', ch: 'Zeefaring 11', need: 'Corsair\'s Colours 2', tw: 3, prog: 0, gain: 'Pieces of Plunder Weighing Down Your Hold 400', fail: 'TW +6, no progress, Groaning Hull', piracy: true },
        { text: 'Exchange sightings of elusive beasts', ch: 'Monstrous Anatomy 11', need: 'Chasing Down Your Bounty, Corsair\'s Colours 2', tw: 0, prog: 0, gain: 'Chasing Down Your Bounty', fail: 'no progress, Nightmares +2', piracy: true },
      ],
    },
    {
      name: 'A Distant Gleam',
      where: ['The Salt Steppe'],
      freq: 'Standard',
      note: '"Fix a looking-glass on the horizon" first grants Eastern Wind, which starts Upon a Painted Sea in London - the only wind storyline that adds no Nightmares.',
      opts: [
        { text: 'Fix a looking-glass on the horizon', tw: 2, prog: 1, gain: 'Eastern Wind +4, Memory of Distant Shores 5' },
        { text: 'Measure the measureless', ch: 'Artisan of the Red Science 10', need: 'Artisan of the Red Science', tw: 0, prog: 1, men: 'Nightmares +1', gain: 'Extraordinary Implication 1, Eastern Wind +1', fail: 'TW +9, half speed, Nightmares +4' },
        { text: 'Release your Uttermost Eel into the waters', ch: 'Zeefaring 10', need: 'Uttermost Eel 1 x, Zeefaring', tw: 0, prog: 1, men: 'Nightmares +1', gain: 'Eastern Wind +2, Memory of a Much Lesser Self 1', fail: 'TW +9, half speed, Nightmares +3' },
      ],
    },
    {
      name: 'A Khaganian Patrol Vessel',
      where: ['The Salt Steppe'],
      freq: 'Standard',
      opts: [
        { text: 'Give them a wide berth', ch: 'Shadowy vs Zee Peril', tw: 0, prog: 1, fail: 'TW +8, half speed' },
        { text: 'Brazenly hail them', ch: 'Persuasive vs Zee Peril', tw: 0, prog: 0.5, men: 'clears Suspicion -2', fail: 'half speed, Suspicion +3' },
        { text: 'Record their position', need: 'Shrine to Saint Joshua', tw: 0, prog: 0.5, gain: 'Moves in the Great Game [see below]' },
        { text: 'Encode signals to a Subtle Machinist', ch: 'A Player of Chess 7', need: 'Associating with a Youthful Naturalist 510-549, Favour in High Places 1 x', hidden: 'Mechanical Comprehension', tw: 2, prog: 0.5, gain: 'Mechanical Comprehension, Whirring Contraption 20, Nevercold Brass Sliver 5000, Memory of Distant Shores 100', fail: 'TW +2, half speed, Suspicion +2, Unwelcome on the Waters' },
        { text: 'Hail them with their own passphrases', ch: 'A Player of Chess 11', need: 'Chasing Down Your Bounty', tw: 4, prog: 1, gain: 'Chasing Down Your Bounty', fail: 'TW +10, half speed, Unwelcome on the Waters, Suspicion +2', piracy: true },
        { text: 'Man the cannons!', ch: 'Zeefaring 11', tw: 4, prog: 1, men: 'Suspicion +2, Unwelcome on the Waters', gain: 'Pieces of Plunder Weighing Down Your Hold 400', rare: 'TW +3, full speed', fail: 'TW +10, half speed, Suspicion +3, Unwelcome on the Waters', piracy: true },
      ],
    },

    // --- The Pillared Sea ---
    {
      name: 'Becalmed',
      where: ['The Pillared Sea'],
      freq: 'Standard',
      note: '"Cross the threshold" is not a zailing option: it drowns you into Parabola for Wounds +7-8 and sets The Mirror\'s Hunger.',
      opts: [
        { text: 'Shut off every light aboard; full steam ahead!', tw: 2, prog: 1, gain: 'Eastern Wind +1' },
        { text: 'Look into the glassy water', ch: 'Luck 50%', tw: 0, prog: 0.5, men: 'Nightmares +1-4', gain: 'Having Recurring Dreams: Death by Water +1', fail: 'half speed, Nightmares +5' },
        { text: 'Cross the threshold', need: 'Glasswork (Glasswork 5), Access to a Parabolan Base-Camp', hidden: 'The Mirror\'s Hunger', tw: 0, prog: 0 },
      ],
    },
    {
      name: 'Of the Pillars',
      where: ['The Pillared Sea'],
      freq: 'Standard',
      note: 'A Luck 90% for full speed and -2 Troubled Waters. The 10% failure is expensive: +8 Troubled Waters and +8 Nightmares.',
      opts: [
        { text: 'You will look towards her shores', ch: 'Luck 90%', tw: -2, twFail: 8, prog: 1, gain: 'Eastern Wind +1, Northern Wind +1', fail: 'TW +8, full speed, Nightmares +8' },
        { text: 'You will turn your helm away from her', tw: 0, prog: 0.5 },
        { text: 'You will change currency', need: 'Justificande Coin 25 x', tw: 0, prog: 1, gain: 'costs Justificande Coin 25, Oneiromantic Revelation 1' },
      ],
    },
    {
      name: 'Ripples of Future Voyages',
      where: ['The Pillared Sea'],
      freq: 'Standard',
      cardNeeds: 'Corsair\'s Colours 2',
      opts: [
        { text: 'You will remember finding your quarry', ch: 'Zeefaring 12', need: 'Chasing Down Your Bounty', tw: 3, prog: 1, gain: 'Chasing Down Your Bounty +15', fail: 'TW +8, half speed', piracy: true },
        { text: 'You will remember great riches', ch: 'Mithridacy 12', tw: 3, prog: 1, gain: 'Pieces of Plunder Weighing Down Your Hold 450', fail: 'TW +8, half speed', piracy: true },
        { text: 'You will remember your safe return', ch: 'Zailing Speed vs Zee Peril', tw: -2, prog: 1, fail: 'TW +4, full speed', piracy: true },
      ],
    },

    // --- Stormbones ---
    {
      name: 'A Coral Commotion',
      where: ['Stormbones'],
      freq: 'Standard',
      note: '"Find a quicker route into Port Cecil" is one of the two ways to discover Port Cecil.',
      opts: [
        { text: 'Scavenge amidst the scrum of boats', ch: 'Luck 50%', tw: 3, twFail: 8, prog: 0.5, gain: 'Silk Scrap 50', rare: 'TW +2, half speed', fail: 'TW +8, half speed, Creeping Fear' },
        { text: 'Weave through the throng', ch: 'Zailing Speed vs Zee Peril', tw: 3, prog: 1, fail: 'TW +10, full speed, Groaning Hull' },
        { text: 'Find a quicker route into Port Cecil', need: 'Embarking on a Voyage of Scientific Discovery 2', hidden: 'Discovered: The Principles of Coral', tw: 0, prog: 0.5, gain: 'Discovered: The Principles of Coral' },
      ],
    },
    {
      name: 'A Mountain of the Unterzee',
      where: ['Stormbones'],
      freq: 'Standard',
      opts: [
        { text: '"Hard to port! Reverse engines!"', ch: 'Zailing Speed vs Zee Peril', tw: 3, prog: 1, men: 'Silent Stalker', gain: 'Appalling Secret 5', fail: 'TW +10, full speed, Silent Stalker' },
        { text: '"Hold!"', need: 'The Cladery Heart', tw: -1, prog: 0, gain: 'Carved Ball of Stygian Ivory 1' },
      ],
    },
    {
      name: 'A Tiny Coral Island',
      where: ['Stormbones'],
      freq: 'Standard',
      opts: [
        { text: 'Record it and move on', tw: 3, prog: 1 },
        { text: 'What\'s that down there?', need: 'Zubmersibility', tw: -2, prog: 1, gain: 'Appalling Secret 5' },
        { text: 'Recognise its shape', ch: 'Shapeling Arts 3', need: 'Shapeling Arts', tw: 0, prog: 1, gain: 'Shapeling Arts +1 CP, if present, Cryptic Clue 25', fail: 'TW +3, full speed' },
      ],
    },
    {
      name: 'A Wind from the North',
      where: ['Stormbones'],
      freq: 'Standard',
      note: '"Listen to the wind" first grants Northern Wind, which starts Betwixt Us and the Sun in London. It costs +6 Troubled Waters.',
      opts: [
        { text: 'Keep your crew on course', ch: 'Persuasive vs Zee Peril', tw: 0, prog: 1, gain: 'Northern Wind +1', fail: 'TW +12, half speed, Creeping Fear' },
        { text: 'Help them', ch: 'Dangerous vs Zee Peril', tw: 0, prog: 1, gain: 'Northern Wind +1', fail: 'TW +5, half speed, Wounds +5' },
        { text: 'Listen to the wind', tw: 6, prog: 1, gain: 'Northern Wind +3 CP, or +1 CP if already present, Unaccountably Peckish 1' },
      ],
    },
    {
      name: 'Sighting a Lifeberg',
      where: ['Stormbones'],
      freq: 'Standard',
      note: '"Zail quickly past" is full speed for no Troubled Waters; the 2 Nightmares are usually the cheaper price.',
      opts: [
        { text: 'Keep your distance; make observations', ch: 'Watchful vs Zee Peril', tw: 0, prog: 0.5, gain: 'Tale of Terror!! 1, Zee-Ztory 1, Northern Wind +1', fail: 'TW +8, half speed' },
        { text: 'Ram the lifeberg and claim a piece of it!', need: 'A Notched Bone Harpoon', tw: 0, prog: 0, gain: 'Northern Wind +3 CP, or +1 CP if already present, Extraordinary Implication 1' },
        { text: 'Zail quickly past the lifeberg', ch: 'Zailing Speed vs Zee Peril', tw: 0, prog: 1, men: 'Nightmares +2', fail: 'TW +8, no progress, Groaning Hull 1' },
      ],
    },

    // --- The Snares ---
    {
      name: 'A Fellow Mourner',
      where: ['The Snares'],
      freq: 'Standard',
      cardNeeds: 'Corsair\'s Colours 2',
      opts: [
        { text: 'Coordinate with your sister-ship\'s Prophet', ch: 'Dangerous vs Zee Peril', need: 'Chasing Down Your Bounty', tw: 2, prog: 1, gain: 'Chasing Down Your Bounty', rare: 'full speed', fail: 'TW +10, half speed', piracy: true },
        { text: 'Load the cannons!', ch: 'Zeefaring 13', tw: 4, prog: 1, gain: 'Pieces of Plunder Weighing Down Your Hold 500', rare: 'TW +3, full speed', fail: 'TW +10, half speed', piracy: true },
        { text: 'Zail on by', tw: 6, prog: 1, piracy: true },
      ],
    },
    {
      name: 'A Pirate Steamer!',
      where: ['The Snares'],
      freq: 'Standard',
      opts: [
        { text: 'All power to the engines!', ch: 'Shadowy vs Zee Peril', tw: 4, prog: 1, fail: 'TW +18, half speed, Groaning Hull' },
        { text: 'Ready the guns!', ch: 'Dangerous vs Zee Peril', tw: 4, prog: 1, fail: 'TW +16, no progress' },
        { text: 'Flash a pass-sign of the Mourn', ch: 'Zeefaring 13', need: 'Corsair\'s Colours 2, Chasing Down Your Bounty', tw: 2, prog: 1, gain: 'Chasing Down Your Bounty +16', rare: 'TW -2-3, full speed', fail: 'TW +12, a quarter speed', piracy: true },
      ],
    },
    {
      name: 'Navigating the Snares',
      where: ['The Snares'],
      freq: 'Standard',
      note: '"Slow and steady" is half speed for zero Troubled Waters - the safe line, and the reason the Snares can be less punishing than the long way round.',
      opts: [
        { text: 'Slow and steady does it', tw: 0, prog: 0.5 },
        { text: 'You have places to be', ch: 'Shadowy vs Zee Peril', tw: 6, prog: 1, men: 'Mutinous Whispers', fail: 'TW +14, half speed, Groaning Hull' },
        { text: 'Follow a route set by the HMS Ramillies', ch: 'Watchful vs Zee Peril', need: 'The Crew of HMS Ramillies', tw: 6, prog: 1, men: 'Creeping Fear', fail: 'TW +12, half speed, Unwelcome on the Waters' },
      ],
    },
  ];

  // Two of the piracy cards are titled after your quarry -- in game "A
  // Sighting of the (Bounty)" reads "A Sighting of the Screaming Nun" or
  // whatever your target happens to be -- so those match on their opening
  // words instead of the whole name. Everything else matches exactly, through
  // the same punctuation-squashing normaliser the Spite table uses.
  const ZEE_BY_NAME = new Map();
  const ZEE_BY_PREFIX = [];
  for (const card of ZEE_CARDS) {
    if (card.prefix) ZEE_BY_PREFIX.push([normalizeName(card.prefix), card]);
    else ZEE_BY_NAME.set(normalizeName(card.name), card);
  }

  function lookupZeeCard(name) {
    const key = normalizeName(name);
    if (!key) return null;
    const exact = ZEE_BY_NAME.get(key);
    if (exact) return exact;
    for (const pair of ZEE_BY_PREFIX) {
      if (key.indexOf(pair[0] + ' ') === 0) return pair[1];
    }
    return null;
  }

  // How much of your Zailing Speed an option is worth. 'flat80' scores above
  // full speed because 80 is a whole direct leg -- more than any ship's speed.
  function zeeProgScore(prog) {
    if (prog === 'flat80') return 2;
    return typeof prog === 'number' ? prog : 0;
  }

  // What an option costs in Troubled Waters, for ranking purposes.
  //
  // Two deliberate rules here. An option whose change the wiki records as a
  // level ("set to 5") rather than a number of CP scores as 0: we know it is a
  // change but not its size, and inventing one would be worse than ranking it
  // neutrally. And a LUCK challenge is scored on its expected value, because
  // it is the one case where the wiki states both outcomes and the odds: A
  // Spit of Land's island stop buys a point on a success and costs eight on a
  // failure, so quoting the -1 alone would recommend a coin flip that is
  // actually the worse half of the card. A stat challenge gets no such
  // treatment -- the difficulty is your business, not this table's -- so it
  // keeps its success value and the badge's "?" says as much.
  function zeeTwScore(opt) {
    const base = typeof opt.tw === 'number' ? opt.tw : 0;
    const luck = opt.ch && /^Luck (\d+)%$/.exec(opt.ch);
    if (!luck || typeof opt.twFail !== 'number') return base;
    const odds = Number(luck[1]) / 100;
    return odds * base + (1 - odds) * opt.twFail;
  }

  // The line the badge speaks for. Options behind a `need` are left out --
  // their numbers would promise something you may not have -- unless the card
  // has no unconditional line at all, in which case the best gated one is used
  // and `gated` says so.
  //
  // Cheapest Troubled Waters first, more progress only as the tie-break. That
  // is the guide's own framing (its one big table is "cards that do not
  // increase Troubled Waters"), and it is the right way round: almost every
  // line at zee makes full progress anyway, so the number that actually varies
  // between the cards in your hand is what they cost you, and the thing that
  // ends a voyage badly is Troubled Waters reaching 8. Ranking progress first
  // instead would have the badge recommending "You have places to be" in the
  // Snares -- half an action saved for six change points, in the deadliest
  // water in the game. When the cheapest line is also the slow one, the badge
  // says so with its speed mark rather than hiding it.
  //
  // Pure, so the arithmetic behind every badge is testable without a DOM.
  function bestZeeLine(card) {
    const open = card.opts.filter(function (o) { return !o.need && !o.piracy; });
    const pool = open.length ? open : card.opts;
    if (!pool.length) return null;
    let best = pool[0];
    for (const opt of pool) {
      const dt = zeeTwScore(opt) - zeeTwScore(best);
      if (dt < 0 || (dt === 0 && zeeProgScore(opt.prog) > zeeProgScore(best.prog))) best = opt;
    }
    return { opt: best, gated: !open.length };
  }

  // Is there a cheaper line on this card that the badge deliberately refused
  // to quote, because it is gated on an item, a quality or piracy? That is the
  // other half of the question. The Killing Wind is the case this exists for:
  // what the badge can offer you is a coin flip that costs +4 on a success and
  // +12 on a failure, while a Zubmarine turns the same card into -2 at full
  // speed. The badge will not promise you a submarine, but it can point at the
  // tooltip.
  function zeeHasBetterGated(card, chosen) {
    return card.opts.some(function (o) {
      return o !== chosen && (o.need || o.piracy) && zeeTwScore(o) < zeeTwScore(chosen);
    });
  }

  const ZEE_CLASS = 'fl-ux-zee';
  const ZEE_FLAG = 'flUxZee';

  // Colours read as a cost, not a rating: green is cheap, red is expensive,
  // and the black cards get the dark green of their own sinister border
  // whatever their numbers say, because what matters about them is that they
  // are blocking your hand.
  const ZEE_URGENT_COLOR = '#25493a';
  const ZEE_UNKNOWN_COLOR = '#5b5b5b';
  function zeeColor(tw) {
    if (typeof tw !== 'number') return ZEE_UNKNOWN_COLOR;
    if (tw <= -2) return '#2f6b3f';
    if (tw <= 0) return '#4a7a3c';
    if (tw <= 2) return '#7a733a';
    if (tw <= 4) return '#8a6d3b';
    if (tw <= 7) return '#a1622c';
    return '#8a3b3b';
  }

  const ZEE_SPEED_MARK = { 0.5: '½', 0.25: '¼', 0: '·' };
  const ZEE_GATED_MARK = '▾';

  function zeeSpeedWord(prog) {
    if (prog === 'flat80') return 'a flat Zailing… 80, whatever your ship';
    if (prog === 1) return 'full Zailing Speed';
    if (prog === 0.5) return 'half Zailing Speed';
    if (prog === 0.25) return 'a quarter of Zailing Speed';
    return 'no progress';
  }

  function zeeTwWord(opt) {
    if (opt.twText) return opt.twText;
    if (typeof opt.tw !== 'number') return 'Troubled Waters unrecorded';
    const value = opt.twRange || (opt.tw > 0 ? '+' + opt.tw : String(opt.tw));
    return opt.tw === 0 ? 'no Troubled Waters' : 'Troubled Waters ' + value + ' CP';
  }

  function zeeOptionLine(opt) {
    const bits = [opt.text];
    if (opt.ch) bits.push('[' + opt.ch + ']');
    if (opt.need) bits.push('(needs ' + opt.need + ')');
    if (opt.hidden) bits.push('(hidden while: ' + opt.hidden + ')');
    let line = '  • ' + bits.join(' ') + '\n      ' + zeeTwWord(opt) + ', ' + zeeSpeedWord(opt.prog);
    if (opt.men) line += ', ' + opt.men;
    if (opt.gain) line += '\n      gives: ' + opt.gain;
    if (opt.note) line += '\n      ' + opt.note;
    if (opt.rare) line += '\n      rare success: ' + opt.rare;
    if (opt.fail) line += '\n      failure: ' + opt.fail;
    return line;
  }

  // What to draw for a card. Kept pure (card in, { text, color, title } out)
  // so the whole badge can be asserted on without a browser.
  function zeeBadgeSpec(card) {
    const best = bestZeeLine(card);
    if (!best) {
      return {
        text: '?',
        color: ZEE_UNKNOWN_COLOR,
        title: card.name + '\n' + (card.note || 'No options transcribed for this card.'),
      };
    }
    const opt = best.opt;
    const mark = ZEE_SPEED_MARK[opt.prog] || (opt.prog === 'flat80' ? '★' : '');
    const value = typeof opt.tw !== 'number' ? '→' : (opt.tw > 0 ? '+' + opt.tw : String(opt.tw));
    const text = mark + value + (opt.ch ? '?' : '') + (zeeHasBetterGated(card, opt) ? ZEE_GATED_MARK : '');

    const lines = [card.name];
    lines.push((card.where.indexOf('any') !== -1 ? 'Anywhere at zee' : card.where.join(' / '))
      + ' · ' + card.freq + (card.urgent ? ' · URGENT: dealt before every other zee card' : ''));
    if (card.cardNeeds) lines.push('In your deck while: ' + card.cardNeeds);
    if (card.note) lines.push(card.note);
    lines.push('');
    lines.push('Best line without anything special in hand'
      + (best.gated ? ' — there is none, so this one is gated:' : ':'));
    // The menaces go in the headline too, not only in the list below it. The
    // badge speaks about Troubled Waters and nothing else, so a line that is
    // cheap in Troubled Waters and expensive in Nightmares (Becalmed's, for
    // one) would otherwise read as free right where you are most likely to
    // stop reading.
    lines.push('  ' + opt.text + ' — ' + zeeTwWord(opt) + ', ' + zeeSpeedWord(opt.prog)
      + (opt.men ? ', ' + opt.men : '')
      + (opt.ch ? ' (on a success of ' + opt.ch + ')' : ''));
    if (zeeHasBetterGated(card, opt)) {
      lines.push('  ' + ZEE_GATED_MARK + ' a cheaper line exists here, behind something you may or may not have — see below.');
    }
    lines.push('');
    lines.push('Every option:');
    for (const o of card.opts) lines.push(zeeOptionLine(o));
    lines.push('');
    lines.push('Zee cards cannot be discarded. Troubled Waters resets at a safe dock; at 8 it kills you.');
    return { text: text, color: card.urgent ? ZEE_URGENT_COLOR : zeeColor(opt.tw), title: lines.join('\n') };
  }

  // The area gate, and it is a weaker one than the Crowds of Spite feature's
  // on purpose. That gate rests on a greeting captured verbatim in-game; this
  // list is a GUESS at what the same greeting says at zee, assembled from the
  // region names the wiki uses. So it only ever says "yes, definitely a zee
  // region" or "can't tell" -- never "no" -- and the card table stays the real
  // scope, exactly as the Spite feature started out.
  //
  // If a greeting from a real voyage is ever captured, this can be tightened
  // into an exact list the way SPITE_AREAS was.
  const ZEE_AREAS = [
    'The Broad Unterzee', 'The Unterzee', 'Zailing the Unterzee',
    'Home Waters', "Shepherd's Wash", 'The Sea of Voices',
    'The Salt Steppe', 'The Salt Steppes', 'The Pillared Sea',
    'Stormbones', 'The Snares',
  ].map(normalizeName);

  function inZee() {
    const area = normalizeName(currentArea());
    return !!area && ZEE_AREAS.indexOf(area) !== -1;
  }

  // One card is named "The Sound of Wings" and Fallen London deals a different
  // card of that same name in eight other places, so that one waits until the
  // area confirms we are at zee. Everything else is scoped by its name alone.
  function zeeCardFor(name) {
    const card = lookupZeeCard(name);
    if (!card) return null;
    if (card.strictZee && !inZee()) return null;
    return card;
  }

  function zeeCardRatings() {
    eachCardName(function (host, name, place, style) {
      const card = zeeCardFor(name);
      attachBadge(host, {
        cls: ZEE_CLASS,
        flag: ZEE_FLAG,
        value: name,
        spec: card ? zeeBadgeSpec(card) : null,
        place: place,
        style: style,
      });
    });
  }

  // === feature: Fruits of the Zee Festival card ratings ==================
  //
  // Rates the opportunity cards you draw while wreck-diving at the Fruits of
  // the Zee Festival (Mutton Island, the first weeks of September).
  //
  // The festival is two weeks and the cards belong to the first one. You raise
  // Fivefold Devotion on the shore, then dive from The Fishing Boats, Empty;
  // each card in the hand offers ONE treasure you may claim, and "Dive deeper"
  // is free but ends the dive if it fails. In the second week you trade what
  // you hauled up for Thalassic Favour and spend that on equipment. So a card
  // is worth two different things at once, and the badge says both:
  //
  //   * its TRADE-IN VALUE -- the Thalassic Favour the treasure is worth at
  //     the Fruit Market, which is what pays for everything in week two; and
  //   * whether it is a RARE ITEM you do not own yet -- the five corals, each
  //     of which trades for one of three unique pieces of equipment, and the
  //     six pieces of equipment from festivals past that only turn up while
  //     diving. Those are the reason to keep diving once the Favour is banked,
  //     and which of them you are still missing is the whole point of the
  //     Fruits of the Zee panel further down.
  //
  // THE AWKWARD PART IS DEPTH. Almost every value here depends on Full Fathom
  // Five -- A Cabin-Fragment pays 50 Favour at depth 1 and 400 at depth 5, and
  // A Shattered Prow offers a Nuncian Pocket Watch at depths 2-4 but the
  // Scrimshander Carving Knife only at 5 -- so a badge that ignored depth
  // would be quoting the wrong number most of the time. `fotzDepth` is
  // therefore three-tiered (see it below): a live read of the quality if FL
  // happens to be rendering it, a depth you set yourself in the panel, or
  // nothing -- and with nothing the badge shows the RANGE across the depths
  // and says so, rather than picking a number it cannot justify. Same rule as
  // everywhere else here: never state a figure we can't stand behind.
  //
  // Everything below is transcribed from Fruits of the Zee Festival (Guide),
  // its /Item Comparison subpage, and the individual card and option pages on
  // the Fallen London wiki. Corrections go in these tables and nowhere else.
  //
  // **Re-read the guide, don't trust a copy of it.** The wiki gains this
  // year's content as the festival runs: A Graveyard of Derelict Debris and
  // its Rust-Eaten Ration were added to the guide's own card table within a
  // day of this being transcribed, and the first anyone knew of it was a card
  // turning up unbadged in a real hand. When a card comes up unbadged, the
  // guide is the first place to look, not the last.

  // Which of the three versions of a coral item you get is NOT random, which
  // is the single most useful thing on this page: it is decided by Sights at
  // the Festival at the moment you break the coral open. Verified on all five
  // option pages (Offer the King your <coral>), which each list three
  // outcomes:
  //
  //   Sights  1- 33 -> the Itinerant Zubmariner's stock ("above and below the
  //                    zee" -- Saviour's Rocks, Rosegate, the Corsair's Forest)
  //   Sights 34- 66 -> the Pirate-Poet's stock (Gaider's Mourn)
  //   Sights 67-100 -> the Enigmatic Angler's stock (Irem)
  //
  // and the three traders in The Fruit Market swap coral items like-for-like,
  // each handing out the band that is theirs and accepting the other two. So a
  // variant you are missing has two routes: break a coral while Sights is in
  // its band, or trade a duplicate to that band's trader. Note that breaking
  // coral open re-rolls Sights, so you cannot line up two in a row.
  //
  // The guide's own summary table lists the three variants in a different
  // order for several of the corals. The option pages win, per the usual rule.
  const FOTZ_BANDS = [
    { lo: 1, hi: 33, trader: 'the Itinerant Zubmariner' },
    { lo: 34, hi: 66, trader: 'the Pirate-Poet' },
    { lo: 67, hi: 100, trader: 'the Enigmatic Angler' },
  ];

  // The five corals. Each is claimed from one card at any depth, and traded
  // (An Audience with the King-in-Coral -> Present him with a shard of coral)
  // for one of three items that are mechanically identical to each other.
  const FOTZ_CORALS = [
    {
      coral: 'Barnacled Headpiece', card: 'Among the Deep-Fish', slot: 'Hat', fate: 30,
      variants: ['Aria of Tranquillity', 'Crab-Clawed Tricorne', 'Peaceable Cowl'],
      bis: 'Strict best-in-slot for Troubled Waters reduction.',
    },
    {
      coral: 'Gorgonian Reef-Rock', card: 'A Rusting Anchor', slot: 'Clothing', fate: null,
      variants: ['Concealing Skirt', 'Henchman’s Greatcoat', 'Obscurant’s Shawl'],
    },
    {
      coral: 'Grasping Coral', card: 'A Reef of Wrecks', slot: 'Gloves', fate: 30,
      variants: ['Gossamer Palms', 'Mournclimber’s Wraps', 'Loomweavers'],
      bis: 'Shared best-in-slot with the Bazaar’s Pair of Lenguals.',
    },
    {
      coral: 'Pedestrian Polyp', card: 'Old Wounds', slot: 'Boots', fate: 15,
      variants: ['Scrimshaw Sabatons', 'Bright-Buckled Boots', 'Riddlefisher’s Footsteps'],
    },
    {
      coral: 'Spinebound Oddity', card: 'An Obscured Glitter', slot: 'Adornment', fate: 20,
      variants: ['‘Rosegate Blend’ Roll-ups', 'Mourning Locket', 'Justificande Cufflinks'],
      bis: 'Strict best-in-slot for Shadowy.',
    },
    // THIS YEAR'S NEW ONE, and the reason to re-read the guide rather than
    // trusting a transcription taken a day earlier: it was added to the wiki
    // between the two (found 2026-09-03, after a card in a real hand came up
    // unbadged). Its three items are NOT published -- the guide's own table
    // says "(Coming in week 2)" three times and the page carries an
    // `{{Incomplete}}` banner -- so `variants` is null rather than guessed at,
    // and everything downstream has to cope with not knowing them.
    {
      coral: 'Rust-Eaten Ration', card: 'A Graveyard of Derelict Debris', slot: 'Luggage',
      fate: null,
      variants: null,
      pendingLabel: 'Luggage',
      pending: 'New this year, and the three Luggage it becomes are not published yet — the '
        + 'wiki says "coming in week 2" and lists no names. The item raises Dangerous and '
        + 'Monstrous Anatomy, per the game’s own instruction text on the option.',
    },
  ];

  // --- week one, before the diving: Supplication on the Shore ------------
  //
  // You cannot dive at all below Fivefold Devotion 5, and how much higher you
  // go decides how deep you can get. Devotion comes from one storylet,
  // Supplication on the Shore, whose five options are worth **exactly the same
  // 4 CP each** -- so the only thing that separates them is which base
  // attribute the economy item scales off, and which item that is. Pick the
  // one matching your best stat; there is no other consideration.
  //
  // **You do not get to choose freely**, which is the thing the guide's table
  // does not tell you and a capture of the live storylet does: every option is
  // gated on a window of *Airs of a Barren Zee*, and Airs is re-rolled by the
  // action you just took. Typically two of the five are on offer at a time. So
  // the useful question is not "which is best" but "which of the ones in front
  // of me right now matches my best stat" -- and that is a question you have
  // while looking at the storylet, not while reading a table, which is why
  // these get badged in the game as well as listed in the panel.
  //
  // The windows and the ids come from the five option pages; the two the game
  // showed with a requirement icon (Airs 60-100 and "outside 21-79") agree
  // with them exactly, which is the check that they are real.
  //
  // The four attributes, with a glyph apiece. `color` is for text on the
  // panel's dark ground, `badge` for white text on a filled badge -- the same
  // hue at two weights, since one value cannot do both legibly. The stat's
  // name is always rendered beside the glyph, so a font without the emoji
  // loses nothing.
  const FOTZ_STATS = {
    Watchful: { icon: '👁', color: '#6f9fd8', badge: '#3d6591' },
    Shadowy: { icon: '🗝', color: '#9b83c9', badge: '#5f4b8b' },
    Dangerous: { icon: '⚔', color: '#c2645a', badge: '#8f3f36' },
    Persuasive: { icon: '🎭', color: '#c9a04a', badge: '#8a6420' },
  };

  const FOTZ_SUPPLICATION = [
    {
      text: 'Construct toy boats to scuttle on the reef', id: 259469,
      gain: 'Zee-Ztory', stat: 'Shadowy', airs: '0–40',
    },
    {
      text: 'Sacrifice landed victuals to the zee', id: 259492,
      gain: 'Cryptic Clue', stat: 'Watchful', airs: '20–60',
    },
    {
      text: 'Gather flotsam for the King-in-Coral', id: 259493,
      gain: 'Memory of Distant Shores', stat: 'Watchful', airs: '40–80',
      note: 'Memories turn in 40 at a time with 2 Sworn Statements, which is what makes '
        + 'this the option to take if you are also grinding Skulls in Coral in Jericho Locks.',
    },
    {
      text: 'Perform in a Mutton Island mystery play', id: 259494,
      gain: 'Maniac’s Prayer', stat: 'Persuasive', airs: '60–100',
    },
    {
      text: 'Assist in the preparation of a well-rite', id: 259531,
      gain: 'Tale of Terror!!', stat: 'Dangerous', airs: '0–20 or 80+',
    },
  ];

  // The other two branches on the same storylet. Neither raises Devotion by
  // the usual 4, so neither belongs in the table above -- but both are on
  // screen beside the ones that do, and an unlabelled option next to labelled
  // ones reads as an oversight. `strict` on the Chef because his name is the
  // one here generic enough to belong to some other storylet.
  const FOTZ_SUPPLICATION_OTHER = [
    {
      text: 'Speak to the Custodial Chef', id: 259471, strict: true,
      badge: 'free', note: 'Costs no action and gives nothing: the Chef opening proceedings.',
    },
    {
      text: 'Seek out one of the Fathomking’s servants', id: 259496,
      badge: '7 Fate', warn: true,
      note: 'Sets Fivefold Devotion straight to 11, the cap — which is otherwise 17 '
        + 'supplications. Quoted from the game’s own description of the branch.',
    },
  ];

  const FOTZ_BRANCHES = FOTZ_SUPPLICATION.concat(FOTZ_SUPPLICATION_OTHER);

  const FOTZ_BRANCH_BY_NAME = new Map(
    FOTZ_BRANCHES.map(function (o) { return [normalizeName(o.text), o]; }));

  function lookupFotzBranch(name) {
    return FOTZ_BRANCH_BY_NAME.get(normalizeName(name)) || null;
  }

  // Every option, every time. There is no variation to model.
  const FOTZ_DEVOTION_CP = 4;

  // Fivefold Devotion is a pyramidal quality: going from level n to n+1 costs
  // n+1 CP, so reaching L costs L(L+1)/2 altogether. At 4 CP an action that is
  // 4 actions to the minimum of 5 and 17 to the cap of 11 -- and a dive itself
  // is 2 more (one to leave the boat, one to claim the treasure).
  //
  // Pure, and worth being pure: the whole ladder is checked against the
  // guide's own table, which reads 5 (6 Act) through to 11 (19 Act).
  function fotzDevotionCP(level) {
    return (level * (level + 1)) / 2;
  }

  function fotzDevotionLadder() {
    const rows = [];
    for (let level = 5; level <= 11; level++) {
      const actions = Math.ceil(fotzDevotionCP(level) / FOTZ_DEVOTION_CP);
      rows.push({ level: level, cp: fotzDevotionCP(level), actions: actions, dive: actions + 2 });
    }
    return rows;
  }

  // How many more supplications from where you are now. `from` may be null --
  // we then have no idea, and neither does the caller. It is an upper bound
  // either way: FL shows the level but not the change points inside it, so
  // this assumes you have just this moment arrived at `from`.
  function fotzActionsToDevotion(from, to) {
    if (from == null || from >= to) return 0;
    return Math.ceil((fotzDevotionCP(to) - fotzDevotionCP(from)) / FOTZ_DEVOTION_CP);
  }

  // Where to stop, which depends entirely on what you are diving FOR. The
  // guide's recommendations: corals are found at every depth, so the more
  // different ones you still need the less depth is worth paying for -- but
  // Favour scales hard with depth, and 10 is where Favour per action peaks.
  function fotzDevotionAdvice(coralsWanted) {
    if (coralsWanted >= 3) {
      return {
        level: 5,
        why: 'Three or more corals still missing: they turn up at every depth, so dive '
          + 'as often and as cheaply as possible.',
      };
    }
    if (coralsWanted === 2) {
      return { level: 7, why: 'Two corals still missing: 7 is the guide’s balance point.' };
    }
    if (coralsWanted === 1) {
      return { level: 8, why: 'One coral still missing: 8 buys the consistency to find it.' };
    }
    return {
      level: 10,
      why: 'No corals left to find, so this is a Favour run: 10 is where Favour per '
        + 'action peaks, diving deeper until a card pays 300 or more.',
    };
  }

  // Pure economy treasure: worth nothing but the Favour it trades for. These
  // are the Fruit Market's numbers (Treasures to Trade), which are also what
  // the diving table's "Total Favour Value" column adds up to.
  const FOTZ_TREASURES = [
    { name: 'Witch-Stone', favour: 10 },
    { name: 'Collection of Zee-Glass', favour: 20 },
    { name: 'Salt-Smoothed Shiv', favour: 50 },
    { name: 'Sodden Mass', favour: 100 },
    {
      name: 'Skull in Coral', favour: 125,
      note: 'Also a usable Osteology skull, and the one treasure that survives the '
        + 'end of the festival. Limited to ten trade-ins.',
    },
    {
      name: 'Urchin Spine', favour: 125,
      note: 'Replaces Skull in Coral once ten have been received.',
    },
    { name: 'Long-Lost Zee Trunk', favour: 200 },
  ];

  // The six pieces of equipment from festivals past that turn up while diving.
  // `favour` is what trading a DUPLICATE back pays; `stall` is what buying one
  // at the Island Stalls costs in week two -- always the cheaper of the two,
  // which is the argument for diving them up rather than buying them.
  const FOTZ_EQUIPMENT = [
    {
      name: 'A Cured Jillyfleur Cloak', slot: 'Clothing', card: 'Well-Disguised Trinkets',
      depths: [1, 2], favour: 100, stall: 50, fate: 10,
      note: 'Early-game; outclassed by Far Khanate Lacquered Armour. Unlocks one of '
        + 'several ways into the Clay Tailor Club.',
    },
    {
      name: 'Wrecking Boots', slot: 'Boots', card: 'Tangled in the Rigging',
      depths: [2, 3], favour: 100, stall: 50, fate: 10,
      note: 'Early-game, no uses; a peer of the Bazaar’s Pair of Ratskin Boots.',
    },
    {
      name: 'Nuncian Pocket Watch', slot: 'Weapon', card: 'A Shattered Prow',
      depths: [2, 4], favour: 150, stall: 75, fate: 10,
      bis: 'Shared best-in-slot for Respectable.',
      note: 'Unlocks Hillchanger Tower options in Ealing Gardens and the Railway.',
    },
    {
      name: 'Semi-Automated Mary Lloyd', slot: 'Transport', card: 'Tangled in the Rigging',
      depths: [4, 5], favour: 200, stall: 100, fate: 30,
      bis: 'Strict non-Fate, non-Hellworm best-in-slot for BDR.',
    },
    {
      name: 'A Faceted Decanter of Drownie Effluvia', slot: 'Weapon',
      card: 'Well-Disguised Trinkets', depths: [3, 5], favour: 300, stall: 150, fate: 5,
      note: 'Unlocks Cure the ignorance of your zailors while Zailing — Troubled Waters '
        + 'down on a Kataleptic Toxicology check, and progress with it.',
    },
    {
      name: 'Scrimshander Carving Knife', slot: 'Weapon', card: 'A Shattered Prow',
      depths: [5, 5], favour: 400, stall: 200, fate: 5,
      note: 'No stats. Unlocks Carve away some evidence of age, which removes '
        + 'Skeleton: Antiquity.',
    },
  ];

  // Week two only: the Island Stalls, for Thalassic Favour. Nothing here can be
  // dived for. The prices are the stall table's in the guide; where the Item
  // Comparison page disagrees (it says 250 for the Lamp-cat, 30 Fate for the
  // Guinea-Pig) the price list is what this follows.
  const FOTZ_STALL = [
    {
      name: 'A Submerged Rector', slot: 'Companion', favour: 100, fate: 15,
      note: 'Early-game Persuasive companion. Unlocks options in the Upper River, the '
        + 'Evenlode and Burrow-infra-Mump.',
    },
    {
      name: 'Keelgraspers', slot: 'Gloves', favour: 150, fate: 10,
      bis: 'Shared best-in-slot for BDR.',
    },
    {
      name: 'Sun-Seared Silken Gloves', slot: 'Gloves', favour: 150, fate: 10,
      bis: 'Shared best-in-slot for A Player of Chess and for BDR.',
    },
    {
      name: 'Inquisitive Lamp-cat', slot: 'Companion', favour: 200, fate: 15,
      note: 'Unremarkable now, but its Hallowmas upgrade (Feline Pariah) is shared '
        + 'best-in-slot for Monstrous Anatomy and Shadowy.',
    },
    {
      name: 'The Forsaken Crown of a Grand Devil', slot: 'Hat', favour: 250, fate: 30,
      bis: 'Shared best-in-slot for Artisan of the Red Science.',
    },
    {
      name: 'Corpulent Carriage', slot: 'Transport', favour: 250, fate: 30,
      bis: 'Shared best-in-slot for Monstrous Anatomy.',
    },
  ];

  // The four festival ships, bought with your current ship plus Favour. The
  // 500-1920 spread is which class you are trading in: a Zubmarine, a Majestic
  // Pleasure Yacht or another festival ship brings every one of these to 500.
  const FOTZ_SHIPS = [
    {
      name: 'Obstinate-class Cruiser', slot: 'Ship', peer: 'Rusty Tramp Steamer', fate: 20,
      note: 'The only ship that reduces Troubled Waters, and it adds Dangerous and Dreaded.',
    },
    {
      name: 'Ogedei-class Liner', slot: 'Ship', peer: 'Swift Zee-Clipper', fate: 20,
      note: 'As fast as the Clipper, plus Dangerous and Dreaded.',
    },
    {
      name: 'Nyx-class Zubmersible', slot: 'Ship', peer: 'Zubmarine', fate: 20,
      note: 'A Shadowy, Dreaded Zubmarine.',
    },
    {
      name: 'Il-Altun-class Yacht', slot: 'Ship', peer: 'Majestic Pleasure Yacht', fate: 20,
      note: 'The Yacht, plus Persuasive.',
    },
  ];

  // Reaching the bottom of the trench reveals Her Fivefold Symmetry, and
  // begging audience there earns the Accomplishment. In week two that is what
  // lets the King-in-Coral hand the Litter-Cyst over.
  const FOTZ_BRIDE_QUALITY = 'Discovered: the Pentamerous Bride';
  const FOTZ_BRIDE_ITEMS = [
    {
      name: 'Weeping Litter-Cyst', slot: 'Transport',
      how: 'Dive to Full Fathom Five 5, beg audience with the Pentamerous Bride, then '
        + 'Accept a briny gift from the King-in-Coral in week two.',
      bis: 'Shared best-in-slot for Zeefaring.',
    },
    {
      name: 'Nodule of Fecund Amber', slot: null,
      how: 'Accept a fecund gift instead — offered only once you already hold the '
        + 'Litter-Cyst from a previous festival.',
      note: 'Not equipment: a Most Valuable rubbery item, sells for 312.50.',
    },
  ];

  // Fate-only, from the King-in-Coral's Hoard. Listed so the checklist is
  // honest about being a complete roster, but never counted as "missing":
  // these cost money rather than actions, and several are obtainable elsewhere.
  const FOTZ_FATE_ITEMS = [
    { name: 'Pre-Emptive Guinea-Pig', slot: 'Weapon', fate: 20 },
    { name: '‘For Your Own Good’ Compass', slot: 'Weapon', fate: 15 },
    {
      name: 'Mutersalt', slot: 'Weapon', fate: 15,
      note: 'Also free during the Railway, from the Liberationist marshland track.',
    },
    {
      name: 'Consignment of Scintillack Snuff', slot: 'Weapon', fate: 10,
      note: 'Don’t buy it here — get it from Balmoral and research the recipe.',
    },
    {
      name: 'Viscountess’ Bejewelled Collar', slot: 'Adornment', fate: 10,
      note: 'Also from the Sacroboscan Calendar.',
    },
    {
      name: 'Viscount’s Bejewelled Collar', slot: 'Adornment', fate: 10,
      note: 'Also from the Sacroboscan Calendar.',
    },
    {
      name: 'Bloodstained Eolith', slot: null, fate: 15,
      note: 'Also a rare failure when disambiguating Eoliths in your lab.',
    },
    {
      name: 'Sinning Jenny’s Forsaken Wimple!', slot: 'Hat', fate: null,
      note: 'A different item from Sinning Jenny’s Forsaken Wimple, for reasons known '
        + 'only to Failbetter.',
    },
  ];

  // Pure Favour-to-Echoes conversions at the stalls: a guaranteed E0.1 per
  // Favour, which is the floor every other use of Favour is judged against.
  const FOTZ_ECONOMY = [
    { name: 'Oneiric Pearl', favour: 625 },
    { name: 'Baited Riddle', favour: 625 },
    { name: 'Vestige of a Starlit Reverie', favour: 3125 },
    { name: 'Sample of Lacreous Affection', favour: 3125 },
  ];

  // The qualities worth reading off the Myself tab for this festival. Every
  // one is a real quality (checked on the wiki), not an item -- Thalassic
  // Favour included, which is why it is absent from the possessions scrape.
  const FOTZ_QUALITIES = [
    'Thalassic Favour',
    'Fivefold Devotion',
    'Full Fathom Five',
    'Sights at the Festival',
    'A Fruitless Harvest',
    // Decides which supplication options you are offered, and is re-rolled by
    // every one you take.
    'Airs of a Barren Zee',
    FOTZ_BRIDE_QUALITY,
  ];

  // --- the card table ----------------------------------------------------
  //
  // One entry per card in the diving deck, plus the storylet at the bottom of
  // the trench. Each `opts` entry is one claim you can make and the depths it
  // is offered at, so "what can I take from this card at depth 3" is a filter
  // rather than a special case; A Cabin-Fragment pays a different amount at
  // every one of the five, so it simply has five entries with the same text.
  //
  //   favour  the Thalassic Favour the reward trades for, in total
  //   gain    what you actually receive
  //   coral   a coral, i.e. one of three unique items in week two
  //   item    a named unique piece of equipment
  //   bride   the Accomplishment at the bottom of the trench
  //
  // `min` is the card's own Full Fathom Five requirement, which is also the
  // only depth signal available without reading a quality (see `fotzDepth`).
  // `strict` marks the two names generic enough that some other card in London
  // could plausibly share one; those are badged only where we can tell we are
  // at the festival -- the same treatment The Sound of Wings gets at zee.
  const FOTZ_CARDS = [
    {
      name: 'A Reef of Wrecks',
      opts: [{
        text: 'Claim a piece of cast-off coral', depths: [1, 5], favour: 0,
        coral: 'Grasping Coral',
      }],
    },
    {
      name: 'A Rusting Anchor',
      opts: [{
        text: 'Claim a piece of layered coral', depths: [1, 5], favour: 0,
        coral: 'Gorgonian Reef-Rock',
      }],
    },
    {
      name: 'Among the Deep-Fish',
      opts: [{
        text: 'Claim a piece of cast-off coral', depths: [1, 5], favour: 0,
        coral: 'Barnacled Headpiece',
      }],
    },
    {
      name: 'An Obscured Glitter',
      opts: [{
        text: 'Claim a piece of shining coral', depths: [1, 5], favour: 0,
        coral: 'Spinebound Oddity',
      }],
    },
    {
      name: 'Old Wounds', strict: true,
      opts: [{
        text: 'Claim a piece of cast-off coral', depths: [1, 5], favour: 0,
        coral: 'Pedestrian Polyp',
      }],
    },
    {
      name: 'A Graveyard of Derelict Debris',
      opts: [{
        text: 'Claim a piece of bulbous coral', depths: [1, 5], favour: 0,
        coral: 'Rust-Eaten Ration',
      }],
    },
    {
      name: 'A Cabin-Fragment',
      opts: [
        { text: 'Take what you can', depths: [1, 1], favour: 50, gain: 'Witch-Stone ×5' },
        { text: 'Take what you can', depths: [2, 2], favour: 100, gain: 'Witch-Stone ×10' },
        {
          text: 'Take what you can', depths: [3, 3], favour: 200,
          gain: 'Witch-Stone ×10, Collection of Zee-Glass ×5',
        },
        {
          text: 'Take what you can', depths: [4, 4], favour: 300,
          gain: 'Collection of Zee-Glass ×5, Long-Lost Zee Trunk',
        },
        {
          text: 'Take what you can', depths: [5, 5], favour: 400,
          gain: 'Witch-Stone ×10, Collection of Zee-Glass ×5, Long-Lost Zee Trunk',
        },
      ],
    },
    {
      name: 'Easy Pickings', strict: true,
      opts: [
        {
          text: 'Claim an assortment of cast-off oddments', depths: [1, 1], favour: 100,
          gain: 'Sodden Mass',
        },
        {
          text: 'Claim an assortment of cast-off oddments', depths: [2, 3], favour: 150,
          gain: 'Sodden Mass, Salt-Smoothed Shiv',
        },
        {
          text: 'Claim an assortment of cast-off oddments', depths: [4, 5], favour: 300,
          gain: 'Sodden Mass ×2, Salt-Smoothed Shiv ×2',
        },
      ],
    },
    {
      name: 'Unlucky Prisoner',
      opts: [
        {
          text: 'Rummage through the remains', depths: [1, 1], favour: 50,
          gain: 'Salt-Smoothed Shiv',
        },
        {
          text: 'Rummage through the remains', depths: [2, 2], favour: 100,
          gain: 'Salt-Smoothed Shiv ×2',
        },
        {
          text: 'Rummage through the remains', depths: [3, 3], favour: 150,
          gain: 'Salt-Smoothed Shiv ×3',
        },
        {
          text: 'Rummage through the remains', depths: [4, 4], favour: 125,
          gain: 'Skull in Coral (or Urchin Spine)',
        },
        {
          text: 'Rummage through the remains', depths: [5, 5], favour: 175,
          gain: 'Skull in Coral (or Urchin Spine), Salt-Smoothed Shiv',
        },
      ],
      note: 'The only card that pays a Skull in Coral, which is the one treasure that '
        + 'outlives the festival.',
    },
    {
      name: 'Tangled in the Rigging', min: 2,
      opts: [
        {
          text: 'Liberate the Wrecking Boots', depths: [2, 3], favour: 100,
          item: 'Wrecking Boots',
        },
        {
          text: 'Retrieve a Semi-Automated Mary Lloyd', depths: [4, 5], favour: 200,
          item: 'Semi-Automated Mary Lloyd',
        },
      ],
    },
    {
      name: 'Well-Disguised Trinkets',
      opts: [
        {
          text: 'Snatch a Cured Jillyfleur Cloak', depths: [1, 2], favour: 100,
          item: 'A Cured Jillyfleur Cloak',
        },
        {
          text: 'Retrieve a Faceted Decanter of Drownie Effluvia', depths: [3, 5], favour: 300,
          item: 'A Faceted Decanter of Drownie Effluvia',
        },
      ],
    },
    {
      name: 'A Shattered Prow', min: 2,
      opts: [
        {
          text: 'Dive for a Nuncian Pocket Watch', depths: [2, 4], favour: 150,
          item: 'Nuncian Pocket Watch',
        },
        {
          text: 'Pry free a Scrimshander Carving Knife', depths: [5, 5], favour: 400,
          item: 'Scrimshander Carving Knife',
        },
      ],
    },
    // Not a card: the storylet the bottom of the trench reveals. It is in this
    // table because `eachCardName` decorates an opened storylet's heading too,
    // and because this is the one place at the festival where the right move
    // is to take NO treasure -- the Accomplishment is worth more.
    {
      name: 'Her Fivefold Symmetry', min: 5, storylet: true,
      opts: [{
        text: 'Beg audience with this ancient power', depths: [5, 5], favour: 0,
        bride: true, gain: 'Discovered: the Pentamerous Bride, and no item',
      }],
      note: 'Foregoes a treasure. The Accomplishment is what lets the King-in-Coral '
        + 'hand you a Weeping Litter-Cyst in week two.',
    },
  ];

  const FOTZ_BY_NAME = new Map(
    FOTZ_CARDS.map(function (c) { return [normalizeName(c.name), c]; }));

  const FOTZ_CORAL_BY_NAME = new Map(
    FOTZ_CORALS.map(function (c) { return [c.coral, c]; }));

  function lookupFotzCard(name) {
    return FOTZ_BY_NAME.get(normalizeName(name)) || null;
  }

  // --- where you are -----------------------------------------------------
  //
  // **Both halves are now CONFIRMED**, captured verbatim in-game 2026-09-03,
  // which makes this an exact list of the SPITE_AREAS kind rather than the
  // permissive guess it started as:
  //
  //   on the island   "It's ‹name›! Welcome to Mutton Island, delicious friend!"
  //   mid-dive        "It's ‹name›! Welcome to the Royal Approach, delicious friend!"
  //
  // Note the game writes the second with a lower-case "the". It does not
  // matter -- `normalizeName` folds case -- but it is worth knowing that the
  // wiki's `location = The Royal Approach` and the game's greeting are the
  // same string only after normalising.
  //
  // Wreckers' Cove is the one entry still unread: the week-two market lives
  // there by name, though the storylets are filed under Mutton Island, so it
  // is kept in case the greeting changes for the market. An extra entry can
  // only widen the allow-list, never wrongly block; a MISSING one would
  // wrongly block, which is the risk that matters now that this list is
  // allowed to say no.
  const FOTZ_AREAS = [
    'Mutton Island',
    'The Royal Approach',
    'Wreckers’ Cove',
    'Wreckers\' Cove',
  ].map(normalizeName);

  // The one you are actually underwater in. Separate from the list above
  // because it answers a different question -- see `forgetStaleDepth`.
  const FOTZ_DIVE_AREAS = ['The Royal Approach'].map(normalizeName);

  function inFotzArea() {
    const area = normalizeName(currentArea());
    return !!area && FOTZ_AREAS.indexOf(area) !== -1;
  }

  function inDiveArea() {
    const area = normalizeName(currentArea());
    return !!area && FOTZ_DIVE_AREAS.indexOf(area) !== -1;
  }

  // The sturdier confirmation, and the one that needs no unverified markup at
  // all: nine of the eleven card names could not plausibly belong to anything
  // else in London, so one of them in the hand proves where you are. A
  // three-card dive hand can hardly avoid holding at least one.
  function fotzHandConfirms() {
    let seen = false;
    eachCardName(function (host, name) {
      if (seen) return;
      const card = lookupFotzCard(name);
      if (card && !card.strict) seen = true;
    });
    return seen;
  }

  // THREE answers, not two, and the middle one is the point of having captured
  // both greetings:
  //
  //   'yes'      the greeting names a festival area, or the hand proves it
  //   'no'       the greeting names somewhere else entirely -- badge nothing
  //   'unknown'  there is no greeting to read; the card table is the only scope
  //
  // 'no' is new. Until both areas were confirmed this could only ever say yes,
  // because refusing on an unverified list risked blacking out the feature in
  // the very place it is for. Now it can refuse, which is what keeps a Fruits
  // of the Zee badge off a card somewhere else in London that happens to share
  // a name -- the same tightening `SPITE_AREAS` got.
  function fotzWhere() {
    if (!normalizeName(currentArea())) return 'unknown';
    if (inFotzArea()) return 'yes';
    // Somewhere unexpected, but an unmistakable dive hand still outranks a
    // list that might be missing an area nobody has visited yet.
    return fotzHandConfirms() ? 'yes' : 'no';
  }

  // --- how deep you are --------------------------------------------------
  //
  // Full Fathom Five, 1 to 5, and nearly everything the badge says turns on
  // it. Three sources, best first:
  //
  //  1. A LIVE quality read. `readQualities` finds `li.quality-item`, which is
  //     verified markup on the Myself tab. **In practice this never fires**:
  //     a hand captured mid-dive (2026-09-03) shows FL renders no quality
  //     items anywhere on the diving screen, so the depth is only ever the one
  //     you set yourself. It is kept because it costs one failed
  //     `querySelectorAll` and would start working for nothing if FL ever put
  //     the quality on that screen -- but do not plan around it.
  //     It is deliberately live-only, with no fall back to the cache: a banked
  //     depth from three minutes ago is a WRONG answer rather than a stale
  //     one, because it changes with every successful dive.
  //  2. What you set yourself in the panel, kept in sessionStorage -- a dive
  //     is one sitting, and a depth should not outlive the tab.
  //  3. Nothing. Then the badge shows the range across every depth and says
  //     so. The card table still gives a FLOOR (A Shattered Prow and Tangled
  //     in the Rigging need depth 2, Her Fivefold Symmetry depth 5), which is
  //     used to trim impossible depths out of that range -- but never to
  //     invent a single depth.
  const FOTZ_DEPTH_KEY = 'fl-ux-fotz-depth';
  const FOTZ_QUALITY_DEPTH = 'Full Fathom Five';

  function fotzLiveDepth() {
    let scan = null;
    try {
      scan = readQualities();
    } catch (e) {
      return null;
    }
    if (!scan) return null;
    const q = scan.values.get(FOTZ_QUALITY_DEPTH);
    if (!q || !(q.level >= 1) || q.level > 5) return null;
    return q.level;
  }

  function fotzSetDepth(depth) {
    try {
      if (depth == null) sessionStorage.removeItem(FOTZ_DEPTH_KEY);
      else sessionStorage.setItem(FOTZ_DEPTH_KEY, String(depth));
    } catch (e) { /* private mode; the badge just stays on the range */ }
  }

  function fotzChosenDepth() {
    try {
      const raw = sessionStorage.getItem(FOTZ_DEPTH_KEY);
      const n = raw == null ? NaN : Number(raw);
      return n >= 1 && n <= 5 ? n : null;
    } catch (e) {
      return null;
    }
  }

  // The floor the hand itself proves, or null. Only ever a lower bound.
  function fotzDepthFloor() {
    let floor = 0;
    eachCardName(function (host, name) {
      const card = lookupFotzCard(name);
      if (card && card.min && card.min > floor) floor = card.min;
    });
    return floor || null;
  }

  // A depth you set by hand outlives the dive it was set for -- it is kept for
  // the whole tab session -- and the moment you surface it is not stale, it is
  // WRONG: the next dive starts at 1. Until the mid-dive greeting was captured
  // there was no way to notice you had left. Now there is, so leaving the
  // Royal Approach throws the setting away and the badges go back to showing
  // the range until you say otherwise.
  //
  // Only ever acts on a greeting it can actually read. An unreadable one means
  // "no idea where you are", which is not grounds for discarding anything.
  function forgetStaleDepth() {
    const area = normalizeName(currentArea());
    if (!area || inDiveArea()) return;
    if (fotzChosenDepth() != null) fotzSetDepth(null);
  }

  // { depth, source } -- source is 'quality', 'set', or null for neither.
  function fotzDepth() {
    const live = fotzLiveDepth();
    if (live) return { depth: live, source: 'quality' };
    const chosen = fotzChosenDepth();
    if (chosen) return { depth: chosen, source: 'set' };
    return { depth: null, source: null };
  }

  // --- reading a card ----------------------------------------------------

  function fotzOptionAt(opt, depth) {
    return depth >= opt.depths[0] && depth <= opt.depths[1];
  }

  // Every claim this card offers at `depth`; at a known depth that is always
  // exactly one, which is what lets the badge be a single number. With no
  // depth it is every claim, minus any the floor rules out.
  function fotzOptionsAt(card, depth, floor) {
    if (depth) return card.opts.filter(function (o) { return fotzOptionAt(o, depth); });
    if (!floor) return card.opts.slice();
    return card.opts.filter(function (o) { return o.depths[1] >= floor; });
  }

  // What one claim would hand you that you haven't already got. `holdings` is
  // the ownership reading; when it is null nothing is known, and this returns
  // null so the badge can say as much instead of guessing. Pure, so the marks
  // are testable.
  //
  //   holdings = { has(name) -> bool, bride: bool, sig: string }
  function fotzMissingFrom(opt, holdings) {
    if (!holdings) return null; // can't tell
    if (opt.coral) {
      const coral = FOTZ_CORAL_BY_NAME.get(opt.coral);
      if (!coral) return [];
      // A coral whose three items have not been published yet. The BADGE's
      // question is "should I take this card?", and the answer is an
      // unambiguous yes -- it is new this year and nobody can already hold
      // what does not exist -- so it counts as missing here, under a
      // placeholder name. (The CHECKLIST asks a different question, "how many
      // do I still need", and refuses to count items it cannot name: see
      // `fotzCollection`. The two differ on purpose.)
      if (!coral.variants) return [coral.pendingLabel || coral.slot];
      return coral.variants.filter(function (v) { return !holdings.has(v); });
    }
    if (opt.item) return holdings.has(opt.item) ? [] : [opt.item];
    if (opt.bride) return holdings.bride ? [] : [FOTZ_BRIDE_QUALITY];
    return []; // pure economy treasure: nothing to collect
  }

  // Does this card offer anything collectable at all? Independent of what you
  // own, so a treasure-only card stays unmarked rather than wearing a tick it
  // hasn't earned.
  function fotzOffersRare(opts) {
    return opts.some(function (o) { return !!(o.coral || o.item || o.bride); });
  }

  // --- what is still out there, and how deep it is -----------------------
  //
  // The question the checklist cannot answer: a dive commits you to a depth,
  // and the unique rewards are not spread evenly down the trench. Some are
  // only deep (the Scrimshander Knife is depth 5 and nowhere else) and -- the
  // part that actually costs people items -- some are only SHALLOW. A Cured
  // Jillyfleur Cloak is depths 1-2; dive past 2 and it is gone for that dive.
  // So "what am I missing" and "how deep should I go" are different questions,
  // and this answers the second.
  //
  // Currency-only cards fall out for free: `fotzMissingFrom` returns an empty
  // list for anything that pays nothing but Favour, so A Cabin-Fragment, Easy
  // Pickings and Unlucky Prisoner never appear here.
  //
  // Pure, and derived from FOTZ_CARDS rather than from a second table -- the
  // depths are already stated there once and must not be stated twice.
  function fotzUniquesByDepth(holdings) {
    const rows = [];
    for (let depth = 1; depth <= 5; depth++) {
      const entries = [];
      for (const card of FOTZ_CARDS) {
        for (const opt of fotzOptionsAt(card, depth, null)) {
          const missing = fotzMissingFrom(opt, holdings);
          if (!missing || !missing.length) continue;
          const coral = opt.coral ? FOTZ_CORAL_BY_NAME.get(opt.coral) : null;
          entries.push({
            card: card.name,
            coral: opt.coral || null,
            // Its `missing` is one placeholder, not one real item, so the
            // renderer must not print "×1" and imply two of three are done.
            pending: !!(coral && !coral.variants),
            // How many of the coral you are already sitting on, the same
            // number the card badge shows in brackets.
            held: opt.coral && holdings && holdings.count ? holdings.count(opt.coral) : 0,
            bride: !!opt.bride,
            label: opt.coral || opt.item || FOTZ_BRIDE_QUALITY,
            missing: missing,
            from: opt.depths[0],
            to: opt.depths[1],
            // The two marks worth drawing: this is the shallowest depth it
            // appears at, and this is the last one before it is out of reach.
            first: opt.depths[0] === depth,
            last: opt.depths[1] === depth,
          });
        }
      }
      rows.push({ depth: depth, entries: entries });
    }
    return rows;
  }

  // The corals are claimable at every depth, so listing them five times says
  // nothing. Split them off and state them once.
  function fotzSplitUniques(rows) {
    const everywhere = new Map();
    for (const row of rows) {
      for (const entry of row.entries) {
        if (entry.from === 1 && entry.to === 5 && !everywhere.has(entry.label)) {
          everywhere.set(entry.label, entry);
        }
      }
    }
    return {
      everywhere: Array.from(everywhere.values()),
      byDepth: rows.map(function (row) {
        return {
          depth: row.depth,
          entries: row.entries.filter(function (e) { return !everywhere.has(e.label); }),
        };
      }),
    };
  }

  const FOTZ_CLASS = 'fl-ux-fotz';
  const FOTZ_FLAG = 'flUxFotz';
  const FOTZ_MARK_NEED = '★';   // something here you haven't got
  const FOTZ_MARK_DONE = '✓';   // you hold everything this card offers
  // '?' rather than the '–' the Factions pips use for an unknown: this mark is a
  // PREFIX to a number, and '–400' reads as minus four hundred.
  const FOTZ_MARK_UNSURE = '?'; // no Possessions read, so no claim either way

  // Colour is the trade-in value, so a hand ranks itself at a glance. The two
  // kinds that pay no Favour at all -- a coral, and the Bride at the bottom of
  // the trench -- are coloured by whether you still NEED them instead, since
  // for those the Favour column isn't the question being asked.
  const FOTZ_COLOR_NEED = '#b8912f'; // the gold the launcher uses
  const FOTZ_COLOR_HELD = '#4a5560';
  const FOTZ_COLOR_UNSURE = '#6b6b6b';

  function fotzColor(favour) {
    if (favour >= 400) return '#b8912f';
    if (favour >= 300) return '#357a62';
    if (favour >= 175) return '#54783e';
    if (favour >= 125) return '#78733a';
    if (favour >= 100) return '#7a5c3a';
    return '#6b6b6b';
  }

  function fotzRangeText(favours) {
    const lo = Math.min.apply(null, favours);
    const hi = Math.max.apply(null, favours);
    return lo === hi ? String(lo) : lo + '–' + hi;
  }

  function fotzDepthWord(opt) {
    return opt.depths[0] === opt.depths[1]
      ? 'Depth ' + opt.depths[0]
      : 'Depths ' + opt.depths[0] + '–' + opt.depths[1];
  }

  // The badge, as a pure { text, color, title } spec. `depth` may be null.
  function fotzBadgeSpec(card, depth, source, floor, holdings) {
    const opts = fotzOptionsAt(card, depth, floor);
    if (!opts.length) return null; // nothing claimable at this depth

    const rare = fotzOffersRare(opts);
    let missing = [];
    let unsure = false;
    for (const opt of opts) {
      const gone = fotzMissingFrom(opt, holdings);
      if (gone == null) unsure = true;
      else missing = missing.concat(gone);
    }
    const mark = !rare ? ''
      : (unsure ? FOTZ_MARK_UNSURE : (missing.length ? FOTZ_MARK_NEED : FOTZ_MARK_DONE));

    const favours = opts.map(function (o) { return o.favour; })
      .filter(function (v) { return v > 0; });
    const value = favours.length ? fotzRangeText(favours) : null;

    // How many of this card's coral you are already holding. Every coral card
    // otherwise wears an identical `★coral`, which flattens a real difference:
    // one you have never seen and one you already have two of are not the same
    // card to draw. `(N)` is only shown when N > 0, so a hand of untouched
    // corals stays as quiet as it was.
    const coralOpt = opts.filter(function (o) { return o.coral; })[0] || null;
    const coralHeld = coralOpt && holdings && holdings.count
      ? holdings.count(coralOpt.coral) : 0;

    const label = value != null ? value
      : (opts.some(function (o) { return o.bride; })
        ? 'Bride'
        : 'coral' + (coralHeld ? ' (' + coralHeld + ')' : ''));

    const color = value != null
      ? fotzColor(Math.max.apply(null, favours))
      : (unsure ? FOTZ_COLOR_UNSURE : (missing.length ? FOTZ_COLOR_NEED : FOTZ_COLOR_HELD));

    const lines = [card.name];
    lines.push(depth
      ? 'Your depth: ' + depth + (source === 'quality'
        ? ' (read from Full Fathom Five)'
        : ' (as set in the Fruits of the Zee panel)')
      : 'Depth unknown, so every depth is listed'
        + (floor ? ', from ' + floor + ' up — this hand proves at least that' : '')
        + '. Set it in ⚙ UX → Fruits of the Zee for one exact figure.');

    for (const opt of opts) {
      let line = (depth ? '' : fotzDepthWord(opt) + ': ') + opt.text;
      if (opt.favour > 0) line += ' — ' + opt.favour + ' Favour';
      if (opt.gain) line += ' (' + opt.gain + ')';
      lines.push(line);
      if (opt.coral) {
        const coral = FOTZ_CORAL_BY_NAME.get(opt.coral);
        // What the "(N)" on the badge means, and what it implies. One coral
        // becomes one item, so needing three variants and holding one coral
        // means two more dives -- that subtraction is the useful form of the
        // number, and there is room for it here where there is none on a badge.
        if (coralHeld) {
          const gone = coral && coral.variants ? fotzMissingFrom(opt, holdings).length : null;
          const short = gone == null ? null : gone - coralHeld;
          lines.push('  You are holding ' + coralHeld + ' ' + opt.coral
            + (coralHeld === 1 ? '' : 's') + ' already'
            + (short == null ? '.'
              : (gone === 0
                ? ' — spare, since you already hold all three of its items.'
                : (short > 0
                  ? ' — ' + short + ' more ' + (short === 1 ? 'is' : 'are')
                    + ' needed to cover what is missing.'
                  : ' — enough to cover everything still missing here.'))));
        }
        if (coral && !coral.variants) {
          lines.push('  ' + opt.coral + ' → one of three ' + coral.slot + ' in week two.');
          lines.push('  ' + coral.pending);
        } else {
          lines.push('  ' + opt.coral + ' → one of three '
            + (coral ? coral.slot + ' items' : 'items') + ' in week two, and which one is '
            + 'decided by Sights at the Festival: '
            + FOTZ_BANDS.map(function (band, i) {
              return band.lo + '–' + band.hi + ' ' + (coral ? coral.variants[i] : '?');
            }).join(', ') + '.');
        }
      }
      if (opt.item) {
        lines.push('  ' + opt.item + (holdings
          ? (holdings.has(opt.item) ? ' — you already have one.' : ' — you do NOT have one yet.')
          : ' — whether you have one is unknown; open the Fruits of the Zee panel to '
            + 'read your Possessions.'));
      }
    }
    if (missing.length) {
      lines.push(FOTZ_MARK_NEED + ' Still missing: ' + missing.join(', ') + '.');
    } else if (rare && !unsure) {
      lines.push(FOTZ_MARK_DONE + ' You already hold everything this card offers.');
    }
    if (card.note) lines.push(card.note);
    lines.push('One card’s reward per dive. Diving deeper is free, but failing the dive '
      + 'ends it and hands you menaces.');

    return { text: mark ? mark + label : label, color: color, title: lines.join('\n') };
  }

  // --- badging the supplication branches ---------------------------------
  //
  // The one place in this script that decorates a storylet's OPTIONS rather
  // than a card. Markup captured 2026-09-03, verbatim:
  //
  //   <div class="media branch media--branch" data-branch-id="259494">
  //     <div class="media__left branch__left"> … </div>
  //     <div class="media__body branch__body"><div>
  //       <div class="branch__plan-buttonlet"> … </div>
  //       <h2 class="media__heading heading heading--3 branch__title">Perform
  //         in a Mutton Island mystery play</h2>
  //
  // The badge goes AFTER the `h2`, the same way it does for a card heading --
  // never inside it, so anything reading the heading's text still sees the
  // plain name. (`wiki-links.js` deliberately leaves `.branch__title` alone,
  // so nothing else is decorating these.)
  //
  // Note the game already tells you what an option is gated on, with its own
  // requirement icons. What it never says is which of your attributes the
  // reward scales off -- and since Airs decides which options you are even
  // offered, that is the whole decision. So that is all the badge says.

  const FOTZ_BRANCH_CLASS = 'fl-ux-fotz-branch';
  const FOTZ_BRANCH_FLAG = 'flUxFotzBranch';
  const FOTZ_BRANCH_SELECTOR = '.branch__title';

  // The storylet these branches belong to, from the same capture: the game
  // prefixes the wiki's title, so it reads "Fruits of the Zee: Supplication on
  // the Shore". Matched loosely on the distinctive half.
  function onSupplicationStorylet() {
    const heads = document.querySelectorAll('.storylet-root__heading');
    for (const head of heads) {
      if (normalizeName(headingName(head)).indexOf('supplication on the shore') !== -1) return true;
    }
    return false;
  }

  function fotzBranchSpec(opt) {
    const stat = opt.stat ? FOTZ_STATS[opt.stat] : null;
    const lines = [opt.text];
    if (stat) {
      lines.push('Scales off ' + opt.stat + ': the better your base ' + opt.stat
        + ', the more of it you get.');
      lines.push('Gives: ' + opt.gain + ', and Fivefold Devotion +4 CP.');
      lines.push('Offered while Airs of a Barren Zee is ' + opt.airs + '.');
      lines.push('Every option here pays the same +4 CP, so the attribute is the only '
        + 'thing that separates them — but Airs decides which are on offer, and it is '
        + 're-rolled each time you act, so you cannot always have the one you want.');
    }
    if (opt.note) lines.push(opt.note);

    return {
      text: stat ? stat.icon + ' ' + opt.stat : opt.badge,
      color: stat ? stat.badge : (opt.warn ? '#8a3b3b' : '#4a5560'),
      title: lines.join('\n'),
    };
  }

  function fotzSupplicationBranches() {
    const here = onSupplicationStorylet();
    document.querySelectorAll(FOTZ_BRANCH_SELECTOR).forEach(function (head) {
      const name = headingName(head);
      const opt = name ? lookupFotzBranch(name) : null;
      // A name generic enough to belong elsewhere is only badged where the
      // storylet above it confirms where we are.
      const spec = opt && (!opt.strict || here) ? fotzBranchSpec(opt) : null;
      attachBadge(head, {
        cls: FOTZ_BRANCH_CLASS,
        flag: FOTZ_BRANCH_FLAG,
        value: name,
        spec: spec,
        place: 'after',
      });
    });
  }

  function fotzCardRatings() {
    // Surfacing invalidates a depth you set by hand, and this is the pass that
    // notices. Before the depth is read, so the badges never quote it once.
    forgetStaleDepth();

    const where = fotzWhere();
    const at = fotzDepth();
    const floor = at.depth ? null : fotzDepthFloor();
    const holdings = fotzHoldings();
    eachCardName(function (host, name, place, style) {
      const card = lookupFotzCard(name);
      // Three gates, narrowest first. Somewhere the greeting places OUTSIDE
      // the festival, nothing is ours -- and clearing rather than skipping is
      // what takes the badges off a hand you walked away with. Where the
      // greeting can't be read at all the card table is the only scope, and
      // the two generic names sit that one out, the same way The Sound of
      // Wings does when we can't tell we're at zee.
      const spec = card && where !== 'no' && (!card.strict || where === 'yes')
        ? fotzBadgeSpec(card, at.depth, at.source, floor, holdings)
        : null;
      attachBadge(host, {
        cls: FOTZ_CLASS,
        flag: FOTZ_FLAG,
        // The flag has to move when the DEPTH or your holdings change, not
        // only when the card does -- otherwise setting your depth leaves every
        // badge already in the hand quoting the old one.
        value: name + '@' + (at.depth || 'x') + '/' + (holdings ? holdings.sig : 'x'),
        spec: spec,
        place: place,
        style: style,
      });
    });
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
  const LAUNCHER_BUTTON_ID = 'fl-ux-launcher-button';

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
     {
      id: 'zailing',
      icon: '⚓',
      label: 'Zailing',
      hint: 'Routes, Zee Peril, Troubled Waters and every card at zee',
      render: renderZailingPanel,
    },
    {
      id: 'fruits-of-the-zee',
      icon: '🐚',
      label: 'Fruits of the Zee',
      hint: 'What the festival still owes you, what your treasures trade for, and '
        + 'what every diving card pays',
      render: renderFotzPanel,
    },
  ];

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
    if (launcherPanelHost) {
      launcherPanelHost.style.margin = stackGap;
      launcherPanelHost.style.maxWidth = Math.max(240, maxWidth) + 'px';
      launcherPanelHost.style.maxHeight = Math.max(160, maxHeight) + 'px';
    }
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

    const menu = h('div', {
      css: 'display:none;margin-bottom:8px;min-width:230px;background:' + UI.bg
        + ';border:1px solid ' + UI.line + ';border-radius:4px;overflow:hidden;'
        + 'box-shadow:0 6px 24px rgba(0,0,0,.55);',
    }, [
      PANELS.map(function (panel) {
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
      }),
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
      positionLauncher();
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
    document.addEventListener('click', function (e) {
      if (root.contains(e.target)) return;
      if (button === e.target || button.contains(e.target)) return;
      closeMenu();
    });

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
      const key = normalizeName(name);
      const count = itemCountFromLabel(label);
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

  // Refreshes everything both panels read, off the same two page loads --
  // booting the SPA twice for the Factions panel and twice more for Fruits of
  // the Zee would be silly, so one pass banks both.
  function refreshBackgroundState() {
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
        if (bankFotzQualities(scan)) changed = true;
      }
      const here = readPossessions();
      if (!here || !here.size) {
        const held = await loadInFrame('/possessions', function (doc) {
          const got = readPossessionCounts(doc);
          return got && got.size > 20 ? got : null;
        });
        if (bankPossessions(held ? new Set(held.keys()) : null)) changed = true;
        if (bankItemCounts(held)) changed = true;
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

  // === panel: zailing ====================================================
  //
  // The reference half of the zailing work: the numbers that decide a voyage
  // before any single card does -- how much Zailing... a route needs, what Zee
  // Peril each region sets every broad challenge to, which menace turns
  // Troubled Waters 7 into which black card, and where the nearest reset is --
  // plus the whole card table the badges are drawn from, searchable.
  //
  // It opens with whatever zee cards are on screen right now, ranked, because
  // that is the question you actually have while the panel is open.

  function zeeHandRows() {
    const seen = new Map();
    eachCardName(function (host, name) {
      const card = zeeCardFor(name);
      if (card && !seen.has(card.name)) seen.set(card.name, card);
    });
    const cards = Array.from(seen.values());
    cards.sort(function (a, b) {
      // Urgent first: they are dealt before everything else anyway, so a hand
      // holding one is really a hand of one.
      if (!!a.urgent !== !!b.urgent) return a.urgent ? -1 : 1;
      const la = bestZeeLine(a), lb = bestZeeLine(b);
      if (!la || !lb) return la ? -1 : 1;
      // Same order the badge is chosen in: cheapest first, faster to break a tie.
      const dt = zeeTwScore(la.opt) - zeeTwScore(lb.opt);
      if (dt) return dt;
      return zeeProgScore(lb.opt.prog) - zeeProgScore(la.opt.prog);
    });
    return cards;
  }

  function zeeBadgeNode(card) {
    return makeBadge(zeeBadgeSpec(card), ZEE_CLASS);
  }

  function zeeCardRow(card) {
    const best = bestZeeLine(card);
    const opt = best && best.opt;
    const row = h('tr', null, [
      h('td', { css: TD + 'white-space:nowrap;' }, [
        wikiLink(card.name, card.name),
        card.urgent ? h('span', { css: 'color:#7fae92;margin-left:5px;', title: 'A black card: urgent, so it is dealt before every other zee card.' }, ['urgent']) : null,
      ]),
      h('td', { css: TD + 'text-align:center;' }, [zeeBadgeNode(card)]),
      h('td', { css: TD + 'color:' + UI.dim + ';' }, [
        opt ? h('div', null, [
          h('span', { css: 'color:' + UI.text + ';' }, [opt.text]),
          ' — ' + zeeTwWord(opt) + ', ' + zeeSpeedWord(opt.prog) + (opt.ch ? ' (' + opt.ch + ')' : ''),
        ]) : null,
        best && best.gated ? h('div', { css: 'color:#8a6b3b;' }, ['Every line here is gated on something.']) : null,
        card.note ? h('div', null, [card.note]) : null,
      ]),
    ]);
    // The search box filters on this rather than on textContent, so a term can
    // match an option you can't see in the collapsed row.
    row.dataset.zeeSearch = (card.name + ' ' + card.where.join(' ') + ' ' + (card.note || '') + ' '
      + card.opts.map(function (o) { return o.text + ' ' + (o.need || '') + ' ' + (o.gain || ''); }).join(' ')).toLowerCase();
    return row;
  }

  function renderZailingPanel() {
    const hand = zeeHandRows();

    const section = function (title, children) {
      return h('div', { css: 'margin-top:14px;' }, [
        h('div', {
          css: 'font:bold 11px ' + UI.font + ';letter-spacing:.06em;text-transform:uppercase;'
            + 'color:' + UI.accent + ';margin-bottom:5px;',
        }, [title]),
        children,
      ]);
    };
    const table = function (heads, rows) {
      return h('table', { css: 'width:100%;border-collapse:collapse;' }, [
        h('thead', null, [h('tr', null, heads.map(function (head) {
          return h('th', { css: TH + (head.right ? 'text-align:right;' : ''), title: head.title || '' }, [head.text]);
        }))]),
        h('tbody', null, rows),
      ]);
    };

    // --- the hand ---------------------------------------------------------
    const handBlock = hand.length
      ? h('div', {
          css: 'margin:10px 0 0;padding:8px 10px;border-left:3px solid ' + UI.accent
            + ';background:' + UI.bgAlt + ';font-size:12px;line-height:1.6;',
        }, [
          h('div', { css: 'color:' + UI.accent + ';font-weight:bold;' }, [
            hand.length === 1 ? '1 zee card on screen' : hand.length + ' zee cards on screen',
            h('span', { css: 'color:' + UI.dim + ';font-weight:normal;' }, [' — best first']),
          ]),
          hand.map(function (card) {
            const best = bestZeeLine(card);
            return h('div', null, [
              zeeBadgeNode(card),
              h('span', { css: 'margin-left:6px;' }, [card.name]),
              best ? h('span', { css: 'color:' + UI.dim + ';' },
                [' — ' + best.opt.text + ' (' + zeeTwWord(best.opt) + ', ' + zeeSpeedWord(best.opt.prog) + ')']) : null,
            ]);
          }),
        ])
      : h('div', {
          css: 'margin:10px 0 0;padding:8px 10px;border-left:3px solid ' + UI.line
            + ';background:' + UI.bgAlt + ';color:' + UI.dim + ';font-size:12px;line-height:1.5;',
        }, ['No zee cards on screen. Everything below is reference material for when there are.']);

    // --- the searchable card table ---------------------------------------
    const REGION_ORDER = ['any', 'Home Waters', "Shepherd's Wash", 'The Sea of Voices',
      'The Salt Steppe', 'The Pillared Sea', 'Stormbones', 'The Snares'];
    const REGION_TITLE = { any: 'Drawn anywhere at zee' };
    const cardRows = [];
    for (const region of REGION_ORDER) {
      const inRegion = ZEE_CARDS.filter(function (c) {
        return c.where.indexOf(region) !== -1 && (region === 'any' || c.where.indexOf('any') === -1);
      });
      if (!inRegion.length) continue;
      const header = h('tr', null, [h('td', {
        colSpan: 3,
        css: 'padding:8px 8px 3px;font:bold 11px ' + UI.font + ';letter-spacing:.05em;'
          + 'text-transform:uppercase;color:' + UI.dim + ';border-bottom:1px solid ' + UI.line + ';',
      }, [REGION_TITLE[region] || region])]);
      header.dataset.zeeGroup = '1';
      cardRows.push(header);
      for (const card of inRegion) cardRows.push(zeeCardRow(card));
    }

    const search = h('input', {
      type: 'text',
      placeholder: 'filter cards, options, requirements…',
      css: 'flex:1;min-width:140px;box-sizing:border-box;padding:3px 7px;background:' + UI.bgAlt
        + ';color:' + UI.text + ';border:1px solid ' + UI.line + ';border-radius:3px;font:12px ' + UI.font + ';',
      on: {
        input: function (e) {
          const term = String(e.currentTarget.value || '').trim().toLowerCase();
          for (const row of cardRows) {
            if (row.dataset.zeeGroup) continue;
            row.hidden = !!term && row.dataset.zeeSearch.indexOf(term) === -1;
          }
          // A region heading with nothing left under it is just noise.
          let group = null, shown = 0;
          for (const row of cardRows) {
            if (row.dataset.zeeGroup) {
              if (group) group.hidden = shown === 0;
              group = row; shown = 0;
            } else if (!row.hidden) shown++;
          }
          if (group) group.hidden = shown === 0;
        },
      },
    });

    return h('div', { css: 'padding:0 12px 12px;' }, [
      handBlock,

      section('Getting there', h('div', null, [
        table([
          { text: 'Route' },
          { text: 'Zailing…', right: true, title: 'How much Zailing... the leg needs.' },
          { text: 'Tramp Steamer', right: true, title: 'Rusty Tramp Steamer, Zailing Speed 45.' },
          { text: 'Most ships', right: true, title: 'Zailing Speed 55.' },
          { text: 'Zee-Clipper', right: true, title: 'Swift Zee-Clipper or Ogedei-class Liner, Zailing Speed 75.' },
        ], ZEE_ROUTES.map(function (r) {
          return h('tr', null, [
            h('td', { css: TD }, [
              h('div', { css: 'color:' + UI.text + ';' }, [r.name]),
              h('div', { css: 'color:' + UI.dim + ';font-size:11px;' }, [r.of]),
            ]),
            h('td', { css: TD + 'text-align:right;' }, [String(r.need)]),
            h('td', { css: TD + 'text-align:right;color:' + UI.dim + ';' }, [r.tramp]),
            h('td', { css: TD + 'text-align:right;color:' + UI.dim + ';' }, [r.other]),
            h('td', { css: TD + 'text-align:right;color:' + UI.dim + ';' }, [r.clipper]),
          ]);
        })),
        h('div', { css: 'margin-top:5px;color:' + UI.dim + ';font-size:11px;line-height:1.6;' }, [
          'Actions are the guide’s averages. Crossing a region gives a Zee Leg; only the last '
          + 'leg, inside your destination’s own region, is the 80.',
        ]),
      ])),

      section('Where you are', h('div', null, [
        table([
          { text: 'Region' },
          { text: 'Zee Peril', right: true, title: 'Every broad challenge out there — Watchful, Shadowy, Dangerous, Persuasive — is set to this.' },
          { text: 'Narrow', right: true, title: 'What a skill challenge scales to. The non-piracy Zeefaring checks do not scale at all.' },
          { text: '' },
        ], ZEE_REGIONS.map(function (r) {
          return h('tr', null, [
            h('td', { css: TD }, [wikiLink(r.name, r.name)]),
            h('td', { css: TD + 'text-align:right;' }, [String(r.peril)]),
            h('td', { css: TD + 'text-align:right;color:' + UI.dim + ';' }, [String(r.narrow)]),
            h('td', { css: TD + 'color:' + UI.dim + ';' }, [r.note]),
          ]);
        })),
      ])),

      section('Troubled Waters', h('div', null, [
        h('div', { css: 'color:' + UI.dim + ';font-size:12px;line-height:1.6;' }, [
          h('div', null, ['1–5 Calm Seas · 6–7 Lashing Waves · ',
            h('span', { css: 'color:#c98a8a;' }, ['8 is a Demise at Zee']),
            ' — it kills you or drives you mad, and it takes precedence over arriving.']),
          h('div', null, ['Docking somewhere safe wipes it, and every zee-threat with it. Wounds and Nightmares stay.']),
          h('div', null, ['At 7 you start drawing black cards — one per zee-threat you are carrying. '
            + 'They are urgent, so with two of them your hand holds nothing else.']),
        ]),
        h('div', { css: 'margin-top:8px;' }, [table([
          { text: 'Zee-threat' }, { text: 'Comes from' }, { text: 'Its black card at Troubled Waters 7' },
        ], ZEE_MENACES.map(function (m) {
          return h('tr', null, [
            h('td', { css: TD }, [wikiLink(m.name, m.name)]),
            h('td', { css: TD + 'color:' + UI.dim + ';' }, [m.from]),
            h('td', { css: TD }, [wikiLink(m.card, m.card)]),
          ]);
        }))]),
      ])),

      section('Safe docks', h('div', { css: 'color:' + UI.dim + ';font-size:12px;line-height:1.7;' },
        ZEE_SAFE_DOCKS.map(function (d) {
          return h('div', null, [
            h('span', { css: 'color:' + UI.text + ';' }, [d.region + ': ']),
            d.names.join(' · '),
          ]);
        }).concat([
          h('div', { css: 'margin-top:5px;' }, ['Being a port is not the same as being safe — Port Cecil, '
            + 'Godfall, Irem, Gaider’s Mourn and Tanah-Chook are all ports and none of them resets anything.']),
        ]))),

      section('The winds', h('div', null, [
        table([{ text: 'Wind' }, { text: 'First found' }, { text: 'On the card' }, { text: 'Dream it starts in London' }],
          ZEE_WINDS.map(function (w) {
            return h('tr', null, [
              h('td', { css: TD }, [wikiLink(w.name, w.name)]),
              h('td', { css: TD + 'color:' + UI.dim + ';' }, [w.where]),
              h('td', { css: TD }, [wikiLink(w.card, w.card)]),
              h('td', { css: TD + 'color:' + UI.dim + ';' }, [
                h('div', null, [wikiLink('Having Recurring Dreams: ' + w.dream, w.dream)]),
                h('div', { css: 'font-size:11px;' }, [w.cost]),
              ]),
            ]);
          })),
        h('div', { css: 'margin-top:5px;color:' + UI.dim + ';font-size:11px;line-height:1.6;' }, [
          'A finished dream storyline pays an Oneiric Pearl and resets. Winds survive docking.',
        ]),
      ])),

      section('Every zee card', h('div', null, [
        h('div', { css: 'display:flex;align-items:center;gap:8px;margin-bottom:6px;' }, [search]),
        table([{ text: 'Card' }, { text: '' }, { text: 'Best line with nothing special in hand' }], cardRows),
      ])),

      h('div', { css: 'margin-top:12px;color:' + UI.dim + ';font-size:11px;line-height:1.6;' }, [
        h('div', null, ['The badge is the Troubled Waters cost, in change points, of the best line you '
          + 'can take with nothing special in hand. ',
          h('b', null, ['?']), ' means that is a challenge’s success value; ',
          h('b', null, ['½']), ' that the line only makes half progress; ',
          h('b', null, ['·']), ' that it makes none; ',
          h('b', null, ['★']), ' the one line that hands you a flat 80; ',
          h('b', null, [ZEE_GATED_MARK]), ' that a cheaper line exists behind an item, a quality or piracy.']),
        h('div', null, ['Options behind an item or a quality are in the tooltip but never in the badge, '
          + 'and piracy lines (Corsair’s Colours, a bounty) are left out of it too.']),
        h('div', { css: 'margin-top:6px;' }, ['Data from ',
          wikiLink('Zailing (Guide)', 'Zailing (Guide)'), ' and the individual card pages on the Fallen London wiki.']),
      ]),
    ]);
  }

  // === panel: Fruits of the Zee ==========================================
  //
  // The checklist half of the festival work, and the reason the badges can say
  // "you still need this": what the festival has to give, and which of it you
  // already hold.
  //
  // It reads the same two pages the Factions panel does and through the same
  // plumbing -- qualities off the Myself tab, items off Possessions, both
  // banked in localStorage and refreshable in a hidden frame -- so opening
  // this panel from the middle of a dive still has something to say. Every
  // reading is labelled with its age, and an item whose ownership can't be
  // established is a dash, never a "no". Thalassic Favour is a QUALITY, not an
  // item, which is why it comes from the first scrape and not the second.

  const FOTZ_CACHE_KEY = 'fl-ux-fotz';
  const COUNTS_KEY = 'fl-ux-item-counts';

  // Bumped whenever anything the badges depend on is re-banked. `fotzHoldings`
  // is called once per card per scan, so it memoises on this rather than
  // re-parsing a few hundred cached item names on every DOM mutation.
  let fotzGen = 0;

  // The festival's own qualities, off a Myself scrape. Same rule as the
  // factions scrape: FL doesn't render a quality you have none of, so absent
  // means 0 -- but only while the tab's search box is empty, because a
  // filtered list makes absent mean "not on screen" instead.
  function fotzFromQualities(scan) {
    const values = {};
    const zeroIsSafe = !scan.filtered;
    for (const name of FOTZ_QUALITIES) {
      const q = scan.values.get(name);
      if (q) values[name] = q.level;
      else if (zeroIsSafe) values[name] = 0;
    }
    return values;
  }

  function bankFotzQualities(scan) {
    if (!scan) return false;
    const values = fotzFromQualities(scan);
    if (!Object.keys(values).length) return false;
    saveCache(FOTZ_CACHE_KEY, {
      v: 1, at: Date.now(), character: characterName() || null,
      partial: scan.filtered, values: values,
    });
    fotzGen++;
    return true;
  }

  // `held` is readPossessionCounts' Map. Stored as an array of pairs, since a
  // Map doesn't survive JSON.
  function bankItemCounts(held) {
    if (!held || !held.size) return false;
    const rows = [];
    held.forEach(function (rec, key) { rows.push([key, rec.name, rec.count]); });
    saveCache(COUNTS_KEY, {
      v: 1, at: Date.now(), character: characterName() || null, held: rows,
    });
    fotzGen++;
    return true;
  }

  // The counterpart of `captureFactionState`: watch for the two tabs going by
  // and bank what they say. Separate from it, and with its own signature, so
  // the factions plumbing stays exactly as it was.
  let lastFotzSig = null;
  function captureFotzState() {
    const items = document.querySelectorAll('li.quality-item');
    const owned = document.querySelectorAll(OWNED_MARKER);
    if (!items.length && !owned.length) { lastFotzSig = null; return; }
    const search = document.querySelector('input.input--item-search');
    const sig = items.length + '/' + owned.length + '|' + (search ? search.value : '');
    if (sig === lastFotzSig) return;
    lastFotzSig = sig;
    if (items.length) bankFotzQualities(readQualities());
    if (owned.length) bankItemCounts(readPossessionCounts());
  }

  function loadCounts() {
    const rec = loadCache(COUNTS_KEY, 1);
    if (!rec || !Array.isArray(rec.held)) return null;
    const held = new Map();
    for (const row of rec.held) held.set(row[0], { name: row[1], count: row[2] });
    return { at: rec.at, held: held };
  }

  // Everything this panel shows, live where it can be and banked where it
  // can't. Any field may be missing; the renderer draws a dash for it. Field
  // names match the factions state so `stateIsFresh` covers both.
  function readFotzState() {
    let qualities = null;
    const scan = readQualities();
    if (scan) {
      const values = fotzFromQualities(scan);
      if (Object.keys(values).length) {
        qualities = {
          live: true, at: Date.now(), character: characterName(),
          partial: scan.filtered, values: values,
        };
      }
    }
    if (!qualities) {
      const rec = loadCache(FOTZ_CACHE_KEY, 1);
      if (rec) {
        qualities = {
          live: false, at: rec.at, character: rec.character,
          partial: !!rec.partial, values: rec.values,
        };
      }
    }

    let items = null;
    const live = readPossessionCounts();
    if (live && live.size) {
      items = { live: true, at: Date.now(), held: live };
    } else {
      const rec = loadCounts();
      if (rec) items = { live: false, at: rec.at, held: rec.held };
    }

    if (!qualities && !items) return null;
    return {
      live: !!(qualities && qualities.live),
      at: qualities ? qualities.at : null,
      character: (qualities && qualities.character) || null,
      partial: !!(qualities && qualities.partial),
      values: new Map(Object.entries((qualities && qualities.values) || {})),
      itemsLive: !!(items && items.live),
      itemsAt: items ? items.at : null,
      held: items ? items.held : null,
    };
  }

  // What the BADGES need, and nothing more: can we answer "do you have this?"
  // and "have you met the Bride?". Null means we cannot, and the badge then
  // says so rather than guessing.
  let holdingsMemo = null;
  function fotzHoldings() {
    if (holdingsMemo && holdingsMemo.gen === fotzGen) return holdingsMemo.value;
    let value = null;
    try {
      value = buildFotzHoldings();
    } catch (e) {
      value = null;
    }
    holdingsMemo = { gen: fotzGen, value: value };
    return value;
  }

  function buildFotzHoldings() {
    const live = readPossessionCounts();
    const items = (live && live.size) ? { held: live } : loadCounts();
    if (!items) return null;
    const held = items.held;
    // The Bride is an Accomplishment, so it comes off the quality scrape, not
    // possessions -- and an unreadable one has to stay false rather than
    // become an unknown, or the storylet at the bottom of the trench would
    // never get a mark at all. It errs towards "go and do it".
    let bride = false;
    const scan = readQualities();
    if (scan) {
      const q = scan.values.get(FOTZ_BRIDE_QUALITY);
      if (q && q.level > 0) bride = true;
    } else {
      const rec = loadCache(FOTZ_CACHE_KEY, 1);
      if (rec && rec.values && rec.values[FOTZ_BRIDE_QUALITY] > 0) bride = true;
    }
    return {
      has: function (name) { return held.has(normalizeName(name)); },
      count: function (name) {
        const rec = held.get(normalizeName(name));
        return rec ? rec.count : 0;
      },
      bride: bride,
      sig: String(fotzGen),
    };
  }

  // --- the collection ----------------------------------------------------
  //
  // One flat row per collectable thing, grouped for display. `count` is
  // whether the row belongs in the "you are missing N of M" headline: the
  // Fate-only items don't (they cost money, not actions), the ships don't (you
  // can only own one at a time), and the Nodule of Fecund Amber doesn't until
  // you already hold the Litter-Cyst it is the consolation prize for.
  //
  // `held` is true / false / null, and null is a real answer meaning "your
  // Possessions have never been read". Pure apart from the state it is handed,
  // so the arithmetic in the headline is testable.
  function fotzCollection(state) {
    const held = state && state.held;
    const holds = function (name) {
      if (!held) return null;
      return held.has(normalizeName(name));
    };
    const countOf = function (name) {
      if (!held) return null;
      const rec = held.get(normalizeName(name));
      return rec ? rec.count : 0;
    };
    const quality = function (name) {
      const v = state && state.values ? state.values.get(name) : undefined;
      return typeof v === 'number' ? v : null;
    };

    const favour = quality('Thalassic Favour');
    const sights = quality('Sights at the Festival');
    const bandOf = function (value) {
      if (value == null) return null;
      for (let i = 0; i < FOTZ_BANDS.length; i++) {
        if (value >= FOTZ_BANDS[i].lo && value <= FOTZ_BANDS[i].hi) return i;
      }
      return null;
    };
    const sightsBand = bandOf(sights);

    const groups = [];

    // 1. The coral equipment: the year's actual prize, and the only part of
    //    the collection where the game tells you exactly how to get the piece
    //    you are missing.
    groups.push({
      key: 'coral',
      title: 'Coral equipment',
      hint: 'Dive for the coral in week one, break it open in week two. Which of the '
        + 'three you get is decided by Sights at the Festival at that moment — and '
        + 'breaking one re-rolls Sights, so you cannot line two up in a row.',
      corals: FOTZ_CORALS.map(function (coral) {
        const inHand = countOf(coral.coral);
        // A coral whose items are not published yet gets ONE row saying so,
        // and it is `count: false` -- "missing 3 of 31" would be counting
        // items nobody can name, which is the same fabrication as a made-up
        // number. `held` is null for the same reason: you cannot check a name
        // you do not have. The badge still stars the card, because "take this,
        // it is new" is a different and answerable question.
        if (!coral.variants) {
          return {
            coral: coral,
            inHand: inHand,
            pending: true,
            rows: [{
              name: coral.pendingLabel || coral.slot,
              slot: coral.slot,
              held: null,
              count: false,
              band: null,
              how: coral.pending,
              note: coral.pending,
            }],
          };
        }
        return {
          coral: coral,
          inHand: inHand,
          rows: coral.variants.map(function (name, i) {
            const have = holds(name);
            const band = FOTZ_BANDS[i];
            return {
              name: name,
              slot: coral.slot,
              held: have,
              count: true,
              band: i,
              // "Do this now" -- you are holding the coral and Sights is
              // sitting in the band that pays out the one you're missing.
              ready: have === false && !!inHand && sightsBand === i,
              how: 'Break a ' + coral.coral + ' while Sights at the Festival is '
                + band.lo + '–' + band.hi + ', or trade a duplicate to ' + band.trader + '.',
              fate: coral.fate,
              bis: coral.bis,
            };
          }),
        };
      }),
    });

    // 2. Equipment from festivals past: dive for it, or buy it back cheaper
    //    than the trade-in value at the stalls.
    groups.push({
      key: 'dive',
      title: 'Equipment from festivals past',
      hint: 'Only these six turn up while diving. Buying one at the stalls always '
        + 'costs less Favour than trading a spare one in pays, so dive first.',
      rows: FOTZ_EQUIPMENT.map(function (item) {
        const have = holds(item.name);
        return {
          name: item.name,
          slot: item.slot,
          held: have,
          count: true,
          spare: countOf(item.name) == null ? null : Math.max(0, countOf(item.name) - 1),
          spareEach: item.favour,
          ready: have === false && favour != null && favour >= item.stall,
          how: 'Dive to depth ' + (item.depths[0] === item.depths[1]
            ? item.depths[0] : item.depths[0] + '–' + item.depths[1])
            + ' and take it off ' + item.card + ', or buy it at the Island Stalls for '
            + item.stall + ' Favour.',
          favour: item.stall,
          fate: item.fate,
          bis: item.bis,
          note: item.note,
        };
      }),
    });

    // 3. The stalls: week two, Favour only, nothing here can be dived up.
    groups.push({
      key: 'stall',
      title: 'Island Stalls only',
      hint: 'Week two, for Thalassic Favour. None of these can be dived for.',
      rows: FOTZ_STALL.map(function (item) {
        const have = holds(item.name);
        return {
          name: item.name,
          slot: item.slot,
          held: have,
          count: true,
          ready: have === false && favour != null && favour >= item.favour,
          how: item.favour + ' Favour at the Island Stalls.',
          favour: item.favour,
          fate: item.fate,
          bis: item.bis,
          note: item.note,
        };
      }),
    });

    // 4. The bottom of the trench.
    groups.push({
      key: 'bride',
      title: 'The Pentamerous Bride',
      hint: 'Dive all the way down, take no treasure, and beg audience. The '
        + 'Accomplishment is what the King-in-Coral pays out on in week two.',
      rows: FOTZ_BRIDE_ITEMS.map(function (item, i) {
        const have = holds(item.name);
        // The Amber is what you get INSTEAD of the Litter-Cyst, so it is only
        // part of the collection once the Cyst is already yours.
        const applies = i === 0 || holds(FOTZ_BRIDE_ITEMS[0].name) === true;
        return {
          name: item.name,
          slot: item.slot,
          held: have,
          count: i === 0,
          dim: !applies,
          how: item.how,
          bis: item.bis,
          note: item.note,
        };
      }),
    });

    // 5. The ships. Listed, never counted -- one ship at a time.
    groups.push({
      key: 'ships',
      title: 'Festival ships',
      hint: 'Traded for your current ship plus 500–1920 Favour. Trading in a '
        + 'Zubmarine, a Majestic Pleasure Yacht or another festival ship brings every '
        + 'one of them down to 500. Not counted below: you can only have one ship.',
      rows: FOTZ_SHIPS.map(function (ship) {
        return {
          name: ship.name,
          slot: 'Ship',
          held: holds(ship.name),
          count: false,
          how: 'Trade your current ship plus 500–1920 Favour to the Green-Gilled '
            + 'Shipwright. Replaces ' + ship.peer + '.',
          fate: ship.fate,
          note: ship.note,
        };
      }),
    });

    // 6. Fate. Listed for completeness, never counted.
    groups.push({
      key: 'fate',
      title: 'Fate only',
      hint: 'From the King-in-Coral’s Hoard, for Fate rather than Favour. Not counted '
        + 'below — and several are obtainable elsewhere for nothing.',
      rows: FOTZ_FATE_ITEMS.map(function (item) {
        return {
          name: item.name,
          slot: item.slot,
          held: holds(item.name),
          count: false,
          how: item.fate ? item.fate + ' Fate.' : 'Fate, at the Hoard.',
          fate: item.fate,
          note: item.note,
        };
      }),
    });

    // The headline. Only `count` rows, and an unknown is neither missing nor
    // held -- it is counted as unknown and said so, because "you are missing
    // 28 of 28" would be a lie told to someone who simply hasn't opened
    // Possessions yet.
    let total = 0;
    let missing = 0;
    let unknown = 0;
    const wanted = [];
    for (const group of groups) {
      const rows = group.rows || group.corals.reduce(function (all, c) {
        return all.concat(c.rows);
      }, []);
      for (const row of rows) {
        if (!row.count) continue;
        total++;
        if (row.held === false) { missing++; wanted.push(row); }
        else if (row.held == null) unknown++;
      }
    }

    return {
      groups: groups,
      total: total,
      missing: missing,
      unknown: unknown,
      wanted: wanted,
      ready: wanted.filter(function (r) { return r.ready; }),
      favour: favour,
      sights: sights,
      sightsBand: sightsBand,
      devotion: quality('Fivefold Devotion'),
      // How many of the five corals still have something you haven't got. It
      // is the one number that decides how much Devotion is worth raising, so
      // it comes out of the collection rather than being counted again in the
      // renderer. An unreadable Possessions list leaves it null, and the
      // advice then falls back to the Favour case rather than inventing a
      // count -- there is no honest answer to "how many do you need" when we
      // cannot tell what you have.
      // How many different corals are still worth diving for. A `pending` one
      // always counts: its items cannot exist yet, so you certainly need the
      // coral -- and unlike the checklist total, this needs no name, only a
      // count, so there is nothing being fabricated.
      coralsWanted: !held ? null : groups[0].corals.filter(function (entry) {
        return entry.pending || entry.rows.some(function (row) { return row.held === false; });
      }).length,
    };
  }

  // What your treasures would fetch at the Fruit Market, and what your spare
  // equipment would. Both vanish when the festival ends (equipment aside,
  // which now survives), so this is the "cash in before it's gone" number.
  function fotzLedger(state) {
    const held = state && state.held;
    const countOf = function (name) {
      if (!held) return null;
      const rec = held.get(normalizeName(name));
      return rec ? rec.count : 0;
    };
    const rows = [];
    let total = 0;
    for (const treasure of FOTZ_TREASURES) {
      const n = countOf(treasure.name);
      if (!n) continue;
      total += n * treasure.favour;
      rows.push({ name: treasure.name, each: treasure.favour, count: n,
        subtotal: n * treasure.favour, note: treasure.note });
    }
    const spares = [];
    for (const item of FOTZ_EQUIPMENT) {
      const n = countOf(item.name);
      if (n == null || n < 2) continue;
      const extra = n - 1;
      total += extra * item.favour;
      spares.push({ name: item.name, each: item.favour, count: extra,
        subtotal: extra * item.favour });
    }
    return { rows: rows, spares: spares, total: total, known: !!held };
  }

  // --- rendering ---------------------------------------------------------

  const FOTZ_PIP_HELD = '◆';
  const FOTZ_PIP_MISSING = '◇';
  const FOTZ_PIP_UNKNOWN = '–';

  // Same three-state rule as the factions pips: filled when you have it,
  // hollow when you don't, a dash when there is no source for the answer. A
  // hollow pip you could act on RIGHT NOW is promoted to a filled "!" in the
  // ready colour, which is the one thing this panel exists to point at.
  function fotzPip(row) {
    if (row.held == null) {
      return h('span', {
        title: 'Not known — your Possessions have not been read yet.',
        css: 'color:' + UI.dim + ';font-size:13px;',
      }, [FOTZ_PIP_UNKNOWN]);
    }
    if (row.held) {
      return h('span', {
        title: 'You have this.',
        css: 'color:' + UI.accent + ';font-size:13px;',
      }, [FOTZ_PIP_HELD]);
    }
    if (row.ready) {
      return h('span', {
        title: 'You can get this right now.',
        css: 'display:inline-block;color:#17190c;background:' + COLOR_READY
          + ';border-radius:3px;padding:0 5px;font-weight:bold;',
      }, ['!']);
    }
    return h('span', {
      title: 'You do not have this yet.',
      css: 'color:' + UI.dim + ';font-size:13px;',
    }, [FOTZ_PIP_MISSING]);
  }

  function fotzItemRow(row) {
    return h('tr', { css: row.dim ? 'opacity:.55;' : '' }, [
      h('td', { css: TD + 'text-align:center;width:1%;' }, [fotzPip(row)]),
      h('td', { css: TD }, [
        wikiLink(row.name, row.name),
        row.slot ? h('span', { css: 'color:' + UI.dim + ';font-size:11px;' },
          [' · ' + row.slot]) : null,
        row.bis ? h('div', { css: 'color:' + UI.accent + ';font-size:11px;' }, [row.bis]) : null,
        row.spare ? h('div', { css: 'color:' + UI.dim + ';font-size:11px;' },
          [row.spare + (row.spare === 1 ? ' spare' : ' spares') + ' — worth '
            + (row.spare * row.spareEach) + ' Favour traded back']) : null,
      ]),
      h('td', { css: TD + 'color:' + UI.dim + ';font-size:11px;line-height:1.5;' }, [
        row.held ? null : h('div', null, [row.how]),
        row.note ? h('div', null, [row.note]) : null,
        row.fate ? h('div', null, ['Or ' + row.fate + ' Fate at the Hoard.']) : null,
      ]),
    ]);
  }

  // The cards on screen, ranked the way the badge colours them: the ones
  // offering something you still need first, then by trade-in value.
  function fotzHandRows(depth, source, floor, holdings) {
    const seen = new Map();
    eachCardName(function (host, name) {
      const card = lookupFotzCard(name);
      if (card && !seen.has(card.name)) seen.set(card.name, card);
    });
    const rated = [];
    for (const card of seen.values()) {
      const opts = fotzOptionsAt(card, depth, floor);
      if (!opts.length) continue;
      let missing = [];
      for (const opt of opts) {
        const gone = fotzMissingFrom(opt, holdings);
        if (gone) missing = missing.concat(gone);
      }
      const favours = opts.map(function (o) { return o.favour; });
      rated.push({
        card: card,
        opts: opts,
        missing: missing,
        best: Math.max.apply(null, favours),
        spec: fotzBadgeSpec(card, depth, source, floor, holdings),
      });
    }
    rated.sort(function (a, b) {
      if (!!a.missing.length !== !!b.missing.length) return a.missing.length ? -1 : 1;
      return b.best - a.best;
    });
    return rated;
  }

  function renderFotzPanel(ctx) {
    const state = readFotzState();
    const at = fotzDepth();
    const floor = at.depth ? null : fotzDepthFloor();
    const collection = fotzCollection(state);
    const ledger = fotzLedger(state);
    const hand = fotzHandRows(at.depth, at.source, floor, fotzHoldings());

    let busy = false;
    if (ctx && autoRefreshEnabled() && !stateIsFresh(state)) {
      busy = true;
      refreshBackgroundState().then(function () { ctx.rerender(); });
    }

    const section = function (title, children) {
      return h('div', { css: 'margin-top:14px;' }, [
        h('div', {
          css: 'font:bold 11px ' + UI.font + ';letter-spacing:.06em;text-transform:uppercase;'
            + 'color:' + UI.accent + ';margin-bottom:5px;',
        }, [title]),
        children,
      ]);
    };
    const note = function (text) {
      return h('div', { css: 'color:' + UI.dim + ';font-size:11px;line-height:1.6;' }, text);
    };
    const table = function (heads, rows) {
      return h('table', { css: 'width:100%;border-collapse:collapse;' }, [
        heads ? h('thead', null, [h('tr', null, heads.map(function (head) {
          return h('th', { css: TH + (head.right ? 'text-align:right;' : '') }, [head.text]);
        }))]) : null,
        h('tbody', null, rows),
      ]);
    };

    // --- your numbers, and where they came from --------------------------
    const value = function (name) {
      const v = state && state.values ? state.values.get(name) : undefined;
      return typeof v === 'number' ? String(v) : '–';
    };
    const stat = function (label, name, title) {
      return h('div', { title: title || '', css: 'min-width:96px;' }, [
        h('div', { css: 'color:' + UI.dim + ';font-size:10px;letter-spacing:.05em;'
          + 'text-transform:uppercase;' }, [label]),
        h('div', { css: 'color:' + UI.text + ';font:bold 15px ' + UI.font + ';' },
          [value(name)]),
      ]);
    };

    const banners = [];

    banners.push(h('div', {
      css: 'margin:10px 0 0;padding:8px 10px;background:' + UI.bgAlt
        + ';border-left:3px solid ' + UI.accent + ';display:flex;gap:14px;flex-wrap:wrap;',
    }, [
      stat('Favour', 'Thalassic Favour', 'Thalassic Favour — what week two is paid in.'),
      stat('Devotion', 'Fivefold Devotion', 'Fivefold Devotion — 5 to dive at all, 11 is the cap.'),
      stat('Depth', 'Full Fathom Five', 'Full Fathom Five — how deep you are right now.'),
      stat('Sights', 'Sights at the Festival',
        'Sights at the Festival — decides which of the three coral items you get.'),
      stat('Airs', 'Airs of a Barren Zee',
        'Airs of a Barren Zee — decides which supplication options you are offered, '
          + 'and is re-rolled every time you take one.'),
      stat('Harvest', 'A Fruitless Harvest', 'A Fruitless Harvest — the festival’s own story.'),
    ]));

    if (!state) {
      banners.push(h('div', {
        css: 'margin:10px 0 0;padding:8px 10px;border-left:3px solid ' + UI.accent
          + ';background:' + UI.bgAlt + ';color:' + UI.dim + ';font-size:12px;line-height:1.5;',
      }, [
        'Nothing read yet. Open the ',
        h('a', { href: '/myself', css: 'color:' + UI.text + ';' }, ['Myself']),
        ' and ',
        h('a', { href: '/possessions', css: 'color:' + UI.text + ';' }, ['Possessions']),
        ' tabs once — or press Refresh — and both will be remembered here.',
      ]));
    }

    // --- the headline: what you are still missing ------------------------
    if (collection.ready.length) {
      banners.push(h('div', {
        css: 'margin:10px 0 0;padding:8px 10px;border-left:3px solid ' + COLOR_READY
          + ';background:#23280f;color:' + UI.text + ';font-size:12px;line-height:1.6;',
      }, [
        h('div', { css: 'color:' + COLOR_READY + ';font-weight:bold;' }, [
          h('span', {
            css: 'display:inline-block;color:#17190c;background:' + COLOR_READY
              + ';border-radius:3px;padding:0 5px;margin-right:6px;',
          }, ['!']),
          collection.ready.length === 1
            ? '1 thing you can collect right now'
            : collection.ready.length + ' things you can collect right now',
        ]),
        collection.ready.map(function (row) {
          return h('div', null, [
            wikiLink(row.name, row.name),
            h('span', { css: 'color:' + UI.dim + ';' }, [' — ' + row.how]),
          ]);
        }),
      ]));
    }

    banners.push(h('div', {
      css: 'margin:10px 0 0;padding:8px 10px;border-left:3px solid ' + UI.accent
        + ';background:' + UI.bgAlt + ';font-size:12px;line-height:1.6;',
    }, [
      h('div', { css: 'color:' + UI.accent + ';font-weight:bold;' }, [
        collection.unknown === collection.total
          ? 'The festival collection is ' + collection.total + ' items'
          : 'Missing ' + collection.missing + ' of ' + collection.total
            + ' festival items'
            + (collection.unknown ? ' (' + collection.unknown + ' unknown)' : ''),
      ]),
      collection.unknown === collection.total
        ? note(['Which of them you hold is not known yet — read your Possessions and '
          + 'this becomes a checklist.'])
        : (collection.missing
          ? h('div', { css: 'color:' + UI.dim + ';' }, [
            collection.wanted.map(function (r) { return r.name; }).join(', '), '.'])
          : note(['Nothing left to collect. The ships and the Fate items below are not '
            + 'counted.'])),
    ]));

    // --- what is still down there, depth by depth ------------------------
    //
    // A dive commits you to a depth, and the unique rewards are not spread
    // evenly: some are only at the bottom, and some are only at the top and
    // are LOST by diving past them. This is the block that says which.
    {
      const holdings = fotzHoldings();
      const split = fotzSplitUniques(fotzUniquesByDepth(holdings));
      const chip = function (entry) {
        const shallow = entry.to < 5;
        return h('span', {
          title: entry.card + ' — depth ' + (entry.from === entry.to
            ? entry.from : entry.from + '–' + entry.to)
            + (entry.pending
              ? '\nAll three of its items are still unpublished — see the checklist below.'
              : (entry.coral ? '\n' + entry.missing.length
                + (entry.missing.length === 1 ? ' variant' : ' variants')
                + ' still missing: ' + entry.missing.join(', ') : ''))
            + (entry.held
              ? '\nYou are already holding ' + entry.held + ' of the coral itself.' : ''),
          css: 'display:inline-block;margin:2px 5px 2px 0;padding:1px 6px;border-radius:3px;'
            + 'background:' + (entry.last && shallow ? '#5a3a1c' : UI.bg)
            + ';border:1px solid ' + (entry.last && shallow ? COLOR_FULL : UI.line)
            + ';color:' + UI.text + ';font-size:11px;white-space:nowrap;',
        }, [
          entry.bride ? 'the Pentamerous Bride' : entry.label,
          entry.coral && !entry.pending && entry.missing.length < 3
            ? h('span', { css: 'color:' + UI.dim + ';' }, [' ×' + entry.missing.length])
            : null,
          entry.last && shallow
            ? h('span', { css: 'color:' + COLOR_FULL + ';' }, [' · last chance'])
            : null,
        ]);
      };

      const anything = split.everywhere.length
        || split.byDepth.some(function (row) { return row.entries.length; });

      banners.push(h('div', {
        css: 'margin:10px 0 0;padding:8px 10px;border-left:3px solid ' + UI.accent
          + ';background:' + UI.bgAlt + ';font-size:12px;line-height:1.6;',
      }, [
        h('div', { css: 'color:' + UI.accent + ';font-weight:bold;' },
          ['Unique rewards still down there, by depth']),
        !holdings
          ? note(['Your Possessions have not been read, so what you are still missing is not '
            + 'known. Press Refresh above and this fills in.'])
          : (!anything
            ? note(['Nothing unique left to dive for. Everything below this is Favour.'])
            : h('div', null, [
              split.everywhere.length
                ? h('div', { css: 'margin:4px 0 6px;' }, [
                  h('span', { css: 'color:' + UI.dim + ';' }, ['At every depth: ']),
                  split.everywhere.map(chip),
                ])
                : null,
              table(
                [{ text: 'Depth' }, { text: 'Only here, or here as well' }],
                split.byDepth.map(function (row) {
                  const here = at.depth === row.depth;
                  return h('tr', { css: here ? 'background:' + UI.bg + ';' : '' }, [
                    h('td', {
                      css: TD + 'white-space:nowrap;color:'
                        + (here ? UI.accent : UI.text) + ';',
                    }, [
                      String(row.depth),
                      here
                        ? h('span', { css: 'color:' + COLOR_READY + ';font-size:11px;' },
                          [' ← you'])
                        : null,
                    ]),
                    h('td', { css: TD }, [
                      row.entries.length
                        ? row.entries.map(chip)
                        : h('span', { css: 'color:' + UI.dim + ';' },
                          ['— nothing but the corals and Favour']),
                    ]),
                  ]);
                })),
              note(['A dive commits you to a depth and pays one reward, so the marked ones '
                + 'are the ones diving deeper throws away for that dive.']),
            ])),
      ]));
    }

    if (state && state.partial) {
      banners.push(h('div', {
        css: 'margin:10px 0 0;padding:8px 10px;border-left:3px solid #8a6b3b;background:'
          + UI.bgAlt + ';color:' + UI.dim + ';font-size:12px;line-height:1.5;',
      }, ['The Myself tab’s search box is filtering the list — anything not on screen '
        + 'is shown as – rather than guessed at 0.']));
    }

    // Where the numbers came from, plus the two controls, exactly as the
    // Factions panel does it.
    banners.push(h('div', {
      css: 'margin:10px 0 0;display:flex;align-items:center;gap:10px;flex-wrap:wrap;'
        + 'color:' + UI.dim + ';font-size:11px;',
    }, [
      h('span', null, [
        'Qualities: ' + (state && state.live ? 'live'
          : (state && state.at ? ageText(state.at) : 'never read'))
        + '  ·  items: ' + (state && state.itemsAt
          ? (state.itemsLive ? 'live' : ageText(state.itemsAt)) : 'never read')
        + (state && state.character ? '  ·  ' + state.character : ''),
      ]),
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

    // --- the depth control -----------------------------------------------
    //
    // Here rather than nowhere because the badges cannot be exact without it
    // and FL may never show us Full Fathom Five. It is deliberately not
    // remembered past the tab: a stale depth is a wrong badge.
    const depthButton = function (n) {
      const on = at.source === 'set' && at.depth === n;
      return h('button', {
        type: 'button',
        title: n == null ? 'Let the depth be read from the game, if it can be.'
          : 'You are at Full Fathom Five ' + n + '.',
        css: 'border:1px solid ' + (on ? UI.accent : UI.line) + ';border-radius:3px;'
          + 'background:' + (on ? UI.accent : 'transparent') + ';color:'
          + (on ? '#17190c' : UI.text) + ';font:' + (on ? 'bold ' : '') + '12px ' + UI.font
          + ';padding:2px 9px;cursor:pointer;',
        on: {
          click: function () {
            fotzSetDepth(n);
            if (ctx) ctx.rerender();
          },
        },
      }, [n == null ? 'auto' : String(n)]);
    };

    const depthBlock = h('div', {
      css: 'margin:10px 0 0;padding:8px 10px;background:' + UI.bgAlt
        + ';border-left:3px solid ' + (at.depth ? UI.accent : UI.line) + ';font-size:12px;',
    }, [
      h('div', { css: 'display:flex;align-items:center;gap:6px;flex-wrap:wrap;' }, [
        h('span', { css: 'color:' + UI.dim + ';margin-right:4px;' }, ['Your dive depth:']),
        depthButton(null), depthButton(1), depthButton(2), depthButton(3),
        depthButton(4), depthButton(5),
        h('span', { css: 'color:' + (at.depth ? UI.accent : UI.dim) + ';margin-left:4px;' }, [
          at.source === 'quality' ? 'read from Full Fathom Five: ' + at.depth
            : (at.source === 'set' ? 'set to ' + at.depth
              : (floor ? 'unknown, at least ' + floor : 'unknown')),
        ]),
      ]),
      note([at.depth
        ? 'Every badge is showing the figure for depth ' + at.depth + '.'
        : 'Without a depth the badges show the range across every depth. Fallen London '
          + 'only states Full Fathom Five where it feels like it, so set it here and '
          + 'the badges become exact. Cleared when the tab closes.']),
    ]);
    banners.push(depthBlock);

    // --- the hand ---------------------------------------------------------
    const handBlock = hand.length
      ? h('div', {
        css: 'margin:10px 0 0;padding:8px 10px;border-left:3px solid ' + UI.accent
          + ';background:' + UI.bgAlt + ';font-size:12px;line-height:1.6;',
      }, [
        h('div', { css: 'color:' + UI.accent + ';font-weight:bold;' }, [
          hand.length === 1 ? '1 festival card on screen'
            : hand.length + ' festival cards on screen',
          h('span', { css: 'color:' + UI.dim + ';font-weight:normal;' },
            [' — what you still need first, then by value']),
        ]),
        hand.map(function (rated) {
          return h('div', null, [
            rated.spec ? makeBadge(rated.spec, FOTZ_CLASS) : null,
            h('span', { css: 'margin-left:6px;' }, [rated.card.name]),
            h('span', { css: 'color:' + UI.dim + ';' }, [
              ' — ' + rated.opts.map(function (o) {
                return o.text + (o.favour ? ' (' + o.favour + ')' : '');
              }).join(' / '),
            ]),
            rated.missing.length
              ? h('div', { css: 'color:' + COLOR_READY + ';' },
                ['   ' + FOTZ_MARK_NEED + ' ' + rated.missing.join(', ')])
              : null,
          ]);
        }),
      ])
      : h('div', {
        css: 'margin:10px 0 0;padding:8px 10px;border-left:3px solid ' + UI.line
          + ';background:' + UI.bgAlt + ';color:' + UI.dim + ';font-size:12px;line-height:1.5;',
      }, ['No festival cards on screen. Everything below is the checklist and the '
        + 'reference tables for when there are.']);
    banners.push(handBlock);

    // --- the checklist ----------------------------------------------------
    const groupBlocks = collection.groups.map(function (group) {
      const inner = group.corals
        ? group.corals.map(function (entry) {
          return h('div', { css: 'margin-top:8px;' }, [
            h('div', { css: 'font-size:12px;color:' + UI.text + ';' }, [
              wikiLink(entry.coral.coral, entry.coral.coral),
              h('span', { css: 'color:' + UI.dim + ';font-size:11px;' }, [
                ' · ' + entry.coral.slot + ' · from ',
              ]),
              wikiLink(entry.coral.card, entry.coral.card,
                { color: UI.dim, fontSize: '11px' }),
              entry.inHand
                ? h('span', {
                  css: 'margin-left:6px;color:' + COLOR_READY + ';font-size:11px;',
                }, [entry.inHand + ' in hand'])
                : null,
            ]),
            table(null, entry.rows.map(function (row) {
              // A coral whose three items aren't published yet has one row and
              // no Sights bands to show -- there is nothing to map them to.
              if (row.band == null) {
                return h('tr', null, [
                  h('td', { css: TD + 'text-align:center;width:1%;' }, [fotzPip(row)]),
                  h('td', { css: TD, colSpan: 3 }, [
                    h('span', { css: 'color:' + UI.text + ';' },
                      ['Three ' + entry.coral.slot + ', names not published yet']),
                    h('div', { css: 'color:' + UI.dim + ';font-size:11px;' }, [row.note]),
                  ]),
                ]);
              }
              const band = FOTZ_BANDS[row.band];
              return h('tr', null, [
                h('td', { css: TD + 'text-align:center;width:1%;' }, [fotzPip(row)]),
                h('td', { css: TD }, [
                  wikiLink(row.name, row.name),
                  row.bis
                    ? h('div', { css: 'color:' + UI.accent + ';font-size:11px;' }, [row.bis])
                    : null,
                ]),
                h('td', {
                  css: TD + 'font-size:11px;white-space:nowrap;color:'
                    + (collection.sightsBand === row.band ? COLOR_READY : UI.dim) + ';',
                  title: 'Sights at the Festival ' + band.lo + '–' + band.hi
                    + ' when you break the coral open'
                    + (collection.sightsBand === row.band ? ' — where your Sights is now' : ''),
                }, ['Sights ' + band.lo + '–' + band.hi]),
                h('td', {
                  css: TD + 'font-size:11px;color:' + UI.dim + ';',
                }, ['or trade a spare to ' + band.trader]),
              ]);
            })),
          ]);
        })
        : table(null, group.rows.map(fotzItemRow));

      return h('div', { css: 'margin-top:12px;' }, [
        h('div', {
          css: 'font:bold 11px ' + UI.font + ';letter-spacing:.06em;text-transform:uppercase;'
            + 'color:' + UI.accent + ';',
        }, [group.title]),
        note([group.hint]),
        inner,
      ]);
    });

    // --- the ledger -------------------------------------------------------
    const ledgerBlock = !ledger.known
      ? note(['Your Possessions have not been read, so there is nothing to total up yet.'])
      : (ledger.rows.length || ledger.spares.length
        ? h('div', null, [
          table([{ text: 'Treasure' }, { text: 'Held', right: true },
            { text: 'Each', right: true }, { text: 'Favour', right: true }],
          ledger.rows.map(function (row) {
            return h('tr', null, [
              h('td', { css: TD }, [
                wikiLink(row.name, row.name),
                row.note ? h('div', { css: 'color:' + UI.dim + ';font-size:11px;' },
                  [row.note]) : null,
              ]),
              h('td', { css: TD + 'text-align:right;' }, [String(row.count)]),
              h('td', { css: TD + 'text-align:right;color:' + UI.dim + ';' },
                [String(row.each)]),
              h('td', { css: TD + 'text-align:right;' }, [String(row.subtotal)]),
            ]);
          }).concat(ledger.spares.map(function (row) {
            return h('tr', null, [
              h('td', { css: TD }, [
                wikiLink(row.name, row.name),
                h('span', { css: 'color:' + UI.dim + ';font-size:11px;' }, [' · spare']),
              ]),
              h('td', { css: TD + 'text-align:right;' }, [String(row.count)]),
              h('td', { css: TD + 'text-align:right;color:' + UI.dim + ';' },
                [String(row.each)]),
              h('td', { css: TD + 'text-align:right;' }, [String(row.subtotal)]),
            ]);
          })).concat([
            h('tr', null, [
              h('td', { css: TD + 'font-weight:bold;' }, ['Total']),
              h('td', { css: TD }, ['']),
              h('td', { css: TD }, ['']),
              h('td', {
                css: TD + 'text-align:right;font-weight:bold;color:' + UI.accent + ';',
              }, [String(ledger.total)]),
            ]),
          ])),
          note(['With the ' + (collection.favour == null ? '–' : collection.favour)
            + ' Favour you already hold, that is '
            + (collection.favour == null ? ledger.total + ' plus whatever you have'
              : collection.favour + ledger.total)
            + '. Treasures left over when the festival ends become Memories of Distant '
            + 'Shores at 10 Favour to 1, so trade them.']),
        ])
        : note(['No festival treasures on hand. Everything you dive up shows here with '
          + 'what it trades for.']));

    // --- reference --------------------------------------------------------
    const depthTable = table(
      [{ text: 'Card' }, { text: 'Take' }, { text: 'Depth' },
        { text: 'Favour', right: true }, { text: 'You get' }],
      FOTZ_CARDS.filter(function (c) { return !c.storylet; }).reduce(function (rows, card) {
        return rows.concat(card.opts.map(function (opt, i) {
          const here = at.depth && fotzOptionAt(opt, at.depth);
          return h('tr', { css: here ? 'background:' + UI.bgAlt + ';' : '' }, [
            h('td', { css: TD + 'white-space:nowrap;' },
              [i === 0 ? wikiLink(card.name, card.name) : '']),
            h('td', { css: TD + 'font-size:11px;' }, [opt.text]),
            h('td', { css: TD + 'white-space:nowrap;font-size:11px;color:' + UI.dim + ';' },
              [opt.depths[0] === opt.depths[1] ? String(opt.depths[0])
                : opt.depths[0] + '–' + opt.depths[1]]),
            h('td', { css: TD + 'text-align:right;' },
              [opt.favour ? String(opt.favour) : '—']),
            h('td', { css: TD + 'font-size:11px;color:' + UI.dim + ';' },
              [opt.gain || opt.coral || opt.item || '']),
          ]);
        }));
      }, []));

    // --- raising Devotion -------------------------------------------------
    //
    // The five supplication options all pay the same 4 CP, so the table is
    // really a lookup from "which stat am I best at" to "which option". The
    // stat is the column that matters, which is why it leads and wears a
    // colour; the name is always spelled out beside the glyph so a font
    // without the emoji loses nothing.
    const statPip = function (name) {
      const stat = FOTZ_STATS[name];
      return h('span', { css: 'white-space:nowrap;color:' + (stat ? stat.color : UI.text) + ';' }, [
        h('span', {
          css: 'font-size:13px;margin-right:5px;',
          title: name,
        }, [stat ? stat.icon : '?']),
        name,
      ]);
    };

    const advice = fotzDevotionAdvice(
      collection.coralsWanted == null ? 0 : collection.coralsWanted);
    const ladder = fotzDevotionLadder();
    const toGo = fotzActionsToDevotion(collection.devotion, advice.level);

    const supplicationBlock = h('div', null, [
      note(['Every option on ', wikiLink('Supplication on the Shore', 'Supplication on the Shore'),
        ' pays the same ', h('b', null, ['+4 CP']), ' of Fivefold Devotion, so the only thing '
        + 'that separates them is which attribute the economy item scales off. But you are only '
        + 'offered the ones whose ', h('b', null, ['Airs of a Barren Zee']), ' window you are in '
        + '— usually two of the five — and taking one re-rolls Airs, so you cannot always have '
        + 'the one you want. These are badged in the game as well, on the options themselves.']),
      table(
        [{ text: 'Scales off' }, { text: 'Option' }, { text: 'You get' }, { text: 'Offered at' }],
        FOTZ_SUPPLICATION.map(function (opt) {
          return h('tr', null, [
            h('td', { css: TD + 'white-space:nowrap;' }, [statPip(opt.stat)]),
            h('td', { css: TD }, [
              wikiLink(opt.text, opt.text),
              opt.note
                ? h('div', { css: 'color:' + UI.dim + ';font-size:11px;' }, [opt.note])
                : null,
            ]),
            h('td', { css: TD + 'white-space:nowrap;' }, [wikiLink(opt.gain, opt.gain)]),
            h('td', {
              css: TD + 'white-space:nowrap;font-size:11px;color:' + UI.dim + ';',
              title: 'Airs of a Barren Zee ' + opt.airs,
            }, ['Airs ' + opt.airs]),
          ]);
        })),
      note(['Two more branches share the storylet and raise no Devotion: ',
        wikiLink('Speak to the Custodial Chef', 'Speak to the Custodial Chef'),
        ' costs nothing and gives nothing, and seeking out one of the Fathomking’s servants '
        + 'sets Devotion straight to 11 for 7 Fate — which is otherwise 17 supplications.']),

      // How far to take it, and how far that is from here.
      h('div', {
        css: 'margin-top:10px;padding:8px 10px;border-left:3px solid ' + UI.accent
          + ';background:' + UI.bgAlt + ';font-size:12px;line-height:1.6;',
      }, [
        h('div', { css: 'color:' + UI.accent + ';font-weight:bold;' }, [
          'Stop at Fivefold Devotion ' + advice.level,
          collection.devotion != null
            ? h('span', { css: 'color:' + UI.dim + ';font-weight:normal;' }, [
              collection.devotion >= advice.level
                ? ' — you are at ' + collection.devotion + '. Go diving.'
                : ' — you are at ' + collection.devotion + ', so at most '
                  + toGo + (toGo === 1 ? ' more action' : ' more actions') + '.',
            ])
            : null,
        ]),
        note([advice.why]),
        collection.coralsWanted == null
          ? note(['(Counted as a Favour run: your Possessions have not been read, so how '
            + 'many corals you still need is not known.)'])
          : null,
        collection.devotion != null && collection.devotion < advice.level
          ? note(['"At most" because Fallen London shows the level but not the change points '
            + 'inside it, so this assumes you have only just reached ' + collection.devotion
            + '.'])
          : null,
      ]),

      table(
        [{ text: 'Devotion' }, { text: 'CP', right: true },
          { text: 'Supplications', right: true }, { text: 'With the dive', right: true }],
        ladder.map(function (row) {
          const here = collection.devotion === row.level;
          const target = advice.level === row.level;
          return h('tr', {
            css: target ? 'background:' + UI.bgAlt + ';' : '',
          }, [
            h('td', { css: TD + 'color:' + (target ? UI.accent : UI.text) + ';' }, [
              String(row.level),
              here ? h('span', { css: 'color:' + COLOR_READY + ';' }, [' ← you']) : null,
              row.level === 5
                ? h('span', { css: 'color:' + UI.dim + ';font-size:11px;' }, [' minimum'])
                : null,
              row.level === 11
                ? h('span', { css: 'color:' + UI.dim + ';font-size:11px;' }, [' cap'])
                : null,
            ]),
            h('td', { css: TD + 'text-align:right;color:' + UI.dim + ';' }, [String(row.cp)]),
            h('td', { css: TD + 'text-align:right;' }, [String(row.actions)]),
            h('td', { css: TD + 'text-align:right;color:' + UI.dim + ';' }, [String(row.dive)]),
          ]);
        })),
      note(['Devotion is pyramidal, so each level costs one more change point than the last. '
        + 'A dive itself is 2 actions on top — one to leave the boat, one to claim the '
        + 'treasure. Diving deeper is free, but failing the attempt ends the dive.']),
    ]);

    const stallTable = table([{ text: 'Item' }, { text: 'Favour', right: true }],
      FOTZ_STALL.concat(FOTZ_EQUIPMENT.map(function (e) {
        return { name: e.name, favour: e.stall, slot: e.slot };
      })).sort(function (a, b) { return a.favour - b.favour; })
        .map(function (item) {
          const afford = collection.favour != null && collection.favour >= item.favour;
          return h('tr', null, [
            h('td', { css: TD }, [wikiLink(item.name, item.name)]),
            h('td', {
              css: TD + 'text-align:right;color:' + (afford ? COLOR_READY : UI.dim) + ';',
              title: afford ? 'You can afford this now.' : '',
            }, [String(item.favour)]),
          ]);
        }));

    const body = h('div', { css: 'padding:0 12px 12px;' }, [
      banners,

      section('Still missing', h('div', null, groupBlocks)),

      section('Treasures to trade', ledgerBlock),

      section('Raising Fivefold Devotion', supplicationBlock),

      section('What each card pays, by depth', h('div', null, [
        depthTable,
        note(['One reward per dive. The wiki’s best all-round line is to raise Fivefold '
          + 'Devotion to 10 and then keep diving until a card worth 300 Favour or more '
          + 'turns up, or you hit the bottom.']),
      ])),

      section('Buying it instead', h('div', null, [
        stallTable,
        note([
          'Plus a wrecked shipment for 95 Favour — a random parcel of saleable items '
            + 'worth about 9.4 Echoes, so a shade under the flat 0.1 Echo per Favour '
            + 'guaranteed by ',
          FOTZ_ECONOMY.map(function (item, i) {
            return h('span', null, [
              i ? (i === FOTZ_ECONOMY.length - 1 ? ' and ' : ', ') : '',
              wikiLink(item.name, item.name),
              h('span', { css: 'color:' + UI.dim + ';' }, [' (' + item.favour + ')']),
            ]);
          }),
          '.',
        ]),
      ])),

      h('div', { css: 'margin-top:12px;color:' + UI.dim + ';font-size:11px;line-height:1.6;' }, [
        h('div', null, ['The badge on a card is the Thalassic Favour its treasure trades '
          + 'for. ', h('b', null, [FOTZ_MARK_NEED]), ' means it also offers something you '
          + 'have not got; ', h('b', null, [FOTZ_MARK_DONE]), ' that you already hold '
          + 'everything it offers; ', h('b', null, [FOTZ_MARK_UNSURE]),
        ' that your Possessions have not been read, so neither can be said. A coral or '
          + 'the Bride pays no Favour, so those are labelled instead and coloured by '
          + 'whether you still need them.']),
        h('div', { css: 'margin-top:6px;' }, ['Data from ',
          wikiLink('Fruits of the Zee Festival (Guide)', 'Fruits of the Zee Festival (Guide)'),
          ', its Item Comparison subpage, and the individual card and option pages on the '
          + 'Fallen London wiki.']),
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
    // The same job for the festival: its qualities (Thalassic Favour, Sights,
    // the depth) off Myself, and how many of each item you hold off
    // Possessions, which is what lets a card badge say "you still need this".
    { name: 'fotz-capture', run: captureFotzState },
    // Finishes a "use" click that had to change route to get to Possessions.
    { name: 'pending-item', run: runPendingItem },
    { name: 'spite-card-ratings', run: spiteCardRatings },
    { name: 'zee-card-ratings', run: zeeCardRatings },
    { name: 'fotz-card-ratings', run: fotzCardRatings },
    // The only feature that decorates a storylet's OPTIONS rather than cards.
    { name: 'fotz-supplication', run: fotzSupplicationBranches },
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
