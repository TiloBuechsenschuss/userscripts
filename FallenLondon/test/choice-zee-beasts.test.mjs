// Ad-hoc test for FallenLondon/choice-helper.js's Hunting the Beasts of the Zee badges
// ('zee-beasts').
//
// There's no test runner in this repo (see AGENTS.md). This is a standalone
// Node script: it reads the userscript, evaluates its IIFE against a stub DOM
// (empty, so the initial scan() finds nothing) and pulls out the internals.
//
// What's worth pinning here: that all seven headings the game can show for the
// approach storylet resolve to the one canonical name, the (Zee-Beast)
// placeholder, that Take a risk is the only action whose failure goes
// backwards, that no row claims a difficulty when Elusiveness and Zee Peril are
// unreadable, and that the Lifeberg's three regions are one row saying so.
//
// Numbers come from Hunting the Beasts of the Zee (Guide) and the hunt's option pages on fallenlondon.wiki, fetched through the API on
// 2026-09-17.
//
//   node FallenLondon/test/choice-zee-beasts.test.mjs

import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const here = dirname(fileURLToPath(import.meta.url));
const src = readFileSync(join(here, '..', 'choice-helper.js'), 'utf8');

function makeEl(tag) {
  const el = {
    tagName: (tag || 'span').toUpperCase(), nodeType: 1, className: '', title: '', textContent: '',
    style: { cssText: '' }, dataset: {}, childNodes: [], children: [], parentNode: null,
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
    after(node) {
      const p = this.parentNode;
      if (!p) return;
      node.parentNode = p;
      p.children.splice(p.children.indexOf(this) + 1, 0, node);
      p.childNodes.splice(p.childNodes.indexOf(this) + 1, 0, node);
    },
    addEventListener() {},
    querySelector(sel) {
      const cls = sel.replace(/^\./, '');
      return this.children.find((c) => String(c.className).split(/\s+/).includes(cls)) || null;
    },
  };
  el.classList = { contains: (c) => String(el.className).split(/\s+/).includes(c) };
  Object.defineProperty(el, 'nextElementSibling', {
    get() {
      const p = el.parentNode;
      return p ? p.children[p.children.indexOf(el) + 1] || null : null;
    },
  });
  return el;
}

function makeHeading(text, className) {
  const parent = makeEl('div');
  const el = makeEl('h2');
  el.className = className || '';
  el.childNodes.push({ nodeType: 3, nodeValue: text });
  el.textContent = text;
  parent.appendChild(el);
  return el;
}

let roots = [];
let heads = [];
let branches = [];
let hand = [];
let greeting = null;
const fakeDoc = {
  body: makeEl('body'),
  querySelectorAll: (sel) => {
    if (sel === '.storylet-root__heading') return roots;
    if (sel === '.storylet__heading, .storylet-root__heading') return heads.concat(roots);
    if (sel === '.branch__title') return branches;
    if (sel === '.hand .small-card__body .media__heading') return hand;
    return [];
  },
  querySelector: (sel) => (sel === '#accessible-sidebar .welcome' && greeting != null ? { textContent: greeting } : null),
  getElementById: () => null,
  createElement: (tag) => makeEl(tag),
  createTextNode: (t) => ({ nodeType: 3, nodeValue: String(t), text: String(t) }),
  addEventListener() {},
};
class FakeObserver { observe() {} }

const TABLES = ['ARBOR_OPTIONS', 'LBI_OPTIONS', 'DME_OPTIONS', 'VH_OPTIONS', 'FQ_OPTIONS', 'CM_OPTIONS', 'SOUP_OPTIONS',
  'MIND_OPTIONS', 'CASE_OPTIONS', 'EMB_OPTIONS', 'LAW_OPTIONS', 'MUS_OPTIONS', 'HEIST_OPTIONS', 'SPIDER_OPTIONS',
  'STORY_OPTIONS', 'FLASH_OPTIONS', 'SOCIAL_OPTIONS', 'NADIR_OPTIONS', 'COURT_OPTIONS', 'BREED_OPTIONS', 'MH_OPTIONS',
  'MC_OPTIONS', 'SIXTH_OPTIONS', 'RM_OPTIONS', 'BOX_OPTIONS', 'UC_OPTIONS', 'HB_ALL', 'TP_OPTIONS', 'TIR_OPTIONS',
  'RSC_OPTIONS', 'NP_OPTIONS', 'WOA_OPTIONS', 'WOI_OPTIONS', 'FP_OPTIONS', 'TC_OPTIONS', 'PARTY_OPTIONS',
  'MWS_OPTIONS', 'DBW_OPTIONS', 'HG_OPTIONS', 'HK_OPTIONS', 'MI_OPTIONS', 'VB_OPTIONS', 'GF_OPTIONS', 'MZ_OPTIONS',
  'PP_OPTIONS', 'PC2_OPTIONS', 'ZB_OPTIONS'];
