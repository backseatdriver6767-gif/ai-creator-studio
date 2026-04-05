// Volume-scaled slippage model. Realistic market impact grows roughly as
// sqrt(orderSize / ADV). We also add a spread component and a fixed noise
// floor. Every parameter is conservative on purpose — retail executions are
// worse than you think they are.
//
//     slippageBps = baseBps + impactCoef * 10_000 * sqrt(orderSize / ADV)
//
// baseBps covers the half-spread + latency + passive slippage.

export function volumeScaledSlippage({ orderSize, adv, baseBps = 5, impactCoef = 0.1 }) {
  if (orderSize <= 0 || adv <= 0) return baseBps;
  const participation = Math.min(orderSize / adv, 0.5);
  const impactBps = impactCoef * 10_000 * Math.sqrt(participation);
  return baseBps + impactBps;
}

/**
 * Apply slippage to a raw execution price given side ("BUY"/"SELL").
 */
export function applySlippage(rawPrice, side, slippageBps) {
  const f = slippageBps / 10_000;
  return side === "BUY" ? rawPrice * (1 + f) : rawPrice * (1 - f);
}

/**
 * A worst-of slippage model suitable for stress-testing. Doubles the impact
 * coefficient and adds a flat penalty. Use this to see if a strategy still
 * works under adverse conditions.
 */
export function stressSlippage(orderSize, adv) {
  return volumeScaledSlippage({ orderSize, adv, baseBps: 15, impactCoef: 0.25 });
}
