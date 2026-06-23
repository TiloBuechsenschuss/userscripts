// ==UserScript==
// @name         KoL Mine Sparkle Highlight
// @author       Tilo
// @namespace    https://github.com/TiloBuechsenschuss
// @downloadURL  https://raw.githubusercontent.com/TiloBuechsenschuss/userscripts/refs/heads/main/KingdomOfLoathing/mine-sparkle-highlight.js
// @version      1.4
// @description  Makes twinkling "Promising Chunk of Wall" tiles in Itznotyerzitz Mine (mining.php) stand out with a constant pulsing gold glow, and subtly marks the other mineable tiles.
// @match        https://www.kingdomofloathing.com/mining.php*
// @match        https://kingdomofloathing.com/mining.php*
// @match        https://www.kingdomofloathing.com/mine.php*
// @match        https://kingdomofloathing.com/mine.php*
// @grant        none

// ==/UserScript==

(function () {
  'use strict';

  // Bundled-loader safety: the all-in-one loader @requires every KoL script and runs
  // them on the union of all matched pages. Guard our own pages explicitly, or
  // startPulse() would leave a perpetual no-op setInterval running on every
  // other KoL page. A no-op for the standalone install, whose @match already
  // scopes it to mining.php / mine.php.
  if (!/\/(mining|mine)\.php/i.test(location.pathname)) return;

  // NOTE: styling is applied via inline element styles (not an injected
  // <style> element). KoL's Content-Security-Policy allows inline style
  // ATTRIBUTES (the page uses them everywhere) but blocks script-injected
  // stylesheets, so @keyframes/CSS classes silently do nothing. The pulse is
  // therefore driven by a JS timer toggling an inline box-shadow.

  // Flip to false once you've confirmed the script is working in-game.
  const DEBUG = false;

  const sparkleImgs = [];

  // A tile is mineable when its <img> sits inside an <a href="mining.php...">.
  // Among those, the "Promising Chunk of Wall" tiles use the twinkling
  // wallsparkle*.gif images (also flagged in their alt/title text).
  function styleTiles() {
    const anchors = document.querySelectorAll('a[href*="mining.php"]');
    let diggable = 0;
    anchors.forEach((a) => {
      const img = a.querySelector('img');
      if (!img || img.dataset.mineHighlighted) return;

      const src = (img.getAttribute('src') || '').toLowerCase();
      const label = ((img.getAttribute('alt') || '') + ' ' +
                     (img.getAttribute('title') || '')).toLowerCase();
      const isSparkle = src.indexOf('sparkle') !== -1 ||
                        label.indexOf('promising') !== -1;

      diggable++;
      if (isSparkle) {
        img.style.outline = '3px solid gold';
        img.style.outlineOffset = '-3px';
        img.style.borderRadius = '3px';
        img.style.position = 'relative';
        img.style.zIndex = '2';
        img.style.transition = 'box-shadow 0.45s ease-in-out';
        sparkleImgs.push(img);
      } else {
        img.style.outline = '2px dashed rgba(0,200,255,0.85)';
        img.style.outlineOffset = '-2px';
      }
      img.dataset.mineHighlighted = '1';
    });
    return { anchors: anchors.length, sparkle: sparkleImgs.length, diggable };
  }

  // Visible proof the script ran: a fixed badge in the corner with tile counts.
  // Uses inline styles only (CSP-safe). Updated on every run() pass.
  function showDebug(stats) {
    if (!DEBUG) return;
    let badge = document.getElementById('mine-sparkle-debug');
    if (!badge) {
      badge = document.createElement('div');
      badge.id = 'mine-sparkle-debug';
      badge.style.cssText = [
        'position:fixed', 'top:4px', 'right:4px', 'z-index:99999',
        'background:rgba(0,0,0,0.85)', 'color:#0f0', 'font:11px monospace',
        'padding:4px 7px', 'border:1px solid #0f0', 'border-radius:4px',
        'white-space:pre', 'pointer-events:none',
      ].join(';');
      (document.body || document.documentElement).appendChild(badge);
    }
    badge.textContent =
      'mine-sparkle v1.3\n' +
      'mining.php links: ' + stats.anchors + '\n' +
      'promising (glow): ' + stats.sparkle + '\n' +
      'diggable (total): ' + stats.diggable;
  }

  function startPulse() {
    if (window.__mineSparklePulse) return; // one timer only
    let bright = false;
    window.__mineSparklePulse = setInterval(() => {
      if (sparkleImgs.length === 0) return;
      bright = !bright;
      const shadow = bright
        ? '0 0 16px 7px rgba(255,215,0,1)'
        : '0 0 4px 2px rgba(255,215,0,0.55)';
      sparkleImgs.forEach((img) => { img.style.boxShadow = shadow; });
    }, 550);
  }

  function run() {
    const stats = styleTiles();
    startPulse();
    showDebug(stats);
  }

  // The grid is hidden inside #preload until KoL's own window.onload swaps in
  // #postload, so run after that handler. The dataset guard makes re-runs safe.
  if (document.readyState === 'complete') {
    run();
  } else {
    window.addEventListener('load', () => setTimeout(run, 0));
  }
  // Backstop in case the postload swap lands after our first pass.
  setTimeout(run, 400);
})();
