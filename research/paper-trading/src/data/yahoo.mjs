// Legacy Yahoo daily-bar entry point.
//
// The original implementation called Yahoo's v7 CSV download endpoint
// directly. That endpoint started returning 401 Unauthorized in 2025/2026
// and is effectively dead for anonymous use. Rather than duplicate the
// v8 fallback logic everywhere, this module now delegates to the shared
// multiSource router which knows about yahoo-v8 first, then synthetic
// fallbacks, optionally stooq / yahoo-v7 behind an env flag.
//
// Call sites continue to import { fetchDailyBars, splitBars } from
// "./data/yahoo.mjs" and see no behavior change beyond the fact that
// they now actually work.

import { fetchBars } from "./multiSource.mjs";

/** @typedef {{ date: string, open: number, high: number, low: number, close: number, volume: number }} Bar */

/**
 * Fetch daily OHLC bars for a symbol between two ISO dates (inclusive).
 * Delegates to multiSource.fetchBars, which handles caching, failover,
 * and integrity checks. Returns just the bars array for backwards
 * compatibility with existing call sites.
 */
export async function fetchDailyBars(symbol, fromISO, toISO) {
  const { bars } = await fetchBars(symbol, fromISO, toISO);
  return bars;
}

/** Split bars into train/test at a fractional point (default 70/30). */
export function splitBars(bars, trainFrac = 0.7) {
  const cut = Math.floor(bars.length * trainFrac);
  return { train: bars.slice(0, cut), test: bars.slice(cut) };
}
