// Mean reversion: buy when RSI is oversold, sell when RSI returns to neutral.
// Wilder's RSI on closes.
export function rsiMeanReversion({ period = 14, buyBelow = 30, sellAbove = 55 } = {}) {
  return {
    name: `RSI(${period},${buyBelow}/${sellAbove})`,
    init: () => ({ closes: [], prevRsi: null, avgGain: null, avgLoss: null }),
    onBar(bar, state) {
      const { closes } = state;
      closes.push(bar.close);
      if (closes.length < period + 1) return "FLAT";

      const changes = [];
      for (let i = closes.length - period; i < closes.length; i++) {
        changes.push(closes[i] - closes[i - 1]);
      }
      let gains = 0, losses = 0;
      for (const c of changes) {
        if (c > 0) gains += c;
        else losses += -c;
      }
      const avgGain = gains / period;
      const avgLoss = losses / period;
      const rs = avgLoss === 0 ? 100 : avgGain / avgLoss;
      const rsi = 100 - 100 / (1 + rs);

      if (rsi < buyBelow) return "LONG";
      if (rsi > sellAbove) return "FLAT";
      // hold current state
      return state.lastDesired || "FLAT";
    },
  };
}
