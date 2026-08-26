/* CCS — visuals
 * Hand-built SVG so the app has no external images and works offline in class.
 * Backdrops change with the place; the actor changes with the mood, which is
 * what lets students "read" the sentence before they decode it.
 */
(function (ns) {
  'use strict';

  function hash(str) {
    var h = 0, i;
    str = String(str || '');
    for (i = 0; i < str.length; i++) h = (h * 31 + str.charCodeAt(i)) >>> 0;
    return h;
  }

  var SKIN = ['#f7d3b4', '#e8b48c', '#c98a5e', '#9a6340', '#f2c6a0'];
  var HAIR = ['#2f2a29', '#4b342a', '#111827', '#7b3f00', '#c2410c', '#6d28d9', '#0f766e'];
  var CLOTH = ['#e04f5f', '#2b6cb0', '#2f9e6f', '#f0a202', '#8b5cf6', '#e2447a', '#0891b2'];
  var CLOTH_DARK = ['#b8323f', '#22548a', '#237a55', '#c07f02', '#6c43c4', '#b23561', '#066f92'];

  /* ---------------- Backdrops ---------------- */
  var SKIES = {
    school:  ['#bfe3ff', '#eaf7ff'],
    primary: ['#d6f0ff', '#f2fbff'],
    university: ['#e2e0f5', '#f7f6fc'],
    classroom: ['#fef6e0', '#fffaf0'],
    library: ['#efe6d8', '#faf6ef'],
    park:    ['#a8e4ff', '#e8fbe8'],
    mountain: ['#cfe8ff', '#eef6ff'],
    shop:    ['#ffd9c0', '#fff4e6'],
    home:    ['#ffe1ec', '#fff5f8'],
    kitchen: ['#ffe9d6', '#fff6ec'],
    room:    ['#f0e6ff', '#faf5ff'],
    station: ['#cdd6ff', '#eef1ff'],
    food:    ['#ffe0b3', '#fff6e5'],
    sea:     ['#9fdcff', '#e6f8ff'],
    pool:    ['#bdeeff', '#eafcff'],
    beach:   ['#aee9ff', '#fff8e6'],
    river:   ['#c7ecff', '#eafbff'],
    countryside: ['#d9f0c2', '#f4fbe9'],
    farm:    ['#ffe9b0', '#fff6df'],
    wakayama: ['#ffd9c2', '#fff0e2'],
    town:    ['#c9e6ff', '#f2f9ff'],
    night:   ['#243b6b', '#5b6fae']
  };

  function clouds() {
    return '<g fill="#ffffff" opacity=".85">' +
      '<ellipse cx="130" cy="70" rx="52" ry="24"/><ellipse cx="170" cy="72" rx="38" ry="19"/>' +
      '<ellipse cx="620" cy="55" rx="44" ry="20"/><ellipse cx="580" cy="60" rx="32" ry="15"/>' +
      '</g>';
  }

  function sun(kind) {
    if (kind === 'night') {
      return '<circle cx="690" cy="70" r="30" fill="#fff6c9"/>' +
             '<circle cx="678" cy="62" r="26" fill="#3a5089"/>';
    }
    return '<circle cx="700" cy="72" r="36" fill="#ffe680" opacity=".9"/>';
  }

  var SETS = {
    school: '<g>' +
      '<rect x="180" y="150" width="440" height="180" rx="8" fill="#f6e7c9" stroke="#c9a86a" stroke-width="3"/>' +
      '<rect x="180" y="150" width="440" height="34" fill="#d98b6a"/>' +
      '<rect x="370" y="255" width="60" height="75" fill="#8b5e3c"/>' +
      '<g fill="#bfe6ff" stroke="#7aa9c9" stroke-width="2">' +
      '<rect x="215" y="205" width="56" height="44"/><rect x="295" y="205" width="56" height="44"/>' +
      '<rect x="450" y="205" width="56" height="44"/><rect x="530" y="205" width="56" height="44"/></g>' +
      '<rect x="392" y="96" width="8" height="56" fill="#9ca3af"/><circle cx="396" cy="120" r="26" fill="#fff" stroke="#9ca3af" stroke-width="3"/>' +
      '<path d="M396 104 L396 120 L408 128" stroke="#374151" stroke-width="3" fill="none" stroke-linecap="round"/>' +
      '</g>',
    park: '<g>' +
      '<circle cx="180" cy="215" r="72" fill="#5cb85c"/><rect x="168" y="255" width="24" height="80" fill="#8b5e3c"/>' +
      '<circle cx="640" cy="235" r="56" fill="#4ea34e"/><rect x="630" y="270" width="20" height="66" fill="#8b5e3c"/>' +
      '<rect x="330" y="250" width="140" height="14" rx="6" fill="#c98a5e"/>' +
      '<rect x="340" y="264" width="12" height="40" fill="#8b5e3c"/><rect x="448" y="264" width="12" height="40" fill="#8b5e3c"/>' +
      '<g fill="#ff9ec7"><circle cx="260" cy="300" r="8"/><circle cx="520" cy="310" r="8"/><circle cx="560" cy="296" r="7"/></g>' +
      '</g>',
    shop: '<g>' +
      '<rect x="220" y="140" width="380" height="195" rx="6" fill="#fffaf0" stroke="#e0c9a6" stroke-width="3"/>' +
      '<rect x="220" y="140" width="380" height="40" fill="#e04f5f"/>' +
      '<path d="M220 180 h380 v26 l-38 -26 -38 26 -38 -26 -38 26 -38 -26 -38 26 -38 -26 -38 26 -38 -26 z" fill="#f8f4ea"/>' +
      '<rect x="255" y="225" width="120" height="110" fill="#d7ecff" stroke="#9cc3e0" stroke-width="2"/>' +
      '<rect x="440" y="225" width="120" height="110" fill="#d7ecff" stroke="#9cc3e0" stroke-width="2"/>' +
      '<rect x="392" y="235" width="52" height="100" fill="#c98a5e"/>' +
      '</g>',
    home: '<g>' +
      '<rect x="270" y="190" width="270" height="145" fill="#fff5e8" stroke="#d9b48f" stroke-width="3"/>' +
      '<path d="M250 195 L405 105 L560 195 Z" fill="#d1615d"/>' +
      '<rect x="378" y="255" width="56" height="80" rx="4" fill="#8b5e3c"/><circle cx="422" cy="298" r="5" fill="#ffd166"/>' +
      '<rect x="300" y="220" width="54" height="46" fill="#bfe6ff" stroke="#7aa9c9" stroke-width="2"/>' +
      '<rect x="456" y="220" width="54" height="46" fill="#bfe6ff" stroke="#7aa9c9" stroke-width="2"/>' +
      '<rect x="480" y="120" width="26" height="60" fill="#a9a2a0"/>' +
      '</g>',
    station: '<g>' +
      '<rect x="150" y="255" width="520" height="16" fill="#9ca3af"/>' +
      '<g fill="#6b7280">' +
      '<rect x="170" y="271" width="14" height="46"/><rect x="270" y="271" width="14" height="46"/>' +
      '<rect x="370" y="271" width="14" height="46"/><rect x="470" y="271" width="14" height="46"/>' +
      '<rect x="570" y="271" width="14" height="46"/></g>' +
      '<rect x="210" y="150" width="330" height="105" rx="14" fill="#4f6bd8"/>' +
      '<rect x="228" y="170" width="70" height="52" rx="6" fill="#d7ecff"/>' +
      '<rect x="316" y="170" width="70" height="52" rx="6" fill="#d7ecff"/>' +
      '<rect x="404" y="170" width="70" height="52" rx="6" fill="#d7ecff"/>' +
      '<circle cx="256" cy="258" r="16" fill="#374151"/><circle cx="496" cy="258" r="16" fill="#374151"/>' +
      '</g>',
    food: '<g>' +
      '<rect x="230" y="150" width="360" height="185" rx="8" fill="#fff3e0" stroke="#d9a15b" stroke-width="3"/>' +
      '<rect x="230" y="150" width="360" height="44" fill="#c0392b"/>' +
      '<circle cx="410" cy="172" r="14" fill="#fff2cc"/>' +
      '<rect x="266" y="222" width="288" height="70" fill="#ffe9c7" stroke="#d9a15b" stroke-width="2"/>' +
      '<g><rect x="600" y="180" width="16" height="120" fill="#8b5e3c"/><rect x="560" y="160" width="96" height="26" rx="8" fill="#e74c3c"/></g>' +
      '</g>',
    sea: '<g>' +
      '<rect x="0" y="255" width="800" height="120" fill="#4bb3e0"/>' +
      '<path d="M0 265 q40 -14 80 0 t80 0 t80 0 t80 0 t80 0 t80 0 t80 0 t80 0 t80 0" stroke="#ffffff" stroke-width="4" fill="none" opacity=".7"/>' +
      '<path d="M0 300 q40 -14 80 0 t80 0 t80 0 t80 0 t80 0 t80 0 t80 0 t80 0 t80 0" stroke="#ffffff" stroke-width="3" fill="none" opacity=".5"/>' +
      '<path d="M620 255 l40 -80 l40 80 z" fill="#8fb996"/>' +
      '</g>',
    primary: '<g>' +
      '<rect x="200" y="230" width="380" height="100" rx="10" fill="#fff2c2" stroke="#e0b84a" stroke-width="3"/>' +
      '<rect x="200" y="230" width="380" height="28" fill="#4fb3d9"/>' +
      '<rect x="360" y="260" width="60" height="70" fill="#e07a3f"/>' +
      '<g fill="#ffe0a3" stroke="#d99a3a" stroke-width="2">' +
      '<rect x="230" y="270" width="46" height="36"/><rect x="290" y="270" width="46" height="36"/>' +
      '<rect x="450" y="270" width="46" height="36"/><rect x="510" y="270" width="46" height="36"/></g>' +
      '<rect x="130" y="200" width="6" height="130" fill="#9ca3af"/>' +
      '<path d="M136 205 L180 215 L136 225 Z" fill="#e04f5f"/>' +
      '</g>',
    university: '<g>' +
      '<rect x="180" y="190" width="440" height="140" fill="#eceaf7" stroke="#b3aed1" stroke-width="3"/>' +
      '<path d="M170 190 L400 110 L630 190 Z" fill="#c9c2e8"/>' +
      '<g fill="#eceaf7" stroke="#b3aed1" stroke-width="3">' +
      '<rect x="220" y="200" width="18" height="120"/><rect x="270" y="200" width="18" height="120"/>' +
      '<rect x="320" y="200" width="18" height="120"/><rect x="460" y="200" width="18" height="120"/>' +
      '<rect x="510" y="200" width="18" height="120"/><rect x="560" y="200" width="18" height="120"/></g>' +
      '<rect x="370" y="240" width="60" height="90" fill="#4b4470"/>' +
      '</g>',
    classroom: '<g>' +
      '<rect x="230" y="200" width="340" height="130" fill="#fdf6e3" stroke="#d9c27a" stroke-width="3"/>' +
      '<rect x="230" y="200" width="340" height="30" fill="#3b6b4f"/>' +
      '<rect x="270" y="245" width="260" height="70" fill="#eef3e6" stroke="#c9d6bd" stroke-width="2"/>' +
      '<g fill="#8b5e3c"><rect x="290" y="285" width="40" height="8"/><rect x="350" y="285" width="40" height="8"/>' +
      '<rect x="410" y="285" width="40" height="8"/><rect x="470" y="285" width="40" height="8"/></g>' +
      '<rect x="380" y="230" width="60" height="10" fill="#2f4f3a"/>' +
      '</g>',
    library: '<g>' +
      '<rect x="210" y="180" width="380" height="150" fill="#f3e7cf" stroke="#c9a86a" stroke-width="3"/>' +
      '<path d="M200 180 L400 120 L600 180 Z" fill="#d9bd8a"/>' +
      '<rect x="250" y="220" width="24" height="110" fill="#c9a86a"/><rect x="300" y="220" width="24" height="110" fill="#c9a86a"/>' +
      '<rect x="480" y="220" width="24" height="110" fill="#c9a86a"/><rect x="530" y="220" width="24" height="110" fill="#c9a86a"/>' +
      '<rect x="360" y="270" width="80" height="16" fill="#e04f5f"/><rect x="365" y="254" width="70" height="16" fill="#2b6cb0"/>' +
      '<rect x="360" y="238" width="80" height="16" fill="#2f9e6f"/>' +
      '</g>',
    mountain: '<g>' +
      '<path d="M100 330 L300 120 L420 260 L520 150 L700 330 Z" fill="#8fa3b8"/>' +
      '<path d="M300 120 L340 190 L260 190 Z" fill="#ffffff"/>' +
      '<path d="M520 150 L550 200 L490 200 Z" fill="#ffffff"/>' +
      '<path d="M0 330 q60 -20 120 0 t120 0 t120 0 t120 0 t120 0 t120 0 t80 0" fill="#7fae7f"/>' +
      '</g>',
    kitchen: '<g>' +
      '<rect x="260" y="210" width="280" height="120" fill="#fff0dc" stroke="#e0b98a" stroke-width="3"/>' +
      '<path d="M250 210 L400 150 L550 210 Z" fill="#e2795a"/>' +
      '<rect x="300" y="240" width="60" height="50" fill="#bfe6ff" stroke="#7aa9c9" stroke-width="2"/>' +
      '<rect x="440" y="240" width="60" height="50" fill="#bfe6ff" stroke="#7aa9c9" stroke-width="2"/>' +
      '<ellipse cx="330" cy="235" rx="14" ry="6" fill="#8b5e3c"/>' +
      '<path d="M320 228 q4 -14 -2 -20 M330 228 q4 -18 0 -24 M340 228 q4 -14 -2 -20" stroke="#d9d9d9" stroke-width="3" fill="none" stroke-linecap="round"/>' +
      '</g>',
    room: '<g>' +
      '<rect x="290" y="220" width="220" height="110" fill="#fbeeff" stroke="#d9b9e6" stroke-width="3"/>' +
      '<path d="M280 220 L400 170 L520 220 Z" fill="#c98bd9"/>' +
      '<circle cx="400" cy="260" r="30" fill="#bfe6ff" stroke="#7aa9c9" stroke-width="3"/>' +
      '<path d="M394 250 a10 10 0 1 0 12 14 a13 13 0 1 1 -12 -14" fill="#fff6c9"/>' +
      '</g>',
    pool: '<g>' +
      '<rect x="90" y="235" width="30" height="140" fill="#e8dcc0"/>' +
      '<rect x="120" y="250" width="560" height="110" rx="14" fill="#3bb6e0" stroke="#1f7fa8" stroke-width="4"/>' +
      '<g stroke="#ffffff" stroke-width="4" opacity=".8">' +
      '<line x1="130" y1="280" x2="670" y2="280"/><line x1="130" y1="305" x2="670" y2="305"/><line x1="130" y1="330" x2="670" y2="330"/></g>' +
      '</g>',
    beach: '<g>' +
      '<rect y="290" width="800" height="160" fill="#f4e2b0"/>' +
      '<rect y="330" width="800" height="120" fill="#4bb3e0"/>' +
      '<path d="M0 340 q40 -10 80 0 t80 0 t80 0 t80 0 t80 0 t80 0 t80 0 t80 0 t80 0" stroke="#ffffff" stroke-width="3" fill="none" opacity=".7"/>' +
      '<path d="M600 300 L600 240" stroke="#8b5e3c" stroke-width="6"/>' +
      '<path d="M600 240 q60 10 60 50 q-60 -30 -120 0 q0 -40 60 -50 z" fill="#e04f5f"/>' +
      '<ellipse cx="200" cy="310" rx="26" ry="10" fill="#f7d9a0"/>' +
      '</g>',
    river: '<g>' +
      '<rect y="255" width="800" height="195" fill="#8fc78f"/>' +
      '<path d="M0 300 q100 -40 180 0 t180 20 t180 -30 t180 20 t80 -10 V450 H0 Z" fill="#5cb8e0"/>' +
      '<path d="M0 300 q100 -40 180 0 t180 20 t180 -30 t180 20 t80 -10" stroke="#bfe8ff" stroke-width="4" fill="none" opacity=".7"/>' +
      '<circle cx="640" cy="270" r="22" fill="#8b6f4e"/><circle cx="120" cy="280" r="16" fill="#8b6f4e"/>' +
      '</g>',
    countryside: '<g>' +
      '<rect y="300" width="800" height="150" fill="#cfe0a0"/>' +
      '<path d="M580 300 L640 220 L700 300 Z" fill="#9fc0e0"/>' +
      '<g stroke="#a9c47a" stroke-width="3">' +
      '<line x1="0" y1="320" x2="800" y2="320"/><line x1="0" y1="345" x2="800" y2="345"/>' +
      '<line x1="0" y1="370" x2="800" y2="370"/><line x1="0" y1="395" x2="800" y2="395"/>' +
      '<line x1="0" y1="420" x2="800" y2="420"/></g>' +
      '<circle cx="150" cy="280" r="10" fill="#e8a13a"/><circle cx="180" cy="285" r="8" fill="#e8a13a"/>' +
      '</g>',
    farm: '<g>' +
      '<rect y="330" width="800" height="120" fill="#d8c98a"/>' +
      '<rect x="520" y="200" width="50" height="130" rx="20" fill="#d9d9d9" stroke="#aaaaaa" stroke-width="3"/>' +
      '<path d="M520 200 a25 15 0 0 1 50 0" fill="#b3413a"/>' +
      '<rect x="280" y="230" width="200" height="100" fill="#c0392b" stroke="#8e2a20" stroke-width="3"/>' +
      '<path d="M270 230 L380 170 L490 230 Z" fill="#8e2a20"/>' +
      '<rect x="360" y="270" width="50" height="60" fill="#5a3a24"/>' +
      '</g>',
    wakayama: '<g>' +
      '<path d="M220 330 q180 -220 360 0 Z" fill="#8fae7f"/>' +
      '<rect x="160" y="290" width="480" height="40" fill="#c9c2ad"/>' +
      '<rect x="200" y="270" width="24" height="60" fill="#b3ab94"/><rect x="576" y="270" width="24" height="60" fill="#b3ab94"/>' +
      '<rect x="350" y="180" width="100" height="110" fill="#eceaea" stroke="#9c9c9c" stroke-width="2"/>' +
      '<path d="M335 180 L400 130 L465 180 Z" fill="#3b3b3b"/>' +
      '<rect x="378" y="140" width="44" height="42" fill="#eceaea" stroke="#9c9c9c" stroke-width="2"/>' +
      '<path d="M368 140 L400 108 L432 140 Z" fill="#3b3b3b"/>' +
      '<rect x="360" y="205" width="80" height="14" fill="#c0392b"/>' +
      '</g>',
    town: '<g>' +
      '<rect x="120" y="170" width="110" height="165" fill="#e9d8c3" stroke="#c9a86a" stroke-width="2"/>' +
      '<rect x="250" y="130" width="130" height="205" fill="#f6e7c9" stroke="#c9a86a" stroke-width="2"/>' +
      '<rect x="400" y="185" width="120" height="150" fill="#e5e0f5" stroke="#b6aede" stroke-width="2"/>' +
      '<rect x="540" y="150" width="140" height="185" fill="#ffe6e6" stroke="#e0a9a9" stroke-width="2"/>' +
      '<g fill="#bfe6ff">' +
      '<rect x="140" y="195" width="26" height="26"/><rect x="185" y="195" width="26" height="26"/>' +
      '<rect x="275" y="160" width="30" height="30"/><rect x="325" y="160" width="30" height="30"/>' +
      '<rect x="275" y="215" width="30" height="30"/><rect x="325" y="215" width="30" height="30"/>' +
      '<rect x="425" y="215" width="28" height="28"/><rect x="468" y="215" width="28" height="28"/>' +
      '<rect x="565" y="180" width="32" height="32"/><rect x="615" y="180" width="32" height="32"/>' +
      '<rect x="565" y="235" width="32" height="32"/><rect x="615" y="235" width="32" height="32"/></g>' +
      '</g>'
  };

  var GROUND = {
    sea: '#f3e2b8', park: '#8fd18f', mountain: '#7fae7f', beach: '#f4e2b0',
    pool: '#dce9e0', river: '#8fc78f', countryside: '#cfe0a0', farm: '#d8c98a',
    wakayama: '#c9c2ad'
  };

  function backdrop(kind, props) {
    kind = SETS[kind] ? kind : 'town';
    var sky = SKIES[kind] || SKIES.town;
    var ground = GROUND[kind] || '#cfd6c2';
    var svg = '<svg class="backdrop" viewBox="0 0 800 450" preserveAspectRatio="xMidYMid slice" aria-hidden="true">' +
      '<defs><linearGradient id="sky-' + kind + '" x1="0" y1="0" x2="0" y2="1">' +
      '<stop offset="0%" stop-color="' + sky[0] + '"/><stop offset="100%" stop-color="' + sky[1] + '"/>' +
      '</linearGradient></defs>' +
      '<rect width="800" height="450" fill="url(#sky-' + kind + ')"/>' +
      sun(kind) + clouds() +
      '<rect y="330" width="800" height="120" fill="' + ground + '"/>' +
      SETS[kind];

    (props || []).forEach(function (p, i) {
      var x = 90 + i * 620, y = 300;
      svg += '<text x="' + x + '" y="' + y + '" font-size="64" text-anchor="middle" class="prop">' +
             ns.ruby.escapeHtml(p) + '</text>';
    });

    return svg + '</svg>';
  }

  /* ---------------- Actor ---------------- */
  function face(mood) {
    switch (mood) {
      case 'sad':
        return '<g class="face">' +
          '<path d="M-16 -6 q6 -6 12 0" stroke="#222" stroke-width="3" fill="none" stroke-linecap="round"/>' +
          '<path d="M4 -6 q6 -6 12 0" stroke="#222" stroke-width="3" fill="none" stroke-linecap="round"/>' +
          '<circle cx="-10" cy="2" r="3.5" fill="#222"/><circle cx="10" cy="2" r="3.5" fill="#222"/>' +
          '<path d="M-9 18 q9 -8 18 0" stroke="#222" stroke-width="3" fill="none" stroke-linecap="round"/>' +
          '<path d="M14 6 q4 10 0 14 q-4 -4 0 -14" fill="#5ec8f0"/></g>';
      case 'surprised':
        return '<g class="face">' +
          '<circle cx="-10" cy="0" r="6" fill="#fff" stroke="#222" stroke-width="2"/><circle cx="-10" cy="0" r="3" fill="#222"/>' +
          '<circle cx="10" cy="0" r="6" fill="#fff" stroke="#222" stroke-width="2"/><circle cx="10" cy="0" r="3" fill="#222"/>' +
          '<ellipse cx="0" cy="18" rx="7" ry="9" fill="#8a3d3d"/></g>';
      case 'excited':
        return '<g class="face">' +
          '<path d="M-10 -8 l3 7 l7 1 l-5 5 l1 7 l-6 -3 l-6 3 l1 -7 l-5 -5 l7 -1 z" fill="#f2b705"/>' +
          '<path d="M10 -8 l3 7 l7 1 l-5 5 l1 7 l-6 -3 l-6 3 l1 -7 l-5 -5 l7 -1 z" fill="#f2b705"/>' +
          '<path d="M-11 17 q11 12 22 0 q-11 5 -22 0" fill="#8a3d3d"/></g>';
      case 'neutral':
        return '<g class="face">' +
          '<circle cx="-10" cy="0" r="4" fill="#222" class="eye"/><circle cx="10" cy="0" r="4" fill="#222" class="eye"/>' +
          '<path d="M-7 17 h14" stroke="#222" stroke-width="3" stroke-linecap="round"/></g>';
      default: /* happy */
        return '<g class="face">' +
          '<circle cx="-10" cy="0" r="4" fill="#222" class="eye"/><circle cx="10" cy="0" r="4" fill="#222" class="eye"/>' +
          '<path d="M-10 14 q10 12 20 0" stroke="#222" stroke-width="3" fill="none" stroke-linecap="round"/>' +
          '<circle cx="-22" cy="10" r="6" fill="#ff9aa2" opacity=".6"/><circle cx="22" cy="10" r="6" fill="#ff9aa2" opacity=".6"/></g>';
    }
  }

  function kindOf(item) {
    var hay = ((item && item.w) + ' ' + (item && item.r) + ' ' + (item && item.e) + ' ' + (item && item.icon)).toLowerCase();
    if (/ねこ|猫|cat|🐱|犬|いぬ|dog|🐶|うさぎ|rabbit|くま|bear|とり|bird/.test(hay)) return 'animal';
    if (/ロボット|robot|🤖/.test(hay)) return 'robot';
    return 'human';
  }

  /* actor(item, mood, seedExtra) -> <svg> of the hero standing on stage */
  function actor(item, mood, seedExtra) {
    var h = hash((item && item.w || 'hero') + (seedExtra || ''));
    var skin = SKIN[h % SKIN.length];
    var hair = HAIR[(h >> 3) % HAIR.length];
    var ci = (h >> 6) % CLOTH.length;
    var cloth = CLOTH[ci];
    var cuff = CLOTH_DARK[ci];
    var kind = kindOf(item);
    var head = '';

    if (kind === 'robot') {
      skin = '#d4dbe6'; hair = '#7c8aa5';
      head = '<rect x="-32" y="-34" width="64" height="66" rx="12" fill="' + skin + '" stroke="#8894ab" stroke-width="3"/>' +
             '<rect x="-4" y="-52" width="8" height="18" fill="#8894ab"/><circle cx="0" cy="-56" r="7" fill="#ff6b6b"/>' +
             '<rect x="-40" y="-10" width="8" height="20" rx="3" fill="#8894ab"/><rect x="32" y="-10" width="8" height="20" rx="3" fill="#8894ab"/>';
    } else if (kind === 'animal') {
      head = '<path d="M-30 -20 l-6 -30 l24 12 z" fill="' + hair + '"/>' +
             '<path d="M30 -20 l6 -30 l-24 12 z" fill="' + hair + '"/>' +
             '<circle cx="0" cy="0" r="36" fill="' + skin + '"/>' +
             '<g stroke="#444" stroke-width="2" opacity=".7">' +
             '<path d="M-46 6 h16"/><path d="M-46 14 h16"/><path d="M46 6 h-16"/><path d="M46 14 h-16"/></g>';
    } else {
      head = '<circle cx="0" cy="0" r="36" fill="' + skin + '"/>' +
             '<path d="M-38 -6 a38 38 0 0 1 76 0 q-10 -18 -38 -18 t-38 18 z" fill="' + hair + '"/>' +
             (h % 2 ? '<path d="M-38 -4 q-8 40 2 46 q-8 -26 0 -46 z" fill="' + hair + '"/>' +
                      '<path d="M38 -4 q8 40 -2 46 q8 -26 0 -46 z" fill="' + hair + '"/>' : '');
    }

    return '<svg class="actor" viewBox="0 0 200 260" aria-hidden="true">' +
      '<ellipse cx="100" cy="246" rx="46" ry="9" fill="rgba(0,0,0,.18)"/>' +
      '<g class="actor-body">' +
      '<g transform="translate(100,150)">' +
      '<rect x="-34" y="0" width="68" height="72" rx="22" fill="' + cloth + '"/>' +
      '<rect x="-52" y="6" width="20" height="56" rx="10" fill="' + cuff + '" class="arm-l"/>' +
      '<rect x="32" y="6" width="20" height="56" rx="10" fill="' + cuff + '" class="arm-r"/>' +
      '<circle cx="-42" cy="66" r="9" fill="' + skin + '"/><circle cx="42" cy="66" r="9" fill="' + skin + '"/>' +
      '<rect x="-22" y="68" width="18" height="34" rx="8" fill="#3b4252"/>' +
      '<rect x="4" y="68" width="18" height="34" rx="8" fill="#3b4252"/>' +
      '</g>' +
      '<g transform="translate(100,104)">' + head + face(mood) + '</g>' +
      '</g></svg>';
  }

  /* Before the class has chosen a hero, the stage shows a silhouette. */
  function mystery() {
    return '<svg class="actor" viewBox="0 0 200 260" aria-hidden="true">' +
      '<ellipse cx="100" cy="246" rx="46" ry="9" fill="rgba(0,0,0,.18)"/>' +
      '<g class="actor-body" opacity=".55">' +
      '<g transform="translate(100,150)">' +
      '<rect x="-34" y="0" width="68" height="72" rx="22" fill="#5b6478"/>' +
      '<rect x="-52" y="6" width="20" height="56" rx="10" fill="#4a5265"/>' +
      '<rect x="32" y="6" width="20" height="56" rx="10" fill="#4a5265"/>' +
      '<rect x="-22" y="68" width="18" height="34" rx="8" fill="#3b4252"/>' +
      '<rect x="4" y="68" width="18" height="34" rx="8" fill="#3b4252"/></g>' +
      '<circle cx="100" cy="104" r="36" fill="#5b6478"/></g>' +
      '<text x="100" y="118" text-anchor="middle" font-size="46" font-weight="900" fill="#fff">?</text>' +
      '</svg>';
  }

  /* A prop the actor is holding / chasing, drawn as a big emoji token. */
  function propBubble(icon, label) {
    if (!icon) return '';
    return '<div class="prop-chip"><span class="prop-emoji">' + ns.ruby.escapeHtml(icon) + '</span>' +
           (label ? '<span class="prop-label">' + label + '</span>' : '') + '</div>';
  }

  ns.art = {
    backdrop: backdrop,
    actor: actor,
    mystery: mystery,
    propBubble: propBubble,
    kindOf: kindOf
  };
})(window.CCS = window.CCS || {});
