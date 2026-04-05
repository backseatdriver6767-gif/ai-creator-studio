// Personal-edge report. Computes your real trading statistics from
// manual-trades.jsonl. This is what you use to decide whether to keep
// trading, cut size, or stop.

import { roundTripTrades } from "./manualLog.mjs";
import { kellyFromTrades } from "../risk/kelly.mjs";

export async function edgeReport({ lastN = null } = {}) {
  let trips = await roundTripTrades();
  if (lastN) trips = trips.slice(-lastN);
  if (!trips.length) {
    return { trades: 0, note: "No manual trades logged yet." };
  }

  const pnls = trips.map((t) => t.pnl);
  const wins = pnls.filter((x) => x > 0);
  const losses = pnls.filter((x) => x <= 0);
  const total = pnls.reduce((s, x) => s + x, 0);
  const avgWin = wins.length ? wins.reduce((s, x) => s + x, 0) / wins.length : 0;
  const avgLoss = losses.length ? losses.reduce((s, x) => s + x, 0) / losses.length : 0;
  const winRate = wins.length / trips.length;
  const expectancy = winRate * avgWin + (1 - winRate) * avgLoss;
  const grossWin = wins.reduce((s, x) => s + x, 0);
  const grossLoss = Math.abs(losses.reduce((s, x) => s + x, 0));
  const profitFactor = grossLoss > 0 ? grossWin / grossLoss : null;

  // By setup
  /** @type {Record<string, number[]>} */
  const bySetup = {};
  for (const t of trips) {
    const k = t.setup || "(no-setup)";
    (bySetup[k] ||= []).push(t.pnl);
  }
  const setupStats = Object.fromEntries(
    Object.entries(bySetup).map(([k, arr]) => [
      k,
      {
        n: arr.length,
        winRate: round(arr.filter((x) => x > 0).length / arr.length, 3),
        expectancy: round(arr.reduce((s, x) => s + x, 0) / arr.length, 2),
        total: round(arr.reduce((s, x) => s + x, 0), 2),
      },
    ]),
  );

  // By emotion
  /** @type {Record<string, number>} */
  const byEmotion = {};
  for (const t of trips) {
    const k = t.emotion || "(none)";
    byEmotion[k] = (byEmotion[k] || 0) + t.pnl;
  }

  return {
    trades: trips.length,
    winRatePct: round(winRate * 100, 1),
    avgWin: round(avgWin, 2),
    avgLoss: round(avgLoss, 2),
    expectancy: round(expectancy, 2),
    profitFactor: profitFactor ? round(profitFactor, 2) : null,
    totalPnl: round(total, 2),
    kelly: kellyFromTrades(pnls),
    bySetup: setupStats,
    byEmotionTotal: Object.fromEntries(Object.entries(byEmotion).map(([k, v]) => [k, round(v, 2)])),
    honesty: trips.length < 30
      ? "Fewer than 30 round-trip trades. Statistics are not yet meaningful."
      : "Sample ≥ 30. Treat results as noisy estimates, not facts.",
  };
}

function round(x, d) {
  const p = 10 ** d;
  return Math.round(x * p) / p;
}
