# Saved-outfit shortcuts for "Optimize equipment": requirements

Status: **draft for discussion** (2026-11-24). Feeds a later plan in `docs/superpowers/plans/`.
Script: `FallenLondon/ux-enhancers.js`, features `equipment-optimizer` and `equipment-helper`.

## 1. Goal

Make the "Optimize equipment" button cheap in the common case. When a saved outfit already holds
the right gear, the button should switch to it with one outfit change. Today it plans and then
equips item by item.

Three additions:

1. **Stat outfits.** If the action tests one stat and an outfit named after that stat exists, the
   button uses that outfit.
2. **Temp outfits as a cache.** An outfit whose name starts with `temp` can be overwritten by the
   script. A calculated optimum is stored in a temp outfit, under a name that encodes the stats it
   was calculated for (`tempGlaWat`). The next action that tests the same stats switches to it.
3. **"Empty outfit" button** on the Possessions tab. It takes off everything that can be taken
   off. If the outfit is a temp with a stats suffix, the suffix is removed first, so an emptied
   outfit is never taken for an optimum.

### Where the time goes (read before choosing options in section 6)

This has not been measured in the game. From the code:

- **Calculation** is the exact search in `optimizeOutfit`, which works on a few dozen items. It
  should take milliseconds. It is very unlikely to be what makes the button feel slow.
- **Reading** is three sequential calls, one of them `GET /api/character/myself` (about 350 KB).
- **Applying** is the slow part. Each swap is a click on the Possessions tab and a wait. The run
  goes there and back, and falls back to the API plus a full page reload.

So the gain comes from replacing N swaps with one outfit switch, not from skipping the
calculation. That leaves room to switch to a saved outfit **and** still check it with the
calculation at almost no cost (option B in section 6).

## 2. Terms

| Term | Meaning |
|---|---|
| Saved outfit | One of the game's outfits, `character.outfits[]` = `{ name, selected, type, id }`. |
| Stat outfit | A saved outfit whose name matches one challenge stat (R1.2). The script reads it and never changes it. |
| Temp outfit | A saved outfit whose name starts with `temp` (R2.1). The script may overwrite and rename it. |
| Free temp | A temp outfit with nothing after `temp`. Its contents mean nothing. |
| Key | The set of stats an action's challenges test, as a set of codes (R2.2). |
| Code | A short fixed name for a stat, e.g. `Wat` for Watchful (R2.3). |

## 3. What the repo already knows, and what it does not

Known (from `okf/fallen-london/api.md` and `equipment.md`, captured 2026-09-26):

- K1. `GET /api/character/myself` → `character.outfits` lists saved outfits as
  `{ name, selected, type, id }`.
- K2. `POST /api/outfit/change {"outfitId": n}` switches to a saved outfit and replies with the
  new outfit (`slots`, `isSuccess`).
- K3. The outfit reply had `maxOutfits: 4`. If that is the real limit for this account, stat
  outfits and temp outfits compete for very few places.
- K4. `canChangeOutfit` on the storylet reply says whether any outfit change is allowed.
- K5. `POST /api/outfit/unequip {"qualityId": <worn item>}` empties a slot. Clicking a worn item on
  the Possessions tab does the same (verified on Adornment).
- K6. An equip made through the API leaves the page stale. That is why the optimizer clicks
  through the Possessions tab.

**Unknown. These block planning and need a capture with DevTools open.** The steps are in
[`docs/tools/fallen-london/outfit-capture-guide.md`](../../tools/fallen-london/outfit-capture-guide.md):

