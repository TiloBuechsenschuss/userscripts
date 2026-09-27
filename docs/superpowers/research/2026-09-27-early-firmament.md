# Early Firmament guides — research

Fetched 2026-09-27 via `https://fallenlondon.wiki/w/api.php?action=parse&...&prop=wikitext&format=json&formatversion=2`
(Anubis blocks WebFetch; curl with a browser User-Agent works). Source for every number below is
the **guide page's own wikitext** (quoted verbatim from the API response) unless noted; individual
card/option pages have **not yet been cross-checked** against the guide's tables (per the
adding-fallen-london-features skill, option pages win where they disagree — that pass is still
open and must happen before any table below is treated as final for badge text).

No panel is being built for any of these four (user decision, applies to all ten guides in this
batch): badges on cards/storylet headings/branch titles only.

---

## 1. Ecdysis (Guide)

https://fallenlondon.wiki/wiki/Ecdysis_(Guide) — [Hallow's Throat]

### What it is

A repeatable carousel (storylet `Ecdysis: One More Lesson`, reached via **The Path to the Spleen**
in Hallow's Throat after a one-time unlock chain). Two progress qualities:

- **Preparing for Ecdysis** — 0→21 CP, the "how far through this cycle" counter.
- **Bodily Tendency** — randomised 1–100, decides which end reward is reachable.
- **Bodily Reshaping** — secondary quality (0–3) gating which Boons stack.

Each round ends with a choice: a fixed monetary/item payout, or one of five Boons (temporary,
until next Season) gated on the `Bodily Tendency` value reached.

### Unlock chain (one-time, narrative — not badge material)

Roof access → Lung and Spleen 2 → Persuasive 180 (with Twilit Smuggler 10) or Persuasive 240 +
200 Stuivers, in The Arms → Ascended Ambergris → give to the Resculptor → first (tutorial) round
only allows the cash-out ending.

### Building-progress options (per Preparing for Ecdysis tier)

**Tier 1** (`Preparing for Ecdysis` 0, costs 1 action) — all three unlocked by `Bodily Tendency`
range, no challenge, always +2 CP, always randomises `Bodily Tendency`:

| Option | Unlocked at Bodily Tendency | Success |
|---|---|---|
| Will your heart to slow | 1–41 | +2 CP, Tendency randomised |
| Close your eyes | 20–80 | +2 CP, Tendency randomised |
| Feel your breathing | 70–100 | +2 CP, Tendency randomised |

All three are equally good (same cost, same CP, same effect) — they only differ in which
`Bodily Tendency` band unlocks them, so **at most one is ever offered at a time** in practice
(the guide doesn't say the game shows more than one). No ranking needed here; a badge would just
confirm "+2 CP" and note the Tendency shift is random.

**Tier 2–3** (`Preparing for Ecdysis` 2–3, 4–7 actions):

| Option | Unlocked | Challenge | Success | Failure |
|---|---|---|---|---|
| Allow your blood to cool | Tendency 1–40 | Shapeling Arts + Chthonosophy 16 | +2 CP, Tendency lowered | +2 CP, Nightmares +1 (cap 7) |
| Listen to your humours | — | Shapeling Arts + Watchful/50 16 | +2 CP, Tendency randomised | +2 CP, Nightmares +1 (cap 7) |
| Assert the mind's dominance over the body | Tendency 60–100 | Shapeling Arts + Dreaded/2 16 | +2 CP, Tendency +3..+8 | +2 CP, Nightmares +1 (cap 7) |
| **Root yourself in place** (always available, safe) | — | Chthonosophy 8 | **+1 CP** (1 less than the others) | +1 CP |

**Tier 4–5** (`Preparing for Ecdysis` 4–5, 4–11 actions):

| Option | Unlocked | Challenge | Success | Failure |
|---|---|---|---|---|
| Reimagine yourself as something alarming | Tendency 1–51 | Monstrous Anatomy + Shapeling Arts 18 | +3 CP, Tendency −3..−7 | +3 CP, Wounds +1 (cap 7) |
| Reimagine yourself as something unpredictable | Tendency 20–80 | Kataleptic Toxicology + Shapeling Arts 18 | +3 CP, Tendency randomised | +3 CP, Wounds +1 (cap 7) |
| Reimagine yourself as something malleable | Tendency 50–100 | Shapeling Arts 14 | +3 CP, Tendency +2..+7 | +3 CP, Wounds +1 (cap 7) |
| **Root yourself in place** (always available, safe) | — | Chthonosophy 8 | +2 CP | +1 CP |

The guide doesn't give tables for every tier up to 21 CP (it stops documenting explicit tiers
after 4–5) — **gap**: need the option pages or later guide sections/subpages to fill tiers 6+ if
they exist, or confirm the pattern repeats. Flag this as open before writing the full table.

### Cash-out reward (always available)

"Emerge as a freshly-made self" — total {{S}}320 + {{e}}37.5 of items, valued {{e}}53.5:
Memory of a Much Stranger Self ×1 (e12.5, unsellable), Direful Reflection ×1 (e12.5), Emetic
Revelation ×1 (e12.5, convertible to Cryptic Clue), Antique Mystery ×1 (e12.5), Tempestuous Tale
×7 (e3.5, unsellable), Wounds −1, Nightmares +1 (cap 7).

### Boon rewards (alternative to cash-out, gated on Bodily Tendency + Bodily Reshaping)

| Option | Bodily Tendency | Bodily Reshaping | Boon | Effect |
|---|---|---|---|---|
| Open your eyes | 1–20 | <3 | Wide-Eyed | Watchful +5, Reshaping +1 |
| Sharpen yourself | 21–40 | <2 | Sharpened | Dangerous +5, Dreaded +1, Reshaping +2 |
| Obscure some of your bones | 41–60 | <2 | Partially Boneless | Shadowy +5, Insubstantial +1, Reshaping +2 |
| Smile | 61–80 | <3 | Radiant Bearing | Persuasive +5, Reshaping +1 |
| Refashion yourself into something more malleable | 81–100 | 0 | Hallow Vessel | Shapeling Arts +1, Reshaping +3 (also Nightmares +1) |

Boons last until the next Season (Time, the Healer). Cannot hold two of the same, cannot exceed
Bodily Reshaping 3.

### Traps

- **Root yourself in place is the only always-safe option** and appears at every tier with a
  slightly worse success CP (matches the skill's "safe option costs 1 less CP" pattern already
  seen elsewhere — same shape as other menace-heavy carousels in this codebase). A badge must say
  this in words, not just colour: it is the "no menace" choice at a real cost.
- **Menace gain is capped** (Nightmares/Wounds cap at 7 in this activity) — the guide explicitly
  says high-menace players should tank rather than avoid, which cuts against a naive "avoid the
  menace option" badge. The badge's number should be net CP progress per action, with the
  menace-cost noted in the tooltip rather than penalising the score, since menace is capped and
  recoverable.
- **Bodily Tendency drift is a real cost dimension** distinct from CP: an option that "increases
  Tendency by 3–8" versus "randomises" versus "lowers by 3–7" only matters if the player is
  steering toward a specific Boon. A pure cash-out player should ignore Tendency entirely (guide
  says so directly). This means **the badge's meaning is context-dependent on player goal**,
  which the game can't tell us — recommend two badge numbers or a `?` for Tendency effect, with
  CP/action as the primary number (matches "cashing out" being the guide's own recommended
  default path when goal is unknown).
- Tiers past 4–5 are not in the guide table — needs the option pages (or the guide's edit history/
  talk, or a `/Tables` subpage — none was found via the API's category probe; a subpage check
  should be run: `Ecdysis (Guide)/Tables` etc. returned nothing when tried implicitly, worth an
  explicit `action=query&list=search` or a direct fetch to confirm it doesn't exist).

### Gating

No verbatim in-game greeting captured for Hallow's Throat. Recommend **confirm-only** gating
(`inHallowsThroat`-style helper analogous to `inZee`/`inPortCarnelian`) until a greeting is
captured. "Hallow's Throat" itself is distinctive enough it's unlikely to need `strict`, but
option titles like "Root yourself in place" and "Close your eyes" are generic English phrases —
if any other storylet reuses them, alias/`strict` treatment applies (needs a name-collision check
against the existing `choice-helper.js` tables, which is a wiring-time step, not a research one).

### Badge-meaning recommendation

**Net CP progress toward the 21-CP cycle per action**, i.e. success CP shown plain (2 or 3 for the
risk options, 1–2 for Root yourself in place), with the failure CP and menace cost in the tooltip.
Rank the risk options above Root yourself in place when their challenge is easy for the player
(the game doesn't tell us the player's stats, so this can't be computed — recommend NOT computing
a win probability, just showing "+N CP (safe: +N−1)" per the skill's rule about not quoting a coin
flip when only one side's odds are unknown, i.e. these are stat challenges, not Luck challenges —
show the success value and mark it, don't guess success chance). Tendency drift shown as a
secondary badge mark (`▲`/`▼`/`↻` for increase/decrease/randomise) since it only matters for
Boon-seeking players.

---

## 2. The Midnight Trade (Guide)

https://fallenlondon.wiki/wiki/The_Midnight_Trade_(Guide) — [The Midnight Moon]

### What it is

A repeatable carousel on the storylet **The Midnight Trade**. Progress quality `Peligin Work`
(0→5 CP ends a shift). Two randomisers determine which 2 of 8 options are on offer at any time:
`Airs of the Leviathan` (0–100) and `Smuggled Airs` (0–100). Every option played rerolls **both**
randomisers, so which pair is available is not fully player-controlled round to round.

### Options (this table is complete — the guide gives a single flat table, all 8 rows)

| Option | Randomiser range | Challenge | Bonus | Success | Failure |
|---|---|---|---|---|---|
| Haul supplies to the Midnight Moon | Airs of the Leviathan 0–33 | Dangerous 200 | Inerrant +15 | Peligin Work | Peligin Work, Wounds +1 |
| Maintain the candle-guides | Airs of the Leviathan 34–67 | Watchful 200 | Inerrant +15 | Peligin Work | Peligin Work, Nightmares +1 |
| Offload your duties onto the Once-Dashing Smuggler (Rose companion) | Airs of the Leviathan 50–70 | none | n/a | Peligin Work, Tempestuous Tale +0–2 | n/a |
| Shuttle contraband through the stalactite | Airs of the Leviathan 68–100 | Zeefaring 13 | Inerrant +1 | Peligin Work | Peligin Work, Nightmares +1 |
| Load contraband onto departing dirigibles | Smuggled Airs 0–33 | Dangerous 200 | Inerrant +15 | Peligin Work | Peligin Work, Nightmares +1 |
| Conduct Old Resurrection's personal work (Fate + Rose companion) | Smuggled Airs 20–40 | none | n/a | Peligin Work, Tempestuous Tale +2 | n/a |
| Negotiate with visiting captains | Smuggled Airs 34–67 | Mithridacy 11 | Inerrant +1 | Peligin Work | Peligin Work, Wounds +1 |
| Perform maintenance | Smuggled Airs 68–100 | Watchful 200 | Neathproofed +15 | Peligin Work | Peligin Work, Nightmares +1 |

**Every option gives the same Peligin Work progress on success AND on failure** — the guide
doesn't give a differing CP amount per option (unlike Ecdysis). The only real differences are:
challenge stat/difficulty, which menace it risks on failure (Wounds vs Nightmares vs none), and
the two checkless companion options that add `Tempestuous Tale` instead of running a challenge.

### Reward (at Peligin Work 5, "end your shift")

Memory of Moonlight ×1, Ascended Ambergris ×1, Crate of Incorruptible Biscuits ×2, Basket of
Rubbery Pies ×2, Zee-Ztory ×2, Memory of Light ×2. Guide values this at ~e27.05/round (e12 +
s301), 4.51 EPA — note the guide itself says Stuivers convert to Echoes badly, and recommends
splitting actions with a separate high-Stuiver activity (Stacks or an Upper River activity) if the
player only wants currency, i.e. this activity's main draw is the two named items, not raw EPA.

### Traps

- Because success reward doesn't vary by option, **there is nothing to rank by payout** — the
  only badge-worthy distinction is difficulty/risk (which stat, how hard, which menace on
  failure) and whether a challenge exists at all (the two companion options are checkless and
  always succeed).
- Both checkless options require a `{{FontRose}}` companion equipped ("Offload...", "Conduct Old
  Resurrection's..."); the second also needs Fate. Per the skill's "do not badge a line the player
  cannot take" rule, these should only rank as available when the relevant companion is confirmed
  equipped — this needs a DOM capture of how companions show up (unclear if `choice-helper.js` can
  read equipped companion from the page at all; flag as open question, default to showing them
  with a note rather than gating them out incorrectly).
- The `200`-difficulty challenges (Dangerous/Watchful 200) are very high broad checks — likely
  near-guaranteed fail for most players without heavy investment; a badge should probably surface
  the raw difficulty number since we can't read the player's stat.
- Airs of the Leviathan and Smuggled Airs are **not** the "Airs of London" quality from the TODO's
  Airs-of-London retitle list — different randomiser, no relation, no alias/CAROUSEL_PLACEHOLDER
  concern here.

### Gating

No captured greeting for The Midnight Moon. Confirm-only gating recommended.

### Badge-meaning recommendation

Since payout doesn't vary by option, the badge's number should be **challenge difficulty** (the
raw threshold, e.g. "Dangerous 200" or "Zeefaring 13"), colour-ramped cheap→expensive like
`zeeColor`, with the failure menace as a shape mark (a Wounds vs Nightmares glyph) and a distinct
mark for the two checkless options (e.g. `✓` "always succeeds"). This mirrors `bestZeeLine`'s
logic (cost is what varies, not reward) more than Port Carnelian's (net-gain) logic.

---

## 3. The Kinetoculus (Guide)

https://fallenlondon.wiki/wiki/The_Kinetoculus_(Guide) — [no area]

### What it is

A **purely narrative** activity — the guide states explicitly, twice, in bold: *"Currently this
activity only has narrative rewards. There are no items or economic rewards from doing it."* The
player picks a lens (Telescopic/Wide-Angle, persists across rounds) and a film emulsion colour
(Cosmogone/Violant/Peligin, consumed per round, costs 200 Stuivers + gives a small flavour item:
Vision of the Surface / Romantic Notion ×5 / Memory of Distant Shores respectively — these three
starting items are identical regardless of location, so they don't vary by choice of location
either), then travels to a Roof location to shoot, then returns to develop. Each of 8 roof
locations × 2 lenses = 16 distinct "films" (narrative text only, documented on separate
`Develop the reel...` pages this guide links but doesn't tabulate content from).

### Recommendation: no badge

There is nothing that "pays" here in the sense the skill means — every emulsion costs the same
200 Stuivers and gives a fixed, non-competing flavour item; every lens/location combination is a
narrative branch, not a reward to rank. This matches the pattern already accepted elsewhere in
TODO.md's Reference section ("Location-specific cards in the Hinterlands (Guide) — considered,
nothing to badge: a matrix of which card is dealt at which station"). **Recommend marking this
guide `(implemented; nothing to badge: purely narrative, no economic or comparable rewards)`
without writing any code for it**, rather than forcing a badge onto a choice that has no wrong
answer.

If the user disagrees and wants *something* (e.g. a reminder badge that a chosen lens/emulsion
combo hasn't been filmed at a given location yet, to help a completionist track which of the 16
combos remain), that would need a capture of the actual storylet DOM (which option text distinguishes
already-filmed combos) — not available from the wiki alone. Flagging as an open question rather
than guessing a selector.

---

## 4. The Stacks (Guide)

https://fallenlondon.wiki/wiki/The_Stacks_(Guide) — [The Stacks]

### Scope warning

This is by a wide margin the most complex of the four — comparable in scope to `discordant-studies`
or the Airs-of-London feature already in the codebase, not a small badge addition. It has ~25
distinct cards, several dozen options, conditional card unlocks (Fate-locked Clamorous
Cartographer content, Graven Apostate content), a hidden "Hour in the Library" state machine
gating which cards can appear, and 10 different end-book rewards with wildly different values.
**Recommend treating this as its own dedicated planning pass** (own numbered choices to the user,
own plan section) rather than folding it into the same design decisions as the other three —
it genuinely needs the individual card/option pages fetched (the guide's own numbers already
disagree with themselves in places — e.g. "Not all options pay the same" analysis section vs. the
raw reward table — and the skill's rule is that option pages win, which for ~25 cards means ~25+
page fetches this pass did not do).

### What's usable now (guide-level, unlock and structure — reliable, narrative/gating, not badge numbers)

- Unlocked via Firmament storyline; entry storylet **The Bone Gate** in The Midnight Moon at
  Firmament 200 (later: The Basalt Gate/Zenith at 365, The Garden Gate/Risen Burgundy at 510, The
  Reliquary Gate/The Sous via Beneath the Utmost Grave 20, The Bloody Gate/Queeneater's Castle at
  Firmament 1004, The Vertiginous Gate/Procession).
- Two-phase carousel: `Perusing the Stacks` (0→40) then `Finding the Centre` (0→40), tracked via
  `In Search of Lost Time` (1 then 2). At 40/40 a `High Urgency` card fires to advance the phase;
  the closing card `The Reading Room` lets the player read the book chosen via `Apocrypha Sought:`.
- `Noises in the Library` is the activity's own menace (autofires **WE WILL HAVE SILENCE** at 8,
  setting Wounds to 8 and sending the player to the Boatman — this is a real "don't do this"
  threshold a badge should flag prominently if any option pushes Noises).
- Persistent-across-visits resources: `Route Traced through the Library`, `Fragmentary Ontology`,
  `Library Key`, `Disposition of the Cardinal` — these carry between Stacks visits, unlike most
  carousel currencies, which affects any "cost" ranking (an option costing a Library Key isn't
  wasting a resource that resets).

### Reward table (from the guide's own "Reward Overview" section — flat statement, not yet
cross-checked against each `Look for a copy of...` option page; treat as a first draft)

| Apocrypha Sought: | Option | Items | Total value | Stuiver value |
|---|---|---|---|---|
| 99 (Liber Animarum) | — | lose Your very own Infernal Contract; Judgements' Egg ×1; Storm-Threnody ×1 | e75 (+ up to e312.5 re-selling soul) | — |
| 201 (Index of Banned Works) | Walk in | Caustic Apocryphon ×9; Tantalising Possibility ×35 | e116 | s2320 |
| 202 (Annal of Lost Stars) | Return with one of the carcasses | Glim-Encrusted Carapace ×1; Tantalising Possibility ×495; Shard of Glim ×400 | e113.5 | s2240 (+e4 non-convertible Glim) |
| 202 (Annal of Lost Stars) | Return with the lighthouse-keeper's ledgers and charts | Roof-Chart ×40 | e100 | s2000 |
| 203 (Le Précipice) | Help those you can | Anticandle ×10; Fragment of the Tragedy Procedures ×1; Relic of the Fifth City ×10; Tantalising Possibility ×35 | e116 (needs Mausoleum Stalls) | s570 (+e87.5 non-convertible) |
| 203 (Le Précipice) | Grab whatever you can carry | Anticandle ×10; Tempestuous Tale ×25; Magnificent Diamond ×5; Relic of the Fifth City ×6; Tantalising Possibility ×10 | e116 (needs Mausoleum Stalls) | s570 (+e87.5 non-convertible) |
| 204 (Codex of Unreal Places, Fate-locked) | — | Oneiromantic Revelation ×1; Storm-Threnody ×2; Puzzling Map ×1; Volume of Collated Research ×6; Tantalising Possibility ×10 | e116 | s20 (+e115 non-convertible) |
| 205 (Book of Proper Speech) | Explore while you can | Crackling Device ×1; Ratwork Mechanism ×4; Devilbone Die ×4 | e116.1 (needs Risen Burgundy to sell Ratwork Mechanisms) | s1000 |
| 206 (All of God's Faces) | A Shattered Door | Night-Whisper ×1; Memory of a Much Stranger Self ×1; Caustic Apocryphon ×1; An Identity Uncovered! ×10; Tantalising Possibility ×35 | e116 | s570 |
| 207 (Encyclopedia Nicatoridae) | Within the Hollow | Mystery of the Elder Continent ×7; Nicatorean Relic ×20; Chimerical Archive ×1 | e116 | s0 |
| 1001 (A Chained Volume, rare, ≤1/10 runs) | any | Glimpse of Anathema ×1 | e312.50 | s6250 |

Every regular book converges on ~e116 total value — the real differentiators the guide calls out
are: how much of that is Stuiver vs. hard-to-convert items, whether a location (Mausoleum Stalls,
Risen Burgundy, Bazaar) is needed to realise the value, and the outlier Chained Volume at e312.50.

### Traps found (guide-level; a full pass needs the option pages)

- **Guide's own EPA claims disagree by section** — "5.27 EPA" in Average Run Strategy, "9.94 EPA"
  in Theoretical maximum, "6.2–6.3 EPA" cited from a third-party Monte-Carlo sim. These are
  strategy-dependent, not contradictions to "fix," but a badge must not quote a single EPA number
  as if it's the true value — same caution as Port Carnelian's cross-check discipline.
- Several success/failure cells are literally `+? CP` in the wiki's own table (e.g. "Make a lot of
  noise", "Navigate by alternate senses" is fine but "Keep going" on A Flowering Gallery reads
  `Nightmares +? CP`) — the skill's "an unread input shows a range, `?`, or manual control" rule
  applies directly; these must not be badged as a hard number.
- Fate-locked content (Clamorous Cartographer cards/options) and companion-locked content (Graven
  Apostate) must be excluded from a free-to-play ranking or marked distinctly, same as the
  Font-Rose/Font-Fate options in Midnight Trade above.
- Several option titles are extremely generic ("Move on quickly", "Take the opposite door", "Hide
  and hope it passes you by") — high collision risk with other storylets; every one of these needs
  the cross-file "no name in two tables" check at wiring time, and likely `strict` gating.
- The reward table's Stuiver values carry footnotes for alternate sale locations (Markets of
  Burgundy, Midnight Market, Mausoleum Stalls) that change the effective value — a badge's tooltip
  needs to state the base assumption plainly (skill step 8: "the tooltip is the whole argument").

### Gating

The Stacks entrance storylets are area-agnostic (playable from multiple locations, returning the
player to wherever they entered) — gating here is likely better done on **being inside the Stacks
sub-area** (a distinct in-game state) rather than on `currentArea()`'s outer-location greeting,
which is a different mechanism than the other three guides in this batch. No greeting captured
either way; needs its own in-game check before any gating stronger than confirm-only.

### Recommendation

Defer The Stacks to a follow-up planning pass with its own set of numbered choices (panel
question already answered "no" by the user, but scope/cards-in-scope/badge-meaning still need a
dedicated decision given the size) once the ~25 card/option pages have been fetched and
cross-checked against this guide's numbers.
