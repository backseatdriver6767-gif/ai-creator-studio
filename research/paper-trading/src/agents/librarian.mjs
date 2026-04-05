// Librarian agent: given a topic and some source text (a chapter or paper
// you've already obtained yourself — this agent does NOT scrape copyrighted
// books), produces structured study notes into curriculum/notes/<slug>.md.
//
// Usage: paste chapter text into a file, run the agent, get back notes.

import { mkdir, writeFile, readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { ask } from "./client.mjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const NOTES_DIR = path.resolve(__dirname, "../../curriculum/notes");

const FALLBACK = `## Key claims
(Stub — set ANTHROPIC_API_KEY to run librarian)
## Formulas / procedures (verbatim where possible)
- Unavailable offline.
## Things to verify empirically
- Unavailable offline.
## Open questions
- Unavailable offline.`;

const SYSTEM = `You are a study-notes generator for quant/trading research.
Given source material, produce markdown notes with these sections:
  ## Key claims
  ## Formulas / procedures (verbatim where possible)
  ## Things to verify empirically
  ## Open questions
Be faithful to the source. If something is not in the source, do not invent it.`;

export async function summarizeSource({ title, sourcePath }) {
  const text = await readFile(sourcePath, "utf8");
  const truncated = text.length > 40_000 ? text.slice(0, 40_000) + "\n[... truncated]" : text;
  const user = `Title: ${title}\n\nSource:\n${truncated}`;
  const md = await ask({
    system: SYSTEM,
    user,
    tier: "balanced",
    agent: "librarian",
    fallback: FALLBACK,
  });
  await mkdir(NOTES_DIR, { recursive: true });
  const slug = title.toLowerCase().replace(/[^a-z0-9]+/g, "-").slice(0, 60);
  const file = path.join(NOTES_DIR, `${slug}.md`);
  await writeFile(file, `# ${title}\n\n${md}\n`);
  return file;
}
