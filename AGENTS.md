# AGENTS.md

Guidance for AI agents (and humans) working in this repository.

## What this is

A collection of standalone **userscripts** (Tampermonkey / Greasemonkey / Violentmonkey)
for three browser games:

- `KingdomOfLoathing/` — scripts for kingdomofloathing.com
- `TwilightHeroes/` — scripts for twilightheroes.com
- `FallenLondon/` — scripts for fallenlondon.com

- `all-in-one/` — one "loader" userscript per game (`kingdom-of-loathing.js`,
  `twilight-heroes.js`, `fallen-london.js`). Each carries no logic of its own; it
  `@require`s every individual script for that game from GitHub, so a single install
  pulls in the whole set. Bumping a loader is automated — see `scripts/bump-loaders.mjs`.

There is **no build, no bundler, no package manager, and no lint config**, and no test *runner*
or framework. The only tests are a handful of **standalone, dependency-free Node scripts** that
live in a `test/` subfolder inside each game directory (e.g. `KingdomOfLoathing/test/`), named
`*.test.mjs`, and are run directly with `node <path>` — see "Verifying a change" below.
Each `.js` file is the shippable artifact: a single self-contained IIFE prefixed with a
`// ==UserScript== ... // ==/UserScript==` metadata block. You edit the file, the user
reloads it in their userscript manager. "Running" a script means installing it in a
userscript manager and loading the matching game page — it cannot be exercised from this repo.

## Distribution model (important)

Each script carries a `@downloadURL` pointing at its own raw GitHub path on `main`, e.g.
`https://raw.githubusercontent.com/.../main/KingdomOfLoathing/iotm.js`. Consequences:

- **The file's location in the repo is its public URL.** Renaming or moving a file breaks
  auto-updates for everyone who has it installed. If you move one, update its `@downloadURL`.
- **Bump `@version` on any user-facing change.** Userscript managers only pull updates when
  the remote `@version` is higher than the installed one. An edit without a version bump will
  not reach installed users.
- Keep the `@match` / `@include` lines in sync with the actual page(s) the script touches.
  Both bare and `www.` hosts are matched deliberately; preserve both.

## Conventions that recur across scripts

- **`@name` starts with the game's prefix** so a script sorts next to its siblings in the
  userscript manager's (alphabetical) list. Use exactly: `Twilight Heroes ` for `TwilightHeroes/`,
  `KoL ` for `KingdomOfLoathing/`, and `Fallen London ` for `FallenLondon/` (e.g.
  `Twilight Heroes Autobox`, `KoL IotM Menu`, `Fallen London Wiki Links`). Keep the
  prefix identical across a game's scripts — don't expand `KoL` to `Kingdom of Loathing` for
  one script, or it'll sort away from the rest.
- One IIFE, `'use strict';`, no external dependencies, `@grant none` (plain page APIs only).
- **Idempotency guard**: before injecting UI, bail if the element already exists
  (e.g. `if (document.getElementById(...)) return;`). Scripts may run more than once per page.
- **Defensive DOM scraping**: these games emit legacy table/`<font>` HTML. Scripts locate
  anchors by walking from a known `<h2>`/icon, checking `colspan`/`width` attributes, etc.,
  with fallbacks rather than assuming a fixed structure. Match this style when extending them.
- Inline styles via `el.style.cssText`; no stylesheets.

## Game-specific notes

**Kingdom of Loathing** is **frameset-based**. The UI is split across `topmenu`/`awesomemenu`,
`charpane`, and `mainpane` frames. Two things follow:

- State you need may live in a *sibling frame* — see `iotm.js` `getPwd()`, which probes
  inputs, page globals, links, `top.frames['charpane']`, and inline script text in turn.
- Any action-triggering request needs the player's **`pwd` hash** appended; without it the
  server rejects the request. Navigate `top.frames['mainpane']` to show results, or `fetch`
  with `credentials: 'same-origin'` to fire silently.
- **`choice.php` is shared by every choice adventure.** A script matching it must identify the
  specific choice before injecting anything — gate on the hidden `whichchoice` value (e.g.
  `iotm.js` only acts when `input[name="whichchoice"][value="1588"]`, the Eternity Codpiece
  decoration screen, is present). `iotm.js` also shows the pattern for applying several
  form submissions in one go: replay each slot's `Replace` form as a sequential
  `fetch(... credentials:'same-origin')` POST, then `location.reload()` once so the server stays
  authoritative about item availability rather than trusting the stale page. Because those POSTs
  are what *change* availability, a multi-step action must not pre-filter its plan against the
  page (a gem mounted in the wrong slot looks unavailable everywhere else); `planMrStore` instead
  emits a removal phase first, then the mounts. Only the Replace option (`option=1`) is hardcoded
  — the remove action's option value and fields are read off the slot's own form and replayed. Named gem setups
  are persisted in `localStorage` under `tm-codpiece-setups`. Gems are bucketed into the panel's
  filter categories by **matching text in the `<option>` label**, never by item ID; the Mr. Store
  (IotM) bucket therefore matches each gem by its item name *or* its enchantment, since it isn't
  verified in-game which of the two KoL renders there.
