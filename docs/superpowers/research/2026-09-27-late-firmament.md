# Late Firmament guides — research (2026-09-27)

Scope: the three "Late Firmament" TODO.md entries — Upon a Red Stage (Guide), To Make a
Moth (Guide), Scaling the Quartz (Guide). Data fetched via the wiki API
(`action=parse&prop=wikitext&formatversion=2`), never WebFetch. Guide pages were the primary
source for all three; option/storylet pages were spot-checked (below) and matched the guide
numbers exactly in every case checked, so the guide tables are trusted as transcribed.
No panel is being built for any of the three (confirmed by the user) — badges only, on
opportunity cards / storylet / branch headings.

Spot-checks performed (option page vs. guide table — all matched exactly):
- "Usurp the role of King" (Upon a Red Stage): Dangerous 320 + Red Rapture×5, 675/220
  Scarlet Applause, +3 Wounds success / +4 Nightmares failure. Matches guide row exactly.
- "Haul yourself over a steep overhang" (Scaling the Quartz): Dangerous 235 + 25×Flexibility,
  575/400 Crystalline Fecundity, +2 Wounds on failure only. Matches guide row exactly.
- "To Make a Moth" storylet page itself (not just the guide) fetched directly — confirms the
  branch names and the Autolepidopterist-level gating exactly as the guide lists them.

---

## 1. Upon a Red Stage (Guide)

Source: https://fallenlondon.wiki/wiki/Upon_a_Red_Stage_(Guide)
Area: **Queeneater's Castle** (storylet "On a Red, Red Stage"). Late-game, locked, a 15-action
fixed-length storylet (2 free setup choices + 3 acts × 5 scenes each, no exit until done).

### What this is (classification)

Not an opportunity card — an **opened storylet with many branches per scene**, badged like
Port Carnelian: rank each visible option in the current scene by expected Scarlet Applause
(and flag its side effects). There is no single "the storylet" badge; the badge lives on each
`.branch__title` for whichever options the current Crimson Airs/Starring Role/Consuming Genre
state has unlocked.

### Setup (0-cost, not badge-worthy beyond a tooltip note)

1. Choose Comedy or Tragedy (`Consuming Genre`). Comedy pays `Memory of a Much Stranger Self`;
   Tragedy pays `Cave-Aged Code of Honour`. Both pay `Blood Oath` + `Bone Fragments` at the
   same rate regardless of genre.
2. Choose a role (`Starring Role`): Queen (more Dangerous checks), Knave (more Persuasive),
   King (mixed, plus combined Dangerous+Persuasive checks and access to two extra options).

### Main table — Acts I/II, scenes 1-4 (one option per gate, from the guide's "Choices during
The Play" table; `Crimson Airs` is the gating range, 0-100)

