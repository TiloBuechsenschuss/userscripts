// Test for FallenLondon/choice-helper.js's reader of the Agents tab (/agents).
//
//   node tests/fl-agents-tab.test.mjs
//
// What is worth pinning:
//
//  - readAgents against the REAL markup: the fixture below is the capture of
//    2026-10-21 (okf/fallen-london/agents-tab.md), trimmed only of the
//    choice-helper badge flags, the react-select internals and ten of the
//    twelve repeated equipment slots per agent. A tiny HTML parser turns it
//    into nodes, so the selectors run against the shape the game draws.
//  - The two kinds of agent (out on a plot, at home), the plot and its
//    progress, the "Active Plots" count as the sign the list is drawn, and the
//    "Show:" filter making an absent agent prove nothing.
//  - Banking: a reading survives in the cache; a failed read is banked beside
//    it, never over it, and is retried only after an hour.
//  - The Hallowmas upgrade that is an Agent (the Parisian Infiltrator):
//    done when the tab lists it, ready outright only when the tab was read
//    unfiltered, conditional otherwise.

import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const here = dirname(fileURLToPath(import.meta.url));
const src = readFileSync(join(here, '..', 'FallenLondon', 'choice-helper.js'), 'utf8');

// --- a tiny HTML parser ---------------------------------------------------------
//
// Enough of the DOM for the reader: elements, text, attributes, className,
// textContent, and querySelector(All) for tag / #id / .class / [attr*="v"]
// compounds, descendant chains and comma lists.

const VOID = new Set(['img', 'input', 'hr', 'br', 'meta', 'link']);

function makeNode(tag, attrs) {
  const node = {
    nodeType: 1, tagName: tag.toUpperCase(), attributes: attrs, childNodes: [], parentNode: null,
    get className() { return attrs.class || ''; },
    get id() { return attrs.id || ''; },
    get textContent() { return this.childNodes.map((c) => (c.nodeType === 3 ? c.nodeValue : c.textContent)).join(''); },
    getAttribute(n) { return Object.prototype.hasOwnProperty.call(attrs, n) ? attrs[n] : null; },
    querySelectorAll(sel) { return queryAll(this, sel); },
    querySelector(sel) { return queryAll(this, sel)[0] || null; },
  };
  node.classList = { contains: (c) => node.className.split(/\s+/).includes(c) };
  return node;
}

