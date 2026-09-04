// Ad-hoc test for FallenLondon/ux-enhancers.js's launcher DOCKING.
//
// There's no test runner in this repo (see AGENTS.md). This is a standalone
// Node script: it reads the userscript, evaluates its IIFE against a stub DOM
// and pulls out the internals.
//
// `ux-launcher-placement.test.mjs` covers the two placement RULES, which are
// pure. This one covers the other half, which is not: moving a button in and
// out of Fallen London's own chrome. That is where the risk actually is, so
// the stub here is a small but real DOM — parent links, `contains`, `closest`,
// a selector matcher, `getBoundingClientRect`, live `isConnected` — with two
// fake FL layouts built out of the markup the script quotes as verified.
//
// What's worth pinning, all of it a way the docking could go wrong in the game
// while looking fine in a diff:
//
//  - It docks at all, into the right container, in both shapes: a plain
//    wrapper beside the sidebar's Travel button, and its own `li` in the
//    mobile banner's row of icons.
//  - It is IDEMPOTENT. `mountLauncher` runs on every debounced DOM change, so
//    a second run that appends a second button (or a second root) would leave
//    the page filling up with them.
//  - It repairs itself. React owns those containers and will drop our node on
//    a re-render; the next scan has to put it back, and not by building a
//    whole second launcher.
//  - It follows a LAYOUT SWAP. FL renders a different travel control per
//    layout, so the container the button is docked in can simply cease to
//    exist.
//  - The float toggle really moves the button back into the popover root, and
//    takes the wrapper out of FL's chrome on the way (a wrapper left behind
//    would keep `crowdedLeft` seeing a neighbour that isn't there).
//  - The docked button is never mistaken for the travel control itself. Parked
//    in `.storylets__welcome-and-travel` it matches one of TRAVEL_SELECTORS
//    literally, which would be a quiet little infinite regress.
//  - The Fruits of the Zee DEPTH CONTROL, which docks by the same rules and is
//    the second thing to want the one spot beside the travel control: it has to
//    queue up behind the launcher rather than fight it for that place, be as
//    idempotent as the launcher is (it is redrawn by the scan its own writes
//    trigger, so a rebuild every pass would be an infinite loop), collapse to
//    one button in the mobile banner, and be gone entirely once you surface.
//  - Its palette. The control is a LIGHT card in a dark page, which is the
//    whole point of it (it has to read as a control of ours rather than as one
//    more dark box) -- and a light card means every colour written on it has
//    to be a dark one. Reaching for `UI.text`, the cream the panels use, would
//    leave it unreadable while looking perfectly reasonable in a diff.
//
//   node FallenLondon/test/ux-launcher-docking.test.mjs

import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const here = dirname(fileURLToPath(import.meta.url));
const src = readFileSync(join(here, '..', 'ux-enhancers.js'), 'utf8');

// --- stub DOM --------------------------------------------------------------

