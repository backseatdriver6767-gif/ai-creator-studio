// Shadow blotter — mark-to-market view of all open shadow trades.
//
// For each open position: fetch the latest bar, compute unrealized P&L,
// R-multiple, and proximity to stop/target. This is the "what does my
// paper book look like right now" view that shadowBook.evaluate() doesn't
// give you (evaluate only reports positions that have already exited).

import { readBook } from "./shadowBook.mjs";
import { fetchBars } from "../data/multiSource.mjs";

export async function shadowBlotter({ todayISO = new Date().toISOString().slice(0, 10) } = {}) {
  const items = await readBook();
  const open = items.filter((x) => x.status === "open");
  if (!open.length) return { open: 0, rows: [] };

  // Fetch bars per symbol once, not per position
  const symbols = [...new Set(open.map((x) => x.symbol))];
  const priceMap = new Map();
  for (const sym of symbols) {
    try {
      const from = new Date(Date.now() - 10 * 86400_000).toISOString().slice(0, 10);
      const { bars, source } = await fetchBars(sym, from, todayISO);
      const last = bars[bars.length - 1];
      priceMap.set(sym, { last, source });
    } catch (e) {
      priceMap.set(sym, { error: e.message });
    }
  }

  const rows = open.map((pos) => {
    const px = priceMap.get(pos.symbol);
    if (px?.error) {
      return { ...pos, markError: px.error };
    }
    const mark = px.last.close;
    const long = pos.side === "BUY";
    const unrealized = (long ? mark - pos.entry : pos.entry - mark) * pos.qty;
    const risk = Math.abs(pos.entry - pos.stop) * pos.qty;
    const rMultiple = risk > 0 ? unrealized / risk : 0;
    const distToStopPct = ((long ? mark - pos.stop : pos.stop - mark) / pos.entry) * 100;
    const distToTargetPct = ((long ? pos.target - mark : mark - pos.target) / pos.entry) * 100;
    return {
      shadowId: pos.shadowId,
      symbol: pos.symbol,
      side: pos.side,
      qty: pos.qty,
      entry: pos.entry,
      entryDate: pos.entryDate,
      stop: pos.stop,
      target: pos.target,
      mark: round(mark, 4),
      markDate: px.last.date,
      unrealizedPnl: round(unrealized, 2),
      rMultiple: round(rMultiple, 2),
      distToStopPct: round(distToStopPct, 2),
      distToTargetPct: round(distToTargetPct, 2),
      setup: pos.setup || null,
      markSource: px.source,
    };
  });

  // Aggregate
  const totalUnrealized = rows.reduce((s, r) => s + (r.unrealizedPnl ?? 0), 0);
  const totalRisk = open.reduce((s, p) => s + Math.abs(p.entry - p.stop) * p.qty, 0);
  return {
    open: open.length,
    totalUnrealized: round(totalUnrealized, 2),
    totalRiskOnBook: round(totalRisk, 2),
    rows,
  };
}

function round(x, d) { const p = 10 ** d; return Math.round(x * p) / p; }
