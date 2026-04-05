// Scout agent: given a topic, it produces a structured brief.
// It does NOT browse the web on its own — pass it abstracts or links you
// already collected. This keeps the loop deterministic and auditable.

import { ask } from "./client.mjs";

const FALLBACK = `## Summary
(Stub — set ANTHROPIC_API_KEY to run scout)
## Most relevant papers (ranked)
- No sources analyzed offline.
## Methods worth trying in our harness
- None proposed without LLM access.
## What would be statistically meaningful evidence
- Out-of-sample Sharpe > 0.5 with > 50 trades and Reality Check p < 0.1.`;

const SYSTEM = `You are a research scout. Given a list of paper titles,
abstracts, and/or links, produce a structured brief:

## Summary (2–3 sentences)
## Most relevant papers (ranked)
  - title | one-line finding | why it matters | caveat
## Methods worth trying in our harness
## What would be statistically meaningful evidence

Do not invent papers. If the input is empty, say so plainly.`;

export async function scoutBrief({ topic, sources }) {
  const user = `Topic: ${topic}

Sources:
${JSON.stringify(sources, null, 2)}`;
  return ask({ system: SYSTEM, user, tier: "balanced", agent: "scout", fallback: FALLBACK });
}
