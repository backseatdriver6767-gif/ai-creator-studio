// Cross-sectional momentum allocator. Each rebalance, rank symbols by their
// trailing-(lookback skip last) return. Long the top decile, short the bottom
// decile (if shorting enabled), equal weight within each sleeve.
//
// The "skip" window implements the 1-month-skip convention from Jegadeesh &
// Titman to avoid the short-term reversal bias.

export function crossSectionalMomentum({ lookback = 252, skip = 21, longN = null, shortN = null, allowShort = false } = {}) {
  return {
    name: `XSecMom(L${lookback}/S${skip})`,
    onBar({ symbols, history }) {
      if (history.length < lookback + skip + 1) {
        return Object.fromEntries(symbols.map((s) => [s, 0]));
      }
      const scores = [];
      for (const s of symbols) {
        const closes = history.map((h) => h[s]?.close).filter(Boolean);
        if (closes.length < lookback + skip + 1) continue;
        const endIdx = closes.length - 1 - skip;
        const startIdx = endIdx - lookback;
        if (startIdx < 0) continue;
        const ret = closes[endIdx] / closes[startIdx] - 1;
        scores.push({ s, ret });
      }
      scores.sort((a, b) => b.ret - a.ret);
      const n = scores.length;
      const ln = longN ?? Math.max(1, Math.floor(n / 10));
      const sn = shortN ?? Math.max(1, Math.floor(n / 10));
      const longs = scores.slice(0, ln);
      const shorts = allowShort ? scores.slice(-sn) : [];
      const weights = Object.fromEntries(symbols.map((s) => [s, 0]));
      for (const { s } of longs) weights[s] = 0.5 / longs.length;
      for (const { s } of shorts) weights[s] = -0.5 / shorts.length;
      return weights;
    },
  };
}
