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
Work in progress, playable. Last tested with the **GOG** version.

### What works
- [x] Starts in the browser from your own game folder (nothing is uploaded)
- [x] Menus, single-player matches and the scenario editor
- [x] Saving and loading your own saves (a save-file reading bug was fixed)
- [x] Profile, settings, hall of fame and saves (including `Scenario/` files) kept in the browser; can be turned off or erased from the start page
- [x] **Export / import** of all of that as a single ZIP backup
- [x] **Cheats panel**: buttons that replay the game's own cheat shortcuts (map, technologies, gold/food with a ×100 option, town, reputation, toggles). Tested: gold and food
- [x] Mouse capture (ESC releases it), fullscreen, system cursor hidden while playing
- [x] Background music no longer changes track every in-game day
- [x] Copy button for the technical log; English/Portuguese page

### Known issues / not working yet
- [ ] Cursor can look stuck on some start screens and message boxes: press **Enter**
- [ ] Tutorial and the saves/scenarios shipped with the GOG HD version (a different file format than this engine)
- [ ] Some audio errors still appear in the log
- [ ] Multiplayer and the intro video (not available in the web version)
- [ ] The game folder must be selected again on every visit. (Browsers refuse system folders such as `C:\Program Files (x86)`, so it cannot be remembered for the default GOG location.)

### Ideas for later
- [ ] Touch controls for phones and tablets, and loading the game from a ZIP file
- [ ] Custom cheats added to the engine itself

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

## Status
Em desenvolvimento, já jogável. Último teste com a versão da **GOG**.

### O que funciona
- [x] Inicia no navegador a partir da sua pasta do jogo (nada é enviado)
- [x] Menus, partidas single-player e o editor de cenários
- [x] Gravar e carregar os seus saves (um erro de leitura de save foi corrigido)
- [x] Perfil, configurações, hall da fama e saves (inclusive os arquivos de `Scenario/`) guardados no navegador; dá para desligar ou apagar na página inicial
- [x] **Exportar / importar** tudo isso em um único backup ZIP
- [x] **Painel de cheats**: botões que reenviam os atalhos de trapaça do próprio jogo (mapa, tecnologias, ouro/comida com opção ×100, cidade, reputação, modos liga/desliga). Testados: ouro e comida
- [x] Captura do mouse (ESC libera), tela cheia, ponteiro do sistema oculto durante o jogo
- [x] A música não troca mais de faixa a cada dia do jogo
- [x] Botão de copiar o registro técnico; página em português e inglês

### Problemas conhecidos / ainda não funciona
- [ ] O cursor pode parecer travado em algumas telas iniciais e caixas de aviso: aperte **Enter**
- [ ] Tutorial e os saves/cenários que vêm com a versão HD da GOG (formato de arquivo diferente do deste motor)
- [ ] Alguns erros de áudio ainda aparecem no registro
- [ ] Multiplayer e vídeo de abertura (não existem na versão web)
- [ ] É preciso selecionar a pasta do jogo a cada visita. (O navegador recusa pastas de sistema como `C:\Program Files (x86)`, então não dá para lembrar a pasta no local padrão da GOG.)

### Ideias para depois
- [ ] Controles de toque para celular e tablet, e carregar o jogo a partir de um ZIP
- [ ] Cheats personalizados no próprio motor

**Licença:** GPL v2 ou posterior (veja `COPYING`). Projeto original: [mecirt/7k2](https://github.com/mecirt/7k2).
