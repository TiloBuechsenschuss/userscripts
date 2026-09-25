# Plan: badges for the TODO's "Reference" guides

Working plan, kept in the repo so it survives an interruption. Started 2026-09-24. Last updated after WP-7 (all four items).

**Status: WP-0 to WP-7 done. Next: WP-8 (statues and the economy panel).** Nothing has been checked in the game yet; each package's "Not verified in-game" list is in `AGENTS.md`.

## Context

The TODO had a section "Reference (not carousels: overviews, progress qualities, shops)" with 28 wiki guides. None is a single storyline with an option table, so they were set aside. This plan works out, guide by guide, what each can be badged on (opportunity card, storylet option, storylet heading, panel), what `FallenLondon/choice-helper.js` already covers, and how these guides differ from the carousel guides built earlier. Each work package (WP) below is a separate feature and follows the `adding-fallen-london-features` skill (in `.claude/skills/`).

Decisions from the user:

1. **Economy guides get one panel** behind the ⚙ UX button (shops, Stuiver items, trading posts, statue ratings), with badges only on the statue options. (WP-8.)
2. **Spoilers are included**, all of it: Deeper Discordant Studies hints and answers, and the Firmament walkthrough. Design: keep the game's own Hint 1 / Hint 2 / Answer tiers in the tooltip, in that order, so a reader can stop early.
3. **Progress-quality badge = CP per action**, spend rate in the tooltip, not a converted Echo figure. The guide's Echoes per action are tooltip text only.
4. **Order:** THiO + Running Battle first (it finished the two deferred Airs storylets), then the rest in the order below.

Standing project rules (from memory and `AGENTS.md`): **no commits or git-tree changes** (the user commits); bump `@version` on every user-facing change and keep the loader's version in step; colour is never the only carrier (red-green-weak reader); every injected badge needs a touch path (the tooltip also opens on tap).

## Current state of the code (what exists now)

`choice-helper.js` is at 1.27 (HEAD, committed by the user, is 1.26 and covers WP-2 to WP-6; 1.27 adds Hellworm, Risen Burgundy, Station Developments and the City of the Tracklayers), the loader `all-in-one/fallen-london.js` at 0.51. Features registered at the end of `FEATURES`:

| Feature | Entry point | Table | Package |
|---|---|---|---|
| `airs-of-london` | `aolRatings` | `AOL_OPTIONS`, `AOL_DREAMS` | earlier task (committed) |
| `the-hunt-is-on` | `thioRatings` | `THIO_OPTIONS`, `THIO_CARDS` | WP-2 |
| `running-battle` | `runbRatings` | `RUNB_OPTIONS` | WP-2 |
| `casing` | `casingRatings` | `CASING_OPTIONS` | WP-3 |
| `fascinating` | `fasRatings` | `FAS_OPTIONS`, `FAS_CARDS` | WP-4 |
| `inspired` | `inspRatings` | `INSP_OPTIONS`, `INSP_CARDS` | WP-4 |
| `investigating` | `invRatings` | `INV_OPTIONS`, `INV_CARDS` | WP-5 |
| `someone-is-coming` | `sicRatings` | `SIC_OPTIONS`, `SIC_CARDS` | WP-6 |
| `hellworm` | `hwRatings` | `HW_OPTIONS`, `HW_CARDS` | WP-7 |
| `risen-burgundy` | `rbgRatings` | `RBG_OPTIONS`, `RBG_CARDS` | WP-7 |
| `station-developments` | `sdRatings` | `SD_OPTIONS` | WP-7 |
| `city-of-the-tracklayers` | `tlcRatings` | `TLC_OPTIONS`, `TLC_CARD_LIST` | WP-7 |

Shared code, all in `choice-helper.js`: the **progress-quality helper** (`pq*`, block headed `// === shared: progress qualities`, right after `aolRatings`), built on the older carousel plumbing (`carouselRatings`, `carouselIndex`, `carouselLookup`, `carouselRange`, `carouselSigned`, `eachCardName`, `attachBadge`).

