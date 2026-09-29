// Ad-hoc test for FallenLondon/choice-helper.js's Marrow badges ('the-marrow').
//
// There's no test runner in this repo (see AGENTS.md). Standalone Node script: evaluates the
// userscript's IIFE against a stub DOM and pulls out the internals.
//
// What's worth pinning here: 61 rows (33 that pay currencies, 2 items, 15 story steps, 11 forms);
// that the Tempestuous Tale figure is COMPUTED from the option page's quantities through the page's
// own formula and that the formula's weights agree with the guide's conversion table (the guide gives
// Dendritic Spark no Echo value, the one exception); that a story step is a label and never a number;
// the two figures where the page and the guide disagree (Crush them's least, Decipher the message
// as the best card); the ranges the page itself marks unsure; the wiring, keyed by the OPEN CARD, with
// the two wiki-only "(The Empty Corpse)" headings and the two storylet headings of the forms; that
// Consume what is not there is left to the Firmament feature; and that no name of ours is in another
// feature's table beyond the two ordinary phrases and the one card the Firmament table also names.
//
// Numbers come from the guide's card tables and 103 card, option and storylet pages on
// fallenlondon.wiki, and the Return to your mooring page's formula, fetched through the API on
// 2026-09-29 -- see docs/superpowers/research/2026-09-29-the-marrow-behind.md.
//
//   node tests/choice-the-marrow.test.mjs

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
    'return { MARROW_OPTIONS, MARROW_STORYLETS, MARROW_TALE, marrowSpec, marrowTales, marrowCardSpec, marrowRatings,'
    + ' MARROW_CLASS, MARROW_BRANCH_CLASS, normalizeName, BADGE_CLASS, FEATURES }; })();');
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

const rows = api.MARROW_OPTIONS;
const kind = (k) => rows.filter((e) => e.kind === k);
const find = (storylet, name) => rows.find((e) => e.storylet === storylet && e.name === name);
const spec = (storylet, name) => api.marrowSpec(find(storylet, name));
const badgeOf = (head, cls) => {
  for (let n = head.nextElementSibling; n && n.classList.contains(api.BADGE_CLASS); n = n.nextElementSibling) {
    if (n.classList.contains(cls)) return n;
  }
  return null;
};
const text = (head, cls) => { const b = badgeOf(head, cls); return b && b.textContent; };
function badgeText(cardTitle, optionTitle) {
  const head = makeHeading(optionTitle);
  branches = [head];
  roots = [makeHeading(cardTitle)];
  api.marrowRatings();
  const out = text(head, api.MARROW_BRANCH_CLASS);
  roots = []; branches = [];
  return out;
}
const tales = (storylet, name) => api.marrowTales(find(storylet, name));
const label = (h) => { roots = [h]; branches = []; api.marrowRatings(); roots = []; return text(h, api.MARROW_CLASS); };

// --- shape ------------------------------------------------------------------------------------------------------

check('61 rows: 33 that pay currencies, 17 story-ish, 11 forms',
  [rows.length, kind('tale').length, kind('story').length, kind('form').length], [61, 33, 17, 11]);
check('of the 17 story-ish rows, 2 are items that do not convert and 15 unlock something',
  [kind('story').filter((e) => e.items).length, kind('story').filter((e) => !e.items).length], [2, 15]);
check('no (card, option) pair is listed twice',
  rows.map((e) => api.normalizeName(e.storylet) + '|' + api.normalizeName(e.name)).filter((k, i, a) => a.indexOf(k) !== i), []);
check('every paying option quotes a range whose least is not above its most',
  kind('tale').filter((e) => Object.keys(e.g).some((k) => e.g[k][0] > e.g[k][1])).map((e) => e.name), []);
check('every currency an option pays is one the formula converts',
  kind('tale').flatMap((e) => Object.keys(e.g)).filter((k) => !(k in api.MARROW_TALE)), []);

// --- the formula, against the guide's conversion table ---------------------------------------------------------------

// The guide's table: Tempestuous Tales per unit, and its Echo value per unit.
const guide = { 'Caligin Scale': [5, 2.5], 'Mote of Intent': [5, 2.5], 'Ossified Hunger': [1, 0.5], 'Fragmentary Transgression': [1, 0.5],
  'Scrap of Tattered Void': [0.2, 0.1], 'Unlived Second': [0.02, 0.01], 'Dendritic Spark': [1, 0] };
check('the page\'s formula weights are the guide\'s Tale figures',
  Object.keys(guide).filter((k) => api.MARROW_TALE[k] !== guide[k][0]), []);
check('at half an Echo a Tale the weights reproduce the guide\'s Echo values, except Dendritic Spark (the guide lists it at 0)',
  Object.keys(guide).filter((k) => api.MARROW_TALE[k] * 0.5 !== guide[k][1]), ['Dendritic Spark']);
check('the guide\'s "guaranteed 2 Motes = 100 Stuivers = 5.0 Echoes" is 10 Tales',
  [tales('The Light that Hides Behind a Mask', 'Dare to look upon him'), spec('The Light that Hides Behind a Mask', 'Dare to look upon him').text],
  [[10, 10], 'TT 10']);

