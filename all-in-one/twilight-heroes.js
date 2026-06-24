// ==UserScript==
// @name         Twilight Heroes All-in-One (loader)
// @author       Tilo
// @namespace    https://github.com/TiloBuechsenschuss
// @downloadURL  https://raw.githubusercontent.com/TiloBuechsenschuss/userscripts/refs/heads/main/all-in-one/twilight-heroes.js
// @version      1.7
// @description  Single-install loader for the Twilight Heroes userscripts in this repo. It carries no logic of its own; it @requires each individual script straight from GitHub so installing this one file gives you all of them.
//
// @match        https://www.twilightheroes.com/header.php*
// @match        https://twilightheroes.com/header.php*
// @match        https://www.twilightheroes.com/fight.php*
// @match        https://twilightheroes.com/fight.php*
// @match        https://www.twilightheroes.com/goldberg.php*
// @match        https://twilightheroes.com/goldberg.php*
// @match        https://www.twilightheroes.com/maps/*
// @match        https://twilightheroes.com/maps/*
// @match        https://www.twilightheroes.com/journal.php*
// @match        https://twilightheroes.com/journal.php*
// @match        https://www.twilightheroes.com/wear.php*
// @match        https://twilightheroes.com/wear.php*
// @match        https://www.twilightheroes.com/inventory.php*
// @match        https://twilightheroes.com/inventory.php*
// @match        https://www.twilightheroes.com/use.php*
// @match        https://twilightheroes.com/use.php*
// @match        https://www.twilightheroes.com/sell.php*
// @match        https://twilightheroes.com/sell.php*
// @match        https://www.twilightheroes.com/skills.php*
// @match        https://twilightheroes.com/skills.php*
// @match        https://www.twilightheroes.com/nav.php*
// @match        https://twilightheroes.com/nav.php*
// @match        https://www.twilightheroes.com/main.php*
// @match        https://twilightheroes.com/main.php*
// @match        https://www.twilightheroes.com/criminology.php*
// @match        https://twilightheroes.com/criminology.php*
//
// @require      https://raw.githubusercontent.com/TiloBuechsenschuss/userscripts/refs/heads/main/TwilightHeroes/header-heal.js
// @require      https://raw.githubusercontent.com/TiloBuechsenschuss/userscripts/refs/heads/main/TwilightHeroes/header-hideout-links.js
// @require      https://raw.githubusercontent.com/TiloBuechsenschuss/userscripts/refs/heads/main/TwilightHeroes/inventory-filter.js
// @require      https://raw.githubusercontent.com/TiloBuechsenschuss/userscripts/refs/heads/main/TwilightHeroes/wearables-ui.js
// @require      https://raw.githubusercontent.com/TiloBuechsenschuss/userscripts/refs/heads/main/TwilightHeroes/sell-sort.js
// @require      https://raw.githubusercontent.com/TiloBuechsenschuss/userscripts/refs/heads/main/TwilightHeroes/skills-cast-max.js
// @require      https://raw.githubusercontent.com/TiloBuechsenschuss/userscripts/refs/heads/main/TwilightHeroes/wiki-links.js
// @require      https://raw.githubusercontent.com/TiloBuechsenschuss/userscripts/refs/heads/main/TwilightHeroes/quest-helper.js
// @require      https://raw.githubusercontent.com/TiloBuechsenschuss/userscripts/refs/heads/main/TwilightHeroes/puzzle-solver.js
// @require      https://raw.githubusercontent.com/TiloBuechsenschuss/userscripts/refs/heads/main/TwilightHeroes/auto-combat.js
// @require      https://raw.githubusercontent.com/TiloBuechsenschuss/userscripts/refs/heads/main/TwilightHeroes/autobox.js
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
// Note on puzzle-solver.js (added v1.7, needs goldberg.php in the @match union):
// its Goldbergium Door solver is confirmed working in-game; its Bit Player half
// is NOT working yet (skeleton only -- it self-gates and no-ops until its DOM is
// wired up), so bundling it now is safe and adds nothing on the Bit Player page.
