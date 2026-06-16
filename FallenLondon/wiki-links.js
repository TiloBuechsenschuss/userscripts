// ==UserScript==
// @name         FL - Wiki Links
// @author       Tilo
// @namespace    https://github.com/TiloBuechsenschuss
// @downloadURL  https://raw.githubusercontent.com/TiloBuechsenschuss/userscripts/refs/heads/main/FallenLondon/wiki-links.js
// @version      0.5
// @description  Adds a small "W" badge linking to the Fallen London wiki (fallenlondon.wiki) next to storylet titles in the game -- in a storylet list, at the top of an opened storylet, and on each opportunity card in your hand (both the compact and the full-width card layouts). Clicking opens the wiki article for that storylet/card in a new tab. The individual branch/choice titles inside an opened storylet are intentionally left unlinked. Selectors verified against real game HTML.
// @match        https://www.fallenlondon.com/*
// @match        https://fallenlondon.com/*
// @run-at       document-idle
// @grant        none
// ==/UserScript==

(function () {
  'use strict';

  // Fallen London is a single-page React app: storylets, branches and results
  // are swapped into the DOM client-side without any page navigation. So unlike
  // the server-rendered KoL/TH scripts (one document-idle pass), this one must
  // re-scan whenever the DOM changes -- see the MutationObserver at the bottom.

  const WIKI_BASE = 'https://fallenlondon.wiki/';

  // --- Wiki URL ---------------------------------------------------------
  // The wiki is MediaWiki (+ Semantic MediaWiki). Link via its "Go" search
  // (wiki/Special:Search?search=...&go=Go): when the name is an exact page
  // title, Go redirects straight to the article (already first-letter-case-
  // insensitive); when it is not (a slightly-off title, a name with extra
  // words), it lands on the search-results page for the text, which is still
  // useful instead of a dead redlink. Verified live: this form resolves
  // "Making Waves" to its article and is the same pattern the KoL script uses.
  // URLSearchParams encodes spaces as '+' and ':' as '%3A'.
  function wikiHref(name) {
    const t = name.trim().replace(/\s+/g, ' ');
    if (!t) return null;
    const qs = new URLSearchParams({ search: t, go: 'Go' });
    return WIKI_BASE + 'wiki/Special:Search?' + qs.toString();
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
  let pending = false;
  function scan() {
    pending = false;
    linkStorylets();
    linkHandCards();
  }
  function schedule() {
    if (pending) return;
    pending = true;
    requestAnimationFrame(scan);
  }

  scan();
  new MutationObserver(schedule).observe(document.body, {
    childList: true,
    subtree: true,
  });
})();
