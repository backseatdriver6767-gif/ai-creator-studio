// VWAP mean-reversion: go long when close drops >k*sigma below session VWAP,
// exit when price returns to VWAP. Flat at session close.
//
// Maintains session VWAP incrementally (O(1) per bar) instead of recomputing
// from full history each call. Resets cumPV/cumV at day boundaries.

export function vwapReversion({ k = 1.5, window = 20 } = {}) {
  return {
    name: `VWAPRev(k=${k},w=${window})`,
    init: () => ({ day: null, cumPV: 0, cumV: 0, recent: [], desired: "FLAT" }),
    onBar(bar, state) {
      const day = bar.date.slice(0, 10);
      if (day !== state.day) {
        state.day = day;
        state.cumPV = 0;
        state.cumV = 0;
        state.desired = "FLAT"; // no overnight carry
      }
      const typ = (bar.high + bar.low + bar.close) / 3;
      const vol = bar.volume || 1;
      state.cumPV += typ * vol;
      state.cumV += vol;
      const vwap = state.cumV > 0 ? state.cumPV / state.cumV : bar.close;

      state.recent.push(bar.close - vwap);
      if (state.recent.length > window) state.recent.shift();
      if (state.recent.length < window) return state.desired;

      const m = state.recent.reduce((s, x) => s + x, 0) / state.recent.length;
      const sd = Math.sqrt(
        state.recent.reduce((s, x) => s + (x - m) ** 2, 0) / (state.recent.length - 1),
      );
      const z = sd > 0 ? (bar.close - vwap - m) / sd : 0;

      if (z < -k) state.desired = "LONG";
      else if (z > 0) state.desired = "FLAT";
      return state.desired;
    },
  };
}
