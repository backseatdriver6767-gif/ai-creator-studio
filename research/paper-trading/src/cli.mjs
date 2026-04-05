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
import { fetchBars as fetchBarsMulti } from "./data/multiSource.mjs";
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
import { openShadow, evaluateBook, shadowReport, readBook } from "./shadow/shadowBook.mjs";
import { shadowBlotter } from "./shadow/blotter.mjs";
import { cointegrationTest } from "./engine/cointegration.mjs";
import { hurstExponent, classifyHurst } from "./engine/hurst.mjs";
import { riskReport } from "./risk/varCvar.mjs";
import { rollingSharpe, underwaterCurve, monthlyReturnGrid, renderMonthlyGrid } from "./report/rollingMetrics.mjs";
import { evaluateKillSwitch } from "./decision/killSwitch.mjs";
import { loadAllFills, filterFills, roundTrips, edgeSummary } from "./journal/query.mjs";
import { initAccount, currentEquity, syncFromSources, equityHistory, isInitialized } from "./journal/account.mjs";
import { runWatchlistBuild, readLatestWatchlist } from "./screeners/watchlistRunner.mjs";
import { runAutoPromote, readLatestPromotion } from "./decision/autoPromoter.mjs";
import { logPlan, markPlan, adherenceStats, readAllPlans } from "./decision/tradePlan.mjs";
import { preTradeChecklist } from "./decision/preTradeChecklist.mjs";
import { notify } from "./notify/index.mjs";
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

// ---------- Shadow trading (forward paper) ----------

async function cmdShadowOpen(args) {
  const rec = await openShadow({
    symbol: args.symbol,
    side: args.side,
    qty: Number(args.qty),
    stop: Number(args.stop),
    target: Number(args.target),
    setup: args.setup || null,
    reason: args.reason || "",
    entry: args.entry ? Number(args.entry) : null,
  });
  console.log(JSON.stringify(rec, null, 2));
}
async function cmdShadowEvaluate() {
  const r = await evaluateBook();
  console.log(JSON.stringify(r, null, 2));
}
async function cmdShadowReport() {
  console.log(JSON.stringify(await shadowReport(), null, 2));
}
async function cmdShadowList() {
  const items = await readBook();
  console.table(items.map((x) => ({
    id: x.shadowId.slice(0, 8),
    symbol: x.symbol, side: x.side, qty: x.qty,
    entry: x.entry, stop: x.stop, target: x.target,
    status: x.status, pnl: x.pnl ?? "",
  })));
}

// ---------- Plan / pre-trade checklist ----------

async function cmdPlan(args) {
  const plan = {
    symbol: args.symbol,
    side: args.side,
    qty: Number(args.qty),
    entry: Number(args.entry),
    stop: Number(args.stop),
    target: Number(args.target),
    setup: args.setup,
    reason: args.reason || "",
  };
  const rec = await logPlan(plan);
  console.log(JSON.stringify(rec, null, 2));
}
async function cmdPlanMark(args) {
  const rec = await markPlan(args.id, {
    followed: args.followed !== "false",
    notes: args.notes || "",
  });
  console.log(JSON.stringify(rec, null, 2));
}
async function cmdAdherence() {
  console.log(JSON.stringify(await adherenceStats(), null, 2));
}
async function cmdCheck(args) {
  const plan = {
    symbol: args.symbol, side: args.side, qty: Number(args.qty),
    entry: Number(args.entry), stop: Number(args.stop), target: Number(args.target),
    setup: args.setup,
  };
  const recentEdge = await edgeReport({});
  const ctx = {
    plan,
    equity: Number(args.equity || 100000),
    openPositions: args.open ? JSON.parse(args.open) : [],
    todayPlans: Number(args["today-plans"] || 0),
    recentEdge,
  };
  console.log(JSON.stringify(preTradeChecklist(ctx), null, 2));
}

