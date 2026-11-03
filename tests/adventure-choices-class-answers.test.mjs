// Ad-hoc test for adventure-choices.js's Epic Weapon / Nemesis quest answer marks:
// Tomb of the Unknown Your Class Here (1049) and The Dark and Dank and Sinister Cave Entrance (1087).
//
// Standalone Node script, no runner (see AGENTS.md).
//
// What's pinned here:
//   - Both choices have one answer for each of the six classes, and no two collide.
//   - The tomb riddle buttons from KoLmafia's fixtures (test_choice_manager_unknown_tomb_1..3.html,
//     an Accordion Thief, the same three labels shuffled) get exactly one mark, on "Music.",
//     whatever position it is in -- KoL shuffles the options on every load.
//   - The mark is a word and a shape ("✔ correct"), not only the outline colour, and names the class.
//   - A label already carrying a spoiler or KoL's " [...]" suffix still matches; a second run
//     does not mark twice; other choices and non-submit inputs are left alone.
//
//   node tests/adventure-choices-class-answers.test.mjs

import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const here = dirname(fileURLToPath(import.meta.url));
const src = readFileSync(join(here, '..', 'KingdomOfLoathing', 'adventure-choices.js'), 'utf8')
  .replace(/\r\n/g, '\n');

let failures = 0;
function check(label, got, expected) {
  const g = JSON.stringify(got);
  const e = JSON.stringify(expected);
  const ok = g === e;
  if (!ok) failures++;
  console.log((ok ? 'PASS' : 'FAIL'), '|', label);
  if (!ok) console.log('   expected:', e, '\n   got:     ', g);
}

// The script is not an IIFE, so take the functions out by their text.
const start = src.indexOf('function GetClassAnswers(');
const end = src.indexOf('function ShowButtonIDs(');
check('found GetClassAnswers .. MarkClassAnswer', start > 0 && end > start, true);
const { GetClassAnswers, NormalizeAnswerLabel, MarkClassAnswer } = new Function(
  src.slice(start, end) + '\nreturn { GetClassAnswers, NormalizeAnswerLabel, MarkClassAnswer };')();

// The call has to be inside the mainpane block, i.e. before the top-level return.
const call = src.indexOf('MarkClassAnswer(inputs, adventureChoiceNumber);');
const topReturn = src.indexOf('\nreturn;\n');
check('MarkClassAnswer is called before the top-level return', call > 0 && call < topReturn, true);

const CLASSES = ['Seal Clubber', 'Turtle Tamer', 'Pastamancer', 'Sauceror', 'Disco Bandit', 'Accordion Thief'];
for (const num of ['1049', '1087']) {
  const t = GetClassAnswers(num);
  check(num + ': one answer per class', Object.keys(t).sort(), [...CLASSES].sort());
  const keys = Object.values(t).map(NormalizeAnswerLabel);
  check(num + ': no two answers normalise alike', new Set(keys).size, 6);
}
check('other choices have no table', GetClassAnswers('1048'), null);

const btn = (value) => ({ type: 'submit', value, style: {} });
const opt = (v) => ({ type: 'hidden', name: 'option', value: String(v) });
const MARK = ' -- ✔ correct (Accordion Thief)';

// KoLmafia's three captured orderings of the Accordion Thief riddle.
const ORDERS = [
  ['"Music."', '"Stealth."', '"An accordion."'],
  ['"An accordion."', '"Music."', '"Stealth."'],
  ['"Stealth."', '"An accordion."', '"Music."'],
];
ORDERS.forEach((labels, k) => {
  const inputs = [];
  labels.forEach((l, i) => { inputs.push(opt(i + 1), btn(l)); });
  const n = MarkClassAnswer(inputs, '1049');
  const buttons = inputs.filter(x => x.type === 'submit');
  check('tomb fixture ' + (k + 1) + ': one mark', n, 1);
  check('tomb fixture ' + (k + 1) + ': on "Music."',
    buttons.map(b => b.value), labels.map(l => l === '"Music."' ? l + MARK : l));
  check('tomb fixture ' + (k + 1) + ': outlined and bold',
    buttons.filter(b => b.style.outline).map(b => b.style.fontWeight), ['bold']);
  check('tomb fixture ' + (k + 1) + ': hidden inputs untouched',
    inputs.filter(x => x.type === 'hidden').map(x => x.value), ['1', '2', '3']);
  check('tomb fixture ' + (k + 1) + ': second run adds nothing', MarkClassAnswer(inputs, '1049'), 0);
});

// The mark must say what it means without the colour.
check('mark carries a shape and a word', /✔ correct/.test(MARK), true);

// The cave wall, every class, with labels in plain and spoiler-suffixed forms.
const cave = GetClassAnswers('1087');
for (const cls of CLASSES) {
  const inputs = [btn(cave[cls]), btn('Kick the wall really hard.')];
  check('cave: ' + cls + ' marked', MarkClassAnswer(inputs, '1087'), 1);
  check('cave: ' + cls + ' suffix', inputs[0].value, cave[cls] + ' -- ✔ correct (' + cls + ')');
  check('cave: ' + cls + ' other button untouched', inputs[1].value, 'Kick the wall really hard.');
}
const suffixed = [btn('Entangle the wall with noodles. [1 adv]'), btn('Shoot a stream of sauce at the wall -- some spoiler')];
check('labels with " [...]" or " -- ..." still match', MarkClassAnswer(suffixed, '1087'), 2);

// Only exact answers, not labels that merely contain one.
check('a longer label containing an answer is not marked',
  MarkClassAnswer([btn('"Power." said nobody.'), btn('"Raw power."')], '1049'), 0);

// Not these choices -> nothing at all.
const other = [btn('"Music."')];
check('other choice: nothing marked', MarkClassAnswer(other, '1048'), 0);
check('other choice: label untouched', other[0].value, '"Music."');

console.log(failures ? `\n${failures} FAILED` : '\nall passed');
process.exit(failures ? 1 : 0);
