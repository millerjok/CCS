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

  function v(w, r, e, icon) { return { w: w, r: r, e: e, icon: icon }; }

  /* ---------- Default pack: works straight out of the box ---------- */
  var DEFAULT_CONFIG = {
    title: 'ラーメンが ほしい！',
    targets: [
      '{もの}が ほしいです',
      '{ばしょ}に 行[い]きます',
      'でも、ありません'
    ],
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
      actions: [
        v('食べます', 'たべます', 'eats', '🍴'),
        v('飲みます', 'のみます', 'drinks', '🥤'),
        v('買います', 'かいます', 'buys', '🛒'),
        v('見ます', 'みます', 'watches', '👀')
      ],
      feelings: [
        v('うれしい', 'うれしい', 'happy', '😄'),
        v('かなしい', 'かなしい', 'sad', '😢'),
        v('げんき', 'げんき', 'energetic', '💪'),
        v('たいへん', 'たいへん', 'in trouble', '😱')
      ]
    }
  };

  /* ---------- Presets built from the iitomo 2 word lists ---------- */
  var PRESETS = [
    {
      id: 'default',
      name: 'ラーメンが ほしい！',
      en: 'Starter pack (food + town)',
      icon: '🍜',
      config: DEFAULT_CONFIG
    },
    {
      id: 'food',
      name: 'たべもの',
      en: 'iitomo 2 — Food & drink',
      icon: '🍱',
      config: {
        title: 'おなかが すきました！',
        targets: ['{もの}を 食[た]べます', '{もの}が 好[す]きです', 'とても おいしいです'],
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
          actions: [v('食べます', 'たべます', 'eats', '🍴'), v('飲みます', 'のみます', 'drinks', '🥤'),
                    v('買います', 'かいます', 'buys', '🛒'), v('作ります', 'つくります', 'makes', '👨‍🍳')],
          feelings: [v('おいしい', 'おいしい', 'delicious', '😋'), v('うれしい', 'うれしい', 'happy', '😄'),
                     v('かなしい', 'かなしい', 'sad', '😢'), v('たいへん', 'たいへん', 'in trouble', '😱')]
        }
      }
    },
    {
      id: 'school',
      name: 'がっこう',
      en: 'iitomo 2 — School & subjects',
      icon: '🏫',
      config: {
        title: 'しゅくだいが ありません！',
        targets: ['{もの}が あります', '{ばしょ}に 行[い]きます', 'とても むずかしいです'],
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
          actions: [v('勉強します', 'べんきょうします', 'studies', '📖'), v('見ます', 'みます', 'looks at', '👀'),
                    v('聞きます', 'ききます', 'listens', '👂'), v('そうじをします', 'そうじをします', 'cleans', '🧹')],
          feelings: [v('たのしい', 'たのしい', 'fun', '😆'), v('むずかしい', 'むずかしい', 'difficult', '😵'),
                     v('げんき', 'げんき', 'energetic', '💪'), v('かなしい', 'かなしい', 'sad', '😢')]
        }
      }
    },
    {
      id: 'hobbies',
      name: 'しゅみ',
      en: 'iitomo 2 — Hobbies & free time',
      icon: '🎮',
      config: {
        title: 'ひまな 土よう日',
        targets: ['{もの}が 好[す]きです', '{ばしょ}で {どうし}', 'ぜんぜん おもしろくないです'],
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
          actions: [v('します', 'します', 'does', '✨'), v('見ます', 'みます', 'watches', '👀'),
                    v('聞きます', 'ききます', 'listens to', '👂'), v('読みます', 'よみます', 'reads', '📖'),
                    v('買います', 'かいます', 'buys', '🛒'), v('つくります', 'つくります', 'makes', '🍳'),
                    v('ひきます', 'ひきます', 'plays (an instrument)', '🎸'),
                    v('あそびます', 'あそびます', 'plays / has fun', '🎈'),
                    v('とります', 'とります', 'takes (a photo)', '📸'),
                    v('かきます', 'かきます', 'draws', '✏️'), v('うたいます', 'うたいます', 'sings', '🎤'),
                    v('のります', 'のります', 'rides', '🚲'), v('つかいます', 'つかいます', 'uses', '📱')],
          feelings: [v('たのしい', 'たのしい', 'fun', '😆'), v('つまらない', 'つまらない', 'boring', '🥱'),
                     v('うれしい', 'うれしい', 'happy', '😄'), v('ひま', 'ひま', 'free / not busy', '🛋️')]
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

  /* ---------- Backdrops: place -> scene kind ---------- */
  var SCENE_KEYS = [
    { kind: 'school', match: ['school', 'classroom', 'がっこう', '学校', 'きょうしつ', 'university', 'だいがく', 'library', 'としょかん'] },
    { kind: 'park',   match: ['park', 'こうえん', '公園', 'garden', 'mountain', 'やま', '山'] },
    { kind: 'shop',   match: ['shop', 'store', 'みせ', '店', 'supermarket', 'コンビニ', 'mall'] },
    { kind: 'home',   match: ['home', 'house', 'うち', 'いえ', '家', 'kitchen', 'だいどころ', 'room', 'へや'] },
    { kind: 'station', match: ['station', 'えき', '駅', 'train', 'airport', 'くうこう'] },
    { kind: 'food',   match: ['restaurant', 'レストラン', 'cafe', 'カフェ', 'ラーメンや'] },
    { kind: 'sea',    match: ['sea', 'beach', 'うみ', '海', 'pool', 'プール', 'river', 'かわ'] }
  ];

  function sceneKindFor(item) {
    if (!item) return 'town';
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
    sceneKindFor: sceneKindFor,
    guessIcon: guessIcon
  };
})(window.CCS = window.CCS || {});
