# `course/` schema reference

The validator (`course/validate.js`, run via `npm run validate-course`) enforces
the **must-have** rules below. See `AUTHORING.md` for the how-to.

## `course/config.js` → `export const config`

```
config = {
  id: string,                         // required — namespaces decks/storage
  brand: {
    name: string,                     // header title (first word is accented)
    tagline: string,
    goal: string,                     // shown next to the progress bar
    topicLabel: string,               // week-topic column header
    accent: string, accentDim: string,// (informational; CSS accent is in index.css)
    ribbon: [string, string, string], // top-bar colors
    about: string,                    // welcome-card intro paragraph
  },
  locale: {
    target: string,                   // required — BCP-47 tag, e.g. 'es-ES'
    native: string,                   // required — e.g. 'en'
    grammarLang: string,              // LanguageTool code; '' disables grammar
    hasIPA: boolean,                  // show the 4th vocab element as IPA
    articles: string[],              // leading articles to strip (elided end in ')
  },
  schedule: {
    startDate: string,                // required — 'YYYY-MM-DD'
    weeks: integer >= 1,              // required — total weeks
    daily: [{ day, task } x7],        // required — exactly 7
  },
  resources: [{ id, name, badge, role, desc }],
}
```

## `course/content.js` → `export const phases`

```
phases = [{
  id: string, title: string, book: string,
  badgeLabel: string, badgeBg: string, badgeColor: string,
  weeks: [{
    n: integer,                       // required — unique, contiguous 1..weeks
    d: string,                        // date range label
    r: string,                        // required — reading/material
    b: string,                        // weekly topic
    review: boolean,
    vocab: [[target, native, example, ipa?]],  // required — ≥1 tuple, ≥3 fields
    grammar: { title, body },
    prompt: { it, en },               // required — `it`=target, `en`=native
    italki: string[],                 // optional conversation starters
  }],
}]
```

## Validator rules (must pass)

1. `config.id`, `config.locale.target`, `config.locale.native` present.
2. `config.schedule.startDate` matches `YYYY-MM-DD`; `weeks` is a positive
   integer; `daily` has exactly 7 entries.
3. `phases` non-empty; total weeks **==** `schedule.weeks`.
4. Week `n`s are integers, **unique**, and **contiguous** `1..N`.
5. Each week has `r`, a `prompt` (`it`/`target`), and ≥1 vocab tuple of ≥3 fields.

Everything else (badge colors, `book`, `b`, `italki`, IPA) is optional and only
affects display.
