# Seven Kingdoms II — in the browser

### ▶ [Play: kelvinamaral.github.io/Seven-Kingdoms-2-browser](https://kelvinamaral.github.io/Seven-Kingdoms-2-browser/)

> **You need your own, legitimately purchased copy of the game.** This project contains **no game files**, and it only works with a copy you acquired legally.
> Tested so far with the **GOG** version, which is the **recommended** one. The Steam version may work, but has not been verified.

> **Tip:** if the game seems stuck on a screen or message box (for example the cursor does not move), press **Enter** to continue.

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
Work in progress, playable. Last tested with the GOG version.

**Works**
- [x] The game starts in the browser from your own game folder (nothing is uploaded)
- [x] Menus, single-player matches, scenario editor
- [x] Saving and loading your own saves (fixed a save-file reading bug)
- [x] Profile, settings and hall of fame kept in the browser (can be turned off or erased from the start page)
- [x] Background music no longer changes track every in-game day
- [x] Mouse capture (ESC releases it), fullscreen, system cursor hidden while playing
- [x] Remembers the game folder (Chrome/Edge; one click to re-allow, the files themselves are never stored)
- [x] Export/import of profile, settings and saves (a ZIP backup)
- [x] Cheats panel (replays the game's own cheat shortcuts)
- [x] Copy button for the technical log; English/Portuguese page

**Not working yet / known issues**
- [ ] Tutorial and the saves/scenarios shipped with the GOG HD version (different file format than this engine)
- [ ] Cursor can look stuck on some start screens and message boxes: press **Enter**
- [ ] Some audio errors still appear in the log
- [ ] Multiplayer and the intro video
- [ ] On Firefox/Safari the game folder must be selected again on every visit (Chrome/Edge can remember it)

**Ideas for later:** touch controls for phones/tablets.

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

> **Dica:** se o jogo parecer travado em alguma tela ou caixa de aviso (por exemplo, o cursor não se move), aperte **Enter** para continuar.

Port para WebAssembly do motor de código aberto de *Seven Kingdoms II: The Fryhtan War*, para rodar no navegador.

**Como jogar:** abra o link acima, selecione a pasta onde o jogo está instalado (a que tem `Resource`, `Sprite`, `Image`…) e clique em **Jogar**.
Os arquivos são lidos pelo seu navegador e ficam só na memória da aba; nada é enviado a servidor. Os saves e as configurações ficam no navegador (IndexedDB).
A pasta de música é grande (cerca de 470 MB): desmarque **Carregar a música** se a aba ficar lenta. Não há multiplayer nem vídeo de abertura.

**Status:** em desenvolvimento, já jogável. Último teste com a versão da GOG.

**Funciona**
- [x] O jogo inicia no navegador a partir da sua pasta (nada é enviado)
- [x] Menus, partidas single-player, editor de cenários
- [x] Gravar e carregar os seus saves (corrigido um erro de leitura de save)
- [x] Perfil, configurações e hall da fama guardados no navegador (dá para desligar ou apagar na página inicial)
- [x] A música não troca mais de faixa a cada dia do jogo
- [x] Captura do mouse (ESC libera), tela cheia, ponteiro do sistema oculto durante o jogo
- [x] Lembra a pasta do jogo (Chrome/Edge; um clique para permitir de novo, os arquivos em si não são guardados)
- [x] Exportar/importar perfil, configurações e saves (backup em ZIP)
- [x] Painel de cheats (reenvia os atalhos de trapaça do próprio jogo)
- [x] Botão de copiar o registro técnico; página em português e inglês

**Ainda não funciona / problemas conhecidos**
- [ ] Tutorial e os saves/cenários que vêm com a versão HD da GOG (formato de arquivo diferente do deste motor)
- [ ] O cursor pode parecer travado em algumas telas iniciais e caixas de aviso: aperte **Enter**
- [ ] Alguns erros de áudio ainda aparecem no registro
- [ ] Multiplayer e vídeo de abertura
- [ ] No Firefox/Safari é preciso selecionar a pasta do jogo a cada visita (Chrome/Edge conseguem lembrar)

**Ideias para depois:** controles de toque para celular e tablet.

**Licença:** GPL v2 ou posterior (veja `COPYING`). Projeto original: [mecirt/7k2](https://github.com/mecirt/7k2).
