// Journalist agent: writes a human-readable daily summary of the research
// loop into journal/daily/<date>.md. No trading claims; just a log.

import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { ask } from "./client.mjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DAILY_DIR = path.resolve(__dirname, "../../journal/daily");

const FALLBACK = `# Daily Research Journal (stub)

_(Set ANTHROPIC_API_KEY to generate real journal entries)_

## Runs today
See \`journal/runs.jsonl\` for raw records.

## Critic's notes
Unavailable offline.

## Next questions to investigate
- Re-run with LLM access for proper synthesis.`;

const SYSTEM = `You write concise daily research journal entries for a paper
trading harness. Tone: scientific, skeptical, no hype. Never recommend live
trading. Always end with "Next questions to investigate".`;

export async function writeDailyJournal({ date, runs, critiqueText }) {
  const user = `Date: ${date}
Backtest runs today:
${JSON.stringify(runs, null, 2)}

Critic's notes:
${critiqueText}

Write the journal entry as markdown.`;
  const md = await ask({
    system: SYSTEM,
    user,
    tier: "fast",
    agent: "journalist",
    fallback: FALLBACK,
  });
  await mkdir(DAILY_DIR, { recursive: true });
  const file = path.join(DAILY_DIR, `${date}.md`);
  await writeFile(file, md);
  return file;
}
