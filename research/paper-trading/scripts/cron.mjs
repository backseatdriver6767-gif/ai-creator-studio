#!/usr/bin/env node
// Nightly research loop. Intended to be invoked by cron / GitHub Actions /
// Claude Code's /schedule skill. It runs a research iteration across a
// watchlist and writes a daily journal entry.
//
// Example crontab:
//   0 22 * * 1-5  cd /path/to/repo && node research/paper-trading/scripts/cron.mjs
//
// This is research-only. It does NOT place orders.

import { spawn } from "node:child_process";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const CLI = path.resolve(__dirname, "../src/cli.mjs");

const WATCHLIST = (process.env.WATCHLIST || "SPY,QQQ,IWM").split(",");

function run(cmd, args) {
  return new Promise((resolve, reject) => {
    const p = spawn(cmd, args, { stdio: "inherit" });
    p.on("exit", (code) => (code === 0 ? resolve() : reject(new Error(`exit ${code}`))));
  });
}

async function main() {
  for (const sym of WATCHLIST) {
    console.log(`\n##### ${sym} #####`);
    try {
      await run("node", [CLI, "research", "--symbol", sym.trim(), "--iterations", "1"]);
    } catch (e) {
      console.error(`  ${sym} failed:`, e.message);
    }
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
