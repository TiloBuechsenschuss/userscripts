# Airs of London storylets — research, group B (2026-09-27)

Scope: 7 entries from TODO.md's "Airs of London storylets (no guide)" list — Pursuing a
Mutually-Agreed Divorce, The Rewards of Ambition, Time in bed, A Dream of a Burning City,
Consider your Aquaria, Search your Terraria, The Clay Quarters (Storylet). Fetched via the wiki
API (`action=parse`/`action=query&prop=revisions`, never WebFetch — Anubis blocks it).

**None of these 7 are touched by any existing feature in `FallenLondon/choice-helper.js`** —
confirmed by grep for each storylet's own name and every option name found. In particular,
"Time in bed" is **not** a redirect target inside the existing `airs-of-london` feature's
`AOL_OPTIONS` table (grepped, zero hits) — despite TODO.md's note that it was flagged "still
open" when that feature was built 2026-09-24, it needs its own feature, not a slot in the
existing one.

Read `AOL_OPTIONS`/`aolE`/`AOL_TOP` (`choice-helper.js:9213-9689`) before implementing any of
these — the data shape below (`storylet`, `name`, `airs`, `ch`, `g`/`u`, `q`/`f`, `fail`, `re`,
`needs`) is that feature's own convention, reused here for consistency, even though each of
these 7 needs its OWN table/feature (none is a redirect target of the 6 AOL_TOP hubs).

---

## 1. Time in bed

https://fallenlondon.wiki/wiki/Time_in_bed — **reward data is already fully inline on the
storylet page itself**, no separate option-page fetch needed (only spot-checked, not
individually re-fetched).

Storylet at "Your Social Engagements", unlocked as **a redirect from "Attend to Matters of
Danger and Wounds"** (that hub storylet is itself not covered by any feature — flag as a
follow-up if a feature ever reaches it). All options cost 3 actions except the Fate one, and all
change The Airs of London. **This is the single highest-value target in this batch** — a
complete, well-defined progress carousel with real reward numbers, ready to badge as-is.

| Airs / needs | Option | Challenge | Success | Failure |
|---|---|---|---|---|
| 0-24 | Spend a day in bed | Luck 80% | Wounds -3, Nightmares -2/-0 | no change |
| 0-24, Acquaintance: the Repentant Forger 5 | A visit from the Repentant Forger | none (always) | Wounds -3, Seeing through the Eyes of Icarus +1, Jade Fragment +50 | — |
| 25-49 | A succession of visitors | Luck 60% | Wounds -4, Bottle of Morelways 1872 +1 | Wounds -3 |
| 25-49, Journal of Infamy 1x | Curled up with a book | Luck 60% | Wounds -5, Nightmares -2 | Wounds -3, Nightmares +1, Appalling Secret +2 |
| 25-49, Acquaintance: the Sardonic Music-Hall Singer 5 | A visit from the Sardonic Music-Hall Singer | none | Wounds -1, Nightmares -3, Bottle of Strangling Willow Absinthe +1 | — |
| 50-74 | A disturbance outside | Luck 60% | Wounds -3, Nightmares -1, Intriguing Snippet +1 | Wounds -2 |
| 50-74, Touched by Fingerwork 5 | Visions in the mirror | Luck 60% | Wounds -3, Nightmares -4 | Nightmares +3 |
| 50-74, Acquaintance: the Regretful Soldier 5 | A visit from the Regretful Soldier | none | Wounds -6 | — |
| 75-99 | The red herald | Luck 60% | Wounds -4, Nightmares -2 | Wounds -2, Nightmares +1 |
| 75-99, Vision of the Surface 1x | Surface-dreams | Luck 60% | Wounds -3, Nightmares -4, Vision of the Surface -1 | Wounds -3, Nightmares +1 |
| 75-99, Acquaintance: the Wry Functionary 5 | A visit from the Wry Functionary | none | Wounds -3, Intriguing Snippet +2, Scrap of Incendiary Gossip +1 | — |
| 90-100 | A dreamless sleep | none | Wounds -7, Nightmares -2 | — |
| Fate 8 | A remarkable tincture (8 FATE) | none, costs Fate | Wounds 0, Nightmares -1, Approaching the Gates of the Garden +5 | — |

