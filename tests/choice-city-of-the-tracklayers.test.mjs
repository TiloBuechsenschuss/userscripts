// Ad-hoc test for FallenLondon/choice-helper.js's City of the Tracklayers feature
// ('city-of-the-tracklayers') on the shared progress-quality helper (pq*).
//
// There's no test runner in this repo (see AGENTS.md). This is a standalone Node script: it
// reads the userscript, evaluates its IIFE against a stub DOM (empty, so the initial scan() finds
// nothing) and pulls out the internals.
//
// What's worth pinning here:
//
//  - The badge form: the Prosperity a success pays, `HP (220+Eff)?`, what the option does to the
//    Waning and the Displeasure, `fail ...`, and a cash-out as `HP -(1050-Eff) v -> item`.
//  - The seven Imports and Exports cash-outs, whose cost is 1000 or 1050 minus Efficiency by the
//    city's site, and the three betrayals that cash everything out.
//  - The guide's table of decisions against the pages: a broad challenge is certain at five
//    thirds of its difficulty, a narrow one at five above (the rest of the script counts four).
//  - The card names the game gives without the wiki's brackets, or with a placeholder, and the
//    option titles with a placeholder ("Look towards (Chosen Site)").
//  - The card in the hand, the card opened, and an option inside it, each badged once, and a
//    generic card name (Poise) left alone in the hand.
//  - That no option is filed under the same card in another feature's table.
//
// Options come from the card and option pages on fallenlondon.wiki, fetched through the API on
// 2026-09-26, with The City of the Tracklayers (Guide) as the cross-check.
//
//   node tests/choice-city-of-the-tracklayers.test.mjs

