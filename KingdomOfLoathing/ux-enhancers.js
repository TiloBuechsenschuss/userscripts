// ==UserScript==
// @name         KoL UX Enhancers
// @author       Tilo
// @namespace    https://github.com/TiloBuechsenschuss
// @downloadURL  https://raw.githubusercontent.com/TiloBuechsenschuss/userscripts/refs/heads/main/KingdomOfLoathing/ux-enhancers.js
// @version      1.1
// @description  A grab-bag of small quality-of-life tweaks for Kingdom of Loathing pages. Currently: at the Hermit (hermit.php) it adds a "Buy all clovers" button next to the Trade button that trades worthless items for every 11-leaf clover the Hermit still has in stock today, one at a time, then reloads and reports how many it got; at the Campground (campground.php) it guards a Beer Garden that hasn't grown for two days yet, since the fancy bottles and labels don't appear before then -- the crop is flagged and clicking it asks for confirmation first.
// @match        https://www.kingdomofloathing.com/hermit.php*
// @match        https://kingdomofloathing.com/hermit.php*
// @match        https://www.kingdomofloathing.com/campground.php*
// @match        https://kingdomofloathing.com/campground.php*
// @grant        none
// ==/UserScript==

(function () {
  'use strict';

  // This script is a container for several unrelated tweaks, each scoped to its
  // own page. Every feature below declares the path it applies to and is only
  // run there -- which also keeps it harmless when the all-in-one loader
  // @requires it and runs it on the union of every matched KoL page.

  const ORIGIN = location.origin;

  // === shared helpers ===================================================

  // The player's `pwd` hash, needed on any request that changes game state.
  // api.php is the canonical source and works from any frame; the DOM probes
  // are fallbacks for when it is unreachable.
  async function getPwd() {
    try {
      const res = await fetch(ORIGIN + '/api.php?what=status&for=ux-enhancers', {
        credentials: 'same-origin', cache: 'no-store',
      });
      if (res.ok) {
        const j = await res.json();
        if (j && typeof j.pwd === 'string' && j.pwd) return j.pwd;
      }
    } catch (e) { /* fall through to the DOM probes */ }

    const inp = document.querySelector('input[name="pwd"]');
    if (inp && inp.value) return inp.value;

    if (typeof window.pwdhash === 'string' && window.pwdhash) return window.pwdhash;

    const link = document.querySelector('a[href*="pwd="]');
    if (link) {
      const m = link.getAttribute('href').match(/[?&]pwd=([0-9a-fA-F]+)/);
      if (m) return m[1];
    }

    try {
      const cp = top.frames['charpane'];
      if (cp && typeof cp.pwdhash === 'string' && cp.pwdhash) return cp.pwdhash;
    } catch (e) { /* cross-frame access can throw; ignore */ }

    const m2 = document.documentElement.innerHTML.match(
      /pwd(?:hash)?\s*=\s*["']([0-9a-fA-F]+)["']/
    );
    return m2 ? m2[1] : null;
  }

  // A KoL-styled button, so injected controls look native.
  function makeButton(id, label) {
    const btn = document.createElement('input');
    btn.type = 'button';
    btn.id = id;
    btn.className = 'button';
    btn.value = label;
    return btn;
  }

  // === feature: buy all of the Hermit's remaining clovers ================
  //
  // The Hermit restocks a small number of 11-leaf clovers each day, but the
  // page never says how many are left -- the clover row is simply disabled
  // with "(out of stock for today)" once they are gone. So rather than guess a
  // quantity, we buy them one at a time and stop as soon as a trade stops
  // producing an item. That also means a partial run (worthless items ran out
  // mid-way) still keeps whatever it managed to buy.

  const HERMIT_BTN_ID = 'tm-hermit-buy-clovers';
  const HERMIT_MSG_KEY = 'tm-ux-hermit-result';
  // Safety net so a misread response can never loop forever. The Hermit has
  // stocked 3 clovers a day for as long as anyone can remember; this leaves
  // headroom in case that ever changes.
  const HERMIT_MAX_CLOVERS = 6;

  function hermitTradeForm() {
    const forms = document.querySelectorAll('form[action*="hermit.php"]');
    for (const f of forms) {
      if (f.querySelector('input[name="whichitem"]')) return f;
    }
    return null;
  }

  // Locate the clover row by its image/name rather than by a hard-coded item
  // id, and read the id off its own radio. Returns null when the Hermit isn't
  // offering clovers at all.
  function findCloverOffer(form) {
    const radios = form.querySelectorAll('input[type="radio"][name="whichitem"]');
    for (const radio of radios) {
      const row = radio.closest('tr');
      if (!row) continue;
      const img = row.querySelector('img');
      const src = img ? (img.getAttribute('src') || '') : '';
      const text = row.textContent || '';
      if (!/clover/i.test(src) && !/clover/i.test(text)) continue;
      return {
        id: radio.value,
        radio,
        row,
        // Both signals mean the same thing; either alone is enough.
        soldOut: radio.disabled || /out of stock/i.test(text),
      };
    }
    return null;
  }

  // "You have 10 tradable items" -- the worthless-item pile that pays for the
  // trades. Returns null when the sentence isn't found (then we don't cap).
  function tradableItemCount() {
    const m = (document.body.textContent || '')
      .match(/You have\s+([\d,]+)\s+tradable item/i);
    return m ? parseInt(m[1].replace(/,/g, ''), 10) : null;
  }

  // Trade for a single clover. Resolves true when the response actually
  // handed over an item, false otherwise (out of stock, no worthless items
  // left, rejected request -- all of which mean "stop").
  async function tradeOneClover(itemId, pwd) {
    const params = new URLSearchParams({
      action: 'trade',
      whichitem: itemId,
      quantity: '1',
      for: 'ux-enhancers',
    });
    if (pwd) params.set('pwd', pwd);
    const res = await fetch(ORIGIN + '/hermit.php?' + params.toString(), {
      credentials: 'same-origin', cache: 'no-store',
    });
    if (!res.ok) return false;
    const html = await res.text();
    return /You acquire/i.test(html);
  }

  async function buyAllClovers(btn, status, offer) {
    btn.disabled = true;
    status.textContent = 'Trading...';

    const pwd = await getPwd();
    const tradable = tradableItemCount();
    const cap = tradable === null
      ? HERMIT_MAX_CLOVERS
      : Math.min(HERMIT_MAX_CLOVERS, tradable);

    let bought = 0;
    try {
      while (bought < cap) {
        // Sequential on purpose: each trade spends a worthless item and a unit
        // of the Hermit's stock, so the server has to stay authoritative about
        // whether another one is possible.
        // eslint-disable-next-line no-await-in-loop
        const ok = await tradeOneClover(offer.id, pwd);
        if (!ok) break;
        bought++;
        status.textContent = 'Traded for ' + bought + ' clover' +
          (bought === 1 ? '' : 's') + '...';
      }
    } catch (e) {
      console.error('UX Enhancers: hermit clover trade failed.', e);
      status.textContent = 'Trade failed after ' + bought + ' clover' +
        (bought === 1 ? '' : 's') + ' -- see the console.';
      btn.disabled = false;
      return;
    }

    const msg = bought > 0
      ? 'Bought ' + bought + ' clover' + (bought === 1 ? '' : 's') + '.'
      : 'No clovers bought -- the Hermit had none left, or you have no ' +
        'worthless items to trade.';

    if (bought > 0) {
      // Reload so the page (tradable count, stock flag) is the server's view
      // rather than our stale one; carry the summary across the reload.
      try { sessionStorage.setItem(HERMIT_MSG_KEY, msg); } catch (e) { /* ignore */ }
      location.reload();
    } else {
      status.textContent = msg;
      btn.disabled = false;
    }
  }

  function hermitClovers() {
    if (document.getElementById(HERMIT_BTN_ID)) return; // already injected

    const form = hermitTradeForm();
    if (!form) return;

    const offer = findCloverOffer(form);

    // Sit in the same cell as the Trade button when we can find it, so the new
    // control reads as part of the form; otherwise fall back to after the form.
    const submit = form.querySelector('input[type="submit"]');
    const host = document.createElement('div');
    host.style.cssText = 'margin-top:6px;text-align:center';

    const btn = makeButton(HERMIT_BTN_ID, 'Buy all clovers');
    const status = document.createElement('span');
    status.style.cssText = 'margin-left:8px;font-size:0.9em';
    host.appendChild(btn);
    host.appendChild(status);

    if (!offer) {
      btn.disabled = true;
      btn.title = 'The Hermit is not offering clovers right now.';
    } else if (offer.soldOut) {
      btn.disabled = true;
      btn.title = 'The Hermit is out of clovers for today.';
      status.textContent = 'Out of stock for today.';
    } else {
      btn.title = 'Trade worthless items for every clover the Hermit has left today.';
      btn.addEventListener('click', () => { buyAllClovers(btn, status, offer); });
    }

    const cell = submit ? submit.closest('td') : null;
    if (cell) cell.appendChild(host);
    else form.appendChild(host);

    // Report on the run that just reloaded this page, if there was one.
    try {
      const prev = sessionStorage.getItem(HERMIT_MSG_KEY);
      if (prev) {
        sessionStorage.removeItem(HERMIT_MSG_KEY);
        status.textContent = prev;
      }
    } catch (e) { /* sessionStorage may be unavailable; skip the summary */ }
  }

  // === feature: don't harvest a beer garden too early ====================
  //
  // A Beer Garden's barley and hops scale evenly with growth, but the fancy
  // beer bottles and labels -- the part worth waiting for, since they're the
  // currency in Let's Brew! -- don't appear at all until the second day:
  //
  //   day 1    3 barley,  3 hops, and NO bottle or label
  //   day 2    6 barley,  6 hops, 1 bottle or label
  //   day 3    9 barley,  9 hops, 1 of each
  //   day 4   12 barley, 12 hops, 3 in total
  //   day 5   15 barley, 15 hops, 2 of each
  //   day 6   18 barley, 18 hops, 5 in total
  //   day 7+  21 barley, 21 hops, 3 of each  (no special result past this)
  //
  // Harvesting on day 1 therefore throws the fancy items away for nothing, and
  // the game asks for no confirmation -- one stray click on the crop and it's
  // gone for the day. So we ask instead.
  //
  // UNVERIFIED: the day count is read off the crop artwork, beergarden<N>.gif,
  // taking N for the days of growth -- the wiki lists exactly beergarden0..7
  // and the yield table tops out at "7+", so the mapping is near certain, but
  // it hasn't been checked against a live campground. Everything here FAILS
  // OPEN on purpose: no readable number, no recognisable crop or no harvest
  // link and the feature simply stays out of the way, because a guard that
  // fires on the wrong crop (or blocks a ripe harvest) would be worse than no
  // guard at all.

  const BEER_GARDEN_SRC = /beergarden(\d+)\.gif/i;
  // The first fancy bottle/label lands on day 2. Before that there's nothing to
  // wait for and nothing to lose by harvesting -- which is exactly the mistake.
  const BEER_RIPE_DAYS = 2;
  // The fancy-item column of the wiki's yield table, by day of growth.
  const BEER_FANCY = {
    0: 'nothing at all',
    1: 'no fancy bottle or label',
    2: '1 fancy bottle or label',
    3: '1 fancy bottle and 1 fancy label',
    4: '3 fancy bottles/labels in total',
    5: '2 fancy bottles and 2 fancy labels',
    6: '5 fancy bottles/labels in total',
    7: '3 fancy bottles and 3 fancy labels',
  };

  // What harvesting at `days` of growth hands you. Growth past day 7 yields no
  // more than day 7 does, so it's clamped there.
  function beerYield(days) {
    const d = Math.max(0, Math.min(7, days));
    return { barley: 3 * d, hops: 3 * d, fancy: BEER_FANCY[d] };
  }

  function beerYieldText(days) {
    const y = beerYield(days);
    return y.barley + ' barley, ' + y.hops + ' hops, and ' + y.fancy;
  }

  // The confirm() text for a harvest that's too early. Spells out both what
  // you'd get now and what one more day buys, so the choice is informed rather
  // than just obstructed.
  function unripeMessage(days) {
    const now = days === 0
      ? 'Nothing has grown in it yet'
      : 'It has only ' + days + ' day' + (days === 1 ? '' : 's') +
        ' of growth, so harvesting now gives ' + beerYieldText(days);
    return 'Your beer garden is not ready.\n\n' + now + '.\n\n' +
      'On day ' + BEER_RIPE_DAYS + ' you would get ' + beerYieldText(BEER_RIPE_DAYS) +
      '. The fancy bottles and labels never drop before then.\n\nHarvest anyway?';
  }

  // The crop image and its days of growth, or null when the garden holds some
  // other crop (or none) -- in which case this feature has no opinion.
  function findBeerGarden() {
    for (const img of document.images) {
      const m = (img.getAttribute('src') || '').match(BEER_GARDEN_SRC);
      if (!m) continue;
      const days = Number(m[1]);
      if (!Number.isFinite(days)) continue;
      return { img: img, days: days };
    }
    return null;
  }

  // Whatever a click on the crop actually goes through: normally the anchor
  // wrapping the image, with the garden action link as a fallback.
  function findHarvestTrigger(img) {
    return (img.closest && img.closest('a')) ||
      document.querySelector('a[href*="action=garden"]') || null;
  }

  function beerGardenGuard() {
    const garden = findBeerGarden();
    if (!garden) return;
    if (garden.img.dataset.tmGardenChecked) return; // idempotency guard
    garden.img.dataset.tmGardenChecked = '1';

    // Put the numbers where they can be read without hovering blind. A tooltip
    // on the image works with KoL's markup as-is; a positioned badge would need
    // a wrapper inside the campground's layout (same reasoning as the tile
    // highlighter in quest-helper.js).
    const was = garden.img.getAttribute('title') || '';
    garden.img.setAttribute('title', 'Beer garden, ' + garden.days + ' day' +
      (garden.days === 1 ? '' : 's') + ' of growth — harvesting now gives ' +
      beerYieldText(garden.days) + (was ? ' — ' + was : ''));

    if (garden.days >= BEER_RIPE_DAYS) return; // ripe; nothing to guard

    // Flag it so "not ready" is visible at a glance. Inline styles only: KoL's
    // CSP allows style attributes but blocks script-injected stylesheets.
    garden.img.style.outline = '3px dashed #c00';
    garden.img.style.outlineOffset = '-3px';

    const trigger = findHarvestTrigger(garden.img);
    if (!trigger) return;

    // Capture on the document, so the click is caught on the way DOWN and never
    // reaches the link at all. A listener on the link itself would be too late:
    // at the target, handlers run in registration order, and any inline onclick
    // KoL put there was registered while the page parsed -- before us.
    document.addEventListener('click', function (ev) {
      const hit = ev.target && ev.target.closest ? ev.target.closest('a') : null;
      if (hit !== trigger) return;
      if (trigger.dataset.tmGardenConfirmed === '1') return; // our own retry
      ev.preventDefault();
      ev.stopPropagation();
      if (!window.confirm(unripeMessage(garden.days))) return;
      trigger.dataset.tmGardenConfirmed = '1';
      const href = trigger.getAttribute('href');
      if (href) location.href = href;
      else trigger.click();
    }, true);
  }

  // === feature registry =================================================

  const FEATURES = [
    { name: 'hermit-clovers', path: /\/hermit\.php/i, run: hermitClovers },
    { name: 'beer-garden-guard', path: /\/campground\.php/i, run: beerGardenGuard },
  ];

  function run() {
    for (const feature of FEATURES) {
      if (!feature.path.test(location.pathname)) continue;
      try {
        feature.run();
      } catch (e) {
        console.error('UX Enhancers: feature "' + feature.name + '" failed.', e);
      }
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', run);
  } else {
    run();
  }
})();
