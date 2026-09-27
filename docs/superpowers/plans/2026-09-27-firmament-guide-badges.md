# Firmament Guide Badges (10-item TODO batch) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: use `adding-fallen-london-features`
> (`.claude/skills/adding-fallen-london-features/SKILL.md`) as the authoritative checklist for
> every task below — this plan supplies the researched data and decisions that skill's steps 1-9
> require; it does not replace steps 10-17 (wiring, traps, tests, docs, verify), which each task
> still has to do in full. Use `superpowers:executing-plans` or `superpowers:subagent-driven-development`
> to run the tasks — see "Execution Handoff" at the end.

**Goal:** Add badges (opportunity-card and/or storylet/branch, **no panel** — confirmed by the
user for all ten) for the ten TODO.md entries in the "Early/Mid/Late Firmament" groups
(`TODO.md` lines 16-29), turning them from bare wiki links into `(implemented)` rows, following
the guide-carousel list's own convention (`TODO.md:10`).

**Architecture:** Each guide becomes one more entry in `FallenLondon/choice-helper.js`'s
`FEATURES` array (`choice-helper.js:36737`), following the file's existing shape: a `const`
table of every option (transcribed from the wiki, corrections go there and nowhere else), a pure
`xSpec(entry) -> {text, color, title}` function, a wiring function registered in `FEATURES`, and
a `tests/choice-<feature>.test.mjs` suite. No new files besides one script edit and one test file
per guide; `ux-enhancers.js` is untouched (no panel, no shared-helper changes).

**Tech Stack:** Vanilla JS IIFE, `@grant none`, no build step. Tests are standalone
dependency-free Node scripts run with `node <path>` (`AGENTS.md`, "What this is").

**Spec:** This plan's data comes from three research passes, already committed:
- `docs/superpowers/research/2026-09-27-early-firmament.md` (Ecdysis, Midnight Trade, Kinetoculus, The Stacks)
- `docs/superpowers/research/2026-09-27-mid-firmament.md` (High Sancta, Moon-Miser Herding, Sous Catacombs)
- `docs/superpowers/research/2026-09-27-late-firmament.md` (Upon a Red Stage, To Make a Moth, Scaling the Quartz)

Each task below is self-contained (the table is inlined), but the research files carry the full
prose reasoning and are worth reading before touching the code they back.

## Scope correction — this batch ships 8 of the 10, not 10

Two of the ten TODO.md entries cannot honestly become badges, and forcing one would violate the
skill's "do not badge a line the player cannot take" / "a badge is a claim that needs a source"
rules:

- **The Kinetoculus (Guide)** — purely narrative, the guide says so twice in bold. **No code.**
  Task 0 below marks it `(implemented; nothing to badge: purely narrative, no economic or
  comparable rewards)` in TODO.md directly, matching the precedent already set for "Location-
  specific cards in the Hinterlands (Guide)" in the Reference section.
- **The Stacks (Guide)** — ~25 cards, Fate/companion-locked branches, a state machine gating
  which cards can appear, and the guide's own EPA figures disagree by section. This needs its
  own dedicated research-and-choices pass (own numbered questions to the user) once the ~25
  option pages are fetched, the same way `discordant-studies` and the Airs-of-London feature
  got their own passes. **Deferred, not marked implemented.** Task 0 adds a TODO.md line noting
  the deferral and why, so it isn't silently dropped.

The other eight (Ecdysis, The Midnight Trade, The High Sancta, Moon-Miser Herding, The Sous
Catacombs, Upon a Red Stage, To Make a Moth, Scaling the Quartz) get full features, Tasks 1-8.

## Global Constraints

- No panel for any of these eight (user decision) — badges on opportunity cards / storylet
  headings / branch titles only, via `attachBadge` (`choice-helper.js:985`).
- Read names with `headingName(el)` (`choice-helper.js:957`), never `textContent`.
- Every badge's colour must still read from its text/shape alone (red-green-weak reader) —
  `AGENTS.md` "Colour is never the only carrier of a claim".
- `@grant none`: no `GM_*`, inline styles only, one IIFE per script (already satisfied — these
  are additions to the existing `choice-helper.js` IIFE).
- Gate every new feature honestly: **confirm-only** (`currentArea()`-style guess, may say yes,
  never says no) unless a verbatim in-game greeting exists — none does for any of these eight, so
  all eight ship confirm-only, or — where research recommends it — gated on the **opened
  storylet's own heading text** instead of an area guess (Upon a Red Stage, To Make a Moth,
  Scaling the Quartz, per their research sections: these are single fixed storylets, not
  area-wide activities, so the storylet heading is the more precise and lower-risk gate).
- **No table entry may duplicate a name already in another feature's table.** This bites directly
  on Task 7 (To Make a Moth) — see its "must NOT re-add" list.
- Bump `@version` in `FallenLondon/choice-helper.js` **and** `all-in-one/fallen-london.js` once,
  after all eight tasks land (Task 9), not per-task — `bump-loaders.mjs` skips a loader already
  hand-edited, so do the loader bump by hand in the same commit as the last feature.
- `check.mjs` (`.claude/skills/adding-fallen-london-features/check.mjs`) must pass with
  `--feature <name>` after each task, and unscoped after Task 9.

## Review Focus

Five things the spec (the research docs) states plainly but no single task's own tests will catch
unless written in deliberately:

1. **The High Sancta's per-card echo values are the guide's rounded estimate (≈12.5), not a
   fetched number**, except Unsigned in Triplicate (verified 12.60). A test must assert the
   *approximate* marker (`≈`) appears on every card except that one, or a future edit that
   "cleans up" the `≈` silently promotes a guess to a fact.
2. **To Make a Moth's table must contain zero of the nine storylet names `risen-burgundy`
   already owns** (`A Gloomy Summer`, `A Duchess' Disapproval`, `A Disturbance at the Market`,
   `A Night in Ghent`, `A Stranger Out of Time`, `Echoes of Storms Past`, `The Honours of the
   Court`, `Glories and Half-Lives`, `Heralds from Elsewhere`) — a test enumerating that exact
   list against the new table, not just the generic cross-file collision test, since the generic
   test only fires once both tables exist in the same test run.
3. **Ecdysis's table stops at tier 4-5**; a test must assert the table does NOT claim rows for
   tiers 6-21, and the badge function returns `null`/a "range not read past tier 5" spec rather
   than extrapolating a pattern from four rows.
4. **Moon-Miser Herding's risky branches remove a currently-held quality on failure** — the
   tooltip text for those five rows must contain the word "removes" (or equivalent), not just a
   generic "failure" line, or a player reads a quality-destroying miss as harmless.
5. **Scaling the Quartz and The Sous Catacombs both depend on an in-game heading capture that
   hasn't happened** (which storylet screen hosts the climb / what the bone-donation card's real
   heading text is, since the wiki title is a disambiguator). Each task's test suite must assert
   the feature **no-ops safely** (attaches nothing, throws nothing) against a DOM that does not
   contain the guessed heading, so shipping before the capture degrades to silence, not a crash
   or a wrongly-placed badge.

## File Structure

- `FallenLondon/choice-helper.js` — one table + one spec function + one wiring function per task,
  plus one `FEATURES` entry each (Tasks 1-8), one `@version` bump (Task 9).
- `all-in-one/fallen-london.js` — one `@version` bump (Task 9 only).
- `tests/choice-ecdysis.test.mjs`, `tests/choice-midnight-trade.test.mjs`,
  `tests/choice-high-sancta.test.mjs`, `tests/choice-moon-miser-herding.test.mjs`,
  `tests/choice-sous-catacombs.test.mjs`, `tests/choice-red-stage.test.mjs`,
  `tests/choice-to-make-a-moth.test.mjs`, `tests/choice-scaling-quartz.test.mjs` — one new file
  each, harness copied from `tests/choice-port-carnelian.test.mjs` (for `'after'`/branch badges:
  Tasks 6-8) or `tests/choice-fruits-of-the-zee.test.mjs` (for card-draw carousels: Tasks 1-5).
- `TODO.md` — Task 0 (Kinetoculus, Stacks) and each of Tasks 1-8 append `(implemented)` to their
  own line under the Early/Mid/Late Firmament groups (lines 16-29), and add a new row under the
  matching stage in the "Implemented" section (lines 137+) once the feature ships, per the file's
  own stated convention (`TODO.md:10`).