function parseHtml(html) {
  const root = makeNode('#root', {});
  let at = root;
  const re = /<!--[\s\S]*?-->|<\/([a-zA-Z0-9]+)\s*>|<([a-zA-Z0-9]+)((?:\s+[^\s=>/]+(?:\s*=\s*(?:"[^"]*"|'[^']*'|[^\s>]+))?)*)\s*(\/?)>|([^<]+)/g;
  let m;
  while ((m = re.exec(html))) {
    if (m[1]) {
      let n = at;
      while (n && n.tagName !== m[1].toUpperCase()) n = n.parentNode;
      if (n && n.parentNode) at = n.parentNode;
    } else if (m[2]) {
      const attrs = {};
      const ar = /([^\s=>/]+)(?:\s*=\s*("([^"]*)"|'([^']*)'|[^\s>]+))?/g;
      let a;
      while ((a = ar.exec(m[3] || ''))) {
        attrs[a[1]] = (a[3] != null ? a[3] : a[4] != null ? a[4] : a[2] || '').replace(/&quot;/g, '"').replace(/&amp;/g, '&');
      }
      const el = makeNode(m[2].toLowerCase(), attrs);
      el.parentNode = at;
      at.childNodes.push(el);
      if (!VOID.has(m[2].toLowerCase()) && !m[4]) at = el;
    } else if (m[5]) {
      at.childNodes.push({ nodeType: 3, nodeValue: m[5].replace(/&amp;/g, '&'), parentNode: at });
    }
  }
  return root;
}

function matches(el, compound) {
  const parts = compound.match(/^[a-z0-9]+|#[\w-]+|\.[\w-]+|\[[^\]]+\]/gi) || [];
  return parts.every((p) => {
    if (p[0] === '#') return el.id === p.slice(1);
    if (p[0] === '.') return el.classList.contains(p.slice(1));
    if (p[0] === '[') {
      const a = /^\[([\w-]+)\*="([^"]*)"\]$/.exec(p);
      if (!a) throw new Error('unsupported selector ' + p);
      return String(el.getAttribute(a[1]) || '').includes(a[2]);
    }
    return el.tagName === p.toUpperCase();
  });
}

function queryAll(scope, selector) {
  const chains = selector.split(',').map((s) => s.trim().split(/\s+/));
  const out = [];
  (function walk(node) {
    for (const c of node.childNodes) {
      if (c.nodeType !== 1) continue;
      if (chains.some((chain) => {
        if (!matches(c, chain[chain.length - 1])) return false;
        // Ancestors right up to the root, as a real querySelector does.
        let i = chain.length - 2;
        for (let p = c.parentNode; p && i >= 0; p = p.parentNode) if (matches(p, chain[i])) i--;
        return i < 0;
      })) out.push(c);
      walk(c);
    }
  })(scope);
  return out;
}

// --- the capture, trimmed ----------------------------------------------------------

const SLOT = (s) => '<div class="agent-inventory-item--locked"><div class="icon icon--emphasize"><div aria-label="" '
  + 'tabindex="0" role="button"><img alt="" aria-label="" class="cursor-default" src="//images.fallenlondon.com/icons/'
  + s + '_slotsmall.png"></div></div><img alt="Locked" src="/img/icons/ico_slot_locked.png" class="agent-inventory-item--lock"></div>';
const FREE_SLOT = (s) => '<div class=""><div class="icon icon--emphasize icon--available-item"><div aria-label="" '
  + 'tabindex="0" role="button"><img alt="" aria-label="" class="equipped-group__available-item" '
  + 'src="//images.fallenlondon.com/icons/' + s + '_slotsmall.png"></div></div></div>';

function capture({ filter = 'All', plots = '1/3 Active Plots', wiki = false } = {}) {
  return '<div><span><div id="agents"><div class="agents-header"><h1 class="heading heading--1 heading--close">Agents</h1>'
    + (plots ? '<span class="heading heading--3 heading--close">' + plots + '</span>' : '') + '</div><hr>'
    + '<div class="agent-filter-group"><span class="agent-filter-label">Show:</span><div class="css-13ab8kc-container">'
    + '<div class="css-f92gjm-control"><div class="css-hlgwow"><div class="css-gj4dr3-singleValue">' + filter + '</div>'
    + '<input id="react-select-5-input" tabindex="0" inputmode="none" role="combobox" aria-readonly="true" '
    + 'class="css-1hac4vs-dummyInput" value=""></div></div></div></div>'
    + '<div class="working-agent"><div class="agent-header-row"><div class="agent-assigned"><span class="heading heading--2 '
    + 'heading--close agent-header">Nectared Proprietor</span></div></div><div class="plot__result"><div class="media__left">'
    + '<img alt="Nectared Proprietor" aria-label="Nectared Proprietor" class="agent-portrait" '
    + 'src="//images.fallenlondon.com/icons/agent1.png"></div><div class="plot-container media--message"><div class="plot__image">'
    + '<div class="small-card storylet__card" role="button" tabindex="-1"><div class="small-card__border" style="background-image: '
    + 'url(&quot;https://images.fallenlondon.com/cards/Card-silver.png&quot;); background-size: cover;"><img alt="An Expedition '
    + 'through the Briars of Dream" aria-label="An Expedition through the Briars of Dream" class="cursor-default media__object '
    + 'small-card__image" src="//images.fallenlondon.com/icons/parabola.png"></div></div></div><div class="plot__body"><div>'
    + '<h2 class="media__heading heading heading--3 branch__title">An Expedition through the Briars of Dream'
    + (wiki ? '<a class="fl-wiki-link" href="#">W</a>' : '') + '</h2><p><p>Along the ever-changing paths of the Is-Not, much '
    + 'can be found that would advantage you. </p><p><span class="descriptive">When completing this plot, you can spend '
    + 'additional Preparations to undertake harder checks for an increased reward.</span></p></p></div></div></div></div>'
    + '<div><div class="progress-bar"><span class="progress-bar__stripe progress-bar__stripe--has-transition" '
    + 'style="width: 58.4%;"></span></div><div class="working-agent-elapsed-actions">146/250: 104 actions before your agent '
    + 'returns</div></div><div class="working-agent-footer-row"><div class="agent-inventory">' + SLOT('hat') + SLOT('crew')
    + '</div><div class="agent-footer-buttons"><button class="agent-unassign-button" type="button">Abandon Plot</button></div>'
    + '</div></div>'
    + '<div class="free-agent"><div class="agent-header-row"><h2 class="heading heading--2 agent-header">Mild-Mannered Mondaine'
    + '</h2></div><div class="agent-body-row"><div class="agent-summary"><div class="media__left"><img alt="Mild-Mannered '
    + 'Mondaine" aria-label="Mild-Mannered Mondaine" class="agent-portrait" src="//images.fallenlondon.com/icons/'
    + 'accompliceesoteric.png"></div><div><span>A ruthless operator with a tinkling laugh. A wolf in society clothing.</span>'
    + '<div><strong class="agent-stat-bonus">Shadowy +50, Persuasive +50, Human +1, Intelligencier +1</strong></div></div></div>'
    + '<div class="agent-details"><div class="agent-stat-container"><div tabindex="0" role="button" class="agent-stat-wrapper">'
    + '<div class="agent-stat"><img class="cursor-default" src="//images.fallenlondon.com/icons/catsmall.png"><span '
    + 'class="agent-stat-level">50</span></div></div></div><hr><div class="free-agent-footer-row"><div class="agent-inventory">'
    + FREE_SLOT('hat') + FREE_SLOT('crew') + '</div><div class="agent-footer-buttons"><button class="agent-assign-button" '
    + 'type="button">Unequip</button> <button class="agent-assign-button" type="button">Assign</button></div></div></div></div>'
    + '</div></div></span></div>';
}

// --- the harness -------------------------------------------------------------------

let live = null; // the document the script sees as the page, or null for "some other tab"
const body = makeNode('body', {});
body.appendChild = function (c) { c.parentNode = this; this.childNodes.push(c); return c; };
const fakeDoc = {
  body,
  querySelectorAll: (sel) => (live ? live.querySelectorAll(sel) : []),
  querySelector: (sel) => (live ? live.querySelector(sel) : null),
  getElementById: () => null,
  createElement: (tag) => {
    const el = makeNode(tag, {});
    el.style = {};
    el.dataset = {};
    el.setAttribute = (n, v) => { el.attributes[n] = String(v); };
    el.appendChild = (c) => { c.parentNode = el; el.childNodes.push(c); return c; };
    el.addEventListener = () => {};
    el.remove = () => {};
    return el;
  },
  createTextNode: (t) => ({ nodeType: 3, nodeValue: String(t) }),
  addEventListener() {},
};
class FakeObserver { observe() {} }
const store = new Map();
const fakeStorage = {
  getItem: (k) => (store.has(k) ? store.get(k) : null),
  setItem: (k, v) => { store.set(k, String(v)); },
  removeItem: (k) => { store.delete(k); },
};
const noTimer = () => 0;

const wrapped = src
  .replace('(function () {', 'globalThis.__flux = (function () {')
  .replace(/\}\)\(\);\s*$/,
    'return { readAgents, bankAgents, bankAgentsFailed, agentsState, captureAgents, AGENTS_KEY, AGENTS_RETRY_MS,'
    + ' FRESH_MS, hmUpgradeStatus, HM_SEASONS }; })();');
const fn = new Function(
  'document', 'MutationObserver', 'requestAnimationFrame', 'getComputedStyle', 'console',
  'localStorage', 'setInterval', 'setTimeout', 'clearInterval', 'clearTimeout',
  wrapped + '\nreturn globalThis.__flux;');
const api = fn(fakeDoc, FakeObserver, () => {}, () => ({ position: 'relative' }), console,
  fakeStorage, noTimer, noTimer, () => {}, () => {});

let failures = 0;
function check(label, got, expected) {
  const g = JSON.stringify(got);
  const e = JSON.stringify(expected);
  const ok = g === e;
  if (!ok) failures++;
  console.log((ok ? 'PASS' : 'FAIL'), '|', label);
  if (!ok) console.log('   expected:', e, '\n   got:     ', g);
}

// --- reading the tab -----------------------------------------------------------------

check('the capture reads as two agents: one out on a plot with its progress, one at home',
  api.readAgents(parseHtml(capture())),
  { agents: [
    { name: 'Nectared Proprietor', working: true, plot: 'An Expedition through the Briars of Dream',
      progress: [146, 250], left: 104 },
    { name: 'Mild-Mannered Mondaine', working: false, plot: null, progress: null, left: null },
  ], active: 1, slots: 3, filter: 'All', filtered: false });

check('the wiki-links "W" in the plot heading is not part of the plot name',
  api.readAgents(parseHtml(capture({ wiki: true }))).agents[0].plot, 'An Expedition through the Briars of Dream');

check('any filter but All marks the list as possibly incomplete',
  ['Working', 'Free'].map((f) => api.readAgents(parseHtml(capture({ filter: f }))).filtered), [true, true]);

check('a header with no Active Plots count is a list not drawn yet, and no #agents is another tab',
  [api.readAgents(parseHtml(capture({ plots: null }))), api.readAgents(parseHtml('<div id="main"></div>'))],
  [null, null]);

// --- banking -------------------------------------------------------------------------

check('never read: no state at all',
  api.agentsState(), null);

live = parseHtml(capture());
api.captureAgents();
check('on the tab itself the state is live, and capturing banks it',
  [api.agentsState().live, JSON.parse(store.get(api.AGENTS_KEY)).agents.map((a) => a.name)],
  [true, ['Nectared Proprietor', 'Mild-Mannered Mondaine']]);

live = null;
check('off the tab the banked reading is used, fresh for a minute',
  (() => { const s = api.agentsState(); return [s.live, s.failed, s.stale, s.agents.length]; })(),
  [false, false, false, 2]);

const rec = JSON.parse(store.get(api.AGENTS_KEY));
rec.at = Date.now() - api.FRESH_MS - 1000;
store.set(api.AGENTS_KEY, JSON.stringify(rec));
check('a reading older than a minute is stale', api.agentsState().stale, true);

api.bankAgentsFailed();
check('a failed read keeps the last good agents, is marked failed, and is not retried for an hour',
  (() => { const s = api.agentsState(); return [s.failed, s.stale, s.agents.length]; })(), [true, false, 2]);

const rec2 = JSON.parse(store.get(api.AGENTS_KEY));
rec2.failedAt = Date.now() - api.AGENTS_RETRY_MS - 1000;
store.set(api.AGENTS_KEY, JSON.stringify(rec2));
check('an hour after a failure it is stale again', api.agentsState().stale, true);

// --- the Hallowmas upgrade that is an Agent ----------------------------------------------

const infiltrator = api.HM_SEASONS.find((s) => s.year === 2026).upgrades.find((u) => u.to === 'Parisian Infiltrator');
const ready = { live: false, at: 0, count: (n) => ({ 'Parisian Émigrée': 1, 'A Confession of Curiosity': 1,
  'A Confession of Guile': 1, 'A Confession of Pride': 1 })[n] || 0 };
const agentsOf = (names, extra) => Object.assign({ agents: names.map((name) => ({ name })), filter: 'All', filtered: false },
  extra);
check('the Infiltrator row is matched to the Agents tab by name',
  [infiltrator.agent, infiltrator.owned], ['Parisian Infiltrator', ['Morsel of Mignon']]);
check('listed on the tab: done; read unfiltered without it: ready outright',
  [api.hmUpgradeStatus(infiltrator, ready, null, agentsOf(['Parisian Infiltrator', 'Nectared Proprietor'])).text,
   api.hmUpgradeStatus(infiltrator, ready, null, agentsOf(['Nectared Proprietor'])).text],
  ['✓ have Parisian Infiltrator (locked)', '★ ready']);
check('filtered, failed or never read: ready only on a stated condition',
  [api.hmUpgradeStatus(infiltrator, ready, null, agentsOf([], { filter: 'Working', filtered: true })).text,
   api.hmUpgradeStatus(infiltrator, ready, null, agentsOf([], { failed: true })).text,
   api.hmUpgradeStatus(infiltrator, ready, null, null).text],
  ['★ ready if you have no Parisian Infiltrator yet (Agents tab filtered to Working) (not checked)',
   '★ ready if you have no Parisian Infiltrator yet (Agents tab not read) (not checked)',
   '★ ready if you have no Parisian Infiltrator yet (Agents tab not read) (not checked)']);
check('a held Morsel of Mignon (the no-Agents result) is done whatever the tab says',
  api.hmUpgradeStatus(infiltrator, { count: (n) => (n === 'Morsel of Mignon' ? 1 : 0) }, null, null).state, 'done');

console.log(failures ? '\n' + failures + ' FAILED' : '\nAll passed');
process.exit(failures ? 1 : 0);
