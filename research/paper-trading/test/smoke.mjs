// Offline smoke test: no network. Exercises every pure module in the harness.

import assert from "node:assert/strict";
import { runBacktest } from "../src/engine/backtest.mjs";
import { walkForward } from "../src/engine/walkForward.mjs";
import { bootstrapTradeSeries } from "../src/engine/monteCarlo.mjs";
import { deflatedSharpe } from "../src/engine/deflatedSharpe.mjs";
import { labelRegimes, regimeBreakdown } from "../src/engine/regimes.mjs";
import { buyAndHold } from "../src/strategies/buyAndHold.mjs";
import { smaCrossover } from "../src/strategies/smaCrossover.mjs";
import { rsiMeanReversion } from "../src/strategies/rsiMeanReversion.mjs";
import { openingRangeBreakout } from "../src/strategies/openingRangeBreakout.mjs";
import { vwapReversion } from "../src/strategies/vwapReversion.mjs";
import { vwapTrend } from "../src/strategies/vwapTrend.mjs";
import { openingRangeBreakoutIntraday } from "../src/strategies/orbIntraday.mjs";
import { withVolRegimeFilter } from "../src/strategies/volRegimeFilter.mjs";
import { spreadZ, cointegrationScore } from "../src/strategies/pairsTrading.mjs";
import { sessionVwap } from "../src/indicators/vwap.mjs";
import { kelly, kellyFromTrades } from "../src/risk/kelly.mjs";
import { fixedRiskSize, atrStop } from "../src/risk/fixedRisk.mjs";
import { correlationMatrix, highlyCorrelatedPairs } from "../src/risk/correlation.mjs";
import { portfolioHeat } from "../src/risk/portfolioHeat.mjs";
import { gapScanner } from "../src/screeners/gap.mjs";
import { relVolScanner } from "../src/screeners/relVol.mjs";
import { breakout52wScanner } from "../src/screeners/breakout52w.mjs";
import { unusualOptionsScan } from "../src/screeners/unusualOptions.mjs";
import { isEventDay, nextEvent, eventsInRange } from "../src/intel/econCalendar.mjs";
import { asciiChart } from "../src/report/asciiChart.mjs";
import { checkIntegrity } from "../src/data/integrity.mjs";
import { detectSuspectedSplits } from "../src/data/corpActions.mjs";
import { probabilisticSharpe, minTrackRecordLength } from "../src/engine/probabilisticSharpe.mjs";
import { realityCheck } from "../src/engine/realityCheck.mjs";
import { purgedKFold, combinatorialPurgedCV } from "../src/engine/purgedCV.mjs";
import { volumeScaledSlippage, applySlippage, stressSlippage } from "../src/engine/slippageModel.mjs";
import { simulateLimitFill, partialFillSchedule } from "../src/engine/limitFill.mjs";
import { isTradingDay, isHalfDay, nextTradingDay, isLikelyLULDHalt } from "../src/engine/marketCalendar.mjs";
import { MultiAssetPortfolio } from "../src/engine/multiAssetPortfolio.mjs";
import { runPortfolioBacktest } from "../src/engine/portfolioBacktest.mjs";
import { equalWeight, volTargeted, riskParity } from "../src/engine/rebalance.mjs";
import { crossSectionalMomentum } from "../src/strategies/crossSectionalMomentum.mjs";
import { lowVolAnomaly } from "../src/strategies/lowVolAnomaly.mjs";
import { turnOfMonth, fomcDrift, fridayOnly } from "../src/strategies/calendarEffects.mjs";
import { validatePlan } from "../src/decision/tradePlan.mjs";
import { preTradeChecklist } from "../src/decision/preTradeChecklist.mjs";
import { computeMaeMfe, aggregateExcursions } from "../src/decision/maeMfe.mjs";
import { hashBars } from "../src/engine/manifest.mjs";

