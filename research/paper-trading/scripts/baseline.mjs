#!/usr/bin/env node
// Real-data baseline runner (answer to "option A" — run the harness against
// real markets and print the honest result). Uses the multi-source data
// router so Stooq is tried first, then Yahoo.
//
// Usage:
//   node research/paper-trading/scripts/baseline.mjs [SYM1,SYM2,...] [fromISO] [toISO]
// Defaults: SPY,QQQ,IWM from 2015-01-01 to today.

import { fetchBars } from "../src/data/multiSource.mjs";
import { runBacktest } from "../src/engine/backtest.mjs";
import { splitBars } from "../src/data/yahoo.mjs";
import { buyAndHold } from "../src/strategies/buyAndHold.mjs";
import { smaCrossover } from "../src/strategies/smaCrossover.mjs";
import { rsiMeanReversion } from "../src/strategies/rsiMeanReversion.mjs";
import { openingRangeBreakout } from "../src/strategies/openingRangeBreakout.mjs";
import { walkForward } from "../src/engine/walkForward.mjs";
import { bootstrapTradeSeries } from "../src/engine/monteCarlo.mjs";
import { probabilisticSharpe } from "../src/engine/probabilisticSharpe.mjs";
import { deflatedSharpe } from "../src/engine/deflatedSharpe.mjs";
import { realityCheck } from "../src/engine/realityCheck.mjs";
import { labelRegimes, regimeBreakdown } from "../src/engine/regimes.mjs";
import { writeManifest } from "../src/engine/manifest.mjs";
import { hashBars } from "../src/engine/manifest.mjs";
import { randomUUID } from "node:crypto";

const symbols = (process.argv[2] || "SPY,QQQ,IWM").split(",");
const from = process.argv[3] || "2015-01-01";
const to = process.argv[4] || new Date().toISOString().slice(0, 10);

const STRATEGIES = () => [
  buyAndHold(),
  smaCrossover({ fast: 20, slow: 50 }),
  smaCrossover({ fast: 10, slow: 30 }),
  rsiMeanReversion({ period: 14, buyBelow: 30, sellAbove: 55 }),
  openingRangeBreakout({ lookback: 20, exitLookback: 10 }),
];

