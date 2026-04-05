// Yahoo daily bars via the v8 chart endpoint (the one the website itself
// uses). Free, unauthenticated, and still working in 2026 — unlike the old
// v7 /finance/download CSV endpoint which now returns 401, and unlike Stooq
// which started gating US tickers behind a "contact us" landing page.
//
// Returns split+dividend adjusted OHLCV bars as:
//   { date: "YYYY-MM-DD", open, high, low, close, volume }
//
// Adjusted close is used for close; open/high/low are scaled by the same
// adjustment factor so candles remain internally consistent. This is the
// right thing for backtesting on a fixed historical window.

import { mkdir, readFile, writeFile } from "node:fs/promises";
import { existsSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const CACHE_DIR = path.resolve(__dirname, "../../data-cache/daily-v8");

function toEpochSeconds(iso) {
  // Parse YYYY-MM-DD as UTC midnight to avoid local-tz drift
  return Math.floor(Date.parse(iso + "T00:00:00Z") / 1000);
}

/**
 * @param {string} symbol  e.g. "SPY"
 * @param {string} fromISO e.g. "2015-01-01"
 * @param {string} toISO   e.g. "2024-12-31"
 */
export async function fetchYahooV8Daily(symbol, fromISO, toISO) {
  await mkdir(CACHE_DIR, { recursive: true });
  const cacheFile = path.join(CACHE_DIR, `${symbol}_${fromISO}_${toISO}.json`);

  if (existsSync(cacheFile)) {
    const raw = await readFile(cacheFile, "utf8");
    const parsed = JSON.parse(raw);
    // 24h TTL on closed historical windows; if `to` is today or later, cache
    // for only 1h so the series stays fresh during active research sessions.
    const today = new Date().toISOString().slice(0, 10);
    const ttlMs = toISO < today ? 24 * 3600_000 : 3600_000;
    if (Date.now() - parsed._ts < ttlMs) return parsed.bars;
  }

  const p1 = toEpochSeconds(fromISO);
  const p2 = toEpochSeconds(toISO) + 86400; // inclusive end
  const url =
    `https://query2.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(symbol)}` +
    `?period1=${p1}&period2=${p2}&interval=1d&events=div,splits&includePrePost=false`;

  const res = await fetch(url, {
    headers: {
      "User-Agent":
        "Mozilla/5.0 (research paper-trading harness; educational use only)",
      Accept: "application/json",
    },
  });
  if (!res.ok) throw new Error(`Yahoo v8 daily failed for ${symbol}: HTTP ${res.status}`);
  const json = await res.json();
  const result = json?.chart?.result?.[0];
  if (!result) {
    const err = json?.chart?.error?.description || "no result";
    throw new Error(`Yahoo v8 daily payload error for ${symbol}: ${err}`);
  }

  const ts = result.timestamp || [];
  const quote = result.indicators?.quote?.[0] || {};
  const adjClose = result.indicators?.adjclose?.[0]?.adjclose || [];

  const bars = [];
  for (let i = 0; i < ts.length; i++) {
    const o = quote.open?.[i];
    const h = quote.high?.[i];
    const l = quote.low?.[i];
    const c = quote.close?.[i];
    const v = quote.volume?.[i];
    const adj = adjClose[i];
    if (o == null || h == null || l == null || c == null) continue;

    // Rescale OHLC by the adjustment ratio so the full candle reflects
    // splits and cash dividends, not just the close. This matches what
    // proper research harnesses (and AFML §2) recommend.
    const factor = c > 0 && adj != null ? adj / c : 1;
    bars.push({
      date: new Date(ts[i] * 1000).toISOString().slice(0, 10),
      open: o * factor,
      high: h * factor,
      low: l * factor,
      close: adj ?? c,
      volume: v ?? 0,
    });
  }

  // Sort by date ascending just in case and de-dupe any same-day entries
  // (rare, but can happen around corp-action days in the raw feed).
  bars.sort((a, b) => (a.date < b.date ? -1 : a.date > b.date ? 1 : 0));
  const seen = new Set();
  const unique = bars.filter((b) => {
    if (seen.has(b.date)) return false;
    seen.add(b.date);
    return true;
  });

  await writeFile(cacheFile, JSON.stringify({ _ts: Date.now(), bars: unique }));
  return unique;
}
