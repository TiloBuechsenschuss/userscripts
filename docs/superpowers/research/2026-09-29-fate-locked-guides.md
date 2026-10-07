# The eleven Fate-locked guides — research

Fetched through the wiki API 2026-09-29: all eleven guides (`TODO.md` "Fate-locked" list), the story,
storylet and quality pages each guide names, and `Category:In the Footsteps of the Colossus` /
`Category:The Pale Tabernacle` / `Category:Apis Meet` / `Category:Flint` / `Category:Upwards`.

## 1. Finding: the options have no titles on the wiki

The wiki's content policy records **no narrative text of Fate-locked content**, and in practice no
option or card *titles* either. Every one of these guides identifies its options by **picture**:
`[[File:Cannon.png|50px]]`, `{{CSL|Image=riverofblood.png|…}}`, "Storylet image" columns. The story
pages list only the entry option (`Option1 = Trace the creature's path (10 FATE)`) and the
`{{Reward}}` summary. The category pages are empty or list only the entry storylets. Matching a badge
to an option needs the exact text the game shows, and that text is not on the wiki, so a table
built from it would be guesswork (skill: "Do not invent a selector"; the same reason the four
Fate-locked City of the Tracklayers vignettes are not badged, `TODO.md`).

| Guide | Stage | Audience tag | Fate route | EPA (guide) | Options identified by | Titles available |
|---|---|---|---|---|---|---|
| Apis Meet | Early Zailing | Fate | Flint (120 Fate) | 1.44 | picture | none; entry option only |
| Tanah-Chook | Early Zailing | Fate | All Things Must End (45) | 1.75 | picture | none |
| Tending the Colossus | Early Zailing | Fate | The Roving Colossus (10) | 4.46 | picture, gold cards | entry: *Trace the creature's path (10 FATE)* |
| Tales of the Tabernacle | Early Zailing | Fate | The Pale Tabernacle (10) | 4.50 | picture, gold cards | none (the guide lists qualities, not option names) |
| Upwards | Mid PoSI | Fate | Upwards (25) | 3.5 | picture | none; permanent storylet *Palaeontology: Upwards* |
| House of Chimes | Early MYN | Fate | Exceptional Friendship | 9.57 | prose, a few named stories | story names only (see §2) |
| Flute Street | Late MYN | Fate | The key to Flute Street (25) | 2.45 | picture, 24 gold cards | none |
| Sinning Jenny's Finishing School | Late MYN | Evergreen (Fate via The Empress' Shadow) | Fate item | 1.25 | prose and pupil tables | none; "Missing info (?s) on several storylets" |
| Shroom-Hopping | Early MYN | none (`{{FateGuide}}`) | A stroke of luck! (3 Fate) | 0.77 | picture (64 images) | hub only, §2 |
| The Whisker-Ways | Late PoSI | Evergreen (`{{FateGuide}}`) | A Dream of a Thousand Tails | 5.5 | picture | none |
| Philosofruits | Mid Zailing | Fate | The Mushroom's Dream | 5.76 | picture (38 images) | hub only, §2 |

**Correction to the plan:** Shroom-Hopping, Sinning Jenny and the Whisker-Ways are *not* marked Fate in
`{{Audience}}`, but each is Fate-locked (`{{FateGuide}}`, `[[Category:Fate]]`, "FontFate"). All eleven
belong in the Fate-locked list; nothing moves.

## 2. What titles do exist

Only the entry hubs, which are ordinary storylets:

- **Exploring the Mangrove College** (Philosofruits hub): *Observe a philosophical debate*, *Argue with
  the Unreconstructed Cynic*, *Argue with the Unreconstructed Cynic (Acquainted)*, *Forage for
  Solacefruit*, *Explore the Wisp-Ways*, *Follow the Unreconstructed Cynic (25 FATE)*. The guide's
  yields (Fruitful Asceticism, Curiosity, Frivolity, Rot) belong to the interior, which is image-only.
- **A day at the races** (Shroom-Hopping hub): *A stroke of luck! (3 FATE)*, *The Hopping Post*, *A
  disgraceful spectacle*, *Watch from a distance*. Fate-only entry options; the races are image-only.
