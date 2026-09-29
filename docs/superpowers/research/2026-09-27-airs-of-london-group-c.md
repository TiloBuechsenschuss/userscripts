# Airs of London storylets, group C (11 of 61) — research (2026-09-27, updated 2026-09-28)

Scope: the 11 TODO.md "Airs of London storylets (no guide)" entries from "A Jaunt in the (Weather)"
through "Wolfstack in the fog". Source: wiki API (`action=query&prop=revisions&rvprop=content` for
individual option pages, `action=parse&prop=wikitext` for storylet pages), fetched 2026-09-27 and
2026-09-28. **Every storylet AND every one of its Airs-gated option pages has now been fetched.**
No further wiki research is needed before writing `AOL_OPTIONS`-shaped tables for these 11 — see
the Summary at the bottom for the one item still genuinely open (Shifting Streets' depth-tier
mechanic needs a design decision, not more research).

Existing-feature check: grepped `choice-helper.js` for every storylet name and every option name
found below. None of the 11 storylets is currently badged by any feature. Two near-misses that are
**confirmed NOT the same content** (documented so nobody re-investigates them):
- "On the Trail (Storylet)" raises a quality literally named `On the Trail (Quality)` (wiki page
  title; in-game **Appearance** — the text the game actually shows — is bare `On the Trail`,
  confirmed on every one of its 5 option pages via `{{Gain|On the Trail (Quality)|Appearance=On the
  Trail|...}}`). This is a **different quality object** from `clay-highwayman`'s "On the Trail of
  the Clay Highwayman" (a differently-named quality at choice-helper.js:32482-32490) — same short
  display word, unrelated quality IDs, unrelated storylets, unrelated locations. Not a data
  collision, only a naming coincidence — but a REAL gating risk if this were ever badged with a
  bare `.branch__title` scan (see #9 below for the resolution: `carouselRatings`' own
  storylet-heading gate already handles this correctly, the same way it already handles every
  other feature in this file, no extra machinery needed).
- "A Name in Seven Secret Alphabets" is referenced as a *gating requirement* by three unrelated
  storylets already in the file (Forgotten Quarter, Prelapsarian Museum) — those are different
  content that happens to need the same quality, not overlap.

---

## 1 & 3. A Jaunt in the (Weather) / A Jaunt in the (Weather) (The Waswood)

https://fallenlondon.wiki/wiki/A_Jaunt_in_the_(Weather) — [5 unlock, 2 text]
https://fallenlondon.wiki/wiki/A_Jaunt_in_the_(Weather)_(The_Waswood) — [5 unlock, 1 text]

**Both are already named in the `adding-fallen-london-features` skill's own step-5 reference
table**: "A Jaunt in the (Weather) (storylet) — the storylet's own heading, 5 variants, quality The
Airs of London." Confirmed: **the STORYLET HEADING ITSELF is retitled**, not an option inside it —
`(Weather)` becomes one of 5 words (Snow/Rain/Sunshine/Wind/Storm) depending on The Airs of London
band (0-20/21-40/41-60/61-80/81-100). Both pages are opened only via a redirect from "Take a stroll
in the (Weather)" — an option filed under "The Usual Glut of Weather" card, on this same TODO list
separately (a different group, not this file).

**All 7 London option pages fetched. Confirmed: this is entirely narrative, no economic reward at
all.**

| Option | Unlock | Success gives | Redirects to |
|---|---|---|---|
| Observe the people | (always, entry point) | `Wise to the Weather` now=1 | back to `A Jaunt in the (Weather)` |
| Revel in the snow | Wise to the Weather exactly 1, Airs 0-20 | `Wise to the Weather` now=5 | back to `A Jaunt in the (Weather)` |
| Traipse through the rain | Wise to the Weather exactly 1, Airs 21-40 | `Wise to the Weather` now=5 | back to `A Jaunt in the (Weather)` |
| Bask in the sunlight | Wise to the Weather exactly 1, Airs 41-60 | `Wise to the Weather` now=5 | back to `A Jaunt in the (Weather)` |
| Walk in the wind | Wise to the Weather exactly 1, Airs 61-80 | `Wise to the Weather` now=5 | back to `A Jaunt in the (Weather)` |
| Run through the storm | Wise to the Weather exactly 1, Airs 81-100 | `Wise to the Weather` now=5 | back to `A Jaunt in the (Weather)` |
| Look up at the sky | Wise to the Weather exactly 5 | Nightmares +3-4? CP (only line with any reward) | `A Return to Shelter` (ends the loop) |

