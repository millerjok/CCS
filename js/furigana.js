/* CCS — furigana engine
 * Turns words + readings into ruby tokens so every single line of Japanese
 * in the app can carry furigana. Nothing here touches the DOM except render().
 */
(function (ns) {
  'use strict';

  var KANJI = /[一-龯㐀-䶿々〆ヶ]/;

  function hasKanji(s) {
    return KANJI.test(s || '');
  }

  function escapeRe(s) {
    return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  }

  function escapeHtml(s) {
    return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  }

  /* Split a word into alternating runs of kanji / not-kanji. */
  function runs(word) {
    var out = [], cur = null, i, ch, k;
    for (i = 0; i < word.length; i++) {
      ch = word[i];
      k = KANJI.test(ch);
      if (!cur || cur.k !== k) { cur = { k: k, s: '' }; out.push(cur); }
      cur.s += ch;
    }
    return out;
  }

  /* fit("行きます", "いきます") -> [{t:"行", r:"い"}, {t:"きます"}]
   * Falls back to whole-word ruby when the reading cannot be aligned.
   */
  function fit(word, reading) {
    word = (word || '').trim();
    reading = (reading || '').trim();
    if (!word) return [];
    if (!reading || reading === word || !hasKanji(word)) return [{ t: word }];

    var segs = runs(word), pattern = '^', i, m, g = 1, out = [];
    for (i = 0; i < segs.length; i++) {
      pattern += segs[i].k ? '([\\s\\S]+?)' : escapeRe(segs[i].s);
    }
    pattern += '$';
    try { m = reading.match(new RegExp(pattern)); } catch (e) { m = null; }
    if (!m) return [{ t: word, r: reading }];

    for (i = 0; i < segs.length; i++) {
      out.push(segs[i].k ? { t: segs[i].s, r: m[g++] } : { t: segs[i].s });
    }
    return out;
  }

  /* Inline markup used by every built-in template and by teacher input:
   *   "学校[がっこう]に 行[い]きます"   or   "学校(がっこう)に 行(い)きます"
   * Spaces are preserved as their own tokens so lines wrap on phrase breaks.
   */
  var RUBY_RE = /([一-龯㐀-䶿々〆ヶ]+)[\[（(]([ぁ-んァ-ヶーゝゞ]+)[\]）)]/g;

  function parse(str) {
    var tokens = [], last = 0, m;
    str = String(str == null ? '' : str);
    RUBY_RE.lastIndex = 0;
    while ((m = RUBY_RE.exec(str)) !== null) {
      pushPlain(tokens, str.slice(last, m.index));
      tokens.push({ t: m[1], r: m[2] });
      last = m.index + m[0].length;
    }
    pushPlain(tokens, str.slice(last));
    return tokens;
  }

  function pushPlain(tokens, chunk) {
    if (!chunk) return;
    chunk.split(/(\s+)/).forEach(function (part) {
      if (!part) return;
      if (/^\s+$/.test(part)) tokens.push({ sp: true });
      else tokens.push({ t: part });
    });
  }

  /* Joining helper: T('...') pieces and vocab tokens glued into one line. */
  function join() {
    var out = [], i, a = arguments;
    for (i = 0; i < a.length; i++) {
      if (!a[i]) continue;
      if (typeof a[i] === 'string') out = out.concat(parse(a[i]));
      else if (Array.isArray(a[i])) out = out.concat(a[i]);
      else out.push(a[i]);
    }
    return out;
  }

  /* Mark a run of tokens as belonging to a target structure (for highlighting). */
  function tag(tokens, cls) {
    return tokens.map(function (tk) {
      var copy = {};
      for (var k in tk) copy[k] = tk[k];
      copy.cls = ((tk.cls || '') + ' ' + cls).trim();
      return copy;
    });
  }

  /* tokens -> HTML. showFurigana=false still renders the same boxes so the
   * line does not jump around when a student toggles furigana off. */
  function render(tokens, showFurigana) {
    if (!tokens) return '';
    return tokens.map(function (tk) {
      if (tk.sp) return '<span class="sp"></span>';
      var cls = 'tk' + (tk.cls ? ' ' + tk.cls : '');
      var body;
      if (tk.r && showFurigana !== false) {
        body = '<ruby>' + escapeHtml(tk.t) + '<rt>' + escapeHtml(tk.r) + '</rt></ruby>';
      } else {
        body = escapeHtml(tk.t);
      }
      return '<span class="' + cls + '">' + body + '</span>';
    }).join('');
  }

  /* Plain kanji text (for copying / printing). */
  function text(tokens) {
    return (tokens || []).map(function (tk) { return tk.sp ? ' ' : tk.t; }).join('');
  }

  /* All-kana version — used for the speech synthesiser and for kana-only mode. */
  function kana(tokens) {
    return (tokens || []).map(function (tk) {
      if (tk.sp) return ' ';
      return tk.r || tk.t;
    }).join('');
  }

  ns.ruby = {
    hasKanji: hasKanji,
    fit: fit,
    parse: parse,
    join: join,
    tag: tag,
    render: render,
    text: text,
    kana: kana,
    escapeHtml: escapeHtml
  };
})(window.CCS = window.CCS || {});
