// Hurst exponent via rescaled-range (R/S) analysis.
//
// H < 0.5  → mean-reverting series (fade moves)
// H ≈ 0.5  → random walk (no exploitable structure at this scale)
// H > 0.5  → trending / persistent (ride moves)
//
// Practical use: before deploying a mean-reversion strategy on a pair's
// spread, measure H. If H ≈ 0.5 the "mean reversion" you think you see
// on a chart is almost certainly pattern-matching to a random walk.
//
// This is the classic Mandelbrot/Hurst R/S method, not DFA. It's quick,
// pure-JS, and good enough for the regime filter it's designed for.
// For publication-grade work, switch to DFA.

/**
 * @param {number[]} series — price level or log-price series
 * @returns {number} estimated Hurst exponent in [0, 1]
 */
export function hurstExponent(series) {
  if (!Array.isArray(series) || series.length < 100) {
    throw new Error("hurst: need at least 100 observations");
  }
  // Use log returns for a more numerically stable R/S
  const rets = [];
  for (let i = 1; i < series.length; i++) {
    if (series[i - 1] > 0 && series[i] > 0) {
      rets.push(Math.log(series[i] / series[i - 1]));
    }
  }
  const n = rets.length;
  const lags = [];
  // Window sizes: powers of 2 from 8 up to n/2
  for (let s = 8; s <= Math.floor(n / 2); s = Math.floor(s * 1.5)) lags.push(s);
  if (lags.length < 4) throw new Error("hurst: not enough data after lag selection");

  const xs = []; // log(lag)
  const ys = []; // log(R/S)
  for (const lag of lags) {
    const numWindows = Math.floor(n / lag);
    if (numWindows < 1) continue;
    let rsSum = 0;
    let ct = 0;
    for (let w = 0; w < numWindows; w++) {
      const slice = rets.slice(w * lag, (w + 1) * lag);
      const mean = slice.reduce((a, b) => a + b, 0) / lag;
      // Cumulative deviations
      let cum = 0;
      let maxCum = -Infinity;
      let minCum = Infinity;
      for (let i = 0; i < lag; i++) {
        cum += slice[i] - mean;
        if (cum > maxCum) maxCum = cum;
        if (cum < minCum) minCum = cum;
      }
      const range = maxCum - minCum;
      const variance = slice.reduce((s, x) => s + (x - mean) ** 2, 0) / lag;
      const stdev = Math.sqrt(variance);
      if (stdev > 0 && range > 0) {
        rsSum += range / stdev;
        ct++;
      }
    }
    if (ct > 0) {
      xs.push(Math.log(lag));
      ys.push(Math.log(rsSum / ct));
    }
  }
  if (xs.length < 4) throw new Error("hurst: insufficient valid lags");
  // Linear regression slope = Hurst
  const n2 = xs.length;
  const mx = xs.reduce((a, b) => a + b, 0) / n2;
  const my = ys.reduce((a, b) => a + b, 0) / n2;
  let num = 0, den = 0;
  for (let i = 0; i < n2; i++) {
    num += (xs[i] - mx) * (ys[i] - my);
    den += (xs[i] - mx) ** 2;
  }
  return den > 0 ? num / den : 0.5;
}

/**
 * Classify a Hurst estimate into a qualitative regime label with a
 * tolerance band. Default band ±0.05 around the random-walk threshold.
 */
export function classifyHurst(h, band = 0.05) {
  if (h < 0.5 - band) return "mean-reverting";
  if (h > 0.5 + band) return "trending";
  return "random-walk";
}
