// ==UserScript==
// @name         KoL All-in-One (loader)
// @author       Tilo
// @namespace    https://github.com/TiloBuechsenschuss
// @downloadURL  https://raw.githubusercontent.com/TiloBuechsenschuss/userscripts/refs/heads/main/all-in-one/kingdom-of-loathing.js
// @version      1.21
// @description  Single-install loader for the Kingdom of Loathing userscripts in this repo. It carries no logic of its own; it @requires each individual script straight from GitHub so installing this one file gives you all of them. NOTE: adventure-choices.js is intentionally NOT bundled here -- it needs GM_* grants, which are incompatible with the @grant none mode the other scripts rely on. Install that one separately.
//
// @match        https://www.kingdomofloathing.com/awesomemenu.php*
// @match        https://kingdomofloathing.com/awesomemenu.php*
// @match        https://www.kingdomofloathing.com/topmenu.php*
// @match        https://kingdomofloathing.com/topmenu.php*
// @match        https://www.kingdomofloathing.com/choice.php*
// @match        https://kingdomofloathing.com/choice.php*
// @match        https://www.kingdomofloathing.com/charpane.php*
// @match        https://kingdomofloathing.com/charpane.php*
// @match        https://www.kingdomofloathing.com/main.php*
// @match        https://kingdomofloathing.com/main.php*
// @match        https://www.kingdomofloathing.com/leaflet.php*
// @match        https://kingdomofloathing.com/leaflet.php*
// @match        https://www.kingdomofloathing.com/mining.php*
// @match        https://kingdomofloathing.com/mining.php*
// @match        https://www.kingdomofloathing.com/mine.php*
// @match        https://kingdomofloathing.com/mine.php*
// @match        https://*.kingdomofloathing.com/volcanomaze.php*
// @match        https://kingdomofloathing.com/volcanomaze.php*
// @match        https://www.kingdomofloathing.com/sellstuff_ugly.php*
// @match        https://kingdomofloathing.com/sellstuff_ugly.php*
// @match        https://www.kingdomofloathing.com/fight.php*
// @match        https://kingdomofloathing.com/fight.php*
// @match        https://www.kingdomofloathing.com/inventory.php*
// @match        https://kingdomofloathing.com/inventory.php*
// @match        https://www.kingdomofloathing.com/place.php*
// @match        https://kingdomofloathing.com/place.php*
// @match        https://www.kingdomofloathing.com/questlog.php*
// @match        https://kingdomofloathing.com/questlog.php*
// @match        https://www.kingdomofloathing.com/dwarfcontraption.php*
// @match        https://kingdomofloathing.com/dwarfcontraption.php*
// @match        https://www.kingdomofloathing.com/cobbsknob.php*
// @match        https://kingdomofloathing.com/cobbsknob.php*
// @match        https://www.kingdomofloathing.com/crypt.php*
// @match        https://kingdomofloathing.com/crypt.php*
// @match        https://www.kingdomofloathing.com/cellar.php*
// @match        https://kingdomofloathing.com/cellar.php*
//
// @require      https://raw.githubusercontent.com/TiloBuechsenschuss/userscripts/refs/heads/main/KingdomOfLoathing/codpiece.js
// @require      https://raw.githubusercontent.com/TiloBuechsenschuss/userscripts/refs/heads/main/KingdomOfLoathing/daily-checklist.js
// @require      https://raw.githubusercontent.com/TiloBuechsenschuss/userscripts/refs/heads/main/KingdomOfLoathing/charpane-heal.js
// @require      https://raw.githubusercontent.com/TiloBuechsenschuss/userscripts/refs/heads/main/KingdomOfLoathing/skills-cast-max.js
// @require      https://raw.githubusercontent.com/TiloBuechsenschuss/userscripts/refs/heads/main/KingdomOfLoathing/strange-leaflet.js
// @require      https://raw.githubusercontent.com/TiloBuechsenschuss/userscripts/refs/heads/main/KingdomOfLoathing/mine-sparkle-highlight.js
// @require      https://raw.githubusercontent.com/TiloBuechsenschuss/userscripts/refs/heads/main/KingdomOfLoathing/instant-nemesis-maze.js
// @require      https://raw.githubusercontent.com/TiloBuechsenschuss/userscripts/refs/heads/main/KingdomOfLoathing/sell-sort.js
// @require      https://raw.githubusercontent.com/TiloBuechsenschuss/userscripts/refs/heads/main/KingdomOfLoathing/wiki-links.js
// @require      https://raw.githubusercontent.com/TiloBuechsenschuss/userscripts/refs/heads/main/KingdomOfLoathing/dwarven-factory-solver.js
// @require      https://raw.githubusercontent.com/TiloBuechsenschuss/userscripts/refs/heads/main/KingdomOfLoathing/inventory-collapse.js
// @require      https://raw.githubusercontent.com/TiloBuechsenschuss/userscripts/refs/heads/main/KingdomOfLoathing/boss-aggro-warn.js
//
// @run-at       document-idle
// @grant        none
// ==/UserScript==

// Intentionally empty. All behaviour comes from the @require'd files above,
// each of which is a self-contained IIFE that scrapes the page it cares about
// and bails out harmlessly on every other page. This loader only exists to
// pull them in from one install. To add/remove a bundled script, edit the
// @require list (and the @match union) here and bump @version.
