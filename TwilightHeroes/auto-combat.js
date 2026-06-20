// ==UserScript==
// @name         Twilight Heroes - Auto-Combat
// @author       Tilo
// @namespace    https://github.com/TiloBuechsenschuss
// @downloadURL  https://raw.githubusercontent.com/TiloBuechsenschuss/userscripts/refs/heads/main/TwilightHeroes/auto-combat.js
// @version      1.0
// @description  Adds three combat automation buttons. On fight.php: "repeat attack until fight done" next to the Attack button, and "repeat skill until fight done" next to the Use-a-Skill button (each re-issues that action every round until the fight ends). "adventure here again and attack until done" appears on the fight-over screen and below the Last Area Patrolled link in the nav sidebar; it re-adventures the same location and auto-attacks, fight after fight, until you hit a non-combat encounter, your HP drops below a threshold, or you run out of turns. Loops by re-submitting the real forms (one visible page reload per round) with a brief Stop window each round; HP is read from the per-round combat form and the sidebar.
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

    // No attack form: the fight ended or a non-combat encounter loaded.
    if (s.mode !== "adventure") return stop(); // single-fight modes finish here.

    // Adventure-chain. Re-adventure only after a confirmed combat victory; every
    // other no-attack-form page (non-combat encounter, defeat, out of turns) needs
    // your attention, so stop and hand control back.
    if (!isCombatVictory()) return stop("non-combat, defeat, or out of turns — over to you");
    const pct = hpPct();
    if (pct != null && pct < HP_FLOOR_PCT) {
      return stop("HP at " + Math.round(pct) + "% (floor " + HP_FLOOR_PCT + "%) — heal up, then restart");
    }
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
    resume();
  } else if (onNav) {
    injectNavAdventureButton();
  }
})();
