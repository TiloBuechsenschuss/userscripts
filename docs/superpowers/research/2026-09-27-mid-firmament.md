# Mid Firmament guides — research (2026-09-27)

Scope: the 3 "Mid Firmament" TODO.md entries (lines 22-24) — The High Sancta (Guide),
Moon-Miser Herding (Guide), The Sous Catacombs (Guide). Source: wiki API
(`action=parse&prop=wikitext`), guide pages only (no `/Tables`, `/Cards`, `/Calculators`
subpages exist for any of the three — checked, 404/missing). Individual option pages were
**not** separately fetched for this pass (all three guides carry their own complete,
self-authored tables with `{{IL|...}}` reward templates already broken into item + quantity
— there is no separate summary-vs-detail disagreement to cross-check here, unlike Port
Carnelian). If a badge implementation wants extra certainty on one specific card, fetch that
card's own page before writing its table row — this doc is guide-sourced throughout.

No panel for any of these three (user already decided: badges only for this whole batch of 10).

---

## 1. The High Sancta (Guide)

**Area:** The High Sancta, reached via Zenith, unlocked at Firmament 300. Entry storylet:
**Sneaking into the High Sancta**, which spends {{e}}30 (paid with Anticandle ×12, Memory of
Light ×60, or Khaganian Lightbulb ×300) and redirects to **The Violant Threshold**.

**Shape:** semi-fixed activity, a two-state cycle gated by the quality "Blindfolded, For Your
Own Good" (1 or 2), up to 12 cycles:

- **State 1** ("Blindfolded" = 1): opportunity-card draw, 3 cards from a pool keyed to
  "Towards a Violant Sky" (tracks 1–12, three 9-card tiers). Each card gives ≈{{e}}12.50 in
  items **and** raises "Impressions in Violant" by `850 + 100 × Towards a Violant Sky`. Playing
  clears the hand and sets Blindfolded to 2.
- **State 2** ("Blindfolded" = 2): 3 identical copies of card **Lost in the Black**, single
  option **Stumble onwards**. Odds of success = current Counterlight (a %, degrades toward
  the challenge floor as the run progresses — see table below). Success: Blindfolded back to
  1, Counterlight drops by 5 (or by 1 if Counterlight ≤ 65). Failure: forced to leave (ends
  the run), grants the burden **Wings of Change**.
- On success *or* failure of Stumble onwards, the player also loses 1 unit of whichever
  resource funded entry (Anticandle/Memory of Light/Khaganian Lightbulb).
- After 12 cycles (or early via **Leaving the High Sancta**, only when Blindfolded = 2), the
  player leaves. **Leaving in any way** sets "Violant Sights", locking the activity until
  Time, the Healer.

### Card pools (state 1) — from the guide's own tables

**Towards a Violant Sky 1–4** (each ≈{{e}}12.50 unless noted):

| Card | Reward | Note |
|---|---|---|
| Bleeding In | Unprovenanced Artefact ×1, Extraordinary Implication ×2, An Identity Uncovered! ×2 | |
| Borrowed Scripts | Caustic Apocryphon ×1 | |
| Drowsy Exile | Bazaar Permit ×1 | |
| First and Last | Blackmail Material ×1 | Requires Family and Law 300–350 |
| Laws Unwritten | Nevercold Brass Sliver ×1250 | |
| Lost Cheer | Blackmail Material ×1 | Requires Family and Law exactly 300 or 400 |
| Molten Forests | Emetic Revelation ×1 | |
| Pungent Sorrows | Puzzle-Damask Scrap ×1 | |
| Statuary | Touching Love Story ×5 | Requires A Finder of Heiresses |
| Stolen Marble | Memory of Distant Shores ×25 | |

**Towards a Violant Sky 5–8:**

