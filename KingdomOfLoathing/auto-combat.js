// ==UserScript==
// @name         KoL Auto Combat
// @author       Tilo
// @namespace    https://github.com/TiloBuechsenschuss
// @downloadURL  https://raw.githubusercontent.com/TiloBuechsenschuss/userscripts/refs/heads/main/KingdomOfLoathing/auto-combat.js
// @version      0.2
// @description  Adds an "Auto" button next to the IotM button that opens a small panel: pick a zone, say how many adventures, press Start, and it adventures there for you. Fights are handed to your "Auto-Attack until finished" combat macro when you have one saved, and fall back to attacking round by round when you don't. Choice adventures work like the Twilight Heroes script: the first time one comes up the run pauses and the panel offers its options (annotated with what the zone's wiki page says each does); pick one and it's remembered, and answered by itself from then on. A "remembered choices" list lets you review or forget any of them. Turns are counted from api.php's adventure total rather than from requests sent, and anything it doesn't recognise stops the run rather than guessing. First zone: The Haunted Bedroom.
// @match        https://www.kingdomofloathing.com/awesomemenu.php*
// @match        https://kingdomofloathing.com/awesomemenu.php*
// @match        https://www.kingdomofloathing.com/topmenu.php*
// @match        https://kingdomofloathing.com/topmenu.php*
// @grant        none

// ==/UserScript==

