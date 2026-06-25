// Rule-based Italian grapheme -> IPA converter. Italian orthography is highly
// phonetic, so a broad transcription can be generated on the fly for words that
// are NOT in the vocab index (conjugations, names, function words). This is a
// best-effort *approximation* meant as a learning hint alongside the TTS audio —
// not a lexicon. Known limits (intentional, see callers labelling it "approx."):
//   - open/closed vowels (ɛ/e, ɔ/o) are only distinguished from accent marks;
//   - diphthongs are not glided (so "uomo"/"piede" may mis-stress);
//   - default stress is penultimate (correct for the majority of Italian words);
//   - s/z voicing and z = /ts/ are broad regional choices.
// Output is wrapped in /…/ to match the stored vocab IPA format.

const ACCENT = {
  à: 'a', á: 'a', è: 'ɛ', é: 'e', ì: 'i', í: 'i', î: 'i',
  ò: 'ɔ', ó: 'o', ù: 'u', ú: 'u', â: 'a', ê: 'e', ô: 'o', û: 'u',
};
const PLAIN_VOWELS = 'aeiou';
const FRONT = 'eèéiìí'; // vowels that soften c/g/sc

function isVowelChar(c) {
  return !!c && (PLAIN_VOWELS.includes(c) || c in ACCENT);
}
function isFront(c) {
  return !!c && FRONT.includes(c);
}

// Each segment is { p: phoneme string, v: isVowel, stress: hasAccentMark }.
function toSegments(w) {
  const segs = [];
  let i = 0;
  const len = w.length;
  const at = (k) => w[k] || '';
  const pushC = (p) => segs.push({ p, v: false, stress: false });
  const pushV = (p, stress) => segs.push({ p, v: true, stress });
  const lastIsVowel = () => segs.length > 0 && segs[segs.length - 1].v;

  while (i < len) {
    const c = w[i];
    const n = at(i + 1);
    const n2 = at(i + 2);

    // --- trigraphs / digraphs ---
    if (c === 'g' && n === 'l' && n2 === 'i') {
      // "gli": ʎ. Before a vowel the i is absorbed (figlio); otherwise the i is a
      // nucleus (figli, the article "gli").
      pushC('ʎ');
      i += isVowelChar(at(i + 3)) ? 3 : 2;
      continue;
    }
    if (c === 'g' && n === 'n') { pushC('ɲ'); i += 2; continue; }
    if (c === 's' && n === 'c') {
      if (n2 === 'h') { pushC('s'); pushC('k'); i += 3; continue; } // schi/sche
      if (isFront(n2)) {
        pushC('ʃ');
        // scia/scio/sciu -> the i is absorbed
        i += (n2 === 'i' && isVowelChar(at(i + 3))) ? 3 : 2;
        continue;
      }
      pushC('s'); pushC('k'); i += 2; continue; // sca/sco/scu/sc+cons
    }
    if (c === 'c' && n === 'c') {
      if (n2 === 'h') { pushC('kː'); i += 3; continue; }
      if (isFront(n2)) {
        pushC('t'); pushC('tʃ'); // geminate affricate
        i += (n2 === 'i' && isVowelChar(at(i + 3))) ? 3 : 2;
        continue;
      }
      pushC('kː'); i += 2; continue;
    }
    if (c === 'g' && n === 'g') {
      if (n2 === 'h') { pushC('gː'); i += 3; continue; }
      if (isFront(n2)) {
        pushC('d'); pushC('dʒ');
        i += (n2 === 'i' && isVowelChar(at(i + 3))) ? 3 : 2;
        continue;
      }
      pushC('gː'); i += 2; continue;
    }
    if (c === 'c' && n === 'h') { pushC('k'); i += 2; continue; }
    if (c === 'g' && n === 'h') { pushC('g'); i += 2; continue; }

    // --- single c / g (soft before front vowels) ---
    if (c === 'c') {
      if (n === 'i' && isVowelChar(n2)) { pushC('tʃ'); i += 2; continue; } // cia/cio/ciu
      if (isFront(n)) { pushC('tʃ'); i += 1; continue; }
      pushC('k'); i += 1; continue;
    }
    if (c === 'g') {
      if (n === 'i' && isVowelChar(n2)) { pushC('dʒ'); i += 2; continue; } // gia/gio/giu
      if (isFront(n)) { pushC('dʒ'); i += 1; continue; }
      pushC('g'); i += 1; continue;
    }

    // --- q(u) ---
    if (c === 'q') {
      pushC('k');
      if (n === 'u') { pushC('w'); i += 2; continue; }
      i += 1; continue;
    }

    // --- doubled plain consonants -> geminate ---
    if (c === n && 'bdflmnprstv'.includes(c)) {
      let p = c;
      if (c === 's') p = 's'; // ss stays voiceless
      pushC(p + 'ː'); i += 2; continue;
    }
    if (c === 'z' && n === 'z') { pushC('t'); pushC('ts'); i += 2; continue; }

    // --- single consonants ---
    if (c === 'z') { pushC('ts'); i += 1; continue; }
    if (c === 's') {
      // intervocalic s -> voiced (broad northern norm)
      const voiced = lastIsVowel() && isVowelChar(n);
      pushC(voiced ? 'z' : 's'); i += 1; continue;
    }
    if (c === 'h') { i += 1; continue; } // silent
    if ('bdfklmnprtv'.includes(c)) { pushC(c); i += 1; continue; }

    // --- vowels ---
    if (c in ACCENT) { pushV(ACCENT[c], true); i += 1; continue; }
    if (PLAIN_VOWELS.includes(c)) { pushV(c, false); i += 1; continue; }

    // anything else (digits, stray punctuation): pass through as-is, non-vowel
    pushC(c); i += 1;
  }
  return segs;
}

// Pick the stressed vowel index among `segs`. An explicit accent mark wins;
// otherwise default to the penultimate vowel (Italian's most common pattern),
// falling back to the only/last vowel.
function stressedVowelIndex(segs) {
  const vowelIdx = [];
  segs.forEach((s, idx) => { if (s.v) vowelIdx.push(idx); });
  if (vowelIdx.length === 0) return -1;
  const accented = segs.findIndex((s) => s.v && s.stress);
  if (accented !== -1) return accented;
  if (vowelIdx.length === 1) return vowelIdx[0];
  return vowelIdx[vowelIdx.length - 2];
}

// Convert a single Italian word to a broad IPA transcription wrapped in /…/.
// Returns '' for empty/whitespace input.
export function toIPA(word) {
  const w = (word || '').toLowerCase().trim();
  if (!w) return '';

  const segs = toSegments(w);
  if (segs.length === 0) return '';

  const stressIdx = stressedVowelIndex(segs);

  // The stress mark sits before the syllable onset. Italian splits an
  // intervocalic cluster as coda+onset, so the onset is normally just the single
  // consonant before the stressed vowel — except a "muta + liquida" cluster
  // (stop/f + l/r) and a preceding s (str-, spr-) stay together as the onset.
  let onset = stressIdx;
  if (onset > 0 && !segs[onset - 1].v) {
    onset -= 1;
    const liquid = segs[onset].p === 'l' || segs[onset].p === 'r';
    if (liquid && onset - 1 >= 0 && /^[bpdtgkfv]ː?$/.test(segs[onset - 1].p)) {
      onset -= 1;
    }
    if (onset - 1 >= 0 && segs[onset - 1].p === 's') onset -= 1;
  }

  let out = '';
  segs.forEach((s, idx) => {
    if (idx === onset && stressIdx !== -1) out += 'ˈ';
    out += s.p;
  });

  return `/${out}/`;
}
