# Saved-outfit shortcuts for "Optimize equipment": requirements

Status: **implemented 2026-11-24, tested in game by the author 2026-11-24 (confirmed overall)**. Plan:
`docs/superpowers/plans/2026-11-24-saved-outfit-shortcuts.md`.
Script: `FallenLondon/ux-enhancers.js`, features `equipment-optimizer` and `equipment-helper`.

## 0. Handoff: where this stands (keep this section current)

- **Branch** `feature/fallen-london-outfit-sets`, draft PR
  [TiloBuechsenschuss/userscripts#26](https://github.com/TiloBuechsenschuss/userscripts/pull/26).
- **Implemented (2026-11-24)** in `ux-enhancers.js` 3.13 from the plan named in the header.
  **Tested in game by the author on 2026-11-24, confirmed overall** (see `TODO.md`, Done). The
  check list that went with it:
  1. Persuasive-only action with "Persuasive" not worn: one switch, no reload.
  2. Two-stat action with a free temp: renamed `temp...` to the key, contents saved (switch away and
     back, the items stay).
  3. The page after a store: does the dropdown show the new name, and is the save button dark?
     (Not verified; if stale, note it.)
  4. Unsaved hand change, then the button: prompt, second tap switches.
  5. "Empty outfit" on a temp and on a named outfit.
  6. Button row on desktop and on the phone: Optimize left of Go, same height.
  7. Undo/Dismiss: are they comfortable to tap on the phone at the game button's height?
  8. The safety net: an outfit that locks or lowers a branch is switched back, and the line says so.
- **Deferred minor findings** (from the build review, not fixed):
  - Task 4: Escape on a closed clearable react-select may clear the value; the parent fallback re-admits the decoy risk in layouts not captured.
  - Task 5: a missing branch1 is reported as "locked"; `runWithOutfit` is long.
  - Task 5: a failed switch clears the previous run's undo record; the store guard after swaps is unreachable (defensive). (The failing switch-back test, the missed "moved" case and the hidden third outfit were fixed in the final review.)
  - Task 6: the shape is copied once at build; no test for the no-row fallback; Undo/Dismiss have a vertical gap when wrapping. (The shorthands were replaced by longhands in the final review.)
  - Task 6: switching the feature off leaves inline `flex-wrap` on the game's row; the post-Possessions label check is characterization only.
  - Task 7: no try/finally around `eoBusy`; the first guard in `outfitEmptier` is redundant.
  - Task 7: the result line is drawn under the first `.fl-ux-empty-wrap` if there are several outfit controls.
  - **Final review fixes (2026-11-24):**
    - C1: after a switch the plan also guards requirements met in the outfit worn before, and nothing is saved (the run switches back) when the re-read shows the action locked.
    - I2: R2.1 narrowed: `temp` must be followed by the end of the name, a digit or a capital letter ("Tempest" is not a temp).
    - I3: the safety net for stat and hit outfits compares the best chance reachable from the outfit (the plan's, else the shown one) with the chance before, not the raw shown chance.
- **Process the author asked for:** go through the decisions in section 6 **one question at a
  time** with the author, and write each answer into this file (mark the question answered, and
  change the requirement it affects). Once every question is answered and the captures are in,
  write the plan in `docs/superpowers/plans/`. Implementation comes after the plan.
- **Answered:** Q1, the name length: the script writes at most 20 characters. Q6, the number of
  outfits: 17, six of them already named `temp1`…`temp6`.
- **Capture done (2026-11-24):** `temp/fl-outfit-capture.json` plus the author's notes settled U1,
  U2, U3, U4 and most of U5. The facts are in `okf/fallen-london/api.md` and `equipment.md`, and
  the requirements below are updated. The big change: **equips are not saved into the outfit**
  (U2). A separate save button stores them, so R2 and R3 need the save call, and R4 is dropped.
- **U7 settled (2026-11-24,** `temp/fl-outfit-capture-save.json`**):** `POST /api/outfit/save`,
  no body, saves into the selected outfit. All captures are in.
- **Answered:** Q2: option B2 (2026-11-24). Switch, then calculate; improvements go on unsaved
  over a stat outfit, and are saved into a temp outfit.
- **Answered:** Q3: strict (2026-11-24). Only the stat's game name or its 3-letter code.
- **Answered:** Q4: keep today's behaviour when no temp outfit exists (2026-11-24).
- **Answered:** Q5: "Empty outfit" saves temp outfits only (2026-11-24).
- **Answered:** R2.10: with unsaved changes, ask before switching (2026-11-24).
- **Added:** R6, the button's look and place (2026-11-24).
- **Plan written (2026-11-24):** `docs/superpowers/plans/2026-11-24-saved-outfit-shortcuts.md`,
  waiting for the author's review. One deviation: R3.5's button is not disabled in advance; a tap
  where outfits cannot change shows the reason instead (knowing it in advance needs a
  `/myself` read on every Possessions visit).
- **Not verified:**
  - The recorder (`docs/tools/fallen-london/api-recorder.js`) was tested only in headless
    Chromium against a faked site. It has not been tested in the real game.
  - The stat-code table (R2.3) lists names found in `choice-helper.js`. Whether each one occurs
    as a challenge stat has not been checked.
  - That the calculation is cheap is reasoned from the code, not measured.

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
calculation at almost no cost (option B in section 6, chosen as B2).

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
- K3. The outfit reply has `maxOutfits: 4`, but the author's account has **17** saved outfits
  (verified 2026-11-24). `maxOutfits` is not the limit on this account. Six of them are named
  `temp1`…`temp6`, so places are not scarce.
- K4. `canChangeOutfit` on the storylet reply says whether any outfit change is allowed.
- K5. `POST /api/outfit/unequip {"qualityId": <worn item>}` empties a slot. Clicking a worn item on
  the Possessions tab does the same (verified on Adornment).
- K6. An equip made through the API leaves the page stale. That is why the optimizer clicks
  through the Possessions tab.

**Unknowns.** U1–U5 were settled by the capture of 2026-11-24
([guide](../../tools/fallen-london/outfit-capture-guide.md), file `temp/fl-outfit-capture.json`,
not committed). The details are in `okf/fallen-london/api.md` and `equipment.md`.

| # | Question | Answer |
|---|---|---|
| U1 | The call that **renames** an outfit. | **Settled.** `POST /api/outfit/rename {"outfitId": n, "newName": "tempGlaWat"}`. The reply is the outfit reply plus `message: <new name>`. In the page: the pencil button (`.buttonlet-edit`) opens `form.outfit-controls__outfit-rename-form` with an input (`maxlength="21"`), a check button and a cancel (×) button. The page did not refetch the outfit list after the rename. |
| U2 | Does equipping change the selected saved outfit? | **Settled: no.** An equip sets `dirty: true` and enables the save button (`.buttonlet-save-outfit`). Switching to another outfit and back brought back the saved item: the unsaved change was dropped, with no prompt. |
| U3 | Names. | **Settled.** Up to 21 characters (the script writes at most 20). Letter case is kept (`tempGlaWat`). A name already used by another outfit is refused by the page, with a tooltip asking for another name; no call was sent, so whether the **server** refuses duplicates is not known. Characters other than letters and digits were not tried; the script writes only letters and digits. |
| U4 | Create, delete, limits. | **Settled.** The controls are: the outfit dropdown, a favourite star (`isFavourite`), edit name, save outfit, and the game's own "Equip Highest" button. No create, no delete: the outfits are fixed places. `type` is one of `Standard`, `Purchased`, `GivenInGame`, `Exceptional`, `EnhancedExceptional`, which reads as how the place was obtained. |
| U5 | Switching **through the page**. | **Mostly settled.** A react-select dropdown, with a visually hidden `<select id="a11y-outfit-dropdown">` whose option values are the outfit ids. Picking an outfit sends `POST /api/outfit/change`, then the page itself refetches `/api/plan` and `/api/character/myself` and redraws the item list without a reload. **Not verified:** whether a script can drive it (set the hidden select, or click the react-select option). |
| U6 | Whether the outfit list can be read from something smaller than `/myself`. | Open. Speed only, not blocking. The page's hidden select lists every outfit id and name (with the type in brackets), which may be enough while on Possessions. |
| U7 | The call the save-outfit button sends. | **Settled.** `POST /api/outfit/save` with no body: it saves into the **selected** outfit, so the script must switch to the target first. The reply is the outfit reply with `dirty: false`. The page refetched nothing after it, but its save button follows `dirty`; whether the page notices an API save is not verified. |

## 4. Requirements

### R1. Stat outfit shortcut

- **R1.1 Trigger.** Every challenge of the branch that the optimizer models tests the **same single
  stat**. Several challenges on the same stat count as one stat. Challenges the optimizer already
  leaves as the game shows them (Luck: no level, no gear touches it) are not part of the key.
  Combined (weighted) challenges stay blocked, as today.
- **R1.2 Match.** A saved outfit matches when its name equals the stat's game name (`Persuasive`,
  `Kataleptic Toxicology`) or the stat's code (`Per`, `Kat`), ignoring case and spaces. Nothing
  else matches: no other word forms ("Persuasion"), no prefixes, no partial names (Q3, answered
  2026-11-24).
- **R1.3 Precedence.** Stat outfit, then matching temp outfit (R2.4), then calculation (R2.5).
- **R1.4 Already worn.** If the matching outfit is already selected, say so with the game's current
  chance, then run the check of R1.7 from there (Q2: B2).
- **R1.5 Switch.** One outfit change, through the page where possible (U5), otherwise through the
  API and a reload, as the swaps do today. The script **never saves** into a stat outfit.
- **R1.6 Safety net.** After the switch, re-read the storylet, as the optimizer already does. If
  the branch is now locked, a met requirement the optimizer guards is broken, or the chance is
  lower than before, switch back, say why, and offer the normal calculated run.
- **R1.7 Check and apply unsaved (Q2: B2, answered 2026-11-24).** After the switch (or when the
  outfit is already worn), run the normal calculation from the stat outfit's contents. If it finds
  a higher chance, make those swaps **without saving**. The saved stat outfit stays as you made
  it; the game's save button lights up, and the extra items come off at the next outfit switch.
  The result line names both, e.g. "Persuasive outfit: 70%. Added new hat (unsaved): 74%." If the
  calculation finds nothing better, nothing more happens.
- **R1.8 Undo** switches back to the outfit that was selected before.

### R2. Temp outfits as a cache

- **R2.1 Recognition.** A temp outfit is one whose name starts with `temp` (ignoring case). The
  character after `temp` must be the end of the name, a digit or a capital letter, so "Tempest",
  "Temple Club" and "Temporary hat" are not temps (narrowed 2026-11-24 after review). Free
  temp: exactly `temp`, or `temp` followed only by digits (`temp2`). Any other suffix is read as a
  key (R2.2). A suffix that does not parse is treated as a free temp. Names must be unique (U3), so
  when the script gives a temp a free name it uses `temp` plus the smallest number no other outfit
  uses (`temp7` if `temp1`…`temp6` are taken). The author's account has `temp1`…`temp6` today.
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
  the safety net of R1.6. Then run the calculation from its contents (Q2: B2). If it finds a
  higher chance, apply the swaps and **save** them into the temp, as in R2.5.3, keeping the name.
  Usually it finds nothing.
- **R2.5 Cache miss.** Calculate. If the result is "already best", do nothing, as today. Otherwise:
  1. Pick a target temp outfit (R2.6). If there is none, behave as today: swap within the worn
     outfit, save nothing, and add a hint to the result line, such as "Rename an outfit to
     `temp1` to keep results for next time" (Q4, answered 2026-11-24).
  2. Switch to it, then re-read the outfit. The swaps are planned against **its** contents, not
     against what was worn before.
  3. Make the swaps. They are not stored in the outfit yet (U2). If every swap succeeded: **rename
     it to a free name** (unless it already has one), **save** it (U7: `POST /api/outfit/save`), then rename it to
     `temp<key>`. The free name in between means a run that stops after the save but before the
     last rename never leaves an old key on new gear. A run that fails during the swaps saves
     nothing: the temp keeps its old contents and its old name, which still match.
  4. Report as today, plus "saved as tempGlaWat".
- **R2.6 Which temp to overwrite.** First a free temp. Otherwise the temp used longest ago, going by
  last-use times kept in `localStorage` (one device only). If there are no times (another device),
  take the first temp in the game's list. Never overwrite the temp holding the current branch's key.
- **R2.7 Rules kept from today.** Never empty a slot that holds something. Never touch a slot with
  `canChange: false`. Guard met requirements. Ties go to the fewest changes, counted from the
  target's contents. One request at a time.
- **R2.8 Invalidation.** Items changed without a save do not change a saved outfit (U2), so the
  script's own unsaved swaps never invalidate a temp. Only a **save** can: whenever the script
  saves into a keyed temp outside step R2.5.3 (the empty button, R3), it renames that temp to a
  free name first. Changes you save by hand cannot be detected from the name; the check after
  every cache hit (R2.4) corrects them, so no item ids are kept.
- **R2.9 Undo** switches back to the outfit selected before the run. The temp keeps its new
  contents and name, since it is a valid optimum.
- **R2.10 Unsaved changes are lost on a switch** (U2). If the outfit you wear has unsaved changes
  (`dirty: true`) when the button switches to a stat or temp outfit, those changes are gone, and
  Undo brings back only the saved version. **Decided 2026-11-24: ask.** When the current outfit
  has unsaved changes (`dirty: true` in the outfit reply), the button does not switch yet. The
  result line says "Unsaved changes on Watchful will be lost. Tap again to switch to Persuasive."
  A second tap on the button within the same storylet view switches and carries on as normal.
  Otherwise nothing changes. This applies to every switch: stat outfit, temp hit, and switching to
  a temp to store a result (R2.5.2). No record of the script's own changes is kept.

### R3. "Empty outfit" button (Possessions tab)

- **R3.1 Placement.** On the Possessions tab, next to the game's outfit controls. A real `<button>`
  at least 44 px high. **Changed 2026-11-24 after the author saw it:** the text button broke the
  outfit box's layout. It is now one of the game's own round icon buttons (like star, edit, save)
  with a trash-can icon, right after the game's save button; the result line goes under the whole
  outfit box.
- **R3.2 Effect.** Unequip every slot that has `canChange: true`, is not `isEffect`, and holds an
  item. Locked slots and Boon/Burden are left alone and counted in the result ("2 slots cannot be
  changed").
- **R3.3 Temp outfits are saved empty.** Unequipping alone does not change the saved outfit (U2).
  If the selected outfit is a temp, the button then saves it (`POST /api/outfit/save`). A keyed
  temp (`tempGlaWat`) is renamed to a free name (`temp1`, R2.1) **before** the save, so an empty
  outfit never carries a key. If an unequip fails, nothing is saved or renamed.
- **R3.4 How.** ~~Click the worn items on the page (K5), with an API-and-reload fallback.~~
  **Changed 2026-11-24 (author: "a second per item feels long"):** one `POST /api/outfit/unequip`
  per item, one at a time, then one page reload. Every click makes the game refetch `/api/plan`
  and the 350 KB `/myself` (about 1.2 s per item in the captures); an API unequip takes about
  0.2 s. The outfit's name is still read from `/myself`, not the page, which can be stale.
- **R3.5 Not allowed.** If `canChangeOutfit` is false, the button is disabled and says why.
- **R3.6 Other outfits are never saved (Q5, answered 2026-11-24).** On a non-temp outfit the
  button only takes items off. The saved outfit stays as it was: the game's save button lights up,
  and switching away brings the saved contents back. So no second tap is needed.
- **R3.7 Result line** under the button, such as "Emptied 9 slots. Renamed tempGlaWat to temp1
  and saved." or "Emptied 9 slots (not saved).", with an Undo that re-equips what was taken off
  (nice to have; on a temp it does not save again).
- **R3.8** Behind its own switch in the shared UI settings (`FEATURES` entry with `group` and
  `label`).

### R4. Protecting named outfits (dropped 2026-11-24)

Not needed. Equipping does not change the selected saved outfit (U2), so today's optimizer never
rewrites a hand-made outfit such as "Persuasive". It only leaves unsaved changes on top of it. The
script saves only into temp outfits (R2.5, R3.3).

### R5. Non-functional

- Bump `@version` in `ux-enhancers.js`. `@downloadURL` stays as it is.
- Update the header comment, the `equipment-optimizer` section of `AGENTS.md`, and
  `okf/fallen-london/api.md` / `equipment.md` / `open-questions.md` with what U1–U7 establish (U1–U5 already moved there on 2026-11-24).
- Only calls that have been captured. No polling. Never a call that spends an action or picks a
  branch. The token rules stay unchanged.
- Mobile first. All information is in visible text. Colour never carries meaning alone.
- Tests in `tests/` (next to `ux-equipment-optimizer.test.mjs`): building and parsing names
  (order, case, unknown codes, junk suffixes), uniqueness of the code table, the precedence
  table R1.3, choice of the temp to overwrite and of its free name, the order swaps → rename →
  save → rename including failure halfway, the dirty-outfit confirmation (R2.10), the empty button's slot selection, and the safety-net switch-back.
- No git changes are made by the implementing agent (your standing rule).

### R6. The button's look and place (added 2026-11-24)

Today the "Optimize equipment" button is much bigger than the game's own buttons and sits on a
line of its own above them, which pushes the game's "Go" button down and breaks the branch's
layout (screenshot from the author, "Speak with other hunters", 2026-11-24).

- **R6.1 Same line.** The button sits in the branch's row of game buttons
  (`.storylet__buttons`), directly left of the game's own button ("Go", or whatever that branch
  shows), on the same line. The game's buttons keep their place and size.
- **R6.2 Same shape.** Height, padding, font (family, size, weight, letter case) and corner
  radius match the game's button in the same branch. Take them from that button (its classes or
  its computed style), so a change in the game's look carries over. Only the colours stay ours:
  dark background, light text, accent border, as now.
