# Candlefinder Canvassing: Servants, Dockers and the Fate-locked Flit variant

Plan, 2026-11-24. Implementation follows `.claude/skills/adding-fallen-london-features`.

## Decisions (user, 2026-11-24)

1. **No panel.** Badges only. Canvassing is short: you get Detecting... to 8 and you're done.
2. **One table, two features.** `candlefinder-clay-men` becomes `candlefinder-canvassing`, with
   Clay Men, Servants and Dockers in one table keyed by storylet. The Fate-locked Flit variant is
   its own feature, `candlefinder-flit`, because it is matched by picture and gated differently.
   A player who had switched `candlefinder-clay-men` off gets it back on once, under the new name.
3. **Flit gate: greeting plus at least 3 of the 6 pictures on screen together**, the same way
   the Whisker-Ways does it. **Changed to 2 at implementation (2026-11-24):** the user's Clay Men
   capture showed locked options are hidden, not greyed (2 of 7 drawn), so below Airs 70 without
   the orphan only the two ungated urchins appear and a 3-picture gate would never fire.

## In-game facts (user, 2026-11-24)

- The Flit greeting: "Welcome to / The Flit, / delicious friend!" -- `currentArea()` reads it as is.
- No Fate case owned: the Flit variant stays matched by picture.
- The game shows a challenge's chance, not its difficulty; difficulty = 60 × stat ÷ chance%.
  Patch up an injured Clay Man at Dangerous 217 read 86%, i.e. 150, as the page says.
- Option pictures are the `<img>` in `.branch__left` (`clayman3`, `whispered_secret`).

## Sources

Fetched through the API on 2026-11-24:

- the storylet pages *Candlefinder: Canvassing the Servants* (Shuttered Palace) and
  *Candlefinder: Canvassing the Dockers* (Wolfstack Docks);
- all 14 option pages;
- *The Candlefinder Society (Guide)*, "Unique Activities → Canvassing". This is the **only**
  source for the Flit variant, which the wiki's content policy leaves without pages;
- the three Fate join pages: *Join a case: the empty belfry / glasshouse war / chandler's mask
  (10 FATE)*.

Where the option pages and the guide disagree, the option pages win, as usual. They agree on
every number here except the failure menaces the guide writes as "n/a"; there, the page is taken.

## The data

Badge text is the same shape as Clay Men: `Detecting... +N`, then `?` on a challenge. The
case-closer reads `Case progress +10`, in the payout colour. Both closers here are `+10`, not set
to a value; Clay Men's `now=60` is that storylet's one step and stays as it is.

### Canvassing the Servants (Shuttered Palace; lead *The Shuttered Palace Downstairs*)

| Option | Needs | Challenge | Success | Failure |
|---|---|---|---|---|
| Watch the comings and goings | — | Watchful 70 (Insubstantial adds 10 per point) | +4 | Scandal +1 |
| Flirt with a footman | — | Persuasive 70 | +4 | Scandal +1 |
| Approach a senior maid | Detecting... 4 | Watchful 100 (Persuasive adds 1 per point) | +6 | — |
| Steal some correspondence | Airs 70+ | Shadowy 56 | +6 | Suspicion +1 |
| A chambermaid is not what she seems | An Identity Uncovered! (not used up), Airs 40–80 | — | +8 | — |
| Casually stroll downstairs | Newly-Cast Crown of the City of London | — | **+8?** (the wiki is unsure; the page has no ID) | — |
| Put the pieces together | Detecting... 8 | — | Case progress +10, lead and Detecting... removed | — |

### Canvassing the Dockers (Wolfstack Docks; lead *The Workers of the Docks*)

| Option | Needs | Challenge | Success | Failure |
|---|---|---|---|---|
| Pop in to the Blind Helmsman | An Explorer of the Unterzee: The Captain, base Zeefaring 5, **no** Detecting... | — | +8 (straight to the closer) | — |
| Probe in dark corners | — | Shadowy 200 (Inerrant adds 10 per point) | +4 | Wounds +1 |
| Observe arrivals and departures | — | Watchful 200 | +4 | Suspicion +1 |
| Lean on the foreman | Detecting... 4 | Dangerous 200 (Persuasive adds 1 per point) | +6 | — |
| Armwrestle a dockworker | Airs 70+ | Dangerous 200 | +6 | Wounds +1 |
| Recognise a familiar face | Strong-Backed Labour (not used up), Airs 40–80 | — | +8 | — |
| Put the pieces together | Detecting... 8 | — | Case progress +10, lead and Detecting... removed | — |

### Canvassing in The Flit (Fate-locked; Glasshouse War and Chandler's Mask only)

No titles are known. Each row is matched by its picture, as in Philosofruits (`phfImageKey`,
`phfBranches`), carrying `title: null` until someone reads the title off the game.

| Picture | Needs | Challenge | Success | Failure |
|---|---|---|---|---|
| `Valkyrie` | HOJOTOHO! 1,500 | — | **+6?** (the guide is unsure) | — |
| `Stutteringurchin` | — | Watchful (Having Recurring Dreams: What the Thunder Said adds 10 per point) | +4 | Nightmares +1 |
| `Urchinslingshot` | — | Persuasive | +4 | Wounds +1 |
| `Doubleurchin` | Detecting... 4 | Dangerous (Persuasive adds 1 per point) | +6 | — |
| `Admiraltymedal` | Airs 70+ | Dangerous | +6 | Scandal +1 |
| `Urchinblond` | Winsome Dispossessed Orphan (not used up), Airs 40–80 | — | +8 | — |