- **House of Chimes** stories (*Learning from a Silk-Clad Expert*, *Drink a bit of brandy with a
  deviless*, *The Regretful Soldier's Heartbreaking Tale*, *Inviting a Friend*, *Gambling*) are
  named in prose, with rewards. They are one-off stories in a Fate location; the guide calls the place
  "mostly just a curiosity". No option titles, no ranking that varies.
- **Flute Street**: `Visiting Flute Street` and 35 unnamed storylets ("35 storylets and
  opportunities"); the guide's 24 cards are shown by image.

None of these titles carries a number a badge could rank: a hub option that starts a carousel is
a label at most, and a label without the interior is not a claim worth drawing.

## 3. Traps if titles were captured in game

1. Names like the ones the wiki records for Fate content can shift ("(Acquainted)", "(25 FATE)"); an
   in-game capture is the only source and would be verbatim.
2. **Colossus and Tabernacle are zee cards**, gold-bordered, drawn while zailing: they would need to
   coexist with the existing `zailing` / `fruits-of-the-zee` badges (a card keeps its Zailing badge).
   Apis Meet and Tanah-Chook are ports already in the Zailing port table.
3. Upwards is in the Forgotten Quarter and sits next to `forgotten-quarter-expeditions`; House of Chimes
   next to `cub-education` (Mr Chimes' Lost & Found); Sinning Jenny next to Ladybones Road (`airs-of-london`).
4. Luck/Stat challenges here are stated for the guide's own numbers (e.g. Persuasive 150 + 10 × ESM at
   Upwards): a live-read quality (Effrontery of the Starved Men) would need the Myself tab.

## 4. Recommendation

Mark all eleven `(considered, nothing to badge: Fate-locked, the wiki records option pictures not titles,
see docs/superpowers/research/2026-09-29-fate-locked-guides.md §1)` and remove them from the open list.
If the user wants any of them badged later, the input needed is one in-game list of the exact option
and card titles per guide (a screenshot of the storylet or the text of each option), plus the
sidebar greeting; then the normal analysis applies. Highest value, if any: Philosofruits (5.76),
The Whisker-Ways (5.5), Tales of the Tabernacle (4.50), Tending the Colossus (4.46).

## 5. Decisions for the user

1. **Close all eleven as "nothing to badge" (recommended)**, vs
2. **keep some open**, naming which; the user then supplies the titles from the game.
3. Panel: none (decided 2026-09-29).

**Only the game can tell:** every option and card title in these eleven guides.

## 6. Decisions (2026-09-29)

1. **All eleven closed** as `(considered, nothing to badge: Fate-locked, the wiki records option pictures not titles, see this doc §1)`. No code, no version bump.
2. Panel: none.

## 7. Philosofruits reopened (2026-10-07)

At the user's request Philosofruits is built anyway (`philosofruits`, `PHF_CARDS` in `choice-helper.js`), **matched by
picture** until the titles are read off the game. Every row carries the wiki's file name (`treeblue`, `treesmall`) and a
`title: null` to fill in; a filled-in title takes precedence over the picture. What this rests on, none of it captured:

1. **Where the pictures sit.** Only `.hand__image` (the wide hand) is a captured `<img>`. An option's picture is read as
   the first `<img>` in `.branch__left`, the opened card's as the first `<img>` under `.media--root` outside a branch,
   the compact hand's as the first `<img>` under `.small-card-container`.
2. **The file names.** That the game serves the same file names the wiki files them under (compared in lower case,
   without folder, extension or a trailing `small`).
3. **The greeting.** The pictures are reused all over the game (`Treeblue.png` is on 50+ wiki pages), so nothing is
   badged unless the greeting names *the Wisp-Ways*, the place *The Mushroom's Dream* says it unlocks. Not captured.
   An opened card matched by picture must also show only its own options.

Two pictures are on two cards each (`salon3small`: Frivolity on one card, Yield on another; `blacksmall`: Rot on
both), so options are matched within the open card. The guide's "Shapeling Arts 2" style figures are read as
difficulties. Its Harvest and Philosophy storylets are not badged: the guide gives neither their options' titles nor
their pictures.

