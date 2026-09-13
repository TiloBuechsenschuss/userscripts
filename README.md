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

Looking for a script that used to be here? See
[Merged / removed scripts](#merged--removed-scripts) below.

**Kingdom of Loathing** (`KingdomOfLoathing/`)

| Script | Pages | What it does |
| --- | --- | --- |
| `iotm.js` | top/awesome menu, codpiece decoration choice | "IotM" menu button opening a popup of Item-of-the-Month actions (Codpiece, Play Ball, Cup of 13s), plus tools on the Eternity Codpiece decoration screen to set every gem slot at once and to save/load named gem setups |
| `daily-checklist.js` | top/awesome menu | Daily tasks checklist |
| `strange-leaflet.js` | main / leaflet | Strange Leaflet helper |
| `instant-nemesis-maze.js` | volcanomaze | Solves the volcano (nemesis) maze |
| `dwarven-factory-solver.js` | dwarfcontraption | Panel that solves the Dwarven Factory Complex puzzle (a browser port of KoLmafia's "DwaFa"); the solve itself spends no adventures, with an optional opt-in Warehouse run to find the outfit rune |
| `quest-helper.js` | choice / tiles / adventure / pandamonium / beerpong / fight / charpane / inv_use / runskillz / sushi | Fills in, highlights or explains the answer to puzzle-y quest adventures: Drawn Onward sets Dr. Awkward's four photo dropdowns; the Hidden Temple tile floor (Beginning at the Beginning of Beginning) glows the tile to step on in each row, spelling B-A-N-A-N-A-S from the bottom up and numbered in step order; Control Freak (the pyramid control room) tracks where the Lower Chambers are pointing and says how many more times to turn the peg, when to go down instead, and — the trap at the end — when to stop turning; Talk to Sven Golly gets an overview of the band — who craves and hates what, which of the six items each member accepts, which of those are in your dropdown and where the rest drop — with a button per give that only fills the two dropdowns. On `fight.php` it flags the one round where the molybdenum magnet takes a gremlin's tool, or Gothy Handwave studies a raver's special move. For the Mer-kin Deepcity quest it covers both paths: in the Colosseum it reads the gladiator's telegraph, names the skill that counters it and says which of the three gladiatorial weapons this opponent needs (always the next one round the cycle, never his own), warning when you're holding the wrong one; for the scholar path it tracks the dreadscroll's eight prophecy words — clues are filed automatically from the pages that print them, each failed reading is scored from the length of the Deep-Tainted Mind it cost and fed into a solver, the card catalogue says which library words are still outstanding, and a **Mer-kin** button in the sidebar, under the Current Quest block, opens the tracker anywhere. At Insult Beer Pong it reads Old Don Rickets' insult, names the retort that answers it and offers to pick it in the dropdown — and because KoL only lists the retorts you have actually collected, it also says which of the eight you own, which are missing, your odds of winning a match, and when the answer to this round simply isn't there and the match is already lost. In the charpane it turns the 8-Bit Realm Score's colour into a link to the zone currently paying double. Never submits or clicks — you make the move |
| `ux-enhancers.js` | hermit / campground / mall / inventory / charpane / choice / sellstuff_ugly / place / cobbsknob / crypt / cellar / questlog / fight | The KoL catch-all — twelve features, each scoped to its own page. **Autosell:** sort buttons that reorder every category at once, a Single list toggle, and Expand all / Collapse all. **Inventory:** "Optimize for this", which equips the highest-value item per slot for whatever the enchantment-sort dropdown is sorting by; a Collapse all / Expand all button; a `[mall]` action next to `[use]` on every tradeable item; and a **"pays out"** checkbox beside KoL's own Filter box that hides everything except the items which hand you other items or Meat when used — gift boxes, buckets, scrolls, wallets — closing the gaps by layout alone: it writes inline styles and never moves, adds or removes a node, so KoL's own list keeps its order. A **"group by type"** box under it sorts the survivors into multi-use recipes (a smoked potsherd makes five different things depending on how many you use at once), Meat, random yields and plain items, with a heading over each — by flex `order`, so again nothing is moved. It matches by item id against [`data/kol-use-yields-items.tsv`](data/kol-use-yields-items.tsv), derived from the wiki's `{{acquire}}` and `{{meat}}` templates, and leaves out items that merely turn into a used copy of themselves. **Charpane:** a "heal" button that casts heal skills until HP is full, a "max" button on each prolongable buff that re-casts it as far as your MP allows, and the link to your monster aggravation device kept on screen even at dial 0, which is exactly when KoL hides it. **Wiki "W" badges** on the last adventure, location and choice titles, quest titles, the combat monster, items you acquire, and inventory item names. **Before a boss:** a banner when your Aggravation Device isn't set to force a Boss Bat / Bonerdagon / Knob Goblin King / Baron von Ratsworth special drop, on the page before you commit the adventure. Grab-bag of small quality-of-life tweaks: a "Buy all clovers" button at the Hermit that trades for every 11-leaf clover still in stock today; a guard on a Beer Garden with less than two days of growth, which flags the crop and asks before harvesting, since the fancy bottles and labels don't drop before day 2; mall bulk buying — a "buy all" action on each store row (capped by that store's daily limit) plus a "Buy N" row per item that walks the stores cheapest-first and shows the total, the average per item and whether you can afford it before spending any Meat; a `[mall]` action next to `[use]` on every tradeable item in the inventory, searching the Mall for that exact item; the link to your monster aggravation device kept on screen in the charpane even at dial 0, which is exactly when KoL hides it; and, in the **Daily Dungeon**, a green outline on the one option in each room that gets you past for **no adventure** — Pick-O-Matic lockpicks or the Platinum Yendorian Express Card on a door, an eleven-foot pole or an equipped candy cane sword cane on a trap, and "Go through the boring door" at either chest with a Ring of Detect Boring Doors equipped (skips three rooms, but you give up that chest's item) — each with a line saying what it costs you |
| `auto-combat.js` | top/awesome menu / charpane | An "Auto" button in the sidebar, under the Last Adventure readout, opening a panel: pick a zone, say how many adventures, press Start. It adventures there in the background from the menu frame — the only frame that isn't torn down while you adventure — logging every step. Fights go to your saved "Auto-Attack until finished" combat macro when you have one, and fall back to attacking round by round when you don't. Choice adventures are *learned*: the first time one comes up the run pauses and the panel offers its options — annotated with what the wiki says each does — and your pick is remembered and answered by itself from then on, with a "remembered choices" list to review or forget them. A choice with only one button is taken without asking, and *Peering Through Your Peridot* answers itself with "I choose peace" wherever it turns up. Turns are counted from `api.php`'s adventure total rather than from requests sent, and anything it doesn't recognise — a fight that won't end, low HP, being beaten up — stops the run and leaves it for you. Zones so far: The Haunted Bedroom, and Inside the Palindome — which farms the Elf Farm Raffle ticket: it won't start while you're carrying a ticket (the elf stays away until they're used) or without the Talisman o' Namsilat equipped, answers the zone's noncombats itself, stops the moment a ticket drops, and keeps a per-character count of the tickets you've picked up today |
| `auto-mine.js` | top/awesome menu / mining / mine | A "Mine" button in the advice box on `mining.php`, opening a panel that farms the **Velvet / Gold Mine** the way the [loathers/oreo](https://github.com/loathers/oreo) KoLmafia script does: pick a strategy (`pjb`, `oreo`, `ev`, `ev-cluster`), a visibility mode and a turn budget, press Start, and it digs from the menu frame — choosing each square by oreo's expected-value model over where the six-square velvet vein can still be, routing to it through the cheapest path, and finding a new cavern once nothing left in this one is worth a turn. The whole strategy core is a port of oreo's, calibrated λ included. Whenever *you* are looking at `mining.php` it paints the same advice onto the mine — the square to dig, the route to it, and why — which commits nothing, and which is where the Start button lives. In any mine, including Itznotyerzitz where the advisor stays quiet, it also gives the twinkling "Promising Chunk of Wall" tiles a pulsing gold glow and marks the other mineable tiles. Unlike oreo it never buys, equips, heals or diets: it reads what you already have (dynamite in your inventory, Object Detection in your effects) and refuses to start, by name, when something is missing. Turns are counted from `api.php`'s adventure total, so free mining actions don't burn the budget; `0` turns spends only those |
| `adventure-choices.js` | many | Choice-adventure reward annotations *(not in the loader — uses `GM_*`)* |

**Twilight Heroes** (`TwilightHeroes/`)

| Script | Pages | What it does |
| --- | --- | --- |
| `ux-enhancers.js` | header / skills / nav / inventory / wear / use / sell / journal / fight / maps / main / criminology | The Twilight Heroes catch-all — nine features, each scoped to its own page. **Header:** a "Heal" link that casts your heal skills until HP is full, plus Garage / Rest links next to Hideout. **Skills / nav:** a "max" button per buff that casts it as many times as your PP allows, with a compact version in the sidebar. **Items (inventory / wear / use):** a filter box that narrows the list as you type, with a type dropdown, remembered across the reload equipping or using something causes. **Wear:** sortable columns for your wearables. **Sell:** sort buttons for the item list. **Journal:** the next step for each open quest. **Wiki "W" badges** on combat monsters and drops, your last area, quest titles, map areas and item names. **Main:** a "Get & Equip Black Box" button that drives the Black Box quest through criminology.php for you |
| `puzzle-solver.js` | goldberg / fight | Goldbergium Door (goldberg.php): solves the contraption for the current goal, shows a component matrix with inventory counts and drop zones, and replays the plan with progress as you build. Bit Player (fight.php): _not yet implemented_ |
| `auto-combat.js` | fight / nav | Buttons to repeat attack/skill until a fight ends, and to re-adventure the same location and auto-attack fight after fight until a non-combat, low HP, or out of turns |

**Fallen London** (`FallenLondon/`)

| Script | Pages | What it does |
| --- | --- | --- |
| `wiki-links.js` | game (SPA) | "W" badge linking storylet titles (in a list, atop an opened storylet, and on opportunity cards in hand — both card layouts) to the Fallen London wiki; the per-choice branch titles are left unlinked |
| `ux-enhancers.js` | game (SPA) | A grab-bag of small quality-of-life tweaks. **A "⚙ UX" button docked into Fallen London's own chrome** — under the Travel button on the wide layout, one more icon in the banner on the narrow one — opens a menu of reference panels. It sits *in* the page rather than over it, so it covers nothing; the last line of the menu switches it back to floating, and it falls back to floating by itself if FL's chrome can't be found. The first panel is **Factions** — every faction's Renown and Favours, the three Renown items it unlocks at Renown 10/25/40, and the Faction Item that turns Favours into Renown, with its shop and price. Renown and Favours are read off the **Myself** tab and which items you hold off **Possessions**; both are remembered, and opening the panel refreshes them in the background (via a hidden frame — `fetch` only returns the app's loading shell). Each half is labelled with how old it is, with a Refresh button and an auto toggle. Anything you could **collect right now** — Renown reached *and* the Favours saved up — gets a filled green **!** badge and is listed at the top of the panel; an outlined brown **!** means the Renown is there but the Favours are not yet. A faction whose **Favours have hit the cap** gets an orange `7/7` badge and its own line at the top — every Favour earned past the cap is thrown away. Each row's **use** button opens that faction's item on Possessions with its options showing (it never picks one — you spend the Favours yourself). The rating badges on cards and storylets, and the Zailing, Port Carnelian, Scientific Voyages and Fruits of the Zee panels, moved to `choice-helper.js` in 3.0; with that installed, its panels are listed in this same menu, after Factions. **Equipment:** on **Possessions**, picking a stat in the **Show:** filter puts a gold **★** on the item in every slot that gives the most of it — every one, where two tie, and none where nothing in the slot gives any — with a line above the list saying what the starred items add up to worn together. The filter also gains **BDR**, after Bizarre, which scores each item on its Bizarre, Dreaded and Respectable **added together** — so Bizarre +3 beats Respectable +2. **Menaces** work the same way: pick Nightmares (or Scandal, Suspicion, Wounds) and the star goes to whatever does most against its build-up, scored as the [Menaces guide](https://fallenlondon.wiki/wiki/Menaces_(Guide)#Menace_Equipment) scores it — *reduces* 1, *greatly* 2, *massively* 4, and an item that *increases* it counts against itself. It only highlights — it never equips anything. |
| `choice-helper.js` | game (SPA) | Advice on what storylets and opportunity cards do for you, badged onto them where you make the choice. Split out of `ux-enhancers.js` at its 3.0 — if you installed that script on its own before then, add this one. Its reference panels open from `ux-enhancers.js`'s **⚙ UX** menu, so install both to reach them; every badge works without it. **The Crowds of Spite** (the Pickpocket's Promenade) — rates every opportunity card with a colour-coded `+0`…`+9` badge for the bonus Pickpocket's Trophies it pays, a dagger when it draws from the inferior skill table, and a tooltip with the Shadowy challenge, the pass-by option and the cost of failing. Cards paying no trophies (Watchful Eyes, the Rat-Catcher) are labelled instead of scored. Also: **Zailing the Unterzee** — every card at zee gets a badge for what the best line you can take *with nothing special in hand* costs in **Troubled Waters**, in change points, with ½ or · when that line only makes half progress or none, `?` when the figure is a challenge's success value, ★ for the one line that hands you a flat Zailing… 80, and ▾ when a cheaper line is hiding behind an item, a quality or piracy. Black (urgent) cards take their own sinister colour. The tooltip carries every option on the card: challenge, requirement, what it gives, what a failure costs. Its panel, **Zailing**, holds the numbers behind the voyage — what each route needs and roughly what it costs in actions per ship, the Zee Peril of every region, what Troubled Waters does at 7 and 8 and which zee-threat turns it into which black card, **every port on the Unterzee** grouped by region with whether docking there wipes Troubled Waters and the zee-threats and what it takes to sail there at all — `✔ safe`, `✘` for a real dock that resets nothing (Port Cecil, Godfall, Irem, Gaider’s Mourn, Tanah-Chook) and **not a dock** for the four hunting grounds, because those are three different answers and two of them would otherwise read alike, with the Fate-locked and one-time destinations marked, the three winds and the dreams they start — plus your current hand ranked, and the whole card table, searchable. Also: **Fruits of the Zee** — every wreck-diving card at the festival gets a badge for the **Thalassic Favour** its treasure trades for at the Fruit Market, grey through to gold, with **★** when the card also offers a rare item you haven’t got, **✓** when you already hold everything it offers, and **?** when your Possessions haven’t been read so neither can be said. Everything at this festival is priced by how deep you are, so the badge quotes your depth’s figure when Full Fathom Five can be read or you set it in the panel, and otherwise the **range** across the depths rather than a number it can’t justify. A coral pays no Favour, so it is labelled instead and goes gold until you hold one of the three items it becomes — the three are **mechanically identical**, so any one finishes that coral for good and a second is just a different name — with **how many of that coral you already hold** in brackets, so a coral you have never seen and one you have two of never read alike. The tooltip carries every claim the card offers, what it gives, and — for a coral — which band of **Sights at the Festival** hands you which of the three. Its panel, **Fruits of the Zee**, is the checklist: your Favour, Devotion, depth and Sights; the five **Supplication on the Shore** options with the attribute each scales off and the **Airs of a Barren Zee** window each is offered in; and the action cost of every Devotion level, with the one to stop at picked out; which of the nineteen collectable items you are still missing (**one per coral**, six that only turn up while diving, six sold at the stalls, and the Bride’s Litter-Cyst) and how to get each; **what is still down there at each depth** — the unique rewards only, not the ones that merely trade for Favour — with the ones a deeper dive would throw away marked **last chance**, because a dive commits you to a depth and the Cloak, the Boots and the Watch all run out before the bottom; what your treasures and spare equipment would fetch traded in; the whole card-by-depth table; and the stall price list marked with what you can afford. Anything collectable **right now** — a coral in hand while Sights sits in the right band, or an item you have the Favour for — is called out at the top. On **Supplication on the Shore** the options themselves are badged in the game with the attribute each one scales off: they all pay the same Devotion, and which of them you are even offered depends on Airs of a Barren Zee (re-rolled every time you act), so the question is which of the two or three actually in front of you suits your best stat. Also: **Port Carnelian** — the one supported area with **no opportunity cards at all**, so here the badges go on **storylets** and on their **options**. The whole term is a single storylet, *Matters of State*, so what gets rated is the list of options inside it, and the options of the two of those that open into a storylet of their own. Each carries the option's **net** change in resources — the guide's own figure — with **▼** when that net is paid for out of **Imperial Legitimacy** (the number that, at 0, ends the term at once with no rewards and a trip back to the Foreign Office), **▲** when the option buys Legitimacy back instead, no mark when it leaves Legitimacy alone, **Fate** when it is Fate-locked, and **cash out** for the four Time 12 endings, which spend a currency rather than gaining one. The four endings carry **what cashing out would pay you right now** in Echoes, worked out from your own **Striped Delights** and **Silver Horseheads** — read off the **Myself** tab, remembered, and refreshed in a hidden frame in the background while an ending is on screen and again when the panel opens on a stale reading. A **❖** marks a payout that is partly a **faction Favour** — a story quality capped at 7, which nothing buys — so it counts as **0 Echoes**: pricing one would let a fixed reward out-rank a real cash-out on a number nobody acts on (Tribute, which has no market price either, is listed and left out of the total the same way). A **Favour in High Places** is not one of those despite the name — it is an ordinary item — so it is priced like one. A **?** means the reading is over a minute old — every action of a term moves both currencies — and a plain **cash out** means your numbers have never been read at all. The tooltip carries the whole sum: what you hold, what it turns into, what each piece is worth, what the next **rounding step** would cost you, and — for the two endings that pay a fixed reward and empty both purses — what taking one gives up. The colour says the same thing the mark does — red spending Legitimacy, green buying it back, light blue leaving it alone, slate for the endings — so the marks alone are enough if the colours are not. Half the table is worth +5, so what separates those rows is exactly what the mark says. The tooltip carries the **Time Passing in Office** and **Airs** windows the option is offered in, every currency change spelled out with its currency named — the two rows that pay "10 of *one* of the two, the game's choice" say so in words, since reading them as 10 of each would make them the best rows in the table — the requirement, and the note. A storylet the guide splits in two is badged with the better net and keeps both branches in its tooltip, because the losing branch is how Legitimacy is bought back. Its panel, **Port Carnelian**, opens on the same calculator — your purse, and all four endings priced against it with the best one named in words — and then holds the rest of the guide: how to unlock and reach the posting, the rules a 26-action term is played by, every option grouped by the clock and searchable, what each currency cashes in for and the reward-tier table with the two rounding steps worth aiming at (105 and 176) picked out and a **D** or **H** against the step each of your currencies is standing on, and the strategy — keep Legitimacy under 90, stock Horseheads while Time is 1–6, always cash Delights once Tribute is unlocked. Also: **Voyages of Scientific Discovery** — the Dilmun Club's expeditions to **Bullbone Island**, **Corpsecage Island** and **Grunting Fen**, which deal no cards either, so again the badges go on the storylets and their branches. Each shows what the action pays in **research pages**, coloured by kind — `AN` Archaeological, `CN` Cryptopalaeontological, `TN` Theosophistical. You sail to one island for one kind, and at every step you are picking between the action that pays it and one that pays goods, so an action paying **no pages is labelled with what it does pay** (`Glim ×860`) rather than scored: pages and Echoes have no exchange rate, and inventing one would be the badge choosing your voyage. The three end-of-visit gambles carry **≈** and their **expected** value, not the figure they advertise — *Tarry a little* is worth about six times *Cut it fine* once the 70% chance of losing five of every type is counted. The tooltip carries the **Orthos is Coming!** band, the challenge, everything it gives, the cost and the failure; where the game picks between two payouts rather than you, that is said in words. The same badges cover **Preparatory Research** and **Organise your Research** at your Lodgings, and there the figure is the guide's **pence per page**, with the best rate in gold. *Time to go*, *Tarry a little* and *Cut it fine* are on all three islands and pay a different page on each, so the feature works out which island it is looking at from the greeting or from the open storylet, and stays **silent rather than guessing**. Its panel, **Scientific Voyages**, holds the rest: what the Dilmun Club wants before it will sponsor you, a per-island table of pages, region and EPA, every action grouped by island and searchable, and how to squeeze the most preparatory research out of London first |

### Merged / removed scripts

Some scripts have been folded into another one — usually because both worked on
the same page and had drifted into keeping duplicate copies of the same helper.
The feature is not gone; it lives in the script named below, and the old file has
been deleted from the repo.

**If you installed one of these directly, uninstall it and install its new home.**
A deleted file stops receiving updates but does *not* disappear from your
userscript manager, so the old copy keeps running against a stale version of the
page. (The merged scripts guard on element ids, so nothing breaks visibly if both
are installed — you just won't get fixes.) If you use the all-in-one loader
instead, there is nothing to do.

| Removed script | Now part of | Since | What moved |
| --- | --- | --- | --- |
| `KingdomOfLoathing/skills-cast-max.js` | [`KingdomOfLoathing/charpane-heal.js`](https://raw.githubusercontent.com/TiloBuechsenschuss/userscripts/refs/heads/main/KingdomOfLoathing/charpane-heal.js) | charpane-heal 1.3 | The **max** button on each prolongable buff, and the "refresh skills" button. Both halves now share one read of the skills page instead of caching it twice per charpane rebuild |
| `KingdomOfLoathing/mine-sparkle-highlight.js` | [`KingdomOfLoathing/auto-mine.js`](https://raw.githubusercontent.com/TiloBuechsenschuss/userscripts/refs/heads/main/KingdomOfLoathing/auto-mine.js) | auto-mine 0.6 | The gold glow on "Promising Chunk of Wall" tiles and the marks on the other mineable ones. Still works in every mine, including Itznotyerzitz, where the mining advisor stays quiet |
| `KingdomOfLoathing/inventory-collapse.js` | [`KingdomOfLoathing/equip-optimize.js`](https://raw.githubusercontent.com/TiloBuechsenschuss/userscripts/refs/heads/main/KingdomOfLoathing/equip-optimize.js) | equip-optimize 1.4 | The **Collapse all / Expand all** button. It shares the category-flipping code with "Optimize for this", which expands every category before it compares items |
| `KingdomOfLoathing/sell-sort.js` | [`KingdomOfLoathing/ux-enhancers.js`](https://raw.githubusercontent.com/TiloBuechsenschuss/userscripts/refs/heads/main/KingdomOfLoathing/ux-enhancers.js) | ux-enhancers 1.9 | The autosell toolbar: the Quantity / Sell price / Name sort buttons, the Single list toggle, and Expand all / Collapse all |
| `KingdomOfLoathing/boss-aggro-warn.js` | [`KingdomOfLoathing/ux-enhancers.js`](https://raw.githubusercontent.com/TiloBuechsenschuss/userscripts/refs/heads/main/KingdomOfLoathing/ux-enhancers.js) | ux-enhancers 1.10 | The pre-boss Aggravation Device banner. It landed here because the file already knew the device and the moon signs that pick it |
| `KingdomOfLoathing/wiki-links.js` | [`KingdomOfLoathing/ux-enhancers.js`](https://raw.githubusercontent.com/TiloBuechsenschuss/userscripts/refs/heads/main/KingdomOfLoathing/ux-enhancers.js) | ux-enhancers 1.11 | All seven wiki "W" badges. Now six registry entries over one set of shared helpers, one per page |
| `KingdomOfLoathing/equip-optimize.js` | [`KingdomOfLoathing/ux-enhancers.js`](https://raw.githubusercontent.com/TiloBuechsenschuss/userscripts/refs/heads/main/KingdomOfLoathing/ux-enhancers.js) | ux-enhancers 1.12 | "Optimize for this" and the Collapse all / Expand all bar (this file had already absorbed `inventory-collapse.js`) |
| `KingdomOfLoathing/charpane-heal.js` | [`KingdomOfLoathing/ux-enhancers.js`](https://raw.githubusercontent.com/TiloBuechsenschuss/userscripts/refs/heads/main/KingdomOfLoathing/ux-enhancers.js) | ux-enhancers 1.13 | The `heal` button and the per-buff `max` buttons (this file had already absorbed `skills-cast-max.js`). `#tm-charpane-heal` is unchanged, so `auto-mine.js` still finds it across frames |
| `TwilightHeroes/header-heal.js` | [`TwilightHeroes/ux-enhancers.js`](https://raw.githubusercontent.com/TiloBuechsenschuss/userscripts/refs/heads/main/TwilightHeroes/ux-enhancers.js) | ux-enhancers 1.0 | The header "Heal" link. Its skills-page scrape is now shared with the "max" buttons instead of being a second copy |
| `TwilightHeroes/header-hideout-links.js` | [`TwilightHeroes/ux-enhancers.js`](https://raw.githubusercontent.com/TiloBuechsenschuss/userscripts/refs/heads/main/TwilightHeroes/ux-enhancers.js) | ux-enhancers 1.0 | The Garage / Rest links beside Hideout |
| `TwilightHeroes/inventory-filter.js` | [`TwilightHeroes/ux-enhancers.js`](https://raw.githubusercontent.com/TiloBuechsenschuss/userscripts/refs/heads/main/TwilightHeroes/ux-enhancers.js) | ux-enhancers 1.0 | The item filter on inventory / wear / use, including the per-page sessionStorage that survives an equip or use reload |
| `TwilightHeroes/wearables-ui.js` | [`TwilightHeroes/ux-enhancers.js`](https://raw.githubusercontent.com/TiloBuechsenschuss/userscripts/refs/heads/main/TwilightHeroes/ux-enhancers.js) | ux-enhancers 1.0 | Sortable columns on the wear page |
| `TwilightHeroes/sell-sort.js` | [`TwilightHeroes/ux-enhancers.js`](https://raw.githubusercontent.com/TiloBuechsenschuss/userscripts/refs/heads/main/TwilightHeroes/ux-enhancers.js) | ux-enhancers 1.0 | The sort buttons on the sell page |
| `TwilightHeroes/skills-cast-max.js` | [`TwilightHeroes/ux-enhancers.js`](https://raw.githubusercontent.com/TiloBuechsenschuss/userscripts/refs/heads/main/TwilightHeroes/ux-enhancers.js) | ux-enhancers 1.0 | The "max" buttons on skills.php and in the nav sidebar. The sidebar button still carries `data-pp-cost`, which `auto-combat.js` reads |
| `TwilightHeroes/wiki-links.js` | [`TwilightHeroes/ux-enhancers.js`](https://raw.githubusercontent.com/TiloBuechsenschuss/userscripts/refs/heads/main/TwilightHeroes/ux-enhancers.js) | ux-enhancers 1.0 | All the wiki "W" badges — combat monsters and drops, last area, quest titles, map areas, item names |
| `TwilightHeroes/quest-helper.js` | [`TwilightHeroes/ux-enhancers.js`](https://raw.githubusercontent.com/TiloBuechsenschuss/userscripts/refs/heads/main/TwilightHeroes/ux-enhancers.js) | ux-enhancers 1.0 | The journal quest hints. Its `wikiHref` was the more capable of the two and is the one the whole file now uses |
| `TwilightHeroes/autobox.js` | [`TwilightHeroes/ux-enhancers.js`](https://raw.githubusercontent.com/TiloBuechsenschuss/userscripts/refs/heads/main/TwilightHeroes/ux-enhancers.js) | ux-enhancers 1.0 | The "Get & Equip Black Box" button and the criminology.php run it drives |

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

### Generated data

`data/` holds reference tables scraped from a game's wiki. They are **generated,
not hand-maintained** — the script that produces one is named in its header
comment, and re-running that script is how you update it.

- [`data/kol-use-yields-items.tsv`](data/kol-use-yields-items.tsv) — every KoL item
  that hands you other items or Meat when used, with its item id, the Meat it pays,
  and whether its item yield is just the item in another state. Produced by
  [`scripts/fetch-kol-item-yields.mjs`](scripts/fetch-kol-item-yields.mjs), which
  also emits (`--print-ids`) the id list embedded in `ux-enhancers.js` for its
  "pays out" inventory filter. Refresh both together, and bump the script's
  `@version` when the embedded list changes. Scope is the wiki's
  `Category:Usable Items`, so food and drink are out — `hell ramen` pays Meat when
  *eaten*, which is a different action from using an item and would drag every
  consumable into the filter.

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
node KingdomOfLoathing/test/quest-helper-beerpong.test.mjs
node KingdomOfLoathing/test/daily-checklist-seeding.test.mjs
node KingdomOfLoathing/test/ux-beer-garden.test.mjs
node KingdomOfLoathing/test/ux-mall-buy.test.mjs
node KingdomOfLoathing/test/auto-combat-fight-state.test.mjs
node KingdomOfLoathing/test/auto-mine-parse.test.mjs
node KingdomOfLoathing/test/auto-mine-strategy.test.mjs
node TwilightHeroes/test/quest-helper.test.mjs
```

Each is dependency-free: it loads the userscript, evaluates its IIFE against a
stub DOM, and asserts on the internals. Copy an existing one when adding a test,
and keep it in the game's `test/` subfolder. See [`AGENTS.md`](./AGENTS.md) for
the re-expose trick these use to reach an IIFE's internals.
