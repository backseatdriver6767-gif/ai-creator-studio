// Yahoo Finance daily bar fetcher. Free, no key. Cached to disk.
// Endpoint format is public and used by many OSS projects. Do not hammer it.

import { mkdir, readFile, writeFile } from "node:fs/promises";
import { existsSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const CACHE_DIR = path.resolve(__dirname, "../../data-cache");

/** @typedef {{ date: string, open: number, high: number, low: number, close: number, volume: number }} Bar */

/**
 * Fetch daily OHLC bars for a symbol between two ISO dates (inclusive).
 * Results are cached on disk keyed by symbol+range.
 */
export async function fetchDailyBars(symbol, fromISO, toISO) {
  await mkdir(CACHE_DIR, { recursive: true });
  const cacheFile = path.join(
    CACHE_DIR,
    `${symbol}_${fromISO}_${toISO}.json`,
  );

  if (existsSync(cacheFile)) {
    const raw = await readFile(cacheFile, "utf8");
    return JSON.parse(raw);
  }

  const p1 = Math.floor(new Date(fromISO + "T00:00:00Z").getTime() / 1000);
  const p2 = Math.floor(new Date(toISO + "T23:59:59Z").getTime() / 1000);
  const url =
    `https://query1.finance.yahoo.com/v7/finance/download/${encodeURIComponent(symbol)}` +
    `?period1=${p1}&period2=${p2}&interval=1d&events=history&includeAdjustedClose=true`;

  const res = await fetch(url, {
    headers: {
      "User-Agent":
        "Mozilla/5.0 (research paper-trading harness; educational use)",
    },
  });
  if (!res.ok) {
    throw new Error(
      `Yahoo fetch failed for ${symbol}: ${res.status} ${res.statusText}`,
    );
  }
  const csv = await res.text();
  const bars = parseCsv(csv);
  await writeFile(cacheFile, JSON.stringify(bars));
  return bars;
}

function parseCsv(csv) {
  const lines = csv.trim().split("\n");
  const header = lines.shift();
  if (!header || !header.startsWith("Date,")) {
    throw new Error("Unexpected CSV shape from Yahoo: " + header);
  }
  /** @type {Bar[]} */
  const out = [];
  for (const line of lines) {
    const [date, open, high, low, close, adjClose, volume] = line.split(",");
    if (!date || open === "null") continue;
    out.push({
      date,
      open: Number(open),
      high: Number(high),
      low: Number(low),
      close: Number(adjClose), // use adjusted close for dividend/split safety
      volume: Number(volume) || 0,
    });
  }
  return out;
}

/** Split bars into train/test at a fractional point (default 70/30). */
export function splitBars(bars, trainFrac = 0.7) {
  const cut = Math.floor(bars.length * trainFrac);
  return { train: bars.slice(0, cut), test: bars.slice(cut) };
}
