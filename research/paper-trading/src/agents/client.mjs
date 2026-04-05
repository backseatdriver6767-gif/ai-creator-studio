// Thin Anthropic client wrapper used by all agents. Reuses @anthropic-ai/sdk
// already in the root package.json. If no API key is set, returns a stub so
// the rest of the harness still runs (useful in CI / without credentials).

let _client = null;

export async function getClient() {
  if (_client) return _client;
  if (!process.env.ANTHROPIC_API_KEY) {
    _client = {
      stub: true,
      async ask(system, user) {
        return `[stub] ANTHROPIC_API_KEY not set. Would have asked:\n---\nSYSTEM: ${system.slice(0, 120)}...\nUSER: ${user.slice(0, 200)}...`;
      },
    };
    return _client;
  }
  const mod = await import("@anthropic-ai/sdk");
  const Anthropic = mod.default || mod.Anthropic;
  const sdk = new Anthropic();
  _client = {
    stub: false,
    async ask(system, user) {
      const resp = await sdk.messages.create({
        model: "claude-opus-4-6",
        max_tokens: 1500,
        system,
        messages: [{ role: "user", content: user }],
      });
      return resp.content
        .filter((b) => b.type === "text")
        .map((b) => b.text)
        .join("\n");
    },
  };
  return _client;
}
