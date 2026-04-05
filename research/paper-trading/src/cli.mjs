#!/usr/bin/env node
// Paper-trading research harness CLI.
//
// Subcommands:
//   backtest --symbol SPY --from 2020-01-01 --to 2024-12-31
//   research --symbol SPY --iterations 3
//   curriculum
//   runs
//
// This tool NEVER places live orders. It is a simulator and research log.

import { fetchDailyBars, splitBars } from "./data/yahoo.mjs";
import { runBacktest } from "./engine/backtest.mjs";
import { buyAndHold } from "./strategies/buyAndHold.mjs";
import { smaCrossover } from "./strategies/smaCrossover.mjs";
import { rsiMeanReversion } from "./strategies/rsiMeanReversion.mjs";
import { openingRangeBreakout } from "./strategies/openingRangeBreakout.mjs";
import { logFills, logRun, readRuns } from "./journal/journal.mjs";
import { proposeExperiments } from "./agents/researcher.mjs";
import { critique } from "./agents/critic.mjs";
import { writeDailyJournal } from "./agents/journalist.mjs";
import { readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { randomUUID } from "node:crypto";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const STRATEGY_FACTORIES = {
  smaCrossover,
  rsiMeanReversion,
  openingRangeBreakout,
};

function parseArgs(argv) {
  const out = { _: [] };
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a.startsWith("--")) {
      const key = a.slice(2);
      const val = argv[i + 1] && !argv[i + 1].startsWith("--") ? argv[++i] : true;
      out[key] = val;
    } else {
      out._.push(a);
    }
  }
  return out;
}

async function cmdBacktest(args) {
  const symbol = args.symbol || "SPY";
  const from = args.from || "2020-01-01";
  const to = args.to || new Date().toISOString().slice(0, 10);
  console.log(`Fetching ${symbol} ${from} → ${to}...`);
  const bars = await fetchDailyBars(symbol, from, to);
  console.log(`  ${bars.length} bars loaded.`);
  const { train, test } = splitBars(bars, 0.7);
  console.log(`  train=${train.length} test=${test.length}`);

  const strategies = [
    buyAndHold(),
    smaCrossover({ fast: 20, slow: 50 }),
    smaCrossover({ fast: 10, slow: 30 }),
    rsiMeanReversion({ period: 14, buyBelow: 30, sellAbove: 55 }),
    openingRangeBreakout({ lookback: 20, exitLookback: 10 }),
  ];

  const runId = randomUUID();
  const results = [];
  for (const s of strategies) {
    const trainRes = runBacktest(train, s);
    const testRes = runBacktest(test, s);
    results.push({ strategy: s.name, train: trainRes.metrics, test: testRes.metrics });
    await logFills(runId, s.name, symbol, trainRes.fills);
    await logFills(runId, s.name, symbol, testRes.fills);
  }

  printResultsTable(results);

  await logRun({
    runId,
    kind: "backtest",
    symbol,
    from,
    to,
    results,
  });
  console.log(`\nLogged runId=${runId}`);
  return { runId, results };
}

function printResultsTable(results) {
  console.log("\n=== IN-SAMPLE (train) ===");
  console.table(
    results.map((r) => ({
      strategy: r.strategy,
      cagr: r.train.cagrPct,
      sharpe: r.train.sharpe,
      maxDD: r.train.maxDrawdownPct,
      trades: r.train.trades,
      winRate: r.train.winRatePct,
    })),
  );
  console.log("=== OUT-OF-SAMPLE (test) ===");
  console.table(
    results.map((r) => ({
      strategy: r.strategy,
      cagr: r.test.cagrPct,
      sharpe: r.test.sharpe,
      maxDD: r.test.maxDrawdownPct,
      trades: r.test.trades,
      winRate: r.test.winRatePct,
    })),
  );
  console.log(
    "\nReminder: strategies that beat buy-and-hold in-sample but not out-of-sample are overfit.",
  );
}

async function cmdResearch(args) {
  const iterations = Number(args.iterations || 1);
  const base = await cmdBacktest(args);
  let prior = base.results;
  for (let i = 0; i < iterations; i++) {
    console.log(`\n--- Research iteration ${i + 1}/${iterations} ---`);
    const { experiments } = await proposeExperiments({ prior, budget: 4 });
    if (!experiments.length) {
      console.log("Researcher returned no experiments (possibly stub mode).");
      break;
    }
    console.log(`Researcher proposed ${experiments.length} experiment(s).`);

    const symbol = args.symbol || "SPY";
    const from = args.from || "2020-01-01";
    const to = args.to || new Date().toISOString().slice(0, 10);
    const bars = await fetchDailyBars(symbol, from, to);
    const { train, test } = splitBars(bars, 0.7);

    const newResults = [];
    for (const exp of experiments) {
      const factory = STRATEGY_FACTORIES[exp.strategy];
      if (!factory) {
        console.log(`  skip unknown strategy ${exp.strategy}`);
        continue;
      }
      const strat = factory(exp.params || {});
      const trainRes = runBacktest(train, strat);
      const testRes = runBacktest(test, strat);
      newResults.push({
        strategy: strat.name,
        params: exp.params,
        rationale: exp.rationale,
        train: trainRes.metrics,
        test: testRes.metrics,
      });
    }
    printResultsTable(newResults);
    prior = [...prior, ...newResults];
  }

  const benchmark = prior.find((r) => r.strategy === "BuyAndHold");
  const others = prior.filter((r) => r.strategy !== "BuyAndHold");
  const critiqueText = await critique({
    trainResults: others.map((r) => ({ strategy: r.strategy, ...r.train })),
    testResults: others.map((r) => ({ strategy: r.strategy, ...r.test })),
    benchmark,
  });
  console.log("\n=== Critic ===\n" + critiqueText);

  const date = new Date().toISOString().slice(0, 10);
  const file = await writeDailyJournal({ date, runs: prior, critiqueText });
  console.log(`\nJournal written: ${file}`);
}

async function cmdCurriculum() {
  const p = path.resolve(__dirname, "../curriculum/curriculum.md");
  const md = await readFile(p, "utf8");
  process.stdout.write(md);
}

async function cmdRuns() {
  const runs = await readRuns(20);
  for (const r of runs) {
    console.log(`${r.ts}  ${r.kind}  ${r.symbol || ""}  runId=${r.runId}`);
  }
}

async function main() {
  const [cmd, ...rest] = process.argv.slice(2);
  const args = parseArgs(rest);
  switch (cmd) {
    case "backtest":
      await cmdBacktest(args);
      break;
    case "research":
      await cmdResearch(args);
      break;
    case "curriculum":
      await cmdCurriculum();
      break;
    case "runs":
      await cmdRuns();
      break;
    default:
      console.log(
        `Usage:
  node src/cli.mjs backtest [--symbol SPY] [--from 2020-01-01] [--to 2024-12-31]
  node src/cli.mjs research [--symbol SPY] [--iterations 3]
  node src/cli.mjs curriculum
  node src/cli.mjs runs

PAPER TRADING ONLY. No live execution.`,
      );
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
