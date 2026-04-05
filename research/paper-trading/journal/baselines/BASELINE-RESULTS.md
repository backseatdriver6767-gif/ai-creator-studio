# Baseline Results — Real Market Data (honest)

**Run:** SPY, QQQ, IWM · 2015-01-01 → 2024-12-31 · 2,516 daily bars each
**Source:** Yahoo v8 chart endpoint (split+div adjusted)
**Cost model:** 1 bps commission + 5 bps slippage per side

## Headline finding

Across the 4 strategies × 3 benchmark ETFs × 10 years = 12 real-data tests:

- **0 strategies beat buy-and-hold in total return.**
- **1 strategy (Donchian 20/10 on SPY)** matched B&H's risk-adjusted return with materially lower drawdown (−9% vs −34%). That's the only result in the entire run that isn't worse than the benchmark on at least one major dimension.
- **Reality Check p-value ≥ 0.958 on all three symbols.** After correcting for multiple-testing, *none* of the strategies are statistically distinguishable from random bootstrap noise vs. the benchmark.
- **Deflated Sharpe p = 1.00** on SPY and QQQ. The best observed Sharpe is exactly what you'd expect from testing 4 strategies on noise.
- **IWM deflated Sharpe p = 0.0002 with a *negative* deflated value of −0.07.** Reliably worse than chance — these strategies on Russell 2000 are a slightly rigged coin flip against you.
- **Classic in-sample → out-of-sample collapse:** SPY SMA(20/50) train Sharpe 1.11 → test Sharpe 0.20 (5.5× drop). This is what overfitting to a 7-year window looks like in the wild.

## By symbol

### SPY (S&P 500, Buy-and-Hold Sharpe 0.79 / CAGR 13.1% / MaxDD −33.7%)

| Strategy          | Train | Test | Full | CAGR%  | MaxDD%  | Trades |
| ----------------- | ----: | ---: | ---: | -----: | ------: | -----: |
| BuyAndHold        |  0.88 | 0.57 | 0.79 |  13.09 |  −33.71 |      1 |
| SMA(20/50)        |  1.11 | 0.20 | 0.76 |   8.23 |  −28.22 |     24 |
| SMA(10/30)        |  0.65 | 0.61 | 0.59 |   6.12 |  −17.42 |     38 |
| RSI(14,30/55)     |  0.61 | 0.86 | 0.65 |   7.68 |  −28.82 |     32 |
| **Donchian(20/10)** | 0.88 | 0.95 | **0.86** | 7.55 | **−9.01** | 59 |

- Walk-forward mean OOS Sharpe (SMA grid, 5 folds): **0.72** ← worse than B&H's 0.79
- Monte Carlo SMA(10/30): Sharpe p05 **0.13** / p50 **0.61** / p95 **1.03** (coherent with full 0.59)
- Reality Check p = **0.994**
- Deflated Sharpe: 0.439, p = 1.00

### QQQ (Nasdaq-100, Buy-and-Hold Sharpe 0.88 / CAGR 18.4% / MaxDD −35.1%)

| Strategy          | Train | Test | Full | CAGR%  | MaxDD%  | Trades |
| ----------------- | ----: | ---: | ---: | -----: | ------: | -----: |
| **BuyAndHold**    |  1.08 | 0.49 | **0.88** | **18.37** | −35.12 |  1 |
| SMA(20/50)        |  0.71 | 0.42 | 0.57 |   7.97 |  −30.00 |     25 |
| SMA(10/30)        |  1.04 | 0.51 | 0.84 |  11.28 |  −21.71 |     41 |
| RSI(14,30/55)     |  0.55 | 0.59 | 0.54 |   7.01 |  −22.40 |     29 |
| Donchian(20/10)   |  0.74 | 0.58 | 0.64 |   6.85 |  −19.72 |     66 |

