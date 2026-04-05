// Portfolio heat: total open risk across positions as a percentage of equity.
// Warns if aggregate heat exceeds a cap (typical discretionary trader rule: 6%).

export function portfolioHeat({ equity, positions, cap = 0.06 }) {
  // positions: [{ symbol, shares, entry, stop }]
  let totalRisk = 0;
  const lines = positions.map((p) => {
    const risk = Math.abs(p.entry - p.stop) * p.shares;
    totalRisk += risk;
    return {
      symbol: p.symbol,
      shares: p.shares,
      riskDollars: round(risk, 2),
      riskPct: round((risk / equity) * 100, 2),
    };
  });
  return {
    equity,
    cap,
    totalRiskDollars: round(totalRisk, 2),
    totalRiskPct: round((totalRisk / equity) * 100, 2),
    overCap: totalRisk / equity > cap,
    lines,
  };
}

function round(x, d) {
  const p = 10 ** d;
  return Math.round(x * p) / p;
}
