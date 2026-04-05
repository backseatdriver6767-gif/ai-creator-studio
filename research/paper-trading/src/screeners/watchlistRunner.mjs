// Watchlist runner — the I/O sibling of `watchlistBuilder.mjs`.
//
// Responsibilities:
//   1. Load the universe from `data/universe.json`.
//   2. Fetch ~300 daily bars for every symbol via multiSource.fetchBars.
//   3. Call the pure `buildWatchlist` reducer.
//   4. Append the result as one JSON line to `journal/watchlist.jsonl`.
//   5. Also return the latest entry so callers (CLI, cron) can consume it
//      without re-reading the file.
//
// Failure policy: per-symbol fetch failures are logged and swallowed. We
// continue with whatever we have. The run itself only fails if the
// universe file is missing or the builder throws.

import { mkdir, appendFile, readFile } from "node:fs/promises";
import { existsSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { fetchBars } from "../data/multiSource.mjs";
import { buildWatchlist } from "./watchlistBuilder.mjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "../..");
const JOURNAL_DIR = path.resolve(ROOT, "journal");
const WATCHLIST_FILE = path.join(JOURNAL_DIR, "watchlist.jsonl");
const UNIVERSE_FILE = path.resolve(ROOT, "data/universe.json");

const DEFAULT_LOOKBACK_DAYS = 400; // ~18 months of trading to cover 252-bar 52w screener

async function ensureDir() {
  await mkdir(JOURNAL_DIR, { recursive: true });
}

/** Load the default universe from disk. Pure I/O. */
export async function loadDefaultUniverse() {
  if (!existsSync(UNIVERSE_FILE)) {
    throw new Error(`universe file not found: ${UNIVERSE_FILE}`);
  }
  const raw = await readFile(UNIVERSE_FILE, "utf8");
  const parsed = JSON.parse(raw);
  if (!Array.isArray(parsed.symbols)) {
    throw new Error(`universe file malformed: expected .symbols array`);
  }
  return parsed;
}

function isoAgo(days) {
  const d = new Date();
  d.setUTCDate(d.getUTCDate() - days);
  return d.toISOString().slice(0, 10);
}

function todayIso() {
  return new Date().toISOString().slice(0, 10);
}

/**
 * Fetch daily bars for every symbol in the universe. Returns
 * `{ symbolBars, fetchErrors }`. Per-symbol failures are logged into
 * `fetchErrors` and omitted from `symbolBars`.
 */
export async function fetchUniverseBars(symbols, { lookbackDays = DEFAULT_LOOKBACK_DAYS } = {}) {
  const fromISO = isoAgo(lookbackDays);
  const toISO = todayIso();
  const symbolBars = {};
  const fetchErrors = [];
  for (const sym of symbols) {
    try {
      const { bars } = await fetchBars(sym, fromISO, toISO, { strict: false });
      if (Array.isArray(bars) && bars.length > 0) {
        symbolBars[sym] = bars;
      } else {
        fetchErrors.push({ symbol: sym, error: "empty bars" });
      }
    } catch (e) {
      fetchErrors.push({ symbol: sym, error: e?.message ?? String(e) });
    }
  }
  return { symbolBars, fetchErrors };
}

/**
 * End-to-end: load universe → fetch bars → score → append JSONL.
 * Returns the entry that was appended.
 */
export async function runWatchlistBuild({ topN = 5, lookbackDays = DEFAULT_LOOKBACK_DAYS } = {}) {
  const universe = await loadDefaultUniverse();
  const { symbolBars, fetchErrors } = await fetchUniverseBars(universe.symbols, { lookbackDays });
  const result = buildWatchlist(symbolBars, { topN });

  const entry = {
    ts: new Date().toISOString(),
    date: todayIso(),
    universe: universe.name,
    universeSize: universe.symbols.length,
    fetched: Object.keys(symbolBars).length,
    fetchErrors: fetchErrors.length,
    fetchErrorDetails: fetchErrors.slice(0, 20), // cap for log hygiene
    eligible: result.eligible,
    survivors: result.survivors,
    topN: result.topN,
  };
  await ensureDir();
  await appendFile(WATCHLIST_FILE, JSON.stringify(entry) + "\n");
  return entry;
}

/** Read the last watchlist entry. Returns null if the log is empty. */
export async function readLatestWatchlist() {
  if (!existsSync(WATCHLIST_FILE)) return null;
  const raw = await readFile(WATCHLIST_FILE, "utf8");
  const lines = raw.trim().split("\n").filter(Boolean);
  if (lines.length === 0) return null;
  return JSON.parse(lines[lines.length - 1]);
}
