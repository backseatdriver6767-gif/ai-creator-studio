// Shared math helpers used throughout the harness.

export function round(x, d = 2) {
  const p = 10 ** d;
  return Math.round(x * p) / p;
}

export function mean(xs) {
  if (!xs.length) return 0;
  return xs.reduce((s, x) => s + x, 0) / xs.length;
}

export function stdev(xs, m = null) {
  if (xs.length < 2) return 0;
  const mu = m ?? mean(xs);
  const v = xs.reduce((s, x) => s + (x - mu) ** 2, 0) / (xs.length - 1);
  return Math.sqrt(v);
}

export function variance(xs) {
  if (xs.length < 2) return 0;
  const m = mean(xs);
  return xs.reduce((s, x) => s + (x - m) ** 2, 0) / (xs.length - 1);
}
