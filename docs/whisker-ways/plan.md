# The Whisker-Ways: Choice Helper plan and mappings

Plan and fill-in list for a `whisker-ways` feature in `FallenLondon/choice-helper.js`. Nothing is
implemented yet. Work through the stages in order; each one ships on its own.

- **Source:** [The Whisker-Ways (Guide)](https://fallenlondon.wiki/wiki/The_Whisker-Ways_(Guide)),
  fetched through the API on 2026-11-03. Item values come from each item's own page.
- **Why pictures:** the content is Fate-locked (*A Dream of a Thousand Tails*, 25 Fate). The guide names
  options only by icon, and the wiki has no storylet or option pages for it. A keyword search of the
  wiki's comments found nothing useful on the activity either. This is the Philosofruits situation; see `docs/philosofruits/cards.md`.
- **Pictures:** the game's own icons (`images.fallenlondon.com/icons/<key>small.png`), kept in `img/`.
  All 28 exist under exactly the names the guide gives, but none has been seen on these options in game.
- Last updated 2026-11-03.

## Decisions

| # | Question | Answer | Status |
|---|---|---|---|
| 1 | Panel behind ⚙ UX? | **No panel.** Badges and tooltips only | Decided 2026-11-03 |
| 2 | Scope first? | Generate and Refine rows only (23 options) | Decided 2026-11-03 |
| 3 | What does a badge say? | The story change: `+17–21 MP?`. Echo values go in the tooltip. No ranking | Decided 2026-11-03 |
| 4 | What does an unread input show? | Unread is a dash, never 0. An unknown Virtue shows item tiers | Proposed |
| 5 | Greeting | Not known yet: the user has not been to the Whisker-Ways. `The Whisker-Ways` stays a guess | **Open** |

**Why no ranking.** Echo values barely separate the good lines: the best Generate and the free Refine
both come to about 5 Echoes an action. Which line is best depends on the player's stats and spare items.

## How the activity plays

1. Pick one of three Virtues: Cunning, Invention or Community. This costs 1 action.
2. Generate Mythic Potential (MP). Options close at 100+ MP. The story needs at least 50 MP to end.
3. Refine: spend MP or items for Moralising Developments, Heroic Rallies or Inscrutable Twists
   ("Balance" below). Options close at 20+ combined Balance. The story needs at least 11 to end.
4. Finish and collect the payout. The guide counts no action for this step (`Ending Actions=0`).

Going back from step 3 to step 2 is allowed whenever MP is below 100.

The hard ceilings follow from those caps, and they match the guide's tables: MP tops out at 126 (99 + 27),
and one Balance quality at 28 (19 + 9).

## Matching rules

Same rule as Philosofruits: **a filled-in title wins over the picture, and a titled row is no longer
matched by its picture.** Untitled rows quote the game's text in the tooltip, so naming a row means
copying that text into the table.

Three things differ from Philosofruits, and they are the design of this feature:

1. **Options sit on storylets, not on a known card.** Philosofruits has a card to check the options
   against. Here the guide gives no storylet name or picture, so there is no parent to match first.
2. **So the gate counts instead.** A picture match needs the greeting in `WW_AREAS` **and at least two
   options on screen found in the Generate and Refine tables.** The guide promises 3 to 5 Generate
   options and 9 Refine options, so a real step always clears that.
3. **Unlisted options do not veto.** Philosofruits requires every option on screen to be its own. Here the
   Finish and go-back options have unknown pictures, so that test would blank the real storylets.

**The pictures say nothing alone.** The wiki uses `clouds` and `map` on 500+ pages each, `parabola` on 402
and `crowd2` on 379. Only the gate makes them mean anything.

**Traps**

- **The Wisp-Ways is a different place.** Philosofruits is gated on it, and both are
  Fate content matched by picture. `crowd2` is in both tables. Pin in a test that neither feature fires in the other's area.
- **One-action rows stand alone.** Those storylets may show a single option, so the count cannot clear
  them. They stay out until their storylet titles are known (stage 4).
- **The greeting is a guess.** `WW_AREAS = ['The Whisker-Ways']` comes from the guide's title, not a capture.
  If it is wrong nothing is badged, which is the safe way to be wrong.
- **Shared helpers.** `phfImageKey`, `phfImgKeyOf` and `phfBranches` become general helpers when this
  lands. Rename them in one step and keep the Philosofruits suite passing.

## Mapping: Generate (14 options)

Reading the columns: the Airs range decides whether an option is offered, so its presence on screen already
carries the Airs. The feature never has to read that quality. The guide says rare success is about 10% on
General rows and about 50% on the others, flagged "more thorough confirmation required". A dash for
failure means the guide records nothing, not that nothing happens.

`Echoes` values MP at 0.2 Echoes per point (see Payout).

Tick a row once its title is read off the game, and write the title in.

### General (one is always offered)

| Title | Picture | Key | Challenge | Airs | Success | Rare | Fail | Echoes |
|---|---|---|---|---|---|---|---|---|
| [ ] | ![](img/bazaardoor_teethsmall.png) | `bazaardoor_teeth` | Dangerous 120 | 0–50 | +13 | +18 | +5 | 2.6 |
| [ ] | ![](img/generic_unterzee4small.png) | `generic_unterzee4` | Mithridacy 5 | 51–100 | +13 | +18 | +5 | 2.6 |

### Cunning

| Title | Picture | Key | Challenge | Airs | Success | Rare | Fail | Echoes |
|---|---|---|---|---|---|---|---|---|
| [ ] | ![](img/mirrormonstersmall.png) | `mirrormonster` | Monstrous Anatomy 6 | 0–50 | +17 | +21 | – | 3.4 |
| [ ] | ![](img/evade2small.png) | `evade2` | Shadowy 130 | 51–100 | +17 | +21 | – | 3.4 |
| [ ] | ![](img/nightmares_redsmall.png) | `nightmares_red` | Shadowy 160 | 0–12, 89–100 | +22 | +27 | +5 | 4.4 |
| [ ] | ![](img/foliageorangesmall.png) | `foliageorange` | Monstrous Anatomy 8 + Shadowy 150 | not recorded | +25 | none recorded | – | 5.0 |

### Invention

| Title | Picture | Key | Challenge | Airs | Success | Rare | Fail | Echoes |
|---|---|---|---|---|---|---|---|---|
| [ ] | ![](img/lawfurnacesmall.png) | `lawfurnace` | Artisan of the Red Science 6 | 0–50 | +17 | +21 | – | 3.4 |
| [ ] | ![](img/tattoo_eye_hallowmassmall.png) | `tattoo_eye_hallowmas` | Watchful 130 | 51–100 | +17 | +21 | – | 3.4 |
| [ ] | ![](img/mechanismsmall.png) | `mechanism` | Watchful 160 | 0–12, 89–100 | +22 | +27 | +5 | 4.4 |
| [ ] | ![](img/dawnmachinesmall.png) | `dawnmachine` | Artisan of the Red Science 8 + Watchful 150 | not recorded | +25 | none recorded | – | 5.0 |

### Community

| Title | Picture | Key | Challenge | Airs | Success | Rare | Fail | Echoes |
|---|---|---|---|---|---|---|---|---|
| [ ] | ![](img/chesspiece_apocyansmall.png) | `chesspiece_apocyan` | A Player of Chess 6 | 0–50 | +17 | +21 | – | 3.4 |
| [ ] | ![](img/ballotboxsmall.png) | `ballotbox` | Persuasive 130 | 51–100 | +17 | +21 | – | 3.4 |
| [ ] | ![](img/formerlytalkativebearersmall.png) | `formerlytalkativebearer` | Persuasive 160 | 0–12, 89–100 | +22 | +27 | +5 | 4.4 |
| [ ] | ![](img/crowd2small.png) | `crowd2` | A Player of Chess 8 + Persuasive 150 | not recorded | +25 | none recorded | – | 5.0 |

**Readings to confirm.** The guide puts a second challenge where the Airs range goes on the +25 rows. I read
that as two checks with no Airs condition: its strategies take the +25 five times running and ask for both
stats at the certain level. The guide also writes "Mithridacy 5 (50%)" on one row only; I read 5 as the
difficulty, and the 50% is unexplained.

## Mapping: Refine (9 options)

`Net` is Echoes gained minus the cost, taking the alternate success at the guide's rough 50% and the input at
its sale value. Memory of a Much Lesser Self has no sale value on the wiki, so its rows have no net. The
guide does not say whether a failure still consumes the input.

| Title | Picture | Key | Challenge | Costs | Gives | Success | Alt | Fail | Net |
|---|---|---|---|---|---|---|---|---|---|
| [ ] | ![](img/hoofprintsmall.png) | `hoofprint` | Mithridacy 9 | 10 MP | Moralising Development | +3 | +4 | +1 | +5.0 |
| [ ] | ![](img/snakehead2small.png) | `snakehead2` | Dangerous 130 | Extraordinary Implication ×2 | Moralising Development | +4 | +6 | – | +5.0 |
| [ ] | ![](img/beefacesmall.png) | `beeface` | Mithridacy 7 | Emetic Revelation ×1 | Moralising Development | +8 | +9 | +1 | +4.5 |
| [ ] | ![](img/fist2small.png) | `fist2` | Mithridacy 9 | 10 MP | Heroic Rally | +3 | +4 | +1 | +5.0 |
| [ ] | ![](img/deliriumsmall.png) | `delirium` | Dangerous 130 | Memory of a Much Lesser Self ×2 | Heroic Rally | +4 | +6 | – | none |
| [ ] | ![](img/currency1_goldsmall.png) | `currency1_gold` | Mithridacy 7 | Magnificent Diamond ×1 | Heroic Rally | +8 | +9 | +1 | +4.5 |
| [ ] | ![](img/cloudssmall.png) | `clouds` | Mithridacy 9 | 10 MP | Inscrutable Twist | +3 | +4 | +1 | +5.0 |
| [ ] | ![](img/crosssmall.png) | `cross` | Dangerous 130 | Mourning Candle ×2 | Inscrutable Twist | +4 | +6 | – | +5.0 |
| [ ] | ![](img/mapsmall.png) | `map` | Mithridacy 7 | Puzzling Map ×1 | Inscrutable Twist | +8 | +9 | +1 | +4.5 |

## Mapping: One-action options (5 options, stage 4)

| Title | Picture | Key | Challenge | Success | Alternate | Fail | Alt fail |
|---|---|---|---|---|---|---|---|
| [ ] | ![](img/chambersoftheheartsmall.png) | `chambersoftheheart` | Luck 50% | Mourning Candle ×1 | Vienna Opening ×1 | Memory of Light ×5 | Jade Fragment ×250 |
| [ ] | ![](img/ratofglorysmall.png) | `ratofglory` | none | Glass Gazette ×1 | | | |
| [ ] | ![](img/reliquarysmall.png) | `reliquary` | Mithridacy 5, Ratty Reliquary | Apostate's Psalm ×1 | | Apostate's Psalm ×1, Wounds +2–3 CP | |
| [ ] | ![](img/parabolasmall.png) | `parabola` | none | Extraordinary Implication ×1 | | | |
| [ ] | ![](img/mrcheesesmall.png) | `mrcheese` | A Dream of a Thousand Tails 100+ | Mourning Candle ×1 | An Identity Uncovered! ×1 (at 200) | | |

The guide says the Reliquary option has 10 Airs-based results; it does not list them.

## Mapping: Payout

The Finish step pays one Virtue row plus all three Balance rows. The counts are the same for all three
Virtues; only the item names change.

| Virtue | 12.5 Echo item | 2.5 Echo item |
|---|---|---|
| Cunning | Antique Mystery | Extraordinary Implication |
| Invention | Bejewelled Lens | Volume of Collated Research |
| Community | Storm-Threnody | Touching Love Story |

| Balance quality | 12.5 Echo item | 0.5 Echo item |
|---|---|---|
| Moralising Development | Blackmail Material | Scrap of Incendiary Gossip |
| Heroic Rally | Direful Reflection | Tale of Terror!! |
| Inscrutable Twist | Puzzle-Damask Scrap | Journal of Infamy |

**Carry the rule, not the tables.** The guide's tables are one formula. I checked it against every printed
value on 2026-11-03: 88 MP levels (50–137) and 28 Balance levels, no differences. The three Balance tables
in the wikitext are identical.

```js
// Virtue: MP is worth 0.2 Echoes; a Cryptic Clue is 0.02. Hundredths of an Echo, so no float error.
function wwVirtuePayout(mp) {
  const v = mp * 20;
  const top = Math.floor(v / 1250);
  const mid = Math.floor((v - top * 1250) / 250);
  return { top, mid, clues: 300 + (v - top * 1250 - mid * 250) / 2 };
}
// One Balance quality: each point is worth 2 Echoes.
function wwBalancePayout(n) {
  const top = Math.floor(n * 200 / 1250);
  return { top, low: (n * 200 - top * 1250) / 50 };
}
```

Consequences a tooltip can state:

- **Payout value is linear:** MP pays 0.2 Echoes a point and Balance pays 2, so no level wastes value.
  The 300 base clues add 6 Echoes every round.
- **A tier-4 item arrives at Balance 7, 13, 19 and 25**, per quality. The guide calls these the levels
  that matter. Splitting Balance across three qualities keeps the same value but fewer big items.
- **A Bejewelled Lens or Storm-Threnody arrives at 63 MP, a second at 125.**
- **The Rat Market changes the sum.** The guide values a Storm-Threnody at up to 16.5 Echoes in a week's
  first 52, which is why its strategies default to Community.

The tests should carry a few printed rows as the cross-check: MP 62, 63, 85, 126; Balance 7, 13, 25, 28.

## Stages

Each stage has its own test additions, `@version` bump (script and loader) and `AGENTS.md` update, as the
`adding-fallen-london-features` skill sets out.

### Stage 0: Read the game (no code)

Answer the in-game checklist below, whenever someone gets there. Stage 1 can ship on the guessed greeting: a wrong guess means no badges, and fixing it is one line in `WW_AREAS`.

### Stage 1: Generate and Refine badges

- **Data:** `WW_AREAS`, `WW_GENERATE`, `WW_REFINE`, each row `{ image, title: null, ... }`. Corrections go here only.
- **Specs:** `wwOptionSpec(row, seen)`, pure.
  - Generate: `+17–21 MP?`; `+25 MP?` where no rare is recorded.
  - Refine: `−10 MP · +3–4 Dev?`, `−Implication ×2 · +4–6 Dev?`.
  - Shape carries the meaning: `?` is a challenge. The words name the quality, so colour is never the only carrier.
  - No faction part: nothing here pays a Faction.
- **Tooltip:** challenge and its certain level (`broadCertainAt`, Narrow difficulty + 5, both matching the
  guide's strategy stats), success, rare with the rough odds, failure, Echo value, the two caps, untitled note.
- **Wiring:** a `whisker-ways` entry in `FEATURES`, filed under Parabola in `FEATURE_GROUPS`. Own class and flag.
  Hosts are `.branch__title`, `'after'`. `value` carries name, picture key and whether the gate passes.
- **Tests:** `tests/choice-whisker-ways.test.mjs`. Row counts (14 + 9); keys unique; every `img/` file used
  by a row; the gate in all greeting states; one match alone does not clear the gate; an unlisted option
  does not veto; a filled-in title wins; `crowd2` in the Wisp-Ways stays Philosofruits'. Add the
  feature to the roster suites.
- **Report back:** whether badges appear on both steps, and whether a locked option is greyed or hidden.

### Stage 2: Titles

Fill titles in as they are read off the game: tick the row above and set `title` in the table. No design
work. Generate options may be retitled by the Airs; if so, keep matching those by picture or use `aliases`.

### Stage 3: Live story state

- Read MP and the three Balance qualities from the Myself tab through `readQualities`, banked like the
  Philosofruits qualities. All four are in the wiki's `Stories` quality type, IDs 144662, 144708, 144707, 144664.
- Add to Generate and Refine tooltips: current values, then what the option leaves you at, and how far you
  are from 50 MP and 11 Balance.
- Add a badge on the Finish option once its picture or title is known: what it would pay now, or `needs N more`.
- The Virtue may have no readable quality. Then show tiers (`12.5E ×1 · 2.5E ×1 · Clues ×400`) with a
  "depends on your Virtue" line, which is true for every Virtue because the counts match.
- `value` must then carry those four numbers, or badges go stale.

### Stage 4: One-action options

Add once the storylet titles are known, because these options cannot pass the count gate. Luck row: quote the
expected value, not the good half. The Reliquary's 10 results go in only if somebody reports them.

### Later, if wanted

- The Virtue choice, once its option pictures are known: what each Virtue pays.
- A `+Strategy` hint on the option that fits a chosen strategy.
- The Lens-to-Making-Waves route from the guide.

## Strategies from the guide

Kept for the tooltips. I re-derived the first two Echo sums from the payout formula and they match.

| Strategy | Actions | Needs | Result | Guide's EPA |
|---|---|---|---|---|
| Free Moralising Community | 10 | Mithridacy 14, Chess 13, Persuasive 250 | 85 MP, 12–16 Dev | 5.10 (5.50 with Rat Market) |
| Memory Disposal | 6–7 | 4 or 6 Memories, Chess 13, Dangerous 217, Persuasive 250 | 75 MP, 12–16 Rally | ~5.17 (~5.77) |
| Making Waves | 7 with the Lodgings action | Royal Bethlehem reservation, Artisan 13, Mithridacy 14, a 12.5 Echo item | 65 MP, about 12 Balance, 1 Lens | 10 CP per action, 2.57 EPA |

## In-game checklist

Nothing here can be found on the wiki.

- [ ] **Greeting:** what does the sidebar say inside the Whisker-Ways? Open: the user has not been there yet. Until then no badge is confirmed to appear.
- [ ] **Storylet headings:** the Virtue pick, Generate, Refine and Finish. Are Generate and Refine one storylet?
- [ ] **Unmapped pictures:** the three Virtue options, the Finish option and any go-back option.
- [ ] **Virtue quality:** which quality, if any, records the Virtue on the Myself tab?
- [ ] **Airs:** the name of the local Airs quality. Not needed for badges.
- [ ] **Locked options:** greyed or hidden, at MP 100+ and at Balance 20+?
- [ ] **Refine failure:** does a failed Refine still consume its 10 MP or items?
- [ ] **+25 rows:** two checks or one, and is any Airs condition present?
- [ ] **Finish:** does it really cost no action?
- [ ] **Odds:** rare and alternate frequencies. The guide asks for reports too.
- [ ] **Second ending:** the quality level of the story's other main ending, for `mrcheese`. The guide lacks it.

## Guide discrepancies

Kept as cross-checks. The guide's tables win unless the game disagrees.

- **Puzzle-Damask Scrap:** the summary's Output Items omit it, but the Inscrutable Twists table pays it.
- **Memory of a Much Lesser Self** is listed twice in Boost Items.
- **Memory Disposal arithmetic:** the ~5.17 line prints 7.2 and 6.2 actions. Its result only comes out with
  7 and 6, the figures its sibling lines use. Those are the current ones; 7.2 predates the action-free Rat Market.
- **Emetic Revelation** reads `-/625` on its page because it sells for Cryptic Clues: 625 × 0.02 = 12.5 Echoes.
  This agrees with the guide. A currency-blind table reader would get it wrong, and Memory of Light's `-/25`
  the same way.

## Totals

- Options titled: 0 of 28 (Generate 0 of 14, Refine 0 of 9, One-action 0 of 5)
- Unmapped options: 3 Virtue, Finish, any go-back
