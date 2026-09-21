// Ad-hoc test for FallenLondon/choice-helper.js's Writing a Monograph badges
// ('writing-monograph').
//
// There's no test runner in this repo (see AGENTS.md). This is a standalone
// Node script: it reads the userscript, evaluates its IIFE against a stub DOM
// (empty, so the initial scan() finds nothing) and pulls out the internals.
//
// What's worth pinning here: the circle -- Cautionary lowers Tragic, Tragic
// lowers Ironic, Ironic lowers Cautionary -- and its two exceptions, since
// research taken in the wrong order leaves a quality at zero and the thesis
// unexceptional; that every research action pays and costs the same, so the
// pair really is the only choice; that every topic names its buyers, which is
// what decides the payout's currency; and that every buyer is reachable.
//
// Numbers come from Writing a Monograph (Guide), its Tables subpage and the four Institute storylets on fallenlondon.wiki, fetched through the API on
// 2026-09-20.
//
//   node FallenLondon/test/choice-writing-monograph.test.mjs

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
  'PP_OPTIONS', 'PC2_OPTIONS', 'ZB_OPTIONS', 'CB_OPTIONS', 'PH_OPTIONS', 'ON_OPTIONS', 'SC_OPTIONS',
  'PW_OPTIONS', 'CE_OPTIONS', 'PIR_OPTIONS', 'IRM_OPTIONS', 'KH_OPTIONS', 'HH_OPTIONS', 'JL_OPTIONS',
  'CC_OPTIONS', 'BA_OPTIONS', 'DV_OPTIONS', 'RB_OPTIONS', 'DC_OPTIONS', 'DI_OPTIONS', 'CI_OPTIONS', 'MW_OPTIONS',
  'PB_OPTIONS', 'CH_OPTIONS', 'LH_OPTIONS', 'MX_OPTIONS', 'MG_OPTIONS', 'KA_OPTIONS'];
const wrapped = src
  .replace('(function () {', 'globalThis.__flux = (function () {')
  .replace(/\}\)\(\);\s*$/,
    'return { MG_OPTIONS, MG_INDEX, MG_TOPICS, MG_BUYERS, MG_STORYLETS, MG_DEPTH, MG_PENNIES_PER_ACTION, MG_ECHOES_PER_ACTION, MG_BEGIN, MG_CONTINUE, MG_CLASS, MG_BRANCH_CLASS, mgBadgeText, mgSpec, mgStoryletSpec, mgRatings, carouselLookup, carouselCanonical, factionText, ZEE_CARDS, SPITE_CARDS,'
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
const rows = api.MG_OPTIONS;
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

// Every table in the file is keyed on storylet PLUS title, and `carouselLookup`
// refuses to answer when two rows of one storylet match -- so a repeated key
// here is an option that would go unbadged.
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

check('no Monograph name is in another feature\u2019s table',
  (() => {
    const others = otherNames('MG_OPTIONS');
    return [...new Set(rows.map((e) => e.name).filter((n) => others.includes(key(n))))];
  })(), []);


check('every research action pays the same and costs the same',
  [api.MG_PENNIES_PER_ACTION, api.MG_ECHOES_PER_ACTION,
    rows.filter((e) => e.raises && !e.uses).map((e) => e.name)],
  [1700, 12.5, []]);

// The circle is what the whole activity is: three qualities in a ring, each
// lowering the next, with two rows breaking it.
check('the circle, and the two rows that break it',
  rows.filter((e) => e.raises).map((e) => [e.raises, e.lowers, !!e.breaks]),
  [['Cautionary', 'Ironic', true], ['Cautionary', 'Tragic', false], ['Cautionary', 'Tragic', false],
    ['Cautionary', 'Tragic', false], ['Cautionary', 'Tragic', false],
    ['Tragic', 'Ironic', false], ['Tragic', 'Ironic', false],
    ['Ironic', 'Tragic', true], ['Ironic', 'Cautionary', false], ['Ironic', 'Cautionary', false],
    ['Ironic', 'Cautionary', false]]);