- `quest-helper.js` is the other `choice.php` script: a small registry of puzzle answers
  (`PUZZLES`, keyed by `whichchoice`) with a UI bar injected only when a matching choice is
  on screen. It deliberately **never submits** — each entry's button only fills the form in,
  and the player presses KoL's own submit button, so a wrong database entry can't burn a turn.
  The `selects` puzzle type stores each answer as both an item id (the `<option>` value, the
  primary key) and its label (fallback). Add new puzzles as entries, not as new files. Because
  a choice page carries the same `whichchoice` on several forms (the action form *and* "Leave"),
  `findSelectsForm` matches on the puzzle's fields too rather than taking the first hit.
  A second type, `tiles` ("step on these, in this order"), only *highlights* — reusing
  `mine-sparkle-highlight.js`'s gold JS-timer pulse, and for the same CSP reason (KoL allows
  inline style attributes but blocks script-injected stylesheets, so CSS classes/`@keyframes`
  do nothing). Its entry is **Beginning at the Beginning of Beginning**, the Hidden Temple tile
  floor, and it shows why the registry has a `page` regex: that puzzle is *not* on `choice.php`
  at all — it uses a custom **`tiles.php`** endpoint, with its first screen rendered as an
  ordinary `adventure.php` result. With no `whichchoice` to gate on it uses `detect` instead
  (≥4 lettered tile images on the page), which is also what keeps it quiet on the rest of
  `adventure.php`.
  The path rule is **positional, not a letter hunt**: you stand on the arrow row and jump one
  row up at a time, and the 7-row grid spells `BANANAS` bottom-to-top, one tile per row. So
  `planTiles` counts the rows still *above the arrows* and takes that many letters off the **end**
  of the word — which self-corrects as the page re-renders between steps (6 rows left ⇒
  `ANANAS`) and after a fatal misstep restarts the puzzle, so the script keeps no state. It's
  kept DOM-free (rows in, indices out) for that reason and to stay unit-testable. What is
  *unverified* is only the artwork: `letterOfTile`/`isArrow` read `tile<letter>.gif` and
  `left/rightarrow.gif` off the wiki's copies of the images, with an alt/title fallback — if the
  live `tiles.php` names them differently, those two functions are the only things to fix.
  A third type, `rotation`, is **Control Freak** (choice 929), the pyramid control room. The
  Lower Chambers sit on a five-position turntable and each wheel/ratchet used on the peg
  advances it by one, wrapping 5→1 — the flavour text says "anti-clockwise", but that's the
  only reading under which the wiki's walkthrough (3 turns from 1 reach 4, then 4 reach 3,
  then 3 reach 1 = 10 turns, 2 cycles) is arithmetically consistent. Only three stops ever
  do anything, each once and in order: **4** gives the bronze token, **3** spends it on the
  bomb, **1** blows the rubble open; **2** and **5** have rats and never give anything. The
  trap this exists to prevent is at the *end* — turning the peg again after the rubble is
  blown re-buries it and costs a fresh token *and* a fresh bomb.
  Because `choice.php` can't see your inventory, state is inferred and kept in `localStorage`
  under `tm-pyramid-rotation` (suffixed with the character name off the charpane's
  `charsheet.php` link, so a multi doesn't share one pyramid; expires after 30 days since the
  quest is per-ascension). Two signals feed it, and the split matters: **rotations** are
  detected by the position changing between page loads — no click hook, and the delta is
  still correct mod 5 if the peg was turned with the script off — while **descents** must be
  hooked on the "Head down to the Lower Chambers" option, because clicking it navigates away
  and the outcome is never visible to us. Each logged descent stores a signature of what you
  were carrying, which is what lets a repeat trip to the same position with the same setup be
  called out as the wasted turn it is.
  The believed position (`pos`) is deliberately **separate** from the raw scraped number
  (`seen`): the position is read from the `pyramid_readout<N>.gif` artwork (the `a`/`b`
  variants are mid-rotation animation frames and are ignored) with the `(N)` in the descend
  option's own label as a second opinion, and **neither is verified against the live page**.
  Keeping them apart means a consistently *mislabelled* readout still yields correct turn
  *deltas*, and one hand correction in the bar's manual row fixes the absolute value for good
  instead of being stomped on the next load. That manual row — position, carried items, undo
  last trip, reset — is the escape hatch for every inference here; don't remove it.
  The pure logic (`turnsTo`/`advance`/`applyVisit`/`unapplyVisit`/`applyTurn`/
  `turnsRemaining`/`rotationAdvice`) is DOM-free for the same reason as `planTiles`.
  Note `tiles` and `rotation` auto-run on sight since highlighting and advising commit
  nothing, while `selects` stays behind its button — hence `auto` on the registry entry.
  `rotation` also has no button at all (nothing to trigger) and instead brings its own body
  via the handler's optional `extras` hook, since one status line can't carry state plus
  corrections.
