#!/usr/bin/env node
// Paper-trading research harness CLI.
//
// ── Core research ──────────────────────────────────────────────
//   backtest   --symbol SPY --from 2020-01-01 --to 2024-12-31
//   research   --symbol SPY --iterations 3
//   walkforward --symbol SPY --strategy smaCrossover
//   montecarlo --symbol SPY --strategy smaCrossover
//   regimes    --symbol SPY
//
// ── Risk & sizing ──────────────────────────────────────────────
//   size       --equity 50000 --risk 0.01 --entry 100 --stop 98
//   kelly      --p 0.55 --avg-win 100 --avg-loss 80
//   heat       (reads stdin JSON)
//
// ── Screeners ──────────────────────────────────────────────────
//   gap        --symbols SPY,QQQ,IWM
//   relvol     --symbols SPY,QQQ,IWM
//   breakout   --symbols SPY,QQQ,IWM
//
// ── Intelligence ───────────────────────────────────────────────
//   news       --symbol AAPL
//   filings    --symbol AAPL
//   calendar   --from 2024-01-01 --to 2024-12-31
//   digest     --symbols SPY,QQQ,IWM
//
// ── Agents ─────────────────────────────────────────────────────
//   red-team   --strategy "SMA(10/30)" --metrics <json>
//   coach      (reads manual trade log)
//   scout      --topic "momentum on small caps"
//
// ── Personal trading log ───────────────────────────────────────
//   log        --symbol AAPL --side BUY --qty 100 --price 212.50 ...
//   edge       [--last 50]
//
// ── Misc ───────────────────────────────────────────────────────
//   curriculum | runs
//
// PAPER TRADING ONLY. No live order routing anywhere in this CLI.

import { fetchDailyBars, splitBars } from "./data/yahoo.mjs";
import { runBacktest } from "./engine/backtest.mjs";
import { walkForward } from "./engine/walkForward.mjs";
import { bootstrapTradeSeries } from "./engine/monteCarlo.mjs";
import { labelRegimes, regimeBreakdown } from "./engine/regimes.mjs";
import { buyAndHold } from "./strategies/buyAndHold.mjs";
import { smaCrossover } from "./strategies/smaCrossover.mjs";
import { rsiMeanReversion } from "./strategies/rsiMeanReversion.mjs";
import { openingRangeBreakout } from "./strategies/openingRangeBreakout.mjs";
import { logFills, logRun, readRuns } from "./journal/journal.mjs";
import { proposeExperiments } from "./agents/researcher.mjs";
import { critique } from "./agents/critic.mjs";
import { writeDailyJournal } from "./agents/journalist.mjs";
import { redTeam } from "./agents/redTeam.mjs";
import { coachReport } from "./agents/coach.mjs";
import { scoutBrief } from "./agents/scout.mjs";
import { fixedRiskSize } from "./risk/fixedRisk.mjs";
import { kelly } from "./risk/kelly.mjs";
import { portfolioHeat } from "./risk/portfolioHeat.mjs";
import { gapScanner } from "./screeners/gap.mjs";
import { relVolScanner } from "./screeners/relVol.mjs";
import { breakout52wScanner } from "./screeners/breakout52w.mjs";
import { fetchYahooHeadlines, dedupeHeadlines } from "./intel/news.mjs";
import { fetchRecentFilings, tickerToCik } from "./intel/edgar.mjs";
import { eventsInRange, nextEvent } from "./intel/econCalendar.mjs";
import { buildDailyDigest } from "./report/dailyDigest.mjs";
import { asciiChart } from "./report/asciiChart.mjs";
import { logManualTrade, roundTripTrades } from "./journal/manualLog.mjs";
import { edgeReport } from "./journal/edgeReport.mjs";
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
    } else out._.push(a);
  }
  return out;
}

// ---------- Core research ----------

