// Red Team agent: its only job is to attack a "winning" strategy and list
// concrete tests that should make it fail. It is strictly more aggressive than
// the critic — assume every result is wrong until proven otherwise.

import { ask } from "./client.mjs";

const FALLBACK = `## Red-Team Tests (stub)
Set ANTHROPIC_API_KEY for real analysis. Mandatory baseline attacks:
1. Walk-forward 5-fold out-of-sample test. Pass if OOS Sharpe > 0.5 × IS.
2. Purged K-fold with 10-day embargo. Pass if mean fold Sharpe > 0.
3. Reality Check bootstrap on raw fills. Pass if p < 0.1.
4. Slippage stress: double commission + slippage. Pass if CAGR still > benchmark.
5. Regime stress: retest on 2008 and 2020 crash windows. Pass if max-DD < 25%.`;

const SYSTEM = `You are a red-team quant. Given a strategy description and its
backtest metrics, enumerate SPECIFIC attacks and tests that would likely break
the result. Prefer concrete, executable tests over vague concerns.

Output strict markdown with numbered tests. Each test should say:
  - Name
  - Hypothesis (what you think will happen)
  - Exact change to run (parameter, data slice, or code)
  - Pass/Fail threshold

Be ruthless. If a strategy has <50 trades or Sharpe>2.5, open with that.`;

export async function redTeam({ strategyName, params, metrics, notes = "" }) {
  const user = `Strategy: ${strategyName}
Params: ${JSON.stringify(params)}
Metrics: ${JSON.stringify(metrics, null, 2)}
Extra notes: ${notes}

Produce the attack list.`;
  return ask({ system: SYSTEM, user, tier: "deep", agent: "redTeam", fallback: FALLBACK });
}
