# CCS — Co-Created Stories (日本語)

A classroom tool for building a Japanese story *with* your class, in the style of
Liam Printer's **co-created stories**: the teacher supplies the language, the students
supply the story, and the app supplies the repetition.

**Live:** https://millerjok.github.io/ccs/

Open `index.html` — no build step, no server, no install. It runs from a USB stick,
a school network share, or GitHub Pages.

---

## Shared word packs (optional)

By default, edits to a word pack are saved only in the browser that made them —
useful for trying things out, but it means one teacher's changes never reach
another teacher's device. `js/cloud.js` adds an optional layer on top of that:
a real shared backend (Firebase) so a published change becomes the new default
for **every visitor to the site**, including ones who've never touched Setup.

It ships turned off — nothing in the page calls out to any server until it's
configured, and CCS works exactly as described above either way. To turn it on:

1. [console.firebase.google.com](https://console.firebase.google.com) → Add project (free "Spark" plan, no card required).
2. **Build → Firestore Database → Create database** → start in **production mode**.
3. Firestore → **Rules**, replace the contents with:
   ```
   rules_version = '2';
   service cloud.firestore {
     match /databases/{database}/documents {
       match /packs/{packId} {
         allow read: if true;
         allow write: if request.auth != null;
       }
     }
   }
   ```
4. **Build → Authentication → Get started → Sign-in method → Email/Password → Enable.**
5. Authentication → **Users → Add user.** This one login is shared by every teacher
   who should be able to publish — treat it like a staffroom key, not a personal
   password.
6. Project settings (⚙️) → General → "Your apps" → **Add app → Web (`</>`).**
   Copy the `firebaseConfig` object it gives you.
7. Paste those six values into the `CONFIG` object at the top of `js/cloud.js`, commit, push.

Once configured: a **☁️ Shared word packs** card appears in Setup. Every page load
fetches whatever's been published and shows that instead of the built-in default —
even if nobody in that session ever opens Setup. A **📤 Publish this as the
shared "___" pack** button lets anyone who knows the shared login overwrite the
current pack for everyone; publishing a pack that isn't one of the built-in
five adds it as a new card for all visitors.

**Why this one actually is secure, unlike the PIN above:** the shared login is
checked by Firebase itself over HTTPS, and Firestore's rules — which live in the
Firebase console, never in this repo — are what decide whether a write is
allowed. There's no secret sitting in the JavaScript for someone to read. The
one thing to still get right: don't reuse a password that matters elsewhere for
that shared login, since it's meant to be told to colleagues.

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

## Story shapes

Each shape is fixed on purpose — a rigid sequence of decisions is what makes
the language repeat. Pick one in Setup step 2; any word pack works with any
shape. All four are built from the same machinery (decide → hear it circled
back → move on), so switching shapes mid-lesson with the same pack is safe.

**こまりごと (classic)** — the original shape. A character wants something,
goes looking for it twice and fails both times, then someone helps.

| Beat | What happens |
|---|---|
| ① | A character **wants** something |
| ② | Goes somewhere → **fails** |
| ③ | Goes somewhere else → **fails again** |
| ④ | Someone **helps** → resolution |

**どちらが いい？ (compare)** — two options get introduced one at a time,
each with a pro/con twist, then the class commits to a winner and finds out
how it turns out.

**３つの よてい (journey)** — three stops in a row. Nothing carries forward
as a failure; each stop gets its own small (mostly upbeat) event resolved on
the spot, so the tone is episodic rather than cumulative.

**なぞの じけん (mystery)** — something goes missing. The class interviews
three suspects (one is secretly guilty, decided at random) and guesses
"suspicious or not" for each — scored against who actually did it — before
a detective makes the final accusation.

Whichever shape is picked, the same three target-structure boxes from step 3
get recited through the story — twice each for the two "attempt"-style
skeletons (classic, compare), across the three stops or three suspects for
the others. Write target structures that suit the shape you're using: a
`{ばしょ}に 行きます` target written for classic will still work under
compare, but it'll get filled with a random place having nothing to do with
the comparison — grammatically fine, just a bonus rep rather than a plot
point. That's true of classic's own targets too whenever a mismatch happens;
it's normal, not a bug.

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