| Option | Challenge | Act | Role | Crimson Airs | Genre | Success SA | Fail SA |
|---|---|---|---|---|---|---|---|
| Exposit | Persuasive 180 | 1 | any | 1-50 | any | 400 | 350 |
| Improvise an inciting incident | Dangerous 180 | 1 | any | 51-100 | any | 400 | 350 |
| Soliloquise | Persuasive 250 | any | any | 1-50 | any | 530 | 250 |
| Embody the role of the (Role) | Dangerous 250 | any | any | 51-100 | any | 530 | 250 |
| Showboat in dialogue with the Ravenous Thespian (Fate) | Dangerous+Persuasive 250 | any | any | 1-20 | any | 550 | 0 |
| Confer with a ghost | Persuasive 285 | any | any | 38-62 | Tragedy | 580 | 200 |
| Rule | Dangerous+Persuasive 235 | 1-2 | King | 26-75 | any | 500 | 270 |
| Plot | Dangerous 215 | 1-2 | Queen | 26-75 | any | 500 | 270 |
| Yearn | Persuasive 215 | 1-2 | Knave | 26-75 | any | 500 | 270 |
| Condemn a shocking murder | Persuasive+Dangerous 270 | any | King | 33-67 | Tragedy | 550 | 200 |
| Perform a shocking murder | Dangerous 250 | any | Queen | 33-67 | Tragedy | 550 | 200 |
| Mourn a shocking murder | Persuasive 250 | any | Knave | 33-67 | Tragedy | 550 | 200 |
| Threaten a promising union | Dangerous+Persuasive 270 | any | King | 33-67 | Comedy | 550 | 200 |
| Seethe over a promising union | Dangerous 215 | any | Queen | 33-67 | Comedy | 550 | 200 |
| Pursue a promising union | Persuasive 250 | any | Knave | 33-67 | Comedy | 550 | 200 |
| Disguise yourself utterly | Persuasive 285 | any | any | 38-62 | Comedy | 580 | 190 |
| Follow the directions of the Chorus | Persuasive 285 | any | any | 38-62 | Firmament-history* | 580 | 190 |
| Feign madness | Dangerous 285 | 2-3 | any | 1-12, 89-100 | Tragedy | 580 | 200 |
| Kill a supporting character | Dangerous 250 | any | any | 1-12 | any | 570 | 350 |
| Seduce a supporting character | Persuasive 250 | any | any | 89-100 | any | 570 | 350 |
| Uncover a case of mistaken identity | Dangerous 285 | 2-3 | any | 1-12, 89-100 | Comedy | 580 | 190 |
| Challenge a rival's legitimacy | Dangerous 285 | any | any | 1-12, 89-100 | Firmament-history* | 580 | 190 |
| Deliver a poetic monologue | Persuasive 215 | 2 | any | 1-50 | any | 500 | 270 |
| Raise the stakes | Dangerous 215 | 2 | any | 51-100 | any | 500 | 270 |
| Engineer a moment of anagnorisis | Persuasive 285 | 3 | any | 1-50 | any | 580 | 200 |
| Exploit the (Character)'s hamartia | Dangerous 285 | 3 | any | 51-100 | any | 580 | 200 |
| Leave the stage for a scene | Persuasive 215 | any | any | 1-50 | any | 500 | 270 |
| Intrude on a scene you're not meant to be in | Dangerous 215 | any | any | 51-100 | any | 500 | 270 |

\* "Firmament-history" = gated on a `Firmament` history flag the guide doesn't quantify further
— treat as an availability gate, not a rankable input.

All failures also give `Nightmares` (amount not itemized per-row in the guide; only the
Finale table gives explicit menace deltas — see below). **Trap**: several option *names* are
generic English phrases ("Rule", "Plot", "Yearn") that could collide with other storylets'
branch titles — these must be `strict`-gated to this storylet (confirmed host: the
`.branch__title` is only walked while the opened-storylet heading matches "On a Red, Red
Stage" / "Catastrophe: An Ending" — use the storylet heading text as the real gate, not a
greeting guess, since this is an *opened* storylet, not an area).

### Scene 5, Act I — "The Audience Hungers" (`Parabasis: A Look at the Audience`)

No check. Auto-picks Red Rapture (Crimson Airs ≤33, King-flavoured), Red Thirst (34-66, Queen),
or Red Hunger (≥67, Knave) — independent of the player's actual Starring Role, and sticky
(never decreases, never switches once set). Pays ~550 Scarlet Applause on average (variable).
Not a player choice among options — nothing to badge here beyond a tooltip note that this
scene sets the Finale's required role-quality.

### Scene 5, Act II — "The Hazard" (card draw, hand size 3, not affected by Knight of the
Order of the Golden Carapace, draws don't count against the normal replenishing hand)

