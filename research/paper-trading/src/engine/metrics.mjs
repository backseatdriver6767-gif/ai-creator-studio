// Performance metrics computed from an equity curve and fill log.
// All returns are daily. Sharpe/Sortino are annualized assuming 252 trading days.

const TRADING_DAYS = 252;

export function computeMetrics(equityCurve, fills, startingCash) {
  if (equityCurve.length < 2) {
    return empty(startingCash);
  }

  const dailyReturns = [];
  for (let i = 1; i < equityCurve.length; i++) {
    const prev = equityCurve[i - 1].equity;
    const cur = equityCurve[i].equity;
    dailyReturns.push(prev > 0 ? (cur - prev) / prev : 0);
  }

  const finalEquity = equityCurve[equityCurve.length - 1].equity;
  const totalReturn = (finalEquity - startingCash) / startingCash;
  const years = equityCurve.length / TRADING_DAYS;
  const cagr = years > 0 ? Math.pow(1 + totalReturn, 1 / years) - 1 : 0;

  const mean = avg(dailyReturns);
  const std = stdev(dailyReturns, mean);
  const downside = stdev(
    dailyReturns.filter((r) => r < 0),
    0,
  );
  const sharpe = std > 0 ? (mean / std) * Math.sqrt(TRADING_DAYS) : 0;
  const sortino = downside > 0 ? (mean / downside) * Math.sqrt(TRADING_DAYS) : 0;

  // Max drawdown
  let peak = equityCurve[0].equity;
  let maxDD = 0;
  for (const pt of equityCurve) {
    if (pt.equity > peak) peak = pt.equity;
    const dd = peak > 0 ? (pt.equity - peak) / peak : 0;
    if (dd < maxDD) maxDD = dd;
  }

  // Round-trip trade stats (BUY -> SELL pairs)
  const trades = [];
  let open = null;
  for (const f of fills) {
    if (f.side === "BUY") open = f;
    else if (f.side === "SELL" && open) {
      const pnl = (f.price - open.price) * f.shares - (open.fee + f.fee);
      trades.push({ pnl, entry: open.date, exit: f.date });
      open = null;
    }
  }
  const wins = trades.filter((t) => t.pnl > 0);
  const losses = trades.filter((t) => t.pnl <= 0);
  const winRate = trades.length ? wins.length / trades.length : 0;
  const grossWin = wins.reduce((s, t) => s + t.pnl, 0);
  const grossLoss = Math.abs(losses.reduce((s, t) => s + t.pnl, 0));
  const profitFactor = grossLoss > 0 ? grossWin / grossLoss : grossWin > 0 ? Infinity : 0;

  return {
    startingCash,
    finalEquity: round(finalEquity),
    totalReturnPct: round(totalReturn * 100, 2),
    cagrPct: round(cagr * 100, 2),
    sharpe: round(sharpe, 2),
    sortino: round(sortino, 2),
    maxDrawdownPct: round(maxDD * 100, 2),
    trades: trades.length,
    winRatePct: round(winRate * 100, 1),
    profitFactor: Number.isFinite(profitFactor) ? round(profitFactor, 2) : null,
  };
}

function empty(startingCash) {
  return {
    startingCash,
    finalEquity: startingCash,
    totalReturnPct: 0,
    cagrPct: 0,
    sharpe: 0,
    sortino: 0,
    maxDrawdownPct: 0,
    trades: 0,
    winRatePct: 0,
    profitFactor: null,
  };
}

function avg(xs) {
  if (!xs.length) return 0;
  return xs.reduce((s, x) => s + x, 0) / xs.length;
}
function stdev(xs, mean) {
  if (xs.length < 2) return 0;
  const m = mean ?? avg(xs);
  const v = xs.reduce((s, x) => s + (x - m) ** 2, 0) / (xs.length - 1);
  return Math.sqrt(v);
}
function round(x, d = 2) {
  const p = 10 ** d;
  return Math.round(x * p) / p;
}