- `README.md` — one row per feature added to `choice-helper.js`'s feature table (Task 9, batched).
- `AGENTS.md` — one section per feature (its own scope, what's not badged, the gating guess) plus
  a line in the **"Not verified in-game"** list per feature that needs a capture (Tasks 3, 5, 8
  explicitly; all eight implicitly, since none has a captured greeting) — batched into Task 9.

---

## Task 0: TODO.md scope notes for Kinetoculus and The Stacks

**Files:**
- Modify: `TODO.md:19` (Kinetoculus line), `TODO.md:18` (The Stacks line)

**Interfaces:** none — documentation only, no code.

- [ ] **Step 1: Mark Kinetoculus implemented with no code**

Change `TODO.md:19` from:
```
    - https://fallenlondon.wiki/wiki/The_Kinetoculus_(Guide) [no area]
```
to:
```
    - https://fallenlondon.wiki/wiki/The_Kinetoculus_(Guide) [no area] (implemented; nothing to
      badge: purely narrative, every emulsion costs the same 200 Stuivers and gives a fixed
      non-competing flavour item, no economic or comparable reward across the 16 lens/location
      combinations)
```

- [ ] **Step 2: Note The Stacks as deferred, not implemented**

Change `TODO.md:18` from:
```
    - https://fallenlondon.wiki/wiki/The_Stacks_(Guide) [The Stacks]
```
to:
```
    - https://fallenlondon.wiki/wiki/The_Stacks_(Guide) [The Stacks] (deferred: ~25 cards,
      Fate/companion-locked content, a hidden state machine gating which cards appear, and the
      guide's own EPA figures disagree by section (5.27 / 9.94 / 6.2-6.3) -- needs its own
      research pass fetching the ~25 option pages before a badge-meaning decision can be made,
      same as discordant-studies and airs-of-london got; see
      docs/superpowers/research/2026-09-27-early-firmament.md section 4)
```

- [ ] **Step 3: Commit**

```bash
git add TODO.md
git commit -m "docs: mark Kinetoculus nothing-to-badge, defer The Stacks"
```

---

## Task 1: Ecdysis

**Files:**
- Modify: `FallenLondon/choice-helper.js` (new section near the other Early-Firmament-shelf
  carousels, e.g. after `airs-of-london` / before `the-hunt-is-on`, `choice-helper.js:36957`)
- Test: `tests/choice-ecdysis.test.mjs`
- Modify: `TODO.md:16`

**Interfaces:**
- Produces: `ecdysisSpec(entry) -> {text, color, title}`, `ecdysisRatings()` (the `FEATURES` run
  function), `ECDYSIS_CLASS`, `ECDYSIS_FLAG` (unique dataset flag/class pair, checked by
  `check.mjs`).

### Data (guide-sourced, `docs/superpowers/research/2026-09-27-early-firmament.md` §1)

Storylet: **Ecdysis: One More Lesson** (Hallow's Throat). Progress quality `Preparing for
Ecdysis` (0→21). Table only covers tiers 1-5 — **do not extrapolate past tier 5**; the badge must
say "not read past tier 5" for anything higher rather than guessing.

```js
// Corrections go here and nowhere else. Source: the guide's own tables (option pages not yet
// cross-checked -- flagged in the tooltip via `guide: true` until they are).
const ECDYSIS_TIERS = [
  { tier: [1], options: [
    { name: 'Will your heart to slow', airs: [1, 41], ch: null, succ: { cp: 2 }, note: 'randomises Bodily Tendency' },
    { name: 'Close your eyes', airs: [20, 80], ch: null, succ: { cp: 2 }, note: 'randomises Bodily Tendency' },
    { name: 'Feel your breathing', airs: [70, 100], ch: null, succ: { cp: 2 }, note: 'randomises Bodily Tendency' },
  ] },
  { tier: [2, 3], options: [
    { name: 'Allow your blood to cool', airs: [1, 40], ch: ['Shapeling Arts + Chthonosophy', 16],
      succ: { cp: 2, tendency: 'down' }, fail: { cp: 2, q: [['Nightmares', 1]] } },
    { name: 'Listen to your humours', airs: null, ch: ['Shapeling Arts + Watchful/50', 16],
      succ: { cp: 2, tendency: 'random' }, fail: { cp: 2, q: [['Nightmares', 1]] } },
    { name: "Assert the mind's dominance over the body", airs: [60, 100], ch: ['Shapeling Arts + Dreaded/2', 16],
      succ: { cp: 2, tendency: 'up' }, fail: { cp: 2, q: [['Nightmares', 1]] } },
    { name: 'Root yourself in place', airs: null, ch: ['Chthonosophy', 8], safe: true,
      succ: { cp: 1 }, fail: { cp: 1 } },
  ] },
  { tier: [4, 5], options: [
    { name: 'Reimagine yourself as something alarming', airs: [1, 51], ch: ['Monstrous Anatomy + Shapeling Arts', 18],
      succ: { cp: 3, tendency: 'down' }, fail: { cp: 3, q: [['Wounds', 1]] } },
    { name: 'Reimagine yourself as something unpredictable', airs: [20, 80], ch: ['Kataleptic Toxicology + Shapeling Arts', 18],
      succ: { cp: 3, tendency: 'random' }, fail: { cp: 3, q: [['Wounds', 1]] } },
    { name: 'Reimagine yourself as something malleable', airs: [50, 100], ch: ['Shapeling Arts', 14],
      succ: { cp: 3, tendency: 'up' }, fail: { cp: 3, q: [['Wounds', 1]] } },
    { name: 'Root yourself in place', airs: null, ch: ['Chthonosophy', 8], safe: true,
      succ: { cp: 2 }, fail: { cp: 1 } },
  ] },
];

// Cash-out, always available: {e}320 + {e}37.5 items, valued {e}53.5. Boons (alternative to
// cash-out, gated on Bodily Tendency + Bodily Reshaping) -- shown in the tooltip, not ranked
// (which Boon is "best" depends on the player's goal, per the skill's step 2 reasoning already
// captured in the research doc).
const ECDYSIS_BOONS = [
  { name: 'Open your eyes', tendency: [1, 20], reshaping: '<3', boon: 'Wide-Eyed (Watchful +5, Reshaping +1)' },
  { name: 'Sharpen yourself', tendency: [21, 40], reshaping: '<2', boon: 'Sharpened (Dangerous +5, Dreaded +1, Reshaping +2)' },
  { name: 'Obscure some of your bones', tendency: [41, 60], reshaping: '<2', boon: 'Partially Boneless (Shadowy +5, Insubstantial +1, Reshaping +2)' },
  { name: 'Smile', tendency: [61, 80], reshaping: '<3', boon: 'Radiant Bearing (Persuasive +5, Reshaping +1)' },
  { name: 'Refashion yourself into something more malleable', tendency: [81, 100], reshaping: '0',
    boon: 'Hallow Vessel (Shapeling Arts +1, Reshaping +3, Nightmares +1)' },
];
```

### Badge meaning (per research recommendation)

**Net CP progress per action** — the success CP value shown plain (1-3), never a computed win
chance (these are stat challenges, not Luck challenges — show the value, mark it, don't guess
success odds, per the skill's "do not quote the advertised half of a coin flip" rule applied in
reverse: here we don't even have the advertised odds). "Root yourself in place" gets a `safe: true`
mark (a shape, e.g. a shield glyph) alongside its lower CP, in words in the tooltip ("no menace,
1 CP less than the risk options"), not colour alone. Tendency drift shown as a secondary mark:
`▲` up, `▼` down, `↻` randomised, `·` unaffected.

```js
function ecdysisColor(cp) {
  // 3 CP is the best available in this table; 1 CP (Root yourself in place at tier 2-3) the worst.
  if (cp >= 3) return '#4a7a3c';
  if (cp === 2) return '#7a733a';
  return '#8a6d3b';
}

function ecdysisSpec(entry) {
  const cp = entry.succ.cp;
  const mark = entry.safe ? ' 🛡' : '';
  const tendencyMark = { down: ' ▼', up: ' ▲', random: ' ↻' }[entry.succ.tendency] || '';
  const text = '+' + cp + ' CP' + mark + tendencyMark;
  const lines = [
    entry.name + (entry.airs ? ' (Bodily Tendency ' + entry.airs[0] + '-' + entry.airs[1] + ')' : ''),
    entry.ch ? 'Challenge: ' + entry.ch[0] + ' ' + entry.ch[1] : 'No challenge.',
    'Success: +' + cp + ' CP' + (entry.succ.tendency ? ', Bodily Tendency ' + entry.succ.tendency : '') + '.',
    entry.fail ? 'Failure: +' + entry.fail.cp + ' CP' +
      (entry.fail.q ? ', ' + entry.fail.q.map(function (q) { return q[0] + ' +' + q[1]; }).join(', ') : '') + '.' : null,
    entry.safe ? 'The only always-available option with no menace risk, at a real cost: 1 CP less than the risky options at this tier.' : null,
    'Not read past tier 4-5 -- higher tiers are not in the source guide and are not extrapolated.',
  ].filter(Boolean).join('\n');
  return { text: text, color: ecdysisColor(cp), title: lines };
}
```

### Traps to encode

- "Root yourself in place" appears at every tier with a *lower* success CP than the risk
  options — the tooltip line above states this in words (Review Focus applies here too: any
  future edit that drops that sentence loses the whole point of the mark).
- Menace gain is capped at 7 (Nightmares/Wounds) — note this in the tooltip rather than
  penalising the badge's colour for it (the guide explicitly recommends tanking, not avoiding).
- "Close your eyes" / "Root yourself in place" are generic English phrases — run the cross-file
  name-collision check (`check.mjs`) before wiring; if any hit, `strict`-gate this feature to a
  confirmed Hallow's Throat greeting rather than aliasing (there is nothing to alias to — these
  are the option's only names).

### Gating

`inHallowsThroat(doc)` — confirm-only, modelled on `currentArea()` returning a string containing
"Hallow" (case-insensitive substring test, same shape as other confirm-only helpers in the file).

- [ ] **Step 1: Add the table and spec function** (code above) to `choice-helper.js`, after the
  `airs-of-london` section (`choice-helper.js:36957`) and before `the-hunt-is-on`.

- [ ] **Step 2: Write `ecdysisRatings()`** badging the storylet heading `Ecdysis: One More
  Lesson` and its branch titles (all option names across `ECDYSIS_TIERS`), gated on
  `inHallowsThroat`, following the same call shape as `vhRatings()` (`choice-helper.js:9194`) if
  the storylet fits the shared `carouselRatings` plumbing, or a direct `.branch__title` walk like
  `pcRatings` otherwise — confirm which at implementation time by checking whether Ecdysis is
  reached via a redirecting card (carousel shape) or opened directly (branch shape); the research
  doc says it's reached "via The Path to the Spleen", which is carousel-shaped, so
  `carouselRatings` is the expected fit.

- [ ] **Step 3: Register in `FEATURES`**

```js
{ name: 'ecdysis', run: ecdysisRatings },
```

- [ ] **Step 4: Write `tests/choice-ecdysis.test.mjs`**, copying the harness from
  `tests/choice-fruits-of-the-zee.test.mjs`. Pin:
  - the table's shape (every tier 1-5 row present, exact CP/challenge/tendency values above)
  - "Root yourself in place" always carries the safe mark and a lower CP than its tier's risk options
  - no row for tier 6+ exists, and the spec function does not synthesize one
  - the tooltip text for every row contains the literal challenge stat/difficulty or "No challenge."
  - gating: `inHallowsThroat` returns true on a greeting containing "Hallow's Throat", false-safe
    (no badge, no throw) on an unrelated greeting, and does not clear a badge from an unrelated
    feature on the same host
  - no name in `ECDYSIS_TIERS` appears in any other feature's table (grep-based check against the
    file, same style as the Fruits of the Zee / factions suites' existing collision test)

- [ ] **Step 5: Run**

```sh
node tests/choice-ecdysis.test.mjs
```
Expected: `All passed` (or the suite's own terminal string — read the actual output).

- [ ] **Step 6: Update `TODO.md:16`**, appending `(implemented)`.

- [ ] **Step 7: Commit**

```bash
git add FallenLondon/choice-helper.js tests/choice-ecdysis.test.mjs TODO.md
git commit -m "feat: badge Ecdysis (Hallow's Throat) carousel"
```

---

## Task 2: The Midnight Trade

**Files:**
- Modify: `FallenLondon/choice-helper.js`
- Test: `tests/choice-midnight-trade.test.mjs`
- Modify: `TODO.md:17`

**Interfaces:**
- Produces: `midnightTradeSpec(entry) -> {text, color, title}`, `midnightTradeRatings()`,
  `MIDNIGHT_TRADE_CLASS`, `MIDNIGHT_TRADE_FLAG`.

### Data (guide-sourced, complete — all 8 rows, research §2)

```js
// Every option gives the SAME Peligin Work progress on success and failure -- there is nothing
// to rank by payout, only by challenge difficulty and which menace a failure risks.
const MIDNIGHT_TRADE_OPTIONS = [
  { name: 'Haul supplies to the Midnight Moon', randomiser: ['Airs of the Leviathan', 0, 33], ch: ['Dangerous', 200], fail: 'Wounds' },
  { name: 'Maintain the candle-guides', randomiser: ['Airs of the Leviathan', 34, 67], ch: ['Watchful', 200], fail: 'Nightmares' },
  { name: 'Offload your duties onto the Once-Dashing Smuggler', randomiser: ['Airs of the Leviathan', 50, 70], ch: null,
    needs: 'Rose companion', checkless: true },
  { name: 'Shuttle contraband through the stalactite', randomiser: ['Airs of the Leviathan', 68, 100], ch: ['Zeefaring', 13], fail: 'Nightmares' },
  { name: 'Load contraband onto departing dirigibles', randomiser: ['Smuggled Airs', 0, 33], ch: ['Dangerous', 200], fail: 'Nightmares' },
  { name: "Conduct Old Resurrection's personal work", randomiser: ['Smuggled Airs', 20, 40], ch: null,
    needs: 'Rose companion + Fate', checkless: true },
  { name: 'Negotiate with visiting captains', randomiser: ['Smuggled Airs', 34, 67], ch: ['Mithridacy', 11], fail: 'Wounds' },
  { name: 'Perform maintenance', randomiser: ['Smuggled Airs', 68, 100], ch: ['Watchful', 200], fail: 'Nightmares' },
];
```

### Badge meaning (per research recommendation)

Since payout doesn't vary, the badge's number is **challenge difficulty** (colour-ramped
cheap→expensive like `zeeColor`, `choice-helper.js:3079`), with the failure menace as a shape
mark and a distinct mark (`✓`) for the two checkless companion options.

```js
function midnightTradeColor(diff) {
  if (diff == null) return '#4a7a3c'; // checkless = best case, always succeeds
  if (diff <= 13) return '#4a7a3c';
  if (diff <= 100) return '#7a733a';
  return '#8a3b3b'; // the 200-difficulty broad checks: likely near-guaranteed fail unread
}

function midnightTradeSpec(entry) {
  if (entry.checkless) {
    return {
      text: '✓ always succeeds',
      color: midnightTradeColor(null),
      title: entry.name + '\nRequires: ' + entry.needs + '. No challenge -- always succeeds.\n'
        + 'Peligin Work progress same as every other option; only available with the right companion equipped.',
    };
  }
  const failMark = entry.fail === 'Wounds' ? ' ▲Wounds' : ' ▲Nightmares';
  return {
    text: entry.ch[0] + ' ' + entry.ch[1] + failMark,
    color: midnightTradeColor(entry.ch[1]),
    title: entry.name + '\nChallenge: ' + entry.ch[0] + ' ' + entry.ch[1] + '.\n'
      + 'Peligin Work progress on success AND failure -- same as every option here.\n'
      + 'Failure also costs ' + entry.fail + ' +1.\n'
      + (entry.ch[1] >= 200 ? 'This is a very high broad check; likely to fail without heavy stat investment.' : ''),
  };
}
```

### Traps to encode

- Both checkless options require a `{{FontRose}}` companion equipped; the second also needs
  Fate. Per the skill's "do not badge a line the player cannot take", these should be **excluded
  from any expected/best-of ranking** (there is no ranking here anyway, so this is just a note in
  the tooltip, not a filtering decision the spec has to make) — show them with the companion
  requirement stated plainly, per the research doc's own caution about not gating them out
  incorrectly without a DOM capture of equipped-companion state.
- "Airs of the Leviathan" and "Smuggled Airs" are **not** the Airs of London quality — no alias
  or `CAROUSEL_PLACEHOLDER` concern.

### Gating

`inMidnightMoon(doc)` — confirm-only, string-contains "Midnight Moon".

- [ ] **Step 1: Add table + spec** to `choice-helper.js`, near Ecdysis (both are Early-Firmament
  carousels — keep the two sections adjacent for the "shelf" comment convention the file already
  uses, e.g. `choice-helper.js:36850` groups Early Zailing together).

- [ ] **Step 2: Write `midnightTradeRatings()`**, badging the storylet heading "The Midnight
  Trade" and its 8 branch options, gated on `inMidnightMoon`.

- [ ] **Step 3: Register in `FEATURES`**: `{ name: 'midnight-trade', run: midnightTradeRatings },`

- [ ] **Step 4: Write `tests/choice-midnight-trade.test.mjs`** (harness from
  `choice-port-carnelian.test.mjs`, since this badges branch titles). Pin: all 8 rows present
  with correct challenge/menace; both checkless rows show `✓ always succeeds` and their companion
  requirement in the tooltip; the 200-difficulty rows get the "very high broad check" tooltip
  line; no name collision with any other table.

- [ ] **Step 5: Run** `node tests/choice-midnight-trade.test.mjs` — expect pass.

- [ ] **Step 6: Update `TODO.md:17`** with `(implemented)`.

- [ ] **Step 7: Commit.**

---

## Task 3: The High Sancta

**Files:**
- Modify: `FallenLondon/choice-helper.js`
- Test: `tests/choice-high-sancta.test.mjs`
- Modify: `TODO.md:22`

**Interfaces:**
- Produces: `highSanctaSpec(entry) -> {text, color, title}`, `highSanctaRatings()`,
  `HIGH_SANCTA_CLASS`, `HIGH_SANCTA_FLAG`.

### Scope decision (per Review Focus #1)

Per-card echo values are the guide's rounded estimate (≈{{e}}12.50), not fetched from each of the
28 option pages. **Ship with the approximate value**, marked with `≈` on every card except
**Unsigned in Triplicate**, which the guide states exactly ({{e}}12.60) — same "one named
exception" precedent as `twFail`. Do not silently promote the estimate to a hard number in a
later edit; if someone later fetches the 28 pages, that is a table correction, not a rewrite of
the spec function.

Sound of Wings burden cards (8 other locations) are **out of scope** for this feature — note as a
follow-up in `AGENTS.md`, do not badge them here (they belong to whichever feature already owns
each of those 8 locations, several of which — Cave of the Nadir — already exist).

### Data (guide-sourced, research §1)

```js
// Every card is ~{{e}}12.50 in items on success (guide's estimate, not per-page verified --
// hence `approx: true` on every row but the one exception). Unsigned in Triplicate is the guide's
// one stated exact figure ({{e}}12.60).
const HIGH_SANCTA_CARDS = [
  // Towards a Violant Sky 1-4
  { name: 'Bleeding In', tier: 1, echo: 12.5, approx: true },
  { name: 'Borrowed Scripts', tier: 1, echo: 12.5, approx: true },
  { name: 'Drowsy Exile', tier: 1, echo: 12.5, approx: true },
  { name: 'First and Last', tier: 1, echo: 12.5, approx: true, needs: 'Family and Law 300-350' },
  { name: 'Laws Unwritten', tier: 1, echo: 12.5, approx: true },
  { name: 'Lost Cheer', tier: 1, echo: 12.5, approx: true, needs: 'Family and Law exactly 300 or 400' },
  { name: 'Molten Forests', tier: 1, echo: 12.5, approx: true },
  { name: 'Pungent Sorrows', tier: 1, echo: 12.5, approx: true },
  { name: 'Statuary', tier: 1, echo: 12.5, approx: true, needs: 'A Finder of Heiresses' },
  { name: 'Stolen Marble', tier: 1, echo: 12.5, approx: true },
  // Towards a Violant Sky 5-8
  { name: 'Chained', tier: 2, echo: 12.5, approx: true, note: 'worth up to {{e}}16.5 at The Rat Market' },
  { name: 'Consortion', tier: 2, echo: 12.5, approx: true },
  { name: 'Coronation', tier: 2, echo: 12.5, approx: true },
  { name: 'Scarred Memories', tier: 2, echo: 12.5, approx: true },
  { name: 'Undying Wish', tier: 2, echo: 12.5, approx: true },
  { name: 'Unsigned in Triplicate', tier: 2, echo: 12.60, approx: false, note: 'pick this one first when drawn (guide)' },
  { name: 'Velvet Dark', tier: 2, echo: 12.5, approx: true },
  { name: "Void's Breath", tier: 2, echo: 12.5, approx: true },
  { name: 'Waning', tier: 2, echo: 12.5, approx: true },
  // Towards a Violant Sky 9-12
  { name: 'Black Ice', tier: 3, echo: 12.5, approx: true },
  { name: 'Discarded Hearts', tier: 3, echo: 12.5, approx: true },
  { name: 'Drowned Wars', tier: 3, echo: 12.5, approx: true },
  { name: 'Hands and Blades', tier: 3, echo: 12.5, approx: true },
  { name: 'Love and Tombstones', tier: 3, echo: 12.5, approx: true },
  { name: 'Months Passing', tier: 3, echo: 12.5, approx: true },
  { name: 'Reliquaries', tier: 3, echo: 12.5, approx: true },
  { name: 'Rescued Hungers', tier: 3, echo: 12.5, approx: true },
  { name: 'Sloughing', tier: 3, echo: 12.5, approx: true },
];
```

### Badge meaning

- **State-1 cards:** badge = echo value (`≈{{e}}12.50` or the exact `{{e}}12.60` for Unsigned in
  Triplicate), colour ramp on the number; tooltip states the item breakdown, any quality/item
  gate, and — for the 27 approximate rows — a sentence that the value is the guide's estimate,
  not a per-card fetch.
- **Stumble onwards:** informational, not a ranking (single forced option) — badge shows the
  run's cumulative EV-so-far and the "chance the run ends here" figure from the Counterlight risk
  table, in the `fotzDepth` "range, not a verdict" style.

```js
const HIGH_SANCTA_RISK = [
  { sky: 1, echoSoFar: 10.0, actions: 4, counterlight: 100, endChance: 0 },
  { sky: 2, echoSoFar: 32.5, actions: 6, counterlight: 100, endChance: 0 },
  { sky: 3, echoSoFar: 55.0, actions: 8, counterlight: 95, endChance: 5 },
  { sky: 4, echoSoFar: 77.5, actions: 10, counterlight: 90, endChance: 9.4 },
  { sky: 5, echoSoFar: 100.03, actions: 12, counterlight: 85, endChance: 12.8 },
  { sky: 6, echoSoFar: 122.57, actions: 14, counterlight: 80, endChance: 14.5 },
  { sky: 7, echoSoFar: 157.6, actions: 16, counterlight: 75, endChance: 14.5 },
  { sky: 8, echoSoFar: 180.13, actions: 18, counterlight: 70, endChance: 13.1 },
  { sky: 9, echoSoFar: 202.63, actions: 20, counterlight: 65, endChance: 10.7 },
  { sky: 10, echoSoFar: 237.63, actions: 22, counterlight: 64, endChance: 7.1 },
  { sky: 11, echoSoFar: 260.13, actions: 24, counterlight: 62, endChance: 4.8 },
  { sky: 12, echoSoFar: 295.13, actions: 26, counterlight: null, endChance: 7.9, note: 'forced exit; {{e}}357.63 with Night-Whisper bonus at Firmament >= 780' },
];

function highSanctaCardColor(echo) {
  if (echo >= 15) return '#9ab73c';
  if (echo >= 12) return '#7a733a';
  return '#8a6d3b';
}

function highSanctaSpec(entry) {
  const val = (entry.approx ? '≈' : '') + '{{e}}' + entry.echo;
  const lines = [
    entry.name,
    'Value: ' + val + (entry.approx ? ' (guide estimate, not fetched per-card).' : ' (guide-verified exact figure).'),
    entry.needs ? 'Requires: ' + entry.needs + '.' : null,
    entry.note || null,
  ].filter(Boolean).join('\n');
  return { text: val, color: highSanctaCardColor(entry.echo), title: lines };
}

function highSanctaRiskSpec(row) {
  const text = row.counterlight != null ? row.counterlight + '% · EV so far {{e}}' + row.echoSoFar
    : 'forced exit · EV so far {{e}}' + row.echoSoFar;
  const lines = [
    'Towards a Violant Sky ' + row.sky + ', ' + row.actions + ' actions so far.',
    row.counterlight != null ? 'Chance of success this round: ' + row.counterlight + '%.' : 'This sky forces an exit.',
    'Chance the run ends at this point: ' + row.endChance + '%.',
    row.note || null,
    'Informational only -- Stumble onwards is a single forced option, nothing to rank.',
  ].filter(Boolean).join('\n');
  return { text: text, color: '#7a733a', title: lines };
}
```

### Traps to encode

- Sound of Wings burden cards excluded from scope (documented above) — a test should assert none
  of the 8 "The Sound of Wings (...)" names appear in this feature's table.
- Counterlight Source currency choice (Anticandle/Memory of Light/Khaganian Lightbulb) is left
  **unbadged** (no acquisition-cost pricing exists in this repo) — do not invent an exchange rate.
- 27 of 28 cards carry `approx: true` — Review Focus #1's test lives here.

### Gating

`inHighSancta(doc)` — confirm-only, string-contains "High Sancta".

- [ ] **Step 1: Add tables + both spec functions** to `choice-helper.js`.
- [ ] **Step 2: Write `highSanctaRatings()`** — badges the 3 card tiers (opportunity-card hand,
  via `eachCardName`) and the Stumble onwards branch (via `.branch__title`, current sky read from
  whichever progress-quality display the storylet screen shows — if `Towards a Violant Sky` isn't
  independently readable from the DOM at implementation time, fall back to badging only the card
  tiers and marking Stumble onwards `null` rather than guessing the sky).
- [ ] **Step 3: Register**: `{ name: 'high-sancta', run: highSanctaRatings },`
- [ ] **Step 4: Write `tests/choice-high-sancta.test.mjs`** (harness from
  `choice-fruits-of-the-zee.test.mjs` for the card-hand part, plus a `.branch__title` case for
  Stumble onwards). Pin: all 27 approx rows carry `≈`, Unsigned in Triplicate does not; the risk
  table's 12 rows match the guide numbers exactly; none of the 8 Sound-of-Wings names appear;
  Stumble onwards badge never claims a win-probability ranking (single option, informational
  only).
- [ ] **Step 5: Run** `node tests/choice-high-sancta.test.mjs`.
- [ ] **Step 6: Update `TODO.md:22`** with `(implemented)`.
- [ ] **Step 7: Add an `AGENTS.md` note** (batched into Task 9) that Sound of Wings cards are an
  explicit follow-up, not silently dropped.
- [ ] **Step 8: Commit.**

---

## Task 4: Moon-Miser Herding

**Files:**
- Modify: `FallenLondon/choice-helper.js`
- Test: `tests/choice-moon-miser-herding.test.mjs`
- Modify: `TODO.md:23`

**Interfaces:**
- Produces: `moonMiserSpec(entry) -> {text, color, title}`, `moonMiserRatings()`,
  `MOON_MISER_CLASS`, `MOON_MISER_FLAG`.

### Data — this guide is complete and guide-verified (research §2); ready to spec as-is

```js
// Risky High-Urgency branches. Failure REMOVES the currently-held quality named in `removes` --
// this must appear in the tooltip in words (Review Focus #4), never folded into a generic
// "failure" line.
const MOON_MISER_RISKY = [
  { card: 'Crag Path', station: 1, option: 'I kept my eyes open', ch: ['Chthonosophy', 2],
    needs: 'Seeing a new Frame of Reference', gives: 'Opening Another Eye +1', removes: 'Seeing a new Frame of Reference' },
  { card: 'Grazing Field', station: 2, option: 'I tasted the nectar', ch: ['Kataleptic Toxicology', 5],
    needs: 'A Mouthful of Light', gives: 'Opening Another Eye +1', removes: 'A Mouthful of Light' },
];
// The three plain "awakening" picks (station 1 Crag Path/We moved in enclosing darkness, etc.)
// have no challenge and no failure -- they are not badge-worthy risk choices, just the safe
// alternative sitting next to the risky one above. Only the two rows with a REAL either/or
// choice (station 1, station 2) get a badge; the rest of the High-Urgency table is flavour with
// no choice to rank (guide: every card clears the hand and raises Stations of the Herd by 1
// regardless of option).

// Gold cash-out cards -- guide gives clean EPA numbers directly.
const MOON_MISER_GOLD = [
  { name: 'Blood of the Stone', option: 'I tasted the stone', epa: 5,
    reward: 'Sample of Roof-Drip x100, Antique Mystery x2, Stone-Hearted +1 CP' },
  { name: 'Fearful Symmetry', option: 'I made a map of what I saw', epa: 5.01,
    reward: 'Roof-Chart x4, Direful Reflection x2, Salt-Veined +1 CP (Roof-Chart sells at Roof markets)' },
  { name: 'Peal of Thunder', option: 'I took the time to hear the thunder', epa: 5.67,
    reward: 'Tempestuous Tale x20, Storm-Threnody x2, Stormy-Eyed +1 CP up to 6 (highest direct payout, guide recommendation)' },
];
```

### Badge meaning (per research recommendation)

- **Risky branches:** shape mark only (`?`), no colour ramp — binary risk/no-risk, not a
  quantity. Tooltip states the challenge, the gain, and **in bold-equivalent wording**
  ("REMOVES", not "loses") that failure removes the prerequisite quality.
- **Gold cards:** EPA, colour-ramped 5→5.67 (`zeeColor`-style), tooltip states the item
  breakdown and that cashing out spends *all* banked Latent Recollections at once.

```js
function moonMiserRiskySpec(entry) {
  return {
    text: '? risky',
    color: '#7a733a',
    title: entry.card + ' -- ' + entry.option + '\nChallenge: ' + entry.ch[0] + ' ' + entry.ch[1] + '.\n'
      + 'Requires: ' + entry.needs + '.\n'
      + 'Success: ' + entry.gives + '.\n'
      + 'Failure REMOVES ' + entry.removes + ' -- not a harmless miss, you lose a quality you already hold.',
  };
}

function moonMiserGoldColor(epa) {
  if (epa >= 5.5) return '#9ab73c';
  if (epa >= 5.1) return '#7a733a';
  return '#8a6d3b';
}

function moonMiserGoldSpec(entry) {
  return {
    text: entry.epa + ' EPA',
    color: moonMiserGoldColor(entry.epa),
    title: entry.name + ' -- ' + entry.option + '\nReward: ' + entry.reward + '.\n'
      + 'Cashes out ALL banked Latent Recollections at once -- time this against your progress toward Stone-Hearted/Salt-Veined/Stormy-Eyed.',
  };
}
```

### Traps to encode

- "We made camp" is reused as an option name on two different cards (Respite Mesa station 1,
  Hiding Place station 2) — the table (and any lookup) must key on **card name**, not option text
  alone. "I sent out my old friend" is the same trap across Alchemical/Violant Moon-Miser.
- Gate on **storylet/card name match**, not `currentArea()` — Zenith is large and unrelated
  content shares its greeting (research §2's own recommendation).

### Gating

Storylet-name gating only (no area dependency): badge only when the visible card/storylet
heading is one of the names in `MOON_MISER_RISKY` / `MOON_MISER_GOLD` / the fixed station table.

- [ ] **Step 1: Add tables + spec functions** to `choice-helper.js`.
- [ ] **Step 2: Write `moonMiserRatings()`** — badges the two risky branch options (via
  `.branch__title`, keyed on card name + option text together, not option text alone) and the
  three gold cards (via `eachCardName`).
- [ ] **Step 3: Register**: `{ name: 'moon-miser-herding', run: moonMiserRatings },`
- [ ] **Step 4: Write `tests/choice-moon-miser-herding.test.mjs`**. Pin: both risky rows' tooltip
  text contains "REMOVES"; the "We made camp" / "I sent out my old friend" lookups resolve to the
  right card given card-name context and do not cross-match; gold card EPAs match 5 / 5.01 / 5.67
  exactly; no name collision.
- [ ] **Step 5: Run** `node tests/choice-moon-miser-herding.test.mjs`.
- [ ] **Step 6: Update `TODO.md:23`** with `(implemented)`.
- [ ] **Step 7: Commit.**

---

## Task 5: The Sous Catacombs

**Files:**
- Modify: `FallenLondon/choice-helper.js`
- Test: `tests/choice-sous-catacombs.test.mjs`
- Modify: `TODO.md:24`

**Interfaces:**
- Produces: `sousBoneSpec(entry) -> {text, color, title}`, `sousCatacombsRatings()`,
  `SOUS_CATACOMBS_CLASS`, `SOUS_CATACOMBS_FLAG`.

### Open item (Review Focus #5) — ship gated to no-op safely

The bone-donation card's real in-game heading is unknown; the wiki title `(Catacombs Chamber)` is
a disambiguator, not what the game shows. **Ship this feature keyed on the option names, matched
wherever they appear** (`eachCardName`/`.branch__title` scan across the whole page, not scoped to
a specific storylet heading) rather than guessing the heading text — the option names themselves
are specific enough (`Human Ribcage`, `Rubbery Skull`, etc.) that a name-based match degrades
safely (no match → no badge) if the heading guess is wrong, whereas a wrong heading gate would
silently badge nothing at all. Note the open item in `AGENTS.md` (Task 9) asking the player to
report the real heading text.

### Data (guide-sourced, complete; research §3 — condensed to the "Total Value" column, which the
guide itself already computed as Stuiver+echo; full per-category tables live in the research
file if a wider tooltip breakdown is wanted later)

```js
// Total Value is the guide's own combined Stuiver/echo figure -- used directly as the badge
// number (research's own recommendation: cleanest of the eight for a straight value ranking).
// % Bonus over raw skeleton value is informational only, shown in the tooltip.
const SOUS_BONES = [
  // Skulls
  { name: 'Rubbery Skull', category: 'Skulls', echo: 6, bonus: 0 },
  { name: 'Horned Skull', category: 'Skulls', echo: 17.88, bonus: 43.04 },
  { name: 'Pentagrammic Skull', category: 'Skulls', echo: 12.88, bonus: 3.04 },
  { name: 'Eyeless Skull', category: 'Skulls', echo: 30.76, bonus: 2.53 },
  { name: 'Sabre-Toothed Skull', category: 'Skulls', echo: 69.90, bonus: 11.84 },
  { name: 'Panoptical Skull', category: 'Skulls', echo: 40.14, bonus: -33.10, warn: true },
  { name: 'Doubled Skull', category: 'Skulls', echo: 64.40, bonus: 3.04 },
  { name: 'Skull in Coral', category: 'Skulls', echo: 17.88, bonus: 2.17 },
  { name: 'Plated Skull', category: 'Skulls', echo: 30.76, bonus: 23.04 },
  // Arms
  { name: 'Knotted Humerus', category: 'Arms', echo: 7.20, bonus: 140 },
  { name: 'Crustacean Pincer', category: 'Arms', echo: 7.20, bonus: null },
  { name: 'Fossilised Forelimb', category: 'Arms', echo: 30.76, bonus: 11.85 },
  { name: 'Ivory Humerus', category: 'Arms', echo: 17.88, bonus: 19.2 },
  { name: 'Human Arm', category: 'Arms', echo: 7.20, bonus: 188 },
  // Ribcages
  { name: 'Human Ribcage', category: 'Ribcages', echo: 17.88, bonus: 43.04, alwaysAvailable: true },
  { name: 'Skeleton with Seven Necks', category: 'Ribcages', echo: 69.90, bonus: 11.84 },
  { name: 'Glim-Encrusted Carapace', category: 'Ribcages', echo: 69.90, bonus: 16.5 },
  { name: 'Segmented Ribcage', category: 'Ribcages', echo: 7.20, bonus: 188 },
  { name: 'Prismatic Frame', category: 'Ribcages', echo: 325, bonus: 4 },
  { name: 'Mammoth Ribcage', category: 'Ribcages', echo: 69.90, bonus: 11.84 },
  { name: 'Ribcage with a Bouquet of Eight Spines', category: 'Ribcages', echo: 322, bonus: 3.04 },
  { name: 'Thorned Ribcage', category: 'Ribcages', echo: 17.88, bonus: 43.04 },
  { name: 'Five-Pointed Ribcage', category: 'Ribcages', echo: 322, bonus: 3.04 },
  { name: 'Flourishing Ribcage', category: 'Ribcages', echo: 17.88, bonus: 43.04 },
  { name: 'Leviathan Frame', category: 'Ribcages', echo: 325, bonus: 4 },
  // Legs
  { name: 'Holy Relic of the Thigh of Saint Fiacre', category: 'Legs', echo: 17.88, bonus: 43.04 },
  { name: 'Ivory Femur', category: 'Legs', echo: 64.40, bonus: -0.93, warn: true },
  { name: 'Femur of a Surface Deer', category: 'Legs', echo: 5.1, bonus: 50 },
  { name: 'Helical Thighbone', category: 'Legs', echo: 7.20, bonus: 140 },
  { name: 'Femur of a Jurassic Beast', category: 'Legs', echo: 7.20, bonus: 140 },
  // Appendages
  { name: "Tomb-Lion's Tail", category: 'Appendages', echo: 7.20, bonus: 188 },
  { name: 'Plaster Tail Bones', category: 'Appendages', echo: 7.20, bonus: 188 },
  { name: 'Albatross Wing', category: 'Appendages', echo: 17.88, bonus: 40 },
  { name: 'Fin Bones, Collected', category: 'Appendages', echo: 5.5, bonus: 100 },
  { name: 'Amber-Crusted Fin', category: 'Appendages', echo: 17.88, bonus: 19.2 },
  { name: 'Withered Tentacle', category: 'Appendages', echo: 5.5, bonus: 120 },
  { name: 'Jet Black Stinger', category: 'Appendages', echo: 5.5, bonus: 100 },
  { name: 'Obsidian Chitin Tail', category: 'Appendages', echo: 7.20, bonus: 44 },
  { name: 'Bat Wing', category: 'Appendages', echo: 5.01, bonus: 500 },
  { name: 'Wing of a Young Terror Bird', category: 'Appendages', echo: 7.20, bonus: 188 },
];
const SOUS_FORGO = { name: 'Forgo the donation', echo: 0, penalty: 'Nightmares +5' };
```

### Badge meaning

Total Value in echoes, colour-ramped (`bestZeeLine`-style "pick the biggest number"). Tooltip
states the % bonus over raw skeleton value, and **explicitly flags Panoptical Skull / Ivory
Femur as below skeleton value despite a large face number** — the same misleading-raw-total trap
`pcColor` hit with nine same-value rows, here it's the raw Offerings integer (tens of thousands)
that would mislead if shown instead of the pre-computed Total Value. Forgo-donation always sorts
last.

```js
function sousBoneColor(echo, warn) {
  if (warn) return '#8a3b3b'; // below skeleton value despite a large face number
  if (echo >= 60) return '#9ab73c';
  if (echo >= 15) return '#7a733a';
  return '#8a6d3b';
}

function sousBoneSpec(entry) {
  if (entry === SOUS_FORGO) {
    return { text: '0 · always worst', color: '#8a3b3b',
      title: 'Forgo the donation: 0 Osseous Offerings, Nightmares +5. Always the worst option available.' };
  }
  const lines = [
    entry.name + ' (' + entry.category + ')',
    'Value: {{e}}' + entry.echo + (entry.bonus != null ? ' (' + entry.bonus + '% over raw skeleton value)' : ''),
    entry.warn ? 'WARNING: pays LESS than its raw skeleton value despite a large Osseous Offerings number -- do not rank by the raw Offerings figure.' : null,
    entry.alwaysAvailable ? 'Always available (not subject to the weekly rotation).' : 'Only offered in some weeks -- badge reflects whatever is actually on the card.',
  ].filter(Boolean).join('\n');
  return { text: '{{e}}' + entry.echo, color: sousBoneColor(entry.echo, entry.warn), title: lines };
}
```

### Traps to encode

- Skip badging **A Labyrinth of Roof and Bone** entirely — guide states it's cosmetic, no reward
  difference (also the exact card the Airs-of-the-Sous retitle table flags — moot since it's
  unbadged, but note it so a future editor doesn't wire it up assuming the retitle work is done).
- Look up by **whatever name is on the rendered option**, not a fixed subset — unmatched names
  return `null` (data gap), never a guessed value.
- Show the pre-computed Total Value, never the raw Osseous Offerings integer.

### Gating

Name-based match only (see "Open item" above) — no `currentArea()`, no storylet-heading gate
until the real heading is captured.

- [ ] **Step 1: Add table + spec** to `choice-helper.js`.
- [ ] **Step 2: Write `sousCatacombsRatings()`** — scans `.branch__title` (and/or opportunity
  cards, whichever the real donation UI turns out to be — guess opened-storylet branches first
  per the guide's "storylet" framing) for any name in `SOUS_BONES` or the forgo option, anywhere
  on the page, badging only exact matches.
- [ ] **Step 3: Register**: `{ name: 'sous-catacombs', run: sousCatacombsRatings },`
- [ ] **Step 4: Write `tests/choice-sous-catacombs.test.mjs`**. Pin: all ~34 bone rows present
  with the guide's exact Total Value figures; Panoptical Skull and Ivory Femur carry `warn: true`
  and their tooltip contains "WARNING"; Forgo always sorts/reads as worst; **against a DOM with
  no matching name at all, the feature attaches nothing and throws nothing** (Review Focus #5).
- [ ] **Step 5: Run** `node tests/choice-sous-catacombs.test.mjs`.
- [ ] **Step 6: Update `TODO.md:24`** with `(implemented)`.
- [ ] **Step 7: Add to `AGENTS.md`'s "Not verified in-game" list**: the real donation-card
  heading text (Task 9).
- [ ] **Step 8: Commit.**

---

## Task 6: Upon a Red Stage

**Files:**
- Modify: `FallenLondon/choice-helper.js`
- Test: `tests/choice-red-stage.test.mjs`
- Modify: `TODO.md:27`

**Interfaces:**
- Produces: `redStageSpec(entry) -> {text, color, title}`, `redStageFinaleSpec(entry) ->
  {text, color, title}`, `redStageRatings()`, `RED_STAGE_CLASS`, `RED_STAGE_FLAG`.

### Classification

Not an opportunity card — an opened storylet with many branches per scene, badged like Port
Carnelian: rank each visible option in the current scene by expected Scarlet Applause. Gate on
the **opened storylet heading** ("On a Red, Red Stage" / "Catastrophe: An Ending"), never an area
guess — per research §1, this only ever runs inside an opened storylet.

### Data (guide-sourced, research §1; main table — 28 rows, condensed to the fields the badge
needs: full challenge stats are in the research file)

```js
// Success/Failure Scarlet Applause. `gate` is availability (act, role, Crimson Airs range,
// genre), never a rankable input -- these narrow which rows are even visible, they don't compete
// with each other on value.
const RED_STAGE_MAIN = [
  { name: 'Exposit', ch: ['Persuasive', 180], succSA: 400, failSA: 350, gate: 'Act 1, Crimson Airs 1-50' },
  { name: 'Improvise an inciting incident', ch: ['Dangerous', 180], succSA: 400, failSA: 350, gate: 'Act 1, Crimson Airs 51-100' },
  { name: 'Soliloquise', ch: ['Persuasive', 250], succSA: 530, failSA: 250, gate: 'Crimson Airs 1-50' },
  { name: 'Embody the role of the (Role)', ch: ['Dangerous', 250], succSA: 530, failSA: 250, gate: 'Crimson Airs 51-100' },
  { name: 'Showboat in dialogue with the Ravenous Thespian', ch: ['Dangerous+Persuasive', 250], succSA: 550, failSA: 0, gate: 'Crimson Airs 1-20, Fate' },
  { name: 'Confer with a ghost', ch: ['Persuasive', 285], succSA: 580, failSA: 200, gate: 'Crimson Airs 38-62, Tragedy' },
  { name: 'Rule', ch: ['Dangerous+Persuasive', 235], succSA: 500, failSA: 270, gate: 'Act 1-2, King, Crimson Airs 26-75' },
  { name: 'Plot', ch: ['Dangerous', 215], succSA: 500, failSA: 270, gate: 'Act 1-2, Queen, Crimson Airs 26-75' },
  { name: 'Yearn', ch: ['Persuasive', 215], succSA: 500, failSA: 270, gate: 'Act 1-2, Knave, Crimson Airs 26-75' },
  { name: 'Condemn a shocking murder', ch: ['Persuasive+Dangerous', 270], succSA: 550, failSA: 200, gate: 'King, Crimson Airs 33-67, Tragedy' },
  { name: 'Perform a shocking murder', ch: ['Dangerous', 250], succSA: 550, failSA: 200, gate: 'Queen, Crimson Airs 33-67, Tragedy' },
  { name: 'Mourn a shocking murder', ch: ['Persuasive', 250], succSA: 550, failSA: 200, gate: 'Knave, Crimson Airs 33-67, Tragedy' },
  { name: 'Threaten a promising union', ch: ['Dangerous+Persuasive', 270], succSA: 550, failSA: 200, gate: 'King, Crimson Airs 33-67, Comedy' },
  { name: 'Seethe over a promising union', ch: ['Dangerous', 215], succSA: 550, failSA: 200, gate: 'Queen, Crimson Airs 33-67, Comedy' },
  { name: 'Pursue a promising union', ch: ['Persuasive', 250], succSA: 550, failSA: 200, gate: 'Knave, Crimson Airs 33-67, Comedy' },
  { name: 'Disguise yourself utterly', ch: ['Persuasive', 285], succSA: 580, failSA: 190, gate: 'Crimson Airs 38-62, Comedy' },
  { name: 'Follow the directions of the Chorus', ch: ['Persuasive', 285], succSA: 580, failSA: 190, gate: 'Crimson Airs 38-62, Firmament-history' },
  { name: 'Feign madness', ch: ['Dangerous', 285], succSA: 580, failSA: 200, gate: 'Act 2-3, Crimson Airs 1-12/89-100, Tragedy' },
  { name: 'Kill a supporting character', ch: ['Dangerous', 250], succSA: 570, failSA: 350, gate: 'Crimson Airs 1-12' },
  { name: 'Seduce a supporting character', ch: ['Persuasive', 250], succSA: 570, failSA: 350, gate: 'Crimson Airs 89-100' },
  { name: 'Uncover a case of mistaken identity', ch: ['Dangerous', 285], succSA: 580, failSA: 190, gate: 'Act 2-3, Crimson Airs 1-12/89-100, Comedy' },
  { name: "Challenge a rival's legitimacy", ch: ['Dangerous', 285], succSA: 580, failSA: 190, gate: 'Crimson Airs 1-12/89-100, Firmament-history' },
  { name: 'Deliver a poetic monologue', ch: ['Persuasive', 215], succSA: 500, failSA: 270, gate: 'Act 2, Crimson Airs 1-50' },
  { name: 'Raise the stakes', ch: ['Dangerous', 215], succSA: 500, failSA: 270, gate: 'Act 2, Crimson Airs 51-100' },
  { name: 'Engineer a moment of anagnorisis', ch: ['Persuasive', 285], succSA: 580, failSA: 200, gate: 'Act 3, Crimson Airs 1-50' },
  { name: "Exploit the (Character)'s hamartia", ch: ['Dangerous', 285], succSA: 580, failSA: 200, gate: 'Act 3, Crimson Airs 51-100' },
  { name: 'Leave the stage for a scene', ch: ['Persuasive', 215], succSA: 500, failSA: 270, gate: 'Crimson Airs 1-50' },
  { name: "Intrude on a scene you're not meant to be in", ch: ['Dangerous', 215], succSA: 500, failSA: 270, gate: 'Crimson Airs 51-100' },
];

// Scene 5, Act II: 10 intermission cards, ALL pay the same flat 650/250 SA -- the only
// differentiator is which of six stats the drawn card uses, a Myself-tab read, not a fixed
// ranking. Do not badge these with a computed "best" -- show each card's check and let the
// player compare against their own stats (their number, on the Myself tab, not ours to guess).
const RED_STAGE_HAZARD = [
  { name: 'Intermission: A Flash of Bone', stat: 'Shapeling Arts' },
  { name: 'Intermission: A Smile from the Mirror', stat: 'Glasswork' },
  { name: 'Intermission: A Twist in the Gut', stat: 'Kataleptic Toxicology' },
  { name: 'Intermission: Death from the Machine', stat: 'Artisan of the Red Science' },
  { name: 'Intermission: A Chorus in Opposition', stat: 'A Player of Chess' },
  { name: 'Intermission: A Stain on the Boards', stat: 'Watchful', gate: 'Comedy' },
  { name: 'Intermission: A Steel Compulsion', stat: 'Shadowy', gate: 'Tragedy' },
  { name: 'Intermission: Presentiments of Usurpation', stat: 'Respectable', gate: 'King' },
  { name: 'Intermission: Red Suspicion', stat: 'Dreaded', gate: 'Queen' },
  { name: 'Intermission: Covetous Heirs', stat: 'Bizarre', gate: 'Knave' },
];

// Finale -- NOT symmetric: Dangerous-check rows give Wounds on success / Nightmares on failure;
// Persuasive-check rows the reverse. A table field carries the exact CP+type, never a shared bucket.
const RED_STAGE_FINALE = [
  { name: 'Usurp the role of King', ch: ['Dangerous', 320], red: 'Red Rapture', role: 'not King', succSA: 675, succMenace: ['Wounds', 3], failSA: 220, failMenace: ['Nightmares', 4] },
  { name: 'Usurp the role of Queen', ch: ['Dangerous', 320], red: 'Red Thirst', role: 'not Queen', succSA: 675, succMenace: ['Wounds', 3], failSA: 220, failMenace: ['Nightmares', 4] },
  { name: 'Usurp the role of Knave', ch: ['Dangerous', 320], red: 'Red Hunger', role: 'not Knave', succSA: 675, succMenace: ['Wounds', 3], failSA: 220, failMenace: ['Nightmares', 4] },
  { name: 'Resist the temptation of bloodshed', ch: ['Persuasive', 200], red: 'Red Rapture (King)', role: 'King', succSA: 450, succMenace: ['Nightmares', 1], failSA: 250, failMenace: ['Wounds', 2] },
  { name: 'Resist the temptation of bloodshed', ch: ['Persuasive', 200], red: 'Red Thirst (Queen)', role: 'Queen', succSA: 450, succMenace: ['Nightmares', 1], failSA: 250, failMenace: ['Wounds', 2] },
  { name: 'Resist the temptation of bloodshed', ch: ['Persuasive', 200], red: 'Red Hunger (Knave)', role: 'Knave', succSA: 450, succMenace: ['Nightmares', 1], failSA: 250, failMenace: ['Wounds', 2] },
  { name: 'Deliver a final epilogue', ch: ['Persuasive', 320], red: 'Red Rapture (King)', role: 'King', succSA: 675, succMenace: ['Nightmares', 3], failSA: 220, failMenace: ['Wounds', 4] },
  { name: 'Deliver a final epilogue', ch: ['Persuasive', 320], red: 'Red Thirst (Queen)', role: 'Queen', succSA: 675, succMenace: ['Nightmares', 3], failSA: 220, failMenace: ['Wounds', 4] },
  { name: 'Deliver a final epilogue', ch: ['Persuasive', 320], red: 'Red Hunger (Knave)', role: 'Knave', succSA: 675, succMenace: ['Nightmares', 3], failSA: 220, failMenace: ['Wounds', 4] },
  { name: 'Abandon your part', ch: ['Dangerous', 200], red: 'Red Rapture (King)', role: 'King', succSA: 450, succMenace: ['Wounds', 1], failSA: 250, failMenace: ['Wounds', 2] },
  { name: 'Abandon your part', ch: ['Dangerous', 200], red: 'Red Thirst (Queen)', role: 'Queen', succSA: 450, succMenace: ['Wounds', 1], failSA: 250, failMenace: ['Wounds', 2] },
  { name: 'Abandon your part', ch: ['Dangerous', 200], red: 'Red Hunger (Knave)', role: 'Knave', succSA: 450, succMenace: ['Wounds', 1], failSA: 250, failMenace: ['Wounds', 2] },
];
```

### Badge meaning

Expected Scarlet Applause (`succSA * p + failSA * (1-p)`, using the player's own broad/narrow
chance — same machinery as `bestZeeLine`/Port Carnelian). Finale rows additionally mark which
menace they spend and how much (`▲Wounds+3` / `▲Nightmares+4`) since two Finale rows can tie on
SA and only the menace choice separates them (`pcColor`/`pcPaint` reasoning: colour the axis that
actually varies). Main-table and Hazard rows that have no real ranking (Parabasis, the 10
identical-payout Hazard cards) get a tooltip-only note, not an EV badge.

```js
function redStageSpec(entry) {
  // p is read at render time from the page's own displayed success chance where available;
  // this function takes it as a parameter so it stays pure and testable.
  return function (p) {
    const ev = Math.round(entry.succSA * p + entry.failSA * (1 - p));
    return {
      text: '~' + ev + ' SA',
      color: ev >= 500 ? '#9ab73c' : ev >= 350 ? '#7a733a' : '#8a6d3b',
      title: entry.name + '\nChallenge: ' + entry.ch[0] + ' ' + entry.ch[1] + '.\n'
        + 'Gate: ' + entry.gate + '.\n'
        + 'Success ' + entry.succSA + ' SA / Failure ' + entry.failSA + ' SA.',
    };
  };
}

function redStageFinaleSpec(entry) {
  return function (p) {
    const ev = Math.round(entry.succSA * p + entry.failSA * (1 - p));
    return {
      text: '~' + ev + ' SA ▲' + entry.succMenace[0] + '+' + entry.succMenace[1],
      color: ev >= 600 ? '#9ab73c' : '#7a733a',
      title: entry.name + ' (' + entry.role + ', ' + entry.red + ')\n'
        + 'Challenge: ' + entry.ch[0] + ' ' + entry.ch[1] + '.\n'
        + 'Success: ' + entry.succSA + ' SA, ' + entry.succMenace[0] + ' +' + entry.succMenace[1] + '.\n'
        + 'Failure: ' + entry.failSA + ' SA, ' + entry.failMenace[0] + ' +' + entry.failMenace[1] + '.\n'
        + 'Not symmetric -- success and failure spend DIFFERENT menaces here.',
    };
  };
}
```

### Traps to encode

- Generic option names ("Rule", "Plot", "Yearn", "Exposit") — gated to the opened "On a Red, Red
  Stage" / "Catastrophe: An Ending" storylet heading, never an area guess (`strict`-equivalent by
  construction, since the gate IS the storylet heading).
- Finale success/failure menace columns are **not mirrored** — table field carries exact
  CP+type pairs, never a shared "menace" bucket (encoded above via `succMenace`/`failMenace`).
- Hazard's 10 cards pay identical flat SA — badge shows the check stat, not a fabricated ranking.

### Gating

Opened-storylet-heading match: `.storylet-root__heading` / ancestor of `.branch__title` reads "On
a Red, Red Stage" or "Catastrophe: An Ending" — confirm-only in the sense that an unmatched
heading means no badge, never a false negative on the right one.

- [ ] **Step 1: Add all three tables + both spec functions** to `choice-helper.js`, in a section
  modelled on `pcRatings` (Port Carnelian) since this is branch-only, no cards.
- [ ] **Step 2: Write `redStageRatings()`** — walks `.branch__title` under the two storylet
  headings, matches each visible option name against `RED_STAGE_MAIN`/`RED_STAGE_FINALE`, reads
  the player's success chance the same way `pcRatings` does (if it does — check its exact
  mechanism at implementation time; if no live-chance read exists yet, ship with `p` defaulted to
  a stated assumption in the tooltip, e.g. "assumes a passing check", rather than inventing a
  DOM read that hasn't been verified).
- [ ] **Step 3: Register**: `{ name: 'upon-a-red-stage', run: redStageRatings },`
- [ ] **Step 4: Write `tests/choice-red-stage.test.mjs`** (harness from
  `choice-port-carnelian.test.mjs`). Pin: all 28 main rows + 12 finale rows present with exact
  SA/menace figures; Finale rows' success/failure menace never share a bucket (assert
  `succMenace[0] !== failMenace[0]` is sometimes true, sometimes false, matching the table, i.e.
  the test reads the real per-row values rather than assuming symmetry); Hazard cards never
  receive a computed "best" ranking; generic names ("Rule", "Plot", "Yearn") only badge under the
  matching storylet heading, not elsewhere.
- [ ] **Step 5: Run** `node tests/choice-red-stage.test.mjs`.
- [ ] **Step 6: Update `TODO.md:27`** with `(implemented)`.
- [ ] **Step 7: Commit.**

---

## Task 7: To Make a Moth

**Files:**
- Modify: `FallenLondon/choice-helper.js`
- Test: `tests/choice-to-make-a-moth.test.mjs`
- Modify: `TODO.md:28`

**Interfaces:**
- Produces: `motySpec(entry) -> {text, color, title}`, `toMakeAMothRatings()`,
  `MOTH_CLASS`, `MOTH_FLAG`.

### CRITICAL scope boundary (Review Focus #2)

`risen-burgundy` (`choice-helper.js:36972`, table ~line 11302) **already badges** these nine
storylets' branches as menace-farming sources for this same guide's prerequisite grind:
`A Gloomy Summer`, `A Duchess' Disapproval`, `A Disturbance at the Market`, `A Night in Ghent`,
`A Stranger Out of Time`, `Echoes of Storms Past`, `The Honours of the Court`,
`Glories and Half-Lives`, `Heralds from Elsewhere`. **None of these nine names, or any of their
branch option text, may appear in this feature's table.** This feature covers **only** the "To
Make a Moth" storylet's own 14-row branch table below.

### Data (guide- and storylet-page-verified, research §2)

```js
// One field must not collapse two different claims (skill trap #4): tier 20's two options spend
// NON-comparable currencies (a menace CP vs. an item-availability requirement) -- carried as
// separate fields (`consumes` is a menace/quality CP, `needsItem` is an item-availability gate),
// never reduced to one number.
const MOTH_STEPS = [
  { level: [0, 11], name: 'Make dye from your aches and pains', stuiver: 1250, ch: ['Kataleptic Toxicology + Neathproofed', 5], consumes: ['Wounds', 10], gives: 'Silk Scrap x3000', failMenace: null },
  { level: [0, 11], name: 'Make dye from your fears and nightmares', stuiver: 1250, ch: ['Kataleptic Toxicology + Neathproofed', 5], consumes: ['Nightmares', 10], gives: 'Silk Scrap x3000', failMenace: ['Wounds', 2] },
  { level: [0, 11], name: 'Make pigment from your social missteps', stuiver: 1250, ch: ['Kataleptic Toxicology + Neathproofed', 5], consumes: ['Scandal', 10], gives: 'Silk Scrap x3000', failMenace: ['Scandal', 2] },
  { level: [0, 11], name: 'Make dye from your guilt and mischief', stuiver: 1250, ch: ['Kataleptic Toxicology + Neathproofed', 5], consumes: ['Suspicion', 10], gives: 'Silk Scrap x3000', failMenace: ['Wounds', 2] },
  { level: [12, 13], name: 'Pulp your own good name', stuiver: 1250, ch: ['Kataleptic Toxicology + Neathproofed', 15], consumes: ['Notability', 1], needsAtLeast: 5, gives: 'Silk Scrap x3000', failMenace: ['Scandal', 2] },
  { level: [14], name: 'Create a ducal dye', stuiver: 5625, ch: ['Kataleptic Toxicology + Neathproofed', 16], consumes: ['Burgundian Beneficence', 5], gives: 'Silk Scrap x9000', failMenace: ['Scandal', 2] },
  { level: [14], name: 'Extract a rebellious dye', stuiver: 5625, ch: ['Kataleptic Toxicology + Neathproofed', 16], consumes: ['Against Time and Kings', 5], gives: 'Silk Scrap x9000', failMenace: ['Wounds', 2] },
  { level: [15], name: 'Create a pigment of absence', stuiver: 5625, ch: ['Kataleptic Toxicology + Neathproofed', 19], consumes: ['Irrigo (consumed)', 1], gives: 'Silk Scrap x3000', failMenace: ['Wounds', 2] },
  { level: [16], name: "Affix the city's judgement in colour", stuiver: 5625, ch: ['Kataleptic Toxicology + Neathproofed', 21], consumes: ['Judged by the Duchy (not consumed)', 1], gives: 'Silk Scrap x3000', failMenace: ['Scandal', 2] },
  { level: [17], name: 'Offer hues of all that you could have been, and are no longer', stuiver: 3250, ch: ['Kataleptic Toxicology + Neathproofed', 24], needsItem: 'Memory of a Much Lesser Self x10, Memory of a Much Stranger Self x10', gives: 'Silk Scrap x9000', failMenace: ['Wounds', 2] },
  { level: [18], name: 'Provide a concentrate of purest self-assurance', stuiver: 5625, ch: null, needsItem: 'Concentrate of Self x1', gives: 'Silk Scrap x9000', failMenace: null },
  { level: [19], name: 'Ask what he means', stuiver: 0, ch: null, gives: 'flavour only, advances to level 20', failMenace: null },
  { level: [20], name: 'Offer a body that is you and is not', stuiver: 31250, ch: null, needsQuality: 'Discordant Law: Someone Following You = 1, Discordant Studies (level)', consumes: ['A Bringer of Death', 1], gives: 'A Metamorphosed Moth-Self', failMenace: null },
  { level: [20], name: 'Offer a substitute body, and the promise of your transformation', stuiver: 31250, ch: null, needsItem: 'Soothe & Cooper Long-Box x1, Wings of Change (consumed)', gives: 'A Metamorphosed Moth-Self (no Bringer of Death)', failMenace: null },
];
```

### Badge meaning (per research recommendation)

**Not** an expected-value ranking (most tiers have exactly one real option). Port
Carnelian-style running total: each branch's badge shows its own action cost (Stuiver + challenge
% + what menace/item/quality it consumes) and, where a tier has two options (14 and 20), the
badge marks which currency each spends so they read as different rather than "both fine".

```js
function mothColor(entry) {
  if (entry.failMenace) return '#8a6d3b'; // spends a menace on failure
  return '#4a7a3c'; // no menace risk (item/quality-gated instead)
}

function mothSpec(entry) {
  const cost = entry.consumes ? entry.consumes[0] + ' -' + entry.consumes[1]
    : entry.needsItem ? 'needs: ' + entry.needsItem
    : entry.needsQuality ? 'needs: ' + entry.needsQuality
    : 'free';
  const text = (entry.stuiver ? entry.stuiver + 's · ' : '') + cost;
  const lines = [
    entry.name + ' (Autolepidopterist ' + entry.level.join('-') + ')',
    entry.stuiver ? 'Costs ' + entry.stuiver + ' Stuiver.' : null,
    entry.ch ? 'Challenge: ' + entry.ch[0] + ' ' + entry.ch[1] + '.' : 'No challenge.',
    entry.consumes ? 'Spends: ' + entry.consumes[0] + ' ' + entry.consumes[1] + ' CP.' : null,
    entry.needsAtLeast ? 'Requires at least ' + entry.needsAtLeast + '.' : null,
    entry.needsItem ? 'Requires items: ' + entry.needsItem + '.' : null,
    entry.needsQuality ? 'Requires: ' + entry.needsQuality + '.' : null,
    'Gives: ' + entry.gives + '.',
    entry.failMenace ? 'Failure: ' + entry.failMenace[0] + ' +' + entry.failMenace[1] + '.' : null,
    entry.level[0] === 14 ? "This tier's two options are NOT comparable by value -- one spends a menace, the other a different progress quality; pick by which you have 5 of." : null,
    entry.level[0] === 20 ? 'This tier\'s two options spend NON-comparable currencies: a Bringer of Death CP vs. a hard-to-get item set (Soothe & Cooper Long-Box needs Against Time and Kings; Wings of Change needs a failed Counterlight check in The High Sancta).' : null,
  ].filter(Boolean).join('\n');
  return { text: text, color: mothColor(entry), title: lines };
}
```

### Traps to encode

- **The exclusion list above is the whole point of this task** — a test must enumerate the nine
  excluded storylet names and their known branch option text and assert none appear in
  `MOTH_STEPS` or anywhere this feature's wiring touches.
- Tier 0-11's four options' failure text is a guide **summary rule** ("Wounds/Scandal trading
  gives Scandal +2, Nightmares/Suspicion trading gives Wounds +2"), not four confirmed per-option
  numbers — the table above already encodes the two pairs correctly per that rule, but flag in a
  comment that individual option pages should confirm this before it's treated as beyond doubt.
- Tier 14 and tier 20 are real either/or choices between **non-comparable currencies** — the
  tooltip states this in words (encoded above), never reduced to a single comparable number.

### Gating

Confirm-only, on the opened storylet heading "To Make a Moth" (same reasoning as Upon a Red
Stage — a single fixed storylet, not an area).

- [ ] **Step 1: Add table + spec** to `choice-helper.js`, in a section that explicitly
  cross-references `risen-burgundy`'s line number and the excluded name list (as a code comment,
  matching the file's own convention of explaining feature boundaries in prose above the table).
- [ ] **Step 2: Write `toMakeAMothRatings()`** — walks `.branch__title` under the "To Make a
  Moth" storylet heading only.
- [ ] **Step 3: Register**: `{ name: 'to-make-a-moth', run: toMakeAMothRatings },` — placed
  immediately after `risen-burgundy` in `FEATURES` (`choice-helper.js:36972`), matching the file's
  convention of grouping features that share scope boundaries.
- [ ] **Step 4: Write `tests/choice-to-make-a-moth.test.mjs`**. Pin: all 14 rows present;
  **an explicit test enumerating the 9 excluded storylet names and asserting none appear in
  `MOTH_STEPS`**; tier 14 and tier 20 tooltips each contain the non-comparable-currencies
  sentence; gating only fires under the "To Make a Moth" heading.
- [ ] **Step 5: Run** `node tests/choice-to-make-a-moth.test.mjs`.
- [ ] **Step 6: Update `TODO.md:28`** with `(implemented)`.
- [ ] **Step 7: Commit.**

---

## Task 8: Scaling the Quartz

**Files:**
- Modify: `FallenLondon/choice-helper.js`
- Test: `tests/choice-scaling-quartz.test.mjs`
- Modify: `TODO.md:29`

**Interfaces:**
- Produces: `quartzSpec(entry) -> {text, color, title}`, `scalingQuartzRatings()`,
  `QUARTZ_CLASS`, `QUARTZ_FLAG`.

### Open item (Review Focus #5) — same "ship safe, don't guess the heading" approach as Task 5

The guide names three different storylet titles ("The Heights of the Gift", "Parietals and the
Light", "Preparing for a Climb") without saying which hosts the action list itself. **Gate on
option-name match under whichever opened-storylet heading is present** (same reasoning as Task
5): if the real heading later turns out to be different from what's guessed, a name-based match
degrades to silence rather than a wrongly-placed badge. Note the open item in `AGENTS.md`.

### Data (guide-sourced, spot-checked against the option page for row 1; research §3)

```js
// Grip cost per action (non-rest) = 4 + Momentum + Flexibility + Static Charge (success),
// 7 + ... (failure). Height gained = 5 + 3*Momentum (success), 3 + 2*Momentum (failure). These
// are read from the player's OWN Myself-tab qualities at render time -- the spec function below
// takes them as parameters and stays pure.
const QUARTZ_ACTIONS = [
  { name: 'Haul yourself over a steep overhang', airs: [0, 30], ch: ['Dangerous', 235, '+25xFlexibility'], succFec: 575, failFec: 400, failWounds: 2 },
  { name: 'Scrabble up a sheer rockface', airs: [31, 60], ch: ['Watchful', 235, '+25xFlexibility'], succFec: 575, failFec: 400, failWounds: 2 },
  { name: 'Test your weight against the foliage', airs: [61, 90], ch: ['Shadowy', 235, '+25xFlexibility'], succFec: 575, failFec: 400, failWounds: 2 },
  { name: 'Accelerate', airs: [11, 46], ch: ['Dangerous', 210, '+25xFlexibility+15xInerrant'], succFec: 600, failFec: 420, failWounds: 2, growth: 'Momentum +1 (both outcomes)' },
  { name: 'Stretch yourself beyond your limits', airs: [0, 90, 100], ch: ['Shadowy', 210, '+25xFlexibility+15xInsubstantial'], succFec: 550, failFec: 420, failWounds: 2, growth: 'Flexibility +1 (both outcomes)' },
  { name: 'Follow the mist', airs: [56, 90], ch: ['Kataleptic Toxicology', 9, '+Flexibility+Neathproofed'], succFec: 600, failFec: 420, failWounds: 3, succWounds: 2, growth: 'Static Charge +2, Tempestuous Tale +1 (both outcomes)' },
  { name: 'A moment of stillness', airs: [0, 90, 100], ch: null, succFec: 350, note: 'resets Momentum/Flexibility/Static Charge; no challenge, not a rankable choice' },
  { name: 'Grab hold of something', airs: [91, 93], ch: ['Dangerous', 260, '+25xFlexibility-20xMomentum'], succFec: 600, failFec: 400, failWounds: 2 },
  { name: 'Hold yourself still', airs: [94, 96], ch: ['Dangerous', 260, '-10xFlexibility'], succFec: 600, failFec: 400, failWounds: 2 },
  { name: 'Hide yourself', airs: [97, 99], ch: ['Shadowy', 260, '-10xStaticCharge'], succFec: 600, failFec: 400, failWounds: 2 },
  { name: 'An opportunity to rest', airs: [100], ch: null, note: 'Grip Strength +31-46, Wounds -5 CP; no challenge, not a rankable choice' },
];
```

### Badge meaning (per research recommendation)

Expected Crystalline Fecundity **per Grip spent** (`succFec*p + failFec*(1-p)`, divided by the
action's own Grip cost — itself `4/7 + Momentum + Flexibility + Static Charge`, read from the
player's Myself tab at render time). Mark "Accelerate" and "Stretch yourself beyond your limits"
with `▲` since their value compounds over the rest of the climb and a flat EPA-per-Grip number
underrates them — state why in the tooltip (skill step 8).

```js
function quartzGripCost(momentum, flexibility, staticCharge, success) {
  return (success ? 4 : 7) + momentum + flexibility + staticCharge;
}

function quartzSpec(entry, momentum, flexibility, staticCharge, p) {
  if (!entry.ch) {
    return { text: entry.name.indexOf('rest') !== -1 ? 'rest (not ranked)' : 'reset (not ranked)',
      color: '#7a733a', title: entry.name + '\n' + entry.note };
  }
  const succGrip = quartzGripCost(momentum, flexibility, staticCharge, true);
  const failGrip = quartzGripCost(momentum, flexibility, staticCharge, false);
  const ev = (entry.succFec * p) / succGrip + (entry.failFec * (1 - p)) / failGrip;
  const growthMark = entry.growth ? ' ▲' : '';
  const lines = [
    entry.name,
    'Challenge: ' + entry.ch[0] + ' ' + entry.ch[1] + ' ' + entry.ch[2] + '.',
    'Success: Fecundity x' + entry.succFec + '.',
    'Failure: Fecundity x' + entry.failFec + (entry.failWounds ? ', Wounds +' + entry.failWounds + ' CP' : '') + '.',
    entry.growth ? entry.growth + ' -- this compounds over the rest of the climb; the flat EV/Grip number below underrates it.' : null,
  ].filter(Boolean).join('\n');
  return { text: Math.round(ev * 10) / 10 + ' Fec/Grip' + growthMark, color: ev >= 90 ? '#9ab73c' : '#7a733a', title: lines };
}
```

### Traps to encode

- Short, ordinary option names ("Accelerate", "A moment of stillness") — gate to the opened
  climb storylet heading, `strict`-equivalent by construction.
- Modifiers subtract on some actions ("Grab hold of something" is `-20xMomentum`) — the `ch`
  field's third element carries the exact sign string, never assumed additive.
- "An opportunity to rest" and "A moment of stillness" have no check — excluded from any EV
  ranking, tooltip/reference only (encoded above via `!entry.ch`).
- The current `Airs of the Antipelago` value (which action is even offered) is not confirmed
  readable from the DOM — if no capture exists at implementation time, badge every action that
  could theoretically be offered rather than filtering by a guessed current-Airs value.

### Gating

Confirm-only, opened-storylet-heading match (name unconfirmed among the three guide-named
titles — implementer picks the one actually rendering the action list, verified at
implementation time via a live capture or by trying the DOM against a description of the page
the user can provide).

- [ ] **Step 1: Add table + spec** to `choice-helper.js`.
- [ ] **Step 2: Write `scalingQuartzRatings()`** — reads Momentum/Flexibility/Static Charge from
  the Myself-tab scrape already shared across the file (`choice-helper.js:1145` area — the same
  scrape `captureFotzState`/others use), walks `.branch__title` under the climb storylet.
- [ ] **Step 3: Register**: `{ name: 'scaling-quartz', run: scalingQuartzRatings },`
- [ ] **Step 4: Write `tests/choice-scaling-quartz.test.mjs`**. Pin: all 11 actions present with
  exact Fecundity/Wounds/growth figures; "Accelerate" and "Stretch yourself beyond your limits"
  carry the `▲` mark and the compounding-value tooltip sentence; "An opportunity to rest" and "A
  moment of stillness" never receive an EV/Grip number; **against a DOM with none of the guessed
  storylet headings present, the feature attaches nothing and throws nothing** (Review Focus #5).
- [ ] **Step 5: Run** `node tests/choice-scaling-quartz.test.mjs`.
- [ ] **Step 6: Update `TODO.md:29`** with `(implemented)`.
- [ ] **Step 7: Commit.**

---

## Task 9: Metadata, docs, and full-suite verify

**Files:**
- Modify: `FallenLondon/choice-helper.js` (`@version` bump)
- Modify: `all-in-one/fallen-london.js` (`@version` bump, by hand)
- Modify: `README.md` (feature table rows)
- Modify: `AGENTS.md` (one section per feature + "Not verified in-game" entries)
- Modify: `TODO.md` (move the eight guides from the open list into the "Implemented" section
  under their correct Firmament stage, per the file's own layout, `TODO.md:137+`)

- [ ] **Step 1: Bump `@version`** in `FallenLondon/choice-helper.js`'s `// ==UserScript==` block
  (one bump covering all eight features landing together) and in `all-in-one/fallen-london.js`'s
  matching `@require` version, by hand.

- [ ] **Step 2: Extend the feature write-up block comment** right after
  `// ==/UserScript==` in `choice-helper.js`, one short bullet per new feature (Ecdysis, The
  Midnight Trade, The High Sancta, Moon-Miser Herding, The Sous Catacombs, Upon a Red Stage, To
  Make a Moth, Scaling the Quartz) — keep `@description` itself unchanged (one line).

- [ ] **Step 3: Add a row per feature to `README.md`**'s `choice-helper.js` feature table.

- [ ] **Step 4: Add an `AGENTS.md` section per feature**, each stating: what it badges, what's
  deliberately excluded (Sound of Wings for High Sancta; the nine `risen-burgundy`-owned
  storylets for To Make a Moth; Sous Catacombs' Labyrinth walk), and the gating guess used.

- [ ] **Step 5: Add to `AGENTS.md`'s "Not verified in-game" list**, one line per feature — all
  eight, since none has a captured greeting, with two flagged as needing more than a greeting:
  - The Sous Catacombs: the real donation-card heading (wiki title is a disambiguator)
  - Scaling the Quartz: which of the three guide-named storylets hosts the climb's action list,
    and whether the current `Airs of the Antipelago` value is readable anywhere on screen

- [ ] **Step 6: Move each of the eight guide lines from `TODO.md`'s open Firmament groups
  (lines 16-29) into the "Implemented" section** (`TODO.md:137+`), under a new or existing
  "Early/Mid/Late Firmament" heading matching the file's existing per-stage grouping, each row
  reading `(implemented)`.

- [ ] **Step 7: Run the full verify sequence**

```sh
node --check FallenLondon/choice-helper.js
node .claude/skills/adding-fallen-london-features/check.mjs
for t in tests/*.test.mjs; do node "$t" | tail -1; done
node scripts/bump-loaders.mjs --check
```

Read each suite's actual final line rather than grepping for one string — they end with three
different phrases (`All passed`, `All checks passed.`, `all good`).

- [ ] **Step 8: Commit**

```bash
git add FallenLondon/choice-helper.js all-in-one/fallen-london.js README.md AGENTS.md TODO.md
git commit -m "docs: version bump and write-up for the 8 Firmament guide badges"
```

---

## Self-Review

**Spec coverage:** all 8 guides from the confirmed TODO.md scope have a task; Kinetoculus and
The Stacks are explicitly handled (no-code mark / deferral) in Task 0 rather than silently
dropped from the "first 10" the user asked for.

**Placeholder scan:** every task carries real transcribed numbers from the research files; the
five items that are genuinely unresolved (High Sancta's 27 approximate echo values, Ecdysis
tiers 6+, Sous Catacombs' real heading, Scaling the Quartz's hosting storylet and Airs-of-the-
Antipelago readability, Upon a Red Stage's live success-chance read) are each named as an open
item with a stated fallback behavior (ship approximate-and-marked, ship gated-to-safe-no-op,
never a guessed number presented as fact) rather than left as a bare TODO.

**Type consistency:** every spec function returns `{text, color, title}` (Task 6/8 wrap it in a
function of `p`/player-quality parameters, consistent with how a live-stat-dependent badge must
be computed at render time rather than baked into the table — this matches the existing
`bestZeeLine`/Port Carnelian pattern of computing at call time, not table-authoring time).

**Review Focus:** all five items each have a task-owned test named above (Task 3 step 4, Task 7
step 4, Task 1 step 4, Task 4 step 4, Tasks 5 & 8 step 4).

## Execution Handoff

Plan saved to `docs/superpowers/plans/2026-09-27-firmament-guide-badges.md`. Please review it.
Given the size (8 independent features, each already fully scoped with its own data/traps/tests,
minimal cross-task coupling beyond the shared `FEATURES` array and the To-Make-a-Moth/
risen-burgundy boundary), I recommend **subagent-driven** execution: a fresh implementer per
task plus a fresh reviewer before the next task starts catches a wrong table transcription or a
missed exclusion (especially Task 7's nine-name exclusion list) before it compounds across eight
features, and the tasks are independent enough that per-task review cost is well spent. **Native**
(all eight done in this session, one reviewer at the end) is the cheaper alternative if you'd
rather trade that per-task safety net for speed.

Which should we use, and does the plan match what you want — including the Task 0 scope
correction (Kinetoculus gets no code, The Stacks is deferred rather than forced into this batch)?
