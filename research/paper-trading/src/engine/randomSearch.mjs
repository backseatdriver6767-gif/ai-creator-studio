// Random hyperparameter search.
//
// Grid search is the obvious baseline (see walkForward.mjs) but it has a
// well-known failure mode: in a d-dimensional parameter space, grid
// search wastes effort on dimensions that don't matter. Random search
// hits a wider variety of values on every axis for the same total budget
// and is provably better whenever some dimensions are more important
// than others — which is every real problem (Bergstra & Bengio 2012).
//
// Inputs are a search space description and an objective function that
// takes a parameter dict and returns { score, metrics }. Everything else
// (train/test split, purged CV, time-based holdout) is the caller's
// responsibility — this module is a pure explorer.
//
// Also supported: a very small seeded RNG so runs are reproducible, and
// early stopping when successive iterations stop improving the incumbent
// best.

/**
 * @typedef {Object} ParamSpec
 *   A specification for one parameter. Exactly one of the following shapes:
 *     { choices: any[] }                         — categorical
 *     { intRange: [lo, hi] }                     — uniform integer in [lo, hi]
 *     { floatRange: [lo, hi] }                   — uniform float in [lo, hi]
 *     { logRange: [lo, hi] }                     — log-uniform (good for learning rates etc.)
 */

/**
 * Linear congruential RNG. Tiny, reproducible, not cryptographic.
 * Deliberately not using Math.random so runs with the same seed are
 * byte-identical across machines.
 */
function makeRng(seed = 42) {
  let s = (seed >>> 0) || 1;
  return () => {
    s = (s * 1664525 + 1013904223) >>> 0;
    return s / 0xffffffff;
  };
}

function sampleOne(spec, rng) {
  if (spec.choices) {
    return spec.choices[Math.floor(rng() * spec.choices.length)];
  }
  if (spec.intRange) {
    const [lo, hi] = spec.intRange;
    return Math.floor(lo + rng() * (hi - lo + 1));
  }
  if (spec.floatRange) {
    const [lo, hi] = spec.floatRange;
    return lo + rng() * (hi - lo);
  }
  if (spec.logRange) {
    const [lo, hi] = spec.logRange;
    if (lo <= 0 || hi <= 0) throw new Error("logRange requires positive bounds");
    const a = Math.log(lo), b = Math.log(hi);
    return Math.exp(a + rng() * (b - a));
  }
  throw new Error("Unknown ParamSpec: " + JSON.stringify(spec));
}

/**
 * Run a random search over a parameter space.
 *
 * @param {Object<string, ParamSpec>} space
 * @param {(params: Object) => ({ score: number, metrics?: any } | Promise<...>)} evaluate
 *        A sync or async function. Higher score = better.
 * @param {Object} [opts]
 * @param {number} [opts.iters=100]          Total evaluations
 * @param {number} [opts.seed=42]            RNG seed
 * @param {number} [opts.earlyStopRounds]    If set, stop after this many iters with no improvement
 * @param {(row: Object) => void} [opts.onStep]  Hook called after each eval
 * @returns {Promise<{ best: Object, history: Object[] }>}
 */
export async function randomSearch(space, evaluate, opts = {}) {
  const { iters = 100, seed = 42, earlyStopRounds, onStep } = opts;
  const rng = makeRng(seed);
  const history = [];
  let best = null;
  let sinceImprovement = 0;

  for (let i = 0; i < iters; i++) {
    const params = {};
    for (const [k, v] of Object.entries(space)) params[k] = sampleOne(v, rng);

    let score = null;
    let metrics = null;
    let error = null;
    try {
      const r = await evaluate(params);
      score = r.score ?? null;
      metrics = r.metrics ?? null;
    } catch (e) {
      error = e.message;
    }

    const row = { iter: i, params, score, metrics, error };
    history.push(row);
    if (onStep) onStep(row);

    if (score != null && (best == null || score > best.score)) {
      best = { ...row };
      sinceImprovement = 0;
    } else {
      sinceImprovement++;
    }

    if (earlyStopRounds && sinceImprovement >= earlyStopRounds) {
      break;
    }
  }

  return { best, history };
}

/**
 * Deterministically enumerate a full grid. Kept here alongside random
 * search so callers can swap easily. Warns if the grid is larger than
 * `budget` — you almost always want random search at that point.
 */
export function enumerateGrid(space, budget = 1_000_000) {
  const keys = Object.keys(space);
  const lists = keys.map((k) => {
    const spec = space[k];
    if (spec.choices) return spec.choices;
    if (spec.intRange) {
      const [lo, hi] = spec.intRange;
      const arr = [];
      for (let v = lo; v <= hi; v++) arr.push(v);
      return arr;
    }
    throw new Error("enumerateGrid only supports choices/intRange dimensions");
  });
  const out = [];
  const rec = (i, acc) => {
    if (out.length >= budget) return;
    if (i === keys.length) { out.push({ ...acc }); return; }
    for (const v of lists[i]) {
      acc[keys[i]] = v;
      rec(i + 1, acc);
      if (out.length >= budget) return;
    }
  };
  rec(0, {});
  return out;
}
