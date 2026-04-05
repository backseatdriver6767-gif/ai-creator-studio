#!/usr/bin/env node
// Offline baseline runner — same report as scripts/baseline.mjs, but uses
// synthetic deterministic bars so it runs with no network. Use this to
// verify the full pipeline works, then run the real `baseline.mjs` against
// live data providers from a machine with internet.

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
import { hashBars, writeManifest } from "../src/engine/manifest.mjs";
import { randomUUID } from "node:crypto";

function mulberry32(a) {
  return function () {
    let t = (a += 0x6d2b79f5);
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
function synth(n, seed, { drift = 0.0003, vol = 0.012 } = {}) {
  const bars = [];
  let price = 100;
  const rng = mulberry32(seed);
  const start = new Date("2015-01-02");
  for (let i = 0; i < n; i++) {
    const trend = drift;
    const cycle = Math.sin(i / 60) * 0.002;
    const rnd = (rng() - 0.5) * 2 * vol;
    price *= 1 + trend + cycle + rnd;
    const o = price * (1 - 0.001);
    const c = price;
    const h = Math.max(o, c) * 1.003;
    const l = Math.min(o, c) * 0.997;
    const d = new Date(start);
    d.setDate(d.getDate() + i);
    bars.push({ date: d.toISOString().slice(0, 10), open: o, high: h, low: l, close: c, volume: 50_000_000 });
  }
  return bars;
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

async function runOne(name, bars) {
  console.log(`\n════════ ${name}  (synthetic) ════════`);
  console.log(`  bars=${bars.length}  hash=${hashBars(bars)}`);
  const { train, test } = splitBars(bars, 0.7);
  const strategies = [
    buyAndHold(),
    smaCrossover({ fast: 20, slow: 50 }),
    smaCrossover({ fast: 10, slow: 30 }),
    rsiMeanReversion({ period: 14, buyBelow: 30, sellAbove: 55 }),
    openingRangeBreakout({ lookback: 20, exitLookback: 10 }),
  ];
  const rows = [];
  const excessMatrix = [];
  const bhDaily = dailyReturns(runBacktest(bars, buyAndHold()).equityCurve);

  for (const s of strategies) {
    const trainRes = runBacktest(train, s);
    const testRes = runBacktest(test, s);
    const fullRes = runBacktest(bars, s);
    const daily = dailyReturns(fullRes.equityCurve);
    const psr = probabilisticSharpe({ sharpe: fullRes.metrics.sharpe, n: daily.length });
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
    if (s.name !== "BuyAndHold") excessMatrix.push(daily.map((r, i) => r - (bhDaily[i] ?? 0)));
  }
  console.table(rows);

  console.log("\nWalk-forward (SMA grid, 5 folds):");
  const wf = walkForward(
    bars,
    smaCrossover,
    [{ fast: 5, slow: 20 }, { fast: 10, slow: 30 }, { fast: 10, slow: 50 }, { fast: 20, slow: 50 }, { fast: 20, slow: 100 }, { fast: 50, slow: 200 }],
    { folds: 5 },
  );
  console.log(`  mean OOS Sharpe = ${wf.oosMeanSharpe}`);

  const smaRes = runBacktest(bars, smaCrossover({ fast: 10, slow: 30 }));
  const tradeReturns = extractRoundTripReturns(smaRes.fills);
  if (tradeReturns.length) {
    const mc = bootstrapTradeSeries(tradeReturns, { iters: 1000 });
    console.log(`\nMonte Carlo SMA(10/30) trades (${tradeReturns.length} trades):`);
    console.log(`  Sharpe p05=${mc.sharpe.p05}  p50=${mc.sharpe.p50}  p95=${mc.sharpe.p95}`);
    console.log(`  MaxDD  p05=${mc.maxDrawdown.p05}  p50=${mc.maxDrawdown.p50}`);
  }

  const bestSharpe = Math.max(...rows.filter((r) => r.strategy !== "BuyAndHold").map((r) => r.fullSharpe));
  const ds = deflatedSharpe({ sharpe: bestSharpe, n: bars.length, trials: rows.length - 1, sharpeStd: 0.4 });
  console.log(`\nDeflated Sharpe (best of ${rows.length - 1} trials): deflated=${ds.deflatedSharpe}  p=${ds.pValue}`);

  if (excessMatrix.length && excessMatrix[0].length > 50) {
    const rc = realityCheck(excessMatrix, { B: 300, blockSize: 10 });
    console.log(`Reality Check p-value: ${rc.pValue}  (${rc.interpretation})`);
  }

  const labels = labelRegimes(bars, { smaWindow: 200 });
  const bd = regimeBreakdown(smaRes.equityCurve, labels);
  console.log("\nRegime breakdown (SMA 10/30):");
  console.log(JSON.stringify(bd, null, 2));

  const runId = randomUUID();
  await writeManifest(runId, {
    kind: "baseline-offline",
    symbol: name,
    bars: bars.length,
    dataSource: "synthetic",
    dataHash: hashBars(bars),
    strategies: rows,
    walkForward: wf,
  });
}

(async () => {
  console.log("Offline baseline (synthetic bars). Use scripts/baseline.mjs for real data.");
  await runOne("SYNTH-SPY", synth(2000, 11, { drift: 0.00035, vol: 0.01 }));
  await runOne("SYNTH-QQQ", synth(2000, 22, { drift: 0.00045, vol: 0.014 }));
  await runOne("SYNTH-IWM", synth(2000, 33, { drift: 0.0002, vol: 0.016 }));
  console.log("\nDone. On a machine with network, run: node research/paper-trading/scripts/baseline.mjs");
})().catch((e) => { console.error(e); process.exit(1); });
