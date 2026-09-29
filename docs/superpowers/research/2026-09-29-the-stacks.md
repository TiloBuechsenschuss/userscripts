# The Stacks (Guide) — research, second pass

Fetched through the wiki API 2026-09-29: the guide (48 kB), 102 card, option and storylet pages named
in its tables, and 22 more (the book chooser, the reading-room finales, the stage cards, the
Cartographer and Apostate cards). This is the pass `2026-09-27-early-firmament.md` §4 asked for;
that doc's unlock, gating and menace notes still stand and are not repeated. Option pages win over
the guide; where they differ the differences are listed in §3.

Nothing here is in `choice-helper.js` yet (grepped 2026-09-29): line 13770 only badges the storylet that *opens
the way* to the Stacks, and line 37112 records the Sound of Wings cards as untouched.

## 1. What it is, in numbers

A two-phase carousel run from the **card deck**, not a storylet: choose a book on **A Card
Catalogue** (1 action), play cards until *Perusing the Stacks* is 40, play the High Urgency
card *(Apocrypha Found)* (*Claim the book*), play cards until *Finding the Centre* is 40, play
*The Reading Room*, read the book (the finale storylet), then thread back out. Every regular
progress action pays **5**; some pay 1, 10 or 15, or none (§2). What varies from card to card is
not the progress but **what the option costs and risks** (Noises in the Library, Wounds, Nightmares;
Routes, Ontologies, Keys spent) and **what it hands you besides** (Routes, Ontologies, Keys, 40–60
Tantalising Possibility, worth about 0.10 E each, so ×50 is 5 E).

The whole deck is `A Card Catalogue`, the standard and beneficial cards (about 27) and the finale storylets, all with
option titles on the wiki: **titles are not the problem here**, unlike the Fate-locked guides.

## 2. The options, from the option pages

Legend: **P** = progress (into whichever quality is live: *Perusing the Stacks* on stage 1,
*Finding the Centre* on stage 2; a card marked "1 only" or "2 only" is dealt in one stage);
**N** = Noises in the Library; Routes = *Route Traced through the Library*; Ont = *Fragmentary
Ontology*; TP = *Tantalising Possibility*; a challenge is "Broad/Narrow Stat difficulty" as the page
gives it, `+n` a point of the named quality adding n to the stat. Success / failure only when they differ.

**Standard deck**

