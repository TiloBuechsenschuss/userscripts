// ==UserScript==
// @name         KoL - Wiki Links
// @author       Tilo
// @namespace    https://github.com/TiloBuechsenschuss
// @downloadURL  https://raw.githubusercontent.com/TiloBuechsenschuss/userscripts/refs/heads/main/KingdomOfLoathing/wiki-links.js
// @version      0.8
// @description  Adds a small "W" badge linking to the KoL wiki (wiki.kingdomofloathing.com) next to the last adventure in the charpane, the location name atop place.php, the choice-adventure name atop choice.php, each quest title in questlog.php, the monster name in combat and items you acquire (fight.php), and item names in your inventory (inventory.php). Clicking opens the wiki article for that thing in a new tab. All targets are verified against real page HTML.
// @match        https://www.kingdomofloathing.com/charpane.php*
// @match        https://kingdomofloathing.com/charpane.php*
// @match        https://www.kingdomofloathing.com/choice.php*
// @match        https://kingdomofloathing.com/choice.php*
// @match        https://www.kingdomofloathing.com/questlog.php*
// @match        https://kingdomofloathing.com/questlog.php*
// @match        https://www.kingdomofloathing.com/place.php*
// @match        https://kingdomofloathing.com/place.php*
// @match        https://www.kingdomofloathing.com/fight.php*
// @match        https://kingdomofloathing.com/fight.php*
// @match        https://www.kingdomofloathing.com/inventory.php*
// @match        https://kingdomofloathing.com/inventory.php*
// @run-at       document-idle
// @grant        none
// ==/UserScript==

