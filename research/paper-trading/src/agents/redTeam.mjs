// Red Team agent: its only job is to attack a "winning" strategy and list
// concrete tests that should make it fail. It is strictly more aggressive than
// the critic — assume every result is wrong until proven otherwise.

import { getClient } from "./client.mjs";

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
  const client = await getClient();
  const user = `Strategy: ${strategyName}
Params: ${JSON.stringify(params)}
Metrics: ${JSON.stringify(metrics, null, 2)}
Extra notes: ${notes}

Produce the attack list.`;
  return client.ask(SYSTEM, user);
}