The guide lists no closer for the Flit and gives no difficulties. The tooltip says so; the badge
does not invent them.

## Traps found

1. **The difficulties probably scale with the case.** Each case sets a hidden *Candlefinder:
   Attribute Difficulty Scaler* (Glasshouse War 70, Empty Belfry 150, Chandler's Mask 200), and the
   guide flags "Canvassing difficulty may depend on case difficulty". The Dockers pages all say
   200 and the Servants pages 56–100, which looks like one case's numbers each. The tooltip
   therefore shows the page's difficulty **as recorded on the wiki, may differ by case**. The badge
   never carries a difficulty. This applies to the existing Clay Men rows too.
2. **"Put the pieces together" exists in both Servants and Dockers.** `carouselLookup` scopes by
   the open storylet, so one table can carry both. The suite pins that each storylet gets its own row.
3. **Wiki title ≠ game title**: *Put the pieces together (Candlefinder)*, *(Candlefinder: Canvassing
   the Servants)* and *Recognise a familiar face (Candlefinder)* are disambiguated page titles; the
   game shows the bare name. The table carries the bare name. Every `{{Variant table}}` on these
   pages (senior maid, correspondence, foreman, armwrestle) is in the **Success** block: it
   retitles the result text, not the option, so no aliases are needed.
4. **Two Dockers pages share an ID with another** (367588 on *Lean on the foreman* and *Observe
   arrivals and departures*; 269403 on *Pop in to the Blind Helmsman* and *Probe in dark corners*).
   That's a wiki copy error. Nothing here keys on IDs.
5. **Blind Helmsman** is locked once you have any Detecting..., so it only ever shows as the
   first action. The tooltip says so.
6. **Flit pictures are urchins, in urchin country.** The 3-of-6 gate is there because these
   pictures are likely reused in The Flit. An option the table doesn't carry does **not** veto
   (the Whisker-Ways rule, not Philosofruits'), because the Flit storylet almost certainly has a
   closer the guide doesn't list.
7. **The Flit greeting has never been captured.** `inFlit` is confirm-only on `'The Flit'`
   until someone reads the sidebar in-game.
8. **No name collisions** with other tables: checked by grep; the suite will pin it.

## Steps

1. **Data.** Rename `CANDLEFINDER_CLAY_MEN_*` to `CANDLEFINDER_CANVASSING_*`. Add the 14 Servants
   and Dockers rows, each with `storylet`, and a `difficultyNote` flag. Add `CANDLEFINDER_FLIT_CARDS`:
   six rows with `image`, `title: null`, `progress`, `ch`, `needs`, `fail`.
2. **Specs.** `candlefinderCanvassingSpec(e)` is the Clay Men spec plus the difficulty caveat and the
   `+10` closer. `candlefinderFlitSpec(e)` is the same shape plus "title not yet recorded: the game
   shows '…'" (quoted from the screen, as Philosofruits does).
3. **Wiring.** `carouselRatings` with `storylets: [Clay Men, Servants, Dockers]` and one storylet
   heading spec per storylet. Flit: `phfBranches()` + `phfImageKey`, own class/flag pair.
4. **Gate.** Canvassing: the open storylet's heading, as now. Flit: `inFlit()` confirm-only
   **and** ≥ 3 matched pictures (`CF_FLIT_MIN_MATCHES = 3`).
5. **Settings.** Replace `candlefinder-clay-men` in `FEATURE_GROUPS` (London) with
   `candlefinder-canvassing`, add `candlefinder-flit`, and give both a `FEATURE_LABELS` entry.
6. **Tests.** Rename the suite to `tests/choice-candlefinder-canvassing.test.mjs`: 20 rows, per-row
   badge text, both closers scoped to their storylet, the difficulty caveat on every challenge
   row, the gate in each storylet. New `tests/choice-candlefinder-flit.test.mjs`: 6 pictures, 2
   matched pictures badge nothing and 3 do, wrong greeting badges nothing, an unknown option in the
   open storylet does not veto, and no picture overlaps with Philosofruits / Whisker-Ways. Update the three
   roster suites (crowds-of-spite, fruits-of-the-zee, zailing) and `fl-ui-settings`.
7. **Docs and versions.** Header block, README row, AGENTS.md (feature section, test list,
   "Not verified in-game" entry), research note, `@version` on the script and the loader.
8. **Verify.** `node --check`, `check.mjs`, every suite, `bump-loaders.mjs --check`.

## What only the game can tell us

- **The Flit greeting**, read off the sidebar while in The Flit.
- **The Flit Canvassing storylet's heading and its six option titles**, if you own The Glasshouse
  War or The Chandler's Mask. With titles, those rows switch from picture to title matching.
- **The difficulty you actually see** on a Servants or Dockers challenge, and which case you're
  on. That settles whether the scaler applies.
- Whether *Casually stroll downstairs* really pays +8, and the Valkyrie option +6.