async function runOne(symbol) {
  console.log(`\n════════ ${symbol} ════════`);
  let bars, source, integrity;
  try {
    ({ bars, source, integrity } = await fetchBars(symbol, from, to));
  } catch (e) {
    console.log(`  DATA FAILURE: ${e.message}`);
    return null;
  }
  console.log(`  source=${source}  bars=${bars.length}  hash=${hashBars(bars)}  integrity=${integrity.issues.length ? integrity.issues.join("; ") : "clean"}`);
  const { train, test } = splitBars(bars, 0.7);
  const rows = [];
  const excessMatrix = [];
  const bhRes = runBacktest(bars, buyAndHold());
  const bhDaily = dailyReturns(bhRes.equityCurve);

  for (const s of STRATEGIES()) {
    const trainRes = runBacktest(train, s);
    const testRes = runBacktest(test, s);
    const fullRes = runBacktest(bars, s);
    const daily = dailyReturns(fullRes.equityCurve);
    const psr = probabilisticSharpe({ sharpe: fullRes.metrics.sharpe, n: daily.length, benchmark: 0 });
    rows.push({
      strategy: s.name,
      trainSharpe: trainRes.metrics.sharpe,
      testSharpe: testRes.metrics.sharpe,
      fullSharpe: fullRes.metrics.sharpe,
      cagrPct: fullRes.metrics.cagrPct,
      maxDDPct: fullRes.metrics.maxDrawdownPct,
      trades: fullRes.metrics.trades,
      psr: psr.psr,
    });
    if (s.name !== "BuyAndHold") {
      excessMatrix.push(daily.map((r, i) => r - (bhDaily[i] ?? 0)));
    }
  }
  console.table(rows);

  // Walk-forward on SMA
  console.log("\nWalk-forward (SMA grid, 5 folds):");
  const wf = walkForward(
    bars,
    smaCrossover,
    [{ fast: 5, slow: 20 }, { fast: 10, slow: 30 }, { fast: 10, slow: 50 }, { fast: 20, slow: 50 }, { fast: 20, slow: 100 }, { fast: 50, slow: 200 }],
    { folds: 5 },
  );
  console.log(`  mean OOS Sharpe = ${wf.oosMeanSharpe}`);

  // Monte Carlo on the SMA trade returns. Annualize by the actual trade
  // frequency observed, not by √252 (which would assume daily sampling).
  const smaRes = runBacktest(bars, smaCrossover({ fast: 10, slow: 30 }));
  const tradeReturns = extractRoundTripReturns(smaRes.fills);
  if (tradeReturns.length) {
    const yearsSpanned = (new Date(bars[bars.length - 1].date) - new Date(bars[0].date)) / (365.25 * 86400_000);
    const mc = bootstrapTradeSeries(tradeReturns, { iters: 1000, yearsSpanned });
    console.log(`\nMonte Carlo on SMA(10/30) trades (${tradeReturns.length} trades over ${yearsSpanned.toFixed(1)}y, 1000 iters):`);
    console.log(`  Sharpe p05=${mc.sharpe.p05}  p50=${mc.sharpe.p50}  p95=${mc.sharpe.p95}`);
    console.log(`  MaxDD  p05=${mc.maxDrawdown.p05} p50=${mc.maxDrawdown.p50} p95=${mc.maxDrawdown.p95}`);
  } else {
    console.log("  (no round-trip trades for monte carlo)");
  }

  // Deflated Sharpe using best observed Sharpe and count of trials tested
  const bestSharpe = Math.max(...rows.filter((r) => r.strategy !== "BuyAndHold").map((r) => r.fullSharpe));
  const ds = deflatedSharpe({ sharpe: bestSharpe, n: bars.length, trials: rows.length - 1, sharpeStd: 0.4 });
  console.log(`\nDeflated Sharpe (best strat, ${rows.length - 1} trials): deflated=${ds.deflatedSharpe}  p=${ds.pValue}`);

  // Reality Check
  if (excessMatrix.length && excessMatrix[0].length > 50) {
    const rc = realityCheck(excessMatrix, { B: 500, blockSize: 10 });
    console.log(`Reality Check p-value: ${rc.pValue}  (${rc.interpretation})`);
  }

  // Regimes
  const labels = labelRegimes(bars, { smaWindow: 200 });
  const bd = regimeBreakdown(smaRes.equityCurve, labels);
  console.log("\nRegime breakdown (SMA 10/30):");
  console.log(JSON.stringify(bd, null, 2));

  const runId = randomUUID();
  await writeManifest(runId, {
    kind: "baseline",
    symbol, from, to,
    dataSource: source,
    dataHash: hashBars(bars),
    strategies: rows,
    walkForward: wf,
  });
  console.log(`\nmanifest: journal/manifests/${runId}.json`);
  return { symbol, source, bars: bars.length, rows, wf };
}

function dailyReturns(curve) {
  const r = [];
  for (let i = 1; i < curve.length; i++) {
    const prev = curve[i - 1].equity, cur = curve[i].equity;
    r.push(prev > 0 ? (cur - prev) / prev : 0);
  }
  return r;
}
function extractRoundTripReturns(fills) {
  const out = [];
  let open = null;
  for (const f of fills) {
    if (f.side === "BUY") open = f;
    else if (f.side === "SELL" && open) {
      out.push((f.price - open.price) / open.price);
      open = null;
    }
  }
  return out;
}

(async () => {
  console.log(`Baseline run  symbols=${symbols.join(",")}  ${from} → ${to}`);
  for (const s of symbols) {
    try { await runOne(s); }
    catch (e) { console.error(`${s} failed: ${e.message}`); }
  }
  console.log("\nDone.");
})().catch((e) => { console.error(e); process.exit(1); });