| # | Unknown | Blocks | Capture |
|---|---|---|---|
| U1 | The call that **renames** an outfit, its body and its reply. | R2, R3 | Rename an outfit by hand in the game. |
| U2 | Whether equipping an item **changes the selected saved outfit** (auto-save), or needs a separate save. What `dirty` means. | R2, R3, R4 | Select outfit B, equip one item, switch to A and back to B, and check whether the item stayed. |
| U3 | ~~Maximum name length~~: **answered 2026-11-24.** The game accepted `temp12345678901234567` (21 characters), and the script writes at most **20**. Still unknown: the allowed characters, whether letter case is kept, and whether two outfits may share a name. | R2.1, R2.3 | Try a duplicate name and a mixed-case name. |
| U4 | Whether outfits can be **created or deleted** through the game, or only renamed (a fixed number of places). What `type` and `isFavourite` mean. | R2.6 | Look at the outfit controls on Possessions. |
| U5 | How to switch outfit **through the page**, i.e. the outfit dropdown on Possessions and its markup. Needed for the same no-reload path the swaps use. | R1, R2 | Switch outfit with the dropdown, and capture the markup and the calls. |
| U6 | Whether the outfit list can be read from something smaller than `/myself`. `docs/fl-small-mercies/reference.md` may help, but nothing there is verified. | Speed only | Not blocking. |

If U1 shows renaming is impossible, R2 cannot be built as described. The fallback is to keep the
key → outfit-id map in `localStorage` and leave names alone, which works on one device only.

## 4. Requirements

### R1. Stat outfit shortcut

- **R1.1 Trigger.** Every challenge of the branch that the optimizer models tests the **same single
  stat**. Several challenges on the same stat count as one stat. Challenges the optimizer already
  leaves as the game shows them (Luck: no level, no gear touches it) are not part of the key.
  Combined (weighted) challenges stay blocked, as today.
- **R1.2 Match.** A saved outfit matches when its name equals the stat's game name (`Persuasive`,
  `Kataleptic Toxicology`) or the stat's code (`Per`, `Kat`), ignoring case and spaces.
  *Decision needed (Q3):* also accept other forms of the word, such as "Persuasion".
- **R1.3 Precedence.** Stat outfit, then matching temp outfit (R2.4), then calculation (R2.5).
- **R1.4 Already worn.** If the matching outfit is already selected, say so with the game's current
  chance and change nothing. Option B (section 6) adds a check here.
- **R1.5 Switch.** One outfit change, through the page where possible (U5), otherwise through the
  API and a reload, as the swaps do today. The script never equips or unequips anything while a
  stat outfit is selected **as part of this shortcut**.
- **R1.6 Safety net.** After the switch, re-read the storylet, as the optimizer already does. If
  the branch is now locked, a met requirement the optimizer guards is broken, or the chance is
  lower than before, switch back, say why, and offer the normal calculated run.
- **R1.7 Note (recommended).** Run the calculation anyway, since it is cheap. If it would reach a
  higher shown chance than the stat outfit, add a line such as "Calculated best: 74% (your
  Persuasive outfit gives 70%)". Apply nothing. Your outfit stays yours.
- **R1.8 Undo** switches back to the outfit that was selected before.

### R2. Temp outfits as a cache

- **R2.1 Recognition.** A temp outfit is one whose name starts with `temp` (ignoring case). Free
  temp: exactly `temp`, or `temp` followed only by digits (`temp2`) if duplicate names are not
  allowed (U3). Any other suffix is read as a key (R2.2). A suffix that does not parse is treated
  as a free temp.
- **R2.2 Key and name.** The key is the set of codes of the stats the branch tests (as in R1.1, but
  for any number of stats). The name is written as `temp` plus the codes **sorted alphabetically**,
  so `Watchful + Glasswork` is always written `tempGlaWat`. On reading, the suffix is split into
  codes (every code starts with a capital letter) and compared **as a set**. `tempWatGla`, made by
  hand, also matches. This makes the name order-independent ("transitive", as asked).
