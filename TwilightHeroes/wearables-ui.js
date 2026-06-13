// ==UserScript==
// @name         Twilight Heroes - Wearables UI
// @author       Tilo
// @namespace    https://www.twilightheroes.com/
// @version      1.2
// @description  Adds a button to the "Wear Something" page that sorts each equipment slot's items by power (descending), pushing items that can't currently be equipped to the bottom of their section.
// @match        https://www.twilightheroes.com/wear.php*
// @run-at       document-idle
// @grant        none
// ==/UserScript==

(function () {
  "use strict";

  const LOG = (...a) => console.log("[TH-sort]", ...a);

  function findWearHeader() {
    return [...document.querySelectorAll("h2")].find(h =>
      /Wearable Items/i.test(h.textContent)
    ) || null;
  }

  function findWearTable(header) {
    let n = header;
    while ((n = n.nextElementSibling)) {
      if (n.tagName === "TABLE") return n;
      const t = n.querySelector && n.querySelector("table");
      if (t) return t;
    }
    return null;
  }

  function readPower(infoTd) {
    // The power lives inside a <font> after the <br>, as "<n> power".
    // We must NOT read it from the whole cell's textContent: <br> adds no
    // space there, so an owned-quantity like "- 9" glues onto "47 power" and
    // becomes "947 power". The quantity is a bare text node outside the font,
    // so parsing from the font element avoids it.
    for (const f of infoTd.querySelectorAll("font")) {
      const m = f.textContent.match(/(\d+)\s*power/i);
      if (m) return parseInt(m[1], 10);
    }
    return null;
  }

  // Greyed-out, non-equippable items render "equip" inside <del>.
  function isEquippable(infoTd) {
    return !infoTd.querySelector("del");
  }

  function rowsOf(table) {
    const tbody = table.tBodies[0];
    const scope = tbody || table;
    return [...scope.children].filter(r => r.tagName === "TR");
  }

  function buildSections(table) {
    const sections = [];
    let current = null;
    for (const tr of rowsOf(table)) {
      const firstTd = tr.querySelector("td");
      const isHeader = firstTd && firstTd.colSpan >= 4;
      if (isHeader) {
        const label = (firstTd.textContent || "").trim().slice(0, 40);
        current = { header: tr, itemRows: [], label };
        sections.push(current);
      } else if (current) {
        current.itemRows.push(tr);
      }
    }
    return sections;
  }

  function collectItems(section) {
    const items = [];
    for (const row of section.itemRows) {
      const tds = [...row.children];
      for (let i = 0; i + 1 < tds.length; i += 2) {
        const imgTd = tds[i];
        const infoTd = tds[i + 1];
        if (!infoTd.querySelector("b")) continue; // filler / empty cell
        items.push({
          imgTd,
          infoTd,
          power: readPower(infoTd),
          equippable: isEquippable(infoTd),
        });
      }
    }
    return items;
  }

  function sortSection(section) {
    const items = collectItems(section);
    if (items.length === 0) return 0;

    items.sort((a, b) => {
      if (a.equippable !== b.equippable) return a.equippable ? -1 : 1;
      const pa = a.power == null ? -Infinity : a.power;
      const pb = b.power == null ? -Infinity : b.power;
      return pb - pa;
    });

    let anchor = section.header;
    for (let i = 0; i < items.length; i += 2) {
      const tr = document.createElement("tr");
      tr.setAttribute("valign", "top");
      tr.appendChild(items[i].imgTd);
      tr.appendChild(items[i].infoTd);
      if (items[i + 1]) {
        tr.appendChild(items[i + 1].imgTd);
        tr.appendChild(items[i + 1].infoTd);
      }
      anchor.after(tr);
      anchor = tr;
    }
    for (const row of section.itemRows) row.remove();

    LOG(`  section "${section.label}": ${items.length} items, ` +
        `top power = ${items[0].power}, bottom power = ${items[items.length - 1].power}`);
    return items.length;
  }

  function sortAll(table, btn) {
    const sections = buildSections(table);
    LOG(`found ${sections.length} sections`);
    if (sections.length === 0) {
      alert("TH-sort: found the table but no slot sections (colspan=4 headers). " +
            "Open the console for details.");
      return;
    }
    let total = 0;
    for (const s of sections) total += sortSection(s);
    LOG(`done. sorted ${total} items across ${sections.length} sections`);
    if (btn) btn.textContent = `Sorted \u2713 (${total} items)`;
  }

  function init() {
    const header = findWearHeader();
    if (!header) { LOG("no 'Wearable Items' header found"); return; }
    const table = findWearTable(header);
    if (!table) {
      LOG("header found but no table after it");
      return;
    }
    LOG("ready; table located");

    const btn = document.createElement("button");
    btn.textContent = "Sort by power \u2193";
    btn.style.marginLeft = "10px";
    btn.style.cursor = "pointer";
    btn.addEventListener("click", () => sortAll(table, btn));
    header.appendChild(btn);
  }

  init();
})();