// Ad-hoc test for FallenLondon/ux-enhancers.js's equipment helper.
//
// There's no test runner in this repo (see AGENTS.md). This is a standalone
// Node script: it reads the userscript, evaluates its IIFE against a stub DOM
// and pulls out the internals.
//
// What it pins:
//
//  - Reading a stat off an item's label: only `Name +N` fields count, so the
//    flavour text and "Increases Nightmares build up" fall out, and a negative
//    is a negative. The labels here are VERBATIM from a /possessions capture
//    (2026-09-13); keep them verbatim.
//  - Per slot: every item tied for the top gets the star, and a slot where
//    nothing gives more than 0 gets none -- "Respectable -1" is not a best.
//  - BDR is Bizarre, Dreaded and Respectable ADDED TOGETHER on each item,
//    ranked per slot. The fixture holds the reported case: a worn Mary Lloyd
//    (Bizarre +3) against a Respectable Landau (+2), which the first cut --
//    comparing the three as separate outfits -- got the wrong way round.
//  - Menaces are words, not numbers: "Reduces Nightmares build up" is +1,
//    "greatly" +2, "massively" +4 (the Menaces guide's figures), and an
//    increase is the same scale negative, so it is never starred.
//  - The page: the Burden group's afflictions are never starred, a second pass
//    adds nothing, going back to All clears everything.
//  - The fake BDR option: placed after Bizarre, once; picking it clicks the
//    real "All" and records BDR; the control reads BDR; a real option picked
//    by click or by keyboard cancels it.
//
// The open react-select menu has NOT been captured. The options below follow
// react-select's own id scheme (`react-select-6-option-3`), which is exactly
// the unverified assumption the feature makes -- see its comment block.
//
//   node tests/ux-equipment-helper.test.mjs

import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const here = dirname(fileURLToPath(import.meta.url));
const src = readFileSync(join(here, '..', 'FallenLondon', 'ux-enhancers.js'), 'utf8');

let failures = 0;
function check(label, got, expected) {
  const g = JSON.stringify(got);
  const e = JSON.stringify(expected);
  const ok = g === e;
  if (!ok) failures++;
  console.log((ok ? 'PASS' : 'FAIL'), '|', label);
  if (!ok) console.log('   expected:', e, '\n   got:     ', g);
}

// --- stub DOM --------------------------------------------------------------

const docListeners = [];

function makeEl(tag) {
  const el = {
    tagName: String(tag || 'div').toUpperCase(),
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
    listeners: {},
    get parentElement() { return this.parentNode; },
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
      if (v !== '' && v != null) this.appendChild(doc.createTextNode(v));
    },
    get previousElementSibling() {
      if (!this.parentNode) return null;
      const i = this.parentNode.children.indexOf(this);
      return i > 0 ? this.parentNode.children[i - 1] : null;
    },
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
      this.childNodes.splice(this.childNodes.indexOf(ref), 0, c);
      if (c.nodeType === 1) {
        let j = this.children.length;
        for (let k = this.childNodes.indexOf(c) + 1; k < this.childNodes.length; k++) {
          const idx = this.children.indexOf(this.childNodes[k]);
          if (idx >= 0) { j = idx; break; }
        }
        this.children.splice(j, 0, c);
      }
      return c;
    },
    remove() {
      const p = this.parentNode;
      if (!p) return;
      p.childNodes = p.childNodes.filter((n) => n !== this);
      p.children = p.children.filter((n) => n !== this);
      this.parentNode = null;
    },
    after() {},
    contains(other) {
      for (let n = other; n; n = n.parentNode) if (n === this) return true;
      return false;
    },
    closest(sel) {
      for (let n = this; n; n = n.parentNode) if (n.nodeType === 1 && matches(n, sel)) return n;
      return null;
    },
    cloneNode() {
      const copy = makeEl(this.tagName);
      copy.id = this.id;
      copy.className = this.className;
      copy.attrs = Object.assign({}, this.attrs);
      return copy;
    },
    setAttribute(k, v) { this.attrs[k] = String(v); },
    getAttribute(k) { return Object.prototype.hasOwnProperty.call(this.attrs, k) ? this.attrs[k] : null; },
    removeAttribute(k) { delete this.attrs[k]; },
    addEventListener(type, fn) { (this.listeners[type] = this.listeners[type] || []).push(fn); },
    // A click as the browser delivers it: the document's capture listeners
    // first, then the node's own, then whatever React would have done.
    click() {
      const ev = { target: this, preventDefault() {}, stopPropagation() { this.stopped = true; } };
      docListeners.filter((l) => l.type === 'click' && l.capture).forEach((l) => l.fn(ev));
      (this.listeners.click || []).forEach((fn) => fn(ev));
      if (!ev.stopped && this.onReact) this.onReact();
    },
    getBoundingClientRect: () => ({ left: 0, top: 0, width: 0, height: 0, right: 0, bottom: 0 }),
    querySelector(sel) { return descendants(this).find((n) => matches(n, sel)) || null; },
    querySelectorAll(sel) { return descendants(this).filter((n) => matches(n, sel)); },
  };
  el.classList = { contains: (c) => String(el.className).split(/\s+/).includes(c) };
  return el;
}

