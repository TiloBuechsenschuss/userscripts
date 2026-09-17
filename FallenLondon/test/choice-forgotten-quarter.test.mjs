// Ad-hoc test for FallenLondon/choice-helper.js's Forgotten Quarter
// Expeditions badges ('forgotten-quarter').
//
// There's no test runner in this repo (see AGENTS.md). This is a standalone
// Node script: it reads the userscript, evaluates its IIFE against a stub DOM
// (empty, so the initial scan() finds nothing) and pulls out the internals.
//
// What's worth pinning here:
//
//  - The cross-checks the guide supports: the Watchful at which each approach
//    is certain (84 / 167 / 267), Rivals' Progress per own Progress at 100%
//    (0.25 / 0.25 / 0.17), Rumours of treasure's 1.4 Supplies an action, and
//    every expedition's length, Archaeologist and worst-case Supplies.
//  - The guide-versus-page disagreements, by name.
//  - The two kinds of alias this feature added to the carousel plumbing: an
//    option the game lists without its "(1 FATE)", and the preparation
//    storylet the option pages file under a longer title than its own page.
//  - Titles shared by two storylets ("The Chalcocite Pagoda" begins AND ends
//    an expedition) resolving by the open storylet.
//  - A menace an option always raises is on the badge; one only a failure
//    raises is not.
//
// Numbers come from Forgotten Quarter Expeditions (Guide) and its option pages
// on fallenlondon.wiki, fetched through the API on 2026-09-14.
//
//   node FallenLondon/test/choice-forgotten-quarter.test.mjs

import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const here = dirname(fileURLToPath(import.meta.url));
const src = readFileSync(join(here, '..', 'choice-helper.js'), 'utf8');

// --- stub DOM --------------------------------------------------------------

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
  el.classList = {
    contains: (c) => String(el.className).split(/\s+/).includes(c),
  };
  Object.defineProperty(el, 'nextElementSibling', {
    get() {
      const p = el.parentNode;
      return p ? p.children[p.children.indexOf(el) + 1] || null : null;
    },
  });
  return el;
}

function makeHeading(text) {
  const parent = makeEl('div');
  const el = makeEl('h2');
  el.childNodes.push({ nodeType: 3, nodeValue: text });
  el.textContent = text;
  parent.appendChild(el);
  return el;
}

let roots = [];
let list = [];
let branches = [];
const fakeDoc = {
  body: makeEl('body'),
  querySelectorAll: (sel) => {
    if (sel === '.storylet-root__heading') return roots;
    if (sel === '.storylet__heading, .storylet-root__heading') return list.concat(roots);
    if (sel === '.branch__title') return branches;
    return [];
  },
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
    'return { FQ_OPTIONS, FQ_INDEX, FQ_STORYLETS, FQ_STORYLET_ALIASES, FQ_PREPARE, FQ_BEGIN, FQ_PURSUE, FQ_CONFRONT,'
    + ' FQ_CLASS, FQ_BRANCH_CLASS, fqBadgeText, fqColor, fqSpec, fqStoryletSpec, fqLuckValue, fqRatings,'
    + ' carouselLookup, broadCertainAt, CAROUSEL_COLOR_PROGRESS, CAROUSEL_COLOR_SETUP, CAROUSEL_COLOR_PAYOUT,'
    + ' CAROUSEL_COLOR_NEUTRAL, LBI_OPTIONS, DME_OPTIONS, VH_OPTIONS, ARBOR_OPTIONS, ZEE_CARDS, SPITE_CARDS,'
    + ' FOTZ_CARDS, LAB_CARDS, PC_OPTIONS, VSD_OPTIONS, normalizeName, BADGE_CLASS, FEATURES }; })();');
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
const key = api.normalizeName;
const row = (name, storylet) => api.FQ_OPTIONS.find((e) => e.name === name && (!storylet || e.storylet === storylet));
const badgeOf = (head, cls) => {
  for (let n = head.nextElementSibling; n && n.classList.contains(api.BADGE_CLASS); n = n.nextElementSibling) {
    if (n.classList.contains(cls)) return n;
  }
  return null;
};

// --- the table is well formed ----------------------------------------------

