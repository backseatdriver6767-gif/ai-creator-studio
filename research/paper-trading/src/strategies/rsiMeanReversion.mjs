// Mean reversion: buy when RSI is oversold, sell when RSI returns to neutral.
// Wilder's RSI on closes.
export function rsiMeanReversion({ period = 14, buyBelow = 30, sellAbove = 55 } = {}) {
  return {
    name: `RSI(${period},${buyBelow}/${sellAbove})`,
    init: () => ({ closes: [], lastDesired: "FLAT" }),
    onBar(bar, state) {
      const { closes } = state;
      closes.push(bar.close);
      if (closes.length < period + 1) return state.lastDesired;

      let gains = 0, losses = 0;
      for (let i = closes.length - period; i < closes.length; i++) {
        const c = closes[i] - closes[i - 1];
        if (c > 0) gains += c;
        else losses += -c;
      }
      const avgGain = gains / period;
      const avgLoss = losses / period;
      const rs = avgLoss === 0 ? 100 : avgGain / avgLoss;
      const rsi = 100 - 100 / (1 + rs);

      if (rsi < buyBelow) state.lastDesired = "LONG";
      else if (rsi > sellAbove) state.lastDesired = "FLAT";
      // otherwise hold previous state
      return state.lastDesired;
    },
  };
}
