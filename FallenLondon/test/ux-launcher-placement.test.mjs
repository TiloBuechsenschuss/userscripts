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
// The result also carries `down`: which way the menu and panels stack away
// from the button. They used to always open upward, which is invisible when the
// button is pinned near the TOP of the screen -- exactly what the mobile compass
// and a high sidebar Travel button both do. It opens toward whichever side has
// the room, and the DOM order (panel, menu, button) plus `column-reverse` is
// what lets one flag flip the whole stack.
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
    'return { launcherPlacement, popoverPlacement, findDockHost, dockHostFor, dockLauncher,'
    + ' dockPreferred, setDockPreferred, LAUNCHER_GAP, LAUNCHER_EDGE, LAUNCHER_ID,'
    + ' LAUNCHER_BUTTON_ID, TRAVEL_SELECTORS, FEATURES }; })();');
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
  { side: 'beside', right: 268, bottom: 732, down: true });

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
  { side: 'above', right: 70, bottom: 708, down: true });

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
  { side: 'above', right: 50, bottom: 72, down: false });

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
  { side: 'below', right: 50, bottom: 744, down: true });

{
  const at = place(topCompass, topBar, PHONE, PHONE_BUTTON, true);
  check('and it clears that bar too',
    PHONE.height - at.bottom - PHONE_BUTTON.height >= topBar.bottom, true);
}

// --- no room beside --------------------------------------------------------

check('a control too close to the left edge falls back to stacking',
  place(box(12, 100, 48, 40), null, PHONE, PHONE_BUTTON, false),
  { side: 'above', right: 302, bottom: 752, down: true });

check('the room test counts the launcher\'s own width, not just the gap',
  // 96px of clearance: an 8px screen edge, an 80px button and an 8px gap.
  place(box(96, 100, 48, 40), null, PHONE, PHONE_BUTTON, false).side,
  'beside');

// --- the travel control could not be found ---------------------------------

check('no travel control and no bar is the old bottom-right corner',
  place(null, null, PHONE, PHONE_BUTTON, false),
  { side: 'corner', right: 16, bottom: 16, down: false });

check('no travel control but a bottom bar still lifts the launcher clear of it',
  place(null, bottomBar, PHONE, PHONE_BUTTON, false),
  { side: 'corner', right: 16, bottom: 72, down: false });

check('a bar at the top is not in the corner\'s way, so the corner stays put',
  place(null, topBar, PHONE, PHONE_BUTTON, false),
  { side: 'corner', right: 16, bottom: 16, down: false });

// --- which way the menu opens ----------------------------------------------

check('a button above the bottom bar opens the menu upward, into the screen',
  place(compass, bottomBar, PHONE, PHONE_BUTTON, true).down, false);

check('THE BUG: a button under a top bar opens DOWNWARD, or the menu is off-screen',
  place(topCompass, topBar, PHONE, PHONE_BUTTON, true).down, true);

check('the sidebar Travel button is high up, so that menu opens downward too',
  place(travelInfobar, null, DESKTOP, DESKTOP_BUTTON, false).down, true);

{
  // The direction is only ever "whichever side has more room", so whatever the
  // placement decided, the stack can never be the taller of the two gaps.
  const views = [DESKTOP, LAPTOP, PHONE];
  const anchors = [null, travelInfobar, travelInRow, compass, topCompass];
  const wrongWay = [];
  for (const view of views) {
    for (const bar of [null, bottomBar, topBar]) {
      for (const anchor of anchors) {
        const size = { width: 96, height: 40 };
        const at = place(anchor, bar, view, size, false);
        const above = view.height - at.bottom - size.height;
        if ((at.down ? at.bottom : above) < (at.down ? above : at.bottom)) wrongWay.push(at);
      }
    }
  }
  check('the stack always opens toward the side with more room', wrongWay, []);
}

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