| Card | Reward | Note |
|---|---|---|
| Chained | Unlawful Device ×1 | worth up to {{e}}16.5 at The Rat Market |
| Consortion | Scrap of Incendiary Gossip ×25 | |
| Coronation | Nodule of Trembling Amber ×1 | |
| Scarred Memories | Skyglass Knife ×1, Appalling Secret ×62 | |
| Undying Wish | An Identity Uncovered! ×1, Mystery of the Elder Continent ×20 | |
| Unsigned in Triplicate | Infernal Contract ×63 | stated reward {{e}}12.60 — pick this one first when drawn (guide's own note, matches the "Average" table assumption) |
| Velvet Dark | Hillmover ×1 | |
| Void's Breath | Relic of the Second City ×80, Bone Fragments ×50 | |
| Waning | Memory of Moonlight ×1 | |

**Towards a Violant Sky 9–12:**

| Card | Reward | Note |
|---|---|---|
| Black Ice | Magnificent Diamond ×1 | |
| Discarded Hearts | Ostentatious Diamond ×25 | |
| Drowned Wars | Tempestuous Tale ×12, Zee-Ztory ×13 | |
| Hands and Blades | Relic of the Fifth City ×5 | |
| Love and Tombstones | Silent Soul ×1 | |
| Months Passing | Mourning Candle ×5 | |
| Reliquaries | Cave-Aged Code of Honour ×1 | |
| Rescued Hungers | Sausage About Which No One Complains ×1 | |
| Sloughing | Justificande Coin ×5 | |

None of these guide rows carry an explicit echo total per card (the guide states cards are
"≈{{e}}12.50 each", with Unsigned in Triplicate the one named exception at {{e}}12.60) — a
real per-card echo number needs each card's own wiki page (or a Possessions-tab price lookup
at run time, same pattern as other card-value badges in this repo). **Do not invent per-card
echo totals from the item name alone; either fetch each of the 28 option pages before writing
the table, or badge with the flat ≈{{e}}12.50 plus the item breakdown in the tooltip and let
Unsigned in Triplicate carry its one verified number.**

### Progress payout (Impressions in Violant → Memory of a Much Stranger Self)

| Towards a Violant Sky | Memory of a Much Stranger Self |
|---|---|
| 1 | 0 |
| 2 | 1 |
| 3 | 2 |
| 4 | 3 |
| 5 | 4 |
| 6 | 5 |
| 7 | 7 |
| 8 | 8 |
| 9 | 9 |
| 10 | 11 |
| 11 | 12 |
| 12 | 14 |

### Counterlight risk table (odds of Stumble onwards, chance the run ends at that floor)

| Sky | {{e}} payout so far | Actions so far | Counterlight (success chance) | Chance run ends here |
|---|---|---|---|---|
| 1 | 10.0 | 4 | 100% | 0% |
| 2 | 32.5 | 6 | 100% | 0% |
| 3 | 55.0 | 8 | 95% | 5% |
| 4 | 77.5 | 10 | 90% | 9.4% |
| 5 | 100.03 | 12 | 85% | 12.8% |
| 6 | 122.57 | 14 | 80% | 14.5% |
| 7 | 157.6 | 16 | 75% | 14.5% |
| 8 | 180.13 | 18 | 70% | 13.1% |
| 9 | 202.63 | 20 | 65% | 10.7% |
| 10 | 237.63 | 22 | 64% | 7.1% |
| 11 | 260.13 | 24 | 62% | 4.8% |
| 12 | 295.13 / 357.63 (with Night-Whisper bonus at Firmament ≥780) | 26 | n/a (forced exit) | 7.9% |

