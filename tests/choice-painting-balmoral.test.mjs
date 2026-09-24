// Ad-hoc test for FallenLondon/choice-helper.js's Painting in Balmoral badges
// ('painting-balmoral').
//
// There's no test runner in this repo (see AGENTS.md). This is a standalone
// Node script: it reads the userscript, evaluates its IIFE against a stub DOM
// (empty, so the initial scan() finds nothing) and pulls out the internals.
//
// What's worth pinning here: that every painting action names BOTH outcomes on
// the badge, since a failure advances the work just as far and the best payout
// in the table is three successes and three failures on purpose; that *Unveil
// your Painting* is ONE row pricing all seven compositions, the game showing
// only the one you qualify for; the one place the guide and an option page
// disagree, which is marked rather than resolved; and that *Display your own
// painting* stays `helicon-house`'s.
//
// Numbers come from Painting in Balmoral (Guide), Representational Arts,
// Balmoral: Presenting your Painting and the option pages on fallenlondon.wiki,
// fetched through the API on 2026-09-20.
//
//   node tests/choice-painting-balmoral.test.mjs

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
  'PW_OPTIONS', 'CE_OPTIONS', 'PIR_OPTIONS', 'IRM_OPTIONS', 'KH_OPTIONS', 'HH_OPTIONS', 'JL_OPTIONS',
  'CC_OPTIONS', 'BA_OPTIONS', 'DV_OPTIONS', 'RB_OPTIONS', 'DC_OPTIONS', 'DI_OPTIONS', 'CI_OPTIONS', 'MW_OPTIONS',
  'PB_OPTIONS'];
const wrapped = src
  .replace('(function () {', 'globalThis.__flux = (function () {')
  .replace(/\}\)\(\);\s*$/,
    'return { PB_OPTIONS, PB_INDEX, PB_PAYOUTS, PB_MOONLIT_PLAN, PB_STORYLETS, PB_ACTIONS, PB_DONE, PB_CRATHIE, PB_STUDIO, PB_GALLERY, PB_CLASS, PB_BRANCH_CLASS, pbBadgeText, pbSpec, pbStoryletSpec, pbRatings, carouselLookup, carouselCanonical, factionText, ZEE_CARDS, SPITE_CARDS,'
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
const rows = api.PB_OPTIONS;
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

check('no Painting name is in another feature\u2019s table',
  (() => {
    const others = otherNames('PB_OPTIONS');
    return [...new Set(rows.map((e) => e.name).filter((n) => others.includes(key(n))))];
  })(), []);


check('the seven payouts, what each wants and what it is worth',
  api.PB_PAYOUTS.map((p) => [p.wants, p.echoes, p.best || null, p.epa, p.bestEpa || null]),
  [['Nostalgic 4+', 80, 89.1, 2.78, 3.79], ['Luminosity 4+', 100.2, 112.16, 5.02, 6.35],
    ['Incendiary 4+', 80, null, 3.89, null],
    ['Incendiary 3 and Nostalgic 3', 17.5, null, 4.38, null],
    ['Incendiary 3 and Luminosity 3', 100.2, 112.16, 5.3, 6.63],
    ['Nostalgic 3 and Luminosity 3', 100, 109.1, 4.44, 5.46],
    ['anything else', 75, 84.1, 2.5, 3.51]]);

check('every payout says what it pays',
  api.PB_PAYOUTS.filter((p) => !p.pays).map((p) => p.wants), []);

// Seven wiki pages, one title in game: only the one your composition
// qualifies for is on the screen, so seven rows would cancel each other out.
check('Unveil your Painting is one row, and its tooltip prices all seven',
  (() => {
    const payout = rows.filter((e) => e.payout);
    const title = api.pbSpec(payout[0]).title;
    return [payout.length, api.PB_PAYOUTS.every((p) => title.includes(p.wants))];
  })(), [1, true]);

// The point of the feature: a failure advances the work just as far and only
// steers the style, so a badge quoting the success alone would hide half the
// mechanic and the best payout in the table.
check('every painting action names BOTH outcomes, on the badge',
  rows.filter((e) => e.style).map((e) => [e.name, e.style, e.fail,
    api.pbBadgeText(e).includes('fail ' + e.fail + ' +1')]),
  [['Paint with Moonlight', 'Luminosity', 'Nostalgic', true],
    ['Paint!', 'Nostalgic', 'Incendiary', true],
    ['Paint Balmoral in a subversive cast', 'Incendiary', 'Nostalgic', true]]);