check('a row breaks the circle exactly when it does not follow it',
  (() => {
    const ring = { Cautionary: 'Tragic', Tragic: 'Ironic', Ironic: 'Cautionary' };
    return rows.filter((e) => e.raises).filter((e) => !!e.breaks !== (ring[e.raises] !== e.lowers))
      .map((e) => e.name);
  })(), []);

check('the thirteen topics, each with a value, an object and a starting quality',
  [api.MG_TOPICS.length,
    api.MG_TOPICS.filter((t) => !t.pennies || !t.object || !t.starts).map((t) => t.name),
    Math.max(...api.MG_TOPICS.map((t) => t.pennies))],
  [13, [], 900]);

// The topic picks the buyers and the buyers pick the currency, so every topic
// has to name two, and every named buyer has to exist.
check('every topic names two buyers, and every one of them is a real buyer',
  (() => {
    const known = api.MG_BUYERS.map((b) => b.who);
    return [api.MG_TOPICS.filter((t) => (t.buyers || []).length !== 2).map((t) => t.name),
      [...new Set(api.MG_TOPICS.flatMap((t) => t.buyers).filter((b) => !known.includes(b)))]];
  })(), [[], []]);

check('every buyer takes at least one topic, or takes anything',
  api.MG_BUYERS.filter((b) => !b.any && !api.MG_TOPICS.some((t) => t.buyers.includes(b.who)))
    .map((b) => b.who), []);

check('every buyer states what it pays and what an exceptional thesis adds',
  api.MG_BUYERS.filter((b) => !b.pays || !b.bonus || !b.level).map((b) => b.who), []);

check('badges for each shape of row',
  ['Write about the Expulsion of Roses', 'Examine traces of the First City',
    'Conclude an exceptional thesis on the subject', 'The Disgraced Diplomat']
    .map((n) => api.mgBadgeText(row(n))),
  ['Tragic 100 · 900 pennies ▾ · Favours: Hell −1', 'Cautionary ▲ · Ironic −50? ▼ · breaks the circle',
    'exceptional · +12.5 Echoes ▾', 'a Vital Intelligence if exceptional']);

// The Unlawful Device is the one research action whose failure is a menace
// rather than Incoherence.
check('the one research action whose failure is Wounds',
  rows.filter((e) => e.wounds).map((e) => e.name), ['(Carefully) Examine an Unlawful Device']);

check('the exceptional thesis names all three of its requirements',
  /Depth of Historical Study 7, some of ALL THREE qualities, and no Incoherence/
    .test(row('Conclude an exceptional thesis on the subject').needs), true);

check('the headings',
  api.MG_STORYLETS.map((s) => api.mgStoryletSpec(key(s)).text),
  ['the Institute', '13 topics · 900 pennies at best', '1,700 pennies an action · mind the circle',
    'exceptional wants Depth 7, all three, no Incoherence', '8 buyers · three of them yours']);

check('the registered pass: the writing heading and two research actions',
  (() => {
    const open = makeHeading(api.MG_CONTINUE, 'storylet-root__heading');
    const second = makeHeading('Examine Relics of the Second City');
    const viric = makeHeading('Examine Viric-tinged Trinkets');
    roots = [open];
    branches = [second, viric];
    api.mgRatings();
    const out = [text(open, api.MG_CLASS), text(second, api.MG_BRANCH_CLASS), text(viric, api.MG_BRANCH_CLASS)];
    roots = []; branches = [];
    return out;
  })(),
  ['1,700 pennies an action · mind the circle', 'Cautionary ▲ · Tragic −50? ▼',
    'Ironic ▲ · Tragic −50? ▼ · breaks the circle']);

check('the feature is registered', api.FEATURES.some((f) => f.name === 'writing-monograph'), true);

console.log(failures ? '\n' + failures + ' FAILED' : '\nall good');
process.exit(failures ? 1 : 0);
