// NYSE/Nasdaq market calendar. US-only. Hard-coded through 2026 because
// there is no stable free feed for this and the dates do not move once set.
// Half-days are listed separately; strategies should treat them as closed
// unless explicitly opted-in.

const FULL_CLOSED = new Set([
  // 2024
  "2024-01-01", "2024-01-15", "2024-02-19", "2024-03-29",
  "2024-05-27", "2024-06-19", "2024-07-04", "2024-09-02",
  "2024-11-28", "2024-12-25",
  // 2025
  "2025-01-01", "2025-01-09", "2025-01-20", "2025-02-17",
  "2025-04-18", "2025-05-26", "2025-06-19", "2025-07-04",
  "2025-09-01", "2025-11-27", "2025-12-25",
  // 2026
  "2026-01-01", "2026-01-19", "2026-02-16", "2026-04-03",
  "2026-05-25", "2026-06-19", "2026-07-03", "2026-09-07",
  "2026-11-26", "2026-12-25",
]);

const HALF_DAYS = new Set([
  "2024-07-03", "2024-11-29", "2024-12-24",
  "2025-07-03", "2025-11-28", "2025-12-24",
  "2026-11-27", "2026-12-24",
]);

export function isTradingDay(isoDate) {
  const d = new Date(isoDate + "T00:00:00Z");
  const dow = d.getUTCDay();
  if (dow === 0 || dow === 6) return false; // weekend
  return !FULL_CLOSED.has(isoDate);
}

export function isHalfDay(isoDate) {
  return HALF_DAYS.has(isoDate);
}

export function nextTradingDay(isoDate) {
  const d = new Date(isoDate + "T00:00:00Z");
  for (let i = 1; i <= 7; i++) {
    d.setUTCDate(d.getUTCDate() + 1);
    const s = d.toISOString().slice(0, 10);
    if (isTradingDay(s)) return s;
  }
  return null;
}

/** LULD (Limit Up-Limit Down) halt awareness: if a bar contains an extreme
 *  intraday range, the engine should flatten. Simple heuristic here; replace
 *  with real halt tape events if you have them.
 */
export function isLikelyLULDHalt(bar, { rangeThreshold = 0.1 } = {}) {
  if (!bar || !bar.close) return false;
  return (bar.high - bar.low) / bar.close > rangeThreshold;
}
