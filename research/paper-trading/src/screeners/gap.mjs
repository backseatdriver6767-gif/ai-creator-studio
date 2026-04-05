// Gap screener: given a list of symbols and their recent daily bars, find
// the ones with the largest overnight gaps (today's open vs yesterday's close).
// Works offline against cached bar data.

export function gapScanner(symbolBars, { minPct = 2 } = {}) {
  const rows = [];
  for (const [sym, bars] of Object.entries(symbolBars)) {
    if (!bars || bars.length < 2) continue;
    const y = bars[bars.length - 2];
    const t = bars[bars.length - 1];
    const gapPct = ((t.open - y.close) / y.close) * 100;
    if (Math.abs(gapPct) >= minPct) {
      rows.push({
        symbol: sym,
        prevClose: round(y.close, 2),
        open: round(t.open, 2),
        gapPct: round(gapPct, 2),
        volume: t.volume,
        date: t.date,
      });
    }
  }
  return rows.sort((a, b) => Math.abs(b.gapPct) - Math.abs(a.gapPct));
}

function round(x, d) {
  const p = 10 ** d;
  return Math.round(x * p) / p;
}
