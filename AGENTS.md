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
live in the `tests/` folder at the repo root, named `*.test.mjs`, and are run directly with
`node <path>` — see "Verifying a change" below.
Each `.js` file is the shippable artifact: a single self-contained IIFE prefixed with a
`// ==UserScript== ... // ==/UserScript==` metadata block. You edit the file, the user
reloads it in their userscript manager. "Running" a script means installing it in a
userscript manager and loading the matching game page — it cannot be exercised from this repo.

## Knowledge files (`okf/`)

Facts about how a game behaves that took a capture to establish are written down in **OKF**
(open knowledge format) files, under `okf/<game>/`, not only in code comments. Currently
`okf/fallen-london/`: `index.md` (start here), `api.md` (the game's web API: base URL, the
bearer token, every endpoint seen and its reply shapes), `challenges.md` (broad and narrow
chances, the 10% floor and 100% cap, how to infer what the game does not send),
`equipment.md` (slots, item bonuses, effective versus base level, equipping) and
`open-questions.md` (what has not been captured).

The format is structured markdown: a front-matter block (`okf: 1`, `title`, `kind`,
`status`, `verified` or `updated`, `see_also`), one topic per file, tables for shapes, and
every claim labelled **verified** (say against what), **assumed**, or **unknown**. Unknown
things live only in `open-questions.md`.

How to use them: read the matching file before writing code against the game's API or its
numbers; when a capture settles a question, move the fact into the right file and delete
the open question; when code depends on an assumption, keep it labelled *assumed* there and
check it at run time in the script. Never put a login token, a character name or other
personal data in them, and do not commit raw captures.

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
- **Deleting a script leaves it installed.** A dead `@downloadURL` stops delivering updates but
  does not uninstall anything, so anyone who installed that file keeps running the last copy
  they fetched, forever, against a page that moves on without it. So when a script is removed or
  folded into another one, three things have to happen together: drop its `@require` from the
  matching `all-in-one/` loader and bump the loader's `@version` by hand (`bump-loaders.mjs`
  leaves a loader alone once you have edited it yourself); bump the absorbing script's
  `@version`; and **add a row to README's "Merged / removed scripts" table** saying where the
  feature went and which version of the new host first carried it. That table is the only place
  a user can find out why their script went quiet — keep it current, and don't drop rows from it
  later, since the stale installs it addresses never expire.

## Conventions that recur across scripts

- **`@name` starts with the game's prefix** so a script sorts next to its siblings in the
  userscript manager's (alphabetical) list. Use exactly: `Twilight Heroes ` for `TwilightHeroes/`,
  `KoL ` for `KingdomOfLoathing/`, and `Fallen London ` for `FallenLondon/` (e.g.
  `Twilight Heroes Autobox`, `KoL IotM Menu`, `Fallen London Wiki Links`). Keep the
  prefix identical across a game's scripts — don't expand `KoL` to `Kingdom of Loathing` for
  one script, or it'll sort away from the rest.
- **`@description` is one short line; the feature write-up is a block comment.** A metadata
  tag that runs to thousands of characters breaks syntax highlighting for the rest of the file
  and is miserable to read or diff. Keep `@description` to a single sentence (roughly 100
  characters or fewer) saying what the script is for. Put the full user-facing description of
  what it does — every feature, its limits, any "install X as well" note — in a `/* ... */`
  block comment directly after `// ==/UserScript==` and before the IIFE, headed by the script's
  `@name`, wrapped at about 100 columns, one bullet or short paragraph per feature. Add a new
  feature to that block, not to `@description`. This is separate from the developer notes
  inside the IIFE, which explain how the code works rather than what it does for the player.
  The `all-in-one/` loaders follow the same rule.
- One IIFE, `'use strict';`, no external dependencies, `@grant none` (plain page APIs only).
- **Idempotency guard**: before injecting UI, bail if the element already exists
  (e.g. `if (document.getElementById(...)) return;`). Scripts may run more than once per page.
- **Defensive DOM scraping**: these games emit legacy table/`<font>` HTML. Scripts locate
  anchors by walking from a known `<h2>`/icon, checking `colspan`/`width` attributes, etc.,
  with fallbacks rather than assuming a fixed structure. Match this style when extending them.
- Inline styles via `el.style.cssText`; no stylesheets.
- **An item name from the wiki is not the item name in the game.** Every table in
  `FallenLondon/choice-helper.js` and `FallenLondon/ux-enhancers.js` takes an item's name from
  its **wiki page title**, which keeps the leading
  article — *A Faceted Decanter of Drownie Effluvia*, *An Inquisitive Lamp-cat*, *The Seal of
  St Joshua*. Fallen London's own Possessions `aria-label` **drops it**: the captured markup
  reads `Scrimshander Carving Knife`, not *A Scrimshander Carving Knife*. Compare the two with
  `normalizeName` and they are different items, which is exactly the bug reported 2026-09-10 —
  the checklist called a Decanter missing that was in the player's hold.
  Use **`itemKey`**, not `normalizeName`, anywhere an item name meets the possessions map. It
  is `normalizeName` plus a leading `a`/`an`/`the`, and it is applied on **both** sides — the
  map is keyed by it and every lookup goes through it — so it does not matter which side
  carries the article. It never reduces a name to nothing, so an item called *The* keeps its
  name.
  `normalizeName` stays as it was for **card and storylet** names, where a leading "A" is part
  of a title the game and the wiki agree on (*A Reef of Wrecks*) and dropping it would only
  invite a collision. Both the Fruits of the Zee and factions suites pin that no two names in
  their tables collapse onto each other under `itemKey`; add the same check to a new table.
  A change to the key means the two item caches must be **version-bumped** (`ITEMS_KEY`,
  `COUNTS_KEY`, now `v: 2`), or a returning player reads a cache filed under keys nothing
  looks up any more.
- **Fallen London writes HTML into the names it hands you**, so `normalizeName` strips tags
  (`TAG_RE`) before it squashes anything. A festival ship's Possessions label italicises its
  class: the attribute holds `&lt;i&gt;Obstinate&lt;/i&gt;-class Cruiser`, the HTML parser
  decodes it, and `getAttribute` returns real tags. Squashing that does not remove them, it
  **dissolves** them — the brackets and slash go, their letters stay behind as words, and
  `<i>Obstinate</i>-class Cruiser` keys as `i obstinate i class cruiser`. A ship the player was
  wearing read as un-owned (reported 2026-09-10, with the capture). Only a real `</?tag …>` is
  taken, never any pair of angle brackets, so prose containing `a < b > c` keeps its words.
  The corollary for any new scrape: **never hand a raw attribute to a matcher and assume it is
  text.** It is whatever the game decided to put there.
- **Colour is never the only carrier of a claim.** The person these scripts are written for is
  **red-green weak**, so a badge, a row or a control that says what it means *only* in its hue
  says nothing to the reader it exists for. Every claim needs a second channel that survives
  the colour being unreadable: a mark told apart by **shape** (`▲` / `▼`, `✔` / `✘` / `not a
  dock`, `★`, `?`), a word, or the number itself. Colour then makes a screenful quicker to
  skim — which is worth having, and is not the message.
  Two rules follow from it:
  - **Never pair red against green as the whole distinction.** Where a red and a green are the
    right metaphor anyway, separate them along the **blue-yellow** axis, which red-green
    weakness leaves intact: lean the green toward teal and the red toward warm brick, rather
    than using the textbook pair that reads as one muddy colour twice. See
    `PC_COLOR_LEGIT_GAIN` / `PC_COLOR_LEGIT_SPEND`.
  - **A ramp is for a number, not for a category.** A ladder of shades (`zeeColor`,
    `spiteColor`, `fotzColor`) is fine — it is quantity, and the quantity is printed on the
    badge as well. Do not spend a ramp on a distinction the reader must *name*.

  When a test would otherwise assert only "these two colours differ", assert instead that the
  **text alone** still tells them apart — see the palette block in
  `tests/choice-port-carnelian.test.mjs`.

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
- **The shared menu button row** (`#tm-kol-menu-btns`) is a piece of markup two scripts
  co-own: `daily-checklist.js` and `iotm.js` each carry an identical copy of `getButtonRow()`,
  and whichever runs first creates it. Each button claims a fixed slot with CSS **`order`**
  (checklist 1, IotM 2), which is what makes the left-to-right arrangement independent of load
  order. The container is a plain flex row, which is what the menu frame has room for — two
  buttons side by side. The copies must stay byte-identical: edit one and the layout starts
  depending on which script loaded first. Each also has a text-mode-topmenu fallback
  that inserts its button after the other's (by id) or after the plain `edit` link when
  `#fixedawesome` isn't there at all.
  **The menu frame is small, and it filled up.** A third and fourth button ran off its right
  edge, and stacking them into a 2x2 block only traded that for a row too tall for the frame, so
  `auto-combat.js` and `quest-helper.js` moved theirs to the **charpane** instead, each under
  the sidebar block it belongs to — Auto under Last Adventure, Mer-kin under Current Quest.
  Both hang off KoL's own markup, taken from KoLmafia's charpane fixtures
  (`test_charpane_basic.html` / `test_charpane_compact.html`), and both cover the *compact*
  and *expanded* panes, which are laid out differently: the quest block is `#nudgeblock` in
  both, but "Last Adventure:" is its own `<center>` only in the expanded pane — compact hangs
  the zone off the stats table's `Adv:` row in a `#lastadvmenu` hover menu, so the button goes
  after that table instead. Every placement falls through to a last resort that always works,
  because an unrecognised charpane should still get a usable button rather than none. Note the
  charpane is **rebuilt on most turns**, so a charpane button must be re-injected on every load
  (the id guard makes that a no-op) and must own no state.
- `quest-helper.js` is the other `choice.php` script: a small registry of puzzle answers
  (`PUZZLES`, keyed by `whichchoice`) with a UI bar injected only when a matching choice is
  on screen. It deliberately **never submits** — each entry's button only fills the form in,
  and the player presses KoL's own submit button, so a wrong database entry can't burn a turn.
  The `selects` puzzle type stores each answer as both an item id (the `<option>` value, the
  primary key) and its label (fallback). Add new puzzles as entries, not as new files. Because
  a choice page carries the same `whichchoice` on several forms (the action form *and* "Leave"),
  `findSelectsForm` matches on the puzzle's fields too rather than taking the first hit.
  A second type, `tiles` ("step on these, in this order"), only *highlights* — reusing
  the mine highlight's gold JS-timer pulse (which lives in `auto-mine.js` now, and was its own
  `mine-sparkle-highlight.js` when this was written), and for the same CSP reason (KoL allows
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
  A fourth type, `combat`, is the file's only **fight.php** work: two fights where a move
  works on exactly one round and the game never says which. A Junkyard gremlin presenting
  one of **Yossarian's tools** (use the molybdenum magnet: the tool is yours and the fight
  ends) and a raver Outside the Club pulling his **special dance move** (Gothy Handwave
  studies it, which is how the Disco Bandit nemesis skills are learned). Each is a registry
  entry like any other puzzle.
  Detection is **not** prose matching. KoL tags the round itself with an HTML comment —
  `<!--moly4-->` on the gremlin round, `<!-- gh:50 -->` on the raver's special — and that
  marker is the primary signal, the same one KoLmafia's relay override keys on
  (`IslandDecorator.GREMLIN_TOOL_MESSAGE`). It's the game's own tag, so it survives flavour
  rewrites: the gremlins' combat messages *were* rewritten on 27 August 2024, which is why
  the wiki's "the message must mention a tool" rule no longer describes what fires. The
  wiki/`NemesisDecorator` message strings are kept only as a fallback. Comments reach the
  DOM as comment nodes, so a `TreeWalker` finds them and the parent element is what gets
  highlighted (the tile floor's gold pulse and shared timer, reused).
  Who you're fighting comes from `<!-- MONSTERID: 551 -->`, and for the gremlins that is
  load-bearing: **each Junkyard zone runs a tool-carrying gremlin and an identically named
  tool-less one** (549/548, 547/546, 553/552, 551/550), so only the id tells them apart.
  `<span id='monname'>` is the fallback, and because a name can't make that distinction the
  advice explicitly hedges — hence `certain` on the subject and `ambiguous` on the entry.
  Like `selects`, the handler **never uses or casts anything**: its button only picks the
  item/skill in KoL's own dropdown. Item 2497 and skill 49 are matched by option value
  alone, because KoL writes the two dropdowns differently
  (`<option picurl=magnet2 value=2497>` vs `<option value="49" picurl="loop">`). This is
  also the one handler that asks to sit *above* its mount (`ctx.before`) — the mount is the
  block of combat buttons, and advice has to be read before they're pressed. Everything
  here — markers, ids, dropdown markup — comes from KoLmafia's fixtures for these exact
  fights (`test/root/request/test_fight_gremlin_good.html`,
  `test_raver_special_move_*.html`) and its `monsters.txt`; none of it is verified in-game.
  A fifth type, `sven`, is **Talk to Sven Golly** (`pandamonium.php?action=sven`), the Hey
  Deze Arena side quest for Azazel's unicorn — four demons, each craving one of
  white/soft/sweet/boozy and hating a different one, and six items carrying exactly two
  traits each. The wiki notes this puzzle is one of the very few that **does not reshuffle
  per ascension**, so the answer is a constant and solving it isn't the point; the
  bookkeeping is. A given item is eaten whether or not it was right (KoLmafia's
  `PandamoniumRequest` removes it from inventory on every give), and an item's backstage
  noncombat **does not occur while you're already carrying one** — so a wrong give costs
  another trip through Infernal Rackets Backstage, not just the item. Hence the overview:
  who's left, what each of them takes, which of those the page will let you hand over, and
  where the rest drop.
  Two items are **shared** — gin-soaked blotter paper suits Bognort *or* Stinkface, sponge
  cake Flargwurm *or* Jim — and giving one consumes it, so `svenPlan` spends a stock as it
  allocates. `svenItemsFor` sorts a member's options by how many members want them, which is
  what makes that greedy allocation safe: an item only one member accepts can never starve
  anyone else. `svenOptionState` is why the other member's row doesn't show a green tick for
  the copy already promised away — with one paper in the bag, marking it available on both
  rows would be a claim you're holding two. All of that is DOM-free and unit-tested.
  What is **unverified** is the page: the form's shape comes from KoLmafia's
  `decorateSven`, which rewrites this exact form — `<form name="bandcamp">` posting
  `action=sven&preaction=try`, a `bandmember` select whose options are bare names
  (`<option>Bognort</option>`, so the value *is* the name) and a `togive` select of item ids
  (4670-4675). Both selects have a by-content fallback, the member select is read for **who
  is still waiting** (KoL drops the fed ones), and the item select is read for **stock** —
  deliberately instead of `api.php`, since the dropdown is by definition what the server
  will accept right now. An unreadable dropdown yields "couldn't tell", never "you have
  nothing"; that distinction is the same reporting rule the mall planner learned the hard
  way. The whole feature gates on the form existing, so it stays silent on the rest of
  `pandamonium.php` and once the quest is done.
  The **Mer-kin Deepcity** quest (The Sea) is the file's largest entry and covers both of
  its forks. The gladiator fork is a sixth type, `counter`, and it is `combat` with a choice
  of answers: a Colosseum gladiator telegraphs one of *three* specials and each has its own
  counter skill, so the entry carries a list of specials instead of one `act`. The mapping is
  the one thing here that must not be got backwards — you counter a gladiator with the weapon
  of the **next** one round the cycle, never his own: balldodger → Mer-kin dragnet, netdragger
  → switchblade, bladeswitcher → dodgeball. Detection is the telegraph *sentence*, matched
  against flattened page text, not the word KoL bolds inside it: "gain", "loss" and "sack" are
  ordinary English and would fire on half the combat log. Whether you *can* counter is read
  off KoL's own skill dropdown rather than off equipment, because that is the only honest
  test — the skills come from the weapon and the bladeswitcher's `sack` special takes the
  weapon away mid-fight, at which point they are gone. A quiet round with the wrong weapon
  says to run away, because fleeing or losing here puts you back against the *same* gladiator
  and so costs a turn and nothing else.
  The scholar fork is the **dreadscroll** (choice 703): eight dropdowns of four words,
  rolled per ascension, so there is no answer to tabulate and the whole feature is
  bookkeeping. Three things carry it. **Harvest** — every page the script sees is scanned for
  the eight clue sentences (KoLmafia's `DreadScrollManager` reads the same ones), which is why
  `inv_use`/`inventory`, `runskillz` and `sushi` are in `@match`. Each slot matches its own
  *context* sentence and then looks for one of its four known words, rather than pulling
  whatever sits in a `<b>` tag — that does not depend on KoL's markup, and, critically, it
  cannot read a "clue" off the dreadscroll page itself, which shows all thirty-two candidate
  words at once. **Deduce** — a failed reading is not a wasted turn: Deep-Tainted Mind lasts
  three adventures per *wrong* word, so every failure says how many of the eight were right.
  That plus the clues is a Mastermind position and `dreadSolve` brute-forces all 4^8 = 65,536
  arrangements against it (fast, and it cannot be subtly wrong the way hand deduction can);
  slots it pins down are as good as clued, and a contradiction reports **zero arrangements**
  rather than picking one. The turn charged for the reading itself means the number on screen
  can be 3x, 3x-1 or 3x-2 — `dreadWrongFromDuration` uses **ceiling** division, which folds
  all three onto x where plain division would score a failure one word too kind.
  **Report** — a bar on the scroll (which fills in only the words it can name, and leaves
  "Read Aloud" to the player), a `catalog` bar on Playing the Catalog Card (choice 704) saying
  which of the library's three words are still outstanding and, learned per ascension, which
  book button gave which, and a **`Mer-kin` button in the charpane**, under the Current Quest
  block, opening the tracker anywhere — the clue tracker is wanted between visits, not only
  when the scroll is open. The button is stateless (the tracker is in `localStorage`) so the
  charpane rebuilding on every turn costs nothing; the *panel* renders into the **mainpane**
  document, because the sidebar is ~140px wide and would clip it, and that is why every render
  helper takes its document as an argument rather than using the ambient one.
  The picks are stashed on the way out of "Read Aloud" and scored on the next page load —
  the same hook-the-navigating-option pattern as the pyramid's descend option, and for the
  same reason: the result page no longer carries the form.
  UNVERIFIED against a live page: the dropdown option **labels** (KoLmafia's, matched by
  text — the wiki transcribes slot 1's second word as "double" where KoLmafia has "doubled",
  which is why `dreadMatchOption` is deliberately loose), the Colosseum telegraph sentences
  (the wiki's), and the assumption that the three champions reuse their own gladiator type's
  telegraphs — the wiki's boss pages still carry a NeedsSpading tag for exactly those, so a
  champion round that matches nothing falls back to the reference table instead of guessing.
  A seventh type, `beerpong`, is **Insult Beer Pong** (`beerpong.php`), the last gate on
  Arrr You Man Enough?. Like Sven Golly it has its own endpoint and no `whichchoice`, so it
  gates on the retort form being present, which also keeps it quiet on the opening screen
  and after the match. Old Don Rickets throws three insults and each has exactly one correct
  retort; a single wrong answer ends the match. The eight pairs are a constant — they do not
  reshuffle — and are taken from the wiki's table, which is byte-for-byte KoLmafia's
  `BeerPongRequest.PIRATE_INSULTS`. The **order of `BEERPONG_INSULTS` is load-bearing**: the
  form posts `response=N` where N is the 1-based index into it, so an entry inserted or
  reordered starts answering with the wrong retort. Options 9-13 are the Monkey Island jokes;
  they are kept in `BEERPONG_JOKES` purely so the file can say they always lose and so a
  later edit can't promote one into the answer table.
  The reason this is more than a lookup is that **KoL renders only the retorts you have
  collected** (each is learned by being embarrassed by a pirate while carrying The Big Book
  of Pirate Insults), so the dropdown *is* the record of what you know — the same thing
  KoLmafia parses the form for. `beerpongKnown` reads it, and the bar reports how many of the
  eight you own, which are missing, and your odds of taking a whole match
  (`beerpongOdds`: three rounds drawn without replacement, so `n/8 * (n-1)/7 * (n-2)/6`, and
  a flat **zero under three retorts** because it is then impossible rather than merely
  unlikely — the numbers match the wiki's published table). When the answer to this round
  isn't in the dropdown the bar says the match is already lost and offers no button, which is
  the point: it sends you off to collect insults instead of feeding the game another
  adventure.
  Matching is exact, then **preposition-masked**, and never fuzzy — naming the wrong retort
  loses the match as surely as picking a joke. The masking exists because the **Sword of
  Procedural Prepositions**, itself a reward from this quest chain, swaps every preposition
  on the page for a different one; `maskPrepositions` uses KoLmafia's own preposition list
  and its trick of replacing them with a placeholder rather than deleting them, so word
  positions still have to line up (the eight stay distinct under masking — a test pins that).
  The insult itself is read with the three round patterns, which read nothing like each
  other, and the round-1 preposition ("lobs his ball *at* your cups") is left open for the
  same sword.
  The form's markup is **confirmed against a live match** (2026-09-05) — the bar reads the
  insult, names the retort and fills the dropdown on the real page. It was written without a
  fixture, though (KoLmafia only ever builds `beerpong.php?response=N` and matches
  `<form action=beerpong.php>` plus `<option value=N>`), so nothing depends on the select's
  `name`: the form is found by its action and the select by its option values, each with a
  fallback, and an unreadable dropdown reports that rather than claiming you know nothing.
  Keep the fallbacks — they are what let this ship before the page was ever seen. Like every other handler here it **never
  submits**: the button only picks the option, and you press Retort.
  The file's one non-puzzle feature is the **8-Bit Realm score**, and it deliberately sits
  outside the registry: it's on `charpane.php`, where no `whichchoice` exists and the bar
  doesn't fit, so it dispatches on its own just above `currentPuzzle()` and returns. The
  realm's four zones each pay for exactly one modifier, and the **colour** of the sidebar
  Score says which one is currently paying double — black = Vanya's Castle (565, Combat
  Initiative), blue = Megalo-City (566, Damage Absorption), green = Hero's Field (564, Item
  Drop), red = The Fungus Plains (563, Meat Drop). `EIGHTBIT_ZONES` is stored **in cycle
  order** (black → blue → green → red, fixed and identical for every player, advancing one
  step per 5 kills in the realm), so "what's next" is just the next entry — don't re-sort it.
  `eightBitPoints` is the community `8bit-relay` override's formula, and the two facts it
  encodes are the reason the box exists: the modifier is worth **nothing** until it clears the
  zone's floor, and nothing past its cap, so 400 a fight is the ceiling and only the coloured
  zone reaches it. Score is **not** a currency — it only counts up and the Treasure House
  chests merely unlock at 10k/20k/30k — so `eightBitChest` reports distance, never a cost.
  The colour is read from the span's `alt`/`title` (`"black score - 0"`, which carries the
  score too) with the `<font color>` beside a "Score:" cell as fallback, and an unrecognised
  colour yields **no box at all** rather than a guess about where to spend turns. The link
  carries `target="mainpane"` because the script runs inside the sidebar frame.
- **KoL has been consolidated down to nine scripts.** There is no module system here — a
  `.js` file is a self-contained IIFE — so the only way two features can share a helper is to
  live in the same file. Eight standalone scripts were folded into three hosts. Do not split
  them back apart, and when you touch one, check whether the shared piece is what you are
  actually changing. The procedure for doing either direction is a skill:
  `.claude/skills/merging-userscripts/SKILL.md`.
  - `ux-enhancers.js` — the big one, and now **most of KoL by page count**: eleven features
    over thirteen pages. It absorbed `sell-sort.js`, `boss-aggro-warn.js`, `wiki-links.js`,
    `equip-optimize.js` (which had already taken `inventory-collapse.js`) and
    `charpane-heal.js` (which had already taken `skills-cast-max.js`). See its own entry below
    for what that means for the registry.
  - `auto-mine.js` — the engine/advisor **and** the mine tile highlight (was
    `mine-sparkle-highlight.js`). The two are gated *separately* and that is the point: the
    advisor and its Start button need mine 6 and a readable grid, the highlight commits nothing
    and runs on `mining.php` and `mine.php` alike. So the highlight keeps its own detection (a
    sparkle is an `<img>` whose `src` or `alt` says so, inside an `<a href="mining.php...">`)
    rather than borrowing `readTilesFromDoc`, which needs KoL's `alt='<Name> (col,row)'` grid
    labels. The highlight paints the `<img>`; `paintAdvice` paints the `<td>` — different
    elements, so the route and target stay legible on top of the highlight.
  - `iotm.js` and `daily-checklist.js` were considered and deliberately **left as two files**,
    so the co-owned `#tm-kol-menu-btns` row above stays exactly as documented: two
    `getButtonRow()` copies that must not drift, and CSS `order` rather than DOM order.

  Absorbed files were **deleted**, not stubbed, and dropped from
  `all-in-one/kingdom-of-loathing.js`'s `@require` list. Anyone who installed one standalone
  keeps their last-fetched copy running until they remove it, so every absorbed feature keeps
  the element id it guarded on and is harmless if a stale copy is also present. README's
  **"Merged / removed scripts"** table is where a user finds out where their script went; every
  removal adds a row.

- `ux-enhancers.js` **is no longer just small tweaks** — it is the KoL catch-all, eleven
  features over thirteen pages, and five former standalone scripts live in it. The registry is
  what makes that survivable, so keep using it: a feature is a `{ name, path, run }` entry and
  nothing runs outside one. Two rules follow from the merges.
  **Everything absorbed became a registry entry, never a top-level statement.** `sell-sort.js`
  was straight-line code that ran on eval; it is wrapped in `sellSort()` now, because code
  spliced in at the top level would sit outside the per-feature try/catch and one throw would
  take the other ten features down with it.
  **One feature is one page.** A script that spanned several became several entries over one
  set of shared helpers — the six `wiki-*` entries, and two each for the inventory and charpane
  pairs — so each page pays only for what it can actually draw, and each half keeps its own
  idempotency guard rather than one bailing and silencing the other.
  Names collided once the scopes merged, and the renames are load-bearing: `bossStatus()`
  returns `{level, equippedIds}` and never throws, `healStatus()` returns `{hp, mp, pwd}` and
  does — same original name, opposite error contract, **do not re-merge them**. Also
  `makeHealButton` (the plain `makeButton` builds a KoL `<input class=button>`),
  `buildEquipOptimizer` (`build` is far too generic here), and `addHealButton`.
  **`#tm-charpane-heal` is a cross-frame API**: `auto-mine.js` reaches into the charpane and
  clicks it when a mining run hits its HP floor. Renaming it silently breaks mining runs.
  **`skillz.php` hides skills that would do nothing right now** — at full HP it leaves out
  Cannelloni Cocoon and the other heals. So the shared sessionStorage copy of that page, most
  often cached at full HP, must never feed the heal button: `runHeal` calls
  `fetchSkillsDoc(true)` to re-read it on every click. The max buttons may keep using the cache.
  Two separate collapse-all implementations live here on purpose — the autosell one mirrors
  KoL's `sellstuff` cookie, the inventory one `inventory`; different cookies and different
  section markup, so they are not interchangeable.
  Historically it was the catch-all for unrelated small tweaks. It's a `FEATURES` registry of
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
  The third feature is **mall bulk buying** on `mall.php`: a `[buy all]` action per store row
  and a "Buy N" row per item that walks stores cheapest-first. It's the only thing in this
  repo that spends **Meat**, which is gone for good, so the rules are stricter than elsewhere.
  No purchase URL is *built*: each store row's `a.buysome` carries a `rel` that is already a
  complete purchase URL ending in `&quantity=` (pwd included), so a purchase is that string
  with a number appended — which is what keeps this working if KoL changes the parameters.
  Two page facts drive the arithmetic and are easy to get wrong: a store's usable amount is
  its stock **capped by its daily limit** (one row in the sample has 555,831 in stock and a
  1/day limit), and a row with **no buy links at all** is how the page renders a store whose
  daily limit you've already used — those are skipped, not planned against. The limit column
  is the one cell with no class of its own, so it's found by content *after* skipping the
  classed cells, or a store named "5 / day deals" would shadow it and silently cap every
  purchase. Runs are strictly sequential (each buy changes stock and Meat), and what was
  bought is **measured from `api.php`, not read out of the purchase response**. That is the
  important bit, and it was learned the hard way: the first version parsed the `ajax=1`
  response for "You acquire", which that response doesn't reliably say, so a completed
  purchase came back as *"Bought nothing — no purchase went through. Your Meat is
  untouched."* — a confident, false claim about someone's Meat. `runPlan` now diffs
  `api.php?what=inventory` (an object of `itemId -> count`, where a missing key is a true 0)
  and `what=status`'s `meat`; both shapes are verified against KoLmafia's `ApiRequest` /
  `InventoryManager`, since the wiki documents no api.php. Three consequences to preserve:
  `acquiredCount` returns **null** for an unrecognised response — distinct from 0, which is a
  real "nothing was bought" — and is only a fallback for when api.php is unreachable;
  `runPlan` returns `bought`/`spent` as **null** when unmeasurable, and no caller may read a
  null as zero; and `purchaseSummary` must never assert a fact it wasn't given — with no
  measurement it says it couldn't tell and to go check, which is the honest answer. The
  per-step inventory re-read is also what makes stopping early correct. Buying too little is
  recoverable; the other direction isn't.
  `planPurchase`/`describePlan`/`purchaseSummary` are DOM-free so the money arithmetic is
  unit-tested. "Buy N" always confirms with the total, the average and a check against your
  Meat; `[buy all]` deliberately doesn't (the quantity and total are on the button itself)
  *except* above `MALL_CONFIRM_MEAT`, which catches the joke-priced stores.
  The fourth feature adds a **`[mall]` action** to every item on `inventory.php`, styled as
  one of the page's own bracketed actions and searching the Mall for that exact item. Two
  things carry it. The search term is the item's name **in quotes** — KoL's item matcher
  reads a quoted string as an exact name and anything else as a substring, so an unquoted
  `poppy` would drag in every item with poppy in its name (`mall.php?justitems=0&pudnuggler=…`,
  the same endpoint KoLmafia's `MallSearchRequest` posts to). And the link is suppressed for
  **untradeable** items, read as `t=0` off the item table's own `rel` — the flag the page's
  right-click menu gates "Stock in Mall" on — while an unparseable `rel` still gets the link,
  since a search that finds nothing is cheaper than a link that mysteriously isn't there.
  This is the one KoL feature here with a `MutationObserver`: inventory sections are
  collapsed and only fetch their items by AJAX when opened, and using or buying something
  splices the item back in, so a single pass would miss most of the page. It's debounced and
  a per-table `data-` flag makes each item a no-op on later passes, which is also what keeps
  our own inserts from looping the observer.
  The fifth feature restores the **monster aggravation device** line on `charpane.php`. KoL
  links your device there with its current setting, but *only while the dial is above 0* —
  the line disappears exactly when you want to click it. Which device you have follows the
  moon sign's **zone, not its stat** (`MOON_SIGN_DEVICE`): Mongoose/Wallaby/Vole → the
  detuned radio, Platypus/Opossum/Marmot → the Canadian MCD, Wombat/Blender/Packrat → the
  Annoy-o-Tron, Bad Moon → Heartbreaker's Hotel. Platypus is a *Muscle* sign in *Canadia*,
  so a stat-based shortcut would misroute a third of players. The labels and hrefs in
  `MCD_DEVICES` are KoL's own, copied from real charpane HTML (KoLmafia's charpane test
  fixtures), and the injected line uses the game's markup for whichever pane is showing —
  so it reads as native and still parses for anything else scraping the pane. The value is
  hardcoded **0** rather than looked up: KoL hides the line precisely when the dial is 0, so
  its absence *is* the reading. The two panes are told apart by whether the PvP row's second
  cell holds a `<b>` count (compact) or an icon plus `<span class=black>` (expanded).
  In the expanded pane the line is inserted *above* the run of `<br>`s already sitting before
  the nudge block, so that existing gap falls below it, and a matching gap is opened above —
  one `<br>` after a block element (which already ends the line) and the full gap after inline
  content. That looks fussy but both shapes occur in real charpanes, and without it the
  restored line sits flush against whatever is above.
  The sign comes from `api.php?what=status`'s `sign`, cached in `localStorage` per character
  for a day — and refreshed for free whenever KoL *is* drawing the line, since the label
  names the device. An unknown or absent sign injects nothing at all. The feature only ever
  adds a link; it never sets the dial. Note the registry's `run()` also `.catch`es a
  returned promise now, because this feature is async and try/catch alone would let a
  rejection escape.
  The sixth feature marks the **Daily Dungeon's free-skip options** on `choice.php`. Each
  obstacle room has one button that gets you past for no adventure, drawn exactly like the
  ones that don't: the door room (692) takes **Pick-O-Matic lockpicks** or the **Platinum
  Yendorian Express Card**, the trap room (693) an **eleven-foot pole** or an equipped
  **candy cane sword cane**, and the two chest rooms (690 room 5, 691 room 10) offer **Go
  through the boring door** with a **Ring of Detect Boring Doors** equipped, which skips three
  rooms at the cost of that chest's item. The marked button gets a green outline plus a line
  saying what it costs — a `title` would do, but this is a page you read on a phone too, and
  the reason has to be legible *before* the click.
  Two decisions carry it. **Matching is on the button's label, never on the option number**:
  the label is what the player is reading, so a marker can't end up on a button that says
  something else, whereas an option number drifted by a KoL change could put the green outline
  on **Try the doorknob** (springs the trap, up to 3 adventures) or **Proceed forward
  cautiously** (half your maximum HP, not reduced by resistance) — the two options this
  feature exists to steer away from. A drifted *label* simply matches nothing, and matching
  nothing is already the normal case, since KoL only renders these options when you have the
  item. And **`Use a skeleton key` is deliberately not in the table**: it also passes for no
  adventure, but the key breaks most times, so it isn't free in the sense the green says.
  Because the label is the key, **another script rewriting it breaks the match** — and one
  does. `adventure-choices.js` annotates these same four rooms (`DisplaySpoilers()` does
  `inputs[n].value += " -- " + spoiler` on every submit button), and neither script declares
  `@run-at`, so which reads the label first is undecidable and the marker simply vanished
  whenever adventure-choices won the race. `ddLabel` therefore cuts the annotation off before
  comparing: at `" -- "` (adventure-choices', including its debug `" -- buttonID = N."`) and at
  `" ["` (KoL's own bracketed suffix — adventure-choices cuts that one too, for the same
  reason). The clash is one-directional: this feature only sets `style` and inserts a `<div>`,
  and adventure-choices reads `getElementsByTagName('input')`, so it cannot be broken in return.
  The match itself stays **exact, against a list of wordings** (`labels`), and must not be
  loosened into a substring sweep: the chest rooms carry **Pry off a loose panel with your candy
  cane sword**, which any `includes('candy cane sword')` would paint green — and that option
  costs an adventure. A wording KoL renders differently gets appended to `labels`; that is why
  the sword cane is listed under both `use your candy cane sword` and `...sword cane`.
  The labels and choice numbers are the wiki's and are **unverified against a live dungeon**;
  `ddLabel`/`ddSkipFor` are DOM-free so the table is unit-tested — including every dangerous
  option under an adventure-choices annotation.

- `auto-combat.js` adds an "Auto" button to the **charpane**, under the Last Adventure
  readout, opening a panel that adventures a chosen zone for a chosen number of
  turns. Four entries: The Haunted Bedroom, Inside the Palindome, The Haunted Storage Room,
  and **"wherever I adventured last"** — a `dynamic`
  registry entry with no url of its own, which `resolveZone` turns into a real zone from
  `api.php`'s `lastadv` block (falling back to the charpane's own last-adventure link) **once,
  at the start of the run**. Once and not per turn, because after turn one the last zone *is*
  this zone, so re-reading it could only let a stray click in the mainpane redirect a run
  already in flight. Only `adventure.php?snarfblat=N` is accepted — plenty of KoL adventuring
  goes through `place.php` urls carrying an `action`, and one of those is a door you open once,
  not a zone you grind — and when the resolved snarfblat matches a registered entry the run
  gets *that entry*, plan and hints and all, which is why the match is on the snarfblat and not
  on the name.
  It is deliberately a **two-frame script**: the button is in the charpane but the engine runs
  in the **menu frame**, and the only thing crossing between them is a small object the menu
  half publishes as `window.tmAutoCombat` (`toggle()` / `state()`). The charpane half owns no
  state and looks that object up *per click* rather than caching it — the menu frame outlives
  the charpane but not the reverse, so a captured reference to a torn-down frame would be worse
  than none — and if it can't find an engine it says so rather than silently doing nothing.
  The engine reaches the other way through `buttonEl()` to keep the label in step with the run,
  failing quiet when the charpane is mid-reload. It talks to the server with `fetch`, rather
  than navigating a frame the way `TwilightHeroes/auto-combat.js` does — the topmenu frame is the only one that
  isn't torn down while you adventure, so it's the only place a driver loop can live. That's
  what lets the run survive the player clicking around in the mainpane, and it's why `RUN` is
  module-scope while the panel (rendered into the mainpane document, as `iotm.js`'s popup is)
  can be closed and reopened freely. There is deliberately **no resume across a frameset
  reload**: a half-remembered run that restarts itself is worse than one that stops.
  Zone-specific behaviour hangs off a `ZONES` entry — `guard` (refuse/stop before a turn),
  `combat` (per-round policy, returning an action object rather than a URL), `hints`
  (annotations for the choice prompt), `plan` (choices answered without asking), `onResult`
  (bookkeeping, and the zone's own "we're done" signal). Add a zone as an entry, not as a branch.
  Note the split between the two choice fields: **`hints` never picks anything and `plan`
  always does**, so wiki knowledge that might be stale belongs in the first.
  Two more hooks exist for the checks a turn-by-turn `guard` can't do: **`preflight(ctx)`** is
  async and runs **once**, after the zone resolves and before the first turn, for a check that
  costs a request of its own; **`liveNote(status)`** returns extra text (or a promise of it) for
  the panel's note line.
  **Inside the Palindome** (snarfblat 386 — 119 is the retired one) exists to farm the *Elf Farm
  Raffle ticket*, and every part of it follows from one wiki line: the elf does not turn up at
  all while a ticket is in your inventory. So `preflight` reads `api.php?what=inventory` and
  **refuses to start** when you hold one (or when the inventory can't be read — starting blind
  would spend the whole run on a drop that cannot come), `onResult` **ends the run** on the
  acquire line, and a per-character daily tally (`tm-autocombat-tickets:<character>`, keyed by
  `api.php`'s `rollover` exactly as `auto-mine.js` keys its turn counter) is what the panel's
  note reports. The `guard` checks the accessory slots in `api.php`'s `equipment` block for the
  **Talisman o' Namsilat** (item 486): without it the Palindome isn't merely hard to reach, it
  isn't there, and KoL answers "You find yourself unable to get near the Palindome" *without
  spending the turn* — which a loop would otherwise repeat until its request budget ran out.
  That wording, and KoL's generic "No, that isn't a place yet.", are both in `BLOCKERS` as the
  backstop for when `api.php` reports no equipment at all. The zone's `plan` answers its four
  noncombats with the free or cheapest option (pep talk, a little while, ignawer the drawer, no
  thanks), never the ones that spend papayas, HP or a rubber axe.
  **The Haunted Storage Room** (snarfblat 398) farms **ghost keys** (item 7349, dropped by the
  sheet ghost). Its `plan` answers *Lights Out in the Storage Room* (890) with "Feel Your Way to
  the Door", which costs no adventure, and *Chasin' Babies* (886) with "Do nothing"; option
  numbers are the wiki's button order and unverified. Keys stack and nothing stops the drop, so
  unlike the Palindome there is no preflight refusal and a drop never ends the run: `onResult`
  counts it (`ghostKeysIn`, acquire lines only, `(N)` and `N ghost keys` accepted for several at
  once), into `RUN.ghostKeys` for the run and a per-character daily tally
  (`tm-autocombat-ghostkeys:<character>`) that shares the ticket tally's day-key logic
  (`tallyToday`/`recordTally`). A zone's optional **`summary()`** adds a line to the log however
  the run ends. Because a drop is announced on the fight's *last round* and a post-combat choice
  replaces that page, `runOneCycle` keeps every page a turn went through and `onResult` gets them
  joined as **`ctx.htmlAll`** — read that, not `ctx.html`, for drops.
  **Stop on level up** is a panel checkbox (saved in prefs as `stopOnLevel`). The run reads
  `api.php`'s `level` once at the start and stops after any turn where it is higher
  (`leveledUp`), checked *after* `onResult` so a drop on the levelling turn still counts. An
  unreadable level at the start is logged as the option being off for the run, never silently
  ignored.
  Above the zone sits **`CHOICE_RULES`**, a zone-independent table matched on the choice's
  **name** — for a choice an *item* hands you, which follows the item rather than living in any
  zone. Its one entry is *Peering Through Your Peridot*, answered with "I choose peace" so a
  grind doesn't spend the peridot's monster pick on whatever it walked into. Same
  offered-or-nothing rule as a plan: the label has to be on the page or the rule doesn't fire,
  which is what keeps an unverified wiki label from pressing some other button. Order of
  precedence per choice: zone `plan`, then `CHOICE_RULES`, then your remembered pick, then
  `soloPick` — **a choice offering exactly one button is taken without asking**, since there is
  no decision in it, and nothing is remembered from one — and only then the prompt.
  Combat defaults to handing the whole fight to a saved combat macro named **"Auto-Attack
  until finished"** (`MACRO_NAMES`, matched case- and punctuation-insensitively against the
  fight page's own `select[name=whichmacro]`, so the id always comes off the page) — KoL runs
  a macro server-side, so that's one request per fight instead of one per round. With no such
  macro saved, or after one aborts mid-fight, it falls back to `action=attack` each round.
  Choice adventures use the **remembered-pick** model from the TH script, adapted to a loop
  with nothing on screen: an unfamiliar choice **pauses the run** and the panel offers its
  options; you pick one and it's stored (keyed by `whichchoice`, which is exact where TH had
  to key on the encounter name) and answered by itself afterwards. There is no timeout and no
  default — a timeout that picked something would be the exact failure this design prevents —
  and the Stop button wakes the parked promise rather than setting a flag nothing will read.
  `usableRemembered` re-asks when the stored option isn't on offer, which is the normal case
  here: several bedroom options are conditional on equipment or are rare.
  A zone's **`plan`** is that same decision written down in advance, and it is consulted
  *before* the remembered pick (it's the more deliberate of the two and the one that gets
  maintained; a pick remembered from before the zone had a plan shouldn't quietly outrank it).
  Steps are tried in order and the first one the page is **actually offering** wins — which is
  how "the ghost key if you have one, otherwise the top drawer" is expressed, since the
  ghost-key options aren't rendered at all without a key, the same conditional-option fact
  `usableRemembered` exists for. Every step is checked **twice**, against the option number
  *and* the button's label: the numbers come from the wiki and the labels come from the page,
  so a drifted number matches nothing and the run falls through to asking. That failure
  direction is the point — on the rustic nightstand the button next to the right one starts the
  jilted mistress fight, the single option in the zone that spends a turn. A step with no
  `option` matches on the label alone, for a choice whose numbering nobody has written down
  (Lights Out in the Bedroom, which is why it has a plan step but no `hints`).
  Three rules exist because this spends turns, which don't come back. **Turns spent are
  measured**, from `api.php?what=status`'s adventure total before and after each cycle, never
  counted from requests sent: free fights, the bedroom's free post-combat choices and
  multi-page choice chains all make the request count a wrong answer, and when api.php can't
  be read the log says it's counting requests instead (the same reporting rule the mall
  planner learned the hard way). A fight still going after `MAX_ROUNDS_PER_FIGHT` is **left
  open for the player**, not fled. And the `CYCLE_BUDGET_*` ceiling bounds a run that has
  stopped making progress.
  The one thing here that is easy to get catastrophically wrong: **a finished KoL fight still
  carries the whole block of combat forms**, so "there's an attack form" is not "we're in a
  fight". The discriminator is KoL's own `window.fightover = true` (with the `#againlink`
  anchor as a second opinion) — the same signal KoLmafia keys on — and both predicates read
  the response text rather than a parsed document so they can be tested against real fixtures.
  There is also **no `whichround` input** on a modern fight page; the server tracks the round.
  Winning a fight can hand you a free choice adventure with no page in between (the bedroom's
  entire design), so `probeChoice` asks for `choice.php` after every fight ends; with nothing
  pending it lands somewhere harmless and reads as "no choice".
  What is **unverified in-game**: `fightFields`' parameter names and the choice/macro markup
  (all from KoLmafia's fight and choice fixtures), and the `BLOCKERS` wordings (wiki /
  KoLmafia string tables). A missed blocker fails in the wrong direction — the run keeps going
  — so that list is the first thing to correct when a run misbehaves.
- `auto-mine.js` is a **port of the KoLmafia script [loathers/oreo](https://github.com/loathers/oreo)**
  into the browser: it farms 1,970 carat gold in the Velvet / Gold Mine. Treat the
  `THE STRATEGY CORE` section as a **translation of `oreo/src/strategy.ts`, not as our code** —
  the row weights, the cluster weights, the 0.496 second-gold chance and the calibrated λ
  constants (`ev` 3571; `ev-cluster` 3714 low-visibility / 3500 high) are all theirs. When oreo
  changes, re-port and re-run the tests rather than tuning numbers here until they pass.
  `tests/auto-mine-strategy.test.mjs` is a direct port of oreo's own `test/strategy.test.ts`,
  kept in its order, and is the thing that says the port is still faithful.
  What is deliberately **not** ported: the λ calibration harness (a seeded synthetic board
  generator and a sweep; it needs mall prices, and recalibrating means running oreo in KoLmafia
  and pasting the number into the panel's λ field), the Meat accounting, and every action that
  *acquires* something. oreo buys dynamite and potions of detection, equips the mining outfit,
  and restores HP to survive cave-ins. **This script buys and equips nothing.** It reads
  what you already hold — dynamite from `api.php?what=inventory`, Object Detection from the
  status effects — and each missing prerequisite is a named refusal instead. Healing is the
  single exception, and it still casts nothing of its own: when HP reaches the panel's floor it
  clicks **`ux-enhancers.js`'s own `#tm-charpane-heal` button** in the charpane frame, because
  that script already owns the list of heal skills and the order to try them in and a second
  copy here would be a second copy to keep in step. The `heal at floor` checkbox turns it off,
  and with it off — or with `ux-enhancers.js` not installed, or a max HP below the floor — the
  run stops at the floor exactly as it did before. The click is fire-and-forget (the other frame
  reports nothing back and ends by reloading itself, destroying the button), so progress is
  polled off `api.php` until HP clears the floor, stalls for four reads, or 40 reads pass. The drill and the
  15 Hot Resistance oreo checks for are not checked at all, on purpose: without them KoL does
  not render the mine page, so a readable grid *is* that check.
  **Two frames, one file**: engine and panel in the menu frame (the only one that survives a
  turn), and an **advisor on `mining.php` itself**. Both run the same controller, so they cannot
  disagree about the best square; the advisor merely assumes no dynamite, since it can't know
  whether you meant to spend a stick.
  The Start button lives **inside the advisor's box**, at the right-hand end of the line that
  says which square to dig. It started out in the charpane beside Auto Combat's, and moved
  because — unlike a fight, which can begin anywhere — a mining run has exactly one place it
  makes sense to start, and the advice beside the button is the run's first move spelled out.
  The script therefore **no longer runs on `charpane.php` at all** and its two `@match` lines are
  gone; the charpane is still *read* across the frames, for the character name and for
  `ux-enhancers.js`'s button, which needs no `@match`. Consequences worth knowing: the button
  appears only where `runAdvisor` gets as far as painting (mine 6, readable grid), which is
  exactly where a run could start; and since the box is repainted on every load, the box is a
  **row of two nodes** — a text span (`#tm-automine-advice-text`) and the button — because the
  advisor writes `textContent`, and writing it on the box would delete the button. That is what
  `tests/auto-mine-advice-box.test.mjs` exists to catch.
  The move also made the advisor **load-bearing**, which cost a second bug: `runAdvisor` used to
  compute the advice and paint at the end, so a throw on the way meant no box — and therefore no
  button, no panel, and no way to undo the preference that caused the throw. It now builds the
  box **before** anything that can throw and reports the error into the span. The throw itself
  was `setDynamitePrice` rejecting `Infinity` via `Number.isFinite`, when `Infinity` is exactly
  what `makeController` passes for a dynamite field of 0 or blank (and what the constructor
  already defaults to) — i.e. **the shipped defaults threw**. Keep the sentinel legal: only NaN
  and negatives are wrong there.
  Two coordinate systems meet in here and mixing them up is the classic bug. KoL's is
  `(col,row)`, both 1..6, **row 1 at the top**; oreo's is a flat 0..35 with **index 0..5 as the
  front row** — KoL row 6, the one you stand in — which is what lets `isLegal` say "row 0 is
  always reachable". `coordinateToIndex`/`indexToCoordinate` convert. The `which` parameter is
  `col + 8*row`, over the **8-wide grid including the unbreakable border**, not the 6-wide
  interior.
  The page contract is KoLmafia's `MineDecorator.java`, which is why the tests can assert
  against the four state strings `MineDecoratorTest` pins to KoL's real responses. Squares carry
  `alt='<Name> (col,row)'` (`Open Cavern` → `o`, `Promising Chunk of Wall` → `*`, `Rocky Wall`
  → `X`); the state string is those 36 characters in KoL reading order; diggable squares are
  wrapped in an `<a href='mining.php?...which=N...'>`, and that anchor is KoL's own statement of
  reachability, which the advisor cross-checks `isLegal` against rather than trusting either
  alone. There are **two readers** — regex over response text for the engine, DOM for the
  advisor — because the callers have different things in hand; both go through `stateFromTiles`,
  and the test asserts they agree.
  The one that bit during development, and the reason `resultScope` exists: KoLmafia's relay
  **redraws squares you have already opened with the art of what you found there**, so scoping
  a dig's result to "everything after `Results:`" reports gold on every page for the rest of the
  run once you have struck it. The scope has to end at the grid (`<div id='preload'>` /
  `<div id='postload'>`), not at the end of the document.
  Both stores are **suffixed with the character name**, and `characterName()` is more careful
  than it looks, for a reason that cost a real bug: the name is read from the charpane's
  `charsheet.php` link, and `ux-enhancers.js` finishes by **reloading the charpane**. During
  that reload the link isn't there, the probe came up empty, and the old code answered
  `'unknown'` — so every key became `...:unknown`, an empty bucket. The day's turn count read
  back as 0 just after a heal and returned a moment later, and anything written in between went
  to the stray bucket. Now a failed probe never answers: it falls through to a per-frame cache,
  then to the name persisted under `tm-automine-character`, and `getStatus()` feeds `api.php`'s
  own `name` in as the authoritative source. The live probe is still tried **first**, though —
  a charpane that says someone else is a multi switching characters, not noise, and the cache
  must not be sticky enough to hand character B character A's cavern. Stray `:unknown` buckets
  are deleted rather than merged, since on a multi they could belong to either character.
  `tests/auto-mine-character-key.test.mjs` covers all of it.
  There is no `mineLayout6` here, so what each opened square held is kept in `localStorage`
  under `tm-automine-layout` (suffixed with the character name, like the pyramid state in
  `quest-helper.js`), cleared on a cavern reset and whenever the state shows nothing open — which
  is what keeps the advisor honest after *you* press Find New Cavern. A sparkle that yields no
  item is recorded as a cave-in, which is how mafia reads it too, and it matters because it is
  proof that square was not ore.
  Turns are **measured** from `api.php`'s adventure total, never counted from requests, because
  free mining actions (Unaccompanied Miner, Loded) dig without spending one; `turns=0` is oreo's
  "free actions only" and stops the moment a dig costs an adventure.
  The panel also shows **turns mined today**, kept in `localStorage` under `tm-automine-daily`
  (character-suffixed like the layout) as `{ day, turns }`. "Today" is **KoL's** day, not the
  browser's: the day key is `api.php`'s `rollover` — the unix time of the *next* rollover, one
  value that holds for the whole of a KoL day — with `daynumber` and then the local date as
  fallbacks. Resetting at local midnight would cut a KoL day in half. There is no timer: reading
  the counter with a day key that doesn't match the stored one *is* the reset, so nothing has to
  be running at rollover. The run's own total is measured from the adventure count it started
  with, but the day's is the **per-pass difference**, clamped at zero, so stopping and starting
  again keeps counting and eating a lasagna mid-run credits no turns. Opening the panel while
  idle spends one `api.php` read to learn the current day, or a panel opened the morning after a
  run would show yesterday's turns as today's.
  **Confirmed working in-game** (2026-09-05): a live run in the Velvet / Gold Mine drove the
  page, picked squares and reset caverns as intended. Confirmed again at 0.5, after the button
  moved into the advice box: the button appears on `mining.php` and Start drives a run from
  there. The **heal path is confirmed too**: a run that reached the HP floor pressed
  `ux-enhancers.js`'s button, cleared the floor and carried on, so the click-and-poll across
  frames works against the real charpane.
  Still **unverified in-game**, and worth saying plainly because each was written against a
  fixture rather than a watched run: the daily counter actually rolling over (it has only been
  seen counting *within* a day); and the dynamite
  path — `api.php?what=inventory` returning a plain `{itemId: count}` map is taken from
  convention rather than from a fixture. Dynamite fails safe (a count of 0 means no route
  discount, never a different square), so a wrong read costs turns rather than digging in the
  wrong place; check it there first if dynamite never seems to apply.

**Twilight Heroes** is plain (non-frame) pages scraped from table layout. State that must
survive the full-page reload after equip/unequip/use is stashed in `sessionStorage`.

**TH is three scripts.** Nine were folded into `TwilightHeroes/ux-enhancers.js`, which is the
counterpart of `KingdomOfLoathing/ux-enhancers.js` and works the same way: a `FEATURES`
registry of `{ name, path, run }`, each entry scoped to its own pathname and each `run` wrapped
in a try/catch so one broken feature can't take the others down. Only `auto-combat.js` and
`puzzle-solver.js` are still separate. Adding a tweak means a function plus a registry row —
not a new file. Four things about that file are load-bearing:

- **Every absorbed body is inside a function.** Most of these were straight-line code that ran
  on eval; spliced in at the top level it would sit *outside* the per-feature try/catch, and one
  throw would take the other features down. Wrapping is also what scoped away the collisions —
  `path` was a top-level `const` in three of them and `span` in two, and neither is a collision
  once each body has its own scope.
- **The shared helpers are the reason the file exists.** `header-heal.js` and
  `skills-cast-max.js` each carried a byte-identical `SKILLS_URL`, `findSkillOption` and
  `serializeForm`, and `quest-helper.js` and `wiki-links.js` each their own `WIKI_BASE` /
  `wikiHref`. There is one of each now, at the top of the file. `fetchSkillsDoc` is
  skills-cast-max's *cached* version (sessionStorage `th-skills-html`), which the heal path
  gains for free — casting changes HP and PP, never which skills you own, so the cache can't go
  stale under it. `wikiHref` is quest-helper's, whose optional `slug` argument makes it a strict
  superset of wiki-links'. Don't let a feature grow a private copy back.
- **The journal quest logic stays at file scope**, not inside its feature function: `QUESTS`,
  `hintFor`, `key`, `normForMatch` and `headingName` are DOM-free and are what
  `tests/quest-helper.test.mjs` reaches through the end-of-IIFE seam, which cannot see inside a
  wrapper. Only the injection pass is the registry entry.
- **The nav sidebar's `+max` button is an API.** `auto-combat.js` — which is *not* in this file
  — finds it and reads its `data-pp-cost` to refresh a buff between fights. The class
  (`th-cast-max`) and that dataset key must not be renamed.

`inventory-filter` is one feature over three pages that share the same
`<td width=50%><b>name</b></td>` item layout (wear.php, inventory.php, use.php): it locates the
table from a known `<h1>`/`<h2>` heading, so extend `HEADINGS` rather than forking it when
another such page turns up. Its filter state is keyed per page via `TEXT_KEY`/`TYPE_KEY`.

The `autobox` feature is the one that spans a *navigation*: its `main.php` branch injects the
trigger button, and its `criminology.php` branch drives the Black Box quest across the page
reloads that each form submission causes, the two halves talking through `sessionStorage`
(`th-autobox-active`). Both branches stay in **one** registry entry with the original's own
`location.pathname` test intact, because that pairing *is* the feature. The quest-advancing
logic it inherits from the legacy original is index-based (`forms.length > 3` → submit
`forms[2]`, else follow the first `<a>`) and is **unverified against the live page**; preserve
it faithfully rather than "improving" form heuristics you can't test in-game.

**Fallen London** is a different animal from the other two: a **single-page React app**.
There are no per-page URLs to `@match` — everything happens under `fallenlondon.com/*`, and
the game swaps storylets, branches and results into the DOM client-side without any page
navigation. Two consequences:

- A one-shot `document-idle` pass (the KoL/TH model) misses anything drawn after load.
  Scripts must re-scan on DOM changes — see `wiki-links.js`, which runs once and then on a
  debounced `MutationObserver(document.body, {childList, subtree})`, relying on a per-element
  `data-*` flag to stay idempotent across the repeated passes.
- `wiki-links.js`'s selectors are verified against real HTML. The wiki-link helper is confirmed
  (the wiki is MediaWiki behind Anubis, which challenges `Special:Search` at difficulty 6 -- a
  wait of many seconds -- but lets `/wiki/Title` and `api.php` through). So links go straight to
  `/wiki/Title`, and `resolveWikiLinks()` asks `api.php?action=query&titles=...&redirects=1` which
  names are not pages and re-points only those at the `Special:Search?...&go=Go` fallback. The
  block (`wikiHref`, `wikiSearchHref`, `wikiTag`, `resolveWikiLinks`) is duplicated in
  `wiki-links.js`, `choice-helper.js` and `ux-enhancers.js`; keep the three identical, and never
  build a bare `Special:Search` link. A storylet title shows up three ways, all badged: in a list
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
- **Two FL scripts share one feature-registry design, and they were one file until
  `ux-enhancers.js` 3.0** (split 2026-09-13, on request). `ux-enhancers.js` is the grab-bag of
  quality-of-life tweaks — the `launcher`, the **Factions** panel and its "use" button — and
  `choice-helper.js` is **advice on what storylets and cards do**: every rating badge
  (`spite-card-ratings`, `zee-card-ratings`, the `fotz-*` features, `port-carnelian`,
  `scientific-voyages`, `university-laboratory`, `arbor`, `lb-industries`, `menace-eradication`,
  `vertiginous-horticulture`, `forgotten-quarter`, `cat-and-mouse`, `season-in-soup`,
  `long-dead-god`, `engaged-in-a-case`, `sunken-embassy`, `law-furnace`, `prelapsarian-museum`,
  `on-a-heist`, `spider-symposium`, `short-stories`, `flash-lays`, `social-actions`,
  `cave-of-the-nadir`, `empress-court`, `breeding-monsters`, `mahogany-hall`, `master-classes`,
  `sixth-coil`, `rat-market`, `boxful-of-intrigue`, `underclay`, `hunting-bees`,
  `featuring-tales-university`, `term-passing`, `trade-in-reputations`, `savage-cobbles`,
  `publishing-newspaper`, `war-of-assassins`, `wars-of-illusion`, `foreign-posting`, `temple-club`)
  and the reference panel built on each one's table (Zailing, Port Carnelian, Scientific Voyages,
  Fruits of the Zee, University Laboratory; `arbor` and the carousels have none, by request). The rule that decided where each thing
  went: **a panel goes where its table's badge goes**, because the two are one transcription. The
  Factions panel's `!` pips stayed in UX Enhancers — they are about your possessions, not about
  a storylet. The in-page dive-depth control went with the badges it exists to feed.
  Both are the counterpart of `KingdomOfLoathing/ux-enhancers.js` —
  but note **what a feature is scoped by differs**. KoL is server-rendered, so each of its
  features declares the `.php` path it belongs to and runs once; FL has one URL and no
  navigation, so a feature here is scoped by *the markup it finds* and is re-run on the debounced
  observer. Adding one: write an idempotent `run()` that bails when its markup is absent, add a
  `{ name, run }` entry to `FEATURES`, and give it **its own badge class and dataset flag** so
  two features can decorate the same element without fighting over one flag.
  The whole procedure for adding a badge feature — where a badge may go, how to source and shape
  the table, which of the three gate strengths the evidence entitles you to, the tests, and the
  other suites that break the moment you touch the registry — is a skill:
  `.claude/skills/adding-fallen-london-features/SKILL.md`, with a `check.mjs` beside it that
  audits `choice-helper.js`'s wiring. The step before it — turning a linked wiki guide into
  choices and a plan — is `.claude/skills/planning-a-fallen-london-guide-feature/SKILL.md`, with
  batch wiki fetch/extract scripts; its one fixed rule is that **whether a guide gets a panel
  behind ⚙ UX is always the user's decision**, asked as its own question.
  **What the two share, and how.** A userscript has no imports, so every helper both need — `h`,
  `wikiLink`, `normalizeName`/`itemKey`, `UI`/`TH`/`TD`, the Myself and Possessions scrapes,
  `loadCache`/`saveCache`, `loadInFrame`, the auto-refresh toggle — is **carried in both files,
  byte for byte**, and `fl-shared-helpers.test.mjs` fails on any declaration the two have in
  common that has drifted, bar a short list that differs on purpose and says why. Fix a shared
  helper in both files or that test tells you. What they share at **run time** goes through the
  page, since both are `@grant none` and so see the page's own `window`:
  - **`window.__flUxPanels`** (`PANEL_REGISTRY`). Choice Helper pushes its `PANELS` onto it at
    load; UX Enhancers' menu lists its own `PANELS` and then the registry's, **re-synced every
    time the menu opens**, so which script loads first does not matter. Without UX Enhancers the
    badges all still work and the panels have no menu to be in.
  - **`fl-ux-shared-frame`** (`FRAME_EVENT`). A background refresh boots the whole SPA in a hidden
    frame, and before the split one boot of `/myself` banked the Factions, festival and Port
    Carnelian numbers together. Each script now has its own `refreshBackgroundState`, which banks
    only its own numbers — and `shareFrame` hands the frame's document to the other script from
    inside `extract`, the only moment it still exists (the listener runs synchronously, before
    `loadInFrame` removes the frame). The other script banks its numbers off the same boot, and
    its own refresh then finds a fresh cache and has nothing to do. `SCRIPT_ID` is how a script
    ignores its own event.
  - **The launcher's ids** (`fl-ux-launcher`, `fl-ux-launcher-button`). The depth control docks
    behind the button by finding it by id (`launcherDockHost`). A **cross-file contract**: change
    them in both scripts or not at all.
  Storage keys and badge classes kept their `fl-ux-` names through the split on purpose: a
  returning player's caches are still found under the keys they were banked with, and nothing
  about a class name is visible to anyone.
  Shared plumbing in `choice-helper.js` worth reusing rather than re-deriving: `makeBadge`/`attachBadge` (badge
  described as a pure `{text, color, title}` spec, drawn by shared code), `headingName`, and
  `eachCardName`, which walks all three shapes an opportunity card's name takes. Those three
  selectors (`.hand__card-container` + `.hand__image`'s `alt`, `.hand .small-card__body
  .media__heading`, `.storylet-root__heading`) are **shared with `wiki-links.js`**, so the two
  files rise and fall together — if a selector moves, fix it in both.
  Three things about the badge plumbing are deliberate and load-bearing. **A badge sits beside a
  heading, never inside it**, because `wiki-links.js` derives its wiki title from the heading's
  `textContent`; conversely `headingName()` skips `.fl-wiki-link` children and anything carrying
  the shared `.fl-ux-badge` class, so a heading already wearing a "W" (or another feature's
  badge) still reads as the plain name. That pair is what makes the two scripts load-order
  independent, and `wiki-links.js` owns a card's **top-right** corner while this one takes the
  top-left. **`attachBadge`'s flag stores the value it drew for, not a boolean**: React reuses a
  `.hand__card-container` node for the next card when you play one, so a boolean would leave the
  old card's badge on the new card — a changed value redraws, and a `null` spec clears it.
  **An `'after'` badge is cleared by walking the whole run of badges following the host**, not
  just `nextElementSibling` (2026-09-09, with `port-carnelian`). Two features can now badge one
  heading — `fotz-supplication` and `port-carnelian` both walk `.branch__title` — and since
  `host.after()` inserts *immediately* after the host, the badge drawn second ends up nearer the
  heading than the one drawn first. Checking only the immediate sibling then fails to find the
  feature's own stale badge and leaves two of them behind on a reused node. The walk stops at the
  first non-badge sibling and removes only the one carrying that feature's class, so clearing one
  feature's badge still never touches the other's. `choice-port-carnelian.test.mjs` pins all three of
  those, and the stale-badge one fails against the old single-sibling check.
  **The `title` also opens on tap** (added 2026-09-04, on a report that it was unreachable on a
  phone). A badge's whole argument lives in its `title`, and on a touch screen a `title` is
  invisible: there is no hover, and a long press raises the text-selection menu instead — so on
  a phone the challenges, the option lists and the Sights bands simply were not readable.
  `makeBadge` therefore keeps `title` for the desktop hover and *also* binds a tap that opens
  the same text as a fixed, `pre-wrap` panel (`showTip`/`hideTip`, one `#fl-ux-tip` at a time,
  placed under the badge or above it when the bottom of the screen is nearer). Three things
  there are load-bearing. **The tap must not reach the card**: on the wide hand layout the badge
  is positioned over `.hand__card-container`, and a click that got through *plays the card* — an
  action spent for good on a tap meant to read a tooltip — so `click` is stopped and defaulted
  and `pointerdown`/`mousedown`/`touchstart` are stopped too (passively; they only ever stop
  propagation), which works because React listens at its own root rather than on the node.
  **The dismissal handler is capture-phase and exempts badges**, or it would clear `tipAnchor`
  before the badge's own handler could see that the tip being opened is the one already open,
  and a second tap on the same badge could never close it. **That stopped propagation is also
  why the launcher's outside-click handler is capture-phase**: on the bubble it never saw a
  badge tap at all, so the menu stayed open behind one. `pruneTip` runs at the top of `scan` so
  a panel whose badge React has since re-rendered away goes with it rather than hanging over an
  unrelated card, and a scroll or resize closes it rather than chasing the anchor.
  **Both dismissal handlers must also ignore events from inside the panel itself** (fixed
  2026-09-16, on a report that the panel closed the moment it was clicked or scrolled). The
  panel is `overflow:auto` under a 60vh cap, so any tooltip longer than that has to be scrolled
  to be read — and the capture-phase `click` exempted only badges while the `scroll` listener
  was capture-phase on `window`, which sees a scroll in *any* container. So the panel's own
  scrollbar click and its own scrolling both closed it, and every long tooltip was unreadable
  past the cap. `fromTip(e)` — `e.target.closest('#' + TIP_ID)` — now guards both; page scroll,
  resize, Escape and an outside click still dismiss. `overscroll-behavior:contain` on the panel
  stops a wheel or drag that reaches the END of it from chaining into the page, since that
  would scroll the page and close it. `fl-badge-tip.test.mjs` is the regression test. **Confirmed
  in-game by the author on 2026-09-04**, phone included — so, unusually for this repo, the
  placement and the swallowed tap are known to work rather than merely reasoned about.
  A feature that wants a screen rather than a decoration registers a **panel** instead: the
  `launcher` feature mounts a "⚙ UX" button whose menu is built from UX Enhancers' own `PANELS`
  registry followed by whatever `choice-helper.js` has put on `window.__flUxPanels`
  (`{ id, icon, label, hint, render }`, `render(ctx)` called fresh on every open so a live panel
  never has to invalidate a cache). A menu entry needs an `id` and a `render`; a registry entry
  whose `id` the menu already holds is not listed twice.
  Every panel's sticky header carries a **fullscreen** button beside its close button, and the
  choice is **remembered** in `localStorage` (`fl-ux-panel-fullscreen`), so a long panel opens at
  full size every time rather than needing the button pressed again (added 2026-09-06). The
  popover is sized to hang off the launcher button, which is right for a lookup table and wrong
  for the festival checklist — several screens of it in a 660px box. Two things there are
  load-bearing. Fullscreen is **`position:fixed`, not a move in the DOM**: the launcher root is
  itself fixed and carries no transform or filter, so a fixed child is measured against the
  viewport and steps out of the root's flex column on its own, leaving the docked button, the
  menu and the placement code untouched. And the two shapes are **one style patch each**
  (`PANEL_FULLSCREEN_CSS` / `PANEL_WINDOWED_CSS`) rather than a set of ad-hoc assignments, so
  every property fullscreen sets is given a value again on the way back — the three exceptions
  are `margin`/`maxWidth`/`maxHeight`, which `applyLauncherStack` owns and re-applies on the next
  placement, and which it now **skips while fullscreen** or the 660px cap would go straight back
  on. A test pins that key coverage, since a property added to one patch and not the other leaves
  the panel stuck half-fullscreen.

  **The button is DOCKED into FL's own chrome, not floating over it** (changed 2026-09-03, on a
  report that it kept covering things). It used to be `position:fixed` on `document.body` — and
  that was deliberate, since nothing injected into FL's chrome survives a React re-render — but
  a fixed button is over the page by definition, and beside the wide layout's Travel button that
  means over the storylet column: `crowdedLeft` counts *siblings only*, so overlapping the main
  content was allowed on purpose. Docking is the fix. `dockLauncher` appends the button beside
  **FL's travel control**, which is the one piece of its chrome whose markup is verified in all
  three layouts, and `dockHostFor` (pure, so the choice is testable) picks between the two
  shapes: its own `li` when the control is one `li.banner-item` in the mobile banner's row —
  guarded on the parent actually being a `UL`/`OL`, or a Travel button that merely happens to
  sit inside some list would get one too — and otherwise a plain wrapper in the control's own
  container.
  **Whereabouts in that container is the other half of the answer, and appending is wrong.** The
  first cut appended, and on the wide layout that put the launcher a screenful down the page
  (reported, then confirmed from real markup, 2026-09-03): `div.travel` is not a little box
  around the travel button, it is the **whole right-hand column** — the welcome heading, the
  button, a Steam ad, and two `.snippet` blocks. So `dockHostFor` also returns `after`, the node
  to sit immediately behind, and in `span` mode that is the anchor itself. The banner keeps
  appending (`after: null`), because there the container really is just the row of icons.
  `dockLauncher` then treats **drifting away from the anchor** as being in the wrong place, not
  just being in the wrong container — React inserting something between the two on a re-render
  would otherwise walk the launcher back down the sidebar one render at a time. The check is
  `previousElementSibling`, not `previousSibling`, or a stray whitespace text node would read as
  misplaced forever and re-insert on every scan.
  One more thing that capture settled: the wide layout's `.travel-button--infobar` says **"View
  map"**, not "Travel". The class selector finds it either way, but the accessible-name backstop
  — which exists for the *classless* narrow-desktop button, whose wording nobody has read — now
  takes both wordings rather than betting on the older one.
  Three things make that safe against the React tree it is now inside. We only ever **append**,
  and only our own node: React tracks its children by reference rather than by index, so an
  extra node at the end of a container it manages disturbs neither its inserts nor its removes.
  If a re-render drops ours anyway, the next debounced scan puts it back — `mountLauncher` is
  now three steps (`buildLauncher` once, `dockLauncher` every scan, `positionLauncher` whenever
  anything moves) precisely so re-docking is cheap and idempotent, and `resize` goes through the
  whole mount rather than just the placement because FL can swap layout on a media query alone —
  no mutation, but the container the button was docked in has just become `display:none`.
  And the button carries `LAUNCHER_BUTTON_ID` so `findTravelAnchor` can refuse it: docked into
  `.storylets__welcome-and-travel` it matches `.storylets__welcome-and-travel button` literally,
  and anchoring to itself would be a quiet little regress.
  **Floating is still the fallback and still the whole rule it always was.** With no travel
  control to dock beside, `dockLauncher` puts the button back inside the popover root and
  `launcherPlacement` does the original job: *beside* the control, bottoms level, when the space
  to its left is both free and big enough; otherwise stacked against it with right edges level —
  *above* by preference, *below* when it sits too near the top of the screen for above to fit —
  clearing the whole **bar**, not just the icon in it, which was the bug that rule was written
  for. It is pure (anchor box, bar box, viewport, button size, crowding in; `right`/`bottom`
  out) and unit-tested without a layout engine, and every result is clamped to the viewport. The
  last line of the launcher menu switches between the two by hand (`fl-ux-launcher-dock`,
  docked by default) — it is there rather than in a settings screen because "this thing is in my
  way" is a thought you have while looking at the button.
  **`pointer-events` on the popover root is a contract, and breaking it bricked the script
  once** (reported and fixed 2026-09-03). The root is a `position:fixed` box sized to whatever
  the popover needs, so it carries `pointer-events:none` to stop it swallowing clicks on the game
  behind it, and **every real child has to opt back in with `auto`**. The button was the child
  that didn't — and because it is only inside the root while *floating*, docked mode hid it
  completely. Undocking therefore killed the one control that could undock it, and since the
  choice is remembered in `localStorage`, reloading didn't help either: there was no way back
  without devtools. A test now pins that every child of the root opts in. The general lesson is
  worth more than the specific fix: **a remembered preference whose only control lives behind
  that preference has to be fail-safe**, because getting it wrong is not a cosmetic bug, it is a
  one-way door.
  What the popover — the menu and the panel — needs is a rule of its own, since docked there is
  no longer anything to place *but* the popover: `popoverPlacement` is that, equally pure, and
  it hangs the popover off the docked button's box, opening into whichever of the two gaps is
  larger and clamping the button's box into the viewport first. That clamp is load-bearing in a
  way the floating one is not: a docked button **scrolls with the page**, so its box can be
  anywhere at all, including entirely off-screen, and the popover must not be dragged off with
  it. `enclosingBar` still decides "in a bar" for the floating rule: the nearest
  `fixed`/`sticky` ancestor that spans the width, touches the top or bottom edge, and isn't the
  whole screen.
  The placement also returns **`down`**, which way the menu and the panels stack away from the
  button. They open toward whichever side has more room, and that is not cosmetic: the stack used
  to always grow upward, so once the button was pinned near the *top* of the screen — a compass in
  a top banner, or the sidebar's Travel button, which is high up — the menu opened off-screen and
  read as a dead button. The children are in DOM order **panel, menu, button** exactly so that one
  flag flips the lot: `down` swaps `flex-direction` to `column-reverse`, pins the root by
  `top` instead of `bottom` (it now grows from the button's top edge), and moves the 8px gap to
  the other side of each piece. `positionLauncher` also caps the panel's `max-height` to the
  room on that side — the old flat `70vh` was a promise the layout couldn't keep once the button
  could be anywhere.
  `TRAVEL_SELECTORS` is **verified** (2026-09-02) and there are three shapes because FL renders
  a different travel control per layout, quoted verbatim in the script: wide desktop is
  `button.travel-button--infobar` in the sidebar's `div.travel`; narrower desktop is a
  **classless** `button.button--primary` that only its container
  `div.storylets__welcome-and-travel` names; mobile is the compass,
  `li.banner-item > button.banner__button[title="Map"]` wrapping an `i.fa-compass`. The
  classless one is why the accessible-name backstop (anything clickable named "Travel") stays.
  If everything misses, `findTravelAnchor` returns null, and null is a *supported* outcome, not
  a failure: the launcher goes back to the corner but is still lifted clear of a bottom bar,
  found with no selector at all by `document.elementsFromPoint` at the bottom edge of the
  screen. Two subtleties in the resolver. **Choosing** an anchor requires it to be in the
  viewport (`inViewport`) but **keeping** one only requires it to be drawn (`rendered`) — the
  first is how the hidden layout's travel button is refused on a phone, the second is why the
  wide layout's Travel button, which scrolls away with the sidebar, doesn't make the launcher
  jump to the corner and back on every scroll (it clamps instead). And `crowdedLeft` counts
  **siblings only**, deliberately: what is left of the compass is the next banner icon and must
  not be sat on, while what is left of the sidebar's Travel button is the main content column,
  which a floating button has always been free to overlap. It is idempotent by
  `#fl-ux-launcher` id guard — an already-mounted launcher just repositions — and sits first
  in `FEATURES` so it's on screen from the initial pass. Escape closes
  the menu then the panel; an outside click closes only the menu, because a panel is a reference
  table you read *while* playing and a stray click shouldn't throw it away. `h()` (a four-line
  hyperscript) and `wikiLink()` are there so a panel is written as nodes, not an innerHTML
  string.
  `spite-card-ratings` rates the opportunity cards of The Crowds of Spite from a `SPITE_CARDS`
  table transcribed from *The Crowds of Spite (Guide)* on the wiki. New or corrected cards go in
  `SPITE_CARDS` and nowhere else. Its **area gate** reads `currentArea()`, which now has **two** verified
  sources. The primary is the screen-reader greeting (`#accessible-sidebar .welcome`), which is
  on every page including /myself and /possessions, and which states the area inside a sentence
  — hence the regex. The backstop is the wide layout's **visible** greeting in the sidebar's
  `div.travel` (captured 2026-09-03), where FL splits that same sentence across three
  paragraphs and gives the area an element of its own,
  `p.welcome__current-area` → `"Mutton Island,"`. Nothing to parse there but a trailing comma,
  and it is exactly where the regex cannot reach, so the two complement each other. It is the
  backstop rather than the primary only because it belongs to the wide sidebar and nobody has
  confirmed it exists in the narrow layout. During a promenade it reads, verbatim and **confirmed in-game**:
  *"It's ‹name›! Welcome to The Crowds of Spite, delicious friend!"*
  That is what let the gate become an **exact list** (`SPITE_AREAS` = the promenade plus its
  parent area "Spite"). It started permissive — carrying the four route names as guesses plus a
  `LONDON_ELSEWHERE` deny-list — and both are now gone, on evidence from the same capture: FL's
  accessible map (`#accessible-sidebar .accessible-map-menu`) lists every area you can reach, and
  it holds "Spite", "The Crowds of Spite" and "Area-Diving in Spite" but **none** of the four
  route names — so the routes are storylets inside the area, not areas, and the greeting never
  names one. That menu is also the place to get any area's exact spelling if you need one.
  Matching is against the whole normalised name, never a substring: "Area-Diving in Spite" is a
  real and different area. One fail-open remains — a greeting that can't be read at all still
  gets badges, since the card table scopes them and losing the feature outright is worse.
  Note the gate is why `attachBadge`'s flag records **`'+'`/`'-'` plus the value** rather than the
  value alone: clearing a badge from a host already flagged with that same name would otherwise
  be a no-op, and walking out of Spite mid-hand would leave the ratings behind.
  `zee-card-ratings` does the same job for **Zailing the Unterzee**, and it is the bigger of
  the two: `ZEE_CARDS` transcribes every card in *Category:Cards - Zailing the Unterzee* (81
  entries, ~220 options) from the individual card and option pages rather than from the guide's
  summary, because that summary is a "cards that don't raise Troubled Waters" table and goes
  stale against the pages. Where the two disagreed the page won -- the guide says A Spit of
  Land's island stop is Troubled Waters -2, its own option page says -1, and -1 is what is in the
  table. Corrections go in `ZEE_CARDS` and nowhere else.
  **The thing to understand before touching `bestZeeLine` is why it ranks the way it does.**
  Cheapest Troubled Waters first, more progress only as the tie-break. That is not the obvious
  order (you are out there to arrive) and the first cut had it the other way round; the case that
  settled it is `Navigating the Snares`, where progress-first recommends "You have places to be"
  -- half an action saved for six change points, at Zee Peril 250. Almost every line at zee makes
  full progress anyway, so the number that actually separates the cards in your hand is what they
  cost, and the thing that ends a voyage badly is Troubled Waters reaching 8. When the cheapest
  line is the slow one the badge admits it with a speed mark rather than hiding it.
  Inside that rule sits one exception, and it is there to avoid *understating* a cost, never to
  invent one: a **Luck** option is ranked on its expected value, because that is the only case
  where the wiki gives both outcomes and the odds. A Spit of Land's island stop buys a point on a
  success and costs eight on a failure; ranked on the -1 it advertises, the badge talks you into
  the worse half of the card. A stat challenge gets no such treatment -- the difficulty depends on
  your stats, which this script does not read -- so it keeps its success value, and the badge's
  `?` is what says so. `twFail` exists only on the thirteen Luck options that have a numeric
  failure; don't spread it.
  Two more rules are load-bearing. `bestZeeLine` **ignores every option behind a `need` or behind
  piracy**, because a badge quoting a line you cannot take is worse than no badge; a card with
  nothing else falls back to the best gated line and returns `gated: true` so the caller can say
  so. And `zeeHasBetterGated` is the complement -- the marker means "there is something cheaper
  here that I refused to promise you", which is the whole story of The Killing Wind (a bad coin
  flip, unless you have a Zubmarine).
  The Fruits of the Zee gate is now the **fully tightened** kind, both halves captured
  verbatim in-game (2026-09-03):

  > on the island — *"It's ‹name›! Welcome to Mutton Island, delicious friend!"*
  > mid-dive — *"It's ‹name›! Welcome to the Royal Approach, delicious friend!"*

  Note the game writes the second with a lower-case "the" where the wiki writes
  `location = The Royal Approach`; `normalizeName` is what makes those the same string. With
  both known, `fotzWhere()` returns **three** answers rather than two — `'yes'`, `'no'`,
  `'unknown'` — and `'no'` is what the captures bought. Until then the gate could only ever
  confirm, because refusing on an unverified list risks blacking the feature out in the very
  place it exists for; now a greeting that names somewhere else clears every badge, exactly as
  `SPITE_AREAS` does. `'unknown'` (no greeting readable at all) still falls back to the card
  table as the only scope, with `Old Wounds` and `Easy Pickings` sitting that case out. One
  escape hatch survives inside `'no'`: an unmistakable dive hand outranks the list, so an area
  nobody has visited yet cannot black the feature out either.
  The second capture bought something else, and it is not a gate at all. A depth you set by
  hand lives in `sessionStorage` for the whole tab, so the moment you surface it is not stale
  but **wrong** — the next dive starts at 1. `forgetStaleDepth()` throws it away on leaving the
  Royal Approach, which is a thing that could not be detected before, and the badges go back to
  showing the range. It acts only on a greeting it can read: an unreadable one means "no idea
  where you are", which is not grounds for discarding anything.

  The zee **area gate is deliberately weaker than the Spite one**: `SPITE_AREAS` rests on a
  greeting captured verbatim in-game, while `ZEE_AREAS` is a *guess* at what the same greeting says at zee,
  assembled from the wiki's region names. So `inZee()` only ever confirms -- it never returns
  "definitely not at zee" -- and exactly one card leans on it: `strictZee` on **The Sound of
  Wings**, which is the one name Fallen London deals in eight other places. Everything else is
  scoped by the card table, the way `spite-card-ratings` started out. Capture a greeting from a
  real voyage and this can be tightened the way `SPITE_AREAS` was.
  The `zailing` panel is the reference half: routes and what they cost in actions per ship, Zee
  Peril per region, the Troubled Waters ladder and the six zee-threat/black-card pairs, the
  **ports** table, the three winds, your current hand ranked, and the whole card table with a live
  text filter.
  `ZEE_PORTS` replaced the old `ZEE_SAFE_DOCKS` list, and the reason is the `safe` field: it is
  **three-valued on purpose**. `true` is a dock that wipes Troubled Waters and every zee-threat;
  `false` is a real dock that resets nothing (Port Cecil, Godfall, Irem, Gaider's Mourn,
  Tanah-Chook); `null` is one of the four hunting grounds, which are not docks at all. Fold the
  last two into one boolean -- or leave the cell blank for either -- and the table starts selling
  a crocodile hunt as a harbour. Rows also carry `unlock` (what has to be true before the
  destination shows on the map, `null` for the three that need nothing), `how` (how that quality
  is come by, from the guide's *Discovering locations* prose), `fate`, `once` for the one-time
  storyline destinations, and `regions` as an array, because the lifeberg grounds drift through
  three of them and are listed under each -- the same thing the card table does with a card drawn
  in several regions. One conflict in the source is recorded rather than resolved: the guide's
  table shows Port Cecil and Tanah-Chook with an unsafe cross while the hidden sort key on those
  two cells reads `safe`. The cross is what is in the table and the note on both rows says so;
  a player who docks at either should report which it actually was. The filter matches
  `row.dataset.zeeSearch` rather than `textContent`, so a term can hit an option the collapsed row
  does not show, and it hides a region heading whose rows have all gone.
  Note the three badge features can never collide on one card -- no name is in more than one
  table, and a test asserts it -- which is what lets all of them take the card container's
  top-left corner.

  `fotz-card-ratings` is the third, for the **Fruits of the Zee Festival** (Mutton Island, the
  first weeks of September), and it answers two questions at once because a diving card is worth
  two different things: the **Thalassic Favour** its treasure trades for in week two, and whether
  it is a **rare item you haven't got**. Colour is the Favour, a `★` is the item, and the two are
  independent on purpose -- a coral is worth nothing in Favour and can still be the best card in
  the hand.
  **The depth is the hard part, and `fotzDepth` is where the honesty lives.** Nearly every value
  at this festival is set by *Full Fathom Five*: A Cabin-Fragment pays 50 Favour at depth 1 and
  400 at depth 5, and A Shattered Prow trades a Nuncian Pocket Watch at depths 2-4 but the
  Scrimshander Carving Knife only at 5. **Four** answers, best first:

  1. a **live** `readQualities` read. Settled in 2026-09-03 as dead weight in practice — FL
     renders no `li.quality-item` on the diving screen — but it costs one failed
     `querySelectorAll`, so it stays.
  2. a depth **you set**, in `sessionStorage` because a dive is one sitting. Set from the panel
     or, in the Royal Approach, from the in-page control below.
  3. a **banked** Myself read, `source: 'read'` (added 2026-09-04). `/myself` *does* render the
     quality — verified against a real capture, `<img alt="Full Fathom Five">` in the usual
     `li.quality-item` — and `FOTZ_QUALITIES` has always banked it; what changed is that
     `fotzDepth` will now use the bank, and opening the festival panel goes and *fetches* it,
     exactly the way it fetches which items you hold. Gated hard on `FOTZ_READ_FRESH_MS`
     (60s): past that window an old reading is not stale, it is **wrong**, because every
     successful dive changes the number. It sits **below** what you set by hand for the same
     reason — you know you have just dived and the bank does not.
  4. nothing, and then the badge shows the **range** across the depths and says so.

  The live read still deliberately does not fall back to the bank *itself*: tier 3 is a separate
  answer with its own expiry and its own label, so a reading that came off Myself never
  masquerades as one taken on the spot. The card table yields a **floor** (`min`: A Shattered
  Prow and Tangled in the Rigging need depth 2, Her Fivefold Symmetry 5), which trims impossible
  depths out of the range but never collapses it to a guess. At any *known* depth every card
  offers exactly one claim -- a test pins that, and it is what lets the badge be a single number.
  `depthSourceText` is the one wording for all four, shared so the panel and the in-page control
  can never disagree, and the badge flag carries the **source** as well as the depth: the same
  number read off Myself and set by hand have different tooltips behind them.
  Opening the panel in the Royal Approach forces the /myself fetch even when the banked numbers
  are fresh by the panel's usual standard (`wantsDepthRefresh`, which `stateIsFresh` deliberately
  knows nothing about -- that predicate is shared with the Factions panel, which has no such
  problem). It is stamped rather than re-derived, because a refresh ends in a re-render which
  asks the question again: a refresh that banked nothing would otherwise boot the SPA forever.

  **The `fotz-depth-control` feature is the other half**, and it is what makes the depth cheap
  enough to keep correct (2026-09-04). It is the panel's own six buttons, in the page, shown only
  while `showDepthControl()` says you are in the Royal Approach -- gated on the greeting, with
  the same "an unmistakable dive hand outranks an unreadable greeting" escape hatch `fotzWhere`
  keeps. It mounts in **two** places, which answer different questions: **docked** beside FL's
  travel control, and **in-page** immediately above `.hand`. Since the split the docked copy
  belongs to a different script from the launcher it sits behind, so `launcherDockHost` finds UX
  Enhancers' button **by id** and takes that button's wrapper as its host — copying the wrapper's
  tag and class, so in the banner it is one more `li.banner-item`, and sitting immediately after
  it, so the two never fight for the one spot after the travel anchor. A button that is floating
  (its parent is `#fl-ux-launcher`) or not there at all means **no docked copy**; the in-page one
  is unaffected. Before the split it re-derived the host by the launcher's own rules
  (`findDockHost`), which would now mean carrying `findTravelAnchor` and all its selectors twice
  to reach the same answer. In the **mobile banner** a row of six buttons
  would be wider than the whole icon strip, so there it collapses to one button showing the depth
  and cycling `auto → 1 → … → 5 → auto` -- which is also the fastest thing on a phone, since
  going a level deeper becomes one tap. The in-page row is **inserted** rather than appended,
  which is the one place this is less conservative than the launcher's docking; React tracks its
  children by reference, so a foreign node between two of them survives, and a re-render that
  does take ours is undone by the next scan.
  **The control is a LIGHT BLUE card, not `UI`'s dark chrome** (2026-09-04, on request), and the
  reason is where it lives: a panel is a screen of ours that you opened, and dark is right there,
  but this sits in Fallen London's own page — over the dark storylet column, beside the travel
  control — where one more dark box is one more thing to look past. It also puts the control in
  the same visual family as the badges it governs, whose ramp starts at aqua and light blue. A
  light card forces dark text, the same trade `FOTZ_INK` makes: `UI.text` is a cream for a
  near-black background and is illegible on this, so the control has its own five constants
  (`DEPTH_BG` / `DEPTH_EDGE` / `DEPTH_INK` / `DEPTH_DIM` / `DEPTH_ON`), all of them checked to
  clear 4.5:1 — and that check is a test, because "use `UI.text` like everything else does" is
  the natural wrong edit. `styleDepthCard` is shared by both mounts so the docked chip and the
  in-page row cannot drift apart; they differ only in margin, and in the row spanning the column
  so it reads as a header for the cards under it. The chosen depth is a solid `DEPTH_ON` chip and
  the other five are outlines — the one distinction the control has to make at a glance.
  Two things there are load-bearing. The control is redrawn by the same debounced scan whose
  MutationObserver its own writes trigger, so **every mount is signature-guarded** (`depthSig`,
  the same trick `attachBadge`'s flag uses) or it is an infinite loop -- and the signature
  carries a 15-second age *bucket*, not the timestamp, so "read off Myself 2 minutes ago" is
  allowed to age without redrawing on every scan. And the click is **swallowed** the way a badge
  tap is: the docked form is inside FL's chrome and the in-page one sits directly over a hand of
  cards. Setting a depth reaches three things -- the controls, the badges (via a scan, since
  their flag carries the depth) and `fotzPanelCtx`, the context the Fruits of the Zee panel was
  last rendered with. The panel keeps that itself, because the launcher that owns the context is
  in the other script; a context whose panel has since closed is a harmless no-op, since the
  launcher's `rerender` does nothing once its body is out of the page.
  **The badge palette was reworked 2026-09-04**, on a report that several badges were barely
  visible and too many cards looked alike. Both were true, and for two different reasons. The old
  `fotzColor` was six dark, desaturated bands — greens, browns, a grey — drawn on top of Fallen
  London's dark card *artwork*, so the low end vanished into it; and six bands cannot separate
  the **eight** figures this festival pays, so 125 and 150 came out the same colour, and 175 and
  200 did too. `FOTZ_FAVOUR_COLORS` is now one colour per figure, all of them light, ordered as a
  single rotation of the hue wheel — aqua, light blue, periwinkle, orchid, magenta, rose, orange,
  gold — which keeps both properties at once: adjacent steps are plainly different colours *and*
  the sequence still reads as a ladder. Light backgrounds are why `makeBadge` gained an optional
  **`spec.ink`** (default `#fff`, so the Spite and Zailing palettes are untouched): every colour
  here is under 3:1 against white and over 5.5:1 against `FOTZ_INK`, so these badges carry dark
  text. A test pins the whole rule — one colour per figure paid, no colour reused up the ramp,
  and the contrast in both directions — because "adjacent steps differ", which is what the old
  test checked, passed happily through both duplicated pairs.
  `FOTZ_COLOR_NEED` is the same gold as 400 **on purpose**: on a coral card it means the same
  thing, and the two cannot be confused because a coral badge reads `coral` and never a figure.
  Held and unsure are the only neutrals left, and are the two that should not shout — but they
  were lifted well clear of the old `#4a5560`, which was close enough to the page to read as a
  smudge.
  Ownership has the same three-state discipline as the Factions pips: `★` you lack something here,
  `✓` you hold it all, `?` your Possessions have never been read so neither can be said (a
  dash would read as a minus sign in front of the number). A
  treasure-only card carries no mark at all rather than an unearned tick.
  **One of the three is the whole prize** (changed 2026-09-03, on the author's report). The
  three versions of a coral item are mechanically identical -- same slot, same stats, differing
  only in name and description -- so holding any one of them finishes that coral for good and a
  second is a change of outfit rather than a reward. `fotzMissingFrom` therefore returns `[]`
  for a coral as soon as one variant is held, and the checklist counts **one item per coral, not
  three**: the collection went from 28 to 19, which took ten items nobody needs out of the
  headline. It also simplified `ready`, which used to wait on Sights sitting in the band that
  paid the particular variant you lacked; now that any band pays out something you haven't got,
  holding the coral is the entire condition.
  The variant detail is still **shown** -- the panel ticks the one you hold and keeps each name's
  Sights band in its tooltip -- it is simply not **counted**. That distinction is the whole
  design: it costs nothing to keep the information for someone who does want a particular look,
  and it costs a great deal of noise to make everyone else collect three of everything.

  **The best thing in these tables is the Sights mapping**, and it did not come from the guide.
  Which of the three versions of a coral item you get is *not* random: the five *Offer the King
  your <coral>* option pages each list three outcomes keyed to **Sights at the Festival** --
  1-33 the Itinerant Zubmariner's stock, 34-66 the Pirate-Poet's (Gaider's Mourn), 67-100 the
  Enigmatic Angler's (Irem) -- and the three traders in The Fruit Market swap coral items
  like-for-like, each handing out its own band and accepting the other two. So a variant you are
  missing has two named routes. The guide's summary table lists several corals' variants in a
  *different order*; the option pages win, the same rule that settled A Spit of Land at zee. Note
  breaking a coral open re-rolls Sights, so two cannot be lined up in a row.
  The **area gate is the weak kind**, like `ZEE_AREAS`: `FOTZ_AREAS` is a guess from the wiki's
  `location` fields, so `inFotzArea()` only ever *confirms*. What carries the weight instead is
  `fotzHandConfirms()`, which needs no unverified markup at all -- nine of the eleven card names
  could not plausibly belong to anything else in London, so one of them in the hand proves where
  you are. Only the two generic names (`strict`: **Old Wounds**, **Easy Pickings**) are gated on
  that; everything else is scoped by the card table.
  The `fruits-of-the-zee` panel is the checklist half, and the reason the badges can say "you
  still need this". `fotzCollection` is pure and turns a state reading into grouped rows plus the
  "missing N of M" headline. **What counts is a decision, not an oversight**: the Fate items don't
  (they cost money, not actions), the four ships don't (you can only own one), and the Nodule of
  Fecund Amber doesn't until you already hold the Litter-Cyst it is the consolation prize for --
  leaving 28. An unknown is counted as *unknown*, never as missing, or someone who has not opened
  Possessions would be told they are missing all 28. `ready` is the panel's headline in the same
  sense as the Factions panel's: a coral in hand while Sights sits in the band that pays the
  variant you lack, or a stall item you have the Favour for.
  Week one's other half, **Supplication on the Shore**, is the one thing in this script badged
  on a storylet's OPTIONS rather than on cards -- `fotz-supplication`, which walks
  `.branch__title` and hangs the badge after the heading, never inside it. The markup is a
  capture (2026-09-03): `h2.branch__title` inside `div.media.branch.media--branch`.
  **Why it has to be in the game and not only in the panel** is the thing the guide's table
  does not say and the capture does: every option is gated on a window of *Airs of a Barren
  Zee* (0-40, 20-60, 40-80, 60-100, and 0-20/80+), and taking one **re-rolls Airs** -- so
  usually only two of the five are on offer, and the question is never "which is best" but
  "which of the ones in front of me right now matches my best stat". The five windows come from
  the option pages; the two the game drew its own requirement icon for (Airs 60-100, and
  "anything outside of 21-79") agree with them exactly, which is what makes the other three
  trustworthy. The badge says only the attribute, deliberately: the game already draws the
  requirements itself, and what it never says is which stat the reward scales off.
  Two branches share the storylet and raise no Devotion, so they are labelled rather than
  scored -- the Custodial Chef (free, nothing) and the Fathomking's servant (7 Fate, Devotion
  straight to 11, otherwise 17 supplications). Only the Chef is `strict`: his is the one name
  here generic enough to belong to another storylet, so he is badged only where the
  `.storylet-root__heading` above confirms the place. Note the game PREFIXES that heading --
  it reads "Fruits of the Zee: Supplication on the Shore", not the wiki's title.
  `FOTZ_STATS` carries **two** colours per attribute, `color` for text on the panel's dark
  ground and `badge` for white text on a filled badge, because one hue cannot do both legibly;
  a test pins that they differ.
  The panel carries the same table, and the point
  of that table is that there is nothing to choose: all five options pay the same 4 CP of
  Fivefold Devotion, so the only difference is which base attribute the economy item scales
  off. The stat therefore leads the table and wears the colour. `fotzDevotionLadder` is pure
  and *derived* rather than transcribed -- Devotion is pyramidal, so reaching level L costs
  L(L+1)/2 change points at 4 a go, plus 2 actions for the dive itself -- and the test checks
  it against the **guide's** own optimum table (5 (6 Act) through 11 (19 Act)), which pins the
  formula to an independent source rather than to itself.   **Where to stop, and how deep to go, follows a comment on the guide** --
  [cs-comment-99376](https://fallenlondon.wiki/wiki/Fruits_of_the_Zee_Festival_(Guide)#cs-comment-99376),
  by the player whose Monte Carlo produced the Favour-per-action figures the guide itself
  quotes (rewritten 2026-09-04, on the author's report). `FOTZ_DIVE_PLAN` is its four
  collecting stages, each pairing a Devotion with the depth that pays the items still
  outstanding -- 5/depth 1 for the corals, 8/depth 2 for the Wrecking Boots and Nuncian Watch,
  10/depth 4 for the Mary Lloyd and the Decanter, 11/depth 5 for the Scrimshander -- and
  `FOTZ_FAVOUR_RUN` is the grind that follows once nothing is left to collect (Devotion 9 at
  15.4 FPA, ahead of 10 at depths 3-5 on 14.6 and 11 on 14.3, the last of which never drowns
  you). `fotzDiveAdvice` walks the stages **in order and takes the first with anything
  outstanding**, which is what gets the shallow-only items right *without a special case*: the
  Cured Jillyfleur Cloak is depths 1-2 and sits in stage 1, so it is collected while you are
  still up there rather than thrown away by a deeper dive. A test pins that every item a stage
  sends you for is actually claimable at that stage's depth, that the four stages account for
  all six dive-only items exactly once, and that depth and Devotion both rise across them.
  This replaced a ladder keyed on the coral count alone (3+ -> 5, two -> 7, one -> 8, none ->
  10), which had no source but a reading of the guide's prose and nothing at all to say about
  the six dive-only items.
  **A coral already in your hold is not one to dive for** (fixed in the same pass, and the
  bug that prompted it). `coralsWanted` asked only whether you held one of a coral's three
  ITEMS -- which in week one nobody does, since the corals cannot be broken open yet -- so a
  diver carrying one of each was told three or more were missing and sent back to depth 1
  indefinitely. One coral becomes one item and the three items are mechanically identical, so
  a second coral of the same kind is a duplicate of a duplicate: `entry.inHand` now ends it,
  the then-`pending` coral included, whose items were unpublished and so could never read as
  held while the coral itself read perfectly well. An unreadable Possessions list still leaves
  `coralsWanted` **null**, and the advice still falls back to the Favour case *saying so* --
  there is no honest answer to "how many do you still need" when we cannot tell what you have.
  **Confirmed in-game by the author on 2026-09-04.**
  The coral badges carry **`(N)`, how many of that coral you are already holding** (reported
  2026-09-03: two coral cards read identically with one of the corals in hand). It comes from
  `fotzHoldings().count`, which had been built and never used. The brackets are omitted at zero,
  so an untouched hand stays as quiet as it was, and the tooltip carries the actionable form the
  badge has no room for -- one coral becomes one item, so holding two while three variants are
  missing means one more dive. Note a badge can read `✓coral (2)`: the tick is about the ITEMS
  and the number about the CORAL, so it means "done, and two spares", and the tooltip says that
  rather than "enough to cover what is missing", which would be nonsense with nothing missing.
  **A card offering a named unique item carries the same label** (`400 · item (3)`, added on
  the author's report). Those three cards -- Tangled in the Rigging, Well-Disguised Trinkets,
  A Shattered Prow -- do pay Favour, so they used to wear that figure alone and read exactly
  like A Cabin-Fragment, which is only ever worth its Favour. The figure **stays, and stays in
  front**, where every other card carries it: the first attempt replaced it with the label and
  leaned on colour to carry the value, which does not hold up -- a spare IS its trade-in value,
  and `fotzColor` is a six-step ramp that separates 400 from 100 but never 300 from 400. Colour
  is deliberately still `fotzColor(favour)` rather than the need/held hues the coral and the
  Bride use, which would only repeat what the `★`/`✓` already says. The brackets share
  `fotzHeldSuffix` with the corals, so the same rules hold -- omitted at zero, omitted when
  Possessions have never been read -- and with the depth unknown, where two different items are
  in play, it is a **range** (`item (0–3)`) rather than one item's count passed off as the
  card's. For a unique item the bracket counts **spares**: one finishes the collection, so
  `✓400 · item (3)` means two are trade-in stock at 400 apiece, and the tooltip says so.
  `fotzUniquesByDepth` answers the question the checklist cannot: a dive **commits you to a
  depth** and pays exactly one reward, and the unique rewards are not spread evenly down the
  trench. Some are only at the bottom (the Scrimshander Knife is depth 5 and nowhere else) and
  -- the half that actually costs people items -- some are only in the **shallows**: A Cured
  Jillyfleur Cloak is depths 1-2, so diving past 2 throws it away for that dive. The panel
  therefore marks an entry **last chance** at the deepest depth it still appears at. Currency-only
  cards fall out for nothing, which is what the request asked for: `fotzMissingFrom` already
  returns an empty list for anything paying only Favour, so A Cabin-Fragment, Easy Pickings and
  Unlucky Prisoner never reach the block. It is derived from `FOTZ_CARDS` rather than from a
  second table -- the depths are stated there once and must not be stated twice --
  and `fotzSplitUniques` lifts out the entries spanning depths 1-5 (the corals) so they are
  named once above the table instead of five times inside it.
  **The "coral in hand ends it" rule now lives in `fotzMissingFrom` rather than only in
  `coralsWanted`** (2026-09-06, reported: a character carrying all six corals was still shown all
  six as still down there). Holding **one** copy is the whole condition — one coral becomes one
  item and the three items are mechanically identical, so a second is a duplicate of a duplicate
  — and the check comes *before* the `pending` case for the same reason `entry.inHand` does: a
  pending coral's items can never read as held, but the coral itself reads perfectly well, and it
  is the coral you dive for. Because `fotzMissingFrom` is shared, the card **badge** moved with
  it: a coral card whose coral you carry now marks `✓` rather than `★`, which is the same answer
  the dive advice was already giving. The one thing that could no longer be derived from it is the
  tooltip's distinction between "spare, since you already have the item it becomes" and "one is
  all it takes" — that now asks the variants directly.
  `fotzLedger` totals what your
  treasures and *spare* equipment would fetch, which needs quantities -- hence
  `readPossessionCounts`, which `readPossessions` is now defined in terms of so the two cannot
  drift. Counts are a **max, never a sum**: an item you are wearing appears both as
  `div.equipped-item` and as a row in the equip drawer. They are read off the
  `.js-item-value` span first and only then off the `aria-label` — see the Possessions paragraph
  above; equipment states its quantity in the span and nowhere else, and reading the label alone
  made every spare piece of kit invisible to this ledger.
  Two shared pieces moved for this. `refreshFactionState` became **`refreshBackgroundState`**,
  which banked both panels' readings off the same two page loads -- booting the SPA twice more for
  this panel would have been silly. Since the split each script has its own, and the frame is
  shared across instead (`FRAME_EVENT`, above), which keeps the one-boot property. And `fotzHoldings()` is memoised on a `fotzGen` counter bumped
  whenever anything is re-banked, because unlike the panels it runs once per card on every
  debounced scan and would otherwise re-parse a few hundred cached item names each time. The
  badge's `attachBadge` value carries the depth and that generation, not just the card name, so
  setting your depth redraws a hand that is already on screen.

  `port-carnelian` is the fourth badge feature, and the first that badges **no cards at all**:
  *Port Carnelian (Guide)* states outright that the governorship deals none. So it walks
  `.storylet__heading, .storylet-root__heading` (the storylet in the list and the one you have
  opened, the same two selectors `wiki-links.js` uses) and `.branch__title` (the options inside
  it, the selector `fotz-supplication` already walks).
  **The guide's shape is not the game's shape**, and getting that wrong made the feature draw
  nothing whatever on its first outing (fixed 2026-09-10, from a capture of a real term). The
  port has a **single** storylet -- *Matters of State*, wiki ID 194331, location Heartscross
  House -- and every row of the guide's table is an **option inside it**. So the names the guide
  calls storylets arrive on `.branch__title`, while the guide's own branch names appear only
  once one of the two split storylets has been opened, by which point *that* is the
  `.storylet-root__heading`. Either kind of name can therefore turn up under either selector.
  `pcHeadingSpec(name, here)` is the answer: it tries `lookupPcStorylet` then `lookupPcBranch`,
  and both selectors run through it. No name is in both tables, so which lookup wins is never a
  judgement call. It is pure -- name and gate in, badge description out -- and the gate is
  passed in rather than read, so the whole thing can be asserted on without a DOM. `pcRatings`'s
  `attachBadge` value carries `@here` / `@?` alongside the name for the usual reason: the gate
  is an input to the spec, so a `strict` row suppressed while the greeting was unreadable would
  otherwise keep its flag and never redraw once the greeting turned up.
  Six options of *Matters of State* are **not** in the guide's table and so are deliberately
  unbadged -- Make for your ship while the citizenry sleeps, The sword falls, Accept a visitor,
  Take a break from governorship to hunt for treasure, Inspect the records for mentions of the
  Sixth Coil, and the Ambition Nemesis one. The guide prices none of them; badging them would
  mean inventing figures.
  It owns a **second** class/flag pair,
  `PC_BRANCH_CLASS` / `PC_BRANCH_FLAG`, precisely so the two branch features can decorate one
  heading without either clearing the other's badge — `attachBadge`'s flag is per-feature, and
  this is the first time two features have actually shared a selector.
  `PC_OPTIONS` is one entry per **row of the guide's option table**, 29 of them, and it is the
  only place corrections go. Each carries the guide's `net` **and** the three currency changes it
  is made of (`sd`/`sh`/`il`), which looks like duplication and is not: a test checks the two
  against each other, and a transcription typo in either is invisible in game until a whole
  26-action term has been spent on it.
  **`either` is the field that matters most.** Two rows — A stroll through the Blue Bazaar and
  Inconvenienced — pay 10 or 15 of *one* of the two currencies, the game's choice rather than
  yours. Folded into `sd` and `sh` they would read as that much of *each*, which would make them
  the two best rows in the table by a distance. So they are held apart, `pcNet` counts them once,
  and `pcChangeWords` says "Striped Delights OR Silver Horseheads" in words.
  **Imperial Legitimacy is this activity's Troubled Waters**, and the badge is built around that.
  Nine of the rows are worth exactly +5, so the net alone separates almost nothing; what does
  separate them is whether that +5 was paid for out of the number that, at 0, ends the term at
  once with no rewards and a trip back to the Foreign Office. So every badge says what the
  option does to Legitimacy **twice** — once as a mark and once as a colour — and the mark is
  the one that has to carry it (see the colour rule under *Conventions*). `pcLegitMark` gives
  `PC_LEGIT_SPEND_MARK` (`▼`) to a row with `il < 0`, `PC_LEGIT_GAIN_MARK` (`▲`) to one with
  `il > 0`, and nothing at all to a row that leaves Legitimacy alone; the two are told apart by
  **shape**, so a badge is complete with every colour stripped off it.
  The four Time 12 endings gain nothing and *spend* a currency, so they carry
  `reset` and a `net` of **null** rather than 0 — collapsing them onto 0 would rank them
  alongside A summons from the Smouldering Herald, which genuinely nets nothing — and they are
  labelled `cash out` instead of scored, the way the trophyless Spite cards are.
  `pcPaint` is **not a ladder** — and it used to be one, running up the tail of the Spite ramp
  by net, which was the wrong call twice over. It spent the badge's one colour channel on the
  number that varies *least* (nine identical +5s given nine shades reads as a ranking that is
  not there), and it made a distinction the reader must name out of hue alone. It now returns
  the colour **and the ink** for what the option does to Legitimacy: `PC_COLOR_LEGIT_SPEND` a
  warm brick red, `PC_COLOR_LEGIT_GAIN` a teal-leaning green (the blue-yellow separation the
  colour rule asks for), `PC_COLOR_NEUTRAL` a light blue for the rows that leave Legitimacy
  alone, and `PC_COLOR_END` a deep slate for the four endings, which are Legitimacy-*irrelevant*
  rather than neutral and read `cash out` rather than a number. The light blue is a **light**
  background, so it ships `PC_INK_NEUTRAL` with it — white on it is not legible, the same lesson
  as `DEPTH_INK` — and the dark three leave `ink` undefined so `makeBadge`'s white stands.
  The palette test is in two halves: that every Legitimacy row still says which way it went with
  the colour ignored entirely, and that each colour clears 4.5:1 against the ink it is actually
  given, in both directions.
  A storylet the guide splits in two (Within their rights, A plea for pardon) is badged with the
  **better** net by `bestPcOption` and keeps **both** branches in its tooltip, because the losing
  branch is not a trap — it is how Imperial Legitimacy is bought back, and it is the right move
  when Legitimacy is low. Open the storylet and each branch is badged in its own right.
  The gate, `PC_AREAS`, stays the **weak** kind, like `ZEE_AREAS` and unlike `SPITE_AREAS`:
  `inPortCarnelian()` only ever confirms, and the option table stays the real scope. The
  greeting itself is now captured, though (2026-09-10): it reads *"Welcome to Heartscross House,
  delicious friend!"* -- the governor's **seat**, not the port. `PC_AREAS` originally listed only
  "Port Carnelian", which is what the **zee map** calls the destination and what the greeting
  never says -- the very split `ZEE_PORTS` already records with `as` -- so the gate could not
  fire and both `strict` rows stayed dark for a whole term. Both names are listed now, since the
  capture is from the seat screen and nothing promises every screen of a term greets you the
  same way. Exactly two rows are `strict` and wait for that confirmation — **His Amused
  Lordship**, which the wiki files as `His Amused Lordship - 2` and so is proof something else
  owns the plain name, and **Inconvenienced**, one ordinary English word.
  `pcKeys` tolerates a leading `"…: "` on a heading, because FL prefixes a storylet inside a
  named activity ("Fruits of the Zee: Supplication on the Shore") and nothing has confirmed
  whether it does the same here. It can only ever *tolerate* a prefix — the remainder still has
  to match exactly — so it cannot widen what matches.
  **The endings are a calculator, not a label** (added 2026-09-10). `cash out` said what the
  four Time 12 rows *do* and nothing about which one to take, and the whole term is played for
  that choice. So each now carries what cashing out would pay you **right now**, in Echoes,
  off your own Striped Delights and Silver Horseheads. `PC_CASHOUTS` is one entry per ending,
  transcribed from the four **ending pages** rather than the guide's table, and `pcCashout`
  is the usual pure function: a row and a purse in, a payout out.
  Three rules hold it up. **Bankers' rounding** — `pcRound` takes a half to the nearest *even*
  number, which is the wiki's stated mechanic and is what makes 105 and 176 the figures to aim
  at. The cross-check is `PC_TIERS`: the guide's tier table was written from the same mechanic
  by somebody else, and every row of it comes back out of the formula except **35**, where
  35/70 is exactly a half and bankers' rounding pays the dear item only from 36. Three rows of
  that same table (176, 316, 385) are reachable *only* under bankers', so the calculator rounds
  bankers' and the dissenting row is named in the comment and in the test rather than rounded
  around quietly.
  **A faction Favour is worth 0 Echoes and carries `PC_FAVOUR_MARK` (`❖`) instead**, and is named after
  the badge like every faction result (`25E ❖ · Favours: Society +1`).
  `Favours: Society` and its siblings are story qualities capped at 7, not items: nothing buys
  one, and the wiki's occasional ~4 Echo figure is notional. Pricing them would let a fixed
  reward out-rank a real cash-out on a number nobody acts on. Tribute gets the same treatment
  for the same reason — a story quality with no market price — listed, with the guide's "about
  12.5 Echoes" quoted as the estimate it is, and left out of the total. Both are marks and
  words, never colour.
  **A Favour in High Places is not one of those**, despite the name: it is an ordinary
  Influence item the Bazaar buys at 12.5, so it is priced like any other item and carries no
  mark. The `favour` field means the capped story quality and nothing else. The first cut of
  `PC_CASHOUTS` had this backwards and priced the item at 0, which took Honoured with a State
  Dinner from 25 Echoes to 0 — the kind of error a badge states confidently and a term pays
  for.
  **A figure nobody has read is not a zero.** With no reading the two currency endings keep the
  old `cash out` label, while the two that pay a fixed reward are still priced (a Cellar of
  Wine is 12.5 Echoes whatever your purse holds); a reading over `PC_FRESH_MS` old is marked
  `PC_STALE_MARK` (`?`) rather than hidden or used silently, because every action of a term
  moves both currencies; and at the Society cap of 7, Honoured with a State Dinner pays **no**
  Society favour, which the ending page states and which is a different claim from paying one
  you cannot hold.
  The plumbing is the festival's, reused rather than rebuilt: `PC_QUALITIES` off the Myself tab
  into `PC_CACHE_KEY` by `bankPcQualities`, banked from the same scrape `fotz-capture` already
  makes and from `refreshBackgroundState`, and `pcPurse()` memoised on a `pcGen` counter with
  the age **bucketed** into the key — a raw timestamp there would rebuild every badge on every
  mutation for ever. The purse is in `attachBadge`'s `value` for the same reason the gate is:
  an ending's badge *is* your Delights, so a badge drawn before the reading landed has to
  redraw when it does. And because banking mutates nothing in the page, `pcMaybeRefresh` calls
  `schedule()` itself afterwards. It books a hidden-frame load of `/myself` only when an ending
  is actually on screen (`spec.cash` says so), only when the reading is stale, at most one a
  minute, and never when the auto-refresh toggle is off.
  The `port-carnelian` panel opens on that calculator — the purse, the four endings priced with
  the best one marked **in words** as well as in the accent, and the next rounding step — over
  the same Refresh / auto controls the other two panels carry. Then the reference half: how to
  unlock and reach the posting, the rules a term is played by, every option grouped by the Time
  Passing window with the same live text filter the Zailing panel has (on
  `row.dataset.pcSearch`, so a term can hit a requirement the collapsed row does not show),
  what each currency cashes in for, `PC_TIERS` with the two rounding steps worth aiming at (105
  and 176) picked out in the accent and a **D** / **H** letter against the step each of your
  two currencies is standing on, and the strategy. It has **no "your hand, ranked" block** —
  there is no hand here; the storylet list is the hand, and it is already badged.

  `scientific-voyages` is the fifth, for the Dilmun Club's **Voyages of Scientific
  Discovery**, and it is the first that has to work out **which of three places** a heading
  belongs to before it can say anything. `VSD_OPTIONS` is one entry per row of three
  different sources: the guide's Preparatory Research and Organise your Research tables, and
  the *Expedition Progress* table on each of **Bullbone Island**, **Corpsecage Island** and
  **Grunting Fen** — the guide transcludes those three rather than restating them, so the
  island page is the source either way.
  **The badge is pages, coloured by kind** (AN / CN / TN), because that is the only question
  these screens ask: you sail to one island for one kind, and at every Orthos band you are
  choosing between the action that pays it and one that pays goods. Those two **cannot be
  ranked against each other** — it would need an exchange rate between pages and Echoes that
  nothing supports — so a goods action is **labelled** with its `headline` rather than
  scored. `vsdPages` returns **null**, not zero, for such a row: "pays no pages" and "pays
  zero pages" are different claims, and a `+0` on the action that hands you 860 Shards of
  Glim reads as the second. On the Organise screen the problem does not arise, since
  everything there is priced, so those rows carry the guide's pence per page and
  `VSD_BEST_PER_NOTE` is **derived** from the table rather than asserted.
  **The Luck rule is `zeeTwScore`'s, and it matters more here.** The three end-of-visit
  gambles state both outcomes and the odds, so they are ranked on expected value: *Cut it
  fine* advertises twice the pages of *Tarry a little* and is worth `1.5` against `9.5` once
  the 70% chance of losing five of every type is counted. Ranked on the advertised half the
  badge would talk you into the worse action at the one moment a voyage is over. The `≈` and
  the `?` on the badge are what say the number is arithmetic rather than a promise.
  **The disambiguation is this feature's real work.** *Time to go*, *Tarry a little* and *Cut
  it fine* are on all three islands and pay a different page on each; so are the storylets
  named after their islands, which are also **area** names. `vsdDisambiguate` therefore
  returns **null rather than a guess** — a badge naming the wrong island's currency a third
  of the time is worse than no badge — and `vsdIslandHere` has two ways to answer: the
  greeting, and failing that the `.storylet-root__heading` on screen, which is on the very
  page the branches are and names its island. The badge's `attachBadge` value carries the
  island as well as the name, so the same heading on two islands is two different badges.
  `VSD_AREAS` is the usual confirm-only guess. **`strict` is kept narrow here on purpose**,
  and the first cut had it wrong: it was on 22 of the 47 island rows, including the
  distinctive ones, which would have blacked the feature out on the storylet **list** — where
  nothing is open to resolve the island and the greeting is an unverified guess, and where
  the badges are most use. It is now the ten ordinary English phrases only (`Time to go`,
  `Tarry a little`, `Cut it fine`, `Looking up`, `Making money`, `Search the island`, `Do a
  survey`, `Catch some`, `Go searching`, `See what you can dig up`), pinned **by name** in
  the test. Storylet headings get a list of their own, `VSD_STRICT_STORYLETS` — the three
  named after their island plus `Up the Hill` — rather than "any branch of mine is strict",
  which would have gated `Sparkling around the Copse` on the one ordinary option inside it.
  This is now the **third** feature on `.branch__title`, which is what the sibling-run
  clearing in `attachBadge` was written for; `choice-scientific-voyages.test.mjs` drives all
  three at once.
  The `scientific-voyages` panel is the reference half: what the Dilmun Club wants before it
  will sponsor you, a per-island table of pages/region/EPA with each island's own kind picked
  out in its colour, every action grouped by phase and island with the usual
  `dataset.vsdSearch` filter, and the guide's three "most preparatory research" plans. **The
  Fleet of Truth deliberately is not in `VSD_OPTIONS`** — the voyage adds it to your zee deck,
  it is already in `ZEE_CARDS`, and no name may be in two tables.

  `university-laboratory` is the sixth, for your own **University Laboratory**, and the first
  whose badge is a **formula** rather than a transcribed number: nearly every option pays
  `k + a × Equipment`, an S-curve on Equipment or an advanced skill, or `(2 + t × Equipment) ×
  √Workers × highest worker level`. `LAB_CARDS` is one entry per card with its options, taken from
  the **individual card and option pages** (~160 of them, fetched through the API) rather than
  *University Laboratory (Guide)/Cards* or */Tables*, which carry a GuideNeedsWork banner and
  disagree with the pages in nine student figures. The guide's Student Table states each student
  option at Equipment 7, so every tier option carries that as `guide7`, and `guideOff` names the
  outcomes where the page disagrees — the stated-versus-derived cross-check, pinned by name in the
  test and quoted in the tooltip. The inputs (Equipment, workers, Experimental Object, research
  done and required, Disgruntlement, Prestige, Glass Studies, the four advanced skills, the five
  student and five staff qualities) are banked off Myself by `bankLabQualities` alongside the
  festival and Port Carnelian scrapes; Unwise Ideas and Unexpected Results come off the
  Possessions counts cache. **The badge is the best success figure among options you can take
  with nothing special in hand** — the Zailing rule. An option with a `gate` (an Epiphany, an
  Unexpected Result, a Searing Enigma, an item or quality not read) is left out and marked `▾`
  when it would pay more; `✦` marks an option handing you an Unavoidable Epiphany and `▼` one that
  uses something up. **No research value is put on an Epiphany, an Idea or a Connection** — the
  wiki gives what each is spent for, not what it is worth, and a guessed exchange rate would make
  every ranking wrong together. Luck options are expected values (`≈`), Watchful ones keep the
  success figure (`?`). **An unread input is a range, never a guess**: Equipment unread spans
  Equipment 1–9 (every formula grows with it), a student's level unread spans the three tiers,
  and a range is grey because a ramp colour would claim a figure. `labStatus` returns
  `open`/`shut`/`unknown`/`gated` and an unread Experimental Object gates an expert's
  project-specific options rather than guessing the project. Rounding is half to even unless a
  page says up or down, which is what the wiki's SCurve module does; one exception is recorded:
  the Shifty expert failure's `4/3 × Equipment` is taken as rounding **up** because the page is
  silent and the guide's 10 at Equipment 7 is 9⅓ rounded up. "Highest worker level" is 5 whenever
  anyone not a student works in the lab (the pages' worked examples all say "at least 1 Expert or
  Expert Student"); whether the Artist or the Urchin count is unknown. **The gate**: the lab's
  greeting was captured in-game on 2026-09-14 — *"Welcome to The University, delicious friend!"*
  — so `LAB_AREAS` is an **exact** list, and `labWhere` is three-state: a greeting naming anywhere
  else clears every lab badge. "The University" cannot say *yes* on its own, since it is also the
  ordinary London area the lab is a setting of; it is trusted only to confirm the `strict` names,
  which nothing at the University outside the lab is known to share. The better evidence is the
  deck — a lab card is only ever in a lab hand — so `labConfirmed` also says yes when any
  non-`strict` lab card is on screen and the greeting cannot be read. `strict` is on the
  thirteen ordinary-English card names (*Eureka!*, *Washing Up*, *Directing your Team*, *Student
  Complaints*…). **Options are badged only inside an opened lab card**, resolved within that card
  (`labBranchRows` / `labDisambiguate`), never by name alone: *Take a break* and *No more of this!*
  are on two cards each and could be anywhere in London. Same-named options on one card
  (*Coordinate a plan of research*, the Numismatrix's three *special expertise* options) are told
  apart by Disgruntlement or Experimental Object, and answer only if every candidate would say the
  same thing. This is the **fourth** feature on `.branch__title`. A figure resting on items or
  research done that is over a minute old is marked `~`, and a lab card on screen with no reading
  or a stale one books a throttled background refresh, off with the auto toggle.
  **Scope**: the core deck, all five students, the Numismatrix, Lettice, Gebrandt, the Urchin, the
  Struggling Artist and The Reflection of Research for those staff. Not transcribed: the ambition
  and Fate-locked experts' cards, the Correspondence / Secret College / Long-Dead Priests cards and
  project focus cards — most of those options are "(see page)" logistic formulas on the wiki.
  The `university-laboratory` panel opens on your lab (Equipment, workers, top worker level,
  project, research, students, staff, items), what *Circulate a draft of your findings* would pay
  now (`labDraft`) and what your leftovers would collate into (`labCollated`), then the lab cards
  on screen, every card's options with the usual `dataset.labSearch` filter, advice, and the
  guide's repeatable projects (`LAB_PROJECTS`), equipment ladder (`LAB_EQUIPMENT`) and expertise
  table (`LAB_EXPERTS`).

  `arbor` is the seventh, for **Arbor, of the Roses**, and has **no panel** (the user asked for
  badges only, 2026-09-14). Arbor deals no opportunity cards, so it badges three things: the
  London card **A Dream of Roses** (`ARBOR_CARD_CLASS`: "9 actions", and in the tooltip whether the
  dream opens on Near or Far Arbor, from the Possessions counts cache's Attar and its age), the two
  storylets a stay happens in, **Near Arbor** and **Far Arbor** (`ARBOR_CLASS`: a "Near map" /
  "Far map" label whose tooltip lists each district's options and the guide's four grinds), and
  every option inside them (`ARBOR_BRANCH_CLASS`). `ARBOR_OPTIONS` is taken from the **individual
  option pages** with the guide's Table of Choices as cross-check; the four rows where they disagree
  (Witness a trial's Watchful 115 vs 100, Surrender some of your Attar's Persuasive 100 vs 79,
  Leave Arbor early's Attar +Linger/2 vs +2, and what Light your candles in Far Arbor costs) follow
  the page and keep the guide's figure as `guide`, quoted in the tooltip. **The badge is what an
  option changes** ("Attar +2", "Attar −3 EI +3"), not a ranking: Attar is built to be spent, and
  what it buys is worth what the player's chosen grind says, so an Echo price would be the badge
  choosing the grind. The **sign** carries the Attar direction and the colour only repeats it
  (teal-leaning gain, brick spend, slate item trades, grey movement). `?` is a stat challenge's
  success outcome (the tooltip has the failure and `arborCertainAt`, which reproduces the guide's
  own Watchful 125 and 167 and is written `× 5 / 3` because `75 / 0.6` is not 125 in floating
  point), `⏏` spends all Permission to Linger, `★` the tribute's rare all-Attar success, `≈` the one
  even-odds option (While away your time, whose 50% is the guide's — the page gives no odds). The
  six options that scale with Permission to Linger or Attar say so in words ("Attar +Linger"),
  never a number, and `linger: null` ("the page does not say") is kept apart from `linger: 0`.
  **The gate is the open storylet**: options are looked up only when a `.storylet-root__heading`
  reads Near Arbor, Far Arbor or A Dream of Roses, since *Walk North* and *Witness a trial* could be
  anywhere; failing that, a greeting in `ARBOR_AREAS` (confirm-only, a guess — no greeting has been
  captured) allows the names that are unambiguous. *Light your candles* is in both cities and does
  different things, so it needs the storylet. This is the **fifth** feature on `.branch__title`.
  Left out: Visit the Queen of Roses, the ambition options and the Coilheart Games petition, which
  are steps in other storylines rather than rows of the guide.

  `lb-industries`, `menace-eradication` and `vertiginous-horticulture` (2026-09-14, no panels, by
  request) are three early carousels that deal no opportunity cards, and they stand on one shared
  piece of plumbing, **`carouselRatings`**: each feature hands it its storylet names, a
  `carouselIndex` of its option table and two pure spec functions, and it badges every storylet
  heading the feature has a summary for, plus the options of the feature's storylet that is **open**
  (`.storylet-root__heading`) — looked up only within that storylet (`carouselLookup`), never by name
  alone, since *Make bobbins*, *Stalk silently* and *Treat the soil* could be anywhere. Wiki titles
  with the placeholders `(growth)`, `(growth type)` or `(work leader)` match any words in that place
  (`carouselMatcher`), because the game fills them in ("Water your mandrakes"); no other bracket
  does. A figure after `?` is what a **failure takes back**, shown only when it takes progress away;
  `▼` uses something up. Arbor predates the plumbing and keeps its own.
  **L. B. Industries** (`LBI_OPTIONS`): a work option shows the Foreman's Favour its success pays
  (`FF +15? −19`); a payout its cost and item (`110 → Reliquary`), with the 10 Bone Fragments per
  surplus Favour in the tooltip. Rare odds are carried only where the page states them (two rows);
  the rest say the page gives none. Cross-check: the guide's "Min for 100%" is `broadCertainAt` on
  all seven. Leaving the shift (*Bid farewell to …*) takes the remaining Favour and the Work Team.
  **Department of Menace Eradication** (`DME_OPTIONS`, `DME_CONTRACTS`): a hunting option shows what a
  success does to Hiding, Wariness or Savagery (`Hiding −5–7? +1`); nearly every challenge is
  `per × Savagery + plus`, which the page cannot show, so the tooltip works it out at both contracts'
  starting Savagery (Rat 15, Ushabti 30). Cross-check: the formulas reproduce each page's example
  difficulty. *Approach it very casually* and *Explore its lair* give only an example, so they say so
  instead of carrying a guessed multiplier. *Lay poisoned bait* is a Luck challenge at 60% and is its
  expected value. Confrontations and bounties name what they pay, contracts what they set, and the
  rat bounty says it costs 5 actions. Page-versus-guide disagreements (Stalk silently's stat, Shoot
  it's failure, Capture it alive!'s CP) follow the page with `guide` quoted; *Expose yourself as
  bait*'s success and *Search for traces*' rare success are the guide's alone because their pages
  record none. The Fate-locked Miniature Menace is left out: the wiki does not carry its options.
  **Vertiginous Horticulture** (`VH_OPTIONS`, `VH_GROWS`): every figure is `k + d × Difficulty` of the
  growth, which is not read, so a nurturing option shows the **range over the Difficulties of the
  plants it can be used on** (`vhDifficulties`: a Shade-only option only meets Difficulty 2 and shows
  one figure). Cross-checks: the guide's Average Gain equals the pages' success, rare success and rare
  odds combined on every row (which is what confirms the 30% on the four class options), and the
  scaling sale reward reproduces the guide's 22 / 37 / 225 at Nurturing 150 with `Math.floor`. The
  guide's challenge column disagrees with eight pages; each is kept as `guide.ch`. The pages write a
  lost failure as "Loss of (1 − Difficulty)", read as the guide reads it: losing Difficulty − 1.
  **Forgotten Quarter Expeditions** (`forgotten-quarter`, `FQ_OPTIONS`, 2026-09-14, no panel) is the
  fourth on the plumbing and the first with four storylets, each badge answering its own screen:
  *Prepare for an Expedition* the Supplies an option gives (`Sup +3 ▼`, the guide's Echoes per
  Supply in the tooltip), *Begin an Expedition in the Forgotten Quarter* an expedition's length and
  Archaeologist or Fate (`30 sup · Arch 3`, with pay, rivals and the guide's worst-case Supplies),
  *Pursuing an Archaeological Expedition* the Progress an approach makes (`Prog +3? ▼`), the Rivals'
  Progress a hindrance removes and what a conclusion pays, and *A Confrontation with a Rival* the
  Progress a confrontation makes. **A menace an option always raises goes on the badge** (`+Wounds`,
  `+Nightmares`); one only a failure raises stays in the tooltip. It added two aliases to the
  plumbing, both backwards-compatible: an entry's **`aliases`** (the game lists *An afternoon off*
  for the page *An afternoon off (1 FATE)*; whether it drops "(7 FATE)" from an expedition is
  unknown, so both are matched), and `carouselRatings`' **`aliases`** map for a storylet (the
  option pages file preparation under *Prepare for an Expedition in the Forgotten Quarter*, the
  storylet page is titled without it). Titles shared by two storylets (*The Chalcocite Pagoda*
  begins and ends an expedition) resolve by the open storylet. Cross-checks: `broadCertainAt`
  gives the guide's 84 / 167 / 267 for the approaches, `rivalOdds ÷ Progress` its 0.25 / 0.25 /
  0.17, and Rumours of treasure's expectation its 1.4. Disagreements (page followed, `guide`
  quoted): the porter also takes 50 Rostygold, the Pagoda's ending is Watchful 40 not 60, and the
  buccaneering approach's rival chance is only "+0–1" on the page — the 50% is from the guide's
  table. Rumours of treasure's odds and the Temple and Gallery conclusions are the guide's alone.
  Left out: the Broken Granary's conclusion (no wiki page), and the Observer, Khan's Workshop,
  Granite Gallery, Wolf's Reflection and Ophidian Gentleman storylines.
  **Cat and Mouse** (`cat-and-mouse`, `CM_OPTIONS`, 2026-09-15, no panel) covers all six cases:
  the Business Card's *A meeting with the Implacable Detective* and *Finding the Screaming Map:
  beginning the search* (what a case pays and the guide's EPA, `Plaques · 1.19 EPA ▼`), the two
  pursuit storylets *Cat and Mouse: an Elusive Target* and *Cat and Mouse: the Screaming Map*, the
  Medium's *Look at the ivory frame* in *The mirror-frames*, and the six ending storylets (`60+
  Journals + Jade`). **A pursuit badge is the Cat an option makes**, because nearly every option
  spends exactly one Mouse — the clock — so Cat is what varies; the four options spending two
  Mouse name it (`Cat +10 Mouse −2 ▼`), and the 70% Luck lines carry `≈` and their expected Cat,
  since a failure spends the Mouse too. The two pursuit storylets share most titles (resolved by
  the open storylet); the wiki's disambiguating " 1" / " 2" suffixes are aliases. Cross-checks: the
  guide's maximum Cat of 63 (67 for the Medium) is rebuilt from the table band by band, and its
  Echo cost per item column is carried as `echoes`. Disagreements (page followed, `guide` quoted):
  *Time is passing: play it safe* costs 2 actions in the guide and 1 on both pages; the three
  map-half searches are one narrow difficulty higher in the guide; the ivory frame is Luck 90% on
  the page and certain in the guide's plan. *Take the fee* is on the page only.
  **The Season in Soup** (`season-in-soup`, `SOUP_OPTIONS`, `SOUP_ITEMS`, 2026-09-15, no panel)
  badges *Mrs Chapman's Boarding House…*, *An Array of Soups* and *Horatia's Parlour*. Every item
  option pays `y_offset + height / (1 + e^(−0.037 (Persuasive − 150)))` on base Persuasive capped
  at 230, rounded half to even (`Module:SCurve`), on one of three curves by the item's price; base
  Persuasive is **not read**, so the badge is the range 0–230 (`Zee-Ztory ×1–5`) and the tooltip the
  figure at each fifty. The value barely differs between options, so the item is the badge; **★**
  marks the three noise-in-the-walls options. Cross-check: the curve gives the guide's 240 Hints at
  the cap, and the per-week table matches the guide's. **Promenade is one title in all four
  weeks**, so `soupWeek` reads the week off the week-unique options on screen and `SOUP_INDEX[week]`
  picks that week's row; with no week, a generic row says only `item ×1–5`. The week is passed to
  `carouselRatings` as its new, optional `salt`, so a Promenade badge redraws when the week becomes
  readable on the same heading node.
  Five more on the plumbing, 2026-09-15, no panels, each transcribed from its option and storylet
  pages with the guide as the cross-check, and two small shared helpers (`carouselTooltip`,
  `carouselSummary`) for their tooltips. **The Mind of a Long-Dead God** (`long-dead-god`,
  `MIND_OPTIONS`): every payout is Stormy-Eyed −5 CP plus one reward, and a challenge pays **only on
  a failure**, so the badge is the reward with **✗** for "a failed challenge pays it" (`Shadowy +10
  ✗`); Stormy-Eyed is not read, so the tooltip gives `mindFailChance` around the difficulty (narrow:
  60% success at the difficulty, 10 points a level, 10%–100%). Pages that state odds instead of a
  difficulty are read as difficulty = their 50% level + 1, as the pages stating both have it. It is
  the only carousel that also badges **cards in the hand** (`MIND_CARD_CLASS`, skipping the opened
  card's `.storylet-root__heading`, which the plumbing already summarises), and *Rain* and
  *Geology* are **confirm-only strict**: badged only while `currentArea()` reads *The Mind of a
  Long-Dead God*, a greeting nobody has captured. Cross-check: Stormy-Eyed 19 is 190 CP, 38
  payouts, the guide's 380 CP or 38 Screams. **Engaged in a Case** (`engaged-in-a-case`,
  `CASE_OPTIONS`): Detective's Progress on success/failure, actions over one, ▼, and ≈ expectation
  for Luck; faction-card headings are not summarised. The Pursue pages state difficulties at Case
  Difficulty 10 and the guide's formulas reproduce all but *Seek truth in gossip* (35 vs 45; the
  guide's formula is kept, the page quoted). Other disagreements: *Follow a lead*'s actions, the
  Docks' and Criminals' Luck (60% page, 70% guide), the Bohemians' failure Watchful. **The Sunken
  Embassy** (`sunken-embassy`, `EMB_OPTIONS`): Fragments on success/failure and each reward's cost;
  the guide's Min for 100% is `broadCertainAt` of every broad difficulty, and *Peel fact from
  falsehood* is narrow 5, certain at 9, where the guide says 10. **Law-Furnace** (`law-furnace`,
  `LAW_OPTIONS`, `lawBase`): base Actus Reus is the guide's piecewise formula on the rounded stat
  average (continuous at 100/150/190, 480 at 230 as its example says); the advanced-skill checks are
  narrow 4 on the pages and 8 in the guide; *Persona Non Grata* is aliased to *Pro Rata*. **The
  Prelapsarian Museum** (`prelapsarian-museum`, `MUS_OPTIONS`): `CAROUSEL_PLACEHOLDER` gained
  `(first option)` / `(second option)` so the Assert titles, which name a taxon in the game, match;
  the Toxicology Exhibit's 2.4 CP Wounds and the Neathoscope's 1.57 CP Nightmares are the pages' odds
  worked out, as the guide has them; a failed *Request help* gives Scandal and no Identifying... on
  the page, +1 in the guide.
  Five more, 2026-09-15, no panels, with three new shared helpers: `carouselChallenge` (the
  challenge line, narrow certain at difficulty + 4), `carouselEv` (an expectation to one decimal) and
  **`carouselHandRatings`** for a carousel that deals its **own undiscardable deck**: a card in the
  hand is badged with its best option needing nothing special (no `needs`, no `uses`) by the
  feature's `rank` array, and `▾` (`CAROUSEL_MARK_HIDDEN`) when a gated option ranks higher; it skips
  the opened card's `.storylet-root__heading`. `CAROUSEL_COLOR_RISK` (warm brick) is new, for a line
  whose text already names the risk. **On a Heist** (`on-a-heist`, `HEIST_OPTIONS`): Progress and
  Cat-Like Tread; Luck options at their expectation, stat checks at success with the failure's Tread
  (`Prog +1? fail Tread −1`); the hand ranks **Tread before Progress**, because three Tread is the
  whole margin and nearly every card has a safe Progress line. Outcomes the game picks with no odds
  (*Poke through the possibilities*, *Speak to her*, *Abstract the papers*) are labels. Prizes carry
  the guide's Echo values. The Countess's and Envoy's prize storylets were not read. Disagreements:
  the three narrow checks are certain at difficulty + 4 on the pages and one more in the guide.
  **The Spider Symposium** (`spider-symposium`, `SPIDER_OPTIONS`): Applause on success/failure;
  cross-checks are the guide's Min for 100% and its Average Gain at a 25% rare success; no
  disagreements. **Short Stories** (`short-stories`, `STORY_OPTIONS`): pages and actions while
  writing, Potential and cap while reworking, Echoes on success/failure when publishing; the guide's
  Echo-difference column is each tier's success less failure. Disagreements: A Cautious Edit's cap,
  A Daring Edit's difficulty, and Add a touch of darkness's cap of 62 against its own instructions'
  70. **Flash Lays** (`flash-lays`, `FLASH_OPTIONS`) is the **one transcribed from a guide
  subpage** (*Flash Lays (Guide)/Cards*) rather than option pages, and says so; the case and Make your
  Move pages were read. Both marks' difficulties are carried (`{ lo, hi }`); the Auditor's is 2.5×
  the Spirifer's on every row but *If you can't trade on your reputation...*. Two same-titled options
  on one card are one labelled row. It also badges the hand. **Social Actions** (`social-actions`,
  `SOCIAL_OPTIONS`): letters, sends, correspondence rewards and the four assassin cards (☠ on the
  deadly option, one row per title covering both Horsehead Amulet versions); the recipient effects
  are the guide's table; cross-check: the reward thresholds 4 / 5 / 9 are the 10 / 15 / 45 CP spent.
  Three more, 2026-09-15, no panels. `carouselHandRatings` gained two optional, backwards-compatible
  fields: `allowed(storylet)`, a gate for card names too ordinary to badge anywhere, and `salt()`,
  what that gate depends on (so a hand badge redraws when the greeting changes). **Cave of the
  Nadir** (`cave-of-the-nadir`, `NADIR_OPTIONS`) is transcribed from *Cave of the Nadir
  (Guide)/Cards* and the guide's value analysis — the card option pages were not read — plus *Enter
  the Cave of the Nadir*'s pages. Badge: what it gives, the guide's Echo value, the Irrigo
  (`Enigma · 62.5 · Irrigo +2 ▼`); the hand ranks by value then least Irrigo. Ten ordinary card
  names (*Losing*, *The Web*, *Old Bones*…) are **confirm-only strict** on the greeting *Cave of the
  Nadir*, never captured. *The Sound of Wings* is also in `ZEE_CARDS` — the one card name two tables
  share — and is safe only because the zee gate and the Cave gate need different greetings; the
  Nadir suite pins that. Cross-check: `nadirLeaveLoss` reproduces the guide's penalty table.
  Disagreements (table followed): the Rubbery Man's Irrigo, the black ribbon casket's 312.5 vs
  312.65, and the Radical Factotum's missing Favour. Same-titled options on one card are one row; the
  option titled "-" is left out (no letters to match). **Artistry in the Empress' Court**
  (`empress-court`, `COURT_OPTIONS`): Inspired... on success/failure while working, a finished
  work's goods (every minor 17 Echoes, every major 30, which the tests pin, so the item is the
  choice); cross-check 153 / 300 CP = Inspired 17 / 24. Disagreements: the organ recital's narrow
  Austere 6 vs 7, and eleven works' Making Waves or menaces. *Seek out the music of stars* is not in
  the guide's tables. **Breeding Monsters** (`breeding-monsters`, `BREED_TABLE`, `BREED_OPTIONS`):
  the three progress storylets (CP a success makes) and the seven breeding storylets, each with the
  same four `Breed the …` titles resolved by the open storylet; badge both payouts and the expected
  Echoes; cross-check: every guide expectation is 70% / 30% of its two Echo values, and 21 CP at +3
  is the guide's seven actions.

  Five more, added 2026-09-16, all storylet-and-option markup with **no panel** (asked for that way).
  **Tales of Mahogany Hall** (`mahogany-hall`, `MH_BUILD`, `MH_SHOWS`, `MH_ODD`, `MH_DAYS`): the CP is
  the badge's number in both directions — a building option's Tales gain (`Tales +2? · Brass ×102`), a
  show option's Tales cost (`−8 CP? · Jade ×200`), and a day on *The weekly variety bill!* with the
  Tales it needs and the show's own reward, which is paid whichever option you take there and so sits
  on the day and the storylet rather than on a branch. Cross-checks: the seven days need Tales 8…14 in
  order, and no show's failure costs less CP than its success. The storylet pages supplied the names
  the guide's table hides behind day links — Friday's show is *Fallen London's Best-loved
  Entertainers* — and *Assist a hypnotist* and *Watch from the audience* each sit on two storylets and
  resolve by the open one. Four rows that raise four or five menaces whatever happens carry words
  rather than a figure. Disagreement (carried both ways in the tooltip): the guide prints *Smoke and
  mirrors* twice, at Moon-Pearl ×226 and ×113. **Master-Classes in Etiquette** (`master-classes`,
  `MC_PUPILS`, `MC_LESSONS`, `MC_TRIALS`): Pygmalion CP and the pay (`Pyg +2? · Brass ×97`), the
  graduation as a reset plus a lump, and a pupil as the whole course's pay and the guide's EPA — the
  only choice that changes the rate. `▼ Pyg −2` marks the Pygmalion challenges, whose failures push
  you back. Two cross-checks: a basic lesson pays its own difficulty in goods (97 at Persuasive 97),
  and a narrow Pygmalion challenge is certain 4 levels above where it starts — twelve of the thirteen
  rows agree, and the Scullery's *Take supper with him* (9, "100% at 14") is the one that does not, so
  its tooltip prints both. The two Fate pupils' lessons are **left out**: the guide records their
  titles only as "Choice 1" / "Storylet 2", and there is nothing to match on; their rows on *Provide
  Master-Classes in Etiquette* are badged, since those titles are known. `MC_ALIASES` points the
  wiki's disambiguated *Educating Lyme 1* at the game's *Educating Lyme*. **Patrolling the Sixth
  Coil** (`sixth-coil`, `SIXTH_FLOORS`, `SIXTH_ROOM_OPTIONS`): the first feature whose **storylet
  headings are randomised too**. Four qualities rewrite the room name (Locales), the option's verb
  (Verbs), the way out (Passages) and the direction (Directions), so the table carries all **35** room
  names across the four floors and enumerates each option's VERBS as aliases, wildcarding only the
  direction and the passage — nine new `CAROUSEL_PLACEHOLDER` entries cover the rest. Enumerating the
  verbs is load-bearing: a wildcard verb makes "Sneak north through a bent trail" and "Slip through a
  cracked mirror" the same pattern, `carouselLookup` answers nothing for both, and neither is badged.
  Badge: what the action does to the two progress qualities and the stat it is checked on (`Patrol +1
  Coil +1 · Watchful 250?`), since the guide's rule is to leave at Patrolling + Coiling = 39, which is
  what makes *Examine a sealed door* — `Patrol +2`, no Coiling, no challenge — worth two of anything
  else. A Burden shows its three levels of Unburdened (60 points of every attribute); the exit
  payouts show what each pays per point of Patrolling, with the figure at the cap of 40 in the
  tooltip. Disagreement: the guide calls the payout quality *Patrolling the Labyrinth* and the option
  pages call it *Mapping the Labyrinth* in seven places; treated as one quality, badged with the
  guide's name. **The Rat Market** (`rat-market`, `RM_SELLS`, `RM_BANDS`): a shop, not a carousel.
  Entry costs 3 actions once a weekend and 0 after; selling costs none. A sale badges what it is worth
  in **Echoes as a range** — fresh market to saturated — because Rat Market Saturation is stated
  nowhere this script can read, and every price is **derived** from the one figure each option page
  gives, the item's Nominal Sale Value: nominal × 1.32 / 1.12 / 1.00, ÷ 10 pence a shilling. That
  reproduces every Rat-Shilling price the guide prints (165/140/125, 660/560/500, 825/700/625,
  4125/3500/3125), which the suite pins. What the market **sells** is deliberately not priced — the
  stock turns with the Rat-Wind, the Rat-Moon and two seasons — and the Maundering Rat's Stall and the
  Tatterdemalion Tent say so instead. **A Boxful of Intrigue** (`boxful-of-intrigue`, `BOX_ROUNDS`,
  `BOX_REWARDS`): the badge's one claim is the **side**, in words (`Conscience · Box +1?`), because
  every round is the same broad Shadowy 130 for the same one point and what separates them is which
  power they serve — serving the wrong one is not a smaller reward but A Turncoat. Colour follows the
  side only after the words have, teal against warm brick rather than red against green. The two Salon
  options suit either side and pay no Kingmaker, and say so. Correction from the option pages: the
  guide's rewards table prints Correspondence Plaque ×6 against all six payouts and the payout pages
  give none — the six come from three plays of *Intercept the messages*, so they are off the payout
  rows and named in every payout's tooltip instead.

  Four more, added 2026-09-16, again storylet-and-option markup with **no panel**. **Underclay**
  (`underclay`, `UC_PROGRESS`, `UC_REWARDS`): two progress qualities rather than one, each on its own
  storylet, spent on the hub *Escape from Underclay* — badge is the points a success makes and what a
  failure takes BACK (`Confessions +30? −13`), and for a reward its cost, its pay and the guide's
  Echoes **per point** (`Fal 50 → Labour ×3 · 0.15/pt`), which runs the opposite way to intuition:
  the cheap rewards are the efficient ones. A failure that only raises a menace stays in the tooltip,
  as everywhere else. Two cross-checks: every broad "Min for 100%" is the difficulty × 5 ÷ 3, and the
  Echoes per point fall into three bands by the **total** points a reward costs, which is what checks
  the three two-currency rows against the six single-currency ones. The option pages add a tenth
  reward the guide's table has not got (*…fight for the Admiralty*). Note: this guide puts a narrow
  challenge's 100% five levels above its difficulty where the Master-Classes guide uses four; both are
  carried as stated. **Hunting Bees in Old Newgate** (`hunting-bees`, `HB_OPTIONS_RAW`, `HB_REWARDS`):
  the badge names the **attribute** (`Bees +25? −6 · Watchful 88`) because *Dagger or Flint* decides
  whether the checks are Watchful or Dangerous and almost every option shifts it by a random ±10, so
  the same option is not the same option two actions later. Airs rows carry their window. Three of
  those windows differ between the guide and the option pages by a point; the **pages** are followed
  and each says so. The way out is titled plainly *Escape*, which `HEIST_OPTIONS` already owns, so the
  row is filed under the wiki's *Escape (Flint or Dagger)* with the plain title as an alias — the
  first time a name collision has been resolved that way rather than by dropping a row. **Featuring in
  the Tales of the University** (`featuring-tales-university`, `FTU_STEPS`): the only feature in the
  file that badges storylet **headings and nothing else**, because the guide records no option tables
  for the storyline. Badge is the level and what the step does (`FTU 6 · locks the first carousel ⏏`);
  `⏏` marks the two irreversible steps and is deliberately NOT the `▼` used for "uses something up",
  since nothing is consumed — a door closes. It quotes no figures at all: the guide gives none, and
  the storylets you play alongside these belong to the first two Term Passing... carousels, which are
  not badged either. Two titles end in a blank the game fills in, so each matches bare and wildcarded
  (a new `(department)` entry in `CAROUSEL_PLACEHOLDER`). **Term Passing...** (`term-passing`,
  `TP_ROWS`): the guide covers three carousels of the same shape, never open at once, picked by
  Featuring in the Tales of the University — and **only the last, *A Respectable Academic* (FTU 30+),
  is carried** (by request, 2026-09-16). It is the only one still open once the story is done; the
  first two lock behind you. The badge has three parts in this order: the Term Passing... CP, the
  guide's Echoes, and **last any Connected the option builds** (`TP +4? · 1.24 E · Benthic +12`). The
  Connected is last because it is the reason to run the carousel rather than the reason to pick one
  option over another — the Echoes rank the options, the Colleges are what you are there for. Only
  **gains** show; a Connected an option spends is written with a minus sign and stays in the tooltip,
  the way a menace on a failure does everywhere else. `tpConnected` **reads those figures out of the
  row's payout** rather than storing them a second time beside it, so the badge and the tooltip cannot
  come to disagree; the name is cut at a comma so a run of clauses can never be swallowed into one.
  Three rows the guide does not price fall back to the first clause of the payout, **skipping a
  Connected clause** — it is already the last thing on the badge, and twice reads as two payments.
  *Historical:* while all three carousels were carried, the badges had to quote two readings at once
  (`1st … | 3rd …`), because the third renames the first's storylets into Title Case (*Off to the
  Library* against *Off to the library*), `normalizeName` folds case away, and `carouselLookup`
  answers nothing when two rows match — which would have left three dozen options silently unbadged.
  Dropping the other two carousels dropped that whole mechanism (`tpMerge`, `TP_SHARED`,
  `TP_ORDINALS`, the bespoke `tpSummary`) with it. If they are ever restored, restore the merge too.

  Seven more, added 2026-09-17 from the Early PoSI shelf of the guides, storylet-and-card markup with
  **no panel** (by request). Six of them share **`posiSpec`**, a small reading of one row shape
  (`win`/`lose` as `[tag, n]` change points, `sets` for a quality SET to a value, `luck`, `pays`
  with the guide's Echoes, `label` for a fixed badge) so that none of them re-derives the badge text:
  progress first, then the failure's after a slash, bare signs when it moves only what the success moved
  (`Posting +2 CP? / +1`), named when it moves something else (`Clues ×270? / Inv −5 CP`); a Luck line
  at its expected value (`≈War +0.5 CP`); a payout with the guide's success and failure Echoes
  (`Rifles · 17.5? / 7.5`). A tuple's third element overrides the " CP" unit — the Newspaper's copy is an
  item count. A label takes no `▼` of its own (it is written to say what it costs) and is coloured as a
  payout when it uses something up, as an exchange is. **A Trade in Reputations**
  (`trade-in-reputations`, `TIR_OPTIONS`, `TIR_STATED`) has its own spec because every figure depends
  on Advertising Profile: Enterprise, which is not readable mid-campaign: the badge quotes **Enterprise
  25** — the free maximum the guide raises it to at once — and says so in the rules, with 0/10/15/20
  in the tooltip (`NR +312/411? −156`: Standard, Rare, and the Standard loss). The Change Tables page
  states the three tables at twelve Enterprise levels AND the logistic curve behind them; both are
  carried and the suite pins one against the other. It badges the campaign deck in the hand (`▾` for a
  line behind a spokesperson, a hireling or an item) and every option. The card *Have (Campaign Focus)
  Reviewed* is titled after the product in game, so four expansions are aliased — **not captured** —
  and `carouselHandRatings` now honours `def.aliases` so the hand finds it too; `(campaign focus)` is
  a new `CAROUSEL_PLACEHOLDER` for the two hireling options. The four *Complete the paperwork* options
  share one title and are one row. **Riding the Savage Cobbles** (`savage-cobbles`, `RSC_OPTIONS`),
  **Working toward a Foreign Posting** (`foreign-posting`, `FP_OPTIONS`) and **Fighting a War of
  Assassins** (`war-of-assassins`, `WOA_OPTIONS`) are ordinary level carousels; each storylet heading
  says its tier (`Cobbles 5–6`, `Posting 7 · cash in`, `War 4 → Tension`), and the suites derive the
  guides' action counts (14, 14, 11 a round and 34 a prize) from the CP arithmetic. The Foreign Posting
  guide labels its tiers 0–5 and 5–7; the pages lock at 5 and are followed. **Publishing a Newspaper**
  (`publishing-newspaper`, `NP_OPTIONS`, `NP_HOURS`): one storylet per Hour, the badge is the copy a
  line writes (`Sal +12?`), a failure takes copy back only at Hour 2 (`/ −6`), and an edition shows
  what it needs and the guide's Echo range (`Merit 60 → Journals · 34–62`). The guide lists no
  challenges; the pages have Shadowy 115–130 on nearly every line, which is followed. **Embroiled in
  the Wars of Illusion** (`wars-of-illusion`, `WOI_OPTIONS`, `WOI_CARDS`): the Investigating/Seeking
  carousel, the Bats/Cats one and the Theosophistical cards (also in the hand, ranked by the Seeking
  they make; the option the wiki files as impossible is a label so it is never the pick). Ten rows
  disagree with the guide and each carries a `guide` field the tooltip prints — the suite pins the list.
  Several storylets share an *Enough* and a *Done for now*; they are one row per storylet, resolved by
  the open storylet. The Mahogany Hall levels (15+) are story steps without figures and left out.
  **The Temple Club** (`temple-club`, `TC_OPTIONS`): exchanges, not a carousel — every badge says what
  it takes and what it gives (`Rostygold ×300 → Scintillack`), `★` on exactly the guide's four reasons
  to come, the guide's verdict in the tooltip.

  Three more, added 2026-09-17, again storylet-and-card markup with **no panel**. **Attending a Party**
  (`attending-party`, `PARTY_OPTIONS`): the badge is Talk of the Town CP (`posiBadgeCore`), then a Time
  cost other than 1 (`Time −2`, `fail Time −2`), Making Waves, and the Favours (`partyBadgeText`). A
  party card offers a **different option at each Time Remaining**, and Time Remaining is not read, so
  the hand badge is a **label** (`party card · Time 5, 4 and 3`), never one option's figure; the opened
  card's option is badged normally. Five rows disagree with the guide and carry `guide`. **Searching
  out a Missing Woman** (`missing-woman`, `MWS_OPTIONS`) and **Doing Business in Wilmot's End**
  (`wilmots-business`, `DBW_OPTIONS`): two carousels of one shape — an opening choice that SETS the
  progress and a gating quality (`Search → 2 Looking → 2`), steps at 2 and 4, a choice at 3, payouts at
  5 — with the gating range on each storylet heading (`Search 4 · Looking 2–3`) and the two Luck cards
  in the hand ranked by expected CP (`posiSearchRank`). Both share Dramatic Tension with War of
  Assassins. The payout titled *An exchange of favours* is filed as `An exchange of favours 2` with the
  plain title an alias, because `FP_OPTIONS` owns it — the Hunting Bees precedent.

  Four more, added 2026-09-17, card-and-storylet markup with **no panel**. **Brawling with Dockers**
  (`brawling-dockers`, `BRAWL_FIGHTS`, `BRAWL_REWARDS`): one storylet whose fighting options are titled
  the same for a group and a lone fighter but pay differently, so `brawlSide` reads the side off the
  REWARD titles on screen ("Accept a share of …" is a group, "Claim …" alone) and the badge shows both,
  group first, until one is there; the side is in the `salt`. Each variable reward carries its stated cap
  and the Brawl it is reached at, and the suite pins cap = 25 × (that − the threshold). **Assembling a
  Skeleton** (`assembling-skeleton`, `SKEL_BONES`, `SKEL_BUYERS`): bones on *Assemble a Skeleton* show
  pennies and attributes as [failure, success] ranges — Implausibility is only ever a failure's — and
  buyers on *Seeking Buyers* their primary and secondary pay and `exhausts`; the declarations, the
  world-quality buyers and the Draconic Spine are left out. Option titles end in the skeleton's
  description, a new `(skeleton type)` entry in `CAROUSEL_PLACEHOLDER`. The bones came from the guide's
  /Bones table, with every option page parsed for the pennies as the cross-check; four rows follow the
  page. **Professional Activities** (`professional-activities`, `PROF_JOBS`, `PROF_PAYMENTS`): 66 jobs
  GENERATED from the six *The Business of a …* storylets and their option pages, checked against the
  guide's per-profession tables; the fourteen disagreements carry `guide`. **Hearts' Game**
  (`hearts-game`, `HG_ACTIONS`, `HG_REWARDS`): the 50 accomplice cards' basic and advanced actions
  (Progress, Prep gained, Prep needed, Counterplay, the Tolerance rule) from the option pages, the hand
  ranked by Progress with a formula counting as nothing; the Page of Quills rewards with the guide's
  values. *Set an ambush* is filed under the wiki's *Set an ambush (Page of Inversions)* with the plain
  title an alias, because Hunting Bees owns it.

  Three more, added 2026-09-17, card-and-storylet markup with **no panel**, and the first features
  filed under a zee port rather than London. **Time Passing at Hunter's Keep** (`hunters-keep`,
  `HK_OPTIONS`, `HK_WINDOWS`) and **Time Passing on Mutton Island** (`mutton-island`, `MI_OPTIONS`,
  `MI_WINDOWS`) are two carousels on ONE progress quality, *Time Passing in the Southern
  Archipelago*, and they share no storylet, so each answers only for its own. On both, progress is
  the one thing that does NOT vary — every option is +2 CP on a success and +1 on a failure — so the
  badge is the option's **payout**, `?` for the challenge in the way and the menace a failure costs,
  and the flat progress is stated once in the rules line. Hunter's Keep marks with `★` the fifteen
  options that need *Hunter's Insight*, which only a finished cycle gives; Mutton Island says
  `reset` in words on the seven lines that end the cycle, since Time Passing is the island's whole
  clock. A storylet heading carries the window it opens in (`Time Passing 7–9`). Both tables came
  from the guides with every storylet and option page parsed as the cross-check, and the pages win
  where they disagree: the guide files *The voice of the wind* as a storylet and its page makes it an
  option of *The Mutton Island Wind*, and *Follow the Ecstatic Venge-Rat* is on the storylet page and
  in no guide table at all — both carry `guide`. The plain *Prepare yourself* is Hearts' Game's, so
  Hunter's Keep files its own under the wiki's *Prepare yourself 1* with the plain title an alias.
  **Venderbight** (`venderbight`, `VB_OPTIONS`, `VB_WINDOWS`) badges the tomb-colony's own deck at
  *Ambition: Nemesis* 11–14 — the hand, the opened card and its options — with the Nemesis change
  points a success pays, the hand ranked by that and then by the stat CP a progress-free line gives
  (the whole difference between *Not quite silence*'s two options). The two options that pay one of
  two things at the game's choice with no odds stated (*Carouse with the dead*, *Snatch a bat out of
  the air!*) are written out as that choice and ranked at what they **guarantee**, never at the
  better half. *A woman of sinister repute* is a storylet, not a card, so it is badged where it
  stands and kept out of the hand; *Far from home*, the autofire card that replaces the deck at
  Nemesis 15, is left out. Each of the three gates the handful of its names that are ordinary
  English (`HK_STRICT`, `MI_STRICT`, `VB_STRICT`) on its own area's greeting, confirm-only — and
  Mutton Island's is the one greeting of the three already captured in game, the same string
  `FOTZ_AREAS` rests on, which a suite pins.

  Five more, added 2026-09-17, the Mid Zailing shelf, card-and-storylet markup with **no panel**.
  **Pilgrimages in Godfall** (`godfall`, `GF_OPTIONS`, `GF_PROGRESS`): the 16-action pilgrimage through
  the Shattered Citadel. One currency runs it, St Stalactite's Favour, so a Pilgrim's Path option shows
  the Favour a success pays and an Oblation shows the goods AND whether they are bought with Favour or
  taken free — the pair on each Oblation is worth the same by the guide's own finding, so the badge's
  job there is to say which side of the trade you are on. `▼` is what is spent, `▾` what is only
  required (the bats and the bagpipes come home). The ending's arithmetic lives in four constants
  (`GF_FAVOUR_ECHOES` 3.5, `GF_OBLATION_ECHOES` 2, `GF_ABSINTHE_ECHOES` 0.5, `GF_TITHE_BOTTLES` 28) and
  the suite pins that they agree: 7 bottles a Favour, 4 an Oblation, and the 28 held back are the
  guide's "tithe of 14 Echoes". The Evolution option on each Oblation is left out.
  **The Maze-Garden** (`maze-garden`, `MZ_OPTIONS`): the labyrinth deals its own undiscardable deck, so
  this badges the hand too. Two qualities at once: Awakening..., which is the pay, and Perambulating...,
  which is the clock — and the badge carries the Perambulating **only when it is not the usual +4**
  (`MZ_PER_DEFAULT`), because the exceptions are the whole point. The hand ranks by Awakening, then by
  the least Perambulating, which puts DISCERN's *Select a head from the pile* (+7 for +2 of the clock)
  above every other +7, as the guide says it should be. The six trades at the end carry cost, count,
  the item's own price and the Echoes per change point, and the suite recomputes the rate from the parts.
  `(garment)` is a new `CAROUSEL_PLACEHOLDER` entry. PARTAKE's *Allow your (garment) to join in* is
  **one row labelled with both readings**, because two different options share that title and only
  Awakening tells them apart; HARVEST's Fate option and TRANSFIGURE's ushabtiu line are labelled
  `unrecorded` rather than scored.
  **Polythremic Promenade** (`promenade`, `PP_OPTIONS`): the Polythreme Streets deck plus its storylets.
  Every badge carries BOTH ALLURE and COGNISANCE, since nearly every card raises one and lowers the
  other and a lone `+12` reads as twice the progress it is; the hand is ranked on the two added
  together. Payouts carry the guide's value and Echoes per action, and the suite pins that the second is
  the first over the promenade's twelve actions. The two exchanges pay 22 **or** 12 on a Sartorial
  Cooperation check, so both halves are written out. One row follows the guide over the page and says so
  (`So that's who he is`, whose page lists only the +12); the storyline conclusions are left out.
  **Port Cecil** (`port-cecil`, `PC2_OPTIONS`, `PC2_WINDOWS`): the 14-action tide carousel. High Tide's
  six options all give a flat +3 CP to their faction, so the badge prices the goods at the guide's three
  tiers (2.00 / 3.00 / 3.20) instead. Low Tide is left as a **formula** — `Miners +1+Prep`, `Cats
  +Recep` — because your Receptivity and Preparations are on no page this script reads, and the tooltip
  says so. The four Perigee endings are labelled by the standing they need, never ranked: all four pay
  one item worth 12.50 and three worth 2.50. *Check the lay of the land*, a free action the guide's
  table has not got, comes off the storylet page and carries `guide`.
  **Hunting the Beasts of the Zee** (`zee-beasts`, `ZB_OPTIONS`, `ZB_APPROACH_NAMES`): the first feature
  whose STORYLET is named for the quarry, so the seven headings the game can show (plus the wiki's
  placeholder title) are aliased onto one canonical `Approaching the Zee-Beast` through
  `ZB_STORYLET_ALIASES`, and `(Zee-Beast)` and `(Zee-Beast Location)` join `CAROUSEL_PLACEHOLDER` — the
  only two entries there with capitals, which the pattern needs. A hunting action shows the Pursuit a
  success and a failure make (*Take a risk* is the only one that goes backwards); the two Elusiveness
  lines show what they take off and why that is worth an action. **No difficulty is ever claimed**: the
  checks scale with Elusiveness of your Quarry and Zee Peril, neither of which is readable, so the
  tooltip gives the rule (Zee Peril, Zee Peril + 75, or the guide's logistic 4-to-14) and the badge a
  plain `?`. The Lifeberg's three regions are one hunt row and one kill row naming all three.

  Six more, added 2026-09-17, the Early and Late Parabola shelves, card-and-storylet markup with **no
  panel**. Nothing in Parabola deals a deck of its own, so none of them badges a hand.
  **The Chessboard** (`chessboard`, `CB_OPTIONS`): a match is two opening moves, five middle-game moves
  and an endgame, and every badge leads with the **score** — Positional Advantages minus Strategic
  Weaknesses, *derived* by `cbScore` and never stored, so the parts and the total cannot drift. The
  Weaknesses follow it whenever a move touches them, because the two A Player's Studies endings are
  gated on Weaknesses (7 for Studies 1, at most 6 for Studies 2) rather than on score. `no move` marks
  the six options that cost an action without advancing Progress on the Board. The suite pins the
  guide's own "Can I Still Win?" score table against the two columns.
  **Parabolan Hunting** (`parabolan-hunting`, `PH_OPTIONS`): Ferocity leads, because every check is
  `180 + 20 × (Parabolan Ferocity − Parabolan Scouting)` — so **no difficulty is ever claimed**, your
  Scouting being unreadable, and the badge instead shows the two levers: `Scouting +8 ▼` and
  `Ferocity −5 ▼`. Two of its storylets are named for the quarry, and the quarry list is open-ended, so
  this is the first feature to pass **a FUNCTION** as `aliases`: `carouselCanonical` now accepts one,
  and `phCanonical` maps any *Pursuing the …* or *Embattled with the …* heading onto the canonical name.
  `(Parabolan Quarry)`, `(Quarry Home)` and `(its lair)` join `CAROUSEL_PLACEHOLDER` — the last two
  being the first title to carry two placeholders at once.
  **Oneiropomp** (`oneiropomp`, `ON_OPTIONS`): both progress qualities on every badge (Intensity is the
  reward at 2 Echoes a level, Duration pays 15 Sightings a level), and each cash-out's **three modulo
  tiers in order**, best first, since those pay the top tier as often as your Intensity covers it and
  the remainder downwards. Every row carries whether Parabola must be relaxed or strained, which is what
  the two storylets are. The free Persuasive lines say their check *climbs with the Intensity you have
  built* rather than naming a difficulty.
  **The Sacroboscan Calendar** (`sacroboscan`, `SC_OPTIONS`): twelve weekly events, six under Whim and
  six under Fancy, badged with their cycle and slot and how many rewards exist **only** there — the
  guide is plain that none of it is profitable, so counting the uniques is the honest badge. Seven
  events have a different title for a return visit, carried as aliases. One source disagreement is
  recorded rather than resolved: the wiki's *Reconstruct the Museum of Prelapsarian History* page says
  Whim 3 while the guide and the Fancy quality page say Fancy 3, and the row carries `guide`.
  **Parabolan War** (`parabolan-war`, `PW_OPTIONS`, `PW_STRICT`): the Dolorous Pavilion. A cause shows
  its stages, both endings and what it does to Parabolan Dominance; a piece of the Company shows which
  way it leans (Oneironaut or Cultivator, which is all those choices do); and each of the eighteen
  Ravages options shows what it clears, in how many actions, at how many Echoes a Ravage — with the
  item's own price carried so the suite can recompute the rate. **The campaign trail itself is
  deliberately not badged**: the guide describes it by action TYPE (safe 1 Advance! an action, morale
  1.67, fast 3, Airs 4, skills 2) and never names the options, so those rates live in the rules line.
  *A Visitor* is two ordinary words, so it is `strict` on a greeting saying the Dolorous Pavilion.
  **A Cub's Education** (`cubs-education`, `CE_OPTIONS`, `CE_NOT_CATS`): the four rewards by band of
  cats introduced, and 22 introductions each marked as counting once and whether it costs Fate. The
  guide's list of felines that do NOT count — Ministers, tigresses, the Panther — is kept in
  `CE_NOT_CATS` and shown on the heading's tooltip, because "why is my cat not here" is the question
  this content raises.
  Three storylets in Parabola offer a *Return to your Base-Camp*, so two of them are filed under the
  wiki's disambiguated titles with the plain one as an alias, the same rule Hunter's Keep follows for
  *Prepare yourself*.

  **The Parabolan Base-Camp** (`parabolan-camp`, `BC_OPTIONS`, `BC_HEADINGS`), added 2026-09-24: what is
  left of Parabola (Guide) once the six above have taken their tables — the walkthrough is prose, so this
  is the storylets it sends you through that none of them covers. Nine storylets: Attend to Your Health,
  Conflagration, Falling apart, Tend a Curious Tree, Leave your Parabolan Base-Camp, the Waswood's *Stay a
  little while*, the Dome's *Occupied*, *The Top of the Dome* and the Realisation card. Card-and-storylet
  markup, **no panel**. An option leads with what it does to **Wounds and Nightmares**, the two menaces
  that fire Falling apart and Conflagration at 8 — the rules line carries the guide's advice (heal Wounds
  only once you have Kataleptic Toxicology; let Nightmares climb while you have no Glasswork) — or with
  what it pays; `▼` marks something used up and `?` a check. **No Glasswork difficulty is ever claimed**:
  the tooltip gives the narrow difficulty and the level that makes it certain, and your Glasswork is
  unreadable. A Fingerkings trade shows the goods, then **Favours: Fingerkings** as the faction part.
  **Headings left unbadged on purpose**: Attend to Your Health, Conflagration and Falling apart (ordinary
  English, and the first is shared with London) and *Stay a little while*, which `sacroboscan` badges;
  their **options** are unique to Parabola and are badged, so the only cost is the heading. Where the wiki
  is silent the row says so — which Tree Season a fertiliser reaches, what the Viscountess conversation
  pays — rather than guess. Three pages under one title are **one row**: *Reach towards the shore* (two
  storylets by Airs) and *Climb the dome itself* (three by Parabolan Dominance), the variants in the note.
  *Recognise an Ophidian Gentleman* is transcribed from a bare wiki page and says so. The Realisation
  card is the feature's one hand badge, through `BC_HAND`; a negative requirement ("not offered if you
  have the Spectacles") is `unless`, not `needs`, so it does not count as a gate.

  **Piracy** (`piracy`, `PIR_OPTIONS`, `PIR_REGIONS`, `PIR_STASH_PORTS`): the two storylets that are
  piracy's own — *Matters Piratical*, the flag and the bounty desk, and *The Citadel within the
  Citadel* at Gaider's Mourn, which is the shop. An exchange badges its price in Stashed Treasure and
  the Respected by the Corsairs it pays (`Candles ×5 · −1,250 · Respected +1`), and the suite checks
  the two agree at 1,250 treasure a change point. Everything on Matters Piratical is a switch rather
  than a payout, so those badges say what the switch does — and that **lowering the colours costs three
  actions** against the one it took to raise them, which is the only number there that can surprise
  you. **It deliberately owns no card name**: *A Message in a Bottle* and *Cornering the (Bounty) at
  Last* are `zee-card-ratings`'s, and the regional plunder, chasing and bounty tables hang off the
  Matters Piratical heading's tooltip instead. `(Bounty)` is in `CAROUSEL_PLACEHOLDER`, because the
  game puts the quarry's name there. The guide's treasure-port table disagrees with the *Directions to
  a Hidden Stash* quality page, and the page wins — `PIR_STASH_PORTS` is its eight levels.

  **Irem** (`irem`, `IRM_OPTIONS`, `IRM_FUTURES`): the Loom, ten futures and the thirty passages
  between them. A passage badges **where it goes and what it spends** (`A Silvered Future · Sinewy
  ×2`), and taking one resets all three Warps. The claim the feature exists for is the derived one: a
  future's own three cards pay only some of the three warps, so eight of the thirty passages can only
  be opened with a card **carried in from elsewhere**, and those are marked `▾ smuggle` while the
  storylet heading counts them (`Bombazine here · 2 of 3 exits need a smuggled warp ▾`). That is
  cross-checked against the guide's suggested roads, which name the same legs in words. *A collapsed
  passageway* is badged `never opens`, because its page says it is ruined for everybody — the guide's
  map leaves it out rather than saying so. One disagreement went the page's way: *Walk around the
  block* is Silken ×1, not the guide's ×2.

  **Khaganian Intrigue** (`khaganian-intrigue`, `KH_OPTIONS`, `KH_AGENTS`, `KH_OPPORTUNITIES`): Khan's
  Heart, its seven quarters, *False-Dawn* and *Begin an intrigue*. A progress option badges the
  Infiltrating a success pays **and the hours it is offered in** (`Infiltrating +10? · Time 1–4`),
  because Current Time in the Khanate is a 12-action clock that moves under you; an intrigue start
  badges the Infiltrating the scheme will need and what it finally pays. Two titles are rewritten by a
  quality and are carried as **aliases, not wildcards**: *Expand your network: Recruit (Agent)* has ten
  (Airs of the Khanate) and *An opportunity: (Opportunity)* eleven (An Opportunity in the Khanate) —
  wildcarding either would let it answer for one of the five other options that begin "An
  opportunity:". Two pages beat the guide: *Direct your network* pays Infiltrating 5 and ten
  Well-Placed Pawns, not the usual ten, and the Crackling Device costs 60 coinage and 3,000 slivers,
  which the guide does not price. Both tooltips also carry the guide's higher A Player of Chess
  recommendations (13 and 12) beside the pages' certainties (12 and 11). *Explore the canals in a
  water-taxi* is two options under one title and is one row that names both.

  **Helicon House** (`helicon-house`, `HH_OPTIONS`, `HH_COMPANIONS`): the evening in Ealing Gardens.
  A badge carries Fitting in at Helicon House, the **Time Remaining window** and whatever shared
  progress quality the option also pays (`Fitting +2? · TR 2+ · Investigating +20`). The eight options
  that **end the visit** lead with `ends the night` before their payout, because three of them are the
  cash-out the whole evening was for and spending one early throws the progress away. Three of the
  guide's rows are one option in game — the wiki's trailing `2` is a disambiguator — so *Listen to the
  compositions* is one row with a `[1, 2]` range, and the Euphonium and practitioners rows are one
  each. *Make polite conversation with (a railway passenger)* is in `CAROUSEL_PLACEHOLDER`.
  *Arrive fashionably late* is also an option of Attending a Party: a **known, safe exception** to the
  one-name-one-table rule, because `carouselRatings` looks an option up only inside the open storylet,
  and the suite pins the pair so it stays known.

  **A Church in the Wild** (`church-in-the-wild`, `CH_OPTIONS`, `CH_PAIRS`): the largest table of pure
  CHOICES in the file — nothing any of it pays is an item. Fifteen storylets each ask you to pick, and
  each pick moves two of six qualities that are compared in three opposed pairs at the Bishop's
  Inspection a dozen actions later; NOTHING on the screen says which. So the badge is
  `Evangelism +1 · Humility +1` and the tooltip names the comparison it decides. *Play wildly* and
  *Play softly* on The Devil's Due are the only rows that move a quality DOWN — all six at once, three
  each way, exact mirrors — so they get the warm brick rather than the setup colour, and the suite
  pins that they mirror. The Patron's storylet is *Selecting a Patron*, not the guide's section title.

  **Law-Hunting** (`law-hunting`, `LH_OPTIONS`, `LH_FORMS`): a chase closes at 55 change points of
  Capturing a Law, and a hunt action pays 6, 4 or 2 depending on whether your form answers the law's —
  so the same chase is ten actions or thirty, and the badge is the band plus the menace a failure
  pays. A form-change badges the form it buys and what it is the answer to. Every option here is
  filed under the wiki's `(Hell's Chagrin)` title with the plain one as an alias, the activity having
  moved to Marigold Station from the 2025 Estival; `(type)` is in `CAROUSEL_PLACEHOLDER`.

  **Moulin Expeditions** (`moulin-expeditions`, `MX_OPTIONS`, `MX_DISCARDS`, `MX_ASSISTANTS`): the
  badge is what an option COSTS, not what it pays — Supplies are fixed when you set out and cap how
  far you can walk, and the guide's whole strategy is never being forced into a three-Supply answer.
  An obstacle moves you whether the check passes or fails, so a failure costs only the menace, which
  is the badge's other half. **The seven discardable cards carry no option rows at all**: the guide
  records what each card pays but never names its options, so they are badged on the heading and the
  tooltip says why. That is the second feature to badge a deck whose option titles it does not have.

  **Writing a Monograph** (`writing-monograph`, `MG_OPTIONS`, `MG_TOPICS`, `MG_BUYERS`): every
  research action pays the same 1,700 pennies for the same 12.50 Echoes of relics, so the Echoes are
  never the choice — the choice is which quality goes up and which goes down, in a circle (Cautionary
  lowers Tragic, Tragic lowers Ironic, Ironic lowers Cautionary) with exactly two exceptions, which
  the badge marks `breaks the circle`. The suite derives that mark from the ring rather than trusting
  the flag. The guide's research table is keyed by ITEM, so its eleven rows are matched to the
  storylet's eleven option titles; ten are exact and *Examine Khaganian Artefacts* is the Rusted
  Stirrup by elimination, which the row says out loud.

  **A Kitchen for Artists** (`kitchen-artists`, `KA_OPTIONS`): two numbers at once. Culinary
  Ingredient Value is what every non-specific sale divides, and Current Culinary Concoction is what
  the dish IS, which is what the specific buyers look at — so a creation step badges both
  (`Value +1,750? · a Shark Bouillabaisse`), because a step worth 350 may be the only way to reach Mr
  Spices. A sale badges its divisor, that being the only way to compare them. *Serve up a Culinary
  Tribute to the Sea of Spines* stays `helicon-house`'s; only the step that MAKES the dish is here,
  and the suite pins both halves of that.

  **Alchemy at Station VIII** (`alchemy-station-viii`, `AS_OPTIONS`): one loop, always five actions —
  take a collection note at the Special Extracts bench, buy a SENTIMENT from Pinnock in London, carry
  it back and EXTRACT it into a REAGENT. Every extraction is the same action and pays exactly one
  item, so the only thing that varies is Pinnock's bill and which reagent you end at: a pickup badges
  `→ Concentrate of Self · 4 stacks of goods ▼` and an extraction badges the reagent alone. **The bill
  is counted in stacks of goods, never in Echoes** — the guide prices exactly one of the six lines, so
  an Echo figure would be invented; the items themselves are in the tooltip. `once: null` on the
  Concentrate of Self is the guide's "None" and is a different claim from a missing field, which the
  suite pins. The sentiment is not the reagent: the daughter-church at Station VIII wants the
  sentiment itself, and that warning rides on the extraction's tooltip.

  **Following up Rumours of Cornelius** (`cornelius`, `CN_OPTIONS`): a one-way ladder, so the badge is
  **the level a rung leaves the quality at** (`Cornelius → 2 ? · needs Investigating... 5`) rather than
  the Whispered Hints every rung pays alike. The deciphering rung is the exception and says so
  differently (`Cornelius +1 to 8`), because it is a cap rather than a jump. *Appoint Cornelius in
  Furnace's place* takes a suffix from the hidden Bridge Troubles quality — "– until you find someone
  better" at 2, "– until the moment you recover Furnace" at 3 — and both are aliases; without them the
  most important line in the guide goes unbadged for most players. **The second feature to badge the
  Board's Convene storylet**: `railway-board` owns its members and counters, this one owns the two
  options about Furnace's empty chair, and the suite pins that they share the heading and no option.

  **The Tale of the Clay Highwayman** (`clay-highwayman`, `CHW_OPTIONS`): five qualities carry this
  story and a bare "+1" means something different on nearly every card, so the badge says **which one
  moves**. A change point, a level and a quality being SET are three separate claims and the table
  carries a `unit` beside every number to keep them apart (`On the Trail +1 CP`,
  `A Marauder of the Clay Highwayman −2`, `Waiting on a Ransom → 8`, `The Tale → 6`). On the Trail
  renames the card twice — *Investigating the Clay Highwayman*, then *The Clay Highwayman's Fate* — so
  both are aliases. **The second feature in the camp**: `disappearing` owns the storylets about
  walking out and this one those about the story, and the suite pins that they share no storylet at
  all. The five larceny cards carry no option rows — the guide gives their four rungs as a pattern and
  never names them — so the whole ladder is on each card's own heading instead.

  **Hurling** (`hurling`, `HR_CARDS`, `HR_OPTIONS`): the goat-demons play, you bet 15 Hinterland Scrip
  on which circle will LOSE, and nine levels of Hurlyburly are spent shoving Goat vs Goat about.
  **Two kinds of claim live here and they are separate fields**: `gvg` is an absolute change, where +
  helps the Second Circle win, and `favour` is a change in favour of the bet you placed. On a
  First-Circle bet the two agree and on a Second-Circle bet they are opposites, so folding them into
  one signed number would be confidently wrong half the time; the badge reads `GvG +6-9` for one and
  `GvG 7-9 your way` for the other, and a favour figure never carries a sign. A line whose failure
  adds a Foul! says `+ Foul` in words, five of them being what undoes the work. The Heptagoat's swing
  is `null` and badges `GvG: not recorded`. It deals its own deck, so it badges the hand too, and the
  four card names that are ordinary English (*Make Way!*, *Uncooperative*, *Frozen*) wait for a
  confirmed Adulterine Castle greeting. Five figures went the option page's way against the guide, and
  they are listed in the feature's comment.

  **Chthonic Communication** (`chthonic-communication`, `CCM_MINDS`, `CCM_OPTIONS`): three minds and
  the same four-rung climb up each. Every one of the thirty-odd options is the identical trade — The
  Mind's Ascent +1 CP on a success, Nightmares +2 CP on a failure, nothing else either way — so the
  only question the screen asks is *which of these three or four qualities do I have*, and the badge
  answers it: `The Mind's Ascent +1 CP ? · Kataleptic Toxicology 10 · fail Nightmares +2 CP`. The
  reward is on the badge as well as the check, or it would read as a price with nothing bought. Every
  check is 10 except the second tier's Steward of the Discordance 4, which is on all three minds and
  is the one piece of advice the numbers contain; the suite pins that the tiers offer the same
  qualities on all three. Most rungs are LOCKED at Nightmares 8, so a failure walks you out of the
  activity, which is on the rules line.

  **Digging in the Hurlers** (`digging-hurlers`, `DH_OPTIONS`): the curios are the **failure** reward,
  and the guide's advice is to wear Watchful-reducing gear and fail on purpose — so a dig badges
  `Curio ×9 on a FAIL · 3.0 per Intuition ?` and the "success" is the consolation prize in the
  tooltip. The rate is curios per point of Frigid Intuition, which is what makes the four Watchful
  sites comparable; the Hot Spring is a Luck 50% and its better 4.0–5.0 is marked `cannot be steered`
  so it does not read as a better plan, and the Salt Steppes line costs no Intuition at all and is
  given no rate rather than a division by zero. **The difficulty is carried as the formula** 50 ×
  Hurlers: Darkness, not as the 150 the option pages happen to show, which is that formula at Darkness
  3 and is explained as such. Preparation badges both the Intuition bought and the Echoes spent,
  because the action is the scarce thing and the Echo price is the constraint.

  **Marigold Station** (`marigold-station`, `MR_FATES`, `MR_OPTIONS`): the emblem loop is three
  actions and The Marigold Bearer's Fate, rolled 1–3 when you take the commission, decides everything
  after it — which pair of recovery lines you see and which item the surrender pays. The Fate is
  invisible on the option itself, so the badge puts it first: `Fate 2 · Watchful 200 ? → a Cave-Aged
  Code of Honour`. Each Fate's pair is two rows, not one, because spending a Memory of a Much Lesser
  Self and risking a broad 200 are different offers. The three options titled *Surrender the Marigold
  Emblem* are one row naming all three payouts. The Gnarled Stationmaster and the Cerise Condottiere
  run the same loop and both are in the table. *Approach Hell's Walls* is a ladder rather than a
  gamble — its failure pays 50 of the quality it checks — and the badge says so. **One name is shared
  with another feature on purpose**: Helicon House's Prussian Salon also has an *Accept a commission*,
  the two sit under different storylets, and the suite pins that it is the only one.

  **The Airs of London** (`airs-of-london`, `AOL_OPTIONS`, `AOL_DREAMS`, `AOL_PRICE`): six London
  storylets whose options are gated on a randomiser the Myself tab never shows — Opportunism in
  Spite, Life on Ladybones Road, Business on Watchmaker’s Hill, Dabble in the Great Game, Working for
  the Widow and the Honey-Dens. **It is two layers.** Twelve of the gated options are *redirects*:
  they cost no action and open a storylet of their own (*Confound the Constables*, *Lady seeks
  bodyguard*, …), and the options that do the work are in there. Both layers are in one table, the
  inner ones with `airs: null` and filed under the storylet they open; the redirect shows its best
  line inside, worded “best”, and only where that line is priced. The badge is Echoes per action at
  the item pages’ **sell** price of what a success gives less what it spends, then any quality it
  moves, then every faction result (`0.36 E? · Connected: The Widow +10`). A range pays its middle;
  the one Luck option (*Sneak a sip of the brandy*, `LuckChallenge 30`, read as 30%) is its expected
  value, marked `≈`; a rare success is in the tooltip and **not** in the number, since no page gives
  its odds; a random bundle (the ring fight, the Fisher-Kings) is marked, not priced. **The trap:**
  the Honey-Dens’ six dreams are six options under ONE title, told apart only by the Airs window, so
  they carry one label and the tooltip lists all six — with the gross per action, since the honey
  they cost scales with your Connoisseur level. Memory of Light and Vision of the Surface are
  Cross-economy and left unpriced. `(gendertitle)` joined `CAROUSEL_PLACEHOLDER`. Deferred, each a
  carousel of its own: Unfinished Business ×4 (Duelling the Black Ribbon and Hunting Dangerous Prey
  went to `running-battle` and `the-hunt-is-on`, below); and the options that only *re-roll* Airs
  without being gated on it (*Sample prisoner’s honey*).
  **Not done: reading the current Airs.** Fallen London shows it only in an unlock tooltip whose
  markup has never been captured; `aolAirsFrom` parses the text and nothing calls it.

  **Progress qualities: The Hunt is On! and Running Battle** (`the-hunt-is-on`, `THIO_OPTIONS`,
  `running-battle`, `RUNB_OPTIONS`, both on the shared `pq*` helper): the first two features from the
  TODO's Reference guides. A progress quality is raised on some options and spent on others, in
  different storylines and areas, and every source is interchangeable, so both features use ONE
  vocabulary that later ones (Casing, Fascinating, Investigating) reuse: a gain reads
  `THiO +3? −1` (the quality a success makes, the one a failure takes back), a spend
  `THiO 5 ▼ → Jade 938? −5` (the level it needs, ▼ for “uses it up”, what it pays), then any other
  quality it moves (`APoSB +3`, `FD +4`). The guide’s Echoes per action are in the tooltip and never on the
  badge: they are the guide’s arithmetic on its own figures, and where the option pages have moved
  on they no longer agree with it. Every spend is a **narrow** challenge on the level you hold,
  certain four above its difficulty, and a success takes all of the quality back to 0. **The guide for
  Running Battle is marked Outdated** (the March 2024 MYN rework), so the option pages are followed and
  each disagreement is carried as `guide` (Feducci, Vendrick’s failure, the Big Rat’s ambush); THiO
  carries four (the safari’s Jade, the brigands’ Shriek and level, the kidnap’s Shriek, the live
  goat-demon’s Procurer). *Hunting Dangerous Prey* and *Duelling the Black Ribbon* are the two Airs
  storylets the Airs feature deferred: their windows are in the tooltips and neither lists re-rolling
  Airs except the duelling gains. Duelling is headed *Making your Name: Duelling the Black Ribbon*
  until A Name Scrawled in Blood 5 and the two headings are one storylet through `aliases`. Its
  windows start at 1, so Airs 0 offers only *Practise quietly*. The cards (*The tomb-colonist’s dogs*,
  *Cutthroats and Canalmen*) badge the hand and the opened heading once, through `eachCardName`, and
  their options through the same pass as a storylet’s. Left out: Breeding Monsters, the later coils,
  the Firmament card’s two THiO-less options, the Big Rat’s other story (its own guide, *Seeking the
  Meaning of the Plaster Face*, is in the TODO) and *Purchase some assistance with Casing...*.

  **Casing** (`casing`, `CASING_OPTIONS`, on the same `pq*` helper): Casing... is raised in Spite
  (area-diving), on the Topsy King's paintings and in the Big Score prelude in the Flit, and by scouting
  parties on the Clay Highwayman's larceny cards, and spent on the robberies. Two kinds of spend, kept
  apart in the badge: a **robbery** is a narrow challenge on the level you hold and takes all of it
  (`Casing 5 ▼ → Glim, Jade, Pearls, Rostygold ×100? −5 · MT +2`), and a **fixed-price** spend takes a set
  number of CP and leaves the rest (`Casing −6 ▼ → Pearls ×260`; the thefts of particular character
  `Casing −32 ▼ → Tale of Terror ×25? · fail −51`, which pays even on a failure). The prelude's gains cost
  three actions (five for the three that pay 16–18), which the badge says (`Casing +9? · 3 actions`);
  the guide’s 3, 3.2 and 3.6 CP per action are the win over the actions, and the tooltip gives them. **The guide is
  marked as needing work** (the 2024 MYN rework), so the pages are followed and six disagreements carried
  (three failure Suspicions in the prelude, two Master Thief figures, and Bringing Revolution!’s extra
  requirement); the guide’s Echoes for each robbery are tooltip text, never a figure on a badge. **The
  five larceny cards are shared with `clay-highwayman`**: that feature badges the card’s heading and this one
  the options inside (its tooltip used to say nothing inside was badged, because the guide named no
  options; the pages do), and *Join a scouting party* is one title on four cards, told apart by the open
  card. A scouting party’s difficulty is Shadowy 300 *at Darkness 0* and eases as the area darkens, so the
  tooltip says that rather than a certain point. Left out: the Grand Larceny rewards (Cover Identities),
  the prelude’s heist options (On a Heist), Risen Burgundy’s two cards, Parabola’s
  *Find the weakness in an opponent’s defences*, and the Big Rat’s purchase of Casing.

  **Fascinating... and Inspired...** (`fascinating`, `FAS_OPTIONS`, `inspired`, `INSP_OPTIONS`, both on
  the `pq*` helper): the two Persuasive progress qualities. Fascinating is raised at court (*Attend to
  Matters of Allure*) and on the Name Signed with a Flourish seductions, and spent on the seductions’
  resolutions, the three **court romances** and the Tattooed Courier’s secrets; Inspired on the
  commissions (fungus verse, prisoner’s honey, Jack-of-Smiles, the Royal Portrait) and a few one-offs.
  **A court romance is a ladder, not one option**: each of Barbed Wit, Acclaimed Beauty and Unattainable
  Fashion-Flies has a way in, a storylet for each of levels 1 to 5 (two or three options each) and an
  ending, and every step is a narrow challenge on Fascinating 6 that takes all of it, raises “Seen with”
  that romance and sometimes pushes a rival back: `Fasc 6 ▼ → Wit +2? −6 · Beauty −1`. The three
  “Seen with” qualities are `Wit`, `Beauty` and `Flies`; an amount the page does not give is `↑`. **The
  guide files the Rising Artist’s and the Rising Artist’s Model’s last two options under each other**: the
  pages, which say which quality each loses, are followed and the guide’s row is carried. Six more
  disagreements are carried as `guide` (three narrow difficulties, two levels, one gain), and four options
  are the guide’s alone because their pages are empty. The servantry is a fixed price on a wider challenge
  (`Fasc −6 ▼ → …`), the Ambassador’s Ball’s two options are what the card page says rather than the
  guide’s “Commission a painting”. **Madame Shoshana’s tent is shared**: it holds a Fascinating option, an
  Inspired one and (later) an Investigating one, and the heading badge is Fascinating’s alone (`noHeading`).
  Left out: the seductions’ mid-affair steps (the guide lists none), Helicon House and the Clay Highwayman, Seduce
  an Alluring Masquer, A Visit’s Commission a painting (its page names no card), the empress court’s
  writing, and Oneiropomp’s inspiration.

  **Investigating...** (`investigating`, `INV_OPTIONS`, `INV_CARDS`, on the `pq*` helper): raised by the
  Melancholy Curate’s storyline (six gain storylets that each show only at a band of the quality — below 7,
  3–8, 7–20, 8–14, 10–20, 14 — and an ending of three narrow spends of 18), the University’s six
  investigations (Watchful 98 to 108, rising by two; the department one is the `(department)`
  placeholder), ten opportunity cards in London and the Upper River, and a few one-offs; spent on the
  Curate’s ending, the Correspondence Stones, the Scheme of a Phoenix, the Helicon House tour and the
  Tracklayers’ crime card. A spend is either a narrow challenge that takes all of it or a **fixed price**
  (`Inv −15 ▼ → …`). **Belongs elsewhere and not repeated here:** the Heights of Chicanery
  (`wars-of-illusion`), Cornelius, Helicon House’s doors, the Clay Highwayman’s trail and camp cards
  (`clay-highwayman`, `disappearing`), the University’s Featuring steps, and the pre-July Porters trade.
  **Shared storylets:** Madame Shoshana’s tent, *Read incoming mail* and *Attend to the Dreamer* are each
  headed by another feature (Fascinating, nobody, Oneiropomp) and this one badges only its own option
  inside (`noHeading`). Seven disagreements with the guide are carried (Up the back stairs’ challenge,
  the three Curate endings’ difficulties, the forensic failure, the Tracklayers’ Prosperity, the
  Shoshana gain). The Phoenix option whose cost depends on a Twilit Smuggler is one label saying both, since the game shows
  both pages under one title. The card *A new piece in the Game* also raises Seeking..., which is its
  `x`, so the Seeking guide’s one open item is done here. Not done for Seeking: *Making Your Name: Find a
  Tattooed Courier’s contact*.

  **Someone Is Coming** (`someone-is-coming`, `SIC_OPTIONS`, `SIC_CARDS`, on the `pq*` helper): a counter
  that a great many opportunity cards raise by **exactly 1 CP**, and that *A Gift from the Capering
  Relicker* cashes in. So the figure that varies is the **profit**, and the badge names it:
  `SiC +1? · Brass ×180 · Secret ×2`; a card in the hand says just `SiC +1`. **The payouts are fixed
  prices**, not resets: the card is dealt at once at level 4 and each of its eight payouts takes 21 CP
  (`SiC −21 ▼ → Shriek ×275`), the guide’s Echoes per action (0.50 up to 2.00 for the Bone Fragments) in the
  tooltip; the drunk rat in *Rob a drunk* is the cheap cash-out at 6 CP, level 3. The guide lists only the profit
  per card, not which option pays it: every option here is one whose own page says
  “GAIN Someone Is Coming +1 CP”. **Traps:** a failure often still gives the quirks and the profit but not the
  counter (Attend the ceremony, the Old Friend cards), and a few Luck options raise it either way
  (the weasel tournament, `fail +1`); the two zee cards (*A Huge Terrible Beast of the Unterzee!*, *Creaking
  from Above*) keep the Zailing feature’s heading badge and only their option is badged here (`noHeading`), as do
  *Rob a drunk* and the oracle. Left out: the thirteen Conflict Cards (each wants two Favours; the guide gives
  only a rate), cards that raise it but are not in the guide’s table, and the other options of these cards.

  **Hellworm** (`hellworm`, `HW_OPTIONS`, on the `pq*` helper; WP-7, the first of the carousels filed as
  reference): one card, *Your Very Own Hellworm*, in the Upper River deck once a Miniature Hellworm is equipped.
  Its options raise The Disposition of your Hellworm (`Disp +1 · Nightmares −1–8` playing, `Disp +1–2 · Scandal
  +1 · Aeolian Scream ×2` riding, which needs the saddle) and *Milk your hellworm* takes all 7 back for one of 33
  rewards (`Disp 7 ▼ → one of 33 rewards`); three Scrip purchases (saddle, boots, a polish that does nothing) are
  labels with the price. **No panel, by decision**: the guide’s 33-row milking table and its cash-out paths are
  not carried, only the 10.03 and 15.54 Echoes per action and the 80.26 average in the tooltips. The guide gives
  Nightmares −1 to −7 where the page says −1 to −8, and omits the Kataleptic Toxicology 5 that milking needs;
  both are carried.

  **Risen Burgundy** (`risen-burgundy`, `RBG_OPTIONS`, `RBG_CARDS`, on the `pq*` helper; WP-7, no panel by
  decision): the Firmament city, played through the opportunity deck alone, so every carousel is a set of
  **cards** — 25 badged, about 75 options. Covered: the hunt (*Whoso List to Hunt*, *Hunting the (Roof Prey)*,
  *Attend the revels*), a Saint’s Day (the start, four progress cards of two options, two conflict cards, two
  payouts), the Gall-Eyed Weaver, the Poet-Thief pair (a sack or a hat, and the two autoplay cards each summons),
  *Heralds from Elsewhere* (a six-step ladder), the two payout cards at 10 of Burgundian Beneficence or Against
  Time and Kings, the Casing and Fascinating spends the earlier packages left for here (*Case a lesser keep*,
  *Steal from the Gravensteen itself*, *Seduce an Alluring Masquer*), and the weekly and monthly cards. **Each
  option names its own quality** (`q` on the entry, added to the shared helper) because a card game moves
  several: `Saint +1? · fail +1`, `BB −10 ▼ → Captivating Ballad`, `Casing −36 ▼ → Venom-Ruby ×10 · …`. **Traps:**
  the Weaver’s four cards share ONE option title, so it is one entry whose tooltip lists all four Visions (the
  guide’s totals check exactly against the pages: 5 × 4, 1 × 3, 2 × 4, 27 × 2); *Conclude your business* and *Make a
  run for it* are options of two cards each; the hunting card is named after its quarry, so `(Roof Prey)` joined
  `CAROUSEL_PLACEHOLDER` and card names now match through `carouselMatcher`. **Left out:** the eighteen steeds on
  *Whoso List to Hunt* (the guide says the prey is narrative and the challenges do not depend on the steed), the
  Weaver’s investments and shop, the Ducal Mint (its card has no page). Almost every option re-rolls the Airs of
  Burgundy, said in the tooltip.

  **The rest of the Risen Burgundy deck** (added 2026-09-27, `RBG_MORE`, `RBG_MORE_CARDS`, same feature): 36 more
  cards and 109 options, the ones the guide only points at: the seven dreams (autoplay: `Nightmares +3 · Having
  Recurring Dreams: Pale for Weariness (set)`), the Ducal-court and Firmament-story cards, and the cards that raise
  Beneficence or Against Time and Kings by 1. They are badged the way the menace places are: what the option does,
  the counters first (`BB +1`, `ATK +1`), then what else it moves, what it costs (`−ATK ×2`) and what a failure does,
  and a card in the hand says which counters it can raise (`BB/ATK +1`) or how many options it has. A trade of one
  counter for the other (*A Disturbance at the Market*) reads `Scandal +3 · BB +1 · −ATK ×2`. **Traps:** the wiki’s
  three variants of *Attend the Gravensteen gracefully* are one option; *Firmament: To be Feasted* is found under its
  bare title; *The Honours of the Court* is Fascinating’s card (it keeps that badge, only its other three options are
  here) and *Cutthroats and Canalmen* The Hunt Is On!’s (its other two options are here). **Left out:** the
  eighteen steeds, the Weaver’s investments and shop, the Ducal Mint, and *The Sound of Wings (Burgundy)*, whose
  title Zailing’s card shares.

  **Plaster Face** (`plaster-face`, `PF_OPTIONS`, on the `pq*` helper; no panel by decision): Seeking the Meaning of the
  Plaster Face (Guide), the Big Rat story in the Flit. 67 options, 4 cards. It runs on Seeking the Meaning of the
  Plaster Face (`Plaster`, 0 to 20), Having Rodentine Minions Investigate... (`HRMI`, 5 to move on), Serenity of the
  Plaster Face (the higher, the easier for the rats), Sympathetic about Ratly Concerns (`SaRC`) and the optional
  prelude quality (`Inv`). **The badge** is what the option does to them, in the other progress features’
  vocabulary: `HRMI +3 (60%) · fail Serenity −4`, `Plaster → 6? · fail Serenity +10`, `Plaster → 20 · SaRC +3 ·
  Piece of Rostygold ×2000`. `Plaster → N` is the level the step sets, worked out from the storylet that follows (the
  pages say only “sets”); a test checks that every level from 0 to 9 has a step and the endings set 15 or 20. The
  tooltip has the page’s warning (a failed rat is lost), the requirement and the guide’s advice (the Bandit is
  quickest, then the Disgraced, then the Talker, and the Talker is the cheap one). **Guide against pages:** *Who
  Controls the Face?* asks a narrow Serenity 6 where the guide says 7, and every ending pays 1 Fate in the guide where
  the page lists none. **Left out:** what Running Battle owns (the five options of *Gather your forces against the Big
  Rat*, the purchase in the Alliance, the two Ambush options). The step order comes from the storylets’ own unlock
  levels on the quality’s wiki page.

  **Station Developments** (`station-developments`, `SD_OPTIONS`, on the `pq*` helper; WP-7, no panel by
  decision): the Upper River stations built up with Hinterland Scrip, and the repeatable conversions each
  development unlocks. About 95 options in 30 storylets: the eight Offices of the Tracklayer’s Union branches
  (Ealing Gardens, Jericho, Evenlode for the Magistracy, Balmoral, Station VIII, Burrow-Infra-Mump, Moulin, the
  Hurlers), *Visit your Library*, *Entice Purchasers*, *Licensed by Mr Stones*, *The Museum of Souls*, *God’s
  Editors at Burrow-Infra-Mump*, *Spa Services*, the Ealing chapel, clinic, lounge and pie stand, and the carriage.
  The badge is what the option takes and what it gives, `Curio ×5 → Scrip ×25`, `Scrip 50×(n+1) → Library 1`;
  `n` is the station’s developments so far (the tenth improvement costs 500, ten cost 2,750), said in the
  tooltip beside the full price, what it needs and the Charter halvings. A heading says how many options it holds.
  Entries are `sd(storylet, name, give, get, note)`; `label` and `title` are built from them once. **Traps:** the
  pages of *Improve your canteen*, *Construct an Archaeological Institute*, *Improve the Diving Bell*, *Further
  expand your Cabinet Noir* and *Trade rumours with the Calculating Lapidary* are two pages under one title (the
  game shows the one you qualify for), so each is ONE entry and the tooltip says so; the wiki’s ` 2` suffix is
  not part of the title. **Guessed:** an improvement whose page names no storylet is filed under its station’s
  Offices branch, and the Ealing Gardens conversions the pages do not place are left out rather than guessed.
  **Left out:** 22 conversions whose pages name no storylet (the Ealing butchery, Postal and Notary Office and
  Sapphire options, the Hurlers’ hot spring and Sapphire), the Larceny options (the Casing feature), Marigold’s
  statue (the statue package), the Watchtower refresh on a card that carries two names, and the *Location-specific
  cards in the Hinterlands* guide, a matrix of which card is dealt at which station that carries no option a
  badge could sit on.

  **City of the Tracklayers** (`city-of-the-tracklayers`, `TLC_OPTIONS`, `TLC_CARD_LIST`, on the `pq*` helper;
  WP-7, no panel by decision): the location the railway builds for the tracklayers, whose deck of 62 cards is
  where nearly all of its play is. 207 options are badged. Almost every card has an option that pays Hinterland
  Prosperity (HP, a Penny each): 200 or 220 plus Hinterland Efficiency (0 to 300), the 220 ones behind a double
  check. The city also keeps The City Waning (cards shut off at 8) and Tracklayers’ Displeasure, which only bad
  news raises. **The badge** reads `HP (220+Eff)? · Waning −2 · fail Displ +2`; a cash-out reads `HP −(1050−Eff) ▼
  → Puzzling Map ×1`; the three betrayals `HP all ▼ → Journal of Infamy (HP ÷ 50) · Waning +36 · Efficiency → 0`.
  `Eff` is your Efficiency, which is not read. A card in the hand says the most it pays (`HP up to (220+Eff)`) or
  `cash-out ▼`. The guide’s table of decisions gives the value that makes a challenge certain, and 35 options carry
  it in the tooltip; a test checks each against its page (a broad challenge at five thirds of its difficulty, as
  everywhere, but a NARROW one at five above where the rest of this script says four — a difference nobody has
  settled in the game, and the tooltip quotes the guide). **Traps:** the wiki disambiguates with brackets the game
  does not show (*Whitsun (The City of the Tracklayers)*, *The Sound of Wings (Tracklayers’ City)*: `also` on the card),
  and several titles are placeholders, so twelve entries joined `CAROUSEL_PLACEHOLDER` (`(the City)`, `(Pub)`,
  `(Inhabitant)`, `(Chosen Site)`, `(Alignment)`, `(loved one)`, the three ideologies, and three leader-card
  phrases); options that come in variants for the state of your city (*Help interpret Hinterland fossils*, the two
  *Greet the Merry Gentleman* pages) are one entry with the range said in the tooltip; the seven *Imports and
  Exports* options cost 1000 or 1050 minus Efficiency by the city’s site. *Officially Non-Criminal* is Investigating’s
  card: it gets no card or heading badge here (`noHand`, `noHeading`) and *Solve Tracklayers’ City crime* stays there,
  but its cash-outs and the three betrayals are badged here. **Left out:** the four Fate-locked vignettes and their
  eight cards (the guide tabulates them by picture and the wiki has no page for the cards or their options, so no
  title exists to match), the storylets of the Scheme of a Phoenix and Exploration of a Hinterland City, and the
  cards that only announce something. Eight generic card names (*Poise*, *Compromise*, *Negation*, *Apolitical*,
  *Drained*, *Day of Rest*, *Each Their Own*, *(Hinterland City Streets)*) are not badged in the hand, in case the
  game deals a card of the same name elsewhere; their options are badged when the card is open.

  **Station Statues** (`station-statues`, `ST_OPTIONS`, on the `pq*` helper; WP-8, no panel by decision): the
  statue each station can have, and the options its *Under the Statue* card then offers. 53 statues (Ealing Gardens
  6, Jericho 4, the Magistracy 3, Balmoral 3, Station VIII 14, Burrow-Infra-Mump 5, Moulin 4, the Hurlers 8,
  Marigold 6) and about 55 card options. On the option that **builds** a statue the badge is the guide’s 1 to 4
  rating and what the statue does, `rated 3/4 · Urchins ×4 → 28.5 E` (a rating the guide gives as a range reads
  `2–3/4`; the digits carry it, not a colour). On an option of the **card** it is what the option takes and gives,
  `Urchins ×4 ▼ → Puzzle-Damask Scrap ×1 +2 more`, and the tooltip names the statue, its rating and the guide’s
  Echo value. The card shows only the options of the statue you built, so there is never more than one such badge
  and the script does not need to read which statue it is (an unread statue is not a case). The statues are built
  from the Offices branches of Station Developments (Ealing, Jericho, the Evenlode, Balmoral, Burrow, Moulin), from
  *A Selection of Statues* (Station VIII), *Commissioning a Statue* (the Hurlers) and *Consider building a statue at
  Marigold Station*; the Offices headings keep Station Developments’ count (`noHeading`) and the other three say
  `statues`. **Traps:** the Ealing card is called just *Under the Statue*; *Practice sketching the Statue to
  (subject)* is on every card and `(subject)` and `(Subject)` joined `CAROUSEL_PLACEHOLDER`; the two Jericho Church
  statues share the title *Call in favours from the Church*, so they are one entry; *Have this statue removed* is
  the game’s wording where the Hurlers page says melted and each page appends its Fate cost (3 at Station VIII, 10
  elsewhere). **Left out:** Balmoral has no card, so its three statues are labelled and not weighed, and Station
  VIII’s fourteen are cosmetic; the Marigold card’s all-statues and self-statue options (*Meet with a Statuesque
  Deviless*, *Share a honey-dream*, *Reclaim the Inescapable Ubiquity*); the guide’s analysis text and its
  cross-reference table of Favours by type. The economy panel the plan once held (Roof Economy, Stuiver Grinding, the
  statue table) is NOT built, and those two guides stay open in TODO with no badge surface.

  **Menace Locations** (`menace-locations`, `ML_OPTIONS`, `ML_CARD_LIST`, on the `pq*` helper; WP-9, no panel by
  decision): the five places you are sent to when Wounds, Scandal, Suspicion or Nightmares reaches 8 (a slow boat
  passing a dark beach on a silent river, the Tomb-Colonies in disgrace, New Newgate Prison again, a state of some
  confusion and the Mirror-Marches; Nightmares has two). 242 options, 118 cards (49 of them red cards that play
  for no action). **The badge** is the change to the location's menace, first and signed, lower being better,
  then what else the option moves and what a failure does: `Scandal −2 · Austere +3 · Hedonist −3`, `Nightmares
  −1? · Watchful −4 · fail Nightmares −3`. A Luck option is worked out from its two outcomes and marked `≈`
  (`Suspicion ≈−0.5`, `Scandal ≈−4.9`, the figures the guide gives); one whose failure the page does not give
  shows its odds. Teal cuts the menace, brick raises it, grey does neither, and the sign says the same without
  the colour. A red card in the hand shows its one effect, a white one `best Scandal −6`, and a storylet's heading
  the same. The guide's remarks (a challenge you want to FAIL, the 63% rule for chess, the cards to avoid) are in
  the tooltips. **The card badge is confirm-only:** the decks are full of ordinary names (*The Governor*,
  *Remnants*), so a card in the hand is badged only while the greeting (`currentArea`) names its place; the
  options inside an open card are scoped by that card and need no greeting. **Traps:** the wiki numbers pages
  that the game shows under one title (*A white cat! 1* and *2*, *The view from your room 1* to *3*), so a
  trailing numeral is dropped and two pages that share a title AND an option are one entry with `alt` (the badge
  gives both); *Play Chess with the Boatman* is eight options of different levels of The Boatman's Opponent, and
  each is its own entry; the shared helper gained an optional `color` on an entry and on a card, because the
  colour here depends on the direction, not the kind. **Left out:** the *Conflagration* storylet (Parabola's own
  way out of Nightmares), the ambition-story storylets that only happen to be set in these places, and
  *Offer the Boatman a sacrifice*, whose page lists no option.

  **Iron Republic** (`iron-republic`, `IR_OPTIONS`, on the `pq*` helper; WP-10 part 1, no panel by decision): the
  Iron Republic Streets are a graph of days, each Day storylet with one to three options that lead on to another
  day until Day 99 lets you out through *A Day for Reading*. 34 Day options plus the eight of the way out, and
  *Open the gate*. **The badge is the destination:** `→ Day 12? · Wounds +5 · Scandal +2 · fail → Day 8 ·
  Nightmares +3, Suspicion +3`; `set to 3` is the guide’s wording for a menace a day pins to a level, where the page
  shows a bare gain; `back → Day 8` is the one door that goes back. A Day heading names the days its doors lead to
  (`→ 42 / 48 / 51 / 55`). The Changed by the Iron Republic each step adds is in the tooltip, with what the guide
  prints in bold as of particular interest. A test walks the graph: every door leads to a day that exists, every
  day is reachable from Day 1 and reaches Day 99, and the guide’s 34 table rows match the entries door for door.
  **The guide** is marked needing work and the option pages win; the tooltips quote it where they differ (the
  challenge of *Municipal amenities*, *Talk them down*, *A lucky number* and the Revolutionaries favour is one
  off, *An exchange of knowledge* adds Nightmares +2). **Traps:** Day 81 is filed by the wiki under its bare title,
  so it has an alias. **Left out:** *Take this demagogue for tea and muffins* (its page is empty), the Nemesis
  ambition’s extra storylets, and the day titled CENSORED, which the guide keeps as a spoiler.

  **Firmament** (`firmament`, `FIR_OPTIONS`, on the `pq*` helper; WP-10 part 2, no panel by decision, spoilers on
  purpose): the nine-part Roof story, played once, whose choices set qualities that later parts read. The badge is
  what the option sets **in the guide’s own words**: `+Duchess 1 · Tyranny =3` (`+` gives, `−` takes, `=` sets, `→`
  raises to), `Vulgatis =2`, `+Flammier`, `no reputation change`, `narrative only`. The crew’s favour qualities are
  abbreviated (Duchess, Dawnseeker, Shepherd, Summer, Valentine, Service). A `⚠` marks the lines the guide itself is
  unsure of (“needs confirmed”, “appears to”, a hidden quality) and the tooltip says the story can be played only once.
  158 options, all nine parts and the prologue. **How it was built:** a link in the guide counts only when its wiki
  page is an option (it has a *From* storylet or card) AND the guide says what it does; the guide’s sentence is the
  tooltip. Effect clauses were compressed by a script and then hand-corrected (the overrides are the labels in the
  table). **Traps:** the wiki files some storylets as *Firmament: A Choice of Commissions*, so the storylet keeps the
  prefix and an alias function finds it under the game’s bare heading; where two options share a title the guide’s
  display text is the game title, not the page title. **Left out:** the options the guide only names as steps
  (*Enter the catacombs*, *Look for the Performer*), the requirement lists that open each part, the tables of
  endings (Immanence, the Victor in Burgundy, which turn on qualities rather than options), and the parts other
  guides own (the Stacks, Ecdysis, the Kinetoculus, the High Sancta, Risen Burgundy, the Sous Catacombs, the
  Midnight Trade, Upon a Red Stage), all still open in TODO.

  **Discordant Studies** (`discordant-studies`, `HS_OPTIONS`, on the `pq*` helper; WP-10 part 3, no panel by decision,
  spoilers on purpose): The Hurlers (Guide), Discordant Studies - Costs and Rewards and Deeper Discordant Studies,
  the road from the Encampment to Steward of the Discordance 10. **The badge** is what the option raises, to which
  level, in the guide’s order of play: `Knowledge → 2 · Cold Comfort → 5`, `Trust → 0` for the Steward’s Trust it
  spends. A test walks it: Crystalline Knowledge climbs 1 to 6 and Cold Comfort 3 to 7 in step order, each step
  needing the level below it. The tooltip has the step number, the requirements and the guide’s remarks; on the four
  options of Deeper Discordant Studies it carries the guide’s tiers **in its order, Hint 1, Hint 2, then the
  answer**, so a reader can stop after the hint, and the first deep step carries the Costs and Rewards guide’s
  figures. 19 options. **Traps:** the wiki numbers pages the game shows under one title (*Discuss the Hurlers 2*,
  *Approach the Anchoress 2*); *Open your eyes* is ONE title at two levels (into the castle at Crystalline Knowledge
  3 to 6, the final seal at 7), so one entry that says so. **Left out:** Digging in the Hurlers and Hurling (their own
  features), ripping out the Discordant Law (Digging’s), the Discordant Law comparison (three laws, not an option),
  and the castle’s cards, which the Costs and Rewards guide tabulates by picture so their titles are unknown.

  **Painting in Balmoral** (`painting-balmoral`, `PB_OPTIONS`, `PB_PAYOUTS`): the badge exists to say
  that **failing is fine**. Every painting action raises Painter's Progress by one whether the check
  passes or not, so a failure costs nothing but the items and only steers the picture towards a
  different style — and the best-paying composition in the guide's table, Luminosity 3 with Incendiary
  3 at 6.63 Echoes an action, is three successes and three failures on purpose. So each action badges
  BOTH outcomes (`Luminosity +1? · fail Nostalgic +1`), which is the one place in this file where
  quoting only the success would hide the money rather than overstate it. *Unveil your Painting* is
  seven wiki pages under one title — only the one your composition qualifies for is on the screen — so
  it is one row pricing all seven, 17.50 Echoes at the worst and 112.16 at the best. One source
  disagreement is recorded rather than resolved: the guide gives *Paint Balmoral in a subversive cast*
  a failure of Nostalgic +1, the option page's failure block lists only the lost Vital Intelligence,
  and the badge says `(guide)`. *Display your own painting* at Helicon House stays `helicon-house`'s
  option and is priced on the rules line here instead.

  **Disappearing** (`disappearing`, `DI_OPTIONS`): the other half of the Cabinet Noir, and **the first
  feature to share a STORYLET with another**. `deciphering` owns *Work in your Cabinet Noir*'s
  code-breaking options and this one owns its two Disappearing options; both badge that heading, with
  their own class and dataset flag, and `carouselLookup` answers only for names in its own table, so
  neither draws over the other. The two rows moved here out of `DC_OPTIONS`, where they had been
  labels with no figures — the figures are in this guide. A badge carries the change points a success
  pays and **what a failure still pays**, both Cabinet options paying something either way; at the
  Clay Highwayman's camp it also carries the level off Waiting on a Ransom, which every escape action
  gives. The cash-in leads with `Suspicion −33 · needs 10 · surplus lost`. One correction went the
  page's way: the guide files *Map out the camp by candlelight* as a card and as a Watchful check;
  it is an option of *Darkness at the camp* and the check is Shadowy 190.

  **Cover Identities** (`cover-identities`, `CI_OPTIONS`, `CI_SALES`): the back room behind it. A
  start badges the **Ties** it locks in, because Ties cannot be changed until the identity is gone and
  they decide which sales are open; the four earned qualities badge their point and the **Suspicion
  +3 CP** each costs, which the guide's table omits and the option pages state, and which is why
  building an identity and erasing yourself are the same evening's work; the seven Backstory purchases
  badge the points AND the points per ACTION, since the only two-action one pays twelve and is
  therefore six a turn. None of the nine sales happens in this room, so `CI_SALES` lives on the
  heading's tooltip with what each wants and pays.

  **The Moonlit Woods** (`moonlit-woods`, `MW_OPTIONS`, `MW_QUARRY`): three numbers at once, and they
  are not interchangeable — On the Scent is the quarry and is **lost the moment you spot something**,
  Time Remaining is the clock, and Moonlit is the only thing kept between visits. So a wander badges
  `Scent +2? · Moonlit +1`, a move the Time it costs, and all three spotting options end with `· ends
  the walk`, which is the mistake the woods invite. Each clearing's heading names the quarry that can
  be spotted there and the On the Scent it wants, and the Keeper's three options what the sighting is
  finally worth in bones and with the Hinterland Prosperity cashed out.

  **Canal Cruising in Jericho Locks** (`canal-cruising`, `CC_OPTIONS`, `CC_PLACES`): Esteem of the
  Guild in and out. A source badges the Esteem it pays and is required to state its price — the suite
  checks that, because an Esteem source with no cost would read as free — and a barge badges the fare
  and the half of the river it buys, with BOTH prices (`−10/6 Esteem · upper river`), since a Doctore
  of the Guild pays 40% less and that discount is the guide's one piece of strategy. *Watch a parade*
  spends five Docks Favours, so it carries them as a `factions` row and they are on the badge.
  *Leave the barge* is six wiki pages and **one row**: only the place the barge took you to is on the
  screen, and six rows under one storylet would cancel each other out.

  **Barristering at Evenlode** (`barristering`, `BA_OPTIONS`, `BA_CASES`): Prestige of a Legal Case
  and the step of the trial (`Prestige +1? · paperwork`). Prestige cuts both ways — a harder verdict
  for a bigger payout, and nothing above 9 but the difficulty — so the four options that LOWER it are
  badged as the deliberate moves they are. A case badges the faction whose Renown scales it, its
  Prestige cap and the guide's Echoes per action. **Both trial storylets are named after the case**
  (*Prosecution of …*, *Defence of …*, four names each), so `baCanonical` matches the shape rather
  than listing them, the way Parabolan Hunting matches its quarries; the suite pins a case nobody has
  written down resolving too. Second Airs For CourtRoom rewrites all eight titles on *Choose a case*
  (*Justly prosecute* / *Prosecute*, *Justly argue* / *Fight a dishonest case*) and the honest and
  dishonest halves are the same option, so each is one row with the other title as an alias.
  `(a defendant)`, `(defendant)` and `(crime)` are in `CAROUSEL_PLACEHOLDER`.

  **Diving in the Magistracy** (`magistracy-diving`, `DV_OPTIONS`, `DV_FLOORS`): six floors of drowned
  First City. Six of the actions pay more the deeper you are, and **nothing on the diving screen
  states your Diving Depth** — the same wall `fotzDepth` hit — so the badge quotes the RANGE, marks it
  `▲ by depth`, and the tooltip prints the ladder. The honest place to read the depth is the storylet
  heading, which is retitled at every floor; `DV_FLOORS` is that list and `dvCanonical` matches the
  heading on its opening words. *Ascend* and *ASCEND!* differ only by punctuation, which
  `normalizeName` throws away, so they are one row that states both; *Descend* and *Ascend* are filed
  under the wiki's disambiguated titles with the plain ones as aliases, because Underclay has a
  *Descend* of its own.

  **The Railway Board** (`railway-board`, `RB_MEMBERS`, `RB_OPTIONS`): the badge is a fact about a
  PERSON rather than about an option, which is new here — each of the 26 board members answers to
  exactly one of Corruption, Obfuscation or Respectability (five answer to none), and that is what
  decides whether a meeting is one action a member or three. So the same line is badged on *Persuade
  X* and on *Invite X to the Board*, with the member's deepest interest beside it
  (`Obfuscation −40 · the Bazaar (40)`). The five counters badge what they raise and by how much, and
  their tooltips list the members they actually move. Deliberately left out and said so: the 111
  proposals of the guide's proposal table, whose route, station and charter halves are four further
  subpages — only the proposals listed on the storylet itself are badged — and *Using Favours to
  Reduce Opposition*, which the guide's own banner marks as missing.

  **Deciphering** (`deciphering`, `DC_OPTIONS`, `DC_DOCUMENTS`): the Cabinet Noir. Each code-breaking
  option badges the change points it pays, as a range where a Midnighter gets more, and the cash-in
  badges that **the surplus is thrown away** — Deciphering... goes to zero whatever it stands at, and
  a rare leap of insight pays 15 against a target of 5, so that warning is the badge rather than a
  footnote. The two options a Midnighter improves are one row each, because the game shows one title.

  **Jericho Library** (`jericho-library`, `JL_OPTIONS`, `JL_PROJECTS`): three research projects, three
  stages of 200 Librarian's Progress each, five topic storylets. A badge is the research a success pays
  **and what a failure does** (`+39? · fail −2 · Cartography 1`) — several stage-three options pay
  their failure in Wounds or Nightmares rather than in lost research, and two pay research even on a
  failure, which is why `fail` and `failMenace` are different fields. An advanced option names its Lead
  and stage, since that is what decides whether it is on the screen at all; the easy options say `any
  stage`. *Enlist qualified assistance* is a different companion in each of three storylets and is
  three rows; *Conclude your thesis* and *Resume your studies* are several wiki pages under one title
  and are one row each. *Begin an expedition* is the second known exception to one-name-one-table, for
  the same reason as Helicon House's.

  **Faction results are always on the badge, after it** (2026-09-17, on request, and step 5 of the
  adding-fallen-london-features skill). Any `Renown:` or `Favours:` an option gives or takes is a
  row field `factions: [[quality, change], ...]`, and every feature's badge text is
  `withFactions(core, e)` — the feature's own badge, then ` · Favours: Society +1` and so on
  (`factionText`; a change may be a number, a `[lo, hi]` range or a word like `−all`). They are never
  in the tooltip alone and never folded into a payout tag: Boxful's `+ Criminals favour`, Master-Classes'
  `Rubbery Favour ×1`, Mahogany Hall's `Tomb-Colonies ×1` and `2 factions`, Nadir's `Favours ×3` and
  `Revolutionaries ×7`, Breeding Monsters' `+ Hell` and the Temple Club's `Society Favour →` all moved
  out of the core text. Tables that transcribe a payout as one list of pairs split it with
  `splitFactions`. Port Carnelian computes its ending's Favours from the purse
  (`pcCashFactions`): none at the cap, `+1?` when the cap is unread, and `❖` stays as the 0-Echo
  mark. A *Favour in High Places* is an item, not a faction, and a Renown in `needs` is a
  requirement, not a result — neither goes there. Every suite whose table has faction rows pins them.

  The `factions` panel's static half is `FACTIONS`, transcribing the *Factions (Guide)*
  Faction-Item table (the item that converts Favours to Renown, its shop, its price) and the
  Renown-item ladder (10/25/40, for 3/5/7 Favours), including the wiki's best-in-slot marks and
  — kept as two *separate* flags because they are different warnings — `upperRiver` (the three
  underlined items that permanently add an Upper River card) versus `replacesCard` (the two that
  add one but lock another, so the deck is unchanged).
  Its live half reads the **Myself tab**, whose markup is verified against real game HTML in both
  layouts (identical for qualities, so one selector set covers both):
  `li.quality-item` → `img[alt]` + `.quality-item__name`. The **alt is the key**, and that is the
  whole trick: the visible text glues the level and a free-text suffix onto the name with no
  separator you can trust (`Renown: Society 34/55 -  Known in the homes…` has a double space;
  `Renown: Rubbery Men 12/55 - !kathakathoti!` has punctuation where prose should be), so the
  parser strips the alt off the front instead of hunting for where the name ends. FL's faction
  names match `FACTIONS[].name` exactly for all twelve. A text-only fallback exists for a missing
  alt, anchored on the `Renown:`/`Favours:`/`Connected:` prefixes so a quality whose name contains
  a number can't be mis-split. An **Accomplishment carries no number at all** — FL renders
  `Discovered: the Pentamerous Bride` and stops — so a matched alt with nothing after it reads as
  **level 1** rather than as a parse failure. Demanding a digit dropped every Accomplishment on
  the floor, which is what kept sending someone who had already met the Bride back to the bottom
  of the trench (fixed 2026-09-06, off a real `/myself` capture).
  **Three rules here are load-bearing.** (1) FL doesn't render a quality you have none of, so
  absent means 0 — *except* when the tab's search box (`input.input--item-search`) has text in it,
  which filters the list, and then absent must stay unknown. That guard is why the zero is safe at
  all. (2) Never fabricate a number: every unknown renders as a dash and an unknown Renown item as
  a `–` pip rather than the `◇` "not held" pip — three states, so an unknown is never mistaken for
  a no. A "0 Favours" that really means "couldn't tell" is worse than no panel, and Favours
  genuinely can be 0. (3) The values are read where they're shown but wanted everywhere else, so
  the last good read is cached in `localStorage` (`fl-ux-factions`) by the `faction-capture`
  feature — always **labelled with its age** in the panel, and discarded if the character name
  (from `#accessible-sidebar .welcome a[href^="/profile/"]`, present on every page) doesn't match.
  Which items you hold comes from the **Possessions tab**, also verified in both layouts: every
  item is a `[data-quality-id]` wrapping something with an `aria-label` whose first
  semicolon-field is the name (`Ornate Typewriter × 2; A Fine, Elegant…`). Reading *every*
  `[data-quality-id]` rather than a per-section selector is deliberate — inventory
  (`li.item`), the equip drawer (`li.available-item-list__item`) and **the slot you are actually
  wearing** (`div.equipped-item`) are three different shapes, and missing the third would tell
  anyone wearing their Renown item that they don't have it.
  **How many you hold is stated in two different places, and never in the same one.** An
  inventory item carries the count in its `aria-label` (`Witch-Stone × 20; …`) *and* in a
  `.js-item-value` span beside the label; a piece of **equipment in the drawer** — the only place
  a spare weapon, hat or pair of boots ever appears — carries no `× N` in its label at all and
  states the count solely in that span; and the slot you are wearing has neither, which is
  correctly the one you have on. So the count is read off `.js-item-value` where it exists and
  falls back to the label. Reading the label alone counted every duplicate piece of equipment as
  one, and a character sitting on four Scrimshander Carving Knives was told they had no spares to
  trade in (fixed 2026-09-06, off a real `/possessions` capture). The "**max, never summed**" rule
  across nodes still stands, and now covers the equipped copy (1, no span) against the drawer's
  span (the whole holding). The ids would be a better key than
  names, but only the ids of items you *own* are visible, so the full table can't be built from
  them; the names matched the wiki exactly for all nineteen faction/Renown items in the capture.
  `itemStatus()` turns those two readings into one of six states — `claimed` / `ready` /
  `unlocked` / `locked` / `unheld` / `unknown` — and it is pure, so the arithmetic behind the
  highlight is testable. `ready` (Renown gate passed **and** the Favours in hand) is the one the
  column exists for. The glyphs are **split by whether there is anything to do**, not by state
  count: `ready` and `unlocked` — the two whose Renown gate you have already passed — are both
  exclamation marks, and everything you cannot act on stays a hollow `◇` and recedes. Fill then
  separates the two: `ready` is solid dark-on-green (go now), `unlocked` is an outline in brown
  (nearly — save the Favours). Colour alone was tried for both and read as decoration; a hollow
  diamond among hollow diamonds was too quiet either way. `ready` also gets an accent edge on the
  row and a named list at the top of the panel. Keep `unheld` and `unknown` distinct from each other and from `locked` — they
  are three different reasons for a hollow pip and collapsing them re-introduces the "0 means we
  couldn't tell" problem in another form.
  `fullFavours()` is the same idea for the other direction: Favours cap at 7 and everything past
  the cap is destroyed, so a capped faction is the only thing on the page **actively costing you
  something while you read it**. It gets the same filled-badge treatment (a plain colour change
  reads as decoration) but in orange rather than green — a different kind of urgency, and never
  the same colour as `ready`. It reads the cap off what was scraped (`favoursCap`) rather than
  assuming 7. Both states want the row's left edge; **`ready` wins**, because when an item is
  collectable *and* the Favours are capped they are the same action.
- **The "use" button** opens the Faction Item on Possessions rather than spending anything. Every
  item there wraps a `[role="button"][tabindex]` that FL's own React handler is bound to, so
  `findItemNode()` locates it by name and clicks it; the options panel is FL's own and *you* pick
  the option. Getting there matters: FL's visible nav is a real
  `a.cursor-pointer[href="/possessions"]` driven by the router, so clicking it changes route
  **without a reload** and both the panel and this script survive; `location.assign` is only the
  fallback and does reload. Because either path may reload, the request is parked in
  `sessionStorage` (`fl-ux-pending-item`, 30s expiry) instead of a variable, and the
  `pending-item` feature finishes it on whichever scan first sees the Possessions markup — one
  mechanism for both routes. If the page arrives and the item genuinely isn't there, it stops
  retrying and fills the search box with the name instead (via the native value setter plus an
  `input` event, since React ignores a plain `value =`), so you can see what was looked for.
- **`equipment-helper`** (added 2026-09-13, `ux-enhancers.js` 3.1) works the Possessions tab's
  equipment. When the **"Show:" filter** names a stat, every slot's item giving the most of it
  gets a gold `★` and an outline — **every** item tied at the top, and **none** in a slot where
  nothing gives more than 0, since a star on the least-bad `Respectable -1` would read as advice
  to wear it. The item you are wearing is a candidate like any other. A summary line above the
  list says what the stars mean and what the starred items add up to; it is the only place the
  reasoning lives, because the star is `pointer-events:none` (a tap on it has to stay a tap on the
  item) and so can carry no tap-to-read panel. Highlight **only**, by the author's call — clicking
  an item equips it, so nothing here ever clicks one.
  Stats come off the same `aria-label` the Possessions scrape reads, as the `Name ±N` fields after
  the name (`parseItemStats`); the flavour simply fails the pattern.
  **A menace is a line of words, not a number** (added 2026-09-13, on the author's report that a
  Nightmares filter starred nothing): `Reduces Nightmares build up`, `Greatly reduces Troubled
  Waters build up`, `Greatly increases Wounds build up`, all verbatim from the capture. They are
  scored per the *Menaces (Guide)*'s **Menace Equipment** section — plain 1, "greatly" 2,
  "massively" **4** — and signed so that a **reduction is positive**: a star recommends, and less
  of a menace is the recommendation. An increase is negative, so an item making a menace worse is
  never starred for it. The author first said 3 for "massively"; the guide says 4 and the guide's
  figure is used — it moves only the summary's total, never which item wins a slot, since an item
  carries one line per menace. (That section carries an "Incomplete" tag about its CP formulas;
  the 1/2/4 weights are stated outright and are what this uses.) The parse keys the menace by
  name and records it in `stats.menaces`, which is how the summary knows to talk about build-up
  rather than "+3 Nightmares worn together". The filter's own wording for a menace option was
  never captured; it is the bare menace name, which the author's in-game report confirms works. Slots are `.equipment-group`, and only `.equipped-item` and
  `.icon--available-item` count, which is what keeps the **Burden** group's `.effect-item`
  afflictions out.
  **BDR** is the author's addition to that filter, and it is **the sum** of Bizarre, Dreaded and
  Respectable on each item (`itemScore`), ranked per slot exactly like any other stat: Bizarre +3
  beats Respectable +2, whatever the three come to as separate totals. The first cut (same day)
  got this wrong — it compared the three as separate whole outfits and starred the largest, which
  put the star on a Respectable Landau (+2) over the Mary Lloyd (Bizarre +3) the author was
  wearing. Reported, and corrected to the author's definition; do not bring the outfit comparison
  back.
  **The filter is a react-select, and BDR is a fake option on purpose.** There is no `<select>`
  behind "Show:" (the "Wear:" dropdown has a hidden one; this does not), the class names are
  generated hashes, and React owns the menu, so a node of ours in it cannot move React's state.
  `findShowControl` therefore finds the control from its **"Show:" label**, the value by the
  `singleValue` fragment and the input by its `react-select-N-input` id. `injectBdrOption` puts a
  **shallow** clone of the Bizarre option after it — the look, none of React's children — and
  takes only the click: the menu's own mousedown handler must still see the press, or the input
  blurs and the menu closes under the finger. Picking BDR **clicks the real "All" option** (which
  closes the menu and puts every item back on the page) and *then* records BDR in
  `sessionStorage` (`fl-ux-equip-bdr`) — in that order, because a click on any real option is what
  cancels BDR, and "All" is one. A real option also cancels it when picked some way no click
  listener sees, which shows up as a value that is no longer "All". While BDR is chosen the
  control reads BDR: React's value is **hidden, not rewritten** (rewriting text React owns leaves
  React updating a node that is no longer in the page), and a span of ours sits on the same grid
  cell after it.
  Idempotency is the usual flag: `markItem`'s dataset key carries stat, item id and figure, since
  React re-renders the list into the same nodes, and the summary and the BDR label only write
  when their text or place has actually changed.
- **`equipment-optimizer`** (added 2026-09-26, `ux-enhancers.js` 3.4) puts an **"Optimize equipment"**
  button in every `.branch` that has a `.challenges` block, inside `.storylet__buttons`. Unlike the
  Possessions-tab helper above it **does equip**, and it does so through **the game's own API**, not
  by clicking: the HTML routes are an empty shell, but `api.fallenlondon.com` answers a script on
  the page when sent `Authorization: Bearer <token>` (the token is `localStorage.access_token`, maybe
  quoted). Every endpoint, reply shape and verified fact is in `okf/fallen-london/` (`api.md`,
  `challenges.md`, `equipment.md`); read those before touching it. In short:
  - **A click**: `GET /api/character/myself`, `GET /api/outfit` (the only place the *worn* items are
    listed), `POST /api/storylet` (the open storylet; read-only) — one at a time — then `planFor`,
    then the swaps, then `POST /api/storylet` again to compare what the game now shows with what was
    predicted. **The swaps go through the page, not the API, when they can** (added 2026-09-26, on
    the report that a full reload took several seconds): `applyOutfit` clicks the game's own
    `a[href="/possessions"]` router link (the one `openItem` uses), clicks the spare in the drawer
    (`.icon--available-item[data-quality-id]`, its `[role="button"]`) to equip or the worn
    `.equipped-item[data-quality-id]` to empty a slot, waits for the item to appear or go, and
    returns with `history.back()`; the Story tab refetches on arrival (`GET /api/opportunity`,
    `POST /api/storylet` in the capture). The GAME made the change, so its own state (Possessions,
    sidebar) stays consistent, which an API equip does not do. If a step will not go that way (no
    link, the item not on the list because a "Show:" filter hides it, a click the game ignores) the
    rest is made through `POST /api/outfit/equip`/`unequip` and the page **reloads**, as it used to.
    The DOM route is verified only against the markup the equipment helper reads; it has not been
    tried in-game. The result line survives a reload (and the trip through Possessions, which
    replaces the button) in `sessionStorage`
    (`fl-ux-equip-result`, and `fl-ux-equip-undo` for the Undo), is drawn under the branch with the
    same `data-branch-id`, and goes stale after 30 minutes.
  - **`targetNumber` is the percentage the game shows (floored), not a difficulty**; no difficulty and
    no broad/narrow flag is sent. `inferChallenge` solves the difficulty from it and your level: a
    `BasicAbility` challenge is **broad** (`0.6 × level / difficulty`), a `Skills` one **narrow**
    (`0.6 + 0.1 × (level − difficulty)`), a percentage that is not a multiple of ten is always broad;
    both clamp to 10%–100%. A challenge shown at 10% or 100% hides its headroom, so it is **fixed**,
    and a 100% one **holds its stat** at today's level. Checked against real outfit changes (Persuasive
    270→200: 90%→66%; Mithridacy 1→3: 60%→80%). **The kind rule is a working guess for other
    categories**: the post-run comparison ("Predicted X%, the game shows Y%") is what catches it.
  - **Base level** is `effectiveLevel` minus the bonuses of the worn items in the slots being
    optimised (verified: effective minus base is exactly the worn items' `enhancements`).
  - **`optimizeOutfit` is exact**: it keeps every partial outfit not beaten on every stat *and* on
    slots changed, then takes the highest chance and, among equals, the fewest changes (so a tie never
    shuffles your gear). It was checked against an exhaustive search on 600 random wardrobes. A stat
    with an upper limit (a met `(you needed 30-70)` requirement) is compared for equality, because a
    higher level there is not better. `OPT_STATE_CAP` (4000) guards a pathological wardrobe and marks
    the answer `approx`; real gear never reaches it.
  - **Empty slots and unequipping.** An empty changeable slot you own items for is offered with
    "nothing" (id `null`) as its worn choice, so it is filled when an item helps and left empty when
    none does. Filling is `POST /api/outfit/equip`; emptying is `POST /api/outfit/unequip` with the
    id of the item worn (both verified). Undo of a fill is therefore an unequip, which is why the undo
    record keeps `was`/`wasName` beside `id`/`name`.
  - **What it will not do**, on purpose: empty a slot that holds something (only swap it; emptying
    loses everything else the item does), touch a slot the game marks `canChange: false`, model a
    challenge with a non-empty `bonuses` (stats added together: refused), count a second chance, or
    unlock a locked action. It guards a *met* requirement on a stat gear can change, and refuses when
    `canChangeOutfit` is false. **Known limit:** it scores only the stats the challenges test, so an
    item with a small gain there and a big penalty elsewhere (say +2 Dangerous, -300 Watchful) can be
    chosen. Nothing guards other stats yet.
  - **Items that ask first, and the Dismiss button** (added 2026-09-26, on the report of an item whose
    click opened a popup with an "Equip" button and left the run stuck on Possessions). After a click
    the run waits for either the change or a dialog button reading exactly "Equip" (or "Unequip" when
    emptying a slot); it clicks that and waits again. **The popup's markup is captured** (the Ridiculous
    Hat's, 2026-09-26): a react-modal, `.ReactModal__Overlay` > `.ReactModal__Content[role="dialog"]` >
    `.tooltip--item-modal` > `.tooltip__desc` ("This item may be used or equipped.") >
    `.tooltip__buttons` with two buttons, **"Use" and "Equip"**. The run clicks only the button reading
    exactly "Equip": "Use" spends the item and must never be clicked. There is no Close button;
    react-modal closes on Escape (on the focused dialog) or a click on its overlay, so a swap that
    gives up dispatches Escape on the dialog and clicks the overlay before falling back to the API,
    so nobody is left behind a popup. Whether an *Unequip* popup exists was not captured (emptying a
    slot by click worked directly on the Adornment slot). The result panel has a **Dismiss** button that
    clears the message and forgets the stored result; it is on every message, not only results.
  - **A challenge whose level cannot be read** (reported 2026-09-26 as "Could not read your level in a
    stat this challenge tests", which refused the whole action). No possession of a quality means level 0,
    so if something you own boosts it the level is 0 plus what you wear; if nothing you own touches it
    (Luck, say) the challenge is left at the percentage the game shows and the result says
    "Not counted: X". `planFor` no longer blocks on it.
  - **Legibility.** The result panel brings its own background and ink (`EO_PANEL_CSS`, from `UI`), and
    every line repeats the ink, so it reads the same on a white action as on a dark one (reported
    2026-09-26: light text on white was barely readable). It is hidden while empty. The test checks a
    WCAG contrast of at least 7 between the two, not merely that they differ.
  - **The token** is sent to `api.fallenlondon.com` only and never logged or put in a message.
  - `tests/ux-equipment-optimizer.test.mjs` pins all of it with values from the capture. The open
    questions (unequip, combined stats, second chances, other challenge categories) are in
    `okf/fallen-london/open-questions.md`; settle one there before relying on it here. **Confirmed working
    in-game by the author (2026-09-26)** on real actions, including the in-page route, the Use/Equip
    popup and the unreadable-level case. Not yet reported on: Undo, Dismiss, filling an empty slot, the
    API-and-reload fallback, and the phone layout.
- **Refreshing the Factions panel: `fetch` does not work, and that is settled.** Fallen London is
  client-rendered — `GET /myself` returns a ~4.7KB shell whose `#root` holds a loading splash and
  no quality list (checked against the live site, not assumed). So `refreshBackgroundState()` uses a
  hidden off-screen **iframe** instead: point it at the route, let the app boot inside it, poll
  `contentDocument` until the markup appears, then read it. It's off-screen rather than
  `display:none` because a `display:none` iframe may skip layout and never run the app. The two
  routes load sequentially (two SPA boots at once is a lot of work), each extractor waits for
  markup that is actually *complete* — a faction quality present, >20 possessions — so a
  half-rendered page can't bank a page of false zeroes, and everything is behind a 20s timeout
  whose failure path is "no refresh", never a wrong number. This is **confirmed working in-game**
  (2026-09-02) — keep every guard regardless; they are what make the failure mode "the panel you
  already had" rather than a wrong number.
  Both scripts carry **`@noframes`** (and so does the loader), so neither boots a second copy of
  itself inside that iframe. Auto-refresh is on by default, throttled by `stateIsFresh` (skip if
  under a minute old), and switchable off in the panel — `fl-ux-auto-refresh`. Panels get a
  `ctx.rerender()` that rebuilds only the body, so a refresh landing doesn't flicker the header
  or lose scroll position.

**What in `FallenLondon/ux-enhancers.js` and `FallenLondon/choice-helper.js` has actually been run
in the game** (as of 2026-09-06). Everything confirmed below was confirmed before the 2026-09-13
split, while it was all one file; the split moved that code rather than changing it, and what it
did add is listed under "Not verified".
Worth keeping current, because "verified against a capture" and "seen working live" are different
claims and this file makes both.

Confirmed live by the author:

- The floating launcher mounts, the menu opens, the Factions panel renders. The
  `position:fixed`-on-`body` approach survives FL's routing.
- The **Myself scrape** — the Renown and Favours shown were the correct ones for a real character.
- The **Possessions scrape** — held / not-held and the `✦` on owned Faction Items came out right.
- The **background refresh via hidden iframe**, including that `@noframes` stops the script
  booting a second copy of itself inside it (no doubled launcher was seen).
- The pip states as rendered: filled `!`, outlined `!`, `◇`, `◆`, and the capped-Favours badge.
- The **"use" button** — it opens the Faction Item's options. So `findItemNode` → `.click()` on
  FL's `[role="button"]` is the right handle, and getting to Possessions works.
- The **Crowds of Spite card ratings on a real hand** — badges appear on live opportunity cards.
- The **travel control's markup**, all three layouts (reported 2026-09-02, in response to the
  launcher covering the narrow layout's bottom bar): `.travel-button--infobar`, the classless
  button in `.storylets__welcome-and-travel`, and `li.banner-item > button[title="Map"]` with
  its `i.fa-compass`. All three are now also confirmed as DOCK HOSTS — see the entry below.
- The **area gate**. The greeting during a promenade was captured verbatim (*"Welcome to The
  Crowds of Spite, delicious friend!"*), so `SPITE_AREAS` is now a verified exact list rather than
  a permissive guess.
- The **docked launcher button** (2026-09-03). Reported working in all three layouts: its own
  `li` in the mobile banner, beside the classless Travel button on the narrow desktop, and --
  after the `after` fix -- directly under the wide sidebar's "View map" button rather than at
  the bottom of the whole column. The floating fallback and the menu's dock/float toggle work
  too, including the `pointer-events` fix that had made the floating button unclickable.
- The **Supplication on the Shore option badges** (2026-09-03). The one place this script
  decorates a storylet OPTION rather than a card, so `.branch__title` and the
  after-the-heading hang are confirmed as a path in their own right.
- The **Fruits of the Zee card badges on a real dive hand, and the panel** (2026-09-03).
- **The festival's wiki data moves while the festival runs, so re-read it every week.** Twice
  now this has changed the tables under us. On **2026-09-03** the new card *A Graveyard of
  Derelict Debris* and its *Rust-Eaten Ration* appeared in the guide a day after the
  transcription, and the first anyone knew was a card coming up unbadged in a real hand. On
  **2026-09-10** week two opened and the Ration's three Luggage were named at last
  (*Accomodating Oyster*, *Sentient Zee-Chest*, *Fateful Net*, taken from the option page
  *Offer the King your Rust-Eaten Ration*, which gives the Sights band of each), clearing the
  last `pending` entry in these tables. That same re-read caught two Fate prices in
  `FOTZ_CORALS` that the guide's **/Item Comparison** table had never corrected: the Grasping
  Coral gloves are **10** Fate at the Hoard, not 30, and the Gorgonian Reef-Rock clothing is
  **20**, not unavailable — both from the Hoard option pages' own `Fate Cost`, which is the
  source that wins here as everywhere else in the file. The lesson is the process one: when a
  week of this festival turns over, re-read the guide whether or not anything looks wrong.
- **SETTLED, and the answer is no: the dive depth cannot read itself** (2026-09-03). A hand
  captured mid-dive shows Fallen London renders no `li.quality-item` anywhere on that screen,
  so `fotzLiveDepth()` never fires and the badges read `100–300` rather than a single figure
  until the depth is set by hand in the panel. `fotzDepth`'s first tier is therefore dead weight
  in practice -- keep it (it costs one failed `querySelectorAll` and would start working for
  free if FL ever renders qualities there), but do not expect it. If this is worth improving,
  the honest options are to make the manual control cheaper to reach than
  "menu → panel → click a number" five times a dive, or to find some other depth-varying thing
  on the dive screen to read; the same capture shows `.hand__card-container` carries a
  **`data-event-id`** (`354153` for Well-Disguised Trinkets, matching the wiki's card ID), which
  is a far better key than the name and is worth remembering for other reasons.
  **Both of those were taken, 2026-09-04.** A `/myself` capture confirms the quality *is*
  rendered there in the ordinary `li.quality-item` shape, so the panel now loads it in the
  background the way it loads Possessions (`fotzDepth` tier 3, 60-second expiry); and the manual
  control moved into the page as `fotz-depth-control`, docked beside the Travel button and again
  above the hand, one tap per level. The card's `data-event-id` is still unused and still the
  better key.
- **Both festival areas**, from the same sort of capture (2026-09-03): *"Welcome to Mutton
  Island, delicious friend!"* on the island and *"Welcome to the Royal Approach, delicious
  friend!"* mid-dive. `FOTZ_AREAS` is now an exact, verified list that is allowed to say no --
  and knowing when you have surfaced is what lets a hand-set dive depth be discarded rather
  than quietly going wrong.
- A **second source for `currentArea()`** (2026-09-03), from the wide layout's sidebar:
  `p.welcome__current-area` holds the area on its own (`"Mutton Island,"`) where the
  screen-reader block states it inside a sentence. FL splits that sentence across three
  paragraphs in the visible greeting, so the regex cannot reach it and the element can -- the
  two complement each other rather than duplicating.
- The **dive depth, end to end** (2026-09-04). Reported working by the author, which settles the
  three parts of it together: `fotzDepth`'s banked **`'read'`** tier -- the panel loads `/myself`
  in the hidden frame and Full Fathom Five comes back off it, so a dive no longer starts with
  the badges quoting a range; the **`fotz-depth-control`** feature in both of its mounts, docked
  beside the travel control and above the hand, including that the tap sets the depth and every
  badge in the hand re-quotes itself; and `wantsDepthRefresh` forcing that fetch on every panel
  open in the Royal Approach without looping. This is the answer to the 2026-09-03 "SETTLED, and
  the answer is no" entry above: the depth still cannot read itself on the diving screen, but it
  no longer has to.
- The **Fruits of the Zee badge palette** (2026-09-04). The reworked `FOTZ_FAVOUR_COLORS` -- one
  light colour per Favour figure, dark-inked -- was reported as legible on real card art, which
  is the claim the old dark ramp failed: the author's report is what started it (*"some are
  barely visible"*), and the eight distinct colours are confirmed distinguishable in a live hand
  rather than merely distinct in a contrast calculation.
- The **light blue depth card** (2026-09-04). `DEPTH_BG` and its four companions, on both mounts.
  Confirmed readable in the page, which is the half a contrast ratio cannot settle -- the
  question was never white-on-blue, it was whether a light card reads as *ours* against FL's
  dark chrome. It does.

- The **three scrape fixes of 2026-09-06, end to end**. All three started as reported wrong
  answers, were diagnosed off fresh `/myself` and `/possessions` captures (quoted in the script),
  and were then **reported working in the game by the author**:
  the **Accomplishment shape** -- `Discovered: the Pentamerous Bride`, name and nothing else, no
  level anywhere -- so the Bride now reads and the bottom of the trench drops out of what is
  still to dive for; the **`.js-item-value` span**, which is the *only* place a piece of
  equipment states its quantity, so four Scrimshander Carving Knives count as three spares in
  the ledger instead of none; and **a coral already in hand ending its card**, so a diver
  carrying all six is no longer shown all six as still down there.
- The **panel fullscreen toggle** (2026-09-06), reported working -- including that the
  preference carries to the next panel, which is the whole reason it is remembered. So the
  `position:fixed`-child-of-a-fixed-root trick really does step out of the launcher's flex
  column without disturbing the docked button.
- **The split into two scripts** (2026-09-13, `ux-enhancers.js` 3.0 + `choice-helper.js` 1.0),
  reported working by the author the same day: *"everything seems to work"*. That covers the
  three things the split added -- Choice Helper's panels reaching the ⚙ UX menu through
  `window.__flUxPanels`, the hidden frame shared between the two scripts' background refreshes,
  and the depth control docking behind the UX button by id. The report was general rather than
  item by item, so which install route (separate scripts or the loader) and which layouts were
  exercised is not recorded; if one of those turns up broken, that is the gap.
- The **equipment helper** (2026-09-13, `ux-enhancers.js` 3.1), reported working by the author
  the same day (*"now everything works"*), after two rounds of corrections in-game: BDR as the
  **sum** of the three rather than the largest whole outfit, and **menace** lines scored 1/2/4.
  Since the open Show menu was never captured, this report is also what settles its markup
  assumptions: the BDR option placed by react-select's `react-select-N-option-M` ids, "All" and
  "Bizarre" found by their text, the fake option clicking the real "All", and a menace option
  named by its bare menace. The stars' placement on the item icons is covered by the same report,
  though it was not described item by item, nor which layouts were used.

**Not** verified in-game (reasoned about only):

- The **Zailing card ratings and the Zailing panel**. They reuse machinery that *is* confirmed
  (`eachCardName`'s three card shapes, `attachBadge`, the launcher and its panel host), so the
  risk is not the markup -- it is the transcription and `ZEE_AREAS`. Nobody has yet read the
  screen-reader greeting during a voyage, so it is not known whether it names the region
  ("Welcome to The Sea of Voices"), the ocean, or something else entirely; `inZee()` is written
  to fail closed on the one card that leans on it and open on everything else. Move this up on a
  report, and say what the greeting actually said.
  The **ports table** (added 2026-09-09) is transcription too, and it has one open question of its
  own: the guide marks **Port Cecil** and **Tanah-Chook** unsafe while the hidden sort key on both
  cells says safe, and the table follows the visible cross. Dock at either with Troubled Waters
  above 1 and report whether it reset.

- The **Port Carnelian badges and panel** (added 2026-09-09; the markup and the greeting
  verified in-game 2026-09-10, the transcription still not). A capture of a real term settled
  three of the four open questions at once: the port is one storylet, *Matters of State*, whose
  options are the guide's rows; the greeting says **Heartscross House**; and no heading there is
  prefixed the way "Fruits of the Zee: Supplication on the Shore" is (`pcKeys` still tolerates
  one, harmlessly). What is left is the transcription — the guide's own numbers, unchecked
  against a term actually played. Report a row whose badge and outcome disagree. The two split
  storylets (*Within their rights*, *A plea for pardon*) are **confirmed working** in-game
  (2026-09-10) — they do open into a storylet of their own with their two branches beneath, and
  both levels badge. What is still unseen is whether the branch badges sit beside the
  supplication ones without either clearing the other, which no screen has yet shown both of.
  The **cash-out calculator** (added 2026-09-10) adds two things to report. First, whether
  Fallen London writes *Striped Delights* and *Silver Horseheads* on the Myself tab under
  exactly those names, and whether they are there at all outside a term — the whole figure
  rests on that scrape, and a name that does not match reads as a purse of 0, which is why an
  unread purse is a label rather than a number. Second, the **rounding**: cash out on a purse
  the badge prices and say what the game actually handed over. The one figure worth catching a
  term at is **35** of either currency, where the guide's tier table and the wiki's stated
  bankers' rounding disagree — the badge says no dear item there, the guide's table says one.

- The **Voyages of Scientific Discovery badges and panel** (added 2026-09-09). Same two
  reasons again — the transcription, and `VSD_AREAS` being a guess at three greetings nobody
  has read. The thing worth reporting first is narrower than that: whether the three islands'
  storylet headings read as the wiki titles them, since three of them are also the area name,
  and whether `vsdIslandHere` in fact resolves the island from the open storylet when the
  greeting does not. If a badge ever quotes the wrong page type at the end of a visit, that is
  the code path that failed. Also worth a look: the island page records **no Orthos gain** on
  a success for Grunting Fen's *Follow the trail of history*, alone in all three carousels,
  and that is transcribed as the page has it rather than as confirmed.

- The **University Laboratory badges and panel** (added 2026-09-14). Nothing about it has been
  seen in the game beyond the greeting (*"Welcome to The University, delicious friend!"*, captured
  2026-09-14, which made `LAB_AREAS` exact) and a first look at a hand, reported as "badges look
  okay" the same day. Worth reporting, in order: whether the Myself tab lists
  *Equipment for Scientific Experimentation*, *Number of Workers in your Laboratory*,
  *Experimental Object*, *Laboratory Research*, *Total Lab Research Required* and the *Laboratory
  Services from …* qualities under exactly those names (a mismatch reads as 0, so the badge would
  quote Equipment 0 — look for a card badge far below what the option pays); whether an opened lab
  card's options read as the wiki titles them (*Go for a walk*, not *Go for a walk (Fatigue)*); and
  a badge against what the game actually paid, especially a student failure — the option pages and
  the guide's Student Table disagree in nine places and the pages were followed. Also unknown:
  whether the Struggling Artist and the Urchin count as level 5 for the team options.

- The **Arbor badges** (added 2026-09-14). Nothing about them has been seen in the game. Worth
  reporting, in order: whether a stay really shows **Near Arbor** / **Far Arbor** as an opened
  storylet (a `.storylet-root__heading`) with the options beneath it — the whole option gate rests
  on that, and if Arbor renders its options some other way no option badge will appear; what the
  greeting says in Arbor (`ARBOR_AREAS` is a guess); whether the options read as the wiki titles
  them; and, on the four rows where guide and option page disagree, which one the game agrees with
  (a Witness a trial at Watchful 115 or 100 is the easiest to see on the challenge line).

- The **L. B. Industries, Menace Eradication and Vertiginous Horticulture badges** (added
  2026-09-14). Nothing seen in the game. Report first whether option badges appear at all: they rest
  on the carousel storylet (*Your Labour, and its Fruits*, *Hunting across London*, *Vertiginous
  Horticulture*, the confrontations) showing as an opened `.storylet-root__heading` above its
  options. Then whether the placeholder titles really read as "Water your mandrakes" / "Bid farewell
  to the Grizzled Gaffer" (a badge missing on exactly those options is that); whether *Destroy the
  d__ned thing!* is spelled that way in the game; and a Horticulture failure's Nurturing against
  the badge, since the "Loss of (1 − Difficulty)" reading is the guide's interpretation.
- The **Forgotten Quarter Expeditions badges** (added 2026-09-14). Nothing seen in the game. Report
  first whether option badges appear on all four Base-Camp storylets, and what the preparation
  storylet's heading actually reads (both *Prepare for an Expedition* and *… in the Forgotten
  Quarter* are accepted); then whether the Fate expeditions show "(7 FATE)" in their titles, a
  buccaneering success's Rivals' Progress rate against the 50% the tooltip claims, and whether the
  Chalcocite Pagoda's ending challenge is Watchful 40 or 60.
- The **Cat and Mouse badges** (added 2026-09-15). Nothing seen in the game. Report first whether
  the Business Card's storylet (*A meeting with the Implacable Detective*, opened from Possessions)
  shows as an opened `.storylet-root__heading` so its options get badges; then what the pursuit
  options' titles actually read (the wiki writes "Last chance! – follow your nose" on one storylet
  and "Last chance! Follow your nose" on the other, and "Fate is on your side." with a full stop on
  one), whether *Time is passing: play it safe* costs 1 action or the guide's 2, and whether the
  map-half searches are at the page's narrow difficulty or the guide's one higher.
- The **Season in Soup badges** (added 2026-09-15). Nothing seen in the game. Report whether the
  house storylet's heading reads the full *Mrs Chapman's Boarding House for Those Who Temporarily
  Have Nowhere Else To Go*, whether the parlour's Promenade gets a week-specific badge (it should
  read e.g. `Vision ×1–5` in week 4, and `item ×1–5` only if the parlour option beside it is not
  recognised), and one soup's actual payout against the tooltip's figure at your base Persuasive.
- The **Long-Dead God, Engaged in a Case, Sunken Embassy, Law-Furnace and Prelapsarian Museum
  badges** (added 2026-09-15). Nothing seen in the game. Report: the greeting while inside the Mind
  of a Long-Dead God, verbatim (the *Rain* and *Geology* cards stay unbadged until it reads *The
  Mind of a Long-Dead God*), whether its card titles read *What the Thunder Said* and *Bat's-Eye
  View* without the wiki's disambiguation, and whether a challenge there fails as often as the
  tooltip says; whether a faction card's "Solving a case" option gets a badge once the card is
  opened; the Sunken Embassy's two storylet headings; whether *Persona Non Grata* shows at Void Ab
  Initio 9; and the Assert options' real titles in the Osteology Lab.
- The **Heist, Spider Symposium, Short Stories, Flash Lays and Social Actions badges** (added
  2026-09-15). Nothing seen in the game. Report first whether heist and Flash Lay cards in the hand
  get badges at all (the hand badge rests on `eachCardName` finding the special decks the same way
  as the ordinary one); then the heist options' real titles where the wiki disambiguates ("Play it
  safe 3", "Dash past 2", "Escape! (On a Heist)"); whether *Establish a false identity with your
  Informant's help* really appears twice on one card; whether the assassin cards' deadly option shows
  one title or two; and one Short Story publish against the Echoes the badge claims.
- The **Cave of the Nadir, Empress' Court and Breeding Monsters badges** (added 2026-09-15). Nothing
  seen in the game. Report the greeting inside the Cave verbatim (ten card names stay unbadged until
  it reads *Cave of the Nadir*); whether the Cave's same-titled options ("Run", "Sleep's fortress",
  "Look into the water") appear under those plain titles; the Court's *What's your next work?*
  heading as it really reads; and one breeding's payout against the badge.

- The **Mahogany Hall, Master-Classes, Sixth Coil, Rat Market and Boxful of Intrigue badges**
  (added 2026-09-16). Nothing seen in the game. Report first, in order:
  **(1) The Sixth Coil's room headings.** The whole feature rests on the claim that the storylet
  heading in the game is the room name the Locales quality picks — *Leatherbound Study*, *Muddy
  Trench*, *Hedge Maze* — and not a fixed "A Workshop, in the Sixth Coil". If no badge appears
  anywhere in the Coil, that is the claim that failed, and the answer is what the heading actually
  said. Then whether the wandering option reads "&lt;verb&gt; &lt;direction&gt; through &lt;a way
  out&gt;" as the wiki's variant tables have it, and whether the payout screen calls the quality
  *Patrolling* or *Mapping the Labyrinth* (the pages use both; the badge says Patrolling).
  **(2) The Rat Market's prices.** Sell one item on a fresh market and say what it actually paid in
  Rat-Shillings — everything else is derived from that one multiplier. Also whether the entry
  storylet in the Flit is titled plainly *The Rat Market*.
  **(3) Mahogany Hall's day shows.** Whether picking a day on *The weekly variety bill!* opens a
  storylet titled as the wiki has it (*Light Entertainment!*, *Feats of Daring and Grace!*, *The
  comedy of the absurd!*, *An evening of refined entertainment*, *Fallen London's Best-loved
  Entertainers*), and what *Smoke and mirrors* really pays — the guide says both ×226 and ×113.
  **(4) Master-Classes.** Whether the Clay pupil's lesson storylet reads *Educating Lyme* (the alias
  assumes the wiki's "Educating Lyme 1" is a disambiguation), and whether the Scullery's *Take supper
  with him* is certain at Pygmalion 13 or 14.
  **(5) A Boxful of Intrigue.** Whether a payout hands over any Correspondence Plaques — the guide's
  table says six, the option pages say none, and the badge follows the pages.

- The **Underclay, Hunting Bees, Featuring in the Tales of the University and Term Passing badges**
  (added 2026-09-16). Nothing seen in the game. Report first, in order:
  **(1) Term Passing's storylet titles, and their case.** Only the third carousel is carried, and it
  spells several storylets differently from the first (*Off to the Library* against *Off to the
  library*). The table follows the third. If a heading in *A Respectable Academic* goes unbadged, its
  spelling is why — say what it actually reads. Also whether an option pays what the guide's table
  says, and whether the Connected figures on the badges match what the game hands over.
  **(2) Featuring in the Tales of the University's two blanked titles.** Whether the game renders
  *Making Your Name: Meet the Department of _______* with the blank filled in, with literal
  underscores, or some third way. If those two storylets never badge, that is why. The guide is also
  flagged incomplete after the July 2026 rework, so a storylet that has moved or gone is worth
  reporting on its own.
  **(3) Hunting Bees.** Whether *Dagger or Flint* really does decide the attribute at 50, and whether
  the way out is titled plainly *Escape* (the row is filed under *Escape (Flint or Dagger)* with
  *Escape* as an alias). Also which of the guide's and the pages' Airs windows is right on the three
  that differ by a point.
  **(4) Underclay.** Whether the hub reads *Escape from Underclay* and the two halves *Confessions
  from the Stone* and *Lies for Clay Men to Tell*, and whether moving between them really costs no
  action. Also whether the tenth reward, *…fight for the Admiralty*, appears at all.

- The **A Trade in Reputations, Riding the Savage Cobbles, Publishing a Newspaper, Fighting a War of
  Assassins, Wars of Illusion, Foreign Posting and Temple Club badges** (added 2026-09-17). Nothing
  seen in the game. Report first, in order:
  **(1) A Trade in Reputations' product-named titles.** What the card *Have (Campaign Focus) Reviewed*
  and the options *Commission a poster for (Campaign Focus)* / *Commission advertising copy for
  (Campaign Focus)* actually read — the aliases assume the campaign's name in place of the brackets. If
  that card goes unbadged, this is why. Also whether the Enterprise-25 figures match the Name
  Recognition the game hands over at 25, and whether the hand's cards are the campaign deck at all
  (they are matched by name only, with no area gate).
  **(2) Wars of Illusion's shared titles.** Whether every *Enough* and *Done for now* badges inside its
  own storylet, and whether the storylets of the Bats and Cats cash-ins read *Making Use of Bats* /
  *Making Use of Cats* (the wiki disambiguates them with "(storylet)"). Also which side is right where
  guide and pages disagree — above all whether the four single cash-ins add Embroiled on every success.
  **(3) Newspaper.** Whether the option pages' Shadowy challenges are real (the guide lists none), and
  whether the Spindlewolf option reads *…your Elongated Spindlewolf* or *…the Elongated Spindlewolf*.
  **(4) The three level carousels.** Whether the Foreign Posting and Savage Cobbles storylets swap at
  level 5 as the pages say, and whether *Walk away* and *Introduce yourself* read that plainly.
  **(5) The Temple Club.** Whether *Commission a portrait* really pays Memory of Light ×16 as well.

- The **Attending a Party, Searching out a Missing Woman and Doing Business in Wilmot's End badges**
  (added 2026-09-17). Nothing seen in the game. Report first, in order:
  **(1) The party cards' titles.** Whether they read with the trailing dots (*The Turkish Girl...*) and
  the options with the leading ones (*...has taken her shoes off to dance*); `normalizeName` drops both,
  so a missing badge would be a different WORD, not the dots. Also whether the Heavily Entitled options
  keep their quotation marks, and which side is right where guide and pages disagree (five rows).
  **(2) Wilmot's End.** Whether the storylets at 3 read *Who is she?* (the wiki's *Who is she? 2*), and
  whether both *Millicent Clathermont* options badge inside their own storylet.

- The **Brawling with Dockers, Assembling a Skeleton, Professional Activities and Hearts' Game badges**
  (added 2026-09-17). Nothing seen in the game. Report first, in order:
  **(1) The skeleton's storylet title.** Whether the bones are offered on a storylet headed *Assemble a
  Skeleton* at every stage of a build, and what the end of a bone's title reads (the badge matches any
  words after "to your"). If no bone is ever badged, the heading is why.
  **(2) The brawl's side.** Whether the side is read right once a reward shows, and whether a lone
  fighter's figures are the ones on screen.
  **(3) Hearts' Game.** Whether the accomplice cards are named as the wiki has them (*Four of Lures: The
  Reel*), and whether the Progress on a badge is what the game reports before Tolerance.
  **(4) Professional Activities.** Which of page and guide is right on the fourteen jobs that disagree,
  and whether the Licentiate's quoted titles match.

- The **Hunter's Keep, Mutton Island and Venderbight badges** (added 2026-09-17). Nothing seen in the
  game. Report first, in order:
  **(1) The two greetings that have never been read.** What the game says on Hunter's Keep and in the
  tomb-colony (*"Welcome to …, delicious friend!"*). Until those are known, `Exploring the island`,
  `Investigate the gardens`, `Examine the books`, `A game of charades` and `A Game of Chess` stay
  unbadged, and a report is all it takes to turn them on — and to move either gate up to an exact list.
  **(2) The storylet titles the wiki disambiguates.** Whether the books storylet reads *Examine the
  books*, the jetty one *Put to Zee!* and the chess card *A Game of Chess* on screen, without the
  bracketed place the wiki adds.
  **(3) Whether the Venderbight cards are dealt as the table says.** In particular whether *A Game of
  Chess* really wants Having Recurring Dreams: A Game of Chess 3, and whether anything is dealt at
  Nemesis 14 that the table has down for 11–13.
  **(4) The two either-or payouts.** What *Carouse with the dead* and *Snatch a bat out of the air!*
  actually give, and whether either has odds the pages do not state.

- The **Godfall, Maze-Garden, Polythremic Promenade, Port Cecil and zee-beast badges** (added
  2026-09-17). Nothing seen in the game. Report first, in order:
  **(1) The approach storylet's real headings.** Whether *Approaching the …* reads as the seven names in
  `ZB_APPROACH_NAMES` — they come off the kill pages, not from a screen. A hunt with no badge anywhere
  means the heading is an eighth name, and one line in that list fixes it.
  **(2) The placeholders.** Whether the game writes *Pursue the Angler Crab* and *Fight on behalf of
  your Prisoner's Mask* the way the wildcards expect, and what it puts in place of `(garment)` for each
  of the six garments.
  **(3) The two titles that cover two options.** PARTAKE's *Allow your (garment) to join in* and the
  Lifeberg hunts: whether the game really shows one title in each case, or disambiguates them somehow.
  **(4) The figures nothing can read.** Whether a Low Tide push at Port Cecil really is 1 + the other
  faction's preparation, and whether the Maze-Garden's trades at Disposition 60 are about two thirds of
  the table, as the guide says.

- The **six Parabola badges** (added 2026-09-17). Nothing seen in the game. Report first, in order:
  **(1) The two storylets named for the quarry.** What *Pursuing …* and *Embattled with …* actually read
  as on screen, and what the game puts in place of `(its lair)` and `(Quarry Home)`. `phCanonical`
  matches the shape rather than a list, so a different wording is the one thing that would blank the
  whole second half of a hunt.
  **(2) The Calendar's option titles.** Whether the twelve events read as the Whim and Fancy quality
  pages have them, and whether a return visit really is a differently titled option. And whether the
  museum sits at Fancy 3, as the guide says, or Whim 3, as one wiki page says.
  **(3) The ten *Move out!* options.** Whether the game shows them all by that one title, as the wiki's
  numbering implies.
  **(4) The Cub's cats.** Whether all 22 introductions are on the storylet at once, and whether the
  Midnight Matriarch of the Menagerie of Roses is a separate introduction from the plain Matriarch.

- The **Parabolan Base-Camp badges** (added 2026-09-24). Nothing seen in the game. Report first, in order:
  **(1) The two titles that are each two storylets.** Whether *Reach towards the shore* and *Climb the dome
  itself* read as one title in the game, as the guide's talk of two identical storylets implies; if the
  Airs or Dominance variants carry a suffix on screen, each needs its own row or an alias.
  **(2) The option titles under Attend to Your Health.** That the two Parabola options read as the wiki
  has them, and that the storylet's London options do not clash. **(3) Whether the Tree Season a fertiliser
  reaches** is 1 or 2, which the wiki does not say. **(4) The Realisation card:** that the hand badge and
  the opened card both show, and whether its options read as the wiki has them.

- The **Piracy, Irem, Khaganian Intrigue, Helicon House and Jericho Library badges** (added
  2026-09-20). Nothing seen in the game. Report first, in order:
  **(1) The Khanate's two retitled options.** What *Expand your network: Recruit …* and *An
  opportunity: …* actually read as on screen. Ten and eleven titles are carried as aliases off the
  wiki's variant tables; a wording the tables do not have means that option goes unbadged, and for
  *Expand your network* that is nine days in ten.
  **(2) Piracy's bounty option.** What the game puts in place of `(Bounty)` in *Abandon your hunt for
  the …*, since the whole title is wildcarded on that assumption. And whether *Matters Piratical*
  really appears both in your cabin and while zailing.
  **(3) Irem's Loom headings.** Whether the ten storylets read as *The Loom: A Nearby Future* and so
  on, and whether a future's own deck really is only the three cards the guide's Warp Access column
  lists — the `▾ smuggle` mark is derived from that column and from nothing on screen.
  **(4) Helicon House's room titles**, especially *Below-Stairs* and the Prussian Salon's
  *Make polite conversation with …*, and whether the Airs of Ealing Gardens really shows exactly one
  of its four conversation options at a time. The Sculpture Garden is left out entirely: it is
  Fate-locked and has no wiki page, so if you have the Pendant, say what is in there.
  **(5) Jericho's shared titles.** Whether *Conclude your thesis*, *Resume your studies* and *Enlist
  qualified assistance* really show as one option each, as the merged rows assume.

- The **Canal Cruising, Barristering, Magistracy diving, Railway Board and Deciphering badges** (added
  2026-09-20). Nothing seen in the game. Report first, in order:
  **(1) The Magistracy's diving heading.** What it actually reads as at each floor. The wiki says the
  title *ends on* the floor's name, so `dvCanonical` matches "Diving in the Magistracy" and anything
  after it; if the game shows the bare floor name instead (*Peligin Water* and no prefix), every badge
  in the water disappears, and that is the single biggest risk in this batch. While you are down there,
  say also whether any quality list renders — if it does, the depth could be read instead of ranged.
  **(2) The Evenlode's trial headings.** Whether they read *Prosecution of Venge-Rat v Straggle-Toothed
  Urchin* and the like, and what the Airs put in place of *(Prosecute)*, *(Defend)* and *(Side)* on
  *Choose a case*. Same failure mode: a different shape blanks a whole trial.
  **(3) Jericho's *Leave the barge*.** Whether all six really share that one title, as the merged row
  assumes, and whether the fares are 5/10 and 3/6 as both the guide and the pages say.
  **(4) The board's option titles**, especially *Persuade Furnace*, *Persuade the Viscountess* and
  *Persuade Cornelius, the Bandaged Prehistoricist*, which are shorter or longer than the member's
  name; and whether *Bring the meeting to a close* really shows as one option.
  **(5) The Cabinet Noir's doubles.** Whether *Crack a code*, *Make a leap of code-breaking insight*
  and *Cover your tracks* each show as one option, as the merged rows assume.

- The **Disappearing, Cover Identities and Moonlit Woods badges** (added 2026-09-20). Nothing seen in
  the game. Report first, in order:
  **(1) Two features on one heading.** *Work in your Cabinet Noir* now carries a badge from
  `deciphering` AND one from `disappearing`. Confirm that both appear, that they do not flicker, and
  that neither clears the other — this is the first time two features badge the same storylet
  heading, and `attachBadge`'s sibling walk is what is being trusted.
  **(2) The camp storylets.** Whether *The Edge of the Woods*, *Whiling away the hours* and *Darkness
  at the camp* really read as those names when opened, since they are cards and this feature badges
  them as storylets; and whether *Consider your options* shows under that plain title.
  **(3) The Ghillie's other option.** What *Flatter the Ghillie to extend your visit* costs and gives:
  it has no wiki page and the guide does not mention it, so it is badged "no figures recorded".
  **(4) The Keeper's two forms.** Whether *Speak to the Keeper of the Marigold Menagerie* really shows
  as one option, and whether the Miserable Keeper's storylet carries the same heading — the reports
  are filed under one storylet name here.
  **(5) The Back Room's option titles**, especially *Begin to construct a cover identity*, which the
  wiki disambiguates as "(No Ties)" and which is assumed to show plain.

- The **Painting in Balmoral badges** (added 2026-09-20). Nothing seen in the game. Report first:
  **(1) Whether *Unveil your Painting* really shows as one option** under that plain title, as the
  merged row assumes, and whether the composition on the screen is the one the guide's table predicts.
  **(2) What a failed *Paint Balmoral in a subversive cast* actually does** — the guide says Painting:
  Nostalgic +1 and Painter's Progress +1, the option page records neither, and the badge currently
  sides with the guide and says so. This is the one figure in the feature that nothing corroborates.
  **(3) Whether *Crathie* and *Representational Arts* are the headings on screen**, the studio being
  reached by a redirect rather than named directly.

- The **Church, Law-Hunting, Moulin, Monograph and Kitchen badges** (added 2026-09-20). Nothing seen
  in the game. Report first, in order:
  **(1) The church's six qualities.** Whether a choice really moves the two the guide's tables say,
  and by the amounts given — every badge in that feature is those numbers and nothing else, and the
  consequence is a dozen actions away, so a wrong figure is invisible until the Inspection.
  **(2) Law-Hunting's titles.** Whether the options read plainly or still carry something of the
  Estival's wording, and what the game puts in place of *(type)*. Also whether *The Theory and
  Practice of Law* is the heading, the wiki disambiguating it.
  **(3) Moulin's discardables.** What their options are actually called — they are badged on the
  heading only because nothing records them, and naming them is the one thing that would finish that
  feature.
  **(4) The monograph's research titles.** Especially *Examine Khaganian Artefacts*, matched to the
  Rusted Stirrup by elimination; if it turns out to be another relic, that row is wrong.
  **(5) The kitchen's `(dish)` options.** What the game fills in, and whether *Dose yourself with
  (your dish)* and *Dose yourself with the Curatorial Cocktail* each show as one option.

- The **Alchemy, Cornelius, Clay Highwayman, Hurling, Chthonic, Digging and Marigold badges**
  (added 2026-09-21). Nothing seen in the game. Report first, in order:
  **(1) Hurling’s two kinds of swing.** Whether a card the guide calls “in favour” really flips with the
  bet, and whether Goat vs Goat over 100 really means the Second Circle wins — the option pages for
  *Collect your winnings* contradict themselves on their unlock, so the guide was taken for the win
  condition. Every badge in that feature rests on it.
  **(2) Hurling’s card names.** Whether *Cheers!*, *Make Way!*, *Uncooperative* and *Frozen* read as
  those exact names in the hand, and what the game puts in place of *(Number)*.
  **(3) The Adulterine Castle greeting.** The gate is confirm-only and the area string is a guess; a
  verbatim capture would let the four gated names be trusted anywhere and could make the gate exact.
  **(4) The Cornelius vote’s title.** Whether the Bridge Troubles suffix really appears, and with the
  en dash the wiki records.
  **(5) The Clay Highwayman’s camp headings.** Whether *Your Captor, the Clay Highwayman*, *Among the
  Marauders* and *The Clay Highwayman, alone* read as those names, and what the larceny cards’ four
  options are actually called — naming them is the one thing that would finish that feature.
  **(6) Alchemy’s storylet names.** *Factory VIII – After Hours* has no wiki page under that title
  and is taken from the redirect on *Enter the door marked ‘Special Extracts’*; and whether *Collect
  the marked crate* shows as one option.
  **(7) Digging’s dig difficulty.** Whether the Watchful check really moves with Hurlers: Darkness as
  50 × Darkness, the option pages showing a flat 150.
  **(8) Marigold’s *Accept a commission*.** Whether it and Helicon House’s really share the title, the
  wiki filing this one as “Accept a commission 2”.

- The **Airs of London badges** (added 2026-09-24). Nothing seen in the game. Report first, in order:
  **(1) Where the current Airs is shown.** Open any Airs-gated option and copy the requirement’s HTML —
  the unlock line that says “The Airs of London 47” — so `aolAirsFrom` can be wired to it and the
  badges can say which options are on offer *now*. **(2) The redirect titles.** That each redirecting
  option opens a storylet headed with the wiki’s redirect target (*Weasel-fanciers are abroad*,
  *Advise on a Tattooed Corpse*, *Uncover Society Indiscretions*, …), and that the option itself is
  listed under the title the table carries; the Great Game’s *Fascinate* options are carried under
  the wiki’s title and the storylet page’s shorter one. **(3) “One (gendertitle) and a weasel”.**
  What the game puts there. **(4) The Honey-Dens’ dream.** That all six really share the title
  *Deepen your acquaintance with Prisoner’s Honey* and that only one is offered at a time.

- The **Hunt is On! and Running Battle badges** (added 2026-09-24). Nothing seen in the game. Report
  first, in order: **(1) The Duelling heading.** That the storylet really is *Making your Name:
  Duelling the Black Ribbon* before A Name Scrawled in Blood 5 and *Duelling the Black Ribbon* after.
  **(2) Hunting Dangerous Prey’s and the Big Rat’s headings**, and whether *Jack-of-Smiles has
  expanded his interests* is the storylet that holds *Prowl the midnight streets* and *Move in for
  the kill* (the wiki files them under a page it numbers 2). **(3) The Firmament card.** That
  *Cutthroats and Canalmen* shows both THiO options at Firmament 450. **(4) The Labyrinth’s steps.**
  That *Meeting a junior keeper*, *The drownie keeper* and *The Tiger Keeper* are headed as the wiki
  has them, and that *The third coil* holds *Recapturing an escapee*. **(5) The narrow odds.** That a
  narrow spend really is certain four levels above its difficulty.

- The **Casing badges** (added 2026-09-24). Nothing seen in the game. Report first, in order:
  **(1) The storylet headings.** That the area-diving storylets are headed *Area-diving: Casing the Target*,
  *Area-diving: What to Do?* (or *Making Your Name: What to Do with the Box?*) and *Area-diving: a spot of
  blackmail*, that the paintings are *Steal Paintings for the Topsy King*, and that the theft list is headed
  *Thefts of a particular character* rather than the wiki’s *Thefts of Particular Character*.
  **(2) Whether the prelude’s options really cost 3 and 5 actions**, which the pages say and the guide
  agrees with. **(3) The scouting difficulty.** That Shadowy 300 is at Darkness 0 and how far one level of Darkness
  moves it. **(4) The three untouched larceny options** that share the other cards’ pattern: the four
  *Join a scouting party* titles and Burrow-Infra-Mump’s Suspicion 4.

- The **Fascinating and Inspired badges** (added 2026-09-24). Nothing seen in the game. Report first, in
  order: **(1) The romance storylets.** That the court ladder is headed as the wiki has it (*Attend a ball in
  aid of a good cause*, *Sparkling wit*, *The Wit and the Physician*, … *Conclude your affair with the Barbed
  Wit*) and that each level shows the options the pages list. **(2) The seductions’ headings.** *Seduce a
  Struggling Artist’s Model: the resolution!*, *Become Better Acquainted with a Charming Young Heiress: the
  Resolution!* and their kin, and *A gentleman to remember* / *A lady to remember*, which the wiki numbers 2
  and 3. **(3) The commissions’ headings** (*Publish your experiences with prisoner’s honey*, *Commission: A
  Royal Portrait*). **(4) The Ambassador’s Ball.** Which of Commission a painting and Dance with a certain
  someone it shows. **(5) The unrecorded amounts** (`↑`): what *Draw the eye* and the Dowager add to “Seen with
  the Unattainable Fashion-Flies”.

- The **Investigating badges** (added 2026-09-24). Nothing seen in the game. Report first, in order:
  **(1) The University’s heading.** The wiki files the six investigations under *Making Your Name:
  Investigations in the university*; what is the heading in the game now, after the July 2026 update, and
  does *Interview the Department of … staff* read as the placeholder? **(2) The Correspondence
  Stones.** Which storylet holds *The Correspondence* (the wiki files it under the quality and the
  page *Investigating the Stones 2*). **(3) The card names in the Upper River**, and whether
  *Halfway to Hell* and *Cells outside the City* are drawn as those cards; none is gated on a
  greeting because their names are distinctive. **(4) The Phoenix option’s two costs**, 15 or 55, and which one you see.
  **(5) The Curate’s six storylets** show at the bands the pages give (below 7, 3–8, 7–20, 8–14,
  10–20, 14).

- The **Someone Is Coming badges** (added 2026-09-24). Nothing seen in the game. Report first, in order:
  **(1) The payout card.** That *A Gift from the Capering Relicker* shows all eight payouts and each takes 21 CP
  rather than resetting the quality, and that the ones behind a Fate item appear at all. **(2) The eighteen
  card names**, several of them ordinary English (*Weather at last*, *Rats Next Door*, *Jack strikes again*, *A
  past benefactor*): are they the titles the game shows, and does any other card share one? None is gated
  on a greeting. **(3) The drunk rat.** That it is an option of *Rob a drunk* and that 6 CP is what it takes.
  **(4) Which failures still raise it**, since the pages record it for two Luck options only.

- The **Hellworm badges** (added 2026-09-25). Nothing seen in the game. Report first: **(1) The card.** That
  *Your Very Own Hellworm* is drawn at the Upper River stations once a Hellworm is equipped and shows the six
  options; whether *Milk your hellworm* really needs Kataleptic Toxicology 5. **(2) The Nightmares range** of a
  play (−1 to −8 by the page, −1 to −7 by the guide).

- The **Risen Burgundy badges** (added 2026-09-25). Nothing seen in the game. Report first, in order:
  **(1) The hunting card’s title.** That it reads *Hunting the …* with the quarry, and whether the option is
  *Go for glory* and *Stay with the pack*. **(2) The Weaver’s four cards.** That they really share the title *A
  Delivery from the Gall-Eyed Weaver* and the option *Unroll your textiles*. **(3) The payout cost.** That a
  Beneficence or Against Time and Kings payout takes 10 of the quality (the pages say 10 x). **(4) The two
  autoplay cards** (*Stopped by the Guards*, *Recognised in the Street*): that the options carry the same titles as
  their twins on the other card. **(5) Saint’s Day progress:** that each option really raises it by 1 and
  a payout appears at 15 or 25.

- The **Station Developments badges** (added 2026-09-25). Nothing seen in the game. Report first, in order:
  **(1) The Offices headings.** That each station’s branch really reads *Offices of the Tracklayer’s Union: X
  Branch*, and that Magistracy is *Evenlode Branch* and Jericho Locks is *Jericho Branch* (the pages say so; the
  Marigold and Ealing ones were not confirmed for every improvement). **(2) Improvements the pages do not
  place.** Which Ealing Gardens, Jericho and Hurlers improvements are in the Offices storylet rather than
  another one; those in the wrong place show no badge. **(3) The two-page titles.** That *Improve your
  canteen* and the others really show one title at both levels. **(4) The Ealing conversions** the guide lists
  under Commercial District levels, whose storylet is unknown, and which would earn badges if named.

- The **City of the Tracklayers badges** (added 2026-09-26). Nothing seen in the game. Report first, in order:
  **(1) The card titles.** That *Whitsun* and *The Sound of Wings* show without the wiki’s brackets, what the three
  leader cards (*Cornelius Leading …*) and the three ideology cards (*The … Way*) are actually called, and that
  the option titles with a placeholder (*Look towards (Chosen Site)*, *Meet your neighbours at (Pub)*) read as
  the place name. **(2) The two-page titles.** Which page you see for *Help interpret Hinterland fossils*, *Greet
  the Merry Gentleman* and the others, and whether their figures match the badge’s range. **(3) The narrow
  certain-pass value.** Whether a narrow challenge of difficulty 10 is certain at 14 (this script) or 15 (the
  guide), given the option badges say `?` and the tooltip says the guide’s number. **(4) The Efficiency.** Whether
  Hinterland Efficiency can be read off the Myself tab, since then `Eff` could be a number.

- The **Station Statues badges** (added 2026-09-26). Nothing seen in the game. Report first, in order: **(1) The
  statue storylets.** That Station VIII’s statues really sit in *A Selection of Statues*, the Hurlers’ in
  *Commissioning a Statue* and Marigold’s in *Consider building a statue at Marigold Station*, and that the other
  six are in the Offices branch you already know. **(2) The card titles.** That the Ealing card is called just
  *Under the Statue*, and what the seven others read. **(3) The option titles with a subject.** That the sketching
  option reads *Practice sketching the Statue to …* and the graffiti one *Read the graffiti on the Statue to …*,
  and what the Fate options read. **(4) The Marigold options.** Whether the card offers the sketching option too
  (the wiki page does not list it).

- The **Menace Locations badges** (added 2026-09-26). Nothing seen in the game. Report first, in order: **(1) The
  greetings.** What the sidebar says in each of the five places, verbatim: the card badge in the hand appears only
  when the greeting contains the location’s wiki name (*a slow boat passing a dark beach on a silent river*,
  *Disgraced exile in the Tomb-Colonies*, *New Newgate Prison - again!*, *A state of some confusion*, *The
  Mirror-Marches*). **(2) The card titles.** That the numbered wiki cards (*A white cat!*, *The view from your
  room*, *The new cell*) and the bracketed ones (*You’ve unfinished business in the world of the living*) show
  without the suffix. **(3) The two-page titles.** Which of *A white cat!*’s two effects (Manager +1 or
  Nightmares −3) you see. **(4) The red cards.** That they play from the hand with one click and no action.

- The **Iron Republic badges** (added 2026-09-26). Nothing seen in the game. Report first: **(1) The Day
  headings.** That each reads *Day N, Title* as the wiki gives it, and what Day 81 is called. **(2) The doors.**
  Whether any option sends you to a different day than its badge says, and what *Take this demagogue for tea
  and muffins* does. **(3) The challenge figures** where the guide is one off from the pages.

- The **Firmament badges** (added 2026-09-26). Nothing seen in the game. Report first: **(1) The storylet
  headings.** Whether the ones the wiki prefixes with *Firmament:* show without it in the game, and whether the
  Naples day is *Napoli, 1899*. **(2) Any badge that differs from what the choice did**, especially the `=` ones,
  which are the guide’s wording for a set. **(3) The ⚠ lines.** Which the game settles.
- The **Discordant Studies badges** (added 2026-09-26). Nothing seen in the game. Report first: **(1) The titles.**
  Whether *Discuss the Hurlers* and *Approach the Anchoress* show without the wiki’s numeral, and that *Close your eyes*
  exists (its page carries no storylet, so it is on the guide’s word). **(2) The step order.** Whether the levels
  the badges say match what you see.

- The **rest of Risen Burgundy and the Plaster Face badges** (added 2026-09-27). Nothing seen in the game. Report first:
  **(1) The Burgundy card titles.** Whether *Firmament: To be Feasted* shows as *To be Feasted*, and whether the
  numbered wiki cards show without their numeral. **(2) The dreams.** That the seven *A Dream of …* cards play from
  the hand for no action. **(3) The Plaster Face levels.** That each step really sets the level the badge says,
  worked out from the next storylet’s unlock, and that the four cards (*Sartorial squeamishness*, *The Departed*,
  *Rat Melancholy*, *The Albino Rat’s story*) are titled so.

- The **transcribed numbers**, here and everywhere else in this script -- the per-depth Favour
  table, the Sights bands, the Airs windows, the item roster. This is not the sort of thing
  looking at the screen can confirm: a wrong number renders exactly as well as a right one. They
  are pinned by tests against the wiki, and the Sights-band mapping in particular came off the
  five option pages rather than the guide's summary table, which disagrees with them.

Everything else in this script is confirmed live. Keep it that way: when you add something that
rests on markup you have only reasoned about, say so here and in the code, and move it up only
on a report.

## Verifying a change

There is (almost) nothing to run here. Validate by reasoning about the DOM the script targets
and, when possible, by installing the edited file in a userscript manager against the live page.
Don't claim a script "works" from static review alone — say it's untested in-game.

The exception is the bits of **pure logic** worth verifying without a browser. Those are covered
by **standalone Node test scripts** in the `tests/` folder at the repo root, named
`*.test.mjs`. Each is dependency-free (no runner, matching the no-build convention): it
names its script's IIFE, evaluates it against a stub DOM, and returns the internals to assert on.
Run one directly, e.g.:

```
node tests/iotm-cup13-sort.test.mjs
node tests/quest-helper.test.mjs
```

Current tests:

- `tests/auto-mine-parse.test.mjs` — asserts `auto-mine.js`'s reading of
  `mining.php`: the four 36-character state strings KoLmafia's `MineDecoratorTest` pins to KoL's
  real responses, round-tripped through a rebuilt page; a verbatim two-row excerpt of the real
  markup, which is the only thing pinning KoL's actual attribute order and quoting; that `which`
  is `col + 8*row`; that a partial grid reads as *no* state rather than a short one; and that a
  dig's result stops at the grid, because the mine redraws opened squares with the art of what
  they held and an unscoped read reports gold forever after the first one. Extend it before
  touching either reader.
- `tests/auto-mine-strategy.test.mjs` — a direct port of loathers/oreo's
  `test/strategy.test.ts`, kept in its order, minus the parts that need KoLmafia and minus the
  calibration harness this port doesn't carry. It also pins the calibrated λ table and the
  1226 six-square ore veins. This file's job is to say the strategy still answers the way oreo's
  does, so when oreo changes, re-port from their file rather than editing numbers here.
- `tests/auto-mine-advice-box.test.mjs` — asserts `auto-mine.js`'s advice box
  on `mining.php`, which is also where the Start button lives. It pins the regression that
  moving the button out of the charpane created: the advisor repaints its line on every load
  by setting `textContent`, and doing that on the *box* deletes every child, so the button is
  gone the first time any advice is painted. The box is a row of a text span and the button,
  the advisor only ever writes to the span, and both a reset verdict and a dig verdict are
  painted here to prove the button survives. It also pins the two ids other things key off and
  that a second `adviceBox()` call adds no second button.
  Its second half pins the *other* way the button vanishes: `makeController` must not throw for
  the **shipped preferences**. It did — a dynamite field of 0 or blank becomes a price of
  `Infinity`, and `setDynamitePrice` refused that through `Number.isFinite` — so the advisor
  died before painting and took the button, and with it the panel, out of reach. Blank, 0,
  unreadable text and a real price all have to build; negatives and NaN still have to be
  refused. Verified to fail against the pre-fix `setDynamitePrice` before being kept.
- `tests/auto-mine-character-key.test.mjs` — asserts `auto-mine.js`'s
  `characterName()`, which suffixes both of its `localStorage` keys. It pins the reported bug:
  a charpane mid-reload (what pressing `ux-enhancers.js`'s button causes) has no
  `charsheet.php` link, and answering `'unknown'` there switches both stores to an empty
  bucket — the day's turns read 0 and come back a moment later. A failed probe must fall
  through to the last known name; a probe that *succeeds with a different name* must still
  win, or a multi inherits the other character's cavern. Both directions are pinned here,
  along with `api.php` as the authoritative source and the cleanup of stray `:unknown`
  buckets. Verified to fail against the pre-fix ordering before being kept.
- `tests/auto-mine-daily.test.mjs` — asserts `auto-mine.js`'s daily turn
  counter and its low-HP heal gate. The day key comes from `api.php`'s `rollover` first
  (`daynumber`, then the browser's date, are fallbacks), because resetting on the *browser's*
  midnight would cut a KoL day in half. It pins that reading the counter with a new day key is
  the reset, that a free mining action adds nothing (the adventure total didn't move), that
  eating adventures credits no turns, and that a run spanning rollover restarts the day's total
  without restarting its own. On the heal side it pins the two refusals that must not turn into
  a poll for something that cannot happen: a max HP at or below the floor, and no
  `ux-enhancers.js` button in the charpane.
- `tests/quest-helper.test.mjs` — asserts `quest-helper.js`'s per-stage hint
  lookup resolves correctly. If you add quests/stages to that hint map (especially
  overlapping-text stages), add a case here too.
- `tests/ux-mall-buy.test.mjs` — asserts `ux-enhancers.js`'s mall purchase
  planner against the real numbers from a "perfect negroni" search: that a daily limit caps
  stock, that allocation is cheapest-first with price ties keeping page order, that the
  average is over what would actually be bought (not what was asked for), and what the confirm
  text and post-run summary say. It also pins the reporting contract that a real bug turned
  up: an unrecognised purchase response yields `null` ("says nothing"), never 0 ("nothing was
  bought"), and an unmeasurable run must admit it rather than claim either that nothing
  happened or that the Meat is untouched. This is the money path — extend it before touching
  the planner, never after.
- `tests/ux-beer-garden.test.mjs` — asserts `ux-enhancers.js`'s beer garden
  yield table against the wiki's (3 barley/hops per day, clamped at day 7; day 1 gives no
  fancy item and day 2 gives the first, which is where the threshold comes from), what the
  `confirm()` text says, and that `findBeerGarden` reads the day off the artwork while
  ignoring other crops and other campground images. If you touch the table or the artwork
  regex, adjust this test.
- `tests/ux-inventory-mall.test.mjs` — asserts `ux-enhancers.js`'s inventory
  `[mall]` link: that the search term is the name in quotes (exact match, not substring) and
  survives apostrophes, `™` and a quote embedded in the name; that `t=0` suppresses the link
  while an unreadable `rel` doesn't; and that re-running (the observer fires on every DOM
  change) never stacks up a second link.
- `tests/ux-mcd-link.test.mjs` — asserts `ux-enhancers.js`'s monster
  aggravation device line: the sign→device map (with Platypus/Opossum/Marmot pinned to
  Canadia, the trap a stat-based grouping falls into), KoL's own URLs and dial ranges, that
  both panes' labels for a device are recognised so the line is never duplicated, that a
  last-adventure link to Hey Deze is *not* mistaken for the Heartbreaker's line (which is
  why the label rather than the href identifies it), and the compact/expanded discriminator.
- `tests/ux-daily-dungeon.test.mjs` — asserts `ux-enhancers.js`'s Daily
  Dungeon skip marker. The half that matters is negative: every *other* label the wiki lists
  on those four screens is pinned as unmatched, above all **Try the doorknob** and **Proceed
  forward cautiously**, because a green outline on either of those is worse than no feature
  at all. It also pins that each free option belongs to its own room only (lockpicks don't
  match on the trap screen, the boring door doesn't match on the door screen), that the
  skeleton key is absent from the table rather than merely unmatched, that a non-dungeon
  `whichchoice` and a page with none are both left alone, and that a second pass — the same
  page re-scanned — adds no second note. Extend it before adding an option, and take the
  label verbatim from the wiki rather than retyping it.
- `tests/daily-checklist-seeding.test.mjs` — asserts `daily-checklist.js`'s
  `applySeeds`: order on a fresh list, and that a new default reaches a list someone already
  has, in the right place and exactly once. Two traps it pins down — resting, the tea tree
  and the garden all link to plain `campground.php`, and a seed's url is only its identity
  when **one** seed uses it (`SEED_URL_USES`), or the new pair would match the resting entry
  already in the list and never seed at all; and since there's no reordering UI, a new
  default is spliced in after the seed it follows in `SEED_ITEMS` rather than appended, so it
  doesn't land at the bottom of an existing list. Add a case when you add a seed that shares
  a url with another, and remember to bump `SEED_VERSION`.
- `tests/quest-helper-rotation.test.mjs` — asserts `quest-helper.js`'s
  Control Freak logic: the turntable arithmetic, what each of the five stops does for each
  inventory state, undo as the exact inverse, the "a turn re-buries the chamber" rule, and
  that a simulated run from a fresh pyramid costs exactly the wiki's 10 wheels. Note it
  cannot use the usual append-a-return trick — the script's page dispatch bails early — so it
  hands the helpers back by replacing the `const puzzle = currentPuzzle();` line instead. If
  you touch that line or the rotation state machine, adjust this test.
- `tests/quest-helper-8bit.test.mjs` — asserts `quest-helper.js`'s 8-Bit
  Realm advice: the colour→zone→snarfblat map, the fixed black/blue/green/red cycle, the
  points formula (nothing below the floor, 10 per 10 over it in the bonus zone and per 20
  outside, capping at 400 and 200 — the bonus is exactly double), the chest distances, and
  that an unrecognised colour yields no advice. It also parses the real charpane markup
  through both paths (the labelled span, and the `<font color>` fallback). Uses the same
  replace-the-dispatch-line trick as the rotation test.
- `tests/quest-helper-combat.test.mjs` — asserts `quest-helper.js`'s
  fight.php combat cues: that KoL's own round markers fire them (using the literal comment
  payloads from KoLmafia's fixtures) and that neither cue answers for the other's, that an
  ordinary round fires nothing at all, and that the prose fallback still catches a round
  with no marker. The case worth keeping is the monster-id table: the tool-carrying gremlin
  ids are in the map and the **tool-less ones next to them are not**, and a name-only match
  is flagged unsure so the advice hedges instead of promising a tool. Extend it before
  adding a cue, and pin the new marker with a real payload rather than an invented one.
- `tests/quest-helper-sven.test.mjs` — asserts `quest-helper.js`'s Sven
  Golly overview: the wiki's answer table in both directions (who takes what, and who each
  item is for), that each trait is craved by exactly one member and hated by exactly one,
  and the third verdict the two-state reading misses — an item carrying neither trait is
  *shrugged at*, and eaten anyway. The cases that matter are the two shared items: one
  blotter paper must be planned for one member, not both, and must not read as available on
  the other's row; an exclusive item is spent first so the shared one still reaches whoever
  has no alternative. It also pins the reporting contract — an unreadable dropdown says so
  instead of claiming an empty bag, which would send you off to spend turns you don't need.
- `tests/quest-helper-merkin.test.mjs` — asserts `quest-helper.js`'s Mer-kin
  Deepcity work. For the Colosseum: the counter mapping (each gladiator is beaten with the
  *next* weapon round the cycle, never his own — inverting it is the likeliest edit-time
  mistake and would spend a round on a skill that does nothing), the monster and skill ids,
  that each telegraph sentence fires its own special and an ordinary round fires none, and
  that a telegraph with the skill missing reads as "wrong weapon", never "cast it anyway".
  For the dreadscroll: the ceiling-division scoring of Deep-Tainted Mind (3x, 3x-1 and 3x-2
  all mean the same number of wrong words); that a clue is only read off the page that
  *prints* it, above all that the scroll's own page — every candidate word on screen at once
  — yields nothing; and the solver, including that a failed reading narrows the field, that
  contradictory input reports zero rather than guessing, and that an unscoreable reading is
  dropped whole rather than half-applied.
- `tests/auto-combat-fight-state.test.mjs` — asserts `auto-combat.js`'s
  fight-state reading, macro lookup and remembered-choice rule, against markup copied verbatim
  from KoLmafia's fight and choice fixtures. The case the whole file exists for: an open fight
  and a **finished** one carry the *same* block of combat forms, so `hasFightForms` is true for
  both and only `window.fightover` separates them — read it the naive way and the engine posts
  an attack into a closed fight every turn. It also pins that no fixture carries a `whichround`
  to send, that the macro name matches however the player capitalised it without matching a
  near-miss, that a remembered option the page isn't offering falls back to asking, and the
  Haunted Bedroom's option numbering — "Ignore it" is option 6 on four nightstands and 4 on the
  fifth, which is why the engine reads the value off the hidden input rather than counting
  buttons. It also covers the bedroom's `plan`: that the substat drawers are taken without
  asking, that the ghost-key step is skipped by *not being on the page* rather than by any
  inventory check, that the mahogany's bottom drawer and the rustic's jilted mistress are never
  picked, and both directions of the number/label agreement rule. The Palindome's plan is
  pinned the same way, plus its talisman guard (read off `api.php`'s accessory slots), that a
  ticket counts as acquired only off an acquire line — the encounter's prose names the raffle
  either way — and that the daily tally resets by comparing day keys rather than by any timer.
  The Haunted Storage Room's plan is pinned the same way, plus that a ghost key is counted only
  off an acquire line (several at once included) and that a drop never ends the run; and stop
  on level up reads a level change only when both `api.php` readings exist.
  The zone-independent rules
  are pinned the same way: the peridot choice takes the peace option by *value*, a different
  encounter offering the same label is left alone (the rule is keyed on the name), and a page
  without that label falls through to asking. Plus that one option is taken and two are not. Plus the last-zone reading:
  `lastadv` parsing, and that a `place.php` action url is not a grindable zone. Note it
  re-exposes the internals by replacing the single `bootButton();` line; move that line and
  this test needs the same edit.
- `tests/iotm-cup13-sort.test.mjs` — asserts `iotm.js`'s Cup-of-13s option
  parser and each ingredient sort order (advs / effect / inventory / name). If you touch that
  parsing or the sort comparators, add/adjust a case here.
- `tests/iotm-ball-refusal.test.mjs` — asserts `iotm.js`'s Play Ball
  refusal sniffing: the daily-limit wording marks the diamond spent for the day, the
  "you need to recruit N more foes" wording (only ever said while innings remain) *clears*
  a stale spent flag, and anything else — a played inning, an unrelated page — leaves the
  flag untouched. The subdued button state rests entirely on these two regexes; extend the
  cases if the game's wording moves.
- `tests/iotm-codpiece-categories.test.mjs` — asserts `iotm.js`'s codpiece
  gem bucketing: every `MR_STORE_GEMS` entry matches both its item name and its enchantment,
  no entry claims another's label, near-miss mundane gems (torquoise's `Weapon Damage +10%`,
  `So-So Spooky Resistance`) stay out of the Mr. Store bucket, and the pre-existing buckets
  still resolve. Also covers `planMrStore`, the "Insert all" planner (removal phase, consecutive
  slot packing, unowned gems). Add a case when a new IotM gem or category shows up.
- `tests/choice-crowds-of-spite.test.mjs` — asserts `choice-helper.js`'s Crowds of Spite
  ratings against the wiki guide's table, plus the traps that would silently break the badge:
  name matching squashes punctuation (`A... pickpocket?`, `A Constable!`, `The Rat-Catcher`)
  without colliding two cards; `headingName()` ignores a `wiki-links.js` "W" already inside the
  heading *and* any `.fl-ux-badge` (so a future feature's badge needs no change there); and
  re-attaching to a container React has reused for a different card redraws the badge rather
  than leaving the old rating (or, for a card outside the area, clears it). It also pins that
  the two trophyless cards get a word rather than a `+null`, that the dagger marks exactly the
  two inferior-skill-table targets, and that two features badging one element don't clobber each
  other's flag. It also drives the **area gate** through a settable greeting: Spite in, a
  recognised elsewhere out, an unknown or unreadable area still in (the permissive direction),
  and a badge drawn in Spite actually coming off when you leave. Extend it whenever you touch
  `SPITE_CARDS`; a new feature with its own pure logic gets its own `choice-*.test.mjs` (or, for
  a UX Enhancers feature, `ux-*.test.mjs`) beside it.
- `tests/choice-zailing.test.mjs` — asserts `choice-helper.js`'s Zailing feature. Two
  halves. The first is the transcription: the routes, the Zee Peril per region, the eight black
  cards, that every zee-threat names a card that actually exists, and the handful of numbers a
  voyage is planned around (Your False-Star's free -5, the Giant of the Unterzee's flat 80, the
  Snares' slow line, and A Spit of Land's -1, which is pinned *because* the guide's table says
  -2). It also pins that no name is in both `ZEE_CARDS` and `SPITE_CARDS`, which is what stops
  two features drawing in the same corner. The second half is the ranking, and it is the part to
  extend before touching `bestZeeLine`: cheapest Troubled Waters first with progress as the
  tie-break, the expected-value treatment of Luck options with its arithmetic pinned outright,
  gated and piracy lines never quoted, and a card with nothing else admitting `gated` rather than
  going quiet. Then the badge marks, the two prefix-matched bounty cards, the `strictZee` gate in
  all three greeting states, and redraw-on-reuse (React hands the next card the same container).
  It also pins `ZEE_PORTS`: the nine safe docks as a list (so a tenth cannot appear by accident),
  the three-valued `safe` field with one row of each kind, the two Fate-locked destinations, the
  recorded Port Cecil / Tanah-Chook conflict, that every port names a region `ZEE_REGIONS` knows,
  and that the regions with no safe dock at all are derived rather than hard-coded.
  It also builds the whole panel, the way `ux-factions.test.mjs` does, since that is the only way
  to catch a typo in a few hundred hand-built nodes -- including that a multi-region card is
  listed under each of its regions while an everywhere card is listed once.
- `tests/choice-port-carnelian.test.mjs` — asserts `choice-helper.js`'s Port Carnelian
  feature. The transcription first, and the cross-check that makes it worth carrying twice: the
  guide's Net column against the currency changes it is the sum of, row by row. Then the rules a
  plausible tidy-up would quietly invert — that `either` is worth its figure **once** and only
  the two rows the guide marks use it; that the four Time 12 endings have a `net` of null rather
  than 0, so they cannot be ranked alongside the row that really does net nothing; that the
  Legitimacy mark is on the rows paid for out of Legitimacy and off the ones that are not; and
  that no two of the nets this table actually pays share a colour (the "adjacent steps differ"
  check would pass through a real collision — see the Fruits of the Zee palette). Then the
  two-branch storylets: the badge takes the better net, the tooltip keeps both, and each branch
  badges in its own right. Then name lookup, including the `"…: "` prefix tolerance, and the
  gate in all three greeting states with the two `strict` rows pinned by name. Then the shape of
  the screen itself, which is the bug that made this feature draw nothing at first: that
  `pcHeadingSpec` resolves a guide storylet arriving as an **option** and a guide branch arriving
  as a **storylet**, that the container *Matters of State* and the six options the guide does not
  price are left alone rather than guessed at, and — over a stub of the captured markup, run
  through the registered `port-carnelian` pass rather than its pure parts — that a real screen
  comes out badged option by option and that a `strict` row redraws when the greeting arrives
  instead of keeping its flag. It also pins that no Port Carnelian name is in `ZEE_CARDS`,
  `SPITE_CARDS` or `FOTZ_CARDS`, and builds the whole panel, which is the only way to catch a
  typo in a few hundred hand-built nodes. Then the **cash-out calculator**: `pcRound` pinned as
  bankers' rounding outright, the formula reproducing the guide's whole tier table with the one
  dissenting row (35) named rather than rounded around, a Favour worth 0 and marked, Tribute
  riding on a quality and never on the total, the Society cap paying nothing rather than
  something wasted, an unread figure coming back as a label or a dash rather than a zero, a
  stale one marked, and the background refresh booked once — only with an ending on screen, and
  not again on the next scan. It ends by banking a reading and running the pass again, which is
  the only thing that shows a badge redrawing on numbers that arrived without the page changing.
  Extend it whenever you touch `PC_OPTIONS` or `PC_CASHOUTS`.
- `tests/choice-scientific-voyages.test.mjs` — asserts `choice-helper.js`'s Voyages of
  Scientific Discovery feature. The centre of it is the **ambiguity**: that a branch name
  shared by the three islands resolves to `null` without an island and to the right row with
  one, that each island's gambles pay that island's own page type, and that an opened
  storylet named after an island answers when the greeting cannot. Then the Luck arithmetic
  pinned outright (`9.5` against `1.5`), and that the storylet badge follows it rather than
  the advertised figure. Then that a row paying no pages is **labelled** rather than scored
  and that every such row has a `headline` to show; that `orElse` never merges into the page
  counts; that each island's advertised page type is the one it pays the most of — the one
  stated-versus-derived cross-check this table supports; and that no name of its is in any of
  the four other tables. It also drives **all three** `.branch__title` features at once, which
  is the only place the sibling-run clearing is exercised three deep, and builds the panel.
- `tests/choice-university-lab.test.mjs` — asserts `choice-helper.js`'s University
  Laboratory feature. The centre of it is the **arithmetic**, since the badge is a formula: half-to-even
  rounding and the up/down exceptions, the brief-project and Unorthodox Methods S-curves, the team
  formula against all four worked examples on the option pages, `labDraft` and `labCollated`, and that
  a missing input is `null` rather than 0. Then the **cross-check**: every student tier option's
  formula at Equipment 7 against the guide's Student Table, with the nine disagreements pinned by
  name and each one proved to really disagree. Then the ranking rule on real cards — the level 5
  expert option with `▾` for the hunch, a range over the tiers with the level unread, a range over
  Equipment 1–9 with nothing read, the Luck expectation, `✦`, `▼`, `~`, PR, labels, and an expert's
  card saying only `▾` when the project is unread. Colour contrast in both directions, and that the
  text alone separates a range, PR and a label. Same-named options on one card; the gate in all
  three greeting states and the deck confirming the lab; `labRatings` end to end on an opened card
  (options badged only inside a lab card, a strict card silent until confirmed); **four** features
  on one `.branch__title`; no name in another table; the reference tables; and the whole panel.
  It passes a `localStorage` stub with auto-refresh off, so no hidden frame or timer is started.
- `tests/choice-arbor.test.mjs` — asserts `choice-helper.js`'s Arbor feature. The
  transcription row by row (challenges, flat outcomes, the six scaling rows, the options costing no
  Permission to Linger, the guide's option count per district) and the four guide disagreements
  pinned by name; the cross-checks (a trip is 1 + 7 + 1 actions, `arborCertainAt` reproducing the
  guide's Watchful 125 and 167, and the floating-point case); the badge text for every kind of
  row, including that no scaling row shows a digit; colour following the Attar direction and the
  **text alone** separating a gain from a spend; `null` against `0` Permission to Linger in the
  tooltip; the lookup (nothing off an Arbor screen, *Light your candles* only with the city known,
  the card's options only on the card); the gate in all three greeting states and the open
  storylet beating it; `arborRatings` end to end on an opened storylet, a city change redrawing the
  same heading, and the storylet list; no name in any other table; three features on one
  `.branch__title`.
- `tests/choice-myn-carousels.test.mjs` — asserts `lb-industries`,
  `menace-eradication` and `vertiginous-horticulture` and the shared carousel plumbing, in one suite
  because they share it. The plumbing: placeholder titles matching the game's filled-in titles and no
  other bracket, ranges, `broadCertainAt`, and no option found outside its own open storylet. Per
  feature, the transcription and its cross-check — the guide's Min for 100% (L. B. Industries), each
  page's example difficulty at a stated Savagery (Menace Eradication), the guide's Average Gain and
  sale figures at 150 (Horticulture) — every guide disagreement by name, the badge text of each kind
  of row, and Horticulture's Difficulty ranges per `only`. Then no name in another table or another
  carousel, the three registered passes end to end on switching open storylets, and a listed
  storylet's summary.
- `tests/choice-forgotten-quarter.test.mjs` — asserts `forgotten-quarter`. The guide's
  cross-checks (approach Watchful for 100%, Rivals per Progress, Rumours of treasure's 1.4),
  every expedition's length, Archaeologist, Fate and worst-case Supplies, badge text for each kind of
  row including menaces always raised on the badge and failure-only ones kept to the tooltip, the
  three guide disagreements by name, both alias kinds, a title shared by two storylets resolving by
  the open one, every storylet summary listing all its options, the registered pass end to end
  across three storylets, and no name in another table.
- `tests/choice-cat-and-mouse.test.mjs` — asserts `cat-and-mouse`. The guide's maximum
  Cat per case (63, 67 for the Medium) rebuilt from the table, its Echo costs, the Luck lines'
  expected Cat, the two-Mouse badges, what each case start pays, every ending storylet having a
  60+, a 50+ and a <50 option, the guide disagreements by name, titles shared by the two pursuit
  storylets resolving by the open one, the wiki-suffix aliases, the registered pass across both
  pursuit storylets, and no name in another table.
- `tests/choice-season-in-soup.test.mjs` — asserts `season-in-soup`. The S-curve against
  the guide's 240 Hints at the cap, the three ranges, the cap, half-to-even rounding, the week table
  against the guide's, the three noises, badge text, `soupWeek`, no duplicate title in any week's
  index, the registered pass redrawing Promenade when its week stops being readable, and no name in
  another table.
- `tests/choice-long-dead-god.test.mjs`, `choice-engaged-in-a-case.test.mjs`,
  `choice-sunken-embassy.test.mjs`, `choice-law-furnace.test.mjs`,
  `choice-prelapsarian-museum.test.mjs` — one per feature. Each pins its table's shape, the guide
  cross-check (38 escape payouts; the pages' Case Difficulty 10 figures; Min for 100%; `lawBase` at
  the guide's example; the museum's certain-at stats and expected menaces), badge text for each kind
  of row, the guide disagreements by name, the registered pass end to end, and no name in another
  table. The Long-Dead God suite also runs the Rain/Geology gate in all three greeting states and
  the hand-card badge; the museum suite the Assert placeholder titles; the Law-Furnace suite the
  *Persona Non Grata* alias.
- `tests/choice-on-a-heist.test.mjs`, `choice-spider-symposium.test.mjs`,
  `choice-short-stories.test.mjs`, `choice-flash-lays.test.mjs`, `choice-social-actions.test.mjs` —
  one per feature: the table's shape, the cross-check (heist expectations and the hand's Tread-first
  ranking with `▾`; the symposium's Min for 100% and Average Gain; the stories' Echo differences;
  the Flash Lay 2.5× difficulty rule and its one exception; the correspondence thresholds), badge text
  per kind of row, the guide disagreements by name, the registered pass (including a hand card for
  the heist and the Flash Lay), and no name in another table.
- `tests/choice-cave-of-the-nadir.test.mjs`, `choice-empress-court.test.mjs`,
  `choice-breeding-monsters.test.mjs` — one per feature: the leaving-penalty table, the hand ranking
  and ▾, and the strict gate in all three greeting states (Nadir); Inspired 17 / 24 as 153 / 300 CP
  and every work's 17 / 30 Echoes (Court); every beast's expected Echoes against the guide and the
  same breeding title resolving by storylet (Breeding); badge text, guide disagreements by name, the
  registered pass, and no name in another table.
- `tests/choice-mahogany-hall.test.mjs`, `choice-master-classes.test.mjs`,
  `choice-sixth-coil.test.mjs`, `choice-rat-market.test.mjs`, `choice-boxful-of-intrigue.test.mjs` —
  one per feature. Each pins the cross-check its transcription rests on: the seven days needing Tales
  8…14 in order and no show's failure costing less CP than its success (Mahogany); a lesson paying its
  own difficulty in goods, and the narrow +4 rule with its **one** stated exception (Master-Classes);
  the three saturation bands reproducing every Rat-Shilling price the guide prints, from the nominal
  value alone (Rat Market); four bands × two storylets × two options with one per side, and
  `broadCertainAt(130) = 217` (Boxful). The Sixth Coil's is the odd one: it **rebuilds every title the
  four randomiser qualities can produce** — verb × direction × passage, on all 35 rooms, over 3,000 of
  them — and asserts each resolves to exactly one row, because a wildcard collision shows up as no
  badge at all and nothing else would catch it. Then badge text, the rows that refuse to be a figure,
  the registered pass, and no name in another table.
- `tests/fl-badge-tip.test.mjs` — the tap-to-read panel, and the only suite that
  RECORDS what the script binds to `document` and `window` and fires those handlers by hand;
  nothing else reaches that code. It pins the bug it was written for — a click or a scroll from
  inside the panel must not dismiss it, or a tooltip longer than the 60vh cap cannot be read —
  alongside everything that still must dismiss (page scroll, resize, Escape, an outside click),
  the badge exemption that makes a second tap on the same badge a toggle, and `pruneTip`.
- `tests/choice-underclay.test.mjs`, `choice-hunting-bees.test.mjs`,
  `choice-featuring-tales-university.test.mjs`, `choice-term-passing.test.mjs` — one per feature.
  Underclay and Hunting Bees both pin the guides' "Min for 100%" against the difficulty × 5 ÷ 3, plus
  Underclay's Echoes-per-point banding by **total** cost and Hunting Bees' three disputed Airs windows
  and its two sides mirroring each other option for option. The Featuring suite is the odd one: it
  pins the line running in order with no gaps, that exactly two steps are marked irreversible and
  that the mark is not `▼`, and that both blanked titles are found bare and filled in — the failure
  there is silence, not an error. The Term Passing suite pins the **badge's three parts in order** —
  CP, Echoes, then any Connected the option *builds* — and specifically that no badge quotes two
  carousels any more, that the Connected on a badge is exactly what its payout string says (it is read
  out of it, never stored twice), that the parser takes a gain, skips a cost and never swallows two
  clauses into one, and that an unpriced row does not print its Connected twice. Then badge text, the
  registered pass, and no name in another table.
- `tests/choice-trade-in-reputations.test.mjs`, `choice-savage-cobbles.test.mjs`,
  `choice-publishing-newspaper.test.mjs`, `choice-war-of-assassins.test.mjs`,
  `choice-wars-of-illusion.test.mjs`, `choice-foreign-posting.test.mjs`, `choice-temple-club.test.mjs` —
  one per feature, and the first to also assert **no storylet** is in another feature's table. Trade in
  Reputations pins the Change Tables' stated figures against their curve at all twelve levels, the
  finishing cards in the guide's order, the hand's `▾`, and a product-named card title resolving through
  the alias. The three level carousels derive the guides' action counts from the CP arithmetic (14, 14,
  11/34). The Newspaper suite pins the kinds of copy per Hour against the guide's table and derives the
  guide's "104 needs late qualities, except Salacious" from the rows. The Wars of Illusion suite pins the
  exact list of rows that disagree with the guide, the shared *Enough* resolving by open storylet, and
  the hand never picking the impossible option. The Temple Club suite pins `★` on exactly four rows.
- `tests/choice-attending-party.test.mjs`, `choice-missing-woman.test.mjs`,
  `choice-wilmots-business.test.mjs` — one per feature. The party suite derives the guide's "maximum
  possible 19 CP" from the rows, checks every card label against the Times of its own options, and pins
  the hand badge as a label. The two Wilmot's End suites check that every gating level a choice can set
  leaves a storylet open at 2 and at 4, and that the shared titles (*Millicent Clathermont*, *An exchange
  of favours*) resolve only by the open storylet.
- `tests/choice-chessboard.test.mjs`, `choice-parabolan-hunting.test.mjs`,
  `choice-oneiropomp.test.mjs`, `choice-sacroboscan.test.mjs`, `choice-parabolan-war.test.mjs`,
  `choice-cubs-education.test.mjs`, `choice-parabolan-camp.test.mjs` — one per feature. The Chessboard suite recomputes the guide's score
  table from the two columns. The hunting suite pins every quarry's Ferocity, that no badge states a
  difficulty, and that any *Pursuing the …* / *Embattled with the …* heading — including a quarry no
  guide has heard of — lands on its storylet. Oneiropomp pins the three modulo tiers in order and the
  state of Parabola on every row. The Calendar suite pins the two cycles filling 1–6 exactly once and
  the seven return-visit aliases. The war suite recomputes all eighteen Ravages rates from their parts
  and pins that the trail is not badged. The Cub's suite pins the reward bands tiling without a gap. The
  Base-Camp suite pins the fertilisers and the Dome's prices against the guide, that every trade with the
  Fingerkings ends its badge with the Favours, that the four headings left alone stay unbadged,
  and the Realisation hand ranking.
- `tests/choice-church-in-the-wild.test.mjs`, `choice-law-hunting.test.mjs`,
  `choice-moulin-expeditions.test.mjs`, `choice-writing-monograph.test.mjs`,
  `choice-kitchen-artists.test.mjs` — one per feature. The church suite pins that no choice moves a
  seventh quality and that the two mirrored options really mirror across all six. Law-Hunting pins
  that every option answers to its plain title as well as the wiki's. The Moulin suite pins that every
  obstacle has a two-Supply answer and that NO option row belongs to a discardable card. The monograph
  suite derives `breaks the circle` from the ring rather than trusting the flag, and checks every
  buyer is reachable from some topic. The kitchen suite pins the four divisors and that the Helicon
  sale is not claimed twice.
- `tests/choice-alchemy-station-viii.test.mjs`, `choice-cornelius.test.mjs`,
  `choice-clay-highwayman.test.mjs` — one per feature. The Alchemy suite pins six pickups against six
  extractions with no reagent made twice, that a costed pickup always names its items and no row
  claims an Echo price, and that the one reagent with no one-time use carries a `null` rather than a
  blank. The Cornelius suite pins the ladder in order, that the vote answers to all three of its
  Bridge Troubles titles, and that it and `railway-board` share the Board storylet and no option. The
  Clay Highwayman suite pins that only the four known units appear, that every row badges something
  (an empty label is how that feature fails), that the card answers to all three of its names, and
  that it and `disappearing` share no camp storylet.
- `tests/choice-hurling.test.mjs`, `choice-chthonic-communication.test.mjs`,
  `choice-digging-hurlers.test.mjs`, `choice-marigold-station.test.mjs` — one per feature. The
  Hurling suite pins that no row carries both an absolute and a favour swing, that a favour badge
  never shows a sign, that a line which can foul says so in words, and that a gated card name is
  badged in the castle and nowhere else. The Chthonic suite pins that all three minds offer the same
  qualities at every tier and that every check is 10 but the three Steward rungs. The Digging suite
  pins the failure rate of all four Watchful sites, that the Salt Steppes line is given no rate, and
  that the difficulty is the formula with the page’s 150 explained. The Marigold suite pins one item
  line and one check line per Fate, and that *Accept a commission* is the only name shared with
  another feature.
- `tests/choice-airs-of-london.test.mjs` — pins that every window is inside 0–100 and that the
  four-way splits (Watchmaker’s Hill, Ladybones Road, the Great Game’s *Gather resources*) partition
  it exactly while Opportunism in Spite and the Widow offer something at every Airs; every item has a
  price; the arithmetic of a range, a cost, a Luck option, a rare success and a bundle by hand; that
  the six dreams are one label and never a badge each; the `(gendertitle)`, `Accept the task` and
  `(5 FATE)` title traps; the two guide-versus-page disagreements; and that no option title is in
  another feature’s table.
- `tests/choice-progress-qualities.test.mjs` — the shared `pq*` helper and the two features on it:
  the gain/spend vocabulary by hand for a dozen options, that a rare success and the guide’s Echoes
  stay off the badge, every guide-versus-page disagreement by name, that Hunting Dangerous Prey offers
  something at every Airs while Duelling’s windows start at 1, that the Duelling heading’s two names are
  one storylet, that a card badges the hand and the opened heading once and its options once, and that
  no title is in another feature’s table.
- `tests/choice-casing.test.mjs` — the Casing feature: the two kinds of spend by hand (a robbery takes all,
  a fixed price takes a set number and says what a failure takes), the prelude’s actions and CP per action,
  that every larceny takes 21, 36 or 55 at level 6, 8 or 10 (the Clay Highwayman feature’s ladder), that
  the six thefts of particular character are 32 and 51, every guide-versus-page disagreement, the shared
  *Join a scouting party* title and the two storylet aliases, that a larceny card’s heading is not badged by
  this feature and its options are, and that no title is in another feature’s table.
- `tests/choice-fascinating-inspired.test.mjs` — the two features: the spend that moves a second quality
  by hand (a romance step, a rival pushed back, an arrow for an unrecorded amount), each romance as a
  ladder of the same shape, the guide’s swapped Rising Artist rows and its other disagreements by name, that
  two storylets’ “Walk away” are told apart by the open one, that Madame Shoshana’s heading has one badge
  and both features’ options inside it are badged, the cards, and that no title is in another feature’s
  table.
- `tests/choice-investigating.test.mjs` — the vocabulary by hand (a gain, a failure that adds, a range,
  a fixed price, a label), the Curate’s six bands and three-option ending, the University’s six options and
  its department placeholder, the seven guide disagreements, that Madame Shoshana’s tent, the mail and the
  Dreamer keep one heading badge and this feature badges only its own option, the ten cards (hand and
  opened heading once each), and that no title is in another feature’s table.
- `tests/choice-someone-is-coming.test.mjs` — the two shapes (a card option that raises it by 1 and names
  the profit, a payout that takes 21 CP), that all eight payouts need level 4, the drunk rat’s 6 at level 3
  with its rare 1%, that the guide’s Echoes are tooltip text only, the eighteen cards (hand and opened
  heading once each), that the zee cards and *Rob a drunk* keep no heading badge of ours while their option is
  badged, the numbered-page aliases, and that no title is in another feature’s table.
- `tests/choice-hellworm.test.mjs` — the six options on the one card: a play, a ride, the milking at 7
  that takes all of it, the three Scrip purchases as labels, the guide’s disagreements, that its Echoes stay
  in the tooltips, the card in the hand and opened badged once with its options inside, and that no title is
  in another feature’s table.
- `tests/choice-risen-burgundy.test.mjs` — the Weaver’s four deliveries times their payouts against the guide’s
  totals, that its four cards share one option title with one badge and four Visions in the tooltip, the
  hunting card matched through its `(Roof Prey)` placeholder in the hand and opened, the Saint’s Day ladder
  (four cards of two options, all +1), the payouts at 10, the Poet-Thief’s twin titles told apart by card,
  Heralds as six steps in order, the weekly cards, and that no title is in another feature’s table.
- `tests/choice-station-developments.test.mjs` — the badge form (`Curio ×5 → Scrip ×25`, `Scrip 50×(n+1) →
  Library 1`), that every formula improvement says what n is and sits in an Offices branch, the 2,750 for ten
  improvements, the eight branches with the Hurlers’ twelve matching the twelve pages, the shared-title entries,
  the curly apostrophe, the heading counting options, the opened storylet scoping, and no title in another
  feature’s table.
- `tests/choice-city-of-the-tracklayers.test.mjs` — the badge form for a payer, a cash-out and the three betrayals,
  the seven Imports and Exports costs, the guide’s 35 certain-pass values against the pages (five thirds broad,
  five above narrow), the two-page titles, the card names with brackets or placeholders, the card in the hand
  and opened and an option inside it, Officially Non-Criminal left to Investigating, and no title filed under
  the same card in another feature’s table.
- `tests/choice-station-statues.test.mjs` — the guide’s 53 statues by station and all its ratings one by one, the
  N/4 badge form, what a card option takes and gives and its tooltip, the merged Jericho Church entry, the
  sketching option through its placeholder, the Fate costs, a build option badged inside an Offices branch whose
  heading stays Station Developments’, the same title on two cards told apart, the cards in the hand and opened,
  and no title in another feature’s table.
- `tests/choice-menace-locations.test.mjs` — the badge form, the guide’s figures place by place (the Wounds red
  cards, the letters to an old flame, bribery, the lawyer, the manager, the Mirror-Marches’ cards and frames),
  Luck options worked out to the guide’s −4.9, −0.5, −1 and −1.5, colour by direction, the confirm-only hand
  badge in four greeting states, the numbered and bracketed card titles, two pages under one title, and no
  title in another feature’s table.
- `tests/choice-iron-republic.test.mjs` — the guide’s 34 table rows against the entries, door for door, the graph
  (every door lands on a real day, every day reachable from Day 1 and reaching Day 99, one door back), the badge
  form, the guide’s disagreements and bold text in the tooltips, the way out, the day headings and Day 81’s
  alias, and no title in another feature’s table.
- `tests/choice-firmament.test.mjs` — the badge form in the guide’s words, its figures part by part (the airship,
  the Gullet, Lost Naples, the feast’s seats and endings, the Calendar, the three histories), the `⚠` mark and its
  tooltip, the wiki’s *Firmament:* prefix found under the bare heading, and no title in another feature’s table.
- `tests/choice-discordant-studies.test.mjs` — Crystalline Knowledge climbing 1 to 6 and Cold Comfort 3 to 7 in the
  guide’s order, each step needing the level below it, the badge form, the numbered wiki pages found under the
  game’s titles, Deeper Discordant Studies’ tiers in order, the costs and rewards figures, and the heading.
- `tests/choice-plaster-face.test.mjs` — the guide’s table of investigation options row by row, the story as a chain
  (every level 0 to 9 has a step, endings 15 or 20), the guide’s disagreements with the pages, the Alliance, what
  Running Battle owns not being here, the four cards in the hand, and no title in another feature’s table.
- `tests/choice-painting-balmoral.test.mjs` — the painting suite pins that all three
  painting actions name both outcomes on the badge, that *Unveil your Painting* is one row pricing all
  seven compositions, that exactly one row is marked as the guide's word against an option page, and
  that *Display your own painting* is still `helicon-house`'s and not claimed twice.
- `tests/choice-disappearing.test.mjs`, `choice-cover-identities.test.mjs`,
  `choice-moonlit-woods.test.mjs` — one per feature. The Disappearing suite pins that it and
  `deciphering` share the Cabinet Noir storylet and **no option**, which is what makes two features on
  one heading safe, and that every camp action takes a Ransom level. The Cover Identities suite pins
  the Suspicion on all four earned qualities and the points-per-action of all seven Backstory
  purchases. The Moonlit suite pins that all three spotting options say they end the walk, on the
  badge and in the tooltip.
- `tests/choice-canal-cruising.test.mjs`, `choice-barristering.test.mjs`,
  `choice-magistracy-diving.test.mjs`, `choice-railway-board.test.mjs`, `choice-deciphering.test.mjs`
  — one per feature. The canal suite checks that every Esteem source states a price and pins both
  halves of every fare. The Evenlode suite resolves all eight trial headings, including a case nobody
  has written down, and pins the four options that lower Prestige. The diving suite pins that every
  depth ladder covers its range without a gap and that every scaled badge is marked as ranged. The
  board suite pins the 6/7/8/5 split of members across the three levers, which is the arithmetic the
  guide's advice rests on. The Cabinet suite pins that the cash-in warns about the lost surplus.
- `tests/choice-piracy.test.mjs`, `choice-irem.test.mjs`,
  `choice-khaganian-intrigue.test.mjs`, `choice-helicon-house.test.mjs`, `choice-jericho-library.test.mjs`
  — one per feature. The Piracy suite checks every exchange's price against the Respected it pays at
  1,250 treasure a change point, and that neither piracy card is in its table. The Irem suite pins the
  eight passages that need a smuggled warp and the three futures that need none, which is the whole
  claim the feature makes. The Khanate suite resolves all ten Airs titles and all eleven opportunity
  titles, and checks the five neighbouring "An opportunity:" options still answer for themselves. The
  Helicon suite pins that every way out leads with "ends the night", and the library suite that every
  research option states what a failure does. The last two each pin their one shared title, and that
  it belongs to a different storylet in each feature.
- `tests/choice-godfall.test.mjs`, `choice-maze-garden.test.mjs`, `choice-promenade.test.mjs`,
  `choice-port-cecil.test.mjs`, `choice-zee-beasts.test.mjs` — one per feature. Godfall pins that its
  three Echo figures agree with the ending's formula and that every Oblation is a paid option and a free
  one. The Maze-Garden recomputes every trade's rate from count × price ÷ cost, pins *Select a head from
  the pile* above every other +7, and that Perambulating shows only when it is not +4. The Promenade
  derives each payout's Echoes per action from its value over twelve actions. Port Cecil pins the flat
  +3 CP across High Tide and that no Low Tide badge states a total. The zee-beast suite pins all seven
  approach headings resolving to one storylet, the quarry wildcard, and *Take a risk* as the only action
  whose failure loses Pursuit.
- `tests/choice-hunters-keep.test.mjs`, `choice-mutton-island.test.mjs`,
  `choice-venderbight.test.mjs` — one per feature. Hunter's Keep pins that every row carries a payout
  (the badge is not the flat progress), `★` on exactly the fifteen Hunter's Insight rows, and *Talk to
  her* resolving under each of its two storylets. Mutton Island pins `reset` on exactly the lines that
  end the cycle, the two rows where the pages beat the guide, and that its gate and `inFotzArea` read
  the one captured greeting the same way. Venderbight pins the two either-or options ranked at what
  they guarantee, the Luck expectation, the hand's stat tie-break, and that *A woman of sinister
  repute* never enters the hand.
- `tests/choice-brawling-dockers.test.mjs`, `choice-assembling-skeleton.test.mjs`,
  `choice-professional-activities.test.mjs`, `choice-hearts-game.test.mjs` — one per feature. Brawling
  pins every cap against its threshold and the Brawl it is reached at, the guide's "no harder than the
  plain fight from 84", and the side read off the rewards. The skeleton suite pins Implausibility as a
  failure's only, the page-over-table rows, and that exactly the multiplying buyers exhaust. Professional
  Activities pins the guide's three tiers as the shape of every job, save three named rows. Hearts' Game
  pins one no-Prep basic action per card, Counterplay on every challenge-free Progress line, and that a
  formula never outranks a figure in the hand.
- `tests/ux-launcher-placement.test.mjs` — asserts `ux-enhancers.js`'s
  `launcherPlacement`, the pure half of where the "⚙ UX" button sits. It is organised around
  the three real travel controls: wide desktop (beside the sidebar button, bottoms level),
  narrower desktop (above it, because the welcome text shares its row), and mobile (above the
  whole bar, right edges level with the compass — including an explicit "the launcher clears the
  bar" check, which is the bug the rule exists for). Then the fallbacks: a *top* bar leaves no
  room above so the launcher goes below it, and with no travel control at all the corner returns
  — lifted over a bottom bar, left alone for a top one. It closes with a sweep over viewports ×
  bars × anchors × crowding asserting nothing ever lands off screen, and pins that all three
  verified selectors are still in `TRAVEL_SELECTORS`. It also covers `popoverPlacement`, the
  docked mode's rule — the popover opens into the larger of the two gaps and survives a button
  scrolled clean off either end of the page — and `dockHostFor`, which picks the container. A section of its own covers `down`,
  including the invariant behind it — the stack never opens toward the *smaller* of the two
  gaps. There is deliberately no `window` in its
  stub, which is how the impure `positionLauncher` bails and only the rule is under test.
- `tests/ux-factions.test.mjs` — asserts `ux-enhancers.js`'s Factions panel. Its stub
  DOM is rich enough to **actually build the panel** (and carries a tiny selector matcher), which
  is the only way to catch a typo in a few hundred hand-built nodes without loading the live site;
  `getElementById` really searches the tree, or the launcher's id guard would pass vacuously. It
  holds **verbatim `li.quality-item` markup from a real /myself page**, picked for the awkward
  cases — the double-spaced `Renown: Society 34/55 -  Known in the homes…` and
  `Renown: Rubbery Men 12/55 - !kathakathoti!` — so the file is the repo's record of what FL
  emits; keep them verbatim. It pins the transcribed wiki data (a typo there is invisible in-game
  until you've spent Favours on the wrong thing), that `upperRiver` and `replacesCard` stay
  disjoint, the cache round-trip (banked on load, offered as stale off-tab, discarded for another
  character), and above all the **no-fabricated-numbers** contract: absent means 0 only on an
  unfiltered list, a filtered one leaves absent unknown, and with nothing readable at all not one
  cell shows a number. Treat those checks as load-bearing. Note the capture won't re-scrape an
  unchanged list, so the cache assertions ride on the IIFE's own first scan rather than calling
  it again. It also holds **verbatim `/possessions` markup** for all three owned-item shapes
  (inventory with a `× 2` quantity, the equip drawer, and the worn slot) and pins that all three
  count. `itemStatus` is covered state by state, including both ways of not knowing; note the
  `readyItems` case builds its own state rather than using the capture, because the captured
  character happens to have nothing collectable and the check would pass while proving nothing.
  The "use" path is exercised end to end: clicked directly when already on Possessions, parked
  and routed via the nav link otherwise, replayed exactly once when the page arrives, abandoned
  (not retried forever) for an item that isn't there, and dropped when stale. Update it when you
  touch `FACTIONS` or either scrape.
- `tests/ux-equipment-helper.test.mjs` — asserts `ux-enhancers.js`'s equipment
  helper, over a stub Possessions page built from **verbatim labels** out of a real capture (keep
  them verbatim). Label parsing (flavour and "Commonplace" fall out, a negative stays negative, an
  advanced skill reads like any stat, and the menace lines scored 1/2/4 with a reduction positive
  and an increase negative, a multi-word menace such as Troubled Waters included); per slot, a tie starring
  every tied item and a slot of zeroes and minuses starring none; BDR scoring an item on the three
  **added together** — the reported case, Mary Lloyd's Bizarre +3 over the Respectable Landau's
  +2, with an item carrying two of the three landing in between — and none of the three meaning no
  star. On
  the page: the Burden afflictions never starred, a second pass adding nothing, a changed stat
  moving stars *and* outlines, All clearing everything. Then the fake BDR option, over menu
  options stubbed in react-select's id scheme (the unverified assumption, named as such): added
  once, after Bizarre, only while the menu is open, wearing the option's class but not its
  `aria-selected`; picking it clicking the real All and recording BDR; the control reading BDR
  over a hidden value; the stars and summary for the combined score; and BDR cancelled both
  by a clicked real option and by a value changed without a click.
- `tests/ux-launcher-docking.test.mjs` — asserts `ux-enhancers.js`'s launcher
  **docking**, which is the half `ux-launcher-placement.test.mjs` can't reach: that one covers
  the two placement rules, which are pure, and this one covers moving a button in and out of
  FL's own chrome, which is not. Its stub is a small but real DOM — parent links, `contains`,
  `closest`, a selector matcher, `getBoundingClientRect`, a **live** `isConnected` — with two
  fake FL layouts built from the markup the script quotes as verified. It pins that the button
  docks into the right container in both shapes (a wrapper beside the sidebar's Travel button,
  its own `li` in the banner's row), that a second `mountLauncher` adds nothing (it runs on
  every debounced DOM change, so a duplicate would multiply), that a React re-render dropping
  the button is repaired by the next scan **without** building a second launcher, that a whole
  layout swap re-docks it, that the float toggle takes the wrapper back out of FL's chrome, and
  that `findTravelAnchor` refuses our own button even when it is the only thing the selector can
  still find. A real latent bug fell out of writing it: a rebuilt launcher reused the previous
  run's dock wrapper and re-attached the dead button with it.
  It also covers the **Fruits of the Zee depth control** (2026-09-04), which since the split is
  `choice-helper.js`'s — so the suite loads **both scripts into the one stub page**, sharing its
  `window` and its storage, and merges the control's internals into `api`. The control is the
  second thing to want the one spot after the travel control: that it finds the launcher button
  by id and queues up behind it rather than fighting it for that place, that it is as idempotent as the
  launcher is — it is redrawn by the scan its own writes trigger, so a rebuild every pass would
  be an infinite loop, not just a stray node — that both copies (docked, and above the hand)
  repair themselves, that the banner gets one cycling button instead of a row of six, and that
  surfacing removes both.
  And the **panel header's fullscreen toggle** (2026-09-06), which needs a launcher that has
  actually been mounted: it pushes a stub panel onto `PANELS` before the rebuild so what is under
  test is the header rather than any real panel's render, then presses the button and checks the
  panel goes fixed and full-bleed, that a placement pass leaves it alone, that the preference
  survives a close and the next panel opens fullscreen already, and that pressing it again
  restores the popover's own size. Plus the key-coverage check on the two style patches. Its stub
  records event listeners for this; it used to drop them.
  And **panels from the other script** (2026-09-13): Choice Helper's four registered on
  `window.__flUxPanels` in order and listed after Factions, a panel registered after the menu was
  built turning up the next time it opens, and an id the menu already has — or an entry with no
  `render` — left out.
- `tests/choice-fruits-of-the-zee.test.mjs` — asserts `choice-helper.js`'s Fruits of the
  Zee feature. Its stub DOM builds both the qualities and the possessions markup and is rich
  enough to **actually build the panel**, in both the mid-festival and the nothing-ever-read
  states. The bulk of it is the **per-depth Favour table**, walked depth by depth for all eleven
  cards, plus the invariant that makes the badge possible at all: at a known depth a card offers
  *exactly one* claim. Then the three ownership marks as three distinct states (a dash is not a
  tick), the range-not-a-guess rule and that a proven floor trims the range without collapsing it,
  the Sights → variant mapping and that the bands tile 1..100, the Fruit Market prices (with the
  invariant that buying at the stalls always costs less than trading a spare back pays), that
  counts are a max rather than a sum (and that **equipment states its count in a
  `.js-item-value` span and not in its label**, so four Scrimshander Carving Knives really
  are three spares in the ledger), that an **Accomplishment with no level at all** still
  reads — the Bride, off a real `/myself` capture — and drops the bottom of the trench out
  of what is left to dive for, that a **coral you are already carrying** is likewise not
  still down there, and the collection arithmetic — what counts towards the
  headline and what deliberately does not. It also holds the cross-feature check that no card name
  appears in two of `SPITE_CARDS`, `ZEE_CARDS` and `FOTZ_CARDS`. It also pins the **dive plan**
  (each stage's items really are claimable at that stage's depth, the four stages cover all six
  dive-only items once each, and a coral already in hand is not one to dive for) and the
  **tap-to-read** half of the badges (the tap is swallowed both ways, a second tap closes, and a
  panel whose badge was re-rendered away is pruned) — for which its stub records event listeners
  rather than dropping them. It also pins the **four depth sources and the order between them**
  (a live read beats a hand-set depth, a hand-set depth beats a banked Myself read, and a banked
  read past `FOTZ_READ_FRESH_MS` is dropped rather than shown stale — that expiry is the half
  most worth having a test for), that a banked `Full Fathom Five` of 0 is "not diving" rather
  than a depth, `depthSourceText`'s wording per source, and the in-page control's gate and its
  one-button cycle. Update it when you touch any of the `FOTZ_*` tables.
- `tests/fl-shared-helpers.test.mjs` — asserts what `ux-enhancers.js` and
  `choice-helper.js` share now that they are two files, which no other suite can see because
  every other suite loads one of the two. First the **copies**: every top-level declaration the
  two files have in common must be byte-identical, bar a short list (`SCRIPT_ID`, `FEATURES`,
  `PANELS`, `refreshBackgroundState`, `scan`) that differs on purpose — and that list must really
  differ, so it cannot go stale — and a named list of the shared helpers must be declared in
  both, so a rename in one file reads as a missing copy. Then the **contract**, with both IIFEs
  loaded into one stub page: the menu holds Factions and then Choice Helper's four panels in
  either load order, registering twice adds nothing, and with no `window` at all UX Enhancers
  offers its own panel and nothing throws. And the **shared frame**, both directions: a Myself
  page one script loaded is banked by the other (festival and purse one way, Renown the other)
  and not by the script that sent it, a Possessions page likewise (owned items one way, counts
  the other), and a Myself page without a faction quality or a Possessions page of 20 items or
  fewer does not count as loaded. Update it when you add a helper to both files.

The re-expose trick (rename `(function () {` and `return { ... }` the helpers before `})()`) is
how a test reaches an IIFE's internals — copy an existing test when adding one, and put it in the
`tests/` folder at the repo root.
