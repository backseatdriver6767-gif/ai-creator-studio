// Classic trend-following: long when fast SMA > slow SMA, flat otherwise.
export function smaCrossover({ fast = 20, slow = 50 } = {}) {
  return {
    name: `SMA(${fast}/${slow})`,
    init: () => ({ closes: [] }),
    onBar(bar, state) {
      state.closes.push(bar.close);
      if (state.closes.length < slow) return "FLAT";
      const fastAvg = avg(state.closes.slice(-fast));
      const slowAvg = avg(state.closes.slice(-slow));
      return fastAvg > slowAvg ? "LONG" : "FLAT";
    },
  };
}

function avg(xs) {
  return xs.reduce((s, x) => s + x, 0) / xs.length;
}
