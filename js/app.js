/* CCS — app shell
 * Screens: setup (teacher puts the language in) -> play (class builds the story)
 * -> recap (the class reads back what they made).
 */
(function (ns) {
  'use strict';

  var R = ns.ruby, D = ns.data, JP = ns.jp, art = ns.art, audio = ns.audio;
  var STORE = 'ccs.config.v2';

  var config = null;
  var story = null;
  var ui = { script: 'furi', english: true, level: 'minimal', big: false, autoSpeak: true, preset: null };
  var lastScene = null;

  function $(sel, root) { return (root || document).querySelector(sel); }
  function $$(sel, root) { return Array.prototype.slice.call((root || document).querySelectorAll(sel)); }
  function el(tag, cls, html) {
    var n = document.createElement(tag);
    if (cls) n.className = cls;
    if (html != null) n.innerHTML = html;
    return n;
  }

  /* ---------------- line rendering ---------------- */
  function line(tokens) {
    if (ui.script === 'kana') {
      return '<span class="tk">' + R.escapeHtml(R.kana(tokens)) + '</span>';
    }
    return R.render(tokens, true);
  }

  function jpHtml(tokens) { return '<span class="jp">' + line(tokens) + '</span>'; }

  function speakTokens(tokens) { audio.speak(R.kana(tokens)); }

  function speakBtn(tokens) {
    var b = el('button', 'speak', '🔊');
    b.type = 'button';
    b.title = 'きく (listen)';
    b.onclick = function (e) { e.stopPropagation(); speakTokens(tokens); };
    return b;
  }

  /* ---------------- config storage ---------------- */
  function cloneConfig(c) { return JSON.parse(JSON.stringify(c)); }

  function loadConfig() {
    var fromUrl = readHash();
    if (fromUrl) return fromUrl;
    try {
      var raw = localStorage.getItem(STORE);
      if (raw) return JSON.parse(raw);
    } catch (e) {}
    return cloneConfig(D.DEFAULT_CONFIG);
  }

  function saveConfig() {
    try { localStorage.setItem(STORE, JSON.stringify(config)); } catch (e) {}
  }

  function readHash() {
    try {
      var h = location.hash.replace(/^#/, '');
      if (h.indexOf('pack=') !== 0) return null;
      var json = decodeURIComponent(escape(atob(h.slice(5))));
      return JSON.parse(json);
    } catch (e) { return null; }
  }

  function shareLink() {
    try {
      var b64 = btoa(unescape(encodeURIComponent(JSON.stringify(config))));
      return location.origin + location.pathname + '#pack=' + b64;
    } catch (e) { return ''; }
  }

  /* ---------------- teacher lock ----------------
   * CCS is a static page with no server, so this cannot be real authentication -
   * anyone who reads the source can see exactly how it works. It exists to stop
   * a student from casually opening "Setup" and rewriting the word list, not to
   * protect anything sensitive. The PIN is created by the teacher on first use
   * (never shipped with a default) and stored, hashed, only in this browser.
   */
  var PIN_KEY = 'ccs.pinhash';
  var UNLOCK_KEY = 'ccs.unlocked';

  function hasPin() {
    try { return !!localStorage.getItem(PIN_KEY); } catch (e) { return false; }
  }

  function isUnlocked() {
    try { return sessionStorage.getItem(UNLOCK_KEY) === '1'; } catch (e) { return true; }
  }

  function setUnlocked(v) {
    try {
      if (v) sessionStorage.setItem(UNLOCK_KEY, '1');
      else sessionStorage.removeItem(UNLOCK_KEY);
    } catch (e) {}
  }

  function digitsOnly(s) { return (s || '').replace(/\D/g, ''); }

  function hashPin(pin) {
    if (window.crypto && window.crypto.subtle && window.isSecureContext !== false) {
      var bytes = new TextEncoder().encode('ccs-pin:' + pin);
      return window.crypto.subtle.digest('SHA-256', bytes).then(function (buf) {
        return Array.prototype.map.call(new Uint8Array(buf), function (b) {
          return b.toString(16).padStart(2, '0');
        }).join('');
      });
    }
    /* Fallback for a non-secure context (e.g. plain http:// on a school LAN)
     * where SubtleCrypto is unavailable - same caveat as above, just weaker. */
    var h = 0, i, s = 'ccs-pin:' + pin;
    for (i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) >>> 0;
    return Promise.resolve('fnv1:' + h.toString(16));
  }

  /* goSetup() is how every part of the app should ask to see Setup - it
   * re-checks the lock every time, so re-locking mid-lesson actually holds. */
  function goSetup() {
    if (isUnlocked()) { show('setup'); return; }
    renderLock();
    show('lock');
  }

  function renderLock() {
    var body = $('#lock-body');
    var creating = !hasPin();
    body.innerHTML = '';

    body.appendChild(el('div', 'lock-icon', creating ? '🔑' : '🔒'));
    body.appendChild(el('h2', null, creating ? 'Set a teacher PIN' : 'Teacher login'));
    body.appendChild(el('div', 'sub', creating
      ? 'Choose a 4+ digit PIN. Only you (on this device) will need it to edit the word list and grammar.'
      : 'Enter your PIN to edit the word list and grammar.'));

    var errBox = el('div', 'lock-error');
    errBox.style.display = 'none';
    body.appendChild(errBox);

    function showError(msg) { errBox.textContent = msg; errBox.style.display = 'block'; }

    var pin = el('input', 'pin-input');
    pin.type = 'password';
    pin.inputMode = 'numeric';
    pin.autocomplete = 'off';
    pin.maxLength = 8;
    pin.placeholder = '••••';
    body.appendChild(pin);

    if (creating) {
      var confirmPin = el('input', 'pin-input');
      confirmPin.type = 'password';
      confirmPin.inputMode = 'numeric';
      confirmPin.autocomplete = 'off';
      confirmPin.maxLength = 8;
      confirmPin.placeholder = 'confirm PIN';
      body.appendChild(confirmPin);

      var setBtn = el('button', 'btn red', '🔑 Set PIN and continue');
      setBtn.type = 'button';
      setBtn.onclick = function () {
        var a = digitsOnly(pin.value), b = digitsOnly(confirmPin.value);
        if (a.length < 4) return showError('Use at least 4 digits.');
        if (a !== b) return showError('PINs do not match.');
        hashPin(a).then(function (h) {
          try { localStorage.setItem(PIN_KEY, h); } catch (e) {}
          setUnlocked(true);
          renderSetup();
          show('setup');
          applyUi();
        });
      };
      body.appendChild(setBtn);
    } else {
      var goBtn = el('button', 'btn red', '🔓 Unlock');
      goBtn.type = 'button';
      goBtn.onclick = function () {
        var a = digitsOnly(pin.value);
        hashPin(a).then(function (h) {
          try {
            if (h === localStorage.getItem(PIN_KEY)) {
              setUnlocked(true);
              renderSetup();
              show('setup');
              applyUi();
            } else {
              showError('That PIN is not correct.');
              pin.value = '';
              pin.focus();
            }
          } catch (e) { showError('That PIN is not correct.'); }
        });
      };
      body.appendChild(goBtn);
      pin.addEventListener('keydown', function (e) { if (e.key === 'Enter') goBtn.click(); });

      var forgot = el('button', 'lock-link', 'Forgot your PIN?');
      forgot.type = 'button';
      forgot.onclick = function () {
        if (!window.confirm('Reset the teacher PIN?\n\nThis does NOT delete your saved word lists - only the PIN itself. You will set a new one immediately after.')) return;
        try { localStorage.removeItem(PIN_KEY); } catch (e) {}
        renderLock();
      };
      body.appendChild(forgot);
    }

    body.appendChild(el('div', 'lock-note',
      'This is a light lock to stop casual tinkering, not real security - ' +
      'CCS runs entirely in your browser with no server, so anyone who reads ' +
      'the page’s source could bypass it. Don’t use a PIN you use anywhere else.'));

    setTimeout(function () { try { pin.focus(); } catch (e) {} }, 30);
  }

  /* ---------------- setup screen ---------------- */
  function renderSetup() {
    /* presets */
    var box = $('#presets');
    box.innerHTML = '';
    D.PRESETS.forEach(function (p) {
      var b = el('button', 'preset' + (ui.preset === p.id ? ' selected' : ''),
        '<div class="pi">' + p.icon + '</div><div class="pn">' + R.escapeHtml(p.name) + '</div>' +
        '<div class="pe">' + R.escapeHtml(p.en) + '</div>');
      b.type = 'button';
      b.onclick = function () {
        config = cloneConfig(p.config);
        ui.preset = p.id;
        saveConfig();
        applyUi();
        renderSetup();
      };
      box.appendChild(b);
    });

    $('#title').value = config.title || '';

    /* target structures */
    var t = $('#targets');
    t.innerHTML = '';
    for (var i = 0; i < 3; i++) {
      t.appendChild(targetRow(i));
    }

    renderVocab();
    $('#circling').value = ui.level;
  }

  function targetRow(i) {
    var wrap = el('div');
    var row = el('div', 'target-row');
    row.appendChild(el('div', 'idx', String(i + 1)));
    var input = el('input');
    input.type = 'text';
    input.value = (config.targets && config.targets[i]) || '';
    input.placeholder = i === 0 ? '{もの}が ほしいです' : (i === 1 ? '{ばしょ}に 行[い]きます' : 'でも、ありません');
    var prev = el('div', 'preview jp');
    function update() {
      config.targets = config.targets || [];
      config.targets[i] = input.value;
      /* Preview with real words in the slots so the teacher sees what the class will hear */
      prev.innerHTML = line(JP.parseTarget(input.value, config.vocab).build(null));
      saveConfig();
    }
    input.oninput = update;
    row.appendChild(input);
    wrap.appendChild(row);
    wrap.appendChild(prev);

    var chips = el('div', 'chips');
    ['{もの}', '{ばしょ}', '{ひと}', '{どうし}', '{きもち}'].forEach(function (slot) {
      var c = el('button', 'chip', slot);
      c.type = 'button';
      c.onclick = function () { input.value += slot; update(); input.focus(); };
      chips.appendChild(c);
    });
    var ruby = el('button', 'chip', '漢字[かんじ] furigana');
    ruby.type = 'button';
    ruby.onclick = function () { input.value += '漢字[かんじ]'; update(); input.focus(); };
    chips.appendChild(ruby);
    wrap.appendChild(chips);
    update();
    return wrap;
  }

  function renderVocab() {
    var host = $('#vocab');
    host.innerHTML = '';
    D.CATS.forEach(function (cat) {
      var list = config.vocab[cat.key] = config.vocab[cat.key] || [];
      var det = el('details', 'cat');
      if (cat.key === 'people' || cat.key === 'places' || cat.key === 'things') det.open = true;
      det.appendChild(el('summary', null,
        '<span>' + cat.icon + '</span><span>' + cat.ja + ' — ' + R.escapeHtml(cat.en) + '</span>' +
        '<span class="count">' + list.length + '</span>'));
      var body = el('div', 'body');
      body.appendChild(el('div', 'vrow vhead',
        '<div></div><div>ことば (word)</div><div>よみかた (kana)</div><div>English</div><div></div>'));
      list.forEach(function (item, idx) { body.appendChild(vocabRow(cat, list, item, idx, det)); });

      var actions = el('div', 'row');
      var add = el('button', 'btn ghost', '＋ ことばを たす');
      add.type = 'button';
      add.onclick = function () {
        list.push({ w: '', r: '', e: '', icon: '' });
        saveConfig(); renderVocab();
        var open = $$('#vocab details')[D.CATS.indexOf(cat)];
        if (open) open.open = true;
      };
      actions.appendChild(add);

      var paste = el('button', 'btn ghost', '📋 まとめて はる (paste list)');
      paste.type = 'button';
      paste.onclick = function () {
        var txt = window.prompt(
          'One word per line:\n  word, kana, English\n\nExample:\n  学校, がっこう, school\n  ラーメン, ラーメン, ramen', '');
        if (!txt) return;
        txt.split(/\n+/).forEach(function (row) {
          var parts = row.split(/[,、\t]/).map(function (s) { return s.trim(); });
          if (!parts[0]) return;
          list.push({ w: parts[0], r: parts[1] || parts[0], e: parts[2] || '', icon: '' });
        });
        saveConfig(); renderVocab();
      };
      actions.appendChild(paste);
      actions.appendChild(el('div', 'spacer'));
      actions.appendChild(el('div', 'meter', R.escapeHtml(cat.hint)));
      body.appendChild(actions);
      det.appendChild(body);
      host.appendChild(det);
    });
  }

  function vocabRow(cat, list, item, idx) {
    var row = el('div', 'vrow');
    var ico = el('button', 'ico', D.guessIcon(item, cat.key));
    ico.type = 'button';
    ico.title = 'Change the picture (emoji)';
    ico.onclick = function () {
      var v = window.prompt('Paste an emoji for this word (leave blank for automatic):', item.icon || '');
      if (v === null) return;
      item.icon = v.trim();
      ico.textContent = D.guessIcon(item, cat.key);
      saveConfig();
    };
    row.appendChild(ico);

    ['w', 'r', 'e'].forEach(function (field) {
      var input = el('input');
      input.type = 'text';
      input.value = item[field] || '';
      input.placeholder = field === 'w' ? '学校' : field === 'r' ? 'がっこう' : 'school';
      input.oninput = function () {
        item[field] = input.value;
        if (!item.icon) ico.textContent = D.guessIcon(item, cat.key);
        saveConfig();
      };
      row.appendChild(input);
    });

    var del = el('button', 'del', '✕');
    del.type = 'button';
    del.title = 'Remove';
    del.onclick = function () { list.splice(idx, 1); saveConfig(); renderVocab(); };
    row.appendChild(del);
    return row;
  }

  /* ---------------- play screen ---------------- */
  function show(id) {
    $$('.screen').forEach(function (s) { s.classList.toggle('active', s.id === id); });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  function startStory() {
    var problems = validate();
    if (problems) { window.alert(problems); return; }
    config.title = $('#title').value || config.title;
    saveConfig();
    story = new ns.Story(config, { circling: ui.level });
    lastScene = null;
    show('play');
    step(story.advance());
  }

  function validate() {
    var need = [];
    ['people', 'places', 'things', 'feelings'].forEach(function (k) {
      var n = (config.vocab[k] || []).filter(function (x) { return x.w && x.w.trim(); }).length;
      if (n < 3) need.push('・' + k + ' needs at least 3 words (you have ' + n + ')');
    });
    if (!need.length) {
      /* drop half-finished rows so the story never shows an empty card */
      Object.keys(config.vocab).forEach(function (k) {
        config.vocab[k] = config.vocab[k].filter(function (x) { return x.w && x.w.trim(); })
          .map(function (x) { return { w: x.w.trim(), r: (x.r || x.w).trim(), e: (x.e || '').trim(), icon: (x.icon || '').trim() }; });
      });
      return null;
    }
    return 'Add a little more vocabulary first:\n\n' + need.join('\n');
  }

  function renderStage(step) {
    var host = $('#stage');
    if (lastScene !== step.scene) {
      host.innerHTML = art.backdrop(step.scene, []);
      lastScene = step.scene;
    } else {
      $$('.actor-layer, .prop-chip, .chapter-flag', host).forEach(function (n) { n.remove(); });
    }

    if (step.who === 'chapter') {
      var flag = el('div', 'chapter-flag', jpHtml(step.tk));
      host.appendChild(flag);
      return;
    }

    var layer = el('div', 'actor-layer');
    layer.innerHTML = story.st.hero
      ? art.actor(story.st.hero, step.mood, story.st.name && story.st.name.w)
      : art.mystery();
    if (step.who === 'helper' && story.st.helper) {
      layer.innerHTML += art.actor(story.st.helper, 'happy', 'helper');
    }
    host.appendChild(layer);

    var icon = step.icon || (story.st.want ? D.guessIcon(story.st.want, 'things') : '');
    if (icon) {
      host.insertAdjacentHTML('beforeend', art.propBubble(icon, ''));
    }
  }

  function renderMeters() {
    var p = story.progress();
    var dots = '';
    for (var i = 0; i < p.total; i++) dots += '<i class="' + (i < p.beat ? 'done' : '') + '"></i>';
    $('#meters').innerHTML =
      '<div class="meter">ばめん <span class="beats">' + dots + '</span></div>' +
      '<div class="meter">🔁 ターゲット <b>' + story.st.reps + '</b> かい</div>' +
      '<div class="meter">✅ <b>' + story.st.correct + '</b> / ' + story.st.asked + '</div>';
  }

  function step(s) {
    var body = $('#play-body');
    body.innerHTML = '';
    if (!s) { renderRecap(); return; }

    renderStage(s);
    renderMeters();

    if (s.kind === 'say') return renderSay(s, body);
    if (s.kind === 'choose') return renderChoose(s, body);
    if (s.kind === 'circle') return renderCircle(s, body);
    if (s.kind === 'recap') return renderRecap();
  }

  function renderSay(s, body) {
    if (s.sfx) audio.play(s.sfx);
    var who = s.who === 'hero' ? (story.st.name ? R.text(story.nameTk()) : 'しゅじんこう')
            : s.who === 'helper' ? 'ヘルパー'
            : s.who === 'chapter' ? '' : 'ナレーター';
    var d = el('div', 'dialogue ' + s.who);
    var head = el('div', 'who', (who ? '<span>' + R.escapeHtml(who) + '</span>' : '') +
      (s.target ? '<span class="q-tag">ターゲット</span>' : ''));
    head.appendChild(speakBtn(s.tk));
    d.appendChild(head);
    d.appendChild(el('div', 'line-jp jp', line(s.tk)));
    if (s.en) d.appendChild(el('div', 'line-en', R.escapeHtml(s.en)));
    body.appendChild(d);

    var next = el('button', 'btn big', 'つぎへ ▶');
    next.onclick = function () { step(story.advance()); };
    var row = el('div', 'row'); row.style.marginTop = '1rem';
    row.appendChild(next);
    body.appendChild(row);

    if (ui.autoSpeak) setTimeout(function () { speakTokens(s.tk); }, 260);
    focusNext(next);
  }

  function renderChoose(s, body) {
    var q = el('div', 'question');
    q.innerHTML = '<span class="q-tag">きめて！ your choice</span>';
    var qh = el('div', 'q-jp jp', line(s.q));
    q.appendChild(qh);
    qh.appendChild(speakBtn(s.q));
    if (s.qEn) q.appendChild(el('div', 'q-en', R.escapeHtml(s.qEn)));

    var opts = el('div', 'options');
    s.options.forEach(function (o, idx) {
      var b = el('button', 'opt');
      b.type = 'button';
      b.innerHTML =
        (o.avatar ? '<span class="opt-avatar">' + art.actor(o.avatar, 'happy', '') + '</span>'
                  : '<span class="opt-icon">' + R.escapeHtml(o.icon || '⭐') + '</span>') +
        '<span class="opt-jp jp">' + line(o.tk) + '</span>' +
        (o.en ? '<span class="opt-en">' + R.escapeHtml(o.en) + '</span>' : '');
      b.dataset.key = String(idx + 1);
      b.onclick = function () {
        audio.play('flip');
        $$('.opt', opts).forEach(function (n) { n.disabled = true; });
        b.classList.add('correct');
        setTimeout(function () { step(story.answer(o)); }, 320);
      };
      opts.appendChild(b);
    });
    q.appendChild(opts);

    if (s.custom) {
      var wrap = el('div', 'custom-pick');
      var inp = el('input');
      inp.type = 'text';
      inp.placeholder = s.custom.placeholder || '';
      var go = el('button', 'btn green', 'これに する！');
      go.onclick = function () {
        var v = inp.value.trim();
        if (!v) return;
        step(story.answer({ item: { w: v, r: v, e: '' }, icon: '🏷️', tk: R.parse(v) }));
      };
      wrap.appendChild(el('div', 'meter', R.escapeHtml(s.custom.label)));
      wrap.appendChild(inp);
      wrap.appendChild(go);
      q.appendChild(wrap);
    }

    body.appendChild(q);
    if (ui.autoSpeak) setTimeout(function () { speakTokens(s.q); }, 260);
  }

  function renderCircle(s, body) {
    var idx = 0;

    function drawQuestion() {
      body.innerHTML = '';
      var qn = s.questions[idx];
      if (!qn) { step(story.advance()); return; }

      var q = el('div', 'question');
      q.innerHTML = '<span class="q-tag ' + (qn.spiral ? 'spiral' : 'drill') + '">' +
        (qn.spiral ? 'おぼえて いますか？ earlier in the story' :
         qn.target ? 'ターゲット target structure' : 'しつもん ' + (idx + 1) + ' / ' + s.questions.length) +
        '</span>';
      var qh = el('div', 'q-jp jp', line(qn.prompt));
      q.appendChild(qh);
      qh.appendChild(speakBtn(qn.prompt));
      if (qn.en) q.appendChild(el('div', 'q-en', R.escapeHtml(qn.en)));

      var opts = el('div', 'options');
      qn.choices.forEach(function (c, i) {
        var b = el('button', 'opt' + (qn.type === 'yn' ? ' yn' : ''));
        b.type = 'button';
        b.innerHTML = '<span class="opt-icon">' + R.escapeHtml(c.icon || '⭐') + '</span>' +
                      '<span class="opt-jp jp">' + line(c.tk) + '</span>';
        b.dataset.key = String(i + 1);
        b.onclick = function () { answer(c, b, opts, qn, q); };
        opts.appendChild(b);
      });
      q.appendChild(opts);
      body.appendChild(q);

      if (ui.autoSpeak) setTimeout(function () { speakTokens(qn.prompt); }, 260);
    }

    function answer(choice, btn, opts, qn, q) {
      $$('.opt', opts).forEach(function (n) {
        n.disabled = true;
        n.classList.remove('correct', 'wrong');
      });
      $$('.opt', opts).forEach(function (n, i) {
        if (qn.choices[i].correct) n.classList.add('correct');
      });
      if (!choice.correct) btn.classList.add('wrong');
      story.score(choice.correct);
      audio.play(choice.correct ? 'correct' : 'oops');

      var echo = el('div', 'echo' + (choice.correct ? '' : ' bad'));
      echo.innerHTML = '<span class="echo-tag">' +
        (choice.correct ? 'そうです！ say it together' : 'おしい！ listen again') + '</span>' +
        '<span class="jp">' + line(qn.echo) + '</span>';
      echo.appendChild(speakBtn(qn.echo));
      q.appendChild(echo);
      speakTokens(qn.echo);
      renderMeters();

      var next = el('button', 'btn big', idx + 1 < s.questions.length ? 'つぎの しつもん ▶' : 'つぎへ ▶');
      next.onclick = function () { idx++; drawQuestion(); };
      var row = el('div', 'row'); row.style.marginTop = '1rem';
      row.appendChild(next);
      body.appendChild(row);
      focusNext(next);
    }

    drawQuestion();
  }

  function focusNext(btn) {
    setTimeout(function () { try { btn.focus({ preventScroll: true }); } catch (e) {} }, 40);
  }

  /* ---------------- recap ---------------- */
  var gapMode = false;

  function renderRecap() {
    show('recap');
    var host = $('#recap-body');
    host.innerHTML = '';

    var head = el('div', 'card');
    head.innerHTML = '<h2>📖 Our Story</h2>' +
      '<div class="sub">Our story — read it together, then read it again with the words hidden.</div>';
    var stats = el('div', 'meters');
    stats.innerHTML =
      '<div class="meter">🔁 ターゲット <b>' + story.st.reps + '</b> かい</div>' +
      '<div class="meter">✅ <b>' + story.st.correct + '</b> / ' + story.st.asked + '</div>' +
      '<div class="meter">📝 <b>' + story.st.script.length + '</b> ぶん sentences</div>';
    head.appendChild(stats);
    host.appendChild(head);

    var card = el('div', 'card');
    var lines = el('div', 'story-lines');
    story.st.script.forEach(function (s, i) {
      if (s.who === 'chapter') {
        var ch = el('div', 'story-line target');
        ch.innerHTML = '<div class="n">＊</div><div class="txt jp">' + line(s.tk) + '</div>';
        lines.appendChild(ch);
        return;
      }
      var row = el('div', 'story-line' + (s.target ? ' target' : ''));
      var txt = el('div', 'txt jp');
      txt.innerHTML = gapMode ? gapped(s.tk) : line(s.tk);
      var main = el('div');
      main.style.flex = '1';
      main.appendChild(txt);
      if (s.en) main.appendChild(el('div', 'en', R.escapeHtml(s.en)));
      row.appendChild(el('div', 'n', String(i + 1)));
      row.appendChild(main);
      row.appendChild(speakBtn(s.tk));
      lines.appendChild(row);
    });
    card.appendChild(lines);

    var row2 = el('div', 'row no-print');
    row2.style.marginTop = '1rem';
    row2.appendChild(button('▶ ぜんぶ きく (play all)', 'green', playAll));
    row2.appendChild(button(gapMode ? '👁 ことばを みせる' : '🕵️ ことばを かくす (gap-fill)', 'ghost', function () {
      gapMode = !gapMode; renderRecap();
    }));
    row2.appendChild(button('🖨 いんさつ (print)', 'ghost', function () { window.print(); }));
    row2.appendChild(el('div', 'spacer'));
    row2.appendChild(button('🔁 もう いちど (same words, new story)', 'red', function () {
      gapMode = false; startStory();
    }));
    row2.appendChild(button('✏️ ことばを かえる', 'ghost', function () { gapMode = false; goSetup(); }));
    card.appendChild(row2);
    host.appendChild(card);
  }

  function button(label, cls, fn) {
    var b = el('button', 'btn ' + (cls || ''), label);
    b.type = 'button';
    b.onclick = fn;
    return b;
  }

  /* Hide the story's key words so the class retells it from the pictures. */
  function gapped(tokens) {
    var keys = {};
    [story.st.hero, story.st.name, story.st.want, story.st.home, story.st.helper, story.st.feeling]
      .concat((story.st.tries || []).map(function (t) { return t.place; }))
      .forEach(function (x) { if (x && x.w) keys[x.w] = true; });

    return tokens.map(function (tkn) {
      if (tkn.sp) return '<span class="sp"></span>';
      var hidden = keys[tkn.t] || (tkn.cls || '').indexOf('ts') !== -1;
      if (!hidden) return line([tkn]);
      var safe = R.escapeHtml(tkn.r ? tkn.t + '（' + tkn.r + '）' : tkn.t);
      return '<span class="tk gap" data-answer="' + safe + '" onclick="this.innerHTML=this.dataset.answer;this.classList.add(\'filled\')">&nbsp;</span>';
    }).join('');
  }

  function playAll() {
    var i = 0;
    var linesToRead = story.st.script.map(function (s) { return R.kana(s.tk); });
    audio.stop();
    (function next() {
      if (i >= linesToRead.length || !('speechSynthesis' in window)) return;
      var u = new SpeechSynthesisUtterance(linesToRead[i++]);
      u.lang = 'ja-JP';
      u.rate = audio.state.rate;
      u.onend = function () { setTimeout(next, 320); };
      try { window.speechSynthesis.speak(u); } catch (e) {}
    })();
  }

  /* ---------------- toggles + keyboard ---------------- */
  function applyUi() {
    document.body.classList.toggle('furi-off', ui.script === 'kanji');
    document.body.classList.toggle('en-off', !ui.english);
    document.documentElement.classList.toggle('big', ui.big);
    $('#t-script').textContent = ui.script === 'furi' ? 'ふりがな ON' : ui.script === 'kanji' ? 'かんじ だけ' : 'かな だけ';
    $('#t-en').classList.toggle('on', ui.english);
    $('#t-sound').classList.toggle('on', audio.state.sfx);
    $('#t-voice').classList.toggle('on', audio.state.tts);
    $('#t-big').classList.toggle('on', ui.big);
    $('#t-lock').classList.toggle('on', isUnlocked());
    $('#t-lock').textContent = isUnlocked() ? '🔓 Teacher' : '🔒 Teacher';
    try { localStorage.setItem('ccs.ui', JSON.stringify({ ui: ui, sfx: audio.state.sfx, tts: audio.state.tts })); } catch (e) {}
  }

  function restoreUi() {
    try {
      var saved = JSON.parse(localStorage.getItem('ccs.ui') || '{}');
      if (saved.ui) Object.keys(saved.ui).forEach(function (k) { ui[k] = saved.ui[k]; });
      if (typeof saved.sfx === 'boolean') audio.state.sfx = saved.sfx;
      if (typeof saved.tts === 'boolean') audio.state.tts = saved.tts;
    } catch (e) {}
  }

  function wire() {
    $('#t-script').onclick = function () {
      ui.script = ui.script === 'furi' ? 'kanji' : ui.script === 'kanji' ? 'kana' : 'furi';
      applyUi();
      if (story && $('#play').classList.contains('active')) step(story.currentStep());
      if (story && $('#recap').classList.contains('active')) renderRecap();
    };
    $('#t-en').onclick = function () { ui.english = !ui.english; applyUi(); };
    $('#t-sound').onclick = function () { audio.state.sfx = !audio.state.sfx; applyUi(); };
    $('#t-voice').onclick = function () { audio.state.tts = !audio.state.tts; if (!audio.state.tts) audio.stop(); applyUi(); };
    $('#t-big').onclick = function () { ui.big = !ui.big; applyUi(); };
    $('#start').onclick = startStory;
    $('#back-setup').onclick = function () { audio.stop(); goSetup(); };
    $('#t-lock').onclick = function () {
      if (isUnlocked()) {
        setUnlocked(false);
        applyUi();
        renderLock();
        show('lock');
      } else {
        goSetup();
      }
    };
    $('#circling').onchange = function () { ui.level = this.value; applyUi(); };
    $('#share').onclick = function () {
      var url = shareLink();
      if (!url) return;
      try {
        navigator.clipboard.writeText(url);
        window.alert('Link copied!\n\nAnyone who opens it gets this exact word list:\n\n' + url);
      } catch (e) { window.prompt('Copy this link:', url); }
    };
    $('#reset').onclick = function () {
      if (!window.confirm('Reset the word lists back to the starter pack?')) return;
      config = cloneConfig(D.DEFAULT_CONFIG);
      saveConfig(); renderSetup();
    };

    document.addEventListener('keydown', function (e) {
      if (/input|textarea/i.test((e.target.tagName || ''))) return;
      if (e.key === ' ' || e.key === 'Enter' || e.key === 'ArrowRight') {
        var next = $('#play-body .btn.big') || $('#play-body .btn');
        if (next) { e.preventDefault(); next.click(); }
        return;
      }
      if (/^[1-4]$/.test(e.key)) {
        var opt = $('#play-body .opt[data-key="' + e.key + '"]');
        if (opt && !opt.disabled) { e.preventDefault(); opt.click(); }
      }
    });
  }

  function init() {
    restoreUi();
    config = loadConfig();
    config.vocab = config.vocab || {};
    wire();
    renderSetup();
    applyUi();
    if (isUnlocked()) {
      show('setup');
    } else {
      renderLock();
      show('lock');
    }
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
  ns.app = { start: startStory };
})(window.CCS = window.CCS || {});
