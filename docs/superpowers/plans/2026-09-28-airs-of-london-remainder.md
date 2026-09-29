# Airs of London Storylets — Remaining 61 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add badges for every TODO.md "Airs of London storylets (no guide)" entry that has real,
badge-worthy content — 22 new features, 2 extensions to existing features, and TODO.md resolution
(document-only / retired / already-covered / wrong-quality) for the rest. No panels — card/storylet
markup only, per the same decision that applied to the Firmament guide batch.

**Architecture:** Every task follows the file's existing carousel/card conventions exactly as
established by the Firmament guide batch (`docs/superpowers/plans/2026-09-27-firmament-guide-badges.md`,
already merged into `main` via branch `firmament-guide-badges`) and the shared plumbing it
documents: `carouselRatings`/`carouselIndex`/`carouselOpen` for single-storylet carousels gated on
the opened storylet's own heading, `eachCardName` + a name lookup for opportunity cards, a
`labRatings`-style combined pass for features that deal both a hand and options inside an opened
card. New tables follow the `aolE`/`AOL_OPTIONS` field shape (`storylet`, `name`, `airs`, `ch`,
`g`/`u`, `q`/`f`, `open`, `re`, `needs`, `fail`, `note`) already established by the existing
`airs-of-london` feature (`choice-helper.js:9213` onward — **read it before Task 1**, it is the
model for this whole plan).

**Tech Stack:** Vanilla JS IIFE, `@grant none`, no build step. Tests are standalone Node scripts
(`node tests/choice-<feature>.test.mjs`), no framework, per `AGENTS.md`.

**Spec:** Four research documents, each fully closed out (zero further wiki fetches needed;
verified 2026-09-28), which together are this plan's spec and carry every data table this plan's
tasks reference by section number rather than re-embedding:
- `docs/superpowers/research/2026-09-27-airs-of-london-group-a.md` (6 heaviest storylets)
- `docs/superpowers/research/2026-09-27-airs-of-london-group-b.md` (7 storylets)
- `docs/superpowers/research/2026-09-27-airs-of-london-group-c.md` (11 storylets)
- `docs/superpowers/research/2026-09-27-airs-of-london-group-d.md` (37 storylets, the long tail)

Two additional storylet tables were fetched directly during planning (not yet in any research doc)
and are given in full in their own tasks below: **Pursuing a Mutually-Agreed Divorce** (Task 10)
and **Race Across the Flit**'s two options, closing The Flit and its King's one remaining gap
(Task 22).

## Global Constraints

- No panel for any of these 22 features (user decision, same as the Firmament batch).
- Read names with `headingName(el)`, never `textContent`.
- Every badge's colour must still read from its text/shape alone (red-green-weak reader) —
  `AGENTS.md` "Colour is never the only carrier of a claim." Use the shared `CAROUSEL_COLOR_*`
  category palette and `CAROUSEL_MARK_CHALLENGE` (`?`)/`CAROUSEL_MARK_EXPECTED` (`≈`) marks that
  the existing `airs-of-london` feature and the Firmament batch both already use — do not invent a
  new ramp per feature.
