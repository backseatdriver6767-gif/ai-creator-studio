// Standard rebalancing allocators for portfolio backtests.
// All are pure (date, symbols, history) → weights.

export function equalWeight(symbols) {
  const w = 1 / symbols.length;
  return {
    name: `EqualWeight(${symbols.length})`,
    onBar: () => Object.fromEntries(symbols.map((s) => [s, w])),
  };
}

export function volTargeted({ targetVol = 0.10, lookback = 60 } = {}) {
  return {
    name: `VolTargeted(${targetVol})`,
    onBar({ symbols, history }) {
      if (history.length < lookback + 1) return Object.fromEntries(symbols.map((s) => [s, 0]));
      const recent = history.slice(-lookback - 1);
      const weights = {};
      let total = 0;
      for (const s of symbols) {
        const closes = recent.map((h) => h[s]?.close).filter(Boolean);
        const rets = [];
        for (let i = 1; i < closes.length; i++) rets.push(Math.log(closes[i] / closes[i - 1]));
        const m = rets.reduce((a, b) => a + b, 0) / rets.length;
        const sd = Math.sqrt(rets.reduce((a, b) => a + (b - m) ** 2, 0) / (rets.length - 1));
        const annVol = sd * Math.sqrt(252);
        const w = annVol > 0 ? targetVol / annVol / symbols.length : 0;
        weights[s] = w;
        total += w;
      }
      // Cap leverage at 1.0
      if (total > 1) {
        for (const s of symbols) weights[s] /= total;
      }
      return weights;
    },
  };
}

export function riskParity({ lookback = 60 } = {}) {
  return {
    name: `RiskParity(${lookback})`,
    onBar({ symbols, history }) {
      if (history.length < lookback + 1) return Object.fromEntries(symbols.map((s) => [s, 0]));
      const recent = history.slice(-lookback - 1);
      const invVols = {};
      let total = 0;
      for (const s of symbols) {
        const closes = recent.map((h) => h[s]?.close).filter(Boolean);
        const rets = [];
        for (let i = 1; i < closes.length; i++) rets.push(Math.log(closes[i] / closes[i - 1]));
        const m = rets.reduce((a, b) => a + b, 0) / rets.length;
        const sd = Math.sqrt(rets.reduce((a, b) => a + (b - m) ** 2, 0) / (rets.length - 1));
        const inv = sd > 0 ? 1 / sd : 0;
        invVols[s] = inv;
        total += inv;
      }
      const out = {};
      for (const s of symbols) out[s] = total > 0 ? invVols[s] / total : 0;
      return out;
    },
  };
}
