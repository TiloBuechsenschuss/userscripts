---
okf: 1
title: The Agents tab (/agents)
kind: reference
domain: fallenlondon.com
status: verified
verified: 2026-10-21
source: one rendered /agents page from a logged-in character (one agent out on a plot, one at home), filter "All"
see_also: [index.md, open-questions.md]
---

# The Agents tab (`/agents`)

The game's Agents are not items. The wiki files them under their own `{{Agent}}`
template, and this tab is where the game lists the ones you have. Like every
route, `/agents` is an HTML shell; the list exists only once the SPA has booted,
so a script reads the rendered page (or a hidden same-origin frame pointed at
it), never a `fetch`.

## Structure

**Verified** against the capture of 2026-10-21. Class names are the game's own
BEM-style names unless marked *hash*: those come from emotion (react-select) and
change between builds, so match them on their suffix only.

```
div#agents
├─ div.agents-header
│  ├─ h1.heading.heading--1.heading--close            "Agents"
│  └─ span.heading.heading--3.heading--close          "1/3 Active Plots"
├─ hr
├─ div.agent-filter-group
│  ├─ span.agent-filter-label                         "Show:"
│  └─ div.css-…-container   (hash; a react-select)
│     └─ … div.css-…-singleValue   (hash)            "All"
├─ div.working-agent                                  one per agent out on a plot
│  ├─ div.agent-header-row > div.agent-assigned
│  │  └─ span.heading.heading--2.heading--close.agent-header   the agent's name
│  ├─ div.plot__result
│  │  ├─ div.media__left > img.agent-portrait         alt / aria-label = the agent's name
│  │  └─ div.plot-container.media--message
│  │     ├─ div.plot__image > div.small-card.storylet__card > … img.small-card__image
│  │     │                                            alt / aria-label = the plot's name
│  │     └─ div.plot__body > div
│  │        ├─ h2.media__heading.heading.heading--3.branch__title   the plot's name
│  │        └─ p …                                    the plot's description
│  ├─ div
│  │  ├─ div.progress-bar > span.progress-bar__stripe  style="width: 58.4%"
│  │  └─ div.working-agent-elapsed-actions             "146/250: 104 actions before your agent returns"
│  └─ div.working-agent-footer-row
│     ├─ div.agent-inventory > div.agent-inventory-item--locked × 12   (slots; see below)
│     └─ div.agent-footer-buttons > button.agent-unassign-button      "Abandon Plot"
└─ div.free-agent                                     one per agent at home
   ├─ div.agent-header-row > h2.heading.heading--2.agent-header      the agent's name
   └─ div.agent-body-row
      ├─ div.agent-summary
      │  ├─ div.media__left > img.agent-portrait      alt / aria-label = the agent's name
      │  └─ div > span (description), div > strong.agent-stat-bonus
      │                                               "Shadowy +50, Persuasive +50, Human +1, Intelligencier +1"
      └─ div.agent-details
         ├─ div.agent-stat-container > div.agent-stat-wrapper × n
         │  └─ div.agent-stat > img (stat icon) + span.agent-stat-level "50"
         │     (.agent-stat-new-row on the first of a second row)
         ├─ hr
         └─ div.free-agent-footer-row
            ├─ div.agent-inventory > div > div.icon.icon--emphasize.icon--available-item × 12
            └─ div.agent-footer-buttons > button.agent-assign-button "Unequip", "Assign"
```

Notes, all **verified** in the capture:

- **The name element differs by kind:** a `span.agent-header` on a working
  agent, an `h2.agent-header` on a free one. Select on the class, not the tag.
- **The plot heading is a `.branch__title`**, the same class as a storylet
  option's title. Choice Helper's badge features walk every `.branch__title`
  and stamp their dataset flags on it (the capture carries dozens of
  `data-fl-ux-*-branch` attributes); no badge was drawn there in the capture. `wiki-links.js` may append its "W" anchor, so read the
  name with `headingName`, never `textContent`.
- **The equipment slots** are twelve, in this order: hat, clothing, adornment,
  gloves, weapon, boots, luggage, companion, affiliation, transportation,
  homecomfort, crew (each an `img` whose `src` ends `<slot>_slotsmall.png`).
  On a working agent each is `div.agent-inventory-item--locked` with an extra
  `img.agent-inventory-item--lock` (alt "Locked"); on a free agent each is an
  `.icon--available-item`. Every slot in the capture was empty (the slot
  picture, `aria-label=""`); what a filled slot looks like is not captured.
- **Stats** on a free agent are icons with a number, not names. The names are
  only in the `strong.agent-stat-bonus` summary line.
- **No `data-quality-id`** anywhere on the tab, so nothing here is read by the
  Possessions reader.

## How Choice Helper reads it

`readAgents(doc)` in `FallenLondon/choice-helper.js`:

| Read | From | Why |
|---|---|---|
| The list is drawn | `.agents-header` text matches `N/M Active Plots` | the header's `h1` may render before the data |
| Each agent | every `.working-agent, .free-agent`, name off its `.agent-header` | |
| Working or not | the container's own class | |
| Plot, progress | `.branch__title`; `.working-agent-elapsed-actions` as `done/of: left actions` | |
| Complete or not | `.agent-filter-group [class*="-singleValue"]` is exactly `All` | any other filter hides agents, so an absent name proves nothing |

The reading is banked in `localStorage` (`fl-ux-agents`) whenever the tab is on
screen, and loaded in a hidden frame by the Hallowmas panel's refresh. A read
that fails (no list within 20 s) is banked beside the last good reading as
`failedAt` and retried after an hour.

## Assumed

- **Assumed:** agent names on the tab match the wiki's page titles (the two in
  the capture do). Names are compared through `itemKey`, so a leading article
  does not matter.
- **Assumed:** a hidden frame starts with the filter at "All". The reader checks
  it rather than relying on it.