- **R2.3 Codes.** A fixed table in the script. Each code is a capital letter followed by lowercase
  letters, unique, and never changed once released, because changing one makes old temp names
  unreadable. Proposal (3 letters; the 20-character limit leaves room for five stats):

  | Stat | Code | Stat | Code |
  |---|---|---|---|
  | Watchful | Wat | Player of Chess | Che |
  | Shadowy | Sha | Shapeling Arts | Shp |
  | Dangerous | Dan | Zeefaring | Zee |
  | Persuasive | Per | Chthonosophy | Cht |
  | Artisan of the Red Science | Art | Steward of the Discordance | Ste |
  | Glasswork | Gla | Inerrant | Ine |
  | Kataleptic Toxicology | Kat | Insubstantial | Ins |
  | Mithridacy | Mit | Neathproofed | Nea |
  | Monstrous Anatomy | Mon | Bizarre / Dreaded / Respectable | Biz / Dre / Res |

  These names appear in `choice-helper.js`. Whether each one really occurs as a challenge stat has
  not been checked. A stat missing from the table gets **no caching**: the button calculates as
  today and the result line says the stat has no code. Guessing codes risks two stats colliding.
  Length: `temp` + 3 per stat, so 10 for two stats, 13 for three and 19 for five. The script
  writes names of at most 20 characters (U3), so a branch testing six or more stats is not
  cached. That should never happen in practice.
- **R2.4 Cache hit.** A temp outfit whose key equals the branch's key. Switch to it as in R1.5, with
  the safety net of R1.6. What happens next depends on option A or B (section 6).
- **R2.5 Cache miss.** Calculate. If the result is "already best", do nothing, as today. Otherwise:
  1. Pick a target temp outfit (R2.6). If there is none, behave as today (Q4).
  2. Switch to it, then re-read the outfit. The swaps are planned against **its** contents, not
     against what was worn before.
  3. **Rename it to a free name first**, then make the swaps, then rename it to `temp<key>` only
     after every swap has succeeded. A run that fails halfway leaves a free temp, never a key on
     half-applied gear.
  4. Report as today, plus "saved as tempGlaWat".
- **R2.6 Which temp to overwrite.** First a free temp. Otherwise the temp used longest ago, going by
  last-use times kept in `localStorage` (one device only). If there are no times (another device),
  take the first temp in the game's list. Never overwrite the temp holding the current branch's key.
- **R2.7 Rules kept from today.** Never empty a slot that holds something. Never touch a slot with
  `canChange: false`. Guard met requirements. Ties go to the fewest changes, counted from the
  target's contents. One request at a time.
- **R2.8 Invalidation.** Whenever the script changes items while a keyed temp is selected, outside
  step R2.5.3, it renames that temp to a free name first. That covers the normal optimizer
  modifying it, the empty button (R3) and Undo. Changes you make by hand cannot be detected
  reliably. With option B that does not matter. With option A, the script keeps the item ids it
  wrote per temp outfit and treats any difference as a miss.
- **R2.9 Undo** switches back to the outfit selected before the run. The temp keeps its new
  contents and name, since it is a valid optimum.

### R3. "Empty outfit" button (Possessions tab)

- **R3.1 Placement.** On the Possessions tab, next to the game's outfit controls. A real `<button>`
  at least 44 px high.
