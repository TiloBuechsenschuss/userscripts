// ==UserScript==
// @name         Twilight Heroes Autobox
// @author       Tilo
// @namespace    https://github.com/TiloBuechsenschuss
// @downloadURL  https://raw.githubusercontent.com/TiloBuechsenschuss/userscripts/refs/heads/main/TwilightHeroes/autobox.js
// @version      3.0
// @description  Adds a "Get & Equip Black Box" button to the main page. Clicking it walks the criminology.php quest steps automatically (submitting each successive form) and then follows the final link to get and equip the Black Box.
// @match        https://www.twilightheroes.com/main.php*
// @match        https://twilightheroes.com/main.php*
// @match        https://www.twilightheroes.com/criminology.php*
// @match        https://twilightheroes.com/criminology.php*
// @run-at       document-idle
// @grant        none
// ==/UserScript==

// Originally "Twilight Heroes Autobox" v2 by Heather Robinson
// (https://greasyfork.org/scripts/38222). Reworked to follow this repo's
// conventions: IIFE + 'use strict', explicit pathname guards (so it is safe to
// bundle via all-in-one.js), an idempotency guard on the injected button, and
// sessionStorage instead of localStorage for the cross-reload "run in progress"
// flag — matching the rest of the Twilight Heroes scripts here, which only need
// the state to survive the page's own reloads, not to persist between visits.

(function () {
  "use strict";

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
})();
