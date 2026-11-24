# Saved-outfit shortcuts Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** The "Optimize equipment" button switches to a matching saved outfit (a stat outfit or a
`temp…` cache outfit) instead of swapping item by item, stores calculated optima in temp outfits,
gets the game's button look, and the Possessions tab gets an "Empty outfit" button.

**Architecture:** Pure helpers (stat codes, temp names, outfit choice) feed a reworked
`runOptimize` in `FallenLondon/ux-enhancers.js`. The run reads state as today, picks a target
outfit, switches to it through the game's own outfit dropdown on Possessions (API + reload as
fallback), re-reads, plans from there, swaps as today, and for temp outfits renames and saves
through the API. A new feature entry adds the empty button on Possessions.

**Tech Stack:** Plain ES2017 userscript (one IIFE, no build), Node standalone test script with a
stub DOM (`tests/ux-equipment-optimizer.test.mjs`, no test runner).

**Spec:** `docs/superpowers/specs/2026-11-24-saved-outfit-shortcuts-requirements.md` (read it
first; requirement ids R1.x–R6.x below refer to it). API facts: `okf/fallen-london/api.md`,
`okf/fallen-london/equipment.md` ("Saved outfits").

## Global Constraints

- **No git changes at all**: no `git add`, no commit, no branch, no stash. The author's standing
  rule. Every task ends with "leave the working tree for the author", not a commit.
- Bump `@version` in `FallenLondon/ux-enhancers.js` from `3.12` to `3.13` once (Task 8).
  `@downloadURL` stays.
- Only captured calls: `POST /api/outfit/change {"outfitId"}`, `POST /api/outfit/rename
  {"outfitId","newName"}`, `POST /api/outfit/save` (no body; saves the **selected** outfit),
  `POST /api/outfit/equip|unequip {"qualityId"}`, `GET /api/outfit`, `GET /api/character/myself`,
  `POST /api/storylet`. One request at a time. No polling. No call that spends an action.
- The script writes outfit names of at most **20** characters, letters and digits only.
- The script **never saves into a non-temp outfit**. Temp = name starts with `temp`, any case.
- All information is in visible text; colour never carries meaning alone (author is red-green
  weak). Mobile first: every new control is a real `<button>` that works on tap.
- Result-line copy fixed by the spec: `Unsaved changes on <current> will be lost. Tap again to
  switch to <target>.` (R2.10); `Rename an outfit to temp1 to keep results for next time.` (Q4).
- Run all tests with `node tests/ux-equipment-optimizer.test.mjs`; it ends with
  `All checks passed.` and exit code 0. The existing 138 checks must keep passing, except the one
  Task 6 changes on purpose.

## Review Focus

1. **A dirty outfit and a target that is already selected.** No switch is needed, so no prompt
   must appear (R2.10 applies only to switches). Test in Task 5.
2. **The free name collides.** Renaming `tempGlaWat` to a free name when `temp1`…`temp6` exist
   must give `temp7`, and must not count the outfit being renamed as taken. Test in Task 1.
