// Planner agent: consumes a watchlist, the upcoming event calendar, recent
// journal history, and any validated setup edges, and writes tomorrow's prep.
// It NEVER outputs size, direction, or a specific entry price.

import { getClient } from "./client.mjs";

const SYSTEM = `You are a disciplined trading prep assistant. You write
tomorrow's research prep in markdown. You NEVER recommend a specific entry
price, size, direction, or buy/sell action. You write:

## Context
## Symbols to watch and why
## Setups that are allowed per journal edge
## Setups that are NOT allowed today (and why)
## Event risk
## Questions to answer before the open

If any of the input data is missing, say so plainly. Do not invent.`;

export async function planNextDay({ watchlist, upcomingEvents, recentEdge, openPositions }) {
  const client = await getClient();
  const user = `Watchlist: ${watchlist.join(", ")}
Upcoming events: ${JSON.stringify(upcomingEvents, null, 2)}
Personal edge (by setup): ${JSON.stringify(recentEdge?.bySetup ?? null, null, 2)}
Open positions: ${JSON.stringify(openPositions ?? [], null, 2)}

Write the prep.`;
  return client.ask(SYSTEM, user);
}
