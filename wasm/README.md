# Seven Kingdoms II — WebAssembly build

Work in progress: builds the engine in this repository with Emscripten so it runs in a browser.
The game data is **not** included. The page (`web/shell.html` + `web/loader.js`) asks the player to
select the folder of their own legitimate copy of the game; files are copied only into the memory of
the browser tab, and saves/config are kept in IndexedDB.

## Build
1. Install Emscripten and build libjpeg(-turbo) for WebAssembly (static `libjpeg.a`).
2. `cd wasm && make -j2 JPEG=/path/to/libjpeg-wasm`
3. Serve `out/` over HTTP and open `7k2.html`.

## Changes to the engine (all behind `__EMSCRIPTEN_WEB__`)
- `src/platform.cpp`: 16-bit software frame buffer converted to the 32-bit canvas on each flip; Asyncify waits.
- `src/osysproc.cpp`, `src/omodeid.cpp`, `include/platform.h`: non-blocking sleep/yield, fixed 800x600 mode.
- `wasm/web/web_mixer.cpp` + `wasm/web/shim/SDL/SDL_mixer.h`: small mixer (Emscripten's SDL_mixer lacks `Mix_QuickLoad_WAV`).
- `src/ogfile.cpp`: pointer/char comparison fixed so clang accepts it.

## Status
Compiles, links and starts the engine in the browser (verified up to the first game-data read). Not yet tested with real game data.