check('every option is filed under one of the four storylets',
  api.FQ_OPTIONS.filter((e) => !api.FQ_STORYLETS.includes(e.storylet)).map((e) => e.name), []);

check('storylet plus title identifies a row, counting aliases',
  (() => {
    const seen = new Set();
    let dupes = 0;
    for (const e of api.FQ_OPTIONS) {
      for (const n of [e.name].concat(e.aliases || [])) {
        const k = key(e.storylet) + '|' + key(n);
        if (seen.has(k)) dupes++;
        seen.add(k);
      }
    }
    return dupes;
  })(), 0);

check('every row says something on its badge',
  api.FQ_OPTIONS.filter((e) => !api.fqBadgeText(e)).map((e) => e.name), []);

// --- preparation -----------------------------------------------------------

check('what each preparation gives',
  api.FQ_OPTIONS.filter((e) => e.storylet === api.FQ_PREPARE && !e.label)
    .map((e) => [e.name, e.luck ? api.fqLuckValue(e.luck) : e.gain.sup]),
  [['Rumours of treasure', 1.4], ['Blood-red tales', 1], ['Your own expertise', 1], ['Show us the money', 4],
   ['Ply your team with drink', 1], ['Thieves and cracksmen', 1], ["Hire 'local' knowledge", 1],
   ['Hire a porter from the docks', 7], ['Burly guards and porters', 3]]);

check('Rumours of treasure is the guide\'s 1.4 Supplies an action, marked as an expectation',
  api.fqBadgeText(row('Rumours of treasure')), '≈Sup +1.4 ▼');

check('the one preparation that raises a menace says so on its badge',
  api.FQ_OPTIONS.filter((e) => e.storylet === api.FQ_PREPARE && api.fqBadgeText(e).includes('+Nightmares'))
    .map((e) => e.name), ['Blood-red tales']);

check('the guide\'s Echoes per Supply, where it gives one',
  api.FQ_OPTIONS.filter((e) => e.rate).map((e) => [e.name, e.rate]),
  [['Rumours of treasure', 1.39], ['Blood-red tales', 1.5], ['Show us the money', 2.5],
   ['Ply your team with drink', 1.5], ['Thieves and cracksmen', 1.6], ["Hire 'local' knowledge", 1.6]]);

// --- the expeditions -------------------------------------------------------

check('every expedition\'s length and Archaeologist, as the guide\'s tables have them',
  api.FQ_OPTIONS.filter((e) => e.exp).map((e) => [e.name, e.exp.supplies, e.exp.arch, e.exp.fate || 0]),
  [["Seek a thieves' cache", 10, 2, 0], ['Seek a shrine of the Deep Blue Heaven', 20, 2, 0],
   ['The Chalcocite Pagoda', 20, 3, 0], ['Stonefall Copse', 20, 3, 0], ['The Broken Granary', 20, 3, 0],
   ['The Tomb of the Silken Thread', 30, 3, 0], ['The Sanctuary of the Crimson Petals', 40, 3, 0],
   ['A Temple of Uttermost Wind', 30, 2, 7], ['A Gallery of Serpents', 40, 3, 7], ['The Tomb of the Seven', 30, 3, 0],
   ['The Cave of the Nadir', 60, 5, 0], ['The Clay Kidnapper: Seek a Sand-Drowned Stupa', 20, 2, 0]]);

check('the guide\'s worst-case Supplies, per approach',
  api.FQ_OPTIONS.filter((e) => e.exp && e.exp.worst).map((e) => [e.name, e.exp.worst]),
  [['Seek a shrine of the Deep Blue Heaven', [29, 29, 20]], ['The Chalcocite Pagoda', [29, 29, 20]],
   ['Stonefall Copse', [29, 29, 20]], ['The Tomb of the Silken Thread', [46, 39, 39]],
   ['The Sanctuary of the Crimson Petals', [76, 56, 49]], ['A Temple of Uttermost Wind', [46, 39, 39]],
   ['A Gallery of Serpents', [74, 54, 49]], ['The Tomb of the Seven', [46, 39, 39]],
   ['The Cave of the Nadir', [null, 86, 76]]]);