// --- docked mode: placing the popover, not the button ----------------------
//
// The button is part of the page now (see `dockLauncher`), so the only thing
// left to place is the popover — the menu and the panel. Different rule,
// `popoverPlacement`, and it is pure for the same reason this one is.
//
// The two things it must never do: leave the screen, and open into the smaller
// of the two gaps. A DOCKED button scrolls with the page, so its box can be
// anywhere at all — including entirely off the top or bottom — and the popover
// still has to end up somewhere readable.

const pop = (anchor, view, want) => api.popoverPlacement(anchor, view, view ? want : null);
const WANT = { width: 660 };

{
  // A button docked beside the sidebar's Travel control, high on the page.
  const at = pop(box(1264, 168, 96, 34), DESKTOP, WANT);
  check('with the page below it, the popover opens downward from the button',
    [at.down, at.top, at.bottom], [true, 202 + api.LAUNCHER_GAP, null]);
  check('and hangs off the button\'s right edge',
    DESKTOP.width - at.right, 1360);
  check('with the room below it to be tall in',
    at.maxHeight, DESKTOP.height - 202 - api.LAUNCHER_GAP - api.LAUNCHER_EDGE);
}

{
  // The same button near the bottom of the screen: there is more room above.
  const at = pop(box(1264, 800, 96, 34), DESKTOP, WANT);
  check('with the page above it, the popover opens upward instead',
    [at.down, at.top, at.bottom], [false, null, DESKTOP.height - 800 + api.LAUNCHER_GAP]);
}

{
  // A narrow phone: the popover is wider than the screen allows, so it is
  // pinned to both margins rather than to the button.
  const view = { width: 380, height: 720 };
  const at = pop(box(300, 8, 72, 32), view, WANT);
  check('on a narrow screen the popover shrinks to the viewport, not to the button',
    [at.maxWidth, at.right], [view.width - 2 * api.LAUNCHER_EDGE, api.LAUNCHER_EDGE]);
  check('a button in a top banner opens the popover downward',
    at.down, true);
}

{
  // The docked button has scrolled clean off the top of the page.
  const at = pop(box(1264, -400, 96, 34), DESKTOP, WANT);
  check('a button scrolled off the top cannot drag the popover off with it',
    [at.down, at.top >= api.LAUNCHER_EDGE, at.maxHeight >= 160], [true, true, true]);
}

{
  // ...and clean off the bottom.
  const at = pop(box(1264, 1600, 96, 34), DESKTOP, WANT);
  check('nor can one scrolled off the bottom',
    [at.down, at.bottom >= api.LAUNCHER_EDGE, at.maxHeight >= 160], [false, true, true]);
}

{
  // The exhaustive sweep, the same shape as the floating one above.
  const bad = [];
  for (const view of [{ width: 1440, height: 900 }, { width: 380, height: 720 },
    { width: 1024, height: 500 }]) {
    for (const left of [-200, 0, 40, view.width - 100, view.width + 50]) {
      for (const top of [-500, -10, 0, 60, view.height - 20, view.height + 200]) {
        const at = pop(box(left, top, 96, 34), view, WANT);
        const pinned = at.down ? at.top : at.bottom;
        if (pinned == null || pinned < 0 || at.right < 0) { bad.push(at); continue; }
        if (at.right + at.maxWidth > view.width) bad.push(at);
        if (at.maxHeight < 160 || at.maxWidth < 240) bad.push(at);
      }
    }
  }
  check('no button position puts the popover off screen or squeezes it to nothing',
    bad, []);
}

check('the popover always opens into the larger of the two gaps',
  [box(1264, 100, 96, 34), box(1264, 700, 96, 34), box(1264, 440, 96, 34)]
    .map((b) => {
      const at = pop(b, DESKTOP, WANT);
      const above = b.top;
      const below = DESKTOP.height - b.bottom;
      return at.down === (below >= above);
    }),
  [true, true, true]);

