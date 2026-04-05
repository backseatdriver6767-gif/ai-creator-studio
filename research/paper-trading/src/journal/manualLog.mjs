// Manual trade logger. THIS IS THE MOST IMPORTANT FILE IN THE HARNESS.
//
// You log trades you actually placed in your own broker. Over time this
// dataset tells you whether you have an edge. Nothing else in this repo
// matters if you don't do this honestly.
//
// Entries are append-only JSON lines in journal/manual-trades.jsonl.

import { mkdir, appendFile, readFile } from "node:fs/promises";
import { existsSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { randomUUID } from "node:crypto";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const FILE = path.resolve(__dirname, "../../journal/manual-trades.jsonl");

/**
 * Log a trade leg. For round-trips, call once for entry and once for exit
 * and link them by `tradeId`.
 */
export async function logManualTrade({
  tradeId = randomUUID(),
  symbol,
  side,         // "BUY" | "SELL" | "SHORT" | "COVER"
  qty,
  price,
  stop = null,
  target = null,
  setup = null, // e.g. "ORB long"
  reason = null,
  emotion = null, // "calm" | "fomo" | "revenge" | "tilt" | ...
  plannedRisk = null, // dollars
  timestamp = new Date().toISOString(),
}) {
  await mkdir(path.dirname(FILE), { recursive: true });
  const entry = {
    tradeId, symbol, side, qty, price, stop, target, setup, reason, emotion,
    plannedRisk, timestamp,
  };
  await appendFile(FILE, JSON.stringify(entry) + "\n");
  return entry;
}

export async function readAllTrades() {
  if (!existsSync(FILE)) return [];
  const raw = await readFile(FILE, "utf8");
  return raw.trim().split("\n").filter(Boolean).map((l) => JSON.parse(l));
}

/** Pair up entries and exits by tradeId and compute per-trade pnl. */
export async function roundTripTrades() {
  const all = await readAllTrades();
  /** @type {Record<string, any>} */
  const byId = {};
  for (const t of all) {
    if (!byId[t.tradeId]) byId[t.tradeId] = { legs: [] };
    byId[t.tradeId].legs.push(t);
  }
  const trips = [];
  for (const [id, { legs }] of Object.entries(byId)) {
    const entry = legs.find((l) => l.side === "BUY" || l.side === "SHORT");
    const exit = legs.find((l) => l.side === "SELL" || l.side === "COVER");
    if (!entry || !exit) continue;
    const long = entry.side === "BUY";
    const pnl = (long ? exit.price - entry.price : entry.price - exit.price) * entry.qty;
    const held = (new Date(exit.timestamp) - new Date(entry.timestamp)) / 60000;
    trips.push({
      tradeId: id,
      symbol: entry.symbol,
      direction: long ? "LONG" : "SHORT",
      entry: entry.price,
      exit: exit.price,
      qty: entry.qty,
      pnl: round(pnl, 2),
      setup: entry.setup,
      reason: entry.reason,
      emotion: entry.emotion,
      plannedRisk: entry.plannedRisk,
      heldMinutes: Math.round(held),
      entryAt: entry.timestamp,
      exitAt: exit.timestamp,
    });
  }
  return trips;
}

function round(x, d) {
  const p = 10 ** d;
  return Math.round(x * p) / p;
}
