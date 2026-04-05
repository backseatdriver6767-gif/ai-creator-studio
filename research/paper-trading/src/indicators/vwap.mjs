// VWAP helper: rolling session VWAP resets each trading day.
// Pure function, safe to reuse across strategies.

export function sessionVwap(bars) {
  const out = new Array(bars.length);
  let curDay = null;
  let cumPV = 0;
  let cumV = 0;
  for (let i = 0; i < bars.length; i++) {
    const b = bars[i];
    const day = b.date.slice(0, 10);
    if (day !== curDay) {
      curDay = day;
      cumPV = 0;
      cumV = 0;
    }
    const typ = (b.high + b.low + b.close) / 3;
    cumPV += typ * (b.volume || 1);
    cumV += b.volume || 1;
    out[i] = cumV > 0 ? cumPV / cumV : b.close;
  }
  return out;
}
