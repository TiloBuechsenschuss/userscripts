// ==UserScript==
// @name         Twilight Heroes Header Hideout Links
// @author       Tilo
// @namespace    https://github.com/TiloBuechsenschuss
// @downloadURL  https://raw.githubusercontent.com/TiloBuechsenschuss/userscripts/refs/heads/main/TwilightHeroes/header-hideout-links.js
// @version      1.2
// @description  Adds quick "Garage" (garage.php) and "Rest" (rest.php) links to the top navigation header, in parentheses right after the Hideout link.
// @match        https://www.twilightheroes.com/header.php*
// @match        https://twilightheroes.com/header.php*
// @run-at       document-idle
// @grant        none
// ==/UserScript==

(function () {
  "use strict";

  // Bundled-loader safety: the all-in-one loader @requires every TH script and runs
  // them on the union of all matched pages. Guard header.php explicitly, or this
  // script would inject its links after any Hideout link that happens to appear
  // on another content page. A no-op for the standalone install, whose @match
  // already scopes it to header.php.
  if (!/\/header\.php/i.test(location.pathname)) return;

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
})();
