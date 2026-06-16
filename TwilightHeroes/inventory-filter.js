// ==UserScript==
// @name         Twilight Heroes Inventory Filter
// @author       Tilo
// @namespace    https://github.com/TiloBuechsenschuss
// @downloadURL  https://raw.githubusercontent.com/TiloBuechsenschuss/userscripts/refs/heads/main/TwilightHeroes/inventory-filter.js
// @version      2.2
// @description  Adds a live text filter above the item list on the Wearable Items page (wear.php), the full Inventory (inventory.php), and the Use Something page (use.php); items whose name does not contain the typed text are hidden. On pages with consumables a Type dropdown also filters by caffeine, sugar, or both. Emptied rows and category headers collapse too, leaving no gaps.
// @match        https://www.twilightheroes.com/wear.php*
// @match        https://twilightheroes.com/wear.php*
// @match        https://www.twilightheroes.com/inventory.php*
// @match        https://twilightheroes.com/inventory.php*
// @match        https://www.twilightheroes.com/use.php*
// @match        https://twilightheroes.com/use.php*
// @grant        none
// ==/UserScript==

(function () {
  'use strict';

  // Filter state is kept in sessionStorage so it survives the page reload
  // that happens every time you equip/unequip/use an item. Keyed per page
  // so a filter typed on one page doesn't leak onto another.
  const TEXT_KEY = 'thItemFilter:' + location.pathname;
  const TYPE_KEY = 'thItemType:' + location.pathname;

  // --- Locating the item table ----------------------------------------
  // wear.php layout:      <h2>Wearable Items</h2><font class='text'><table>...
  // inventory.php layout: <h1>Inventory</h1><font class='text'><table>...
  // use.php layout:       <h1>Use Something</h1><font class='text'>...<table>...
  // All lay items out as 4-column rows (img + name)*2; only wear.php has
  // category-header rows.
  const HEADINGS = ['wearable items', 'inventory', 'use something'];

  function findItemsTable() {
    for (const h of document.querySelectorAll('h1, h2')) {
      if (!HEADINGS.includes(h.textContent.trim().toLowerCase())) continue;
      let el = h.nextElementSibling;
      while (el) {
        if (el.tagName === 'TABLE') return el;
        const inner = el.querySelector && el.querySelector('table');
        if (inner) return inner;
        el = el.nextElementSibling;
      }
    }
    return null;
  }

  // A category header is a row whose only cell spans all 4 columns.
  // (Present on wear.php, absent on inventory.php / use.php.)
  function isHeaderRow(row) {
    const td = row.cells[0];
    return !!td && td.getAttribute('colspan') === '4';
  }

  // Each item = a name cell (td[width=50%] containing <b>) plus the
  // preceding image cell. Filler cells (just &nbsp;) have no <b>.
  //
  // An item's consumable type comes from its action-link labels, e.g.
  // [caffeine], [sugar], or [caff/sugar] (which counts as both). We match
  // on substrings so 'caff/sugar' sets both flags from one link.
  function getItems(table) {
    const items = [];
    table.querySelectorAll('td[width="50%"]').forEach(function (nameCell) {
      const b = nameCell.querySelector('b');
      if (!b) return;
      let caffeine = false;
      let sugar = false;
      nameCell.querySelectorAll('a').forEach(function (a) {
        const t = a.textContent.toLowerCase();
        if (t.includes('caff')) caffeine = true;
        if (t.includes('sugar')) sugar = true;
      });
      items.push({
        name: b.textContent.trim().toLowerCase(),
        caffeine: caffeine,
        sugar: sugar,
        nameCell: nameCell,
        imgCell: nameCell.previousElementSibling
      });
    });
    return items;
  }

  // --- Filtering -------------------------------------------------------
  function applyFilter(table, query, type) {
    const q = query.trim().toLowerCase();

    getItems(table).forEach(function (it) {
      const textOk = !q || it.name.includes(q);
      const typeOk = !type ||
        (type === 'caffeine' && it.caffeine) ||
        (type === 'sugar' && it.sugar) ||
        (type === 'both' && it.caffeine && it.sugar);
      const show = textOk && typeOk;
      it.nameCell.style.display = show ? '' : 'none';
      if (it.imgCell) it.imgCell.style.display = show ? '' : 'none';
    });

    collapseRows(table);
  }

  // Hide whole rows that have no visible item, and category headers whose
  // following item rows are all hidden. Hiding the <tr> (not just its cells)
  // is what removes the empty gaps left behind by filtered-out items.
  function collapseRows(table) {
    let headerRow = null;
    let anyVisible = false;

    const finalize = function () {
      if (headerRow) headerRow.style.display = anyVisible ? '' : 'none';
    };

    Array.from(table.rows).forEach(function (row) {
      if (isHeaderRow(row)) {
        finalize();
        headerRow = row;
        anyVisible = false;
        return;
      }
      const visible = Array.from(row.querySelectorAll('td[width="50%"]'))
        .some(function (td) {
          return td.querySelector('b') && td.style.display !== 'none';
        });
      row.style.display = visible ? '' : 'none';
      if (visible) anyVisible = true;
    });

    finalize();
  }

  // --- UI -------------------------------------------------------------
  function buildFilterBox(table) {
    // Idempotency guard: this script may run more than once per page.
    if (document.getElementById('th-item-filter')) return;

    // The Type dropdown only makes sense where consumables are listed, so
    // build it only if the page actually has caffeine/sugar items.
    const hasTypes = getItems(table).some(function (it) {
      return it.caffeine || it.sugar;
    });

    const wrap = document.createElement('div');
    wrap.style.cssText = 'margin:4px 0;font-family:arial;font-size:10pt;';

    const label = document.createElement('span');
    label.textContent = 'Filter: ';

    const input = document.createElement('input');
    input.type = 'text';
    input.id = 'th-item-filter';
    input.placeholder = 'e.g. xentrium';
    input.style.cssText = 'width:40%;';

    const clear = document.createElement('button');
    clear.type = 'button';
    clear.textContent = 'clear';
    clear.style.cssText = 'margin-left:4px;cursor:pointer;';

    let typeSelect = null;
    if (hasTypes) {
      typeSelect = document.createElement('select');
      typeSelect.id = 'th-item-type';
      typeSelect.style.cssText = 'margin-left:8px;';
      [['', 'All types'], ['caffeine', 'Caffeine'], ['sugar', 'Sugar'],
        ['both', 'Caff + Sugar']]
        .forEach(function (pair) {
          const opt = document.createElement('option');
          opt.value = pair[0];
          opt.textContent = pair[1];
          typeSelect.appendChild(opt);
        });
    }

    const run = function () {
      applyFilter(table, input.value, typeSelect ? typeSelect.value : '');
    };

    input.addEventListener('input', function () {
      sessionStorage.setItem(TEXT_KEY, input.value);
      run();
    });
    input.addEventListener('keydown', function (e) {
      if (e.key === 'Escape') {
        input.value = '';
        sessionStorage.removeItem(TEXT_KEY);
        run();
      }
    });
    clear.addEventListener('click', function () {
      input.value = '';
      sessionStorage.removeItem(TEXT_KEY);
      run();
      input.focus();
    });
    if (typeSelect) {
      typeSelect.addEventListener('change', function () {
        sessionStorage.setItem(TYPE_KEY, typeSelect.value);
        run();
      });
    }

    wrap.appendChild(label);
    wrap.appendChild(input);
    wrap.appendChild(clear);
    if (typeSelect) wrap.appendChild(typeSelect);
    table.parentNode.insertBefore(wrap, table);

    // Restore any filter that was active before the last reload.
    input.value = sessionStorage.getItem(TEXT_KEY) || '';
    if (typeSelect) typeSelect.value = sessionStorage.getItem(TYPE_KEY) || '';
    if (input.value || (typeSelect && typeSelect.value)) run();
  }

  const table = findItemsTable();
  if (table) buildFilterBox(table);
})();