| Card | Check used | Restriction |
|---|---|---|
| Intermission: A Flash of Bone | Shapeling Arts | none |
| Intermission: A Smile from the Mirror | Glasswork | none |
| Intermission: A Twist in the Gut | Kataleptic Toxicology | none |
| Intermission: Death from the Machine | Artisan of the Red Science | none |
| Intermission: A Chorus in Opposition | A Player of Chess | none |
| Intermission: A Stain on the Boards | Watchful | Consuming Genre must be Comedy |
| Intermission: A Steel Compulsion | Shadowy | Consuming Genre must be Tragedy |
| Intermission: Presentiments of Usurpation | Respectable | Starring Role must be King |
| Intermission: Red Suspicion | Dreaded | Starring Role must be Queen |
| Intermission: Covetous Heirs | Bizarre | Starring Role must be Knave |

All ten pay 650 Scarlet Applause on success, 250 on failure (flat, not itemized per card) — so
the badge here is really "which of your **drawn hand of 3** has the best chance", i.e. rank the
dealt cards by the player's own stat in that check (a Myself-tab read), not a fixed ranking —
similar in spirit to `bestZeeLine` but keyed off six different named stats instead of one.

### Finale — "Catastrophe: An Ending" (one final check, gated on Starring Role)

| Option | Challenge | Role gate | Red quality used | Success SA (+menace) | Fail SA (+menace) |
|---|---|---|---|---|---|
| Usurp the role of King | Dangerous 320 + Red Rapture×5 | not King | Red Rapture | 675 (+3 Wounds) | 220 (+4 Nightmares) |
| Usurp the role of Queen | Dangerous 320 + Red Thirst×5 | not Queen | Red Thirst | 675 (+3 Wounds) | 220 (+4 Nightmares) |
| Usurp the role of Knave | Dangerous 320 + Red Hunger×5 | not Knave | Red Hunger | 675 (+3 Wounds) | 220 (+4 Nightmares) |
| Resist the temptation of bloodshed (King) | Persuasive 200 − Red Rapture×5 | King | Red Rapture | 450 (+1 Nightmares) | 250 (+2 Wounds) |
| Resist the temptation of bloodshed (Queen) | Persuasive 200 − Red Thirst×5 | Queen | Red Thirst | 450 (+1 Nightmares) | 250 (+2 Wounds) |
| Resist the temptation of bloodshed (Knave) | Persuasive 200 − Red Hunger×5 | Knave | Red Hunger | 450 (+1 Nightmares) | 250 (+2 Wounds) |
| Deliver a final epilogue (King) | Persuasive 320 + Red Rapture×5 | King | Red Rapture | 675 (+3 Nightmares) | 220 (+4 Wounds) |
| Deliver a final epilogue (Queen) | Persuasive 320 + Red Thirst×5 | Queen | Red Thirst | 675 (+3 Nightmares) | 220 (+4 Wounds) |
| Deliver a final epilogue (Knave) | Persuasive 320 + Red Hunger×5 | Knave | Red Hunger | 675 (+3 Nightmares) | 220 (+4 Wounds) |
| Abandon your part (King) | Dangerous 200 − Red Rapture×5 | King | Red Rapture | 450 (+1 Wounds) | 250 (+2 Wounds) |
| Abandon your part (Queen) | Dangerous 200 − Red Thirst×5 | Queen | Red Thirst | 450 (+1 Wounds) | 250 (+2 Wounds) |
| Abandon your part (Knave) | Dangerous 200 − Red Hunger×5 | Knave | Red Hunger | 450 (+1 Wounds) | 250 (+2 Wounds) |

Verified against the option page for "Usurp the role of King" — exact match, including that
success gives +3 Wounds (not Nightmares) despite the failure branch giving Nightmares (the
Dangerous-check rows give Wounds on success and Nightmares on failure; the guide table's
"Success/Failure" column order in the wikitext is `675 (+3 Wounds CP) / 220 (+4 Nightmares CP)`
— read carefully, this is **not** symmetric and a careless transcription would flip it).

### Reward breakdown (applies to the whole 15-action run, not a per-option badge)

- Always 3× `Memory of a Much Stranger Self` (Comedy) or 3× `Cave-Aged Code of Honour`
  (Tragedy), independent of Scarlet Applause.
