// ==UserScript==
// @name         KoL IotM Menu
// @author       Tilo
// @namespace    https://github.com/TiloBuechsenschuss
// @downloadURL  https://raw.githubusercontent.com/TiloBuechsenschuss/userscripts/refs/heads/main/KingdomOfLoathing/iotm.js
// @version      1.22
// @description  Adds an "IotM" button to the KoL icon menu that opens a small popup of Item-of-the-Month actions: fire the Codpiece (inventory.php?action=docodpiece), play ball at the baseball diamond (highlighted when a ball is available), and drink from the Cup of 13s. Also adds sort buttons to the Cup of 13s ingredient dropdowns (choice.php whichchoice=1601), and keeps the Eternity Codpiece decoration tools (choice.php whichchoice=1588) for setting every gem slot at once and saving/loading gem setups.
// @match        https://www.kingdomofloathing.com/awesomemenu.php*
// @match        https://kingdomofloathing.com/awesomemenu.php*
// @match        https://www.kingdomofloathing.com/topmenu.php*
// @match        https://kingdomofloathing.com/topmenu.php*
// @match        https://www.kingdomofloathing.com/choice.php*
// @match        https://kingdomofloathing.com/choice.php*
// @grant        none

// ==/UserScript==

(function () {
  'use strict';

  // --- Configuration ---------------------------------------------------
  // Eternity Codpiece item icon, inlined as a data URI so it needs no network
  // fetch (and isn't subject to a page CSP blocking external hosts). The source
  // GIF is kept in the repo at assets/eternitycod.gif for reference; this is its
  // base64. Used as the Codpiece action's face in the popup.
  const CODPIECE_ICON =
    'data:image/gif;base64,R0lGODlhHgAeAIMAAAAAAAgICBQUFCEhITExMU5OTnNzc5ycnL2' +
    '9vc7OztbW1t7e3ufn5+/v7/f39////yH5BAAAAP8ALAAAAAAeAB4AAAT/8MlJq7046827/2Ao' +
    'juRzGInkWAXBaMrxOgIQEINgGIekAACBYtJIHI4DYOGBCB4KwCggOQUYGgdCLRrYMgiAXlPAS' +
    'CAMVEVAeoMCEA/wolZAQAWV1gM6MCAaDw1ACAtJCCdbAAQNBQJwA0tqAgsGAVdrUnAPCQZQBQ' +
    'dABAtWEgZWUAE/UwV1FaYHCjU8bz42TwgJQCkXpgUrElALE1A9DqAAuxYMdC8MAUsTY41AAoA' +
    'YYLZQQw0vuVIA0BgHieBMNQcN2M/oG8ZUPabluQEvIKBwCQMDmmsi9xdJrH1gAE5gDDADRhwY' +
    'cENLFEckFhTApAPBrxIOuF0swbGjx48fAiIAADs=';

  // Baseball diamond and Cup of 13s item icons, inlined as data URIs for the
  // same reason as the codpiece icon above (no network fetch, CSP-proof). The
  // source PNGs are kept in the repo at assets/baseball.png and
  // assets/cupof13s.png for reference; these are their base64.
  const BALL_ICON =
    'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAB4AAAAeCAYAAAA7MK6iAAAAAXNS' +
    'R0IArs4c6QAAAARnQU1BAACxjwv8YQUAAAAJcEhZcwAADsMAAA7DAcdvqGQAAAI8SURBVEhLnZ' +
    'fNjQIxDEbnyJECaIRGaIR2aIMjDVACDXDkyDGrF+khb7Azs/tJ1kDi+PNfJpml/QHv97u9Xq/2' +
    'fD673O/3drvd2vV6befzuZ1Op/5kbA3LODDi8Xi0w+HQdrtdl2VZVmW/3/d1M0yJiQjSaJT/RK' +
    'YQIXK5XLrwWz2yUqEkJn1EiAEcQNaiEJLjGOXJkBLjOQuPx2N3YCsp9bfukGIDJzJ8EUtKpJDF' +
    'JpqRo4cOgj7/cbwi/0VMdJFUkC4NZnBeHdNrY2KTgCI+xHhINyIZAUYwTDpHOJdlZIxcpzpxnC' +
    'TqDKYy61RLUTUS49bcoDrxrBaiIiYDszII5mPKOzHpZTBLlaiIre9sLUiJbYDZ4qrGa40nWO/e' +
    'Bp3Y/GOgwqyOzo1ORTD3ReybpmqstTpahriVRqDzZ2LTPNY3Qp3KuTTVM+K1aCNmDk6JsxrPjI' +
    '0gzVW9p8RZVFujFdVbzBqzg3CwE3swjKneulUiKmIAB0fth9jNPRI7V22jEfZDVRo4kB49A55K' +
    '4wkCtmwVgJ5OZtHGmwnoxG7u8TgUGuQJAfpKJKzKYmCcCWbicyx61eG9nXW3kVeiUyMIxOM2Bv' +
    'UhBixGAQeyepNqjGMAXYTfjGVlYM5zYLT3ixjgvZFnad8KnJE0O26/iEG8Ao0vgi2IkWYNC1Ji' +
    '4N6eXVEjcJY1PGflEiVxvK7QjV7c42Wecb8y3KNmKuvuiJIYQO61KBM/a4gQMnSRLb0xJQY0iZ' +
    '8mPO1i9/N/8QOomu135/fVUgAAAABJRU5ErkJggg==';

  const CUP13_ICON =
    'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAB4AAAAeCAYAAAA7MK6iAAAAAXNS' +
    'R0IArs4c6QAAAARnQU1BAACxjwv8YQUAAAAJcEhZcwAADsMAAA7DAcdvqGQAAAIFSURBVEhLrZ' +
    'e7rcJAEEUdUgANuADKoBkqohlaICQkJSQk3KeDdNBotD/zuNLIi9eeO/81S/knXq9Xud/v5fF45' +
    'K0ulnyjBQgul0s5nU5vOR6PZV3XstvtyrIsb2HNPfbO53N5Pp9ZzQdD4uv1+iba7/cfAgTlGhA' +
    'lPnc4HLK6D5rEhA/FUQle3G63rieAsOM57xGlGqrEeKnlkPObUHOFXE8xJopR4BnWvM+6hioxS' +
    'nwJ62uhnpVNHmsthIbsG6HYWmmpEhPSrGRWIDMNRKmFKjEwtLllsthC5pbig5j7X1W1FW2eUUi' +
    '+ENZEhXUsNoyNRnK/hSYxCrNnUbLnkOKhRmh0C01i2sfqzsPC6YViBM8tItYa1yos0CQGeo0BG' +
    'DICKTAaPW9BlxgYNgqoN3/11AiNMCRmdBpyxYOAcNs27nG/ZVzEkFjEuV0TvaXaZzBNjCd4Gtv' +
    'I9qLduM7kVkwTewi04LTr9W7ENDGeEE4qtwZT8XNiCsbxaQ8T4nhus8fvGUwTA8hzhSsY1ToCa' +
    '9hEDCwivKONbKXZohKbiZ1mXJlmhHtLbsUm4hhqc+lMJwKzPQymiVEaP4nynkeikRhhSIxS5zX' +
    'S6mXbjWcwIhuXMSQ2p5L2vIljdZTzITHFE72B3PPXLxP2Y5vZ4z0MiQVkUXntK4T92V6eJgbx/' +
    '5Oz2ym2paLBH92CFUryT2pEAAAAAElFTkSuQmCC';

  // Face for the IotM menu button itself. Source GIF kept at assets/mracc.gif.
  const IOTM_ICON =
    'data:image/gif;base64,R0lGODlhHgAeAKIAAAgICDU1NW9vb7W1tdbW1ufn5/f39////yH5' +
    'BAAAAAAALAAAAAAeAB4AAAPHeLrc/jDK6Qy9pwgRBp4CIAKC9T3hQASAdzbG0B6y8DoEOYTdU' +
    'NwKzUjE6tyEAgLtZ0idmgElKvC7QKuLHcFgCNgunEJzYCmMlDKppNAx5Fqxkaf7XZgYuZ8MQH' +
    '3PDjkuEXkZI1w8ahsTMhZNJAcGBSoMHIsAVZF3DpUSXYIOkiYhmg8DAXeTGSwunBFcfwchG0V' +
    'SXhemVQQcAR1VaRdsJQpcw0G8HysCBVgLK1Enzr1lPJ8YMbu8vKlABQQD3yqkQHbj5eYRCQA7';

  // If true, an action's result page is shown in the mainpane.
  // If false, the request fires silently in the background.
  const SHOW_RESULT_IN_MAINPANE = true;

  // Baseball diamond: plays ball. (firePath appends the pwd hash.)
  const BASEBALL_URL = '/inventory.php?action=pball';
  // The Baseball Diamond item description lists the current team; a full team of
  // this many players means an inning can be played (button gets highlighted).
  const BASEBALL_DESC_URL = '/desc_item.php?whichitem=229573660';
  const BASEBALL_FULL_TEAM = 9;

  // Cup of 13s: drinks from it. (firePath appends the pwd hash.)
  const CUP13_URL = '/inventory.php?action=cupof13s';
  // ----------------------------------------------------------------------

  // === pwd hash discovery (frameset-aware) =============================
  function getPwd() {
    // 1. awesomemenu has hidden <input name="pwd"> fields in its config forms.
    const inp = document.querySelector('input[name="pwd"]');
    if (inp && inp.value) return inp.value;

    // 2. Page globals (`pwdhash` or `pwd`), if defined globally.
    if (typeof window.pwdhash === 'string' && window.pwdhash.length > 0) {
      return window.pwdhash;
    }
    if (typeof window.pwd === 'string' && window.pwd.length > 0) {
      return window.pwd;
    }

    // 3. Any link in this frame carrying pwd=
    const link = document.querySelector('a[href*="pwd="]');
    if (link) {
      const m = link.getAttribute('href').match(/[?&]pwd=([0-9a-fA-F]+)/);
      if (m) return m[1];
    }

    // 4. The charpane usually defines pwdhash.
    try {
      const cp = top.frames['charpane'];
      if (cp && typeof cp.pwdhash === 'string' && cp.pwdhash.length > 0) {
        return cp.pwdhash;
      }
    } catch (e) { /* ignore */ }

    // 5. Inline script text (matches e.g. `var pwd = "...";`).
    const m2 = document.documentElement.innerHTML.match(
      /pwd(?:hash)?\s*=\s*["']([0-9a-fA-F]+)["']/
    );
    return m2 ? m2[1] : null;
  }

  // Append the pwd hash to a path, or null if it can't be found.
  function withPwd(path) {
    const pwd = getPwd();
    if (!pwd) return null;
    const sep = path.indexOf('?') === -1 ? '?' : '&';
    return path + sep + 'pwd=' + pwd;
  }

  // Navigate the mainpane to a URL (frameset), falling back to a silent
  // background fetch when SHOW_RESULT_IN_MAINPANE is off or the frame is
  // unreachable.
  function goMainpane(url) {
    if (SHOW_RESULT_IN_MAINPANE) {
      try {
        top.frames['mainpane'].location.href = url;
        return;
      } catch (e) {
        console.warn('IotM menu: could not navigate mainpane, ' +
                     'falling back to background request.', e);
      }
    }
    fetch(url, { credentials: 'same-origin' })
      .then(function (res) {
        console.log('IotM action sent, HTTP ' + res.status);
      })
      .catch(function (err) {
        console.error('IotM action failed:', err);
      });
  }

  // Fire a pwd-gated action path (append pwd, then navigate/fetch). Shared by
  // the popup actions below.
  function firePath(path) {
    const url = withPwd(path);
    if (!url) {
      alert('IotM menu: could not determine pwd hash.');
      return;
    }
    goMainpane(url);
  }

  // === IotM actions (the popup contents) ===============================
  // Each entry renders one button in the popup. `run()` performs the action;
  // optional `icon` shows an image face (else the label text); optional
  // `highlightState()` returns a highlight kind ('ready' | 'spent') -- or a
  // Promise of one -- to draw attention to the button (else null for none).

  // Resolve true when a full baseball team is assembled (an inning can be
  // played). The item description page lists the current team as
  // <li data-monster-id> entries; a team of BASEBALL_FULL_TEAM can play. The
  // fetch is credentialed (same-origin) so the logged-in session returns the
  // real description; any failure resolves false (leaves the button un-lit).
  function ballCanBePlayed() {
    return fetch(BASEBALL_DESC_URL, { credentials: 'same-origin' })
      .then(function (res) { return res.ok ? res.text() : ''; })
      .then(function (html) {
        if (!html) return false;
        const doc = new DOMParser().parseFromString(html, 'text/html');
        const players = doc.querySelectorAll(
          '#description li[data-monster-id]');
        return players.length >= BASEBALL_FULL_TEAM;
      })
      .catch(function (e) {
        console.warn('IotM menu: baseball team check failed', e);
        return false;
      });
  }

  // --- Baseball "spent for the day" tracking ---------------------------
  // The diamond allows a limited number of innings per day. There's no reliable
  // page flag for it, so we detect the refusal message when a pitch is rejected
  // (see playBall) and remember it for the rest of the KoL day in localStorage.
  const BALL_SPENT_KEY = 'tm-iotm-ball-spent';
  const BALL_EXHAUSTED_RE =
    /already pitched .*innings today|blow out your shoulder/i;

  // A day stamp that rolls at KoL's ~3:30am Pacific reset: shift "now" back by
  // that offset and take the resulting calendar date, so the flag self-clears
  // at rollover rather than local midnight.
  function kolDayStamp() {
    const now = Date.now();
    // Pacific is UTC-8/-7; approximate rollover as UTC-11 so ~3:30am PT lands on
    // the date boundary regardless of DST. Good enough for a daily self-clear.
    const shifted = new Date(now - 11 * 3600 * 1000);
    return shifted.getUTCFullYear() + '-' + (shifted.getUTCMonth() + 1) + '-' +
      shifted.getUTCDate();
  }
  function ballExhaustedToday() {
    try { return localStorage.getItem(BALL_SPENT_KEY) === kolDayStamp(); }
    catch (e) { return false; }
  }
  function markBallExhaustedToday() {
    try { localStorage.setItem(BALL_SPENT_KEY, kolDayStamp()); }
    catch (e) { /* storage unavailable */ }
  }

  // Play an inning: fire once, show the result in the mainpane, and sniff the
  // response for the "already pitched N innings" refusal to mark the diamond
  // spent for the day. Firing exactly once matters -- a successful pitch
  // consumes a daily inning -- so we never re-request to read the result.
  function playBall() {
    const url = withPwd(BASEBALL_URL);
    if (!url) {
      alert('IotM menu: could not determine pwd hash.');
      return;
    }
    let mp = null;
    try { mp = top.frames['mainpane']; } catch (e) { mp = null; }
    if (SHOW_RESULT_IN_MAINPANE && mp) {
      try {
        mp.location.href = url;
        sniffBallResult();   // watch the resulting page for the refusal message
        return;
      } catch (e) {
        console.warn('IotM menu: could not navigate mainpane for Play Ball.', e);
      }
    }
    // Background fallback (no visible result): fetch, sniff, done.
    fetch(url, { credentials: 'same-origin' })
      .then(function (res) { return res.ok ? res.text() : ''; })
      .then(function (html) {
        if (BALL_EXHAUSTED_RE.test(html)) markBallExhaustedToday();
      })
      .catch(function (err) { console.error('IotM Play Ball failed:', err); });
  }

  // Poll the mainpane document for the daily-limit refusal after a Play Ball
  // navigation. A `load` listener is unreliable here: assigning
  // mainpane.location replaces its window, discarding any listener attached to
  // it, so it'd never fire. Re-reading top.frames['mainpane'].document each tick
  // sidesteps that -- the WindowProxy always resolves to the current document.
  // Stops as soon as the message is seen, or after a few seconds.
  function sniffBallResult() {
    let tries = 0;
    const timer = setInterval(function () {
      tries++;
      let txt = '';
      try {
        const mp = top.frames['mainpane'];
        if (mp && mp.document && mp.document.body) {
          txt = mp.document.body.textContent || '';
        }
      } catch (e) { /* cross-frame not ready yet */ }
      if (BALL_EXHAUSTED_RE.test(txt)) {
        markBallExhaustedToday();
        clearInterval(timer);
      } else if (tries >= 25) {   // ~5s at 200ms
        clearInterval(timer);
      }
    }, 200);
  }

  // Baseball button highlight: 'spent' (subdued) once exhausted for the day,
  // else 'ready' (strong) when a full team can play, else none. Exhaustion is a
  // synchronous localStorage check and takes precedence over the async team
  // check so a spent diamond never shows the strong "go play" highlight.
  function baseballHighlight() {
    if (ballExhaustedToday()) return 'spent';
    return ballCanBePlayed().then(function (ok) { return ok ? 'ready' : null; });
  }

  const ACTIONS = [
    {
      key: 'codpiece',
      label: 'Codpiece',
      title: 'Codpiece (inventory.php?action=docodpiece)',
      icon: CODPIECE_ICON,
      run: function () { firePath('/inventory.php?action=docodpiece'); }
    },
    {
      key: 'baseball',
      label: 'Play Ball',
      title: 'Play ball at the baseball diamond',
      icon: BALL_ICON,
      run: playBall,
      highlightState: baseballHighlight
    },
    {
      key: 'cup13',
      label: 'Cup of 13s',
      title: 'Drink from the Cup of 13s',
      icon: CUP13_ICON,
      run: function () { firePath(CUP13_URL); }
    }
  ];

  // === IotM button + popup UI ==========================================

  // Restore a compact text-label look (used as the icon's fallback / for the
  // main IotM button).
  function styleAsTextButton(btn) {
    btn.style.cssText = [
      'padding:0 4px',
      'font-size:9px',
      'font-family:arial',
      'height:14px',
      'line-height:12px',
      'cursor:pointer',
      'white-space:nowrap'
    ].join(';');
  }

  // Draw attention to an action button. `kind` picks the treatment:
  //   'spent' -- subdued/muted (e.g. the diamond is used up for the day)
  //   'ready' (default) -- strong, hard-to-miss (e.g. a ball is ready to play)
  function highlightButton(btn, kind) {
    if (kind === 'spent') {
      btn.style.borderColor = '#8a97a8';
      btn.style.background = '#e9edf2';
      btn.style.color = '#556';
      btn.style.boxShadow = 'none';
      btn.style.fontWeight = 'normal';
      btn.style.opacity = '0.85';
      return;
    }
    // 'ready': bright green with a bold glow -- much stronger than the old
    // subtle yellow.
    btn.style.borderColor = '#1f9d1f';
    btn.style.background = '#b8f5b0';
    btn.style.color = '#0a3d0a';
    btn.style.boxShadow = '0 0 7px 2px #2ecc40';
    btn.style.fontWeight = 'bold';
  }

  // Build one action button for inside the popup. `d` is the document the popup
  // lives in (the mainpane frame; see openPopup), so create nodes there.
  function makeActionButton(action, d) {
    const btn = d.createElement('button');
    btn.type = 'button';
    btn.title = action.title || action.label;
    btn.style.cssText = [
      'display:inline-flex',
      'align-items:center',
      'gap:4px',
      'padding:2px 6px',
      'font-size:10px',
      'font-family:arial',
      'cursor:pointer',
      'white-space:nowrap',
      'background:white',
      'border:1px solid #999',
      'border-radius:3px'
    ].join(';');

    if (action.icon) {
      const img = d.createElement('img');
      img.src = action.icon;
      img.alt = action.label;
      img.width = 16;
      img.height = 16;
      img.style.display = 'block';
      btn.appendChild(img);
    }
    const span = d.createElement('span');
    span.textContent = action.label;
    btn.appendChild(span);

    // Highlight per the action's state. `highlightState` returns a kind
    // ('ready' | 'spent'), null for none, or a Promise of one (the baseball
    // check fetches the item description). Apply synchronously or once resolved.
    // The popup is rebuilt each open, so this re-checks freshly every time.
    if (typeof action.highlightState === 'function') {
      const st = action.highlightState();
      if (st && typeof st.then === 'function') {
        st.then(function (kind) { if (kind) highlightButton(btn, kind); })
          .catch(function () { /* leave un-highlighted */ });
      } else if (st) {
        highlightButton(btn, st);
      }
    }

    btn.addEventListener('click', function () {
      closePopup();
      try {
        action.run();
      } catch (e) {
        console.error('IotM action "' + action.key + '" failed:', e);
      }
    });
    return btn;
  }

  // Module-level popup teardown handle (removes listeners + node).
  let popupCleanup = null;

  function closePopup() {
    if (popupCleanup) {
      popupCleanup();
      popupCleanup = null;
    }
  }

  // Pick a document to render the popup into. This menu frame is only a thin
  // bar, so a stacked popup overflowing it gets clipped by the frame boundary
  // (and hidden behind the mainpane frame). Render into the mainpane document
  // instead -- a roomy, normal document -- overlaid with position:fixed. Falls
  // back to this frame's own document if mainpane is unreachable.
  function popupDoc() {
    try {
      const mp = top.frames['mainpane'];
      if (mp && mp.document && mp.document.body) return mp.document;
    } catch (e) { /* cross-frame access failed; fall back */ }
    return document.body ? document : null;
  }

  function openPopup(anchorBtn) {
    closePopup();

    const d = popupDoc();
    if (!d) return;

    const pop = d.createElement('div');
    pop.id = 'tm-iotm-popup';
    pop.style.cssText = [
      'position:fixed',
      'z-index:99999',
      'display:flex',
      'flex-direction:column',
      'gap:3px',
      'padding:5px',
      'background:#f5f5ff',
      'border:1px solid blue',
      'border-radius:3px',
      'box-shadow:0 2px 6px rgba(0,0,0,0.3)'
    ].join(';');

    ACTIONS.forEach(function (a) {
      pop.appendChild(makeActionButton(a, d));
    });

    d.body.appendChild(pop);

    // Open to the LEFT of the IotM button. The button lives in the menu bar
    // above the mainpane; both share the window's left origin, so the button's
    // x maps across. Place the popup's right edge just left of the button and
    // pin it near the top of the mainpane (the button sits just above it).
    // Clamp to the mainpane's left edge so it never spills off-screen.
    const r = anchorBtn.getBoundingClientRect();
    const popW = pop.offsetWidth;
    let left = r.left - popW - 4;
    if (left < 2) left = 2;
    pop.style.left = left + 'px';
    pop.style.top = '4px';

    // Close on outside click or Escape. The popup is in the mainpane document
    // but the anchor button is in this (menu) one, so watch both.
    function onDocClick(e) {
      if (pop.contains(e.target) || anchorBtn.contains(e.target)) return;
      closePopup();
    }
    function onKey(e) {
      if (e.key === 'Escape') closePopup();
    }
    const docs = d === document ? [document] : [d, document];
    // Defer binding the click handler so the opening click doesn't immediately
    // close the popup.
    setTimeout(function () {
      docs.forEach(function (doc) {
        doc.addEventListener('mousedown', onDocClick, true);
      });
    }, 0);
    docs.forEach(function (doc) {
      doc.addEventListener('keydown', onKey, true);
    });

    popupCleanup = function () {
      docs.forEach(function (doc) {
        doc.removeEventListener('mousedown', onDocClick, true);
        doc.removeEventListener('keydown', onKey, true);
      });
      if (pop.parentNode) pop.parentNode.removeChild(pop);
    };
  }

  // Restore a compact text-label look, used if the IotM icon can't render.
  function styleAsTextButton(btn) {
    btn.style.cssText = [
      'padding:0 4px',
      'font-size:9px',
      'font-family:arial',
      'height:14px',
      'line-height:12px',
      'cursor:pointer',
      'white-space:nowrap'
    ].join(';');
  }

  function makeIotmButton() {
    const btn = document.createElement('button');
    btn.id = 'tm-iotm-btn';
    btn.type = 'button';
    btn.title = 'IotM actions';
    btn.style.cssText = [
      'padding:1px 2px',
      'height:22px',
      'line-height:0',
      'cursor:pointer',
      'white-space:nowrap',
      'display:inline-flex',
      'align-items:center'
    ].join(';');

    const img = document.createElement('img');
    img.src = IOTM_ICON;
    img.alt = 'IotM';
    img.width = 18;
    img.height = 18;
    img.style.display = 'block';
    // If the icon can't load, drop back to a plain text label so the button is
    // never blank.
    img.addEventListener('error', function () {
      if (img.parentNode === btn) btn.removeChild(img);
      btn.textContent = 'IotM';
      styleAsTextButton(btn);
    });
    btn.appendChild(img);

    btn.addEventListener('click', function () {
      // Toggle: a second click on the button closes an open popup.
      if (popupCleanup) {
        closePopup();
      } else {
        openPopup(btn);
      }
    });
    return btn;
  }

  // Shared button row under the edit icon. The IotM and daily-checklist scripts
  // each install independently, so they cooperate through a single
  // absolutely-positioned flex container (created by whichever runs first) and
  // claim their slot with CSS `order` -- making the left-to-right arrangement
  // independent of DOM insertion order / which script loads first. Returns the
  // row, or null in text-mode topmenu where #fixedawesome is absent.
  function getButtonRow() {
    let row = document.getElementById('tm-kol-menu-btns');
    if (row) return row;
    const fixed = document.getElementById('fixedawesome');
    const editLink = document.querySelector('#fixedawesome a.config');
    if (!fixed || !editLink) return null;
    // #fixedawesome is position:absolute, so an absolutely positioned child is
    // placed relative to it without disturbing the inline row of icons. The
    // edit icon is 30px tall; hang the row just below it, left-aligned with it.
    row = document.createElement('div');
    row.id = 'tm-kol-menu-btns';
    row.style.cssText = [
      'position:absolute',
      'top:31px',
      'left:' + Math.max(0, editLink.offsetLeft) + 'px',
      'z-index:3',
      'display:flex',
      'gap:3px',
      'align-items:flex-start'
    ].join(';');
    fixed.appendChild(row);
    return row;
  }

  function addButton() {
    if (document.getElementById('tm-iotm-btn')) return;

    const btn = makeIotmButton();
    const row = getButtonRow();
    if (row) {
      // Sit to the right of the checklist button (order 1) when both load.
      btn.style.order = '2';
      btn.style.backgroundColor = 'white';
      row.appendChild(btn);
      return;
    }

    // Text-mode topmenu fallback: place after the checklist button if it's
    // already there (keeping IotM to its right), else after a plain "edit" link.
    const cl = document.getElementById('tm-checklist-btn');
    if (cl) {
      cl.insertAdjacentElement('afterend', btn);
      return;
    }
    const links = document.querySelectorAll('a');
    for (const a of links) {
      const t = a.textContent.trim().toLowerCase().replace(/^\[|\]$/g, '');
      if (t === 'edit') {
        a.insertAdjacentElement('afterend', btn);
        return;
      }
    }

    console.warn('IotM menu: no anchor point found, ' +
                 'placing button at top of frame.');
    document.body.insertBefore(btn, document.body.firstChild);
  }

  // === Decoration screen (choice.php, whichchoice=1588) ================
  // Adds a panel that can set every gem slot to one chosen gem in a single
  // click, and save / load named gem setups in localStorage.

  const WHICHCHOICE = '1588';
  const SETUPS_KEY = 'tm-codpiece-setups';

  // Gem categories for the "Set every slot to" dropdown filter. Each gem is
  // sorted into exactly one bucket by matching keywords in its label text (the
  // same text KoL renders, e.g. "+10% Item Drops from Monsters"); this keeps
  // the buckets working even if item IDs change. The first matching category
  // (in this order) wins; anything unmatched falls into "Other". `test` is run
  // against the gem's label; the synthetic "all" entry has no `test`.
  const GEM_CATEGORIES = [
    { key: 'all', label: 'All gems' },
    {
      key: 'eledmg', label: 'Elemental damage',
      test: function (l) {
        return /(Hot|Cold|Stench|Sleaze|Spooky)\s+(Damage|Spells)/i.test(l) ||
               /Damage to\b/i.test(l);
      }
    },
    {
      key: 'eleres', label: 'Elemental resistance',
      test: function (l) { return /Resistance/i.test(l); }
    },
    {
      key: 'drops', label: 'Drops',
      test: function (l) {
        return /Drops from Monsters/i.test(l) || /Pickpocket/i.test(l);
      }
    },
    {
      key: 'stats', label: 'Stats & initiative',
      test: function (l) {
        return /\b(Muscle|Mysticality|Moxie)\b/i.test(l) ||
               /Initiative/i.test(l);
      }
    },
    {
      key: 'sustain', label: 'Sustain',
      // HP/MP regeneration and damage absorption / reduction.
      test: function (l) {
        return /Regenerate\b.*\b(HP|MP)\b/i.test(l) ||
               /Damage (Absorption|Reduction)/i.test(l);
      }
    },
    {
      key: 'physoff', label: 'Physical offense',
      // Weapon damage (and room for other physical-damage gems later).
      test: function (l) { return /Weapon Damage/i.test(l); }
    },
    {
      key: 'other', label: 'Other',
      // Matches whatever none of the specific categories above claimed.
      test: function (l) {
        return !GEM_CATEGORIES.some(function (c) {
          return c.key !== 'all' && c.key !== 'other' && c.test(l);
        });
      }
    }
  ];

  // The category key a gem belongs to (first specific match, else "other").
  function gemCategory(label) {
    for (let i = 0; i < GEM_CATEGORIES.length; i++) {
      const c = GEM_CATEGORIES[i];
      if (c.key === 'all') continue;
      if (c.test(label)) return c.key;
    }
    return 'other';
  }

  function loadSetups() {
    try {
      const o = JSON.parse(localStorage.getItem(SETUPS_KEY));
      return (o && typeof o === 'object') ? o : {};
    } catch (e) {
      return {};
    }
  }

  function storeSetups(o) {
    localStorage.setItem(SETUPS_KEY, JSON.stringify(o));
  }

  // Collect the per-slot "Replace" forms (option=1), keyed by their `which`.
  // Each carries a <select name="iid"> whose currently-selected (disabled)
  // option is the gem mounted in that slot.
  function collectSlots() {
    const slots = [];
    document.querySelectorAll('form[action="choice.php"]').forEach(function (f) {
      const wc = f.querySelector('input[name="whichchoice"]');
      const opt = f.querySelector('input[name="option"]');
      const which = f.querySelector('input[name="which"]');
      const select = f.querySelector('select[name="iid"]');
      if (!wc || wc.value !== WHICHCHOICE) return;
      if (!opt || opt.value !== '1') return;          // Replace forms only
      if (!which || !select) return;
      slots.push({ which: which.value, form: f, select: select });
    });
    slots.sort(function (a, b) { return Number(a.which) - Number(b.which); });
    return slots;
  }

  // Union of all gems offered across the slots: value -> label text.
  function collectGems(slots) {
    const gems = new Map();
    slots.forEach(function (s) {
      Array.from(s.select.options).forEach(function (o) {
        if (!gems.has(o.value)) gems.set(o.value, o.textContent.trim());
      });
    });
    return gems;
  }

  function getPwdFromPage() {
    const inp = document.querySelector('input[name="pwd"]');
    return inp ? inp.value : getPwd();
  }

  // POST a single slot replacement. Resolves when the request settles; the
  // caller reloads once all slots are done so the server stays authoritative
  // about item availability (a gem you own only once can fill one slot).
  function applySlot(which, iid, pwd) {
    const body = new URLSearchParams();
    body.set('whichchoice', WHICHCHOICE);
    body.set('pwd', pwd);
    body.set('option', '1');
    body.set('which', which);
    body.set('iid', iid);
    return fetch('/choice.php', {
      method: 'POST',
      credentials: 'same-origin',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: body.toString()
    });
  }

  // assignments: array of { which, iid }. Fires sequentially, then reloads.
  async function applyAssignments(assignments, pwd, status) {
    if (!assignments.length) {
      if (status) status.textContent = 'Nothing to change.';
      return;
    }
    for (let i = 0; i < assignments.length; i++) {
      if (status) {
        status.textContent = 'Applying slot ' + (i + 1) + '/' +
          assignments.length + '…';
      }
      try {
        await applySlot(assignments[i].which, assignments[i].iid, pwd);
      } catch (e) {
        if (status) status.textContent = 'Request failed: ' + e;
        console.error('IotM: applySlot failed', e);
        return;
      }
    }
    if (status) status.textContent = 'Done, reloading…';
    location.reload();
  }

  // Is gem `iid` selectable (offered and not the disabled current gem) in this
  // slot's <select>? Skipping the current gem avoids no-op POSTs the server
  // would reject (the matching <option> is rendered disabled).
  function slotCanTake(slot, iid) {
    const opt = slot.select.querySelector('option[value="' + iid + '"]');
    return !!opt && !opt.disabled;
  }

  function buildPanel(slots, gems, pwd) {
    const panel = document.createElement('div');
    panel.id = 'tm-cod-panel';
    panel.style.cssText = [
      'max-width:520px', 'margin:8px auto', 'padding:8px',
      'border:1px solid blue', 'background:#f5f5ff',
      'font-family:arial', 'font-size:11px', 'text-align:left'
    ].join(';');

    const title = document.createElement('b');
    title.textContent = 'Codpiece tools';
    panel.appendChild(title);

    const status = document.createElement('div');
    status.id = 'tm-cod-status';
    status.style.cssText = 'margin-top:6px;min-height:14px;color:#006';

    // --- Row 1: set all slots to one gem (with a category filter) -----
    const row1 = document.createElement('div');
    row1.style.cssText = 'margin-top:6px';

    // Filter sub-line: narrows the gem dropdown to one category.
    const filterLine = document.createElement('div');
    const catSel = document.createElement('select');
    catSel.style.marginLeft = '6px';
    GEM_CATEGORIES.forEach(function (c) {
      const o = document.createElement('option');
      o.value = c.key;
      o.textContent = c.label;
      catSel.appendChild(o);
    });

    const gemSel = document.createElement('select');
    gemSel.style.maxWidth = '300px';

    const setAllBtn = document.createElement('button');
    setAllBtn.type = 'button';
    setAllBtn.textContent = 'Set all slots';
    setAllBtn.className = 'button';
    setAllBtn.style.marginLeft = '6px';
    setAllBtn.addEventListener('click', function () {
      const iid = gemSel.value;
      if (!iid) return;
      const assignments = slots
        .filter(function (s) { return slotCanTake(s, iid); })
        .map(function (s) { return { which: s.which, iid: iid }; });
      if (!assignments.length) {
        status.textContent = 'That gem is already in every applicable slot ' +
          '(or not available).';
        return;
      }
      setAllBtn.disabled = true;
      applyAssignments(assignments, pwd, status);
    });

    // (Re)populate the gem dropdown with just the gems in the chosen
    // category, alphabetically (Map preserves the union's insertion order).
    function fillGems() {
      const cat = catSel.value;
      gemSel.innerHTML = '';
      let n = 0;
      gems.forEach(function (label, value) {
        if (cat !== 'all' && gemCategory(label) !== cat) return;
        const o = document.createElement('option');
        o.value = value;
        o.textContent = label;
        gemSel.appendChild(o);
        n++;
      });
      if (!n) {
        const o = document.createElement('option');
        o.value = '';
        o.textContent = '(no gems in this category)';
        gemSel.appendChild(o);
      }
      gemSel.disabled = (n === 0);
      setAllBtn.disabled = (n === 0);
    }
    catSel.addEventListener('change', fillGems);
    fillGems();

    filterLine.appendChild(document.createTextNode('Filter:'));
    filterLine.appendChild(catSel);
    row1.appendChild(filterLine);

    const setLine = document.createElement('div');
    setLine.style.cssText = 'margin-top:4px';
    setLine.appendChild(document.createTextNode('Set every slot to: '));
    setLine.appendChild(gemSel);
    setLine.appendChild(setAllBtn);
    row1.appendChild(setLine);
    panel.appendChild(row1);

    // --- Row 2: save / load named setups ------------------------------
    const row2 = document.createElement('div');
    row2.style.cssText = 'margin-top:6px';
    const setupSel = document.createElement('select');
    setupSel.style.minWidth = '160px';

    function refreshSetupList() {
      const setups = loadSetups();
      setupSel.innerHTML = '';
      const names = Object.keys(setups).sort();
      if (!names.length) {
        const o = document.createElement('option');
        o.value = '';
        o.textContent = '(no saved setups)';
        setupSel.appendChild(o);
        setupSel.disabled = true;
      } else {
        setupSel.disabled = false;
        names.forEach(function (n) {
          const o = document.createElement('option');
          o.value = n;
          o.textContent = n;
          setupSel.appendChild(o);
        });
      }
    }
    refreshSetupList();

    const loadBtn = document.createElement('button');
    loadBtn.type = 'button';
    loadBtn.textContent = 'Load';
    loadBtn.className = 'button';
    loadBtn.style.marginLeft = '6px';
    loadBtn.addEventListener('click', function () {
      const name = setupSel.value;
      if (!name) return;
      const setups = loadSetups();
      const saved = setups[name];
      if (!saved) return;
      const assignments = [];
      const skipped = [];
      slots.forEach(function (s) {
        const iid = saved[s.which];
        if (!iid) return;                       // slot not in this setup
        if (!slotCanTake(s, iid)) {             // already set, or unavailable
          const opt = s.select.querySelector('option[value="' + iid + '"]');
          if (!opt) skipped.push(s.which);      // gem not owned -> report
          return;
        }
        assignments.push({ which: s.which, iid: iid });
      });
      if (skipped.length) {
        status.textContent = 'Note: gem unavailable for slot(s) ' +
          skipped.join(', ') + '. ';
      }
      if (!assignments.length) {
        status.textContent += 'Nothing to change.';
        return;
      }
      loadBtn.disabled = true;
      applyAssignments(assignments, pwd, status);
    });

    const saveBtn = document.createElement('button');
    saveBtn.type = 'button';
    saveBtn.textContent = 'Save current…';
    saveBtn.className = 'button';
    saveBtn.style.marginLeft = '6px';
    saveBtn.addEventListener('click', function () {
      const name = (prompt('Save current gem setup as:') || '').trim();
      if (!name) return;
      const setups = loadSetups();
      const snapshot = {};
      slots.forEach(function (s) { snapshot[s.which] = s.select.value; });
      setups[name] = snapshot;
      storeSetups(setups);
      refreshSetupList();
      setupSel.value = name;
      status.textContent = 'Saved setup "' + name + '".';
    });

    const delBtn = document.createElement('button');
    delBtn.type = 'button';
    delBtn.textContent = 'Delete';
    delBtn.className = 'button';
    delBtn.style.marginLeft = '6px';
    delBtn.addEventListener('click', function () {
      const name = setupSel.value;
      if (!name) return;
      if (!confirm('Delete saved setup "' + name + '"?')) return;
      const setups = loadSetups();
      delete setups[name];
      storeSetups(setups);
      refreshSetupList();
      status.textContent = 'Deleted setup "' + name + '".';
    });

    row2.appendChild(document.createTextNode('Setups: '));
    row2.appendChild(setupSel);
    row2.appendChild(loadBtn);
    row2.appendChild(saveBtn);
    row2.appendChild(delBtn);
    panel.appendChild(row2);

    panel.appendChild(status);
    return panel;
  }

  function initDecorator() {
    if (document.getElementById('tm-cod-panel')) return;
    // Only the Eternity Codpiece choice carries whichchoice=1588.
    if (!document.querySelector(
        'input[name="whichchoice"][value="' + WHICHCHOICE + '"]')) {
      return;
    }
    const slots = collectSlots();
    if (!slots.length) return;
    const gems = collectGems(slots);
    if (!gems.size) return;
    const pwd = getPwdFromPage();
    if (!pwd) {
      console.warn('Codpiece tools: could not determine pwd hash.');
      return;
    }
    const panel = buildPanel(slots, gems, pwd);
    document.body.insertBefore(panel, document.body.firstChild);
  }

  // === Cup of 13s ingredient sort (choice.php, whichchoice=1601) =======
  // The Cup of 13s choice offers three identical ingredient dropdowns
  // (whichitem1..3). This adds a toolbar to re-order the options in all three
  // by adventures, additional effect, inventory amount, or name -- it only
  // reorders <option>s, changing nothing the form submits.

  const CUP13_CHOICE = '1601';

  // Split an additional-effect string into a grouping name and a magnitude, so
  // effects with the same name group together regardless of their number:
  //   "20 turns of Runneth Over" -> { name: 'Runneth Over', mag: 20 }
  //   "40 turns of Runneth Over" -> { name: 'Runneth Over', mag: 40 }
  //   "100 Mys"                  -> { name: 'Mys',          mag: 100 }
  //   ""                         -> { name: '',             mag: 0 }
  // "N turns of X" -> name X, mag N (turn length); a leading-number form like
  // "100 Mys" -> name "Mys", mag 100 (stat amount). Anything else is its own
  // name with mag 0.
  function parseCupEffect(effect) {
    if (!effect) return { name: '', mag: 0 };
    let m = effect.match(/^(\d+)\s+turns?\s+of\s+(.+)$/i);
    if (m) return { name: m[2].trim(), mag: parseInt(m[1], 10) || 0 };
    m = effect.match(/^(\d+)\s+(.+)$/);
    if (m) return { name: m[2].trim(), mag: parseInt(m[1], 10) || 0 };
    return { name: effect, mag: 0 };
  }

  // Parse one ingredient <option>. Label format is
  // "NAME (QTY) - N Adv.[, EXTRA]", e.g.
  //   "hot wing (16) - 1 Adv."            -> qty 16, advs 1, effect ''
  //   "alarm accordion (1) - 1 Adv., 100 Mys"     -> effect '100 Mys'
  //   "bum cheek (1) - 2 Adv., 20 turns of Runneth a Fever'
  // QTY is the amount in inventory; advs is read from the reliable data-advs
  // attribute (not the text). EXTRA (if any) is the additional effect, further
  // split into effName/effMag for grouping (see parseCupEffect).
  function parseCupOption(opt) {
    const text = (opt.textContent || '').trim();
    const advs = parseInt(opt.getAttribute('data-advs'), 10) || 0;
    const m = text.match(/^(.*) \((\d+)\) - \d+ Adv\.(?:,\s*(.*))?$/);
    const effect = (m && m[3]) ? m[3].trim() : '';
    const eff = parseCupEffect(effect);
    return {
      name: m ? m[1] : text,
      qty: m ? (parseInt(m[2], 10) || 0) : 0,
      advs: advs,
      effect: effect,
      effName: eff.name,
      effMag: eff.mag
    };
  }

  // Comparators over parsed option info. Name is the game's default order; the
  // others fall back to name to stay stable/predictable on ties.
  const CUP13_SORTS = {
    name: function (a, b) { return a.name.localeCompare(b.name); },
    advs: function (a, b) {
      return (b.advs - a.advs) || a.name.localeCompare(b.name);
    },
    inventory: function (a, b) {
      return (b.qty - a.qty) || a.name.localeCompare(b.name);
    },
    effect: function (a, b) {
      // Options with an additional effect first, then the rest by name.
      const ae = a.effect ? 0 : 1;
      const be = b.effect ? 0 : 1;
      if (ae !== be) return ae - be;
      if (a.effect && b.effect) {
        // Group by effect name; within a name, higher turn length (magnitude)
        // first, then higher adventures, then item name.
        const c = a.effName.localeCompare(b.effName);
        if (c) return c;
        if (b.effMag !== a.effMag) return b.effMag - a.effMag;
        if (b.advs !== a.advs) return b.advs - a.advs;
      }
      return a.name.localeCompare(b.name);
    }
  };

  function cup13Selects() {
    return Array.prototype.slice.call(
      document.querySelectorAll(
        'select[name="whichitem1"], select[name="whichitem2"], ' +
        'select[name="whichitem3"]'));
  }

  // Reorder every ingredient dropdown by `compare`. appendChild moves the
  // existing <option> nodes (no re-creation). After sorting, each select jumps
  // to its new topmost option -- makes the sort visibly "take", and puts the
  // best pick (for the chosen order) one click away.
  function sortCup13(selects, compare) {
    selects.forEach(function (sel) {
      const items = Array.prototype.map.call(sel.options, function (opt) {
        return { opt: opt, info: parseCupOption(opt) };
      });
      items.sort(function (a, b) { return compare(a.info, b.info); });
      items.forEach(function (it) { sel.appendChild(it.opt); });
      sel.selectedIndex = 0;
    });
  }

  function buildCup13Toolbar(selects) {
    const bar = document.createElement('div');
    bar.id = 'tm-cup13-sort';
    bar.style.cssText = [
      'margin:4px 0 8px', 'display:flex', 'flex-wrap:wrap', 'gap:4px',
      'align-items:center', 'font-family:arial', 'font-size:11px'
    ].join(';');

    const label = document.createElement('span');
    label.textContent = 'Sort ingredients:';
    label.style.marginRight = '2px';
    bar.appendChild(label);

    [
      { key: 'advs', text: '# Adv.' },
      { key: 'effect', text: 'Effect' },
      { key: 'inventory', text: 'Inventory' },
      { key: 'name', text: 'Name' }
    ].forEach(function (b) {
      const btn = document.createElement('button');
      btn.type = 'button';           // never submits the surrounding form
      btn.className = 'button';
      btn.textContent = b.text;
      btn.addEventListener('click', function () {
        sortCup13(selects, CUP13_SORTS[b.key]);
      });
      bar.appendChild(btn);
    });
    return bar;
  }

  function initCup13Sort() {
    if (document.getElementById('tm-cup13-sort')) return;
    // Only the Cup of 13s choice carries whichchoice=1601.
    if (!document.querySelector(
        'input[name="whichchoice"][value="' + CUP13_CHOICE + '"]')) {
      return;
    }
    const selects = cup13Selects();
    if (!selects.length) return;
    // Drop the toolbar just above the ingredient form.
    const form = selects[0].form || selects[0];
    form.parentNode.insertBefore(buildCup13Toolbar(selects), form);
  }

  // --- Dispatch --------------------------------------------------------
  // Run last, so the `const` config above is past its temporal dead zone by the
  // time addButton()/firePath() read it. The all-in-one loader @requires every KoL
  // script and runs them on the union of all matched pages; gating by page here
  // keeps each feature off sibling frames. A no-op gate for the standalone
  // install, whose @match already scopes it.
  const PATH = location.pathname;
  if (/\/(awesomemenu|topmenu)\.php/i.test(PATH)) {
    addButton();
  } else if (/\/choice\.php/i.test(PATH)) {
    initDecorator();
    initCup13Sort();
  }
})();
