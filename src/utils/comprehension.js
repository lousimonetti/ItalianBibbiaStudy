// Reading-comprehension check helpers (O5). Two item shapes, both grounded in the
// week's reading + vetted example sentences:
//   true/false:      { type: 'tf', it, en, answer: true|false, explain? }
//   multiple choice: { type: 'mc', it, en, options: [...], answer: <index>, explain? }
// `it` is the Italian question/statement; `en` is an English gloss (the
// comprehensibility guard). Pure validation only — UI handles selection state.

export function comprehensionItems(week) {
  if (!Array.isArray(week?.comprehension)) return [];
  return week.comprehension.filter(isValidItem);
}

export function isValidItem(item) {
  if (!item || typeof item.it !== 'string' || !item.it.trim()) return false;
  if (item.type === 'tf') return typeof item.answer === 'boolean';
  if (item.type === 'mc') {
    return (
      Array.isArray(item.options) &&
      item.options.length >= 2 &&
      Number.isInteger(item.answer) &&
      item.answer >= 0 &&
      item.answer < item.options.length
    );
  }
  return false;
}

// Is the learner's response correct? `response` is a boolean for tf, an option
// index for mc.
export function isCorrect(item, response) {
  if (!isValidItem(item)) return false;
  if (item.type === 'tf') return response === item.answer;
  if (item.type === 'mc') return response === item.answer;
  return false;
}
