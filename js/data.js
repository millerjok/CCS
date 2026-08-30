/* CCS — content packs
 * Everything a teacher can change lives in a "config" object of this shape:
 *   { title, targets:[3 strings], vocab:{people,places,things,actions,feelings}, options }
 * Vocab item: { w: word, r: reading (kana), e: English, icon: emoji }
 */
(function (ns) {
  'use strict';

  var CATS = [
    { key: 'people',   ja: 'ひと',   en: 'People / characters', icon: '🧑', hint: '学生, 先生, ねこ, ロボット …' },
    { key: 'places',   ja: 'ばしょ', en: 'Places',              icon: '🏫', hint: '学校, 公園, みせ, うち …' },
    { key: 'things',   ja: 'もの',   en: 'Things',              icon: '🍜', hint: 'ラーメン, ケーキ, おかね …' },
    { key: 'actions',  ja: 'どうし', en: 'Verbs (ます form)',   icon: '🏃', hint: '食べます, 買います, 見ます …' },
    { key: 'feelings', ja: 'きもち', en: 'Feelings / adjectives', icon: '😄', hint: 'うれしい, かなしい, げんき …' }
  ];

  /* Slot names a teacher can drop into a target structure, e.g. "{もの}が ほしいです" */
  var SLOTS = {
    'もの': 'things', 'thing': 'things', 'things': 'things',
    'ばしょ': 'places', 'place': 'places', 'places': 'places',
    'ひと': 'people', 'person': 'people', 'people': 'people',
    'どうし': 'actions', 'verb': 'actions', 'action': 'actions',
    'きもち': 'feelings', 'feeling': 'feelings', 'adj': 'feelings'
  };

  /* personOnly marks a feelings word as a real emotion/trait that only
   * makes sense said of someone alive - "happy", "kind" - as opposed to a
   * descriptive quality like "fun" or "delicious" that a thing can have too. */
  function v(w, r, e, icon, personOnly) {
    var item = { w: w, r: r, e: e, icon: icon };
    if (personOnly) item.personOnly = true;
    return item;
  }

  /* ---------- Default pack: works straight out of the box ---------- */
  var DEFAULT_CONFIG = {
    title: 'ラーメンが ほしい！',
    /* 4th target added so this pack's own "Verbs" vocab actually
     * surfaces in the story - it wasn't referenced anywhere before. */
    targets: [
      '{もの}が ほしいです',
      '{ばしょ}に 行[い]きます',
      'でも、ありません',
      '{ばしょ}で {どうし}'
    ],
    targetsEn: ['wants {もの}', 'goes to {ばしょ}', "but it isn't there", '{どうし} at {ばしょ}'],
    vocab: {
      people: [
        v('学生', 'がくせい', 'student', '🧑‍🎓'),
        v('先生', 'せんせい', 'teacher', '👩‍🏫'),
        v('ねこ', 'ねこ', 'cat', '🐱'),
        v('犬', 'いぬ', 'dog', '🐶'),
        v('ロボット', 'ロボット', 'robot', '🤖'),
        v('おばあさん', 'おばあさん', 'grandmother', '👵')
      ],
      places: [
        v('学校', 'がっこう', 'school', '🏫'),
        v('公園', 'こうえん', 'park', '🌳'),
        v('みせ', 'みせ', 'shop', '🏪'),
        v('うち', 'うち', 'home', '🏠'),
        v('えき', 'えき', 'station', '🚉'),
        v('レストラン', 'レストラン', 'restaurant', '🍽️')
      ],
      things: [
        v('ラーメン', 'ラーメン', 'ramen', '🍜'),
        v('ケーキ', 'ケーキ', 'cake', '🍰'),
        v('すし', 'すし', 'sushi', '🍣'),
        v('おかね', 'おかね', 'money', '💴'),
        v('ゲーム', 'ゲーム', 'video game', '🎮'),
        v('本', 'ほん', 'book', '📖')
      ],
      /* The new "{ばしょ}で {どうし}" target fills the verb bare, with no
       * object anywhere else in the sentence, so every entry needs its
       * own object to read as a complete sentence. */
      actions: [
        v('ケーキを 食べます', 'ケーキを たべます', 'eats cake', '🍴'),
        v('お茶を 飲みます', 'おちゃを のみます', 'drinks tea', '🥤'),
        v('ゲームを 買います', 'ゲームを かいます', 'buys a video game', '🛒'),
        v('テレビを 見ます', 'テレビを みます', 'watches TV', '👀')
      ],
      feelings: [
        v('うれしい', 'うれしい', 'happy', '😄', true),
        v('かなしい', 'かなしい', 'sad', '😢', true),
        v('げんき', 'げんき', 'energetic', '💪', true),
        v('たいへん', 'たいへん', 'in trouble', '😱'),
        v('おいしい', 'おいしい', 'delicious', '😋')
      ]
    }
  };

  /* ---------- Presets built from the iitomo 2 word lists ----------
   * `rev` marks the built-in version of a preset's own config. Bump a
   * preset's rev whenever you edit ITS config (vocab, targets, title) -
   * a browser that saved a copy at an older rev gets offered the update
   * in Setup (see app.js checkStalePack/renderUpdateBanner) instead of
   * silently keeping stale content forever. */
  var PRESETS = [
    {
      id: 'default',
      name: 'ラーメンが ほしい！',
      en: 'Starter pack (food + town)',
      icon: '🍜',
      rev: 4,
      config: DEFAULT_CONFIG
    },
    {
      id: 'food',
      name: 'たべもの',
      en: 'iitomo 2 — Food & drink',
      icon: '🍱',
      rev: 4,
      config: {
        title: 'おなかが すきました！',
        /* 4th target added so this pack's own "Verbs" vocab actually
         * surfaces in the story - it wasn't referenced anywhere before. */
        targets: ['{もの}を 食[た]べます', '{もの}が 好[す]きです', 'とても おいしいです', '{ばしょ}で {どうし}'],
        targetsEn: ['eats {もの}', 'likes {もの}', "it's very delicious", '{どうし} at {ばしょ}'],
        vocab: {
          people: [v('学生', 'がくせい', 'student', '🧑‍🎓'), v('先生', 'せんせい', 'teacher', '👩‍🏫'),
                   v('お母さん', 'おかあさん', 'mother', '👩'), v('犬', 'いぬ', 'dog', '🐶'),
                   v('ねこ', 'ねこ', 'cat', '🐱'), v('コックさん', 'コックさん', 'chef', '👨‍🍳')],
          places: [v('レストラン', 'レストラン', 'restaurant', '🍽️'), v('うち', 'うち', 'home', '🏠'),
                   v('学校', 'がっこう', 'school', '🏫'), v('みせ', 'みせ', 'shop', '🏪'),
                   v('公園', 'こうえん', 'park', '🌳'), v('だいどころ', 'だいどころ', 'kitchen', '🍳')],
          things: [v('朝ごはん', 'あさごはん', 'breakfast', '🍳'), v('昼ごはん', 'ひるごはん', 'lunch', '🍱'),
                   v('晩ごはん', 'ばんごはん', 'dinner', '🍛'), v('パン', 'パン', 'bread', '🍞'),
                   v('肉', 'にく', 'meat', '🍖'), v('魚', 'さかな', 'fish', '🐟'),
                   v('野菜', 'やさい', 'vegetables', '🥦'), v('果物', 'くだもの', 'fruit', '🍎'),
                   v('お茶', 'おちゃ', 'tea', '🍵'), v('牛乳', 'ぎゅうにゅう', 'milk', '🥛')],
          /* The new "{ばしょ}で {どうし}" target fills the verb bare, with
           * no object anywhere else in the sentence, so every entry needs
           * its own object - matched to this pack's own food vocab. */
          actions: [v('パンを 食べます', 'パンを たべます', 'eats bread', '🍴'), v('お茶を 飲みます', 'おちゃを のみます', 'drinks tea', '🥤'),
                    v('果物を 買います', 'くだものを かいます', 'buys fruit', '🛒'), v('晩ごはんを 作ります', 'ばんごはんを つくります', 'makes dinner', '👨‍🍳')],
          feelings: [v('おいしい', 'おいしい', 'delicious', '😋'), v('うれしい', 'うれしい', 'happy', '😄', true),
                     v('かなしい', 'かなしい', 'sad', '😢', true), v('たいへん', 'たいへん', 'in trouble', '😱')]
        }
      }
    },
    {
      id: 'school',
      name: 'がっこう',
      en: 'iitomo 2 — School & subjects',
      icon: '🏫',
      rev: 4,
      config: {
        title: 'しゅくだいが ありません！',
        /* 4th target added so this pack's own "Verbs" vocab actually
         * surfaces in the story - it wasn't referenced anywhere before. */
        targets: ['{もの}が あります', '{ばしょ}に 行[い]きます', 'とても むずかしいです', '{ばしょ}で {どうし}'],
        targetsEn: ['has {もの}', 'goes to {ばしょ}', "it's very difficult", '{どうし} at {ばしょ}'],
        vocab: {
          people: [v('中学生', 'ちゅうがくせい', 'junior high student', '🧑‍🎓'), v('高校生', 'こうこうせい', 'high school student', '🎒'),
                   v('先生', 'せんせい', 'teacher', '👩‍🏫'), v('友だち', 'ともだち', 'friend', '🧑‍🤝‍🧑'),
                   v('校長先生', 'こうちょうせんせい', 'principal', '🕴️'), v('ロボット', 'ロボット', 'robot', '🤖')],
          places: [v('学校', 'がっこう', 'school', '🏫'), v('小学校', 'しょうがっこう', 'primary school', '🏫'),
                   v('大学', 'だいがく', 'university', '🎓'), v('きょうしつ', 'きょうしつ', 'classroom', '🪑'),
                   v('としょかん', 'としょかん', 'library', '📚'), v('うち', 'うち', 'home', '🏠')],
          things: [v('英語', 'えいご', 'English', '🔤'), v('すう学', 'すうがく', 'maths', '➗'),
                   v('音楽', 'おんがく', 'music', '🎵'), v('りか', 'りか', 'science', '🔬'),
                   v('びじゅつ', 'びじゅつ', 'art', '🎨'), v('体いく', 'たいいく', 'PE', '⚽'),
                   v('しゅくだい', 'しゅくだい', 'homework', '📝'), v('時間わり', 'じかんわり', 'timetable', '🗓️')],
          actions: [v('勉強します', 'べんきょうします', 'studies', '📖'), v('黒板を 見ます', 'こくばんを みます', 'looks at the blackboard', '👀'),
                    v('音楽を 聞きます', 'おんがくを ききます', 'listens to music', '👂'),
                    v('そうじをします', 'そうじをします', 'cleans', '🧹')],
          feelings: [v('たのしい', 'たのしい', 'fun', '😆'), v('むずかしい', 'むずかしい', 'difficult', '😵'),
                     v('げんき', 'げんき', 'energetic', '💪', true), v('かなしい', 'かなしい', 'sad', '😢', true)]
        }
      }
    },
    {
      id: 'hobbies',
      name: 'しゅみ',
      en: 'iitomo 2 — Hobbies & free time',
      icon: '🎮',
      rev: 4,
      config: {
        title: 'ひまな 土よう日',
        targets: ['{もの}が 好[す]きです', '{ばしょ}で {どうし}', 'ぜんぜん おもしろくないです'],
        targetsEn: ['likes {もの}', '{どうし} at {ばしょ}', 'not interesting at all'],
        vocab: {
          people: [v('学生', 'がくせい', 'student', '🧑‍🎓'), v('友だち', 'ともだち', 'friend', '🧑‍🤝‍🧑'),
                   v('お兄さん', 'おにいさん', 'older brother', '🧒'), v('先生', 'せんせい', 'teacher', '👩‍🏫'),
                   v('犬', 'いぬ', 'dog', '🐶'), v('ゆうめいな 人', 'ゆうめいな ひと', 'a famous person', '🌟')],
          places: [v('公園', 'こうえん', 'park', '🌳'), v('うち', 'うち', 'home', '🏠'),
                   v('えき', 'えき', 'station', '🚉'), v('みせ', 'みせ', 'shop', '🏪'),
                   v('プール', 'プール', 'pool', '🏊'), v('海', 'うみ', 'the sea', '🌊'),
                   v('へや', 'へや', 'room', '🚪'), v('ビーチ', 'ビーチ', 'beach', '🏖️'),
                   v('山', 'やま', 'mountain', '⛰️'), v('川', 'かわ', 'river', '🏞️')],
          things: [v('音楽', 'おんがく', 'music', '🎵'), v('本', 'ほん', 'book', '📖'),
                   v('まんが', 'まんが', 'manga', '📕'), v('えいが', 'えいが', 'movie', '🎬'),
                   v('水泳', 'すいえい', 'swimming', '🏊'), v('テニス', 'テニス', 'tennis', '🎾'),
                   v('ゲーム', 'ゲーム', 'video game', '🎮'), v('じてんしゃ', 'じてんしゃ', 'bicycle', '🚲'),
                   v('しゅみ', 'しゅみ', 'a hobby', '🎨'), v('りょうり', 'りょうり', 'cooking', '🍳'),
                   v('どくしょ', 'どくしょ', 'reading', '📚'), v('つり', 'つり', 'fishing', '🎣'),
                   v('しゃしん', 'しゃしん', 'a photo', '📸'), v('うた', 'うた', 'a song', '🎤')],
          /* This pack's target "{ばしょ}で {どうし}" fills the verb bare,
           * with no object anywhere else in the sentence - a bare
           * transitive verb (見ます, とります, かきます...) then reads as
           * incomplete ("watches!" - watches what?). Every entry gives
           * itself an object; あそびます stays bare since it's genuinely
           * intransitive ("plays/has fun" needs nothing else). */
          actions: [v('スポーツを します', 'スポーツを します', 'does sports', '✨'),
                    v('えいがを 見ます', 'えいがを 見ます', 'watches a movie', '👀'),
                    v('おんがくを 聞きます', 'おんがくを 聞きます', 'listens to music', '👂'),
                    v('本を 読みます', 'ほんを よみます', 'reads a book', '📖'),
                    v('ゲームを 買います', 'ゲームを かいます', 'buys a video game', '🛒'),
                    v('りょうりを つくります', 'りょうりを つくります', 'cooks', '🍳'),
                    v('ギターを ひきます', 'ギターを ひきます', 'plays the guitar', '🎸'),
                    v('あそびます', 'あそびます', 'plays / has fun', '🎈'),
                    v('しゃしんを とります', 'しゃしんを とります', 'takes photos', '📸'),
                    v('えを かきます', 'えを かきます', 'draws a picture', '✏️'),
                    v('うたを うたいます', 'うたを うたいます', 'sings a song', '🎤'),
                    v('じてんしゃに のります', 'じてんしゃに のります', 'rides a bicycle', '🚲'),
                    v('けいたいでんわを つかいます', 'けいたいでんわを つかいます', 'uses a mobile phone', '📱')],
          feelings: [v('たのしい', 'たのしい', 'fun', '😆'), v('つまらない', 'つまらない', 'boring', '🥱'),
                     v('うれしい', 'うれしい', 'happy', '😄', true), v('ひま', 'ひま', 'free / not busy', '🛋️', true)]
        }
      }
    },
    {
      id: 'farmstay',
      name: 'ファームステイ',
      en: 'Farm Stay Experience',
      icon: '🚜',
      rev: 4,
      config: {
        title: 'ファームステイの けいけん',
        /* 4th target added so this pack's own "Verbs" vocab actually
         * surfaces in the story - it wasn't referenced anywhere before. */
        targets: ['{もの}を 作[つく]ります', '{ばしょ}に 住[す]んでいます', 'しごとは {きもち}です', 'まいにち、{どうし}'],
        targetsEn: ['makes / grows {もの}', 'lives in {ばしょ}', 'the work is {きもち}', '{どうし} every day'],
        vocab: {
          people: [v('学生', 'がくせい', 'student', '🧑‍🎓'), v('ボランティア', 'ボランティア', 'volunteer', '🙋'),
                   v('農家の人', 'のうかの ひと', 'farmer', '👨‍🌾'), v('青山さん', 'あおやまさん', 'host (Aoyama-san)', '🧑‍🌾'),
                   v('友だち', 'ともだち', 'friend', '🧑‍🤝‍🧑'), v('先生', 'せんせい', 'teacher', '👩‍🏫')],
          places: [v('いなか', 'いなか', 'countryside', '🌾'), v('のうじょう', 'のうじょう', 'farm', '🚜'),
                   v('和歌山', 'わかやま', 'Wakayama', '🗾'), v('山', 'やま', 'mountain', '⛰️'),
                   v('川', 'かわ', 'river', '🏞️'), v('うち', 'うち', "the host's house", '🏠')],
          things: [v('やさい', 'やさい', 'vegetables', '🥦'), v('日本料理', 'にほんりょうり', 'Japanese food', '🍱'),
                   v('ピザ', 'ピザ', 'pizza', '🍕'), v('ビーフパイ', 'ビーフパイ', 'beef pie', '🥧'),
                   v('しごと', 'しごと', 'work', '💼'), v('けいけん', 'けいけん', 'an experience', '✨')],
          /* 住みます dropped - already the fixed verb in target #2
           * ("{ばしょ}に 住んでいます"), so keeping it here just duplicated
           * that rather than adding anything the class would hear. The
           * new "まいにち、{どうし}" target fills the verb bare, so
           * 学びます/作ります need their own object to read as complete
           * sentences; はたらきます/てつだいます are genuinely intransitive
           * and stay bare. */
          actions: [v('のうぎょうを 学びます', 'のうぎょうを まなびます', 'learns farming', '📚'),
                    v('やさいを 作ります', 'やさいを つくります', 'grows vegetables', '🌱'),
                    v('はたらきます', 'はたらきます', 'works', '💪'),
                    v('てつだいます', 'てつだいます', 'helps out', '🤝'),
                    v('どうぶつの せわを します', 'どうぶつの せわを します', 'takes care of animals', '🐄')],
          feelings: [v('たいへん', 'たいへん', 'tough / hard', '😓'), v('いたい', 'いたい', 'painful', '🤕'),
                     v('すばらしい', 'すばらしい', 'wonderful', '🌟'), v('うれしい', 'うれしい', 'happy', '😄', true)]
        }
      }
    },
    {
      id: 'hiroshima',
      name: '広島',
      en: 'Hiroshima Trip (email home)',
      icon: '⛩️',
      rev: 4,
      config: {
        title: '広島への たび',
        targets: [
          '{ひと}が {もの}について 説明[せつめい]してくれました',
          '明日[あした]は {ばしょ}に 行[い]く 予定[よてい]です',
          '{もの}を 買[か]う つもりです',
          '{ばしょ}に 着[つ]いたら、{どうし}',
          '{ばしょ}に いる 間[あいだ]に、{どうし}'
        ],
        targetsEn: [
          '{ひと} explained about {もの}',
          'plans to go to {ばしょ} tomorrow',
          'intends to buy {もの}',
          'once they arrive at {ばしょ}, {どうし}',
          'while they are at {ばしょ}, {どうし}'
        ],
        vocab: {
          people: [v('家族', 'かぞく', 'family', '👪'), v('ガイド', 'ガイド', 'guide', '🗺️'),
                   v('友だち', 'ともだち', 'friend', '🧑‍🤝‍🧑'), v('観光客', 'かんこうきゃく', 'tourist', '📸'),
                   v('地元の人', 'じもとの ひと', 'local person', '🧑'), v('先生', 'せんせい', 'teacher', '👩‍🏫')],
          places: [v('広島', 'ひろしま', 'Hiroshima', '🗾'), v('平和記念公園', 'へいわきねんこうえん', 'Peace Memorial Park', '🕊️'),
                   v('ホテル', 'ホテル', 'hotel', '🏨'), v('宮島', 'みやじま', 'Miyajima', '🚢'),
                   v('神社', 'じんじゃ', 'shrine', '⛩️'), v('伝統工芸の店', 'でんとうこうげいの みせ', 'traditional crafts shop', '🏮')],
          things: [v('タオル', 'タオル', 'towel', '🧺'), v('シーツ', 'シーツ', 'sheets', '🛏️'),
                   v('お好み焼き', 'おこのみやき', 'okonomiyaki', '🥞'), v('筆', 'ふで', '(calligraphy) brush', '🖌️'),
                   v('写真', 'しゃしん', 'photo', '📷'), v('おみやげ', 'おみやげ', 'souvenir', '🎁')],
          /* This pack's たら/間に targets fill the verb bare, with no
           * object anywhere else in the sentence, so every entry needs
           * its own object to read as a complete sentence - matched back
           * to the reading passage itself (書道を始める, 平和について話す). */
          actions: [v('みちを 説明します', 'みちを せつめいします', 'explains the way', '🗣️'),
                    v('おみやげを 買います', 'おみやげを かいます', 'buys a souvenir', '🛍️'),
                    v('しゃしんを とります', 'しゃしんを とります', 'takes photos', '📷'),
                    v('書道を 始めます', 'しょどうを はじめます', 'starts calligraphy', '🎬'),
                    v('平和について 話します', 'へいわについて はなします', 'talks about peace', '💬')],
          feelings: [v('うれしい', 'うれしい', 'happy', '😄', true), v('たのしい', 'たのしい', 'fun', '😆'),
                     v('しんせつ', 'しんせつ', 'kind', '🤝', true), v('ゆうめい', 'ゆうめい', 'famous', '⭐')]
        }
      }
    },
    {
      id: 'freetime',
      name: 'ひまな じかん',
      en: 'Free time & frequency (how often, how was your holiday)',
      icon: '🗓️',
      rev: 3,
      config: {
        title: '去年の 休み',
        /* あまり/ぜんぜん ~ません need real verb conjugation (ます -> ません),
         * which the template engine can't do by concatenation, so the
         * automated targets stick to the affirmative frequency words -
         * still exercises いつも/たいてい/よく/ときどき plus the past-tense
         * holiday-recap line. */
        targets: [
          'あさ、いつも {どうし}',
          'しゅうまつに、たいてい {どうし}',
          'ひまな 時[とき]は、よく {どうし}',
          '休[やす]みに、ときどき {ばしょ}に 行[い]きます',
          '去年[きょねん]の 休[やす]みは {きもち}です'
        ],
        targetsEn: [
          'always {どうし} in the mornings',
          'usually {どうし} on weekends',
          'often {どうし} in free time',
          'sometimes goes to {ばしょ} on holidays',
          "last year's holiday was {きもち}"
        ],
        vocab: {
          people: [v('学生', 'がくせい', 'student', '🧑‍🎓'), v('友だち', 'ともだち', 'friend', '🧑‍🤝‍🧑'),
                   v('家族', 'かぞく', 'family', '👪'), v('先生', 'せんせい', 'teacher', '👩‍🏫'),
                   v('クラスメート', 'クラスメート', 'classmate', '🧑‍🎓')],
          places: [v('へや', 'へや', 'room', '🚪'), v('うみ', 'うみ', 'sea / ocean', '🌊'),
                   v('ビーチ', 'ビーチ', 'beach', '🏖️'), v('山', 'やま', 'mountain', '⛰️'),
                   v('川', 'かわ', 'river', '🏞️'), v('うち', 'うち', 'home', '🏠')],
          things: [v('しゅみ', 'しゅみ', 'a hobby', '🎨'), v('りょうり', 'りょうり', 'cooking', '🍳'),
                   v('どくしょ', 'どくしょ', 'reading (as a hobby)', '📚'), v('つり', 'つり', 'fishing', '🎣'),
                   v('はれ', 'はれ', 'fine weather', '☀️'), v('くもり', 'くもり', 'cloudy', '☁️')],
          /* Bare つくります/ひきます/とります/かきます/うたいます read as
           * incomplete sentences once slotted into a frequency target
           * ("usually makes!" - makes what?) - the sheet itself always
           * pairs these with an object (しゃしんを とります, えを かきます,
           * うたを うたいます), so every entry here does the same. */
          actions: [v('ケーキを つくります', 'ケーキを つくります', 'makes a cake', '🍰'),
                    v('ギターを ひきます', 'ギターを ひきます', 'plays the guitar', '🎸'),
                    v('しゃしんを とります', 'しゃしんを とります', 'takes photos', '📷'),
                    v('えを かきます', 'えを かきます', 'draws a picture', '✏️'),
                    v('うたを うたいます', 'うたを うたいます', 'sings a song', '🎤'),
                    v('さんぽを します', 'さんぽを します', 'has a walk', '🚶')],
          /* The Japanese word (.w/.r) is the plain i-adjective past form,
           * since "{きもち}です" appends です straight after - correct for
           * an i-adjective (たのしかった + です), but a na-adjective like
           * たいへん would need でした instead of だった + です, so it's
           * left out here rather than risk producing bad Japanese. The
           * English gloss (.e) stays a bare adjective, not "was fun" etc,
           * since narrative lines elsewhere build their own English around
           * it ("X feels very ___") and would otherwise double up the
           * past tense ("feels very was fun"). */
          feelings: [v('たのしかった', 'たのしかった', 'fun', '😆'), v('よかった', 'よかった', 'good', '👍'),
                     v('つまらなかった', 'つまらなかった', 'boring', '🥱'), v('いそがしかった', 'いそがしかった', 'busy', '😅')]
        }
      }
    }
  ];

  /* ---------- Names the class can pick for the hero ---------- */
  var NAMES = [
    { w: '田中', r: 'たなか' }, { w: 'さくら', r: 'さくら' }, { w: 'ゆうき', r: 'ゆうき' },
    { w: 'けんた', r: 'けんた' }, { w: 'みお', r: 'みお' }, { w: 'ひろし', r: 'ひろし' },
    { w: 'あおい', r: 'あおい' }, { w: 'ハリー', r: 'ハリー' }, { w: 'ボブ', r: 'ボブ' },
    { w: 'ピカチュウ', r: 'ピカチュウ' }, { w: 'キムさん', r: 'キムさん' }, { w: 'ミルクちゃん', r: 'ミルクちゃん' }
  ];

  /* ---------- Obstacle cards (the two failures in the skeleton) ---------- */
  /* build(ctx) gets { name, hero, place, thing, helper } as token arrays. */
  var OBSTACLES = [
    { id: 'nothing', icon: '🈳', en: 'There is none there!',
      ja: 'でも、{place}に {thing}は ありません。' },
    { id: 'money', icon: '💸', en: 'No money!',
      ja: 'でも、おかねが ありません。ゼロえんです。' },
    { id: 'dog', icon: '🐕', en: 'A big dog is in the way!',
      ja: 'でも、大[おお]きい 犬[いぬ]が います！ワン！ワン！' },
    { id: 'rain', icon: '🌧️', en: 'It starts to rain!',
      ja: 'でも、あめが ふります。ザーザー！' },
    { id: 'closed', icon: '🚪', en: 'The door is shut!',
      ja: 'でも、{place}の ドアが しまって います。' },
    { id: 'monster', icon: '👹', en: 'A monster appears!',
      ja: 'でも、かいじゅうが います！ガオー！' },
    { id: 'teacher', icon: '🙅', en: 'The teacher says no!',
      ja: 'でも、先生[せんせい]が 「だめです！」と 言[い]います。' },
    { id: 'sleep', icon: '😴', en: 'Everyone is asleep!',
      ja: 'でも、みんな ねて います。グーグー。' }
  ];

  /* ---------- Ending cards (scene 3 resolution) ---------- */
  var ENDINGS = [
    { id: 'win', icon: '🎉', kind: 'happy', en: 'The helper gives it to them!',
      ja: '{helper}が {name}に {thing}を あげます。{name}は とても うれしいです。やった！' },
    { id: 'huge', icon: '🎊', kind: 'happy', en: 'They get one hundred of them!',
      ja: '{name}は {thing}を 百[ひゃく]こ もらいます！すごいです！' },
    { id: 'dream', icon: '💤', kind: 'twist', en: 'It was all a dream…',
      ja: 'でも、それは ゆめでした。{name}は うちで ねて います。' },
    { id: 'friend', icon: '🤝', kind: 'twist', en: 'No luck — but they have a friend.',
      ja: '{thing}は ありません。でも、{helper}が います。{name}は うれしいです。' },
    { id: 'swap', icon: '🔄', kind: 'twist', en: 'They get something completely different!',
      ja: '{thing}じゃ ありません！{other}です。{name}は 「え〜！」と 言[い]います。' }
  ];

  /* ---------- Story skeletons ----------
   * Metadata for the picker in Setup. The actual beat logic for each lives
   * in story.js (Story.prototype.buildCompareBeat / buildJourneyBeat /
   * buildMysteryBeat); "classic" is the original want→fail→fail→help shape. */
  var SKELETONS = [
    { id: 'classic', icon: '😣', name: 'こまりごと',
      en: 'Wants something, fails twice, resolved with help — the original shape' },
    { id: 'compare', icon: '⚖️', name: 'どちらが いい？',
      en: 'Compares two options, then commits to one' },
    { id: 'journey', icon: '🧭', name: '３つの よてい',
      en: 'Three stops in a row, each with its own little twist' },
    { id: 'mystery', icon: '🔍', name: 'なぞの じけん',
      en: 'Interviews three suspects, then makes an accusation' }
  ];

  /* ---------- "Compare" skeleton cards ---------- */
  /* build(ctx) gets {opt} for the option just introduced. */
  /* {opt} is always a 'things' item, which spans food, school subjects,
   * hobbies/activities, physical objects and abstract concepts (work,
   * an experience) depending on the pack - so every card here needs to
   * read sensibly for all of those, not just physical objects. "far
   * away" and "boring" didn't (a souvenir isn't "far away", and calling
   * a towel "boring" is the same kind of mismatch as calling it happy). */
  /* {opt} is always a 'things' item, and 'things' spans food, physical
   * objects and SCHOOL SUBJECTS (英語, すう学...) depending on the pack -
   * "expensive" and "hard to find" don't hold up for a subject ("maths is
   * expensive" / "art is hard to find" are nonsense), so every card here
   * needs to fit that too, not just food and objects. */
  var COMPARE_TRAITS = [
    { id: 'interesting', icon: '🤔', en: '…and it’s interesting!', ja: 'そして、{opt}は とても おもしろいです！' },
    { id: 'lovely', icon: '✨', en: '…and it’s lovely!', ja: 'そして、{opt}は とても すてきです！' },
    { id: 'popular', icon: '⭐', en: '…and it’s very popular!', ja: 'そして、{opt}は とても にんきです！' },
    { id: 'amazing', icon: '🦄', en: '…it’s amazing!', ja: 'そして、{opt}は すごいです！' },
    { id: 'perfect', icon: '💯', en: '…it’s perfect!', ja: 'そして、{opt}は かんぺきです！' },
    { id: 'meh', icon: '😐', en: '…kind of so-so, though.', ja: 'でも、{opt}は ちょっと びみょうです。' }
  ];

  /* Compare's own fixed target grammar - these name the two options
   * directly (A/B) instead of pulling from one vocab slot, so they read as
   * actual comparisons rather than two unrelated single-item sentences. */
  var COMPARE_TARGETS = [
    '{A}より、{B}のほうが {きもち}です',
    '{もの}が 一番[いちばん] {きもち}です',
    '{A}と ちがって、{B}は {きもち}です',
    '{A}と 同[おな]じく、{B}は {きもち}です'
  ];

  var COMPARE_OUTCOMES = [
    { id: 'happy', icon: '🎉', kind: 'happy', en: 'Very happy with the choice!',
      ja: '{name}は {winner}に します。だいまんぞくです！' },
    { id: 'both', icon: '🤹', kind: 'happy', en: 'Gets both, somehow!',
      ja: 'けっきょく、{name}は りょうほう えらびました！' },
    { id: 'regret', icon: '😅', kind: 'twist', en: 'A little regret creeps in.',
      ja: '{name}は {winner}に しました。でも、ちょっと こうかいして います。' },
    { id: 'swap', icon: '🔄', kind: 'twist', en: 'Changes their mind at the last second!',
      ja: 'でも、さいごに {other}に かえました！' }
  ];

  /* ---------- "Journey" skeleton cards ---------- */
  /* build(ctx) gets {place}. Deliberately not failures - upbeat or neutral,
   * each resolved on the spot rather than carried forward. */
  var JOURNEY_EVENTS = [
    { icon: '🌂', en: 'It rains, but you find shelter.', ja: '{place}で あめが ふりましたが、やねの したで やすみました。' },
    { icon: '🐕', en: 'A friendly dog says hello!', ja: '{place}で かわいい 犬が あいさつを しました！' },
    { icon: '🎶', en: 'You hear some nice music.', ja: '{place}で すてきな おんがくが きこえました。' },
    { icon: '👋', en: 'You bump into an old friend!', ja: '{place}で ふるい 友だちに ぐうぜん あいました！' },
    { icon: '🍬', en: 'Someone gives you a sweet.', ja: '{place}で だれかが あめを くれました。' },
    { icon: '⏰', en: 'You are running a little late.', ja: '{place}で ちょっと おくれて しまいました。' }
  ];

  /* ---------- "Mystery" skeleton cards ---------- */
  /* Suspects' own statements - first-person, no slot needed. */
  var MYSTERY_CLUES = [
    { icon: '🕐', en: '"I was at the library all day."', ja: '「わたしは いちにちじゅう としょかんに いました。」' },
    { icon: '🍰', en: '"I was eating cake at home."', ja: '「わたしは うちで ケーキを たべて いました。」' },
    { icon: '😅', en: '"I… don’t remember anything!"', ja: '「わたしは・・・ 何[なに]も おぼえて いません！」' },
    { icon: '👀', en: '"I saw someone strange near there."', ja: '「そこの ちかくで へんな 人[ひと]を 見[み]ました。」' },
    { icon: '🤫', en: '"I have nothing to say."', ja: '「なにも 言[い]う ことは ありません。」' },
    { icon: '😊', en: '"I would never do such a thing!"', ja: '「わたしは そんな ことは しません！」' }
  ];

  /* ---------- Backdrops: place -> scene kind ---------- */
  /* Every place word that ships in a built-in pack gets its own dedicated
   * backdrop (see art.js SETS) rather than being bucketed with others -
   * exact match on the kana reading, since that's what a teacher can't
   * easily mistype away from. Custom teacher-typed places that don't
   * match fall through to the fuzzy keyword list below. */
  var PLACE_KIND = {
    'がっこう': 'school', 'しょうがっこう': 'primary', 'だいがく': 'university',
    'きょうしつ': 'classroom', 'としょかん': 'library',
    'こうえん': 'park', 'みせ': 'shop', 'うち': 'home', 'いえ': 'home',
    'だいどころ': 'kitchen', 'へや': 'room', 'えき': 'station',
    'レストラン': 'food', 'うみ': 'sea', 'プール': 'pool', 'ビーチ': 'beach',
    'やま': 'mountain', 'かわ': 'river', 'いなか': 'countryside',
    'のうじょう': 'farm', 'わかやま': 'wakayama'
  };

  var SCENE_KEYS = [
    { kind: 'school', match: ['school', 'がっこう', '学校'] },
    { kind: 'classroom', match: ['classroom'] },
    { kind: 'university', match: ['university'] },
    { kind: 'library', match: ['library'] },
    { kind: 'park',   match: ['park', 'こうえん', '公園', 'garden'] },
    { kind: 'mountain', match: ['mountain', 'やま', '山'] },
    { kind: 'shop',   match: ['shop', 'store', 'みせ', '店', 'supermarket', 'コンビニ', 'mall'] },
    { kind: 'home',   match: ['home', 'house', 'うち', 'いえ', '家'] },
    { kind: 'kitchen', match: ['kitchen', 'だいどころ'] },
    { kind: 'room', match: ['bedroom', 'room', 'へや'] },
    { kind: 'station', match: ['station', 'えき', '駅', 'train', 'airport', 'くうこう'] },
    { kind: 'food',   match: ['restaurant', 'レストラン', 'cafe', 'カフェ', 'ラーメンや'] },
    { kind: 'sea',    match: ['sea', 'ocean', 'うみ', '海'] },
    { kind: 'pool',   match: ['pool', 'プール'] },
    { kind: 'beach',  match: ['beach', 'ビーチ'] },
    { kind: 'river',  match: ['river', 'かわ', '川'] },
    { kind: 'farm',   match: ['farm', 'のうじょう'] },
    { kind: 'countryside', match: ['countryside', 'rural', 'いなか'] }
  ];

  function sceneKindFor(item) {
    if (!item) return 'town';
    var r = (item.r || '').trim();
    if (PLACE_KIND[r]) return PLACE_KIND[r];
    var hay = ((item.w || '') + ' ' + (item.r || '') + ' ' + (item.e || '')).toLowerCase();
    for (var i = 0; i < SCENE_KEYS.length; i++) {
      for (var j = 0; j < SCENE_KEYS[i].match.length; j++) {
        if (hay.indexOf(SCENE_KEYS[i].match[j].toLowerCase()) !== -1) return SCENE_KEYS[i].kind;
      }
    }
    return 'town';
  }

  /* ---------- Emoji guesser for teacher-typed vocabulary ---------- */
  var EMOJI = {
    'ラーメン': '🍜', 'すし': '🍣', 'ケーキ': '🍰', 'パン': '🍞', 'ごはん': '🍚', 'にく': '🍖',
    'さかな': '🐟', 'やさい': '🥦', 'くだもの': '🍎', 'りんご': '🍎', 'たまご': '🥚', 'みず': '💧',
    'おちゃ': '🍵', 'ぎゅうにゅう': '🥛', 'コーヒー': '☕', 'アイス': '🍦', 'カレー': '🍛',
    'がっこう': '🏫', 'こうえん': '🌳', 'みせ': '🏪', 'うち': '🏠', 'いえ': '🏠', 'えき': '🚉',
    'レストラン': '🍽️', 'としょかん': '📚', 'びょういん': '🏥', 'うみ': '🌊', 'やま': '⛰️',
    'プール': '🏊', 'こうさてん': '🚦', 'だいがく': '🎓', 'きょうしつ': '🪑',
    'いぬ': '🐶', 'ねこ': '🐱', 'とり': '🐦', 'うさぎ': '🐰', 'くま': '🐻', 'ロボット': '🤖',
    'せんせい': '👩‍🏫', 'がくせい': '🧑‍🎓', 'ともだち': '🧑‍🤝‍🧑', 'おかあさん': '👩', 'おとうさん': '👨',
    'おばあさん': '👵', 'おじいさん': '👴', 'あかちゃん': '👶',
    'ほん': '📖', 'まんが': '📕', 'おんがく': '🎵', 'えいが': '🎬', 'ゲーム': '🎮', 'テレビ': '📺',
    'おかね': '💴', 'かばん': '🎒', 'くるま': '🚗', 'じてんしゃ': '🚲', 'でんわ': '📱',
    'しゅくだい': '📝', 'えんぴつ': '✏️', 'てがみ': '✉️', 'かさ': '☂️', 'ぼうし': '🧢',
    'テニス': '🎾', 'サッカー': '⚽', 'やきゅう': '⚾', 'すいえい': '🏊', 'ダンス': '💃',
    'たべます': '🍴', 'のみます': '🥤', 'いきます': '🚶', 'かいます': '🛒', 'みます': '👀',
    'ききます': '👂', 'よみます': '📖', 'ねます': '😴', 'おきます': '⏰', 'します': '✨',
    'べんきょうします': '📚', 'つくります': '👨‍🍳', 'かえります': '🏠', 'あそびます': '🎈',
    'うれしい': '😄', 'かなしい': '😢', 'たのしい': '😆', 'おいしい': '😋', 'こわい': '😨',
    'むずかしい': '😵', 'やさしい': '🙂', 'げんき': '💪', 'ひま': '🛋️', 'つまらない': '🥱',
    'たいへん': '😱', 'おおきい': '🐘', 'ちいさい': '🐜', 'あたらしい': '✨', 'ふるい': '🏚️'
  };

  var EMOJI_EN = {
    ramen: '🍜', sushi: '🍣', cake: '🍰', bread: '🍞', rice: '🍚', meat: '🍖', fish: '🐟',
    vegetable: '🥦', fruit: '🍎', water: '💧', tea: '🍵', milk: '🥛', coffee: '☕',
    school: '🏫', park: '🌳', shop: '🏪', store: '🏪', home: '🏠', house: '🏠', station: '🚉',
    restaurant: '🍽️', library: '📚', hospital: '🏥', sea: '🌊', beach: '🏖️', mountain: '⛰️',
    dog: '🐶', cat: '🐱', bird: '🐦', rabbit: '🐰', bear: '🐻', robot: '🤖',
    teacher: '👩‍🏫', student: '🧑‍🎓', friend: '🧑‍🤝‍🧑', mother: '👩', father: '👨',
    book: '📖', manga: '📕', music: '🎵', movie: '🎬', game: '🎮', money: '💴', bag: '🎒',
    car: '🚗', bicycle: '🚲', phone: '📱', homework: '📝', pencil: '✏️', umbrella: '☂️',
    tennis: '🎾', soccer: '⚽', swimming: '🏊', dance: '💃', maths: '➗', science: '🔬',
    art: '🎨', english: '🔤', history: '📜', happy: '😄', sad: '😢', fun: '😆',
    delicious: '😋', scary: '😨', difficult: '😵', easy: '🙂', boring: '🥱',
    eat: '🍴', drink: '🥤', go: '🚶', buy: '🛒', watch: '👀', listen: '👂', read: '📖',
    sleep: '😴', study: '📚', make: '👨‍🍳', play: '🎈'
  };

  var CAT_FALLBACK = { people: '🧑', places: '📍', things: '📦', actions: '✨', feelings: '💭' };

  /* Maps a picked feeling to one of the actor's five faces (see art.js face()),
   * so the character on stage always matches the word the class just chose
   * instead of whatever mood the previous story beat left behind. */
  var MOOD_WORDS = {
    'うれしい': 'happy', 'たのしい': 'happy', 'げんき': 'happy', 'おいしい': 'happy',
    'やさしい': 'happy', 'しあわせ': 'happy', 'らく': 'happy', 'すばらしい': 'happy',
    'かなしい': 'sad', 'つまらない': 'sad', 'さびしい': 'sad', 'いたい': 'sad',
    'こわい': 'surprised', 'たいへん': 'surprised', 'びっくり': 'surprised',
    'むずかしい': 'surprised', 'あぶない': 'surprised',
    'わくわく': 'excited', 'おおきい': 'excited',
    'ひま': 'neutral', 'ふつう': 'neutral', 'ふるい': 'neutral', 'ちいさい': 'neutral'
  };
  var MOOD_EN = {
    happy: 'happy', glad: 'happy', fun: 'happy', delicious: 'happy', easy: 'happy',
    energetic: 'happy', good: 'happy', wonderful: 'happy',
    sad: 'sad', bored: 'sad', boring: 'sad', lonely: 'sad', tired: 'sad',
    scary: 'surprised', scared: 'surprised', afraid: 'surprised', trouble: 'surprised',
    difficult: 'surprised', hard: 'surprised', worried: 'surprised', surprised: 'surprised',
    excited: 'excited', big: 'excited'
  };

  function moodFor(item) {
    var r = (item && item.r || '').trim();
    var w = (item && item.w || '').trim();
    if (MOOD_WORDS[r]) return MOOD_WORDS[r];
    if (MOOD_WORDS[w]) return MOOD_WORDS[w];
    var e = (item && item.e || '').toLowerCase();
    var key;
    for (key in MOOD_EN) {
      if (e === key || e.indexOf(key) !== -1) return MOOD_EN[key];
    }
    return 'neutral';
  }

  function guessIcon(item, cat) {
    if (item && item.icon) return item.icon;
    var r = (item && item.r || '').trim();
    var w = (item && item.w || '').trim();
    if (EMOJI[r]) return EMOJI[r];
    if (EMOJI[w]) return EMOJI[w];
    var e = (item && item.e || '').toLowerCase();
    var key;
    for (key in EMOJI_EN) {
      if (e === key || e.indexOf(key) !== -1) return EMOJI_EN[key];
    }
    return CAT_FALLBACK[cat] || '⭐';
  }

  ns.data = {
    CATS: CATS,
    SLOTS: SLOTS,
    DEFAULT_CONFIG: DEFAULT_CONFIG,
    PRESETS: PRESETS,
    NAMES: NAMES,
    OBSTACLES: OBSTACLES,
    ENDINGS: ENDINGS,
    SKELETONS: SKELETONS,
    COMPARE_TRAITS: COMPARE_TRAITS,
    COMPARE_OUTCOMES: COMPARE_OUTCOMES,
    COMPARE_TARGETS: COMPARE_TARGETS,
    JOURNEY_EVENTS: JOURNEY_EVENTS,
    MYSTERY_CLUES: MYSTERY_CLUES,
    sceneKindFor: sceneKindFor,
    guessIcon: guessIcon,
    moodFor: moodFor
  };
})(window.CCS = window.CCS || {});
