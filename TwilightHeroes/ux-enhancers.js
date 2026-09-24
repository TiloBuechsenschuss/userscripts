// ==UserScript==
// @name         Twilight Heroes UX Enhancers
// @author       Tilo
// @namespace    https://github.com/TiloBuechsenschuss
// @downloadURL  https://raw.githubusercontent.com/TiloBuechsenschuss/userscripts/refs/heads/main/TwilightHeroes/ux-enhancers.js
// @version      1.1
// @description  Grab-bag of quality-of-life tweaks for Twilight Heroes.
// @match        https://www.twilightheroes.com/main.php*
// @match        https://twilightheroes.com/main.php*
// @match        https://www.twilightheroes.com/criminology.php*
// @match        https://twilightheroes.com/criminology.php*
// @match        https://www.twilightheroes.com/header.php*
// @match        https://twilightheroes.com/header.php*
// @match        https://www.twilightheroes.com/inventory.php*
// @match        https://twilightheroes.com/inventory.php*
// @match        https://www.twilightheroes.com/use.php*
// @match        https://twilightheroes.com/use.php*
// @match        https://www.twilightheroes.com/wear.php*
// @match        https://twilightheroes.com/wear.php*
// @match        https://www.twilightheroes.com/journal.php*
// @match        https://twilightheroes.com/journal.php*
// @match        https://www.twilightheroes.com/sell.php*
// @match        https://twilightheroes.com/sell.php*
// @match        https://www.twilightheroes.com/nav.php*
// @match        https://twilightheroes.com/nav.php*
// @match        https://www.twilightheroes.com/skills.php*
// @match        https://twilightheroes.com/skills.php*
// @match        https://www.twilightheroes.com/fight.php*
// @match        https://twilightheroes.com/fight.php*
// @match        https://www.twilightheroes.com/maps/*
// @match        https://twilightheroes.com/maps/*
// @run-at       document-idle
// @grant        none
// ==/UserScript==

/*
 * Twilight Heroes UX Enhancers
 *
 * A grab-bag of quality-of-life tweaks for Twilight Heroes, one feature per page.
 * In the header: a "Heal" link that casts your heal skills until HP is full, and Garage / Rest
 *   links next to Hideout.
 * On the skills page a "max" button per buff that casts it as many times as your PP allows,
 *   mirrored by a compact version in the nav sidebar.
 * On the item pages (inventory / wear / use) a filter box that narrows the list as you type, with a
 *   type dropdown, remembered across the reload that equipping or using something causes.
 * On the wear page sortable columns for your wearables.
 * On the sell page sort buttons for the item list.
 * In the journal, the next step for each open quest.
 * Wiki "W" badges on monsters and drops in combat, your last area in the nav bar, quest titles, map
 *   areas and item names.
 * And on main.php a "Get & Equip Black Box" button that drives the Black Box quest through
 *   criminology.php for you.
 * Each nav-sidebar "+max" button carries its buff's PP cost in data-pp-cost, which auto-combat.js
 *   reads to refresh a buff between fights.
 */

