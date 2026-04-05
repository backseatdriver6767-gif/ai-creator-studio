// VWAP trend-following: long only when price is above session VWAP AND
// VWAP slope is positive over the last N bars. Exits at session close or
// when price closes below VWAP.
//
// Maintains session VWAP incrementally and a rolling buffer of vwap values
// for the slope window. Resets at day boundary.

export function vwapTrend({ slopeWindow = 10 } = {}) {
  return {
    name: `VWAPTrend(slope=${slopeWindow})`,
    init: () => ({ day: null, cumPV: 0, cumV: 0, vwapBuf: [] }),
    onBar(bar, state) {
      const day = bar.date.slice(0, 10);
      if (day !== state.day) {
        state.day = day;
        state.cumPV = 0;
        state.cumV = 0;
        state.vwapBuf = [];
      }
      const typ = (bar.high + bar.low + bar.close) / 3;
      const vol = bar.volume || 1;
      state.cumPV += typ * vol;
      state.cumV += vol;
      const vwap = state.cumV > 0 ? state.cumPV / state.cumV : bar.close;
      state.vwapBuf.push(vwap);
      if (state.vwapBuf.length > slopeWindow + 1) state.vwapBuf.shift();

      if (state.vwapBuf.length <= slopeWindow) return "FLAT";
      const slope = state.vwapBuf[state.vwapBuf.length - 1] - state.vwapBuf[0];
      if (bar.close > vwap && slope > 0) return "LONG";
      return "FLAT";
    },
  };
}
