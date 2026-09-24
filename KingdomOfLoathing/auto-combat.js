// ==UserScript==
// @name         KoL Auto Combat
// @author       Tilo
// @namespace    https://github.com/TiloBuechsenschuss
// @downloadURL  https://raw.githubusercontent.com/TiloBuechsenschuss/userscripts/refs/heads/main/KingdomOfLoathing/auto-combat.js
// @version      0.9
// @description  Adds an "Auto" panel to the charpane that adventures in a chosen zone for you.
// @match        https://www.kingdomofloathing.com/awesomemenu.php*
// @match        https://kingdomofloathing.com/awesomemenu.php*
// @match        https://www.kingdomofloathing.com/topmenu.php*
// @match        https://kingdomofloathing.com/topmenu.php*
// @match        https://www.kingdomofloathing.com/charpane.php*
// @match        https://kingdomofloathing.com/charpane.php*
// @grant        none

// ==/UserScript==

/*
 * KoL Auto Combat
 *
 * Adds an "Auto" button to the charpane, under the Last Adventure readout, that opens a small
 *   panel: pick a zone, say how many adventures, press Start, and it adventures there for you.
 * Fights are handed to your "Auto-Attack until finished" combat macro when you have one saved, and
 *   fall back to attacking round by round when you don't.
 * Choice adventures work like the Twilight Heroes script: the first time one comes up the run
 *   pauses and the panel offers its options (annotated with what the zone's wiki page says each
 *   does); pick one and it's remembered, and answered by itself from then on.
 * A "remembered choices" list lets you review or forget any of them.
 * A choice that offers only one button is taken without asking, and a small built-in rule table
 *   answers a choice by name wherever it turns up -- "Peering Through Your Peridot" takes "I choose
 *   peace" when that option is on the page.
 * Turns are counted from api.php's adventure total rather than from requests sent, and anything it
 *   doesn't recognise stops the run rather than guessing.
 * A "stop on level up" checkbox ends the run as soon as api.php reports a higher level than the one
 *   you started at.
 * Four zones: The Haunted Bedroom, whose nightstands are answered from a built-in plan (the drawer
 *   with the substats in it, and the ghost key ahead of it where the key is worth more); Inside the
 *   Palindome, which farms the Elf Farm Raffle ticket -- it refuses to start when you are already
 *   carrying a ticket (the elf stays away until they are used) or without the Talisman o' Namsilat
 *   equipped, answers the zone's noncombats with the free or cheapest option, stops the run the
 *   moment a ticket drops, and keeps a per-character tally of the tickets you have picked up today;
 *   The Haunted Storage Room, which farms ghost keys -- Lights Out is answered with "Feel Your Way
 *   to the Door" and Chasin' Babies with "Do nothing", and every ghost key that drops is counted,
 *   for the run and in a per-character tally for the day; and "wherever I adventured last", which
 *   reads your last adventure from api.php when you press Start and grinds there with the ordinary
 *   ask-once-then-remember handling.
 */

