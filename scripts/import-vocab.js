// Convert a vocab spreadsheet (CSV) into ready-to-paste content.js vocab.
//   npm run import-vocab -- path/to/vocab.csv
// Expected header (case-insensitive): week,target,native,example,ipa
//   - `ipa` is optional; rows are grouped by `week`.
// Prints a `{ [weekN]: [[target, native, example, ipa?], ...] }` JS object you
// paste into the matching weeks in course/content.js. Authors can keep vocab in
// Google Sheets / Excel and export CSV.
import { readFileSync } from 'node:fs';

const file = process.argv[2];
if (!file) {
  console.error('Usage: npm run import-vocab -- <vocab.csv>   (columns: week,target,native,example,ipa)');
  process.exit(1);
}

// Minimal RFC-4180-ish CSV parser (handles quoted fields, commas, escaped "").
function parseCSV(text) {
  const rows = [];
  let row = [];
  let field = '';
  let inQuotes = false;
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (inQuotes) {
      if (c === '"') {
        if (text[i + 1] === '"') { field += '"'; i++; }
        else inQuotes = false;
      } else field += c;
    } else if (c === '"') inQuotes = true;
    else if (c === ',') { row.push(field); field = ''; }
    else if (c === '\n' || c === '\r') {
      if (c === '\r' && text[i + 1] === '\n') i++;
      row.push(field); field = '';
      if (row.some((x) => x !== '')) rows.push(row);
      row = [];
    } else field += c;
  }
  if (field !== '' || row.length) { row.push(field); if (row.some((x) => x !== '')) rows.push(row); }
  return rows;
}

const rows = parseCSV(readFileSync(file, 'utf8'));
if (!rows.length) { console.error('Empty CSV.'); process.exit(1); }

const header = rows[0].map((h) => h.trim().toLowerCase());
const col = (name) => header.indexOf(name);
const wi = col('week'); const ti = col('target'); const ni = col('native');
const ei = col('example'); const ii = col('ipa');
if (wi < 0 || ti < 0 || ni < 0 || ei < 0) {
  console.error('CSV must have columns: week,target,native,example[,ipa]');
  process.exit(1);
}

const byWeek = {};
for (const r of rows.slice(1)) {
  const week = Number(r[wi]);
  if (!Number.isInteger(week)) continue;
  const tuple = [r[ti] ?? '', r[ni] ?? '', r[ei] ?? ''];
  if (ii >= 0 && (r[ii] ?? '').trim()) tuple.push(r[ii].trim());
  (byWeek[week] ??= []).push(tuple);
}

const weeks = Object.keys(byWeek).map(Number).sort((a, b) => a - b);
console.log('// Paste each week\'s array into the matching week.vocab in course/content.js');
console.log('{');
for (const w of weeks) {
  const tuples = byWeek[w].map((t) => JSON.stringify(t)).join(', ');
  console.log(`  ${w}: [${tuples}],`);
}
console.log('}');
console.error(`\n(parsed ${weeks.length} weeks, ${weeks.reduce((s, w) => s + byWeek[w].length, 0)} vocab rows)`);