Tests, one per package: `tests/choice-airs-of-london.test.mjs`, `choice-progress-qualities.test.mjs` (WP-2), `choice-casing.test.mjs` (WP-3), `choice-fascinating-inspired.test.mjs` (WP-4), `choice-investigating.test.mjs` (WP-5), `choice-someone-is-coming.test.mjs` (WP-6), `choice-hellworm.test.mjs`, `choice-risen-burgundy.test.mjs`, `choice-station-developments.test.mjs`, `choice-city-of-the-tracklayers.test.mjs` (WP-7). Three older suites list every registered feature by hand and must be edited for each new one: `choice-crowds-of-spite`, `choice-fruits-of-the-zee`, `choice-zailing` (append the new feature name to the roster array; `sed` on the previous last entry works).

### The badge vocabulary (WP-1, done)

One vocabulary for every progress quality, so a gain in one storyline reads like a gain in the next:

- gain: `THiO +3? −1` (quality a success makes, then what a failure takes back);
- spend that takes all of it: `THiO 5 ▼ → Jade 938? −5` (level needed, ▼ = uses it up, what it pays);
- fixed-price spend: `Casing −6 ▼ → Pearls ×260`, with `· fail −51` when a failure costs more;
- then any other quality it moves (`APoSB +3`, `Wit +2`, `Beauty −1`), then `N actions` when it costs more than one;
- `?` = a stat challenge's success, `≈` = a Luck option's expected value, `↑` = an amount the page does not give.

