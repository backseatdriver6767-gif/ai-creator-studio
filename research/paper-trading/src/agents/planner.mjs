// Planner agent: consumes a watchlist, the upcoming event calendar, recent
// journal history, and any validated setup edges, and writes tomorrow's prep.
// It NEVER outputs size, direction, or a specific entry price.

import { ask } from "./client.mjs";

const FALLBACK = `## Context
(Stub — set ANTHROPIC_API_KEY to run planner)
## Symbols to watch and why
- Unavailable offline.
## Setups that are allowed per journal edge
- Unknown.
## Setups that are NOT allowed today (and why)
- Unknown.
## Event risk
- Unknown.
## Questions to answer before the open
- Review your journal manually.`;

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
  const user = `Watchlist: ${watchlist.join(", ")}
Upcoming events: ${JSON.stringify(upcomingEvents, null, 2)}
Personal edge (by setup): ${JSON.stringify(recentEdge?.bySetup ?? null, null, 2)}
Open positions: ${JSON.stringify(openPositions ?? [], null, 2)}

Write the prep.`;
  return ask({
    system: SYSTEM,
    user,
    tier: "balanced",
    agent: "planner",
    fallback: FALLBACK,
  });
}
