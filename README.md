# CCS — Co-Created Stories (日本語)

A classroom tool for building a Japanese story *with* your class, in the style of
Liam Printer's **co-created stories**: the teacher supplies the language, the students
supply the story, and the app supplies the repetition.

**Live:** https://millerjok.github.io/ccs/

Open `index.html` — no build step, no server, no install. It runs from a USB stick,
a school network share, or GitHub Pages.

---

## Teacher login

The first time CCS is opened on a device, it asks the teacher to set a PIN before
showing the Setup screen. After that, the same browser asks for that PIN again on
every fresh visit (closing the tab and reopening it, or a page reload after the
🔒 button is pressed) but not on an ordinary reload mid-lesson — so you can leave
it open for a whole lesson without re-entering it. **This is a deterrent, not real
security**: CCS is a static page with no server, so the PIN and its check both live
in the page's own source — anyone who reads it could see exactly how it works.
It exists to stop a student from casually opening Setup and rewriting the word
list mid-lesson, not to protect anything sensitive. Don't reuse a PIN from
somewhere else.

- 🔒/🔓 **Teacher** in the toolbar shows the current state and locks it on click.
- Forgotten your PIN? The login screen has a reset link — it clears the PIN only,
  your saved word lists and grammar are untouched, and you'll set a new PIN
  immediately after.

## How a lesson runs

**1. Before the lesson — put your language in.**
Pick a starter pack (three ready-made packs are built in), then edit the word lists and
the 2–3 target structures you actually want drilled. Everything is saved in the browser,
and 🔗 *リンクを コピー* gives you a link that carries the whole pack, so you can share it
with a colleague or open it on the classroom machine.

**2. In the lesson — press スタート.**
The class decides everything: who the character is, their name, what they want, where they
go, what goes wrong, who helps, how it ends. Each decision is a full-screen question in
Japanese with furigana and a picture for every option.

**3. After each decision — the app circles it.**
The new fact comes straight back at the class as yes/no, either/or and question-word
questions, with an older fact spiralled back in. Nobody moves on until the sentence has
been heard 5–15 times.

**4. At the end — read it back.**
The recap prints the whole story the class made. ぜんぶ きく reads it aloud,
🕵️ ことばを かくす blanks the key words for a retell, and 🖨 prints it as a worksheet.

---

## The skeleton

Fixed on purpose — the shape is what makes the language repeat.

| Beat | What happens | Structures the class hears |
|---|---|---|
| ① | A character **wants** something | `〜が ほしいです`, `〜は 〜です` |
| ② | Goes somewhere → **fails** | `〜に 行きます`, `〜が ありません` |
| ③ | Goes somewhere else → **fails again** | the same, plus `とても 〜です` |
| ④ | Someone **helps** → resolution | `〜が てつだいます`, `〜を あげます` |

---

## Writing target structures

Type the phrase you want repeated. Slots in curly brackets are filled from your word lists:

| Slot | Comes from |
|---|---|
| `{もの}` | Things |
| `{ばしょ}` | Places |
| `{ひと}` | People |
| `{どうし}` | Verbs |
| `{きもち}` | Feelings |

Furigana uses square or round brackets — `学校[がっこう]` or `学校(がっこう)`.

```
{もの}が ほしいです        →  ラーメンが ほしいです
{ばしょ}に 行[い]きます     →  公園に 行きます
{ばしょ}で {もの}を します  →  公園で テニスを します
でも、ありません            →  (no slot: repeated as-is)
```

## Adding vocabulary

Three columns: word, kana reading, English. The reading is what generates the furigana
(`行きます` + `いきます` → 行<ruby>き</ruby>ます with い over 行), and it is also what the
voice reads aloud. The picture is guessed from the word — click the emoji to change it.
**まとめて はる** takes a pasted list, one word per line: `学校, がっこう, school`.

Three to six words per list is the sweet spot. Fewer words means more repetition.

## Classroom controls

| | |
|---|---|
| `ふりがな ON` → `かんじ だけ` → `かな だけ` | three passes over the same story |
| `English` | hide the glosses for a second telling |
| `🗣 こえ` / `🔔 おと` | Japanese text-to-speech and sound effects |
| `🔍 大きく` | scale everything up for the projector |
| `スペース` / `1`–`4` | advance / answer, without touching the mouse |

Circling intensity (かるく / ふつう / たっぷり) sets how many questions follow each new fact —
2, 4 or 6. Year 7 and brand-new structures want たっぷり.

## Files

```
index.html        screens and markup
css/ccs.css        styling (projector-first: big type, high contrast)
js/furigana.js     word + reading -> ruby tokens; the 漢字[かんじ] parser
js/data.js         word packs, obstacle cards, ending cards, emoji guesser
js/jp.js           sentence frames and the circling question generator
js/art.js          SVG backdrops and actors (no image files)
js/audio.js        ja-JP speech synthesis + the repo's mp3 sound effects
js/story.js        the story skeleton and beat machine
js/app.js          screens, rendering, keyboard, recap and gap-fill
*.mp3              sound effects, played by js/audio.js
```

If you deploy `index.html` without the mp3 files alongside it, the app simply runs silent.

## Credit

The activity design — a rigid three-scene skeleton, student-owned details, circling for
repetition, and the motivational case for all three — is Liam Printer's co-created stories
work. This is an implementation of that activity for Japanese, not an original method.

## Deploying as one file

`node build-single.js` inlines the CSS and JavaScript into `ccs-standalone.html` — one
file to upload to tiiny.site or drop into a VLE. The sound effects stay as separate mp3s;
upload them alongside it, or don't, and the app runs silent.

## Testing

`node test/story-smoke.js` plays random stories through every word pack at every
circling level and checks that no unfilled slot ever reaches the class.
