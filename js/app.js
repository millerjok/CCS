/* CCS — app shell
 * Screens: setup (teacher puts the language in) -> play (class builds the story)
 * -> recap (the class reads back what they made).
 */
(function (ns) {
  'use strict';

  var R = ns.ruby, D = ns.data, JP = ns.jp, art = ns.art, audio = ns.audio, cloud = ns.cloud;

  var STORE = 'ccs.config.v2';

  var config = null;
  var story = null;
  var ui = { script: 'furi', english: true, level: 'minimal', big: false, autoSpeak: true, preset: null, skeleton: 'classic' };
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

  /* ---------------- setup screen ---------------- */
  function renderSetup() {
    /* presets */
    var box = $('#presets');
    box.innerHTML = '';
    D.PRESETS.forEach(function (p) {
      var b = el('button', 'preset' + (ui.preset === p.id ? ' selected' : ''),
        '<div class="pi' + (p.shared ? ' shared' : '') + '">' + p.icon +
        (p.shared ? '<span class="preset-badge">☁️</span>' : '') + '</div>' +
        '<div class="pn">' + R.escapeHtml(p.name) + '</div>' +
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

    /* story shapes */
    var skelBox = $('#skeletons');
    skelBox.innerHTML = '';
    D.SKELETONS.forEach(function (sk) {
      var sb = el('button', 'preset' + (ui.skeleton === sk.id ? ' selected' : ''),
        '<div class="pi">' + sk.icon + '</div>' +
        '<div class="pn">' + R.escapeHtml(sk.name) + '</div>' +
        '<div class="pe">' + R.escapeHtml(sk.en) + '</div>');
      sb.type = 'button';
      sb.onclick = function () {
        ui.skeleton = sk.id;
        applyUi();
        renderSetup();
      };
      skelBox.appendChild(sb);
    });

    $('#title').value = config.title || '';

    /* target structures: normally fixed by the word pack, but a skeleton
     * with its own grammar shape (like compare's A/B comparisons) overrides
     * that with its own fixed set instead. */
    var t = $('#targets');
    t.innerHTML = '';
    var activeTargets = (ui.skeleton === 'compare') ? D.COMPARE_TARGETS : (config.targets || []);
    activeTargets.forEach(function (tmpl, i) { t.appendChild(targetRow(i, tmpl)); });

    renderVocab();
    $('#circling').value = ui.level;
    if (cloud && cloud.enabled()) renderCloudPublish();
  }

  var CAT_LABEL = { things: 'Things', places: 'Places', people: 'People', actions: 'Verbs', feelings: 'Feelings' };

  /* "{もの}を 作[つく]ります" -> tokens for "(Things)を 作ります", so the card
   * shows the shape of the structure rather than one randomly-picked word. */
  function templateShapeTokens(tmpl) {
    var out = [], re = /\{([^}]+)\}/g, last = 0, m, cat;
    tmpl = String(tmpl || '');
    while ((m = re.exec(tmpl)) !== null) {
      out = out.concat(R.parse(tmpl.slice(last, m.index)));
      cat = D.SLOTS[m[1].trim()];
      out = out.concat(R.parse('(' + (CAT_LABEL[cat] || m[1]) + ')'));
      last = m.index + m[0].length;
    }
    return out.concat(R.parse(tmpl.slice(last)));
  }

  /* Target grammar is fixed per word pack, not teacher-editable — this just
   * displays the pack's own structure. */
  function targetRow(i, tmpl) {
    var wrap = el('div', 'target-row');
    wrap.appendChild(el('div', 'idx', String(i + 1)));
    var prev = el('div', 'preview jp');
    if (tmpl) prev.innerHTML = line(templateShapeTokens(tmpl));
    wrap.appendChild(prev);
    return wrap;
  }

  function renderVocab() {
    var host = $('#vocab');
    host.innerHTML = '';
    D.CATS.forEach(function (cat) {
      var list = config.vocab[cat.key] = config.vocab[cat.key] || [];
      var det = el('details', 'cat');
      det.open = true;
      det.appendChild(el('summary', null,
        '<span>' + cat.icon + '</span><span>' + cat.ja + ' — ' + R.escapeHtml(cat.en) + '</span>' +
        '<span class="count">' + list.length + '</span>'));
      var body = el('div', 'body');
      body.appendChild(el('div', 'vrow vhead',
        '<div></div><div>ことば (word)</div><div>よみかた (kana)</div><div>English</div><div></div>'));
      list.forEach(function (item, idx) { body.appendChild(vocabRow(cat, list, item, idx, det)); });

      var actions = el('div', 'row');
      var add = el('button', 'btn ghost', '＋ Add words');
      add.type = 'button';
      add.onclick = function () {
        list.push({ w: '', r: '', e: '', icon: '' });
        saveConfig(); renderVocab();
        var open = $$('#vocab details')[D.CATS.indexOf(cat)];
        if (open) open.open = true;
      };
      actions.appendChild(add);

      var paste = el('button', 'btn ghost', '📋 Paste list');
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

  /* ---------------- shared word packs ----------------
   * Fetches whatever teachers have already published and folds it over the
   * built-in defaults, so every visitor sees the latest shared version -
   * not just the browser that made the edit. Silently does nothing if
   * cloud.js has no project configured, or the network is unreachable. */
  function syncCloud() {
    if (!cloud || !cloud.enabled()) return;
    $('#cloud-card').style.display = '';
    cloud.fetchShared().then(function (result) {
      var shared = result.packs;
      shared.forEach(function (item) {
        var existing = D.PRESETS.filter(function (p) { return p.id === item.id; })[0];
        if (existing) {
          existing.config = item.config;
          existing.shared = true;
        } else {
          D.PRESETS.push({
            id: item.id, name: item.config.title || item.id, en: 'Shared pack',
            icon: '☁️', shared: true, config: item.config
          });
        }
      });
      if (!result.ok) {
        $('#cloud-status').textContent = '☁️ Could not reach the shared word packs right now - showing the last version saved on this device.';
      } else if (shared.length) {
        $('#cloud-status').textContent = '☁️ Showing the latest shared word packs (' + shared.length + ' published).';
      } else {
        $('#cloud-status').textContent = '☁️ Connected. No packs have been published yet - the built-in defaults are shown.';
      }
      renderSetup();
      renderCloudPublish();
    });
  }

  function renderCloudPublish() {
    var body = $('#cloud-body');
    if (!body) return;
    body.innerHTML = '';

    var targetId = ui.preset || 'default';
    var targetPreset = D.PRESETS.filter(function (p) { return p.id === targetId; })[0];
    var targetName = targetPreset ? targetPreset.name : targetId;

    var openBtn = button('📤 Publish this as the shared "' + targetName + '" pack', 'ghost', function () {
      form.style.display = form.style.display === 'none' ? '' : 'none';
    });
    body.appendChild(openBtn);

    var form = el('div', 'cloud-form');
    form.style.display = 'none';
    form.appendChild(el('div', 'meter',
      'This replaces the shared "' + targetName + '" pack for every visitor to the site. Sign in with the shared teacher login to confirm.'));
    var nameInput = el('input'); nameInput.type = 'text'; nameInput.placeholder = 'Your name (optional, shown to other teachers)';
    var emailInput = el('input'); emailInput.type = 'email'; emailInput.placeholder = 'Teacher login email'; emailInput.autocomplete = 'username';
    var passInput = el('input'); passInput.type = 'password'; passInput.placeholder = 'Teacher login password'; passInput.autocomplete = 'current-password';
    [nameInput, emailInput, passInput].forEach(function (i) { form.appendChild(i); });

    var msg = el('div');
    form.appendChild(msg);

    var row = el('div', 'row');
    var goBtn = button('📤 Publish', 'red', function () {
      msg.innerHTML = '';
      if (!emailInput.value || !passInput.value) {
        msg.innerHTML = '<div class="cloud-msg bad">Enter the teacher login email and password.</div>';
        return;
      }
      goBtn.disabled = true;
      goBtn.textContent = 'Publishing…';
      cloud.publish(targetId, config, nameInput.value, emailInput.value, passInput.value).then(function () {
        msg.innerHTML = '<div class="cloud-msg ok">✅ Published. Everyone who opens this site will now see this version of "' + targetName + '".</div>';
        passInput.value = '';
        if (targetPreset) targetPreset.config = cloneConfig(config);
      }).catch(function (errMsg) {
        msg.innerHTML = '<div class="cloud-msg bad">' + R.escapeHtml(String(errMsg)) + '</div>';
      }).then(function () {
        goBtn.disabled = false;
        goBtn.textContent = '📤 Publish';
      });
    });
    row.appendChild(goBtn);
    form.appendChild(row);
    body.appendChild(form);
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
    story = new ns.Story(config, { circling: ui.level, skeleton: ui.skeleton });
    lastScene = null;
    show('play');
    step(story.advance());
  }

  function validate() {
    var need = [];
    var minPeople = ui.skeleton === 'mystery' ? 4 : 3; /* hero + 3 distinct suspects */
    ['people', 'places', 'things', 'feelings'].forEach(function (k) {
      var n = (config.vocab[k] || []).filter(function (x) { return x.w && x.w.trim(); }).length;
      var min = k === 'people' ? minPeople : 3;
      if (n < min) need.push('・' + k + ' needs at least ' + min + ' words (you have ' + n + ')' +
        (k === 'people' && min > 3 ? ' — the mystery skeleton needs one extra for a third suspect' : ''));
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

    var focus = story.st.want || story.st.winner || story.st.missingThing;
    var icon = step.icon || (focus ? D.guessIcon(focus, 'things') : '');
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
    var backBtn = $('#back-step');
    if (backBtn) backBtn.disabled = !story || story.i <= 0;
    if (!s) { renderRecap(); return; }

    renderStage(s);
    renderMeters();

    /* Re-visiting an already-answered choice or already-circled drill (via
     * the back button) must not let the class re-pick or re-score it -
     * story.answer() already no-ops on a re-pick, but re-rendering the
     * interactive version invites clicking it anyway. Show a read-only
     * recap of it instead, with its own way back to the frontier. */
    if (s.kind === 'say') return renderSay(s, body);
    if (s.kind === 'choose') return s.answered ? renderChooseReview(s, body) : renderChoose(s, body);
    if (s.kind === 'circle') return s.done ? renderCircleReview(s, body) : renderCircle(s, body);
    if (s.kind === 'recap') return renderRecap();
  }

  function renderSay(s, body) {
    if (s.sfx) audio.play(s.sfx);
    var who = s.label || (s.who === 'hero' ? (story.st.name ? R.text(story.nameTk()) : 'しゅじんこう')
            : s.who === 'helper' ? 'ヘルパー'
            : s.who === 'chapter' ? '' : 'ナレーター');
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

  /* Read-only view of a choice already made, shown when the back button
   * revisits it - the picked option stays marked, everything is disabled,
   * and "next" just moves the cursor forward again (story.advance()),
   * never story.answer(), which would re-run onPick's side effects. */
  function renderChooseReview(s, body) {
    var q = el('div', 'question');
    q.innerHTML = '<span class="q-tag">きめて！ your choice</span>';
    var qh = el('div', 'q-jp jp', line(s.q));
    q.appendChild(qh);
    qh.appendChild(speakBtn(s.q));
    if (s.qEn) q.appendChild(el('div', 'q-en', R.escapeHtml(s.qEn)));

    var opts = el('div', 'options');
    var matched = false;
    s.options.forEach(function (o, idx) {
      var picked = o === s.answered;
      if (picked) matched = true;
      var b = el('button', 'opt' + (picked ? ' correct' : ''));
      b.type = 'button';
      b.disabled = true;
      b.innerHTML =
        (o.avatar ? '<span class="opt-avatar">' + art.actor(o.avatar, 'happy', '') + '</span>'
                  : '<span class="opt-icon">' + R.escapeHtml(o.icon || '⭐') + '</span>') +
        '<span class="opt-jp jp">' + line(o.tk) + '</span>' +
        (o.en ? '<span class="opt-en">' + R.escapeHtml(o.en) + '</span>' : '');
      b.dataset.key = String(idx + 1);
      opts.appendChild(b);
    });
    q.appendChild(opts);

    if (!matched && s.answered) {
      var echo = el('div', 'echo');
      echo.innerHTML = '<span class="echo-tag">じぶんで かいた (your own answer)</span>' +
        '<span class="jp">' + line(s.answered.tk) + '</span>';
      q.appendChild(echo);
    }

    body.appendChild(q);
    var next = el('button', 'btn big', 'つぎへ ▶');
    next.onclick = function () { step(story.advance()); };
    var row = el('div', 'row'); row.style.marginTop = '1rem';
    row.appendChild(next);
    body.appendChild(row);
    focusNext(next);
  }

  function renderCircle(s, body) {
    var idx = 0;

    function drawQuestion() {
      body.innerHTML = '';
      var qn = s.questions[idx];
      if (!qn) { s.done = true; step(story.advance()); return; }

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

  /* Read-only view of a drill already fully answered, shown when the back
   * button revisits it - just the sentences it circled, no clickable
   * questions (re-answering would score it a second time). */
  function renderCircleReview(s, body) {
    var q = el('div', 'question');
    q.innerHTML = '<span class="q-tag drill">' + R.escapeHtml(s.label || 'しつもん') + ' — already circled</span>';
    var list = el('div', 'story-lines');
    s.questions.forEach(function (qn) {
      var row = el('div', 'story-line');
      row.appendChild(el('div', 'txt jp', line(qn.echo)));
      list.appendChild(row);
    });
    q.appendChild(list);
    body.appendChild(q);
    var next = el('button', 'btn big', 'つぎへ ▶');
    next.onclick = function () { step(story.advance()); };
    var row2 = el('div', 'row'); row2.style.marginTop = '1rem';
    row2.appendChild(next);
    body.appendChild(row2);
    focusNext(next);
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
    row2.appendChild(button('✏️ ことばを かえる', 'ghost', function () { gapMode = false; show('setup'); }));
    card.appendChild(row2);
    host.appendChild(card);
  }

  function button(label, cls, fn) {
    var b = el('button', 'btn ' + (cls || ''), label);
    b.type = 'button';
    b.onclick = fn;
    return b;
  }

  /* Hide the story's key words so the class retells it from the pictures.
   * Walks story.st generically (rather than naming classic's fields) so
   * every skeleton's picks - places, suspects, options, whatever - get
   * hidden the same way. */
  var GAP_SKIP = { script: 1, reps: 1, asked: 1, correct: 1, mood: 1, scene: 1, guiltyIndex: 1 };
  function gapped(tokens) {
    var keys = {};
    function mark(v) {
      if (!v || typeof v !== 'object') return;
      if (typeof v.w === 'string' && typeof v.r === 'string') { keys[v.w] = true; return; }
      if (Array.isArray(v)) { v.forEach(mark); return; }
      Object.keys(v).forEach(function (k) { mark(v[k]); });
    }
    Object.keys(story.st).forEach(function (k) { if (!GAP_SKIP[k]) mark(story.st[k]); });

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
    $('#back-setup').onclick = function () { audio.stop(); show('setup'); };
    $('#brand-home').onclick = function () { audio.stop(); show('setup'); };
    $('#back-step').onclick = function () { if (story) step(story.back()); };
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
      if (!window.confirm('Reset the word lists back to this pack\'s built-in defaults?')) return;
      /* Reset to whichever pack is actually selected, not always the
       * starter pack - this also doubles as "give me the latest built-in
       * version" for a pack a browser saved a copy of a while ago. */
      var current = D.PRESETS.filter(function (p) { return p.id === ui.preset; })[0];
      config = cloneConfig(current ? current.config : D.DEFAULT_CONFIG);
      saveConfig(); renderSetup();
    };

    document.addEventListener('keydown', function (e) {
      if (/input|textarea/i.test((e.target.tagName || ''))) return;
      if (e.key === ' ' || e.key === 'Enter' || e.key === 'ArrowRight') {
        var next = $('#play-body .btn.big') || $('#play-body .btn');
        if (next) { e.preventDefault(); next.click(); }
        return;
      }
      if (e.key === 'ArrowLeft') {
        var back = $('#back-step');
        if (back && !back.disabled) { e.preventDefault(); back.click(); }
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
    /* Wait for the window's load event (not just DOMContentLoaded) before
     * touching the optional Firebase SDK - it's an external, deferred script,
     * and whether it has finished executing yet depends on script order and
     * network timing that differs between index.html and the bundled
     * ccs-standalone.html. `load` fires only once everything genuinely has. */
    if (document.readyState === 'complete') syncCloud();
    else window.addEventListener('load', syncCloud);
    show('setup');
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
  ns.app = { start: startStory };
})(window.CCS = window.CCS || {});