Guide's own bottom line: expected profit **{{e}}166.57 in 16.5 actions (10.10 EPA)**, or
**{{e}}161.63 / 9.79 EPA** if Firmament < 780 — this is the number already in the `ActivitySummary`
infobox and is a fine one-line tooltip fact ("this activity nets ~10 EPA on average, but a
single run's outcome varies with luck").

### Traps

- **Wings of Change is cross-cutting, not local.** Failing Stumble onwards adds a burden that
  spawns a **"The Sound of Wings (…)"** card in eight *other* locations entirely
  (Nadir, The Fifth City, Laboratory, Upper River, Tracklayers' City, Unterzee, The Stacks,
  Burgundy) — each with its own single option, challenge and reward (full table transcribed
  below for reference). Badging these means touching potentially 8 *other* features' card
  pools (some of which — Cave of the Nadir — already exist in this codebase as separate
  implemented features). **Recommend scoping The High Sancta feature to the activity's own
  loop only** (the three card tiers + Stumble onwards) and leaving Sound-of-Wings cards out
  of this task; note it as a follow-up TODO rather than silently dropping it.

  | Card | Option | Challenge | Success | Failure |
  |---|---|---|---|---|
  | The Sound of Wings (Nadir) | Confront it | — | Irrigo ×2, Wings of Change ×-1, Memory of a Much Stranger Self ×1, Caustic Apocryphon ×1 | — |
  | The Sound of Wings (The Fifth City) | Run! | Dangerous 180 | Memory of a Much Lesser Self ×1, Tale of Terror!! ×4, Nightmares +4 | Nightmares +5 |
  | The Sound of Wings (Laboratory) | Work through it | Watchful 200 | Unlikely Connection ×5, Suspicion +3, Laboratory Research (8 + equipment) | Scandal +2, Suspicion +3 |
  | The Sound of Wings (Upper River) | Flee | Watchful 50×(7+Seeing Banditry−Train Defences) | Maniac's Prayer ×50, Scandal +2, Suspicion +2 | Wounds +2, Nightmares +2 |
  | The Sound of Wings (Tracklayers' City) | Make a run for it | Shadowy 120, Neathproofed 2 | Memory of a Much Lesser Self ×1, Rumour of the Upper River ×1, Map Scrap ×5, Nightmares +4 | Nightmares +2, Tracklayers' Displeasure +?, The City Waning +? |
  | The Sound of Wings (Unterzee) | Full power to the engines! | Zeefaring 7 | Royal-Blue Feather ×6, Aeolian Scream ×1, Wounds +4 | Wounds +3, Nightmares +2, Troubled Waters +6 |
  | The Sound of Wings (The Stacks) | Hide | Shadowy 250 + Insubstantial ×10 | Nightmares +2, Perusing the Stacks ×5 or Finding the Centre ×5 | Nightmares +2, Noises in the Library +6, Perusing the Stacks ×1 or Finding the Centre ×1 |
  | The Sound of Wings (Burgundy) | Run! | Dangerous 210 + Chthonosophy ×15 | Partial Map ×1, Tale of Terror!! ×2, Nightmares +4 | Nightmares +5 |

- **Counterlight Source choice (Anticandle / Memory of Light / Khaganian Lightbulb) is a
  currency choice, not a reward difference** — 12/60/300 to enter, 1/5/25 consumed per
  Stumble-onwards resolution, otherwise mechanically identical. Ranking these needs each
  currency's acquisition cost, which this repo doesn't currently price anywhere. Recommend
  leaving this choice unbadged (or badge only with the raw stock cost, no verdict) rather
  than inventing an exchange rate.
- The **per-card echo values in the 1–4/5–8/9–12 tables are the guide's rounded estimate**,
  not fetched from each option page. Treat `≈{{e}}12.5` as a placeholder average unless the
  option pages are pulled before writing the final spec — this is the one place in this guide
  where the "option pages win" rule from the skill has **not yet been applied**.

### Gating

No verified in-game greeting captured. `currentArea()` almost certainly returns something
containing "High Sancta" while inside — recommend **confirm-only** gating on that guess
(`inHighSancta`-style: string includes "high sancta", case-insensitive) until a real capture
exists. Do not treat an unrecognised area as "definitely not here".

### Badge meaning (recommendation)

- **Opportunity cards (state 1):** badge = the card's echo value (color ramp, quantity too)
  plus its item breakdown and any quality/item gate in the tooltip; Unsigned in Triplicate
  gets its own verified `{{e}}12.60` instead of the ≈12.5 default, matching `twFail`-style
  "the guide names one real exception" precedent already used elsewhere in this codebase.
- **Stumble onwards branch:** badge = current expected value framing — since Counterlight is a
  single forced option (no ranking to do), the honest badge here is informational, not a
  ranking: show the run's cumulative EV-so-far and the "chance the run ends here" figure from
  the risk table, so the player can decide whether to keep pushing or bail via Leaving the
  High Sancta. This is closer to the `fotzDepth` "range, not a verdict" pattern than a
  `bestZeeLine`-style ranking, because there is nothing to rank.

---

## 2. Moon-Miser Herding (Guide)

**Area:** Zenith, unlocked at Firmament 360 (end of Chapter 3). Entry storylet: **The Gate of
Misers**. Fixed-length activity (0 starting actions, 7 progress actions, 0 ending — "Raise
Stations of the Herd to 7").

**Shape:** hand-size-2 (later 3) card draw. Every card clears the hand and raises "Stations of
the Herd" by 1 regardless of which option is picked. At Stations of the Herd 7, the activity
auto-ends via **Come to your senses (Zenith's Gate)**, awarding Latent Recollections ×1.

Two of the nine High-Urgency stations (1, 2, 3, 4, 6) offer a **second option** on one of
their two cards: a real choice between a safe progress-only pick and a risky one that (a) adds
1 CP toward one of three "awakening" qualities (Acclimating to Prolonged Inversion / Awakening
to Miracle / Tasting Ichor) *or*, once all three are separately maxed once, unlocks a further
risky pick toward "Opening Another Eye" gated on **Chthonosophy 2** or **Kataleptic Toxicology
5** — and **failing that specific check removes the quality it would have granted**. This is
the actual badge-worthy branch choice in this guide.

### High-Urgency cards, by Stations of the Herd level (full table, guide-sourced)

| Station | Card | Option | Challenge | Success | Failure |
|---|---|---|---|---|---|
| 0 | Fleeing the Gate | We held fast | — | — | — |
| 0 | Stone Probing | The scraping of the stones | — | — | — |
| 1 | Crag Path | We moved in enclosing darkness | — | Acclimating to Prolonged Inversion +1 | — |
| 1 | Crag Path | I kept my eyes open | Chthonosophy 2 (needs Seeing a new Frame of Reference) | Opening Another Eye +1 | **removes Seeing a new Frame of Reference** |
| 1 | Respite Mesa | We made camp | — | — | — |
| 2 | Grazing Field | We stopped for a while | — | Acclimating to Prolonged Inversion +1 | — |
| 2 | Grazing Field | I tasted the nectar | Kataleptic Toxicology 5 (needs A Mouthful of Light) | Opening Another Eye +1 | **removes A Mouthful of Light** |
| 2 | Hiding Place | We made camp | — | Tasting Ichor +1 | — |
| 3 | Abandoned Home | We crossed the crags | — | Awakening to Miracle +1 | — |
| 3 | Bull List | We watched their clashes | — | Acclimating to Prolonged Inversion +1 | — |
| 4 | Moon Gazing | We moved towards a pale light | — | Awakening to Miracle +1 | — |
| 4 | Stalactite Root | We allowed the herd to drink | — | Tasting Ichor +1 | — |
| 5 | Sympathetic Glow | We accounted for their motions | — | Awakening to Miracle +1 | — |
| 5 | Feast of Ichor | We drove them off as best we can | — | — | — |
| 6 | Home-sighting | We spurred the herd forward | — | — | — |
| 6 | Home-sighting | I tried to remember where I came from | (needs Hearing Chimes at Midnight) | Opening Another Eye +1 | — |
| 6 | Home-Sick | We watched it flee | — | Tasting Ichor +1 | — |

**Unlock chain:** Acclimating to Prolonged Inversion → (at level 2, end of run) unlocks Seeing
a new Frame of Reference. Awakening to Miracle → Hearing Chimes at Midnight. Tasting Ichor → A
Mouthful of Light. Ending the activity **resets** all three awakening qualities, so a single
run must gather 2 CP of one of them from its two triggering cards to bank the unlock — the
guide's "Runs to unlock Seeing More than Two Paths" table (transcribed below) says which two
stations to hit together in one run for each of the three, plus the fourth combined run for
Opening Another Eye → Seeing More than Two Paths:

| Run | Target quality (2 CP needed) | Stations / cards to play |
|---|---|---|
| 1 | Seeing a new Frame of Reference | Station 1 Crag Path → *We moved in enclosing darkness*; Station 2 Grazing Field → *We stopped for a while* |
| 2 | Hearing Chimes at Midnight | Station 3 Abandoned Home → *We crossed the crags*; Station 4 Moon Gazing → *We moved towards a pale light* |
| 3 | A Mouthful of Light | Station 2 Hiding Place → *We made camp*; Station 4 Stalactite Root → *We allowed the herd to drink* |
| 4 (after 1–3 done) | Seeing More than Two Paths (via Opening Another Eye ×2) | Station 1 Crag Path → *I kept my eyes open*; Station 2 Grazing Field → *I tasted the nectar* |

Once Seeing More than Two Paths is held, hand size becomes 3 and three new "standard
frequency" cards appear regardless of station — Blood of the Stone / Fearful Symmetry / Peal
of Thunder — each of which **cashes out all banked Latent Recollections** at once.

### Gold cards (cash-out; only appear once the player holds ≥1 Latent Recollections)

| Card | Option | Reward (per Recollection) | EPA |
|---|---|---|---|
| Blood of the Stone | I tasted the stone | Sample of Roof-Drip ×100, Antique Mystery ×2, Stone-Hearted +1 CP | 5 |
| Fearful Symmetry (Zenith's Gate) | I made a map of what I saw | Roof-Chart ×4, Direful Reflection ×2, Salt-Veined +1 CP | 5.01 (Roof-Chart sells at The Midnight Market / other Roof markets) |
| Peal of Thunder | I took the time to hear the thunder | Tempestuous Tale ×20, Storm-Threnody ×2, Stormy-Eyed +1 CP (up to 6) | **5.67** (Storm-Threnody sells at the Rat Market) — guide's own recommendation: highest direct payout |

### Silver cards (no cash-out, mostly flavour)

| Card | Option | Result |
|---|---|---|
| Herd Sighting | I acknowledged their passing | — |
| Herd Sighting (via A False-Star of your Own) | I met the eyes of the Hybrid | — |
| Low Place | I gazed east | — |
| Miser-Whispers | I heard their songs | — |
| Alchemical Moon-Miser (One to Guide Them) | I sent out my old friend | — |
| Violant Moon-Miser (One to Lead Them) | I sent out my old friend | — |
| Moulting Hour | We helped them shed | Shard of Glim ×11-20 |

### Downstream cash-out (context only, not this guide's own storylet — note, don't badge here)

- Every 3 levels of Stone-Hearted (5 CP) cash out in Burgundy via **Cardinal Disagreements**
  for Memory of Moonlight ×1, Stolen Kiss ×1, Sample of Roof-Drip ×50 (~{{e}}2.5 + {{s}}350,
  ~{{e}}20 total) plus minor Wounds/Nightmares reduction.
- Every 3 levels of Salt-Veined (5 CP) cash out at Queeneater's Castle via **Bleed onto the
  roots** for Memory of a Much Stranger Self ×1, Roof-Chart ×3 (~{{e}}20.47/{{s}}400), at some
  Wounds cost.
- These belong to *other* guides' scope (Queeneater's Castle is "Upon a Red Stage", also in
  this 10-item batch — see below) — cross-reference rather than re-badge.

### Traps

- **"We made camp" is reused as an option name on two different cards** (Respite Mesa at
  station 1, and Hiding Place at station 2) — same text, different card, different (or absent)
  effect. Table field must key on card name, not option text alone, or a `strict`-style
  disambiguation is needed if badges are drawn from `.branch__title` without card context.
- **"I sent out my old friend"** is likewise the shared option text for two different Silver
  cards (Alchemical Moon-Miser vs Violant Moon-Miser) with different upstream card names —
  same trap.
- The risky branch's **failure removes a quality** rather than costing a resource — this must
  be spelled out in the tooltip in words (per skill step 4), not just as a normal "failure"
  reward line, or a player reads it as a a harmless miss.

### Gating

No verified greeting. The activity plays out across storylet names distinct enough
(Fleeing the Gate, Crag Path, Grazing Field, …) that **storylet-membership gating (heading
text match) is safer than area gating** here — Zenith is a large area with lots of unrelated
content, and "the greeting says Zenith" would not distinguish this activity from anything else
happening there. Recommend gating strictly on the card/storylet names in the table, no
`currentArea()` dependency at all.

### Badge meaning (recommendation)

- **High-Urgency risky branches:** badge = which awakening/Opening-Another-Eye quality it
  grants, the challenge stat and threshold, and — in bold in the tooltip — that failure
  *removes* a currently-held quality rather than just missing the gain. Colour: a shape mark
  (e.g. `?`) for "risky, gated", not a ramp (there's no scalar quantity to rank here, only a
  binary risk/no-risk distinction — use shape + word, not colour, as the primary channel).
- **Gold cards:** badge = EPA (color ramp; the guide's own numbers are already clean: 5 / 5.01
  / 5.67), tooltip states the per-item breakdown and that this cashes out *all* banked
  Recollections at once (so timing it against needing Stone-Hearted/Salt-Veined/Stormy-Eyed
  progress matters — mention that trade-off in the tooltip, not the badge text).

---

## 3. The Sous Catacombs (Guide)

**Area:** none named by the guide ("no area" in TODO.md) — part of Firmament Chapter VI, in
"The Sous". Unlocked by speaking to **The Resident Gravetender** after first reaching the Sous.
Storylets named in the guide's own `GuideFor`: **The Bones Above the Sous** (entry),
**A Labyrinth of Roof and Bone** (cosmetic walk), **(Catacombs Chamber)** (bone donation — a
templated/weekly-rotating name), **Return to the Upper Airs** (exit + relics).

**Shape:** fixed 10-action activity: 5× labyrinth walk (cosmetic only — per the guide, "has no
effect", options and results are purely flavour) interleaved with 5× bone donation. Raises
"Among the Dead" to 401 to force the exit.

### How bone donation pays (the real mechanic to badge)

Donating a bone gives **Osseous Offerings** equal to or greater than the bone's
"Approximate Value of Your Skeleton in Pennies", with a floor of **5{{e}} / 100 Stuiver per
bone** — except Panoptical Skulls and Ivory Femurs, which pay *less* than their skeleton
value (negative bonus, listed below). This is a 3-tier **modulo/overflow payout** (per
[[Overflow Payouts (Guide)]], not separately fetched here):

| Every … Osseous Offerings | Gives | Worth |
|---|---|---|
| 125,000 | Memory of a Much Stranger Self ×1 | 250 Stuiver / 12.88{{e}} in the Sous, or 1288× Bone Fragments |
| 1,000 | Tantalising Possibility ×1 | 2 Stuiver / 0.1{{e}} |
| 100 | Whispered Hint ×1 | 0.01{{e}} |

Available donation choices rotate weekly per bone category (Skulls / Arms / Ribcages / Legs /
Appendages), each drawn from a fixed pool of 5 per category; **Human Ribcage is always
available**, as is **forgoing the donation** (costs Nightmares +5, no offerings). Only the
currently-"accepted" bones for the active week are actually choosable — a static badge cannot
know which week it is, so the badge must be **keyed off the option actually rendered on the
card**, not a fixed subset of the table (the DOM already only shows what's currently offered).

### Full bone value table (guide-sourced; "Total Value" column is the guide's own combined
Stuiver/echo figure — use this directly as the badge number)

**Skulls:**

| Bone | Osseous Offerings | Skeleton-in-Pennies value | % Bonus | {{e}} Bonus | Total Value |
|---|---|---|---|---|---|
| Rubbery Skull | 60,000 | 600 | 0 | 0 | 120 Stuiver / 6{{e}} |
| Horned Skull | 175,000 | 1,250 | 43.04 | 5.88 | 350 Stuiver / 17.88{{e}} |
| Pentagrammic Skull | 125,000 | 1,250 | 3.04 | 0.88 | 250 Stuiver / 12.88{{e}} |
| Eyeless Skull | 300,000 | 3,000 | 2.53 | 0.76 | 550 Stuiver / 30.76{{e}} |
| Sabre-Toothed Skull | 675,000 | 6,250 | 11.84 | 7.4 | 1300 Stuiver / 69.90{{e}} |
| Panoptical Skull | 400,000 | 6,000 | **-33.10** | **-19.86** | 780 Stuiver / 40.14{{e}} |
| Doubled Skull | 625,000 | 6,250 | 3.04 | 1.90 | 1250 Stuiver / 64.40{{e}} |
| Skull in Coral | 175,000 | 1,750 | 2.17 | 0.88 | 350 Stuiver / 17.88{{e}} |
| Plated Skull | 300,000 | 2,500 | 23.04 | 5.76 | 550 Stuiver / 30.76{{e}} |

**Arms:**

| Bone | Osseous Offerings | Skeleton value | % Bonus | {{e}} Bonus | Total Value |
|---|---|---|---|---|---|
| Knotted Humerus | 75,000 | 300 | 140 | 4.2 | 150 Stuiver / 7.20{{e}} |
| Crustacean Pincer | 75,000 | 0 | ∞ | 7.5 | 150 Stuiver / 7.20{{e}} |
| Fossilised Forelimb | 300,000 | 2,750 | 11.85 | 3.26 | 550 Stuiver / 30.76{{e}} |
| Ivory Humerus | 175,000 | 1,500 | 19.2 | 2.88 | 350 Stuiver / 17.88{{e}} |
| Human Arm | 75,000 | 250 | 188 | 4.7 | 150 Stuiver / 7.20{{e}} |

**Ribcages:**

| Bone | Osseous Offerings | Skeleton value | % Bonus | {{e}} Bonus | Total Value |
|---|---|---|---|---|---|
| Human Ribcage (always available) | 175,000 | 1,250 | 43.04 | 5.38 | 350 Stuiver / 17.88{{e}} |
| Skeleton with Seven Necks | 675,000 | 6,250 | 11.84 | 7.4 | 1300 Stuiver / 69.90{{e}} |
| Glim-Encrusted Carapace | 675,000 | 6,000 | 16.5 | 9.9 | 1300 Stuiver / 69.90{{e}} |
| Segmented Ribcage | 75,000 | 250 | 188 | 4.7 | 150 Stuiver / 7.20{{e}} |
| Prismatic Frame | 3,175,000 | 31,250 | 4 | 12.5 | 6350 Stuiver / 325{{e}} |
| Mammoth Ribcage | 675,000 | 6,250 | 11.84 | 7.4 | 1300 Stuiver / 69.90{{e}} |
| Ribcage with a Bouquet of Eight Spines | 3,125,000 | 31,250 | 3.04 | 9.5 | 6250 Stuiver / 322{{e}} |
| Thorned Ribcage | 175,000 | 1,250 | 43.04 | 5.38 | 350 Stuiver / 17.88{{e}} |
| Five-Pointed Ribcage | 3,125,000 | 31,250 | 3.04 | 9.5 | 6250 Stuiver / 322{{e}} |
| Flourishing Ribcage | 175,000 | 1,250 | 43.04 | 5.38 | 350 Stuiver / 17.88{{e}} |
| Leviathan Frame | 3,175,000 | 31,250 | 4 | 12.5 | 6350 Stuiver / 325{{e}} |

**Legs:**

| Bone | Osseous Offerings | Skeleton value | % Bonus | {{e}} Bonus | Total Value |
|---|---|---|---|---|---|
| Holy Relic of the Thigh of Saint Fiacre | 175,000 | 1,250 | 43.04 | 5.38 | 350 Stuiver / 17.88{{e}} |
| Ivory Femur | 625,000 | 6,500 | **-0.93** | **-0.6** | 1250 Stuiver / 64.40{{e}} |
| Femur of a Surface Deer | 51,000 | 10 | 50 | 5 | 102 Stuiver / 5.1{{e}} |
| Helical Thighbone | 75,000 | 300 | 140 | 4.2 | 150 Stuiver / 7.20{{e}} |
| Femur of a Jurassic Beast | 75,000 | 300 | 140 | 4.2 | 150 Stuiver / 7.20{{e}} |

**Appendages:**

| Bone | Osseous Offerings | Skeleton value | % Bonus | {{e}} Bonus | Total Value |
|---|---|---|---|---|---|
| Tomb-Lion's Tail | 75,000 | 250 | 188 | 5 | 150 Stuiver / 7.20{{e}} |
| Plaster Tail Bones | 75,000 | 250 | 188 | 5 | 150 Stuiver / 7.20{{e}} |
| Albatross Wing | 175,000 | 1,250 | 40 | 5.38 | 350 Stuiver / 17.88{{e}} |
| Fin Bones, Collected | 55,000 | 50 | 100 | 5 | 110 Stuiver / 5.5{{e}} |
| Amber-Crusted Fin | 175,000 | 1,500 | 19.2 | 2.88 | 350 Stuiver / 17.88{{e}} |
| Withered Tentacle | 55,000 | 250 | 120 | 3 | 110 Stuiver / 5.5{{e}} |
| Jet Black Stinger | 55,000 | 50 | 100 | 5 | 110 Stuiver / 5.5{{e}} |
| Obsidian Chitin Tail | 75,000 | 500 | 44 | 2.5 | 150 Stuiver / 7.20{{e}} |
| Bat Wing | 50,100 | 1 | 500 | 5 | 100 Stuiver / 5.01{{e}} |
| Wing of a Young Terror Bird | 75,000 | 250 | 188 | 5 | 150 Stuiver / 7.20{{e}} |

Forgoing the donation entirely: 0 Osseous Offerings, **Nightmares +5** — always the worst
option, must always sort last regardless of what's on offer that week.

### Relics (informational, not a per-run choice — don't badge)

A random bonus at run's end can award a special bone unlocking a unique Home Comfort (Relic
of the Revolution). The guide lists known ribcage/skull/limb combinations that correlate with
each variant (Guillotine, Angel, Cherub, Gorgon, Wheel, Headless Beast) but states this isn't
reliably reproducible ("no one knows how or why... good luck"). Not deterministic enough to
badge — leave as tooltip trivia at most, not a ranking input.

### Traps

- **The Labyrinth walk options are genuinely cosmetic** (guide: "has no effect... purely
  cosmetic... one linear path"). Per the skill's "do not badge a line the player cannot take"
  spirit (inverted here: don't badge lines with nothing to say), **skip badging A Labyrinth of
  Roof and Bone entirely** — there is no reward difference to report.
  - This card is also the exact one flagged in `adding-fallen-london-features` step 5's Airs
    retitle table: its two options ("Go one way in the catacombs" / "Go the other way in the
    catacombs") each carry **20 Airs-of-the-Sous retitle variants**. Since we're not badging
    this card at all, no alias work is needed — but if a future feature *does* badge it (e.g.
    if the "no effect" claim turns out wrong in some edge case), the 20-variant alias lists
    must be pulled from `Category:Airs of the Sous Text Uses` before badging, per the skill.
- **The bone-donation card's actual heading name is templated/weekly** — `(Catacombs Chamber)`
  is a wiki disambiguator, not the in-game text. The real card/storylet heading must be
  captured in-game before wiring `eachCardName`/`.storylet__heading` selectors; don't assume
  the parenthesised wiki title is what `headingName()` will read.
- **Osseous Offerings values are large integers (tens of thousands to millions)** — the badge
  should show the pre-computed "Total Value" column (Stuiver/echo), not the raw Offerings
  number, which means nothing to a player at a glance.
- Only **5 of each category's listed bones are ever simultaneously offered** (weekly
  rotation) plus the two constants (Human Ribcage, forgo) — the spec function must accept
  "whatever bone name is on the option now" and look it up, not assume all rows in the table
  are simultaneously visible; unmatched names should return `null` (bone not in the table yet
  — flag as a data gap) rather than silently badging nothing.

### Gating

No area at all (confirmed "[no area]" in TODO.md) and the guide gives no `currentArea()`
greeting to key off. Recommend **storylet-name gating only**: badge only when the visible
storylet/card heading matches one of `The Bones Above the Sous`, `A Labyrinth of Roof and
Bone` (if ever badged), `Return to the Upper Airs`, or the in-game bone-donation heading once
captured. No `strict` needed since none of these names collide with anything generic.

### Badge meaning (recommendation)

- **Bone donation options:** badge = the "Total Value" column, expressed in echoes (color
  ramp on the number, since it's a straightforward reward-size ranking — this is the cleanest
  of the three guides for a `bestZeeLine`-style "pick the biggest number" badge). Tooltip
  states both Stuiver and echo value, the % bonus over raw skeleton value, and flags Panoptical
  Skull / Ivory Femur explicitly as *below* skeleton value despite their large face number (a
  reader skimming raw totals would otherwise rank them too high — same trap as `pcColor`
  ranking nine same-value rows by shade; here it's the raw values that mislead, not the color).
  Forgo-donation always sorts last (Nightmares cost, 0 payout).
- **Labyrinth walk:** no badge (cosmetic, confirmed above).

---

## Summary of complexity for planning purposes

| Guide | Real choices to badge | Data completeness | Extra research needed before coding |
|---|---|---|---|
| The High Sancta | Card echo values (28 cards, 3 tiers) + informational Stumble-onwards risk readout | Reward *items* complete; **per-card echo totals mostly approximate (≈12.5), only 1 of 28 verified** | Fetch each of the 28 option pages for a real echo number, or accept the guide's flat estimate and mark it as such in the tooltip |
| Moon-Miser Herding | 5 risky branch options (quality-gated, remove-on-fail) + 3 gold cash-out cards | Complete and guide-verified (echo/EPA numbers given directly) | None — ready to spec from this doc |
| The Sous Catacombs | Bone donation value ranking, ~34 named bones across 5 categories | Complete, guide-verified totals | Capture the real in-game heading text for the donation card (currently only a wiki disambiguator is known) |
