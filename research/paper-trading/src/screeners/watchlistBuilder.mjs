// Composite watchlist scorer. Pure / side-effect free.
//
// Given a symbolBars map (the same shape consumed by the individual
// screeners), runs all registered screeners, produces a deterministic
// composite score per symbol, applies a liquidity floor, and returns a
// ranked candidate list.
//
// This module NEVER fetches data, NEVER writes files, NEVER places trades.
// It is a reducer: symbolBars in, ranked candidates out. The runner
// (`watchlistRunner.mjs`) handles the I/O.
//
// Scoring model (deterministic, no randomness):
//   +min(3, max(0, relVol - 1))   for elevated volume  (0..3)
//   +2                            for a 52w high/low touch (0 or 2)
//   +min(3, abs(gapPct) / 2)      for overnight gap     (0..3)
//
// Max theoretical score ≈ 8. Ties break alphabetically.
//
// Liquidity floor: 20-day average dollar volume must be ≥ $10M. This
// prevents thinly-traded names from dominating a relvol spike on an
// otherwise illiquid day.

import { relVolScanner } from "./relVol.mjs";
import { breakout52wScanner } from "./breakout52w.mjs";
import { gapScanner } from "./gap.mjs";

const DEFAULT_TOP_N = 5;
const DEFAULT_MIN_BARS = 60;
const LIQUIDITY_FLOOR_USD = 10_000_000; // $10M/day

/**
 * Build a ranked watchlist from a symbolBars map. Pure.
 *
 * @param {Record<string, Array<{date:string, open:number, high:number, low:number, close:number, volume:number}>>} symbolBars
 * @param {{ topN?: number, minBars?: number, liquidityFloor?: number }} opts
 * @returns {{
 *   generatedAt: string|null,
 *   universeSize: number,
 *   eligible: number,
 *   survivors: number,
 *   topN: Array<object>,
 *   allScores: Array<object>
 * }}
 */
export function buildWatchlist(symbolBars, opts = {}) {
  const topN = opts.topN ?? DEFAULT_TOP_N;
  const minBars = opts.minBars ?? DEFAULT_MIN_BARS;
  const liquidityFloor = opts.liquidityFloor ?? LIQUIDITY_FLOOR_USD;

  const universe = Object.keys(symbolBars);
  const eligibleSet = new Set();
  const scores = new Map();
  const reasons = new Map();

  for (const sym of universe) {
    const bars = symbolBars[sym];
    if (!Array.isArray(bars) || bars.length < minBars) continue;
    eligibleSet.add(sym);
    scores.set(sym, 0);
    reasons.set(sym, []);
  }

  // Relative volume contribution
  const relVolRows = relVolScanner(symbolBars, { minRelVol: 1 });
  for (const r of relVolRows) {
    if (!eligibleSet.has(r.symbol)) continue;
    const inc = clamp(r.relVol - 1, 0, 3);
    scores.set(r.symbol, scores.get(r.symbol) + inc);
    reasons.get(r.symbol).push(`relVol=${round(r.relVol, 2)}x`);
  }

  // 52w breakout contribution
  const breakoutRows = breakout52wScanner(symbolBars);
  for (const r of breakoutRows) {
    if (!eligibleSet.has(r.symbol)) continue;
    scores.set(r.symbol, scores.get(r.symbol) + 2);
    reasons.get(r.symbol).push(r.type);
  }

  // Overnight gap contribution
  const gapRows = gapScanner(symbolBars, { minPct: 1 });
  for (const r of gapRows) {
    if (!eligibleSet.has(r.symbol)) continue;
    const inc = clamp(Math.abs(r.gapPct) / 2, 0, 3);
    scores.set(r.symbol, scores.get(r.symbol) + inc);
    reasons.get(r.symbol).push(`gap=${round(r.gapPct, 2)}%`);
  }

  // Liquidity floor + candidate row construction
  const survivors = [];
  for (const sym of eligibleSet) {
    const bars = symbolBars[sym];
    const tail = bars.slice(-20);
    const avgDv =
      tail.reduce((s, b) => s + b.close * (b.volume || 0), 0) / Math.max(1, tail.length);
    if (avgDv < liquidityFloor) continue;
    const last = bars[bars.length - 1];
    survivors.push({
      symbol: sym,
      score: round(scores.get(sym), 2),
      reasons: reasons.get(sym),
      avgDollarVol20d: Math.round(avgDv),
      lastClose: round(last.close, 2),
      lastDate: last.date,
    });
  }

  // Deterministic sort: score desc, then symbol asc
  survivors.sort((a, b) => b.score - a.score || a.symbol.localeCompare(b.symbol));

  const latestDate = survivors.reduce(
    (acc, r) => (acc === null || r.lastDate > acc ? r.lastDate : acc),
    null,
  );

  return {
    generatedAt: latestDate,
    universeSize: universe.length,
    eligible: eligibleSet.size,
    survivors: survivors.length,
    topN: survivors.slice(0, topN),
    allScores: survivors,
  };
}

function clamp(x, lo, hi) {
  if (!Number.isFinite(x)) return 0;
  return Math.max(lo, Math.min(hi, x));
}

function round(x, d) {
  const p = 10 ** d;
  return Math.round(x * p) / p;
}
