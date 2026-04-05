// Thin Anthropic client wrapper used by all agents.
//
// Responsibilities:
//   1. Lazy-init the @anthropic-ai/sdk (shared across all agents)
//   2. Route each caller to the right model tier (Haiku/Sonnet/Opus)
//   3. Retry transient errors with exponential backoff
//   4. Track token usage per call and append to journal/llm-usage.jsonl
//   5. Degrade gracefully when ANTHROPIC_API_KEY is unset — each agent
//      can request a structurally valid stub via `fallback` so the
//      harness keeps working without credentials.
//
// This module does NOT cache responses or persist conversations. Agents
// are stateless by design.

import { mkdir, appendFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const USAGE_FILE = path.resolve(__dirname, "../../journal/llm-usage.jsonl");

// Model tiers. Agents pick one of these by name in their ask() call.
// Mapping deliberately indirects through this table so a single edit
// promotes every agent to a newer model.
export const MODELS = {
  fast:     "claude-haiku-4-5-20251001",   // low-cost, frequent calls
  balanced: "claude-sonnet-4-5-20250929",  // default for most agents
  deep:     "claude-opus-4-6",             // critic / red-team / architecture
};

let _sdk = null;
let _initFailed = false;

async function getSdk() {
  if (_sdk || _initFailed) return _sdk;
  if (!process.env.ANTHROPIC_API_KEY) return null;
  try {
    const mod = await import("@anthropic-ai/sdk");
    const Anthropic = mod.default || mod.Anthropic;
    _sdk = new Anthropic();
    return _sdk;
  } catch (e) {
    _initFailed = true;
    console.error("[llmClient] SDK init failed, degrading to stubs:", e.message);
    return null;
  }
}

async function logUsage(row) {
  try {
    await mkdir(path.dirname(USAGE_FILE), { recursive: true });
    await appendFile(USAGE_FILE, JSON.stringify(row) + "\n");
  } catch { /* logging should never break the agent */ }
}

/**
 * Call the LLM with system + user prompts.
 *
 * @param {Object} opts
 * @param {string} opts.system          System prompt
 * @param {string} opts.user            User prompt
 * @param {("fast"|"balanced"|"deep")} [opts.tier="balanced"]  Model tier
 * @param {number} [opts.maxTokens=1500]
 * @param {number} [opts.retries=2]     Retries on transient errors
 * @param {string} [opts.agent="unknown"] Label for usage logs
 * @param {string} [opts.fallback]      Returned verbatim if no API key.
 *                                      Agents that need to parse structured
 *                                      output should supply a valid stub.
 */
export async function ask({
  system,
  user,
  tier = "balanced",
  maxTokens = 1500,
  retries = 2,
  agent = "unknown",
  fallback,
}) {
  const sdk = await getSdk();
  if (!sdk) {
    const stub = fallback ?? `[stub] ANTHROPIC_API_KEY not set for agent=${agent}`;
    await logUsage({ ts: new Date().toISOString(), agent, tier, stub: true, tokensIn: 0, tokensOut: 0 });
    return stub;
  }

  const model = MODELS[tier] || MODELS.balanced;
  let lastErr = null;

  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      const resp = await sdk.messages.create({
        model,
        max_tokens: maxTokens,
        system,
        messages: [{ role: "user", content: user }],
      });
      const text = resp.content
        .filter((b) => b.type === "text")
        .map((b) => b.text)
        .join("\n");
      await logUsage({
        ts: new Date().toISOString(),
        agent, tier, model, stub: false,
        tokensIn: resp.usage?.input_tokens ?? null,
        tokensOut: resp.usage?.output_tokens ?? null,
        stopReason: resp.stop_reason ?? null,
      });
      return text;
    } catch (e) {
      lastErr = e;
      const transient = e?.status === 429 || e?.status === 503 || e?.status === 529;
      if (attempt < retries && transient) {
        const backoffMs = 500 * 2 ** attempt + Math.floor(Math.random() * 250);
        await new Promise((r) => setTimeout(r, backoffMs));
        continue;
      }
      break;
    }
  }

  await logUsage({ ts: new Date().toISOString(), agent, tier, error: lastErr?.message ?? "unknown" });
  if (fallback != null) return fallback;
  throw lastErr ?? new Error("LLM call failed");
}

/**
 * Back-compat shim for the old `getClient()` interface used by existing
 * agents. Returns an object exposing `.ask(system, user)` that routes
 * through the new `ask()` function with default tier.
 */
export async function getClient() {
  return {
    stub: !process.env.ANTHROPIC_API_KEY,
    async ask(system, user, opts = {}) {
      return ask({ system, user, ...opts });
    },
  };
}
