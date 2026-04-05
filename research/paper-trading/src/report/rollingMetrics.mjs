// Rolling-window metrics + monthly return grid + underwater curve.
// All pure JS, all ASCII output friendly. The point of these reports is
// that a single end-of-period Sharpe can hide enormous variation. Rolling
// windows show WHEN the strategy was working and when it wasn't.

/**
 * Rolling Sharpe ratio on daily returns with annualization √252.
 * Returns an array of { date, sharpe, window } one value per bar.
 */
export function rollingSharpe(equityCurve, { window = 63 } = {}) {
  const rets = dailyReturns(equityCurve);
  const out = [];
  for (let i = 0; i < rets.length; i++) {
    const start = Math.max(0, i - window + 1);
    const slice = rets.slice(start, i + 1);
    if (slice.length < Math.min(20, window / 3)) {
      out.push({ date: equityCurve[i + 1]?.date ?? null, sharpe: null, n: slice.length });
      continue;
    }
    const mean = slice.reduce((s, x) => s + x, 0) / slice.length;
    const sd = Math.sqrt(slice.reduce((s, x) => s + (x - mean) ** 2, 0) / (slice.length - 1));
    const sharpe = sd > 0 ? (mean / sd) * Math.sqrt(252) : 0;
    out.push({ date: equityCurve[i + 1]?.date ?? null, sharpe: round(sharpe, 3), n: slice.length });
  }
  return out;
}

/**
 * Rolling max-drawdown over a window. Useful to detect when drawdowns
 * are actually getting worse rather than just being one-off events.
 */
export function rollingMaxDrawdown(equityCurve, { window = 252 } = {}) {
  const out = [];
  for (let i = 0; i < equityCurve.length; i++) {
    const start = Math.max(0, i - window + 1);
    const slice = equityCurve.slice(start, i + 1).map((p) => p.equity);
    let peak = -Infinity, maxDD = 0;
    for (const v of slice) {
      if (v > peak) peak = v;
      const dd = peak > 0 ? (v - peak) / peak : 0;
      if (dd < maxDD) maxDD = dd;
    }
    out.push({ date: equityCurve[i].date, maxDDPct: round(maxDD * 100, 2) });
  }
  return out;
}

/**
 * Underwater curve: at each bar, how far below the running peak are we,
 * as a negative percent. Zero when at a new high.
 */
export function underwaterCurve(equityCurve) {
  const out = [];
  let peak = -Infinity;
  for (const p of equityCurve) {
    if (p.equity > peak) peak = p.equity;
    const underwater = peak > 0 ? (p.equity - peak) / peak : 0;
    out.push({ date: p.date, underwaterPct: round(underwater * 100, 2) });
  }
  return out;
}

/**
 * Monthly return grid — rows = year, columns = month (1-12) + YTD.
 * Classic presentation every quant report uses. Returns a 2D object
 * keyed by year string for easy rendering.
 */
export function monthlyReturnGrid(equityCurve) {
  const months = new Map(); // "YYYY-MM" → [firstEquity, lastEquity]
  for (const p of equityCurve) {
    const ym = p.date.slice(0, 7);
    const entry = months.get(ym);
    if (!entry) months.set(ym, [p.equity, p.equity]);
    else entry[1] = p.equity;
  }
  const years = new Map();
  for (const [ym, [first, last]] of months) {
    const [y, m] = ym.split("-").map(Number);
    const ret = first > 0 ? (last - first) / first : 0;
    const row = years.get(y) ?? { months: new Array(12).fill(null), ytd: null, start: null, end: null };
    row.months[m - 1] = round(ret * 100, 2);
    if (row.start == null) row.start = first;
    row.end = last;
    years.set(y, row);
  }
  for (const row of years.values()) {
    row.ytd = row.start > 0 ? round(((row.end - row.start) / row.start) * 100, 2) : null;
  }
  return Object.fromEntries([...years.entries()].sort((a, b) => a[0] - b[0]));
}

/**
 * Render a monthly grid as a compact ASCII table, suitable for terminal
 * or markdown.
 */
export function renderMonthlyGrid(grid, label = "Monthly returns %") {
  const months = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec","YTD"];
  const years = Object.keys(grid);
  const header = "Year " + months.map((m) => m.padStart(7)).join("");
  const lines = [label, header];
  for (const y of years) {
    const row = grid[y];
    const cells = row.months.map((v) => (v == null ? "     -" : (v >= 0 ? `+${v.toFixed(1)}` : v.toFixed(1))).padStart(7));
    cells.push((row.ytd == null ? "     -" : (row.ytd >= 0 ? `+${row.ytd.toFixed(1)}` : row.ytd.toFixed(1))).padStart(7));
    lines.push(y + " " + cells.join(""));
  }
  return lines.join("\n");
}

function dailyReturns(equityCurve) {
  const r = [];
  for (let i = 1; i < equityCurve.length; i++) {
    const prev = equityCurve[i - 1].equity;
    const cur = equityCurve[i].equity;
    r.push(prev > 0 ? (cur - prev) / prev : 0);
  }
  return r;
}
function round(x, d) {
  const p = 10 ** d;
  return Math.round(x * p) / p;
}
