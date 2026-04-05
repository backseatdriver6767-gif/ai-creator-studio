// Portfolio backtest loop. Drives a MultiAssetPortfolio against a set of
// aligned daily bar series and a single "allocator" function that returns
// target weights per symbol each bar.
//
// Allocators are pure functions of (date, priceHistory, state) → Record<sym, weight>
// Weights sum to at most 1.0 (or 2.0 if 100% short is allowed). Remaining
// becomes cash.

import { MultiAssetPortfolio } from "./multiAssetPortfolio.mjs";
import { computeMetrics } from "./metrics.mjs";

/**
 * @param {Record<string, Array>} symbolBars  map of symbol → bar array (aligned by date)
 * @param {{ name: string, onBar: (ctx) => Record<string, number> }} allocator
 * @param {object} opts
 */
export function runPortfolioBacktest(symbolBars, allocator, opts = {}) {
  const { rebalanceEvery = 5 } = opts;
  const pf = new MultiAssetPortfolio(opts);

  // Align dates: use the intersection of dates across all symbols
  const dateSet = null;
  const symbols = Object.keys(symbolBars);
  if (!symbols.length) throw new Error("no symbols");
  const dateLists = symbols.map((s) => symbolBars[s].map((b) => b.date));
  const common = dateLists.reduce((acc, list) => acc.filter((d) => list.includes(d)));
  const byDate = {};
  for (const s of symbols) {
    byDate[s] = {};
    for (const b of symbolBars[s]) byDate[s][b.date] = b;
  }

  const state = {};
  let barIdx = 0;
  for (const date of common) {
    const prices = {};
    for (const s of symbols) prices[s] = byDate[s][date].close;
    const opens = {};
    for (const s of symbols) opens[s] = byDate[s][date].open;

    if (barIdx % rebalanceEvery === 0) {
      const history = common.slice(0, barIdx + 1).map((d) => {
        const snap = {};
        for (const s of symbols) snap[s] = byDate[s][d];
        return { date: d, ...snap };
      });
      const weights = allocator.onBar({ date, symbols, history, state }) || {};
      const equity = pf.marketValue(prices);
      for (const s of symbols) {
        const w = weights[s] || 0;
        const targetNotional = equity * w;
        const shares = Math.trunc(targetNotional / opens[s]);
        pf.targetShares(date, s, shares, opens[s]);
      }
    }

    pf.mark(date, prices);
    barIdx++;
  }

  // Close out at end
  const lastDate = common[common.length - 1];
  const lastPrices = {};
  for (const s of symbols) lastPrices[s] = byDate[s][lastDate].close;
  pf.flatten(lastDate, lastPrices);

  const metrics = computeMetrics(pf.equityCurve, pf.fills.map((f) => ({
    side: f.shares > 0 ? "BUY" : "SELL", price: f.price, shares: Math.abs(f.shares), fee: f.fee, date: f.date,
  })), pf.startingCash);
  return {
    allocator: allocator.name,
    metrics,
    fills: pf.fills,
    equityCurve: pf.equityCurve,
  };
}