3. **A stat with no code in a two-stat action** (e.g. Luck is ignored, but "Kataleptic
   Toxicology" + an uncoded stat): no temp lookup, no store, calculation as today, result says
   which stat has no code. Test in Task 2.
4. **The page switch fails half-way** (dropdown missing, option not found): the run must fall back
   to `POST /api/outfit/change`, make the remaining swaps through the API and reload, never click
   items on a page that shows the old outfit. Test in Task 5.
5. **Rename fails after the save** in a store: the temp must be left under its free name, never
   under an old key; the result says so. Test in Task 3.

---

## File Structure

- Modify `FallenLondon/ux-enhancers.js`
  - new block "saved outfits: names and choice" just above `// --- planning one action` (pure
    helpers, Tasks 1–2);
  - new block "saved outfits: API" after `applyOutfit` (Task 3);
  - `eoSoftIo` gains `onPossessions`, `switchOutfit` (Task 4);
  - `runOptimize`, `runUndo`, `eoRun` reworked (Task 5);
  - `eoBuild`, `eoDraw`, `eoButtonCss`, `equipmentOptimizerOff` (Task 6);
  - new feature `outfit-emptier` + `FEATURES` entry (Task 7);
  - header comment, `@version` (Task 8).
- Modify `tests/ux-equipment-optimizer.test.mjs`: extend `NAMES`, `MYSELF` (saved outfits),
  `fakeServer` (outfit store), `softWorld` (outfit dropdown), new checks per task.
- Modify `AGENTS.md` (`equipment-optimizer` section), `okf/fallen-london/equipment.md`, the spec's
  handoff section (Task 8).

---

### Task 1: Stat codes and temp names

**Files:**
- Modify: `FallenLondon/ux-enhancers.js` (new block before `// --- planning one action`)
- Test: `tests/ux-equipment-optimizer.test.mjs`

**Interfaces:**
- Produces:
  - `const STAT_CODES` — object, key = `normalizeName(game stat name)`, value = code. Exactly the
    spec's R2.3 table: watchful Wat, shadowy Sha, dangerous Dan, persuasive Per,
    artisan of the red science Art, glasswork Gla, kataleptic toxicology Kat, mithridacy Mit,
    monstrous anatomy Mon, player of chess Che, shapeling arts Shp, zeefaring Zee,
    chthonosophy Cht, steward of the discordance Ste, inerrant Ine, insubstantial Ins,
    neathproofed Nea, bizarre Biz, dreaded Dre, respectable Res.
  - `statCode(statName: string) -> string|null`
  - `keyFor(statNames: string[]) -> { codes: string[], missing: string[] }` — codes unique,
    sorted alphabetically; `missing` = game names without a code, in input order.
  - `tempName(codes: string[]) -> string|null` — `'temp' + codes.join('')`, null if longer than 20
    or `codes` empty.
  - `parseTemp(name: string) -> null | { free: true } | { free: false, codes: string[] }` — null if
    the name does not start with `temp` (any case). Free: suffix empty or digits only, or a suffix
    that does not split fully into known codes. Codes split at capital letters, compared as a set
    (returned sorted).
  - `sameKey(a: string[], b: string[]) -> boolean` — set equality.
  - `freeTempName(outfits: {id,name}[], exceptId: number) -> string` — `temp` + smallest N ≥ 1
    such that no outfit other than `exceptId` has that name (compare ignoring case).

- [ ] **Step 1: Write the failing checks** (add the seven names to `NAMES`)

```js
check('codes are unique and three letters', () => {
  const v = Object.values(api.STAT_CODES);
  return [v.length, new Set(v).size, v.every((c) => /^[A-Z][a-z]{2}$/.test(c))];
}, [20, 20, true]);
check('key: sorted, unique, missing kept', () => api.keyFor(['Watchful', 'Glasswork', 'Watchful', 'Luck']),
  { codes: ['Gla', 'Wat'], missing: ['Luck'] });
check('name: temp + codes', () => api.tempName(['Gla', 'Wat']), 'tempGlaWat');
check('name: six stats do not fit in 20', () => api.tempName(['Art', 'Che', 'Dan', 'Gla', 'Kat', 'Wat']), null);
check('parse: hand order matches as a set', () => api.parseTemp('tempWatGla'), { free: false, codes: ['Gla', 'Wat'] });
check('parse: case of the prefix ignored', () => api.parseTemp('TEMPGlaWat'), { free: false, codes: ['Gla', 'Wat'] });
check('parse: digits and bare temp are free', () => [api.parseTemp('temp'), api.parseTemp('temp3')], [{ free: true }, { free: true }]);
check('parse: junk suffix is free', () => api.parseTemp('tempFooWat'), { free: true });
check('parse: not a temp', () => api.parseTemp('Persuasive'), null);
check('sameKey is a set compare', () => [api.sameKey(['Wat', 'Gla'], ['Gla', 'Wat']), api.sameKey(['Wat'], ['Gla', 'Wat'])], [true, false]);
const OUTS = [1, 2, 3, 4, 5, 6].map((n) => ({ id: 6171218 + n, name: 'temp' + n })).concat([{ id: 9, name: 'tempGlaWat' }]);
check('free name skips temp1..temp6', () => api.freeTempName(OUTS, 9), 'temp7');
check('free name does not count the outfit itself', () => api.freeTempName([{ id: 9, name: 'temp1' }], 9), 'temp1');
```

- [ ] **Step 2: Run, expect the new checks to FAIL** (`THREW … not a function` / `undefined`)

Run: `node tests/ux-equipment-optimizer.test.mjs`

- [ ] **Step 3: Implement the seven helpers** with the signatures above. A comment above
  `STAT_CODES` says codes are never changed once released (old temp names become unreadable).

- [ ] **Step 4: Run, expect all PASS.** Leave the working tree for the author.

---

### Task 2: Which stats an action tests, and which outfit to use

**Files:**
- Modify: `FallenLondon/ux-enhancers.js` (`planFor`; new `chooseOutfit` in the Task 1 block)
- Test: `tests/ux-equipment-optimizer.test.mjs`

**Interfaces:**
- Consumes: Task 1 helpers.
- Produces:
  - `planFor` also returns `stats: string[]` (the game names of the challenges it models, i.e.
    not in `ignored`, unique, in branch order) on `'already'` and `'change'`.
  - `chooseOutfit(plan, outfits: {id,name,selected}[], lastUsed: {[id]: ms}) -> choice`, where
    `choice` is one of
    - `{ kind: 'stat', outfit }` — `plan.stats` has exactly one stat and an outfit's name equals
      that stat's game name or code ignoring case and spaces (R1.2, strict; first in list order);
    - `{ kind: 'hit', outfit, codes }` — a temp whose `parseTemp` codes `sameKey` the key (R2.4);
    - `{ kind: 'store', outfit, codes }` — `plan.status === 'change'`, key has codes, no missing,
      `tempName(codes)` not null; outfit picked by R2.6: first free temp in list order, else the
      keyed temp with the smallest `lastUsed[id]` (no entry counts as 0, ties: list order);
    - `{ kind: 'none', reason }` — `reason` one of `'no-code'` (with `missing`), `'too-many'`,
      `'no-temp'`, `'already'`.
  - Precedence R1.3: stat, then hit, then store. Stat and hit apply whatever `plan.status`.

- [ ] **Step 1: Write the failing checks** (add `chooseOutfit` to `NAMES`)

```js
const O = (id, name, selected) => ({ id, name, selected: !!selected, type: 'Standard' });
const PL = (stats, status) => ({ status: status || 'change', stats });
check('plan lists the stats it models, not Luck', () => planOf(Object.assign({}, PREACH, {
  challenges: PREACH.challenges.concat([chal('Luck', 'Luck', 50)]) })).stats, ['Mithridacy', 'Persuasive']);
check('stat outfit by game name', () => api.chooseOutfit(PL(['Persuasive']), [O(1, 'persuasive '), O(2, 'temp1')], {}).kind, 'stat');
check('stat outfit by code', () => api.chooseOutfit(PL(['Persuasive']), [O(1, 'PER')], {}).outfit.id, 1);
check('no other word forms', () => api.chooseOutfit(PL(['Persuasive']), [O(1, 'Persuasion')], {}).kind, 'none');
check('two stats never pick a stat outfit', () => api.chooseOutfit(PL(['Watchful', 'Glasswork']), [O(1, 'Watchful'), O(2, 'tempWatGla')], {}),
  { kind: 'hit', outfit: O(2, 'tempWatGla'), codes: ['Gla', 'Wat'] });
check('stat beats temp hit', () => api.chooseOutfit(PL(['Watchful']), [O(2, 'tempWat'), O(1, 'Wat')], {}).outfit.id, 1);
check('hit applies even when already best', () => api.chooseOutfit(PL(['Watchful'], 'already'), [O(2, 'tempWat')], {}).kind, 'hit');
check('store: free temp first', () => api.chooseOutfit(PL(['Watchful', 'Glasswork']), [O(3, 'tempDan'), O(4, 'temp2')], {}).outfit.id, 4);
check('store: least recently used keyed temp', () => api.chooseOutfit(PL(['Watchful', 'Glasswork']), [O(3, 'tempDan'), O(5, 'tempSha')], { 3: 200, 5: 100 }).outfit.id, 5);
check('store: never when already best', () => api.chooseOutfit(PL(['Watchful', 'Glasswork'], 'already'), [O(4, 'temp2')], {}), { kind: 'none', reason: 'already' });
check('no code: no lookup, says which', () => api.chooseOutfit(PL(['Watchful', 'Nightmares']), [O(4, 'temp2')], {}), { kind: 'none', reason: 'no-code', missing: ['Nightmares'] });
check('no temp at all', () => api.chooseOutfit(PL(['Watchful', 'Glasswork']), [O(1, 'Watchful')], {}), { kind: 'none', reason: 'no-temp' });
```

- [ ] **Step 2: Run, expect the new checks to FAIL.**
- [ ] **Step 3: Add `stats` to `planFor`'s two non-blocked returns; implement `chooseOutfit`.**
- [ ] **Step 4: Run, expect all PASS.** Leave the working tree for the author.

---

### Task 3: Outfit calls: switch, rename, save, store

**Files:**
- Modify: `FallenLondon/ux-enhancers.js` (new block after `applyOutfit`)
- Test: `tests/ux-equipment-optimizer.test.mjs` (extend `fakeServer`)

**Interfaces:**
- Consumes: `flApi`-shaped `call(method, path, body)`; Task 1 `freeTempName`, `tempName`.
- Produces (each resolves `true` only when the reply has `isSuccess === true`; a thrown call
  resolves `false`, never rejects):
  - `changeOutfitApi(id: number, call) -> Promise<boolean>`
  - `renameOutfit(id: number, name: string, call) -> Promise<boolean>`
  - `saveOutfit(call) -> Promise<boolean>`
  - `storeInTemp(outfit: {id,name}, codes: string[], outfits, call) -> Promise<{ ok, name }>` —
    order (R2.5.3): if `parseTemp(outfit.name)` is not free, rename to
    `freeTempName(outfits, outfit.id)`; save; rename to `tempName(codes)`. Stops at the first
    failure. `name` is the outfit's name afterwards (old name if the first rename failed, free
    name if the save or last rename failed, key name on success).
  - `const TEMP_USED_KEY = 'fl-ux-temp-used'`, `markTempUsed(id)` writes `Date.now()` into the
    `localStorage` map; `readTempUsed() -> {[id]: ms}` (try/catch, `{}` on any error).