const wrapped = src
  .replace('(function () {', 'globalThis.__flux = (function () {')
  .replace(/\}\)\(\);\s*$/,
    'return { ZB_OPTIONS, ZB_STORYLETS, ZB_INDEX, ZB_HUNT, ZB_APPROACH, ZB_WAREHOUSE, ZB_APPROACH_NAMES, ZB_STORYLET_ALIASES, ZB_CLASS, ZB_BRANCH_CLASS, zbBadgeText, zbSpec, zbStoryletSpec, zbRatings, carouselLookup, carouselCanonical, carouselHandSpec, factionText, ZEE_CARDS, SPITE_CARDS,'
    + ' FOTZ_CARDS, LAB_CARDS, PC_OPTIONS, VSD_OPTIONS, normalizeName, BADGE_CLASS, FEATURES, '
    + TABLES.join(', ') + ' }; })();');
const api = new Function(
  'document', 'MutationObserver', 'requestAnimationFrame', 'getComputedStyle', 'console',
  wrapped + '\nreturn globalThis.__flux;')(fakeDoc, FakeObserver, () => {}, () => ({ position: 'relative' }), console);

let failures = 0;
function check(label, got, expected) {
  const g = JSON.stringify(got);
  const e = JSON.stringify(expected);
  const ok = g === e;
  if (!ok) failures++;
  console.log((ok ? 'PASS' : 'FAIL'), '|', label);
  if (!ok) console.log('   expected:', e, '\n   got:     ', g);
}
const key = api.normalizeName;
const rows = api.ZB_OPTIONS;
const row = (name, storylet) => rows.find((e) => e.name === name && (!storylet || e.storylet === storylet));
const badgeOf = (head, cls) => {
  for (let n = head.nextElementSibling; n && n.classList.contains(api.BADGE_CLASS); n = n.nextElementSibling) {
    if (n.classList.contains(cls)) return n;
  }
  return null;
};
const text = (head, cls) => { const b = badgeOf(head, cls); return b && b.textContent; };
function otherNames(own) {
  return [
    ...api.ZEE_CARDS.map((c) => c.name), ...api.SPITE_CARDS.map((c) => c.name), ...api.FOTZ_CARDS.map((c) => c.name),
    ...api.LAB_CARDS.map((c) => c.name), ...TABLES.filter((t) => t !== own).flatMap((t) => api[t].map((e) => e.name)),
    ...api.PC_OPTIONS.flatMap((p) => [p.name, p.branch || '']), ...api.VSD_OPTIONS.flatMap((v) => [v.storylet, v.branch]),
  ].map(key).filter(Boolean);
}

check('storylet plus title identifies a row, counting aliases',
  (() => {
    const seen = new Set();
    let dupes = 0;
    for (const e of rows) {
      for (const n of [e.name].concat(e.aliases || [])) {
        const k = key(e.storylet) + '|' + key(n);
        if (seen.has(k) || !key(n)) dupes++;
        seen.add(k);
      }
    }
    return dupes;
  })(), 0);

// The storylet is headed for whatever you are hunting, so every heading the
// game can show has to land on the one canonical name the table is filed under.
// A missing alias here is a hunt that goes unbadged from end to end.
check('all seven approach headings, and the wiki’s own placeholder, resolve to one storylet',
  api.ZB_APPROACH_NAMES.map((n) => api.carouselCanonical(key(n), api.ZB_STORYLET_ALIASES) === key(api.ZB_APPROACH)),
  [true, true, true, true, true, true, true, true]);

check('the quarry placeholder matches whatever the game calls the beast',
  ['Pursue the Angler Crab', 'Outflank the Ravenous Lifeberg', 'Pursue the Midnight Whale']
    .map((n) => {
      const e = api.carouselLookup(api.ZB_INDEX, n, key(api.ZB_APPROACH));
      return e && e.name;
    }), ['Pursue the (Zee-Beast)', 'Outflank the (Zee-Beast)', 'Pursue the (Zee-Beast)']);

check('every row is a quarry, a hunting action, a kill or a Warehouse trade',
  rows.filter((e) => !e.label && !e.region && e.pursuit == null && e.elusive == null && e.deeds == null && !e.tag)
    .map((e) => e.name), []);

// Only one line in the hunt can take Pursuit away, and a badge that did not say
// so would read like the others.
check('Take a risk is the only action whose failure goes backwards',
  rows.filter((e) => e.failPursuit != null && e.failPursuit < 0).map((e) => e.name), ['Take a risk']);

