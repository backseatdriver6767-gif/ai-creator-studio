// Hypothetical-money account ledger.
//
// This is the "bank account" view of the paper-trading harness. It is a
// thin event-sourced ledger that consumes closed shadow trades and manual
// journal trades, and reduces them into a current equity number and a time
// series for the dashboard.
//
// Guarantees:
//   - Immutable, append-only. We NEVER rewrite history lines.
//   - Idempotent sync: each trade is credited exactly once, keyed by
//     `shadowId` (shadow trades) or `tradeId` (manual trades).
//   - No live money. The word "account" here means a number in a JSONL
//     file. There is no broker, no custody, no wire transfer path.

import { mkdir, appendFile, readFile } from "node:fs/promises";
import { existsSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const JOURNAL_DIR = path.resolve(__dirname, "../../journal");
const ACCOUNT_FILE = path.join(JOURNAL_DIR, "account.jsonl");
const SHADOW_FILE = path.join(JOURNAL_DIR, "shadow-book.jsonl");
const MANUAL_FILE = path.join(JOURNAL_DIR, "manual-trades.jsonl");

const DEFAULT_STARTING_BALANCE = 10_000;

async function ensureDir() {
  await mkdir(JOURNAL_DIR, { recursive: true });
}

async function readJsonl(file) {
  if (!existsSync(file)) return [];
  const raw = await readFile(file, "utf8");
  return raw.trim().split("\n").filter(Boolean).map((l) => JSON.parse(l));
}

async function appendEvent(ev) {
  await ensureDir();
  await appendFile(ACCOUNT_FILE, JSON.stringify(ev) + "\n");
}

/** Read the raw event log. Returns a new array. */
export async function readAccountEvents() {
  return readJsonl(ACCOUNT_FILE);
}

/** True if the account has been initialized at least once. */
export async function isInitialized() {
  const events = await readAccountEvents();
  return events.some((e) => e.type === "init");
}

/**
 * Initialize the account. Idempotent unless `force` is passed, in which case
 * it writes a fresh init event (creating a new "era"). Returns the init event.
 */
export async function initAccount({ startingBalance = DEFAULT_STARTING_BALANCE, force = false } = {}) {
  if (!(startingBalance > 0)) throw new Error("startingBalance must be > 0");
  const already = await isInitialized();
  if (already && !force) {
    throw new Error("account already initialized; pass force=true to reset");
  }
  const ev = {
    type: "init",
    ts: new Date().toISOString(),
    startingBalance,
    currency: "USD",
  };
  await appendEvent(ev);
  return ev;
}

/**
 * Pure reducer: collapses an event log plus an optional open-positions count
 * into a state snapshot. Side-effect free so it's trivially testable.
 */
export function reduceEvents(events, { openPositions = 0 } = {}) {
  const initIdx = events.findLastIndex((e) => e.type === "init");
  if (initIdx < 0) {
    return {
      initialized: false,
      startingBalance: 0,
      realizedPnl: 0,
      equity: 0,
      returnPct: 0,
      closedTrades: 0,
      openTrades: openPositions,
    };
  }
  const init = events[initIdx];
  const tail = events.slice(initIdx + 1);
  let realized = 0;
  let closed = 0;
  for (const e of tail) {
    if (e.type === "trade-closed" && Number.isFinite(e.pnl)) {
      realized += e.pnl;
      closed += 1;
    }
  }
  const equity = init.startingBalance + realized;
  const returnPct = (realized / init.startingBalance) * 100;
  return {
    initialized: true,
    startingBalance: init.startingBalance,
    currency: init.currency ?? "USD",
    startedAt: init.ts,
    realizedPnl: round(realized, 2),
    equity: round(equity, 2),
    returnPct: round(returnPct, 2),
    closedTrades: closed,
    openTrades: openPositions,
  };
}

/**
 * Reduce all events into the current state. Thin disk-backed wrapper around
 * `reduceEvents` that also counts currently-open shadow positions.
 */
export async function currentEquity() {
  const events = await readAccountEvents();
  const shadows = await readJsonl(SHADOW_FILE);
  const openPositions = shadows.filter((s) => s.status === "open").length;
  return reduceEvents(events, { openPositions });
}

/**
 * Sync the ledger with the shadow blotter and manual trade log. Idempotent:
 * existing closed-trade events are keyed by shadowId / tradeId, so repeat
 * runs are no-ops.
 * Returns { added: number, skipped: number }.
 */
export async function syncFromSources() {
  const initialized = await isInitialized();
  if (!initialized) {
    throw new Error("account not initialized; run initAccount() first");
  }
  const events = await readAccountEvents();
  const creditedKeys = new Set(
    events
      .filter((e) => e.type === "trade-closed" && e.key)
      .map((e) => e.key),
  );

  const shadows = await readJsonl(SHADOW_FILE);
  const manuals = await readJsonl(MANUAL_FILE);

  const candidates = [];
  for (const s of shadows) {
    if (s.status === "closed" && Number.isFinite(s.pnl) && s.shadowId) {
      candidates.push({
        key: `shadow:${s.shadowId}`,
        source: "shadow",
        symbol: s.symbol,
        side: s.side,
        qty: s.qty,
        entry: s.entry,
        exit: s.exit,
        pnl: s.pnl,
        closedAt: s.closedAt ?? s.exitDate ?? s.openedAt,
        setup: s.setup ?? null,
      });
    }
  }
  for (const m of manuals) {
    if (Number.isFinite(m.pnl) && m.tradeId) {
      candidates.push({
        key: `manual:${m.tradeId}`,
        source: "manual",
        symbol: m.symbol,
        side: m.direction,
        qty: m.qty ?? null,
        entry: m.entry ?? null,
        exit: m.exit ?? null,
        pnl: m.pnl,
        closedAt: m.exitAt ?? m.entryAt,
        setup: m.setup ?? null,
      });
    }
  }

  // Deterministic order: oldest first by closedAt.
  candidates.sort((a, b) => (a.closedAt ?? "").localeCompare(b.closedAt ?? ""));

  let added = 0;
  let skipped = 0;
  for (const c of candidates) {
    if (creditedKeys.has(c.key)) {
      skipped += 1;
      continue;
    }
    await appendEvent({
      type: "trade-closed",
      ts: new Date().toISOString(),
      ...c,
    });
    creditedKeys.add(c.key);
    added += 1;
  }
  return { added, skipped };
}

/**
 * Pure: build the equity time series from an event log. Side-effect free.
 */
export function buildEquityHistory(events) {
  const initIdx = events.findLastIndex((e) => e.type === "init");
  if (initIdx < 0) return [];
  const init = events[initIdx];
  const tail = events
    .slice(initIdx + 1)
    .filter((e) => e.type === "trade-closed" && Number.isFinite(e.pnl))
    .slice()
    .sort((a, b) => (a.closedAt ?? "").localeCompare(b.closedAt ?? ""));
  const series = [
    { t: init.ts, equity: round(init.startingBalance, 2), delta: 0, key: "init" },
  ];
  let running = init.startingBalance;
  for (const e of tail) {
    running += e.pnl;
    series.push({
      t: e.closedAt ?? e.ts,
      equity: round(running, 2),
      delta: round(e.pnl, 2),
      key: e.key,
    });
  }
  return series;
}

/**
 * Equity history as a time series. Disk-backed wrapper around
 * `buildEquityHistory`.
 */
export async function equityHistory() {
  const events = await readAccountEvents();
  return buildEquityHistory(events);
}

function round(x, d) {
  const p = 10 ** d;
  return Math.round(x * p) / p;
}
