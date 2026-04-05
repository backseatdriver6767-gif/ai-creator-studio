// Kelly fraction given win probability p, average win W, average loss L (both positive).
// Also computes fractional-Kelly variants because full Kelly has devastating drawdowns.

export function kelly({ p, avgWin, avgLoss }) {
  if (avgLoss <= 0 || avgWin <= 0) return { full: 0, half: 0, quarter: 0, warning: "invalid inputs" };
  const b = avgWin / avgLoss;
  const q = 1 - p;
  const full = (b * p - q) / b;
  return {
    edge: round(b * p - q, 4),
    full: round(Math.max(0, full), 4),
    half: round(Math.max(0, full / 2), 4),
    quarter: round(Math.max(0, full / 4), 4),
    note: "Use no more than half-Kelly in practice. Full Kelly assumes you know p exactly.",
  };
}

export function kellyFromTrades(tradePnls) {
  const wins = tradePnls.filter((x) => x > 0);
  const losses = tradePnls.filter((x) => x < 0);
  if (!wins.length || !losses.length) return { full: 0, warning: "need both wins and losses" };
  const p = wins.length / tradePnls.length;
  const avgWin = wins.reduce((s, x) => s + x, 0) / wins.length;
  const avgLoss = -losses.reduce((s, x) => s + x, 0) / losses.length;
  return { p: round(p, 3), avgWin: round(avgWin, 2), avgLoss: round(avgLoss, 2), ...kelly({ p, avgWin, avgLoss }) };
}

function round(x, d) {
  const p = 10 ** d;
  return Math.round(x * p) / p;
}
