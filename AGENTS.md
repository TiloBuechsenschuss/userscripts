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

- `auto-combat.js` adds an "Auto" button to the **charpane**, under the Last Adventure
  readout, opening a panel that adventures a chosen zone for a chosen number of
  turns. Two entries: The Haunted Bedroom, and **"wherever I adventured last"** — a `dynamic`
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
- `ux-enhancers.js` is the FL grab-bag, the counterpart of `KingdomOfLoathing/ux-enhancers.js` —
  but note **what a feature is scoped by differs**. KoL is server-rendered, so each of its
  features declares the `.php` path it belongs to and runs once; FL has one URL and no
  navigation, so a feature here is scoped by *the markup it finds* and is re-run on the debounced
  observer. Adding one: write an idempotent `run()` that bails when its markup is absent, add a
  `{ name, run }` entry to `FEATURES`, and give it **its own badge class and dataset flag** so
  two features can decorate the same element without fighting over one flag.
  Shared plumbing worth reusing rather than re-deriving: `makeBadge`/`attachBadge` (badge
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
  A feature that wants a screen rather than a decoration registers a **panel** instead: the
  `launcher` feature mounts a `position:fixed` "⚙ UX" button on `document.body` whose menu is
  built from the `PANELS` registry (`{ id, icon, label, hint, render }`, `render()` called fresh
  on every open so a live panel never has to invalidate a cache). The button is floating **on
  purpose** — nothing is injected into FL's chrome, so it survives a React re-render and can't
  shove anything around. What it is *fixed to* is no longer the bottom-right corner, though:
  on the narrow layout that corner is FL's own fixed bottom bar, and the button sat on top of
  it. It is now placed relative to **FL's travel control** — the big Travel button on the wide
  layout, the compass on the narrow one — by `positionLauncher`, and the rule lives in
  `launcherPlacement`, which is **pure** (anchor box, bar box, viewport, button size, and
  whether the space beside it is crowded, in; `right`/`bottom` out) so it is unit-tested
  without a layout engine. The rule: *beside* the control, bottoms level, when the space to its
  left is both free and big enough; otherwise stacked against it with right edges level —
  *above* it by preference, *below* when it sits too near the top of the screen for above to
  fit. Either way it clears the whole **bar**, not just the icon in it, which is the actual bug.
  Every result is clamped to the viewport, so a control that scrolls out of view can't take the
  launcher with it. `enclosingBar` is what decides "in a bar": the nearest `fixed`/`sticky`
  ancestor that spans the width, touches the top or bottom edge, and isn't the whole screen.
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
  `SPITE_CARDS` and nowhere else. Its **area gate** reads `currentArea()` — FL states the area in
  the screen-reader greeting (`#accessible-sidebar .welcome`), which is on every page including
  /myself and /possessions. During a promenade it reads, verbatim and **confirmed in-game**:
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
  The **area gate is deliberately weaker than the Spite one**: `SPITE_AREAS` rests on a greeting
  captured verbatim in-game, while `ZEE_AREAS` is a *guess* at what the same greeting says at zee,
  assembled from the wiki's region names. So `inZee()` only ever confirms -- it never returns
  "definitely not at zee" -- and exactly one card leans on it: `strictZee` on **The Sound of
  Wings**, which is the one name Fallen London deals in eight other places. Everything else is
  scoped by the card table, the way `spite-card-ratings` started out. Capture a greeting from a
  real voyage and this can be tightened the way `SPITE_AREAS` was.
  The `zailing` panel is the reference half: routes and what they cost in actions per ship, Zee
  Peril per region, the Troubled Waters ladder and the six zee-threat/black-card pairs, the safe
  docks (with the warning that being a port is not being a dock), the three winds, your current
  hand ranked, and the whole card table with a live text filter. The filter matches
  `row.dataset.zeeSearch` rather than `textContent`, so a term can hit an option the collapsed row
  does not show, and it hides a region heading whose rows have all gone.
  Note the two badge features can never collide on one card -- no name is in both tables, and a
  test asserts it -- which is what lets both take the card container's top-left corner.

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
  a number can't be mis-split.
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
  anyone wearing their Renown item that they don't have it. The ids would be a better key than
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
- **Refreshing the Factions panel: `fetch` does not work, and that is settled.** Fallen London is
  client-rendered — `GET /myself` returns a ~4.7KB shell whose `#root` holds a loading splash and
  no quality list (checked against the live site, not assumed). So `refreshFactionState()` uses a
  hidden off-screen **iframe** instead: point it at the route, let the app boot inside it, poll
  `contentDocument` until the markup appears, then read it. It's off-screen rather than
  `display:none` because a `display:none` iframe may skip layout and never run the app. The two
  routes load sequentially (two SPA boots at once is a lot of work), each extractor waits for
  markup that is actually *complete* — a faction quality present, >20 possessions — so a
  half-rendered page can't bank a page of false zeroes, and everything is behind a 20s timeout
  whose failure path is "no refresh", never a wrong number. This is **confirmed working in-game**
  (2026-09-02) — keep every guard regardless; they are what make the failure mode "the panel you
  already had" rather than a wrong number.
  The script carries **`@noframes`** (and so does the loader) so it doesn't boot a second copy of
  itself inside that iframe. Auto-refresh is on by default, throttled by `stateIsFresh` (skip if
  under a minute old), and switchable off in the panel — `fl-ux-auto-refresh`. Panels get a
  `ctx.rerender()` that rebuilds only the body, so a refresh landing doesn't flicker the header
  or lose scroll position.

**What in `FallenLondon/ux-enhancers.js` has actually been run in the game** (as of 2026-09-02).
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
  its `i.fa-compass`. That is a *capture*, not a sighting of the launcher beside them — whether
  the button lands beside, above or below each of the three is still unconfirmed in-game.
- The **area gate**. The greeting during a promenade was captured verbatim (*"Welcome to The
  Crowds of Spite, delicious friend!"*), so `SPITE_AREAS` is now a verified exact list rather than
  a permissive guess.

**Not** verified in-game (added 2026-09-02, reasoned about only):

- The **Zailing card ratings and the Zailing panel**. They reuse machinery that *is* confirmed
  (`eachCardName`'s three card shapes, `attachBadge`, the launcher and its panel host), so the
  risk is not the markup -- it is the transcription and `ZEE_AREAS`. Nobody has yet read the
  screen-reader greeting during a voyage, so it is not known whether it names the region
  ("Welcome to The Sea of Voices"), the ocean, or something else entirely; `inZee()` is written
  to fail closed on the one card that leans on it and open on everything else. Move this up on a
  report, and say what the greeting actually said.

Everything else in this script is confirmed live. Keep it that way: when you add something that
rests on markup you have only reasoned about, say so here and in the code, and move it up only
on a report.

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
- `KingdomOfLoathing/test/ux-mall-buy.test.mjs` — asserts `ux-enhancers.js`'s mall purchase
  planner against the real numbers from a "perfect negroni" search: that a daily limit caps
  stock, that allocation is cheapest-first with price ties keeping page order, that the
  average is over what would actually be bought (not what was asked for), and what the confirm
  text and post-run summary say. It also pins the reporting contract that a real bug turned
  up: an unrecognised purchase response yields `null` ("says nothing"), never 0 ("nothing was
  bought"), and an unmeasurable run must admit it rather than claim either that nothing
  happened or that the Meat is untouched. This is the money path — extend it before touching
  the planner, never after.
- `KingdomOfLoathing/test/ux-beer-garden.test.mjs` — asserts `ux-enhancers.js`'s beer garden
  yield table against the wiki's (3 barley/hops per day, clamped at day 7; day 1 gives no
  fancy item and day 2 gives the first, which is where the threshold comes from), what the
  `confirm()` text says, and that `findBeerGarden` reads the day off the artwork while
  ignoring other crops and other campground images. If you touch the table or the artwork
  regex, adjust this test.
- `KingdomOfLoathing/test/ux-inventory-mall.test.mjs` — asserts `ux-enhancers.js`'s inventory
  `[mall]` link: that the search term is the name in quotes (exact match, not substring) and
  survives apostrophes, `™` and a quote embedded in the name; that `t=0` suppresses the link
  while an unreadable `rel` doesn't; and that re-running (the observer fires on every DOM
  change) never stacks up a second link.
- `KingdomOfLoathing/test/ux-mcd-link.test.mjs` — asserts `ux-enhancers.js`'s monster
  aggravation device line: the sign→device map (with Platypus/Opossum/Marmot pinned to
  Canadia, the trap a stat-based grouping falls into), KoL's own URLs and dial ranges, that
  both panes' labels for a device are recognised so the line is never duplicated, that a
  last-adventure link to Hey Deze is *not* mistaken for the Heartbreaker's line (which is
  why the label rather than the href identifies it), and the compact/expanded discriminator.
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
- `KingdomOfLoathing/test/quest-helper-8bit.test.mjs` — asserts `quest-helper.js`'s 8-Bit
  Realm advice: the colour→zone→snarfblat map, the fixed black/blue/green/red cycle, the
  points formula (nothing below the floor, 10 per 10 over it in the bonus zone and per 20
  outside, capping at 400 and 200 — the bonus is exactly double), the chest distances, and
  that an unrecognised colour yields no advice. It also parses the real charpane markup
  through both paths (the labelled span, and the `<font color>` fallback). Uses the same
  replace-the-dispatch-line trick as the rotation test.
- `KingdomOfLoathing/test/quest-helper-combat.test.mjs` — asserts `quest-helper.js`'s
  fight.php combat cues: that KoL's own round markers fire them (using the literal comment
  payloads from KoLmafia's fixtures) and that neither cue answers for the other's, that an
  ordinary round fires nothing at all, and that the prose fallback still catches a round
  with no marker. The case worth keeping is the monster-id table: the tool-carrying gremlin
  ids are in the map and the **tool-less ones next to them are not**, and a name-only match
  is flagged unsure so the advice hedges instead of promising a tool. Extend it before
  adding a cue, and pin the new marker with a real payload rather than an invented one.
- `KingdomOfLoathing/test/quest-helper-sven.test.mjs` — asserts `quest-helper.js`'s Sven
  Golly overview: the wiki's answer table in both directions (who takes what, and who each
  item is for), that each trait is craved by exactly one member and hated by exactly one,
  and the third verdict the two-state reading misses — an item carrying neither trait is
  *shrugged at*, and eaten anyway. The cases that matter are the two shared items: one
  blotter paper must be planned for one member, not both, and must not read as available on
  the other's row; an exclusive item is spent first so the shared one still reaches whoever
  has no alternative. It also pins the reporting contract — an unreadable dropdown says so
  instead of claiming an empty bag, which would send you off to spend turns you don't need.
