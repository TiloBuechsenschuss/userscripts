// ==UserScript==
// @name         KoL All-in-One (loader)
// @author       Tilo
// @namespace    https://github.com/TiloBuechsenschuss
// @downloadURL  https://raw.githubusercontent.com/TiloBuechsenschuss/userscripts/refs/heads/main/all-in-one/kingdom-of-loathing.js
// @version      1.41
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
// @match        https://www.kingdomofloathing.com/hermit.php*
// @match        https://kingdomofloathing.com/hermit.php*
// @match        https://www.kingdomofloathing.com/tiles.php*
// @match        https://kingdomofloathing.com/tiles.php*
// @match        https://www.kingdomofloathing.com/adventure.php*
// @match        https://kingdomofloathing.com/adventure.php*
// @match        https://www.kingdomofloathing.com/pandamonium.php*
// @match        https://kingdomofloathing.com/pandamonium.php*
// @match        https://www.kingdomofloathing.com/inv_use.php*
// @match        https://kingdomofloathing.com/inv_use.php*
// @match        https://www.kingdomofloathing.com/runskillz.php*
// @match        https://kingdomofloathing.com/runskillz.php*
// @match        https://www.kingdomofloathing.com/sushi.php*
// @match        https://kingdomofloathing.com/sushi.php*
//
// @require      https://raw.githubusercontent.com/TiloBuechsenschuss/userscripts/refs/heads/main/KingdomOfLoathing/iotm.js
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
// @require      https://raw.githubusercontent.com/TiloBuechsenschuss/userscripts/refs/heads/main/KingdomOfLoathing/equip-optimize.js
// @require      https://raw.githubusercontent.com/TiloBuechsenschuss/userscripts/refs/heads/main/KingdomOfLoathing/boss-aggro-warn.js
// @require      https://raw.githubusercontent.com/TiloBuechsenschuss/userscripts/refs/heads/main/KingdomOfLoathing/ux-enhancers.js
// @require      https://raw.githubusercontent.com/TiloBuechsenschuss/userscripts/refs/heads/main/KingdomOfLoathing/quest-helper.js
// @require      https://raw.githubusercontent.com/TiloBuechsenschuss/userscripts/refs/heads/main/KingdomOfLoathing/auto-combat.js
//
// @run-at       document-idle
// @grant        none
// ==/UserScript==

// Intentionally empty. All behaviour comes from the @require'd files above,
// each of which is a self-contained IIFE that scrapes the page it cares about
// and bails out harmlessly on every other page. This loader only exists to
// pull them in from one install. To add/remove a bundled script, edit the
// @require list (and the @match union) here and bump @version.
//
// tiles.php, adventure.php, pandamonium.php, inv_use.php, runskillz.php and
// sushi.php are in the @match union only for quest-helper.js: the Hidden Temple
// tile-floor puzzle uses the custom tiles.php endpoint, its first screen renders
// as an ordinary adventure result, Sven Golly's band lives on pandamonium.php,
// and the last three are where the Mer-kin dreadscroll's clue words get printed
// (a knucklebone, Deep Dark Visions, and sushi eaten with worktea in your bag).
// adventure.php is a hot page, but every bundled script gates on
// location.pathname before doing anything, so the rest just bail there.