- [ ] **Step 1: Extend `fakeServer`** with a saved-outfit store (keep all existing behaviour):
  `opts.outfits` (default: `[{id: 6065356, name: 'Dangerous', selected: true, type: 'Standard'}]`),
  a `saved` map id → slots copy, a `dirty` flag (set by equip/unequip, cleared by change/save),
  `MYSELF` copies gain `character: { outfits, canChangeOutfit: true }`. New routes:
  `/api/outfit/change` (sets `worn` from `saved[id]`, `selected`), `/api/outfit/rename` (refuses
  with `isSuccess: false` when `opts.failRename` matches the new name), `/api/outfit/save`
  (`saved[selected] = worn`, refuses when `opts.failSave`). `/api/outfit` replies with `dirty`.
  Expose `outfits()`, `saved`, and `calls(path)`.

- [ ] **Step 2: Write the failing checks** (add the new names to `NAMES`)

```js
checkAsync('store: free name, save, key name, in that order', async () => {
  const s = fakeServer({ outfits: [{ id: 7, name: 'tempDan', selected: true }, { id: 8, name: 'temp1' }] });
  const r = await api.storeInTemp({ id: 7, name: 'tempDan' }, ['Gla', 'Wat'], s.outfits(), api.flApi);
  return [r, s.log.filter((c) => c[1].startsWith('/api/outfit/')).map((c) => [c[1], c[2]])];
}, [{ ok: true, name: 'tempGlaWat' }, [
  ['/api/outfit/rename', { outfitId: 7, newName: 'temp2' }],
  ['/api/outfit/save', undefined],
  ['/api/outfit/rename', { outfitId: 7, newName: 'tempGlaWat' }]]]);
checkAsync('store: a free temp is not renamed first', async () => {
  const s = fakeServer({ outfits: [{ id: 8, name: 'temp1', selected: true }] });
  await api.storeInTemp({ id: 8, name: 'temp1' }, ['Wat'], s.outfits(), api.flApi);
  return s.calls('/api/outfit/rename').length;
}, 1);
checkAsync('store: last rename fails, the free name stays (Review Focus 5)', async () => {
  const s = fakeServer({ failRename: 'tempWat', outfits: [{ id: 7, name: 'tempDan', selected: true }] });
  return api.storeInTemp({ id: 7, name: 'tempDan' }, ['Wat'], s.outfits(), api.flApi);
}, { ok: false, name: 'temp1' });
checkAsync('store: save fails, no key is written', async () => {
  const s = fakeServer({ failSave: true, outfits: [{ id: 8, name: 'temp1', selected: true }] });
  const r = await api.storeInTemp({ id: 8, name: 'temp1' }, ['Wat'], s.outfits(), api.flApi);
  return [r, s.calls('/api/outfit/rename').length];
}, [{ ok: false, name: 'temp1' }, 0]);
check('temp use times survive a broken store', () => { storage.setItem('fl-ux-temp-used', '{bad'); return api.readTempUsed(); }, {});
```

