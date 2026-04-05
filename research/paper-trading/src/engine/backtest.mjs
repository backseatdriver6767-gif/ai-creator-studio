// Event-driven backtest loop. Strategies receive bars one-by-one and return
// a desired target state ("LONG" or "FLAT"). Orders fill on next bar's open
// to avoid look-ahead bias.

import { Portfolio } from "./portfolio.mjs";
import { computeMetrics } from "./metrics.mjs";

/**
 * @param {Array<{date:string,open:number,high:number,low:number,close:number,volume:number}>} bars
 * @param {{ name: string, init?: () => any, onBar: (bar, state, history) => "LONG"|"FLAT" }} strategy
 * @param {{ startingCash?: number, feeBps?: number, slippageBps?: number }} opts
 */
export function runBacktest(bars, strategy, opts = {}) {
  const pf = new Portfolio(opts);
  const state = strategy.init ? strategy.init() : {};
  const history = [];
  let desired = "FLAT";

  for (let i = 0; i < bars.length; i++) {
    const bar = bars[i];
    // Execute yesterday's decision at today's open (no look-ahead).
    if (desired === "LONG" && pf.shares === 0) pf.buy(bar.date, bar.open);
    else if (desired === "FLAT" && pf.shares > 0) pf.sell(bar.date, bar.open);

    // Strategy observes the bar AFTER open fill (uses close for signal).
    history.push(bar);
    desired = strategy.onBar(bar, state, history) || "FLAT";

    pf.mark(bar.date, bar.close);
  }

  // Close out at final close
  if (pf.shares > 0) pf.sell(bars[bars.length - 1].date, bars[bars.length - 1].close);

  const metrics = computeMetrics(pf.equityCurve, pf.fills, pf.startingCash);
  return {
    strategy: strategy.name,
    metrics,
    fills: pf.fills,
    equityCurve: pf.equityCurve,
  };
}