async function cmdBacktest(args) {
  const symbol = args.symbol || "SPY";
  const from = args.from || "2020-01-01";
  const to = args.to || new Date().toISOString().slice(0, 10);
  console.log(`Fetching ${symbol} ${from} → ${to}...`);
  const bars = await fetchDailyBars(symbol, from, to);
  console.log(`  ${bars.length} bars loaded.`);
  const { train, test } = splitBars(bars, 0.7);

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
  console.log("\nEquity curve (benchmark):");
  console.log(asciiChart(runBacktest(bars, buyAndHold()).equityCurve, { label: `${symbol} BuyAndHold` }));
  await logRun({ runId, kind: "backtest", symbol, from, to, results });
  return { runId, results };
}

function printResultsTable(results) {
  console.log("\n=== IN-SAMPLE (train) ===");
  console.table(results.map((r) => ({ strategy: r.strategy, cagr: r.train.cagrPct, sharpe: r.train.sharpe, maxDD: r.train.maxDrawdownPct, trades: r.train.trades, winRate: r.train.winRatePct })));
  console.log("=== OUT-OF-SAMPLE (test) ===");
  console.table(results.map((r) => ({ strategy: r.strategy, cagr: r.test.cagrPct, sharpe: r.test.sharpe, maxDD: r.test.maxDrawdownPct, trades: r.test.trades, winRate: r.test.winRatePct })));
  console.log("\nReminder: strategies that beat buy-and-hold in-sample but not out-of-sample are overfit.");
}

