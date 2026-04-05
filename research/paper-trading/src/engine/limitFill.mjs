// Limit-order fill simulation.
//
// For backtests, limit orders do not always fill. We model a simple rule:
//   - Buy limit at price L fills on a bar if bar.low <= L.
//   - Sell limit at price L fills on a bar if bar.high >= L.
//   - Fill price is the limit price (conservative; real fills can be better).
// Add a probability parameter to haircut fills when you sit behind a long queue.

export function simulateLimitFill({ bar, side, limitPrice, fillProb = 0.9 }) {
  if (!bar) return { filled: false };
  const touched =
    side === "BUY" ? bar.low <= limitPrice : bar.high >= limitPrice;
  if (!touched) return { filled: false };
  // Deterministic seed from bar date so tests are repeatable.
  const seed = hash(bar.date + side + limitPrice);
  const rng = mulberry32(seed);
  if (rng() > fillProb) return { filled: false, reason: "queue miss" };
  return { filled: true, price: limitPrice };
}

/** Partial fill model: splits an order into n tranches over the next n bars. */
export function partialFillSchedule({ totalShares, tranches = 4 }) {
  const base = Math.floor(totalShares / tranches);
  const remainder = totalShares - base * tranches;
  return Array.from({ length: tranches }, (_, i) => base + (i < remainder ? 1 : 0));
}

function hash(s) {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619); }
  return h >>> 0;
}
function mulberry32(a) {
  return function () {
    let t = (a += 0x6d2b79f5);
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
