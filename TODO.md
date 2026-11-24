# ToDo

Finished work is in `TODO Done.md`.

Fallen London Choice Helper:
  Carousels: https://fallenlondon.wiki/wiki/Guides#Location-Specif  Sorted by each guide's {{Audience}} stage, in the order of
  h  https://fallenlondon.wiki/wiki/Template:Audience (top is earlier in the game);
  within a stage by area [in brackets], as the Guides page sorts locations
  (ignoring "The"); within an area, the original list's order first, then
  additions from the wiki. A guide the wiki files under two areas is under the
  first.
  "(implemented)" = already in FallenLondon/choice-helper.js.
  "(works)" = tested in game and working

  Left out of implemented reference guides (pick up later; the reasons are in PLAN-reference-guides.md and each
  feature's AGENTS.md entry):
    - City of the Tracklayers: the four Fate-locked vignettes and their eight cards (no wiki pages, so no titles
      to match); the Scheme of a Phoenix and Exploration storylets
    - Station Developments: the 22 conversions whose pages name no storylet (Ealing butchery, Postal and Notary
      Office, Sapphire, Hurlers hot spring)
    - Station Statues: Balmoral and Station VIII statues are labels only
    - Menace Locations: ambition-story storylets set in the places
    - Iron Republic: Take this demagogue for tea and muffins (empty page), the Nemesis ambition's storylets
    - Firmament: the Victor in Burgundy table (the three Conclude the hunt options may share one game title)
    - Discordant Studies: the Adulterine Castle's cards (tabulated by picture, titles unknown), the three Discordant
      Laws table
    - Hinterland Efficiency (City of the Tracklayers badges say `Eff`) is not read: check whether the Myself tab
      shows it

# Maybe

# Done

- Saved-outfit shortcuts (`equipment-optimizer` with stat and `temp` outfits, new `outfit-emptier`), `FallenLondon/ux-enhancers.js` 3.13. Tested in-game 2026-11-24, confirmed overall by the author. Reported specifically: a result stored in a temp outfit, renamed through the game's own pencil and save button so the dropdown shows the new name (`temp1` to `tempMit`); a 10% Mithridacy challenge now wears the most Mithridacy instead of "Already the best"; "Optimize equipment" left of Go with a gap; the "Empty outfit" trash-can button beside the game's star / edit / save buttons, emptying through the API plus one reload (noticeably quicker than clicks).

- `zee-map-regions`, `FallenLondon/choice-helper.js` 1.80: region and Zee Peril under each destination on the Unterzee map. Tested in-game 2026-11-02: a line shows below each destination. Abbey Rock's label not seen, its unlock being unmet.
