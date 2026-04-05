// Stooq is a free CSV endpoint for end-of-day data. It is far more stable
// than Yahoo Finance for historical daily bars and does not rate-limit
// aggressively. Symbols need a `.us` suffix for US equities.
//
// Example: https://stooq.com/q/d/l/?s=spy.us&i=d

import { mkdir, readFile, writeFile } from "node:fs/promises";
import { existsSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const CACHE_DIR = path.resolve(__dirname, "../../data-cache/stooq");

export async function fetchStooqDaily(symbol, fromISO, toISO) {
  await mkdir(CACHE_DIR, { recursive: true });
  const cacheFile = path.join(CACHE_DIR, `${symbol}_${fromISO}_${toISO}.json`);
  if (existsSync(cacheFile)) {
    const raw = await readFile(cacheFile, "utf8");
    return JSON.parse(raw);
  }
  const stooqSym = symbol.toLowerCase().includes(".") ? symbol.toLowerCase() : `${symbol.toLowerCase()}.us`;
  const url = `https://stooq.com/q/d/l/?s=${stooqSym}&i=d&d1=${fromISO.replace(/-/g, "")}&d2=${toISO.replace(/-/g, "")}`;
  const res = await fetch(url, {
    headers: { "User-Agent": "Mozilla/5.0 (research paper-trading harness; educational use)" },
  });
  if (!res.ok) throw new Error(`Stooq fetch failed for ${symbol}: ${res.status}`);
  const csv = await res.text();
  if (!csv || csv.startsWith("<") || csv.toLowerCase().includes("no data")) {
    throw new Error(`Stooq returned no data for ${symbol}`);
  }
  const bars = parseStooqCsv(csv);
  if (bars.length) await writeFile(cacheFile, JSON.stringify(bars));
  return bars;
}

function parseStooqCsv(csv) {
  const lines = csv.trim().split("\n");
  const header = lines.shift();
  if (!header || !header.toLowerCase().startsWith("date,")) {
    throw new Error("Unexpected Stooq CSV header: " + header);
  }
  const bars = [];
  for (const line of lines) {
    const [date, open, high, low, close, volume] = line.split(",");
    if (!date || open === "") continue;
    bars.push({
      date,
      open: Number(open),
      high: Number(high),
      low: Number(low),
      close: Number(close),
      volume: Number(volume) || 0,
    });
  }
  return bars;
}
