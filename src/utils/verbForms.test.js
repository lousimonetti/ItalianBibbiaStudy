import { describe, it, expect } from 'vitest';
import { VERB_FORMS, FORM_CATEGORIES } from '../../course/verbForms';
import {
  verdict, confusedWith, orderForms, saveFormResult, loadFormStats,
  pluralFromSingular, followsPluralRule, categoryOf, STORAGE_KEY,
} from './verbForms';

const item = (form) => VERB_FORMS.find((v) => v.form === form);

describe('verdict', () => {
  it('accepts the infinitive, case- and accent-insensitively', () => {
    expect(verdict(item('disse'), 'dire')).toBe('correct');
    expect(verdict(item('disse'), 'DIRE')).toBe('correct');
    expect(verdict(item('disse'), '  dire  ')).toBe('correct');
  });

  it('accepts a listed alternate form', () => {
    // diede / dette are both passato remoto of dare
    expect(verdict(item('diede'), 'dare')).toBe('correct');
    expect(verdict(item('diede'), 'dette')).toBe('correct');
  });

  // The reason this drill grades exactly rather than with answer.js's fuzzy
  // matcher: "dare" is one edit from "dire" and both are real verbs here.
  it('does NOT fuzzy-accept a different verb one edit away', () => {
    expect(verdict(item('disse'), 'dare', VERB_FORMS)).not.toBe('correct');
  });

  it('names the confusion when the answer is another verb in the set', () => {
    expect(verdict(item('disse'), 'dare', VERB_FORMS)).toBe('confused');
    expect(confusedWith('dare', VERB_FORMS)).toBe('dare');
  });

  it('is plain wrong for a verb that is not in the set', () => {
    expect(verdict(item('disse'), 'camminare', VERB_FORMS)).toBe('wrong');
    expect(confusedWith('camminare', VERB_FORMS)).toBe(null);
  });

  it('is empty for blank input', () => {
    expect(verdict(item('disse'), '')).toBe('empty');
    expect(verdict(item('disse'), '   ')).toBe('empty');
  });

  it('does not accept the form itself as its own answer', () => {
    expect(verdict(item('disse'), 'disse', VERB_FORMS)).not.toBe('correct');
    expect(verdict(item('erano diventati'), 'erano diventati', VERB_FORMS)).not.toBe('correct');
  });
});

describe('the 3rd-plural rule', () => {
  it('builds the plural by adding -ro to the singular', () => {
    expect(pluralFromSingular('disse')).toBe('dissero');
    expect(pluralFromSingular('fece')).toBe('fecero');
    expect(pluralFromSingular('ebbe')).toBe('ebbero');
    expect(pluralFromSingular('nacque')).toBe('nacquero');
    expect(pluralFromSingular('vide')).toBe('videro');
  });

  it('knows essere is the exception', () => {
    expect(pluralFromSingular('fu')).toBe('furono');
    expect(followsPluralRule('fu', 'furo')).toBe(false);
    expect(followsPluralRule('fu', 'furono')).toBe(true);
  });

  it('holds for every singular/plural pair the dataset ships', () => {
    const singulars = new Map(
      VERB_FORMS.filter((v) => v.cat === 'remoto-forte').map((v) => [v.inf, v.form]));
    const broken = VERB_FORMS
      .filter((v) => v.cat === 'remoto-plurale' && singulars.has(v.inf))
      .filter((v) => !followsPluralRule(singulars.get(v.inf), v.form))
      .map((v) => `${singulars.get(v.inf)} → ${v.form}`);
    // pluralFromSingular already encodes the essere exception, so a non-empty
    // list here means the dataset ships a pair the rule cannot explain.
    expect(broken).toEqual([]);
  });

  it('is empty-safe', () => {
    expect(pluralFromSingular('')).toBe('');
    expect(pluralFromSingular(null)).toBe('');
  });
});

describe('scheduling', () => {
  it('serves never-attempted categories before practised ones', () => {
    const store = { 'remoto-forte': { attempts: 10, correct: 10 } };
    const items = [
      { form: 'disse', inf: 'dire', cat: 'remoto-forte' },
      { form: 'tremò', inf: 'tremare', cat: 'remoto-regolare' },
    ];
    expect(orderForms(items, store, () => 0)[0].cat).toBe('remoto-regolare');
  });

  it('orders practised categories weakest first', () => {
    const store = {
      'remoto-forte': { attempts: 10, correct: 9 },
      trapassato: { attempts: 10, correct: 3 },
    };
    const items = [
      { form: 'disse', inf: 'dire', cat: 'remoto-forte' },
      { form: 'aveva detto', inf: 'dire', cat: 'trapassato' },
    ];
    expect(orderForms(items, store, () => 0)[0].cat).toBe('trapassato');
  });

  it('persists results per category', () => {
    localStorage.removeItem(STORAGE_KEY);
    saveFormResult('trapassato', true);
    saveFormResult('trapassato', false);
    expect(loadFormStats().trapassato).toEqual({ attempts: 2, correct: 1 });
  });

  it('reads back an empty store when nothing is saved', () => {
    localStorage.removeItem(STORAGE_KEY);
    expect(loadFormStats()).toEqual({});
  });
});

describe('VERB_FORMS dataset', () => {
  it('ships a substantial, well-formed set', () => {
    expect(VERB_FORMS.length).toBeGreaterThan(60);
    for (const v of VERB_FORMS) {
      expect(v.form, JSON.stringify(v)).toBeTruthy();
      expect(v.inf, v.form).toMatch(/(are|ere|ire|rre)$/); // a real infinitive
      expect(v.en, v.form).toBeTruthy();
      expect(v.pp, v.form).toBeTruthy();   // the bridge to the taught tense
      expect(FORM_CATEGORIES[v.cat], `${v.form} → ${v.cat}`).toBeTruthy();
    }
  });

  it('every category is documented with a label, a gloss and a tip', () => {
    for (const [key, cat] of Object.entries(FORM_CATEGORIES)) {
      expect(cat.it, key).toBeTruthy();
      expect(cat.en, key).toBeTruthy();
      expect(cat.tip, key).toBeTruthy();
    }
  });

  it('covers every category with real items', () => {
    for (const key of Object.keys(FORM_CATEGORIES)) {
      expect(VERB_FORMS.filter((v) => v.cat === key).length, key).toBeGreaterThan(5);
    }
  });

  it('has no duplicate forms', () => {
    const forms = VERB_FORMS.map((v) => v.form);
    expect(forms.length).toBe(new Set(forms).size);
  });

  // The whole point of the drill: every item is answerable, and answering it
  // with its own infinitive is graded correct.
  it('every item is satisfied by its own infinitive', () => {
    const failures = VERB_FORMS
      .filter((v) => verdict(v, v.inf, VERB_FORMS) !== 'correct')
      .map((v) => `${v.form} → ${v.inf}`);
    expect(failures).toEqual([]);
  });

  it('trapassato items are two words: auxiliary + participle', () => {
    for (const v of VERB_FORMS.filter((x) => x.cat === 'trapassato')) {
      expect(v.form.split(/\s+/).length, v.form).toBe(2);
      expect(v.form, v.form).toMatch(/^(ero|eri|era|eravamo|eravate|erano|avevo|avevi|aveva|avevamo|avevate|avevano)\s/);
    }
  });

  it('categoryOf reads the category, and is nullish-safe', () => {
    expect(categoryOf(item('disse'))).toBe('remoto-forte');
    expect(categoryOf(null)).toBe('');
  });
});