- Best strategy (SMA 10/30) underperforms B&H by **7.1 percentage points of annual return**.
- Walk-forward mean OOS Sharpe: **0.81** ← worse than B&H's 0.88
- Reality Check p = **0.992**
- Deflated Sharpe: 0.419, p = 1.00

### IWM (Russell 2000, Buy-and-Hold Sharpe 0.45 / CAGR 7.9% / MaxDD −41.1%)

| Strategy          | Train | Test | Full | CAGR%  | MaxDD%  | Trades |
| ----------------- | ----: | ---: | ---: | -----: | ------: | -----: |
| **BuyAndHold**    |  0.58 | 0.16 | **0.45** |   7.88 | −41.13 |  1 |
| SMA(20/50)        |  0.63 |−0.26 | 0.35 |   4.26 |  −35.32 |     27 |
| SMA(10/30)        |  0.34 |−0.35 | 0.08 |   0.03 |  −42.83 |     50 |
| RSI(14,30/55)     |  0.23 | 0.08 | 0.15 |   1.05 |  −34.33 |     34 |
| Donchian(20/10)   |  0.29 |−0.27 | 0.08 |   0.24 |  −33.29 |     65 |

- **Three of four strategies have negative out-of-sample Sharpe.**
- SMA(10/30) makes essentially zero return over 10 years (CAGR 0.03%) while carrying a −42.8% drawdown.
- Monte Carlo p05 Sharpe: **−0.53**
- Reality Check p = **0.958**
- Deflated Sharpe: −0.071, p = **0.0002** ← significantly worse than null

## What this actually means

This is the single most valuable output this entire research harness can produce, and it matches exactly what the academic literature (Bailey & López de Prado, Harvey, Liu & Zhu — *…and the Cross-Section of Expected Returns*) predicts: **naive technical strategies on liquid US equity index ETFs do not produce alpha after reasonable cost assumptions and multiple-testing correction.**

This does *not* mean:

- Every trading strategy loses (it doesn't — market makers, cross-asset carry, vol arb, and a narrow set of factor strategies demonstrably work, but none of them are reproducible from a 10-line LLM suggestion).
- The harness is broken (the engine, stats, and data are all working correctly — that's exactly how we got a clean `p = 0.0002` negative-deflated-Sharpe on IWM).
- Buy-and-hold is a "strategy" in any skill sense — it's a benchmark you have to beat before you can claim to have found anything.

This *does* mean:

- Any "discovery" from swapping indicators, tweaking parameters, or running more strategies on this same data without correcting for multiple-testing is false by construction. You need either (a) more symbols, (b) walk-forward with a purged embargo, (c) an economic hypothesis that reduces the search space, or ideally all three.
- Shadow-trading forward (from today) and tracking a personal trade journal are now the two highest-value activities for learning whether an edge exists, because in-sample backtests on this data are exhausted.

## Reproducibility

Manifests in `journal/manifests/` pin git SHA, engine version, data hash, and parameters. To reproduce:

```bash
node research/paper-trading/scripts/baseline.mjs SPY,QQQ,IWM 2015-01-01 2024-12-31
```

Data hashes (should match exactly on any fresh run with the same date window):

- SPY: `c9edad3e13c6c6d9`
- QQQ: `ced0f5135de020b1`
- IWM: `3135d186519571e2`

## Bugs found and fixed by this run

1. **Stooq and Yahoo v7 CSV both dead in 2026.** Added `src/data/yahooV8Daily.mjs` using the v8 chart endpoint and moved it to the head of the multi-source router.
2. **Monte Carlo trade-return bootstrap annualized with √252** (assumed daily-sampled returns). Changed to annualize by actual observed trade frequency. First run reported p50 Sharpe of 4.94 on SPY SMA(10/30); corrected value is 0.61, which correctly matches the full-series Sharpe of 0.59.
3. **DST bug in synthetic test-fixture date generator** (`smoke.mjs`) that caused `checkIntegrity` to correctly flag duplicate dates on 2020-03-08 and 2021-03-14. Fixed by using UTC date arithmetic.