import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const here = dirname(fileURLToPath(import.meta.url));
const src = readFileSync(join(here, '..', 'FallenLondon', 'choice-helper.js'), 'utf8');

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
let hand = [];
const fakeDoc = {
  body: makeEl('body'),
  querySelectorAll: (sel) => {
    if (sel === '.storylet-root__heading') return roots;
    if (sel === '.storylet__heading, .storylet-root__heading') return list.concat(roots);
    if (sel === '.branch__title') return branches;
    if (sel === '.hand .small-card__body .media__heading') return hand;
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
    'return { CAROUSEL_COLOR_NEUTRAL, broadCertainAt, pqSpec, pqStoryletSpec, TLC_CFG, TLC_OPTIONS, TLC_CARDS, TLC_INDEX, TLC_DEF, tlcRatings,'
    + ' SIC_OPTIONS, INV_OPTIONS, FAS_OPTIONS, INSP_OPTIONS, CASING_OPTIONS, THIO_OPTIONS, RUNB_OPTIONS, AOL_OPTIONS, CHW_OPTIONS,'
    + ' LBI_OPTIONS, VH_OPTIONS, DME_OPTIONS, HW_OPTIONS, RBG_OPTIONS, SD_OPTIONS, normalizeName, BADGE_CLASS, FEATURES }; })();');
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
const badgeOf = (head, cls) => {
  for (let n = head.nextElementSibling; n && n.classList.contains(api.BADGE_CLASS); n = n.nextElementSibling) {
    if (n.classList.contains(cls)) return n;
  }
  return null;
};
const key = api.normalizeName;
const opt = (card, name) => api.TLC_OPTIONS.find((e) => key(e.storylet) === key(card) && key(e.name) === key(name));
const label = (card, name) => api.pqSpec(opt(card, name), api.TLC_CFG).text;
const title = (card, name) => api.pqSpec(opt(card, name), api.TLC_CFG).title;
const tlc = (t) => { const b = api.TLC_OPTIONS.filter((e) => key(e.name) === key(t)); return b; };

check('every entry names its card and option and has a badge, and none repeats',
  [api.TLC_OPTIONS.every((e) => e.storylet && e.name && e.label && e.title),
    new Set(api.TLC_OPTIONS.map((e) => key(e.storylet) + '|' + key(e.name))).size === api.TLC_OPTIONS.length],
  [true, true]);

check('every card that holds an option is in the card list, and every listed card holds one',
  (() => {
    const held = new Set(api.TLC_OPTIONS.map((e) => key(e.storylet)));
    const listed = new Set(api.TLC_CARDS.map((c) => key(c.name)));
    return [[...held].filter((k) => !listed.has(k)), [...listed].filter((k) => !held.has(k))];
  })(), [[], []]);

check('a Prosperity option says what a success pays and what the city takes for it',
  [label('Genii Locorum', 'Look into this new belief'),
    label('Growing the Population', 'Welcome some new arrivals'),
    label('Landscape in Moonlight', 'Look towards (Chosen Site)'),
    label('A Project Concludes', 'Enjoy the fruits of labour'),
    label('Holiday Cheer', 'Take in the wintry spectacle')],
  ['HP (220+Eff)? · fail Wounds +2', 'HP (200+Eff) · Waning −1', 'HP (220+Eff)? · fail HP (200+Eff) · fail Nightmares +1',
    'HP (300+Eff) · Efficiency +50', 'HP (200+Eff)≈']);

check('a cash-out says what it costs and what it gives, and the seven Imports and Exports say why the cost is a range',
  [label('Charting the Hinterland', 'Collate the results of an expedition'),
    label('A Visit from Virginia', 'Request connections'),
    label('Imports and Exports', 'Vibrations on the web'),
    api.TLC_OPTIONS.filter((e) => key(e.storylet) === key('Imports and Exports')).length,
    /1000 minus your Hinterland Efficiency when the city.s chosen site is Outside of Balmoral/.test(title('Imports and Exports', 'Vibrations on the web'))],
  ['HP −(1050−Eff) ▼ → Puzzling Map ×1', 'HP −156,250 ▼ → Rumourmonger’s Network ×1',
    'HP −(1000–1050−Eff) ▼ → Vital Intelligence ×1', 7, true]);

check('the three betrayals cash all the Prosperity out, and every one raises the Waning by 36 or wipes the Efficiency',
  [label('Officially Non-Criminal', 'Betray the city to criminal affiliates'),
    label('Officially Non-Criminal', 'Betray the city to the Constables'),
    label('Beside Marigold', 'Allow Hell its hour')],
  ['HP all ▼ → Journal of Infamy (HP ÷ 50) · Waning +36 · Efficiency → 0 · fail Displ +2',
    'HP all ▼ → Dubious Testimony (HP ÷ 50) · Waning +36 · Efficiency → 0 · fail Displ +2',
    'HP all ▼ → Infernal Contract (HP ÷ 20) · Efficiency → 0']);

check('the guide’s certain-pass values agree with the pages: a broad challenge at five thirds, a narrow one at five above',
  (() => {
    const bad = [];
    api.TLC_OPTIONS.filter((e) => e.guide && (e.b || e.n)).forEach((e) => {
      const nums = {};
      e.guide.replace(/([A-Z][A-Za-z ]+?) (\d+)/g, (m, stat, n) => { nums[stat.trim().replace(/^and /, '').replace(/^certain at /, '')] = Number(n); });
      if (e.b) {
        const got = nums[e.b[0]];
        if (got !== api.broadCertainAt(Number(e.b[1]))) bad.push([e.name, e.b, got]);
      }
      if (e.n) {
        const got = nums[e.n[0]];
        if (got !== Number(e.n[1]) + 5) bad.push([e.name, e.n, got]);
      }
    });
    return bad;
  })(), []);

check('the guide’s table of decisions is carried on 35 options',
  api.TLC_OPTIONS.filter((e) => e.guide).length, 35);

check('the Merry Gentleman and the Whitsun challenge that the wiki has two pages for say so',
  [/two pages/.test(title('A Visit from the Merry Gentleman', 'Greet the Merry Gentleman')),
    opt('Whitsun (The City of the Tracklayers)', 'Smash them! Smash them all!').b],
  [true, ['Dangerous', 180]]);

check('a card the game names without the wiki’s brackets, or with a placeholder, is found',
  (() => {
    const c = (t) => api.TLC_DEF.aliases(key(t));
    return [c('Whitsun'), c('The Sound of Wings'), c('The Emancipationist Way'), c('Cornelius Leading a no-Prehistoricists city'),
      c('Furnace Leading a Radical no-Emancipationist City'), c('Genii Locorum'), c('Something else')];
  })(),
  ['whitsun the city of the tracklayers', 'the sound of wings tracklayers city', 'the emancipationist way',
    'cornelius leading a no prehistoricists city', 'furnace leading a radical no emancipationist city', 'genii locorum', null]);

check('an option with a placeholder in its title is found from the game’s wording',
  api.TLC_INDEX.some((r) => r.matches(key('Look towards Ealing Gardens')) && r.storylet === key('Landscape in Moonlight')), true);

check('the card in the hand and the opened card each get one badge, the option inside its own, another card’s none',
  (() => {
    const card = makeHeading('Genii Locorum');
    const other = makeHeading('Poise');
    hand = [card, other];
    const t = (h, cls) => { const b = badgeOf(h, cls); return b && b.textContent; };
    api.tlcRatings();
    const out = [t(card, api.TLC_DEF.cardCls), t(other, api.TLC_DEF.cardCls)];
    hand = [];
    const head = makeHeading('Genii Locorum');
    const good = makeHeading('Look into this new belief');
    const stray = makeHeading('Preach');
    roots = [head];
    branches = [good, stray];
    api.tlcRatings();
    out.push(t(head, api.TLC_DEF.cardCls), t(good, api.TLC_DEF.branchCls), t(stray, api.TLC_DEF.branchCls));
    roots = [];
    branches = [];
    return out;
  })(), ['HP up to (220+Eff)', null, 'HP up to (220+Eff)', 'HP (220+Eff)? · fail Wounds +2', null]);

check('a card named like one of the city’s but under its alias is badged in the hand',
  (() => {
    const card = makeHeading('Whitsun');
    hand = [card];
    api.tlcRatings();
    const b = badgeOf(card, api.TLC_DEF.cardCls);
    hand = [];
    return b && b.textContent;
  })(), 'HP up to (220+Eff)');

check('Officially Non-Criminal stays Investigating’s card: no card or heading badge of this feature, its own options still badged',
  (() => {
    const card = makeHeading('Officially Non-Criminal');
    hand = [card];
    api.tlcRatings();
    const out = [badgeOf(card, api.TLC_DEF.cardCls)];
    hand = [];
    const head = makeHeading('Officially Non-Criminal');
    const good = makeHeading('Give Mr Wines one in the eye');
    roots = [head];
    branches = [good];
    api.tlcRatings();
    out.push(badgeOf(head, api.TLC_DEF.cardCls), badgeOf(head, api.TLC_DEF.cls));
    const b = badgeOf(good, api.TLC_DEF.branchCls);
    out.push(b && b.textContent);
    roots = [];
    branches = [];
    return out;
  })(), [null, null, null, 'HP −31,250 ▼ → Bottle of Fourth City Airag: Year of the Tortoise ×5']);

check('no option is filed under a card of another feature’s table with the same title',
  (() => {
    const mine = api.TLC_OPTIONS.map((e) => key(e.storylet) + '|' + key(e.name));
    const others = [...api.SIC_OPTIONS, ...api.INV_OPTIONS, ...api.FAS_OPTIONS, ...api.INSP_OPTIONS, ...api.CASING_OPTIONS,
      ...api.THIO_OPTIONS, ...api.RUNB_OPTIONS, ...api.AOL_OPTIONS, ...api.CHW_OPTIONS, ...api.DME_OPTIONS, ...api.LBI_OPTIONS,
      ...api.VH_OPTIONS, ...api.HW_OPTIONS, ...api.RBG_OPTIONS, ...api.SD_OPTIONS].map((e) => key(e.storylet) + '|' + key(e.name));
    return mine.filter((n) => others.includes(n));
  })(), []);

check('the feature is registered', api.FEATURES.some((f) => f.name === 'city-of-the-tracklayers'), true);

console.log(failures ? '\n' + failures + ' FAILED' : '\nall good');
process.exit(failures ? 1 : 0);
