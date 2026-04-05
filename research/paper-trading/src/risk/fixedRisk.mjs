// Fixed-risk-per-trade position sizer. This is what most disciplined
// discretionary traders actually use.
//
//    shares = (equity * riskPct) / (entry - stop)

export function fixedRiskSize({ equity, riskPct = 0.01, entry, stop }) {
  if (entry <= 0 || stop <= 0 || entry === stop) {
    return { shares: 0, warning: "invalid entry/stop" };
  }
  const riskPerShare = Math.abs(entry - stop);
  const riskDollars = equity * riskPct;
  const shares = Math.floor(riskDollars / riskPerShare);
  const notional = shares * entry;
  return {
    shares,
    riskDollars: round(riskDollars, 2),
    riskPerShare: round(riskPerShare, 4),
    notional: round(notional, 2),
    leverage: round(notional / equity, 2),
    warning: notional > equity ? "notional exceeds equity; requires margin" : null,
  };
}

export function atrStop({ bars, period = 14, multiplier = 2, direction = "LONG" }) {
  if (bars.length < period + 1) return null;
  const trs = [];
  for (let i = 1; i < bars.length; i++) {
    const h = bars[i].high, l = bars[i].low, cPrev = bars[i - 1].close;
    trs.push(Math.max(h - l, Math.abs(h - cPrev), Math.abs(l - cPrev)));
  }
  const atr = trs.slice(-period).reduce((s, x) => s + x, 0) / period;
  const last = bars[bars.length - 1].close;
  return direction === "LONG" ? last - multiplier * atr : last + multiplier * atr;
}

function round(x, d) {
  const p = 10 ** d;
  return Math.round(x * p) / p;
}
