/* CCS — sound
 * Japanese text-to-speech for every line (students hear it as often as they
 * read it) plus the sound effects already sitting in this repo.
 */
(function (ns) {
  'use strict';

  var SFX = {
    flip:    'card-flip-sound.mp3',
    correct: 'correct-answer-sound.mp3',
    win:     'victory-sound.mp3',
    oops:    'Tackle-sound.mp3',
    star:    'pikachu-sound.mp3'
  };

  var cache = {};
  var state = { sfx: true, tts: true, rate: 0.85 };
  var voices = [];

  function loadVoices() {
    if (!('speechSynthesis' in window)) return;
    voices = window.speechSynthesis.getVoices() || [];
  }

  if ('speechSynthesis' in window) {
    loadVoices();
    window.speechSynthesis.onvoiceschanged = loadVoices;
  }

  function japaneseVoice() {
    if (!voices.length) loadVoices();
    return voices.find(function (v) { return v.name === 'Google 日本語'; }) ||
           voices.find(function (v) { return v.lang === 'ja-JP'; }) ||
           voices.find(function (v) { return (v.lang || '').indexOf('ja') === 0; }) || null;
  }

  function speak(text) {
    if (!state.tts || !text || !('speechSynthesis' in window)) return;
    try {
      window.speechSynthesis.cancel();
      var u = new SpeechSynthesisUtterance(text);
      var v = japaneseVoice();
      if (v) u.voice = v;
      u.lang = 'ja-JP';
      u.rate = state.rate;
      window.speechSynthesis.speak(u);
    } catch (e) { /* speech is a bonus, never a blocker */ }
  }

  function stop() {
    if ('speechSynthesis' in window) {
      try { window.speechSynthesis.cancel(); } catch (e) {}
    }
  }

  function play(name) {
    if (!state.sfx || !SFX[name]) return;
    try {
      if (!cache[name]) {
        cache[name] = new Audio(SFX[name]);
        cache[name].volume = 0.55;
      }
      cache[name].currentTime = 0;
      var p = cache[name].play();
      if (p && p.catch) p.catch(function () {});
    } catch (e) { /* missing file / autoplay block: silent */ }
  }

  ns.audio = {
    state: state,
    speak: speak,
    stop: stop,
    play: play,
    setRate: function (r) { state.rate = r; }
  };
})(window.CCS = window.CCS || {});
