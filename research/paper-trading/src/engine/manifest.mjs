// Run manifests. Every backtest should be reproducible from its manifest:
// data hash + git SHA + parameters + engine version. Stored beside the run
// in journal/manifests/<runId>.json.

import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import crypto from "node:crypto";
import { execSync } from "node:child_process";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const MANIFEST_DIR = path.resolve(__dirname, "../../journal/manifests");
const ENGINE_VERSION = "0.3.0";

export function hashBars(bars) {
  const h = crypto.createHash("sha256");
  for (const b of bars) h.update(`${b.date}|${b.open}|${b.high}|${b.low}|${b.close}|${b.volume}\n`);
  return h.digest("hex").slice(0, 16);
}

export function gitSha() {
  try { return execSync("git rev-parse HEAD", { encoding: "utf8" }).trim(); }
  catch { return "unknown"; }
}

export async function writeManifest(runId, info) {
  await mkdir(MANIFEST_DIR, { recursive: true });
  const manifest = {
    runId,
    engineVersion: ENGINE_VERSION,
    gitSha: gitSha(),
    createdAt: new Date().toISOString(),
    ...info,
  };
  await writeFile(path.join(MANIFEST_DIR, `${runId}.json`), JSON.stringify(manifest, null, 2));
  return manifest;
}
