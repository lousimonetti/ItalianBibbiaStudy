const SYMBOLS = [
  {
    sym: 'ˈ',
    name: 'Stress mark',
    sounds: 'The next syllable is stressed',
    example: 'ˈpaːne',
    hint: 'pane — PAH-neh',
  },
  {
    sym: 'ː',
    name: 'Long vowel',
    sounds: 'Hold the vowel a moment longer',
    example: 'ˈviːta',
    hint: 'vita — VEEEE-tah',
  },
  {
    sym: 'ɛ',
    name: 'Open e',
    sounds: 'Like the e in "bed" or "get"',
    example: 'la ˈfɛːde',
    hint: 'fede (faith)',
  },
  {
    sym: 'ɔ',
    name: 'Open o',
    sounds: 'Like the o in "off" or "hot"',
    example: 'il ˈmɔndo',
    hint: 'mondo (world)',
  },
  {
    sym: 'ɾ',
    name: 'Italian r',
    sounds: 'A quick tongue-tap — like the tt in American "butter"',
    example: 'adoˈɾaːɾe',
    hint: 'adorare (to worship)',
  },
  {
    sym: 'tʃ',
    name: 'ch sound',
    sounds: 'Like "ch" in "church" — Italian ci / ce',
    example: 'la ˈluːtʃe',
    hint: 'luce (light)',
  },
  {
    sym: 'dʒ',
    name: 'j sound',
    sounds: 'Like "j" in "jump" — Italian gi / ge',
    example: 'il ˈdʒuːditʃe',
    hint: 'giudice (judge)',
  },
  {
    sym: 'ʃ',
    name: 'sh sound',
    sounds: 'Like "sh" in "shop" — Italian sc before e / i',
    example: 'la ˈkɾoːtʃe',
    hint: 'also: uscire (to go out)',
  },
  {
    sym: 'ɲ',
    name: 'gn sound',
    sounds: 'Like "ny" in "canyon" — Italian gn',
    example: 'il ˈseɲɲo',
    hint: 'segno (sign)',
  },
  {
    sym: 'ʎ',
    name: 'gl sound',
    sounds: 'Like "ll" in "million" — Italian gli',
    example: 'il ˈfiʎʎo',
    hint: 'figlio (son)',
  },
  {
    sym: 'ŋ',
    name: 'ng sound',
    sounds: 'Like "ng" in "sing" — before hard g or k',
    example: 'il baŋˈkɛtto',
    hint: 'banchetto (banquet)',
  },
  {
    sym: 'ts',
    name: 'ts sound',
    sounds: 'Like "ts" in "bits" — one Italian z spelling',
    example: 'la ˈɡɾattsja',
    hint: 'grazia (grace)',
  },
  {
    sym: 'dz',
    name: 'dz sound',
    sounds: 'Like "ds" in "reads" — another Italian z spelling',
    example: 'il batˈtɛːzimo',
    hint: 'battesimo (baptism)',
  },
  {
    sym: 'ˌ',
    name: 'Secondary stress',
    sounds: 'A lighter accent — used in longer words',
    example: 'il ˌbwɔn pasˈtoːɾe',
    hint: 'buon pastore (good shepherd)',
  },
];

export function IPAGuide({ compact = false }) {
  if (compact) {
    return (
      <div className="ipa-guide-compact">
        <div className="ipa-guide-compact-title">Pronunciation key</div>
        <div className="ipa-symbol-grid">
          {SYMBOLS.map(({ sym, name, sounds }) => (
            <div key={sym} className="ipa-symbol-row">
              <span className="ipa-sym">{sym}</span>
              <span className="ipa-sym-name">{name}</span>
              <span className="ipa-sym-sounds">{sounds}</span>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="ipa-guide">
      <p className="ipa-guide-intro">
        These are the symbols you'll see in pronunciations throughout the app.
        Each one maps to a sound you already know from English — or a simple Italian example.
      </p>
      <div className="ipa-card-grid">
        {SYMBOLS.map(({ sym, name, sounds, example, hint }) => (
          <div key={sym} className="ipa-card">
            <div className="ipa-card-top">
              <span className="ipa-badge">{sym}</span>
              <span className="ipa-card-name">{name}</span>
            </div>
            <div className="ipa-card-sounds">{sounds}</div>
            <div className="ipa-card-example">
              <span className="ipa-card-ex-sym">{example}</span>
              <span className="ipa-card-ex-hint"> — {hint}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
