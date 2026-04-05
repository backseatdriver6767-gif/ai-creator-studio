// Pairs trading via simple spread z-score. NOT a backtest engine strategy;
// instead a standalone analyzer you point at two aligned price series.
// Use to screen for potential pairs, not as a live signal.

export function spreadZ(a, b, window = 30) {
  if (a.length !== b.length) throw new Error("series length mismatch");
  const logRatio = a.map((_, i) => Math.log(a[i] / b[i]));
  const z = new Array(logRatio.length).fill(null);
  for (let i = window; i < logRatio.length; i++) {
    const w = logRatio.slice(i - window, i);
    const m = w.reduce((s, x) => s + x, 0) / w.length;
    const sd = Math.sqrt(w.reduce((s, x) => s + (x - m) ** 2, 0) / (w.length - 1));
    z[i] = sd > 0 ? (logRatio[i] - m) / sd : 0;
  }
  return { logRatio, z };
}

/** Rough Engle-Granger style cointegration check on log-prices via OLS residuals. */
export function cointegrationScore(a, b) {
  const n = a.length;
  const la = a.map(Math.log), lb = b.map(Math.log);
  const meanA = la.reduce((s, x) => s + x, 0) / n;
  const meanB = lb.reduce((s, x) => s + x, 0) / n;
  let num = 0, den = 0;
  for (let i = 0; i < n; i++) {
    num += (la[i] - meanA) * (lb[i] - meanB);
    den += (lb[i] - meanB) ** 2;
  }
  const beta = num / den;
  const alpha = meanA - beta * meanB;
  const resid = la.map((x, i) => x - (alpha + beta * lb[i]));
  // Variance ratio style stationarity proxy: ratio of rolling variances.
  const half = Math.floor(resid.length / 2);
  const v1 = variance(resid.slice(0, half));
  const v2 = variance(resid.slice(half));
  const ratio = v2 > 0 ? v1 / v2 : 0;
  return { beta, alpha, residStd: Math.sqrt(variance(resid)), stationarityProxy: ratio };
}
function variance(xs) {
  if (xs.length < 2) return 0;
  const m = xs.reduce((s, x) => s + x, 0) / xs.length;
  return xs.reduce((s, x) => s + (x - m) ** 2, 0) / (xs.length - 1);
}
