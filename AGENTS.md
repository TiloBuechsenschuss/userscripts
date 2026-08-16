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

- `auto-combat.js` adds an "Auto" button to the shared menu button row (`order:3`, right of
  the checklist and IotM) opening a panel that adventures a chosen zone for a chosen number of
  turns. One zone so far (The Haunted Bedroom); the machinery is finished, the zone list isn't.
  It runs in the **menu frame** and talks to the server with `fetch`, rather than navigating a
  frame the way `TwilightHeroes/auto-combat.js` does — the topmenu frame is the only one that
  isn't torn down while you adventure, so it's the only place a driver loop can live. That's
  what lets the run survive the player clicking around in the mainpane, and it's why `RUN` is
  module-scope while the panel (rendered into the mainpane document, as `iotm.js`'s popup is)
  can be closed and reopened freely. There is deliberately **no resume across a frameset
  reload**: a half-remembered run that restarts itself is worse than one that stops.
  Zone-specific behaviour hangs off a `ZONES` entry — `guard` (refuse/stop before a turn),
  `combat` (per-round policy, returning an action object rather than a URL), `hints`
  (annotations for the choice prompt), `onResult` (bookkeeping, and the zone's own "we're
  done" signal). Add a zone as an entry, not as a branch.
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
  buttons. Note it re-exposes the internals by replacing the single `bootButton();` line; move
  that line and this test needs the same edit.
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
