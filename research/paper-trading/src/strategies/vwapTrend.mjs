// VWAP trend-following: long only when price is above session VWAP AND
// VWAP slope is positive over the last N bars. Exits at session close or
// when price closes below VWAP.
import { sessionVwap } from "../indicators/vwap.mjs";

export function vwapTrend({ slopeWindow = 10 } = {}) {
  return {
    name: `VWAPTrend(slope=${slopeWindow})`,
    init: () => ({}),
    onBar(bar, state, history) {
      const v = sessionVwap(history);
      const i = v.length - 1;
      if (i < slopeWindow) return "FLAT";
      const slope = v[i] - v[i - slopeWindow];
      const nextDay = history[i + 1]?.date?.slice(0, 10);
      const today = bar.date.slice(0, 10);
      if (nextDay && nextDay !== today) return "FLAT";
      if (bar.close > v[i] && slope > 0) return "LONG";
      return "FLAT";
    },
  };
}
