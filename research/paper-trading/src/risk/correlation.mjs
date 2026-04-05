// Pearson correlation matrix for a watchlist of aligned daily closes.
// Used to avoid stacking the same trade across correlated symbols.

export function correlationMatrix(series) {
  const symbols = Object.keys(series);
  const returns = {};
  for (const s of symbols) {
    const closes = series[s];
    const r = [];
    for (let i = 1; i < closes.length; i++) r.push(Math.log(closes[i] / closes[i - 1]));
    returns[s] = r;
  }
  const n = Math.min(...symbols.map((s) => returns[s].length));
  for (const s of symbols) returns[s] = returns[s].slice(-n);

  /** @type {Record<string, Record<string, number>>} */
  const matrix = {};
  for (const a of symbols) {
    matrix[a] = {};
    for (const b of symbols) {
      matrix[a][b] = round(pearson(returns[a], returns[b]), 3);
    }
  }
  return matrix;
}

export function highlyCorrelatedPairs(matrix, threshold = 0.85) {
  const symbols = Object.keys(matrix);
  const out = [];
  for (let i = 0; i < symbols.length; i++) {
    for (let j = i + 1; j < symbols.length; j++) {
      const c = matrix[symbols[i]][symbols[j]];
      if (Math.abs(c) >= threshold) out.push({ a: symbols[i], b: symbols[j], corr: c });
    }
  }
  return out;
}

function pearson(x, y) {
  const n = Math.min(x.length, y.length);
  if (n < 2) return 0;
  let mx = 0, my = 0;
  for (let i = 0; i < n; i++) { mx += x[i]; my += y[i]; }
  mx /= n; my /= n;
  let num = 0, dx = 0, dy = 0;
  for (let i = 0; i < n; i++) {
    const a = x[i] - mx, b = y[i] - my;
    num += a * b; dx += a * a; dy += b * b;
  }
  const den = Math.sqrt(dx * dy);
  return den > 0 ? num / den : 0;
}
function round(x, d) {
  const p = 10 ** d;
  return Math.round(x * p) / p;
}
