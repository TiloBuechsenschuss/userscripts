// ==UserScript==
// @name         KoL Equip Optimize
// @author       Tilo
// @namespace    https://github.com/TiloBuechsenschuss
// @downloadURL  https://raw.githubusercontent.com/TiloBuechsenschuss/userscripts/refs/heads/main/KingdomOfLoathing/equip-optimize.js
// @version      1.0
// @description  On the equipment inventory (inventory.php?which=2), adds an "Optimize for this" button next to KoL's enchantment sort dropdown. It equips, in every slot, the highest-value item you own for whatever attribute that dropdown is sorting by (the blue value next to each item). To get a clean comparison it first unequips everything (so currently-worn items rejoin the list), expands every category, then equips the best per slot and reloads. The run spans the page reload that "unequip all" causes, so its working state is kept in sessionStorage. For the Elemental Damage / Resistance sorts it adds an element picker (All + the five elements), for Monster Level a Higher/Lower picker, and for Monster Encounters a More/Fewer picker. For sorts with nothing to optimize (Outfit / Name / Item Quantity) the button is hidden.
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
        valueText: best.valueText, href: best.links[0].href
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
        'the best item for "' + attrLabel + '" in each slot.')) {
      status.textContent = 'Cancelled.';
      return;
    }
    const state = {
      attr: attr, attrLabel: attrLabel, sortTried: false,
      element: element, byValue: byValue, lowerBetter: lowerBetter
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
      const plan = planEquipment(
        scrapeCandidates(makeValueFn(state.attr, state.element), state.attr),
        state.byValue, state.lowerBetter);
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

  build();
})();
