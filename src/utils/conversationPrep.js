// Prepara la conversazione (REVIEW-fluency.md B4).
//
// Speaking fluency grows with hours of real conversation, and an hour with a
// tutor or a language partner is worth far more when the learner arrives with
// something to say. This turns data every week already has (its spoken
// questions, its phrase chunks, its passage reference, its new words) into a short
// sheet: questions to be asked, chunks to use, and three things to say about
// the reading. Pure: week in, sheet out.

const MAX_ASK = 4;
const MAX_CHUNKS = 6;
const MAX_WORDS = 6;

// "Giovanni 6,34-35.47-56" -> "Giovanni 6": book and first chapter.
export function readingHead(ref) {
  if (!ref) return '';
  const first = ref.split(';')[0];
  return first.split(',')[0].trim();
}

export function buildPrep(week) {
  if (!week) return null;
  const ask = (week.questions || []).slice(0, MAX_ASK).map((q) => q.q).filter(Boolean);
  const chunks = (week.phrases || []).slice(0, MAX_CHUNKS).map(({ it, en }) => ({ it, en }));
  const words = (week.vocab || []).slice(0, MAX_WORDS).map(([it, en]) => ({ it, en }));
  const head = readingHead(week.passage?.ref);
  const say = [
    head && { it: `Questa settimana ho letto ${head}.`, en: `This week I read ${head}.` },
    { it: 'La frase che mi ha colpito di più è…', en: 'The sentence that struck me most is…' },
    words[0] && {
      it: `Una parola nuova per me è «${words[0].it}».`,
      en: `A new word for me is "${words[0].en}".`,
    },
  ].filter(Boolean);
  if (!ask.length && !chunks.length && !words.length) return null;
  return { weekN: week.n, ask, chunks, words, say };
}

// The sheet as plain text, to paste into a message to a tutor or partner.
export function prepText(prep, title = '') {
  if (!prep) return '';
  const lines = [];
  if (title) lines.push(title, '');
  if (prep.ask.length) {
    lines.push('Domande (questions you can ask me):');
    prep.ask.forEach((q) => lines.push(`- ${q}`));
    lines.push('');
  }
  if (prep.say.length) {
    lines.push('Cose da dire (things I will try to say):');
    prep.say.forEach((s) => lines.push(`- ${s.it}`));
    lines.push('');
  }
  if (prep.chunks.length) {
    lines.push('Espressioni da usare (phrases I am practicing):');
    prep.chunks.forEach((c) => lines.push(`- ${c.it}${c.en ? ` (${c.en})` : ''}`));
    lines.push('');
  }
  if (prep.words.length) {
    lines.push('Parole nuove (new words this week):');
    lines.push(prep.words.map((w) => w.it).join(', '));
  }
  return lines.join('\n').trim();
}
