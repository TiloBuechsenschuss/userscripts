// Ad-hoc test for FallenLondon/choice-helper.js's Relicker badges ('relickers').
//
// There's no test runner in this repo (see AGENTS.md). Standalone Node script: evaluates the
// userscript's IIFE against a stub DOM and pulls out the internals.
//
// What's worth pinning here: 49 rows (four cards x 8 trades + 3 recertify, and five extras), the
// guide's ladder against every row (with Whisper-Satin's stat as the one page-over-guide exception),
// the guide's Echoes-per-scrap column against its own sell values, the badge marks (expected value
// "≈" on the four Luck tiers, none on the fixed ones, "▾" on the seven Airs-gated options), the two
// option names that sit on two cards resolving by CARD, both spellings of an apostrophe and of the
// one "certifiable" title, the gate (an option is badged only while its own card is open), and that no
// name of ours is in any other feature's table.
//
// Numbers come from the four Relicker cards and their 47 option pages on fallenlondon.wiki, with
// Certifiable Scraps (Guide)/Table as the cross-check, fetched through the API on 2026-09-29 -- see
// docs/superpowers/research/2026-09-29-relickers.md.
//
//   node tests/choice-relickers.test.mjs

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
      const m = /^([a-z]+)?(?:\.([\w-]+))?$/.exec(sel);
      return this.children.find((c) => (!m[1] || c.tagName === m[1].toUpperCase())
        && (!m[2] || String(c.className).split(/\s+/).includes(m[2]))) || null;
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
const fakeDoc = {
  body: makeEl('body'),
  querySelectorAll: (sel) => {
    if (sel === '.storylet-root__heading' || sel === '.storylet__heading, .storylet-root__heading') return roots;
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
    'return { RELICKER_OPTIONS, RELICKER_TIERS, RELICKER_CARDS, relickerBadgeSpec, relickerCardSpec, relickerRatings,'
    + ' RELICKER_CLASS, RELICKER_BRANCH_CLASS, normalizeName, BADGE_CLASS, FEATURES }; })();');
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

const CARDS = api.RELICKER_CARDS;
const rows = api.RELICKER_OPTIONS;
const row = (cardKey, name) => rows.find((e) => e.card === cardKey && e.name === name);
const spec = (cardKey, name) => api.relickerBadgeSpec(row(cardKey, name));
const trades = (cardKey) => rows.filter((e) => e.card === cardKey && e.kind === 'trade');
const badgeOf = (head, cls) => {
  for (let n = head.nextElementSibling; n && n.classList.contains(api.BADGE_CLASS); n = n.nextElementSibling) {
    if (n.classList.contains(cls)) return n;
  }
  return null;
};
const text = (head, cls) => { const b = badgeOf(head, cls); return b && b.textContent; };

// --- shape ------------------------------------------------------------------------------------------------------

check('four cards', Object.keys(CARDS), ['capering', 'coquettish', 'curt', 'shivering']);
check('49 rows: 44 trades and recertify gambles, five extras', rows.length, 49);
check('every card has trades 1 to 8 exactly once',
  Object.keys(CARDS).map((k) => trades(k).map((e) => e.tier)), Object.keys(CARDS).map(() => [1, 2, 3, 4, 5, 6, 7, 8]));
check('every card has three recertify gambles at 5, 10 and 20 scraps',
  Object.keys(CARDS).map((k) => rows.filter((e) => e.card === k && e.kind === 'recertify').map((e) => e.scraps)),
  Object.keys(CARDS).map(() => [5, 10, 20]));
check('the extras: a pastime, three menace options and the Face-Tailor',
  rows.filter((e) => !['trade', 'recertify'].includes(e.kind)).map((e) => e.kind + ':' + e.card),
  ['pastime:capering', 'menace:coquettish', 'menace:curt', 'facetailor:curt', 'menace:shivering']);
check('every row is filed under its own card\'s full title', rows.every((e) => e.storylet === CARDS[e.card].card), true);

// --- the guide's ladder, the cross-check --------------------------------------------------------------------------

check('the ladder: 5/15/30/100/120/160/680/3200 scraps at 25..200, the first four a Luck challenge',
  api.RELICKER_TIERS.map((t) => [t.scraps, t.stat, t.luck]),
  [[5, 25, true], [15, 50, true], [30, 75, true], [100, 100, true], [120, 125, false], [160, 150, false], [680, 175, false], [3200, 200, false]]);
check('every trade costs its tier\'s scraps and needs its tier\'s stat, except Whisper-Satin (page 70, guide 75)',
  rows.filter((e) => e.kind === 'trade').filter((e) => {
    const t = api.RELICKER_TIERS[e.tier - 1];
    return e.scraps !== t.scraps || e.stat !== t.stat || e.luck !== t.luck;
  }).map((e) => [e.name, e.stat, e.guideStat]),
  [['Hand over a box of scraps for Whisper-Satin', 70, 75]]);
check('each card asks its own stat: Persuasive, Dangerous, Shadowy, Watchful',
  Object.keys(CARDS).map((k) => CARDS[k].stat), ['Persuasive', 'Dangerous', 'Shadowy', 'Watchful']);
// The guide's "Sell value" column, in Echoes, against its own "E per scrap" column.
const guideSell = [1.2, 5, 13, 32, 37.5, 60, 312.5, 1560];
check('the guide\'s Echoes per scrap reproduce its own sell values within 7%',
  api.RELICKER_TIERS.every((t, i) => Math.abs(t.eps * t.scraps - guideSell[i]) / guideSell[i] < 0.07), true);
check('a Luck tier\'s failure pays a quarter of the goods, rounded as the pages give it',
  Object.keys(CARDS).map((k) => trades(k).filter((e) => e.luck).map((e) => e.fail / e.win)),
  [[0.25, 0.25, 10 / 42, 0.25], [0.25, 0.25, 10 / 42, 0.25], [0.24, 0.25, 10 / 42, 0.25], [0.25, 0.25, 10 / 42, 0.25]]);
check('every Luck trade names its rare-success item; the fixed ones have none',
  rows.filter((e) => e.kind === 'trade').every((e) => e.luck === Boolean(e.rare)), true);

// --- the badge -----------------------------------------------------------------------------------------------------

check('a Luck trade quotes the expected quantity with the approximation mark',
  [spec('capering', 'Hand over a paltry few creditable scraps for Souls').text,
    spec('coquettish', 'Hand over a paltry few creditable scraps for Silk').text,
    spec('curt', 'Hand over a box of scraps for Incendiary Gossip').text,
    spec('capering', 'Hand over a sack of scraps for Muscaria Brandy').text],
  ['Soul ×62.5≈', 'Silk Scrap ×125≈', 'Scrap of Incendiary Gossip ×26≈ ▾', 'Muscaria Brandy ×12.5≈']);
check('a fixed trade quotes the quantity and carries no mark',
  [spec('capering', 'Hand over all the scraps you can carry for Brass Rings').text,
    spec('shivering', 'Hand over a multitude of scraps for a Breath of the Void').text],
  ['Brass Ring ×3', 'Breath of the Void ×1']);
check('a recertify gamble quotes both outcomes and the expectation, never the advertised gain alone',
  [spec('coquettish', 'Recertify an armful of scraps').text, spec('curt', 'Ask the Curt Relicker to recertify some scraps').text,
    spec('shivering', 'Ask the Shivering Relicker to recertify a double armful of scraps').text],
  ['Scrap +10 / −8 ≈ +1', 'Scrap +5 / −4 ≈ +0.5', 'Scrap +20 / −18 ≈ +1']);
check('the Capering double-armful also says it pays Walking the Falling Cities +10 CP; the Coquettish one does not',
  [spec('capering', 'Recertify a double-armful of scraps').text, spec('coquettish', 'Recertify a double-armful of scraps').text],
  ['Scrap +20 / −18 ≈ +1 · Walking the Falling Cities +10 CP', 'Scrap +20 / −18 ≈ +1']);
check('a menace option quotes its expected change per try',
  [spec('coquettish', 'Tell the Coquettish Relicker your woes').text,
    spec('curt', 'Ask the Curt Relicker to help with matters of law and suspicion').text,
    spec('shivering', 'Invite the Shivering Relicker in for a chat').text],
  ['Scandal −3 / +1 CP ≈ −1.4', 'Suspicion −3 / +1 CP ≈ −1.4', 'Nightmares −3 / +1 CP ≈ −1.4']);
check('the pastime and the Fate Face-Tailor',
  [spec('capering', 'A droll pastime').text, spec('curt', 'Meet the Face-Tailor on his rounds').text],
  ['Dark-Dewed Cherry ×0.6 · Wounds +0.8 CP ≈', 'Scrap +1–4 · Suspicion −3 CP']);
check('the Airs-gated options are the seven the pages give, each with ▾ and the requirement in words',
  rows.filter((e) => e.gate).map((e) => [e.card, e.kind === 'trade' ? e.tier : 'recertify', e.gate,
    api.relickerBadgeSpec(e).text.includes('▾'), api.relickerBadgeSpec(e).title.includes('The Airs of London ' + e.gate)]),
  [['capering', 7, '3+', true, true], ['capering', 8, '3+', true, true], ['coquettish', 2, '3+', true, true],
    ['coquettish', 4, '3+', true, true], ['curt', 3, '3+', true, true], ['shivering', 2, '1+', true, true],
    ['shivering', 'recertify', '1+', true, true]]);
check('a badge without a gate has no ▾', rows.filter((e) => !e.gate).every((e) => !api.relickerBadgeSpec(e).text.includes('▾')), true);
check('a Luck trade\'s tooltip gives success, failure, the rare item and the guide\'s estimate as the guide\'s',
  (() => {
    const t = spec('capering', 'Hand over a paltry few creditable scraps for Souls').title;
    return ['Success: Soul ×100', 'Failure: Soul ×25', 'adds one Amanita Sherry', 'about 0.24 Echoes per scrap (its estimate, not a page fact)']
      .map((s) => t.includes(s));
  })(), [true, true, true, true]);
check('Whisper-Satin\'s tooltip says the guide\'s ladder disagrees and which is followed',
  spec('coquettish', 'Hand over a box of scraps for Whisper-Satin').title.includes('The guide’s ladder says Dangerous 75; the option page says 70'), true);
check('the Face-Tailor\'s tooltip states its Fate requirement',
  spec('curt', 'Meet the Face-Tailor on his rounds').title.includes('The Face Trade exactly 29'), true);
check('the secret trade says what it is in the badge and the full item in the tooltip',
  [spec('capering', 'Hand over a multitude of scraps for... something secret').text,
    spec('capering', 'Hand over a multitude of scraps for... something secret').title.includes('Reported Location of a One-Time Prince of Hell')],
  ['Prince of Hell’s location ×1 ▾', true]);
check('colour is never the only carrier: every text carries its own meaning without the colour',
  rows.every((e) => api.relickerBadgeSpec(e).text.length > 6), true);

// --- wiring: the card is the gate, and it is the key -------------------------------------------------------------

function badgeText(cardTitle, optionTitle) {
  const head = makeHeading(optionTitle);
  branches = [head];
  roots = [makeHeading(cardTitle)];
  api.relickerRatings();
  const out = text(head, api.RELICKER_BRANCH_CLASS);
  roots = []; branches = [];
  return out;
}
check('an option is badged while its own card is open',
  badgeText(CARDS.capering.card, 'Hand over all the scraps you can carry for Brass Rings'), 'Brass Ring ×3');
check('the same option name on two cards resolves by the open card',
  [badgeText(CARDS.capering.card, 'Recertify a double-armful of scraps'),
    badgeText(CARDS.coquettish.card, 'Recertify a double-armful of scraps'),
    badgeText(CARDS.capering.card, 'Recertify an armful of scraps'),
    badgeText(CARDS.coquettish.card, 'Recertify an armful of scraps')],
  ['Scrap +20 / −18 ≈ +1 · Walking the Falling Cities +10 CP', 'Scrap +20 / −18 ≈ +1', 'Scrap +10 / −8 ≈ +1', 'Scrap +10 / −8 ≈ +1']);
check('another card\'s option is not badged on this card',
  badgeText(CARDS.capering.card, 'Hand over a paltry few creditable scraps for Silk'), null);
check('nothing is badged while some other storylet is open',
  badgeText('Some Other Storylet', 'Hand over all the scraps you can carry for Brass Rings'), null);
check('the game\'s straight apostrophe matches the table\'s curly one',
  badgeText(CARDS.shivering.card, 'Hand over a small collection of scraps for Maniac\'s Prayers'), 'Maniac’s Prayer ×50≈ ▾');
check('the guide\'s "certifiable" spelling of the Shivering tier-1 title is matched as well',
  [badgeText(CARDS.shivering.card, 'Hand over a paltry few certifiable scraps for Primordial Shrieks'),
    badgeText(CARDS.shivering.card, 'Hand over a paltry few creditable scraps for Primordial Shrieks')],
  ['Primordial Shriek ×62.5≈', 'Primordial Shriek ×62.5≈']);
check('every row is reachable through the wiring, not only through its spec',
  rows.filter((e) => badgeText(e.storylet, e.name) === null).map((e) => e.name), []);
check('each open card\'s own heading gets a label saying what it deals in',
  Object.keys(CARDS).map((k) => {
    const head = makeHeading(CARDS[k].card);
    roots = [head]; branches = [];
    api.relickerRatings();
    const t = text(head, api.RELICKER_CLASS);
    roots = [];
    return t;
  }),
  ['Capering Relicker: scraps → infernal goods', 'Coquettish Relicker: scraps → cloth',
    'Curt Relicker: scraps → gossip and blackmail', 'Shivering Relicker: scraps → screams and secret things']);
check('a heading that is not one of the four cards gets no label',
  (() => { const head = makeHeading('The Capering Relicker'); roots = [head]; api.relickerRatings(); const t = text(head, api.RELICKER_CLASS); roots = []; return t; })(),
  null);

// --- no name of ours is in another feature's table ---------------------------------------------------------------

const START = '// === feature: The Relickers';
const END = '// === feature: The Stacks';
const outside = (() => {
  const a = src.indexOf(START);
  const b = src.indexOf(END);
  return src.slice(0, a) + src.slice(b);
})();
const quoted = (name) => [name, name.replace(/’/g, '\'')].some((n) => outside.includes('\'' + n.replace(/'/g, '\\\'') + '\'')
  || outside.includes('"' + n + '"'));
check('no option name of the Relickers is a quoted string anywhere else in the file',
  rows.map((e) => e.name).filter(quoted), []);
check('no card title of the Relickers is a quoted string anywhere else in the file',
  Object.keys(CARDS).map((k) => CARDS[k].card).filter(quoted), []);

check('the feature is registered', api.FEATURES.some((f) => f.name === 'relickers'), true);
check('the feature has its own badge class and dataset flag, unique in the file',
  [api.RELICKER_CLASS, api.RELICKER_BRANCH_CLASS].map((c) => src.split('\'' + c + '\'').length - 1), [1, 1]);

console.log(failures ? '\n' + failures + ' FAILED' : '\nall good');
process.exit(failures ? 1 : 0);
