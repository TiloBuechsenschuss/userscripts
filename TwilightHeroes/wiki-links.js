// ==UserScript==
// @name         Twilight Heroes Wiki Links
// @author       Tilo
// @namespace    https://github.com/TiloBuechsenschuss
// @downloadURL  https://raw.githubusercontent.com/TiloBuechsenschuss/userscripts/refs/heads/main/TwilightHeroes/wiki-links.js
// @version      1.1
// @description  Adds a small "W" badge that links to the TH wiki (th.blandsauce.com) next to the monster name in combat, the encounter name in non-combat adventures, items you receive ("You got an item: ..."), each area on the map/square pages, the last area patrolled in the nav sidebar, each quest in the Hero's Journal, and each item name on the inventory/wearables/use pages. Clicking opens the wiki article for that thing in a new tab.
// @match        https://www.twilightheroes.com/fight.php*
// @match        https://twilightheroes.com/fight.php*
// @match        https://www.twilightheroes.com/nav.php*
// @match        https://twilightheroes.com/nav.php*
// @match        https://www.twilightheroes.com/journal.php*
// @match        https://twilightheroes.com/journal.php*
// @match        https://www.twilightheroes.com/maps/*
// @match        https://twilightheroes.com/maps/*
// @match        https://www.twilightheroes.com/inventory.php*
// @match        https://twilightheroes.com/inventory.php*
// @match        https://www.twilightheroes.com/wear.php*
// @match        https://twilightheroes.com/wear.php*
// @match        https://www.twilightheroes.com/use.php*
// @match        https://twilightheroes.com/use.php*
// @run-at       document-idle
// @grant        none
// ==/UserScript==

