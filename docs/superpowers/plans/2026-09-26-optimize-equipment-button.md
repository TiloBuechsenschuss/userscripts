# "Optimize equipment" button Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Next to every Fallen London action that has challenges, show an "Optimize equipment" button. Clicking it equips the outfit that gives the best chance of passing the action, then shows what changed and how to undo it.

**Architecture:** A new `equipment-optimizer` feature in `FallenLondon/ux-enhancers.js`, in four layers. (1) A DOM-free core: chance formulas, challenge inference and an exact optimizer. (2) A small client for the game's own API (`api.fallenlondon.com`), which reads your levels, gear and the open storylet and equips items. (3) An applier that equips slot by slot, checks each reply, and reloads the page so the game redraws. (4) The button and a result line. All of the API facts below come from a real capture (2026-09-26, `temp/capure-results/`); nothing is guessed.

**Tech Stack:** Vanilla ES2017 userscript (no build), `h()` DOM helper, `fetch` with the game's own bearer token, Node standalone `tests/*.test.mjs` scripts.

**Spec:** `TODO.md` line 4 ("Optimize equipment button") and the request: *"Next to any action that has challenges, there should be a button 'optimize equipment'. Clicking that optimizes the chances for the challenge."*

## Global Constraints

- **No git-tree changes.** Never commit, stage, stash or branch (memory: never-modify-git-tree). The plan has no commit steps on purpose.
- Bump `@version` in `ux-enhancers.js` (3.3 → 3.4). Keep `@downloadURL` untouched. Add an `equipment-optimizer` section to `AGENTS.md` next to `equipment-helper`.
- **Touch first.** Buttons are real `<button type="button">` of at least 44 px height. No hover-only information; the result is visible text (memory: plays-fallen-london-on-mobile).
- **Colour is never the only carrier** (memory: red-green-weak). A change reads `▲ +40` / `▼ −5` / `=` with the words "better" / "worse" / "same"; any colour is blue/yellow.
- **The token.** The game's bearer token is read from `localStorage.access_token` and sent only to `https://api.fallenlondon.com`, exactly as the game does. It is never logged, stored elsewhere, put in a message or sent anywhere else.
- **API etiquette.** Only the game's own endpoints listed below, sequentially, no polling, one run at a time. Never call anything that spends an action or picks a branch.
- The button never starts a branch, never spends an action and never touches a slot the game marks `canChange: false`.
- Every failure leaves the outfit in a known state and says so. A half-applied outfit is reported with an Undo.
- After the author's in-game test only: `TODO.md` "Done" entry plus a note in the feature comment (memory: marking-work-tested).
- Persisted prose (comments, AGENTS.md) is normal English.

## What the capture established (verified against real data)

**Endpoints** (all on `https://api.fallenlondon.com`, header `Authorization: Bearer <token>`; the `GET /api/outfit` probe confirmed the header works):

| Call | Returns / does |
|---|---|
| `GET /api/character/myself` (~350 KB) | `possessions[]` groups → `possessions[]`. Each stat has `level` (base) and `effectiveLevel`. Each item has `id`, `name`, `category`, `equippable`, and `enhancements: [{ qualityName, qualityId, level }]` (its stat bonuses). `character.outfits` lists saved outfits; `character.canChangeOutfit`. |
| `GET /api/outfit` | `slots: [{ name, qualityId?, canChange, isEffect }]`. `qualityId` is the item worn now; absent = empty. **This is the only place the worn item is listed.** |
| `POST /api/storylet` (no body) | The current storylet: `phase`, `canChangeOutfit`, `storylet.childBranches[]` each with `id`, `name`, `challenges[]`, `qualityRequirements[]`, `isLocked`. Read-only: the game calls it itself after every navigation. |
| `POST /api/outfit/equip` `{"qualityId": <item id>}` | Equips that item in its slot, replacing what was there. Returns the new `slots[]` and `isSuccess`. |
| `POST /api/outfit/change` `{"outfitId": n}` | Switches to a saved outfit (not used in v1). |

**Challenge JSON** (`challenges[]`): `name` (the stat, e.g. `Persuasive`), `targetNumber`, `category` (`BasicAbility` or `Skills`), `bonuses: []`, `secondChanceId`. **`targetNumber` is the percentage chance the game shows, not a difficulty.** There is no difficulty and no broad/narrow field.

**Verified facts:**