(function () {
  'use strict';

  // Bundled-loader safety: the all-in-one loader @requires every KoL script and
  // runs them on the union of all matched pages. Guard our own page(s)
  // explicitly, or the button would be dropped into sibling frames (charpane,
  // mainpane, ...). A no-op for the standalone install, whose @match already
  // scopes it here.
  if (!/\/(awesomemenu|topmenu)\.php/i.test(location.pathname)) return;

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
  //             'adventure.php?snarfblat=<id>'.
  //   note      Optional one-liner shown under the dropdown.
  //   hints     Optional { whichchoice: { option: 'what it does' } }. Pure
  //             annotation, shown beside each option when the run stops to ask
  //             -- it NEVER picks anything. Wiki knowledge goes here.
  //   guard(ctx)     Optional. Called before each turn; return a string to stop
  //                  with that reason, or null to proceed.
  //   combat(ctx)    Optional. Per-round policy returning an ACTION. Falls back
  //                  to DEFAULT_COMBAT.
  //   onResult(ctx)  Optional. Called after each resolved turn; return a string
  //                  to end the run ("the drop we came for landed").
  //
  // ctx carries { zone, turn, cycle, doc, html, url, status, monster,
  //               whichchoice, macroRan, log(msg), stop(reason) }, with the
  // fields that don't apply to the moment left undefined.
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
      },
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
  // first real one. (Same locator as wiki-links.js's title-bar branch.)
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
  async function runChoice(page, status) {
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

      const known = rememberedChoice(which);
      let option = usableRemembered(known, options);
      if (option) {
        log('choice ' + which + (name ? ' (' + name + ')' : '') +
            ' -> remembered option ' + option +
            (known.label ? ': ' + known.label : ''));
      } else if (known) {
        log('choice ' + which + ' is not offering your remembered option ' +
            known.option + ' this time; asking again.', 'warn');
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

      const blocked = blockerIn(page.html);
      if (blocked) throw Stop(blocked);
    }
  }

  // One turn: spend an adventure in the zone and resolve whatever comes back.
  async function runOneCycle(status) {
    RUN.cycle++;
    let page = await getPage(withPwd(RUN.zone.url, status.pwd));

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
        // Post-combat choice, if there is one (see probeChoice).
        const followUp = await probeChoice();
        if (followUp) { page = followUp; continue; }
        return page;
      }
      if (kind === 'choice') {
        page = await runChoice(page, status);
        continue;
      }
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
  async function runSession(zone, turns) {
    RUN.active = true;
    RUN.stopRequested = false;
    RUN.zone = zone;
    RUN.requested = turns;
    RUN.used = 0;
    RUN.cycle = 0;
    RUN.log = [];
    RUN.pending = null;
    log('starting: ' + turns + ' adventure' + (turns === 1 ? '' : 's') +
        ' in ' + zone.name);

    let stoppedBecause = null;

    try {
      let status = await getStatus();
      RUN.startAdv = status.adventures;

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
            }))
          : null;
        if (done) throw Stop(done);

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
      return { zone: p.zone || ZONES[0].key, turns: p.turns || 5 };
    } catch (e) {
      return { zone: ZONES[0].key, turns: 5 };
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

    const note = el(d, 'div', 'color:#555;font-size:11px;min-height:13px');
    pop.appendChild(note);
    function syncNote() {
      const z = zoneByKey(zoneSel.value);
      note.textContent = (z && z.note) || '';
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
      savePrefs({ zone: zone.key, turns: turns });
      // Deliberately fire-and-forget: the run outlives this handler, and every
      // failure path inside runSession already lands in the log.
      runSession(zone, turns);
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

    // Anchor under the button. The menu frame and the mainpane share the
    // window's left origin, so the button's x maps across; pin near the top.
    const r = anchorBtn.getBoundingClientRect();
    let left = r.left - pop.offsetWidth + r.width;
    if (left < 2) left = 2;
    pop.style.left = left + 'px';
    pop.style.top = '4px';

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

  // --- the menu button --------------------------------------------------

  // Shared button row under the edit icon, created by whichever of the menu
  // scripts runs first; each claims its slot with CSS `order`, so the
  // left-to-right arrangement doesn't depend on load order. (Checklist is 1,
  // IotM is 2 -- see iotm.js's copy of this function.)
  function getButtonRow() {
    let row = document.getElementById('tm-kol-menu-btns');
    if (row) return row;
    const fixed = document.getElementById('fixedawesome');
    const editLink = document.querySelector('#fixedawesome a.config');
    if (!fixed || !editLink) return null;
    row = document.createElement('div');
    row.id = 'tm-kol-menu-btns';
    row.style.cssText = [
      'position:absolute',
      'top:31px',
      'left:' + Math.max(0, editLink.offsetLeft) + 'px',
      'z-index:3',
      'display:flex',
      'gap:3px',
      'align-items:flex-start',
    ].join(';');
    fixed.appendChild(row);
    return row;
  }

  // The button doubles as the run's only indicator once the panel is closed --
  // which matters most when the run is parked on a choice, since it will wait
  // there forever until someone opens the panel and answers.
  function syncButton() {
    const btn = document.getElementById(BUTTON_ID);
    if (!btn) return;
    if (RUN.pending) {
      btn.textContent = 'Auto ❗';
      btn.style.backgroundColor = '#ffd9a0';
      btn.title = 'Auto combat: waiting for you to pick a choice';
    } else if (RUN.active) {
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
      'padding:0 4px',
      'font-size:9px',
      'font-family:arial',
      'height:22px',
      'cursor:pointer',
      'white-space:nowrap',
      'background-color:white',
    ].join(';');
    btn.addEventListener('click', function () {
      if (panelEl()) closePanel();
      else openPanel(btn);
    });
    return btn;
  }

  function addButton() {
    if (document.getElementById(BUTTON_ID)) return;   // idempotency guard

    const btn = makeButton();
    const row = getButtonRow();
    if (row) {
      btn.style.order = '3';       // right of checklist (1) and IotM (2)
      row.appendChild(btn);
      return;
    }

    // Text-mode topmenu fallback: sit after the IotM button if it's there, else
    // after the checklist button, else after a plain "edit" link.
    const anchor = document.getElementById('tm-iotm-btn') ||
                   document.getElementById('tm-checklist-btn');
    if (anchor) {
      anchor.insertAdjacentElement('afterend', btn);
      return;
    }
    for (const a of document.querySelectorAll('a')) {
      const t = a.textContent.trim().toLowerCase().replace(/^\[|\]$/g, '');
      if (t === 'edit') {
        a.insertAdjacentElement('afterend', btn);
        return;
      }
    }

    console.warn('Auto Combat: no anchor point found, ' +
                 'placing button at top of frame.');
    document.body.insertBefore(btn, document.body.firstChild);
  }

  function bootButton() {
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', addButton);
    } else {
      addButton();
    }
  }

  // The one boot call, kept on a line of its own: the test replaces exactly
  // this line with a `return { ... }` to reach the internals (the re-expose
  // trick from AGENTS.md). Move or rename it and
  // test/auto-combat-fight-state.test.mjs needs the same edit.
  bootButton();
})();
