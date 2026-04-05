// Trade journal query layer.
//
// The journal (journal.mjs) is append-only JSONL — every fill, every run
// summary. That is the canonical, durable format, but it is awful to read
// by eye. This module adds a small query layer on top: load all lines,
// filter by symbol / strategy / date range / side / pnl sign, aggregate
// into symbol- or strategy-level edge stats, and render compact tables.
//
// Everything here is pure read-only — this module NEVER writes to the
// journal. Writes go through journal.mjs / manualLog.mjs exclusively.

import { readFile } from "node:fs/promises";
import { existsSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const JOURNAL_DIR = path.resolve(__dirname, "../../journal");
const TRADES_FILE = path.join(JOURNAL_DIR, "trades.jsonl");
const RUNS_FILE = path.join(JOURNAL_DIR, "runs.jsonl");

/** Low-level JSONL loader. Returns [] if the file does not exist. */
async function loadJsonl(filePath) {
  if (!existsSync(filePath)) return [];
  const raw = await readFile(filePath, "utf8");
  const out = [];
  for (const line of raw.split("\n")) {
    const s = line.trim();
    if (!s) continue;
    try { out.push(JSON.parse(s)); }
    catch { /* skip corrupt lines silently — this is a query path */ }
  }
  return out;
}

/** Load every fill ever logged. */
export async function loadAllFills() {
  return loadJsonl(TRADES_FILE);
}

/** Load every run summary ever logged. */
export async function loadAllRuns() {
  return loadJsonl(RUNS_FILE);
}

/**
 * Filter fills by any combination of criteria. All filters are AND-ed.
 *
 * @param {Object} filters
 * @param {string}   [filters.symbol]       Exact match
 * @param {string}   [filters.strategy]     Exact match
 * @param {string}   [filters.runId]        Exact match
 * @param {string}   [filters.side]         "BUY" | "SELL"
 * @param {string}   [filters.from]         ISO date lower bound (inclusive, by fill.date)
 * @param {string}   [filters.to]           ISO date upper bound (inclusive, by fill.date)
 * @param {number}   [filters.limit]        Keep only the last N after filtering
 */
export function filterFills(fills, filters = {}) {
  let rows = fills;
  if (filters.symbol)   rows = rows.filter((r) => r.symbol === filters.symbol);
  if (filters.strategy) rows = rows.filter((r) => r.strategy === filters.strategy);
  if (filters.runId)    rows = rows.filter((r) => r.runId === filters.runId);
  if (filters.side)     rows = rows.filter((r) => r.side === filters.side);
  if (filters.from)     rows = rows.filter((r) => (r.date ?? r.ts?.slice(0, 10)) >= filters.from);
  if (filters.to)       rows = rows.filter((r) => (r.date ?? r.ts?.slice(0, 10)) <= filters.to);
  if (filters.limit && rows.length > filters.limit) rows = rows.slice(-filters.limit);
  return rows;
}

/**
 * Collapse a sequence of fills into round-trip trades. A round trip is
 * BUY → matching SELL (same symbol, same strategy, same runId). Partial
 * closeouts are not modelled here — the backtest engine only emits full
 * position changes so this is adequate for its output.
 *
 * Returned shape per round trip:
 *   { symbol, strategy, runId, entryDate, exitDate, qty, entry, exit,
 *     pnlPct, pnlAbs, holdingDays }
 */
export function roundTrips(fills) {
  const key = (r) => `${r.runId ?? ""}::${r.strategy ?? ""}::${r.symbol ?? ""}`;
  const open = new Map();
  const out = [];
  for (const f of fills) {
    const k = key(f);
    if (f.side === "BUY") {
      open.set(k, f);
    } else if (f.side === "SELL" && open.has(k)) {
      const b = open.get(k);
      open.delete(k);
      const qty = Number(f.qty ?? b.qty ?? 0);
      const entry = Number(b.price);
      const exit = Number(f.price);
      const pnlPct = entry > 0 ? (exit - entry) / entry : 0;
      const pnlAbs = (exit - entry) * qty;
      const entryDate = b.date ?? b.ts?.slice(0, 10) ?? null;
      const exitDate  = f.date ?? f.ts?.slice(0, 10) ?? null;
      const holdingDays = entryDate && exitDate
        ? Math.max(0, Math.round((Date.parse(exitDate) - Date.parse(entryDate)) / 86400_000))
        : null;
      out.push({
        symbol: f.symbol,
        strategy: f.strategy,
        runId: f.runId,
        entryDate, exitDate, qty,
        entry, exit,
        pnlPct: round(pnlPct, 6),
        pnlAbs: round(pnlAbs, 2),
        holdingDays,
      });
    }
  }
  return out;
}

/**
 * Aggregate round trips into an edge summary, optionally grouped by a
 * field ("symbol" | "strategy" | "setup" | null for overall).
 */
export function edgeSummary(trips, groupBy = null) {
  if (!groupBy) return [oneGroup("all", trips)];
  const buckets = new Map();
  for (const t of trips) {
    const k = t[groupBy] ?? "unknown";
    if (!buckets.has(k)) buckets.set(k, []);
    buckets.get(k).push(t);
  }
  return [...buckets.entries()]
    .map(([k, group]) => oneGroup(k, group))
    .sort((a, b) => b.expectancyR - a.expectancyR);
}

function oneGroup(label, trips) {
  if (!trips.length) {
    return { key: label, trades: 0, winRatePct: 0, avgWinPct: 0, avgLossPct: 0,
             expectancyR: 0, totalPnlAbs: 0, avgHoldingDays: 0 };
  }
  const wins = trips.filter((t) => t.pnlPct > 0);
  const losses = trips.filter((t) => t.pnlPct < 0);
  const winRate = wins.length / trips.length;
  const avgWin = wins.length ? wins.reduce((s, t) => s + t.pnlPct, 0) / wins.length : 0;
  const avgLoss = losses.length ? losses.reduce((s, t) => s + t.pnlPct, 0) / losses.length : 0;
  // Expectancy in units of "average loss" — the classic R-multiple notion.
  const expectancyR = avgLoss !== 0 ? (winRate * avgWin + (1 - winRate) * avgLoss) / Math.abs(avgLoss) : 0;
  const totalPnlAbs = trips.reduce((s, t) => s + (t.pnlAbs ?? 0), 0);
  const avgHold = trips.filter((t) => t.holdingDays != null).reduce((s, t) => s + t.holdingDays, 0) / Math.max(1, trips.filter((t) => t.holdingDays != null).length);
  return {
    key: label,
    trades: trips.length,
    winRatePct: round(winRate * 100, 2),
    avgWinPct: round(avgWin * 100, 2),
    avgLossPct: round(avgLoss * 100, 2),
    expectancyR: round(expectancyR, 3),
    totalPnlAbs: round(totalPnlAbs, 2),
    avgHoldingDays: round(avgHold, 1),
  };
}

function round(x, d) {
  if (!Number.isFinite(x)) return 0;
  const p = 10 ** d;
  return Math.round(x * p) / p;
}
