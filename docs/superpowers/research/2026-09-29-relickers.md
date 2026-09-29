# The four Relicker cards — research

Fetched through the wiki API 2026-09-29: the four card pages, all 47 option pages named on them
(the two shared "Recertify" titles are disambiguation pages; their subpages `… 1` = Coquettish and
`… 2` = Capering were fetched too), `Certifiable Scraps (Guide)` and its `/Table` subpage.
Option pages win over the guide; the guide's table is the cross-check.

Nothing here is in `choice-helper.js` yet. `someone-is-coming` badges a *different* card
(*A Gift from the Capering Relicker*); no option name below is in any table (grepped 2026-09-29).

## 1. What it is

Four opportunity cards, each "Very Infrequent", each unlocked by one stat at 25. They trade
**Certifiable Scrap** (the currency; sources in the guide: lodging cards, Urchin favours, …) for goods.

| Card (page title = the name the game shows) | Stat | Deals in |
|---|---|---|
| The Capering Relicker and Gulliver are Outside in the Street | Persuasive 25 | infernal goods (Souls … Prince of Hell) |
| The Coquettish Relicker and Mathilde are Making the Rounds | Dangerous 25 | cloth scraps (Silk … Veils-Velvet) |
| The Curt Relicker and Montgomery are Moving Quietly Past | Shadowy 25 | gossip and blackmail |
| The Shivering Relicker and Pinnock are Trundling By | Watchful 25 | screams and secret things |

Each card has the same shape: **8 trades** (tiers 1–8), **3 recertify** gambles, and 1–2 extras.
Options are gated by the same stat at a rising level: 25 / 50 / 75 / 100 / 125 / 150 / 175 / 200.

## 2. The trades (from the option pages)

