export function normalize(s) {
  return s.toLowerCase().trim().normalize('NFD').replace(/[̀-ͯ]/g, '');
}

export function levenshtein(a, b) {
  const m = a.length, n = b.length;
  const dp = [];
  for (let i = 0; i <= m; i++) {
    dp[i] = new Array(n + 1).fill(0);
    dp[i][0] = i;
  }
  for (let j = 0; j <= n; j++) dp[0][j] = j;
  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      dp[i][j] = a[i - 1] === b[j - 1]
        ? dp[i - 1][j - 1]
        : 1 + Math.min(dp[i - 1][j], dp[i][j - 1], dp[i - 1][j - 1]);
    }
  }
  return dp[m][n];
}

export function scorePronunciation(target, recognized) {
  const t = normalize(target);
  const r = normalize(recognized);
  const dist = levenshtein(t, r);
  return Math.round((1 - dist / Math.max(t.length, r.length, 1)) * 100);
}