function descendants(root) {
  const out = [];
  (function walk(n) {
    for (const c of n.children) { out.push(c); walk(c); }
  })(root);
  return out;
}

function matches(el, sel) {
  return sel.split(',').some((part) => matchesOne(el, part.trim()));
}
function matchesOne(el, sel) {
  const parts = sel.split(/\s+/).filter(Boolean);
  if (!matchesSimple(el, parts.pop())) return false;
  let node = el.parentNode;
  for (const want of parts.reverse()) {
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
  const m = /^([a-zA-Z]+)?((?:\.[\w-]+)*)(?:\[([\w-]+)(?:([*^$]?=)"([^"]*)")?\])?$/.exec(sel);
  if (!m) return false;
  if (m[1] && el.tagName !== m[1].toUpperCase()) return false;
  if (m[2]) {
    const classes = String(el.className).split(/\s+/);
    for (const c of m[2].split('.').filter(Boolean)) if (!classes.includes(c)) return false;
  }
  if (m[3]) {
    const v = m[3] === 'id' ? el.id : m[3] === 'title' ? el.title : el.getAttribute(m[3]);
    if (v == null || v === '') return false;
    if (m[4] === '=' && v !== m[5]) return false;
    if (m[4] === '*=' && !v.includes(m[5])) return false;
    if (m[4] === '^=' && !v.startsWith(m[5])) return false;
    if (m[4] === '$=' && !v.endsWith(m[5])) return false;
  }
  return true;
}

const doc = {
  documentElement: null,
  body: null,
  createElement: (t) => makeEl(t),
  createTextNode: (t) => ({ nodeType: 3, nodeValue: String(t), parentNode: null, remove() {} }),
  getElementById: (id) => descendants(doc.documentElement).find((n) => n.id === id) || null,
  querySelector: (sel) => descendants(doc.documentElement).find((n) => matches(n, sel)) || null,
  querySelectorAll: (sel) => descendants(doc.documentElement).filter((n) => matches(n, sel)),
  addEventListener(type, fn, capture) { docListeners.push({ type, fn, capture: !!capture }); },
  elementsFromPoint: () => [],
};
doc.documentElement = makeEl('html');
doc.body = doc.documentElement.appendChild(makeEl('body'));

const store = new Map();
const storage = {
  getItem: (k) => (store.has(k) ? store.get(k) : null),
  setItem: (k, v) => { store.set(k, String(v)); },
  removeItem: (k) => { store.delete(k); },
};

// --- a Possessions page, from the capture ----------------------------------

const add = (parent, tag, className, props) => {
  const el = parent.appendChild(makeEl(tag));
  el.className = className || '';
  Object.assign(el, props || {});
  return el;
};

// The "Show:" filter, shaped like the capture's react-select.
const possessions = add(doc.body, 'div', 'possessions');
const controls = add(possessions, 'div', 'outfit-controls');
add(controls, 'span', 'heading heading--3').textContent = 'Show:';
const showBox = add(controls, 'div', 'outfit-controls__dropdown-and-buttons');
const selectContainer = add(showBox, 'div', 'css-13ab8kc-container');
const control = add(selectContainer, 'div', 'css-f92gjm-control');
const valueContainer = add(control, 'div', 'css-hlgwow');
const singleValue = add(valueContainer, 'div', 'css-gj4dr3-singleValue');
singleValue.textContent = 'All';
const input = add(valueContainer, 'input', 'css-1hac4vs-dummyInput', { id: 'react-select-6-input' });
input.setAttribute('aria-expanded', 'false');

const list = add(possessions, 'ul', 'equipment-group-list');

function group(name, items, effects) {
  const li = add(list, 'li', 'equipment-group-list__item');
  const g = add(li, 'div', 'equipment-group');
  add(g, 'h2', 'heading heading--2 equipment-group__name').textContent = name;
  const nodes = {};
  if (effects) {
    for (const label of effects) {
      const node = add(g, 'div', 'effect-item');
      node.setAttribute('data-quality-id', '144454');
      add(node, 'div').setAttribute('aria-label', label);
      nodes[label.split(';')[0]] = node;
    }
    return nodes;
  }
  const wrap = add(g, 'div', 'equipment-group__slot-and-available-items');
  const slot = add(wrap, 'div', 'equipment-group__equipment-slot-container');
  const avail = add(wrap, 'ul', 'available-item-list');
  items.forEach(([id, label, equipped]) => {
    const node = equipped
      ? add(slot, 'div', 'equipped-item')
      : add(add(avail, 'li', 'available-item-list__item'), 'div', 'icon icon--emphasize icon--available-item');
    node.setAttribute('data-quality-id', id);
    add(node, 'div').setAttribute('aria-label', label);
    nodes[label.split(';')[0]] = node;
  });
  return nodes;
}

const burden = group('Burden', null, [
  'The Walls are Wrong; Watchful +1; Increases Nightmares build up; You are a little more plagued by nightmares than usual. This will go away when Time, the Healer comes.',
]);
const hat = group('Hat', [
  ['310', 'Beguiling Mask; Dangerous -1; Persuasive +6; Mysteriously irresistible.', true],
  ['303', "Prisoner's Mask; Shadowy +1; For some reason they make these things out of satin."],
  ['304', "Iron Hat; Dangerous +5; Persuasive -1; You can't go wrong with an iron hat."],
  ['309', "Sneak-Thief's Mask; Shadowy +5; Persuasive -1; Gorchett & Sons: Reliable."],
  ['312', 'Extraordinary Hat; Watchful +8; Shadowy -1; Dangerous +2; If there is a hat more extraordinary, nobody has seen it.'],
  ['556', "Ridiculous Hat; Respectable -1; It's hard even to take yourself seriously in this extraordinary creation."],
]);
const clothing = group('Clothing', [
  ['1', "Ratskin Suit; Shadowy +6; Persuasive -1; Dreaded +1; Neathproofed +1; Commonplace There are those as looks down on your 'umble ratskin. But your 'umble ratskin is hard-wearin', it's waterproof, and it's remarkable warm. And silk comes out of a worm's arse.", true],
  ['2', "Neddy Suit; Shadowy +3; Dangerous +1; Dreaded +1; 'Yer basic tatty suit, wiv deep pockets an' a little loop for yer stick...' The kind of garb that a neddy-man might wear on the business of the Masters."],
  ['3', 'Academic Gown; Watchful +5; Dangerous -1; Respectable +1; To achieve this distinction, you have certainly proved your Watchfulness. Black is the colour of academic respectability. It billows impressively when you run, too.'],
]);
const gloves = group('Gloves', [
  ['21848', "Pair of Lenguals; Shadowy +10; Bizarre +1; Polythreme's finest: gloves that can taste! And speak! And salivate!"],
  ['144261', "Gossamer Palms; Shadowy +10; Bizarre +1; Made of silk harvested from Saviour's Rocks. Sticky as sin, and quiet as death."],
]);
const adornment = group('Adornment', [
  ['991', 'Dilmun Club Lapel Badge; Watchful +5; Bizarre +1; Opens a surprising number of doors, to those few in the know.'],
]);
// Not from the capture: the Factions guide's stats for it, in the label shape
// the capture uses. It is what makes Dreaded the BDR winner here.
const weapon = group('Weapon', [
  ['9001', 'Unexploded Mine; Persuasive +10; Dreaded +1; A souvenir of the Pillared Sea.'],
]);
// The reported case (2026-09-13): the Mary Lloyd worn, and BDR starring the
// Landau over it. The Litter-Cyst carries two of the three and lands between.
// Labels from the capture; the Litter-Cyst's dash was mangled there and is
// restored.
const transportation = group('Transportation', [
  ['140462', "Semi-Automated Mary Lloyd; Dangerous +4; Bizarre +3; Is this a child's toy, or a discarded festival invention? The creature's jaw is wired in such a way that as you cycle, its mouth clacks open and closed. Guaranteed to frighten the horses.", true],
  ['9002', 'Respectable Landau; Respectable +2; A steady convertible carriage. Just the sort of thing for visiting maiden aunts and impressionable suitees.'],
  ['9003', "Weeping Litter-Cyst; Watchful +3; Dreaded +1; Bizarre +1; Zeefaring +1; A replica of the Fathomking's own. His Complexity's is much larger, of course — but even this small reef-bier has its power."],
]);
// Menaces (2026-09-13): the Goldfish reduces Nightmares, the Weasel greatly
// increases Wounds. Both verbatim from the capture.
const companion = group('Companion', [
  ['464', 'Cheerful Goldfish; Reduces Nightmares build up; A happy addition to your household.'],
  ['144549', "Weasel of Woe; Watchful -300; Shadowy -300; Dangerous -300; Persuasive -300; Kataleptic Toxicology -10; Monstrous Anatomy -10; A Player of Chess -10; Glasswork -10; Shapeling Arts -10; Artisan of the Red Science -10; Mithridacy -10; Zeefaring -10; Woeful +1; Chthonosophy -10; Greatly increases Wounds build up; It's not the weasel's woe. No, this weasel brings you misfortune."],
]);

const wrapped = src
  .replace('(function () {', 'globalThis.__flux = (function () {')
  .replace(/\}\)\(\);\s*$/,
    'return { parseItemStats, itemScore, bestInSlot, readEquipmentGroups,'
    + ' findShowControl, equipmentHelper, equipSummary, bdrChosen, setBdrChosen, FEATURES,'
    + ' EQUIP_MARK_CLASS, EQUIP_SUMMARY_ID, EQUIP_BDR_VALUE_ID, EQUIP_BDR_KEY }; })();');
