// ==UserScript==
// @name         Twilight Heroes Puzzle Solver
// @author       Tilo
// @namespace    https://github.com/TiloBuechsenschuss
// @downloadURL  https://raw.githubusercontent.com/TiloBuechsenschuss/userscripts/refs/heads/main/TwilightHeroes/puzzle-solver.js
// @version      1.0
// @description  In-page help for Twilight Heroes' interactive puzzles. WORKING: the Goldbergium Door (Asylumbreak, on goldberg.php) -- the goal is randomised per attempt but the component input/output mapping is fixed, so this SOLVES it (a valid 5+ component chain for the current goal), persists the plan, and replays it with progress as you build. NOT YET IMPLEMENTED: the Bit Player (All the World's a Quest, on fight.php) -- intended to TRACK which Shakespeare roles you've tried (correct/wrong/untried, with a reset), since the correct set is randomised per retcon; currently a skeleton that does nothing.
// @match        https://www.twilightheroes.com/fight.php*
// @match        https://twilightheroes.com/fight.php*
// @match        https://www.twilightheroes.com/goldberg.php*
// @match        https://twilightheroes.com/goldberg.php*
// @run-at       document-idle
// @grant        none
// ==/UserScript==

// DIST: bundled in all-in-one/twilight-heroes.js since loader v1.7 (its @match
//   union includes goldberg.php for this script). The Goldbergium Door solver is
//   confirmed working in-game; the Bit Player module is still a skeleton (see
//   its block below) and no-ops until wired up.