- `KingdomOfLoathing/test/quest-helper-merkin.test.mjs` — asserts `quest-helper.js`'s Mer-kin
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
- `KingdomOfLoathing/test/auto-combat-fight-state.test.mjs` — asserts `auto-combat.js`'s
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
  picked, and both directions of the number/label agreement rule. Plus the last-zone reading:
  `lastadv` parsing, and that a `place.php` action url is not a grindable zone. Note it
  re-exposes the internals by replacing the single `bootButton();` line; move that line and
  this test needs the same edit.
- `KingdomOfLoathing/test/iotm-cup13-sort.test.mjs` — asserts `iotm.js`'s Cup-of-13s option
  parser and each ingredient sort order (advs / effect / inventory / name). If you touch that
  parsing or the sort comparators, add/adjust a case here.
- `KingdomOfLoathing/test/iotm-ball-refusal.test.mjs` — asserts `iotm.js`'s Play Ball
  refusal sniffing: the daily-limit wording marks the diamond spent for the day, the
  "you need to recruit N more foes" wording (only ever said while innings remain) *clears*
  a stale spent flag, and anything else — a played inning, an unrelated page — leaves the
  flag untouched. The subdued button state rests entirely on these two regexes; extend the
  cases if the game's wording moves.
- `KingdomOfLoathing/test/iotm-codpiece-categories.test.mjs` — asserts `iotm.js`'s codpiece
  gem bucketing: every `MR_STORE_GEMS` entry matches both its item name and its enchantment,
  no entry claims another's label, near-miss mundane gems (torquoise's `Weapon Damage +10%`,
  `So-So Spooky Resistance`) stay out of the Mr. Store bucket, and the pre-existing buckets
  still resolve. Also covers `planMrStore`, the "Insert all" planner (removal phase, consecutive
  slot packing, unowned gems). Add a case when a new IotM gem or category shows up.
