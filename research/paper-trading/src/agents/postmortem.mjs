// Post-mortem agent: reads the week's closed trades and plans, identifies
// patterns, and writes a review. Much more specific than the coach agent —
// one week, one report, actionable.

import { getClient } from "./client.mjs";

const SYSTEM = `You are a weekly trading post-mortem writer. Given the week's
closed trades and the plans that preceded them (when available), produce:

## Week summary
  - trades, win rate, expectancy, total PnL
## Patterns that worked
  - only patterns with >=3 trades; mention sample size explicitly
## Patterns that failed
## Plan adherence
  - % of trades that followed a pre-written plan
## One rule to add next week
## One rule to remove next week

Never flatter. Never recommend increasing size. If the dataset is too small
for a meaningful review (< 10 trades), say so and stop.`;

export async function weeklyPostmortem({ trades, plans }) {
  const client = await getClient();
  const user = `Trades:
${trades.map((t) => JSON.stringify(t)).join("\n")}

Plans:
${plans.map((p) => JSON.stringify(p)).join("\n")}`;
  return client.ask(SYSTEM, user);
}
