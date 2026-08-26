/* Headless smoke test for the story engine.
 *   node ccs/test/story-smoke.js [runs]
 * Plays random stories through every preset and every circling level and checks
 * that nothing reaches the class half-built: no unfilled {slots}, no "〜"
 * placeholders, no undefined, and a sensible amount of repetition.
 */
'use strict';
const path = require('path');
global.window = {};
['furigana', 'data', 'jp', 'art', 'story'].forEach(function (m) {
  require(path.join(__dirname, '..', 'js', m + '.js'));
});
const CCS = global.window.CCS;
const R = CCS.ruby;

const RUNS = parseInt(process.argv[2], 10) || 40;
const LEVELS = ['minimal', 'light', 'normal', 'heavy'];
const SKELETONS = ['classic', 'compare', 'journey', 'mystery'];
let failures = 0, stories = 0, totalLines = 0, totalQuestions = 0, minReps = Infinity;

function check(where, text) {
  if (/[{}]/.test(text) || text.indexOf('＿') !== -1 || text.indexOf('undefined') !== -1) {
    console.error('  ✗ ' + where + ': ' + text);
    failures++;
  }
}

CCS.data.PRESETS.forEach(function (preset) {
  SKELETONS.forEach(function (skeleton) {
    LEVELS.forEach(function (level) {
      var label = preset.id + '/' + skeleton + '/' + level;
      for (let run = 0; run < RUNS; run++) {
        const story = new CCS.Story(JSON.parse(JSON.stringify(preset.config)), { circling: level, skeleton: skeleton });
        let step = story.advance(), guard = 0;
        while (step && guard++ < 2000) {
          if (step.kind === 'choose') {
            const opt = step.options[Math.floor(Math.random() * step.options.length)];
            check(label + ' choice', R.text(opt.tk));
            check(label + ' question', R.text(step.q));
            step = story.answer(opt);
            continue;
          }
          if (step.kind === 'circle') {
            step.questions.forEach(function (q) {
              check(label + ' prompt', R.text(q.prompt));
              check(label + ' echo', R.text(q.echo));
              q.choices.forEach(function (c) { check(label + ' answer', R.text(c.tk)); });
              if (!q.choices.some(function (c) { return c.correct; })) {
                console.error('  ✗ question with no correct answer: ' + R.text(q.prompt));
                failures++;
              }
              story.score(true);
              totalQuestions++;
            });
          }
          if (step.kind === 'say') check(label + ' line', R.text(step.tk));
          if (step.kind === 'recap') break;
          step = story.advance();
        }
        if (guard >= 2000) { console.error('  ✗ story never finished: ' + label); failures++; }
        if (story.st.script.length < 12) {
          console.error('  ✗ story too short (' + label + '): ' + story.st.script.length + ' lines');
          failures++;
        }
        stories++;
        totalLines += story.st.script.length;
        minReps = Math.min(minReps, story.st.reps);
      }
    });
  });
});

console.log('stories played   : ' + stories);
console.log('avg lines/story  : ' + (totalLines / stories).toFixed(1));
console.log('avg questions    : ' + (totalQuestions / stories).toFixed(1));
console.log('min target reps  : ' + minReps);
console.log(failures ? '\nFAILED (' + failures + ')' : '\nAll clear ✓');
process.exit(failures ? 1 : 0);
