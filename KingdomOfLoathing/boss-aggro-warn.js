// ==UserScript==
// @name         KoL Boss Aggravator Warning
// @author       Tilo
// @namespace    https://github.com/TiloBuechsenschuss
// @downloadURL  https://raw.githubusercontent.com/TiloBuechsenschuss/userscripts/refs/heads/main/KingdomOfLoathing/boss-aggro-warn.js
// @version      0.5
// @description  Warns BEFORE you enter the lair of a special-reward boss (Boss Bat, Bonerdagon, Knob Goblin King, Baron von Ratsworth) if your Monster Aggravation Device isn't set to a level that forces the unique reward to drop. Each boss lives in one area; this script shows a banner on the page you see just before committing the adventure -- gated on the entry link/area into that zone actually being present (i.e. enterable) -- because adventure.php/fight.php is already too late to set the dial.
// @match        https://www.kingdomofloathing.com/place.php*
// @match        https://kingdomofloathing.com/place.php*
// @match        https://www.kingdomofloathing.com/cobbsknob.php*
// @match        https://kingdomofloathing.com/cobbsknob.php*
// @match        https://www.kingdomofloathing.com/crypt.php*
// @match        https://kingdomofloathing.com/crypt.php*
// @match        https://www.kingdomofloathing.com/cellar.php*
// @match        https://kingdomofloathing.com/cellar.php*
// @grant        none
// ==/UserScript==

(function () {
  'use strict';

  // Runs INSIDE the mainpane frame, where place.php / cobbsknob.php / cellar.php
  // render. Same-origin fetches to api.php work directly from here.

  const path = location.pathname;

  // Bundled-loader safety (mirrors charpane-heal.js): if this is ever @require'd
  // into the all-in-one loader, that loader runs every script on the union of all matched
  // pages. Bail unless we're on a page this script actually handles.
  if (!/\/(place|cobbsknob|crypt|cellar)\.php/i.test(path)) return;

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
      present: () => /\/cellar\.php/i.test(path),
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
  async function getStatus() {
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
  async function main() {
    const { level, equippedIds } = await getStatus();
    const boss = BOSSES.find((b) => b.present({ equippedIds }));
    if (!boss) return;

    const rewardSettings = Object.keys(boss.rewards).map(Number);

    // Stay silent if the setting already yields a reward. (Later we could flip
    // this to a green "you'll get X" confirmation instead of nothing.)
    if (level != null && rewardSettings.includes(level)) return;

    showBanner(boss, level);
  }

  main();
})();
