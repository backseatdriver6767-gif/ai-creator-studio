// Engle-Granger cointegration test — the right way to check whether two
// price series have a stable long-run relationship (as opposed to just
// "their Z-score looks mean-reverting on this window").
//
// Procedure:
//   1. OLS-regress series A on series B to get hedge ratio β and residuals.
//   2. Run a simple Augmented Dickey-Fuller test on the residuals.
//   3. If residuals are stationary (ADF statistic below critical value),
//      the pair is cointegrated and the spread A - βB is tradeable.
//
// This is intentionally minimal — no lag selection heuristics, no constant
// term fanciness, no full MacKinnon tables. Just the 5% critical values
// for the Engle-Granger case with no deterministic trend and a single lag,
// which is enough to tell us "is this pair real or am I fitting noise".
//
// All math is pure JS with no external deps.

/**
 * OLS regression of y on x (with intercept).
 * Returns { alpha, beta, residuals }.
 */
export function ols(y, x) {
  if (y.length !== x.length) throw new Error("ols: series must be same length");
  const n = y.length;
  if (n < 30) throw new Error("ols: need at least 30 observations");
  let sx = 0, sy = 0;
  for (let i = 0; i < n; i++) { sx += x[i]; sy += y[i]; }
  const mx = sx / n, my = sy / n;
  let num = 0, den = 0;
  for (let i = 0; i < n; i++) {
    num += (x[i] - mx) * (y[i] - my);
    den += (x[i] - mx) ** 2;
  }
  if (den === 0) throw new Error("ols: x has zero variance");
  const beta = num / den;
  const alpha = my - beta * mx;
  const residuals = new Array(n);
  for (let i = 0; i < n; i++) residuals[i] = y[i] - (alpha + beta * x[i]);
  return { alpha, beta, residuals };
}

/**
 * Augmented Dickey-Fuller test on a series, with one lag.
 * Regression: Δy_t = ρ·y_{t-1} + γ·Δy_{t-1} + ε
 * Test statistic: t-ratio on ρ. Null = unit root (non-stationary).
 * Returns { tStat, nObs }. Compare tStat to Engle-Granger critical values
 * below, which are stricter than the raw DF table because the residuals
 * come from a regression (not the original series).
 */
export function adfOneLag(series) {
  const n = series.length;
  if (n < 40) throw new Error("adf: need at least 40 observations");
  const dy = []; // Δy_t
  const yl = []; // y_{t-1}
  const dyl = []; // Δy_{t-1}
  for (let t = 2; t < n; t++) {
    dy.push(series[t] - series[t - 1]);
    yl.push(series[t - 1]);
    dyl.push(series[t - 1] - series[t - 2]);
  }
  // Multiple regression: dy = ρ·yl + γ·dyl (no intercept — residuals are
  // already centred because they came from OLS with intercept upstream).
  // Solve the 2x2 normal equations directly.
  let syl2 = 0, sdyl2 = 0, syldyl = 0, sdyyl = 0, sdydyl = 0;
  const m = dy.length;
  for (let i = 0; i < m; i++) {
    syl2 += yl[i] * yl[i];
    sdyl2 += dyl[i] * dyl[i];
    syldyl += yl[i] * dyl[i];
    sdyyl += dy[i] * yl[i];
    sdydyl += dy[i] * dyl[i];
  }
  const det = syl2 * sdyl2 - syldyl * syldyl;
  if (det === 0) return { tStat: 0, nObs: m };
  const rho = (sdyl2 * sdyyl - syldyl * sdydyl) / det;
  const gamma = (-syldyl * sdyyl + syl2 * sdydyl) / det;
  // Residuals and standard error
  let sse = 0;
  for (let i = 0; i < m; i++) {
    const e = dy[i] - rho * yl[i] - gamma * dyl[i];
    sse += e * e;
  }
  const sigma2 = sse / (m - 2);
  // Variance of ρ = σ² · (X'X)^-1[0,0] = σ² · sdyl2 / det
  const varRho = (sigma2 * sdyl2) / det;
  const seRho = Math.sqrt(varRho);
  const tStat = seRho > 0 ? rho / seRho : 0;
  return { tStat, nObs: m };
}

// Engle-Granger 5% critical values (no trend, single lag). From Hamilton
// 1994 table B.9 / MacKinnon 1991. We use the t=∞ row conservatively.
const EG_CRITICAL_5 = -3.34;
const EG_CRITICAL_1 = -3.90;

/**
 * Full Engle-Granger cointegration test on two price series.
 * Returns { cointegrated, level, beta, alpha, tStat, halfLife }.
 */
export function cointegrationTest(a, b) {
  const { alpha, beta, residuals } = ols(a, b);
  const adf = adfOneLag(residuals);
  let level = "none";
  if (adf.tStat < EG_CRITICAL_1) level = "1%";
  else if (adf.tStat < EG_CRITICAL_5) level = "5%";
  // Half-life of mean reversion: -log(2) / log(1+ρ) where ρ comes from an
  // AR(1) fit on the residuals. Quick estimate via two consecutive lags.
  const halfLife = estimateHalfLife(residuals);
  return {
    cointegrated: level !== "none",
    level,
    alpha,
    beta,
    tStat: adf.tStat,
    nObs: adf.nObs,
    halfLife,
  };
}

function estimateHalfLife(series) {
  const n = series.length;
  if (n < 30) return null;
  let num = 0, den = 0;
  for (let t = 1; t < n; t++) {
    num += (series[t] - series[t - 1]) * series[t - 1];
    den += series[t - 1] * series[t - 1];
  }
  const rho = den > 0 ? num / den : 0;
  if (1 + rho <= 0 || 1 + rho >= 1) return null;
  return -Math.log(2) / Math.log(1 + rho);
}