- `Blood Oath`: 1 per 50 Scarlet Applause, but the first 3700 SA (2450 if total SA ends up
  under 3700) is deducted and pays nothing.
- `Bone Fragments`: 1 per SA point left over after the Blood Oath conversion.
- Theoretical max SA ≈ 8835 → 102 Blood Oath + 35 Bone Fragments; theoretical min ≈ 3142.

### Traps found

- Generic option names ("Rule", "Plot", "Yearn", "Exposit") — must be gated to the opened
  "On a Red, Red Stage" / "Catastrophe: An Ending" storylet heading, never to an area guess.
- The Finale table's success/failure menace columns are **not mirrored** between the
  Usurp/Epilogue rows (Wounds↔Nightmares swap) — a table field must carry the exact CP+type,
  not a shared "menace" bucket.
- The Hazard's 10 intermission cards all pay the *same* flat 650/250 SA — the differentiator
  is entirely which stat the drawn card uses, which is a Myself-tab read the badge needs at
  render time, not a static ranking.
- No known Airs-of-London retitles or item/quality-gated hidden options found on this guide.
- No Luck-challenge (odds-only) options found — all are stat challenges, so badge success
  value only, `?` marks are not needed here beyond the usual convention.

### Gating recommendation

**Confirm-only**, and via the *opened storylet heading* text ("On a Red, Red Stage" /
"Catastrophe: An Ending"), not `currentArea()` — this whole feature only ever runs inside an
opened storylet, so the natural, low-risk gate is matching `.storylet-root__heading` /
`.branch__title`'s ancestor storylet name, exactly like Port Carnelian's branch badges. No
in-game greeting capture needed for this one.

### Badge-meaning recommendation

