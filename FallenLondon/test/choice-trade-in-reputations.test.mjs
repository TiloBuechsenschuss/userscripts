// Ad-hoc test for FallenLondon/choice-helper.js's A Trade in Reputations badges
// ('trade-in-reputations').
//
// There's no test runner in this repo (see AGENTS.md). This is a standalone
// Node script: it reads the userscript, evaluates its IIFE against a stub DOM
// (empty, so the initial scan() finds nothing) and pulls out the internals.
//
// What's worth pinning here: the cross-check the whole feature rests on -- the
// Change Tables' stated Standard, Rare and Loss figures at twelve Enterprise
// levels against the logistic curve the same page gives, so a slip in either
// shows up -- then that every figure is quoted at Enterprise 25, that the
// finishing cards outrank everything as the guide orders them, the hand's ▾
// for a line behind a spokesperson or item, and the "(Campaign Focus)" titles.
//
// Numbers come from A Trade in Reputations (Guide), Advertising Profile: Name
// Recognition/Change Tables and the card and option pages on
// fallenlondon.wiki, fetched through the API on 2026-09-17.
//
//   node FallenLondon/test/choice-trade-in-reputations.test.mjs

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

function makeHeading(text) {
  const parent = makeEl('div');
  const el = makeEl('h2');
  el.childNodes.push({ nodeType: 3, nodeValue: text });
  el.textContent = text;
  parent.appendChild(el);
  return el;
}

let roots = [];
let branches = [];
let hand = [];
const fakeDoc = {
  body: makeEl('body'),
  querySelectorAll: (sel) => {
    if (sel === '.storylet-root__heading' || sel === '.storylet__heading, .storylet-root__heading') return roots;
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

const TABLES = ['ARBOR_OPTIONS', 'LBI_OPTIONS', 'DME_OPTIONS', 'VH_OPTIONS', 'FQ_OPTIONS', 'CM_OPTIONS',
  'SOUP_OPTIONS', 'MIND_OPTIONS', 'CASE_OPTIONS', 'EMB_OPTIONS', 'LAW_OPTIONS', 'MUS_OPTIONS',
  'HEIST_OPTIONS', 'SPIDER_OPTIONS', 'STORY_OPTIONS', 'FLASH_OPTIONS', 'SOCIAL_OPTIONS', 'NADIR_OPTIONS',
  'COURT_OPTIONS', 'BREED_OPTIONS', 'MH_OPTIONS', 'MC_OPTIONS', 'SIXTH_ROOM_OPTIONS', 'RM_OPTIONS',
  'BOX_OPTIONS', 'UC_OPTIONS', 'HB_ALL', 'TP_OPTIONS', 'TIR_OPTIONS', 'RSC_OPTIONS', 'NP_OPTIONS', 'WOA_OPTIONS',
  'WOI_OPTIONS', 'FP_OPTIONS', 'TC_OPTIONS'];
const wrapped = src
  .replace('(function () {', 'globalThis.__flux = (function () {')
  .replace(/\}\)\(\);\s*$/,
    'return { TIR_STATED, TIR_ENTERPRISE, TIR_STORYLETS, TIR_INDEX, TIR_HAND, TIR_CLASS, TIR_BRANCH_CLASS, TIR_CARD_CLASS, tirCurve, tirGain, tirRank, tirBadgeText, tirSpec, tirRatings, carouselLookup, broadCertainAt, posiBadgeText, carouselHandSpec, '
    + TABLES.join(', ')
    + ', ZEE_CARDS, SPITE_CARDS, FOTZ_CARDS, LAB_CARDS, PC_OPTIONS, VSD_OPTIONS, normalizeName,'
    + ' BADGE_CLASS, FEATURES }; })();');
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
function otherStorylets(own) {
  return TABLES.filter((t) => t !== own).flatMap((t) => api[t].map((e) => e.storylet)).map(key).filter(Boolean);
}
const rows = api.TIR_OPTIONS;
const row = (storylet, name) => rows.find((e) => e.storylet === storylet && e.name === name);

check('the Change Tables\' stated figures are the curve, at every level they list',
  ['standard', 'rare', 'loss'].map((c) => api.TIR_STATED.at
    .filter((n, i) => api.tirCurve(c, n) !== api.TIR_STATED[c][i]).map((n) => c + '@' + n)).flat(), []);

check('Enterprise 25 is the level every badge is quoted at',
  [api.TIR_ENTERPRISE, api.tirCurve('standard', 25), api.tirCurve('rare', 25), api.tirCurve('loss', 25)],
  [25, 312, 411, -156]);

check('every card option is on a card in the deck, and every storylet has options',
  [rows.filter((e) => !api.TIR_STORYLETS.includes(e.storylet)).map((e) => e.name),
    api.TIR_STORYLETS.filter((s) => !rows.some((e) => e.storylet === s))], [[], []]);

