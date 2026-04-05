// Yahoo intraday bars via the public v8 chart endpoint.
// Supports 1m/5m/15m/30m/60m bars. Cached to disk.
//
// NOTE: Yahoo limits 1m bars to ~7 days of history; 5m/15m to ~60 days.
// This is a known limitation of the free endpoint.

import { mkdir, readFile, writeFile } from "node:fs/promises";
import { existsSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const CACHE_DIR = path.resolve(__dirname, "../../data-cache/intraday");

/**
 * @param {string} symbol
 * @param {"1m"|"5m"|"15m"|"30m"|"60m"} interval
 * @param {"1d"|"5d"|"1mo"|"3mo"} range
 */
export async function fetchIntradayBars(symbol, interval = "5m", range = "5d") {
  await mkdir(CACHE_DIR, { recursive: true });
  const cacheFile = path.join(CACHE_DIR, `${symbol}_${interval}_${range}.json`);

  if (existsSync(cacheFile)) {
    const stat = await readFile(cacheFile, "utf8");
    const parsed = JSON.parse(stat);
    // 30-minute TTL on intraday cache
    if (Date.now() - parsed._ts < 30 * 60 * 1000) return parsed.bars;
  }

  const url =
    `https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(symbol)}` +
    `?interval=${interval}&range=${range}&includePrePost=false`;
  const res = await fetch(url, {
    headers: {
      "User-Agent":
        "Mozilla/5.0 (research paper-trading harness; educational use)",
    },
  });
  if (!res.ok) throw new Error(`Yahoo intraday failed: ${res.status}`);
  const json = await res.json();
  const result = json?.chart?.result?.[0];
  if (!result) throw new Error("Unexpected Yahoo intraday payload");

  const ts = result.timestamp || [];
  const q = result.indicators?.quote?.[0] || {};
  const bars = [];
  for (let i = 0; i < ts.length; i++) {
    const o = q.open?.[i], h = q.high?.[i], l = q.low?.[i], c = q.close?.[i], v = q.volume?.[i];
    if (o == null || c == null) continue;
    bars.push({
      date: new Date(ts[i] * 1000).toISOString(),
      open: o, high: h, low: l, close: c, volume: v || 0,
    });
  }
  await writeFile(cacheFile, JSON.stringify({ _ts: Date.now(), bars }));
  return bars;
}

/** Group a flat list of intraday bars by trading day (ISO date). */
export function groupByDay(bars) {
  /** @type {Map<string, typeof bars>} */
  const map = new Map();
  for (const b of bars) {
    const day = b.date.slice(0, 10);
    if (!map.has(day)) map.set(day, []);
    map.get(day).push(b);
  }
  return map;
}