(function () {
  'use strict';

  // Twilight Heroes' catch-all, and the counterpart of
  // KingdomOfLoathing/ux-enhancers.js -- same registry, same reasons. Nine
  // standalone scripts were folded in here; each is a FEATURES entry scoped to
  // its own page, and nothing runs outside one.
  //
  // Two things to know before editing.
  //
  // EVERY absorbed body is inside a function. Most of these scripts were
  // straight-line code that ran on eval, and splicing that in at the top level
  // would put it outside the per-feature try/catch below -- one throw would then
  // take the other ten features down. Wrapping is also what scoped away the
  // collisions: `path` was declared at the top level of three of them and `span`
  // of two, which stopped being a problem the moment each body got its own
  // scope. Add a feature the same way: a function, plus a row in FEATURES.
  //
  // THE SHARED HELPERS BELOW ARE THE REASON THIS FILE EXISTS. header-heal and
  // skills-cast-max each carried their own byte-identical `SKILLS_URL`,
  // `findSkillOption` and `serializeForm`, and quest-helper and wiki-links each
  // their own `WIKI_BASE`/`wikiHref`. Those copies are gone; there is one of
  // each now. Do not let a feature grow a private copy back.

  // === shared: skills.php ==============================================

  const SKILLS_URL = location.origin + "/skills.php";

  // Fetch + parse skills.php once, cached for the session so repeated nav
  // reloads (each "+max" click reloads the sidebar) don't re-hit the server --
  // the castable-skill list only changes when you learn or forget a skill.
  //
  // This is skills-cast-max's version. header-heal's was the same fetch without
  // the cache, so taking this one gives the heal path the caching for free; the
  // skill list cannot go stale between a heal and the next page, since casting
  // changes HP and PP, never which skills you own.
  async function fetchSkillsDoc() {
    try {
      const cached = sessionStorage.getItem("th-skills-html");
      if (cached) return new DOMParser().parseFromString(cached, "text/html");
    } catch (e) { /* sessionStorage may be unavailable; fetch fresh */ }
    const res = await fetch(SKILLS_URL, { credentials: "same-origin" });
    if (!res.ok) throw new Error("skills.php returned HTTP " + res.status);
    const html = await res.text();
    try { sessionStorage.setItem("th-skills-html", html); } catch (e) { /* ignore */ }
    return new DOMParser().parseFromString(html, "text/html");
  }

  // Find the skill's casting form, option value and PP cost by name. The cost is
  // embedded in the option text, e.g. "Stone Armor (12 PP)".
  function findSkillOption(doc, name) {
    const target = name.trim().toLowerCase();
    const selects = doc.querySelectorAll('select[name="whichskill_cast"]');
    for (const select of selects) {
      for (const opt of select.options) {
        if (opt.textContent.trim().toLowerCase().startsWith(target)) {
          const m = opt.textContent.match(/(\d+)\s*PP/i);
          return { value: opt.value, cost: m ? parseInt(m[1], 10) : null, form: select.form };
        }
      }
    }
    return null;
  }

  // Serialise a form the way a native submit would, applying overrides. Skips
  // buttons (matching the standalone Max button's reliance on form.submit()).
  function serializeForm(form, overrides) {
    const params = new URLSearchParams();
    for (const el of form.elements) {
      if (!el.name || el.disabled) continue;
      const type = (el.type || "").toLowerCase();
      if (["submit", "button", "reset", "file", "image"].includes(type)) continue;
      if ((type === "checkbox" || type === "radio") && !el.checked) continue;
      params.append(el.name, el.value);
    }
    for (const k in overrides) params.set(k, overrides[k]);
    return params;
  }

  // === shared: the wiki ================================================

  const WIKI_BASE = 'https://th.blandsauce.com/wiki/';

  // --- Wiki URL (mirrors wiki-links.js) --------------------------------
  // Stock MediaWiki: first letter auto-capitalised, spaces -> underscores.
  // Prefer the quest's known slug; otherwise derive one from the name.
  function wikiHref(name, slug) {
    if (slug) return WIKI_BASE + encodeURIComponent(slug);
    let t = name.trim().replace(/\s+/g, ' ');
    if (!t) return null;
    t = t.charAt(0).toUpperCase() + t.slice(1);
    return WIKI_BASE + encodeURIComponent(t.replace(/ /g, '_'));
  }

  // === feature: Black Box quest ========================================
  //
  // Was its own autobox.js, and it is the one feature here that spans a
  // NAVIGATION: main.php injects the button, criminology.php drives the quest
  // across the reload each form submission causes, and the two halves talk
  // through sessionStorage ("th-autobox-active"). Both branches stay in one
  // function with the original's own `path` test intact, because that pairing
  // is the feature -- splitting it into two entries would hide it.
  //
  // The quest-advancing logic is index-based (forms.length > 3 -> submit
  // forms[2]) and inherited from the legacy original. It is UNVERIFIED against
  // the live page; preserve it rather than "improving" heuristics you cannot
  // test in-game.

  function autobox() {
    // sessionStorage (not localStorage): the flag only needs to outlive the
    // full-page reloads that happen as we submit each criminology.php form, and
    // should not linger if the tab is closed mid-run.
    const FLAG_KEY = "th-autobox-active";

    const path = location.pathname;

    // --- main.php: inject the trigger button ----------------------------------
    if (/\/main\.php/i.test(path)) {
      // Idempotency: a previous pass (or the bundled loader) may have run already.
      if (document.getElementById("th-autobox-btn")) return;

      // The original anchored the button before the first <center> on the page;
      // keep that placement but bail gracefully if the layout has no <center>.
      const anchor = document.getElementsByTagName("center")[0];
      if (!anchor || !anchor.parentNode) return;

      const button = document.createElement("button");
      button.id = "th-autobox-btn";
      button.type = "button";
      button.textContent = "Get & Equip Black Box";
      button.addEventListener("click", () => {
        sessionStorage.setItem(FLAG_KEY, "true");
        location.href = location.origin + "/criminology.php";
      });

      anchor.parentNode.insertBefore(button, anchor);
      return;
    }

    // --- criminology.php: drive the quest while the flag is set ---------------
    if (/\/criminology\.php/i.test(path)) {
      if (!sessionStorage.getItem(FLAG_KEY)) return;

      // The quest is a series of single-step forms. While more than three forms
      // are present there is still a step to advance, so submit the quest form
      // (index 2); the page reloads and we land back here with the flag still set.
      // Once the extra forms are gone the box has been obtained, so we clear the
      // flag and follow the first link (the get/equip destination).
      const forms = document.getElementsByTagName("form");
      if (forms.length > 3) {
        forms[2].submit();
        return;
      }

      sessionStorage.removeItem(FLAG_KEY);
      const link = document.getElementsByTagName("a")[0];
      if (link && link.href) location.href = link.href;
      return;
    }
  }

  // === feature: header Heal link =======================================
  //
  // Was its own header-heal.js. Uses the shared SKILLS_URL / fetchSkillsDoc /
  // findSkillOption / serializeForm above -- it used to carry its own copies.

  function headerHeal() {
    // ---------------------------------------------------------------------------
    // Configuration: the heal skills to consider, highest priority first.
    //
    //   name     – must match the start of the skill's <option> text on skills.php
    //              (e.g. the option reads "Lifeblood Manipulation (12 PP)").
    //   priority – lower numbers are cast first. When HP is not full, the
    //              highest-priority skill you can currently afford is cast once,
    //              then HP/PP are re-read and the choice is made again.
    //
    // To add a skill, drop another entry here. PP cost is read live from skills.php
    // per skill, so nothing else needs to change.
    // ---------------------------------------------------------------------------
    const HEAL_SKILLS = [
      { name: "Lifeblood Manipulation", priority: 1 },
    ];

    // Safety cap so a misread (e.g. HP that never reaches max) can't loop forever.
    const MAX_CASTS = 200;

    // Idempotency: a previous run may already have inserted the link.
    if (document.getElementById("th-heal-extra")) return;

    // Locate the Skills link by its href; the header is legacy <font>/<a> markup
    // with no ids, so match on the anchor target rather than position.
    const skillsLink = Array.from(document.querySelectorAll("a[href]")).find(a => {
      const href = (a.getAttribute("href") || "").toLowerCase();
      return href === "skills.php" || href.endsWith("/skills.php");
    });
    if (!skillsLink) return;

    // --- stat reading -----------------------------------------------------------

    // HP and PP live in a *sibling* frame (the nav sidebar), as "<current>/<max>"
    // in #hpstring / #ppstring. Find that frame's window so we can read its URL
    // (to fetch fresh stats) and reload it once we're done.
    function findStatFrame() {
      const hasStats = w => {
        try {
          const d = w.document;
          return !!(d && (d.getElementById("ppstring") || d.getElementById("hpstring")));
        } catch (e) { return false; }
      };
      try {
        const nav = top.frames["nav"];
        if (nav && hasStats(nav)) return nav;
      } catch (e) { /* cross-frame access can throw; fall through */ }
      try {
        for (const f of top.frames) {
          if (hasStats(f)) return f;
        }
      } catch (e) { /* no frames */ }
      return null;
    }

    function parseStat(el) {
      if (!el) return null;
      const m = el.textContent.match(/(\d+)\s*\/\s*(\d+)/);
      return m ? { cur: parseInt(m[1], 10), max: parseInt(m[2], 10) } : null;
    }

    // Fetch the nav page fresh and parse current HP/PP from it. This sidesteps
    // reloading the visible frame (whose load event is unreliable to await) and is
    // faster, since the fetched HTML is parsed but never rendered.
    async function fetchStats(navUrl) {
      const res = await fetch(navUrl, { credentials: "same-origin" });
      if (!res.ok) throw new Error("nav page returned HTTP " + res.status);
      const doc = new DOMParser().parseFromString(await res.text(), "text/html");
      return {
        hp: parseStat(doc.getElementById("hpstring")),
        pp: parseStat(doc.getElementById("ppstring")),
      };
    }

    // --- skills.php scraping & casting ------------------------------------------

    async function castOnce(form, value) {
      const params = serializeForm(form, { whichskill_cast: value, numtimes: "1" });
      const method = (form.method || "get").toLowerCase();
      const action = new URL(form.getAttribute("action") || "skills.php", SKILLS_URL).href;
      let res;
      if (method === "post") {
        res = await fetch(action, {
          method: "POST",
          credentials: "same-origin",
          headers: { "Content-Type": "application/x-www-form-urlencoded" },
          body: params.toString(),
        });
      } else {
        const url = action + (action.includes("?") ? "&" : "?") + params.toString();
        res = await fetch(url, { credentials: "same-origin" });
      }
      if (!res.ok) throw new Error("Cast request returned HTTP " + res.status);
    }

    // --- main loop --------------------------------------------------------------

    let running = false;

    async function runHeal(link) {
      if (running) return;
      running = true;
      const original = link.textContent;
      link.style.color = "#888888";

      try {
        const frame = findStatFrame();
        if (!frame) { alert("Couldn't find the HP/PP sidebar frame."); return; }
        let navUrl;
        try { navUrl = frame.location.href; } catch (e) { /* handled below */ }
        if (!navUrl) { alert("Couldn't determine the sidebar URL."); return; }

        // Discover each configured skill's option value + PP cost once. These don't
        // change between casts, so we only need to scrape skills.php a single time.
        const doc = await fetchSkillsDoc();
        const skills = HEAL_SKILLS
          .slice()
          .sort((a, b) => a.priority - b.priority)
          .map(s => {
            const found = findSkillOption(doc, s.name);
            return found ? Object.assign({}, s, found) : null;
          })
          .filter(s => s && s.cost > 0);

        if (!skills.length) {
          alert("None of the configured heal skills were found on skills.php.");
          return;
        }

        let casts = 0;
        try {
          while (casts < MAX_CASTS) {
            const { hp, pp } = await fetchStats(navUrl);
            if (!hp || !pp) { alert("Couldn't read your HP/PP from the sidebar."); return; }
            if (hp.cur >= hp.max) break; // HP full — done.

            // Highest-priority skill we can currently afford.
            const choice = skills.find(s => pp.cur >= s.cost);
            if (!choice) break; // Out of PP for any heal — done.

            link.textContent = "Healing… (" + (++casts) + ")";
            await castOnce(choice.form, choice.value);
          }
        } finally {
          // Refresh the visible sidebar once so it reflects the casts we made.
          if (casts > 0) { try { frame.location.reload(); } catch (e) { /* ignore */ } }
        }
      } catch (e) {
        alert("Heal failed: " + (e && e.message ? e.message : e));
      } finally {
        running = false;
        link.textContent = original;
        link.style.color = "#CCCCCC";
      }
    }

    // --- header link ------------------------------------------------------------

    const link = document.createElement("a");
    link.href = "#";
    link.textContent = "Heal";
    link.style.color = "#CCCCCC";
    link.title = "Cast heal skills until HP is full or PP runs out";
    link.addEventListener("click", e => {
      e.preventDefault();
      if (running) return;
      // if (!confirm("Cast heal skills until HP is full or PP runs out?")) { return; }
      runHeal(link);
    });

    const span = document.createElement("span");
    span.id = "th-heal-extra";
    span.appendChild(document.createTextNode(" ("));
    span.appendChild(link);
    span.appendChild(document.createTextNode(")"));

    skillsLink.after(span);
  }

  // === feature: header Garage / Rest links =============================
  //
  // Was its own header-hideout-links.js. Shares header.php with the Heal link
  // above; each keeps its own idempotency guard, so one bailing never
  // suppresses the other.

  function headerHideoutLinks() {
    // Idempotency: a previous run may already have inserted the extra links.
    if (document.getElementById("th-hideout-extra")) return;

    // Locate the Hideout link by its href; the header is legacy <font>/<a>
    // markup with no ids, so match on the anchor target rather than position.
    const hideout = Array.from(document.querySelectorAll('a[href]')).find(a => {
      const href = (a.getAttribute("href") || "").toLowerCase();
      return href === "hideout.php" || href.endsWith("/hideout.php");
    });
    if (!hideout) return;

    // Build "(Garage - Rest)" mirroring the style of the surrounding links:
    // same target frame and the header's light-grey link colour.
    function makeLink(href, text) {
      const a = document.createElement("a");
      a.href = href;
      a.target = hideout.target || "main";
      a.style.color = "#CCCCCC";
      a.textContent = text;
      return a;
    }

    const span = document.createElement("span");
    span.id = "th-hideout-extra";
    span.appendChild(document.createTextNode(" ("));
    span.appendChild(makeLink("garage.php", "Garage"));
    span.appendChild(document.createTextNode(" - "));
    span.appendChild(makeLink("rest.php", "Rest"));
    span.appendChild(document.createTextNode(")"));

    hideout.after(span);
  }

  // === feature: item filter ============================================
  //
  // Was its own inventory-filter.js. One feature over three pages that share
  // the same <td width=50%><b>name</b></td> item layout; it finds the table
  // from a known heading (HEADINGS) rather than assuming one. Extend HEADINGS
  // when another such page turns up -- do not fork the feature.
  //
  // Filter state lives in sessionStorage keyed per page, so it survives the
  // full-page reload that equipping or using an item causes.

  function inventoryFilter() {
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
  }

  // === feature: journal quest hints ====================================
  //
  // Was its own quest-helper.js. Everything except the injection pass is left
  // at file scope on purpose: it is DOM-free and unit-tested through the
  // end-of-IIFE seam, which cannot see inside a feature function.
  //
  // Its wikiHref carried the optional `slug` branch, so that is the copy
  // hoisted to the shared block above, and wiki-links uses it too now.

  // Normalise a quest name into a stable map key.
  function key(name) {
    return name.trim().replace(/\s+/g, ' ').toLowerCase();
  }

  // Normalise entry text for stage matching: lower-case and flatten every run
  // of non-alphanumeric characters (punctuation, &nbsp;, line breaks, the
  // wiki's curly vs. straight quotes) to a single space. Makes `match` snippets
  // robust to punctuation differences between the wiki text and the game.
  function normForMatch(s) {
    return s.toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim();
  }

  // --- Quest hint database ---------------------------------------------
  // Keyed by quest name (via key()). Each quest is:
  //   { wiki: '<MediaWiki slug>', stages: [ { match, hint }, ... ] }
  //
  // A quest in the journal shows ONE block of entry text under its <h2>/<b>
  // header, and that text changes as the quest advances -- so the text tells us
  // which stage the player is on. Each stage's `match` is a snippet of that
  // stage's journal entry; the stage whose snippet matches and is LONGEST (most
  // specific) wins, and its `hint` (trusted HTML) is shown. Order doesn't matter.
  //
  // IMPORTANT for overlapping stages: when a later stage's entry text *extends*
  // an earlier stage's (the journal keeps the old sentence and appends more),
  // the later entry contains BOTH snippets -- so the later stage's `match` must
  // be the FULL text (including the shared prefix) so it stays the longest and
  // wins. Storing only the appended tail would lose to the earlier stage's
  // longer snippet. See Go Fish Again / Rejected Rogue Ranch / All the World's.
  //
  // Stages with identical journal text across the wiki are collapsed into one
  // entry whose hint covers that span. Stages the wiki gives no entry text for
  // are omitted -- the player lands on the wiki-walkthrough fallback there.
  //
  // Built from https://th.blandsauce.com/wiki/Quests and the per-quest pages.
  // Untested against the live journal; entry wording may differ slightly in
  // game (the normaliser absorbs punctuation differences, not reworded text).
  const QUESTS = {
    // --- Specials shown directly in the current journal -----------------
    [key('Cleaning Up')]: {
      wiki: 'Quests',
      stages: [{
        match: 'There are a lot of streets in Twilight',
        hint: 'Just play the game..',
      }],
    },
    [key('Age of Destruction, in a World of Corruption')]: {
      wiki: 'Quests',
      stages: [{
        match: "You've defeated the Mick, but at the cost of having a chunk of the city",
        hint: 'End-game state. Head to your <b>Hideout</b> and use the <b>R.E.T.C.O.N. device</b> ' +
          'to travel back and try to prevent the destruction (a retcon/run reset), or stay in the ' +
          'present and keep playing. Your choice.',
      }],
    },

    // --- Core story quests ---------------------------------------------
    [key('Like a Super Neighbor')]: {
      wiki: 'Like_a_Super_Neighbor',
      stages: [
        { match: "You've heard a lot in the news about trouble in the Neighboring and Neighborly Neighborhood, right next to your own",
          hint: 'Adventure in the <b>Neighboring and Neighborly Neighborhood</b> until you hit "Officer Down" and rescue the officer.' },
        { match: 'Remember that police officer you rescued a while back',
          hint: 'Visit the <b>Twilight Hospital</b> to check on the officer (triggers "Officer Back Up").' },
        { match: 'Officer Aaron Rand suggested that you keep an eye out',
          hint: 'Return to the <b>Neighboring and Neighborly Neighborhood</b> and defeat <b>The Arsonist</b>.' },
      ],
    },
    [key('Trouble in the Galleria')]: {
      wiki: 'Trouble_in_the_Galleria',
      stages: [
        { match: 'You may want to do a little more exploring, to get to know more of your neighborhood',
          hint: 'Visit the <b>Galleria</b> shops.' },
        { match: "There's something fishy going on in the Galleria shops",
          hint: 'Patrol the <b>Cannonball Tavern</b> until you trigger "To the Rescue".' },
        { match: 'Melody and Bob have confirmed that the owner of the pizza place',
          hint: 'Get <b>steel knuckles</b> (from "A Noggin Scratcher" or "Shall We Play A Game?").' },
        { match: "You've seen enough to feel confident that the owner of the pizza place",
          hint: 'Return to the <b>Galleria</b> shops and give the steel knuckles to <b>Bob</b>.' },
        { match: 'Bob already took the steel knuckles from you and hid them in the pizza parlor bathroom',
          hint: "After <b>11:05 PM</b> game time, visit <b>Jax 'Za</b> and enter “John Steele”." },
        { match: 'You have had your showdown with John Steele',
          hint: 'Visit the <b>Twilight Police Department</b> and speak with <b>Rand</b>.' },
      ],
    },
    [key('A Dank and Rusty Mystery')]: {
      wiki: 'A_Dank_and_Rusty_Mystery',
      stages: [
        { match: "You get this feeling that there's more going on out there in the big city than you know about yet",
          hint: 'Visit <b>Officer Rand</b> at the <b>Twilight Police Department</b>.' },
        { match: 'something strange is going on in the sewers under your neighborhood',
          hint: 'Patrol the <b>neighborhood sewers</b> and choose "Enter the Hole".' },
        { match: "You've found some strange tunnels connecting to the sewers",
          hint: 'Keep patrolling the tunnels until you encounter "Kinders Feepers".' },
        { match: "though at first glance it doesn't seem useful",
          hint: 'Let your <b>Rank and Musty Daze</b> expire, then <b>use the black sand</b>.' },
        { match: 'though upon investigation it appears to be a bland sack',
          hint: 'Get <b>Rank and Musty Daze</b> again, find "A Skeptic Sandal", then use the septic scandals.' },
        { match: "You've managed to turn Black sand into a bland sack",
          hint: 'Equip the <b>skeptic sandals</b> and patrol until "A Barge Lox"; use the password “Grand”.' },
        { match: "You've successfully figured out the password for the maze",
          hint: 'Keep patrolling and defeat the <b>Mind Bender</b>.' },
        { match: "You've successfully defeated the Mind Bender",
          hint: 'Visit <b>Rand</b> at the <b>Twilight Police Department</b>.' },
      ],
    },
    [key("Protests Aren't for Amateurs")]: {
      wiki: "Protests_Aren't_for_Amateurs",
      stages: [
        { match: "You get this feeling that there's more going on out there in the big city than you know about yet",
          hint: 'Visit the <b>Twilight Police Department</b> (level 4+).' },
        { match: 'What started as a small political rally has broken out into a full-blown rioting protest',
          hint: 'Defeat 4 <b>mob instigators</b> at "Campus: Investigate a Protest".' },
        { match: 'The riot continues at the university',
          hint: 'Keep adventuring on campus until "Rhythm of the Rage".' },
        { match: "You've caught Rage, a teenager with psychic powers",
          hint: 'Take <b>Rage</b> downtown to <b>Rand</b> at the Police Department.' },
        { match: 'The university protest has been calmed',
          hint: 'Return to <b>Campus</b> for the final adventure, then visit <b>Susan Novak</b> (level 5+) for the reward.' },
      ],
    },
    [key('Cat and Mick-y Mouse Game')]: {
      wiki: 'Cat_and_Mick-y_Mouse_Game',
      stages: [
        { match: "You've heard about a mysterious character named The Mick",
          hint: 'Nothing to do yet — wait until The Mick makes another move.' },
        { match: 'It was just a quick visit to see Rand',
          hint: 'Talk to <b>Rand</b> about the kidnapping.' },
        { match: 'You bring the note back in to Rand',
          hint: 'Enter the <b>NCI Live building</b>.' },
        { match: "The Mick's got your sidekick held hostage in the NCI Live building",
          hint: 'Fight through the building and rescue your sidekick from <b>room 3</b>.' },
        { match: "You've rescued your understudy from the NCI Live building",
          hint: 'Defeat <b>The Mick</b> in <b>room 2</b>.' },
        { match: "You've actually defeated the Mick",
          hint: 'Enter <b>room 1</b>.' },
        { match: 'it seems a large chunk of Twilight city was just blown up',
          hint: 'Visit <b>Rand</b> for the debriefing.' },
        { match: "You've defeated the Mick, but at the cost of having a chunk of the city",
          hint: 'Show the <b>trimensional cortex</b> to <b>Susan</b> for analysis.' },
      ],
    },
    [key('C.H.I.P.S. (Casino Heroes Investigate Purported Scandal)')]: {
      wiki: 'C.H.I.P.S._(Casino_Heroes_Investigate_Purported_Scandal)',
      stages: [
        { match: "You get this feeling that there's more going on out there in the big city than you know about yet",
          hint: 'Visit the <b>Twilight Police Department</b> (level 5+).' },
        { match: 'Rand has asked you to check out the seedy casinos',
          hint: 'Patrol the <b>Golden Wooden Nickel Casino</b> until a VIP drops an encrypted swipe card.' },
        { match: 'He thinks the mafia may be using the back of the house to launder money',
          hint: 'Install an <b>electronic computer</b> in your <b>Computer Lab</b>.' },
        { match: "You've got the card partway decrypted but need to keep working at it",
          hint: "Keep decrypting with <b>Vlad's Decryptonomicon</b>." },
        { match: "You've managed to extract some room numbers and general location information from the card",
          hint: 'Patrol the <b>Casino Grounds</b> until the "Back Door" encounter.' },
        { match: "You've unlocked the back of the house",
          hint: 'Patrol the <b>Back of the House</b> to find the Suspicious Figure.' },
        { match: "You've found a suspicious door deep in the back of the house",
          hint: 'Patrol the <b>Back of the House</b> until a sotto capo drops a <b>capo key</b>.' },
        { match: "You've got a key. You know where the store room is",
          hint: 'Defeat <b>counsel Harry</b> in the Storeroom.' },
        { match: "You've broken into the mafia store room",
          hint: 'Return to the <b>Twilight Police Department</b> to report.' },
      ],
    },
    [key('Go Fish')]: {
      wiki: 'Go_Fish',
      stages: [
        { match: "You get the feeling it's about time to go check in with Officer Rand",
          hint: 'Visit the <b>Twilight Police Department</b> in Downtown Twilight.' },
        { match: 'Rand told you that shipments of valuable electronics are disappearing in Porcelain Bay',
          hint: 'Get an <b>underwater breathing</b> ability and patrol <b>Porcelain Bay</b>.' },
        { match: 'A strange talking fish told you some human known as the Troutmaster',
          hint: 'Keep patrolling <b>Porcelain Bay</b> until "Perch Boy".' },
        { match: "You're trying to stop the Troutmaster and his army of enslaved aquatic creatures",
          hint: 'In <b>Porcelain Bay</b>: defeat <b>Perch Boy</b>, find the <b>bicycle</b> and return it to the talking fish for a reward, then defeat the <b>Troutmaster</b>.' },
        { match: "You've successfully beaten the Troutmaster",
          hint: 'Return to the <b>Twilight Police Department</b> to report.' },
      ],
    },
    [key("Don't Cry for Me, Zion-tina")]: {
      wiki: "Don't_Cry_for_Me,_Zion-tina",
      stages: [
        { match: "You get the feeling it's about time to go check in with Officer Rand",
          hint: 'Visit the <b>Twilight Police Department</b> downtown.' },
        { match: "There's been trouble downtown, and you're just the hero to take that trouble",
          hint: 'Adventure in the <b>streets of downtown</b> Twilight.' },
        { match: "There's been trouble downtown, and it's up to you to sort things out",
          hint: "Keep adventuring downtown until you find the Zion's Tears connection." },
        { match: "Something truly strange is going on at the Zion's Tears cult headquarters",
          hint: "Adventure in the <b>Zion's Tears building</b>; defeat the archons to reach the demiurge." },
        { match: "You've scattered the Zion's Tears creatures and defeated their leader in combat",
          hint: 'Return to the <b>Twilight Police Department</b> to report to <b>Rand</b>.' },
      ],
    },
    [key('Go Fish, Again')]: {
      wiki: 'Go_Fish,_Again',
      stages: [
        { match: "Rand mentioned there's something odd going on at the university",
          hint: 'Talk with <b>Susan Novak</b>.' },
        { match: 'Seismic disturbances in the bay',
          hint: "Visit <b>Big Earl's Big Oil Derrick</b>." },
        { match: 'The oil platform in the bay seems to be under some sort of environmental terrorist attack',
          hint: "Keep adventuring at <b>Big Earl's Big Oil Derrick</b>." },
        { match: 'The eco-terrorists on the oil platform have led you to their underwater base',
          hint: 'Adventure in the <b>Underwater Base</b> until the locked-door encounter.' },
        { match: 'The eco-terrorists on the oil platform have led you to their underwater base. You should investigate more',
          hint: 'Defeat <b>Lightning Rod Jones</b>, <b>Shifty Sam</b> and <b>Iron Will Mike</b>, then hit the spy encounter.' },
        { match: "The eco-terrorists on the oil platform have led you to their underwater base, where you've discovered that they have dealings with the nefarious Mick",
          hint: 'Adventure in the <b>Underwater Base</b> until you get the <b>key card</b>.' },
        { match: "You've destroyed Livia la Frostheim's underwater base",
          hint: 'Talk to <b>Susan Novak</b> to finish the quest.' },
      ],
    },
    [key('Trouble in the Wasteland')]: {
      wiki: 'Trouble_in_the_Wasteland',
      stages: [
        { match: 'Susan mentioned that the police were too busy to help her',
          hint: 'Visit the <b>Twilight Police Department</b> (level 8+).' },
        { match: 'Rand says a strange military group in the desert shows signs of possessing some of the goods stolen by the Troutmaster',
          hint: "Gather the needed items at the <b>Military Base of the Unborn</b> (and Big Earl's Oil Derrick), then push through the <b>Byzantine Interior</b> — security pass, inner sanctum — to the boss." },
        { match: "You've defeated the leader of the Unborn Base",
          hint: 'Visit the <b>Twilight Police Department</b> to report.' },
      ],
    },
    [key("All the World's a Quest, and All the Men and Women Merely Heroes")]: {
      wiki: "All_the_World's_a_Quest,_and_All_the_Men_and_Women_Merely_Heroes",
      stages: [
        { match: 'Rand suggested that you check out the Cube theater downtown',
          hint: 'Patrol the <b>Cube Theater</b> to encounter "The Bit Player".' },
        { match: "Maybe the pieces of The Bard's script can be used against him",
          hint: 'Complete the six "Bit Player" encounters by picking the correct Shakespeare character each time.' },
        { match: "Maybe the pieces of The Bard's script can be used against him? Try putting the whole manuscript together",
          hint: "Use <b>script page 1</b> to assemble <b>The Bard's Play</b>." },
        { match: "Congrats! You've beaten The Bard",
          hint: 'Visit the <b>Twilight Police Department</b> to report your victory.' },
      ],
    },
    [key('Through the Dimensional Rabbit-Hole')]: {
      wiki: 'Through_the_Dimensional_Rabbit-Hole',
      stages: [
        { match: "It's been a while since you've talked to Susan Novak",
          hint: 'Visit <b>Susan Novak</b>.' },
        { match: 'Elco Hoist labs is under attack by strange creatures',
          hint: 'Travel to <b>Elco Hoist Laboratory</b>.' },
        { match: "Now that you've pushed back the worst of the creatures from the gate",
          hint: 'Adventure in the <b>Astral Badlands</b> until "Alien Geology 101".' },
        { match: "You've discovered the caves known as the Mouths of Darkness",
          hint: 'Map and clear the <b>Mouths of Darkness</b> caves in the Astral Badlands (~five encounters per cave) to find the missing team.' },
        { match: 'While the force field is being set up, you pull Susan aside',
          hint: 'Visit <b>Elco Hoist Laboratories</b> to finish the quest.' },
      ],
    },

    // --- Other journal quests ------------------------------------------
    [key('Plumbing the Depths')]: {
      wiki: 'Plumbing_the_Depths',
      stages: [
        { match: 'has asked you to scour the sewers of Somerset in search of special items containing marium',
          hint: 'Equip the <b>marium detector</b> and patrol the <b>Somerset sewers</b>, collecting 6+ of your class’s marium items.' },
        { match: 'You found a bunch of items containing the mysterious material called marium',
          hint: 'Return to your retired hero friend in <b>Somerset</b> with 6+ items for the reward.' },
      ],
    },
    [key('A Mysterious Ruin')]: {
      wiki: 'A_Mysterious_Ruin',
      stages: [
        { match: "You've found something strange out in the desert.",
          hint: 'Tell <b>Susan Novak</b> about the strange thing you found in the desert.' },
        { match: "You've found something strange out in the desert and you've told Susan about it",
          hint: 'Wait for <b>rollover</b>, then visit <b>Susan</b> again.' },
        { match: "Susan's had time to investigate the strange mechanical ruins",
          hint: 'Visit <b>Susan</b> after rollover to hear about the triangular devices.' },
        { match: "Susan's confirmed that the ruins are non-human in origin",
          hint: 'Wait for <b>rollover</b>; Susan will report on the portal properties.' },
        { match: 'getting them up into space quickly is a good idea',
          hint: 'Wait for rollover — the <b>space station</b> opens up. Keep checking in with Susan as it is built.' },
        { match: 'Danger in the space station',
          hint: 'Visit <b>Susan</b>, then fight off the robots invading the space station.' },
        { match: "You'd better check with Susan, again",
          hint: 'Defeat ~25 robots in the <b>space station</b> to restore calm, checking in with <b>Susan</b>.' },
        { match: 'All is quiet again in the space station',
          hint: 'Wait for <b>rollover</b>; the robots will return.' },
        { match: 'the robots are at it again',
          hint: 'Fight through the final wave of robots, including the boss.' },
        { match: 'you tried to fight off the robots, but now it looks worse than ever',
          hint: 'The invasion has come to a head — clear the final space-station stage to finish.' },
      ],
    },
    [key('Riding in the Lists')]: {
      wiki: 'Riding_in_the_Lists',
      stages: [
        { match: "You've been challenged to a joust at the Guild for Imaginative Metachronism",
          hint: 'Mount a horse (4150+ XP) and joust at the <b>Guild for Imaginative Metachronism</b>: beat the pitch-black knight, then your class opponent.' },
      ],
    },
    [key('Rejected Rogue Ranch Rascals Require Retribution')]: {
      wiki: 'Rejected_Rogue_Ranch_Rascals_Require_Retribution',
      stages: [
        { match: 'has asked you to take out the boss of the baddies at the Rejected rogue ranch.',
          hint: 'Travel to the <b>Rejected Rogue Ranch</b>.' },
        { match: "has asked you to take out the boss of the baddies at the Rejected Rogue Ranch. You've found the Ranch",
          hint: 'Keep adventuring in the <b>Rejected Rogue Ranch</b> to find the leader (Towering Titan).' },
        { match: 'to let them know you took out the Towering Titan',
          hint: 'Return to <b>Somerset Square</b> and speak with your hint giver.' },
        { match: "you've beaten the belligerent boss of the baddies",
          hint: 'Quest done — collect your quadrant reward.' },
      ],
    },
    [key('The Last Nostronomian')]: {
      wiki: 'The_Last_Nostronomian',
      stages: [
        { match: 'The alien that helped you before has gone missing',
          hint: 'Encounter and defeat the <b>Nostronomian sleepwalker</b> in <b>Shiloh Sanatarium</b>.' },
        { match: 'When you fought the Nostronomian in Shiloh Sanatarium, it dropped a scrap',
          hint: "Use the <b>Shiloh appointment schedule</b> to find <b>Dr. Somnus's</b> appointment time." },
        { match: "the Nostonomian's appointment with Dr. Somnus has already passed",
          hint: 'Wait until the next day, then check the schedule for the new appointment time and visit then.' },
      ],
    },
    [key('Moon Over Twilight, Brutes Over Downtown')]: {
      wiki: 'Moon_Over_Twilight,_Brutes_Over_Downtown',
      stages: [
        { match: 'Rand mentioned the rooftops over downtown Twilight have descended into chaos',
          hint: 'Patrol the <b>downtown rooftops</b> for "Like Muscle Beach Without the Beach".' },
        { match: 'The trouble downtown has led you to another location, WoDo',
          hint: "Visit <b>Tiny's Shack</b>; blend in or beat the massive brute to reach <b>Camp Training Camp</b>." },
        { match: 'The brutes seem to be originally',
          hint: 'Patrol <b>Camp Training Camp</b> and defeat the three trainers, then (red cape + greased bowling shoes + portable hole) the <b>Crash Brothers</b>, and report to <b>Rand</b>.' },
      ],
    },
    [key('Asylumbreak! Battle of Shiloh')]: {
      wiki: 'Asylumbreak!_Battle_of_Shiloh',
      stages: [
        { match: 'Officer Rand has informed you, in confidence, that Shiloh Sanatarium has lost track of a',
          hint: 'Equip ZOM gear, a flying ability, and a gas/steam mask, then adventure in <b>Shiloh Sanatarium</b> until the orderly encounter.' },
        { match: "You've found a secret facility under Shiloh Sanatarium",
          hint: 'Solve the <b>Goldbergium Door</b> puzzle to get the spare lab key.' },
        { match: 'built a contraption to get the key to the Goldbergium Door',
          hint: 'Defeat the <b>ZOMicron</b> behind the Goldbergium Door.' },
        { match: "You've dealt with the ZOMicron behind the Goldbergium Door",
          hint: 'Defeat <b>Doctor Zomadeus</b> and her <b>ZOMega</b> (Triassic Park / the Bestiary).' },
        { match: 'You defeated Doctor Zomadeus and her massive ZOMega',
          hint: 'Check in with <b>Officer Rand</b> at the Twilight Police Department.' },
      ],
    },
    [key('The Oldest and Strongest Emotion')]: {
      wiki: 'The_Oldest_and_Strongest_Emotion',
      stages: [
        { match: "Lately you've been getting a slightly creepy feeling whenever you find yourself close to the University campus",
          hint: 'Adventure in "Campus: Investigate a Retro Rave" until "The Old Man and the Me".' },
        { match: "you've found quite possibly the creepiest old man in Twilight",
          hint: 'Adventure in <b>Shiloh Sanatarium</b> to collect the clock-face item and the other six clock parts (in order).' },
        { match: 'You have a completely unnerving clock',
          hint: "Reach level 30, equip the <b>dreamer's clock</b>, and visit the <b>Creepy Old House</b>." },
      ],
    },
    [key('Pursuing a Majority Report')]: {
      wiki: 'Pursuing_a_Majority_Report',
      stages: [
        { match: "Right now you're waiting for him to get a good reading so you know where to go",
          hint: 'Adventure with the <b>pre-vandalism radio</b> equipped (~2 hours) until Phil gets a reading.' },
        { match: "He's found a likely target and has suggested you go look",
          hint: 'Travel to the location <b>Phil</b> points you to and adventure there until the vandalism event.' },
      ],
    },
    [key('Follow Your Nose to a Balanced Breakfast')]: {
      wiki: 'Follow_Your_Nose_to_a_Balanced_Breakfast',
      stages: [
        { match: "You're trying to help Leyonne track down a cereal criminal",
          hint: 'Go to the assigned location (matches your level), adventure with the <b>cereal port scanner</b> equipped until the cereal villain appears, then defeat it.' },
      ],
    },
    [key('Who Stalks the Stalkers')]: {
      wiki: 'Who_Stalks_the_Stalkers',
      stages: [
        { match: "You've learned of a new school within the university specializing in Villain Studies",
          hint: "Visit the <b>Twilight Police Department</b> for <b>Rand's</b> briefing." },
        { match: "The School of Villainy's mysterious backers have been sending in shipments of talismans",
          hint: 'Adventure at the <b>School of Villainy</b> (combat gear vs. henchstalkers, or noncombat/debate items) for the first encounter.' },
        { match: 'You fought the messenger sent by the School of Villainy',
          hint: 'Return to the <b>School of Villainy</b> and defeat the <b>Sneak King</b>.' },
      ],
    },
  };

  // Body HTML for a quest given its current entry text: the hint of the stage
  // whose `match` snippet is found in the entry and is longest (most specific),
  // else a link to the quest's TH wiki walkthrough.
  function hintFor(name, entryText) {
    const quest = QUESTS[key(name)];
    const flat = normForMatch(entryText);
    if (quest && quest.stages) {
      let best = null;
      let bestLen = -1;
      for (const stage of quest.stages) {
        const m = normForMatch(stage.match);
        if (m && m.length > bestLen && flat.includes(m)) {
          best = stage.hint;
          bestLen = m.length;
        }
      }
      if (best != null) return best;
    }
    const href = wikiHref(name, quest && quest.wiki);
    if (!href) return null;
    return (
      'No built-in hint for this stage yet &mdash; see the ' +
      '<a href="' + href + '" target="_blank" rel="noopener">' +
      'walkthrough for this quest on the TH wiki</a>.'
    );
  }

  // The "Next steps" box. Inline styles only (repo convention); a left accent
  // bar in the same blue as the wiki badge, kept visually quiet so it reads as
  // a helper note rather than part of the game's own quest text.
  function makeBox(name, entryText) {
    const body = hintFor(name, entryText);
    if (body == null) return null;
    const box = document.createElement('div');
    box.className = 'th-quest-helper';
    box.style.cssText =
      'margin:6px 0 10px;padding:6px 10px;border-left:3px solid #3366cc;' +
      'background:#f0f3fb;font-family:arial,sans-serif;font-size:12px;' +
      'line-height:1.4;color:#333;border-radius:0 3px 3px 0;';
    const label = document.createElement('div');
    label.textContent = 'Next steps';
    label.style.cssText =
      'font-weight:bold;font-size:10px;text-transform:uppercase;' +
      'letter-spacing:.5px;color:#3366cc;margin-bottom:2px;';
    const text = document.createElement('div');
    text.innerHTML = body;
    box.appendChild(label);
    box.appendChild(text);
    return box;
  }

  // A quest's entry is a flat run of text nodes / <BR> / <P> following its
  // heading, up to the next heading (or, for B-quests, the next <b> title).
  // Collect that text (to pick the stage) and remember where the run ends (to
  // drop the box after the description, before the next quest, so it doesn't
  // split the title from its text). `isBoundary` decides where the run ends.
  // The quest name from a heading, EXCLUDING any badge the wiki-links script
  // injects into the same <h2>/<b> (an <a class="th-wiki-link">W</a>). Using
  // heading.textContent here would append that "W" to the name, so the map
  // lookup (and the derived wiki slug) would never match. Skip those nodes.
  function headingName(heading) {
    let s = '';
    for (const node of heading.childNodes) {
      if (node.nodeType === 1 && node.classList &&
          node.classList.contains('th-wiki-link')) continue;
      s += node.textContent;
    }
    return s.trim();
  }

  function injectAfterSection(heading, isBoundary) {
    if (!heading || heading.dataset.thQuestHelper) return;
    const name = headingName(heading);
    if (!name) return;

    let entryText = '';
    let stop = heading.nextSibling;
    while (stop && !isBoundary(stop)) {
      if (stop.nodeType === 3) entryText += stop.textContent;
      else if (stop.nodeType === 1) entryText += ' ' + stop.textContent;
      stop = stop.nextSibling;
    }

    const box = makeBox(name, entryText);
    if (!box) return;
    heading.dataset.thQuestHelper = '1';
    // stop is the next quest's heading (insert before it) or null (last quest
    // -- append at the end of the container).
    heading.parentNode.insertBefore(box, stop);
  }

  // --- Quests ----------------------------------------------------------
  // Main quests are <h2>Quest Name</h2> followed by entry text. B-quests live
  // under an <h2>X-Quests</h2> tier divider as <b>Quest Name</b><BR>entry. The
  // page's only <h2>s are quest titles plus those dividers (matched by the
  // <letter>-Quests test, same as wiki-links.js); its only <b>s are B-quest
  // titles. Process B-quests first so the H2 divider that precedes them isn't
  // treated as a quest heading and doesn't act as a boundary mid-section.
  function isH2(n) { return n.nodeType === 1 && n.tagName === 'H2'; }
  function isDivider(h) { return /^[a-z]-quests$/i.test(h.textContent.trim()); }

  // The injection pass, and the only part that touches the page.
  function questHelper() {
    // B-quests: a <b> section runs until the next <b> or the next <h2>.
    document.querySelectorAll('b').forEach(function (b) {
      injectAfterSection(b, function (n) {
        return (n.nodeType === 1 && (n.tagName === 'B' || n.tagName === 'H2'));
      });
    });

    // Main quests: an <h2> section runs until the next <h2>.
    document.querySelectorAll('h2').forEach(function (h) {
      if (isDivider(h)) return; // tier divider, not a quest
      injectAfterSection(h, isH2);
    });
  }

  // === feature: sort the sell list =====================================
  //
  // Was its own sell-sort.js. Straight-line code in the original -- it ran on
  // eval -- so it is wrapped to become a registry entry.

  function sellSort() {
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
  }

  // === feature: cast a buff to the max =================================
  //
  // Was its own skills-cast-max.js. Two pages with different jobs (the full
  // buttons on skills.php, a compact form in the nav sidebar), and its own
  // dispatch between them is kept inside the function rather than split into
  // two entries, because the two share every helper below it.
  //
  // Its cached fetchSkillsDoc is the one hoisted to the top of this file.

  function skillsCastMax() {
    // Your current PP lives in the nav sidebar frame as "<current>/<max>" in the
    // #ppstring span. On skills.php that's a *sibling* frame; on nav.php it's the
    // very document we're running in. Probe the named frame first, then fall back
    // to scanning every frame for the span (self included).
    function getCurrentPP() {
      const read = doc => {
        const el = doc && doc.getElementById("ppstring");
        if (!el) return null;
        const m = el.textContent.match(/(\d+)\s*\/\s*\d+/);
        return m ? parseInt(m[1], 10) : null;
      };
      try {
        const nav = top.frames["nav"];
        if (nav) {
          const pp = read(nav.document);
          if (pp != null) return pp;
        }
      } catch (e) { /* cross-frame access can throw; fall through */ }
      try {
        const pp = read(document);
        if (pp != null) return pp;
      } catch (e) { /* fall through */ }
      try {
        for (const f of top.frames) {
          try {
            const pp = read(f.document);
            if (pp != null) return pp;
          } catch (e) { /* skip frames we can't read */ }
        }
      } catch (e) { /* no frames */ }
      return null;
    }

    // ===========================================================================
    // skills.php — "Max" button next to each casting form's "times" input.
    // ===========================================================================

    // The selected skill's cost is embedded in its <option> text, e.g.
    // "Stone Armor (12 PP)" or "Proper Grounding (1  PP)".
    function getSelectedCost(select) {
      const opt = select && select.options[select.selectedIndex];
      if (!opt) return null;
      const m = opt.textContent.match(/(\d+)\s*PP/i);
      return m ? parseInt(m[1], 10) : null;
    }

    function addMaxButton(input) {
      const form = input.form;
      if (!form) return;
      const select = form.querySelector('select[name="whichskill_cast"]');
      if (!select) return;

      const btn = document.createElement("button");
      btn.type = "button"; // don't submit the form by merely existing
      btn.className = "th-cast-max";
      btn.textContent = "Max";
      btn.style.cssText = "margin-left:6px;cursor:pointer;";

      btn.addEventListener("click", () => {
        const cost = getSelectedCost(select);
        if (cost == null) { alert("Couldn't read the skill's PP cost."); return; }
        if (cost <= 0) { alert("This skill has no PP cost."); return; }
        const pp = getCurrentPP();
        if (pp == null) { alert("Couldn't read your current PP from the sidebar."); return; }
        const max = Math.floor(pp / cost);
        if (max < 1) {
          alert(`Not enough PP: you have ${pp}, this skill costs ${cost}.`);
          return;
        }
        input.value = max;
        form.submit();
      });

      input.after(btn);
    }

    function initSkillsPage() {
      const inputs = document.querySelectorAll('input[name="numtimes"]');
      for (const input of inputs) {
        // Idempotency: a previous run may already have added the button.
        if (input.nextElementSibling &&
            input.nextElementSibling.classList.contains("th-cast-max")) {
          continue;
        }
        addMaxButton(input);
      }
    }

    // ===========================================================================
    // nav.php — "+max" button on each Active Effect backed by a castable skill.
    //
    // Active Effects render as:
    //   <div onclick="showskill(8);">Stone Armor -<br>6,403.91 min</div>
    // We can't cast from the nav page itself, so on click we scrape skills.php to
    // find that skill's casting form / option value / PP cost (by name), then fire
    // a single background cast with numtimes = floor(PP / cost) and reload the
    // sidebar so its PP and effect timers refresh.
    // ===========================================================================

    // One request that casts the skill `times` times — skills.php honours numtimes
    // server-side, just as the on-page Max button relies on (no client loop).
    async function castMax(form, value, times) {
      const params = serializeForm(form, { whichskill_cast: value, numtimes: String(times) });
      const method = (form.method || "get").toLowerCase();
      const action = new URL(form.getAttribute("action") || "skills.php", SKILLS_URL).href;
      let res;
      if (method === "post") {
        res = await fetch(action, {
          method: "POST",
          credentials: "same-origin",
          headers: { "Content-Type": "application/x-www-form-urlencoded" },
          body: params.toString(),
        });
      } else {
        const url = action + (action.includes("?") ? "&" : "?") + params.toString();
        res = await fetch(url, { credentials: "same-origin" });
      }
      if (!res.ok) throw new Error("Cast request returned HTTP " + res.status);
    }

    // The effect's skill name is the text before the "-<br>… min" tail, i.e. the
    // div's first text node ("Stone Armor -") with the trailing dash stripped.
    function effectName(div) {
      let raw = "";
      for (const node of div.childNodes) {
        if (node.nodeName === "BR") break;
        if (node.nodeType === Node.TEXT_NODE && node.textContent.trim()) {
          raw = node.textContent;
          break;
        }
      }
      if (!raw) raw = div.textContent;
      return raw.replace(/\s*-\s*$/, "").trim();
    }

    // `found` is the skills.php match (value/cost/form) resolved up front in
    // initNavPage — only effects backed by a castable skill ever get here.
    function addEffectMaxButton(div, found) {
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "th-effect-max";
      btn.textContent = "+max";
      // Expose the resolved PP cost so a sibling script (auto-combat.js) can decide
      // whether a click would cast at least once before triggering this button —
      // it can't re-derive the cost without re-scraping skills.php itself.
      btn.dataset.ppCost = String(found.cost);
      btn.style.cssText =
        "margin-left:6px;cursor:pointer;font-size:10px;line-height:1;padding:0 3px;vertical-align:middle;";

      btn.addEventListener("click", async e => {
        e.stopPropagation(); // don't also trigger the div's showskill() popup
        if (btn.disabled) return;
        const name = effectName(div);
        const original = btn.textContent;
        btn.disabled = true;
        btn.textContent = "…";
        try {
          const pp = getCurrentPP();
          if (pp == null) { alert("Couldn't read your current PP."); return; }
          const max = Math.floor(pp / found.cost);
          if (max < 1) {
            alert(`Not enough PP: you have ${pp}, ${name} costs ${found.cost}.`);
            return;
          }
          await castMax(found.form, found.value, max);
          location.reload(); // refresh sidebar PP + effect timers
        } catch (err) {
          alert("Cast failed: " + (err && err.message ? err.message : err));
        } finally {
          btn.disabled = false;
          btn.textContent = original;
        }
      });

      div.appendChild(btn);
    }

    // Clears the cached skills.php HTML and re-evaluates every effect, so a skill
    // learned/forgotten mid-session is reflected without opening a new tab.
    async function refreshCache() {
      try { sessionStorage.removeItem("th-skills-html"); } catch (e) { /* ignore */ }
      for (const b of document.querySelectorAll(".th-effect-max")) b.remove();
      await initNavPage();
    }

    // A "refresh cache" button at the very bottom of the effect list. Matches the
    // sidebar's row markup (<td><font class="smnav">…) for visual consistency.
    function addRefreshCacheButton() {
      if (document.querySelector(".th-refresh-cache")) return;
      const anchor = document.querySelector('div[onclick*="showskill("]');
      const table = anchor && anchor.closest("table");
      if (!table) return;

      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "th-refresh-cache";
      btn.textContent = "refresh cache";
      btn.style.cssText =
        "cursor:pointer;font-size:10px;line-height:1;padding:0 3px;";
      btn.addEventListener("click", async () => {
        if (btn.disabled) return;
        const original = btn.textContent;
        btn.disabled = true;
        btn.textContent = "…";
        try {
          await refreshCache();
        } finally {
          btn.disabled = false;
          btn.textContent = original;
        }
      });

      const tr = table.insertRow();
      const td = tr.insertCell();
      const font = document.createElement("font");
      font.className = "smnav";
      font.appendChild(btn);
      td.appendChild(font);
    }

    async function initNavPage() {
      const divs = document.querySelectorAll('div[onclick*="showskill("]');
      if (!divs.length) return;
      addRefreshCacheButton(); // anchored to the list; added once even on re-runs.

      // Idempotency: a previous run may already have added the buttons.
      const pending = [...divs].filter(div => !div.querySelector(".th-effect-max"));
      if (!pending.length) return;

      // Resolve castability up front: an effect only gets a "+max" button if its
      // name matches a castable skill on skills.php with a real PP cost. Effects
      // granted by items (e.g. "Senging' in the Rain") aren't on skills.php, so
      // findSkillOption returns null and they're skipped.
      let doc;
      try {
        doc = await fetchSkillsDoc();
      } catch (e) {
        return; // can't tell what's castable; add no buttons rather than guess
      }
      for (const div of pending) {
        const found = findSkillOption(doc, effectName(div));
        if (!found || !found.cost || found.cost <= 0) continue;
        addEffectMaxButton(div, found);
      }
    }

    // --- dispatch ---------------------------------------------------------------
    // Bundled via the all-in-one loader this IIFE may run on other pages too; branch on
    // the path and no-op everywhere else.
    const path = location.pathname;
    if (/\/skills\.php/i.test(path)) initSkillsPage();
    else if (/\/nav\.php/i.test(path)) initNavPage();
  }

  // === feature: sortable wearables =====================================
  //
  // Was its own wearables-ui.js.

  function wearablesUi() {
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
  }

  // === feature: wiki links =============================================
  //
  // Was its own wiki-links.js. It spans six pages plus /maps/, and its own
  // path dispatch is kept inside the function -- every branch shares the badge
  // helpers, so fanning it out into seven entries would buy nothing.
  //
  // WIKI_BASE and wikiHref come from the shared block at the top now.

  function wikiLinks() {
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
  }

  // === feature registry =================================================

  const FEATURES = [
    { name: 'autobox', path: /\/(main|criminology)\.php/i, run: autobox },
    { name: 'header-heal', path: /\/header\.php/i, run: headerHeal },
    { name: 'header-hideout-links', path: /\/header\.php/i, run: headerHideoutLinks },
    { name: 'inventory-filter', path: /\/(inventory|wear|use)\.php/i, run: inventoryFilter },
    { name: 'quest-helper', path: /\/journal\.php/i, run: questHelper },
    { name: 'sell-sort', path: /\/sell\.php/i, run: sellSort },
    { name: 'skills-cast-max', path: /\/(skills|nav)\.php/i, run: skillsCastMax },
    { name: 'wearables-ui', path: /\/wear\.php/i, run: wearablesUi },
    { name: 'wiki-links', path: /\/(fight|nav|journal|inventory|wear|use)\.php|\/maps\//i, run: wikiLinks },
  ];

  function run() {
    for (const feature of FEATURES) {
      if (!feature.path.test(location.pathname)) continue;
      const fail = (e) => {
        console.error('TH UX Enhancers: feature "' + feature.name + '" failed.', e);
      };
      try {
        // An async feature settles after this frame, so try/catch alone would
        // let a rejection escape as an unhandled one.
        const out = feature.run();
        if (out && typeof out.catch === 'function') out.catch(fail);
      } catch (e) {
        fail(e);
      }
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', run);
  } else {
    run();
  }
})();
