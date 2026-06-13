// ==UserScript==
// @name         Twilight Heroes Wearable Filter
// @author       Tilo
// @namespace    https://github.com/TiloBuechsenschuss
// @downloadURL  https://raw.githubusercontent.com/TiloBuechsenschuss/userscripts/refs/heads/main/TwilightHeroes/wearable-filter.js
// @version      1.0
// @description  Adds a live text filter above the Wearable Items list on wear.php; items whose name does not contain the typed text are hidden. Empty category headers collapse too.
// @match        https://www.twilightheroes.com/wear.php*
// @match        https://twilightheroes.com/wear.php*
// @grant        none
// ==/UserScript==

(function () {
  'use strict';

  // Filter text is kept in sessionStorage so it survives the page reload
  // that happens every time you equip/unequip an item.
  const STORAGE_KEY = 'thWearFilter';

  // --- Locating the Wearable Items table -------------------------------
  // Page layout is: <h2>Wearable Items</h2><font class='text'><table>...
  function findWearableTable() {
    for (const h of document.querySelectorAll('h2')) {
      if (h.textContent.trim() !== 'Wearable Items') continue;
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
  function isHeaderRow(row) {
    const td = row.cells[0];
    return !!td && td.getAttribute('colspan') === '4';
  }

  // Each item = a name cell (td[width=50%] containing <b>) plus the
  // preceding image cell. Filler cells (just &nbsp;) have no <b>.
  function getItems(table) {
    const items = [];
    table.querySelectorAll('td[width="50%"]').forEach(function (nameCell) {
      const b = nameCell.querySelector('b');
      if (!b) return;
      items.push({
        name: b.textContent.trim().toLowerCase(),
        nameCell: nameCell,
        imgCell: nameCell.previousElementSibling
      });
    });
    return items;
  }

  // --- Filtering -------------------------------------------------------
  function applyFilter(table, query) {
    const q = query.trim().toLowerCase();

    getItems(table).forEach(function (it) {
      const show = !q || it.name.includes(q);
      it.nameCell.style.display = show ? '' : 'none';
      if (it.imgCell) it.imgCell.style.display = show ? '' : 'none';
    });

    collapseEmptyHeaders(table);
  }

  function collapseEmptyHeaders(table) {
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
      if (visible) anyVisible = true;
    });

    finalize();
  }

  // --- UI -------------------------------------------------------------
  function buildFilterBox(table) {
    const wrap = document.createElement('div');
    wrap.style.cssText = 'margin:4px 0;font-family:arial;font-size:10pt;';

    const label = document.createElement('span');
    label.textContent = 'Filter: ';

    const input = document.createElement('input');
    input.type = 'text';
    input.id = 'th-wear-filter';
    input.placeholder = 'e.g. xentrium';
    input.style.cssText = 'width:40%;';

    const clear = document.createElement('button');
    clear.type = 'button';
    clear.textContent = 'clear';
    clear.style.cssText = 'margin-left:4px;cursor:pointer;';

    input.addEventListener('input', function () {
      sessionStorage.setItem(STORAGE_KEY, input.value);
      applyFilter(table, input.value);
    });
    input.addEventListener('keydown', function (e) {
      if (e.key === 'Escape') {
        input.value = '';
        sessionStorage.removeItem(STORAGE_KEY);
        applyFilter(table, '');
      }
    });
    clear.addEventListener('click', function () {
      input.value = '';
      sessionStorage.removeItem(STORAGE_KEY);
      applyFilter(table, '');
      input.focus();
    });

    wrap.appendChild(label);
    wrap.appendChild(input);
    wrap.appendChild(clear);
    table.parentNode.insertBefore(wrap, table);

    // Restore any filter that was active before the last reload.
    const saved = sessionStorage.getItem(STORAGE_KEY) || '';
    if (saved) {
      input.value = saved;
      applyFilter(table, saved);
    }
  }

  const table = findWearableTable();
  if (table) buildFilterBox(table);
})();
