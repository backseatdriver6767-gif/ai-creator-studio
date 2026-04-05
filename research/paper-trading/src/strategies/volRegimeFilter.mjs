// Volatility regime filter: wraps any strategy and forces FLAT when realized
// volatility is above (or below) a threshold. Used to gate strategies into
// only the regimes they were designed for.

export function withVolRegimeFilter(inner, { lookback = 20, maxAnnVol = 0.40, minAnnVol = 0 } = {}) {
  return {
    name: `${inner.name}+volFilter(${minAnnVol}-${maxAnnVol})`,
    init: () => ({ inner: inner.init ? inner.init() : {}, closes: [] }),
    onBar(bar, state, history) {
      state.closes.push(bar.close);
      if (state.closes.length > lookback + 1) state.closes.shift();
      const ret = [];
      for (let i = 1; i < state.closes.length; i++) {
        ret.push(Math.log(state.closes[i] / state.closes[i - 1]));
      }
      if (ret.length < lookback) return "FLAT";
      const mean = ret.reduce((s, x) => s + x, 0) / ret.length;
      const variance = ret.reduce((s, x) => s + (x - mean) ** 2, 0) / (ret.length - 1);
      const annVol = Math.sqrt(variance * 252);
      const inRegime = annVol >= minAnnVol && annVol <= maxAnnVol;
      const innerSignal = inner.onBar(bar, state.inner, history);
      return inRegime ? innerSignal : "FLAT";
    },
  };
}
