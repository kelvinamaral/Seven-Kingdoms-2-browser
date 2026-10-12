# Seven Kingdoms II — in the browser (WebAssembly)

A WebAssembly port of the open-source *Seven Kingdoms II: The Fryhtan War* engine, so it can run in a web browser.

- Engine source: [mecirt/7k2](https://github.com/mecirt/7k2) (GPL v2 or later, originally by Enlight Software). This repository is based on it; see `COPYING`.
- Browser port, loader page and audio mixer: in [`wasm/`](wasm/) plus small `__EMSCRIPTEN_WEB__` changes in `src/` and `include/`.

**No game data is included and none should ever be committed here.** The page asks the player to select the folder of
their own legitimate copy of the game (e.g. the GOG or Steam install). Files are read by the browser and kept only in
the memory of the tab; nothing is uploaded. Saves and settings are stored in the browser (IndexedDB).

## Status
Work in progress. It compiles, links and starts the engine in the browser. Not yet verified with the real game data.
See [`wasm/README.md`](wasm/README.md) for build instructions and details.
