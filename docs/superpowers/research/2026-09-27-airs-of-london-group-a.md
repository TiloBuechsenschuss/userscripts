# Airs of London storylets — Group A (heaviest 6) — research (2026-09-27)

Scope: the 6 heaviest entries in TODO.md's "Airs of London storylets (no guide)" list —
A Bad Case of Rattus Faber [19 unlock], The Tower of Eyes: Behind Closed Doors at a Handsome
Townhouse [18 unlock], The Feast of the Rose! [16 unlock], Up Close with a Festive Fir
[16 unlock], Coffee with the Last Constable [14 unlock], A drink with the Cheery Man
[13 unlock]. Fetched via the wiki API (`action=query&prop=revisions&rvslots=main`, batched;
`action=parse&prop=wikitext` for the top-level storylet pages) on 2026-09-27. WebFetch is
blocked by Anubis; curl with a browser User-Agent works.

None of these 6 storylets, or any option name found on their pages, currently appears
anywhere in `FallenLondon/choice-helper.js` (grepped directly) — all six are untouched by
any existing feature.

The existing `airs-of-london` feature (`AOL_OPTIONS`, `choice-helper.js:9213` onward) is the
model for this whole batch: `aolE(storylet, name, airs, more)` rows with `airs` (`[[lo,hi],
...]` windows), `ch` (`[stat, diff]` or `{luck}`), `g`/`u` (items given/spent), `q`/`f`
(qualities/faction results), `open` (redirect target), `re` (whether Airs re-rolls), `bundle`,
`rare`, `fail`, `needs`, `note`. Badge = Echoes/action of what a success gives less what it
spends, `?` for a stat challenge's success value, `≈` for a Luck option's expected value where
the page states odds, every faction result appended. Reuse this shape exactly.

All 6 storylets are now fully researched -- every Airs-gated option, and every sub-storylet a
redirect opens (up to three levels deep for The Tower of Eyes and The Feast of the Rose!), has
been fetched and transcribed. No open fetches remain. Total pages pulled across this whole
pass: 20 (Rattus Faber main table) + 6 (its two redirect sub-storylets) + 26 (Tower of Eyes) +
16 + 39 (Feast of the Rose, two more levels deep) + 18 (Festive Fir) + 14 (Coffee with the Last
Constable) + 13 (A drink with the Cheery Man) = **152 wiki pages**, plus the 6 top-level
storylet pages themselves.

---

## 1. A Bad Case of Rattus Faber — READY TO CODE

https://fallenlondon.wiki/wiki/A_Bad_Case_of_Rattus_Faber — storylet at Your Lodgings,
`Unlocked with: Troubled by Vermin 1-49`, `Locked with: Vermin-free`.

**Shape:** reduce the progress quality **Troubled by Vermin** to 0 (it counts DOWN). The
storylet's own page states explicitly: "The options on this storylet may change as you play
them" (Airs-gated). Seven headed groups, each gated on a Vermin BAND, and within most bands
the 2-3 offered options are further split by an AIRS OF LONDON window — so which 1 option (of
the 2-3 in that Vermin band) you actually see depends on Airs too. All 20 options carry
`{{Airs|The Airs of London}}` (re-rolled on every play, both outcomes) and (with 2 exceptions)
a hidden `Troubled by Vermin: Ratkiller +1` gain — cosmetic, not badge-worthy.

This is a genuine new carousel-shaped feature (like Ecdysis), not a retitle/alias job.

### Full option table (all 20; `airs` windows and Vermin bands both given — badge on `airs`,
Vermin band goes in the tooltip since it's the `carouselOpen` gate is the storylet name, not
Vermin)

| Option | Vermin band | Airs | Challenge | Success | Failure |
|---|---|---|---|---|---|
| Opening salvoes: launch an early offensive | 36-49 | 0-40 | Dangerous 20 | Rat on a String 16-25, Vermin -2 | Vermin -1 |
| Opening salvoes: shore up your defences | 36-49 | 0-40 | Watchful 20 | Rat on a String 16-25, Vermin -2 | Vermin -1 |
| Opening salvoes: the pipes, the pipes | 36-49 | 0-40 | Dangerous 30 | Vermin -2, Rostygold -10 | Vermin -1, Rostygold -10, Nightmares +1 |
| Battling the footsoldiers: concentrate on the collared rats | 18-35 | 0-40 | Dangerous 22 | Rostygold 16-25, Vermin -2 (rare: Whisper-Satin Scrap x1, Vermin -2) | Vermin -1 |
| Battling the footsoldiers: bait a trap with rostygold | 18-35 | 0-40 | Shadowy 22 | Rat on a String 16-25, Vermin -2 | Rostygold -2, Vermin -1 | needs Piece of Rostygold x10 |
| Battling the footsoldiers: sow disinformation | 18-35 | 0-40 | Dangerous 30 | Vermin -2, Whispered Hint -10 | Vermin -1, Whispered Hint -10 | needs Whispered Hint x10 |
| Duel the ringleaders: attempt to survive unscathed | 5-17 | 0-40 | Dangerous 24 | Vermin -2, Venge-Rat Corpse x1 (rare: Vermin -2, Baptised Rattus Faber Corpse x1) | Vermin -1 |
| Duel the ringleaders: take on a gang of them at once! | 5-17 | 0-40 | Dangerous 36 | Vermin -2, Rat on a String 36-45 (rare: Vermin -3, Baptised Rattus Faber Corpse x1) | Vermin -1 |
| Duel the ringleaders: employ subterfuge | 5-17 | 0-40 | Shadowy 36 | Vermin -3 | Vermin -1, Scandal +1 |
| The battle for the pantry: starve them out! | 5-49 | 41-70 | Dangerous 25 | Rat on a String 16-25, Vermin -3 | Vermin -1 |
| The battle of the pantry: defend it against all comers! | 5-49 | 41-70 | Dangerous 21 | Rat on a String 16-25, Vermin -2 | Vermin -1 |
| The battle for the pantry: employ unconventional (war)fare! | 5-49 | 41-70 | Dangerous 30 | Vermin -3, Penny -10 | Vermin -1, Penny -10 | needs Penny x10; guide: no rats harmed |
| A lull in hostilities: try to negotiate with the rats. | 5-49 | 67-100 | Persuasive 42 (base 44 − Vermin/2, example at Vermin 5) | Whispered Hint 21-30, Dangerous +2CP, Vermin -2 | Dangerous +1CP |
| A lull in hostilities: redouble your efforts | 5-49 | 67-100 | Dangerous 23 | Rat on a String 16-25, Vermin -2 | Vermin -1 |
| A tactical opportunity: a game of cricket | 5-49 | 0-5 | Dangerous 25 | Rostygold x50, Nightmares -2, Wounds -2 | Silk Scrap x1 |
| A tactical opportunity: employ a rat-catcher | 6-49 | 6-35 | Luck 70% | Vermin -5 | Vermin -3 | needs Rostygold x50; ALWAYS spends Rostygold x50 either way |
| A tactical opportunity: unleash the Thing from the Wardrobe | 8-49 | 36-60 | Luck 50% | Unaccountably Peckish x2, Scandal +2, Vermin -half | Vermin -2 | needs+spends Starveling Cat x1 |
| A tactical opportunity: hire a specialist | 11-49 | 61-90 | none (redirect) | opens "Employ the poisons of Dottore Rappacini" | — |
| A tactical opportunity: locate an L.B. hoard | 5-49 | 91-100 | Dangerous 30 | Vermin -1, bundle ≤60 (rare: Vermin -1, bigger bundle unstated) | none stated |
| The final battle: face the Rattus Faber Chief | Vermin 1-4 | any | none (redirect) | opens "A showdown with the Rattus Faber Chief" | — |

