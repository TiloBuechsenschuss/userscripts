// Ad-hoc test for FallenLondon/ux-enhancers.js's launcher placement.
//
// There's no test runner in this repo (see AGENTS.md). This is a standalone
// Node script: it reads the userscript, evaluates its IIFE against a stub DOM
// (empty, so the initial scan() finds nothing) and pulls out the internals.
//
// What's under test is `launcherPlacement`, and it is deliberately pure --
// boxes in, offsets out -- precisely so the rule can be pinned here without a
// layout engine. The rule exists because the launcher used to be nailed to the
// bottom-right corner, which on the narrow layout is where Fallen London puts
// its own fixed bottom bar; the "⚙ UX" button sat on top of it.
//
// The three layouts below are the three shapes FL's travel control actually
// takes (markup verified 2026-09-02, quoted in the script):
//
//  - Wide desktop: `.travel-button--infobar` in the right sidebar. Nothing of
//    its own container is beside it, so the launcher goes BESIDE it, bottoms
//    level. That is what "next to" means when the space is free.
//  - Narrower desktop: the classless button in `.storylets__welcome-and-travel`,
//    which shares a flex row with the welcome text. The space beside it is
//    spoken for, so the launcher goes ABOVE it instead.
//  - Mobile: the compass, one `li.banner-item` among several inside a fixed
//    bar. Both reasons to stack apply, and the launcher must clear the whole
//    BAR, not just the icon -- that is the original bug, checked explicitly.
//
// Plus the two fallbacks: a bar at the TOP of the screen leaves no room above,
// so the launcher goes below it; and a travel control that can't be found at
// all returns to the corner, still lifted clear of a bottom bar. The corner
// path matters -- it is what a future FL reskin gets -- and it still has to fix
// the reported bug on its own.
//
// Everything is clamped to the viewport, so a control that has scrolled out of
// view can never carry the launcher out with it.
//
//   node FallenLondon/test/ux-launcher-placement.test.mjs

import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const here = dirname(fileURLToPath(import.meta.url));
const src = readFileSync(join(here, '..', 'ux-enhancers.js'), 'utf8');

// --- stub DOM --------------------------------------------------------------
// Just enough for the IIFE to load. Note there is no `window` here, which is
// why `positionLauncher` (the impure half) bails out on its own and only the
// pure `launcherPlacement` is exercised.

function makeEl(tag) {
  const el = {
    tagName: (tag || 'span').toUpperCase(),
    nodeType: 1,
    className: '',
    title: '',
    textContent: '',
    style: { cssText: '' },
    dataset: {},
    childNodes: [],
    children: [],
    parentNode: null,
    nextElementSibling: null,
    appendChild(child) {
      child.parentNode = this;
      this.childNodes.push(child);
      this.children.push(child);
      return child;
    },
    remove() {
      const p = this.parentNode;
      if (!p) return;
      p.childNodes = p.childNodes.filter((n) => n !== this);
      p.children = p.children.filter((n) => n !== this);
      this.parentNode = null;
    },
    addEventListener() {},
    querySelector() { return null; },
  };
  el.classList = { contains: (c) => String(el.className).split(/\s+/).includes(c) };
  return el;
}

const fakeDoc = {
  body: makeEl('body'),
  querySelectorAll: () => [],
  querySelector: () => null,
  getElementById: () => null,
  createElement: (tag) => makeEl(tag),
  createTextNode: (t) => ({ nodeType: 3, nodeValue: String(t), text: String(t) }),
  addEventListener() {},
};
class FakeObserver { observe() {} }

const wrapped = src
  .replace('(function () {', 'globalThis.__flux = (function () {')
  .replace(/\}\)\(\);\s*$/,
    'return { launcherPlacement, LAUNCHER_GAP, LAUNCHER_EDGE, TRAVEL_SELECTORS,'
    + ' FEATURES }; })();');
const fn = new Function(
  'document', 'MutationObserver', 'requestAnimationFrame', 'getComputedStyle', 'console',
  wrapped + '\nreturn globalThis.__flux;');
const api = fn(fakeDoc, FakeObserver, () => {}, () => ({ position: 'relative' }), console);

let failures = 0;
function check(label, got, expected) {
  const g = JSON.stringify(got);
  const e = JSON.stringify(expected);
  const ok = g === e;
  if (!ok) failures++;
  console.log((ok ? 'PASS' : 'FAIL'), '|', label);
  if (!ok) console.log('   expected:', e, '\n   got:     ', g);
}

// A DOMRect-shaped box, written the way a rect reads.
const box = (left, top, width, height) => ({
  left: left, top: top, width: width, height: height,
  right: left + width, bottom: top + height,
});

const place = (anchor, bar, view, size, crowded) =>
  api.launcherPlacement(anchor, bar, view, size, crowded);

// --- wide desktop: `.travel-button--infobar` in the sidebar ----------------

const DESKTOP = { width: 1440, height: 900 };
const DESKTOP_BUTTON = { width: 96, height: 40 };
// The sidebar button is block-level, so its left edge is the sidebar's.
const travelInfobar = box(1180, 120, 180, 48);

check('the sidebar Travel button, with its own column beside it, puts the launcher beside it',
  place(travelInfobar, null, DESKTOP, DESKTOP_BUTTON, false),
  // 8px left of its left edge (1440 - 1180 + 8), bottoms level (900 - 168)
  { side: 'beside', right: 268, bottom: 732 });

{
  const at = place(travelInfobar, null, DESKTOP, DESKTOP_BUTTON, false);
  check('beside means beside: the launcher ends where the Travel button begins, less the gap',
    DESKTOP.width - at.right, travelInfobar.left - api.LAUNCHER_GAP);
  check('and level with it: the two bottom edges line up',
    DESKTOP.height - at.bottom, travelInfobar.bottom);
}

