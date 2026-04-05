// Monte Carlo bootstrap on a trade-return sequence.
// Resample with replacement, reconstruct equity curve, compute Sharpe + max
// drawdown distribution. Gives you an honest confidence interval instead of
// a single fragile point estimate.
//
// Annualization: trade returns are NOT daily returns. A strategy that makes
// 38 trades in 10 years should not be annualized by √252. Pass the actual
// span in years (or raw tradesPerYear) so the Sharpe scales correctly. If
// neither is provided, the per-trade (unscaled) Sharpe is returned and the
// caller is expected to know what that means.

export function bootstrapTradeSeries(
  tradeReturns,
  { iters = 2000, seed = 42, yearsSpanned = null, tradesPerYear = null } = {},
) {
  if (!tradeReturns.length) return { samples: 0 };
  const rng = mulberry32(seed);
  const sharpes = [];
  const maxDDs = [];
  const finalRets = [];

  // Compute an honest annualization factor. If we know how many years the
  // trades spanned, convert. Otherwise accept an explicit tradesPerYear.
  // Fall back to 1 (per-trade Sharpe, unscaled) if neither is supplied.
  let annFactor = 1;
  if (tradesPerYear && tradesPerYear > 0) {
    annFactor = Math.sqrt(tradesPerYear);
  } else if (yearsSpanned && yearsSpanned > 0) {
    annFactor = Math.sqrt(tradeReturns.length / yearsSpanned);
  }

  for (let it = 0; it < iters; it++) {
    let equity = 1;
    let peak = 1;
    let maxDD = 0;
    const rs = [];
    for (let i = 0; i < tradeReturns.length; i++) {
      const r = tradeReturns[Math.floor(rng() * tradeReturns.length)];
      rs.push(r);
      equity *= 1 + r;
      if (equity > peak) peak = equity;
      const dd = (equity - peak) / peak;
      if (dd < maxDD) maxDD = dd;
    }
    const mean = rs.reduce((s, x) => s + x, 0) / rs.length;
    const sd = Math.sqrt(rs.reduce((s, x) => s + (x - mean) ** 2, 0) / (rs.length - 1));
    sharpes.push(sd > 0 ? (mean / sd) * annFactor : 0);
    maxDDs.push(maxDD);
    finalRets.push(equity - 1);
  }

  return {
    samples: iters,
    sharpe: quantiles(sharpes),
    maxDrawdown: quantiles(maxDDs),
    totalReturn: quantiles(finalRets),
  };
}

function quantiles(xs) {
  const s = [...xs].sort((a, b) => a - b);
  const q = (p) => s[Math.min(s.length - 1, Math.max(0, Math.floor(p * s.length)))];
  return {
    p05: round(q(0.05), 4),
    p50: round(q(0.5), 4),
    p95: round(q(0.95), 4),
    mean: round(xs.reduce((a, b) => a + b, 0) / xs.length, 4),
  };
}
function round(x, d) {
  const p = 10 ** d;
  return Math.round(x * p) / p;
}
function mulberry32(a) {
  return function () {
    let t = (a += 0x6d2b79f5);
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
