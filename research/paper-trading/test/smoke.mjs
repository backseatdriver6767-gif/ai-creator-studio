// Offline smoke test: builds a synthetic price series and runs all strategies
// and the metrics engine through it. Verifies nothing throws and numbers come
// out sane. Does NOT hit the network — safe for CI.

import assert from "node:assert/strict";
import { runBacktest } from "../src/engine/backtest.mjs";
import { buyAndHold } from "../src/strategies/buyAndHold.mjs";
import { smaCrossover } from "../src/strategies/smaCrossover.mjs";
import { rsiMeanReversion } from "../src/strategies/rsiMeanReversion.mjs";
import { openingRangeBreakout } from "../src/strategies/openingRangeBreakout.mjs";

function syntheticBars(n = 400) {
  const bars = [];
  let price = 100;
  const start = new Date("2020-01-02");
  for (let i = 0; i < n; i++) {
    // Mildly trending random walk with sinusoidal component.
    const drift = 0.0003;
    const noise = (Math.sin(i / 7) + Math.cos(i / 13)) * 0.005;
    const rnd = (mulberry32(i + 1)() - 0.5) * 0.02;
    price = price * (1 + drift + noise + rnd);
    const o = price * (1 - 0.001);
    const c = price;
    const h = Math.max(o, c) * 1.002;
    const l = Math.min(o, c) * 0.998;
    const d = new Date(start);
    d.setDate(d.getDate() + i);
    bars.push({
      date: d.toISOString().slice(0, 10),
      open: o,
      high: h,
      low: l,
      close: c,
      volume: 1_000_000,
    });
  }
  return bars;
}
function mulberry32(a) {
  return function () {
    let t = (a += 0x6d2b79f5);
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const bars = syntheticBars(500);

const strategies = [
  buyAndHold(),
  smaCrossover({ fast: 10, slow: 30 }),
  rsiMeanReversion({ period: 14, buyBelow: 30, sellAbove: 55 }),
  openingRangeBreakout({ lookback: 20, exitLookback: 10 }),
];

let failed = 0;
for (const s of strategies) {
  try {
    const res = runBacktest(bars, s);
    assert.ok(res.metrics, `${s.name}: metrics missing`);
    assert.equal(typeof res.metrics.sharpe, "number");
    assert.equal(typeof res.metrics.maxDrawdownPct, "number");
    assert.ok(res.equityCurve.length === bars.length, `${s.name}: equity curve length`);
    console.log(
      `OK  ${s.name.padEnd(32)}  cagr=${res.metrics.cagrPct}%  sharpe=${res.metrics.sharpe}  maxDD=${res.metrics.maxDrawdownPct}%  trades=${res.metrics.trades}`,
    );
  } catch (e) {
    failed++;
    console.error(`FAIL ${s.name}:`, e.message);
  }
}

if (failed > 0) {
  console.error(`\n${failed} strategy test(s) failed`);
  process.exit(1);
}
console.log("\nAll smoke tests passed.");