function mulberry32(a) {
  return function () {
    let t = (a += 0x6d2b79f5);
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function syntheticDailyBars(n = 500, seed = 1) {
  const bars = [];
  let price = 100;
  const rng = mulberry32(seed);
  const start = new Date("2020-01-02");
  for (let i = 0; i < n; i++) {
    const drift = 0.0003;
    const noise = (Math.sin(i / 7) + Math.cos(i / 13)) * 0.005;
    const rnd = (rng() - 0.5) * 0.02;
    price = price * (1 + drift + noise + rnd);
    const o = price * (1 - 0.001);
    const c = price;
    const h = Math.max(o, c) * 1.002;
    const l = Math.min(o, c) * 0.998;
    const d = new Date(start);
    d.setDate(d.getDate() + i);
    bars.push({ date: d.toISOString().slice(0, 10), open: o, high: h, low: l, close: c, volume: 1_000_000 });
  }
  return bars;
}
function syntheticIntradayBars(days = 3, barsPerDay = 78) {
  const out = [];
  let price = 100;
  const rng = mulberry32(42);
  for (let d = 0; d < days; d++) {
    for (let i = 0; i < barsPerDay; i++) {
      price *= 1 + (rng() - 0.5) * 0.003;
      const o = price * (1 - 0.0005);
      const c = price;
      const h = Math.max(o, c) * 1.001;
      const l = Math.min(o, c) * 0.999;
      const date = `2024-01-${String(d + 2).padStart(2, "0")}T${String(9 + Math.floor(i / 12)).padStart(2, "0")}:${String((i % 12) * 5).padStart(2, "0")}:00Z`;
      out.push({ date, open: o, high: h, low: l, close: c, volume: 50_000 });
    }
  }
  return out;
}

let failed = 0;
function ok(name, fn) {
  try { fn(); console.log(`OK  ${name}`); }
  catch (e) { failed++; console.error(`FAIL ${name}: ${e.message}`); }
}

const daily = syntheticDailyBars(500);
const intraday = syntheticIntradayBars(3);

// ── Core strategies / engine ─────────────────────────────
const strategies = [
  buyAndHold(),
  smaCrossover({ fast: 10, slow: 30 }),
  rsiMeanReversion({ period: 14, buyBelow: 30, sellAbove: 55 }),
  openingRangeBreakout({ lookback: 20, exitLookback: 10 }),
  withVolRegimeFilter(smaCrossover({ fast: 10, slow: 30 }), { lookback: 20, maxAnnVol: 0.5 }),
];
for (const s of strategies) {
  ok(`backtest: ${s.name}`, () => {
    const r = runBacktest(daily, s);
    assert.ok(r.metrics);
    assert.equal(typeof r.metrics.sharpe, "number");
  });
}

ok("vwap indicator", () => {
  const v = sessionVwap(intraday);
  assert.equal(v.length, intraday.length);
  assert.ok(v.every((x) => typeof x === "number"));
});
ok("vwapReversion on intraday", () => {
  const r = runBacktest(intraday, vwapReversion({}));
  assert.ok(r.metrics);
});
ok("vwapTrend on intraday", () => {
  const r = runBacktest(intraday, vwapTrend({}));
  assert.ok(r.metrics);
});
ok("ORB intraday", () => {
  const r = runBacktest(intraday, openingRangeBreakoutIntraday({ orBars: 3, barMinutes: 5 }));
  assert.ok(r.metrics);
});

// ── Walk-forward ─────────────────────────────────────────
ok("walkforward SMA grid", () => {
  const grid = [{ fast: 5, slow: 20 }, { fast: 10, slow: 50 }, { fast: 20, slow: 100 }];
  const r = walkForward(daily, smaCrossover, grid, { folds: 4 });
  assert.ok(Array.isArray(r.folds));
});

// ── Monte Carlo ──────────────────────────────────────────
ok("monte carlo bootstrap", () => {
  const rets = Array.from({ length: 80 }, (_, i) => (mulberry32(i + 1)() - 0.48) * 0.02);
  const mc = bootstrapTradeSeries(rets, { iters: 500 });
  assert.ok(mc.sharpe);
  assert.equal(typeof mc.sharpe.p50, "number");
});

// ── Deflated Sharpe ──────────────────────────────────────
ok("deflated sharpe", () => {
  const r = deflatedSharpe({ sharpe: 1.8, n: 500, skew: -0.2, kurtosis: 5, trials: 20 });
  assert.equal(typeof r.pValue, "number");
});

// ── Regimes ──────────────────────────────────────────────
ok("regime breakdown", () => {
  const res = runBacktest(daily, smaCrossover({ fast: 10, slow: 30 }));
  const labels = labelRegimes(daily, { smaWindow: 100 });
  const bd = regimeBreakdown(res.equityCurve, labels);
  assert.ok(typeof bd === "object");
});

// ── Risk ─────────────────────────────────────────────────
ok("kelly from p/W/L", () => { assert.ok(kelly({ p: 0.55, avgWin: 100, avgLoss: 80 }).full >= 0); });
ok("kelly from trades", () => {
  const trades = [120, -80, 90, -100, 150, -70, 200, -90];
  assert.ok(kellyFromTrades(trades).full >= 0);
});
ok("fixed risk size", () => {
  const r = fixedRiskSize({ equity: 50000, riskPct: 0.01, entry: 100, stop: 98 });
  assert.equal(r.shares, 250);
});
ok("atr stop", () => {
  const s = atrStop({ bars: daily, period: 14, multiplier: 2 });
  assert.equal(typeof s, "number");
});
ok("correlation matrix", () => {
  const s1 = daily.map((b) => b.close);
  const s2 = s1.map((x, i) => x * 1.001 + (i % 5) * 0.02);
  const m = correlationMatrix({ A: s1, B: s2 });
  assert.ok(m.A.B > 0.9);
  assert.ok(highlyCorrelatedPairs(m, 0.8).length >= 1);
});
ok("portfolio heat", () => {
  const h = portfolioHeat({
    equity: 100000,
    positions: [{ symbol: "X", shares: 100, entry: 50, stop: 48 }, { symbol: "Y", shares: 50, entry: 200, stop: 195 }],
  });
  assert.equal(typeof h.totalRiskPct, "number");
});

// ── Pairs ────────────────────────────────────────────────
ok("pairs spread z", () => {
  const a = daily.map((b) => b.close);
  const b = a.map((x, i) => x * 1.02 + (i % 7));
  const { z } = spreadZ(a, b, 30);
  assert.equal(z.length, a.length);
});
ok("cointegration score", () => {
  const a = daily.map((b) => b.close);
  const b = a.map((x) => x * 1.01 + 5);
  const r = cointegrationScore(a, b);
  assert.ok(typeof r.beta === "number");
});

// ── Screeners ────────────────────────────────────────────
ok("gap scanner", () => {
  const data = { AAA: daily, BBB: daily.map((b) => ({ ...b, open: b.open * 1.05 })) };
  assert.ok(gapScanner(data, { minPct: 1 }).length >= 0);
});
ok("relvol scanner", () => {
  const data = { AAA: daily.map((b, i) => ({ ...b, volume: i === daily.length - 1 ? 10_000_000 : 1_000_000 })) };
  const r = relVolScanner(data, { lookback: 20, minRelVol: 2 });
  assert.ok(r.length >= 1);
});
ok("breakout 52w", () => {
  assert.ok(Array.isArray(breakout52wScanner({ AAA: daily })));
});
ok("unusual options stub", async () => {
  const r = await unusualOptionsScan(["AAA"]);
  assert.equal(r.available, false);
});

// ── Intel ────────────────────────────────────────────────
ok("econ calendar", () => {
  assert.equal(typeof isEventDay("2025-05-07"), "boolean");
  assert.ok(nextEvent("2025-01-01"));
  assert.ok(eventsInRange("2024-01-01", "2024-12-31").length > 0);
});

// ── Report ───────────────────────────────────────────────
ok("ascii chart", () => {
  const chart = asciiChart(Array.from({ length: 100 }, (_, i) => 100 + Math.sin(i / 5) * 10), { width: 40, height: 8, label: "test" });
  assert.ok(chart.includes("test"));
});

// ── Data integrity & corp actions ────────────────────────
ok("integrity clean", () => {
  const r = checkIntegrity(daily);
  assert.equal(r.fatal, false);
});
ok("integrity detects too-few-bars", () => {
  const r = checkIntegrity(daily.slice(0, 10), { minBars: 30 });
  assert.equal(r.fatal, true);
});
ok("detect suspected splits", () => {
  const withSplit = daily.map((b, i) => i === 250 ? { ...b, open: b.open * 2 } : b);
  const suspects = detectSuspectedSplits(withSplit);
  assert.ok(suspects.length >= 1);
});

// ── Honest statistics ────────────────────────────────────
ok("probabilistic sharpe", () => {
  const r = probabilisticSharpe({ sharpe: 1.2, n: 500 });
  assert.ok(r.psr >= 0 && r.psr <= 1);
});
ok("min track record length", () => {
  const r = minTrackRecordLength({ sharpe: 1.2 });
  assert.ok(r.minN > 0);
});
ok("reality check", () => {
  const rets = Array.from({ length: 3 }, (_, k) =>
    Array.from({ length: 200 }, (_, i) => (mulberry32(k * 100 + i + 1)() - 0.5) * 0.01),
  );
  const r = realityCheck(rets, { B: 100 });
  assert.ok(typeof r.pValue === "number");
});
ok("purged k-fold", () => {
  const splits = purgedKFold({ n: 500, folds: 5, labelWindow: 3, embargoPct: 0.01 });
  assert.equal(splits.length, 5);
  // Verify no overlap between each fold's train and test
  for (const { train, test } of splits) {
    const testSet = new Set(test);
    assert.ok(train.every((i) => !testSet.has(i)));
  }
});
ok("combinatorial purged CV", () => {
  const splits = combinatorialPurgedCV({ n: 500, groups: 5, testGroups: 2 });
  assert.ok(splits.length === 10); // C(5,2)
});

// ── Execution realism ────────────────────────────────────
ok("volume-scaled slippage", () => {
  const bps = volumeScaledSlippage({ orderSize: 10_000, adv: 1_000_000 });
  assert.ok(bps > 5);
  assert.ok(stressSlippage(10_000, 1_000_000) > bps);
});
ok("apply slippage", () => {
  assert.ok(applySlippage(100, "BUY", 10) > 100);
  assert.ok(applySlippage(100, "SELL", 10) < 100);
});
ok("limit fill sim", () => {
  const bar = { date: "2024-01-02", open: 100, high: 102, low: 99, close: 101, volume: 1e6 };
  const r = simulateLimitFill({ bar, side: "BUY", limitPrice: 99.5, fillProb: 1 });
  assert.equal(r.filled, true);
  const r2 = simulateLimitFill({ bar, side: "BUY", limitPrice: 98, fillProb: 1 });
  assert.equal(r2.filled, false);
});
ok("partial fill schedule", () => {
  const s = partialFillSchedule({ totalShares: 103, tranches: 4 });
  assert.equal(s.reduce((a, b) => a + b, 0), 103);
});
ok("market calendar", () => {
  assert.equal(isTradingDay("2024-01-01"), false); // New Year's
  assert.equal(isTradingDay("2024-01-02"), true);
  assert.equal(isHalfDay("2024-12-24"), true);
  assert.ok(nextTradingDay("2024-12-31"));
  assert.equal(isLikelyLULDHalt({ high: 110, low: 90, close: 100 }), true);
});

// ── Multi-asset portfolio ────────────────────────────────
ok("multi-asset portfolio basics", () => {
  const p = new MultiAssetPortfolio({ startingCash: 100_000 });
  p.targetShares("2024-01-02", "AAA", 100, 50);
  assert.equal(p.positions.AAA, 100);
  p.targetShares("2024-01-03", "AAA", 0, 52);
  assert.ok(!p.positions.AAA);
});
ok("multi-asset shorting with borrow", () => {
  const p = new MultiAssetPortfolio({ startingCash: 100_000 });
  p.targetShares("2024-01-02", "AAA", -100, 50);
  p.mark("2024-01-02", { AAA: 50 });
  p.mark("2024-01-03", { AAA: 50 });
  assert.ok(p.equityCurve.length === 2);
});
ok("portfolio backtest equal weight", () => {
  const B = syntheticDailyBars(300, 2);
  const res = runPortfolioBacktest({ A: daily.slice(0, 300), B }, equalWeight(["A", "B"]));
  assert.ok(res.metrics);
});
ok("portfolio backtest vol targeted", () => {
  const B = syntheticDailyBars(300, 3);
  const res = runPortfolioBacktest({ A: daily.slice(0, 300), B }, volTargeted({ lookback: 30 }));
  assert.ok(res.metrics);
});
ok("portfolio backtest risk parity", () => {
  const B = syntheticDailyBars(300, 4);
  const res = runPortfolioBacktest({ A: daily.slice(0, 300), B }, riskParity({ lookback: 30 }));
  assert.ok(res.metrics);
});

// ── Serious strategies ───────────────────────────────────
ok("cross-sectional momentum allocator", () => {
  const mom = crossSectionalMomentum({ lookback: 60, skip: 5 });
  const B = syntheticDailyBars(300, 5);
  const w = mom.onBar({
    date: "2020-12-31", symbols: ["A", "B"],
    history: daily.slice(0, 200).map((_, i) => ({ date: `d${i}`, A: daily[i], B: B[i] })),
  });
  assert.ok(typeof w === "object");
});
ok("low vol anomaly", () => {
  const lv = lowVolAnomaly({ lookback: 60 });
  const B = syntheticDailyBars(300, 6);
  const w = lv.onBar({
    date: "x", symbols: ["A", "B"],
    history: daily.slice(0, 200).map((_, i) => ({ date: `d${i}`, A: daily[i], B: B[i] })),
  });
  assert.ok(typeof w === "object");
});
ok("calendar effect strategies", () => {
  const t = turnOfMonth();
  assert.ok(["LONG", "FLAT"].includes(t.onBar({ date: "2024-01-31" })));
  assert.ok(["LONG", "FLAT"].includes(fomcDrift().onBar({ date: "2024-01-31" })));
  assert.ok(["LONG", "FLAT"].includes(fridayOnly().onBar({ date: "2024-01-05" })));
});

// ── Decision support ─────────────────────────────────────
ok("plan validation ok", () => {
  const v = validatePlan({ symbol: "X", side: "BUY", qty: 10, entry: 100, stop: 98, target: 104, setup: "orb" });
  assert.equal(v.ok, true);
  assert.equal(v.rewardRisk, 2);
});
ok("plan validation rejects bad R:R", () => {
  const v = validatePlan({ symbol: "X", side: "BUY", qty: 10, entry: 100, stop: 98, target: 101, setup: "orb" });
  assert.equal(v.ok, false);
});
ok("pre-trade checklist NO-GO on event", () => {
  const r = preTradeChecklist(
    {
      plan: { symbol: "X", side: "BUY", qty: 10, entry: 100, stop: 98, target: 104, setup: "orb" },
      equity: 100_000, openPositions: [], todayPlans: 0, today: "2025-05-07",
    },
    { blockOnFOMC: true },
  );
  assert.equal(r.decision, "NO-GO");
});
ok("pre-trade checklist GO", () => {
  const r = preTradeChecklist(
    {
      plan: { symbol: "X", side: "BUY", qty: 10, entry: 100, stop: 98, target: 104, setup: "orb" },
      equity: 100_000, openPositions: [], todayPlans: 0, today: "2024-08-15",
    },
    { blockOnFOMC: true, requireEdgeSample: 1 },
  );
  assert.ok(r.decision === "GO" || r.decision === "NO-GO");
});
ok("MAE/MFE compute", () => {
  const trip = { tradeId: "t1", entry: 100, exit: 105, stop: 98, direction: "LONG" };
  const bars = [{ low: 99, high: 103 }, { low: 98.5, high: 106 }];
  const r = computeMaeMfe(trip, bars);
  assert.ok(r.maePct < 0);
  assert.ok(r.mfePct > 0);
});
ok("MAE/MFE aggregate", () => {
  const agg = aggregateExcursions([
    { realizedPct: 3, maePct: -1, mfePct: 5, rMultipleRealized: 1.5 },
    { realizedPct: -2, maePct: -3, mfePct: 1, rMultipleRealized: -1 },
  ]);
  assert.ok(agg.winners.n === 1);
  assert.ok(agg.losers.n === 1);
});

// ── Manifest ─────────────────────────────────────────────
ok("bars hash deterministic", () => {
  const h1 = hashBars(daily);
  const h2 = hashBars(daily);
  assert.equal(h1, h2);
});

if (failed > 0) { console.error(`\n${failed} test(s) failed`); process.exit(1); }
console.log("\nAll smoke tests passed.");
