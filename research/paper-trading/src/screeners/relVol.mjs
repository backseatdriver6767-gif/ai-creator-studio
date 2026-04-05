// Relative volume: today's volume divided by the trailing N-day average.
// High relvol is a classic day-trader attention signal (not a signal to trade).

export function relVolScanner(symbolBars, { lookback = 20, minRelVol = 2 } = {}) {
  const rows = [];
  for (const [sym, bars] of Object.entries(symbolBars)) {
    if (!bars || bars.length < lookback + 1) continue;
    const recent = bars.slice(-lookback - 1, -1);
    const avgVol = recent.reduce((s, b) => s + (b.volume || 0), 0) / lookback;
    const today = bars[bars.length - 1];
    if (avgVol <= 0) continue;
    const relVol = today.volume / avgVol;
    if (relVol >= minRelVol) {
      rows.push({
        symbol: sym,
        relVol: round(relVol, 2),
        volume: today.volume,
        avgVol: Math.round(avgVol),
        changePct: round(((today.close - today.open) / today.open) * 100, 2),
        date: today.date,
      });
    }
  }
  return rows.sort((a, b) => b.relVol - a.relVol);
}

function round(x, d) {
  const p = 10 ** d;
  return Math.round(x * p) / p;
}
