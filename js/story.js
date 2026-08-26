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

  /* Each skeleton is a different shape for the same machinery below (say/
   * ask/drill/round/spiral/speakTarget). "classic" is the original one;
   * see buildCompareBeat/buildJourneyBeat/buildMysteryBeat for the others. */
  var BEATS_BY_SKELETON = {
    classic: ['hero', 'name', 'home', 'want', 'scene1', 'scene2', 'scene3', 'ending', 'recap'],
    compare: ['hero', 'name', 'optionA', 'optionB', 'decide', 'outcome', 'recap'],
    journey: ['hero', 'name', 'stop1', 'stop2', 'stop3', 'wrapup', 'recap'],
    mystery: ['hero', 'name', 'mystery', 'suspect1', 'suspect2', 'suspect3', 'accuse', 'reveal', 'recap']
  };

  function Story(config, options) {
    this.cfg = config;
    this.opt = options || {};
    this.level = this.opt.circling || 'normal';
    this.skeletonId = BEATS_BY_SKELETON[this.opt.skeleton] ? this.opt.skeleton : 'classic';
    this.beatNames = BEATS_BY_SKELETON[this.skeletonId];
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
    var focus = this.st.want || this.st.winner || this.st.missingThing;
    if (focus) p.push(D.guessIcon(focus, 'things'));
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
      label: opt.label || '',
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
    var spiral = this.level === 'minimal' ? null : this.spiral();
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
    if (this.skeletonId === 'compare') return this.buildCompareBeat(name);
    if (this.skeletonId === 'journey') return this.buildJourneyBeat(name);
    if (this.skeletonId === 'mystery') return this.buildMysteryBeat(name);
    return this.buildClassicBeat(name);
  };

  Story.prototype.buildClassicBeat = function (name) {
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
        /* A pack can define more than 3 targets (e.g. one per grammar point
         * it's teaching) - speakTarget no-ops past the end of a shorter
         * array, so this is a no-op for every pack that only has 3. */
        self.speakTarget(3, opt.item, 'happy');
        self.speakTarget(4, opt.item, 'happy');
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
        self.st.mood = D.moodFor(opt.item);
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

  /* ================= "Compare" skeleton =================
   * A character weighs two options — each gets introduced, each gets a
   * charming pro/con twist, then the class commits to a winner. Hero/name
   * are identical to the classic skeleton, so those two beats just reuse it.
   */
  /* Compare's own fixed target grammar (D.COMPARE_TARGETS) names the two
   * options directly via {A}/{B}, so it can't go through parseTarget/
   * speakTarget above - those only know how to fill one vocab-category
   * slot at a time. `map` supplies real tokens for whichever of {A}, {B},
   * {もの}, {きもち} the template uses. */
  Story.prototype.speakCompareTarget = function (index, map, enText, icon) {
    var tpl = D.COMPARE_TARGETS[index];
    if (!tpl) return;
    this.say(J(JP.fill(tpl, map), '！'), enText || '',
      { who: 'hero', mood: this.st.mood, target: true, icon: icon || '' });
    this.drill([{
      type: 'yn',
      prompt: J(JP.fill(tpl, map), 'か。'),
      en: 'True or not?',
      choices: [
        { tk: R.parse('はい、そうです'), icon: '⭕', correct: true },
        { tk: R.parse('いいえ、ちがいます'), icon: '❌', correct: false }
      ],
      echo: JP.fill(tpl, map),
      focus: null,
      target: true
    }], 'ターゲット');
  };

  Story.prototype.buildCompareBeat = function (name) {
    var self = this;
    if (name === 'hero' || name === 'name') return this.buildClassicBeat(name);

    if (name === 'optionA' || name === 'optionB') {
      var isA = name === 'optionA';
      this.ask({
        q: isA
          ? R.parse('何[なに]が いいと 思[おも]いますか。（１つ目）')
          : R.parse('では、もう 一[ひと]つは 何[なに]が いいですか。（２つ目）'),
        qEn: isA ? 'What might be good? (Option one.)' : 'What is the other option? (Option two.)',
        options: this.options('things', 4, isA ? [] : [this.st.optionA]).map(function (it) {
          return { item: it, icon: D.guessIcon(it, 'things'), tk: tk(it), en: it.e };
        }),
        onPick: function (opt) {
          if (isA) self.st.optionA = opt.item; else self.st.optionB = opt.item;
          self.st.mood = 'excited';
          self.say(J(self.nameTk(), 'は ', tk(opt.item), 'が いいと 思[おも]いました。'),
            self.nameEn() + ' thought ' + (opt.item.e || opt.item.w) + ' might be good.',
            { who: 'narrator', mood: 'excited', icon: opt.icon, sfx: 'flip' });
          self.round('wants', self.nameTk(), self.nameEn(), opt.item, 'things', isA ? '１つ目' : '２つ目');

          var card = JP.pick(D.COMPARE_TRAITS);
          self.say(JP.fill(card.ja, { opt: tk(opt.item) }), card.en,
            { who: 'narrator', icon: card.icon, sfx: 'flip' });

          var feelings = self.options('feelings', 3, isA ? [] : [self.st.feelingA]);
          self.ask({
            q: J(tk(opt.item), 'は どうですか。'),
            qEn: 'How does that option seem overall?',
            options: feelings.map(function (it) {
              return { item: it, icon: D.guessIcon(it, 'feelings'), tk: tk(it), en: it.e };
            }),
            onPick: function (fopt) {
              if (isA) self.st.feelingA = fopt.item; else self.st.feelingB = fopt.item;
              self.st.mood = D.moodFor(fopt.item);
              self.say(J(tk(opt.item), 'は とても ', tk(fopt.item), 'です。'),
                (opt.item.e || opt.item.w) + ' seems very ' + (fopt.item.e || fopt.item.w) + '.',
                { who: 'hero', mood: self.st.mood, icon: fopt.icon });
              self.round('feels', tk(opt.item), opt.item.e || opt.item.w, fopt.item, 'feelings', isA ? 'とくちょう１' : 'とくちょう２');

              /* Both options and both feelings are now known - this is the
               * moment to actually compare them, rather than repeat two
               * separate single-item sentences. */
              if (!isA) {
                var A = self.st.optionA, B = self.st.optionB;
                var feelA = self.st.feelingA, feelB = self.st.feelingB;
                var cmpMap = { A: tk(A), B: tk(B), きもち: tk(feelB) };
                var bEn = B.e || B.w, aEn = A.e || A.w, feelEn = feelB.e || feelB.w;
                self.speakCompareTarget(0, cmpMap,
                  bEn + ' is more ' + feelEn + ' than ' + aEn + '.', D.guessIcon(B, 'things'));
                self.speakCompareTarget(2, cmpMap,
                  'Unlike ' + aEn + ', ' + bEn + ' is ' + feelEn + '.', D.guessIcon(B, 'things'));
                self.speakCompareTarget(3, cmpMap,
                  'Just like ' + aEn + ', ' + bEn + ' is ' + feelEn + '.', D.guessIcon(B, 'things'));
              }
            }
          });
        }
      });
      return;
    }

    if (name === 'decide') {
      this.say(R.parse('けっしんの とき'), 'Decision time', { who: 'chapter', mood: 'neutral' });
      this.ask({
        q: R.parse('けっきょく、どちらに しますか。'),
        qEn: 'In the end, which one do you choose?',
        options: [this.st.optionA, this.st.optionB].map(function (it) {
          return { item: it, icon: D.guessIcon(it, 'things'), tk: tk(it), en: it.e };
        }),
        onPick: function (opt) {
          self.st.winner = opt.item;
          self.st.other = (opt.item.w === self.st.optionA.w) ? self.st.optionB : self.st.optionA;
          self.st.mood = 'excited';
          self.say(J(self.nameTk(), 'は 「', tk(opt.item), 'に します！」と 言[い]いました。'),
            self.nameEn() + ' said, "I choose ' + (opt.item.e || opt.item.w) + '!"',
            { who: 'hero', mood: 'excited', icon: opt.icon, sfx: 'flip' });
          var winnerFeeling = (opt.item.w === self.st.optionA.w) ? self.st.feelingA : self.st.feelingB;
          self.speakCompareTarget(1, { もの: tk(opt.item), きもち: tk(winnerFeeling) },
            (opt.item.e || opt.item.w) + ' is the most ' + (winnerFeeling.e || winnerFeeling.w) + '.',
            D.guessIcon(opt.item, 'things'));
          self.round('wants', self.nameTk(), self.nameEn(), opt.item, 'things', 'けってい');
        }
      });
      return;
    }

    if (name === 'outcome') {
      var cards = JP.shuffle(D.COMPARE_OUTCOMES).slice(0, 3);
      var slots = { name: this.nameTk(), winner: tk(this.st.winner), other: tk(this.st.other) };
      this.ask({
        q: R.parse('さいごに、どう なりますか。'),
        qEn: 'How does it turn out?',
        options: cards.map(function (c) {
          return { ending: c, icon: c.icon, tk: JP.fill(c.ja, slots), en: c.en };
        }),
        onPick: function (o) {
          var c = o.ending;
          self.st.mood = c.kind === 'happy' ? 'excited' : 'surprised';
          self.say(JP.fill(c.ja, slots), c.en,
            { who: 'narrator', mood: self.st.mood, icon: c.icon, sfx: c.kind === 'happy' ? 'win' : 'oops' });

          self.drill([{
            type: 'yn',
            prompt: J(self.nameTk(), 'は ', tk(self.st.winner), 'を えらびましたか。'),
            en: 'Did they end up with their choice?',
            choices: [
              { tk: R.parse('はい、そうです'), icon: '⭕', correct: c.kind === 'happy' },
              { tk: R.parse('いいえ、ちがいます'), icon: '❌', correct: c.kind !== 'happy' }
            ],
            echo: c.kind === 'happy'
              ? J('はい！', self.nameTk(), 'は ', tk(self.st.winner), 'が あります。')
              : J('いいえ。でも、', self.nameTk(), 'は げんきです。'),
            focus: self.st.winner
          }], 'けっか');

          self.say(R.parse('おしまい。'), 'The end.', { who: 'chapter', mood: self.st.mood, sfx: 'win' });
        }
      });
      return;
    }

    if (name === 'recap') {
      this.steps.push({ kind: 'recap', scene: this.scene(), mood: 'excited', props: this.props() });
      return;
    }
  };

  /* ================= "Journey" skeleton =================
   * Three stops in a row. Nothing carries forward as a failure - each stop
   * gets its own small (mostly upbeat) event, resolved immediately, which
   * keeps the tone lighter and episodic rather than cumulative.
   */
  Story.prototype.buildJourneyBeat = function (name) {
    var self = this;
    if (name === 'hero' || name === 'name') return this.buildClassicBeat(name);

    if (name === 'stop1' || name === 'stop2' || name === 'stop3') {
      var n = name === 'stop1' ? 1 : name === 'stop2' ? 2 : 3;
      var visited = (this.st.stops || []).map(function (s) { return s.place; });
      var qs = [
        R.parse('はじめに、どこに 行[い]きますか。'),
        R.parse('それから、どこに 行[い]きますか。'),
        R.parse('さいごに、どこに 行[い]きますか。')
      ];
      var qsEn = ['First, where do you go?', 'Then, where do you go?', 'Finally, where do you go?'];
      var chapterKanji = n === 1 ? '一[いち]' : n === 2 ? '二[に]' : '三[さん]';
      this.say(R.parse('よてい ' + chapterKanji), 'Stop ' + n, { who: 'chapter', mood: 'neutral' });
      this.ask({
        q: qs[n - 1],
        qEn: qsEn[n - 1],
        options: this.options('places', 4, visited).map(function (it) {
          return { item: it, icon: D.guessIcon(it, 'places'), tk: tk(it), en: it.e };
        }),
        onPick: function (opt) {
          self.st.stops = self.st.stops || [];
          self.st.stops.push({ place: opt.item });
          self.st.scene = D.sceneKindFor(opt.item);
          self.st.mood = 'happy';
          self.say(J(self.nameTk(), 'は ', tk(opt.item), 'に 行[い]きます。'),
            self.nameEn() + ' goes to the ' + (opt.item.e || opt.item.w) + '.',
            { who: 'narrator', scene: self.st.scene, icon: opt.icon, sfx: 'flip' });
          self.speakTarget(n === 1 ? 0 : 1, opt.item, 'happy');
          self.round('goes', self.nameTk(), self.nameEn(), opt.item, 'places', 'ばしょ ' + n);

          var card = JP.pick(D.JOURNEY_EVENTS);
          self.st.stops[self.st.stops.length - 1].event = card;
          self.say(JP.fill(card.ja, { place: tk(opt.item) }), card.en,
            { who: 'narrator', mood: 'happy', icon: card.icon, sfx: 'flip' });

          var feelings = self.options('feelings', 3);
          self.ask({
            q: J(self.nameTk(), 'は どう 思[おも]いましたか。'),
            qEn: 'How did that feel?',
            options: feelings.map(function (it) {
              return { item: it, icon: D.guessIcon(it, 'feelings'), tk: tk(it), en: it.e };
            }),
            onPick: function (fopt) {
              self.st.mood = D.moodFor(fopt.item);
              self.say(J(self.nameTk(), 'は とても ', tk(fopt.item), 'です。'),
                self.nameEn() + ' felt very ' + (fopt.item.e || fopt.item.w) + '.',
                { who: 'hero', mood: self.st.mood, icon: fopt.icon });
              self.round('feels', self.nameTk(), self.nameEn(), fopt.item, 'feelings', 'きもち ' + n);
            }
          });
        }
      });
      return;
    }

    if (name === 'wrapup') {
      var stops = this.st.stops || [];
      var p3 = stops[2] && stops[2].place;
      this.say(J(this.nameTk(), 'は 今日[きょう] ', tk(stops[0] && stops[0].place),
        'と ', tk(stops[1] && stops[1].place), 'と ', tk(p3), 'に 行[い]きました。'),
        this.nameEn() + ' went to three places today.', { who: 'narrator', mood: 'happy', sfx: 'flip' });
      this.speakTarget(2, p3, 'happy');
      this.drill([{
        type: 'yn',
        prompt: J(this.nameTk(), 'は たのしい 一日[いちにち]でしたか。'),
        en: 'Was it a fun day?',
        choices: [
          { tk: R.parse('はい、そうです'), icon: '⭕', correct: true },
          { tk: R.parse('いいえ、ちがいます'), icon: '❌', correct: false }
        ],
        echo: R.parse('はい、とても たのしい 一日[いちにち]でした。'),
        focus: p3
      }], 'まとめ');
      this.say(R.parse('おしまい。'), 'The end.', { who: 'chapter', mood: 'happy', sfx: 'win' });
      return;
    }

    if (name === 'recap') {
      this.steps.push({ kind: 'recap', scene: this.scene(), mood: 'happy', props: this.props() });
      return;
    }
  };

  /* ================= "Mystery" skeleton =================
   * Something goes missing; the class interviews three suspects (one is
   * secretly guilty, chosen at random) and finally accuses one. Guessing
   * "suspicious or not" for each suspect is scored against who is actually
   * guilty, so there is a small real deduction game under the language work.
   */
  Story.prototype.buildMysteryBeat = function (name) {
    var self = this;
    if (name === 'name') return this.buildClassicBeat(name);

    if (name === 'hero') {
      this.st.scene = 'town';
      this.say(R.parse('ある 日[ひ]、たいへんな ことが おこりました。'),
        'One day, something terrible happened.', { who: 'narrator', mood: 'surprised' });
      this.ask({
        q: R.parse('たんていは だれですか。'),
        qEn: 'Who is the detective?',
        hint: 'Class vote!',
        options: this.options('people', 4).map(function (it) {
          return { item: it, icon: D.guessIcon(it, 'people'), tk: tk(it), en: it.e, avatar: it };
        }),
        onPick: function (opt) {
          self.st.hero = opt.item;
          self.st.mood = 'neutral';
          self.say(J('たんていは ', tk(opt.item), 'です。'),
            'The detective is a ' + (opt.item.e || opt.item.w) + '.',
            { who: 'narrator', icon: opt.icon, sfx: 'flip' });
          self.round('isA', R.parse('たんてい'), 'The detective', opt.item, 'people', 'たんてい');
        }
      });
      return;
    }

    if (name === 'mystery') {
      this.ask({
        q: R.parse('なにが なくなりましたか。'),
        qEn: 'What went missing?',
        options: this.options('things', 4).map(function (it) {
          return { item: it, icon: D.guessIcon(it, 'things'), tk: tk(it), en: it.e };
        }),
        onPick: function (opt) {
          self.st.missingThing = opt.item;
          self.st.mood = 'surprised';
          self.say(J('「わたしの ', tk(opt.item), 'が ありません！」'),
            'My ' + (opt.item.e || opt.item.w) + ' is missing!',
            { who: 'narrator', mood: 'surprised', icon: opt.icon, sfx: 'oops' });
          self.speakTarget(0, opt.item, 'surprised');
          self.round('missing', R.parse('それ'), 'It', opt.item, 'things', 'なくしもの');
          self.st.guiltyIndex = Math.floor(Math.random() * 3);
          self.st.suspects = [];
        }
      });
      return;
    }

    if (name === 'suspect1' || name === 'suspect2' || name === 'suspect3') {
      var n = name === 'suspect1' ? 1 : name === 'suspect2' ? 2 : 3;
      var exclude = [this.st.hero].concat((this.st.suspects || []).map(function (s) { return s.item; }));
      var chapterKanji = n === 1 ? '一[いち]' : n === 2 ? '二[に]' : '三[さん]';
      this.say(R.parse('ようぎしゃ ' + chapterKanji), 'Suspect ' + n, { who: 'chapter', mood: 'neutral' });
      this.ask({
        q: R.parse('つぎの ようぎしゃは だれですか。'),
        qEn: 'Who is the next suspect?',
        options: this.options('people', 4, exclude).map(function (it) {
          return { item: it, icon: D.guessIcon(it, 'people'), tk: tk(it), en: it.e, avatar: it };
        }),
        onPick: function (opt) {
          self.st.suspects.push({ item: opt.item });
          self.st.helper = opt.item;
          self.st.mood = 'neutral';
          var label = R.text(tk(opt.item));
          self.say(J(tk(opt.item), 'が とうじょうします。'),
            (opt.item.e || opt.item.w) + ' appears.',
            { who: 'helper', label: label, icon: opt.icon, sfx: 'flip' });
          self.speakTarget(1, opt.item, 'neutral');
          self.round('isA', R.parse('ようぎしゃ'), 'The suspect', opt.item, 'people', 'ようぎしゃ ' + n);

          var card = JP.pick(D.MYSTERY_CLUES);
          self.st.suspects[self.st.suspects.length - 1].clue = card;
          self.say(R.parse(card.ja), card.en, { who: 'helper', label: label, icon: card.icon });

          var guilty = (n - 1) === self.st.guiltyIndex;
          self.drill([{
            type: 'yn',
            prompt: J(tk(opt.item), 'は あやしいと 思[おも]いますか。'),
            en: 'Do you think this suspect is up to something?',
            choices: [
              { tk: R.parse('はい、あやしいです'), icon: '🤔', correct: guilty },
              { tk: R.parse('いいえ、あやしくないです'), icon: '🙂', correct: !guilty }
            ],
            echo: R.parse('メモしましょう。'),
            focus: opt.item
          }], 'ちょうしゅ ' + n);
        }
      });
      return;
    }

    if (name === 'accuse') {
      this.say(R.parse('はんてい'), 'The verdict', { who: 'chapter', mood: 'neutral' });
      this.ask({
        q: R.parse('たんていは だれが はんにんだと 思[おも]いますか。'),
        qEn: 'Who does the detective accuse?',
        options: this.st.suspects.map(function (s) {
          return { item: s.item, icon: D.guessIcon(s.item, 'people'), tk: tk(s.item), en: s.item.e, avatar: s.item };
        }),
        onPick: function (opt) {
          self.st.accused = opt.item;
          self.st.mood = 'excited';
          self.say(J('たんていは 「', tk(opt.item), 'が はんにんです！」と 言[い]いました。'),
            'The detective said, "' + (opt.item.e || opt.item.w) + ' is the culprit!"',
            { who: 'hero', mood: 'excited', icon: opt.icon, sfx: 'flip' });
          self.speakTarget(2, opt.item, 'excited');
        }
      });
      return;
    }

    if (name === 'reveal') {
      var actual = this.st.suspects[this.st.guiltyIndex].item;
      var correct = actual.w === this.st.accused.w;
      this.st.mood = correct ? 'excited' : 'surprised';
      this.say(correct
        ? J('せいかい！', tk(this.st.accused), 'が はんにんでした！')
        : J('ざんねん！じつは ', tk(actual), 'が はんにんでした！'),
        correct ? 'Correct! That was the culprit!' : 'Actually, it was someone else!',
        { who: 'narrator', mood: this.st.mood, sfx: correct ? 'win' : 'oops' });
      this.drill([{
        type: 'yn',
        prompt: R.parse('じけんは かいけつしましたか。'),
        en: 'Was the case solved?',
        choices: [
          { tk: R.parse('はい、そうです'), icon: '⭕', correct: correct },
          { tk: R.parse('いいえ、ちがいます'), icon: '❌', correct: !correct }
        ],
        echo: correct ? R.parse('じけん かいけつ！') : R.parse('また こんど がんばりましょう。'),
        focus: this.st.missingThing
      }], 'かいけつ');
      this.say(R.parse('おしまい。'), 'The end.', { who: 'chapter', mood: this.st.mood, sfx: 'win' });
      return;
    }

    if (name === 'recap') {
      this.steps.push({ kind: 'recap', scene: this.scene(), mood: 'excited', props: this.props() });
      return;
    }
  };

  /* ---------- navigation ---------- */
  Story.prototype.currentStep = function () { return this.steps[this.i] || null; };

  Story.prototype.advance = function () {
    if (this.i < this.steps.length - 1) { this.i++; return this.currentStep(); }
    while (this.beat < this.beatNames.length) {
      var before = this.steps.length;
      this.buildBeat(this.beatNames[this.beat++]);
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
    return { beat: Math.min(this.beat, this.beatNames.length), total: this.beatNames.length };
  };

  ns.Story = Story;
  ns.BEATS_BY_SKELETON = BEATS_BY_SKELETON;
})(window.CCS = window.CCS || {});
