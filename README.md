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
node TwilightHeroes/test/quest-helper.test.mjs
```

Each is dependency-free: it loads the userscript, evaluates its IIFE against a
stub DOM, and asserts on the internals. Copy an existing one when adding a test,
and keep it in the game's `test/` subfolder. See [`AGENTS.md`](./AGENTS.md) for
the re-expose trick these use to reach an IIFE's internals.
