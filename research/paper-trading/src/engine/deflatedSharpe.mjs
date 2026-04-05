// Deflated Sharpe Ratio (Bailey & López de Prado, 2014).
// Corrects a strategy's observed Sharpe for:
//   (a) non-normality of returns (skew, kurtosis)
//   (b) multiple-testing inflation from the number of trials searched
// Returns a probability that the true Sharpe > 0.

export function deflatedSharpe({
  sharpe,
  n,                 // number of return observations
  skew = 0,
  kurtosis = 3,      // excess kurtosis + 3; use 3 for normal
  trials = 1,        // number of alternative configurations tested
  sharpeStd = null,  // std of sharpes across trials (if known)
}) {
  if (n < 30) return { warning: "sample too small", pValue: null };
  const excessK = kurtosis - 3;
  // Expected max Sharpe under the null with `trials` independent trials
  const emc = 0.5772156649; // Euler-Mascheroni
  const z1 = inverseNormal(1 - 1 / trials);
  const z2 = inverseNormal(1 - 1 / (trials * Math.E));
  const expectedMaxSharpe = (sharpeStd || 1) * ((1 - emc) * z1 + emc * z2);

  const deflated = sharpe - expectedMaxSharpe;
  const denom = Math.sqrt(
    (1 - skew * sharpe + ((excessK) / 4) * sharpe * sharpe) / (n - 1),
  );
  const zscore = denom > 0 ? deflated / denom : 0;
  return {
    observedSharpe: round(sharpe, 3),
    expectedMaxSharpe: round(expectedMaxSharpe, 3),
    deflatedSharpe: round(deflated, 3),
    zscore: round(zscore, 3),
    pValue: round(normalCdf(zscore), 4),
  };
}

function normalCdf(z) {
  // Abramowitz & Stegun 7.1.26 approx
  const t = 1 / (1 + 0.2316419 * Math.abs(z));
  const d = 0.3989422804014327 * Math.exp(-z * z / 2);
  const p =
    d *
    t *
    (0.31938153 + t * (-0.356563782 + t * (1.781477937 + t * (-1.821255978 + t * 1.330274429))));
  return z > 0 ? 1 - p : p;
}
function inverseNormal(p) {
  // Beasley-Springer-Moro; good enough here.
  const a = [-39.6968302866538, 220.946098424521, -275.928510446969,
             138.357751867269, -30.6647980661472, 2.50662827745924];
  const b = [-54.4760987982241, 161.585836858041, -155.698979859887,
             66.8013118877197, -13.2806815528857];
  const c = [-0.00778489400243029, -0.322396458041136, -2.40075827716184,
             -2.54973253934373, 4.37466414146497, 2.93816398269878];
  const d = [0.00778469570904146, 0.32246712907004, 2.445134137143,
             3.75440866190742];
  const pl = 0.02425;
  let q, r;
  if (p < pl) {
    q = Math.sqrt(-2 * Math.log(p));
    return (((((c[0]*q+c[1])*q+c[2])*q+c[3])*q+c[4])*q+c[5]) /
      ((((d[0]*q+d[1])*q+d[2])*q+d[3])*q+1);
  } else if (p <= 1 - pl) {
    q = p - 0.5; r = q * q;
    return (((((a[0]*r+a[1])*r+a[2])*r+a[3])*r+a[4])*r+a[5])*q /
      (((((b[0]*r+b[1])*r+b[2])*r+b[3])*r+b[4])*r+1);
  } else {
    q = Math.sqrt(-2 * Math.log(1 - p));
    return -(((((c[0]*q+c[1])*q+c[2])*q+c[3])*q+c[4])*q+c[5]) /
      ((((d[0]*q+d[1])*q+d[2])*q+d[3])*q+1);
  }
}
function round(x, d) {
  const p = 10 ** d;
  return Math.round(x * p) / p;
}