| Card (frequency) | Option | Needs / cost | Challenge | Success | Failure |
|---|---|---|---|---|---|
| An Atrium | Continue on the same heading | 1 Route | Broad Watchful 220 (+15 per Inerrant, +15 per Route) | P 5 | N +6 |
| An Atrium | Course correct (1 only) | 1 Ont | Broad Watchful 300 (+15 per Ont) | P 5, Routes 1–2 | P 1, N +1 |
| An Atrium | Open a black door (An Atrium) | 1 Key + Apostate | none | P 10, TP 50, hour set to 10 | — |
| A Dead End? | Tie a rope to the railing and descend | clears hand | Broad Shadowy 148 (+1 per Watchful) | P 5 | P 5, Wounds +2, N +1–6 |
| A Dead End? | Take advantage of the vantage point | — | Broad Watchful 350 (+15 per Chthonosophy) | Routes 2, TP 50 | Routes 1 |
| A Dead End? | See through the Cartographer's eyes | Fate | none | Tempestuous Tale ×10 | — |
| A Dead End? | Make a lot of noise | N 3 + Apostate | none | N +4?, Routes 1..N?, Apostate +1 | — |
| A Discarded Ladder | Climb (A Discarded Ladder) | — | Broad Watchful 200 | Routes 1–2 | Wounds +1, N +6 |
| A Grand Staircase | Make an informed decision | 1 Route, clears hand | none | P 5 | — |
| A Grand Staircase | Go up / Go down | only with no Route, clears hand | Luck 50 | P 5 | P 1, N +2 |
| A Locked Gate | Use a key | 1 Key | none | P 15 | — |
| A Map Room | Look for maps of the library | — | Broad Watchful 220 | Routes 1–2, TP 50 | P 1, Nightmares +1, N +1–2 |
| A Map Room | Look for maps of the Neath | — | Broad Watchful 250 | Partial Map ×2 (rare Puzzling Map) | P 1, Nightmares +1, N +1 |
| A Map Room | Get a lead from the Cartographer | Fate | none | P 5, N +2 | — |
| A Map Room | Paint new routes upon maps of the library | Palette of Revealing Pigments | none | Routes 1–2, TP 50 | — |
| A Poison-Gallery | Use furniture as stepping stones | — | Broad Shadowy 240 (+15 per Neathproofed) | P 5 | Wounds +3, N +6 |
| A Poison-Gallery | Prepare an antidote | 1 Flask of Abominable Salts | Narrow Kataleptic Toxicology 10 | P 5 | P 1, Wounds +2, N +1 |
| A Stone Gallery | Make your way through the silent gallery | — | Luck 50 | P 5 | P 5, Nightmares +2 |
| A Stone Gallery | Stop and examine the ancient volumes | — | Narrow Chthonosophy 7 | Ont 1–2 | P 1, N +1–2 |
| A Stone Gallery | Follow a borehole through the back of a bookcase | 2 Routes, hour 3 or 4 | Broad Watchful 300 (+1 per Dangerous) | P 10 | P 5, 1 Route back, N +6 |
| The Grey Cardinal | Offer the cardinal a furry lunch | Rat on a String | none | P 5, Disposition +1 | — |
| The Grey Cardinal | Offer the cardinal a tin of something fishy | Deep-zee Catch | none | P 5, Disposition +1–2 | — |
| The Grey Cardinal | Engage the Cardinal in conversation | — | Broad Persuasive 250 (+10 per Bizarre) | Disposition +1, TP 50 | TP 40 |
| An Index (1 only) | Search for a reference card | — | Broad Watchful 200 (+15 per Inerrant) | Routes 1–3 | Route 1, P 1, N +2 |
| An Index (1 only) | Try to understand the organisation of the library | — | Narrow Chthonosophy 7 | Ont 1–3 | Ont 1, P 1, N +1–2 |
| An Index (1 only) | Situate yourself within the greater whole | 1 Ont, Chthonosophy 3 | none | P 5 | — |
| A Librarian's Office (2 only) | Pick through the drawers | — | Luck 90 | TP 40 + one of Key / Route / Ont | Fin Bones or Deep-zee Catch ×1–10 |
| A Librarian's Office (2 only) | Take the opposite door | — | none | P 5 | — |
| A Librarian's Office (2 only) | Unlock the cart | 1 Key | none | P 15 | — |
| A Flowering Gallery (hours 1–2) | Keep going | — | Narrow Neathproofed 0 (+1 per Inerrant) | P 5 | Nightmares +?, N +6 |
| A Flowering Gallery (hours 1–2) | Eat the fruit of knowledge | — | Narrow Kataleptic Toxicology 12 | Ont 2 | P 1, Wounds +2, N +1 |
| A Black Gallery (hours 3–5) | Light a lantern | — | Broad Shadowy 240 (+15 per Insubstantial) | P 5 | P 5, N +2 |
| A Black Gallery (hours 3–5) | Navigate by alternate senses | — | Broad Watchful 240 (+10 per Monstrous Anatomy) | P 5 | P 1, N +2 |
| A Gaoler-Librarian (N ≥ 1) | Hide and hope it passes you by | — | Broad Shadowy 200 | nothing | P 1, Wounds +4?, N +1 |
| A Gaoler-Librarian (N ≥ 1) | Try to lift one of its keys | — | Broad Shadowy 250 (+15 per Insubstantial) | Key +1 | N +6 |
| A Gaoler-Librarian (N ≥ 1) | An intervention from the Grey Cardinal | 1 Disposition | none | P 5 | — |
| A Terrible Shushing (N ≥ 4) | Find a hiding place | — | Broad Shadowy 220 | N −3 | N −1 |
| A Terrible Shushing (N ≥ 4) | Hurry along | — | Broad Shadowy 295 | P 5, N +2 | P 5, N +4 |
| A Terrible Shushing (N ≥ 4) | Quiet the Cartographer | Fate | none | N −1..10? | — |
| A Gallery of Faces (Apostate) | Sneak through the gallery | — | Broad Shadowy 210 | P 5 (rare 10), N +1–2 | P 1, N +1 |
| A Gallery of Faces (Apostate) | Distract the volumes | — | Broad Persuasive 230 (+15 per Monstrous Anatomy) | Routes 1–3, N +1–3 | N +6 |
| A Solonacean Gallery (Apostate) | Do not read the titles | — | Narrow Steward of the Discordance 5 | P 10 | Wounds +2, N +6 |
| A Solonacean Gallery (Apostate) | Don't go anywhere (A Solonacean Gallery) | 3 Routes | none | P 15, hour re-rolled | — |
| A God's Eye View (Interloper 3, Ont 5) | Try to hold it all in your mind at once | up to 6 Ont | Luck 40 | Chthonosophy +1–2, TP 60 | P 1, TP 40, Nightmares +2–4, N +1–2 |
| A God's Eye View | Focus on the path ahead | 5 Ont, Chthonosophy 5 | none | P 15 | — |
| The Shape of the Labyrinth (2 only, 6 Routes) | Rethink your movements | 2–5 Routes, clears hand | none | P 10 | — |
| The Shape of the Labyrinth (2 only) | Reject the significance of shape | 1 Ont, Chthonosophy 5 | Narrow Chthonosophy 5 | P 5 | P 1, N +1 |

