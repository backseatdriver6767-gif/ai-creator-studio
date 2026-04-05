// 52-week high/low breakout screener.
// Assumes ~252 trading days per year.

export function breakout52wScanner(symbolBars) {
  const rows = [];
  for (const [sym, bars] of Object.entries(symbolBars)) {
    if (!bars || bars.length < 252) continue;
    const window = bars.slice(-252);
    const hi = Math.max(...window.map((b) => b.high));
    const lo = Math.min(...window.map((b) => b.low));
    const today = bars[bars.length - 1];
    const atHigh = today.close >= hi * 0.999;
    const atLow = today.close <= lo * 1.001;
    if (atHigh || atLow) {
      rows.push({
        symbol: sym,
        date: today.date,
        close: round(today.close, 2),
        hi52: round(hi, 2),
        lo52: round(lo, 2),
        type: atHigh ? "52w_HIGH" : "52w_LOW",
      });
    }
  }
  return rows;
}

function round(x, d) {
  const p = 10 ** d;
  return Math.round(x * p) / p;
}
