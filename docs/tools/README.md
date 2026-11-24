# docs/tools/

Tools for **finding out** how a game behaves: console snippets and capture guides. They are run by
hand in the browser, and are not part of any userscript. (`scripts/` holds the Node maintenance
helpers.)

Raw captures contain personal data (character name, possessions). They go in the repo's `temp/`
folder, which is gitignored, and are never committed. What a capture establishes is written up in
`okf/<game>/`, marked *verified* with the capture date.

## fallen-london/

| File | What |
|---|---|
| [api-recorder.js](fallen-london/api-recorder.js) | Pasted into the DevTools console on fallenlondon.com: records every call to `api.fallenlondon.com` (method, path, request and reply bodies, never headers) and any markup you snapshot or watch, then saves it as JSON. |
| [outfit-capture-guide.md](fallen-london/outfit-capture-guide.md) | Step by step: renaming outfits, whether equipping saves into the selected outfit, switching through the page, and the outfit controls. |