- `ux-enhancers.js` is the catch-all for unrelated small tweaks. It's a `FEATURES` registry of
  `{ name, path, run }`, each entry scoped to its own pathname and each `run` wrapped in a
  try/catch so one broken feature can't take the others down — add a tweak as an entry, not as
  a new file, and add its page to `@match`. Two features so far. The Hermit one buys clovers
  one at a time because the page never says how many are left, stopping when a trade stops
  producing an item.
  The other guards **A Beer Garden** on `campground.php`: barley and hops grow 3/day, but the
  fancy bottles and labels — the Let's Brew! currency, and the only reason to wait — don't
  drop at all until **day 2**, and the game asks nothing before a harvest. So the crop gets a
  tooltip with its yield, an outline when it's short of two days, and a `confirm()` on the way
  past. That interception is a **document-level capture listener**, deliberately: a listener
  on the link itself would run *after* any inline `onclick` KoL put there, because handlers at
  the target fire in registration order and the page's own were registered while it parsed.
  Catching it on the way down and calling `stopPropagation()` means the click never reaches
  the link; the confirmed retry is let through by a `data-` flag.
  Days of growth are read from the crop artwork (`beergarden<N>.gif`, N taken as the day) and
  that mapping is **unverified against a live campground** — so every step of the feature
  **fails open**: unreadable number, unrecognised crop or no harvest link and it does nothing
  at all. Keep it that way. A guard that fires on the wrong crop, or blocks a ripe harvest, is
  worse than no guard, and this is the one script here that stands between the player and an
  irreversible click.

**Twilight Heroes** is plain (non-frame) pages scraped from table layout. State that must
survive the full-page reload after equip/unequip/use is stashed in `sessionStorage`
(see `inventory-filter.js`, keyed per page via `TEXT_KEY`/`TYPE_KEY`). That one script
serves several pages with the same `<td width=50%><b>name</b></td>` item layout
(wear.php, inventory.php, use.php) by matching all of them and locating the table from a
known `<h1>`/`<h2>` heading; extend `HEADINGS` rather than forking the file when another
such page turns up.

`autobox.js` is a *multi-page* TH script: its `main.php` branch injects the trigger button,
and its `criminology.php` branch drives the Black Box quest across the page reloads that each
form submission causes. The "run in progress" flag lives in `sessionStorage` (`th-autobox-active`)
— the same survive-the-reload pattern, but it spans navigation between two different pages, so
each branch is gated on `location.pathname` up front (also what makes it safe to bundle). The
quest-advancing logic it inherits from the legacy original is index-based (`forms.length > 3` →
submit `forms[2]`, else follow the first `<a>`) and is **unverified against the live page**;
preserve it faithfully rather than "improving" form heuristics you can't test in-game.

**Fallen London** is a different animal from the other two: a **single-page React app**.
There are no per-page URLs to `@match` — everything happens under `fallenlondon.com/*`, and
the game swaps storylets, branches and results into the DOM client-side without any page
navigation. Two consequences:

- A one-shot `document-idle` pass (the KoL/TH model) misses anything drawn after load.
  Scripts must re-scan on DOM changes — see `wiki-links.js`, which runs once and then on a
  debounced `MutationObserver(document.body, {childList, subtree})`, relying on a per-element
  `data-*` flag to stay idempotent across the repeated passes.