const api = new Function(
  'document', 'MutationObserver', 'requestAnimationFrame', 'getComputedStyle', 'console',
  'URLSearchParams', 'localStorage', 'sessionStorage', 'location', 'Event',
  wrapped + '\nreturn globalThis.__flux;')(
  doc, class { observe() {} }, () => {}, () => ({ position: 'static', color: 'rgb(51, 51, 51)' }),
  console, URLSearchParams, storage, storage, { pathname: '/possessions' }, class {});

// --- reading a label -------------------------------------------------------

const stats = (label) => Object.fromEntries(api.parseItemStats(label));

check('a label gives its stats and nothing else -- flavour and "Commonplace" fall out',
  stats(clothing['Ratskin Suit'].children[0].getAttribute('aria-label')),
  { shadowy: 6, persuasive: -1, dreaded: 1, neathproofed: 1 });
check('a menace line is scored, not dropped: "Increases Nightmares build up" counts against',
  stats(burden['The Walls are Wrong'].children[0].getAttribute('aria-label')),
  { watchful: 1, nightmares: -1 });
check('reduces is +1 and greatly +2 -- a two-word menace and an italicised name included',
  [stats('Cheerful Goldfish; Reduces Nightmares build up; A happy addition to your household.'),
    stats('<i>Obstinate</i>-class Cruiser; Dangerous +5; Dreaded +2; Zailing Speed +55; Greatly reduces Troubled Waters build up; 300mm main guns.')],
  [{ nightmares: 1 }, { dangerous: 5, dreaded: 2, 'zailing speed': 55, 'troubled waters': 2 }]);
