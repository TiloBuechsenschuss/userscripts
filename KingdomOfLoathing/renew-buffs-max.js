// ==UserScript==
// @name         KoL Renew Buffs (Max)
// @author       Tilo
// @namespace    https://github.com/TiloBuechsenschuss
// @downloadURL  https://raw.githubusercontent.com/TiloBuechsenschuss/userscripts/refs/heads/main/KingdomOfLoathing/renew-buffs-max.js
// @version      1.2
// @description  Adds a small "max" button next to every prolongable (up-arrow) buff in the charpane. Clicking it casts that buff as many times as your current MP allows, then refreshes the charpane. The per-cast MP cost is measured live (cast once, read the MP delta) so it stays correct under MP-cost reductions from gear/effects.
// @match        https://www.kingdomofloathing.com/charpane.php*
// @match        https://kingdomofloathing.com/charpane.php*
// @grant        none

// ==/UserScript==

(function () {
  'use strict';

  // This script runs INSIDE the charpane frame, so `document` is the sidebar,
  // MP can be read from it directly, and a refresh is just location.reload().
  //
  // Each prolongable buff is an `<a class="upeffect" href="upeffect.php?efid=
  // ...&qty=1&pwd=HASH">` carrying its own pwd hash. We reuse that href rather
  // than rebuilding it, so we never have to hunt for the pwd ourselves. The
  // existing charpane code already multi-casts by swapping `qty=1` -> `qty=N`
  // and appending `&ajax=1`; we do the same.

  // How many single casts the loop fallback will attempt before giving up, in
  // case MP can't be read (so it can't run away firing requests forever).
  const LOOP_CAST_CAP = 60;

  // Read current MP as a number (or null) by finding the cell with the mp.gif
  // icon, whose text reads "<cur> / <max>". `root` is any document/element to
  // scan: the live charpane, or a parsed re-fetch of it.
  function readMpFrom(root) {
    const imgs = root.getElementsByTagName('img');
    for (let i = 0; i < imgs.length; i++) {
      const src = imgs[i].getAttribute('src') || '';
      if (!/mp\.gif/i.test(src)) continue;
      const td = imgs[i].closest ? imgs[i].closest('td') : imgs[i].parentNode;
      const host = td || imgs[i].parentNode;
      if (!host) continue;
      // \s matches the &nbsp; KoL puts around the "/"; textContent (live DOM or
      // a parsed document) exposes it as a real char, so this parses cleanly.
      const m = (host.textContent || '').match(/([\d,]+)\s*\/\s*([\d,]+)/);
      if (m) return parseInt(m[1].replace(/,/g, ''), 10);
    }
    return null;
  }

  // Fresh MP read by re-fetching the charpane and parsing it with the same
  // logic that works on the live DOM. We use this (not api.php) because the
  // live DOM is stale right after a background ajax cast, and charpane.php is
  // the canonical source we already know how to read. Returns a number/null.
  function readMpFresh() {
    return fetch('charpane.php', { credentials: 'same-origin', cache: 'no-store' })
      .then(function (r) { return r.ok ? r.text() : null; })
      .then(function (html) {
        if (!html) return null;
        const doc = new DOMParser().parseFromString(html, 'text/html');
        return readMpFrom(doc);
      })
      .catch(function () { return null; });
  }

  // Cast a buff `n` times via its up-arrow href. Resolves with the response
  // text so the caller can detect KoL's "no|<reason>" failure format.
  function cast(href, n) {
    const url = href.replace('qty=1', 'qty=' + n) +
      (href.indexOf('ajax=') === -1 ? '&ajax=1' : '');
    return fetch(url, { credentials: 'same-origin', cache: 'no-store' })
      .then(function (r) { return r.text(); });
  }

  // KoL signals a failed cast with a response beginning "no|<reason>".
  function failureReason(text) {
    const m = (text || '').match(/^\s*no\|([^|]*)/i);
    return m ? m[1].trim() : null;
  }

  function setBusy(btn, busy, label) {
    btn.disabled = busy;
    btn.style.opacity = busy ? '0.5' : '1';
    btn.style.cursor = busy ? 'default' : 'pointer';
    btn.textContent = label;
  }

  function reload() {
    window.location.reload();
  }

  // Fallback used when the MP delta can't be measured: just keep casting once
  // at a time until KoL refuses (out of MP / at the cap), then refresh. Capped
  // so a parsing problem can't fire requests endlessly.
  function loopCast(href, name, left) {
    if (left <= 0) { reload(); return; }
    cast(href, 1).then(function (out) {
      if (failureReason(out)) { reload(); return; }
      loopCast(href, name, left - 1);
    }).catch(function () { reload(); });
  }

  // Cast `name` (via `href`) as many times as current MP allows. We don't know
  // the player's *effective* per-cast cost up front (gear/effects discount it),
  // so we cast once, measure the MP drop, then cast floor(remaining / cost)
  // more in a single request. Total casts == floor(startMp / cost) = the max
  // affordable. Refreshes the charpane when done.
  function castMax(btn, href, name) {
    const original = btn.textContent;
    setBusy(btn, true, '…');

    const startMp = readMpFrom(document);

    // Probe cast: one cast tells us the real per-cast MP cost.
    cast(href, 1).then(function (out) {
      const reason = failureReason(out);
      if (reason) {
        // Already maxed, out of MP for even one, etc. Reflect new state.
        alert('Renew max (' + name + '): ' + reason + '.');
        reload();
        return;
      }

      readMpFresh().then(function (mpAfter) {
        // If we couldn't read MP before and/or after, we can't compute the
        // cost -- fall back to casting one at a time until KoL refuses.
        if (startMp == null || mpAfter == null) {
          loopCast(href, name, LOOP_CAST_CAP);
          return;
        }
        const cost = startMp - mpAfter;
        if (cost <= 0) {
          // Free cast, or MP moved unexpectedly; cast-till-refused instead.
          loopCast(href, name, LOOP_CAST_CAP);
          return;
        }
        const more = Math.floor(mpAfter / cost);
        if (more <= 0) { reload(); return; }
        cast(href, more).then(reload).catch(reload);
      });
    }).catch(function (err) {
      console.error('Renew max: cast failed.', err);
      alert('Renew max: the cast request failed (see console).');
      setBusy(btn, false, original);
    });
  }

  function makeMaxButton(href, name) {
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'tm-renew-max';
    btn.textContent = 'max';
    btn.title = 'Cast ' + name + ' as many times as your MP allows';
    btn.style.cssText = [
      'margin-left:2px',
      'padding:0 3px',
      'font-size:8px',
      'font-family:arial,helvetica,sans-serif',
      'line-height:11px',
      'height:13px',
      'vertical-align:middle',
      'cursor:pointer',
      'border:1px solid #888',
      'border-radius:2px',
      'background:#eee',
      'white-space:nowrap'
    ].join(';');
    btn.addEventListener('click', function (e) {
      e.preventDefault();
      e.stopPropagation();
      castMax(btn, href, name);
    });
    return btn;
  }

  // Item-granted buffs share the .upeffect / upeffect.php link with cast skills,
  // but their up-arrow tooltip reads "Click to use ..." instead of "Click to
  // cast ...". "Cast as many as MP allows" is meaningless for an item, so only
  // act on arrows whose tooltip says cast.
  function isCastArrow(link) {
    const img = link.querySelector('img');
    const tip = (img && (img.getAttribute('title') || img.getAttribute('alt'))) || '';
    return /\bcast\b/i.test(tip);
  }

  function enhance() {
    const links = document.querySelectorAll('a.upeffect');
    for (let i = 0; i < links.length; i++) {
      const link = links[i];
      // Idempotency: skip a link we've already given a button.
      if (link.getAttribute('data-tm-renew-max')) continue;
      const href = link.getAttribute('href');
      if (!href || href.indexOf('upeffect.php') === -1) continue;
      if (!isCastArrow(link)) continue; // item-use buff, not a skill
      link.setAttribute('data-tm-renew-max', '1');
      const name = link.getAttribute('rel') || 'this buff';
      link.insertAdjacentElement('afterend', makeMaxButton(href, name));
    }
  }

  enhance();
})();
