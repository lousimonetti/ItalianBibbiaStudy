// scripts/patch-sqljs.cjs
// Raises sql.js default TOTAL_MEMORY from 16 MB to 128 MB.
// Must run before generate-anki.cjs so the patch is in place before sql.js loads.

'use strict';

const fs = require('fs');
const path = require('path');

const TARGET = path.join(__dirname, '..', 'node_modules', 'sql.js', 'js', 'sql.js');

if (!fs.existsSync(TARGET)) {
  console.warn('patch-sqljs: sql.js not found, skipping patch.');
  process.exit(0);
}

const src = fs.readFileSync(TARGET, 'utf8');

const ORIGINAL = 'TOTAL_MEMORY=Module["TOTAL_MEMORY"]||16777216';
const PATCHED  = 'TOTAL_MEMORY=Module["TOTAL_MEMORY"]||134217728'; // 128 MB

if (src.includes(PATCHED)) {
  console.log('patch-sqljs: already patched (128 MB), skipping.');
  process.exit(0);
}

if (!src.includes(ORIGINAL)) {
  console.warn('patch-sqljs: expected pattern not found — sql.js may have changed. Skipping.');
  process.exit(0);
}

fs.writeFileSync(TARGET, src.replace(ORIGINAL, PATCHED));
console.log('patch-sqljs: sql.js TOTAL_MEMORY raised from 16 MB to 128 MB.');
