// ==UserScript==
// @name         Twilight Heroes Quest Helper
// @author       Tilo
// @namespace    https://github.com/TiloBuechsenschuss
// @downloadURL  https://raw.githubusercontent.com/TiloBuechsenschuss/userscripts/refs/heads/main/TwilightHeroes/quest-helper.js
// @version      1.0
// @description  Adds a "Next steps" box under each quest in the Hero's Journal (journal.php). Quests advance through stages; the current stage is read from the journal entry text under the quest header, and the matching next-step hint is shown. Hints come from a built-in map keyed by quest + stage (built from the TH wiki); quests/stages not yet mapped fall back to a link to that quest's walkthrough on the TH wiki (th.blandsauce.com).
// @match        https://www.twilightheroes.com/journal.php*
// @match        https://twilightheroes.com/journal.php*
// @run-at       document-idle
// @grant        none
// ==/UserScript==

(function () {
  'use strict';

  // Bundled-loader safety: the all-in-one loader @requires every TH script and
  // runs them on the union of all matched pages. Gate on journal.php so this
  // never injects hints onto another page that happens to use <h2>/<b> rows.
  // Note journal-completed.php / journal-other.php / journal-notes.php are NOT
  // "journal.php" and so are correctly excluded -- those quests are done or are
  // free-form notes, where a "next step" makes no sense.
  if (!/\/journal\.php/i.test(location.pathname)) return;

  const WIKI_BASE = 'https://th.blandsauce.com/wiki/';

  // Normalise a quest name into a stable map key.
  function key(name) {
    return name.trim().replace(/\s+/g, ' ').toLowerCase();
  }

  // Normalise entry text for stage matching: lower-case and flatten every run
  // of non-alphanumeric characters (punctuation, &nbsp;, line breaks, the
  // wiki's curly vs. straight quotes) to a single space. Makes `match` snippets
  // robust to punctuation differences between the wiki text and the game.
  function normForMatch(s) {
    return s.toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim();
  }

  // --- Quest hint database ---------------------------------------------
  // Keyed by quest name (via key()). Each quest is:
  //   { wiki: '<MediaWiki slug>', stages: [ { match, hint }, ... ] }
  //
  // A quest in the journal shows ONE block of entry text under its <h2>/<b>
  // header, and that text changes as the quest advances -- so the text tells us
  // which stage the player is on. Each stage's `match` is a snippet of that
  // stage's journal entry; the stage whose snippet matches and is LONGEST (most
  // specific) wins, and its `hint` (trusted HTML) is shown. Order doesn't matter.
  //
  // IMPORTANT for overlapping stages: when a later stage's entry text *extends*
  // an earlier stage's (the journal keeps the old sentence and appends more),
  // the later entry contains BOTH snippets -- so the later stage's `match` must
  // be the FULL text (including the shared prefix) so it stays the longest and
  // wins. Storing only the appended tail would lose to the earlier stage's
  // longer snippet. See Go Fish Again / Rejected Rogue Ranch / All the World's.
  //
  // Stages with identical journal text across the wiki are collapsed into one
  // entry whose hint covers that span. Stages the wiki gives no entry text for
  // are omitted -- the player lands on the wiki-walkthrough fallback there.
  //
  // Built from https://th.blandsauce.com/wiki/Quests and the per-quest pages.
  // Untested against the live journal; entry wording may differ slightly in
  // game (the normaliser absorbs punctuation differences, not reworded text).
  const QUESTS = {
    // --- Specials shown directly in the current journal -----------------
    [key('Cleaning Up')]: {
      wiki: 'Quests',
      stages: [{
        match: 'There are a lot of streets in Twilight',
        hint: 'Just play the game..',
      }],
    },
    [key('Age of Destruction, in a World of Corruption')]: {
      wiki: 'Quests',
      stages: [{
        match: "You've defeated the Mick, but at the cost of having a chunk of the city",
        hint: 'End-game state. Head to your <b>Hideout</b> and use the <b>R.E.T.C.O.N. device</b> ' +
          'to travel back and try to prevent the destruction (a retcon/run reset), or stay in the ' +
          'present and keep playing. Your choice.',
      }],
    },

    // --- Core story quests ---------------------------------------------
    [key('Like a Super Neighbor')]: {
      wiki: 'Like_a_Super_Neighbor',
      stages: [
        { match: "You've heard a lot in the news about trouble in the Neighboring and Neighborly Neighborhood, right next to your own",
          hint: 'Adventure in the <b>Neighboring and Neighborly Neighborhood</b> until you hit "Officer Down" and rescue the officer.' },
        { match: 'Remember that police officer you rescued a while back',
          hint: 'Visit the <b>Twilight Hospital</b> to check on the officer (triggers "Officer Back Up").' },
        { match: 'Officer Aaron Rand suggested that you keep an eye out',
          hint: 'Return to the <b>Neighboring and Neighborly Neighborhood</b> and defeat <b>The Arsonist</b>.' },
      ],
    },
    [key('Trouble in the Galleria')]: {
      wiki: 'Trouble_in_the_Galleria',
      stages: [
        { match: 'You may want to do a little more exploring, to get to know more of your neighborhood',
          hint: 'Visit the <b>Galleria</b> shops.' },
        { match: "There's something fishy going on in the Galleria shops",
          hint: 'Patrol the <b>Cannonball Tavern</b> until you trigger "To the Rescue".' },
        { match: 'Melody and Bob have confirmed that the owner of the pizza place',
          hint: 'Get <b>steel knuckles</b> (from "A Noggin Scratcher" or "Shall We Play A Game?").' },
        { match: "You've seen enough to feel confident that the owner of the pizza place",
          hint: 'Return to the <b>Galleria</b> shops and give the steel knuckles to <b>Bob</b>.' },
        { match: 'Bob already took the steel knuckles from you and hid them in the pizza parlor bathroom',
          hint: "After <b>11:05 PM</b> game time, visit <b>Jax 'Za</b> and enter “John Steele”." },
        { match: 'You have had your showdown with John Steele',
          hint: 'Visit the <b>Twilight Police Department</b> and speak with <b>Rand</b>.' },
      ],
    },
    [key('A Dank and Rusty Mystery')]: {
      wiki: 'A_Dank_and_Rusty_Mystery',
      stages: [
        { match: "You get this feeling that there's more going on out there in the big city than you know about yet",
          hint: 'Visit <b>Officer Rand</b> at the <b>Twilight Police Department</b>.' },
        { match: 'something strange is going on in the sewers under your neighborhood',
          hint: 'Patrol the <b>neighborhood sewers</b> and choose "Enter the Hole".' },
        { match: "You've found some strange tunnels connecting to the sewers",
          hint: 'Keep patrolling the tunnels until you encounter "Kinders Feepers".' },
        { match: "though at first glance it doesn't seem useful",
          hint: 'Let your <b>Rank and Musty Daze</b> expire, then <b>use the black sand</b>.' },
        { match: 'though upon investigation it appears to be a bland sack',
          hint: 'Get <b>Rank and Musty Daze</b> again, find "A Skeptic Sandal", then use the septic scandals.' },
        { match: "You've managed to turn Black sand into a bland sack",
          hint: 'Equip the <b>skeptic sandals</b> and patrol until "A Barge Lox"; use the password “Grand”.' },
        { match: "You've successfully figured out the password for the maze",
          hint: 'Keep patrolling and defeat the <b>Mind Bender</b>.' },
        { match: "You've successfully defeated the Mind Bender",
          hint: 'Visit <b>Rand</b> at the <b>Twilight Police Department</b>.' },
      ],
    },
    [key("Protests Aren't for Amateurs")]: {
      wiki: "Protests_Aren't_for_Amateurs",
      stages: [
        { match: "You get this feeling that there's more going on out there in the big city than you know about yet",
          hint: 'Visit the <b>Twilight Police Department</b> (level 4+).' },
        { match: 'What started as a small political rally has broken out into a full-blown rioting protest',
          hint: 'Defeat 4 <b>mob instigators</b> at "Campus: Investigate a Protest".' },
        { match: 'The riot continues at the university',
          hint: 'Keep adventuring on campus until "Rhythm of the Rage".' },
        { match: "You've caught Rage, a teenager with psychic powers",
          hint: 'Take <b>Rage</b> downtown to <b>Rand</b> at the Police Department.' },
        { match: 'The university protest has been calmed',
          hint: 'Return to <b>Campus</b> for the final adventure, then visit <b>Susan Novak</b> (level 5+) for the reward.' },
      ],
    },
    [key('Cat and Mick-y Mouse Game')]: {
      wiki: 'Cat_and_Mick-y_Mouse_Game',
      stages: [
        { match: "You've heard about a mysterious character named The Mick",
          hint: 'Nothing to do yet — wait until The Mick makes another move.' },
        { match: 'It was just a quick visit to see Rand',
          hint: 'Talk to <b>Rand</b> about the kidnapping.' },
        { match: 'You bring the note back in to Rand',
          hint: 'Enter the <b>NCI Live building</b>.' },
        { match: "The Mick's got your sidekick held hostage in the NCI Live building",
          hint: 'Fight through the building and rescue your sidekick from <b>room 3</b>.' },
        { match: "You've rescued your understudy from the NCI Live building",
          hint: 'Defeat <b>The Mick</b> in <b>room 2</b>.' },
        { match: "You've actually defeated the Mick",
          hint: 'Enter <b>room 1</b>.' },
        { match: 'it seems a large chunk of Twilight city was just blown up',
          hint: 'Visit <b>Rand</b> for the debriefing.' },
        { match: "You've defeated the Mick, but at the cost of having a chunk of the city",
          hint: 'Show the <b>trimensional cortex</b> to <b>Susan</b> for analysis.' },
      ],
    },
    [key('C.H.I.P.S. (Casino Heroes Investigate Purported Scandal)')]: {
      wiki: 'C.H.I.P.S._(Casino_Heroes_Investigate_Purported_Scandal)',
      stages: [
        { match: "You get this feeling that there's more going on out there in the big city than you know about yet",
          hint: 'Visit the <b>Twilight Police Department</b> (level 5+).' },
        { match: 'Rand has asked you to check out the seedy casinos',
          hint: 'Patrol the <b>Golden Wooden Nickel Casino</b> until a VIP drops an encrypted swipe card.' },
        { match: 'He thinks the mafia may be using the back of the house to launder money',
          hint: 'Install an <b>electronic computer</b> in your <b>Computer Lab</b>.' },
        { match: "You've got the card partway decrypted but need to keep working at it",
          hint: "Keep decrypting with <b>Vlad's Decryptonomicon</b>." },
        { match: "You've managed to extract some room numbers and general location information from the card",
          hint: 'Patrol the <b>Casino Grounds</b> until the "Back Door" encounter.' },
        { match: "You've unlocked the back of the house",
          hint: 'Patrol the <b>Back of the House</b> to find the Suspicious Figure.' },
        { match: "You've found a suspicious door deep in the back of the house",
          hint: 'Patrol the <b>Back of the House</b> until a sotto capo drops a <b>capo key</b>.' },
        { match: "You've got a key. You know where the store room is",
          hint: 'Defeat <b>counsel Harry</b> in the Storeroom.' },
        { match: "You've broken into the mafia store room",
          hint: 'Return to the <b>Twilight Police Department</b> to report.' },
      ],
    },
    [key('Go Fish')]: {
      wiki: 'Go_Fish',
      stages: [
        { match: "You get the feeling it's about time to go check in with Officer Rand",
          hint: 'Visit the <b>Twilight Police Department</b> in Downtown Twilight.' },
        { match: 'Rand told you that shipments of valuable electronics are disappearing in Porcelain Bay',
          hint: 'Get an <b>underwater breathing</b> ability and patrol <b>Porcelain Bay</b>.' },
        { match: 'A strange talking fish told you some human known as the Troutmaster',
          hint: 'Keep patrolling <b>Porcelain Bay</b> until "Perch Boy".' },
        { match: "You're trying to stop the Troutmaster and his army of enslaved aquatic creatures",
          hint: 'In <b>Porcelain Bay</b>: defeat <b>Perch Boy</b>, find the <b>bicycle</b> and return it to the talking fish for a reward, then defeat the <b>Troutmaster</b>.' },
        { match: "You've successfully beaten the Troutmaster",
          hint: 'Return to the <b>Twilight Police Department</b> to report.' },
      ],
    },
    [key("Don't Cry for Me, Zion-tina")]: {
      wiki: "Don't_Cry_for_Me,_Zion-tina",
      stages: [
        { match: "You get the feeling it's about time to go check in with Officer Rand",
          hint: 'Visit the <b>Twilight Police Department</b> downtown.' },
        { match: "There's been trouble downtown, and you're just the hero to take that trouble",
          hint: 'Adventure in the <b>streets of downtown</b> Twilight.' },
        { match: "There's been trouble downtown, and it's up to you to sort things out",
          hint: "Keep adventuring downtown until you find the Zion's Tears connection." },
        { match: "Something truly strange is going on at the Zion's Tears cult headquarters",
          hint: "Adventure in the <b>Zion's Tears building</b>; defeat the archons to reach the demiurge." },
        { match: "You've scattered the Zion's Tears creatures and defeated their leader in combat",
          hint: 'Return to the <b>Twilight Police Department</b> to report to <b>Rand</b>.' },
      ],
    },
    [key('Go Fish, Again')]: {
      wiki: 'Go_Fish,_Again',
      stages: [
        { match: "Rand mentioned there's something odd going on at the university",
          hint: 'Talk with <b>Susan Novak</b>.' },
        { match: 'Seismic disturbances in the bay',
          hint: "Visit <b>Big Earl's Big Oil Derrick</b>." },
        { match: 'The oil platform in the bay seems to be under some sort of environmental terrorist attack',
          hint: "Keep adventuring at <b>Big Earl's Big Oil Derrick</b>." },
        { match: 'The eco-terrorists on the oil platform have led you to their underwater base',
          hint: 'Adventure in the <b>Underwater Base</b> until the locked-door encounter.' },
        { match: 'The eco-terrorists on the oil platform have led you to their underwater base. You should investigate more',
          hint: 'Defeat <b>Lightning Rod Jones</b>, <b>Shifty Sam</b> and <b>Iron Will Mike</b>, then hit the spy encounter.' },
        { match: "The eco-terrorists on the oil platform have led you to their underwater base, where you've discovered that they have dealings with the nefarious Mick",
          hint: 'Adventure in the <b>Underwater Base</b> until you get the <b>key card</b>.' },
        { match: "You've destroyed Livia la Frostheim's underwater base",
          hint: 'Talk to <b>Susan Novak</b> to finish the quest.' },
      ],
    },
    [key('Trouble in the Wasteland')]: {
      wiki: 'Trouble_in_the_Wasteland',
      stages: [
        { match: 'Susan mentioned that the police were too busy to help her',
          hint: 'Visit the <b>Twilight Police Department</b> (level 8+).' },
        { match: 'Rand says a strange military group in the desert shows signs of possessing some of the goods stolen by the Troutmaster',
          hint: "Gather the needed items at the <b>Military Base of the Unborn</b> (and Big Earl's Oil Derrick), then push through the <b>Byzantine Interior</b> — security pass, inner sanctum — to the boss." },
        { match: "You've defeated the leader of the Unborn Base",
          hint: 'Visit the <b>Twilight Police Department</b> to report.' },
      ],
    },
    [key("All the World's a Quest, and All the Men and Women Merely Heroes")]: {
      wiki: "All_the_World's_a_Quest,_and_All_the_Men_and_Women_Merely_Heroes",
      stages: [
        { match: 'Rand suggested that you check out the Cube theater downtown',
          hint: 'Patrol the <b>Cube Theater</b> to encounter "The Bit Player".' },
        { match: "Maybe the pieces of The Bard's script can be used against him",
          hint: 'Complete the six "Bit Player" encounters by picking the correct Shakespeare character each time.' },
        { match: "Maybe the pieces of The Bard's script can be used against him? Try putting the whole manuscript together",
          hint: "Use <b>script page 1</b> to assemble <b>The Bard's Play</b>." },
        { match: "Congrats! You've beaten The Bard",
          hint: 'Visit the <b>Twilight Police Department</b> to report your victory.' },
      ],
    },
    [key('Through the Dimensional Rabbit-Hole')]: {
      wiki: 'Through_the_Dimensional_Rabbit-Hole',
      stages: [
        { match: "It's been a while since you've talked to Susan Novak",
          hint: 'Visit <b>Susan Novak</b>.' },
        { match: 'Elco Hoist labs is under attack by strange creatures',
          hint: 'Travel to <b>Elco Hoist Laboratory</b>.' },
        { match: "Now that you've pushed back the worst of the creatures from the gate",
          hint: 'Adventure in the <b>Astral Badlands</b> until "Alien Geology 101".' },
        { match: "You've discovered the caves known as the Mouths of Darkness",
          hint: 'Map and clear the <b>Mouths of Darkness</b> caves in the Astral Badlands (~five encounters per cave) to find the missing team.' },
        { match: 'While the force field is being set up, you pull Susan aside',
          hint: 'Visit <b>Elco Hoist Laboratories</b> to finish the quest.' },
      ],
    },

    // --- Other journal quests ------------------------------------------
    [key('Plumbing the Depths')]: {
      wiki: 'Plumbing_the_Depths',
      stages: [
        { match: 'has asked you to scour the sewers of Somerset in search of special items containing marium',
          hint: 'Equip the <b>marium detector</b> and patrol the <b>Somerset sewers</b>, collecting 6+ of your class’s marium items.' },
        { match: 'You found a bunch of items containing the mysterious material called marium',
          hint: 'Return to your retired hero friend in <b>Somerset</b> with 6+ items for the reward.' },
      ],
    },
    [key('A Mysterious Ruin')]: {
      wiki: 'A_Mysterious_Ruin',
      stages: [
        { match: "You've found something strange out in the desert.",
          hint: 'Tell <b>Susan Novak</b> about the strange thing you found in the desert.' },
        { match: "You've found something strange out in the desert and you've told Susan about it",
          hint: 'Wait for <b>rollover</b>, then visit <b>Susan</b> again.' },
        { match: "Susan's had time to investigate the strange mechanical ruins",
          hint: 'Visit <b>Susan</b> after rollover to hear about the triangular devices.' },
        { match: "Susan's confirmed that the ruins are non-human in origin",
          hint: 'Wait for <b>rollover</b>; Susan will report on the portal properties.' },
        { match: 'getting them up into space quickly is a good idea',
          hint: 'Wait for rollover — the <b>space station</b> opens up. Keep checking in with Susan as it is built.' },
        { match: 'Danger in the space station',
          hint: 'Visit <b>Susan</b>, then fight off the robots invading the space station.' },
        { match: "You'd better check with Susan, again",
          hint: 'Defeat ~25 robots in the <b>space station</b> to restore calm, checking in with <b>Susan</b>.' },
        { match: 'All is quiet again in the space station',
          hint: 'Wait for <b>rollover</b>; the robots will return.' },
        { match: 'the robots are at it again',
          hint: 'Fight through the final wave of robots, including the boss.' },
        { match: 'you tried to fight off the robots, but now it looks worse than ever',
          hint: 'The invasion has come to a head — clear the final space-station stage to finish.' },
      ],
    },
    [key('Riding in the Lists')]: {
      wiki: 'Riding_in_the_Lists',
      stages: [
        { match: "You've been challenged to a joust at the Guild for Imaginative Metachronism",
          hint: 'Mount a horse (4150+ XP) and joust at the <b>Guild for Imaginative Metachronism</b>: beat the pitch-black knight, then your class opponent.' },
      ],
    },
    [key('Rejected Rogue Ranch Rascals Require Retribution')]: {
      wiki: 'Rejected_Rogue_Ranch_Rascals_Require_Retribution',
      stages: [
        { match: 'has asked you to take out the boss of the baddies at the Rejected rogue ranch.',
          hint: 'Travel to the <b>Rejected Rogue Ranch</b>.' },
        { match: "has asked you to take out the boss of the baddies at the Rejected Rogue Ranch. You've found the Ranch",
          hint: 'Keep adventuring in the <b>Rejected Rogue Ranch</b> to find the leader (Towering Titan).' },
        { match: 'to let them know you took out the Towering Titan',
          hint: 'Return to <b>Somerset Square</b> and speak with your hint giver.' },
        { match: "you've beaten the belligerent boss of the baddies",
          hint: 'Quest done — collect your quadrant reward.' },
      ],
    },
    [key('The Last Nostronomian')]: {
      wiki: 'The_Last_Nostronomian',
      stages: [
        { match: 'The alien that helped you before has gone missing',
          hint: 'Encounter and defeat the <b>Nostronomian sleepwalker</b> in <b>Shiloh Sanatarium</b>.' },
        { match: 'When you fought the Nostronomian in Shiloh Sanatarium, it dropped a scrap',
          hint: "Use the <b>Shiloh appointment schedule</b> to find <b>Dr. Somnus's</b> appointment time." },
        { match: "the Nostonomian's appointment with Dr. Somnus has already passed",
          hint: 'Wait until the next day, then check the schedule for the new appointment time and visit then.' },
      ],
    },
    [key('Moon Over Twilight, Brutes Over Downtown')]: {
      wiki: 'Moon_Over_Twilight,_Brutes_Over_Downtown',
      stages: [
        { match: 'Rand mentioned the rooftops over downtown Twilight have descended into chaos',
          hint: 'Patrol the <b>downtown rooftops</b> for "Like Muscle Beach Without the Beach".' },
        { match: 'The trouble downtown has led you to another location, WoDo',
          hint: "Visit <b>Tiny's Shack</b>; blend in or beat the massive brute to reach <b>Camp Training Camp</b>." },
        { match: 'The brutes seem to be originally',
          hint: 'Patrol <b>Camp Training Camp</b> and defeat the three trainers, then (red cape + greased bowling shoes + portable hole) the <b>Crash Brothers</b>, and report to <b>Rand</b>.' },
      ],
    },
    [key('Asylumbreak! Battle of Shiloh')]: {
      wiki: 'Asylumbreak!_Battle_of_Shiloh',
      stages: [
        { match: 'Officer Rand has informed you, in confidence, that Shiloh Sanatarium has lost track of a',
          hint: 'Equip ZOM gear, a flying ability, and a gas/steam mask, then adventure in <b>Shiloh Sanatarium</b> until the orderly encounter.' },
        { match: "You've found a secret facility under Shiloh Sanatarium",
          hint: 'Solve the <b>Goldbergium Door</b> puzzle to get the spare lab key.' },
        { match: 'built a contraption to get the key to the Goldbergium Door',
          hint: 'Defeat the <b>ZOMicron</b> behind the Goldbergium Door.' },
        { match: "You've dealt with the ZOMicron behind the Goldbergium Door",
          hint: 'Defeat <b>Doctor Zomadeus</b> and her <b>ZOMega</b> (Triassic Park / the Bestiary).' },
        { match: 'You defeated Doctor Zomadeus and her massive ZOMega',
          hint: 'Check in with <b>Officer Rand</b> at the Twilight Police Department.' },
      ],
    },
    [key('The Oldest and Strongest Emotion')]: {
      wiki: 'The_Oldest_and_Strongest_Emotion',
      stages: [
        { match: "Lately you've been getting a slightly creepy feeling whenever you find yourself close to the University campus",
          hint: 'Adventure in "Campus: Investigate a Retro Rave" until "The Old Man and the Me".' },
        { match: "you've found quite possibly the creepiest old man in Twilight",
          hint: 'Adventure in <b>Shiloh Sanatarium</b> to collect the clock-face item and the other six clock parts (in order).' },
        { match: 'You have a completely unnerving clock',
          hint: "Reach level 30, equip the <b>dreamer's clock</b>, and visit the <b>Creepy Old House</b>." },
      ],
    },
    [key('Pursuing a Majority Report')]: {
      wiki: 'Pursuing_a_Majority_Report',
      stages: [
        { match: "Right now you're waiting for him to get a good reading so you know where to go",
          hint: 'Adventure with the <b>pre-vandalism radio</b> equipped (~2 hours) until Phil gets a reading.' },
        { match: "He's found a likely target and has suggested you go look",
          hint: 'Travel to the location <b>Phil</b> points you to and adventure there until the vandalism event.' },
      ],
    },
    [key('Follow Your Nose to a Balanced Breakfast')]: {
      wiki: 'Follow_Your_Nose_to_a_Balanced_Breakfast',
      stages: [
        { match: "You're trying to help Leyonne track down a cereal criminal",
          hint: 'Go to the assigned location (matches your level), adventure with the <b>cereal port scanner</b> equipped until the cereal villain appears, then defeat it.' },
      ],
    },
    [key('Who Stalks the Stalkers')]: {
      wiki: 'Who_Stalks_the_Stalkers',
      stages: [
        { match: "You've learned of a new school within the university specializing in Villain Studies",
          hint: "Visit the <b>Twilight Police Department</b> for <b>Rand's</b> briefing." },
        { match: "The School of Villainy's mysterious backers have been sending in shipments of talismans",
          hint: 'Adventure at the <b>School of Villainy</b> (combat gear vs. henchstalkers, or noncombat/debate items) for the first encounter.' },
        { match: 'You fought the messenger sent by the School of Villainy',
          hint: 'Return to the <b>School of Villainy</b> and defeat the <b>Sneak King</b>.' },
      ],
    },
  };

  // --- Wiki URL (mirrors wiki-links.js) --------------------------------
  // Stock MediaWiki: first letter auto-capitalised, spaces -> underscores.
  // Prefer the quest's known slug; otherwise derive one from the name.
  function wikiHref(name, slug) {
    if (slug) return WIKI_BASE + encodeURIComponent(slug);
    let t = name.trim().replace(/\s+/g, ' ');
    if (!t) return null;
    t = t.charAt(0).toUpperCase() + t.slice(1);
    return WIKI_BASE + encodeURIComponent(t.replace(/ /g, '_'));
  }

  // Body HTML for a quest given its current entry text: the hint of the stage
  // whose `match` snippet is found in the entry and is longest (most specific),
  // else a link to the quest's TH wiki walkthrough.
  function hintFor(name, entryText) {
    const quest = QUESTS[key(name)];
    const flat = normForMatch(entryText);
    if (quest && quest.stages) {
      let best = null;
      let bestLen = -1;
      for (const stage of quest.stages) {
        const m = normForMatch(stage.match);
        if (m && m.length > bestLen && flat.includes(m)) {
          best = stage.hint;
          bestLen = m.length;
        }
      }
      if (best != null) return best;
    }
    const href = wikiHref(name, quest && quest.wiki);
    if (!href) return null;
    return (
      'No built-in hint for this stage yet &mdash; see the ' +
      '<a href="' + href + '" target="_blank" rel="noopener">' +
      'walkthrough for this quest on the TH wiki</a>.'
    );
  }

  // The "Next steps" box. Inline styles only (repo convention); a left accent
  // bar in the same blue as the wiki badge, kept visually quiet so it reads as
  // a helper note rather than part of the game's own quest text.
  function makeBox(name, entryText) {
    const body = hintFor(name, entryText);
    if (body == null) return null;
    const box = document.createElement('div');
    box.className = 'th-quest-helper';
    box.style.cssText =
      'margin:6px 0 10px;padding:6px 10px;border-left:3px solid #3366cc;' +
      'background:#f0f3fb;font-family:arial,sans-serif;font-size:12px;' +
      'line-height:1.4;color:#333;border-radius:0 3px 3px 0;';
    const label = document.createElement('div');
    label.textContent = 'Next steps';
    label.style.cssText =
      'font-weight:bold;font-size:10px;text-transform:uppercase;' +
      'letter-spacing:.5px;color:#3366cc;margin-bottom:2px;';
    const text = document.createElement('div');
    text.innerHTML = body;
    box.appendChild(label);
    box.appendChild(text);
    return box;
  }

  // A quest's entry is a flat run of text nodes / <BR> / <P> following its
  // heading, up to the next heading (or, for B-quests, the next <b> title).
  // Collect that text (to pick the stage) and remember where the run ends (to
  // drop the box after the description, before the next quest, so it doesn't
  // split the title from its text). `isBoundary` decides where the run ends.
  function injectAfterSection(heading, isBoundary) {
    if (!heading || heading.dataset.thQuestHelper) return;
    const name = heading.textContent.trim();
    if (!name) return;

    let entryText = '';
    let stop = heading.nextSibling;
    while (stop && !isBoundary(stop)) {
      if (stop.nodeType === 3) entryText += stop.textContent;
      else if (stop.nodeType === 1) entryText += ' ' + stop.textContent;
      stop = stop.nextSibling;
    }

    const box = makeBox(name, entryText);
    if (!box) return;
    heading.dataset.thQuestHelper = '1';
    // stop is the next quest's heading (insert before it) or null (last quest
    // -- append at the end of the container).
    heading.parentNode.insertBefore(box, stop);
  }

  // --- Quests ----------------------------------------------------------
  // Main quests are <h2>Quest Name</h2> followed by entry text. B-quests live
  // under an <h2>X-Quests</h2> tier divider as <b>Quest Name</b><BR>entry. The
  // page's only <h2>s are quest titles plus those dividers (matched by the
  // <letter>-Quests test, same as wiki-links.js); its only <b>s are B-quest
  // titles. Process B-quests first so the H2 divider that precedes them isn't
  // treated as a quest heading and doesn't act as a boundary mid-section.
  function isH2(n) { return n.nodeType === 1 && n.tagName === 'H2'; }
  function isDivider(h) { return /^[a-z]-quests$/i.test(h.textContent.trim()); }

  // B-quests: a <b> section runs until the next <b> or the next <h2>.
  document.querySelectorAll('b').forEach(function (b) {
    injectAfterSection(b, function (n) {
      return (n.nodeType === 1 && (n.tagName === 'B' || n.tagName === 'H2'));
    });
  });

  // Main quests: an <h2> section runs until the next <h2>.
  document.querySelectorAll('h2').forEach(function (h) {
    if (isDivider(h)) return; // tier divider, not a quest
    injectAfterSection(h, isH2);
  });
})();
