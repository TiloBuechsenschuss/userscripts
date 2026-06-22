// ==UserScript==
// @name         Twilight Heroes Skill Cast Max
// @author       Tilo
// @namespace    https://github.com/TiloBuechsenschuss
// @downloadURL  https://raw.githubusercontent.com/TiloBuechsenschuss/userscripts/refs/heads/main/TwilightHeroes/skills-cast-max.js
// @version      1.5
// @description  On skills.php, adds a "Max" button next to each skill-casting form's "times" input that fills in floor(PP / cost) and casts. In the nav sidebar (nav.php), adds a "+max" button to each Active Effect whose buff is a castable skill; clicking it silently recasts that skill floor(PP / cost) times (via background fetch) and reloads the sidebar. Each "+max" button carries the buff's PP cost in data-pp-cost so auto-combat.js can drive it when PP fills up.
// @match        https://www.twilightheroes.com/skills.php*
// @match        https://twilightheroes.com/skills.php*
// @match        https://www.twilightheroes.com/nav.php*
// @match        https://twilightheroes.com/nav.php*
// @run-at       document-idle
// @grant        none
// ==/UserScript==

(function () {
  "use strict";

  const SKILLS_URL = location.origin + "/skills.php";

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

  // Fetch + parse skills.php once. Cached for the session so repeated nav
  // reloads (each "+max" click reloads the sidebar) don't re-hit the server —
  // the castable-skill list only changes when you learn/forget a skill.
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
  // Bundled via all-in-one.js this IIFE may run on other pages too; branch on
  // the path and no-op everywhere else.
  const path = location.pathname;
  if (/\/skills\.php/i.test(path)) initSkillsPage();
  else if (/\/nav\.php/i.test(path)) initNavPage();
})();
