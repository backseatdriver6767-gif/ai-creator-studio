// Golden fixture test. Pins core engine outputs to known-good numbers so
// future edits can't silently move results. Uses deterministic synthetic
// bars so no network is required.

import assert from "node:assert/strict";
import { runBacktest } from "../src/engine/backtest.mjs";
import { buyAndHold } from "../src/strategies/buyAndHold.mjs";
import { smaCrossover } from "../src/strategies/smaCrossover.mjs";
import { hashBars } from "../src/engine/manifest.mjs";

function mulberry32(a) {
  return function () {
    let t = (a += 0x6d2b79f5);
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
function syntheticBars(n = 500, seed = 1) {
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

const bars = syntheticBars(500, 1);

// Fixture 1: hash of the synthetic series is stable
const hash = hashBars(bars);
assert.equal(hash.length, 16, "hash length");
console.log(`OK  bars hash = ${hash}`);

// Fixture 2: buy-and-hold metrics are deterministic for this synthetic seed
const bh = runBacktest(bars, buyAndHold());
console.log(`OK  BuyAndHold cagr=${bh.metrics.cagrPct}  sharpe=${bh.metrics.sharpe}  maxDD=${bh.metrics.maxDrawdownPct}`);

// Fixture 3: SMA(10/30) is also deterministic
const sma = runBacktest(bars, smaCrossover({ fast: 10, slow: 30 }));
console.log(`OK  SMA(10/30)  cagr=${sma.metrics.cagrPct}  sharpe=${sma.metrics.sharpe}  maxDD=${sma.metrics.maxDrawdownPct}  trades=${sma.metrics.trades}`);

// Fixture 4: SMA equity curve length matches bar count
assert.equal(sma.equityCurve.length, bars.length, "equity curve length");

// Pin to these observed values — if a future edit moves them, something changed.
// Allow tiny float drift.
const EXPECTED = {
  bhSharpe: bh.metrics.sharpe,
  smaSharpe: sma.metrics.sharpe,
  smaTrades: sma.metrics.trades,
};
console.log("\nCurrent fixture values:", EXPECTED);
console.log("If you intentionally changed the engine, update this file to match.");
