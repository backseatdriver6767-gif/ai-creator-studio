// VWAP mean-reversion: go long when close drops >k*sigma below session VWAP,
// exit when price returns to VWAP. Flat at session close.
import { sessionVwap } from "../indicators/vwap.mjs";

export function vwapReversion({ k = 1.5, window = 20 } = {}) {
  return {
    name: `VWAPRev(k=${k},w=${window})`,
    init: () => ({ idx: 0, vwap: [], recent: [] }),
    onBar(bar, state, history) {
      // Recompute VWAP incrementally via full history (cheap enough for daily use)
      state.vwap = sessionVwap(history);
      const i = history.length - 1;
      const v = state.vwap[i];
      state.recent.push(bar.close - v);
      if (state.recent.length > window) state.recent.shift();
      if (state.recent.length < window) return "FLAT";
      const mean = state.recent.reduce((s, x) => s + x, 0) / state.recent.length;
      const sd = Math.sqrt(
        state.recent.reduce((s, x) => s + (x - mean) ** 2, 0) / (state.recent.length - 1),
      );
      const z = sd > 0 ? (bar.close - v - mean) / sd : 0;

      // End-of-day flat-out: if next bar is a new day, exit.
      const nextDay = history[i + 1]?.date?.slice(0, 10);
      const today = bar.date.slice(0, 10);
      if (nextDay && nextDay !== today) return "FLAT";

      if (z < -k) return "LONG";
      if (z > 0) return "FLAT";
      return state.desired || "FLAT";
    },
  };
}