// --- narrower desktop: the button sharing a row with the welcome text -------

const LAPTOP = { width: 1100, height: 900 };
const travelInRow = box(940, 200, 90, 40);

check('a Travel button whose own row is beside it goes above it, not over the greeting',
  place(travelInRow, null, LAPTOP, DESKTOP_BUTTON, true),
  // right edges level (1100 - 1030), 8px above its top (900 - 200 + 8)
  { side: 'above', right: 70, bottom: 708 });

check('the same button with the space free would have gone beside it',
  place(travelInRow, null, LAPTOP, DESKTOP_BUTTON, false).side,
  'beside');

// --- mobile: the compass, one banner-item among several, in a fixed bar -----

const PHONE = { width: 390, height: 844 };
const PHONE_BUTTON = { width: 80, height: 36 };
const bottomBar = box(0, 780, 390, 64);
const compass = box(300, 790, 40, 40);

check('the compass in the bottom bar puts the launcher above the bar, not in it',
  place(compass, bottomBar, PHONE, PHONE_BUTTON, true),
  // right edges level (390 - 340), above the BAR's top rather than the compass's
  { side: 'above', right: 50, bottom: 72 });

{
  const at = place(compass, bottomBar, PHONE, PHONE_BUTTON, true);
  check('THE BUG: the launcher clears the bottom bar entirely',
    PHONE.height - at.bottom <= bottomBar.top, true);
  check('and stays over the compass: right edges line up',
    PHONE.width - at.right, compass.right);
}

check('a bar is reason enough to stack, even before the neighbouring icons are',
  place(compass, bottomBar, PHONE, PHONE_BUTTON, false).side,
  'above');

check('neighbouring icons are reason enough to stack, even without a bar',
  place(compass, null, PHONE, PHONE_BUTTON, true).side,
  'above');

// --- a bar at the top of the screen instead --------------------------------

const topBar = box(0, 0, 390, 56);
const topCompass = box(300, 8, 40, 40);

check('a travel control in a top bar has no room above it, so the launcher goes below',
  place(topCompass, topBar, PHONE, PHONE_BUTTON, true),
  // right edges level, top edge 8px under the bar: 844 - 56 - 8 - 36
  { side: 'below', right: 50, bottom: 744 });

{
  const at = place(topCompass, topBar, PHONE, PHONE_BUTTON, true);
  check('and it clears that bar too',
    PHONE.height - at.bottom - PHONE_BUTTON.height >= topBar.bottom, true);
}

// --- no room beside --------------------------------------------------------

check('a control too close to the left edge falls back to stacking',
  place(box(12, 100, 48, 40), null, PHONE, PHONE_BUTTON, false),
  { side: 'above', right: 302, bottom: 752 });

check('the room test counts the launcher\'s own width, not just the gap',
  // 96px of clearance: an 8px screen edge, an 80px button and an 8px gap.
  place(box(96, 100, 48, 40), null, PHONE, PHONE_BUTTON, false).side,
  'beside');

// --- the travel control could not be found ---------------------------------

check('no travel control and no bar is the old bottom-right corner',
  place(null, null, PHONE, PHONE_BUTTON, false),
  { side: 'corner', right: 16, bottom: 16 });

check('no travel control but a bottom bar still lifts the launcher clear of it',
  place(null, bottomBar, PHONE, PHONE_BUTTON, false),
  { side: 'corner', right: 16, bottom: 72 });

check('a bar at the top is not in the corner\'s way, so the corner stays put',
  place(null, topBar, PHONE, PHONE_BUTTON, false),
  { side: 'corner', right: 16, bottom: 16 });

// --- clamping --------------------------------------------------------------

{
  const at = place(box(12, -50, 48, 40), null, PHONE, PHONE_BUTTON, false);
  check('a control scrolled off the top cannot carry the launcher off with it',
    at.bottom, PHONE.height - PHONE_BUTTON.height - api.LAUNCHER_EDGE);
  check('and it stays on screen horizontally too',
    at.right <= PHONE.width - PHONE_BUTTON.width - api.LAUNCHER_EDGE, true);
}

{
  // Every placement, for every plausible box, has to leave the button on screen.
  const views = [DESKTOP, LAPTOP, PHONE, { width: 320, height: 568 }];
  const bars = [null, bottomBar, topBar];
  const anchors = [null, travelInfobar, travelInRow, compass, topCompass,
    box(-40, -40, 48, 40), box(2000, 2000, 48, 40)];
  const offScreen = [];
  for (const view of views) {
    for (const bar of bars) {
      for (const anchor of anchors) {
        for (const crowded of [true, false]) {
          const size = { width: 96, height: 40 };
          const at = place(anchor, bar, view, size, crowded);
          const left = view.width - at.right - size.width;
          const top = view.height - at.bottom - size.height;
          if (left < 0 || top < 0 || at.right < 0 || at.bottom < 0) offScreen.push(at);
        }
      }
    }
  }
  check('no combination of viewport, bar, anchor and crowding goes off screen',
    offScreen, []);
}

// --- the selectors ---------------------------------------------------------

check('all three verified travel shapes have a selector',
  ['.travel-button--infobar', '.storylets__welcome-and-travel button', 'button[title="Map"]']
    .filter((sel) => !api.TRAVEL_SELECTORS.includes(sel)),
  []);

check('the launcher still runs first, so it is on screen from the initial pass',
  api.FEATURES[0].name, 'launcher');

console.log(failures ? '\n' + failures + ' check(s) FAILED.' : '\nAll checks passed.');
process.exit(failures ? 1 : 0);
