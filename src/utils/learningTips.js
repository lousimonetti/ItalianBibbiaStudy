// Which tip is shown on a given day, and the set grouped for browsing. Pure.
import { TIPS, TIP_CATEGORIES } from '../data/learningTips';
import { rotatingPick } from './gameRandom';

// One tip per day, each dealt once before any repeats.
export function tipForDate(dateStr, tips = TIPS) {
  return rotatingPick(tips, dateStr, 'tip');
}

// [{ id, title, titleEn, tips }] in the authored order, empty categories left out.
export function tipsByCategory(tips = TIPS, categories = TIP_CATEGORIES) {
  return categories
    .map((c) => ({ ...c, tips: tips.filter((t) => t.cat === c.id) }))
    .filter((c) => c.tips.length);
}
