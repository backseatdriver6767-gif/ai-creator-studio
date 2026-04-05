// Auto-promoter — turns watchlist picks into shadow trades by running them
// through registered strategies + the pre-trade checklist.
//
// Pipeline per symbol:
//   1. Walk daily bars through each registered strategy's reducer.
//   2. Detect a *fresh* signal — a FLAT → LONG transition on the last bar.
//      (Already-LONG positions are ignored; we only promote NEW entries.)
//   3. Compute an ATR-based stop (2 × ATR) and a 2R target.
//   4. Size via fixed-risk-per-trade sizing against account equity.
//   5. Run `preTradeChecklist` for the GO/NO-GO decision (heat, R:R, events,
//      trade count, setup edge — all the usual hygiene rules).
//   6. Return a structured report { promoted, rejected, skipped }.
//
// The I/O wrapper `runAutoPromote()` also:
//   - Refuses to re-open a shadow trade for a (symbol, setup) pair that is
//     already open in the shadow book (dedup across runs).
//   - Calls `openShadow()` ONCE per promoted plan when dryRun=false.
//   - Appends a full audit record to `journal/promotions.jsonl`.
//
// This module NEVER places a real order. It only writes to local JSONL.

import { mkdir, appendFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { fetchBars } from "../data/multiSource.mjs";
import { atrStop, fixedRiskSize } from "../risk/fixedRisk.mjs";
import { preTradeChecklist } from "./preTradeChecklist.mjs";
import { smaCrossover } from "../strategies/smaCrossover.mjs";
import { rsiMeanReversion } from "../strategies/rsiMeanReversion.mjs";
import { readBook, openShadow } from "../shadow/shadowBook.mjs";
import { readLatestWatchlist } from "../screeners/watchlistRunner.mjs";
import { currentEquity } from "../journal/account.mjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const JOURNAL_DIR = path.resolve(__dirname, "../../journal");
const PROMOTIONS_FILE = path.join(JOURNAL_DIR, "promotions.jsonl");

// Minimum bar count we need for the combined slow-SMA + ATR + RSI pipeline.
// slow SMA = 50, ATR(14) needs 15 bars, RSI(14) needs 15 → 55 is comfortable.
const MIN_BARS = 55;

// Default per-trade risk if nothing overrides it.
const DEFAULT_RISK_PCT = 0.01;

// Default auto-promote caps. Deliberately tighter than the checklist so the
// promoter is conservative even if checklist rules drift over time.
const DEFAULT_MAX_PER_DAY = 3;

// -----------------------------------------------------------------------------
// Strategy registry
// -----------------------------------------------------------------------------

/**
 * Strategies the auto-promoter will evaluate. Each entry has:
 *   - setup: the setup name stamped onto the plan + shadow record. Used for
 *     dedup and edge stats.
 *   - factory: builds a strategy object `{ name, init, onBar }`.
 *
 * Keep this list small and composable. Strategies must only use price bars —
 * anything needing fundamentals, options, or calendar data belongs elsewhere.
 */
export const DEFAULT_STRATEGIES = [
  { setup: "sma_crossover", factory: () => smaCrossover({ fast: 20, slow: 50 }) },
  {
    setup: "rsi_reversion",
    factory: () => rsiMeanReversion({ period: 14, buyBelow: 30, sellAbove: 55 }),
  },
];

// -----------------------------------------------------------------------------
// Pure helpers (no I/O)
// -----------------------------------------------------------------------------

/**
 * Walk every bar through `strategy.onBar`, returning the array of per-bar
 * signals. Pure; the strategy state is confined to this call.
 *
 * @param {{ init: Function, onBar: Function }} strategy
 * @param {Array} bars
 * @returns {Array<"LONG"|"FLAT"|"SHORT">}
 */
export function replayStrategy(strategy, bars) {
  const state = strategy.init();
  const out = new Array(bars.length);
  for (let i = 0; i < bars.length; i++) {
    out[i] = strategy.onBar(bars[i], state);
  }
  return out;
}

/**
 * A signal is "fresh" when the strategy was FLAT on the second-to-last bar
 * and LONG on the last bar. This guards against promoting positions the
 * strategy has already been long on for days.
 *
 * @param {Array<string>} signals
 * @returns {"LONG"|null}
 */
export function detectFreshLongSignal(signals) {
  if (signals.length < 2) return null;
  const prev = signals[signals.length - 2];
  const curr = signals[signals.length - 1];
  if (curr === "LONG" && prev !== "LONG") return "LONG";
  return null;
}

function round(x, d = 4) {
  const p = 10 ** d;
  return Math.round(x * p) / p;
}

/**
 * Build a candidate trade plan from bars + sizing context. Pure.
 *
 * Returns null if the bars are too short or ATR-stop is unusable. Otherwise
 * returns `{ plan, sizing }` where plan is the shape `validatePlan` expects.
 *
 * @param {object} args
 * @param {string} args.symbol
 * @param {Array} args.bars
 * @param {string} args.setup
 * @param {number} args.equity
 * @param {number} args.riskPct
 */
export function buildLongPlan({ symbol, bars, setup, equity, riskPct = DEFAULT_RISK_PCT }) {
  if (!Array.isArray(bars) || bars.length < MIN_BARS) return null;
  const last = bars[bars.length - 1];
  const entry = last.close;
  const stop = atrStop({ bars, period: 14, multiplier: 2, direction: "LONG" });
  if (stop == null || !(stop > 0) || stop >= entry) return null;
  const riskPerShare = entry - stop;
  const target = entry + 2 * riskPerShare; // 2R target → R:R = 2.0
  const sizing = fixedRiskSize({ equity, riskPct, entry, stop });
  if (!(sizing.shares > 0)) return null;
  const plan = {
    symbol,
    side: "BUY",
    qty: sizing.shares,
    entry: round(entry, 4),
    stop: round(stop, 4),
    target: round(target, 4),
    setup,
    reason: `auto-promoted by ${setup} on ${last.date}`,
  };
  return { plan, sizing, asOf: last.date };
}

/**
 * Convert open shadow records into the `{symbol, shares, entry, stop}` shape
 * `preTradeChecklist.portfolioHeat` wants.
 */
export function openShadowsToPositions(book) {
  return (book || [])
    .filter((rec) => rec.status === "open")
    .map((rec) => ({
      symbol: rec.symbol,
      shares: rec.qty,
      entry: rec.entry,
      stop: rec.stop,
    }));
}

/**
 * Evaluate one symbol against the full strategy list. Pure.
 *
 * Returns `{ symbol, attempts }` where `attempts` is one entry per strategy
 * tried. Each attempt carries enough context to render on a dashboard.
 *
 * Attempts do NOT call the checklist — the caller does that so it can thread
 * a single mutable `todayPlans` counter + refresh `openPositions` as plans
 * are accepted.
 */
export function evaluateSymbol({ symbol, bars, equity, riskPct, strategies = DEFAULT_STRATEGIES }) {
  const attempts = [];
  if (!Array.isArray(bars) || bars.length < MIN_BARS) {
    attempts.push({
      symbol,
      setup: null,
      ok: false,
      reason: `insufficient bars (${bars?.length ?? 0} < ${MIN_BARS})`,
    });
    return { symbol, attempts };
  }
  for (const { setup, factory } of strategies) {
    const strategy = factory();
    const signals = replayStrategy(strategy, bars);
    const fresh = detectFreshLongSignal(signals);
    if (!fresh) {
      attempts.push({
        symbol,
        setup,
        strategyName: strategy.name,
        ok: false,
        reason: "no fresh LONG signal on last bar",
      });
      continue;
    }
    const built = buildLongPlan({ symbol, bars, setup, equity, riskPct });
    if (!built) {
      attempts.push({
        symbol,
        setup,
        strategyName: strategy.name,
        ok: false,
        reason: "could not build plan (ATR stop / sizing)",
      });
      continue;
    }
    attempts.push({
      symbol,
      setup,
      strategyName: strategy.name,
      ok: true,
      plan: built.plan,
      sizing: built.sizing,
      asOf: built.asOf,
    });
  }
  return { symbol, attempts };
}

// -----------------------------------------------------------------------------
// I/O wrapper
// -----------------------------------------------------------------------------

async function ensureDir() {
  await mkdir(JOURNAL_DIR, { recursive: true });
}

/**
 * @param {object} opts
 * @param {boolean} [opts.dryRun=true] - When true, no shadow trades are opened
 *   and no promotions.jsonl entry is written. Report is still returned.
 * @param {number} [opts.maxPerDay=DEFAULT_MAX_PER_DAY]
 * @param {number} [opts.riskPct=DEFAULT_RISK_PCT]
 * @param {number} [opts.lookbackDays=400]
 * @param {Array}  [opts.strategies=DEFAULT_STRATEGIES]
 * @param {string} [opts.today] - ISO date override for testability.
 */
export async function runAutoPromote({
  dryRun = true,
  maxPerDay = DEFAULT_MAX_PER_DAY,
  riskPct = DEFAULT_RISK_PCT,
  lookbackDays = 400,
  strategies = DEFAULT_STRATEGIES,
  today = new Date().toISOString().slice(0, 10),
} = {}) {
  const report = {
    ts: new Date().toISOString(),
    date: today,
    dryRun,
    maxPerDay,
    riskPct,
    symbolsConsidered: 0,
    promoted: [],
    rejected: [],
    skipped: [],
    errors: [],
  };

  // 1. Load the latest watchlist entry — if none, nothing to promote.
  const latestWatchlist = await readLatestWatchlist();
  if (!latestWatchlist || !Array.isArray(latestWatchlist.topN) || latestWatchlist.topN.length === 0) {
    report.errors.push("no watchlist entry found — run `watchlist-build` first");
    return report;
  }
  const topSymbols = latestWatchlist.topN.map((r) => r.symbol).filter(Boolean);
  report.symbolsConsidered = topSymbols.length;
  report.watchlistDate = latestWatchlist.date;
  report.watchlistUniverse = latestWatchlist.universe;

  // 2. Load account equity + current open shadow positions (for heat + dedup).
  let equity = 10000;
  try {
    const snapshot = await currentEquity();
    if (snapshot?.equity && snapshot.equity > 0) {
      equity = snapshot.equity;
    }
  } catch (e) {
    // Uninitialized account — fall back to default starting balance.
    report.errors.push(`account snapshot unavailable, using fallback equity: ${e?.message ?? e}`);
  }
  report.equity = equity;
  const book = await readBook();
  const openBook = book.filter((r) => r.status === "open");
  const openBySymbolSetup = new Set(
    openBook.map((r) => `${r.symbol}::${r.setup ?? ""}`),
  );
  let openPositions = openShadowsToPositions(openBook);
  let todayPlans = 0;

  // 3. Fetch bars for each top symbol. Per-symbol fetch errors go into
  //    the errors list; we keep going so one flaky ticker doesn't nuke the run.
  const fromISO = isoAgo(lookbackDays);
  const barsBySymbol = {};
  for (const sym of topSymbols) {
    try {
      const r = await fetchBars(sym, fromISO, today, { strict: false });
      if (Array.isArray(r?.bars) && r.bars.length > 0) {
        barsBySymbol[sym] = r.bars;
      } else {
        report.errors.push(`${sym}: empty bars from data router`);
      }
    } catch (e) {
      report.errors.push(`${sym}: fetch failed: ${e?.message ?? e}`);
    }
  }

  // 4. Walk symbols × strategies. For each GO, dedup against already-open
  //    shadow trades and run the checklist with a live-updated portfolio.
  for (const sym of topSymbols) {
    const bars = barsBySymbol[sym];
    if (!bars) {
      report.skipped.push({ symbol: sym, reason: "no bars available" });
      continue;
    }
    const { attempts } = evaluateSymbol({
      symbol: sym,
      bars,
      equity,
      riskPct,
      strategies,
    });
    for (const attempt of attempts) {
      if (!attempt.ok) {
        report.rejected.push({
          symbol: attempt.symbol,
          setup: attempt.setup,
          strategy: attempt.strategyName ?? null,
          reason: attempt.reason,
          stage: "signal",
        });
        continue;
      }
      // Dedup — don't double-enter a setup we already hold.
      const key = `${attempt.symbol}::${attempt.setup}`;
      if (openBySymbolSetup.has(key)) {
        report.skipped.push({
          symbol: attempt.symbol,
          setup: attempt.setup,
          reason: "already have open shadow trade for this setup",
        });
        continue;
      }
      // Promoter-level max-per-day cap.
      if (report.promoted.length >= maxPerDay) {
        report.skipped.push({
          symbol: attempt.symbol,
          setup: attempt.setup,
          reason: `auto-promoter maxPerDay=${maxPerDay} reached`,
        });
        continue;
      }
      // Run the checklist against current portfolio state.
      const checklist = preTradeChecklist(
        {
          plan: attempt.plan,
          equity,
          openPositions,
          today,
          todayPlans,
        },
        {},
      );
      if (checklist.decision !== "GO") {
        report.rejected.push({
          symbol: attempt.symbol,
          setup: attempt.setup,
          strategy: attempt.strategyName,
          reason: checklist.fails.join("; ") || "checklist NO-GO",
          stage: "checklist",
          checks: checklist.checks,
        });
        continue;
      }
      // Accept — record it and optionally open a shadow trade.
      const promotion = {
        symbol: attempt.symbol,
        setup: attempt.setup,
        strategy: attempt.strategyName,
        plan: attempt.plan,
        sizing: attempt.sizing,
        asOf: attempt.asOf,
        checklist: checklist.checks,
        nextEvent: checklist.nextEvent ?? null,
      };
      if (!dryRun) {
        try {
          const rec = await openShadow({
            symbol: attempt.plan.symbol,
            side: attempt.plan.side,
            qty: attempt.plan.qty,
            stop: attempt.plan.stop,
            target: attempt.plan.target,
            setup: attempt.plan.setup,
            reason: attempt.plan.reason,
            entry: attempt.plan.entry, // pin entry — don't re-fetch
          });
          promotion.shadowId = rec.shadowId;
        } catch (e) {
          report.errors.push(
            `openShadow failed for ${attempt.symbol} (${attempt.setup}): ${e?.message ?? e}`,
          );
          // Move this into rejected so the operator can see it.
          report.rejected.push({
            symbol: attempt.symbol,
            setup: attempt.setup,
            strategy: attempt.strategyName,
            reason: `openShadow failed: ${e?.message ?? e}`,
            stage: "open",
          });
          continue;
        }
      }
      report.promoted.push(promotion);
      // Update live state so the next iteration sees the new position.
      openBySymbolSetup.add(key);
      openPositions = [
        ...openPositions,
        {
          symbol: attempt.plan.symbol,
          shares: attempt.plan.qty,
          entry: attempt.plan.entry,
          stop: attempt.plan.stop,
        },
      ];
      todayPlans += 1;
    }
  }

  // 5. Append the report to the promotions log (unless dry run).
  if (!dryRun) {
    try {
      await ensureDir();
      await appendFile(PROMOTIONS_FILE, JSON.stringify(report) + "\n");
    } catch (e) {
      report.errors.push(`failed to append promotions.jsonl: ${e?.message ?? e}`);
    }
  }

  return report;
}

function isoAgo(days) {
  const d = new Date();
  d.setUTCDate(d.getUTCDate() - days);
  return d.toISOString().slice(0, 10);
}

/** Read the latest promotion report (or null). */
export async function readLatestPromotion() {
  const { existsSync } = await import("node:fs");
  const { readFile } = await import("node:fs/promises");
  if (!existsSync(PROMOTIONS_FILE)) return null;
  const raw = await readFile(PROMOTIONS_FILE, "utf8");
  const lines = raw.trim().split("\n").filter(Boolean);
  if (!lines.length) return null;
  return JSON.parse(lines[lines.length - 1]);
}

/** Read all promotion reports (chronological). */
export async function readAllPromotions() {
  const { existsSync } = await import("node:fs");
  const { readFile } = await import("node:fs/promises");
  if (!existsSync(PROMOTIONS_FILE)) return [];
  const raw = await readFile(PROMOTIONS_FILE, "utf8");
  return raw.trim().split("\n").filter(Boolean).map((l) => JSON.parse(l));
}

/** Test-only helper: wipe the promotions log. Not exported from CLI. */
export async function _resetPromotionsForTest() {
  await ensureDir();
  await writeFile(PROMOTIONS_FILE, "");
}