// Elusiveness and Zee Peril set every difficulty here and neither is on any page
// this script reads, so no row may state one.
check('no hunting action claims a difficulty, and each says what its own scales with',
  rows.filter((e) => e.pursuit != null || e.elusive != null).map((e) => {
    const line = api.zbSpec(e).title;
    return !/certain at/.test(line) || /Monstrous Anatomy 3/.test(line);
  }), [true, true, true, true, true, true, true]);

check('every quarry carries its waters, the guide’s challenge level and the Pursuit it wants',
  rows.filter((e) => e.storylet === api.ZB_HUNT && !e.label).map((e) => [e.region, e.level, e.need]),
  [['Stormbones', '110', 'a narrow Pursuit 5 check'], ['Shepherd’s Wash', '111–209', 'Pursuit 8–13'],
    ['Home Waters', '175', 'Pursuit 11'], ['The Salt Steppes', '220', 'Pursuit 11'],
    ['Home Waters', '165', 'Pursuit 12'], ['Home Waters', '165', 'Pursuit 12']]);

// Three hunts and three kills share one title each; those are one row saying so,
// not a figure that is right in one region out of three.
check('the Lifeberg’s three regions are one row apiece, and name all three',
  ['Join the Citizen’s Armada to hunt the Ravenous Lifeberg', 'Blast the Ravenous Lifeberg with all you’ve got']
    .map((n) => {
      const e = row(n);
      return [rows.filter((r) => r.name === n).length,
        /Salt Steppes/.test(api.zbSpec(e).title) && /Sea of Voices/.test(api.zbSpec(e).title)
          && /Shepherd’s Wash/.test(api.zbSpec(e).title)];
    }), [[1, true], [1, true]]);

check('every Warehouse trade is priced at the 20 Echoes a Deed is worth',
  rows.filter((e) => e.deeds != null).map((e) => [e.value, e.actions]),
  [[20, 0], [20, 0], [20, 0], [20, 0], [20, 0], [20, 0], [20, 0], [20, 0]]);

check('badges for each shape of row',
  ['Hunt an Angler Crab', 'Make a daring approach', 'Pursue the (Zee-Beast)', 'Take a risk', 'Chum the waters',
    'Finish off the crocodile', 'Claim a pallet of mouldering rations',
    'Join the Citizen’s Armada to hunt the Ravenous Lifeberg'].map((n) => api.zbBadgeText(row(n))),
  ['Shepherd’s Wash · challenge 111–209 · Pursuit 8–13', 'Pursuit +24 ▾', 'Pursuit +14/+7?',
    'Pursuit +24/−5?', 'Elusiveness −7/−3? ▼',
    'Relic ×100 + Glim ×700 · 32 E · needs Pursuit 11', '5 deeds → Pies ×40 · 20 E',
    'three regions · Pursuit 8–13']);

check('the two Elusiveness options say why lowering it is worth an action',
  ['Chum the waters', 'Dive below the waves']
    .map((n) => /at a rounding point one level less Pursuit needed/.test(api.zbSpec(row(n)).title)), [true, true]);

check('a heading says which part of a hunt it is',
  [api.ZB_HUNT, api.ZB_APPROACH, api.ZB_WAREHOUSE].map((s) => api.zbStoryletSpec(key(s)).text),
  ['pick a quarry', 'the hunt · raise Pursuit', 'spend Valorous Deeds']);

check('the rules line warns that these waters never reset Troubled Waters',
  /never reset Troubled Waters/.test(api.zbSpec(row('Take a risk')).title), true);

check('the registered pass: a heading named for the quarry, and an option under it',
  (() => {
    const list = makeHeading(api.ZB_HUNT, 'storylet__heading');
    const open = makeHeading('Approaching the Wake of the Midnight Whale', 'storylet-root__heading');
    const branch = makeHeading('Pursue the Midnight Whale');
    const kill = makeHeading('End your guidance of the Midnight Whale');
    heads = [list];
    roots = [open];
    branches = [branch, kill];
    api.zbRatings();
    const out = [text(list, api.ZB_CLASS), text(open, api.ZB_CLASS), text(branch, api.ZB_BRANCH_CLASS),
      text(kill, api.ZB_BRANCH_CLASS)];
    heads = []; roots = []; branches = [];
    return out;
  })(),
  ['pick a quarry', 'the hunt · raise Pursuit', 'Pursuit +14/+7?',
    'Shriek ×1000+ + ivory · 36.40–85.32 E · needs Pursuit 11']);

check('no Hunting the Beasts of the Zee name is in another feature\u2019s table',
  (() => {
    const others = otherNames('ZB_OPTIONS');
    return rows.map((e) => e.name).filter((n) => others.includes(key(n)));
  })(), []);

check('the feature is registered', api.FEATURES.some((f) => f.name === 'zee-beasts'), true);

console.log(failures ? '\n' + failures + ' FAILED' : '\nall good');
process.exit(failures ? 1 : 0);
