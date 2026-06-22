// ==UserScript==
// @name         Twilight Heroes Auto-Combat
// @author       Tilo
// @namespace    https://github.com/TiloBuechsenschuss
// @downloadURL  https://raw.githubusercontent.com/TiloBuechsenschuss/userscripts/refs/heads/main/TwilightHeroes/auto-combat.js
// @version      1.5
// @description  Adds three combat automation buttons. On fight.php: "repeat attack until fight done" next to the Attack button, and "repeat skill until fight done" next to the Use-a-Skill button (each re-issues that action every round until the fight ends). "adventure here again and attack until done" appears on the fight-over screen and below the Last Area Patrolled link in the nav sidebar; it re-adventures the same location and auto-attacks, fight after fight, until you hit a non-combat encounter, your HP drops below a threshold, or you run out of turns. Loops by re-submitting the real forms (one visible page reload per round) with a brief Stop window each round; HP is read from the per-round combat form and the sidebar. After each won fight in an adventure chain (buffs can't be cast mid-combat), if PP has filled up it refreshes the shortest-duration buff before re-adventuring by driving that effect's "+max" button in the nav sidebar (added by skills-cast-max.js). On non-combat encounters it adds a "remember choice" button beside each option; once remembered, that option is auto-picked whenever the same encounter recurs during an adventure chain, and choiceless non-combats auto-advance (re-adventure) instead of halting the chain. A "remembered choices…" button in the nav sidebar opens a popup listing every remembered encounter→option pick, with a Delete per row and a Delete-all.
// @match        https://www.twilightheroes.com/fight.php*
// @match        https://twilightheroes.com/fight.php*
// @match        https://www.twilightheroes.com/nav.php*
// @match        https://twilightheroes.com/nav.php*
// @run-at       document-idle
// @grant        none
// ==/UserScript==

