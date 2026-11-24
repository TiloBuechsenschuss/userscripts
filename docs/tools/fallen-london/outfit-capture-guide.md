# Capture guide: saved outfits (rename, auto-save, switching, outfit controls)

Answers U1, U2, U3 (rest), U4 and U5 of
[the saved-outfit shortcuts requirements](../../superpowers/specs/2026-11-24-saved-outfit-shortcuts-requirements.md).
About 15 minutes. Needs a desktop browser with DevTools (Chrome, Edge or Firefox), logged in to
Fallen London.

## What it changes in your game

Only outfits, and everything is put back at the end (step 9). It renames one outfit (twice),
equips one item and puts it back, and switches outfits. It never chooses a branch, never spends an
action, and never clicks **Use** on an item.

## Before you start

1. Pick two saved outfits:
   - **A**, any outfit, which stays as it is;
   - **B**, a scratch outfit you don't mind changing for a few minutes.
2. Write down B's **exact name**, and one item B wears that you could swap for a spare, such as a
   hat you own two of. That item is **X**, and the spare you will swap in is **Y**. Pick a Y
   that equips on a plain click, not one that opens a "Use / Equip" popup.
3. Be somewhere you can change outfit: not inside a storylet that locks your outfit.

## 1. Start the recorder

1. Open the **Possessions** tab.
2. Open DevTools (F12) and go to the **Console** tab.
3. Paste the whole of [`api-recorder.js`](api-recorder.js) and press Enter. Chrome may first ask
   you to type `allow pasting`. The console should say `[flRec] Recording calls to
   api.fallenlondon.com`.
4. Paste these two lines, which record the outfit controls and any menu while it is open:

   ```js
   __flRec.watch('.outfit-controls', 'outfit controls');
   __flRec.watch('[role="listbox"], [id$="-listbox"]', 'open menu');
   ```

   From here on, do everything **in the game page**, and come back to the console only to paste
   the next `mark` line. Clicking into the console closes any open menu in the page.

Do **not** reload the page until step 8: a reload ends the recording.

## 2. Baseline

```js
__flRec.mark('baseline: on Possessions, wearing <name of current outfit>');
```

Click the **Myself** tab, then **Possessions** again. This gets the game to fetch the outfit list,
if it fetches it on that route.

## 3. U5: switching outfits through the page

```js
__flRec.mark('U5: switch to B with the outfit dropdown');
```

Use the game's own outfit control on Possessions to switch to **B**. Open it, wait a second so
the open menu is recorded, then pick B.

Write down: what the control looks like (dropdown, tabs, buttons), and whether the item list
redrew without a page reload.

## 4. U2: does equipping change the saved outfit?

```js
__flRec.mark('U2: equip Y while B is selected');
```

Click **Y**, so it replaces X in B.

```js
__flRec.mark('U2: switch B -> A');
```

Switch to **A** with the same control.

```js
__flRec.mark('U2: switch A -> B');
```

Switch back to **B**.

Write down: **is Y still worn in B?** Yes means the game saves equips into the selected outfit
automatically.

Also look for anything like a **Save** button or an "unsaved changes" marker near the outfit
control after step 4's equip, and write down what you saw.

```js
__flRec.mark('U2: put X back');
```

Click **X** to put it back. If Y was not kept, B already has X and there is nothing to do.

## 5. U1: renaming

Find the game's control for renaming an outfit. Where it is has never been recorded: look next to
the outfit control on Possessions, or in a menu on it.

```js
__flRec.mark('U1: rename B to tempGlaWat');
```

Rename **B** to `tempGlaWat`, in exactly that mixed case.

Write down: whether the game kept the case (`tempGlaWat`, or `tempglawat` / `TEMPGLAWAT`).

## 6. U3: duplicate names and characters

```js
__flRec.mark('U3: rename B to the exact name of A');
```

Rename **B** to exactly A's name.

Write down: was it refused (and with what message), or are there now two outfits with that name?

```js
__flRec.mark('U3: rename B to temp-1_x.y');
```

Rename **B** to `temp-1_x.y`.

Write down: was it accepted as typed? The script itself only needs letters and digits, so a
refusal here is fine.

## 7. U4: what the outfit controls offer

```js
__flRec.snap('.outfit-controls', 'U4: outfit controls');
```

Write down **every** button or menu entry you see for outfits: new, delete, duplicate, favourite,
lock, or anything else, and the number of outfits you have and could have. **Do not press
delete.** Pressing "new outfit" is fine if there is one, as long as you can delete it again
afterwards. If you do, run this first:

```js
__flRec.mark('U4: create a new outfit');
```

## 8. Save the recording

```js
__flRec.save('fl-outfit-capture.json');
```

The file goes to your Downloads folder. Then:

```js
__flRec.stop();
```

## 9. Put everything back

- Rename **B** back to the name you wrote down.
- Check that B wears **X** again.
- Switch to the outfit you were wearing before step 3.
- Delete any outfit you created in step 7.

## 10. Hand it over

Send the JSON file and your written notes from steps 3–7. Two ways:

- put the file in the repo's `temp/` folder, which git ignores, so it is never committed; or
- attach it to the chat.

What the file contains: outfit names and ids, the outfit replies (item ids per slot), the request
bodies (outfit ids, item ids, the names you typed), the markup of the outfit controls, and
whatever other API calls the page made meanwhile, which may include storylet text. The big
character reply is cut down to the outfit list by default. No login token is recorded. Your
character's name is not in the trimmed file unless another reply happens to include it.

## If something goes wrong

- **The console shows no `[flRec] #… POST …` lines when you change outfit.** The page may make
  its calls in a way the recorder does not see. Note that, carry on with the written notes, and
  look in the **Network** tab (filter: `api.fallenlondon.com`) instead: right-click a request,
  then "Copy" → "Copy as fetch" for its URL and body, and the Response tab for its reply.
  Remove the `Authorization` header from anything you copy.
- **The page reloaded.** Start again from step 1. Steps already done don't need repeating; just
  mark where you are.
- **A step's control does not exist** (no rename, say). Write that down. It answers the question
  too.
