// White's Reality Check + Hansen's SPA test (simplified stationary bootstrap).
// Given a matrix of strategy daily excess returns vs benchmark, tests
// H0: "the best strategy is no better than the benchmark" across k strategies,
// correcting for the multiple-testing advantage of picking the best.
//
// Reference: White (2000), Hansen (2005). This is a pragmatic implementation,
// not a faithful reproduction of the full academic procedure.

export function realityCheck(excessReturnsMatrix, { B = 1000, blockSize = 10, seed = 7 } = {}) {
  const k = excessReturnsMatrix.length;
  if (!k) return { pValue: null, warning: "no strategies" };
  const T = excessReturnsMatrix[0].length;
  if (T < 30) return { pValue: null, warning: "too few observations" };

  const means = excessReturnsMatrix.map((xs) => xs.reduce((s, x) => s + x, 0) / T);
  const testStat = Math.sqrt(T) * Math.max(...means);

  const rng = mulberry32(seed);
  const bootStats = [];
  for (let b = 0; b < B; b++) {
    // Stationary bootstrap: pick start index, copy a geometric-length block.
    const resampled = Array(k).fill(null).map(() => new Array(T));
    let t = 0;
    while (t < T) {
      const start = Math.floor(rng() * T);
      const blen = 1 + Math.floor(-Math.log(1 - rng()) * blockSize);
      for (let j = 0; j < blen && t < T; j++, t++) {
        for (let i = 0; i < k; i++) {
          resampled[i][t] = excessReturnsMatrix[i][(start + j) % T];
        }
      }
    }
    const bMeans = resampled.map((xs, i) => {
      const m = xs.reduce((s, x) => s + x, 0) / T;
      return Math.sqrt(T) * (m - means[i]);
    });
    bootStats.push(Math.max(...bMeans));
  }
  const pValue = bootStats.filter((s) => s >= testStat).length / B;
  return {
    strategies: k,
    observations: T,
    bestMean: round(Math.max(...means), 6),
    testStat: round(testStat, 4),
    pValue: round(pValue, 4),
    interpretation:
      pValue < 0.05
        ? "best strategy is statistically distinguishable from benchmark after multiple-testing correction"
        : "best strategy not statistically distinguishable after correction",
  };
}

function mulberry32(a) {
  return function () {
    let t = (a += 0x6d2b79f5);
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
function round(x, d) { const p = 10 ** d; return Math.round(x * p) / p; }
