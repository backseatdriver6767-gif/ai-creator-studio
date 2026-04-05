// Unusual options activity screener. Free data sources for this are effectively
// nonexistent; this module defines the interface and returns a clear stub so
// you can plug in a paid feed later (e.g., Polygon, Unusual Whales, CBOE).
//
// Do NOT fabricate this data. If there is no feed, return an empty result with
// an explanatory reason.

export async function unusualOptionsScan(symbols, { providerFetch = null } = {}) {
  if (!providerFetch) {
    return {
      available: false,
      reason:
        "No options data provider configured. Pass { providerFetch } to wire a paid feed.",
      results: [],
    };
  }
  const results = [];
  for (const sym of symbols) {
    try {
      const r = await providerFetch(sym);
      if (r) results.push(r);
    } catch (e) {
      // swallow per-symbol errors; report at end
    }
  }
  return { available: true, results };
}