check('and no worst case is below the length it is the worst case of',
  api.FQ_OPTIONS.filter((e) => e.exp && e.exp.worst && e.exp.worst.some((w) => w != null && w < e.exp.supplies))
    .map((e) => e.name), []);

check('expedition badges: length, then Archaeologist or Fate',
  ["Seek a thieves' cache", 'The Tomb of the Silken Thread', 'A Temple of Uttermost Wind', 'The Cave of the Nadir']
    .map((n) => api.fqBadgeText(row(n, api.FQ_BEGIN))),
  ['10 sup · Arch 2? ▼ · Favours: Criminals −1', '30 sup · Arch 3', '30 sup · Fate 7', '60 sup · Arch 5 ▼']);

// --- the approaches --------------------------------------------------------

const approaches = ['A cautious approach', 'A bold approach', 'A buccaneering approach'].map((n) => row(n));

check('each approach is certain where the guide\'s table reaches 100%',
  approaches.map((e) => api.broadCertainAt(e.ch.diff)), [84, 167, 267]);

check('Rivals\' Progress per own Progress at 100% is the guide\'s column',
  approaches.map((e) => Math.round(e.rivalOdds / e.gain.prog * 100) / 100), [0.25, 0.25, 0.17]);

check('approach badges, and a failure-only menace kept off them',
  approaches.map((e) => api.fqBadgeText(e)), ['Prog +1? ▼', 'Prog +2? ▼', 'Prog +3? ▼']);

check('but in the tooltip',
  [approaches[1], approaches[2]].map((e) => api.fqSpec(e).title.includes('On a failure: Nightmares')), [true, true]);

check('A sign? is free Progress',
  [api.fqBadgeText(row('A sign?')), api.fqColor(row('A sign?'))], ['Prog +4', api.CAROUSEL_COLOR_PROGRESS]);

check('every hindrance takes Rivals\' Progress 2 off, on a challenge, using something up',
  api.FQ_OPTIONS.filter((e) => /^A chance to hinder/.test(e.name)).map((e) => api.fqBadgeText(e)),
  ['Rivals −2? ▼', 'Rivals −2? ▼', 'Rivals −2? ▼ · Favours: The Great Game −1', 'Rivals −2? ▼', 'Rivals −2? ▼',
    'Rivals −2? ▼']);

// --- the conclusions and confrontations ------------------------------------

check('conclusions name what they pay',
  ["A thieves' cache!", 'The Chalcocite Pagoda', 'The Tomb of the Silken Thread', 'Stonefall Copse!']
    .map((n) => api.fqBadgeText(row(n, api.FQ_PURSUE))),
  ['Treasure + Glim', 'Enigma?', 'Egg + Linen?', 'Maps + Reflection']);

check('confrontations: Progress, and the menace they always raise',
  ["Assault Orthos' camp", 'Bribe Virginia', 'Challenge February to a competition', 'Distract the Lugubrious Seamstress',
   'Other Rivals'].map((n) => api.fqBadgeText(row(n))),
  ['Prog +5? +Wounds ▼', 'Prog +3? +Nightmares ▼', 'Prog +3? ▼ · Favours: Revolutionaries −1', 'Prog +3–5? +Nightmares ▼', 'Rivals → 1? ▼']);

check('and their tooltips say the rival is sent back to 1',
  ["Assault Orthos' camp", 'Other Rivals'].map((n) => api.fqSpec(row(n)).title.includes('Rivals’ Progress back to 1')),
  [true, true]);

// --- guide versus page -----------------------------------------------------

check('the guide disagrees with the pages in exactly three rows',
  api.FQ_OPTIONS.filter((e) => e.guide).map((e) => [e.name, Object.keys(e.guide)[0]]),
  [['Hire a porter from the docks', 'uses'], ['A buccaneering approach', 'rivals'], ['The Chalcocite Pagoda', 'ch']]);

check('and every such tooltip says which it followed',
  api.FQ_OPTIONS.filter((e) => e.guide && !/option page is followed|the guide’s table/.test(api.fqSpec(e).title))
    .map((e) => e.name), []);

// --- looking one up --------------------------------------------------------

