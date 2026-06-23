// ==UserScript==
// @name         KoL Equip Optimize
// @author       Tilo
// @namespace    https://github.com/TiloBuechsenschuss
// @downloadURL  https://raw.githubusercontent.com/TiloBuechsenschuss/userscripts/refs/heads/main/KingdomOfLoathing/equip-optimize.js
// @version      1.0
// @description  On the equipment inventory (inventory.php?which=2), adds an "Optimize for this" button next to KoL's enchantment sort dropdown. It equips, in every slot, the highest-value item you own for whatever attribute that dropdown is sorting by (the blue value next to each item). To get a clean comparison it first unequips everything (so currently-worn items rejoin the list), expands every category, then equips the best per slot and reloads. The run spans the page reload that "unequip all" causes, so its working state is kept in sessionStorage.
// @match        https://www.kingdomofloathing.com/inventory.php*
// @match        https://kingdomofloathing.com/inventory.php*
// @run-at       document-idle
// @grant        none
//
// ==/UserScript==

(function () {
  'use strict';

  // Bundled-loader safety: all-in-one.js @requires every KoL script and runs
  // them on the union of all matched pages. The standalone @match scopes this
  // to inventory.php, but guard explicitly for the bundle.
  if (!/\/inventory\.php/i.test(location.pathname)) return;

  // Idempotency guard: the page/loader may run us more than once.
  if (document.getElementById('tm-equip-optimize-btn')) return;

  const BUTTON_ID = 'tm-equip-optimize-btn';
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

  function isCollapsed(div) {
    const d = div.style.display;
    if (d === 'none') return true;
    if (d === 'inline' || d === 'block' || d === 'inline-block') return false;
    return getComputedStyle(div).display === 'none';
  }

  // Expand every collapsed category. Prefer KoL's own toggle() (keeps the
  // "inventory" cookie in sync and AJAX-loads a section's items the first time
  // it opens); only flip sections that are actually collapsed so we never close
  // an open one. Returns true if anything was expanded.
  function expandAllCategories() {
    let expanded = false;
    document.querySelectorAll('b.tit a.nounder').forEach(function (a) {
      const m = /toggle\('(.+?)'\)/.exec(a.getAttribute('href') || '');
      if (!m) return;
      const box = a.closest('table.stuffbox');
      const div = box && box.querySelector('div.collapse[id^="section"]');
      if (!div || !isCollapsed(div)) return;
      if (typeof window.toggle === 'function') window.toggle(m[1]);
      else div.style.display = 'inline';
      expanded = true;
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
      if (++tries > 25) return cb(); // ~5s cap; proceed with what we have
      setTimeout(tick, 200);
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
  function scrapeCandidates() {
    const bySlot = {};

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
        const value = parseValue(valueEl.textContent);
        if (value === null) return;

        const nameEl = item.querySelector('b');
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
          name: nameEl ? nameEl.textContent.trim() : '(item ' + item.id + ')',
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

  // --- Optimization -----------------------------------------------------

  // Build the list of equips to perform. Each slot's pick follows KoL's own
  // sort order (see bestOf). Weapon + off-hand are decided together (a 2h weapon
  // takes the off-hand slot — see preferTwoHand); accessories take the top three
  // into slots 1/2/3. Returns [ { label, name, valueText, href } ].
  function planEquipment(bySlot) {
    const plan = [];

    const weapons = bySlot.weapon || [];
    const oneHand = bestOf(weapons.filter(function (w) {
      return (w.hands || 1) === 1;
    }));
    const twoHand = bestOf(weapons.filter(function (w) {
      return (w.hands || 1) >= 2;
    }));
    const offhand = bestOf(bySlot.offhand);
    const useTwoHand = preferTwoHand(oneHand, twoHand, offhand);
    const weaponChoice = useTwoHand ? twoHand : oneHand;
    const offhandChoice = useTwoHand ? null : offhand;

    SINGLE_SLOTS.forEach(function (slot) {
      let best;
      if (slot.key === 'weapon') best = weaponChoice;
      else if (slot.key === 'offhand') best = offhandChoice;
      else best = bestOf(bySlot[slot.key]);
      if (!best) return;
      plan.push({
        label: slot.label, name: best.name,
        valueText: best.valueText, href: best.links[0].href
      });
    });

    // Accessories are one KoL-sorted category, so its DOM order is the ranking;
    // take the top three distinct items into physical slots 1/2/3.
    const accs = (bySlot.accessory || []).slice().sort(function (a, b) {
      return a.index - b.index;
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

  // KoL's best of a list. Within one category, "best" is simply the earliest
  // (KoL already sorted it best-first, handling flat vs % its own way). Across
  // different categories — only weapons span two (Melee / Ranged), where KoL
  // gives no relative order — fall back to the higher value.
  function bestOf(list) {
    if (!list || !list.length) return null;
    return list.reduce(function (best, it) {
      return koLBetter(it, best) ? it : best;
    });
  }
  function koLBetter(a, b) {
    if (a.cat === b.cat) return a.index < b.index;
    return a.value > b.value;
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
  // take the higher total. Otherwise — a 2h is the only option, or the units are
  // mixed so a total is meaningless — default to filling both slots (config A),
  // except when there's no 1h weapon and no off-hand at all.
  function preferTwoHand(oneHand, twoHand, offhand) {
    if (!twoHand) return false;
    if (!oneHand && !offhand) return true; // a 2h weapon is the only option
    const unitA = unitOf([oneHand, offhand]);
    if (unitA !== 'mixed' && unitA === unitOf([twoHand])) {
      const totalA = (oneHand ? oneHand.value : 0) +
        (offhand ? offhand.value : 0);
      return twoHand.value > totalA;
    }
    return false; // units not comparable: keep both slots filled
  }

  // --- Applying equipment ----------------------------------------------
  // Fire each equip via its own [equip] href (GET, same as clicking the link),
  // sequentially, then reload once. The server is authoritative about what can
  // actually be worn, so we let each equip settle before the next and re-read
  // the truth on reload (mirrors codpiece.js's multi-slot apply).
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
  function start(dropdown, status) {
    const attr = dropdown.value;
    const attrLabel = selectedAttributeLabel(dropdown);
    const href = getUnequipAllHref();
    if (!href) {
      status.textContent = 'Could not find the "unequip all" link.';
      return;
    }
    if (!confirm('Optimize equipment for "' + attrLabel + '"?\n\n' +
        'This unequips everything, then equips the highest-value item for "' +
        attrLabel + '" in each slot.')) {
      status.textContent = 'Cancelled.';
      return;
    }
    saveState({ attr: attr, attrLabel: attrLabel, sortTried: false });
    status.textContent = 'Unequipping all…';
    location.href = href; // GET → reload back into resume()
  }

  // Step 2 (after the unequip-all reload): make sure we're still sorted by the
  // saved attribute, expand everything, then equip the best per slot.
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
      const plan = planEquipment(scrapeCandidates());
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
  function build() {
    const dropdown = findSortDropdown();
    if (!dropdown) return; // not the equipment view

    const btn = document.createElement('button');
    btn.id = BUTTON_ID;
    btn.type = 'button'; // must not submit the sort form
    btn.textContent = 'Optimize for this';
    btn.style.cssText = 'margin-left:6px;cursor:pointer;';

    const status = document.createElement('span');
    status.id = STATUS_ID;
    status.style.cssText =
      'margin-left:8px;font-family:arial;font-size:9pt;color:#006;';

    btn.addEventListener('click', function () { start(dropdown, status); });

    dropdown.insertAdjacentElement('afterend', btn);
    btn.insertAdjacentElement('afterend', status);

    // Mid-run? Pick up where the unequip-all reload left off.
    const state = loadState();
    if (state) resume(dropdown, status, state);
  }

  build();
})();
