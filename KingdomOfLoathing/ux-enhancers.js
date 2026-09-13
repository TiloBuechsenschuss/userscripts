// ==UserScript==
// @name         KoL UX Enhancers
// @author       Tilo
// @namespace    https://github.com/TiloBuechsenschuss
// @downloadURL  https://raw.githubusercontent.com/TiloBuechsenschuss/userscripts/refs/heads/main/KingdomOfLoathing/ux-enhancers.js
// @version      1.23
// @description  A grab-bag of quality-of-life tweaks for Kingdom of Loathing pages. Currently: in the character pane a "heal" button that casts your heal skills until HP is full or none can raise it further, and a "max" button next to every prolongable buff you can actually cast that re-casts it as many times as your MP allows (measuring the per-cast cost live, so gear and effect discounts are accounted for) with a "refresh skills" button below the list; on the equipment inventory an "Optimize for this" button that equips the highest-value item in every slot for whatever the enchantment-sort dropdown is sorting by (with element / Monster Level / encounter pickers for the sorts that need one), and a Collapse all / Expand all button that flips every inventory category at once; a small "W" badge linking to the KoL wiki next to the last adventure in the charpane, the location name atop place.php and crypt.php, the choice-adventure name atop choice.php, each quest title in questlog.php, the monster name and the items you acquire in combat, and item names in your inventory; a banner before you enter the lair of a special-reward boss (Boss Bat, Bonerdagon, Knob Goblin King, Baron von Ratsworth) when your Monster Aggravation Device is not set to a level that forces the unique reward to drop, shown on the page you see just before committing the adventure because fight.php is already too late; on the autosell page (sellstuff_ugly.php) a toolbar with Quantity / Sell price / Name sort buttons that reorder every category at once (click again to flip the direction, or Name to restore the original order), a Single list toggle that collapses every category into one globally-sorted list, and an Expand all / Collapse all button that keeps KoL's "sellstuff" cookie in sync; at the Hermit (hermit.php) it adds a "Buy all clovers" button next to the Trade button that trades worthless items for every 11-leaf clover the Hermit still has in stock today, one at a time, then reloads and reports how many it got; at the Campground (campground.php) it guards a Beer Garden that hasn't grown for two days yet, since the fancy bottles and labels don't appear before then -- the crop is flagged and clicking it asks for confirmation first; in the Mall (mall.php) it adds a "buy all" action to each store row and a "Buy N" row per item that walks the stores cheapest-first, showing the total and the average cost per item before spending anything; in the Inventory (inventory.php) it adds a [mall] action next to [use] on every tradeable item, searching the Mall for that exact item; in the character pane (charpane.php) it keeps the link to your monster aggravation device on screen even when the dial is at 0, which is exactly when KoL hides it; and in the Daily Dungeon (choice.php) it marks the option that gets you past a door, trap or chest room without spending an adventure -- lockpicks, the Platinum Yendorian Express Card, the eleven-foot pole, the candy cane sword cane, or the Ring of Detect Boring Doors -- with a note on what it costs you; and in the Inventory a "pays out" checkbox beside KoL's own Filter box that hides every item except the ones that hand you other items or Meat when used (gift boxes, buckets, scrolls, wallets), closing the gaps by layout alone -- it writes inline styles and never moves, adds or removes a node, so KoL's own list keeps its order -- matched by item id against a list derived from the wiki and leaving out items that merely turn into a used copy of themselves; with a "group by type" box under it that sorts the survivors into multi-use recipes (a smoked potsherd makes five different things depending on how many you use at once), Meat, random yields and plain items, under a heading each -- also without moving anything, since flex order decides what is drawn where.
// @match        https://www.kingdomofloathing.com/hermit.php*
// @match        https://kingdomofloathing.com/hermit.php*
// @match        https://www.kingdomofloathing.com/campground.php*
// @match        https://kingdomofloathing.com/campground.php*
// @match        https://www.kingdomofloathing.com/mall.php*
// @match        https://kingdomofloathing.com/mall.php*
// @match        https://www.kingdomofloathing.com/inventory.php*
// @match        https://kingdomofloathing.com/inventory.php*
// @match        https://www.kingdomofloathing.com/charpane.php*
// @match        https://kingdomofloathing.com/charpane.php*
// @match        https://www.kingdomofloathing.com/choice.php*
// @match        https://kingdomofloathing.com/choice.php*
// @match        https://www.kingdomofloathing.com/questlog.php*
// @match        https://kingdomofloathing.com/questlog.php*
// @match        https://www.kingdomofloathing.com/fight.php*
// @match        https://kingdomofloathing.com/fight.php*
// @match        https://www.kingdomofloathing.com/place.php*
// @match        https://kingdomofloathing.com/place.php*
// @match        https://www.kingdomofloathing.com/cobbsknob.php*
// @match        https://kingdomofloathing.com/cobbsknob.php*
// @match        https://www.kingdomofloathing.com/crypt.php*
// @match        https://kingdomofloathing.com/crypt.php*
// @match        https://www.kingdomofloathing.com/cellar.php*
// @match        https://kingdomofloathing.com/cellar.php*
// @match        https://www.kingdomofloathing.com/sellstuff_ugly.php*
// @match        https://kingdomofloathing.com/sellstuff_ugly.php*
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

  // === feature: bulk buying in the mall ==================================
  //
  // mall.php's search results give you [buy] (exactly one) and [buy some] (a
  // prompt for a number), both per store. Buying 40 of something means walking
  // the store list by hand, doing arithmetic against each one's stock and daily
  // limit. Two buttons instead:
  //
  //   [buy all]  on a store row -- takes everything that store will sell you.
  //   "Buy N"    at the top of an item -- walks the stores cheapest-first until
  //              N is reached, after showing the total and the average first.
  //
  // The page hands us everything needed. Each store row is
  // `tr#stock_<store>_<item>`, and the "buy some" link's `rel` is already a
  // complete purchase URL ending in `&quantity=` -- pwd and all -- so a
  // purchase is that string with a number stuck on the end. No URL is built
  // here, which is what keeps this working if KoL changes the parameters.
  //
  // Two facts about mall stores drive the arithmetic:
  //   - a store's usable amount is its stock capped by its daily limit ("1 /
  //     day"), not its stock;
  //   - a store whose row has no buy links at all can't be bought from -- that
  //     is how the page renders one whose daily limit you've already used up.
  //
  // MEAT IS SPENT IMMEDIATELY AND CANNOT BE REFUNDED. So: the plan is always
  // shown before the first request, every quantity is checked against the
  // store's own numbers, purchases run strictly one at a time (each one changes
  // what's left), and the loop STOPS the moment a response doesn't confirm an
  // acquisition rather than pressing on. Erring towards buying too little is
  // recoverable; erring the other way is not.

  const MALL_BUYX_CLASS = 'tm-mall-buyx';
  const MALL_ALL_CLASS = 'tm-mall-buyall';
  const MALL_MSG_KEY = 'tm-ux-mall-result';
  // Runaway guard: no single run may touch more stores than this.
  const MALL_MAX_STORES = 40;
  // "buy all" is meant to be one click, so it doesn't nag -- except when the
  // click would spend more than this, where a mis-click is ruinous.
  const MALL_CONFIRM_MEAT = 1000000;

  const meatFmt = (n) => Number(n).toLocaleString('en-US');

  // --- pure helpers (unit-tested) ------------------------------------------

  // KoL pads its table cells with &nbsp;, which lands in textContent as
  // U+00A0. Written as an escape on purpose -- a literal one here would be an
  // invisible character that an editor could quietly normalise away.
  const NBSP = /\u00a0/g;

  // "555,831" -> 555831. Null when there's no number (an empty limit cell).
  function parseCount(text) {
    const m = String(text || '').replace(NBSP, ' ').match(/-?\d[\d,]*/);
    if (!m) return null;
    const n = parseInt(m[0].replace(/,/g, ''), 10);
    return Number.isFinite(n) ? n : null;
  }

  // "1 / day" -> 1. Null when the store has no daily limit.
  function parseLimit(text) {
    const m = String(text || '').replace(NBSP, ' ').match(/(\d[\d,]*)\s*\/\s*day/i);
    return m ? parseInt(m[1].replace(/,/g, ''), 10) : null;
  }

  // The price is carried in the purchase URL as `whichitem=<itemId>.<price>` --
  // the server's own number, so it beats re-parsing the displayed cell.
  function priceFromUrl(url) {
    const m = String(url || '').match(/whichitem=\d+\.(\d+)/);
    return m ? parseInt(m[1], 10) : null;
  }

  // How many this store will actually sell right now.
  function availableFrom(stock, limit) {
    const s = Number.isFinite(stock) ? Math.max(0, stock) : 0;
    if (!Number.isFinite(limit) || limit === null) return s;
    return Math.min(s, Math.max(0, limit));
  }

  // A purchase URL for `qty`. The "buy some" rel already ends in `&quantity=`;
  // the single-buy href has `quantity=1` in the middle of it instead.
  function buyUrlFor(offer, qty) {
    if (offer.someUrl) return offer.someUrl + String(qty);
    if (offer.oneUrl) return offer.oneUrl.replace(/([?&]quantity)=\d+/, '$1=' + qty);
    return null;
  }

  // A rough read of a purchase response. Only ever a FALLBACK, and only when
  // api.php can't be reached: the `ajax=1` responses don't reliably carry the
  // usual "You acquire" wording, which is what made an earlier version of this
  // report a completed purchase as "bought nothing". The inventory delta is the
  // real answer -- see runPlan. Null means "this told me nothing", which is
  // deliberately different from 0 ("it told me nothing was bought").
  function acquiredCount(html) {
    const s = String(html || '');
    const many = s.match(/You acquire[^<]*?<b>\s*([\d,]+)\s*<\/b>/i) ||
      s.match(/You acquire\s+([\d,]+)\s+items?/i) ||
      s.match(/You bought\s+([\d,]+)/i);
    if (many) return parseInt(many[1].replace(/,/g, ''), 10) || 0;
    if (/You acquire an item|You bought/i.test(s)) return 1;
    if (/didn't have enough|don't have enough|not enough Meat|no longer/i.test(s)) return 0;
    return null; // unrecognised -- says nothing either way
  }

  // Cheapest-first allocation across stores. `offers` is [{ price, available,
  // storeName, ... }]; returns the stores to hit, in order, and the totals.
  // `short` is how many of `want` the listed stores can't cover.
  function planPurchase(offers, want) {
    const target = Math.max(0, Math.floor(Number(want) || 0));
    const usable = offers
      .filter((o) => o.available > 0 && Number.isFinite(o.price))
      // Stable sort by price: the page's own order breaks ties.
      .map((o, i) => ({ o: o, i: i }))
      .sort((a, b) => (a.o.price - b.o.price) || (a.i - b.i))
      .map((x) => x.o);

    const steps = [];
    let qty = 0;
    let cost = 0;
    for (const offer of usable) {
      if (qty >= target || steps.length >= MALL_MAX_STORES) break;
      const take = Math.min(offer.available, target - qty);
      if (take <= 0) continue;
      steps.push({ offer: offer, qty: take, cost: take * offer.price });
      qty += take;
      cost += take * offer.price;
    }
    return {
      steps: steps,
      qty: qty,
      cost: cost,
      // Average over what would actually be bought, not over what was asked
      // for -- a short plan's average must still describe the real spend.
      avg: qty > 0 ? cost / qty : 0,
      short: Math.max(0, target - qty),
      limited: steps.some((s) => s.offer.limit !== null && s.offer.limit !== undefined),
    };
  }

  // The confirm() text: what's about to be spent, before anything is spent.
  function describePlan(plan, itemName, meat) {
    if (!plan.qty) {
      return 'Nothing to buy: none of the stores listed for ' + itemName +
        ' can sell you any right now.';
    }
    const lines = ['Buy ' + meatFmt(plan.qty) + ' × ' + itemName + '?', ''];
    plan.steps.forEach((s) => {
      lines.push('  ' + meatFmt(s.qty) + ' @ ' + meatFmt(s.offer.price) +
        ' = ' + meatFmt(s.cost) + '  (' + s.offer.storeName + ')');
    });
    lines.push('');
    lines.push('Total:   ' + meatFmt(plan.cost) + ' Meat for ' +
      meatFmt(plan.qty) + ' item' + (plan.qty === 1 ? '' : 's') +
      ' from ' + plan.steps.length + ' store' + (plan.steps.length === 1 ? '' : 's'));
    lines.push('Average: ' + meatFmt(Math.round(plan.avg)) + ' Meat each');
    if (Number.isFinite(meat)) {
      lines.push('You have ' + meatFmt(meat) + ' Meat.');
      if (plan.cost > meat) {
        lines.push('');
        lines.push('WARNING: that is ' + meatFmt(plan.cost - meat) +
          ' Meat more than you have. The run will stop when the Meat does.');
      }
    }
    if (plan.short) {
      lines.push('');
      lines.push('NOTE: ' + meatFmt(plan.short) + ' short of what you asked for — ' +
        'the stores listed don\'t have any more.');
    }
    if (plan.limited) {
      lines.push('');
      lines.push('NOTE: some of these have daily limits. The page can\'t say how ' +
        'much of today\'s limit you\'ve already used, so the run may come up short.');
    }
    lines.push('');
    lines.push('Meat is spent immediately and cannot be refunded. Continue?');
    return lines.join('\n');
  }

  // --- reading the page ----------------------------------------------------

  // One store's offer, or null if it can't be bought from. A row with no buy
  // links at all is how the page shows a store whose daily limit is used up.
  function parseOfferRow(tr) {
    const id = (tr.getAttribute('id') || '').match(/^stock_(\d+)_(\d+)$/);
    if (!id) return null;
    const some = tr.querySelector('a.buysome');
    const one = tr.querySelector('a.buyone');
    const someUrl = some ? some.getAttribute('rel') : null;
    const oneUrl = one ? one.getAttribute('href') : null;
    if (!someUrl && !oneUrl) return null;

    const price = priceFromUrl(someUrl || oneUrl);
    if (!Number.isFinite(price)) return null;

    const stockCell = tr.querySelector('td.stock');
    const stock = stockCell ? parseCount(stockCell.textContent) : null;
    // The limit cell is the one column with no class of its own, so it has to
    // be found by its content. Skip the cells that DO have a class first: a
    // store called "5 / day deals" sits before it in the row and would
    // otherwise shadow the real limit -- and reading a limit that isn't there
    // silently caps every purchase from that store.
    let limit = null;
    for (const td of tr.querySelectorAll('td')) {
      if (td.classList && (td.classList.contains('store') ||
        td.classList.contains('price') || td.classList.contains('stock') ||
        td.classList.contains('buyers'))) continue;
      const l = parseLimit(td.textContent);
      if (l !== null) { limit = l; break; }
    }
    const storeLink = tr.querySelector('td.store a');

    return {
      row: tr,
      store: id[1],
      itemId: id[2],
      storeName: storeLink ? (storeLink.textContent || '').trim() : 'store ' + id[1],
      price: price,
      stock: Number.isFinite(stock) ? stock : 0,
      limit: limit,
      available: availableFrom(stock, limit),
      someUrl: someUrl,
      oneUrl: oneUrl,
      buyers: tr.querySelector('td.buyers'),
    };
  }

  function parseItemTable(table) {
    const head = table.querySelector('tr[id^="item_"]');
    const idm = head ? (head.getAttribute('id') || '').match(/^item_(\d+)$/) : null;
    const nameEl = head ? head.querySelector('b a, b') : null;
    const offers = [];
    for (const tr of table.querySelectorAll('tr[id^="stock_"]')) {
      const offer = parseOfferRow(tr);
      if (offer) offers.push(offer);
    }
    if (!offers.length) return null;
    return {
      table: table,
      itemId: idm ? idm[1] : offers[0].itemId,
      name: nameEl ? (nameEl.textContent || '').trim() : 'this item',
      offers: offers,
      firstStockRow: table.querySelector('tr[id^="stock_"]'),
    };
  }

  // --- buying --------------------------------------------------------------

  // One purchase. Resolves with what the response claimed -- a number, or null
  // for "couldn't tell". Never used on its own; runPlan measures instead.
  async function buyFrom(offer, qty) {
    const url = buyUrlFor(offer, qty);
    if (!url) return 0;
    const res = await fetch(ORIGIN + '/' + url.replace(/^\//, ''), {
      credentials: 'same-origin', cache: 'no-store',
    });
    if (!res.ok) return 0;
    return acquiredCount(await res.text());
  }

  // Run a plan, one store at a time. Sequential on purpose: each purchase
  // changes stock and Meat, so the server stays authoritative about whether the
  // next one is possible.
  //
  // What was bought is MEASURED from the inventory, not read out of the
  // purchase response. That's the whole point: the `ajax=1` response format
  // isn't something this script can verify, and a run that reads it wrong
  // either reports a completed purchase as "bought nothing" (the bug this
  // replaced) or, far worse, keeps buying because it thinks nothing happened.
  // api.php's inventory count and Meat are the same numbers the game uses.
  //
  // Returns { bought, spent, claimed } where bought/spent are null when the
  // measurement wasn't available -- callers must NOT read null as zero.
  async function runPlan(plan, itemId, say) {
    const startCount = await apiItemCount(itemId);
    const startMeat = await apiMeat();
    let lastCount = startCount;
    let claimed = 0;

    for (const step of plan.steps) {
      say('Buying ' + meatFmt(step.qty) + ' from ' + step.offer.storeName + '...');
      // eslint-disable-next-line no-await-in-loop
      const said = await buyFrom(step.offer, step.qty);
      if (Number.isFinite(said)) claimed += said;

      if (lastCount === null) {
        // No inventory to measure against. Fall back to the response, and stop
        // unless it positively confirmed the whole step -- when we can't see
        // what's happening, stopping early is the only safe direction.
        if (said === null || said < step.qty) break;
        continue;
      }

      // eslint-disable-next-line no-await-in-loop
      const now = await apiItemCount(itemId);
      if (now === null) { lastCount = null; continue; }
      const gained = now - lastCount;
      lastCount = now;
      // Short means out of stock, out of Meat, or the store refused. Stop.
      if (gained < step.qty) break;
    }

    const endCount = await apiItemCount(itemId);
    const endMeat = await apiMeat();
    return {
      bought: (startCount !== null && endCount !== null)
        ? Math.max(0, endCount - startCount) : null,
      spent: (startMeat !== null && endMeat !== null)
        ? Math.max(0, startMeat - endMeat) : null,
      claimed: claimed,
    };
  }

  // The post-run report. It must never assert something it didn't measure --
  // telling someone "your Meat is untouched" when the Meat is in fact gone is
  // worse than admitting the script couldn't tell.
  function purchaseSummary(res, wanted) {
    if (res.bought === null) {
      return res.claimed > 0
        ? 'Bought at least ' + meatFmt(res.claimed) + ', but your inventory ' +
          'couldn\'t be read to confirm the total — check it before buying more.'
        : 'Couldn\'t confirm the result: api.php didn\'t answer. Purchases may ' +
          'still have gone through — check your inventory and Meat before retrying.';
    }
    if (!res.bought) {
      return res.spent
        ? 'No items arrived, but ' + meatFmt(res.spent) + ' Meat left your ' +
          'account — check your inventory.'
        : 'Nothing was bought, and no Meat was spent.';
    }
    let msg = 'Bought ' + meatFmt(res.bought);
    if (res.spent) {
      msg += ' for ' + meatFmt(res.spent) + ' Meat — ' +
        meatFmt(Math.round(res.spent / res.bought)) + ' Meat each on average';
    }
    msg += '.';
    if (Number.isFinite(wanted) && res.bought < wanted) {
      msg += ' (' + meatFmt(wanted - res.bought) + ' short of the ' +
        meatFmt(wanted) + ' asked for; a store ran out, or the Meat did.)';
    }
    return msg;
  }

  // Finish a run: stash the summary, then reload so stock, limits and Meat are
  // the server's view rather than our stale one.
  function finishRun(itemId, msg) {
    try {
      sessionStorage.setItem(MALL_MSG_KEY, JSON.stringify({ itemId: itemId, msg: msg }));
    } catch (e) { /* ignore; we just lose the summary */ }
    location.reload();
  }

  // api.php is the game's own view of your character, and the only thing here
  // that doesn't depend on parsing a page. Null on any failure, never a guess:
  // every caller distinguishes "couldn't tell" from a real number.
  async function apiJson(what) {
    try {
      const res = await fetch(
        ORIGIN + '/api.php?what=' + what + '&for=ux-enhancers',
        { credentials: 'same-origin', cache: 'no-store' });
      if (!res.ok) return null;
      return await res.json();
    } catch (e) {
      return null;
    }
  }

  // The player's Meat, for the "can you even afford this" line and for
  // measuring what a run actually spent.
  async function apiMeat() {
    const j = await apiJson('status');
    if (!j) return null;
    const n = parseInt(String(j.meat !== undefined ? j.meat : j.Meat)
      .replace(/,/g, ''), 10);
    return Number.isFinite(n) ? n : null;
  }

  // How many of one item you're holding. `what=inventory` answers with an
  // object of itemId -> count; an item you have none of is simply absent, which
  // is a real 0 rather than a failure.
  async function apiItemCount(itemId) {
    const j = await apiJson('inventory');
    if (!j || typeof j !== 'object') return null;
    const raw = j[String(itemId)];
    if (raw === undefined) return 0;
    const n = parseInt(String(raw).replace(/,/g, ''), 10);
    return Number.isFinite(n) ? n : null;
  }

  // --- the UI --------------------------------------------------------------

  // A bracketed link, so the new control reads as one of the page's own
  // [buy] [buy some] actions rather than something bolted on.
  function mallLink(cls, label, title, onClick) {
    const wrap = document.createElement('span');
    wrap.className = cls;
    wrap.appendChild(document.createTextNode('\u00a0['));
    const a = document.createElement('a');
    a.href = '#';
    a.textContent = label;
    a.title = title;
    a.addEventListener('click', (ev) => { ev.preventDefault(); onClick(a); });
    wrap.appendChild(a);
    wrap.appendChild(document.createTextNode(']'));
    return wrap;
  }

  function addBuyAll(item, offer) {
    if (!offer.buyers || offer.buyers.querySelector('.' + MALL_ALL_CLASS)) return;
    if (offer.available <= 0) return;
    const total = offer.available * offer.price;
    const label = 'buy\u00a0all\u00a0' + meatFmt(offer.available);
    const title = meatFmt(offer.available) + ' × ' + meatFmt(offer.price) +
      ' = ' + meatFmt(total) + ' Meat' +
      (offer.limit !== null ? ' (this store\'s limit is ' + meatFmt(offer.limit) +
        '/day, so that\'s the cap rather than its ' + meatFmt(offer.stock) + ' stock)' : '');

    offer.buyers.appendChild(mallLink(MALL_ALL_CLASS, label, title, async (a) => {
      // Deliberately no prompt for an ordinary buy-all: the quantity and the
      // total are already on the button and in its tooltip, so the click is
      // informed. Above MALL_CONFIRM_MEAT it asks anyway, because a mis-click
      // there is not something you can undo.
      if (total > MALL_CONFIRM_MEAT &&
        !window.confirm('That is ' + meatFmt(total) + ' Meat for ' +
          meatFmt(offer.available) + ' × ' + item.name + ' from ' +
          offer.storeName + '.\n\nMeat is spent immediately and cannot be ' +
          'refunded. Continue?')) return;

      a.textContent = 'buying...';
      const plan = planPurchase([offer], offer.available);
      const res = await runPlan(plan, item.itemId, () => {});
      finishRun(item.itemId, purchaseSummary(res, offer.available));
    }));
  }

  function addBuyX(item) {
    if (!item.firstStockRow || item.table.querySelector('.' + MALL_BUYX_CLASS)) return;

    const tr = document.createElement('tr');
    tr.className = MALL_BUYX_CLASS;
    const td = document.createElement('td');
    td.colSpan = 8;
    td.style.cssText = 'padding:4px 0 4px 30px;font-size:0.9em';

    const total = item.offers.reduce((n, o) => n + o.available, 0);
    td.appendChild(document.createTextNode('Buy '));

    const input = document.createElement('input');
    input.type = 'text';
    input.className = 'text';
    input.size = 5;
    input.value = '';
    input.placeholder = String(Math.min(total, 100));
    input.title = meatFmt(total) + ' available in total across ' +
      item.offers.length + ' store(s).';
    td.appendChild(input);

    td.appendChild(document.createTextNode(' × ' + item.name +
      ', cheapest stores first '));

    const status = document.createElement('span');
    status.style.cssText = 'margin-left:8px';

    const go = async (a) => {
      const want = parseCount(input.value);
      if (!want || want < 1) {
        status.textContent = 'Enter how many you want first.';
        input.focus();
        return;
      }
      const plan = planPurchase(item.offers, want);
      if (!plan.qty) {
        status.textContent = 'None of these stores can sell you any right now.';
        return;
      }
      status.textContent = 'Checking your Meat...';
      const meat = await apiMeat();
      if (!window.confirm(describePlan(plan, item.name, meat))) {
        status.textContent = 'Cancelled — nothing was bought.';
        return;
      }
      a.textContent = 'buying...';
      const res = await runPlan(plan, item.itemId, (m) => { status.textContent = m; });
      finishRun(item.itemId, purchaseSummary(res, want));
    };

    td.appendChild(mallLink('', 'buy\u00a0these', 'Work out the cheapest stores ' +
      'to buy from, show the total and the average, then buy after you confirm.', go));
    td.appendChild(status);
    tr.appendChild(td);
    item.firstStockRow.parentNode.insertBefore(tr, item.firstStockRow);

    // Report on the run that just reloaded this page, if it was for this item.
    try {
      const raw = sessionStorage.getItem(MALL_MSG_KEY);
      if (raw) {
        const prev = JSON.parse(raw);
        if (prev && prev.itemId === item.itemId) {
          sessionStorage.removeItem(MALL_MSG_KEY);
          status.textContent = prev.msg;
          status.style.fontWeight = 'bold';
        }
      }
    } catch (e) { /* sessionStorage unavailable or junk; skip the summary */ }
  }

  function mallBulkBuy() {
    for (const table of document.querySelectorAll('table.itemtable')) {
      const item = parseItemTable(table);
      if (!item) continue;
      addBuyX(item);
      item.offers.forEach((offer) => { addBuyAll(item, offer); });
    }
  }

  // === feature: a [mall] action on every inventory item ==================
  //
  // inventory.php gives each item a row of bracketed actions -- [use], [use
  // multiple], [discard], [assemble] -- but nothing that answers "what does
  // this go for?". So add a [mall] in the same style, searching the Mall for
  // that exact item.
  //
  // Each item is:
  //   <table class="item" id="icNNNN" rel="id=NNNN&s=0&q=0&d=0&g=0&t=1&n=10&...">
  //     <td class="img">...</td>
  //     <td id="iNNNN"><b class="ircm">NAME</b>&nbsp;<span>(10)</span>
  //       <font size=1><br><a href="inv_use.php?...">[use]</a>&nbsp;</font></td>
  //   </table>
  // so the actions live in that <font size=1>, and the flags live in `rel`.
  // `t` is the tradeable flag -- the same one the page's own right-click menu
  // gates "Stock in Mall" on -- and an untradeable item is never in the Mall,
  // so those get no link at all rather than one that always comes back empty.
  // An item whose `rel` doesn't parse still gets the link: a search that finds
  // nothing costs nothing, whereas a silently missing link looks like a bug.
  //
  // The search term is the item's name IN QUOTES. KoL's item matcher treats a
  // quoted string as an exact name and anything else as a substring, so an
  // unquoted "poppy" would also drag in every other item with poppy in its
  // name. The name is used exactly as rendered, which is also what the search
  // wants: KoL's own name for "Newbiesport&trade; tent" matches on the ™.

  const INV_MALL_FLAG = 'tmMallLink';

  // --- pure helpers (unit-tested) ------------------------------------------

  // "id=10881&s=0&q=0&t=1" -> { id: '10881', s: '0', q: '0', t: '1' }
  function parseItemRel(rel) {
    const out = {};
    String(rel || '').split('&').forEach((pair) => {
      const eq = pair.indexOf('=');
      if (eq > 0) out[pair.slice(0, eq)] = pair.slice(eq + 1);
    });
    return out;
  }

  // Only `t=0` is a definite "not tradeable"; anything unreadable errs towards
  // showing the link.
  function itemIsTradeable(rel) {
    return rel.t !== '0';
  }

  function mallSearchUrl(name) {
    // Drop any quote the name carries of its own, so nothing can break out of
    // the exact-match quoting.
    const exact = '"' + String(name).replace(/"/g, '') + '"';
    return 'mall.php?justitems=0&pudnuggler=' + encodeURIComponent(exact);
  }

  // --- the link ------------------------------------------------------------

  function addMallLink(table) {
    if (table.dataset && table.dataset[INV_MALL_FLAG]) return; // idempotency guard
    const nameEl = table.querySelector('b.ircm') || table.querySelector('b');
    const name = nameEl && (nameEl.textContent || '').trim();
    if (!name) return;
    if (table.dataset) table.dataset[INV_MALL_FLAG] = '1';

    if (!itemIsTradeable(parseItemRel(table.getAttribute('rel')))) return;

    // The actions row. KoL emits it even for an item with no actions (just the
    // <br>), but fall back to the name's own cell if one ever renders without.
    const host = table.querySelector('font[size="1"]') || nameEl.parentNode;
    if (!host) return;

    const a = document.createElement('a');
    a.href = mallSearchUrl(name);
    a.textContent = '[mall]';
    a.title = 'Search the Mall for ' + name;
    host.appendChild(a);
    host.appendChild(document.createTextNode(' '));
  }

  // inventory.php builds itself in stages: a collapsed section only fetches
  // its items the first time it's opened, and using or buying something
  // splices the changed item back in by AJAX. A single pass would miss all of
  // that, so re-run on DOM changes -- debounced, and a no-op for items already
  // flagged, which is also what stops our own inserts from looping.
  function watchInventory(pass) {
    if (window.__tmInvMallWatch) return; // one observer only
    if (typeof MutationObserver !== 'function' || !document.body) return;
    window.__tmInvMallWatch = true;
    let pending = null;
    new MutationObserver(() => {
      if (pending) return;
      pending = setTimeout(() => { pending = null; pass(); }, 150);
    }).observe(document.body, { childList: true, subtree: true });
  }

  function inventoryMallLinks() {
    const pass = () => {
      for (const table of document.querySelectorAll('table.item')) addMallLink(table);
    };
    pass();
    watchInventory(pass);
  }

  // === feature: filter the inventory to items that pay out ===============
  //
  // Plenty of KoL items are really containers: use a Mer-kin foodbucket and it
  // hands you sea broccoli, a gift box hands you what's inside, a scroll hands
  // you clovers, an old leather wallet hands you 400-600 Meat. There is no way
  // to see those at a glance -- KoL's own Filter box searches names, and
  // "bucket" is not a category. So: a checkbox next to that filter that hides
  // everything except the items which pay out.
  //
  // What counts as paying out is data, not a heuristic. data/kol-use-yields-items.tsv
  // is derived from the {{acquire}} and {{meat}} templates in the "When Used"
  // section of every article in the wiki's Category:Usable Items; the id list
  // below is that file minus its self_transform=all rows, because a book that
  // turns into "<book> (used)" is not a way to get anything -- but a row that
  // pays Meat is kept whatever its items do. Meat an item COSTS you
  // ({{meat|type=lose}}) is not a payout and is not counted. Regenerate both with:
  //
  //   node scripts/fetch-kol-item-yields.mjs              # refresh the data file
  //   node scripts/fetch-kol-item-yields.mjs --print-ids  # re-emit the list below
  //
  // Matching is by ITEM ID, read from the item table's own `rel` (the same
  // attribute the [mall] link above reads), never by name: the wiki writes
  // "jaba&ntilde;ero-flavored chewing gum" where the page renders the ñ, and
  // trademark signs, quotes and parenthetical suffixes all differ in their own
  // ways. Ids don't.
  //
  // The filter only sees items that are ON THE PAGE. A collapsed category has
  // not fetched its items yet, which is the same limitation KoL's own in-page
  // filter carries ("Searching page, hit Enter to seach all sections") -- hence
  // the note beside the checkbox rather than an attempt to expand everything,
  // which would fire a request per category.
  //
  // Nothing here moves, adds or removes a node. The filter writes inline styles
  // and nothing else, so KoL's markup and its ORDER stay exactly as the game
  // rendered them -- see the note above setPacking for what happened when this
  // did rearrange the grid.

  const YIELD_ONLY_ID = 'tm-inv-yield-only';
  const YIELD_STATE_KEY = 'tm-inv-yield-only';
  const YIELD_GROUP_ID = 'tm-inv-yield-group';
  const YIELD_GROUP_KEY = 'tm-inv-yield-group';

  // The groups the filter sorts by, in the order they are shown, with the heading
  // each one gets. "multiuse" comes first because how many to use at once is the
  // question you open the inventory with; an item that is both multi-use and a Meat
  // payout is filed there.
  const YIELD_GROUPS = [
    { key: 'multiuse', label: 'Multi-use recipes' },
    { key: 'meat', label: 'Meat' },
    { key: 'random', label: 'Random yield' },
    { key: 'items', label: 'Items' },
  ];

  // Item ids whose "When Used" hands you a different item or Meat, by group.
  // Generated by scripts/fetch-kol-item-yields.mjs --print-classes -- don't hand-edit.
  const YIELD_CLASSES = {
    multiuse: [
      433, 2110, 2581, 2582, 2605, 2634, 2697, 2988, 3367, 3403, 3473, 3919, 4044, 4151,
      4254, 4457, 4469, 4489, 4680, 4856, 5048, 5144, 5395, 5703, 5725, 5789, 5864, 5881,
      6306, 6766, 6914, 6927, 6937, 6947, 7120, 7359, 7478, 7523, 7707, 8423, 8524, 8900,
      9190, 9333, 9992, 10259, 10475, 11654,
    ],
    meat: [
      26, 84, 85, 184, 546, 548, 552, 604, 621, 636, 678, 1917, 1918, 2057, 2599, 2612,
      2698, 2864, 3034, 3571, 3735, 4585, 4593, 4731, 5052, 5294, 5297, 5644, 5745, 5788,
      6141, 7060, 7188, 8084, 8088, 8211, 8299, 8446, 8691, 8767, 9484, 9563, 9926, 10368,
      11003, 11281, 11951, 12183,
    ],
    random: [
      400, 401, 504, 533, 553, 643, 707, 818, 831, 832, 873, 874, 1134, 1161, 1183, 1267,
      1398, 1429, 1433, 1434, 1789, 1798, 2058, 2372, 2511, 2512, 2592, 3016, 3017, 3018,
      3067, 3290, 3427, 3574, 3593, 3596, 3671, 3676, 3811, 3949, 4189, 4211, 4217, 4348,
      4431, 4488, 4604, 4756, 4891, 5077, 5285, 5286, 5287, 5502, 5504, 6151, 6266, 6312,
      6726, 6727, 6728, 7579, 11418, 11433, 11537, 11647,
    ],
    items: [
      23, 24, 138, 146, 159, 188, 196, 301, 407, 411, 413, 485, 500, 516, 527, 598, 601,
      637, 644, 647, 667, 780, 939, 941, 951, 1155, 1332, 1333, 1338, 1339, 1347, 1359,
      1423, 1529, 1605, 1631, 1767, 1768, 1786, 1799, 1957, 1995, 1998, 2213, 2220, 2224,
      2225, 2226, 2310, 2311, 2312, 2313, 2314, 2315, 2449, 2536, 2957, 2959, 2972, 2974,
      2975, 2980, 2982, 2983, 2984, 2985, 2986, 2987, 3021, 3022, 3023, 3075, 3113, 3114,
      3115, 3124, 3157, 3167, 3264, 3321, 3336, 3445, 3602, 3612, 3641, 3665, 3739, 3781,
      3883, 3914, 3916, 3917, 3932, 3946, 3988, 4091, 4092, 4093, 4094, 4114, 4122, 4153,
      4155, 4184, 4250, 4275, 4410, 4411, 4449, 4559, 4597, 4599, 4612, 4657, 4712, 4759,
      4761, 4810, 4855, 4857, 4864, 4865, 4874, 4875, 4882, 4883, 4885, 4887, 4890, 4892,
      4930, 4966, 4987, 5008, 5022, 5045, 5046, 5113, 5183, 5184, 5185, 5186, 5187, 5288,
      5301, 5403, 5454, 5455, 5456, 5473, 5474, 5475, 5491, 5492, 5493, 5505, 5553, 5646,
      5663, 5664, 5699, 5732, 5733, 5790, 5876, 5879, 5930, 5972, 5974, 5976, 6051, 6056,
      6078, 6082, 6109, 6110, 6156, 6237, 6249, 6296, 6313, 6329, 6330, 6331, 6363, 6548,
      6549, 6550, 6596, 6597, 6677, 6694, 6723, 6750, 6756, 6845, 6851, 6876, 6877, 6878,
      6879, 6880, 6886, 6887, 6888, 6889, 6971, 6972, 7034, 7056, 7059, 7069, 7228, 7251,
      7259, 7271, 7278, 7382, 7515, 7544, 7723, 7729, 7731, 7737, 7738, 7790, 7806, 7936,
      7959, 8077, 8184, 8279, 8381, 8394, 8443, 8444, 8445, 8457, 8568, 8569, 8570, 8571,
      8572, 8573, 8574, 8575, 8576, 8577, 8693, 8764, 9025, 9026, 9073, 9081, 9103, 9183,
      9189, 9215, 9264, 9313, 9492, 9503, 9507, 9572, 9591, 9689, 9739, 9740, 9741, 9742,
      9759, 9827, 9912, 9914, 9920, 9927, 9945, 9946, 9988, 10057, 10062, 10165, 10217,
      10241, 10245, 10250, 10256, 10257, 10260, 10261, 10271, 10281, 10312, 10314, 10332,
      10334, 10382, 10392, 10431, 10433, 10437, 10476, 10481, 10483, 10484, 10485, 10486,
      10487, 10488, 10490, 10493, 10495, 10496, 10532, 10573, 10581, 10582, 10623, 10624,
      10625, 10626, 10627, 10628, 10629, 10630, 10631, 10632, 10633, 10634, 10635, 10646,
      10648, 10652, 10729, 10731, 10733, 10737, 10748, 10760, 10796, 10803, 10814, 10870,
      10878, 10879, 10882, 10884, 10890, 10892, 10898, 10901, 10919, 10928, 10931, 10951,
      10953, 11044, 11049, 11061, 11082, 11083, 11099, 11110, 11115, 11168, 11187, 11197,
      11213, 11219, 11222, 11253, 11256, 11259, 11264, 11305, 11346, 11364, 11376, 11386,
      11390, 11394, 11412, 11413, 11482, 11485, 11489, 11545, 11560, 11564, 11571, 11608,
      11629, 11636, 11639, 11641, 11657, 11686, 11695, 11741, 11767, 11771, 11782, 11807,
      11836, 11860, 11861, 11868, 11883, 11904, 11918, 11932, 11941, 11974, 11986, 12047,
      12066, 12125, 12133, 12164, 12176, 12180, 12185, 12191, 12192, 12196, 12215, 12222,
      12258, 12269, 12276, 12308,
    ],
  };

  // id -> index into YIELD_GROUPS, built once.
  const YIELD_GROUP_OF = new Map();
  YIELD_GROUPS.forEach(function (group, index) {
    (YIELD_CLASSES[group.key] || []).forEach(function (id) { YIELD_GROUP_OF.set(id, index); });
  });

  const ITEM_SELECTOR = 'table.item[id^="ic"]';

  // Which group an item belongs to, or -1 for one that pays nothing (and for one
  // we cannot identify -- showsWhenFiltered decides what happens to those, and
  // an unplaceable item is simply not grouped).
  function groupOfItem(rel) {
    const id = Number(parseItemRel(rel).id);
    if (!Number.isInteger(id)) return -1;
    const index = YIELD_GROUP_OF.get(id);
    return index === undefined ? -1 : index;
  }

  function isYieldItem(rel) {
    return groupOfItem(rel) !== -1;
  }

  // Whether an item survives the filter. Note this is NOT isYieldItem: an item
  // whose `rel` carries no readable id is SHOWN, not hidden. Hiding is a claim
  // ("this one pays nothing") and an unreadable id supports no claim at all --
  // the same way the [mall] link above only suppresses itself on a positive
  // `t=0`. It matters because KoL splices its own markup into the page when you
  // use something, and markup we can't read must never cost you sight of your
  // inventory: the worst a wrongly-shown item does is take up a slot.
  function showsWhenFiltered(rel) {
    const id = parseItemRel(rel).id;
    if (!id || !Number.isInteger(Number(id))) return true;
    return isYieldItem(rel);
  }

  // Does this mutation record add or remove an inventory item? Only those can
  // change what the filter should be showing; every other change to the page --
  // above all the description popup KoL adds and removes as the pointer crosses
  // an item -- is noise as far as this feature is concerned.
  function touchesAnItem(record) {
    const lists = [record.addedNodes, record.removedNodes];
    for (let l = 0; l < lists.length; l++) {
      const list = lists[l] || [];
      for (let i = 0; i < list.length; i++) {
        const node = list[i];
        if (!node || node.nodeType !== 1) continue; // text nodes and the like
        if (node.matches && node.matches(ITEM_SELECTOR)) return true;
        // The item may be wrapped -- a whole category's worth of markup arrives
        // in one node when a collapsed section is opened.
        if (node.querySelector && node.querySelector(ITEM_SELECTOR)) return true;
      }
    }
    return false;
  }

  // Where an item sits in the page's layout. KoL floats the item tables inside
  // a category's <div class="collapse">, in which case hiding the table is
  // enough. The other rendering puts each item alone in a <td> of a grid, and
  // there the CELL is the thing to hide -- hiding only the table inside it would
  // leave an empty cell holding its column open.
  function placementNode(item) {
    const parent = item.parentElement;
    const cell = parent && parent.closest ? parent.closest('td') : null;
    if (cell && cell.querySelectorAll(ITEM_SELECTOR).length === 1) return cell;
    return item;
  }

  // Packing the survivors together is done with LAYOUT, never by moving nodes.
  //
  // The first version of this repacked the grid by moving cells between rows,
  // and every bug this feature has had came out of that: moving a node is a DOM
  // mutation, so the observer woke and repacked again, and the grid twitched
  // under the mouse; a row KoL had meanwhile rebuilt was no longer in the page,
  // so the survivors went into it and the category vanished; and, worst, the
  // moves left the DOM holding the payers first and the hidden items behind
  // them, so KoL's own re-render after using something replayed OUR order and
  // the inventory stopped being alphabetical for good.
  //
  // The page's markup is KoL's, and it stays KoL's. All this does is hide cells
  // and turn each category's grid into a wrapping flex line for as long as the
  // filter is on: `display: contents` makes every <tr> hand its cells straight
  // to that line, the hidden ones take no space, and the rest close up in their
  // original order. Unticking the box clears the inline styles and the page is
  // bit-for-bit what KoL rendered.
  //
  // Confirmed against the live inventory.php: the packing renders correctly,
  // using an item while the filter is on no longer disturbs the list, and the
  // grouping below draws its headings where it should.
  // The gap is row then column. KoL's grid puts the item tables flush against
  // each other, which reads as one dense block once a filter has thinned it out
  // and the remaining items no longer line up in columns -- so the flex line
  // spaces them itself. `gap` needs no capability check: a browser that doesn't
  // know it ignores the declaration and the layout is merely tight, which is
  // where it started.
  const GRID_STYLE = { table: 'block', tbody: 'flex', row: 'contents', gap: '10px 14px' };

  // display:contents shipped everywhere current, but a browser without it would
  // silently drop the cells out of the layout -- much worse than not packing.
  function canPack() {
    return typeof CSS === 'object' && CSS && typeof CSS.supports === 'function' &&
      CSS.supports('display', 'contents');
  }

  // The <tr> containers, and the <tbody>/<table> above them. Only rows that
  // actually hold item cells count, so the category header's own rows are left
  // out of it.
  function gridPartsFor(cells) {
    const rows = [];
    cells.forEach(function (c) {
      const row = c.grid ? c.node.parentNode : null;
      if (row && rows.indexOf(row) === -1) rows.push(row);
    });
    const bodies = [];
    rows.forEach(function (row) {
      const body = row.parentNode;
      if (body && bodies.indexOf(body) === -1) bodies.push(body);
    });
    return { rows: rows, bodies: bodies };
  }

  function setPacking(cells, on) {
    const parts = gridPartsFor(cells);
    if (!parts.rows.length) return; // floated layout: hiding alone packs it
    const pack = on && canPack();
    parts.rows.forEach(function (row) {
      row.style.display = pack ? GRID_STYLE.row : '';
    });
    parts.bodies.forEach(function (body) {
      body.style.display = pack ? GRID_STYLE.tbody : '';
      body.style.flexWrap = pack ? 'wrap' : '';
      body.style.gap = pack ? GRID_STYLE.gap : '';
      const table = body.parentNode;
      // A <tbody> that is a flex container inside a table box would be wrapped
      // in an anonymous table box and the flex would never take, so the table
      // has to stop being one too.
      if (table && table.style) table.style.display = pack ? GRID_STYLE.table : '';
    });
  }

  // Grouping rides on the same flex line the packing creates, so it too moves
  // nothing: a cell's group is a `order` away, and flex draws items in order
  // order regardless of where they sit in the markup. Each group's heading is a
  // row of OUR OWN (never one of KoL's, and never anywhere but the end of the
  // body) whose flex-basis of 100% makes it take a whole line to itself, so the
  // groups end up stacked with a title over each.
  //
  //   order 0  Multi-use recipes   <- heading, full width
  //   order 1  potsherd, balloon, frond
  //   order 2  Meat
  //   order 3  wallet, briefcase
  //
  // Without display:contents there is no flex line to order things in, so
  // grouping is skipped along with the packing rather than half-applied.
  const HEAD_CLASS = 'tm-yield-head';
  const HEAD_STYLE =
    'display: block; flex-basis: 100%; width: 100%; order: %ORDER%; ' +
    'font-weight: bold; font-size: 9pt; padding: 4px 0 0; color: #404040;';

  function headingFor(body, index, label, count) {
    const id = HEAD_CLASS + '-' + index;
    let row = null;
    for (const child of body.children) {
      if (child.className === HEAD_CLASS && child.getAttribute('data-group') === String(index)) {
        row = child;
        break;
      }
    }
    if (!row) {
      row = document.createElement('tr');
      row.className = HEAD_CLASS;
      row.id = id;
      row.setAttribute('data-group', String(index));
      row.appendChild(document.createElement('td'));
      body.appendChild(row);
    }
    row.style.cssText = HEAD_STYLE.replace('%ORDER%', String(index * 2));
    const text = label + ' (' + count + ')';
    // Only write when it differs: an identical assignment still replaces the
    // text node, and this feature has learnt to leave settled things alone.
    if (row.firstChild.textContent !== text) row.firstChild.textContent = text;
    return row;
  }

  function clearHeadings(body) {
    Array.prototype.slice.call(body.children).forEach(function (child) {
      if (child.className === HEAD_CLASS && child.parentNode) child.parentNode.removeChild(child);
    });
  }

  function setGrouping(cells, on) {
    const parts = gridPartsFor(cells);
    const group = on && canPack() && parts.rows.length > 0;

    cells.forEach(function (c) {
      const want = group && c.keep && c.group !== -1 ? String(c.group * 2 + 1) : '';
      if (c.node.style.order !== want) c.node.style.order = want;
    });

    parts.bodies.forEach(function (body) {
      if (!group) {
        clearHeadings(body);
        return;
      }
      YIELD_GROUPS.forEach(function (def, index) {
        const count = cells.filter(function (c) {
          return c.keep && c.group === index && c.node.parentNode &&
            c.node.parentNode.parentNode === body;
        }).length;
        if (count) headingFor(body, index, def.label, count);
        else removeHeading(body, index);
      });
    });
  }

  function removeHeading(body, index) {
    for (const child of Array.prototype.slice.call(body.children)) {
      if (child.className === HEAD_CLASS && child.getAttribute('data-group') === String(index) &&
          child.parentNode) {
        child.parentNode.removeChild(child);
      }
    }
  }

  // One category. Returns { loaded, kept }: `loaded` false means the category
  // has no items on the page at all (a collapsed section hasn't fetched them),
  // which is NOT the same as a category filtered down to nothing.
  function filterCategory(box, on, group) {
    const items = Array.prototype.slice.call(
      box.querySelectorAll(ITEM_SELECTOR)
    );
    if (!items.length) return { loaded: false, kept: 0 };

    const cells = items.map(function (item) {
      const node = placementNode(item);
      const rel = item.getAttribute('rel');
      return {
        node: node,
        grid: node !== item,
        keep: showsWhenFiltered(rel),
        group: groupOfItem(rel),
      };
    });

    cells.forEach(function (c) {
      const want = on && !c.keep ? 'none' : '';
      // Assigning a style that is already set is free, but say it once anyway:
      // nothing here should ever look like a change to anything watching.
      if (c.node.style.display !== want) c.node.style.display = want;
    });
    setPacking(cells, on);
    setGrouping(cells, on && group);

    return { loaded: true, kept: cells.filter(function (c) { return c.keep; }).length };
  }

  function applyYieldFilter(on, group) {
    let kept = 0;
    document.querySelectorAll('table.stuffbox').forEach(function (box) {
      const res = filterCategory(box, on, group);
      kept += res.kept;
      // A loaded category filtered down to nothing is hidden whole, header
      // included: an open category showing zero items reads as a loading bug.
      // A category with no items loaded is left alone -- hiding it would take
      // away the header you click to load it. Clearing is deliberately narrow:
      // if this box is itself the grid table, setPacking has just given it a
      // display of its own, and only a "none" we put there is ours to remove.
      if (on && res.loaded && !res.kept) box.style.display = 'none';
      else if (box.style.display === 'none') box.style.display = '';
    });
    return kept;
  }

  function readYieldState(key, fallback) {
    try {
      const stored = localStorage.getItem(key);
      return stored === null ? fallback : stored === '1';
    } catch (e) {
      return fallback; // private mode / storage disabled
    }
  }

  function writeYieldState(key, on) {
    try {
      localStorage.setItem(key, on ? '1' : '0');
    } catch (e) { /* not worth failing the filter over */ }
  }

  function inventoryYieldFilter() {
    if (document.getElementById(YIELD_ONLY_ID)) return; // idempotency guard

    // Sit next to KoL's own Filter box. Outside the form, so Enter in the text
    // field still submits the page's filter and not ours.
    const form = document.querySelector('form#filter');
    const host = form && form.parentNode;
    if (!host) return;

    const label = document.createElement('label');
    label.style.cssText = 'font-size: 9pt; display: inline-block; margin-top: 2px;';
    label.title = 'Show only items that hand you other items or Meat when used ' +
      '(gift boxes, buckets, scrolls, wallets). Items that merely turn into a ' +
      'used copy of themselves are not included.';

    const box = document.createElement('input');
    box.type = 'checkbox';
    box.id = YIELD_ONLY_ID;
    label.appendChild(box);
    label.appendChild(document.createTextNode(' pays out'));

    // The grouping only has anything to say about items that pay out, so it
    // rides along with the filter rather than standing on its own.
    const groupLabel = document.createElement('label');
    groupLabel.style.cssText = 'font-size: 9pt; display: block; margin-left: 12px;';
    groupLabel.title = 'Sort the surviving items into multi-use recipes, Meat, ' +
      'random yields and plain items, with a heading over each.';
    const groupBox = document.createElement('input');
    groupBox.type = 'checkbox';
    groupBox.id = YIELD_GROUP_ID;
    groupLabel.appendChild(groupBox);
    groupLabel.appendChild(document.createTextNode(' group by type'));
    label.appendChild(groupLabel);

    const note = document.createElement('span');
    note.className = 'small';
    note.style.cssText = 'display: block; color: #707070;';
    note.textContent = '(open sections only)';
    label.appendChild(note);
    host.appendChild(label);

    // A pass only writes inline styles now, which no childList observer sees,
    // so it cannot feed itself. The disconnect stays anyway: it costs nothing,
    // and it is the only thing that would hold if a pass ever touched the tree
    // again. A boolean "busy" flag would NOT hold -- MutationObserver delivers
    // its records in a microtask, long after a synchronous pass has cleared the
    // flag, so they arrive looking exactly like somebody else's edit.
    let observer = null;
    const pass = function () {
      if (observer) observer.disconnect();
      try {
        applyYieldFilter(box.checked, groupBox.checked);
      } finally {
        if (observer) {
          // Discard the records our own pass just made. A foreign change that
          // landed in the same window is dropped with them, which is harmless:
          // the next mutation on the page schedules another pass anyway.
          observer.takeRecords();
          observer.observe(document.body, { childList: true, subtree: true });
        }
      }
    };

    box.checked = readYieldState(YIELD_STATE_KEY, false);
    groupBox.checked = readYieldState(YIELD_GROUP_KEY, true);
    groupBox.disabled = !box.checked;

    box.addEventListener('change', function () {
      writeYieldState(YIELD_STATE_KEY, box.checked);
      groupBox.disabled = !box.checked;
      pass();
    });
    groupBox.addEventListener('change', function () {
      writeYieldState(YIELD_GROUP_KEY, groupBox.checked);
      pass();
    });
    if (box.checked) pass();

    // Opening a category AJAX-loads its items, and using something splices the
    // changed item back in, so a single pass would go stale. Debounced, and a
    // no-op while unchecked.
    if (typeof MutationObserver === 'function' && document.body &&
        !window.__tmInvYieldWatch) {
      window.__tmInvYieldWatch = true;
      let pending = null;
      observer = new MutationObserver(function (records) {
        if (!box.checked || pending) return;
        // Only an item ARRIVING or LEAVING can change what the filter should
        // show. The page mutates constantly for other reasons -- KoL puts a
        // description popup in the DOM on hover and takes it out again, so
        // simply moving the mouse across the inventory fires this observer over
        // and over -- and answering those with a pass is what made the grid
        // twitch under the pointer. Everything else is ignored here.
        if (!records.some(touchesAnItem)) return;
        pending = setTimeout(function () { pending = null; pass(); }, 150);
      });
      observer.observe(document.body, { childList: true, subtree: true });
    }
  }

  // === feature: always show the monster aggravation device ===============
  //
  // Every moon sign gets a Monster Aggravation Device -- a dial that adds its
  // setting to the level of every monster in the Kingdom, and forces the
  // special drops out of the level bosses. Which one you get is decided by the
  // sign you ascended under, and there are four:
  //
  //   Mongoose / Wallaby / Vole      Degrassi Knoll        detuned radio (0-10)
  //   Platypus / Opossum / Marmot    Little Canadia        the MCD       (0-11)
  //   Wombat  / Blender / Packrat    Gnomish Gnomads Camp  Annoy-o-Tron  (0-10)
  //   Bad Moon                       Hey Deze              Heartbreaker's Hotel
  //
  // Note the grouping is by the sign's ZONE, not by its stat -- Platypus is a
  // Muscle sign but a Canadia one, so a "muscle sign means the radio" shortcut
  // would send a third of players to the wrong page.
  //
  // KoL puts a link to your device in the charpane showing its current
  // setting... but ONLY while the dial is above 0. At 0 the line vanishes,
  // which is precisely when you want to click it. So: put it back, reading 0.
  // No setting is changed here -- this is a link, nothing else.
  //
  // Both charpane layouts are handled, with the game's own markup, labels and
  // hrefs, so the restored line is indistinguishable from the real one (and
  // still parses for anything else reading the pane, KoLmafia included):
  //
  //   expanded  <br><font size=2><a target=mainpane href=...>Detuned Radio</a>: <b>0</b></font>
  //   compact   <tr><td align=right><a target=mainpane href=...>Radio</a>:</td><td><b>0</b></td></tr>
  //
  // The value is hardcoded to 0 rather than looked up, because KoL hides the
  // line exactly when the dial is 0 -- its absence IS the reading. If the line
  // is already on the page we leave it completely alone.

  const MCD_ID = 'tm-mcd-link';
  const MCD_CACHE_KEY = 'tm-mcd-device';
  // The sign is fixed for an ascension, so this only has to be re-derived after
  // one. A day's grace keeps a stale entry from outliving a run for long, and
  // the worst a wrong one can do is offer a link to a zone you can't reach.
  const MCD_CACHE_MS = 24 * 60 * 60 * 1000;

  // KoL's own link for each device, and its own two labels for it. Verified
  // against real charpane HTML (KoLmafia's charpane test fixtures) rather than
  // reconstructed, so these are the game's URLs, not guesses at them.
  const MCD_DEVICES = {
    knoll: {
      label: 'Detuned Radio', short: 'Radio', max: 10, pwd: true,
      url: 'inv_use.php?whichitem=2682',
      note: 'The radio costs 300 Meat at the Degrassi Knoll Bakery and Hardware ' +
        'Store, and you have to be carrying it.',
    },
    canadia: {
      label: 'Mind Control', short: 'MC', max: 11, pwd: false,
      url: 'place.php?whichplace=canadia&action=lc_mcd',
      note: 'Free and available from turn one — and this is the one whose dial ' +
        'goes to 11.',
    },
    gnomads: {
      label: 'Annoy-o-Tron 5k', short: 'AOT5K', max: 10, pwd: false,
      url: 'gnomes.php?place=machine',
      note: 'Free, but the Gnomish Gnomads\' Camp needs the Desert Beach ' +
        'unlocked first.',
    },
    badmoon: {
      label: 'Heartbreaker\'s', short: 'HH', max: 11, pwd: false,
      url: 'adventure.php?snarfblat=148',
      note: 'Setting this one costs an Adventure, and each visit only offers one ' +
        'floor from 1-3, one from 4-7 and one from 8-11 (plus 0).',
    },
  };

  // --- pure helpers (unit-tested) ------------------------------------------

  const MOON_SIGN_DEVICE = {
    mongoose: 'knoll', wallaby: 'knoll', vole: 'knoll',
    platypus: 'canadia', opossum: 'canadia', marmot: 'canadia',
    wombat: 'gnomads', blender: 'gnomads', packrat: 'gnomads',
    'bad moon': 'badmoon',
  };

  // api.php's `sign` -> a key of MCD_DEVICES. Null for "None" and for anything
  // unrecognised, which is the signal to leave the pane alone entirely.
  function mcdDeviceForSign(sign) {
    const key = String(sign || '').trim().toLowerCase();
    return MOON_SIGN_DEVICE[key] || null;
  }

  // KoL's own label for a device, either layout's wording -> the device key.
  // Used to recognise the line when the game IS drawing it.
  function mcdDeviceForLabel(label) {
    const want = String(label || '').trim().toLowerCase().replace(/:$/, '');
    for (const key of Object.keys(MCD_DEVICES)) {
      const dev = MCD_DEVICES[key];
      if (want === dev.label.toLowerCase() || want === dev.short.toLowerCase()) return key;
    }
    return null;
  }

  function mcdTooltip(dev) {
    return 'Monster aggravation device — the dial goes 0-' + dev.max + ' and adds ' +
      'that much to the level of every monster you fight. ' + dev.note +
      ' Setting it to the right number also forces the special drops from the Boss ' +
      'Bat, Baron von Ratsworth, the Knob Goblin King and the Bonerdagon' +
      (dev.max === 11
        ? ' — and beating all four with it at 11 earns the Boss Boss trophy.'
        : '.') +
      ' KoL hides this line whenever the dial is at 0; this is that line, put back.';
  }

  // --- reading the pane ----------------------------------------------------

  // The game's own device line, if it's drawing one. Matched on the label text
  // (the same four names in each layout) rather than on the href: the Hey Deze
  // link is an ordinary adventure.php URL and would collide with a "last
  // adventure" link pointing at the same zone.
  function findExistingMcdLink() {
    for (const a of document.querySelectorAll('a[href]')) {
      if (mcdDeviceForLabel(a.textContent)) return a;
    }
    return null;
  }

  // The compact pane lists Adv / PvP / the device as two-cell rows:
  //   <tr><td align=right><a ...>PvP</a>:</td><td align=left><b>48</b></td></tr>
  // The expanded pane draws the same things as icons with a <span class=black>
  // count, so requiring a <b> in the second cell is what tells the two apart.
  // Returns the row to sit after, or null when this isn't the compact pane.
  function findCompactStatRow() {
    const pvp = document.querySelector('a[href*="peevpee.php"]');
    const tr = pvp && pvp.closest ? pvp.closest('tr') : null;
    if (!tr || tr.children.length < 2) return null;
    if (!tr.children[1].querySelector('b')) return null;
    // KoL puts the device last in that table, so go to the end of it.
    const rows = tr.parentNode ? tr.parentNode.children : null;
    return rows && rows.length ? rows[rows.length - 1] : tr;
  }

  // The charpane defines pwdhash itself and is full of pwd-carrying links, so
  // read it locally: getPwd() would spend an api.php round trip, and this runs
  // on every single turn.
  function localPwd() {
    if (typeof window.pwdhash === 'string' && window.pwdhash) return window.pwdhash;
    const link = document.querySelector('a[href*="pwd="]');
    const m = link && (link.getAttribute('href') || '').match(/[?&]pwd=([0-9a-fA-F]+)/);
    return m ? m[1] : null;
  }

  // --- remembering which device you have -----------------------------------
  //
  // localStorage is per-origin, so key on the character name (the charpane's
  // own charsheet link) or a multi would share one device.

  function mcdCacheKey() {
    const a = document.querySelector('a[href*="charsheet.php"]');
    const name = a && (a.textContent || '').trim();
    return name ? MCD_CACHE_KEY + ':' + name : MCD_CACHE_KEY;
  }

  function readCachedDevice() {
    try {
      const rec = JSON.parse(localStorage.getItem(mcdCacheKey()));
      if (!rec || !rec.t || Date.now() - rec.t > MCD_CACHE_MS) return null;
      return MCD_DEVICES[rec.dev] ? rec.dev : null;
    } catch (e) {
      return null;
    }
  }

  function rememberDevice(key) {
    if (!key) return;
    try {
      localStorage.setItem(mcdCacheKey(), JSON.stringify({ dev: key, t: Date.now() }));
    } catch (e) { /* storage unavailable; we'll just ask api.php again */ }
  }

  // --- the line ------------------------------------------------------------

  function mcdAnchor(dev, text, pwd) {
    const a = document.createElement('a');
    a.target = 'mainpane'; // we're in the sidebar frame; the device opens in the big one
    a.href = dev.url + (dev.pwd && pwd ? '&pwd=' + pwd : '');
    a.textContent = text;
    a.title = mcdTooltip(dev);
    return a;
  }

  function boldZero() {
    const b = document.createElement('b');
    b.textContent = '0';
    return b;
  }

  function injectMcdLine(dev, pwd) {
    const compactAfter = findCompactStatRow();
    if (compactAfter && compactAfter.parentNode) {
      const tr = document.createElement('tr');
      tr.id = MCD_ID;
      const label = document.createElement('td');
      label.setAttribute('align', 'right');
      label.appendChild(mcdAnchor(dev, dev.short, pwd));
      label.appendChild(document.createTextNode(':'));
      const value = document.createElement('td');
      value.appendChild(boldZero());
      tr.appendChild(label);
      tr.appendChild(value);
      compactAfter.parentNode.insertBefore(tr, compactAfter.nextSibling);
      return true;
    }

    // Expanded pane. KoL's own line stands clear of its neighbours on BOTH
    // sides, and real charpanes show it two ways:
    //   ...</table><br><font size=2>DEVICE</font><br><br><center id="nudgeblock">
    //   ...<b>Hardcore</b></font><br><br><font size=2>DEVICE</font><br><br><center ...>
    // With the line hidden the lower gap is still on the page, so go in ABOVE
    // that run of <br>s and it lands below us, right where the game puts it.
    // Then open the same gap above -- except after a block element (the stats
    // table), which already ends the line, where one <br> is a blank line and
    // two would be one more than the game leaves.
    const nudge = document.getElementById('nudgeblock');
    let anchor = nudge;
    let gap = 0;
    while (anchor && anchor.previousSibling) {
      const prev = anchor.previousSibling;
      if (prev.nodeName === 'BR') { gap++; } else if (
        // Whitespace between the tags isn't spacing; step over it either way.
        !(prev.nodeType === 3 && !/\S/.test(prev.nodeValue || ''))) break;
      anchor = prev;
    }
    const wanted = Math.max(gap, 2);
    const above = anchor && anchor.previousSibling;
    const blockAbove = above && above.nodeType === 1 &&
      /^(TABLE|CENTER|DIV|P|HR)$/.test(above.nodeName);

    const wrap = document.createElement('span');
    wrap.id = MCD_ID;
    for (let i = 0; i < (blockAbove ? 1 : wanted); i++) {
      wrap.appendChild(document.createElement('br'));
    }
    const font = document.createElement('font');
    font.setAttribute('size', '2');
    font.appendChild(mcdAnchor(dev, dev.label, pwd));
    font.appendChild(document.createTextNode(': '));
    font.appendChild(boldZero());
    wrap.appendChild(font);
    for (let i = gap; i < wanted; i++) wrap.appendChild(document.createElement('br'));

    if (anchor && anchor.parentNode) {
      anchor.parentNode.insertBefore(wrap, anchor);
      return true;
    }
    if (document.body) {
      document.body.appendChild(wrap);
      return true;
    }
    return false;
  }

  async function mcdAlwaysVisible() {
    if (document.getElementById(MCD_ID)) return; // idempotency guard

    // The dial is above 0 and KoL is already showing the line. Don't touch it --
    // but do note for free which device this character has, so the next turn
    // (at 0) needs no lookup at all.
    const existing = findExistingMcdLink();
    if (existing) {
      rememberDevice(mcdDeviceForLabel(existing.textContent));
      return;
    }

    let key = readCachedDevice();
    if (!key) {
      // api.php is the game's own answer for the moon sign, and it's the only
      // place that states it without loading a whole page.
      const status = await apiJson('status');
      key = mcdDeviceForSign(status && status.sign);
      rememberDevice(key);
    }
    // No sign, or one we don't know: this character has no device, so say
    // nothing rather than link somewhere they can't go.
    if (!key) return;

    const dev = MCD_DEVICES[key];
    const pwd = dev.pwd ? (localPwd() || await getPwd()) : null;
    injectMcdLine(dev, pwd);
  }

  // === feature: Daily Dungeon free-skip options =========================
  //
  // Every obstacle room in the Daily Dungeon has one option that gets you past
  // it for **no adventure**, and KoL renders it as just another button in the
  // stack. Picking the wrong one is expensive in a way that doesn't come back:
  // "Try the doorknob" triggers the trap (up to 3 adventures gone), and
  // "Proceed forward cautiously" takes half your maximum HP, unreduced by
  // resistance. So the free option gets an outline and a line saying what it
  // costs you, which is nothing.
  //
  // Choice numbers and button labels are the wiki's:
  //   690 The First Chest Isn't the Deepest. (room 5)
  //   691 Second Chest (room 10)
  //   692 I Wanna Be a Door
  //   693 It's Almost Certainly a Trap
  //
  // "Use a skeleton key" is deliberately NOT here. It also passes for no
  // adventure, but it breaks the key most times, so it isn't free the way the
  // rest are and shouldn't wear the same colour.
  //
  // Matching is on the button's LABEL, never on the option number. The label is
  // the thing the player is reading, so a highlight can't end up on a button
  // that says something else; an option number drifted by a KoL change could
  // put the outline on the doorknob. A drifted *label* just matches nothing,
  // which is the harmless direction -- and an unmatched option is the normal
  // case here anyway, since KoL only renders these when you have the item.

  const DD_ID_PREFIX = 'tm-dd-skip-';

  const DUNGEON_SKIPS = {
    690: [
      { labels: ['go through the boring door'],
        why: 'Ring of Detect Boring Doors: skips straight to room 8, so three rooms ' +
          'cost no adventures. You give up this chest\'s item.' },
    ],
    691: [
      { labels: ['go through the boring door'],
        why: 'Ring of Detect Boring Doors: skips straight to room 13, so three rooms ' +
          'cost no adventures. You give up this chest\'s item.' },
    ],
    692: [
      { labels: ['use your lockpicks'],
        why: 'Pick-O-Matic lockpicks: unlocks the door every time. No adventure, no ' +
          'trap, and the lockpicks are not used up.' },
      { labels: ['use your credit card to open the door'],
        why: 'Platinum Yendorian Express Card: unlocks the door every time. No ' +
          'adventure, no trap, and the card is not used up.' },
    ],
    693: [
      { labels: ['use your eleven-foot pole'],
        why: 'eleven-foot pole: past the trap for no adventure and no damage. You ' +
          'get no stats from the trap either, and the pole is not used up.' },
      { labels: ['use your candy cane sword', 'use your candy cane sword cane'],
        why: 'candy cane sword cane: past the trap for no adventure and no damage, ' +
          'and it still gives around 40-50 substats.' },
    ],
  };

  // Buttons are compared on a flattened label: KoL's own spacing and the
  // trailing full stop it puts on some options are not identity.
  //
  // Neither is anything ANOTHER script appended. adventure-choices.js annotates
  // these exact four rooms -- `DisplaySpoilers()` does
  // `inputs[n].value += " -- " + spoiler` on every submit button -- and neither
  // script declares @run-at, so which one reads the label first is not
  // decidable. Cutting the annotation off makes the marker survive both orders.
  // Two separators are cut: " -- ", which is adventure-choices' (and its debug
  // " -- buttonID = N." too), and " [", which is KoL's own bracketed suffix --
  // adventure-choices cuts that one before its own lookup for the same reason.
  function ddLabel(text) {
    let out = String(text == null ? '' : text).replace(/\s+/g, ' ').trim();
    for (const sep of [' -- ', ' [']) {
      const at = out.indexOf(sep);
      if (at !== -1) out = out.slice(0, at);
    }
    return out.trim().replace(/\.$/, '').toLowerCase();
  }

  // The advice for one button on one choice page, or null when this isn't an
  // option we have anything to say about.
  //
  // Matching stays EXACT, against a list of known wordings, and is deliberately
  // not a substring sweep. The chest rooms carry "Pry off a loose panel with
  // your candy cane sword", which any `includes('candy cane sword')` would mark
  // green -- and that option costs an adventure. An unknown wording matching
  // nothing is the safe failure here; a wrong button wearing the green is not.
  // A wording KoL renders differently gets added to `labels`, not loosened into
  // a prefix rule.
  function ddSkipFor(choice, text) {
    const entries = DUNGEON_SKIPS[choice];
    if (!entries) return null;
    const want = ddLabel(text);
    if (!want) return null;
    for (const entry of entries) {
      if (entry.labels.indexOf(want) !== -1) return entry;
    }
    return null;
  }

  // choice.php is shared by every choice adventure, so nothing happens until
  // the hidden whichchoice says we're in one of the dungeon's rooms.
  function currentChoiceNumber(doc) {
    const input = (doc || document).querySelector('input[name="whichchoice"]');
    if (!input) return null;
    const n = Number(input.value);
    return Number.isFinite(n) ? n : null;
  }

  // Whatever the page is using as a clickable option. Choice pages are
  // classic <input type=submit class=button>, but a <button> is answered the
  // same way, so both are read and the label comes from whichever holds it.
  function ddButtonLabel(el) {
    return el.tagName === 'BUTTON' ? el.textContent : el.value;
  }

  function dailyDungeonSkips() {
    const choice = currentChoiceNumber(document);
    if (!DUNGEON_SKIPS[choice]) return;

    const buttons = document.querySelectorAll('input[type="submit"], button');
    let n = 0;
    for (const btn of buttons) {
      const skip = ddSkipFor(choice, ddButtonLabel(btn));
      if (!skip) continue;
      if (btn.dataset.tmDdSkip) continue; // idempotency guard
      btn.dataset.tmDdSkip = '1';

      // Inline styles only: KoL's CSP blocks a script-injected stylesheet, but
      // allows style attributes (the same constraint auto-mine.js's tile
      // highlight and quest-helper.js work under).
      btn.style.outline = '3px solid #0a0';
      btn.style.outlineOffset = '2px';
      btn.style.fontWeight = 'bold';

      // The outline says "this one"; the note says why, because a tooltip is
      // unreadable on a touch screen and this is exactly the moment you want
      // the reason before you click.
      const note = document.createElement('div');
      note.id = DD_ID_PREFIX + (n++);
      note.style.cssText = 'margin:3px 0 6px;color:#060;font-size:10px;font-weight:bold';
      note.textContent = 'Free: ' + skip.why;
      const host = btn.parentNode;
      if (host) host.insertBefore(note, btn.nextSibling);
    }
  }


  // === feature: sort and collapse the autosell list =====================
  //
  // Was its own sell-sort.js. Straight-line code in the original -- it ran on
  // eval -- so it is wrapped here to become a registry entry, which is what
  // puts it behind the same per-feature try/catch as everything else.
  //
  // Note this owns a SECOND collapse-all implementation: it mirrors KoL's
  // `sellstuff` cookie, where the inventory one (below) mirrors `inventory`.
  // Different cookies, different section markup; they are not interchangeable.

  function sellSort() {

    // Idempotency guard: the page/loader may run us more than once.
    if (document.getElementById('kol-sell-sort-bar')) return;

    // The category sections are <div id='sectionN'> where N is the bit value
    // from the page's `sections` map. Find them directly.
    const divs = Array.prototype.slice.call(
      document.querySelectorAll("div[id^='section']")
    ).filter(function (d) { return /^section\d+$/.test(d.id); });
    if (!divs.length) return;

    // --- KoL "sellstuff" cookie (bit set = section hidden) ----------------
    // Mirror the page's own toggle()/cookie logic so collapse/expand persists.
    // We maintain our own copy, re-reading the live cookie on each flip in case
    // the user also clicked KoL's native header toggles in between.
    function readCookie() {
      if (typeof window.getCookie === 'function') {
        var c = parseInt(window.getCookie('sellstuff'), 10);
        return Number.isFinite(c) ? c : 0;
      }
      return 0;
    }

    function isOpen(div) {
      return div.style.display !== 'none';
    }

    // Set a section to open/closed and keep the cookie in sync.
    function setOpen(div, open) {
      if (isOpen(div) === open) return;
      var bit = parseInt(div.id.replace('section', ''), 10);
      var cookie = readCookie();
      if (open) {
        div.style.display = 'inline';
        cookie = cookie & ~bit;
      } else {
        div.style.display = 'none';
        cookie = cookie | bit;
      }
      if (typeof window.setCookie === 'function') {
        window.setCookie('sellstuff', cookie);
      }
    }

    // --- Item scraping ----------------------------------------------------
    // Each item is a pair of <td>s: a checkbox cell followed by an info cell
    // (<a><b>name</b></a> (qty)<br><font size=1>NN Meat</font>). Items are laid
    // out two-per-row; the last row may carry a "&nbsp;" filler cell.
    function scrapeItems(div) {
      var boxes = Array.prototype.slice.call(
        div.querySelectorAll("input[type=checkbox]")
      );
      return boxes.map(function (cb, i) {
        var cbTd = cb.parentNode;
        var infoTd = cbTd.nextElementSibling;
        // Read qty/price from the text that follows the item link, so item
        // names that themselves contain "(...)" can't be misread as a quantity.
        var clone = infoTd.cloneNode(true);
        var a = clone.querySelector('a');
        if (a) a.parentNode.removeChild(a);
        var rest = clone.textContent;
        var qm = rest.match(/\((\d+)\)/);
        var pm = rest.match(/([\d,]+)\s*Meat/i);
        return {
          cbTd: cbTd,
          infoTd: infoTd,
          qty: qm ? parseInt(qm[1], 10) : 1,
          price: pm ? parseInt(pm[1].replace(/,/g, ''), 10) : 0,
          index: i
        };
      });
    }

    // Rebuild the two-column grid in the given order.
    function relayout(tbody, items) {
      while (tbody.firstChild) tbody.removeChild(tbody.firstChild);
      for (var i = 0; i < items.length; i += 2) {
        var tr = document.createElement('tr');
        tr.appendChild(items[i].cbTd);
        tr.appendChild(items[i].infoTd);
        if (items[i + 1]) {
          tr.appendChild(items[i + 1].cbTd);
          tr.appendChild(items[i + 1].infoTd);
        } else {
          var filler = document.createElement('td');
          filler.innerHTML = '&nbsp;';
          tr.appendChild(filler);
        }
        tbody.appendChild(tr);
      }
    }

    // --- Locate the sell form (checkboxes must stay inside it) -----------
    var form = document.forms.f || document.querySelector('form[name=f]');

    // Walk up to the top-level category <table> that is a direct child of form.
    function topTable(node) {
      while (node && node.parentNode && node.parentNode !== form) {
        node = node.parentNode;
      }
      return (node && node.parentNode === form) ? node : null;
    }

    // --- Prepare every section for sorting -------------------------------
    // Each section keeps its own item list, tbody and original order. We also
    // build one combined list (globalOriginal) for the flattened single-list
    // view, and collect the outer category tables so they can be hidden when
    // flattened. A single set of buttons drives both views.
    var sections = [];
    var globalOriginal = [];
    var catTables = [];
    var gIndex = 0;
    divs.forEach(function (div) {
      if (!div.querySelector('table')) return;
      var items = scrapeItems(div);
      if (!items.length) return;
      items.forEach(function (it) { it.globalIndex = gIndex++; });
      sections.push({
        tbody: items[0].cbTd.parentNode.parentNode, // td -> tr -> tbody
        original: items.slice()                     // original (alphabetical)
      });
      items.forEach(function (it) { globalOriginal.push(it); });
      var ct = topTable(div);
      if (ct && catTables.indexOf(ct) === -1) catTables.push(ct);
    });
    if (!sections.length) return;

    var activeKey = null;   // 'qty' | 'price' | null (name/original order)
    var descending = true;  // first click on a key shows biggest first
    var flattened = false;  // single global list vs per-category

    // Sort comparator; idxProp picks the stable tiebreak field (per-section
    // 'index' for category sorts, 'globalIndex' for the flattened list).
    function comparator(idxProp) {
      return function (a, b) {
        var diff = a[activeKey] - b[activeKey];
        if (diff !== 0) return descending ? -diff : diff;
        return a[idxProp] - b[idxProp];
      };
    }

    // Re-lay items according to the current key/direction and view mode.
    function render() {
      if (flattened) {
        var ordered = activeKey === null
          ? globalOriginal.slice()
          : globalOriginal.slice().sort(comparator('globalIndex'));
        relayout(flatTbody, ordered);
      } else {
        sections.forEach(function (s) {
          var ordered = activeKey === null
            ? s.original.slice()
            : s.original.slice().sort(comparator('index'));
          relayout(s.tbody, ordered);
        });
      }
    }

    function applySort(key) {
      if (key === 'name') {
        activeKey = null;
      } else if (key === activeKey) {
        descending = !descending;
      } else {
        activeKey = key;
        descending = true;
      }
      render();
      updateLabels();
    }

    // --- Flattened single-list container (hidden until toggled) ----------
    // Mimics a category table so it blends in; render() moves the real item
    // cells into its inner tbody, and back into their sections on restore.
    var flatTable = document.createElement('table');
    flatTable.id = 'kol-sell-sort-flat';
    flatTable.width = '95%';
    flatTable.cellSpacing = '0';
    flatTable.cellPadding = '0';
    flatTable.style.display = 'none';
    flatTable.innerHTML =
      '<tr><td style="background-color: blue" align=center>' +
        '<b style="color: white">All Items</b></td></tr>' +
      '<tr><td style="padding: 5px; border: 1px solid blue;"><center>' +
        '<table width=100%><tbody></tbody></table>' +
      '</center></td></tr>';
    var flatTbody = flatTable.getElementsByTagName('table')[0].tBodies[0];
    if (catTables.length) {
      catTables[0].parentNode.insertBefore(flatTable, catTables[0]);
    } else {
      form.appendChild(flatTable);
    }

    function setFlattened(on) {
      flattened = on;
      catTables.forEach(function (t) { t.style.display = on ? 'none' : ''; });
      flatTable.style.display = on ? '' : 'none';
      toggleBtn.style.display = on ? 'none' : ''; // expand/collapse is moot flat
      render();
      updateFlattenLabel();
    }

    // --- Toolbar ---------------------------------------------------------
    // Expand all / Collapse all (per-category view only).
    function toggleAll() {
      var anyOpen = divs.some(isOpen);
      divs.forEach(function (d) { setOpen(d, !anyOpen); });
      updateToggleAllLabel();
    }

    var toggleBtn = document.createElement('button');
    toggleBtn.type = 'button';
    toggleBtn.style.cssText = 'cursor:pointer;';
    toggleBtn.addEventListener('click', toggleAll);

    function updateToggleAllLabel() {
      toggleBtn.textContent = divs.some(isOpen) ? 'Collapse all' : 'Expand all';
    }
    updateToggleAllLabel();

    // Single list / Show categories toggle.
    var flattenBtn = document.createElement('button');
    flattenBtn.type = 'button';
    flattenBtn.style.cssText = 'margin-left:8px;cursor:pointer;';
    flattenBtn.addEventListener('click', function () { setFlattened(!flattened); });

    function updateFlattenLabel() {
      flattenBtn.textContent = flattened ? 'Show categories' : 'Single list';
    }
    updateFlattenLabel();

    var topBar = document.createElement('div');
    topBar.id = 'kol-sell-sort-bar';
    topBar.style.cssText =
      'text-align:center;margin:4px 0;font-family:arial;font-size:9pt;';
    topBar.appendChild(toggleBtn);
    topBar.appendChild(flattenBtn);

    // One shared set of sort buttons, applied to every category (or the list).
    var sortButtons = [];
    var sortLabel = document.createElement('span');
    sortLabel.textContent = ' Sort: ';
    topBar.appendChild(sortLabel);
    [['qty', 'Quantity'], ['price', 'Sell price'], ['name', 'Name']]
      .forEach(function (spec) {
        var key = spec[0];
        var btn = document.createElement('button');
        btn.type = 'button'; // must not submit the sell form
        btn.textContent = spec[1];
        btn.style.cssText = 'margin-left:4px;cursor:pointer;';
        btn.addEventListener('click', function () { applySort(key); });
        sortButtons.push({ el: btn, key: key, base: spec[1] });
        topBar.appendChild(btn);
      });

    function updateLabels() {
      sortButtons.forEach(function (b) {
        if (b.key !== 'name' && b.key === activeKey) {
          b.el.textContent = b.base + (descending ? ' ▼' : ' ▲');
        } else {
          b.el.textContent = b.base;
        }
      });
    }

    // Drop the toolbar at the very top of the sell form so it's always visible.
    if (form && form.firstChild) {
      form.insertBefore(topBar, form.firstChild);
    } else {
      document.body.insertBefore(topBar, document.body.firstChild);
    }
  }


  // === feature: warn before a special-reward boss ========================
  //
  // Was its own boss-aggro-warn.js, and it belongs here: the file already
  // knows the monster aggravation device (MCD_DEVICES / MOON_SIGN_DEVICE, in
  // the charpane feature below). This half reads the dial off api.php rather
  // than the sidebar, because it runs in the mainpane.
  //
  // getStatus() was renamed bossStatus(): charpane-heal's getStatus returns
  // {hp, mp, pwd} and throws, this one returns {level, equippedIds} and never
  // throws. Same name, opposite error contract -- do not re-merge them.


  // ---------------------------------------------------------------------------
  // Data: the four bosses that drop a special item when defeated with the
  // aggravation device set to a specific level, and how to warn BEFORE entering
  // each one's area.
  //
  // Source: https://wiki.kingdomofloathing.com/Monster_Aggravation_Devices
  // The "level" is the aggravation-device setting itself (0-11), NOT the
  // effective Monster Level -- equipment ML penalties/bonuses don't change which
  // reward drops; only the dial setting matters.
  //
  // KoL zone maps are HTML image maps: the link into a zone is an <area> (not an
  // <a>) inside <map>, e.g. on cobbsknob.php the throne room is
  //   <area href="cobbsknob.php?action=throneroom" alt="Throne Room" ...>
  // <area> has no layout, so we can't badge it inline -- instead we show one
  // top-of-page banner, but ONLY when the entry link/area is present (= the zone
  // is actually enterable), preserving the "before entering" intent.
  //
  //   name    - boss, for the warning text.
  //   rewards - map of required device setting -> reward item name.
  //   present - predicate (receives the status context: { equippedIds }): is
  //             this boss's area enterable from the current page right now?
  //             Returns true to trigger the banner. Match the entry <area>/<a>
  //             by href or by alt/title/text (zone name lives in the image map's
  //             alt/title), and gate on equipment where entering requires it.
  // ---------------------------------------------------------------------------

  // Find an entry link/area on the page, matching href OR alt/title/text. Covers
  // both <a> and <area> (image-map zones). Used by the `present` predicates.
  //
  // Image maps need care: a page can emit several <map>s and switch the live one
  // via the <img usemap="#name">. The Cyrpt (crypt.php) emits BOTH a
  // <map name="heart"> (with the Haert area) and a <map name="empty">, so the
  // Haert <area> exists in the DOM even when it isn't enterable -- only the map
  // the <img> points at is active. So an <area> only counts if its parent <map>'s
  // name is referenced by some <img usemap>. Plain <a> links always count.
  function hasEntry({ href, label } = {}) {
    const activeMaps = new Set(
      Array.from(document.querySelectorAll('img[usemap]')).map((img) =>
        (img.getAttribute('usemap') || '').replace(/^#/, '')
      )
    );
    const els = document.querySelectorAll('a[href], area[href]');
    for (const el of els) {
      if (el.tagName === 'AREA') {
        const map = el.closest('map');
        if (!map || !activeMaps.has(map.getAttribute('name'))) continue;
      }
      if (href && href.test(el.getAttribute('href') || '')) return true;
      if (label) {
        const text = `${el.textContent || ''} ${el.title || ''} ${el.alt || ''}`;
        if (label.test(text)) return true;
      }
    }
    return false;
  }

  // The Knob Goblin King only fights you when you approach the throne room in a
  // complete disguise; without it you just get a beating (no boss, no reward).
  // Item ids verified from the wiki Collection numbers:
  //   Harem Girl Disguise = harem veil (306, hat) + harem pants (305).
  //   Elite Guard Uniform = elite helm (308, hat) + elite polearm (310, weapon)
  //                         + elite pants (309).
  // We check against ALL equipped slots so a slot reassignment can't break it.
  const KNOB_DISGUISES = [
    [306, 305],
    [308, 310, 309],
  ];
  const wearingKnobDisguise = (equippedIds) =>
    KNOB_DISGUISES.some((pieces) => pieces.every((id) => equippedIds.has(id)));

  const BOSSES = [
    {
      name: 'Boss Bat',
      rewards: { 4: 'Boss Bat britches', 8: 'Boss Bat bling' },
      // The Bat Hole map (place.php?whichplace=bathole) only shows the lair once
      // the three walls are down. TODO(verify) snarfblat against real HTML; the
      // alt/title label is the reliable matcher.
      present: () =>
        hasEntry({ href: /snarfblat=34\b/i, label: /Boss Bat'?s Lair/i }),
    },
    {
      name: 'The Bonerdagon',
      rewards: { 5: 'rib of the Bonerdagon', 10: 'vertebra of the Bonerdagon' },
      // VERIFIED from crypt.php HTML: the Defiled Cyrpt map's Haert is an
      // image-map <area href="crypt.php?action=heart" title="The Haert of the
      // Cyrpt"> inside <map name="heart">. It's only live once the four niches
      // are undefiled (the <img> switches usemap from #empty to #heart), which
      // hasEntry()'s active-map check handles.
      present: () =>
        hasEntry({ href: /crypt\.php\?action=heart/i, label: /Haert of the Cyrpt/i }),
    },
    {
      name: 'Knob Goblin King',
      rewards: { 3: 'Glass Balls of the Goblin King', 7: 'Codpiece of the Goblin King' },
      // VERIFIED from cobbsknob.php HTML: the throne room is an image-map <area>
      // href="cobbsknob.php?action=throneroom" alt/title="Throne Room". The area
      // is always present inside the Knob, but the King only fights you in a
      // complete disguise -- so gate on that to avoid a standing reminder.
      present: (ctx) =>
        hasEntry({ href: /action=throneroom/i, label: /Throne ?Room/i }) &&
        wearingKnobDisguise(ctx.equippedIds),
    },
    {
      name: 'Baron von Ratsworth',
      rewards: { 2: "Baron von Ratsworth's money clip", 9: "Baron von Ratsworth's tophat" },
      // The Baron is a wandering encounter while mapping the Tavern Cellar maze
      // (cellar.php is not an adv.php zone), so there's no entry link -- just
      // being on cellar.php means he could turn up.
      present: () => /\/cellar\.php/i.test(location.pathname),
    },
  ];

  // For reference / future messaging. All four devices drive the same single
  // setting; which one a player has depends on their moon sign / unlocks.
  //   Detuned radio ............... 0-10  (Degrassi Knoll)
  //   Mind-Control Device (MCD) ... 0-11  (Little Canadia)
  //   Annoy-o-Tron 5000 ........... 0-10  (Gnomish Gnomad Camp)
  //   Heartbreaker's Hotel ........ 0-11  (Hey Deze, Bad Moon)

  const BANNER_ID = 'tm-boss-aggro-warn';

  // ---------------------------------------------------------------------------
  // Read the player status: the aggravation-device setting and equipped items,
  // in one api.php call.
  //
  // VERIFIED against a live api.php?what=status dump:
  //   - the setting is the `mcd` field (a string, e.g. "5"), and it's the same
  //     field for every device (the sample was an Annoy-o-Tron 5000).
  //   - `equipment` maps slot -> item id string, e.g. {"hat":"12202",...}; we
  //     collapse the values into a Set of numeric ids for disguise checks.
  // Returns { level, equippedIds }; level is null on fetch/parse failure or a
  // non-numeric mcd (treated as "unknown" by the caller).
  // ---------------------------------------------------------------------------
  async function bossStatus() {
    try {
      const res = await fetch('/api.php?what=status&for=tm-boss-aggro-warn', {
        credentials: 'same-origin',
      });
      const data = await res.json();
      const lvl = parseInt(data.mcd, 10);
      const equippedIds = new Set(
        Object.values(data.equipment || {})
          .map((v) => parseInt(v, 10))
          .filter((n) => !Number.isNaN(n))
      );
      return { level: Number.isNaN(lvl) ? null : lvl, equippedIds };
    } catch (e) {
      return { level: null, equippedIds: new Set() };
    }
  }

  // Human-readable list of the reward settings, e.g.
  // "4 (Boss Bat britches) or 8 (Boss Bat bling)".
  function rewardSummary(boss) {
    return Object.keys(boss.rewards)
      .map(Number)
      .sort((a, b) => a - b)
      .map((s) => `${s} (${boss.rewards[s]})`)
      .join(' or ');
  }

  // ---------------------------------------------------------------------------
  // UI: one warning banner at the top of the page. Idempotent via id.
  // ---------------------------------------------------------------------------
  function showBanner(boss, level) {
    if (document.getElementById(BANNER_ID)) return;
    const banner = document.createElement('div');
    banner.id = BANNER_ID;
    banner.style.cssText =
      'margin:6px;padding:8px 12px;border:2px solid #b00;border-radius:6px;' +
      'background:#ffe5e5;color:#600;font-weight:bold;text-align:center;';
    banner.textContent =
      `⚠ ${boss.name}: aggravator is set to ${level == null ? '?' : level}, ` +
      `which won't drop a special item. Set it to ${rewardSummary(boss)} first.`;
    document.body.insertBefore(banner, document.body.firstChild);
  }

  // ---------------------------------------------------------------------------
  // Orchestrate: pull status once (some `present` checks need equipment), find
  // the boss whose area is enterable here, and banner it unless the setting
  // already yields a reward.
  // ---------------------------------------------------------------------------
  async function bossAggroWarn() {
    const { level, equippedIds } = await bossStatus();
    const boss = BOSSES.find((b) => b.present({ equippedIds }));
    if (!boss) return;

    const rewardSettings = Object.keys(boss.rewards).map(Number);

    // Stay silent if the setting already yields a reward. (Later we could flip
    // this to a green "you'll get X" confirmation instead of nothing.)
    if (level != null && rewardSettings.includes(level)) return;

    showBanner(boss, level);
  }


  // === feature: wiki links ==============================================
  //
  // Was its own wiki-links.js. Unlike every other feature here it spans
  // several pages, so it becomes several registry entries over one shared set
  // of helpers rather than one entry -- the registry's unit is a page, and
  // fanning it out keeps each page paying only for the badges it can draw.
  // fight.php draws two (monster and drops), so it gets two entries.
  //
  // All targets are verified against real page HTML; see AGENTS.md before
  // changing a selector.

  const WIKI_BASE = 'https://wiki.kingdomofloathing.com/';

  // --- Wiki URL ---------------------------------------------------------
  // Link via MediaWiki's "Go" search (index.php?search=...&go=Go) rather than
  // a direct /Title path. When the name is an exact page title, Go redirects
  // straight to the article (and is already first-letter-case-insensitive);
  // when it is not (a slightly-off quest title, a redirect we don't know, a
  // name with adjectives), it lands on the search-results page for the text,
  // which is still useful instead of a dead redlink. URLSearchParams encodes
  // spaces as '+' and ':' as '%3A', matching the wiki's own search URLs.
  function wikiHref(name) {
    const t = name.trim().replace(/\s+/g, ' ');
    if (!t) return null;
    const qs = new URLSearchParams({ search: t, title: 'Special:Search', go: 'Go' });
    return WIKI_BASE + 'index.php?' + qs.toString();
  }

  // KoL prints monster names with a leading article ("a baguette lady",
  // "an ocelot", "the spooky ghost"), but the wiki article drops it
  // ("Baguette lady"). Strip one leading a/an/the before building the title.
  // NOTE: a few foes carry "The" as part of the real page name (e.g. bosses);
  // those are the rare exception and can be special-cased later if needed.
  function stripArticle(name) {
    return name.replace(/^\s*(an?|the)\s+/i, '');
  }

  // The "W" badge. Small, opens in a new tab so a misclick mid-fight does
  // not navigate the game page away. Marked with a class for the per-target
  // idempotency check below. Inline styles only (repo convention).
  function makeBadge(name) {
    const href = wikiHref(name);
    if (!href) return null;
    const a = document.createElement('a');
    a.className = 'kol-wiki-link';
    a.href = href;
    a.target = '_blank';
    a.rel = 'noopener';
    a.textContent = 'W';
    a.title = 'KoL wiki: ' + name.trim();
    a.style.cssText =
      'display:inline-block;margin-left:4px;padding:0 3px;' +
      'font-family:arial,sans-serif;font-size:9px;font-weight:bold;' +
      'line-height:13px;color:#fff;background:#3366cc;border-radius:2px;' +
      'text-decoration:none;vertical-align:middle;cursor:pointer;';
    return a;
  }

  // Badge `el`, once, deriving the wiki title from `name` (defaults to the
  // element's own text). `place` is 'after' (badge becomes the next sibling —
  // good for inline names) or 'append' (badge becomes the last child — good
  // for headings, so the W sits on the heading line). The data-kol-wiki flag
  // makes this idempotent: scripts may run more than once per page, and the
  // name is read before the badge is added either way.
  function addBadge(el, place, name) {
    if (!el || el.dataset.kolWiki) return;
    name = (name != null ? name : el.textContent).trim();
    if (!name) return;
    const badge = makeBadge(name);
    if (!badge) return;
    el.dataset.kolWiki = '1';
    if (place === 'append') el.appendChild(badge);
    else el.after(badge);
  }

  // --- Last adventure (charpane.php) -----------------------------------
  // The charpane shows a "Last Adventure:" label anchor, then (in a sibling
  // <table>) the adventure-name link itself, e.g.
  //   <a href="place.php?whichplace=town_right">Last Adventure:</a><br>
  //   <table>...<a href="adventure.php?snarfblat=440">Madness Bakery</a>...
  // Anchor on the label by its text and badge the very next anchor in
  // document order — that is the adventure name. Reading by position (rather
  // than by href) keeps it working for adventures linked via place.php as
  // well as the usual adventure.php?snarfblat= form; the wiki title comes
  // from the link text either way.
  function linkLastAdventure() {
    const anchors = Array.from(document.querySelectorAll('a'));
    const i = anchors.findIndex(function (a) {
      return /last adventure/i.test(a.textContent);
    });
    if (i === -1) return;
    addBadge(anchors[i + 1], 'after');
  }

  // --- Page title bar (place.php, choice.php, crypt.php) ---------------
  // These pages head with a blue title bar whose cell holds the name in
  // white bold:
  //   <td style="background-color: blue"><b style="color: white">Name</b></td>
  // On place.php this is the location ("The Right Side of the Tracks"); on
  // crypt.php the Defiled Cyrpt map carries the same bar ("The Defiled
  // Cyrpt"); on choice.php it is the choice adventure ("The Popular
  // Machine"). Badge that
  // <b>. Unlike monsters, the leading article is NOT stripped: the wiki page
  // keeps it. NOTE: other pages share this exact bar but with non-article
  // titles — fight.php ("Combat!"), questlog.php ("Your Quest Log") — so this
  // is wired only into the place/choice dispatch branches, never called there.
  //
  // SPECIAL CASE: a choice adventure can flow straight into the next one. The
  // page then shows a "Results:" recap bar first — inside <div id="results">,
  // holding the items/text from the previous choice — and the real next-choice
  // title bar as a sibling after it. The recap is not an adventure name and
  // must not be badged, so skip any title cell inside #results and badge the
  // first real one. (place.php and ordinary single choices have no #results,
  // so their sole title bar is taken as before.)
  function linkTitleBar() {
    const tds = document.querySelectorAll('td[style*="background-color: blue"]');
    for (const td of tds) {
      if (td.closest('#results')) continue;
      addBadge(td.querySelector('b'), 'after');
      return;
    }
  }

  // --- Quest titles (questlog.php) -------------------------------------
  // Each current quest is introduced by its title as a <b> immediately
  // followed by the <br> that precedes the quest's description, e.g.
  //   <b>Lady Spookyraven's Babies</b><br> Gather up ...
  // Only the FIRST quest in a section is a direct child of the <blockquote>;
  // the rest are each wrapped in a <p> (<blockquote><p><b>title</b><br>...),
  // so `blockquote > b` would catch only one per section. We scope to all
  // <b>s inside the blockquote instead and pick out the titles by structure:
  //  - place links in descriptions ("The Old Man", "The Sea") are <b>s nested
  //    inside <a>, so skip any <b> with an <a> ancestor;
  //  - bold words mid-description ("...make it a <b>big</b> war.") are NOT
  //    followed by a <br>, so require the trailing <br>.
  // The "Current/Council/Other Quests:" headers sit OUTSIDE the blockquote,
  // so the blockquote scope already excludes them. No article stripping: the
  // wiki quest page keeps the title verbatim — except for the per-player names
  // scrubbed by normalizeQuestTitle below.
  //
  // SPECIAL CASE: KoL splices the logged-in player's name (and sometimes the
  // current familiar's name) into several quest-log titles — e.g. the White
  // Citadel quest reads "<Player> and <Familiar> Go To White Citadel" (and
  // "<Player> and Kumar Go To White Citadel" with no familiar along). Those
  // names vary per player, so the verbatim title is not a wiki page and even a
  // Go-search on it gets swamped by the names. We scrub them to the generic
  // placeholders the wiki documents these titles with ("Player Name" /
  // "Familiar Name"), so the search keys off the fixed words: e.g. "Player
  // Name and Familiar Name Go To White Citadel" lands the White Citadel Quest
  // article as its top hit. (The bracket form "<playername>" does NOT — the
  // wiki tokenises it differently and the right article drops off the results.)

  // Best-effort lookup of the logged-in player's name. questlog.php is the
  // mainpane frame and carries no name of its own, so read it from a sibling
  // frame: the charpane (and the top menu) link the player's name to
  // charsheet.php. Probe the charpane first, then any other reachable frame.
  // Returns null when no accessible frame exposes it (e.g. questlog.php opened
  // standalone, outside the frameset) — titles are then left untouched rather
  // than mangled.
  function getPlayerName() {
    const docs = [];
    try {
      const frames = window.top && window.top.frames;
      if (frames) {
        const cp = frames['charpane'];
        if (cp) { try { docs.push(cp.document); } catch (e) {} }
        for (let i = 0; i < frames.length; i++) {
          try { docs.push(frames[i].document); } catch (e) {}
        }
      }
    } catch (e) {}
    try { docs.push(document); } catch (e) {}
    for (const doc of docs) {
      if (!doc || !doc.querySelector) continue;
      const a = doc.querySelector('a[href*="charsheet.php"]');
      if (a) {
        // Player names are alphanumerics/spaces/underscores — no parens — so a
        // trailing "(#id)" or "(Level N)" some menus append is safe to drop.
        const name = a.textContent.replace(/\s*\([^)]*\)\s*$/, '').replace(/\s+/g, ' ').trim();
        if (name) return name;
      }
    }
    return null;
  }

  function escapeRegExp(s) {
    return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  }

  function normalizeQuestTitle(name) {
    let out = name;
    // The Azazel quest logs as "Angry <playername>, this is Azazel in Hell." —
    // a pun on the song, not the wiki's name for it, and the player name inside
    // makes even a Go-search useless. The article is "Azazel, Ma Belle"; that
    // title shares no wording with the log line, so no amount of scrubbing gets
    // there. Match the one fixed word and hard-map it.
    if (/\bazazel\b/i.test(out)) return 'Azazel, Ma Belle';
    const player = getPlayerName();
    if (player) {
      out = out.replace(new RegExp(escapeRegExp(player), 'gi'), 'Player Name');
    }
    // White Citadel also embeds the familiar's name, which isn't exposed as
    // reliably as the player's — but that title is otherwise fixed, so collapse
    // the whole dynamic prefix. This also covers the case where the player-name
    // lookup above failed (no reachable charpane).
    if (/ Go to White Citadel$/i.test(out)) {
      return 'Player Name and Familiar Name Go To White Citadel';
    }
    return out;
  }

  function linkQuests() {
    document.querySelectorAll('blockquote b').forEach(function (b) {
      if (b.closest('a')) return;
      const next = b.nextElementSibling;
      if (!next || next.tagName !== 'BR') return;
      addBadge(b, 'after', normalizeQuestTitle(b.textContent.trim()));
    });
  }

  // --- Combat monster (fight.php) --------------------------------------
  // Verified: the current foe's name sits in <span id="monname">, including
  // the leading article ("a gingerbread murderer"; the page also carries a
  // <!-- MONSTERID --> comment, but the wiki has no id lookup, so we go by
  // name). Strip the article so the Go-search lands on the page; badge after
  // the span, searching on the stripped name via addBadge's name argument.
  function linkMonster() {
    const el = document.getElementById('monname');
    if (!el) return;
    addBadge(el, 'after', stripArticle(el.textContent));
  }

  // --- Items acquired (fight.php) --------------------------------------
  // Verified: acquire lines read "You acquire an item: <b>name</b>" and, for
  // bounty drops, "You acquire a bounty item: <b>name</b>" — both wanted, and
  // both caught by the "acquire ... item" test on the line's text. Effect
  // gains ("You acquire an effect: ...") lack "item" and are skipped, as is
  // other bold text on the page (familiar shouts, stat numbers) whose line
  // has no "acquire item". The name is a direct-child <b> of the line cell.
  // CAVEAT (still untested): a multi-quantity drop bolds a number-prefixed,
  // pluralised name ("You acquire <b>5 ginger snapses</b>"), which won't
  // match the singular wiki page; needs a quantity/plural strip once seen.
  function linkDrops() {
    document.querySelectorAll('b').forEach(function (b) {
      const parent = b.parentElement;
      if (parent && /you acquire\b.*\bitems?\b/i.test(parent.textContent)) {
        addBadge(b, 'after');
      }
    });
  }

  // --- Inventory item names (inventory.php) ----------------------------
  // Each item's name is a <b class="ircm"> in its name cell, e.g.
  //   <td id="i1593"><b rel="..." class="ircm">cold hi mein</b>&nbsp;<span>(118)</span>...
  // The clickable description icon beside it is an <img class="hand ircm">
  // (an image, not a <b>), so b.ircm uniquely selects names. Category headers
  // are <b class="tit"> and the page title is a plain white <b>, so neither is
  // matched. No article stripping: item names can legitimately start with "a"
  // (e.g. "a little sump'm sump'm").
  function linkInventory() {
    document.querySelectorAll('b.ircm')
      .forEach(function (b) { addBadge(b, 'after'); });
  }


  // === feature: inventory tools =========================================
  //
  // Was its own equip-optimize.js (which had already absorbed
  // inventory-collapse.js). Two entries, because they are two independently
  // useful things on one page: "Optimize for this" only appears on the
  // equipment view, the Collapse all / Expand all bar on any categorised
  // inventory. Each keeps its own idempotency guard so one bailing never
  // suppresses the other.
  //
  // They share getEntries/isCollapsed/flipTo -- the optimizer expands every
  // category so worn items rejoin the list, the bar flips them either way.
  // Note this is the `inventory` cookie; sell-sort above mirrors `sellstuff`.
  //
  // build() was renamed buildEquipOptimizer(): too generic for a scope this
  // crowded.

  const BUTTON_ID = 'tm-equip-optimize-btn';
  const COLLAPSE_BAR_ID = 'kol-inv-collapse-bar';
  const STATUS_ID = 'tm-equip-optimize-status';
  // Survives the "unequip all" reload: { attr, attrLabel, sortTried }.
  const STATE_KEY = 'tm-equip-optimize';

  // KoL's collapsible category headers (the toggle('Name') links) map to the
  // equip-slot type. Melee + Ranged both feed the single weapon slot; "Back
  // Items" is the container slot. Accessories are handled specially (one pool,
  // three physical slots). Anything not listed here is ignored.
  const SLOT_BY_CATEGORY = {
    'Hats': 'hat',
    'Shirts': 'shirt',
    'Pants': 'pants',
    'Melee Weapons': 'weapon',
    'Ranged Weapons': 'weapon',
    'Off-Hand Items': 'offhand',
    'Back Items': 'container',
    'Familiar Equipment': 'familiarequip',
    'Accessories': 'accessory'
  };

  // Single-item slots in apply order, each with a human label for the summary.
  // Weapon is applied before off-hand: a 2h+ weapon occupies the off-hand slot,
  // and planEquipment() drops the off-hand from the plan in that case (read from
  // the weapon's "[equip (Nh)]" handedness), so they never fight over the slot.
  const SINGLE_SLOTS = [
    { key: 'hat', label: 'Hat' },
    { key: 'shirt', label: 'Shirt' },
    { key: 'pants', label: 'Pants' },
    { key: 'container', label: 'Back' },
    { key: 'familiarequip', label: 'Familiar' },
    { key: 'weapon', label: 'Weapon' },
    { key: 'offhand', label: 'Off-hand' }
  ];
  const ACCESSORY_SLOTS = [
    { slot: 1, label: 'Accessory 1' },
    { slot: 2, label: 'Accessory 2' },
    { slot: 3, label: 'Accessory 3' }
  ];

  // KoL's "[unequip]" links carry the slot they clear as ?type=… . We snapshot
  // what's worn (by that type) before the unequip-all, keyed here to the plan's
  // slot label so a slot the optimizer leaves empty can be refilled with what it
  // held. `accSlot` marks the three accessory slots (which need a slot-specific
  // equip link on restore); the rest map one-to-one to SINGLE_SLOTS labels.
  const WORN_TYPES = {
    hat: { label: 'Hat' },
    shirt: { label: 'Shirt' },
    pants: { label: 'Pants' },
    container: { label: 'Back' },
    familiarequip: { label: 'Familiar' },
    weapon: { label: 'Weapon' },
    offhand: { label: 'Off-hand' },
    acc1: { label: 'Accessory 1', accSlot: 1 },
    acc2: { label: 'Accessory 2', accSlot: 2 },
    acc3: { label: 'Accessory 3', accSlot: 3 }
  };

  // The five KoL elements. "Elemental Damage" / "Elemental Resistance" sorts
  // (sortby ed / er) lump all five together — KoL can't sort by just one — so
  // for those we show an element picker and rank by the chosen element ourselves
  // (see elementValue / scrapeCandidates), instead of trusting KoL's DOM order.
  const ELEMENTS = ['hot', 'cold', 'spooky', 'stench', 'sleaze'];
  const ELEMENTAL_SORTS = { ed: 'Elemental Damage', er: 'Elemental Resistance' };

  // Sorts optimizable in either direction: each gets a two-option picker
  // [maximize, minimize] and value-based ranking that can run ascending.
  // Monster Encounters (adr) is qualitative ("more"/"less Monsters") — see
  // encountersValue — so its picker is More/Fewer.
  const DIRECTIONAL_SORTS = { ml: ['Higher', 'Lower'], adr: ['More', 'Fewer'] };

  // Sort options with no enchantment magnitude to optimize — hide the button.
  const NON_OPTIMIZABLE = { set: true, name: true, qty: true };

  // Seasonal items: their enchantment only applies at certain times, yet KoL
  // still shows the value year-round — so without this they'd be "optimized"
  // into a slot where they currently do nothing. Keyed by lowercased item name;
  // each predicate says whether the bonus is live for the given Date. When it
  // isn't, the item is skipped as a candidate. Add more entries as needed.
  const SEASONAL_ITEMS = {
    'perfect christmas scarf': function (d) { return d.getMonth() === 11; }, // Dec
    'mr. accessaturday': function (d) { return d.getDay() === 6; }           // Sat
  };

  // Items whose value for a given sort isn't what the static annotation shows
  // (e.g. date-dependent bonuses). Keyed by lowercased name -> { sortKey:
  // function(Date) -> value }; when the current sort matches, this replaces the
  // parsed value. Add more entries as needed.
  const VALUE_OVERRIDES = {
    'gingerbeard': {
      adv: function (d) { return d.getMonth() === 11 ? 9 : 6; } // +9 Dec, else +6
    }
  };

  // --- Persisted run state ----------------------------------------------
  function loadState() {
    try {
      const o = JSON.parse(sessionStorage.getItem(STATE_KEY));
      return (o && typeof o === 'object') ? o : null;
    } catch (e) {
      return null;
    }
  }
  function saveState(o) { sessionStorage.setItem(STATE_KEY, JSON.stringify(o)); }
  function clearState() { sessionStorage.removeItem(STATE_KEY); }

  // --- Page scraping ----------------------------------------------------

  // The enchantment sort dropdown (changing it re-sorts and shows a blue value
  // next to each item). Only present on the equipment view, so its presence is
  // also our "are we on the right tab?" gate.
  function findSortDropdown() {
    return document.querySelector('select[name="sortby"]');
  }

  // Label of the attribute currently sorted by, e.g. "HP Regen".
  function selectedAttributeLabel(dropdown) {
    const opt = dropdown && dropdown.options[dropdown.selectedIndex];
    return opt ? opt.textContent.trim() : '';
  }

  function getUnequipAllHref() {
    const a = document.querySelector('a[href*="action=unequipall"]');
    return a ? a.href : null;
  }

  // Snapshot what's currently equipped, before the unequip-all wipes it. Each
  // worn item is displayed next to an "[unequip]" link whose ?type=… names its
  // slot (hat, weapon, offhand, acc1…acc3, familiarequip, container, …); the
  // item name sits in the same cell (a descitem link, or failing that a <b>).
  // Returns { type: itemName } for the types we know how to restore (WORN_TYPES);
  // restore() re-matches those names to equip links after the reload.
  function scrapeWornItems() {
    const worn = {};
    document.querySelectorAll('a[href*="action=unequip"]').forEach(function (a) {
      const m = /[?&]type=([a-z0-9]+)/i.exec(a.getAttribute('href') || '');
      if (!m) return; // e.g. action=unequipall carries no type
      const type = m[1].toLowerCase();
      if (!WORN_TYPES[type]) return;
      const cell = a.closest('td') || a.parentElement;
      if (!cell) return;
      const nameEl = cell.querySelector('a[onclick*="descitem"]') ||
        cell.querySelector('b');
      const name = nameEl ? nameEl.textContent.trim() : '';
      if (name) worn[type] = name;
    });
    return worn;
  }

  // Pull a comparable number out of a blue annotation like "(30-60 HP Regen)",
  // "(+5 Moxie)" or "(+10% Item Drops)". We use the low end of a range, matching
  // how KoL itself orders these lists (descending by the low end). Ranking
  // *within* a category comes from KoL's DOM order, not this number — value is
  // only used where KoL gives no order: merging the two weapon categories and
  // the 1h+offhand vs 2h total. Returns null if there's no number.
  function parseValue(text) {
    const nums = (text.match(/-?\d+(?:\.\d+)?/g) || []).map(Number);
    return nums.length ? Math.min.apply(null, nums) : null;
  }

  // Per-element value for the elemental sorts. Verified against live er and ed
  // pages. Each annotation is one line:
  //   er, single:    "Serious Hot Resistance [+3]"
  //   er, all:       "Serious Resistance to All Elements [+3]"  (+3 to each)
  //   ed, single:    "Hot Damage +5"
  //   ed, all:       "Prismatic Damage +5"                      (+5 to each)
  // (In ed the element word / "Prismatic" is split across colored <font> tags,
  // but textContent flattens it back to plain text.) The magnitude is the first
  // signed number (covers both the [+N] and +N shapes). The all-elements case is
  // flagged by "All Elements" (er) or "Prismatic" (ed).
  //
  // For a specific element: the item counts if it names that element or is an
  // all-elements line; value is that number. For 'all': sum over the five
  // elements — an all-elements line covers all five (N×5), a single line one (N)
  // — so 'all' rewards breadth. For 'any': the strongest single value regardless
  // of element (a single-element line's number, or an all-elements line's per-
  // element number), so it rewards magnitude rather than coverage.
  function elementValue(text, element) {
    const nums = (text.match(/[+-]?\d+/g) || []).map(Number);
    if (!nums.length) return null;
    if (element === 'any') return Math.max.apply(null, nums);
    const n = nums[0];
    const isAll = /all elements|prismatic/i.test(text);
    const has = function (el) { return new RegExp('\\b' + el + '\\b', 'i').test(text); };

    if (element === 'all') {
      if (isAll) return n * ELEMENTS.length;
      return ELEMENTS.some(has) ? n : null;
    }
    if (isAll) return n;
    return has(element) ? n : null;
  }

  // Monster Encounters (adr) annotations are qualitative, with no magnitude:
  // "(more Monsters)" / "(less Monsters)". Map them to +1 / -1 so the directional
  // ranking and sign-filter work; combat modifiers stack, so each slot taking
  // one matching item pushes encounters further in the chosen direction.
  function encountersValue(text) {
    if (/more monster/i.test(text)) return 1;
    if (/less monster/i.test(text)) return -1;
    return null;
  }

  // Pick the value parser for the current sort: per-element (ed/er), qualitative
  // encounters (adr), or the generic signed number (everything else).
  function makeValueFn(attr, element) {
    if (element) return function (t) { return elementValue(t, element); };
    if (attr === 'adr') return encountersValue;
    return parseValue;
  }

  // --- Collapsible categories -------------------------------------------
  // Shared by both features on this page: the optimizer expands everything so
  // worn items rejoin the list, and the Collapse all / Expand all bar flips the
  // lot either way. One copy, so the two can't drift apart.
  //
  // Each collapsible category is a <b class="tit"><a class="nounder"
  // href="javascript:toggle('Food and Drink');">. Its open/closed state is read
  // from the sibling <div class="collapse" id="sectionN"> inside the same
  // table.stuffbox (display:none = collapsed, display:inline = open).
  function getEntries() {
    const entries = [];
    document.querySelectorAll('b.tit a.nounder').forEach(function (a) {
      const m = /toggle\('(.+?)'\)/.exec(a.getAttribute('href') || '');
      if (!m) return;
      const box = a.closest('table.stuffbox');
      const div = box && box.querySelector('div.collapse[id^="section"]');
      if (!div) return;
      entries.push({ name: m[1], div: div });
    });
    return entries;
  }

  function isCollapsed(div) {
    // Inline style is what KoL's toggle() sets; trust it, but fall back to
    // computed style if some other path cleared the inline value.
    const d = div.style.display;
    if (d === 'none') return true;
    if (d === 'inline' || d === 'block' || d === 'inline-block') return false;
    return getComputedStyle(div).display === 'none';
  }

  // Flip one category to a target state. Prefer the page's own toggle(): it
  // keeps the "inventory" cookie in sync, updates the "(click to open)" label,
  // and AJAX-loads a section's items the first time it is opened. Only call it
  // when a flip is actually needed, so we never toggle a section that is
  // already in the wanted state. Returns true if it flipped.
  function flipTo(entry, collapse) {
    if (isCollapsed(entry.div) === collapse) return false; // already correct
    if (typeof window.toggle === 'function') {
      window.toggle(entry.name);
      return true;
    }
    // Fallback: plain DOM flip (no cookie / no lazy-load) if toggle() is gone.
    entry.div.style.display = collapse ? 'none' : 'inline';
    const box = entry.div.closest('table.stuffbox');
    const label = box && box.querySelector('.collapsed');
    if (label) label.textContent = collapse ? '(click to open)' : '';
    return true;
  }

  // Expand every collapsed category. Returns true if anything was expanded.
  function expandAllCategories() {
    let expanded = false;
    getEntries().forEach(function (e) {
      if (flipTo(e, false)) expanded = true;
    });
    return expanded;
  }

  // After expanding we may have triggered AJAX section loads; wait until the
  // item count stops growing (or a cap) before scraping.
  function waitForStableItems(cb) {
    let last = -1, stable = 0, tries = 0;
    (function tick() {
      const n = document.querySelectorAll('table.item[id^="ic"]').length;
      if (n === last) {
        if (++stable >= 2) return cb();
      } else {
        stable = 0;
        last = n;
      }
      if (++tries > 100) return cb(); // ~5s cap; proceed with what we have
      setTimeout(tick, 50);
    })();
  }

  // NOTE: KoL sorts each category smartly for the chosen attribute, with the
  // better equipment higher up the list (and it handles flat vs % the way the
  // game considers correct). So an item's position *within its category* is the
  // authoritative ranking — we trust that DOM order rather than re-deriving a
  // "best" from the displayed number. The parsed value is only a fallback for
  // the two comparisons KoL leaves to us: merging the two weapon categories
  // (Melee / Ranged) and weighing 1h+offhand against a 2h weapon.
  //
  // Collect candidate items per slot type. A candidate is an item that (a) has
  // an [equip] link (owned, equippable, requirements met) and (b) carries a
  // blue value annotation for the current sort (so it contributes to the
  // attribute). Each item lives inside a collapsible category whose
  // toggle('Name') tells us the slot.
  //
  // Returns { slotKey: [ { id, name, cat, index, value, isPercent, valueText,
  // hands, links } ] }. `cat` is the KoL category name and `index` the item's
  // rank within that category (0 = top = KoL's best), which is how we honour
  // "match KoL's sort order". `links` is [ { slot, href } ] — slot is null for
  // normal items, or 1/2/3 for the per-slot accessory equip links KoL renders.
  // `valueFn(text)` parses an item's value for the current sort (see
  // makeValueFn); items it returns null for aren't candidates. `attr` is the
  // current sort key, used for per-item value overrides.
  function scrapeCandidates(valueFn, attr) {
    const bySlot = {};
    const now = new Date(); // for seasonal items / date-dependent overrides

    document.querySelectorAll('b.tit a.nounder').forEach(function (a) {
      const m = /toggle\('(.+?)'\)/.exec(a.getAttribute('href') || '');
      if (!m) return;
      const slotKey = SLOT_BY_CATEGORY[m[1]];
      if (!slotKey) return;

      const box = a.closest('table.stuffbox');
      if (!box) return;

      // Rank candidates by their order within this (already KoL-sorted)
      // category; only count items we actually keep, preserving relative order.
      let index = 0;
      box.querySelectorAll('table.item[id^="ic"]').forEach(function (item) {
        const equipLinks = Array.prototype.slice.call(
          item.querySelectorAll('a[href*="action=equip"]')
        );
        if (!equipLinks.length) return; // worn / unowned / requirements unmet

        const valueEl = item.querySelector('font[color="blue"]');
        if (!valueEl) return; // no value for this attribute

        const nameEl = item.querySelector('b');
        const name = nameEl ? nameEl.textContent.trim() : '(item ' + item.id + ')';
        const key = name.toLowerCase();

        // Skip seasonal items whose bonus isn't active today (KoL still shows
        // their value, so they'd otherwise be equipped where they do nothing).
        const season = SEASONAL_ITEMS[key];
        if (season && !season(now)) return;

        // Per-item value override (e.g. date-dependent bonuses the static
        // annotation doesn't reflect); else parse the annotation.
        const ov = VALUE_OVERRIDES[key];
        const value = (ov && ov[attr]) ? ov[attr](now)
          : valueFn(valueEl.textContent);
        if (value === null) return; // no value for this sort/element/direction

        const links = equipLinks.map(function (l) {
          const sm = /[?&]slot=(\d+)/.exec(l.href);
          return { slot: sm ? Number(sm[1]) : null, href: l.href };
        });

        // Weapons render their handedness in the link text: "[equip (1h)]",
        // "[equip (2h)]", "[equip (3h)]" (3h is a joke type that still takes
        // two hands). Anything 2h+ occupies the off-hand slot too. Plain
        // "[equip]" (non-weapons) leaves hands null.
        let hands = null;
        equipLinks.forEach(function (l) {
          const hm = /\((\d+)h\)/i.exec(l.textContent);
          if (hm) hands = Number(hm[1]);
        });

        (bySlot[slotKey] = bySlot[slotKey] || []).push({
          id: item.id.slice(2), // "ic7468" -> "7468"
          name: name,
          cat: m[1],
          index: index++,
          value: value,
          isPercent: /%/.test(valueEl.textContent),
          valueText: valueEl.textContent.trim().replace(/^\(|\)$/g, ''),
          hands: hands,
          links: links
        });
      });
    });

    return bySlot;
  }

  // For restore: map every owned, equippable item (lowercased name) to its equip
  // links, regardless of whether it carries a value for the current sort — a slot
  // we're refilling with its original item may hold something the current sort
  // doesn't score. Mirrors scrapeCandidates' link/handedness parsing but over the
  // full list. Returns { name: { links: [ { slot, href } ], hands } }; first item
  // of a given name wins (duplicates are interchangeable for restore). `hands`
  // lets restore() honour the 2h-weapon-eats-the-off-hand rule.
  function scrapeEquipLinksByName() {
    const byName = {};
    document.querySelectorAll('table.item[id^="ic"]').forEach(function (item) {
      const equipLinks = Array.prototype.slice.call(
        item.querySelectorAll('a[href*="action=equip"]')
      );
      if (!equipLinks.length) return; // worn / unowned / requirements unmet
      const nameEl = item.querySelector('b');
      if (!nameEl) return;
      const key = nameEl.textContent.trim().toLowerCase();
      if (byName[key]) return;
      const links = equipLinks.map(function (l) {
        const sm = /[?&]slot=(\d+)/.exec(l.href);
        return { slot: sm ? Number(sm[1]) : null, href: l.href };
      });
      let hands = null;
      equipLinks.forEach(function (l) {
        const hm = /\((\d+)h\)/i.exec(l.textContent);
        if (hm) hands = Number(hm[1]);
      });
      byName[key] = { links: links, hands: hands };
    });
    return byName;
  }

  // --- Optimization -----------------------------------------------------

  // Build the list of equips to perform. Each slot's pick follows KoL's own
  // sort order (see bestOf), except in value mode (byValue=true: the elemental
  // sorts and the directional sorts ml/adr) where KoL's order isn't what we want
  // — we rank by the parsed value, descending, or ascending when lowerBetter.
  // In value mode we also drop items on the wrong side of zero (see beneficial),
  // since after unequip-all an empty slot contributes 0 and a wrong-sign item
  // would be worse than nothing. Weapon + off-hand are decided together (a 2h
  // weapon takes the off-hand slot — see preferTwoHand); accessories take the
  // top three into slots 1/2/3. Returns [ { label, name, valueText, href } ].
  function planEquipment(bySlot, byValue, lowerBetter) {
    const plan = [];

    const weapons = beneficial(bySlot.weapon, byValue, lowerBetter);
    const oneHand = bestOf(weapons.filter(function (w) {
      return (w.hands || 1) === 1;
    }), byValue, lowerBetter);
    const twoHand = bestOf(weapons.filter(function (w) {
      return (w.hands || 1) >= 2;
    }), byValue, lowerBetter);
    const offhand = bestOf(beneficial(bySlot.offhand, byValue, lowerBetter),
      byValue, lowerBetter);
    const useTwoHand = preferTwoHand(oneHand, twoHand, offhand, lowerBetter);
    const weaponChoice = useTwoHand ? twoHand : oneHand;
    const offhandChoice = useTwoHand ? null : offhand;

    SINGLE_SLOTS.forEach(function (slot) {
      let best;
      if (slot.key === 'weapon') best = weaponChoice;
      else if (slot.key === 'offhand') best = offhandChoice;
      else best = bestOf(beneficial(bySlot[slot.key], byValue, lowerBetter),
        byValue, lowerBetter);
      if (!best) return;
      plan.push({
        label: slot.label, name: best.name,
        valueText: best.valueText, href: best.links[0].href,
        hands: best.hands
      });
    });

    // Accessories are one category — by KoL's DOM order normally, or by value in
    // value mode — take the top three distinct items into slots 1/2/3.
    const accs = beneficial(bySlot.accessory, byValue, lowerBetter)
      .sort(function (a, b) {
        if (!byValue) return a.index - b.index;
        return lowerBetter ? a.value - b.value : b.value - a.value;
      });
    ACCESSORY_SLOTS.forEach(function (s, i) {
      const item = accs[i];
      if (!item) return;
      // Prefer the link that targets this physical slot; fall back to the first.
      const link = item.links.find(function (l) { return l.slot === s.slot; }) ||
        item.links[0];
      plan.push({
        label: s.label, name: item.name,
        valueText: item.valueText, href: link.href
      });
    });

    return plan;
  }

  // Build the "put back what you had" steps for slots the optimizer left empty.
  // `worn` is the pre-unequip snapshot (type -> name); `byName` maps names to
  // equip links (post-unequip, so the originals are equippable again). The
  // optimizer's picks are authoritative — a restore never displaces one — so we
  // only touch labels absent from `optimize`. Weapon and off-hand are decided
  // together because a 2h+ weapon claims the off-hand slot: we won't restore a 2h
  // weapon over an off-hand the optimizer kept, and won't restore an off-hand
  // under a 2h weapon (optimizer's or restored). Returns [ { label, name,
  // valueText, href } ] to append after the optimize plan.
  function planRestore(optimize, worn, byName) {
    if (!worn) return [];
    const filled = {};
    let optimizerWeaponHands = null;
    optimize.forEach(function (p) {
      filled[p.label] = true;
      if (p.label === 'Weapon') optimizerWeaponHands = p.hands || 1;
    });

    // Resolve a worn item to a restore step, choosing an accessory-slot-specific
    // equip link when one applies. Returns null if the item can't be re-equipped.
    function stepFor(type) {
      const spec = WORN_TYPES[type];
      const name = worn[type];
      if (!spec || !name) return null;
      const entry = byName[name.toLowerCase()];
      if (!entry) return null;
      const link = spec.accSlot
        ? (entry.links.find(function (l) { return l.slot === spec.accSlot; }) ||
           entry.links[0])
        : entry.links[0];
      return {
        label: spec.label, name: name, valueText: 'kept',
        href: link.href, hands: entry.hands
      };
    }

    const restore = [];

    // Slots with no cross-slot interaction.
    ['hat', 'shirt', 'pants', 'container', 'familiarequip',
     'acc1', 'acc2', 'acc3'].forEach(function (type) {
      if (filled[WORN_TYPES[type].label]) return;
      const step = stepFor(type);
      if (step) restore.push(step);
    });

    // Weapon: only if the optimizer left it empty, and never a 2h weapon over an
    // off-hand the optimizer equipped. Track the handedness of whatever ends up
    // in the weapon slot to gate the off-hand below.
    let weaponHands = filled['Weapon'] ? optimizerWeaponHands : null;
    if (!filled['Weapon']) {
      const w = stepFor('weapon');
      if (w && !((w.hands || 1) >= 2 && filled['Off-hand'])) {
        restore.push(w);
        weaponHands = w.hands || 1;
      }
    }

    // Off-hand: only if empty and the weapon in effect leaves the slot free.
    if (!filled['Off-hand'] && !(weaponHands >= 2)) {
      const o = stepFor('offhand');
      if (o) restore.push(o);
    }

    return restore;
  }

  // KoL's best of a list. Within one category, "best" is simply the earliest
  // (KoL already sorted it best-first, handling flat vs % its own way). Across
  // different categories — only weapons span two (Melee / Ranged), where KoL
  // gives no relative order — fall back to value. In value mode (byValue) rank
  // purely by value: highest, or lowest when lowerBetter (minimize ML).
  function bestOf(list, byValue, lowerBetter) {
    if (!list || !list.length) return null;
    return list.reduce(function (best, it) {
      return koLBetter(it, best, byValue, lowerBetter) ? it : best;
    });
  }
  function koLBetter(a, b, byValue, lowerBetter) {
    if (byValue) return lowerBetter ? a.value < b.value : a.value > b.value;
    if (a.cat === b.cat) return a.index < b.index;
    return a.value > b.value;
  }

  // In value mode, keep only items on the beneficial side of zero: positive when
  // maximizing, negative when minimizing (ML lower). An empty slot is 0, so a
  // wrong-sign item would be worse than equipping nothing. Outside value mode we
  // trust KoL's order and don't filter.
  function beneficial(list, byValue, lowerBetter) {
    if (!byValue) return (list || []).slice();
    return (list || []).filter(function (it) {
      return lowerBetter ? it.value < 0 : it.value > 0;
    });
  }

  // Unit shared by a set of candidates: 'flat', 'pct', or 'mixed' (some of each).
  function unitOf(items) {
    let flat = false, pct = false;
    items.forEach(function (it) {
      if (it) { if (it.isPercent) pct = true; else flat = true; }
    });
    return (flat && pct) ? 'mixed' : (pct ? 'pct' : 'flat');
  }

  // Choose between the two weapon configurations:
  //   A) best 1h weapon + best off-hand   B) best 2h+ weapon alone
  // We can only add the off-hand to the 1h weapon when their values share a unit
  // (you can't add "+X" to "+Y%"). When A and B are comparable in the same unit,
  // take the better total (higher, or lower when lowerBetter). Otherwise — a 2h
  // is the only option, or the units are mixed so a total is meaningless —
  // default to filling both slots (config A), except when there's no 1h weapon
  // and no off-hand at all.
  function preferTwoHand(oneHand, twoHand, offhand, lowerBetter) {
    if (!twoHand) return false;
    if (!oneHand && !offhand) return true; // a 2h weapon is the only option
    const unitA = unitOf([oneHand, offhand]);
    if (unitA !== 'mixed' && unitA === unitOf([twoHand])) {
      const totalA = (oneHand ? oneHand.value : 0) +
        (offhand ? offhand.value : 0);
      return lowerBetter ? twoHand.value < totalA : twoHand.value > totalA;
    }
    return false; // units not comparable: keep both slots filled
  }

  // --- Applying equipment ----------------------------------------------
  // Fire each equip via its own [equip] href (GET, same as clicking the link),
  // sequentially, then reload once. The server is authoritative about what can
  // actually be worn, so we let each equip settle before the next and re-read
  // the truth on reload (mirrors iotm.js's multi-slot apply).
  async function applyPlan(plan, status) {
    for (let i = 0; i < plan.length; i++) {
      const step = plan[i];
      status.textContent = 'Equipping ' + step.label + ' (' + (i + 1) + '/' +
        plan.length + ')…';
      try {
        await fetch(step.href, { credentials: 'same-origin' });
      } catch (e) {
        status.textContent = 'Equip failed on ' + step.label + ': ' + e;
        console.error('Equip Optimize: equip failed', step, e);
        return;
      }
    }
    status.textContent = 'Done, reloading…';
    location.reload();
  }

  // --- Flow -------------------------------------------------------------

  // Step 1 (user click): confirm, stash the chosen attribute, then unequip all.
  // That reload lands us back here with state set, where resume() takes over —
  // with nothing equipped, every owned item rejoins the lists, so the per-slot
  // "best" is a true comparison rather than "best among items not already worn".
  function start(dropdown, status, opts) {
    const attr = dropdown.value;
    const element = opts.element || null;
    const lowerBetter = !!opts.lower;
    // Elemental sorts and the directional sorts rank by parsed value, not by
    // KoL's DOM order.
    const byValue = !!element || !!DIRECTIONAL_SORTS[attr];
    let suffix = '';
    if (element && element !== 'all') {
      suffix = ' (' + element + ')';
    } else if (DIRECTIONAL_SORTS[attr]) {
      const labels = DIRECTIONAL_SORTS[attr];
      suffix = ' (' + (lowerBetter ? labels[1] : labels[0]).toLowerCase() + ')';
    }
    const attrLabel = selectedAttributeLabel(dropdown) + suffix;

    const href = getUnequipAllHref();
    if (!confirm('Optimize equipment for "' + attrLabel + '"?\n\n' +
        (href ? 'This unequips everything, then equips ' : 'This equips ') +
        'the best item for "' + attrLabel + '" in each slot, keeping your ' +
        'current gear in any slot with no better option.')) {
      status.textContent = 'Cancelled.';
      return;
    }
    // Snapshot what's worn now (before the unequip-all wipes it) so resume() can
    // put the original item back in any slot the optimizer leaves empty.
    const state = {
      attr: attr, attrLabel: attrLabel, sortTried: false,
      element: element, byValue: byValue, lowerBetter: lowerBetter,
      worn: scrapeWornItems()
    };
    if (!href) {
      // No "unequip all" link means nothing is equipped, so there's nothing to
      // unequip and no reload to wait for — optimize this page directly. (The
      // sort already matches what the user just clicked, so resume() won't need
      // to re-sort; it expands, scrapes, equips, then reloads.)
      status.textContent = 'Nothing equipped; optimizing…';
      resume(dropdown, status, state);
      return;
    }
    saveState(state);
    status.textContent = 'Unequipping all…';
    location.href = href; // GET → reload back into resume()
  }

  // Step 2 (after the unequip-all reload): make sure we're still sorted by the
  // saved attribute, expand everything, equip the best per slot, then put the
  // originally-worn item back in any slot that got nothing.
  function resume(dropdown, status, state) {
    // The sort is a sticky KoL preference, so it normally survives the reload;
    // if it didn't, re-apply it (one shot) and let the resubmit reload us.
    if (dropdown.value !== state.attr) {
      if (state.sortTried) {
        clearState();
        status.textContent = 'Could not apply the "' + state.attrLabel +
          '" sort; aborting.';
        return;
      }
      state.sortTried = true;
      saveState(state);
      status.textContent = 'Re-applying sort…';
      dropdown.value = state.attr;
      (dropdown.form || dropdown.closest('form')).submit();
      return;
    }

    status.textContent = 'Expanding categories…';
    expandAllCategories();
    waitForStableItems(function () {
      const optimize = planEquipment(
        scrapeCandidates(makeValueFn(state.attr, state.element), state.attr),
        state.byValue, state.lowerBetter);
      // Refill every slot the optimizer left empty with what it held before, so
      // slots only ever change to something better (and nothing is left bare —
      // including the case where the optimizer found nothing at all).
      const plan = optimize.concat(
        planRestore(optimize, state.worn, scrapeEquipLinksByName()));
      if (!plan.length) {
        clearState();
        status.textContent = 'No equippable items have a value for "' +
          state.attrLabel + '".';
        return;
      }
      // Clear before equipping so a mid-run failure (or the final reload)
      // doesn't loop us back into resume().
      clearState();
      applyPlan(plan, status);
    });
  }

  // --- UI ---------------------------------------------------------------
  function buildEquipOptimizer() {
    // Idempotency guard: the page/loader may run us more than once.
    if (document.getElementById(BUTTON_ID)) return;

    const dropdown = findSortDropdown();
    if (!dropdown) return; // not the equipment view

    // Nothing to optimize for these sorts (Outfit / Name / Item Quantity) —
    // don't show the button at all.
    if (NON_OPTIMIZABLE[dropdown.value]) return;

    const btn = document.createElement('button');
    btn.id = BUTTON_ID;
    btn.type = 'button'; // must not submit the sort form
    btn.textContent = 'Optimize for this';
    btn.style.cssText = 'margin-left:6px;cursor:pointer;';

    const status = document.createElement('span');
    status.id = STATUS_ID;
    status.style.cssText =
      'margin-left:8px;font-family:arial;font-size:9pt;color:#006;';

    // Secondary picker for sorts that need a sub-choice:
    //  - elemental (ed/er): which element to optimize. "All" sums coverage
    //    across the five; "Any" takes the strongest single value regardless of
    //    element; or pick one specific element.
    //  - directional (ml / adr): which way to optimize (maximize/minimize).
    let elemSel = null, dirSel = null;
    if (ELEMENTAL_SORTS[dropdown.value]) {
      elemSel = makeSelect('tm-equip-optimize-elem',
        [['all', 'All elements'], ['any', 'Any element']].concat(
          ELEMENTS.map(function (e) {
            return [e, e.charAt(0).toUpperCase() + e.slice(1)];
          })));
    } else if (DIRECTIONAL_SORTS[dropdown.value]) {
      const labels = DIRECTIONAL_SORTS[dropdown.value];
      dirSel = makeSelect('tm-equip-optimize-dir',
        [['higher', labels[0]], ['lower', labels[1]]]);
    }

    btn.addEventListener('click', function () {
      start(dropdown, status, {
        element: elemSel ? elemSel.value : null,
        lower: dirSel ? dirSel.value === 'lower' : false
      });
    });

    let anchor = dropdown;
    [elemSel, dirSel].forEach(function (sel) {
      if (sel) { anchor.insertAdjacentElement('afterend', sel); anchor = sel; }
    });
    anchor.insertAdjacentElement('afterend', btn);
    btn.insertAdjacentElement('afterend', status);

    // Mid-run? Pick up where the unequip-all reload left off, restoring the
    // sub-choice in its picker so it reflects what's being applied.
    const state = loadState();
    if (state) {
      if (elemSel && state.element) elemSel.value = state.element;
      if (dirSel && state.lowerBetter) dirSel.value = 'lower';
      resume(dropdown, status, state);
    }
  }

  // Build a <select> from [value, label] pairs.
  function makeSelect(id, pairs) {
    const sel = document.createElement('select');
    sel.id = id;
    sel.style.cssText = 'margin-left:6px;';
    pairs.forEach(function (pair) {
      const o = document.createElement('option');
      o.value = pair[0];
      o.textContent = pair[1];
      sel.appendChild(o);
    });
    return sel;
  }

  // --- Collapse all / Expand all ----------------------------------------
  // Sits above the first category on any categorized inventory view (not just
  // the equipment one), so it is built independently of the optimizer.
  function buildCollapseBar() {
    if (document.getElementById(COLLAPSE_BAR_ID)) return;

    const firstBox = document.querySelector('table.stuffbox');
    if (!firstBox) return; // not the categorized list view

    const bar = document.createElement('div');
    bar.id = COLLAPSE_BAR_ID;
    bar.style.cssText = 'text-align:center;margin:4px auto;padding:4px;width:95%;';

    const btn = document.createElement('button');
    btn.type = 'button';
    btn.style.cssText = 'cursor:pointer;padding:2px 10px;font-weight:bold;';
    bar.appendChild(btn);

    // Decide the button's next action and label from the live page state: if
    // every category is currently open, the next click collapses them all;
    // otherwise (all closed or a mix) the next click expands them all.
    function refreshLabel() {
      const entries = getEntries();
      const allOpen = entries.length > 0 && entries.every(function (e) {
        return !isCollapsed(e.div);
      });
      btn.dataset.action = allOpen ? 'collapse' : 'expand';
      btn.textContent = allOpen ? 'Collapse all' : 'Expand all';
    }

    btn.addEventListener('click', function () {
      const collapse = btn.dataset.action === 'collapse';
      getEntries().forEach(function (e) { flipTo(e, collapse); });
      refreshLabel();
    });

    const anchor = firstBox.closest('a[name]') || firstBox;
    anchor.parentNode.insertBefore(bar, anchor);
    refreshLabel();
  }


  // === feature: charpane heal and buff buttons ==========================
  //
  // Was its own charpane-heal.js (which had already absorbed
  // skills-cast-max.js). Two entries: the "heal" button by the HP line, and
  // the "max" button on each prolongable buff. They share one fetch of the
  // skills page and one sessionStorage cache of it, which matters because the
  // charpane is rebuilt on most turns.
  //
  // #tm-charpane-heal IS A CROSS-FRAME API: auto-mine.js reaches into the
  // charpane and clicks that button when a run hits its HP floor. Renaming
  // the id silently breaks mining runs -- see AGENTS.md.
  //
  // Renamed on the way in: makeButton -> makeHealButton (the host's makeButton
  // builds a different kind of button), getStatus -> healStatus (it throws;
  // bossStatus does not), addButton -> addHealButton. ORIGIN was dropped as a
  // duplicate of the host's.

  // This script runs INSIDE the charpane frame, so `document` is the sidebar
  // and same-origin fetches to api.php / the skills form work directly.
  //
  // Design mirrors TwilightHeroes/header-heal.js: a configurable, priority-
  // ordered list of heal skills matched against the skills page *by name*, so
  // there are no hardcoded skill ids -- each id is scraped from the page's
  // `whichskill=<id>` icon links, and the pwd hash comes from api.php. Casts go
  // to runskillz.php (ajax=1). Unlike the TH version we don't track MP
  // cost at all -- after each cast we re-read HP and judge the cast purely by
  // whether HP went up. That naturally handles heal-to-full skills, per-cast
  // heals, out-of-MP, and once-per-day cooldowns without special cases.
  //
  // This file holds TWO charpane features, because they read the same page:
  //
  //   1. the "heal" button by the HP line (below), and
  //   2. the "max" button next to each prolongable buff (further down).
  //
  // Both need to know what the skills page lists, so there is exactly one
  // fetchSkillsDoc() and one sessionStorage cache of it, and one scrape of it
  // (buildSkillMap) that the heal half reads ids out of and the max half reads
  // names out of. These were two scripts and had drifted into two copies of
  // that; keep it one. Each half owns its own idempotency guard, so one being
  // absent from a given charpane (no HP icon, no prolongable buffs) never
  // suppresses the other. Note the KoL counterpart to
  // TwilightHeroes/skills-cast-max.js lives here now, not under that name.

  // ---------------------------------------------------------------------------
  // Configuration: the heal skills to consider, highest priority first.
  //
  //   name     - matched against the START of a skill's <option> text in the
  //              skills form (case-insensitive), e.g. "Cannelloni Cocoon".
  //   priority - lower numbers are tried first. Each pass, skills are tried in
  //              priority order until one actually raises HP; then we start over
  //              from the top. When no skill raises HP, we stop.
  //
  // Listing a skill you don't own is harmless -- it just won't be found in the
  // form. Adjust this list to whatever heals your class/path actually has.
  // ---------------------------------------------------------------------------
  const HEAL_SKILLS = [
    { name: 'Cannelloni Cocoon', priority: 1 }, // Pastamancer: heals up to 1,000 HP
    { name: 'Lasagna Bandages', priority: 2 },
    { name: 'Tongue of the Walrus', priority: 3 }, // Seal Clubber: large heal
    { name: 'Disco Power Nap', priority: 4 },
    { name: 'Disco Nap', priority: 5 },
    { name: 'Saucy Salve', priority: 6 }, // cheap top-up
  ];

  // Hard cap on total heal casts so a misread (HP that never reaches max) can't
  // loop forever firing requests.
  const MAX_CASTS = 60;

  // How many single casts the "max" loop fallback will attempt before giving
  // up, in case MP can't be read (so it can't run away firing requests forever).
  const LOOP_CAST_CAP = 60;

  // Pages that may host the skill list. KoL renders each usable skill as an
  // icon whose link/onclick references the skill id via `whichskill=<id>`
  // (e.g. desc_skill.php?whichskill=3012). The skill name comes from the icon's
  // title/alt. We probe these pages in order and use the first that contains
  // such references -- so the ids come straight from the page, never hardcoded.
  const SKILL_PAGE_CANDIDATES = ['skillz.php', 'skills.php'];

  // The fetched skills page is cached for the session so the frequent charpane
  // reloads (every adventure) don't re-hit the server. What it lists changes
  // when you learn/forget a skill (the refresh button forces a re-read), and
  // ALSO with your current state: skillz.php leaves out skills that would do
  // nothing right now, so at full HP it omits Cannelloni Cocoon and the other
  // heals. A page cached at full HP is therefore useless to the heal button,
  // which is why runHeal always re-reads it (fetchSkillsDoc(true)).
  const CACHE_KEY = 'tm-skills-cast-max-html';

  // --- stat reading -----------------------------------------------------------

  // api.php is KoL's canonical status endpoint and returns JSON with hp/maxhp/
  // mp/maxmp (and pwd). We use it instead of scraping the charpane DOM because
  // the live DOM is stale right after a background cast, and the JSON is exact.
  async function healStatus() {
    const res = await fetch(ORIGIN + '/api.php?what=status&for=charpane-heal', {
      credentials: 'same-origin', cache: 'no-store',
    });
    if (!res.ok) throw new Error('api.php returned HTTP ' + res.status);
    const j = await res.json();
    const num = v => parseInt(String(v).replace(/,/g, ''), 10);
    return {
      hp: { cur: num(j.hp), max: num(j.maxhp) },
      mp: { cur: num(j.mp), max: num(j.maxmp) },
      pwd: j.pwd, // password hash, needed to POST/GET the skill cast
    };
  }

  // --- skills page scraping & casting ----------------------------------------

  // Fetch + parse the first candidate page that actually lists skills (contains
  // any `whichskill=<id>` reference). Returns a Document or null. Caches the raw
  // HTML in sessionStorage so repeated charpane reloads don't re-fetch, and so
  // the heal half and the max half share one round trip. `fresh` skips the
  // cached copy (but still stores the new one) -- the heal half needs that,
  // see CACHE_KEY.
  async function fetchSkillsDoc(fresh) {
    if (!fresh) {
      try {
        const cached = sessionStorage.getItem(CACHE_KEY);
        if (cached) return new DOMParser().parseFromString(cached, 'text/html');
      } catch (e) { /* sessionStorage may be unavailable; fetch fresh */ }
    }
    for (const path of SKILL_PAGE_CANDIDATES) {
      try {
        const res = await fetch(ORIGIN + '/' + path, { credentials: 'same-origin', cache: 'no-store' });
        if (!res.ok) continue;
        const html = await res.text();
        if (!/whichskill=\d+/.test(html)) continue;
        try { sessionStorage.setItem(CACHE_KEY, html); } catch (e) { /* ignore */ }
        return new DOMParser().parseFromString(html, 'text/html');
      } catch (e) { /* try the next candidate */ }
    }
    return null;
  }

  // Build a list of { name (lowercased), id } from the skills page. Each usable
  // skill icon links/onclicks to `...whichskill=<id>...` and carries the skill
  // name in the icon's title/alt (or link text). The id is read from the page,
  // so we never hardcode skill ids. A legacy <select name="whichskill"> is also
  // honoured if present, for resilience across KoL skin changes.
  function buildSkillMap(doc) {
    const map = [];
    const seen = new Set();
    const add = (name, id) => {
      name = (name || '').trim().toLowerCase();
      if (!name) return;
      const key = name + '|' + id;
      if (seen.has(key)) return;
      seen.add(key);
      map.push({ name, id: String(id) });
    };

    for (const el of doc.querySelectorAll('[href*="whichskill="], [onclick*="whichskill="]')) {
      const ref = (el.getAttribute('href') || '') + ' ' + (el.getAttribute('onclick') || '');
      const m = ref.match(/whichskill=(\d+)/);
      const img = el.tagName === 'IMG' ? el : el.querySelector('img');
      const name = (img && (img.getAttribute('title') || img.getAttribute('alt'))) || el.textContent;
      add(name, m ? m[1] : null);
    }

    for (const select of doc.querySelectorAll('select[name="whichskill"]')) {
      for (const opt of select.options) add(opt.textContent, opt.value);
    }

    return map;
  }

  // Resolve a configured skill name to its id by prefix-matching the page's
  // skill names (case-insensitive), mirroring the original by-name behaviour.
  // An entry with no readable id can't be cast by id, so it's skipped here --
  // it still counts as castable for the max buttons, which cast by href.
  function findSkillId(skillMap, name) {
    const target = name.trim().toLowerCase();
    const hit = skillMap.find(s => s.id && s.name.startsWith(target));
    return hit ? hit.id : null;
  }

  // The max half's view of the same scrape: just the castable names.
  function skillNameSet(skillMap) {
    return new Set(skillMap.map(s => s.name));
  }

  // Cast a skill once via runskillz.php with ajax=1 so it fires without
  // rendering a full page. The pwd hash comes from api.php (see healStatus).
  async function castOnce(id, pwd) {
    const params = new URLSearchParams({
      action: 'Skillz', whichskill: id, quantity: '1', ajax: '1',
    });
    if (pwd) params.set('pwd', pwd);
    await fetch(ORIGIN + '/runskillz.php?' + params.toString(), {
      credentials: 'same-origin', cache: 'no-store',
    });
  }

  // --- main loop --------------------------------------------------------------

  let running = false;

  async function runHeal(btn) {
    if (running) return;
    running = true;
    setBusy(btn, true, '…');

    try {
      let status = await healStatus();
      if (!status.hp.max) { alert('Heal: could not read your HP.'); return; }
      if (status.hp.cur >= status.hp.max) { return; } // already full

      // Discover each configured skill's id once; ids don't change between casts.
      // Always re-read: HP is below max now, so skillz.php lists the heals it
      // hid while HP was full -- a cached page would be missing them.
      const doc = await fetchSkillsDoc(true);
      if (!doc) { alert('Heal: could not find the skills page.'); return; }
      const skillMap = buildSkillMap(doc);
      const skills = HEAL_SKILLS
        .slice()
        .sort((a, b) => a.priority - b.priority)
        .map(s => {
          const id = findSkillId(skillMap, s.name);
          return id ? Object.assign({}, s, { id }) : null;
        })
        .filter(Boolean);

      if (!skills.length) {
        alert('Heal: none of the configured heal skills were found.');
        return;
      }

      let casts = 0;
      // Each outer pass: try skills in priority order until one raises HP, then
      // restart from the top. Stop when HP is full, nothing helped, or we hit
      // the cast cap.
      while (status.hp.cur < status.hp.max && casts < MAX_CASTS) {
        let progressed = false;
        for (const skill of skills) {
          if (status.hp.cur >= status.hp.max || casts >= MAX_CASTS) break;
          casts++;
          setBusy(btn, true, 'heal ' + casts);
          await castOnce(skill.id, status.pwd);
          const after = await healStatus();
          if (after.hp.cur > status.hp.cur) {
            status = after;
            progressed = true;
            break; // restart from highest priority
          }
          status = after; // cast didn't help; try the next, cheaper skill
        }
        if (!progressed) break; // no skill could raise HP -> done
      }
    } catch (e) {
      alert('Heal failed: ' + (e && e.message ? e.message : e));
    } finally {
      running = false;
      // Refresh the visible charpane so HP/MP reflect what we cast.
      reload();
    }
  }

  // --- button -----------------------------------------------------------------

  function setBusy(btn, busy, label) {
    btn.disabled = busy;
    btn.style.opacity = busy ? '0.5' : '1';
    btn.style.cursor = busy ? 'default' : 'pointer';
    btn.textContent = label;
  }

  // Shared by both halves: after casting anything, the visible charpane is
  // stale, so refresh it.
  function reload() {
    window.location.reload();
  }

  function makeHealButton() {
    const btn = document.createElement('button');
    btn.id = 'tm-charpane-heal';
    btn.type = 'button';
    btn.textContent = 'heal';
    btn.title = 'Cast heal skills until HP is full or none can raise it';
    btn.style.cssText = [
      'margin-left:3px',
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
      'white-space:nowrap',
    ].join(';');
    btn.addEventListener('click', function (e) {
      e.preventDefault();
      e.stopPropagation();
      runHeal(btn);
    });
    return btn;
  }

  // Place the button in the HP cell -- the <td> holding the hp.gif icon, whose
  // text reads "<cur> / <max>". Fall back to the body top if not found.
  function addHealButton() {
    // Idempotency: a previous run may already have inserted the button.
    if (document.getElementById('tm-charpane-heal')) return;

    const btn = makeHealButton();
    const imgs = document.getElementsByTagName('img');
    for (let i = 0; i < imgs.length; i++) {
      if (!/hp\.gif/i.test(imgs[i].getAttribute('src') || '')) continue;
      const td = imgs[i].closest ? imgs[i].closest('td') : imgs[i].parentNode;
      if (td) { td.appendChild(btn); return; }
    }
    document.body.insertBefore(btn, document.body.firstChild);
  }

  // ===========================================================================
  // The "max" button on each prolongable buff
  // ===========================================================================
  //
  // Each prolongable buff is an `<a class="upeffect" href="upeffect.php?efid=
  // ...&qty=1&pwd=HASH">` carrying its own pwd hash. We reuse that href rather
  // than rebuilding it, so we never have to hunt for the pwd ourselves. The
  // existing charpane code already multi-casts by swapping `qty=1` -> `qty=N`
  // and appending `&ajax=1`; we do the same.

  // ---------------------------------------------------------------------------
  // MP reading
  // ---------------------------------------------------------------------------

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

  // Is `skill` (the name read off the charpane up-arrow) castable per the set
  // scraped from skillz.php? Exact match first, then a tolerant prefix match in
  // either direction, since a skill's name and its effect-arrow label can differ
  // slightly in punctuation/length.
  function isCastable(set, skill) {
    const s = (skill || '').trim().toLowerCase();
    if (!s) return false;
    if (set.has(s)) return true;
    for (const n of set) {
      if (n.startsWith(s) || s.startsWith(n)) return true;
    }
    return false;
  }
  // ---------------------------------------------------------------------------
  // casting
  // ---------------------------------------------------------------------------

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
        alert('Cast max (' + name + '): ' + reason + '.');
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
      console.error('Cast max: cast failed.', err);
      alert('Cast max: the cast request failed (see console).');
      setBusy(btn, false, original);
    });
  }
  // ---------------------------------------------------------------------------
  // buttons
  // ---------------------------------------------------------------------------

  function makeMaxButton(href, name) {
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'tm-cast-max';
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

  // A "refresh skills" button placed below the buff list. Clears the cached
  // skillz.php, drops every max button, and re-enhances -- so a skill learned or
  // lost mid-session is reflected without opening a new tab. Anchored to the
  // table holding the buffs; no-op if there are no prolongable buffs to anchor.
  function addRefreshButton() {
    if (document.getElementById('tm-cast-max-refresh')) return;
    const anchor = document.querySelector('a.upeffect');
    const table = anchor && anchor.closest('table');
    if (!table || !table.parentNode) return;

    const btn = document.createElement('button');
    btn.type = 'button';
    btn.id = 'tm-cast-max-refresh';
    btn.textContent = '↻ refresh skills';
    btn.title = 'Re-check skillz.php for castable skills and rebuild the max buttons';
    btn.style.cssText = [
      'padding:0 4px',
      'font-size:8px',
      'font-family:arial,helvetica,sans-serif',
      'line-height:13px',
      'height:15px',
      'cursor:pointer',
      'border:1px solid #888',
      'border-radius:2px',
      'background:#eee',
      'white-space:nowrap'
    ].join(';');
    btn.addEventListener('click', function (e) {
      e.preventDefault();
      e.stopPropagation();
      if (btn.disabled) return;
      const original = btn.textContent;
      setBusy(btn, true, '…');
      try { sessionStorage.removeItem(CACHE_KEY); } catch (err) { /* ignore */ }
      for (const b of document.querySelectorAll('.tm-cast-max')) b.remove();
      for (const l of document.querySelectorAll('a.upeffect[data-tm-cast-max]')) {
        l.removeAttribute('data-tm-cast-max');
      }
      enhance().then(function () { setBusy(btn, false, original); });
    });

    const wrap = document.createElement('div');
    wrap.style.cssText = 'text-align:center;margin:3px 0;';
    wrap.appendChild(btn);
    table.insertAdjacentElement('afterend', wrap);
  }
  // ---------------------------------------------------------------------------
  // enhance
  // ---------------------------------------------------------------------------

  // Item-granted buffs share the .upeffect / upeffect.php link with cast skills,
  // but their up-arrow tooltip reads "Click to use ..." instead of "Click to
  // cast ...". "Cast as many as MP allows" is meaningless for an item, so only
  // act on arrows whose tooltip says cast -- and the skill name itself is the
  // text after "cast", which we match against skillz.php. Returns the skill name
  // or null (item-use buff / no tooltip).
  function castSkillName(link) {
    const img = link.querySelector('img');
    const tip = (img && (img.getAttribute('title') || img.getAttribute('alt'))) || '';
    const m = tip.match(/click to cast\s+(.+)/i);
    return m ? m[1].trim() : null;
  }

  async function enhance() {
    const links = document.querySelectorAll('a.upeffect');
    const pending = [];
    for (let i = 0; i < links.length; i++) {
      const link = links[i];
      // Idempotency: skip a link we've already processed this page load.
      if (link.getAttribute('data-tm-cast-max')) continue;
      const href = link.getAttribute('href');
      if (!href || href.indexOf('upeffect.php') === -1) continue;
      const skill = castSkillName(link);
      if (!skill) continue; // item-use buff, not a cast skill
      pending.push({ link: link, href: href, skill: skill });
    }
    if (!pending.length) { addRefreshButton(); return; }

    // Resolve castability against skillz.php. If it can't be fetched we don't
    // know what's castable, so fall back to the old behaviour (button on every
    // cast arrow) rather than silently dropping the feature on a transient error.
    const doc = await fetchSkillsDoc();
    const castable = doc ? skillNameSet(buildSkillMap(doc)) : null;

    for (const p of pending) {
      p.link.setAttribute('data-tm-cast-max', '1');
      if (castable && !isCastable(castable, p.skill)) continue;
      const name = p.link.getAttribute('rel') || p.skill || 'this buff';
      p.link.insertAdjacentElement('afterend', makeMaxButton(p.href, name));
    }
    addRefreshButton();
  }

  // === feature registry =================================================

  const FEATURES = [
    { name: 'hermit-clovers', path: /\/hermit\.php/i, run: hermitClovers },
    { name: 'beer-garden-guard', path: /\/campground\.php/i, run: beerGardenGuard },
    { name: 'mall-bulk-buy', path: /\/mall\.php/i, run: mallBulkBuy },
    { name: 'inventory-mall-link', path: /\/inventory\.php/i, run: inventoryMallLinks },
    { name: 'inventory-yield-filter', path: /\/inventory\.php/i, run: inventoryYieldFilter },
    { name: 'mcd-always-visible', path: /\/charpane\.php/i, run: mcdAlwaysVisible },
    { name: 'daily-dungeon-skips', path: /\/choice\.php/i, run: dailyDungeonSkips },
    { name: 'sell-sort', path: /\/sellstuff_ugly\.php/i, run: sellSort },
    { name: 'boss-aggro-warn', path: /\/(place|cobbsknob|crypt|cellar)\.php/i,
      run: bossAggroWarn },
    { name: 'wiki-last-adventure', path: /\/charpane\.php/i, run: linkLastAdventure },
    { name: 'wiki-title-bar', path: /\/(place|choice|crypt)\.php/i, run: linkTitleBar },
    { name: 'wiki-quests', path: /\/questlog\.php/i, run: linkQuests },
    { name: 'wiki-monster', path: /\/fight\.php/i, run: linkMonster },
    { name: 'wiki-drops', path: /\/fight\.php/i, run: linkDrops },
    { name: 'wiki-inventory', path: /\/inventory\.php/i, run: linkInventory },
    { name: 'inventory-collapse', path: /\/inventory\.php/i, run: buildCollapseBar },
    { name: 'equip-optimize', path: /\/inventory\.php/i, run: buildEquipOptimizer },
    { name: 'charpane-heal', path: /\/charpane\.php/i, run: addHealButton },
    { name: 'charpane-cast-max', path: /\/charpane\.php/i, run: enhance },
  ];

  function run() {
    for (const feature of FEATURES) {
      if (!feature.path.test(location.pathname)) continue;
      const fail = (e) => {
        console.error('UX Enhancers: feature "' + feature.name + '" failed.', e);
      };
      try {
        // An async feature settles after this frame, so try/catch alone would
        // let a rejection escape as an unhandled one.
        const out = feature.run();
        if (out && typeof out.catch === 'function') out.catch(fail);
      } catch (e) {
        fail(e);
      }
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', run);
  } else {
    run();
  }
})();