// --- the badge -----------------------------------------------------------------------------------------------------

check('a paying option says its Tales, computed: single figure, range, a decimal',
  [spec('A Silvered Self', 'Plummet through the depth of dreaming').text, spec('A Conclave of Bodies', 'Measure your kin').text,
    spec('A Conclave of Clients', 'Assert your right to know').text, spec('Kin-Killer', 'Finish the act').text],
  ['TT 8', 'TT 6–10', 'TT 8.3–9.8', 'TT 5.2–8.8']);
check('a range the page itself marks with a "?" carries the "?" in front, and only these three do',
  [rows.filter((e) => e.unsure).map((e) => e.name),
    spec('It Eats Worlds', 'Devour the condemned').text, spec('Star-Survivor', 'Reflect').text, spec('A Conclave of Duties', 'Judge the contract').text],
  [['Judge the contract', 'Devour the condemned', 'Reflect'], 'TT ?5.2–8.6', 'TT ?3.6–10.9', 'TT ?6–7']);
check('a stat check marks the success value with "?" after it',
  [spec('A Missive Connoting Dissolution', 'Decipher the Messenger').text, spec('The Lack', 'Banish doubts').text],
  ['TT 7–9?', 'TT 8?']);
check('what does not convert is named after the Tales',
  [spec('A Conclave of Duties', 'Scale yourself in moonlight').text, spec('A Stonebuilt Self', 'Construct yourself from prison bars').text,
    spec('The Light Around Which Dancers Dance', 'Dare to dance with the King').text],
  ['TT 7 · + Moonlit ×2, Moon-Pearl ×50', 'TT 5 · + Nodule of Warm Amber ×14–26', 'TT 5? · + Memory of Light ×3–4?']);
check('the tooltip gives the formula\'s figure and the guide\'s half-Echo rate as the guide\'s',
  (() => {
    const t = spec('A Missive Connoting Dissolution', 'Decipher the message').title;
    return ['10–14 Tempestuous Tales by the page’s formula', 'about 5–7 Echoes (its figure, not a page fact)'].map((s) => t.includes(s));
  })(),
  [true, true]);
check('every paying option\'s tooltip says where the Tales come from and that the Echo rate is the guide\'s',
  kind('tale').every((e) => api.marrowSpec(e).title.includes('Return to your mooring') && api.marrowSpec(e).title.includes('its figure, not a page fact')), true);

// --- where the page and the guide disagree ---------------------------------------------------------------------------

check('Crush them: the page\'s most matches the guide\'s 112 Stuivers (5.6 E), its least is 35 Scrap not 40 (3.5 E, not 4.0)',
  [tales('It Shatters Ships', 'Crush them').map((n) => Math.round(n * 10) / 10), spec('It Shatters Ships', 'Crush them').title.includes('the page says 35–56 and is followed')],
  [[7, 11.2], true]);
check('Decipher the message pays 10 to 14 Tales and says the guide calls a 10-Tale card the best; it is the only option whose LEAST is that high',
  [tales('A Missive Connoting Dissolution', 'Decipher the message'),
    spec('A Missive Connoting Dissolution', 'Decipher the message').title.includes('The guide calls Dare to look upon him'),
    kind('tale').filter((e) => api.marrowTales(e)[0] >= 10).map((e) => e.name)],
  [[10, 14], true, ['Dare to look upon him', 'Decipher the message']]);

// --- story steps and forms -----------------------------------------------------------------------------------------

check('a story step is a label, never a number: no "TT" on it, and every one says what it needs',
  kind('story').map((e) => [/TT/.test(api.marrowSpec(e).text), api.marrowSpec(e).title.includes('Needs: ')]).filter(([a, b]) => a || !b), []);
check('a story step with a stat check carries the "?" and the check in words; the one that cannot fail says so',
  [spec('The Oath', 'Follow her').text, spec('The Oath', 'Follow her').title.includes('Narrow Chthonosophy 50'),
    spec('A Missive Connoting Desperation', 'Consider your own diminishment').title.includes('you cannot fail it'),
    spec('A Missive Connoting Desperation', 'Consider your own diminishment').title.includes('Failure:')],
  ['story step: An Untenable Want?', true, true, false]);
check('a story step names the Estuaries requirement where the pages do',
  ['Follow her', 'Forget', 'Escape'].map((n) => rows.find((e) => e.name === n).needs.includes('Discovered: The Intuition of the Estuaries')),
  [true, true, true]);
check('the ten forms plus the end state: 11 corpses, all different, and the aspects group 3 / 3 / 3 / 2',
  [new Set(kind('form').map((e) => e.corpse)).size,
    ['enormity', 'conductivity', 'permeability', 'every fibre'].map((a) => kind('form').filter((e) => api.marrowSpec(e).text.endsWith('strains ' + a)).length)],
  [11, [3, 3, 3, 2]]);