- [ ] **Step 3: Run, expect FAIL. Implement. Run, expect all PASS** (old checks included: the
  `fakeServer` extension must not change them). Leave the working tree for the author.

---

### Task 4: Switching outfits through the page

**Files:**
- Modify: `FallenLondon/ux-enhancers.js` (`eoSoftIo`)
- Test: `tests/ux-equipment-optimizer.test.mjs` (extend `softWorld`)

**Interfaces:**
- Produces, on the object `eoSoftIo()` returns:
  - `goToPossessions()` — unchanged, except it **does not click** the link when
    `.equipment-group-list` is already present (a second click on the same route would push a
    history entry and break `back`).
  - `switchOutfit(name: string) -> Promise<boolean>` — on Possessions: find
    `#a11y-outfit-dropdown`, its react-select control in the same parent (the element holding
    `[role="combobox"]`, walk up to the first ancestor whose class contains `-control`), dispatch
    `mousedown` (bubbles) on it, wait (`EO_TIMING.itemMs`) for a `[role="listbox"]
    [role="option"]` whose trimmed text equals `name`, click it, then wait until the
    `[class*="singleValue"]` inside that control reads `name`. `false` on any miss, after
    pressing Escape on the combobox so no menu stays open.
- Markup source: `okf/fallen-london/equipment.md` "Saved outfits" (captured 2026-11-24).

