// ==UserScript==
// @name         KoL Sell Sort
// @author       Tilo
// @namespace    https://github.com/TiloBuechsenschuss
// @downloadURL  https://raw.githubusercontent.com/TiloBuechsenschuss/userscripts/refs/heads/main/KingdomOfLoathing/sell-sort.js
// @version      1.0
// @description  Adds one toolbar at the top of the autosell page (sellstuff_ugly.php) with Quantity / Sell price / Name sort buttons that reorder every category at once (each still sorted independently and re-laid out in its original two-column grid); click a button again to flip ascending/descending, or Name to restore the original order. A Single list toggle collapses all categories into one combined list sorted globally; clicking it again restores the categories and sorts within each. Also adds an Expand all / Collapse all button that flips every category open or closed depending on the current state (and keeps KoL's "sellstuff" cookie in sync).
// @match        https://www.kingdomofloathing.com/sellstuff_ugly.php*
// @match        https://kingdomofloathing.com/sellstuff_ugly.php*
// @grant        none

// ==/UserScript==

(function () {
  'use strict';

  // Bundled-loader safety: all-in-one.js @requires every KoL script and runs
  // them on the union of all matched pages. The standalone @match already
  // scopes this to sellstuff_ugly.php, but guard explicitly for the bundle.
  if (!/\/sellstuff_ugly\.php/i.test(location.pathname)) return;

  // Idempotency guard: the page/loader may run us more than once.
  if (document.getElementById('kol-sell-sort-bar')) return;

  // The category sections are <div id='sectionN'> where N is the bit value
  // from the page's `sections` map. Find them directly.
  const divs = Array.prototype.slice.call(
    document.querySelectorAll("div[id^='section']")
  ).filter(function (d) { return /^section\d+$/.test(d.id); });
  if (!divs.length) return;

  // --- KoL "sellstuff" cookie (bit set = section hidden) ----------------
  // Mirror the page's own toggle()/cookie logic so collapse/expand persists.
  // We maintain our own copy, re-reading the live cookie on each flip in case
  // the user also clicked KoL's native header toggles in between.
  function readCookie() {
    if (typeof window.getCookie === 'function') {
      var c = parseInt(window.getCookie('sellstuff'), 10);
      return Number.isFinite(c) ? c : 0;
    }
    return 0;
  }

  function isOpen(div) {
    return div.style.display !== 'none';
  }

  // Set a section to open/closed and keep the cookie in sync.
  function setOpen(div, open) {
    if (isOpen(div) === open) return;
    var bit = parseInt(div.id.replace('section', ''), 10);
    var cookie = readCookie();
    if (open) {
      div.style.display = 'inline';
      cookie = cookie & ~bit;
    } else {
      div.style.display = 'none';
      cookie = cookie | bit;
    }
    if (typeof window.setCookie === 'function') {
      window.setCookie('sellstuff', cookie);
    }
  }

  // --- Item scraping ----------------------------------------------------
  // Each item is a pair of <td>s: a checkbox cell followed by an info cell
  // (<a><b>name</b></a> (qty)<br><font size=1>NN Meat</font>). Items are laid
  // out two-per-row; the last row may carry a "&nbsp;" filler cell.
  function scrapeItems(div) {
    var boxes = Array.prototype.slice.call(
      div.querySelectorAll("input[type=checkbox]")
    );
    return boxes.map(function (cb, i) {
      var cbTd = cb.parentNode;
      var infoTd = cbTd.nextElementSibling;
      // Read qty/price from the text that follows the item link, so item
      // names that themselves contain "(...)" can't be misread as a quantity.
      var clone = infoTd.cloneNode(true);
      var a = clone.querySelector('a');
      if (a) a.parentNode.removeChild(a);
      var rest = clone.textContent;
      var qm = rest.match(/\((\d+)\)/);
      var pm = rest.match(/([\d,]+)\s*Meat/i);
      return {
        cbTd: cbTd,
        infoTd: infoTd,
        qty: qm ? parseInt(qm[1], 10) : 1,
        price: pm ? parseInt(pm[1].replace(/,/g, ''), 10) : 0,
        index: i
      };
    });
  }

  // Rebuild the two-column grid in the given order.
  function relayout(tbody, items) {
    while (tbody.firstChild) tbody.removeChild(tbody.firstChild);
    for (var i = 0; i < items.length; i += 2) {
      var tr = document.createElement('tr');
      tr.appendChild(items[i].cbTd);
      tr.appendChild(items[i].infoTd);
      if (items[i + 1]) {
        tr.appendChild(items[i + 1].cbTd);
        tr.appendChild(items[i + 1].infoTd);
      } else {
        var filler = document.createElement('td');
        filler.innerHTML = '&nbsp;';
        tr.appendChild(filler);
      }
      tbody.appendChild(tr);
    }
  }

  // --- Locate the sell form (checkboxes must stay inside it) -----------
  var form = document.forms.f || document.querySelector('form[name=f]');

  // Walk up to the top-level category <table> that is a direct child of form.
  function topTable(node) {
    while (node && node.parentNode && node.parentNode !== form) {
      node = node.parentNode;
    }
    return (node && node.parentNode === form) ? node : null;
  }

  // --- Prepare every section for sorting -------------------------------
  // Each section keeps its own item list, tbody and original order. We also
  // build one combined list (globalOriginal) for the flattened single-list
  // view, and collect the outer category tables so they can be hidden when
  // flattened. A single set of buttons drives both views.
  var sections = [];
  var globalOriginal = [];
  var catTables = [];
  var gIndex = 0;
  divs.forEach(function (div) {
    if (!div.querySelector('table')) return;
    var items = scrapeItems(div);
    if (!items.length) return;
    items.forEach(function (it) { it.globalIndex = gIndex++; });
    sections.push({
      tbody: items[0].cbTd.parentNode.parentNode, // td -> tr -> tbody
      original: items.slice()                     // original (alphabetical)
    });
    items.forEach(function (it) { globalOriginal.push(it); });
    var ct = topTable(div);
    if (ct && catTables.indexOf(ct) === -1) catTables.push(ct);
  });
  if (!sections.length) return;

  var activeKey = null;   // 'qty' | 'price' | null (name/original order)
  var descending = true;  // first click on a key shows biggest first
  var flattened = false;  // single global list vs per-category

  // Sort comparator; idxProp picks the stable tiebreak field (per-section
  // 'index' for category sorts, 'globalIndex' for the flattened list).
  function comparator(idxProp) {
    return function (a, b) {
      var diff = a[activeKey] - b[activeKey];
      if (diff !== 0) return descending ? -diff : diff;
      return a[idxProp] - b[idxProp];
    };
  }

  // Re-lay items according to the current key/direction and view mode.
  function render() {
    if (flattened) {
      var ordered = activeKey === null
        ? globalOriginal.slice()
        : globalOriginal.slice().sort(comparator('globalIndex'));
      relayout(flatTbody, ordered);
    } else {
      sections.forEach(function (s) {
        var ordered = activeKey === null
          ? s.original.slice()
          : s.original.slice().sort(comparator('index'));
        relayout(s.tbody, ordered);
      });
    }
  }

  function applySort(key) {
    if (key === 'name') {
      activeKey = null;
    } else if (key === activeKey) {
      descending = !descending;
    } else {
      activeKey = key;
      descending = true;
    }
    render();
    updateLabels();
  }

  // --- Flattened single-list container (hidden until toggled) ----------
  // Mimics a category table so it blends in; render() moves the real item
  // cells into its inner tbody, and back into their sections on restore.
  var flatTable = document.createElement('table');
  flatTable.id = 'kol-sell-sort-flat';
  flatTable.width = '95%';
  flatTable.cellSpacing = '0';
  flatTable.cellPadding = '0';
  flatTable.style.display = 'none';
  flatTable.innerHTML =
    '<tr><td style="background-color: blue" align=center>' +
      '<b style="color: white">All Items</b></td></tr>' +
    '<tr><td style="padding: 5px; border: 1px solid blue;"><center>' +
      '<table width=100%><tbody></tbody></table>' +
    '</center></td></tr>';
  var flatTbody = flatTable.getElementsByTagName('table')[0].tBodies[0];
  if (catTables.length) {
    catTables[0].parentNode.insertBefore(flatTable, catTables[0]);
  } else {
    form.appendChild(flatTable);
  }

  function setFlattened(on) {
    flattened = on;
    catTables.forEach(function (t) { t.style.display = on ? 'none' : ''; });
    flatTable.style.display = on ? '' : 'none';
    toggleBtn.style.display = on ? 'none' : ''; // expand/collapse is moot flat
    render();
    updateFlattenLabel();
  }

  // --- Toolbar ---------------------------------------------------------
  // Expand all / Collapse all (per-category view only).
  function toggleAll() {
    var anyOpen = divs.some(isOpen);
    divs.forEach(function (d) { setOpen(d, !anyOpen); });
    updateToggleAllLabel();
  }

  var toggleBtn = document.createElement('button');
  toggleBtn.type = 'button';
  toggleBtn.style.cssText = 'cursor:pointer;';
  toggleBtn.addEventListener('click', toggleAll);

  function updateToggleAllLabel() {
    toggleBtn.textContent = divs.some(isOpen) ? 'Collapse all' : 'Expand all';
  }
  updateToggleAllLabel();

  // Single list / Show categories toggle.
  var flattenBtn = document.createElement('button');
  flattenBtn.type = 'button';
  flattenBtn.style.cssText = 'margin-left:8px;cursor:pointer;';
  flattenBtn.addEventListener('click', function () { setFlattened(!flattened); });

  function updateFlattenLabel() {
    flattenBtn.textContent = flattened ? 'Show categories' : 'Single list';
  }
  updateFlattenLabel();

  var topBar = document.createElement('div');
  topBar.id = 'kol-sell-sort-bar';
  topBar.style.cssText =
    'text-align:center;margin:4px 0;font-family:arial;font-size:9pt;';
  topBar.appendChild(toggleBtn);
  topBar.appendChild(flattenBtn);

  // One shared set of sort buttons, applied to every category (or the list).
  var sortButtons = [];
  var sortLabel = document.createElement('span');
  sortLabel.textContent = ' Sort: ';
  topBar.appendChild(sortLabel);
  [['qty', 'Quantity'], ['price', 'Sell price'], ['name', 'Name']]
    .forEach(function (spec) {
      var key = spec[0];
      var btn = document.createElement('button');
      btn.type = 'button'; // must not submit the sell form
      btn.textContent = spec[1];
      btn.style.cssText = 'margin-left:4px;cursor:pointer;';
      btn.addEventListener('click', function () { applySort(key); });
      sortButtons.push({ el: btn, key: key, base: spec[1] });
      topBar.appendChild(btn);
    });

  function updateLabels() {
    sortButtons.forEach(function (b) {
      if (b.key !== 'name' && b.key === activeKey) {
        b.el.textContent = b.base + (descending ? ' ▼' : ' ▲');
      } else {
        b.el.textContent = b.base;
      }
    });
  }

  // Drop the toolbar at the very top of the sell form so it's always visible.
  if (form && form.firstChild) {
    form.insertBefore(topBar, form.firstChild);
  } else {
    document.body.insertBefore(topBar, document.body.firstChild);
  }
})();
