// True intraday Opening Range Breakout.
// - Defines the opening range as the high/low of the first `orMinutes` of the session.
// - Goes long if price breaks above OR high; flat at session close or on OR-low break.
//
// Requires intraday bars (1m/5m). All session-awareness is done by ISO date prefix.

export function openingRangeBreakoutIntraday({ orBars = 6, barMinutes = 5 } = {}) {
  return {
    name: `ORB(${orBars}x${barMinutes}m)`,
    init: () => ({ day: null, orHigh: null, orLow: null, barsInDay: 0, desired: "FLAT" }),
    onBar(bar, state) {
      const day = bar.date.slice(0, 10);
      if (day !== state.day) {
        state.day = day;
        state.orHigh = bar.high;
        state.orLow = bar.low;
        state.barsInDay = 1;
        state.desired = "FLAT";
        return "FLAT";
      }
      state.barsInDay += 1;
      if (state.barsInDay <= orBars) {
        if (bar.high > state.orHigh) state.orHigh = bar.high;
        if (bar.low < state.orLow) state.orLow = bar.low;
        return "FLAT";
      }
      if (bar.close > state.orHigh) state.desired = "LONG";
      else if (bar.close < state.orLow) state.desired = "FLAT";
      return state.desired;
    },
  };
}
