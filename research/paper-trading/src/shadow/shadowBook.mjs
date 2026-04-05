// Shadow trading ("forward paper" / simulated live).
//
// How it works:
//   1. `open()` records a hypothetical trade at the CURRENT market price,
//      along with a stop and target. Nothing is routed anywhere.
//   2. The position sits in journal/shadow-book.jsonl as "open".
//   3. `evaluate()` pulls recent bars from the data router and checks, for
//      each open shadow, whether the stop or target was hit (using the
//      conservative high/low of each subsequent bar). If so, marks the
//      shadow as closed with the fill price.
//   4. `report()` aggregates closed shadows into win rate / expectancy /
//      total PnL / by-setup breakdown — same shape as the manual edge
//      report so you can compare "what the agent would have done" against
//      "what you actually did".
//
// This is the bridge between backtest and live trading. It generates a real
// forward track record using real forward data, but never places an order.

import { mkdir, appendFile, readFile, writeFile } from "node:fs/promises";
import { existsSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { randomUUID } from "node:crypto";
import { fetchBars } from "../data/multiSource.mjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const BOOK = path.resolve(__dirname, "../../journal/shadow-book.jsonl");

/** Get the latest available close for a symbol from the data router. */
export async function currentPrice(symbol) {
  const to = new Date().toISOString().slice(0, 10);
  const from = new Date(Date.now() - 30 * 86400_000).toISOString().slice(0, 10);
  const { bars, source } = await fetchBars(symbol, from, to);
  const last = bars[bars.length - 1];
  return { price: last.close, asOf: last.date, source };
}

/** Open a shadow trade. `entry` is optional — if omitted, uses live close. */
export async function openShadow({ symbol, side, qty, stop, target, setup, reason = "", entry = null }) {
  if (!["BUY", "SHORT"].includes(side)) throw new Error("side must be BUY or SHORT");
  if (!(qty > 0)) throw new Error("qty > 0 required");
  let entryPrice = entry, asOf, source;
  if (entry == null) {
    const px = await currentPrice(symbol);
    entryPrice = px.price; asOf = px.asOf; source = px.source;
  } else {
    asOf = new Date().toISOString().slice(0, 10);
    source = "user-supplied";
  }
  if (side === "BUY" && (stop >= entryPrice || target <= entryPrice)) throw new Error("BUY: stop<entry<target required");
  if (side === "SHORT" && (stop <= entryPrice || target >= entryPrice)) throw new Error("SHORT: target<entry<stop required");
  const rec = {
    shadowId: randomUUID(),
    status: "open",
    symbol, side, qty,
    entry: round(entryPrice, 4),
    entryDate: asOf,
    stop, target, setup, reason,
    source,
    openedAt: new Date().toISOString(),
  };
  await mkdir(path.dirname(BOOK), { recursive: true });
  await appendFile(BOOK, JSON.stringify(rec) + "\n");
  return rec;
}

export async function readBook() {
  if (!existsSync(BOOK)) return [];
  const raw = await readFile(BOOK, "utf8");
  return raw.trim().split("\n").filter(Boolean).map((l) => JSON.parse(l));
}

async function writeBook(items) {
  await writeFile(BOOK, items.map((i) => JSON.stringify(i)).join("\n") + "\n");
}

/** Evaluate all open shadows: walk bars from entryDate forward, check stop/target hits. */
export async function evaluateBook({ todayISO = new Date().toISOString().slice(0, 10) } = {}) {
  const items = await readBook();
  let updated = 0;
  for (const rec of items) {
    if (rec.status !== "open") continue;
    const from = rec.entryDate;
    let bars;
    try {
      const r = await fetchBars(rec.symbol, from, todayISO);
      bars = r.bars;
    } catch (e) {
      rec.lastError = `fetch failed: ${e.message}`;
      continue;
    }
    // Start from the bar AFTER entry date (no same-day look-ahead on entry)
    const future = bars.filter((b) => b.date > from);
    const long = rec.side === "BUY";
    let hit = null;
    for (const b of future) {
      const stopHit = long ? b.low <= rec.stop : b.high >= rec.stop;
      const targetHit = long ? b.high >= rec.target : b.low <= rec.target;
      // Conservative rule: if both would hit on the same bar, assume stop hit first.
      if (stopHit && targetHit) { hit = { date: b.date, price: rec.stop, outcome: "stop (conservative)" }; break; }
      if (stopHit) { hit = { date: b.date, price: rec.stop, outcome: "stop" }; break; }
      if (targetHit) { hit = { date: b.date, price: rec.target, outcome: "target" }; break; }
    }
    if (hit) {
      const pnl = (long ? hit.price - rec.entry : rec.entry - hit.price) * rec.qty;
      Object.assign(rec, {
        status: "closed",
        exit: hit.price,
        exitDate: hit.date,
        outcome: hit.outcome,
        pnl: round(pnl, 2),
        rMultiple: round(
          (long ? hit.price - rec.entry : rec.entry - hit.price) /
            Math.abs(rec.entry - rec.stop),
          2,
        ),
        closedAt: new Date().toISOString(),
      });
      updated++;
    }
  }
  await writeBook(items);
  return { updated, total: items.length };
}

export async function shadowReport() {
  const items = await readBook();
  const closed = items.filter((x) => x.status === "closed");
  if (!closed.length) return { shadowTrades: items.length, closed: 0, note: "No closed shadows yet. Run evaluate." };
  const wins = closed.filter((x) => x.pnl > 0);
  const losses = closed.filter((x) => x.pnl <= 0);
  const total = closed.reduce((s, x) => s + x.pnl, 0);
  const avgWin = wins.length ? wins.reduce((s, x) => s + x.pnl, 0) / wins.length : 0;
  const avgLoss = losses.length ? losses.reduce((s, x) => s + x.pnl, 0) / losses.length : 0;
  const winRate = wins.length / closed.length;

  const bySetup = {};
  for (const t of closed) {
    const k = t.setup || "(no-setup)";
    (bySetup[k] ||= []).push(t);
  }
  const setupStats = Object.fromEntries(
    Object.entries(bySetup).map(([k, arr]) => [k, {
      n: arr.length,
      winRate: round(arr.filter((x) => x.pnl > 0).length / arr.length, 3),
      totalPnl: round(arr.reduce((s, x) => s + x.pnl, 0), 2),
      avgR: round(arr.reduce((s, x) => s + (x.rMultiple ?? 0), 0) / arr.length, 2),
    }]),
  );

  return {
    shadowTrades: items.length,
    open: items.length - closed.length,
    closed: closed.length,
    winRatePct: round(winRate * 100, 1),
    avgWin: round(avgWin, 2),
    avgLoss: round(avgLoss, 2),
    expectancy: round(winRate * avgWin + (1 - winRate) * avgLoss, 2),
    totalPnl: round(total, 2),
    bySetup: setupStats,
    honesty: closed.length < 30
      ? "Fewer than 30 closed shadows. Results are noise-dominated."
      : "Closed sample ≥ 30. Still treat as noisy.",
  };
}

function round(x, d) { const p = 10 ** d; return Math.round(x * p) / p; }