function makeEl(tag) {
  const el = {
    tagName: (tag || 'span').toUpperCase(),
    nodeType: 1,
    id: '',
    className: '',
    title: '',
    style: { cssText: '' },
    dataset: {},
    attrs: {},
    children: [],
    childNodes: [],
    parentNode: null,
    rect: { left: 0, top: 0, width: 100, height: 30 },
    get parentElement() { return this.parentNode; },
    // Live, not a flag: "still in the document" is exactly the question
    // `rendered()` asks after FL has re-rendered something out from under us.
    get isConnected() {
      let n = this;
      while (n.parentNode) n = n.parentNode;
      return n === doc.documentElement;
    },
    get textContent() {
      return this.childNodes.map((c) => (c.nodeType === 3 ? c.nodeValue : c.textContent)).join('');
    },
    set textContent(v) {
      this.children = [];
      this.childNodes = [];
      if (v) this.appendChild(doc.createTextNode(v));
    },
    get previousElementSibling() {
      if (!this.parentNode) return null;
      const i = this.parentNode.children.indexOf(this);
      return i > 0 ? this.parentNode.children[i - 1] : null;
    },
    // Its mirror image, which the depth control uses: it has to sit
    // immediately BEFORE the hand rather than immediately after an anchor.
    get nextElementSibling() {
      if (!this.parentNode) return null;
      const i = this.parentNode.children.indexOf(this);
      return i >= 0 ? this.parentNode.children[i + 1] || null : null;
    },
    get nextSibling() {
      if (!this.parentNode) return null;
      const i = this.parentNode.childNodes.indexOf(this);
      return i >= 0 ? this.parentNode.childNodes[i + 1] || null : null;
    },
    appendChild(c) {
      if (c.parentNode) c.remove();
      c.parentNode = this;
      this.childNodes.push(c);
      if (c.nodeType === 1) this.children.push(c);
      return c;
    },
    insertBefore(c, ref) {
      if (!ref) return this.appendChild(c);
      if (c.parentNode) c.remove();
      c.parentNode = this;
      const i = this.childNodes.indexOf(ref);
      this.childNodes.splice(i < 0 ? this.childNodes.length : i, 0, c);
      if (c.nodeType === 1) {
        // Where it lands among the ELEMENTS is what the assertions read, so
        // find the first element at or after the reference node.
        let j = this.children.length;
        for (let k = this.childNodes.indexOf(c) + 1; k < this.childNodes.length; k++) {
          const idx = this.children.indexOf(this.childNodes[k]);
          if (idx >= 0) { j = idx; break; }
        }
        this.children.splice(j, 0, c);
      }
      return c;
    },
    after() {},
    remove() {
      const p = this.parentNode;
      if (!p) return;
      p.childNodes = p.childNodes.filter((n) => n !== this);
      p.children = p.children.filter((n) => n !== this);
      this.parentNode = null;
    },
    contains(other) {
      for (let n = other; n; n = n.parentNode) if (n === this) return true;
      return false;
    },
    closest(sel) {
      for (let n = this; n; n = n.parentNode) if (n.nodeType === 1 && matches(n, sel)) return n;
      return null;
    },
    setAttribute(k, v) { this.attrs[k] = v; },
    getAttribute(k) { return Object.prototype.hasOwnProperty.call(this.attrs, k) ? this.attrs[k] : null; },
    addEventListener() {},
    getBoundingClientRect() {
      const r = this.rect;
      return {
        left: r.left, top: r.top, width: r.width, height: r.height,
        right: r.left + r.width, bottom: r.top + r.height,
      };
    },
    querySelector(sel) { return descendants(this).find((n) => matches(n, sel)) || null; },
    querySelectorAll(sel) { return descendants(this).filter((n) => matches(n, sel)); },
  };
  el.classList = { contains: (c) => el.className.split(/\s+/).includes(c) };
  return el;
}

function descendants(root) {
  const out = [];
  (function walk(n) {
    for (const c of n.children) { out.push(c); walk(c); }
  })(root);
  return out;
}

