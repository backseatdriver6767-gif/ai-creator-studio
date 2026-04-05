// Regime-conditional performance breakdown.
// Given an equity curve aligned with bars, partition by a regime label
// (e.g. "bull"/"bear"/"chop") and report per-regime metrics.

export function labelRegimes(bars, { smaWindow = 200 } = {}) {
  const labels = new Array(bars.length).fill("warmup");
  const closes = bars.map((b) => b.close);
  for (let i = smaWindow; i < bars.length; i++) {
    const sma = avg(closes.slice(i - smaWindow, i));
    const prevSma = avg(closes.slice(i - smaWindow - 1, i - 1));
    const trending = Math.abs(sma - prevSma) / prevSma > 0.0005;
    if (closes[i] > sma && trending) labels[i] = "bull";
    else if (closes[i] < sma && trending) labels[i] = "bear";
    else labels[i] = "chop";
  }
  return labels;
}

export function regimeBreakdown(equityCurve, labels) {
  const buckets = { bull: [], bear: [], chop: [] };
  for (let i = 1; i < equityCurve.length; i++) {
    const prev = equityCurve[i - 1].equity;
    const cur = equityCurve[i].equity;
    const r = prev > 0 ? (cur - prev) / prev : 0;
    const lab = labels[i];
    if (buckets[lab]) buckets[lab].push(r);
  }
  const out = {};
  for (const [k, v] of Object.entries(buckets)) {
    if (!v.length) { out[k] = null; continue; }
    const m = v.reduce((s, x) => s + x, 0) / v.length;
    const sd = Math.sqrt(v.reduce((s, x) => s + (x - m) ** 2, 0) / Math.max(v.length - 1, 1));
    out[k] = {
      bars: v.length,
      annualReturnPct: round(m * 252 * 100, 2),
      annualVolPct: round(sd * Math.sqrt(252) * 100, 2),
      sharpe: sd > 0 ? round((m / sd) * Math.sqrt(252), 2) : 0,
    };
  }
  return out;
}

function avg(xs) {
  return xs.reduce((s, x) => s + x, 0) / xs.length;
}
function round(x, d) {
  const p = 10 ** d;
  return Math.round(x * p) / p;
}