**Beneficial cards (violet)**

| Card | Option | Needs | Challenge | Success | Failure |
|---|---|---|---|---|---|
| A Glimpse through a Window | Stop and look through | not hour 4 | none | TP 50 | — |
| A Glimpse through a Window | Move on quickly | — | none | P 5 | — |
| A Glimpse through a Window | Try to recall— | An Absence equipped, not hour 4 | none | TP 50 | — |
| A Tea Room? | Take a moment to regroup (Tea Room) | — | none | Nightmares −1, Wounds −1 (down to 4), N −1 | — |
| A Tea Room? | Consult your maps of the library | 1 Route | Narrow Route 0 | P 10 | P 5 |
| A Tea Room? | Try to make sense of what you've seen | 1 Ont | Narrow Ont 2 | Chthonosophy +1, TP 50 | 1 Ont back |

**Chooser, stage cards and finales.**

- **A Card Catalogue**: *Look for a copy of the Index of Banned Works, 1899 Edition* (201), *the Annal of Lost Stars*
  (202; a second copy "(no Shepherd)" for when no Shepherd navigator is set), *Le Précipice de la Tombée* (203, Interloper 4),
  *The Book of Proper Speech* (205, Firmament 365), *All of God's Faces* (206, Apostate 6), *a volume of the Encyclopedia
  Nicatoridae* (207, In Procession 20), *A Codex of Unreal Places* (204, Fate), *the Liber Animarum* (99, once, after
  the Infernal Contract), *Turn away from the threshold*. Every one just sets the book.
- **(Apocrypha Found)** → *Claim the book*; **A Chained Volume** → *Unchain it* (1 Key, locked at N 7, N +5–8, book 1001) and
  *Examine this section, then move on*; **The Reading Room, Again** → *Leave the reading room*.
- **The finales** (the reward, no challenge). *Wolfstack Docks?* → *Walk in*: Caustic Apocryphon ×9, TP 35 (≈ 116 E). *A Dim
  Fate* → *Return with one of the carcasses* (Glim-Encrusted Carapace ×1, TP 495, Shard of Glim 400) and *Return with the
  lighthouse-keeper's ledgers and charts* (Roof-Chart ×40). *The Precipice* → *Help those you can* (Anticandle ×10, Fragment
  ×1, Relic ×10, TP 35) and *Grab whatever you can carry* (Anticandle ×10, Tempestuous Tale ×25, Diamond ×5, Relic ×6,
  TP 10). *The Twin Cities* → *Explore while you can* (Crackling Device ×1, Ratwork ×4, Devilbone Die ×4). *A Shattered
  Door* → *Approach the monument* (Apostate exactly 6) and *…once more* (Apostate 7): Night-Whisper, Memory of a Much
  Stranger Self, Caustic Apocryphon, Identity Uncovered ×10, TP 35. *Within the Hollow* (207): its page records no option;
  the guide's reward is Mystery ×7, Nicatorean Relic ×20, Chimerical Archive ×1. The page holds only the storylet.
- **Winding back the Thread** (the exit): *Find your way back to your entrance*, *Return to the Midnight Moon / Zenith / Burgundy /
  the Sous / Queeneater's / Procession*; **Overdue**: *Lose them*, *Escape!*. Pure navigation.

## 3. Where the pages and the guide disagree (pages win)

| Option | Guide | Page |
|---|---|---|
| Continue on the same heading | checks Watchful, Inerrant, Route | Broad Watchful 220; Inerrant and Route each add 15 |
| Course correct | needs Watchful and Ont | Broad Watchful 300; Ont adds 15 |
| Navigate by alternate senses | checks Watchful, Monstrous Anatomy, Inerrant | only Monstrous Anatomy (+10) is listed on the page |
| Try to make sense of what you've seen | "a check based upon your Ontologies" | Narrow Ontology 2 |
| Go up / Go down | "Luck" | Luck 50, and **locked while you hold a Route** |
| Search for a reference card, Try to understand the organisation | failure "1 Progress" | the page has no stage condition on the failure (`Perusing the Stacks 1`); the card is 1-only, so identical |
| Hide and hope it passes you by | — | success has **no** effect recorded (a check that pays nothing) |
| Make a lot of noise | "+? CP" | `N +4?`; Routes scale with the new N |
| Take a moment to regroup | page missing | the game's title is disambiguated `(Tea Room)`; **the same title is already a badged option elsewhere** (`Seven of Loins: Reflection`, `choice-helper.js:23144`); the lookup must key on the card |

The guide's reward table (§ Reward Overview) matches the finale pages item for item. Its Echo and Stuiver
totals are the guide's own estimates, not page facts.

## 4. Traps

