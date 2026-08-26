/* CCS — Japanese sentence + question builder
 * Every line the app shows is built here as ruby tokens, so furigana is
 * available everywhere: narration, speech bubbles, questions and answers.
 */
(function (ns) {
  'use strict';

  var R = ns.ruby;

  function J() { return R.join.apply(null, arguments); }

  /* Vocabulary item -> ruby tokens */
  function tk(item) {
    if (!item) return [];
    if (Array.isArray(item)) return item;
    return R.fit(item.w, item.r);
  }

  /* "でも、{place}に…" -> tokens, with {slots} replaced by token arrays */
  function fill(tpl, map) {
    var out = [], re = /\{([^}]+)\}/g, last = 0, m, val;
    tpl = String(tpl || '');
    while ((m = re.exec(tpl)) !== null) {
      out = out.concat(R.parse(tpl.slice(last, m.index)));
      val = map ? map[m[1].trim()] : null;
      if (val) out = out.concat(Array.isArray(val) ? val : tk(val));
      else out = out.concat(R.parse('＿＿'));
      last = m.index + m[0].length;
    }
    return out.concat(R.parse(tpl.slice(last)));
  }

  /* ---------------- Grammar frames ----------------
   * Each frame knows how to make a statement, the four circling questions
   * and the short answers, so one table drives the whole repetition engine.
   */
  var FRAMES = {
    isA: {
      cat: 'people', qWord: 'だれ',
      say:    function (s, x) { return J(s, 'は ', x, 'です。'); },
      askYN:  function (s, x) { return J(s, 'は ', x, 'ですか。'); },
      askOr:  function (s, a, b) { return J(s, 'は ', a, 'ですか、', b, 'ですか。'); },
      askWh:  function (s) { return J(s, 'は だれですか。'); },
      pick:   function (x) { return J(x, 'です'); },
      yes:    function (x) { return J('はい、', x, 'です。'); },
      no:     function (x) { return J('いいえ、', x, 'じゃ ありません。'); },
      en:     function (s, x) { return s + ' is ' + x + '.'; }
    },
    named: {
      cat: 'names', qWord: 'なに',
      say:    function (s, x) { return J(s, 'の なまえは ', x, 'です。'); },
      askYN:  function (s, x) { return J('なまえは ', x, 'ですか。'); },
      askOr:  function (s, a, b) { return J('なまえは ', a, 'ですか、', b, 'ですか。'); },
      askWh:  function (s) { return J('なまえは 何[なん]ですか。'); },
      pick:   function (x) { return J(x, 'です'); },
      yes:    function (x) { return J('はい、', x, 'です。'); },
      no:     function (x) { return J('いいえ、', x, 'じゃ ありません。'); },
      en:     function (s, x) { return 'Their name is ' + x + '.'; }
    },
    isAt: {
      cat: 'places', qWord: 'どこ',
      say:    function (s, x) { return J(s, 'は ', x, 'に います。'); },
      askYN:  function (s, x) { return J(s, 'は ', x, 'に いますか。'); },
      askOr:  function (s, a, b) { return J(s, 'は ', a, 'に いますか、', b, 'に いますか。'); },
      askWh:  function (s) { return J(s, 'は どこに いますか。'); },
      pick:   function (x) { return J(x, 'に います'); },
      yes:    function (x) { return J('はい、', x, 'に います。'); },
      no:     function (x) { return J('いいえ、', x, 'に いません。'); },
      en:     function (s, x) { return s + ' is at the ' + x + '.'; }
    },
    goes: {
      cat: 'places', qWord: 'どこ',
      say:    function (s, x) { return J(s, 'は ', x, 'に 行[い]きます。'); },
      askYN:  function (s, x) { return J(s, 'は ', x, 'に 行[い]きますか。'); },
      askOr:  function (s, a, b) { return J(s, 'は ', a, 'に 行[い]きますか、', b, 'に 行[い]きますか。'); },
      askWh:  function (s) { return J(s, 'は どこに 行[い]きますか。'); },
      pick:   function (x) { return J(x, 'に 行[い]きます'); },
      yes:    function (x) { return J('はい、', x, 'に 行[い]きます。'); },
      no:     function (x) { return J('いいえ、', x, 'に 行[い]きません。'); },
      en:     function (s, x) { return s + ' goes to the ' + x + '.'; }
    },
    wants: {
      cat: 'things', qWord: 'なに',
      say:    function (s, x) { return J(s, 'は ', x, 'が ほしいです。'); },
      askYN:  function (s, x) { return J(s, 'は ', x, 'が ほしいですか。'); },
      askOr:  function (s, a, b) { return J(s, 'は ', a, 'が ほしいですか、', b, 'が ほしいですか。'); },
      askWh:  function (s) { return J(s, 'は なにが ほしいですか。'); },
      pick:   function (x) { return J(x, 'が ほしいです'); },
      yes:    function (x) { return J('はい、', x, 'が ほしいです。'); },
      no:     function (x) { return J('いいえ、', x, 'は ほしくないです。'); },
      en:     function (s, x) { return s + ' wants ' + x + '.'; }
    },
    feels: {
      cat: 'feelings', qWord: 'どう',
      say:    function (s, x) { return J(s, 'は とても ', x, 'です。'); },
      askYN:  function (s, x) { return J(s, 'は ', x, 'ですか。'); },
      askOr:  function (s, a, b) { return J(s, 'は ', a, 'ですか、', b, 'ですか。'); },
      askWh:  function (s) { return J(s, 'は どうですか。'); },
      pick:   function (x) { return J(x, 'です'); },
      yes:    function (x) { return J('はい、とても ', x, 'です。'); },
      no:     function (x) { return J('いいえ、', x, 'じゃ ありません。'); },
      en:     function (s, x) { return s + ' feels very ' + x + '.'; }
    },
    helps: {
      cat: 'people', qWord: 'だれ',
      say:    function (s, x) { return J(x, 'が ', s, 'を てつだいます。'); },
      askYN:  function (s, x) { return J(x, 'が ', s, 'を てつだいますか。'); },
      askOr:  function (s, a, b) { return J(a, 'が てつだいますか、', b, 'が てつだいますか。'); },
      askWh:  function (s) { return J('だれが ', s, 'を てつだいますか。'); },
      pick:   function (x) { return J(x, 'が てつだいます'); },
      yes:    function (x) { return J('はい、', x, 'が てつだいます。'); },
      no:     function (x) { return J('いいえ、', x, 'は てつだいません。'); },
      en:     function (s, x) { return x + ' helps ' + s + '.'; }
    }
  };

  /* ---------------- Random helpers ---------------- */
  function shuffle(list) {
    var a = list.slice(), i, j, t;
    for (i = a.length - 1; i > 0; i--) {
      j = Math.floor(Math.random() * (i + 1));
      t = a[i]; a[i] = a[j]; a[j] = t;
    }
    return a;
  }

  function sample(list, n, exclude) {
    var pool = list.filter(function (x) {
      return !exclude || !exclude.some(function (y) { return y && x && y.w === x.w; });
    });
    return shuffle(pool).slice(0, n);
  }

  function pick(list) { return list[Math.floor(Math.random() * list.length)]; }

  /* ---------------- Circling ----------------
   * Printer's sequence: state the fact, then ask it back many ways.
   *   1. yes/no (true)     2. yes/no (false)
   *   3. either / or       4. question word
   * The class hears the same structure 5-15 times without it feeling like drill.
   */
  var LEVELS = {
    light:  ['yn+', 'either'],
    normal: ['yn+', 'yn-', 'either', 'wh'],
    heavy:  ['yn+', 'yn-', 'either', 'wh', 'yn-', 'wh']
  };

  function circle(opts) {
    var frame = FRAMES[opts.frame];
    var subj = opts.subject;                 // tokens
    var subjEn = opts.subjectEn || 'The hero';
    var item = opts.item;                    // the true vocab item
    var pool = (opts.pool || []).filter(function (x) { return x && x.w !== item.w; });
    var plan = LEVELS[opts.level || 'normal'] || LEVELS.normal;
    var out = [], usedWrong = [];

    plan.forEach(function (type) {
      var wrong, others, choices;

      if (type === 'yn+') {
        out.push({
          type: 'yn',
          prompt: frame.askYN(subj, tk(item)),
          en: 'はい or いいえ?',
          choices: [
            { tk: R.parse('はい、そうです'), icon: '⭕', correct: true },
            { tk: R.parse('いいえ、ちがいます'), icon: '❌', correct: false }
          ],
          echo: frame.yes(tk(item)),
          focus: item
        });
        return;
      }

      if (type === 'yn-') {
        wrong = pick(pool.filter(function (x) {
          return !usedWrong.some(function (y) { return y.w === x.w; });
        })) || pick(pool);
        if (!wrong) return;
        usedWrong.push(wrong);
        out.push({
          type: 'yn',
          prompt: frame.askYN(subj, tk(wrong)),
          en: 'Careful — is that what we decided?',
          choices: [
            { tk: R.parse('はい、そうです'), icon: '⭕', correct: false },
            { tk: R.parse('いいえ、ちがいます'), icon: '❌', correct: true }
          ],
          echo: J(frame.no(tk(wrong)), ' ', frame.yes(tk(item))),
          focus: item
        });
        return;
      }

      if (type === 'either') {
        wrong = pick(pool);
        if (!wrong) return;
        var first = Math.random() < 0.5;
        out.push({
          type: 'either',
          prompt: first ? frame.askOr(subj, tk(item), tk(wrong))
                        : frame.askOr(subj, tk(wrong), tk(item)),
          en: 'Which one?',
          choices: shuffle([
            { tk: frame.pick(tk(item)), icon: ns.data.guessIcon(item, frame.cat), correct: true },
            { tk: frame.pick(tk(wrong)), icon: ns.data.guessIcon(wrong, frame.cat), correct: false }
          ]),
          echo: frame.yes(tk(item)),
          focus: item
        });
        return;
      }

      if (type === 'wh') {
        others = sample(pool, 2, [item]);
        if (others.length < 1) return;
        choices = shuffle(others.map(function (x) {
          return { tk: frame.pick(tk(x)), icon: ns.data.guessIcon(x, frame.cat), correct: false };
        }).concat([
          { tk: frame.pick(tk(item)), icon: ns.data.guessIcon(item, frame.cat), correct: true }
        ]));
        out.push({
          type: 'wh',
          prompt: frame.askWh(subj),
          en: frame.qWord === 'だれ' ? 'Who?' : frame.qWord === 'どこ' ? 'Where?'
             : frame.qWord === 'なに' ? 'What?' : 'How do they feel?',
          choices: choices,
          echo: frame.yes(tk(item)),
          focus: item
        });
      }
    });

    return out;
  }

  /* ---------------- Teacher target structures ----------------
   * "{もの}が ほしいです" -> slot: things. The phrase is reused verbatim so
   * whatever the teacher wants drilled is what the class hears and answers.
   */
  function parseTarget(str, vocab) {
    str = str || '';
    var slots = (str.match(/\{([^}]+)\}/g) || []).map(function (s) { return s.slice(1, -1).trim(); });
    var first = slots[0] || null;
    var cat = first ? ns.data.SLOTS[first] : null;
    return {
      raw: str,
      slot: first,
      slots: slots,
      cat: cat || null,
      /* The first slot carries the word the story just decided on; any other
         slots are filled from the same word lists so the phrase stays whole. */
      build: function (item) {
        if (!slots.length) return R.parse(str);
        var map = {};
        slots.forEach(function (name, i) {
          var c = ns.data.SLOTS[name];
          var list = (vocab && c && vocab[c]) || [];
          if (i === 0) map[name] = item ? tk(item) : (list.length ? tk(pick(list)) : R.parse('＿＿'));
          else map[name] = list.length ? tk(pick(list)) : R.parse('＿＿');
        });
        return fill(str, map);
      }
    };
  }

  /* A yes/no + either-or round built straight from a target structure. */
  function targetQuestions(target, item, pool, level) {
    var out = [], wrong;
    if (!target.cat || !item) {
      out.push({
        type: 'yn',
        prompt: J(target.build(null), 'か。'),
        en: 'Repeat after me!',
        choices: [
          { tk: R.parse('はい、そうです'), icon: '⭕', correct: true },
          { tk: R.parse('いいえ、ちがいます'), icon: '❌', correct: false }
        ],
        echo: target.build(null),
        focus: item || null,
        target: true
      });
      return out;
    }

    out.push({
      type: 'yn',
      prompt: J(target.build(item), 'か。'),
      en: 'True or not?',
      choices: [
        { tk: R.parse('はい、そうです'), icon: '⭕', correct: true },
        { tk: R.parse('いいえ、ちがいます'), icon: '❌', correct: false }
      ],
      echo: target.build(item),
      focus: item,
      target: true
    });

    wrong = pick((pool || []).filter(function (x) { return x.w !== item.w; }));
    if (wrong && level !== 'light') {
      out.push({
        type: 'either',
        prompt: J(target.build(item), 'か、', target.build(wrong), 'か。'),
        en: 'Which one is our story?',
        choices: shuffle([
          { tk: target.build(item), icon: ns.data.guessIcon(item, target.cat), correct: true },
          { tk: target.build(wrong), icon: ns.data.guessIcon(wrong, target.cat), correct: false }
        ]),
        echo: target.build(item),
        focus: item,
        target: true
      });
    }
    return out;
  }

  ns.jp = {
    J: J,
    tk: tk,
    fill: fill,
    FRAMES: FRAMES,
    circle: circle,
    parseTarget: parseTarget,
    targetQuestions: targetQuestions,
    shuffle: shuffle,
    sample: sample,
    pick: pick
  };
})(window.CCS = window.CCS || {});