(function () {
  'use strict';

  // Bundled-loader safety: the all-in-one loader runs every TH script on the
  // union of matched pages, so don't assume the page. Each puzzle module below
  // guards on its own DOM signature (detect()) and no-ops when absent.
  if (!/\/(fight|goldberg)\.php/i.test(location.pathname)) return;

  // ====================================================================
  // The Bit Player  --  All the World's a Quest, and All the Men and
  //                     Women Merely Heroes
  // --------------------------------------------------------------------
  // NOT a deterministic solver. Per the TH wiki the correct set of roles is
  // randomised per retcon and "impossible to know in advance"; non-Shakespeare
  // roles (Beowulf, Gawaine, Robin Hood) are always wrong. So this is a memory
  // aid: it remembers, across the seven encounters within one retcon, which
  // options turned out correct vs wrong, and highlights them next time.
  //
  // The 17 options (the game removes already-picked ones in later encounters):
  //   Bassanio, Benvolio, Beowulf, Desdemona, Gawaine, Juliet, Katherina,
  //   Lady Capulet, Mercutio, Oberon, Othello, Petruchio, Portia, Titania,
  //   Tybalt, Robin Hood, Romeo.
  // ====================================================================
  const BitPlayer = (function () {
    // localStorage key for the per-retcon correct/wrong record.
    // TODO(html): a retcon resets the puzzle, so the stored state must reset
    //   too. We can't read the retcon number from the encounter page (TODO:
    //   confirm). Heuristic per TODO.md: when the Bit Player appears with ALL
    //   options present again, treat it as a fresh run and clear state. Decide
    //   the storage key + reset trigger once we have the page HTML.
    const STORE_KEY = 'th-bitplayer-state';

    // Options the wiki marks as never-correct -- safe to pre-mark "wrong".
    const ALWAYS_WRONG = ['beowulf', 'gawaine', 'robin hood'];

    // True iff this fight.php page is a Bit Player encounter.
    function detect() {
      // TODO(html): match on the encounter text ("I'm the Bit Player") and/or
      //   the option form. Return false otherwise.
      return false;
    }

    // { correct: string[], wrong: string[] } keyed by normalised role name.
    function loadState() {
      // TODO(html): JSON.parse(localStorage[STORE_KEY]) with a safe default.
      return { correct: [], wrong: [] };
    }
    function saveState(/* state */) {
      // TODO(html): localStorage[STORE_KEY] = JSON.stringify(state).
    }

    // The selectable role controls on the page.
    function findOptions() {
      // TODO(html): return [{ name, el }] for each option (radio/link/button).
      return [];
    }

    // If every one of the 17 options is present, this is a new run -> reset.
    function maybeResetForNewRun(/* options */) {
      // TODO(html): if findOptions() length === 17 (all present), clear state.
    }

    // Colour each option by known status; pre-mark ALWAYS_WRONG.
    function highlight(/* options, state */) {
      // TODO(html): tint correct = green, wrong = red, untried = neutral.
      //   Inline styles only (repo convention).
    }

    // Record the outcome of the pick the player just made, if this page is the
    // result of a Bit Player choice (script page = correct, HP loss = wrong).
    function recordOutcome() {
      // TODO(html): detect result text and update+save state.
    }

    // A small "Reset Bit Player memory" button (TODO.md asks for a manual reset).
    function addResetButton() {
      // TODO(html): button that clears STORE_KEY and re-highlights.
    }

    function run() {
      if (!detect()) return;
      recordOutcome();
      const options = findOptions();
      maybeResetForNewRun(options);
      const state = loadState();
      highlight(options, state);
      addResetButton();
    }

    return { run, detect };
  })();

  // ====================================================================
  // The Goldbergium Door  --  Asylumbreak! Battle of Shiloh
  // --------------------------------------------------------------------
  // STATUS: confirmed working in-game -- solves the empty state, persists the
  // plan, and replays it with progress through a full build. (The Bit Player
  // module below is still a skeleton, pending a live encounter's HTML.)
  //
  // A real solver. The cavern goal is randomised per attempt (one of nine),
  // each needing ONE final action; the components you own each turn one input
  // action into one output action. A working contraption is a chain of 5+
  // components whose final output equals the goal's required action and where
  // each component's input is produced by the previous component's output.
  // (22+ distinct components lets you skip building; ignore for the solver.)
  //
  // Goal -> required final action (from the wiki):
  //   oily rope -> heating, rock candy -> watering, tough sack -> cutting,
  //   sleeping toad -> startling, jar -> shooting, safe -> crushing,
  //   string -> pulling, armored door -> pushing, "?" -> unknown.
  // ====================================================================
  const Goldbergium = (function () {
    // The eight action types that components consume/produce.
    const ACTIONS = [
      'heating', 'watering', 'cutting', 'startling',
      'shooting', 'crushing', 'pulling', 'pushing',
    ];

    // Goal object -> the action its FINAL component must output to free the key.
    // The live page shows the goal in prose ("a <goal> hidden down a tiny
    // winding tunnel"); we match a distinctive substring of each. From the wiki
    // each goal sits in one input row, and that row's action is what it needs.
    // TODO(html): confirm these substrings against the live page wording, and
    //   fill in the eighth goal -- the wiki lists the "pushing" goal only as
    //   "?", so its in-game description is unknown until we see it.
    const GOAL_TO_ACTION = {
      'oily rope': 'heating',       // key hanging from an oily rope
      'rock candy': 'watering',     // lump of rock candy with a key in it
      'tough sack': 'cutting',      // tough sack that you'll assume holds a key
      'sleeping toad': 'startling', // sleeping toad with a key-shaped bulge
      'jar with a key': 'shooting', // jar with a key in it
      'safe': 'crushing',           // sturdy-looking safe ... has a key in it
      'string dangling': 'pulling', // key with a string dangling from it
      // <unknown 'pushing' goal>: 'pushing',
    };

    // The component matrix from the wiki: COMPONENTS[input][output] = the one
    // component that consumes `input` and produces `output`. The diagonal
    // (input === output) is intentionally absent -- no component maps an action
    // to itself. 8 inputs x 7 outputs = 56 components.
    const COMPONENTS = {
      heating: {
        watering: 'sprinkler', cutting: 'steam-powered chainsaw',
        startling: 'fire alarm', shooting: 'bottle rocket',
        crushing: 'weight on an oily rope', pulling: 'steam-driven pulley',
        pushing: 'steam piston',
      },
      watering: {
        heating: 'lump of sodium', cutting: 'water saw', startling: 'dry cat',
        shooting: 'corked hose', crushing: 'water mill',
        pulling: 'water wheel pulley', pushing: 'toy boat',
      },
      cutting: {
        heating: 'pouch of pyrophoricity', watering: 'tough water balloon',
        startling: '"unpoppable" balloon', shooting: 'restrained slingshot',
        crushing: 'hanging anvil', pulling: 'counterweight and pulleys',
        pushing: 'restrained boulder',
      },
      startling: {
        heating: 'sleeping fire ant', watering: 'sleeping elephant',
        cutting: 'sleeping dog', shooting: 'sleeping monkey',
        crushing: 'sleeping gorilla', pulling: 'sleepy draft horse',
        pushing: 'sleeping rhino',
      },
      shooting: {
        heating: 'jar of coals', watering: 'dunk tank',
        cutting: 'inert electric knife', startling: 'gong',
        crushing: 'giant mousetrap', pulling: 'inert winch',
        pushing: 'mousetrap car',
      },
      crushing: {
        heating: 'bag of matchheads', watering: 'water main',
        cutting: 'reinforced novelty scissors', startling: 'gigantic bicycle horn',
        shooting: 'well-balanced teeter totter', pulling: 'bucket and pulley',
        pushing: 'leg on a hinge',
      },
      pulling: {
        heating: 'triggered blowtorch', watering: 'squirt gun',
        cutting: 'hook on a string', startling: 'chalkboard',
        shooting: 'cork gun', crushing: 'hinged mallet',
        pushing: 'boxing glove gun',
      },
      pushing: {
        heating: 'brazier of coals', watering: 'water basin', cutting: 'hand saw',
        startling: 'rusty hinge', shooting: 'corked bellows',
        crushing: 'leaning tower', pulling: 'punchable toggle',
      },
    };

    // Each Shiloh subzone drops the seven components sharing one input action,
    // so a component's drop zone is fixed by its input (its matrix row).
    const ZONES = {
      heating: 'Furnace Room',
      watering: 'Swimming Pool',
      cutting: 'Trash Heap',
      startling: 'Petting Zoo',
      shooting: 'Firing Range',
      crushing: 'Hidden Factory',
      pulling: 'Backstage',
      pushing: 'Underground Racetrack',
    };

    const MIN_CHAIN = 5; // the contraption needs at least five components

    // True iff this page is the Goldbergium Door puzzle. The <h1> is the most
    // stable signal; fall back to the contraption form that posts to goldberg.php.
    function detect() {
      const h1 = document.querySelector('h1');
      if (h1 && /goldbergium door/i.test(h1.textContent)) return true;
      return !!document.querySelector('select[name="nextstep"]');
    }

    // True iff the contraption is empty (the "Start a contraption" state) -- the
    // only state where the dropdown lists ALL owned parts, so the only place we
    // can solve from scratch. We persist that solution and replay it while
    // building (where the dropdown lists just the REMAINING parts).
    function isEmptyState() {
      return !!document.querySelector('input[type="submit"][value="Start a contraption"]');
    }

    // True iff a contraption is partway built ("Build further" / "Try it out!").
    function isBuildingState() {
      return !!document.querySelector(
        'input[type="submit"][value="Build further"],' +
        'input[type="submit"][value="Try it out!"]');
    }

    // Persist the solution computed at the empty state so the build steps (which
    // no longer have the full inventory) can replay the SAME plan rather than
    // recomputing a different one each step. Keyed by goal; localStorage may be
    // unavailable (privacy modes), so everything is guarded.
    const STORE_KEY = 'th-goldberg-solution';
    function saveSolution(goal, chain) {
      try { localStorage.setItem(STORE_KEY, JSON.stringify({ goal: goal, chain: chain })); }
      catch (e) { /* ignore */ }
    }
    function loadSolution() {
      try {
        const raw = localStorage.getItem(STORE_KEY);
        const obj = raw && JSON.parse(raw);
        if (obj && typeof obj.goal === 'string' && Array.isArray(obj.chain)) return obj;
      } catch (e) { /* ignore */ }
      return null;
    }
    function clearSolution() {
      try { localStorage.removeItem(STORE_KEY); } catch (e) { /* ignore */ }
    }

    // Pure: the ordered names of components already placed, from the build prose
    // "So far you have the X connected to the Y connected to the Z."
    function placedFromText(text) {
      const m = String(text).match(/so far you have the (.+?)\./i);
      if (!m) return [];
      return m[1].split(/\s+connected to the\s+/i)
        .map(function (s) { return s.trim(); })
        .filter(Boolean);
    }

    function readPlacedComponents() {
      return placedFromText(document.body ? document.body.textContent : '');
    }

    // Pure: the goal action from a blob of page text, or null. Reads only the
    // goal SENTENCE (lazily, up to "...winding tunnel"), so component names in
    // the dropdown -- e.g. "weight on an oily rope", which contains the 'oily
    // rope' goal key -- can't cause a false match. Handles the empty-state and
    // contraption-built wordings.
    function goalActionFromText(text) {
      const s = String(text);
      const m = s.match(/you notice (?:an?\s+)?(.+?) hidden down a tiny winding tunnel/i)
             || s.match(/there's (?:an?\s+)?(.+?) down a winding little tunnel/i);
      if (!m) return null;
      const phrase = m[1].toLowerCase();
      for (const sub of Object.keys(GOAL_TO_ACTION)) {
        if (phrase.includes(sub)) return GOAL_TO_ACTION[sub];
      }
      return null;
    }

    // Pure: parse dropdown option texts ("name (count)") into a Map of component
    // name -> inventory count. An option with no "(N)" suffix defaults to 1.
    function parseOptionCounts(texts) {
      const counts = new Map();
      for (const t of texts) {
        const s = String(t).trim();
        if (!s) continue;
        const m = s.match(/^(.*?)\s*\((\d+)\)\s*$/);
        if (m) counts.set(m[1].trim(), parseInt(m[2], 10));
        else counts.set(s, 1);
      }
      return counts;
    }

    // Pure: just the owned component names (used by the solver's availability).
    function componentsFromOptionTexts(texts) {
      return new Set(parseOptionCounts(texts).keys());
    }

    // The action the current goal requires, or null if unknown ("?"/unmapped).
    function readGoalAction() {
      return goalActionFromText(document.body ? document.body.textContent : '');
    }

    // Map of component name -> inventory count, from the contraption dropdown.
    function readComponentCounts() {
      const sel = document.querySelector('select[name="nextstep"]');
      if (!sel) return new Map();
      const texts = Array.prototype.map.call(sel.options, function (o) { return o.textContent; });
      return parseOptionCounts(texts);
    }

    // Names of the components the player currently has, or null = "assume all".
    function readAvailableComponents() {
      const counts = readComponentCounts();
      return counts.size ? new Set(counts.keys()) : null;
    }

    // Find a contraption: an ordered chain of >= MIN_CHAIN unique components
    // where each component's output feeds the next's input and the LAST output
    // equals `goalAction`. The FIRST component's input is auto-activated in
    // game, so any action is a valid chain start -- which is exactly why many
    // solutions exist. We search backwards from the goal.
    //
    // `available` is a Set of component names, or null for "all components".
    // Uniqueness of components == uniqueness of (input,output) edges, since each
    // edge maps to exactly one component; we track used edges to enforce it.
    // Returns components ordered first-to-activate -> last, or null if none.
    function solve(goalAction, available, minLen, maxLen) {
      if (!goalAction || !COMPONENTS[ACTIONS[0]]) return null;
      const has = (name) => !available || available.has(name);
      const lo = minLen || MIN_CHAIN;
      const hi = maxLen || lo + 5; // allow longer chains if a short one needs gear we lack

      // Build a chain of exactly `len` edges whose final output === endAction.
      function build(len, endAction, usedEdges) {
        if (len === 0) return []; // reached the (auto-activated) start
        for (const inAct of ACTIONS) {
          const name = COMPONENTS[inAct] && COMPONENTS[inAct][endAction];
          if (!name || !has(name)) continue; // no/own-less component for this edge
          const edge = inAct + '>' + endAction;
          if (usedEdges.has(edge)) continue; // component already used
          usedEdges.add(edge);
          const prefix = build(len - 1, inAct, usedEdges);
          if (prefix) return prefix.concat([{ name, input: inAct, output: endAction }]);
          usedEdges.delete(edge);
        }
        return null;
      }

      for (let len = lo; len <= hi; len++) {
        const chain = build(len, goalAction, new Set());
        if (chain) return chain;
      }
      return null;
    }

    // Inject a styled box just above the contraption form, listing the chain in
    // build order (first part to place -> last, whose output frees the key).
    // Mirrors quest-helper's note-box look for visual consistency.
    // `placed` is null at the empty state, or an array of already-placed
    // component names while building (used to mark steps done / next).
    function renderSolution(chain, goalAction, placed) {
      const form = document.querySelector('form');
      if (!form || document.querySelector('.th-puzzle-solver')) return;

      const box = document.createElement('div');
      box.className = 'th-puzzle-solver';
      box.style.cssText =
        'margin:6px 0 10px;padding:6px 10px;border-left:3px solid #3366cc;' +
        'background:#f0f3fb;font-family:arial,sans-serif;font-size:12px;' +
        'line-height:1.4;color:#333;border-radius:0 3px 3px 0;';

      const label = document.createElement('div');
      label.textContent = 'Suggested contraption (goal needs ' + goalAction + ')';
      label.style.cssText =
        'font-weight:bold;font-size:10px;text-transform:uppercase;' +
        'letter-spacing:.5px;color:#3366cc;margin-bottom:2px;';
      box.appendChild(label);

      if (!chain) {
        const msg = document.createElement('div');
        msg.textContent = placed
          ? 'No saved plan for this contraption (started before the helper loaded?). '
            + 'Tear it down and start over to get a suggested solution.'
          : "Couldn't build a chain to " + goalAction + ' from the components you '
            + 'have here -- you may be missing parts from some Shiloh subzones.';
        box.appendChild(msg);
      } else {
        const placedSet = new Set(placed || []);
        // The next part to add: the first chain step not yet placed.
        let nextIdx = chain.length;
        for (let i = 0; i < chain.length; i++) {
          if (!placedSet.has(chain[i].name)) { nextIdx = i; break; }
        }
        const ol = document.createElement('ol');
        ol.style.cssText = 'margin:2px 0 0;padding-left:20px;';
        chain.forEach(function (c, i) {
          const li = document.createElement('li');
          const last = i === chain.length - 1;
          li.textContent = c.name + ' (' + c.input + ' → ' + c.output + ')' +
            (last ? ' — frees the key' : '');
          if (placedSet.has(c.name)) {
            li.style.cssText = 'color:#888;text-decoration:line-through;';
          } else if (i === nextIdx) {
            li.style.cssText = 'font-weight:bold;';
            li.textContent += '  ← add this next';
          }
          ol.appendChild(li);
        });
        box.appendChild(ol);
      }
      form.parentNode.insertBefore(box, form);
    }

    // Render the full component matrix (input rows x output cols) with the
    // player's inventory count in each cell, mirroring the TH wiki table. Each
    // row is labelled with the Shiloh subzone its items drop in. Cells used by
    // the current solution `chain` are highlighted gold and numbered in build
    // order; other owned cells are tinted green; unowned are greyed; the
    // diagonal is blank (no component maps an action to itself).
    function renderMatrix(counts, chain, placed) {
      const form = document.querySelector('form');
      if (!form || !counts || !counts.size || document.querySelector('.th-puzzle-matrix')) return;

      // Edge "input>output" -> 1-based step in the suggested chain.
      const stepByEdge = new Map();
      if (chain) chain.forEach(function (c, i) { stepByEdge.set(c.input + '>' + c.output, i + 1); });
      const placedSet = new Set(placed || []);

      const wrap = document.createElement('div');
      wrap.className = 'th-puzzle-matrix';
      wrap.style.cssText =
        'margin:6px 0 10px;font-family:arial,sans-serif;font-size:11px;color:#333;';

      const cap = document.createElement('div');
      cap.textContent =
        'Goldbergium components (input ↓ / output →, × count owned; gold = current solution)';
      cap.style.cssText =
        'font-weight:bold;font-size:10px;text-transform:uppercase;' +
        'letter-spacing:.5px;color:#3366cc;margin-bottom:3px;';
      wrap.appendChild(cap);

      const cellCss = 'border:1px solid #ccc;padding:2px 4px;white-space:nowrap;';
      const headCss = 'border:1px solid #ccc;padding:2px 4px;background:#e8ecf8;' +
        'font-weight:bold;text-transform:capitalize;';
      function thEl(text) {
        const th = document.createElement('th');
        th.textContent = text;
        th.style.cssText = headCss;
        return th;
      }

      const table = document.createElement('table');
      table.style.cssText = 'border-collapse:collapse;';

      const headRow = document.createElement('tr');
      headRow.appendChild(thEl('in \\ out'));
      ACTIONS.forEach(function (out) { headRow.appendChild(thEl(out)); });
      table.appendChild(headRow);

      ACTIONS.forEach(function (inp) {
        const tr = document.createElement('tr');

        // Row header: input action plus the subzone its components drop in.
        const rowHead = document.createElement('th');
        rowHead.style.cssText = headCss + 'text-align:left;';
        const act = document.createElement('div');
        act.textContent = inp;
        const zone = document.createElement('div');
        zone.textContent = ZONES[inp] || '';
        zone.style.cssText = 'font-weight:normal;font-size:9px;color:#666;text-transform:none;';
        rowHead.appendChild(act);
        rowHead.appendChild(zone);
        tr.appendChild(rowHead);

        ACTIONS.forEach(function (out) {
          const td = document.createElement('td');
          td.style.cssText = cellCss;
          if (inp === out) {
            td.style.background = '#dddddd'; // no component maps an action to itself
          } else {
            const name = COMPONENTS[inp][out];
            const n = counts.get(name) || 0;
            const step = stepByEdge.get(inp + '>' + out);
            if (step) {
              const done = placedSet.has(name);
              td.textContent = (done ? '✓ ' : step + '. ') + name + (n ? ' ×' + n : '');
              td.style.fontWeight = 'bold';
              if (done) { td.style.background = '#dfeedf'; td.style.color = '#777'; }
              else td.style.background = '#fff3c4'; // gold: still to place
            } else {
              td.textContent = name + (n ? ' ×' + n : '');
              if (n) td.style.background = '#eef6ee';
              else td.style.color = '#aaaaaa';
            }
          }
          tr.appendChild(td);
        });
        table.appendChild(tr);
      });

      wrap.appendChild(table);
      form.parentNode.insertBefore(wrap, form);
    }

    function run() {
      if (!detect()) return;
      const goalAction = readGoalAction();
      const counts = readComponentCounts();

      if (isEmptyState()) {
        // Solve from the full inventory and remember it for the build steps.
        let chain = null;
        if (goalAction) {
          const available = counts.size ? new Set(counts.keys()) : null;
          chain = solve(goalAction, available);
          if (chain) saveSolution(goalAction, chain);
          else clearSolution();
        }
        renderSolution(chain, goalAction, null);
        renderMatrix(counts, chain, null); // shown even for the unknown "?" goal
        return;
      }

      if (isBuildingState()) {
        // Replay the stored plan (recomputing here would drift, and the dropdown
        // now only lists the remaining parts). Mark placed parts as done.
        const stored = loadSolution();
        const chain = stored && stored.goal === goalAction ? stored.chain : null;
        const placed = readPlacedComponents();
        renderSolution(chain, goalAction, placed);
        renderMatrix(counts, chain, placed);
      }
    }

    return {
      run, detect, solve, renderSolution, renderMatrix,
      goalActionFromText, componentsFromOptionTexts, parseOptionCounts, placedFromText,
      saveSolution, loadSolution, clearSolution,
      ACTIONS, MIN_CHAIN, COMPONENTS, GOAL_TO_ACTION, ZONES,
    };
  })();

  // --- Dispatch --------------------------------------------------------
  // Both modules self-gate via detect(); only the matching one acts.
  BitPlayer.run();
  Goldbergium.run();
})();