Entry fields (shared shape): `storylet`, `name`, `aliases`, `ch` (`{stat, diff, narrow}`, `{luck}`, or `varies`), `win` / `rare` / `lose`, `spend` (level, all taken) or `need` + `cost` (fixed price), `pay`, `g` (items), `x` / `xf` (other qualities on success / failure), `u` (items spent), `airs` / `re`, `label`, `needs`, `fate`, `actions`, `note`, `guide`, `guideEpa`. A narrow challenge is certain four levels above its difficulty. Helper functions per feature (`thioHunt`, `runbSpend`, `casRob`, `casCost`, `fasSpend`, `fasCourt`, `inspSpend`…) just fill the shape. A feature def has `cfg`, `options`, `index`, `storylets`, `cards`, `cardKeys` (heading stays the card badge's or another feature's), `aliases` (a storylet's second name), `noHeading` (a storylet another feature already heads), and the four class/flag names.

## Findings that shape the remaining work

### The 28 guides, by kind

- **A. Progress-quality guides (9):** Casing, Fascinating, The Hunt is On!, Inspired, Investigating, Running Battle, Someone Is Coming, Seeking, Dramatic Tension. Done: Casing, Fascinating, THiO, Inspired, Investigating, Running Battle, and Seeking (Wars of Illusion plus one card; its *Find a Tattooed Courier's contact* spends are still open). Someone Is Coming is done too (WP-6, apart from the thirteen Conflict Cards). Dramatic Tension is fully covered. **Every guide in group A is now done.**
- **B. Menace Locations (1):** five menace jails, each with its own red card deck; badge = the menace change, lower is better. (WP-9.)
- **C. Real carousels filed as reference (5):** Hellworm, The City of the Tracklayers, Risen Burgundy, Railway Station Developments, Statues at the GHR Stations. (WP-7, WP-8.)
- **D. Story and puzzle guides (4):** Firmament (Guide), The Hurlers (Guide), Discordant Studies – Costs and Rewards, Deeper Discordant Studies. Spoilers included. (WP-10.)
- **E. Navigation, shops, grinds (5):** Iron Republic Street Map (a day graph, badge = destination), Roof Economy, Stuiver Grinding, Hinterland Scrip-Making, Location-specific cards in the Hinterlands.
- **F. Overviews with no new surface (4) and a stub:** Railway (Guide), Railway Beginning (Guide), Bessemer Steel Ingot (Guide), plus Scrip-Making; Marriage (Guide) was a two-line stub (replaced in the TODO by Weddings and Spouses).

### Differences to keep in mind (versus the earlier carousel guides)

1. **One quality spans many storylines.** Build per storyline, never per guide, or an option gets two badges. Before writing a table, look each option up in the existing tables; a test asserts no title is in two tables.
2. **Stale guides.** Running Battle is `{{Outdated}}`; Casing, Dramatic Tension, Roof Economy, Stuiver Grinding and Iron Republic are flagged as needing work. The option pages win; carry each disagreement as a `guide` field and pin it in a test. In practice guides also disagree with pages on which storyline an option belongs to (the Fascinating guide swaps two Rising Artist rows), so check the page's backlinks, not the guide's column.
3. **Cards vs storylets.** An opened card is headed like a storylet (`.storylet-root__heading`), so its options use the same pass; the card's own badge goes on the hand and on the opened heading through `eachCardName`, and `cardKeys` stops the storylet pass badging the heading twice. Card names are often ordinary English and would need `strict` and a greeting gate; the hand cards done so far were distinctive enough not to.
4. **Shared storylets.** Madame Shoshana's tent holds Fascinating, Inspired and Investigating options; `Read incoming mail` holds an Inspired and an Investigating one; `Attend to the Dreamer` is Oneiropomp's. One feature owns the heading (`noHeading` on the others); each badges only its own options. Do the same for any storylet two qualities share.
5. **Shared cards with an older feature.** The Clay Highwayman feature badges the five Larceny card headings; Casing badges the options inside. Neither badges the other's.
6. **Airs.** Options gated on The Airs of London carry `airs` windows and `re` (re-rolls Airs on `both` / `win` / `none`); reuse `aolWindows` and `aolRerolls`.
7. **A different meaning of "badge".** Iron Republic (destination day), Firmament and Deeper Discordant Studies (what an option sets), Menace Locations (menace change), Statues (a 1–4 rating and which statue you built) are not ratings; each needs its own "what does the one number mean" decision written into the file.
8. **State-dependent options.** Under the Statue at X shows the statue you built, with a `(Subject)` placeholder; add it to `CAROUSEL_PLACEHOLDER` (currently 35 entries, `gendertitle` was the last) and keep an "unread" case honest.
9. **Roster churn.** Each new feature: entry in `FEATURES`, three roster suites, `AGENTS.md` (write-up, "Not verified in-game" entry, test-list entry), README row, the header comment, TODO, version. A panel adds a fourth suite (`ux-launcher-docking`).

### Name and tooling traps found so far

- **Identifier prefixes collide.** `RB_` is Railway Board, so Running Battle uses `RUNB_`. Grep `const PREFIX_` before choosing one.
- **Windows path and encoding.** Python run from the repo root needs relative paths (`FallenLondon/choice-helper.js`), not `/e/…`. Python text mode rewrites `\n` as CRLF on this machine, which is what the working tree already has (git stores LF). Non-ASCII in `print` needs `PYTHONIOENCODING=utf8`. Backslashes in `python` string replacements are error-prone; build them with `chr(92)` or use the Edit tool.
- **Large `cat <<'EOF'` heredocs sometimes fail** in the shell tool; write the file with the Write tool to the scratchpad and `cat` it in.
- **The scratchpad is temporary.** The fetched wiki pages lived in it; to redo a package, re-fetch with the scripts below.

## How to do a package (the recipe that worked)

1. **Fetch.** `node .claude/skills/planning-a-fallen-london-guide-feature/fetch-wiki-pages.mjs titles.txt outdir` (one title per line; batches of about 40), then `node …/extract-wiki-pages.mjs outdir > extract.txt`. Fetch the guide, then the storylet pages, then **every card and option page** (the option titles come from the storylet extract's `OptionN:` lines). Backlinks find which storylet holds an option: `https://fallenlondon.wiki/w/api.php?action=query&list=backlinks&bltitle=…&blnamespace=0&format=json&formatversion=2` (send a browser User-Agent; `WebFetch` is blocked by Anubis).
2. **Check coverage.** `grep -n -i "<title>" FallenLondon/choice-helper.js` for each storyline; existing features may already badge parts.
3. **Write the table** in `choice-helper.js` after the last feature block (before `// === feature: Forgotten Quarter Expeditions`), in the shared shape; comment above it says which source was followed and lists every guide-versus-page disagreement, and that corrections go in that table only. Register in `FEATURES` (end of the array) with a `run`.
4. **Test.** Copy the harness head of `tests/choice-fascinating-inspired.test.mjs` (stub DOM, export list in the `.replace(/\}\)\(\);…/)` call), then pin: the vocabulary by hand, every disagreement by name, title traps, scoping to the open storylet, cards, no title in another table.
5. **Docs.** Header comment paragraph, README row, `AGENTS.md` (feature paragraph after the Casing one, "Not verified in-game" entry after the Casing one, test-list entry before `choice-painting-balmoral`), TODO (move the guide's line under **Implemented → Reference**), roster suites.
6. **Verify.** `node --check FallenLondon/choice-helper.js`; `node .claude/skills/adding-fallen-london-features/check.mjs`; `for t in tests/*.test.mjs; do echo "$(basename $t): $(node $t | tail -1)"; done` (suites end in `All checks passed.`, `all good` or `All passed`); `node scripts/bump-loaders.mjs --check`.

## Work packages

### WP-0 — TODO housekeeping — DONE
Marriage (Guide) replaced by Weddings (Guide) and Spouses (Guide) (not yet analysed: fetched, no audience tag; Weddings is carousel-like, Spouses reference-like). Risen Burgundy (Guide) moved to a Late Firmament carousel entry. Aggregator guides annotated "covered by …", stale guides flagged. Also added *Seeking the Meaning of the Plaster Face (Guide)* (Big Rat story, Early MYN) to the open list; its Running Battle options are already in `running-battle`.

### WP-1 — Shared progress-quality helper — DONE
The `pq*` block and vocabulary above. Extended in WP-3 (`cost`/`need`, `actions`, `u`, `varies`, `lose > 0` as `fail +n`) and WP-4 (string amounts, `noHeading`).

### WP-2 — The Hunt is On! + Running Battle — DONE
`the-hunt-is-on` and `running-battle`. Includes the two Airs storylets the Airs feature had deferred (Hunting Dangerous Prey, Duelling the Black Ribbon; the latter's heading is renamed at A Name Scrawled in Blood 5, handled by `aliases`). Options followed from the pages because the Running Battle guide is Outdated. Left out: Breeding Monsters, the later Labyrinth coils, the Firmament card's two THiO-less options, the Big Rat's other story, *Purchase some assistance with Casing...*.

### WP-3 — Casing — DONE
`casing`. Area-diving in Spite, Steal Paintings, the Big Score prelude, targets and every robbery, selling information, thefts of particular character, and the options inside the five Clay Highwayman larceny cards. Left out: Grand Larcenies (Cover Identities), heist options (On a Heist), Risen Burgundy's two Casing cards, Parabola's *Find the weakness in an opponent's defences*, the Big Rat's purchase of Casing.

### WP-4 — Fascinating + Inspired — DONE
`fascinating` and `inspired`. Court romances badged rung by rung with the "Seen with" quality each raises. Left out: the seductions' mid-affair steps, Helicon House, Clay Highwayman, Seduce an Alluring Masquer, A Visit's Commission a painting, the empress court's writing, Oneiropomp's inspiration.

### WP-5 — Investigating + the Seeking card — DONE
`investigating`. The Melancholy Curate's storyline (six gain storylets that each show at a band of the quality, and a three-option ending), the University's six investigations (the `(department)` placeholder), ten opportunity cards (Tea with the Inspector, A new piece in the Game, Your plant is singing, five Upper River cards, Clay Highwayman's Gang 2, Officially Non-Criminal), the Correspondence Stones, the Scheme of a Phoenix, the Helicon tour's first option, and the fixed-price spends. *A new piece in the Game* also carries Seeking +4, which closes the Seeking guide's card item. Left out because another feature owns it: the Heights of Chicanery, Cornelius, Helicon House's doors, the Clay Highwayman's trail (`clay-highwayman`) and camp cards (`disappearing`), the University's Featuring steps, the pre-July Porters trade. Still open from the Seeking guide: *Making Your Name: Find a Tattooed Courier's contact*.

### WP-6 — Someone Is Coming — DONE
`someone-is-coming`. The eight *A Gift from the Capering Relicker* payouts (fixed 21 CP at level 4, not a reset), the drunk rat in *Rob a drunk* (6 CP, level 3), and 40 card options across 17 cards and storylets, each of which raises the counter by exactly 1 so the badge names the profit. Two shapes were added to the shared helper: a gain may carry `pay` (the profit), and a card may carry a fixed `badge` word. Left out: the thirteen Conflict Cards (each wants two Favours; the guide gives only a rate), cards that raise it but are not in the guide's table, and the two zee cards' headings (Zailing's; only their option is here).

### WP-7 — Real carousels, one feature each, in this order — UNDER WAY
Done: **Hellworm** (`hellworm`; badges only, no panel: one card with six options, the 33-row milking table not carried) and **Risen Burgundy** (`risen-burgundy`; no panel: 25 cards, about 75 options: the hunt, a Saint's Day, the Weaver, the Poet-Thief, Heralds, the two payout cards, the Casing and Fascinating spends left for it, the weekly cards; the shared helper gained a per-entry quality `q` and placeholder card names). and **Station Developments** (`station-developments`; no panel: about 95 options in 30 storylets, the eight Offices branches and the conversions they unlock; `Curio ×5 → Scrip ×25`, `Scrip 50×(n+1) → Library 1`; 22 conversions whose pages name no storylet left out; the Location-specific cards guide judged a matrix with no option to badge). and the **City of the Tracklayers** (`city-of-the-tracklayers`; no panel: 62 cards, 207 options, the Prosperity each pays and what it does to the Waning and Displeasure; the four Fate-locked vignettes are not there, the wiki has no titles for them; twelve new placeholders). WP-7 is finished. The user said no panel for now; ask the panel question again for WP-8.

Hellworm (smallest, self-contained) → Risen Burgundy (Guide) carousels (also the Firmament-450 cards left out of WP-2, WP-3, WP-4: Cutthroats and Canalmen's other two options, Tolling of the Thief-Bells, Case a lesser keep, Seduce an Alluring Masquer, The Honours of the Court) → Station Developments + Location-specific cards (Hinterlands deck) → The City of the Tracklayers vignettes and decisions. **Ask the panel question for each.**

### WP-8 — Statues and the economy panel (decided: one panel)
Badges on *Commissioning a Statue* (rating 1–4, requirement, Favour type) and *Under the Statue at X* (regular / favour / special, about 6 EPA baseline, `(Subject)` placeholder, "statue not read" case). Panel "Upper River & Firmament economy": Roof Economy shops, trading posts and equipment, Stuiver-exclusive items and grinds, the statue table, steel per station (from Railway (Guide)), Scrip conversions. Register through `PANELS` → `registerPanels`; styles from `UI`/`TH`/`TD`, `wikiLink`; copy the Zailing panel's search filter; read holdings through the existing Possessions reader; update `ux-launcher-docking` (it pins the panel ids).

### WP-9 — Menace Locations
Five locations (Wounds boat, Scandal Tomb-Colonies, Suspicion New Newgate, Nightmares ×2), each a red deck plus storylets. Badge = menace change signed and directed (down good, teal; up bad, warm), side effects ("Approaching the Gates +5"), stat requirement 15. Confirm-only greeting gate; capture the real greetings first. Split in two if the card data exceeds about 250 rows.

### WP-10 — Navigation and story (spoilers included)
Iron Republic map (destination day per option, Committed/Hedonist gates); The Hurlers (Guide) + Discordant Studies Costs and Rewards + Deeper Discordant Studies (step badge, tooltip Hint 1 / Hint 2 / Answer); Firmament (Guide), chapter by chapter, consequence badges ("+Flammier", "+The Shepherd's Rejections", endings), warn where the guide says a branch is unverified. Its sub-guides stay separate TODO items.

### WP-11 — Nothing to build; record it
Dramatic Tension, Seeking (apart from WP-5's card), Bessemer sources, Hinterland Scrip-Making, Railway (Guide), Railway Beginning: already annotated in the TODO. Their only new tables (steel per station, faction support cost) go into the WP-8 panel.

### Later, not in the original plan
- **Weddings (Guide)** and **Spouses (Guide)** (from WP-0): analyse first.
- **Seeking the Meaning of the Plaster Face (Guide)**: the Big Rat storyline; skip the Running Battle options already done.
- **The rest of Risen Burgundy's deck** (about 40 of its 67 cards: the dreams, the Ducal-court and Firmament-story cards, the counter-raising cards for Beneficence and Against Time and Kings, the Joyous Entry, As Above and Glory's Fire cards, the eighteen steeds on Whoso List to Hunt, the Weaver's investments). The guide only points at them; the wiki category `Cards - Risen Burgundy` lists them.
- Airs of London storylets still open in the TODO: *Time in bed*, *Unfinished Business ×4*, and reading the current Airs off the unlock tooltip (needs a DOM capture).

## Open questions only the game can answer

Greetings of the menace locations and Hinterland stations; whether progress qualities can be read from the Myself tab; what `(Subject)` reads as in the statue cards; the storylet headings each package lists in its `AGENTS.md` "Not verified in-game" entry (Duelling's two names, the area-diving and Thefts headings, the seductions' and commissions' headings, the court ladder's headings, the Ambassador's Ball's options).
