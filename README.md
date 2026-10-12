# Seven Kingdoms II — in the browser

### ▶ [Play: kelvinamaral.github.io/Seven-Kingdoms-2-browser](https://kelvinamaral.github.io/Seven-Kingdoms-2-browser/)

> **You need your own, legitimately purchased copy of the game.** This project contains **no game files**, and it only works with a copy you acquired legally.
> Tested so far with the **GOG** version, which is the **recommended** one. The Steam version may work, but has not been verified.

*Português: [veja abaixo](#português).*

A WebAssembly port of the open-source engine of *Seven Kingdoms II: The Fryhtan War*, so it can run in a web browser.

## How to play
1. Open the link above (a current Chrome, Edge, Firefox or Safari).
2. Select the folder where you installed the game (the one containing `Resource`, `Sprite`, `Image`…).
3. Click **Play**.

The files are read by your browser and kept only in the memory of the tab; nothing is uploaded anywhere.
Saves and settings are stored in your browser (IndexedDB), on your computer. The music folder is large (about 470 MB):
untick **Load the music** if the tab gets slow. Multiplayer and the intro video are not available. The resolution is fixed at 800×600 and scaled to the window.

## Status
Work in progress. The engine starts and the game files are recognised. Known issue: a crash (`null function`) reported right after entering the profile name — under investigation.

## Credits and license
- Engine source: [mecirt/7k2](https://github.com/mecirt/7k2) (GPL v2 or later, originally by Enlight Software). This repository is based on it; see `COPYING`.
- Browser port, loader page and audio mixer: [`wasm/`](wasm/) plus small `__EMSCRIPTEN_WEB__` changes in `src/` and `include/`.
- The built site is in [`docs/`](docs/) and is served with GitHub Pages. To run it locally, serve that folder over HTTP (`python -m http.server 8000`, then open `http://localhost:8000`); opening the file by double-click does not work.
- Build instructions: [`wasm/README.md`](wasm/README.md).
- Never commit game data to this repository.

---

## Português

### ▶ [Jogar: kelvinamaral.github.io/Seven-Kingdoms-2-browser](https://kelvinamaral.github.io/Seven-Kingdoms-2-browser/)

> **É preciso ter a sua própria cópia do jogo, adquirida de forma legítima.** Este projeto **não contém nenhum arquivo do jogo** e só funciona com uma cópia comprada legalmente.
> Testado até agora com a versão da **GOG**, que é a **recomendada**. A versão da Steam pode funcionar, mas não foi verificada.

Port para WebAssembly do motor de código aberto de *Seven Kingdoms II: The Fryhtan War*, para rodar no navegador.

**Como jogar:** abra o link acima, selecione a pasta onde o jogo está instalado (a que tem `Resource`, `Sprite`, `Image`…) e clique em **Jogar**.
Os arquivos são lidos pelo seu navegador e ficam só na memória da aba; nada é enviado a servidor. Os saves e as configurações ficam no navegador (IndexedDB).
A pasta de música é grande (cerca de 470 MB): desmarque **Carregar a música** se a aba ficar lenta. Não há multiplayer nem vídeo de abertura.

**Status:** em desenvolvimento. O motor inicia e reconhece os arquivos do jogo. Problema conhecido: um erro (`null function`) logo após digitar o nome do perfil, em investigação.

**Licença:** GPL v2 ou posterior (veja `COPYING`). Projeto original: [mecirt/7k2](https://github.com/mecirt/7k2).
