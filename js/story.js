/* CCS — the story skeleton
 * Liam Printer's co-created story shape, kept deliberately rigid so the class
 * can pour anything into it:
 *   a character who WANTS something -> tries and FAILS -> tries and FAILS again
 *   -> a third attempt with help -> resolution.
 * Students supply every detail; the app supplies the repetition.
 */
(function (ns) {
  'use strict';

  var R = ns.ruby, JP = ns.jp, D = ns.data;
  var J = JP.J, tk = JP.tk;

  var BEATS = ['hero', 'name', 'home', 'want', 'scene1', 'scene2', 'scene3', 'ending', 'recap'];

  function Story(config, options) {
    this.cfg = config;
    this.opt = options || {};
    this.level = this.opt.circling || 'normal';
    this.st = { script: [], reps: 0, asked: 0, correct: 0 };
    this.steps = [];
    this.i = -1;
    this.beat = 0;
    this.targets = (config.targets || []).filter(Boolean).map(function (t) {
      return JP.parseTarget(t, config.vocab);
    });
  }

  /* ---------- small helpers ---------- */
  Story.prototype.pool = function (cat) {
    return (this.cfg.vocab && this.cfg.vocab[cat]) || [];
  };

  Story.prototype.options = function (cat, n, exclude) {
    var list = JP.sample(this.pool(cat), n, exclude || []);
    if (!list.length) list = this.pool(cat).slice(0, n);
    return list;
  };

  Story.prototype.nameTk = function () {
    var n = this.st.name;
    return n ? R.fit(n.w, n.r) : R.parse('だれか');
  };

  Story.prototype.nameEn = function () {
    return this.st.name ? (this.st.name.r || this.st.name.w) : 'the hero';
  };

  Story.prototype.scene = function () { return this.st.scene || 'town'; };

  Story.prototype.props = function () {
    var p = [];
    if (this.st.want) p.push(D.guessIcon(this.st.want, 'things'));
    return p;
  };

  /* ---------- step constructors ---------- */
  Story.prototype.say = function (tokens, en, opt) {
    opt = opt || {};
    var step = {
      kind: 'say',
      tk: tokens,
      en: en || '',
      who: opt.who || 'narrator',
      mood: opt.mood || this.st.mood || 'happy',
      scene: opt.scene || this.scene(),
      props: opt.props || this.props(),
      icon: opt.icon || '',
      target: !!opt.target,
      sfx: opt.sfx || ''
    };
    this.steps.push(step);
    this.st.script.push(step);
    if (opt.target) this.st.reps++;
    return step;
  };

  Story.prototype.ask = function (spec) {
    spec.kind = 'choose';
    spec.scene = spec.scene || this.scene();
    spec.mood = spec.mood || this.st.mood || 'neutral';
    spec.props = this.props();
    this.steps.push(spec);
    return spec;
  };

  Story.prototype.drill = function (questions, label) {
    questions = (questions || []).filter(Boolean);
    if (!questions.length) return null;
    var step = {
      kind: 'circle',
      questions: questions,
      label: label || '',
      scene: this.scene(),
      mood: this.st.mood || 'neutral',
      props: this.props()
    };
    this.st.reps += questions.filter(function (q) { return q.target; }).length;
    this.steps.push(step);
    return step;
  };

  /* Circling round for a fact, plus one spiral question about an older fact. */
  Story.prototype.round = function (frame, subject, subjectEn, item, cat, label, poolOverride) {
    var qs = JP.circle({
      frame: frame, subject: subject, subjectEn: subjectEn,
      item: item, pool: poolOverride || this.pool(cat), level: this.level
    });
    var spiral = this.spiral();
    if (spiral) qs = qs.concat(spiral);
    return this.drill(qs, label);
  };

  /* Re-ask something the class decided earlier — this is what makes the
   * vocabulary stick across the whole lesson rather than beat by beat. */
  Story.prototype.spiral = function () {
    var facts = [];
    if (this.st.hero) facts.push({ frame: 'isA', subject: R.parse('しゅじんこう'), en: 'The main character', item: this.st.hero, cat: 'people' });
    if (this.st.want) facts.push({ frame: 'wants', subject: this.nameTk(), en: this.nameEn(), item: this.st.want, cat: 'things' });
    if (this.st.home) facts.push({ frame: 'isAt', subject: this.nameTk(), en: this.nameEn(), item: this.st.home, cat: 'places' });
    if (!facts.length) return null;
    var f = JP.pick(facts);
    var qs = JP.circle({
      frame: f.frame, subject: f.subject, subjectEn: f.en,
      item: f.item, pool: this.pool(f.cat), level: 'light'
    });
    return qs.slice(0, 1).map(function (q) { q.spiral = true; return q; });
  };

  /* The teacher's own phrases, echoed by the hero and asked back. */
  /* The word handed in only fits if it comes from the slot's own list —
   * otherwise the teacher ordered their structures differently, so pick one. */
  Story.prototype.targetLine = function (index, item) {
    var t = this.targets[index];
    if (!t) return null;
    if (!t.cat) return { target: t, item: null, tokens: R.tag(t.build(null), 'ts') };
    var pool = this.pool(t.cat);
    var fits = item && pool.some(function (x) { return x.w === item.w; });
    var chosen = fits ? item : (JP.pick(pool) || null);
    return { target: t, item: chosen, tokens: R.tag(t.build(chosen), 'ts') };
  };

  Story.prototype.speakTarget = function (index, item, mood) {
    var line = this.targetLine(index, item);
    if (!line) return;
    this.say(J(line.tokens, '！'), (this.cfg.targetsEn && this.cfg.targetsEn[index]) || '',
      { who: 'hero', mood: mood || this.st.mood, target: true, icon: line.item ? D.guessIcon(line.item, line.target.cat) : '' });
    this.drill(JP.targetQuestions(line.target, line.item, this.pool(line.target.cat), this.level), 'ターゲット');
  };

  /* ---------- beats ---------- */
  Story.prototype.buildBeat = function (name) {
    var self = this;

    if (name === 'hero') {
      this.st.scene = 'town';
      this.say(R.parse('むかしむかし、ある まちに…'), 'Once upon a time, in a certain town…', { who: 'narrator', mood: 'neutral' });
      this.ask({
        q: R.parse('しゅじんこうは だれですか。'),
        qEn: 'Who is the main character?',
        hint: 'Class vote! だれですか。',
        options: this.options('people', 4).map(function (it) {
          return { item: it, icon: D.guessIcon(it, 'people'), tk: tk(it), en: it.e, avatar: it };
        }),
        onPick: function (opt) {
          self.st.hero = opt.item;
          self.st.mood = 'happy';
          self.say(J('…', tk(opt.item), 'が いました。'),
            'Once upon a time, there was a ' + (opt.item.e || opt.item.w) + '.',
            { who: 'narrator', icon: opt.icon, sfx: 'flip' });
          self.round('isA', R.parse('しゅじんこう'), 'The main character', opt.item, 'people', 'しゅじんこう');
        }
      });
      return;
    }

    if (name === 'name') {
      var names = JP.shuffle(D.NAMES).slice(0, 5);
      var namePool = names.map(function (n) { return { w: n.w, r: n.r, e: n.r, icon: '🏷️' }; });
      this.ask({
        q: J(tk(this.st.hero), 'の なまえは 何[なん]ですか。'),
        qEn: "What is the character's name?",
        hint: 'Pick one, or type your own!',
        custom: { label: 'じぶんで かく (type a name)', placeholder: 'かな, e.g. ミルクちゃん' },
        options: names.map(function (n) {
          return { item: { w: n.w, r: n.r, e: n.r }, icon: '🏷️', tk: R.fit(n.w, n.r), en: '' };
        }),
        onPick: function (opt) {
          self.st.name = opt.item;
          self.say(J(tk(self.st.hero), 'の なまえは ', tk(opt.item), 'です。'),
            'The name is ' + (opt.item.r || opt.item.w) + '.', { who: 'narrator', sfx: 'flip' });
          self.round('named', tk(self.st.hero), 'The hero', opt.item, 'names', 'なまえ',
            namePool.concat([opt.item]));
        }
      });
      return;
    }

    if (name === 'home') {
      this.ask({
        q: J(this.nameTk(), 'は どこに いますか。'),
        qEn: 'Where is our character right now?',
        options: this.options('places', 4).map(function (it) {
          return { item: it, icon: D.guessIcon(it, 'places'), tk: tk(it), en: it.e };
        }),
        onPick: function (opt) {
          self.st.home = opt.item;
          self.st.scene = D.sceneKindFor(opt.item);
          self.say(J(self.nameTk(), 'は ', tk(opt.item), 'に います。'),
            self.nameEn() + ' is at the ' + (opt.item.e || opt.item.w) + '.',
            { who: 'narrator', scene: self.st.scene, icon: opt.icon, sfx: 'flip' });
          self.round('isAt', self.nameTk(), self.nameEn(), opt.item, 'places', 'ばしょ');
        }
      });
      return;
    }

    if (name === 'want') {
      this.ask({
        q: J(this.nameTk(), 'は なにが ほしいですか。'),
        qEn: 'What does our character want? (This is the engine of the whole story.)',
        options: this.options('things', 4).map(function (it) {
          return { item: it, icon: D.guessIcon(it, 'things'), tk: tk(it), en: it.e };
        }),
        onPick: function (opt) {
          self.st.want = opt.item;
          self.st.mood = 'excited';
          self.say(J(self.nameTk(), 'は ', tk(opt.item), 'が ほしいです。とても ほしいです！'),
            self.nameEn() + ' wants ' + (opt.item.e || opt.item.w) + ' — very much!',
            { who: 'narrator', mood: 'excited', icon: opt.icon, sfx: 'flip' });
          self.speakTarget(0, opt.item, 'excited');
          self.round('wants', self.nameTk(), self.nameEn(), opt.item, 'things', 'ほしいもの');
        }
      });
      return;
    }

    if (name === 'scene1' || name === 'scene2') {
      this.buildAttempt(name === 'scene1' ? 1 : 2);
      return;
    }

    if (name === 'scene3') {
      this.buildHelper();
      return;
    }

    if (name === 'ending') {
      this.buildEnding();
      return;
    }

    if (name === 'recap') {
      this.steps.push({ kind: 'recap', scene: this.scene(), mood: 'excited', props: this.props() });
      return;
    }
  };

  /* Attempt = go somewhere -> obstacle -> feel bad -> repeat the target line. */
  Story.prototype.buildAttempt = function (n) {
    var self = this;
    var visited = [this.st.home].concat((this.st.tries || []).map(function (t) { return t.place; }));

    this.say(R.parse(n === 1 ? 'だい 一[いち]ばめん' : 'だい 二[に]ばめん'),
      n === 1 ? 'Scene 1' : 'Scene 2', { who: 'chapter', mood: 'neutral' });

    this.ask({
      q: J(this.nameTk(), 'は どこに 行[い]きますか。'),
      qEn: 'Where does our character go to look for it?',
      options: this.options('places', 4, visited).map(function (it) {
        return { item: it, icon: D.guessIcon(it, 'places'), tk: tk(it), en: it.e };
      }),
      onPick: function (opt) {
        self.st.tries = self.st.tries || [];
        self.st.tries.push({ place: opt.item });
        self.st.scene = D.sceneKindFor(opt.item);
        self.st.mood = 'happy';
        self.say(J(self.nameTk(), 'は ', tk(opt.item), 'に 行[い]きます。'),
          self.nameEn() + ' goes to the ' + (opt.item.e || opt.item.w) + '.',
          { who: 'narrator', scene: self.st.scene, icon: opt.icon, sfx: 'flip' });
        self.speakTarget(1, opt.item, 'happy');
        self.round('goes', self.nameTk(), self.nameEn(), opt.item, 'places', 'ばしょ ' + n);

        /* now the failure */
        var cards = JP.shuffle(D.OBSTACLES).slice(0, 3);
        var slots = {
          place: tk(opt.item), thing: tk(self.st.want),
          name: self.nameTk(), hero: tk(self.st.hero)
        };
        self.ask({
          q: R.parse('でも… なにが おこりますか。'),
          qEn: 'But… what goes wrong? (Every attempt must fail — that is what keeps the class listening.)',
          options: cards.map(function (c) {
            return { obstacle: c, icon: c.icon, tk: JP.fill(c.ja, slots), en: c.en };
          }),
          onPick: function (o) { self.failure(o.obstacle, n); }
        });
      }
    });
  };

  Story.prototype.failure = function (card, n) {
    var self = this;
    var t = this.st.tries[this.st.tries.length - 1];
    t.obstacle = card;
    this.st.mood = card.id === 'monster' || card.id === 'dog' ? 'surprised' : 'sad';

    this.say(JP.fill(card.ja, {
      place: tk(t.place), thing: tk(this.st.want), name: this.nameTk(), hero: tk(this.st.hero)
    }), card.en, { who: 'narrator', mood: this.st.mood, icon: card.icon, sfx: 'oops' });

    /* yes/no round on the obstacle keeps the new sentence in the air */
    this.drill([{
      type: 'yn',
      prompt: J(this.nameTk(), 'は ', tk(this.st.want), 'を もらいますか。'),
      en: 'Does our character get it?',
      choices: [
        { tk: R.parse('はい、そうです'), icon: '⭕', correct: false },
        { tk: R.parse('いいえ、ちがいます'), icon: '❌', correct: true }
      ],
      echo: J('いいえ。', this.nameTk(), 'は ', tk(this.st.want), 'が ありません。'),
      focus: this.st.want
    }], 'もんだい ' + n);

    /* how do they feel? */
    var feelings = this.options('feelings', 3);
    this.ask({
      q: J(this.nameTk(), 'は どうですか。'),
      qEn: 'How does our character feel now?',
      options: feelings.map(function (it) {
        return { item: it, icon: D.guessIcon(it, 'feelings'), tk: tk(it), en: it.e };
      }),
      onPick: function (opt) {
        self.st.feeling = opt.item;
        self.say(J(self.nameTk(), 'は とても ', tk(opt.item), 'です。'),
          self.nameEn() + ' feels very ' + (opt.item.e || opt.item.w) + '.',
          { who: 'hero', mood: self.st.mood, icon: opt.icon });
        self.round('feels', self.nameTk(), self.nameEn(), opt.item, 'feelings', 'きもち');
        self.speakTarget(2, self.st.want, self.st.mood);
      }
    });
  };

  Story.prototype.buildHelper = function () {
    var self = this;
    this.say(R.parse('だい 三[さん]ばめん'), 'Scene 3', { who: 'chapter', mood: 'neutral' });
    this.ask({
      q: J('だれが ', this.nameTk(), 'を てつだいますか。'),
      qEn: 'Who comes to help?',
      options: this.options('people', 4, [this.st.hero]).map(function (it) {
        return { item: it, icon: D.guessIcon(it, 'people'), tk: tk(it), en: it.e };
      }),
      onPick: function (opt) {
        self.st.helper = opt.item;
        self.st.mood = 'happy';
        self.say(J(tk(opt.item), 'が 来[き]ます。「だいじょうぶ！」と 言[い]います。'),
          (opt.item.e || opt.item.w) + ' arrives and says "It\'s okay!"',
          { who: 'helper', icon: opt.icon, sfx: 'flip' });
        self.round('helps', self.nameTk(), self.nameEn(), opt.item, 'people', 'ヘルパー');
      }
    });
  };

  Story.prototype.buildEnding = function () {
    var self = this;
    var cards = JP.shuffle(D.ENDINGS).slice(0, 3);
    /* Decided up front so the card the class reads is the ending they get. */
    var other = JP.pick(this.pool('things').filter(function (x) {
      return x.w !== self.st.want.w;
    })) || this.st.want;
    var slots = {
      helper: tk(this.st.helper), thing: tk(this.st.want), name: this.nameTk(),
      place: tk(this.st.home), other: tk(other)
    };
    this.ask({
      q: R.parse('さいごに、どう なりますか。'),
      qEn: 'How does the story end?',
      options: cards.map(function (c) {
        return { ending: c, icon: c.icon, tk: JP.fill(c.ja, slots), en: c.en };
      }),
      onPick: function (o) {
        var c = o.ending;
        self.st.ending = c;
        self.st.mood = c.kind === 'happy' ? 'excited' : 'surprised';
        self.say(JP.fill(c.ja, slots), c.en,
          { who: 'narrator', mood: self.st.mood, icon: c.icon, sfx: c.kind === 'happy' ? 'win' : 'oops' });

        self.drill([{
          type: 'yn',
          prompt: J(self.nameTk(), 'は ', tk(self.st.want), 'が ありますか。'),
          en: 'Did they get it in the end?',
          choices: [
            { tk: R.parse('はい、あります'), icon: '⭕', correct: c.kind === 'happy' },
            { tk: R.parse('いいえ、ありません'), icon: '❌', correct: c.kind !== 'happy' }
          ],
          echo: c.kind === 'happy'
            ? J('はい！', self.nameTk(), 'は ', tk(self.st.want), 'が あります。')
            : J('いいえ。でも、', self.nameTk(), 'は げんきです。'),
          focus: self.st.want
        }], 'おわり');

        self.say(R.parse('おしまい。'), 'The end.', { who: 'chapter', mood: self.st.mood, sfx: 'win' });
      }
    });
  };

  /* ---------- navigation ---------- */
  Story.prototype.currentStep = function () { return this.steps[this.i] || null; };

  Story.prototype.advance = function () {
    if (this.i < this.steps.length - 1) { this.i++; return this.currentStep(); }
    while (this.beat < BEATS.length) {
      var before = this.steps.length;
      this.buildBeat(BEATS[this.beat++]);
      if (this.steps.length > before) { this.i++; return this.currentStep(); }
    }
    return null;
  };

  Story.prototype.answer = function (option) {
    var step = this.currentStep();
    if (!step || step.kind !== 'choose' || step.answered) return null;
    step.answered = option;
    if (step.onPick) step.onPick(option);
    return this.advance();
  };

  Story.prototype.score = function (correct) {
    this.st.asked++;
    if (correct) this.st.correct++;
  };

  Story.prototype.progress = function () {
    return { beat: Math.min(this.beat, BEATS.length), total: BEATS.length };
  };

  ns.Story = Story;
  ns.BEATS = BEATS;
})(window.CCS = window.CCS || {});
