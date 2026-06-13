// ==UserScript==
// @name         Twilight Heroes - Skill Cast Max
// @author       Tilo
// @namespace    https://github.com/TiloBuechsenschuss
// @downloadURL  https://raw.githubusercontent.com/TiloBuechsenschuss/userscripts/refs/heads/main/TwilightHeroes/skills-cast-max.js
// @version      1.0
// @description  Adds a "Max" button to the right of the "times" input on each skill-casting form on skills.php. Clicking it reads the selected skill's PP cost and your current PP (from the sidebar frame), fills in floor(PP / cost), and casts the skill that many times.
// @match        https://www.twilightheroes.com/skills.php*
// @match        https://twilightheroes.com/skills.php*
// @run-at       document-idle
// @grant        none
// ==/UserScript==

(function () {
  "use strict";

  // Your current PP lives in a *sibling* frame (nav.php), not on skills.php
  // itself, as "<current>/<max>". Probe the named frame first, then fall
  // back to scanning every frame for the #ppstring span.
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
      for (const f of top.frames) {
        try {
          const pp = read(f.document);
          if (pp != null) return pp;
        } catch (e) { /* skip frames we can't read */ }
      }
    } catch (e) { /* no frames */ }
    return null;
  }

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

  function init() {
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

  init();
})();
