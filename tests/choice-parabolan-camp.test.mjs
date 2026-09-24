// Ad-hoc test for FallenLondon/choice-helper.js's Parabolan Base-Camp badges
// ('parabolan-camp').
//
// There's no test runner in this repo (see AGENTS.md). This is a standalone
// Node script: it reads the userscript, evaluates its IIFE against a stub DOM
// (empty, so the initial scan() finds nothing) and pulls out the internals.
//
// What's worth pinning here: the fertilisers and the Dome's prices against the
// guide, the badge's marks (? for a check, ▼ for something used up, the
// Favours as the second part), that the headings left unbadged stay unbadged,
// the Realisation card's hand ranking, and the whole registered pass.
//
// Numbers come from the option pages on fallenlondon.wiki, fetched through the
// API on 2026-09-24, with Parabola (Guide) as the cross-check.
//
//   node tests/choice-parabolan-camp.test.mjs

import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const here = dirname(fileURLToPath(import.meta.url));
const src = readFileSync(join(here, '..', 'FallenLondon', 'choice-helper.js'), 'utf8');

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
  'PP_OPTIONS', 'PC2_OPTIONS', 'ZB_OPTIONS', 'CB_OPTIONS', 'PH_OPTIONS', 'ON_OPTIONS', 'SC_OPTIONS',
  'PW_OPTIONS', 'CE_OPTIONS', 'BC_OPTIONS'];
const wrapped = src
  .replace('(function () {', 'globalThis.__flux = (function () {')
  .replace(/\}\)\(\);\s*$/,
    'return { BC_OPTIONS, BC_INDEX, BC_HEALTH, BC_CONFLAG, BC_FALLING, BC_TREE, BC_SHORE, BC_DOME, BC_TOP, BC_LEAVE, BC_REAL, BC_CLASS, BC_BRANCH_CLASS, BC_CARD_CLASS, bcBadgeText, bcSpec, bcStoryletSpec, bcRank, bcRatings, BC_HAND, carouselLookup, carouselCanonical, carouselHandSpec, factionText, ZEE_CARDS, SPITE_CARDS,'
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
const rows = api.BC_OPTIONS;
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

check('every row says what it is: a label or a research figure, and a kind',
  rows.filter((e) => !((e.label && e.label.length) || e.research != null) || !e.kind).map((e) => e.name), []);

// The guide's own figures for what growing an Orange-apple costs: five Aeolian
// Screams, 1100 Bone Fragments, or the Machine, 6+ Hedonist and 100 Bone.
check('the fertilisers against the guide',
  ['Fertilise the tree with screams', 'Fertilise the tree with bone',
    'Fertilise the tree with the twin powers of electricity and hedonism'].map((n) => row(n).uses),
  ['5 Aeolian Screams', '1,100 Bone Fragments', '100 Bone Fragments and 21 change points of Hedonist']);
check('the Machine option needs Hedonist 6, as the guide says',
  /Hedonist 6/.test(row('Fertilise the tree with the twin powers of electricity and hedonism').needs), true);

// Seven Favours buys the second Glass Studies level; every trade pays one.
check('the trades with the Fingerkings each pay one Favour, on the second part of the badge',
  rows.filter((e) => /^(Offer a habitation|Furnish|Lay a tribute)/.test(e.name))
    .map((e) => [e.name, api.bcBadgeText(e).endsWith(' · Favours: Fingerkings +1')]).filter((p) => !p[1]),
  []);
check('the Favours the Dome takes are shown as a minus on the badge',
  ['Purchase a greater freedom of the place', 'Develop a more extensive connection with the Fingerkings',
    'Observe what the Fingerkings do in Varchas'].map((n) => api.bcBadgeText(row(n)).split(' · ').pop()),
  ['Favours: Fingerkings −7', 'Favours: Fingerkings −7', 'Favours: Fingerkings −7']);

check('the marks: ? for a check, ▼ for something used up, neither for a sure thing',
  ['Sneak away from your wounds', 'Eat only the safe part of the Orange-apple', 'Pick a fruit from the tree',
    'Climb the dome itself', 'Keep below the leaves'].map((n) => api.bcBadgeText(row(n))),
  ['Wounds −3 CP · Glasswork +1 CP?', 'Wounds −6 CP · Kataleptic Toxicology +1 CP? ▼', 'Orange-apple ×1',
    'Incisive Observation ×5?', 'Shadowy +275 CP ▼']);

check('a Realisation option shows its research, with a ? on the one check',
  rows.filter((e) => e.storylet === api.BC_REAL).map(api.bcBadgeText),
  ['Lab Research +10 ▼', 'Lab Research +5?', 'Lab Research +5', 'Lab Research +5', 'Lab Research +5']);

check('every Glasswork check is narrow, and its tooltip says when it is certain',
  rows.filter((e) => e.ch && e.ch.stat === 'Glasswork').every((e) => e.ch.narrow
    && new RegExp('certain at Glasswork ' + (e.ch.diff + 4)).test(api.bcSpec(e).title)), true);

