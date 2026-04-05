// Data integrity checker. Refuses to pretend a broken series is clean.
//
// Flags:
//   - Duplicate dates
//   - Large gaps (weekend/holiday OK; > 5 business days is suspicious)
//   - Zero-volume days (rare for major symbols)
//   - OHLC inconsistency (high < low, close outside [low, high], etc.)
//   - Extreme jumps (>25% overnight without a split annotation)
//   - Too few bars for whatever the caller intends to do

export function checkIntegrity(bars, { minBars = 30 } = {}) {
  const issues = [];
  let fatal = false;

  if (!bars || bars.length < minBars) {
    return { issues: [`too few bars: ${bars?.length ?? 0} < ${minBars}`], fatal: true };
  }

  // Sorted ascending
  for (let i = 1; i < bars.length; i++) {
    if (bars[i].date < bars[i - 1].date) {
      issues.push(`out-of-order at index ${i}`);
      fatal = true;
      break;
    }
  }

  // Duplicates
  const seen = new Set();
  for (const b of bars) {
    if (seen.has(b.date)) {
      issues.push(`duplicate date ${b.date}`);
      fatal = true;
    }
    seen.add(b.date);
  }

  // OHLC sanity
  let ohlcBad = 0;
  for (const b of bars) {
    if (!(b.high >= b.low && b.close >= b.low && b.close <= b.high && b.open >= b.low && b.open <= b.high)) {
      ohlcBad++;
    }
  }
  if (ohlcBad > 0) {
    issues.push(`${ohlcBad} bar(s) with inconsistent OHLC`);
    if (ohlcBad > bars.length * 0.01) fatal = true;
  }

  // Gaps in business days
  let bigGaps = 0;
  for (let i = 1; i < bars.length; i++) {
    const d1 = new Date(bars[i - 1].date);
    const d2 = new Date(bars[i].date);
    const diff = (d2 - d1) / 86400_000;
    if (diff > 7) bigGaps++;
  }
  if (bigGaps > 0) issues.push(`${bigGaps} gap(s) >7 days`);

  // Zero volume
  const zeroVol = bars.filter((b) => !b.volume).length;
  if (zeroVol > bars.length * 0.1) issues.push(`${zeroVol} zero-volume bars (>10%)`);

  // Extreme overnight jumps (unadjusted splits leak through here)
  let jumps = 0;
  for (let i = 1; i < bars.length; i++) {
    const prev = bars[i - 1].close;
    const cur = bars[i].open;
    if (prev > 0 && Math.abs(cur / prev - 1) > 0.25) jumps++;
  }
  if (jumps > 0) issues.push(`${jumps} overnight jump(s) >25% (possible unadjusted split)`);

  return { issues, fatal, bars: bars.length };
}
