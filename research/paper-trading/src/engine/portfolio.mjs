// Cash + single-symbol long/flat portfolio accounting.
// Intentionally simple: one symbol, long or flat, no shorting, no margin.
// Extend later if/when you actually have an edge to test.

export class Portfolio {
  constructor({ startingCash = 100_000, feeBps = 1, slippageBps = 5 } = {}) {
    this.startingCash = startingCash;
    this.cash = startingCash;
    this.shares = 0;
    this.feeBps = feeBps; // per-side commission in basis points
    this.slippageBps = slippageBps; // per-side slippage
    /** @type {Array<{date: string, side: "BUY"|"SELL", price: number, shares: number, fee: number, equity: number}>} */
    this.fills = [];
    /** @type {Array<{date: string, equity: number}>} */
    this.equityCurve = [];
  }

  marketValue(price) {
    return this.cash + this.shares * price;
  }

  mark(date, price) {
    this.equityCurve.push({ date, equity: this.marketValue(price) });
  }

  /** Buy with all available cash at executionPrice (adjusted for slippage). */
  buy(date, rawPrice) {
    if (this.shares > 0 || this.cash <= 0) return;
    const price = rawPrice * (1 + this.slippageBps / 10_000);
    const feeRate = this.feeBps / 10_000;
    const shares = Math.floor(this.cash / (price * (1 + feeRate)));
    if (shares <= 0) return;
    const gross = shares * price;
    const fee = gross * feeRate;
    this.cash -= gross + fee;
    this.shares += shares;
    this.fills.push({
      date,
      side: "BUY",
      price,
      shares,
      fee,
      equity: this.marketValue(rawPrice),
    });
  }

  /** Sell entire position. */
  sell(date, rawPrice) {
    if (this.shares <= 0) return;
    const price = rawPrice * (1 - this.slippageBps / 10_000);
    const feeRate = this.feeBps / 10_000;
    const gross = this.shares * price;
    const fee = gross * feeRate;
    this.cash += gross - fee;
    const shares = this.shares;
    this.shares = 0;
    this.fills.push({
      date,
      side: "SELL",
      price,
      shares,
      fee,
      equity: this.marketValue(rawPrice),
    });
  }
}