(function () {
  'use strict';

  const WIKI_BASE = 'https://wiki.kingdomofloathing.com/';

  // --- Wiki URL ---------------------------------------------------------
  // Link via MediaWiki's "Go" search (index.php?search=...&go=Go) rather than
  // a direct /Title path. When the name is an exact page title, Go redirects
  // straight to the article (and is already first-letter-case-insensitive);
  // when it is not (a slightly-off quest title, a redirect we don't know, a
  // name with adjectives), it lands on the search-results page for the text,
  // which is still useful instead of a dead redlink. URLSearchParams encodes
  // spaces as '+' and ':' as '%3A', matching the wiki's own search URLs.
  function wikiHref(name) {
    const t = name.trim().replace(/\s+/g, ' ');
    if (!t) return null;
    const qs = new URLSearchParams({ search: t, title: 'Special:Search', go: 'Go' });
    return WIKI_BASE + 'index.php?' + qs.toString();
  }

  // KoL prints monster names with a leading article ("a baguette lady",
  // "an ocelot", "the spooky ghost"), but the wiki article drops it
  // ("Baguette lady"). Strip one leading a/an/the before building the title.
  // NOTE: a few foes carry "The" as part of the real page name (e.g. bosses);
  // those are the rare exception and can be special-cased later if needed.
  function stripArticle(name) {
    return name.replace(/^\s*(an?|the)\s+/i, '');
  }

  // The "W" badge. Small, opens in a new tab so a misclick mid-fight does
  // not navigate the game page away. Marked with a class for the per-target
  // idempotency check below. Inline styles only (repo convention).
  function makeBadge(name) {
    const href = wikiHref(name);
    if (!href) return null;
    const a = document.createElement('a');
    a.className = 'kol-wiki-link';
    a.href = href;
    a.target = '_blank';
    a.rel = 'noopener';
    a.textContent = 'W';
    a.title = 'KoL wiki: ' + name.trim();
    a.style.cssText =
      'display:inline-block;margin-left:4px;padding:0 3px;' +
      'font-family:arial,sans-serif;font-size:9px;font-weight:bold;' +
      'line-height:13px;color:#fff;background:#3366cc;border-radius:2px;' +
      'text-decoration:none;vertical-align:middle;cursor:pointer;';
    return a;
  }

  // Badge `el`, once, deriving the wiki title from `name` (defaults to the
  // element's own text). `place` is 'after' (badge becomes the next sibling —
  // good for inline names) or 'append' (badge becomes the last child — good
  // for headings, so the W sits on the heading line). The data-kol-wiki flag
  // makes this idempotent: scripts may run more than once per page, and the
  // name is read before the badge is added either way.
  function addBadge(el, place, name) {
    if (!el || el.dataset.kolWiki) return;
    name = (name != null ? name : el.textContent).trim();
    if (!name) return;
    const badge = makeBadge(name);
    if (!badge) return;
    el.dataset.kolWiki = '1';
    if (place === 'append') el.appendChild(badge);
    else el.after(badge);
  }

  // --- Last adventure (charpane.php) -----------------------------------
  // The charpane shows a "Last Adventure:" label anchor, then (in a sibling
  // <table>) the adventure-name link itself, e.g.
  //   <a href="place.php?whichplace=town_right">Last Adventure:</a><br>
  //   <table>...<a href="adventure.php?snarfblat=440">Madness Bakery</a>...
  // Anchor on the label by its text and badge the very next anchor in
  // document order — that is the adventure name. Reading by position (rather
  // than by href) keeps it working for adventures linked via place.php as
  // well as the usual adventure.php?snarfblat= form; the wiki title comes
  // from the link text either way.
  function linkLastAdventure() {
    const anchors = Array.from(document.querySelectorAll('a'));
    const i = anchors.findIndex(function (a) {
      return /last adventure/i.test(a.textContent);
    });
    if (i === -1) return;
    addBadge(anchors[i + 1], 'after');
  }

  // --- Page title bar (place.php, choice.php) --------------------------
  // Both pages head with a blue title bar whose cell holds the name in
  // white bold:
  //   <td style="background-color: blue"><b style="color: white">Name</b></td>
  // On place.php this is the location ("The Right Side of the Tracks"); on
  // choice.php it is the choice adventure ("The Popular Machine"). Badge that
  // <b>. Unlike monsters, the leading article is NOT stripped: the wiki page
  // keeps it. NOTE: other pages share this exact bar but with non-article
  // titles — fight.php ("Combat!"), questlog.php ("Your Quest Log") — so this
  // is wired only into the place/choice dispatch branches, never called there.
  function linkTitleBar() {
    const td = document.querySelector('td[style*="background-color: blue"]');
    if (td) addBadge(td.querySelector('b'), 'after');
  }

  // --- Quest titles (questlog.php) -------------------------------------
  // Each current quest is introduced by its title as a <b> that is a DIRECT
  // child of the <blockquote> holding the quest list, e.g.
  //   <blockquote><b>Lady Spookyraven's Babies</b><br> Gather up ...
  // The other <b>s in the body (place links like "Spookyraven Manor") are
  // nested inside <a>, and the "Current/Other Quests:" headers sit outside
  // the blockquote, so `blockquote > b` selects exactly the quest titles.
  // No article stripping: the wiki quest page keeps the title verbatim.
  function linkQuests() {
    document.querySelectorAll('blockquote > b')
      .forEach(function (b) { addBadge(b, 'after'); });
  }

  // --- Combat monster (fight.php) --------------------------------------
  // Verified: the current foe's name sits in <span id="monname">, including
  // the leading article ("a gingerbread murderer"; the page also carries a
  // <!-- MONSTERID --> comment, but the wiki has no id lookup, so we go by
  // name). Strip the article so the Go-search lands on the page; badge after
  // the span, searching on the stripped name via addBadge's name argument.
  function linkMonster() {
    const el = document.getElementById('monname');
    if (!el) return;
    addBadge(el, 'after', stripArticle(el.textContent));
  }

  // --- Items acquired (fight.php) --------------------------------------
  // Verified: acquire lines read "You acquire an item: <b>name</b>" and, for
  // bounty drops, "You acquire a bounty item: <b>name</b>" — both wanted, and
  // both caught by the "acquire ... item" test on the line's text. Effect
  // gains ("You acquire an effect: ...") lack "item" and are skipped, as is
  // other bold text on the page (familiar shouts, stat numbers) whose line
  // has no "acquire item". The name is a direct-child <b> of the line cell.
  // CAVEAT (still untested): a multi-quantity drop bolds a number-prefixed,
  // pluralised name ("You acquire <b>5 ginger snapses</b>"), which won't
  // match the singular wiki page; needs a quantity/plural strip once seen.
  function linkDrops() {
    document.querySelectorAll('b').forEach(function (b) {
      const parent = b.parentElement;
      if (parent && /you acquire\b.*\bitems?\b/i.test(parent.textContent)) {
        addBadge(b, 'after');
      }
    });
  }

  // --- Inventory item names (inventory.php) ----------------------------
  // Each item's name is a <b class="ircm"> in its name cell, e.g.
  //   <td id="i1593"><b rel="..." class="ircm">cold hi mein</b>&nbsp;<span>(118)</span>...
  // The clickable description icon beside it is an <img class="hand ircm">
  // (an image, not a <b>), so b.ircm uniquely selects names. Category headers
  // are <b class="tit"> and the page title is a plain white <b>, so neither is
  // matched. No article stripping: item names can legitimately start with "a"
  // (e.g. "a little sump'm sump'm").
  function linkInventory() {
    document.querySelectorAll('b.ircm')
      .forEach(function (b) { addBadge(b, 'after'); });
  }

  // --- Dispatch ---------------------------------------------------------
  // Gate by page so this stays inert in any frame it is injected into that
  // it does not handle. (When/if it joins all-in-one.js, that loader runs
  // every script on the union of matched pages, so explicit gating matters.)
  const path = location.pathname.toLowerCase();
  if (/\/charpane\.php/.test(path)) linkLastAdventure();
  if (/\/(place|choice)\.php/.test(path)) linkTitleBar();
  if (/\/questlog\.php/.test(path)) linkQuests();
  if (/\/fight\.php/.test(path)) {
    linkMonster();
    linkDrops();
  }
  if (/\/inventory\.php/.test(path)) linkInventory();
})();
