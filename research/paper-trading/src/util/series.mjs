// Shared conversions between engine outputs and analysis inputs.

/** Equity curve → daily simple returns. */
export function dailyReturnsFromCurve(equityCurve) {
  const r = [];
  for (let i = 1; i < equityCurve.length; i++) {
    const prev = equityCurve[i - 1].equity;
    const cur = equityCurve[i].equity;
    r.push(prev > 0 ? (cur - prev) / prev : 0);
  }
  return r;
}

/** Fills log → per round-trip returns (assumes single-symbol long-or-flat). */
export function roundTripReturnsFromFills(fills) {
  const out = [];
  let open = null;
  for (const f of fills) {
    if (f.side === "BUY") open = f;
    else if (f.side === "SELL" && open) {
      out.push((f.price - open.price) / open.price);
      open = null;
    }
  }
  return out;
}
