// Opening-range breakout, adapted for daily bars:
// Long if today's close breaks above the highest close of the last N days
// (Donchian-style breakout). Exit when it drops back below the low-channel.
export function openingRangeBreakout({ lookback = 20, exitLookback = 10 } = {}) {
  return {
    name: `Donchian(${lookback}/${exitLookback})`,
    init: () => ({ closes: [], desired: "FLAT" }),
    onBar(bar, state) {
      state.closes.push(bar.close);
      if (state.closes.length <= lookback) return "FLAT";

      const window = state.closes.slice(-lookback - 1, -1);
      const hi = Math.max(...window);
      const exitWindow = state.closes.slice(-exitLookback - 1, -1);
      const lo = Math.min(...exitWindow);

      if (bar.close > hi) state.desired = "LONG";
      else if (bar.close < lo) state.desired = "FLAT";
      return state.desired;
    },
  };
}
