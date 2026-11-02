// Ad-hoc test for FallenLondon/choice-helper.js's region and peril line on the
// Unterzee map. Standalone Node script, as everywhere in this repo (see
// AGENTS.md): it evaluates the IIFE against a stub DOM.
//
// What's worth pinning:
//  - Every destination label in the captured map says the right thing. The region
//    is in no markup, so a typo here sends a captain to the wrong water.
//  - A destination is told by its class, never by its cursor. The map you only
//    look at gives every label `cursor: grab` and --landmark, and the first version
//    of this feature gated on `cursor: pointer` and drew nothing there. The Cumaean
//    Canal and Station III are not destinations in either mode.
//  - Nothing is claimed for a name not in the tables, or for a port in several
//    regions.
//  - Re-running writes nothing, or the MutationObserver would redraw forever.
//  - Only the Unterzee map is queried, and switching the feature off cleans up.
//
//   node tests/choice-zee-map-regions.test.mjs

import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const here = dirname(fileURLToPath(import.meta.url));
const src = readFileSync(join(here, '..', 'FallenLondon', 'choice-helper.js'), 'utf8');

// --- stub DOM --------------------------------------------------------------

let textWrites = 0;
function makeEl(tag) {
  let text = '';
  const el = {
    tagName: (tag || 'span').toUpperCase(),
    nodeType: 1,
    className: '',
    style: { cssText: '' },
    dataset: {},
    childNodes: [],
    children: [],
    parentNode: null,
    get textContent() { return text; },
    set textContent(v) { textWrites++; text = String(v); },
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
    addEventListener() {},
    querySelector(sel) {
      const cls = sel.replace(/^\./, '');
      return this.children.find((c) => String(c.className).split(/\s+/).includes(cls)) || null;
    },
    querySelectorAll: () => [],
  };
  el.classList = { contains: (c) => String(el.className).split(/\s+/).includes(c) };
  return el;
}

let labels = [];
const fakeDoc = {
  body: makeEl('body'),
  querySelectorAll(sel) {
    if (sel.endsWith('.leaflet-tooltip--fbg__name > div')) return labels;
    if (sel === '.fl-zee-map-region') {
      return labels.map((l) => l.parentNode.querySelector(sel)).filter(Boolean);
    }
    return [];
  },
  querySelector: () => null,
  getElementById: () => null,
  createElement: (tag) => makeEl(tag),
  createTextNode: (t) => ({ nodeType: 3, nodeValue: String(t) }),
  addEventListener() {},
};
class FakeObserver { observe() {} }

const wrapped = src
  .replace('(function () {', 'globalThis.__flux = (function () {')
  .replace(/\}\)\(\);\s*$/,
    'return { ZEE_MAP_DISTRICTS, ZEE_MAP_LABEL, ZEE_REGIONS, ZEE_PORTS, FEATURES, FEATURE_GROUPS,'
    + ' zeeMapRegion, zeeMapLine, zeeMapRegions, zeeMapRegionsOff }; })();');
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

// Class lists and cursors as captured. `kinds` are the --suffixes on the host.
const NAME = 'leaflet-tooltip--fbg__name';
function label(text, kinds = ['district', 'island'], cursor = 'pointer') {
  const host = makeEl('div');
  host.className = [NAME].concat(kinds.map((k) => NAME + '--' + k)).join(' ');
  const el = makeEl('div');
  el.textContent = text;
  el.style.cursor = cursor;
  host.appendChild(el);
  return el;
}
const lineOf = (el) => el.parentNode.querySelector('.fl-zee-map-region');

// --- the table -------------------------------------------------------------

// Every destination label in the map captures, with what the region wheel on
// Zailing (Guide) says, and Abbey Rock, whose label has not been captured because
// its unlock was unmet.
const EXPECTED = {
  "Hunter's Keep": 'Home Waters · 100',
  'Mutton Island': 'Home Waters · 100',
  'Bullbone Island': 'Home Waters · 100',
  London: 'Home Waters · 100',
  'The Iron Republic': "Shepherd's Wash · 110",
  'The Elder Continent': "Shepherd's Wash · 110",
  Godfall: "Shepherd's Wash · 110",
  'Abbey Rock': "Shepherd's Wash · 110",
  'Corpsecage Island': 'Stormbones · 110',
  'The Tomb Colonies': 'Stormbones · 110',
  'The Principles of Coral': 'Stormbones · 110',
  "Void's Approach": 'Stormbones · 110',
  'Grunting Fen': 'The Sea of Voices · 150',
  Polythreme: 'The Sea of Voices · 150',
  'Mangrove College': 'The Sea of Voices · 150',
  'The Khanate': 'The Salt Steppe · 200',
  Irem: 'The Pillared Sea · 210',
  "The Corsair's Forest": 'The Snares · 250',
};
for (const [name, line] of Object.entries(EXPECTED)) {
  check('the line on ' + name, api.zeeMapLine(name), line);
}