// --- docked mode: which container the button goes into ---------------------
//
// `dockHostFor` is the decision half of `findDockHost`, split out so it can be
// fed a few fake nodes. Two shapes: the mobile banner, where the travel
// control is one `li` in a row of them and ours has to be another `li` in the
// same row, and everywhere else, where it goes in beside the travel button as
// the last child of its container. The `UL`/`OL` test is what keeps `li` mode
// honest — a bare `closest('li')` would also fire for a Travel button that
// merely happens to sit inside some list further up the tree.

function fakeNode(tag, className, parent, li) {
  return {
    tagName: tag,
    className: className || '',
    parentElement: parent || null,
    closest: (sel) => (sel === 'li' ? li || null : null),
  };
}

{
  // Wide desktop: <div class="travel"><button class="travel-button--infobar">
  // `div.travel` is the whole right-hand column (captured 2026-09-03), so
  // `after` is what keeps the launcher next to the button instead of at the
  // bottom of the ad and the snippets that follow it.
  const travelDiv = fakeNode('DIV', 'travel');
  const travelBtn = fakeNode('BUTTON', 'travel-button--infobar', travelDiv);
  const host = api.dockHostFor(travelBtn);
  check('the sidebar Travel button docks the launcher into its own container',
    [host.container === travelDiv, host.tag, host.className], [true, 'span', '']);
  check('...immediately behind the button, not at the end of the column',
    host.after === travelBtn, true);
}

{
  // Narrower desktop: the classless button in .storylets__welcome-and-travel
  const row = fakeNode('DIV', 'storylets__welcome-and-travel');
  const host = api.dockHostFor(fakeNode('BUTTON', 'button button--primary', row));
  check('the classless Travel button docks into the welcome-and-travel row',
    [host.container === row, host.tag], [true, 'span']);
}

{
  // Mobile: <ul><li class="banner-item"><button title="Map">
  const bannerList = fakeNode('UL', 'banner');
  const item = fakeNode('LI', 'banner-item', bannerList);
  const host = api.dockHostFor(fakeNode('BUTTON', 'banner__button', item, item));
  check('the compass gets the launcher its own <li> in the same banner row',
    [host.container === bannerList, host.tag, host.className],
    [true, 'li', 'banner-item']);
  check('...appended to the row, because there the container really is just the row',
    host.after, null);
}

{
  // A travel control that merely happens to be inside a list item somewhere:
  // NOT the banner, because the item's parent isn't a list.
  const div = fakeNode('DIV', 'wrapper');
  const strayItem = fakeNode('LI', 'something', div);
  const host = api.dockHostFor(fakeNode('BUTTON', '', div, strayItem));
  check('an <li> whose parent is not a list is not the banner',
    host.tag, 'span');
}

check('nothing to dock into is a supported answer, not a crash',
  [api.dockHostFor(null), api.dockHostFor(fakeNode('BUTTON', '', null))],
  [null, null]);

check('docking is the default, and the preference survives a round trip',
  (() => {
    const first = api.dockPreferred();
    api.setDockPreferred(false);
    const floated = api.dockPreferred();
    api.setDockPreferred(true);
    return [first, floated, api.dockPreferred()];
  })(),
  // No `localStorage` in this stub at all, so every read falls back to the
  // default -- which is the point: an unreadable store must not un-dock it.
  [true, true, true]);

// --- the selectors ---------------------------------------------------------

check('all three verified travel shapes have a selector',
  ['.travel-button--infobar', '.storylets__welcome-and-travel button', 'button[title="Map"]']
    .filter((sel) => !api.TRAVEL_SELECTORS.includes(sel)),
  []);

check('the launcher still runs first, so it is on screen from the initial pass',
  api.FEATURES[0].name, 'launcher');

console.log(failures ? '\n' + failures + ' check(s) FAILED.' : '\nAll checks passed.');
process.exit(failures ? 1 : 0);