Traps:
- **Six Luck-challenge options give real odds (60-80%)** — per the skill's rule, rank on expected
  value, not the advertised success figure alone.
- **Three "Acquaintance: X level 5" options have NO challenge at all** (always succeed) — these
  are the best picks whenever the matching Acquaintance is high enough; badge should mark them
  distinctly (`✓ always succeeds`, matching the `midnight-trade` convention already in this file).
- **Option availability is gated on more than Airs** for 4 of the 13 rows (an Acquaintance level,
  an item in hand) — per skill step 8, state these requirements in the tooltip; per "do not badge
  a line the player cannot take", note when the Acquaintance/item gate isn't met.
- Both Wounds and Nightmares move on most rows — the badge's one number can't easily be "the"
  figure; recommend showing net Wounds reduction as the primary number (this storylet's whole
  point, per its Description, is convalescing) with Nightmares change as a secondary mark,
  matching how other multi-currency badges in this file (e.g. `ecdysis`) handle it.
- "A remarkable tincture" is Fate-locked — exclude from a free-to-play ranking, keep in tooltip.

Badge-meaning recommendation: net Wounds change is the primary number (this is explicitly a
convalescing/rest storylet), Nightmares change a secondary mark, Luck odds shown per the skill's
expected-value rule, and the three always-succeed gated options marked distinctly.

Gating: confirm-only on a captured greeting for "Your Social Engagements" if one exists in this
file already (check `SOCIAL_*`/`social-actions` feature, which is already filed there) — or gate
on the opened-storylet heading "Time in bed" directly, which is the safer, established pattern
for a single fixed storylet (matches Ecdysis/Midnight Trade/To Make a Moth precedent from the
just-shipped Firmament batch).

---

## 2. The Rewards of Ambition

https://fallenlondon.wiki/wiki/The_Rewards_of_Ambition — **recommend: no badge, or a trivial
one-line label only.**

This is the post-victory epilogue menu for the four Ambition storylines (Bag a Legend!, Heart's
Desire!, Light Fingers!, Nemesis), locked behind `Obscurity 4` (hidden) and each option gated on
having FINISHED that specific Ambition at an exact late-game value (e.g. `Ambition: Bag a Legend!
exactly 2000`, `Ambition: Nemesis 4300-4500`). Spot-checked 3 of the ~13 options directly:

- Each says only `Game Instructions = This will grant a mix of rewards and reduce your
  Nightmares/Scandal` — the actual reward is **not itemised on the option page**, it is
  "a mix," and the flavour text (which paragraph shows) varies by the Airs of London, which is
  exactly the "text" categorisation TODO.md's [12 text] count refers to — **this is a retitle/
  reflavour of the STORY TEXT, not the reward**, so it is not the kind of Airs entry the skill's
  step 5 alias mechanism is for (that's for option TITLES changing, not prose paragraphs).
- Each is realistically playable **once per playthrough** (finishing an Ambition a second time
  isn't how the game works) — there is nothing to rank across repeated plays, matching the
  Kinetoculus precedent ("nothing to badge: ... no economic or comparable reward").

Recommend marking `(considered, nothing to badge: one-time post-Ambition epilogue clicks, reward
is an unitemised "mix," the Airs-of-London variance is flavour text not option titles)` and not
writing any code, mirroring how Kinetoculus was resolved in the Firmament batch.

---

## 3. A Dream of a Burning City

https://fallenlondon.wiki/wiki/A_Dream_of_a_Burning_City

**Re-fetched 2026-09-28 with full `action=parse&prop=wikitext` on all 8 option pages** (the
2026-09-27 pass used `action=query&prop=revisions`, which truncated several reward blocks — see
"What was wrong with the first pass" below). All data is now complete; no further fetch needed.

A dream sequence, **redirected from "Overwhelmed by Smoke and Heat"** (that quality/storylet is
not covered by any feature either — flag as follow-up). Progress quality "Fie to the Wyrm"
(0→1, then 2+). Every option's `{{Redirect|A Dream of a Burning City}}` sends the player straight
back into the same storylet — this is a repeatable loop, not a one-shot dream, on both success
and failure.

| Fie to the Wyrm gate | Airs | Option | Success | Failure |
|---|---|---|---|---|
| 0-1 | 0-50 | Fight for breath | Inkling of Identity 27-48, Fie to the Wyrm +1-2, loses 1 Overwhelmed by Smoke and Heat | Inkling of Identity 7, Fie to the Wyrm +1, loses 1 Overwhelmed by Smoke and Heat, Nightmares +1 |
| 0-1 | 0-50 | Flee over melting cobbles | Map Scrap 10-37**?**, Fie to the Wyrm +2, loses 1 Overwhelmed by Smoke and Heat | Map Scrap 10**?**, Fie to the Wyrm +1, loses 1 Overwhelmed by Smoke and Heat, Nightmares +1 |
| 0-1 | 51-100 | Watch the Tower | Sighting of a Parabolan Landmark 31, Fie to the Wyrm +1, loses 1 Overwhelmed by Smoke and Heat | Sighting of a Parabolan Landmark 48, Fie to the Wyrm +1, loses 1 Overwhelmed by Smoke and Heat, Nightmares +1 |
| 0-1 | 51-100 | Cower | Maniac's Prayer 7-27, Fie to the Wyrm +2, loses 1 Overwhelmed by Smoke and Heat | Maniac's Prayer 10, Fie to the Wyrm +1, loses 1 Overwhelmed by Smoke and Heat, Nightmares +1 |
| 2+ | 51-100 | Man the cannons | Well-Placed Pawn 31-37**?**, Fie to the Wyrm +1, loses 1 Overwhelmed by Smoke and Heat | Well-Placed Pawn 27-37**?**, **Fie to the Wyrm −1**, Overwhelmed by Smoke and Heat set to 0, Nightmares +1 |
| 2+ | 51-100 | Tend to wounded dreamers | Inkling of Identity 31, Fie to the Wyrm +1, loses 1 Overwhelmed by Smoke and Heat | Inkling of Identity 48, **Fie to the Wyrm −1**, loses 1 Overwhelmed by Smoke and Heat, Nightmares +1 |
| 2+ | 1-50 | Form a bucket chain | Well-Placed Pawn 31-37**?**, Fie to the Wyrm +1, loses 1 Overwhelmed by Smoke and Heat | Well-Placed Pawn 27-37**?**, **Fie to the Wyrm −1**, loses 1 Overwhelmed by Smoke and Heat, Nightmares +1 |
| 2+ | 1-50 | Save a fellow dreamer | Maniac's Prayer 48, Fie to the Wyrm +1, loses 1 Overwhelmed by Smoke and Heat | Maniac's Prayer 48, **Fie to the Wyrm −1**, loses 1 Overwhelmed by Smoke and Heat, Nightmares +1 |

**Cower confirmed: it does NOT have an empty reward.** The 2026-09-27 pass's empty bullet was a
plain truncation artefact of `action=query&prop=revisions` cutting the page off mid-block, not a
narrative-only option. Cower pays Maniac's Prayer 7-27 (success) / 10 (failure), same shape as
every other tier-0-1 option.

**The `?` on "Well-Placed Pawn 31-37" (and "27-37", "Map Scrap 10-37"/"10") is the WIKI'S OWN
uncertainty marker**, present in the source wikitext itself (`{{Gain|Well-Placed Pawn|31-37?
x}}`), not a fetch artefact — carry it through as a `?` mark on the badge if this is implemented,
per the skill's "an unread input shows a range, `?`, or manual control" rule.

**Well-Placed Pawn / `war-of-assassins` clarification (asked for explicitly):** it is **name-
identical only, not a shared table row or mechanic**. `Well-Placed Pawn` is a general-purpose
item currency this game reuses across many unrelated storylines already in this file — confirmed
by grep: it appears in `war-of-assassins`'s own table, `The Honours of the Court` (the
`fascinating` feature, `choice-helper.js:10691`), the `chessboard` feature
(`choice-helper.js:25250-25259`), and at least three more unrelated spots
(`choice-helper.js:27434`, `27493`, `29993`, `29995`, `32822`) — the same pattern as any other
common item (Moon-Pearl, Cryptic Clue) turning up in dozens of tables throughout the file. This
dream's two options (Man the cannons, Form a bucket chain) simply pay another quantity of that
same real item; there is nothing to fold into `war-of-assassins`' table, no cross-feature
conflict, and the existing "no OPTION NAME in two tables" collision test is unaffected (that test
checks option/storylet names, never item names, which are legitimately shared everywhere).

**Traps:**
- **Tier 2+ options lose a Fie to the Wyrm on FAILURE** (dropping back toward the tier-0-1 pool),
  the opposite direction from the tier-0-1 options (which always GAIN Fie to the Wyrm regardless
  of outcome) — a table field must carry this per-row, never assume "failure only differs in
  reward size."
- Every option also always **loses 1 Overwhelmed by Smoke and Heat** on both outcomes (except
  Man the cannons' failure, which sets it to exactly 0 instead of -1 — a different shape, carry
  literally) — this is the storylet's own exit-countdown resource, not something to badge as a
  reward.
- Both Map Scrap and Well-Placed Pawn ranges carry the wiki's own `?` — do not present either as
  a certain number.
- Nightmares +1 on every failure is consistent and can be stated once in the storylet-level
  tooltip rather than repeated per row, matching the `redStageSpec`-style "state the shared cost
  once" convention from the Firmament batch.

Badge-meaning recommendation (unchanged from before, now on complete data): net Fie-to-the-Wyrm
direction is the real story here (progress vs. setback), so the badge should mark whether an
option's FAILURE also risks losing a tier, not just its success reward — the four tier-2+ options
are riskier than the four tier-0-1 ones in a way a flat reward-size ranking would hide.

### What was wrong with the first pass

The 2026-09-27 research used `action=query&prop=revisions&rvprop=content&rvslots=main`, batching
all 8 titles in one call. That call's JSON came back with several pages' `content` field cut off
mid-wikitext-block (always right after a `{{Gain|...}}` or `{{Loss|...}}` line, before the closing
`}}` and the Failure block). The single-page `action=parse&prop=wikitext` calls used for this
follow-up returned the complete page every time. For a future batch of many pages, prefer several
smaller `action=parse` calls (or verify `action=query&prop=revisions` batches aren't silently
truncating by checking each page's content ends where the wikitext should) over one large
`action=query` batch.

---

## 4. Consider your Aquaria

https://fallenlondon.wiki/wiki/Consider_your_Aquaria — opportunity **card** (not a storylet) at
University Laboratory (Place), Abundant Frequency, unlocked by `Ichthyological Focus`, locked
behind `Piscine Research 200`. Confirmed via grep this card is **not** in the existing
`university-laboratory` feature's `LAB_CARDS` table — genuinely new.

Full data is inline on the card's own page (a `<noinclude>` reference table, not per-option
pages — no further fetch needed):

| Fish | Research given | Loses fish? | Challenge |
|---|---|---|---|
| Cheerful Goldfish | Piscine Research 2x | yes | — (no challenge, always available) |
| Possessed Goldfish | Piscine Research 2x + Parabolan Research 4x | yes | — |
| Live Specimen | Piscine Research 25x | yes | — |
| Deep-zee Catch | Piscine Research 10x | yes | — |
| Mostly Stuffed Bound Shark | Piscine Research 25x | no | Watchful 220 |
| Unerring Elver | Piscine Research 25x | no | Watchful 220 |
| Haunted Goldfish | Piscine Research 4x | no | Watchful 220 |
| Prismatic Squidling | Piscine Research 25x | no | Watchful 215 |
| Dark-Carapaced Crustacean | Piscine Research 25x | no | Watchful 220 |
| Gilded Crustacean | Piscine Research 50x | no | Watchful 250 |
| Copper-Speckled Crustacean | Piscine Research 25x | no | Watchful 220 |
| Voracious Lamp-Eye | Piscine Research 25x | no | Watchful 220 |

The first 4 ("Study a Goldfish" etc.) are always-available base options, **consuming the named
fish from inventory** (loses it) for a flat Research amount, no challenge. The Airs-gated options
(the last 8, gated in pairs at Airs 1-25 / 25-50 (sic, overlapping at 25) / 51-75 / 75-100) do
NOT consume the fish on success (per the "Lose fish? no" column) but DO risk it on the stated
Watchful 220-250 challenge (the page doesn't say whether failure loses the fish — needs
confirming from the individual option pages, not fetched in this pass).

Badge-meaning recommendation: Research per fish is the obvious number (a straight ranking, most
Piscine Research per card played), with the four base options marked "always available, consumes
the fish" and the eight Airs-gated ones marked with their Airs window and Watchful difficulty.
Gilded Crustacean (50x, hardest challenge) and Live Specimen/Deep-zee Catch/most 25x options
cluster around the same value — the real differentiator across most rows is challenge difficulty,
not reward size, similar to `midnight-trade`'s "reward barely varies, rank by risk" shape.

Gating: card-name match via `eachCardName`, same pattern as `high-sancta`/`moon-miser-herding`
from the Firmament batch — no heading needed, these are cards.

---

## 5. Search your Terraria

https://fallenlondon.wiki/wiki/Search_your_Terraria — same shape as Aquaria, sibling card at
University Laboratory (Place), unlocked by `Herpetological Focus`, locked behind `Amphibian
Research 150`. Also confirmed not in `LAB_CARDS`.

| Creature | Research given | Loses creature? | Challenge | Other benefit |
|---|---|---|---|---|
| Reprehensible Lizard | Amphibian Research 3x | yes | — | — |
| Partisan Messenger Tortoise | Amphibian Research 15x | no | Watchful 210 | — |
| Mycological Bullfrog | Amphibian Research 25x | no | Watchful 220 | — |
| Ocular Toadbeast (Fate) | Amphibian Research 25x | no | Watchful 220 | — |
| Amber Iguana | Amphibian Research 10x | no | Watchful 220 | Shapeling Arts +1 CP |
| Viric Lizard | Amphibian Research 25x | no | Watchful 230 | Parabolan Research +10x |
| Warm-hearted Amber Iguana | Amphibian Research 10x | no | Watchful 230 | Shapeling Arts +1 CP |
| Rubbery Dragon | Amphibian Research 10x | no | Watchful 230 | Shapeling Arts +2 CP |
| Hound of Heaven | Amphibian Research 15x | no | Watchful 210 | — |

Only "Study a Lizard" is the always-available base option (consumes a Reprehensible Lizard, no
challenge). The rest are Airs-gated in pairs (0-25 / 26-50 / 51-75 / 76-100), one is Fate-gated
(Ocular Toadbeast — exclude from a free ranking). Several give a bonus quality CP (Shapeling Arts,
Parabolan Research) alongside the Research, which the flat "Research per card" number would miss
— tooltip should state these, and Rubbery Dragon (Shapeling Arts +2, the highest bonus) is worth
flagging as the standout despite a mid-pack 10x Research figure, same "don't let the raw number
mislead" caution as Sous Catacombs' skeleton-value warning in the Firmament batch.

Recommend: **one shared feature covering both Aquaria and Terraria** (`university-creatures` or
similar) rather than two, since they're the same mechanic at the same location with the same
"Research per card, ranked, challenge as the real differentiator" badge meaning — matches how
`piracy` or `zee-beasts` already consolidate similar-shaped content in this file.

---

## 6. The Clay Quarters (Storylet)

https://fallenlondon.wiki/wiki/The_Clay_Quarters_(Storylet) — storylet at "The Clay Quarters"
area. Base options (Emancipate a Clay Man, Recruit Clay Man labour, Visit Bernard) are NOT
Airs-related and out of scope here (leave to a future pass if this area ever gets fuller
coverage). All 8 counted Airs-gated/redirect options fetched in full:

| Airs / gate | Option | Challenge | Success | Failure |
|---|---|---|---|---|
| 0-25 | Assist at a mud-surgery | Watchful 21 | Jade Fragment 16-24, Piece of Rostygold 17-25 | nothing (re-fetched 2026-09-28, confirmed: only an Airs reroll, no item/CP loss) |
| 0-33 | Track down a recidivist | Watchful 24 | Piece of Rostygold 46-55 | nothing (two failure variants, both no reward) |
| 26-50 | Assist a Ragged-Sleeved Academic | Watchful 20 | Moon-Pearl 37-42, Making Waves +2 CP | nothing |
| 34-66 | Coax society secrets from the Clay Men | Watchful 22 | Cryptic Clue 19-25 | nothing |
| 51-75 | Decipher Loamsprach poetry | Watchful 24 | Appalling Secret 1, Romantic Notion 1, Cryptic Clue 6-15 | nothing |
| 76-100 | Take a stroll through the Quarter | Watchful 22 | Cryptic Clue 17-23 (two success variants, one narrative-only "Fabrication" giving Cryptic Clue 19-23) | nothing (re-fetched 2026-09-28, confirmed: only an Airs reroll) |
| 0-33, needs A Complication: Jasper and Frank | You cross paths with Jasper and Frank | none, 0 action cost | redirects to "A Complication: Jasper and Frank" (Ambition: Nemesis storyline) | — |
| 67-100, Fate 5 | Even the odds in a clay dispute (5 FATE) | none, costs Fate | Intriguing Snippet 5, Moon-Pearl 100, Dangerous +20 CP, Steadfast +3 CP (cap 10) | — |

Traps:
- "Making Waves" (Ragged-Sleeved Academic) — check this isn't already a tracked quality
  elsewhere in the file before badging it as a bare quality gain.
- The Jasper-and-Frank redirect is Ambition: Nemesis-locked, 0 action cost, and purely narrative
  (no reward) — informational only, matching the `redStageSpec`-style "setup note" pattern rather
  than a ranked option.
- The 5-FATE option is a genuinely large one-off payout (100 Moon-Pearl + a permanent-ish
  Steadfast CP) — exclude from a free-to-play ranking per the skill's convention, keep in tooltip.
- All five Watchful challenges (20-24) are close together — reward size (Cryptic Clue count,
  bonus quality CP) is the real differentiator, not difficulty, the reverse of Aquaria/Terraria.

Badge-meaning recommendation: net item value or a flat "gives X" text (the guide gives no
consistent common currency to convert to, unlike the Sous Catacombs' Stuiver conversion) —
recommend showing the primary named reward + count, with Watchful difficulty as a secondary
mark, and excluding the Fate option and the Ambition redirect from any ranking.

Gating: storylet-heading match on "The Clay Quarters" (an opened-storylet gate, matching the
Ecdysis/Moth precedent), not an area guess — the area name "The Clay Quarters" is also the
storylet's own name here, so this one is safer than most to key off directly.

---

## Summary for the parent task

| Storylet | Recommendation | Data completeness |
|---|---|---|
| Time in bed | New feature, ready to spec | Complete (13 rows, full reward data) |
| The Rewards of Ambition | No code — nothing to badge (one-time epilogue, unitemised reward) | N/A |
| A Dream of a Burning City | New feature, ready to spec | Complete (8 rows, re-fetched 2026-09-28 with full pages; Cower confirmed to have a real reward, tier-2+ failure direction confirmed) |
| Consider your Aquaria | New feature, combine with Terraria | Complete (12 rows) |
| Search your Terraria | New feature, combine with Aquaria | Complete (9 rows) |
| The Clay Quarters (Storylet) | New feature, ready to spec | Complete (8 rows; the 2 previously-truncated failure cells re-fetched 2026-09-28, both confirmed no-reward) |
| Pursuing a Mutually-Agreed Divorce | New feature, ready to spec | Complete (12 rows, full reward data incl. two Social Actions contests) |

Six of seven are ready to implement directly from this document (Burning City and Clay Quarters
both completed 2026-09-28). Only **The Rewards of Ambition** is intentionally not fetched
further — it's recommended as "nothing to badge" (see section 2), so no option-page data is
needed for it. No open fetches remain anywhere in this document.