// A selector matcher good enough for TRAVEL_SELECTORS and the "anything
// clickable named Travel" backstop: comma groups, descendant combinators,
// tag/class/attribute simple selectors.
function matches(el, sel) {
  return sel.split(',').some((part) => matchesOne(el, part.trim()));
}
function matchesOne(el, sel) {
  const parts = sel.split(/\s+/).filter(Boolean);
  const own = parts.pop();
  if (!matchesSimple(el, own)) return false;
  let node = el.parentNode;
  for (const want of parts.slice().reverse()) {
    let found = false;
    for (; node; node = node.parentNode) {
      if (node.nodeType === 1 && matchesSimple(node, want)) {
        found = true;
        node = node.parentNode;
        break;
      }
    }
    if (!found) return false;
  }
  return true;
}
function matchesSimple(el, sel) {
  const m = /^([a-zA-Z]+)?((?:\.[\w-]+)*)(?:\[([\w-]+)(?:="([^"]*)")?\])?$/.exec(sel);
  if (!m) return false;
  if (m[1] && el.tagName !== m[1].toUpperCase()) return false;
  if (m[2]) {
    const classes = el.className.split(/\s+/);
    for (const c of m[2].split('.').filter(Boolean)) if (!classes.includes(c)) return false;
  }
  if (m[3]) {
    const v = m[3] === 'title' ? el.title : el.getAttribute(m[3]);
    if (v == null || v === '') return false;
    if (m[4] != null && v !== m[4]) return false;
  }
  return true;
}

const doc = {
  documentElement: null,
  body: null,
  createElement: (t) => makeEl(t),
  createTextNode: (t) => ({
    nodeType: 3,
    nodeValue: String(t),
    textContent: String(t),
    parentNode: null,
    remove() {
      if (!this.parentNode) return;
      this.parentNode.childNodes = this.parentNode.childNodes.filter((n) => n !== this);
      this.parentNode = null;
    },
  }),
  getElementById: (id) => descendants(doc.documentElement).find((n) => n.id === id) || null,
  querySelector: (sel) => descendants(doc.documentElement).find((n) => matches(n, sel)) || null,
  querySelectorAll: (sel) => descendants(doc.documentElement).filter((n) => matches(n, sel)),
  addEventListener() {},
  elementsFromPoint: () => [],
};
doc.documentElement = makeEl('html');
doc.body = doc.documentElement.appendChild(makeEl('body'));

// --- two fake Fallen London layouts ---------------------------------------
//
// Both built from the markup ux-enhancers.js quotes as verified (2026-09-02).

function clearPage() {
  doc.body.children.slice().forEach((c) => c.remove());
}

// Wide desktop, from a real capture (2026-09-03). The shape that matters here
// is that `div.travel` is NOT a little box around the travel button — it is the
// whole right-hand column: the welcome heading, the button (which reads "View
// map", not "Travel"), a Steam ad, and two `.snippet` blocks after it. That is
// why the launcher has to sit immediately BEHIND the button rather than being
// appended to the container, and the trailing junk here is what proves it.
function wideLayout() {
  clearPage();
  const outer = doc.body.appendChild(makeEl('div'));
  outer.className = 'col-tertiary';
  const col = outer.appendChild(makeEl('div'));
  col.className = 'col-1-of-3';
  const travel = col.appendChild(makeEl('div'));
  travel.className = 'travel';
  travel.rect = { left: 1180, top: 120, width: 180, height: 900 };

  const welcome = travel.appendChild(makeEl('p'));
  welcome.className = 'heading heading--3';
  welcome.textContent = 'Welcome to';

  const btn = travel.appendChild(makeEl('button'));
  btn.className = 'button button--primary travel-button--infobar';
  btn.textContent = 'View map';
  btn.rect = { left: 1180, top: 200, width: 180, height: 48 };

  const ad = travel.appendChild(makeEl('a'));
  ad.className = 'ad';
  const snippetOne = travel.appendChild(makeEl('div'));
  snippetOne.className = 'snippet';
  const snippetTwo = travel.appendChild(makeEl('div'));
  snippetTwo.className = 'snippet';

  return { travel: travel, btn: btn, ad: ad, tail: snippetTwo };
}

// Mobile: <ul class="banner"><li class="banner-item"><button title="Map">
function bannerLayout() {
  clearPage();
  const list = doc.body.appendChild(makeEl('ul'));
  list.className = 'banner';
  const first = list.appendChild(makeEl('li'));
  first.className = 'banner-item';
  first.rect = { left: 20, top: 790, width: 40, height: 40 };
  const item = list.appendChild(makeEl('li'));
  item.className = 'banner-item';
  item.rect = { left: 300, top: 790, width: 40, height: 40 };
  const btn = item.appendChild(makeEl('button'));
  btn.className = 'button--link banner__button';
  btn.title = 'Map';
  btn.rect = { left: 300, top: 790, width: 40, height: 40 };
  const icon = btn.appendChild(makeEl('i'));
  icon.className = 'fa fa-compass fa-3x';
  icon.rect = { left: 305, top: 795, width: 30, height: 30 };
  return { list: list, item: item, btn: btn };
}

let layout = wideLayout();

const store = new Map();
const storage = {
  getItem: (k) => (store.has(k) ? store.get(k) : null),
  setItem: (k, v) => { store.set(k, String(v)); },
  removeItem: (k) => { store.delete(k); },
};
const win = {
  innerWidth: 1440,
  innerHeight: 900,
  addEventListener() {},
};

const wrapped = src
  .replace('(function () {', 'globalThis.__flux = (function () {')
  .replace(/\}\)\(\);\s*$/,
    'return { mountLauncher, dockLauncher, positionLauncher, findTravelAnchor,'
    + ' dockPreferred, setDockPreferred, LAUNCHER_ID, LAUNCHER_BUTTON_ID,'
    + ' fotzDepthControls, fotzSetDepth, DEPTH_ROW_ID, DEPTH_DOCK_ID,'
    + ' DEPTH_BG, DEPTH_EDGE, DEPTH_INK, DEPTH_DIM, DEPTH_ON }; })();');
const api = new Function(
  'document', 'MutationObserver', 'requestAnimationFrame', 'getComputedStyle', 'console',
  'URLSearchParams', 'localStorage', 'sessionStorage', 'location', 'Event', 'window',
  wrapped + '\nreturn globalThis.__flux;')(
  doc, class { observe() {} }, (f) => f(), () => ({ position: 'static' }), console,
  URLSearchParams, storage, storage, { pathname: '/' }, class {}, win);