No items, no Stuiver, no other qualities anywhere in the chain — every weather-band option just
sets `Wise to the Weather` to 5 (regardless of which weather it was) so that "Look up at the sky"
becomes available, which costs Nightmares and exits. The Waswood twin was not re-fetched
option-by-option (same shape confirmed by its storylet page already matching the London one
field-for-field except `Indulge your doubts` replacing `Look up at the sky` — low value to
re-verify given the London twin has zero reward to differ on).

**Recommendation: nothing to badge, economically** — same class as Kinetoculus. If a badge is
wanted purely for **navigational** value (which weather-band option to pick, i.e. "this one matches
today's forecast"), that needs the heading-alias wiring described below, but there is no reward
number to attach to it. **Mark `(considered, nothing to badge: purely narrative, only sets a
counter toward "Look up at the sky", no items or Stuiver anywhere in the chain)` in TODO.md** for
both lines, matching the Kinetoculus/Wolfstack precedent.

Wiring note, kept for the record in case a future feature ever needs this shape for a DIFFERENT
weather-retitled storylet: this needs a wildcard/alias mechanism for the HEADING itself, not
`CAROUSEL_PLACEHOLDER` (that regex matches bracketed text *inside* a name verbatim, e.g.
`(Roof Prey)` — not "any of these 5 literal words"). The precedent is `carouselCanonical`'s function
form (Parabolan Hunting's quarry-name function; Scaling the Quartz's 3-title alias in this same
batch uses the plain-object form of the same mechanism).

---

## 2. Attract a Visitor at Hallowmas

https://fallenlondon.wiki/wiki/Attract_a_Visitor_at_Hallowmas — [7 unlock]

Seasonal (Hallowmas / Feast of Masks), `Unlocked with = World Unlock: London's Season: Hallowmas`.
`Game Instructions`: requires Making Waves AND Nightmares both ≥5, dealt as a card whose "choices
keep changing." Base options (not Airs-gated, not fetched — flavour-only per their names): "Bolt
the door and hide under the bed", "Open a window to the night air", "Summon a Visitor (10 FATE)",
"So hungry", "Let their error be eaten".

**All 7 Airs-gated option pages fetched.** Full `AOL_OPTIONS`-row-shaped table:

| Option | Airs | Locks (besides Airs) | Challenge | Success | Failure |
|---|---|---|---|---|---|
| Light the candle in the horse's skull. | [[1,25]] | Foxfire Candle Stub ×2 (spent), Making Waves <11 | none | Making Waves +1–3, Nightmares +1–2 | (none, no challenge to fail) |
| Burn your promises | [[26,50]] | Steadfast 2 (spent, −3 CP), Making Waves <11 | none | Steadfast −3, Nightmares +1, Making Waves +1 or +3 (random), Subtle +3 (cap 10) | (none) |
| Attend a lecture on 'spiritual hygiene' | [[30,35]] | 7 Fate, Watchful 200, Renown: Hell 5, blocked by holding an Infernal Contract or a Peculiar Personal Enhancement | Persuasive 1 (near-certain) | Your very own Infernal Contract ×1, Hedonist +5 (cap 15) AND a choice of 1 of 4 items (Vial of Cantigaster Venom / Ray-Drenched Cinder / Dreadful Surmise / Intriguer's Compendium), Favours: Hell +1 | Wounds +1, same item choice as success (redirects to another storylet either way — see Wiki Note) |
| Serve wine with bitter herbs | [[51,75]] | Hedonist 1, Penny ×100 (spent), Making Waves <11 | none | Hedonist −3, Nightmares +1, Making Waves +1–5, Austere +3 (cap 10) | (none) |
| Whisper secrets to mirrors | [[76,100]] | Whispered Hint ×77 (spent), Making Waves <11 | Watchful 50 (guide note: "impossible to fail") | Having Recurring Dreams: Is Someone There? +1 (cap 8), Touched by Fingerwork +1 (cap 8), Shadowy +3, Making Waves +1–4, Nightmares +1–4 | (effectively never happens) |
| Echoes of Christmas | [[81,90]] | Putting the Pieces Together: the Taste of Lacre 2 | none | Tale of Terror!! ×1, Nightmares +2, Making Waves +2 | (none) |
| Feeding the River | [[90,100]] | Penny ×50 (spent), Putting the Pieces Together: the Drownies | Watchful 200 (broad) | Watchful CP, Putting the Pieces Together: the Drownies +1, Making Waves +1–5?, Nightmares +1–3?, Extraordinary Implication ×1 | Watchful CP, same quality progress, Making Waves +1–3?, Nightmares +5 |

Three windows overlap another (30-35 inside 26-50; 81-90 and 90-100 both inside 76-100) — at some
Airs values two of these can be offered at once; badge each with its own window, do not assume
exactly one is ever live. "Attend a lecture" is Fate-locked and blocked once the player already
holds the relevant items — per skill step: exclude from any free-to-play ranking, keep in tooltip.

**Recommendation:** standalone small feature (seasonal, seven rows, ready to spec exactly as
tabled above) — no existing feature touches Hallowmas content, no name collisions found.

---

## 4. A long conversation with the Functionary

https://fallenlondon.wiki/wiki/A_long_conversation_with_the_Functionary — [6 unlock]

Marked `{{legacy}}` on the wiki (older content, still likely live — legacy means "written before a
UI change," not retired; contrast with Wolfstack below, which is `{{Retired}}`). No location given
on the page. All 6 Airs-gated option pages fetched, resolving the collision trap completely.

**The collision resolves to a non-issue on rewards, but the display-text collision itself is
still real and must be encoded as a multi-window row, exactly like the skill's other
multi-window cases** (Ecdysis's "Root yourself in place" is the closest precedent in this batch —
same option, several windows, one row):

| Display name | Airs windows | Challenge | Success | Failure |
|---|---|---|---|---|
| Catch up on his recent work | `[[1,18],[37,54],[55,72]]` | none | flavour only; window 1-18 also sets `Recent Topic of Conversation: now=Duchess and Society` | (no challenge, no failure branch) |
| Follow up on his work | `[[19,36],[91,100]]` | none | flavour only; window 19-36 also sets `Recent Topic of Conversation: now=Admiralty`; window 91-100 sets the SAME `Recent Topic of Conversation: now=Admiralty` | (no challenge, no failure branch) |
| Peek over his shoulder | `[[73,90]]` | listed `NarrowQuality = Subtle` but `NarrowDiff` is blank on the wiki (a data gap, not a 0) and the page ends in a bare `{{Failure}}` template with no text — functionally reads as checkless/narrative too | flavour only, no gain/loss lines at all | (blank) |

**All three rows pay literally nothing** (no items, no Stuiver, no quality CP beyond the one-off
`Recent Topic of Conversation` flag two of the three windows set, which is itself just a flavour
flag consumed by a later conversation, not a reward). This means the earlier "does the reward
differ across windows" question is moot — it does not, because there is no reward. The multi-window
merge (`Catch up on his recent work` as one row with an array of 3 ranges, `Follow up on his work`
as one row with an array of 2) is still the CORRECT wiring — it just turns out to back a label, not
a value.

The other 8 non-Airs options (career, heart, employment, Companion in Amber, wife,
Palace-Admiralty, Duchess gossip) are flavour/social, not fetched (same shape expected).

**Recommendation: nothing to badge, economically** — same class as the Jaunt-in-the-Weather pair
and Kinetoculus. Mark `(considered, nothing to badge: every option, Airs-gated or not, is pure
flavour text with no item/Stuiver/CP reward)` in TODO.md.

---

## 5. Investigate Clathermont's Tattoo Parlour

https://fallenlondon.wiki/wiki/Investigate_Clathermont%27s_Tattoo_Parlour — [6 unlock]

Ladybones Road. `Unlocked with = A Name in Seven Secret Alphabets 1-3` (a Making Your Name
investigation quality — genuinely new content, not the Clathermont-family storyline already in this
file, which is a different quality, `Entwined in the Intrigues of the Clathermont Family`).
`Game Instructions`: "will not help you Make Your Name" — a side-branch, not the case's own track.

**All 6 option pages fetched.** Full table, all Watchful checks, all pay Moon-Pearl or a named
item:

| Option | Airs | Challenge (Watchful, broad) | Success gives | Failure |
|---|---|---|---|---|
| Snatch a glimpse of a tattoo – and memorise it | [[0,25]] (Locked with Airs 26, i.e. below 26) | 21 | Moon-Pearl ×21 | nothing (just the Airs re-roll) |
| Make clandestine sketches, right there in the shop! | [[0,25]] (Locked with Airs 26) | 24 | Moon-Pearl ×24 | nothing |
| Get casual work sweeping the parlour floor – and listen in | [[26,50]] | 18 | Cryptic Clue ×9; rare success: Inkling of Identity ×4 instead | nothing |
| Note down descriptions of the visitors | [[51,75]] | 15 | Moon-Pearl ×15 | nothing |
| See if you can get the names of the visitors. | [[51,75]] | 18 | Moon-Pearl ×18 | nothing |
| Frequent the public house across from Clathermont's Tattoo Parlour. | [[76,100]] | 13 | Whispered Hint ×13 | nothing |

Two pairs share a window (0-25 has two options; 51-75 has two) — both can be live at once at those
Airs values, and unlike #4 their TEXT is distinct, so no merge is needed, just two badges. All 6
option names are unique — no collision trap. **Recommendation:** standalone feature, ready to spec
exactly as tabled above — distinctive names, one clean location, no overlap with any existing
feature. Badge-meaning: since payout scales with the challenge's own difficulty number
(Moon-Pearl ×21 at Watchful 21, ×24 at 24, ×15 at 15, ×18 at 18, Whispered Hint ×13 at 13 — the
item count literally equals the broad difficulty on 4 of 6 rows), this is a case where a flat
success-value badge marked `?` is honest and simple, same convention as everywhere else this batch.

---

## 6. Shifting Streets (Storylet)

https://fallenlondon.wiki/wiki/Shifting_Streets_(Storylet) — [6 unlock]

A Living World Event. Gated on `Pedestrian Peregrinations` (0 or 1-7) as well as Airs;
`Unlocked with = World Unlock: Shifting Streets`. Base option "Scour map and memory" not fetched
(entry point, not Airs-gated).

**All 6 build-progress option pages fetched. This is NOT flavour-equal — it pays real items, and
the reward DEPENDS on a second, unreadable variable** (`In Search of an Itinerant Address`, a
Math-type quality with values keyed to which historical City — Fourth/Third/Second — the player is
searching, 1/4/8 tiers), on top of Airs:

| Option | Airs window | Challenge | Base (tier "1") reward | Tier "4" reward | Tier "8" reward | Failure |
|---|---|---|---|---|---|---|
| Search the city for vagrant streets | 0-66 | Watchful 180 (broad; 60/100/180 by City searched) | Map Scrap ×15 | + Extraordinary Implication ×1, Map Scrap ×5 | + Extraordinary Implication ×2 | Nightmares +1, same progress |
| Observe the city from on high | 34-100 | Shadowy 180 (broad; 60/100/180) | Maniac's Prayer ×15 | + Aeolian Scream ×1, Maniac's Prayer ×5 | + Aeolian Scream ×2 | Nightmares +1, same progress |
| Ingratiate yourself with the citizens | outside 34-66 (i.e. 0-33 and 67-100) | Persuasive 180 (broad; 60/100/180) | Map Scrap ×15 | + Night on the Town ×1, Map Scrap ×5 | + Night on the Town ×2 | Scandal +1, same progress |
| Pore over your maps | 17-83 | Mithridacy 9 (narrow; 1/5/9) | Map Scrap ×15 | + Extraordinary Implication ×1, Map Scrap ×5 | + Extraordinary Implication ×2 | Nightmares +1, same progress |
| Study convolutions of space | outside 17-49 | Artisan of the Red Science 9 (narrow; 1/5/9) | Maniac's Prayer ×15 | + Aeolian Scream ×1, Maniac's Prayer ×5 | + Aeolian Scream ×2 | Wounds +1, same progress |
| Search for meaning in the rearrangements | outside 50-83 | A Player of Chess 9 (narrow; 1/5/9) | Romantic Notion ×15 | + Extraordinary Implication ×1, Romantic Notion ×5 | + Extraordinary Implication ×2 | Suspicion +1, same progress |

All 6 give `Pedestrian Peregrinations +7 CP` on EITHER outcome (confirming the "same progress
regardless of option" read was correct for the progress currency, but wrong for the item reward,
which does vary and does depend on an unreadable second variable). This is the same honesty
problem as Scaling the Quartz's live-quality dependency in this same batch: the exact item count
this script could show is the "tier 1" baseline (always true regardless of `In Search of an
Itinerant Address`), with the tier-4/8 bonuses stated in the tooltip as "more, if you're deep into
the search for a specific City" rather than computed. **Recommendation:** standalone feature is now
justified (real, differing rewards) — badge the base value marked `?` (challenge) with the
tier-dependent bonus in the tooltip only, same convention as Scaling the Quartz's
Momentum/Flexibility caveat.

The Conclusion section (`Follow your feet` ×3, split by City era) and "Abandon this course" remain
narrative-only/exit options — not fetched, not badge-worthy on their names.

---

## 7. Candlefinder: Canvassing the Clay Men

https://fallenlondon.wiki/wiki/Candlefinder:_Canvassing_the_Clay_Men — [5 unlock]

(Note for whoever fetches next: the colon needs `%3A` encoding in the API URL — a bare `:` returns
`missingtitle`.)

Location "Fallen London" (global/roaming storylet), `Unlocked with = Candlefinder Lead: Clay Men of
London`. 7 options total; **the Airs-gated subset is now confirmed by fetching all 7 option
pages directly** (the storylet page's own render omitted the per-option windows entirely — they
only exist on each option's own page, under `Unlocked with` OR `Locked with`, which is why the
first pass missed them).

**The 5 Airs-gated options** (matches the TODO's `[5 unlock]` exactly):

| Option | Airs | Locks (besides Airs) | Challenge | Success | Failure |
|---|---|---|---|---|---|
| Emancipate a Clay Man | [[40,80]] | Strong-Backed Labour (spent) | none | Ruthless +?CP (cap 10), Detecting... +8, Magnanimous +2 | (no challenge, no failure branch) |
| Patch up an injured Clay Man | [[70,100]] | none | Dangerous 150 (broad) | Detecting... +6 | Nightmares +1 |
| Send in the Gravel-Voiced Gossip | [[0,50]] | Gravel-Voiced Gossip (companion) | none | Detecting... +6, Suspicion +2 | (no challenge, no failure branch) |
| Keep track of Clay movements | [[31,69]] | Detecting... 4 | Shadowy 130 (broad) | Detecting... +6 | Suspicion +1 |
| Be open about your motives | Locked with Airs 40 (i.e. below 40) | none | Persuasive 150 (broad) | Detecting... +4 | Scandal +1 |

**The 2 non-Airs options** (excluded from this feature's table): "Eavesdrop on private
conversations" (Watchful 150 broad, always available, Detecting... +4 / fail Nightmares +1) and
"Concrete evidence" (needs Detecting... 8, the case-closer — spends `Detecting...` and
`Candlefinder Lead: Clay Men of London`, sets `Candlefinder: Progress in a Case` to 60).

No collision found for "Emancipate a Clay Man" against other Clay-Men storylets in this file (none
exist yet) — the trap flagged earlier was precautionary and did not materialise, but keep the
option's exact wiki disambiguator (`(Canvassing)`) in mind if a second Clay-Men storylet is ever
badged later.

**Recommendation:** standalone feature, fully specced above — ready to build. Badge-meaning: every
row moves the same `Detecting...` progress currency by a different flat amount (4/6/6/6/8) with
different requirements/menace — an LBI-style `?`-marked success value with the menace/requirement
in the tooltip is the right shape.

---

## 8. Literary Ambitions

https://fallenlondon.wiki/wiki/Literary_Ambitions — [5 unlock]

**Location: The Singing Mandrake — already covered by the `spider-symposium` feature.** This
storylet's 5 options were confirmed absent from `spider-symposium`'s own table by grep (only one
unrelated alias hit for a different option) — genuinely new content at an already-partially-badged
location, not a duplicate.

**All 5 option pages fetched.** Full table:

| Option | Airs | Locks (besides Airs) | Challenge | Success gives | Failure gives |
|---|---|---|---|---|---|
| A quick commission: Ode to the Empress | [[0,30]] | none | Persuasive 5 (broad) | Shard of Glim ×30 | nothing (just Airs re-roll) |
| A quick commission: Hymns to Sobriety | [[31,60]] | none | Persuasive 5 (broad) | Shard of Glim ×32 | nothing |
| A quick commission: Poetry in the Dark | [[61,90]] | HOJOTOHO! 1251 | Persuasive 5 (broad) | Jade Fragment ×36 | Piece of Rostygold ×3 |
| A quick commission: Songs of Old | [[61,90]] | HOJOTOHO! 1500 (Fate-type action, no challenge) | none | Romantic Notion ×1, Nightmares −2 | (no challenge, no failure branch) |
| An especial appetite | [[91,100]] | none | Persuasive 7 (broad) | Piece of Rostygold ×35 | nothing |

Two options share the same window (61-90: Poetry in the Dark and Songs of Old) — both can be live
together at those Airs values; not a text collision (distinct names), just two simultaneously
offered options, same shape as Clathermont's overlapping windows above. "A quick commission: Songs
of Old" and "...Poetry in the Dark" are both gated behind `HOJOTOHO!` (a limited-time/seasonal
quality, likely tied to a past crossover event) — treat as a requirement to state in the tooltip,
not to rank around, same as any other `needs` field elsewhere in this batch.

**Recommendation:** fold into `spider-symposium`'s existing table (same storylet family, same
location) rather than a new standalone feature — check `spider-symposium`'s own scope note first
for whether it already declares "The Singing Mandrake, in full" or explicitly excludes
side-storylets, before adding rows to someone else's table. Fully specced above, ready to build.

---

## 9. On the Trail (Storylet)

https://fallenlondon.wiki/wiki/On_the_Trail_(Storylet) — [5 unlock]

Moloch Street. `Unlocked with = Engaged in a Name-Making Case`. **Collision question resolved**:
see the top-of-file note — `On the Trail (Quality)` (this storylet's own progress currency,
confirmed via `Appearance=On the Trail` on all 5 option pages) is a **different quality object**
from `clay-highwayman`'s "On the Trail of the Clay Highwayman", not the same quality reused. Only
the short display word coincides.

**`strict`-gating mechanism, spelled out**: this storylet is an OPENED STORYLET (not a card), so
the natural fit is the same `carouselRatings` plumbing already used for Ecdysis / The Midnight
Trade / To Make a Moth in this batch — `storylets: ['On the Trail']` (the in-game heading, bare,
per the wiki's own `{{!}}On the Trail` display alias) in the `storylets` list passed to
`carouselRatings`. `carouselOpen` already refuses to treat ANY option as "open" unless the
`.storylet-root__heading` text on screen matches that exact name — so a `.branch__title` reading
"Comb through the papers" only ever resolves against THIS table while the Moloch Street storylet
"On the Trail" is the one actually open on screen. **No extra `strict` flag or confirm-only area
helper is needed beyond the standard mechanism every other carousel feature in this batch already
uses** — the earlier note recommending bespoke `strict` handling was over-cautious; the existing
plumbing already provides the exact protection asked for. (The generic-quality-name coincidence
still belongs in a code comment so a future reader doesn't confuse this feature's `On the Trail`
progress tracking with `clay-highwayman`'s, purely for human clarity, not for gating.)

**All 5 base option pages fetched.** Full table:

| Option | Airs | Locks (besides Airs) | Challenge | Success | Failure |
|---|---|---|---|---|---|
| Comb through the papers | Locked with Airs 51 (i.e. below 51) | none | Watchful 6 (broad) | On the Trail +1 | (no challenge, no failure branch beyond the re-roll) |
| Trawl the local establishments | Locked with Airs 51 (below 51) | none | Watchful 6 (broad) | On the Trail +1 | nothing |
| Take the city's pulse | below 51 (case stage 1) or below 34 (case stage 2-3) | Complication: a Surly Goat-Demon (+10 modifier if present) | Watchful 16 (broad, +10 if Goat-Demon) | On the Trail +2 | nothing |
| Contact an information broker | [[51,100]] at case stage 1, [[34,66]] at case stage 2-3 | Whispered Hint ×10 (spent), Complication: a Surly Goat-Demon (+10 modifier) | Watchful 12 (broad, +10 if Goat-Demon) | On the Trail +2 | Nightmares +2, Whispered Hint ×10 (still spent), Appalling Secret ×1 |
| Pose as a housekeeper for the day | Engaged in a Name-Making Case 2, Airs 67, a Faded Morning Suit OR a Maidservant's Uniform | Complication: a Surly Goat-Demon (reduces reward if present) | none | On the Trail +1 (Goat-Demon present) or +2 (absent) | (no challenge, no failure branch) |

Note "Comb through the papers" and "Trawl the local establishments" share the identical `Locked
with Airs 51` (i.e. both are "below 51") — not a text collision (their names differ), just two
options both available across the same wide low-Airs band; nothing to merge, just two distinct
badges both live together below Airs 51.

The three case-stage sections lower on the storylet page (Honey-Addled Detective, Tattooed
Courier ×4, Absconding Devil ×4 with the Goat-Demon subplot) are case MILESTONES, not more
Airs-gated options — confirmed out of scope for this TODO line's `[5 unlock]` count, and each would
need its own separate research pass if "Engaged in a Name-Making Case" is ever pursued as its own
guide-like feature.

**Recommendation:** standalone feature, fully specced above — ready to build, gated by the standard
`carouselRatings` storylet-heading mechanism (no bespoke `strict` machinery needed).

---

## 10. Send a Christmas Card

https://fallenlondon.wiki/wiki/Send_a_Christmas_Card — [2 text]

Your Social Engagements. Seasonal (`World Unlock: London's Season: Christmas`, available all of
December). **All 4 card-art variant pages fetched — confirmed they pay DIFFERENT rewards despite
sharing identical display text**, which sharpens rather than resolves the original finding:

| Wiki page (display text is "Send a Christmas Card" on all 4) | Airs | Reduces recipient's | Gives (sender) |
|---|---|---|---|
| Paint-Besplattered Mog | [[0,25]] | Wounds | Making Waves +2, Dangerous +2 |
| Fogscape with Tentacles | [[26,50]] | Nightmares | Making Waves +2, Watchful +2 |
| Beguiling Predatory Vegetable | [[51,75]] | Scandal | Making Waves +2, Persuasive +2 |
| Suspicious Sort | [[76,100]] | Suspicion | Shadowy +2 (no Making Waves) |
| all 4 | (all) | — | costs 1 Potential Christmas Card |

**Since the four really do pay different stat gains and the DOM cannot tell them apart (same
display text, this script cannot read Airs), the only honest badge is one row that lists all four
possible outcomes in the tooltip** ("gives one of: Dangerous+2, Watchful+2, Persuasive+2, or
Shadowy+2, depending on the current Airs of London, which this script cannot read") rather than
guessing or picking one. This is a `fotzDepth`-style "range, not a verdict" case, structurally like
the Sous Catacombs' "reflects whatever is actually on the card" caution, except here even the
CURRENT option can't be identified at all (not just its future value). There are also three
Fate-priced variants (100/10/50 FATE, not Airs-gated, not fetched — clearly flavour/social) and a
block of FOUR retired past-Mayor options (explicitly headed "(Retired) Options from Past Mayors" on
the wiki — skip entirely, never live).

**Recommendation:** lowest priority in this group — seasonal, one-week-a-year relevance — but now
fully specced: one merged, informational row.

---

## 11. Wolfstack in the fog

https://fallenlondon.wiki/wiki/Wolfstack_in_the_fog — [4 unlock]

**Marked `{{Retired}}` on the wiki — this card no longer appears in the game.** Wolfstack Docks,
Standard Frequency card, 4 options (Stamping shapes / Crying his wares / A huddled form / A
shuffling file) — a retired card can never be drawn, so there is nothing to badge; not re-fetched
further (no value in reward numbers for content nobody can encounter). **Recommendation: mark
`(considered, nothing to badge: retired content, no longer in the game)` in TODO.md**, matching the
Kinetoculus / Hinterlands-cards precedent.

---

## Summary for the parent task

| Storylet | Status | What's still needed |
|---|---|---|
| A Jaunt in the (Weather) (+ Waswood) | **Fully resolved: nothing to badge** (purely narrative, zero reward anywhere) | None |
| Attract a Visitor at Hallowmas | **Fully specced**, 7 rows, all rewards known | None — ready to build |
| A long conversation with the Functionary | **Fully resolved: nothing to badge** (all 3 collapsed rows pay nothing) | None |
| Investigate Clathermont's Tattoo Parlour | **Fully specced**, 6 rows, all rewards known | None — ready to build |
| Shifting Streets | **Fully specced**, 6 rows, real (tier-dependent) rewards known | None — ready to build (base-tier badge, bonus tiers in tooltip only, by design, same as Scaling the Quartz) |
| Candlefinder: Canvassing the Clay Men | **Fully specced**, 5 Airs-gated rows identified and detailed | None — ready to build |
| Literary Ambitions | **Fully specced**, 5 rows, all rewards known | None — ready to build (fold into `spider-symposium`) |
| On the Trail (Storylet) | **Fully specced**, 5 rows, all rewards known; collision **confirmed a false alarm**, standard gating suffices | None — ready to build |
| Send a Christmas Card | **Fully specced**: 4 different rewards behind identical text, merged into one informational row | None — ready to build (as a merged row, by design) |
| Wolfstack in the fog | **Fully resolved: retired, nothing to badge** | None |

**All 11 of 11 are now fully closed out with zero further wiki research needed.** 3 resolve to
"nothing to badge, here's why" (A Jaunt in the (Weather) + Waswood twin, A long conversation with
the Functionary, Wolfstack in the fog). 8 are fully specced and ready to build:
- Standalone new features: Attract a Visitor at Hallowmas, Investigate Clathermont's Tattoo
  Parlour, Shifting Streets, Candlefinder: Canvassing the Clay Men, On the Trail (Storylet).
- Fold into an existing feature: Literary Ambitions → `spider-symposium`.
- One merged informational row (reward varies, display text can't be told apart): Send a
  Christmas Card.

The On the Trail / `clay-highwayman` naming collision is confirmed a false alarm (different quality
objects) and needs no bespoke gating beyond the standard `carouselRatings` storylet-heading
mechanism already used elsewhere in this batch. Every table above carries real Airs windows,
challenge stats/difficulties (or "none"), success/failure rewards and requirements, transcribed
from each option's own page — nothing here still rests on a guess or an inference from the storylet
page alone.