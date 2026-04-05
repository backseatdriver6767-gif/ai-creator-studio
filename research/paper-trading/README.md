# Paper Trading Research Harness

A disciplined, honest research environment for studying day-trading and
swing-trading strategies. **Paper trading only.** No live order routing.

## What this is

- A backtesting engine with realistic transaction costs and slippage.
- A set of baseline strategies (buy-and-hold, SMA crossover, RSI mean-reversion,
  opening-range breakout).
- Performance metrics: CAGR, Sharpe, Sortino, max drawdown, win rate, profit
  factor, exposure.
- A trade journal that records every simulated fill to `journal/trades.jsonl`.
- LLM research agents (Anthropic Claude) that:
  - **Researcher** — proposes strategy parameter variations to test.
  - **Critic** — reviews backtest output and flags overfitting / survivorship /
    look-ahead bias.
  - **Journalist** — summarizes the day's research into a human-readable log.
- A curriculum tracker (`curriculum/curriculum.md`) with legitimate reading.
- A scheduler stub (`scripts/cron.mjs`) to run nightly research loops.

## What this is NOT

- **Not** a live trading bot. There is no broker integration. There will not be.
- **Not** a claim of edge. ~70–95% of retail day traders lose money (Barber &
  Odean; Brazilian CVM 2020). LLMs do not magically solve this.
- **Not** financial advice. Everything here is for education and research.

## Quick start

```bash
# From repo root
cd research/paper-trading

# Run a backtest of all baseline strategies on SPY
node src/cli.mjs backtest --symbol SPY --from 2020-01-01 --to 2024-12-31

# Run the LLM research loop (requires ANTHROPIC_API_KEY)
node src/cli.mjs research --symbol SPY --iterations 3

# Print curriculum progress
node src/cli.mjs curriculum
```

## Architecture

```
research/paper-trading/
├── src/
│   ├── cli.mjs              # Entry point
│   ├── data/yahoo.mjs       # Free Yahoo Finance daily bar fetcher
│   ├── engine/
│   │   ├── backtest.mjs     # Event-driven backtest loop
│   │   ├── metrics.mjs      # Sharpe, drawdown, etc.
│   │   └── portfolio.mjs    # Cash/position accounting
│   ├── strategies/
│   │   ├── buyAndHold.mjs
│   │   ├── smaCrossover.mjs
│   │   ├── rsiMeanReversion.mjs
│   │   └── openingRangeBreakout.mjs
│   ├── agents/
│   │   ├── researcher.mjs   # Proposes parameter sweeps
│   │   ├── critic.mjs       # Reviews results for bias
│   │   └── journalist.mjs   # Writes daily summary
│   └── journal/journal.mjs
├── curriculum/curriculum.md
├── scripts/cron.mjs         # Nightly research loop
└── data-cache/              # Cached OHLC bars
```

## Honest notes on why this is hard

1. **Survivorship bias** — Yahoo only serves symbols that still exist.
2. **Transaction costs dominate** — At retail slippage (5 bps + spread) most
   "edges" vanish. The engine models this; don't turn it off.
3. **Out-of-sample decay** — Any strategy tuned on 2015–2020 that still works
   on 2021–2024 is rare. The CLI splits data automatically.
4. **LLM agents do not have alpha.** They are useful as a disciplined critic
   and as a hypothesis generator you manually filter. Treat them as a junior
   research assistant, not an oracle.