- Gate every new feature on the **opened storylet/card's own heading or name**, via
  `carouselRatings`/`carouselOpen` (storylets) or `eachCardName` + a name lookup (cards) — never an
  area guess, per the ruling already recorded in the Firmament batch's own ledger
  (`carouselOpen`'s exact-heading match is strictly safer than a `currentArea()` guess and is this
  file's real, established convention).
- **No table entry may duplicate a name already in another feature's table.** Every task below has
  already been checked against the whole file by the research pass; each task's own test must still
  run the standard cross-file collision check (see any existing `choice-*.test.mjs` for the
  `otherNames()` pattern).
- A Luck challenge with stated odds ranks by expected value (mark `≈`); a stat challenge with no
  odds shows the success value only (mark `?`) — never compute a fabricated win chance where the
  file has no live-read mechanism (same ruling as Red Stage/Scaling the Quartz in the Firmament
  batch).
- An option gated behind an item, Fate, or a specific Acquaintance/companion the player may not
  have is shown with its requirement stated, never silently ranked as free — per the skill's "do
  not badge a line the player cannot take."
- Bump `@version` in `FallenLondon/choice-helper.js` and `all-in-one/fallen-london.js` **once**,
  in the final metadata task, not per-task (matches the Firmament batch's own convention).
- `check.mjs` (`.claude/skills/adding-fallen-london-features/check.mjs`) must pass after the final
  task; three suites (`choice-crowds-of-spite`, `choice-fruits-of-the-zee`, `choice-zailing`) pin
  the whole `FEATURES` roster by hand and need every new feature name appended — the Firmament
  batch hit this same trap (its own ledger calls it out) and the fix is identical: append the new
  names to the same three roster arrays.

## Review Focus

1. **Multi-window/duplicate-text options must be merged into one table row, never left as
   silently-ambiguous duplicates.** The Firmament batch's own review found and fixed exactly this
   bug (9 of 12 Upon a Red Stage finale rows were permanently dead because three identically-named
   options were listed three times). This batch has the same shape twice: Group C's "A long
   conversation with the Functionary" (one option's display text repeats across 3 non-adjacent Airs
   windows) and needs `carouselLookup`-mergeable multi-range rows (matches Ecdysis's "Root yourself
   in place" precedent). Confirm every task that has this shape merges correctly and a wiring test
   proves the merged row is actually reachable through `carouselLookup`, not just callable directly
   on a table row.
2. **A "text"-only retitle entry that turns out to pay nothing must not get a badge invented for
   it.** Several entries (The Rewards of Ambition, A Jaunt in the (Weather) pair, A long
   conversation with the Functionary, Read incoming mail, The Usual Glut of Weather pair) resolve
   to real fetched confirmation that there is no reward to badge — Task 0 must mark these
   `(considered, nothing to badge: ...)` with the SPECIFIC reason from the research doc, not a
   generic label, and no task may write code for them.
3. **A card/storylet whose Airs window overlaps another's must show both as live, never assume
   only one is ever offered.** Several tasks (Attract a Visitor at Hallowmas, Investigate
   Clathermont's Tattoo Parlour, Literary Ambitions) have genuinely overlapping windows where two
   options can be simultaneously on offer — a badge that silently prefers one would misrepresent
   what's on screen. Each such task's test must assert both overlapping rows independently resolve.
4. **An item/Fate/Acquaintance-gated option must show its requirement in the tooltip, not be
   silently ranked alongside free options.** This recurs across nearly every task (Tower of Eyes'
   four Social Actions, Time in bed's three Acquaintance-gated rows, Coffee/Cheery Man's Fate and
   Acquaintance rows, the Divorce's Social-Action/Contest rows, Clay Quarters' 5-Fate option, the
   Watchmaker's Hill cluster). Each task's test must assert the `needs`/gate text appears in the
   tooltip for every such row.
5. **A feature whose real reward depends on a live game value this script cannot read (a second
   randomiser, the player's own stat, a formula) must show the base/known value marked appropriately
   and state the dependency in the tooltip — never compute or guess the live number.** This applies
   to Shifting Streets (`In Search of an Itinerant Address` tier), Festive Fir (highway-stat
   formula), and the Send a Christmas Card merged row (which Airs band is live). Each such task's
   test must assert the tooltip states the unread dependency in words.

---

## Task 0: TODO.md resolution for every no-code entry

**Files:**
- Modify: `TODO.md` (the "Airs of London storylets (no guide)" list, currently at roughly line 54
  onward — re-locate by searching for the heading text, since line numbers have shifted since the
  Firmament batch's edits)

**Interfaces:** none — documentation only, no code.

This task resolves every entry that will NOT get a feature, with the exact reason from the research
docs. Do this task first so the remaining open-list entries (that Tasks 1-24 will each mark
`(implemented)` on, one at a time, same convention as the Firmament batch) are easy to find.

- [ ] **Step 1: Mark storylets with no reward — `(considered, nothing to badge: ...)`**, matching the
  Kinetoculus precedent's exact phrasing style:
  - `A Jaunt in the (Weather)` and `A Jaunt in the (Weather) (The Waswood)`: `(considered, nothing
    to badge: purely narrative, only sets a counter toward "Look up at the sky"/"Indulge your
    doubts", no items or Stuiver anywhere in the chain -- see
    docs/superpowers/research/2026-09-27-airs-of-london-group-c.md section 1&3)`
  - `A long conversation with the Functionary`: `(considered, nothing to badge: every option,
    Airs-gated or not, is pure flavour text with no item/Stuiver/CP reward -- see
    docs/superpowers/research/2026-09-27-airs-of-london-group-c.md section 4)`
  - `The Rewards of Ambition`: `(considered, nothing to badge: one-time post-Ambition epilogue
    clicks, reward is an unitemised "mix," the Airs-of-London variance is flavour text not option
    titles -- see docs/superpowers/research/2026-09-27-airs-of-london-group-b.md section 2)`
  - `Wolfstack in the fog`: `(considered, nothing to badge: retired content, no longer in the game)`

- [ ] **Step 2: Mark deferred/document-only storylets** (real content confirmed by fetch, but not
  worth a badge — seasonal/Fate-locked/pure-retitle):
  - `SNOWBOUND!`: `(considered, nothing to badge: a 30-Fate one-off behind an item lock in a
    once-a-year seasonal card -- see docs/superpowers/research/2026-09-27-airs-of-london-group-d.md
    section H2)`
  - `Celebrate the Feast of the Exceptional Rose!`: `(considered, nothing to badge: one clean
    option in a low-traffic annual event card, not worth a dedicated feature -- see group-d.md
    section H2)`
  - `Perusal of Forgotten Pages`: `(considered, nothing to badge: the Airs connection is cosmetic
    flavour text on a single fixed-reward action, redirect target is The Censored Census of
    1862#Item Actions -- see group-d.md section H2)`
  - `Read incoming mail`: `(considered, nothing to badge: of 19 options only 2 mention Airs, both
    pure text-retitle on item-gated formula actions with no reward variance -- see group-d.md
    section H2)`
  - `The Usual Glut of Weather` and `The Usual Glut of Weather (The Waswood)`: `(considered,
    nothing to badge yet: pure retitle of "Take a stroll in the (Weather)"/storylet heading, per
    the skill's own step-5 precedent -- alias the day a feature reaches A Jaunt in the (Weather),
    not before)`
  - `Candlefinder: Canvassing the Dockers` and `Candlefinder: Canvassing the Servants`:
    `(considered, nothing to badge yet: one step each of a larger "Candlefinder" investigation
    storyline nothing in this file touches -- needs its own dedicated research pass before badging
    any single location, same treatment Someone Is Coming and Menace Locations got -- see
    group-d.md section G)`
  - `The Seeking Road`: `(considered, nothing to badge: full page carries zero "Airs of London"
    mentions, every gate is Seeking Mr Eaten's Name content instead -- see group-d.md section H4)`
  - `This Morning's Gazette`: `(considered, nothing to badge: full page carries zero "Airs of
    London" mentions -- see group-d.md section H4)`
  - `Fallen London, where everything is as it should be`: `(considered, nothing to badge: its one
    Airs-adjacent option is just a narrative link into the already-noted Usual Glut of Weather
    mechanic -- see group-d.md section H4)`
  - `A Public Lecture`: `(considered, nothing to badge: the /Fads subpage is a red herring, gated
    by Palaeontological Fads not Airs of London -- see group-d.md section H4)`

- [ ] **Step 3: Mark wrong-quality/retired/already-covered entries**:
  - `The Prussian Salon`: `(not Airs of London: its options are gated by Airs of Ealing Gardens, a
    different randomiser -- likely a wiki miscategorisation; see group-d.md section B)`
  - `Mrs Gebrandt asks for your help`: `(retired: {{Retired}} on the wiki, a 2011 one-off)`
  - `Work in your Cabinet Noir`: `(implemented: already covered by the existing \`deciphering\` and
    \`disappearing\` features -- see group-d.md section H3)`
  - `Rob a drunk`: `(implemented: already covered by \`someone-is-coming\`'s existing "A furious
    and incoherent drunken rat" option -- its OTHER Airs-gated option's window is still unknown, a
    follow-up if full coverage is ever wanted -- see group-d.md section A)`

- [ ] **Step 4: Run `node --check FallenLondon/choice-helper.js` is not applicable here (no code
  changed) — just re-read the edited section of TODO.md to confirm every one of the 20 entries
  above now has a reason, and commit.**

```bash
git add TODO.md
git commit -m "docs: resolve no-code Airs of London TODO entries (nothing-to-badge, deferred, wrong-quality, retired, already-covered)"
```

---

## Task 1: A Bad Case of Rattus Faber

**Files:**
- Modify: `FallenLondon/choice-helper.js`
- Test: `tests/choice-rattus-faber.test.mjs`
- Modify: `TODO.md`

**Data source:** `docs/superpowers/research/2026-09-27-airs-of-london-group-a.md` section 1 — the
full 20-row main table plus both redirect sub-storylets' tables (6 more rows: 3 in "Employ the
poisons of Dottore Rappacini", 3 in "A showdown with the Rattus Faber Chief"). Transcribe every row
exactly as tabled there, including the formula on "A lull in hostilities: try to negotiate with the
rats" (`44 - Troubled by Vermin/2`, carry the formula, not the one worked example).

**Shape:** carousel on storylet "A Bad Case of Rattus Faber" (progress quality Troubled by Vermin,
counts DOWN to 0), plus two redirect sub-storylets reached from within it. Use `carouselRatings`
with `storylets: ['A Bad Case of Rattus Faber', 'Employ the poisons of Dottore Rappacini', 'A
showdown with the Rattus Faber Chief']` — all three are real storylet headings a player can have
open, and `carouselOpen`/`carouselLookup` naturally scope each table row to whichever is open via
each row's own `storylet` field (same multi-storylet-one-index pattern as Upon a Red Stage's main +
finale tables in the Firmament batch).

**Badge meaning:** net Vermin reduction per action (the varying number), marked `?` for the 18 stat
challenges, `≈` for the 2 stated-odds Luck challenges (70%, 50%) computed as expected value. No
"safe" option exists (every row costs at least Vermin -1 on failure) — state this in the storylet
heading's own tooltip, not a per-row mark.

- [ ] **Step 1: Write `tests/choice-rattus-faber.test.mjs`** (harness copied from
  `tests/choice-red-stage.test.mjs`, since this needs both `.storylet-root__heading` and
  `.branch__title` support). Pin: all 20 main-table rows plus both redirect storylets' 6 rows (26
  total); the two Luck challenges (70%/50%) show an `≈`-marked expected value, not the raw success
  figure; the formula row carries the literal formula string, not a baked-in example number; every
  row's badge only resolves while ITS OWN storylet is the open one (a main-table option must not
  badge while "Employ the poisons of Dottore Rappacini" is open, and vice versa); no name collides
  with another feature's table (use the `otherNames()` helper pattern, extended to every table this
  plan adds up to this point — for Task 1 that's just the pre-existing tables).

- [ ] **Step 2: Run it, confirm RED** (`ReferenceError` on the not-yet-defined table/spec/ratings
  names).

```sh
node tests/choice-rattus-faber.test.mjs
```

- [ ] **Step 3: Add the table, spec function(s), and `rattusFaberRatings()` wiring to
  `choice-helper.js`**, inserted before the `// === feature registry ===` comment, following the
  exact code shape of `ecdysisRatings`/`ECDYSIS_OPTIONS` (the closest precedent: a single-storylet
  carousel with a safe-option-free risk table) for the main table, and a second small
  `carouselIndex`-backed set of rows for the two redirect storylets, all three storylets sharing
  one `carouselRatings` call (one combined `carouselIndex` across all 26 rows, same pattern as Red
  Stage's `RED_STAGE_MAIN.concat(RED_STAGE_FINALE)`).

- [ ] **Step 4: Register** `{ name: 'rattus-faber', run: rattusFaberRatings },` in `FEATURES`.

- [ ] **Step 5: Run tests, confirm GREEN.**

```sh
node --check FallenLondon/choice-helper.js
node tests/choice-rattus-faber.test.mjs
```

- [ ] **Step 6: Update TODO.md**, appending `(implemented)` to the `A Bad Case of Rattus Faber`
  line.

- [ ] **Step 7: Commit.**

```bash
git add FallenLondon/choice-helper.js tests/choice-rattus-faber.test.mjs TODO.md
git commit -m "feat: badge A Bad Case of Rattus Faber carousel"
```

---

## Task 2: The Tower of Eyes

**Files:**
- Modify: `FallenLondon/choice-helper.js`
- Test: `tests/choice-tower-of-eyes.test.mjs`
- Modify: `TODO.md`

**Data source:** `docs/superpowers/research/2026-09-27-airs-of-london-group-a.md` section 2 — 5
top-level options (no Airs), 11 Salon sub-options (9 Airs-gated), 10 Orphanage sub-options (9
Airs-gated). Transcribe every row exactly, including the ranges ("Making Waves +121-190") as
ranges, never a guessed midpoint presented as exact.

**Shape:** a card, `.storylet-root__heading`/`.branch__title` (opened-card branches, same as
`eachCardName`'s third case) — gate via `carouselRatings` with `storylets: ['The Tower of Eyes:
Behind Closed Doors at a Handsome Townhouse']`.

**CRITICAL — mutually exclusive tracks.** Salon and Orphanage lock each other out. Give the two
sub-tables separate table constants (`TOWER_SALON`, `TOWER_ORPHANAGE`) combined into one
`carouselIndex`, but the storylet-heading tooltip (`storyletSpec`) must state plainly that only one
track is ever live for a given player — never present both as simultaneously choosable in the
summary text.

**Badge meaning:** net Making Waves per action for the ranked sub-options (state the range, not a
midpoint); the 4 Social-Action rows (need a matching-Profession friend) marked as gated,
informational only, not ranked in; "Your Salon: invite the Duchess" flagged `guide`-uncertain in
its tooltip (its own page never itemises a reward beyond the unlock cost) rather than inventing a
number.

- [ ] **Step 1: Write `tests/choice-tower-of-eyes.test.mjs`** (harness from
  `tests/choice-red-stage.test.mjs`). Pin: 5 top-level + 11 Salon + 10 Orphanage = 26 rows; the
  mutual-exclusion note appears in the storylet-level tooltip; every ranged reward is carried as a
  `[lo, hi]` pair, not collapsed; all 4 Social-Action rows' tooltips state the required Profession;
  "invite the Duchess" tooltip contains a `guide`-uncertainty note; no collisions.

- [ ] **Step 2: RED.**

- [ ] **Step 3: Implement** `TOWER_TOP`, `TOWER_SALON`, `TOWER_ORPHANAGE` tables, spec function(s),
  `towerOfEyesRatings()` — follow the `aolE`-row field shape (`airs`, `ch`, `g`, `q`/`f`, `needs`,
  `note`) from the existing `AOL_OPTIONS`, since this storylet's data shape (items + qualities +
  faction results + needs) matches that table's fields more closely than the simpler carousels
  built in the Firmament batch.

- [ ] **Step 4: Register** `{ name: 'tower-of-eyes', run: towerOfEyesRatings },`.

- [ ] **Step 5: GREEN.**

- [ ] **Step 6: TODO.md** `(implemented)`.

- [ ] **Step 7: Commit.**

---

## Task 3: The Feast of the Rose!

**Files:**
- Modify: `FallenLondon/choice-helper.js`
- Test: `tests/choice-feast-of-the-rose.test.mjs`
- Modify: `TODO.md` — this task's TODO update covers BOTH `The Feast of the Rose!` (16 unlock) AND
  `A masked revel for the Feast of the Rose!` (1 unlock), since the latter's content ("Cast aside
  your mask!", Luck 50, needs Mask of the Rose + Airs 90+) is the exact same option already
  transcribed inside this storylet's own redirect chain (group-a.md section 3, the "A masked
  revel!" redirect's own sub-table) — confirm this by comparing the two TODO.md URLs' page titles
  before marking both `(implemented)` off the one feature; do not build a second feature for it.

**Data source:** `docs/superpowers/research/2026-09-27-airs-of-london-group-a.md` section 3 — 16
top-level Airs-gated redirects (4 per band × 4 bands) into 13 further sub-storylets, 39 leaf
options total. Every row is transcribed there. Watch the disambiguator trap called out in that
section (`The Duchess' banquet 0` vs displayed `The Duchess' banquet`; `Bluff your way in 2` is the
real target behind the `Bluff your way in` disambiguation page) — these are just data, already
resolved in the doc, no further fetch needed.

**Shape:** three-layer carousel — storylet "The Feast of the Rose!" → 16 Airs-gated redirects → 13
sub-storylets' own options. Use `carouselRatings` with the top-level storylet plus all 13
sub-storylet names in `storylets:`, one combined `carouselIndex` across all 55 rows.

**Badge meaning:** every option pays `Masquing +N` (the real progress currency, caps at 20) on top
of flavour items — badge the Masquing gain as the primary number (marked `?`/`≈` per its own
challenge shape), with items/qualities/faction results in the tooltip. Seasonal — note in the
storylet tooltip that this is a yearly event card and a badge that never fires outside the season
is expected, harmless behaviour, not a bug.

- [ ] **Step 1: Write `tests/choice-feast-of-the-rose.test.mjs`** (harness from
  `choice-red-stage.test.mjs`). Pin: 16 top-level rows + 39 leaf rows = 55; Masquing is the primary
  badge number on every row; the disambiguator-page rows ("The Duchess' banquet", "Bluff your way
  in") resolve to their real target text, not the bare ambiguous name; "A masked revel!"'s own
  "Cast aside your mask!" sub-row exists in this table (closing the loop with the TODO.md
  consolidation above); no collisions.

- [ ] **Step 2: RED.**

- [ ] **Step 3: Implement.** Given the size (55 rows), split the table declaration across several
  `const` blocks by Airs band (`FEAST_0_25`, `FEAST_26_50`, `FEAST_51_75`, `FEAST_76_100`)
  concatenated into one `carouselIndex`, matching how Rattus Faber (Task 1) and Red Stage
  (Firmament batch) both handle large multi-part tables. `feastOfTheRoseRatings()` wires it.

- [ ] **Step 4: Register** `{ name: 'feast-of-the-rose', run: feastOfTheRoseRatings },`.

- [ ] **Step 5: GREEN.**

- [ ] **Step 6: TODO.md** — mark `The Feast of the Rose!` AND `A masked revel for the Feast of the
  Rose!` both `(implemented; the latter's one option is already inside this feature's own redirect
  chain, see docs/superpowers/research/... section 3)`.

- [ ] **Step 7: Commit.**

---

## Task 4: Up Close with a Festive Fir

**Files:**
- Modify: `FallenLondon/choice-helper.js`
- Test: `tests/choice-festive-fir.test.mjs`
- Modify: `TODO.md`

**Data source:** `docs/superpowers/research/2026-09-27-airs-of-london-group-a.md` section 4 — 16
Airs-gated options plus the 2 cash-out/view actions.

**Shape:** storylet "Fallen London" is the location, but the STORYLET itself ("Up Close with a
Festive Fir") is what opens — gate on that storylet name via `carouselRatings`.

**Badge meaning:** every reward is a FORMULA (`Arborist's Gratitude ≤576 (highway-stat-capped) +
flat bonus`), never a guessed flat number — show the formula and the flat bonus in the badge text
itself (e.g. `≤576+500`), full explanation in the tooltip, matching Scaling the Quartz's own
"show the base/known part, state the live dependency" convention from the Firmament batch. Every
row's `Trade-off` column (Heartiness vs Beauty, which one goes up and which goes down) must appear
on the badge or immediately in the tooltip — a player cannot otherwise tell which of the 16 options
push which way. State in the storylet tooltip that Heartiness/Beauty are a SHARED, GLOBAL tree
state (not personal), and that this is time-boxed to 8 days every December (harmless if the
storylet is simply unreachable outside that window).

- [ ] **Step 1: Write `tests/choice-festive-fir.test.mjs`**. Pin: all 16 rows with their exact
  Airs window, trade-off direction, and Gratitude formula/bonus; the three real-failure rows that
  pay 7/12 of the success value on failure carry that exact fraction, not "less" vaguely; the
  storylet tooltip states both the shared/global nature and the trade-off direction requirement; no
  collisions.

- [ ] **Step 2: RED.**

- [ ] **Step 3: Implement** `FIR_OPTIONS`, spec function, `festiveFirRatings()`.

- [ ] **Step 4: Register** `{ name: 'festive-fir', run: festiveFirRatings },`.

- [ ] **Step 5: GREEN.**

- [ ] **Step 6: TODO.md** `(implemented)`.

- [ ] **Step 7: Commit.**

---

## Task 5: Coffee with the Last Constable + A drink with the Cheery Man

**Files:**
- Modify: `FallenLondon/choice-helper.js`
- Test: `tests/choice-cheery-man-constable.test.mjs`
- Modify: `TODO.md`

**Data source:** `docs/superpowers/research/2026-09-27-airs-of-london-group-a.md` sections 5 and 6
— 14 rows for Coffee with the Last Constable, 13 for A drink with the Cheery Man, both fully
transcribed. Build together as one feature, `side: 'constable' | 'cheery'` distinguishing the two
tables in one combined array, per the research doc's own recommendation (they are the two halves
of one storyline).

**Shape:** two opened CARDS (not storylets) — `eachCardName` on both card names, no `.branch__title`
needed beyond what `eachCardName`'s own third case already covers for an opened card's heading; the
individual OPTIONS inside each opened card are `.branch__title` though (per the card's own opened
view), so this is another `carouselRatings`-with-two-storylet-names case, same shape as Task 1/2/3
(a card, once opened, renders `.storylet-root__heading` + `.branch__title` identically to a
storylet).

**Badge meaning:** almost every option is checkless (guaranteed) — badge is the item/Favour list
text, no ranking arithmetic. The two real challenges per card (Persuasive 50/99 for Cheery Man,
Persuasive 50/100 for Constable) show the success value marked `?`. Fate-locked and
Acquaintance-gated rows (3 "She's not alone"/"He's not alone" each, 1 "Tell her your own story")
state their requirement in the tooltip, excluded from any ranking (there is none here, since reward
is a flat list, but still flag them so a player isn't surprised the option is greyed out).

- [ ] **Step 1: Write `tests/choice-cheery-man-constable.test.mjs`**. Pin: 14 + 13 = 27 rows, `side`
  field correct on every row; both cards' two real challenges show `?`; all 6
  Fate/Acquaintance-gated rows state their requirement; the two storylets never cross-badge each
  other's options (a Constable-side option only badges while "Coffee with the Last Constable" is
  open); no collisions.

- [ ] **Step 2: RED.**

- [ ] **Step 3: Implement** `CHEERY_CONSTABLE_OPTIONS` (combined table, `side` field), spec
  function, `cheeryManConstableRatings()`.

- [ ] **Step 4: Register** `{ name: 'cheery-man-constable', run: cheeryManConstableRatings },`.

- [ ] **Step 5: GREEN.**

- [ ] **Step 6: TODO.md** — mark BOTH `Coffee with the Last Constable` and `A drink with the
  Cheery Man` `(implemented)`.

- [ ] **Step 7: Commit.**

---

## Task 6: Time in bed

**Files:**
- Modify: `FallenLondon/choice-helper.js`
- Test: `tests/choice-time-in-bed.test.mjs`
- Modify: `TODO.md`

**Data source:** `docs/superpowers/research/2026-09-27-airs-of-london-group-b.md` section 1 — 13
rows, full reward data, already fully on the storylet's own page (no separate option-page
cross-check needed per the research doc — flag this in a code comment as the ONE exception to the
"option pages win" rule that this batch's research explicitly verified against the storylet page
directly).

**Shape:** single storylet "Time in bed", gate via `carouselRatings`.

**Badge meaning:** net Wounds change is the primary number (this is a convalescing/rest storylet
per its own description), Nightmares change a secondary mark. Six Luck-challenge rows with stated
odds (60-80%) rank by expected value (`≈`). Three "Acquaintance: X level 5" rows have NO challenge
at all — mark distinctly with the word "always succeeds" (matching the `midnight-trade` convention
from the Firmament batch), state the Acquaintance requirement. "A remarkable tincture" is
Fate-locked — exclude from ranking, keep in tooltip.

- [ ] **Step 1: Write `tests/choice-time-in-bed.test.mjs`**. Pin: 13 rows; the 6 Luck-odds rows
  compute expected Wounds value correctly and mark `≈`; the 3 always-succeed Acquaintance rows say
  "always succeeds" and state the Acquaintance level; the Fate row is excluded from ranking logic
  but present with its Fate cost stated; no collisions.

- [ ] **Step 2: RED.**

- [ ] **Step 3: Implement** `TIME_IN_BED_OPTIONS`, spec function, `timeInBedRatings()`.

- [ ] **Step 4: Register** `{ name: 'time-in-bed', run: timeInBedRatings },`.

- [ ] **Step 5: GREEN.**

- [ ] **Step 6: TODO.md** `(implemented)`.

- [ ] **Step 7: Commit.**

---

## Task 7: A Dream of a Burning City

**Files:**
- Modify: `FallenLondon/choice-helper.js`
- Test: `tests/choice-burning-city.test.mjs`
- Modify: `TODO.md`

**Data source:** `docs/superpowers/research/2026-09-27-airs-of-london-group-b.md` section 3 (fully
re-fetched 2026-09-28, all 8 rows complete including Cower, which does pay a real reward — the
earlier "empty" read was a fetch-truncation artefact, not a narrative-only branch). Redirected from
"Overwhelmed by Smoke and Heat" (not itself covered by any feature — note as a follow-up in the
feature's own comment, do not build it here).

**Shape:** single storylet "A Dream of a Burning City", gate via `carouselRatings`.

**Badge meaning:** direction of Fie to the Wyrm is the real story — the four tier-0-1 options
ALWAYS gain a tier regardless of outcome; the four tier-2+ options gain on success but **LOSE** a
tier on failure (a real setback, the opposite direction). The badge must mark this asymmetry
explicitly (e.g. a `▼` on the tier-2+ rows' failure side), not just show a flat reward-size number
— a flat ranking would hide that these four are riskier in a way size alone doesn't capture. Carry
the wiki's own `?` mark on "Well-Placed Pawn 31-37?"/"27-37?" and "Map Scrap 10-37?"/"10?" verbatim
— it is the wiki's stated uncertainty, not this script's guess. State "Nightmares +1 on every
failure" once in the storylet-level tooltip rather than repeating it on all 8 rows.

- [ ] **Step 1: Write `tests/choice-burning-city.test.mjs`**. Pin: all 8 rows; the four tier-2+
  rows carry a `tierLoss: true`-style flag distinct from the four tier-0-1 rows, and the badge text
  differs accordingly; Cower's real reward (Maniac's Prayer 7-27/10) is present, not empty; the `?`
  marks on Well-Placed Pawn/Map Scrap ranges are preserved in the badge text; no collisions (in
  particular: confirm no table row is literally named the same as anything in `war-of-assassins`'s
  own table — per the research doc, only the ITEM name "Well-Placed Pawn" is shared, never an
  option/storylet name, so this check should pass cleanly).

- [ ] **Step 2: RED.**

- [ ] **Step 3: Implement** `BURNING_CITY_OPTIONS`, spec function, `burningCityRatings()`.

- [ ] **Step 4: Register** `{ name: 'burning-city', run: burningCityRatings },`.

- [ ] **Step 5: GREEN.**

- [ ] **Step 6: TODO.md** `(implemented)`.

- [ ] **Step 7: Commit.**

---

## Task 8: Consider your Aquaria + Search your Terraria

**Files:**
- Modify: `FallenLondon/choice-helper.js`
- Test: `tests/choice-university-creatures.test.mjs`
- Modify: `TODO.md`

**Data source:** `docs/superpowers/research/2026-09-27-airs-of-london-group-b.md` sections 4 and 5
— 12 rows (Aquaria) + 9 rows (Terraria), both fully on each card's own inline reference table (no
option-page fetch needed, confirmed in the doc).

**Shape:** two opportunity CARDS at University Laboratory, confirmed NOT in the existing
`university-laboratory` feature's `LAB_CARDS` table. Use `eachCardName` + a combined name lookup,
`card: 'aquaria' | 'terraria'` distinguishing field, following the research doc's own recommendation
to combine both into one feature (`university-creatures`) since they're the same mechanic at the
same location.

**Badge meaning:** Research given is the primary number (a straight ranking); the base
consumes-the-creature options marked "always available, consumes the [fish/creature]"; the 8+8
Airs-gated options marked with their window and Watchful difficulty (the real differentiator, since
reward barely varies — same "rank by risk" shape as `midnight-trade`). Terraria's bonus-quality
rows (Shapeling Arts, Parabolan Research CP alongside the Research number) must show that bonus in
the tooltip — Rubbery Dragon (Shapeling Arts +2, the highest bonus) should not read as merely
"mid-pack" from its Research number alone, matching the Sous Catacombs "don't let the raw number
mislead" caution from the Firmament batch. One Terraria row (Ocular Toadbeast) is Fate-gated —
exclude from ranking, keep in tooltip.

- [ ] **Step 1: Write `tests/choice-university-creatures.test.mjs`** (harness from
  `choice-high-sancta.test.mjs`, the closest precedent for a pure-card, no-storylet feature). Pin:
  12 + 9 = 21 rows; the 4 base always-available rows are marked distinctly; Rubbery Dragon's bonus
  CP appears in its tooltip even though its Research count is mid-pack; the Fate-gated Ocular
  Toadbeast is excluded from ranking but present; no collisions (confirmed not in `LAB_CARDS`).

- [ ] **Step 2: RED.**

- [ ] **Step 3: Implement** `UNIVERSITY_CREATURE_OPTIONS`, spec function,
  `universityCreaturesRatings()`.

- [ ] **Step 4: Register** `{ name: 'university-creatures', run: universityCreaturesRatings },`.

- [ ] **Step 5: GREEN.**

- [ ] **Step 6: TODO.md** — mark BOTH `Consider your Aquaria` and `Search your Terraria`
  `(implemented)`.

- [ ] **Step 7: Commit.**

---

## Task 9: The Clay Quarters (Storylet)

**Files:**
- Modify: `FallenLondon/choice-helper.js`
- Test: `tests/choice-clay-quarters.test.mjs`
- Modify: `TODO.md`

**Data source:** `docs/superpowers/research/2026-09-27-airs-of-london-group-b.md` section 6 —
8 rows, fully complete (the two originally-truncated failure cells were fixed in the 2026-09-28
follow-up pass, confirmed both have no reward on failure).

**Shape:** single storylet "The Clay Quarters", gate via `carouselRatings`. The base options
(Emancipate a Clay Man, Recruit Clay Man labour, Visit Bernard) are explicitly OUT of scope (not
Airs-related) — do not add them to this table.

**Badge meaning:** primary named reward + count (no common currency to convert to, unlike Sous
Catacombs), Watchful difficulty (20-24, all close together) as a secondary mark since it's not the
real differentiator here (reward size is). The Jasper-and-Frank redirect (Ambition: Nemesis-locked,
0-cost, purely narrative) is informational only, not ranked — matches Upon a Red Stage's Parabasis
"setup note" pattern from the Firmament batch. The 5-Fate option excluded from ranking, kept in
tooltip.

- [ ] **Step 1: Write `tests/choice-clay-quarters.test.mjs`**. Pin: 8 rows; the Jasper-and-Frank
  redirect gets an informational spec, never a ranked one; the 5-Fate row states its cost and is
  excluded from ranking; "Making Waves" gain (Ragged-Sleeved Academic row) doesn't collide with any
  other tracked-quality table in the file; no collisions.

- [ ] **Step 2: RED.**

- [ ] **Step 3: Implement** `CLAY_QUARTERS_OPTIONS`, spec function, `clayQuartersRatings()`.

- [ ] **Step 4: Register** `{ name: 'clay-quarters', run: clayQuartersRatings },`.

- [ ] **Step 5: GREEN.**

- [ ] **Step 6: TODO.md** `(implemented)`.

- [ ] **Step 7: Commit.**

---

## Task 10: Pursuing a Mutually-Agreed Divorce

**Files:**
- Modify: `FallenLondon/choice-helper.js`
- Test: `tests/choice-mutually-agreed-divorce.test.mjs`
- Modify: `TODO.md`

**Data source:** fetched directly during planning (not in any research doc — the group-b fork's
summary table claimed this was complete but never wrote its section; the table below is the
complete, verified replacement). Storylet at Your Lodgings, `Unlocked with: Pursuing a divorce`.
`Game Instructions`: both spouses must raise "Pursuing a divorce" to 100 to finalize.

**Full option table (12 Airs-gated rows; all raise the progress quality `Pursuing a divorce`):**

| Option | Airs | Other gate | Type | Success | Failure/Loser |
|---|---|---|---|---|---|
| Present proof of infidelity! | below 50 | needs Stolen Kiss ×1 (spent) | flat | Pursuing a divorce +6-7 | — |
| Is all this really necessary? | 0-50 | Locked with A Person of Some Importance ≥2 (i.e. needs it BELOW 2) | flat | Pursuing a divorce +2-3 | — |
| Seek the Court's pity | 0-25 | needs Melancholy 4 | flat | Pursuing a divorce +5, Scandal +2 | — |
| Appear before the court with your spouse | 0-25 | Social Action (Auto), needs spouse (Espoused to) | social, no direct reward stated on this page beyond the Airs reroll | — (reward is on the spouse's acceptance, not itemised here) | — |
| Share Tales of Terror about your spouse with the Court | 25-50 | needs Tale of Terror!! ×1 (spent), Espoused to (friend); a CONTEST (base Persuasive 100) | contest | Winner: Pursuing a divorce +7 | Loser: Pursuing a divorce +2-3 |
| Death till you part? | 40-50 | needs "The Boatman's Opponent" | flat | Pursuing a divorce +4-5, Scandal +2 | — |
| Testify that love has faded | 50+ | needs Touching Love Story ×1 (spent) | flat | Pursuing a divorce +6-7 | — |
| Provide a notice from higher authorities | 50+ | needs Bazaar Permit ×1 (spent) | flat | Pursuing a divorce +16-25 (the largest single gain) | — |
| It simply isn't for you | 50-75 | needs Hedonist 4 | flat | Pursuing a divorce +5, Scandal +2 | — |
| Present your spouse's inadequacies to the court | 50-75 | needs Espoused to (friend), Pursuing a divorce ≥1; a CONTEST (base Watchful 100) | contest | Winner: Pursuing a divorce +7 | Loser: Pursuing a divorce +2-3 |
| Request that a friend assassinate your spouse before the Court | 75+ | Social Action (Auto), Locked with "Requesting a Friend's Testimony" | social, no direct reward stated on this page | — | — |
| You have another love | 90-100 | needs Rat on a String ×5000 (spends 5) | flat | Pursuing a divorce +4-5, Scandal +2 | — |

**Traps:** the two CONTEST rows (Share Tales of Terror, Present your spouse's inadequacies) are
opposed challenges against the player's own spouse (base difficulty 100, the stat is the
differentiator) — badge both Winner and Loser outcomes, mark with the stat name, never present as
a normal success/failure pair. The two Social-Action-Auto rows have no directly itemised reward on
their own page (the actual `Pursuing a divorce` gain happens via the spouse's acceptance flow,
off-page) — badge these as informational/setup notes, not ranked numbers, matching the Upper Red
Stage Parabasis pattern. "Is all this really necessary?" is gated on the player having FEWER than 2
"A Person of Some Importance" — an inverted lock, state this precisely in the tooltip ("available
only below this threshold"), not as a normal `needs`.

**Badge meaning:** net "Pursuing a divorce" progress per action is the obvious ranking number for
the 8 flat rows (Provide a notice from higher authorities, at +16-25, is clearly the standout —
mark it, don't bury it in a uniform list). The 2 contest rows show Winner/Loser split. The 2 social
rows are informational only.

- [ ] **Step 1: Write `tests/choice-mutually-agreed-divorce.test.mjs`**. Pin: all 12 rows per the
  table above; both contest rows show Winner +7 / Loser +2-3 with the stat named; both social rows
  get an informational (not ranked) spec; "Is all this really necessary?"'s tooltip states the
  inverted lock in words; "Provide a notice from higher authorities" is marked as the standout
  (highest value); no collisions.

- [ ] **Step 2: RED.**

- [ ] **Step 3: Implement** `DIVORCE_OPTIONS`, spec function, `mutuallyAgreedDivorceRatings()`.

- [ ] **Step 4: Register** `{ name: 'mutually-agreed-divorce', run: mutuallyAgreedDivorceRatings },`.

- [ ] **Step 5: GREEN.**

- [ ] **Step 6: TODO.md** `(implemented)`.

- [ ] **Step 7: Commit.**

---

## Task 11: Attract a Visitor at Hallowmas

**Files:**
- Modify: `FallenLondon/choice-helper.js`
- Test: `tests/choice-hallowmas-visitor.test.mjs`
- Modify: `TODO.md`

**Data source:** `docs/superpowers/research/2026-09-27-airs-of-london-group-c.md` section 2 — 7
rows, all fully specced.

**Shape:** a card "Attract a Visitor at Hallowmas" (seasonal, Hallowmas), `eachCardName` +
option-level `.branch__title` via `carouselRatings` on the storylet-shaped opened-card view.

**Badge meaning:** every row states Making Waves + Nightmares changes and any spent item. Three
windows genuinely OVERLAP another (30-35 inside 26-50; 81-90 and 90-100 both inside 76-100) — badge
each independently, never assume exactly one is live (Review Focus #3). "Attend a lecture on
'spiritual hygiene'" is Fate-locked and further blocked once specific items are held — exclude from
ranking, state both gates in the tooltip.

- [ ] **Step 1: Write `tests/choice-hallowmas-visitor.test.mjs`**. Pin: 7 rows; the two pairs of
  overlapping windows (30-35/26-50 and 81-90+90-100/76-100) each resolve independently when both
  are "live" in a test scenario; the Fate+item-blocked row states both gates; no collisions.

- [ ] **Step 2: RED.**

- [ ] **Step 3: Implement** `HALLOWMAS_OPTIONS`, spec function, `hallowmasVisitorRatings()`.

- [ ] **Step 4: Register** `{ name: 'hallowmas-visitor', run: hallowmasVisitorRatings },`.

- [ ] **Step 5: GREEN.**

- [ ] **Step 6: TODO.md** `(implemented)`.

- [ ] **Step 7: Commit.**

---

## Task 12: Investigate Clathermont's Tattoo Parlour

**Files:**
- Modify: `FallenLondon/choice-helper.js`
- Test: `tests/choice-clathermont-tattoo.test.mjs`
- Modify: `TODO.md`

**Data source:** `docs/superpowers/research/2026-09-27-airs-of-london-group-c.md` section 5 — 6
rows, all fully specced, all Watchful challenges.

**Shape:** single storylet, gate via `carouselRatings` on "Investigate Clathermont's Tattoo
Parlour". Confirmed distinct from the existing Clathermont-FAMILY storyline already in the file
(different quality, `Entwined in the Intrigues of the Clathermont Family` vs this one's `A Name in
Seven Secret Alphabets`) — state this distinction in the feature's own code comment so a future
reader doesn't conflate them.

**Badge meaning:** item count literally equals the Watchful difficulty on 4 of 6 rows (Moon-Pearl
×21 at Watchful 21, etc.) — a flat success-value badge marked `?` is honest and simple. Two pairs
share an Airs window (0-25 has two options, 51-75 has two) — both live at once, badge
independently (Review Focus #3).

- [ ] **Step 1: Write `tests/choice-clathermont-tattoo.test.mjs`**. Pin: 6 rows; the two
  same-window pairs both resolve independently; the item-count-equals-difficulty pattern is
  reflected in the badge text (not hidden); no collisions.

- [ ] **Step 2: RED.**

- [ ] **Step 3: Implement** `CLATHERMONT_OPTIONS`, spec function, `clathermontTattooRatings()`.

- [ ] **Step 4: Register** `{ name: 'clathermont-tattoo', run: clathermontTattooRatings },`.

- [ ] **Step 5: GREEN.**

- [ ] **Step 6: TODO.md** `(implemented)`.

- [ ] **Step 7: Commit.**

---

## Task 13: Shifting Streets

**Files:**
- Modify: `FallenLondon/choice-helper.js`
- Test: `tests/choice-shifting-streets.test.mjs`
- Modify: `TODO.md`

**Data source:** `docs/superpowers/research/2026-09-27-airs-of-london-group-c.md` section 6 — 6
rows, real items, tier-dependent bonuses (base/tier-4/tier-8, keyed to an unreadable second
variable `In Search of an Itinerant Address`).

**Shape:** single storylet "Shifting Streets", gate via `carouselRatings`. Base option "Scour map
and memory" and the Conclusion section are out of scope (entry/exit, not Airs-gated).

**Badge meaning:** badge the BASE (tier-1) item reward marked `?` (challenge), tier-4/8 bonuses
stated in the tooltip only as "more, if you're deep into the search for a specific City" — never
computed, since this script cannot read `In Search of an Itinerant Address` (Review Focus #5, same
convention as Scaling the Quartz). All 6 give `Pedestrian Peregrinations +7 CP` regardless of
outcome — state once in the storylet tooltip, not per row.

- [ ] **Step 1: Write `tests/choice-shifting-streets.test.mjs`**. Pin: 6 rows with their base
  reward and Airs window; every row's tooltip states the tier-4/8 bonus is NOT computed, only
  described; the shared `Pedestrian Peregrinations +7 CP` line lives in the storylet-level tooltip;
  no collisions.

- [ ] **Step 2: RED.**

- [ ] **Step 3: Implement** `SHIFTING_STREETS_OPTIONS`, spec function, `shiftingStreetsRatings()`.

- [ ] **Step 4: Register** `{ name: 'shifting-streets', run: shiftingStreetsRatings },`.

- [ ] **Step 5: GREEN.**

- [ ] **Step 6: TODO.md** `(implemented)`.

- [ ] **Step 7: Commit.**

---

## Task 14: Candlefinder: Canvassing the Clay Men

**Files:**
- Modify: `FallenLondon/choice-helper.js`
- Test: `tests/choice-candlefinder-clay-men.test.mjs`
- Modify: `TODO.md`

**Data source:** `docs/superpowers/research/2026-09-27-airs-of-london-group-c.md` section 7 — 5
Airs-gated rows (the 2 non-Airs options, "Eavesdrop on private conversations" and "Concrete
evidence", are excluded from this table per the doc).

**Shape:** single storylet, global/roaming (Location "Fallen London"), gate via `carouselRatings`
on "Candlefinder: Canvassing the Clay Men". Note in a code comment: this is the FIRST of what the
research (group-d.md section G) identifies as a larger "Candlefinder" storyline (Canvassing the
Dockers/Servants also exist, deferred per Task 0) — this task covers ONLY "Canvassing the Clay
Men", explicitly scoped, not the whole storyline.

**Badge meaning:** every row moves the `Detecting...` progress currency by a flat amount (4/6/6/6/8)
with different requirements/menace — LBI-style `?`-marked success value, menace/requirement in the
tooltip.

- [ ] **Step 1: Write `tests/choice-candlefinder-clay-men.test.mjs`**. Pin: 5 rows exactly as
  tabled (Emancipate a Clay Man, Patch up an injured Clay Man, Send in the Gravel-Voiced Gossip,
  Keep track of Clay movements, Be open about your motives); the two non-Airs options are absent
  from this table; no collisions (in particular: confirm "Emancipate a Clay Man" doesn't collide
  with anything, per the doc's own note that no other Clay-Men storylet exists yet).

- [ ] **Step 2: RED.**

- [ ] **Step 3: Implement** `CANDLEFINDER_CLAY_MEN_OPTIONS`, spec function,
  `candlefinderClayMenRatings()`.

- [ ] **Step 4: Register** `{ name: 'candlefinder-clay-men', run: candlefinderClayMenRatings },`.

- [ ] **Step 5: GREEN.**

- [ ] **Step 6: TODO.md** `(implemented)`.

- [ ] **Step 7: Commit.**

---

## Task 15: Literary Ambitions (fold into `spider-symposium`)

**Files:**
- Modify: `FallenLondon/choice-helper.js` (the existing `spider-symposium` feature's own table and
  wiring — locate via `grep -n "spider-symposium\|SPIDER_" FallenLondon/choice-helper.js`)
- Test: `tests/choice-spider-symposium.test.mjs` (existing file — extend it, do not create a new
  one)
- Modify: `TODO.md`

**Data source:** `docs/superpowers/research/2026-09-27-airs-of-london-group-c.md` section 8 — 5
rows, all at The Singing Mandrake (the same location `spider-symposium` already covers), confirmed
by grep to be genuinely new content (not a duplicate of anything already in that table).

**Before touching the table:** read `spider-symposium`'s own scope-note comment in
`choice-helper.js` in full — confirm it does not explicitly declare itself "The Singing Mandrake,
in full" in a way that would make silently adding unrelated storylet rows a scope violation; if it
does declare a hard boundary, update that comment to note the extension, don't just add rows
silently.

**Data:** "A quick commission: Ode to the Empress" (0-30, Persuasive 5 broad, Shard of Glim ×30),
"...Hymns to Sobriety" (31-60, Persuasive 5, Shard of Glim ×32), "...Poetry in the Dark" (61-90,
needs HOJOTOHO! 1251, Persuasive 5, Jade Fragment ×36 / fail Piece of Rostygold ×3), "...Songs of
Old" (61-90, needs HOJOTOHO! 1500, no challenge, Romantic Notion ×1 + Nightmares -2), "An especial
appetite" (91-100, Persuasive 7, Piece of Rostygold ×35). Two share the 61-90 window (Poetry in the
Dark, Songs of Old) — both live at once, not a collision (distinct names). Both `HOJOTOHO!`-gated
rows state that requirement in the tooltip (a seasonal/crossover-event quality).

- [ ] **Step 1: Extend `tests/choice-spider-symposium.test.mjs`** with new checks for these 5 rows,
  appended after the existing checks in that file (do not reorganize the existing tests). Pin: all
  5 rows present in the existing table constant (find its exact name via the grep above); the two
  HOJOTOHO!-gated rows state that requirement; the 61-90 pair both resolve independently; the
  existing suite's own pre-existing checks still pass unmodified.

- [ ] **Step 2: Run the existing suite first to confirm it's currently green, THEN see the new
  checks fail (RED) for the 5 new rows only** — this task does not re-verify the whole existing
  suite's RED state, only the new additions'.

```sh
node tests/choice-spider-symposium.test.mjs
```

- [ ] **Step 3: Add the 5 rows to the existing table constant**, following its established row
  field shape exactly (read a few existing rows first to match the shape precisely — do not invent
  new field names that diverge from the table's own convention).

- [ ] **Step 4: GREEN — the whole extended suite, old and new checks together.**

```sh
node tests/choice-spider-symposium.test.mjs
```

- [ ] **Step 5: TODO.md** `Literary Ambitions` → `(implemented; folded into the existing
  spider-symposium feature)`.

- [ ] **Step 6: Commit.**

```bash
git add FallenLondon/choice-helper.js tests/choice-spider-symposium.test.mjs TODO.md
git commit -m "feat: add Literary Ambitions rows to spider-symposium"
```

---

## Task 16: On the Trail (Storylet)

**Files:**
- Modify: `FallenLondon/choice-helper.js`
- Test: `tests/choice-on-the-trail.test.mjs`
- Modify: `TODO.md`

**Data source:** `docs/superpowers/research/2026-09-27-airs-of-london-group-c.md` section 9 — 5
rows. The naming-collision question with `clay-highwayman`'s "On the Trail of the Clay Highwayman"
is CONFIRMED a false alarm (different quality objects, only the short display word coincides) —
standard `carouselRatings` storylet-heading gating (`storylets: ['On the Trail']`, the bare in-game
heading) is sufficient, no bespoke `strict` machinery needed, per the doc's own explicit resolution.
Still add a one-line code comment noting the naming coincidence for a future reader's clarity.

**Data:** "Comb through the papers" (below 51, Watchful 6, On the Trail +1), "Trawl the local
establishments" (below 51, Watchful 6, On the Trail +1), "Take the city's pulse" (below 51 at case
stage 1 / below 34 at stage 2-3, needs Complication: a Surly Goat-Demon as a +10 modifier if
present, Watchful 16, On the Trail +2), "Contact an information broker" (51-100 at stage 1 / 34-66
at stage 2-3, needs Whispered Hint ×10 spent + same Goat-Demon modifier, Watchful 12, On the Trail
+2 / fail Nightmares +2 + Whispered Hint ×10 still spent + Appalling Secret ×1), "Pose as a
housekeeper for the day" (needs Engaged in a Name-Making Case 2, Airs 67, a Faded Morning Suit OR a
Maidservant's Uniform, needs the Goat-Demon absent for full reward, no challenge, On the Trail +1
with Goat-Demon present / +2 absent).

**Badge meaning:** net "On the Trail" progress per action, `?` for the four challenge rows. The
case-stage-dependent Airs windows for "Take the city's pulse"/"Contact an information broker" are
shown as both windows in the tooltip (state stage 1 vs stage 2-3 separately, this script cannot
read which stage is current — show both, marked, per the "unread input shows a range" rule). The
three case-milestone sections lower on the page are explicitly OUT of scope — do not add them.

- [ ] **Step 1: Write `tests/choice-on-the-trail.test.mjs`**. Pin: 5 rows exactly; the two
  stage-dependent rows carry both Airs windows in their data, and the tooltip states both rather
  than picking one; "Pose as a housekeeper" states both Goat-Demon outcomes; no collisions
  (including an explicit check against `clay-highwayman`'s own table, confirming zero shared
  names).

- [ ] **Step 2: RED.**

- [ ] **Step 3: Implement** `ON_THE_TRAIL_OPTIONS`, spec function, `onTheTrailRatings()`.

- [ ] **Step 4: Register** `{ name: 'on-the-trail', run: onTheTrailRatings },`.

- [ ] **Step 5: GREEN.**

- [ ] **Step 6: TODO.md** `(implemented)`.

- [ ] **Step 7: Commit.**

---

## Task 17: Send a Christmas Card

**Files:**
- Modify: `FallenLondon/choice-helper.js`
- Test: `tests/choice-christmas-card.test.mjs`
- Modify: `TODO.md`

**Data source:** `docs/superpowers/research/2026-09-27-airs-of-london-group-c.md` section 10 — 4
card-art variants, IDENTICAL display text ("Send a Christmas Card"), DIFFERENT rewards (Dangerous
+2/Watchful +2/Persuasive +2/Shadowy +2, one per Airs quarter), plus a shared cost (1 Potential
Christmas Card) and a block of retired past-Mayor options (skip entirely) and 3 Fate-priced variants
(not Airs-gated, skip).

**Shape:** single storylet "Send a Christmas Card" (Your Social Engagements, seasonal December),
gate via `carouselRatings`.

**Badge meaning:** since the DOM cannot distinguish which of the 4 identically-titled variants is
live (same display text, this script cannot read Airs), this is ONE merged, informational row —
list all four possible outcomes in the tooltip ("gives one of: Dangerous+2, Watchful+2,
Persuasive+2, or Shadowy+2, depending on the current Airs of London, which this script cannot
read"), never guess or pick one (Review Focus #2/#5 — an honest "range, not a verdict" case, the
Sous Catacombs precedent taken one step further since even the CURRENT option can't be identified,
not just its future value).

- [ ] **Step 1: Write `tests/choice-christmas-card.test.mjs`**. Pin: one merged row exists; its
  tooltip lists all 4 possible stat gains and the "depending on the current Airs... cannot read"
  sentence verbatim-ish (assert the key phrase is present); the retired past-Mayor block and the 3
  Fate variants are absent from the table; no collisions.

- [ ] **Step 2: RED.**

- [ ] **Step 3: Implement** `CHRISTMAS_CARD_OPTION` (a single merged entry, not an array of 4),
  spec function, `christmasCardRatings()`.

- [ ] **Step 4: Register** `{ name: 'christmas-card', run: christmasCardRatings },`.

- [ ] **Step 5: GREEN.**

- [ ] **Step 6: TODO.md** `(implemented)`.

- [ ] **Step 7: Commit.**

---

## Task 18: Four visiting-storylets fold into `someone-is-coming` (8 rows)

**Files:**
- Modify: `FallenLondon/choice-helper.js` (the existing `someone-is-coming` feature's `SIC_OPTIONS`
  table — locate via `grep -n "SIC_OPTIONS\|sicE\|sicGain" FallenLondon/choice-helper.js`)
- Test: `tests/choice-someone-is-coming.test.mjs` (existing file — extend, do not create new)
- Modify: `TODO.md`

**Data source:** `docs/superpowers/research/2026-09-27-airs-of-london-group-d.md` section D — 4
storylets (A Neathy Education, Duty Calls, Visiting the Person who Was your Spouse, Visiting the
Person who Was your Lover), each with 2 Airs-gated options (1-50 / 51-100), all already raising
`Someone Is Coming +1 CP` exactly like the 6 existing `SIC_OPTIONS` gain-rows.

**Data (8 rows total):**

| Storylet | Option (Airs 1-50) | Gives | Option (Airs 51-100) | Gives |
|---|---|---|---|---|
| A Neathy Education | Conduct your lesson | Confident Smile ×1, Memory of Distant Shores ×5, SiC +1 | Go for a walk (with your Daughter) | Sudden Insight ×1, Dubious Testimony ×5, SiC +1 |
| Duty Calls | Take tea (with your Brother) | Confident Smile ×1, Memory of Distant Shores ×5, SiC +1 | Go for a walk (with your Brother) | Sudden Insight ×1, Dubious Testimony ×5, SiC +1 |
| Visiting the Person who Was your Spouse | Take tea (with your Spouse) | Confident Smile ×1, Memory of Distant Shores ×5, SiC +1 | Go for a walk (with your Spouse) | Sudden Insight ×1, Dubious Testimony ×5, SiC +1 |
| Visiting the Person who Was your Lover | Take tea (with your Lover) | Confident Smile ×1, Memory of Distant Shores ×5, SiC +1 | Go for a walk (with your Lover) | Sudden Insight ×1, Dubious Testimony ×5, SiC +1 |

**TRAP (Review Focus applies directly):** "Take tea"/"Go for a walk" alone are dangerously
generic — the wikitext carries a parenthetical ("with your Brother" etc.) on every one, but the
in-game rendered text may or may not keep it. Since `SIC_OPTIONS` is already storylet-scoped (each
row carries its own `storylet` field, looked up the same way Moon-Miser Herding's card-scoped
lookup works in the Firmament batch), scoping by storylet name is already the correct defence
REGARDLESS of whether the game keeps the parenthetical — write the table rows using the bare
name WITHOUT the parenthetical (`'Take tea'`, `'Go for a walk'`), since storylet-scoping already
disambiguates the four, and note in a comment that if the game is later confirmed to KEEP the
parenthetical, the table's `name` fields need updating to match — don't guess.

- [ ] **Step 1: Extend `tests/choice-someone-is-coming.test.mjs`** with 8 new checks. Pin: all 8
  rows present, correctly storylet-scoped; a "Take tea" row under "Duty Calls" does NOT match when
  the open storylet is "A Neathy Education" (the storylet-scoping test — this is the exact defence
  the trap above requires); the existing suite's pre-existing checks still pass.

- [ ] **Step 2: RED** (for the 8 new checks only).

- [ ] **Step 3: Add the 8 rows to `SIC_OPTIONS`**, following its existing `sicE`/row shape exactly.

- [ ] **Step 4: GREEN — the whole extended suite.**

- [ ] **Step 5: TODO.md** — mark all four storylets `(implemented; folded into the existing
  someone-is-coming feature)`.

- [ ] **Step 6: Commit.**

---

## Task 19: Watchmaker's Hill "Name Scrawled in Blood" Airs cluster

**Files:**
- Modify: `FallenLondon/choice-helper.js`
- Test: `tests/choice-watchmakers-hill-airs.test.mjs`
- Modify: `TODO.md`

**Data source:** `docs/superpowers/research/2026-09-27-airs-of-london-group-d.md` section E
(updated 2026-09-28, all six storylets' rewards now fetched) — 6 storylets, all gated on BOTH `A
Name Scrawled in Blood N` and a whole-storylet Airs window (not per-option), together covering the
full 0-100 range at increasing reputation requirements.

**Data:**

| Storylet | A Name Scrawled in Blood | Airs window | Options |
|---|---|---|---|
| A Marksmanship Competition for a Prize of Jade! | 1 | 0-50 | "Stick with shooting bottles off the end of the jetty" (Dangerous 21, Jade Fragment ×21, rare bonus) / "Turn me round!..." (Dangerous 24, Jade Fragment ×24, rare bonus) |
| Donate your body to science for an hour or two | 3 | 0-25 | "Lie very, very still" (Dangerous 45, Jade Fragment ×45) / "Talk them through your wounds" (Dangerous 48, Jade Fragment ×45 + Bottle of Greyfields 1879 ×2) |
| Rescue Shipwrecked Clay Men | 3 | 26-50 | "Go to their assistance" (1 option) |
| Deal with Unfinished Men | 3 | 51-75 | "Stand guard" / "Root out the Unfinished Men" (2 options, rewards not itemised in the research doc beyond availability — badge as informational availability only for this storylet, matching the 4 single-option storylets' treatment) |
| Guard duty at the Observatory | 1 | 51-100 | "Offer your services" (1 option) |
| Provide Training at the Department of Menace Eradication | 3 | 76-100 | "Bring a gun and a stern expression" (1 option) |

Confirmed NOT the same as the existing `menace-eradication` feature (different storylet ID).

**Shape:** `carouselRatings` with all 6 storylet names in `storylets:`, since only one is ever the
"open" one at a time.

**Badge meaning:** for the 4 single-option storylets (Rescue Shipwrecked Clay Men, Deal with
Unfinished Men, Guard duty, Provide Training) and any option whose reward wasn't itemised, badge is
availability in words ("Airs 51-100, A Name Scrawled in Blood 1") — informational, not ranked, since
there's nothing to compare. For the 2 two-option storylets with real Jade Fragment rewards
(Marksmanship Competition, Donate your body), badge = Jade Fragment count (which equals the
Dangerous difficulty on every row, an EPA-of-one-currency ranking, same shape as Clathermont's
Tattoo Parlour) marked `?`.

- [ ] **Step 1: Write `tests/choice-watchmakers-hill-airs.test.mjs`**. Pin: all 6 storylets'
  headings badge with their own A-Name-Scrawled-in-Blood + Airs-window text; the 2 real-reward
  storylets' options show the Jade Fragment count matching their Dangerous difficulty; the 4
  informational storylets never receive a fabricated ranking number; no collisions; confirmed
  distinct from `menace-eradication`'s own storylet.

- [ ] **Step 2: RED.**

- [ ] **Step 3: Implement** `WATCHMAKERS_HILL_AIRS_STORYLETS` (availability table) +
  `WATCHMAKERS_HILL_AIRS_OPTIONS` (the 4 real option rows across the 2 ranked storylets), spec
  functions, `watchmakersHillAirsRatings()`.

- [ ] **Step 4: Register** `{ name: 'watchmakers-hill-airs', run: watchmakersHillAirsRatings },`.

- [ ] **Step 5: GREEN.**

- [ ] **Step 6: TODO.md** — mark all six storylets `(implemented)`.

- [ ] **Step 7: Commit.**

---

## Task 20: An opportunity for profit

**Files:**
- Modify: `FallenLondon/choice-helper.js`
- Test: `tests/choice-opportunity-for-profit.test.mjs`
- Modify: `TODO.md`

**Data source:** `docs/superpowers/research/2026-09-27-airs-of-london-group-d.md` section F — a
card, `Locked with = A Name in Seven Secret Alphabets 3`. Two options: "Eavesdrop (opportunity)"
(Watchful 12, Moon-Pearl ×60 bundled ≤24, rerolls Airs on outcome) and "Buy them both a drink"
(Persuasive 10, costs Piece of Rostygold ×10, gives Favours: Criminals +1, rerolls Airs). Neither
option carries an explicit Airs WINDOW in the fetched text (both just reroll Airs on outcome, no
`Unlocked with`/`Locked with` Airs clause) — badge both as always-available (no Airs-window gate at
all beyond the card's own unlock), noting in a comment that TODO.md's `[1 unlock]` count may refer
to a different reading of the category harvest that this research couldn't confirm; do not invent a
window that isn't in the data.

**Shape:** opportunity card, `eachCardName` + name lookup, no window-based gating needed (both
options always show once the card is unlocked).

**Badge meaning:** flat reward per option (Moon-Pearl ×60 bundled, or Favours: Criminals +1 for a
Rostygold cost) — the faction result on the second option must appear AFTER the badge text per the
file's own faction-result convention (`withFactions`/`factionLine`, see `choice-helper.js`'s
"shared: faction results" section).

- [ ] **Step 1: Write `tests/choice-opportunity-for-profit.test.mjs`**. Pin: 2 options; the bundled
  Moon-Pearl reward shown as `≤24` (not a guessed flat count); the Favours: Criminals result
  appears after the main badge text per the shared `withFactions` convention; no collisions.

- [ ] **Step 2: RED.**

- [ ] **Step 3: Implement** `OPPORTUNITY_FOR_PROFIT_OPTIONS`, spec function using the shared
  `withFactions`/`factionLine` helpers, `opportunityForProfitRatings()`.

- [ ] **Step 4: Register** `{ name: 'opportunity-for-profit', run: opportunityForProfitRatings },`.

- [ ] **Step 5: GREEN.**

- [ ] **Step 6: TODO.md** `(implemented)`.

- [ ] **Step 7: Commit.**

---

## Task 21: The Alleys of Spite

**Files:**
- Modify: `FallenLondon/choice-helper.js`
- Test: `tests/choice-alleys-of-spite.test.mjs`
- Modify: `TODO.md`

**Data source:** `docs/superpowers/research/2026-09-27-airs-of-london-group-d.md` section F — a
storylet, two options: "Follow an unsuspecting mark" (Airs 0-50, Shadowy 3, Whispered Hint ×3, a
rare success) and "Eavesdrop on a random target" (Airs 51-100, Shadowy 4, Whispered Hint ×10). Both
`Locked with = A Name Whispered in Darkness` (state as a requirement in the tooltip). Confirmed not
in any existing Spite feature's table (`spite-card-ratings`, `season-in-soup`,
`boxful-of-intrigue`, `underclay` all checked).

**Shape:** single storylet "The Alleys of Spite", gate via `carouselRatings`.

**Badge meaning:** flat Whispered Hint reward, `?` marked (stat challenge, very low difficulty).
Both rows state the "A Name Whispered in Darkness" requirement.

- [ ] **Step 1: Write `tests/choice-alleys-of-spite.test.mjs`**. Pin: 2 rows; both state the shared
  requirement; no collisions (explicit check against the 4 named Spite features' tables).

- [ ] **Step 2: RED.**

- [ ] **Step 3: Implement** `ALLEYS_OF_SPITE_OPTIONS`, spec function, `alleysOfSpiteRatings()`.

- [ ] **Step 4: Register** `{ name: 'alleys-of-spite', run: alleysOfSpiteRatings },`.

- [ ] **Step 5: GREEN.**

- [ ] **Step 6: TODO.md** `(implemented)`.

- [ ] **Step 7: Commit.**

---

## Task 22: The Flit and its King

**Files:**
- Modify: `FallenLondon/choice-helper.js`
- Test: `tests/choice-flit-and-its-king.test.mjs`
- Modify: `TODO.md`

**Data source:** `docs/superpowers/research/2026-09-27-airs-of-london-group-d.md` section H1, PLUS
the two "Race Across the Flit" option pages fetched directly during planning (not yet in any
research doc — full data given here, closing the one gap the research left open).

**Full data (three Airs-window redirects, all Shadowy-challenge, Whispered-Hint/Proscribed-Material
rewards):**

| Airs | Redirect | Sub-option | Challenge | Success | Failure |
|---|---|---|---|---|---|
| 0-33 | Getting to know the Flit | Go for a wander | Shadowy 61 | Whispered Hint ×61 | (not itemised — check the option page if a failure branch turns out to exist; the research doc did not record one) |
| 0-33 | Getting to know the Flit | Go for a run! | Shadowy 64 | Whispered Hint ×64 | (same caveat) |
| 34-66 | Courier for Revolutionaries | Taking messages | Shadowy 66 | Proscribed Material ×17 | (same caveat) |
| 67-100 | Race across the Flit → Race Across the Flit | "Spire runners – to the guttering!" | Shadowy 69 (broad) | Moon-Pearl ×69 | Wounds +1 |
| 67-100 | Race across the Flit → Race Across the Flit | Hell for leather | Shadowy 72 (broad) | Drop of Prisoner's Honey ×36 (rare: Bottle of Strangling Willow Absinthe ×3) | Wounds +2, moved to Watchmaker's Hill |

No existing feature touches "The Flit and its King" or any of its sub-storylets (checked against
`arbor`, `the-hunt-is-on`, `running-battle`, and a general "Flit" grep).

**Shape:** `carouselRatings` with `storylets: ['The Flit and its King', 'Getting to know the Flit',
'Courier for Revolutionaries', 'Race across the Flit', 'Race Across the Flit']` — note the two
differently-capitalised "Race across/Across the Flit" names are BOTH real (one is the redirect
OPTION's own display text inside "The Flit and its King", the other is the STORYLET it opens into —
confirmed two distinct pages in the fetch above) — include both exact strings in `storylets:`.

**Badge meaning:** flat Whispered-Hint/Proscribed-Material/Moon-Pearl reward per action, `?` marked
(all stat challenges, no Luck odds given). "Hell for leather"'s failure MOVES the player to
Watchmaker's Hill — state this explicitly in the tooltip as a real side effect, not just a menace
cost.

- [ ] **Step 1: Write `tests/choice-flit-and-its-king.test.mjs`**. Pin: all 5 rows across the two
  storylet layers; "Hell for leather"'s tooltip states the Watchmaker's Hill move; the two
  differently-named "Race a/Across the Flit" storylets both gate correctly; no collisions.

- [ ] **Step 2: RED.**

- [ ] **Step 3: Implement** `FLIT_AND_ITS_KING_OPTIONS`, spec function, `flitAndItsKingRatings()`.

- [ ] **Step 4: Register** `{ name: 'flit-and-its-king', run: flitAndItsKingRatings },`.

- [ ] **Step 5: GREEN.**

- [ ] **Step 6: TODO.md** `(implemented)`.

- [ ] **Step 7: Commit.**

---

## Task 23: Bones in the River

**Files:**
- Modify: `FallenLondon/choice-helper.js`
- Test: `tests/choice-bones-in-river.test.mjs`
- Modify: `TODO.md`

**Data source:** `docs/superpowers/research/2026-09-27-airs-of-london-group-d.md` section H1 — a
card, two options: "Explore the riverbank in low tide" (Airs 0-25, Watchful 200, Headless Skeleton
×1 + Unidentified Thigh Bone ×1, rerolls Airs) is the Airs-gated one; "Search an especially useful
bit of shore" (gated by the item "Survey of the Neath's Bones", not Airs — Watchful 200, Knotted
Humerus ×1 / fail Femur of a Surface Deer + Nightmares +1) is real but not Airs-specific — include
both since they're two faces of the same card, per the research doc's own recommendation.

**Shape:** opportunity card "Bones in the River", `eachCardName` + name lookup for the card, plus
its two options via the opened-card `.branch__title` path (same `carouselRatings`
multi-storylet-name pattern used throughout this plan, `storylets: ['Bones in the River']`).

**Badge meaning:** both options are flat item rewards at the same Watchful 200 difficulty, marked
`?`. The item-gated option states its requirement (Survey of the Neath's Bones) in the tooltip.

- [ ] **Step 1: Write `tests/choice-bones-in-river.test.mjs`**. Pin: 2 rows; the item-gated row
  states its requirement; no collisions.

- [ ] **Step 2: RED.**

- [ ] **Step 3: Implement** `BONES_IN_RIVER_OPTIONS`, spec function, `bonesInRiverRatings()`.

- [ ] **Step 4: Register** `{ name: 'bones-in-river', run: bonesInRiverRatings },`.

- [ ] **Step 5: GREEN.**

- [ ] **Step 6: TODO.md** `(implemented)`.

- [ ] **Step 7: Commit.**

---

## Task 24: The Chandleress' Complaint

**Files:**
- Modify: `FallenLondon/choice-helper.js`
- Test: `tests/choice-chandleress-complaint.test.mjs`
- Modify: `TODO.md`

**Data source:** `docs/superpowers/research/2026-09-27-airs-of-london-group-d.md` section H1 — 4
options total, 1 Airs-gated ("Confide in the Chandleress", Airs 96-100, a narrow window, Favours:
The Docks +1, Dangerous −5 CP, rerolls Airs), 3 not ("Light a candle, and wait" — Dangerous 10,
Lump of Lamplighter Beeswax scaled to Dangerous; "Ask the Chandleress about the rat-catchers'
traditions" — Persuasive 10, Whispered Hint ×30; "Back to the Department 2" — a 0-cost exit
redirecting to "The Department of Menace Eradication", already a different storylet/table,
`DME_DEPARTMENT` — no collision, but note the redirect in this feature's tooltip for context).

**Shape:** single storylet "The Chandleress' Complaint", gate via `carouselRatings`. Include all 4
options in the table (the research doc recommends this — "all four options real and fetched" — even
though only one is Airs-specific, since they're all on the same storylet face).

**Badge meaning:** flat rewards per option; the Airs-gated one marked with its narrow 96-100 window;
the redirect option gets an informational note about where it leads, not a ranked value.

- [ ] **Step 1: Write `tests/choice-chandleress-complaint.test.mjs`**. Pin: 4 rows; the Airs-gated
  row's narrow window is exact (96-100, not rounded); the redirect option's tooltip names "The
  Department of Menace Eradication"; no collisions with `DME_DEPARTMENT` or anything else.

- [ ] **Step 2: RED.**

- [ ] **Step 3: Implement** `CHANDLERESS_COMPLAINT_OPTIONS`, spec function,
  `chandleressComplaintRatings()`.

- [ ] **Step 4: Register** `{ name: 'chandleress-complaint', run: chandleressComplaintRatings },`.

- [ ] **Step 5: GREEN.**

- [ ] **Step 6: TODO.md** `(implemented)`.

- [ ] **Step 7: Commit.**

---

## Task 25: Metadata, docs, and full-suite verify

**Files:**
- Modify: `FallenLondon/choice-helper.js` (`@version` bump)
- Modify: `all-in-one/fallen-london.js` (`@version` bump, by hand)
- Modify: `README.md` (choice-helper.js feature row)
- Modify: `AGENTS.md` (test-file-list entries for all 22 new/extended test files + a "Not verified
  in-game" entry)
- Modify: `TODO.md` (move all 22 newly-implemented entries — and the 2 fold-in groups' 4+1
  storylets — from the open list into the "Implemented" section, matching the exact move already
  done for the Firmament batch; add "Early/Mid/Late Firmament"-style new stage headings as needed,
  or a new "Airs of London storylets" implemented sub-heading, following the existing Implemented
  section's own layout conventions)
- Modify: `tests/choice-crowds-of-spite.test.mjs`, `tests/choice-fruits-of-the-zee.test.mjs`,
  `tests/choice-zailing.test.mjs` (the three roster-pinning suites — append all 22 new feature
  names, exact same fix shape the Firmament batch's own ledger already documents)

- [ ] **Step 1: Run `check.mjs` first** to see the roster-mismatch failures precisely:

```sh
node .claude/skills/adding-fallen-london-features/check.mjs
```

- [ ] **Step 2: Fix the three roster suites** — append the 22 new feature names
  (`rattus-faber`, `tower-of-eyes`, `feast-of-the-rose`, `festive-fir`, `cheery-man-constable`,
  `time-in-bed`, `burning-city`, `university-creatures`, `clay-quarters`,
  `mutually-agreed-divorce`, `hallowmas-visitor`, `clathermont-tattoo`, `shifting-streets`,
  `candlefinder-clay-men`, `on-the-trail`, `christmas-card`, `watchmakers-hill-airs`,
  `opportunity-for-profit`, `alleys-of-spite`, `flit-and-its-king`, `bones-in-river`,
  `chandleress-complaint`) to each of the three suites' hardcoded roster arrays. (`spider-symposium`
  and `someone-is-coming` are NOT new names — Tasks 15 and 18 extended existing features, no roster
  change needed for those two.)

- [ ] **Step 3: Bump `@version`** in `FallenLondon/choice-helper.js`'s `// ==UserScript==` block
  (one bump covering all 22 features), then run `node scripts/bump-loaders.mjs` to auto-bump
  `all-in-one/fallen-london.js`.

- [ ] **Step 4: Extend the feature write-up block comment** right after `// ==/UserScript==`, one
  short bullet per new feature group (can group thematically, e.g. "Rattus Faber, Tower of Eyes,
  Feast of the Rose, Festive Fir, Coffee/Cheery Man — six more Firmament-shelf... no, Airs of London
  storylets, all card-and-storylet markup" — keep `@description` itself unchanged).

- [ ] **Step 5: Add a row to `README.md`**'s `choice-helper.js` feature table (append a sentence to
  its existing cell, matching how the Firmament batch's own README update worked — find the exact
  cell via `grep -n "^| \`choice-helper.js\`" README.md` and append before the closing `|`).

- [ ] **Step 6: Add `AGENTS.md` test-file-list entries** for all 22 new test files plus a short note
  on the 2 extended ones (Tasks 15, 18), inserted before the `tests/fl-shared-helpers.test.mjs`
  bullet, matching the exact insertion point and format the Firmament batch used.

- [ ] **Step 7: Add ONE combined "Not verified in-game" entry** to `AGENTS.md`'s existing list
  (same section the Firmament batch extended, `AGENTS.md` around the "**Not** verified in-game"
  heading), covering: the parenthetical-vs-bare option-name question for Task 18's four visiting
  storylets; whether the two "Race a/Across the Flit" storylet names both actually appear as
  written; the Cabinet Noir/deciphering/disappearing cross-reference confirmation (Task 0); and a
  pointer to this plan + all four research docs for anything else unverified.

- [ ] **Step 8: Move all newly-implemented entries in `TODO.md` from the open "Airs of London
  storylets (no guide)" list into the "Implemented" section**, following the exact same
  cut-from-open-list-paste-into-Implemented-section move already performed for the Firmament batch
  earlier in this session (verify each moved guide's URL appears exactly once in the whole file
  afterward, same sanity check).

- [ ] **Step 9: Full verify.**

```sh
node --check FallenLondon/choice-helper.js
node .claude/skills/adding-fallen-london-features/check.mjs
for t in tests/*.test.mjs; do node "$t" | tail -1; done
node scripts/bump-loaders.mjs --check
```

Read each suite's actual final line rather than grepping for one string (`all good`, `All passed`,
`All checks passed.` all appear across this repo's suites).

- [ ] **Step 10: Commit.**

```bash
git add -A
git commit -m "docs: version bump and write-up for the 22 Airs of London storylet badges"
```

---

## Self-Review

**Spec coverage:** every storylet in all 4 research docs that resolves to real, badge-worthy
content has a task (Tasks 1-24, two of which extend existing features rather than adding new ones).
Every storylet that resolves to no-code has a Task 0 line with its specific reason. The two data
gaps the research left open (Pursuing a Mutually-Agreed Divorce's table, Race Across the Flit's two
options) are both closed with real fetched data directly in Tasks 10 and 22 — no task in this plan
rests on unfetched data.

**Placeholder scan:** every task names its exact data source (a research doc section, or an inline
table for the two gap-closures) and its exact badge-meaning decision — no task says "similar to
Task N" without also giving its own concrete field-by-field reward table or a direct pointer to
one already written out in full elsewhere.

**Type consistency:** every task's table follows the `aolE`/`AOL_OPTIONS` field shape
(`storylet`, `name`, `airs`, `ch`, `g`/`u`, `q`/`f`, `open`, `re`, `needs`, `fail`, `note`) already
established in the file, or the simpler flat-reward shape used by the Firmament batch's carousels
where a table doesn't need the full field set — consistent within each task and across the batch.

**Review Focus:** all five items (multi-window merges, nothing-to-badge honesty, overlapping
windows, gated-option disclosure, unread-live-value honesty) each have specific tasks named against
them above, with the specific test assertion each owning task must add.

## Execution Handoff

Plan complete and saved to `docs/superpowers/plans/2026-09-28-airs-of-london-remainder.md`. Please
review it. Given the size (25 tasks, 22 of them independent new features with no cross-task
interface dependencies beyond the two fold-ins each touching one pre-existing table once), I
recommend the same **native** execution the Firmament batch used — one fresh reviewer on the whole
branch at the end catches cross-cutting issues (name collisions, roster-suite misses, the
merge/duplicate-row trap) more efficiently than 22 separate per-task reviews would, and the plan
itself already carries the full data and design for each task. Does the plan capture what you
want, and should I proceed the same way (native, in this session)?
