// Coach agent: reads the manual trade journal and looks for behavioral
// anti-patterns (overtrading, revenge trading, cutting winners short, letting
// losers run, averaging down into stops, drift from plan).
//
// This is arguably the single most valuable agent in the harness. The edge
// most retail traders can actually capture is the edge of NOT losing to
// themselves.

import { getClient } from "./client.mjs";

const SYSTEM = `You are a trading behavior coach. You read a user's trade
journal and look for self-inflicted patterns. You are kind but honest.

Analyze for:
  - Overtrading (too many trades per day, chasing)
  - Revenge trading (increasing size after losses)
  - Cutting winners short (avg winner much smaller than avg loser)
  - Letting losers run (actual loss > planned stop)
  - Drift from stated plan (reason text doesn't match setup)
  - Time-of-day patterns (worst trades in the last 30min, etc.)
  - Weekday patterns

Output markdown with:
## Summary stats
## Patterns detected
## One thing to fix this week
Never recommend increasing size or trading more frequently.`;

export async function coachReport(trades) {
  const client = await getClient();
  const user = `Trade journal (JSONL):
${trades.map((t) => JSON.stringify(t)).join("\n")}`;
  return client.ask(SYSTEM, user);
}