- **R6.3 The result line** (and its Undo button) goes on its own full-width line **below** the
  row of buttons, so it never pushes the buttons apart. The Undo button gets the same shape as
  R6.2. The second-tap prompt of R2.10 is shown there too.
- **R6.4 Narrow screens.** If the row does not fit, the "Optimize equipment" button may move to
  its own line above the game's button. The game's button never shrinks or moves out of the
  branch. Touch size: as tall as the game's button, which the game itself finds big enough.
- **R6.5 Label.** Stays "Optimize equipment" ("Optimizing…" while running).

## 5. Acceptance scenarios

1. Persuasive-only action, outfit "Persuasive" exists and is not worn → one switch, result line
   names the outfit and shows the game's chance before → after. Undo switches back.
2. Same, with "Persuasive" already worn → "Already wearing Persuasive: 70%". Nothing changes,
   unless the check (R1.7) finds something better.
3. Glasswork + Watchful action, no matching temp, `temp1` exists → switched to `temp1`,
   calculated, swapped, saved, renamed `tempGlaWat`.
4. Next Watchful + Glasswork action → switch to `tempGlaWat`, then the check. Usually no swaps;
   swaps (saved into `tempGlaWat`) only for gear acquired since, or other difficulties.
5. A swap fails halfway in scenario 3 → nothing is saved; `temp1` keeps its name and old
   contents. The result says how many changes were made and offers an Undo.