1. **Generic titles.** *Take the opposite door*, *Move on quickly*, *Keep going*, *Climb*, *Use a key*, *Go up*, *Go down*, *Hurry along*, *Hide and hope
   it passes you by* are ordinary phrases. None is in another feature's table today (grepped 2026-09-29) except
   *Take a moment to regroup*, which is. Keying on the **card** (a `carouselOpen`/`eachCardName` storylet) is exact and needs no `strict`.
2. **Card heading spelling.** The page's `From Card title` says `A poison-gallery`, the card page says `A Poison-Gallery`;
   `normalizeName` should fold case, but the wiring test must prove it for these two.
3. **Two stages, one option.** The same option pays *Perusing the Stacks* or *Finding the Centre* by stage; the badge says
   "progress" and never the quality. Four options are one-stage only (the `1 only` / `2 only` marks), so the option can look
   useless in the wrong stage. That is the game's, and the tooltip says it.
4. **The `?` cells.** `Nightmares +? CP` (Keep going), `Wounds +4?` (Hide and hope), `N +4?` (Make a lot of noise), `Wounds +?` and
   `N −1..10?` (Quiet the Cartographer) are unread: show a range or `?`, never a number.
5. **Noises is a menace with an autofire at 8** (*WE WILL HAVE SILENCE*: Wounds 8, the Boatman). Eight options add **N +6** (a ninth N +1–6) on
   a failure, so one failure at N 2 is fatal to the run's momentum and two are the Boatman. The script cannot read N (see §6, question 4).
6. **Persistent resources.** Routes, Ontologies, Keys and Disposition survive between runs: an option that *spends* one is not wasting a
   run-local currency (guide, "Items and Qualities").
7. **A Fate/Apostate-gated option needs its requirement in the tooltip**, not a silent rank alongside the free ones (Cartographer: Fate; Apostate: Firmament 705 and Interloper 10).
8. **Two Fate-locked cards remain image-only** (the two Clamorous Cartographer cards, options are pictures): not badged, the same reason as the Fate-locked guides.

## 5. Gating

Card and storylet names as the heading. **Only the game can tell** whether the opened card's `.storylet-root__heading` shows exactly
those titles, and the sidebar greeting inside the Stacks (all the entrance gates return the player to where they entered).
The card names above are the page titles, exact enough for `eachCardName` and the carousel match. No `currentArea()` is needed.

## 6. Badge-meaning recommendation and decisions

Recommended badge: **the option's progress**, `P +5`, `P +10`, `P +15`, or, on options that pay no progress, the thing they do pay
(`Routes +2 · TP ×50`, `Ont +1–3`, `Key +1`, `N −3`). After it, a `▼` for a resource spent (`▼ Route`), `≈` for a Luck challenge,
`?` for a stat challenge, and **the menace in the headline** in `CAROUSEL_COLOR_RISK`: `N +6` on the failure of a check, `Wounds +2`.
The failure and the requirement are in the tooltip in words. The progress-per-action reading matches the guide's own analysis
("cards that grant 5 progress per action"). No EPA is quoted anywhere: the guide's three EPA figures (5.27, 9.94, 6.2–6.3) are
strategy-dependent and disagree.

1. **Panel: none** (decided 2026-09-29).
2. **Scope — the standard deck, the beneficial cards, the book chooser and the finales (recommended)**, vs the deck only (no chooser, no finales).
   Excluded either way: the two image-only Cartographer cards, the exit storylets, *Winding back the Thread* and *Overdue*.
3. **Book chooser — badge each book with its reward and what it needs (recommended)**, e.g. *Index of Banned Works* `≈116 E · s2320`, with the
   reward table in the tooltip; the Echo/Stuiver totals labelled the guide's estimate, or **only the book's requirement**.
4. **Reading N: the script cannot read a menace it has no capture for.** Recommended: state the risk (`N +6` on failure) on the badge and the
   autofire in the tooltip; do not gate on the level. Only if you want the badge to *react* to the level would this need the Myself-tab menace list (unknown markup, so no).
5. **The Apostate and Cartographer options** are badged with their requirement in words, not left out (recommended), or left out.

**Only the game can tell:** the heading of each opened card (the first listed above is *A Dead End?*), the greeting in the Stacks, and
whether a locked option is drawn greyed or hidden.

## 7. Decisions (2026-09-29)

1. Panel: none.
2. Scope: **deck + chooser + finales** (the two image-only Cartographer cards and the exit storylets stay out).
3. Badge: **progress first** (`P +5/+10/+15`; where none, what the option pays), risk headline `N +6`, `▼` spent, `≈` Luck, `?` stat check; no EPA.
4. Chooser: **each book with its reward and requirement** (Echo/Stuiver totals labelled the guide's estimate); Apostate and Fate-gated options **are badged** with the requirement in words.
5. N is not read; the risk is stated, the level is not gated on.