(function () {
  'use strict';

  const WIKI_BASE = 'https://th.blandsauce.com/wiki/';

  // --- Wiki URL ---------------------------------------------------------
  // The wiki is a stock MediaWiki: article titles have their first letter
  // auto-capitalised and spaces written as underscores (e.g. "treaded robot"
  // -> /wiki/Treaded_robot). encodeURIComponent handles the rest; it leaves
  // underscores untouched and does not encode ()'! which appear in some
  // item/monster names, so the resulting path matches MediaWiki's own.
  function wikiHref(name) {
    let t = name.trim().replace(/\s+/g, ' ');
    if (!t) return null;
    t = t.charAt(0).toUpperCase() + t.slice(1);
    return WIKI_BASE + encodeURIComponent(t.replace(/ /g, '_'));
  }

  // The "W" badge. Small, opens in a new tab so a misclick mid-fight does
  // not navigate the game page away. Marked with a class for the per-target
  // idempotency check below. Inline styles only (repo convention).
  function makeBadge(name) {
    const href = wikiHref(name);
    if (!href) return null;
    const a = document.createElement('a');
    a.className = 'th-wiki-link';
    a.href = href;
    a.target = '_blank';
    a.rel = 'noopener';
    a.textContent = 'W';
    a.title = 'TH wiki: ' + name.trim();
    a.style.cssText =
      'display:inline-block;margin-left:4px;padding:0 3px;' +
      'font-family:arial,sans-serif;font-size:9px;font-weight:bold;' +
      'line-height:13px;color:#fff;background:#3366cc;border-radius:2px;' +
      'text-decoration:none;vertical-align:middle;cursor:pointer;';
    return a;
  }

  // Badge `el`, once. `place` is 'after' (badge becomes the next sibling —
  // good for inline <b> names) or 'append' (badge becomes the last child —
  // good for block headings, so the W sits on the heading line). The
  // data-th-wiki flag makes this idempotent: scripts may run more than once
  // per page, and the name is read before the badge is added either way.
  function addBadge(el, place) {
    if (!el || el.dataset.thWiki) return;
    const name = el.textContent.trim();
    if (!name) return;
    const badge = makeBadge(name);
    if (!badge) return;
    el.dataset.thWiki = '1';
    if (place === 'append') el.appendChild(badge);
    else el.after(badge);
  }

  // --- Combat (fight.php) ----------------------------------------------
  // The current foe is <b id="enemy">name</b>, followed by a <div id="level">.
  // 'after' drops the badge between the two, right next to the name.
  function linkCombat() {
    addBadge(document.getElementById('enemy'), 'after');
  }

  // --- Non-combat encounter (fight.php) --------------------------------
  // A non-combat adventure heads its result with <h2>Encounter Name</h2>
  // (combat uses <h1>Combat!</h1> instead, so an <h2> here is the encounter
  // name). Append the badge inside the heading so it sits on its line.
  function linkEncounter() {
    addBadge(document.querySelector('h2'), 'append');
  }

  // --- Item drops (fight.php) ------------------------------------------
  // Items received are shown as <td>You got an item: <b>name</b></td> (also
  // appears on the combat-victory results page). These <b>s are not in the
  // width=50% name cells, so match them via the surrounding "You got ... item"
  // text. The trailing space in the <b> is handled by addBadge's trim().
  function linkDrops() {
    document.querySelectorAll('td > b').forEach(function (b) {
      if (/you got\b.*\bitems?\b/i.test(b.parentElement.textContent)) {
        addBadge(b, 'after');
      }
    });
  }

  // --- Last area patrolled (nav.php) -----------------------------------
  // The sidebar shows <a>Last Area Patrolled:</a><BR><a ...>area name</a>.
  // Find the label anchor by its text, then badge the next anchor (the area).
  function linkLastArea() {
    const label = Array.from(document.querySelectorAll('a')).find(function (a) {
      return /last area patrolled/i.test(a.textContent);
    });
    if (!label) return;
    let el = label.nextElementSibling;
    while (el && el.tagName !== 'A') el = el.nextElementSibling;
    if (el) addBadge(el, 'after');
  }

  // --- Quests (journal.php) --------------------------------------------
  // Main quests are <h2>Quest Name</h2> (followed by a description); B-quests
  // are <b>Quest Name</b><BR>description rows. The page's only other <h2> is
  // the "B-Quests" tier divider, skipped via the <letter>-Quests test, and
  // its only <b> elements are the B-quest titles.
  function linkQuests() {
    document.querySelectorAll('h2').forEach(function (h) {
      if (/^[a-z]-quests$/i.test(h.textContent.trim())) return; // tier divider
      addBadge(h, 'append');
    });
    document.querySelectorAll('b').forEach(function (b) { addBadge(b, 'after'); });
  }

  // --- Map areas (maps/*.php) ------------------------------------------
  // Each location on a square/map page is a <table width=164> holding an
  // image link and, below it, a text link to the same place (patrol spots,
  // shops, train/rest). Badge the text link (the one with no <img>); the
  // image links and the bgcolor section-header tables (width=100%) are
  // skipped. These pages have unclosed <table>s that the parser nests, so an
  // anchor can be reached via two tables — addBadge's flag dedupes that.
  function linkAreas() {
    document.querySelectorAll('table[width="164"] a').forEach(function (a) {
      if (a.querySelector('img')) return;
      addBadge(a, 'after');
    });
  }

  // --- Item lists (inventory.php / wear.php / use.php) ------------------
  // Same layout inventory-filter.js targets: each item is a name cell
  // <td width="50%"> whose direct child <b> holds the item name. Filler
  // cells and wear.php's <td colspan="4"> category headers have no such <b>,
  // so this naturally skips them.
  function linkItems() {
    document.querySelectorAll('td[width="50%"] > b')
      .forEach(function (b) { addBadge(b, 'after'); });
  }

  // --- Dispatch ---------------------------------------------------------
  // Gate by page: the all-in-one loader runs every TH script on the union of matched
  // pages, so scope each branch explicitly rather than relying on @match.
  const path = location.pathname.toLowerCase();
  if (/\/fight\.php/.test(path)) {
    linkCombat();
    linkEncounter();
    linkDrops();
  }
  if (/\/nav\.php/.test(path)) linkLastArea();
  if (/\/journal\.php/.test(path)) linkQuests();
  if (/\/maps\//.test(path)) linkAreas();
  if (/\/(inventory|wear|use)\.php/.test(path)) linkItems();
})();
