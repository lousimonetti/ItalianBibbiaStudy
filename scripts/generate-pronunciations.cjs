// scripts/generate-pronunciations.cjs
// Calls the Anthropic API to generate IPA pronunciations for all vocab
// Run: node scripts/generate-pronunciations.cjs
// Outputs: scripts/pronunciations.json

'use strict';

const https = require('https');
const fs = require('fs');
const path = require('path');

// All vocabulary items — Italian terms only
const ALL_VOCAB = [
  // Week 1
  'il Verbo', 'la luce', 'le tenebre', 'la vita', 'credere', 'il miracolo', 'il mondo',
  // Week 2
  'nascere', 'lo Spirito', 'il pozzo', 'adorare', 'il Salvatore', 'il dono',
  // Week 3
  'guarire', 'il pane', 'la folla', 'saziarsi', 'la vita eterna', 'la manna', 'il segno',
  // Week 4
  'insegnare', 'la verità', 'liberare', 'giudicare', 'il peccato', 'scrivere', 'luce del mondo',
  // Week 5
  'il cieco', 'vedere', 'il buon pastore', 'la pecora', 'la tomba', 'risuscitare', 'piangere',
  // Week 6
  "l'unzione", "l'asino", 'lavare i piedi', 'il tradimento', 'la casa del Padre', 'il Paraclito', 'la via',
  // Week 7
  'la vite', 'il tralcio', 'portare frutto', 'il comandamento', 'rimanere', 'la preghiera',
  // Week 8
  "l'arresto", 'il rinnegamento', 'la crocifissione', 'il sepolcro vuoto', 'la resurrezione', 'la missione', 'la pace',
  // Week 9
  "l'annuncio", "l'angelo", 'benedetto', 'la nascita', 'la mangiatoia', 'i pastori', 'il Magnificat',
  // Week 10
  'il battesimo', 'il deserto', 'la tentazione', 'la rete', 'il lebbroso', 'perdonare', 'camminare',
  // Week 11
  'le beatitudini', 'il nemico', 'il centurione', 'la vedova', 'il fariseo',
  // Week 12
  'la tempesta', 'i demoni', 'la fede', 'la trasfigurazione', 'la croce', 'le provviste',
  // Week 13
  'il samaritano', 'il prossimo', "l'olio", 'pregare', 'il Padre Nostro', 'chiedere', 'il demonio',
  // Week 14
  'la ricchezza', 'il granaio', 'preoccuparsi', 'il fico', 'la porta stretta', "l'ipocrita", 'il regno di Dio',
  // Week 15
  'il banchetto', "l'invitato", 'la pecora perduta', 'il figlio prodigo', 'il padre misericordioso', 'abbracciare', 'la festa',
  // Week 16
  'la gratitudine', "l'umiltà", 'il giudice', 'il pubblicano', 'i bambini',
  // Week 17
  'Zaccheo', 'la salvezza', 'il tempio', 'la moneta', 'vigilare', 'la distruzione',
  // Week 18
  "l'ultima cena", 'il calice', 'la passione', 'Emmaus', "l'ascensione", 'la benedizione',
  // Week 19
  'la Pentecoste', 'lo Spirito Santo', 'le lingue di fuoco', 'battezzarsi', 'la comunità',
  // Week 20
  'la guarigione', 'la prigione', 'Anania', 'mentire', 'i diaconi', 'Stefano', 'la persecuzione',
  // Week 21
  'il martirio', 'la lapidazione', 'Saulo', 'la conversione', 'la via di Damasco', 'cieco',
  // Week 22
  'la visione', 'Cornelio', 'i pagani', 'il carcere', 'Erode',
  // Week 23
  'il viaggio missionario', 'Barnaba', 'la sinagoga', 'il concilio', 'la circoncisione', 'annunciare',
  // Week 24
  'Lidia', 'il terremoto', "l'Areopago", 'il missionario',
  // Week 25
  'la magia', 'il tumulto', "l'argentiere", 'la profezia', 'legare', 'il viaggio', 'lo Spirito',
  // Week 26
  'la difesa', 'il sinedrio', 'la congiura', 'il governatore', 'il processo', 'il testimone', "l'accusa",
  // Week 27
  'Festo', 'Agrippa', "l'appello", 'la testimonianza', 'convertirsi',
  // Week 28
  'il naufragio', "l'isola", 'il serpente', 'Roma', 'predicare', "l'impedimento", 'la nave',
  // Week 29
  'il vangelo', 'la giustizia', 'il giudizio', "l'ira", "l'idolatria", "l'albero", 'il cammino',
  // Week 30
  'la redenzione', 'il pastore', "l'abbondanza", 'la tenebrosa valle',
  // Week 31
  'la sofferenza', 'la speranza', 'il rifugio', 'la forza', 'la morte',
  // Week 32
  'la carne', 'la condanna', 'la figliolanza', 'la creazione', 'la misericordia', 'il cuore',
  // Week 33
  "l'elezione", 'confessare', 'credere nel cuore', 'la protezione', 'il nome del Signore', 'essere salvato', 'il messaggero',
  // Week 34
  'il mistero', 'il corpo di Cristo', 'i doni', 'la Parola', 'il sentiero', 'offrire', 'rinnovarsi',
  // Week 35
  "l'autorità", 'amare il prossimo', 'la coscienza', 'il soccorso', 'vegliare', 'il custode',
  // Week 36
  "l'unità", 'i saluti', 'conoscere', 'tessere', 'fuggire', 'meraviglioso',
  // Week 37
  'lodare', "l'alleluja", 'gli strumenti', 'tutta la creazione', 'la gloria', 'il Natale', 'la fine',
];