- `wiki-links.js`'s selectors are verified against real HTML. The wiki-link helper is confirmed
  (the wiki is MediaWiki; `wiki/Special:Search?search=...&go=Go` resolves exact titles and
  otherwise lands on search results). A storylet title shows up three ways, all badged: in a list
  it's `<h2 class="... storylet__heading">` inside `.media.storylet`; atop an opened storylet it's
  `<h1 class="... storylet-root__heading">` inside `.media--root`; and each opportunity card in hand,
  which has two layouts. In the compact (small-media) layout the card title is a bare
  `<h2 class="media__heading ...">` reached by scoping `.hand .small-card__body .media__heading`
  (the bare `.media__heading` alone would also hit the "Opportunity deck" label and storylet
  headings, so the `.hand` scope is what keeps it to in-hand cards). In the full-width layout the
  card is image-only with no heading — the title lives solely in `.hand__image`'s `alt`/`aria-label`
  — so it's handled by a separate `linkHandCards()` that reads that attribute and overlays a badge in
  the card corner (rather than the text-append path). The text selectors that go through `addBadge`
  live in one `TITLE_SELECTORS` array. Two things are deliberately NOT matched: the unscoped
  `.media__heading` (reused all over the SPA — would over-badge), and `.branch__title`, the per-choice
  titles inside an opened storylet (they're choices, not articles — left unlinked by request).

## Verifying a change

There is (almost) nothing to run here. Validate by reasoning about the DOM the script targets
and, when possible, by installing the edited file in a userscript manager against the live page.
Don't claim a script "works" from static review alone — say it's untested in-game.

The exception is the bits of **pure logic** worth verifying without a browser. Those are covered
by **standalone Node test scripts** under a `test/` subfolder in the relevant game directory,
named `*.test.mjs`. Each is dependency-free (no runner, matching the no-build convention): it
names its script's IIFE, evaluates it against a stub DOM, and returns the internals to assert on.
Run one directly, e.g.:

```
node KingdomOfLoathing/test/iotm-cup13-sort.test.mjs
node TwilightHeroes/test/quest-helper.test.mjs
```

Current tests:

- `TwilightHeroes/test/quest-helper.test.mjs` — asserts `quest-helper.js`'s per-stage hint
  lookup resolves correctly. If you add quests/stages to that hint map (especially
  overlapping-text stages), add a case here too.
- `KingdomOfLoathing/test/ux-beer-garden.test.mjs` — asserts `ux-enhancers.js`'s beer garden
  yield table against the wiki's (3 barley/hops per day, clamped at day 7; day 1 gives no
  fancy item and day 2 gives the first, which is where the threshold comes from), what the
  `confirm()` text says, and that `findBeerGarden` reads the day off the artwork while
  ignoring other crops and other campground images. If you touch the table or the artwork
  regex, adjust this test.
- `KingdomOfLoathing/test/daily-checklist-seeding.test.mjs` — asserts `daily-checklist.js`'s
  `applySeeds`: order on a fresh list, and that a new default reaches a list someone already
  has, in the right place and exactly once. Two traps it pins down — resting, the tea tree
  and the garden all link to plain `campground.php`, and a seed's url is only its identity
  when **one** seed uses it (`SEED_URL_USES`), or the new pair would match the resting entry
  already in the list and never seed at all; and since there's no reordering UI, a new
  default is spliced in after the seed it follows in `SEED_ITEMS` rather than appended, so it
  doesn't land at the bottom of an existing list. Add a case when you add a seed that shares
  a url with another, and remember to bump `SEED_VERSION`.
- `KingdomOfLoathing/test/quest-helper-rotation.test.mjs` — asserts `quest-helper.js`'s
  Control Freak logic: the turntable arithmetic, what each of the five stops does for each
  inventory state, undo as the exact inverse, the "a turn re-buries the chamber" rule, and
  that a simulated run from a fresh pyramid costs exactly the wiki's 10 wheels. Note it
  cannot use the usual append-a-return trick — the script's page dispatch bails early — so it
  hands the helpers back by replacing the `const puzzle = currentPuzzle();` line instead. If
  you touch that line or the rotation state machine, adjust this test.
- `KingdomOfLoathing/test/iotm-cup13-sort.test.mjs` — asserts `iotm.js`'s Cup-of-13s option
  parser and each ingredient sort order (advs / effect / inventory / name). If you touch that
  parsing or the sort comparators, add/adjust a case here.
- `KingdomOfLoathing/test/iotm-codpiece-categories.test.mjs` — asserts `iotm.js`'s codpiece
  gem bucketing: every `MR_STORE_GEMS` entry matches both its item name and its enchantment,
  no entry claims another's label, near-miss mundane gems (torquoise's `Weapon Damage +10%`,
  `So-So Spooky Resistance`) stay out of the Mr. Store bucket, and the pre-existing buckets
  still resolve. Also covers `planMrStore`, the "Insert all" planner (removal phase, consecutive
  slot packing, unowned gems). Add a case when a new IotM gem or category shows up.

The re-expose trick (rename `(function () {` and `return { ... }` the helpers before `})()`) is
how a test reaches an IIFE's internals — copy an existing test when adding one, and put it in the
game's `test/` subfolder.
