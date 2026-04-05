// Low-volatility anomaly: long the lowest-volatility decile of a universe,
// rebalance monthly. Historically (Haugen, Baker) this has delivered higher
// risk-adjusted returns than cap-weighted indices — likely a risk/leverage
// constraint effect rather than a true anomaly.

export function lowVolAnomaly({ lookback = 252, topN = null } = {}) {
  return {
    name: `LowVol(L${lookback})`,
    onBar({ symbols, history }) {
      if (history.length < lookback + 1) return Object.fromEntries(symbols.map((s) => [s, 0]));
      const recent = history.slice(-lookback - 1);
      const vols = [];
      for (const s of symbols) {
        const closes = recent.map((h) => h[s]?.close).filter(Boolean);
        if (closes.length < lookback) continue;
        const rets = [];
        for (let i = 1; i < closes.length; i++) rets.push(Math.log(closes[i] / closes[i - 1]));
        const m = rets.reduce((a, b) => a + b, 0) / rets.length;
        const sd = Math.sqrt(rets.reduce((a, b) => a + (b - m) ** 2, 0) / (rets.length - 1));
        vols.push({ s, sd });
      }
      vols.sort((a, b) => a.sd - b.sd);
      const n = topN ?? Math.max(1, Math.floor(vols.length / 3));
      const keep = vols.slice(0, n);
      const out = Object.fromEntries(symbols.map((s) => [s, 0]));
      for (const { s } of keep) out[s] = 1 / keep.length;
      return out;
    },
  };
}