- **R3.2 Effect.** Unequip every slot that has `canChange: true`, is not `isEffect`, and holds an
  item. Locked slots and Boon/Burden are left alone and counted in the result ("2 slots cannot be
  changed").
- **R3.3 Temp suffix.** If the selected outfit is a keyed temp, rename it to a free name **before**
  the first unequip.
- **R3.4 How.** Click the worn items on the page (K5), with an API-and-reload fallback, using the
  same code path as the optimizer's swaps.
- **R3.5 Not allowed.** If `canChangeOutfit` is false, the button is disabled and says why.
- **R3.6 Confirmation (Q5).** If auto-save is confirmed (U2), emptying a named outfit destroys it.
  Proposal: a second tap is needed ("Tap again to empty <name>") unless the outfit is a temp.
- **R3.7 Result line** under the button, such as "Emptied 9 slots. Renamed tempGlaWat to temp.",
  with an Undo that re-equips what was taken off (nice to have).
- **R3.8** Behind its own switch in the shared UI settings (`FEATURES` entry with `group` and
  `label`).

### R4. Protecting named outfits (proposed, depends on U2)

If equipping changes the selected saved outfit, today's optimizer already rewrites whatever outfit
you are wearing. That includes a hand-made "Persuasive" outfit. Proposal: when at least one temp
outfit exists, calculated changes always go into a temp (R2.5) and never into a non-temp outfit.
With no temp outfit, behaviour stays as today.

### R5. Non-functional

- Bump `@version` in `ux-enhancers.js`. `@downloadURL` stays as it is.
- Update the header comment, the `equipment-optimizer` section of `AGENTS.md`, and
  `okf/fallen-london/api.md` / `equipment.md` / `open-questions.md` with what U1–U5 establish.
- Only calls that have been captured. No polling. Never a call that spends an action or picks a
  branch. The token rules stay unchanged.
- Mobile first. All information is in visible text. Colour never carries meaning alone.
- Tests in `tests/` (next to `ux-equipment-optimizer.test.mjs`): building and parsing names
  (order, case, unknown codes, junk suffixes), uniqueness of the code table, the precedence
  table R1.3, choice of the temp to overwrite, the order rename → swaps → rename including
  failure halfway, the empty button's slot selection, and the safety-net switch-back.
- No git changes are made by the implementing agent (your standing rule).

## 5. Acceptance scenarios

1. Persuasive-only action, outfit "Persuasive" exists and is not worn → one switch, result line
   names the outfit and shows the game's chance before → after. Undo switches back.
2. Same, with "Persuasive" already worn → "Already wearing Persuasive: 70%". Nothing changes.
3. Glasswork + Watchful action, no matching temp, `temp` exists → calculated, applied into `temp`,
   renamed `tempGlaWat`.
4. Next Watchful + Glasswork action → switch to `tempGlaWat`. No calculated swaps (option A), or
   only swaps for gear acquired since (option B).
5. A swap fails halfway in scenario 3 → the outfit is named `temp`, not `tempGlaWat`. The result
   says how many changes were made and offers an Undo.
6. "Empty outfit" on `tempGlaWat` → renamed `temp` first, then every changeable slot emptied.
7. Action in a place where `canChangeOutfit` is false → blocked, as today. No switch is attempted.
8. Stat outfit makes the branch locked (breaks a guarded requirement) → switched back,
   explanation given, normal calculation offered.

## 6. Decisions needed

- **Q1 (blocking).** ~~The name length limit~~: 20 characters (answered 2026-11-24). Still open:
  the captures U1, U2, U4 and U5. The guide is written (`docs/tools/fallen-london/`), and the
  answers are waiting on your run.
- **Q2. On a cache hit (temp or stat outfit):**
  - **A: trust the name.** Switch and stop. This is what you described. It is fast. It misses
    better gear bought since, and for actions with two or more stats it can be wrong. The key
    ignores difficulties, and the best balance between Glasswork and Watchful depends on how hard
    each challenge is.
  - **B: switch, then check (recommended).** Switch, then run the calculation from there. For a
    temp, apply any remaining improvement, usually none. For a stat outfit, only report it (R1.7).
    It costs the same number of outfit changes in the normal case and stays correct when gear or
    difficulties differ.
- **Q3.** Should stat outfits also match other forms of the word ("Persuasion" for Persuasive), or
  only the game's stat name and the code?
- **Q4.** With no temp outfit at all, should the button keep today's behaviour (swap within the
  current outfit), or refuse and ask you to create one?
- **Q5.** Should "Empty outfit" ask for a second tap on non-temp outfits?
- **Q6.** How many saved outfits does your account allow? The capture said 4 (K3). That decides
  whether more than one or two temps are realistic.