check('the finishing cards rank in the guide\'s order: Cuttlefish > luck > trade show > campaign card > Season',
  [['A trade show', 'Employ your Violantly Mercantile Cuttlefish as a salesperson'], ['A stroke of luck', 'Scour the papers'],
    ['A trade show', 'Engage with the public'], ['A questionnaire', 'Distribute the questionnaire'],
    ['’Tis the Season', 'One for you and one for Sacks!']].map((p) => api.tirRank(row(p[0], p[1]))[0]),
  [525, 500, 475, 450, 425]);

// "only actions which give you 312+": a Standard line beats a 167 + 2E one at 25.
check('a Standard line pays more than a 167 + 2E line at Enterprise 25, and the same at 0',
  [api.tirGain(row('A bizarre campaign', 'Make the campaign a great deal more bizarre'), 25),
    api.tirGain(row('A bizarre campaign', 'Invest in the strange and incongruous'), 25),
    api.tirGain(row('A bizarre campaign', 'Make the campaign a great deal more bizarre'), 0),
    api.tirGain(row('A bizarre campaign', 'Invest in the strange and incongruous'), 0)],
  [312, 217, 167, 167]);

check('badges', [
  ['An urgent assignment', 'Write the copy'],
  ['A bizarre campaign', 'Make the campaign a great deal more bizarre'],
  ['A bizarre campaign', 'Distance the campaign from the dreaded'],
  ['A serialised novel', 'Imitate an existing serial'],
  ['A stroke of luck', 'Scour the papers'],
  ['Attend to your reputation', 'Confuse matters'],
  ['A Question of Challenge', 'Raise the stakes'],
].map((p) => api.tirBadgeText(row(p[0], p[1]))),
['NR +217? −150', 'NR +312/411? −156', 'NR +215/230?', 'NR +312', 'NR +500', 'Scandal −2 CP?', 'free · Enterprise +5']);

check('the tooltip gives the figure at every Enterprise step and the failure\'s loss',
  (() => {
    const t = api.tirSpec(row('Meddle with the competition', 'Spread rumours about your competitors’ products')).title;
    return [t.includes('By Enterprise: 0 → +167/221, 10 → +200/265, 15 → +267/353, 20 → +305/402, 25 → +312/411.'),
      t.includes('−156 at 25'), t.includes('Rare success also: Shadowy +5 CP.'), t.includes('Campaign Duration 2–4')];
  })(), [true, true, true, true]);

check('a colour never carries the claim alone: a label and a paying line differ in words too',
  [api.tirSpec(row('A Question of Challenge', 'It’s too much')).text, api.tirSpec(row('A stroke of luck', 'Scour the papers')).text],
  ['Enterprise −5', 'NR +500']);

check('the hand: best ungated line, ▾ where a better one needs a spokesperson or an item', [
  api.carouselHandSpec(api.TIR_HAND, 'A bizarre campaign').text,
  api.carouselHandSpec(api.TIR_HAND, 'A trade show').text,
  api.carouselHandSpec(api.TIR_HAND, 'A troublesome ambiguity').text,
  api.carouselHandSpec(api.TIR_HAND, 'Conclude the campaign'),
], ['NR +217? −156 ▾', 'NR +475 ▾', 'NR +217?', null]);

check('"(Campaign Focus)" in an option title matches the product',
  api.carouselLookup(api.TIR_INDEX, 'Commission a poster for Spirit of the Zee', key('The Genre Painter')).name,
  'Commission a poster for (campaign focus)');

check('the registered pass: hand card, opened card and its option, by a product-named title',
  (() => {
    const cardInHand = makeHeading('A stroke of luck');
    hand = [cardInHand];
    const opened = makeHeading('Have Sterling’s Solar Hearth Reviewed');
    const option = makeHeading('Have the product reviewed in the Unexpurgated London Gazette');
    roots = [opened];
    branches = [option];
    api.tirRatings();
    const out = [text(cardInHand, api.TIR_CARD_CLASS), text(opened, api.TIR_CLASS), text(option, api.TIR_BRANCH_CLASS)];
    roots = [makeHeading('A convivial affair')];
    api.tirRatings();
    out.push(text(option, api.TIR_BRANCH_CLASS));
    hand = []; roots = []; branches = [];
    return out;
  })(),
  ['NR +500', 'campaign card', 'NR +312/411? −156', null]);

check('no Trade in Reputations option name is in another feature\'s table',
  (() => { const others = otherNames('TIR_OPTIONS');
    return [...new Set(rows.map((e) => e.name))].filter((n) => others.includes(key(n))); })(), []);

check('no Trade in Reputations storylet is another feature\'s',
  (() => { const others = otherStorylets('TIR_OPTIONS');
    return api.TIR_STORYLETS.filter((s) => others.includes(key(s))); })(), []);

check('the feature is registered', api.FEATURES.some((f) => f.name === 'trade-in-reputations'), true);

console.log(failures ? '\n' + failures + ' FAILED' : '\nall good');
process.exit(failures ? 1 : 0);