check('a title the game lists without its Fate price is found under either',
  ['An afternoon off', 'An afternoon off (1 FATE)', 'A Temple of Uttermost Wind (7 FATE)'].map((n) => {
    const storylet = n.startsWith('A Temple') ? api.FQ_BEGIN : api.FQ_PURSUE;
    const e = api.carouselLookup(api.FQ_INDEX, n, key(storylet));
    return e && e.name;
  }),
  ['An afternoon off', 'An afternoon off', 'A Temple of Uttermost Wind']);

check('the same title begins one expedition and ends it, and the open storylet decides which',
  [api.carouselLookup(api.FQ_INDEX, 'The Chalcocite Pagoda', key(api.FQ_BEGIN)).exp.supplies,
   api.carouselLookup(api.FQ_INDEX, 'The Chalcocite Pagoda', key(api.FQ_PURSUE)).payout.tag,
   api.carouselLookup(api.FQ_INDEX, 'Stonefall Copse!', key(api.FQ_BEGIN)).name],
  [20, 'Enigma', 'Stonefall Copse']);

check('the four storylets and their summaries',
  api.FQ_STORYLETS.map((s) => api.fqStoryletSpec(key(s)).text), ['supplies', 'expeditions', 'Prog → goal', 'rivals']);

check('each summary lists every option of its storylet',
  api.FQ_STORYLETS.map((s) => {
    const title = api.fqStoryletSpec(key(s)).title;
    return api.FQ_OPTIONS.filter((e) => e.storylet === s && !title.includes(e.name)).length;
  }), [0, 0, 0, 0]);

// --- the registered pass ---------------------------------------------------

check('the longer preparation title opens the preparation options, and the Begin screen badges its own',
  (() => {
    const text = (head, cls) => { const b = badgeOf(head, cls); return b && b.textContent; };
    const burly = makeHeading('Burly guards and porters');
    const pagoda = makeHeading('The Chalcocite Pagoda');
    branches = [burly, pagoda];
    const out = [];
    roots = [makeHeading('Prepare for an Expedition in the Forgotten Quarter')];
    api.fqRatings();
    out.push([text(roots[0], api.FQ_CLASS), text(burly, api.FQ_BRANCH_CLASS), text(pagoda, api.FQ_BRANCH_CLASS)]);
    roots = [makeHeading('Begin an Expedition in the Forgotten Quarter')];
    api.fqRatings();
    out.push([text(burly, api.FQ_BRANCH_CLASS), text(pagoda, api.FQ_BRANCH_CLASS)]);
    roots = [makeHeading('Pursuing an Archaeological Expedition')];
    api.fqRatings();
    out.push([text(pagoda, api.FQ_BRANCH_CLASS)]);
    roots = [];
    api.fqRatings();
    out.push([text(pagoda, api.FQ_BRANCH_CLASS)]);
    branches = [];
    return out;
  })(),
  [['supplies', 'Sup +3 ▼', null], [null, '20 sup · Arch 3'], ['Enigma?'], [null]]);

// --- no name in another table ----------------------------------------------

check('no Forgotten Quarter name is in another feature\'s table',
  (() => {
    const others = [
      ...api.ZEE_CARDS.map((c) => c.name), ...api.SPITE_CARDS.map((c) => c.name), ...api.FOTZ_CARDS.map((c) => c.name),
      ...api.LAB_CARDS.map((c) => c.name), ...api.ARBOR_OPTIONS.map((e) => e.name),
      ...api.LBI_OPTIONS.map((e) => e.name), ...api.DME_OPTIONS.map((e) => e.name), ...api.VH_OPTIONS.map((e) => e.name),
      ...api.PC_OPTIONS.flatMap((p) => [p.name, p.branch || '']),
      ...api.VSD_OPTIONS.flatMap((v) => [v.storylet, v.branch]),
    ].map(key);
    return api.FQ_OPTIONS.flatMap((e) => [e.name].concat(e.aliases || [])).filter((n) => others.includes(key(n)));
  })(), []);

check('the feature is registered', api.FEATURES.some((f) => f.name === 'forgotten-quarter'), true);

console.log(failures ? '\n' + failures + ' FAILED' : '\nall good');
process.exit(failures ? 1 : 0);
