// Value-at-Risk (VaR) and Conditional VaR (Expected Shortfall / CVaR).
//
// Two methods:
//   historical  — empirical quantile of the return distribution (no
//                 distributional assumption; robust to fat tails as long
//                 as your sample is big enough to include them).
//   parametric  — mean-variance normal approximation. Fast, but
//                 underestimates tail risk for anything real.
//
// Inputs are period returns (e.g. daily). The caller scales to the
// horizon of interest via √T. Reported values are POSITIVE fractions
// representing loss magnitude: VaR 0.03 means "5% chance of losing ≥3%
// in one period".

export function varHistorical(returns, confidence = 0.95) {
  if (!returns?.length) return null;
  const sorted = [...returns].sort((a, b) => a - b);
  const idx = Math.floor((1 - confidence) * sorted.length);
  const v = sorted[Math.max(0, Math.min(sorted.length - 1, idx))];
  return -v; // report as positive loss
}

export function cvarHistorical(returns, confidence = 0.95) {
  if (!returns?.length) return null;
  const sorted = [...returns].sort((a, b) => a - b);
  const cutoff = Math.max(1, Math.floor((1 - confidence) * sorted.length));
  const tail = sorted.slice(0, cutoff);
  const mean = tail.reduce((s, x) => s + x, 0) / tail.length;
  return -mean;
}

export function varParametric(returns, confidence = 0.95) {
  if (!returns?.length) return null;
  const n = returns.length;
  const mean = returns.reduce((s, x) => s + x, 0) / n;
  const variance = returns.reduce((s, x) => s + (x - mean) ** 2, 0) / Math.max(1, n - 1);
  const sd = Math.sqrt(variance);
  const z = inverseNormalCdf(1 - confidence);
  return -(mean + z * sd);
}

export function cvarParametric(returns, confidence = 0.95) {
  if (!returns?.length) return null;
  const n = returns.length;
  const mean = returns.reduce((s, x) => s + x, 0) / n;
  const variance = returns.reduce((s, x) => s + (x - mean) ** 2, 0) / Math.max(1, n - 1);
  const sd = Math.sqrt(variance);
  // CVaR (normal) = μ - σ · φ(z) / (1-confidence)
  const alpha = 1 - confidence;
  const z = inverseNormalCdf(alpha);
  const phi = Math.exp(-0.5 * z * z) / Math.sqrt(2 * Math.PI);
  return -(mean - sd * (phi / alpha));
}

/**
 * Combined report using both methods. The historical one is usually the
 * more honest number; the parametric is shown for contrast so the caller
 * can see how badly the normal assumption underestimates the tail.
 */
export function riskReport(returns, { confidence = 0.95, horizonDays = 1 } = {}) {
  const scale = Math.sqrt(horizonDays);
  const vh = varHistorical(returns, confidence);
  const ch = cvarHistorical(returns, confidence);
  const vp = varParametric(returns, confidence);
  const cp = cvarParametric(returns, confidence);
  return {
    confidence,
    horizonDays,
    historical: {
      var: vh == null ? null : round(vh * scale, 4),
      cvar: ch == null ? null : round(ch * scale, 4),
    },
    parametric: {
      var: vp == null ? null : round(vp * scale, 4),
      cvar: cp == null ? null : round(cp * scale, 4),
    },
    sampleSize: returns?.length ?? 0,
  };
}

function round(x, d) {
  const p = 10 ** d;
  return Math.round(x * p) / p;
}

// Beasley-Springer-Moro inverse normal CDF. Accurate to ~1e-9 on
// [10^-16, 1-10^-16]. Public domain algorithm.
function inverseNormalCdf(p) {
  if (p <= 0 || p >= 1) throw new Error("inverseNormalCdf: p must be in (0, 1)");
  const a = [
    -3.969683028665376e+01, 2.209460984245205e+02, -2.759285104469687e+02,
    1.383577518672690e+02, -3.066479806614716e+01, 2.506628277459239e+00,
  ];
  const b = [
    -5.447609879822406e+01, 1.615858368580409e+02, -1.556989798598866e+02,
    6.680131188771972e+01, -1.328068155288572e+01,
  ];
  const c = [
    -7.784894002430293e-03, -3.223964580411365e-01, -2.400758277161838e+00,
    -2.549732539343734e+00, 4.374664141464968e+00, 2.938163982698783e+00,
  ];
  const d = [
    7.784695709041462e-03, 3.224671290700398e-01, 2.445134137142996e+00,
    3.754408661907416e+00,
  ];
  const plow = 0.02425;
  const phigh = 1 - plow;
  let q, r;
  if (p < plow) {
    q = Math.sqrt(-2 * Math.log(p));
    return (((((c[0]*q + c[1])*q + c[2])*q + c[3])*q + c[4])*q + c[5]) /
           ((((d[0]*q + d[1])*q + d[2])*q + d[3])*q + 1);
  }
  if (p <= phigh) {
    q = p - 0.5;
    r = q * q;
    return (((((a[0]*r + a[1])*r + a[2])*r + a[3])*r + a[4])*r + a[5])*q /
           (((((b[0]*r + b[1])*r + b[2])*r + b[3])*r + b[4])*r + 1);
  }
  q = Math.sqrt(-2 * Math.log(1 - p));
  return -(((((c[0]*q + c[1])*q + c[2])*q + c[3])*q + c[4])*q + c[5]) /
          ((((d[0]*q + d[1])*q + d[2])*q + d[3])*q + 1);
}
