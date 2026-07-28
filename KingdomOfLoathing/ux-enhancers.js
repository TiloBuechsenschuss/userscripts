// ==UserScript==
// @name         KoL UX Enhancers
// @author       Tilo
// @namespace    https://github.com/TiloBuechsenschuss
// @downloadURL  https://raw.githubusercontent.com/TiloBuechsenschuss/userscripts/refs/heads/main/KingdomOfLoathing/ux-enhancers.js
// @version      1.2
// @description  A grab-bag of small quality-of-life tweaks for Kingdom of Loathing pages. Currently: at the Hermit (hermit.php) it adds a "Buy all clovers" button next to the Trade button that trades worthless items for every 11-leaf clover the Hermit still has in stock today, one at a time, then reloads and reports how many it got; at the Campground (campground.php) it guards a Beer Garden that hasn't grown for two days yet, since the fancy bottles and labels don't appear before then -- the crop is flagged and clicking it asks for confirmation first; and in the Mall (mall.php) it adds a "buy all" action to each store row and a "Buy N" row per item that walks the stores cheapest-first, showing the total and the average cost per item before spending anything.
// @match        https://www.kingdomofloathing.com/hermit.php*
// @match        https://kingdomofloathing.com/hermit.php*
// @match        https://www.kingdomofloathing.com/campground.php*
// @match        https://kingdomofloathing.com/campground.php*
// @match        https://www.kingdomofloathing.com/mall.php*
// @match        https://kingdomofloathing.com/mall.php*
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

  // How many items a purchase response actually handed over. 0 when it can't be
  // confirmed -- which the callers treat as "stop", never as "assume it worked".
  function acquiredCount(html) {
    const s = String(html || '');
    const many = s.match(/You acquire[^<]*?<b>\s*([\d,]+)\s*<\/b>/i) ||
      s.match(/You acquire\s+([\d,]+)\s+items?/i);
    if (many) return parseInt(many[1].replace(/,/g, ''), 10) || 0;
    return /You acquire an item/i.test(s) ? 1 : 0;
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

  // One purchase. Resolves with how many were actually acquired -- 0 for any
  // response we can't read as a success, which stops the caller.
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
  async function runPlan(plan, say) {
    let bought = 0;
    let spent = 0;
    for (const step of plan.steps) {
      say('Buying ' + meatFmt(step.qty) + ' from ' + step.offer.storeName + '...');
      // eslint-disable-next-line no-await-in-loop
      const got = await buyFrom(step.offer, step.qty);
      bought += got;
      spent += got * step.offer.price;
      // Short or nothing means out of Meat, out of stock, or a response we
      // couldn't read. Any of those means stop, not press on.
      if (got < step.qty) break;
    }
    return { bought: bought, spent: spent };
  }

  function purchaseSummary(bought, spent, wanted) {
    if (!bought) {
      return 'Bought nothing — no purchase went through. Your Meat is untouched.';
    }
    const avg = Math.round(spent / bought);
    return 'Bought ' + meatFmt(bought) + ' for ' + meatFmt(spent) +
      ' Meat — ' + meatFmt(avg) + ' Meat each on average.' +
      (Number.isFinite(wanted) && bought < wanted
        ? ' (' + meatFmt(wanted - bought) + ' short of the ' + meatFmt(wanted) +
          ' asked for; a store ran out, or the Meat did.)'
        : '');
  }

  // Finish a run: stash the summary, then reload so stock, limits and Meat are
  // the server's view rather than our stale one.
  function finishRun(itemId, msg) {
    try {
      sessionStorage.setItem(MALL_MSG_KEY, JSON.stringify({ itemId: itemId, msg: msg }));
    } catch (e) { /* ignore; we just lose the summary */ }
    location.reload();
  }

  // The player's Meat, for the "can you even afford this" line. Null when
  // api.php can't be reached -- the plan is then shown without it rather than
  // blocking on it.
  async function getMeat() {
    try {
      const res = await fetch(ORIGIN + '/api.php?what=status&for=ux-enhancers', {
        credentials: 'same-origin', cache: 'no-store',
      });
      if (!res.ok) return null;
      const j = await res.json();
      const meat = j && (j.meat !== undefined ? j.meat : j.Meat);
      const n = parseInt(String(meat).replace(/,/g, ''), 10);
      return Number.isFinite(n) ? n : null;
    } catch (e) {
      return null;
    }
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
      const res = await runPlan(plan, () => {});
      finishRun(item.itemId, purchaseSummary(res.bought, res.spent, offer.available));
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
      const meat = await getMeat();
      if (!window.confirm(describePlan(plan, item.name, meat))) {
        status.textContent = 'Cancelled — nothing was bought.';
        return;
      }
      a.textContent = 'buying...';
      const res = await runPlan(plan, (m) => { status.textContent = m; });
      finishRun(item.itemId, purchaseSummary(res.bought, res.spent, want));
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

  // === feature registry =================================================

  const FEATURES = [
    { name: 'hermit-clovers', path: /\/hermit\.php/i, run: hermitClovers },
    { name: 'beer-garden-guard', path: /\/campground\.php/i, run: beerGardenGuard },
    { name: 'mall-bulk-buy', path: /\/mall\.php/i, run: mallBulkBuy },
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