let failures = 0;
function check(label, got, expected) {
  const g = JSON.stringify(got);
  const e = JSON.stringify(expected);
  const ok = g === e;
  if (!ok) failures++;
  console.log((ok ? 'PASS' : 'FAIL'), '|', label);
  if (!ok) console.log('   expected:', e, '\n   got:     ', g);
}

const button = () => doc.getElementById(api.LAUNCHER_BUTTON_ID);
const root = () => doc.getElementById(api.LAUNCHER_ID);
const dock = () => (button() ? button().parentNode : null);

// The IIFE's own initial scan has already mounted it into the wide layout.

// --- it docks --------------------------------------------------------------

check('the button is docked inside FL\'s own travel container, not floating',
  [dock().tagName, dock().parentNode === layout.travel], ['SPAN', true]);

// THE BUG (reported 2026-09-03): `div.travel` is the whole sidebar column, so
// appending to it put the launcher below the ad and both snippets — a
// screenful down the page from the control it is supposed to be beside.
check('and it sits immediately BEHIND the travel button, not at the end of the column',
  [dock().previousElementSibling === layout.btn,
    layout.travel.children.indexOf(dock()),
    layout.travel.children.length],
  [true, 2, 6]);

check('so everything FL puts after the button is still after ours',
  layout.travel.children.slice(3).map((c) => c.className),
  ['ad', 'snippet', 'snippet']);

check('the popover root is on the body and holds only the panel and the menu',
  [root().parentNode.tagName, root().children.length], ['BODY', 2]);

check('the button is not a child of the root any more',
  root().contains(button()), false);

// --- it is idempotent ------------------------------------------------------

api.mountLauncher();
api.mountLauncher();
check('running the mount again adds nothing and moves nothing — it runs on every DOM change',
  [layout.travel.children.length, layout.travel.children.indexOf(dock()),
    root().children.length, doc.body.children.length],
  [6, 2, 2, 2]);

// --- it repairs itself -----------------------------------------------------

dock().remove();
check('a React re-render can take the button away', button(), null);

api.mountLauncher();
check('and the next scan puts it back where it belongs',
  [!!button(), dock().previousElementSibling === layout.btn], [true, true]);

// React re-rendering the column can leave something new sitting between the
// travel button and ours. Being in the right container is not enough — the
// launcher has to walk back up to the button.
layout.travel.insertBefore(makeEl('div'), dock());
check('something inserted between the two counts as misplaced',
  dock().previousElementSibling === layout.btn, false);
api.mountLauncher();
check('...and the next scan closes the gap again',
  dock().previousElementSibling === layout.btn, true);

check('without building a second launcher to do it', doc.body.children.length, 2);

// --- it follows a layout swap ---------------------------------------------

const oldTravel = layout.travel;
layout = wideLayout();
api.mountLauncher();
check('a whole new layout gets the button re-docked into the new container',
  [dock().parentNode === layout.travel, oldTravel.isConnected], [true, false]);

// --- the mobile banner gets an <li> of its own ----------------------------

layout = bannerLayout();
api.mountLauncher();
check('in the banner the button gets its own <li>, in the same row as the compass',
  [dock().tagName, dock().className, dock().parentNode === layout.list],
  ['LI', 'banner-item', true]);

check('and it is added to the row, never inside FL\'s own item',
  [layout.list.children.length, layout.item.children.length], [3, 1]);

check('the compass is still found through its icon, not confused with ours',
  api.findTravelAnchor() === layout.btn, true);

// A pill reading "⚙ UX" in a row of 40px icons is twice the width of anything
// beside it, so the banner gets the cog on its own.
check('in the banner the label loses the word and keeps the cog',
  button().textContent, '⚙');

// --- the float toggle ------------------------------------------------------

api.setDockPreferred(false);
api.dockLauncher();
check('floating puts the button back inside the popover root',
  [button().parentNode === root(), root().children.length], [true, 3]);

// THE BUG (reported 2026-09-03): the root carries `pointer-events:none` so its
// fixed box doesn't swallow clicks on the game behind it, and every real child
// has to opt back in. The button was the one that didn't — and it is only a
// child of the root while FLOATING, so docking hid the problem. Undocking then
// killed the only control that could undock it, and the choice is remembered
// in localStorage, so a reload didn't help either. There was no way back.
// (The root's own `none` is in its `cssText`, which this stub keeps as a
// string rather than parsing into properties — hence the substring test.)
check('...and the floating button is still clickable, or there is no way back',
  [root().style.cssText.includes('pointer-events:none'), button().style.pointerEvents],
  [true, 'auto']);

