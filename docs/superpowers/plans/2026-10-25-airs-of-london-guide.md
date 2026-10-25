# The Airs of London guide — Panel, Banked Airs and Outcome Readout Plan

> **For agentic workers:** Steps use checkbox (`- [ ]`) syntax for tracking. Read
> `.claude/skills/adding-fallen-london-features/SKILL.md` before any task, and the existing
> `airs-of-london` feature in `FallenLondon/choice-helper.js` (search `=== feature: The Airs of London`).

**Goal:** Turn [The Airs of London](https://fallenlondon.wiki/wiki/The_Airs_of_London) into a full
guide feature: a panel behind ⚙ UX like the other guides (your numbers, live or banked with their
age, set by hand, a refresh, a filter), the Airs read from the **Plans tab** where possible, the
guide's **notable actions** listed and marked against your Airs, and **the new Airs shown next to
an outcome that changed it**, where the game makes that possible.

**Request (2026-10-25):** "There should be a guide now. With all features of other guides. It
should pull airs, if possible, from the plans page. Guide should list notable actions. Also if
airs change, it should display the new value next to the change if possible." Then: "Panel yes,
rest use your recommendation. Make a skeleton, I'll supply html next."

## Decisions (made 2026-10-25)

| # | Question | Decision |
|---|---|---|
| 1 | Panel behind ⚙ UX? | **Yes** (the user's call). |
| 2 | How to read the Airs from Plans | **`GET /api/plan`** once its reply is captured (read-only, already in api.md's list of endpoints seen). Until then: the Plans tab is read by the same on-screen reader as a storylet, if it draws the same icons. A hidden-frame load of `/plans` is the fallback if the API reply carries no tooltip. |
| 3 | New Airs beside an outcome | Read it **off the outcome page** if the game shows it there (a number, or the flavour text the wiki maps to a range). Only if it does not: **one** `GET /api/plan` read per action, as an opt-in setting. That is one request per action the player takes, not polling, but it is still to be put to the user before it is built. |
| 4 | New badges | **A cavalry officer** and **The Censored Census of 1862** (*Sift through the pages*) now; **Unfinished Business ×4** deferred (PoSI only, about 30 options). |
| 5 | "What's offered now" | The panel's **own transcribed table** of the guide's notable actions (`AOL_NOTABLE`), plus what the six storylets of `AOL_OPTIONS` offer at your Airs. Not an aggregation of the ~22 other Airs features' tables, which use three different window shapes. |
| 6 | Banked Airs on the storylet list (e.g. "Airs 12 · Confound ●" before opening) | **Optional, later.** Not in the skeleton. |

## Status

| Part | State |
|---|---|
| `aolAirsFrom` reads a locked requirement's "(you have N)", and a locked text without it reads as nothing | **done** (wording assumed) |
| Banking: `aolBank` / `aolBanked` / `aolStateFrom`, `fl-ux-aol-airs`, source `storylet` / `plans` / `manual`, one-minute write throttle, `keep` on the feature | **done** |
| Panel `airs-of-london` (`renderAolPanel`): your Airs, set by hand, offered now, notable ranges ●/○, ways to change, filter | **done** |
| Guide data: `AOL_NOTABLE`, `AOL_DEAD_RANGE`, `AOL_CHANGERS` | **done**, cross-checked in the suite against the badge tables |
| Plans tab read (verified) | **waiting on capture A** |
| `GET /api/plan` reader and the panel's Refresh + auto-refresh | **waiting on capture B** |
| New Airs beside an outcome | **waiting on capture C** |
| A cavalry officer badge | **waiting on answer D** |
| Census badge (*Sift through the pages* in *Perusal of Forgotten Pages*) | not started; data in hand |
| Unfinished Business ×4 | deferred |

## What the user is to supply

Every unknown this plan depends on lives in `okf/fallen-london/open-questions.md` (the repo's rule:
unknown things live only there), each with what capture settles it. The letters below are how the
tasks refer to them:

- **A, B, C** — section "The Airs of London: the Plans tab and the outcome page": the Plans tab's
  markup, the `GET /api/plan` reply, and the outcome page after an Airs change.
- **D** — section "The Airs of London: options the guide names": where *A cavalry officer* is and
  its title. The same section holds the Census item's storylet heading and the two guide-versus-page
  disagreements (*Prepare the ground*, *Chat to a Tipsy Spy*).

When a capture settles one, move the fact into the right OKF file, delete the entry there, and tick
the task here.

## Tasks

### Task 1 — Plans tab, verified (capture A)

- [ ] Put the captured markup into `okf/fallen-london/` (a new `plans-tab.md`, OKF front matter,
      every claim labelled) and delete the Plans part of the open question.
- [ ] If the Plans tab uses `.quality-requirement [aria-label]`: nothing to wire; replace the
      ASSUMED comment above `AOL_CACHE_KEY` with the capture's date. If it does not: a
      `aolAirsFromPlansDoc(doc)` reader for the captured selector, called by `aolRatings` when
      `aolSourceHere() === 'plans'`.
- [ ] Pin the captured locked and unlocked `aria-label` texts in `tests/choice-airs-of-london.test.mjs`
      (replace the assumed `You need The Airs of London 76 (you have 42)` case with the real one).

### Task 2 — `GET /api/plan` and the panel's Refresh (capture B)

- [ ] Document the reply shape in `okf/fallen-london/api.md` (endpoint table row "shape not
      studied" → a section like the storylet one).
- [ ] `aolAirsFromPlanJson(json)`: pure; find every quality requirement whose `qualityName` is
      `The Airs of London` and run its `tooltip` (HTML stripped with `TAG_RE`) through `aolAirsFrom`.
      Unit-test it on the captured JSON, trimmed.
- [ ] The API client: Choice Helper has none yet (`ux-enhancers.js` has `FL_API` and the token
      reader, ~line 3499). Carry the minimal GET into Choice Helper **byte-identical** to UX
      Enhancers' and add it to `tests/fl-shared-helpers.test.mjs`, or ask UX Enhancers for it through
      the page window. Token rules from api.md: only to `api.fallenlondon.com`, never logged.
- [ ] Panel: a **Refresh** button ("Read the Airs from your Plans") and the shared auto-refresh
      checkbox, as the Hallowmas panel has; on open, refresh if the banked Airs is not live. One
      request at a time; never on a timer.
- [ ] If the reply carries no Airs (no Airs-gated plan bookmarked), the panel says which plan to
      bookmark, by name, with a wiki link.

### Task 3 — The new Airs beside an outcome (capture C)

- [ ] Record what the outcome page shows in OKF.
- [ ] If it shows a number: a reader for that message, bank it as source `outcome`, and draw
      "→ 42" beside the message (its own class and dataset flag; `attachBadge`'s `value` carries the
      number). Add `outcome` to `AOL_SOURCES`.
- [ ] If it shows the flavour text: transcribe the wiki's `{{Airs table}}` (41 rows, level → text,
      in `raw` form on the page) as `AOL_AIRS_TEXT`, match the shown text exactly, and draw the
      exact level or the range ("→ 1–10"). Bank a range as a range (`lo`/`hi`), not its middle; the
      panel then marks a notable window ● only when the whole range is inside it, `◐` when it is
      partly.
- [ ] If it shows nothing: put decision 3's fallback (one `/api/plan` read after each outcome,
      off by default) to the user before building it.
- [ ] Either way, an outcome page that does not mention the Airs marks the banked value
      "you have acted since" (needs a reliable "an outcome is on screen" signal from the capture).

### Task 4 — New badges (answer D, and the Census now)

- [ ] *Sift through the pages* (storylet *Perusal of Forgotten Pages*, the Census item's action):
      an `aolE('Perusal of Forgotten Pages', 'Sift through the pages', null, { ch: ['Watchful', 150],
      g: [['Proscribed Material', [41, 55]]], fail: { g: [['Proscribed Material', 25]] } })` row, if
      the opened item's heading is that title (an open question in `open-questions.md`). `re: 'both'`.
- [ ] *A cavalry officer*: once its place is known, a row in the matching table (an opportunity
      card goes through `eachCardName`). Airs 50–100, Shadowy 30; success: Nevercold Brass Sliver,
      F.F. Gebrandt's Tincture of Vigour: Half-Full, Map Scrap `floor(0.03 × Shadowy + 3.49)`; rare:
      Tasselled Sword-Cane; failure: Suspicion +1 CP, 3 Cryptic Clues; re-rolls on every outcome.
- [ ] Flip `badged` in `AOL_CHANGERS` / `AOL_NOTABLE` for each; the suite checks it names a feature.

### Task 5 — Optional: banked Airs on the storylet list (decision 6)

- [ ] With a banked (not live) Airs, the six storylets' list headings say "Airs ~12 (last read …)"
      and their tooltip marks ●/○ against it, worded as a past reading. Never on an option inside an
      open storylet: there the game's own icons are the truth.

### Task 6 — Deferred: Unfinished Business ×4

- [ ] Only if asked. Four storylets (Ladybones Road/Watchful 70, Spite/Shadowy 70, Watchmaker's
      Hill/Dangerous 70, Veilgarden/Persuasive 70), about eight options each, all needing A Person
      of Some Importance. Fetch every option page; the storylet pages give only names and items.

### Every task ends with

- [ ] `@version` bump in `FallenLondon/choice-helper.js` and `all-in-one/fallen-london.js`.
- [ ] The block comment after `// ==/UserScript==`, `README.md`'s Choice Helper row, `AGENTS.md`'s
      Airs of London section and its test-list entry.
- [ ] Verify (below).

## Data and sources

From The Airs of London (fetched through the API, 2026-10-25) and the option pages. Where they
disagree the option page wins and the entry's `note` says so.

| Item | Guide | Option page / badge table | Kept |
|---|---|---|---|
| Confound the Constables | Suspicion −4 or −3 "in addition to" 2 Infernal Contracts and 1 Proscribed Material | −3 with them, −4 alone | page |
| Prepare the ground | listed for cycling the Airs through 68–89 | `THIO_OPTIONS` records `re: 'none'` | both quoted; open question in `open-questions.md` |
| Chat to a Tipsy Spy | changes the Airs | the option page lists no Airs change | listed, flagged; open question in `open-questions.md` |
| Confide in the Chandleress | Favours: The Docks +1 for 3 actions | also Dangerous −5 CP | both shown |
| Dice! | Airs 3, 6 … 27 | Airs = Irrigo × 3 | the same rule |

Windows checked by the suite against the badge tables: Confound (0–25), the Widow's audience
(33–67), the Weasel-Seller (76–100), the two dreams (85–100, 95–100), Prepare the ground and
Scout a battlefield (51–100), the duel (26–75), the Chandleress (96–100).

The guide's 68–89 is its "dead range" (`AOL_DEAD_RANGE`): nothing notable, only the
"best of the worst" for moving the Airs on.

## Traps

- **A locked requirement's first number is not your Airs.** "You need The Airs of London 76 (you
  have 42)" is 42. The storylet screen never showed a locked Airs option, so the old reader never
  met one; the Plans tab does.
- **A banked Airs is stale after almost any action.** It is always labelled "last read … ago" and
  never drives an in-storylet badge.
- **Writes on every scan.** `aolRatings` runs hundreds of times; `aolBank` writes only on a change of
  value or source, or after a minute.
- **Rosters.** A new panel changes five suites' rosters (`choice-fruits-of-the-zee`,
  `choice-zailing`, `fl-shared-helpers`, `ux-launcher-docking`; `choice-crowds-of-spite` pins
  features only).

## Verify

```sh
node --check FallenLondon/choice-helper.js
node .claude/skills/adding-fallen-london-features/check.mjs
for t in tests/*.test.mjs; do node "$t" | tail -1; done
node scripts/bump-loaders.mjs --check
```

Then in game: open the ⚙ UX menu → **Airs of London**; open Opportunism in Spite (the Airs is read
and the panel says "Read now, off a storylet"); leave and reopen the panel ("Last read …"); set
the Airs by hand; type in the filter.