Badge = expected Scarlet Applause of the option (success×p + failure×(1−p) using the
player's own broad/narrow chance, same machinery as `bestZeeLine`/Port Carnelian), with the
Finale rows additionally marking which menace they spend and how much (`▲Wounds+3` /
`▲Nightmares+4`) since two Finale rows can tie on SA and only the menace choice separates them
(mirrors the reasoning `pcColor`/`pcPaint` already established for Port Carnelian: color the
axis that actually varies). Setup/Parabasis/Intermission-hand rows get a tooltip-only note
(their number is either fixed or dealt at random, not a rankable choice with more than the
"which stat is best" question already covered by existing badge stat-recommendation UI).

---

## 2. To Make a Moth (Guide)

Source: https://fallenlondon.wiki/wiki/To_Make_a_Moth_(Guide); storylet page
https://fallenlondon.wiki/wiki/To_Make_a_Moth confirms the branch names.
Area: **Risen Burgundy**, but the storylet ("To Make a Moth") is a single fixed storylet, not
tied to any card in the Risen Burgundy deck.

### CRITICAL — overlap with the existing `risen-burgundy` feature

`FallenLondon/choice-helper.js` already has a `risen-burgundy` feature (registered at line
~36972, table starting ~line 11302) that badges the opportunity-deck cards: the hunt, a
Saint's Day, the Weaver, the Poet-Thief, and (checked directly) **already includes these exact
storylets/branches** that "To Make a Moth (Guide)" also documents as menace-farming sources:

- `A Gloomy Summer` → "Convince her of the harmlessness of the cause", "Go about your work in
  secret", "Fund her own activities"
- `A Duchess' Disapproval` → "Argue in favour of change", "Go about your work in secret",
  "Enlighten the Duchess as to revolutionary codes"
- `A Disturbance at the Market` → "Give the Propagandist a chance to escape", "Help apprehend
  the criminal"
- `A Night in Ghent` → "Carouse"
- `A Stranger Out of Time` → "Soldier on", "Acquire the help of a Master of Etiquette",
  "Recontextualise your behaviour", "Abandon your distinctive hat"
- `Echoes of Storms Past` → "Report the patterns of thunder to the anarchists", "Shelter from
  the damp", "Shout into the storm", "Watch the winds"
- `The Honours of the Court` → "Make yourself the centre of attention", "Rescue an Unwary
  Reichsgraf", "Walk the court's eponymous broken walls"
- `Glories and Half-Lives` → "Buy a round for a Memorious Guildsman", "Observe the flight
  patterns of Tapestry-Moths", "Watch the boats of Slaughterhall"
- `Heralds from Elsewhere` → "Sight a Circumspect Smuggler"

Per the skill's rule ("Do not put the same name in two tables" — a test asserts no name
appears in more than one feature's table), **none of these may be re-added** under a new
`to-make-a-moth` feature. This guide's menace/Fuel-for-Glory's-Fire pre-requisite grind is
**already covered**.

### What is actually new: the "To Make a Moth" storylet itself

The storylet page confirms these branches, none of which are in `risen-burgundy` or anywhere
else in the file (checked: no hits for any of these names):

| Autolepidopterist | Option(s) | Cost (Stuiver) | Challenge (Kataleptic Toxicology + Neathproofed) | Consumes | Success | Failure |
|---|---|---|---|---|---|---|
| 0-11 | Make dye from your aches and pains | 1250 | 5 (10 to 100%) | Wounds 10 CP | Silk Scrap ×3000 | Scandal? no — Wounds-side: no extra listed |
| 0-11 | Make dye from your fears and nightmares | 1250 | 5 (10 to 100%) | Nightmares 10 CP | Silk Scrap ×3000 | Wounds +2 CP |
| 0-11 | Make pigment from your social missteps | 1250 | 5 (10 to 100%) | Scandal 10 CP | Silk Scrap ×3000 | Scandal +2 CP |
| 0-11 | Make dye from your guilt and mischief | 1250 | 5 (10 to 100%) | Suspicion 10 CP | Silk Scrap ×3000 | Wounds +2 CP |
| 12-13 | Pulp your own good name | 1250 | 15 (20 to 100%) | Notability 1 (needs ≥5) | Silk Scrap ×3000 | Scandal +2 CP |
| 14 | Create a ducal dye | 5625 | 16 (21 to 100%) | Burgundian Beneficence 5 | Silk Scrap ×9000 | Scandal +2 CP |
| 14 | Extract a rebellious dye | 5625 | 16 (21 to 100%) | Against Time and Kings 5 | Silk Scrap ×9000 | Wounds +2 CP |
| 15 | Create a pigment of absence | 5625 | 19 (24 to 100%) | Irrigo (consumed) | Silk Scrap ×3000 | Wounds +2 CP |
| 16 | Affix the city's judgement in colour | 5625 | 21 (26 to 100%) | Judged by the Duchy (not consumed) | Silk Scrap ×3000 | Scandal +2 CP |
| 17 | Offer hues of all that you could have been, and are no longer | 3250 | 24 (29 to 100%) | Memory of a Much Lesser Self ×10, Memory of a Much Stranger Self ×10 | Silk Scrap ×9000 | Wounds +2 CP |
| 18 | Provide a concentrate of purest self-assurance | 5625 | none (no challenge) | Concentrate of Self ×1 | Silk Scrap ×9000 | — |
| 19 | Ask what he means | 0 | none | — | flavour only, advances to 20 | — |
| 20 | Offer a body that is you and is not | 31250 | none | Discordant Law: Someone Following You = 1, Discordant Studies (level) | A Metamorphosed Moth-Self; A Bringer of Death +1 CP | — |
| 20 | Offer a substitute body, and the promise of your transformation | 31250 | none | Soothe & Cooper Long-Box ×1, Wings of Change (consumed) | A Metamorphosed Moth-Self (no Bringer of Death) | — |

(The "Make dye from your aches and pains" failure-side menace wasn't spelled out separately in
the guide's compact per-tier note beyond "Wounds/Scandal trading gives Scandal +2, Nightmares/
Suspicion trading gives Wounds +2" — i.e. the four tier-1 options split into two failure-payout
pairs by *which* menace they consume, not four distinct failure values. Confirm the exact
per-option failure text against each option's own wiki page before shipping the table — this
is the one place in this guide where the guide only gives a summarized rule rather than a
per-row number, and the skill's rule is individual pages win.)

Total cost across all 21 steps: 21 actions, 74,550 Stuiver, 12× 10 CP of a menace (any mix of
Wounds/Nightmares/Scandal/Suspicion), 2× Notability, 5 levels each of two progress qualities
(consumed), Irrigo, Judged by the Duchy, 10× two Memory types, 1× Concentrate of Self, and one
of two end-game item sets. This is explicitly "not a profitable endeavour" (direct quote) —
its value is the Best-in-Slot Neathproofed equipment reward, not Stuiver.

### Traps found

- **The whole pre-requisite grind is already badged elsewhere** (see above) — the new feature
  must scope itself to the `To Make a Moth` storylet's own branches only.
- Every branch's difficulty and cost *rises* as Autolepidopterist rises — a badge here is not
  "best option" (most tiers have exactly one option, or the choice is which menace/progress
  quality to spend) but "what this step costs and what you get", closer to a Port
  Carnelian–style running total than a ranking.
  Tier 14 (ducal dye vs. rebellious dye) is the only tier with a real either/or choice, and it
  is purely "which progress quality do you have 5 of" — nothing to rank by expected value.
- Tier 20's two options are a real branch-value choice: one costs `A Bringer of Death +1 CP`,
  the other needs harder-to-get items (Soothe & Cooper Long-Box needs the Against Time and
  Kings carousel; Wings of Change needs a failed Counterlight check in The High Sancta) — this
  is exactly the kind of "one field must not collapse two different claims" case the skill
  warns about: the two rewards are NOT numerically comparable (one is a menace cost, one is an
  item-availability cost), so the tooltip must spell out both in words rather than reducing
  it to one number.
- Option/storylet names are already specific/unique English phrases (e.g. "Pulp your own good
  name") — no `strict` gating expected to be needed, but confirm none collide with any other
  currently-badged feature before shipping (the same-name-in-two-tables test will catch it).

### Gating recommendation

**Confirm-only** on the opened storylet heading "To Make a Moth" (same reasoning as Upon a
Red Stage — this is a single fixed storylet, not an area-wide feature, so gate on the
storylet heading text itself rather than `currentArea()`).

### Badge-meaning recommendation

Not an expected-value ranking (most tiers have one real option). Recommend a **running-total /
next-step** badge in the Port Carnelian style: each branch's badge shows its own action cost
(Stuiver + challenge % + what menace/item/quality it consumes) and, where a tier has two
options (14 and 20), the badge marks which currency each spends so they read as different
rather than "both fine" — reuse the shape+color-axis convention (e.g. a Wounds-cost badge
leans warm/red-brick, a Notability/quality-cost badge leans the neutral/gold "resource spent"
color already used elsewhere, both marked with a currency-name suffix, never color-only).

---

## 3. Scaling the Quartz (Guide)

Source: https://fallenlondon.wiki/wiki/Scaling_the_Quartz_(Guide)
Area: **Stonegift** (storylet "The Heights of the Gift" → "Preparing for a Climb"). Spot-check
of the option page "Haul yourself over a steep overhang" matched the guide table exactly.

### What this is (classification)

An opened-storylet activity gated by a rolling quality `Airs of the Antipelago` (0-100,
changes every action, like `bestZeeLine`'s Troubled Waters analogy but for a climbing
mini-game). Pays `Crystalline Fecundity` per action, spends `Grip Strength` per action, and at
the end converts accumulated Fecundity + Height into `Stonebark`. Formulas depend on three of
the player's own progress qualities (`Momentum`, `Flexibility`, `Static Charge`), all read from
the Myself tab (or tracked in-session, since they reset each climb) — this is the "formulas on
qualities" case from the skill's step 2, not a flat table.

### Full action table (from the guide, cross-checked against the option page for row 1)

Grip cost per action (non-rest actions) = **4 + Momentum + Flexibility + Static Charge** on
success, **7 + Momentum + Flexibility + Static Charge** on failure.
Height gained per action (non-rest actions) = **5 + 3×Momentum** on success, **3 + 2×Momentum**
on failure.

| Action | Airs of the Antipelago | Challenge | Success | Failure |
|---|---|---|---|---|
| Haul yourself over a steep overhang | 0-30 | Dangerous 235 + 25×Flexibility | Fecundity ×575 | Fecundity ×400, Wounds +2 CP |
| Scrabble up a sheer rockface | 31-60 | Watchful 235 + 25×Flexibility | Fecundity ×575 | Fecundity ×400, Wounds +2 CP |
| Test your weight against the foliage | 61-90 | Shadowy 235 + 25×Flexibility | Fecundity ×575 | Fecundity ×400, Wounds +2 CP |
| Accelerate | 11-46 | Dangerous 210 + 25×Flexibility + 15×Inerrant | Fecundity ×600, Momentum +1 | Fecundity ×420, Momentum +1, Wounds +2 CP |
| Stretch yourself beyond your limits | 0-90, 100 | Shadowy 210 + 25×Flexibility + 15×Insubstantial | Fecundity ×550, Flexibility +1 | Fecundity ×420, Flexibility +1, Wounds +2 CP |
| Follow the mist | 56-90 | Kataleptic Toxicology 9 + Flexibility + Neathproofed | Fecundity ×600, Static Charge +2, Tempestuous Tale +1, Wounds +2 CP | Fecundity ×420, Static Charge +2, Tempestuous Tale +1, Wounds +3 CP |
| A moment of stillness | 0-90, 100 | none | Fecundity ×350, resets Momentum/Flexibility/Static Charge | — |
| Grab hold of something | 91-93 | Dangerous 260 + 25×Flexibility − 20×Momentum | Fecundity ×600 | Fecundity ×400, Wounds +2 CP |
| Hold yourself still | 94-96 | Dangerous 260 − 10×Flexibility | Fecundity ×600 | Fecundity ×400, Wounds +2 CP |
| Hide yourself | 97-99 | Shadowy 260 − 10×Static Charge | Fecundity ×600 | Fecundity ×400, Wounds +2 CP |
| An opportunity to rest | 100 | none | Grip Strength +31-46, Wounds −5 CP | — |

Note: "Follow the mist" gains **Static Charge on both success and failure** (+2 either way),
and the Wounds difference between success/failure is +2 vs +3 (not the usual 0-vs-2 pattern) —
a table field must carry the exact per-outcome delta, not assume the usual "failure=success+2"
shape other cost tables use.

### Cash-out ("Anchor at your current height")

Three effects when the player cashes out before Grip Strength hits 0:
1. If Grip Strength ≤ (7 + Momentum + Flexibility + Static Charge): +1 `Tested Against the
   Quartz` (needed up to 20× to unlock/finish Stonegift side stories).
2. Each new max height reached raises `The Pinnacle of Your Ascents` (150 needed for side
   stories; can go higher).
3. `Stonebark` received = Crystalline Fecundity accumulated + 14 × Height Reached (total, not
   per-action).

Stonebark converts (at the separate storylet "Parietals and the Light", no cost) to
`Presbyterate Passphrase`s (Stonebark ÷ 250, rounded down) or 1 `Primaeval Hint` for 6250
Stonebark.

### Author's own EPA analysis (useful for the badge's "meaning" decision, not itself a table
to transcribe verbatim into code — the numbers depend on the player's actual Momentum/
Flexibility state at climb time)

- Each Stonebark ≈ 0.01 Echo. Base action value (no Momentum) ≈ 6.46 Echoes; +1 Momentum ≈
  6.88; +2 Momentum ≈ 7.30 (~+0.42 Echoes per Momentum point of remaining-action value).
  Static Charge is explicitly **not worth it** (10 Echo worth of height for a 2-Grip cost).
  Flexibility should only be raised to hit success thresholds, not for its own value.
- Best-known EPA line (36% chance to raise Momentum via "Accelerate", every check passed):
  ~7.47 EPA ignoring shopping costs, ~6.14 EPA net of buying 20× Starved Expression, ~5.90 EPA
  if also grinding the Stuiver via 100 StPA activities.

### Traps found

- Option titles ("Accelerate", "A moment of stillness") are short, ordinary English phrases —
  real collision risk with other storylets. `strict`-gate to the opened "The Heights of the
  Gift" storylet heading (same pattern as the other two guides here), not an area guess.
- No Luck-challenge (odds-only) options — all are stat challenges gated by the *quality*
  `Airs of the Antipelago`, which changes every action and is not itself shown as a number the
  player reads directly on the card (per the guide, "determined by the Airs... which changes
  with each action") — this may need `fotzDepth`-style four-tier honesty (exact range known
  vs. "cannot tell") unless a capture confirms the game surfaces the current Airs value
  somewhere on the storylet screen. **Flag for in-game confirmation before implementation.**
- Static Charge and Flexibility both modify the challenge difficulty in **either direction**
  depending on the action (some subtract, e.g. "Grab hold of something" is −20×Momentum) — a
  table field must carry the sign per action, not assume all modifiers are additive.
- "An opportunity to rest" and "A moment of stillness" are not real challenges (no check) and
  should be excluded from any expected-value ranking, kept only as tooltip/reference rows.

### Gating recommendation

**Confirm-only**, gated on the opened storylet heading ("The Heights of the Gift" / whichever
heading the actual climb screen shows — needs an in-game capture to name exactly, since the
guide names three different storylet titles: "The Heights of the Gift", "Parietals and the
Light", "Preparing for a Climb" — confirm which one hosts the action list itself).

### Badge-meaning recommendation

Badge = expected Crystalline Fecundity per Grip spent (success×p + failure×(1−p), divided by
the action's own Grip cost, which itself depends on the player's current Momentum/Flexibility/
Static Charge) — an EPA-per-Grip ranking, the same shape as `bestZeeLine`'s cost-first
ranking, since (per the guide's own analysis) the raw Fecundity payouts barely differ between
actions and the real lever is Grip efficiency and Momentum growth. Mark the two Momentum/
Flexibility-growth actions ("Accelerate", "Stretch yourself beyond your limits") with a
distinct shape (e.g. `▲`) since their value compounds over the rest of the climb and a flat
EPA-per-Grip number alone underrates them — this needs its own tooltip sentence saying so,
per the skill's step 8 ("the tooltip is the whole argument").

---

## Summary for the parent task

| Guide | Complexity | Scope note |
|---|---|---|
| Upon a Red Stage | High — 3 sub-tables (28 main options, 10 intermission cards, 12 finale options), role/genre/act gating | New feature, no overlap found |
| To Make a Moth | Medium, but **entangled** | 9 of its own storylet branches are new; ~20 branches across 9 other storylets are **already badged by `risen-burgundy`** and must NOT be duplicated |
| Scaling the Quartz | Medium-high — 11 actions, 3 player-quality-dependent formulas, needs an in-game capture to confirm which storylet heading to gate on | New feature, no overlap found |

**To Make a Moth overlaps with the existing `risen-burgundy` feature**: yes, substantially —
the guide's entire "how do you grind the prerequisite menaces" section documents cards/options
that `risen-burgundy` already badges by name (`A Gloomy Summer`, `A Duchess' Disapproval`,
`A Disturbance at the Market`, `A Night in Ghent`, `A Stranger Out of Time`,
`Echoes of Storms Past`, `The Honours of the Court`, `Glories and Half-Lives`,
`Heralds from Elsewhere`). A new `to-make-a-moth` feature must scope itself to only the
14-row "To Make a Moth" storylet table above, or it will collide with `risen-burgundy`'s table
and fail the same-name-in-two-tables test.