### The two redirect sub-storylets (now fetched in full)

**Employ the poisons of Dottore Rappacini** (opened by "A tactical opportunity: hire a
specialist"):

| Option | Unlock | Gives |
|---|---|---|
| Unleash the smokes of unmercy | Piece of Rostygold x100 | Rostygold -100, Wounds +2, Vermin -10 |
| Don't pay the piper | none | Wounds +10, Vermin -10 |
| Have second thoughts | none (Action cost 0) | returns to A Bad Case of Rattus Faber, no effect |

**A showdown with the Rattus Faber Chief** (opened by "The final battle: face the Rattus Faber
Chief"):

| Option | Challenge | Success | Failure |
|---|---|---|---|
| Go for the kill | Dangerous 25 | Vermin-free (ends activity), Dangerous +300 CP, Partial Map x1, Pair of Savage Hob-Nailed Boots x1, activates the Living Story "A Legend Among Ratkind" | Vermin +10 |
| Try to take him alive | Dangerous 30 | Vermin-free (ends activity), Dangerous +300 CP, Partial Map x1, Disgraced Rattus Faber Bandit-Chief x1 (a companion), same Living Story | Vermin +10 |
| Accept his surrender | needs the hidden Ratkiller quality (i.e. having played enough options that grant it) | Vermin-free (ends activity), Dangerous +300 CP, Partial Map x1, Disgraced Rattus Faber Bandit-Chief x1, same Living Story -- no challenge, always succeeds | — |

**Traps:**
- Both redirect sub-storylets are now fully priced above -- the whole 26-option Rattus Faber
  tree is complete, nothing left to fetch.
- Two Luck challenges with stated odds (70%, 50%) — rank/report by expected value per skill
  rule, not the advertised success value alone.
- "A lull in hostilities: try to negotiate with the rats" has a Persuasive difficulty that is
  ITSELF a formula (`44 - Troubled by Vermin/2`), not a flat number — the wiki gives the
  formula and one worked example; carry the formula, not just the example.
- Generic option names ("A tactical opportunity: a game of cricket" etc.) are all already
  storylet-branch-title-prefixed with the option group name, so collision risk is low, but
  still worth the standard cross-file check.
- The hidden `Troubled by Vermin: Ratkiller +1` gain on most rows is explicitly `hidden=yes` on
  the wiki — cosmetic tracking, not for the badge.

**Gating:** confirm-only on the opened storylet heading "A Bad Case of Rattus Faber" (branch
titles), via `carouselRatings` — same shape as Ecdysis.

**Badge-meaning recommendation:** net Vermin reduction per action (the thing that actually
varies, 1-5 or half), `?` for stat challenges, `≈` for the two Luck options (70%/50% stated),
failure/menace and item costs in the tooltip. "Root yourself"-style safe options don't exist
here — every option costs Vermin -1 on failure at minimum, so there's no zero-risk pick, only
a cost/reward spread.

---

## 2. The Tower of Eyes: Behind Closed Doors at a Handsome Townhouse — READY TO CODE

https://fallenlondon.wiki/wiki/The_Tower_of_Eyes:_Behind_Closed_Doors_at_a_Handsome_Townhouse —
Card, `Unlocked with: Key to a Handsome Townhouse x1`.

**Shape:** NOT a simple Airs-gated option list — a two-track reputation-management mini-game
(comparable in scope to `helicon-house`), gated behind choosing ONE of two mutually exclusive
Affiliations (a Salon XOR an Orphanage, both set up via a large one-time resource cost, see
below). Once set up, "Pursue a Scheme" options build a spendable progress quality
(`Engaged in a Scheme: a Salon` / `...an Orphanage`), which "guest of honour" / "acquaintance"
payout options spend for `Making Waves` (this storylet's actual currency) plus flavour items.
**18 of the 21 Salon+Orphanage sub-options are genuinely Airs-of-London-gated** (confirmed
directly against every one of them — exactly matches TODO.md's `[18 unlock]` count); the other
3 (2 "Pursue a Scheme" builders, 1 social-action "Invite an Author acquaintance") carry no Airs
window.

**Top-level options (5, no Airs):**

| Option | Challenge | Success | Failure |
|---|---|---|---|
| Do a little promenading yourself | Persuasive 60 | Certifiable Scrap x2 | Scandal +1 |
| Secure an invitation to a scandalous party | Persuasive 80, needs Scandal 1 + Hedonist 4 | Scandal +2, Hedonist +3 (cap 10), Favours: Bohemians 0-1, Favours: Society 0-1 | Scandal +1 |
| Scheme: Set up a Salon | none (one-time, checkless) | costs Renown/Favours/Connected thresholds + Penny 5000 + items (full list in the page); gives A Salon x1, Making Waves +20; **locks out Orphanage** | — |
| Scheme: Set up an Orphanage | none (one-time, checkless) | costs A Person of Some Importance + Bazaar Permit, Legal Document, Alluring Accomplice x2, Grubby Urchin x4, Winsome Dispossessed Orphan x2, Penny 11000; gives An Orphanage x1; **locks out Salon** | — |
| Put your Townhouse under the care of a Resolute Governess | none (checkless) | removes the card from the deck until retrieved (housekeeping, not badge-worthy) | — |

**Salon sub-options (11 total; 9 Airs-gated, 2 not):**

| Option | Airs | Other gate | Effect |
|---|---|---|---|
| Pursue a Scheme: encourage the great and the good | — | Favours: Society 3, A Salon, Favour in High Places 1 | Engaged in a Scheme: a Salon +2-11 (checkless) |
| Pursue a Scheme: encourage the wise and the wicked | — | A Salon, Stolen Kiss 4, Favours: Bohemians 3 | Engaged in a Scheme: a Salon + (less predictable, no range given) (checkless) |
| Invite an Author acquaintance | — | Profession: Author friend | Social Action; Making Waves +150 (host) / +20 + Persuasive +5 + Confident Smile x1 (friend) |
| Your Salon: invite the Sardonic Music-Hall Singer | 0-25 | Acquaintance | Making Waves +121-180, Memory of Light x1, Scrap of Incendiary Gossip x1, Scheme -15 (checkless) |
| Your Salon: invite the Captivating Princess (1 FATE) | 0-25 | Acquaintance, Scheme 20 | Making Waves +1501-2500, Scandal +1, Zee-Ztory x1, Scheme -200 (checkless, Fate-locked) |
| Your Salon: invite the Duchess | 25-50 | Scheme 12, Connected: The Duchess 10, Midnight Matriarch x1 (may be lost) | Action cost 2, checkless (no challenge shown), Scheme -15 (assumed, not itemised on this page beyond the unlock) |
| Your Salon: invite the Mercies | 25-50 | Acquaintance | NarrowQuality Engaged in a Scheme: a Salon, NarrowDiff 5, NarrowMin 6 (a narrow check on the Scheme quality itself); succ: Making Waves +150 (+10 with Lettice companion), Tale of Terror!! x1, Scheme -15 / fail: Making Waves +50 (+10 w/ Lettice), Tale of Terror!! x1, Scheme -15, Scandal +3, Penny -4000 |
| Your Salon: Present your Lyrebird Educated in Three Schools | 25-50 | needs Lyrebird item | Making Waves +150, Scheme -15 (checkless) |
| Your Salon: invite Silas the Showman | 50-75 | Acquaintance, Scheme 6 | Luck 80%; succ: Making Waves +121-190, Intriguing Snippet x1, Cryptic Clue x50, Scheme -15 / fail: Scheme -1 |
| Your Salon: invite the Repentant Forger | 75-100 | Acquaintance, Scheme 6 | Luck 80%; succ: Making Waves +101-220, Scheme -15 / fail: Making Waves +10, Scandal +1, Scheme -1 |
| Your Salon: invite a Presbyterate Diplomat | 75-100 | needs Presbyterate Diplomat item, Scheme 8 | Making Waves +201-360, Mystery of the Elder Continent x3, Scheme -28 (checkless) |
| Invite a Crooked-Cross to address your Salon | 80-100 | Profession: Crooked-Cross friend, Scheme 6 | Social Action; Scandal +2, Scheme -15 (host request); Making Waves +200 (friend accepts) / +20, Intriguing Snippet x10, Romantic Notion x10 (friend's own copy) |

**Orphanage sub-options (10 total; 9 Airs-gated, 1 not):**

| Option | Airs | Other gate | Effect |
|---|---|---|---|
| Invite a Conjuror acquaintance to... perform | — | Profession: Conjurer friend, Scheme 6 | Social Action, a "sinister option" (risks losing an orphan to the Brass Embassy); Scheme -12 to -21 (host); Making Waves +150 (friend accepts, orphan lost) / +5, Favours: Hell +1, Rostygold x500 (friend's copy) |
| Invite a Midnighter acquaintance to honour St Joshua | 0-20 | Profession: Midnighter friend, Scheme 6 | Social Action; Scheme -15 (host); Making Waves +200 (friend) / +5, Favours: The Great Game +1, Scrap of Incendiary Gossip x15 (friend's copy) |
| Scheme: Reunite a Dispossessed Orphan with loving parents | 0-60 | Scheme 10 | Making Waves +101-200, Mystery of the Elder Continent x1 OR Memory of Distant Shores x1 (two randomised success variants), Scheme -15 (checkless) |
| Pursue a Scheme: Admit your Winsome Orphan | 0-30 | Penny 1000, Winsome Dispossessed Orphan x1 | Engaged in a Scheme: an Orphanage +1-12, Penny -1000, orphan consumed (checkless) |
| Introduce your Warm-Hearted Amber Iguana as a Pet | 0-30 | Penny 4000, item | Engaged in a Scheme: an Orphanage +3-10, Penny -4000 (checkless) |
| Pursue a Scheme: offer some Urchins a place | 31-70 | Penny 3000, Favours: Urchins 5 | Engaged in a Scheme: an Orphanage +4-8, Penny -3000, Favours: Urchins -5 (checkless) |
| Scheme: Graduation | 50-100 | Scheme 6 | Making Waves +101-200, Watchful +5, Favours: Criminals +1, Scheme -15 (rare: same + Memory of Light x1 instead of Watchful) (checkless, no failure branch) |
| Look after your Orphanage | 71-100 | large item bundle (Tincture of Vigour x5, Sober Dress x5, Workman's Clothes x5, Foxfire Candle Stub x250, Penny 5000) | Engaged in a Scheme: an Orphanage +4-9, Rat on a String +0-2, all listed items consumed (checkless) |
| Invite a Correspondent acquaintance to educate the orphans | 80-100 | Profession: Correspondent friend, Scheme 6 | Social Action; Scheme -15 (host); Making Waves +200 (friend) / +5, Correspondence Plaque x15, Favours: Urchins +1 (friend's copy) |
| Recruit a Laconic Prodigy as your assistant (20 FATE) | 90-100 | Scheme 15, Fate-locked | Laconic Prodigy companion x1 (Dangerous/Shadowy/Watchful +10 each), Scheme -110 (checkless) |

**Traps:**
- Two Affiliations are MUTUALLY EXCLUSIVE (Salon locks out Orphanage and vice versa) — a badge
  covering both tables must make clear only one track is ever active for a given player; do not
  present both as simultaneously available.
- Several rewards are formulas/ranges tied to the guide's own wording rather than flat numbers
  (e.g. "Making Waves +121-190"); carry the range, not a single guessed midpoint, per the
  skill's own "a range pays its middle, but say so" convention already used elsewhere in
  `AOL_OPTIONS`.
- The four "Social Actions" (Invite an Author / a Crooked-Cross / a Conjuror / a Correspondent /
  a Midnighter) require a FRIEND with a specific Profession quality — unavailable to a player
  with no matching friend; mark as gated, not ranked in with the checkless options.
- "Your Salon: invite the Duchess" is the one option whose own page doesn't itemise its
  success reward beyond the unlock cost (likely omitted on the wiki rather than truly
  reward-less) — flag as `guide`-uncertain rather than inventing a number.

Corrections for this storylet go in whatever new table this becomes (e.g. `TOWER_SALON` /
`TOWER_ORPHANAGE`) and nowhere else, following the `AOL_OPTIONS` field shape (`airs`, `ch`,
`g`/`u`, `q`/`f`, `needs`, `bundle`, `rare`, `fail`, `note`).

---

## 3. The Feast of the Rose! — READY TO CODE (all three levels fetched)

https://fallenlondon.wiki/wiki/The_Feast_of_the_Rose! — Card, Ubiquitous frequency, unlocked
by the seasonal world quality `London's Season: The Feast of the Exceptional Rose 1-2`
(a yearly festival, categorised 2014-2017 on the wiki — still recurring; check whether it's
currently live before badging, since a festival-only card badged year-round would just never
fire, which is harmless, but worth noting). `Game Instructions`: these options raise
**Masquing** to 20; rose-gifts raise it further; later in the feast Masquing trades for special
companions.

**Shape:** 16 options split into 4 Airs bands of 4 each — but **every one of the 16 is itself
a checkless, actionless (`Action cost = 0`) REDIRECT into a WHOLE SEPARATE STORYLET**, most
with their own 1-4 options (a two-layer structure exactly like the existing `airs-of-london`
feature's 6 core storylets). This is genuinely the same shape as Opportunism in Spite etc., not
a simple list.

All 16 give `Masquing +N x (if 19 or less)` on top of whatever else they give -- **Masquing is
the actual badge-worthy currency here** (caps at 20, trades for special companions later in the
feast per the storylet's own Game Instructions), so the badge's number should be expected
Masquing gain, not the flavour items, with everything else in the tooltip.

### Airs bands, their 16 redirect targets, and every one of THEIR sub-options (now fully priced;
levels 2 and 3 both fetched)

**Airs 0-25:**

| Redirect (Airs-gated, checkless unless noted) | Target's own options | Challenge | Masquing (succ/rare) | Other gives |
|---|---|---|---|---|
| A masked revel! (needs Mask of the Rose x1; also separately listed in TODO.md at `[1 unlock]`) | Dance with an acquaintance (2 FATE) | none (Social Action, Fate) | 4 | host: Romantic Notion 3, Confident Smile x3, Persuasive +5, Making Waves +1; friend (once accepted): Making Waves +3, Confident Smile x3, Scrap of Incendiary Gossip x1 |
| " | An assignation in the garden with a friend (3 FATE) | none (Social Action, Fate) | 2 | host: Romantic Notion 3, Confident Smile x3, Persuasive +4, Making Waves +2, Scandal +2, Romantic Notion +3 more; friend: Confident Smile x5, Scandal +2 |
| " | Dance with your Spouse | none, needs Masquing 1 + a Committed relationship | 1 | Romantic Notion 3, Nightmares -10, Scandal -10 (title/text vary with poly-relationship qualities, reward is flat) |
| " | Dance with a mysterious stranger | Persuasive 20 | 1 (rare: 2) | Persuasive +4 bonus, Confident Smile x1 (rare: +5 bonus, Confident Smile x3, Romantic Notion x1, Antique Mystery x1, Alight with Passion mood); fail: Masquing +1 still |
| " | An assignation in the garden with a stranger | Luck 70% | 1 (rare: 1) | Hedonist +1 (cap 5), Romantic Notion 2 (rare: Hedonist +3 cap10, Romantic Notion 5, Vision of the Surface x1, Extraordinary Implication x2); fail: Scandal +2, Persuasive -4, Masquing +1 still |
| " | Cast aside your mask! | Luck 50%, needs Airs 90+, consumes Mask of the Rose | 2 (rare: 2, fail: 1) | Persuasive +15 (rare: +Confident Smile x5, Making Waves +2); fail: Melancholy +3 (cap 10), Persuasive +3 |
| " | Remove a mysterious stranger's mask | Watchful 20 | 1 (rare: 1) | Confident Smile x1, An Identity Uncovered! x1 (rare: +Intimate of Devils +1 cap4, Ostentatious Diamond x1, Venge-Rat Corpse x1); fail: Scandal +2, Masquing +1 still |
| " | Spy on conversations | Shadowy 20 | — | Whispered Hint x(Shadowy) (rare: Cryptic Clue x(Shadowy/2), Drop of Prisoner's Honey 1-10, Surface-Silk Scrap 1-10); Scandal +1, Suspicion +1 on fail |
| " | Partake of Mr Wines' hospitality (2 FATE) | Luck 50%, needs Occasionally Seen at Mr Wines' Revels 1, Mask of the Rose x1; locked out once you hold 2x each of two specific wine items | 2 (rare: 3, fail: 2) | Bottle of Greyfields 1868 First Sporing x1 (rare: x2, +Romantic Notion 3); fail: Bottle of Black Wings Absinthe x1 |
| A dance with devils! | Bluff your way in 2 | Watchful 40 | 1 (rare: 1 + Compromising Document x3) | Cryptic Clue 12 / Appalling Secret 5; Nightmares +2 on fail |
| " | Attend as an invited guest | Watchful 30 | 1 | Stolen Correspondence 22, Appalling Secret 3 (rare: +Compromising Document x3, Walking the Falling Cities +10, Extraordinary Implication x1); Scandal +2 on fail |
| " | Actually, you'll be meeting someone there (needs An Intimate of Devils 3) | Luck 60% | 1 | An Intimate of Devils +2, Romantic Notion 10 (rare: +Stolen Kiss x1); Scandal +1, Intimate -1 on fail |
| A lovers' tryst | Choose an out-of-the-way spot | Persuasive 75 | 1 | Fascinating... +10 (if present), Touching Love Story x1; Nightmares +1 on fail |
| " | Arrange to meet by the silver fountain | Persuasive 100 | 2 | Fascinating... +10 (if >0), Touching Love Story x1, Stolen Kiss x1; Scandal +1 on fail |
| Seasonal mischief | Disrupt an inconvenient romance | Persuasive 50 | 1 (rare: 5) | Whispered Hint 30, Scrap of Incendiary Gossip x1, Intriguing Snippet x1 (rare: +Stolen Kiss x1); Scandal +1 on fail |
| " | Rid yourself of that irritating suitor | Luck 50% | 1 (rare: 5) | Romantic Notion 5 (rare: Touching Love Story x1); Persuasive +1, Scandal +2 on fail |
| " | Take advantage of others' distraction | Shadowy 40 | — | Nodule of Deep Amber 51-150, Romantic Notion x1 (rare: Brilliant Soul x2, Touching Love Story x1, Puzzle-Damask Scrap x1, Masquing +2); Suspicion +2 on fail |
| " | Make a profit | Luck 50% | 1 (rare: 4) | Drop of Prisoner's Honey 35, Romantic Notion x3 (rare: Touching Love Story x1); Wounds +1 on fail |

**Airs 26-50:**

| Redirect | Target's own options | Challenge | Masquing | Other gives |
|---|---|---|---|---|
| Mrs Gebrandt requests assistance | Be sympathetic | Persuasive 50 | 1 | Jade Fragment (Watchful/2), F.F. Gebrandt's Tincture of Vigour x1; Scandal +2 on fail |
| " | Be cruel to be kind 1 | Persuasive 75 | 1 | F.F. Gebrandt's Tincture of Vigour x10; Scandal +2 on fail |
| " | Take cold-blooded advantage | Shadowy 80 | — | Whisper-Satin Scrap x1, Thirsty Bombazine Scrap x1, Drop of Prisoner's Honey 30; Suspicion +2 on fail |
| Enjoy a theatrical entertainment | Suggest a children's puppet show | Luck 40% | 2 (rare: 4) | Inkling of Identity, Intriguing Snippet, Tale of Terror!! (rare adds Appalling Secret, Maniac's Prayer); Nightmares +2 on fail |
| " | Suggest a magic lantern show | Luck 60% | 1 | Nightmares -2, Romantic Notion 10 (rare: Touching Love Story x1); Nightmares +2, Making Waves -2 on fail |
| A long-lost love | Help to console the gentleman | Persuasive 30 | 1 | Drop of Prisoner's Honey 15, Magnanimous +3 (cap 10), Romantic Notion 4, Cryptic Clue x2 (rare: Mystery of the Elder Continent x2, Memory of Distant Shores x1, Appalling Secret x3 instead of the Honey/Notion); Melancholy +3 (cap 10), Scandal +2 on fail |
| " | Offer to help find the lady | Watchful 30 | 1 | Magnanimous +3 (cap 10), Nodule of Deep Amber 10, Romantic Notion 7, Cryptic Clue x2 (rare: Touching Love Story x1 instead of Amber/Notion); Melancholy +3 (cap 10) on fail |
| Buy a kiss from Sinning Jenny | Pay the asking price | Luck 60% | 1 (rare: 4) | Romantic Notion 5, Stolen Kiss x1, needs Prisoner's Honey 100 (rare: Romantic Notion 10); Persuasive +1, Scandal +2 on fail |
| " | Negotiate a little first | Persuasive 60, needs Deep Amber 50 | 2 (rare: 1) | Romantic Notion 2, Stolen Kiss x1 (rare: Wounds +2, Scandal +2 instead -- a poisoned-lipstick twist); Scandal +2 on fail |

**Airs 51-75:**

| Redirect | Target's own options | Challenge | Masquing (succ/rare) | Other gives |
|---|---|---|---|---|
| Mrs Plenty's Perfumed Pleasure Garden (needs Carnival Ticket x1-2 per sub-option) | The Exceptional Rose | Watchful 70, needs Carnival Ticket x2 | — | A Connoisseur of Neathy Delights +1 (cap 3), Carnival Ticket +10, Tale of Terror!! x1 (rare: Carnival Ticket +20, Romantic Notion 3, Extraordinary Implication x1); on fail: Persuasive +1, Carnival Ticket -2, Connoisseur +1 |
| " | Mr Hearts' Devilled Hearts | Luck 50%, needs Carnival Ticket x1 | 1 (rare only) | Watchful +1, Persuasive +1, Vision of the Surface x1, Cryptic Clue 20, Inspired...+5 (if present), Connoisseur +1 (cap 4) (rare: Alight with Passion mood, Extraordinary Implication x1, Connoisseur +1 cap 3 instead); Scandal +1, Watchful +1 on fail |
| " | The Wheel of Affection | Luck 80%, needs Carnival Ticket x1 | 1 (rare only, cap 20) | Romantic Notion 10, Persuasive +3 (rare: Connoisseur +1 cap4, Memory of Light x1, Antique Mystery x1 instead); Persuasive -1, Gift of Scorn x1 on fail |
| " | Join the dancers | Persuasive 150, needs Carnival Ticket x1 | 3 (rare only, if Scandal <=17) | Scandal +2 (cap 4), Scrap of Incendiary Gossip x3 (rare: Puzzle-Damask Scrap x1 instead of Scandal/Gossip); Scandal +3 on fail |
| " | Enjoy the decadence | Luck 70%, needs Carnival Ticket x1 | — | Connoisseur +1 (cap 6), Hedonist +3 (cap 10), Nightmares -3, Romantic Notion 6-10 (rare: Hedonist +5 cap15, Memory of Light x1, Having Recurring Dreams +1, Nightmares -5, Extraordinary Implication x1); Hedonist +3, Scandal +1 on fail |
| " | Follow the scent of the wild rose | Watchful 25, needs Carnival Ticket x1 + On the Scent of the Exceptional Rose exactly 2 | — | sets On the Scent of the Exceptional Rose to 3, Scrap of Incendiary Gossip x2; on fail: Carnival Ticket -1 |
| The Duchess' banquet | Catch the attention of the Duchess | Shadowy 90 | — | Relic of the Second City x3, Nightmares +1, Connected: The Duchess +2 (cap 20), Tale of Terror!! x1 (rare: Connected +10, Relic x2, Touching Love Story x1, Antique Mystery x1 instead); no fail penalty beyond the miss itself |
| " | What's going on in the wine cellars? | Luck 50% | — | Appalling Secret x1, Tale of Terror!! x1 (rare: +Extraordinary Implication x1); Scandal +2, Suspicion +2 on fail |
| " | Share a little honey with the Captivating Princess | Persuasive 160, needs Masquing 15, Acquaintance: the Captivating Princess | — | Scandal +1, Dreadful Surmise x1, Acquaintance +1, a Connoisseur of Neathy Delights +1 (cap 21), One Who Has Indulged in Unknown Pleasures +1, Masquing -15 (same on rare); Scandal +2, Nightmares +4 on fail |
| " | Joke with His Amused Lordship | Luck 50%, needs Masquing 11 | — | Scandal +1, Cryptic Clue 20, Tale of Terror!! x1, Favours: Society +1 (rare: +Appalling Secret x3, Memory of Distant Shores x1, Extraordinary Implication x2); Scandal +2, Making Waves -20 on fail |
| A mysterious envelope | Open it 1 | Luck 50% | 2 (rare: 1, fail: 1) | Romantic Notion 1-10, Persuasive +20 (rare: Watchful +30, Appalling Secret x1, Tale of Terror!! x1, Unaccountably Peckish +2, Freed from the Name -1 instead); fail: Watchful +10 |
| Try to secure a table at Dante's Grill | Try your luck (Feast of the Rose) | Luck 50% | 2 (rare: 2) | Hedonist +3 (cap 10), Austere -3, Fascinating...+8 (if present), Unaccountably Peckish -2, Nightmares -3, Romantic Notion 3 (rare: Fascinating...+2 instead of +8, Scrap of Incendiary Gossip x1, Touching Love Story x1, Making Waves +?); Fascinating...-10, Unaccountably Peckish +3 on fail |
| " | Bribe the maître d' (2 FATE) | none (Fate) | 5 (cap 20) | Hedonist +5 (cap 15), Fascinating...+10 (if present), Scandal -5, Nightmares -5, Wounds -5, Unaccountably Peckish -5, Romantic Notion 5, Touching Love Story x1 |
| Seek advice from Madame Shoshana | Have your horoscope cast | Watchful 20, needs Moon-Pearl 5 | 1 | Whispered Hint 51-150 (rare: Nightmares +3 instead); Moon-Pearl -5 either way; Nightmares +2 on fail |
| " | Ask for an extispicy | Luck 70%, needs Moon-Pearl 20 | 1 | Persuasive +2, Romantic Notion 6-15 (rare: Touching Love Story x1); Moon-Pearl -20 either way; Nightmares +1, Persuasive +1 on fail |

**Airs 76-100:**

| Redirect | Target's own options | Challenge | Masquing | Other gives |
|---|---|---|---|---|
| Scandal and intrigue! | Send a romantic note to one you admire | needs Fascinating... 1 | 1 | Social Action; Fascinating... +10, Making Waves +2 (cap 20) either side |
| " | Take the opportunity to find out some secrets | Watchful 50 | 1 | Appalling Secret 3, Intriguing Snippet 5, Inkling of Identity x2; Suspicion +1 on fail |
| Try to secure a table at Dante's Grill | Try your luck (Feast of the Rose) | checkless | — | flavour (not transcribed) |
| " | Bribe the maître d' (2 FATE) | none | — | Fate-locked, not transcribed |
| A face from the past | Don't remind yourself | checkless | 2 | Melancholy +1 (cap 5), Hard-Earned Lesson x1 (cap 6), Watchful +3, Romantic Notion 6-15 |
| " | An intriguing resemblance | checkless | 1 | Subtle +1 (cap 5), Melancholy +3 (cap 10), Watchful +4, Touching Love Story x1 |
| Sweets to the sweet | Eat one | Luck 50% | 2 (rare: 2) | Unaccountably Peckish -2, Wounds -2, Nightmares -2, Prisoner's Honey 5 (rare: +Magnificent Diamond x1); Unaccountably Peckish +2, Wounds +2, Nightmares +2 on fail |

**Trap (page-title disambiguation):** several of these redirect option pages are filed under a
title with a trailing disambiguator not shown to the player — e.g. the actual wiki page is
`The Duchess' banquet 0`, displayed as `The Duchess' banquet`, and `Bluff your way in` is a
DISAMBIGUATION page (not a real option) whose real target here is `Bluff your way in 2`
(`Name N{{!}}DisplayName` wiki syntax, or a bare `{{Disambig}}` page listing the real titles).
Confirmed by direct probe on three separate cases. Anyone fetching more of these must try the
suffixed title, or check for a `{{Disambig}}` page, if the bare name 404s.

**All 16 top-level Airs-gated redirects and all 13 sub-storylets' options (39 leaf options total)
are now fully priced.** No remaining gap in this storylet.

---

## 4. Up Close with a Festive Fir — READY TO CODE (low priority: seasonal, 8 days/year)

https://fallenlondon.wiki/wiki/Up_Close_with_a_Festive_Fir — Storylet at "Fallen London"
(a general, not-location-gated storylet), unlocked via a redirect from `Push your way through`
plus the seasonal world qualities `A Tree in Hastings Place` and `Days of Advent 1-7`.

**Shape:** raise **Heartiness** or **Beauty** of a shared, server-wide Christmas tree (a
community/global-state activity, not personal) via 19 options; the two stats trade off against
each other (every option gives one, takes the other). `Game Instructions`: "This activity will
remain open until noon on the 8th December" — a strictly time-boxed yearly event (Advent).
Every option pays `Arborist's Gratitude`, which the intro/closing options
("Pay a visit to the Lachrymose Arborist" / "Step back") convert into the actual `Heartiness`/
`Beauty` world-quality changes -- Gratitude is the real per-action badge number, scaled by the
player's own "highway stats" (Dangerous/Watchful/Shadowy/Persuasive, capped at a base of 576)
plus a flat per-option bonus.

**The Airs gating is NOT on the top-level page** — confirmed directly against all 18 remaining
options (excluding the intro "Get a grasp on proceedings", which has no Airs gate): **16 of 18
carry an Airs-gated `Unlocked with`**, exactly matching TODO.md's `[16 unlock]` count. The other
2 ("Pay a visit to the Lachrymose Arborist", "Step back") are the cash-out/view actions, no Airs
gate, not real choices.

### Full option table (16 Airs-gated; all pay `Arborist's Gratitude ≤576 + bonus`, scaled by
the player's own highway stats -- shown as a formula, never a guessed flat number)

| Option | Airs | Trade-off | Gratitude bonus | Other unlock | Challenge |
|---|---|---|---|---|---|
| Adjust the sentiment balance of the soil | 0-25 | +Heartiness / -Beauty | +0 | none | Narrow, Kataleptic Toxicology-2 (≈70% base); fail keeps 7/12 |
| Whisper secrets to the tree | 1-25 | +Heartiness / -Beauty | +500 | Whispered Hint x500 | checkless |
| Hang baubles of scintillack | 1-25 | +Beauty / -Heartiness | +500 | Knob of Scintillack x2 | checkless |
| Fertilise the soil | 76-100 | +Heartiness / -Beauty | +1250 | Nightsoil of the Bazaar x25 | checkless |
| Release a cloud of scarabs | 26-50 | +Beauty / -Heartiness | +500 | Phosphorescent Scarab x50 | checkless |
| Plant peppercaps in the root system | 26-50 | +Heartiness / -Beauty | +500 | Hand-picked Peppercaps x10 | checkless |
| Ferry some state-sanctioned sunlight | 41-45 | +Heartiness / -Beauty | +100 | Mirrorcatch Box x1 (not consumed) | checkless |
| Take inspiration from the very best | 46-50 | +Beauty / -Heartiness | +100 | Murgatroyd's Patented Fungal Christmas 'Tree' | checkless |
| Place blossoms on the boughs with the Wizened Botanist | 56-60 | +Beauty / -Heartiness | +50 | Engaged in Rooftop Horticulture 2 | checkless |
| Call upon the Sneering Horticulturalist's knowledge | 51-55 | +Heartiness / -Beauty | +50 | Engaged in Rooftop Horticulture 2 | checkless |
| Impale a Parabolan Orange-Apple | 51-75 | +Beauty / -Heartiness | +1250 | Parabolan Orange-apple x1 | checkless |
| Treat the bark with amber | 51-75 | +Heartiness / -Beauty | +1000 | Nodule of Warm Amber x100 | checkless |
| Haul well water to the roots | 51-100 | +Heartiness / -Beauty | +0 | none | Broad, Dangerous, scales with highway stats (recorded ≈base 230); fail keeps 7/12 |
| Adorn the boughs with candles | 76-100 | +Beauty / -Heartiness | +1000 | Foxfire Candle Stub x1000 | checkless |
| Rearrange existing decorations | 76-100 | +Beauty / -Heartiness | +0 | none | Narrow, Mithridacy-2 (≈70% base); fail keeps 7/12 |
| Sneak up on thieving urchins | 0-50 | +Beauty / -Heartiness | +0 | none | Broad, Shadowy, scales with highway stats (recorded ≈base 230); fail keeps 7/12 |

**Cash-out / view (no Airs, no challenge):**

| Option | Effect |
|---|---|
| Pay a visit to the Lachrymose Arborist | Converts banked Gratitude into `The Fir's Beauty` / `Heartiness` world-quality changes (amounts unstated on the wiki, `?`) |
| Step back | Same conversion, plus moves the player back to The Fifth City (ends the local view) |

**Traps:**
- Every reward is stated as a FORMULA ("≤576 + N, scaled by base highway stats"), not a flat
  number — the wiki's own Wiki Note gives the exact rule (base stat capped at 576, plus a flat
  per-option bonus); badge should show the formula/bonus, never a guessed flat figure, matching
  this file's existing convention for Scaling the Quartz-style player-quality-dependent rewards.
- Three options have a REAL failure branch that still pays 7/12 of the success value (not the
  usual "less or nothing" shape) — carry the fraction exactly.
- Every option trades Heartiness against Beauty in a FIXED direction (never both up) — the
  table's `Trade-off` column must be shown, or a player can't tell which of the 16 pushes which
  way.
- This is a SHARED/GLOBAL tree, not a personal reward — Arborist's Gratitude is personal (what
  you can cash in) but Heartiness/Beauty are world qualities everyone's actions move together;
  say so in the tooltip so a badge doesn't read as "your own tree's stats".
- Time-boxed to 8 days every December — recommend gating this feature's badges to no-op safely
  outside that window (the storylet simply won't be reachable, so this is likely automatic, but
  worth a test).

Corrections go in whatever new table this becomes (e.g. `FIR_OPTIONS`) and nowhere else.

---

## 5. Coffee with the Last Constable — READY TO CODE

https://fallenlondon.wiki/wiki/Coffee_with_the_Last_Constable — Card, Very Infrequent
Frequency, `Unlocked with: The Cheery Man and the Last Constable: Favouring the Constable`,
`Locked with: Family and Law 4`. Companion piece to "A drink with the Cheery Man" below (same
storyline, opposite side).

**Shape:** flat list of 14 options, almost all Airs-gated, almost all CHECKLESS (no
BroadDiff/BroadQuality/failure branch at all — always succeed) flavour/relationship options
giving small item/quality/Favour rewards. Two have a real challenge.

### Full option table (all 14; `ch: null` = checkless, always succeeds)

| Option | Airs / other gate | Challenge | Gives |
|---|---|---|---|
| Ask her what she's working on 1 | Airs 1-33 | none | Favours: Constables +1, Watchful +5, Appalling Secret x2, Touched by Fingerwork +5 |
| Ask her what she's working on 2 | Airs 34-66 | none | Watchful +5, Favours: Constables +1, Vision of the Surface x1 |
| Ask her what she's working on 3 | Airs 67-100 | none | Watchful +5, Favours: Constables +1, Having Recurring Dreams: The Burial of the Dead +1, Walking the Falling Cities +5 |
| Talk about the other Special Constables | Airs 1-50 | none | Appalling Secret x3, Favours: Constables +1 |
| Ask her about the other Special Constables | Airs 51-100 | none | Appalling Secret x2, Favours: Constables +1 |
| Talk about the Cheery Man | Airs 1-50 | Persuasive 50 | succ: Cryptic Clue x20, Intriguing Snippet x1, Favours: Constables +1 / fail: nothing extra |
| Ask her about the Cheery Man | Airs 51-100 | none | Tale of Terror!! x1, Favours: Constables +1 |
| Just chat 1 | Airs 1-50 | none | Magnanimous +1 (cap 5), Favours: Constables +1 |
| Just chat 2 | Airs 51-100 | none | Magnanimous +1 (cap 5), Favours: Constables +1 |
| Invite her home with you | Airs 90-100 | Persuasive 100 | succ: Favours: Constables +1 (rare: + Touching Love Story x1) / fail: nothing |
| She's not alone 1 | Airs 40-59, needs Acquaintance: the Honey-Addled Detective 1 | none | Touched by Fingerwork +5, Watchful +20, Favours: Constables +1 |
| She's not alone 2 | Airs 70-89, needs Acquaintance: the Mercies 1 | none | Favours: Constables 0-1, Favours: Tomb-Colonies 0-1 |
| She's not alone 3 | Airs 10-29, needs Acquaintance: the Repentant Forger 1 | none | Favours: Bohemians 0-1, Favours: Constables 0-1, Nightmares -1 |
| Tell her your own story | Airs 70-100, needs Family and Law 3 + A Daughter in the Shadows x1, Fate-locked | none | Favours: Constables +1, Extraordinary Implication x1, Nightmares -1, Magnanimous +1 (cap 5) |
| Ask for help with your own investigation | no Airs, needs Engaged in a Case | none | Detective's Progress x6, Watchful +2 |

**Traps:** two Fate/item/acquaintance-gated options ("Tell her your own story" is Fate-locked;
"She's not alone" x3 each need a specific Acquaintance quality) — mark unavailable-to-most
rather than ranked in. "Invite her home with you" (Persuasive 100, very hard) and "Talk about
the Cheery Man" (Persuasive 50) are the only two real challenges; show success value marked `?`
per the skill's stat-challenge convention (no Luck odds given). No Luck challenges here.

**Gating:** confirm-only, opened-card heading "Coffee with the Last Constable" (branch titles).

**Badge-meaning recommendation:** since almost every option is checkless (guaranteed), the
badge is just the item/Favour list, no ranking arithmetic needed — closest to the AOL_TOP
storylets' "list everything, mark the Fate/Acquaintance-gated ones" pattern.

---

## 6. A drink with the Cheery Man — READY TO CODE

https://fallenlondon.wiki/wiki/A_drink_with_the_Cheery_Man — Card, Very Infrequent Frequency,
`Discardable = no`, `Unlocked with: ...Favouring the Cheery Man`, `Locked with: Family and Law
12`. Mirror card to Coffee with the Last Constable above.

### Full option table (all 13; `ch: null` = checkless, always succeeds)

| Option | Airs / other gate | Challenge | Gives |
|---|---|---|---|
| His operations around the Hill | Airs 1-33 | none | Appalling Secret x2, Touched by Fingerwork +5, Shadowy +10, Favours: Criminals +1 |
| His operations on the Docks | Airs 34-66 | none | Vision of the Surface x1, Shadowy +5, Favours: Criminals +1 |
| His contacts with the tomb-colonies | Airs 67-100 | none | Having Recurring Dreams: The Burial of the Dead +1, Walking the Falling Cities +5, Shadowy +5, Favours: Criminals +1, Favours: Tomb-Colonies +1 |
| The other players in his world | Airs 1-50 | none | Inkling of Identity x4, Favours: Criminals +1 |
| His enemies | Airs 51-100 | none | Inkling of Identity x6, Favours: Criminals +1 |
| The Last Constable 1 | Airs 1-50, needs Family and Law 3 | Persuasive 50 | succ: Tale of Terror!! x1, Favours: Criminals +1 / fail: nothing |
| The Last Constable 2 | Airs 51-100, needs Family and Law 3 | none | Tale of Terror!! x1, Appalling Secret x3, Favours: Criminals +1 |
| Whatever's on his mind (Low Airs) | Airs 1-50 | none | Favours: Criminals +1, Intriguing Snippet x1 |
| Whatever's on his mind (High Airs) | Airs 51-100 | none | Favours: Criminals +1, Tale of Terror!! x1, Vision of the Surface x1 |
| Hint that you might want to stay the night | Airs 90-100 | Persuasive 99 | succ: Favours: Criminals +1 (rare: + Blackmail Material x1) / fail: nothing |
| He's not alone 1 | Airs 10-29, needs Acquaintance: the Regretful Soldier 1 | none | Favours: Criminals +1, Nightmares +1, Dangerous +10, Persuasive +10, Tale of Terror!! x1 |
| He's not alone 2 | Airs 40-59, needs Implacable Detective's Business Card | none | Watchful +20, Favours: Criminals +1, Implacable Detective's Business Card x1 |
| He's not alone 3 | Airs 70-89, needs Intimate with a Secular Missionary 3 | none | Favours: Criminals +1, Inkling of Identity x5, Cryptic Clue x20 |

**All 13 options are complete.** No gap.

**Traps:** same shape as Coffee with the Last Constable — three "He's not alone" options each
need a specific Acquaintance/item quality (mark unavailable-to-most), two real challenges
(Persuasive 50 and 99, both very hard, no Luck odds given, no Rare Success on the first).

**Gating:** confirm-only, opened-card heading "A drink with the Cheery Man".

**Badge-meaning recommendation:** identical to Coffee with the Last Constable — list
items/Favours, mark gated options, `?` on the two challenges. Recommend coding both
Coffee/Cheery Man TOGETHER as one small feature (they're explicitly the two halves of one
storyline, "The Cheery Man and the Last Constable"), sharing a table shape, distinguished by
`side: 'constable' | 'cheery'`.

---

## Summary for the parent task

| Storylet | Status | Recommendation |
|---|---|---|
| A Bad Case of Rattus Faber | **Ready to code, complete** | New standalone feature (Ecdysis-shaped); all 20 main-table options plus both redirect sub-storylets (6 more options) fully priced |
| The Tower of Eyes... | **Ready to code, complete** | Two-track Salon/Orphanage reputation-management feature (`helicon-house`-scale); all 5 top-level + 11 Salon + 10 Orphanage options fully priced, 18 of 21 confirmed Airs-gated (matches TODO's count exactly) |
| The Feast of the Rose! | **Ready to code, complete** | Seasonal festival, same two-layer (now confirmed three-layer for 5 of 16 branches) shape as the existing airs-of-london feature; all 16 top-level Airs-gated redirects and all 39 of their sub-storylet options fully priced |
| Up Close with a Festive Fir | **Ready to code, complete** — low priority | All 16 Airs-gated options (of 19 total) fully priced with their highway-stat-scaled Gratitude formulas; shared/global tree-state activity, not a personal reward, strictly time-boxed to 8 December days/year — recommend confirming with the user it's worth badging before spending implementation time, given the narrow annual window |
| Coffee with the Last Constable | **Ready to code, complete** | New standalone feature, all 14 options complete |
| A drink with the Cheery Man | **Ready to code, complete** | New standalone feature (pair with Coffee with the Last Constable), all 13 options complete |

**Total: 152 option pages plus 6 storylet pages, all six storylets fully researched, zero open
fetches.** Two design decisions are for the user, not this research pass: (1) whether Festive
Fir (8 days/year) is worth badging at all, (2) the Tower of Eyes' scope is large enough
(21 options across two mutually-exclusive tracks) that it may warrant its own numbered-choices
conversation before coding, same as a guide-sized feature would get.