check('massively is +4, per the Menaces guide, and an increase is the same scale negative',
  [stats('Test Item; Massively reduces Scandal build up; flavour'),
    stats('Test Item; Massively increases Scandal build up; flavour'),
    stats('Test Item; Greatly increases Wounds build up; flavour')],
  [{ scandal: 4 }, { scandal: -4 }, { wounds: -2 }]);
check('a negative stays negative', stats(hat['Ridiculous Hat'].children[0].getAttribute('aria-label')),
  { respectable: -1 });
check('an advanced skill reads like any other stat',
  stats('The Forsaken Crown of a Grand Devil; Watchful +4; Dreaded +1; Artisan of the Red Science +1; The colossal, many-tined, still-smouldering cast-off of a Grand Devil of Mt Palmerston.'),
  { watchful: 4, dreaded: 1, 'artisan of the red science': 1 });

// --- per slot --------------------------------------------------------------

const groups = api.readEquipmentGroups(doc);
const slot = (name) => groups.find((g) => g.slot === name);
const names = (best) => best.items.map((i) => i.name);

check('the Burden group\'s afflictions are not equipment',
  groups.map((g) => g.slot),
  ['Hat', 'Clothing', 'Gloves', 'Adornment', 'Weapon', 'Transportation', 'Companion']);
