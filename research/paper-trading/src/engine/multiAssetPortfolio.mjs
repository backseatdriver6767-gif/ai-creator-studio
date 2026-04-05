// Multi-asset portfolio accounting with optional shorting and borrow cost.
// This is a book, not a broker — every operation is simulated.
//
// Position sign convention: positive shares = long, negative = short.
// Borrow cost is charged daily on short market value at an annualized rate.

export class MultiAssetPortfolio {
  constructor({
    startingCash = 100_000,
    feeBps = 1,
    slippageBps = 5,
    borrowRateAnnual = 0.03, // 300 bps annualized
    allowShorting = true,
  } = {}) {
    this.startingCash = startingCash;
    this.cash = startingCash;
    /** @type {Record<string, number>} */
    this.positions = {};
    /** @type {Record<string, number>} avg cost basis per symbol */
    this.avgCost = {};
    this.feeBps = feeBps;
    this.slippageBps = slippageBps;
    this.borrowRateAnnual = borrowRateAnnual;
    this.allowShorting = allowShorting;
    /** @type {Array<{date: string, side: string, symbol: string, shares: number, price: number, fee: number, borrowCost?: number}>} */
    this.fills = [];
    /** @type {Array<{date: string, equity: number}>} */
    this.equityCurve = [];
  }

  marketValue(prices) {
    let v = this.cash;
    for (const [sym, sh] of Object.entries(this.positions)) {
      const p = prices[sym];
      if (p != null) v += sh * p;
    }
    return v;
  }

  mark(date, prices) {
    // Accrue borrow cost for any short positions
    let borrow = 0;
    for (const [sym, sh] of Object.entries(this.positions)) {
      if (sh < 0) {
        const p = prices[sym];
        if (p != null) {
          const daily = (this.borrowRateAnnual / 252) * Math.abs(sh) * p;
          this.cash -= daily;
          borrow += daily;
        }
      }
    }
    this.equityCurve.push({ date, equity: this.marketValue(prices), borrow: round(borrow, 4) });
  }

  /**
   * Target a signed share count for a symbol at a given reference price.
   * Trades the delta. No partial fills here; use the limit-fill module
   * separately if you want richer execution.
   */
  targetShares(date, symbol, targetShares, rawPrice) {
    if (!this.allowShorting && targetShares < 0) targetShares = 0;
    const current = this.positions[symbol] || 0;
    const delta = targetShares - current;
    if (delta === 0) return;
    const side = delta > 0 ? "BUY" : "SELL";
    const slipMult = side === "BUY" ? 1 + this.slippageBps / 10_000 : 1 - this.slippageBps / 10_000;
    const price = rawPrice * slipMult;
    const notional = Math.abs(delta) * price;
    const fee = (notional * this.feeBps) / 10_000;
    this.cash -= delta * price; // positive delta (buy) reduces cash
    this.cash -= fee;
    // Update cost basis. Four cases: open-from-flat, add to same direction,
    // partial exit (keep basis), full flip (new basis at fill price).
    const prev = current;
    const next = current + delta;
    const sameDirection = Math.sign(prev) === Math.sign(next) && prev !== 0;
    const crossedZero = prev !== 0 && Math.sign(prev) !== Math.sign(next) && next !== 0;
    if (prev === 0 && next !== 0) {
      this.avgCost[symbol] = price;
    } else if (sameDirection && Math.abs(next) > Math.abs(prev)) {
      const prevCost = (this.avgCost[symbol] || 0) * Math.abs(prev);
      const addCost = price * Math.abs(delta);
      this.avgCost[symbol] = (prevCost + addCost) / Math.abs(next);
    } else if (crossedZero) {
      // The flipped portion's cost basis is the current fill price.
      this.avgCost[symbol] = price;
    }
    // partial exits leave avgCost unchanged.
    this.positions[symbol] = next;
    if (next === 0) {
      delete this.positions[symbol];
      delete this.avgCost[symbol];
    }
    this.fills.push({ date, side, symbol, shares: delta, price: round(price, 4), fee: round(fee, 4) });
  }

  flatten(date, prices) {
    for (const sym of Object.keys(this.positions)) {
      const p = prices[sym];
      if (p != null) this.targetShares(date, sym, 0, p);
    }
  }
}

function round(x, d) { const p = 10 ** d; return Math.round(x * p) / p; }