Tiers 1–4 are a 50 % Luck challenge with three outcomes: success, rare success (success + one
extra item of the *next* tier's ware) and failure (a quarter of the goods). Tiers 5–8 are fixed,
no challenge. "Airs" = `{{Airs|The Airs of London}}` on the outcome, i.e. the option re-rolls the
Airs (`random`); **unlock** = the option needs that Airs value to be shown.

| Tier | Scraps | Stat | Success / failure quantity |
|---|---|---|---|
| 1 | 5 | 25 | 100 / 25 Souls · 200 / 50 Silk · 50 / 12 Proscribed Material · 100 / 25 Primordial Shriek |
| 2 | 15 | 50 | 80 / 20 of each ware |
| 3 | 30 | 75 (Whisper-Satin: **70** on its page) | 42 / 10 of each ware |
| 4 | 100 | 100 | 20 / 5 of each ware |
| 5 | 120 | 125 | 3 of each (no challenge) |
| 6 | 160 | 150 | 1 of each |
| 7 | 680 | 175 | 1 of each |
| 8 | 3200 | 200 | 1 of each |

| Tier | Capering (Persuasive) | Coquettish (Dangerous) | Curt (Shadowy) | Shivering (Watchful) |
|---|---|---|---|---|
| 1 | Souls · rare Amanita Sherry | Silk · rare Surface-Silk | Proscribed Materials · rare Inkling of Identity | Primordial Shrieks · rare Maniac's Prayer |
| 2 | Amanita Sherry · rare Brilliant Soul | Surface-Silk · rare Whisper-Satin · **Airs 3+** | Inklings of Identity · rare Incendiary Gossip | Maniac's Prayers · rare Correspondence Plaque · **Airs 1+** |
| 3 | Brilliant Souls · rare Muscaria Brandy | Whisper-Satin · rare Thirsty Bombazine | Incendiary Gossip · rare Identity Uncovered · **Airs 3+** | Correspondence Plaques · rare Aeolian Scream |
| 4 | Muscaria Brandy (+ Approaching the Gates of the Garden +5 CP on success and rare) · rare Brass Ring | Thirsty Bombazine · rare Puzzle-Damask · **Airs 3+** | Uncovered Identities · rare Blackmail Material | Aeolian Screams · rare Storm-Threnody |
| 5 | 3 Brass Rings | 3 Puzzle-Damask | 3 Blackmail Material | 3 Storm-Threnodies |
| 6 | Bright Brass Skull | Parabola-Linen | Diary of the Dead | Night-Whisper |
| 7 | Coruscating Soul · **Airs 3+** | Ivory Organza | Intriguer's Compendium (Airs +3) | Starstone Demark |
| 8 | "something secret" (Reported Location of a One-Time Prince of Hell) · **Airs 3+** | Veils-Velvet | Rumourmonger's Network | Breath of the Void |

(Only the marked cells carry an Airs gate on their page.)

Guide cross-check (`/Table`, sell value in Echoes, guide's own estimate):

| Tier | Guide sell value | Guide E per scrap | Page check (value ÷ scraps) |
|---|---|---|---|
| 1 | ~1.2 | 0.24 | 0.24 ✓ |
| 2 | ~5–5.25 (8 success · 8.5 rare · 2 failure) | 0.33 | 0.33–0.35 ✓ |
| 3 | ~13–14 (21 · 23.5 · 5) | 0.43 | 0.43–0.47 ✓ |
| 4 | ~32 (50 · 62.5 · 12.5) | 0.32 | 0.32 ✓ |
| 5 | 37.50 | 0.31 | 0.31 ✓ |
| 6 | 60–62.50 | 0.38 | 0.38–0.39 ✓ |
| 7 | 312.50 | 0.46 | 0.46 ✓ |
| 8 | 1560 | 0.49 | 0.49 ✓ |

The guide's four columns share one sell value per tier (it rates the tier, not the ware).

## 3. The other options

| Card | Option | Requires | Effect |
|---|---|---|---|
| all four | recertify some / a whole armful / a double-armful | 5 / 10 / 20 scraps | 50 % Luck: **+5 / +10 / +20 scraps**, else **−4 / −8 / −18** (gains and losses come from the same action; the guide reads it as ≈ +0.5 / +1 / +1 scrap per action) |
| Capering | Recertify an armful | 10 scraps | as above, Airs +3 |
| Capering | Recertify a double-armful | 20 scraps | as above + **Walking the Falling Cities +10 CP** on success |
| Curt | recertify some / armful / double-armful | 5 / 10 / 20 | Airs +5 / random / +3 on success; +3 on failure |
| Shivering | recertify an armful | 10 scraps + **Airs 1+** | none |
| Capering | A droll pastime | — | Luck 60: Dark-Dewed Cherry ×1, failure Wounds +2 CP |
| Coquettish | Tell the Coquettish Relicker your woes | Scandal 3 | Luck 60: Scandal −3 CP, failure Scandal +1 CP |
| Curt | Ask the Curt Relicker to help with matters of law and suspicion | Suspicion 3 | Luck 60: Suspicion −3 CP, failure +1 CP |
| Shivering | Invite the Shivering Relicker in for a chat | A Scholar of the Correspondence 1 and Nightmares 3 | Luck 60: Nightmares −3 CP, failure +1 CP |
| Curt | Meet the Face-Tailor on his rounds | **Fate**, The Face Trade exactly 29 | Scrap +1–4, Suspicion −3 CP |

## 4. Traps

1. **Two option names are on two cards.** *Recertify an armful of scraps* and *Recertify a
   double-armful of scraps* belong to both Capering and Coquettish (the wiki disambiguates them as
   `… 1` / `… 2`, which is the wiki's title, not the game's). The lookup **must key on the card**, and
   the two entries differ (Capering's double-armful pays Walking the Falling Cities +10 CP; the
   armful re-rolls the Airs +3 on one card only). The generic *some / armful / double-armful* names on
   Curt and Shivering are each unique.
2. **The shape repeats four times.** Every tier-*n* option pays a different ware on each card, so a
   lookup by tier alone is wrong; name matching by card + option name is exact and needs no aliases.
3. **No option is retitled.** Three pages carry a `{{Variant table}}` (Rumourmonger's Network,
   Veils-Velvet, Surface-Silk), but each varies the *Success text* (Ambition: Bag a Legend! /
   Nemesis), not an option title, so no `aliases` and no placeholder wildcard is needed (checked
   against skill step 5). Success titles like *Who?* and *Something of a past* name the result.
4. **Whisper-Satin: page says Dangerous 70, guide 75.** Take the page (70); keep the guide's 75 in a
   note. Every other tier matches its stat ladder.
5. **Airs gates are not readable.** Six trades need an Airs value (3+ or 1+) the script cannot read;
   the game hides or greys the option. The tooltip states the requirement in words; no badge is
   invented for a locked line beyond the standing one.
6. **Recertify is a coin flip with a net expectation.** The badge must quote the expectation
   (`≈ +0.5` / `+1`) and both outcomes, not just the advertised gain.
7. **A Luck challenge with a stated 50 %:** rank on expected value, mark `≈` (skill "coin flip").
   Tiers 5–8 have no challenge and no mark.
8. **Fate option** (Face-Tailor): the Fate item is its entry ticket, but it also needs The Face Trade
   exactly 29; say so.

## 5. Gating

The gate is the opened card's own name (`eachCardName` for the hand, `.storylet-root__heading` for
the opened card) and the option text, never `currentArea()`: the cards are dealt in any area. Each
option is only reached through its card, so no `strict` is needed. The card names are the wiki page
titles, the game's card names, and are long and unique. **Only the game can tell us:** whether the
opened card's `.storylet-root__heading` shows exactly that title (the existing card features rely
on it, so it is expected).