check('the item you are wearing is a candidate too',
  slot('Hat').items.filter((i) => i.equipped).map((i) => i.name), ['Beguiling Mask']);
check('the best in a slot, by the filter\'s own wording',
  [names(api.bestInSlot(slot('Hat').items, 'Shadowy')), api.bestInSlot(slot('Hat').items, 'Shadowy').value],
  [["Sneak-Thief's Mask"], 5]);
check('two tied at the top are both the best',
  names(api.bestInSlot(slot('Gloves').items, 'Shadowy')), ['Pair of Lenguals', 'Gossamer Palms']);
check('a slot where nothing gives any has no best -- not even the least-bad -1',
  [api.bestInSlot(slot('Hat').items, 'Respectable'), api.bestInSlot(slot('Hat').items, 'Bizarre').items],
  [{ value: 0, items: [] }, []]);

// --- BDR -------------------------------------------------------------------
//
// Bizarre, Dreaded and Respectable added together on each item, ranked per
// slot like any other stat.

const item = (name) => groups.flatMap((g) => g.items).find((i) => i.name === name);
check('an item\'s BDR is its three added together',
  ['Semi-Automated Mary Lloyd', 'Respectable Landau', 'Weeping Litter-Cyst', 'Iron Hat']
    .map((n) => api.itemScore(item(n), 'BDR')), [3, 2, 2, 0]);
check('THE REPORTED CASE: the worn Mary Lloyd\'s Bizarre +3 beats the Landau\'s Respectable +2',
  [names(api.bestInSlot(slot('Transportation').items, 'BDR')),
    api.bestInSlot(slot('Transportation').items, 'BDR').value],
  [['Semi-Automated Mary Lloyd'], 3]);
check('...while Respectable on its own still picks the Landau',
  names(api.bestInSlot(slot('Transportation').items, 'Respectable')), ['Respectable Landau']);
check('a negative among the three counts against the item',
  api.itemScore({ stats: new Map([['bizarre', 2], ['respectable', -1]]) }, 'BDR'), 1);
check('a slot with none of the three, or only a minus, has no BDR star',
  api.bestInSlot(slot('Hat').items, 'BDR').items, []);

// --- on the page -----------------------------------------------------------

const marked = () => doc.querySelectorAll('.' + api.EQUIP_MARK_CLASS).map((m) => m.parentNode.children[0]
  .getAttribute('aria-label').split(';')[0]);
const summary = () => doc.getElementById(api.EQUIP_SUMMARY_ID);

api.equipmentHelper();
check('with the filter on All nothing is marked and there is no summary', [marked(), summary()], [[], null]);

singleValue.textContent = 'Watchful';
api.equipmentHelper();
check('Watchful: the best of each slot, and never the Burden affliction',
  marked(), ['Extraordinary Hat', 'Academic Gown', 'Dilmun Club Lapel Badge', 'Weeping Litter-Cyst']);
check('the summary sits above the list and says what the stars add up to',
  [summary().nextElementSibling === list,
    summary().textContent.includes('★') && summary().textContent.includes('+21 Watchful')],
  [true, true]);

api.equipmentHelper();
api.equipmentHelper();
check('a second and third pass add nothing', marked().length, 4);

singleValue.textContent = 'Shadowy';
api.equipmentHelper();
check('changing the stat moves the stars, ties included',
  marked(), ["Sneak-Thief's Mask", 'Ratskin Suit', 'Pair of Lenguals', 'Gossamer Palms']);
check('...and an item no longer best loses its outline as well as its star',
  hat['Extraordinary Hat'].style.boxShadow, '');

singleValue.textContent = 'Nightmares';
api.equipmentHelper();
check('Nightmares: the item reducing its build-up is starred, not the Burden affliction adding to it',
  marked(), ['Cheerful Goldfish']);
check('...and the summary talks about build-up, on the guide\'s scale',
  summary().textContent,
  '★ marks the item in each slot that does most against Nightmares build-up (every one, where two '
  + 'tie). Worn together they score 1 on the Menaces guide\'s scale: reduces 1, greatly 2, massively 4.');

singleValue.textContent = 'Wounds';
api.equipmentHelper();
check('Wounds: an item that only makes it worse gets no star, and the summary says nothing helps',
  [marked(), summary().textContent], [[], 'None of your equipment reduces Wounds build-up.']);