check('every child of the root opts back into pointer events',
  root().children.map((c) => c.style.pointerEvents), ['auto', 'auto', 'auto']);

check('and takes our wrapper out of FL\'s chrome with it',
  layout.list.children.length, 2);

check('and floating gets the full pill back',
  button().textContent, '⚙ UX');

api.setDockPreferred(true);
api.dockLauncher();
check('docking again returns it to the banner row',
  [dock().className, root().children.length, button().textContent],
  ['banner-item', 2, '⚙']);

// --- we are never our own travel control ----------------------------------
//
// Docked into `.storylets__welcome-and-travel`, our button matches
// `.storylets__welcome-and-travel button` literally. `findTravelAnchor` has to
// know the difference or it anchors to itself.

{
  clearPage();
  const row = doc.body.appendChild(makeEl('div'));
  row.className = 'storylets__welcome-and-travel';
  row.rect = { left: 300, top: 200, width: 700, height: 48 };
  const travelBtn = row.appendChild(makeEl('button'));
  travelBtn.className = 'button button--primary';
  travelBtn.textContent = 'Travel';
  travelBtn.rect = { left: 900, top: 200, width: 90, height: 40 };

  api.mountLauncher();
  check('the classless Travel button is docked beside, in its own row',
    dock().parentNode === row, true);

  // Now hide FL's own button, so ours is the only thing the selector can find.
  travelBtn.rect = { left: 0, top: 0, width: 0, height: 0 };
  check('with FL\'s button gone, ours is still refused as the anchor',
    api.findTravelAnchor(), null);
}

// --- the popover hangs off wherever the button ended up -------------------

{
  layout = wideLayout();
  api.mountLauncher();
  button().rect = { left: 1264, top: 168, width: 96, height: 34 };
  api.positionLauncher();
  check('with room below, the popover is pinned by top and re-stacks',
    [root().style.top, root().style.bottom, root().style.flexDirection],
    ['210px', 'auto', 'column-reverse']);

  button().rect = { left: 1264, top: 800, width: 96, height: 34 };
  api.positionLauncher();
  check('with room above, it is pinned by bottom instead',
    [root().style.top, root().style.bottom, root().style.flexDirection],
    ['auto', '108px', 'column']);
}

// --- the Fruits of the Zee depth control ----------------------------------
//
// Same docking rules as the launcher, so the same risks -- plus one that is
// its own: two of our controls now want the place immediately after the travel
// control, and only one of them can have it.

const depthDock = () => doc.getElementById(api.DEPTH_DOCK_ID);
const depthRow = () => doc.getElementById(api.DEPTH_ROW_ID);

// The area is what gates the control, and the stub reaches it through the wide
// layout's own `p.welcome__current-area` -- the second of the two sources
// `currentArea` knows, and the only one this stub's selector matcher can see.
function setArea(where) {
  const p = doc.querySelector('.welcome__current-area');
  if (p) p.remove();
  if (where == null) return;
  const el = doc.body.appendChild(makeEl('p'));
  el.className = 'heading heading--2 welcome__current-area';
  el.textContent = where + ',';
}

