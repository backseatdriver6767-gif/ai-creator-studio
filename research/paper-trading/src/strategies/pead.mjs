// Post-Earnings Announcement Drift (PEAD).
//
// Classic finding: after a large positive earnings surprise, the stock
// tends to drift up for ~60 days; negative surprises drift down. Magnitude
// of the drift has shrunk post-2005 but still detectable on wide universes.
//
// We don't have a free earnings surprise feed. This module defines the
// strategy interface and accepts an external `earningsEvents` table:
//    [{ symbol, date, surprisePct }]
//
// Plug in any source (Zacks, StockAnalysis.com scraping, your broker's
// research API, etc.) — the executor itself is clean.

export function pead({ earningsEvents = [], driftWindow = 60, surpriseThresholdPct = 5 } = {}) {
  const byDate = {};
  for (const e of earningsEvents) (byDate[e.date] ||= []).push(e);

  return {
    name: `PEAD(w${driftWindow})`,
    init: () => ({ active: {} }),
    onBar({ date, symbols, state }) {
      // Enter on earnings dates
      const events = byDate[date] || [];
      for (const e of events) {
        if (Math.abs(e.surprisePct) >= surpriseThresholdPct) {
          state.active[e.symbol] = { enteredAt: date, side: e.surprisePct > 0 ? 1 : -1, barsLeft: driftWindow };
        }
      }
      // Tick down active holdings
      for (const sym of Object.keys(state.active)) {
        state.active[sym].barsLeft -= 1;
        if (state.active[sym].barsLeft <= 0) delete state.active[sym];
      }
      // Produce equal-weight positions across active
      const active = Object.keys(state.active);
      if (!active.length) return Object.fromEntries(symbols.map((s) => [s, 0]));
      const w = 1 / active.length;
      const out = Object.fromEntries(symbols.map((s) => [s, 0]));
      for (const s of active) out[s] = w * state.active[s].side;
      return out;
    },
  };
}