- [ ] **Step 1: Extend `softWorld`**: `drawPossessions` also draws `.outfit-controls` with the
  hidden select (one option per server outfit, value = id), a control div (class
  `css-x-control`) holding a single value div (`css-y-singleValue`, text = selected name) and a
  `[role="combobox"]` input. `mousedown` on the control (the stub's `dispatchEvent` routes to an
  `onReact`-style handler) adds a `[role="listbox"]` with one `[role="option"]` per outfit; an
  option's click calls the fake server's change route and redraws Possessions. `opts.noDropdown`
  leaves the controls out; `opts.deadDropdown` ignores the mousedown. Count `spa.switches`.

- [ ] **Step 2: Write the failing checks** (call `io` through a tiny exposed wrapper: add
  `eoSoftIo` to `NAMES`)

```js
checkAsync('the dropdown switches the outfit and the page shows it', async () => {
  const w = softWorld({ outfits: [{ id: 1, name: 'Dangerous', selected: true }, { id: 2, name: 'Persuasive' }] });
  const io = api.eoSoftIo();
  await io.goToPossessions();
  const ok = await io.switchOutfit('Persuasive');
  return [ok, w.spa.switches, w.server.outfits().find((o) => o.selected).name];
}, [true, 1, 'Persuasive']);
checkAsync('already on Possessions: no second link click', async () => {
  const w = softWorld();
  const io = api.eoSoftIo();
  await io.goToPossessions(); await io.goToPossessions();
  return w.spa.navClicks;
}, 1);
checkAsync('a dropdown that does not open gives false and leaves no menu', async () => {
  const w = softWorld({ deadDropdown: true, outfits: [{ id: 1, name: 'A', selected: true }, { id: 2, name: 'B' }] });
  const io = api.eoSoftIo();
  await io.goToPossessions();
  return [await io.switchOutfit('B'), doc.body.querySelector('[role="listbox"]')];
}, [false, null]);
```

- [ ] **Step 3: Run, expect FAIL. Implement. Run, expect all PASS.** Leave the working tree for
  the author.

---

### Task 5: The run: choose, ask, switch, check, apply, store

**Files:**
- Modify: `FallenLondon/ux-enhancers.js` (`runOptimize`, `runUndo`, `eoRun`, undo record)
- Test: `tests/ux-equipment-optimizer.test.mjs`

**Interfaces:**
- Consumes: Tasks 1–4.
- Produces:
  - `runOptimize(branchId, call, io, confirmed: boolean)` returns today's
    `{ lines, reload?, persist?, undoable? }` plus `confirm: true` when it stopped to ask.
  - Undo record gains `outfitId` (the outfit selected before the run, or absent when the run did
    not switch). `runUndo` with `outfitId`: switch back to it (page, else API + reload); the
    record's `restore` swaps are then **not** replayed (the switch drops them). Without
    `outfitId`: today's behaviour.
  - `eoRun(wrap, branchId, undo)` passes `confirmed = wrap.dataset.flUxEoConfirm === '1'`, sets
    that flag when the result has `confirm`, clears it otherwise. A redraw of the branch (new
    wrap) drops it, which is the "same storylet view" of R2.10.

