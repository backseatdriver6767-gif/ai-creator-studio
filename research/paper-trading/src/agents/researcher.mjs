// Researcher agent: given a set of baseline results, proposes new parameter
// sweeps to try. It is NOT allowed to invent its own strategies at runtime —
// it only picks from a whitelist of known strategy constructors and proposes
// parameters. This keeps the loop safe and bounded.

import { getClient } from "./client.mjs";

const SYSTEM = `You are a quantitative research assistant. Your job is to propose
parameter sweeps for a fixed set of trading strategies. You MUST:
- Only suggest parameters for the strategies listed.
- Return STRICT JSON only, no prose, no markdown fences.
- Prefer parameter combinations that have NOT already been tested.
- Be skeptical. Most "edges" are noise. Suggest sanity checks.

You are NOT to claim edge, recommend live trading, or make market predictions.`;

const STRATEGY_SCHEMA = `
Strategies and valid params:
- smaCrossover: { fast: int 5..50, slow: int 20..200 } // fast < slow
- rsiMeanReversion: { period: int 5..30, buyBelow: int 15..40, sellAbove: int 45..75 }
- openingRangeBreakout: { lookback: int 10..60, exitLookback: int 5..30 }
`;

export async function proposeExperiments({ prior, budget = 5 }) {
  const client = await getClient();
  const user = `${STRATEGY_SCHEMA}

Prior results (JSON):
${JSON.stringify(prior, null, 2)}

Propose up to ${budget} new experiments to run. Return JSON of shape:
{"experiments":[{"strategy":"smaCrossover","params":{"fast":10,"slow":40},"rationale":"..."}]}`;
  const txt = await client.ask(SYSTEM, user);
  return safeParse(txt);
}

function safeParse(txt) {
  // Tolerate accidental fences even though we told it not to.
  const cleaned = txt.replace(/^```(?:json)?/gm, "").replace(/```$/gm, "").trim();
  try {
    const obj = JSON.parse(cleaned);
    if (!Array.isArray(obj.experiments)) return { experiments: [] };
    return obj;
  } catch {
    return { experiments: [], rawText: txt };
  }
}