(function () {
  "use strict";

  // ---------------------------------------------------------------------------
  // Configuration
  // ---------------------------------------------------------------------------
  const HP_FLOOR_PCT = 15;     // stop auto-combat if HP falls below this % of max
  const ROUND_DELAY_MS = 600;  // pause before each auto action — your window to hit Stop
  const STALE_MS = 45000;      // ignore/clear a session older than this (you wandered off)
  const CAP = 200;             // hard safety cap on auto actions per session

  const KEY = "th-autocombat";
  const CKEY = "th-autocombat-choices"; // persisted non-combat picks {encounter: optionLabel}

  // Bundled via all-in-one.js this IIFE runs on the union of all matched pages,
  // so scope to the two pages we touch and no-op everywhere else.
  const path = location.pathname.toLowerCase();
  const onFight = /\/fight\.php/.test(path);
  const onNav = /\/nav\.php/.test(path);
  if (!onFight && !onNav) return;

  // ---------------------------------------------------------------------------
  // Session flag — survives the per-round full-page reload (the TH loop model).
  // `ts` is refreshed every round; a gap larger than STALE_MS means you left the
  // loop (manually navigated away), so we drop the session rather than ambush
  // the next unrelated fight with auto-attacks.
  // ---------------------------------------------------------------------------
  function getSession() {
    try {
      const s = JSON.parse(sessionStorage.getItem(KEY));
      if (!s) return null;
      if (Date.now() - (s.ts || 0) > STALE_MS) { clearSession(); return null; }
      return s;
    } catch (e) { return null; }
  }
  function setSession(s) {
    s.ts = Date.now();
    try { sessionStorage.setItem(KEY, JSON.stringify(s)); } catch (e) { /* ignore */ }
  }
  function clearSession() {
    try { sessionStorage.removeItem(KEY); } catch (e) { /* ignore */ }
  }

  // ---------------------------------------------------------------------------
  // Remembered non-combat picks — keyed encounter-name -> option-label, in
  // localStorage so they outlive the session and apply on every future visit.
  // ---------------------------------------------------------------------------
  function getChoices() {
    try { return JSON.parse(localStorage.getItem(CKEY)) || {}; } catch (e) { return {}; }
  }
  function saveChoices(o) {
    try { localStorage.setItem(CKEY, JSON.stringify(o)); } catch (e) { /* ignore */ }
  }
  function rememberedChoice(ev) { return getChoices()[ev] || null; }
  function rememberChoice(ev, label) { const o = getChoices(); o[ev] = label; saveChoices(o); }
  function forgetChoice(ev) { const o = getChoices(); delete o[ev]; saveChoices(o); }

  // ---------------------------------------------------------------------------
  // Nav sidebar (sibling frame "nav") — source of max HP and the re-adventure URL.
  // On nav.php it's our own document; on fight.php it's top.nav. Probe by id so a
  // renamed/absent frame falls back to scanning every frame.
  // ---------------------------------------------------------------------------
  function navDoc() {
    if (onNav) return document;
    try { if (top.nav && top.nav.document.getElementById("hpstring")) return top.nav.document; } catch (e) { /* cross-frame */ }
    try {
      for (const f of top.frames) {
        try { if (f.document.getElementById("hpstring")) return f.document; } catch (e) { /* skip */ }
      }
    } catch (e) { /* no frames */ }
    return null;
  }

  function sidebarHP() {
    const d = navDoc();
    const el = d && d.getElementById("hpstring");
    const m = el && el.textContent.match(/(\d+)\s*\/\s*(\d+)/);
    return m ? { cur: +m[1], max: +m[2] } : null;
  }

  function sidebarPP() {
    const d = navDoc();
    const el = d && d.getElementById("ppstring");
    const m = el && el.textContent.match(/(\d+)\s*\/\s*(\d+)/);
    return m ? { cur: +m[1], max: +m[2] } : null;
  }

  // The "Last Area Patrolled:" label anchor is followed by the area's own link,
  // whose href (e.g. fight.php?location=66) is exactly the re-adventure URL.
  function adventureUrl() {
    const d = navDoc();
    if (!d) return null;
    const link = areaLinkIn(d);
    const href = link && link.getAttribute("href");
    return href ? new URL(href, location.origin + "/").href : null;
  }
  function areaLinkIn(doc) {
    const label = Array.from(doc.querySelectorAll("a")).find(a =>
      /last area patrolled/i.test(a.textContent));
    if (!label) return null;
    let el = label.nextElementSibling;
    while (el && el.tagName !== "A") el = el.nextElementSibling;
    return el || null;
  }

  // ---------------------------------------------------------------------------
  // Combat forms (fight.php). Each action form is identified by its hidden
  // <input name="choice">. The attack form also carries hidden hpstring/ppstring
  // = your *current* HP/PP this round, so we read those for the safety checks.
  // ---------------------------------------------------------------------------
  function formByChoice(value) {
    const inp = document.querySelector('input[name="choice"][value="' + value + '"]');
    return inp ? inp.form : null;
  }
  const attackForm = () => formByChoice("attack");
  const skillForm = () => formByChoice("skill");

  function hiddenInt(name) {
    const el = document.querySelector('input[type="hidden"][name="' + name + '"]');
    return el && /^\d+$/.test(el.value) ? +el.value : null;
  }

  // PP cost of a skill option lives in its text, e.g. "Ice Bolt (4 PP)".
  function skillCostOf(form, value) {
    const sel = form && form.querySelector('select[name="pickwhich"]');
    const opt = sel && Array.from(sel.options).find(o => o.value === String(value));
    const m = opt && opt.textContent.match(/(\d+)\s*PP/i);
    return m ? +m[1] : null;
  }

  // A combat victory result page carries <span id="result" data-xp=...> and the
  // text "win the combat" — positive proof the fight was won, so an adventure
  // chain may move on. This distinguishes a victory from the other no-attack-form
  // pages (a non-combat encounter, a defeat/"beaten up" page, an out-of-turns
  // message), none of which should auto-re-adventure.
  function isCombatVictory() {
    if (document.getElementById("result")) return true;
    return /win the combat|victory!/i.test(document.body.textContent || "");
  }

  // ---------------------------------------------------------------------------
  // Non-combat encounters (fight.php). A non-combat heads its result with an
  // <h2>Encounter Name</h2> (combat uses <h1>Combat!</h1>). Its options are a
  // radio group sharing name="choice" inside one form, each radio followed by
  // its label text, picked via a single submit button — e.g.
  //   <input type="radio" name="choice" value="1"> Exit stage left<br>...
  //   <input type="submit" value="Pick Your Exit">
  // We key a remembered pick on the encounter name (text only, so a wiki-links
  // "W" badge anchor in the <h2> doesn't pollute it) and on the option's own
  // label text, both stable across re-encounters; the live radio is re-located
  // and selected by that label rather than by its position or any one-time URL.
  // ---------------------------------------------------------------------------
  function norm(s) { return (s || "").replace(/\s+/g, " ").trim().toLowerCase(); }

  function encounterName() {
    const h2 = document.querySelector("h2");
    if (!h2) return null;
    let s = "";
    h2.childNodes.forEach(n => { if (n.nodeType === 3) s += n.textContent; });
    s = s.trim();
    return s || h2.textContent.trim() || null;
  }

  // The non-combat radio options (combat's name="choice" inputs are hidden, not
  // radios, so they never match — and attackForm() short-circuits combat anyway).
  function choiceOptions() {
    const radio = document.querySelector('form input[type="radio"][name="choice"]');
    return radio ? Array.from(radio.form.querySelectorAll('input[type="radio"][name="choice"]')) : [];
  }

  // An option's label is the run of text after its radio up to the next <br> /
  // control (e.g. " Exit stage left"); fall back to the radio value. A BUTTON is
  // a boundary too: our own "remember choice" button is injected between the
  // label and the <br>, and it must not be read into the label (or the stored
  // pick would never match it back on the next visit).
  function isLabelBoundary(n) {
    return n.nodeType === 1 && (n.tagName === "BR" || n.tagName === "INPUT" || n.tagName === "BUTTON");
  }
  function optionLabel(radio) {
    let s = "", n = radio.nextSibling;
    while (n && !isLabelBoundary(n)) {
      if (n.nodeType === 3 || n.nodeType === 1) s += n.textContent;
      n = n.nextSibling;
    }
    s = s.trim();
    return s || (radio.value || "");
  }
  function optionEnd(radio) {
    let n = radio.nextSibling;
    while (n && !isLabelBoundary(n)) n = n.nextSibling;
    return n; // the <br>/<input>/<button> that ends the option line, or null
  }
  function optionByLabel(label) {
    const want = norm(label);
    return choiceOptions().find(r => norm(optionLabel(r)) === want) || null;
  }

  // Select an option and submit its form (click the real submit so any handler
  // and the button's own name/value go along, falling back to form.submit()).
  function pickOption(radio) {
    radio.checked = true;
    const f = radio.form;
    const sub = f.querySelector('input[type="submit"], button[type="submit"], button:not([type])');
    if (sub) sub.click(); else f.submit();
  }

  // Beaten-up / out-of-turns pages also lack an attack form; keep auto-advance
  // from mistaking one for a harmless choiceless non-combat.
  function isDefeatOrOOT() {
    return /beaten up|been defeated|you lose\b|out of (?:turns|energy)|no (?:more )?turns|too (?:tired|weak)/i
      .test(document.body.textContent || "");
  }

  // HP as % of max: current from the per-round combat form when present (exact),
  // else from the sidebar; max always from the sidebar (it doesn't change). Null
  // if unreadable — the HP guard is best-effort and never blocks on a bad read.
  function hpPct() {
    const side = sidebarHP();
    const max = side ? side.max : null;
    const curHidden = hiddenInt("hpstring");
    const cur = curHidden != null ? curHidden : (side ? side.cur : null);
    if (cur == null || !max) return null;
    return (cur / max) * 100;
  }

  // ---------------------------------------------------------------------------
  // Buff upkeep — called on the fight-over screen (buffs can't be cast during a
  // combat round), when PP has filled up, to dump the full bar into the
  // shortest-duration buff. skills-cast-max.js tags each castable Active Effect
  // in the nav sidebar with a "+max" button (ordered shortest-duration-first,
  // so the topmost is the one most in need of a refresh) and clicking it recasts
  // that skill floor(PP / cost) times via a background fetch. We drive that
  // button rather than re-implement the skills.php scraping/casting it owns.
  // ---------------------------------------------------------------------------
  function maybeRefreshBuff() {
    const side = sidebarPP();
    if (!side || !side.max) return;                 // can't read PP — skip
    const curHidden = hiddenInt("ppstring");        // exact current PP if present
    const cur = curHidden != null ? curHidden : side.cur;
    if (cur < side.max) return;                     // only act at full PP
    const btn = topmostBuffMaxButton();
    if (!btn || btn.disabled) return;               // no castable buff (or mid-cast)
    // data-pp-cost is set only by skills-cast-max.js >= 1.5; when present, skip a
    // buff we couldn't afford one cast of (sidesteps its "not enough PP" alert).
    // When absent (older build) we still click — at full PP it's always castable.
    const cost = parseInt(btn.dataset.ppCost, 10);
    if (cost > 0 && cur < cost) return;
    btn.click();                                    // casts + reloads the nav frame
  }

  // The first "+max" button in document order in the nav frame = the topmost
  // (shortest-duration) castable Active Effect. Null if skills-cast-max.js hasn't
  // added any (no castable buffs active, or it hasn't finished its skills.php pass).
  function topmostBuffMaxButton() {
    const d = navDoc();
    return d ? d.querySelector(".th-effect-max") : null;
  }

  // ---------------------------------------------------------------------------
  // Actions — re-submit the real forms (server keys off the hidden choice value,
  // so .submit() without the submit button is enough, as skills-cast-max relies on).
  // ---------------------------------------------------------------------------
  function doAttack() {
    const f = attackForm();
    if (f) f.submit(); else clearSession();
  }
  function doSkill(value) {
    const f = skillForm();
    if (!f) return doAttack();
    const sel = f.querySelector('select[name="pickwhich"]');
    if (sel) sel.value = String(value);
    f.submit();
  }

  // ---------------------------------------------------------------------------
  // Stop banner + scheduled action. Each auto action waits ROUND_DELAY_MS behind
  // a visible Stop button, so an adventure-chain can be bailed out of mid-loop.
  // ---------------------------------------------------------------------------
  let pending = null;
  function stop(reason) {
    clearSession();
    if (pending) { clearTimeout(pending); pending = null; }
    // A reason means an early halt (low HP, cap, non-victory) — keep it on screen
    // so the loop never just "stops working" silently. No reason = normal finish.
    if (reason) showStopped(reason);
    else removeBanner();
  }
  function showBanner(label) {
    let b = document.getElementById("th-ac-banner");
    if (!b) {
      b = document.createElement("div");
      b.id = "th-ac-banner";
      b.style.cssText =
        "position:fixed;top:6px;right:6px;z-index:99999;background:#222;color:#fff;" +
        "font:12px arial,sans-serif;padding:6px 8px;border:1px solid #3366cc;border-radius:3px;";
      document.body.appendChild(b);
    }
    b.textContent = label + " ";
    const btn = document.createElement("button");
    btn.type = "button";
    btn.textContent = "Stop";
    btn.style.cssText = "margin-left:6px;cursor:pointer;";
    btn.addEventListener("click", stop);
    b.appendChild(btn);
  }
  function removeBanner() {
    const b = document.getElementById("th-ac-banner");
    if (b) b.remove();
  }
  function showStopped(reason) {
    let b = document.getElementById("th-ac-banner");
    if (!b) {
      b = document.createElement("div");
      b.id = "th-ac-banner";
      b.style.cssText =
        "position:fixed;top:6px;right:6px;z-index:99999;background:#222;color:#fff;" +
        "font:12px arial,sans-serif;padding:6px 8px;border:1px solid #cc3333;border-radius:3px;";
      document.body.appendChild(b);
    }
    b.style.borderColor = "#cc3333";
    b.textContent = "Auto-combat stopped: " + reason + " ";
    const x = document.createElement("button");
    x.type = "button";
    x.textContent = "×";
    x.style.cssText = "margin-left:6px;cursor:pointer;";
    x.addEventListener("click", removeBanner);
    b.appendChild(x);
  }
  function scheduleAction(label, fn) {
    showBanner(label);
    pending = setTimeout(() => { pending = null; fn(); }, ROUND_DELAY_MS);
  }

  // ---------------------------------------------------------------------------
  // The loop. Runs on every fight.php load; continues an active session.
  // ---------------------------------------------------------------------------
  function resume() {
    const s = getSession();
    if (!s) return;
    if (s.count >= CAP) return stop("safety cap (" + CAP + ") reached");

    if (attackForm()) {
      // Mid-combat round.
      const pct = hpPct();
      if (pct != null && pct < HP_FLOOR_PCT) {
        return stop("HP at " + Math.round(pct) + "% (floor " + HP_FLOOR_PCT + "%) — heal up, then restart");
      }
      s.count++; setSession(s);

      if (s.mode === "skill") {
        const cost = skillCostOf(skillForm(), s.skill);
        const pp = hiddenInt("ppstring");
        if (cost != null && pp != null && pp >= cost) {
          return scheduleAction("Auto-skill round " + s.count + " —", () => doSkill(s.skill));
        }
        // Can't afford the skill any more — fall back to plain Attack.
      }
      return scheduleAction("Auto-attack round " + s.count + " —", doAttack);
    }

    // No attack form: the fight ended, a non-combat loaded, or you were beaten.
    if (s.mode !== "adventure") return stop(); // single-fight modes finish here.

    // From here we might keep going, so honour the HP floor up front.
    const pct = hpPct();
    if (pct != null && pct < HP_FLOOR_PCT) {
      return stop("HP at " + Math.round(pct) + "% (floor " + HP_FLOOR_PCT + "%) — heal up, then restart");
    }

    // Confirmed combat victory → buffs are castable again now the fight is over,
    // so top up the shortest one if PP filled up, then on to the next fight.
    if (isCombatVictory()) { maybeRefreshBuff(); return readventure(s); }

    // Non-combat with options: auto-pick a remembered one, else hand control back
    // (the "remember choice" buttons are already on the page to teach it).
    const ev = encounterName();
    const opts = ev ? choiceOptions() : [];
    if (opts.length) {
      const remembered = rememberedChoice(ev);
      const radio = remembered ? optionByLabel(remembered) : null;
      if (!radio) return stop('non-combat "' + ev + '" — choose an option (use "remember choice" to automate it)');
      s.count++; setSession(s);
      return scheduleAction('Auto-choice "' + remembered + '" (' + s.count + ') —', () => pickOption(radio));
    }

    // Choiceless non-combat → auto-advance. A defeat / out-of-turns page also has
    // no options, so only roll on when the page actually reads as a non-combat.
    if (ev && !isDefeatOrOOT()) return readventure(s);

    return stop("non-combat, defeat, or out of turns — over to you");
  }

  // Continue an adventure chain by re-submitting the area link (one page load).
  function readventure(s) {
    const url = adventureUrl();
    if (!url) return stop("couldn't find the re-adventure link");
    s.count++; setSession(s);
    scheduleAction("Next fight (" + s.count + ") —", () => { location.href = url; });
  }

  // ---------------------------------------------------------------------------
  // Button injection (idempotent via ids).
  // ---------------------------------------------------------------------------
  function mkBtn(id, text) {
    const btn = document.createElement("button");
    btn.type = "button"; // never submit a form by merely existing inside it
    btn.id = id;
    btn.textContent = text;
    btn.style.cssText = "margin-left:6px;cursor:pointer;";
    return btn;
  }

  function injectCombatButtons() {
    const aForm = attackForm();
    if (aForm && !document.getElementById("th-ac-attack")) {
      const btn = mkBtn("th-ac-attack", "repeat attack until fight done");
      btn.addEventListener("click", () => {
        setSession({ mode: "attack", count: 0 });
        doAttack();
      });
      const sub = aForm.querySelector('input[type="submit"]');
      if (sub) sub.after(btn); else aForm.appendChild(btn);
    }

    const sForm = skillForm();
    if (sForm && !document.getElementById("th-ac-skill")) {
      const btn = mkBtn("th-ac-skill", "repeat skill until fight done");
      btn.addEventListener("click", () => {
        const sel = sForm.querySelector('select[name="pickwhich"]');
        const value = sel && sel.value;
        if (!value) { alert("Pick a skill first."); return; }
        setSession({ mode: "skill", skill: value, count: 0 });
        doSkill(value);
      });
      const sub = sForm.querySelector('input[type="submit"]');
      if (sub) sub.after(btn); else sForm.appendChild(btn);
    }
  }

  // On the fight-over screen (fight.php with no attack form) offer the
  // adventure-chain button near the top of the result.
  function injectFightOverButton() {
    if (attackForm()) return;
    if (document.getElementById("th-ac-adv-fight")) return;
    const url = adventureUrl();
    if (!url) return;
    const btn = mkBtn("th-ac-adv-fight", "adventure here again and attack until done");
    btn.style.marginLeft = "0";
    btn.addEventListener("click", () => startAdventure(url, true));
    const wrap = document.createElement("center");
    wrap.style.cssText = "margin:8px 0;";
    wrap.appendChild(btn);
    const heading = document.querySelector("h1, h2");
    if (heading) heading.after(wrap);
    else document.body.insertBefore(wrap, document.body.firstChild);
  }

  // On a non-combat encounter, drop a "remember choice" button beside each
  // option. Clicking it persists this encounter -> option pick and takes the
  // option now; thereafter an adventure chain auto-picks it. The currently
  // remembered option shows a "forget" toggle instead. Re-rendering is
  // idempotent — it clears its own buttons first, so a forget can refresh them.
  function injectChoiceButtons() {
    if (attackForm()) return;                  // combat round, not a choice page
    const ev = encounterName();
    if (!ev) return;
    const opts = choiceOptions();
    if (!opts.length) return;                  // choiceless non-combat
    document.querySelectorAll('[id^="th-ac-rem-"]').forEach(b => b.remove());
    const remembered = rememberedChoice(ev);
    opts.forEach((radio, i) => {
      const label = optionLabel(radio);
      const isRemembered = remembered != null && norm(label) === norm(remembered);
      const btn = mkBtn("th-ac-rem-" + i, isRemembered ? "★ remembered (forget)" : "remember choice");
      btn.style.fontSize = "10px";
      btn.addEventListener("click", () => {
        if (isRemembered) { forgetChoice(ev); injectChoiceButtons(); return; }
        rememberChoice(ev, label);
        pickOption(radio);                     // proceed with the chosen option
      });
      const end = optionEnd(radio);
      if (end) radio.parentNode.insertBefore(btn, end); else radio.parentNode.appendChild(btn);
    });
  }

  // In the nav sidebar, place the same button on the line below the area link.
  function injectNavAdventureButton() {
    if (document.getElementById("th-ac-adv-nav")) return;
    const areaLink = areaLinkIn(document);
    const url = adventureUrl();
    if (!areaLink || !url) return;
    const btn = mkBtn("th-ac-adv-nav", "adventure + attack until done");
    btn.style.cssText = "display:block;margin:3px 0;cursor:pointer;font-size:10px;";
    btn.addEventListener("click", () => startAdventure(url, false));
    // Drop it after the <br> that ends the area-link line (past any "W" badge).
    let node = areaLink;
    while (node && node.tagName !== "BR") node = node.nextSibling;
    const ref = node ? node.nextSibling : areaLink.nextSibling;
    areaLink.parentNode.insertBefore(btn, ref);
  }

  // A "remembered choices…" button in the nav sidebar opens the manager modal.
  // Sits under the adventure button when present; otherwise under the area link,
  // and failing that next to the HP line so it's always reachable.
  function injectChoiceManagerButton() {
    if (document.getElementById("th-ac-mgr-btn")) return;
    const btn = mkBtn("th-ac-mgr-btn", "remembered choices…");
    btn.style.cssText = "display:block;margin:3px 0;cursor:pointer;font-size:10px;";
    btn.addEventListener("click", openChoiceManager);
    const advBtn = document.getElementById("th-ac-adv-nav");
    if (advBtn) { advBtn.after(btn); return; }
    const areaLink = areaLinkIn(document);
    if (areaLink) {
      let node = areaLink;
      while (node && node.tagName !== "BR") node = node.nextSibling;
      const ref = node ? node.nextSibling : areaLink.nextSibling;
      areaLink.parentNode.insertBefore(btn, ref);
      return;
    }
    const hp = document.getElementById("hpstring");
    if (hp && hp.parentNode) hp.parentNode.appendChild(btn);
    else document.body.appendChild(btn);
  }

  // The nav frame is narrow, so host the modal in the wide main content frame
  // (same origin) when we're in the sidebar; otherwise the current document.
  function modalDoc() {
    if (onNav) {
      try { if (top.main && top.main.document.body) return top.main.document; } catch (e) { /* cross-frame */ }
      try {
        for (const f of top.frames) {
          try { if (f.name === "main" && f.document.body) return f.document; } catch (e) { /* skip */ }
        }
      } catch (e) { /* no frames */ }
    }
    return document;
  }

  function openChoiceManager() {
    const doc = modalDoc();
    const existing = doc.getElementById("th-ac-mgr");
    if (existing) existing.remove(); // toggle/rebuild fresh
    const ov = doc.createElement("div");
    ov.id = "th-ac-mgr";
    ov.style.cssText =
      "position:fixed;inset:0;z-index:100000;background:rgba(0,0,0,0.5);" +
      "display:flex;align-items:flex-start;justify-content:center;";
    ov.addEventListener("click", e => { if (e.target === ov) ov.remove(); }); // backdrop closes
    const panel = doc.createElement("div");
    panel.style.cssText =
      "background:#fff;color:#000;font:12px arial,sans-serif;margin-top:40px;max-height:80vh;" +
      "overflow:auto;min-width:320px;max-width:90vw;padding:12px 14px;border:1px solid #3366cc;" +
      "border-radius:4px;box-shadow:0 4px 16px rgba(0,0,0,0.4);";
    ov.appendChild(panel);
    renderManager(doc, panel, ov);
    doc.body.appendChild(ov);
  }

  function renderManager(doc, panel, ov) {
    panel.textContent = "";
    const choices = getChoices();
    const keys = Object.keys(choices).sort((a, b) => a.localeCompare(b));

    const head = doc.createElement("div");
    head.style.cssText = "display:flex;align-items:center;justify-content:space-between;margin-bottom:8px;";
    const title = doc.createElement("b");
    title.textContent = "Remembered non-combat choices (" + keys.length + ")";
    head.appendChild(title);
    const close = doc.createElement("button");
    close.type = "button"; close.textContent = "×";
    close.style.cssText = "cursor:pointer;border:0;background:none;font-size:16px;line-height:1;";
    close.addEventListener("click", () => ov.remove());
    head.appendChild(close);
    panel.appendChild(head);

    if (!keys.length) {
      const empty = doc.createElement("div");
      empty.textContent = "Nothing remembered yet. Use “remember choice” on a non-combat encounter.";
      empty.style.cssText = "padding:6px 0;color:#555;";
      panel.appendChild(empty);
      return;
    }

    keys.forEach(k => {
      const row = doc.createElement("div");
      row.style.cssText = "display:flex;align-items:center;gap:8px;padding:4px 0;border-top:1px solid #eee;";
      const txt = doc.createElement("span");
      txt.style.cssText = "flex:1;";
      const ev = doc.createElement("b"); ev.textContent = k;
      txt.appendChild(ev);
      txt.appendChild(doc.createTextNode(" → " + choices[k]));
      row.appendChild(txt);
      const del = doc.createElement("button");
      del.type = "button"; del.textContent = "Delete";
      del.style.cssText = "cursor:pointer;";
      del.addEventListener("click", () => { forgetChoice(k); renderManager(doc, panel, ov); });
      row.appendChild(del);
      panel.appendChild(row);
    });

    const footer = doc.createElement("div");
    footer.style.cssText = "margin-top:10px;text-align:right;border-top:1px solid #ccc;padding-top:8px;";
    const all = doc.createElement("button");
    all.type = "button"; all.textContent = "Delete all";
    all.style.cssText = "cursor:pointer;";
    all.addEventListener("click", () => {
      if (confirm("Delete all " + keys.length + " remembered choices?")) {
        saveChoices({}); renderManager(doc, panel, ov);
      }
    });
    footer.appendChild(all);
    panel.appendChild(footer);
  }

  function startAdventure(url, navigateSelf) {
    // if (!confirm("Adventure here repeatedly and auto-attack until your HP is low, a non-combat encounter shows up, or you run out of turns?")) {
    //   return;
    // }
    setSession({ mode: "adventure", count: 0 });
    if (navigateSelf) { location.href = url; return; }
    // From the nav frame, drive the main content frame the way the game's own
    // links do (target="main") rather than reaching across frames by name.
    const a = document.createElement("a");
    a.href = url;
    a.target = "main";
    document.body.appendChild(a);
    a.click();
    a.remove();
  }

  // ---------------------------------------------------------------------------
  // Dispatch
  // ---------------------------------------------------------------------------
  if (onFight) {
    injectCombatButtons();
    injectFightOverButton();
    injectChoiceButtons();
    resume();
  } else if (onNav) {
    injectNavAdventureButton();
    injectChoiceManagerButton();
  }
})();
