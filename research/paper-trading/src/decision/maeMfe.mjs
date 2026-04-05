// Maximum Adverse Excursion / Maximum Favorable Excursion analysis.
//
// For each round-trip trade, compute:
//   MAE = worst unrealized loss during the trade (in % and R-multiples)
//   MFE = best unrealized gain during the trade
//
// Aggregated across your journal this tells you two critical things:
//   1. Are your stops TOO TIGHT? (MAE of winners is close to stop distance)
//   2. Are you GIVING BACK profits? (MFE of losers shows you saw gains and fumbled)
//
// You pass in the trip + bar data between entry and exit.

export function computeMaeMfe(trip, bars) {
  const entry = trip.entry;
  const stop = trip.stop ?? null;
  const long = trip.direction === "LONG";
  let mae = 0, mfe = 0;
  for (const b of bars) {
    const lowExcursion = long ? (b.low - entry) / entry : (entry - b.high) / entry;
    const highExcursion = long ? (b.high - entry) / entry : (entry - b.low) / entry;
    if (lowExcursion < mae) mae = lowExcursion;
    if (highExcursion > mfe) mfe = highExcursion;
  }
  const riskPerShare = stop != null ? Math.abs(entry - stop) : null;
  const rMultipleRealized = riskPerShare
    ? ((long ? trip.exit - entry : entry - trip.exit) / riskPerShare)
    : null;
  return {
    tradeId: trip.tradeId,
    maePct: round(mae * 100, 2),
    mfePct: round(mfe * 100, 2),
    realizedPct: round(((trip.exit - entry) / entry) * (long ? 1 : -1) * 100, 2),
    rMultipleRealized: rMultipleRealized != null ? round(rMultipleRealized, 2) : null,
  };
}

export function aggregateExcursions(results) {
  const wins = results.filter((r) => r.realizedPct > 0);
  const losses = results.filter((r) => r.realizedPct <= 0);
  const avg = (xs, k) => xs.length ? round(xs.reduce((s, x) => s + x[k], 0) / xs.length, 2) : null;
  return {
    trades: results.length,
    winners: {
      n: wins.length,
      avgMAE: avg(wins, "maePct"),
      avgMFE: avg(wins, "mfePct"),
      avgRealized: avg(wins, "realizedPct"),
      giveback: wins.length ? round((avg(wins, "mfePct") - avg(wins, "realizedPct")), 2) : null,
    },
    losers: {
      n: losses.length,
      avgMAE: avg(losses, "maePct"),
      avgMFE: avg(losses, "mfePct"),
      avgRealized: avg(losses, "realizedPct"),
      fumble: losses.length ? round(avg(losses, "mfePct"), 2) : null,
    },
  };
}

function round(x, d) { const p = 10 ** d; return Math.round(x * p) / p; }
