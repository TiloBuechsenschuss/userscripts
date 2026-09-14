// ==UserScript==
// @name         Fallen London Choice Helper
// @author       Tilo
// @namespace    https://github.com/TiloBuechsenschuss
// @downloadURL  https://raw.githubusercontent.com/TiloBuechsenschuss/userscripts/refs/heads/main/FallenLondon/choice-helper.js
// @version      1.4
// @description  Advice on what Fallen London's storylets and opportunity cards do for you, badged onto them where you make the choice. Its reference panels open from the "⚙ UX" button of Fallen London UX Enhancers, so install that as well to reach them; every badge works without it. (1) In The Crowds of Spite (the Pickpocket's Promenade) every opportunity card gets a rating badge showing the bonus Pickpocket's Trophies it pays on a successful pickpocket (+0 to +9), colour-coded from grey to gold, with a dagger when the card draws from the inferior skill table, and a tooltip carrying the Shadowy challenge, the pass-by option and what a failed pickpocket costs. Watchful Eyes and the Rat-Catcher, which give no trophies at all, are labelled instead of scored. (2) While zailing the Unterzee every opportunity card gets a badge showing what the best line you can take with nothing special in hand costs you in Troubled Waters, in change points, and whether it makes full progress, half, or none -- with a tooltip carrying every option on the card: its challenge, what it is gated on, what it gives, and what a failure costs. Black (urgent) cards are marked as the blockages they are. Its panel, Zailing, holds the numbers behind a voyage: how much Zailing... each route needs and roughly what that costs in actions per ship, the Zee Peril of every region, what Troubled Waters does at 7 and at 8 and which zee-threat turns it into which black card, every port on the Unterzee -- which region it is in, whether docking there wipes Troubled Waters and the zee-threats, and what it takes to be able to sail there at all, with the hunting grounds and the one-time destinations marked as the different things they are, since a port that resets nothing and a place that is not a dock are two different answers -- the three winds and the dreams they start, and the whole card table, searchable. (3) During the Fruits of the Zee Festival every wreck-diving card gets a badge showing the Thalassic Favour its treasure trades for at the Fruit Market, with a colour of its own for each of the eight figures the festival pays -- a light ramp running from aquamarine through blue, violet and rose to gold, so no two payouts look alike and none of them disappears into the card art underneath, with a star when the card also offers a rare item you have not got yet, a tick when you already hold everything it offers, and a question mark when your Possessions have not been read so neither can be claimed. Every value at this festival depends on how deep you are, so the badge quotes the figure for your depth wherever that can be established and otherwise shows the range across the depths rather than a number it cannot justify. Fallen London states Full Fathom Five on the Myself tab and never on the diving screen, so opening the panel loads Myself in the background and reads the depth off it the same way it reads which items you hold -- used only while that reading is a minute old at most, because every successful dive changes it. Over the top of that, while you are in the Royal Approach the script puts a depth control in the page itself -- a light blue card, so it reads as a control of yours rather than as one more dark box in a dark page: behind the UX button where that is docked beside Fallen London’s own Travel button, and again above your diving hand, so going a level deeper is one tap and every badge is exact again without opening anything. On a phone that control is a single light blue chip in the banner showing the depth, which cycles through the five and back to automatic. A depth you set by hand is forgotten the moment you surface, so it can never quietly go wrong. A coral pays no Favour and is labelled instead, gold until you hold one of the three items it turns into -- the three are mechanically identical, differing only in name, so any one of them finishes that coral for good and a second is a change of outfit rather than a reward -- with how many of that coral you are already carrying in brackets so two coral cards never read alike. A card offering a named piece of unique equipment adds the same label after its figure -- "400 - item (3)" -- since one of those is worth more than the Favour it trades for and every one beyond the first is trade-in stock, priced in the tooltip. The tooltip carries every claim the card offers at that depth, what it gives, and -- for a coral -- which band of Sights at the Festival yields which of the three. Its panel, Fruits of the Zee, is the checklist: how much Favour, Devotion, depth and Sights you have, how many actions it takes to reach each Devotion level and -- following a comment on the guide -- which Devotion to stop at and which depth to dive to, staged by what you still have left to collect rather than by the corals alone, which of the nineteen collectable items you are still missing (one per coral, the six that only turn up while diving, the six sold at the stalls and the Bride’s Litter-Cyst) and how to get each one, a depth-by-depth list of the unique rewards you have not got yet -- currency-only cards left out of it -- marking the ones a deeper dive would throw away, since a dive commits you to a depth and some rewards are only in the shallows, what your treasures and spare equipment would fetch if you traded them in, the whole card-by-depth table, and the stall price list marked with what you can afford. Anything you could collect right now -- a coral in hand while Sights sits in the right band, or an item you have the Favour for -- is called out at the top. On Supplication on the Shore itself, each option is badged in the game with the attribute its reward scales off -- every option pays the same Devotion, so that is the only thing separating them, and since which options you are offered depends on Airs of a Barren Zee (re-rolled every time you act) the useful question is which of the two or three in front of you right now matches your best stat. The two branches that raise no Devotion are labelled instead: the Custodial Chef as free, and the Fathomking’s servant as 7 Fate for a jump straight to Devotion 11. (4) In Port Carnelian, where a governor's term runs 26 actions and Fallen London deals no opportunity cards at all, the badges go on storylets and on their options instead. The whole term is one storylet, Matters of State, so what is rated is the list of options inside it -- and the options of the two of those that open into a storylet of their own. Each shows the net change in resources that option makes, with a mark for what it does to Imperial Legitimacy -- the number that ends a term at once when it reaches 0, sending you back to zee with nothing: a down mark when the net was paid for out of Legitimacy, an up mark when the option buys Legitimacy back instead, and no mark at all when it leaves Legitimacy alone. The colour says the same thing the mark does and nothing else -- red for spending Legitimacy, green for buying it back, light blue for the rows that leave it alone, slate for the endings -- so the marks are enough on their own for anyone who cannot separate the red from the green. Then a Fate label on the one Fate-locked option, and "cash out" on the four endings, which spend a currency rather than gaining any. The four endings carry a figure rather than only a label: each shows what cashing out would pay you RIGHT NOW, in Echoes, worked out from your own Striped Delights and Silver Horseheads. Fallen London states both on the Myself tab and nowhere near the port, so the script reads them where they are shown, remembers them, and refreshes them in a hidden frame -- in the background while an ending is on screen, and again when the panel is opened on a stale reading -- exactly the way the festival reads how deep you are. A faction Favour is marked with an icon and priced at 0: it is a story quality capped at 7 rather than an item, nothing buys one, and pricing it would let a fixed reward out-rank a real cash-out on a number nobody acts on. Tribute, which has no market price either, is listed the same way and left out of the total. A Favour in High Places is not one of those despite the name -- it is an ordinary item the Bazaar buys -- so it is priced like any other. A question mark says the reading behind the figure is over a minute old, since every action of a term moves both currencies, and the plain "cash out" label is what is left when your numbers have never been read. The tooltip carries the whole sum: what you hold, what it turns into, what each piece is worth, what the next rounding step up would cost you -- 105 and 176 are worth waiting for and 140 is not -- and, for the two endings that pay a fixed reward and empty both purses, what taking one gives up. Half the table is worth the same +5, so whether it costs Legitimacy is the only thing separating those rows. The tooltip carries the Time Passing in Office and Airs windows the option is offered in, every currency change with its currency named, the requirement and the note; the two options that pay ten or fifteen of ONE of the two currencies, the game's choice rather than yours, say so in words, since reading them as that much of each would make them the best options in the table by a distance. A storylet the guide splits in two is badged with the better net and keeps both branches in its tooltip, because the losing branch is how Imperial Legitimacy is bought back. Its panel, Port Carnelian, opens on the same calculator -- your purse, and all four endings priced against it with the best one named in words -- and then holds the rest of the guide: how to unlock and reach the posting, the rules a term is played by, every option grouped by the clock and searchable, what the two currencies cash in for, the reward tiers with the two worth aiming at picked out and a letter against the step each of your two currencies is standing on, and the strategy. (5) On a Voyage of Scientific Discovery -- the Dilmun Club's expeditions to Bullbone Island, Corpsecage Island and Grunting Fen, which deal no opportunity cards either -- every action gets a badge for what it pays in research pages, coloured by which of the three kinds it is: Archaeological, Cryptopalaeontological or Theosophistical. You sail to one island for one kind, and at every step of the visit you are choosing between the action that pays it and one that pays goods instead, so an action paying no pages is labelled with what it does pay rather than scored: there is no exchange rate between pages and Echoes, and inventing one would be the badge choosing your voyage for you. The three gambles at the end of a visit carry their EXPECTED value rather than the figure they advertise, since the wiki gives both outcomes and the odds -- taking the safer of the two is worth about six times the greedier one once the failure is priced in. The tooltip carries the step of the visit the action belongs to, its challenge, everything it gives, what it costs, and what a failure costs; where the game picks between two payouts rather than you, that is said in words. The same badges cover the two screens at your Lodgings, where the pages are generated before you sail and spent afterwards, and there the figure is the guide's pence per page, because everything on that screen is priced. Three actions and three storylets have the same names on all three islands and pay a different kind of page on each, so the feature works out which island it is looking at from the greeting or from the storylet you have open, and says nothing at all rather than guess. Its panel, Scientific Voyages, holds the rest: how the voyage is unlocked, what each island pays and costs to reach, every action grouped by island and searchable, and how to squeeze the most preparatory research out of London first. (6) In your University Laboratory every opportunity card gets a badge for the Laboratory Research its best option pays on a success, worked out at your own Equipment for Scientific Experimentation -- nearly every figure in the lab is a formula on it, and on your students' levels and how many people work there, all of which Fallen London states on the Myself tab, so the script reads them there, remembers them, and refreshes them in the background. The badge ranks only the options you can take with nothing special in hand; one behind an Unavoidable Epiphany, an Unexpected Result or an item is kept in the tooltip and marked with a down triangle when it would pay more. A star marks an option that also hands you an Unavoidable Epiphany, a solid down triangle one that uses something up, a question mark a Watchful challenge's success figure, and an approximately-equal sign the expected value of a Luck option. Where something the figure depends on has not been read -- your Equipment, a student's level -- the badge shows the range rather than a guess, in a neutral grey. Colour runs slate, blue, teal, amber, gold by tens of research, with the number always printed; Parabolan Research is marked PR in violet, and an option that pays no research says what it does instead. Open a card and every option on it is badged in its own right, each tooltip carrying the requirement, the challenge, every outcome with its formula and your figure, and where the guide's student table disagrees with the option page, both. Its panel, University Laboratory, shows your Equipment, staff, students, project and what Circulate a draft of your findings would pay right now, every laboratory card searchable, the repeatable projects, the equipment ladder, and which experts suit which projects. (7) Arbor, of the Roses deals no opportunity cards, so the badges go on the London card that takes you there, A Dream of Roses -- how many actions a trip costs, with your last Possessions reading of Attar saying whether the dream opens on Near or Far Arbor -- on the two storylets a stay happens in, Near Arbor and Far Arbor, whose tooltip is a map of every district's options and the guide's grinds, and on every option inside them. An option's badge is what it changes, "Attar +2" or "Attar −3 EI +3", with the sign carrying the direction and the colour only repeating it: there is no exchange rate between Attar and what it buys, so none is invented. A question mark is a stat challenge's success outcome, with the failure and the stat that makes it certain in the tooltip; ⏏ an option that spends all your Permission to Linger and so ends the stay; a star the tribute's rare success, which cashes in all your Attar; ≈ the expected value of the one even-odds option. The six options that scale with your Permission to Linger or your Attar say so in words rather than invent a figure, and where the guide's table and an option page disagree, the page is followed and the tooltip quotes both. (8) Three early carousels that deal no opportunity cards are badged the same way: the storylet heading gets a summary whose tooltip lists every option, and each option of the carousel storylet you have OPEN gets a badge -- only there, since names like "Make bobbins" or "Treat the soil" could title an option anywhere. A question mark is a stat challenge's success figure, ▼ an option that uses something up, and a figure after the question mark what a failure takes back. At L. B. Industries beneath the Blind Helmsman, a work option shows the Foreman's Favour it pays ("FF +15? −19") and a payout its cost and what it buys ("110 → Reliquary"), with the Bone Fragments your surplus Favour turns into in the tooltip. In the Department of Menace Eradication's hunts, an option shows what it does to Hiding, Wariness or Savagery ("Hiding −10? +1"), with its difficulty -- nearly all of them scale with Savagery -- worked out at each contract's starting Savagery in the tooltip; the poisoned bait's Luck challenge is its expected value; the confrontations and bounties name what they pay, and a contract what it sets. In Vertiginous Horticulture, a nurturing option shows the Nurturing it pays as a range over the Difficulties of the plants it can be used on ("Grow +14–16?"), a plant its Difficulty, and a buyer what the sale gives, with the rare successes, the average success and the scaling reward at 150 in the tooltip. Where the guide and an option page disagree, the page is followed and the tooltip says so. (9) Expeditions from Base-Camp in the Forgotten Quarter get the same treatment across their four storylets, each badge answering the question that screen asks: while preparing, the Crate of Expedition Supplies an option gives ("Sup +3 ▼", with the guide's Echoes per Supply in the tooltip); when choosing, an expedition's length and the Archaeologist or Fate it needs ("30 sup · Arch 3"), with what it pays, its rivals and the guide's worst-case Supplies in the tooltip; on the expedition, the Archaeologist's Progress a success makes ("Prog +3? ▼"), the Rivals' Progress a hindrance takes off, and what a conclusion pays; and in a confrontation, the Progress it makes. A menace an option always raises is named after its figure ("+Wounds", "+Nightmares"), so a cheap line never reads as free; a menace only a failure raises is in the tooltip. Every badge these features draw carries its reasoning in a hover tooltip, and because a hover tooltip does not exist on a phone the same text also opens as a panel when you TAP the badge -- a tap that is kept off the card underneath, so reading one can never play it. Built as a feature registry so further advice can be added as entries.
// @match        https://www.fallenlondon.com/*
// @match        https://fallenlondon.com/*
// @run-at       document-idle
// @noframes
// @grant        none
// ==/UserScript==

(function () {
  'use strict';

  // Advice on what Fallen London's storylets and opportunity cards do: a badge
  // on each one this script has a table for, and a reference panel per area
  // built on the same table. Split out of FallenLondon/ux-enhancers.js at its
  // 3.0, which keeps the quality-of-life tweaks -- including the launcher these
  // panels open from (see "the other Fallen London script").
  //
  // Fallen London is a single-page React app: there is one URL, and storylets,
  // cards and results are swapped into the DOM client-side with no page
  // navigation. So there is no path to gate on and no single document-idle
  // pass that sees everything -- every feature here is instead scoped by the
  // markup it finds, and is re-run on a debounced MutationObserver.
  //
  // Adding a feature (the adding-fallen-london-features skill has the rest):
  //   1. Write a `run()` that finds its own markup and bails harmlessly when
  //      that markup isn't on screen. It will be called on the initial pass and
  //      again on every debounced DOM change, so it must be IDEMPOTENT and
  //      cheap -- use `attachBadge` (or the same dataset-flag trick) rather
  //      than blindly injecting.
  //   2. Add a `{ name, run }` entry to FEATURES at the bottom. A feature that
  //      throws is logged and cannot stop the others.
  //   3. Give it its own badge class and dataset flag so two features can
  //      decorate the same element without fighting over one flag.
  //
  // A feature with reference material to show adds a PANEL -- see the
  // registry at the bottom.

  const SCRIPT_ID = 'FL Choice Helper';

  // === shared: small DOM helpers =========================================

  // Minimal hyperscript. The panels below are a few hundred nodes of table, and
  // this keeps them readable without an innerHTML string (which would be one
  // more place to get escaping wrong the first time a piece of data is not
  // hardcoded). `props` sets properties, except `style` which is merged and
  // `title`/`href`/... which are plain properties anyway.
  function h(tag, props, children) {
    const el = document.createElement(tag);
    if (props) {
      for (const key of Object.keys(props)) {
        const value = props[key];
        if (value == null) continue;
        if (key === 'style') Object.assign(el.style, value);
        else if (key === 'css') el.style.cssText = value;
        else if (key === 'on') for (const ev of Object.keys(value)) el.addEventListener(ev, value[ev]);
        else el[key] = value;
      }
    }
    for (const child of [].concat(children || []).flat(Infinity)) {
      if (child == null || child === false) continue;
      el.appendChild(typeof child === 'string' || typeof child === 'number'
        ? document.createTextNode(String(child))
        : child);
    }
    return el;
  }

  // A link to the Fallen London wiki, by the same "Go" search wiki-links.js
  // uses: an exact title redirects straight to the article, anything else lands
  // on the search results for the text rather than a dead redlink.
  function wikiHref(name) {
    const t = String(name == null ? '' : name).trim().replace(/\s+/g, ' ');
    if (!t) return null;
    return 'https://fallenlondon.wiki/wiki/Special:Search?'
      + new URLSearchParams({ search: t, go: 'Go' }).toString();
  }

  function wikiLink(name, text, style) {
    const href = wikiHref(name);
    if (!href) return document.createTextNode(text || String(name || ''));
    return h('a', {
      href: href, target: '_blank', rel: 'noopener',
      textContent: text || name,
      title: 'FL wiki: ' + name,
      style: Object.assign({ color: 'inherit', textDecoration: 'none', borderBottom: '1px dotted currentColor' }, style || {}),
    });
  }

  // === shared: where you are =============================================
  //
  // Two places say it, and both are verified against real markup.
  //
  // 1. The screen-reader-only block at the top of every page:
  //
  //      <div id="accessible-sidebar" class="accessible-sidebar u-visually-hidden">
  //        <h1 class="welcome"><span>It's <a href="/profile/TheFairUnknown">…</a>!</span>
  //         Welcome to Spite, delicious friend!</h1>
  //
  //    Verified identical on /myself and /possessions, in both the wide and
  //    the narrow layout, and it is there no matter which tab you are on --
  //    which is what makes it the primary. The area has to be dug out of the
  //    sentence, hence the regex.
  //
  // 2. The wide layout's VISIBLE greeting, in the sidebar's `div.travel`
  //    (captured 2026-09-03, on Mutton Island during the Fruits of the Zee):
  //
  //      <p class="heading heading--3"><span>It's <a …>TheFairUnknown</a>!</span>
  //        <br>Welcome to</p>
  //      <p class="heading heading--2 welcome__current-area">Mutton Island,</p>
  //      <p class="heading heading--3">delicious friend!</p>
  //
  //    Here the area sits in an element of its OWN, `.welcome__current-area`,
  //    with nothing to parse but a trailing comma -- so where the sentence in
  //    (1) is split across three paragraphs and its regex can't match, this
  //    still reads cleanly. It is the backstop rather than the primary only
  //    because it belongs to the wide layout's sidebar and nothing has
  //    confirmed it exists in the narrow one.
  function currentArea(doc) {
    const d = doc || document;
    const el = d.querySelector('#accessible-sidebar .welcome');
    const text = el ? el.textContent.replace(/\s+/g, ' ') : '';
    const m = text.match(/Welcome to (.+?),\s*delicious friend/i);
    if (m) return m[1].trim();

    const visible = d.querySelector('.welcome__current-area');
    // Trailing comma from "Mutton Island," -- and a trailing full stop or
    // exclamation mark too, since nothing promises the punctuation.
    const name = visible ? visible.textContent.replace(/\s+/g, ' ').trim().replace(/[,.;!]+$/, '').trim() : '';
    return name || null;
  }

  // === shared: badges ====================================================

  // Every badge this script injects carries BADGE_CLASS plus a per-feature
  // class. The shared class is what lets `headingName` below recognise our own
  // decorations, whichever feature added them.
  const BADGE_CLASS = 'fl-ux-badge';

  // --- reading a badge on a phone ----------------------------------------
  //
  // Every badge carries its reasoning in `title`, and on a touch screen a
  // `title` is INVISIBLE: there is no hover, and a long press raises the text
  // selection menu rather than the tooltip. So on a phone the whole point of
  // these badges -- the challenge, the options, what a failure costs, which
  // Sights band pays which item -- was unreachable. The same text therefore
  // also opens as a panel on TAP, and `title` stays exactly as it was for the
  // desktop hover it already served.
  //
  // **The tap must not reach what is underneath.** On the wide hand layout the
  // badge is positioned over `.hand__card-container`, and a click that got
  // through to it plays the card -- an action, spent for good, on a tap that
  // was meant to read a tooltip. React listens at its own root rather than on
  // the node, so stopping propagation on the badge keeps the click away from
  // it; the pointer/mouse/touch starts are stopped too, since anything bound
  // to one of those would fire before the click ever happened.
  const TIP_ID = 'fl-ux-tip';
  let tipAnchor = null;
  let tipBound = false;

  function hideTip() {
    const el = document.getElementById(TIP_ID);
    if (el && el.remove) el.remove();
    tipAnchor = null;
  }

  // The open panel points at a badge that a React re-render may have thrown
  // away. Called from the same pass that draws the badges, so a tip whose
  // badge has gone goes with it instead of hanging over an unrelated card.
  function pruneTip() {
    if (tipAnchor && tipAnchor.isConnected === false) hideTip();
  }

  function bindTipDismissal() {
    if (tipBound) return;
    tipBound = true;
    // Capture, so it runs before the badge's own handler and a second tap on
    // the SAME badge closes rather than redraws -- hence the badge exemption:
    // without it this would clear `tipAnchor` and the toggle below could never
    // see that the tip it is about to open is the one already open.
    document.addEventListener('click', function (e) {
      const t = e.target;
      if (t && t.closest && t.closest('.' + BADGE_CLASS)) return;
      hideTip();
    }, true);
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' || e.key === 'Esc') hideTip();
    });
    // The panel is fixed to the viewport and the badge is not, so any scroll
    // parts them. Closing is the honest answer; chasing the anchor is not
    // worth the frames.
    if (typeof window !== 'undefined' && window.addEventListener) {
      window.addEventListener('scroll', hideTip, true);
      window.addEventListener('resize', hideTip);
    }
  }

  function showTip(anchor, text) {
    hideTip();
    if (!document.body || !text) return;
    const box = document.createElement('div');
    box.id = TIP_ID;
    box.textContent = text;
    // `pre-wrap` because every one of these titles is newline-separated lines,
    // which is what makes them readable as a panel at all.
    box.style.cssText =
      'position:fixed;z-index:2147483646;max-width:min(320px,calc(100vw - 12px));'
      + 'max-height:60vh;overflow:auto;box-sizing:border-box;'
      + 'padding:8px 10px;border:1px solid ' + UI.line + ';border-radius:4px;'
      + 'background:' + UI.bg + ';color:' + UI.text + ';'
      + 'font-family:' + UI.font + ';font-size:12px;line-height:1.5;'
      + 'white-space:pre-wrap;text-align:left;box-shadow:0 4px 16px rgba(0,0,0,.6);'
      + 'left:0;top:0;';
    document.body.appendChild(box);

    const vp = viewportSize();
    const r = anchor.getBoundingClientRect ? anchor.getBoundingClientRect() : null;
    if (vp && r) {
      const w = box.offsetWidth || 0;
      const h = box.offsetHeight || 0;
      const left = Math.max(6, Math.min(r.left, vp.width - w - 6));
      // Under the badge by preference, above it when the bottom of the screen
      // is closer -- a badge low in the hand would otherwise open a panel
      // mostly off-screen, which on a phone is most of them.
      let top = r.bottom + 6;
      if (top + h > vp.height - 6) {
        top = r.top - 6 - h >= 6 ? r.top - 6 - h : Math.max(6, vp.height - h - 6);
      }
      box.style.left = left + 'px';
      box.style.top = top + 'px';
    }
    tipAnchor = anchor;
    bindTipDismissal();
  }

  // A badge is described by a plain { text, color, title } spec, so the
  // deciding (per feature, pure, testable) stays separate from the drawing.
  // `spec.ink` is the text colour, and defaults to white because that is what
  // every badge here used to be. It exists because a badge is only legible on
  // Fallen London's dark card art if its background is LIGHT, and white text on
  // a light background is not legible at all -- see FOTZ_INK.
  function makeBadge(spec, extraClass) {
    const el = document.createElement('span');
    el.className = extraClass ? BADGE_CLASS + ' ' + extraClass : BADGE_CLASS;
    el.textContent = spec.text;
    el.title = spec.title;
    // Inline styles only (repo convention): @grant none rules out GM_addStyle,
    // and a stylesheet is one more thing a React re-render could drop.
    //
    // `touch-action:manipulation` drops the double-tap-to-zoom wait, and the
    // tap highlight and text selection are turned off so a tap reads as a
    // press on a control rather than as picking at the text of a card.
    el.style.cssText =
      'display:inline-block;margin-left:4px;padding:0 4px;' +
      'font-family:arial,sans-serif;font-size:10px;font-weight:bold;' +
      'line-height:14px;color:' + (spec.ink || '#fff') + ';border-radius:2px;' +
      'background:' + spec.color + ';' +
      'text-shadow:none;white-space:nowrap;vertical-align:middle;cursor:help;' +
      'touch-action:manipulation;-webkit-tap-highlight-color:transparent;' +
      '-webkit-user-select:none;user-select:none;';

    const swallow = function (e) { if (e.stopPropagation) e.stopPropagation(); };
    ['pointerdown', 'mousedown', 'touchstart'].forEach(function (name) {
      // Passive: these only ever stop propagation, and saying so up front
      // keeps `touchstart` off the browser's scroll-blocking path.
      el.addEventListener(name, swallow, { passive: true });
    });
    el.addEventListener('click', function (e) {
      if (e.stopPropagation) e.stopPropagation();
      if (e.preventDefault) e.preventDefault();
      if (tipAnchor === el) hideTip();
      else showTip(el, spec.title);
    });
    return el;
  }

  // Read a storylet/card name off a heading WITHOUT the badges hung inside it
  // by us or by another script. wiki-links.js appends its "W" anchor into the
  // very same heading element, so a plain `textContent` here would yield
  // "A drunkW" and match nothing.
  function headingName(el) {
    let out = '';
    for (const node of el.childNodes) {
      if (node.nodeType === 3) { out += node.nodeValue; continue; }
      if (node.nodeType !== 1) continue;
      const cls = node.className;
      if (typeof cls === 'string' &&
          (cls.indexOf(BADGE_CLASS) !== -1 || cls.indexOf('fl-wiki-link') !== -1)) continue;
      out += node.textContent;
    }
    return out.trim();
  }

  // Attach one badge to `host`, idempotently.
  //
  //   flag   dataset property this feature owns (e.g. 'flSpite'). One per
  //          feature, so two features can badge the same element.
  //   value  the identity of what is being badged -- normally the name. The
  //          flag stores this rather than a boolean because React REUSES these
  //          container nodes: play a card and the next one is rendered into the
  //          same node, so a boolean "already done" flag would leave the old
  //          card's badge on the new card. A changed value redraws.
  //   spec   { text, color, title }, or null to mean "nothing to say here" --
  //          which also clears a badge left over from a previous occupant.
  //   place  'append' (last child -- for the image-only card containers) or
  //          'after' (next sibling -- for headings; putting a badge INSIDE a
  //          heading would corrupt wiki-links.js's textContent read of it).
  //   style  optional extra inline styles, e.g. to position an overlay.
  function attachBadge(host, opts) {
    const cls = opts.cls;
    // The flag records BOTH the value and whether a badge was drawn for it
    // ('+' / '-'). Storing only the value would make the clearing path
    // ("this card is known, but say nothing about it here") a no-op on a host
    // that already carries a badge for that same name -- which is exactly what
    // happens when a gate turns a feature off while its cards are on screen.
    const key = (opts.spec ? '+' : '-') + (opts.value == null ? '' : opts.value);
    if (host.dataset[opts.flag] === key) return;

    const inside = host.querySelector('.' + cls);
    if (inside && inside.parentNode === host) inside.remove();
    // For an 'after' badge, walk the whole RUN of badges following the host
    // rather than only the first. Two features can badge one heading -- the
    // Fruits of the Zee supplication branches and the Port Carnelian ones share
    // `.branch__title` -- and each `host.after()` inserts immediately after the
    // host, so ours is not necessarily the nearest. Checking only
    // `nextElementSibling` would then fail to clear our own stale badge and
    // leave two of them behind on a node React has reused.
    for (let next = host.nextElementSibling;
      next && next.classList && next.classList.contains(BADGE_CLASS);
      next = next.nextElementSibling) {
      if (next.classList.contains(cls)) { next.remove(); break; }
    }

    host.dataset[opts.flag] = key;
    if (!opts.spec) return;

    const badge = makeBadge(opts.spec, cls);
    if (opts.style) Object.assign(badge.style, opts.style);
    if (opts.place === 'append') host.appendChild(badge);
    else host.after(badge);
  }

  // === shared: the opportunity hand ======================================
  //
  // Where an opportunity card's name can be read, in all three shapes. These
  // selectors are shared with wiki-links.js and verified there against real
  // game HTML -- the two files rise and fall together, so if one moves, fix
  // both. `visit(host, name, place, style)` is called once per card found.

  function eachCardName(visit) {
    // Full-width hand layout: the card is image-only, with NO heading anywhere,
    // and the name lives solely in `.hand__image`'s alt/aria-label -- so a
    // decoration has to be overlaid on the container. wiki-links.js already
    // owns this container's TOP-RIGHT corner, hence top-left here. Empty deck
    // slots render as `.card--empty` with no `.hand__card-container`, so they
    // fall out naturally.
    document.querySelectorAll('.hand__card-container').forEach(function (container) {
      const img = container.querySelector('.hand__image');
      const name = img && (img.getAttribute('alt') || img.getAttribute('aria-label'));
      if (!name || !name.trim()) return;
      if (getComputedStyle(container).position === 'static') container.style.position = 'relative';
      visit(container, name.trim(), 'append', {
        position: 'absolute', top: '2px', left: '2px', marginLeft: '0', zIndex: '5',
      });
    });

    // Compact (small-media) hand layout: here the card DOES have a title, a
    // bare `<h2 class="media__heading">` under `.hand .small-card__body`. The
    // `.hand` scope is what keeps this off the "Opportunity deck" label and the
    // other headings that share that class.
    document.querySelectorAll('.hand .small-card__body .media__heading').forEach(function (h) {
      const name = headingName(h);
      if (name) visit(h, name, 'after', null);
    });

    // The card you have opened -- the same heading as any opened storylet, and
    // worth decorating: that is the screen where you choose what to do with it.
    document.querySelectorAll('.storylet-root__heading').forEach(function (h) {
      const name = headingName(h);
      if (name) visit(h, name, 'after', null);
    });
  }

  // === shared: panel styling =============================================
  //
  // The launcher's dark chrome, which every panel is drawn in. Carried here
  // too because the launcher lives in UX Enhancers and a panel is rendered
  // into it by this script.

  const UI = {
    bg: '#1c1a17',
    bgAlt: '#242119',
    line: '#3d372c',
    text: '#e4dcc5',
    dim: '#a2977c',
    accent: '#b8912f',
    font: '"Roboto Slab", Georgia, serif',
  };

  // No viewport means nothing to position against -- which is also how this
  // file is evaluated outside a browser, by the tests.
  function viewportSize() {
    if (typeof window === 'undefined') return null;
    if (!window.innerWidth || !window.innerHeight) return null;
    return { width: window.innerWidth, height: window.innerHeight };
  }

  const TH = 'padding:5px 8px;text-align:left;font:bold 11px ' + UI.font
    + ';letter-spacing:.05em;text-transform:uppercase;color:' + UI.dim
    + ';border-bottom:1px solid ' + UI.line + ';white-space:nowrap;';
  const TD = 'padding:5px 8px;vertical-align:top;border-bottom:1px solid ' + UI.line + ';';

  // Two more colours for the pips: an item you could go and get right now, and
  // one whose Renown gate you have passed but whose Favours you have not saved
  // up. Seeing the first at a glance is the whole point of the column -- a
  // Renown item sits there unclaimed for months otherwise.
  const COLOR_READY = '#9ab73c';    // Renown reached AND Favours in hand
  // Favours cap at 7 and every one earned past that is simply thrown away, so
  // this is the only state on the page that is actively costing you something
  // while you look at it. Orange, not the green of "you could do this" -- a
  // different kind of urgency.
  const COLOR_FULL = '#d4761c';

  // === shared: reading Myself and Possessions ============================
  //
  // The same scrape UX Enhancers' Factions panel reads, carried byte for byte.

  // --- live values -------------------------------------------------------
  //
  // Read off the Myself tab (/myself). Selectors verified against real game
  // HTML in BOTH the wide and the narrow layout -- for qualities the two are
  // identical, so one set covers both -- and CONFIRMED LIVE in-game
  // (2026-09-02): the Renown and Favours the panel showed were the right ones.
  //
  //   <li class="quality-item">
  //     <div class="icon icon--circular quality-item__icon" data-branch-id="133830">
  //       <img alt="Renown: Bohemians" ...>
  //     <div class="quality-item__body">
  //       <span class="... quality-item__name"><span>Renown: Bohemians 27/55 - Known to ...
  //
  // The img's `alt` is the quality's name WITHOUT the level, and that is what
  // makes it the key. The visible text glues the level and a descriptive
  // suffix onto the same string, with no separator you could rely on:
  // "Renown: Society 34/55 -  Known in the homes of..." (note the double
  // space) and "Renown: Rubbery Men 12/55 - !kathakathoti!". Anything parsing
  // the name out of that text would be guessing where the name ends; strip the
  // alt off the front instead and the level is all that is left.
  //
  // The faction names FL uses here match FACTIONS[].name exactly, for all
  // twelve -- "The Church", "The Docks", "The Great Game", "Tomb-Colonies",
  // "Rubbery Men" and the rest -- so the quality is just "Renown: " + name.

  // Fallback for an item with no usable alt. Anchored on the three prefixes we
  // care about so a quality whose NAME contains a number can't be mis-split.
  const FACTION_QUALITY_RE =
    /^((?:Renown|Favours|Connected):\s*.+?)\s+(\d+)(?:\s*\/\s*(\d+))?(?:\s*[-–].*)?$/;

  function parseQualityItem(li) {
    const nameEl = li.querySelector('.quality-item__name');
    const text = nameEl ? nameEl.textContent.replace(/\s+/g, ' ').trim() : '';
    if (!text) return null;

    const img = li.querySelector('img[alt]');
    const alt = img ? (img.getAttribute('alt') || '').trim() : '';
    if (alt && text.slice(0, alt.length).toLowerCase() === alt.toLowerCase()) {
      const m = /^\s*(\d+)(?:\s*\/\s*(\d+))?/.exec(text.slice(alt.length));
      // An ACCOMPLISHMENT has no number anywhere -- FL renders it as the name
      // and nothing else ("Discovered: the Pentamerous Bride", captured from
      // /myself on 2026-09-06). Returning null for those dropped every one of
      // them on the floor, which is why the festival panel kept sending
      // someone who had already met the Bride back down to the bottom of the
      // trench. You either have an Accomplishment or you do not, so the level
      // it is missing is 1.
      if (!m) return { quality: alt, level: 1, cap: null };
      return { quality: alt, level: Number(m[1]), cap: m[2] ? Number(m[2]) : null };
    }

    const m = FACTION_QUALITY_RE.exec(text);
    if (!m) return null;
    return { quality: m[1].trim(), level: Number(m[2]), cap: m[3] ? Number(m[3]) : null };
  }

  // Every quality currently on screen, by name. `filtered` matters: the Myself
  // tab has a search box, and while it has text in it the list shows only the
  // matches -- so a quality being ABSENT stops meaning "you have none of it".
  // Returns null when there is no quality list at all (any other tab).
  function readQualities(doc) {
    const d = doc || document;
    const items = d.querySelectorAll('li.quality-item');
    if (!items.length) return null;
    const search = d.querySelector('input.input--item-search');
    const values = new Map();
    items.forEach(function (li) {
      const q = parseQualityItem(li);
      if (q) values.set(q.quality, q);
    });
    return { values: values, filtered: !!(search && search.value && search.value.trim()) };
  }

  // --- what you own ------------------------------------------------------
  //
  // The Possessions tab (/possessions). Verified against real game HTML, again
  // byte-identical between the two layouts, and CONFIRMED LIVE in-game
  // (2026-09-02): held / not-held came out right for a real character. Every
  // item is a
  // `[data-quality-id]` wrapping something with an `aria-label` whose first
  // semicolon-separated field is the name:
  //
  //   <li class="item"><div ... data-quality-id="755">
  //     <div aria-label="Ornate Typewriter × 2; A Fine, Elegant and Robust …">
  //   <li class="available-item-list__item"><div ... data-quality-id="126352">
  //     <div aria-label="Amber Cello; Persuasive +4; Steel ribs and amber …">
  //   <div data-quality-id="340" class="equipped-item">
  //     <div aria-label="Patent Scrutinizer Deluxe!; Watchful +7; …">
  //
  // Reading every `[data-quality-id]` rather than a per-section selector is
  // what makes the three shapes -- inventory, the available-to-equip drawer,
  // and the slot you are actually WEARING -- all count as owned. Miss the
  // third and anyone wearing their Renown item is told they don't have it.
  //
  // `data-quality-id` is a stable numeric id and would be a better key than a
  // name, but only the ids of items this character owns are visible, so there
  // is no way to build the full table from here. Names it is; they matched the
  // wiki's exactly for all nineteen faction and Renown items in the capture.
  const OWNED_MARKER = '[data-quality-id]';

  const ITEM_COUNT_RE = /\s*[×x]\s*(\d+)\s*$/;

  function itemNameFromLabel(label) {
    return String(label || '').split(';')[0].replace(ITEM_COUNT_RE, '').trim();
  }

  // How many of it you hold. The label only carries "× N" when N > 1, and an
  // equipped item never carries one, so a bare name means one.
  function itemCountFromLabel(label) {
    const m = ITEM_COUNT_RE.exec(String(label || '').split(';')[0]);
    return m ? Number(m[1]) : 1;
  }

  // ...and the label is not where EQUIPMENT states it. FL writes the count in
  // two places and never in the same one: an inventory item carries it in the
  // aria-label ("Witch-Stone × 20; A pebble…") and again in a
  // `.js-item-value` span beside the label, but a piece of equipment in the
  // equip drawer -- which is the only place a spare weapon, hat or pair of
  // boots ever appears -- carries no "× N" at all and only the span:
  //
  //   <div class="icon icon--available-item" data-quality-id="127763">
  //     <div aria-label="Scrimshander Carving Knife; Watchful +3; …">…</div>
  //     <span class="js-item-value icon__value">4</span>
  //
  // Reading the label alone therefore counted every duplicate piece of
  // equipment as one, and a character sitting on four Scrimshander Carving
  // Knives was told they had no spares to trade in (reported 2026-09-06, and
  // the markup above is that character's; the fix is confirmed in-game the
  // same day). The span wins wherever it is
  // there; the label stays as the fallback, and an equipped item (`.equipped-
  // item`, which has neither) still reads as the one you are wearing.
  function itemCountFromNode(el, label) {
    const value = el && el.querySelector ? el.querySelector('.js-item-value') : null;
    const n = value ? Number(String(value.textContent).replace(/[^0-9]/g, '')) : NaN;
    if (n > 0) return n;
    return itemCountFromLabel(label);
  }

  // Every item on the Possessions tab as a Map of normalised name ->
  // { name, count }, or null when this isn't that tab. The null matters: the
  // Myself tab has no `[data-quality-id]` at all, so an empty result there
  // would otherwise read as "you own nothing".
  //
  // Counts are taken as a MAX and never summed, because the same item shows up
  // more than once: an item you are wearing is both `div.equipped-item` and a
  // row in the equip drawer. Summing would report two of everything equipped.
  function readPossessionCounts(doc) {
    const d = doc || document;
    const nodes = d.querySelectorAll(OWNED_MARKER);
    if (!nodes.length) return null;
    const held = new Map();
    nodes.forEach(function (el) {
      const labelled = el.getAttribute('aria-label') != null ? el : el.querySelector('[aria-label]');
      const label = labelled && labelled.getAttribute('aria-label');
      const name = label && itemNameFromLabel(label);
      if (!name) return;
      const key = itemKey(name);
      const count = itemCountFromNode(el, label);
      const seen = held.get(key);
      if (!seen) held.set(key, { name: name, count: count });
      else if (count > seen.count) seen.count = count;
    });
    return held;
  }


  // The player's own name, from the screen-reader sidebar's "It's <name>!"
  // greeting. That block is on every page, not just the Myself tab, which is
  // what makes it usable as the cache's identity check. Other /profile/ links
  // on a page can belong to other people, so this is scoped to that greeting.
  function characterName(doc) {
    const a = (doc || document).querySelector('#accessible-sidebar .welcome a[href^="/profile/"]');
    const href = a ? (a.getAttribute('href') || '') : '';
    const m = href.match(/^\/profile\/(.+)$/);
    try {
      return m ? decodeURIComponent(m[1]) : null;
    } catch (e) {
      return m ? m[1] : null;
    }
  }

  // Every reading is banked, because it is read where it is shown -- the
  // Myself tab, Possessions -- and wanted while you are anywhere else. A
  // cached figure is always LABELLED with its age; it is a stale answer
  // offered as a stale answer, never passed off as current.
  function loadCache(key, version) {
    try {
      const raw = localStorage.getItem(key);
      if (!raw) return null;
      const rec = JSON.parse(raw);
      if (!rec || rec.v !== version) return null;
      // A different character's numbers are worse than none. When the current
      // name is unreadable we can't check, so the record's own name is shown.
      const who = characterName();
      if (who && rec.character && who !== rec.character) return null;
      return rec;
    } catch (e) {
      return null; // private mode, quota, corrupt JSON -- all mean "no cache"
    }
  }

  function saveCache(key, rec) {
    try {
      localStorage.setItem(key, JSON.stringify(rec));
    } catch (e) { /* storage unavailable; the live read still works */ }
  }

  // --- refreshing without leaving the page -------------------------------
  //
  // `fetch('/myself')` does NOT work here, and it is worth writing down why so
  // nobody tries it again: Fallen London is a client-rendered React app, and
  // the HTML routes serve a ~4.7KB shell whose <div id="root"> holds a loading
  // splash and nothing else. There is no quality list in the response to
  // parse. (Checked against the live site, not assumed.)
  //
  // What does work is a hidden same-origin iframe: point it at the route, let
  // the app boot inside it, and read its document once the markup we want has
  // appeared. It costs a second boot of the SPA -- a few seconds and some
  // bandwidth -- which is why it is throttled below and can be switched off.
  // /myself and /possessions are plain views; loading them spends no actions.
  //
  // VERIFIED WORKING in-game (reported 2026-09-02). The guards below stay
  // anyway: if the iframe ever comes back empty, every caller treats that as
  // "no refresh" and falls through to the cache, so the failure mode is the
  // panel you had before, never a wrong number.

  const REFRESH_TIMEOUT_MS = 20000;

  function loadInFrame(path, extract) {
    return new Promise(function (resolve) {
      let frame;
      let poll = null;
      let timer = null;
      let settled = false;
      const finish = function (value) {
        if (settled) return;
        settled = true;
        if (poll) clearInterval(poll);
        if (timer) clearTimeout(timer);
        if (frame && frame.parentNode) frame.remove();
        resolve(value || null);
      };
      try {
        frame = h('iframe', {
          src: path,
          title: 'UX Enhancers background refresh',
          // Off-screen rather than display:none -- a display:none iframe is
          // allowed to skip layout, and the app inside needs to actually run.
          css: 'position:fixed;left:-10000px;top:0;width:1280px;height:900px;'
            + 'border:0;opacity:0;pointer-events:none;',
        });
        frame.setAttribute('aria-hidden', 'true');
        frame.setAttribute('tabindex', '-1');
        document.body.appendChild(frame);
        poll = setInterval(function () {
          let doc = null;
          try {
            doc = frame.contentDocument;
          } catch (e) {
            return finish(null); // cross-origin redirect (logged out, say)
          }
          if (!doc || !doc.body) return;
          let got = null;
          try {
            got = extract(doc);
          } catch (e) {
            return finish(null);
          }
          if (got) finish(got);
        }, 300);
        timer = setTimeout(function () { finish(null); }, REFRESH_TIMEOUT_MS);
      } catch (e) {
        finish(null);
      }
    });
  }

  // One refresh at a time, and never two of these racing each other.
  let refreshing = null;

  // Refreshes everything the festival and Port Carnelian read, off two page
  // loads -- and shares each page it loads, so UX Enhancers banks the Factions
  // numbers off the same boot rather than paying for another.
  function refreshBackgroundState() {
    if (refreshing) return refreshing;
    refreshing = (async function () {
      let changed = false;
      // Sequential, not parallel: two copies of the SPA booting at once is a
      // lot of work for the browser, and nothing here is urgent.
      if (!readQualities()) {
        const scan = await loadInFrame('/myself', function (doc) {
          const got = myselfLoaded(doc);
          if (got) shareFrame('/myself', doc);
          return got;
        });
        if (bankFotzQualities(scan)) changed = true;
        if (bankPcQualities(scan)) changed = true;
        if (bankLabQualities(scan)) changed = true;
      }
      const here = readPossessionCounts();
      if (!here || !here.size) {
        const held = await loadInFrame('/possessions', function (doc) {
          const got = possessionsLoaded(doc);
          if (got) shareFrame('/possessions', doc);
          return got;
        });
        if (bankItemCounts(held)) changed = true;
      }
      return changed;
    })().catch(function (e) {
      console.error('FL Choice Helper: background refresh failed.', e);
      return false;
    }).then(function (v) {
      refreshing = null;
      return v;
    });
    return refreshing;
  }

  // Auto-refresh is on by default but remembered, so a slow connection can
  // turn it off and keep the (labelled) cached numbers.
  const AUTO_KEY = 'fl-ux-auto-refresh';

  function autoRefreshEnabled() {
    try {
      return localStorage.getItem(AUTO_KEY) !== '0';
    } catch (e) {
      return true;
    }
  }

  function setAutoRefresh(on) {
    try {
      localStorage.setItem(AUTO_KEY, on ? '1' : '0');
    } catch (e) { /* nothing to do */ }
  }

  // Don't boot the SPA again for numbers that are already a minute old.
  const FRESH_MS = 60 * 1000;

  function stateIsFresh(state) {
    if (!state) return false;
    const q = state.live || (state.at && Date.now() - state.at < FRESH_MS);
    const i = state.itemsLive || (state.itemsAt && Date.now() - state.itemsAt < FRESH_MS);
    return !!(q && i);
  }

  function ageText(ms) {
    const mins = Math.max(0, Math.round((Date.now() - ms) / 60000));
    if (mins < 1) return 'moments ago';
    if (mins < 60) return mins + (mins === 1 ? ' minute ago' : ' minutes ago');
    const hours = Math.round(mins / 60);
    if (hours < 24) return hours + (hours === 1 ? ' hour ago' : ' hours ago');
    const days = Math.round(hours / 24);
    return days + (days === 1 ? ' day ago' : ' days ago');
  }

  // === shared: the other Fallen London script ============================
  //
  // UX Enhancers and Choice Helper were one file until UX Enhancers 3.0. A
  // userscript has no imports, so the two share no code: every helper both
  // need is carried by both, byte for byte (FallenLondon/test/fl-shared-
  // helpers.test.mjs holds them to it). What they share at RUN time goes
  // through the page instead, as one array and one event on `window` --
  // both scripts are `@grant none`, so both see the page's own `window`.
  //
  //  - PANEL_REGISTRY is the launcher menu as far as the other script is
  //    concerned. Choice Helper pushes its panels onto it; UX Enhancers reads
  //    it every time the menu is drawn, so which of the two loaded first does
  //    not matter.
  //  - FRAME_EVENT hands a hidden frame's document across while the frame is
  //    still up. A background refresh boots the whole SPA a second time, and
  //    before the split ONE boot of /myself banked the Factions, festival and
  //    Port Carnelian numbers together. Two scripts each booting their own
  //    would double that, so whoever loads a page shares it, the other banks
  //    its own numbers off it, and its cache is then fresh enough that its
  //    own refresh has nothing to do.
  //
  // Only SCRIPT_ID differs between the two files, and it is declared outside
  // this block.
  const PANEL_REGISTRY = '__flUxPanels';
  const FRAME_EVENT = 'fl-ux-shared-frame';

  function pageWindow() {
    return typeof window !== 'undefined' && window && window.addEventListener ? window : null;
  }

  // The shared panel list, created by whichever script asks first.
  function sharedPanels() {
    const w = pageWindow();
    if (!w) return null;
    if (!Array.isArray(w[PANEL_REGISTRY])) w[PANEL_REGISTRY] = [];
    return w[PANEL_REGISTRY];
  }

  // Called from inside a frame's `extract`, which is the only moment the
  // document is guaranteed to still be there: `loadInFrame` removes the frame
  // as soon as `extract` answers. The listeners run synchronously, so they
  // are done reading before that happens.
  function shareFrame(path, doc) {
    const w = pageWindow();
    if (!w || !w.dispatchEvent || typeof CustomEvent !== 'function') return;
    try {
      w.dispatchEvent(new CustomEvent(FRAME_EVENT, {
        detail: { from: SCRIPT_ID, path: path, doc: doc },
      }));
    } catch (e) { /* the other script just refreshes on its own */ }
  }

  function onSharedFrame(handler) {
    const w = pageWindow();
    if (!w) return;
    w.addEventListener(FRAME_EVENT, function (e) {
      const d = e && e.detail;
      if (!d || d.from === SCRIPT_ID || !d.doc) return;
      try {
        handler(d.path, d.doc);
      } catch (err) {
        console.error(SCRIPT_ID + ': reading a shared frame failed.', err);
      }
    });
  }

  // When a frame's page counts as loaded. Shared, so the page one script
  // shares is always one the other would have accepted from its own frame.
  function myselfLoaded(doc) {
    const got = readQualities(doc);
    // Wait for a list that actually has faction qualities in it -- a
    // half-rendered page can show a handful and would bank a page of false
    // zeroes otherwise.
    if (!got) return null;
    for (const key of got.values.keys()) {
      if (/^(Renown|Favours|Connected):/.test(key)) return got;
    }
    return null;
  }

  function possessionsLoaded(doc) {
    const got = readPossessionCounts(doc);
    return got && got.size > 20 ? got : null;
  }

  // === feature: The Crowds of Spite card ratings =========================
  //
  // Rates the opportunity cards of The Crowds of Spite (the Pickpocket's
  // Promenade) by how many bonus Pickpocket's Trophies they pay.
  //
  // Nothing here is gated on "am I in the Crowds of Spite?", because there is
  // no verified selector for the area header. The card table IS the scope: a
  // card whose name isn't in it gets no badge, and the names in it ("A
  // mould-spangled curiosity shop", "A... pickpocket?", "Watchful Eyes")
  // belong to this one area. If a name ever collides with an unrelated
  // storylet elsewhere in London, gating is the fix -- not a shorter table.

  // From The Crowds of Spite (Guide) on fallenlondon.wiki. `bonus` is the
  // EXTRA Pickpocket's Trophies a successful pickpocket gives on top of the
  // trophies your base Shadowy earns you from the skill table -- it is the
  // number the badge shows. `null` means the card pays no trophies at all and
  // needs a word instead of a score (`badge`).
  //
  // `inferior` marks the two targets that draw from the *inferior* skill
  // table: their Shadowy-based trophies come off a shallower curve, so at most
  // Shadowy levels they pay one trophy less than every other card before their
  // bonus is even added. That is the difference the dagger on the badge flags.
  //
  // Every card gives Approaching your Destination +1 unless `pass`/`fail`/
  // `note` says otherwise; `pass` is the non-pickpocketing option, `fail` is
  // what a failed pickpocket costs.
  //
  // To add or correct a card: edit this array. Nothing else knows the names.
  const SPITE_CARDS = [
    {
      name: 'A drunk', shadowy: 3, bonus: 0, inferior: true,
      fail: 'Unseen -1',
    },
    {
      name: 'A mould-spangled curiosity shop', shadowy: 5, bonus: 1, inferior: true,
      pass: 'Window-shopping: Unseen +1, AYD -1',
      fail: 'Unseen -1',
      note: 'The only card in the area that can lower Approaching your Destination.',
    },
    {
      name: 'A Street Performer', shadowy: 5, bonus: 1,
      pass: 'Unseen +1', fail: 'Unseen -1',
    },
    {
      name: 'An Argument', shadowy: 10, bonus: 1,
      pass: 'Unseen +1', fail: 'Unseen -1',
    },
    {
      name: 'Gaoler', shadowy: 10, bonus: 1,
      fail: 'Unseen -1',
      note: 'The pickpocket also gives Nightmares.',
    },
    {
      name: 'The Costermonger', shadowy: 12, bonus: 1,
      fail: 'Unseen -1',
    },
    {
      name: 'The Rat-Catcher', shadowy: 12, bonus: null, badge: 'rats',
      fail: 'Unseen -1, Wounds +1 CP',
      note: 'No trophies. Gives Rat on a String +11 and Venge-Rat Corpse +1, ' +
            'and does not raise Approaching your Destination.',
    },
    {
      name: 'The Actress', shadowy: 15, bonus: 2,
      fail: 'Unseen -1',
    },
    {
      name: 'A Shopkeeper', shadowy: 20, bonus: 2,
      fail: 'Unseen -1',
    },
    {
      name: 'Watchful Eyes', shadowy: 30, bonus: null, badge: 'AYD!', warn: true,
      fail: 'Unseen -1',
      note: 'No trophies, and EVERY option gives AYD +2. Leave it in your hand ' +
            'unless you actually want the promenade to end.',
    },
    {
      name: 'A Constable!', shadowy: 30, bonus: 3,
      pass: 'AYD +2', fail: 'AYD +3, Unseen -2',
      note: 'The pickpocket itself gives AYD +2.',
    },
    {
      name: 'A Special Constable', shadowy: 40, bonus: 4,
      fail: 'AYD +2, Unseen -2',
    },
    {
      name: 'A... pickpocket?', shadowy: 50, bonus: 4,
      fail: "Pickpocket's Trophy -3",
    },
    {
      name: 'Jack!', shadowy: 60, bonus: 9,
      pass: 'AYD +3, Unseen +1', fail: 'Wounds +3 CP',
      note: 'The pickpocket gives AYD +2. A second option (Dangerous 100) pays no ' +
            'trophies but gives Unseen +1, a Touching Love Story and Urchin/' +
            'Constable favours, and leaves AYD alone.',
    },
    {
      name: 'The Opera Singer', shadowy: 60, bonus: 6, early: true,
      fail: 'Unseen -1',
    },
    {
      name: 'The Novelist', shadowy: 63, bonus: 7, early: true,
      fail: 'Unseen -1',
    },
    {
      name: 'The Confidence Artist', shadowy: 65, bonus: 8, early: true,
      fail: 'Unseen -1',
    },
  ];

  // Names are matched loosely: lowercased, with every run of non-alphanumerics
  // squashed to one space. That absorbs the punctuation the game and the wiki
  // can disagree about -- "A Constable!" / "A Constable", "A... pickpocket?" /
  // "A pickpocket" -- and the hyphen in "The Rat-Catcher". None of the squashed
  // keys collide with each other.
  //
  // HTML TAGS COME OFF FIRST, and they have to: Fallen London writes markup
  // into the names it hands us. A festival ship's Possessions label italicises
  // its class -- the attribute holds `&lt;i&gt;Obstinate&lt;/i&gt;-class
  // Cruiser`, which the HTML parser decodes, so `getAttribute` returns real
  // tags. Squashing that straight away does not remove the tags, it DISSOLVES
  // them: `<` `>` and `/` go, and their letters stay behind as words, giving
  // "i obstinate i class cruiser" where the table says "obstinate class
  // cruiser". A ship the player was wearing therefore read as un-owned
  // (reported 2026-09-10, with the capture).
  //
  // Only a real tag is taken -- `</?tag …>` -- and never any pair of angle
  // brackets, so prose that happens to contain `a < b > c` still loses the
  // brackets to the squash and keeps every word around them.
  const TAG_RE = /<\/?[a-z][a-z0-9]*(?:\s[^<>]*)?>/gi;

  function normalizeName(name) {
    return String(name == null ? '' : name)
      .replace(TAG_RE, ' ')
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, ' ')
      .trim();
  }

  // The key an ITEM is filed under: `normalizeName` with a leading article
  // thrown away as well.
  //
  // Every table in this file takes an item's name from its WIKI PAGE TITLE,
  // which keeps the article -- "A Faceted Decanter of Drownie Effluvia", "An
  // Inquisitive Lamp-cat". Fallen London's own Possessions markup drops it:
  // the captured `aria-label` reads "Scrimshander Carving Knife", not "A
  // Scrimshander Carving Knife". So the two vocabularies disagree on a word
  // that carries no meaning, and a straight `normalizeName` comparison filed
  // them as two different items -- which is exactly what happened (reported
  // 2026-09-10: the checklist called a Decanter missing that was sitting in
  // the player's hold).
  //
  // Patching the table entry would have fixed ONE row. It is a whole class:
  // the same table already spells the Knife the game's way and the Jillyfleur
  // Cloak the wiki's, and every faction and Renown item is transcribed from
  // the wiki too. So the gap is closed once, here, at the one boundary where a
  // wiki name is compared against a game name -- and the tables go on citing
  // their source, which is what makes them checkable.
  //
  // Used on BOTH sides: the possessions map is keyed by it and every lookup
  // goes through it, so it does not matter which side has the article. It is
  // deliberately NOT what card and storylet names use -- there a leading "A"
  // is part of a title Fallen London and the wiki agree on ("A Reef of
  // Wrecks"), and throwing it away would only invite a collision.
  function itemKey(name) {
    const key = normalizeName(name);
    // Never down to nothing: an item actually called "The" keeps its name.
    const bare = key.replace(/^(?:a|an|the) +/, '');
    return bare || key;
  }

  const SPITE_BY_NAME = new Map(
    SPITE_CARDS.map(function (c) { return [normalizeName(c.name), c]; }));

  function lookupSpiteCard(name) {
    return SPITE_BY_NAME.get(normalizeName(name)) || null;
  }

  // Grey at +0 through to gold at +9. The point of the colour is that a hand
  // can be read at a glance, without stopping to compare numbers.
  const RATING_COLORS = [
    '#6b6b6b', // +0
    '#7a5c3a', // +1
    '#8a6d3b', // +2
    '#78733a', // +3
    '#68763a', // +4
    '#54783e', // +5
    '#417a4c', // +6
    '#357a62', // +7
    '#2f7378', // +8
    '#b8912f', // +9
  ];
  const COLOR_NO_TROPHIES = '#3f5f8a'; // pays in something other than trophies
  const COLOR_WARN = '#8a3b3b';        // playing this is usually a mistake

  const SPITE_CLASS = 'fl-ux-spite';
  const SPITE_FLAG = 'flUxSpite';
  const INFERIOR_MARK = '†'; // dagger

  // What to draw for a card: the label, its colour and the tooltip. Kept pure
  // (card in, description out) so it can be unit-tested without a DOM.
  function spiteBadgeSpec(card) {
    const scored = typeof card.bonus === 'number';
    const text = scored
      ? '+' + card.bonus + (card.inferior ? INFERIOR_MARK : '')
      : (card.badge || '?');
    const color = card.warn
      ? COLOR_WARN
      : (scored ? (RATING_COLORS[card.bonus] || RATING_COLORS[0]) : COLOR_NO_TROPHIES);

    const lines = [card.name];
    lines.push(scored
      ? 'Bonus trophies: +' + card.bonus + ' (on top of what your base Shadowy gives)'
      : 'Bonus trophies: none');
    lines.push('Pickpocket challenge: Shadowy ' + card.shadowy);
    if (card.inferior) {
      lines.push(INFERIOR_MARK + ' Uses the INFERIOR skill table: the trophies your ' +
        'base Shadowy contributes come off a lower curve, costing you about one ' +
        'trophy compared with every other target.');
    }
    if (card.early) lines.push('Only appears while Approaching your Destination is below 5.');
    if (card.pass) lines.push('Pass by: ' + card.pass);
    if (card.fail) lines.push('Pickpocket failure: ' + card.fail);
    if (card.note) lines.push(card.note);
    lines.push('Unless stated otherwise, every action here gives AYD +1.');
    return { text: text, color: color, title: lines.join('\n') };
  }

  // The area gate. FL states the area in the screen-reader greeting on every
  // page, and during a promenade that greeting reads, verbatim:
  //
  //   "It's <name>! Welcome to The Crowds of Spite, delicious friend!"
  //
  // CONFIRMED in-game (2026-09-02), which is what let this be tightened from
  // "allow anything we don't recognise" to an exact list. It used to carry the
  // four route names (The Tenterhooks, Smashtile Alley, Blythenhale,
  // Strung-Up Street) as guesses at what the promenade might call itself, plus
  // a LONDON_ELSEWHERE deny-list to make the permissive default survivable.
  // Both are gone, on the evidence of the same capture: the accessible map
  // (`#accessible-sidebar .accessible-map-menu`) lists every area you can
  // reach, and it contains "Spite", "The Crowds of Spite" and "Area-Diving in
  // Spite" but NONE of the four route names -- so the routes are storylets
  // inside the area, not areas, and the greeting never names one.
  //
  // "Spite" is the parent area and is kept for the boundary either side of a
  // promenade; it costs nothing, since the cards only exist in the Crowds.
  const SPITE_AREAS = [
    'The Crowds of Spite',
    'Spite',
  ].map(normalizeName);

  // The one remaining fail-open: if the greeting can't be read at all -- FL
  // renamed the block, say -- fall back to allowing badges, since the card
  // table still scopes them and losing the feature outright is the worse
  // outcome. An area that IS readable and isn't ours now blocks, which is the
  // whole point of the tightening.
  function inCrowdsOfSpite() {
    const area = normalizeName(currentArea());
    if (!area) return true;
    return SPITE_AREAS.indexOf(area) !== -1;
  }

  function spiteCardRatings() {
    if (!inCrowdsOfSpite()) {
      // Clear any badge left over from before you walked out.
      eachCardName(function (host, name, place, style) {
        attachBadge(host, {
          cls: SPITE_CLASS, flag: SPITE_FLAG, value: name, spec: null,
          place: place, style: style,
        });
      });
      return;
    }
    eachCardName(function (host, name, place, style) {
      const card = lookupSpiteCard(name);
      attachBadge(host, {
        cls: SPITE_CLASS,
        flag: SPITE_FLAG,
        value: name,
        spec: card ? spiteBadgeSpec(card) : null,
        place: place,
        style: style,
      });
    });
  }

  // === feature: Zailing the Unterzee card ratings ========================
  //
  // Rates the opportunity cards you draw while zailing. Zailing is a race
  // between two numbers: Zailing... (progress towards your destination, 80 for
  // a direct route, 160 or 220 across regions) and Troubled Waters, which at 8
  // kills you. Zee cards are NOT discardable, so the only decision you ever
  // make out there is which of the cards in your hand to play next -- which is
  // exactly what a badge on each card can answer.
  //
  // Everything below is transcribed from Zailing (Guide) and from the
  // individual card and option pages under Category:Cards - Zailing the
  // Unterzee on fallenlondon.wiki. Where the guide's summary table and a
  // card's own page disagreed, the card page won (it is the page the wiki
  // keeps up to date): the guide says A Spit of Land's island stop is -2
  // Troubled Waters, its own option page says -1, and -1 is what is here.
  //
  // To add or correct a card: edit ZEE_CARDS. Nothing else knows the names.

  // How far you have to get, and roughly what that costs in actions. From the
  // guide's "Gaining progress" table. Most options give Zailing Speed + 1-5,
  // and a failure usually gives half of that.
  const ZEE_ROUTES = [
    { name: 'Direct route', of: 'a destination in the region you are already in', need: 80, tramp: '2', other: '1.5', clipper: '1.5, rarely 1' },
    { name: 'Along the currents', of: 'a region reached the way the currents run (anticlockwise)', need: 160, tramp: '3.5', other: '3', clipper: '2.5, rarely 2' },
    { name: 'Through the Snares', of: 'the shortcut across the middle; needs Zeefaring 3', need: 160, tramp: '3.5', other: '3', clipper: '2.5, rarely 2' },
    { name: 'Against the currents', of: 'a region reached the wrong way round', need: 220, tramp: '5', other: '4', clipper: '3' },
  ];

  // Zee Peril per region: the difficulty of every broad challenge out there.
  // The narrow column is what a skill challenge (Zeefaring, Shapeling Arts...)
  // scales to; the Zeefaring checks on the non-piracy cards do not scale.
  const ZEE_REGIONS = [
    { name: 'Home Waters', peril: 100, narrow: 3, note: 'London and Mutton Island are here' },
    { name: "Shepherd's Wash", peril: 110, narrow: 3, note: 'Southern Wind is found here' },
    { name: 'Stormbones', peril: 110, narrow: 3, note: 'Northern Wind is found here' },
    { name: 'The Sea of Voices', peril: 150, narrow: 5, note: 'passing by discovers Mangrove College' },
    { name: 'The Salt Steppe', peril: 200, narrow: 9, note: 'Eastern Wind is found here; passing by discovers the Khanate' },
    { name: 'The Pillared Sea', peril: 210, narrow: 9, note: 'passing by discovers Irem' },
    { name: 'The Snares', peril: 250, narrow: 12, note: 'needs Zeefaring 3; passing by discovers Corsair’s Forest' },
  ];

  // The six zee-threats. Each one on its own does little; each one TOGETHER
  // with Troubled Waters 7 puts its own black card in your hand, and black
  // cards are urgent, so they crowd out everything else until you clear them.
  const ZEE_MENACES = [
    { name: 'Rumbling Stomachs', from: 'your crew going hungry', card: 'A Worrying Appetite' },
    { name: 'Silent Stalker', from: 'zee-monsters noticing you', card: 'Signs of Pursuit' },
    { name: 'Creeping Fear', from: 'frightening your crew', card: 'A Growing Concern' },
    { name: 'Groaning Hull', from: 'damaging the ship', card: 'Taking in Water' },
    { name: 'Mutinous Whispers', from: 'disrespecting your crew', card: 'Signs of Disloyalty' },
    { name: 'Unwelcome on the Waters', from: 'failed piracy', card: 'Zeeborne Pariahs' },
  ];

  // Where you can dock, what region it is in, whether arriving there wipes
  // Troubled Waters and every zee-threat with it, and what it takes to be
  // able to sail there at all.
  //
  // From the guide's Locations table, its "One-Time and Similar Locations"
  // and "Hunting Locations" tables, and its "Discovering locations" prose,
  // which is where the `how` lines come from.
  //
  // Three things this table deliberately keeps apart, because they are three
  // different claims and one `safe` boolean would fold them into two:
  //
  //   safe: true    docking here resets Troubled Waters and the zee-threats.
  //   safe: false   a real dock that resets nothing. Port Cecil, Godfall,
  //                 Irem, Gaider's Mourn and Tanah-Chook are all ports and
  //                 none of them is a reset.
  //   safe: null    not a dock at all (the hunting grounds), so the question
  //                 does not arise -- they reset nothing either, but nobody
  //                 sails to one expecting a harbour.
  //
  // One conflict in the source, recorded rather than resolved: the guide's
  // table shows Port Cecil and Tanah-Chook with a plain "unsafe" cross, while
  // the hidden sort key on those two cells reads "safe". The visible cross is
  // what is here, since that is what the table says to a reader, and both
  // rows carry a note saying so. Report either way round in-game.
  //
  // `unlock` is what has to be true before the destination appears; null
  // means nothing at all. `how` is the way that quality is come by, where the
  // guide spells it out. To add or correct a port: edit ZEE_PORTS.
  const ZEE_PORTS = [
    // --- ordinary destinations -------------------------------------------
    { name: 'Wolfstack Docks', as: 'London', regions: ['Home Waters'], safe: true, unlock: null },
    { name: 'Mutton Island', regions: ['Home Waters'], safe: true, unlock: null,
      note: 'Home of the Fruits of the Zee Festival.' },
    { name: "Hunter's Keep", regions: ['Home Waters'], safe: false, unlock: null },
    { name: 'Bullbone Island', regions: ['Home Waters'], safe: false,
      unlock: 'Embarking on a Voyage of Scientific Discovery 3' },
    { name: 'Heartscross House', as: 'Port Carnelian', regions: ["Shepherd's Wash"], safe: true,
      unlock: 'Imperial Legitimacy', how: 'Granted at the Foreign Office in London.' },
    { name: 'The Court of the Wakeful Eye', regions: ["Shepherd's Wash"], safe: true,
      unlock: 'Associating with Radical Academics 20',
      note: 'Also needs a successful governorship at Heartscross House.' },
    { name: 'The Convent', as: 'Abbey Rock', regions: ["Shepherd's Wash"], safe: true,
      unlock: 'Ambition: Bag a Legend! 44' },
    { name: 'Apis Meet', regions: ["Shepherd's Wash"], safe: true, unlock: 'Flint', fate: true },
    { name: 'Godfall', regions: ["Shepherd's Wash"], safe: false, unlock: 'Discovered: Godfall',
      how: 'Draw Row, row, row in Shepherd’s Wash and spend some wine, or spend a Relatively Safe Zee Lane at Wolfstack with Making Progress in the Labyrinth of Tigers 16.' },
    { name: 'Iron Republic Streets', as: 'The Iron Republic', regions: ["Shepherd's Wash"], safe: false,
      unlock: 'Iron Republic Safe-Conduct', how: 'From Spending Secrets and Counting the Days.' },
    { name: 'The Chapel of Lights', regions: ['Stormbones'], safe: true,
      unlock: 'Seeking Mr Eaten\'s Name 49, A Book of Crimson Prayer',
      note: 'Docking here puts you in Your Lodgings.' },
    { name: 'Port Cecil', regions: ['Stormbones'], safe: false,
      unlock: 'Discovered: The Principles of Coral',
      how: 'Embarking on a Voyage of Scientific Discovery, plus either drawing A Coral Commotion in Stormbones or spending 8 x Partial Map.',
      note: 'The guide’s table marks it unsafe; its hidden sort key says safe. Unverified in-game.' },
    { name: 'Corpsecage Island', regions: ['Stormbones'], safe: false,
      unlock: 'Embarking on a Voyage of Scientific Discovery 3',
      note: 'Has a separate option for Ambition: Heart’s Desire!' },
    { name: 'Set a course for the tomb colony of Tanah-Chook', as: 'The Tomb Colonies (Tanah-Chook)',
      regions: ['Stormbones'], safe: false, unlock: 'All Things Must End', fate: true,
      note: 'The guide’s table marks it unsafe; its hidden sort key says safe. Unverified in-game.' },
    { name: 'Polythreme Docks', as: 'Polythreme', regions: ['The Sea of Voices'], safe: true,
      unlock: 'Screaming Map',
      note: 'Reachable before you own a ship, with A Ticket to Polythreme at Wolfstack Docks.' },
    { name: 'Mangrove College', regions: ['The Sea of Voices'], safe: false,
      unlock: 'Discovered: Mangrove College',
      how: 'Discovered by passing by — zail to anywhere in the Sea of Voices.' },
    { name: 'Grunting Fen', regions: ['The Sea of Voices'], safe: false,
      unlock: 'Embarking on a Voyage of Scientific Discovery 3, Screaming Map' },
    { name: 'The Copper Quarter', as: "Khan's Heart", regions: ['The Salt Steppe'], safe: true,
      unlock: 'Discovered: The Khanate',
      how: 'By passing by (zail for the Sea of Voices, then switch destination to London), by a Salt Steppe Atlas option at Zeefaring 3, or from the Balmoral story with a Salt Steppe Atlas.' },
    { name: 'Irem', regions: ['The Pillared Sea'], safe: false, unlock: 'Iremi Zee-Chart' },
    { name: "Gaider's Mourn", regions: ['The Snares'], safe: false,
      unlock: "Discovered: Corsair's Forest, Discovered: Gaider's Mourn",
      how: 'Spend a Relatively Safe Zee Lane on A Return to Terra Firma at base Zeefaring 5.' },

    // --- one-time and similar --------------------------------------------
    { name: 'A Secluded Coastline', as: 'Your Flotilla', regions: ['Home Waters'], safe: false,
      once: true, unlock: 'Ambition: Light Fingers! 51-64' },
    { name: 'The Approach to the Mountain', regions: ["Shepherd's Wash"], safe: true, once: true,
      unlock: 'Seeking Mr Eaten\'s Name 63, The Hollow Heart',
      note: 'Moves you to Your Lodgings via The Chapel of Lights.' },
    { name: 'Cline', regions: ["Shepherd's Wash"], safe: false, once: true,
      unlock: 'Associating with Radical Academics exactly 100' },
    { name: 'Avid Horizon', regions: ['Stormbones'], safe: false, once: true,
      unlock: 'Embarked on a Sanctioned Expedition to the North' },
    { name: 'Avid Horizon', as: 'Avid Horizon (NORTH)', regions: ['Stormbones'], safe: true, once: true,
      unlock: 'Seeking Mr Eaten\'s Name 77',
      note: 'Safe, and it also destroys your ship and your An Explorer of the Unterzee qualities.' },

    // --- hunting grounds: not docks --------------------------------------
    { name: 'Hunt a feral crocodile', as: 'Feral Crocodile Hunting Grounds', regions: ['Home Waters'],
      safe: null, hunt: true, unlock: 'Monstrous Anatomy 5' },
    { name: 'Estimated Angler Crab Population', as: 'Angler Crab Spawning Grounds',
      regions: ["Shepherd's Wash"], safe: null, hunt: true,
      unlock: 'Estimated Angler Crab Population, base Monstrous Anatomy 1' },
    { name: 'Remaining Mass of the Ravenous Lifeberg', as: 'Lifeberg Hunting Grounds',
      regions: ["Shepherd's Wash", 'The Sea of Voices', 'The Salt Steppe'], safe: null, hunt: true,
      unlock: 'Remaining Mass of the Ravenous Lifeberg, base Monstrous Anatomy 1' },
    { name: 'Plated Seal', as: 'Plated Seal Spawning Grounds', regions: ['Stormbones'],
      safe: null, hunt: true,
      unlock: 'Making Progress in the Labyrinth of Tigers 16, and no Plated Seals in hand' },
  ];

  // The three winds, each of which starts a dream storyline back in London.
  const ZEE_WINDS = [
    { name: 'Southern Wind', where: "Shepherd's Wash", card: 'The Light of the Mountain', dream: 'I Shot the Albatross', cost: '15 CP of Nightmares over 11 cards' },
    { name: 'Northern Wind', where: 'Stormbones', card: 'A Wind from the North', dream: 'Betwixt Us and the Sun', cost: '16-19 CP of Nightmares over 11 cards' },
    { name: 'Eastern Wind', where: 'The Salt Steppe', card: 'A Distant Gleam', dream: 'Upon a Painted Sea', cost: 'no Nightmares at all, over 11 cards' },
  ];

  // --- the cards ---------------------------------------------------------
  //
  // Each entry is one opportunity card:
  //
  //   where      'any' (drawn in every region) or the regions it belongs to.
  //   freq       the wiki's Frequency. 'High Urgency' is a black/sinister
  //              card: urgent, so it is dealt before anything else.
  //   urgent     set on those, because it changes how the badge reads -- an
  //              urgent card is not a choice, it is a blockage.
  //   strictZee  only badge this card when the area actually reads as a zee
  //              region (see inZee below). Exactly one card needs it.
  //   prefix     match on the card's opening words instead of the whole name,
  //              for the two piracy cards whose title carries your quarry's
  //              ship type.
  //   cardNeeds  what has to be true for the card to be in your deck at all.
  //
  // and each option:
  //
  //   ch     the challenge, if any. A broad one ("Watchful vs Zee Peril") is
  //          against the region's Zee Peril, so it gets harder the further
  //          out you are; a narrow one ("Zeefaring 5") mostly does not.
  //   need   what the option is gated on. `piracy` marks the ones gated on
  //          Corsair's Colours or a bounty -- a whole separate game the
  //          Zailing guide deliberately does not cover.
  //   hidden the option disappears when this is true.
  //   tw     Troubled Waters change in CP on a success (or outright, for an
  //          option with no challenge). `twRange` keeps the wiki's wording
  //          when it recorded a range, `twText` when it sets a level instead.
  //   prog   Zailing progress as a multiple of your Zailing Speed: 1, 0.5, 0
  //          for none, and 'flat80' for the one option in the whole deck that
  //          ignores your ship and simply hands you 80.
  //   fail   what a failed challenge costs. `rare` is the rare success.
  const ZEE_CARDS = [
    // --- Drawn anywhere at zee ---
    {
      name: 'A Blank Space on the Charts',
      where: ['any'],
      freq: 'High Urgency',
      urgent: true,
      cardNeeds: 'Troubled Waters 7, Zailing... 60',
      note: 'Black card: drawn at Troubled Waters 7 whatever your other menaces are.',
      opts: [
        { text: 'There\'s an island here', ch: 'Luck 50%', tw: -5, prog: 0, men: 'Creeping Fear', fail: 'Troubled Waters set to 4, no progress, Creeping Fear, Nightmares +3' },
        { text: 'Fortuitous fragments', need: 'Partial Map 2 x', tw: null, twText: 'Troubled Waters set to 5', prog: 0, gain: 'costs Partial Map 2' },
        { text: 'Search the uncharted waters for your quarry', ch: 'Zeefaring 6', need: 'Chasing Down Your Bounty, Corsair\'s Colours 2', tw: -1, prog: 1, gain: 'Chasing Down Your Bounty', rare: 'TW -2-6, full speed', fail: 'TW -5, half speed, Creeping Fear', piracy: true },
      ],
    },
    {
      name: 'A Bounty Upon Your Head',
      where: ['any'],
      freq: 'Standard',
      cardNeeds: 'Corsair\'s Colours 2, Chasing Down Your Bounty',
      opts: [
        { text: 'Open fire!', ch: 'Zeefaring 13', tw: 5, prog: 1, gain: 'Pieces of Plunder Weighing Down Your Hold [See below]', rare: 'TW +3, full speed', fail: 'TW +12, half speed, Unwelcome on the Waters', piracy: true },
        { text: 'Signal the HMS Ramillies for support', ch: 'Zeefaring 11', need: 'The Crew of HMS Ramillies', tw: 5, prog: 1, gain: 'Pieces of Plunder Weighing Down Your Hold [See below]', rare: 'TW +3, full speed', fail: 'TW +12, half speed, Unwelcome on the Waters', piracy: true },
        { text: 'Evade them!', ch: 'Zailing Speed vs Zee Peril', tw: 2, twRange: '+2-3', prog: 1, fail: 'TW +8, full speed, Unwelcome on the Waters', piracy: true },
      ],
    },
    {
      name: 'A Corvette of Her Majesty\'s Navy',
      where: ['any'],
      freq: 'Standard',
      note: 'The semaphore line is full speed for -2 Troubled Waters, but it is hidden above Suspicion 5. Flying Corsair\'s Colours replaces the card with a piracy version.',
      opts: [
        { text: 'Exchange pleasantries via semaphore', hidden: 'Suspicion 5, Corsair\'s Colours 2', tw: -2, prog: 1 },
        { text: 'They\'re not slowing', ch: 'Zailing Speed vs Zee Peril', need: 'Suspicion 5', tw: 3, prog: 1, men: 'Suspicion +3', fail: 'TW +9, full speed, Silent Stalker' },
        { text: 'Rely on the Commodore\'s old codes', ch: 'A Player of Chess 5', need: 'Overworked Commodore 1 x, A Player of Chess', tw: null, twText: 'Troubled Waters falls by an amount the wiki does not record', prog: 1, men: 'clears Suspicion -3', fail: 'TW +8, full speed, Suspicion +4' },
        { text: 'Exchange information via semaphore', ch: 'Persuasive vs Zee Peril', need: 'Chasing Down Your Bounty', tw: -2, prog: 1, gain: 'Chasing Down Your Bounty +8', fail: 'TW +6, half speed, Suspicion +2, Unwelcome on the Waters', piracy: true },
        { text: 'Take them for all they\'ve got', ch: 'Zeefaring 5', need: 'Corsair\'s Colours 2', tw: 4, prog: 1, men: 'Suspicion +1, Unwelcome on the Waters', gain: 'Pieces of Plunder Weighing Down Your Hold 250', rare: 'TW +4, full speed', fail: 'TW +8, half speed, Suspicion +4, Unwelcome on the Waters', piracy: true },
      ],
    },
    {
      name: 'A Dream of a Cup',
      where: ['any'],
      freq: 'Infrequent',
      cardNeeds: 'Delighted, Nightmares',
      opts: [
        { text: 'Drink the wine', need: 'Having Recurring Dreams: Rosy Colours Leaping on the Wall exactly 6', tw: 0, prog: 0, men: 'Nightmares +3', gain: 'Having Recurring Dreams: Rosy Colours Leaping on the Wall +4' },
        { text: 'Awaken from a familiar dream', need: 'Still Waiting on the Host', tw: 0, prog: 0, men: 'clears Nightmares -3', gain: 'costs Having Recurring Dreams: Rosy Colours Leaping on the Wall' },
      ],
    },
    {
      name: 'A Dream of a Table',
      where: ['any'],
      freq: 'Infrequent',
      cardNeeds: 'Delighted, Nightmares',
      opts: [
        { text: 'Join them at their table', need: 'Having Recurring Dreams: Rosy Colours Leaping on the Wall exactly 5', tw: 0, prog: 0, men: 'Nightmares +3', gain: 'Having Recurring Dreams: Rosy Colours Leaping on the Wall +6' },
        { text: 'Awaken from a familiar dream', need: 'Still Waiting on the Host', tw: 0, prog: 0, men: 'clears Nightmares -3', gain: 'costs Having Recurring Dreams: Rosy Colours Leaping on the Wall' },
      ],
    },
    {
      name: 'A Dream of Ascent',
      where: ['any'],
      freq: 'Infrequent',
      cardNeeds: 'Delighted, Nightmares',
      opts: [
        { text: 'Fly higher', need: 'Having Recurring Dreams: Rosy Colours Leaping on the Wall exactly 4', tw: 0, prog: 0, men: 'Nightmares +3', gain: 'Having Recurring Dreams: Rosy Colours Leaping on the Wall +5' },
        { text: 'Awaken from a familiar dream', need: 'Still Waiting on the Host', tw: 0, prog: 0, men: 'clears Nightmares -3', gain: 'costs Having Recurring Dreams: Rosy Colours Leaping on the Wall' },
      ],
    },
    {
      name: 'A Dream of Designs',
      where: ['any'],
      freq: 'Infrequent',
      cardNeeds: 'Delighted, Nightmares',
      opts: [
        { text: 'Sunbathe in the light', need: 'Having Recurring Dreams: Rosy Colours Leaping on the Wall exactly 7', tw: 0, prog: 0, men: 'Nightmares +3', gain: 'Still Waiting on the Host, Whirring Contraption 11, Whirring Contraption 4' },
        { text: 'Awaken from a familiar dream', need: 'Still Waiting on the Host', tw: 0, prog: 0, men: 'clears Nightmares -3', gain: 'costs Having Recurring Dreams: Rosy Colours Leaping on the Wall' },
      ],
    },
    {
      name: 'A Dream of Stained-Glass',
      where: ['any'],
      freq: 'Infrequent',
      cardNeeds: 'Delighted, Nightmares',
      opts: [
        { text: 'Look into the light', need: 'Having Recurring Dreams: Rosy Colours Leaping on the Wall 1-2', tw: 0, prog: 0, men: 'Nightmares +2', gain: 'Having Recurring Dreams: Rosy Colours Leaping on the Wall +3' },
        { text: 'Awaken from a familiar dream', need: 'Still Waiting on the Host', tw: 0, prog: 0, men: 'clears Nightmares -3', gain: 'costs Having Recurring Dreams: Rosy Colours Leaping on the Wall' },
      ],
    },
    {
      name: 'A Dream of Sunbeams',
      where: ['any'],
      freq: 'Infrequent',
      cardNeeds: 'Delighted, Nightmares',
      opts: [
        { text: 'Stare through the glare', need: 'Having Recurring Dreams: Rosy Colours Leaping on the Wall exactly 0', tw: 0, prog: 0, men: 'Nightmares +2', gain: 'Having Recurring Dreams: Rosy Colours Leaping on the Wall +3' },
        { text: 'Awaken from a familiar dream', need: 'Still Waiting on the Host', tw: 0, prog: 0, men: 'clears Nightmares -3', gain: 'costs Having Recurring Dreams: Rosy Colours Leaping on the Wall' },
      ],
    },
    {
      name: 'A Flock of Prophets',
      where: ['any'],
      freq: 'Standard',
      cardNeeds: 'Chasing Down Your Bounty, Corsair\'s Colours 2',
      opts: [
        { text: 'Take auspices', ch: 'Zeefaring 13', tw: 4, prog: 1, gain: 'Chasing Down Your Bounty [See below]', rare: 'full speed', fail: 'TW +10, half speed', piracy: true },
        { text: 'Zail around them', tw: 2, prog: 1, piracy: true },
      ],
    },
    {
      name: 'A Giant Angler Crab',
      where: ['any'],
      freq: 'Infrequent',
      note: '"Ready the guns" is the good line if you have Monstrous Anatomy 3 - full speed and -2 Troubled Waters.',
      opts: [
        { text: 'Full reverse! Turn us away!', ch: 'Shadowy vs Zee Peril', tw: 0, prog: 0.5, fail: 'TW +8, half speed, Silent Stalker' },
        { text: 'Ready the guns and fire at its soft spots', ch: 'Monstrous Anatomy 3', tw: -2, prog: 1, fail: 'TW +8, no progress, Silent Stalker 1' },
        { text: 'Pursue it to its spawning grounds', ch: 'Shadowy vs Zee Peril', need: 'Zailing to Destination: Angler Crab Spawning Grounds', tw: 2, prog: 1, note: 'Zailing Speed + a flat 11 rather than the usual +1-5.', fail: 'TW +2, half speed' },
        { text: 'Reach for your harpoon; call for ramming speed!', need: 'A Notched Bone Harpoon', tw: 1, prog: 0, men: 'clears Rumbling Stomachs', gain: 'Deep-zee Catch 5' },
      ],
    },
    {
      name: 'A Growing Concern',
      where: ['any'],
      freq: 'High Urgency',
      urgent: true,
      cardNeeds: 'Troubled Waters 7, Creeping Fear',
      note: 'Black card: Troubled Waters 7 plus Creeping Fear.',
      opts: [
        { text: 'Investigate', ch: 'Luck 50%', tw: -5, prog: 0, fail: 'Troubled Waters set to 5, no progress, Nightmares +8' },
        { text: 'Double the zailors\' rations', need: 'Crate of Incorruptible Biscuits 1 x, Foxfire Candle Stub 100 x, Bottle of Greyfields 1882 100 x', tw: null, twText: 'Troubled Waters set to 5', prog: 0, men: 'Rumbling Stomachs', gain: 'costs Crate of Incorruptible Biscuits 1, costs Foxfire Candle Stub 100, costs Bottle of Greyfields 1882 100' },
      ],
    },
    {
      name: 'A Huge Terrible Beast of the Unterzee!',
      where: ['any'],
      freq: 'Infrequent',
      note: 'Both lines leave your crew with Rumbling Stomachs, which is one of the six menaces that turns Troubled Waters 7 into a black card.',
      opts: [
        { text: 'Delicious, delicious lumps', ch: 'Dangerous vs Zee Peril', tw: 0, prog: 1, men: 'Rumbling Stomachs', gain: 'Appalling Secret 2, Unaccountably Peckish 1, Someone Is Coming +1, Tale of Terror!! 4', fail: 'TW +10, no progress, Rumbling Stomachs' },
        { text: 'Steam on by', tw: 3, twRange: '+3-5', prog: 1, men: 'Silent Stalker' },
      ],
    },
    {
      name: 'A Message in a Bottle',
      where: ['any'],
      freq: 'Very Infrequent',
      cardNeeds: 'Corsair\'s Colours',
      opts: [
        { text: 'Unfurl the paper', tw: 0, prog: 0, gain: 'Directions to a Hidden Stash for one of eight ports', piracy: true },
      ],
    },
    {
      name: 'A Navigation Error',
      where: ['any'],
      freq: 'Infrequent',
      note: 'A success on any of the first three lines is full speed for no Troubled Waters; the failures cost +8 or +9 and half the progress.',
      opts: [
        { text: 'Correct your course', ch: 'Watchful vs Zee Peril', tw: 0, prog: 1, gain: 'Map Scrap 10', fail: 'TW +8, half speed' },
        { text: 'Listen to the Zee', ch: 'Zeefaring 5', need: 'Zeefaring', tw: 0, prog: 1, gain: 'Map Scrap 12', fail: 'TW +9, half speed' },
        { text: 'Consider what you learned from the Starved Men', ch: 'Watchful vs Zee Peril', need: 'Written in the Glim (Quality) 3000', tw: 0, prog: 1, gain: 'Map Scrap 13', fail: 'TW +9, half speed' },
        { text: 'Let your own star guide you', ch: 'Persuasive vs Zee Peril', need: 'A False-Star of your Own', tw: -5, prog: 1, fail: 'full speed' },
        { text: 'Use your disorientation to your advantage', ch: 'Zeefaring 5', need: 'Chasing Down Your Bounty, Corsair\'s Colours 2', tw: 2, twRange: '+2-3', prog: 1, gain: 'Chasing Down Your Bounty [See below]', rare: 'TW -1, full speed', fail: 'TW +8, full speed', piracy: true },
      ],
    },
    {
      name: 'A Promising Wreck',
      where: ['any'],
      freq: 'Standard',
      cardNeeds: 'Corsair\'s Colours 2',
      opts: [
        { text: 'Dive for salvage', ch: 'Zeefaring 13', tw: 2, prog: 1, gain: 'Pieces of Plunder Weighing Down Your Hold [see below], Unprovenanced Artefact 1', rare: 'full speed', fail: 'TW +8, half speed, Creeping Fear', piracy: true },
        { text: 'Zail on by', tw: 4, prog: 1, piracy: true },
      ],
    },
    {
      name: 'A Ragtag Flotilla',
      where: ['any'],
      freq: 'Standard',
      cardNeeds: 'Remaining Mass of the Ravenous Lifeberg',
      note: 'Only appears while a Ravenous Lifeberg is loose in the world.',
      opts: [
        { text: 'Hail a ship and inquire about their purpose', tw: -2, prog: 0.5, gain: 'Tale of Terror!! 1' },
        { text: 'Steam on by', tw: 4, prog: 1 },
      ],
    },
    {
      name: 'A Ship of Zealots',
      where: ['any'],
      freq: 'Infrequent',
      cardNeeds: 'Troubled Waters 4-7',
      note: 'Only drawn at Troubled Waters 4-7.',
      opts: [
        { text: 'See them off', ch: 'Dangerous vs Zee Peril', tw: 2, prog: 1, fail: 'TW +10, full speed' },
        { text: 'Race away from these lunatics', need: 'Zailing Speed 75', tw: 1, prog: 1 },
        { text: 'Preach a variant creed', ch: 'Mithridacy 3', tw: 2, prog: 1, fail: 'TW +10, half speed' },
        { text: 'Signal your experience on the Samaritan', need: 'The Banker\'s Daughter', tw: 2, prog: 1 },
        { text: 'Send them down to the Fathomking\'s court', ch: 'Zeefaring 5', need: 'Corsair\'s Colours 2', tw: 2, prog: 1, gain: 'Pieces of Plunder Weighing Down Your Hold [See below], Pieces of Plunder Weighing Down Your Hold [See below]', fail: 'TW +8, half speed', piracy: true },
      ],
    },
    {
      name: 'A Sighting of the (Bounty)',
      prefix: 'A Sighting of the',
      where: ['any'],
      freq: 'Standard',
      cardNeeds: 'Chasing Down Your Bounty, Corsair\'s Colours 2',
      note: 'Piracy card. In game the name carries your quarry\'s ship type in place of "(Bounty)", so it is matched on its opening words.',
      opts: [
        { text: 'Follow that ship!', ch: 'Zeefaring 13', tw: 4, prog: 1, gain: 'Chasing Down Your Bounty [See below]', rare: 'TW +2, full speed', fail: 'TW +10, half speed', piracy: true },
        { text: 'Let them pass over the horizon', tw: 6, prog: 1, piracy: true },
      ],
    },
    {
      name: 'A Spit of Land',
      where: ['any'],
      freq: 'Infrequent',
      note: 'A coin flip: -1 Troubled Waters at half speed, or +8 at half speed.',
      opts: [
        { text: 'Steam on by', hidden: 'Rumbling Stomachs', tw: 1, prog: 1 },
        { text: 'Stop briefly at the island', ch: 'Luck 50%', tw: -1, twFail: 8, prog: 0.5, fail: 'TW +8, half speed' },
        { text: 'Stop at the behest of your crew', need: 'Shipful of Schemers', tw: 1, prog: 0.5, gain: 'Vienna Opening 1' },
        { text: 'The Heart\'s suggestion', need: 'The Cladery Heart', tw: -1, prog: 1, gain: 'Tin of Zzoup 1' },
      ],
    },
    {
      name: 'A Wily Zailor',
      where: ['any'],
      freq: 'Standard',
      cardNeeds: 'An Experienced Zailor:',
      note: 'Not an ordinary voyage: this card belongs to a journey measured in Approaching Journey\'s End rather than Zailing..., so it makes no Zailing progress.',
      opts: [
        { text: 'Zail around the Pelagic Upheavals', tw: 4, prog: 0, gain: 'Approaching Journey\'s End +6' },
        { text: 'Skirt the Howling Shoals', need: 'An Experienced Zailor: A Well-Known Navigator', tw: 4, prog: 0, gain: 'Approaching Journey\'s End +7' },
        { text: 'Steam straight through the Beechey Currents', need: 'An Experienced Zailor: A Zee-Voyager of Note', tw: 4, prog: 0, gain: 'Approaching Journey\'s End +8, Zee-Ztory 1' },
        { text: '"I\'ll be in my bunk." (8 FATE)', need: 'An Experienced Zailor: A Seasoned Captain, A Well-Known Navigator or A Zee-Voyager of Note', tw: 0, prog: 0 },
      ],
    },
    {
      name: 'A Worrying Appetite',
      where: ['any'],
      freq: 'High Urgency',
      urgent: true,
      cardNeeds: 'Troubled Waters 7, Rumbling Stomachs',
      note: 'Black card: Troubled Waters 7 plus Rumbling Stomachs. The one black-card option that raises Troubled Waters instead of lowering it is "You, too, have an appetite".',
      opts: [
        { text: 'Scour the hold for anything edible', ch: 'Luck 50%', tw: -5, twFail: 10, prog: 0, fail: 'TW +10, no progress, Nightmares +8' },
        { text: 'You, too, have an appetite', need: 'Unaccountably Peckish 1', tw: 2, prog: 0, men: 'Nightmares +1, clears Rumbling Stomachs', gain: 'Unaccountably Peckish 1' },
      ],
    },
    {
      name: 'An Architect\'s Dream',
      where: ['any'],
      freq: 'Infrequent',
      cardNeeds: 'Delighted, Nightmares',
      opts: [
        { text: 'Hand him a hammer', need: 'Having Recurring Dreams: Rosy Colours Leaping on the Wall exactly 3', tw: 0, prog: 0, men: 'Nightmares +2', gain: 'Having Recurring Dreams: Rosy Colours Leaping on the Wall +4' },
        { text: 'Awaken from a familiar dream', need: 'Still Waiting on the Host', tw: 0, prog: 0, men: 'clears Nightmares -3', gain: 'costs Having Recurring Dreams: Rosy Colours Leaping on the Wall' },
      ],
    },
    {
      name: 'Bearing Witness to a Pilgrimage',
      where: ['any'],
      freq: 'Standard',
      cardNeeds: 'The Midnight Whale: Distance from the Gant Pole 1000',
      opts: [
        { text: 'Hail a passing steamship', tw: 0, prog: 0.5, gain: 'Romantic Notion 25' },
        { text: 'Steam on by', tw: 4, prog: 1, note: 'Full Zailing Speed, but without the usual +1-5 bonus.' },
      ],
    },
    {
      name: 'Cornering the (Bounty) at Last',
      prefix: 'Cornering the',
      where: ['any'],
      freq: 'High Urgency',
      urgent: true,
      cardNeeds: 'Chasing Down Your Bounty 15',
      note: 'Piracy card. In game the name carries your quarry\'s ship type in place of "(Bounty)", so it is matched on its opening words.',
      opts: [
        { text: 'Strike them down', ch: 'Zeefaring 11', need: 'Chosen Bounty Ship Type 100', tw: 3, prog: 0, gain: 'A Prolific Pirate 1, costs Chasing Down Your Bounty, Pieces of Plunder Weighing Down Your Hold [See below], In Pursuit of Wrack-Iron 1', fail: 'TW +12, no progress, Unwelcome on the Waters', piracy: true },
        { text: 'Call off the approach', tw: -7, prog: 0, men: 'Wounds +2', gain: 'costs Chasing Down Your Bounty', piracy: true },
      ],
    },
    {
      name: 'Creaking from Above',
      where: ['any'],
      freq: 'Standard',
      opts: [
        { text: 'Glim-fall!', ch: 'Luck 50%', tw: 2, twFail: 9, prog: 1, men: 'Silent Stalker', gain: 'Shard of Glim (2 x Zee Peril), Someone Is Coming +1', fail: 'TW +9, full speed, Silent Stalker' },
      ],
    },
    {
      name: 'Passing a Lightship',
      where: ['any'],
      freq: 'Infrequent',
      note: '"Zail on" is a rare thing: full speed for no Troubled Waters at all, with no challenge.',
      opts: [
        { text: 'Stop and exchange news', need: 'Zee-Ztory 7 x', tw: 0, prog: 0, gain: 'costs Zee-Ztory 7, Tale of Terror!! 2-10, Scrap of Incendiary Gossip 1-10' },
        { text: 'Zail on', tw: 0, prog: 1 },
        { text: 'Stop and exchange news', ch: 'Shadowy vs Zee Peril', need: 'Chasing Down Your Bounty, Corsair\'s Colours 2', tw: 0, prog: 1, gain: 'Chasing Down Your Bounty [See below]', fail: 'TW +7, half speed, Unwelcome on the Waters', piracy: true },
      ],
    },
    {
      name: 'Rats in the hold',
      where: ['any'],
      freq: 'Infrequent',
      opts: [
        { text: 'Negotiate with them', ch: 'Persuasive vs Zee Peril', tw: 0, prog: 1, fail: 'TW +8, full speed, Creeping Fear' },
        { text: 'Fill the hold with traps', ch: 'Dangerous vs Zee Peril', tw: 2, prog: 1, gain: 'Rat on a String 50', fail: 'TW +8, full speed, Mutinous Whispers' },
        { text: 'Permit Blackpelt to deal with them', need: 'Blackpelt, Venge-Pirate', tw: 0, prog: 1, gain: 'Rat on a String 4, Maniac\'s Prayer 13' },
        { text: 'Go on a rat-catching expedition', need: 'A Notched Bone Harpoon or Ratting Piece', tw: 0, prog: 1, gain: 'Rat on a String 100' },
        { text: 'Question them about other ships', ch: 'Dangerous vs Zee Peril', need: 'Chasing Down Your Bounty, Corsair\'s Colours 2', tw: 3, prog: 1, gain: 'Chasing Down Your Bounty [See below]', rare: 'TW +2-3, full speed', fail: 'TW +6, full speed', piracy: true },
      ],
    },
    {
      name: 'Share your Research with a Fellow Scholar',
      where: ['any', 'The Sea of Voices'],
      freq: 'Infrequent',
      cardNeeds: 'Embarking on a Voyage of Scientific Discovery 3',
      note: 'Belongs to a journey measured in Approaching Journey\'s End rather than Zailing...',
      opts: [
        { text: 'Correspond with a Fellow Scholar', need: 'Sulky Bat 10 x, Page of Cryptopalaeontological Notes 50 x, Page of Prelapsarian Archaeological Notes 50 x, Page of Theosophistical Notes 50 x, Embarking on a Voyage of Scientific Discovery 3', tw: 2, prog: 0, gain: 'Approaching Journey\'s End +3, 20 of each Page of Notes, Sulky Bat 4-8' },
      ],
    },
    {
      name: 'Signs of Disloyalty',
      where: ['any'],
      freq: 'High Urgency',
      urgent: true,
      cardNeeds: 'Troubled Waters 7, Mutinous Whispers',
      note: 'Black card: Troubled Waters 7 plus Mutinous Whispers.',
      opts: [
        { text: 'A few private conversations', ch: 'Luck 50%', tw: -5, twFail: 2, prog: 0.5, fail: 'TW +2, half speed' },
        { text: 'Double their pay', need: 'Shard of Glim 250 x, Moon-Pearl 250 x', tw: null, twText: 'Troubled Waters set to 5', prog: 0, gain: 'costs Shard of Glim 250, costs Moon-Pearl 250' },
        { text: 'Remind them of their right and proper duty', ch: 'Persuasive vs Zee Peril', need: 'Most Presentable Company', tw: null, twText: 'Troubled Waters set to 5', prog: 0.5, fail: 'TW +2, half speed' },
        { text: 'Put your money where your mouth is', ch: 'Luck 40%', need: 'High-Rolling Rantipoles, Corsair\'s Colours 2, Pieces of Plunder Weighing Down Your Hold 500 x', tw: -2, prog: 0.5, gain: 'Pieces of Plunder Weighing Down Your Hold 550', fail: 'Troubled Waters set to 5, half speed, clears Mutinous Whispers', piracy: true },
      ],
    },
    {
      name: 'Signs of Pursuit',
      where: ['any'],
      freq: 'High Urgency',
      urgent: true,
      cardNeeds: 'Troubled Waters 7, Silent Stalker',
      note: 'Black card: Troubled Waters 7 plus Silent Stalker. Its challenge is Dangerous against a difficulty well above Zee Peril.',
      opts: [
        { text: 'Turn around and confront it', ch: 'Dangerous vs Zee Peril', tw: -5, prog: 0.5, fail: 'Troubled Waters set to 5, no progress, clears Silent Stalker, Groaning Hull' },
        { text: 'Throw bait overboard', need: 'Deep-zee Catch 10 x', hidden: 'Rumbling Stomachs', tw: null, twText: 'Troubled Waters set to 5', prog: 0, men: 'Rumbling Stomachs', gain: 'costs Deep-zee Catch 10' },
      ],
    },
    {
      name: 'Spiralling Into Sorrow',
      where: ['any'],
      freq: 'Frequent',
      cardNeeds: 'Associating with a Youthful Naturalist exactly 590, Spiralling Regrets',
      opts: [
        { text: 'Dive with the (diving-bell)', need: 'Appalling Secret', hidden: 'Wounds, A Consignment of Capricious Cargo', tw: null, twText: 'Troubled Waters set to 0', prog: 0, gain: 'Associating with a Youthful Naturalist, Shard of Glim 777, costs Zee Peril' },
      ],
    },
    {
      name: 'Submerge',
      where: ['any', 'The Sea of Voices'],
      freq: 'Standard',
      cardNeeds: 'Zubmarine 1 x',
      note: 'Belongs to a journey measured in Approaching Journey\'s End rather than Zailing...',
      opts: [
        { text: 'Run deep, run quiet', tw: -4, prog: 0, gain: 'Approaching Journey\'s End +2, Approaching the Gates of the Garden +?' },
      ],
    },
    {
      name: 'Taking in Water',
      where: ['any'],
      freq: 'High Urgency',
      urgent: true,
      cardNeeds: 'Troubled Waters 7, Groaning Hull',
      note: 'Black card: Troubled Waters 7 plus Groaning Hull. The Luck 70% raises Troubled Waters either way; the brass repair is the real fix.',
      opts: [
        { text: 'Seal the compartment and run the pumps', ch: 'Luck 70%', tw: 2, twFail: 3, prog: 0.5, fail: 'TW +3, no progress, Wounds +3' },
        { text: 'Stop and make field repairs', need: 'Nevercold Brass Sliver 500 x', tw: -7, prog: 0, men: 'clears Groaning Hull, Creeping Fear', gain: 'costs Nevercold Brass Sliver 500' },
      ],
    },
    {
      name: 'The Clinging Coral Mass',
      where: ['any'],
      freq: 'Infrequent',
      opts: [
        { text: '"Put your backs into it, lads!"', ch: 'Persuasive vs Zee Peril', tw: 2, prog: 1, rare: 'full speed', fail: 'TW +10, full speed, Mutinous Whispers' },
        { text: 'Grab a hammer yourself', ch: 'Dangerous vs Zee Peril', tw: 2, prog: 1, fail: 'TW +10, full speed, Mutinous Whispers' },
      ],
    },
    {
      name: 'The Fleet of Truth',
      where: ['any'],
      freq: 'Infrequent',
      cardNeeds: 'Embarking on a Voyage of Scientific Discovery 3, Troubled Waters 3-7',
      opts: [
        { text: 'Villainy!', ch: 'Dangerous vs Zee Peril', tw: 4, prog: 1, gain: 'Page of Cryptopalaeontological Notes 5, Page of Prelapsarian Archaeological Notes 5, Page of Theosophistical Notes 5', fail: 'TW +8, full speed' },
        { text: 'Subterfuge', ch: 'Shadowy vs Zee Peril', need: 'Fraught Research Assistant', tw: 4, prog: 1, gain: 'Page of Cryptopalaeontological Notes 7, Page of Prelapsarian Archaeological Notes 7, Page of Theosophistical Notes 7', fail: 'TW +8, full speed' },
        { text: 'Engage in a little bit of \'peer review\'', ch: 'Persuasive vs Zee Peril', need: 'Chasing Down Your Bounty, Corsair\'s Colours 2', tw: 2, prog: 1, gain: 'Chasing Down Your Bounty [See below]', rare: 'full speed', fail: 'TW +8, half speed, Unwelcome on the Waters', piracy: true },
        { text: 'Hatch plans with two Shifty Scholars', need: 'Associating with a Youthful Naturalist 510-549, Favour in High Places 2 x', hidden: 'Organic Comprehension', tw: 2, prog: 0.5, gain: 'Organic Comprehension, costs Favour in High Places 2' },
        { text: 'Rendezvous with two Shifty Scholars', need: 'Associating with a Youthful Naturalist 510-549, Organic Comprehension exactly 7', tw: 2, prog: 0.5, men: 'Silent Stalker', gain: 'Organic Comprehension, Associating with a Youthful Naturalist 10, Unearthly Fossil 10' },
      ],
    },
    {
      name: 'The Killing Wind',
      where: ['any'],
      freq: 'Standard',
      cardNeeds: 'Troubled Waters 4-7',
      note: 'Only drawn at Troubled Waters 4-7. Without Zubmersibility the only line is a coin flip that costs +4 on a success and +12 on a failure - leave it in hand while you can.',
      opts: [
        { text: 'Outrun the storm front', ch: 'Luck 50%', tw: 4, twFail: 12, prog: 1, men: 'Creeping Fear', fail: 'TW +12, no progress, Creeping Fear' },
        { text: 'Make ready to dive', need: 'Zubmersibility', tw: -2, prog: 1, gain: 'Zee-Ztory 3–6' },
        { text: 'Chart a course through the storm using your Storm in a Teacup', ch: 'Luck 60%', need: 'Ornamental Storm in a Teacup', tw: null, twText: 'Troubled Waters up by an unrecorded amount', twFail: 10, prog: 1, men: 'Creeping Fear', gain: 'Zee-Ztory 2', fail: 'TW +10, no progress, Creeping Fear' },
      ],
    },
    {
      name: 'The Sound of Wings',
      where: ['any'],
      freq: 'Infrequent',
      strictZee: true,
      cardNeeds: 'Wings of Change',
      note: 'Fallen London draws a card of this name in eight different places; only the Unterzee one is described here, which is why it is only badged when the area reads as a zee region.',
      opts: [
        { text: 'Full power to the engines!', ch: 'Zeefaring 7', tw: 0, prog: 1, men: 'Wounds 2-3', gain: 'Royal-Blue Feather 6, Aeolian Scream 1', fail: 'TW +6, half speed, Wounds 3, Nightmares 1-3' },
        { text: 'Confront it', hidden: 'Wings of Change (Not here. Not even with cannonfire.)', tw: 0, prog: 0 },
      ],
    },
    {
      name: 'Toward the Canal',
      where: ['any'],
      freq: 'Very Infrequent',
      cardNeeds: 'A Person of Some Importance - is: A Shattering Force, A Legendary Charisma, An Invisible Eminence, An Extraordinary Mind, A Paramount Presence',
      opts: [
        { text: 'Contemplate the journey', tw: 0, prog: 1 },
        { text: 'Commit to the choice', need: 'The Date - After Certain Neathy Affairs are Complete', tw: 0, prog: 0 },
      ],
    },
    {
      name: 'What do the Drownies Sing?',
      where: ['any'],
      freq: 'Standard',
      note: 'With a Faceted Decanter of Drownie Effluvia and Kataleptic Toxicology, this is full speed for -5 Troubled Waters.',
      opts: [
        { text: 'Keep the crew from listening', ch: 'Persuasive vs Zee Peril', tw: 2, prog: 1, fail: 'TW +9, full speed, Creeping Fear' },
        { text: 'Drown out the drownies', ch: 'Dangerous vs Zee Peril', tw: 2, prog: 1, fail: 'TW +9, full speed, Groaning Hull' },
        { text: 'Cure the ignorance of your zailors', ch: 'Kataleptic Toxicology 3', need: 'A Faceted Decanter of Drownie Effluvia, Kataleptic Toxicology', tw: -5, prog: 1, fail: 'TW +12, full speed, Creeping Fear' },
        { text: 'Listen to the songs, and for your quarry', ch: 'Monstrous Anatomy 13', need: 'Chasing Down Your Bounty, Corsair\'s Colours 2', tw: 2, prog: 1, gain: 'Chasing Down Your Bounty', rare: 'full speed', fail: 'TW +6, half speed, Nightmares +4, Silent Stalker', piracy: true },
      ],
    },
    {
      name: 'When the Carousing Stops',
      where: ['any'],
      freq: 'Standard',
      cardNeeds: 'Corsair\'s Colours 2',
      opts: [
        { text: 'Discipline your crew', ch: 'Dangerous vs Zee Peril', tw: 4, prog: 1, fail: 'TW +10, half speed, Mutinous Whispers', piracy: true },
        { text: 'Restart the party', ch: 'Persuasive vs Zee Peril', tw: 4, prog: 1, gain: 'Pieces of Plunder Weighing Down Your Hold [see below], Bottle of Broken Giant 1844 1', rare: 'TW +2, full speed', fail: 'TW +10, half speed, Mutinous Whispers', piracy: true },
      ],
    },
    {
      name: 'Your False-Star',
      where: ['any'],
      freq: 'Standard',
      cardNeeds: 'Looked Upon Fondly',
      note: 'The best card in the deck: full Zailing Speed and Troubled Waters -5, no challenge, no cost. Needs the Looked Upon Fondly quality from the Fingerkings.',
      opts: [
        { text: 'Navigate by the light of your star', tw: -5, prog: 1 },
      ],
    },
    {
      name: 'Zeeborne Pariahs',
      where: ['any'],
      freq: 'High Urgency',
      urgent: true,
      cardNeeds: 'Troubled Waters 7, Unwelcome on the Waters',
      note: 'Black card: Troubled Waters 7 plus Unwelcome on the Waters, which comes from failed piracy.',
      opts: [
        { text: 'Evade them!', ch: 'Luck 70%', tw: 2, twFail: 4, prog: 0.5, fail: 'TW +4, no progress, Wounds +4' },
        { text: 'Put your crew to work disguising the ship', need: 'Inkling of Identity 50 x', tw: -7, prog: 0, men: 'clears Unwelcome on the Waters, Mutinous Whispers', gain: 'costs Inkling of Identity 50' },
      ],
    },

    // --- Home Waters ---
    {
      name: 'A Steamer full of Passengers',
      where: ['Home Waters', 'Shepherd\'s Wash'],
      freq: 'Standard',
      cardNeeds: 'Zailing on: Home Waters or Shepherd\'s Wash',
      opts: [
        { text: 'Steam past them', tw: 2, prog: 1 },
        { text: 'Invite them aboard for a party', need: 'Luxurious', tw: 0, prog: 0, men: 'Scandal +2', gain: 'Hedonist, Pair of Scarlet Stockings of Dubious Origin 1, Secluded Address 6, costs Austere -3' },
        { text: 'Recognise your quarry', ch: 'Dangerous vs Zee Peril', need: 'A List of Aliases, Writ in Gant', tw: 5, prog: 1, gain: 'Piece of Rostygold 250', fail: 'TW +2, full speed' },
        { text: 'Rob them blind', ch: 'Dangerous vs Zee Peril', need: 'Corsair\'s Colours 2', tw: 2, prog: 1, gain: 'Pieces of Plunder Weighing Down Your Hold 300', rare: 'TW +1, full speed', fail: 'TW +8, half speed, Unwelcome on the Waters', piracy: true },
      ],
    },
    {
      name: 'Amber in the Water',
      where: ['Home Waters'],
      freq: 'Abundant',
      cardNeeds: 'The Lorn-Fluke\'s Fury, Wayland\'s Teeth Involvement Flag 2',
      opts: [
        { text: 'Identify a course through less viscous waters', ch: 'Zeefaring + Kataleptic Toxicology 20', tw: 2, prog: 1, fail: 'TW +7, half speed, Creeping Fear' },
        { text: 'Revel in the delays', need: 'Luxurious', tw: 0, prog: 0.5, gain: 'Nodule of Warm Amber 10, Nodule of Deep Amber 200' },
        { text: 'Mount your Fluke-Core upon the prow', need: 'Fluke-Core 1 x', tw: 2, prog: 1 },
      ],
    },
    {
      name: 'Enspired Shallows',
      where: ['Home Waters'],
      freq: 'Abundant',
      cardNeeds: 'The Lorn-Fluke\'s Fury, Wayland\'s Teeth Involvement Flag 2',
      opts: [
        { text: 'Chart a careful course', ch: 'Zeefaring + Shapeling Arts 20', tw: 2, prog: 1, fail: 'TW +7, a third speed, Groaning Hull' },
        { text: 'Navigate with the aid of your amber vision', need: 'Amber Vision of the Sea of Spines', tw: 1, prog: 1 },
        { text: 'Barrel through', ch: 'Zailing Speed vs Zee Peril', tw: 2, prog: 1, fail: 'TW +7, no progress, Groaning Hull' },
      ],
    },
    {
      name: 'She\'s Going Down!',
      where: ['Home Waters'],
      freq: 'Standard',
      note: 'Rescuing them spends the action for no progress, but it is -2 Troubled Waters and a point of Steadfast.',
      opts: [
        { text: 'Stop and rescue them', tw: -2, prog: 0, gain: 'Steadfast Quirk cap=10, costs Heartless -3' },
        { text: 'Let the Unterzee have them', tw: 1, prog: 1, gain: 'Heartless Quirk cap=10, costs Magnanimous -3' },
        { text: 'Loot the wreckage', ch: 'Zeefaring 5', need: 'Corsair\'s Colours 2', tw: 3, prog: 1, gain: 'Pieces of Plunder Weighing Down Your Hold 250', rare: 'TW +2, full speed', fail: 'TW +8, full speed, Creeping Fear', piracy: true },
      ],
    },
    {
      name: 'Shipcatcher Webs',
      where: ['Home Waters'],
      freq: 'Abundant',
      cardNeeds: 'Wayland\'s Teeth Involvement Flag 2 , Saplings in the Forest of Years',
      opts: [
        { text: 'Extrapolate a pattern from fragments', ch: 'Zeefaring 20', tw: 3, prog: 1, fail: 'TW +7, half speed, Creeping Fear' },
        { text: 'Take the time to cut it down', need: 'Luxurious', tw: 0, prog: 0.5, gain: 'Silk Scrap 100, Whisper-Satin Scrap 4' },
        { text: 'Look upon the labyrinth as a spider would', need: 'at least one of: Senatorial Gauze, A Disquieting Suspicion That You Might Be Spiders, Spider-Infested Eyeball', tw: 1, prog: 1 },
      ],
    },
    {
      name: 'Spiders in the Shallows',
      where: ['Home Waters'],
      freq: 'Abundant',
      cardNeeds: 'Saplings in the Forest of Years',
      opts: [
        { text: 'Dive, dive, dive!', need: 'Zubmersibility', tw: 2, prog: 1 },
        { text: 'Blast them apart', ch: 'Zeefaring 20', tw: 1, prog: 1, fail: 'TW +7, half speed, Silent Stalker' },
        { text: 'Let your arachnid allies plead your case', need: 'at least one of: Fairly Tame Sorrow-Spider, Luxuriantly Coiffed Sorrow-Spider, Senatorial Spider, Spider of Silken Marvels ("You require but one arachnid ally." when locked)', tw: 2, prog: 1 },
      ],
    },
    {
      name: 'The Ebb and Flow of Regret',
      where: ['Home Waters', 'Shepherd\'s Wash', 'The Sea of Voices', 'The Salt Steppe', 'The Pillared Sea', 'Stormbones', 'The Snares'],
      freq: 'Abundant',
      cardNeeds: 'Associating with a Youthful Naturalist 580-587, Spiralling Regrets',
      note: 'An Evolution storyline card: one "Chart the sorrows of ..." option per region, each building the Comprehension of that region. The wiki lists its options under per-region headings rather than as one set, so no per-option numbers are transcribed here.',
      opts: [
      ],
    },
    {
      name: 'Tongues of Flame',
      where: ['Home Waters'],
      freq: 'Abundant',
      cardNeeds: 'The Lorn-Fluke\'s Fury, Wayland\'s Teeth Involvement Flag 2',
      opts: [
        { text: 'Dive, dive, dive!', need: 'Zubmersibility', tw: 1, prog: 1 },
        { text: 'Weave through the warring sigils', ch: 'Zeefaring + A Scholar of the Correspondence 20', tw: 2, twRange: '+2-3', prog: 1, fail: 'TW +7, a third speed, Creeping Fear' },
        { text: 'Lead your vessel on a merry dance through the fires', need: 'The Rose Giveth Its Verses to Devils and Also to You', tw: 1, twRange: '+1-2', prog: 1 },
      ],
    },
    {
      name: 'Venom-Tides',
      where: ['Home Waters'],
      freq: 'Abundant',
      cardNeeds: 'Wayland\'s Teeth Involvement Flag 2 , Saplings in the Forest of Years',
      opts: [
        { text: 'Charge on through', ch: 'Zailing Speed vs Zee Peril', tw: 1, prog: 1, fail: 'TW +6, half speed, Groaning Hull' },
        { text: 'Neutralise the toxins', ch: 'Zeefaring 20', tw: 2, prog: 1, fail: 'TW +7, half speed, Rumbling Stomachs' },
        { text: 'Go for a swim', need: 'Water in the Blood', tw: 1, prog: 1 },
      ],
    },

    // --- Shepherd's Wash ---
    {
      name: 'A Corsair Galley',
      where: ['Shepherd\'s Wash'],
      freq: 'Standard',
      opts: [
        { text: 'Full steam ahead!', ch: 'Zailing Speed vs Zee Peril', tw: 3, prog: 1, fail: 'TW +10, half speed, Groaning Hull' },
        { text: 'Fire a warning shot', ch: 'Dangerous vs Zee Peril', tw: 2, prog: 1, fail: 'TW +12, half speed, Groaning Hull' },
        { text: 'Fight back!', ch: 'Artisan of the Red Science 6', need: 'Corsair\'s Colours 2', tw: 4, prog: 1, gain: 'Pieces of Plunder Weighing Down Your Hold 300', rare: 'TW +2, full speed', fail: 'TW +10, a quarter speed, Unwelcome on the Waters', piracy: true },
      ],
    },
    {
      name: 'Row, row, row',
      where: ['Shepherd\'s Wash'],
      freq: 'Standard',
      note: '"Ask the monks from where they hail" is one of the two ways to discover Godfall.',
      opts: [
        { text: 'Zail on by', ch: 'Zailing Speed vs Zee Peril', tw: 0, prog: 1, fail: 'TW +8, half speed' },
        { text: 'Brawl with the monks', ch: 'Dangerous vs Zee Peril', tw: 0, prog: 0, gain: 'Bottle of Broken Giant 1844 1, Zee-Ztory 2', fail: 'TW +8, no progress' },
        { text: 'Ask the monks from where they hail', need: 'Cellar of Wine 1 x, Bottle of Morelways 1872 100 x', hidden: 'Discovered: Godfall', tw: 0, prog: 0, gain: 'costs Cellar of Wine 1, costs Bottle of Morelways 1872 100, Discovered: Godfall' },
        { text: 'Gather your crew and engage in a proper dust-up', ch: 'Dangerous vs Zee Peril', need: 'Staunch Comrades', tw: 0, prog: 0.5, gain: 'Apostate\'s Psalm 1, Bottle of Morelways 1872 20', fail: 'TW +6, no progress, Wounds +2' },
      ],
    },
    {
      name: 'The Light of the Mountain',
      where: ['Shepherd\'s Wash'],
      freq: 'Standard',
      note: 'The card that first grants Southern Wind, which starts I Shot the Albatross back in London.',
      opts: [
        { text: 'Fix a looking-glass on the Mountain', tw: 2, prog: 1, gain: 'Southern Wind +4 CP, or +1 CP if already present, Memory of Distant Shores 5' },
      ],
    },
    {
      name: 'The Wax-Wind',
      where: ['Shepherd\'s Wash'],
      freq: 'Standard',
      note: 'Also grants Southern Wind. Hiding belowdecks is -2 Troubled Waters but spends the action; with Zubmersibility, "Dive!" is -1 and full speed.',
      opts: [
        { text: 'Shut off the engines and hide belowdecks', tw: -2, prog: 0, gain: 'Zee-Ztory 1' },
        { text: 'Zail into the wind', ch: 'Shadowy vs Zee Peril', tw: 2, prog: 0.5, gain: 'Southern Wind, Zee-Ztory 1', fail: 'TW +4, no progress' },
        { text: 'Dive!', need: 'Zubmersibility', tw: -1, prog: 1, gain: 'Southern Wind' },
        { text: 'Zail into the eye of the storm', ch: 'Zeefaring 5', need: 'Zeefaring, Stormy-Eyed', tw: 0, prog: 0.5, gain: 'Memory of Distant Shores 1, Zee-Ztory 1, Memory of Light 1, Southern Wind' },
      ],
    },

    // --- The Sea of Voices ---
    {
      name: 'A Good Meal',
      where: ['The Sea of Voices'],
      freq: 'Standard',
      cardNeeds: 'Embarking on a Voyage of Scientific Discovery 3',
      opts: [
        { text: 'And a little bonus', tw: 3, prog: 1, gain: 'Page of Cryptopalaeontological Notes 3, Page of Prelapsarian Archaeological Notes 3, Page of Theosophistical Notes 3, Moon-Pearl 1' },
      ],
    },
    {
      name: 'A Hazard to Shipping',
      where: ['The Sea of Voices'],
      freq: 'Standard',
      opts: [
        { text: 'Set a course around the thing', ch: 'Watchful vs Zee Peril', tw: 2, prog: 1, rare: 'full speed', fail: 'TW +2, half speed, Silent Stalker' },
      ],
    },
    {
      name: 'A Light in the Fog',
      where: ['The Sea of Voices'],
      freq: 'Standard',
      opts: [
        { text: 'Get as close as you dare', tw: 3, prog: 0.5, gain: 'Walking the Falling Cities +5, Zee-Ztory 5' },
        { text: 'Keep away from the lighthouse', tw: 1, prog: 1 },
        { text: 'Listen for news of your quarry', ch: 'Watchful vs Zee Peril', need: 'Chasing Down Your Bounty, Corsair\'s Colours 2', tw: 3, prog: 1, gain: 'Chasing Down Your Bounty +10', rare: 'full speed', fail: 'TW +8, full speed, Groaning Hull', piracy: true },
      ],
    },
    {
      name: 'Crossing Paths',
      where: ['The Sea of Voices'],
      freq: 'Standard',
      opts: [
        { text: 'Hail the ship and have a chat with the captain', tw: -2, prog: 0.5, gain: 'Zee-Ztory 1, Walking the Falling Cities +5' },
        { text: 'Demand to duel the steamer\'s captain', ch: 'Zeefaring 6', need: 'Corsair\'s Colours 2, Flexile Sabre', tw: 3, prog: 1, gain: 'Pieces of Plunder Weighing Down Your Hold 350', rare: 'TW +1, full speed', fail: 'TW +7, half speed', piracy: true },
        { text: 'Steam on by', tw: 4, prog: 1 },
      ],
    },
    {
      name: 'Fury of the Unterzee: Lost but not Alone',
      where: ['The Sea of Voices'],
      freq: 'Standard',
      cardNeeds: 'Troubled Waters 10',
      note: 'Drawn at Troubled Waters 10, on a voyage measured in Approaching Journey\'s End.',
      opts: [
        { text: 'A tapping on the hull', ch: 'Luck 50%', tw: -2, twRange: '-2-6', prog: 0, gain: 'Approaching Journey\'s End +2-6', fail: 'Troubled Waters cleared, no progress, Nightmares +3' },
        { text: 'Avert what comes', need: 'Ostentatious Diamond 20 x, Whispered Hint 100 x', tw: -5, prog: 0, gain: 'Approaching Journey\'s End +2, costs Whispered Hint 100, costs Ostentatious Diamond 20' },
      ],
    },
    {
      name: 'Fury of the Unterzee: Taken',
      where: ['The Sea of Voices'],
      freq: 'Standard',
      cardNeeds: 'Troubled Waters 10',
      note: 'Drawn at Troubled Waters 10, on a voyage measured in Approaching Journey\'s End.',
      opts: [
        { text: 'Oh no', ch: 'Luck 50%', tw: -5, prog: 0, gain: 'Walking the Falling Cities, Approaching Journey\'s End +2', fail: 'Troubled Waters cleared, no progress' },
        { text: 'Use your store of sea-lore', need: 'Zee-Ztory 20 x', tw: 0, prog: 0, gain: 'Approaching Journey\'s End, costs Zee-Ztory 20' },
      ],
    },
    {
      name: 'Listen to the Wind',
      where: ['The Sea of Voices'],
      freq: 'Standard',
      opts: [
        { text: 'Listen to the Voices', ch: 'Luck 50%', hidden: 'Aeolian Sensitivity', tw: 2, twFail: 7, prog: 1, gain: 'Eastern Wind +1, Northern Wind +1, Southern Wind +1, Zee-Ztory 1, Walking the Falling Cities +5', fail: 'TW +7, full speed, Creeping Fear' },
        { text: 'Listen closely to the Voices', ch: 'Luck 60%', need: 'Aeolian Sensitivity', tw: 2, twFail: 7, prog: 1, gain: 'Zee-Ztory 1, Walking the Falling Cities +5, Eastern Wind +1, Northern Wind +1, Southern Wind +1', fail: 'TW +7, full speed, Creeping Fear' },
        { text: 'Steam the way the voices tell you', need: 'A Scholar of the Correspondence 1', tw: 3, prog: 1 },
      ],
    },
    {
      name: 'Meeting a Local Steamer',
      where: ['The Sea of Voices'],
      freq: 'Standard',
      opts: [
        { text: 'Hail the steamer to exchange news', tw: -2, prog: 0.5, gain: 'Zee-Ztory 1, Walking the Falling Cities +5' },
        { text: 'Steam on by', tw: 2, prog: 1 },
        { text: 'I say, must you do that?', need: 'Luxurious', tw: -1, prog: 1, gain: 'Zee-Ztory 4' },
        { text: 'Hail the steamer to exchange news, and let your Boots translate', need: 'Polythremean Captain\'s Boots', tw: 1, prog: 1, gain: 'Zee-Ztory 3, Walking the Falling Cities +5' },
        { text: 'Board her!', ch: 'Persuasive vs Zee Peril', need: 'Corsair\'s Colours 2, Russet Brachiator', tw: 3, prog: 1, gain: 'Pieces of Plunder Weighing Down Your Hold 350', rare: 'TW +2, full speed', fail: 'TW +7, half speed', piracy: true },
      ],
    },
    {
      name: 'The Giant of the Unterzee',
      where: ['The Sea of Voices'],
      freq: 'Standard',
      note: 'The jackpot. A success is a flat Zailing... 80 - an entire direct leg in one action - for Troubled Waters +5. A failure is only half speed and +8.',
      opts: [
        { text: 'Erm, hello?', ch: 'Persuasive vs Zee Peril', tw: 5, prog: 'flat80', fail: 'TW +8, half speed' },
      ],
    },
    {
      name: 'The Iceberg',
      where: ['The Sea of Voices'],
      freq: 'Standard',
      cardNeeds: 'Troubled Waters 4 - 7',
      note: 'Only drawn at Troubled Waters 4-7. With Zubmersibility it is full speed and -2 Troubled Waters.',
      opts: [
        { text: 'Keep a prudent distance', ch: 'Luck 50%', tw: 4, twFail: 8, prog: 1, gain: 'Walking the Falling Cities +5', fail: 'TW +8, no progress, Creeping Fear' },
        { text: 'Have a look around under the iceberg', need: 'Zubmersibility 1 x', tw: -2, prog: 1, gain: 'Zee-Ztory 2, Walking the Falling Cities +5' },
      ],
    },
    {
      name: 'Unfinished Pirates!',
      where: ['The Sea of Voices'],
      freq: 'Standard',
      cardNeeds: 'Troubled Waters 4 - 7',
      note: 'Only drawn at Troubled Waters 4-7.',
      opts: [
        { text: 'Repel Boarders!', ch: 'Dangerous vs Zee Peril', tw: 3, prog: 0.5, gain: 'Zee-Ztory 1', fail: 'TW +9, half speed, Groaning Hull' },
        { text: 'Show them the might of your broadside', ch: 'Zeefaring 7', need: 'Corsair\'s Colours 2', tw: 4, prog: 1, gain: 'Pieces of Plunder Weighing Down Your Hold 350', rare: 'TW +2, full speed', fail: 'TW +8, half speed, Unwelcome on the Waters', piracy: true },
        { text: 'Outpace them', need: 'Zailing Speed 75 x', tw: 4, prog: 1 },
      ],
    },

    // --- The Salt Steppe ---
    {
      name: 'A Chelonite Hunting Ketch',
      where: ['The Salt Steppe'],
      freq: 'Standard',
      note: 'None of these lines make any Zailing progress at all - this is a trading card, not a travelling one.',
      opts: [
        { text: 'Hail them and purchase a bag of assorted bones', need: 'Moon-Pearl 500 x, Shard of Glim 500 x', tw: 0, prog: 0, gain: 'costs Moon-Pearl 500, costs Shard of Glim 500, Fin Bones, Collected 1-9, Withered Tentacle 2-10, Crustacean Pincer 1-5', rare: 'no progress' },
        { text: 'Offer to help a Sharp Hunter', need: 'Chirurgical Touch', tw: 0, prog: 0, gain: 'Crystallised Curio 2' },
        { text: 'Hail them and exchange stories', need: 'Zee-Ztory 10 x', tw: 0, prog: 0, gain: 'costs Zee-Ztory 10, Tale of Terror!! 15, costs Zee-Ztory 10, Extraordinary Implication 3' },
        { text: 'Regale them with tales of your own hunts', need: 'A Notched Bone Harpoon, Tale of Terror!! 10 x', tw: -4, prog: 0, gain: 'costs Tale of Terror!! 10, Moon-Pearl 250, Shard of Glim 250, Fin Bones, Collected 5' },
        { text: 'Open fire!', ch: 'Zeefaring 11', need: 'Corsair\'s Colours 2', tw: 3, prog: 0, gain: 'Pieces of Plunder Weighing Down Your Hold 400', fail: 'TW +6, no progress, Groaning Hull', piracy: true },
        { text: 'Exchange sightings of elusive beasts', ch: 'Monstrous Anatomy 11', need: 'Chasing Down Your Bounty, Corsair\'s Colours 2', tw: 0, prog: 0, gain: 'Chasing Down Your Bounty', fail: 'no progress, Nightmares +2', piracy: true },
      ],
    },
    {
      name: 'A Distant Gleam',
      where: ['The Salt Steppe'],
      freq: 'Standard',
      note: '"Fix a looking-glass on the horizon" first grants Eastern Wind, which starts Upon a Painted Sea in London - the only wind storyline that adds no Nightmares.',
      opts: [
        { text: 'Fix a looking-glass on the horizon', tw: 2, prog: 1, gain: 'Eastern Wind +4, Memory of Distant Shores 5' },
        { text: 'Measure the measureless', ch: 'Artisan of the Red Science 10', need: 'Artisan of the Red Science', tw: 0, prog: 1, men: 'Nightmares +1', gain: 'Extraordinary Implication 1, Eastern Wind +1', fail: 'TW +9, half speed, Nightmares +4' },
        { text: 'Release your Uttermost Eel into the waters', ch: 'Zeefaring 10', need: 'Uttermost Eel 1 x, Zeefaring', tw: 0, prog: 1, men: 'Nightmares +1', gain: 'Eastern Wind +2, Memory of a Much Lesser Self 1', fail: 'TW +9, half speed, Nightmares +3' },
      ],
    },
    {
      name: 'A Khaganian Patrol Vessel',
      where: ['The Salt Steppe'],
      freq: 'Standard',
      opts: [
        { text: 'Give them a wide berth', ch: 'Shadowy vs Zee Peril', tw: 0, prog: 1, fail: 'TW +8, half speed' },
        { text: 'Brazenly hail them', ch: 'Persuasive vs Zee Peril', tw: 0, prog: 0.5, men: 'clears Suspicion -2', fail: 'half speed, Suspicion +3' },
        { text: 'Record their position', need: 'Shrine to Saint Joshua', tw: 0, prog: 0.5, gain: 'Moves in the Great Game [see below]' },
        { text: 'Encode signals to a Subtle Machinist', ch: 'A Player of Chess 7', need: 'Associating with a Youthful Naturalist 510-549, Favour in High Places 1 x', hidden: 'Mechanical Comprehension', tw: 2, prog: 0.5, gain: 'Mechanical Comprehension, Whirring Contraption 20, Nevercold Brass Sliver 5000, Memory of Distant Shores 100', fail: 'TW +2, half speed, Suspicion +2, Unwelcome on the Waters' },
        { text: 'Hail them with their own passphrases', ch: 'A Player of Chess 11', need: 'Chasing Down Your Bounty', tw: 4, prog: 1, gain: 'Chasing Down Your Bounty', fail: 'TW +10, half speed, Unwelcome on the Waters, Suspicion +2', piracy: true },
        { text: 'Man the cannons!', ch: 'Zeefaring 11', tw: 4, prog: 1, men: 'Suspicion +2, Unwelcome on the Waters', gain: 'Pieces of Plunder Weighing Down Your Hold 400', rare: 'TW +3, full speed', fail: 'TW +10, half speed, Suspicion +3, Unwelcome on the Waters', piracy: true },
      ],
    },

    // --- The Pillared Sea ---
    {
      name: 'Becalmed',
      where: ['The Pillared Sea'],
      freq: 'Standard',
      note: '"Cross the threshold" is not a zailing option: it drowns you into Parabola for Wounds +7-8 and sets The Mirror\'s Hunger.',
      opts: [
        { text: 'Shut off every light aboard; full steam ahead!', tw: 2, prog: 1, gain: 'Eastern Wind +1' },
        { text: 'Look into the glassy water', ch: 'Luck 50%', tw: 0, prog: 0.5, men: 'Nightmares +1-4', gain: 'Having Recurring Dreams: Death by Water +1', fail: 'half speed, Nightmares +5' },
        { text: 'Cross the threshold', need: 'Glasswork (Glasswork 5), Access to a Parabolan Base-Camp', hidden: 'The Mirror\'s Hunger', tw: 0, prog: 0 },
      ],
    },
    {
      name: 'Of the Pillars',
      where: ['The Pillared Sea'],
      freq: 'Standard',
      note: 'A Luck 90% for full speed and -2 Troubled Waters. The 10% failure is expensive: +8 Troubled Waters and +8 Nightmares.',
      opts: [
        { text: 'You will look towards her shores', ch: 'Luck 90%', tw: -2, twFail: 8, prog: 1, gain: 'Eastern Wind +1, Northern Wind +1', fail: 'TW +8, full speed, Nightmares +8' },
        { text: 'You will turn your helm away from her', tw: 0, prog: 0.5 },
        { text: 'You will change currency', need: 'Justificande Coin 25 x', tw: 0, prog: 1, gain: 'costs Justificande Coin 25, Oneiromantic Revelation 1' },
      ],
    },
    {
      name: 'Ripples of Future Voyages',
      where: ['The Pillared Sea'],
      freq: 'Standard',
      cardNeeds: 'Corsair\'s Colours 2',
      opts: [
        { text: 'You will remember finding your quarry', ch: 'Zeefaring 12', need: 'Chasing Down Your Bounty', tw: 3, prog: 1, gain: 'Chasing Down Your Bounty +15', fail: 'TW +8, half speed', piracy: true },
        { text: 'You will remember great riches', ch: 'Mithridacy 12', tw: 3, prog: 1, gain: 'Pieces of Plunder Weighing Down Your Hold 450', fail: 'TW +8, half speed', piracy: true },
        { text: 'You will remember your safe return', ch: 'Zailing Speed vs Zee Peril', tw: -2, prog: 1, fail: 'TW +4, full speed', piracy: true },
      ],
    },

    // --- Stormbones ---
    {
      name: 'A Coral Commotion',
      where: ['Stormbones'],
      freq: 'Standard',
      note: '"Find a quicker route into Port Cecil" is one of the two ways to discover Port Cecil.',
      opts: [
        { text: 'Scavenge amidst the scrum of boats', ch: 'Luck 50%', tw: 3, twFail: 8, prog: 0.5, gain: 'Silk Scrap 50', rare: 'TW +2, half speed', fail: 'TW +8, half speed, Creeping Fear' },
        { text: 'Weave through the throng', ch: 'Zailing Speed vs Zee Peril', tw: 3, prog: 1, fail: 'TW +10, full speed, Groaning Hull' },
        { text: 'Find a quicker route into Port Cecil', need: 'Embarking on a Voyage of Scientific Discovery 2', hidden: 'Discovered: The Principles of Coral', tw: 0, prog: 0.5, gain: 'Discovered: The Principles of Coral' },
      ],
    },
    {
      name: 'A Mountain of the Unterzee',
      where: ['Stormbones'],
      freq: 'Standard',
      opts: [
        { text: '"Hard to port! Reverse engines!"', ch: 'Zailing Speed vs Zee Peril', tw: 3, prog: 1, men: 'Silent Stalker', gain: 'Appalling Secret 5', fail: 'TW +10, full speed, Silent Stalker' },
        { text: '"Hold!"', need: 'The Cladery Heart', tw: -1, prog: 0, gain: 'Carved Ball of Stygian Ivory 1' },
      ],
    },
    {
      name: 'A Tiny Coral Island',
      where: ['Stormbones'],
      freq: 'Standard',
      opts: [
        { text: 'Record it and move on', tw: 3, prog: 1 },
        { text: 'What\'s that down there?', need: 'Zubmersibility', tw: -2, prog: 1, gain: 'Appalling Secret 5' },
        { text: 'Recognise its shape', ch: 'Shapeling Arts 3', need: 'Shapeling Arts', tw: 0, prog: 1, gain: 'Shapeling Arts +1 CP, if present, Cryptic Clue 25', fail: 'TW +3, full speed' },
      ],
    },
    {
      name: 'A Wind from the North',
      where: ['Stormbones'],
      freq: 'Standard',
      note: '"Listen to the wind" first grants Northern Wind, which starts Betwixt Us and the Sun in London. It costs +6 Troubled Waters.',
      opts: [
        { text: 'Keep your crew on course', ch: 'Persuasive vs Zee Peril', tw: 0, prog: 1, gain: 'Northern Wind +1', fail: 'TW +12, half speed, Creeping Fear' },
        { text: 'Help them', ch: 'Dangerous vs Zee Peril', tw: 0, prog: 1, gain: 'Northern Wind +1', fail: 'TW +5, half speed, Wounds +5' },
        { text: 'Listen to the wind', tw: 6, prog: 1, gain: 'Northern Wind +3 CP, or +1 CP if already present, Unaccountably Peckish 1' },
      ],
    },
    {
      name: 'Sighting a Lifeberg',
      where: ['Stormbones'],
      freq: 'Standard',
      note: '"Zail quickly past" is full speed for no Troubled Waters; the 2 Nightmares are usually the cheaper price.',
      opts: [
        { text: 'Keep your distance; make observations', ch: 'Watchful vs Zee Peril', tw: 0, prog: 0.5, gain: 'Tale of Terror!! 1, Zee-Ztory 1, Northern Wind +1', fail: 'TW +8, half speed' },
        { text: 'Ram the lifeberg and claim a piece of it!', need: 'A Notched Bone Harpoon', tw: 0, prog: 0, gain: 'Northern Wind +3 CP, or +1 CP if already present, Extraordinary Implication 1' },
        { text: 'Zail quickly past the lifeberg', ch: 'Zailing Speed vs Zee Peril', tw: 0, prog: 1, men: 'Nightmares +2', fail: 'TW +8, no progress, Groaning Hull 1' },
      ],
    },

    // --- The Snares ---
    {
      name: 'A Fellow Mourner',
      where: ['The Snares'],
      freq: 'Standard',
      cardNeeds: 'Corsair\'s Colours 2',
      opts: [
        { text: 'Coordinate with your sister-ship\'s Prophet', ch: 'Dangerous vs Zee Peril', need: 'Chasing Down Your Bounty', tw: 2, prog: 1, gain: 'Chasing Down Your Bounty', rare: 'full speed', fail: 'TW +10, half speed', piracy: true },
        { text: 'Load the cannons!', ch: 'Zeefaring 13', tw: 4, prog: 1, gain: 'Pieces of Plunder Weighing Down Your Hold 500', rare: 'TW +3, full speed', fail: 'TW +10, half speed', piracy: true },
        { text: 'Zail on by', tw: 6, prog: 1, piracy: true },
      ],
    },
    {
      name: 'A Pirate Steamer!',
      where: ['The Snares'],
      freq: 'Standard',
      opts: [
        { text: 'All power to the engines!', ch: 'Shadowy vs Zee Peril', tw: 4, prog: 1, fail: 'TW +18, half speed, Groaning Hull' },
        { text: 'Ready the guns!', ch: 'Dangerous vs Zee Peril', tw: 4, prog: 1, fail: 'TW +16, no progress' },
        { text: 'Flash a pass-sign of the Mourn', ch: 'Zeefaring 13', need: 'Corsair\'s Colours 2, Chasing Down Your Bounty', tw: 2, prog: 1, gain: 'Chasing Down Your Bounty +16', rare: 'TW -2-3, full speed', fail: 'TW +12, a quarter speed', piracy: true },
      ],
    },
    {
      name: 'Navigating the Snares',
      where: ['The Snares'],
      freq: 'Standard',
      note: '"Slow and steady" is half speed for zero Troubled Waters - the safe line, and the reason the Snares can be less punishing than the long way round.',
      opts: [
        { text: 'Slow and steady does it', tw: 0, prog: 0.5 },
        { text: 'You have places to be', ch: 'Shadowy vs Zee Peril', tw: 6, prog: 1, men: 'Mutinous Whispers', fail: 'TW +14, half speed, Groaning Hull' },
        { text: 'Follow a route set by the HMS Ramillies', ch: 'Watchful vs Zee Peril', need: 'The Crew of HMS Ramillies', tw: 6, prog: 1, men: 'Creeping Fear', fail: 'TW +12, half speed, Unwelcome on the Waters' },
      ],
    },
  ];

  // Two of the piracy cards are titled after your quarry -- in game "A
  // Sighting of the (Bounty)" reads "A Sighting of the Screaming Nun" or
  // whatever your target happens to be -- so those match on their opening
  // words instead of the whole name. Everything else matches exactly, through
  // the same punctuation-squashing normaliser the Spite table uses.
  const ZEE_BY_NAME = new Map();
  const ZEE_BY_PREFIX = [];
  for (const card of ZEE_CARDS) {
    if (card.prefix) ZEE_BY_PREFIX.push([normalizeName(card.prefix), card]);
    else ZEE_BY_NAME.set(normalizeName(card.name), card);
  }

  function lookupZeeCard(name) {
    const key = normalizeName(name);
    if (!key) return null;
    const exact = ZEE_BY_NAME.get(key);
    if (exact) return exact;
    for (const pair of ZEE_BY_PREFIX) {
      if (key.indexOf(pair[0] + ' ') === 0) return pair[1];
    }
    return null;
  }

  // How much of your Zailing Speed an option is worth. 'flat80' scores above
  // full speed because 80 is a whole direct leg -- more than any ship's speed.
  function zeeProgScore(prog) {
    if (prog === 'flat80') return 2;
    return typeof prog === 'number' ? prog : 0;
  }

  // What an option costs in Troubled Waters, for ranking purposes.
  //
  // Two deliberate rules here. An option whose change the wiki records as a
  // level ("set to 5") rather than a number of CP scores as 0: we know it is a
  // change but not its size, and inventing one would be worse than ranking it
  // neutrally. And a LUCK challenge is scored on its expected value, because
  // it is the one case where the wiki states both outcomes and the odds: A
  // Spit of Land's island stop buys a point on a success and costs eight on a
  // failure, so quoting the -1 alone would recommend a coin flip that is
  // actually the worse half of the card. A stat challenge gets no such
  // treatment -- the difficulty is your business, not this table's -- so it
  // keeps its success value and the badge's "?" says as much.
  function zeeTwScore(opt) {
    const base = typeof opt.tw === 'number' ? opt.tw : 0;
    const luck = opt.ch && /^Luck (\d+)%$/.exec(opt.ch);
    if (!luck || typeof opt.twFail !== 'number') return base;
    const odds = Number(luck[1]) / 100;
    return odds * base + (1 - odds) * opt.twFail;
  }

  // The line the badge speaks for. Options behind a `need` are left out --
  // their numbers would promise something you may not have -- unless the card
  // has no unconditional line at all, in which case the best gated one is used
  // and `gated` says so.
  //
  // Cheapest Troubled Waters first, more progress only as the tie-break. That
  // is the guide's own framing (its one big table is "cards that do not
  // increase Troubled Waters"), and it is the right way round: almost every
  // line at zee makes full progress anyway, so the number that actually varies
  // between the cards in your hand is what they cost you, and the thing that
  // ends a voyage badly is Troubled Waters reaching 8. Ranking progress first
  // instead would have the badge recommending "You have places to be" in the
  // Snares -- half an action saved for six change points, in the deadliest
  // water in the game. When the cheapest line is also the slow one, the badge
  // says so with its speed mark rather than hiding it.
  //
  // Pure, so the arithmetic behind every badge is testable without a DOM.
  function bestZeeLine(card) {
    const open = card.opts.filter(function (o) { return !o.need && !o.piracy; });
    const pool = open.length ? open : card.opts;
    if (!pool.length) return null;
    let best = pool[0];
    for (const opt of pool) {
      const dt = zeeTwScore(opt) - zeeTwScore(best);
      if (dt < 0 || (dt === 0 && zeeProgScore(opt.prog) > zeeProgScore(best.prog))) best = opt;
    }
    return { opt: best, gated: !open.length };
  }

  // Is there a cheaper line on this card that the badge deliberately refused
  // to quote, because it is gated on an item, a quality or piracy? That is the
  // other half of the question. The Killing Wind is the case this exists for:
  // what the badge can offer you is a coin flip that costs +4 on a success and
  // +12 on a failure, while a Zubmarine turns the same card into -2 at full
  // speed. The badge will not promise you a submarine, but it can point at the
  // tooltip.
  function zeeHasBetterGated(card, chosen) {
    return card.opts.some(function (o) {
      return o !== chosen && (o.need || o.piracy) && zeeTwScore(o) < zeeTwScore(chosen);
    });
  }

  const ZEE_CLASS = 'fl-ux-zee';
  const ZEE_FLAG = 'flUxZee';

  // Colours read as a cost, not a rating: green is cheap, red is expensive,
  // and the black cards get the dark green of their own sinister border
  // whatever their numbers say, because what matters about them is that they
  // are blocking your hand.
  const ZEE_URGENT_COLOR = '#25493a';
  const ZEE_UNKNOWN_COLOR = '#5b5b5b';
  function zeeColor(tw) {
    if (typeof tw !== 'number') return ZEE_UNKNOWN_COLOR;
    if (tw <= -2) return '#2f6b3f';
    if (tw <= 0) return '#4a7a3c';
    if (tw <= 2) return '#7a733a';
    if (tw <= 4) return '#8a6d3b';
    if (tw <= 7) return '#a1622c';
    return '#8a3b3b';
  }

  const ZEE_SPEED_MARK = { 0.5: '½', 0.25: '¼', 0: '·' };
  const ZEE_GATED_MARK = '▾';

  function zeeSpeedWord(prog) {
    if (prog === 'flat80') return 'a flat Zailing… 80, whatever your ship';
    if (prog === 1) return 'full Zailing Speed';
    if (prog === 0.5) return 'half Zailing Speed';
    if (prog === 0.25) return 'a quarter of Zailing Speed';
    return 'no progress';
  }

  function zeeTwWord(opt) {
    if (opt.twText) return opt.twText;
    if (typeof opt.tw !== 'number') return 'Troubled Waters unrecorded';
    const value = opt.twRange || (opt.tw > 0 ? '+' + opt.tw : String(opt.tw));
    return opt.tw === 0 ? 'no Troubled Waters' : 'Troubled Waters ' + value + ' CP';
  }

  function zeeOptionLine(opt) {
    const bits = [opt.text];
    if (opt.ch) bits.push('[' + opt.ch + ']');
    if (opt.need) bits.push('(needs ' + opt.need + ')');
    if (opt.hidden) bits.push('(hidden while: ' + opt.hidden + ')');
    let line = '  • ' + bits.join(' ') + '\n      ' + zeeTwWord(opt) + ', ' + zeeSpeedWord(opt.prog);
    if (opt.men) line += ', ' + opt.men;
    if (opt.gain) line += '\n      gives: ' + opt.gain;
    if (opt.note) line += '\n      ' + opt.note;
    if (opt.rare) line += '\n      rare success: ' + opt.rare;
    if (opt.fail) line += '\n      failure: ' + opt.fail;
    return line;
  }

  // What to draw for a card. Kept pure (card in, { text, color, title } out)
  // so the whole badge can be asserted on without a browser.
  function zeeBadgeSpec(card) {
    const best = bestZeeLine(card);
    if (!best) {
      return {
        text: '?',
        color: ZEE_UNKNOWN_COLOR,
        title: card.name + '\n' + (card.note || 'No options transcribed for this card.'),
      };
    }
    const opt = best.opt;
    const mark = ZEE_SPEED_MARK[opt.prog] || (opt.prog === 'flat80' ? '★' : '');
    const value = typeof opt.tw !== 'number' ? '→' : (opt.tw > 0 ? '+' + opt.tw : String(opt.tw));
    const text = mark + value + (opt.ch ? '?' : '') + (zeeHasBetterGated(card, opt) ? ZEE_GATED_MARK : '');

    const lines = [card.name];
    lines.push((card.where.indexOf('any') !== -1 ? 'Anywhere at zee' : card.where.join(' / '))
      + ' · ' + card.freq + (card.urgent ? ' · URGENT: dealt before every other zee card' : ''));
    if (card.cardNeeds) lines.push('In your deck while: ' + card.cardNeeds);
    if (card.note) lines.push(card.note);
    lines.push('');
    lines.push('Best line without anything special in hand'
      + (best.gated ? ' — there is none, so this one is gated:' : ':'));
    // The menaces go in the headline too, not only in the list below it. The
    // badge speaks about Troubled Waters and nothing else, so a line that is
    // cheap in Troubled Waters and expensive in Nightmares (Becalmed's, for
    // one) would otherwise read as free right where you are most likely to
    // stop reading.
    lines.push('  ' + opt.text + ' — ' + zeeTwWord(opt) + ', ' + zeeSpeedWord(opt.prog)
      + (opt.men ? ', ' + opt.men : '')
      + (opt.ch ? ' (on a success of ' + opt.ch + ')' : ''));
    if (zeeHasBetterGated(card, opt)) {
      lines.push('  ' + ZEE_GATED_MARK + ' a cheaper line exists here, behind something you may or may not have — see below.');
    }
    lines.push('');
    lines.push('Every option:');
    for (const o of card.opts) lines.push(zeeOptionLine(o));
    lines.push('');
    lines.push('Zee cards cannot be discarded. Troubled Waters resets at a safe dock; at 8 it kills you.');
    return { text: text, color: card.urgent ? ZEE_URGENT_COLOR : zeeColor(opt.tw), title: lines.join('\n') };
  }

  // The area gate, and it is a weaker one than the Crowds of Spite feature's
  // on purpose. That gate rests on a greeting captured verbatim in-game; this
  // list is a GUESS at what the same greeting says at zee, assembled from the
  // region names the wiki uses. So it only ever says "yes, definitely a zee
  // region" or "can't tell" -- never "no" -- and the card table stays the real
  // scope, exactly as the Spite feature started out.
  //
  // If a greeting from a real voyage is ever captured, this can be tightened
  // into an exact list the way SPITE_AREAS was.
  const ZEE_AREAS = [
    'The Broad Unterzee', 'The Unterzee', 'Zailing the Unterzee',
    'Home Waters', "Shepherd's Wash", 'The Sea of Voices',
    'The Salt Steppe', 'The Salt Steppes', 'The Pillared Sea',
    'Stormbones', 'The Snares',
  ].map(normalizeName);

  function inZee() {
    const area = normalizeName(currentArea());
    return !!area && ZEE_AREAS.indexOf(area) !== -1;
  }

  // One card is named "The Sound of Wings" and Fallen London deals a different
  // card of that same name in eight other places, so that one waits until the
  // area confirms we are at zee. Everything else is scoped by its name alone.
  function zeeCardFor(name) {
    const card = lookupZeeCard(name);
    if (!card) return null;
    if (card.strictZee && !inZee()) return null;
    return card;
  }

  function zeeCardRatings() {
    eachCardName(function (host, name, place, style) {
      const card = zeeCardFor(name);
      attachBadge(host, {
        cls: ZEE_CLASS,
        flag: ZEE_FLAG,
        value: name,
        spec: card ? zeeBadgeSpec(card) : null,
        place: place,
        style: style,
      });
    });
  }

  // === feature: Fruits of the Zee Festival card ratings ==================
  //
  // Rates the opportunity cards you draw while wreck-diving at the Fruits of
  // the Zee Festival (Mutton Island, the first weeks of September).
  //
  // The festival is two weeks and the cards belong to the first one. You raise
  // Fivefold Devotion on the shore, then dive from The Fishing Boats, Empty;
  // each card in the hand offers ONE treasure you may claim, and "Dive deeper"
  // is free but ends the dive if it fails. In the second week you trade what
  // you hauled up for Thalassic Favour and spend that on equipment. So a card
  // is worth two different things at once, and the badge says both:
  //
  //   * its TRADE-IN VALUE -- the Thalassic Favour the treasure is worth at
  //     the Fruit Market, which is what pays for everything in week two; and
  //   * whether it is a RARE ITEM you do not own yet -- the five corals, each
  //     of which trades for one of three unique pieces of equipment, and the
  //     six pieces of equipment from festivals past that only turn up while
  //     diving. Those are the reason to keep diving once the Favour is banked,
  //     and which of them you are still missing is the whole point of the
  //     Fruits of the Zee panel further down.
  //
  // THE AWKWARD PART IS DEPTH. Almost every value here depends on Full Fathom
  // Five -- A Cabin-Fragment pays 50 Favour at depth 1 and 400 at depth 5, and
  // A Shattered Prow offers a Nuncian Pocket Watch at depths 2-4 but the
  // Scrimshander Carving Knife only at 5 -- so a badge that ignored depth
  // would be quoting the wrong number most of the time. `fotzDepth` is
  // therefore three-tiered (see it below): a live read of the quality if FL
  // happens to be rendering it, a depth you set yourself in the panel, or
  // nothing -- and with nothing the badge shows the RANGE across the depths
  // and says so, rather than picking a number it cannot justify. Same rule as
  // everywhere else here: never state a figure we can't stand behind.
  //
  // Everything below is transcribed from Fruits of the Zee Festival (Guide),
  // its /Item Comparison subpage, and the individual card and option pages on
  // the Fallen London wiki. Corrections go in these tables and nowhere else.
  //
  // **Re-read the guide, don't trust a copy of it.** The wiki gains this
  // year's content as the festival runs, and it did so twice in a week:
  //
  //   2026-09-03  A Graveyard of Derelict Debris and its Rust-Eaten Ration
  //     were added to the guide's own card table within a day of this being
  //     transcribed, and the first anyone knew of it was a card turning up
  //     unbadged in a real hand.
  //   2026-09-10  week two opened and the Ration's three Luggage were named,
  //     clearing the last `pending` entry in these tables. Re-reading for that
  //     also turned up two Fate prices the guide's Item Comparison table had
  //     never corrected -- see FOTZ_CORALS.
  //
  // When a card comes up unbadged, the guide is the first place to look, not
  // the last; and when a week of the festival turns over, re-read it whether
  // anything looks wrong or not.

  // Which of the three versions of a coral item you get is NOT random, which
  // is the single most useful thing on this page: it is decided by Sights at
  // the Festival at the moment you break the coral open. Verified on all six
  // option pages (Offer the King your <coral>), which each list three
  // outcomes:
  //
  //   Sights  1- 33 -> the Itinerant Zubmariner's stock ("above and below the
  //                    zee" -- Saviour's Rocks, Rosegate, the Corsair's Forest)
  //   Sights 34- 66 -> the Pirate-Poet's stock (Gaider's Mourn)
  //   Sights 67-100 -> the Enigmatic Angler's stock (Irem)
  //
  // and the three traders in The Fruit Market swap coral items like-for-like,
  // each handing out the band that is theirs and accepting the other two. So a
  // variant you are missing has two routes: break a coral while Sights is in
  // its band, or trade a duplicate to that band's trader. Note that breaking
  // coral open re-rolls Sights, so you cannot line up two in a row.
  //
  // The guide's own summary table lists the three variants in a different
  // order for several of the corals. The option pages win, per the usual rule.
  const FOTZ_BANDS = [
    { lo: 1, hi: 33, trader: 'the Itinerant Zubmariner' },
    { lo: 34, hi: 66, trader: 'the Pirate-Poet' },
    { lo: 67, hi: 100, trader: 'the Enigmatic Angler' },
  ];

  // The six corals. Each is claimed from one card at any depth, and traded
  // (An Audience with the King-in-Coral -> Present him with a shard of coral)
  // for one of three items that are mechanically identical to each other.
  //
  // `fate` is what the King-in-Coral's Hoard charges for one of the three, and
  // it comes from the HOARD OPTION PAGES (`Fate Cost`), not from the guide's
  // Item Comparison table. The two disagree on two of the corals -- the table
  // still prices the Grasping Coral gloves at 30 when every one of the three
  // option pages says 10, and prices the Gorgonian Reef-Rock's clothing at
  // nothing at all when the Hoard sells all three for 20 -- and the option
  // page wins here as it does everywhere else in this file.
  const FOTZ_CORALS = [
    {
      coral: 'Barnacled Headpiece', card: 'Among the Deep-Fish', slot: 'Hat', fate: 30,
      variants: ['Aria of Tranquillity', 'Crab-Clawed Tricorne', 'Peaceable Cowl'],
      bis: 'Strict best-in-slot for Troubled Waters reduction.',
    },
    {
      coral: 'Gorgonian Reef-Rock', card: 'A Rusting Anchor', slot: 'Clothing', fate: 20,
      variants: ['Concealing Skirt', 'Henchman’s Greatcoat', 'Obscurant’s Shawl'],
    },
    {
      coral: 'Grasping Coral', card: 'A Reef of Wrecks', slot: 'Gloves', fate: 10,
      variants: ['Gossamer Palms', 'Mournclimber’s Wraps', 'Loomweavers'],
      bis: 'Shared best-in-slot with the Bazaar’s Pair of Lenguals.',
    },
    {
      coral: 'Pedestrian Polyp', card: 'Old Wounds', slot: 'Boots', fate: 15,
      variants: ['Scrimshaw Sabatons', 'Bright-Buckled Boots', 'Riddlefisher’s Footsteps'],
    },
    {
      coral: 'Spinebound Oddity', card: 'An Obscured Glitter', slot: 'Adornment', fate: 20,
      variants: ['‘Rosegate Blend’ Roll-ups', 'Mourning Locket', 'Justificande Cufflinks'],
      bis: 'Strict best-in-slot for Shadowy.',
    },
    // THIS YEAR'S NEW ONE, and the reason to re-read the guide rather than
    // trusting a transcription taken a day earlier: it was added to the wiki
    // between the two (found 2026-09-03, after a card in a real hand came up
    // unbadged). Its three Luggage were then WITHHELD until week two -- the
    // guide's own table said "(Coming in week 2)" three times under an
    // `{{Incomplete}}` banner -- so `variants` stayed null rather than being
    // guessed at, and everything downstream had to cope with not knowing them.
    //
    // Published 2026-09-10, when week two opened. The names and the band each
    // one belongs to are taken from the option page, Offer the King your
    // Rust-Eaten Ration, which states all three outright -- not from the
    // guide's summary table, though the two agree here. Dangerous +2 and
    // Monstrous Anatomy +1, per the item pages.
    //
    // The `pending` machinery is deliberately LEFT IN even though nothing uses
    // it now: a coral whose items are not published is the normal state of the
    // festival's first week, and next year's new one will need it again.
    {
      coral: 'Rust-Eaten Ration', card: 'A Graveyard of Derelict Debris', slot: 'Luggage',
      fate: null,
      variants: ['Accomodating Oyster', 'Sentient Zee-Chest', 'Fateful Net'],
    },
  ];

  // --- week one, before the diving: Supplication on the Shore ------------
  //
  // You cannot dive at all below Fivefold Devotion 5, and how much higher you
  // go decides how deep you can get. Devotion comes from one storylet,
  // Supplication on the Shore, whose five options are worth **exactly the same
  // 4 CP each** -- so the only thing that separates them is which base
  // attribute the economy item scales off, and which item that is. Pick the
  // one matching your best stat; there is no other consideration.
  //
  // **You do not get to choose freely**, which is the thing the guide's table
  // does not tell you and a capture of the live storylet does: every option is
  // gated on a window of *Airs of a Barren Zee*, and Airs is re-rolled by the
  // action you just took. Typically two of the five are on offer at a time. So
  // the useful question is not "which is best" but "which of the ones in front
  // of me right now matches my best stat" -- and that is a question you have
  // while looking at the storylet, not while reading a table, which is why
  // these get badged in the game as well as listed in the panel.
  //
  // The windows and the ids come from the five option pages; the two the game
  // showed with a requirement icon (Airs 60-100 and "outside 21-79") agree
  // with them exactly, which is the check that they are real.
  //
  // The four attributes, with a glyph apiece. `color` is for text on the
  // panel's dark ground, `badge` for white text on a filled badge -- the same
  // hue at two weights, since one value cannot do both legibly. The stat's
  // name is always rendered beside the glyph, so a font without the emoji
  // loses nothing.
  const FOTZ_STATS = {
    Watchful: { icon: '👁', color: '#6f9fd8', badge: '#3d6591' },
    Shadowy: { icon: '🗝', color: '#9b83c9', badge: '#5f4b8b' },
    Dangerous: { icon: '⚔', color: '#c2645a', badge: '#8f3f36' },
    Persuasive: { icon: '🎭', color: '#c9a04a', badge: '#8a6420' },
  };

  const FOTZ_SUPPLICATION = [
    {
      text: 'Construct toy boats to scuttle on the reef', id: 259469,
      gain: 'Zee-Ztory', stat: 'Shadowy', airs: '0–40',
    },
    {
      text: 'Sacrifice landed victuals to the zee', id: 259492,
      gain: 'Cryptic Clue', stat: 'Watchful', airs: '20–60',
    },
    {
      text: 'Gather flotsam for the King-in-Coral', id: 259493,
      gain: 'Memory of Distant Shores', stat: 'Watchful', airs: '40–80',
      note: 'Memories turn in 40 at a time with 2 Sworn Statements, which is what makes '
        + 'this the option to take if you are also grinding Skulls in Coral in Jericho Locks.',
    },
    {
      text: 'Perform in a Mutton Island mystery play', id: 259494,
      gain: 'Maniac’s Prayer', stat: 'Persuasive', airs: '60–100',
    },
    {
      text: 'Assist in the preparation of a well-rite', id: 259531,
      gain: 'Tale of Terror!!', stat: 'Dangerous', airs: '0–20 or 80+',
    },
  ];

  // The other two branches on the same storylet. Neither raises Devotion by
  // the usual 4, so neither belongs in the table above -- but both are on
  // screen beside the ones that do, and an unlabelled option next to labelled
  // ones reads as an oversight. `strict` on the Chef because his name is the
  // one here generic enough to belong to some other storylet.
  const FOTZ_SUPPLICATION_OTHER = [
    {
      text: 'Speak to the Custodial Chef', id: 259471, strict: true,
      badge: 'free', note: 'Costs no action and gives nothing: the Chef opening proceedings.',
    },
    {
      text: 'Seek out one of the Fathomking’s servants', id: 259496,
      badge: '7 Fate', warn: true,
      note: 'Sets Fivefold Devotion straight to 11, the cap — which is otherwise 17 '
        + 'supplications. Quoted from the game’s own description of the branch.',
    },
  ];

  const FOTZ_BRANCHES = FOTZ_SUPPLICATION.concat(FOTZ_SUPPLICATION_OTHER);

  const FOTZ_BRANCH_BY_NAME = new Map(
    FOTZ_BRANCHES.map(function (o) { return [normalizeName(o.text), o]; }));

  function lookupFotzBranch(name) {
    return FOTZ_BRANCH_BY_NAME.get(normalizeName(name)) || null;
  }

  // Every option, every time. There is no variation to model.
  const FOTZ_DEVOTION_CP = 4;

  // Fivefold Devotion is a pyramidal quality: going from level n to n+1 costs
  // n+1 CP, so reaching L costs L(L+1)/2 altogether. At 4 CP an action that is
  // 4 actions to the minimum of 5 and 17 to the cap of 11 -- and a dive itself
  // is 2 more (one to leave the boat, one to claim the treasure).
  //
  // Pure, and worth being pure: the whole ladder is checked against the
  // guide's own table, which reads 5 (6 Act) through to 11 (19 Act).
  function fotzDevotionCP(level) {
    return (level * (level + 1)) / 2;
  }

  function fotzDevotionLadder() {
    const rows = [];
    for (let level = 5; level <= 11; level++) {
      const actions = Math.ceil(fotzDevotionCP(level) / FOTZ_DEVOTION_CP);
      rows.push({ level: level, cp: fotzDevotionCP(level), actions: actions, dive: actions + 2 });
    }
    return rows;
  }

  // How many more supplications from where you are now. `from` may be null --
  // we then have no idea, and neither does the caller. It is an upper bound
  // either way: FL shows the level but not the change points inside it, so
  // this assumes you have just this moment arrived at `from`.
  function fotzActionsToDevotion(from, to) {
    if (from == null || from >= to) return 0;
    return Math.ceil((fotzDevotionCP(to) - fotzDevotionCP(from)) / FOTZ_DEVOTION_CP);
  }

  // Where to stop, and how deep to go once you are there.
  //
  // **From a comment on the guide** -- cs-comment-99376, by the player whose
  // Monte Carlo produced the Favour-per-action figures the guide itself
  // quotes. It models the festival the way it is actually played: four
  // collecting STAGES and then a Favour grind, each stage pairing a Devotion
  // with the depth that pays the items still outstanding. Verbatim:
  //
  //   1) Get all your corals with 5 Devotion 1 depth. If you don't get the
  //      coral you want, 100 favours is a decent FPA but rerolling with a 50%
  //      dive is a good option too + pick up Jillyfleur here too.
  //   2) 8 devotion depth 2, if not then "reroll" 90% to depth 3 until
  //      Wrecking boots + Nuncian watch (or maybe devotion 9 for Nuncian watch
  //      if it's really evading you).
  //   3) 10 devotion depth 4 until Mary Lloyd + Effluvia; if at depth 4 you get
  //      terrible pickings, go depth 5 and maybe pick up Scrimshander instead.
  //   4) 11 devotion depth 5 until Scrimshander (worst case do storylet or pick
  //      up max favours if you don't see it).
  //   5a) The expected return optimal strategy = Devotion 9 = 15.4 FPA
  //   5b) 10 devotion depth 3-5 = 14.6 FPA
  //   5c) 11 devotion, 14.3 FPA, 0% drowning.
  //
  // This replaced a ladder keyed on the coral count alone (5/7/8/10, and
  // nothing at all to say about the six dive-only items), which had no source
  // but a reading of the guide's prose.
  //
  // The stages are ordered, and the FIRST one with anything outstanding wins.
  // That falls out right for the shallow-only items without a special case:
  // the Jillyfleur Cloak is depths 1-2 and sits in stage 1, so it is collected
  // while you are still up there rather than thrown away by a deeper dive.
  const FOTZ_DIVE_PLAN = [
    { stage: 1, level: 5, depth: 1, corals: true, items: ['A Cured Jillyfleur Cloak'] },
    { stage: 2, level: 8, depth: 2, items: ['Wrecking Boots', 'Nuncian Pocket Watch'] },
    {
      stage: 3, level: 10, depth: 4,
      items: ['Semi-Automated Mary Lloyd', 'A Faceted Decanter of Drownie Effluvia'],
    },
    { stage: 4, level: 11, depth: 5, items: ['Scrimshander Carving Knife'] },
  ];

  // The three the comment simulated, best first. `depth` is quoted only where
  // it quoted one: Devotion 9 is given as a Devotion, not as a depth, and
  // inventing one for it would be putting a number in the comment's mouth.
  const FOTZ_FAVOUR_RUN = [
    { level: 9, depth: null, fpa: 15.4, note: 'the expected-return optimum' },
    { level: 10, depth: '3–5', fpa: 14.6, note: null },
    { level: 11, depth: 5, fpa: 14.3, note: 'and never drowns' },
  ];

  // "depth 5" but "depths 3-5": the Favour run quotes one of each.
  function fotzDepthPhrase(depth) {
    return (typeof depth === 'number' ? 'depth ' : 'depths ') + depth;
  }

  function andList(names) {
    if (names.length < 2) return names[0] || '';
    return names.slice(0, -1).join(', ') + ' and ' + names[names.length - 1];
  }

  // `wants` is { corals, items }: how many corals are still worth diving for
  // (null when Possessions have never been read) and the dive-only equipment
  // you have not got. Pure, so the whole plan is testable without a DOM.
  function fotzDiveAdvice(wants) {
    const corals = wants && wants.corals != null ? wants.corals : 0;
    const items = (wants && wants.items) || [];
    for (const plan of FOTZ_DIVE_PLAN) {
      const here = items.filter(function (n) { return plan.items.indexOf(n) !== -1; });
      const wantsCorals = !!plan.corals && corals > 0;
      if (!wantsCorals && !here.length) continue;

      let why;
      if (plan.stage === 1) {
        why = (wantsCorals
          ? corals + (corals === 1 ? ' coral' : ' corals') + ' still to dive up, and they '
            + 'turn up at every depth — so dive as cheaply and as often as you can. A '
            + 'poor draw is still 100 Favour, and rerolling with a 50% dive is fine.'
          : '')
          + (here.length
            ? (wantsCorals ? ' ' : '') + andList(here) + ' is depths 1–2, so take it '
              + 'while you are still up here — a deeper dive throws it away.'
            : '');
      } else if (plan.stage === 2) {
        why = andList(here) + ' next: dive to 2, and reroll on to 3 (about 90% of the time) '
          + 'when the draw is poor. If the Watch keeps evading you, 9 buys some consistency.';
      } else if (plan.stage === 3) {
        // Only offer the Knife as the consolation while it still IS one:
        // sending someone deep for a thing already in their hold is noise.
        const knife = 'Scrimshander Carving Knife';
        why = andList(here) + ': dive to 4, and on terrible pickings carry on to 5 '
          + (items.indexOf(knife) !== -1
            ? 'and take the ' + knife + ' instead.'
            : 'and take the Favour instead.');
      } else {
        why = andList(here) + ' only, and it is depth 5 and nowhere else. Worst case, take '
          + 'the storylet or the biggest Favour on the table.';
      }
      return {
        stage: plan.stage, level: plan.level, depth: plan.depth,
        corals: wantsCorals ? corals : 0, items: here, why: why,
      };
    }

    const best = FOTZ_FAVOUR_RUN[0];
    return {
      stage: 5, level: best.level, depth: best.depth, corals: 0, items: [],
      alternatives: FOTZ_FAVOUR_RUN,
      why: 'Nothing left to collect, so this is a Favour run. The comment’s simulation '
        + 'puts Devotion ' + best.level + ' ahead at ' + best.fpa + ' Favour per action, '
        + 'against ' + FOTZ_FAVOUR_RUN.slice(1).map(function (alt) {
          return alt.fpa + ' at ' + alt.level
            + (alt.depth ? ' (' + fotzDepthPhrase(alt.depth) + ')' : '');
        }).join(' and ') + ' — the last of which never drowns you.',
    };
  }

  // Pure economy treasure: worth nothing but the Favour it trades for. These
  // are the Fruit Market's numbers (Treasures to Trade), which are also what
  // the diving table's "Total Favour Value" column adds up to.
  const FOTZ_TREASURES = [
    { name: 'Witch-Stone', favour: 10 },
    { name: 'Collection of Zee-Glass', favour: 20 },
    { name: 'Salt-Smoothed Shiv', favour: 50 },
    { name: 'Sodden Mass', favour: 100 },
    {
      name: 'Skull in Coral', favour: 125,
      note: 'Also a usable Osteology skull, and the one treasure that survives the '
        + 'end of the festival. Limited to ten trade-ins.',
    },
    {
      name: 'Urchin Spine', favour: 125,
      note: 'Replaces Skull in Coral once ten have been received.',
    },
    { name: 'Long-Lost Zee Trunk', favour: 200 },
  ];

  // The six pieces of equipment from festivals past that turn up while diving.
  // `favour` is what trading a DUPLICATE back pays; `stall` is what buying one
  // at the Island Stalls costs in week two -- always the cheaper of the two,
  // which is the argument for diving them up rather than buying them.
  const FOTZ_EQUIPMENT = [
    {
      name: 'A Cured Jillyfleur Cloak', slot: 'Clothing', card: 'Well-Disguised Trinkets',
      depths: [1, 2], favour: 100, stall: 50, fate: 10,
      note: 'Early-game; outclassed by Far Khanate Lacquered Armour. Unlocks one of '
        + 'several ways into the Clay Tailor Club.',
    },
    {
      name: 'Wrecking Boots', slot: 'Boots', card: 'Tangled in the Rigging',
      depths: [2, 3], favour: 100, stall: 50, fate: 10,
      note: 'Early-game, no uses; a peer of the Bazaar’s Pair of Ratskin Boots.',
    },
    {
      name: 'Nuncian Pocket Watch', slot: 'Weapon', card: 'A Shattered Prow',
      depths: [2, 4], favour: 150, stall: 75, fate: 10,
      bis: 'Shared best-in-slot for Respectable.',
      note: 'Unlocks Hillchanger Tower options in Ealing Gardens and the Railway.',
    },
    {
      name: 'Semi-Automated Mary Lloyd', slot: 'Transport', card: 'Tangled in the Rigging',
      depths: [4, 5], favour: 200, stall: 100, fate: 30,
      bis: 'Strict non-Fate, non-Hellworm best-in-slot for BDR.',
    },
    {
      name: 'A Faceted Decanter of Drownie Effluvia', slot: 'Weapon',
      card: 'Well-Disguised Trinkets', depths: [3, 5], favour: 300, stall: 150, fate: 5,
      note: 'Unlocks Cure the ignorance of your zailors while Zailing — Troubled Waters '
        + 'down on a Kataleptic Toxicology check, and progress with it.',
    },
    {
      name: 'Scrimshander Carving Knife', slot: 'Weapon', card: 'A Shattered Prow',
      depths: [5, 5], favour: 400, stall: 200, fate: 5,
      note: 'No stats. Unlocks Carve away some evidence of age, which removes '
        + 'Skeleton: Antiquity.',
    },
  ];

  // Week two only: the Island Stalls, for Thalassic Favour. Nothing here can be
  // dived for. The prices are the stall table's in the guide; where the Item
  // Comparison page disagrees (it says 250 for the Lamp-cat, 30 Fate for the
  // Guinea-Pig) the price list is what this follows.
  const FOTZ_STALL = [
    {
      name: 'A Submerged Rector', slot: 'Companion', favour: 100, fate: 15,
      note: 'Early-game Persuasive companion. Unlocks options in the Upper River, the '
        + 'Evenlode and Burrow-infra-Mump.',
    },
    {
      name: 'Keelgraspers', slot: 'Gloves', favour: 150, fate: 10,
      bis: 'Shared best-in-slot for BDR.',
    },
    {
      name: 'Sun-Seared Silken Gloves', slot: 'Gloves', favour: 150, fate: 10,
      bis: 'Shared best-in-slot for A Player of Chess and for BDR.',
    },
    {
      name: 'Inquisitive Lamp-cat', slot: 'Companion', favour: 200, fate: 15,
      note: 'Unremarkable now, but its Hallowmas upgrade (Feline Pariah) is shared '
        + 'best-in-slot for Monstrous Anatomy and Shadowy.',
    },
    {
      name: 'The Forsaken Crown of a Grand Devil', slot: 'Hat', favour: 250, fate: 30,
      bis: 'Shared best-in-slot for Artisan of the Red Science.',
    },
    {
      name: 'Corpulent Carriage', slot: 'Transport', favour: 250, fate: 30,
      bis: 'Shared best-in-slot for Monstrous Anatomy.',
    },
  ];

  // The four festival ships, bought with your current ship plus Favour. The
  // 500-1920 spread is which class you are trading in: a Zubmarine, a Majestic
  // Pleasure Yacht or another festival ship brings every one of these to 500.
  const FOTZ_SHIPS = [
    {
      name: 'Obstinate-class Cruiser', slot: 'Ship', peer: 'Rusty Tramp Steamer', fate: 20,
      note: 'The only ship that reduces Troubled Waters, and it adds Dangerous and Dreaded.',
    },
    {
      name: 'Ogedei-class Liner', slot: 'Ship', peer: 'Swift Zee-Clipper', fate: 20,
      note: 'As fast as the Clipper, plus Dangerous and Dreaded.',
    },
    {
      name: 'Nyx-class Zubmersible', slot: 'Ship', peer: 'Zubmarine', fate: 20,
      note: 'A Shadowy, Dreaded Zubmarine.',
    },
    {
      name: 'Il-Altun-class Yacht', slot: 'Ship', peer: 'Majestic Pleasure Yacht', fate: 20,
      note: 'The Yacht, plus Persuasive.',
    },
  ];

  // Reaching the bottom of the trench reveals Her Fivefold Symmetry, and
  // begging audience there earns the Accomplishment. In week two that is what
  // lets the King-in-Coral hand the Litter-Cyst over.
  const FOTZ_BRIDE_QUALITY = 'Discovered: the Pentamerous Bride';
  const FOTZ_BRIDE_ITEMS = [
    {
      name: 'Weeping Litter-Cyst', slot: 'Transport',
      how: 'Dive to Full Fathom Five 5, beg audience with the Pentamerous Bride, then '
        + 'Accept a briny gift from the King-in-Coral in week two.',
      bis: 'Shared best-in-slot for Zeefaring.',
    },
    {
      name: 'Nodule of Fecund Amber', slot: null,
      how: 'Accept a fecund gift instead — offered only once you already hold the '
        + 'Litter-Cyst from a previous festival.',
      note: 'Not equipment: a Most Valuable rubbery item, sells for 312.50.',
    },
  ];

  // Fate-only, from the King-in-Coral's Hoard. Listed so the checklist is
  // honest about being a complete roster, but never counted as "missing":
  // these cost money rather than actions, and several are obtainable elsewhere.
  const FOTZ_FATE_ITEMS = [
    { name: 'Pre-Emptive Guinea-Pig', slot: 'Weapon', fate: 20 },
    { name: '‘For Your Own Good’ Compass', slot: 'Weapon', fate: 15 },
    {
      name: 'Mutersalt', slot: 'Weapon', fate: 15,
      note: 'Also free during the Railway, from the Liberationist marshland track.',
    },
    {
      name: 'Consignment of Scintillack Snuff', slot: 'Weapon', fate: 10,
      note: 'Don’t buy it here — get it from Balmoral and research the recipe.',
    },
    {
      name: 'Viscountess’ Bejewelled Collar', slot: 'Adornment', fate: 10,
      note: 'Also from the Sacroboscan Calendar.',
    },
    {
      name: 'Viscount’s Bejewelled Collar', slot: 'Adornment', fate: 10,
      note: 'Also from the Sacroboscan Calendar.',
    },
    {
      name: 'Bloodstained Eolith', slot: null, fate: 15,
      note: 'Also a rare failure when disambiguating Eoliths in your lab.',
    },
    {
      name: 'Sinning Jenny’s Forsaken Wimple!', slot: 'Hat', fate: null,
      note: 'A different item from Sinning Jenny’s Forsaken Wimple, for reasons known '
        + 'only to Failbetter.',
    },
  ];

  // Pure Favour-to-Echoes conversions at the stalls: a guaranteed E0.1 per
  // Favour, which is the floor every other use of Favour is judged against.
  const FOTZ_ECONOMY = [
    { name: 'Oneiric Pearl', favour: 625 },
    { name: 'Baited Riddle', favour: 625 },
    { name: 'Vestige of a Starlit Reverie', favour: 3125 },
    { name: 'Sample of Lacreous Affection', favour: 3125 },
  ];

  // The qualities worth reading off the Myself tab for this festival. Every
  // one is a real quality (checked on the wiki), not an item -- Thalassic
  // Favour included, which is why it is absent from the possessions scrape.
  const FOTZ_QUALITIES = [
    'Thalassic Favour',
    'Fivefold Devotion',
    'Full Fathom Five',
    'Sights at the Festival',
    'A Fruitless Harvest',
    // Decides which supplication options you are offered, and is re-rolled by
    // every one you take.
    'Airs of a Barren Zee',
    FOTZ_BRIDE_QUALITY,
  ];

  // --- the card table ----------------------------------------------------
  //
  // One entry per card in the diving deck, plus the storylet at the bottom of
  // the trench. Each `opts` entry is one claim you can make and the depths it
  // is offered at, so "what can I take from this card at depth 3" is a filter
  // rather than a special case; A Cabin-Fragment pays a different amount at
  // every one of the five, so it simply has five entries with the same text.
  //
  //   favour  the Thalassic Favour the reward trades for, in total
  //   gain    what you actually receive
  //   coral   a coral, i.e. one of three unique items in week two
  //   item    a named unique piece of equipment
  //   bride   the Accomplishment at the bottom of the trench
  //
  // `min` is the card's own Full Fathom Five requirement, which is also the
  // only depth signal available without reading a quality (see `fotzDepth`).
  // `strict` marks the two names generic enough that some other card in London
  // could plausibly share one; those are badged only where we can tell we are
  // at the festival -- the same treatment The Sound of Wings gets at zee.
  const FOTZ_CARDS = [
    {
      name: 'A Reef of Wrecks',
      opts: [{
        text: 'Claim a piece of cast-off coral', depths: [1, 5], favour: 0,
        coral: 'Grasping Coral',
      }],
    },
    {
      name: 'A Rusting Anchor',
      opts: [{
        text: 'Claim a piece of layered coral', depths: [1, 5], favour: 0,
        coral: 'Gorgonian Reef-Rock',
      }],
    },
    {
      name: 'Among the Deep-Fish',
      opts: [{
        text: 'Claim a piece of cast-off coral', depths: [1, 5], favour: 0,
        coral: 'Barnacled Headpiece',
      }],
    },
    {
      name: 'An Obscured Glitter',
      opts: [{
        text: 'Claim a piece of shining coral', depths: [1, 5], favour: 0,
        coral: 'Spinebound Oddity',
      }],
    },
    {
      name: 'Old Wounds', strict: true,
      opts: [{
        text: 'Claim a piece of cast-off coral', depths: [1, 5], favour: 0,
        coral: 'Pedestrian Polyp',
      }],
    },
    {
      name: 'A Graveyard of Derelict Debris',
      opts: [{
        text: 'Claim a piece of bulbous coral', depths: [1, 5], favour: 0,
        coral: 'Rust-Eaten Ration',
      }],
    },
    {
      name: 'A Cabin-Fragment',
      opts: [
        { text: 'Take what you can', depths: [1, 1], favour: 50, gain: 'Witch-Stone ×5' },
        { text: 'Take what you can', depths: [2, 2], favour: 100, gain: 'Witch-Stone ×10' },
        {
          text: 'Take what you can', depths: [3, 3], favour: 200,
          gain: 'Witch-Stone ×10, Collection of Zee-Glass ×5',
        },
        {
          text: 'Take what you can', depths: [4, 4], favour: 300,
          gain: 'Collection of Zee-Glass ×5, Long-Lost Zee Trunk',
        },
        {
          text: 'Take what you can', depths: [5, 5], favour: 400,
          gain: 'Witch-Stone ×10, Collection of Zee-Glass ×5, Long-Lost Zee Trunk',
        },
      ],
    },
    {
      name: 'Easy Pickings', strict: true,
      opts: [
        {
          text: 'Claim an assortment of cast-off oddments', depths: [1, 1], favour: 100,
          gain: 'Sodden Mass',
        },
        {
          text: 'Claim an assortment of cast-off oddments', depths: [2, 3], favour: 150,
          gain: 'Sodden Mass, Salt-Smoothed Shiv',
        },
        {
          text: 'Claim an assortment of cast-off oddments', depths: [4, 5], favour: 300,
          gain: 'Sodden Mass ×2, Salt-Smoothed Shiv ×2',
        },
      ],
    },
    {
      name: 'Unlucky Prisoner',
      opts: [
        {
          text: 'Rummage through the remains', depths: [1, 1], favour: 50,
          gain: 'Salt-Smoothed Shiv',
        },
        {
          text: 'Rummage through the remains', depths: [2, 2], favour: 100,
          gain: 'Salt-Smoothed Shiv ×2',
        },
        {
          text: 'Rummage through the remains', depths: [3, 3], favour: 150,
          gain: 'Salt-Smoothed Shiv ×3',
        },
        {
          text: 'Rummage through the remains', depths: [4, 4], favour: 125,
          gain: 'Skull in Coral (or Urchin Spine)',
        },
        {
          text: 'Rummage through the remains', depths: [5, 5], favour: 175,
          gain: 'Skull in Coral (or Urchin Spine), Salt-Smoothed Shiv',
        },
      ],
      note: 'The only card that pays a Skull in Coral, which is the one treasure that '
        + 'outlives the festival.',
    },
    {
      name: 'Tangled in the Rigging', min: 2,
      opts: [
        {
          text: 'Liberate the Wrecking Boots', depths: [2, 3], favour: 100,
          item: 'Wrecking Boots',
        },
        {
          text: 'Retrieve a Semi-Automated Mary Lloyd', depths: [4, 5], favour: 200,
          item: 'Semi-Automated Mary Lloyd',
        },
      ],
    },
    {
      name: 'Well-Disguised Trinkets',
      opts: [
        {
          text: 'Snatch a Cured Jillyfleur Cloak', depths: [1, 2], favour: 100,
          item: 'A Cured Jillyfleur Cloak',
        },
        {
          text: 'Retrieve a Faceted Decanter of Drownie Effluvia', depths: [3, 5], favour: 300,
          item: 'A Faceted Decanter of Drownie Effluvia',
        },
      ],
    },
    {
      name: 'A Shattered Prow', min: 2,
      opts: [
        {
          text: 'Dive for a Nuncian Pocket Watch', depths: [2, 4], favour: 150,
          item: 'Nuncian Pocket Watch',
        },
        {
          text: 'Pry free a Scrimshander Carving Knife', depths: [5, 5], favour: 400,
          item: 'Scrimshander Carving Knife',
        },
      ],
    },
    // Not a card: the storylet the bottom of the trench reveals. It is in this
    // table because `eachCardName` decorates an opened storylet's heading too,
    // and because this is the one place at the festival where the right move
    // is to take NO treasure -- the Accomplishment is worth more.
    {
      name: 'Her Fivefold Symmetry', min: 5, storylet: true,
      opts: [{
        text: 'Beg audience with this ancient power', depths: [5, 5], favour: 0,
        bride: true, gain: 'Discovered: the Pentamerous Bride, and no item',
      }],
      note: 'Foregoes a treasure. The Accomplishment is what lets the King-in-Coral '
        + 'hand you a Weeping Litter-Cyst in week two.',
    },
  ];

  const FOTZ_BY_NAME = new Map(
    FOTZ_CARDS.map(function (c) { return [normalizeName(c.name), c]; }));

  const FOTZ_CORAL_BY_NAME = new Map(
    FOTZ_CORALS.map(function (c) { return [c.coral, c]; }));

  function lookupFotzCard(name) {
    return FOTZ_BY_NAME.get(normalizeName(name)) || null;
  }

  // --- where you are -----------------------------------------------------
  //
  // **Both halves are now CONFIRMED**, captured verbatim in-game 2026-09-03,
  // which makes this an exact list of the SPITE_AREAS kind rather than the
  // permissive guess it started as:
  //
  //   on the island   "It's ‹name›! Welcome to Mutton Island, delicious friend!"
  //   mid-dive        "It's ‹name›! Welcome to the Royal Approach, delicious friend!"
  //
  // Note the game writes the second with a lower-case "the". It does not
  // matter -- `normalizeName` folds case -- but it is worth knowing that the
  // wiki's `location = The Royal Approach` and the game's greeting are the
  // same string only after normalising.
  //
  // Wreckers' Cove is the one entry still unread: the week-two market lives
  // there by name, though the storylets are filed under Mutton Island, so it
  // is kept in case the greeting changes for the market. An extra entry can
  // only widen the allow-list, never wrongly block; a MISSING one would
  // wrongly block, which is the risk that matters now that this list is
  // allowed to say no.
  const FOTZ_AREAS = [
    'Mutton Island',
    'The Royal Approach',
    'Wreckers’ Cove',
    'Wreckers\' Cove',
  ].map(normalizeName);

  // The one you are actually underwater in. Separate from the list above
  // because it answers a different question -- see `forgetStaleDepth`.
  const FOTZ_DIVE_AREAS = ['The Royal Approach'].map(normalizeName);

  function inFotzArea() {
    const area = normalizeName(currentArea());
    return !!area && FOTZ_AREAS.indexOf(area) !== -1;
  }

  function inDiveArea() {
    const area = normalizeName(currentArea());
    return !!area && FOTZ_DIVE_AREAS.indexOf(area) !== -1;
  }

  // The sturdier confirmation, and the one that needs no unverified markup at
  // all: nine of the eleven card names could not plausibly belong to anything
  // else in London, so one of them in the hand proves where you are. A
  // three-card dive hand can hardly avoid holding at least one.
  function fotzHandConfirms() {
    let seen = false;
    eachCardName(function (host, name) {
      if (seen) return;
      const card = lookupFotzCard(name);
      if (card && !card.strict) seen = true;
    });
    return seen;
  }

  // THREE answers, not two, and the middle one is the point of having captured
  // both greetings:
  //
  //   'yes'      the greeting names a festival area, or the hand proves it
  //   'no'       the greeting names somewhere else entirely -- badge nothing
  //   'unknown'  there is no greeting to read; the card table is the only scope
  //
  // 'no' is new. Until both areas were confirmed this could only ever say yes,
  // because refusing on an unverified list risked blacking out the feature in
  // the very place it is for. Now it can refuse, which is what keeps a Fruits
  // of the Zee badge off a card somewhere else in London that happens to share
  // a name -- the same tightening `SPITE_AREAS` got.
  function fotzWhere() {
    if (!normalizeName(currentArea())) return 'unknown';
    if (inFotzArea()) return 'yes';
    // Somewhere unexpected, but an unmistakable dive hand still outranks a
    // list that might be missing an area nobody has visited yet.
    return fotzHandConfirms() ? 'yes' : 'no';
  }

  // --- how deep you are --------------------------------------------------
  //
  // Full Fathom Five, 1 to 5, and nearly everything the badge says turns on
  // it. Three sources, best first:
  //
  //  1. A LIVE quality read. `readQualities` finds `li.quality-item`, which is
  //     verified markup on the Myself tab. **In practice this never fires**:
  //     a hand captured mid-dive (2026-09-03) shows FL renders no quality
  //     items anywhere on the diving screen, so the depth is only ever the one
  //     you set yourself. It is kept because it costs one failed
  //     `querySelectorAll` and would start working for nothing if FL ever put
  //     the quality on that screen -- but do not plan around it.
  //     It is deliberately live-only, with no fall back to the cache: a banked
  //     depth from three minutes ago is a WRONG answer rather than a stale
  //     one, because it changes with every successful dive.
  //  2. What you set yourself, kept in sessionStorage -- a dive is one
  //     sitting, and a depth should not outlive the tab. Set from the panel
  //     or, while you are in the Royal Approach, from the control this script
  //     puts in the page: behind UX Enhancers' docked button beside Fallen
  //     London's own travel button, and again above the diving hand.
  //  3. A BANKED quality read, off the Myself tab -- the one place Full
  //     Fathom Five is reliably rendered. CONFIRMED WORKING in-game
  //     (2026-09-04): the panel fetches it and the depth comes back, so a
  //     dive no longer opens with the badges quoting a range. Opening the
  //     Fruits of the Zee panel loads
  //     /myself in a hidden frame the same way it loads /possessions, so this
  //     is normally seconds old. It is used ONLY inside `FOTZ_READ_FRESH_MS`,
  //     because the number changes with every successful dive: past that
  //     window an old reading is not stale, it is wrong, and no answer beats
  //     a wrong one. It sits BELOW what you set by hand for the same reason --
  //     you know you have just dived, and the bank does not.
  //  4. Nothing. Then the badge shows the range across every depth and says
  //     so. The card table still gives a FLOOR (A Shattered Prow and Tangled
  //     in the Rigging need depth 2, Her Fivefold Symmetry depth 5), which is
  //     used to trim impossible depths out of that range -- but never to
  //     invent a single depth.
  const FOTZ_DEPTH_KEY = 'fl-ux-fotz-depth';
  const FOTZ_QUALITY_DEPTH = 'Full Fathom Five';

  function fotzLiveDepth() {
    let scan = null;
    try {
      scan = readQualities();
    } catch (e) {
      return null;
    }
    if (!scan) return null;
    const q = scan.values.get(FOTZ_QUALITY_DEPTH);
    if (!q || !(q.level >= 1) || q.level > 5) return null;
    return q.level;
  }

  function fotzSetDepth(depth) {
    try {
      if (depth == null) sessionStorage.removeItem(FOTZ_DEPTH_KEY);
      else sessionStorage.setItem(FOTZ_DEPTH_KEY, String(depth));
    } catch (e) { /* private mode; the badge just stays on the range */ }
  }

  function fotzChosenDepth() {
    try {
      const raw = sessionStorage.getItem(FOTZ_DEPTH_KEY);
      const n = raw == null ? NaN : Number(raw);
      return n >= 1 && n <= 5 ? n : null;
    } catch (e) {
      return null;
    }
  }

  // The floor the hand itself proves, or null. Only ever a lower bound.
  function fotzDepthFloor() {
    let floor = 0;
    eachCardName(function (host, name) {
      const card = lookupFotzCard(name);
      if (card && card.min && card.min > floor) floor = card.min;
    });
    return floor || null;
  }

  // A depth you set by hand outlives the dive it was set for -- it is kept for
  // the whole tab session -- and the moment you surface it is not stale, it is
  // WRONG: the next dive starts at 1. Until the mid-dive greeting was captured
  // there was no way to notice you had left. Now there is, so leaving the
  // Royal Approach throws the setting away and the badges go back to showing
  // the range until you say otherwise.
  //
  // Only ever acts on a greeting it can actually read. An unreadable one means
  // "no idea where you are", which is not grounds for discarding anything.
  function forgetStaleDepth() {
    const area = normalizeName(currentArea());
    if (!area || inDiveArea()) return;
    if (fotzChosenDepth() != null) fotzSetDepth(null);
  }

  // How long a depth read off the Myself tab is worth anything. One dive
  // changes it, so this is deliberately short -- it is the window in which the
  // reading the panel just took is still the reading rather than a memory of
  // one.
  const FOTZ_READ_FRESH_MS = 60 * 1000;

  // The banked Myself reading, or null. Null covers every doubt: no bank, no
  // timestamp, a stale one, or a level outside 1-5 (0 is what the scrape
  // writes when you are not diving at all, and that is not a depth).
  function fotzReadDepth() {
    let rec = null;
    try {
      rec = loadCache(FOTZ_CACHE_KEY, 1);
    } catch (e) {
      return null;
    }
    if (!rec || !rec.values || !(rec.at > 0)) return null;
    if (Date.now() - rec.at > FOTZ_READ_FRESH_MS) return null;
    const n = rec.values[FOTZ_QUALITY_DEPTH];
    if (!(n >= 1) || n > 5) return null;
    return { depth: n, at: rec.at };
  }

  // { depth, source, at } -- source is 'quality', 'set', 'read', or null for
  // none of them. `at` is when a 'read' was taken, and null for the others.
  function fotzDepth() {
    const live = fotzLiveDepth();
    if (live) return { depth: live, source: 'quality', at: null };
    const chosen = fotzChosenDepth();
    if (chosen) return { depth: chosen, source: 'set', at: null };
    const read = fotzReadDepth();
    if (read) return { depth: read.depth, source: 'read', at: read.at };
    return { depth: null, source: null, at: null };
  }

  // Opening the festival panel while you are actually down there has to go and
  // LOOK, even when the banked numbers are fresh by the panel's usual standard:
  // every figure on that screen is quoted at a depth that changed the last time
  // you acted, and Full Fathom Five is only ever rendered on the Myself tab.
  // `stateIsFresh` is left alone -- it is shared with the Factions panel, which
  // has no such problem.
  //
  // The timestamp is what stops this being a loop. A refresh ends in a
  // re-render, which asks this again; a refresh that banked nothing (a
  // logged-out iframe, say) would still answer "go and look", and the panel
  // would boot the SPA over and over.
  let depthRefreshAt = 0;
  function wantsDepthRefresh() {
    if (!inDiveArea()) return false;
    if (readQualities()) return false; // the Myself tab is already on screen
    return Date.now() - depthRefreshAt > FOTZ_READ_FRESH_MS;
  }

  // One phrase for where the depth came from, shared by the panel and the
  // in-page control so the two can never word it differently. The badge
  // tooltip says it in its own words, because it has a whole line for it.
  function depthSourceText(at, floor) {
    if (at.source === 'quality') return 'read from Full Fathom Five: ' + at.depth;
    if (at.source === 'set') return 'set to ' + at.depth;
    if (at.source === 'read') return 'read off Myself ' + ageText(at.at) + ': ' + at.depth;
    return floor ? 'unknown, at least ' + floor : 'unknown';
  }

  // --- reading a card ----------------------------------------------------

  function fotzOptionAt(opt, depth) {
    return depth >= opt.depths[0] && depth <= opt.depths[1];
  }

  // Every claim this card offers at `depth`; at a known depth that is always
  // exactly one, which is what lets the badge be a single number. With no
  // depth it is every claim, minus any the floor rules out.
  function fotzOptionsAt(card, depth, floor) {
    if (depth) return card.opts.filter(function (o) { return fotzOptionAt(o, depth); });
    if (!floor) return card.opts.slice();
    return card.opts.filter(function (o) { return o.depths[1] >= floor; });
  }

  // What one claim would hand you that you haven't already got. `holdings` is
  // the ownership reading; when it is null nothing is known, and this returns
  // null so the badge can say as much instead of guessing. Pure, so the marks
  // are testable.
  //
  //   holdings = { has(name) -> bool, bride: bool, sig: string }
  function fotzMissingFrom(opt, holdings) {
    if (!holdings) return null; // can't tell
    if (opt.coral) {
      const coral = FOTZ_CORAL_BY_NAME.get(opt.coral);
      if (!coral) return [];
      // **A coral already in your hold finishes the card**, whether or not
      // week two has opened and let you break it. One coral becomes one item
      // and the three items are mechanically identical, so a second coral of
      // the same kind is a duplicate of a duplicate -- there is nothing left
      // to dive for. This is the rule `coralsWanted` already applied to the
      // dive advice; applying it here is what stops the "unique rewards still
      // down there" list from sending you after six corals you are carrying
      // (reported 2026-09-06). It comes before the `pending` case on purpose:
      // a pending coral's items can never read as held, but the coral itself
      // reads perfectly well, and it is the coral you dive for. Confirmed
      // in-game by the author on 2026-09-06.
      if (holdings.count && holdings.count(opt.coral) > 0) return [];
      // A coral whose three items have not been published yet: nobody can
      // hold what does not exist, so it is missing.
      if (!coral.variants) return [coral.pendingLabel || coral.slot];
      // **Any one of the three finishes it.** The three versions of a coral
      // item are mechanically identical -- same slot, same stats, different
      // name and description -- so a second one is a change of outfit, not a
      // reward. Holding one means this card has nothing left to give you.
      const got = coral.variants.some(function (v) { return holdings.has(v); });
      return got ? [] : [coral.slot];
    }
    if (opt.item) return holdings.has(opt.item) ? [] : [opt.item];
    if (opt.bride) return holdings.bride ? [] : [FOTZ_BRIDE_QUALITY];
    return []; // pure economy treasure: nothing to collect
  }

  // Does this card offer anything collectable at all? Independent of what you
  // own, so a treasure-only card stays unmarked rather than wearing a tick it
  // hasn't earned.
  function fotzOffersRare(opts) {
    return opts.some(function (o) { return !!(o.coral || o.item || o.bride); });
  }

  // --- what is still out there, and how deep it is -----------------------
  //
  // The question the checklist cannot answer: a dive commits you to a depth,
  // and the unique rewards are not spread evenly down the trench. Some are
  // only deep (the Scrimshander Knife is depth 5 and nowhere else) and -- the
  // part that actually costs people items -- some are only SHALLOW. A Cured
  // Jillyfleur Cloak is depths 1-2; dive past 2 and it is gone for that dive.
  // So "what am I missing" and "how deep should I go" are different questions,
  // and this answers the second.
  //
  // Currency-only cards fall out for free: `fotzMissingFrom` returns an empty
  // list for anything that pays nothing but Favour, so A Cabin-Fragment, Easy
  // Pickings and Unlucky Prisoner never appear here.
  //
  // Pure, and derived from FOTZ_CARDS rather than from a second table -- the
  // depths are already stated there once and must not be stated twice.
  function fotzUniquesByDepth(holdings) {
    const rows = [];
    for (let depth = 1; depth <= 5; depth++) {
      const entries = [];
      for (const card of FOTZ_CARDS) {
        for (const opt of fotzOptionsAt(card, depth, null)) {
          const missing = fotzMissingFrom(opt, holdings);
          if (!missing || !missing.length) continue;
          const coral = opt.coral ? FOTZ_CORAL_BY_NAME.get(opt.coral) : null;
          entries.push({
            card: card.name,
            coral: opt.coral || null,
            // Its `missing` is one placeholder, not one real item, so the
            // renderer must not print "×1" and imply two of three are done.
            pending: !!(coral && !coral.variants),
            // How many of the coral you are already sitting on, the same
            // number the card badge shows in brackets.
            held: opt.coral && holdings && holdings.count ? holdings.count(opt.coral) : 0,
            bride: !!opt.bride,
            label: opt.coral || opt.item || FOTZ_BRIDE_QUALITY,
            missing: missing,
            from: opt.depths[0],
            to: opt.depths[1],
            // The two marks worth drawing: this is the shallowest depth it
            // appears at, and this is the last one before it is out of reach.
            first: opt.depths[0] === depth,
            last: opt.depths[1] === depth,
          });
        }
      }
      rows.push({ depth: depth, entries: entries });
    }
    return rows;
  }

  // The corals are claimable at every depth, so listing them five times says
  // nothing. Split them off and state them once.
  function fotzSplitUniques(rows) {
    const everywhere = new Map();
    for (const row of rows) {
      for (const entry of row.entries) {
        if (entry.from === 1 && entry.to === 5 && !everywhere.has(entry.label)) {
          everywhere.set(entry.label, entry);
        }
      }
    }
    return {
      everywhere: Array.from(everywhere.values()),
      byDepth: rows.map(function (row) {
        return {
          depth: row.depth,
          entries: row.entries.filter(function (e) { return !everywhere.has(e.label); }),
        };
      }),
    };
  }

  const FOTZ_CLASS = 'fl-ux-fotz';
  const FOTZ_FLAG = 'flUxFotz';
  const FOTZ_MARK_NEED = '★';   // something here you haven't got
  const FOTZ_MARK_DONE = '✓';   // you hold everything this card offers
  // '?' rather than the '–' the Factions pips use for an unknown: this mark is a
  // PREFIX to a number, and '–400' reads as minus four hundred.
  const FOTZ_MARK_UNSURE = '?'; // no Possessions read, so no claim either way

  // Colour is the trade-in value, so a hand ranks itself at a glance. The two
  // kinds that pay no Favour at all -- a coral, and the Bride at the bottom of
  // the trench -- are coloured by whether you still NEED them instead, since
  // for those the Favour column isn't the question being asked.
  //
  // REWORKED 2026-09-04, on the author's report that several of these were
  // barely visible and that too many cards shared a colour. Both were true.
  // The replacement is CONFIRMED legible on real card art, in a live hand --
  // which is the half a contrast ratio cannot settle.
  // The old ramp was six dark, desaturated bands -- greens, browns and a grey
  // -- drawn over Fallen London's dark card ARTWORK, which is what made the
  // low end disappear; and six bands cannot separate the eight figures this
  // festival actually pays, so 125 and 150 came out the same colour, and so
  // did 175 and 200.
  //
  // The rule now: one colour per figure, every one of them LIGHT enough to sit
  // on artwork, and the eight ordered as a single rotation of the hue wheel
  // from aqua round through blue, violet and rose to gold. That keeps the two
  // properties that matter at once -- adjacent steps are plainly different
  // colours, and the sequence still reads as a ladder rather than a set of
  // unrelated labels.
  //
  // Light backgrounds are why FOTZ_INK exists. Every colour below is under
  // 3:1 against white and over 5.5:1 against this near-black, so the badges
  // carry dark text; `makeBadge` defaults to white for the other features,
  // whose palettes are still dark.
  const FOTZ_INK = '#14181c';

  const FOTZ_FAVOUR_COLORS = [
    [400, '#f0c23c'], // gold
    [300, '#ef9440'], // orange
    [200, '#ef7a86'], // rose
    [175, '#e878c0'], // magenta
    [150, '#c07ad8'], // orchid
    [125, '#8f8ae8'], // periwinkle
    [100, '#5aa6e8'], // light blue
    [0, '#5fd3e0'],   // aqua -- 50, and anything below it
  ];

  // Gold twice over, and deliberately: a coral you still need is the prize on
  // that card the way 400 Favour is the prize on a numbered one. They cannot
  // be confused, because a coral badge reads "coral" and never a figure.
  const FOTZ_COLOR_NEED = '#f0c23c';
  // Held and unsure are the two that should NOT shout, so they are the only
  // neutrals left -- but lifted well clear of the old #4a5560, which was so
  // close to the page that a badge wearing it read as a smudge.
  const FOTZ_COLOR_HELD = '#8797a8';
  const FOTZ_COLOR_UNSURE = '#9a9a9a';

  // Thresholds rather than an exact lookup, so a figure the table does not
  // currently pay still lands somewhere sensible instead of nowhere. The last
  // entry is `0`, so this always returns.
  function fotzColor(favour) {
    for (const step of FOTZ_FAVOUR_COLORS) if (favour >= step[0]) return step[1];
    return FOTZ_FAVOUR_COLORS[FOTZ_FAVOUR_COLORS.length - 1][1];
  }

  function fotzRangeText(favours) {
    const lo = Math.min.apply(null, favours);
    const hi = Math.max.apply(null, favours);
    return lo === hi ? String(lo) : lo + '–' + hi;
  }

  // What you are already carrying, for the badge's brackets. Several names at
  // once when the depth is unknown and the card offers a different item at
  // each of them -- the bracket is then a range, low to high, the same shape
  // the Favour figure takes rather than a number picked from one of them.
  // Empty when you hold none, so an untouched hand stays as quiet as it was,
  // and empty when Possessions have never been read, since a "(0)" there would
  // be a claim we cannot make.
  function fotzHeldSuffix(names, holdings) {
    if (!names.length || !holdings || !holdings.count) return '';
    const counts = names.map(function (n) { return holdings.count(n); });
    if (!Math.max.apply(null, counts)) return '';
    return ' (' + fotzRangeText(counts) + ')';
  }

  function fotzDepthWord(opt) {
    return opt.depths[0] === opt.depths[1]
      ? 'Depth ' + opt.depths[0]
      : 'Depths ' + opt.depths[0] + '–' + opt.depths[1];
  }

  // The badge, as a pure { text, color, title } spec. `depth` may be null.
  function fotzBadgeSpec(card, depth, source, floor, holdings) {
    const opts = fotzOptionsAt(card, depth, floor);
    if (!opts.length) return null; // nothing claimable at this depth

    const rare = fotzOffersRare(opts);
    let missing = [];
    let unsure = false;
    for (const opt of opts) {
      const gone = fotzMissingFrom(opt, holdings);
      if (gone == null) unsure = true;
      else missing = missing.concat(gone);
    }
    const mark = !rare ? ''
      : (unsure ? FOTZ_MARK_UNSURE : (missing.length ? FOTZ_MARK_NEED : FOTZ_MARK_DONE));

    const favours = opts.map(function (o) { return o.favour; })
      .filter(function (v) { return v > 0; });
    const value = favours.length ? fotzRangeText(favours) : null;

    // How many of this card's coral you are already holding. Every coral card
    // otherwise wears an identical `★coral`, which flattens a real difference:
    // one you have never seen and one you already have two of are not the same
    // card to draw. `(N)` is only shown when N > 0, so a hand of untouched
    // corals stays as quiet as it was.
    const coralOpt = opts.filter(function (o) { return o.coral; })[0] || null;
    const coralHeld = coralOpt && holdings && holdings.count
      ? holdings.count(coralOpt.coral) : 0;

    // The same treatment for the named UNIQUE EQUIPMENT -- the Wrecking Boots,
    // the Scrimshander Carving Knife and the rest. Those cards do pay Favour,
    // so they used to wear that figure and read exactly like A Cabin-Fragment;
    // but a card that is only worth its Favour and a card that is also a piece
    // of kit you may not own are not the same draw, and the figure is the less
    // interesting half. So they are labelled `item` the way a coral is
    // labelled `coral`, with what you already hold in brackets -- which for
    // one of these is the number of SPARES, since a single one finishes the
    // collection and any beyond that is trade-in stock. Nothing is lost: the
    // colour is still the Favour ramp and the tooltip still quotes the figure.
    const itemNames = opts.filter(function (o) { return o.item; })
      .map(function (o) { return o.item; })
      .filter(function (n, i, all) { return all.indexOf(n) === i; });

    // The Favour stays on the badge, in front, where every other card carries
    // it -- a spare IS its trade-in value, so a badge that had dropped the
    // figure would be hiding the one number that says what the spare is worth.
    // Colour alone cannot do that job: it is a six-step ramp, so it separates
    // 400 from 100 but never 300 from 400.
    const label = itemNames.length
      ? (value != null ? value + ' · ' : '') + 'item' + fotzHeldSuffix(itemNames, holdings)
      : (value != null ? value
        : (opts.some(function (o) { return o.bride; })
          ? 'Bride'
          : 'coral' + fotzHeldSuffix(coralOpt ? [coralOpt.coral] : [], holdings)));

    const color = value != null
      ? fotzColor(Math.max.apply(null, favours))
      : (unsure ? FOTZ_COLOR_UNSURE : (missing.length ? FOTZ_COLOR_NEED : FOTZ_COLOR_HELD));

    const lines = [card.name];
    lines.push(depth
      ? 'Your depth: ' + depth + (source === 'quality'
        ? ' (read from Full Fathom Five)'
        : (source === 'read'
          ? ' (read off the Myself tab — a dive changes it, so correct it on the '
            + 'depth control if you have gone deeper)'
          : ' (as you set it)'))
      : 'Depth unknown, so every depth is listed'
        + (floor ? ', from ' + floor + ' up — this hand proves at least that' : '')
        + '. Set it on the depth control beside the Travel button, or in '
        + '⚙ UX → Fruits of the Zee, for one exact figure.');

    for (const opt of opts) {
      let line = (depth ? '' : fotzDepthWord(opt) + ': ') + opt.text;
      if (opt.favour > 0) line += ' — ' + opt.favour + ' Favour';
      if (opt.gain) line += ' (' + opt.gain + ')';
      lines.push(line);
      if (opt.coral) {
        const coral = FOTZ_CORAL_BY_NAME.get(opt.coral);
        // What the "(N)" on the badge means, and what it implies. One coral
        // becomes one item, so needing three variants and holding one coral
        // means two more dives -- that subtraction is the useful form of the
        // number, and there is room for it here where there is none on a badge.
        // Asked of the ITEM, not of `fotzMissingFrom` -- which now answers
        // "nothing left to dive for" the moment the coral is in your hold, so
        // it can no longer tell the two sentences below apart.
        const done = !!(coral && coral.variants && holdings && holdings.has
          && coral.variants.some(function (v) { return holdings.has(v); }));
        if (coralHeld) {
          lines.push('  You are holding ' + coralHeld + ' ' + opt.coral
            + (coralHeld === 1 ? '' : 's') + ' already'
            + (done ? ' — spare, since you already have the item it becomes.'
              : (coral && coral.variants
                ? ' — one is all it takes, so there is nothing left to dive for here.'
                : '.')));
        }
        if (coral && !coral.variants) {
          lines.push('  ' + opt.coral + ' → one of three ' + coral.slot + ' in week two.');
          lines.push('  ' + coral.pending);
        } else {
          // The three are the same item wearing different names, so which one
          // you get is a question of taste. Said plainly, because the Sights
          // bands below otherwise look like something you have to plan around.
          lines.push('  ' + opt.coral + ' → one of three '
            + (coral ? coral.slot : 'items') + ' in week two. All three are mechanically '
            + 'identical, so any one of them finishes this card for good.');
          lines.push('  Which name you get is decided by Sights at the Festival: '
            + FOTZ_BANDS.map(function (band, i) {
              return band.lo + '–' + band.hi + ' ' + (coral ? coral.variants[i] : '?');
            }).join(', ') + '.');
        }
      }
      if (opt.item) {
        // The badge's brackets, spelled out: a second one of these is not a
        // second reward, it is a treasure you can trade in for its Favour, and
        // there is room to say so here where there is none on a badge.
        const itemHeld = holdings && holdings.count ? holdings.count(opt.item) : 0;
        lines.push('  ' + opt.item + (holdings
          ? (holdings.has(opt.item)
            ? ' — you already have ' + (itemHeld > 1
              ? itemHeld + ', so ' + (itemHeld - 1) + ' of them are spare'
                + (opt.favour > 0
                  ? ' and worth ' + opt.favour + ' Favour each at the market.' : '.')
              : 'one.')
            : ' — you do NOT have one yet.')
          : ' — whether you have one is unknown; open the Fruits of the Zee panel to '
            + 'read your Possessions.'));
      }
    }
    if (missing.length) {
      lines.push(FOTZ_MARK_NEED + ' Still missing: ' + missing.join(', ') + '.');
    } else if (rare && !unsure) {
      lines.push(FOTZ_MARK_DONE + ' You already hold everything this card offers.');
    }
    if (card.note) lines.push(card.note);
    lines.push('One card’s reward per dive. Diving deeper is free, but failing the dive '
      + 'ends it and hands you menaces.');

    return {
      text: mark ? mark + label : label,
      color: color,
      ink: FOTZ_INK,
      title: lines.join('\n'),
    };
  }

  // --- badging the supplication branches ---------------------------------
  //
  // The one place in this script that decorates a storylet's OPTIONS rather
  // than a card. Markup captured 2026-09-03, verbatim:
  //
  //   <div class="media branch media--branch" data-branch-id="259494">
  //     <div class="media__left branch__left"> … </div>
  //     <div class="media__body branch__body"><div>
  //       <div class="branch__plan-buttonlet"> … </div>
  //       <h2 class="media__heading heading heading--3 branch__title">Perform
  //         in a Mutton Island mystery play</h2>
  //
  // The badge goes AFTER the `h2`, the same way it does for a card heading --
  // never inside it, so anything reading the heading's text still sees the
  // plain name. (`wiki-links.js` deliberately leaves `.branch__title` alone,
  // so nothing else is decorating these.)
  //
  // Note the game already tells you what an option is gated on, with its own
  // requirement icons. What it never says is which of your attributes the
  // reward scales off -- and since Airs decides which options you are even
  // offered, that is the whole decision. So that is all the badge says.

  const FOTZ_BRANCH_CLASS = 'fl-ux-fotz-branch';
  const FOTZ_BRANCH_FLAG = 'flUxFotzBranch';
  const FOTZ_BRANCH_SELECTOR = '.branch__title';

  // The storylet these branches belong to, from the same capture: the game
  // prefixes the wiki's title, so it reads "Fruits of the Zee: Supplication on
  // the Shore". Matched loosely on the distinctive half.
  function onSupplicationStorylet() {
    const heads = document.querySelectorAll('.storylet-root__heading');
    for (const head of heads) {
      if (normalizeName(headingName(head)).indexOf('supplication on the shore') !== -1) return true;
    }
    return false;
  }

  function fotzBranchSpec(opt) {
    const stat = opt.stat ? FOTZ_STATS[opt.stat] : null;
    const lines = [opt.text];
    if (stat) {
      lines.push('Scales off ' + opt.stat + ': the better your base ' + opt.stat
        + ', the more of it you get.');
      lines.push('Gives: ' + opt.gain + ', and Fivefold Devotion +4 CP.');
      lines.push('Offered while Airs of a Barren Zee is ' + opt.airs + '.');
      lines.push('Every option here pays the same +4 CP, so the attribute is the only '
        + 'thing that separates them — but Airs decides which are on offer, and it is '
        + 're-rolled each time you act, so you cannot always have the one you want.');
    }
    if (opt.note) lines.push(opt.note);

    return {
      text: stat ? stat.icon + ' ' + opt.stat : opt.badge,
      color: stat ? stat.badge : (opt.warn ? '#8a3b3b' : '#4a5560'),
      title: lines.join('\n'),
    };
  }

  function fotzSupplicationBranches() {
    const here = onSupplicationStorylet();
    document.querySelectorAll(FOTZ_BRANCH_SELECTOR).forEach(function (head) {
      const name = headingName(head);
      const opt = name ? lookupFotzBranch(name) : null;
      // A name generic enough to belong elsewhere is only badged where the
      // storylet above it confirms where we are.
      const spec = opt && (!opt.strict || here) ? fotzBranchSpec(opt) : null;
      attachBadge(head, {
        cls: FOTZ_BRANCH_CLASS,
        flag: FOTZ_BRANCH_FLAG,
        value: name,
        spec: spec,
        place: 'after',
      });
    });
  }

  function fotzCardRatings() {
    // Surfacing invalidates a depth you set by hand, and this is the pass that
    // notices. Before the depth is read, so the badges never quote it once.
    forgetStaleDepth();

    const where = fotzWhere();
    const at = fotzDepth();
    const floor = at.depth ? null : fotzDepthFloor();
    const holdings = fotzHoldings();
    eachCardName(function (host, name, place, style) {
      const card = lookupFotzCard(name);
      // Three gates, narrowest first. Somewhere the greeting places OUTSIDE
      // the festival, nothing is ours -- and clearing rather than skipping is
      // what takes the badges off a hand you walked away with. Where the
      // greeting can't be read at all the card table is the only scope, and
      // the two generic names sit that one out, the same way The Sound of
      // Wings does when we can't tell we're at zee.
      const spec = card && where !== 'no' && (!card.strict || where === 'yes')
        ? fotzBadgeSpec(card, at.depth, at.source, floor, holdings)
        : null;
      attachBadge(host, {
        cls: FOTZ_CLASS,
        flag: FOTZ_FLAG,
        // The flag has to move when the DEPTH or your holdings change, not
        // only when the card does -- otherwise setting your depth leaves every
        // badge already in the hand quoting the old one. The SOURCE is in here
        // as well: the same depth read off Myself and set by hand are the same
        // number with a different tooltip behind it.
        value: name + '@' + (at.depth || 'x') + (at.source || '-')
          + '/' + (holdings ? holdings.sig : 'x'),
        spec: spec,
        place: place,
        style: style,
      });
    });
  }

  // === feature: Port Carnelian ===========================================
  //
  // A term as Governor of Port Carnelian is a fixed-length activity, 26 actions
  // long, and it is the one supported area in this script with NO OPPORTUNITY
  // CARDS at all -- the guide says so outright. So this is the first feature
  // whose badges live on STORYLETS and on their BRANCHES rather than on a hand.
  //
  // A term is a race between three numbers:
  //
  //   Striped Delights and Silver Horseheads -- the two currencies. At the end
  //     of the term you cash ONE of them in; the more of it you have, the more
  //     Presbyterate Passphrases / Antique Mysteries (Delights) or Partial
  //     Maps / Puzzling Maps (Horseheads) you get.
  //   Imperial Legitimacy -- the thing that ends a term badly. At 0 the only
  //     option left is "The sword falls": you are thrown back to zee with
  //     nothing, and getting Legitimacy back means a trip to the Foreign
  //     Office. It does NOT reset between terms.
  //
  // Which options are in front of you is decided by two more:
  //
  //   Time Passing in Office -- 1 to 12, the clock on the term.
  //   The Airs of Port Carnelian -- 1 to 100, RE-ROLLED EVERY TIME YOU ACT. So
  //     which of the airs-gated options you are offered is not something you
  //     plan; it is something you read off the screen, which is exactly what
  //     these badges are for.
  //
  // Every number below is transcribed from Port Carnelian (Guide)'s option
  // table. Corrections go in PC_OPTIONS and nowhere else.
  //
  // One entry per ROW of that table:
  //
  //   name    the storylet, as the wiki titles it.
  //   branch  the option inside it, where the guide splits a storylet in two
  //           (Within their rights, A plea for pardon). Absent means the
  //           storylet has the one line the table records.
  //   time    [min, max] window of Time Passing in Office.
  //   airs    [min, max] window of The Airs of Port Carnelian, or null for the
  //           options Airs does not gate.
  //   sd/sh/il  change in Striped Delights / Silver Horseheads / Imperial
  //           Legitimacy.
  //   either  the two rows that pay this much of ONE of the two currencies,
  //           the game's choice, not yours. Held apart from sd/sh because
  //           "+10 of one of them" is not "+10 of each".
  //   net     total resources gained, as the guide's own Net column. Carried
  //           rather than derived so a test can check it against the parts --
  //           a transcription typo is invisible in game until the actions are
  //           already spent.
  //   needs   what the row is gated on, verbatim from the guide.
  //   reset   the four Time 12 endings, which spend a currency rather than
  //           gaining any: 'sd', 'sh' or 'both'.
  //   fate    Fate-locked.
  //   strict  the name is not distinctive enough to badge outside Port
  //           Carnelian -- see PC_AREAS below.

  const PC_TERM_ACTIONS = 26;

  const PC_OPTIONS = [
    // --- Time 1-11: the two options Airs never gates ----------------------
    { name: 'Attend the Daily Assembly of Tigers', time: [1, 11], airs: null,
      sd: 4, sh: 0, il: 0, net: 4 },
    { name: 'A day in Murgatroyd’s Imperial Tea Shop', time: [1, 11], airs: null,
      sd: 0, sh: 4, il: 0, net: 4 },

    // --- Time 1-10: the two storylets with a branch either way ------------
    { name: 'Within their rights', branch: 'Close your door without a word',
      time: [1, 10], airs: [1, 10], sd: 15, sh: 0, il: -10, net: 5 },
    { name: 'Within their rights', branch: '"Quickly, sir - in, in!"',
      time: [1, 10], airs: [1, 10], sd: -10, sh: 0, il: 5, net: -5 },
    { name: 'A plea for pardon', branch: '"Release him immediately!"',
      time: [1, 10], airs: [91, 100], sd: 0, sh: 15, il: -10, net: 5 },
    { name: 'A plea for pardon', branch: 'Give the executioner the nod',
      time: [1, 10], airs: [91, 100], sd: 0, sh: -10, il: 5, net: -5 },

    // --- Time 1-6 ---------------------------------------------------------
    { name: 'A sickness in the Khaganian Quarters', time: [1, 6], airs: [1, 40],
      sd: -20, sh: 25, il: 0, net: 5, needs: 'Striped Delights 20 x' },
    { name: 'A tithe. Not a bribe.', time: [1, 6], airs: [11, 50],
      sd: 15, sh: 0, il: -10, net: 5 },
    { name: 'Survey the sapphire mines', time: [1, 6], airs: [41, 50],
      sd: 0, sh: 0, il: 10, net: 10 },
    { name: 'A stroll through the Blue Bazaar', time: [1, 6], airs: [51, 70],
      sd: 0, sh: 0, il: 0, either: 10, net: 10 },
    { name: 'Allocate funds to repair a Khanate ship', time: [1, 6], airs: [51, 90],
      sd: 0, sh: 15, il: -10, net: 5 },
    { name: 'The aegis of aesthetics', time: [1, 6], airs: [71, 100],
      sd: 25, sh: -20, il: 0, net: 5, needs: 'Silver Horseheads 20 x' },

    // --- Time 7-10 --------------------------------------------------------
    { name: 'Caring for the needy', time: [7, 10], airs: [1, 30],
      sd: 0, sh: 15, il: -10, net: 5 },
    { name: 'A dangerous source', time: [7, 10], airs: [11, 30],
      sd: 10, sh: 0, il: 0, net: 10, needs: 'Striped Delights 10 x',
      note: 'Also the term’s source of Presbyterate Passphrase.' },
    { name: 'Inconvenienced', time: [7, 10], airs: [31, 40],
      sd: 0, sh: 0, il: 0, either: 15, net: 15, fate: true, strict: true,
      needs: 'Inconvenienced by Your Aunt 12-16' },
    { name: 'A shortage of workers', time: [7, 10], airs: [31, 60],
      sd: 0, sh: 20, il: -15, net: 5, needs: 'Silver Horseheads 10 x' },
    { name: 'A summons from the Smouldering Herald', time: [7, 10], airs: [41, 70],
      sd: 25, sh: 0, il: -25, net: 0, needs: 'Striped Delights 25 x' },
    { name: 'His Amused Lordship', time: [7, 10], airs: [61, 70],
      sd: 0, sh: 0, il: 10, net: 10, strict: true,
      needs: 'Associating with Radical Academics 5' },
    { name: 'A man above a bookshop', time: [7, 10], airs: [71, 90],
      sd: 0, sh: 25, il: -20, net: 5, needs: 'Silver Horseheads 25 x' },
    { name: 'A means for praise', time: [7, 10], airs: [71, 100],
      sd: 25, sh: -20, il: 0, net: 5, needs: 'Silver Horseheads 20 x' },

    // --- Time 11 ----------------------------------------------------------
    { name: 'The fortification of native vitality', time: [11, 11], airs: [1, 20],
      sd: 12, sh: 0, il: 0, net: 12, needs: 'Mystery of the Elder Continent 5 x' },
    { name: 'Building the Sky, a Public Works’ request', time: [11, 11], airs: [21, 40],
      sd: 0, sh: 12, il: 0, net: 12, needs: 'Vision of the Surface 5 x' },
    { name: 'Orders from on high', time: [11, 11], airs: [41, 50],
      sd: 0, sh: 0, il: 10, net: 10 },
    { name: 'Balancing the desires of the locals', time: [11, 11], airs: null,
      sd: 38, sh: -30, il: 0, net: 8, needs: 'Silver Horseheads 30 x' },
    { name: 'Negotiating the rights of the Earth', time: [11, 11], airs: null,
      sd: -30, sh: 38, il: 0, net: 8, needs: 'Striped Delights 30 x' },

    // --- Time 12: the endings ---------------------------------------------
    { name: 'Honoured with a State Dinner', time: [12, 12], airs: null,
      sd: 0, sh: 0, il: 0, net: null, reset: 'both',
      needs: 'Striped Delights 1 x and Silver Horseheads 1 x',
      note: 'Gives a Favours: Society and Favour in High Places 2 x. Worth less than '
        + 'cashing a currency in, once you have 105 of one.' },
    { name: 'An audience with the Banded Prince', time: [12, 12], airs: null,
      sd: 0, sh: 0, il: 0, net: null, reset: 'sd',
      needs: 'Striped Delights 1 x',
      note: 'Spends your Striped Delights: Presbyterate Passphrases, Antique Mysteries, '
        + 'and Tribute 5 x if Associating with Radical Academics is 15 or more.' },
    { name: 'An equine festival', time: [12, 12], airs: null,
      sd: 0, sh: 0, il: 0, net: null, reset: 'sh',
      needs: 'Silver Horseheads 1 x',
      note: 'Spends your Silver Horseheads: Partial Maps and Puzzling Maps.' },
    { name: 'Host a State Dinner', time: [12, 12], airs: null,
      sd: 0, sh: 0, il: 0, net: null, reset: 'both',
      needs: 'Banished from the Court and Successful Terms as Governor 3',
      note: 'Spends both currencies, but it is the one that gets you back to the '
        + 'Empress’ Court: a Cellar of Wine, a Favour in High Places and Restored '
        + 'to the Court of Her Enduring Majesty.' },
  ];

  // What a term's currencies buy. The guide's own reward list.
  const PC_REWARDS = [
    { currency: 'Silver Horseheads', via: 'An equine festival', items: [
      { name: 'Partial Map', count: 'Horseheads / 30 + 2, rounded', worth: '2.5 Echoes each' },
      { name: 'Puzzling Map', count: 'Horseheads / 70, rounded', worth: '12.5 Echoes each' },
    ] },
    { currency: 'Striped Delights', via: 'An audience with the Banded Prince', items: [
      { name: 'Presbyterate Passphrase', count: 'Delights / 30 + 2, rounded', worth: '2.5 Echoes each' },
      { name: 'Antique Mystery', count: 'Delights / 70, rounded', worth: '12.5 Echoes each' },
      { name: 'Tribute', count: '5, flat', worth: 'needs Associating with Radical Academics 15' },
    ] },
  ];

  // The guide's reward-tier table: the least of either currency that buys each
  // step up. The rounding is what makes 105 and 176 the numbers to aim at.
  const PC_TIERS = [
    { at: 1, cheap: 2, dear: 0, echo: 5 },
    { at: 35, cheap: 3, dear: 1, echo: 20 },
    { at: 105, cheap: 6, dear: 2, echo: 40 },
    { at: 136, cheap: 7, dear: 2, echo: 42.5 },
    { at: 165, cheap: 8, dear: 2, echo: 45 },
    { at: 176, cheap: 8, dear: 3, echo: 57.5 },
    { at: 196, cheap: 9, dear: 3, echo: 60 },
    { at: 225, cheap: 10, dear: 3, echo: 62.5 },
    { at: 245, cheap: 10, dear: 4, echo: 75 },
    { at: 256, cheap: 11, dear: 4, echo: 77.5 },
    { at: 285, cheap: 12, dear: 4, echo: 80 },
    { at: 316, cheap: 13, dear: 5, echo: 95 },
    { at: 345, cheap: 14, dear: 5, echo: 97.5 },
    { at: 376, cheap: 15, dear: 5, echo: 100 },
    { at: 385, cheap: 15, dear: 6, echo: 112.5 },
    { at: 405, cheap: 16, dear: 6, echo: 115 },
  ];


  // --- cashing out --------------------------------------------------------
  //
  // A term ends by spending ONE of the two currencies, and everything before
  // it is played for that figure. So the endings carry the one number no table
  // can hold: what YOUR Striped Delights and Silver Horseheads are worth if
  // you cash them in now.
  //
  // The formulas are the ENDING PAGES rather than the guide's summary -- An
  // audience with the Banded Prince and An equine festival state them outright
  // (and agree with it):
  //
  //   cheap item   round(2 + currency / 30)    2.5 Echo each
  //   dear item    round(currency / 70)       12.5 Echo each
  //
  // ROUNDING IS BANKERS' ROUNDING -- a half goes to the nearest EVEN number.
  // That is the wiki's Rounding page, and PC_TIERS is the cross-check that it
  // is the rule in force here: the guide's own tier table steps at 176, 316
  // and 385, which are exactly the thresholds bankers' rounding gives (round
  // half UP would put the first two at 175 and 315). One row of that table
  // dissents -- it lists a dear item from 35, where 35/70 is exactly 0.5 and
  // bankers' rounding pays none until 36. Three rows and a stated mechanic
  // against one row, so the calculator rounds bankers' and this comment is the
  // record of the row that disagrees. `pcCashout` is checked against the whole
  // tier table in the tests, with that row named as the exception.
  //
  // A FACTION FAVOUR COUNTS AS 0 ECHO, deliberately, and is marked instead.
  // "Favours: Society" and its eleven siblings are STORY QUALITIES capped at
  // 7, not items: you cannot sell one, and the wiki's occasional ~4 Echo
  // figure for them is a notional price for something that never reaches the
  // Bazaar. Pricing them would let an ending out-rank a real cash-out on a
  // number nobody acts on, so they are worth 0 here and carry PC_FAVOUR_MARK,
  // which is a SHAPE: the claim survives with every colour stripped off it.
  //
  // A FAVOUR IN HIGH PLACES IS NOT ONE OF THOSE. Despite the name it is an
  // ordinary Influence item -- it sits in Possessions and the Bazaar buys it
  // at 12.5 Echoes -- so it is priced like any other item and carries no mark.
  // The two are told apart by the `favour` field, which means the story
  // quality and nothing else. (First cut of this table had it backwards and
  // priced the item at 0, which cost Honoured with a State Dinner 25 of its
  // 25 Echoes.)
  //
  // Tribute is the real second case: a story quality for the Court of the
  // Wakeful Eye with no market price at all. It is listed, the guide's own
  // "about 12.5 Echoes" estimate is quoted as an estimate, and it is not in
  // the total.

  const PC_ECHO_CHEAP = 2.5;
  const PC_ECHO_DEAR = 12.5;

  // A Favour: worth having, worth nothing on the market by the rule above.
  const PC_FAVOUR_MARK = '❖';
  // The reading behind the figure is older than PC_FRESH_MS, so it may already
  // be wrong: every action of a term moves both currencies.
  const PC_STALE_MARK = '?';

  const PC_SOCIETY_FAVOUR = 'Favours: Society';
  const PC_SOCIETY_CAP = 7;
  const PC_ACADEMICS = 'Associating with Radical Academics';
  const PC_TRIBUTE_AT = 15;

  // Round half to EVEN. Written out rather than Math.round because Math.round
  // takes halves UP, which is the one case this whole table turns on.
  function pcRound(value) {
    const down = Math.floor(value);
    const rest = value - down;
    if (rest > 0.5) return down + 1;
    if (rest < 0.5) return down;
    return down % 2 === 0 ? down : down + 1;
  }

  // One entry per ending, matched to its PC_OPTIONS row by name.
  //
  //   spends   'sd' / 'sh' / 'both' -- which currency the payout is counted
  //            from, and 'both' for the two that pay a fixed reward and empty
  //            both purses.
  //   items    what it hands you. `count(n)` for a figure that scales off the
  //            currency, `flat` for one that does not. `echo` is 0 for
  //            anything with no market price, and `favour: true` marks a
  //            FACTION FAVOUR -- the capped story quality, not the Influence
  //            item called a Favour in High Places -- which is the same claim
  //            said twice, once as a 0 and once as a mark.
  //   extras   what the ending gives that is not a countable reward at all.
  //
  // Transcribed from the four ENDING PAGES (Honoured with a State Dinner, An
  // audience with the Banded Prince, An equine festival, Host a State Dinner),
  // not from the guide's table. Corrections go here and nowhere else.
  const PC_CASHOUTS = [
    {
      name: 'An audience with the Banded Prince',
      spends: 'sd',
      currency: 'Striped Delights',
      items: [
        { name: 'Presbyterate Passphrase', echo: PC_ECHO_CHEAP,
          count: function (n) { return pcRound(2 + n / 30); } },
        { name: 'Antique Mystery', echo: PC_ECHO_DEAR,
          count: function (n) { return pcRound(n / 70); } },
        { name: 'Tribute', echo: 0, flat: 5,
          needs: { quality: PC_ACADEMICS, atLeast: PC_TRIBUTE_AT },
          note: 'a story quality for the Court of the Wakeful Eye. No market price, so it is '
            + 'not in the total; the guide reckons the five at about 12.5 Echoes.' },
      ],
    },
    {
      name: 'An equine festival',
      spends: 'sh',
      currency: 'Silver Horseheads',
      items: [
        { name: 'Partial Map', echo: PC_ECHO_CHEAP,
          count: function (n) { return pcRound(2 + n / 30); } },
        { name: 'Puzzling Map', echo: PC_ECHO_DEAR,
          count: function (n) { return pcRound(n / 70); } },
      ],
    },
    {
      name: 'Honoured with a State Dinner',
      spends: 'both',
      currency: null,
      items: [
        // The page's own Game Instructions: "this will get you a Society
        // favour, IF YOU HAVE FEWER THAN 7". At the cap it pays none, which is
        // a different claim from paying one you cannot hold.
        { name: PC_SOCIETY_FAVOUR, echo: 0, flat: 1, favour: true, cap: PC_SOCIETY_CAP },
        { name: 'Favour in High Places', echo: PC_ECHO_DEAR, flat: 2 },
      ],
      extras: ['Successful Terms as Governor +1'],
    },
    {
      name: 'Host a State Dinner',
      spends: 'both',
      currency: null,
      items: [
        { name: 'Cellar of Wine', echo: PC_ECHO_DEAR, flat: 1 },
        { name: 'Favour in High Places', echo: PC_ECHO_DEAR, flat: 1 },
      ],
      extras: ['Restored to the Court of Her Enduring Majesty — the reason to take this one, '
        + 'and not a thing Echoes can price', 'Persuasive +160 CP',
        'Successful Terms as Governor +1'],
    },
  ];

  const PC_CASHOUT_BY_NAME = new Map(
    PC_CASHOUTS.map(function (plan) { return [normalizeName(plan.name), plan]; }));

  // --- your purse ---------------------------------------------------------
  //
  // Fallen London states both currencies on the Myself tab and nowhere near
  // the storylet you are standing in, so this borrows the festival's plumbing
  // whole: bank a reading whenever that tab goes by, refresh it in a hidden
  // frame when the panel opens on a stale one or when an ending is on screen,
  // and label every figure with its age. A term moves both currencies EVERY
  // action, so a reading goes stale fast -- and a stale one is MARKED rather
  // than quietly used or quietly dropped.

  const PC_CACHE_KEY = 'fl-ux-pc';
  const PC_FRESH_MS = 60 * 1000;

  const PC_QUALITIES = [
    'Striped Delights',
    'Silver Horseheads',
    'Imperial Legitimacy',
    'Time Passing in Office',
    PC_ACADEMICS,
    PC_SOCIETY_FAVOUR,
  ];

  // Bumped whenever a reading is re-banked, and the memo below hangs off it --
  // `pcPurse` is called once per heading on every debounced scan.
  let pcGen = 0;

  // Same rule as the factions and festival scrapes: FL does not render a
  // quality you have none of, so ABSENT means 0 -- but only while the tab's
  // search box is empty, because a filtered list makes absent mean "not on
  // screen" instead.
  function pcFromQualities(scan) {
    const values = {};
    const zeroIsSafe = !scan.filtered;
    for (const name of PC_QUALITIES) {
      const q = scan.values.get(name);
      if (q) values[name] = q.level;
      else if (zeroIsSafe) values[name] = 0;
    }
    return values;
  }

  function bankPcQualities(scan) {
    if (!scan) return false;
    const values = pcFromQualities(scan);
    if (!Object.keys(values).length) return false;
    saveCache(PC_CACHE_KEY, {
      v: 1, at: Date.now(), character: characterName() || null,
      partial: scan.filtered, values: values,
    });
    pcGen++;
    return true;
  }

  // Live if the Myself tab is on screen, else the banked answer, else null.
  function readPcState() {
    const scan = readQualities();
    if (scan) {
      const values = pcFromQualities(scan);
      if (Object.keys(values).length) {
        return {
          live: true, at: Date.now(), character: characterName(),
          partial: scan.filtered, values: values,
        };
      }
    }
    const rec = loadCache(PC_CACHE_KEY, 1);
    if (!rec || !rec.values) return null;
    return {
      live: false, at: rec.at, character: rec.character || null,
      partial: !!rec.partial, values: rec.values,
    };
  }

  // What the badges need: the figures, how old they are, and a signature that
  // changes when any of that does. Null for "nothing has ever been read",
  // which every caller has to say rather than guess around.
  //
  // The age in the signature is BUCKETED. A raw timestamp there would differ
  // on every scan, so every badge would be rebuilt on every DOM mutation for
  // ever -- and each of those writes is itself a mutation.
  let pcPurseMemo = null;
  function pcPurse() {
    const key = pcGen + '@' + Math.floor(Date.now() / PC_FRESH_MS);
    if (pcPurseMemo && pcPurseMemo.key === key) return pcPurseMemo.value;
    let value = null;
    try {
      value = buildPcPurse();
    } catch (e) {
      value = null;
    }
    pcPurseMemo = { key: key, value: value };
    return value;
  }

  function buildPcPurse() {
    const state = readPcState();
    if (!state) return null;
    const at = function (name) {
      const v = state.values[name];
      return typeof v === 'number' ? v : null;
    };
    const stale = !state.live && (Date.now() - state.at) > PC_FRESH_MS;
    const purse = {
      sd: at('Striped Delights'),
      sh: at('Silver Horseheads'),
      legitimacy: at('Imperial Legitimacy'),
      time: at('Time Passing in Office'),
      academics: at(PC_ACADEMICS),
      society: at(PC_SOCIETY_FAVOUR),
      live: !!state.live,
      at: state.at,
      partial: !!state.partial,
      stale: stale,
    };
    purse.sig = [purse.sd, purse.sh, purse.academics, purse.society,
      purse.live ? 'live' : (stale ? 'stale' : 'fresh')].join('/');
    return purse;
  }

  // --- what an ending pays ------------------------------------------------
  //
  // Pure: an ending row and a purse in, the payout out. `purse` may be null
  // (never read) and any figure in it may be null, and the result says so
  // rather than filling the gap with a zero -- "no Delights" and "your
  // Delights have not been read" are different claims, and only one of them is
  // safe to put on a badge.

  function pcCashPlan(entry) {
    return PC_CASHOUT_BY_NAME.get(normalizeName(entry.name)) || null;
  }

  // The priced part of a payout at a given figure of the currency. Used both
  // for the total and to find the next step up.
  function pcCashEcho(plan, n) {
    let echo = 0;
    for (const item of plan.items) {
      if (!item.echo) continue;
      echo += item.echo * (item.count ? item.count(n) : item.flat);
    }
    return echo;
  }

  // The least of the currency that pays MORE than you would get now. The
  // rounding is the whole reason to ask: 105 and 176 are worth waiting for and
  // 140 is not. Searched rather than read off PC_TIERS, so the two stay
  // independent and the tests can check one against the other.
  function pcNextStep(plan, have) {
    if (have == null || !plan.currency) return null;
    const now = pcCashEcho(plan, have);
    for (let n = have + 1; n <= have + 200; n++) {
      const then = pcCashEcho(plan, n);
      if (then > now) return { at: n, more: n - have, echo: then };
    }
    return null;
  }

  function pcCashout(entry, purse) {
    const plan = pcCashPlan(entry);
    if (!plan) return null;
    const have = !purse ? null
      : (plan.spends === 'sd' ? purse.sd : (plan.spends === 'sh' ? purse.sh : null));
    const items = [];
    let echo = 0;
    let priced = true;
    let favours = false;
    for (const item of plan.items) {
      const row = {
        name: item.name, each: item.echo || 0, favour: !!item.favour,
        note: item.note || null, count: null, unsure: false, capped: false,
      };
      if (item.count) row.count = have == null ? null : item.count(have);
      else row.count = item.flat;
      if (row.count == null) row.unsure = true;
      if (item.needs) {
        row.needs = item.needs;
        const level = purse && item.needs.quality === PC_ACADEMICS ? purse.academics : null;
        if (level == null) row.unsure = true;
        else if (level < item.needs.atLeast) row.count = 0;
      }
      if (item.cap) {
        const level = purse ? purse.society : null;
        if (level == null) row.unsure = true;
        else if (level >= item.cap) { row.count = 0; row.capped = true; }
      }
      if (row.favour) favours = true;
      if (row.each) {
        if (row.count == null) priced = false;
        else echo += row.count * row.each;
      }
      items.push(row);
    }
    return {
      name: plan.name,
      spends: plan.spends,
      currency: plan.currency,
      have: have,
      items: items,
      extras: plan.extras || null,
      echo: priced ? echo : null,
      favours: favours,
      next: pcNextStep(plan, have),
      // Only a payout that depends on a READING can go stale. The two fixed
      // ones are as true an hour later as they are now.
      stale: !!(purse && purse.stale && plan.currency),
      read: purse ? purse.at : null,
      live: !!(purse && purse.live),
    };
  }

  // Every ending at once, so a tooltip can say what taking this one gives up.
  // That comparison is the actual decision at Time 12: Honoured with a State
  // Dinner pays two Favours and empties a purse that may be worth 40 Echoes.
  function pcCashoutAll(purse) {
    return PC_CASHOUTS.map(function (plan) { return pcCashout(plan, purse); });
  }

  // Which ending pays most, or null when that cannot be said. "Best" is a
  // COMPARISON, so it is only made when every ending can be compared: with a
  // currency unread the two fixed rewards would win by default, and the mark
  // would be an artefact of the missing reading rather than a claim about your
  // term.
  function pcBestCashout(cashouts) {
    if (!cashouts.length) return null;
    if (!cashouts.every(function (cash) { return cash.echo != null; })) return null;
    let best = null;
    for (const cash of cashouts) if (!best || cash.echo > best.echo) best = cash;
    return best;
  }

  // 40E, 57.5E. The halves are real -- a dear item is 12.5 Echoes -- so they
  // are not rounded away.
  function pcEchoText(echo) {
    return (Math.round(echo * 100) / 100) + 'E';
  }

  // --- looking a storylet up ---------------------------------------------
  //
  // Exact match on the punctuation-squashed name, through the same normaliser
  // the Spite and zee tables use. The one tolerance is a PREFIX: Fallen London
  // titles a storylet inside a named activity "Fruits of the Zee: Supplication
  // on the Shore", and nothing has confirmed whether it does the same here. So
  // a name carrying a leading "...: " is retried on the half after the colon --
  // which can only ever tolerate a prefix, never widen what matches.

  const PC_BY_NAME = new Map();
  const PC_BY_BRANCH = new Map();
  for (const entry of PC_OPTIONS) {
    const key = normalizeName(entry.name);
    if (!PC_BY_NAME.has(key)) PC_BY_NAME.set(key, []);
    PC_BY_NAME.get(key).push(entry);
    if (entry.branch) PC_BY_BRANCH.set(normalizeName(entry.branch), entry);
  }

  function pcKeys(name) {
    const raw = String(name == null ? '' : name);
    const keys = [normalizeName(raw)];
    const colon = raw.indexOf(':');
    if (colon !== -1) keys.push(normalizeName(raw.slice(colon + 1)));
    return keys.filter(Boolean);
  }

  function lookupPcStorylet(name) {
    for (const key of pcKeys(name)) {
      const hit = PC_BY_NAME.get(key);
      if (hit) return hit;
    }
    return null;
  }

  function lookupPcBranch(name) {
    for (const key of pcKeys(name)) {
      const hit = PC_BY_BRANCH.get(key);
      if (hit) return hit;
    }
    return null;
  }

  // --- what a row is worth ------------------------------------------------

  // The guide's Net column, from the parts. A row paying "one of the two, the
  // game's choice" is worth that much once, not twice.
  function pcNet(entry) {
    if (entry.reset) return null;
    return entry.either ? entry.either : entry.sd + entry.sh + entry.il;
  }

  // The line the storylet badge speaks for: the best net on offer. Both
  // branches of Within their rights and A plea for pardon are real choices --
  // the losing one is how you buy Imperial Legitimacy back, which is the whole
  // point of it -- so the tooltip lists both and only the badge picks.
  function bestPcOption(entries) {
    let best = null;
    for (const entry of entries) {
      if (pcNet(entry) == null) continue;
      if (!best || pcNet(entry) > pcNet(best)) best = entry;
    }
    return best || entries[0];
  }

  const PC_CLASS = 'fl-ux-pc';
  const PC_FLAG = 'flUxPc';
  const PC_BRANCH_CLASS = 'fl-ux-pc-branch';
  const PC_BRANCH_FLAG = 'flUxPcBranch';

  // --- the mark, and then the colour --------------------------------------
  //
  // Imperial Legitimacy is this activity's Troubled Waters: the number that,
  // at 0, ends the term at once with no rewards and a trip back to the Foreign
  // Office. Nine of the rows are worth exactly +5, so the net separates almost
  // nothing and what an option does to Legitimacy separates everything. That
  // is what a Port Carnelian badge is really about, and it is said TWICE --
  // once in a mark and once in a colour.
  //
  // Two marks, not one, and they are told apart by SHAPE:
  //
  //   up    the option BUYS Legitimacy back. Both of these cost resources to
  //         take -- they are the rows worth taking when Legitimacy is low.
  //   down  the option's net was paid for OUT OF Legitimacy.
  //   none  it does not touch Legitimacy at all.
  //
  // Shape rather than colour because THE COLOUR MAY NOT BE READABLE. This
  // repo's reader is red-green weak (see AGENTS.md), and red against green is
  // exactly the pair that collapses. Read the marks alone and every badge here
  // is complete; the colour only makes a screenful quicker to skim. Anything
  // added to this feature later has to hold to that -- a claim that exists
  // only in a hue is a claim this reader cannot see.
  const PC_LEGIT_GAIN_MARK = '▲';
  const PC_LEGIT_SPEND_MARK = '▼';

  function pcLegitMark(entry) {
    if (entry.reset || !entry.il) return '';
    return entry.il > 0 ? PC_LEGIT_GAIN_MARK : PC_LEGIT_SPEND_MARK;
  }

  // The colour says the same thing the mark does, and nothing else. It is NOT
  // a ladder up the net any more: ranking nine identical +5s by shade was
  // spending the one channel this badge has on the number that varies least.
  //
  // The two Legitimacy hues are still picked to survive the deficiency as far
  // as a hue can. They are separated along the BLUE-YELLOW axis, which
  // red-green weakness leaves intact: the green leans teal and the red leans
  // warm brick, rather than being the textbook pair that reads as one muddy
  // colour twice.
  const PC_COLOR_LEGIT_GAIN = '#1b7d67';   // teal-leaning green, white ink
  const PC_COLOR_LEGIT_SPEND = '#a33520';  // warm brick red, white ink
  // Legitimacy-neutral -- most of the table, and the rows with nothing to warn
  // about. Light blue because it is the one family neither of those two can be
  // taken for under any deficiency. It is a LIGHT background, so it takes dark
  // ink: white on it is not legible (the DEPTH_INK lesson).
  const PC_COLOR_NEUTRAL = '#8ec6dd';
  const PC_INK_NEUTRAL = '#0f2a33';
  // The four Time 12 endings. Legitimacy-IRRELEVANT rather than neutral, and
  // they read "cash out" rather than a number, so a deep slate blue keeps them
  // out of the light blue run without implying they are on the same scale.
  const PC_COLOR_END = '#3f5f8a';

  // Colour and ink together, since the light one cannot take the default white.
  // `ink` is left off the dark three so makeBadge's own default stands.
  function pcPaint(entry) {
    if (entry.reset) return { color: PC_COLOR_END };
    if (entry.il > 0) return { color: PC_COLOR_LEGIT_GAIN };
    if (entry.il < 0) return { color: PC_COLOR_LEGIT_SPEND };
    return { color: PC_COLOR_NEUTRAL, ink: PC_INK_NEUTRAL };
  }

  // The endings' badge is the only figure in this feature that comes from YOUR
  // numbers rather than the table, so it says how sure of them it is: a favour
  // mark when part of the payout is Favours (0 Echoes, by the rule above), a
  // question mark when the reading behind it is over a minute old, and the
  // original 'cash out' label when there is no reading at all.
  function pcCashBadgeText(cash) {
    if (!cash) return 'cash out';
    const mark = cash.favours ? ' ' + PC_FAVOUR_MARK : '';
    if (cash.echo == null) return 'cash out' + mark;
    return pcEchoText(cash.echo) + mark + (cash.stale ? ' ' + PC_STALE_MARK : '');
  }

  function pcBadgeText(entry, purse) {
    if (entry.reset) return pcCashBadgeText(pcCashout(entry, purse));
    const net = pcNet(entry);
    return (net > 0 ? '+' + net : String(net))
      + pcLegitMark(entry)
      + (entry.fate ? ' Fate' : '');
  }

  function pcRange(pair) {
    if (!pair) return null;
    return pair[0] === pair[1] ? String(pair[0]) : pair[0] + '–' + pair[1];
  }

  function pcWhen(entry) {
    return 'Time Passing in Office ' + pcRange(entry.time)
      + ' · ' + (entry.airs ? 'Airs ' + pcRange(entry.airs) : 'any Airs');
  }

  // The currency changes, spelled out. `either` is deliberately its own
  // sentence: "+10 of one of the two" is not "+10 of each", and a row that read
  // as the second would look worth twice what it is.
  function pcChangeWords(entry) {
    if (entry.reset) {
      if (entry.reset === 'both') return 'Spends BOTH Striped Delights and Silver Horseheads.';
      return 'Spends all your '
        + (entry.reset === 'sd' ? 'Striped Delights' : 'Silver Horseheads') + '.';
    }
    const bits = [];
    if (entry.either) bits.push('Striped Delights OR Silver Horseheads +' + entry.either
      + ' (the game picks which, not you)');
    if (entry.sd) bits.push('Striped Delights ' + (entry.sd > 0 ? '+' : '') + entry.sd);
    if (entry.sh) bits.push('Silver Horseheads ' + (entry.sh > 0 ? '+' : '') + entry.sh);
    if (entry.il) bits.push('Imperial Legitimacy ' + (entry.il > 0 ? '+' : '') + entry.il);
    return bits.join(', ') + '.';
  }

  function pcOptionLines(entry, lead) {
    const lines = [lead + pcChangeWords(entry)];
    if (!entry.reset) lines.push('      net ' + (pcNet(entry) > 0 ? '+' : '') + pcNet(entry));
    if (entry.needs) lines.push('      needs ' + entry.needs);
    if (entry.fate) lines.push('      Fate-locked.');
    if (entry.note) lines.push('      ' + entry.note);
    return lines;
  }

  // The cash-out arithmetic, spelled out. This is the whole argument for the
  // one badge here that quotes your own numbers: what you hold, what it turns
  // into, what that is worth, what the next step up would cost you in actions
  // -- and, for the two endings that pay a fixed reward, what taking one gives
  // up, since they empty both purses.
  function pcCashLines(cash, others) {
    const lines = [''];
    if (!cash.currency) {
      lines.push('Cash out now — a fixed reward, whatever the two purses hold:');
    } else if (cash.have == null) {
      lines.push('Cash out now — your ' + cash.currency + ' has not been read yet, '
        + 'so this cannot be priced.');
    } else {
      lines.push('Cash out now — ' + cash.currency + ' ' + cash.have + ' ('
        + (cash.live ? 'read live' : 'read ' + ageText(cash.read)) + '):');
    }
    for (const row of cash.items) {
      let line = '  ' + (row.count == null ? '?' : row.count) + ' × ' + row.name;
      if (row.favour) line += ' ' + PC_FAVOUR_MARK;
      if (row.each) line += ' (' + pcEchoText(row.each) + ' each)';
      if (row.needs) line += ' — needs ' + row.needs.quality + ' ' + row.needs.atLeast;
      if (row.capped) line += ' — you are at the cap of ' + PC_SOCIETY_CAP
        + ', so this one is not given at all';
      lines.push(line);
      if (row.note) lines.push('      ' + row.note);
    }
    if (cash.echo != null) {
      lines.push('  = ' + pcEchoText(cash.echo) + (cash.favours ? ', and the Favours' : ''));
    }
    if (cash.next) {
      lines.push('  Next step up at ' + cash.next.at + ' (+' + cash.next.more + ') — '
        + pcEchoText(cash.next.echo) + '. The rounding is why 105 and 176 are worth '
        + 'waiting for and 140 is not.');
    }
    for (const extra of (cash.extras || [])) lines.push('  also ' + extra);
    if (cash.spends === 'both') {
      const rivals = (others || []).filter(function (other) {
        return other !== cash && other.currency && other.echo != null && other.echo > 0;
      });
      if (rivals.length) {
        lines.push('  This empties BOTH purses. Cashing one in instead: '
          + rivals.map(function (other) {
            return other.currency + ' ' + pcEchoText(other.echo);
          }).join(', ') + '.');
      }
    }
    if (cash.stale) {
      lines.push('  ' + PC_STALE_MARK + ' this reading is over a minute old and every action '
        + 'of a term moves both currencies, so the figure may already be behind.');
    }
    return lines;
  }

  const PC_CASH_FOOTER = PC_FAVOUR_MARK + ' a faction Favour: a story quality capped at '
    + PC_SOCIETY_CAP + ', which you cannot sell. Those — and Tribute, which has no market '
    + 'price either — count as 0 here rather than let a fixed reward out-rank a real cash-out '
    + 'on a number nobody acts on. A Favour in High Places is NOT one of them: despite the '
    + 'name it is an ordinary item, and it is priced like one. Item prices are the Bazaar\'s: '
    + '2.5 for a cheap one, 12.5 for a dear one, at the wiki\'s bankers\' rounding.';

  function pcCashBlock(entry, purse) {
    if (!entry.reset) return [];
    const all = pcCashoutAll(purse);
    const key = normalizeName(entry.name);
    const cash = all.filter(function (one) { return normalizeName(one.name) === key; })[0];
    if (!cash) return [];
    return pcCashLines(cash, all).concat(['', PC_CASH_FOOTER]);
  }

  // Carried on every tooltip, neutral rows included, because it is the legend
  // for the two marks as well as the rule they are about.
  const PC_FOOTER = PC_LEGIT_SPEND_MARK + ' this net is paid for out of Imperial Legitimacy. '
    + PC_LEGIT_GAIN_MARK + ' this line buys Legitimacy back. No mark: it does not touch it.\n'
    + 'Imperial Legitimacy reaching 0 ends the term at once, with no rewards '
    + 'and a trip back to the Foreign Office. It carries over between terms; the two '
    + 'currencies do not.';

  // What to draw on a storylet heading. Pure (entries in, spec out), so every
  // badge can be asserted on without a DOM.
  function pcStoryletSpec(entries, purse) {
    const best = bestPcOption(entries);
    const lines = [entries[0].name, pcWhen(best), ''];
    if (entries.length === 1) {
      lines.push.apply(lines, pcOptionLines(best, ''));
    } else {
      lines.push('Both branches:');
      for (const entry of entries) {
        lines.push.apply(lines, pcOptionLines(entry, '  • ' + entry.branch + ' — '));
      }
      lines.push('');
      lines.push('The badge is the better net. The other branch is how you buy Imperial '
        + 'Legitimacy back, which is worth taking when it is running low.');
    }
    lines.push.apply(lines, pcCashBlock(best, purse));
    lines.push('');
    lines.push(PC_FOOTER);
    const paint = pcPaint(best);
    return {
      text: pcBadgeText(best, purse), color: paint.color, ink: paint.ink,
      // `cash` is not for makeBadge, which ignores it. It is how `pcRatings`
      // knows an ending is on screen -- the one place a stale reading would be
      // a wrong number rather than a missing one, and so the only place worth
      // booting a hidden frame for.
      cash: !!best.reset, title: lines.join('\n'),
    };
  }

  // And on one branch inside an opened storylet.
  function pcBranchSpec(entry, purse) {
    const lines = [entry.name + ': ' + entry.branch, pcWhen(entry), ''];
    lines.push.apply(lines, pcOptionLines(entry, ''));
    lines.push.apply(lines, pcCashBlock(entry, purse));
    lines.push('');
    lines.push(PC_FOOTER);
    const paint = pcPaint(entry);
    return {
      text: pcBadgeText(entry, purse), color: paint.color, ink: paint.ink,
      cash: !!entry.reset, title: lines.join('\n'),
    };
  }

  // What to draw on ONE heading, whichever kind of heading it is.
  //
  // Fallen London does not lay this activity out the way the guide reads it.
  // Captured in-game 2026-09-10: the port has a SINGLE storylet, "Matters of
  // State" (wiki ID 194331, location Heartscross House), and every row of the
  // guide's table is an OPTION inside it. So the names the guide calls
  // storylets arrive on `.branch__title`; and the guide's own branch names --
  // "Close your door without a word" and the other three -- only appear once
  // one of the two split storylets has been opened, by which point THAT is the
  // `.storylet-root__heading`. Either kind of name can turn up under either
  // selector, so both lookups are tried on both. This is what the feature got
  // wrong on its first outing: matching the table's storylet names against
  // storylet headings alone, it drew nothing at all in Port Carnelian.
  //
  // No name is in both tables, so which lookup wins is never a judgement call.
  //
  // `here` is the area gate, passed in rather than read, so the whole thing
  // stays pure: name and gate in, badge description out.
  function pcHeadingSpec(name, here, purse) {
    if (!name) return null;
    const entries = lookupPcStorylet(name);
    if (entries) {
      const strict = entries.some(function (e) { return e.strict; });
      return here || !strict ? pcStoryletSpec(entries, purse) : null;
    }
    const entry = lookupPcBranch(name);
    if (!entry) return null;
    return here || !entry.strict ? pcBranchSpec(entry, purse) : null;
  }

  // --- the area gate ------------------------------------------------------
  //
  // Captured in-game 2026-09-10, in the screen-reader greeting:
  //
  //   It's TheFairUnknown! Welcome to Heartscross House, delicious friend!
  //
  // The greeting names the governor's SEAT rather than the port. "Heartscross
  // House" is the wiki page; "Port Carnelian" is only what the zee map calls
  // the destination -- the very split ZEE_PORTS already records with `as`. The
  // original one-name guess here was that destination name, which the greeting
  // never says, so the gate could not fire and both strict rows stayed dark
  // for a whole term.
  //
  // Both names are listed: the capture is from the seat screen, and nothing
  // promises every screen of a term greets you the same way.
  //
  // Still confirm-only, like ZEE_AREAS and unlike SPITE_AREAS: it may say
  // "yes, definitely here" and must never say "no". The option table stays the
  // real scope.
  const PC_AREAS = ['Heartscross House', 'Port Carnelian'].map(normalizeName);

  function inPortCarnelian() {
    const area = normalizeName(currentArea());
    return !!area && PC_AREAS.indexOf(area) !== -1;
  }

  // Two names are not distinctive enough to badge on the table alone, so those
  // two wait for the greeting to confirm where we are:
  //
  //   His Amused Lordship -- the wiki files this one as "His Amused Lordship
  //     - 2", which is proof that something else already owns the plain name.
  //   Inconvenienced -- one ordinary English word.
  //
  // Everything else in the table is a phrase Fallen London uses here and, as
  // far as the wiki shows, nowhere else.
  const PC_STORYLET_SELECTOR = '.storylet__heading, .storylet-root__heading';
  // Shared with the Fruits of the Zee supplication badges, which own a
  // different class and flag pair, so the two can decorate the same branch
  // without either clearing the other.
  const PC_BRANCH_SELECTOR = '.branch__title';

  // The endings are the one screen in this feature where a stale reading is a
  // WRONG number rather than a missing one, so standing in front of one is
  // what pays for a background refresh: the same hidden-frame load of /myself
  // the panels use, throttled to one a minute and off entirely when the
  // auto-refresh toggle is. `schedule()` afterwards because banking a reading
  // mutates nothing in the page, so nothing else would redraw the badge.
  let pcRefreshAt = 0;
  function pcMaybeRefresh(purse) {
    if (!autoRefreshEnabled()) return;
    if (purse && (purse.live || !purse.stale)) return;
    if (Date.now() - pcRefreshAt < PC_FRESH_MS) return;
    pcRefreshAt = Date.now();
    refreshBackgroundState().then(function () { schedule(); });
  }

  function pcRatings() {
    const here = inPortCarnelian();
    const purse = pcPurse();
    // The gate is part of a badge's identity, not just the name. A strict row
    // draws nothing until the greeting can be read, and the greeting is read
    // fresh on every scan -- so without this in `value`, a row suppressed on
    // one scan would keep its "nothing to say" flag and never redraw once the
    // greeting turned up. The purse is in there for the same reason: an
    // ending's badge IS your Delights and Horseheads, so a badge drawn before
    // the reading arrived has to redraw when it does.
    const sig = (here ? '@here' : '@?') + '#' + (purse ? purse.sig : 'unread');
    let ending = false;
    function decorate(cls, flag) {
      return function (head) {
        const name = headingName(head);
        const spec = pcHeadingSpec(name, here, purse);
        if (spec && spec.cash) ending = true;
        attachBadge(head, {
          cls: cls,
          flag: flag,
          value: name && name + sig,
          spec: spec,
          place: 'after',
        });
      };
    }
    document.querySelectorAll(PC_STORYLET_SELECTOR).forEach(decorate(PC_CLASS, PC_FLAG));
    document.querySelectorAll(PC_BRANCH_SELECTOR).forEach(decorate(PC_BRANCH_CLASS, PC_BRANCH_FLAG));
    if (ending) pcMaybeRefresh(purse);
  }

  // === feature: Voyages of Scientific Discovery ==========================
  //
  // The Dilmun Club's scientific voyages, and the second feature here that
  // badges storylets rather than cards. It covers three screens that look
  // unrelated and are one economy:
  //
  //   PREPARATORY RESEARCH, at Your Lodgings -- turn items and Favours into
  //     pages before you sail. Every option locks itself out once you hold
  //     enough pages, so the ORDER you take them in decides the total.
  //   THE ISLANDS -- Bullbone, Corpsecage and Grunting Fen, each a fixed
  //     carousel of 21 actions measured by "Orthos is Coming!". Which pair of
  //     actions is in front of you is decided by the Orthos band, and each pair
  //     is the same question: pages of one type, or a pile of goods instead.
  //   ORGANISE YOUR RESEARCH, back at Your Lodgings -- spend the pages.
  //
  // The three currencies are Page of Prelapsarian Archaeological Notes (AN --
  // the island pages abbreviate it PAN), Page of Cryptopalaeontological Notes
  // (CN) and Page of Theosophistical Notes (TN).
  //
  // **What the badge says, and why.** Colour is the NOTE TYPE and the text is
  // the amount, because that is the only question these screens ask. You sail
  // to an island for one type -- Bullbone pays CN, Corpsecage AN, Grunting Fen
  // TN -- and at every Orthos band you are choosing between an action that pays
  // your type and one that pays goods. Ranking those two against each other
  // would need an exchange rate between pages and Echoes that nothing supports,
  // so the badge does not invent one: a paying-in-goods action is LABELLED with
  // what it pays rather than scored. On the Organise screen there is no such
  // problem -- everything there is priced -- so those rows carry the guide's own
  // Echoes-per-note, which is the figure that decides between them (a 500-note
  // option pays 10 pence a note; a 120-note collation pays 6.25).
  //
  // Transcribed from Embarking on a Voyage of Scientific Discovery (Guide) for
  // the two Lodgings screens, and from the "Expedition Progress" table on each
  // island's own page (Bullbone Island, Corpsecage Island, Grunting Fen) for
  // the carousels -- the guide transcludes those tables rather than restating
  // them, so the island page is the source either way. Corrections go in
  // VSD_OPTIONS and nowhere else.
  //
  // One entry per row of those tables:
  //
  //   phase     'prep' | 'island' | 'organise'.
  //   island    which island, on a phase 'island' row.
  //   storylet  the storylet, as the wiki titles it.
  //   branch    the option inside it.
  //   orthos    [min, max] band of Orthos is Coming! the row is offered in.
  //   ch        the challenge, verbatim, or null where there is none.
  //   an/cn/tn  pages gained. Negative on the Organise rows, which spend them.
  //   headline  what the row pays when it pays no pages -- transcribed, not
  //             derived, because "the item worth quoting" is a judgement.
  //   orElse    the wiki's explicit OR: one action, two different payouts, and
  //             the game picks. Held apart from the page counts so the two can
  //             never be read as a sum.
  //   luck      { odds, win, lose } for the three end-of-voyage gambles.
  //   perNote   pence per note, on an Organise row the guide prices.
  //   cost      what it costs, verbatim. needs: what it is gated on.
  //   fail      what a failure costs.
  //   note      anything that does not fit the fields above.

  // A voyage is 21 actions on the island: 1 to arrive, 19 of carousel, 1 to
  // leave, assuming every challenge passes. A failure still advances Orthos,
  // by 1 change point instead of 2, so a bad run is longer rather than lost.
  const VSD_ISLAND_ACTIONS = 21;

  const VSD_ISLANDS = [
    {
      name: 'Bullbone Island',
      region: 'Home Waters',
      pays: 'cn',
      best: { an: 78, cn: 249, tn: 40 },
      epa: 1.88,
      echoes: 39.46,
      note: 'The bone island: Horned Skulls at 20 Survey of the Neath’s Bones each, '
        + 'and a Shard of Glim the Size of a Small Child that trades in London for '
        + 'Favours: Rubbery Men.',
    },
    {
      name: 'Corpsecage Island',
      region: 'Stormbones',
      pays: 'an',
      best: { an: 249, cn: 40, tn: 78 },
      epa: 2.00,
      echoes: 42.08,
      note: 'Also where the Beatific Stone is, the Renown: The Church 40 faction item.',
    },
    {
      name: 'Grunting Fen',
      region: 'The Sea of Voices',
      pays: 'tn',
      best: { an: 40, cn: 124, tn: 249 },
      epa: 2.21,
      echoes: 46.50,
      needs: 'Screaming Map',
      note: 'The best Echoes per action of the three, and the only one you need an '
        + 'item to reach.',
    },
  ];

  const VSD_OPTIONS = [
    // === Preparatory Research, at Your Lodgings ==========================
    //
    // Every one of these locks itself out above a page count, so the order
    // matters: take the cheap 50s while you are under 101, and the big
    // single-type options while you are under 301.
    { phase: 'prep', storylet: 'Preparatory Research', branch: 'Pay someone else to research for you',
      an: 50, cn: 50, tn: 50, cost: 'Memory of Distant Shores 80 x',
      needs: 'locked at 101 pages of any type' },
    { phase: 'prep', storylet: 'Preparatory Research', branch: 'Have instruments ground',
      an: 50, cn: 50, tn: 50, cost: 'Whirring Contraption 1 x',
      needs: 'locked at 101 pages of any type' },
    { phase: 'prep', storylet: 'Preparatory Research', branch: 'Consult your current work',
      an: 40, cn: 40, tn: 40, cost: 'Volume of Collated Research 1 x',
      needs: 'locked at 101 pages of any type' },
    { phase: 'prep', storylet: 'Preparatory Research', branch: 'Find promising students',
      an: 50, cn: 50, tn: 50,
      cost: 'Favours: Urchins 2 x, Favours: The Church 2 x, Favours: Revolutionaries 2 x',
      needs: 'locked at 101 pages of any type',
      note: 'The guide lists the three Favours without an OR between them, so this is '
        + 'read as all three.' },
    { phase: 'prep', storylet: 'Preparatory Research', branch: 'Examine your collection of curiosities',
      an: 150, cn: 0, tn: 0, cost: 'Collection of Curiosities 1 x',
      needs: 'locked at 301 AN' },
    { phase: 'prep', storylet: 'Preparatory Research', branch: 'Consult the Masters of the Bazaar',
      an: 100, cn: 0, tn: 0, cost: 'Connected: The Masters of the Bazaar 2 CP',
      needs: 'Connected: The Masters of the Bazaar 3; locked at 301 AN' },
    { phase: 'prep', storylet: 'Preparatory Research', branch: 'Trade in academic favours',
      an: 0, cn: 100, tn: 0,
      cost: 'Connected: Benthic 91–114 CP, Connected: Summerset 91–114 CP',
      needs: 'Connected: Benthic 20 and Connected: Summerset 20; locked at 301 CN' },
    { phase: 'prep', storylet: 'Preparatory Research', branch: 'Test your Unearthly Fossil',
      an: 0, cn: 80, tn: 0, cost: 'Unearthly Fossil 1 x', needs: 'locked at 301 CN' },
    { phase: 'prep', storylet: 'Preparatory Research', branch: 'Look at the current trend for Theosophistry',
      an: 0, cn: 0, tn: 50, cost: 'Favours: Society 3 x', needs: 'locked at 101 TN' },
    { phase: 'prep', storylet: 'Preparatory Research', branch: 'Summarise your experiences in the Wars of Illusion',
      an: 0, cn: 0, tn: 35, cost: 'Extraordinary Implication 1 x',
      needs: 'Embroiled in the Wars of Illusion 25; locked at 101 TN' },

    // === Bullbone Island ==================================================
    { phase: 'island', island: 'Bullbone Island', orthos: [0, 3],
      storylet: 'Bullbone Island', branch: 'The bones of Bullbone',
      ch: 'Watchful 120', an: 0, cn: 12, tn: 0,
      orElse: 'CN 4 x and a Horned Skull instead',
      fail: 'Nightmares +1 CP, Orthos +1 CP instead of +2' },
    { phase: 'island', island: 'Bullbone Island', orthos: [0, 3],
      storylet: 'Bullbone Island', branch: 'Wild bees',
      ch: 'Watchful 120', an: 0, cn: 0, tn: 0,
      headline: 'Beeswax ×120', gain: 'Lump of Lamplighter Beeswax 120 x',
      fail: 'Wounds +1 CP, Orthos +1 CP instead of +2' },
    { phase: 'island', island: 'Bullbone Island', orthos: [0, 3],
      storylet: 'Bullbone Island', branch: 'A skull of Bullbone, borrowed',
      ch: null, an: 0, cn: 0, tn: 0,
      headline: 'Skull ×1', gain: 'Horned Skull 1 x', cost: 'Survey of the Neath’s Bones 20 x' },

    { phase: 'island', island: 'Bullbone Island', orthos: [4, 5],
      storylet: 'The Little Cave', branch: 'Oho – a little writing',
      ch: 'Watchful 123', an: 13, cn: 0, tn: 0, gain: 'Walking the Falling Cities +1 CP',
      fail: 'Nightmares +1 CP, Orthos +1 CP instead of +2' },
    { phase: 'island', island: 'Bullbone Island', orthos: [4, 5],
      storylet: 'The Little Cave', branch: 'Weasels about',
      ch: 'Watchful 123', an: 0, cn: 0, tn: 0,
      headline: 'Scarab ×12', gain: 'Phosphorescent Scarab 12 x',
      fail: 'Wounds +1 CP, Orthos +1 CP instead of +2' },

    { phase: 'island', island: 'Bullbone Island', orthos: [6, 6],
      storylet: 'Where the Wild Mandrakes Grow', branch: 'Creaking in the breeze',
      ch: 'Watchful 124', an: 0, cn: 13, tn: 0,
      gain: 'Seeing through the Eyes of Icarus +1 CP',
      fail: 'Nightmares +1 CP, Orthos +1 CP instead of +2' },
    { phase: 'island', island: 'Bullbone Island', orthos: [6, 6],
      storylet: 'Where the Wild Mandrakes Grow', branch: 'Someone lives near the mandrake-copse',
      ch: 'Watchful 123', an: 0, cn: 0, tn: 0,
      headline: 'Hints ×124', gain: 'Whispered Hint 124 x',
      fail: 'Nightmares +1 CP, Orthos +1 CP instead of +2' },

    { phase: 'island', island: 'Bullbone Island', orthos: [7, 7],
      storylet: 'Sparkling around the Copse', branch: 'Acquisition and screaming',
      ch: 'Watchful 126', an: 0, cn: 0, tn: 0,
      headline: 'Glim ×126', gain: 'Shard of Glim 126 x',
      fail: 'Wounds +1 CP, Orthos +1 CP instead of +2' },
    { phase: 'island', island: 'Bullbone Island', orthos: [7, 7],
      storylet: 'Sparkling around the Copse', branch: 'Looking up', strict: true,
      ch: 'Watchful 126', an: 0, cn: 0, tn: 0,
      headline: 'Pearls ×126',
      gain: 'Moon-Pearl 126 x, Seeing through the Eyes of Icarus +1 CP',
      fail: 'Nightmares +1 CP, Orthos +1 CP instead of +2' },

    { phase: 'island', island: 'Bullbone Island', orthos: [8, 8],
      storylet: 'The Unterzee Waits Silently', branch: 'Creeping closer',
      ch: 'Watchful 124', an: 0, cn: 0, tn: 0,
      headline: 'Screams ×2',
      gain: 'Aeolian Scream 2 x, Seeing through the Eyes of Icarus +1 CP',
      fail: 'Nightmares +1 CP — Orthos goes to 9 either way' },
    { phase: 'island', island: 'Bullbone Island', orthos: [8, 8],
      storylet: 'Spiritual happenings', branch: 'Search the island', strict: true,
      ch: 'Watchful 128', an: 0, cn: 0, tn: 40, gain: 'Memory of Distant Shores 2 x',
      fail: 'Nightmares +1 CP — Orthos goes to 9 either way' },

    { phase: 'island', island: 'Bullbone Island', orthos: [9, 9],
      storylet: 'Gather the Riches of Bullbone Island', branch: 'Making money', strict: true,
      ch: null, an: 0, cn: 0, tn: 0,
      headline: 'Glim ×860', gain: 'Deshrieked Mandrake 1 x, Shard of Glim 860 x' },
    { phase: 'island', island: 'Bullbone Island', orthos: [9, 9],
      storylet: 'Gather the Riches of Bullbone Island', branch: 'That enormous Glim-Shard',
      ch: null, an: 0, cn: 0, tn: 0,
      headline: 'Great Shard', gain: 'Shard of Glim the Size of a Small Child 1 x',
      note: 'The Shard trades in London for Favours: Rubbery Men.' },
    { phase: 'island', island: 'Bullbone Island', orthos: [9, 9],
      storylet: 'Finish your notes on Bullbone Island', branch: 'Write up your notes',
      ch: null, an: 0, cn: 150, tn: 0 },

    { phase: 'island', island: 'Bullbone Island', orthos: [10, 10],
      storylet: 'Orthos has Found You', branch: 'Time to go', strict: true,
      ch: null, an: 0, cn: 0, tn: 0, leave: true },
    { phase: 'island', island: 'Bullbone Island', orthos: [10, 10],
      storylet: 'Orthos has Found You', branch: 'Tarry a little', strict: true,
      ch: 'Luck 70%', an: 0, cn: 0, tn: 0,
      luck: { odds: 0.7, type: 'cn', win: 20, lose: 15 },
      fail: 'CN −5, AN −5, TN −5' },
    { phase: 'island', island: 'Bullbone Island', orthos: [10, 10],
      storylet: 'Orthos has Found You', branch: 'Cut it fine', strict: true,
      ch: 'Luck 30%', an: 0, cn: 0, tn: 0,
      luck: { odds: 0.3, type: 'cn', win: 40, lose: 15 },
      fail: 'CN −5, AN −5, TN −5' },

    // === Corpsecage Island ================================================
    { phase: 'island', island: 'Corpsecage Island', orthos: [0, 3],
      storylet: 'Corpsecage Island', branch: 'Digging up bones and rough justice',
      ch: 'Watchful 120', an: 12, cn: 0, tn: 0, gain: 'Walking the Falling Cities +1 CP',
      fail: 'Nightmares +1 CP, Orthos +1 CP instead of +2' },
    { phase: 'island', island: 'Corpsecage Island', orthos: [0, 3],
      storylet: 'Corpsecage Island', branch: 'The Corpsecage bat',
      ch: 'Watchful 120', an: 0, cn: 0, tn: 0,
      headline: 'Clues ×60', gain: 'Cryptic Clue 60 x, Walking the Falling Cities +1 CP',
      fail: 'Nightmares +1 CP, Orthos +1 CP instead of +2' },

    { phase: 'island', island: 'Corpsecage Island', orthos: [4, 5],
      storylet: 'The Religions of Corpsecage Island', branch: 'Examine the ruins for clues',
      ch: 'Watchful 122', an: 0, cn: 0, tn: 13, gain: 'Walking the Falling Cities +1 CP',
      orElse: 'Mystery of the Elder Continent 5 x instead',
      fail: 'Nightmares +1 CP, Orthos +1 CP instead of +2' },
    { phase: 'island', island: 'Corpsecage Island', orthos: [4, 5],
      storylet: 'The Religions of Corpsecage Island', branch: 'What’s written here?',
      ch: 'Watchful 122', an: 0, cn: 0, tn: 0,
      headline: 'Clues ×61', gain: 'Cryptic Clue 61 x',
      orElse: 'Mystery of the Elder Continent 5 x and Walking the Falling Cities +1 CP instead',
      fail: 'Wounds +1 CP, Orthos +1 CP instead of +2' },

    { phase: 'island', island: 'Corpsecage Island', orthos: [6, 6],
      storylet: 'Up the Hill', branch: 'See what you can dig up', strict: true,
      ch: 'Watchful 124', an: 13, cn: 0, tn: 0, gain: 'Walking the Falling Cities +1 CP',
      fail: 'Wounds +1 CP, Orthos +1 CP instead of +2' },
    { phase: 'island', island: 'Corpsecage Island', orthos: [6, 6],
      storylet: 'Up the Hill', branch: 'Caging ancient echoes',
      ch: 'Watchful 124', an: 0, cn: 0, tn: 0,
      headline: 'Shrieks ×62', gain: 'Primordial Shriek 62 x',
      fail: 'Nightmares +1 CP, Orthos +1 CP instead of +2' },

    { phase: 'island', island: 'Corpsecage Island', orthos: [7, 7],
      storylet: 'Another Sort of Relic', branch: 'Rummage around the fire',
      ch: 'Watchful 127', an: 0, cn: 0, tn: 0,
      headline: 'Jade ×77',
      gain: 'Prison Shiv 1 x (up to 1), Prisoner’s Mask 1 x, Jade Fragment 77 x, '
        + 'Proscribed Material 12 x',
      fail: 'Nightmares +1 CP, Orthos +1 CP instead of +2' },
    { phase: 'island', island: 'Corpsecage Island', orthos: [7, 7],
      storylet: 'Another Sort of Relic', branch: 'A message long cold',
      ch: 'Watchful 127', an: 0, cn: 0, tn: 0,
      headline: 'Maps ×10',
      gain: 'Map Scrap 10 x, Cryptic Clue 13 x, Seeing through the Eyes of Icarus +1 CP',
      fail: 'Nightmares +1 CP, Orthos +1 CP instead of +2' },

    { phase: 'island', island: 'Corpsecage Island', orthos: [8, 8],
      storylet: 'The Shore Near the Jetty', branch: 'The zee-caves',
      ch: 'Watchful 127', an: 0, cn: 0, tn: 0,
      headline: 'Proscribed ×125', gain: 'Proscribed Material 125 x',
      fail: 'Wounds +1 CP — Orthos goes to 9 either way' },
    { phase: 'island', island: 'Corpsecage Island', orthos: [8, 8],
      storylet: 'The Back of Corpsecage', branch: 'Inauspicious iron',
      ch: 'Watchful 127', an: 0, cn: 40, tn: 0,
      gain: 'Nodule of Warm Amber 10 x, Seeing through the Eyes of Icarus +1 CP',
      fail: 'Nightmares +1 CP — Orthos goes to 9 either way' },

    { phase: 'island', island: 'Corpsecage Island', orthos: [9, 9],
      storylet: 'Looking for Relics', branch: 'In the bag you go',
      ch: null, an: 0, cn: 0, tn: 0,
      headline: 'Relics ×200',
      gain: 'Relic of the Third City 100 x, Relic of the Fourth City 100 x' },
    { phase: 'island', island: 'Corpsecage Island', orthos: [9, 9],
      storylet: 'Finish your notes on Corpsecage Island', branch: 'Writing it all down',
      ch: null, an: 150, cn: 0, tn: 0 },

    { phase: 'island', island: 'Corpsecage Island', orthos: [10, 10],
      storylet: 'Orthos Has Set Upon You', branch: 'Time to go', strict: true,
      ch: null, an: 0, cn: 0, tn: 0, leave: true },
    { phase: 'island', island: 'Corpsecage Island', orthos: [10, 10],
      storylet: 'Orthos Has Set Upon You', branch: 'Tarry a little', strict: true,
      ch: 'Luck 70%', an: 0, cn: 0, tn: 0,
      luck: { odds: 0.7, type: 'an', win: 20, lose: 15 },
      fail: 'CN −5, AN −5, TN −5' },
    { phase: 'island', island: 'Corpsecage Island', orthos: [10, 10],
      storylet: 'Orthos Has Set Upon You', branch: 'Cut it fine', strict: true,
      ch: 'Luck 30%', an: 0, cn: 0, tn: 0,
      luck: { odds: 0.3, type: 'an', win: 40, lose: 15 },
      fail: 'CN −5, AN −5, TN −5' },

    // === Grunting Fen =====================================================
    { phase: 'island', island: 'Grunting Fen', orthos: [0, 3],
      storylet: 'Grunting Fen', branch: 'Listen to the island',
      ch: 'Watchful 120', an: 0, cn: 0, tn: 12, gain: 'Touched by Fingerwork +1 CP',
      fail: 'Nightmares +1 CP, Orthos +1 CP instead of +2' },
    { phase: 'island', island: 'Grunting Fen', orthos: [0, 3],
      storylet: 'Grunting Fen', branch: 'Do a survey', strict: true,
      ch: 'Watchful 122', an: 0, cn: 0, tn: 0,
      headline: 'Clues ×11', gain: 'Cryptic Clue 11 x, Map Scrap 10 x',
      fail: 'Nightmares +1 CP, Orthos +1 CP instead of +2' },

    { phase: 'island', island: 'Grunting Fen', orthos: [4, 5],
      storylet: 'What is Grunting Fen Made of?', branch: 'What manner of things live here?',
      ch: 'Watchful 122', an: 0, cn: 12, tn: 0, gain: 'Touched by Fingerwork +1 CP',
      fail: 'Nightmares +1 CP, Orthos +1 CP instead of +2' },
    { phase: 'island', island: 'Grunting Fen', orthos: [4, 5],
      storylet: 'What is Grunting Fen Made of?', branch: 'Try some beach-combing instead',
      ch: 'Watchful 124', an: 0, cn: 0, tn: 0,
      headline: 'Glim ×100',
      gain: 'Shard of Glim 100 x, Phosphorescent Scarab 1 x, Relic of the Fourth City 3 x',
      fail: 'Nightmares +1 CP, Orthos +1 CP instead of +2' },

    { phase: 'island', island: 'Grunting Fen', orthos: [6, 6],
      storylet: 'The Skull of a Long-Dead God?',
      branch: 'What can you learn of matters spiritual and supernatural?',
      ch: 'Watchful 124', an: 0, cn: 0, tn: 13, gain: 'Touched by Fingerwork +1 CP',
      fail: 'Nightmares +1 CP, Orthos +1 CP instead of +2' },
    { phase: 'island', island: 'Grunting Fen', orthos: [6, 6],
      storylet: 'The Skull of a Long-Dead God?', branch: 'Follow the trail of history',
      ch: 'Watchful 126', an: 0, cn: 0, tn: 0,
      headline: 'Shores ×2', gain: 'Memory of Distant Shores 2 x, Cryptic Clue 13 x',
      fail: 'Nightmares +1 CP, Orthos +1 CP',
      note: 'The island page records NO Orthos gain on a success here — the only action '
        + 'in the carousel that does not advance the clock when it works. Treat that as '
        + 'the page having it, not as confirmed in game.' },

    { phase: 'island', island: 'Grunting Fen', orthos: [7, 7],
      storylet: 'The Treasures of Grunting Fen', branch: 'Catch some', strict: true,
      ch: 'Watchful 126', an: 0, cn: 13, tn: 0,
      fail: 'Nightmares +1 CP, Orthos +1 CP instead of +2' },
    { phase: 'island', island: 'Grunting Fen', orthos: [7, 7],
      storylet: 'The Treasures of Grunting Fen', branch: 'How about we make this more... interesting?',
      ch: 'Watchful 128', an: 0, cn: 0, tn: 0,
      headline: 'Rostygold ×228', gain: 'Piece of Rostygold 228 x',
      fail: 'Piece of Rostygold −100, Nightmares +1 CP, Orthos +1 CP instead of +2',
      note: 'The one action on any of the three islands whose failure takes something '
        + 'off you rather than only costing the difference in Orthos.' },

    { phase: 'island', island: 'Grunting Fen', orthos: [8, 8],
      storylet: 'Knowledge that Seeped into the Water',
      branch: 'No more peculiar than anything else here',
      ch: 'Watchful 126', an: 40, cn: 0, tn: 0, gain: 'Touched by Fingerwork +1 CP',
      fail: 'Nightmares +1 CP — Orthos goes to 9 either way' },
    { phase: 'island', island: 'Grunting Fen', orthos: [8, 8],
      storylet: 'The Rarer Artifacts', branch: 'Go searching', strict: true,
      ch: 'Watchful 127', an: 0, cn: 0, tn: 0,
      headline: 'Pearls ×200',
      gain: 'Moon-Pearl 200 x, Jade Fragment 100 x, Shard of Glim 200 x',
      fail: 'Wounds +1 CP — Orthos goes to 9 either way' },

    { phase: 'island', island: 'Grunting Fen', orthos: [9, 9],
      storylet: 'Spiritual riches', branch: 'Untapped wealth',
      ch: null, an: 0, cn: 0, tn: 0,
      headline: 'Implications ×6', gain: 'Extraordinary Implication 6 x' },
    { phase: 'island', island: 'Grunting Fen', orthos: [9, 9],
      storylet: 'Describe Grunting Fen in Theosophistical terms', branch: 'Rich insights',
      ch: null, an: 0, cn: 0, tn: 150, gain: 'Touched by Fingerwork +1 CP' },

    { phase: 'island', island: 'Grunting Fen', orthos: [10, 10],
      storylet: 'Orthos Seeks To Take Your Work', branch: 'Time to go', strict: true,
      ch: null, an: 0, cn: 0, tn: 0, leave: true },
    { phase: 'island', island: 'Grunting Fen', orthos: [10, 10],
      storylet: 'Orthos Seeks To Take Your Work', branch: 'Tarry a little', strict: true,
      ch: 'Luck 70%', an: 0, cn: 0, tn: 0,
      luck: { odds: 0.7, type: 'tn', win: 20, lose: 15 },
      fail: 'CN −5, AN −5, TN −5' },
    { phase: 'island', island: 'Grunting Fen', orthos: [10, 10],
      storylet: 'Orthos Seeks To Take Your Work', branch: 'Cut it fine', strict: true,
      ch: 'Luck 30%', an: 0, cn: 0, tn: 0,
      luck: { odds: 0.3, type: 'tn', win: 40, lose: 15 },
      fail: 'CN −5, AN −5, TN −5' },

    // === Organise your Research, at Your Lodgings =========================
    //
    // These SPEND pages, so their page counts are negative, and the figure that
    // separates them is the guide's pence per note rather than the total.
    { phase: 'organise', storylet: 'Organise your Research',
      branch: 'Collate your cryptopalaeontological work',
      an: 0, cn: -120, tn: 0, perNote: 6.25, worth: 7.5,
      gain: 'Volume of Collated Research 3 x, Volume of your Cryptopalaeontological Work' },
    { phase: 'organise', storylet: 'Organise your Research',
      branch: 'Collate your prelapsarian archaeological work',
      an: -120, cn: 0, tn: 0, perNote: 6.25, worth: 7.5,
      gain: 'Volume of Collated Research 3 x, Volume of your Prelapsarian Archaeological Work' },
    { phase: 'organise', storylet: 'Organise your Research',
      branch: 'Collate your research into Theosophistry',
      an: 0, cn: 0, tn: -120, perNote: 6.25, worth: 7.5,
      gain: 'Volume of Collated Research 3 x, Volume of your Theosophistical Work' },
    { phase: 'organise', storylet: 'Organise your Research',
      branch: 'Speak to professional persons with academic pretensions',
      an: -500, cn: 0, tn: 0, perNote: 10, worth: 50,
      gain: 'Uncanny Incunabulum 4 x' },
    { phase: 'organise', storylet: 'Organise your Research',
      branch: 'Speak to naturalists, hunters and the breeders of monsters',
      an: 0, cn: -500, tn: 0, perNote: 10, worth: 50,
      gain: 'Storm-Threnody 4 x' },
    { phase: 'organise', storylet: 'Organise your Research',
      branch: 'Sell your Theosophistical conclusions',
      an: 0, cn: 0, tn: -500, perNote: 10, worth: 50,
      gain: 'Extraordinary Implication 5 x, Scrap of Incendiary Gossip 50 x, '
        + 'Bottle of Broken Giant 1844 5 x, Confident Smile 1 x' },
    { phase: 'organise', storylet: 'Organise your Research',
      branch: 'Gather all your work into a library',
      an: -250, cn: -250, tn: -250, gain: 'Voluminous Library' },
    { phase: 'organise', storylet: 'Organise your Research',
      branch: 'Re-establish your academic reputation',
      an: -500, cn: -500, tn: -500,
      gain: 'Removes Unwelcome at the University, Connected: Benthic +30 CP, '
        + 'Connected: Summerset +30 CP' },
    { phase: 'organise', storylet: 'Organise your Research', branch: 'Breed a beast',
      an: 0, cn: -500, tn: 0, gain: 'Bifurcated Owl',
      cost: 'a Hound of Heaven, a Corresponding Ocelot, an Ocular Toadbeast, an '
        + 'Obdurate Stallion and a Slavering Dream-Hound' },
    { phase: 'organise', storylet: 'Organise your Research',
      branch: 'Another round of preliminary research',
      an: -50, cn: -50, tn: -50, gain: 'Opens Preparatory Research again' },
  ];

  // --- the three currencies ------------------------------------------------
  //
  // Colour is the note TYPE, not an amount, because that is the question these
  // screens ask: you are on one island for one type, and at every Orthos band
  // one of the two actions in front of you pays it. Three hues far enough apart
  // to be told apart at a glance on Fallen London's dark ground, plus two
  // neutrals for the rows that pay no pages at all.
  const VSD_NOTES = {
    an: { key: 'an', tag: 'AN', name: 'Page of Prelapsarian Archaeological Notes', color: '#8a6420' },
    cn: { key: 'cn', tag: 'CN', name: 'Page of Cryptopalaeontological Notes', color: '#3d6591' },
    tn: { key: 'tn', tag: 'TN', name: 'Page of Theosophistical Notes', color: '#5f4b8b' },
  };
  const VSD_NOTE_KEYS = ['an', 'cn', 'tn'];

  const VSD_COLOR_GOODS = '#4a5560';  // pays no pages: labelled, never scored
  const VSD_COLOR_LEAVE = '#2f6b3f';  // the free way off the island
  const VSD_COLOR_SPEND = '#6b6b6b';  // an Organise row with no priced figure
  const VSD_COLOR_BEST = '#b8912f';   // the best pence-per-note on the Organise screen

  const VSD_CLASS = 'fl-ux-vsd';
  const VSD_FLAG = 'flUxVsd';
  const VSD_BRANCH_CLASS = 'fl-ux-vsd-branch';
  const VSD_BRANCH_FLAG = 'flUxVsdBranch';

  // A Luck row is ranked on its EXPECTED value, the one case where the wiki
  // gives both outcomes and the odds -- the same rule `zeeTwScore` follows, and
  // for the same reason. It matters here: "Cut it fine" advertises twice the
  // pages of "Tarry a little" and is worth a sixth of it once the 70% chance of
  // losing five of each type is priced in.
  function vsdLuckValue(luck) {
    return luck.odds * luck.win - (1 - luck.odds) * luck.lose;
  }

  // How many pages a row moves, and of which types. Returns null for a row that
  // moves none -- which is a different claim from zero, and is why the badge
  // labels those rows rather than printing "+0".
  function vsdPages(entry) {
    const moved = VSD_NOTE_KEYS.filter(function (key) { return entry[key]; });
    if (!moved.length) return null;
    const total = moved.reduce(function (sum, key) { return sum + entry[key]; }, 0);
    const same = moved.length === 3
      && entry.an === entry.cn && entry.cn === entry.tn;
    return { keys: moved, total: total, all: same, each: same ? entry.an : null };
  }

  function vsdSigned(n) {
    return (n > 0 ? '+' : '') + n;
  }

  // The best pence-per-note the Organise screen offers. Derived, so adding a
  // row with a better rate re-colours the table rather than lying about it.
  const VSD_BEST_PER_NOTE = VSD_OPTIONS.reduce(function (best, entry) {
    return typeof entry.perNote === 'number' && entry.perNote > best ? entry.perNote : best;
  }, 0);

  function vsdBadgeText(entry) {
    if (entry.leave) return 'leave';
    if (entry.luck) {
      // One decimal, and only where it is not a whole number: "≈+9.5" says
      // "this is arithmetic, not a promise" better than "+9" would.
      const ev = vsdLuckValue(entry.luck);
      const shown = Math.round(ev * 10) / 10;
      return '≈' + VSD_NOTES[entry.luck.type].tag + ' ' + vsdSigned(shown) + '?';
    }
    const pages = vsdPages(entry);
    if (!pages) return entry.headline || 'no pages';
    if (pages.all) return 'all ' + vsdSigned(pages.each);
    if (pages.keys.length === 1) {
      const key = pages.keys[0];
      return VSD_NOTES[key].tag + ' ' + vsdSigned(entry[key]);
    }
    return vsdSigned(pages.total) + ' pages';
  }

  function vsdColor(entry) {
    if (entry.leave) return VSD_COLOR_LEAVE;
    if (entry.luck) return VSD_NOTES[entry.luck.type].color;
    const pages = vsdPages(entry);
    if (!pages) return VSD_COLOR_GOODS;
    if (entry.phase === 'organise') {
      return entry.perNote === VSD_BEST_PER_NOTE ? VSD_COLOR_BEST : VSD_COLOR_SPEND;
    }
    if (pages.keys.length === 1) return VSD_NOTES[pages.keys[0]].color;
    // Pays every type at once: no one hue is honest, so it gets the neutral and
    // the amount carries the meaning.
    return VSD_COLOR_SPEND;
  }

  // --- the tooltip ---------------------------------------------------------

  function vsdWhen(entry) {
    if (entry.phase === 'island') {
      return entry.island + ' · Orthos is Coming! '
        + (entry.orthos[0] === entry.orthos[1]
          ? String(entry.orthos[0]) : entry.orthos[0] + '–' + entry.orthos[1]);
    }
    return entry.phase === 'prep' ? 'Preparatory Research, at Your Lodgings'
      : 'Organise your Research, at Your Lodgings';
  }

  function vsdPageWords(entry) {
    const pages = vsdPages(entry);
    if (!pages) return null;
    return pages.keys.map(function (key) {
      return VSD_NOTES[key].name + ' ' + vsdSigned(entry[key]);
    }).join(', ');
  }

  function vsdSpec(entry) {
    const lines = [entry.storylet + ': ' + entry.branch, vsdWhen(entry), ''];

    if (entry.leave) {
      lines.push('Ends the visit. Nothing gained, nothing risked.');
    } else if (entry.luck) {
      const note = VSD_NOTES[entry.luck.type];
      lines.push('A gamble, and the badge is its EXPECTED value, not the number it '
        + 'advertises: ' + Math.round(entry.luck.odds * 100) + '% of ' + note.tag + ' +'
        + entry.luck.win + ', ' + Math.round((1 - entry.luck.odds) * 100) + '% of losing '
        + '5 of each type.');
      lines.push('Expected: ' + note.tag + ' ' + vsdSigned(Math.round(vsdLuckValue(entry.luck) * 10) / 10)
        + ' a page, counting the failure.');
    } else {
      const words = vsdPageWords(entry);
      if (words) lines.push('Pages: ' + words);
      if (entry.headline && !words) lines.push('No pages. Pays goods instead.');
    }

    if (entry.gain) lines.push('Gives: ' + entry.gain);
    if (entry.orElse) lines.push('OR, the game’s choice, not yours: ' + entry.orElse);
    if (entry.cost) lines.push('Costs: ' + entry.cost);
    if (entry.needs) lines.push('Needs: ' + entry.needs);
    if (entry.ch) lines.push('Challenge: ' + entry.ch);
    if (entry.fail) lines.push('Failure: ' + entry.fail);
    if (typeof entry.perNote === 'number') {
      lines.push('Worth about ' + entry.worth + ' Echoes — ' + entry.perNote + ' pence a page'
        + (entry.perNote === VSD_BEST_PER_NOTE ? ', the best rate on this screen.' : '.'));
    }
    if (entry.note) lines.push(entry.note);

    lines.push('');
    lines.push(entry.phase === 'island'
      ? 'A visit is ' + VSD_ISLAND_ACTIONS + ' actions if every challenge passes. A failure '
        + 'still moves Orthos, by 1 change point rather than 2, so it lengthens the visit '
        + 'rather than ending it. You cannot leave early.'
      : 'Every Preparatory Research option locks itself out above a page count, so the '
        + 'order you take them in decides the total.');
    return { text: vsdBadgeText(entry), color: vsdColor(entry), title: lines.join('\n') };
  }

  // A storylet holds one or more of these. The badge takes the row that pays
  // the most pages of the island's own type -- that is what you sailed for --
  // and the tooltip lists every branch, so the goods row is never hidden.
  function vsdIslandType(name) {
    const island = VSD_ISLANDS.find(function (i) { return i.name === name; });
    return island ? island.pays : null;
  }

  function bestVsdOption(entries) {
    const wanted = entries[0].island ? vsdIslandType(entries[0].island) : null;
    let best = null;
    let bestScore = -Infinity;
    for (const entry of entries) {
      let score;
      if (entry.leave) score = -1;
      else if (entry.luck) score = vsdLuckValue(entry.luck);
      else if (wanted && entry[wanted]) score = entry[wanted];
      else {
        const pages = vsdPages(entry);
        score = pages ? pages.total : 0;
      }
      if (score > bestScore) { bestScore = score; best = entry; }
    }
    return best || entries[0];
  }

  function vsdStoryletSpec(entries) {
    if (entries.length === 1) return vsdSpec(entries[0]);
    const best = bestVsdOption(entries);
    const wanted = entries[0].island ? vsdIslandType(entries[0].island) : null;
    const lines = [entries[0].storylet, vsdWhen(entries[0]), ''];
    lines.push(entries.length + ' options here:');
    for (const entry of entries) {
      const words = vsdPageWords(entry);
      lines.push('  • ' + entry.branch + ' — '
        + (entry.leave ? 'ends the visit'
          : entry.luck ? 'a gamble, expected ' + VSD_NOTES[entry.luck.type].tag + ' '
            + vsdSigned(Math.round(vsdLuckValue(entry.luck) * 10) / 10)
          : words || entry.gain || 'no pages')
        + (entry.ch ? ' [' + entry.ch + ']' : ''));
    }
    lines.push('');
    lines.push(wanted
      ? 'The badge is the option paying the most ' + VSD_NOTES[wanted].tag
        + ', which is what this island is for. The others pay goods, and whether that '
        + 'is worth more to you is not a question this table can answer.'
      : 'The badge is the option paying the most pages.');
    lines.push('');
    lines.push('Open the storylet and every option is badged in its own right.');
    return { text: vsdBadgeText(best), color: vsdColor(best), title: lines.join('\n') };
  }

  // --- looking one up ------------------------------------------------------
  //
  // The trap here, and it is this feature's whole reason for needing more than
  // a Map: THE SAME BRANCH NAME IS ON ALL THREE ISLANDS. "Time to go", "Tarry a
  // little" and "Cut it fine" each appear three times, paying a different note
  // type on each island, and so does the storylet name "Bullbone Island" /
  // "Grunting Fen" / "Corpsecage Island", which is also the AREA name. A badge
  // that guessed which island you were on would quote the wrong currency a
  // third of the time, so ambiguity is resolved from the page or not at all.

  const VSD_BY_STORYLET = new Map();
  const VSD_BY_BRANCH = new Map();
  for (const entry of VSD_OPTIONS) {
    const sKey = normalizeName(entry.storylet);
    if (!VSD_BY_STORYLET.has(sKey)) VSD_BY_STORYLET.set(sKey, []);
    VSD_BY_STORYLET.get(sKey).push(entry);
    const bKey = normalizeName(entry.branch);
    if (!VSD_BY_BRANCH.has(bKey)) VSD_BY_BRANCH.set(bKey, []);
    VSD_BY_BRANCH.get(bKey).push(entry);
  }

  // Where are we? The greeting first, then the storylet heading on screen --
  // an opened storylet named after an island is as good as the greeting, and
  // it is there on the very screen the branches are.
  function vsdIslandHere() {
    const area = normalizeName(currentArea());
    for (const island of VSD_ISLANDS) {
      if (area === normalizeName(island.name)) return island.name;
    }
    const heads = document.querySelectorAll('.storylet-root__heading');
    for (const head of heads) {
      const rows = VSD_BY_STORYLET.get(normalizeName(headingName(head)));
      if (rows && rows.length && rows[0].island) return rows[0].island;
    }
    return null;
  }

  // Narrow a set of same-named rows down to one. Returns null rather than
  // guessing -- a badge that names the wrong island's currency is worse than
  // no badge.
  function vsdDisambiguate(rows, island) {
    if (rows.length === 1) return rows[0];
    if (!island) return null;
    const here = rows.filter(function (r) { return r.island === island; });
    return here.length === 1 ? here[0] : null;
  }

  function lookupVsdBranch(name, island) {
    const rows = VSD_BY_BRANCH.get(normalizeName(name));
    return rows ? vsdDisambiguate(rows, island) : null;
  }

  // A storylet's rows, all of them, for the one island we are on.
  function lookupVsdStorylet(name, island) {
    const rows = VSD_BY_STORYLET.get(normalizeName(name));
    if (!rows) return null;
    const islands = new Set(rows.map(function (r) { return r.island; }));
    if (islands.size <= 1) return rows;
    if (!island) return null;
    const here = rows.filter(function (r) { return r.island === island; });
    return here.length ? here : null;
  }

  // --- the area gate -------------------------------------------------------
  //
  // Confirm-only, like ZEE_AREAS and PC_AREAS: nobody has captured a greeting
  // on any of the three islands, so these names are a GUESS taken from the
  // wiki's own page titles. It may say "yes" and must never say "no".
  const VSD_AREAS = VSD_ISLANDS.map(function (i) { return normalizeName(i.name); });

  function inVsdIsland() {
    const area = normalizeName(currentArea());
    return !!area && VSD_AREAS.indexOf(area) !== -1;
  }

  // `strict` is for one thing only: a BRANCH NAME that is an ordinary English
  // phrase and could title an option anywhere in London -- "Time to go",
  // "Looking up", "Making money", "Search the island", "Do a survey", "Catch
  // some", "Go searching", "See what you can dig up", "Tarry a little", "Cut it
  // fine". Those wait until the greeting or an opened storylet confirms one of
  // the three islands.
  //
  // It is deliberately NOT on the rest, including the branches of the storylets
  // named after their islands. Those names ("The bones of Bullbone", "The
  // Corpsecage bat") are phrases the wiki shows here and nowhere else, and
  // spreading `strict` to them would black the feature out on the storylet
  // LIST -- where no storylet is open to resolve the island and the greeting is
  // an unverified guess, which is exactly where the badges are most use.
  // A STORYLET heading needs its own list rather than "any of my branches is
  // strict". Deriving it from the branches would gate "Sparkling around the
  // Copse" on the one ordinary option inside it, which is the over-strictness
  // this is meant to avoid. Four storylet names earn it: the three that are
  // also the ISLAND's name, where the heading is indistinguishable from the
  // place, and "Up the Hill".
  const VSD_STRICT_STORYLETS = [
    'Bullbone Island', 'Corpsecage Island', 'Grunting Fen', 'Up the Hill',
  ].map(normalizeName);

  const VSD_STORYLET_SELECTOR = '.storylet__heading, .storylet-root__heading';
  const VSD_BRANCH_SELECTOR = '.branch__title';

  function vsdRatings() {
    const island = vsdIslandHere();
    const confirmed = !!island || inVsdIsland();

    document.querySelectorAll(VSD_STORYLET_SELECTOR).forEach(function (head) {
      const name = headingName(head);
      const entries = name ? lookupVsdStorylet(name, island) : null;
      const strict = !!entries
        && VSD_STRICT_STORYLETS.indexOf(normalizeName(entries[0].storylet)) !== -1;
      attachBadge(head, {
        cls: VSD_CLASS,
        flag: VSD_FLAG,
        // The island is in the flag as well as the name: the same storylet
        // heading on two different islands is two different badges.
        value: name + '@' + (island || '-'),
        spec: entries && (confirmed || !strict) ? vsdStoryletSpec(entries) : null,
        place: 'after',
      });
    });

    document.querySelectorAll(VSD_BRANCH_SELECTOR).forEach(function (head) {
      const name = headingName(head);
      const entry = name ? lookupVsdBranch(name, island) : null;
      attachBadge(head, {
        cls: VSD_BRANCH_CLASS,
        flag: VSD_BRANCH_FLAG,
        value: name + '@' + (island || '-'),
        spec: entry && (confirmed || !entry.strict) ? vsdSpec(entry) : null,
        place: 'after',
      });
    });
  }

  // === feature: University Laboratory ====================================
  //
  // Your own Laboratory at the University: an opportunity deck in which almost
  // every option pays Laboratory Research, and the first feature here whose
  // badge is a FORMULA rather than a transcribed number. "4 + Equipment",
  // "12 + 2 × Equipment", "(2 + 0.2 × Equipment) × √Workers × highest worker
  // level" -- the figure depends on your Equipment for Scientific
  // Experimentation, your students' levels and how many people work in the
  // lab, all of which Fallen London states on the Myself tab and nowhere near
  // the deck. So the qualities are read where they are shown and banked, the
  // same way the festival depth and the Port Carnelian purse are.
  //
  // **What the badge says, and why.** A card badge is the Laboratory Research
  // the best option on it pays ON A SUCCESS, at your Equipment, among the
  // options you can take with nothing special in hand -- the Zailing rule. An
  // option behind an item (an Unavoidable Epiphany, an Unexpected Result, a
  // Searing Enigma, the Robe of Mr Cards) is left out of that ranking and kept
  // in the tooltip, and a `▾` says one of those would pay more. The options
  // that hand you an Unavoidable Epiphany are what a lab run is steered by, so
  // they carry `✦`; the ones that use something up carry `▼`. Nothing here puts
  // a research value on an Epiphany or an Unlikely Connection: the wiki gives
  // what each is spent for, not what it is worth, and a guessed exchange rate
  // on every card would make every ranking wrong together.
  //
  // Where a figure cannot be worked out it is a RANGE, never a guess: with your
  // Equipment unread the badge covers Equipment 1 to 9, and on a student's card
  // with the student's level unread it covers the three tiers. A Luck option
  // carries `≈` and its expected value, since both outcomes and the odds are on
  // the page; a Watchful challenge keeps its success figure and a `?`.
  //
  // Transcribed from the individual card and option pages on fallenlondon.wiki,
  // not from University Laboratory (Guide)/Cards or /Tables, which carry a
  // GuideNeedsWork banner and disagree with the option pages in a dozen places
  // -- mostly student failures. Where they disagree the option page is used and
  // the guide's figure is kept beside it (`guide7`, `guideOff`) as the
  // cross-check: the Tables page states every student option's research at
  // Equipment 7. Corrections go in LAB_CARDS and nowhere else.
  //
  // One card per entry:
  //
  //   name      the card, as the game titles it.
  //   group     which panel section it belongs to.
  //   freq      its frequency. needs: what puts it in the deck, in words.
  //   student   on a student's card, that student's quality -- the input
  //             `student` in a formula, and what the tier options key off.
  //   strict    the name is an ordinary English phrase, so it is only badged
  //             once the lab is confirmed (see `labConfirmed`).
  //   opts      one entry per option:
  //     branch    the option, as the game titles it. page: the wiki page, when
  //               it differs (the wiki disambiguates same-named options).
  //     req       [[quality, min, max?], ...] -- requirements the Myself scrape
  //               can check. eo / notEo: Experimental Object ranges.
  //     gate      a requirement on something special -- an item, a quality
  //               this feature does not read, Fate. Such an option is never
  //               the card's badge.
  //     ch        the challenge in words; rp: Research Preparations lower it.
  //     luck      the odds of success, for a Luck challenge.
  //     win / rare / alt / fail
  //               research formulas for each outcome (see `labCompute`), and
  //               winAlso / rareAlso / altAlso / failAlso for everything else
  //               the outcome does, verbatim.
  //     epiphany  a success gives an Unavoidable Epiphany (✦).
  //     consumes  what it uses up (▼).
  //     cur       'pr' when it pays Parabolan Research instead.
  //     label     what the badge says for an option that pays no research.
  //     guide7    { win, fail }: the guide's Student Table figure at Equipment
  //               7. guideOff: which of those the option page disagrees with.
  //     note      anything else.

  const LAB_Q = {
    equipment: 'Equipment for Scientific Experimentation',
    workers: 'Number of Workers in your Laboratory',
    eo: 'Experimental Object',
    research: 'Laboratory Research',
    required: 'Total Lab Research Required',
    disgruntlement: 'Disgruntlement among the Students',
    prestige: 'The Prestige of your Laboratory',
    glass: 'Glass Studies',
  };

  const LAB_STUDENTS = [
    { key: 'shifty', name: 'Shifty Student', quality: 'Laboratory Services from a Shifty Student' },
    { key: 'meticulous', name: 'Meticulous Student', quality: 'Laboratory Services from a Meticulous Student' },
    { key: 'gifted', name: 'Gifted Student', quality: 'Laboratory Services from a Gifted Student' },
    { key: 'profound', name: 'Profound Student', quality: 'Laboratory Services from a Profound Student' },
    { key: 'visionary', name: 'Visionary Student', quality: 'Laboratory Services from a Visionary Student' },
  ];

  // The staff this feature transcribes cards for. The ambition and Fate-locked
  // experts are not among them: most of their options are "(see page)" on the
  // wiki, and a badge with half its options missing would rank the wrong one.
  const LAB_STAFF = [
    { name: 'the Numismatrix', quality: 'Laboratory Services from the Numismatrix' },
    { name: 'Lettice, the Mercy', quality: 'Laboratory Services of Lettice the Mercy' },
    { name: 'F.F. Gebrandt', quality: 'Laboratory Services from F.F. Gebrandt' },
    { name: 'a Grubby Urchin', quality: 'Laboratory Services from a Grubby Urchin' },
    { name: 'the Struggling Artist', quality: 'Found Employment for an Old Friend' },
  ];

  // The advanced skills Unorthodox Methods scales off.
  const LAB_SKILLS = ['Artisan of the Red Science', 'Glasswork', 'Shapeling Arts', 'Kataleptic Toxicology'];

  const LAB_QUALITIES = Object.keys(LAB_Q).map(function (k) { return LAB_Q[k]; })
    .concat(LAB_STUDENTS.map(function (s) { return s.quality; }))
    .concat(LAB_STAFF.map(function (s) { return s.quality; }))
    .concat(LAB_SKILLS);

  // Items, off Possessions. These move every few actions, so a figure resting
  // on one is marked when the reading is over a minute old.
  const LAB_ITEMS = {
    epiphany: 'Unavoidable Epiphany',
    idea: 'Unwise Idea',
    result: 'Unexpected Result',
    connection: 'Unlikely Connection',
  };

  // --- formulas ------------------------------------------------------------
  //
  // A research formula is one of:
  //
  //   { k, el, glass, student, workers, ideas, round }
  //       k + el × Equipment + glass × Glass Studies + student × the card's
  //       student level + workers × Number of Workers + ideas × Unwise Ideas.
  //       `round` is 'up' or 'down' where the page says so.
  //   { curve: { height, k, mid, y }, of }
  //       the wiki's SCurveTable: y + height / (1 + e^(−k × (x − mid))), on
  //       Equipment (`of: 'el'`) or on an advanced skill.
  //   { team, k }
  //       (k + team × Equipment) × √Workers × highest worker level.
  //   { draft: true }
  //       Circulate a draft of your findings (see `labDraft`).
  //   { range: [lo, hi] }
  //       "1-44", with nothing said about the distribution.
  //
  // Unless a page says otherwise a figure rounds half to even, which is what
  // the wiki's own SCurve module does "as is typically used in-game".

  function labLin(k, el, round) {
    const f = { k: k, el: el };
    if (round) f.round = round;
    return f;
  }

  const LAB_BRIEF_CURVE = { height: 42, k: 0.4, mid: 7, y: -1 };
  const LAB_SKILL_WIN = { height: 35, k: 0.3, mid: 6, y: 0 };
  const LAB_SKILL_FAIL = { height: 20, k: 0.3, mid: 7, y: 0 };

  const LAB_UE = 'an Unavoidable Epiphany';

  const LAB_CARDS = [
    // === a brief project (under 200 research) =============================
    {
      name: 'Preparing for a brief Experiment', group: 'brief', freq: 'High Urgency',
      needs: 'a project needing less than 200 research. Dealt once, first',
      note: 'Every option ends the card, so this is the one choice a short project gives you.',
      opts: [
        { branch: 'Prepare carefully', win: { curve: LAB_BRIEF_CURVE, of: 'el' },
          winAlso: 'Research Preparations +10' },
        { branch: 'Look for a novel angle', win: { curve: LAB_BRIEF_CURVE, of: 'el' },
          winAlso: 'Unlikely Connection +3' },
        { branch: 'Rely on your own brilliance', req: [[LAB_Q.equipment, 7], [LAB_Q.prestige, 20]],
          ch: 'Watchful 170', win: labLin(-8, 4), epiphany: true, fail: { k: 10 },
          failAlso: 'Unwise Idea +1, Wounds +2 CP',
          note: 'The page gives the failure\'s 10 research for Equipment 7 and 9.' },
        { branch: 'Begin with a quick jaunt into Parabola', cur: 'pr',
          gate: 'Route: The Reflection of your Laboratory, 50 Drops of Prisoner\'s Honey and Glass Studies 2',
          ch: 'Glasswork 5 (narrow)', win: { k: 15 },
          winAlso: 'costs 50 Drops of Prisoner\'s Honey (25 with a Set of Cosmogone Spectacles)',
          failAlso: 'costs 100 Drops of Prisoner\'s Honey, and no research' },
      ],
    },

    // === setting up a long project ========================================
    {
      name: 'Form New Hypotheses', group: 'setup', freq: 'Frequent',
      needs: 'a project of 200 research or more, until you take No more of this!',
      opts: [
        { branch: 'Review the possibilities', ch: 'Watchful 150', rp: true, win: labLin(4, 1),
          winAlso: 'Research Preparations +5', rare: labLin(8, 1),
          rareAlso: 'Research Preparations +20, Unwise Idea +1', fail: labLin(0, 1),
          note: 'Rare success chance is 5%.' },
        { branch: 'Consider every possibility', ch: 'Watchful 180', rp: true, win: labLin(4, 1),
          winAlso: 'Unlikely Connection +5', fail: labLin(0, 1) },
        { branch: 'No more of this!', page: 'No more of this! (Form New Hypotheses)',
          win: labLin(8, 1), winAlso: 'removes this card for the rest of the project',
          note: 'Needs Laboratory Research of at least a sixth of the project.' },
      ],
    },
    {
      name: 'Review the Prior Literature', group: 'setup', freq: 'Standard',
      needs: 'a project of 200 research or more, until you take No more of this!',
      opts: [
        { branch: 'Read the canonical texts; make pertinent notes', ch: 'Watchful 150', rp: true,
          win: labLin(4, 1), winAlso: 'Research Preparations +5', rare: labLin(8, 1),
          rareAlso: 'Research Preparations +10', fail: labLin(0, 1),
          note: 'Rare success chance is 20%.' },
        { branch: 'Chase down every last citation', ch: 'Watchful 220', rp: true, win: labLin(4, 1),
          winAlso: 'Unlikely Connection +5', fail: labLin(0, 1) },
        { branch: 'Gather some unofficial literature', gate: 'Incisive Observation 5',
          consumes: '5 Incisive Observations', ch: 'Watchful 190', rp: true, win: labLin(0, 2),
          winAlso: 'Unlikely Connection +5', fail: labLin(0, 1),
          note: 'The page lists a second failure paying a flat 10 research, without saying when.' },
        { branch: 'Relate this problem to a past Enigma',
          gate: 'a Searing Enigma, on a project of 500 research or more with at least 500 still to go',
          eo: [[1001, 1200]], consumes: 'a Searing Enigma', ch: 'Watchful 220', rp: true,
          win: { k: 500 }, epiphany: true, winAlso: 'discards your hand; 525 research with a Correspondence Focus',
          fail: { k: 500 }, failAlso: '525 research with a Correspondence Focus' },
        { branch: 'No more of this!', page: 'No more of this! (Review the Prior Literature)',
          win: labLin(8, 1), winAlso: 'removes this card for the rest of the project' },
      ],
    },

    // === the experiment itself ============================================
    {
      name: 'Engage in some Empirical Research', group: 'experiment', freq: 'Standard',
      needs: 'Form New Hypotheses done with, and supplies in (Refresh your Consumables)',
      opts: [
        { branch: 'Perform a comparatively simple experiment', ch: 'Dangerous 200', rp: true,
          win: labLin(4, 1), winAlso: 'Unexpected Result +1', rare: labLin(8, 1),
          rareAlso: 'Unwise Idea +1', fail: labLin(0, 1), failAlso: 'Wounds +2 CP' },
        { branch: 'Hook up all the meters and stand well back', ch: 'Dangerous 250', rp: true,
          win: labLin(12, 2), winAlso: 'Unexpected Result +1; you are out of supplies; discards your hand',
          rare: labLin(12, 2), rareAlso: 'Unwise Idea +1, Unexpected Result +1, Wounds +2 CP',
          failAlso: 'Wounds +2 CP, and no research' },
      ],
    },
    {
      name: 'Refresh your Consumables', group: 'experiment', freq: 'Standard',
      needs: 'a project of 200 research or more, while you are out of supplies',
      opts: [
        { branch: 'Work through a trusted intermediary', ch: 'Persuasive 150', win: labLin(8, 2),
          alt: labLin(10, 2), fail: labLin(0, 1), failAlso: 'Scandal +2 CP',
          note: 'Alternative success chance is 30%.' },
        { branch: 'Rely on illicit contacts', gate: 'Connected: The Widow 5', ch: 'Shadowy 200',
          win: labLin(-8, 4), failAlso: 'Suspicion +1–2 CP, and no research' },
        { branch: 'Demand a delivery', gate: 'The Robe of Mr Cards', win: labLin(12, 2),
          winAlso: 'Unexpected Result +1' },
        { branch: 'Allow your possessions to propagate on your own',
          gate: 'A Kitten-Sized Diamond, Liberated from the Mountain', win: labLin(12, 2),
          winAlso: 'Unexpected Result +1' },
        { branch: 'Appropriate whatever you need',
          gate: 'A Vast Network of Connections Wherever the Bazaar\'s Influence can be Found',
          win: labLin(12, 2), winAlso: 'Unexpected Result +1' },
      ],
    },
    {
      name: 'Unorthodox Methods', group: 'experiment', freq: 'Very Infrequent', strict: true,
      needs: 'The Prestige of your Laboratory 20, an Unlikely Connection, and a project of 200 or more',
      opts: [
        { branch: 'Use what you know of the Red Science', ch: 'Artisan of the Red Science 7 (narrow)',
          consumes: 'an Unlikely Connection',
          win: { curve: LAB_SKILL_WIN, of: 'Artisan of the Red Science' }, winAlso: 'Unexpected Result +1',
          fail: { curve: LAB_SKILL_FAIL, of: 'Artisan of the Red Science' }, failAlso: 'Wounds +1 CP' },
        { branch: 'Perform an experiment in Parabola', gate: 'Access to a Parabolan Base-Camp',
          ch: 'Glasswork 7 (narrow)', consumes: 'an Unlikely Connection',
          win: { curve: LAB_SKILL_WIN, of: 'Glasswork' }, winAlso: 'Unexpected Result +1',
          fail: { curve: LAB_SKILL_FAIL, of: 'Glasswork' }, failAlso: 'Nightmares +1 CP' },
        { branch: 'Rearrange your brain around the problem', ch: 'Shapeling Arts 7 (narrow)',
          consumes: 'an Unlikely Connection',
          win: { curve: LAB_SKILL_WIN, of: 'Shapeling Arts' }, winAlso: 'Unexpected Result +1',
          fail: { curve: LAB_SKILL_FAIL, of: 'Shapeling Arts' }, failAlso: 'Nightmares +1 CP' },
        { branch: 'Adopt a better frame of mind', ch: 'Kataleptic Toxicology 7 (narrow)',
          consumes: 'an Unlikely Connection',
          win: { curve: LAB_SKILL_WIN, of: 'Kataleptic Toxicology' }, winAlso: 'Unexpected Result +1',
          fail: { curve: LAB_SKILL_FAIL, of: 'Kataleptic Toxicology' }, failAlso: 'Wounds +1 CP' },
      ],
    },

    // === your team ========================================================
    {
      name: 'Directing your Team', group: 'team', freq: 'Infrequent', strict: true,
      needs: '3 workers, a project of 200 or more, and both set-up cards done with',
      opts: [
        { branch: 'Put them to work examining data', gate: 'an Unexpected Result',
          consumes: 'an Unexpected Result', win: { team: 0.2, k: 2 }, rare: { team: 0.2, k: 2 },
          rareAlso: 'Unwise Idea +1, Nightmares +1 CP', note: 'Rare success chance is 10%.' },
        { branch: 'Give them a line of inquiry to follow up on', gate: LAB_UE, consumes: LAB_UE,
          win: { team: 0.2, k: 2 },
          note: 'The page itself calls this a weaker use of an Epiphany than the others.' },
        { branch: 'Coordinate a plan of research', page: 'Coordinate a plan of research (No Disgruntlement)',
          req: [[LAB_Q.disgruntlement, 0, 0]], ch: 'Persuasive 210', rp: true,
          win: { team: 0.08, k: 2 }, fail: labLin(6, 1.25) },
        { branch: 'Coordinate a plan of research', page: 'Coordinate a plan of research (Disgruntlement)',
          req: [[LAB_Q.disgruntlement, 1]], ch: 'Persuasive 210', rp: true,
          win: { team: 0.08, k: 2 }, alt: { team: 0.2, k: 2 }, altAlso: 'Disgruntlement +1 CP',
          fail: labLin(6, 1.25), failAlso: 'Disgruntlement +1 CP' },
        { branch: 'Give them a day off', req: [[LAB_Q.disgruntlement, 2]], win: labLin(6, 1.25, 'up'),
          winAlso: 'Disgruntlement −2 CP' },
        { branch: 'Take a day off', luck: 0.4, win: { team: 0.08, k: 2 },
          winAlso: 'Nightmares −2 CP, or Suspicion −2 CP instead; Disgruntlement +2 CP if you have any',
          fail: { team: 0.08, k: 2 },
          failAlso: 'Wounds −2 CP, or Scandal −2 CP instead (and then Disgruntlement +2 CP if you have any)' },
      ],
    },

    // === writing up =======================================================
    {
      name: 'Write Up Your Findings', group: 'writeup', freq: 'Very Infrequent', strict: true,
      needs: 'Laboratory Research 200. Once a project',
      opts: [
        { branch: 'Circulate a draft of your findings', ch: 'Watchful 200', win: { draft: true },
          consumes: 'every Unexpected Result', winAlso: 'ends the card for this project',
          failAlso: 'Scandal +2 CP, and no research',
          note: 'The later in a project you play it, the more it pays — the share of the project '
            + 'done counts up to the whole of it. The panel works out the figure.' },
        { branch: 'Organise your notes', gate: 'Unexpected Result 2', consumes: '2 Unexpected Results',
          ch: 'Watchful 300, lowered by 10 for every Unexpected Result', rp: true,
          win: { curve: LAB_BRIEF_CURVE, of: 'el' }, epiphany: true,
          fail: labLin(5, 2), failAlso: 'Nightmares +2 CP' },
      ],
    },

    // === a very long project ==============================================
    {
      name: 'Running out of Steam', group: 'long', freq: 'Unusual', strict: true,
      needs: 'Laboratory Research 1,200; turns into Running out of Terms once taken',
      opts: [
        { branch: 'Go for a walk', page: 'Go for a walk (Fatigue)', luck: 0.5, win: labLin(18, 3),
          winAlso: 'Unwise Idea +1; discards your hand', alt: labLin(5, 2),
          altAlso: 'Unlikely Connection +5; discards your hand', fail: labLin(5, 2),
          failAlso: 'Wounds −5 CP, or an Unavoidable Epiphany instead; discards your hand',
          note: 'The expected value counts a success as the full 18 + 3 × Equipment. The page does '
            + 'not give the odds of the alternative success, which pays the failure\'s figure, so '
            + 'the true expectation is somewhat lower.' },
        { branch: 'Brew another pot of tea', win: labLin(5, 2), winAlso: 'Research Preparations +10' },
        { branch: 'Take an extended sabbatical', gate: 'A Palatial Holiday Home in the Arctic Circle',
          win: labLin(18, 3), epiphany: true,
          winAlso: 'Research Preparations +10, Wounds −2 CP, Nightmares −2 CP' },
      ],
    },
    {
      name: 'Running out of Terms', group: 'long', freq: 'Unusual',
      needs: 'Laboratory Research 5,000 and 2 workers, after Running out of Steam',
      opts: [
        { branch: 'Pull another alphabet off the shelf', win: labLin(8, 1) },
        { branch: 'Combine Greek and Latin', win: labLin(18, 3), winAlso: 'Scandal +1 CP' },
      ],
    },

    // === big ideas ========================================================
    {
      name: 'The Intrusion of a Thought', group: 'ideas', freq: 'Infrequent',
      needs: 'an Unwise Idea',
      note: 'The three cash-ins pay 20 research an idea and a change point of a menace for each.',
      opts: [
        { branch: 'Write it down for later', win: labLin(5, 4 / 3, 'up'), winAlso: 'Unwise Idea +1' },
        { branch: 'Perform an unsafe experiment', win: { ideas: 20 }, consumes: 'every Unwise Idea',
          winAlso: 'Wounds +1 CP an idea; discards your hand',
          note: 'Locked while you have Theoretical Methods.' },
        { branch: 'Publish an unproven theory', win: { ideas: 20 }, consumes: 'every Unwise Idea',
          winAlso: 'Scandal +1 CP an idea; discards your hand' },
        { branch: 'Pursue an unthinkable line of inquiry', win: { ideas: 20 }, consumes: 'every Unwise Idea',
          winAlso: 'Nightmares +1 CP an idea; discards your hand' },
      ],
    },
    {
      name: 'Eureka!', group: 'ideas', freq: 'Infrequent', strict: true,
      needs: 'an Unavoidable Epiphany',
      opts: [
        { branch: 'Make a profound realisation', win: labLin(18, 3), consumes: LAB_UE },
      ],
    },

    // === menaces ==========================================================
    {
      name: 'Nightmares of Your Experiment', group: 'menace', freq: 'Standard', needs: 'Nightmares 5',
      opts: [
        { branch: 'Take a rest', label: 'Nightmares −2', win: { k: -5 },
          winAlso: 'Nightmares −2 CP, for 5 research' },
        { branch: 'Use your nightmares as inspiration', win: { k: 7 }, winAlso: 'Nightmares +2 CP' },
      ],
    },
    {
      name: 'Tomb Sciences', group: 'menace', freq: 'Standard', needs: 'Scandal 5',
      opts: [
        { branch: 'Take a break', page: 'Take a break (from Lab Work)', label: 'Scandal −2',
          win: { k: -5 }, winAlso: 'Scandal −2 CP, for 5 research' },
      ],
    },
    {
      name: 'See a Doctor', group: 'menace', freq: 'Standard', strict: true, needs: 'Wounds 5',
      opts: [
        { branch: 'Take a break', page: 'Take a break (Laboratory)', label: 'Wounds −2',
          win: { k: -5 }, winAlso: 'Wounds −2 CP, for 5 research' },
      ],
    },
    {
      name: 'Student Complaints', group: 'menace', freq: 'Standard', strict: true,
      needs: 'Disgruntlement among the Students 4',
      opts: [
        { branch: 'Persuade them that this is in their own interest', ch: 'Mithridacy 7 (narrow)',
          label: 'Disgruntled −2', winAlso: 'Disgruntlement −2 CP', failAlso: 'Disgruntlement +1 CP' },
        { branch: 'Offer bribes', gate: 'Solacefruit 2', consumes: '2 Solacefruit',
          label: 'Disgruntled −1', winAlso: 'Disgruntlement −1 CP' },
        { branch: 'Offer extensive bribes', gate: 'a Sausage About Which No One Complains',
          consumes: 'the Sausage', label: 'Disgruntled −5', winAlso: 'Disgruntlement −5 CP' },
      ],
    },
    {
      name: 'Student Fury', group: 'menace', freq: 'Standard', strict: true,
      needs: 'Disgruntlement among the Students 6. It has to be played',
      opts: [
        { branch: 'Allow them a publication', label: '−200 research', win: { k: -200 },
          winAlso: 'Disgruntlement −7 CP, Scandal +1 CP',
          note: 'The guide\'s card table says Scandal +2 CP; the option page says +1, and the page is used.' },
      ],
    },

    // === a new or a small lab =============================================
    {
      name: 'One Day...', group: 'early', freq: 'Standard', strict: true,
      needs: 'The Prestige of your Laboratory below 4',
      opts: [{ branch: 'Dream of future successes', win: { k: 1 } }],
    },
    {
      name: 'Blank Walls', group: 'early', freq: 'Standard', strict: true, needs: 'no Equipment at all',
      opts: [
        { branch: 'Prepare to buy equipment', ch: 'Watchful 200', label: 'Hints ×100',
          winAlso: 'Whispered Hint +100', rareAlso: 'Laboratory Research +1' },
      ],
    },
    {
      name: 'Washing Up', group: 'early', freq: 'Standard', strict: true, needs: 'nobody working in the lab',
      opts: [{ branch: 'Do what must be done', win: labLin(0, 1) }],
    },
    {
      name: 'Unpacking crates', group: 'early', freq: 'Standard', strict: true, needs: 'fewer than 2 workers',
      opts: [{ branch: 'Get the crowbar', win: labLin(0, 1) }],
    },
    {
      name: 'Filing a report for the Dean', group: 'early', freq: 'Frequent', needs: 'fewer than 3 workers',
      opts: [{ branch: 'Fill in some forms', win: labLin(0, 1) }],
    },
    {
      name: 'Work with your Equipment', group: 'early', freq: 'Standard', strict: true,
      needs: 'fewer than 3 workers',
      opts: [
        { branch: 'Look closely at your current project', ch: 'Watchful 200', rp: true,
          win: labLin(6, 1.25), winAlso: 'Unexpected Result +1', fail: labLin(4, 1),
          note: 'The guide\'s card table says 1.5 × Equipment + 5, rounded down, on a success; the '
            + 'option page says 6 + 1.25 × Equipment, and the page is used.' },
      ],
    },

    // === students =========================================================
    //
    // Levels 1-2, 3-4 and 5 each open a different option, and exactly one of
    // the three is on the card at a time.
    {
      name: 'Work with your Shifty Student', group: 'students', freq: 'Standard',
      student: LAB_STUDENTS[0].quality, needs: 'a Shifty Student',
      opts: [
        { branch: 'Shepherd your student through some research', page: 'Shepherd your student through some research (Shifty)',
          req: [[LAB_STUDENTS[0].quality, 1, 2]], ch: 'Watchful 215', rp: true, win: labLin(0, 1),
          rare: labLin(1, 1), rareAlso: 'the student goes up a level', fail: { k: 1 },
          guide7: { win: 7, fail: 1 } },
        { branch: 'Collaborate with your student', page: 'Collaborate with your student (Shifty)',
          req: [[LAB_STUDENTS[0].quality, 3, 4]], ch: 'Watchful 210', rp: true, win: labLin(0, 5 / 3),
          rare: labLin(0, 5 / 3), rareAlso: 'the student goes up a level', fail: labLin(0, 1),
          guide7: { win: 12, fail: 7 } },
        { branch: 'Work with your Expert Student', page: 'Work with your Expert Student (Shifty)',
          req: [[LAB_STUDENTS[0].quality, 5, 5]], ch: 'Watchful 205', rp: true, win: labLin(0, 2),
          rare: labLin(1, 2), rareAlso: 'Disgruntlement +1 CP', fail: labLin(0, 4 / 3, 'up'),
          guide7: { win: 14, fail: 10 },
          note: 'The page does not say how the failure rounds; the guide\'s 10 at Equipment 7 is '
            + '9⅓ rounded up, so it is taken as rounding up.' },
        { branch: 'Encourage your student to work with his colleagues',
          page: 'Encourage your student to work with his colleagues (Shifty)',
          req: [[LAB_Q.workers, 2]], ch: 'Persuasive 215', win: { student: 2, workers: 2 },
          rare: { student: 3, workers: 3 }, fail: { student: 1, workers: 1 },
          note: 'Rare success chance is 5%.' },
      ],
    },
    {
      name: 'Work with your Meticulous Student', group: 'students', freq: 'Standard',
      student: LAB_STUDENTS[1].quality, needs: 'a Meticulous Student',
      opts: [
        { branch: 'Shepherd your student through some research', page: 'Shepherd your student through some research (Meticulous)',
          req: [[LAB_STUDENTS[1].quality, 1, 2]], ch: 'Watchful 210', rp: true, win: labLin(2, 1),
          rare: labLin(2, 1), rareAlso: 'the student goes up a level', fail: labLin(0, 1),
          guide7: { win: 9, fail: 8 }, guideOff: ['fail'] },
        { branch: 'Collaborate with your student', page: 'Collaborate with your student (Meticulous)',
          req: [[LAB_STUDENTS[1].quality, 3, 4]], ch: 'Watchful 225', rp: true, win: labLin(3, 5 / 3, 'up'),
          rare: labLin(3, 5 / 3, 'up'), rareAlso: 'the student goes up a level', fail: labLin(2, 1),
          guide7: { win: 15, fail: 14 }, guideOff: ['fail'] },
        { branch: 'Work with your expert student', page: 'Work with your expert student (Meticulous)',
          req: [[LAB_STUDENTS[1].quality, 5, 5]], ch: 'Watchful 220', rp: true, win: labLin(5, 2),
          rare: labLin(5, 2), rareAlso: 'Disgruntlement +1 CP', fail: labLin(2, 1),
          guide7: { win: 19, fail: 18 }, guideOff: ['fail'] },
        { branch: 'Employ her help in tabulating some data', req: [[LAB_STUDENTS[1].quality, 5, 5]],
          gate: 'an Unexpected Result', consumes: 'an Unexpected Result', ch: 'Watchful 220', rp: true,
          win: labLin(8, 2), rare: labLin(8, 2), rareAlso: 'Unwise Idea +1', fail: labLin(4, 1),
          failAlso: 'still uses up the Unexpected Result' },
        { branch: 'Follow up a hunch with your student', page: 'Follow up a hunch with your student (Meticulous)',
          req: [[LAB_STUDENTS[1].quality, 5, 5]], gate: LAB_UE, consumes: LAB_UE,
          ch: 'Watchful 220', rp: true, win: labLin(18, 3), rare: labLin(18, 3),
          rareAlso: 'Unexpected Result +1, Disgruntlement +1 CP', fail: labLin(8, 2),
          note: 'The page records no Epiphany lost on a failure.' },
      ],
    },
    {
      name: 'Work with your Gifted Student', group: 'students', freq: 'Standard',
      student: LAB_STUDENTS[2].quality, needs: 'a Gifted Student',
      note: 'Pair her with the Silk-Clad Expert is Fate-locked and not transcribed.',
      opts: [
        { branch: 'Shepherd your student through some research', page: 'Shepherd your student through some research (Gifted)',
          req: [[LAB_STUDENTS[2].quality, 1, 2]], ch: 'Watchful 210', rp: true, win: labLin(2, 1),
          rare: labLin(3, 5 / 3), rareAlso: 'the student goes up a level', fail: labLin(2, 1),
          guide7: { win: 9, fail: 8 }, guideOff: ['fail'] },
        { branch: 'Collaborate with your student', page: 'Collaborate with your student (Gifted)',
          req: [[LAB_STUDENTS[2].quality, 3, 4]], ch: 'Watchful 215', rp: true, win: labLin(3, 5 / 3, 'up'),
          rare: labLin(3, 5 / 3, 'up'), rareAlso: 'the student goes up a level', fail: labLin(2, 1, 'up'),
          guide7: { win: 14, fail: 13 }, guideOff: ['win', 'fail'] },
        { branch: 'Work with your expert student', page: 'Work with your expert student (Gifted)',
          req: [[LAB_STUDENTS[2].quality, 5, 5]], ch: 'Watchful 220', rp: true, win: labLin(5, 2),
          winAlso: 'Unlikely Connection +1', rare: labLin(10, 2),
          rareAlso: 'Unlikely Connection +1, Disgruntlement +1 CP', fail: labLin(3, 5 / 3, 'up'),
          guide7: { win: 19, fail: 15 },
          note: 'The page also lists a second failure worth 26 at Equipment 9, with no formula.' },
        { branch: 'Follow up a hunch with your student', page: 'Follow up a hunch with your student (Gifted)',
          req: [[LAB_STUDENTS[2].quality, 5, 5]], gate: LAB_UE, consumes: LAB_UE,
          ch: 'Watchful 220', rp: true, win: labLin(18, 3), rare: labLin(18, 3),
          rareAlso: 'Unexpected Result +1, Disgruntlement +1 CP', fail: labLin(8, 2) },
      ],
    },
    {
      name: 'Work with your Profound Student', group: 'students', freq: 'Standard',
      student: LAB_STUDENTS[3].quality, needs: 'a Profound Student',
      note: 'Encourage your student to work with the Percipient Cricketer is Fate-locked and not transcribed.',
      opts: [
        { branch: 'Shepherd your student through some research', page: 'Shepherd your student through some research (Profound)',
          req: [[LAB_STUDENTS[3].quality, 1, 2]], ch: 'Watchful 210', rp: true, win: labLin(4, 1),
          rare: labLin(4, 1), rareAlso: 'the student goes up a level', fail: labLin(0, 1),
          guide7: { win: 11, fail: 10 }, guideOff: ['fail'] },
        { branch: 'Collaborate with your student', page: 'Collaborate with your student (Profound)',
          req: [[LAB_STUDENTS[3].quality, 3, 4]], ch: 'Watchful 215', rp: true, win: labLin(7, 5 / 3, 'down'),
          rare: labLin(7, 5 / 3, 'down'), rareAlso: 'the student goes up a level', fail: labLin(4, 1),
          guide7: { win: 18, fail: 17 }, guideOff: ['fail'] },
        { branch: 'Work with your expert student', page: 'Work with your expert student (Profound)',
          req: [[LAB_STUDENTS[3].quality, 5, 5]], ch: 'Watchful 220', rp: true, win: labLin(8, 2),
          rare: labLin(10, 2), rareAlso: 'Disgruntlement +1 CP', fail: labLin(6, 1.75),
          guide7: { win: 23, fail: 18 }, guideOff: ['win'] },
        { branch: 'Follow up a hunch with your student', page: 'Follow up a hunch with your student (Profound)',
          req: [[LAB_STUDENTS[3].quality, 5, 5]], gate: LAB_UE, consumes: LAB_UE,
          ch: 'Watchful 220', rp: true, win: labLin(18, 3), rare: labLin(18, 3),
          rareAlso: 'Unwise Idea +1, Nightmares +1 CP, Disgruntlement +1 CP', fail: labLin(8, 2) },
      ],
    },
    {
      name: 'Work with your Visionary Student', group: 'students', freq: 'Standard',
      student: LAB_STUDENTS[4].quality, needs: 'a Visionary Student',
      opts: [
        { branch: 'Shepherd your student through some research', page: 'Shepherd your student through some research (Visionary)',
          req: [[LAB_STUDENTS[4].quality, 1, 2]], ch: 'Watchful 210', rp: true, win: labLin(4, 1),
          rare: labLin(4, 1), rareAlso: 'the student goes up a level', fail: labLin(3, 1),
          guide7: { win: 11, fail: 10 } },
        { branch: 'Collaborate with your student', page: 'Collaborate with your student (Visionary)',
          req: [[LAB_STUDENTS[4].quality, 3, 4]], ch: 'Watchful 215', rp: true, win: labLin(7, 5 / 3, 'down'),
          rare: labLin(8, 5 / 3, 'down'), rareAlso: 'the student goes up a level',
          fail: labLin(6, 5 / 3, 'down'), guide7: { win: 18, fail: 17 } },
        { branch: 'Work with your expert student', page: 'Work with your expert student (Visionary)',
          req: [[LAB_STUDENTS[4].quality, 5, 5]], ch: 'Watchful 220', rp: true, win: labLin(9, 2),
          rare: labLin(10, 2), rareAlso: 'Disgruntlement +1 CP', fail: labLin(6.5, 1.6),
          guide7: { win: 23, fail: 18 } },
        { branch: 'Leave your student to their own devices', req: [[LAB_STUDENTS[4].quality, 5, 5]],
          luck: 0.5, win: { team: 0.2, k: 2 }, winAlso: 'Unlikely Connection +1',
          rare: { team: 0.2, k: 2 }, rareAlso: 'Unwise Idea +1',
          fail: { team: 0.2, k: 2 }, failAlso: 'Unexpected Result +1, or Nightmares −2 CP instead',
          note: 'Every outcome pays the same research, and none raises Disgruntlement.' },
        { branch: 'Follow up a hunch with your student', page: 'Follow up a hunch with your student (Visionary)',
          req: [[LAB_STUDENTS[4].quality, 5, 5]], gate: LAB_UE, consumes: LAB_UE,
          ch: 'Watchful 220', rp: true, win: labLin(18, 3), rare: labLin(18, 3),
          rareAlso: 'Unwise Idea +1, Nightmares +1 CP, Disgruntlement +1 CP', fail: labLin(8, 2),
          failAlso: 'still uses up the Epiphany' },
        { branch: 'Let them tutor your other students', req: [[LAB_STUDENTS[4].quality, 5, 5]],
          gate: 'at least one other student in the lab',
          ch: 'Persuasive 240, plus 2 for every level your other students have', win: labLin(8, 2),
          winAlso: 'every other student goes up a level', fail: labLin(8, 2),
          failAlso: 'every other student goes up a level; Disgruntlement +1 CP' },
      ],
    },

    // === staff ============================================================
    {
      name: '\'Rely\' on the Struggling Artist', group: 'staff', freq: 'Very Infrequent',
      needs: 'the Struggling Artist on a sinecure',
      opts: [
        { branch: 'Send him on another errand', ch: 'Persuasive 240', rp: true, label: 'Honey ×150',
          winAlso: 'Drop of Prisoner\'s Honey +150', failAlso: 'Scandal +4 CP' },
        { branch: 'Hook him up to all the meters and stand well out of the way', gate: 'an Unwise Idea',
          consumes: 'an Unwise Idea', win: labLin(18, 3), epiphany: true,
          winAlso: 'Scandal +2 CP; the Struggling Artist leaves the lab for good',
          note: 'Locked while you have Theoretical Methods.' },
      ],
    },
    {
      name: 'A Grubby Urchin at Work', group: 'staff', freq: 'Standard', needs: 'a Grubby Urchin',
      opts: [
        { branch: 'Ask your grubby urchin to tidy up your papers', ch: 'Dangerous 150', win: { k: 1 },
          fail: { k: 1 }, failAlso: 'Wounds +2 CP' },
        { branch: 'Ask what he knows of the Storm-bird', eo: [[440, 440]], gate: 'Stormy-Eyed',
          label: 'story' },
      ],
    },
    {
      name: 'Rely on the Numismatrix', group: 'staff', freq: 'Standard', needs: 'the Numismatrix',
      opts: [
        { branch: 'Ask her to help with ordinary research', page: 'Ask her to help with ordinary research (Numismatrix)',
          eo: [[1, 249], [251, 979], [981, 1300]], win: labLin(0, 5 / 3),
          note: 'The guide\'s card table also excludes project 30; the option page does not.' },
        { branch: 'Ask her to help with unusual research', eo: [[1301, 1610]], ch: 'Persuasive 200',
          win: labLin(4, 2), epiphany: true, fail: labLin(0, 5 / 3) },
        { branch: 'Apply her particular expertise in a novel way',
          page: 'Apply her particular expertise in a novel way (Numismatrix)',
          gate: 'an Unlikely Connection', consumes: 'an Unlikely Connection', ch: 'Watchful 220', rp: true,
          win: labLin(7, 2), winAlso: 'Unexpected Result +1', fail: labLin(5, 2) },
        { branch: 'Ask for her special expertise on this project', page: 'Ask for her special expertise on this project 30',
          eo: [[30, 30]], label: 'Numismatic +10', winAlso: 'Numismatic Research +10' },
        { branch: 'Ask for her special expertise on this project', page: 'Ask for her special expertise on this project 250',
          eo: [[250, 250]], win: labLin(4, 2), epiphany: true },
        { branch: 'Ask for her special expertise on this project', page: 'Ask for her special expertise on this project 980',
          eo: [[980, 980]], win: labLin(4, 2), epiphany: true },
      ],
    },
    {
      name: 'Rely on Lettice, the Mercy', group: 'staff', freq: 'Standard', needs: 'Lettice, the Mercy',
      opts: [
        { branch: 'Ask her what a Tomb Colonist would say about this', eo: [[110, 120], [1320, 1320]],
          label: 'Third City +10', winAlso: 'Expertise of the Third City +10' },
        { branch: 'Ask her to help with ordinary research', page: 'Ask her to help with ordinary research (Lettice)',
          req: [[LAB_Q.equipment, 5]], win: { range: [1, 44] }, winAlso: 'Unwise Idea +0–1',
          note: 'The page gives the range and nothing about how it is spread, so the badge does not '
            + 'pretend to an average.' },
        { branch: 'Take tea with Lettice', label: 'menaces −2', winAlso: 'Wounds −2 CP, Nightmares −2 CP' },
        { branch: 'Have her supervise the Gifted Student', req: [[LAB_STUDENTS[2].quality, 5]],
          eo: [[401, 500]], ch: 'Watchful 220', win: labLin(12, 2), winAlso: 'Unexpected Result +1',
          fail: labLin(5, 2) },
        { branch: 'Apply her particular expertise in a novel way',
          page: 'Apply her particular expertise in a novel way (Lettice)',
          gate: 'an Unlikely Connection', consumes: 'an Unlikely Connection', ch: 'Watchful 220', rp: true,
          win: labLin(7, 2), winAlso: 'Unexpected Result +1', fail: labLin(5, 2) },
      ],
    },
    {
      name: 'Rely on F.F. Gebrandt', group: 'staff', freq: 'Standard', needs: 'F.F. Gebrandt',
      note: 'Her card page lists only the first option; the rest are from their own option pages.',
      opts: [
        { branch: 'Aid F.F. Gebrandt in Refining her Formulas',
          gate: 'Nodule of Warm Amber 5, Phosphorescent Scarab 5, Flask of Abominable Salts 5',
          consumes: '5 each of Warm Amber, Phosphorescent Scarabs and Abominable Salts',
          ch: 'Watchful 200', label: 'Laudanum',
          winAlso: 'F.F. Gebrandt\'s Superior Laudanum +1, Tincture of Vigour +1, Volume of Collated Research +1',
          failAlso: 'the Laudanum and the Tincture, but no Collated Research' },
        { branch: 'Get her opinion on your research', notEo: [[901, 1000]], win: labLin(0, 5 / 3) },
        { branch: 'Apply her particular expertise in a novel way',
          page: 'Apply her particular expertise in a novel way (F.F. Gebrandt)',
          notEo: [[901, 1000]], gate: 'an Unlikely Connection', consumes: 'an Unlikely Connection',
          ch: 'Watchful 220', rp: true, win: labLin(7, 2), winAlso: 'Unexpected Result +1', fail: labLin(5, 2) },
        { branch: 'Rely on her knowledge of chemistry', eo: [[901, 1000]], win: labLin(8, 1.5), epiphany: true },
        { branch: 'Let F.F. Gebrandt employ your Profound Student', req: [[LAB_STUDENTS[3].quality, 5]],
          eo: [[901, 1000]], ch: 'Watchful 220', win: labLin(10, 2), winAlso: 'Unexpected Result +1',
          fail: labLin(10, 2), failAlso: 'Disgruntlement +1 CP' },
        { branch: 'Take Tea with F.F. Gebrandt', gate: 'The Airs of London 1–25', label: 'Airs',
          winAlso: 'changes The Airs of London' },
      ],
    },

    // === Parabolan research ===============================================
    {
      name: 'The Reflection of Research', group: 'parabola', freq: 'Standard',
      needs: 'Parabolan Methods, Glass Studies and 2 workers',
      note: 'The ambition and Fate-locked staff have options here too, and they are not transcribed.',
      opts: [
        { branch: 'Employ the Reflection of a Future Dean', req: [[LAB_STUDENTS[0].quality, 1]], cur: 'pr', win: { k: 4 } },
        { branch: 'Employ the Reflection of a Potential Librarian', req: [[LAB_STUDENTS[1].quality, 1]], cur: 'pr', win: { k: 1, glass: 1 } },
        { branch: 'Employ the Reflection of a Young Aristocrat', req: [[LAB_STUDENTS[2].quality, 1]], cur: 'pr', win: { k: 2, glass: 1 } },
        { branch: 'Employ the Reflection of a Deep-thinking Oak', req: [[LAB_STUDENTS[3].quality, 1]], cur: 'pr', win: { k: 2, glass: 1 } },
        { branch: 'Employ a Cloud of Thoughts That Will Not Settle Down', req: [[LAB_STUDENTS[4].quality, 1]],
          cur: 'pr', win: { k: 5, glass: 1 }, winAlso: 'Nightmares +1 CP' },
        { branch: 'Try to get something useful out of a distracted artist', req: [[LAB_STAFF[4].quality, 1]], cur: 'pr', win: { k: 1, glass: 1 } },
        { branch: 'Employ the Reflection of a Grubby Urchin', req: [[LAB_STAFF[3].quality, 1]], cur: 'pr', win: { k: 2, glass: 1 } },
        { branch: 'Employ the Reflection of Lettice, the Mercy', req: [[LAB_STAFF[1].quality, 1]], cur: 'pr', win: { range: [1, 8] } },
        { branch: 'Employ the Reflection of the Numismatrix', req: [[LAB_STAFF[0].quality, 1]], cur: 'pr', win: { k: 5, glass: 1 } },
        { branch: 'Employ the Reflection of F.F. Gebrandt', req: [[LAB_STAFF[2].quality, 1]], cur: 'pr', win: { k: 2, glass: 1 } },
        { branch: 'No more of this', page: 'No more of this (The Reflection of Research)', label: 'discard',
          winAlso: 'removes this card for the rest of the project' },
      ],
    },
  ];

  // The pages' own worked examples of the team formula, which is the one piece
  // of arithmetic here the wiki checks for us: "38 Laboratory Research with 9
  // Equipment Level and 4 Workers (at least 1 Expert or Expert Student)".
  const LAB_TEAM_EXAMPLES = [
    { team: 0.2, el: 9, workers: 4, high: 5, research: 38 },
    { team: 0.2, el: 7, workers: 3, high: 5, research: 29 },
    { team: 0.08, el: 9, workers: 4, high: 5, research: 27 },
    { team: 0.08, el: 7, workers: 3, high: 5, research: 22 },
  ];

  const LAB_CLASS = 'fl-ux-lab';
  const LAB_FLAG = 'flUxLab';
  const LAB_BRANCH_CLASS = 'fl-ux-lab-branch';
  const LAB_BRANCH_FLAG = 'flUxLabBranch';

  const LAB_EL_MIN = 1;
  const LAB_EL_MAX = 9;

  const LAB_MARK_EPIPHANY = '✦';
  const LAB_MARK_CONSUMES = '▼';
  const LAB_MARK_CHALLENGE = '?';
  const LAB_MARK_EV = '≈';
  const LAB_MARK_HIDDEN = '▾';
  const LAB_MARK_STALE = '~';

  // --- colour --------------------------------------------------------------
  //
  // A ramp, because research is a quantity, with the number printed on the
  // badge as well. One colour per band of ten, running slate → blue → teal →
  // amber → gold; the teal and the amber are told apart along the blue-yellow
  // axis, which red-green weakness leaves alone. A range is neutral grey
  // rather than the colour of either end, since a colour would claim a figure
  // the badge cannot. Parabolan Research is a different currency and has its
  // own violet; an option paying no research at all has a dark plum and a word.
  const LAB_RAMP = [
    { min: 40, color: '#e0b53a', ink: '#14181c' },
    { min: 30, color: '#9a5b12' },
    { min: 20, color: '#1f7a73' },
    { min: 10, color: '#2d6aa0' },
    { min: -Infinity, color: '#465262' },
  ];
  const LAB_COLOR_RANGE = '#6e6e6e';
  const LAB_COLOR_PR = '#7c4dab';
  const LAB_COLOR_LABEL = '#4a3f5a';

  function labRamp(value) {
    for (const step of LAB_RAMP) if (value >= step.min) return step;
    return LAB_RAMP[LAB_RAMP.length - 1];
  }

  // --- arithmetic ----------------------------------------------------------

  function labRound(x, how) {
    if (how === 'up') return Math.ceil(x - 1e-9);
    if (how === 'down') return Math.floor(x + 1e-9);
    const floor = Math.floor(x);
    if (Math.abs(x - floor - 0.5) < 1e-9) return floor % 2 === 0 ? floor : floor + 1;
    return Math.round(x);
  }

  function labCurve(c, x) {
    return labRound((c.y || 0) + c.height / (1 + Math.exp(-c.k * (x - c.mid))));
  }

  // Circulate a draft of your findings, as the option page and the wiki's
  // calculator state it: 100 × (research done ÷ research required, at most 1)
  // + 10 × Unexpected Results^(0.9 + research required ÷ 200,000).
  function labDraft(done, required, results) {
    if (done == null || required == null || results == null || !(required > 0)) return null;
    return labRound(100 * Math.min(done / required, 1)
      + 10 * Math.pow(results, 0.9 + required / 200000));
  }

  // What the leftovers turn into when the project ends (Put everything back
  // where you found it), rounded down, as the calculator page states it.
  function labCollated(items) {
    if (!items) return null;
    const n = function (v) { return typeof v === 'number' ? v : 0; };
    return Math.floor(0.6 * n(items.epiphany) + 0.6 * n(items.idea)
      + 0.2 * n(items.connection) + 0.2 * n(items.result) + 1e-9);
  }

  const LAB_LINEAR_KEYS = ['el', 'glass', 'student', 'workers', 'ideas'];

  // A formula and complete inputs in, a figure out -- or null where an input
  // it needs is missing. Never a zero standing in for "not read".
  function labCompute(f, inp) {
    if (!f || f.range) return null;
    if (f.draft) return labDraft(inp.research, inp.required, inp.results);
    if (f.team != null) {
      if (inp.el == null || inp.workers == null || inp.high == null) return null;
      return labRound(((f.k == null ? 2 : f.k) + f.team * inp.el) * Math.sqrt(inp.workers) * inp.high);
    }
    if (f.curve) {
      const x = f.of === 'el' ? inp.el : (inp.skills ? inp.skills[f.of] : null);
      return x == null ? null : labCurve(f.curve, x);
    }
    let sum = f.k || 0;
    for (const key of LAB_LINEAR_KEYS) {
      if (!f[key]) continue;
      if (inp[key] == null) return null;
      sum += f[key] * inp[key];
    }
    return labRound(sum, f.round);
  }

  function labUsesEl(f) {
    return !!f && (!!f.el || f.team != null || (!!f.curve && f.of === 'el'));
  }

  function labInputs(state, card) {
    const q = state.q;
    const skills = {};
    for (const s of LAB_SKILLS) skills[s] = q[s];
    return {
      el: q[LAB_Q.equipment],
      glass: q[LAB_Q.glass],
      workers: q[LAB_Q.workers],
      student: card && card.student ? q[card.student] : null,
      high: state.high,
      ideas: state.items.idea,
      results: state.items.result,
      research: q[LAB_Q.research],
      required: q[LAB_Q.required],
      skills: skills,
    };
  }

  // One outcome's research as { lo, hi }: a single figure where the inputs are
  // read, the span over Equipment 1-9 where only the Equipment is missing (every
  // formula here grows with Equipment), and null where anything else is.
  function labOutcome(f, state, card) {
    if (!f) return null;
    if (f.range) return { lo: f.range[0], hi: f.range[1], random: true };
    const inp = labInputs(state, card);
    if (inp.el == null && labUsesEl(f)) {
      const lo = labCompute(f, Object.assign({}, inp, { el: LAB_EL_MIN }));
      const hi = labCompute(f, Object.assign({}, inp, { el: LAB_EL_MAX }));
      if (lo == null || hi == null) return null;
      return { lo: Math.min(lo, hi), hi: Math.max(lo, hi), elUnknown: true };
    }
    const v = labCompute(f, inp);
    return v == null ? null : { lo: v, hi: v };
  }

  function labTenth(x) {
    return Math.round(x * 10) / 10;
  }

  // What an option is worth on the badge: the success figure, or for a Luck
  // option the expectation over success and failure.
  function labOptionValue(opt, card, state) {
    if (opt.label) return null;
    const win = labOutcome(opt.win, state, card);
    if (!win) return null;
    if (opt.luck == null) return win;
    const fail = opt.fail ? labOutcome(opt.fail, state, card) : { lo: 0, hi: 0 };
    if (!fail) return null;
    const p = opt.luck;
    return {
      lo: labTenth(p * win.lo + (1 - p) * fail.lo),
      hi: labTenth(p * win.hi + (1 - p) * fail.hi),
      ev: true, elUnknown: win.elUnknown,
    };
  }

  function labScore(v) {
    return v.random ? v.lo : (v.lo + v.hi) / 2;
  }

  // Can you take it? 'open', 'shut', 'unknown' (a requirement the scrape has
  // not read), or 'gated' (a requirement on something special, or on a project
  // number that has not been read).
  function labStatus(opt, card, state) {
    let unknown = false;
    for (const r of opt.req || []) {
      const have = state.q[r[0]];
      if (have == null) { unknown = true; continue; }
      if (have < r[1] || (r[2] != null && have > r[2])) return 'shut';
    }
    if (opt.eo || opt.notEo) {
      const eo = state.q[LAB_Q.eo];
      if (eo == null) return 'gated';
      const inside = function (ranges) {
        return ranges.some(function (g) { return eo >= g[0] && eo <= g[1]; });
      };
      if (opt.eo && !inside(opt.eo)) return 'shut';
      if (opt.notEo && inside(opt.notEo)) return 'shut';
    }
    if (opt.gate) return 'gated';
    return unknown ? 'unknown' : 'open';
  }

  // A figure that rests on something that moves every few actions, read more
  // than a minute ago.
  function labOptionStale(opt, state) {
    const f = opt.win;
    if (!f) return false;
    if (f.ideas) return state.itemsStale;
    if (f.draft) return state.stale || state.itemsStale;
    return false;
  }

  // --- words ---------------------------------------------------------------

  const LAB_INPUT_WORDS = {
    el: 'Equipment', glass: 'Glass Studies', student: 'student level', workers: 'Workers', ideas: 'Unwise Ideas',
  };
  const LAB_FRACTIONS = [[5 / 3, '5/3'], [4 / 3, '4/3']];

  function labCoefText(c) {
    for (const pair of LAB_FRACTIONS) if (Math.abs(c - pair[0]) < 1e-9) return pair[1];
    return String(c);
  }

  function labFormulaText(f) {
    if (!f) return null;
    if (f.range) return f.range[0] + '–' + f.range[1] + ', at random';
    if (f.draft) {
      return '100 × the share of the project done (at most all of it) + 10 × Unexpected Results '
        + 'to the power of (0.9 + research required ÷ 200,000)';
    }
    if (f.team != null) {
      return '(' + (f.k == null ? 2 : f.k) + ' + ' + f.team + ' × Equipment) × √Workers × highest worker level';
    }
    if (f.curve) {
      return 'an S-curve on ' + (f.of === 'el' ? 'Equipment' : f.of) + ' (height ' + f.curve.height
        + ', midpoint ' + f.curve.mid + (f.curve.y ? ', offset ' + f.curve.y : '') + ')';
    }
    const parts = [];
    for (const key of LAB_LINEAR_KEYS) {
      if (!f[key]) continue;
      parts.push(f[key] === 1 ? LAB_INPUT_WORDS[key] : labCoefText(f[key]) + ' × ' + LAB_INPUT_WORDS[key]);
    }
    let text = parts.join(' + ');
    if (f.k) text = parts.length ? (f.k < 0 ? text + ' − ' + (-f.k) : f.k + ' + ' + text) : String(f.k);
    if (!text) text = '0';
    if (f.round === 'up') text += ', rounded up';
    else if (f.round === 'down') text += ', rounded down';
    return text;
  }

  function labNumText(v) {
    return v.lo === v.hi ? String(v.lo) : v.lo + '–' + v.hi;
  }

  function labCurrency(opt) {
    return opt.cur === 'pr' ? 'Parabolan Research' : 'Laboratory Research';
  }

  function labOutcomeWords(f, opt, card, state) {
    if (!f) return null;
    const v = labOutcome(f, state, card);
    const formula = labFormulaText(f);
    if (!v) return labCurrency(opt) + ' ' + formula + ' — needs a reading this feature does not have yet';
    if (f.range) return formula + ' ' + labCurrency(opt);
    const plain = f.k != null && !LAB_LINEAR_KEYS.some(function (k) { return f[k]; })
      && f.team == null && !f.curve && !f.draft;
    return labNumText(v) + ' ' + labCurrency(opt) + (plain ? '' : ' (' + formula
      + (v.elUnknown ? '; your Equipment has not been read, so this covers Equipment 1–9' : '') + ')');
  }

  function labReqWords(opt) {
    const words = (opt.req || []).map(function (r) {
      if (r[0] === LAB_Q.disgruntlement && r[1] === 0 && r[2] === 0) return 'no Disgruntlement among the Students';
      if (r[2] == null) return r[0] + ' ' + r[1];
      return r[0] + ' ' + (r[1] === r[2] ? 'exactly ' + r[1] : r[1] + '–' + r[2]);
    });
    const range = function (g) { return g[0] === g[1] ? String(g[0]) : g[0] + '–' + g[1]; };
    if (opt.eo) words.push('Experimental Object ' + opt.eo.map(range).join(' or '));
    if (opt.notEo) words.push('Experimental Object outside ' + opt.notEo.map(range).join(' and '));
    if (opt.gate) words.push(opt.gate);
    return words.join('; ');
  }

  function labStateLine(state) {
    if (!state.read) {
      return 'Your laboratory has not been read yet. Open the Myself tab once and every figure '
        + 'becomes your own; until then anything scaling with Equipment covers Equipment 1–9.';
    }
    const q = state.q;
    const bits = ['Equipment ' + q[LAB_Q.equipment], q[LAB_Q.workers] + ' workers'];
    if (state.high != null) bits.push('highest worker level ' + state.high);
    for (const s of LAB_STUDENTS) if (q[s.quality]) bits.push(s.name + ' ' + q[s.quality]);
    return 'Read off Myself ' + (state.live ? 'just now' : ageText(state.at)) + ': ' + bits.join(', ') + '.';
  }

  const LAB_LEGEND = LAB_MARK_CHALLENGE + ' a challenge\'s success figure · ' + LAB_MARK_EV
    + ' a Luck option\'s expected value · ' + LAB_MARK_EPIPHANY + ' also gives an Unavoidable Epiphany · '
    + LAB_MARK_CONSUMES + ' uses something up · ' + LAB_MARK_HIDDEN
    + ' an option needing something special would pay more · ' + LAB_MARK_STALE
    + ' from a reading over a minute old · PR Parabolan Research · a–b a range, where something '
    + 'it depends on has not been read.';

  function labOptionLines(opt, card, state) {
    const lines = [];
    const status = labStatus(opt, card, state);
    if (status === 'shut') lines.push('Not open to you right now.');
    const needs = labReqWords(opt);
    if (needs) lines.push('Needs: ' + needs);
    if (opt.luck != null) lines.push('Luck: ' + Math.round(opt.luck * 100) + '% to succeed');
    else if (opt.ch) lines.push('Challenge: ' + opt.ch + (opt.rp ? ', lowered by Research Preparations' : ''));
    const out = function (title, f, also) {
      const words = [labOutcomeWords(f, opt, card, state), also].filter(Boolean).join('; ');
      if (words) lines.push(title + ': ' + words);
    };
    out(opt.ch || opt.luck != null ? 'Success' : 'Gives', opt.win, opt.winAlso);
    out('Rare success', opt.rare, opt.rareAlso);
    out('Alternative success', opt.alt, opt.altAlso);
    out('Failure', opt.fail, opt.failAlso);
    if (opt.epiphany) lines.push(LAB_MARK_EPIPHANY + ' A success gives an Unavoidable Epiphany.');
    if (opt.consumes) lines.push(LAB_MARK_CONSUMES + ' Uses up ' + opt.consumes + '.');
    if (opt.guide7 && opt.guideOff) {
      const inp = labInputs(Object.assign({}, state, { q: Object.assign({}, state.q, { [LAB_Q.equipment]: 7 }) }), card);
      for (const key of opt.guideOff) {
        lines.push('The guide\'s Student Table says ' + opt.guide7[key] + ' on a ' + (key === 'win' ? 'success' : 'failure')
          + ' at Equipment 7; the option page works out to ' + labCompute(opt[key], inp) + ', and the page is used.');
      }
    }
    if (opt.note) lines.push(opt.note);
    return lines;
  }

  // --- the two badges ------------------------------------------------------

  function labMarks(opt, hidden) {
    return (opt.epiphany ? LAB_MARK_EPIPHANY : '')
      + (opt.consumes ? LAB_MARK_CONSUMES : '')
      + (opt.ch && opt.luck == null ? LAB_MARK_CHALLENGE : '')
      + (hidden ? LAB_MARK_HIDDEN : '');
  }

  function labPaint(opt, v) {
    if (opt.cur === 'pr') return { color: LAB_COLOR_PR };
    if (v.lo !== v.hi) return { color: LAB_COLOR_RANGE };
    return labRamp(v.lo);
  }

  function labValueText(opt, v, stale) {
    return (stale ? LAB_MARK_STALE : '') + (opt.cur === 'pr' ? 'PR ' : '')
      + (v.ev ? LAB_MARK_EV : '') + labNumText(v);
  }

  // What the badge says for an option whose figure cannot be worked out.
  function labUnreadText(opt) {
    const f = opt.win;
    if (f && f.ideas) return f.ideas + '/idea';
    if (f && f.draft) return 'draft';
    if (f && f.curve && f.of !== 'el') return 'skill';
    if (f && f.team != null) return 'team';
    return 'research';
  }

  function labOptionSpec(opt, card, state) {
    const v = labOptionValue(opt, card, state);
    const stale = labOptionStale(opt, state);
    const lines = [opt.branch, 'On ' + card.name, labStateLine(state), ''].concat(labOptionLines(opt, card, state));
    if (stale) lines.push(LAB_MARK_STALE + ' The Possessions or Myself reading behind this is over a minute old.');
    lines.push('', LAB_LEGEND);
    const title = lines.join('\n');
    if (opt.label) {
      return { text: opt.label + (opt.consumes ? LAB_MARK_CONSUMES : ''), color: LAB_COLOR_LABEL, title: title };
    }
    if (!v) {
      return { text: labUnreadText(opt) + labMarks(opt, false), color: LAB_COLOR_RANGE, title: title, stale: stale };
    }
    const paint = labPaint(opt, v);
    const spec = {
      text: labValueText(opt, v, stale) + labMarks(opt, false),
      color: paint.color, title: title, stale: stale,
    };
    if (paint.ink) spec.ink = paint.ink;
    return spec;
  }

  // The card's badge: the best option you can take with nothing special in
  // hand. See the head of this section for why the rest are left out.
  function labCardSpec(card, state) {
    const rows = card.opts.map(function (opt) {
      return { opt: opt, status: labStatus(opt, card, state), value: labOptionValue(opt, card, state) };
    });
    const takeable = function (r) { return r.status === 'open' || r.status === 'unknown'; };
    const ranked = rows.filter(function (r) { return takeable(r) && r.value; });
    const pick = function (list) {
      let best = null;
      for (const r of list) if (!best || labScore(r.value) > labScore(best.value)) best = r;
      return best;
    };
    const best = pick(ranked);
    const sure = pick(ranked.filter(function (r) { return r.status === 'open'; }));

    const lines = [card.name, labStateLine(state), ''];
    let spec;
    if (best) {
      const maybe = ranked.filter(function (r) { return r.status === 'unknown'; });
      let lo, hi;
      if (sure) {
        lo = sure.value.lo;
        hi = Math.max.apply(null, [sure.value.hi].concat(maybe.map(function (r) { return r.value.hi; })));
      } else {
        lo = Math.min.apply(null, maybe.map(function (r) { return r.value.lo; }));
        hi = Math.max.apply(null, maybe.map(function (r) { return r.value.hi; }));
      }
      const v = { lo: lo, hi: hi, ev: !!best.value.ev && lo === hi };
      // A better figure behind something special, or one that cannot be
      // worked out at all yet.
      const hidden = rows.some(function (r) {
        if (r.opt.label || r.status === 'shut') return false;
        if (r.status === 'gated') return !r.value || r.value.hi > hi;
        return !r.value;
      });
      const stale = labOptionStale(best.opt, state);
      const paint = labPaint(best.opt, v);
      spec = {
        text: labValueText(best.opt, v, stale) + labMarks(best.opt, hidden),
        color: paint.color, stale: stale,
      };
      if (paint.ink) spec.ink = paint.ink;
      lines.push('Best with nothing special in hand: ' + best.opt.branch
        + (best.status === 'unknown' ? ' (if it is open to you — something it needs has not been read)' : ''));
      if (lo !== hi && !v.ev) {
        lines.push(best.value.elUnknown
          ? 'A range, because your Equipment has not been read.'
          : 'A range, because which of these options you are offered depends on something not read yet.');
      }
      if (stale) lines.push(LAB_MARK_STALE + ' The reading behind this is over a minute old.');
      if (hidden) lines.push(LAB_MARK_HIDDEN + ' An option needing something special could pay more.');
    } else {
      const label = rows.find(function (r) { return r.opt.label && takeable(r); });
      if (label) {
        spec = { text: label.opt.label, color: LAB_COLOR_LABEL };
        lines.push('Pays no research: ' + label.opt.branch + '.');
      } else {
        spec = { text: LAB_MARK_HIDDEN, color: LAB_COLOR_RANGE };
        lines.push('Nothing here you can take with nothing special in hand, or nothing that can be worked out yet.');
      }
    }

    lines.push('');
    lines.push('Every option:');
    for (const r of rows) {
      const v = r.value;
      const what = r.opt.label ? r.opt.label
        : v ? labValueText(r.opt, v, false) + ' ' + (r.opt.cur === 'pr' ? 'PR' : 'research')
          + (v.random ? ' at random' : '')
        : labUnreadText(r.opt) + ', not yet worked out';
      const flags = [];
      if (r.status === 'shut') flags.push('not open to you');
      if (r.status === 'gated' || r.opt.gate) flags.push('needs ' + labReqWords(r.opt));
      if (r.opt.luck != null) flags.push('Luck ' + Math.round(r.opt.luck * 100) + '%');
      else if (r.opt.ch) flags.push(r.opt.ch);
      if (r.opt.epiphany) flags.push(LAB_MARK_EPIPHANY + ' Epiphany');
      if (r.opt.consumes) flags.push(LAB_MARK_CONSUMES + ' uses ' + r.opt.consumes);
      lines.push('  • ' + r.opt.branch + ' — ' + what + (flags.length ? ' [' + flags.join('; ') + ']' : ''));
    }
    if (card.note) lines.push('', card.note);
    lines.push('', 'Needs: ' + card.needs + '.', '', 'Open the card and every option is badged in its own right.', LAB_LEGEND);
    spec.title = lines.join('\n');
    return spec;
  }

  // --- reading your laboratory ---------------------------------------------

  const LAB_CACHE_KEY = 'fl-ux-lab';
  const LAB_FRESH_MS = 60 * 1000;
  let labGen = 0;

  // Same rule as every other scrape here: FL does not render a quality you have
  // none of, so absent is 0 -- but only while the tab's search box is empty.
  function labFromQualities(scan) {
    const values = {};
    const zeroIsSafe = !scan.filtered;
    for (const name of LAB_QUALITIES) {
      const q = scan.values.get(name);
      if (q) values[name] = q.level;
      else if (zeroIsSafe) values[name] = 0;
    }
    return values;
  }

  function bankLabQualities(scan) {
    if (!scan) return false;
    const values = labFromQualities(scan);
    if (!Object.keys(values).length) return false;
    saveCache(LAB_CACHE_KEY, {
      v: 1, at: Date.now(), character: characterName() || null,
      partial: scan.filtered, values: values,
    });
    labGen++;
    return true;
  }

  function readLabQualities() {
    const scan = readQualities();
    if (scan) {
      const values = labFromQualities(scan);
      if (Object.keys(values).length) return { live: true, at: Date.now(), values: values };
    }
    const rec = loadCache(LAB_CACHE_KEY, 1);
    return rec && rec.values ? { live: false, at: rec.at, values: rec.values } : null;
  }

  function readLabItems() {
    const here = readPossessionCounts();
    if (here && here.size) return { live: true, at: Date.now(), held: here };
    const rec = loadCounts();
    return rec ? { live: false, at: rec.at, held: rec.held } : null;
  }

  // "Highest Worker Level", which the team options multiply by. The pages'
  // examples all say "at least 1 Expert or Expert Student" and come out at 5,
  // so a lab with anyone in it who is not a student counts as 5, and a lab of
  // students alone as its best student. Whether the Struggling Artist or the
  // Urchin count as experts for this is not recorded.
  function labHighest(q) {
    const workers = q[LAB_Q.workers];
    if (workers == null) return null;
    let students = 0, top = 0;
    for (const s of LAB_STUDENTS) {
      const level = q[s.quality];
      if (level == null) return null;
      if (level > 0) { students++; top = Math.max(top, level); }
    }
    return workers > students ? 5 : top;
  }

  // A pure state from the two readings, so the tests can build one directly.
  function labStateFrom(qualities, items, now) {
    const t = now == null ? Date.now() : now;
    const q = {};
    for (const name of LAB_QUALITIES) {
      const v = qualities && qualities.values ? qualities.values[name] : undefined;
      q[name] = typeof v === 'number' ? v : null;
    }
    const count = function (name) {
      if (!items || !items.held) return null;
      const rec = items.held.get(itemKey(name));
      return rec ? rec.count : 0;
    };
    const state = {
      read: !!qualities,
      live: !!(qualities && qualities.live),
      at: qualities ? qualities.at : null,
      stale: !qualities || (!qualities.live && t - qualities.at > LAB_FRESH_MS),
      itemsRead: !!items,
      itemsStale: !items || (!items.live && t - items.at > LAB_FRESH_MS),
      q: q,
      items: {},
    };
    for (const key of Object.keys(LAB_ITEMS)) state.items[key] = count(LAB_ITEMS[key]);
    state.high = labHighest(q);
    return state;
  }

  // Memoised per reading and per minute, bucketed for the reason `pcPurse`'s is:
  // `labRatings` asks once per card per scan.
  let labStateMemo = null;
  function labState() {
    const key = labGen + '/' + fotzGen + '@' + Math.floor(Date.now() / LAB_FRESH_MS);
    if (labStateMemo && labStateMemo.key === key) return labStateMemo.value;
    let value;
    try {
      value = labStateFrom(readLabQualities(), readLabItems());
    } catch (e) {
      value = labStateFrom(null, null);
    }
    value.sig = key;
    labStateMemo = { key: key, value: value };
    return value;
  }

  // --- looking one up ------------------------------------------------------

  const LAB_BY_CARD = new Map(LAB_CARDS.map(function (card) { return [normalizeName(card.name), card]; }));

  function labCardFor(name) {
    return LAB_BY_CARD.get(normalizeName(name)) || null;
  }

  function labBranchRows(card, name) {
    const key = normalizeName(name);
    return card.opts.filter(function (opt) { return normalizeName(opt.branch) === key; });
  }

  // "Coordinate a plan of research" and "Ask for her special expertise on this
  // project" are each on one card more than once, told apart by what you have.
  // Narrow by what can be read; failing that, answer only if every candidate
  // would say the same thing.
  function labDisambiguate(rows, card, state) {
    if (rows.length <= 1) return rows[0] || null;
    const open = rows.filter(function (opt) { return labStatus(opt, card, state) !== 'shut'; });
    if (open.length === 1) return open[0];
    const pool = open.length ? open : rows;
    const sig = function (opt) { return JSON.stringify([opt.win || null, opt.label || null, opt.epiphany || false]); };
    return pool.every(function (opt) { return sig(opt) === sig(pool[0]); }) ? pool[0] : null;
  }

  // --- the area gate -------------------------------------------------------
  //
  // Captured in-game (2026-09-14), in the lab: "Welcome to The University,
  // delicious friend!" -- the lab is, as the wiki says, "how The University
  // appears in the setting Science Laboratory". So this is an EXACT list and
  // may say no: a greeting naming anywhere else clears every lab badge.
  //
  // It cannot say yes on its own, though, because "The University" is also the
  // ordinary London area outside the lab. There it narrows things to the
  // University, which is enough to trust the ordinary-English card names (see
  // below) -- nothing outside the lab at the University is known to share one
  // -- but a badge on a distinctive lab card never needed the greeting anyway.
  const LAB_AREAS = ['The University'].map(normalizeName);

  // 'yes' (the University: the lab, or right outside it), 'no' (somewhere
  // else, read verbatim), or 'unknown' (no greeting to read).
  function labWhere() {
    const area = normalizeName(currentArea());
    if (!area) return 'unknown';
    return LAB_AREAS.indexOf(area) !== -1 ? 'yes' : 'no';
  }

  // The better evidence is the deck itself. A laboratory card is only ever in
  // a laboratory hand, so one distinctive lab card on screen -- in the hand or
  // opened -- is the lab confirmed. `strict` is on the thirteen card names that
  // are ordinary English ("Eureka!", "Washing Up", "Directing your Team",
  // "Student Complaints"...), which wait for that or for the greeting. Options
  // are badged only inside an opened lab card, never by their name alone: "Take
  // a break" and "No more of this!" could be anywhere.
  //
  // Returns 'no' when the greeting names somewhere else, and otherwise whether
  // the lab is confirmed.
  function labConfirmed(names) {
    const where = labWhere();
    if (where === 'no') return 'no';
    if (where === 'yes') return true;
    return names.some(function (name) {
      const card = labCardFor(name);
      return !!card && !card.strict;
    });
  }

  let labRefreshAt = 0;
  function labMaybeRefresh() {
    if (!autoRefreshEnabled()) return;
    if (Date.now() - labRefreshAt < LAB_FRESH_MS) return;
    labRefreshAt = Date.now();
    refreshBackgroundState().then(function () { schedule(); });
  }

  function labRatings() {
    const state = labState();
    const seen = [];
    eachCardName(function (host, name, place, style) {
      seen.push({ host: host, name: name, place: place, style: style });
    });
    const gate = labConfirmed(seen.map(function (s) { return s.name; }));
    // A greeting naming somewhere else is a verified no: nothing here speaks.
    const elsewhere = gate === 'no';
    const confirmed = gate === true;
    const sig = (elsewhere ? '@away' : confirmed ? '@lab' : '@?') + '#' + state.sig;
    let wantsReading = false;

    for (const s of seen) {
      const card = elsewhere ? null : labCardFor(s.name);
      const spec = card && (confirmed || !card.strict) ? labCardSpec(card, state) : null;
      if (spec && (spec.stale || !state.read)) wantsReading = true;
      attachBadge(s.host, {
        cls: LAB_CLASS, flag: LAB_FLAG, value: s.name + sig, spec: spec, place: s.place, style: s.style,
      });
    }

    let open = null;
    document.querySelectorAll('.storylet-root__heading').forEach(function (head) {
      const card = labCardFor(headingName(head));
      if (card) open = card;
    });
    const usable = open && !elsewhere && (confirmed || !open.strict) ? open : null;
    document.querySelectorAll('.branch__title').forEach(function (head) {
      const name = headingName(head);
      const opt = usable && name ? labDisambiguate(labBranchRows(usable, name), usable, state) : null;
      const spec = opt ? labOptionSpec(opt, usable, state) : null;
      if (spec && spec.stale) wantsReading = true;
      attachBadge(head, {
        cls: LAB_BRANCH_CLASS, flag: LAB_BRANCH_FLAG,
        value: name + '@' + (usable ? usable.name : '-') + sig, spec: spec, place: 'after',
      });
    });

    // A figure that rests on a reading nobody has taken, or on one that has
    // gone stale, pays for a background load of Myself and Possessions --
    // throttled to one a minute and off with the auto-refresh toggle.
    if (wantsReading) labMaybeRefresh();
  }

  // === feature: Arbor, of the Roses ======================================
  //
  // Arbor is a dream-city on the Elder Continent, reached by playing the London
  // opportunity card A Dream of Roses. Arbor itself deals no opportunity cards
  // (the guide says so outright), so this feature badges three things: that
  // one card, the two storylets a stay happens in (Near Arbor and Far Arbor),
  // and every option inside them.
  //
  // How a stay works, which is what every badge has to be read against:
  //
  //   Arbor: Permission to Linger is the clock. Every way in sets it to 7,
  //     nearly every action costs 1 of it, and at 0 the only option left is
  //     Leave Arbor, one more action. So a trip is 1 + 7 + 1 = 9 actions.
  //   The Rose-Red Streets is where you stand: 1 (the Temple, north) to 5 (the
  //     Palace, south). Each district has options of its own.
  //   Attar is the item you build, and it also decides WHICH city you see: at
  //     5+ in Near Arbor, Enter Far Arbor is the only option; below 3 in Far
  //     Arbor, the city washes away. The card returns you to Near Arbor at
  //     Attar 0-5 and to Far Arbor at 6+, taking 1 Attar either way.
  //
  // **What the badge says, and why.** There is no one currency to rank these
  // options by. Attar is built in order to be spent, and what it is spent on
  // (Favours in High Places, Extraordinary Implications, Sworn Statements,
  // Presbyterate Passphrases, a Direful Reflection) is what a player came for
  // -- which of those is worth most depends on the grind they are running, and
  // pricing them all in Echoes would be the badge choosing the grind. So an
  // option's badge is simply WHAT IT CHANGES, in short tags, with the sign
  // carrying the direction: "Attar +2", "Attar −3 EI +3". The colour repeats
  // the Attar direction -- teal-leaning green for gaining it, warm brick for
  // spending it, slate for trading items and leaving Attar alone, grey for
  // moving about -- and is never the only carrier: the sign is.
  //
  // Marks:
  //   ?  a stat challenge, and the badge is the SUCCESS outcome. The tooltip
  //      gives the failure and the stat at which the challenge is certain.
  //   ⏏  the option spends all your Permission to Linger: the stay ends.
  //   ★  the tribute's rare success, which cashes in ALL your Attar at three
  //      to one.
  //   ≈  an expected value, on the one option whose two outcomes are even odds.
  //
  // Six options scale with something the page does not show (your Permission
  // to Linger, or your Attar). Those say so in words -- "Attar +Linger" --
  // rather than inventing a figure.
  //
  // Transcribed from the individual option pages on fallenlondon.wiki (fetched
  // through the API, 2026-09-14), with Arbor (Guide)'s Table of Choices as the
  // cross-check. Where the two disagree the option page is followed and the
  // guide's figure is kept as `guide`, which the tooltip quotes:
  //   Witness a trial                  page Watchful 115, guide 100
  //   Surrender some of your Attar     page Persuasive 100, guide 79
  //   Leave Arbor early                page Attar +Linger/2, guide Attar +2
  //   Light your candles (Far Arbor)   page takes only the 77 Foxfire Candle
  //     Stubs; the guide also takes Attar 7 and all Permission to Linger
  // The one figure taken from the guide alone is While away your time's 50%:
  // its page gives both outcomes and no odds. Corrections go in ARBOR_OPTIONS
  // and nowhere else.
  //
  // Left out on purpose: Visit the Queen of Roses, the Heart's Desire and
  // Marvellous ambition options and the Coilheart Games petition. They are
  // steps in storylines of their own, not rows of the guide.
  //
  // One entry per option:
  //
  //   name      the option, as the wiki titles it, without the "(Near Arbor)"
  //             page suffix the game does not show.
  //   side      'near' | 'far' | 'both' (the same option in both cities) |
  //             'dream' (an option on the card itself).
  //   district  1-5 on The Rose-Red Streets, or null for anywhere.
  //   ch        { stat, diff } for a broad stat challenge, or null.
  //   win       what the success (or the only outcome) changes, keyed by
  //             ARBOR_ITEMS. Permission to Linger is not in here: see `linger`.
  //   lose      what a failure changes, same shape.
  //   fail      what a failure does that `lose` cannot say, in words.
  //   scale     { key, by }: `key` gained per point of `by` -- 'linger',
  //             'linger/2' or 'attar'.
  //   empties   'attar' when the row takes all your Attar.
  //   ends      true when the row takes all your Permission to Linger.
  //   linger    what the success costs in Permission to Linger when that is
  //             not 1: 0 for nothing, null for "the page does not say" -- two
  //             different claims.
  //   luck      { odds, win, lose } for a pair of outcomes at known odds.
  //   rare      { odds, text } for a rare success.
  //   move      'north' | 'south' | 'north2' | 'far' | 'near' | 'home' | 'arbor'.
  //   label     the badge's word for a row that changes nothing countable.
  //   needs     what it is gated on, in words.
  //   guide     { ch } or { win }: the guide's figure where it disagrees.
  //   note      anything else.

  const ARBOR_ITEMS = {
    attar: { tag: 'Attar', name: 'Attar' },
    ei: { tag: 'EI', name: 'Extraordinary Implication' },
    ss: { tag: 'SS', name: 'Sworn Statement' },
    pp: { tag: 'PP', name: 'Presbyterate Passphrase' },
    fihp: { tag: 'FiHP', name: 'Favour in High Places' },
    dr: { tag: 'DR', name: 'Direful Reflection' },
    er: { tag: 'ER', name: 'Emetic Revelation' },
    vial: { tag: 'Vial', name: 'A Vial of Queenly Attar' },
    foxfire: { tag: 'Foxfire', name: 'Foxfire Candle Stub' },
  };

  const ARBOR_LINGER = 7;          // every way in sets Permission to Linger to this
  const ARBOR_TRIP_ACTIONS = 9;    // the guide's "most trips take 9 actions"
  const ARBOR_FAR_AT = 5;          // Near Arbor: Enter Far Arbor at this much Attar
  const ARBOR_WASH_BELOW = 3;      // Far Arbor: the city washes away below this
  const ARBOR_RETURN_FAR_AT = 6;   // the card opens on Far Arbor from this much Attar
  const ARBOR_DISTRICTS = ['Temple', 'North', 'Centre', 'South', 'Palace'];

  const ARBOR_OPTIONS = [
    // --- A Dream of Roses, the London card ------------------------------
    { name: 'Lay down your weary head', side: 'dream', district: null, ch: null,
      label: 'first visit', move: 'arbor',
      note: 'Your first visit only: you wake in the centre of Near Arbor with 1 Attar and '
        + ARBOR_LINGER + ' Permission to Linger.' },
    { name: 'Return to the City of Roses', side: 'dream', district: null, ch: null,
      win: { attar: -1 }, move: 'arbor',
      note: 'Two options share this name and the game shows the one you qualify for: at Attar 0–'
        + (ARBOR_RETURN_FAR_AT - 1) + ' you return to Near Arbor, at ' + ARBOR_RETURN_FAR_AT
        + ' or more to Far Arbor. Either way Permission to Linger is set to ' + ARBOR_LINGER + '.' },

    // --- Near Arbor -----------------------------------------------------
    { name: 'Labour in the temple', side: 'near', district: 1, ch: { stat: 'Dangerous', diff: 75 },
      scale: { key: 'attar', by: 'linger' }, ends: true,
      fail: 'Sworn Statement equal to your remaining Permission to Linger instead, and the stay still ends',
      note: 'The guide’s fastest grind pairs this with Serve as a Serpent-Shepherd in Far Arbor, '
        + 'and it is BETTER on low Dangerous, since failing pays Sworn Statements.' },
    { name: 'Offer your Attar to the Temple', side: 'near', district: 1, ch: null,
      scale: { key: 'pp', by: 'attar' }, empties: 'attar', linger: 0, needs: 'Attar 1–4' },
    { name: "Visit London's Embassy", side: 'near', district: 2, ch: null,
      win: { attar: 2, ss: -2 }, needs: 'Sworn Statement 2' },
    { name: "Spy on London's Embassy", side: 'near', district: 2, ch: { stat: 'Watchful', diff: 75 },
      win: { ei: 2 }, fail: 'Permission to Linger −2 rather than −1',
      note: 'The guide’s simplest grind: park here and repeat it.' },
    { name: 'Explore the Gatehouse Market', side: 'near', district: 3, ch: { stat: 'Watchful', diff: 75 },
      win: { attar: 2 }, lose: { attar: -1 } },
    { name: 'Leave Arbor early', side: 'near', district: 3, ch: null,
      scale: { key: 'attar', by: 'linger/2' }, ends: true, move: 'home',
      guide: { win: 'Attar +2' } },
    { name: 'Take a short-cut north', side: 'near', district: 4, ch: { stat: 'Watchful', diff: 79 },
      move: 'north2', fail: 'you end up in a random district, possibly the one you wanted' },
    { name: 'Investigate the Near-Arbori', side: 'near', district: 4, ch: null,
      win: { attar: 3, ei: -3 }, linger: 0, needs: 'Extraordinary Implication 3',
      note: 'It used to raise Permission to Linger, which made an endless grind; that was changed in July 2020.' },
    { name: 'Barter your Attar', side: 'near', district: 5, ch: null,
      scale: { key: 'ss', by: 'attar' }, empties: 'attar', needs: 'Attar 1' },
    { name: 'Become a serpent-tender in exchange for Attar', side: 'near', district: 5, ch: null,
      scale: { key: 'attar', by: 'linger' }, ends: true,
      note: 'No challenge, which makes it the guide’s way into Far Arbor on low stats.' },
    { name: 'Enter Far Arbor', side: 'near', district: null, ch: null,
      move: 'far', linger: 0, needs: 'Attar ' + ARBOR_FAR_AT + ', and then it is the only option' },
    { name: 'Light your candles', side: 'near', district: null, ch: null,
      label: 'no effect', linger: 0,
      needs: 'Foxfire Candle Stub 77, below Attar ' + ARBOR_FAR_AT + ', without A Vial of Queenly Attar',
      note: 'Costs no action and does nothing in Near Arbor. The candles are lit in Far Arbor.' },

    // --- both cities ----------------------------------------------------
    { name: 'Walk North', side: 'both', district: null, ch: null, move: 'north',
      needs: 'anywhere but the Temple' },
    { name: 'Walk South', side: 'both', district: null, ch: null, move: 'south',
      needs: 'anywhere but the Palace' },
    { name: 'Leave Arbor', side: 'both', district: null, ch: null, move: 'home', linger: 0,
      needs: 'Permission to Linger 0, and then it is the only option' },

    // --- Far Arbor ------------------------------------------------------
    { name: 'While away your time', side: 'far', district: 1, ch: null,
      luck: { odds: 0.5, win: { attar: 2 }, lose: { attar: -2 } },
      note: 'The 50% is the guide’s; the option page gives both outcomes and no odds.' },
    { name: 'Serve as a Serpent-Shepherd', side: 'far', district: 1, ch: null,
      scale: { key: 'pp', by: 'linger' }, ends: true },
    { name: 'Browse the Edifice of the Unveiled Lie', side: 'far', district: 2,
      ch: { stat: 'Watchful', diff: 100 },
      win: { ei: 3, ss: -3 }, lose: { ei: 1, ss: -1 }, needs: 'Sworn Statement 3' },
    { name: 'Enter the Forbidden Embassy', side: 'far', district: 2, ch: null,
      win: { attar: -7, dr: 1 }, needs: 'Attar 7' },
    { name: 'Walk the walls', side: 'far', district: 3, ch: { stat: 'Watchful', diff: 100 },
      win: { attar: 2 }, lose: { attar: -2 } },
    { name: 'Attend a reception at the Copper Fortress', side: 'far', district: 3,
      ch: { stat: 'Persuasive', diff: 100 },
      win: { attar: 2, pp: -3 }, lose: { attar: -1, pp: -1 }, needs: 'Presbyterate Passphrase 3' },
    { name: 'Feed some of your Attar to your squirrel', side: 'far', district: 3, ch: null,
      win: { attar: -4, er: 1 }, needs: 'a Quizzical Squirrel, and Attar 4' },
    { name: 'Surrender some of your Attar', side: 'far', district: 4,
      ch: { stat: 'Persuasive', diff: 100 },
      win: { attar: -3, ei: 3 }, lose: { attar: 1, ei: 1 }, guide: { ch: 'Persuasive 79' },
      note: 'On low Persuasive this is a way to GAIN Attar: the failure pays Attar +1. '
        + 'The guide puts the break-even at Persuasive 33.' },
    { name: 'Share secrets with the Arbori', side: 'far', district: 4, ch: null,
      win: { ei: -3, pp: 3 }, needs: 'Extraordinary Implication 3' },
    { name: 'Gift your Attar in tribute to the Roseate Queen', side: 'far', district: 5, ch: null,
      win: { attar: -3, fihp: 1 }, needs: 'Attar 5',
      rare: { odds: '20–25%', text: 'Favour in High Places equal to your Attar ÷ 3, rounded, and ALL your Attar goes' },
      note: 'Where the guide’s best grinds cash in: build Attar over many trips, then walk to the Palace.' },
    { name: 'Witness a trial', side: 'far', district: 5, ch: { stat: 'Watchful', diff: 115 },
      win: { attar: -3, ss: 3 }, lose: { attar: 2, ss: -1 }, needs: 'Sworn Statement 1',
      guide: { ch: 'Watchful 100' } },
    { name: 'The city washes away', side: 'far', district: null, ch: null, move: 'near',
      needs: 'Attar below ' + ARBOR_WASH_BELOW + ', and then it is the only option',
      note: 'Unlike Enter Far Arbor it costs Permission to Linger and leaves you in the same district.' },
    { name: 'Light your candles', side: 'far', district: null, ch: null,
      win: { vial: 1, foxfire: -77 }, linger: null,
      needs: 'Attar 7 and Foxfire Candle Stub 77, without A Vial of Queenly Attar',
      guide: { win: 'Attar −7 as well, and all your Permission to Linger' },
      note: 'The only source of A Vial of Queenly Attar. The guide says to light them once your '
        + 'Permission to Linger has run out.' },
  ];

  // The guide's money-making section, figures as it gives them (it took them
  // from d0sboots' Arbor simulator).
  const ARBOR_GRINDS = [
    { name: "Spy on London's Embassy", needs: 'Watchful 125', epa: 3.89, trip: 35,
      how: 'park in the north of Near Arbor and repeat it' },
    { name: 'Labour in the temple + Serve as a Serpent-Shepherd', needs: 'Dangerous 125', epa: 5, trip: 15,
      how: 'walk to the Temple and take whichever is offered; both end the stay, so a trip is 3 '
        + 'actions -- and it is better on LOW Dangerous, 5.83 EPA at 0' },
    { name: 'Explore the Gatehouse Market + Walk the walls, cashed in by tribute', needs: 'Watchful 167',
      epa: 5.5, trip: 49.8,
      how: 'build Attar across trips and pay tribute at 200 Attar; 6.02 EPA in the limit, 3.92 cashing in at 35' },
    { name: 'Become a serpent-tender, then fail Surrender some of your Attar', needs: 'Persuasive near 0',
      epa: 4.72, trip: 42.5, how: 'the failure gains Attar; it breaks even at Persuasive 33' },
  ];

  const ARBOR_CARD = 'A Dream of Roses';
  const ARBOR_STORYLET_SIDES = {};
  ARBOR_STORYLET_SIDES[normalizeName('Near Arbor')] = 'near';
  ARBOR_STORYLET_SIDES[normalizeName('Far Arbor')] = 'far';

  const ARBOR_CARD_CLASS = 'fl-ux-arbor-card';
  const ARBOR_CARD_FLAG = 'flUxArborCard';
  const ARBOR_CLASS = 'fl-ux-arbor';
  const ARBOR_FLAG = 'flUxArbor';
  const ARBOR_BRANCH_CLASS = 'fl-ux-arbor-branch';
  const ARBOR_BRANCH_FLAG = 'flUxArborBranch';

  const ARBOR_MARK_CHALLENGE = '?';
  const ARBOR_MARK_ENDS = '⏏';
  const ARBOR_MARK_RARE = '★';
  const ARBOR_MARK_EXPECTED = '≈';

  // The Attar direction, the one thing the colour says. The green leans teal
  // and the red leans brick, so the two stay apart for a red-green weak eye --
  // and the sign on the badge says it regardless. White ink on all five.
  const ARBOR_COLOR_GAIN = '#1b7d67';
  const ARBOR_COLOR_SPEND = '#a33520';
  const ARBOR_COLOR_ITEMS = '#3f5f8a';
  const ARBOR_COLOR_MOVE = '#5b5b5b';
  const ARBOR_COLOR_LABEL = '#7d3f5c';  // the card and the two map badges

  const ARBOR_MOVE_TEXT = {
    north: '↑ north', south: '↓ south', north2: '↑↑ North', far: '→ Far', near: '→ Near', home: 'home',
  };
  const ARBOR_MOVE_WORDS = {
    north: 'one district north',
    south: 'one district south',
    north2: 'straight to the North district',
    far: 'into Far Arbor, in the centre',
    near: 'back into Near Arbor, in the same district',
    home: 'home to your Lodgings',
    arbor: 'to Arbor',
  };
  const ARBOR_SCALE_TEXT = { linger: 'Linger', 'linger/2': 'Linger/2' };

  const ARBOR_RULES = 'A stay is ' + ARBOR_LINGER + ' Permission to Linger. Nearly every action '
    + 'costs 1 and at 0 Leave Arbor is the only option, so a trip is ' + ARBOR_TRIP_ACTIONS
    + ' actions counting the card. At Attar ' + ARBOR_FAR_AT + '+ Near Arbor gives way to Far Arbor; '
    + 'below Attar ' + ARBOR_WASH_BELOW + ' Far Arbor washes back.';

  function arborSigned(n) {
    return (n > 0 ? '+' : n < 0 ? '−' : '') + Math.abs(n);
  }

  function arborKeys(changes) {
    // Attar first, always, so the eye finds it in the same place on every badge.
    return Object.keys(changes || {}).sort(function (a, b) {
      return (a === 'attar' ? 0 : 1) - (b === 'attar' ? 0 : 1);
    });
  }

  function arborChangeText(changes) {
    return arborKeys(changes).map(function (k) {
      return ARBOR_ITEMS[k].tag + ' ' + arborSigned(changes[k]);
    }).join(' ');
  }

  function arborChangeWords(changes) {
    return arborKeys(changes).map(function (k) {
      return ARBOR_ITEMS[k].name + ' ' + arborSigned(changes[k]);
    }).join(', ');
  }

  function arborHasChanges(changes) {
    return !!changes && Object.keys(changes).length > 0;
  }

  // Expected change in one item over a `luck` pair.
  function arborLuckValue(luck, key) {
    return luck.odds * (luck.win[key] || 0) + (1 - luck.odds) * (luck.lose[key] || 0);
  }

  // A broad challenge succeeds 60% of the stat over the difficulty, so it is
  // certain at difficulty ÷ 0.6 -- written as × 5 / 3 because 75 / 0.6 is
  // 125.00000000000001 in floating point and would round up to 126.
  function arborCertainAt(ch) {
    return Math.ceil(ch.diff * 5 / 3);
  }

  function arborBadgeText(entry) {
    let text;
    if (entry.label) text = entry.label;
    else if (entry.scale) {
      const tag = ARBOR_ITEMS[entry.scale.key].tag;
      text = entry.scale.by === 'attar' ? tag + ' = Attar' : tag + ' +' + ARBOR_SCALE_TEXT[entry.scale.by];
    } else if (entry.luck) {
      text = ARBOR_MARK_EXPECTED + 'Attar ' + arborSigned(arborLuckValue(entry.luck, 'attar'));
    } else if (arborHasChanges(entry.win)) text = arborChangeText(entry.win);
    else if (entry.move) text = ARBOR_MOVE_TEXT[entry.move];
    else text = 'no change';
    if (entry.ch) text += ARBOR_MARK_CHALLENGE;
    if (entry.rare) text += ' ' + ARBOR_MARK_RARE;
    if (entry.ends) text += ' ' + ARBOR_MARK_ENDS;
    return text;
  }

  // +1 gains Attar, -1 spends it, 0 leaves it alone.
  function arborAttarDirection(entry) {
    if (entry.scale) {
      if (entry.scale.key === 'attar') return 1;
      return entry.empties === 'attar' ? -1 : 0;
    }
    if (entry.luck) return Math.sign(arborLuckValue(entry.luck, 'attar'));
    return Math.sign((entry.win && entry.win.attar) || 0);
  }

  function arborColor(entry) {
    const dir = arborAttarDirection(entry);
    if (dir > 0) return ARBOR_COLOR_GAIN;
    if (dir < 0) return ARBOR_COLOR_SPEND;
    if (entry.scale || (!entry.label && arborHasChanges(entry.win))) return ARBOR_COLOR_ITEMS;
    return ARBOR_COLOR_MOVE;
  }

  function arborWhere(entry) {
    if (entry.side === 'dream') return ARBOR_CARD + ', the card that takes you to Arbor';
    const city = entry.side === 'near' ? 'Near Arbor'
      : entry.side === 'far' ? 'Far Arbor' : 'Near and Far Arbor';
    return city + ' · ' + (entry.district
      ? ARBOR_DISTRICTS[entry.district - 1] + ' (The Rose-Red Streets ' + entry.district + ')'
      : 'any district');
  }

  function arborScaleWords(entry) {
    const s = entry.scale;
    const by = s.by === 'attar' ? 'your Attar'
      : s.by === 'linger' ? 'your remaining Permission to Linger'
        : 'half your remaining Permission to Linger';
    return ARBOR_ITEMS[s.key].name + ' equal to ' + by
      + (entry.empties === 'attar' ? ', and all your Attar goes' : '');
  }

  function arborLingerWords(entry) {
    if (entry.ends) return ARBOR_MARK_ENDS + ' Takes all your Permission to Linger: the stay ends.';
    if (entry.linger === null) return 'Permission to Linger: the option page does not say.';
    if (entry.linger === 0) return 'Costs no Permission to Linger.';
    return 'Costs 1 Permission to Linger.';
  }

  function arborSpec(entry) {
    const lines = [entry.name, arborWhere(entry), ''];
    if (entry.ch) {
      lines.push('Challenge: ' + entry.ch.stat + ' ' + entry.ch.diff + ', certain at '
        + entry.ch.stat + ' ' + arborCertainAt(entry.ch) + '.'
        + (entry.guide && entry.guide.ch
          ? ' The guide’s table says ' + entry.guide.ch + '; the option page is followed.' : ''));
    }
    if (entry.luck) {
      lines.push(ARBOR_MARK_EXPECTED + ' ' + Math.round(entry.luck.odds * 100) + '% each way, the game’s choice: '
        + arborChangeWords(entry.luck.win) + ', or ' + arborChangeWords(entry.luck.lose) + '.');
      lines.push('Expected: Attar ' + arborSigned(arborLuckValue(entry.luck, 'attar')) + ' an action.');
    }
    const gives = [];
    if (entry.scale) gives.push(arborScaleWords(entry));
    if (arborHasChanges(entry.win)) gives.push(arborChangeWords(entry.win));
    if (entry.move) gives.push('takes you ' + ARBOR_MOVE_WORDS[entry.move]);
    if (gives.length) lines.push((entry.ch ? 'Success: ' : 'Gives: ') + gives.join('; ') + '.');
    if (entry.guide && entry.guide.win) {
      lines.push('The guide’s table says ' + entry.guide.win + '; the option page is followed.');
    }
    if (arborHasChanges(entry.lose)) {
      lines.push('Failure: ' + arborChangeWords(entry.lose) + (entry.fail ? '; ' + entry.fail : '') + '.');
    } else if (entry.fail) {
      lines.push('Failure: ' + entry.fail + '.');
    }
    if (entry.rare) {
      lines.push(ARBOR_MARK_RARE + ' Rare success, about ' + entry.rare.odds + ' of the time: '
        + entry.rare.text + '.');
    }
    if (entry.needs) lines.push('Needs: ' + entry.needs + '.');
    if (entry.side !== 'dream') lines.push(arborLingerWords(entry));
    if (entry.note) lines.push(entry.note);
    lines.push('');
    lines.push(ARBOR_RULES);
    return { text: arborBadgeText(entry), color: arborColor(entry), title: lines.join('\n') };
  }

  function arborGrindLines() {
    const lines = ['The guide’s grinds:'];
    for (const g of ARBOR_GRINDS) {
      lines.push('  • ' + g.name + ' (' + g.needs + '): ' + g.epa + ' EPA, ' + g.trip
        + ' Echoes a trip -- ' + g.how + '.');
    }
    return lines;
  }

  // The badge on Near Arbor or Far Arbor: a map. It is a label, not a figure,
  // because which district you stand in is not on the page.
  function arborStoryletSpec(side) {
    const city = side === 'near' ? 'Near Arbor' : 'Far Arbor';
    const here = ARBOR_OPTIONS.filter(function (e) { return e.side === side || e.side === 'both'; });
    const row = function (e) {
      return '  • ' + e.name + ' — ' + arborBadgeText(e)
        + (e.ch ? ' [' + e.ch.stat + ' ' + e.ch.diff + ']' : '')
        + (e.needs ? ' [needs ' + e.needs + ']' : '');
    };
    const lines = [city, ''];
    for (let d = 1; d <= ARBOR_DISTRICTS.length; d++) {
      lines.push(ARBOR_DISTRICTS[d - 1] + ' (The Rose-Red Streets ' + d + '):');
      here.filter(function (e) { return e.district === d; }).forEach(function (e) { lines.push(row(e)); });
    }
    lines.push('Anywhere:');
    here.filter(function (e) { return e.district == null; }).forEach(function (e) { lines.push(row(e)); });
    lines.push('');
    lines.push.apply(lines, arborGrindLines());
    lines.push('');
    lines.push(ARBOR_RULES);
    lines.push('');
    lines.push('Open the storylet and every option is badged in its own right.');
    return { text: (side === 'near' ? 'Near' : 'Far') + ' map', color: ARBOR_COLOR_LABEL, title: lines.join('\n') };
  }

  // The card in your London hand. `reading` is { count, at } off the
  // Possessions counts cache, or null when that has never been read.
  function arborCardSpec(reading) {
    const lines = [ARBOR_CARD, 'Takes you to Arbor, of the Roses.', ''];
    lines.push('A trip is about ' + ARBOR_TRIP_ACTIONS + ' actions: this card, ' + ARBOR_LINGER
      + ' in Arbor, and Leave Arbor. Arbor deals no opportunity cards and is outside London, so '
      + 'no social actions or Bazaar while you are there.');
    lines.push('Returning costs 1 Attar and opens on Near Arbor at Attar 0–' + (ARBOR_RETURN_FAR_AT - 1)
      + ', on Far Arbor at ' + ARBOR_RETURN_FAR_AT + ' or more.');
    if (reading) {
      lines.push('Your last Possessions reading, ' + ageText(reading.at) + ', had Attar ' + reading.count
        + ', so this dream opens on ' + (reading.count >= ARBOR_RETURN_FAR_AT ? 'Far' : 'Near')
        + ' Arbor -- unless your Attar has changed since.');
    } else {
      lines.push('Your Attar has not been read. Open Possessions once and this says which city the dream opens on.');
    }
    lines.push('');
    lines.push.apply(lines, arborGrindLines());
    return { text: ARBOR_TRIP_ACTIONS + ' actions', color: ARBOR_COLOR_LABEL, title: lines.join('\n') };
  }

  // Attar off the Possessions counts cache. A cached list without Attar in it
  // means none, since Fallen London lists only what you hold. Memoised on
  // `fotzGen`, which every re-bank of that cache bumps, so a card in hand does
  // not re-parse localStorage on every DOM mutation.
  let arborReadingMemo = null;
  function arborAttarReading() {
    if (arborReadingMemo && arborReadingMemo.gen === fotzGen) return arborReadingMemo.value;
    let value = null;
    const rec = loadCounts();
    if (rec) {
      const row = rec.held.get(itemKey('Attar'));
      value = { count: row ? row.count : 0, at: rec.at };
    }
    arborReadingMemo = { gen: fotzGen, value: value };
    return value;
  }

  const ARBOR_BY_NAME = new Map();
  for (const entry of ARBOR_OPTIONS) {
    const key = normalizeName(entry.name);
    if (!ARBOR_BY_NAME.has(key)) ARBOR_BY_NAME.set(key, []);
    ARBOR_BY_NAME.get(key).push(entry);
  }

  // `side` is the screen we are on: 'near' / 'far' (that storylet is open),
  // 'dream' (the card is open), 'arbor' (the greeting says Arbor but no
  // storylet says which city) or null. Options are badged ONLY on one of
  // those: "Walk North" and "Witness a trial" could title an option anywhere
  // in London. "Light your candles" is in both cities and does different
  // things, so on 'arbor' alone it answers nothing.
  function lookupArborOption(name, side) {
    const rows = ARBOR_BY_NAME.get(normalizeName(name));
    if (!rows || !side) return null;
    const fits = rows.filter(function (r) {
      if (side === 'dream') return r.side === 'dream';
      if (r.side === 'dream') return false;
      return side === 'arbor' || r.side === side || r.side === 'both';
    });
    return fits.length === 1 ? fits[0] : null;
  }

  // --- the area gate -------------------------------------------------------
  //
  // Confirm-only, like ZEE_AREAS and VSD_AREAS: no greeting has been captured
  // in Arbor, so these are a GUESS from the wiki's own names. It may say "yes"
  // and never "no". The better evidence is the storylet that is open, which is
  // why it is only the fallback.
  const ARBOR_AREAS = ['Arbor, of the Roses', 'Arbor', 'Near Arbor', 'Far Arbor'].map(normalizeName);

  function inArbor() {
    const area = normalizeName(currentArea());
    return !!area && ARBOR_AREAS.indexOf(area) !== -1;
  }

  function arborSideHere() {
    let side = null;
    const card = normalizeName(ARBOR_CARD);
    document.querySelectorAll('.storylet-root__heading').forEach(function (head) {
      const name = normalizeName(headingName(head));
      if (ARBOR_STORYLET_SIDES[name]) side = ARBOR_STORYLET_SIDES[name];
      else if (name === card) side = 'dream';
    });
    return side || (inArbor() ? 'arbor' : null);
  }

  function arborRatings() {
    const card = normalizeName(ARBOR_CARD);
    eachCardName(function (host, name, place, style) {
      const mine = normalizeName(name) === card;
      const reading = mine ? arborAttarReading() : null;
      attachBadge(host, {
        cls: ARBOR_CARD_CLASS,
        flag: ARBOR_CARD_FLAG,
        // The reading is part of the badge: a Possessions visit that changes
        // your Attar has to redraw a card already in hand.
        value: name + '#' + (reading ? reading.count + '@' + reading.at : '-'),
        spec: mine ? arborCardSpec(reading) : null,
        place: place,
        style: style,
      });
    });

    document.querySelectorAll('.storylet__heading, .storylet-root__heading').forEach(function (head) {
      const name = headingName(head);
      const side = name ? ARBOR_STORYLET_SIDES[normalizeName(name)] : null;
      attachBadge(head, {
        cls: ARBOR_CLASS, flag: ARBOR_FLAG, value: name,
        spec: side ? arborStoryletSpec(side) : null, place: 'after',
      });
    });

    const side = arborSideHere();
    document.querySelectorAll('.branch__title').forEach(function (head) {
      const name = headingName(head);
      const entry = name ? lookupArborOption(name, side) : null;
      attachBadge(head, {
        cls: ARBOR_BRANCH_CLASS, flag: ARBOR_BRANCH_FLAG,
        value: name + '@' + (side || '-'),
        spec: entry ? arborSpec(entry) : null, place: 'after',
      });
    });
  }

  // === shared: storylet carousels ========================================
  //
  // A carousel is a storylet you stand in and repeat, with a few storylets
  // around it: the way in, the payout, the way out. L. B. Industries, the
  // Department of Menace Eradication and Vertiginous Horticulture all deal no
  // opportunity cards and badge the same two things -- storylet headings, and
  // the options of the carousel storylet that is OPEN -- so that plumbing is
  // here once. (Arbor came first and keeps its own.)
  //
  // An option is looked up only inside the storylet the wiki files it under,
  // and only while that storylet is open: "Make bobbins", "Stalk silently" and
  // "Treat the soil" are ordinary phrases and could title an option anywhere.
  //
  // Some wiki titles carry a placeholder the game fills in -- "Water your
  // (growth)" reads "Water your mandrakes" in the game, "Bid farewell to (work
  // leader)" names your team's rat -- so those placeholders match any words.
  // Only those three: a bracket like "(3 FATE)" is part of a real title.
  const CAROUSEL_PLACEHOLDER = /\((?:growth|growth type|work leader)\)/;

  function carouselMatcher(title) {
    const pieces = String(title).split(CAROUSEL_PLACEHOLDER);
    if (pieces.length === 1) {
      const key = normalizeName(title);
      return function (name) { return name === key; };
    }
    const parts = [];
    pieces.forEach(function (piece, i) {
      if (i > 0) parts.push('.+');
      const key = normalizeName(piece);
      if (key) parts.push(key);
    });
    const re = new RegExp('^' + parts.join(' ') + '$');
    return function (name) { return re.test(name); };
  }

  // An entry may carry `aliases`: other titles the same option goes by, such
  // as the "(1 FATE)" the wiki appends to a page the game lists without it.
  function carouselIndex(options) {
    return options.map(function (entry) {
      const matchers = [entry.name].concat(entry.aliases || []).map(carouselMatcher);
      return {
        entry: entry,
        storylet: normalizeName(entry.storylet),
        matches: function (name) { return matchers.some(function (m) { return m(name); }); },
      };
    });
  }

  // `open` is the normalised name of the open storylet. Returns null rather
  // than pick between two matches.
  function carouselLookup(index, name, open) {
    if (!name || !open) return null;
    const key = normalizeName(name);
    const hits = index.filter(function (row) { return row.storylet === open && row.matches(key); });
    return hits.length === 1 ? hits[0].entry : null;
  }

  // `aliases` maps another name a storylet goes by onto the name its options
  // are filed under (both normalised) -- the wiki's storylet page and its
  // option pages do not always agree on the title.
  function carouselCanonical(key, aliases) {
    return aliases && aliases[key] ? aliases[key] : key;
  }

  function carouselOpen(storylets, aliases) {
    const wanted = storylets.map(normalizeName);
    let open = null;
    document.querySelectorAll('.storylet-root__heading').forEach(function (head) {
      const key = carouselCanonical(normalizeName(headingName(head)), aliases);
      if (wanted.indexOf(key) !== -1) open = key;
    });
    return open;
  }

  // def: { storylets, index, storyletSpec(key), optionSpec(entry), cls, flag,
  // branchCls, branchFlag, aliases? }.
  function carouselRatings(def) {
    const open = carouselOpen(def.storylets, def.aliases);
    document.querySelectorAll('.storylet__heading, .storylet-root__heading').forEach(function (head) {
      const name = headingName(head);
      attachBadge(head, {
        cls: def.cls, flag: def.flag, value: name,
        spec: name ? def.storyletSpec(carouselCanonical(normalizeName(name), def.aliases)) : null, place: 'after',
      });
    });
    document.querySelectorAll('.branch__title').forEach(function (head) {
      const name = headingName(head);
      const entry = carouselLookup(def.index, name, open);
      attachBadge(head, {
        cls: def.branchCls, flag: def.branchFlag,
        // The open storylet is part of the identity: the same heading node
        // under a different storylet is a different option.
        value: name + '@' + (open || '-'),
        spec: entry ? def.optionSpec(entry) : null, place: 'after',
      });
    });
  }

  // A broad challenge is certain at difficulty ÷ 0.6, written × 5 / 3 because
  // 75 / 0.6 is 125.00000000000001 in floating point (see arborCertainAt).
  function broadCertainAt(diff) {
    return Math.ceil(diff * 5 / 3);
  }

  function carouselSigned(n) {
    return (n > 0 ? '+' : n < 0 ? '−' : '') + Math.abs(n);
  }

  // A number, or a [lo, hi] range, signed: "+10–12", "−2–5", "−0–2", "+4".
  // A range is shown smallest magnitude first, whichever way it points.
  function carouselRange(v) {
    if (!Array.isArray(v)) return carouselSigned(v);
    if (v[0] === v[1]) return carouselSigned(v[0]);
    const neg = v[0] < 0 || v[1] < 0;
    const a = Math.abs(v[0]);
    const b = Math.abs(v[1]);
    return (neg ? '−' : '+') + Math.min(a, b) + '–' + Math.max(a, b);
  }

  // Colour is a category here, never the only carrier: the sign carries the
  // direction, "→" a payout, and a word everything else. White ink on all.
  const CAROUSEL_COLOR_PROGRESS = '#1b7d67';  // moves the carousel's progress quality
  const CAROUSEL_COLOR_SETUP = '#5f4b8b';     // sets something up: a contract, a plant, a side quality
  const CAROUSEL_COLOR_PAYOUT = '#8a6420';    // cashes the progress in
  const CAROUSEL_COLOR_NEUTRAL = '#5b5b5b';   // a way in or out
  const CAROUSEL_COLOR_LABEL = '#3f5f8a';     // a storylet heading's summary

  const CAROUSEL_MARK_CHALLENGE = '?';
  const CAROUSEL_MARK_USES = '▼';
  const CAROUSEL_MARK_EXPECTED = '≈';

  // === feature: L. B. Industries =========================================
  //
  // The rats' factory beneath the Blind Helmsman: a variable-length carousel
  // in one storylet, Your Labour, and its Fruits, whose options either build
  // Foreman's Favour or spend it on one payout. A payout sends you to Shutting
  // Down for the Day, whose one option ends the shift and takes away whatever
  // Favour is left.
  //
  // **What the badge says.** On a work option, the Foreman's Favour a success
  // pays -- the number that varies across the seven -- marked `?` because it
  // is a stat challenge, then what a failure takes away when it takes anything
  // ("FF +15? −19"). Rare successes are in the tooltip: two option pages give
  // their odds (20%) and five do not, so no expected value is claimed. On a
  // payout, its cost and what it buys ("110 → Reliquary"); every point above
  // the cost pays 10 Bone Fragments, which the tooltip says.
  //
  // Transcribed from the option pages (fetched through the API, 2026-09-14),
  // with L. B. Industries (Guide) as the cross-check. The guide's "Min for
  // 100%" column is carried as `guideMin` and equals difficulty × 5/3 on all
  // seven rows; guide and pages agree on every figure. Corrections go in
  // LBI_OPTIONS and nowhere else.
  //
  //   storylet        the storylet the option is filed under.
  //   ch              { stat, diff }.
  //   win/rare/lose   Foreman's Favour on a success, a rare success, a failure.
  //   rareOdds        the rare chance as the page states it, or null.
  //   guideMin        the guide's "Min for 100%".
  //   uses            what the option uses up.
  //   airs            the Ratterbox window the option is offered in.
  //   cost/tag/gives/rate  a payout: Favour it costs, the badge's word for
  //                   what it buys, all of it, and the guide's worth per Favour.
  //   label           the badge's word for a way in or out.

  const LBI_STORYLET = 'Your Labour, and its Fruits';
  const LBI_ENTRY = 'Head Far Beneath the Blind Helmsman';
  const LBI_STORYLETS = [LBI_STORYLET, 'Shutting Down for the Day', LBI_ENTRY];
  const LBI_SURPLUS_BONE = 10;   // Bone Fragments per Favour above a payout's cost
  const LBI_EPA = 3.75;          // the guide's, selling the Crackling Device at the Rat Market

  const LBI_OPTIONS = [
    { storylet: LBI_STORYLET, name: 'Work the bellows to produce steam',
      ch: { stat: 'Dangerous', diff: 50 }, win: 5, rare: 15, rareOdds: null, lose: 0, guideMin: 84 },
    { storylet: LBI_STORYLET, name: 'Make bobbins',
      ch: { stat: 'Persuasive', diff: 50 }, win: 5, rare: 15, rareOdds: null, lose: 0, guideMin: 84 },
    { storylet: LBI_STORYLET, name: 'Take over from the spinners',
      ch: { stat: 'Watchful', diff: 125 }, win: 15, rare: 34, rareOdds: 0.2, lose: -19, guideMin: 209 },
    { storylet: LBI_STORYLET, name: 'Assist with assembly',
      ch: { stat: 'Shadowy', diff: 178 }, win: 32, rare: 34, rareOdds: 0.2, lose: -2, guideMin: 297 },
    { storylet: LBI_STORYLET, name: 'Contribute – and install – a hard tip for the driller',
      ch: { stat: 'Shadowy', diff: 88 }, win: 29, rare: 30, rareOdds: null, lose: 0, guideMin: 147,
      uses: 'an Ostentatious Diamond, on a failure as well' },
    { storylet: LBI_STORYLET, name: 'Put out a fire by the smelters',
      ch: { stat: 'Dangerous', diff: 125 }, win: 15, rare: 34, rareOdds: null, lose: -19, guideMin: 209,
      airs: '51–75' },
    { storylet: LBI_STORYLET, name: 'Test the latest batch of weapons',
      ch: { stat: 'Dangerous', diff: 125 }, win: 15, rare: 34, rareOdds: null, lose: -19, guideMin: 209,
      airs: '76–100' },

    { storylet: LBI_STORYLET, name: 'Receive your pay in biscuits', cost: 10, tag: 'Biscuits',
      gives: 'Crate of Incorruptible Biscuits ×1', rate: '0.25 Echoes' },
    { storylet: LBI_STORYLET, name: 'Request Bessemer Steel Ingots as pay', cost: 60, tag: 'Steel ×8',
      gives: 'Bessemer Steel Ingot ×8 and Hinterland Scrip ×7', rate: '0.125 Echoes' },
    { storylet: LBI_STORYLET, name: 'Accept a reverent thanks for your labour', cost: 110, tag: 'Reliquary',
      gives: 'Ratty Reliquary ×1', rate: '~0.114 Echoes, or 1.5 Rat-Shillings' },
    { storylet: LBI_STORYLET, name: 'Accept old coins as a reward', cost: 235, tag: '4th-City Echo ×2',
      gives: 'Fourth-City Echo ×2', rate: 'no Echo price; ~1.06 Rat-Shillings' },
    { storylet: LBI_STORYLET, name: 'Ask for a Crackling Device as payment', cost: 610, tag: 'Crackling Device',
      gives: 'Crackling Device ×1', rate: '~0.1 Echoes, or ~1.35 Rat-Shillings' },

    { storylet: 'Shutting Down for the Day', name: 'Bid farewell to (work leader)', label: 'leave',
      note: 'Ends the shift: your Foreman’s Favour and your Work Team are both gone.' },
    { storylet: LBI_ENTRY, name: 'Squeeze down the tunnel', label: 'in',
      note: 'The way into the factory, once you have a Work Team; the page records it as costing no action.' },
  ];

  const LBI_INDEX = carouselIndex(LBI_OPTIONS);

  const LBI_CLASS = 'fl-ux-lbi';
  const LBI_FLAG = 'flUxLbi';
  const LBI_BRANCH_CLASS = 'fl-ux-lbi-branch';
  const LBI_BRANCH_FLAG = 'flUxLbiBranch';

  const LBI_RULES = 'Work builds Foreman’s Favour; one payout spends it, and every point above that '
    + 'payout’s cost pays ' + LBI_SURPLUS_BONE + ' Bone Fragments. None of the work raises a menace.';

  function lbiBadgeText(e) {
    if (e.label) return e.label;
    if (e.cost != null) return e.cost + ' → ' + e.tag;
    let text = 'FF ' + carouselSigned(e.win) + CAROUSEL_MARK_CHALLENGE;
    if (e.lose < 0) text += ' ' + carouselSigned(e.lose);
    if (e.uses) text += ' ' + CAROUSEL_MARK_USES;
    return text;
  }

  function lbiColor(e) {
    if (e.label) return CAROUSEL_COLOR_NEUTRAL;
    return e.cost != null ? CAROUSEL_COLOR_PAYOUT : CAROUSEL_COLOR_PROGRESS;
  }

  function lbiSpec(e) {
    const lines = [e.name, 'L. B. Industries, beneath the Blind Helmsman · ' + e.storylet, ''];
    if (e.cost != null) {
      lines.push('Costs ' + e.cost + ' Foreman’s Favour. Gives: ' + e.gives + '.');
      lines.push('Every Favour above ' + e.cost + ' pays ' + LBI_SURPLUS_BONE + ' Bone Fragments.');
      lines.push('The guide’s worth per Favour: ' + e.rate + '.');
    } else if (e.ch) {
      lines.push('Challenge: ' + e.ch.stat + ' ' + e.ch.diff + ', certain at ' + e.ch.stat + ' '
        + broadCertainAt(e.ch.diff) + '.');
      lines.push('Success: Foreman’s Favour ' + carouselSigned(e.win) + '.');
      lines.push('Rare success: Foreman’s Favour ' + carouselSigned(e.rare)
        + (e.rareOdds ? ', ' + Math.round(e.rareOdds * 100) + '% of the time, by the page.'
          : '. The page gives no odds; the guide’s calculator assumes 20%.'));
      lines.push(e.lose < 0 ? 'Failure: Foreman’s Favour ' + carouselSigned(e.lose) + '.' : 'Failure: nothing lost.');
    }
    if (e.uses) lines.push(CAROUSEL_MARK_USES + ' Uses up ' + e.uses + '.');
    if (e.airs) lines.push('Offered only at Ratterbox ' + e.airs + '.');
    if (e.note) lines.push(e.note);
    lines.push('');
    lines.push(LBI_RULES);
    return { text: lbiBadgeText(e), color: lbiColor(e), title: lines.join('\n') };
  }

  function lbiStoryletSpec(key) {
    if (key === normalizeName(LBI_ENTRY)) {
      return {
        text: 'factory', color: CAROUSEL_COLOR_LABEL,
        title: LBI_ENTRY + '\n\nThe way down to L. B. Industries. ' + LBI_RULES,
      };
    }
    if (key !== normalizeName(LBI_STORYLET)) return null;
    const lines = [LBI_STORYLET, 'L. B. Industries, beneath the Blind Helmsman', '', 'Work:'];
    LBI_OPTIONS.filter(function (e) { return e.ch; }).forEach(function (e) {
      lines.push('  • ' + e.name + ' — ' + lbiBadgeText(e) + ' [' + e.ch.stat + ' ' + e.ch.diff + ']'
        + (e.airs ? ' [Ratterbox ' + e.airs + ']' : ''));
    });
    lines.push('Payouts:');
    LBI_OPTIONS.filter(function (e) { return e.cost != null; }).forEach(function (e) {
      lines.push('  • ' + e.cost + ' Favour — ' + e.gives);
    });
    lines.push('');
    lines.push(LBI_RULES);
    lines.push('The guide puts it at ' + LBI_EPA + ' EPA, selling the Crackling Device at the Rat Market.');
    lines.push('');
    lines.push('Open the storylet and every option is badged in its own right.');
    return { text: 'FF → pay', color: CAROUSEL_COLOR_LABEL, title: lines.join('\n') };
  }

  function lbiRatings() {
    carouselRatings({
      storylets: LBI_STORYLETS, index: LBI_INDEX, storyletSpec: lbiStoryletSpec, optionSpec: lbiSpec,
      cls: LBI_CLASS, flag: LBI_FLAG, branchCls: LBI_BRANCH_CLASS, branchFlag: LBI_BRANCH_FLAG,
    });
  }

  // === feature: Department of Menace Eradication =========================
  //
  // Hunting a quarry across London. A contract at The Department of Menace
  // Eradication sets Quarry: Confounded Thing is Hiding ("Hiding"), Quarry's
  // Savagery ("Sav") and sometimes Your Quarry: Wariness ("War"); Hunting
  // across London is where you bring Hiding to 0; then the quarry's own
  // storylet is the confrontation, and Returning to the Department pays.
  //
  // **What the badge says.** On a hunting option, the change a success makes
  // -- Hiding for most, Wariness or Savagery for the two that set up -- with
  // `?` for the challenge and, where a failure hides the quarry again, that
  // too ("Hiding −10? +1"). Almost every challenge here scales with Savagery,
  // which the page does not show, so the tooltip gives the formula and the
  // figure at each contract's starting Savagery. Lay poisoned bait is a Luck
  // challenge with its odds on the page, so it is its expected value (`≈`).
  // A confrontation or a payout names what it pays; a contract what it sets.
  //
  // Transcribed from the option pages (fetched through the API, 2026-09-14),
  // with Department of Menace Eradication (Guide) as the cross-check. Where
  // they disagree the page is followed and `guide` keeps the guide's version:
  //   Stalk silently              page Shadowy, guide Dangerous
  //   Shoot it the moment...      page sets Hiding to 2 on a failure, guide +2
  //   Capture it alive!           guide adds Dangerous +12 CP, page does not
  // Two figures are the guide's alone: Expose yourself as bait's success
  // (its page records none) and Search for traces' rare success. The
  // Fate-locked Miniature Menace is left out: the wiki does not carry its
  // options. Corrections go in DME_OPTIONS and nowhere else.
  //
  //   ch      { stat, per, plus } -- difficulty per × Savagery + plus; `per`
  //           null where the page gives only an `example` figure --
  //           { stat, diff } flat, or { luck } for a Luck challenge.
  //   win     what a success changes: hiding / war / sav, a number or [lo, hi].
  //   lose    what a failure changes, same shape; `loseSet` for a "set to".
  //   rare    a rare success, in words.
  //   contract  the DME_CONTRACTS key a contract option starts.
  //   payout/tag  what a confrontation or payout gives, and the badge's word.
  //   uses / needs / actions (when not 1) / label / note / guide.

  const DME_DEPARTMENT = 'The Department of Menace Eradication';
  const DME_HUNT = 'Hunting across London';
  const DME_MAZE = 'A Rat in a Sewery Maze';
  const DME_BELFRY = 'Confrontation in the Belfry';
  const DME_RETURN = 'Returning to the Department';
  const DME_STORYLETS = [DME_DEPARTMENT, DME_HUNT, DME_MAZE, DME_BELFRY, DME_RETURN];

  const DME_CONTRACTS = [
    { key: 'rat', name: 'A Worryingly Large Rat', short: 'Rat', hiding: 10, sav: 15, war: 0 },
    { key: 'ushabti', name: 'A Malicious Ushabti', short: 'Ushabti', hiding: 30, sav: 30, war: 4 },
  ];

  const DME_QUALITIES = {
    hiding: { tag: 'Hiding', name: 'Quarry: Confounded Thing is Hiding' },
    war: { tag: 'War', name: 'Your Quarry: Wariness' },
    sav: { tag: 'Sav', name: 'Quarry’s Savagery' },
  };
  const DME_KEYS = ['hiding', 'war', 'sav'];

  const DME_OPTIONS = [
    // --- the Department --------------------------------------------------
    { storylet: DME_DEPARTMENT, name: 'Contract: a Worryingly Large Rat', contract: 'rat',
      needs: 'no quarry, and A Name Scrawled in Blood 1',
      note: 'The Rat is Greedy, so Lay poisoned bait works on it.' },
    { storylet: DME_DEPARTMENT, name: 'Contract: A Malicious Ushabti', contract: 'ushabti',
      needs: 'no quarry, Clue Propagation: Ushabti Malice 100, and A Name Scrawled in Blood 3' },
    { storylet: DME_DEPARTMENT, name: 'Contract: destroy an infestation of sorrow-spiders',
      label: 'Running Battle', needs: 'A Name Scrawled in Blood 2',
      note: 'A different mechanic, built on Running Battle... rather than Hiding; see Running Battle (Guide).' },
    { storylet: DME_DEPARTMENT, name: 'Claim bounty for dead rats', tag: '5 actions: Rostygold',
      payout: 'Piece of Rostygold equal to 1.1 × your Rats on a String, all of which go, and a Tale of Terror!!',
      actions: 5, uses: 'every Rat on a String you hold', needs: 'a Rat on a String' },
    { storylet: DME_DEPARTMENT, name: 'Resume your hunt for a Worryingly Large Rat', label: 'free', actions: 0 },
    { storylet: DME_DEPARTMENT, name: 'Resume your hunt for a Malicious Ushabti', label: 'free', actions: 0 },

    // --- Hunting across London --------------------------------------------
    { storylet: DME_HUNT, name: 'Search for traces', ch: { stat: 'Dangerous', per: 1, plus: 0 },
      win: { hiding: [-5, -2] }, lose: { hiding: -1 }, needs: 'Wariness below 4',
      rare: 'Hiding −2–5 as well, and Wariness +1 (the guide’s; the page does not list it)' },
    { storylet: DME_HUNT, name: 'Expose yourself as bait', ch: { stat: 'Dangerous', per: 1.5, plus: 0 },
      win: { hiding: [-10, -2] }, lose: { hiding: -2 },
      note: 'The success is the guide’s: the option page records none. The guide’s early-game advice is '
        + 'to open with Approach it very casually, then repeat this once it is at least an even chance.' },
    { storylet: DME_HUNT, name: 'Employ the strategies of Mr Inch', ch: { stat: 'Dangerous', per: 2, plus: 0 },
      win: { hiding: [-7, -5] }, lose: { hiding: 1, war: [0, 1] }, needs: 'Dangerous 30, and Wariness below 4',
      note: 'The page’s example is difficulty 30 at Savagery 15, so twice Savagery, as the guide has it; '
        + 'its text says Savagery alone, and its −5–7 carries a question mark.' },
    { storylet: DME_HUNT, name: 'Stalk silently', ch: { stat: 'Shadowy', per: 1, plus: 0 },
      win: { war: -1 }, guide: { ch: 'Dangerous' } },
    { storylet: DME_HUNT, name: 'Lay a shining trail', ch: { stat: 'Dangerous', per: 1, plus: 0 },
      win: { hiding: [-16, -10], war: [-1, 0] }, uses: 'Moonlight Scales ×30, on a success',
      needs: 'Dangerous 70, and Moonlight Scales 30',
      note: 'The guide’s Curator’s Gratitude grind lays this twice and then Exposes itself as bait.' },
    { storylet: DME_HUNT, name: 'Approach it very casually', ch: { stat: 'Dangerous', per: null, example: '10, at Savagery 15' },
      win: { hiding: -10, war: 1 }, lose: { hiding: 1 }, needs: 'no Wariness at all' },
    { storylet: DME_HUNT, name: 'Lay poisoned bait', ch: { luck: 0.6 },
      win: { sav: -3 }, uses: 'a Flask of Abominable Salts, on a failure as well',
      needs: 'Savagery 5, a quarry tempted by poisoned bait (the Rat), and a Flask of Abominable Salts',
      note: 'Once a hunt: a success leaves the quarry untempted.' },
    { storylet: DME_HUNT, name: 'Abandon the hunt', label: 'abandon', note: 'Ends the hunt with no reward.' },
    { storylet: DME_HUNT, name: 'You know where the Rat is lairing...', label: '→ lair', actions: 0,
      needs: 'Hiding 0, hunting the Rat' },
    { storylet: DME_HUNT, name: 'Lay a trap for the ushabti', label: '→ Belfry', needs: 'Hiding 0, hunting the Ushabti' },

    // --- the confrontations -----------------------------------------------
    { storylet: DME_MAZE, name: 'Shoot it the moment you see it', ch: { stat: 'Dangerous', per: 1, plus: 0 },
      tag: 'Rostygold 200', payout: 'Dangerous +10 CP now, and Piece of Rostygold ×200 from The reward for a '
        + 'Worryingly Large Rat back at the Department',
      lose: { sav: -1 }, loseSet: 'Hiding set to 2', guide: { lose: 'Hiding +2' } },
    { storylet: DME_MAZE, name: 'Explore its lair thoroughly before it returns',
      ch: { stat: 'Dangerous', per: null, example: '24, at a Savagery the page does not give' },
      tag: 'Rats 50 Scarabs 35', payout: 'Rat on a String ×50, Phosphorescent Scarab ×35 and Dangerous +12 CP, '
        + 'and the hunt ends with no bounty',
      lose: { hiding: 4, sav: -1 } },
    { storylet: DME_BELFRY, name: 'Destroy the d__ned thing!', ch: { stat: 'Dangerous', per: 2, plus: 5 },
      tag: 'Gratitude 800', payout: 'Curator’s Gratitude ×800 from The bounty for a Malicious Ushabti back at '
        + 'the Department, and the first time a clue for F.F. Gebrandt',
      lose: { hiding: 4, sav: -5 } },
    { storylet: DME_BELFRY, name: 'Capture it alive!', ch: { stat: 'Dangerous', diff: 120 },
      tag: 'Ushabti', payout: 'Captured Ushabti ×1 and Tale of Terror!! ×15, and the hunt ends',
      lose: { hiding: 4, sav: -5 }, guide: { win: 'Dangerous +12 CP as well' } },

    // --- the bounties -----------------------------------------------------
    { storylet: DME_RETURN, name: 'The reward for a Worryingly Large Rat', tag: 'Rostygold 200',
      payout: 'Piece of Rostygold ×200, and the hunt ends' },
    { storylet: DME_RETURN, name: 'Make your Name: the reward for a Worryingly Large Rat', tag: 'Rostygold 200',
      payout: 'Piece of Rostygold ×200, the first time, on the way to making your Name' },
    { storylet: DME_RETURN, name: 'The bounty for a Malicious Ushabti', tag: 'Gratitude 800',
      payout: 'Curator’s Gratitude ×800, spent at the Museum of Prelapsarian History' },
  ];

  const DME_INDEX = carouselIndex(DME_OPTIONS);

  const DME_CLASS = 'fl-ux-dme';
  const DME_FLAG = 'flUxDme';
  const DME_BRANCH_CLASS = 'fl-ux-dme-branch';
  const DME_BRANCH_FLAG = 'flUxDmeBranch';

  const DME_RULES = 'Bring Hiding to 0 to find the quarry. Savagery sets how hard nearly every challenge '
    + 'is, including the final one; Wariness at 4 shuts Search for traces and Mr Inch.';

  function dmeContract(key) {
    return DME_CONTRACTS.find(function (c) { return c.key === key; }) || null;
  }

  function dmeValueTimes(v, k) {
    const round = function (n) { return Math.round(n * k * 10) / 10; };
    return Array.isArray(v) ? [round(v[0]), round(v[1])] : round(v);
  }

  function dmeChangeText(changes) {
    return DME_KEYS.filter(function (k) { return changes && changes[k] != null; }).map(function (k) {
      return DME_QUALITIES[k].tag + ' ' + carouselRange(changes[k]);
    }).join(' ');
  }

  function dmeChangeWords(changes) {
    return DME_KEYS.filter(function (k) { return changes && changes[k] != null; }).map(function (k) {
      return DME_QUALITIES[k].name + ' ' + carouselRange(changes[k]);
    }).join(', ');
  }

  // A failure that hides the quarry again -- progress lost.
  function dmeLosesGround(lose) {
    const h = lose && lose.hiding;
    return h != null && (Array.isArray(h) ? Math.max(h[0], h[1]) > 0 : h > 0);
  }

  function dmeBadgeText(e) {
    let text;
    if (e.label) text = e.label;
    else if (e.contract) {
      const c = dmeContract(e.contract);
      text = 'Hiding ' + c.hiding + ' Sav ' + c.sav + (c.war ? ' War ' + c.war : '');
    } else if (e.tag) text = e.tag;
    else if (e.ch && e.ch.luck) {
      const ev = {};
      DME_KEYS.forEach(function (k) { if (e.win[k] != null) ev[k] = dmeValueTimes(e.win[k], e.ch.luck); });
      text = CAROUSEL_MARK_EXPECTED + dmeChangeText(ev);
    } else text = dmeChangeText(e.win);
    if (e.ch && !e.ch.luck) text += CAROUSEL_MARK_CHALLENGE;
    if (dmeLosesGround(e.lose)) text += ' ' + carouselRange(e.lose.hiding);
    if (e.uses) text += ' ' + CAROUSEL_MARK_USES;
    return text;
  }

  function dmeColor(e) {
    if (e.label) return CAROUSEL_COLOR_NEUTRAL;
    if (e.payout) return CAROUSEL_COLOR_PAYOUT;
    if (e.win && e.win.hiding != null) return CAROUSEL_COLOR_PROGRESS;
    return CAROUSEL_COLOR_SETUP;
  }

  function dmeChallengeLine(ch) {
    if (ch.luck) return 'A Luck challenge: ' + Math.round(ch.luck * 100) + '% to succeed.';
    if (ch.diff != null) {
      return 'Challenge: ' + ch.stat + ' ' + ch.diff + ', certain at ' + ch.stat + ' ' + broadCertainAt(ch.diff) + '.';
    }
    if (ch.per == null) {
      return 'Challenge: ' + ch.stat + ', harder at higher Savagery; the page’s only figure is ' + ch.example + '.';
    }
    const formula = (ch.per === 1 ? '' : ch.per + ' × ') + 'Quarry’s Savagery' + (ch.plus ? ' + ' + ch.plus : '');
    const at = DME_CONTRACTS.map(function (c) {
      const diff = ch.per * c.sav + (ch.plus || 0);
      return 'at the ' + c.short + '’s starting Savagery ' + c.sav + ', ' + diff + ', certain at ' + broadCertainAt(diff);
    });
    return 'Challenge: ' + ch.stat + ' against ' + formula + ' -- ' + at.join('; ') + '.';
  }

  function dmeSpec(e) {
    const lines = [e.name, 'Department of Menace Eradication · ' + e.storylet, ''];
    if (e.ch) lines.push(dmeChallengeLine(e.ch));
    if (e.contract) {
      const c = dmeContract(e.contract);
      lines.push('Starts a hunt for ' + c.name + ': Hiding ' + c.hiding + ', Savagery ' + c.sav
        + (c.war ? ', Wariness ' + c.war : '') + '.');
    }
    if (e.win) {
      lines.push((e.ch ? 'Success: ' : 'Gives: ') + dmeChangeWords(e.win) + '.');
      if (e.ch && e.ch.luck) {
        const ev = {};
        DME_KEYS.forEach(function (k) { if (e.win[k] != null) ev[k] = dmeValueTimes(e.win[k], e.ch.luck); });
        lines.push(CAROUSEL_MARK_EXPECTED + ' Expected, counting the failure: ' + dmeChangeWords(ev) + '.');
      }
    }
    if (e.payout) lines.push((e.ch ? 'Success: ' : 'Gives: ') + e.payout + '.');
    if (e.rare) lines.push('Rare success: ' + e.rare + '.');
    const fail = [];
    if (e.lose) fail.push(dmeChangeWords(e.lose));
    if (e.loseSet) fail.push(e.loseSet);
    if (fail.length) lines.push('Failure: ' + fail.join(', ') + '.');
    else if (e.ch) lines.push('Failure: nothing changes.');
    if (e.guide && e.guide.ch) lines.push('The guide says ' + e.guide.ch + '; the option page is followed.');
    if (e.guide && e.guide.lose) lines.push('The guide’s failure is ' + e.guide.lose + '; the option page is followed.');
    if (e.guide && e.guide.win) lines.push('The guide’s success adds ' + e.guide.win + '; the option page does not.');
    if (e.uses) lines.push(CAROUSEL_MARK_USES + ' Uses up ' + e.uses + '.');
    if (e.needs) lines.push('Needs: ' + e.needs + '.');
    if (e.actions === 0) lines.push('Costs no action.');
    else if (e.actions > 1) lines.push('Costs ' + e.actions + ' actions.');
    if (e.note) lines.push(e.note);
    lines.push('');
    lines.push(DME_RULES);
    return { text: dmeBadgeText(e), color: dmeColor(e), title: lines.join('\n') };
  }

  function dmeStoryletSpec(key) {
    const row = function (e) { return '  • ' + e.name + ' — ' + dmeBadgeText(e); };
    const of = function (storylet) {
      return DME_OPTIONS.filter(function (e) { return e.storylet === storylet; }).map(row);
    };
    const footer = ['', DME_RULES, '', 'Open the storylet and every option is badged in its own right.'];
    if (key === normalizeName(DME_HUNT)) {
      return {
        text: 'Hiding → 0', color: CAROUSEL_COLOR_LABEL,
        title: [DME_HUNT, ''].concat(of(DME_HUNT), ['',
          'The guide: open with Approach it very casually, then Expose yourself as bait once that is an even '
          + 'chance -- five actions at the least for the Rat. For Curator’s Gratitude, the Ushabti averages 8 '
          + 'actions (100 a action), or 6 with two shining trails (133 a action).'], footer).join('\n'),
      };
    }
    if (key === normalizeName(DME_DEPARTMENT)) {
      return { text: 'contracts', color: CAROUSEL_COLOR_LABEL, title: [DME_DEPARTMENT, ''].concat(of(DME_DEPARTMENT), footer).join('\n') };
    }
    if (key === normalizeName(DME_MAZE) || key === normalizeName(DME_BELFRY)) {
      const storylet = key === normalizeName(DME_MAZE) ? DME_MAZE : DME_BELFRY;
      return { text: 'confront', color: CAROUSEL_COLOR_LABEL, title: [storylet, ''].concat(of(storylet), footer).join('\n') };
    }
    return null;
  }

  function dmeRatings() {
    carouselRatings({
      storylets: DME_STORYLETS, index: DME_INDEX, storyletSpec: dmeStoryletSpec, optionSpec: dmeSpec,
      cls: DME_CLASS, flag: DME_FLAG, branchCls: DME_BRANCH_CLASS, branchFlag: DME_BRANCH_FLAG,
    });
  }

  // === feature: Vertiginous Horticulture =================================
  //
  // A rooftop allotment in the Flit. Pick a plant in the Vertiginous
  // Horticulture storylet, raise Nurturing a Rooftop Growth to 105 over about
  // seven actions, and sell it to one of three buyers -- by 150 you must.
  //
  // **What the badge says.** On a nurturing option, the Nurturing a success
  // pays, marked `?`, then what a failure takes back when it takes anything
  // ("Grow +10–12? −0–2"). Every figure is a formula on the growth's
  // Difficulty (1-3), which the page does not show, so the badge is the
  // RANGE over the Difficulties that option can actually meet: a Shade-only
  // option only ever sees Difficulty 2 and so shows one figure. The rare
  // successes go in the tooltip with their odds and the average success they
  // make. A plant shows its Difficulty; a buyer what the sale gives.
  //
  // Transcribed from the option pages (fetched through the API, 2026-09-14),
  // with Vertiginous Horticulture (Guide) as the cross-check. The guide's
  // "Average Gain" column is carried as `guideAvg` and equals the pages'
  // success, rare success and rare odds combined, on every row -- which is
  // also what confirms the 30% rare chance on the four Plantae/Fungi options.
  // The guide's challenge column disagrees with eight pages, and each is kept
  // as `guide.ch`. The pages write a lost failure as "Loss of (1 − Difficulty)";
  // it is read, as the guide reads it, as losing Difficulty − 1. Corrections
  // go in VH_OPTIONS and nowhere else.
  //
  //   kind      'grow' | 'nurture' | 'sell'.
  //   ch        { stat, base, perD }: difficulty base + perD × Difficulty.
  //   win/rare/fail  { k, d }: Nurturing k + d × Difficulty.
  //   rareOdds  the chance of `rare`; `alt` when the page calls it an
  //             alternative success rather than a rare one.
  //   only      the Classification or Light Preference the option needs.
  //   airs      The Airs of London window.
  //   first     offered only before any Nurturing.
  //   guideAvg  the guide's Average Gain, [lo, hi].
  //   fixed/tag/scaling/per  a sale: what it always gives, the badge's word,
  //             the item that scales, and how many per Nurturing above 105.

  const VH_STORYLET = 'Vertiginous Horticulture';
  const VH_SELL_AT = 105;
  const VH_MUST_SELL = 150;
  const VH_EPA = [1.4, 1.57];   // the guide's: selling at 105, and at 150

  const VH_GROWS = [
    { name: 'Grow a cutting from your Singular Plant', difficulty: 2, cls: 'Plantae', light: 'Shade',
      needs: 'Attending to the Needs of a Singular Plant 10' },
    { name: "Grow a crop of 'Dawn-Yodeller' Mandrakes", difficulty: 1, cls: 'Plantae', light: 'Sunlight' },
    { name: 'Grow Prize-Winning Peppercaps', difficulty: 1, cls: 'Fungi', light: 'Darkness' },
    { name: 'Grow some Recusant Marigolds', difficulty: 2, cls: 'Plantae', light: 'Shade' },
    { name: 'Grow a cluster of False-Cantigaster Hybrids', difficulty: 2, cls: 'Fungi', light: 'Shade' },
    { name: 'Grow a bush of Millennium Roses', difficulty: 3, cls: 'Plantae', light: 'Sunlight' },
    { name: 'Grow some Tomorrowspore Ortcaps', difficulty: 3, cls: 'Fungi', light: 'Darkness' },
    { name: 'Grow some Genuine Counterfeit Exceptional Roses', difficulty: 2, cls: 'Plantae', light: 'Shade',
      needs: 'the Feast of the Exceptional Rose',
      note: 'Selling these also pays Burgeoning Romance ×900, for Mr Spices during the Feast.' },
  ];

  const VH_OPTIONS = VH_GROWS.map(function (g) {
    return Object.assign({ storylet: VH_STORYLET, kind: 'grow' }, g);
  }).concat([
    { name: 'Divine the needs of your (growth)', first: true,
      ch: { stat: 'Shadowy', base: 65, perD: 5 }, win: { k: 9, d: 1 }, rare: { k: 11, d: 1 }, rareOdds: 0.2,
      fail: { k: 1, d: 0 }, guideAvg: [10.4, 12.4], guide: { ch: 'Shadowy 70–90' } },
    { name: 'Water your (growth)', airs: '26–75',
      ch: { stat: 'Shadowy', base: 65, perD: 5 }, win: { k: 9, d: 1 }, rare: { k: 11, d: 1 }, rareOdds: 0.2,
      fail: { k: 1, d: -1 }, guideAvg: [10.4, 12.4], guide: { ch: 'Shadowy 70–90' } },
    { name: 'Treat the soil', airs: '1–25 and 76–100',
      ch: { stat: 'Shadowy', base: 65, perD: 5 }, win: { k: 9, d: 1 }, rare: { k: 11, d: 1 }, rareOdds: 0.2,
      fail: { k: 1, d: -1 }, guideAvg: [10.4, 12.4], guide: { ch: 'Shadowy 70–90' } },
    { name: 'Secure vital nutrition for your precious (growth type)', airs: '1–33',
      ch: { stat: 'Shadowy', base: 80, perD: 5 }, win: { k: 13, d: 1 }, rare: { k: 18, d: 1 }, rareOdds: 0.2,
      fail: { k: 4, d: 1 }, guideAvg: [15, 17] },
    { name: 'Sing to your (growth)', airs: '34–66',
      ch: { stat: 'Persuasive', base: 80, perD: 5 }, win: { k: 13, d: 1 }, rare: { k: 18, d: 1 }, rareOdds: 0.2,
      fail: { k: 4, d: 1 }, guideAvg: [15, 17] },
    { name: 'Cajole your (growth) into action', airs: '67–100',
      ch: { stat: 'Dangerous', base: 80, perD: 5 }, win: { k: 13, d: 1 }, rare: { k: 18, d: 1 }, rareOdds: 0.2,
      fail: { k: 4, d: 1 }, guideAvg: [15, 17] },
    { name: 'Prune your (growth)', only: 'Plantae', airs: '1–50',
      ch: { stat: 'Shadowy', base: 85, perD: 0 }, win: { k: 12, d: 1 }, rare: { k: 14, d: 1 }, rareOdds: 0.3,
      fail: { k: 1, d: 1 }, guideAvg: [13.6, 15.6], guide: { ch: 'Shadowy 80–90' } },
    { name: 'Eliminate pests', only: 'Plantae', airs: '51–100',
      ch: { stat: 'Shadowy', base: 85, perD: 0 }, win: { k: 12, d: 1 }, rare: { k: 14, d: 1 }, rareOdds: 0.3,
      fail: { k: 1, d: 1 }, guideAvg: [13.6, 15.6], guide: { ch: 'Shadowy 80–90' } },
    { name: 'Keep a tight rein on the temperature', only: 'Fungi', airs: '1–50',
      ch: { stat: 'Shadowy', base: 75, perD: 5 }, win: { k: 12, d: 1 }, rare: { k: 14, d: 1 }, rareOdds: 0.3,
      fail: { k: 1, d: 1 }, guideAvg: [13.6, 15.6] },
    { name: 'Tend to the mycelia', only: 'Fungi', airs: '51–100',
      ch: { stat: 'Shadowy', base: 75, perD: 5 }, win: { k: 12, d: 1 }, rare: { k: 14, d: 1 }, rareOdds: 0.3,
      fail: { k: 1, d: 1 }, guideAvg: [13.6, 15.6] },
    { name: 'Plunge your (growth) into appropriate darkness', only: 'Darkness', airs: '1–25',
      ch: { stat: 'Shadowy', base: 85, perD: 5 }, win: { k: 14, d: 1 }, rare: { k: 18, d: 1 }, rareOdds: 0.5, alt: true,
      fail: { k: 1, d: -1 }, guideAvg: [17, 19], guide: { ch: 'Shadowy 85–95' } },
    { name: 'Contrive a shaded spot for your (growth)', only: 'Shade', airs: '26–50',
      ch: { stat: 'Shadowy', base: 95, perD: 0 }, win: { k: 14, d: 1 }, rare: { k: 18, d: 1 }, rareOdds: 0.5, alt: true,
      fail: { k: 1, d: -1 }, guideAvg: [18, 18], guide: { ch: 'Shadowy 90' } },
    { name: 'Blast your (growth) with light', only: 'Sunlight', airs: '51–75',
      ch: { stat: 'Shadowy', base: 75, perD: 0 }, win: { k: 14, d: 1 }, rare: { k: 18, d: 1 }, rareOdds: 0.5, alt: true,
      fail: { k: 1, d: -1 }, guideAvg: [17, 19], guide: { ch: 'Shadowy 85–95' } },

    { name: 'Offer your (growth type) to the Sneering Horticulturalist', kind: 'sell', tag: 'FiHP',
      fixed: 'Favour in High Places ×1', scaling: 'Intriguing Snippet', per: 1 / 2, at150: 22 },
    { name: 'Offer your (growth type) to the Wizened Botanist', kind: 'sell', tag: 'Map',
      fixed: 'Puzzling Map ×1', scaling: 'Sapphire', per: 5 / 6, at150: 37 },
    { name: 'Offer your (growth type) to the Dreamy Mycologist', kind: 'sell', tag: 'SBL ×5',
      fixed: 'Strong-Backed Labour ×5', scaling: 'Cryptic Clue', per: 5, at150: 225 },
  ].map(function (e) {
    return Object.assign({ storylet: VH_STORYLET, kind: 'nurture' }, e);
  }));

  const VH_INDEX = carouselIndex(VH_OPTIONS);

  const VH_CLASS = 'fl-ux-vh';
  const VH_FLAG = 'flUxVh';
  const VH_BRANCH_CLASS = 'fl-ux-vh-branch';
  const VH_BRANCH_FLAG = 'flUxVhBranch';

  const VH_RULES = 'Raise Nurturing a Rooftop Growth to ' + VH_SELL_AT + ' to sell, and at ' + VH_MUST_SELL
    + ' you must. A harder growth makes most challenges 5 harder per Difficulty and pays 1 more Nurturing per '
    + 'Difficulty. No failure here raises a menace.';

  // The Difficulties an option can meet: the plants that satisfy its `only`.
  function vhDifficulties(e) {
    const ds = VH_GROWS.filter(function (g) {
      return !e.only || g.cls === e.only || g.light === e.only;
    }).map(function (g) { return g.difficulty; });
    return ds.filter(function (d, i) { return ds.indexOf(d) === i; }).sort();
  }

  function vhValues(f, ds) {
    return ds.map(function (d) { return f.k + f.d * d; });
  }

  function vhSpan(values) {
    return [Math.min.apply(null, values), Math.max.apply(null, values)];
  }

  function vhAverage(e, d) {
    const round = function (n) { return Math.round(n * 10) / 10; };
    return round((1 - e.rareOdds) * (e.win.k + e.win.d * d) + e.rareOdds * (e.rare.k + e.rare.d * d));
  }

  function vhSale(e, nurturing) {
    return Math.floor((nurturing - VH_SELL_AT) * e.per);
  }

  function vhBadgeText(e) {
    if (e.kind === 'grow') return 'diff ' + e.difficulty;
    if (e.kind === 'sell') return '→ ' + e.tag;
    const ds = vhDifficulties(e);
    let text = 'Grow ' + carouselRange(vhSpan(vhValues(e.win, ds))) + CAROUSEL_MARK_CHALLENGE;
    const fail = vhValues(e.fail, ds);
    if (Math.min.apply(null, fail) < 0) text += ' ' + carouselRange(vhSpan(fail));
    return text;
  }

  function vhColor(e) {
    if (e.kind === 'grow') return CAROUSEL_COLOR_SETUP;
    return e.kind === 'sell' ? CAROUSEL_COLOR_PAYOUT : CAROUSEL_COLOR_PROGRESS;
  }

  function vhPerDifficulty(f, ds) {
    return ds.map(function (d) { return carouselSigned(f.k + f.d * d) + ' at ' + d; }).join(', ');
  }

  function vhSpec(e) {
    const lines = [e.name, 'Vertiginous Horticulture, in the Flit', ''];
    if (e.kind === 'grow') {
      lines.push('Starts a growth: Difficulty ' + e.difficulty + ', ' + e.cls + ', prefers ' + e.light + '.');
      lines.push('Difficulty makes the challenges harder and pays more Nurturing. The kind and the light it '
        + 'prefers decide which extra options you are offered; any buyer takes any growth.');
    } else if (e.kind === 'sell') {
      lines.push('Needs Nurturing a Rooftop Growth ' + VH_SELL_AT + '. Ends the growth.');
      lines.push('Gives: ' + e.fixed + ', and ' + e.scaling + ' for Nurturing above ' + VH_SELL_AT
        + ' -- ' + vhSale(e, VH_MUST_SELL) + ' at ' + VH_MUST_SELL + '.');
      lines.push('The guide: the fixed part is worth 12.5 Echoes and the scaling part 4.5 at 150.');
    } else {
      const ds = vhDifficulties(e);
      const diffs = ds.map(function (d) { return e.ch.base + e.ch.perD * d; });
      const span = vhSpan(diffs);
      lines.push('Challenge: ' + e.ch.stat + ' ' + (span[0] === span[1] ? span[0] : span[0] + '–' + span[1])
        + (e.ch.perD ? ' (' + e.ch.base + ' + ' + e.ch.perD + ' × Difficulty)' : '')
        + ', certain at ' + e.ch.stat + ' ' + broadCertainAt(span[0])
        + (span[0] === span[1] ? '' : '–' + broadCertainAt(span[1])) + '.'
        + (e.guide && e.guide.ch ? ' The guide says ' + e.guide.ch + '; the option page is followed.' : ''));
      lines.push('Success: Nurturing ' + vhPerDifficulty(e.win, ds) + ' (Difficulty).');
      lines.push((e.alt ? 'Half of all successes, by the page' : 'Rare success, ' + Math.round(e.rareOdds * 100) + '% by the page')
        + ': Nurturing ' + vhPerDifficulty(e.rare, ds) + '. Average success: '
        + ds.map(function (d) { return '+' + vhAverage(e, d) + ' at ' + d; }).join(', ') + '.');
      lines.push('Failure: Nurturing ' + vhPerDifficulty(e.fail, ds) + '.');
      if (e.only) lines.push('Only for a growth that is ' + e.only + '.');
      if (e.airs) lines.push('Offered at The Airs of London ' + e.airs + '.');
      if (e.first) lines.push('Offered only before any Nurturing: the first move.');
    }
    if (e.needs) lines.push('Needs: ' + e.needs + '.');
    if (e.note) lines.push(e.note);
    lines.push('');
    lines.push(VH_RULES);
    return { text: vhBadgeText(e), color: vhColor(e), title: lines.join('\n') };
  }

  function vhStoryletSpec(key) {
    if (key !== normalizeName(VH_STORYLET)) return null;
    const lines = [VH_STORYLET, 'In the Flit', ''];
    for (const kind of ['grow', 'nurture', 'sell']) {
      lines.push(kind === 'grow' ? 'Plants:' : kind === 'nurture' ? 'Nurturing:' : 'Buyers:');
      VH_OPTIONS.filter(function (e) { return e.kind === kind; }).forEach(function (e) {
        lines.push('  • ' + e.name + ' — ' + vhBadgeText(e) + (e.airs ? ' [Airs ' + e.airs + ']' : '')
          + (e.only ? ' [' + e.only + ']' : ''));
      });
    }
    lines.push('');
    lines.push(VH_RULES);
    lines.push('The guide: ' + VH_EPA[0] + ' EPA selling at ' + VH_SELL_AT + ', ' + VH_EPA[1] + ' at ' + VH_MUST_SELL
      + '. Its draw is the items -- a Favour in High Places, a Puzzling Map or five Strong-Backed Labour a growth -- '
      + 'and that no failure raises a menace.');
    lines.push('');
    lines.push('Open the storylet and every option is badged in its own right.');
    return { text: 'Grow → ' + VH_SELL_AT, color: CAROUSEL_COLOR_LABEL, title: lines.join('\n') };
  }

  function vhRatings() {
    carouselRatings({
      storylets: [VH_STORYLET], index: VH_INDEX, storyletSpec: vhStoryletSpec, optionSpec: vhSpec,
      cls: VH_CLASS, flag: VH_FLAG, branchCls: VH_BRANCH_CLASS, branchFlag: VH_BRANCH_FLAG,
    });
  }

  // === feature: Forgotten Quarter Expeditions ============================
  //
  // Expeditions from Base-Camp in the Forgotten Quarter, on the shared
  // carousel plumbing. Four storylets:
  //
  //   Prepare for an Expedition -- turn items into Crate of Expedition
  //     Supplies ("Sup"), capped at 100 and kept between expeditions.
  //   Begin an Expedition in the Forgotten Quarter -- pick one; its length is
  //     the Archaeologist's Progress ("Prog") it ends at, which is also the
  //     least Supplies it can be done with.
  //   Pursuing an Archaeological Expedition -- spend Supplies on Progress with
  //     three Watchful approaches while Rivals' Progress creeps up, hinder the
  //     rivals, and take the conclusion.
  //   A Confrontation with a Rival -- what Rivals' Progress 10 forces.
  //
  // **What the badge says**, per storylet, because each asks a different
  // question. Preparing: the Supplies an option gives ("Sup +3 ▼"). Choosing:
  // the expedition's length and the Archaeologist it needs, or its Fate price
  // ("30 sup · Arch 3"). Pursuing: the Progress a success makes ("Prog +3? ▼"),
  // the Rivals' Progress a hindrance takes off ("Rivals −2? ▼"), and what a
  // conclusion pays ("Egg + Linen?"). Confronting: the Progress it makes. `?`
  // is a stat challenge's success, `▼` something used up (nearly always
  // Supplies), `≈` the one option whose odds the guide gives, and a menace an
  // option ALWAYS raises is named after the figure ("+Nightmares", "+Wounds")
  // so a cheap line never reads as free. A menace only a failure raises is in
  // the tooltip with the rest of the failure.
  //
  // Transcribed from the option and storylet pages (fetched through the API,
  // 2026-09-14), with Forgotten Quarter Expeditions (Guide) as the cross-check.
  // Its worst-case Supplies table and Echo worths are carried as given. Where
  // the two disagree the page is followed and `guide` quoted:
  //   Hire a porter from the docks    page also takes Piece of Rostygold ×50
  //   The Chalcocite Pagoda (ending)   page Watchful 40, guide 60
  //   A buccaneering approach         page "Rivals' Progress +0–1"; the guide's
  //     table implies half of all successes, which is what `rivalOdds` carries
  // From the guide alone, because the pages record none: Rumours of
  // treasure's 60:40, and what The Temple of Uttermost Wind! and The Gallery
  // of Serpents! pay. Left out: The Broken Granary's conclusion (no page for
  // it), the Observer of Falsehoods, the Workshop of the Khan of Silks, the
  // Granite Gallery and the Wolf's Reflection (storylines and a season of
  // their own), and An Ophidian Gentleman. Corrections go in FQ_OPTIONS and
  // nowhere else.
  //
  //   storylet / name / aliases   where the option is filed and what it is called.
  //   ch        { stat, diff }.
  //   gain      what a success (or the only outcome) changes: prog / sup /
  //             rivals, a number or [lo, hi]; `rivalsSet` for "set to".
  //   luck      { odds, win, lose }: Supplies either way, the game's choice.
  //   exp       an expedition: { supplies, arch, fate, given, rivals, pays, worst }.
  //   payout    a conclusion: { tag, gives, alt, rare, failGives, worth }.
  //   rivalOdds the chance a success adds Rivals' Progress 1.
  //   menace / failMenace   what it always raises / what only a failure does.
  //   fail / uses / needs / airs / actions / rate / label / note / guide.

  const FQ_PREPARE = 'Prepare for an Expedition';
  const FQ_BEGIN = 'Begin an Expedition in the Forgotten Quarter';
  const FQ_PURSUE = 'Pursuing an Archaeological Expedition';
  const FQ_CONFRONT = 'A Confrontation with a Rival';
  const FQ_STORYLETS = [FQ_PREPARE, FQ_BEGIN, FQ_PURSUE, FQ_CONFRONT];
  const FQ_STORYLET_ALIASES = {};
  FQ_STORYLET_ALIASES[normalizeName('Prepare for an Expedition in the Forgotten Quarter')] = normalizeName(FQ_PREPARE);
  const FQ_SUPPLY_CAP = 100;
  const FQ_EPA = 4.61;   // the guide's end-game Tomb of the Silken Thread figure

  const FQ_OPTIONS = [
    // --- Prepare for an Expedition --------------------------------------
    { storylet: FQ_PREPARE, name: 'Rumours of treasure', luck: { odds: 0.6, win: 1, lose: 2 },
      uses: 'Whispered Hint ×200', rate: 1.39,
      note: 'The 60% also gives a Map Scrap. The odds are the guide’s; the page gives none.' },
    { storylet: FQ_PREPARE, name: 'Blood-red tales', gain: { sup: 1 }, menace: 'Nightmares +1 CP',
      uses: 'Appalling Secret ×10', rate: 1.5 },
    { storylet: FQ_PREPARE, name: 'Your own expertise', gain: { sup: 1 },
      uses: 'Page of Prelapsarian Archaeological Notes ×10' },
    { storylet: FQ_PREPARE, name: 'Show us the money', aliases: ['Show us the money 2'], gain: { sup: 4 },
      actions: 4, uses: 'Penny ×1000', rate: 2.5 },
    { storylet: FQ_PREPARE, name: 'Ply your team with drink', gain: { sup: 1 },
      uses: 'Bottle of Strangling Willow Absinthe ×3', rate: 1.5 },
    { storylet: FQ_PREPARE, name: 'Thieves and cracksmen', gain: { sup: 1 }, uses: 'Piece of Rostygold ×160', rate: 1.6 },
    { storylet: FQ_PREPARE, name: "Hire 'local' knowledge", gain: { sup: 1 }, uses: 'Moon-pearl ×160', rate: 1.6 },
    { storylet: FQ_PREPARE, name: 'Hire a porter from the docks', gain: { sup: 7 },
      uses: 'Favours: The Docks ×3 and Piece of Rostygold ×50', needs: 'Renown: The Docks 5, and Supplies below 91',
      guide: { uses: 'Favours: The Docks ×3, and no Rostygold' },
      note: 'The guide’s pick for most players, with Burly guards and porters.' },
    { storylet: FQ_PREPARE, name: 'Burly guards and porters', gain: { sup: 3 }, uses: 'Strong-Backed Labour ×1',
      note: 'The guide’s other pick: Strong-Backed Labour comes from Vertiginous Horticulture, the Underclay or the Bazaar.' },
    { storylet: FQ_PREPARE, name: 'Begin an Expedition', label: '→ begin', actions: 0, needs: 'Supplies 10' },

    // --- Begin an Expedition in the Forgotten Quarter -------------------
    { storylet: FQ_BEGIN, name: "Seek a thieves' cache", ch: { stat: 'Watchful', diff: 60 },
      exp: { supplies: 10, arch: 2, rivals: null, pays: 'an Unpredictable Treasure 1–80 and Shard of Glim ×400, or Soul ×500 instead' },
      uses: 'Favours: Criminals ×1', note: 'Also gives Cryptic Clue ×100. At Archaeologist exactly 1 a beginner '
        + 'version with the same name brings its own 10 Supplies. The guide recommends it for training Archaeologist.' },
    { storylet: FQ_BEGIN, name: 'Seek a shrine of the Deep Blue Heaven', ch: { stat: 'Watchful', diff: 70 },
      exp: { supplies: 20, arch: 2, rivals: 'Dr Orthos', pays: 'an Unpredictable Treasure 1–160, or rarely an Eyeless Skull', worst: [29, 29, 20] },
      fail: 'Nightmares +1 CP', note: 'A rare success (25%) starts you at Progress 3. At Archaeologist exactly 2 a '
        + 'beginner version with the same name needs only 5 Supplies and brings 15.' },
    { storylet: FQ_BEGIN, name: 'The Chalcocite Pagoda',
      exp: { supplies: 20, arch: 3, rivals: 'the Heroic Archaeologist', pays: 'a Searing Enigma, or Antique Mystery ×2 and a Magnificent Diamond', worst: [29, 29, 20] } },
    { storylet: FQ_BEGIN, name: 'Stonefall Copse',
      exp: { supplies: 20, arch: 3, rivals: 'Dr Orthos', pays: 'Puzzling Map ×2, a Direful Reflection and Nodule of Warm Amber ×250', worst: [29, 29, 20] } },
    { storylet: FQ_BEGIN, name: 'The Broken Granary',
      exp: { supplies: 20, arch: 3, rivals: 'the Lugubrious Seamstress', pays: 'the same as Stonefall Copse, by the guide' },
      needs: 'A Complication in Delivery exactly 2' },
    { storylet: FQ_BEGIN, name: 'The Tomb of the Silken Thread',
      exp: { supplies: 30, arch: 3, rivals: 'the Lugubrious Seamstress', pays: 'a Judgements’ Egg and a Parabola-Linen Scrap', worst: [46, 39, 39] },
      note: 'The guide’s pick for profit.' },
    { storylet: FQ_BEGIN, name: 'The Sanctuary of the Crimson Petals', menace: 'Nightmares +1 CP',
      exp: { supplies: 40, arch: 3, rivals: 'the Heroic Archaeologist', pays: 'a Portfolio of Souls and Bright Brass Skull ×2, or Night-Whisper ×3', worst: [76, 56, 49] } },
    { storylet: FQ_BEGIN, name: 'A Temple of Uttermost Wind', aliases: ['A Temple of Uttermost Wind (7 FATE)'],
      exp: { supplies: 30, arch: 2, fate: 7, rivals: 'Virginia', pays: 'an Unpredictable Treasure 41–240 and an Extraordinary Implication or a Silent Soul', worst: [46, 39, 39] } },
    { storylet: FQ_BEGIN, name: 'A Gallery of Serpents', aliases: ['A Gallery of Serpents (7 FATE)'],
      exp: { supplies: 40, arch: 3, fate: 7, rivals: 'Monsieur Pleat', pays: 'an Unpredictable Treasure and Uncanny Incunabula', worst: [74, 54, 49] },
      needs: 'Watchful 80' },
    { storylet: FQ_BEGIN, name: 'The Tomb of the Seven',
      exp: { supplies: 30, arch: 3, given: 20, rivals: 'Dr Orthos and Virginia', pays: 'a Set of Correspondence Stones, once', worst: [46, 39, 39] },
      needs: 'A Name in Seven Secret Alphabets exactly 5, and 10 Supplies of your own' },
    { storylet: FQ_BEGIN, name: 'The Cave of the Nadir',
      exp: { supplies: 60, arch: 5, rivals: 'February of the Calendar Council', pays: 'the route to the Cave of the Nadir, once', worst: [null, 86, 76] },
      uses: 'an Eyeless Skull', note: 'The guide: do not attempt it with the cautious approach.' },
    { storylet: FQ_BEGIN, name: 'The Clay Kidnapper: Seek a Sand-Drowned Stupa',
      exp: { supplies: 20, arch: 2, given: 3, rivals: null, pays: 'progress in the Candlefinder case' },
      needs: 'Candlefinder: Case exactly 10, Progress in a Case exactly 70' },
    { storylet: FQ_BEGIN, name: 'Learn the Traditions of the Forgotten Quarter', label: 'Arch 1',
      uses: 'Whispered Hint ×1000, Cryptic Clue ×250 and a Tale of Terror!!',
      note: 'Your first Archaeologist, which unlocks the first expedition. Watchful +20 CP.' },
    { storylet: FQ_BEGIN, name: 'More supplies!', label: '← prepare', actions: 0 },
    { storylet: FQ_BEGIN, name: 'Ask a friend to send you an Eyeless Skull', label: 'Eyeless Skull',
      needs: 'Archaeologist 5, the route to the Cave of the Nadir and 60 Supplies; once' },

    // --- Pursuing an Archaeological Expedition --------------------------
    { storylet: FQ_PURSUE, name: 'A cautious approach', aliases: ['A cautious approach 2'],
      ch: { stat: 'Watchful', diff: 50 }, gain: { prog: 1 }, rivalOdds: 0.25,
      uses: 'Crate of Expedition Supplies ×1, on a failure too', fail: 'no Progress, and Rivals’ Progress +0–1' },
    { storylet: FQ_PURSUE, name: 'A bold approach', aliases: ['A bold approach 2'],
      ch: { stat: 'Watchful', diff: 100 }, gain: { prog: 2 }, rivalOdds: 0.5, failMenace: 'Nightmares +1 CP',
      uses: 'Crate of Expedition Supplies ×2, on a failure too', fail: 'no Progress, and Rivals’ Progress +0–1' },
    { storylet: FQ_PURSUE, name: 'A buccaneering approach', ch: { stat: 'Watchful', diff: 160 }, gain: { prog: 3 },
      rivalOdds: 0.5, guide: { rivals: 'the page says only “+0–1”; the 50% is the guide’s table' },
      failMenace: 'Nightmares +2 CP', uses: 'Crate of Expedition Supplies ×3, on a failure too',
      fail: 'no Progress, and Rivals’ Progress +1–2', note: 'The guide’s choice once it is certain: the fastest, '
        + 'and rivals rarely keep up.' },
    { storylet: FQ_PURSUE, name: 'A sign?', gain: { prog: 4 }, airs: '96+', needs: 'a Supply, which it does not spend',
      note: 'Free: no Supplies, no rivals, and Watchful +5 CP. The guide: the only really interesting Airs option.' },
    { storylet: FQ_PURSUE, name: 'A light caught by snow', label: 'Nightmares −1', airs: 'exactly 11' },
    { storylet: FQ_PURSUE, name: 'The tent-city', label: 'Vision', airs: 'exactly 22',
      note: 'Gives a Vision of the Surface.' },
    { storylet: FQ_PURSUE, name: 'White walls in the sun', label: 'Vision', airs: 'exactly 33',
      note: 'Gives a Vision of the Surface.' },
    { storylet: FQ_PURSUE, name: 'An afternoon off', aliases: ['An afternoon off (1 FATE)'], label: 'Fate 1', airs: '85–90',
      note: 'Crate of Expedition Supplies +1, Nightmares −2 CP and Wounds −2 CP, for 1 Fate.' },
    { storylet: FQ_PURSUE, name: 'A supply cache!', aliases: ['A supply cache! (20 FATE)'], label: 'Fate 20',
      needs: 'Supplies below 10', note: 'Crate of Expedition Supplies +10, Rivals’ Progress −2 and an '
        + 'Extraordinary Implication, for 20 Fate.' },
    { storylet: FQ_PURSUE, name: 'A cautious day', aliases: ['A cautious day 2'], label: 'story', airs: '76+ or 95+',
      note: 'A story for the Temple of Uttermost Wind (Airs 76+) or the Cave of the Nadir (95+).' },
    { storylet: FQ_PURSUE, name: 'A chance to hinder Dr Orthos', ch: { stat: 'Watchful', diff: 80 },
      gain: { rivals: -2 }, airs: '90–100', needs: 'Rivals’ Progress 3–9, rival Dr Orthos',
      uses: 'an Intriguing Snippet and a Supply, on a failure too' },
    { storylet: FQ_PURSUE, name: 'A chance to hinder Virginia', ch: { stat: 'Persuasive', diff: 50 },
      gain: { rivals: -2 }, airs: '80–90', needs: 'Rivals’ Progress 3–9, rival Virginia',
      uses: 'Stolen Correspondence ×10 and a Touching Love Story, on a failure too, and a Supply on a success',
      fail: 'an Extraordinary Implication' },
    { storylet: FQ_PURSUE, name: 'A chance to hinder your rival, February', ch: { stat: 'Watchful', diff: 120 },
      gain: { rivals: -2 }, airs: '50–60', needs: 'Rivals’ Progress 3–9, rival February',
      uses: 'a Presbyterate Passphrase, a Bottle of Broken Giant 1844, An Identity Uncovered! and Favours: The Great '
        + 'Game on a success, and a Supply either way' },
    { storylet: FQ_PURSUE, name: 'A chance to hinder your rival, Monsieur Pleat', ch: { stat: 'Shadowy', diff: 100 },
      gain: { rivals: -2 }, airs: '70–80', needs: 'Rivals’ Progress 3–9, rival Monsieur Pleat',
      uses: 'Compromising Document ×2 and a Supply either way, and Drop of Prisoner’s Honey ×50 on a success' },
    { storylet: FQ_PURSUE, name: 'A chance to hinder the Heroic Archaeologist', ch: { stat: 'Persuasive', diff: 50 },
      gain: { rivals: -2 }, airs: '80–90', needs: 'Rivals’ Progress 3–9, rival the Heroic Archaeologist',
      uses: 'Romantic Notion ×5, a Touching Love Story and a Supply, on a failure too', fail: 'an Extraordinary Implication' },
    { storylet: FQ_PURSUE, name: 'A chance to hinder the Lugubrious Seamstress', ch: { stat: 'Persuasive', diff: 50 },
      gain: { rivals: -2 }, airs: '80–90', needs: 'Rivals’ Progress 3–9, rival the Lugubrious Seamstress',
      uses: 'an Unearthly Fossil, a Zee-Ztory and a Supply, on a failure too', fail: 'an Extraordinary Implication' },
    { storylet: FQ_PURSUE, name: 'Confront a Rival', label: '→ confront', actions: 0,
      needs: 'Rivals’ Progress 10, and 10 Supplies' },
    { storylet: FQ_PURSUE, name: 'Concede', label: 'concede', needs: 'Rivals’ Progress 10',
      note: 'Ends the expedition with nothing but a Hard-Earned Lesson. Your Progress is gone.' },
    { storylet: FQ_PURSUE, name: 'Resupply', label: 'give up', needs: 'no Supplies left',
      note: 'Ends the expedition and resets your Progress: the Supplies spent are wasted.' },

    { storylet: FQ_PURSUE, name: "A thieves' cache!", payout: { tag: 'Treasure + Glim',
      gives: 'an Unpredictable Treasure 1–80, Shard of Glim ×400 and Archaeologist +2 CP (to level 2)',
      alt: { odds: 0.5, gives: 'Soul ×500 in place of the Glim, and Archaeologist +1 CP' },
      worth: 'Echoes 6–66.5, about 32; 12–72.5, about 38, with the Souls' } },
    { storylet: FQ_PURSUE, name: 'A Shrine of the Deep Blue Heaven', payout: { tag: 'Treasure',
      gives: 'an Unpredictable Treasure 1–160 and Archaeologist +3 CP (to level 3)',
      rare: { odds: 0.1, gives: 'an Eyeless Skull, an Extraordinary Implication and Whispered Hint ×100 instead' },
      worth: 'Echoes 2–125, about 57' } },
    { storylet: FQ_PURSUE, name: 'The Chalcocite Pagoda', ch: { stat: 'Watchful', diff: 40 }, guide: { ch: 'Watchful 60' },
      payout: { tag: 'Enigma', gives: 'a Searing Enigma and Archaeologist +1 CP',
        failGives: 'Antique Mystery ×2, a Magnificent Diamond and Archaeologist +1 CP -- the expedition still ends',
        worth: '62.5 Echoes, or 37.5 on a failure' } },
    { storylet: FQ_PURSUE, name: 'The Tomb of the Silken Thread', ch: { stat: 'Watchful', diff: 60 },
      payout: { tag: 'Egg + Linen', gives: 'a Judgements’ Egg, a Parabola-Linen Scrap and Archaeologist +1 CP',
        failGives: 'a Parabola-Linen Scrap and Archaeologist +1 CP -- the expedition still ends',
        worth: '145 Echoes with the Rat Market, or 82.5 on a failure' } },
    { storylet: FQ_PURSUE, name: 'The Sanctuary of the Crimson Petals', payout: { tag: 'Portfolio + Skulls',
      gives: 'a Portfolio of Souls, Bright Brass Skull ×2 and Archaeologist +1 CP',
      rare: { odds: 0.2, gives: 'Night-Whisper ×3 instead' },
      worth: '132.5 Echoes, or 247.5 for the Night-Whispers with the Rat Market' } },
    { storylet: FQ_PURSUE, name: 'Stonefall Copse!', payout: { tag: 'Maps + Reflection',
      gives: 'Puzzling Map ×2, a Direful Reflection, Nodule of Warm Amber ×250 and Archaeologist +1 CP',
      worth: '62.5 Echoes' } },
    { storylet: FQ_PURSUE, name: 'The Tomb of the Seven!', ch: { stat: 'Dangerous', diff: 30 }, menace: 'Nightmares +1 CP',
      payout: { tag: 'Stones', gives: 'a Set of Correspondence Stones, Watchful +45 CP and Archaeologist +1 CP',
        failGives: 'nothing: Nightmares +2 CP and a Supply, and you may try again' } },
    { storylet: FQ_PURSUE, name: 'The Gate of the Nadir', payout: { tag: 'route',
      gives: 'the route to the Cave of the Nadir' } },
    { storylet: FQ_PURSUE, name: 'The Temple of Uttermost Wind!', ch: { stat: 'Watchful', diff: 100 },
      payout: { tag: 'Treasure', gives: 'an Unpredictable Treasure 41–240 and an Extraordinary Implication or a '
        + 'Silent Soul (by the guide; the page records none)', failGives: 'a Supply, and you may try again',
        worth: 'Echoes 33–638, about 170' } },
    { storylet: FQ_PURSUE, name: 'The Gallery of Serpents!', payout: { tag: 'Treasure',
      gives: 'the first time an Unpredictable Treasure 135–240 and Uncanny Incunabulum ×0–3, afterwards 120–191 and '
        + 'one Incunabulum (by the guide; its pages were not read)', worth: 'about 287 Echoes the first time, 139 after' } },
    { storylet: FQ_PURSUE, name: 'A Sand-Drowned Stupa', payout: { tag: 'case',
      gives: 'Candlefinder: Progress in a Case 80' } },

    // --- A Confrontation with a Rival ------------------------------------
    { storylet: FQ_CONFRONT, name: "Assault Orthos' camp", ch: { stat: 'Dangerous', diff: 80 }, gain: { prog: 5 },
      rivalsSet: 1, menace: 'Wounds +5 CP', failMenace: 'Wounds +10 CP', actions: 4,
      uses: 'Bottle of Greyfields 1879 ×200 and Supplies ×10, on a failure too',
      needs: 'rival Dr Orthos, Bottle of Greyfields 1879 ×100 (the page unlocks at 100 and takes 200)' },
    { storylet: FQ_CONFRONT, name: 'Bribe Virginia', ch: { stat: 'Watchful', diff: 50 }, gain: { prog: 3 },
      rivalsSet: 1, menace: 'Nightmares +3 CP', failMenace: 'Nightmares +6 CP', actions: 4,
      uses: 'Brilliant Soul ×10 and Supplies ×10, on a failure too', fail: 'Rivals’ Progress +1',
      needs: 'rival Virginia' },
    { storylet: FQ_CONFRONT, name: 'Challenge February to a competition', ch: { stat: 'Watchful', diff: 120 },
      gain: { prog: 3 }, rivalsSet: 1, actions: 4,
      uses: 'Favours: Revolutionaries ×1 and Supplies ×10 on a success, Supplies ×5 on a failure',
      needs: 'rival February' },
    { storylet: FQ_CONFRONT, name: 'Rescue the Heroic Archaeologist', ch: { stat: 'Dangerous', diff: 60 },
      gain: { prog: 3 }, rivalsSet: 1, menace: 'Wounds +3 CP',
      uses: 'Supplies ×10 on a success, ×5 on a failure', fail: 'Rivals’ Progress +1',
      needs: 'rival the Heroic Archaeologist, on the Sanctuary of the Crimson Petals' },
    { storylet: FQ_CONFRONT, name: 'Distract the Lugubrious Seamstress', ch: { stat: 'Persuasive', diff: 72 },
      gain: { prog: [3, 5] }, rivalsSet: 1, menace: 'Nightmares +5 CP',
      uses: 'Bottle of Strangling Willow Absinthe ×10 and Supplies ×10, on a failure too',
      fail: 'Rivals’ Progress +1, and she is gone anyway', needs: 'rival the Lugubrious Seamstress, on the Tomb of the Silken Thread' },
    { storylet: FQ_CONFRONT, name: 'Challenge Monsieur Pleat', ch: { stat: 'Shadowy', diff: 130 }, gain: { prog: 5 },
      rivalsSet: 1, menace: 'Nightmares +4 CP', failMenace: 'Nightmares +8 CP',
      uses: 'Supplies ×10 on a success, ×5 on a failure', needs: 'rival Monsieur Pleat, on the Gallery of Serpents' },
    { storylet: FQ_CONFRONT, name: 'Other Rivals', ch: { stat: 'Watchful', diff: 50 }, gain: {}, rivalsSet: 1,
      uses: 'Cryptic Clue ×20 and Supplies ×10, on a failure too', fail: 'Rivals’ Progress +1',
      needs: 'no named rival left', note: 'Makes no Progress: it only sends the rivals back to 1.' },
    { storylet: FQ_CONFRONT, name: 'Nothing doing', label: '← back' },
  ];

  const FQ_INDEX = carouselIndex(FQ_OPTIONS);

  const FQ_CLASS = 'fl-ux-fq';
  const FQ_FLAG = 'flUxFq';
  const FQ_BRANCH_CLASS = 'fl-ux-fq-branch';
  const FQ_BRANCH_FLAG = 'flUxFqBranch';

  const FQ_RULES = 'Build Crate of Expedition Supplies (up to ' + FQ_SUPPLY_CAP + ', kept between expeditions), '
    + 'then spend them on Archaeologist’s Progress up to the expedition’s length; you start at Progress 1. Running '
    + 'out of Supplies ends the expedition for nothing, and Rivals’ Progress 10 forces a confrontation or a concession.';

  const FQ_CHANGE = {
    prog: { tag: 'Prog', name: 'Archaeologist’s Progress' },
    sup: { tag: 'Sup', name: 'Crate of Expedition Supplies' },
    rivals: { tag: 'Rivals', name: 'Rivals’ Progress' },
  };
  const FQ_CHANGE_KEYS = ['prog', 'sup', 'rivals'];

  function fqLuckValue(luck) {
    return Math.round((luck.odds * luck.win + (1 - luck.odds) * luck.lose) * 10) / 10;
  }

  function fqChangeText(gain) {
    return FQ_CHANGE_KEYS.filter(function (k) { return gain && gain[k] != null; }).map(function (k) {
      return FQ_CHANGE[k].tag + ' ' + carouselRange(gain[k]);
    }).join(' ');
  }

  function fqChangeWords(e) {
    const words = FQ_CHANGE_KEYS.filter(function (k) { return e.gain && e.gain[k] != null; }).map(function (k) {
      return FQ_CHANGE[k].name + ' ' + carouselRange(e.gain[k]);
    });
    if (e.rivalsSet != null) words.push('Rivals’ Progress back to ' + e.rivalsSet + ', and that rival is gone');
    return words.join(', ');
  }

  function fqBadgeText(e) {
    if (e.label) return e.label;
    let text;
    if (e.exp) text = e.exp.supplies + ' sup · ' + (e.exp.fate ? 'Fate ' + e.exp.fate : 'Arch ' + e.exp.arch);
    else if (e.payout) text = e.payout.tag;
    else if (e.luck) text = CAROUSEL_MARK_EXPECTED + 'Sup ' + carouselSigned(fqLuckValue(e.luck));
    else if (e.gain && Object.keys(e.gain).length) text = fqChangeText(e.gain);
    else text = 'Rivals → ' + e.rivalsSet;
    if (e.ch) text += CAROUSEL_MARK_CHALLENGE;
    if (e.menace) text += ' +' + e.menace.split(' ')[0];
    if (e.uses) text += ' ' + CAROUSEL_MARK_USES;
    return text;
  }

  function fqColor(e) {
    if (e.label) return CAROUSEL_COLOR_NEUTRAL;
    if (e.payout) return CAROUSEL_COLOR_PAYOUT;
    if (e.gain && e.gain.prog != null) return CAROUSEL_COLOR_PROGRESS;
    return CAROUSEL_COLOR_SETUP;
  }

  function fqSpec(e) {
    const lines = [e.name, 'Forgotten Quarter expeditions, at Base-Camp · ' + e.storylet, ''];
    if (e.ch) {
      lines.push('Challenge: ' + e.ch.stat + ' ' + e.ch.diff + ', certain at ' + e.ch.stat + ' '
        + broadCertainAt(e.ch.diff) + '.'
        + (e.guide && e.guide.ch ? ' The guide says ' + e.guide.ch + '; the option page is followed.' : ''));
    }
    if (e.exp) {
      const x = e.exp;
      lines.push('Ends at Archaeologist’s Progress ' + x.supplies + ', so ' + x.supplies + ' Supplies is the least it '
        + 'can be done with' + (x.given ? ' -- ' + x.given + ' of them given when it starts' : '') + '.');
      lines.push('Needs Archaeologist ' + x.arch + (x.fate ? ', and costs ' + x.fate + ' Fate' : '') + '.');
      lines.push(x.rivals ? 'Rivals: ' + x.rivals + ', and the rest.' : 'No rivals.');
      lines.push('Pays: ' + x.pays + '.');
      if (x.worst) {
        lines.push('The guide’s worst case, if that approach always succeeds: '
          + ['cautious', 'bold', 'buccaneering'].map(function (a, i) {
            return a + ' ' + (x.worst[i] == null ? 'not advised' : x.worst[i] + ' Supplies');
          }).join(', ') + '.');
      }
    }
    if (e.luck) {
      lines.push(CAROUSEL_MARK_EXPECTED + ' ' + Math.round(e.luck.odds * 100) + '%: Supplies +' + e.luck.win + '; '
        + Math.round((1 - e.luck.odds) * 100) + '%: Supplies +' + e.luck.lose + '. Expected: Supplies +'
        + fqLuckValue(e.luck) + '.');
    }
    if (e.gain && (Object.keys(e.gain).length || e.rivalsSet != null)) {
      lines.push((e.ch ? 'Success: ' : 'Gives: ') + fqChangeWords(e) + '.');
    } else if (e.rivalsSet != null) {
      lines.push((e.ch ? 'Success: ' : 'Gives: ') + fqChangeWords(e) + '.');
    }
    if (e.payout) {
      const p = e.payout;
      lines.push((e.ch ? 'Success: ' : 'Gives: ') + p.gives + '. The expedition ends.');
      if (p.alt) lines.push('Half the time instead, by the page: ' + p.alt.gives + '.');
      if (p.rare) lines.push('Rare success, ' + Math.round(p.rare.odds * 100) + '% by the page: ' + p.rare.gives + '.');
      if (p.failGives) lines.push('Failure: ' + p.failGives + '.');
      if (p.worth) lines.push('The guide’s worth: ' + p.worth + '.');
    }
    if (e.rivalOdds != null) {
      lines.push('Rivals’ Progress +1 on ' + Math.round(e.rivalOdds * 100) + '% of successes'
        + (e.guide && e.guide.rivals ? ' -- ' + e.guide.rivals : ', by the page') + '.');
    }
    if (e.fail) lines.push('Failure: ' + e.fail + '.');
    if (e.menace) lines.push('Always: ' + e.menace + '.');
    if (e.failMenace) lines.push('On a failure: ' + e.failMenace + '.');
    if (e.uses) lines.push(CAROUSEL_MARK_USES + ' Uses up ' + e.uses + '.');
    if (e.needs) lines.push('Needs: ' + e.needs + '.');
    if (e.airs) lines.push('Offered at The Airs of the Forgotten Quarter ' + e.airs + '.');
    if (e.actions === 0) lines.push('Costs no action.');
    else if (e.actions > 1) lines.push('Costs ' + e.actions + ' actions.');
    if (e.rate) lines.push('The guide: about ' + e.rate + ' Echoes a Supply.');
    if (e.guide && e.guide.uses) lines.push('The guide says ' + e.guide.uses + '; the option page is followed.');
    if (e.note) lines.push(e.note);
    lines.push('');
    lines.push(FQ_RULES);
    return { text: fqBadgeText(e), color: fqColor(e), title: lines.join('\n') };
  }

  function fqStoryletSpec(key) {
    const summary = {};
    summary[normalizeName(FQ_PREPARE)] = { storylet: FQ_PREPARE, text: 'supplies',
      extra: 'The guide: Favours: The Docks through the porter, or Strong-Backed Labour through the guards, for most '
        + 'players; cap Supplies at ' + FQ_SUPPLY_CAP + ' before you set out.' };
    summary[normalizeName(FQ_BEGIN)] = { storylet: FQ_BEGIN, text: 'expeditions',
      extra: 'The guide: the thieves’ cache and the shrine to train Archaeologist, the Tomb of the Silken Thread for '
        + 'profit -- ' + FQ_EPA + ' EPA at the end-game. Once you have chosen you cannot go back for more Supplies.' };
    summary[normalizeName(FQ_PURSUE)] = { storylet: FQ_PURSUE, text: 'Prog → goal',
      extra: 'Supplies per Progress depend only on your chance of success, so take the biggest approach you can pass.' };
    summary[normalizeName(FQ_CONFRONT)] = { storylet: FQ_CONFRONT, text: 'rivals',
      extra: 'A named rival can be confronted once; after that only Other Rivals is left.' };
    const s = summary[key];
    if (!s) return null;
    const lines = [s.storylet, 'Forgotten Quarter expeditions, at Base-Camp', ''];
    FQ_OPTIONS.filter(function (e) { return e.storylet === s.storylet; }).forEach(function (e) {
      lines.push('  • ' + e.name + ' — ' + fqBadgeText(e));
    });
    lines.push('');
    lines.push(s.extra);
    lines.push(FQ_RULES);
    lines.push('');
    lines.push('Open the storylet and every option is badged in its own right.');
    return { text: s.text, color: CAROUSEL_COLOR_LABEL, title: lines.join('\n') };
  }

  function fqRatings() {
    carouselRatings({
      storylets: FQ_STORYLETS, index: FQ_INDEX, storyletSpec: fqStoryletSpec, optionSpec: fqSpec,
      aliases: FQ_STORYLET_ALIASES,
      cls: FQ_CLASS, flag: FQ_FLAG, branchCls: FQ_BRANCH_CLASS, branchFlag: FQ_BRANCH_FLAG,
    });
  }

  // === panel: zailing ====================================================
  //
  // The reference half of the zailing work: the numbers that decide a voyage
  // before any single card does -- how much Zailing... a route needs, what Zee
  // Peril each region sets every broad challenge to, which menace turns
  // Troubled Waters 7 into which black card, and where the nearest reset is --
  // plus the whole card table the badges are drawn from, searchable.
  //
  // It opens with whatever zee cards are on screen right now, ranked, because
  // that is the question you actually have while the panel is open.

  function zeeHandRows() {
    const seen = new Map();
    eachCardName(function (host, name) {
      const card = zeeCardFor(name);
      if (card && !seen.has(card.name)) seen.set(card.name, card);
    });
    const cards = Array.from(seen.values());
    cards.sort(function (a, b) {
      // Urgent first: they are dealt before everything else anyway, so a hand
      // holding one is really a hand of one.
      if (!!a.urgent !== !!b.urgent) return a.urgent ? -1 : 1;
      const la = bestZeeLine(a), lb = bestZeeLine(b);
      if (!la || !lb) return la ? -1 : 1;
      // Same order the badge is chosen in: cheapest first, faster to break a tie.
      const dt = zeeTwScore(la.opt) - zeeTwScore(lb.opt);
      if (dt) return dt;
      return zeeProgScore(lb.opt.prog) - zeeProgScore(la.opt.prog);
    });
    return cards;
  }

  function zeeBadgeNode(card) {
    return makeBadge(zeeBadgeSpec(card), ZEE_CLASS);
  }

  // What a port is called on the zee map. `name` is the wiki page, which is
  // not always what Fallen London puts on the destination -- the governor's
  // seat is the page "Heartscross House" and the destination "Port Carnelian".
  function zeePortLabel(port) {
    return port.as || port.name;
  }

  // The three claims kept apart: a reset, a dock that is not one, and a place
  // that is not a dock at all. A blank cell would read as the second.
  function zeePortSafeCell(port) {
    if (port.safe === null) {
      return h('span', { css: 'color:' + UI.dim + ';', title: 'Not a dock — nothing to reset.' }, ['not a dock']);
    }
    return port.safe
      ? h('span', { css: 'color:#7fae92;font-weight:bold;', title: 'Docking here wipes Troubled Waters and every zee-threat.' }, ['✔ safe'])
      : h('span', { css: 'color:#c98a8a;', title: 'A dock, but arriving resets nothing.' }, ['✘']);
  }

  function zeePortRow(port) {
    const row = h('tr', null, [
      h('td', { css: TD }, [
        h('div', null, [
          wikiLink(port.name, zeePortLabel(port)),
          port.fate ? h('span', { css: 'color:#8a6b3b;margin-left:5px;', title: 'Fate-locked.' }, ['Fate']) : null,
          port.once ? h('span', { css: 'color:' + UI.dim + ';margin-left:5px;', title: 'A one-time destination, sailed to for a storyline rather than visited.' }, ['once']) : null,
        ]),
      ]),
      h('td', { css: TD + 'white-space:nowrap;' }, [zeePortSafeCell(port)]),
      h('td', { css: TD + 'color:' + UI.dim + ';' }, [
        h('div', { css: 'color:' + UI.text + ';' }, [port.unlock || 'nothing — it is there from the start']),
        port.how ? h('div', { css: 'font-size:11px;' }, [port.how]) : null,
        port.note ? h('div', { css: 'font-size:11px;' }, [port.note]) : null,
      ]),
    ]);
    row.dataset.zeePort = zeePortLabel(port);
    return row;
  }

  function zeeCardRow(card) {
    const best = bestZeeLine(card);
    const opt = best && best.opt;
    const row = h('tr', null, [
      h('td', { css: TD + 'white-space:nowrap;' }, [
        wikiLink(card.name, card.name),
        card.urgent ? h('span', { css: 'color:#7fae92;margin-left:5px;', title: 'A black card: urgent, so it is dealt before every other zee card.' }, ['urgent']) : null,
      ]),
      h('td', { css: TD + 'text-align:center;' }, [zeeBadgeNode(card)]),
      h('td', { css: TD + 'color:' + UI.dim + ';' }, [
        opt ? h('div', null, [
          h('span', { css: 'color:' + UI.text + ';' }, [opt.text]),
          ' — ' + zeeTwWord(opt) + ', ' + zeeSpeedWord(opt.prog) + (opt.ch ? ' (' + opt.ch + ')' : ''),
        ]) : null,
        best && best.gated ? h('div', { css: 'color:#8a6b3b;' }, ['Every line here is gated on something.']) : null,
        card.note ? h('div', null, [card.note]) : null,
      ]),
    ]);
    // The search box filters on this rather than on textContent, so a term can
    // match an option you can't see in the collapsed row.
    row.dataset.zeeSearch = (card.name + ' ' + card.where.join(' ') + ' ' + (card.note || '') + ' '
      + card.opts.map(function (o) { return o.text + ' ' + (o.need || '') + ' ' + (o.gain || ''); }).join(' ')).toLowerCase();
    return row;
  }

  function renderZailingPanel() {
    const hand = zeeHandRows();

    const section = function (title, children) {
      return h('div', { css: 'margin-top:14px;' }, [
        h('div', {
          css: 'font:bold 11px ' + UI.font + ';letter-spacing:.06em;text-transform:uppercase;'
            + 'color:' + UI.accent + ';margin-bottom:5px;',
        }, [title]),
        children,
      ]);
    };
    const table = function (heads, rows) {
      return h('table', { css: 'width:100%;border-collapse:collapse;' }, [
        h('thead', null, [h('tr', null, heads.map(function (head) {
          return h('th', { css: TH + (head.right ? 'text-align:right;' : ''), title: head.title || '' }, [head.text]);
        }))]),
        h('tbody', null, rows),
      ]);
    };

    // --- the hand ---------------------------------------------------------
    const handBlock = hand.length
      ? h('div', {
          css: 'margin:10px 0 0;padding:8px 10px;border-left:3px solid ' + UI.accent
            + ';background:' + UI.bgAlt + ';font-size:12px;line-height:1.6;',
        }, [
          h('div', { css: 'color:' + UI.accent + ';font-weight:bold;' }, [
            hand.length === 1 ? '1 zee card on screen' : hand.length + ' zee cards on screen',
            h('span', { css: 'color:' + UI.dim + ';font-weight:normal;' }, [' — best first']),
          ]),
          hand.map(function (card) {
            const best = bestZeeLine(card);
            return h('div', null, [
              zeeBadgeNode(card),
              h('span', { css: 'margin-left:6px;' }, [card.name]),
              best ? h('span', { css: 'color:' + UI.dim + ';' },
                [' — ' + best.opt.text + ' (' + zeeTwWord(best.opt) + ', ' + zeeSpeedWord(best.opt.prog) + ')']) : null,
            ]);
          }),
        ])
      : h('div', {
          css: 'margin:10px 0 0;padding:8px 10px;border-left:3px solid ' + UI.line
            + ';background:' + UI.bgAlt + ';color:' + UI.dim + ';font-size:12px;line-height:1.5;',
        }, ['No zee cards on screen. Everything below is reference material for when there are.']);

    // --- the ports, region by region --------------------------------------
    // In ZEE_REGIONS order, which is the order the regions were listed in
    // above, so the two tables read the same way down the page. A port in
    // several regions (only the lifebergs) is listed under each of them.
    const portRows = [];
    for (const region of ZEE_REGIONS) {
      const here = ZEE_PORTS.filter(function (p) { return p.regions.indexOf(region.name) !== -1; });
      if (!here.length) continue;
      portRows.push(h('tr', null, [h('td', {
        colSpan: 3,
        css: 'padding:8px 8px 3px;font:bold 11px ' + UI.font + ';letter-spacing:.05em;'
          + 'text-transform:uppercase;color:' + UI.dim + ';border-bottom:1px solid ' + UI.line + ';',
      }, [region.name])]));
      for (const port of here) portRows.push(zeePortRow(port));
    }

    // --- the searchable card table ---------------------------------------
    const REGION_ORDER = ['any', 'Home Waters', "Shepherd's Wash", 'The Sea of Voices',
      'The Salt Steppe', 'The Pillared Sea', 'Stormbones', 'The Snares'];
    const REGION_TITLE = { any: 'Drawn anywhere at zee' };
    const cardRows = [];
    for (const region of REGION_ORDER) {
      const inRegion = ZEE_CARDS.filter(function (c) {
        return c.where.indexOf(region) !== -1 && (region === 'any' || c.where.indexOf('any') === -1);
      });
      if (!inRegion.length) continue;
      const header = h('tr', null, [h('td', {
        colSpan: 3,
        css: 'padding:8px 8px 3px;font:bold 11px ' + UI.font + ';letter-spacing:.05em;'
          + 'text-transform:uppercase;color:' + UI.dim + ';border-bottom:1px solid ' + UI.line + ';',
      }, [REGION_TITLE[region] || region])]);
      header.dataset.zeeGroup = '1';
      cardRows.push(header);
      for (const card of inRegion) cardRows.push(zeeCardRow(card));
    }

    const search = h('input', {
      type: 'text',
      placeholder: 'filter cards, options, requirements…',
      css: 'flex:1;min-width:140px;box-sizing:border-box;padding:3px 7px;background:' + UI.bgAlt
        + ';color:' + UI.text + ';border:1px solid ' + UI.line + ';border-radius:3px;font:12px ' + UI.font + ';',
      on: {
        input: function (e) {
          const term = String(e.currentTarget.value || '').trim().toLowerCase();
          for (const row of cardRows) {
            if (row.dataset.zeeGroup) continue;
            row.hidden = !!term && row.dataset.zeeSearch.indexOf(term) === -1;
          }
          // A region heading with nothing left under it is just noise.
          let group = null, shown = 0;
          for (const row of cardRows) {
            if (row.dataset.zeeGroup) {
              if (group) group.hidden = shown === 0;
              group = row; shown = 0;
            } else if (!row.hidden) shown++;
          }
          if (group) group.hidden = shown === 0;
        },
      },
    });

    return h('div', { css: 'padding:0 12px 12px;' }, [
      handBlock,

      section('Getting there', h('div', null, [
        table([
          { text: 'Route' },
          { text: 'Zailing…', right: true, title: 'How much Zailing... the leg needs.' },
          { text: 'Tramp Steamer', right: true, title: 'Rusty Tramp Steamer, Zailing Speed 45.' },
          { text: 'Most ships', right: true, title: 'Zailing Speed 55.' },
          { text: 'Zee-Clipper', right: true, title: 'Swift Zee-Clipper or Ogedei-class Liner, Zailing Speed 75.' },
        ], ZEE_ROUTES.map(function (r) {
          return h('tr', null, [
            h('td', { css: TD }, [
              h('div', { css: 'color:' + UI.text + ';' }, [r.name]),
              h('div', { css: 'color:' + UI.dim + ';font-size:11px;' }, [r.of]),
            ]),
            h('td', { css: TD + 'text-align:right;' }, [String(r.need)]),
            h('td', { css: TD + 'text-align:right;color:' + UI.dim + ';' }, [r.tramp]),
            h('td', { css: TD + 'text-align:right;color:' + UI.dim + ';' }, [r.other]),
            h('td', { css: TD + 'text-align:right;color:' + UI.dim + ';' }, [r.clipper]),
          ]);
        })),
        h('div', { css: 'margin-top:5px;color:' + UI.dim + ';font-size:11px;line-height:1.6;' }, [
          'Actions are the guide’s averages. Crossing a region gives a Zee Leg; only the last '
          + 'leg, inside your destination’s own region, is the 80.',
        ]),
      ])),

      section('Where you are', h('div', null, [
        table([
          { text: 'Region' },
          { text: 'Zee Peril', right: true, title: 'Every broad challenge out there — Watchful, Shadowy, Dangerous, Persuasive — is set to this.' },
          { text: 'Narrow', right: true, title: 'What a skill challenge scales to. The non-piracy Zeefaring checks do not scale at all.' },
          { text: '' },
        ], ZEE_REGIONS.map(function (r) {
          return h('tr', null, [
            h('td', { css: TD }, [wikiLink(r.name, r.name)]),
            h('td', { css: TD + 'text-align:right;' }, [String(r.peril)]),
            h('td', { css: TD + 'text-align:right;color:' + UI.dim + ';' }, [String(r.narrow)]),
            h('td', { css: TD + 'color:' + UI.dim + ';' }, [r.note]),
          ]);
        })),
      ])),

      section('Troubled Waters', h('div', null, [
        h('div', { css: 'color:' + UI.dim + ';font-size:12px;line-height:1.6;' }, [
          h('div', null, ['1–5 Calm Seas · 6–7 Lashing Waves · ',
            h('span', { css: 'color:#c98a8a;' }, ['8 is a Demise at Zee']),
            ' — it kills you or drives you mad, and it takes precedence over arriving.']),
          h('div', null, ['Docking somewhere safe wipes it, and every zee-threat with it. Wounds and Nightmares stay.']),
          h('div', null, ['At 7 you start drawing black cards — one per zee-threat you are carrying. '
            + 'They are urgent, so with two of them your hand holds nothing else.']),
        ]),
        h('div', { css: 'margin-top:8px;' }, [table([
          { text: 'Zee-threat' }, { text: 'Comes from' }, { text: 'Its black card at Troubled Waters 7' },
        ], ZEE_MENACES.map(function (m) {
          return h('tr', null, [
            h('td', { css: TD }, [wikiLink(m.name, m.name)]),
            h('td', { css: TD + 'color:' + UI.dim + ';' }, [m.from]),
            h('td', { css: TD }, [wikiLink(m.card, m.card)]),
          ]);
        }))]),
      ])),

      section('Ports', h('div', null, [
        h('div', { css: 'color:' + UI.dim + ';font-size:12px;line-height:1.6;margin-bottom:6px;' },
          ZEE_REGIONS.map(function (r) {
            const safe = ZEE_PORTS.filter(function (p) {
              return p.safe === true && p.regions.indexOf(r.name) !== -1;
            });
            return h('div', null, [
              h('span', { css: 'color:' + UI.text + ';' }, [r.name + ': ']),
              safe.length
                ? safe.map(function (p) { return zeePortLabel(p); }).join(' · ')
                : h('span', { css: 'color:#c98a8a;' }, ['no safe dock at all']),
            ]);
          })),
        table([
          { text: 'Port' },
          { text: 'Safe?', title: 'Docking at a safe port wipes Troubled Waters and every zee-threat. Wounds and Nightmares stay.' },
          { text: 'What it takes' },
        ], portRows),
        h('div', { css: 'margin-top:5px;color:' + UI.dim + ';font-size:11px;line-height:1.6;' }, [
          h('div', null, ['Being a port is not the same as being safe — Port Cecil, Godfall, Irem, '
            + 'Gaider’s Mourn and Tanah-Chook are all ports and none of them resets anything.']),
          h('div', null, ['The hunting grounds are not docks at all, so they reset nothing either. '
            + 'One-time destinations are marked; you sail to those once, for a storyline.']),
        ]),
      ])),

      section('The winds', h('div', null, [
        table([{ text: 'Wind' }, { text: 'First found' }, { text: 'On the card' }, { text: 'Dream it starts in London' }],
          ZEE_WINDS.map(function (w) {
            return h('tr', null, [
              h('td', { css: TD }, [wikiLink(w.name, w.name)]),
              h('td', { css: TD + 'color:' + UI.dim + ';' }, [w.where]),
              h('td', { css: TD }, [wikiLink(w.card, w.card)]),
              h('td', { css: TD + 'color:' + UI.dim + ';' }, [
                h('div', null, [wikiLink('Having Recurring Dreams: ' + w.dream, w.dream)]),
                h('div', { css: 'font-size:11px;' }, [w.cost]),
              ]),
            ]);
          })),
        h('div', { css: 'margin-top:5px;color:' + UI.dim + ';font-size:11px;line-height:1.6;' }, [
          'A finished dream storyline pays an Oneiric Pearl and resets. Winds survive docking.',
        ]),
      ])),

      section('Every zee card', h('div', null, [
        h('div', { css: 'display:flex;align-items:center;gap:8px;margin-bottom:6px;' }, [search]),
        table([{ text: 'Card' }, { text: '' }, { text: 'Best line with nothing special in hand' }], cardRows),
      ])),

      h('div', { css: 'margin-top:12px;color:' + UI.dim + ';font-size:11px;line-height:1.6;' }, [
        h('div', null, ['The badge is the Troubled Waters cost, in change points, of the best line you '
          + 'can take with nothing special in hand. ',
          h('b', null, ['?']), ' means that is a challenge’s success value; ',
          h('b', null, ['½']), ' that the line only makes half progress; ',
          h('b', null, ['·']), ' that it makes none; ',
          h('b', null, ['★']), ' the one line that hands you a flat 80; ',
          h('b', null, [ZEE_GATED_MARK]), ' that a cheaper line exists behind an item, a quality or piracy.']),
        h('div', null, ['Options behind an item or a quality are in the tooltip but never in the badge, '
          + 'and piracy lines (Corsair’s Colours, a bounty) are left out of it too.']),
        h('div', { css: 'margin-top:6px;' }, ['Data from ',
          wikiLink('Zailing (Guide)', 'Zailing (Guide)'), ' and the individual card pages on the Fallen London wiki.']),
      ]),
    ]);
  }

  // === panel: Port Carnelian =============================================
  //
  // The reference half of the governorship: how to get there at all, the rules
  // a term is played by, every option the guide records grouped by the clock,
  // what the two currencies cash in for and where the rounding steps are.
  //
  // Unlike the Zailing panel there is no "your hand, ranked" block at the top:
  // Port Carnelian deals no opportunity cards, so what is in front of you is
  // the storylet list itself -- which is already badged.

  const PC_TIME_GROUPS = [
    { key: '1-11', label: 'Time Passing in Office 1–11 — always on offer' },
    { key: '1-10', label: 'Time Passing in Office 1–10' },
    { key: '1-6', label: 'Time Passing in Office 1–6 — the first half' },
    { key: '7-10', label: 'Time Passing in Office 7–10 — the second half' },
    { key: '11-11', label: 'Time Passing in Office 11 — the last working action' },
    { key: '12-12', label: 'Time Passing in Office 12 — the endings' },
  ];

  // One row of the table is one ROW of the guide, so a storylet the guide
  // splits in two gets a line and a badge each -- which is the same thing the
  // in-game branch badges do, and the reason this is not `pcStoryletSpec` for
  // everything.
  function pcBadgeNode(entry, purse) {
    return makeBadge(
      entry.branch ? pcBranchSpec(entry, purse) : pcStoryletSpec([entry], purse), PC_CLASS);
  }

  function pcOptionRow(entry, purse) {
    const row = h('tr', null, [
      h('td', { css: TD }, [
        h('div', null, [wikiLink(entry.name, entry.name)]),
        entry.branch
          ? h('div', { css: 'color:' + UI.dim + ';font-size:11px;' }, ['→ ' + entry.branch])
          : null,
        entry.needs
          ? h('div', { css: 'color:' + UI.dim + ';font-size:11px;' }, ['needs ' + entry.needs])
          : null,
      ]),
      h('td', { css: TD + 'white-space:nowrap;color:' + UI.dim + ';' },
        [entry.airs ? pcRange(entry.airs) : 'any']),
      h('td', { css: TD + 'text-align:center;' }, [pcBadgeNode(entry, purse)]),
      h('td', { css: TD + 'color:' + UI.dim + ';' }, [
        h('div', { css: 'color:' + UI.text + ';' }, [pcChangeWords(entry)]),
        entry.note ? h('div', { css: 'font-size:11px;' }, [entry.note]) : null,
      ]),
    ]);
    // Filtered on this rather than on textContent, so a term can match a
    // requirement or a note the collapsed row does not spell out.
    row.dataset.pcSearch = (entry.name + ' ' + (entry.branch || '') + ' '
      + (entry.needs || '') + ' ' + (entry.note || '') + ' ' + pcChangeWords(entry)).toLowerCase();
    return row;
  }

  function renderPortCarnelianPanel(ctx) {
    // The one live thing in this panel. Everything else here is the guide; the
    // purse is your own numbers, off the Myself tab, and the four endings are
    // priced against it. Same refresh rule as the festival panel: if the
    // reading is stale and auto-refresh is on, boot /myself in a hidden frame
    // and redraw when it lands.
    const purse = pcPurse();
    const cashouts = pcCashoutAll(purse);
    let busy = false;
    if (ctx && autoRefreshEnabled() && (!purse || purse.stale)) {
      busy = true;
      refreshBackgroundState().then(function () { ctx.rerender(); });
    }

    const section = function (title, children) {
      return h('div', { css: 'margin-top:14px;' }, [
        h('div', {
          css: 'font:bold 11px ' + UI.font + ';letter-spacing:.06em;text-transform:uppercase;'
            + 'color:' + UI.accent + ';margin-bottom:5px;',
        }, [title]),
        children,
      ]);
    };
    const table = function (heads, rows) {
      return h('table', { css: 'width:100%;border-collapse:collapse;' }, [
        h('thead', null, [h('tr', null, heads.map(function (head) {
          return h('th', { css: TH + (head.right ? 'text-align:right;' : ''), title: head.title || '' }, [head.text]);
        }))]),
        h('tbody', null, rows),
      ]);
    };

    // --- the rules, up top where they belong -------------------------------
    const rules = h('div', {
      css: 'margin:10px 0 0;padding:8px 10px;border-left:3px solid ' + UI.accent
        + ';background:' + UI.bgAlt + ';font-size:12px;line-height:1.6;',
    }, [
      h('div', { css: 'color:' + UI.accent + ';font-weight:bold;' },
        ['A term is ' + PC_TERM_ACTIONS + ' actions']),
      h('div', null, ['Raise ', wikiLink('Striped Delights', 'Striped Delights'), ' or ',
        wikiLink('Silver Horseheads', 'Silver Horseheads'),
        ' as high as you can, then cash ONE of them in at Time 12.']),
      h('div', null, [
        h('span', { css: 'color:#c98a8a;' }, ['Never let ']),
        wikiLink('Imperial Legitimacy', 'Imperial Legitimacy'),
        h('span', { css: 'color:#c98a8a;' }, [' reach 0']),
        ' — the only option left is “The sword falls”, you are sent back to zee with '
        + 'nothing, and getting it back means raising Working toward a Foreign Posting to 7 '
        + 'at the Foreign Office all over again. Legitimacy carries over between terms; '
        + 'the two currencies do not.',
      ]),
      h('div', null, [wikiLink('The Airs of Port Carnelian', 'The Airs of Port Carnelian'),
        ' is re-rolled every single action, so which options you are offered is read off '
        + 'the screen, not planned. There are no opportunity cards here.']),
    ]);

    // --- every option, grouped by the clock --------------------------------
    const optionRows = [];
    for (const group of PC_TIME_GROUPS) {
      const inGroup = PC_OPTIONS.filter(function (e) { return e.time.join('-') === group.key; });
      if (!inGroup.length) continue;
      const header = h('tr', null, [h('td', {
        colSpan: 4,
        css: 'padding:8px 8px 3px;font:bold 11px ' + UI.font + ';letter-spacing:.05em;'
          + 'text-transform:uppercase;color:' + UI.dim + ';border-bottom:1px solid ' + UI.line + ';',
      }, [group.label])]);
      header.dataset.pcGroup = '1';
      optionRows.push(header);
      for (const entry of inGroup) optionRows.push(pcOptionRow(entry, purse));
    }

    const search = h('input', {
      type: 'text',
      placeholder: 'filter options, requirements, rewards…',
      css: 'flex:1;min-width:140px;box-sizing:border-box;padding:3px 7px;background:' + UI.bgAlt
        + ';color:' + UI.text + ';border:1px solid ' + UI.line + ';border-radius:3px;font:12px ' + UI.font + ';',
      on: {
        input: function (e) {
          const term = String(e.currentTarget.value || '').trim().toLowerCase();
          for (const row of optionRows) {
            if (row.dataset.pcGroup) continue;
            row.hidden = !!term && row.dataset.pcSearch.indexOf(term) === -1;
          }
          let group = null, shown = 0;
          for (const row of optionRows) {
            if (row.dataset.pcGroup) {
              if (group) group.hidden = shown === 0;
              group = row; shown = 0;
            } else if (!row.hidden) shown++;
          }
          if (group) group.hidden = shown === 0;
        },
      },
    });

    // --- what your term is worth right now --------------------------------
    //
    // The four endings priced against the purse. The best one is marked with a
    // WORD as well as the accent colour, because a colour is not a claim this
    // reader can always read; and an ending whose figure cannot be worked out
    // shows a dash rather than a zero, since "no Delights" and "your Delights
    // have not been read" are different answers.
    const cashFigure = function (cash) {
      return cash.echo == null ? '–' : pcEchoText(cash.echo);
    };
    const bestCash = pcBestCashout(cashouts);
    const purseStat = function (label, value, title) {
      return h('div', { title: title || '', css: 'min-width:92px;' }, [
        h('div', {
          css: 'color:' + UI.dim + ';font-size:10px;letter-spacing:.05em;text-transform:uppercase;',
        }, [label]),
        h('div', { css: 'color:' + UI.text + ';font:bold 15px ' + UI.font + ';' },
          [value == null ? '–' : String(value)]),
      ]);
    };
    const cashItemLine = function (row) {
      return h('div', null, [
        h('span', { css: 'color:' + UI.text + ';' },
          [(row.count == null ? '?' : row.count) + ' × ' + row.name]),
        row.favour ? h('span', {
          title: 'A faction Favour: a story quality capped at ' + PC_SOCIETY_CAP
            + ', which you cannot sell. Priced at 0 Echoes here.',
          css: 'color:' + UI.accent + ';',
        }, [' ' + PC_FAVOUR_MARK]) : null,
        row.each ? h('span', { css: 'color:' + UI.dim + ';' },
          [' (' + pcEchoText(row.each) + ' each)']) : null,
        row.needs ? h('div', { css: 'font-size:11px;' },
          ['needs ' + row.needs.quality + ' ' + row.needs.atLeast]) : null,
        row.capped ? h('div', { css: 'font-size:11px;color:#e0a24a;' },
          ['you are at the cap of ' + PC_SOCIETY_CAP + ', so this one is not given']) : null,
      ]);
    };
    const cashRow = function (cash) {
      const best = cash === bestCash;
      return h('tr', null, [
        h('td', { css: TD }, [
          h('div', null, [wikiLink(cash.name, cash.name)]),
          h('div', { css: 'font-size:11px;color:' + UI.dim + ';' }, [
            cash.currency
              ? (cash.have == null ? 'your ' + cash.currency + ' has not been read'
                : cash.currency + ' ' + cash.have)
              : 'spends both purses, pays a fixed reward',
          ]),
          best ? h('div', { css: 'font-size:11px;color:' + UI.accent + ';font-weight:bold;' },
            ['★ best right now']) : null,
        ]),
        h('td', { css: TD + 'color:' + UI.dim + ';font-size:12px;' },
          cash.items.map(cashItemLine)),
        h('td', { css: TD + 'text-align:right;white-space:nowrap;'
          + (best ? 'color:' + UI.accent + ';font-weight:bold;' : '') }, [
          h('div', null, [cashFigure(cash)]),
          cash.next ? h('div', { css: 'font-size:11px;font-weight:normal;color:' + UI.dim + ';' },
            ['next at ' + cash.next.at + ' (+' + cash.next.more + ') — '
              + pcEchoText(cash.next.echo)]) : null,
        ]),
      ]);
    };

    const cashOutNow = h('div', null, [
      h('div', {
        css: 'display:flex;flex-wrap:wrap;gap:10px 18px;margin-bottom:8px;',
      }, [
        purseStat('Striped Delights', purse && purse.sd, 'Cashed in at An audience with the Banded Prince.'),
        purseStat('Silver Horseheads', purse && purse.sh, 'Cashed in at An equine festival.'),
        purseStat('Legitimacy', purse && purse.legitimacy,
          'Imperial Legitimacy. At 0 the term ends at once with no rewards.'),
        purseStat('Time in office', purse && purse.time,
          'Time Passing in Office. The endings are offered at 12.'),
        purseStat('Society favours',
          purse && purse.society == null ? null
            : (purse ? purse.society + '/' + PC_SOCIETY_CAP : null),
          'Honoured with a State Dinner pays a Society favour only while this is under '
            + PC_SOCIETY_CAP + '.'),
      ]),
      table([
        { text: 'Ending' },
        { text: 'Pays' },
        { text: 'Echoes', right: true, title: 'Faction Favours and Tribute count as 0 — '
          + 'story qualities, not items, and nothing sells them. A Favour in High Places is an '
          + 'ordinary item and is priced like one.' },
      ], cashouts.map(cashRow)),
      h('div', { css: 'margin-top:6px;color:' + UI.dim + ';font-size:11px;line-height:1.6;' }, [
        purse && purse.partial
          ? h('div', null, ['The Myself tab was filtered when this was read, so a figure '
            + 'missing from it is not a zero — clear that search box and refresh.'])
          : null,
        h('div', { css: 'display:flex;align-items:center;gap:8px;flex-wrap:wrap;' }, [
          h('span', null, [purse
            ? ('Your numbers: ' + (purse.live ? 'live' : ageText(purse.at))
              + (purse.stale ? ' — every action of a term moves both currencies' : ''))
            : 'Your numbers have never been read.']),
          h('button', {
            type: 'button',
            disabled: busy,
            title: 'Load /myself in a hidden frame and re-read it.',
            css: 'border:1px solid ' + UI.line + ';border-radius:3px;background:transparent;color:'
              + (busy ? UI.dim : UI.accent) + ';font:11px ' + UI.font + ';padding:1px 7px;'
              + 'cursor:' + (busy ? 'default' : 'pointer') + ';',
            on: {
              click: function () {
                if (busy || !ctx) return;
                busy = true;
                ctx.rerender();
                refreshBackgroundState().then(function () { ctx.rerender(); });
              },
            },
          }, [busy ? 'Refreshing…' : 'Refresh']),
          h('label', {
            title: 'Refresh automatically when this panel opens on stale numbers.',
            css: 'display:inline-flex;align-items:center;gap:4px;cursor:pointer;',
          }, [
            h('input', {
              type: 'checkbox',
              checked: autoRefreshEnabled(),
              on: { change: function (e) { setAutoRefresh(!!e.currentTarget.checked); } },
            }),
            'auto',
          ]),
        ]),
      ]),
    ]);

    return h('div', { css: 'padding:0 12px 12px;' }, [
      rules,

      section('Cash out now', cashOutNow),

      section('Getting there', h('div', { css: 'color:' + UI.dim + ';font-size:12px;line-height:1.7;' }, [
        h('div', null, ['1. Be ', wikiLink('Banished from the Court', 'Banished from the Court'),
          ' — the end of the Court storyline, after the Tomb-Colonies.']),
        h('div', null, ['2. Raise ',
          wikiLink('Working toward a Foreign Posting', 'Working toward a Foreign Posting'),
          ' to 7 at ', wikiLink('The Foreign Office', 'The Foreign Office'), ', then take ',
          wikiLink('The Manifestation of Promise', 'The Manifestation of Promise'), '.']),
        h('div', null, ['3. Put to zee from ', wikiLink('Wolfstack Docks', 'Wolfstack Docks'),
          ', pick ', wikiLink('Destination: The Elder Continent', 'The Elder Continent'),
          ' at the southern edge of the map, then ',
          wikiLink('Set a course for Port Carnelian', 'Set a course for Port Carnelian'), '.']),
        h('div', { css: 'margin-top:5px;' }, ['Coming back after a sword falls is step 2 again, '
          + 'ending on ', wikiLink('The Value of Good Names', 'The Value of Good Names'),
          ' instead — or The Manifestation of Promise, if you have never finished a term.']),
      ])),

      section('Every option', h('div', null, [
        h('div', { css: 'display:flex;align-items:center;gap:8px;margin-bottom:6px;' }, [search]),
        table([
          { text: 'Option' },
          { text: 'Airs', title: 'The window of The Airs of Port Carnelian this is offered in. Re-rolled every action.' },
          { text: '' },
          { text: 'What it changes' },
        ], optionRows),
      ])),

      section('Cashing out', h('div', null, [
        h('div', { css: 'color:' + UI.dim + ';font-size:12px;line-height:1.7;' },
          PC_REWARDS.map(function (reward) {
            return h('div', { css: 'margin-bottom:4px;' }, [
              h('span', { css: 'color:' + UI.text + ';' }, [reward.currency + ' — ']),
              wikiLink(reward.via, reward.via),
              h('div', { css: 'font-size:11px;' }, [reward.items.map(function (item) {
                return h('div', null, ['· ', wikiLink(item.name, item.name),
                  ' × (' + item.count + ') — ' + item.worth]);
              })]),
            ]);
          })),
        h('div', { css: 'margin-top:8px;' }, [table([
          { text: 'Currency', right: true, title: 'The least Silver Horseheads or Striped Delights that buys this step.' },
          { text: '2.5 Echo items', right: true },
          { text: '12.5 Echo items', right: true },
          { text: 'Echoes', right: true },
          { text: 'You', title: 'D — your Striped Delights reach this step. H — your Silver Horseheads do.' },
        ], PC_TIERS.map(function (tier, i) {
          // 105 and 176 are the two steps the strategy alternates between.
          const pick = tier.at === 105 || tier.at === 176;
          // Which step each purse is standing on. A LETTER rather than a
          // highlight, so the row still says so with the colour stripped off,
          // and one letter per currency because the two are on different rows.
          const ceiling = PC_TIERS[i + 1] ? PC_TIERS[i + 1].at : Infinity;
          const on = function (have) { return have != null && have >= tier.at && have < ceiling; };
          const you = [purse && on(purse.sd) ? 'D' : null, purse && on(purse.sh) ? 'H' : null]
            .filter(Boolean).join(' ');
          return h('tr', null, [
            h('td', { css: TD + 'text-align:right;' + (pick ? 'color:' + UI.accent + ';font-weight:bold;' : '') },
              [String(tier.at)]),
            h('td', { css: TD + 'text-align:right;color:' + UI.dim + ';' }, [String(tier.cheap)]),
            h('td', { css: TD + 'text-align:right;color:' + UI.dim + ';' }, [String(tier.dear)]),
            h('td', { css: TD + 'text-align:right;' + (pick ? 'color:' + UI.accent + ';' : '') },
              [String(tier.echo)]),
            h('td', {
              css: TD + 'font-weight:bold;color:' + UI.accent + ';',
              title: you ? 'Where your purse stands: D Striped Delights, H Silver Horseheads.' : '',
            }, [you]),
          ]);
        }))]),
      ])),

      section('Strategy', h('div', { css: 'color:' + UI.dim + ';font-size:12px;line-height:1.7;' }, [
        h('div', null, ['Take the biggest net on the screen, whichever resource it is in — '
          + 'the airs-gated options trade all three for each other anyway.']),
        h('div', null, ['Keep Imperial Legitimacy under 90: several options are hidden above it. '
          + 'Gaining it is unreliable (about a 10% chance per re-roll of Airs), so trade '
          + 'Delights for Horseheads rather than spending Legitimacy where you can.']),
        h('div', null, ['Stock Silver Horseheads while Time is 1–6. In the 7–10 range you can '
          + 'trade Horseheads for Delights at a net +5 but not the other way round.']),
        h('div', null, ['Cash out at ', h('b', null, ['105']), ' or ', h('b', null, ['176']),
          ' rather than around 140 — the rounding pays better at those two, and alternating '
          + 'them is worth roughly 61.25 Echoes a cycle (about 2.36 EPA).']),
        h('div', null, ['Once ', wikiLink('Offering Tribute to the Court of the Wakeful Eye', 'Tribute'),
          ' is unlocked, always cash in Striped Delights: the flat 5 Tribute is worth about '
          + '12.5 Echoes on its own.']),
        h('div', null, ['Two finished terms unlock ', wikiLink('Host a State Dinner', 'Host a State Dinner'),
          ' at the end of the third, which restores you to the Empress’ Court.']),
      ])),

      h('div', { css: 'margin-top:12px;color:' + UI.dim + ';font-size:11px;line-height:1.6;' }, [
        h('div', null, ['The badge is the option’s ', h('b', null, ['net']),
          ' change in resources, the guide’s own figure. ',
          h('b', null, [PC_LEGIT_SPEND_MARK]), ' means that net is paid for out of Imperial '
          + 'Legitimacy; ', h('b', null, [PC_LEGIT_GAIN_MARK]),
          ' that the line buys Legitimacy back; no mark that it leaves Legitimacy alone. ',
          h('b', null, ['Fate']), ' means it is Fate-locked. The four endings carry what '
          + 'cashing out would pay you ', h('b', null, ['right now']),
          ' — Echoes, from your own Striped Delights and Silver Horseheads off the Myself tab — '
          + 'with ', h('b', null, [PC_FAVOUR_MARK]),
          ' when part of the payout is a faction Favour — a story quality capped at '
          + PC_SOCIETY_CAP + ', which nothing buys, so it counts as 0 — ',
          h('b', null, [PC_STALE_MARK]), ' when the reading behind the figure is over a minute '
          + 'old, and the old ', h('b', null, ['cash out']),
          ' label when your numbers have never been read at all.']),
        h('div', null, ['Colour says the same thing the mark does and nothing else — red for '
          + 'spending Legitimacy, green for buying it back, light blue for leaving it alone, '
          + 'slate for the endings. The mark is the one that always reads.']),
        h('div', null, ['A storylet with two branches is badged with the better net, and both '
          + 'are in its tooltip; open it and each branch is badged in its own right.']),
        h('div', { css: 'margin-top:6px;' }, ['Data from ',
          wikiLink('Port Carnelian (Guide)', 'Port Carnelian (Guide)'), ' on the Fallen London wiki.']),
      ]),
    ]);
  }

  // === panel: Voyages of Scientific Discovery ============================
  //
  // The reference half: how the voyage is unlocked at all, what each island
  // pays and what it costs to get there, the whole action table grouped by
  // phase and island and searchable, and what the pages are finally worth.
  //
  // Like the Port Carnelian panel and unlike the Zailing one it opens with no
  // "your hand, ranked" block: these islands deal no opportunity cards. The one
  // card the voyage adds is The Fleet of Truth, and it is at zee rather than
  // here, so it lives in ZEE_CARDS and the Zailing panel where it belongs.

  const VSD_GROUPS = [
    { key: 'prep', label: 'Preparatory Research — at Your Lodgings, before you sail' },
    { key: 'island:Bullbone Island', label: 'Bullbone Island — Home Waters, pays CN' },
    { key: 'island:Corpsecage Island', label: 'Corpsecage Island — Stormbones, pays AN' },
    { key: 'island:Grunting Fen', label: 'Grunting Fen — The Sea of Voices, pays TN' },
    { key: 'organise', label: 'Organise your Research — at Your Lodgings, spending the pages' },
  ];

  function vsdGroupKey(entry) {
    return entry.phase === 'island' ? 'island:' + entry.island : entry.phase;
  }

  function vsdBadgeNode(entry) {
    return makeBadge(vsdSpec(entry), VSD_CLASS);
  }

  function vsdOptionRow(entry) {
    const row = h('tr', null, [
      h('td', { css: TD }, [
        h('div', null, [wikiLink(entry.branch, entry.branch)]),
        h('div', { css: 'color:' + UI.dim + ';font-size:11px;' }, ['in ', wikiLink(entry.storylet, entry.storylet)]),
        entry.needs
          ? h('div', { css: 'color:' + UI.dim + ';font-size:11px;' }, ['needs ' + entry.needs])
          : null,
      ]),
      h('td', { css: TD + 'white-space:nowrap;color:' + UI.dim + ';' }, [
        entry.orthos
          ? (entry.orthos[0] === entry.orthos[1]
            ? String(entry.orthos[0]) : entry.orthos[0] + '–' + entry.orthos[1])
          : '—',
      ]),
      h('td', { css: TD + 'text-align:center;' }, [vsdBadgeNode(entry)]),
      h('td', { css: TD + 'color:' + UI.dim + ';font-size:11px;white-space:nowrap;' },
        [entry.ch || '—']),
      h('td', { css: TD + 'color:' + UI.dim + ';' }, [
        entry.gain ? h('div', { css: 'color:' + UI.text + ';' }, [entry.gain]) : null,
        entry.cost ? h('div', null, ['costs ' + entry.cost]) : null,
        entry.orElse ? h('div', { css: 'color:#c9a04a;' }, ['or, the game’s choice: ' + entry.orElse]) : null,
        entry.fail ? h('div', null, ['failure: ' + entry.fail]) : null,
        entry.note ? h('div', null, [entry.note]) : null,
      ]),
    ]);
    row.dataset.vsdSearch = [entry.branch, entry.storylet, entry.island || '', entry.ch || '',
      entry.gain || '', entry.cost || '', entry.needs || '', entry.note || '',
      entry.headline || ''].join(' ').toLowerCase();
    return row;
  }

  function renderVsdPanel() {
    const section = function (title, children) {
      return h('div', { css: 'margin-top:14px;' }, [
        h('div', {
          css: 'font:bold 11px ' + UI.font + ';letter-spacing:.06em;text-transform:uppercase;'
            + 'color:' + UI.accent + ';margin-bottom:5px;',
        }, [title]),
        children,
      ]);
    };
    const table = function (heads, rows) {
      return h('table', { css: 'width:100%;border-collapse:collapse;' }, [
        h('thead', null, [h('tr', null, heads.map(function (head) {
          return h('th', { css: TH + (head.right ? 'text-align:right;' : ''), title: head.title || '' }, [head.text]);
        }))]),
        h('tbody', null, rows),
      ]);
    };

    // --- the three currencies, up top -------------------------------------
    const intro = h('div', {
      css: 'margin:10px 0 0;padding:8px 10px;border-left:3px solid ' + UI.accent
        + ';background:' + UI.bgAlt + ';font-size:12px;line-height:1.6;',
    }, [
      h('div', { css: 'color:' + UI.accent + ';font-weight:bold;' }, ['Three kinds of page']),
      h('div', null, VSD_NOTE_KEYS.map(function (key) {
        const note = VSD_NOTES[key];
        return h('div', null, [
          h('span', {
            css: 'display:inline-block;min-width:26px;text-align:center;margin-right:6px;'
              + 'padding:0 4px;border-radius:2px;font:bold 10px arial,sans-serif;'
              + 'line-height:14px;color:#fff;background:' + note.color + ';',
          }, [note.tag]),
          wikiLink(note.name, note.name),
        ]);
      })),
      h('div', { css: 'margin-top:5px;' }, ['The island pages write AN as ',
        h('b', null, ['PAN']), '; it is the same page.']),
      h('div', null, ['A visit is ', h('b', null, [String(VSD_ISLAND_ACTIONS)]),
        ' actions if every challenge passes — 1 to arrive, 19 of carousel, 1 to leave. '
        + 'A failure still moves ', wikiLink('Orthos is Coming!', 'Orthos is Coming!'),
        ', by 1 change point rather than 2, so it lengthens the visit rather than ending '
        + 'it. You cannot leave early, and your outfit is locked — wear Watchful gear.']),
    ]);

    // --- the action table -------------------------------------------------
    const optionRows = [];
    for (const group of VSD_GROUPS) {
      const inGroup = VSD_OPTIONS.filter(function (e) { return vsdGroupKey(e) === group.key; });
      if (!inGroup.length) continue;
      const header = h('tr', null, [h('td', {
        colSpan: 5,
        css: 'padding:8px 8px 3px;font:bold 11px ' + UI.font + ';letter-spacing:.05em;'
          + 'text-transform:uppercase;color:' + UI.dim + ';border-bottom:1px solid ' + UI.line + ';',
      }, [group.label])]);
      header.dataset.vsdGroup = '1';
      optionRows.push(header);
      for (const entry of inGroup) optionRows.push(vsdOptionRow(entry));
    }

    const search = h('input', {
      type: 'text',
      placeholder: 'filter actions, rewards, requirements…',
      css: 'flex:1;min-width:140px;box-sizing:border-box;padding:3px 7px;background:' + UI.bgAlt
        + ';color:' + UI.text + ';border:1px solid ' + UI.line + ';border-radius:3px;font:12px ' + UI.font + ';',
      on: {
        input: function (e) {
          const term = String(e.currentTarget.value || '').trim().toLowerCase();
          for (const row of optionRows) {
            if (row.dataset.vsdGroup) continue;
            row.hidden = !!term && row.dataset.vsdSearch.indexOf(term) === -1;
          }
          let group = null, shown = 0;
          for (const row of optionRows) {
            if (row.dataset.vsdGroup) {
              if (group) group.hidden = shown === 0;
              group = row; shown = 0;
            } else if (!row.hidden) shown++;
          }
          if (group) group.hidden = shown === 0;
        },
      },
    });

    return h('div', { css: 'padding:0 12px 12px;' }, [
      intro,

      section('Getting the voyage at all', h('div', { css: 'color:' + UI.dim + ';font-size:12px;line-height:1.7;' }, [
        h('div', null, ['The Dilmun Club wants: Watchful 120, ',
          wikiLink('A Person of Some Importance', 'A Person of Some Importance'),
          ', Associating with Radical Academics 3, Cultivating an Acquaintance with His '
          + 'Amused Lordship 3, and Featuring in the Tales of the University 30.']),
        h('div', null, ['Then ', wikiLink('A Sneering Gentleman', 'A Sneering Gentleman'),
          ' on Ladybones Road — His Amused Lordship’s valet keeps losing the paperwork. '
          + 'Correcting him costs a Blackmail Material, 2 Books of Hidden Bodies and 5 '
          + 'Extraordinary Implications.']),
        h('div', null, ['Then ', wikiLink('Upstairs at the Bridge Without', 'Upstairs at the Bridge Without'),
          ' in the Bazaar Side-streets, and a ship of your own.']),
        h('div', { css: 'margin-top:5px;' }, ['Once you are Embarking 3, ',
          wikiLink('The Fleet of Truth', 'The Fleet of Truth'),
          ' joins your zee deck — 5 pages of every type. It is in the Zailing panel, '
          + 'with the rest of the deck.']),
      ])),

      section('Which island', h('div', null, [
        table([
          { text: 'Island' },
          { text: 'Region' },
          { text: 'AN', right: true, title: 'Page of Prelapsarian Archaeological Notes available per visit.' },
          { text: 'CN', right: true, title: 'Page of Cryptopalaeontological Notes available per visit.' },
          { text: 'TN', right: true, title: 'Page of Theosophistical Notes available per visit.' },
          { text: 'EPA', right: true, title: 'Echoes per action of the material rewards, not counting the zailing there and back.' },
        ], VSD_ISLANDS.map(function (island) {
          return h('tr', null, [
            h('td', { css: TD }, [
              h('div', null, [wikiLink(island.name, island.name)]),
              island.needs
                ? h('div', { css: 'color:#c9a04a;font-size:11px;' }, ['needs a ', wikiLink(island.needs, island.needs)])
                : null,
            ]),
            h('td', { css: TD + 'color:' + UI.dim + ';' }, [wikiLink(island.region, island.region)]),
          ].concat(VSD_NOTE_KEYS.map(function (key) {
            const lead = island.pays === key;
            return h('td', {
              css: TD + 'text-align:right;'
                + (lead ? 'color:' + VSD_NOTES[key].color + ';font-weight:bold;' : 'color:' + UI.dim + ';'),
            }, [String(island.best[key])]);
          })).concat([
            h('td', { css: TD + 'text-align:right;' }, [island.epa.toFixed(2)]),
          ]));
        })),
        h('div', { css: 'margin-top:5px;color:' + UI.dim + ';font-size:11px;line-height:1.6;' },
          VSD_ISLANDS.map(function (island) {
            return h('div', null, [h('span', { css: 'color:' + UI.text + ';' }, [island.name + ': ']),
              island.note + ' Up to ' + island.echoes.toFixed(2) + ' Echoes a visit.']);
          })),
      ])),

      section('Every action', h('div', null, [
        h('div', { css: 'display:flex;align-items:center;gap:8px;margin-bottom:6px;' }, [search]),
        table([
          { text: 'Action' },
          { text: 'Orthos', title: 'The Orthos is Coming! band this is offered in. There is no such gate on the two Lodgings screens.' },
          { text: '' },
          { text: 'Challenge' },
          { text: 'What else it gives' },
        ], optionRows),
      ])),

      section('Getting the most preparatory research', h('div', { css: 'color:' + UI.dim + ';font-size:12px;line-height:1.7;' }, [
        h('div', null, [h('span', { css: 'color:' + VSD_NOTES.an.color + ';font-weight:bold;' }, ['AN 450: ']),
          'three of any 50-page option and two Examine your collection of curiosities. '
          + 'Also yields 150 of each of the other two.']),
        h('div', null, [h('span', { css: 'color:' + VSD_NOTES.cn.color + ';font-weight:bold;' }, ['CN 400: ']),
          'one Consult your current work, two of any 50-page option, two Test your Unearthly '
          + 'Fossil and one Trade in academic favours. Also yields 140 of each of the others. '
          + 'Swapping the Trade for a third Fossil gives 370 instead — a small loss, and no '
          + 'Connected: Benthic 20 / Summerset 20 to arrange.']),
        h('div', null, [h('span', { css: 'color:' + VSD_NOTES.tn.color + ';font-weight:bold;' }, ['TN 150: ']),
          'three of any 50-page option. Also yields 150 of each of the others.']),
        h('div', { css: 'margin-top:5px;' }, ['The order matters: every option locks itself out '
          + 'above a page count (101 for the cheap ones, 301 for the big single-type ones), so '
          + 'take the 50s first. Finish with any “Enough … research” option to reach Embarking 3.']),
      ])),

      h('div', { css: 'margin-top:12px;color:' + UI.dim + ';font-size:11px;line-height:1.6;' }, [
        h('div', null, ['The badge is what the action pays in ', h('b', null, ['pages']),
          ', coloured by type. An action that pays no pages is ', h('b', null, ['labelled']),
          ' with what it does pay instead rather than scored — pages and Echoes have no '
          + 'exchange rate here, and inventing one would be the badge choosing your voyage '
          + 'for you.']),
        h('div', null, ['On the Organise screen the badge is the guide’s ',
          h('b', null, ['pence per page']), ', which is the figure that separates those '
          + 'rows; the best rate is picked out in gold.']),
        h('div', null, ['The three end-of-visit gambles carry ', h('b', null, ['≈']),
          ' and their ', h('b', null, ['expected']), ' value, not the number they advertise: '
          + 'Tarry a little is worth about six times Cut it fine once the failure is priced in.']),
        h('div', { css: 'margin-top:6px;' }, ['Data from ',
          wikiLink('Embarking on a Voyage of Scientific Discovery (Guide)',
            'Embarking on a Voyage of Scientific Discovery (Guide)'),
          ' and the Expedition Progress table on each island’s own page.']),
      ]),
    ]);
  }

  // === panel: University Laboratory ======================================
  //
  // The live half first -- your Equipment, staff and students, what the project
  // stands at, and what Circulate a draft of your findings would pay right now
  // -- and then the reference half, from University Laboratory (Guide) and its
  // /Tables subpage: every card this feature badges, searchable, the repeatable
  // projects, the equipment ladder and who the experts are good for.

  const LAB_GROUPS = [
    { key: 'brief', label: 'A brief project — under 200 research' },
    { key: 'setup', label: 'Setting up a project of 200 research or more' },
    { key: 'experiment', label: 'The experiment' },
    { key: 'team', label: 'Your team' },
    { key: 'writeup', label: 'Writing up' },
    { key: 'long', label: 'A very long project — 1,200 research and up' },
    { key: 'ideas', label: 'Big ideas' },
    { key: 'students', label: 'Students' },
    { key: 'staff', label: 'Staff' },
    { key: 'parabola', label: 'Parabolan research' },
    { key: 'menace', label: 'Menaces and disgruntled students' },
    { key: 'early', label: 'A new or small laboratory' },
  ];

  // The guide's Repeatable Research table, row for row. `value` is its
  // Expected Lab Reward Value column, as given; `pr` the Parabolan Research.
  const LAB_PROJECTS = [
    { eo: 810, name: 'Disambiguate an Eolith', needs: 'costs an Ambiguous Eolith', research: 10, type: 'Geology',
      gives: 'one at random of Perfumed Gunpowder, Nodule of Trembling Amber, Unprovenanced Artefact, Bloodstained Eolith' },
    { eo: 610, name: 'Discover the background of this bone', needs: 'costs an Unidentified Thigh Bone', research: 25,
      type: 'Palaeontology',
      gives: 'Monstrous Anatomy 3: a Femur of a Jurassic Beast on a success, a Femur of a Surface Deer on a failure' },
    { eo: 610, name: 'Invent a false nature for this bone', needs: 'the second stage of the bone', research: 75, pr: 25,
      type: 'Palaeontology', gives: 'Holy Relic of the Thigh of Saint Fiacre, Record of Successful Forgery +1' },
    { eo: 510, name: 'Analyse your Thorned Ribcage', needs: 'costs a Thorned Ribcage', research: 350, pr: 15,
      type: 'Palaeontology', gives: 'Searing Enigma, Monstrous Anatomy +1 CP, Shapeling Arts +1 CP' },
    { eo: 410, name: 'Study the Focused Albatross', needs: 'Prestige 1; costs a Focused Albatross', research: 100,
      type: 'Biology, Monstrous', gives: 'Albatross Wing 2, Incisive Observation 2', value: 1250 },
    { eo: 820, name: 'Track recent palaeontological discoveries and the stones of the Neath',
      needs: 'Teaching Reputation', research: 100, type: 'Geology', gives: 'Survey of the Neath\'s Bones 25', value: 1250 },
    { eo: 820, name: 'Collate a great number of palaeontological reports', needs: 'Prestige 10, Teaching Reputation',
      research: 2700, type: 'Geology', gives: 'Survey of the Neath\'s Bones 625', value: 31250 },
    { eo: 310, name: 'Create an Infernal Machine',
      needs: 'Equipment 5; costs Nevercold Brass Sliver 250, Bessemer Steel Ingot 5', research: 500, type: 'Machines',
      gives: 'Infernal Machine' },
    { eo: 230, name: 'Create a Cartographer\'s Hoard', needs: 'Equipment 6', research: 2700, type: 'Cartography, Nautical',
      gives: 'Cartographer\'s Hoard', value: 31250 },
    { eo: 1010, name: 'Research an Impossible Theorem', needs: 'Equipment 7', research: 13000, pr: 300,
      type: 'Mathematical', gives: 'Watchful 500: an Impossible Theorem (repeatable); Nightmares +2 CP on a failure' },
    { eo: 1020, name: 'Create a Mirthless Compendium of Statistical Observations',
      needs: 'Teaching Reputation; with under 1 Parabolan Research', research: 100, type: 'Mathematical',
      gives: 'with a Meticulous Student, a Mirthless Compendium; with more Parabolan Research, Hinterland Scrip 20 and Record of Successful Forgery +1',
      value: 1250 },
    { eo: 320, name: 'Research a Devilish Probability Distributor',
      needs: 'Prestige 5; costs Nevercold Brass Sliver 250, Favours: Hell 3', research: 450, type: 'Machines',
      gives: 'Devilish Probability Distributor' },
    { eo: 1050, name: 'Remember an image that has been nagging at you',
      needs: 'started in the Reflection of your Laboratory; Railway progress', research: 450, pr: 15,
      type: 'Mathematical, Red Science, Correspondence',
      gives: 'Artisan of the Red Science +2 CP below base 7; a Searing Enigma at base 7' },
    { eo: 240, name: 'Prepare a set of Glass Gazettes', needs: 'Route: The Reflection of your Laboratory', research: 50,
      pr: 10, type: 'Cartography', gives: 'Glass Gazette 5', value: 1250 },
    { eo: 240, name: 'Fantasize about an atlas of the Is-Not',
      needs: 'started in the Reflection of your Laboratory; Railway progress, Prestige 20, Glasswork 7',
      research: 2500, pr: 65, type: 'Cartography', gives: 'Glass Gazette 125', value: 31250 },
    { eo: 130, name: 'Construct a rifle in historical style', needs: '', research: 100, type: 'Weapons',
      gives: 'Ancient Hunting Rifle', value: 1250 },
    { eo: 130, name: 'Disguise your Ancient Hunting Rifle as a valuable antique',
      needs: 'an optional second stage of the rifle', research: 1650, type: 'Weapons',
      gives: 'Infernal Sharpshooter\'s Rifle, Record of Successful Forgery +1' },
    { eo: 330, name: 'Study the Augmentation Device',
      needs: 'a Highly Illegal Experimental Augmentation Device (Probably) — Whitsun', research: 100,
      type: 'Machines, Red Science', gives: 'Direful Reflection, Artisan of the Red Science +1 CP', value: 1250 },
    { eo: 450, name: 'Dissect the Pinewood Shark', needs: 'costs the Remains of a Pinewood Shark', research: 100,
      type: 'Biology, Monstrous', gives: 'Incisive Observation 2, Fin Bones, Collected 38, Bone Fragments 500', value: 1250 },
    { eo: 460, name: 'Analyse your False-Snake', needs: 'a Preserved False-Snake; Shapeling Arts 2', research: 100,
      type: 'Biology, Toxicological',
      gives: 'Unearthly Fossil, Memory of Distant Shores 20, Kataleptic Toxicology +1 CP', value: 1250 },
    { eo: 520, name: 'Try the Betrayer of Measures on a human ribcage',
      needs: 'the Betrayer of Measures; costs a Human Ribcage', research: 425, type: 'Palaeontology, Red Science',
      gives: 'Artisan of the Red Science 5: a Mammoth Ribcage (repeatable); Artisan +1 CP either way, Nightmares +2 CP on a failure' },
    { eo: 1350, name: 'Study the nature of the Sun-Blazoned Cuirass', needs: 'the Sun-Blazoned Cuirass', research: 550,
      type: 'History, Monstrous', gives: 'Primaeval Hint', value: 6250 },
    { eo: 530, name: 'Try the Betrayer of Measures on Warbler Skeleton',
      needs: 'the Betrayer of Measures; costs a Warbler Skeleton, Nevercold Brass Sliver 1000', research: 425,
      type: 'Palaeontology, Red Science',
      gives: 'Artisan of the Red Science 5: a Skeleton with Seven Necks (repeatable); Artisan +1 CP either way, Nightmares +2 CP on a failure' },
    { eo: 950, name: 'Study the properties of Attar', needs: 'A Vial of Queenly Attar', research: 450, pr: 15,
      type: 'Chemistry, Toxicological', gives: 'Night-Whisper, Kataleptic Toxicology +1 CP', value: 6250 },
    { eo: 1320, name: 'Study the Prelapsarian history of the Red Science',
      needs: 'Artisan Studies 2; costs 10 each of Trace of the First City and Relics of the Second, Third and Fourth City',
      research: 2700, type: 'History, Red Science, Correspondence',
      gives: 'publish for a Dreadful Surmise; or, for 10 of the matching Expertise, Edicts of the First City, a Ray-Drenched Cinder, a Dreadful Surmise or a Cartographer\'s Hoard' },
    { eo: 1340, name: 'Study your Captured Ushabti', needs: 'costs a Captured Ushabti on a success', research: 550,
      type: 'History, Toxicological', gives: 'Primaeval Hint, Tale of Terror!!, Nightmares +1 CP', value: 6250 },
    { eo: 540, name: 'Test the elastic limits of flesh and bone',
      needs: 'costs a Human Arm, a Human Ribcage, Nodule of Deep Amber 100', research: 550, type: 'Palaeontology, Shapeling',
      gives: 'Knotted Humerus, Thorned Ribcage, Withered Tentacle 2, Nodule of Trembling Amber 2, Bone Fragments 2150, Shapeling Arts +1 CP',
      value: 6250 },
    { eo: 260, name: 'Make a cartographical study of the ceiling', needs: 'Firmament 70; costs a Tempestuous Tale',
      research: 550, type: 'Cartography', gives: '25 Roof-Charts and Extraordinary Implications, split by your Firmament',
      value: 6250 },
    { eo: 830, name: 'Study the geochemical properties of Roof drippings', needs: 'costs a Sample of Roof-Drip',
      research: 100, type: 'Geology', gives: 'Tempestuous Tale 5, Extraordinary Implication 4', value: 1250 },
    { eo: 960, name: 'Make a study of a few samples from a Starved citadel', needs: 'costs a Starved Expression',
      research: 550, type: 'Chemistry, Toxicological',
      gives: 'Tempestuous Tale 5, Emetic Revelation 2, Extraordinary Implication 15', value: 6250 },
    { eo: 965, name: 'Study the scents most conducive to romance', needs: 'only during the Feast of the Exceptional Rose',
      research: 550, type: 'Chemistry, Toxicological', gives: 'Captivating Ballad, Burgeoning Romance 2500', value: 6250 },
  ];

  // The guide's Equipment table. Every level but 4 and 9 has a price in
  // Echoes, where the guide gives one; 7 is the most without Fate.
  const LAB_EQUIPMENT = [
    { level: 1, needs: 'Drop of Prisoner\'s Honey 500, Flask of Abominable Salts 5, Bottled Oblivion 5, Venom-Ruby 5, Bottle of Strangling Willow Absinthe 5',
      echoes: 17.5, note: 'at the buy price of Bottled Oblivion' },
    { level: 2, needs: 'Bejewelled Lens, Magnificent Diamond, Nodule of Deep Amber 100', echoes: 71,
      note: 'at the assembly price of the Lens' },
    { level: 2, needs: 'Patent Scrutinizer, Knob of Scintillack 3, Nodule of Deep Amber 590', echoes: 23.7,
      note: 'at the buy price of the Scrutinizer; graduating Shifty Students is the cheap source of Scintillack' },
    { level: 3, needs: 'Memory of Light 100, Phosphorescent Scarab 200', echoes: 70, note: '' },
    { level: 4, needs: 'a Voluminous Library', echoes: null, note: 'also removes the A library of your own card' },
    { level: 5, needs: 'Foxfire Candle Stub 100, Nevercold Brass Sliver 2000, Mourning Candle, Perfumed Gunpowder 50, Hillmover 3',
      echoes: 186, note: 'Hillmovers at 12.5 Echoes and Gunpowder at 2.5' },
    { level: 6, needs: 'First City Coin 700, Devilbone Die, Justificande Coin 10', echoes: 200.9,
      note: 'First City Coins at 0.25 Echoes and Justificande Coins at 2.5' },
    { level: 6, needs: 'The Neathy Tarot, Featuring all 77 of the Major Arcana', echoes: null,
      note: 'a Summer item costing 20 Estival Tokens' },
    { level: 6, needs: 'Devilish Probability Distributor 2, Mirthless Compendium of Statistical Observations 5',
      echoes: 187.5, note: 'at their selling price; far cheaper made yourself, for 1,400 research and a Meticulous Student' },
    { level: 6, needs: 'a certain reward from an Ambition: Heart\'s Desire! ending', echoes: null, note: '' },
    { level: 7, needs: 'Working Rat 10, Albino Rat', echoes: 648, note: 'needs Seeking the Meaning of the Plaster Face 20' },
    { level: 7, needs: 'Working Rat 15, Rattus Faber Bandit-Chief', echoes: 1292,
      note: 'either way also removes the Rat Melancholy card' },
    { level: 9, needs: '10 Fate', echoes: null, note: 'Improve your equipment as much as possible; nothing else besides' },
  ];

  // The guide's Expertise table, with how each is hired.
  const LAB_EXPERTS = [
    { name: 'the Numismatrix', eo: '30, 250, 980; 1301–1600 History', focus: '', pairs: '',
      how: 'your first expert, from the Dean\'s coin commission' },
    { name: 'Lettice, the Mercy', eo: '110–120; 401–500 Biological; 1320', focus: '',
      pairs: 'Gifted Student, April, the Esurient Smith',
      how: 'free if she was your companion at the Feast of the Exceptional Rose' },
    { name: 'F.F. Gebrandt', eo: '901–1000 Chemistry', focus: '', pairs: 'Profound Student',
      how: 'Invite F.F. Gebrandt to Collaborate' },
    { name: 'April', eo: '10; 101–200 Weapons', focus: 'Red Science Focus', pairs: 'Profound Student, Lettice',
      how: 'during Ambition: Bag a Legend!' },
    { name: 'Cora Bagley', eo: '1001–1200 Mathematical', focus: '', pairs: 'Visionary Student',
      how: 'after Ambition: Heart\'s Desire!' },
    { name: 'the Esurient Smith', eo: '101–200 Weapons; 301–400 Engineering', focus: '',
      pairs: 'Profound Student, Lettice', how: 'after Ambition: Nemesis' },
    { name: 'Hephaesta', eo: '201–300 Cartography; 820', focus: 'Nautical Focus', pairs: 'Visionary Student',
      how: 'after Ambition: Light Fingers!' },
    { name: 'the Percipient Cricketer', eo: '', focus: 'Correspondence Focus', pairs: 'Profound Student',
      how: 'Fate — Cricket, Anyone?' },
    { name: 'the Reformed Protester', eo: '101–200 Weapons', focus: '', pairs: '', how: 'Fate — Five Minutes to Midday' },
    { name: 'the Silk-Clad Expert', eo: '401–500 Biological', focus: '', pairs: 'Gifted Student',
      how: 'Fate — Learning from a Silk-Clad Expert' },
    { name: 'the Stoic Classicist', eo: '1301–1600 History', focus: '', pairs: '', how: 'Fate — Tauroktonos' },
    { name: 'the Eldest Daughter', eo: '', focus: 'Toxicological Focus', pairs: '', how: 'Fate — The Frequently Deceased' },
  ];

  function labOptionRow(opt, card, state) {
    const status = labStatus(opt, card, state);
    const detail = [
      labReqWords(opt) ? 'needs ' + labReqWords(opt) : null,
      opt.winAlso ? (opt.ch || opt.luck != null ? 'success: ' : 'gives: ') + opt.winAlso : null,
      opt.rareAlso ? 'rare success: ' + opt.rareAlso : null,
      opt.altAlso ? 'alternative success: ' + opt.altAlso : null,
      opt.fail || opt.failAlso
        ? 'failure: ' + [labOutcomeWords(opt.fail, opt, card, state), opt.failAlso].filter(Boolean).join('; ')
        : null,
      opt.consumes ? 'uses up ' + opt.consumes : null,
      opt.note || null,
    ].filter(Boolean);
    const row = h('tr', null, [
      h('td', { css: TD }, [
        h('div', null, [wikiLink(opt.page || opt.branch, opt.branch)]),
        h('div', { css: 'color:' + UI.dim + ';font-size:11px;' }, ['on ', wikiLink(card.name, card.name)]),
      ]),
      h('td', { css: TD + 'text-align:center;' }, [makeBadge(labOptionSpec(opt, card, state), LAB_CLASS)]),
      h('td', { css: TD + 'color:' + UI.dim + ';font-size:11px;' }, [
        opt.luck != null ? 'Luck ' + Math.round(opt.luck * 100) + '%' : (opt.ch || '—'),
        status === 'shut' ? h('div', { css: 'color:#c98a8a;' }, ['not open to you']) : null,
      ]),
      h('td', { css: TD + 'color:' + UI.dim + ';font-size:11px;' }, detail.map(function (line) {
        return h('div', null, [line]);
      })),
    ]);
    row.dataset.labSearch = [opt.branch, card.name, opt.ch || '', opt.gate || '', opt.winAlso || '',
      opt.rareAlso || '', opt.failAlso || '', opt.consumes || '', opt.note || '', opt.label || '']
      .join(' ').toLowerCase();
    return row;
  }

  function renderLabPanel(ctx) {
    const state = labState();
    const q = state.q;
    let busy = false;
    if (ctx && autoRefreshEnabled() && (state.stale || state.itemsStale)) {
      busy = true;
      refreshBackgroundState().then(function () { ctx.rerender(); });
    }

    const section = function (title, children) {
      return h('div', { css: 'margin-top:14px;' }, [
        h('div', {
          css: 'font:bold 11px ' + UI.font + ';letter-spacing:.06em;text-transform:uppercase;'
            + 'color:' + UI.accent + ';margin-bottom:5px;',
        }, [title]),
        children,
      ]);
    };
    const table = function (heads, rows) {
      return h('div', { css: 'overflow-x:auto;' }, [
        h('table', { css: 'width:100%;border-collapse:collapse;' }, [
          h('thead', null, [h('tr', null, heads.map(function (head) {
            return h('th', { css: TH + (head.right ? 'text-align:right;' : ''), title: head.title || '' }, [head.text]);
          }))]),
          h('tbody', null, rows),
        ]),
      ]);
    };
    const dash = function (v) { return v == null ? '–' : String(v); };
    const stat = function (label, value, title) {
      return h('div', { title: title || '', css: 'min-width:80px;' }, [
        h('div', { css: 'color:' + UI.dim + ';font-size:10px;letter-spacing:.05em;text-transform:uppercase;' }, [label]),
        h('div', { css: 'color:' + UI.text + ';font-size:14px;font-weight:bold;' }, [value]),
      ]);
    };

    // --- your laboratory ----------------------------------------------------
    const students = LAB_STUDENTS.filter(function (s) { return q[s.quality]; })
      .map(function (s) { return s.name + ' ' + q[s.quality]; });
    const staff = LAB_STAFF.filter(function (s) { return q[s.quality]; }).map(function (s) { return s.name; });
    const items = state.items;
    const refresh = h('button', {
      type: 'button', textContent: busy ? 'Refreshing…' : 'Refresh', disabled: busy,
      css: 'padding:2px 8px;background:' + UI.bgAlt + ';color:' + UI.text + ';border:1px solid ' + UI.line
        + ';border-radius:3px;font:11px ' + UI.font + ';cursor:pointer;',
      on: {
        click: function (e) {
          const button = e.currentTarget;
          button.textContent = 'Refreshing…';
          button.disabled = true;
          refreshBackgroundState().then(function () { if (ctx) ctx.rerender(); });
        },
      },
    });
    const auto = h('label', { css: 'color:' + UI.dim + ';font-size:11px;' }, [
      h('input', {
        type: 'checkbox', checked: autoRefreshEnabled(),
        on: { change: function (e) { setAutoRefresh(!!e.currentTarget.checked); } },
      }),
      ' auto',
    ]);

    const draft = labDraft(q[LAB_Q.research], q[LAB_Q.required], items.result);
    const collated = state.itemsRead ? labCollated(items) : null;
    const toGo = draft != null ? q[LAB_Q.required] - q[LAB_Q.research] - draft : null;

    const labBlock = h('div', {
      css: 'margin:10px 0 0;padding:8px 10px;border-left:3px solid ' + UI.accent
        + ';background:' + UI.bgAlt + ';font-size:12px;line-height:1.6;',
    }, [
      h('div', { css: 'color:' + UI.accent + ';font-weight:bold;' }, ['Your laboratory']),
      state.read ? null : h('div', { css: 'color:' + UI.dim + ';' },
        ['Not read yet. Open the Myself tab once, or press Refresh, and every figure here is your own.']),
      h('div', { css: 'display:flex;flex-wrap:wrap;gap:8px 16px;margin:4px 0;' }, [
        stat('Equipment', dash(q[LAB_Q.equipment]), 'Equipment for Scientific Experimentation — what most options scale with'),
        stat('Workers', dash(q[LAB_Q.workers])),
        stat('Top level', dash(state.high), 'The highest worker level the team options multiply by'),
        stat('Prestige', dash(q[LAB_Q.prestige])),
        stat('Project', dash(q[LAB_Q.eo]), 'Experimental Object'),
        stat('Research', q[LAB_Q.research] == null ? '–' : q[LAB_Q.research] + ' / ' + dash(q[LAB_Q.required])),
        stat('Disgruntled', dash(q[LAB_Q.disgruntlement]), 'Disgruntlement among the Students'),
      ]),
      h('div', null, ['Students: ', students.length ? students.join(', ') : (state.read ? 'none' : '–')]),
      h('div', null, ['Staff: ', staff.length ? staff.join(', ') : (state.read ? 'none of the ones transcribed here' : '–')]),
      h('div', null, [
        'In hand: ',
        state.itemsRead
          ? [dash(items.epiphany) + ' Unavoidable Epiphanies', dash(items.idea) + ' Unwise Ideas',
            dash(items.result) + ' Unexpected Results', dash(items.connection) + ' Unlikely Connections'].join(', ')
          : 'Possessions not read yet',
      ]),
      h('div', { css: 'margin-top:5px;color:' + UI.text + ';' }, [
        draft != null
          ? ['Circulate a draft of your findings would pay about ', h('b', null, [String(draft)]),
            ' research now', toGo <= 0 ? ' — enough to finish the project.' : ', leaving ' + toGo + ' to go.']
          : 'Circulate a draft of your findings: needs your research, the project\'s size and your Unexpected Results read.',
      ]),
      collated != null && q[LAB_Q.eo]
        ? h('div', null, ['What you hold now would turn into ', h('b', null, [String(collated)]),
          ' Volume' + (collated === 1 ? '' : 's') + ' of Collated Research when the project is tidied away.'])
        : null,
      h('div', { css: 'display:flex;align-items:center;gap:8px;margin-top:5px;color:' + UI.dim + ';font-size:11px;' }, [
        refresh, auto,
        h('span', null, ['Myself ' + (state.read ? (state.live ? 'on screen' : ageText(state.at)) : 'never read')
          + ' · Possessions ' + (state.itemsRead ? (state.itemsStale ? 'over a minute old' : 'fresh') : 'never read')]),
      ]),
    ]);

    // --- cards on screen ---------------------------------------------------
    const seen = new Map();
    eachCardName(function (host, name) {
      const card = labCardFor(name);
      if (card && !seen.has(card.name)) seen.set(card.name, card);
    });
    const hand = Array.from(seen.values());
    const handBlock = hand.length
      ? h('div', {
          css: 'margin:10px 0 0;padding:8px 10px;border-left:3px solid ' + UI.accent
            + ';background:' + UI.bgAlt + ';font-size:12px;line-height:1.6;',
        }, [
          h('div', { css: 'color:' + UI.accent + ';font-weight:bold;' },
            [hand.length === 1 ? '1 laboratory card on screen' : hand.length + ' laboratory cards on screen']),
          hand.map(function (card) {
            return h('div', null, [makeBadge(labCardSpec(card, state), LAB_CLASS),
              h('span', { css: 'margin-left:6px;' }, [card.name])]);
          }),
        ])
      : null;

    // --- every card --------------------------------------------------------
    const optionRows = [];
    for (const group of LAB_GROUPS) {
      const cards = LAB_CARDS.filter(function (c) { return c.group === group.key; });
      if (!cards.length) continue;
      const header = h('tr', null, [h('td', {
        colSpan: 4,
        css: 'padding:8px 8px 3px;font:bold 11px ' + UI.font + ';letter-spacing:.05em;'
          + 'text-transform:uppercase;color:' + UI.dim + ';border-bottom:1px solid ' + UI.line + ';',
      }, [group.label])]);
      header.dataset.labGroup = '1';
      optionRows.push(header);
      for (const card of cards) {
        for (const opt of card.opts) optionRows.push(labOptionRow(opt, card, state));
      }
    }
    const search = h('input', {
      type: 'text',
      placeholder: 'filter cards, options, rewards…',
      css: 'flex:1;min-width:140px;box-sizing:border-box;padding:3px 7px;background:' + UI.bgAlt
        + ';color:' + UI.text + ';border:1px solid ' + UI.line + ';border-radius:3px;font:12px ' + UI.font + ';',
      on: {
        input: function (e) {
          const term = String(e.currentTarget.value || '').trim().toLowerCase();
          for (const row of optionRows) {
            if (row.dataset.labGroup) continue;
            row.hidden = !!term && row.dataset.labSearch.indexOf(term) === -1;
          }
          let group = null, shown = 0;
          for (const row of optionRows) {
            if (row.dataset.labGroup) {
              if (group) group.hidden = shown === 0;
              group = row; shown = 0;
            } else if (!row.hidden) shown++;
          }
          if (group) group.hidden = shown === 0;
        },
      },
    });

    const prose = function (lines) {
      return h('div', { css: 'color:' + UI.dim + ';font-size:12px;line-height:1.7;' }, lines.map(function (line) {
        return h('div', null, [].concat(line));
      }));
    };

    return h('div', { css: 'padding:0 12px 12px;' }, [
      labBlock,
      handBlock,

      section('Every card', h('div', null, [
        h('div', { css: 'display:flex;align-items:center;gap:8px;margin-bottom:6px;' }, [search]),
        table([
          { text: 'Option' },
          { text: '', title: 'What it pays at your Equipment. Hover or tap for the whole of it.' },
          { text: 'Challenge' },
          { text: 'Needs, and what else it does' },
        ], optionRows),
      ])),

      section('Getting the most out of a project', prose([
        ['Fill every worktable. With fewer than 3 people in the lab, ', wikiLink('Washing Up', 'Washing Up'),
          ', Unpacking crates, Filing a report for the Dean and Work with your Equipment crowd the deck; '
          + 'with 3 or more, Directing your Team takes their place.'],
        'Raise your Equipment above all else: nearly every figure here grows with it, and 7 is the most '
          + 'without Fate.',
        ['Spend ', wikiLink('Unavoidable Epiphany', 'Unavoidable Epiphanies'), ' on 18 + 3 × Equipment — Eureka! '
          + 'or a level 5 student\'s Follow up a hunch. ', wikiLink('Unwise Idea', 'Unwise Ideas'),
          ' pay 20 research each, all at once, for a change point of a menace each. ',
          wikiLink('Unlikely Connection', 'Unlikely Connections'), ' let an expert work outside their field. ',
          wikiLink('Research Preparations', 'Research Preparations'), ' lower most Watchful checks for the rest of the project.'],
        'Anything left over when the project ends becomes Volumes of Collated Research: 0.6 per Epiphany or Unwise '
          + 'Idea and 0.2 per Unlikely Connection or Unexpected Result, rounded down. Leftover research does not count.',
        'Write Up Your Findings is best played late: Circulate a draft of your findings pays for the share of '
          + 'the project already done, plus your Unexpected Results, which it uses up.',
      ])),

      section('Students', prose([
        'Levels 1–2, 3–4 and 5 each open a different option on the student\'s card, and a level 5 student is '
          + 'where the research is. Graduating one raises Teaching Reputation, which opens the better students.',
        'The guide\'s route: Shifty Students until Meticulous ones open, Meticulous until Gifted, then one of each; '
          + 'swap the Gifted for a Profound Student when those open.',
        ['A level 5 student\'s rare successes raise ', wikiLink('Disgruntlement among the Students', 'Disgruntlement'),
          '. At 4 Student Complaints joins the deck; at 6 Student Fury, which costs 200 research. Graduating any '
          + 'student clears at least 21 CP of it, and a lone Visionary Student left to their own devices never raises it.'],
      ])),

      section('Repeatable projects', table([
        { text: '#', title: 'Experimental Object' },
        { text: 'Project' },
        { text: 'Research', right: true, title: 'Laboratory Research, plus Parabolan Research where it needs any' },
        { text: 'Needs' },
        { text: 'Gives' },
      ], LAB_PROJECTS.map(function (p) {
        return h('tr', null, [
          h('td', { css: TD + 'color:' + UI.dim + ';' }, [String(p.eo)]),
          h('td', { css: TD }, [wikiLink(p.name, p.name),
            h('div', { css: 'color:' + UI.dim + ';font-size:11px;' }, [p.type])]),
          h('td', { css: TD + 'text-align:right;white-space:nowrap;' }, [
            String(p.research), p.pr ? h('div', { css: 'color:' + UI.dim + ';font-size:11px;' }, ['+ PR ' + p.pr]) : null,
          ]),
          h('td', { css: TD + 'color:' + UI.dim + ';font-size:11px;' }, [p.needs || '—']),
          h('td', { css: TD + 'font-size:11px;' }, [p.gives,
            p.value ? h('div', { css: 'color:' + UI.dim + ';' }, ['Expected Lab Reward Value ' + p.value]) : null]),
        ]);
      }))),

      section('Equipment', table([
        { text: 'Level' },
        { text: 'Needs' },
        { text: 'Echoes', right: true, title: 'The guide\'s estimate of what it costs' },
      ], LAB_EQUIPMENT.map(function (e) {
        return h('tr', null, [
          h('td', { css: TD }, [String(e.level)]),
          h('td', { css: TD + 'font-size:11px;' }, [e.needs,
            e.note ? h('div', { css: 'color:' + UI.dim + ';' }, [e.note]) : null]),
          h('td', { css: TD + 'text-align:right;' }, [e.echoes == null ? '—' : String(e.echoes)]),
        ]);
      }))),

      section('Experts', table([
        { text: 'Expert' },
        { text: 'Projects', title: 'Experimental Object ranges they are good for' },
        { text: 'Works with' },
        { text: 'Hired' },
      ], LAB_EXPERTS.map(function (x) {
        return h('tr', null, [
          h('td', { css: TD }, [x.name]),
          h('td', { css: TD + 'font-size:11px;' }, [[x.eo, x.focus].filter(Boolean).join('; ') || '—']),
          h('td', { css: TD + 'color:' + UI.dim + ';font-size:11px;' }, [x.pairs || '—']),
          h('td', { css: TD + 'color:' + UI.dim + ';font-size:11px;' }, [x.how]),
        ]);
      }))),

      h('div', { css: 'margin-top:12px;color:' + UI.dim + ';font-size:11px;line-height:1.6;' }, [
        h('div', null, ['A card\'s badge is the ', h('b', null, ['research']), ' the best option on it pays on a '
          + 'success, at your Equipment, among the options you can take with nothing special in hand. An option '
          + 'behind an item is left out and marked ', h('b', null, [LAB_MARK_HIDDEN]), '; the rest of the marks are in every tooltip.']),
        h('div', null, [LAB_LEGEND]),
        h('div', null, ['Not transcribed: the ambition and Fate-locked experts\' cards, the Correspondence, '
          + 'Secret College and Long-Dead Priests cards, and the focus cards of particular projects.']),
        h('div', { css: 'margin-top:6px;' }, ['Data from each card\'s and option\'s own page on the wiki, and from ',
          wikiLink('University Laboratory (Guide)', 'University Laboratory (Guide)'),
          ' and its Tables page for the reference tables. Where the guide and an option page disagree, the page is used.']),
      ]),
    ]);
  }

  // === panel: Fruits of the Zee ==========================================
  //
  // The checklist half of the festival work, and the reason the badges can say
  // "you still need this": what the festival has to give, and which of it you
  // already hold.
  //
  // It reads the same two pages the Factions panel does and through the same
  // plumbing -- qualities off the Myself tab, items off Possessions, both
  // banked in localStorage and refreshable in a hidden frame -- so opening
  // this panel from the middle of a dive still has something to say. Every
  // reading is labelled with its age, and an item whose ownership can't be
  // established is a dash, never a "no". Thalassic Favour is a QUALITY, not an
  // item, which is why it comes from the first scrape and not the second.

  const FOTZ_CACHE_KEY = 'fl-ux-fotz';
  const COUNTS_KEY = 'fl-ux-item-counts';

  // Bumped whenever anything the badges depend on is re-banked. `fotzHoldings`
  // is called once per card per scan, so it memoises on this rather than
  // re-parsing a few hundred cached item names on every DOM mutation.
  let fotzGen = 0;

  // The festival's own qualities, off a Myself scrape. Same rule as the
  // factions scrape: FL doesn't render a quality you have none of, so absent
  // means 0 -- but only while the tab's search box is empty, because a
  // filtered list makes absent mean "not on screen" instead.
  function fotzFromQualities(scan) {
    const values = {};
    const zeroIsSafe = !scan.filtered;
    for (const name of FOTZ_QUALITIES) {
      const q = scan.values.get(name);
      if (q) values[name] = q.level;
      else if (zeroIsSafe) values[name] = 0;
    }
    return values;
  }

  function bankFotzQualities(scan) {
    if (!scan) return false;
    const values = fotzFromQualities(scan);
    if (!Object.keys(values).length) return false;
    saveCache(FOTZ_CACHE_KEY, {
      v: 1, at: Date.now(), character: characterName() || null,
      partial: scan.filtered, values: values,
    });
    fotzGen++;
    return true;
  }

  // `held` is readPossessionCounts' Map. Stored as an array of pairs, since a
  // Map doesn't survive JSON.
  function bankItemCounts(held) {
    if (!held || !held.size) return false;
    const rows = [];
    held.forEach(function (rec, key) { rows.push([key, rec.name, rec.count]); });
    saveCache(COUNTS_KEY, {
      v: 2, at: Date.now(), character: characterName() || null, held: rows,
    });
    fotzGen++;
    return true;
  }

  // The counterpart of `captureFactionState`: watch for the two tabs going by
  // and bank what they say. Separate from it, and with its own signature, so
  // the factions plumbing stays exactly as it was.
  let lastFotzSig = null;
  function captureFotzState() {
    const items = document.querySelectorAll('li.quality-item');
    const owned = document.querySelectorAll(OWNED_MARKER);
    if (!items.length && !owned.length) { lastFotzSig = null; return; }
    const search = document.querySelector('input.input--item-search');
    const sig = items.length + '/' + owned.length + '|' + (search ? search.value : '');
    if (sig === lastFotzSig) return;
    lastFotzSig = sig;
    if (items.length) {
      const scan = readQualities();
      bankFotzQualities(scan);
      // The Port Carnelian purse rides along on the same scrape rather than
      // paying for a third pass over a few hundred quality rows. One reader,
      // three consumers.
      bankPcQualities(scan);
      bankLabQualities(scan);
    }
    if (owned.length) bankItemCounts(readPossessionCounts());
  }

  function loadCounts() {
    // Version 2, for the reason ITEMS_KEY is: the keys changed under it.
    const rec = loadCache(COUNTS_KEY, 2);
    if (!rec || !Array.isArray(rec.held)) return null;
    const held = new Map();
    for (const row of rec.held) held.set(row[0], { name: row[1], count: row[2] });
    return { at: rec.at, held: held };
  }

  // Everything this panel shows, live where it can be and banked where it
  // can't. Any field may be missing; the renderer draws a dash for it. Field
  // names match the factions state so `stateIsFresh` covers both.
  function readFotzState() {
    let qualities = null;
    const scan = readQualities();
    if (scan) {
      const values = fotzFromQualities(scan);
      if (Object.keys(values).length) {
        qualities = {
          live: true, at: Date.now(), character: characterName(),
          partial: scan.filtered, values: values,
        };
      }
    }
    if (!qualities) {
      const rec = loadCache(FOTZ_CACHE_KEY, 1);
      if (rec) {
        qualities = {
          live: false, at: rec.at, character: rec.character,
          partial: !!rec.partial, values: rec.values,
        };
      }
    }

    let items = null;
    const live = readPossessionCounts();
    if (live && live.size) {
      items = { live: true, at: Date.now(), held: live };
    } else {
      const rec = loadCounts();
      if (rec) items = { live: false, at: rec.at, held: rec.held };
    }

    if (!qualities && !items) return null;
    return {
      live: !!(qualities && qualities.live),
      at: qualities ? qualities.at : null,
      character: (qualities && qualities.character) || null,
      partial: !!(qualities && qualities.partial),
      values: new Map(Object.entries((qualities && qualities.values) || {})),
      itemsLive: !!(items && items.live),
      itemsAt: items ? items.at : null,
      held: items ? items.held : null,
    };
  }

  // What the BADGES need, and nothing more: can we answer "do you have this?"
  // and "have you met the Bride?". Null means we cannot, and the badge then
  // says so rather than guessing.
  let holdingsMemo = null;
  function fotzHoldings() {
    if (holdingsMemo && holdingsMemo.gen === fotzGen) return holdingsMemo.value;
    let value = null;
    try {
      value = buildFotzHoldings();
    } catch (e) {
      value = null;
    }
    holdingsMemo = { gen: fotzGen, value: value };
    return value;
  }

  function buildFotzHoldings() {
    const live = readPossessionCounts();
    const items = (live && live.size) ? { held: live } : loadCounts();
    if (!items) return null;
    const held = items.held;
    // The Bride is an Accomplishment, so it comes off the quality scrape, not
    // possessions -- and an unreadable one has to stay false rather than
    // become an unknown, or the storylet at the bottom of the trench would
    // never get a mark at all. It errs towards "go and do it". Confirmed
    // in-game by the author on 2026-09-06, once `parseQualityItem` learned to
    // read a quality that states no level.
    let bride = false;
    const scan = readQualities();
    if (scan) {
      const q = scan.values.get(FOTZ_BRIDE_QUALITY);
      if (q && q.level > 0) bride = true;
    } else {
      const rec = loadCache(FOTZ_CACHE_KEY, 1);
      if (rec && rec.values && rec.values[FOTZ_BRIDE_QUALITY] > 0) bride = true;
    }
    return {
      has: function (name) { return held.has(itemKey(name)); },
      count: function (name) {
        const rec = held.get(itemKey(name));
        return rec ? rec.count : 0;
      },
      bride: bride,
      sig: String(fotzGen),
    };
  }

  // --- the collection ----------------------------------------------------
  //
  // One flat row per collectable thing, grouped for display. `count` is
  // whether the row belongs in the "you are missing N of M" headline: the
  // Fate-only items don't (they cost money, not actions), the ships don't (you
  // can only own one at a time), and the Nodule of Fecund Amber doesn't until
  // you already hold the Litter-Cyst it is the consolation prize for.
  //
  // `held` is true / false / null, and null is a real answer meaning "your
  // Possessions have never been read". Pure apart from the state it is handed,
  // so the arithmetic in the headline is testable.
  function fotzCollection(state) {
    const held = state && state.held;
    const holds = function (name) {
      if (!held) return null;
      return held.has(itemKey(name));
    };
    const countOf = function (name) {
      if (!held) return null;
      const rec = held.get(itemKey(name));
      return rec ? rec.count : 0;
    };
    const quality = function (name) {
      const v = state && state.values ? state.values.get(name) : undefined;
      return typeof v === 'number' ? v : null;
    };

    const favour = quality('Thalassic Favour');
    const sights = quality('Sights at the Festival');
    const bandOf = function (value) {
      if (value == null) return null;
      for (let i = 0; i < FOTZ_BANDS.length; i++) {
        if (value >= FOTZ_BANDS[i].lo && value <= FOTZ_BANDS[i].hi) return i;
      }
      return null;
    };
    const sightsBand = bandOf(sights);

    const groups = [];

    // 1. The coral equipment: the year's actual prize, and the only part of
    //    the collection where the game tells you exactly how to get the piece
    //    you are missing.
    groups.push({
      key: 'coral',
      title: 'Coral equipment',
      hint: 'Dive for the coral in week one, break it open in week two. Each coral becomes '
        + 'one of three items — and the three are mechanically IDENTICAL, differing only in '
        + 'name and description, so holding any one of them is the whole prize. They are '
        + 'counted that way here: one item per coral, not three.',
      corals: FOTZ_CORALS.map(function (coral) {
        const inHand = countOf(coral.coral);
        // ONE row per coral, not one per variant. The three versions of a
        // coral item have the same stats and the same slot; only the name and
        // the flavour differ, so collecting all three is a matter of taste
        // rather than of getting anything. Counting them as three would put
        // ten items nobody needs into the "missing" headline.
        //
        // `which` is which of the three you actually hold, kept for display:
        // the variant detail is still worth SHOWING, it is just not worth
        // COUNTING. A coral whose items are not published yet has no names to
        // check at all, so it stays unknown rather than missing.
        const which = coral.variants
          ? coral.variants.filter(function (name) { return holds(name) === true; })
          : [];
        const have = !coral.variants ? null
          : (held ? which.length > 0 : null);
        return {
          coral: coral,
          inHand: inHand,
          pending: !coral.variants,
          which: which,
          rows: [{
            name: coral.slot,
            slot: coral.slot,
            coralName: coral.coral,
            held: have,
            count: true,
            variants: coral.variants,
            which: which,
            pending: !coral.variants,
            // "Do this now": you are holding the coral and have none of the
            // three items. Which of them you would get no longer matters, so
            // this no longer waits on Sights sitting in a particular band --
            // any band pays out something you don't have.
            ready: have === false && !!inHand,
            how: coral.variants
              ? 'Dive a ' + coral.coral + ' off ' + coral.card + ', then break it open in '
                + 'week two. Any of the three is the same item mechanically; Sights at the '
                + 'Festival decides which name you get.'
              : coral.pending,
            note: coral.variants ? null : coral.pending,
            fate: coral.fate,
            bis: coral.bis,
          }],
        };
      }),
    });

    // 2. Equipment from festivals past: dive for it, or buy it back cheaper
    //    than the trade-in value at the stalls.
    groups.push({
      key: 'dive',
      title: 'Equipment from festivals past',
      hint: 'Only these six turn up while diving. Buying one at the stalls always '
        + 'costs less Favour than trading a spare one in pays, so dive first.',
      rows: FOTZ_EQUIPMENT.map(function (item) {
        const have = holds(item.name);
        return {
          name: item.name,
          slot: item.slot,
          held: have,
          count: true,
          spare: countOf(item.name) == null ? null : Math.max(0, countOf(item.name) - 1),
          spareEach: item.favour,
          ready: have === false && favour != null && favour >= item.stall,
          how: 'Dive to depth ' + (item.depths[0] === item.depths[1]
            ? item.depths[0] : item.depths[0] + '–' + item.depths[1])
            + ' and take it off ' + item.card + ', or buy it at the Island Stalls for '
            + item.stall + ' Favour.',
          favour: item.stall,
          fate: item.fate,
          bis: item.bis,
          note: item.note,
        };
      }),
    });

    // 3. The stalls: week two, Favour only, nothing here can be dived up.
    groups.push({
      key: 'stall',
      title: 'Island Stalls only',
      hint: 'Week two, for Thalassic Favour. None of these can be dived for.',
      rows: FOTZ_STALL.map(function (item) {
        const have = holds(item.name);
        return {
          name: item.name,
          slot: item.slot,
          held: have,
          count: true,
          ready: have === false && favour != null && favour >= item.favour,
          how: item.favour + ' Favour at the Island Stalls.',
          favour: item.favour,
          fate: item.fate,
          bis: item.bis,
          note: item.note,
        };
      }),
    });

    // 4. The bottom of the trench.
    groups.push({
      key: 'bride',
      title: 'The Pentamerous Bride',
      hint: 'Dive all the way down, take no treasure, and beg audience. The '
        + 'Accomplishment is what the King-in-Coral pays out on in week two.',
      rows: FOTZ_BRIDE_ITEMS.map(function (item, i) {
        const have = holds(item.name);
        // The Amber is what you get INSTEAD of the Litter-Cyst, so it is only
        // part of the collection once the Cyst is already yours.
        const applies = i === 0 || holds(FOTZ_BRIDE_ITEMS[0].name) === true;
        return {
          name: item.name,
          slot: item.slot,
          held: have,
          count: i === 0,
          dim: !applies,
          how: item.how,
          bis: item.bis,
          note: item.note,
        };
      }),
    });

    // 5. The ships. Listed, never counted -- one ship at a time.
    groups.push({
      key: 'ships',
      title: 'Festival ships',
      hint: 'Traded for your current ship plus 500–1920 Favour. Trading in a '
        + 'Zubmarine, a Majestic Pleasure Yacht or another festival ship brings every '
        + 'one of them down to 500. Not counted below: you can only have one ship.',
      rows: FOTZ_SHIPS.map(function (ship) {
        return {
          name: ship.name,
          slot: 'Ship',
          held: holds(ship.name),
          count: false,
          how: 'Trade your current ship plus 500–1920 Favour to the Green-Gilled '
            + 'Shipwright. Replaces ' + ship.peer + '.',
          fate: ship.fate,
          note: ship.note,
        };
      }),
    });

    // 6. Fate. Listed for completeness, never counted.
    groups.push({
      key: 'fate',
      title: 'Fate only',
      hint: 'From the King-in-Coral’s Hoard, for Fate rather than Favour. Not counted '
        + 'below — and several are obtainable elsewhere for nothing.',
      rows: FOTZ_FATE_ITEMS.map(function (item) {
        return {
          name: item.name,
          slot: item.slot,
          held: holds(item.name),
          count: false,
          how: item.fate ? item.fate + ' Fate.' : 'Fate, at the Hoard.',
          fate: item.fate,
          note: item.note,
        };
      }),
    });

    // The headline. Only `count` rows, and an unknown is neither missing nor
    // held -- it is counted as unknown and said so, because "you are missing
    // 28 of 28" would be a lie told to someone who simply hasn't opened
    // Possessions yet.
    let total = 0;
    let missing = 0;
    let unknown = 0;
    const wanted = [];
    for (const group of groups) {
      const rows = group.rows || group.corals.reduce(function (all, c) {
        return all.concat(c.rows);
      }, []);
      for (const row of rows) {
        if (!row.count) continue;
        total++;
        if (row.held === false) { missing++; wanted.push(row); }
        else if (row.held == null) unknown++;
      }
    }

    return {
      groups: groups,
      total: total,
      missing: missing,
      unknown: unknown,
      wanted: wanted,
      ready: wanted.filter(function (r) { return r.ready; }),
      favour: favour,
      sights: sights,
      sightsBand: sightsBand,
      devotion: quality('Fivefold Devotion'),
      // How many corals are still worth DIVING FOR. It is one of the two
      // numbers that decide how much Devotion is worth raising, so it comes
      // out of the collection rather than being counted again in the renderer.
      // An unreadable Possessions list leaves it null, and the advice then
      // falls back to the Favour case rather than inventing a count -- there
      // is no honest answer to "how many do you need" when we cannot tell what
      // you have.
      //
      // **A coral already in your hold does not count** (fixed 2026-09-04, on
      // a report that the advice kept saying depth 1 to someone carrying one
      // of each). One coral becomes one item and the three items are
      // mechanically identical, so a second coral of the same kind is a
      // duplicate of a duplicate: there is nothing left to dive for once you
      // are carrying one, whether or not week two has opened and let you break
      // it. That goes for the `pending` coral too -- its items are unpublished
      // and so can never read as held, but the coral itself reads perfectly
      // well, and it is the coral you dive for.
      coralsWanted: !held ? null : groups[0].corals.filter(function (entry) {
        if (entry.inHand) return false;
        return entry.pending || entry.rows[0].held === false;
      }).length,
      // The dive-only equipment you have not got, by name. `held` is null for
      // an unread Possessions list, which is NOT the same as missing, so only
      // an explicit false counts.
      itemsWanted: !held ? [] : (groups.filter(function (g) { return g.key === 'dive'; })[0]
        .rows.filter(function (row) { return row.held === false; })
        .map(function (row) { return row.name; })),
    };
  }

  // What your treasures would fetch at the Fruit Market, and what your spare
  // equipment would. Both vanish when the festival ends (equipment aside,
  // which now survives), so this is the "cash in before it's gone" number.
  function fotzLedger(state) {
    const held = state && state.held;
    const countOf = function (name) {
      if (!held) return null;
      const rec = held.get(itemKey(name));
      return rec ? rec.count : 0;
    };
    const rows = [];
    let total = 0;
    for (const treasure of FOTZ_TREASURES) {
      const n = countOf(treasure.name);
      if (!n) continue;
      total += n * treasure.favour;
      rows.push({ name: treasure.name, each: treasure.favour, count: n,
        subtotal: n * treasure.favour, note: treasure.note });
    }
    const spares = [];
    for (const item of FOTZ_EQUIPMENT) {
      const n = countOf(item.name);
      if (n == null || n < 2) continue;
      const extra = n - 1;
      total += extra * item.favour;
      spares.push({ name: item.name, each: item.favour, count: extra,
        subtotal: extra * item.favour });
    }
    return { rows: rows, spares: spares, total: total, known: !!held };
  }

  // --- rendering ---------------------------------------------------------

  const FOTZ_PIP_HELD = '◆';
  const FOTZ_PIP_MISSING = '◇';
  const FOTZ_PIP_UNKNOWN = '–';

  // Same three-state rule as the factions pips: filled when you have it,
  // hollow when you don't, a dash when there is no source for the answer. A
  // hollow pip you could act on RIGHT NOW is promoted to a filled "!" in the
  // ready colour, which is the one thing this panel exists to point at.
  function fotzPip(row) {
    if (row.held == null) {
      return h('span', {
        title: 'Not known — your Possessions have not been read yet.',
        css: 'color:' + UI.dim + ';font-size:13px;',
      }, [FOTZ_PIP_UNKNOWN]);
    }
    if (row.held) {
      return h('span', {
        title: 'You have this.',
        css: 'color:' + UI.accent + ';font-size:13px;',
      }, [FOTZ_PIP_HELD]);
    }
    if (row.ready) {
      return h('span', {
        title: 'You can get this right now.',
        css: 'display:inline-block;color:#17190c;background:' + COLOR_READY
          + ';border-radius:3px;padding:0 5px;font-weight:bold;',
      }, ['!']);
    }
    return h('span', {
      title: 'You do not have this yet.',
      css: 'color:' + UI.dim + ';font-size:13px;',
    }, [FOTZ_PIP_MISSING]);
  }

  function fotzItemRow(row) {
    return h('tr', { css: row.dim ? 'opacity:.55;' : '' }, [
      h('td', { css: TD + 'text-align:center;width:1%;' }, [fotzPip(row)]),
      h('td', { css: TD }, [
        wikiLink(row.name, row.name),
        row.slot ? h('span', { css: 'color:' + UI.dim + ';font-size:11px;' },
          [' · ' + row.slot]) : null,
        row.bis ? h('div', { css: 'color:' + UI.accent + ';font-size:11px;' }, [row.bis]) : null,
        row.spare ? h('div', { css: 'color:' + UI.dim + ';font-size:11px;' },
          [row.spare + (row.spare === 1 ? ' spare' : ' spares') + ' — worth '
            + (row.spare * row.spareEach) + ' Favour traded back']) : null,
      ]),
      h('td', { css: TD + 'color:' + UI.dim + ';font-size:11px;line-height:1.5;' }, [
        row.held ? null : h('div', null, [row.how]),
        row.note ? h('div', null, [row.note]) : null,
        row.fate ? h('div', null, ['Or ' + row.fate + ' Fate at the Hoard.']) : null,
      ]),
    ]);
  }

  // The cards on screen, ranked the way the badge colours them: the ones
  // offering something you still need first, then by trade-in value.
  function fotzHandRows(depth, source, floor, holdings) {
    const seen = new Map();
    eachCardName(function (host, name) {
      const card = lookupFotzCard(name);
      if (card && !seen.has(card.name)) seen.set(card.name, card);
    });
    const rated = [];
    for (const card of seen.values()) {
      const opts = fotzOptionsAt(card, depth, floor);
      if (!opts.length) continue;
      let missing = [];
      for (const opt of opts) {
        const gone = fotzMissingFrom(opt, holdings);
        if (gone) missing = missing.concat(gone);
      }
      const favours = opts.map(function (o) { return o.favour; });
      rated.push({
        card: card,
        opts: opts,
        missing: missing,
        best: Math.max.apply(null, favours),
        spec: fotzBadgeSpec(card, depth, source, floor, holdings),
      });
    }
    rated.sort(function (a, b) {
      if (!!a.missing.length !== !!b.missing.length) return a.missing.length ? -1 : 1;
      return b.best - a.best;
    });
    return rated;
  }

  // The render context of the last Fruits of the Zee panel opened, so setting
  // the depth in the page can redraw one that is open behind it. A context
  // whose panel has since been closed, or replaced by another, is harmless:
  // the launcher's `rerender` does nothing once its body is out of the page.
  let fotzPanelCtx = null;

  function renderFotzPanel(ctx) {
    if (ctx) fotzPanelCtx = ctx;
    const state = readFotzState();
    const at = fotzDepth();
    const floor = at.depth ? null : fotzDepthFloor();
    const collection = fotzCollection(state);
    const ledger = fotzLedger(state);
    const hand = fotzHandRows(at.depth, at.source, floor, fotzHoldings());

    let busy = false;
    if (ctx && autoRefreshEnabled() && (!stateIsFresh(state) || wantsDepthRefresh())) {
      busy = true;
      depthRefreshAt = Date.now();
      refreshBackgroundState().then(function () { ctx.rerender(); });
    }

    const section = function (title, children) {
      return h('div', { css: 'margin-top:14px;' }, [
        h('div', {
          css: 'font:bold 11px ' + UI.font + ';letter-spacing:.06em;text-transform:uppercase;'
            + 'color:' + UI.accent + ';margin-bottom:5px;',
        }, [title]),
        children,
      ]);
    };
    const note = function (text) {
      return h('div', { css: 'color:' + UI.dim + ';font-size:11px;line-height:1.6;' }, text);
    };
    const table = function (heads, rows) {
      return h('table', { css: 'width:100%;border-collapse:collapse;' }, [
        heads ? h('thead', null, [h('tr', null, heads.map(function (head) {
          return h('th', { css: TH + (head.right ? 'text-align:right;' : '') }, [head.text]);
        }))]) : null,
        h('tbody', null, rows),
      ]);
    };

    // --- your numbers, and where they came from --------------------------
    const value = function (name) {
      const v = state && state.values ? state.values.get(name) : undefined;
      return typeof v === 'number' ? String(v) : '–';
    };
    const stat = function (label, name, title) {
      return h('div', { title: title || '', css: 'min-width:96px;' }, [
        h('div', { css: 'color:' + UI.dim + ';font-size:10px;letter-spacing:.05em;'
          + 'text-transform:uppercase;' }, [label]),
        h('div', { css: 'color:' + UI.text + ';font:bold 15px ' + UI.font + ';' },
          [value(name)]),
      ]);
    };

    const banners = [];

    banners.push(h('div', {
      css: 'margin:10px 0 0;padding:8px 10px;background:' + UI.bgAlt
        + ';border-left:3px solid ' + UI.accent + ';display:flex;gap:14px;flex-wrap:wrap;',
    }, [
      stat('Favour', 'Thalassic Favour', 'Thalassic Favour — what week two is paid in.'),
      stat('Devotion', 'Fivefold Devotion', 'Fivefold Devotion — 5 to dive at all, 11 is the cap.'),
      stat('Depth', 'Full Fathom Five', 'Full Fathom Five — how deep you are right now.'),
      stat('Sights', 'Sights at the Festival',
        'Sights at the Festival — decides which of the three coral items you get.'),
      stat('Airs', 'Airs of a Barren Zee',
        'Airs of a Barren Zee — decides which supplication options you are offered, '
          + 'and is re-rolled every time you take one.'),
      stat('Harvest', 'A Fruitless Harvest', 'A Fruitless Harvest — the festival’s own story.'),
    ]));

    if (!state) {
      banners.push(h('div', {
        css: 'margin:10px 0 0;padding:8px 10px;border-left:3px solid ' + UI.accent
          + ';background:' + UI.bgAlt + ';color:' + UI.dim + ';font-size:12px;line-height:1.5;',
      }, [
        'Nothing read yet. Open the ',
        h('a', { href: '/myself', css: 'color:' + UI.text + ';' }, ['Myself']),
        ' and ',
        h('a', { href: '/possessions', css: 'color:' + UI.text + ';' }, ['Possessions']),
        ' tabs once — or press Refresh — and both will be remembered here.',
      ]));
    }

    // --- the headline: what you are still missing ------------------------
    if (collection.ready.length) {
      banners.push(h('div', {
        css: 'margin:10px 0 0;padding:8px 10px;border-left:3px solid ' + COLOR_READY
          + ';background:#23280f;color:' + UI.text + ';font-size:12px;line-height:1.6;',
      }, [
        h('div', { css: 'color:' + COLOR_READY + ';font-weight:bold;' }, [
          h('span', {
            css: 'display:inline-block;color:#17190c;background:' + COLOR_READY
              + ';border-radius:3px;padding:0 5px;margin-right:6px;',
          }, ['!']),
          collection.ready.length === 1
            ? '1 thing you can collect right now'
            : collection.ready.length + ' things you can collect right now',
        ]),
        collection.ready.map(function (row) {
          return h('div', null, [
            wikiLink(row.name, row.name),
            h('span', { css: 'color:' + UI.dim + ';' }, [' — ' + row.how]),
          ]);
        }),
      ]));
    }

    banners.push(h('div', {
      css: 'margin:10px 0 0;padding:8px 10px;border-left:3px solid ' + UI.accent
        + ';background:' + UI.bgAlt + ';font-size:12px;line-height:1.6;',
    }, [
      h('div', { css: 'color:' + UI.accent + ';font-weight:bold;' }, [
        collection.unknown === collection.total
          ? 'The festival collection is ' + collection.total + ' items'
          : 'Missing ' + collection.missing + ' of ' + collection.total
            + ' festival items'
            + (collection.unknown ? ' (' + collection.unknown + ' unknown)' : ''),
      ]),
      collection.unknown === collection.total
        ? note(['Which of them you hold is not known yet — read your Possessions and '
          + 'this becomes a checklist.'])
        : (collection.missing
          ? h('div', { css: 'color:' + UI.dim + ';' }, [
            collection.wanted.map(function (r) { return r.name; }).join(', '), '.'])
          : note(['Nothing left to collect. The ships and the Fate items below are not '
            + 'counted.'])),
    ]));

    // --- what is still down there, depth by depth ------------------------
    //
    // A dive commits you to a depth, and the unique rewards are not spread
    // evenly: some are only at the bottom, and some are only at the top and
    // are LOST by diving past them. This is the block that says which.
    {
      const holdings = fotzHoldings();
      const split = fotzSplitUniques(fotzUniquesByDepth(holdings));
      const chip = function (entry) {
        const shallow = entry.to < 5;
        return h('span', {
          title: entry.card + ' — depth ' + (entry.from === entry.to
            ? entry.from : entry.from + '–' + entry.to)
            + (entry.pending
              ? '\nAll three of its items are still unpublished — see the checklist below.'
              : (entry.coral
                ? '\nBecomes one of three ' + entry.missing[0] + ', all mechanically '
                  + 'identical, and you have none of them yet.'
                : ''))
            + (entry.held
              ? '\nYou are already holding ' + entry.held + ' of the coral itself.' : ''),
          css: 'display:inline-block;margin:2px 5px 2px 0;padding:1px 6px;border-radius:3px;'
            + 'background:' + (entry.last && shallow ? '#5a3a1c' : UI.bg)
            + ';border:1px solid ' + (entry.last && shallow ? COLOR_FULL : UI.line)
            + ';color:' + UI.text + ';font-size:11px;white-space:nowrap;',
        }, [
          entry.bride ? 'the Pentamerous Bride' : entry.label,
          // A coral you are already carrying is a different prospect from one
          // you have never seen -- same as the card badge's brackets.
          entry.held
            ? h('span', { css: 'color:' + UI.dim + ';' }, [' (' + entry.held + ')'])
            : null,
          entry.last && shallow
            ? h('span', { css: 'color:' + COLOR_FULL + ';' }, [' · last chance'])
            : null,
        ]);
      };

      const anything = split.everywhere.length
        || split.byDepth.some(function (row) { return row.entries.length; });

      banners.push(h('div', {
        css: 'margin:10px 0 0;padding:8px 10px;border-left:3px solid ' + UI.accent
          + ';background:' + UI.bgAlt + ';font-size:12px;line-height:1.6;',
      }, [
        h('div', { css: 'color:' + UI.accent + ';font-weight:bold;' },
          ['Unique rewards still down there, by depth']),
        !holdings
          ? note(['Your Possessions have not been read, so what you are still missing is not '
            + 'known. Press Refresh above and this fills in.'])
          : (!anything
            ? note(['Nothing unique left to dive for. Everything below this is Favour.'])
            : h('div', null, [
              split.everywhere.length
                ? h('div', { css: 'margin:4px 0 6px;' }, [
                  h('span', { css: 'color:' + UI.dim + ';' }, ['At every depth: ']),
                  split.everywhere.map(chip),
                ])
                : null,
              table(
                [{ text: 'Depth' }, { text: 'Only here, or here as well' }],
                split.byDepth.map(function (row) {
                  const here = at.depth === row.depth;
                  return h('tr', { css: here ? 'background:' + UI.bg + ';' : '' }, [
                    h('td', {
                      css: TD + 'white-space:nowrap;color:'
                        + (here ? UI.accent : UI.text) + ';',
                    }, [
                      String(row.depth),
                      here
                        ? h('span', { css: 'color:' + COLOR_READY + ';font-size:11px;' },
                          [' ← you'])
                        : null,
                    ]),
                    h('td', { css: TD }, [
                      row.entries.length
                        ? row.entries.map(chip)
                        : h('span', { css: 'color:' + UI.dim + ';' },
                          ['— nothing but the corals and Favour']),
                    ]),
                  ]);
                })),
              note(['A dive commits you to a depth and pays one reward, so the marked ones '
                + 'are the ones diving deeper throws away for that dive.']),
            ])),
      ]));
    }

    if (state && state.partial) {
      banners.push(h('div', {
        css: 'margin:10px 0 0;padding:8px 10px;border-left:3px solid #8a6b3b;background:'
          + UI.bgAlt + ';color:' + UI.dim + ';font-size:12px;line-height:1.5;',
      }, ['The Myself tab’s search box is filtering the list — anything not on screen '
        + 'is shown as – rather than guessed at 0.']));
    }

    // Where the numbers came from, plus the two controls, exactly as the
    // Factions panel does it.
    banners.push(h('div', {
      css: 'margin:10px 0 0;display:flex;align-items:center;gap:10px;flex-wrap:wrap;'
        + 'color:' + UI.dim + ';font-size:11px;',
    }, [
      h('span', null, [
        'Qualities: ' + (state && state.live ? 'live'
          : (state && state.at ? ageText(state.at) : 'never read'))
        + '  ·  items: ' + (state && state.itemsAt
          ? (state.itemsLive ? 'live' : ageText(state.itemsAt)) : 'never read')
        + (state && state.character ? '  ·  ' + state.character : ''),
      ]),
      h('button', {
        type: 'button',
        disabled: busy,
        title: 'Load /myself and /possessions in a hidden frame and re-read them.',
        css: 'border:1px solid ' + UI.line + ';border-radius:3px;background:transparent;color:'
          + (busy ? UI.dim : UI.accent) + ';font:11px ' + UI.font + ';padding:1px 7px;'
          + 'cursor:' + (busy ? 'default' : 'pointer') + ';',
        on: {
          click: function () {
            if (busy || !ctx) return;
            busy = true;
            ctx.rerender();
            refreshBackgroundState().then(function () { ctx.rerender(); });
          },
        },
      }, [busy ? 'Refreshing…' : 'Refresh']),
      h('label', {
        title: 'Refresh automatically when this panel opens on stale numbers.',
        css: 'display:inline-flex;align-items:center;gap:4px;cursor:pointer;',
      }, [
        h('input', {
          type: 'checkbox',
          checked: autoRefreshEnabled(),
          on: { change: function (e) { setAutoRefresh(!!e.currentTarget.checked); } },
        }),
        'auto',
      ]),
    ]));

    // --- the depth control -----------------------------------------------
    //
    // Here rather than nowhere because the badges cannot be exact without it
    // and FL may never show us Full Fathom Five. It is deliberately not
    // remembered past the tab: a stale depth is a wrong badge.
    const depthButton = function (n) {
      const on = at.source === 'set' && at.depth === n;
      return h('button', {
        type: 'button',
        title: n == null ? 'Let the depth be read from the game, if it can be.'
          : 'You are at Full Fathom Five ' + n + '.',
        css: 'border:1px solid ' + (on ? UI.accent : UI.line) + ';border-radius:3px;'
          + 'background:' + (on ? UI.accent : 'transparent') + ';color:'
          + (on ? '#17190c' : UI.text) + ';font:' + (on ? 'bold ' : '') + '12px ' + UI.font
          + ';padding:2px 9px;cursor:pointer;',
        on: {
          click: function () {
            fotzSetDepth(n);
            if (ctx) ctx.rerender();
          },
        },
      }, [n == null ? 'auto' : String(n)]);
    };

    const depthBlock = h('div', {
      css: 'margin:10px 0 0;padding:8px 10px;background:' + UI.bgAlt
        + ';border-left:3px solid ' + (at.depth ? UI.accent : UI.line) + ';font-size:12px;',
    }, [
      h('div', { css: 'display:flex;align-items:center;gap:6px;flex-wrap:wrap;' }, [
        h('span', { css: 'color:' + UI.dim + ';margin-right:4px;' }, ['Your dive depth:']),
        depthButton(null), depthButton(1), depthButton(2), depthButton(3),
        depthButton(4), depthButton(5),
        h('span', { css: 'color:' + (at.depth ? UI.accent : UI.dim) + ';margin-left:4px;' },
          [depthSourceText(at, floor)]),
      ]),
      note([at.depth
        ? 'Every badge is showing the figure for depth ' + at.depth + '.'
          + (at.source === 'read'
            ? ' That reading came off the Myself tab, which opening this panel reloads — '
              + 'but a dive changes it, so set it here the moment you go deeper.'
            : '')
        : 'Without a depth the badges show the range across every depth. Fallen London '
          + 'only states Full Fathom Five on the Myself tab, never on the diving screen, '
          + 'so set it here and the badges become exact. Cleared when the tab closes.',
      ]),
      note(['The same buttons are in the page while you are in the Royal Approach — '
        + 'beside Fallen London’s Travel button and above your hand — so you need '
        + 'not open this panel to correct the depth mid-dive.']),
    ]);
    banners.push(depthBlock);

    // --- the hand ---------------------------------------------------------
    const handBlock = hand.length
      ? h('div', {
        css: 'margin:10px 0 0;padding:8px 10px;border-left:3px solid ' + UI.accent
          + ';background:' + UI.bgAlt + ';font-size:12px;line-height:1.6;',
      }, [
        h('div', { css: 'color:' + UI.accent + ';font-weight:bold;' }, [
          hand.length === 1 ? '1 festival card on screen'
            : hand.length + ' festival cards on screen',
          h('span', { css: 'color:' + UI.dim + ';font-weight:normal;' },
            [' — what you still need first, then by value']),
        ]),
        hand.map(function (rated) {
          return h('div', null, [
            rated.spec ? makeBadge(rated.spec, FOTZ_CLASS) : null,
            h('span', { css: 'margin-left:6px;' }, [rated.card.name]),
            h('span', { css: 'color:' + UI.dim + ';' }, [
              ' — ' + rated.opts.map(function (o) {
                return o.text + (o.favour ? ' (' + o.favour + ')' : '');
              }).join(' / '),
            ]),
            rated.missing.length
              ? h('div', { css: 'color:' + COLOR_READY + ';' },
                ['   ' + FOTZ_MARK_NEED + ' ' + rated.missing.join(', ')])
              : null,
          ]);
        }),
      ])
      : h('div', {
        css: 'margin:10px 0 0;padding:8px 10px;border-left:3px solid ' + UI.line
          + ';background:' + UI.bgAlt + ';color:' + UI.dim + ';font-size:12px;line-height:1.5;',
      }, ['No festival cards on screen. Everything below is the checklist and the '
        + 'reference tables for when there are.']);
    banners.push(handBlock);

    // --- the checklist ----------------------------------------------------
    const groupBlocks = collection.groups.map(function (group) {
      const inner = group.corals
        ? group.corals.map(function (entry) {
          return h('div', { css: 'margin-top:8px;' }, [
            h('div', { css: 'font-size:12px;color:' + UI.text + ';' }, [
              wikiLink(entry.coral.coral, entry.coral.coral),
              h('span', { css: 'color:' + UI.dim + ';font-size:11px;' }, [
                ' · ' + entry.coral.slot + ' · from ',
              ]),
              wikiLink(entry.coral.card, entry.coral.card,
                { color: UI.dim, fontSize: '11px' }),
              entry.inHand
                ? h('span', {
                  css: 'margin-left:6px;color:' + COLOR_READY + ';font-size:11px;',
                }, [entry.inHand + ' in hand'])
                : null,
            ]),
            table(null, entry.rows.map(function (row) {
              return h('tr', null, [
                h('td', { css: TD + 'text-align:center;width:1%;' }, [fotzPip(row)]),
                h('td', { css: TD }, [
                  h('span', { css: 'color:' + UI.text + ';' }, [
                    row.pending
                      ? 'Three ' + row.slot + ', names not published yet'
                      : 'Any one of three ' + row.slot,
                  ]),
                  row.bis
                    ? h('div', { css: 'color:' + UI.accent + ';font-size:11px;' }, [row.bis])
                    : null,
                  // The variant detail is worth SHOWING even though it is no
                  // longer worth counting: the one you hold is ticked, and the
                  // Sights band that pays each name is in its tooltip, for the
                  // times you do want a particular one.
                  row.variants
                    ? h('div', { css: 'font-size:11px;margin-top:2px;' },
                      row.variants.map(function (name, i) {
                        const mine = row.which.indexOf(name) !== -1;
                        const band = FOTZ_BANDS[i];
                        return h('span', {
                          title: name + ' — Sights at the Festival ' + band.lo + '–' + band.hi
                            + ' when you break the coral open, or trade a spare to '
                            + band.trader
                            + (collection.sightsBand === i ? '\nYour Sights is in this band now.'
                              : ''),
                          css: 'margin-right:8px;white-space:nowrap;color:'
                            + (mine ? UI.accent : UI.dim) + ';',
                        }, [mine ? '✓ ' + name : name]);
                      }))
                    : h('div', { css: 'color:' + UI.dim + ';font-size:11px;' }, [row.note]),
                ]),
              ]);
            })),
          ]);
        })
        : table(null, group.rows.map(fotzItemRow));

      return h('div', { css: 'margin-top:12px;' }, [
        h('div', {
          css: 'font:bold 11px ' + UI.font + ';letter-spacing:.06em;text-transform:uppercase;'
            + 'color:' + UI.accent + ';',
        }, [group.title]),
        note([group.hint]),
        inner,
      ]);
    });

    // --- the ledger -------------------------------------------------------
    const ledgerBlock = !ledger.known
      ? note(['Your Possessions have not been read, so there is nothing to total up yet.'])
      : (ledger.rows.length || ledger.spares.length
        ? h('div', null, [
          table([{ text: 'Treasure' }, { text: 'Held', right: true },
            { text: 'Each', right: true }, { text: 'Favour', right: true }],
          ledger.rows.map(function (row) {
            return h('tr', null, [
              h('td', { css: TD }, [
                wikiLink(row.name, row.name),
                row.note ? h('div', { css: 'color:' + UI.dim + ';font-size:11px;' },
                  [row.note]) : null,
              ]),
              h('td', { css: TD + 'text-align:right;' }, [String(row.count)]),
              h('td', { css: TD + 'text-align:right;color:' + UI.dim + ';' },
                [String(row.each)]),
              h('td', { css: TD + 'text-align:right;' }, [String(row.subtotal)]),
            ]);
          }).concat(ledger.spares.map(function (row) {
            return h('tr', null, [
              h('td', { css: TD }, [
                wikiLink(row.name, row.name),
                h('span', { css: 'color:' + UI.dim + ';font-size:11px;' }, [' · spare']),
              ]),
              h('td', { css: TD + 'text-align:right;' }, [String(row.count)]),
              h('td', { css: TD + 'text-align:right;color:' + UI.dim + ';' },
                [String(row.each)]),
              h('td', { css: TD + 'text-align:right;' }, [String(row.subtotal)]),
            ]);
          })).concat([
            h('tr', null, [
              h('td', { css: TD + 'font-weight:bold;' }, ['Total']),
              h('td', { css: TD }, ['']),
              h('td', { css: TD }, ['']),
              h('td', {
                css: TD + 'text-align:right;font-weight:bold;color:' + UI.accent + ';',
              }, [String(ledger.total)]),
            ]),
          ])),
          note(['With the ' + (collection.favour == null ? '–' : collection.favour)
            + ' Favour you already hold, that is '
            + (collection.favour == null ? ledger.total + ' plus whatever you have'
              : collection.favour + ledger.total)
            + '. Treasures left over when the festival ends become Memories of Distant '
            + 'Shores at 10 Favour to 1, so trade them.']),
        ])
        : note(['No festival treasures on hand. Everything you dive up shows here with '
          + 'what it trades for.']));

    // --- reference --------------------------------------------------------
    const depthTable = table(
      [{ text: 'Card' }, { text: 'Take' }, { text: 'Depth' },
        { text: 'Favour', right: true }, { text: 'You get' }],
      FOTZ_CARDS.filter(function (c) { return !c.storylet; }).reduce(function (rows, card) {
        return rows.concat(card.opts.map(function (opt, i) {
          const here = at.depth && fotzOptionAt(opt, at.depth);
          return h('tr', { css: here ? 'background:' + UI.bgAlt + ';' : '' }, [
            h('td', { css: TD + 'white-space:nowrap;' },
              [i === 0 ? wikiLink(card.name, card.name) : '']),
            h('td', { css: TD + 'font-size:11px;' }, [opt.text]),
            h('td', { css: TD + 'white-space:nowrap;font-size:11px;color:' + UI.dim + ';' },
              [opt.depths[0] === opt.depths[1] ? String(opt.depths[0])
                : opt.depths[0] + '–' + opt.depths[1]]),
            h('td', { css: TD + 'text-align:right;' },
              [opt.favour ? String(opt.favour) : '—']),
            h('td', { css: TD + 'font-size:11px;color:' + UI.dim + ';' },
              [opt.gain || opt.coral || opt.item || '']),
          ]);
        }));
      }, []));

    // --- raising Devotion -------------------------------------------------
    //
    // The five supplication options all pay the same 4 CP, so the table is
    // really a lookup from "which stat am I best at" to "which option". The
    // stat is the column that matters, which is why it leads and wears a
    // colour; the name is always spelled out beside the glyph so a font
    // without the emoji loses nothing.
    const statPip = function (name) {
      const stat = FOTZ_STATS[name];
      return h('span', { css: 'white-space:nowrap;color:' + (stat ? stat.color : UI.text) + ';' }, [
        h('span', {
          css: 'font-size:13px;margin-right:5px;',
          title: name,
        }, [stat ? stat.icon : '?']),
        name,
      ]);
    };

    const advice = fotzDiveAdvice(
      { corals: collection.coralsWanted, items: collection.itemsWanted });
    const ladder = fotzDevotionLadder();
    const toGo = fotzActionsToDevotion(collection.devotion, advice.level);

    const supplicationBlock = h('div', null, [
      note(['Every option on ', wikiLink('Supplication on the Shore', 'Supplication on the Shore'),
        ' pays the same ', h('b', null, ['+4 CP']), ' of Fivefold Devotion, so the only thing '
        + 'that separates them is which attribute the economy item scales off. But you are only '
        + 'offered the ones whose ', h('b', null, ['Airs of a Barren Zee']), ' window you are in '
        + '— usually two of the five — and taking one re-rolls Airs, so you cannot always have '
        + 'the one you want. These are badged in the game as well, on the options themselves.']),
      table(
        [{ text: 'Scales off' }, { text: 'Option' }, { text: 'You get' }, { text: 'Offered at' }],
        FOTZ_SUPPLICATION.map(function (opt) {
          return h('tr', null, [
            h('td', { css: TD + 'white-space:nowrap;' }, [statPip(opt.stat)]),
            h('td', { css: TD }, [
              wikiLink(opt.text, opt.text),
              opt.note
                ? h('div', { css: 'color:' + UI.dim + ';font-size:11px;' }, [opt.note])
                : null,
            ]),
            h('td', { css: TD + 'white-space:nowrap;' }, [wikiLink(opt.gain, opt.gain)]),
            h('td', {
              css: TD + 'white-space:nowrap;font-size:11px;color:' + UI.dim + ';',
              title: 'Airs of a Barren Zee ' + opt.airs,
            }, ['Airs ' + opt.airs]),
          ]);
        })),
      note(['Two more branches share the storylet and raise no Devotion: ',
        wikiLink('Speak to the Custodial Chef', 'Speak to the Custodial Chef'),
        ' costs nothing and gives nothing, and seeking out one of the Fathomking’s servants '
        + 'sets Devotion straight to 11 for 7 Fate — which is otherwise 17 supplications.']),

      // How far to take it, and how far that is from here.
      h('div', {
        css: 'margin-top:10px;padding:8px 10px;border-left:3px solid ' + UI.accent
          + ';background:' + UI.bgAlt + ';font-size:12px;line-height:1.6;',
      }, [
        h('div', { css: 'color:' + UI.accent + ';font-weight:bold;' }, [
          'Stop at Fivefold Devotion ' + advice.level
            + (advice.depth ? ', then dive to depth ' + advice.depth : ''),
          collection.devotion != null
            ? h('span', { css: 'color:' + UI.dim + ';font-weight:normal;' }, [
              collection.devotion >= advice.level
                ? ' — you are at ' + collection.devotion + '. Go diving.'
                : ' — you are at ' + collection.devotion + ', so at most '
                  + toGo + (toGo === 1 ? ' more action' : ' more actions') + '.',
            ])
            : null,
        ]),
        note([advice.why]),
        // The Favour run is the one stage with a real choice in it, so its
        // three options are laid out rather than folded into the sentence.
        advice.alternatives
          ? note(['Devotion ', h('b', null, [String(advice.alternatives[0].level)]),
            ' is the pick; ',
            advice.alternatives.slice(1).map(function (alt, i) {
              return h('span', null, [
                i ? ', ' : '',
                'Devotion ' + alt.level
                  + (alt.depth ? ' at ' + fotzDepthPhrase(alt.depth) : '')
                  + ' pays ' + alt.fpa + (alt.note ? ' ' + alt.note : ''),
              ]);
            }),
            '. Favour per action, from the comment’s own simulation.'])
          : null,
        note(['Staged after ',
          h('a', {
            href: 'https://fallenlondon.wiki/wiki/Fruits_of_the_Zee_Festival_(Guide)'
              + '#cs-comment-99376',
            target: '_blank', rel: 'noopener',
            css: 'color:' + UI.accent + ';',
          }, ['a comment on the guide']),
          ' — collect in depth order, then grind Favour.']),
        collection.coralsWanted == null
          ? note(['(Counted as a Favour run: your Possessions have not been read, so what '
            + 'you still need is not known.)'])
          : null,
        collection.devotion != null && collection.devotion < advice.level
          ? note(['"At most" because Fallen London shows the level but not the change points '
            + 'inside it, so this assumes you have only just reached ' + collection.devotion
            + '.'])
          : null,
      ]),

      table(
        [{ text: 'Devotion' }, { text: 'CP', right: true },
          { text: 'Supplications', right: true }, { text: 'With the dive', right: true }],
        ladder.map(function (row) {
          const here = collection.devotion === row.level;
          const target = advice.level === row.level;
          return h('tr', {
            css: target ? 'background:' + UI.bgAlt + ';' : '',
          }, [
            h('td', { css: TD + 'color:' + (target ? UI.accent : UI.text) + ';' }, [
              String(row.level),
              here ? h('span', { css: 'color:' + COLOR_READY + ';' }, [' ← you']) : null,
              row.level === 5
                ? h('span', { css: 'color:' + UI.dim + ';font-size:11px;' }, [' minimum'])
                : null,
              row.level === 11
                ? h('span', { css: 'color:' + UI.dim + ';font-size:11px;' }, [' cap'])
                : null,
            ]),
            h('td', { css: TD + 'text-align:right;color:' + UI.dim + ';' }, [String(row.cp)]),
            h('td', { css: TD + 'text-align:right;' }, [String(row.actions)]),
            h('td', { css: TD + 'text-align:right;color:' + UI.dim + ';' }, [String(row.dive)]),
          ]);
        })),
      note(['Devotion is pyramidal, so each level costs one more change point than the last. '
        + 'A dive itself is 2 actions on top — one to leave the boat, one to claim the '
        + 'treasure. Diving deeper is free, but failing the attempt ends the dive.']),
    ]);

    const stallTable = table([{ text: 'Item' }, { text: 'Favour', right: true }],
      FOTZ_STALL.concat(FOTZ_EQUIPMENT.map(function (e) {
        return { name: e.name, favour: e.stall, slot: e.slot };
      })).sort(function (a, b) { return a.favour - b.favour; })
        .map(function (item) {
          const afford = collection.favour != null && collection.favour >= item.favour;
          return h('tr', null, [
            h('td', { css: TD }, [wikiLink(item.name, item.name)]),
            h('td', {
              css: TD + 'text-align:right;color:' + (afford ? COLOR_READY : UI.dim) + ';',
              title: afford ? 'You can afford this now.' : '',
            }, [String(item.favour)]),
          ]);
        }));

    const body = h('div', { css: 'padding:0 12px 12px;' }, [
      banners,

      section('Still missing', h('div', null, groupBlocks)),

      section('Treasures to trade', ledgerBlock),

      section('Raising Fivefold Devotion', supplicationBlock),

      section('What each card pays, by depth', h('div', null, [
        depthTable,
        note(['One reward per dive. The wiki’s best all-round line is to raise Fivefold '
          + 'Devotion to 10 and then keep diving until a card worth 300 Favour or more '
          + 'turns up, or you hit the bottom.']),
      ])),

      section('Buying it instead', h('div', null, [
        stallTable,
        note([
          'Plus a wrecked shipment for 95 Favour — a random parcel of saleable items '
            + 'worth about 9.4 Echoes, so a shade under the flat 0.1 Echo per Favour '
            + 'guaranteed by ',
          FOTZ_ECONOMY.map(function (item, i) {
            return h('span', null, [
              i ? (i === FOTZ_ECONOMY.length - 1 ? ' and ' : ', ') : '',
              wikiLink(item.name, item.name),
              h('span', { css: 'color:' + UI.dim + ';' }, [' (' + item.favour + ')']),
            ]);
          }),
          '.',
        ]),
      ])),

      h('div', { css: 'margin-top:12px;color:' + UI.dim + ';font-size:11px;line-height:1.6;' }, [
        h('div', null, ['The badge on a card is the Thalassic Favour its treasure trades '
          + 'for. ', h('b', null, [FOTZ_MARK_NEED]), ' means it also offers something you '
          + 'have not got; ', h('b', null, [FOTZ_MARK_DONE]), ' that you already hold '
          + 'everything it offers; ', h('b', null, [FOTZ_MARK_UNSURE]),
        ' that your Possessions have not been read, so neither can be said. A coral or '
          + 'the Bride pays no Favour, so those are labelled instead and coloured by '
          + 'whether you still need them. A card offering a named piece of unique '
          + 'equipment adds “item” after its figure, since it is worth more than the '
          + 'Favour it trades for; the brackets on “item” or “coral” are how many you '
          + 'are already carrying, and for an item that is how many are spare. Tap a '
          + 'badge to read what is behind it — the hover tooltip is invisible on a '
          + 'phone.']),
        h('div', { css: 'margin-top:6px;' }, ['Data from ',
          wikiLink('Fruits of the Zee Festival (Guide)', 'Fruits of the Zee Festival (Guide)'),
          ', its Item Comparison subpage, and the individual card and option pages on the '
          + 'Fallen London wiki.']),
      ]),
    ]);

    return body;
  }

  // === feature: the depth control, in the page ===========================
  //
  // CONFIRMED WORKING in-game (2026-09-04), both mounts: the tap sets the
  // depth and every badge in the hand re-quotes itself.
  //
  // Full Fathom Five decides every figure the festival badges quote, and
  // Fallen London does not render it on the diving screen at all -- so the
  // panel has always carried a control for setting it by hand. This is that
  // control, in the page, where the dive is: you go one deeper, you tap the
  // next number, and every badge in the hand is right again without opening
  // anything.
  //
  // It appears in TWO places on purpose, because they are reached differently:
  //
  //   docked  beside Fallen London's travel control, immediately behind the UX
  //           button Fallen London UX Enhancers docks there
  //           (`launcherDockHost`), so it is part of the chrome and always in
  //           the same spot. Without that script, or with its button set to
  //           float, there is no docked copy; the in-page one is unaffected.
  //           In the mobile
  //           banner a row of six buttons would be wider than the whole icon
  //           strip, so there it collapses to ONE button that shows the depth
  //           and cycles auto -> 1 -> ... -> 5 -> auto -- which is also the
  //           quickest thing on a phone, since going a level deeper is then
  //           one tap.
  //   in-page above the diving hand, which is where you are already looking.
  //
  // Only in the Royal Approach. Anywhere else both are removed -- and
  // `forgetStaleDepth` has thrown the setting away by then, so the control and
  // the badges can never disagree about it.
  //
  // Everything here has to be IDEMPOTENT and quiet, because it is redrawn by
  // the same debounced scan whose MutationObserver its own writes would
  // trigger: rebuilding the buttons on every scan is an infinite loop. Hence
  // the signature flag -- the same trick `attachBadge` uses, a dataset entry
  // holding the value the node was last drawn for.

  const DEPTH_ROW_ID = 'fl-ux-depth-row';
  const DEPTH_DOCK_ID = 'fl-ux-depth-dock';
  // UX Enhancers' launcher root and button. A CROSS-FILE CONTRACT: these are
  // that script's ids, and the docked control is found by them. Change them in
  // both scripts or not at all.
  const LAUNCHER_ID = 'fl-ux-launcher';
  const LAUNCHER_BUTTON_ID = 'fl-ux-launcher-button';
  const DEPTH_SIG_FLAG = 'flUxDepthSig';
  const DEPTH_CHOICES = [null, 1, 2, 3, 4, 5];

  // A LIGHT BLUE card, not the dark chrome `UI` gives the panels (changed
  // 2026-09-04, on the author's request, and confirmed in the page). The reason it differs is where it
  // lives: a panel is a screen of ours that you opened, and dark is right
  // there, but this thing sits in Fallen London's own page -- over the dark
  // storylet column, beside the travel control -- where one more dark box is
  // one more thing to look past. Light blue reads as ours, and as a control.
  //
  // It also puts the control in the same visual family as the badges it
  // governs, whose ramp starts at aqua and light blue.
  //
  // A light card means dark text, the same trade FOTZ_INK makes: `UI.text` is
  // a cream meant for a near-black background and is illegible on this.
  const DEPTH_BG = '#cfe6f7';   // the card
  const DEPTH_EDGE = '#8fbfe0'; // its border, and an unchosen button's
  const DEPTH_INK = '#14181c';  // everything written on it
  const DEPTH_DIM = '#476076';  // ...except the quieter half, which is this
  const DEPTH_ON = '#1b6499';   // the depth you actually chose

  let depthRow = null;
  let depthDock = null;

  // In the Royal Approach. The greeting is the gate; where there is no
  // greeting to read at all, an unmistakable dive hand still proves it -- the
  // same escape hatch `fotzWhere` keeps.
  function showDepthControl() {
    if (inDiveArea()) return true;
    return !normalizeName(currentArea()) && fotzHandConfirms();
  }

  // Where the one-button form goes next. Anything but a hand-set depth starts
  // the cycle at 1 rather than stepping off a number you did not choose.
  function nextDepthChoice(at) {
    if (at.source !== 'set') return 1;
    const i = DEPTH_CHOICES.indexOf(at.depth);
    return DEPTH_CHOICES[(i + 1) % DEPTH_CHOICES.length];
  }

  // What the drawn control depends on. The age BUCKET rather than the
  // timestamp: a banked reading says how old it is in words, so those words
  // have to be allowed to change -- but only every so often, or this would
  // redraw on every scan and the observer would never settle.
  function depthSig(at, floor) {
    const age = at.at ? Math.floor((Date.now() - at.at) / 15000) : 'x';
    return [at.depth || 'x', at.source || '-', floor || 'x', age].join('/');
  }

  // Setting the depth has to reach three things: these controls, the badges
  // (whose flag carries the depth, so a scan is enough to redraw them), and a
  // Fruits of the Zee panel that happens to be open behind all this.
  function setDepthFromControl(n) {
    fotzSetDepth(n);
    try {
      fotzDepthControls();
    } catch (e) { /* the scan below gets another go at it */ }
    if (fotzPanelCtx) {
      try {
        fotzPanelCtx.rerender();
      } catch (e) { /* ditto */ }
    }
    schedule();
  }

  // The docked form sits inside Fallen London's own chrome and the in-page one
  // sits directly above a hand of cards. Neither click is the game's to hear.
  function depthTap(handler) {
    return function (e) {
      if (e && e.preventDefault) e.preventDefault();
      if (e && e.stopPropagation) e.stopPropagation();
      handler();
    };
  }

  // The chosen depth is a solid blue chip on the light card; the rest are
  // outlines. That is the one distinction the control has to make at a glance,
  // and it survives being the only thing you can see out of the corner of an
  // eye while you are reading the cards themselves.
  function depthChoiceButton(n, at) {
    const on = at.source === 'set' && at.depth === n;
    return h('button', {
      type: 'button',
      title: n == null
        ? 'Stop overriding it — read the depth off Full Fathom Five where that is possible.'
        : 'You are at Full Fathom Five ' + n + '.',
      css: 'border:1px solid ' + (on ? DEPTH_ON : DEPTH_EDGE) + ';border-radius:3px;'
        + 'background:' + (on ? DEPTH_ON : 'transparent') + ';color:'
        + (on ? '#ffffff' : DEPTH_INK) + ';font:' + (on ? 'bold ' : '') + '12px ' + UI.font
        + ';padding:1px 7px;margin:0;line-height:1.5;cursor:pointer;',
      on: { click: depthTap(function () { setDepthFromControl(n); }) },
    }, [n == null ? 'auto' : String(n)]);
  }

  // The card itself, wherever it is drawn. Both mounts share this so the
  // docked copy and the in-page one cannot drift apart.
  function styleDepthCard(host, at) {
    host.style.cssText = 'display:inline-flex;align-items:center;gap:6px;flex-wrap:wrap;'
      + 'box-sizing:border-box;padding:5px 9px;border-radius:4px;'
      + 'background:' + DEPTH_BG + ';border:1px solid ' + DEPTH_EDGE + ';'
      + 'border-left:3px solid ' + (at.depth ? DEPTH_ON : DEPTH_EDGE) + ';'
      + 'color:' + DEPTH_INK + ';list-style:none;vertical-align:middle;';
  }

  function fillDepthRow(host, at, floor) {
    host.textContent = '';
    host.appendChild(h('span', { css: 'color:' + DEPTH_DIM + ';font:11px ' + UI.font + ';' },
      ['Dive depth:']));
    for (const n of DEPTH_CHOICES) host.appendChild(depthChoiceButton(n, at));
    host.appendChild(h('span', {
      css: 'color:' + (at.depth ? DEPTH_ON : DEPTH_DIM) + ';font:11px ' + UI.font + ';',
    }, [depthSourceText(at, floor)]));
  }

  function fillDepthCycle(host, at, floor) {
    const next = nextDepthChoice(at);
    host.textContent = '';
    host.appendChild(h('button', {
      type: 'button',
      title: 'Dive depth: ' + depthSourceText(at, floor) + '. Tap for '
        + (next == null ? 'auto' : next) + '.',
      css: 'border:0;border-radius:3px;background:transparent;color:'
        + (at.depth ? DEPTH_ON : DEPTH_DIM) + ';font:' + (at.depth ? 'bold ' : '') + '15px '
        + UI.font + ';padding:0 2px;margin:0;line-height:1;cursor:pointer;',
      on: { click: depthTap(function () { setDepthFromControl(next); }) },
    }, ['🌊' + (at.depth || '?')]));
  }

  // Where UX Enhancers has docked its launcher button, as a host to queue up
  // behind, or null. Read off the page by id, because the button belongs to
  // the other script: docked, its parent is a wrapper -- a `span` beside the
  // Travel button, an `li` in the mobile banner -- inside Fallen London's own
  // chrome; floating, its parent is the launcher's root on the body, and there
  // is nothing in the chrome to sit behind.
  function launcherDockHost() {
    const button = document.getElementById(LAUNCHER_BUTTON_ID);
    const dock = button && button.parentNode;
    const container = dock && dock.parentNode;
    if (!dock || !container || dock.nodeType !== 1 || dock.id === LAUNCHER_ID) return null;
    const tag = String(dock.tagName || '').toLowerCase();
    if (tag !== 'li' && tag !== 'span') return null;
    return { container: container, tag: tag, className: dock.className || '', after: dock };
  }

  // Docked immediately BEHIND the UX button, wherever UX Enhancers has put it:
  // the launcher claims the place right after the travel control, and the two
  // must not fight over it. The wrapper copies the button's in shape and class,
  // so in the mobile banner it is one more `li.banner-item`.
  function dockDepthControl(at, floor) {
    const host = launcherDockHost();
    if (!host) {
      if (depthDock) {
        depthDock.remove();
        depthDock = null;
      }
      return;
    }
    const banner = host.tag === 'li';
    if (!depthDock || depthDock.tagName !== host.tag.toUpperCase()) {
      if (depthDock) depthDock.remove();
      depthDock = h(host.tag, { id: DEPTH_DOCK_ID, className: host.className });
    } else if (depthDock.className !== host.className) {
      depthDock.className = host.className;
    }
    const sig = (banner ? 'banner' : 'row') + '/' + depthSig(at, floor);
    if (depthDock.dataset[DEPTH_SIG_FLAG] !== sig) {
      // The wrapper IS the card, in both shapes -- in the banner it is one
      // light blue chip in the row of icons, which is what a control of ours
      // should look like there. `margin` is the one thing the two disagree on:
      // the banner packs its items tight and the sidebar does not.
      styleDepthCard(depthDock, at);
      depthDock.style.margin = banner ? '0 0 0 4px' : '4px 0 4px 8px';
      if (banner) fillDepthCycle(depthDock, at, floor);
      else fillDepthRow(depthDock, at, floor);
      depthDock.dataset[DEPTH_SIG_FLAG] = sig;
    }
    if (depthDock.previousElementSibling !== host.after) {
      host.container.insertBefore(depthDock, host.after.nextSibling);
    }
  }

  // Above the hand. `.hand` is the block both layouts wrap the cards in -- the
  // same markup `eachCardName`'s first two selectors hang off -- with the
  // full-width layout's card container as the fallback if that is all there is.
  //
  // INSERTED rather than appended, which is the one place this is less
  // conservative than the launcher's docking: the control belongs above the
  // cards, not under them. React tracks its children by reference, so a
  // foreign node between two of them survives its inserts and its removes; and
  // if a re-render does take ours, the next scan puts it back.
  function mountDepthRow(at, floor) {
    const card = document.querySelector('.hand__card-container');
    const hand = document.querySelector('.hand') || (card ? card.parentElement : null);
    if (!hand || !hand.parentNode) {
      if (depthRow) {
        depthRow.remove();
        depthRow = null;
      }
      return;
    }
    if (!depthRow) {
      depthRow = h('div', {
        id: DEPTH_ROW_ID,
        title: 'Every Fruits of the Zee badge below is quoted at this depth.',
      });
    }
    const sig = depthSig(at, floor);
    if (depthRow.dataset[DEPTH_SIG_FLAG] !== sig) {
      styleDepthCard(depthRow, at);
      // The one difference from the docked copy: above the hand it spans the
      // column rather than shrink-wrapping, so it reads as a header for the
      // cards under it instead of a stray chip floating over them.
      depthRow.style.display = 'flex';
      depthRow.style.width = '100%';
      depthRow.style.margin = '0 0 8px';
      fillDepthRow(depthRow, at, floor);
      depthRow.dataset[DEPTH_SIG_FLAG] = sig;
    }
    if (depthRow.parentNode !== hand.parentNode || depthRow.nextElementSibling !== hand) {
      hand.parentNode.insertBefore(depthRow, hand);
    }
  }

  function fotzDepthControls() {
    if (!showDepthControl()) {
      if (depthRow) {
        depthRow.remove();
        depthRow = null;
      }
      if (depthDock) {
        depthDock.remove();
        depthDock = null;
      }
      return;
    }
    const at = fotzDepth();
    const floor = at.depth ? null : fotzDepthFloor();
    dockDepthControl(at, floor);
    mountDepthRow(at, floor);
  }

  // === feature registry ==================================================

  const FEATURES = [
    // Not a visible feature: it watches for the Myself and Possessions tabs
    // going by and banks the festival's qualities and the Port Carnelian purse
    // off the first, and how many of each item you hold off the second, which
    // is what lets a card badge say "you still need this".
    { name: 'fotz-capture', run: captureFotzState },
    { name: 'spite-card-ratings', run: spiteCardRatings },
    { name: 'zee-card-ratings', run: zeeCardRatings },
    { name: 'fotz-card-ratings', run: fotzCardRatings },
    // How deep you are, set in the page rather than behind the launcher. AFTER
    // the ratings, because `fotzCardRatings` is where `forgetStaleDepth` runs:
    // a depth thrown away on surfacing is gone before the control can draw it.
    { name: 'fotz-depth-control', run: fotzDepthControls },
    // The only feature that decorates a storylet's OPTIONS rather than cards.
    { name: 'fotz-supplication', run: fotzSupplicationBranches },
    // Port Carnelian deals no opportunity cards at all, so this one badges the
    // storylet list and the branches inside an opened storylet instead. It
    // shares `.branch__title` with the feature above and owns a different class
    // and flag, so the two never clear each other.
    { name: 'port-carnelian', run: pcRatings },
    // The third feature on `.branch__title`, and the first that has to work out
    // WHICH of three islands a branch belongs to before it can say anything:
    // "Time to go", "Tarry a little" and "Cut it fine" are on all three and pay
    // a different research page on each.
    { name: 'scientific-voyages', run: vsdRatings },
    // The fourth on `.branch__title`, and the first to badge the hand AND the
    // options of an opened card: a lab option is only badged inside a lab card,
    // because "Take a break" and "No more of this!" could be anywhere.
    { name: 'university-laboratory', run: labRatings },
    // The fifth on `.branch__title`. Arbor deals no cards, so it badges the
    // London card that takes you there, the two storylets a stay happens in,
    // and their options -- the options only while one of those is open.
    { name: 'arbor', run: arborRatings },
    // Three carousels on the shared storylet-carousel plumbing: each badges its
    // storylet headings and the options of its own open storylet only, so they
    // are the sixth to eighth on `.branch__title` without ever answering for
    // the same option.
    { name: 'lb-industries', run: lbiRatings },
    { name: 'menace-eradication', run: dmeRatings },
    { name: 'vertiginous-horticulture', run: vhRatings },
    // The fourth on the carousel plumbing, and the first with four storylets.
    { name: 'forgotten-quarter', run: fqRatings },
  ];

  // A panel is a screen of its own behind UX Enhancers' launcher menu: a
  // { id, icon, label, hint, render } entry. `render(ctx)` returns the element
  // to show and is called fresh on every open, so a panel showing live values
  // never has to invalidate a cache; `ctx.rerender()` redraws its body. They
  // are handed to the launcher through PANEL_REGISTRY, in this order, after
  // the launcher's own.
  const PANELS = [
    {
      id: 'zailing',
      icon: '⚓',
      label: 'Zailing',
      hint: 'Routes, Zee Peril, Troubled Waters and every card at zee',
      render: renderZailingPanel,
    },
    {
      id: 'port-carnelian',
      icon: '🐅',
      label: 'Port Carnelian',
      hint: 'A governor’s term: every option by the clock, what it changes, and what '
        + 'the two currencies cash in for',
      render: renderPortCarnelianPanel,
    },
    {
      id: 'scientific-voyages',
      icon: '🔬',
      label: 'Scientific Voyages',
      hint: 'The three islands, every action on them, and what the three kinds of '
        + 'research page are finally worth',
      render: renderVsdPanel,
    },
    {
      id: 'fruits-of-the-zee',
      icon: '🐚',
      label: 'Fruits of the Zee',
      hint: 'What the festival still owes you, what your treasures trade for, and '
        + 'what every diving card pays',
      render: renderFotzPanel,
    },
    {
      id: 'university-laboratory',
      icon: '🧪',
      label: 'University Laboratory',
      hint: 'Your Equipment, staff and project, what a draft would pay now, every lab card, '
        + 'and the projects, equipment and experts',
      render: renderLabPanel,
    },
  ];

  function registerPanels() {
    const shared = sharedPanels();
    if (!shared) return;
    for (const panel of PANELS) {
      if (!shared.some(function (p) { return p && p.id === panel.id; })) shared.push(panel);
    }
  }

  // === dispatch ==========================================================

  let pending = false;
  function scan() {
    pending = false;
    // Before anything is drawn: a tap-to-read panel whose badge React has
    // since thrown away is pointing at nothing.
    pruneTip();
    for (const feature of FEATURES) {
      try {
        feature.run();
      } catch (e) {
        console.error('FL Choice Helper: feature "' + feature.name + '" failed.', e);
      }
    }
  }
  function schedule() {
    if (pending) return;
    pending = true;
    requestAnimationFrame(scan);
  }

  registerPanels();
  // A page UX Enhancers loaded in a hidden frame is a page this script would
  // otherwise load again for itself. `schedule()` afterwards, because banking
  // a reading changes nothing in the page and so would redraw no badge.
  onSharedFrame(function (path, doc) {
    if (path === '/myself') {
      const got = readQualities(doc);
      bankFotzQualities(got);
      bankPcQualities(got);
      bankLabQualities(got);
    } else if (path === '/possessions') {
      bankItemCounts(readPossessionCounts(doc));
    }
    schedule();
  });

  scan();
  new MutationObserver(schedule).observe(document.body, { childList: true, subtree: true });
})();
