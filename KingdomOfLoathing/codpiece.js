// ==UserScript==
// @name         KoL Codpiece Button
// @author       Tilo
// @namespace    https://github.com/TiloBuechsenschuss
// @downloadURL  https://raw.githubusercontent.com/TiloBuechsenschuss/userscripts/refs/heads/main/KingdomOfLoathing/codpiece.js
// @version      1.4
// @description  Adds a button below the edit icon in the KoL icon menu that triggers inventory.php?action=docodpiece
// @match        https://www.kingdomofloathing.com/awesomemenu.php*
// @match        https://kingdomofloathing.com/awesomemenu.php*
// @match        https://www.kingdomofloathing.com/topmenu.php*
// @match        https://kingdomofloathing.com/topmenu.php*
// @grant        none

// ==/UserScript==

(function () {
  'use strict';

  // Bundled-loader safety: all-in-one.js @requires every KoL script and runs
  // them on the union of all matched pages. Guard our own page(s) explicitly,
  // or this script's body-top fallback would drop a stray button onto sibling
  // frames (charpane, mainpane, ...). A no-op for the standalone install, whose
  // @match already scopes it to these pages.
  if (!/\/(awesomemenu|topmenu)\.php/i.test(location.pathname)) return;

  // --- Configuration ---------------------------------------------------
  const ACTION_URL = '/inventory.php?action=docodpiece';
  const BUTTON_LABEL = 'Codpiece';
  // If true, the result page is shown in the mainpane.
  // If false, the request fires silently in the background.
  const SHOW_RESULT_IN_MAINPANE = true;
  // ----------------------------------------------------------------------

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

  function fireAction() {
    const pwd = getPwd();
    if (!pwd) {
      alert('Codpiece button: could not determine pwd hash.');
      return;
    }

    const url = ACTION_URL + '&pwd=' + pwd;

    if (SHOW_RESULT_IN_MAINPANE) {
      try {
        top.frames['mainpane'].location.href = url;
        return;
      } catch (e) {
        console.warn('Codpiece button: could not navigate mainpane, ' +
                     'falling back to background request.', e);
      }
    }

    fetch(url, { credentials: 'same-origin' })
      .then(function (res) {
        console.log('Codpiece action sent, HTTP ' + res.status);
      })
      .catch(function (err) {
        console.error('Codpiece action failed:', err);
      });
  }

  function makeButton() {
    const btn = document.createElement('button');
    btn.id = 'tm-codpiece-btn';
    btn.type = 'button';
    btn.textContent = BUTTON_LABEL;
    btn.title = 'inventory.php?action=docodpiece';
    btn.style.cssText = [
      'padding:0 4px',
      'font-size:9px',
      'font-family:arial',
      'height:14px',
      'line-height:12px',
      'cursor:pointer',
      'white-space:nowrap'
    ].join(';');
    btn.addEventListener('click', fireAction);
    return btn;
  }

  function addButton() {
    if (document.getElementById('tm-codpiece-btn')) return;

    const btn = makeButton();
    const fixed = document.getElementById('fixedawesome');
    const editLink = document.querySelector('#fixedawesome a.config');

    if (fixed && editLink) {
      // #fixedawesome is position:absolute, so an absolutely positioned
      // child is placed relative to it -- without disturbing the inline
      // row of icons inside it. The edit icon is 30px tall; hang the
      // button just below it, left-aligned with the icon.
      btn.style.position = 'absolute';
      btn.style.top = '31px';
      btn.style.left = Math.max(0, editLink.offsetLeft) + 'px';
      btn.style.zIndex = '3';
      btn.style.backgroundColor = 'white';
      fixed.appendChild(btn);
      return;
    }

    // Text-mode topmenu fallback: place after a plain "edit" link.
    const links = document.querySelectorAll('a');
    for (const a of links) {
      const t = a.textContent.trim().toLowerCase().replace(/^\[|\]$/g, '');
      if (t === 'edit') {
        const wrap = document.createElement('div');
        wrap.appendChild(btn);
        a.insertAdjacentElement('afterend', wrap);
        return;
      }
    }

    console.warn('Codpiece button: no anchor point found, ' +
                 'placing button at top of frame.');
    document.body.insertBefore(btn, document.body.firstChild);
  }

  addButton();
})();