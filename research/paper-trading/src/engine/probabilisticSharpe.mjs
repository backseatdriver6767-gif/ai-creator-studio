// Probabilistic Sharpe Ratio (Bailey & López de Prado, 2012).
// Given an observed Sharpe, sample size, skew, and excess kurtosis, returns
// the probability that the true Sharpe exceeds a benchmark (default 0).
//
// PSR = Φ( (SR - SR*) * sqrt(n - 1) / sqrt(1 - γ3*SR + ((γ4 - 1)/4)*SR^2) )

export function probabilisticSharpe({ sharpe, n, skew = 0, kurtosis = 3, benchmark = 0 }) {
  if (n < 30) return { warning: "sample too small", psr: null };
  const gamma3 = skew;
  const gamma4 = kurtosis; // raw kurtosis (3 = normal); we use (γ4 - 1) per paper
  const numerator = (sharpe - benchmark) * Math.sqrt(n - 1);
  const denominator = Math.sqrt(
    Math.max(1e-12, 1 - gamma3 * sharpe + ((gamma4 - 1) / 4) * sharpe * sharpe),
  );
  const z = numerator / denominator;
  return {
    psr: round(normalCdf(z), 4),
    zscore: round(z, 3),
    interpretation:
      normalCdf(z) > 0.95 ? "statistically distinguishable from benchmark" : "not statistically distinguishable",
  };
}

/** Minimum Track Record Length (MinTRL) — how many samples you'd need for PSR >= target. */
export function minTrackRecordLength({ sharpe, skew = 0, kurtosis = 3, benchmark = 0, target = 0.95 }) {
  const z = inverseNormal(target);
  const denom = (sharpe - benchmark) ** 2;
  if (denom <= 0) return { warning: "sharpe <= benchmark", minN: null };
  const n =
    1 +
    (z ** 2 *
      (1 - skew * sharpe + ((kurtosis - 1) / 4) * sharpe * sharpe)) /
      denom;
  return { minN: Math.ceil(n) };
}

function normalCdf(z) {
  const t = 1 / (1 + 0.2316419 * Math.abs(z));
  const d = 0.3989422804014327 * Math.exp((-z * z) / 2);
  const p = d * t * (0.31938153 + t * (-0.356563782 + t * (1.781477937 + t * (-1.821255978 + t * 1.330274429))));
  return z > 0 ? 1 - p : p;
}
function inverseNormal(p) {
  // Beasley-Springer-Moro
  const a = [-39.6968302866538, 220.946098424521, -275.928510446969, 138.357751867269, -30.6647980661472, 2.50662827745924];
  const b = [-54.4760987982241, 161.585836858041, -155.698979859887, 66.8013118877197, -13.2806815528857];
  const c = [-0.00778489400243029, -0.322396458041136, -2.40075827716184, -2.54973253934373, 4.37466414146497, 2.93816398269878];
  const d = [0.00778469570904146, 0.32246712907004, 2.445134137143, 3.75440866190742];
  const pl = 0.02425;
  let q, r;
  if (p < pl) {
    q = Math.sqrt(-2 * Math.log(p));
    return (((((c[0]*q+c[1])*q+c[2])*q+c[3])*q+c[4])*q+c[5]) / ((((d[0]*q+d[1])*q+d[2])*q+d[3])*q+1);
  } else if (p <= 1 - pl) {
    q = p - 0.5; r = q * q;
    return (((((a[0]*r+a[1])*r+a[2])*r+a[3])*r+a[4])*r+a[5])*q / (((((b[0]*r+b[1])*r+b[2])*r+b[3])*r+b[4])*r+1);
  } else {
    q = Math.sqrt(-2 * Math.log(1 - p));
    return -(((((c[0]*q+c[1])*q+c[2])*q+c[3])*q+c[4])*q+c[5]) / ((((d[0]*q+d[1])*q+d[2])*q+d[3])*q+1);
  }
}
function round(x, d) { const p = 10 ** d; return Math.round(x * p) / p; }
