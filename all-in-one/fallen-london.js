// ==UserScript==
// @name         Fallen London All-in-One (loader)
// @author       Tilo
// @namespace    https://github.com/TiloBuechsenschuss
// @downloadURL  https://raw.githubusercontent.com/TiloBuechsenschuss/userscripts/refs/heads/main/all-in-one/fallen-london.js
// @version      0.2
// @description  Single-install loader for the Fallen London userscripts in this repo. It carries no logic of its own; it @requires each individual script straight from GitHub so installing this one file gives you all of them.
//
// @match        https://www.fallenlondon.com/*
// @match        https://fallenlondon.com/*
//
// @require      https://raw.githubusercontent.com/TiloBuechsenschuss/userscripts/refs/heads/main/FallenLondon/wiki-links.js
//
// @run-at       document-idle
// @grant        none
// ==/UserScript==

// Intentionally empty. All behaviour comes from the @require'd files above,
// each of which is a self-contained IIFE that scrapes the page it cares about
// and bails out harmlessly on every other page. This loader only exists to
// pull them in from one install. To add/remove a bundled script, edit the
// @require list (and the @match union) here and bump @version.
