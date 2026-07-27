// ==UserScript==
// @name         KoL Quest Helper
// @author       Tilo
// @namespace    https://github.com/TiloBuechsenschuss
// @downloadURL  https://raw.githubusercontent.com/TiloBuechsenschuss/userscripts/refs/heads/main/KingdomOfLoathing/quest-helper.js
// @version      1.0
// @description  Helper for puzzle-y quest choice adventures. It never submits anything on its own -- each puzzle gets a button that fills in the known-correct answer and leaves the actual submit to you. Currently solves: Drawn Onward (choice 872), the photo frames in Dr. Awkward's office, by setting the four photo dropdowns to the correct top-to-bottom order.
// @match        https://www.kingdomofloathing.com/choice.php*
// @match        https://kingdomofloathing.com/choice.php*
// @run-at       document-idle
// @grant        none
// ==/UserScript==

(function () {
  'use strict';

  // The all-in-one loader @requires every KoL script onto the union of all matched
  // pages, so scope ourselves explicitly rather than trusting @match.
  if (!/\/choice\.php/i.test(location.pathname)) return;
  if (document.getElementById('tm-questhelper-bar')) return; // idempotency guard

  // === Puzzle database =====================================================
  // choice.php is shared by every choice adventure, so each entry is keyed by the
  // hidden `whichchoice` value and only fires when that value is on the page.
  //
  // A `selects` puzzle is one whose answer is "put these values in these
  // dropdowns". Each field names the <select> and the option to pick, given BOTH
  // as the item id (the option's value -- stable, the primary key) and as the
  // option label (a fallback, in case a select ever renders different values).
  //
  // NOTHING here submits. The button fills the form in; the player presses the
  // game's own submit button. That keeps a wrong entry in the database from
  // burning a turn or locking in a bad answer.
  const PUZZLES = [
    {
      choice: '872',
      name: 'Drawn Onward',
      // The antechamber behind Dr. Awkward's office door: a column of four empty
      // photo frames, filled from four dropdowns (top -> bottom). Solution order
      // per the KoL wiki: God, red nugget, dog, ostrich egg.
      button: 'Set correct photo order',
      hint: 'Fills the four frames top→bottom with God / red nugget / dog / ostrich egg, ' +
        'then you press "Arrange the photos" yourself.',
      type: 'selects',
      fields: [
        { name: 'photo1', value: '2259', text: 'photograph of God' },
        { name: 'photo2', value: '7264', text: 'photograph of a red nugget' },
        { name: 'photo3', value: '7263', text: 'photograph of a dog' },
        { name: 'photo4', value: '7265', text: 'photograph of an ostrich egg' },
      ],
    },
  ];

  // === Page matching =======================================================

  // Which puzzle (if any) is on screen. Gate on the hidden whichchoice input --
  // the page itself carries no other reliable id.
  function currentPuzzle() {
    return PUZZLES.find((p) =>
      document.querySelector('input[name="whichchoice"][value="' + p.choice + '"]')) || null;
  }

  // The form that actually holds the puzzle's controls. A choice page has several
  // forms carrying the same whichchoice (here: "Arrange the photos" and "Leave"),
  // so match on the fields too rather than taking the first hit.
  function findForm(puzzle) {
    const forms = Array.from(document.querySelectorAll('form'));
    return forms.find((f) =>
      f.querySelector('input[name="whichchoice"][value="' + puzzle.choice + '"]') &&
      puzzle.fields.every((fl) => f.querySelector('select[name="' + fl.name + '"]'))) || null;
  }

  // === Applying a solution =================================================

  // Pick `field`'s option in `sel`: by option value first (item id), falling back
  // to a case-insensitive label match. Returns true if the value changed or was
  // already correct, false if no such option exists.
  function selectOption(sel, field) {
    const opts = Array.from(sel.options);
    const want = opts.find((o) => o.value === field.value) ||
      opts.find((o) => o.textContent.trim().toLowerCase() === field.text.toLowerCase());
    if (!want) return false;
    if (sel.value !== want.value) {
      sel.value = want.value;
      // KoL's own page doesn't listen for this, but fire it anyway so anything
      // else hooked onto the select (another script) sees the change.
      sel.dispatchEvent(new Event('change', { bubbles: true }));
    }
    return true;
  }

  function applySelects(puzzle, form, say) {
    const missing = [];
    puzzle.fields.forEach((field) => {
      const sel = form.querySelector('select[name="' + field.name + '"]');
      if (!sel || !selectOption(sel, field)) missing.push(field.text);
    });
    if (missing.length) {
      say('Could not set: ' + missing.join(', ') +
        ' — you may not be holding every photograph yet. Check the dropdowns before submitting.', true);
      return;
    }
    say('Photos set to the correct order. Now press "Arrange the photos" yourself.');
  }

  // === UI ==================================================================

  function buildBar(puzzle, form) {
    const bar = document.createElement('div');
    bar.id = 'tm-questhelper-bar';
    bar.style.cssText = [
      'max-width:420px', 'margin:8px auto', 'padding:6px 8px',
      'border:1px solid #336', 'background:#eef', 'border-radius:3px',
      'font-family:arial', 'font-size:11px', 'text-align:center',
    ].join(';');

    const head = document.createElement('div');
    head.innerHTML = '<b>Quest Helper</b> — ' + puzzle.name;
    bar.appendChild(head);

    const status = document.createElement('div');
    status.style.cssText = 'margin-top:4px;color:#444';
    status.textContent = puzzle.hint;
    bar.appendChild(status);

    const say = (msg, warn) => {
      status.textContent = msg;
      status.style.color = warn ? '#a00' : '#060';
    };

    const btn = document.createElement('button');
    btn.type = 'button'; // never submit the form we live next to
    btn.className = 'button';
    btn.textContent = puzzle.button;
    btn.style.cssText = 'margin-top:5px';
    btn.addEventListener('click', () => applySelects(puzzle, form, say));

    bar.appendChild(btn);
    return bar;
  }

  const puzzle = currentPuzzle();
  if (!puzzle) return;
  const form = findForm(puzzle);
  if (!form) return; // page structure changed, or the choice is already resolved

  // Sit right below the puzzle's own form, next to the submit button it fills in.
  form.parentNode.insertBefore(buildBar(puzzle, form), form.nextSibling);
})();