check('and says so in the tooltip too',
  rows.filter((e) => e.style)
    .every((e) => /Painter’s Progress \+1 either way/.test(api.pbSpec(e).title)), true);

check('the three styles are each a success somewhere and a failure somewhere',
  [[...new Set(rows.filter((e) => e.style).map((e) => e.style))].sort(),
    [...new Set(rows.filter((e) => e.style).map((e) => e.fail))].sort()],
  [['Incendiary', 'Luminosity', 'Nostalgic'], ['Incendiary', 'Nostalgic']]);

// One source disagreement, recorded rather than resolved.
check('the subversive cast’s failure is marked as the guide’s claim',
  [row('Paint Balmoral in a subversive cast').guide,
    api.pbBadgeText(row('Paint Balmoral in a subversive cast')),
    /the option page records only the lost item/i
      .test(api.pbSpec(row('Paint Balmoral in a subversive cast')).title)],
  [true, 'Incendiary +1? · fail Nostalgic +1 (guide) ▼', true]);

check('only that one row is marked as the guide’s',
  rows.filter((e) => e.guide).map((e) => e.name), ['Paint Balmoral in a subversive cast']);

// Paint! is the only action whose failure costs LESS than its success, which
// is why the guide uses it as the filler both ways.
check('Paint! is the only one with a cheaper failure',
  rows.filter((e) => e.failUses).map((e) => [e.name, e.uses, e.failUses]),
  [['Paint!', 'Touching Love Story ×5', 'Touching Love Story ×3']]);

check('six actions to paint, and Painter’s Progress finishes at seven',
  [api.PB_ACTIONS, api.PB_DONE, row('Complete a commission').needs],
  [6, 7, 'Painter’s Progress 7']);

// What to aim at is decided before you start, by the Moonlit you brought out
// of the woods next door.
check('the Moonlit plan, worst to best',
  api.PB_MOONLIT_PLAN.map((p) => [p[0], p[2]]), [[12, 5.46], [8, 6.35], [6, 6.63], [0, 3.89]]);

check('badges for each shape of row',
  ['Undertake a commission', 'Paint with Moonlight', 'Paint!', 'Unveil your Painting']
    .map((n) => api.pbBadgeText(row(n))),
  ['starts a painting', 'Luminosity +1? · fail Nostalgic +1 ▼', 'Nostalgic +1? · fail Incendiary +1 ▼',
    'the payout · 17.5–112.16 Echoes']);

check('the headings',
  api.PB_STORYLETS.map((s) => api.pbStoryletSpec(key(s)).text),
  ['the painters’ studio is here', '6 actions · failure is free', 'seven payouts · best 6.63 EPA']);

// Helicon House already owns *Display your own painting*, so this feature
// must not claim it -- it is priced on the rules line instead.
check('the Helicon alternative is priced but not claimed',
  [rows.some((e) => /Display your own painting/.test(e.name)),
    api.HH_OPTIONS.some((e) => e.name === 'Display your own painting'),
    /Helicon House instead, which pays Hinterland Scrip ×125/.test(api.pbSpec(row('Paint!')).title)],
  [false, true, true]);

check('the registered pass: the studio heading and two of its options',
  (() => {
    const open = makeHeading(api.PB_STUDIO, 'storylet-root__heading');
    const moon = makeHeading('Paint with Moonlight');
    const done = makeHeading('Complete a commission');
    roots = [open];
    branches = [moon, done];
    api.pbRatings();
    const out = [text(open, api.PB_CLASS), text(moon, api.PB_BRANCH_CLASS), text(done, api.PB_BRANCH_CLASS)];
    roots = []; branches = [];
    return out;
  })(),
  ['6 actions · failure is free', 'Luminosity +1? · fail Nostalgic +1 ▼', 'finishes the painting']);

check('the feature is registered', api.FEATURES.some((f) => f.name === 'painting-balmoral'), true);

console.log(failures ? '\n' + failures + ' FAILED' : '\nall good');
process.exit(failures ? 1 : 0);