- `FallenLondon/test/ux-crowds-of-spite.test.mjs` — asserts `ux-enhancers.js`'s Crowds of Spite
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
  `SPITE_CARDS`; a new feature with its own pure logic gets its own `ux-*.test.mjs` beside it.
- `FallenLondon/test/ux-zailing.test.mjs` — asserts `ux-enhancers.js`'s Zailing feature. Two
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
  It also builds the whole panel, the way `ux-factions.test.mjs` does, since that is the only way
  to catch a typo in a few hundred hand-built nodes -- including that a multi-region card is
  listed under each of its regions while an everywhere card is listed once.
- `FallenLondon/test/ux-launcher-placement.test.mjs` — asserts `ux-enhancers.js`'s
  `launcherPlacement`, the pure half of where the "⚙ UX" button sits. It is organised around
  the three real travel controls: wide desktop (beside the sidebar button, bottoms level),
  narrower desktop (above it, because the welcome text shares its row), and mobile (above the
  whole bar, right edges level with the compass — including an explicit "the launcher clears the
  bar" check, which is the bug the rule exists for). Then the fallbacks: a *top* bar leaves no
  room above so the launcher goes below it, and with no travel control at all the corner returns
  — lifted over a bottom bar, left alone for a top one. It closes with a sweep over viewports ×
  bars × anchors × crowding asserting nothing ever lands off screen, and pins that all three
  verified selectors are still in `TRAVEL_SELECTORS`. A section of its own covers `down`,
  including the invariant behind it — the stack never opens toward the *smaller* of the two
  gaps. There is deliberately no `window` in its
  stub, which is how the impure `positionLauncher` bails and only the rule is under test.
- `FallenLondon/test/ux-factions.test.mjs` — asserts `ux-enhancers.js`'s Factions panel. Its stub
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

The re-expose trick (rename `(function () {` and `return { ... }` the helpers before `})()`) is
how a test reaches an IIFE's internals — copy an existing test when adding one, and put it in the
game's `test/` subfolder.