check('a form says where it leads and what it strains; a gated one says what it needs',
  [spec('The Skeleton of the Sky', 'Unfold yourself').text, spec('The Skeleton of the Sky', 'Embody everything the bones desire').text,
    spec('The Skeleton of the Sky', 'Reflect current').title.includes('Needs: An Unwatchable Sight'),
    spec('The Skeleton of the Sky', 'Become insubstantial').title.includes('Needs: An Unthinkable Thought'),
    spec('The Skeleton of the Sky', 'Unfold yourself').title.includes('exactly three moves')],
  ['→ The Myrmidon’s Corpse · strains enormity', '→ The Corpse in Conclave · strains every fibre', true, true, true]);

// --- wiring: the card is the gate and the key ------------------------------------------------------------------------

check('an option is badged while its own card is open', badgeText('The Light that Hides Behind a Mask', 'Dare to look upon him'), 'TT 10');
check('an ordinary phrase is badged under its own card only (Forget, Escape, Follow her, Negotiate)',
  [badgeText('The Shame of the Fugue', 'Forget'), badgeText('The Cage in Crimson', 'Forget'),
    badgeText('The Cage in Crimson', 'Escape'), badgeText('The Oath', 'Escape'),
    badgeText('The Oath', 'Follow her'), badgeText('It Shatters Ships', 'Negotiate'), badgeText('The Oath', 'Negotiate')],
  ['story step: The Comfort of Knowing Naught But Hunger', null, 'story step: Blood in the Skies', null,
    'story step: An Untenable Want?', 'story step: A Scar in the Skull?', null]);
check('the wiki\'s "(The Empty Corpse)" headings and the game\'s plain ones both gate The Hunger and The Oath',
  [badgeText('The Hunger (The Empty Corpse)', 'Introspect'), badgeText('The Hunger', 'Introspect'),
    badgeText('The Oath (The Empty Corpse)', 'Bask in the shadow of your image'), badgeText('The Oath', 'Bask in the shadow of your image')],
  ['TT 5–10', 'TT 5–10', 'TT 6–7', 'TT 6–7']);
check('the forms are badged under either storylet heading',
  ['The Skeleton of the Sky', 'Entering the Skeleton of the Sky'].map((h) => badgeText(h, 'Conduct charge')),
  ['→ The Devourer’s Corpse · strains conductivity', '→ The Devourer’s Corpse · strains conductivity']);
check('the straight apostrophe of the game matches the curly one of the table, in a card heading',
  [badgeText('Between the Sky\'s Roots', 'Bathe in peace'), badgeText('Between the Stars\' Kingdoms', 'Direct your endless stare')],
  ['TT 7–8', 'TT 6–7.6']);
check('Consume what is not there is not this feature\'s: it is a row of the Firmament guide feature, so this one leaves it alone',
  [badgeText('It Eats Worlds', 'Consume what is not there'), badgeText('It Eats Worlds', 'Devour the condemned')],
  [null, 'TT ?5.2–8.6']);
check('nothing is badged while some other storylet is open', badgeText('Some Other Storylet', 'Dare to look upon him'), null);
check('every row is reachable through the wiring, not only through its spec',
  rows.filter((e) => badgeText(e.storylet, e.name) === null).map((e) => e.name), []);
check('an open card\'s heading is labelled with its options; the form storylet says it is a choice of forms',
  [label(makeHeading('The Lack')), label(makeHeading('The Skeleton of the Sky')),
    api.marrowCardSpec(api.normalizeName('The Lack')).title.includes('Banish doubts: TT 8?')],
  ['The Marrow: 2 options', 'Choose a form', true]);
check('a heading that is not one of ours gets no label', label(makeHeading('An Unrelated Storylet')), null);
check('colour is never the only carrier: every text says what it means without it', rows.every((e) => api.marrowSpec(e).text.length > 3), true);

// --- no name of ours is in another feature's table ---------------------------------------------------------------

const START = '// === feature: The Marrow Behind';
const END = '// === feature registry';
const a = src.indexOf(START);
const b = src.indexOf(END);
const outside = src.slice(0, a) + src.slice(b);
const quoted = (name) => [name, name.replace(/’/g, '\'')].some((n) => outside.includes('\'' + n.replace(/'/g, '\\\'') + '\'')
  || outside.includes('"' + n + '"'));
check('the only option names of ours quoted elsewhere are the two ordinary phrases Follow her and Escape (other storylets)',
  rows.map((e) => e.name).filter(quoted), ['Follow her', 'Escape']);
check('the only card of ours another table also names is It Eats Worlds (the Firmament feature\'s Consume what is not there)',
  api.MARROW_STORYLETS.filter(quoted), ['It Eats Worlds']);
check('the two storylets those ordinary phrases are filed under are quoted nowhere else',
  ['The Oath', 'The Cage in Crimson'].filter(quoted), []);

check('the feature is registered', api.FEATURES.some((f) => f.name === 'the-marrow'), true);
check('the feature has its own badge class and dataset flag, unique in the file',
  [api.MARROW_CLASS, api.MARROW_BRANCH_CLASS].map((c) => src.split('\'' + c + '\'').length - 1), [1, 1]);

console.log(failures ? '\n' + failures + ' FAILED' : '\nall good');
process.exit(failures ? 1 : 0);
