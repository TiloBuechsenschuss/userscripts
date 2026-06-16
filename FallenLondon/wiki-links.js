// ==UserScript==
// @name         FL - Wiki Links
// @author       Tilo
// @namespace    https://github.com/TiloBuechsenschuss
// @downloadURL  https://raw.githubusercontent.com/TiloBuechsenschuss/userscripts/refs/heads/main/FallenLondon/wiki-links.js
// @version      0.2
// @description  Adds a small "W" badge linking to the Fallen London wiki (fallenlondon.wiki) next to storylet and branch titles in the game. Clicking opens the wiki article for that thing in a new tab. The storylet-list selector is verified against real game HTML; the in-storylet branch selector is still a best-effort guess.
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

  // --- Storylet & branch titles ----------------------------------------
  // Each storylet in a list is a `.media.storylet`; its title is the
  // `<h2 class="media__heading heading heading--3 storylet__heading">` inside
  // `.storylet__body`. VERIFIED against real game HTML: `.storylet__heading`
  // uniquely tags those titles (e.g. "Making your Name: the Infestation",
  // "A Stroll around the Hill"). We deliberately do NOT match the broader
  // `.media__heading` on the same element -- it is reused for other headings
  // across the SPA and would over-badge non-article text.
  //
  // `.branch__heading` is the in-storylet branch title and is still a
  // best-effort guess (following FL's `*__heading` BEM naming, as seen on
  // `storylet__heading`); confirm it once you open a storylet in-game. Keep
  // this list as the single place to fix selectors; the badge/observer
  // plumbing around it does not change. Titles are taken verbatim (no article
  // stripping) -- FL wiki pages keep the full title.
  const TITLE_SELECTORS = [
    '.storylet__heading', // verified
    '.branch__heading',   // best-effort guess
  ];

  function linkStorylets() {
    document.querySelectorAll(TITLE_SELECTORS.join(',')).forEach(function (el) {
      addBadge(el, 'append');
    });
  }

  // --- Dispatch ---------------------------------------------------------
  // SPA: run once now, then re-run (debounced) on every DOM mutation so newly
  // drawn storylets/branches get badged too. addBadge's per-element flag keeps
  // repeated passes idempotent. Observe document.body since the React root is
  // replaced wholesale during navigation.
  let pending = false;
  function scan() {
    pending = false;
    linkStorylets();
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