6. "Empty outfit" on `tempGlaWat` → every changeable slot emptied, renamed to a free name such
   as `temp1`, then saved. On "Persuasive" → emptied, not saved.
7. Action in a place where `canChangeOutfit` is false → blocked, as today. No switch is attempted.
8. Stat outfit makes the branch locked (breaks a guarded requirement) → switched back,
   explanation given, normal calculation offered.
9. The worn outfit has unsaved changes and a stat outfit matches → no switch, the result line
   asks for a second tap. Second tap → switch, unsaved changes are gone (R2.10).
10. Persuasive-only action, "Persuasive" outfit, and a better hat bought since → switch, new hat
   put on unsaved, result line says so. The saved "Persuasive" outfit is unchanged.
11. Any branch with challenges, desktop width → "Optimize equipment" sits left of "Go" on the
   same line, with the same height and font as "Go"; the result line appears below both.

## 6. Decisions needed

- **Q1.** ~~The name length limit~~: 20 characters (answered 2026-11-24). The captures U1–U5
  and U7 are done (2026-11-24).
- **Q2. On a cache hit (temp or stat outfit):** **answered 2026-11-24: B2.** Switch, then
  check; improvements are saved into a temp and put on unsaved over a stat outfit.
  - **A: trust the name.** Switch and stop. This is what you described. It is fast. It misses
    better gear bought since, and for actions with two or more stats it can be wrong. The key
    ignores difficulties, and the best balance between Glasswork and Watchful depends on how hard
    each challenge is.
  - **B: switch, then check (recommended).** Switch, then run the calculation from there. For a
    temp, apply any remaining improvement, usually none. For a stat outfit, only report it (B1) or apply it unsaved (B2).
    It costs the same number of outfit changes in the normal case and stays correct when gear or
    difficulties differ.
  - New since U2: improvements on top of a **stat** outfit could also be applied without saving.
    The saved "Persuasive" stays as it is, and the improvement is gone at the next outfit switch.
    So B could apply them for stat outfits too, instead of only reporting them.
- **Q3.** ~~Other forms of the word?~~ **Answered 2026-11-24: strict.** Only the game's stat name
  or the 3-letter code (R1.2).
- **Q4.** ~~No temp outfit at all?~~ **Answered 2026-11-24: keep today's behaviour**, unsaved,
  with a hint (R2.5.1).
- **Q5.** ~~Should "Empty outfit" save?~~ **Answered 2026-11-24: temp outfits only** (R3.3,
  R3.6).
- **Q6.** ~~How many saved outfits?~~ 17, with `temp1`…`temp6` among them (answered 2026-11-24
  by the capture).