{
  layout = wideLayout();
  api.mountLauncher();
  setArea('Mutton Island');
  api.fotzDepthControls();
  check('ashore there is no depth control at all', [depthDock(), depthRow()], [null, null]);

  setArea('the Royal Approach');
  const hand = doc.body.appendChild(makeEl('div'));
  hand.className = 'hand';
  api.fotzDepthControls();

  check('in the Royal Approach it docks beside the travel control, behind the UX button',
    [depthDock().tagName, depthDock().parentNode === layout.travel,
      depthDock().previousElementSibling === dock()],
    ['SPAN', true, true]);

  check('and it is the panel\'s own six buttons: auto and the five depths',
    depthDock().querySelectorAll('button').map((b) => b.textContent),
    ['auto', '1', '2', '3', '4', '5']);

  check('with a second copy in the page, immediately above the hand',
    [depthRow().parentNode === doc.body, depthRow().nextElementSibling === hand,
      depthRow().querySelectorAll('button').length],
    [true, true, 6]);

  // The one that would be an infinite loop in the game rather than a stray
  // node: this is redrawn by the same debounced scan its own writes trigger.
  const before = layout.travel.children.length;
  api.fotzDepthControls();
  api.fotzDepthControls();
  check('running it again adds nothing, moves nothing and rebuilds nothing',
    [layout.travel.children.length, layout.travel.children.indexOf(depthDock()),
      depthDock().querySelectorAll('button').length, doc.body.children.length],
    [before, 3, 6, 5]);

  // Setting a depth DOES have to redraw -- the buttons carry which one is on.
  api.fotzSetDepth(3);
  api.fotzDepthControls();
  check('setting the depth redraws it, and the label says where the depth came from',
    depthDock().textContent.includes('set to 3'), true);
  api.fotzSetDepth(null);
  api.fotzDepthControls();

  // React owns these containers; the launcher repairs itself and so must this.
  depthDock().remove();
  depthRow().remove();
  api.fotzDepthControls();
  check('a re-render can take either copy, and the next scan puts both back',
    [depthDock().previousElementSibling === dock(), depthRow().nextElementSibling === hand],
    [true, true]);

  setArea('Mutton Island');
  api.fotzDepthControls();
  check('surfacing takes both away again', [depthDock(), depthRow()], [null, null]);
}

// A row of six buttons is wider than the whole banner, so on a phone the
// docked copy is one button that cycles through the depths instead.
{
  layout = bannerLayout();
  api.mountLauncher();
  setArea('the Royal Approach');
  api.fotzDepthControls();

  check('in the banner it is its own <li> in the row, with a single button',
    [depthDock().tagName, depthDock().className, depthDock().parentNode === layout.list,
      depthDock().querySelectorAll('button').length],
    ['LI', 'banner-item', true, 1]);

  check('and it is behind the UX button, not in front of it',
    depthDock().previousElementSibling === dock(), true);

  setArea(null);
}

// --- the light blue card ---------------------------------------------------
//
// The control is deliberately not `UI`'s dark chrome: it lives in Fallen
// London's own page rather than inside a panel of ours. That makes the ink
// rules the same trade `FOTZ_INK` makes on the badges, and worth pinning,
// because "use UI.text like everything else does" is the natural wrong edit.

function luminance(hex) {
  const chan = (i) => {
    const v = parseInt(hex.substr(i, 2), 16) / 255;
    return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4);
  };
  return 0.2126 * chan(1) + 0.7152 * chan(3) + 0.0722 * chan(5);
}
function contrast(a, b) {
  const [x, y] = [luminance(a), luminance(b)].sort((p, q) => q - p);
  return (x + 0.05) / (y + 0.05);
}

check('the card is light, and every colour written on it is readable against it',
  [
    luminance(api.DEPTH_BG) > 0.6,
    contrast(api.DEPTH_INK, api.DEPTH_BG) >= 4.5,
    contrast(api.DEPTH_DIM, api.DEPTH_BG) >= 4.5,
    contrast(api.DEPTH_ON, api.DEPTH_BG) >= 4.5,
    // The chosen depth is a solid chip, so its own label is white on DEPTH_ON.
    contrast('#ffffff', api.DEPTH_ON) >= 4.5,
  ],
  [true, true, true, true, true]);

{
  layout = wideLayout();
  api.mountLauncher();
  setArea('the Royal Approach');
  const hand = doc.body.appendChild(makeEl('div'));
  hand.className = 'hand';
  api.fotzSetDepth(2);
  api.fotzDepthControls();

  check('both copies wear it — the docked chip and the row above the hand',
    [depthDock().style.cssText.includes(api.DEPTH_BG),
      depthRow().style.cssText.includes(api.DEPTH_BG)],
    [true, true]);

  check('and neither reaches for the panels\' dark chrome instead',
    [depthDock().style.cssText.includes('#1c1a17'),
      depthRow().style.cssText.includes('#242119')],
    [false, false]);

  const chosen = depthRow().querySelectorAll('button').filter((b) => b.textContent === '2')[0];
  const other = depthRow().querySelectorAll('button').filter((b) => b.textContent === '4')[0];
  check('the depth you chose is a solid chip and the rest are outlines',
    [chosen.style.cssText.includes('background:' + api.DEPTH_ON),
      other.style.cssText.includes('background:transparent')],
    [true, true]);

  api.fotzSetDepth(null);
  setArea(null);
}

console.log(failures ? '\n' + failures + ' check(s) FAILED.' : '\nAll checks passed.');
process.exit(failures ? 1 : 0);
