// ==UserScript==
// @name         Twilight Heroes Header Heal Button
// @author       Tilo
// @namespace    https://github.com/TiloBuechsenschuss
// @downloadURL  https://raw.githubusercontent.com/TiloBuechsenschuss/userscripts/refs/heads/main/TwilightHeroes/header-heal.js
// @version      1.5
// @description  Adds a "Heal" link to the top navigation header, in parentheses right after the Skills link. Clicking it repeatedly casts your heal skill(s) until HP is full or you can no longer afford any of them. Heal skills are configured below with a priority and are matched against skills.php by name (no hardcoded skill ids).
// @match        https://www.twilightheroes.com/header.php*
// @match        https://twilightheroes.com/header.php*
// @run-at       document-idle
// @grant        none
// ==/UserScript==

(function () {
  "use strict";

  // Bundled-loader safety: all-in-one.js @requires every TH script and runs
  // them on the union of all matched pages. Guard header.php explicitly, or this
  // script would inject its "Heal" link after any Skills link that happens to
  // appear on another content page. A no-op for the standalone install, whose
  // @match already scopes it to header.php.
  if (!/\/header\.php/i.test(location.pathname)) return;

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

  const SKILLS_URL = location.origin + "/skills.php";

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

  async function fetchSkillsDoc() {
    const res = await fetch(SKILLS_URL, { credentials: "same-origin" });
    if (!res.ok) throw new Error("skills.php returned HTTP " + res.status);
    const html = await res.text();
    return new DOMParser().parseFromString(html, "text/html");
  }

  // Find the skill's casting form, option value and PP cost by name. The cost is
  // embedded in the option text, e.g. "Lifeblood Manipulation (12 PP)".
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
  // buttons (so we mirror skills-cast-max's reliance on form.submit()).
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
})();
