// scripts/generate-anki.cjs
// Run: node scripts/generate-anki.cjs
// Outputs .apkg files to public/anki/
//
// Card data is sourced from the course (course/content.js + course/config.js) via
// dynamic import — there is no longer a duplicated inline copy of the vocab/IPA,
// so the decks can't drift from the app. (This file stays CommonJS per the repo
// constraint; it `await import()`s the ESM course modules inside main().)

'use strict';

const ApkgExport = require('anki-apkg-export').default;
const fs = require('fs');
const path = require('path');

// Stable per-phase deck filenames (referenced by FlashcardsTab + the committed
// public/anki/ files). Keyed by phase id; unknown phases fall back to the id.
const DECK_FILES = {
  p1: 'phase-1-john',
  p2: 'phase-2-luke',
  p3: 'phase-3-acts',
  p4: 'phase-4-romans-psalms',
};

// ── Card formatter ─────────────────────────────────────────────────────────────

function makeCardBack(english, example, weekRef, pronunciation, exampleEn, form) {
  const pronHtml = pronunciation ? `<span style="color:#aaa;font-size:0.85em;">${pronunciation}</span><br>` : '';
  // The example's own translation, when the course provides one — without it the
  // back of the card shows a sentence the learner may not be able to read.
  const exEnHtml = exampleEn ? `<br><small style="color:#888;">${exampleEn}</small>` : '';
  // The inflected form this word takes in the example ("credere → ha creduto").
  const formHtml = form ? `<br><small style="color:#888;">form in text: <b>${form}</b></small>` : '';
  return `${pronHtml}<b>${english}</b><br><i style="color:#666;">${example}</i>${exEnHtml}${formHtml}<br><small style="color:#999;">${weekRef}</small>`;
}

// ── Generator ──────────────────────────────────────────────────────────────────

async function generateDeck(name, cards, filename) {
  const deck = new ApkgExport(name);
  for (const [front, back] of cards) {
    deck.addCard(front, back);
  }
  const buf = await deck.save(filename);
  const outPath = path.join(__dirname, '..', 'public', 'anki', filename + '.apkg');
  fs.writeFileSync(outPath, buf);
  console.log(`  ✓ ${filename}.apkg  (${cards.length} cards, ${(buf.length / 1024).toFixed(1)} KB)`);
}

async function main() {
  const { phases } = await import('../course/content.js');
  const { config } = await import('../course/config.js');
  const { parseVocab } = await import('../course/vocab.js');
  const brand = config.brand.name;
  const withIpa = config.locale.hasIPA !== false;

  console.log('\nGenerating Anki decks...\n');
  const allCards = [];

  for (const phase of phases) {
    const phaseName = `${phase.title}${phase.book ? ` — ${phase.book}` : ''}`;
    console.log(phaseName);
    const phaseCards = [];

    for (const week of phase.weeks) {
      const weekLabel = `Week ${week.n} — ${week.r}`;
      const weekCards = week.vocab.map((tuple) => {
        const { it, en, ex, ipa, exEn, form } = parseVocab(tuple);
        return [
          it,
          makeCardBack(en, ex, weekLabel, withIpa ? ipa : '', exEn, form && form.toLowerCase() !== it.toLowerCase() ? form : ''),
        ];
      });

      await generateDeck(`${brand}: ${weekLabel}`, weekCards, `week-${String(week.n).padStart(2, '0')}`);

      phaseCards.push(...weekCards);
      allCards.push(...weekCards);
    }

    await generateDeck(`${brand}: ${phaseName}`, phaseCards, DECK_FILES[phase.id] || phase.id);
    console.log('');
  }

  const weeks = phases.reduce((s, p) => s + p.weeks.length, 0);
  console.log('Complete deck');
  await generateDeck(`${brand} — Complete (${weeks} Weeks)`, allCards, 'complete');

  console.log(`\nDone. ${allCards.length} cards total across ${weeks} weeks.\n`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