async function cmdNotify(args) {
  const ch = (args.channels || "stdout").split(",");
  const results = await notify({ title: args.title || "Test", body: args.body || "hello", channels: ch });
  console.log(JSON.stringify(results, null, 2));
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

// ---------- New analytics commands ----------
//
// These commands intentionally go through multiSource.fetchBars rather
// than fetchDailyBars so they benefit from the Yahoo-v8 failover that
// the older commands don't have yet. Shape returned is { bars, source }.

async function loadBarsMulti(symbol, from, to) {
  const { bars } = await fetchBarsMulti(symbol, from, to);
  return bars;
}

async function cmdCointegration(args) {
  const symA = args["symbol-a"] || "EWA";
  const symB = args["symbol-b"] || "EWC";
  const from = args.from || "2015-01-01";
  const to = args.to || new Date().toISOString().slice(0, 10);
  const a = await loadBarsMulti(symA, from, to);
  const b = await loadBarsMulti(symB, from, to);
  const n = Math.min(a.length, b.length);
  // Align on intersection of dates so we don't compare different days.
  const bMap = new Map(b.map((x) => [x.date, x.close]));
  const aC = [], bC = [];
  for (const row of a.slice(-n)) {
    if (bMap.has(row.date)) { aC.push(row.close); bC.push(bMap.get(row.date)); }
  }
  const r = cointegrationTest(aC, bC);
  console.log(JSON.stringify({ symA, symB, aligned: aC.length, ...r }, null, 2));
}

async function cmdHurst(args) {
  const symbol = args.symbol || "SPY";
  const bars = await loadBarsMulti(symbol, args.from || "2015-01-01", args.to || new Date().toISOString().slice(0, 10));
  const h = hurstExponent(bars.map((b) => b.close));
  console.log(JSON.stringify({ symbol, n: bars.length, hurst: h, regime: classifyHurst(h) }, null, 2));
}

async function cmdVarReport(args) {
  const symbol = args.symbol || "SPY";
  const bars = await loadBarsMulti(symbol, args.from || "2015-01-01", args.to || new Date().toISOString().slice(0, 10));
  const rets = [];
  for (let i = 1; i < bars.length; i++) {
    rets.push((bars[i].close - bars[i - 1].close) / bars[i - 1].close);
  }
  const confidence = Number(args.confidence || 0.95);
  const horizonDays = Number(args.horizon || 1);
  const r = riskReport(rets, { confidence, horizonDays });
  console.log(JSON.stringify({ symbol, ...r }, null, 2));
}

async function cmdRolling(args) {
  const symbol = args.symbol || "SPY";
  const bars = await loadBarsMulti(symbol, args.from || "2015-01-01", args.to || new Date().toISOString().slice(0, 10));
  const strat = buyAndHold();
  const res = runBacktest(bars, strat);
  const sharpe = rollingSharpe(res.equityCurve, { window: Number(args.window || 63) });
  const uw = underwaterCurve(res.equityCurve);
  const tail = 10;
  console.log(`Rolling ${args.window || 63}-day Sharpe (last ${tail}):`);
  console.table(sharpe.slice(-tail));
  console.log(`\nUnderwater curve (last ${tail}):`);
  console.table(uw.slice(-tail));
}

async function cmdMonthlyGrid(args) {
  const symbol = args.symbol || "SPY";
  const bars = await loadBarsMulti(symbol, args.from || "2015-01-01", args.to || new Date().toISOString().slice(0, 10));
  const res = runBacktest(bars, buyAndHold());
  const grid = monthlyReturnGrid(res.equityCurve);
  console.log(renderMonthlyGrid(grid, `${symbol} monthly returns %`));
}

// ---------- Account ledger ----------

async function cmdAccountInit(args) {
  const balance = Number(args.balance || args["starting-balance"] || 10000);
  const force = args.force === "true" || args.force === true;
  if (await isInitialized() && !force) {
    console.log("Account already initialized. Use --force to reset.");
    console.log(JSON.stringify(await currentEquity(), null, 2));
    return;
  }
  const ev = await initAccount({ startingBalance: balance, force });
  console.log(`Account initialized at ${ev.startingBalance} ${ev.currency}`);
}

async function cmdAccountStatus() {
  const state = await currentEquity();
  if (!state.initialized) {
    console.log("Account not initialized. Run: node src/cli.mjs account-init --balance 10000");
    return;
  }
  const sign = state.realizedPnl >= 0 ? "+" : "";
  console.log(`Starting balance : $${state.startingBalance.toFixed(2)} ${state.currency}`);
  console.log(`Current equity   : $${state.equity.toFixed(2)}`);
  console.log(`Realized P&L     : ${sign}$${state.realizedPnl.toFixed(2)} (${sign}${state.returnPct.toFixed(2)}%)`);
  console.log(`Closed trades    : ${state.closedTrades}`);
  console.log(`Open positions   : ${state.openTrades}`);
}

async function cmdAccountSync() {
  if (!(await isInitialized())) {
    console.log("Account not initialized. Run account-init first.");
    return;
  }
  const r = await syncFromSources();
  console.log(`Synced: added=${r.added} skipped=${r.skipped}`);
  await cmdAccountStatus();
}

async function cmdAccountHistory(args) {
  const limit = Number(args.limit || 20);
  const series = await equityHistory();
  if (!series.length) {
    console.log("No account history. Run account-init first.");
    return;
  }
  const tail = series.slice(-limit);
  console.table(
    tail.map((p) => ({
      when: String(p.t).slice(0, 19),
      equity: p.equity,
      delta: p.delta,
      key: p.key,
    })),
  );
}

async function cmdWatchlistBuild(args) {
  const topN = Number(args.top || args.topN || 5);
  const lookback = Number(args.lookback || 400);
  console.log(`Building watchlist (top=${topN}, lookback=${lookback}d)…`);
  const entry = await runWatchlistBuild({ topN, lookbackDays: lookback });
  console.log(
    `Fetched ${entry.fetched}/${entry.universeSize} symbols` +
      (entry.fetchErrors ? ` (${entry.fetchErrors} failed)` : "") +
      `. ${entry.eligible} eligible, ${entry.survivors} survived liquidity floor.`,
  );
  if (!entry.topN.length) {
    console.log("No survivors. Try lowering liquidity floor or expanding universe.");
    return;
  }
  console.table(
    entry.topN.map((r) => ({
      symbol: r.symbol,
      score: r.score,
      lastClose: r.lastClose,
      lastDate: r.lastDate,
      avgDollarVol20d: r.avgDollarVol20d,
      reasons: r.reasons.join(" | ") || "(baseline)",
    })),
  );
  console.log(`\nAppended to journal/watchlist.jsonl (${entry.date}).`);
}

async function cmdWatchlistLatest() {
  const entry = await readLatestWatchlist();
  if (!entry) {
    console.log("No watchlist runs yet. Run: node src/cli.mjs watchlist-build");
    return;
  }
  console.log(
    `Latest watchlist: ${entry.date} (${entry.fetched}/${entry.universeSize} fetched, ${entry.survivors} survivors)`,
  );
  console.table(
    entry.topN.map((r) => ({
      symbol: r.symbol,
      score: r.score,
      lastClose: r.lastClose,
      lastDate: r.lastDate,
      reasons: Array.isArray(r.reasons) ? r.reasons.join(" | ") : "",
    })),
  );
}

async function cmdAutoPromote(args) {
  // Default to dry-run unless caller explicitly passes --live.
  const dryRun = args.live ? false : true;
  const maxPerDay = args["max-per-day"] ? Number(args["max-per-day"]) : undefined;
  const riskPct = args.risk ? Number(args.risk) : undefined;
  const lookback = args.lookback ? Number(args.lookback) : undefined;
  console.log(
    `Auto-promoter${dryRun ? " (DRY RUN — no shadow trades will be opened)" : " (LIVE — shadow trades will be recorded)"}…`,
  );
  const report = await runAutoPromote({
    dryRun,
    ...(maxPerDay !== undefined ? { maxPerDay } : {}),
    ...(riskPct !== undefined ? { riskPct } : {}),
    ...(lookback !== undefined ? { lookbackDays: lookback } : {}),
  });
  if (report.errors.length) {
    for (const err of report.errors) console.log(`  ! ${err}`);
  }
  console.log(
    `\nConsidered ${report.symbolsConsidered} symbols from watchlist ${report.watchlistDate ?? "(none)"} · equity=$${report.equity ?? "?"}`,
  );
  if (report.promoted.length) {
    console.log("\nPROMOTED:");
    console.table(
      report.promoted.map((p) => ({
        symbol: p.symbol,
        setup: p.setup,
        strategy: p.strategy,
        entry: p.plan.entry,
        stop: p.plan.stop,
        target: p.plan.target,
        qty: p.plan.qty,
        rr: round2((p.plan.target - p.plan.entry) / (p.plan.entry - p.plan.stop)),
        shadowId: p.shadowId ?? "(dry-run)",
      })),
    );
  } else {
    console.log("\nPROMOTED: (none)");
  }
  if (report.rejected.length) {
    console.log("\nREJECTED:");
    console.table(
      report.rejected.map((r) => ({
        symbol: r.symbol,
        setup: r.setup ?? "-",
        stage: r.stage ?? "-",
        reason: truncate(r.reason, 80),
      })),
    );
  }
  if (report.skipped.length) {
    console.log("\nSKIPPED:");
    console.table(
      report.skipped.map((s) => ({
        symbol: s.symbol,
        setup: s.setup ?? "-",
        reason: truncate(s.reason, 80),
      })),
    );
  }
  if (dryRun) {
    console.log("\nDry run — nothing written to journal/shadow-book.jsonl or journal/promotions.jsonl.");
    console.log("Re-run with --live to record the promoted trades.");
  } else {
    console.log("\nAppended to journal/promotions.jsonl and journal/shadow-book.jsonl.");
  }
}

async function cmdAutoPromoteLatest() {
  const report = await readLatestPromotion();
  if (!report) {
    console.log("No auto-promote runs yet. Run: node src/cli.mjs auto-promote --live");
    return;
  }
  console.log(
    `Latest promotion report: ${report.date} (${report.promoted.length} promoted, ${report.rejected.length} rejected, ${report.skipped.length} skipped)`,
  );
  if (report.promoted.length) {
    console.table(
      report.promoted.map((p) => ({
        symbol: p.symbol,
        setup: p.setup,
        entry: p.plan.entry,
        stop: p.plan.stop,
        target: p.plan.target,
        qty: p.plan.qty,
        shadowId: p.shadowId ?? "(dry-run)",
      })),
    );
  }
}

function round2(x) {
  if (!Number.isFinite(x)) return null;
  return Math.round(x * 100) / 100;
}

function truncate(s, n) {
  if (!s) return "";
  return s.length > n ? s.slice(0, n - 1) + "…" : s;
}

function cmdKillSwitch(args) {
  const snap = {
    sessionStartEquity: Number(args["session-start"]),
    currentEquity: Number(args.equity),
    peakEquity: Number(args.peak || args.equity),
    consecutiveLosses: Number(args["cons-losses"] || 0),
    tradesToday: Number(args["trades-today"] || 0),
    openHeatPct: Number(args["heat"] || 0),
    cooldownUntilISO: args["cooldown-until"] || null,
    todayISO: args.today || new Date().toISOString().slice(0, 10),
  };
  const r = evaluateKillSwitch(snap);
  console.log(JSON.stringify(r, null, 2));
  if (!r.ok) process.exitCode = 2;
}

async function cmdBlotter() {
  const r = await shadowBlotter();
  if (!r.rows?.length) { console.log("No open shadow positions."); return; }
  console.table(r.rows);
  console.log(`\nOpen: ${r.open}  Unrealized P&L: $${r.totalUnrealized}  Risk on book: $${r.totalRiskOnBook}`);
}

async function cmdTrades(args) {
  const fills = await loadAllFills();
  const filtered = filterFills(fills, {
    symbol: args.symbol,
    strategy: args.strategy,
    runId: args["run-id"],
    side: args.side,
    from: args.from,
    to: args.to,
    limit: args.limit ? Number(args.limit) : undefined,
  });
  if (args.mode === "fills") {
    console.table(filtered.map((f) => ({
      date: f.date ?? f.ts?.slice(0, 10),
      symbol: f.symbol, strategy: f.strategy, side: f.side,
      qty: f.qty, price: f.price,
    })));
    console.log(`${filtered.length} fills.`);
    return;
  }
  const trips = roundTrips(filtered);
  if (args.mode === "trips") {
    console.table(trips);
    console.log(`${trips.length} round-trip trades.`);
    return;
  }
  // Default: edge summary, grouped by whatever the caller asked for.
  const groupBy = args["group-by"] || "strategy";
  const summary = edgeSummary(trips, groupBy);
  console.log(`Edge summary (grouped by ${groupBy}):`);
  console.table(summary);
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
  shadow-open | shadow-evaluate | shadow-report | shadow-list | blotter
  plan | plan-mark | adherence | check
  notify
  cointegration | hurst | var-report | rolling | monthly-grid | kill-switch
  trades
  account-init | account-status | account-sync | account-history
  watchlist-build | watchlist-latest
  auto-promote | auto-promote-latest
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
    "shadow-open": cmdShadowOpen,
    "shadow-evaluate": cmdShadowEvaluate,
    "shadow-report": cmdShadowReport,
    "shadow-list": cmdShadowList,
    blotter: cmdBlotter,
    plan: cmdPlan, "plan-mark": cmdPlanMark, adherence: cmdAdherence,
    check: cmdCheck,
    notify: cmdNotify,
    cointegration: cmdCointegration,
    hurst: cmdHurst,
    "var-report": cmdVarReport,
    rolling: cmdRolling,
    "monthly-grid": cmdMonthlyGrid,
    "kill-switch": cmdKillSwitch,
    trades: cmdTrades,
    "account-init": cmdAccountInit,
    "account-status": cmdAccountStatus,
    "account-sync": cmdAccountSync,
    "account-history": cmdAccountHistory,
    "watchlist-build": cmdWatchlistBuild,
    "watchlist-latest": cmdWatchlistLatest,
    "auto-promote": cmdAutoPromote,
    "auto-promote-latest": cmdAutoPromoteLatest,
    curriculum: cmdCurriculum, runs: cmdRuns,
  };
  const fn = table[cmd];
  if (!fn) { console.log(USAGE); return; }
  await fn(args);
}

main().catch((e) => { console.error(e); process.exit(1); });