check('a menace-clearing option says what it costs',
  [api.bcSpec(row('Cry to the storm-bird')).title.includes('Uses up a base level each of Glasswork and Monstrous Anatomy'),
    api.bcSpec(row('Tie yourself to a mossy tree')).title.includes('Kataleptic Toxicology')], [true, true]);

check('the tooltip carries the two menaces’ rule',
  /Falling apart fires/.test(api.bcSpec(row('Sneak away from your wounds')).title), true);

check('the four ordinary or shared headings are not badged, the five others are',
  [api.BC_HEALTH, api.BC_CONFLAG, api.BC_FALLING, api.BC_SHORE, api.BC_TREE, api.BC_DOME, api.BC_TOP, api.BC_LEAVE, api.BC_REAL]
    .map((s) => !!api.bcStoryletSpec(key(s))),
  [false, false, false, false, true, true, true, true, true]);

check('the hand shows the best card option that needs nothing, and ▾ that a better one is gated',
  (() => {
    const spec = api.carouselHandSpec(api.BC_HAND, api.BC_REAL);
    return [spec.text, /Best with nothing special in hand: Apply what you have heard/.test(spec.title),
      /Provide gifts to the powers that decide such matters \(5 Memories of Distant Shores\)/.test(spec.title)];
  })(),
  ['Lab Research +5? ▾', true, true]);

check('the rank puts research first and a sure thing above a check',
  [api.bcRank(row('Provide gifts to the powers that decide such matters')), api.bcRank(row('Apply what you have heard')),
    api.bcRank(row('Consult with your Parabolan Kitten')), api.bcRank(row('Keep below the leaves'))],
  [[10, 1], [5, 0], [5, 1], null]);

check('the Waswood shore is one title with two storylets behind it, so it is one row',
  rows.filter((e) => /^Reach towards the shore/.test(e.name)).map((e) => e.name), ['Reach towards the shore']);

check('the three Climb the dome variants share one title and one row',
  rows.filter((e) => e.name === 'Climb the dome itself').length, 1);

check('the registered pass: the tree, a fertiliser, a stranger, a card in hand and an opened card',
  (() => {
    const tree = makeHeading(api.BC_TREE, 'storylet-root__heading');
    const fert = makeHeading('Fertilise the tree with bone');
    const nope = makeHeading('Some Other Option');
    const card = makeHeading('Realisation');
    const opened = makeHeading('Realisation', 'storylet-root__heading');
    roots = [tree]; branches = [fert, nope]; hand = [card];
    api.bcRatings();
    const out = [text(tree, api.BC_CLASS), text(fert, api.BC_BRANCH_CLASS),
      text(nope, api.BC_BRANCH_CLASS), text(card, api.BC_CARD_CLASS)];
    roots = [opened]; branches = []; hand = [];
    api.bcRatings();
    out.push(text(opened, api.BC_CLASS));
    roots = []; branches = []; hand = [];
    return out;
  })(),
  ['grow Orange-apples', 'Bone ×1,100 → Tree Season ▼', null, 'Lab Research +5? ▾',
    'Laboratory Research']);

check('a heal is badged under Attend to Your Health, and not under the tree',
  (() => {
    const open = makeHeading(api.BC_HEALTH, 'storylet-root__heading');
    const heal = makeHeading('Sneak away from your wounds');
    roots = [open]; branches = [heal];
    api.bcRatings();
    const under = text(heal, api.BC_BRANCH_CLASS);
    const tree = makeHeading(api.BC_TREE, 'storylet-root__heading');
    const other = makeHeading('Sneak away from your wounds');
    roots = [tree]; branches = [other];
    api.bcRatings();
    const out = [text(open, api.BC_CLASS), under, text(other, api.BC_BRANCH_CLASS)];
    roots = []; branches = [];
    return out;
  })(),
  [null, 'Wounds −3 CP · Glasswork +1 CP?', null]);

check('the Calendar’s heading is left alone, but this feature’s option under it is badged',
  (() => {
    const head = makeHeading(api.BC_SHORE, 'storylet-root__heading');
    const opt = makeHeading('Compose a Corrective History');
    roots = [head]; branches = [opt];
    api.bcRatings();
    const out = [text(head, api.BC_CLASS), text(opt, api.BC_BRANCH_CLASS)];
    roots = []; branches = [];
    return out;
  })(),
  [null, 'Mithridacy +1 CP · Corrective Narrative? ▼']);

check('an option is only badged under its own storylet',
  api.carouselLookup(api.BC_INDEX, 'Sneak away from your wounds', key(api.BC_TREE)), null);

check('no Parabolan Base-Camp name is in another feature’s table',
  (() => {
    const others = otherNames('BC_OPTIONS');
    return rows.map((e) => e.name).filter((n) => others.includes(key(n)));
  })(), []);

check('the feature is registered', api.FEATURES.some((f) => f.name === 'parabolan-camp'), true);

console.log(failures ? '\n' + failures + ' FAILED' : '\nall good');
process.exit(failures ? 1 : 0);
