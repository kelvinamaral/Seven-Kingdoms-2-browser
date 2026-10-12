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
      start: 'Play', notes_h: 'Notes',
      n_saves: 'Saved games and settings are kept in this browser\'s storage (IndexedDB), on this computer.',
      n_mp: 'Multiplayer and intro videos are not available in the web version.',
      n_res: 'The resolution is fixed at 800×600 and the image is scaled to fit the window.',
      n_legit: 'Only works with a legitimately purchased copy of the game. No game files are provided here.',
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
    if (logLines.length > 400) logLines.splice(0, logLines.length - 400);
    if (window.console) console.log(line);
    var a = $('log'), b = $('setupLog');
    if (a && !a.hidden) { a.textContent = logLines.join('\n'); a.scrollTop = a.scrollHeight; }
    if (b) b.textContent = logLines.slice(-60).join('\n');
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

  var saving = false;
  function persistNow() {
    if (!started || saving) return Promise.resolve();
    saving = true;
    copyFile(GAME_DIR + '/CONFIG.DAT', PERSIST_DIR + '/CONFIG.DAT');
    return syncfs(false).then(function () {		// one pass writes every IDBFS mount
      saving = false;
    });
  }

  function setupPersistence() {
    FS.mkdirTree(GAME_DIR + '/Save');
    FS.mkdirTree(PERSIST_DIR);
    FS.mount(IDBFS, {}, GAME_DIR + '/Save');
    FS.mount(IDBFS, {}, PERSIST_DIR);
    return syncfs(true).then(function () {
      copyFile(PERSIST_DIR + '/CONFIG.DAT', GAME_DIR + '/CONFIG.DAT');
    });
  }

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

    whenRuntimeReady().then(function () {
      installCaseInsensitiveLookup();
      FS.mkdirTree(GAME_DIR);
      return setupPersistence();
    }).then(function () {
      return copyGameFiles(picked, withMusic);
    }).then(function () {
      picked = null;      // let the browser free the file handles
      $('progressText').textContent = tr('starting');
      document.body.classList.add('playing');
      $('game').classList.add('on');
      $('canvas').focus();
      FS.chdir(GAME_DIR);
      started = true;
      scheduleAutosave();
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
    setInterval(function () { persistNow(); }, 15000);
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

    $('fsBtn').addEventListener('click', function () {
      var c = $('canvas');
      if (document.fullscreenElement) document.exitFullscreen();
      else if (c.requestFullscreen) c.requestFullscreen();
      c.focus();
    });
    $('saveBtn').addEventListener('click', function () {
      persistNow().then(function () { $('gameStatus').textContent = tr('saved'); $('canvas').focus(); });
    });
    $('logBtn').addEventListener('click', function () {
      var l = $('log');
      l.hidden = !l.hidden;
      $('logBtn').textContent = l.hidden ? tr('show_log') : tr('hide_log');
      if (!l.hidden) { l.textContent = logLines.join('\n'); l.scrollTop = l.scrollHeight; }
    });
  }

  // ------------------------------------------------------------ public API
  window.SevenKWeb = {
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