(function () {
  'use strict';

  // Bundled-loader safety: the all-in-one loader @requires every KoL script and
  // runs them on the union of all matched pages. Guard our own pages
  // explicitly, or this would be dropped into the mainpane too. A no-op for the
  // standalone install, whose @match already scopes it here.
  //
  // TWO pages, and the halves they run are different: the engine lives in the
  // menu frame (see the block comment below) and the button lives in the
  // charpane (see "the charpane button" near the bottom). Everything in between
  // is defined on both and used by whichever half needs it.
  const ON_MENU = /\/(awesomemenu|topmenu)\.php/i.test(location.pathname);
  const ON_CHARPANE = /\/charpane\.php/i.test(location.pathname);
  if (!ON_MENU && !ON_CHARPANE) return;

  // ===================================================================
  // WHY THIS RUNS IN THE MENU FRAME
  //
  // KoL is a frameset. The topmenu/awesomemenu frame is the ONLY one that
  // survives while you adventure -- mainpane reloads on every turn, charpane on
  // most. A driver loop needs a home that isn't torn down mid-run, so the
  // engine lives here and talks to the server with `fetch(credentials:
  // 'same-origin')` rather than by navigating a frame. Consequences:
  //
  //   - The run keeps going even if the player clicks around in the mainpane.
  //     Run state is module-scope (RUN below), so the panel can be closed and
  //     reopened without disturbing it.
  //   - Nothing is visible in the mainpane while we work. The panel's log is
  //     the only feedback, which is why every step appends to it.
  //   - Reloading the whole page (F5 on the frameset) kills the run. There is
  //     no resume-after-reload; that's deliberate, a half-remembered run that
  //     restarts itself is worse than one that stops.
  //
  // This is the opposite choice from TwilightHeroes/auto-combat.js, which loops
  // by re-submitting the real forms and letting the page reload each round. TH
  // is a plain-page game with no frame that outlives a turn, so it has to work
  // that way; here the menu frame gives us somewhere better to stand.
  //
  // The BUTTON, on the other hand, is in the charpane -- the menu frame's one
  // strip of space ran out at four buttons. That makes this script a two-frame
  // affair: engine here, button there, and a small published object
  // (`window.tmAutoCombat`) as the only thing that crosses between them. The
  // charpane half owns no state, so the charpane reloading mid-run costs
  // nothing but a repaint.
  // ===================================================================

  const ORIGIN = location.origin;

  // --- Configuration ---------------------------------------------------

  const BUTTON_ID = 'tm-autocombat-btn';
  const PANEL_ID = 'tm-autocombat-panel';
  const CHOICES_POPUP_ID = 'tm-autocombat-choices-popup';
  // Remembers the last zone and turn count between sessions. UI state only --
  // nothing about a run in progress is persisted (see the note above).
  const PREFS_KEY = 'tm-autocombat-prefs';
  // Remembered choice-adventure picks: whichchoice -> { option, label, name }.
  // Keyed by choice number, which is unique game-wide, so a pick learned while
  // running one zone applies anywhere that choice turns up. (The TH script keys
  // on the encounter's name because TH has no choice ids; KoL does, and the id
  // is exact where a name is only nearly unique.)
  const CHOICES_KEY = 'tm-autocombat-choices';
  // Elf Farm Raffle tickets picked up today, per character:
  //   'tm-autocombat-tickets:<character>' -> { day: '<day key>', count: N }
  // See "THE KoL DAY" below for what a day key is and why the tally is kept
  // per character.
  const TICKETS_KEY = 'tm-autocombat-tickets';
  // Ghost keys picked up today, per character, in the same shape:
  //   'tm-autocombat-ghostkeys:<character>' -> { day: '<day key>', count: N }
  const GHOST_KEYS_KEY = 'tm-autocombat-ghostkeys';

  // Item ids, from KoLmafia's src/data/items.txt.
  const ELF_TICKET_ITEM = 500;   // Elf Farm Raffle ticket
  const TALISMAN_ITEM = 486;     // Talisman o' Namsilat
  const GHOST_KEY_ITEM = 7349;   // ghost key

  // Pause between requests. KoL is a small game on modest hardware and this is
  // a bot loop; keep it civil. Raise it, don't lower it.
  const REQUEST_DELAY_MS = 500;

  // A single fight is abandoned (and the run stopped) after this many rounds.
  // Only reachable on the round-by-round fallback -- the macro path settles a
  // whole fight in one request. Without it an unwinnable fight would spin
  // forever, burning requests and MP.
  const MAX_ROUNDS_PER_FIGHT = 30;

  // Hard ceiling on adventure.php requests per run, as a multiple of the turns
  // asked for (plus a constant). Free fights, noncombat chains and choice
  // adventures all cost a request without costing a turn, so cycles > turns is
  // normal -- this only exists to bound a loop that's stopped making progress.
  const CYCLE_BUDGET_FACTOR = 3;
  const CYCLE_BUDGET_CONSTANT = 20;

  // Stop before adventuring if HP is at or below this fraction of maximum.
  // Checked once per turn, before the request goes out -- so it stops the run
  // rather than the fight. Per-zone `guard` hooks can be stricter.
  const HP_FLOOR_FRACTION = 0.25;

  // The saved combat macro to hand a fight to, matched against the names in the
  // fight page's own macro dropdown (case- and punctuation-insensitive, see
  // normalizeName). First match wins; with none of them saved, the run falls
  // back to attacking round by round.
  const MACRO_NAMES = [
    'auto-attack until finished',
    'auto attack until finished',
  ];

  // ===================================================================
  // ZONE REGISTRY
  //
  // One entry per zone offered in the panel's dropdown. Everything that makes
  // a zone behave differently hangs off its entry. Add a zone as an entry, not
  // as a branch.
  //
  //   key       Stable id. Used in the prefs blob, so don't rename casually.
  //   name      Label in the dropdown.
  //   url       Path that spends the adventure, usually
  //             'adventure.php?snarfblat=<id>'. Absent on a dynamic entry,
  //             which resolves its own url when the run starts.
  //   dynamic   Optional. The entry has no fixed zone; resolveZone turns it
  //             into a real one at the start of each run. Exactly one entry
  //             uses this (see 'last-zone').
  //   note      Optional one-liner shown under the dropdown.
  //   hints     Optional { whichchoice: { option: 'what it does' } }. Pure
  //             annotation, shown beside each option when the run stops to ask
  //             -- it NEVER picks anything. Wiki knowledge goes here.
  //   plan      Optional { whichchoice: [ step, ... ] }. Choices answered
  //             without asking, in preference order. This one DOES pick --
  //             see "PRE-PICKED CHOICES" below for the rules it picks under.
  //   guard(ctx)     Optional. Called before each turn; return a string to stop
  //                  with that reason, or null to proceed.
  //   preflight(ctx) Optional, and async. Called ONCE, after the zone is
  //                  resolved and before the first turn: for the checks that
  //                  cost a request and only make sense once (is the drop we
  //                  came for already in your inventory?). Return a string to
  //                  refuse the run, or null to proceed.
  //   liveNote(status) Optional. Extra text for the panel's note line, given
  //                  api.php's status; may return a promise. Used for the
  //                  things that are only true right now.
  //   combat(ctx)    Optional. Per-round policy returning an ACTION. Falls back
  //                  to DEFAULT_COMBAT.
  //   onResult(ctx)  Optional. Called after each resolved turn; return a string
  //                  to end the run ("the drop we came for landed").
  //   summary()      Optional. A line for the log when the run ends, however
  //                  it ends ("3 ghost keys this run").
  //
  // ctx carries { zone, turn, cycle, doc, html, htmlAll, url, status, monster,
  //               whichchoice, macroRan, log(msg), stop(reason) }, with the
  // fields that don't apply to the moment left undefined. `html` is the page
  // the turn settled on; `htmlAll` is every page the turn went through, joined
  // -- a drop announced on the fight's last round is not on the page a
  // post-combat choice leaves you on.
  // ===================================================================

  const ZONES = [
    {
      key: 'haunted-bedroom',
      name: 'The Haunted Bedroom',
      // snarfblat 393. (108 is the pre-2014 Bedroom, a different zone -- don't
      // use the number from an old walkthrough.) Verified against KoLmafia's
      // src/data/adventures.txt.
      url: 'adventure.php?snarfblat=393',
      note: 'Nightstands. Each one drops you into a free choice after the ' +
            'fight -- that is where the stats are.',
      // Every combat here is a nightstand, and beating one hands you the
      // matching choice adventure immediately, for free. That is the whole
      // shape of the zone, and it's why the engine probes choice.php after a
      // fight ends (see probeChoice).
      //
      // Options below are from the wiki's Haunted Bedroom page; the numbers are
      // its choiceN keys, which are the option values. Note the gaps are real:
      // "Ignore it" is option 6 on the mahogany, ornate, rustic and elegant
      // nightstands but option 4 on the simple one, so counting buttons down
      // the page would answer the wrong thing.
      hints: {
        // One Simple Nightstand
        '876': {
          '1': 'old leather wallet',
          '2': 'Muscle substats (about your mainstat, capped at 200)',
          '3': 'ghost key: flat 200 Muscle',
          '4': 'ignore it',
        },
        // One Mahogany Nightstand
        '877': {
          '1': 'half of a memo (once per ascension) or old coin purse',
          '2': 'a mouth full of teeth -- takes damage, gives nothing',
          '3': "class item, but only with Lord Spookyraven's spectacles on",
          '4': 'ghost key: about 910-1,057 Meat',
          '6': 'ignore it',
        },
        // One Ornate Nightstand
        '878': {
          '1': '400-600 Meat',
          '2': 'Mysticality substats',
          '3': "Lord Spookyraven's spectacles (one-time)",
          '4': 'disposable instant camera',
          '5': 'ghost key: flat 200 Mysticality',
          '6': 'ignore it',
        },
        // One Rustic Nightstand
        '879': {
          '1': 'Moxie substats',
          '2': 'grouchy restless spirit, or nothing',
          '3': 'fights the jilted mistress -- THIS ONE COSTS A TURN',
          '4': 'ghost key: flat 200 Moxie',
          '5': 'Engorged Sausages and You (only shows up rarely)',
          '6': 'ignore it',
        },
        // One Elegant Nightstand
        '880': {
          '1': "Lady Spookyraven's finest gown (one-time), nothing after",
          '2': 'elegant nightstick',
          '3': 'ghost key: 100 of each substat',
          '6': 'ignore it',
        },
        // Lights Out in the Bedroom (897) is deliberately absent -- the wiki
        // has no outcomes for its options, so there is nothing honest to say.
        // It is in the plan below anyway, because "leave" needs no outcome
        // table to be the right answer.
      },
      // What to do with each nightstand, decided in advance. Read
      // "PRE-PICKED CHOICES" first: every step is checked against BOTH the
      // option number and the button's label, and a disagreement falls
      // through to asking rather than to guessing.
      //
      // These are the stat-farming answers -- the drawer the substats are in,
      // with the ghost key ahead of it wherever the key is worth more than
      // any drawer. The key options are listed first and the drawer second
      // for exactly one reason: those options are not on the page at all
      // unless you are carrying a key, so the second step is what "if
      // possible" means here.
      plan: {
        // One Simple Nightstand -> bottom drawer (Muscle substats).
        '876': [
          { option: '2', match: /bottom drawer/i, why: 'bottom drawer' },
        ],
        // One Mahogany Nightstand -> ghost key (Meat), else the top drawer.
        // Never the bottom one: that is the mouth full of teeth, which costs
        // HP and gives nothing.
        '877': [
          { option: '4', match: /ghost key|unlock/i, why: 'ghost key' },
          { option: '1', match: /top drawer/i, why: 'top drawer' },
        ],
        // One Ornate Nightstand -> bottom drawer (Mysticality substats).
        '878': [
          { option: '2', match: /bottom drawer/i, why: 'bottom drawer' },
        ],
        // One Rustic Nightstand -> top drawer (Moxie substats). Note what is
        // NOT here: option 3 starts the jilted mistress fight, the one thing
        // in this zone that spends a turn.
        '879': [
          { option: '1', match: /top drawer/i, why: 'top drawer' },
        ],
        // One Elegant Nightstand -> ghost key (100 of each substat), else
        // leave it alone. The gown is a once-per-ascension drop and the
        // nightstick is not worth the request.
        '880': [
          { option: '3', match: /ghost key|unlock/i, why: 'ghost key' },
          { option: '6', match: /ignore/i, why: 'ignore it' },
        ],
        // Lights Out in the Bedroom: get out, whatever it is offering. This
        // step carries no option number on purpose -- the wiki documents no
        // outcomes for this choice, so there is no number to trust, and the
        // label is the only thing here that is real.
        //
        // Anchored at the start of the label, because this has to read as an
        // instruction to leave and not as a word that happens to appear in
        // one. "Leave" gets the extra clause for that reason and no other: on
        // its own or in front of an object it is the exit, but "Leave no
        // drawer unopened" is the opposite of the exit, and starts the same
        // way. Anything this doesn't recognise stops and asks, which for a
        // choice nobody has written down is the right place to end up.
        '897': [
          {
            match: /^\s*(flee|run away|get out|go back|leave\s*[.!]*$|leave\s+(the|this|that|it|them|here)\b)/i,
            why: 'leave',
          },
        ],
      },
    },
    {
      key: 'palindome',
      name: 'Inside the Palindome',
      // snarfblat 386, from KoLmafia's src/data/adventures.txt. (119 is the
      // pre-2014 Palindome, a different, retired zone -- don't take the number
      // from an old walkthrough.)
      url: 'adventure.php?snarfblat=386',
      note: 'Farms the Elf Farm Raffle ticket and stops the moment one ' +
            'drops. Needs the Talisman o\' Namsilat equipped.',
      // The noncombats, from the wiki's Inside the Palindome page. Numbers are
      // the choice ids off each adventure's own wiki page (its `num`), and the
      // option ordering is KoLmafia's ChoiceAdventures, which lists them in
      // button order. Both are UNVERIFIED in-game, which is what the
      // number-AND-label rule in "PRE-PICKED CHOICES" is for.
      //
      // The pre-Awkward ones (Rod Nevada, Vendor and Do Geese See God?) are
      // deliberately absent: they are one-time photograph purchases, not
      // things a farming loop should answer, so they stop and ask.
      hints: {
        // Denim Axes Examined -- only shows up with a rubber axe on you.
        '2': {
          '1': 'trade a rubber axe for a denim axe',
          '2': 'no thanks -- nothing, and does not cost a turn',
        },
        // Sun at Noon, Tan Us
        '126': {
          '1': 'a little while: Moxie substats (about your mainstat, max 250)',
          '2': 'a medium while: more Moxie (max 350), or 10 turns of Sunburned',
          '3': 'a long while: 10 turns of Sunburned',
        },
        // No sir, away! A papaya war is on!
        '127': {
          '1': 'dive into the bunker: 3 papayas',
          '2': 'leap into the fray: stats, but SPENDS 3 papayas (or 60-68 HP)',
          '3': 'pep talk: stats to all three (about your mainstat, max 100)',
          '4': '5 papayas, then pick again (KoLmafia lists this; the wiki does not)',
        },
        // A Pre-War Dresser Drawer, Pa!
        '180': {
          '1': 'look in the drawer: 200-300 Meat, or Ye Olde Navy Fleece with Torso Awaregness',
          '2': 'ignawer the drawer -- nothing, and does not cost a turn',
        },
      },
      // Farming answers. The zone is here for one drop and every noncombat is
      // a detour from it, so each of these is either the cheapest way out or
      // the one that costs nothing at all.
      plan: {
        '2': [
          { option: '2', match: /no,?\s*thanks/i, why: 'no thanks (free)' },
        ],
        '126': [
          { option: '1', match: /a little while/i, why: 'a little while (Moxie, no sunburn)' },
        ],
        '127': [
          { option: '3', match: /pep talk/i, why: 'pep talk (stats, spends no papayas)' },
        ],
        '180': [
          { option: '2', match: /ignawer/i, why: 'ignawer the drawer (free)' },
        ],
      },
      // The panel's line for this zone: what the day has produced, and what
      // you are carrying -- which is what decides whether starting a run is
      // worth anything at all (see preflight).
      liveNote: function (status) {
        const today = ticketsToday(status);
        const tally = today + ' ticket' + (today === 1 ? '' : 's') + ' today';
        return getInventory().then(function (inv) {
          const held = itemCount(inv, ELF_TICKET_ITEM);
          return held === null
            ? tally + '; I can\'t read your inventory.'
            : tally + '; carrying ' + held + '.';
        }, function () {
          return tally + '; I can\'t read your inventory.';
        });
      },
      // Checked ONCE, before the first turn. "Flee to me, remote elf!" does
      // not happen at all while an Elf Farm Raffle ticket is in your inventory
      // -- so a run started holding one would spend every adventure it was
      // given and could not possibly find another. That is a refusal, not a
      // warning.
      preflight: async function (ctx) {
        let inv;
        try {
          inv = await getInventory();
        } catch (e) {
          return 'I could not read your inventory (' + e.message + '), so I ' +
                 'can\'t tell whether the elf would turn up at all';
        }
        const held = itemCount(inv, ELF_TICKET_ITEM);
        if (held === null) {
          return 'api.php sent an inventory I don\'t understand, so I can\'t ' +
                 'tell whether you are already carrying a ticket';
        }
        if (held > 0) {
          return 'you are already carrying ' + held + ' Elf Farm Raffle ticket' +
                 (held === 1 ? '' : 's') + ' -- the elf stays away until they ' +
                 'are used, so this run would spend its adventures for nothing';
        }
        ctx.log('no tickets on hand; ' + ticketsToday(ctx.status) +
                ' picked up today so far.');
        return null;
      },
      // The Palindome is only THERE while the Talisman o' Namsilat is
      // equipped: without it KoL answers "You find yourself unable to get near
      // the Palindome" and spends no turn, which a loop would repeat until its
      // request budget ran out. api.php's status carries the worn equipment,
      // so the run is stopped before the request goes out. Quiet when api.php
      // reports no equipment at all -- the blocker text is the backstop there.
      guard: function (ctx) {
        const eq = ctx.status && ctx.status.raw && ctx.status.raw.equipment;
        if (!eq) return null;
        const worn = [eq.acc1, eq.acc2, eq.acc3].map(function (v) { return String(v); });
        if (worn.indexOf(String(TALISMAN_ITEM)) !== -1) return null;
        return 'the Talisman o\' Namsilat is not equipped, so there is no ' +
               'Palindome to adventure in';
      },
      // The ticket is the whole point of the zone, and a second one cannot
      // drop while the first is in your inventory -- so landing one ends the
      // run rather than merely being logged.
      onResult: function (ctx) {
        if (ticketAcquiredIn(ctx.html)) {
          return 'got an Elf Farm Raffle ticket (' + recordTicket(ctx.status) +
                 ' today)';
        }
        // The elf turned up but the acquire line didn't parse. Stop anyway:
        // either the ticket landed and the run is over regardless, or
        // something about the page has changed, and grinding on would spend
        // the rest of your adventures on a drop that cannot come.
        if (/flee to me,? remote elf/i.test(ctx.html)) {
          return 'the elf turned up but I could not read the ticket landing ' +
                 '-- check your inventory';
        }
        return null;
      },
    },
    {
      key: 'haunted-storage-room',
      name: 'The Haunted Storage Room',
      // snarfblat 398, from KoLmafia's src/data/adventures.txt.
      url: 'adventure.php?snarfblat=398',
      note: 'Farms ghost keys (the sheet ghost drops them) and counts every ' +
            'one that lands.',
      // The two noncombats, from the wiki's Haunted Storage Room page. The
      // choice ids are each adventure's own wiki `num` (and KoLmafia's
      // ChoiceAdventures comments agree on 890); the option numbers are the
      // wiki's button order. Both are UNVERIFIED in-game, which is what the
      // number-AND-label rule in "PRE-PICKED CHOICES" is for.
      hints: {
        // Lights Out in the Storage Room
        '890': {
          '1': 'leave -- costs no adventure',
          '2': 'a creepy statue, then you flee -- nothing',
          '3': "Old Agnes at the window: unlocks an option in Lights Out in the Laundry Room",
          '4': 'a locked chest -- nothing',
        },
        // Chasin' Babies (the Storage Room copy)
        '886': {
          '1': 'try the poppet: may move a triplet ghost between rooms',
          '2': 'try the rocking horse: may move a triplet ghost between rooms',
          '3': 'try the jack-in-the-box: may move a triplet ghost between rooms',
          '4': 'do nothing -- you leave the room',
        },
      },
      plan: {
        '890': [
          { option: '1', match: /feel your way/i, why: 'feel your way to the door (free)' },
        ],
        // Anchored: "Do nothing" has to be the whole instruction, not a phrase
        // inside some other option's label.
        '886': [
          { option: '4', match: /^\s*do nothing\b/i, why: 'do nothing' },
        ],
      },
      liveNote: function (status) {
        const today = tallyToday(GHOST_KEYS_KEY, status);
        const tally = today + ' ghost key' + (today === 1 ? '' : 's') + ' today';
        return getInventory().then(function (inv) {
          const held = itemCount(inv, GHOST_KEY_ITEM);
          return held === null
            ? tally + '; I can\'t read your inventory.'
            : tally + '; carrying ' + held + '.';
        }, function () {
          return tally + '; I can\'t read your inventory.';
        });
      },
      // Nothing to refuse -- keys stack, so there is no "already carrying
      // one" rule here the way there is for the raffle ticket. This only
      // starts the run's own count at zero.
      preflight: async function (ctx) {
        RUN.ghostKeys = 0;
        ctx.log(tallyToday(GHOST_KEYS_KEY, ctx.status) +
                ' ghost key(s) picked up today so far.');
        return null;
      },
      // Counted, never a reason to stop: the whole run is for these.
      onResult: function (ctx) {
        const n = ghostKeysIn(ctx.htmlAll != null ? ctx.htmlAll : ctx.html);
        if (n > 0) {
          RUN.ghostKeys = (RUN.ghostKeys || 0) + n;
          const today = recordTally(GHOST_KEYS_KEY, ctx.status, n);
          ctx.log('ghost key' + (n === 1 ? '' : 's x' + n) + '! ' +
                  RUN.ghostKeys + ' this run, ' + today + ' today.');
        }
        return null;
      },
      summary: function () {
        const n = RUN.ghostKeys || 0;
        return n + ' ghost key' + (n === 1 ? '' : 's') + ' this run.';
      },
    },
    {
      // "Wherever I adventured last." No url of its own: resolveZone reads
      // one from api.php's lastadv block when the run starts, and if that
      // lands on a zone this registry already knows about, the run gets that
      // entry's plan and hints too. Everything else falls back to the
      // ask-once-then-remember handling, which is the whole reason this entry
      // can exist without a table of every zone in the Kingdom behind it.
      key: 'last-zone',
      dynamic: true,
      name: 'Wherever I adventured last',
      note: 'Reads your last adventure when you press Start, then stays ' +
            'there. Unfamiliar choices still stop and ask.',
    },
  ];

  // ===================================================================
  // COMBAT ACTIONS
  //
  //   { kind: 'attack' }                 hit it with the equipped weapon
  //   { kind: 'macro',  id: <macroId> }  run a saved combat macro
  //   { kind: 'skill',  id: <skillId> }  cast a skill
  //   { kind: 'item',   id: <itemId> }   use an item
  //   { kind: 'steal' }                  pickpocket
  //   { kind: 'runaway' }                run away
  //   { kind: 'stop', reason: '...' }    end the run, leaving the fight open
  //
  // 'stop' leaves you mid-fight on purpose: if the policy doesn't know what to
  // do, handing the fight back to the player intact is the only safe move.
  // ===================================================================

  const ATTACK = { kind: 'attack' };

  // What every zone does unless it says otherwise.
  //
  // A saved "Auto-Attack until finished" macro is worth reaching for because
  // KoL runs the whole macro server-side: one request settles the fight instead
  // of one request per round. If the macro aborts (out of MP, a skill you don't
  // have, "Invalid macro") the fight is still open and we're called again with
  // macroRan set -- from there it's the plain attack loop, same as if no macro
  // had been saved at all.
  function DEFAULT_COMBAT(ctx) {
    if (!ctx.macroRan) {
      const id = findMacroId(ctx.doc);
      if (id) return { kind: 'macro', id: id };
    }
    return ATTACK;
  }

  // Names collapse to lowercase alphanumerics so "Auto-Attack Until Finished",
  // "auto attack until finished" and "AutoAttackUntilFinished" all match.
  function normalizeName(s) {
    return String(s || '').toLowerCase().replace(/[^a-z0-9]/g, '');
  }

  // The fight page lists your saved macros in its own dropdown:
  //   <form name=macro action=fight.php method=post>
  //     <input type=hidden name=action value="macro">
  //     <input type="hidden" name="macrotext" value="">
  //     <select name=whichmacro>
  //       <option value='0'>(select a macro)</option>
  //       <option value="198965" picurl="">cadenzattack</option>
  //   ...so the id comes off the page and is never hardcoded. Verified against
  // KoLmafia's test_fight_battle_end_both_combat_bars_runaway_macro.html.
  function findMacroId(doc) {
    const sel = doc.querySelector('select[name="whichmacro"]');
    if (!sel) return null;
    const wanted = MACRO_NAMES.map(normalizeName);
    for (const opt of sel.querySelectorAll('option')) {
      if (!opt.value || opt.value === '0') continue;
      if (wanted.indexOf(normalizeName(opt.textContent)) !== -1) return opt.value;
    }
    return null;
  }

  // Turn an action into the form fields KoL's own combat forms post.
  //
  // Note there is NO round number: the modern fight page carries no
  // `whichround` input at all (checked across KoLmafia's fight fixtures), the
  // server tracks the round itself. Parameter names come from those fixtures
  // (`<input type=hidden name=action value="attack">` and friends) rather than
  // from a live page, so they are UNVERIFIED in-game -- this function is the
  // only thing to fix if an action misfires.
  function fightFields(action) {
    switch (action.kind) {
      case 'attack':  return { action: 'attack' };
      case 'steal':   return { action: 'steal' };
      case 'runaway': return { action: 'runaway' };
      case 'macro':   return { action: 'macro', whichmacro: action.id };
      case 'skill':   return { action: 'skill', whichskill: action.id };
      case 'item':    return { action: 'useitem', whichitem: action.id };
      default:        return null;
    }
  }

  function describeAction(action) {
    switch (action.kind) {
      case 'attack':  return 'attack';
      case 'steal':   return 'pickpocket';
      case 'runaway': return 'run away';
      case 'macro':   return 'combat macro';
      case 'skill':   return 'skill #' + action.id;
      case 'item':    return 'item #' + action.id;
      default:        return action.kind;
    }
  }

  // ===================================================================
  // REMEMBERED CHOICES
  //
  // The Twilight Heroes model, adapted to a background loop. There the script
  // could put a "remember this" button next to the real options because you
  // were looking at the page; here nothing is on screen, so the run PAUSES and
  // the panel offers the options instead. Same bargain either way: the script
  // never picks an option you haven't picked once yourself.
  // ===================================================================

  function allChoices() {
    try { return JSON.parse(localStorage.getItem(CHOICES_KEY)) || {}; }
    catch (e) { return {}; }
  }

  function saveChoices(o) {
    try { localStorage.setItem(CHOICES_KEY, JSON.stringify(o)); }
    catch (e) { /* storage unavailable; picks just won't stick */ }
  }

  function rememberedChoice(which) {
    return allChoices()[String(which)] || null;
  }

  function rememberChoice(which, option, label, name) {
    const o = allChoices();
    o[String(which)] = { option: String(option), label: label || '', name: name || '' };
    saveChoices(o);
  }

  function forgetChoice(which) {
    const o = allChoices();
    delete o[String(which)];
    saveChoices(o);
  }

  // A remembered pick is only good if the page is still offering it. Several of
  // the bedroom's options are conditional -- the mahogany nightstand's "look
  // under" needs Lord Spookyraven's spectacles equipped, the rustic one's
  // "check under" only shows up rarely -- so a stored option can simply not be
  // there this time. Returning null means "ask again", which is right; sending
  // an option the page isn't offering would submit something we can't predict.
  function usableRemembered(known, options) {
    if (!known || !known.option) return null;
    const opt = String(known.option);
    return options.some(o => String(o.value) === opt) ? opt : null;
  }

  // ===================================================================
  // PRE-PICKED CHOICES (a zone's `plan`)
  //
  // A remembered pick is a decision the player made once, at the prompt. A
  // PLAN is the same decision written down in advance, for a zone whose
  // choices have a known right answer -- the Haunted Bedroom, where every
  // encounter is a nightstand and the answer is always the drawer with the
  // substats in it. Without it the bedroom asks five questions before it can
  // grind, which for a zone this well documented is asking the player to type
  // out the wiki.
  //
  //   zone.plan = { '<whichchoice>': [ step, step, ... ] }
  //   step      = { option: '<value>', match: /label/, why: 'for the log' }
  //
  // Steps are tried in order and the first one the page is actually OFFERING
  // wins. That ordering is how "the ghost key if you have one, otherwise the
  // top drawer" is expressed: the ghost-key options are simply not rendered
  // without a key in inventory, so the step below it is what happens. Same
  // rule, and the same reason, as usableRemembered.
  //
  // Every step is checked TWICE -- the option number has to be on the page AND
  // its label has to match. The numbers come from the wiki (they are the same
  // ones `hints` is keyed by); the labels come from the page. If the wiki has
  // drifted the two disagree, no step matches, and the run falls through to
  // asking you. That is the failure this is built to have: a plan that has
  // gone stale must not confidently press the wrong button, and on this zone
  // the wrong button is a jilted mistress fight that costs a turn.
  //
  // A step with no `option` matches on the label alone, for a choice whose
  // numbering nobody has written down.
  // ===================================================================

  function planSteps(zone, which) {
    return (zone && zone.plan && zone.plan[String(which)]) || null;
  }

  function planPick(zone, which, options) {
    const steps = planSteps(zone, which);
    if (!steps) return null;
    for (const step of steps) {
      for (const o of options) {
        if (step.option !== undefined && String(o.value) !== String(step.option)) continue;
        if (!step.match.test(o.text || '')) continue;
        return { option: String(o.value), label: o.text, why: step.why };
      }
    }
    return null;
  }

  // ===================================================================
  // BUILT-IN CHOICE RULES (any zone)
  //
  // A zone's `plan` answers a choice because of WHERE YOU ARE STANDING. These
  // answer one because of WHAT IT IS -- a choice an item hands you follows the
  // item around and belongs to no zone, so hanging it off a zone entry would
  // be the wrong shelf. Matched on the choice's NAME rather than its number:
  // the name is the part the page and the wiki agree on, and it is what the
  // player recognises in the log.
  //
  //   { match: /choice name/, option: /label/, why: 'for the log' }
  //
  // Same offered-or-nothing rule as a plan: the label has to be on the page
  // this turn, or the rule doesn't fire and the ordinary remembered-then-ask
  // path runs. A rule outranks a remembered pick for the same reason a plan
  // does -- it is the more deliberate of the two, and it is maintained here.
  // ===================================================================

  const CHOICE_RULES = [
    {
      // The Peridot of Peril's "which monster do you want" screen. "I choose
      // peace" is the walk-away option: it closes the choice without taking a
      // fight off the list. That is what a grind wants -- the peridot's pick
      // is worth spending deliberately, not on whatever the loop walked into.
      // UNVERIFIED against a live page: the encounter name and the label are
      // the wiki's. Nothing here is keyed to a choice number, and a label that
      // has drifted falls through to asking rather than pressing some other
      // button.
      match: /peering through your peridot/i,
      option: /\bi\s+choose\s+peace\b/i,
      why: "built-in rule: leave the peridot's pick alone",
    },
  ];

  function rulePick(name, options) {
    if (!name) return null;
    for (const rule of CHOICE_RULES) {
      if (!rule.match.test(name)) continue;
      for (const o of options) {
        if (!rule.option.test(o.text || '')) continue;
        return { option: String(o.value), label: o.text, why: rule.why };
      }
    }
    return null;
  }

  // A choice offering exactly ONE button is not a decision -- it is a
  // "continue" page wearing a choice's clothes (a chained result screen, or an
  // encounter whose other options need something you aren't carrying). Take it
  // instead of stopping the run so the player can press the only button there
  // is. Nothing is remembered from it: no preference was expressed, and the
  // same choice with its full set of options must still ask.
  function soloPick(options) {
    return options && options.length === 1 ? String(options[0].value) : null;
  }

  // ===================================================================
  // THE KoL DAY, AND WHAT A RUN GOT OUT OF IT
  //
  // "Today" is KoL's day, not the browser's: rollover is 3:30am Arizona time,
  // which for most players lands in the middle of an afternoon. api.php's
  // status carries `rollover`, the unix time of the NEXT one -- constant for
  // the whole of a KoL day and different on the next, so it is a day key as it
  // stands. `daynumber` is the fallback if a future api.php drops it, and the
  // browser's own date is the last resort. Same three sources, and the same
  // reasoning, as auto-mine.js's turns-spent-today counter.
  //
  // Nothing has to be running for the tally to start over, and there is no
  // timer: reading it with a day key that doesn't match the stored one IS the
  // reset. It is kept per character (a multi's runs are not one player's day)
  // and it is cosmetic -- a lost count costs nobody a turn.
  // ===================================================================

  function localDayKey() {
    const now = new Date();
    return 'l' + now.getFullYear() + '-' + (now.getMonth() + 1) + '-' + now.getDate();
  }

  function dayKeyFromStatus(status) {
    const raw = (status && status.raw) || {};
    const rollover = num(raw.rollover);
    if (rollover) return 'r' + rollover;
    const daynumber = num(raw.daynumber);
    if (daynumber) return 'd' + daynumber;
    return localDayKey();
  }

  // One storage slot per tally (base key) per character.
  function tallyKeyFor(base, status) {
    const name = status && status.name ? String(status.name).trim() : '';
    return base + ':' + (name || 'unknown');
  }

  // Pure, so the rollover arithmetic can be tested without storage: a stored
  // record, the day it is being read on and how many tickets to add, giving
  // the record to store next. A record from a day that is over reads as zero
  // rather than being carried into today.
  function nextTicketRecord(record, dayKey, delta) {
    const stored = record && record.day === dayKey ? num(record.count) : 0;
    const base = stored === null || stored < 0 ? 0 : stored;
    return { day: dayKey, count: base + Math.max(0, delta || 0) };
  }

  function loadTally(base, status) {
    try {
      const raw = JSON.parse(localStorage.getItem(tallyKeyFor(base, status)));
      if (raw && typeof raw === 'object') return raw;
    } catch (e) { /* unreadable; nothing was recorded as far as we know */ }
    return { day: null, count: 0 };
  }

  function tallyToday(base, status) {
    return nextTicketRecord(loadTally(base, status), dayKeyFromStatus(status), 0).count;
  }

  function recordTally(base, status, delta) {
    const next = nextTicketRecord(loadTally(base, status), dayKeyFromStatus(status), delta);
    try { localStorage.setItem(tallyKeyFor(base, status), JSON.stringify(next)); }
    catch (e) { /* storage unavailable; the tally is cosmetic, carry on */ }
    return next.count;
  }

  function ticketsToday(status) { return tallyToday(TICKETS_KEY, status); }
  function recordTicket(status) { return recordTally(TICKETS_KEY, status, 1); }

  // KoL announces a drop as `You acquire an item: <b>Elf Farm Raffle ticket</b>`,
  // and the tags between the two halves vary. Matched inside an acquire line
  // rather than on the item name alone, because the encounter's own prose says
  // "ticket to our Elf Farm Raffle" whether or not anything landed.
  function ticketAcquiredIn(html) {
    return /You acquire an item:\s*(?:<[^>]*>\s*)*Elf Farm Raffle ticket/i
      .test(String(html == null ? '' : html));
  }

  // How many ghost keys the page says just landed. KoL writes one as
  // `You acquire an item: <b>ghost key</b>` and several at once as
  // `You acquire <b>ghost key (2)</b>`; the `<b>2 ghost keys</b>` spelling is
  // accepted too. Like ticketAcquiredIn, only an acquire line counts -- the
  // Bedroom's nightstand prose talks about ghost keys without handing any out.
  // The multi-item wordings are UNVERIFIED against a live page.
  function ghostKeysIn(html) {
    const re = /You acquire (?:an item:\s*)?(?:<[^>]*>\s*)*(?:(\d[\d,]*)\s+ghost keys\b|ghost key\b(?:\s*\((\d[\d,]*)\))?)/gi;
    const s = String(html == null ? '' : html);
    let total = 0;
    let m;
    while ((m = re.exec(s)) !== null) {
      total += num(m[1] || m[2]) || 1;
    }
    return total;
  }

  // The character's level, off api.php's status (`level`, a field KoLmafia's
  // ApiRequest reads). Null when it isn't there, so "can't tell" never reads as
  // a level change.
  function levelOf(status) {
    return num(status && status.raw && status.raw.level);
  }

  // Did the character level up since the run started? Only when both readings
  // exist -- a missing one is no evidence either way.
  function leveledUp(startLevel, status) {
    const now = levelOf(status);
    return startLevel !== null && now !== null && now > startLevel ? now : null;
  }

  // api.php?what=inventory answers with a flat { '<item id>': '<count>' } map.
  // Shape taken from KoLmafia's ApiRequest/InventoryManager, and UNVERIFIED
  // against a live response -- which is why itemCount reports "I don't
  // understand this" separately from "you have none of those", and why the one
  // caller refuses to start rather than assuming the second.
  async function getInventory() {
    const res = await fetch(
      ORIGIN + '/api.php?what=inventory&for=tm-auto-combat',
      { credentials: 'same-origin', cache: 'no-store' }
    );
    if (!res.ok) throw new Error('api.php returned HTTP ' + res.status);
    return await res.json();
  }

  // How many of an item the inventory map says you have: a number, or null
  // when what came back isn't a map at all.
  function itemCount(inv, id) {
    if (!inv || typeof inv !== 'object' || Array.isArray(inv)) return null;
    const n = num(inv[String(id)]);
    return n === null ? 0 : n;
  }

  // ===================================================================
  // RUN STATE
  // ===================================================================

  const RUN = {
    active: false,
    stopRequested: false,
    zone: null,
    requested: 0,     // adventures asked for
    used: 0,          // adventures actually spent (measured, see runSession)
    cycle: 0,         // adventure.php requests made
    startAdv: null,   // api.php adventure count when the run began
    status: '',       // one-line summary for the panel header
    log: [],          // [{ t: Date, msg: string, kind: 'info'|'warn'|'error' }]
    pending: null,    // a choice waiting on the player; see askChoice
    ghostKeys: 0,     // ghost keys picked up this run (Haunted Storage Room)
  };

  const LOG_LIMIT = 200;

  function log(msg, kind) {
    RUN.log.push({ t: new Date(), msg: String(msg), kind: kind || 'info' });
    if (RUN.log.length > LOG_LIMIT) RUN.log.splice(0, RUN.log.length - LOG_LIMIT);
    renderPanel();
  }

  function setStatus(text) {
    RUN.status = text;
    renderPanel();
    syncButton();
  }

  // ===================================================================
  // SERVER PLUMBING
  // ===================================================================

  const sleep = ms => new Promise(r => setTimeout(r, ms));

  const num = v => {
    const n = parseInt(String(v == null ? '' : v).replace(/,/g, ''), 10);
    return Number.isFinite(n) ? n : null;
  };

  // api.php?what=status is KoL's own view of the character, and the only
  // trustworthy source for "how many adventures are left" -- the charpane in a
  // sibling frame is stale the moment we fetch anything in the background.
  // Field names verified against KoLmafia's ApiRequest.
  async function getStatus() {
    const res = await fetch(
      ORIGIN + '/api.php?what=status&for=tm-auto-combat',
      { credentials: 'same-origin', cache: 'no-store' }
    );
    if (!res.ok) throw new Error('api.php returned HTTP ' + res.status);
    const j = await res.json();
    return {
      pwd: j.pwd,
      name: j.name,
      adventures: num(j.adventures),
      hp: num(j.hp),
      maxhp: num(j.maxhp),
      mp: num(j.mp),
      maxmp: num(j.maxmp),
      // Kept raw so a policy can look at anything else api.php reports without
      // this wrapper having to know about it first.
      raw: j,
    };
  }

  function toPage(res, html) {
    return {
      url: res.url,
      html: html,
      doc: new DOMParser().parseFromString(html, 'text/html'),
    };
  }

  // GET a KoL page and hand back both the text and a parsed document, plus the
  // URL we actually landed on. That last one matters: adventure.php redirects
  // to fight.php / choice.php by itself, and `res.url` is the cheapest, most
  // reliable way to know which -- cheaper and less brittle than sniffing HTML.
  async function getPage(url) {
    const res = await fetch(url, { credentials: 'same-origin', cache: 'no-store' });
    if (!res.ok) throw new Error('HTTP ' + res.status + ' for ' + url);
    return toPage(res, await res.text());
  }

  // POST a form the way the page's own forms do. Both the combat forms and the
  // choice forms are method=post, so this is the faithful path; a GET happens
  // to work for choice.php too, but matching the page is one less thing that
  // can quietly change under us.
  async function postPage(path, fields) {
    const body = new URLSearchParams();
    for (const k in fields) body.append(k, String(fields[k]));
    const res = await fetch(ORIGIN + '/' + path.replace(/^\//, ''), {
      method: 'POST',
      credentials: 'same-origin',
      cache: 'no-store',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: body,
    });
    if (!res.ok) throw new Error('HTTP ' + res.status + ' for ' + path);
    return toPage(res, await res.text());
  }

  // Append the pwd hash to a path. choice.php needs it (its forms carry a
  // hidden pwd input); adventure.php and fight.php don't appear to, but the
  // server ignores a spare one and the house rule here is to always send it.
  function withPwd(path, pwd) {
    const sep = path.indexOf('?') === -1 ? '?' : '&';
    return ORIGIN + '/' + path.replace(/^\//, '') + sep + 'pwd=' + pwd;
  }

  // ===================================================================
  // READING THE RESPONSE
  // ===================================================================

  // Messages that mean "this turn didn't happen and won't". Each stops the run
  // with its own reason -- none is recoverable by trying again, which is
  // exactly why they're a stop and not a retry.
  //
  // UNVERIFIED: the wordings are from the wiki and from KoLmafia's string
  // tables, not from live responses. A miss here fails in the wrong direction
  // (we'd keep going), so treat this list as the thing to correct first when a
  // run does something odd.
  const BLOCKERS = [
    { re: /you don'?t have enough Adventures/i,        why: 'out of adventures' },
    { re: /You'?re too beaten up/i,                     why: 'beaten up' },
    { re: /you can'?t (?:currently )?get there/i,       why: 'zone not reachable' },
    { re: /you shouldn'?t be here|not allowed here/i,   why: 'zone closed to you' },
    // Zone-specific, and the reason it's worth its line: without the Talisman
    // o' Namsilat equipped the Palindome simply isn't there, and KoL says so
    // WITHOUT spending the turn -- so a loop that didn't recognise this would
    // re-request the zone until its budget ran out. (Wiki, Kingdom of
    // Exploathing note.)
    { re: /unable to get near the Palindome/i,          why: "the Palindome isn't reachable (Talisman o' Namsilat not equipped?)" },
    // KoL's own generic "there is nothing here for you yet", the string
    // KoLmafia's AdventureRequest reads as "You can't get to that area yet."
    { re: /No, that isn'?t a place yet/i,               why: 'that zone is not open to you yet' },
  ];

  function blockerIn(html) {
    for (const b of BLOCKERS) if (b.re.test(html)) return b.why;
    return null;
  }

  // KoL closes a fight by emitting `window.fightover = true` (and an
  // "Adventure Again" link). That flag is the discriminator, not the presence
  // of the combat forms and not victory prose: the fight-over page still
  // carries the whole block of attack/skill/item/macro forms, so looking for
  // them would read a finished fight as an open one. Verified both ways across
  // KoLmafia's fixtures, and it's the same signal KoLmafia itself keys on --
  // which is also why both of these read the response text rather than a
  // parsed document: KoLmafia matches the same two things in responseText, and
  // keeping them string-pure means they can be tested against real fixtures
  // without a DOM.
  function fightOverIn(html) {
    return /window\.fightover\s*=\s*true/i.test(html) ||
           /id\s*=\s*['"]?againlink/i.test(html);
  }

  // The block of combat forms (`<form name=attack action=fight.php ...>` and
  // its siblings). Present on an OPEN fight and on a just-closed one alike, so
  // this is never a fight-is-on signal by itself.
  function hasFightForms(html) {
    return /<form[^>]+name\s*=\s*['"]?attack['"]?[^>]*>/i.test(html) ||
           /<form[^>]+action\s*=\s*['"]?fight\.php/i.test(html);
  }

  function fightOver(page) { return fightOverIn(page.html); }

  function inFight(page) {
    return hasFightForms(page.html) && !fightOverIn(page.html);
  }

  function whichChoice(doc) {
    const inp = doc.querySelector('input[name="whichchoice"]');
    return inp && inp.value ? inp.value : null;
  }

  // What kind of page is this?
  //   'fight'    a combat round is waiting for input
  //   'choice'   a choice adventure is waiting for input
  //   'plain'    an ordinary result page (noncombat, or a finished fight)
  function pageKind(page) {
    if (inFight(page)) return 'fight';
    if (whichChoice(page.doc) !== null) return 'choice';
    return 'plain';
  }

  // Who we're fighting. KoL tags the round with `<!-- MONSTERID: 551 -->`, the
  // only thing that separates the identically-named monsters some zones run in
  // pairs; the visible name is the fallback. (Same reasoning as
  // quest-helper.js's combat cues.)
  function readMonster(page) {
    const m = page.html.match(/<!--\s*MONSTERID:\s*(\d+)\s*-->/i);
    const nameEl = page.doc.querySelector('#monname');
    return {
      id: m ? parseInt(m[1], 10) : null,
      name: nameEl ? nameEl.textContent.trim() : null,
    };
  }

  // The options a choice page is offering, as { value, text }. Each option is
  // its own little form:
  //   <form name=choiceform1 action=choice.php method=post>
  //     <input type=hidden name=pwd value='...'>
  //     <input type=hidden name=whichchoice value=1336>
  //     <input type=hidden name=option value=1>
  //     <input class=button type=submit value="Recruit toddlers ">
  // ...so the label is the submit button's value, and the option number comes
  // off the hidden input rather than from the button's position on the page.
  function readChoiceOptions(doc) {
    const out = [];
    doc.querySelectorAll('input[name="option"]').forEach(function (inp) {
      const form = inp.closest('form');
      const btn = form ? form.querySelector('input[type="submit"], button') : null;
      out.push({
        value: String(inp.value),
        text: (btn ? (btn.value || btn.textContent) : '').trim(),
      });
    });
    return out;
  }

  // The choice adventure's name, from the blue title bar the page heads with:
  //   <td style="background-color: blue"><b style="color: white">Name</b></td>
  // A chained choice shows a "Results:" recap in that same bar inside
  // #results first, which is not an adventure name -- skip it and take the
  // first real one. (Same locator as the wiki-links title-bar feature in ux-enhancers.js.)
  function readChoiceName(doc) {
    const tds = doc.querySelectorAll('td[style*="background-color: blue"]');
    for (const td of tds) {
      if (td.closest('#results')) continue;
      const b = td.querySelector('b');
      if (b) return b.textContent.trim();
    }
    return '';
  }

  // ===================================================================
  // WHERE YOU WERE LAST
  //
  // Two sources, because neither is certain on its own.
  //
  // api.php?what=status carries a `lastadv` block -- the game's own record of
  // where you were, and the one the charpane's "Last Adventure" line is drawn
  // from:
  //   "lastadv":{"id":"393","name":"The Haunted Bedroom",
  //              "link":"adventure.php?snarfblat=393",
  //              "container":"place.php?whichplace=manor2"}
  // UNVERIFIED against a live dump (the field comes from KoLmafia's
  // ApiRequest), which is why this returns null on anything it doesn't
  // recognise instead of throwing, and why the charpane is read as a second
  // opinion rather than not at all.
  // ===================================================================

  function readLastAdventure(status) {
    const a = status && status.raw && status.raw.lastadv;
    if (!a || typeof a !== 'object') return null;
    const link = typeof a.link === 'string' ? a.link : '';
    if (!link) return null;
    return {
      url: link.replace(/^\//, ''),
      name: typeof a.name === 'string' ? a.name : '',
    };
  }

  // The charpane's own last-adventure link, in whichever pane shape the player
  // uses: expanded keeps it in the "Last Adventure:" block, compact hides it
  // in the `#lastadvmenu` hover menu off the "Adv:" row (the same two shapes
  // placeCharpaneButton has to tell apart). Both are an ordinary
  // `<a href="adventure.php?snarfblat=...">`, so the menu is checked first and
  // the rest of the pane after. A charpane mid-reload just means null, and the
  // caller stops with a reason rather than adventuring somewhere it guessed.
  function lastAdventureFromCharpane() {
    try {
      const cp = top.frames['charpane'];
      const d = cp && cp.document;
      if (!d) return null;
      const sel = 'a[href*="adventure.php?snarfblat="]';
      const menu = d.getElementById('lastadvmenu');
      const a = (menu && menu.querySelector(sel)) || d.querySelector(sel);
      if (!a) return null;
      return {
        url: String(a.getAttribute('href') || '').replace(/^\//, ''),
        name: a.textContent.trim(),
      };
    } catch (e) {
      return null;                     // cross-frame access failed
    }
  }

  // The snarfblat in an adventure url, or null for anything that isn't one.
  // Doubles as the "is this a zone we can re-request in a loop?" test -- see
  // resolveZone for why that question has to be asked.
  function snarfblatOf(url) {
    const m = /adventure\.php\?(?:[^#]*&)?snarfblat=(\d+)/i.exec(String(url || ''));
    return m ? m[1] : null;
  }

  // ===================================================================
  // THE ENGINE
  // ===================================================================

  // A thrown Stop unwinds the run with a reason and no stack-trace noise. Used
  // for every "we should not continue" path so there's one exit.
  function Stop(reason) {
    const e = new Error(reason);
    e.tmStop = true;
    return e;
  }

  function makeCtx(extra) {
    return Object.assign({
      zone: RUN.zone,
      turn: RUN.used + 1,
      cycle: RUN.cycle,
      log: log,
      stop: function (reason) { throw Stop(reason); },
    }, extra || {});
  }

  // Turn the "wherever I adventured last" entry into a real zone. A no-op for
  // every other entry.
  //
  // Resolved ONCE, at the start of a run, and never again: after the first
  // turn the last zone IS this zone, so re-reading it could only do harm --
  // it would let a stray click in the mainpane silently redirect a run that is
  // already going, which is a much worse failure than refusing to start.
  //
  // Only `adventure.php?snarfblat=N` is accepted. A lot of KoL's adventuring
  // happens through place.php urls carrying an `action`, and those are not
  // things to re-request in a loop -- one of them is a door you open once, not
  // a zone you grind. Stopping, with the link quoted back, is the honest
  // answer there.
  //
  // If the resolved zone is one this registry already knows, we hand back that
  // ENTRY rather than a bare url, so the run gets its plan, hints, guard and
  // combat policy. Matching on the snarfblat and not on the name is what makes
  // that safe.
  async function resolveZone(zone, status) {
    if (!zone.dynamic) return zone;

    const last = readLastAdventure(status) || lastAdventureFromCharpane();
    if (!last) {
      throw Stop('I can\'t tell where you adventured last -- ' +
                 'pick a zone from the list instead');
    }
    const snarf = snarfblatOf(last.url);
    if (!snarf) {
      throw Stop('your last adventure (' + (last.name || last.url) + ') isn\'t ' +
                 'a plain adventure.php zone, so I won\'t re-request it in a ' +
                 'loop -- pick a zone from the list instead');
    }

    const known = ZONES.filter(z => snarfblatOf(z.url) === snarf)[0];
    if (known) {
      log('last zone: ' + known.name + ' -- running it with its own settings');
      return known;
    }
    const name = last.name || ('snarfblat ' + snarf);
    log('last zone: ' + name + ' -- nothing special known about it, so ' +
        'choices will stop and ask');
    return { key: zone.key, name: name, url: 'adventure.php?snarfblat=' + snarf };
  }

  // Fight one combat through to its end.
  //
  // The loop condition is KoL's own fight-over flag, so it ends on victory, on
  // defeat and on anything else that closes the fight without this function
  // needing to recognise any of them. Whether you actually won is the caller's
  // business (and the zone's onResult hook's).
  async function runFight(page, status) {
    const policy = RUN.zone.combat || DEFAULT_COMBAT;
    let rounds = 0;
    let macroRan = false;

    while (true) {
      if (!inFight(page)) return page;           // fight is over

      if (RUN.stopRequested) throw Stop('stopped by you (mid-fight)');
      if (++rounds > MAX_ROUNDS_PER_FIGHT) {
        throw Stop('fight ran past ' + MAX_ROUNDS_PER_FIGHT +
                   ' rounds -- left open for you');
      }

      const action = policy(makeCtx({
        round: rounds,
        doc: page.doc,
        html: page.html,
        url: page.url,
        status: status,
        monster: readMonster(page),
        macroRan: macroRan,
      })) || ATTACK;

      if (action.kind === 'stop') {
        throw Stop(action.reason || 'the combat policy stopped the run');
      }
      const fields = fightFields(action);
      if (!fields) throw Stop('unknown combat action "' + action.kind + '"');
      if (action.kind === 'macro') {
        macroRan = true;
        log('handing the fight to your combat macro');
      }

      await sleep(REQUEST_DELAY_MS);
      page = await postPage('fight.php', fields);

      // A macro that couldn't finish hands the fight back mid-way. Say so, then
      // let the next pass fall through to the plain attack loop.
      if (macroRan && inFight(page) && /macro abort|Invalid macro/i.test(page.html)) {
        log('the macro aborted; attacking round by round from here.', 'warn');
      }

      const blocked = blockerIn(page.html);
      if (blocked) throw Stop(blocked);
    }
  }

  // Winning a fight can hand you a choice adventure with no page in between and
  // no turn spent -- the Haunted Bedroom's whole design. KoL holds that choice
  // open and redirects you into it, so asking for choice.php is how we find
  // out. With nothing pending it lands somewhere harmless (main.php) and we
  // read that as "no choice", which is exactly right.
  async function probeChoice() {
    await sleep(REQUEST_DELAY_MS);
    const page = await getPage(ORIGIN + '/choice.php');
    return whichChoice(page.doc) === null ? null : page;
  }

  // Ask the player which option to take, and wait. The run is genuinely paused
  // here -- no timeout, no default. A timeout that picked something would be
  // the exact failure this design exists to prevent.
  function askChoice(which, name, options) {
    return new Promise(function (resolve, reject) {
      RUN.pending = {
        which: String(which),
        name: name,
        options: options,
        resolve: resolve,
        reject: reject,
      };
      setStatus('waiting for you: ' + (name || 'choice ' + which));
      renderPanel();
    });
  }

  function answerPending(option, remember) {
    const p = RUN.pending;
    if (!p) return;
    RUN.pending = null;
    if (remember) {
      const opt = p.options.filter(o => o.value === String(option))[0];
      rememberChoice(p.which, option, opt ? opt.text : '', p.name);
    }
    p.resolve(String(option));
    renderPanel();
    syncButton();
  }

  function cancelPending(reason) {
    const p = RUN.pending;
    if (!p) return;
    RUN.pending = null;
    p.reject(Stop(reason));
  }

  // Answer a choice adventure, following the chain until a non-choice page
  // comes back (a choice can hand you straight to another one, or to a fight).
  async function runChoice(page, status, seen) {
    let hops = 0;

    while (true) {
      const which = whichChoice(page.doc);
      if (which === null) return page;           // out of the choice chain

      if (RUN.stopRequested) throw Stop('stopped by you (in a choice)');
      if (++hops > 10) throw Stop('choice chain did not end after 10 steps');

      const name = readChoiceName(page.doc);
      const options = readChoiceOptions(page.doc);
      if (!options.length) {
        throw Stop('choice ' + which + ' offers no options I can read');
      }

      // The zone's plan first, then a built-in rule for this choice, then
      // what you taught it, then ask. When a plan (or a rule) and a memory
      // both exist the written-down one wins: it is the more deliberate of
      // the two, it is the one that gets maintained alongside the zone, and a
      // pick remembered from before the zone had a plan should not quietly
      // outrank it.
      // ("remembered choices…" still lists that pick, and forgetting it is
      // how you tell the two apart.)
      const planned = planPick(RUN.zone, which, options) ||
                      rulePick(name, options);
      const known = rememberedChoice(which);
      let option = null;

      if (planned) {
        option = planned.option;
        log('choice ' + which + (name ? ' (' + name + ')' : '') + ' -> ' +
            planned.why + ' (option ' + option +
            (planned.label ? ': ' + planned.label : '') + ')');
      } else {
        if (planSteps(RUN.zone, which)) {
          log('choice ' + which + ' is not offering anything ' + RUN.zone.name +
              '\'s plan recognises; falling back.', 'warn');
        }
        option = usableRemembered(known, options);
        if (option) {
          log('choice ' + which + (name ? ' (' + name + ')' : '') +
              ' -> remembered option ' + option +
              (known.label ? ': ' + known.label : ''));
        } else if (known) {
          log('choice ' + which + ' is not offering your remembered option ' +
              known.option + ' this time; asking again.', 'warn');
        }
      }

      if (option === null) {
        const solo = soloPick(options);
        if (solo !== null) {
          option = solo;
          log('choice ' + which + (name ? ' (' + name + ')' : '') +
              ' offers one option; taking it (option ' + solo +
              (options[0].text ? ': ' + options[0].text : '') + ')');
        }
      }

      if (option === null) {
        option = await askChoice(which, name, options);
        setStatus('adventure ' + (RUN.used + 1) + ' of ' + RUN.requested +
                  ' in ' + RUN.zone.name);
      }

      await sleep(REQUEST_DELAY_MS);
      page = await postPage('choice.php', {
        pwd: status.pwd,
        whichchoice: which,
        option: option,
      });
      if (seen) seen(page);

      const blocked = blockerIn(page.html);
      if (blocked) throw Stop(blocked);
    }
  }

  // One turn: spend an adventure in the zone and resolve whatever comes back.
  // The page it settles on carries `pages`, every distinct page the turn went
  // through, so a drop on the fight's last round is still readable after a
  // post-combat choice has replaced it (see ctx.htmlAll).
  async function runOneCycle(status) {
    RUN.cycle++;
    const pages = [];
    const seen = function (p) { if (p && pages.indexOf(p) === -1) pages.push(p); };
    let page = await getPage(withPwd(RUN.zone.url, status.pwd));
    seen(page);

    const blocked = blockerIn(page.html);
    if (blocked) throw Stop(blocked);

    // A fight can end in a choice and a choice can start a fight, so loop until
    // the page settles into something that isn't waiting for input.
    let guard = 0;
    while (true) {
      if (++guard > 12) throw Stop('this turn never settled (fight/choice loop)');

      const kind = pageKind(page);
      if (kind === 'fight') {
        const m = readMonster(page);
        log('fight: ' + (m.name || 'monster' + (m.id ? ' #' + m.id : '')));
        page = await runFight(page, status);
        seen(page);
        // Post-combat choice, if there is one (see probeChoice).
        const followUp = await probeChoice();
        if (followUp) { page = followUp; continue; }
        page.pages = pages;
        return page;
      }
      if (kind === 'choice') {
        page = await runChoice(page, status, seen);
        continue;
      }
      page.pages = pages;
      return page;
    }
  }

  // The run itself.
  //
  // Turns are counted by MEASURING api.php's adventure total, not by counting
  // requests: free fights, the bedroom's free post-combat choices and
  // multi-page choice chains all make "requests sent" a wrong answer, and a
  // helper that over-reports how many turns it spent is worse than useless. The
  // cycle budget is the backstop for a run that stops making progress.
  async function runSession(zone, turns, opts) {
    opts = opts || {};
    RUN.active = true;
    RUN.stopRequested = false;
    RUN.zone = zone;
    RUN.requested = turns;
    RUN.used = 0;
    RUN.cycle = 0;
    RUN.log = [];
    RUN.pending = null;
    RUN.ghostKeys = 0;
    log('starting: ' + turns + ' adventure' + (turns === 1 ? '' : 's') +
        (zone.dynamic ? ' where you were last' : ' in ' + zone.name));

    let stoppedBecause = null;
    let startLevel = null;

    try {
      let status = await getStatus();

      // A dynamic entry becomes a real zone here and stays that way for the
      // rest of the run (see resolveZone). Everything below -- the guard, the
      // plan, the status line -- reads the resolved one.
      zone = await resolveZone(zone, status);
      RUN.zone = zone;

      RUN.startAdv = status.adventures;

      // Stop on level up: the level is read once here and compared after
      // every turn. Unreadable means the option can't work, and the player
      // is told so rather than left believing it's armed.
      if (opts.stopOnLevel) {
        startLevel = levelOf(status);
        if (startLevel === null) {
          log('can\'t read your level from api.php, so "stop on level up" ' +
              'is off for this run.', 'warn');
        } else {
          log('will stop when you pass level ' + startLevel + '.');
        }
      }

      // Once, before anything is spent: the checks that cost a request of
      // their own. A refusal here has to come before the first turn, because
      // what it usually means is that this run could not possibly work.
      if (zone.preflight) {
        const refuse = await zone.preflight(makeCtx({ status: status }));
        if (refuse) throw Stop(refuse);
      }

      if (status.adventures !== null && status.adventures < turns) {
        log('only ' + status.adventures + ' adventures left; will stop there.',
            'warn');
      }

      const budget = turns * CYCLE_BUDGET_FACTOR + CYCLE_BUDGET_CONSTANT;

      while (RUN.used < turns) {
        if (RUN.stopRequested) throw Stop('stopped by you');
        if (RUN.cycle >= budget) {
          throw Stop('gave up after ' + RUN.cycle + ' requests without ' +
                     'spending ' + turns + ' adventures');
        }

        status = await getStatus();
        if (status.adventures !== null && status.adventures <= 0) {
          throw Stop('out of adventures');
        }
        if (status.hp !== null && status.maxhp) {
          if (status.hp <= Math.floor(status.maxhp * HP_FLOOR_FRACTION)) {
            throw Stop('HP down to ' + status.hp + '/' + status.maxhp);
          }
        }

        const refuse = zone.guard ? zone.guard(makeCtx({ status: status })) : null;
        if (refuse) throw Stop(refuse);

        setStatus('adventure ' + (RUN.used + 1) + ' of ' + turns +
                  ' in ' + zone.name);

        const page = await runOneCycle(status);

        // Measure what the turn actually cost.
        const after = await getStatus();
        if (RUN.startAdv !== null && after.adventures !== null) {
          RUN.used = RUN.startAdv - after.adventures;
        } else {
          // api.php unreadable: fall back to counting cycles, and say so rather
          // than reporting a number we didn't measure.
          RUN.used++;
          log('could not read the adventure count; counting requests instead.',
              'warn');
        }

        const done = zone.onResult
          ? zone.onResult(makeCtx({
              doc: page.doc, html: page.html, url: page.url, status: after,
              htmlAll: (page.pages || [page]).map(p => p.html).join('\n'),
            }))
          : null;
        if (done) throw Stop(done);

        // After onResult, so a drop on the levelling turn is still counted.
        const newLevel = opts.stopOnLevel ? leveledUp(startLevel, after) : null;
        if (newLevel !== null) throw Stop('you levelled up (now level ' + newLevel + ')');

        await sleep(REQUEST_DELAY_MS);
      }
    } catch (e) {
      stoppedBecause = e && e.tmStop ? e.message : ('error: ' + (e && e.message));
      if (!(e && e.tmStop)) console.error('Auto Combat:', e);
    } finally {
      RUN.active = false;
      RUN.pending = null;
      const spent = RUN.used + ' of ' + RUN.requested + ' adventure' +
                    (RUN.requested === 1 ? '' : 's');
      if (RUN.zone && RUN.zone.summary) {
        try { log(RUN.zone.summary()); } catch (e) { /* cosmetic */ }
      }
      if (stoppedBecause) {
        log('stopped after ' + spent + ' -- ' + stoppedBecause,
            /^error:/.test(stoppedBecause) ? 'error' : 'warn');
        setStatus('stopped: ' + stoppedBecause);
      } else {
        log('done: ' + spent + '.');
        setStatus('finished ' + spent);
      }
      // Whatever we did, the mainpane and charpane are now showing something
      // several turns stale. Refresh them so the player isn't looking at a lie.
      refreshFrames();
      syncButton();
    }
  }

  function refreshFrames() {
    for (const f of ['charpane', 'mainpane']) {
      try {
        const w = top.frames[f];
        if (w && w.location) w.location.reload();
      } catch (e) { /* frame unreachable; nothing to refresh */ }
    }
  }

  // ===================================================================
  // PREFERENCES (UI state only)
  // ===================================================================

  function loadPrefs() {
    try {
      const raw = localStorage.getItem(PREFS_KEY);
      const p = raw ? JSON.parse(raw) : {};
      return { zone: p.zone || ZONES[0].key, turns: p.turns || 5,
               stopOnLevel: !!p.stopOnLevel };
    } catch (e) {
      return { zone: ZONES[0].key, turns: 5, stopOnLevel: false };
    }
  }

  function savePrefs(p) {
    try { localStorage.setItem(PREFS_KEY, JSON.stringify(p)); }
    catch (e) { /* storage unavailable */ }
  }

  // ===================================================================
  // UI
  //
  // The panel is rendered into the MAINPANE document (as iotm.js does): this
  // menu frame is a thin bar and anything stacked in it gets clipped by the
  // frame boundary. That means the panel dies whenever the mainpane navigates
  // -- which is fine, because RUN lives here and reopening re-renders it.
  // ===================================================================

  let panelCleanup = null;

  function panelDoc() {
    try {
      const mp = top.frames['mainpane'];
      if (mp && mp.document && mp.document.body) return mp.document;
    } catch (e) { /* cross-frame access failed; fall back */ }
    return document.body ? document : null;
  }

  function panelEl() {
    const d = panelDoc();
    return d ? d.getElementById(PANEL_ID) : null;
  }

  function closePanel() {
    if (panelCleanup) {
      panelCleanup();
      panelCleanup = null;
    }
  }

  function zoneByKey(key) {
    return ZONES.filter(z => z.key === key)[0] || null;
  }

  function el(d, tag, css, text) {
    const e = d.createElement(tag);
    if (css) e.style.cssText = css;
    if (text != null) e.textContent = text;
    return e;
  }

  function openPanel(anchorBtn) {
    closePanel();
    const d = panelDoc();
    if (!d) return;

    const prefs = loadPrefs();

    const pop = el(d, 'div', [
      'position:fixed',
      'z-index:99999',
      'width:340px',
      'display:flex',
      'flex-direction:column',
      'gap:6px',
      'padding:8px',
      'background:#f5f5ff',
      'border:1px solid blue',
      'border-radius:4px',
      'box-shadow:0 2px 6px rgba(0,0,0,0.3)',
      'font-family:arial,sans-serif',
      'font-size:12px',
    ].join(';'));
    pop.id = PANEL_ID;

    pop.appendChild(el(d, 'div', 'font-weight:bold;border-bottom:1px solid #ccd',
                       'Auto Combat'));

    // --- zone picker ---
    const zoneSel = el(d, 'select', 'width:100%;font-size:12px');
    ZONES.forEach(function (z) {
      const o = el(d, 'option', null, z.name);
      o.value = z.key;
      zoneSel.appendChild(o);
    });
    zoneSel.value = prefs.zone;
    pop.appendChild(zoneSel);

    // white-space keeps the newline the live half writes (see syncNote): the
    // note is set with textContent, and without it that newline would collapse
    // into the sentence before it.
    const note = el(d, 'div',
                    'color:#555;font-size:11px;min-height:26px;white-space:pre-line');
    pop.appendChild(note);

    // "Wherever I adventured last" is the one entry whose label doesn't say
    // where it will go, so the note answers that -- which costs an api.php
    // read. `noteSeq` is why: the answer can land after the player has already
    // picked a different zone (or closed the panel), and a note describing a
    // zone that is no longer selected would be worse than no note at all.
    let noteSeq = 0;
    function syncNote() {
      const z = zoneByKey(zoneSel.value);
      const base = (z && z.note) || '';
      note.textContent = base;
      const mine = ++noteSeq;
      if (!z || (!z.dynamic && !z.liveNote)) return;
      getStatus().then(function (status) {
        if (mine !== noteSeq || !note.isConnected) return;
        if (z.liveNote) {
          return Promise.resolve(z.liveNote(status)).then(function (extra) {
            if (mine !== noteSeq || !note.isConnected || !extra) return;
            note.textContent = base + '\n' + extra;
          });
        }
        const last = readLastAdventure(status) || lastAdventureFromCharpane();
        note.textContent = base + '\nRight now that is ' +
          (last ? (last.name || last.url) : 'somewhere I can\'t read') + '.';
      }).catch(function () { /* leave the plain note up */ });
    }
    zoneSel.addEventListener('change', syncNote);
    syncNote();

    // --- turn count + start/stop ---
    const row = el(d, 'div', 'display:flex;gap:6px;align-items:center');
    row.appendChild(el(d, 'span', null, 'Adventures:'));

    const turnsInp = el(d, 'input', 'width:60px;font-size:12px');
    turnsInp.type = 'number';
    turnsInp.min = '1';
    turnsInp.max = '200';
    turnsInp.value = String(prefs.turns);
    row.appendChild(turnsInp);

    const startBtn = el(d, 'button', 'flex:1 1 auto;cursor:pointer', 'Start');
    startBtn.type = 'button';
    row.appendChild(startBtn);

    const stopBtn = el(d, 'button', 'cursor:pointer', 'Stop');
    stopBtn.type = 'button';
    row.appendChild(stopBtn);
    pop.appendChild(row);

    const levelWrap = el(d, 'label', 'display:block;font-size:11px;cursor:pointer');
    const levelChk = d.createElement('input');
    levelChk.type = 'checkbox';
    levelChk.checked = !!prefs.stopOnLevel;
    levelWrap.appendChild(levelChk);
    levelWrap.appendChild(d.createTextNode(' stop on level up'));
    pop.appendChild(levelWrap);

    // --- status, the ask-me block, and the log ---
    const statusLine = el(d, 'div', 'font-weight:bold;min-height:14px');
    statusLine.id = 'tm-autocombat-status';
    pop.appendChild(statusLine);

    const ask = el(d, 'div');
    ask.id = 'tm-autocombat-ask';
    pop.appendChild(ask);

    const logBox = el(d, 'div', [
      'height:150px',
      'overflow-y:auto',
      'background:#fff',
      'border:1px solid #ccd',
      'padding:3px',
      'font-family:monospace',
      'font-size:11px',
      'white-space:pre-wrap',
    ].join(';'));
    logBox.id = 'tm-autocombat-log';
    pop.appendChild(logBox);

    const footer = el(d, 'div', 'display:flex;justify-content:flex-end');
    const memBtn = el(d, 'button', 'cursor:pointer;font-size:11px',
                      'remembered choices…');
    memBtn.type = 'button';
    memBtn.addEventListener('click', function () { openChoicesPopup(d); });
    footer.appendChild(memBtn);
    pop.appendChild(footer);

    startBtn.addEventListener('click', function () {
      if (RUN.active) return;
      const zone = zoneByKey(zoneSel.value);
      const turns = num(turnsInp.value);
      if (!zone) return;
      if (!turns || turns < 1) {
        setStatus('give me a number of adventures first.');
        return;
      }
      savePrefs({ zone: zone.key, turns: turns, stopOnLevel: levelChk.checked });
      // Deliberately fire-and-forget: the run outlives this handler, and every
      // failure path inside runSession already lands in the log.
      runSession(zone, turns, { stopOnLevel: levelChk.checked });
      syncButton();
      renderPanel();
    });

    stopBtn.addEventListener('click', function () {
      if (!RUN.active) return;
      RUN.stopRequested = true;
      // A run parked on a choice is asleep inside a promise, so asking it to
      // stop means waking it up with the refusal rather than setting a flag it
      // will never get round to reading.
      if (RUN.pending) cancelPending('stopped by you');
      else setStatus('stopping after this step…');
    });

    d.body.appendChild(pop);

    // Anchor under the button when the click came from a button in THIS
    // frame. It no longer usually does -- the button is in the charpane, whose
    // left origin is not the mainpane's, so its rect would place the panel
    // somewhere meaningless. No anchor, no guess: a fixed corner instead.
    const r = anchorBtn && anchorBtn.getBoundingClientRect ?
      anchorBtn.getBoundingClientRect() : null;
    if (r) {
      let left = r.left - pop.offsetWidth + r.width;
      if (left < 2) left = 2;
      pop.style.left = left + 'px';
      pop.style.top = '4px';
    } else {
      pop.style.left = '20px';
      pop.style.top = '20px';
    }

    // Close on Escape only. An outside-click close (iotm.js's rule) is wrong
    // here: the panel is the only view of a run in progress -- and the only way
    // to answer a choice it's waiting on -- so clicking the mainpane to check
    // something must not tear it down.
    function onKey(e) { if (e.key === 'Escape') closePanel(); }
    const docs = d === document ? [document] : [d, document];
    docs.forEach(doc => doc.addEventListener('keydown', onKey, true));

    // The panel is a view of RUN, which changes from the engine's timers, so
    // repaint on a tick as well as on every log() call.
    const timer = setInterval(renderPanel, 1000);

    panelCleanup = function () {
      clearInterval(timer);
      docs.forEach(doc => doc.removeEventListener('keydown', onKey, true));
      const cp = d.getElementById(CHOICES_POPUP_ID);
      if (cp && cp.parentNode) cp.parentNode.removeChild(cp);
      if (pop.parentNode) pop.parentNode.removeChild(pop);
    };

    renderPanel();
  }

  // Repaint the live parts of the panel from RUN. A no-op when it's closed --
  // which is why the engine can call log() freely without caring about the UI.
  function renderPanel() {
    const pop = panelEl();
    if (!pop) return;
    const d = pop.ownerDocument;

    const statusLine = d.getElementById('tm-autocombat-status');
    if (statusLine) {
      statusLine.textContent = RUN.status || (RUN.active ? 'running…' : 'idle');
      statusLine.style.color = RUN.pending ? '#a60' : RUN.active ? '#060' : '#333';
    }

    renderAsk(d);

    const logBox = d.getElementById('tm-autocombat-log');
    if (logBox) {
      const atBottom =
        logBox.scrollTop + logBox.clientHeight >= logBox.scrollHeight - 20;
      logBox.textContent = RUN.log.map(function (e) {
        const t = e.t.toTimeString().slice(0, 8);
        const mark = e.kind === 'error' ? '!! ' : e.kind === 'warn' ? '* ' : '';
        return t + '  ' + mark + e.msg;
      }).join('\n');
      if (atBottom) logBox.scrollTop = logBox.scrollHeight;
    }
  }

  // The block that appears when the run is parked on a choice it doesn't know.
  // Rebuilt only when the pending choice changes, not on every 1s repaint --
  // otherwise the "remember" checkbox would keep resetting itself under the
  // player's hand.
  function renderAsk(d) {
    const ask = d.getElementById('tm-autocombat-ask');
    if (!ask) return;
    const key = RUN.pending ? RUN.pending.which + '#' + RUN.pending.options.length : '';
    if (ask.getAttribute('data-for') === key) return;
    ask.setAttribute('data-for', key);
    while (ask.firstChild) ask.removeChild(ask.firstChild);
    if (!RUN.pending) return;

    const p = RUN.pending;
    ask.style.cssText =
      'border:1px solid #d9a;background:#fff8f0;padding:5px;border-radius:3px';

    ask.appendChild(el(d, 'div', 'font-weight:bold',
      (p.name || 'Choice ' + p.which) + '  (choice ' + p.which + ')'));
    ask.appendChild(el(d, 'div', 'font-size:11px;color:#555;margin-bottom:4px',
      'I have not seen this one before. Pick an option and I will remember it.'));

    const rememberWrap = el(d, 'label', 'display:block;font-size:11px;margin-bottom:4px');
    const remember = d.createElement('input');
    remember.type = 'checkbox';
    remember.checked = true;
    rememberWrap.appendChild(remember);
    rememberWrap.appendChild(d.createTextNode(' remember this pick for next time'));
    ask.appendChild(rememberWrap);

    const hints = (RUN.zone && RUN.zone.hints && RUN.zone.hints[p.which]) || {};

    p.options.forEach(function (o) {
      const line = el(d, 'div', 'display:flex;gap:5px;align-items:baseline;margin:2px 0');
      const b = el(d, 'button', 'cursor:pointer;font-size:11px;flex:0 0 auto',
                   o.value + '. ' + (o.text || '(no label)'));
      b.type = 'button';
      b.addEventListener('click', function () {
        answerPending(o.value, remember.checked);
      });
      line.appendChild(b);
      if (hints[o.value]) {
        line.appendChild(el(d, 'span', 'font-size:10px;color:#666', hints[o.value]));
      }
      ask.appendChild(line);
    });
  }

  // The remembered-choice list: review what the script has learned, and forget
  // any of it. Mirrors the TH script's "remembered choices..." popup.
  function openChoicesPopup(d) {
    const old = d.getElementById(CHOICES_POPUP_ID);
    if (old && old.parentNode) old.parentNode.removeChild(old);

    const pop = el(d, 'div', [
      'position:fixed',
      'left:20px',
      'top:20px',
      'z-index:100000',
      'width:360px',
      'max-height:70vh',
      'overflow-y:auto',
      'padding:8px',
      'background:#fff',
      'border:1px solid blue',
      'border-radius:4px',
      'box-shadow:0 2px 6px rgba(0,0,0,0.3)',
      'font-family:arial,sans-serif',
      'font-size:12px',
    ].join(';'));
    pop.id = CHOICES_POPUP_ID;

    const head = el(d, 'div', 'display:flex;justify-content:space-between;' +
                              'align-items:center;border-bottom:1px solid #ccd');
    head.appendChild(el(d, 'div', 'font-weight:bold', 'Remembered choices'));
    const close = el(d, 'button', 'cursor:pointer;font-size:11px', 'close');
    close.type = 'button';
    close.addEventListener('click', function () {
      if (pop.parentNode) pop.parentNode.removeChild(pop);
    });
    head.appendChild(close);
    pop.appendChild(head);

    const body = el(d, 'div');
    pop.appendChild(body);

    function paint() {
      while (body.firstChild) body.removeChild(body.firstChild);
      const all = allChoices();
      const keys = Object.keys(all).sort((a, b) => Number(a) - Number(b));
      if (!keys.length) {
        body.appendChild(el(d, 'div', 'color:#666;padding:6px 0',
                            'Nothing remembered yet.'));
        return;
      }
      keys.forEach(function (k) {
        const c = all[k];
        const line = el(d, 'div', 'display:flex;gap:6px;align-items:baseline;' +
                                  'padding:3px 0;border-bottom:1px solid #eee');
        const txt = el(d, 'div', 'flex:1 1 auto');
        txt.appendChild(el(d, 'div', null,
          (c.name || 'Choice ' + k) + '  →  option ' + c.option +
          (c.label ? ': ' + c.label : '')));
        txt.appendChild(el(d, 'div', 'font-size:10px;color:#888',
                           'choice ' + k));
        line.appendChild(txt);
        const del = el(d, 'button', 'cursor:pointer;font-size:11px', 'forget');
        del.type = 'button';
        del.addEventListener('click', function () { forgetChoice(k); paint(); });
        line.appendChild(del);
        body.appendChild(line);
      });

      const all2 = el(d, 'div', 'display:flex;justify-content:flex-end;padding-top:6px');
      const delAll = el(d, 'button', 'cursor:pointer;font-size:11px', 'forget all');
      delAll.type = 'button';
      delAll.addEventListener('click', function () {
        if (d.defaultView.confirm('Forget every remembered choice?')) {
          saveChoices({});
          paint();
        }
      });
      all2.appendChild(delAll);
      body.appendChild(all2);
    }

    paint();
    d.body.appendChild(pop);
  }

  // --- the charpane button ----------------------------------------------
  //
  // The button sits in the CHARPANE, under the Last Adventure readout, while
  // the engine above stays in the menu frame. That split exists because four
  // buttons crowded into the menu frame's one strip ran off its right edge --
  // the sidebar has room and is where you are already looking mid-run.
  //
  // It means the two halves are in different frames, and the charpane is torn
  // down and rebuilt on most turns while the menu frame is not. So:
  //
  //   - the charpane copy of this script re-injects the button on every
  //     charpane load (the id guard makes that a no-op if one is already up);
  //   - it owns no state at all. Clicking it looks the engine up across the
  //     frames and calls into it, so a stale button cannot drive a dead engine;
  //   - the engine reaches the other way through `buttonEl()` to keep the
  //     button's label in step with the run, and fails quiet when the charpane
  //     is mid-reload and there is no button to update.

  const MENU_API = 'tmAutoCombat';

  // The engine's half, wherever it is. Looked up per click rather than cached:
  // the menu frame outlives the charpane, but not the other way round, and a
  // captured reference to a torn-down frame is worse than no reference.
  function engine() {
    const wins = [];
    try { wins.push(top.frames['topmenu']); } catch (e) { /* not reachable */ }
    try { wins.push(top.frames['awesomemenu']); } catch (e) { /* not reachable */ }
    try { Array.prototype.push.apply(wins, Array.prototype.slice.call(top.frames)); }
    catch (e) { /* not reachable */ }
    for (const w of wins) {
      try { if (w && w[MENU_API]) return w[MENU_API]; } catch (e) { /* cross-origin */ }
    }
    return null;
  }

  // The button, whichever frame this copy of the script is running in. The
  // engine calls this from the menu frame, so it has to cross into the
  // charpane -- and tolerate the charpane not being there.
  function buttonEl() {
    if (ON_CHARPANE) return document.getElementById(BUTTON_ID);
    try {
      const cp = top.frames['charpane'];
      return (cp && cp.document && cp.document.getElementById(BUTTON_ID)) || null;
    } catch (e) {
      return null;
    }
  }

  // The button doubles as the run's only indicator once the panel is closed --
  // which matters most when the run is parked on a choice, since it will wait
  // there forever until someone opens the panel and answers.
  function syncButton() {
    const btn = buttonEl();
    if (!btn) return;
    paintButton(btn, { active: RUN.active, pending: !!RUN.pending });
  }

  function paintButton(btn, state) {
    if (state && state.pending) {
      btn.textContent = 'Auto ❗';
      btn.style.backgroundColor = '#ffd9a0';
      btn.title = 'Auto combat: waiting for you to pick a choice';
    } else if (state && state.active) {
      btn.textContent = 'Auto ▶';
      btn.style.backgroundColor = '#d8f0d8';
      btn.title = 'Auto combat: running';
    } else {
      btn.textContent = 'Auto';
      btn.style.backgroundColor = 'white';
      btn.title = 'Auto combat';
    }
  }

  function makeButton() {
    const btn = document.createElement('button');
    btn.id = BUTTON_ID;
    btn.type = 'button';
    btn.title = 'Auto combat';
    btn.textContent = 'Auto';
    btn.style.cssText = [
      'padding:0 5px',
      'font-size:10px',
      'font-family:arial',
      'height:18px',
      'cursor:pointer',
      'white-space:nowrap',
      'background-color:white',
    ].join(';');
    btn.addEventListener('click', function () {
      const api = engine();
      if (!api) {
        // Honest failure. A button that silently does nothing would read as a
        // broken run rather than as a script that isn't loaded where it needs
        // to be.
        const w = window.alert ? window : (document.defaultView || window);
        w.alert('Auto Combat isn\'t running in the menu frame, so there is no ' +
          'engine for this button to talk to. Reload the game (F5) -- and check ' +
          'the script is enabled on topmenu.php / awesomemenu.php.');
        return;
      }
      api.toggle();
      // The engine repaints from its own side too, but only once it has done
      // something; do it now so the click feels connected.
      const btnNow = document.getElementById(BUTTON_ID);
      if (btnNow) paintButton(btnNow, api.state());
    });
    return btn;
  }

  // Where the button goes, in the charpane's own terms. Both panes are
  // covered, and they are laid out differently:
  //
  //   expanded -- "Last Adventure:" is its own <center> block, label then a
  //               one-row table with the zone link. We append inside it.
  //   compact  -- there is no such block; the last adventure is the "Adv:" row
  //               of the stats table, with the zone in a hover menu
  //               (#lastadvmenu). We go straight after that table, which puts
  //               us in the same place on screen.
  //
  // Both markups are KoL's own, from KoLmafia's charpane fixtures
  // (test_charpane_basic.html / test_charpane_compact.html). Each step falls
  // through to the next, and the last one always works, so an unrecognised
  // charpane still gets a usable button rather than none.
  function placeCharpaneButton(btn) {
    const wrap = document.createElement('div');
    wrap.style.cssText = 'text-align:center;margin:2px 0';
    wrap.appendChild(btn);

    // Expanded: the "Last Adventure:" block.
    const anchors = Array.from(document.querySelectorAll('a'));
    const label = anchors.find((a) => /^\s*last adventure/i.test(a.textContent || ''));
    const block = label && label.closest && label.closest('center');
    if (block) { block.appendChild(wrap); return; }

    // Compact: after the stats table that carries the "Adv:" row.
    const menu = document.getElementById('lastadvmenu');
    const table = menu && menu.closest && menu.closest('table');
    if (table && table.parentNode) {
      table.insertAdjacentElement('afterend', wrap);
      return;
    }

    // Neither shape found. The quest block is the next thing down the pane, so
    // sitting just above it is still roughly where we meant to be.
    const nudge = document.getElementById('nudgeblock');
    if (nudge && nudge.parentNode) {
      nudge.parentNode.insertBefore(wrap, nudge);
      return;
    }

    console.warn('Auto Combat: no last-adventure block in the charpane, ' +
                 'placing button at the top of the sidebar.');
    document.body.insertBefore(wrap, document.body.firstChild);
  }

  function addButton() {
    if (document.getElementById(BUTTON_ID)) return;   // idempotency guard
    if (!document.body) return;
    const btn = makeButton();
    placeCharpaneButton(btn);
    const api = engine();
    if (api) paintButton(btn, api.state());
  }

  // The engine's half of the contract, published on the menu frame's window so
  // the charpane copy can reach it. Deliberately tiny: open/close the panel,
  // and say what the run is doing. Everything else stays in here.
  function publishEngine() {
    window[MENU_API] = {
      toggle: function () {
        if (panelEl()) closePanel();
        else openPanel(null);
      },
      state: function () {
        return { active: RUN.active, pending: !!RUN.pending };
      },
    };
  }

  function bootButton() {
    if (ON_MENU) { publishEngine(); return; }
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', addButton);
    } else {
      addButton();
    }
  }

  // The one boot call, kept on a line of its own: the test replaces exactly
  // this line with a `return { ... }` to reach the internals (the re-expose
  // trick from AGENTS.md). Move or rename it and
  // tests/auto-combat-fight-state.test.mjs needs the same edit.
  bootButton();
})();
