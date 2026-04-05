// Append-only trade journal. Every simulated fill and every backtest summary
// is written as one JSON line so you can grep, diff, and replay later.

import { mkdir, appendFile, readFile } from "node:fs/promises";
import { existsSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const JOURNAL_DIR = path.resolve(__dirname, "../../journal");
const TRADES_FILE = path.join(JOURNAL_DIR, "trades.jsonl");
const RUNS_FILE = path.join(JOURNAL_DIR, "runs.jsonl");

async function ensureDir() {
  await mkdir(JOURNAL_DIR, { recursive: true });
}

export async function logFills(runId, strategy, symbol, fills) {
  await ensureDir();
  const lines = fills
    .map((f) =>
      JSON.stringify({
        ts: new Date().toISOString(),
        runId,
        strategy,
        symbol,
        ...f,
      }),
    )
    .join("\n");
  if (lines) await appendFile(TRADES_FILE, lines + "\n");
}

export async function logRun(entry) {
  await ensureDir();
  await appendFile(
    RUNS_FILE,
    JSON.stringify({ ts: new Date().toISOString(), ...entry }) + "\n",
  );
}

export async function readRuns(limit = 100) {
  if (!existsSync(RUNS_FILE)) return [];
  const raw = await readFile(RUNS_FILE, "utf8");
  return raw
    .trim()
    .split("\n")
    .filter(Boolean)
    .map((l) => JSON.parse(l))
    .slice(-limit);
}