check('every district names a region that has a peril',
  Object.entries(api.ZEE_MAP_DISTRICTS).filter(([, r]) => !api.ZEE_REGIONS.some((z) => z.name === r)), []);
check('the hunting grounds on the wheel take their region from ZEE_PORTS',
  [api.zeeMapLine('Feral Crocodile Hunting Grounds'), api.zeeMapLine('Plated Seal Spawning Grounds')],
  ['Home Waters · 100', 'Stormbones · 110']);
check('a port in several regions claims none of them',
  api.zeeMapLine('Lifeberg Hunting Grounds'), null);
check('an unknown name claims nothing', api.zeeMapLine('Somewhere New'), null);
check('an empty name claims nothing', api.zeeMapLine(''), null);

// --- drawing ---------------------------------------------------------------

const irem = label('Irem');
const canal = label('The Cumaean Canal', ['landmark', 'island', 'visitable-island'], 'grab');
const station = label('Station III', ['landmark', 'island'], 'grab');
const unknown = label('Somewhere New');
labels = [irem, canal, station, unknown];
api.zeeMapRegions();

check('a destination label gets its line', lineOf(irem).textContent, 'The Pillared Sea · 210');
check('the line is a span, so the label selector can never take it for a label',
  lineOf(irem).tagName, 'SPAN');
check('the line ignores clicks', lineOf(irem).style.cssText.includes('pointer-events: none'), true);
check('the line does not inherit a district label\'s capitals',
  lineOf(irem).style.cssText.includes('text-transform: none'), true);
check('the line is behind the name React owns',
  irem.parentNode.children.map((c) => c.tagName), ['DIV', 'SPAN']);
check('a landmark gets no line', [lineOf(canal), lineOf(station)], [null, null]);
const landmarkOnly = label('Irem', ['landmark', 'island'], 'grab');
labels = [landmarkOnly];
api.zeeMapRegions();
check('a known name that is only a landmark gets no line either', lineOf(landmarkOnly), null);

// The map opened just to look: temp capture at Hunter's Keep. Nothing is clickable.
const viewDistrict = label('London', ['district', 'landmark', 'island', 'visitable-island'], 'grab');
const viewDestination = label("Hunter's Keep", ['destination', 'landmark', 'island', 'visitable-island'], 'grab');
const viewLocked = label('Irem', ['district', 'landmark', 'island'], 'grab');
labels = [viewDistrict, viewDestination, viewLocked];
api.zeeMapRegions();
check('the map you only look at gets its lines too',
  [lineOf(viewDistrict).textContent, lineOf(viewDestination).textContent, lineOf(viewLocked).textContent],
  ['Home Waters · 100', 'Home Waters · 100', 'The Pillared Sea · 210']);
labels = [irem, canal, station, unknown];
check('a destination with no known region gets no line', lineOf(unknown), null);

textWrites = 0;
api.zeeMapRegions();
api.zeeMapRegions();
check('re-running writes nothing', textWrites, 0);
check('re-running adds nothing', irem.parentNode.children.length, 2);

// React recycling the node for another destination.
irem.textContent = 'Godfall';
api.zeeMapRegions();
check('a recycled label is rewritten, not doubled',
  [lineOf(irem).textContent, irem.parentNode.children.length], ["Shepherd's Wash · 110", 2]);
irem.textContent = 'Somewhere New';
api.zeeMapRegions();
check('a recycled label with nothing to say loses its line', lineOf(irem), null);

// --- scope and switch ------------------------------------------------------

check('the selector is the Unterzee map only',
  api.ZEE_MAP_LABEL.startsWith('.leaflet-container--unterzee '), true);

const godfall = label('Godfall');
labels = [godfall];
api.zeeMapRegions();
const feature = api.FEATURES.find((f) => f.name === 'zee-map-regions');
check('the feature is filed under Zailing', api.FEATURE_GROUPS.Zailing.includes('zee-map-regions'), true);
check('the feature has an off', typeof feature.off, 'function');
feature.off();
check('switching off removes the line', [lineOf(godfall), godfall.parentNode.children.length], [null, 1]);

console.log(failures ? '\n' + failures + ' FAILURE(S)' : '\nAll checks passed.');
process.exit(failures ? 1 : 0);
