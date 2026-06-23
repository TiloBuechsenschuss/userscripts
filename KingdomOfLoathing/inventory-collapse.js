// ==UserScript==
// @name         KoL Inventory Collapse
// @author       Tilo
// @namespace    https://github.com/TiloBuechsenschuss
// @downloadURL  https://raw.githubusercontent.com/TiloBuechsenschuss/userscripts/refs/heads/main/KingdomOfLoathing/inventory-collapse.js
// @version      1.0
// @description  Adds a single Collapse all / Expand all button at the top of the categorized inventory (inventory.php) that flips every category header open or closed at once. The label reflects the next action: if every category is currently open it collapses them all, otherwise it expands them all. Reuses KoL's own toggle() so the "inventory" cookie stays in sync and lazily-loaded sections still fetch their items on expand (falls back to a plain DOM flip if toggle() is unavailable).
// @match        https://www.kingdomofloathing.com/inventory.php*
// @match        https://kingdomofloathing.com/inventory.php*
// @run-at       document-idle
// @grant        none
// ==/UserScript==

(function () {
  'use strict';

  // Bundled-loader safety: the all-in-one loader @requires every KoL script and runs
  // them on the union of all matched pages. The standalone @match already
  // scopes this to inventory.php, but guard explicitly for the bundle.
  if (!/\/inventory\.php/i.test(location.pathname)) return;

  // Idempotency guard: the page/loader may run us more than once.
  if (document.getElementById('kol-inv-collapse-bar')) return;

  // --- Locate the category headers -------------------------------------
  // Each collapsible category is a <b class="tit"><a class="nounder"
  // href="javascript:toggle('Food and Drink');">. We act on every such
  // anchor; its open/closed state is read from the sibling
  // <div class="collapse" id="sectionN"> inside the same table.stuffbox
  // (display:none = collapsed, display:inline = open).
  function getEntries() {
    var anchors = Array.prototype.slice.call(
      document.querySelectorAll('b.tit a.nounder')
    );
    var entries = [];
    anchors.forEach(function (a) {
      var m = /toggle\('(.+?)'\)/.exec(a.getAttribute('href') || '');
      if (!m) return;
      var box = a.closest('table.stuffbox');
      var div = box && box.querySelector('div.collapse[id^="section"]');
      if (!div) return;
      entries.push({ name: m[1], div: div });
    });
    return entries;
  }

  function isCollapsed(div) {
    // Inline style is what KoL's toggle() sets; trust it, but fall back to
    // computed style if some other path cleared the inline value.
    var d = div.style.display;
    if (d === 'none') return true;
    if (d === 'inline' || d === 'block' || d === 'inline-block') return false;
    return getComputedStyle(div).display === 'none';
  }

  // --- Flip one category to a target state -----------------------------
  // Prefer the page's own toggle(): it keeps the "inventory" cookie in sync,
  // updates the "(click to open)" label, and AJAX-loads a section's items the
  // first time it is opened. Only call it when a flip is actually needed, so
  // we never accidentally toggle a section that is already in the wanted state.
  function flipTo(entry, collapse) {
    if (isCollapsed(entry.div) === collapse) return; // already correct
    if (typeof window.toggle === 'function') {
      window.toggle(entry.name);
      return;
    }
    // Fallback: plain DOM flip (no cookie / no lazy-load) if toggle() is gone.
    entry.div.style.display = collapse ? 'none' : 'inline';
    var box = entry.div.closest('table.stuffbox');
    var label = box && box.querySelector('.collapsed');
    if (label) label.textContent = collapse ? '(click to open)' : '';
  }

  // --- Build the toolbar ------------------------------------------------
  var bar = document.createElement('div');
  bar.id = 'kol-inv-collapse-bar';
  bar.style.cssText =
    'text-align:center;margin:4px auto;padding:4px;width:95%;';

  var btn = document.createElement('button');
  btn.type = 'button';
  btn.style.cssText = 'cursor:pointer;padding:2px 10px;font-weight:bold;';
  bar.appendChild(btn);

  // Decide the button's next action and label from the live page state:
  // if every category is currently open, the next click collapses them all;
  // otherwise (all closed or a mix) the next click expands them all.
  function refreshLabel() {
    var entries = getEntries();
    var allOpen = entries.length > 0 && entries.every(function (e) {
      return !isCollapsed(e.div);
    });
    btn.dataset.action = allOpen ? 'collapse' : 'expand';
    btn.textContent = allOpen ? 'Collapse all' : 'Expand all';
  }

  btn.addEventListener('click', function () {
    var collapse = btn.dataset.action === 'collapse';
    getEntries().forEach(function (e) { flipTo(e, collapse); });
    refreshLabel();
  });

  // --- Insert the toolbar above the first category ---------------------
  var firstBox = document.querySelector('table.stuffbox');
  if (!firstBox) return; // not the categorized list view
  var anchor = firstBox.closest('a[name]') || firstBox;
  anchor.parentNode.insertBefore(bar, anchor);

  refreshLabel();
})();
