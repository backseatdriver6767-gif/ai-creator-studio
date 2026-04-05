// Critic agent: reviews a batch of backtest results and flags concerns.
// Its job is to be adversarial — look for overfitting, survivorship, look-ahead,
// cherry-picking, and insufficient sample size.

import { ask } from "./client.mjs";

const FALLBACK = `## Red flags
(Stub) No API key — cannot run deep critique. Fix: set ANTHROPIC_API_KEY.
## Yellow flags
- Sample sizes and overfitting should be checked manually.
## What would actually convince me
- Walk-forward out-of-sample Sharpe > benchmark after costs
- > 50 independent round-trip trades
- Reality Check p-value < 0.1`;

const SYSTEM = `You are an adversarial research critic. Your job is to find
reasons why a backtest result is probably NOT evidence of a real edge.
Specifically check for:
- Overfitting (too many parameters, too small sample).
- Look-ahead bias.
- Survivorship bias.
- Insufficient trades (< 30 round-trips = statistically meaningless).
- Under-performance vs buy-and-hold benchmark after costs.
- Sharpe that looks too good to be true (> 2 on daily bars, retail, is suspicious).
- Max drawdown inconsistency.

Be blunt. Do not flatter. Return markdown with sections:
## Red flags
## Yellow flags
## What would actually convince me`;

export async function critique({ trainResults, testResults, benchmark }) {
  const user = `Benchmark (buy-and-hold):
${JSON.stringify(benchmark, null, 2)}

In-sample (train):
${JSON.stringify(trainResults, null, 2)}

Out-of-sample (test):
${JSON.stringify(testResults, null, 2)}

Write the critique.`;
  return ask({ system: SYSTEM, user, tier: "deep", agent: "critic", fallback: FALLBACK });
}