1. `effectiveLevel − level` equals the sum of the worn items' `enhancements` for that stat: 20 of 20 comparisons (4 outfit states × 5 stats). So `base = effectiveLevel − Σ bonuses of the worn items the optimizer controls`.
2. Real swap, Iron Hat (304: Dangerous +5, Persuasive −1) → Beguiling Mask (310: Dangerous −1, Persuasive +6): Dangerous 189→183, Persuasive 263→270, exactly the item bonuses.
3. **Broad vs narrow.** `BasicAbility` challenges behave as **broad** (chance ∝ level): Persuasive 270→200 took 90%→66%, the model gives 66.7. `Skills` challenges behave as **narrow** (+10 points per level): Mithridacy 1→3 took 60%→80% and 20%→40%, the model gives 80 and 40. A `BasicAbility` at 100% and a narrow at 60% are both consistent with it.
4. **The game shows the floor of the true chance** (66.7 → 66, 88.7 → 88, 79.8 → 79). Compare with a tolerance of 1 point.
5. **10% floor:** Mithridacy at 10% stayed 10% after +2 levels, where narrow would give 30%. A challenge shown at 10% hides its headroom; it is treated as fixed.
6. **A challenge at 100% hides its headroom too** (Shadowy 151 → 138 dropped to 92%, but the difficulty was unknowable from 100%). It is treated as fixed at 100% and its stat is held at its current level.
7. Slots and items: 21 slots (14 changeable equipment slots), all single-item. Every equippable item's `category` is its slot name with spaces removed (`Home Comfort` → `HomeComfort`), except slot `Spouse` ↔ category `ConstantCompanion`. Slots with `canChange: false` (Destiny, Ship, Airship, Spouse, Club, Boon, Burden) are fixed. Four changeable slots were empty in the probe (Luggage, Treasure, ToolOfTheTrade, Crew).
8. Your E1 answers: the same storylet stays open after Possessions and back, and F5 reloads the same storylet with correct percentages. So **apply through the API, then reload the page.**
9. Equip by `qualityId` (the item's `id`), never by name (spares share names).

**Still unknown, and how the plan copes:**

| Unknown | Handling |
|---|---|
| Endpoint to **unequip** (empty a slot). Not captured. | v1 never fills an empty slot and never empties one. It says how many empty slots you have items for. Task 9 captures the call. |
| **Weighted challenges** (several stats added). No sample; the JSON shows `bonuses: []` on all 15 captured challenges. | If a challenge has a non-empty `bonuses`, the button says "This challenge combines stats, not supported yet". The post-apply check (Task 7) also catches a wrong model. |
| **Second chance** (`secondChanceId`): a spendable item gives a re-roll. | Ignored: the optimizer maximises the first-chance figure, which is monotone in the same direction. The result line notes it. |
| A **locked** action's requirement text. Only an *Unlocked* one was captured (`"You unlocked this with <span…>Airs of Industry</span> 42 <em>(you needed 30-70)</em>"`). | Requirements are only guarded when currently Unlocked: see Task 5. A locked action gets no unlocking help in v1. |
| `canChangeOutfit` **false** storylets. | The response has the flag; the button is disabled with the reason. |

## Model (Task 2 pins it)

- `broad`: `chance = 0.6 × level / difficulty`. `narrow`: `chance = 0.6 + 0.1 × (level − difficulty)`. Both clamped to **[0.10, 1.00]**. Matches the repo's own notes (broad certain at 5/3 of the difficulty, narrow 4 levels above).
- Difficulty is **derived**, not read: `broad: 0.6 × level / p`, `narrow: level − (p − 0.6) / 0.1`, with `p = targetNumber / 100` (for broad, `(targetNumber + 0.5) / 100` because the game floors).
- Kind: `BasicAbility` → broad; anything else → narrow; a percentage that is not a multiple of 10 is always broad (narrow moves in tens); a stat at level 0 cannot be broad.
- A challenge at ≤10% or 100% is **fixed** (its percentage is a constant). At 100% the optimizer also gets a requirement keeping that stat at or above its current level.
- Success = the product over all challenges (checked by the post-apply comparison, not assumed silently).
- Best outfit = highest success chance, then **fewest slots changed**. Exact, not a heuristic: tested against brute force.

## Review Focus

1. Everything already fixed/100% → "already the best outfit", nothing equipped, no reload.
2. Two challenges pulling gear opposite ways (a Persuasive hat vs a Mithridacy hat) → the product is maximised.
3. An item with a negative bonus on a challenge stat → never chosen when it hurts.
4. A currently-satisfied requirement on a gear-affected stat (`needed 30-70`) → never pushed out of range.
5. An equip reply with `isSuccess: false`, a slot that did not change, an HTTP 401/403/429/5xx, or offline → stop, report which slots did change, offer Undo. No retry loop.
6. React re-renders the branch → one button per branch; a result line only under the branch id it belongs to.
7. Second click while running, or a reload mid-run → ignored / resumes cleanly.
8. Spare items with the same name → equipped by `qualityId`.
9. Predicted vs shown percentages disagree by more than 1 point after the run → say so, do not claim success.
10. `canChangeOutfit: false`, a storylet that is not `phase: "In"`, or a token that is missing → the button explains and does nothing.

---

### Task 1: Captures and equip experiment — DONE

Results are recorded above ("What the capture established"). The fixtures below come from `temp/capure-results/` (`fl-capture-api.json`, `fl-capture-outfit.json`). Nothing else is needed from the user until Task 9.

---

### Task 2: Chance model, inference and optimizer (pure)

The optimizer below was prototyped and checked against a brute-force search on 600 random instances with negative bonuses, fixed challenges, weighted terms and lower/upper limits: 0 mismatches. The inference was checked against the real rows in fact 3.

**Files:**
- Modify: `FallenLondon/ux-enhancers.js`, new block `// === feature: equipment optimizer ===` after `equipmentHelper`, before `// === feature registry`.
- Create: `tests/ux-equipment-optimizer.test.mjs` (loads the script the way `tests/ux-equipment-helper.test.mjs` does).

**Interfaces:**
- Produces `challengeChance(kind, diff, level)` → 0.1..1.
- Produces `inferChallenge(ch, level)` → `{ kind, diff, terms }` | `{ fixed, hold? }` | `null` (unsupported). `ch` is one game `challenges[]` entry, `level` the stat's current effective level.
- Produces `successChance(challenges, S)` → product. `challenges` are `inferChallenge` results; `S` is `{ [stat]: level }`.
- Produces `optimizeOutfit(slots, base, challenges, requirements)` → `{ chance, changes, picks, levels } | null`. `slots: [{ name, items: [{ id, equipped, bonus }] }]` (exactly one item may be worn; the worn one is always among `items`), `base: { [stat]: level }`, `requirements: [{ stat, min?, max? }]`, `picks`: one item id per slot, in slot order. `null` only when no outfit meets the requirements.

- [ ] **Step 1: Write the failing tests.** Real data first (all from the capture):

```js
// challengeChance
check('narrow 60% at difficulty', challengeChance('narrow', 1, 1), 0.6);
check('narrow floor is 10%', challengeChance('narrow', 30, 0), 0.1);
check('narrow cap is 100%', challengeChance('narrow', 0, 9), 1);
check('broad 60% at difficulty', challengeChance('broad', 90, 90), 0.6);
check('broad certain at 5/3', challengeChance('broad', 90, 150), 1);

// inference, predicting the game's own numbers (the game floors its percentages)
const rows = [ // category, stat, level0, shown0, level1, shown1
  ['Skills', 'Mithridacy', 1, 60, 3, 80], ['Skills', 'Mithridacy', 1, 20, 3, 40],
  ['BasicAbility', 'Persuasive', 270, 90, 266, 88], ['BasicAbility', 'Persuasive', 270, 90, 200, 66],
  ['BasicAbility', 'Persuasive', 270, 81, 266, 79], ['BasicAbility', 'Persuasive', 270, 81, 200, 60],
];
for (const [category, name, s0, p0, s1, shown] of rows) {
  const c = inferChallenge({ category, name, targetNumber: p0, bonuses: [] }, s0);
  const predicted = Math.floor(challengeChance(c.kind, c.diff, s1) * 100);
  check(name + ' ' + s0 + '->' + s1, Math.abs(predicted - shown) <= 1, true);
}
check('10% is fixed', inferChallenge({ category: 'Skills', name: 'Mithridacy', targetNumber: 10, bonuses: [] }, 1),
  { fixed: 0.1 });
check('100% is fixed and holds the level', inferChallenge({ category: 'BasicAbility', name: 'Shadowy', targetNumber: 100, bonuses: [] }, 151),
  { fixed: 1, hold: { stat: 'shadowy', min: 151 } });
check('combined stats are unsupported', inferChallenge({ category: 'Skills', name: 'X', targetNumber: 50, bonuses: [{}] }, 5), null);

// The real swap: Iron Hat (304) -> Beguiling Mask (310).
const hat = { name: 'Hat', items: [
  { id: 304, equipped: true,  bonus: { dangerous: 5, persuasive: -1 } },
  { id: 310, equipped: false, bonus: { dangerous: -1, persuasive: 6 } },
] };
const persuasive = inferChallenge({ category: 'BasicAbility', name: 'Persuasive', targetNumber: 90, bonuses: [] }, 263);
const base = { persuasive: 263 - (-1) };           // effective minus the worn hat's bonus
check('picks the mask for a Persuasive challenge',
  optimizeOutfit([hat], base, [persuasive], []).picks, [310]);
check('effective level with the mask', optimizeOutfit([hat], base, [persuasive], []).levels.persuasive, 270);
check('a Dangerous challenge keeps the Iron Hat', optimizeOutfit([hat], { dangerous: 189 - 5 },
  [inferChallenge({ category: 'BasicAbility', name: 'Dangerous', targetNumber: 99, bonuses: [] }, 189)], []).picks, [304]);
```
plus: two challenges that pull opposite ways (product wins); a requirement `{ stat, min }` and `{ stat, max }` that forces the second-best hat; a fixed-100% challenge with its `hold` requirement stops the stat dropping; an impossible requirement returns `null`; **`changes` prefers keeping worn items on ties**; and the brute-force cross-check (seeded, 600 instances, one item per slot, bonuses −3..6, fixed challenges, weighted terms, min/max limits), expecting 0 mismatches. The exhaustive search is copied verbatim from the prototype (`test3.mjs`).

- [ ] **Step 2: Fail.** Run `node tests/ux-equipment-optimizer.test.mjs`. Expected: `challengeChance is not defined` (or the internals lookup is undefined).

- [ ] **Step 3: Implement.**

```js
  function challengeChance(kind, diff, level) {
    let p;
    if (kind === 'narrow') p = 0.6 + 0.1 * (level - diff);
    else p = diff > 0 ? 0.6 * level / diff : 1;
    return Math.min(1, Math.max(0.1, p));
  }

  // One game `challenges[]` entry -> the model. `targetNumber` is the chance
  // the game SHOWS (floored), not a difficulty; the difficulty is solved from
  // it and the level you have now. See the plan's facts 3-6.
  function inferChallenge(ch, level) {
    if (ch.bonuses && ch.bonuses.length) return null;
    const stat = normalizeName(ch.name);
    const shown = Number(ch.targetNumber);
    if (shown >= 100) return { fixed: 1, hold: { stat: stat, min: level } };
    if (shown <= 10) return { fixed: shown / 100 };
    const broad = (ch.category === 'BasicAbility' || shown % 10 !== 0) && level > 0;
    const p = (broad ? shown + 0.5 : shown) / 100;
    return {
      kind: broad ? 'broad' : 'narrow',
      diff: broad ? 0.6 * level / p : level - (p - 0.6) / 0.1,
      terms: [{ stat: stat, weight: 1 }],
    };
  }

  function successChance(challenges, S) {
    let p = 1;
    for (const c of challenges) {
      if (c.fixed != null) { p *= c.fixed; continue; }
      let level = 0;
      for (const t of c.terms) level += t.weight * (S[t.stat] || 0);
      p *= challengeChance(c.kind, c.diff, level);
    }
    return p;
  }

  // A state is dropped only when another has every level at least as high and
  // no more changes. A stat with an upper limit is compared for equality
  // instead: a higher level there is not "better", it may be out of range.
  function optDominates(a, b, exact) {
    if (a.changes > b.changes) return false;
    for (let i = 0; i < a.vec.length; i++) {
      if (exact[i] ? a.vec[i] !== b.vec[i] : a.vec[i] < b.vec[i]) return false;
    }
    return true;
  }

  function optPareto(list, exact) {
    list.sort(function (a, b) { return a.changes - b.changes; });
    const kept = [];
    for (const s of list) {
      if (!kept.some(function (k) { return optDominates(k, s, exact); })) kept.push(s);
    }
    return kept;
  }

  function optimizeOutfit(slots, base, challenges, requirements) {
    requirements = requirements || [];
    const stats = [];
    const note = function (s) { if (stats.indexOf(s) === -1) stats.push(s); };
    challenges.forEach(function (c) { (c.terms || []).forEach(function (t) { note(t.stat); }); });
    requirements.forEach(function (r) { note(r.stat); });
    const exact = stats.map(function (st) {
      return requirements.some(function (r) { return r.stat === st && r.max != null; });
    });
    let states = [{ vec: stats.map(function () { return 0; }), changes: 0, picks: [] }];
    for (const slot of slots) {
      const options = optPareto(slot.items.map(function (it) {
        return {
          vec: stats.map(function (st) { return it.bonus[st] || 0; }),
          changes: it.equipped ? 0 : 1,
          picks: it.id,
        };
      }), exact);
      const next = [];
      for (const s of states) {
        for (const o of options) {
          next.push({
            vec: s.vec.map(function (v, i) { return v + o.vec[i]; }),
            changes: s.changes + o.changes,
            picks: s.picks.concat([o.picks]),
          });
        }
      }
      states = optPareto(next, exact);
    }
    const levels = function (vec) {
      const S = {};
      stats.forEach(function (st, i) { S[st] = (base[st] || 0) + vec[i]; });
      return S;
    };
    let best = null;
    for (const s of states) {
      const S = levels(s.vec);
      const ok = requirements.every(function (r) {
        return S[r.stat] >= (r.min == null ? -Infinity : r.min)
          && S[r.stat] <= (r.max == null ? Infinity : r.max);
      });
      if (!ok) continue;
      const p = successChance(challenges, S);
      if (!best || p > best.chance + 1e-12
          || (Math.abs(p - best.chance) <= 1e-12 && s.changes < best.changes)) {
        best = { chance: p, changes: s.changes, picks: s.picks, levels: S };
      }
    }
    return best;
  }
```

- [ ] **Step 4: Pass.** Run `node tests/ux-equipment-optimizer.test.mjs && node --check FallenLondon/ux-enhancers.js`. Expected: all `PASS`, brute force `0 mismatches`.
- [ ] **Step 5: Size guard.** Test 12 slots × 10 items, two challenges, one requirement: must finish in under a second. If not, cap the state list at 20 000 by highest level sum and return `approx: true` (and test that flag). Do not add the cap if the timing passes.

---

### Task 3: The API client

**Files:** `FallenLondon/ux-enhancers.js` (same block), `tests/ux-equipment-optimizer.test.mjs`

**Interfaces:**
- Produces `flApi(method, path, body)` → `Promise<object>`; rejects with an `Error` whose `.kind` is `'auth' | 'http' | 'network'` and `.status`.
- Produces `flToken()` → the token string or `''`.

- [ ] **Step 1: Failing tests** with a stub `fetch` and `localStorage`: sends `Authorization: Bearer <token>` with the quotes stripped (the game stores it quoted or bare); no token → rejects with kind `auth` and does **not** call fetch; 401/403 → `auth`; 429/5xx → `http`; a thrown fetch → `network`; POST sends `Content-Type: application/json` and a JSON body; the token never appears in any error message.
- [ ] **Step 2: Fail**, then **Step 3: Implement.**

```js
  const FL_API = 'https://api.fallenlondon.com';

  function flToken() {
    try { return String(localStorage.getItem('access_token') || '').replace(/^"|"$/g, ''); }
    catch (e) { return ''; }
  }

  function flFail(kind, status, text) {
    const e = new Error(text);
    e.kind = kind;
    e.status = status || 0;
    return e;
  }

  function flApi(method, path, body) {
    const token = flToken();
    if (!token) return Promise.reject(flFail('auth', 0, 'Not signed in.'));
    const init = { method: method, headers: { Authorization: 'Bearer ' + token } };
    if (body !== undefined) {
      init.headers['Content-Type'] = 'application/json';
      init.body = JSON.stringify(body);
    }
    return fetch(FL_API + path, init).then(function (res) {
      if (res.status === 401 || res.status === 403) throw flFail('auth', res.status, 'The game refused the request (' + res.status + ').');
      if (!res.ok) throw flFail('http', res.status, 'The game answered ' + res.status + '.');
      return res.json();
    }, function () { throw flFail('network', 0, 'Could not reach the game.'); });
  }
```
- [ ] **Step 4: Pass.**

---

### Task 4: Read levels, gear and the open storylet

**Files:** `FallenLondon/ux-enhancers.js` (same block), `tests/ux-equipment-optimizer.test.mjs`

**Interfaces:**
- Consumes `flApi` (Task 3), `normalizeName` (existing).
- Produces `gearFrom(outfit, myself)` → `{ slots, fixedBonus, emptyWithItems }`. `slots: [{ name, items: [{ id, name, equipped, bonus }] }]` for every slot with `canChange && !isEffect` **and a worn item**. `emptyWithItems`: names of changeable empty slots that own equippable items (reported, not touched).
- Produces `levelOf(myself, stat)` → `effectiveLevel` of the non-equippable possession with that name, or `null`.
- Produces `baseFor(myself, slots, stat)` → `effectiveLevel − Σ bonus of the worn items in slots`.
- Produces `branchFrom(storylet, branchId)` → the `childBranches[]` entry or `null`; `storylet` is the `POST /api/storylet` reply.
- Produces `requirementsFor(branch, slots, myself)` → `[{ stat, min?, max? }]`.

- [ ] **Step 1: Failing tests** with small verbatim excerpts of the real replies (items 304/310/312 with their `enhancements`, five stat possessions with `level`/`effectiveLevel`, the outfit slots list from `fl-capture-outfit.json`, the `Reconcile newcomers…` branch JSON from the capture). Assertions: slot `Spouse` maps to category `ConstantCompanion`; `Home Comfort` to `HomeComfort`; `canChange: false` slots and `isEffect` slots are excluded; the worn item is `equipped: true` and always present; an unknown worn id (item missing from `possessions`) drops that slot instead of throwing; `baseFor` reproduces the capture (Persuasive base = 263 − (−1) with the Iron Hat worn); `requirementsFor` on the real `Airs of Industry 42 (you needed 30-70)` requirement returns nothing (no gear touches Airs) while a synthetic Unlocked requirement on Shadowy `(you needed 30-70)` returns `{ stat: 'shadowy', min: 30, max: 70 }` and one whose tooltip has no range returns `{ min: level, max: level }`; Locked requirements are ignored.
- [ ] **Step 2: Fail**, then **Step 3: Implement.**

```js
  const SLOT_CATEGORY = { Spouse: 'ConstantCompanion' };

  function slotCategory(name) {
    return SLOT_CATEGORY[name] || String(name).replace(/\s+/g, '');
  }

  function flItems(myself) {
    const out = [];
    (myself.possessions || []).forEach(function (g) {
      (g.possessions || []).forEach(function (p) { out.push(p); });
    });
    return out;
  }

  function bonusOf(item) {
    const bonus = {};
    (item.enhancements || []).forEach(function (e) {
      bonus[normalizeName(e.qualityName)] = (bonus[normalizeName(e.qualityName)] || 0) + e.level;
    });
    return bonus;
  }

  function gearFrom(outfit, myself) {
    const equippable = flItems(myself).filter(function (p) { return p.equippable; });
    const slots = [];
    const emptyWithItems = [];
    (outfit.slots || []).forEach(function (s) {
      if (!s.canChange || s.isEffect) return;
      const items = equippable.filter(function (p) { return p.category === slotCategory(s.name); });
      if (s.qualityId == null) {
        if (items.length) emptyWithItems.push(s.name);
        return;
      }
      if (!items.some(function (p) { return p.id === s.qualityId; })) return;
      slots.push({
        name: s.name,
        items: items.map(function (p) {
          return { id: p.id, name: p.name, equipped: p.id === s.qualityId, bonus: bonusOf(p) };
        }),
      });
    });
    return { slots: slots, emptyWithItems: emptyWithItems };
  }

  function levelOf(myself, stat) {
    const p = flItems(myself).filter(function (q) {
      return !q.equippable && normalizeName(q.name) === stat;
    })[0];
    return p ? p.effectiveLevel : null;
  }

  function baseFor(myself, slots, stat) {
    let level = levelOf(myself, stat);
    if (level == null) return null;
    slots.forEach(function (slot) {
      slot.items.forEach(function (it) { if (it.equipped) level -= it.bonus[stat] || 0; });
    });
    return level;
  }

  function branchFrom(storylet, branchId) {
    const list = (storylet && storylet.storylet && storylet.storylet.childBranches) || [];
    return list.filter(function (b) { return String(b.id) === String(branchId); })[0] || null;
  }

  // Only requirements that are met now and sit on a stat gear can change need
  // guarding. "(you needed 30-70)" is a range to stay inside; a tooltip with
  // no range means the level must not move at all.
  function requirementsFor(branch, slots, myself) {
    const touched = {};
    slots.forEach(function (s) { s.items.forEach(function (it) { Object.keys(it.bonus).forEach(function (k) { touched[k] = 1; }); }); });
    const out = [];
    (branch.qualityRequirements || []).forEach(function (r) {
      const stat = normalizeName(r.qualityName);
      if (r.status !== 'Unlocked' || !touched[stat]) return;
      const m = /needed\s+(\d+)(?:\s*[-–]\s*(\d+))?/.exec(String(r.tooltip || '').replace(/<[^>]+>/g, ''));
      const now = levelOf(myself, stat);
      if (m) out.push({ stat: stat, min: Number(m[1]), max: m[2] ? Number(m[2]) : undefined });
      else if (now != null) out.push({ stat: stat, min: now, max: now });
    });
    return out;
  }
```
- [ ] **Step 4: Pass.**

---

### Task 5: Plan an optimization for one branch (glue, still pure)

**Files:** `FallenLondon/ux-enhancers.js` (same block), `tests/ux-equipment-optimizer.test.mjs`

**Interfaces:**
- Consumes Tasks 2 and 4.
- Produces `planFor(branch, storylet, outfit, myself)` → `{ status, ... }` where `status` is one of:
  - `'blocked'` with `reason` (`'no-challenge' | 'combined' | 'cannot-change' | 'not-in-storylet' | 'no-level'`);
  - `'already'` with `chance`, `emptyWithItems`;
  - `'change'` with `before`, `after` (success chances 0..1), `swaps: [{ slot, from: {id,name}, to: {id,name} }]`, `challenges` (the inferred list, kept for the post-apply check), `predicted: [{ name, shown }]` (per challenge percentage after the swap, floored), `emptyWithItems`.

- [ ] **Step 1: Failing tests** on the real captured Persuasive/Mithridacy branch data: with the Iron Hat worn, the *Preach the doctrine of the Burrow Church* branch (Mithridacy 20 narrow + Persuasive 90 broad) plans a swap that raises both; a branch whose challenges are all fixed returns `already`; `bonuses` non-empty returns `blocked/combined`; `storylet.canChangeOutfit === false` returns `blocked/cannot-change`; `phase !== 'In'` returns `blocked/not-in-storylet`; a challenge whose stat is missing from `possessions` returns `blocked/no-level`. `before` equals the product of the shown percentages (± rounding).
- [ ] **Step 2: Fail**, then **Step 3: Implement** by composing: `gearFrom`; for each challenge `levelOf` → `inferChallenge`; collect `hold` requirements plus `requirementsFor`; base levels from `baseFor` for every stat named by a challenge or requirement (challenges on a stat that no worn or spare item touches are just fixed at their shown chance: model them as `{ fixed }`); `optimizeOutfit`; diff picks against the worn items to build `swaps`. If `result.changes === 0` return `already`.
- [ ] **Step 4: Pass.**

---

### Task 6: Apply, verify, undo

**Files:** `FallenLondon/ux-enhancers.js` (same block), `tests/ux-equipment-optimizer.test.mjs`

**Interfaces:**
- Consumes `flApi`, `planFor`.
- Produces `applySwaps(swaps, api)` → `Promise<{ done: swaps[], failed: swap|null, error?: Error }>`. `api(method, path, body)` is injected so the loop is testable.
- Produces `saveUndo(rec)`, `readUndo()`, `clearUndo()` over `sessionStorage` key `fl-ux-equip-undo` (`{ branchId, at, restore: [{ slot, id, name }] }`, dropped after 30 minutes).
- Produces `saveResult(rec)`, `readResult()`, `clearResult()` over key `fl-ux-equip-result` (`{ branchId, at, lines: [string], undoable: bool }`).

- [ ] **Step 1: Failing tests** with a fake `api`: each swap is one `POST /api/outfit/equip` with `{ qualityId: to.id }`, in order, one at a time; it counts as done only if the reply has `isSuccess: true` **and** its `slots` list shows `to.id` in that slot; the first failure stops the loop (nothing after it is sent) and returns `failed` with the earlier `done`; a thrown error is returned in `error`, not rethrown; zero swaps sends nothing; the undo record round-trips and is dropped when older than 30 minutes; a corrupt `sessionStorage` value reads as `null`.
- [ ] **Step 2: Fail**, then **Step 3: Implement** (sequential `for … await`, with one animation frame between calls; no retries).
- [ ] **Step 4: Pass.**

---

### Task 7: The button, the run, and the result line

**Files:** `FallenLondon/ux-enhancers.js` (same block, then `FEATURES`), `tests/ux-equipment-optimizer.test.mjs`

**Interfaces:**
- Consumes everything above.
- Produces feature `{ name: 'equipment-optimizer', run: equipmentOptimizer }` in `FEATURES`. It runs on every scan and only touches `.branch` elements that have a `.challenges` child and none of our button yet.

Placement, from the real markup: inside `.branch .storylet__buttons`, after the game's own buttons (beside `Unlock`). The branch id is `.branch[data-branch-id]`. Our button is not one of the game's `button--go` buttons; its click calls `preventDefault()` and `stopPropagation()`.

The run (`runOptimize(branchEl)`), in order, stopping at the first thing that says stop:
1. Mark the button "Optimizing…" and ignore further clicks.
2. In parallel: `GET /api/character/myself`, `GET /api/outfit`, `POST /api/storylet`.
3. `planFor(...)`. `blocked` and `already` show their message under the button and stop; nothing is equipped and there is no reload.
4. `saveUndo` (the worn items in the slots that will change), then `applySwaps`.
5. On a failure: `saveResult` with what did and did not change and `undoable: true`, then reload so the game shows the truth.
6. On success: `POST /api/storylet` again and compare each challenge's shown percentage with `predicted`. Within 1 point: `saveResult` `Chance 60% → 100% ▲ +40` with the swaps listed. A larger gap: the line says `Predicted X%, the game shows Y%` and the run offers Undo first. Then `location.reload()`.
7. After a reload, `equipmentOptimizer` reads `readResult()` and draws the line under the button of the branch whose id matches, with an **Undo** button (at least 44 px) while `undoable`.
8. **Undo** re-equips `restore` through `applySwaps`, saves a result line `Restored your previous outfit`, clears the undo record and reloads.

Result-line wording (plain text): `Chance 60% → 100%  ▲ +40. Hat: Iron Hat → Beguiling Mask.`, `Already the best outfit: 100%.`, `Chance would not improve: same 60%.`, and, when `emptyWithItems` is non-empty, `You have items for empty slots (Luggage, Crew) that this leaves alone.`

- [ ] **Step 1: Failing tests** with the stub DOM and the real branch markup from the paste: one scan adds exactly one button; a second scan adds none; a branch with no `.challenge` gets none; the button is `type="button"`, has `min-height` ≥ 44 px and reads "Optimize equipment"; while running it reads "Optimizing…" and a second click does nothing; a stored result draws under the matching branch id only; Undo restores through the injected `api`; `blocked` reasons render their sentences; with `access_token` missing the line says "Sign in first" and nothing is fetched.
- [ ] **Step 2: Fail**, then **Step 3: Implement.** Register the feature, add the header summary line, set `@version` to `3.4`.
- [ ] **Step 4: Run everything.**

Run: `node tests/ux-equipment-optimizer.test.mjs && node tests/ux-equipment-helper.test.mjs && node --check FallenLondon/ux-enhancers.js && node scripts/bump-loaders.mjs --check`
Expected: all `PASS`, syntax OK, loaders check clean (run `node scripts/bump-loaders.mjs` if the all-in-one bundle reports stale).

- [ ] **Step 5: AGENTS.md.** Add the `equipment-optimizer` section: endpoints and their shapes, the six verified facts, the inference rule and its known failure modes, "never fill or empty slots in v1", the unknowns table.

---

### Task 8: In-game verification (user, desktop and phone)

- [ ] Open *Reconcile newcomers…* (or any action with a narrow and a broad challenge). Click the button. The page reloads on the same storylet; the line under the button says what changed; the game's percentages match the line.
- [ ] Click again: `Already the best outfit`, and the page does not reload.
- [ ] **Undo** restores the previous outfit exactly (check Possessions).
- [ ] An action with only a fixed-100% challenge, one at the 10% floor, and one with a second chance each behave as the wording says.
- [ ] A storylet where the game forbids outfit changes shows the reason and changes nothing.
- [ ] Phone: the button is reachable, the result line is readable, Undo works, and the reload lands on the same storylet.
- [ ] Any `Predicted X%, the game shows Y%` line: report the action. It means a broad/narrow guess was wrong and Task 10 is due.

---

### Task 9 (follow-up, needs one capture): fill and empty slots

Four changeable slots were empty in the probe. To fill them safely and undo it, the unequip call is needed. **Capture:** record with `temp/capture/1-record.js`, go to Possessions, click an *equipped* item in a slot you can spare (e.g. Companion), see whether it empties, then click the item again to re-equip it; run `2-save.js`. With that call: allow `emptyWithItems` slots as options, and make Undo able to empty a slot.

### Task 10 (follow-up, only if Task 8 reports a mismatch): learn from the game

After applying, the run already holds two observations per challenge (level and percentage before and after). If they disagree with the guessed kind, solve the kind and difficulty from the two observations (the only pair of formulas that fits both), rerun `optimizeOutfit` once and apply the difference. Limit: one correction per click, and the line says the model was corrected.

## Self-review

- **Spec coverage:** button next to every action with challenges → Task 7 placement. Optimizes the chance → Tasks 2, 4, 5. Applies it → Task 6/7. Undo, failure reporting, phone and colour rules → Global Constraints and Task 7/8.
- **Placeholders:** none. Unknowns (unequip, combined stats, locked-requirement wording) are listed with a stated handling and a follow-up task; the code paths for them refuse rather than guess.
- **Type consistency:** `slots` (`{ name, items: { id, name, equipped, bonus } }`), `challenges` (`{ kind, diff, terms } | { fixed, hold? }`), `requirements` (`{ stat, min?, max? }`), `swaps` (`{ slot, from, to }`) and `picks` (one id per slot) are used with the same names in Tasks 2–7.
- **Review Focus:** items 1–4 and 8 are pinned in Task 2/4/5 tests, 5 and 7 in Task 6/7, 6 and 10 in Task 7, 9 in Task 7 step 6 and Task 8.
