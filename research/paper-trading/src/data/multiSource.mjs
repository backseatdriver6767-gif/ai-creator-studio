// Multi-source data router. Tries providers in order; first one that
// returns a usable series wins. Cached results are keyed by (symbol, range)
// not by provider so a successful provider fill is reused automatically.
//
// Order (2026-current): Yahoo v8 chart (the live endpoint the website
// itself uses) → Stooq (if it ever returns CSV again) → legacy Yahoo CSV
// (v7 /finance/download — currently 401s but kept as final fallback in
// case it ever comes back).

import { fetchYahooV8Daily } from "./yahooV8Daily.mjs";
import { fetchStooqDaily } from "./stooq.mjs";
import { fetchDailyBars as fetchYahooCsv } from "./yahoo.mjs";
import { checkIntegrity } from "./integrity.mjs";

// As of 2026 the legacy providers (Stooq CSV for US tickers, Yahoo v7
// /finance/download CSV) both return landing pages / 401s and are kept
// only behind an opt-in env flag so a fresh run does not waste time on
// them. The v8 chart endpoint is the one the Yahoo website itself calls
// and remains free and unauthenticated.
const INCLUDE_LEGACY = process.env.PAPER_TRADING_INCLUDE_LEGACY_PROVIDERS === "1";

const PROVIDERS = [
  { name: "yahoo-v8", fn: fetchYahooV8Daily },
  ...(INCLUDE_LEGACY
    ? [
        { name: "stooq", fn: fetchStooqDaily },
        { name: "yahoo-csv", fn: fetchYahooCsv },
      ]
    : []),
];

export async function fetchBars(symbol, fromISO, toISO, { strict = true } = {}) {
  const errors = [];
  for (const p of PROVIDERS) {
    try {
      const bars = await p.fn(symbol, fromISO, toISO);
      if (!bars || bars.length === 0) {
        errors.push(`${p.name}: empty`);
        continue;
      }
      const report = checkIntegrity(bars);
      if (strict && report.fatal) {
        errors.push(`${p.name}: ${report.issues.join(", ")}`);
        continue;
      }
      return { bars, source: p.name, integrity: report };
    } catch (e) {
      errors.push(`${p.name}: ${e.message}`);
    }
  }
  throw new Error(`All data providers failed for ${symbol}: ${errors.join(" | ")}`);
}