// Deduplicate
const unique = [...new Set(ALL_VOCAB)];
console.log(`Generating pronunciations for ${unique.length} unique terms...`);

function callAPI(terms) {
  return new Promise((resolve, reject) => {
    const prompt = `You are an Italian phonetics expert. For each Italian word or phrase below, provide the IPA pronunciation using standard Italian phonology.

Rules:
- Use IPA symbols, mark primary stress with ˈ before the stressed syllable
- For phrases, include word boundaries with a space
- Include the definite article as part of the pronunciation where present
- Return ONLY valid JSON: an object mapping each term to its IPA string
- No markdown, no explanation, just the JSON object

Terms:
${terms.join('\n')}`;

    const body = JSON.stringify({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 4000,
      messages: [{ role: 'user', content: prompt }],
    });

    const options = {
      hostname: 'api.anthropic.com',
      path: '/v1/messages',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'anthropic-version': '2023-06-01',
        'Content-Length': Buffer.byteLength(body),
      },
    };

    const req = https.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => { data += chunk; });
      res.on('end', () => {
        try {
          const parsed = JSON.parse(data);
          const text = parsed.content?.[0]?.text ?? '';
          const clean = text.replace(/```json|```/g, '').trim();
          resolve(JSON.parse(clean));
        } catch (e) {
          reject(new Error(`Parse error: ${e.message}\nRaw: ${data.slice(0, 300)}`));
        }
      });
    });

    req.on('error', reject);
    req.write(body);
    req.end();
  });
}

async function main() {
  // Process in batches of 40 to stay well within token limits
  const BATCH = 40;
  const result = {};

  for (let i = 0; i < unique.length; i += BATCH) {
    const batch = unique.slice(i, i + BATCH);
    console.log(`  Batch ${Math.floor(i / BATCH) + 1}: ${batch.length} terms...`);
    const pronunciations = await callAPI(batch);
    Object.assign(result, pronunciations);
    // Small pause between batches
    if (i + BATCH < unique.length) {
      await new Promise(r => setTimeout(r, 500));
    }
  }

  const outPath = path.join(__dirname, 'pronunciations.json');
  fs.writeFileSync(outPath, JSON.stringify(result, null, 2));
  console.log(`\nWrote ${Object.keys(result).length} pronunciations to scripts/pronunciations.json`);
}

main().catch((err) => {
  console.error('Error:', err.message);
  process.exit(1);
});
