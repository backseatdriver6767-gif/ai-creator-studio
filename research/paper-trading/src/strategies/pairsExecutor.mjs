// Pairs trading executor built on top of pairsTrading.mjs (cointegration +
// spread z-score). Single-pair implementation: long A / short B when the
// spread is below -entryZ, reverse when above +entryZ, flat near zero.

import { spreadZ, cointegrationScore } from "./pairsTrading.mjs";

export function pairsExecutor({ pair: [A, B], window = 30, entryZ = 2, exitZ = 0.5, hedgeRatio = null } = {}) {
  return {
    name: `Pairs(${A}/${B})`,
    onBar({ history }) {
      if (history.length < window + 10) return { [A]: 0, [B]: 0 };
      const aCloses = history.map((h) => h[A]?.close).filter(Boolean);
      const bCloses = history.map((h) => h[B]?.close).filter(Boolean);
      if (aCloses.length < window || bCloses.length < window) return { [A]: 0, [B]: 0 };
      const { z } = spreadZ(aCloses, bCloses, window);
      const curZ = z[z.length - 1];
      const beta = hedgeRatio ?? cointegrationScore(aCloses, bCloses).beta;
      if (curZ == null) return { [A]: 0, [B]: 0 };

      if (curZ < -entryZ) {
        // spread low → A cheap vs B → long A, short B
        return { [A]: 0.5, [B]: -0.5 * beta };
      }
      if (curZ > entryZ) {
        return { [A]: -0.5, [B]: 0.5 * beta };
      }
      if (Math.abs(curZ) < exitZ) {
        return { [A]: 0, [B]: 0 };
      }
      return null; // hold previous
    },
  };
}
