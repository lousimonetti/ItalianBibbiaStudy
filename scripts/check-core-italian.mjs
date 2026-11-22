#!/usr/bin/env node
// Checks the Italian of the Parole di base core deck without a native speaker
// (REVIEW-fluency.md, "How the core deck's Italian was checked").
//
//   node scripts/check-core-italian.mjs               check every row, write a report
//   node scripts/check-core-italian.mjs --candidates  also propose Tatoeba sentences
//   node scripts/check-core-italian.mjs --no-lt       skip LanguageTool (offline)
//
// What it can catch: misspelt or invented words, a wrong article or gender on a
// headword, a `form` that is not an inflection of its headword, article/noun
// disagreement, the grammar errors LanguageTool knows, and headwords too rare to
// be "core". What it cannot catch: whether a sentence sounds natural. Only text
// written by native speakers shows that, which is why rows prefer a Tatoeba
// sentence by a native speaker where one fits (`--candidates`).
//
// Data is downloaded once into scripts/.cache/ (gitignored, about 400 MB once
// unpacked) and never needed by the tests:
//   Morph-it! 0.48 (docs.sslmit.unibo.it, CC BY-SA 2.0 / LGPL), the Italian
//   morphological lexicon, about 500k forms;
//   FrequencyWords it_50k (OpenSubtitles 2018 counts);
//   Tatoeba exports (tatoeba.org, CC BY 2.0 FR): Italian sentences, ita-eng
//   links, English sentences, users' languages, sentence reviews.
// Only course sentences are sent to LanguageTool, never user data.
//
// Exit code: 0 when every flag is fixed or listed with a reason in
// scripts/core-italian-allow.json, 1 otherwise.

import { execSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { createReadStream, existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { createInterface } from 'node:readline';
import { fileURLToPath } from 'node:url';
import { CORE_VOCAB } from '../courses/it-bible-cei/coreVocab.js';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const CACHE = join(ROOT, 'scripts/.cache');
const ALLOW_FILE = join(ROOT, 'scripts/core-italian-allow.json');
const args = new Set(process.argv.slice(2));

// ── data ────────────────────────────────────────────────────────────────────

const SOURCES = {
  'morph-it.tgz': 'https://docs.sslmit.unibo.it/lib/exe/fetch.php?media=resources:morph-it.tgz',
  'it_50k.txt': 'https://raw.githubusercontent.com/hermitdave/FrequencyWords/master/content/2018/it/it_50k.txt',
  'ita_sentences_detailed.tsv.bz2': 'https://downloads.tatoeba.org/exports/per_language/ita/ita_sentences_detailed.tsv.bz2',
  'ita-eng_links.tsv.bz2': 'https://downloads.tatoeba.org/exports/per_language/ita/ita-eng_links.tsv.bz2',
  'eng_sentences.tsv.bz2': 'https://downloads.tatoeba.org/exports/per_language/eng/eng_sentences.tsv.bz2',
  'user_languages.tar.bz2': 'https://downloads.tatoeba.org/exports/user_languages.tar.bz2',
  'users_sentences.csv': 'https://downloads.tatoeba.org/exports/users_sentences.csv',
};

function fetchData(names) {
  mkdirSync(CACHE, { recursive: true });
  for (const name of names) {
    const file = join(CACHE, name);
    if (!existsSync(file)) {
      console.log(`downloading ${name}`);
      execSync(`curl -sSL --fail -o ${JSON.stringify(file)} ${JSON.stringify(SOURCES[name])}`);
    }
  }
  const unpack = [
    ['current_version/morph-it_048.txt', 'tar xzf morph-it.tgz'],
    ['user_languages.csv', 'tar xjf user_languages.tar.bz2'],
    ['ita_sentences_detailed.tsv', 'bunzip2 -kf ita_sentences_detailed.tsv.bz2'],
    ['ita-eng_links.tsv', 'bunzip2 -kf ita-eng_links.tsv.bz2'],
    ['eng_sentences.tsv', 'bunzip2 -kf eng_sentences.tsv.bz2'],
  ];
  for (const [out, cmd] of unpack) {
    const archive = cmd.split(' ').pop();
    if (names.includes(archive) && !existsSync(join(CACHE, out))) execSync(cmd, { cwd: CACHE });
  }
}

async function eachLine(file, fn) {
  const rl = createInterface({ input: createReadStream(file), crlfDelay: Infinity });
  for await (const line of rl) fn(line);
}

// form -> [{ lemma, tag }]. Morph-it is Latin-1 and lists elided forms with
// their apostrophe ("dell'").
function loadMorph() {
  const text = readFileSync(join(CACHE, 'current_version/morph-it_048.txt'), 'latin1');
  const m = new Map();
  for (const line of text.split('\n')) {
    const [form, lemma, tag] = line.split('\t');
    if (!tag) continue;
    const k = form.toLowerCase();
    if (!m.has(k)) m.set(k, []);
    m.get(k).push({ lemma: lemma.toLowerCase(), tag: tag.trim() });
  }
  return m;
}

// Word ranks, and lemma ranks: a lemma counts every form Morph-it lists under
// it, so an infinitive nobody says ("bisognare") ranks by "bisogna".
function loadRanks(morph) {
  const words = new Map();
  const counts = new Map();
  readFileSync(join(CACHE, 'it_50k.txt'), 'utf8').split('\n').forEach((line, i) => {
    const [w, c] = line.split(' ');
    if (!w || words.has(w)) return;
    words.set(w, i + 1);
    for (const l of new Set((morph.get(w) || []).map((a) => a.lemma))) counts.set(l, (counts.get(l) || 0) + Number(c));
  });
  const lemmas = new Map([...counts].sort((a, b) => b[1] - a[1]).map(([l], i) => [l, i + 1]));
  return { words, lemmas };
}

// ── tokens ──────────────────────────────────────────────────────────────────

const LETTER = /[a-zàáèéìíòóùúA-ZÀÁÈÉÌÍÒÓÙÚ]/;

// Words of a sentence, with an elided prefix split off: "dell'autobus" ->
// ["dell'", "autobus"]. Keeps the original case.
export function words(text) {
  const out = [];
  for (const raw of text.replace(/’/g, "'").split(/[^a-zàáèéìíòóùúA-ZÀÁÈÉÌÍÒÓÙÚ']+/)) {
    const w = raw.replace(/^'+|'+$/g, '');
    if (!w || !LETTER.test(w)) continue;
    const i = w.indexOf("'");
    if (i > 0 && i < w.length - 1) out.push(w.slice(0, i + 1), w.slice(i + 1));
    else out.push(w);
  }
  return out;
}

const ARTICLES = new Set(['il', 'lo', 'la', "l'", 'i', 'gli', 'le']);
const CONTRACTS = new Set(['a', 'di', 'da', 'in', 'su']);

// "la casa" -> { article: 'la', head: 'casa' }; "andare" -> { head: 'andare' }.
function splitHeadword(term) {
  const w = words(term).map((x) => x.toLowerCase());
  if (w.length > 1 && ARTICLES.has(w[0])) return { article: w[0], head: w.slice(1).join(' ') };
  return { article: null, head: w.join(' ') };
}

// Gender and number of an analysis, from Morph-it's tag: "NOUN-F:s",
// "ART-M:p", "ADJ:pos+f+s", "DET-POSS:m+s". Returns null when the tag has none.
function gn(tag) {
  let m = tag.match(/^(?:NOUN|ART|ARTPRE)-([MF]):([sp])/);
  if (m) return { g: m[1].toLowerCase(), n: m[2] };
  m = tag.match(/^(?:ADJ|DET-[A-Z]+):(?:pos\+|sup\+|comp\+)?([mf])\+([sp])/);
  if (m) return { g: m[1], n: m[2] };
  return null;
}

// A participle's gender and number: "VER:part+past+s+f".
function partGn(tag) {
  const m = tag.match(/^VER:part\+past\+([sp])\+([mf])/);
  return m ? { g: m[2], n: m[1] } : null;
}

const COPULAS = new Set(['è', 'sono', 'era', 'erano', 'sembra', 'sembrano', 'resta', 'diventa']);

const compatible = (as, bs) => as.some((a) => bs.some((b) => a.g === b.g && a.n === b.n));

// ── checks ──────────────────────────────────────────────────────────────────

function checkRow(row, morph, ranks) {
  const [it, , ex, , { form }] = row;
  const flags = [];
  const flag = (check, detail) => flags.push({ check, detail });

  // 1. Every word is a real Italian form.
  for (const w of new Set([...words(it), ...words(ex)])) {
    const k = w.toLowerCase();
    if (!morph.has(k)) flag('lexicon', `"${w}" is not in Morph-it`);
  }

  // 2. The headword's article matches the noun.
  const { article, head } = splitHeadword(it);
  if (article && !head.includes(' ')) {
    const arts = (morph.get(article) || []).map((a) => gn(a.tag)).filter(Boolean);
    const nouns = (morph.get(head) || []).filter((a) => a.tag.startsWith('NOUN')).map((a) => gn(a.tag));
    if (nouns.length && !compatible(arts, nouns)) {
      flag('article', `"${article}" does not agree with "${head}" (${(morph.get(head) || []).map((a) => a.tag).join(', ')})`);
    }
  }

  // 3. `form` is an inflection of the headword.
  if (form && !head.includes(' ')) {
    const lemmas = new Set((morph.get(form.toLowerCase()) || []).map((a) => a.lemma));
    const headLemmas = new Set([head, ...(morph.get(head) || []).map((a) => a.lemma)]);
    if (lemmas.size && ![...lemmas].some((l) => headLemmas.has(l))) {
      flag('form', `"${form}" is listed under ${[...lemmas].join('/')}, not "${head}"`);
    }
  }

  // 4. A determiner agrees with the word after it. The next word is read as a
  // noun or adjective; when it could also be a verb and the determiner could
  // be an object clitic ("la vedo", "le dico"), it is skipped, and so is an
  // infinitive used as a noun ("il mangiare").
  // Pairs never cross punctuation: "Desidera altro, signora?" pairs nothing.
  const clauses = ex.split(/[,;:.!?«»"]/).map((c) => words(c).map((x) => x.toLowerCase()));
  // "molto", "troppo", "tutto" are adverbs as often as determiners.
  const isDet = (tags) => tags.some((a) => /^(ART|ARTPRE|DET-)/.test(a.tag)) && !tags.some((a) => a.tag === 'ADV');
  const nominal = (tags) => tags.filter((a) => /^(NOUN|ADJ)/.test(a.tag) || /^VER:part/.test(a.tag))
    .map((a) => gn(a.tag) || partGn(a.tag)).filter(Boolean);
  for (const ws of clauses) for (let i = 0; i < ws.length - 1; i += 1) {
    const here = morph.get(ws[i]) || [];
    if (!isDet(here)) continue;
    const dg = here.filter((a) => /^(ART|ARTPRE|DET-)/.test(a.tag)).map((a) => gn(a.tag)).filter(Boolean);
    if (!dg.length) continue;
    const next = morph.get(ws[i + 1]) || [];
    const ng = nominal(next);
    if (!ng.length) continue;
    const verbal = next.some((a) => /^(VER|AUX|MOD|ASP|CAU)/.test(a.tag) && !/^VER:part/.test(a.tag));
    if (verbal && here.some((a) => a.tag.startsWith('PRO'))) continue;
    if (next.some((a) => /:inf/.test(a.tag))) continue;
    if (!compatible(dg, ng)) flag('agreement', `"${ws[i]} ${ws[i + 1]}"`);
  }

  // 5. A preposition never stands before a definite article it contracts
  // with: "a il" is "al", "di la" is "della", "su i" is "sui".
  for (const ws of clauses) for (let i = 0; i < ws.length - 1; i += 1) {
    if (CONTRACTS.has(ws[i]) && ARTICLES.has(ws[i + 1])) flag('contraction', `"${ws[i]} ${ws[i + 1]}"`);
  }

  // 6. An adjective agrees with its noun: right after it ("una casa nuova"),
  // or after "è / sono / era / sembra" with the noun as subject ("la casa è
  // nuova"). The noun is the word after a determiner, so its reading is sure.
  for (const ws of clauses) for (let i = 1; i < ws.length - 1; i += 1) {
    const nounTags = (morph.get(ws[i]) || []).filter((a) => a.tag.startsWith('NOUN'));
    if (!isDet(morph.get(ws[i - 1]) || []) || !nounTags.length) continue;
    const ag = nounTags.map((a) => gn(a.tag));
    let j = i + 1;
    if (COPULAS.has(ws[j]) && j + 1 < ws.length) j += 1;
    else if (ws[j] && COPULAS.has(ws[j])) continue;
    const adj = morph.get(ws[j]) || [];
    if (!adj.length || !adj.every((a) => a.tag.startsWith('ADJ'))) continue;
    const bg = adj.map((a) => gn(a.tag)).filter(Boolean);
    if (bg.length && !compatible(ag, bg)) flag('agreement', `"${ws.slice(i, j + 1).join(' ')}"`);
  }

  // 7. The headword is frequent enough to be "core".
  if (!head.includes(' ')) {
    const reflexive = head.match(/^(.*[aei])r(si)$/);
    const keys = [head, ...(morph.get(head) || []).map((a) => a.lemma), reflexive ? `${reflexive[1]}re` : null].filter(Boolean);
    const rank = Math.min(...keys.map((k) => ranks.lemmas.get(k) || ranks.words.get(k) || Infinity));
    if (rank === Infinity) flag('frequency', `"${head}" is not among the lemmas of the 50k most frequent words`);
    else if (rank > 8000) flag('frequency', `"${head}" is lemma number ${rank}`);
  }
  return flags;
}

// LanguageTool, batched: sentences joined by blank lines, matches mapped back
// to their sentence by offset. Responses are cached by the hash of the batch.
const LT_IGNORE = /WHITESPACE|TYPOGRAPHY|APOSTROPHE|PUNCTUATION_PARAGRAPH_END|UPPERCASE_SENTENCE_START|DOUBLE_PUNCTUATION|ITALIAN_WORD_REPEAT_RULE/;

async function languageTool(sentences) {
  const dir = join(CACHE, 'lt');
  mkdirSync(dir, { recursive: true });
  const out = new Map(sentences.map((s) => [s, []]));
  const batches = [];
  let cur = [];
  let size = 0;
  for (const s of sentences) {
    if (size + s.length > 5000 && cur.length) { batches.push(cur); cur = []; size = 0; }
    cur.push(s);
    size += s.length + 2;
  }
  if (cur.length) batches.push(cur);

  for (const batch of batches) {
    const text = batch.join('\n\n');
    const file = join(dir, `${createHash('sha1').update(text).digest('hex')}.json`);
    let data;
    if (existsSync(file)) {
      data = JSON.parse(readFileSync(file, 'utf8'));
    } else {
      const res = await fetch('https://api.languagetool.org/v2/check', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({ text, language: 'it' }),
      });
      if (!res.ok) throw new Error(`LanguageTool ${res.status}`);
      data = await res.json();
      writeFileSync(file, JSON.stringify(data));
      await new Promise((r) => setTimeout(r, 4000)); // stay under 20 requests a minute
    }
    let start = 0;
    const spans = batch.map((s) => { const span = [start, start + s.length, s]; start += s.length + 2; return span; });
    for (const m of data.matches) {
      if (LT_IGNORE.test(m.rule.id)) continue;
      const span = spans.find(([a, b]) => m.offset >= a && m.offset < b);
      if (!span) continue;
      const bad = span[2].slice(m.offset - span[0], m.offset - span[0] + m.length);
      const fix = m.replacements.slice(0, 3).map((r) => r.value).join(' / ');
      out.get(span[2]).push(`${m.rule.id}: "${bad}" ${m.message}${fix ? ` (→ ${fix})` : ''}`);
    }
  }
  return out;
}

// ── Tatoeba candidates ─────────────────────────────────────────────────────

// Proper names Tatoeba is full of, plus capitalised words a church course can
// use freely.
const OK_CAPITALS = new Set(['Dio', 'Gesù', 'Signore', 'Natale', 'Pasqua', 'Italia', 'Roma', 'Europa', 'Vangelo', 'Messa']);

async function tatoebaCandidates(rows, morph, ranks) {
  const native = new Set();
  await eachLine(join(CACHE, 'user_languages.csv'), (line) => {
    const [lang, level, user] = line.split('\t');
    if (lang === 'ita' && level === '5') native.add(user);
  });
  const reviews = new Map();
  await eachLine(join(CACHE, 'users_sentences.csv'), (line) => {
    const [, id, review] = line.split('\t');
    const r = reviews.get(id) || { ok: 0, bad: 0 };
    if (review === '1') r.ok += 1;
    if (review === '-1') r.bad += 1;
    reviews.set(id, r);
  });
  const links = new Map();
  await eachLine(join(CACHE, 'ita-eng_links.tsv'), (line) => {
    const [a, b] = line.split('\t');
    if (!links.has(a)) links.set(a, []);
    links.get(a).push(b);
  });

  // Every acceptable native sentence, indexed by its lowercase words.
  const pool = [];
  const byWord = new Map();
  await eachLine(join(CACHE, 'ita_sentences_detailed.tsv'), (line) => {
    const [id, , text, owner] = line.split('\t');
    if (!native.has(owner) || !links.has(id)) return;
    if ((reviews.get(id)?.bad || 0) > 0) return;
    if (/[0-9"“”«»()[\]:;]/.test(text)) return;
    const ws = words(text);
    if (ws.length < 4 || ws.length > 12) return;
    for (let i = 0; i < ws.length; i += 1) {
      const w = ws[i];
      const lower = w.toLowerCase();
      if (!morph.has(lower)) return;
      if (/^[A-ZÀ-Ú]/.test(w) && !OK_CAPITALS.has(w) && (i > 0 || morph.get(lower).every((a) => a.tag === 'NPR'))) return;
    }
    const lower = ws.map((w) => w.toLowerCase());
    // Simpler words, about seven of them, reviewed OK, and written in Italian
    // first (its id is older than every English one it is linked to; a
    // translation from English is likelier to carry an English turn of phrase).
    const ok = reviews.get(id)?.ok || 0;
    const original = links.get(id).every((e) => Number(e) > Number(id));
    const score = lower.reduce((s, w) => s + Math.log(ranks.words.get(w) || 60000), 0) / lower.length
      + 0.25 * Math.abs(lower.length - 7) - 0.8 * Math.min(ok, 2) - (original ? 0.8 : 0);
    const entry = { id, text, owner, lower, score, ok, original };
    pool.push(entry);
    for (const w of new Set(lower)) {
      if (!byWord.has(w)) byWord.set(w, []);
      byWord.get(w).push(entry);
    }
  });

  const wanted = new Map();
  for (const row of rows) {
    const [it, , , , { form }] = row;
    const { article, head } = splitHeadword(it);
    const target = (form || head).toLowerCase().split(' ');
    const first = byWord.get(target[0]) || [];
    // A noun headword must follow an article, a determiner or a preposition,
    // so "la messa" does not match the participle in "si è messa".
    const nounLike = (e) => {
      const i = e.lower.indexOf(target[0]);
      const prev = i > 0 ? morph.get(e.lower[i - 1]) || [] : [];
      return prev.some((a) => /^(ART|ARTPRE|DET-(?!NUM)|PRE)/.test(a.tag));
    };
    const hits = first
      .filter((e) => target.length === 1 || e.lower.join(' ').includes(target.join(' ')))
      .filter((e) => !article || target.length > 1 || nounLike(e))
      .sort((a, b) => a.score - b.score)
      .slice(0, 6);
    wanted.set(it, hits);
  }

  const engIds = new Set();
  for (const hits of wanted.values()) for (const h of hits) for (const e of links.get(h.id)) engIds.add(e);
  const eng = new Map();
  await eachLine(join(CACHE, 'eng_sentences.tsv'), (line) => {
    const [id, , text] = line.split('\t');
    if (engIds.has(id)) eng.set(id, text);
  });
  const result = {};
  for (const [it, hits] of wanted) {
    result[it] = hits.map((h) => {
      const en = links.get(h.id).filter((e) => eng.has(e)).map((e) => ({ id: e, text: eng.get(e) }))
        .sort((a, b) => a.text.length - b.text.length)[0];
      return { id: h.id, it: h.text, owner: h.owner, ok: h.ok, original: h.original, en };
    }).filter((h) => h.en);
  }
  console.log(`Tatoeba: ${native.size} native Italian speakers, ${pool.length} usable sentences`);
  return result;
}

// ── self-test ───────────────────────────────────────────────────────────────

// How much would the checks catch? Plant one known error in each real
// sentence, of four kinds a learner (or a model) makes, and count how many the
// lexicon checks flag. LanguageTool is left out: on Italian its free tier
// found the typo in "Questo è un erore" but not "La ragazzo", "a il mercato"
// or "ho andato", so it is a spelling check here and nothing more.
const MUTATIONS = {
  'article gender': (s) => swapWord(s, { il: 'la', la: 'il', un: 'una', una: 'un', lo: 'la', i: 'le', le: 'i' }),
  'uncontracted preposition': (s) => swapWord(s, { al: 'a il', alla: 'a la', del: 'di il', della: 'di la', nel: 'in il', nella: 'in la', sul: 'su il', dal: 'da il' }),
  'adjective ending': (s, morph) => {
    const ws = s.split(' ');
    for (let i = 1; i < ws.length; i += 1) {
      const w = ws[i].toLowerCase().replace(/[.,!?]$/, '');
      const tags = morph.get(w) || [];
      if (tags.length && tags.every((t) => t.tag.startsWith('ADJ')) && /[oa]$/.test(w)) {
        ws[i] = ws[i].replace(/([oa])([.,!?]?)$/, (_, v, p) => (v === 'o' ? 'a' : 'o') + p);
        return ws.join(' ');
      }
    }
    return null;
  },
  'misspelling': (s) => {
    const m = s.match(/[a-zàèéìòù]{6,}/);
    if (!m) return null;
    const w = m[0];
    const bad = /(.)\1/.test(w) ? w.replace(/(.)\1/, '$1') : w.slice(0, 2) + w[3] + w[2] + w.slice(4);
    return bad === w ? null : s.replace(w, bad);
  },
};

function swapWord(s, map) {
  const ws = s.split(' ');
  for (let i = 0; i < ws.length; i += 1) {
    const lead = ws[i].match(/^[A-Z]/);
    const w = ws[i].toLowerCase();
    if (map[w]) {
      ws[i] = lead ? map[w][0].toUpperCase() + map[w].slice(1) : map[w];
      return ws.join(' ');
    }
  }
  return null;
}

function selfTest(morph, ranks) {
  const lines = ['', '## Self-test: planted errors caught', '', '| Error | Planted | Caught |', '|---|---|---|'];
  for (const [name, mutate] of Object.entries(MUTATIONS)) {
    let planted = 0;
    let caught = 0;
    for (const row of CORE_VOCAB) {
      const bad = mutate(row[2], morph);
      if (!bad || bad === row[2]) continue;
      planted += 1;
      const before = checkRow(row, morph, ranks).length;
      const after = checkRow([row[0], row[1], bad, row[3], { ...row[4], form: '' }], morph, ranks).length;
      const formFlags = checkRow([row[0], row[1], row[2], row[3], { ...row[4], form: '' }], morph, ranks).length;
      if (after > Math.min(before, formFlags)) caught += 1;
    }
    lines.push(`| ${name} | ${planted} | ${caught} (${planted ? Math.round((100 * caught) / planted) : 0}%) |`);
  }
  return lines;
}

// ── main ────────────────────────────────────────────────────────────────────

async function main() {
  const needs = ['morph-it.tgz', 'it_50k.txt'];
  if (args.has('--candidates')) needs.push(...Object.keys(SOURCES).filter((k) => !needs.includes(k)));
  fetchData(needs);
  const morph = loadMorph();
  const ranks = loadRanks(morph);
  const allow = existsSync(ALLOW_FILE) ? JSON.parse(readFileSync(ALLOW_FILE, 'utf8')) : [];
  const allowed = (term, f) => allow.some((a) => a.term === term && a.check === f.check
    && (!a.match || f.detail.includes(a.match)));

  const lt = args.has('--no-lt') ? new Map() : await languageTool([...new Set(CORE_VOCAB.map((r) => r[2]))]);

  const report = [];
  let open = 0;
  let accepted = 0;
  for (const row of CORE_VOCAB) {
    const flags = checkRow(row, morph, ranks);
    for (const msg of lt.get(row[2]) || []) flags.push({ check: 'languagetool', detail: msg });
    const rows = flags.map((f) => ({ ...f, allowed: allowed(row[0], f) }));
    open += rows.filter((f) => !f.allowed).length;
    accepted += rows.filter((f) => f.allowed).length;
    if (rows.length) report.push({ term: row[0], ex: row[2], exEn: row[4].exEn, src: row[4].src || 'authored', flags: rows });
  }

  const md = [
    '# Core deck Italian check',
    '',
    `${CORE_VOCAB.length} rows · ${open} open flags · ${accepted} allowed with a reason`,
    '',
    ...report.flatMap((r) => [
      `## ${r.term}  (${r.src})`,
      `> ${r.ex}`,
      `> ${r.exEn}`,
      ...r.flags.map((f) => `- ${f.allowed ? '(allowed) ' : ''}**${f.check}**: ${f.detail}`),
      '',
    ]),
    ...selfTest(morph, ranks),
  ].join('\n');
  writeFileSync(join(CACHE, 'core-report.md'), md);
  writeFileSync(join(CACHE, 'core-report.json'), JSON.stringify(report, null, 2));

  if (args.has('--candidates')) {
    const cands = await tatoebaCandidates(CORE_VOCAB, morph, ranks);
    writeFileSync(join(CACHE, 'core-candidates.json'), JSON.stringify(cands, null, 2));
    const covered = Object.values(cands).filter((c) => c.length).length;
    console.log(`candidates: ${covered} of ${CORE_VOCAB.length} rows have at least one`);
  }

  const by = {};
  for (const r of report) for (const f of r.flags) if (!f.allowed) by[f.check] = (by[f.check] || 0) + 1;
  console.log(`${CORE_VOCAB.length} rows checked: ${open} open flags ${JSON.stringify(by)}, ${accepted} allowed`);
  console.log(`report: ${join(CACHE, 'core-report.md')}`);
  process.exit(open ? 1 : 0);
}

main().catch((e) => { console.error(e); process.exit(2); });
