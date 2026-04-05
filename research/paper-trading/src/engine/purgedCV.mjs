// Purged K-fold cross-validation with embargo (López de Prado, AFML §7).
//
// The standard sklearn KFold is wrong for time series when labels are
// formed over overlapping windows — information leaks across folds. Purging
// removes training samples whose label window overlaps the test set.
// Embargo adds a buffer on the right edge of the test set to prevent
// serial-correlation leakage in the other direction.
//
// This module returns only the INDEX sets. The caller plugs them into
// whatever training procedure they're running.

export function purgedKFold({ n, folds = 5, labelWindow = 1, embargoPct = 0.01 }) {
  if (folds < 2) throw new Error("folds must be >= 2");
  const embargo = Math.max(0, Math.floor(n * embargoPct));
  const foldSize = Math.floor(n / folds);
  /** @type {Array<{train: number[], test: number[]}>} */
  const splits = [];
  for (let k = 0; k < folds; k++) {
    const testStart = k * foldSize;
    const testEnd = k === folds - 1 ? n : testStart + foldSize;
    const testIdx = [];
    for (let i = testStart; i < testEnd; i++) testIdx.push(i);

    const purgeStart = Math.max(0, testStart - labelWindow);
    const purgeEnd = Math.min(n, testEnd + labelWindow);
    const embargoEnd = Math.min(n, testEnd + embargo);

    const trainIdx = [];
    for (let i = 0; i < n; i++) {
      if (i >= purgeStart && i < purgeEnd) continue; // purged
      if (i >= testEnd && i < embargoEnd) continue;  // embargoed
      trainIdx.push(i);
    }
    splits.push({ train: trainIdx, test: testIdx });
  }
  return splits;
}

/**
 * Combinatorial purged CV: generate C(N, k) train/test splits where k of N
 * groups are held out each time. Produces many overlapping test paths, which
 * reduces variance in the final OOS estimate.
 */
export function combinatorialPurgedCV({ n, groups = 6, testGroups = 2, labelWindow = 1, embargoPct = 0.01 }) {
  const size = Math.floor(n / groups);
  const ranges = [];
  for (let g = 0; g < groups; g++) {
    const start = g * size;
    const end = g === groups - 1 ? n : start + size;
    ranges.push([start, end]);
  }
  const combos = kCombinations(
    Array.from({ length: groups }, (_, i) => i),
    testGroups,
  );
  const embargo = Math.max(0, Math.floor(n * embargoPct));
  const out = [];
  for (const combo of combos) {
    const testIdx = [];
    const purgedRanges = combo.map((g) => [
      Math.max(0, ranges[g][0] - labelWindow),
      Math.min(n, ranges[g][1] + Math.max(labelWindow, embargo)),
    ]);
    for (const g of combo) for (let i = ranges[g][0]; i < ranges[g][1]; i++) testIdx.push(i);
    const trainIdx = [];
    for (let i = 0; i < n; i++) {
      if (purgedRanges.some(([s, e]) => i >= s && i < e)) continue;
      trainIdx.push(i);
    }
    out.push({ testGroups: combo, train: trainIdx, test: testIdx });
  }
  return out;
}

function kCombinations(arr, k) {
  if (k === 0) return [[]];
  if (k > arr.length) return [];
  const [first, ...rest] = arr;
  const withFirst = kCombinations(rest, k - 1).map((c) => [first, ...c]);
  const withoutFirst = kCombinations(rest, k);
  return [...withFirst, ...withoutFirst];
}