## 6. Badge-meaning recommendation

One number per option, on the badge:

- **Trades (tiers 1–8):** Echoes per scrap, `≈ 0.24 E/scrap`, from the guide's sell-value column
  (it cross-checks against the pages above and is the number that varies by tier: 0.24 for tier 1,
  peaks at 0.49 for tier 8, and dips at tiers 4–5 at 0.31–0.32, which is the finding worth
  showing). Marks: `≈` on the four luck tiers. The ware and quantity are in the badge text
  (`Soul ×100`), the failure and rare outcomes in the tooltip. A tier with a locked Airs range gets `▾`
  only if the option is visible; the tooltip names the requirement.
- **Recertify:** `Scrap +5 / −4 ≈ +0.5` (expected scraps), with the Airs effect and the Capering
  double-armful's Walking the Falling Cities +10 CP in the tooltip and the badge.
- **Menace reducers:** `Suspicion −3 CP ≈` (Luck 60: a failure adds 1).
- **Face-Tailor:** `Scrap +1–4 · Suspicion −3 CP`, requirement in the tooltip.

Colour: reuse `CAROUSEL_COLOR_PAYOUT` for trades, `CAROUSEL_COLOR_PROGRESS` for recertify,
`CAROUSEL_COLOR_NEUTRAL` for menace reducers. Shape carries the meaning (`≈`, `▾`, sign), so nothing
depends on hue.

## 7. Decisions for the user

1. **Badge number for the trades — Echoes per scrap (recommended)** vs the raw quantity only. The
   guide's E/scrap is a sell-value estimate, not a game number: say so in the tooltip.
2. **Scope — all 4 cards, all options (recommended)**, including the menace reducers and the
   Face-Tailor, vs trades and recertify only.
3. **Recertify: quote the expectation (recommended)** vs the advertised gain.
4. **Locked Airs options:** badge them anyway with `▾` and the requirement in words
   (recommended), or leave them unbadged when the game does not show them.
5. **Panel:** none (decided 2026-09-29).

**Only the game can tell:** that the four cards' headings match the wiki titles, and whether the
locked (Airs-gated) options are shown greyed or not at all.

## 8. Decisions (2026-09-29)

1. Trades: badge = **ware and quantity only**, no Echo-per-scrap figure. The guide's sell values stay
   in the tooltip as the guide's estimate (with the E/scrap column), never on the badge.
2. Scope: **all options** on all four cards.
3. Recertify: quote the expectation (recommended default; not asked separately).
4. Airs-gated trades: **badge with `▾` and the requirement in words** in the tooltip.
5. Panel: none.
