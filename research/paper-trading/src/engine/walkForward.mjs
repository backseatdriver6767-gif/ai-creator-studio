// Walk-forward analysis: split series into K consecutive folds. For each
// fold, "train" (here: parameter search over a grid) on the prior window,
// then evaluate on the next window. Report out-of-sample metrics only.
//
// This is the honest way to validate a parameterized strategy.

import { runBacktest } from "./backtest.mjs";

/**
 * @param {Array} bars
 * @param {(params: object) => any} strategyFactory
 * @param {object[]} paramGrid  array of parameter combinations to search
 * @param {{ folds?: number, metric?: string }} opts
 */
export function walkForward(bars, strategyFactory, paramGrid, opts = {}) {
  const folds = opts.folds ?? 5;
  const metric = opts.metric ?? "sharpe";
  const foldSize = Math.floor(bars.length / (folds + 1));
  const results = [];

  for (let k = 0; k < folds; k++) {
    const trainStart = k * foldSize;
    const trainEnd = trainStart + foldSize;
    const testEnd = trainEnd + foldSize;
    const trainBars = bars.slice(trainStart, trainEnd);
    const testBars = bars.slice(trainEnd, testEnd);
    if (testBars.length < 20) break;

    let best = null;
    for (const params of paramGrid) {
      const strat = strategyFactory(params);
      const res = runBacktest(trainBars, strat);
      const score = res.metrics[metric] ?? 0;
      if (!best || score > best.score) best = { score, params };
    }
    const oosStrat = strategyFactory(best.params);
    const oos = runBacktest(testBars, oosStrat);
    results.push({
      fold: k + 1,
      params: best.params,
      trainScore: best.score,
      oosMetrics: oos.metrics,
    });
  }

  // Aggregate OOS
  const oosSharpes = results.map((r) => r.oosMetrics.sharpe ?? 0);
  const mean = oosSharpes.reduce((s, x) => s + x, 0) / Math.max(oosSharpes.length, 1);
  return { folds: results, oosMeanSharpe: round(mean, 3) };
}

function round(x, d) {
  const p = 10 ** d;
  return Math.round(x * p) / p;
}