The run, in order (stop at the first line that ends it):

1. Read `myself`, `outfit`, `storylet` as today; `plan0 = planFor(...)`; blocked → today's line.
2. `choice = chooseOutfit(plan0, myself.character.outfits, readTempUsed())`.
3. `kind 'none'`: today's run on `plan0`. Extra line for `no-code`: `No saved outfit for
   <missing joined ", ">: no stat code.`; for `no-temp` (only when status was `change`): the Q4
   hint. `already` keeps today's text.
4. Target already `selected`: no switch, no prompt (Review Focus 1); `state1 = state0`.
5. Otherwise: if `outfit.dirty` and not `confirmed` → return
   `{ lines: [R2.10 prompt with current and target names], confirm: true }`. Else
   `io.goToPossessions()`, `io.switchOutfit(target.name)`; on `false` → `changeOutfitApi`, and
   from here `viaApi = true` (all swaps through `applySwaps`, final `reload: true`). Save the undo
   record `{ branchId, outfitId: <previous selected id>, restore: [] }` right after the switch.
   Re-read the three replies: `state1`.
6. Safety net (R1.6), for `stat` and `hit` only: the branch in `state1` is `isLocked`, or missing,
   or `eoShown(branch1) < eoShown(branch0)` → switch back (same page-then-API route), line
   `Switched back from <target>: <reason>.`, where reason is `the action is locked in it` or
   `the chance dropped from X to Y`, then a second line `Press again for a calculated outfit
   instead.` and return. (Not for `store`: its temp contents are about to be replaced.)
7. `plan1 = planFor(branch1, ...state1)`. If `change`: apply (`applyOutfit` unless `viaApi`, then
   `applySwaps`). A failure: today's failure lines; for `store`/`hit` nothing is saved or renamed.
8. Temp targets: `hit` with swaps applied, or `store` → `storeInTemp(target, codes, outfits1,
   call)`; `markTempUsed(target.id)` on `hit` and `store`. Stat targets: never save.
9. If the run is on Possessions and nothing called `back` yet → `io.back(branchId)`.
10. Lines: first line names the outfit — `Switched to <target>.` (or `Already wearing
    <target>.`) — then today's chance line from `eoShown(branch0)` to the final shown chance and
    the swap lines; stat target with swaps: append ` (unsaved)` to the chance line; store/hit:
    `Saved as <name>.`, or on a failed store `Could not save the outfit; it is named <name>.`.
    `undoable: true` when anything was switched or swapped.

- [ ] **Step 1: Write the failing checks** with `softWorld` and the extended server. One check
  per spec scenario (number = spec §5):
  1. Persuasive-only (`opts.dangerous`-style single-stat storylet on Persuasive), outfit
     `Persuasive` not worn → one `spa.switches`, 0 equips, first line `Switched to Persuasive.`,
     undo record `outfitId` = previous id.
  2. Same, `Persuasive` selected → 0 switches, line starts `Already wearing Persuasive.`
  3. Two stats (the fixture's Mithridacy + Persuasive), outfit `temp1` free → switched to
     `temp1`, swaps made, calls end with save then rename `tempMitPer`, line contains
     `Saved as tempMitPer.`
  4. Next run with `tempMitPer` holding the optimum → one switch, 0 equips, 0 save calls.
  5. `failEquip` in 3 → no save call, no rename call, `temp1` keeps its name.
  7. `cannotChange` → today's blocked line, 0 switches.
  8. Stat outfit whose contents lower the chance → switched back (2 switches), line starts
     `Switched back from Persuasive: the chance dropped`.
  9. Server `dirty: true` and a stat outfit matches → `confirm: true`, 0 switches, prompt text
     exact; a second click on the same button → switched.
  10. Stat outfit plus a better item owned → switch, the item equipped, 0 save calls, chance line
      ends `(unsaved).`
  - Review Focus 1: dirty, target already selected → no prompt.
  - Review Focus 4: `deadDropdown` → `/api/outfit/change` called, swaps via API, `reloads` 1, 0
    page clicks after the failed switch.
  - Undo after scenario 1 → switches back to the previous outfit, no equip calls.

- [ ] **Step 2: Run, expect the new checks to FAIL.**
- [ ] **Step 3: Implement the run above.** Keep `runOptimize` readable: a helper
  `readState(call) -> {myself, outfit, storylet}` and `switchTo(outfit, call, io) -> {viaApi}` are
  fine; no other new public names.
- [ ] **Step 4: Run, expect all PASS** (all older run checks too: with the default single
  `Dangerous` outfit and Mithridacy + Persuasive, `chooseOutfit` gives `no-temp`, i.e. today's
  run, plus the Q4 hint line; update only those older checks whose exact line text now gains
  that hint, and say so in the hand-off). Leave the working tree for the author.

---

### Task 6: The button looks like the game's own (R6)

**Files:**
- Modify: `FallenLondon/ux-enhancers.js` (`eoBuild`, `eoDraw`, `eoButtonCss`, `eoRun`,
  `equipmentOptimizerOff`)
- Test: `tests/ux-equipment-optimizer.test.mjs` (change the "touch-sized" check at ~line 1033)

**Interfaces:**
- Produces:
  - `eoGameButton(branchEl) -> Element|null` — first `button` in `.storylet__buttons` that is not
    ours (`fl-ux-eo-*`).
  - `eoButtonCss(game: Element|null) -> string` — colours as today (`UI.bgAlt`, `UI.text`,
    border `UI.accent`); from `getComputedStyle(game)` copies `height`, `padding`, `fontFamily`,
    `fontSize`, `fontWeight`, `letterSpacing`, `textTransform`, `lineHeight`, `borderRadius`,
    plus `margin-right:8px`. With `game` null: today's CSS (44 px, 14 px font).
  - `eoBuild(branchEl)`: the run button is inserted into `.storylet__buttons` directly before
    `eoGameButton`; the wrap (`EO_CLASS`, holding only `EO_LINE`) is inserted right after
    `.storylet__buttons`, `width:100%`, no `flex:1 0 100%`. `wrap.flUxButton` holds the run
    button; `eoRun` uses it instead of `wrap.querySelector('.fl-ux-eo-run')`.
  - `equipmentOptimizerOff` also removes `.fl-ux-eo-run` buttons.
  - Undo and Dismiss in `eoDraw` use `eoButtonCss(eoGameButton(branch))` (find the branch from
    the wrap's parent chain; null → fallback CSS).

- [ ] **Step 1: Replace the old "touch-sized" check and add**

```js
check('the button sits in the game\'s button row, right before Go', () => {
  const { branches } = freshWorld();
  api.equipmentOptimizer();
  const row = branches[0].querySelector('.storylet__buttons');
  return row.children.map((c) => c.textContent);
}, ['Optimize equipment', 'Go']);
check('the result panel is after the button row, not in it', () => {
  const { branches } = freshWorld();
  api.equipmentOptimizer();
  const row = branches[0].querySelector('.storylet__buttons');
  return [row.querySelector('.fl-ux-eo'), row.nextSibling && row.nextSibling.className];
}, [null, 'fl-ux-eo']);
check('the button takes the game button\'s shape and keeps its own colours', () => {
  const { branches } = freshWorld();
  api.equipmentOptimizer();
  const css = eoButton(branches[0]).style.cssText;
  return [/height:\s*40px/.test(css), /font-size:\s*13px/.test(css), /text-transform:\s*uppercase/.test(css),
    /min-height:\s*44px/.test(css), css.includes('background')];
}, [true, true, true, false, true]);
```

  For the third check, make the test's `getComputedStyle` stub return
  `{ height: '40px', fontSize: '13px', textTransform: 'uppercase', … }` when given an element whose
  class contains `button--go`, and today's object otherwise. The stub DOM already has
  `insertBefore` and `nextSibling`.

- [ ] **Step 2: Run, expect FAIL. Implement. Run, expect all PASS.** Leave the working tree for
  the author.

---

### Task 7: "Empty outfit" button on Possessions (R3)

**Files:**
- Modify: `FallenLondon/ux-enhancers.js` (new feature block after the optimizer, `FEATURES`)
- Test: `tests/ux-equipment-optimizer.test.mjs`

**Interfaces:**
- Consumes: `applyInPage`, `applySwaps`, `eoSoftIo`, Task 3 `renameOutfit`, `saveOutfit`,
  `freeTempName`, `parseTemp`.
- Produces:
  - `emptySwaps(outfitReply) -> { swaps, locked: number }` — one swap
    `{ slot, from: { id: qualityId, name: slot }, to: { id: null, name: 'nothing' } }` per slot
    with `canChange && !isEffect && qualityId != null`; `locked` = slots with
    `!canChange && !isEffect && qualityId != null`.
  - `runEmpty(call, io) -> { lines, reload? }`: read `GET /api/outfit`, `GET
    /api/character/myself` (for the selected outfit's name); `canChangeOutfit === false` → line
    `The game does not let you change your outfit here.`; swaps in the page (`applyInPage` with
    the io's `goToPossessions` a no-op, no `back`), the rest through `applySwaps` + reload. All
    done and the outfit is a temp → keyed: `renameOutfit(free name)` first; then `saveOutfit`.
    Lines: `Emptied N slots.`, `M slots cannot be changed.` (when M > 0), then for a temp
    `Renamed <old> to <free> and saved.` / `Saved.`, else `Not saved.`
  - `outfitEmptier()` feature: on Possessions, once per `.outfit-controls`, a `<button
    class="fl-ux-empty">Empty outfit</button>` after `.outfit-controls__dropdown-and-buttons`
    (first one), `eoButtonCss(null)` (44 px: this one is not in a game button row), result panel
    `EO_PANEL_CSS` under it. `FEATURES` entry `{ name: 'outfit-emptier', run: outfitEmptier,
    off: outfitEmptierOff, group: 'UX tweaks', label: 'the Empty outfit button (Possessions)' }`.

- [ ] **Step 1: Write the failing checks**

```js
check('empty: only changeable, filled, non-effect slots; locked counted', () => api.emptySwaps(OUTFIT),
  { swaps: [
    { slot: 'Hat', from: { id: 304, name: 'Hat' }, to: { id: null, name: 'nothing' } },
    { slot: 'Luggage', from: { id: 147174, name: 'Luggage' }, to: { id: null, name: 'nothing' } },
    { slot: 'Companion', from: { id: 134971, name: 'Companion' }, to: { id: null, name: 'nothing' } }],
    locked: 2 });
