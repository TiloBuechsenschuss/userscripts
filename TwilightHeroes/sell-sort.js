// ==UserScript==
// @name         Twilight Heroes - Sell Sort
// @author       Tilo
// @namespace    https://github.com/TiloBuechsenschuss
// @downloadURL  https://raw.githubusercontent.com/TiloBuechsenschuss/userscripts/refs/heads/main/TwilightHeroes/sell-sort.js
// @version      1.0
// @description  Adds buttons above the item list on the Sell Things page (sell.php) to reorder the list by quantity or by sell price instead of the default alphabetical order. Click a button again to flip between descending and ascending; a Name button restores the original order.
// @match        https://www.twilightheroes.com/sell.php*
// @match        https://twilightheroes.com/sell.php*
// @grant        none
// ==/UserScript==

(function () {
  'use strict';

  // Idempotency guard: this script may run more than once per page.
  if (document.getElementById('th-sell-sort')) return;

  // The sell form is <form name=sell ...> wrapping a single multi-select
  // <select name='whichitem[]'>. Locate it defensively rather than by index.
  const select =
    document.querySelector("select[name='whichitem[]']") ||
    (document.forms.sell && document.forms.sell.elements['whichitem[]']);
  if (!select || select.tagName !== 'SELECT') return;

  // Quantity comes from the option's count= attribute (always present and
  // reliable); fall back to the "(N)" the label shows for stacks, else 1.
  // Sell price comes from the "[N chips each]" / "[N chips]" suffix.
  function readOption(opt, index) {
    let qty = parseInt(opt.getAttribute('count'), 10);
    if (!Number.isFinite(qty)) {
      const m = opt.textContent.match(/\((\d+)\)\s*\[/);
      qty = m ? parseInt(m[1], 10) : 1;
    }
    const p = opt.textContent.match(/\[(\d+)\s*chips/i);
    const price = p ? parseInt(p[1], 10) : 0;
    return { opt: opt, qty: qty, price: price, index: index };
  }

  // Snapshot the original (alphabetical) order so "Name" can restore it.
  const original = Array.from(select.options);
  const rows = original.map(readOption);

  // Track the active sort so a second click on the same key flips direction.
  // Default to descending the first time a key is picked (biggest first).
  let activeKey = null;
  let descending = true;

  function applySort(key) {
    if (key === 'name') {
      original.forEach(function (o) { select.appendChild(o); });
      activeKey = null;
      updateLabels();
      return;
    }
    if (key === activeKey) {
      descending = !descending;
    } else {
      activeKey = key;
      descending = true;
    }
    const sorted = rows.slice().sort(function (a, b) {
      const diff = a[key] - b[key];
      if (diff !== 0) return descending ? -diff : diff;
      // Stable tiebreak on the original alphabetical position.
      return a.index - b.index;
    });
    sorted.forEach(function (r) { select.appendChild(r.opt); });
    updateLabels();
  }

  // --- UI ---------------------------------------------------------------
  const wrap = document.createElement('div');
  wrap.id = 'th-sell-sort';
  wrap.style.cssText = 'margin:4px 0;font-family:arial;font-size:10pt;';

  const label = document.createElement('span');
  label.textContent = 'Sort: ';
  wrap.appendChild(label);

  const buttons = {};
  [['quantity', 'qty', 'Quantity'], ['price', 'price', 'Sell price'], ['name', null, 'Name']]
    .forEach(function (spec) {
      const id = spec[0];
      const key = spec[1];
      const btn = document.createElement('button');
      btn.type = 'button'; // must not submit the sell form
      btn.textContent = spec[2];
      btn.style.cssText = 'margin-left:4px;cursor:pointer;';
      btn.addEventListener('click', function () { applySort(key || 'name'); });
      buttons[id] = { el: btn, key: key, base: spec[2] };
      wrap.appendChild(btn);
    });

  // Show an arrow on the active button reflecting the current direction.
  function updateLabels() {
    Object.keys(buttons).forEach(function (id) {
      const b = buttons[id];
      if (b.key && b.key === activeKey) {
        b.el.textContent = b.base + (descending ? ' ▼' : ' ▲');
      } else {
        b.el.textContent = b.base;
      }
    });
  }

  select.parentNode.insertBefore(wrap, select);
})();