singleValue.textContent = 'All';
api.equipmentHelper();
check('back to All clears every star and the summary', [marked(), summary()], [[], null]);

// --- the fake BDR option ---------------------------------------------------

const menu = add(selectContainer, 'div', 'css-menu');
const menuList = add(menu, 'div', 'css-menulist');
const optionNames = ['All', 'Watchful', 'Shadowy', 'Dangerous', 'Persuasive', 'Bizarre', 'Dreaded', 'Respectable'];
const options = optionNames.map((name, i) => {
  const o = add(menuList, 'div', 'css-option', { id: 'react-select-6-option-' + i });
  o.setAttribute('aria-selected', i === 0 ? 'true' : 'false');
  o.textContent = name;
  // What React does with a click on its own option: set the value, close up.
  o.onReact = () => {
    singleValue.textContent = name;
    input.setAttribute('aria-expanded', 'false');
    menu.remove();
  };
  return o;
});
const menuTexts = () => menuList.children.map((c) => c.textContent);

api.equipmentHelper();
check('with the menu closed nothing is added to it', menuTexts().includes('BDR'), false);

input.setAttribute('aria-expanded', 'true');
api.equipmentHelper();
api.equipmentHelper();
check('with it open, BDR goes in once, straight after Bizarre',
  menuTexts(), ['All', 'Watchful', 'Shadowy', 'Dangerous', 'Persuasive', 'Bizarre', 'BDR', 'Dreaded', 'Respectable']);
const bdrOption = menuList.children[6];
check('it wears the option\'s look but none of its selection state',
  [bdrOption.className, bdrOption.getAttribute('aria-selected'), bdrOption.id],
  ['css-option', null, 'react-select-6-option-fl-ux-bdr']);

singleValue.textContent = 'Shadowy';
bdrOption.click();
check('picking it clicks the real All -- the menu closes, the filter is All -- and records BDR',
  [singleValue.textContent, menu.parentNode, api.bdrChosen()], ['All', null, true]);

api.equipmentHelper();
const bdrValue = doc.getElementById(api.EQUIP_BDR_VALUE_ID);
check('the control then reads BDR, over React\'s own value rather than instead of it',
  [bdrValue && bdrValue.textContent, bdrValue && bdrValue.previousElementSibling === singleValue,
    singleValue.style.visibility, singleValue.textContent],
  ['BDR', true, 'hidden', 'All']);
check('BDR stars the best combined item in every slot -- the three stats mixed, ties included',
  marked(), ['Ratskin Suit', 'Neddy Suit', 'Academic Gown', 'Pair of Lenguals', 'Gossamer Palms',
    'Dilmun Club Lapel Badge', 'Unexploded Mine', 'Semi-Automated Mary Lloyd']);
check('and the summary says it is the three combined, and what they add up to',
  summary().textContent,
  '★ marks the best BDR item in each slot (every one, where two tie): +7 Bizarre, Dreaded and '
  + 'Respectable combined worn together.');

// Reopen and pick a real option: that cancels BDR.
selectContainer.appendChild(menu);
input.setAttribute('aria-expanded', 'true');
api.equipmentHelper();
options[1].click();
check('a real option picked by click cancels BDR', api.bdrChosen(), false);
api.equipmentHelper();
check('...and puts React\'s value back on show, with that stat\'s stars',
  [doc.getElementById(api.EQUIP_BDR_VALUE_ID), singleValue.style.visibility, marked()],
  [null, '', ['Extraordinary Hat', 'Academic Gown', 'Dilmun Club Lapel Badge', 'Weeping Litter-Cyst']]);

api.setBdrChosen(true);
singleValue.textContent = 'Dreaded';
api.equipmentHelper();
check('a real option picked some other way (the keyboard) shows as a value that is not All, and cancels it',
  [api.bdrChosen(), marked()], [false, ['Ratskin Suit', 'Neddy Suit', 'Unexploded Mine', 'Weeping Litter-Cyst']]);

// --- leaving the page ------------------------------------------------------

possessions.remove();
api.equipmentHelper();
check('off Possessions the summary goes with the page, and nothing throws', summary(), null);

check('the feature is registered', api.FEATURES.some((f) => f.name === 'equipment-helper'), true);

console.log(failures ? '\n' + failures + ' check(s) FAILED.' : '\nAll checks passed.');
process.exit(failures ? 1 : 0);