```

  Plus `checkAsync` runs with `softWorld` on Possessions: (a) selected `tempGlaWat` → 3
  unequip clicks, then rename to `temp1`, then save, lines `Emptied 3 slots.`, `2 slots cannot be
  changed.`, `Renamed tempGlaWat to temp1 and saved.`; (b) selected `Persuasive` → 3 clicks, 0
  rename, 0 save, `Not saved.`; (c) one click ignored (`ignoreClick` for that item) on a temp →
  API fallback for the rest, reload, and the save only after all succeeded.

- [ ] **Step 2: Run, expect FAIL. Implement. Run, expect all PASS.** Leave the working tree for
  the author.

---

### Task 8: Docs, version, in-game check list

**Files:**
- Modify: `FallenLondon/ux-enhancers.js` (header comment near line 57, `@version 3.13`)
- Modify: `AGENTS.md` (`equipment-optimizer` section; a short `outfit-emptier` entry)
- Modify: `okf/fallen-london/equipment.md` (what the script now does with saved outfits, one
  paragraph), spec §0 handoff (implemented, awaiting in-game test)

- [ ] **Step 1:** Header comment: stat outfits, temp cache, the ask-before-switch, the empty
  button, the button's look. AGENTS.md: same, plus the names `chooseOutfit`, `storeInTemp`,
  `switchOutfit`, `TEMP_USED_KEY`, and that rename/save go through the API (the page's dropdown
  and save button may show stale state until the game refetches; not verified).
- [ ] **Step 2:** Run `node tests/ux-equipment-optimizer.test.mjs` and
  `node tests/ux-equipment-helper.test.mjs`; both end `All checks passed.`
- [ ] **Step 3:** Put this in-game check list in the spec's handoff section, for the author:
  1. Persuasive-only action with "Persuasive" not worn: one switch, no reload.
  2. Two-stat action with a free temp: renamed `temp…` → key, contents saved (switch away and
     back, the items stay).
  3. The page after a store: does the dropdown show the new name, and is the save button dark?
     (Not verified; if stale, note it.)
  4. Unsaved hand change, then the button: prompt, second tap switches.
  5. "Empty outfit" on a temp and on a named outfit.
  6. Button row on desktop and on the phone: Optimize left of Go, same height.
- [ ] **Step 4:** Leave the working tree for the author. No commit.

---

**Not in this plan, on purpose:** Undo for "Empty outfit" (R3.7, nice to have); U6 (reading the
outfit list from something smaller than `/myself`).
