# Authoring a course (CourseKit)

This repo is a **fork-and-fill template**. The app's engines — spaced
repetition, immersion mode, tap-to-translate, recall/cloze/listening, streaks,
achievements, downloadable Anki decks — are content-agnostic. To build *your
own* N-week study course (any language, any material, 12 / 37 / 40 weeks) you
edit **two files in `course/`**, not the components. It ships with a complete
37-week Italian Bible course as the worked example.

## TL;DR

```bash
npm ci
npm run new-course -- --weeks 40 --phases 4 --id my-course --force   # scaffold
# edit course/config.js  (brand, locale, schedule, resources)
# fill course/content.js (each week: reading, vocab, grammar, prompt)
npm run validate-course   # your checklist of what's still blank/wrong
npm run dev               # see it
npm run build             # static dist/ (also regenerates Anki decks)
```

`--force` replaces the bundled Italian course. To experiment without touching
it, scaffold elsewhere: `--out course-draft` and copy in when ready.

## The two files

### `course/config.js` — settings
- **`id`** — namespaces the Anki decks (and, later, per-course storage).
- **`brand`** — `name`, `tagline`, `goal`, `topicLabel` (the week-topic column
  header), `ribbon` (3 colors for the top bar), `about` (one-paragraph intro on
  the welcome card). *(The accent color is set in `src/index.css` `--accent` for
  light + dark — edit those two lines to recolor.)*
- **`locale`** — the language knobs that make everything "just work":
  - `target` — TTS + speech-recognition language tag, e.g. `'es-ES'`, `'fr-FR'`.
  - `native` — the learner's language.
  - `grammarLang` — LanguageTool code for the Journal check, e.g. `'es'`. Set
    `''` to hide the grammar feature.
  - `hasIPA` — `true` shows the 4th vocab element as IPA + the pronunciation key;
    `false` hides all IPA UI.
  - `articles` — leading articles to strip so a word matches inside a sentence,
    e.g. `['el','la','los','las','un','una']` or `['le','la','les','un','une',"l'"]`.
- **`schedule`** — `startDate` (`'YYYY-MM-DD'`), `weeks` (the count), and
  `daily` (the 7-item weekly rhythm shown on the Tracker).
- **`resources`** — the supporting tools/materials listed on the welcome card
  (`name`, `badge`, `desc`).

### `course/content.js` — the weeks
`export const phases = [...]`. Each **phase** groups weeks (`id`, `title`,
`book`, badge colors). Each **week**:

| field | meaning |
|---|---|
| `n` | week number, contiguous `1..weeks` across all phases |
| `d` | date range label (free text) |
| `r` | what to read/study this week |
| `b` | the weekly topic (shown under `brand.topicLabel`) |
| `review` | `true` marks a review/conversation week |
| `vocab` | array of `[target, native, example, ipa?]` tuples (IPA optional) |
| `grammar` | `{ title, body }` |
| `prompt` | `{ it, en }` — a writing prompt (`it` = target language, `en` = native) |
| `italki` | optional array of conversation-starter strings |

> Tuple shape is `[target, native, example, ipa?]`. The `example` should contain
> the target word so **cloze** practice can blank it (≈61% coverage in the
> Italian course); words that only appear inflected just won't be cloze-eligible.

## Authoring vocab in a spreadsheet

Keep vocab in Google Sheets / Excel with columns `week,target,native,example,ipa`
(ipa optional), export CSV, then:

```bash
npm run import-vocab -- vocab.csv
```

It prints a `{ weekN: [[...], ...] }` object — paste each week's array into the
matching `week.vocab` in `content.js`.

## Validate early, validate often

```bash
npm run validate-course
```

Checks: required config fields, `startDate` format, a 7-item `daily`,
`content` week-count **equals** `schedule.weeks`, week numbers unique and
contiguous `1..N`, and every vocab tuple has at least `[target, native, example]`.
Errors are line-pointed (e.g. *"week 12: missing prompt"*). It also runs in the
test suite (`course/validate.test.js`).

## What you get for free (don't edit these)

The engines read your course generically — no changes needed: SRS scheduling +
daily new-card cap, the immersion mechanism, tap-to-translate / tap-to-hear,
Recognition / Recall / Cloze / Listening practice, streaks + Today checklist,
achievement badges, opt-in reminders, and Anki deck generation
(`npm run generate-anki`, also part of `npm run build`).

## Multiple courses in one deploy (optional)

Courses live in `courses/<id>/{config.js,content.js}`; `courses/registry.js`
bundles them and picks the active one (persisted in `localStorage` under
`coursekit-active-course`). To add a second course:

```bash
npm run new-course -- --weeks 40 --phases 4 --id spanish-quixote --out courses/spanish-quixote
# fill it in, then register it:
```
```js
// courses/registry.js
import { config as quixoteConfig } from './spanish-quixote/config.js';
import { phases as quixotePhases } from './spanish-quixote/content.js';
const COURSES = [
  { config: itBibleConfig, phases: itBiblePhases },
  { config: quixoteConfig, phases: quixotePhases },   // ← add
];
```

With 2+ courses registered, a **course picker** appears in the header; switching
reloads the app into the selected course, with its own namespaced progress / SRS
/ streak. `npm run validate-course` checks every registered course. *(Note: Anki
deck downloads are still generated for the default course only.)*

## Known rough edges (for now)

- **Immersion-mode chrome** (`src/i18n/strings.js`) is Italian/English. For full
  immersion in another language, translate those keys; otherwise immersion mode
  is best left off.
- **Long-form guide prose** in `src/components/GuideSection.jsx` and
  `src/components/SentenceGuide.jsx` is still Italian-Bible specific — edit those
  components (or empty them) for your course. Moving this into `course/` is a
  planned follow-up.
- **Non-Latin / RTL scripts** (Greek, Hebrew, Arabic): the word tokenizer and
  article-stripping assume Latin-ish words — a known limit.
- **Accent color** lives in `src/index.css` (`--accent` for light + dark), not
  config.

See `plan-platform.md` for the full generalization roadmap and `course/schema.md`
for the field-by-field reference.
