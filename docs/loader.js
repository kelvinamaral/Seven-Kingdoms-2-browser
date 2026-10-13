/*
 * Loader for the WebAssembly build of Seven Kingdoms II.
 *
 * Lets the player pick the folder of THEIR OWN copy of the game, copies the
 * files the engine needs into the in-memory file system of this page (nothing
 * is uploaded anywhere), then starts the engine. Saves and the config file are
 * kept in the browser's IndexedDB.
 */
(function () {
  'use strict';

  // ---------------------------------------------------------------- texts
  var T = {
    pt: {
      pick_prompt: 'Selecione a pasta do jogo.',
      scanning: 'Lendo a lista de arquivos…',
      found_root: 'Jogo encontrado',
      files: 'arquivos',
      missing_core: 'Esta pasta não parece conter os arquivos do jogo. Faltam:',
      hint_root: 'Escolha a pasta onde está o jogo (a que contém as subpastas "Resource", "Sprite", "Image"…). Se a sua edição guarda os dados em outra pasta, procure por "Resource/pal_std.res".',
      missing_opt: 'Arquivos esperados que não foram encontrados (o jogo pode falhar):',
      loading: 'Carregando', starting: 'Iniciando o jogo…', ready: 'Pronto para jogar.',
      mem_note: 'Total a carregar', saved: 'Saves gravados no navegador.',
      hint_click: 'Clique no jogo para capturar o mouse. ESC libera o mouse.', hint_locked: 'Mouse capturado. Pressione ESC para liberar.',
      exp_done: 'Backup exportado (perfil, configurações e saves).', exp_none: 'Não há dados para exportar ainda.',
      imp_done: 'Importado: {n} arquivo(s). Recarregue a página para o perfil novo valer; os saves já aparecem no jogo.',
      imp_none: 'Nada para importar neste arquivo (use um .zip exportado aqui, ou arquivos .PRF/.DAT).',
      imp_err: 'Não foi possível importar: ',
      wipe_ask: 'Apagar o perfil, os saves e as configurações guardados neste navegador?', wiped: 'Dados salvos apagados.',
      err_runtime: 'O motor do jogo ainda está carregando. Aguarde um instante e tente de novo.',
      err_fatal: 'O jogo parou por um erro. Veja o registro técnico e recarregue a página.',
      ended: 'O jogo terminou. Recarregue a página para jogar de novo.',
      no_dir: 'Este navegador não permite selecionar pastas. Use um navegador atual (Chrome, Edge, Firefox ou Safari).',
      empty: 'Nenhum arquivo foi recebido.',
      hide_log: 'Ocultar registro', show_log: 'Registro',
      err_file: 'Esta página foi aberta direto do arquivo (file://) e o navegador bloqueia o motor do jogo desse jeito. Abra pelo endereço do site publicado ou por um servidor local (por exemplo: python -m http.server na pasta do jogo compilado, depois http://localhost:8000).',
      err_engine: 'O motor do jogo (arquivo .wasm) não carregou. Veja o registro técnico; se você abriu o molde "shell.template.html" em vez do site compilado, use o site publicado ou a pasta "out".'
    },
    en: {
      pick_prompt: 'Select the game folder.',
      scanning: 'Reading the file list…',
      found_root: 'Game found',
      files: 'files',
      missing_core: 'This folder does not seem to contain the game files. Missing:',
      hint_root: 'Pick the folder that holds the game (the one with the "Resource", "Sprite", "Image"… sub-folders). If your edition keeps the data elsewhere, look for "Resource/pal_std.res".',
      missing_opt: 'Expected files that were not found (the game may fail):',
      loading: 'Loading', starting: 'Starting the game…', ready: 'Ready to play.',
      mem_note: 'Total to load', saved: 'Saves written to the browser.',
      hint_click: 'Click the game to capture the mouse. ESC releases it.', hint_locked: 'Mouse captured. Press ESC to release it.',
      exp_done: 'Backup exported (profile, settings and saves).', exp_none: 'There is no data to export yet.',
      imp_done: 'Imported {n} file(s). Reload the page for a new profile to take effect; saves show up in the game right away.',
      imp_none: 'Nothing to import in this file (use a .zip exported here, or .PRF/.DAT files).',
      imp_err: 'Could not import: ',
      wipe_ask: 'Erase your profile, saves and settings stored in this browser?', wiped: 'Saved data erased.',
      err_runtime: 'The game engine is still loading. Wait a moment and try again.',
      err_fatal: 'The game stopped because of an error. See the technical log and reload the page.',
      ended: 'The game has ended. Reload the page to play again.',
      no_dir: 'This browser cannot select folders. Use a current Chrome, Edge, Firefox or Safari.',
      empty: 'No files were received.',
      hide_log: 'Hide log', show_log: 'Log',
      err_file: 'This page was opened straight from a file (file://) and the browser blocks the game engine that way. Open the published site address or use a local server (e.g. python -m http.server in the built folder, then http://localhost:8000).',
      err_engine: 'The game engine (.wasm) did not load. See the technical log; if you opened the "shell.template.html" template instead of the built site, use the published site or the "out" folder.'
    }
  };
  var DICT_UI = {
    en: {
      title: 'Seven Kingdoms II in the browser',
      subtitle: 'The game engine (open source, GPL) compiled to WebAssembly. The game files are not included.',
      how_h: 'How it works',
      how_p: 'To play, you point to the folder of a legitimate copy of the game that is already on your computer (for example the GOG or Steam install). The files are read by your own browser and stay only in the memory of this tab: nothing is sent to any server.',
      pick_h: '1. Choose the game folder', drop_p: 'Drag the game install folder here', or: 'or',
      pick_btn: 'Select folder…',
      opt_music: 'Load the music (uses a lot of memory; untick it if the browser struggles)',
      opt_persist: 'Keep profile and saves in this browser (persistence)', wipe_btn: 'Erase saved data (start from zero)',
      opt_capture: 'Capture the mouse (ESC releases it)',
      cheats: 'Cheats',
      export_btn: 'Export saves', import_btn: 'Import saves',
      start: 'Play', notes_h: 'Notes',
      n_saves: 'Saved games and settings are kept in this browser\'s storage (IndexedDB), on this computer.',
      n_mp: 'Multiplayer and intro videos are not available in the web version.',
      n_res: 'The resolution is fixed at 800×600 and the image is scaled to fit the window.',
      n_legit: 'Only works with a legitimately purchased copy of the game. No game files are provided here.',
      n_unofficial: 'Unofficial fan project, not affiliated with Enlight Software. \u201cSeven Kingdoms\u201d is a trademark of Enlight Software.',
      n_gog: 'Tested so far with the GOG version, which is the recommended one. The Steam version may work, but has not been verified.',
      log_h: 'Technical log', fullscreen: 'Fullscreen', save_now: 'Write saves to browser', show_log: 'Log'
    }
  };

  // English is the default; the choice is remembered in the browser (if allowed).
  var lang = 'en';
  try { var saved = localStorage.getItem('sk2-lang'); if (saved === 'pt' || saved === 'en') lang = saved; } catch (e) {}
  function tr(k) { return (T[lang] && T[lang][k]) || T.en[k] || k; }

  function $(id) { return document.getElementById(id); }

  // The HTML holds the Portuguese texts; they are kept in data-pt so both languages can be switched at will.
  function applyUiLanguage() {
    document.documentElement.lang = lang === 'pt' ? 'pt-BR' : 'en';
    var nodes = document.querySelectorAll('[data-t]');
    for (var i = 0; i < nodes.length; i++) {
      var n = nodes[i];
      if (n.getAttribute('data-pt') === null) n.setAttribute('data-pt', n.textContent);
      var en = DICT_UI.en[n.getAttribute('data-t')];
      n.textContent = (lang === 'en' && en) ? en : n.getAttribute('data-pt');
    }
    document.title = 'Seven Kingdoms II — WebAssembly';
    var b = $('langBtn');
    if (b) {                                  // the button names the OTHER language
      b.textContent = lang === 'en' ? 'PT' : 'EN';
      b.setAttribute('aria-label', lang === 'en' ? 'Mudar para português' : 'Switch to English');
      b.title = b.getAttribute('aria-label');
    }
  }

  function setLanguage(l) {
    lang = l;
    try { localStorage.setItem('sk2-lang', l); } catch (e) {}
    applyUiLanguage();
    if (cheatOpen) buildCheatPanel();
    if (picked) renderCheck(picked);          // re-render the file check in the new language
  }

  // ------------------------------------------------------------- constants
  // Folders the engine reads. Movie/ and Save/ are deliberately not copied.
  var DATA_DIRS = ['resource', 'sprite', 'firm', 'firmsml', 'sound', 'image',
                   'music', 'campaign', 'tutorial', 'scenario'];
  // Without these the game cannot start at all.
  var CORE = ['resource/pal_std.res', 'resource/a_wave1.res', 'resource/a_wave2.res', 'resource/i_menu.res',
              'resource/t_basic.res', 'resource/cursor.res',
              'resource/i_button.res', 'image/halfame1.jpg'];
  // Other files the engine opens by name (from the source code).
  var EXPECTED = ['resource/credit.res', 'resource/fnt_std.res', 'resource/hotkey.res', 'resource/i_firmdi.res', 'resource/i_f_curr.res', 'resource/i_h_curr.res', 'resource/i_race.res', 'resource/i_raw.res', 'resource/i_snow.res', 'resource/i_town.res', 'resource/i_twall.res', 'resource/i_unitgi.res', 'resource/i_unitki.res', 'resource/i_unitli.res', 'resource/i_unitsi.res', 'resource/i_unitti.res', 'resource/i_unitui.res', 'resource/i_unitvi.res', 'resource/palfirm2.res', 'resource/palfirmd.res', 'resource/pal_firm.res', 'resource/tut_intr.res', 'resource/tut_text.res', 'resource/expremap.res', 'resource/help.res', 'resource/tips.res', 'resource/tut_list.res', 'resource/i_itemb.res', 'resource/i_itemc.res', 'resource/i_itemi.res', 'resource/i_itemu.res', 'resource/i_rawpl.res', 'resource/i_rawps.res', 'resource/i_rawri.res', 'resource/i_rawrl.res', 'resource/i_rawrs.res', 'resource/t_endc.res', 'resource/t_item.res', 'resource/t_reps.res', 'resource/t_sedit.res', 'resource/t_tutor.res',
                  'resource/i_icon.res', 'resource/i_if.res', 'resource/i_gameif.res',
                  'resource/i_spict.res', 'resource/tut_pict.res',
                  'resource/pal_spr.res', 'resource/tersub.res',
                  'resource/t_camp.res', 'resource/t_firm.res', 'resource/t_unit.res',
                  'resource/t_gmenu.res', 'resource/t_news.res', 'resource/t_talk.res',
                  'campaign/east.txr', 'tutorial/standard.tut', 'scenario/scenario.sys'];
  var GAME_DIR = '/game';
  var PERSIST_DIR = '/persist';

  // ----------------------------------------------------------------- state
  var runtimeIsReady = false;
  var runtimeWaiters = [];
  var picked = null;        // { entries: [{ path, size, getFile() }], root, files, bytes }
  var started = false;
  var logLines = [];

  // ------------------------------------------------------------------- log
  function log(text) {
    var line = String(text);
    logLines.push(line);
    if (logLines.length > 3000) logLines.splice(0, logLines.length - 3000);
    if (window.console) console.log(line);
    var a = $('log'), bx = $('logbox'), b = $('setupLog');
    if (a && bx && !bx.hidden) { a.textContent = logLines.join('\n'); a.scrollTop = a.scrollHeight; }
    if (b) b.textContent = logLines.slice(-60).join('\n');
  }

  // ---- mouse capture (Pointer Lock): keeps the pointer inside the game and hides the system cursor
  var hintTimer = null;
  function captureWanted() { var o = $('optCapture'); return !o || o.checked; }
  function isLocked() { return document.pointerLockElement === $('canvas'); }
  function requestCapture() {
    var c = $('canvas');
    if (!started || !captureWanted() || cheatOpen || isLocked() || !c.requestPointerLock) return;
    try { var r = c.requestPointerLock(); if (r && r.catch) r.catch(function () {}); } catch (e) {}
  }
  function showHint(text, autoHideMs) {
    var h = $('mouseHint');
    clearTimeout(hintTimer);
    if (!text) { h.hidden = true; return; }
    h.textContent = text; h.hidden = false; h.classList.remove('fade');
    if (autoHideMs) hintTimer = setTimeout(function () {
      h.classList.add('fade');
      hintTimer = setTimeout(function () { h.hidden = true; }, 500);
    }, autoHideMs);
  }
  var relockPending = false, selfExit = false, quietLock = false;
  // Called by the engine when it shows (dialogs) or hides (normal play) the system cursor.
  function engineCursor(show) {
    var c = $('canvas');
    if (!c) return;
    c.style.cursor = show ? 'default' : 'none';
    if (show) {
      if (isLocked()) { relockPending = true; selfExit = true; document.exitPointerLock(); }
    } else if (relockPending) {
      relockPending = false; quietLock = true;
      requestCapture();
      setTimeout(function () { quietLock = false; }, 1500);
    }
  }

  function updateMouseHint() {
    if (!started) return;
    if (isLocked()) showHint(tr('hint_locked'), 3000);
    else if (captureWanted() && !cheatOpen) showHint(tr('hint_click'), 0);
    else showHint('');
  }
  function setupMouseCapture() {
    try { if (localStorage.getItem('sk2-capture') === '0') $('optCapture').checked = false; } catch (e) {}
    $('canvas').addEventListener('mousedown', function () { requestCapture(); });
    document.addEventListener('pointerlockchange', function () {
      if (!isLocked() && selfExit) { selfExit = false; return; }		// released by the game for a dialog
      if (isLocked() && quietLock) { quietLock = false; return; }	// re-captured after a dialog
      updateMouseHint();
      if (!isLocked()) $('canvas').focus();
    });
    $('optCapture').addEventListener('change', function () {
      try { localStorage.setItem('sk2-capture', captureWanted() ? '1' : '0'); } catch (e) {}
      if (!captureWanted() && isLocked()) document.exitPointerLock();
      updateMouseHint();
    });
    updateMouseHint();
  }

  // ---- cheats panel: replays the game's own cheat key combos (Ctrl/Alt + key)
  var cheatOpen = false, cheatBusy = false, cheatCancel = false;
  function L(pt, en) { return lang === 'pt' ? pt : en; }
  var KC = { ctrl: [17, 'Control', 'ControlLeft'], alt: [18, 'Alt', 'AltLeft'], shift: [16, 'Shift', 'ShiftLeft'] };
  function sleep(ms) { return new Promise(function (r) { setTimeout(r, ms); }); }
  function fireKey(type, key, code, keyCode, mods) {
    var ev = new KeyboardEvent(type, { key: key, code: code, bubbles: true, cancelable: true,
      ctrlKey: mods.indexOf('ctrl') >= 0, altKey: mods.indexOf('alt') >= 0, shiftKey: mods.indexOf('shift') >= 0 });
    // keyCode / which are what the engine's SDL layer reads; the constructor cannot set them
    try { Object.defineProperty(ev, 'keyCode', { get: function () { return keyCode; } });
          Object.defineProperty(ev, 'which', { get: function () { return keyCode; } }); } catch (e) {}
    document.dispatchEvent(ev);
  }
  // Presses `mods` + key `count` times (modifiers stay held, so the game sees them on every press).
  function sendCombo(mods, key, keyCode, count, status) {
    var gap = count > 1 ? 30 : 70, i = 0;
    var p = Promise.resolve();
    mods.forEach(function (m) { p = p.then(function () { fireKey('keydown', KC[m][1], KC[m][2], KC[m][0], mods); return sleep(70); }); });
    function press() {
      if (i >= count || cheatCancel) return Promise.resolve();
      i++;
      if (status && count > 1) status(i + '/' + count);
      fireKey('keydown', key, 'Key' + key.toUpperCase(), keyCode, mods);
      return sleep(gap).then(function () { fireKey('keyup', key, 'Key' + key.toUpperCase(), keyCode, mods); return sleep(gap); }).then(press);
    }
    p = p.then(press);
    mods.slice().reverse().forEach(function (m) { p = p.then(function () { fireKey('keyup', KC[m][1], KC[m][2], KC[m][0], []); return sleep(40); }); });
    return p;
  }
  function typeShifted(seq) {		// seq: list of [key, keyCode], each pressed with Shift
    var p = Promise.resolve();
    p = p.then(function () { fireKey('keydown', 'Shift', 'ShiftLeft', 16, ['shift']); return sleep(70); });
    seq.forEach(function (k) {
      p = p.then(function () { fireKey('keydown', k[0], 'Digit' + k[0], k[1], ['shift']); return sleep(40); })
           .then(function () { fireKey('keyup', k[0], 'Digit' + k[0], k[1], ['shift']); return sleep(40); });
    });
    return p.then(function () { fireKey('keyup', 'Shift', 'ShiftLeft', 16, []); });
  }

  function cheatDefs() {
    return [
      { h: L('Mapa e tecnologia', 'Map and technology'), items: [
        { t: L('Revelar o mapa', 'Reveal the map'), m: ['ctrl'], k: 'm', c: 77 },
        { t: L('Todas as tecnologias', 'All technologies'), m: ['ctrl'], k: 't', c: 84 } ] },
      { h: L('Recursos', 'Resources'), items: [
        { t: L('+1000 de ouro', '+1000 gold'), m: ['ctrl'], k: 'c', c: 67, x: 100 },
        { t: L('−1000 de ouro', '−1000 gold'), m: ['alt', 'ctrl'], k: 'x', c: 88, x: 100 },
        { t: L('+1000 de comida', '+1000 food'), m: ['ctrl'], k: '\\', c: 220, x: 100 },
        { t: L('−1000 de comida', '−1000 food'), m: ['alt', 'ctrl'], k: 'c', c: 67, x: 100 } ] },
      { h: L('Cidade e edifícios (selecione antes no jogo)', 'Town and buildings (select in game first)'), items: [
        { t: L('+10 de população', '+10 population'), m: ['ctrl'], k: ';', c: 186, x: 10 },
        { t: L('Encher a Sede do Poder', 'Fill the Seat of Power'), m: ['ctrl'], k: '=', c: 187 },
        { t: L('+20 de dano no edifício', '+20 damage on building'), m: ['alt', 'ctrl'], k: 'j', c: 74, x: 10 },
        { t: L('−20 de dano no edifício', '−20 damage on building'), m: ['alt', 'ctrl'], k: 'k', c: 75, x: 10 } ] },
      { h: L('Reputação (cenários)', 'Reputation (scenarios)'), items: [
        { t: L('+10 de reputação', '+10 reputation'), m: ['alt', 'ctrl'], k: 'r', c: 82, x: 10 },
        { t: L('−10 de reputação', '−10 reputation'), m: ['alt', 'ctrl'], k: 'e', c: 69, x: 10 } ] },
      { h: L('Modos (liga/desliga)', 'Toggles'), items: [
        { t: L('Rei imortal', 'Immortal king'), m: ['ctrl'], k: 'u', c: 85 },
        { t: L('Construção rápida', 'Fast build'), m: ['ctrl'], k: 'z', c: 90 },
        { t: L('Mensagens de depuração', 'Debug messages'), m: ['ctrl'], k: 'a', c: 65 },
        { t: L('Informações da IA', 'AI information'), m: ['ctrl'], k: 'd', c: 68 },
        { t: L('Zerar pontuação econômica', 'Reset economic score'), m: ['ctrl'], k: 'j', c: 74 } ] }
    ];
  }

  function buildCheatPanel() {
    var p = $('cheatPanel');
    p.textContent = '';
    function el(tag, cls, txt) { var e = document.createElement(tag); if (cls) e.className = cls; if (txt) e.textContent = txt; return e; }
    p.appendChild(el('p', 'note', L(
      'Estes botões enviam os atalhos de trapaça do próprio jogo. Funcionam no Editor de Cenários; em partidas normais, ative antes o modo cheat. O mouse fica solto enquanto este painel está aberto.',
      'These buttons send the game\u2019s own cheat shortcuts. They work in the Scenario Editor; in normal games enable cheat mode first. The mouse stays released while this panel is open.')));
    var status = el('span', 'small', '');
    function run(fn) {
      if (cheatBusy) { cheatCancel = true; return; }
      cheatBusy = true; cheatCancel = false;
      fn().then(function () { cheatBusy = false; status.textContent = cheatCancel ? L('Cancelado.', 'Cancelled.') : ''; });
    }
    cheatDefs().forEach(function (g) {
      p.appendChild(el('h4', '', g.h));
      var row = el('div', 'grp');
      g.items.forEach(function (it) {
        var box = el('span', 'cb');
        var b = el('button', 'secondary', it.t); b.type = 'button';
        b.addEventListener('click', function () { run(function () { return sendCombo(it.m, it.k, it.c, 1); }); });
        box.appendChild(b);
        if (it.x) {
          var bx = el('button', 'secondary x', '\u00d7' + it.x); bx.type = 'button';
          bx.title = L('Repetir ', 'Repeat ') + it.x + '\u00d7';
          bx.addEventListener('click', function () { run(function () { return sendCombo(it.m, it.k, it.c, it.x, function (t) { status.textContent = t; }); }); });
          box.appendChild(bx);
        }
        row.appendChild(box);
      });
      p.appendChild(row);
    });
    p.appendChild(el('h4', '', L('Partidas normais', 'Normal games')));
    var row2 = el('div', 'grp');
    var en = el('button', 'secondary', L('Ativar modo cheat (!!##%%&&)', 'Enable cheat mode (!!##%%&&)')); en.type = 'button';
    en.addEventListener('click', function () { run(function () { return typeShifted([['1', 49], ['1', 49], ['3', 51], ['3', 51], ['5', 53], ['5', 53], ['7', 55], ['7', 55]]); }); });
    row2.appendChild(en);
    p.appendChild(row2);
    var foot = el('div', 'note', ''); foot.appendChild(status); p.appendChild(foot);
  }

  function toggleCheats() {
    cheatOpen = !cheatOpen;
    if (cheatOpen) { buildCheatPanel(); if (isLocked()) document.exitPointerLock(); }
    $('cheatPanel').hidden = !cheatOpen;
    updateMouseHint();
  }

  // ---- export / import of saves, profile and settings (a plain ZIP, no external library)
  var crcTable = null;
  function crc32(buf) {
    if (!crcTable) {
      crcTable = new Uint32Array(256);
      for (var n = 0; n < 256; n++) { var c = n; for (var k = 0; k < 8; k++) c = c & 1 ? 0xEDB88320 ^ (c >>> 1) : c >>> 1; crcTable[n] = c >>> 0; }
    }
    var crc = 0xFFFFFFFF;
    for (var i = 0; i < buf.length; i++) crc = crcTable[(crc ^ buf[i]) & 0xFF] ^ (crc >>> 8);
    return (crc ^ 0xFFFFFFFF) >>> 0;
  }
  function collectUserFiles() {		// [{name, data}] : root profile/config files and everything under Save/
    var out = [];
    rootFiles().forEach(function (n) { out.push({ name: n, data: FS.readFile(GAME_DIR + '/' + n) }); });
    (function walk(dir, rel) {
      var names = [];
      try { names = FS.readdir(dir); } catch (e) { return; }
      names.forEach(function (n) {
        if (n === '.' || n === '..') return;
        var p = dir + '/' + n, r = rel + '/' + n, st;
        try { st = FS.stat(p); } catch (e) { return; }
        if (FS.isDir(st.mode)) walk(p, r); else out.push({ name: r, data: FS.readFile(p) });
      });
    })(GAME_DIR + '/Save', 'Save');
    userDirFiles().forEach(function (f) { out.push({ name: f.rel, data: FS.readFile(f.path) }); });
    return out;
  }
  function makeZip(files) {
    var enc = new TextEncoder(), parts = [], central = [], offset = 0;
    function u16(v) { return [v & 255, (v >> 8) & 255]; }
    function u32(v) { return [v & 255, (v >>> 8) & 255, (v >>> 16) & 255, (v >>> 24) & 255]; }
    var d = new Date(), dt = ((d.getHours() << 11) | (d.getMinutes() << 5) | (d.getSeconds() >> 1)),
        dd = (((d.getFullYear() - 1980) << 9) | ((d.getMonth() + 1) << 5) | d.getDate());
    files.forEach(function (f) {
      var name = enc.encode(f.name), crc = crc32(f.data), size = f.data.length;
      var head = new Uint8Array([].concat(u32(0x04034b50), u16(20), u16(0x0800), u16(0), u16(dt), u16(dd),
        u32(crc), u32(size), u32(size), u16(name.length), u16(0)));
      parts.push(head, name, f.data);
      central.push(new Uint8Array([].concat(u32(0x02014b50), u16(20), u16(20), u16(0x0800), u16(0), u16(dt), u16(dd),
        u32(crc), u32(size), u32(size), u16(name.length), u16(0), u16(0), u16(0), u16(0), u32(0), u32(offset))), name);
      offset += head.length + name.length + size;
    });
    var cdSize = central.reduce(function (s, a) { return s + a.length; }, 0);
    var end = new Uint8Array([].concat(u32(0x06054b50), u16(0), u16(0), u16(files.length), u16(files.length), u32(cdSize), u32(offset), u16(0)));
    return new Blob(parts.concat(central, [end]), { type: 'application/zip' });
  }
  function exportSaves() {
    if (!started) return;
    var files = collectUserFiles();
    if (!files.length) { $('gameStatus').textContent = tr('exp_none'); return; }
    var a = document.createElement('a');
    a.href = URL.createObjectURL(makeZip(files));
    a.download = 'seven-kingdoms-2-backup-' + new Date().toISOString().slice(0, 10) + '.zip';
    document.body.appendChild(a); a.click(); document.body.removeChild(a);
    setTimeout(function () { URL.revokeObjectURL(a.href); }, 5000);
    $('gameStatus').textContent = tr('exp_done');
  }
  function inflateRaw(bytes) {
    var ds = new DecompressionStream('deflate-raw');
    return new Response(new Blob([bytes]).stream().pipeThrough(ds)).arrayBuffer().then(function (b) { return new Uint8Array(b); });
  }
  function readZip(buf) {		// -> Promise<[{name, data}]>
    var v = new DataView(buf.buffer, buf.byteOffset, buf.byteLength), dec = new TextDecoder(), i = buf.length - 22;
    for (; i >= 0 && v.getUint32(i, true) !== 0x06054b50; i--) {}
    if (i < 0) return Promise.reject(new Error('not a zip file'));
    var count = v.getUint16(i + 10, true), pos = v.getUint32(i + 16, true), jobs = [];
    for (var n = 0; n < count; n++) {
      if (v.getUint32(pos, true) !== 0x02014b50) break;
      var method = v.getUint16(pos + 10, true), csize = v.getUint32(pos + 20, true),
          nlen = v.getUint16(pos + 28, true), elen = v.getUint16(pos + 30, true), clen = v.getUint16(pos + 32, true),
          lho = v.getUint32(pos + 42, true), name = dec.decode(buf.subarray(pos + 46, pos + 46 + nlen));
      pos += 46 + nlen + elen + clen;
      if (/\/$/.test(name)) continue;
      var ds = lho + 30 + v.getUint16(lho + 26, true) + v.getUint16(lho + 28, true);
      var raw = buf.subarray(ds, ds + csize);
      jobs.push((method === 0 ? Promise.resolve(raw) : method === 8 ? inflateRaw(raw) : Promise.reject(new Error('unsupported zip method')))
        .then((function (nm) { return function (data) { return { name: nm, data: data }; }; })(name)));
    }
    return Promise.all(jobs);
  }
  function safeDest(name) {		// only Save/** and profile/config files at the root; no path tricks
    name = String(name).replace(/\\/g, '/').replace(/^\.?\/+/, '');
    if (name.split('/').some(function (p) { return p === '..' || p === ''; })) return null;
    var parts = name.split('/');
    if (parts.length === 1) return ROOT_FILES.test(parts[0]) ? parts[0] : null;
    var top = parts[0].toLowerCase();
    if (top === 'save' || top === 'scenario' || top === 'campaign') {
      parts[0] = top.charAt(0).toUpperCase() + top.slice(1);
      return parts.join('/');
    }
    return null;
  }
  function importSaves(fileList) {
    var jobs = [];
    Array.prototype.forEach.call(fileList, function (f) {
      jobs.push(f.arrayBuffer().then(function (ab) {
        var u8 = new Uint8Array(ab);
        return /\.zip$/i.test(f.name) ? readZip(u8) : [{ name: f.name, data: u8 }];
      }));
    });
    return Promise.all(jobs).then(function (lists) {
      var n = 0;
      lists.forEach(function (list) {
        list.forEach(function (e) {
          var dest = safeDest(e.name);
          if (!dest) return;
          var full = GAME_DIR + '/' + dest, dir = full.slice(0, full.lastIndexOf('/'));
          FS.mkdirTree(dir);
          FS.writeFile(full, e.data);
          userSet[dest.toLowerCase()] = 1;
          n++;
        });
      });
      if (!n) { $('gameStatus').textContent = tr('imp_none'); return; }
      return persistNow().then(function () { $('gameStatus').textContent = tr('imp_done').replace('{n}', n); });
    }).catch(function (e) { $('gameStatus').textContent = tr('imp_err') + (e && e.message ? e.message : e); });
  }

  function copyLog(btn) {
    var text = logLines.join('\n');
    function done() {
      var old = btn.textContent;
      btn.textContent = '\u2713'; btn.classList.add('ok');
      setTimeout(function () { btn.textContent = old; btn.classList.remove('ok'); }, 1500);
    }
    function fallback() {
      var ta = document.createElement('textarea');
      ta.value = text; ta.style.position = 'fixed'; ta.style.opacity = '0';
      document.body.appendChild(ta); ta.select();
      try { document.execCommand('copy'); done(); } catch (e) { log('copy: ' + e); }
      document.body.removeChild(ta);
    }
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(text).then(done, fallback);
    } else fallback();
  }

  function showError(msg) {
    var e = $('error');
    e.textContent = msg;
    e.hidden = false;
  }
  function clearError() { $('error').hidden = true; }

  // ------------------------------------------------------- file collection
  function entryFromFile(file, path) {
    return { path: path, size: file.size, getFile: function () { return Promise.resolve(file); } };
  }

  function collectFromInput(fileList) {
    var out = [];
    for (var i = 0; i < fileList.length; i++) {
      var f = fileList[i];
      out.push(entryFromFile(f, f.webkitRelativePath || f.name));
    }
    return Promise.resolve(out);
  }

  function readAllEntries(reader) {
    return new Promise(function (resolve, reject) {
      var all = [];
      (function next() {
        reader.readEntries(function (batch) {
          if (!batch.length) return resolve(all);
          all = all.concat(Array.prototype.slice.call(batch));
          next();
        }, reject);
      })();
    });
  }

  function walkEntry(entry, prefix, out) {
    if (entry.isFile) {
      return new Promise(function (resolve) {
        entry.file(function (file) { out.push(entryFromFile(file, prefix + entry.name)); resolve(); },
                   function () { resolve(); });
      });
    }
    if (entry.isDirectory) {
      return readAllEntries(entry.createReader()).then(function (children) {
        var chain = Promise.resolve();
        children.forEach(function (c) {
          chain = chain.then(function () { return walkEntry(c, prefix + entry.name + '/', out); });
        });
        return chain;
      });
    }
    return Promise.resolve();
  }

  function collectFromDrop(dataTransfer) {
    var out = [];
    var items = dataTransfer.items ? Array.prototype.slice.call(dataTransfer.items) : [];
    var entries = items.map(function (it) { return it.webkitGetAsEntry && it.webkitGetAsEntry(); }).filter(Boolean);
    if (!entries.length) return collectFromInput(dataTransfer.files || []);
    var chain = Promise.resolve();
    entries.forEach(function (e) { chain = chain.then(function () { return walkEntry(e, '', out); }); });
    return chain.then(function () { return out; });
  }

  // Find where the game's own root lies inside what the player gave us.
  function analyse(entries) {
    var lower = entries.map(function (e) { return e.path.toLowerCase(); });
    var marker = 'resource/pal_std.res';
    var root = null;
    for (var i = 0; i < lower.length; i++) {
      var p = lower[i];
      if (p === marker) { root = ''; break; }
      if (p.length > marker.length && p.slice(-marker.length - 1) === '/' + marker) {
        root = entries[i].path.slice(0, entries[i].path.length - marker.length);
        break;
      }
    }

    var info = { root: root, files: [], bytes: 0, present: {}, missingCore: [], missingExpected: [] };
    if (root === null) {
      info.missingCore = CORE.slice();
      return info;
    }
    var rootLen = root.length;
    var rootLower = root.toLowerCase();
    entries.forEach(function (e) {
      if (e.path.toLowerCase().indexOf(rootLower) !== 0) return;
      var rel = e.path.slice(rootLen);
      var top = rel.split('/')[0].toLowerCase();
      if (DATA_DIRS.indexOf(top) < 0) return;
      info.present[rel.toLowerCase()] = true;
      info.files.push({ rel: rel, entry: e });
      info.bytes += e.size;
    });
    info.missingCore = CORE.filter(function (f) { return !info.present[f]; });
    info.missingExpected = EXPECTED.filter(function (f) { return !info.present[f]; });
    return info;
  }

  function fmtBytes(n) {
    if (n > 1073741824) return (n / 1073741824).toFixed(2) + ' GB';
    if (n > 1048576) return (n / 1048576).toFixed(0) + ' MB';
    return Math.max(1, Math.round(n / 1024)) + ' KB';
  }

  function renderCheck(info) {
    var box = $('check');
    box.hidden = false;
    box.innerHTML = '';
    function add(cls, html) {
      var d = document.createElement('div');
      d.className = 'msg ' + cls;
      d.innerHTML = html;
      box.appendChild(d);
    }
    function esc(s) { return s.replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); }

    if (info.root === null || info.missingCore.length) {
      add('bad', esc(tr('missing_core')) + '<ul class="files">' +
        info.missingCore.map(function (f) { return '<li>' + esc(f) + '</li>'; }).join('') +
        '</ul><span class="small">' + esc(tr('hint_root')) + '</span>');
      $('startBtn').disabled = true;
      return;
    }
    add('ok', esc(tr('found_root')) + ': ' + info.files.length + ' ' + esc(tr('files')) +
      ' (' + fmtBytes(info.bytes) + ').');
    if (info.missingExpected.length) {
      add('bad', esc(tr('missing_opt')) + '<ul class="files">' +
        info.missingExpected.map(function (f) { return '<li>' + esc(f) + '</li>'; }).join('') + '</ul>');
    }
    $('startBtn').disabled = false;
  }

  function onPicked(entries) {
    clearError();
    $('startBtn').disabled = true;
    if (!entries.length) { showError(tr('empty')); return; }
    log(tr('scanning') + ' (' + entries.length + ')');
    picked = analyse(entries);
    log('root="' + picked.root + '", data files=' + picked.files.length);
    renderCheck(picked);
  }

  // ------------------------------------------------------------ file system
  function installCaseInsensitiveLookup() {
    // The game was written for Windows (case-insensitive) and asks for names
    // such as "Music/BKMUSIC1.WAV" even if the file is stored in lower case.
    // Make directory lookups in the in-memory file system case-insensitive.
    var ops = FS.root.node_ops;
    if (ops.__ci) return;
    var original = ops.lookup;
    ops.lookup = function (parent, name) {
      try {
        return original.call(this, parent, name);
      } catch (e) {
        var wanted = String(name).toLowerCase();
        var contents = parent.contents || {};
        for (var key in contents) {
          if (key.toLowerCase() === wanted) return contents[key];
        }
        throw e;
      }
    };
    ops.__ci = true;
  }

  function syncfs(populate) {
    return new Promise(function (resolve) {
      FS.syncfs(populate, function (err) {
        if (err) log('IndexedDB: ' + err);
        resolve();
      });
    });
  }

  function exists(path) { return FS.analyzePath(path).exists; }

  function copyFile(from, to) {
    try {
      if (exists(from)) FS.writeFile(to, FS.readFile(from));
    } catch (e) { log('copy ' + from + ': ' + e); }
  }

  // Files the game writes in its working directory (not inside Save/): profile, config, hall of fame
  var ROOT_FILES = /^(config\.dat|hallfame\.dat|.+\.prf)$/i;
  var persistOn = true;

  function rootFiles() {
    try { return FS.readdir(GAME_DIR).filter(function (n) { return ROOT_FILES.test(n); }); }
    catch (e) { return []; }
  }

  // Files the player creates outside Save/ and the game folder root (e.g. Scenario/*.SCN, where the
  // Scenario Editor and auto-saves go): detected by modification time, plus anything restored/imported.
  var USER_DIRS = ['Scenario', 'Campaign'];
  var loadDoneTime = Infinity, userSet = {};
  function walkFiles(dir, rel, cb) {
    var names = [];
    try { names = FS.readdir(dir); } catch (e) { return; }
    names.forEach(function (n) {
      if (n === '.' || n === '..') return;
      var p = dir + '/' + n, r = rel ? rel + '/' + n : n, st;
      try { st = FS.stat(p); } catch (e) { return; }
      if (FS.isDir(st.mode)) walkFiles(p, r, cb); else cb(p, r, st);
    });
  }
  function userDirFiles() {		// [{rel, path}] for Scenario/ and Campaign/ files made by the player
    var out = [];
    var names = [];
    try { names = FS.readdir(GAME_DIR); } catch (e) { return out; }
    names.forEach(function (top) {
      if (USER_DIRS.indexOf(top.charAt(0).toUpperCase() + top.slice(1).toLowerCase()) < 0) return;
      walkFiles(GAME_DIR + '/' + top, top.charAt(0).toUpperCase() + top.slice(1).toLowerCase(), function (p, r, st) {
        if (userSet[r.toLowerCase()] || st.mtime.getTime() > loadDoneTime) out.push({ rel: r, path: p });
      });
    });
    return out;
  }

  var saving = false;
  function persistNow() {
    if (!started || saving || !persistOn) return Promise.resolve();
    saving = true;
    rootFiles().forEach(function (n) { copyFile(GAME_DIR + '/' + n, PERSIST_DIR + '/' + n); });
    userDirFiles().forEach(function (f) {
      var dest = PERSIST_DIR + '/u/' + f.rel;
      try { FS.mkdirTree(dest.slice(0, dest.lastIndexOf('/'))); } catch (e) {}
      copyFile(f.path, dest);
    });
    return syncfs(false).then(function () {		// one pass writes every IDBFS mount
      saving = false;
    });
  }

  function setupPersistence() {
    FS.mkdirTree(GAME_DIR + '/Save');
    FS.mkdirTree(PERSIST_DIR);
    if (!persistOn) return Promise.resolve();
    FS.mount(IDBFS, {}, GAME_DIR + '/Save');
    FS.mount(IDBFS, {}, PERSIST_DIR);
    return syncfs(true);
  }

  // called after the game files were copied, so the player's own data wins over the folder's
  function restorePersisted() {
    loadDoneTime = Date.now();
    if (!persistOn) return;
    try {
      FS.readdir(PERSIST_DIR).forEach(function (n) {
        if (ROOT_FILES.test(n)) copyFile(PERSIST_DIR + '/' + n, GAME_DIR + '/' + n);
      });
      if (exists(PERSIST_DIR + '/u')) walkFiles(PERSIST_DIR + '/u', '', function (p, r) {
        var dest = GAME_DIR + '/' + r;
        FS.mkdirTree(dest.slice(0, dest.lastIndexOf('/')));
        copyFile(p, dest);
        userSet[r.toLowerCase()] = 1;
      });
    } catch (e) { log('restore: ' + e); }
  }

  function wipeData() {
    if (!window.confirm(tr('wipe_ask'))) return;
    var names = [GAME_DIR + '/Save', PERSIST_DIR], left = names.length;
    names.forEach(function (n) {
      try {
        var r = indexedDB.deleteDatabase(n);
        r.onsuccess = r.onerror = r.onblocked = function () {
          if (--left === 0) showInfo(tr('wiped'));
        };
      } catch (e) { left--; }
    });
  }
  function showInfo(t) { $('progress').hidden = false; $('progressText').textContent = t; }

  function progress(done, total, label) {
    $('progress').hidden = false;
    $('barFill').style.width = (total ? (100 * done / total) : 0).toFixed(1) + '%';
    $('progressText').textContent = label + ' ' + fmtBytes(done) + ' / ' + fmtBytes(total);
  }

  function ensureDir(path, made) {
    var i = path.lastIndexOf('/');
    if (i < 0) return;
    var dir = path.slice(0, i);
    if (made[dir]) return;
    FS.mkdirTree(GAME_DIR + '/' + dir);
    made[dir] = true;
  }

  function copyGameFiles(info, withMusic) {
    var list = info.files.filter(function (f) {
      return withMusic || f.rel.split('/')[0].toLowerCase() !== 'music';
    });
    var total = list.reduce(function (s, f) { return s + f.entry.size; }, 0);
    var done = 0, made = {};
    var chain = Promise.resolve();
    list.forEach(function (f, idx) {
      chain = chain.then(function () {
        return f.entry.getFile().then(function (file) { return file.arrayBuffer(); }).then(function (buf) {
          ensureDir(f.rel, made);
          FS.writeFile(GAME_DIR + '/' + f.rel, new Uint8Array(buf));
          done += buf.byteLength;
          if (idx % 8 === 0 || buf.byteLength > 1048576) progress(done, total, tr('loading'));
        });
      });
    });
    return chain.then(function () { progress(total, total, tr('loading')); });
  }

  // ----------------------------------------------------------------- start
  function whenRuntimeReady() {
    if (runtimeIsReady) return Promise.resolve();
    return new Promise(function (resolve) { runtimeWaiters.push(resolve); });
  }

  function start() {
    if (!picked || started) return;
    clearError();
    if (!runtimeIsReady) $('progressText').textContent = tr('err_runtime'), $('progress').hidden = false;
    $('startBtn').disabled = true;
    $('pickBtn').disabled = true;
    var withMusic = $('optMusic').checked;
    persistOn = $('optPersist').checked;
    try { localStorage.setItem('sk2-persist', persistOn ? '1' : '0'); } catch (e) {}

    whenRuntimeReady().then(function () {
      installCaseInsensitiveLookup();
      FS.mkdirTree(GAME_DIR);
      return setupPersistence();
    }).then(function () {
      return copyGameFiles(picked, withMusic);
    }).then(function () {
      restorePersisted();
      picked = null;      // let the browser free the file handles
      $('progressText').textContent = tr('starting');
      document.body.classList.add('playing');
      $('game').classList.add('on');
      $('canvas').focus();
      FS.chdir(GAME_DIR);
      started = true;
      scheduleAutosave();
      updateMouseHint();
      // web_entry() runs the game's main(); with Asyncify the call resolves when the game exits
      Promise.resolve(Module.ccall('web_entry', 'number', [], [], { async: true })).then(function () {
        SevenKWeb.ended();
      }, function (e) {
        if (e && e.name === 'ExitStatus') SevenKWeb.ended(); else SevenKWeb.fatal(e && e.stack ? e.stack : e);
      });
    }).catch(function (e) {
      log('start failed: ' + (e && e.stack ? e.stack : e));
      document.body.classList.remove('playing');
      $('game').classList.remove('on');
      $('startBtn').disabled = false;
      $('pickBtn').disabled = false;
      var last = '';
      for (var i = logLines.length - 1; i >= 0 && !last; i--) if (/error|fail/i.test(logLines[i])) last = logLines[i];
      showError(last || String(e && e.message ? e.message : e));
    });
  }

  function scheduleAutosave() {
    setInterval(function () { persistNow(); }, 5000);
    document.addEventListener('visibilitychange', function () {
      if (document.visibilityState === 'hidden') persistNow();
    });
    window.addEventListener('pagehide', function () { persistNow(); });
  }

  // ------------------------------------------------------------------ keys
  function installKeyGuards() {
    // Keep the browser from scrolling / tabbing away while the game has focus.
    window.addEventListener('keydown', function (ev) {
      if (!started) return;
      if (ev.ctrlKey || ev.metaKey || ev.altKey) return;
      var k = ev.key;
      var block = k === 'Tab' || k === 'Backspace' || k === ' ' || k.indexOf('Arrow') === 0 ||
                  k === 'PageUp' || k === 'PageDown' || k === 'Home' || k === 'End' ||
                  /^F([1-9]|10)$/.test(k) || k === '/' || k === "'";
      if (block && !/^(INPUT|TEXTAREA|SELECT)$/.test((ev.target && ev.target.tagName) || '')) ev.preventDefault();
    }, true);
  }

  // ------------------------------------------------------------------- UI
  function wireUi() {
    var picker = $('picker'), drop = $('drop');
    $('langBtn').addEventListener('click', function () { setLanguage(lang === 'en' ? 'pt' : 'en'); });

    if (!('webkitdirectory' in picker)) showError(tr('no_dir'));

    $('pickBtn').addEventListener('click', function () { picker.click(); });
    drop.addEventListener('click', function (ev) { if (ev.target === drop) picker.click(); });
    drop.addEventListener('keydown', function (ev) {
      if (ev.key === 'Enter' || ev.key === ' ') { ev.preventDefault(); picker.click(); }
    });
    picker.addEventListener('change', function () {
      collectFromInput(picker.files).then(onPicked);
    });

    ['dragenter', 'dragover'].forEach(function (n) {
      drop.addEventListener(n, function (ev) { ev.preventDefault(); drop.classList.add('over'); });
    });
    ['dragleave', 'drop'].forEach(function (n) {
      drop.addEventListener(n, function (ev) { ev.preventDefault(); drop.classList.remove('over'); });
    });
    drop.addEventListener('drop', function (ev) {
      var dt = ev.dataTransfer;
      collectFromDrop(dt).then(onPicked);
    });
    // a file dropped next to the box must not make the browser open it
    window.addEventListener('dragover', function (ev) { ev.preventDefault(); });
    window.addEventListener('drop', function (ev) { ev.preventDefault(); });

    $('startBtn').addEventListener('click', start);
    $('wipeBtn').addEventListener('click', wipeData);
    $('cheatBtn').addEventListener('click', toggleCheats);
    $('exportBtn').addEventListener('click', exportSaves);
    $('importBtn').addEventListener('click', function () { $('importInput').value = ''; $('importInput').click(); });
    $('importInput').addEventListener('change', function () { if (this.files && this.files.length) importSaves(this.files); });
    Array.prototype.forEach.call(document.querySelectorAll('.copybtn'), function (btn) {
      btn.addEventListener('click', function () { copyLog(btn); });
    });
    try { if (localStorage.getItem('sk2-persist') === '0') $('optPersist').checked = false; } catch (e) {}

    setupMouseCapture();
    $('fsBtn').addEventListener('click', function () {
      var st = $('stage'), c = $('canvas');
      if (document.fullscreenElement) { document.exitFullscreen(); c.focus(); return; }
      var p = st.requestFullscreen ? st.requestFullscreen() : null;
      Promise.resolve(p).then(function () { requestCapture(); c.focus(); }, function () { c.focus(); });
    });
    $('saveBtn').addEventListener('click', function () {
      persistNow().then(function () { $('gameStatus').textContent = tr('saved'); $('canvas').focus(); });
    });
    $('logBtn').addEventListener('click', function () {
      var box = $('logbox'), l = $('log');
      box.hidden = !box.hidden;
      l.hidden = box.hidden;
      $('logBtn').textContent = box.hidden ? tr('show_log') : tr('hide_log');
      if (!box.hidden) { l.textContent = logLines.join('\n'); l.scrollTop = l.scrollHeight; }
    });
  }

  // ------------------------------------------------------------ public API
  window.SevenKWeb = {
    cursor: function (show) { engineCursor(show); },
    log: log,
    runtimeReady: function () {
      runtimeIsReady = true;
      runtimeWaiters.splice(0).forEach(function (r) { r(); });
      log('engine ready');
    },
    fatal: function (what) {
      log('FATAL: ' + what);
      $('gameStatus').textContent = tr('err_fatal');
    },
    ended: function () {
      $('gameStatus').textContent = tr('ended');
    }
  };

  window.addEventListener('error', function (ev) { log('error: ' + ev.message); });
  window.addEventListener('unhandledrejection', function (ev) { log('promise: ' + ev.reason); });

  document.addEventListener('DOMContentLoaded', function () {
    applyUiLanguage();
    wireUi();
    installKeyGuards();

    if (location.protocol === 'file:') {
      showError(tr('err_file'));
      $('pickBtn').disabled = true;
      $('startBtn').disabled = true;
      return;
    }
    // the engine normally reports in within a few seconds
    setTimeout(function () {
      if (!runtimeIsReady && !started) showError(tr('err_engine'));
    }, 20000);
  });
})();
