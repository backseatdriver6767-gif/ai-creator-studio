// Multi-source data router. Tries providers in order; first one that
// returns a usable series wins. Cached results are keyed by (symbol, range)
// not by provider so a successful provider fill is reused automatically.
//
// Order: Stooq (most reliable for daily) → Yahoo CSV → Yahoo v8 chart.

import { fetchStooqDaily } from "./stooq.mjs";
import { fetchDailyBars as fetchYahooCsv } from "./yahoo.mjs";
import { checkIntegrity } from "./integrity.mjs";

const PROVIDERS = [
  { name: "stooq", fn: fetchStooqDaily },
  { name: "yahoo-csv", fn: fetchYahooCsv },
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