async function cmdResearch(args) {
  const iterations = Number(args.iterations || 1);
  const base = await cmdBacktest(args);
  let prior = base.results;
  for (let i = 0; i < iterations; i++) {
    console.log(`\n--- Research iteration ${i + 1}/${iterations} ---`);
    const { experiments } = await proposeExperiments({ prior, budget: 4 });
    if (!experiments.length) { console.log("Researcher returned no experiments."); break; }
    const symbol = args.symbol || "SPY";
    const bars = await fetchDailyBars(symbol, args.from || "2020-01-01", args.to || new Date().toISOString().slice(0, 10));
    const { train, test } = splitBars(bars, 0.7);
    const newResults = [];
    for (const exp of experiments) {
      const factory = STRATEGY_FACTORIES[exp.strategy];
      if (!factory) continue;
      const strat = factory(exp.params || {});
      const trainRes = runBacktest(train, strat);
      const testRes = runBacktest(test, strat);
      newResults.push({ strategy: strat.name, params: exp.params, rationale: exp.rationale, train: trainRes.metrics, test: testRes.metrics });
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

async function cmdWalkForward(args) {
  const symbol = args.symbol || "SPY";
  const from = args.from || "2015-01-01";
  const to = args.to || new Date().toISOString().slice(0, 10);
  const bars = await fetchDailyBars(symbol, from, to);
  const stratName = args.strategy || "smaCrossover";
  const factory = STRATEGY_FACTORIES[stratName];
  if (!factory) throw new Error(`Unknown strategy: ${stratName}`);
  const grid =
    stratName === "smaCrossover"
      ? gridSma()
      : stratName === "rsiMeanReversion"
        ? gridRsi()
        : gridDonchian();
  const res = walkForward(bars, factory, grid, { folds: 5 });
  console.log(JSON.stringify(res, null, 2));
}
function gridSma() {
  const g = [];
  for (const f of [5, 10, 20, 30]) for (const s of [20, 50, 100, 200]) if (f < s) g.push({ fast: f, slow: s });
  return g;
}
function gridRsi() {
  const g = [];
  for (const p of [7, 14, 21]) for (const b of [20, 25, 30]) for (const a of [55, 60, 70]) g.push({ period: p, buyBelow: b, sellAbove: a });
  return g;
}
function gridDonchian() {
  const g = [];
  for (const l of [10, 20, 40]) for (const e of [5, 10, 20]) if (e < l) g.push({ lookback: l, exitLookback: e });
  return g;
}

async function cmdMonteCarlo(args) {
  const symbol = args.symbol || "SPY";
  const bars = await fetchDailyBars(symbol, args.from || "2015-01-01", args.to || new Date().toISOString().slice(0, 10));
  const factory = STRATEGY_FACTORIES[args.strategy || "smaCrossover"];
  const strat = factory({});
  const res = runBacktest(bars, strat);
  // Compute per-round-trip return series
  const rets = [];
  let open = null;
  for (const f of res.fills) {
    if (f.side === "BUY") open = f;
    else if (f.side === "SELL" && open) {
      rets.push((f.price - open.price) / open.price);
      open = null;
    }
  }
  if (!rets.length) { console.log("No round-trip trades to bootstrap."); return; }
  const mc = bootstrapTradeSeries(rets, { iters: 2000 });
  console.log(JSON.stringify({ strategy: strat.name, trades: rets.length, mc }, null, 2));
}

async function cmdRegimes(args) {
  const symbol = args.symbol || "SPY";
  const bars = await fetchDailyBars(symbol, args.from || "2015-01-01", args.to || new Date().toISOString().slice(0, 10));
  const strat = smaCrossover({ fast: 20, slow: 50 });
  const res = runBacktest(bars, strat);
  const labels = labelRegimes(bars);
  const bd = regimeBreakdown(res.equityCurve, labels);
  console.log(`Regime breakdown for ${strat.name} on ${symbol}:`);
  console.log(JSON.stringify(bd, null, 2));
}

// ---------- Risk ----------

function cmdSize(args) {
  const r = fixedRiskSize({
    equity: Number(args.equity),
    riskPct: Number(args.risk || 0.01),
    entry: Number(args.entry),
    stop: Number(args.stop),
  });
  console.log(JSON.stringify(r, null, 2));
}
function cmdKelly(args) {
  const r = kelly({ p: Number(args.p), avgWin: Number(args["avg-win"]), avgLoss: Number(args["avg-loss"]) });
  console.log(JSON.stringify(r, null, 2));
}
async function cmdHeat() {
  const raw = await readStdin();
  const input = JSON.parse(raw);
  console.log(JSON.stringify(portfolioHeat(input), null, 2));
}

// ---------- Screeners ----------

async function loadBarsFor(symbols, days = 300) {
  const to = new Date().toISOString().slice(0, 10);
  const from = new Date(Date.now() - days * 86400_000).toISOString().slice(0, 10);
  const out = {};
  for (const s of symbols) {
    try { out[s] = await fetchDailyBars(s, from, to); }
    catch (e) { console.error(`  ${s}: ${e.message}`); }
  }
  return out;
}
async function cmdGap(args) {
  const syms = (args.symbols || "SPY,QQQ,IWM").split(",");
  console.table(gapScanner(await loadBarsFor(syms, 10)));
}
async function cmdRelVol(args) {
  const syms = (args.symbols || "SPY,QQQ,IWM").split(",");
  console.table(relVolScanner(await loadBarsFor(syms, 60)));
}
async function cmdBreakout(args) {
  const syms = (args.symbols || "SPY,QQQ,IWM").split(",");
  console.table(breakout52wScanner(await loadBarsFor(syms, 300)));
}

// ---------- Intel ----------

async function cmdNews(args) {
  const symbol = args.symbol || "SPY";
  const items = dedupeHeadlines(await fetchYahooHeadlines(symbol, { limit: 15 }));
  for (const it of items) console.log(`[${it.sentiment.padEnd(8)}] ${it.title}\n  ${it.link}`);
}
async function cmdFilings(args) {
  const symbol = args.symbol || "AAPL";
  const cik = await tickerToCik(symbol);
  if (!cik) { console.log("CIK not found."); return; }
  const filings = await fetchRecentFilings(cik);
  console.table(filings.slice(0, 15));
}
function cmdCalendar(args) {
  const from = args.from || new Date().toISOString().slice(0, 10);
  const to = args.to || "2026-12-31";
  console.table(eventsInRange(from, to));
  const n = nextEvent(from);
  if (n) console.log(`Next: ${n.kind} on ${n.date}`);
}
async function cmdDigest(args) {
  const syms = (args.symbols || "SPY,QQQ,IWM").split(",");
  const file = await buildDailyDigest({ watchlist: syms });
  console.log("Digest written: " + file);
}

// ---------- Agents ----------

async function cmdRedTeam(args) {
  const metrics = args.metrics ? JSON.parse(args.metrics) : { sharpe: 2.1, trades: 42, maxDrawdownPct: -8 };
  const out = await redTeam({ strategyName: args.strategy || "SMA(10/30)", params: args.params ? JSON.parse(args.params) : {}, metrics });
  console.log(out);
}
async function cmdCoach() {
  const trips = await roundTripTrades();
  if (!trips.length) { console.log("No manual trades logged yet. Use `log` first."); return; }
  console.log(await coachReport(trips));
}
async function cmdScout(args) {
  const topic = args.topic || "momentum anomalies";
  console.log(await scoutBrief({ topic, sources: args.sources ? JSON.parse(args.sources) : [] }));
}

// ---------- Manual trade log ----------

async function cmdLog(args) {
  const entry = await logManualTrade({
    tradeId: args["trade-id"] || undefined,
    symbol: args.symbol,
    side: args.side,
    qty: Number(args.qty),
    price: Number(args.price),
    stop: args.stop ? Number(args.stop) : null,
    target: args.target ? Number(args.target) : null,
    setup: args.setup || null,
    reason: args.reason || null,
    emotion: args.emotion || null,
    plannedRisk: args["planned-risk"] ? Number(args["planned-risk"]) : null,
  });
  console.log(JSON.stringify(entry, null, 2));
}
async function cmdEdge(args) {
  const report = await edgeReport({ lastN: args.last ? Number(args.last) : null });
  console.log(JSON.stringify(report, null, 2));
}

// ---------- Misc ----------

async function cmdCurriculum() {
  const p = path.resolve(__dirname, "../curriculum/curriculum.md");
  process.stdout.write(await readFile(p, "utf8"));
}
async function cmdRuns() {
  const runs = await readRuns(20);
  for (const r of runs) console.log(`${r.ts}  ${r.kind}  ${r.symbol || ""}  runId=${r.runId}`);
}

async function readStdin() {
  let data = "";
  process.stdin.setEncoding("utf8");
  for await (const chunk of process.stdin) data += chunk;
  return data;
}

const USAGE = `Paper-trading research harness (paper trading only, no live orders).

Commands:
  backtest | research | walkforward | montecarlo | regimes
  size | kelly | heat
  gap | relvol | breakout
  news | filings | calendar | digest
  red-team | coach | scout
  log | edge
  curriculum | runs

Run with --help on any subcommand name for usage stubs; see src/cli.mjs source for the full list.`;

async function main() {
  const [cmd, ...rest] = process.argv.slice(2);
  const args = parseArgs(rest);
  const table = {
    backtest: cmdBacktest, research: cmdResearch, walkforward: cmdWalkForward,
    montecarlo: cmdMonteCarlo, regimes: cmdRegimes,
    size: cmdSize, kelly: cmdKelly, heat: cmdHeat,
    gap: cmdGap, relvol: cmdRelVol, breakout: cmdBreakout,
    news: cmdNews, filings: cmdFilings, calendar: cmdCalendar, digest: cmdDigest,
    "red-team": cmdRedTeam, coach: cmdCoach, scout: cmdScout,
    log: cmdLog, edge: cmdEdge,
    curriculum: cmdCurriculum, runs: cmdRuns,
  };
  const fn = table[cmd];
  if (!fn) { console.log(USAGE); return; }
  await fn(args);
}

main().catch((e) => { console.error(e); process.exit(1); });
