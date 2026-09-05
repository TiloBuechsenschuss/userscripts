# userscripts

Assorted userscripts for three browser games. Mostly vibe coded, as a personal
testing ground for doing that. Use accordingly, or don't.

- `KingdomOfLoathing/` — scripts for [kingdomofloathing.com](https://www.kingdomofloathing.com)
- `TwilightHeroes/` — scripts for [twilightheroes.com](https://www.twilightheroes.com)
- `FallenLondon/` — scripts for [fallenlondon.com](https://www.fallenlondon.com)

Each `.js` file is a standalone userscript (Tampermonkey / Greasemonkey /
Violentmonkey): a self-contained IIFE with a `// ==UserScript== ...` metadata
block. There's no build step — the file in the repo *is* the shippable artifact.

## Installing

You need a userscript manager extension ([Tampermonkey](https://www.tampermonkey.net/)
recommended). Then either install everything for a game at once, or pick
individual scripts.

### Everything for a game (one install)

Install one of the **all-in-one loaders**. Each is a thin script that pulls in
all of that game's scripts via `@require`, so a single install gives you the
whole set:

- **Kingdom of Loathing:** [`all-in-one/kingdom-of-loathing.js`](https://raw.githubusercontent.com/TiloBuechsenschuss/userscripts/refs/heads/main/all-in-one/kingdom-of-loathing.js)
- **Twilight Heroes:** [`all-in-one/twilight-heroes.js`](https://raw.githubusercontent.com/TiloBuechsenschuss/userscripts/refs/heads/main/all-in-one/twilight-heroes.js)
- **Fallen London:** [`all-in-one/fallen-london.js`](https://raw.githubusercontent.com/TiloBuechsenschuss/userscripts/refs/heads/main/all-in-one/fallen-london.js)

Open the raw link in a browser with a userscript manager installed and it will
offer to install.

> **Note — `adventure-choices.js` is not in the KoL loader.** It requires
> `GM_*` grants, which are incompatible with the `@grant none` mode every other
> script relies on (mixing them in one install breaks page-`window` access).
> Install it on its own if you want it.

> **Heads up on updates:** managers cache `@require` content and only re-fetch
> it on their *external script update* schedule, not as eagerly as a normally
> installed script. If you want the most reliable auto-updates for a specific
> script, install that file directly (below) instead of relying on the loader.

### Individual scripts

Open the raw URL of any `.js` file below in a browser with a userscript manager
installed, and it will offer to install. Each script has its own `@match` lines
and updates independently via its `@downloadURL`.

**Kingdom of Loathing** (`KingdomOfLoathing/`)

| Script | Pages | What it does |
| --- | --- | --- |
| `iotm.js` | top/awesome menu, codpiece decoration choice | "IotM" menu button opening a popup of Item-of-the-Month actions (Codpiece, Play Ball, Cup of 13s), plus tools on the Eternity Codpiece decoration screen to set every gem slot at once and to save/load named gem setups |
| `daily-checklist.js` | top/awesome menu | Daily tasks checklist |
| `charpane-heal.js` | charpane | "Heal" button that casts heal skills until full |
| `skills-cast-max.js` | charpane | "Max" button on each castable buff to re-cast it at max MP |
| `strange-leaflet.js` | main / leaflet | Strange Leaflet helper |
| `mine-sparkle-highlight.js` | mining / mine | Highlights sparkle spots in the mine |
| `instant-nemesis-maze.js` | volcanomaze | Solves the volcano (nemesis) maze |
| `sell-sort.js` | sell (ugly) | Sortable sell list |
| `wiki-links.js` | charpane / place / choice / questlog / fight / inventory | "W" badge linking the last adventure, location title, choice-adventure name, quest titles, combat monster, acquired items, and inventory item names to the KoL wiki |
| `dwarven-factory-solver.js` | dwarfcontraption | Panel that solves the Dwarven Factory Complex puzzle (a browser port of KoLmafia's "DwaFa"); the solve itself spends no adventures, with an optional opt-in Warehouse run to find the outfit rune |
| `inventory-collapse.js` | inventory | "Collapse all / Expand all" button that flips every inventory category open or closed at once |
| `equip-optimize.js` | inventory (equipment) | "Optimize for this" button that equips the highest-value item per slot for whatever the enchantment-sort dropdown is sorting by, with element / Monster Level / encounter pickers for those sorts |
| `boss-aggro-warn.js` | place / cobbsknob / crypt / cellar | Warns before you enter a special-reward boss's lair if your Monster Aggravation Device isn't set to force the unique reward to drop |
| `quest-helper.js` | choice / tiles / adventure / pandamonium / fight / charpane / inv_use / runskillz / sushi | Fills in, highlights or explains the answer to puzzle-y quest adventures: Drawn Onward sets Dr. Awkward's four photo dropdowns; the Hidden Temple tile floor (Beginning at the Beginning of Beginning) glows the tile to step on in each row, spelling B-A-N-A-N-A-S from the bottom up and numbered in step order; Control Freak (the pyramid control room) tracks where the Lower Chambers are pointing and says how many more times to turn the peg, when to go down instead, and — the trap at the end — when to stop turning; Talk to Sven Golly gets an overview of the band — who craves and hates what, which of the six items each member accepts, which of those are in your dropdown and where the rest drop — with a button per give that only fills the two dropdowns. On `fight.php` it flags the one round where the molybdenum magnet takes a gremlin's tool, or Gothy Handwave studies a raver's special move. For the Mer-kin Deepcity quest it covers both paths: in the Colosseum it reads the gladiator's telegraph, names the skill that counters it and says which of the three gladiatorial weapons this opponent needs (always the next one round the cycle, never his own), warning when you're holding the wrong one; for the scholar path it tracks the dreadscroll's eight prophecy words — clues are filed automatically from the pages that print them, each failed reading is scored from the length of the Deep-Tainted Mind it cost and fed into a solver, the card catalogue says which library words are still outstanding, and a **Mer-kin** button in the sidebar, under the Current Quest block, opens the tracker anywhere. In the charpane it turns the 8-Bit Realm Score's colour into a link to the zone currently paying double. Never submits or clicks — you make the move |
| `ux-enhancers.js` | hermit / campground / mall / inventory / charpane / choice | Grab-bag of small quality-of-life tweaks: a "Buy all clovers" button at the Hermit that trades for every 11-leaf clover still in stock today; a guard on a Beer Garden with less than two days of growth, which flags the crop and asks before harvesting, since the fancy bottles and labels don't drop before day 2; mall bulk buying — a "buy all" action on each store row (capped by that store's daily limit) plus a "Buy N" row per item that walks the stores cheapest-first and shows the total, the average per item and whether you can afford it before spending any Meat; a `[mall]` action next to `[use]` on every tradeable item in the inventory, searching the Mall for that exact item; the link to your monster aggravation device kept on screen in the charpane even at dial 0, which is exactly when KoL hides it; and, in the **Daily Dungeon**, a green outline on the one option in each room that gets you past for **no adventure** — Pick-O-Matic lockpicks or the Platinum Yendorian Express Card on a door, an eleven-foot pole or an equipped candy cane sword cane on a trap, and "Go through the boring door" at either chest with a Ring of Detect Boring Doors equipped (skips three rooms, but you give up that chest's item) — each with a line saying what it costs you |
| `auto-combat.js` | top/awesome menu / charpane | An "Auto" button in the sidebar, under the Last Adventure readout, opening a panel: pick a zone, say how many adventures, press Start. It adventures there in the background from the menu frame — the only frame that isn't torn down while you adventure — logging every step. Fights go to your saved "Auto-Attack until finished" combat macro when you have one, and fall back to attacking round by round when you don't. Choice adventures are *learned*: the first time one comes up the run pauses and the panel offers its options — annotated with what the wiki says each does — and your pick is remembered and answered by itself from then on, with a "remembered choices" list to review or forget them. Turns are counted from `api.php`'s adventure total rather than from requests sent, and anything it doesn't recognise — a fight that won't end, low HP, being beaten up — stops the run and leaves it for you. Zones so far: The Haunted Bedroom |
| `adventure-choices.js` | many | Choice-adventure reward annotations *(not in the loader — uses `GM_*`)* |

**Twilight Heroes** (`TwilightHeroes/`)

| Script | Pages | What it does |
| --- | --- | --- |
| `header-heal.js` | header | "Heal" button in the header |
| `header-hideout-links.js` | header | Extra hideout links in the header |
| `inventory-filter.js` | wear / inventory / use | Text/type filtering for item lists |
| `wearables-ui.js` | wear | Improved wearables UI |
| `sell-sort.js` | sell | Sortable sell list |
| `skills-cast-max.js` | skills | Cast a skill the maximum number of times |
| `wiki-links.js` | fight / nav / journal / maps / wear / inventory / use | "W" badge linking the combat monster, non-combat encounter, received items, map areas, the last patrolled area, journal quests, and item names to the TH wiki |
| `quest-helper.js` | journal | "Next steps" box under each Hero's Journal quest, from a built-in hint map with a TH wiki walkthrough link as fallback |
| `puzzle-solver.js` | goldberg / fight | Goldbergium Door (goldberg.php): solves the contraption for the current goal, shows a component matrix with inventory counts and drop zones, and replays the plan with progress as you build. Bit Player (fight.php): _not yet implemented_ |
| `auto-combat.js` | fight / nav | Buttons to repeat attack/skill until a fight ends, and to re-adventure the same location and auto-attack fight after fight until a non-combat, low HP, or out of turns |
| `autobox.js` | main / criminology | "Get & Equip Black Box" button that walks the criminology.php quest steps and equips the box |

**Fallen London** (`FallenLondon/`)

| Script | Pages | What it does |
| --- | --- | --- |
| `wiki-links.js` | game (SPA) | "W" badge linking storylet titles (in a list, atop an opened storylet, and on opportunity cards in hand — both card layouts) to the Fallen London wiki; the per-choice branch titles are left unlinked |
| `ux-enhancers.js` | game (SPA) | A grab-bag of small quality-of-life tweaks. **A "⚙ UX" button docked into Fallen London's own chrome** — under the Travel button on the wide layout, one more icon in the banner on the narrow one — opens a menu of reference panels. It sits *in* the page rather than over it, so it covers nothing; the last line of the menu switches it back to floating, and it falls back to floating by itself if FL's chrome can't be found. The first panel is **Factions** — every faction's Renown and Favours, the three Renown items it unlocks at Renown 10/25/40, and the Faction Item that turns Favours into Renown, with its shop and price. Renown and Favours are read off the **Myself** tab and which items you hold off **Possessions**; both are remembered, and opening the panel refreshes them in the background (via a hidden frame — `fetch` only returns the app's loading shell). Each half is labelled with how old it is, with a Refresh button and an auto toggle. Anything you could **collect right now** — Renown reached *and* the Favours saved up — gets a filled green **!** badge and is listed at the top of the panel; an outlined brown **!** means the Renown is there but the Favours are not yet. A faction whose **Favours have hit the cap** gets an orange `7/7` badge and its own line at the top — every Favour earned past the cap is thrown away. Each row's **use** button opens that faction's item on Possessions with its options showing (it never picks one — you spend the Favours yourself). Also: **The Crowds of Spite** (the Pickpocket's Promenade) — rates every opportunity card with a colour-coded `+0`…`+9` badge for the bonus Pickpocket's Trophies it pays, a dagger when it draws from the inferior skill table, and a tooltip with the Shadowy challenge, the pass-by option and the cost of failing. Cards paying no trophies (Watchful Eyes, the Rat-Catcher) are labelled instead of scored. Also: **Zailing the Unterzee** — every card at zee gets a badge for what the best line you can take *with nothing special in hand* costs in **Troubled Waters**, in change points, with ½ or · when that line only makes half progress or none, `?` when the figure is a challenge's success value, ★ for the one line that hands you a flat Zailing… 80, and ▾ when a cheaper line is hiding behind an item, a quality or piracy. Black (urgent) cards take their own sinister colour. The tooltip carries every option on the card: challenge, requirement, what it gives, what a failure costs. A second panel, **Zailing**, holds the numbers behind the voyage — what each route needs and roughly what it costs in actions per ship, the Zee Peril of every region, what Troubled Waters does at 7 and 8 and which zee-threat turns it into which black card, where the safe docks are (and which ports are not), the three winds and the dreams they start — plus your current hand ranked, and the whole card table, searchable. Also: **Fruits of the Zee** — every wreck-diving card at the festival gets a badge for the **Thalassic Favour** its treasure trades for at the Fruit Market, grey through to gold, with **★** when the card also offers a rare item you haven’t got, **✓** when you already hold everything it offers, and **?** when your Possessions haven’t been read so neither can be said. Everything at this festival is priced by how deep you are, so the badge quotes your depth’s figure when Full Fathom Five can be read or you set it in the panel, and otherwise the **range** across the depths rather than a number it can’t justify. A coral pays no Favour, so it is labelled instead and goes gold until you hold one of the three items it becomes — the three are **mechanically identical**, so any one finishes that coral for good and a second is just a different name — with **how many of that coral you already hold** in brackets, so a coral you have never seen and one you have two of never read alike. The tooltip carries every claim the card offers, what it gives, and — for a coral — which band of **Sights at the Festival** hands you which of the three. A third panel, **Fruits of the Zee**, is the checklist: your Favour, Devotion, depth and Sights; the five **Supplication on the Shore** options with the attribute each scales off and the **Airs of a Barren Zee** window each is offered in; and the action cost of every Devotion level, with the one to stop at picked out; which of the nineteen collectable items you are still missing (**one per coral**, six that only turn up while diving, six sold at the stalls, and the Bride’s Litter-Cyst) and how to get each; **what is still down there at each depth** — the unique rewards only, not the ones that merely trade for Favour — with the ones a deeper dive would throw away marked **last chance**, because a dive commits you to a depth and the Cloak, the Boots and the Watch all run out before the bottom; what your treasures and spare equipment would fetch traded in; the whole card-by-depth table; and the stall price list marked with what you can afford. Anything collectable **right now** — a coral in hand while Sights sits in the right band, or an item you have the Favour for — is called out at the top. On **Supplication on the Shore** the options themselves are badged in the game with the attribute each one scales off: they all pay the same Devotion, and which of them you are even offered depends on Airs of a Barren Zee (re-rolled every time you act), so the question is which of the two or three actually in front of you suits your best stat |

## Editing / contributing

There is no build, bundler, package manager, test runner, or linter. You edit a
`.js` file, then reload it in your userscript manager against the live page to
try it. See [`AGENTS.md`](./AGENTS.md) for architecture and conventions. The two
rules that bite if you forget them:

- **Bump `@version` on every user-facing change.** Userscript managers only pull
  an update when the remote `@version` is higher than what's installed. An edit
  without a bump never reaches installed users.
- **A file's repo path is its public URL.** Each script's `@downloadURL` (and
  each loader's `@require` line) points at its raw path on `main`. Moving or
  renaming a file breaks auto-updates for everyone who has it installed — if you
  move one, update its `@downloadURL` and any `@require` that references it.
- **Start every `@name` with the game's prefix** so it sorts next to its siblings
  in the userscript manager: `Twilight Heroes ` for `TwilightHeroes/`, `KoL ` for
  `KingdomOfLoathing/`, and `Fallen London ` for `FallenLondon/`. Keep the prefix
  identical across a game's scripts (don't mix `KoL` and `Kingdom of Loathing`).

### Editing the all-in-one loaders

The loaders (`all-in-one/*.js`) contain no logic — just metadata. When you
**add or remove a script**, or change which pages it touches:

1. Add/remove its `@require` line in the matching loader.
2. Update the loader's `@match` union so the new script's pages are covered.
3. Bump the loader's `@version`.

Because every bundled script is a self-guarding IIFE (it scrapes the page it
cares about and bails harmlessly elsewhere), running them all on the union of
matched pages is safe; each one only acts on its own page.

**Important for new bundled scripts:** `@require` runs *every* script on the
*union* of the loader's matched pages — the manager's per-script `@match` no
longer scopes it. So any script that injects UI or takes an action must guard
its own page near the top of the IIFE, e.g.:

```js
if (!/\/charpane\.php/i.test(location.pathname)) return;
```

This is a no-op for the standalone install (its `@match` already scopes it) but
keeps the script from acting on a sibling page when bundled. Scripts that purely
scrape-and-bail (no UI/side effect when their anchor is absent) don't strictly
need it, but adding one is the safe default.

### Tests

There's no test runner. The few bits of pure logic worth checking without a
browser have **standalone Node scripts** in a `test/` subfolder inside the
relevant game directory, named `*.test.mjs` and run directly with `node`:

```
node KingdomOfLoathing/test/iotm-cup13-sort.test.mjs
node KingdomOfLoathing/test/quest-helper-rotation.test.mjs
node KingdomOfLoathing/test/quest-helper-sven.test.mjs
node KingdomOfLoathing/test/quest-helper-merkin.test.mjs
node KingdomOfLoathing/test/daily-checklist-seeding.test.mjs
node KingdomOfLoathing/test/ux-beer-garden.test.mjs
node KingdomOfLoathing/test/ux-mall-buy.test.mjs
node KingdomOfLoathing/test/auto-combat-fight-state.test.mjs
node TwilightHeroes/test/quest-helper.test.mjs
```

Each is dependency-free: it loads the userscript, evaluates its IIFE against a
stub DOM, and asserts on the internals. Copy an existing one when adding a test,
and keep it in the game's `test/` subfolder. See [`AGENTS.md`](./AGENTS.md) for
the re-expose trick these use to reach an IIFE's internals.
