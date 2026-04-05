#!/usr/bin/env node
// Nightly research loop. Intended to be invoked by cron / launchd / GitHub
// Actions. Runs a deterministic sequence across the watchlist and writes a
// dated log file. Each step is isolated so one failure does not abort the
// rest of the loop.
//
// Example crontab (weeknights 10pm local):
//   0 22 * * 1-5  cd /path/to/repo && node research/paper-trading/scripts/cron.mjs
//
// Example launchd (macOS): see scripts/launchagent.plist.template
//
// This script is research-only. It does NOT place orders. It only invokes
// local CLI subcommands that read public market data and write to the
// journal/ directory.

import { spawn } from "node:child_process";
import { mkdir, appendFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "..");
const CLI = path.resolve(ROOT, "src/cli.mjs");
const LOG_DIR = path.resolve(ROOT, "journal");

const WATCHLIST = (process.env.WATCHLIST || "SPY,QQQ,IWM")
  .split(",")
  .map((s) => s.trim())
  .filter(Boolean);

const today = new Date().toISOString().slice(0, 10);
const LOG_FILE = path.join(LOG_DIR, `cron-${today}.log`);

async function logLine(line) {
  const ts = new Date().toISOString();
  const out = `[${ts}] ${line}\n`;
  process.stdout.write(out);
  try {
    await appendFile(LOG_FILE, out);
  } catch {
    // best-effort; don't let logging break the loop
  }
}

// Run a CLI subcommand, streaming stdout/stderr into the dated log file and
// the console. Returns { ok, code } instead of throwing so the caller can
// continue to the next step on failure.
function runStep(name, args) {
  return new Promise((resolve) => {
    const started = Date.now();
    logLine(`START ${name} :: node ${CLI} ${args.join(" ")}`);
    const p = spawn("node", [CLI, ...args], { cwd: ROOT, stdio: ["ignore", "pipe", "pipe"] });
    const chunks = [];
    p.stdout.on("data", (b) => {
      chunks.push(b);
      process.stdout.write(b);
    });
    p.stderr.on("data", (b) => {
      chunks.push(b);
      process.stderr.write(b);
    });
    p.on("exit", async (code) => {
      const ms = Date.now() - started;
      try {
        await appendFile(LOG_FILE, Buffer.concat(chunks));
      } catch {
        // ignore
      }
      await logLine(`END   ${name} code=${code} elapsed=${ms}ms`);
      resolve({ ok: code === 0, code });
    });
  });
}

async function main() {
  await mkdir(LOG_DIR, { recursive: true });
  await logLine(`==== nightly research loop ${today} watchlist=${WATCHLIST.join(",")} ====`);

  const summary = [];
  const record = async (name, res) => {
    summary.push({ step: name, ok: res.ok, code: res.code });
  };

  // 1. Per-symbol research iteration.
  for (const sym of WATCHLIST) {
    await record(
      `research:${sym}`,
      await runStep(`research:${sym}`, ["research", "--symbol", sym, "--iterations", "1"]),
    );
  }

  // 2. Per-symbol rolling metrics (read-only snapshot).
  for (const sym of WATCHLIST) {
    await record(
      `rolling:${sym}`,
      await runStep(`rolling:${sym}`, ["rolling", "--symbol", sym, "--window", "63"]),
    );
  }

  // 3. Shadow blotter evaluation (marks open shadow trades against latest bars).
  await record("shadow-evaluate", await runStep("shadow-evaluate", ["shadow-evaluate"]));

  // 4. Plan adherence stats for the most recent window.
  await record("adherence", await runStep("adherence", ["adherence"]));

  // 5. Daily digest — written last so it can pick up the other outputs.
  await record(
    "digest",
    await runStep("digest", ["digest", "--symbols", WATCHLIST.join(",")]),
  );

  // Final summary line, machine-parseable.
  const failed = summary.filter((s) => !s.ok);
  await logLine(
    `==== done ${today} steps=${summary.length} failed=${failed.length}${
      failed.length ? " :: " + failed.map((s) => s.step).join(",") : ""
    } ====`,
  );

  // Non-zero exit only if every step failed. Individual step failures are
  // expected occasionally (network hiccups) and should not block the schedule.
  if (summary.length > 0 && failed.length === summary.length) {
    process.exit(1);
  }
}

main().catch(async (e) => {
  await logLine(`FATAL ${e?.message ?? e}`);
  process.exit(1);
});
