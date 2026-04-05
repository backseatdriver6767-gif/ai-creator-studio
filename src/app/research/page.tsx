// Read-only research dashboard. Surfaces the paper-trading harness's
// journal and run history inside the existing Next.js app. No trade entry
// from the web — this is an observation panel only.

import { readFile } from "node:fs/promises";
import { existsSync } from "node:fs";
import path from "node:path";

export const dynamic = "force-dynamic";

async function readJsonl<T = unknown>(rel: string): Promise<T[]> {
  const p = path.resolve(process.cwd(), "research/paper-trading/journal", rel);
  if (!existsSync(p)) return [];
  const raw = await readFile(p, "utf8");
  return raw.trim().split("\n").filter(Boolean).map((l) => JSON.parse(l) as T);
}

type Run = {
  ts: string;
  kind: string;
  symbol?: string;
  runId: string;
  results?: Array<{ strategy: string; train: { sharpe: number; cagrPct: number; maxDrawdownPct: number }; test: { sharpe: number; cagrPct: number; maxDrawdownPct: number } }>;
};
type Trip = {
  tradeId: string;
  symbol: string;
  direction: string;
  pnl: number;
  setup?: string;
  emotion?: string;
  entryAt: string;
  exitAt: string;
};

type AccountEvent =
  | { type: "init"; ts: string; startingBalance: number; currency?: string }
  | { type: "trade-closed"; ts: string; key: string; pnl: number; closedAt?: string; symbol?: string };

type AccountSnapshot = {
  initialized: boolean;
  startingBalance: number;
  currency: string;
  realizedPnl: number;
  equity: number;
  returnPct: number;
  closedTrades: number;
  openTrades: number;
};

type ShadowRec = {
  shadowId: string;
  status: "open" | "closed";
  symbol: string;
  side: "BUY" | "SHORT";
  qty: number;
  entry: number;
  entryDate?: string;
  stop?: number;
  target?: number;
  setup?: string;
  exit?: number;
  pnl?: number;
  openedAt?: string;
  closedAt?: string;
};

type WatchlistEntry = {
  ts: string;
  date: string;
  universe?: string;
  universeSize?: number;
  fetched?: number;
  eligible?: number;
  survivors?: number;
  topN: Array<{
    symbol: string;
    score: number;
    reasons: string[];
    lastClose: number;
    lastDate: string;
    avgDollarVol20d: number;
  }>;
};

type LlmUsageRow = {
  ts: string;
  agent: string;
  tier: string;
  model?: string;
  stub?: boolean;
  tokensIn?: number | null;
  tokensOut?: number | null;
  stopReason?: string | null;
  error?: string;
};

type PromotedEntry = {
  symbol: string;
  setup: string;
  strategy?: string;
  plan: {
    symbol: string;
    side: "BUY" | "SHORT";
    qty: number;
    entry: number;
    stop: number;
    target: number;
    setup: string;
    reason?: string;
  };
  sizing?: { shares: number; riskDollars?: number; notional?: number };
  asOf?: string;
  shadowId?: string;
};

type RejectedEntry = {
  symbol: string;
  setup?: string | null;
  strategy?: string | null;
  stage?: "signal" | "checklist" | "open";
  reason: string;
};

type SkippedEntry = {
  symbol: string;
  setup?: string | null;
  reason: string;
};

type PromotionReport = {
  ts: string;
  date: string;
  dryRun: boolean;
  maxPerDay?: number;
  riskPct?: number;
  symbolsConsidered: number;
  equity?: number;
  watchlistDate?: string;
  watchlistUniverse?: string;
  promoted: PromotedEntry[];
  rejected: RejectedEntry[];
  skipped: SkippedEntry[];
  errors: string[];
};

// Mirror of research/paper-trading/src/journal/account.mjs `reduceEvents`,
// reimplemented in TS so the dashboard can reduce the event log without
// importing the .mjs module across package boundaries. Pure.
function reduceAccount(events: AccountEvent[], openPositions: number): AccountSnapshot {
  let initIdx = -1;
  for (let i = events.length - 1; i >= 0; i--) {
    if (events[i].type === "init") { initIdx = i; break; }
  }
  if (initIdx < 0) {
    return {
      initialized: false, startingBalance: 0, currency: "USD",
      realizedPnl: 0, equity: 0, returnPct: 0,
      closedTrades: 0, openTrades: openPositions,
    };
  }
  const init = events[initIdx] as Extract<AccountEvent, { type: "init" }>;
  let realized = 0, closed = 0;
  for (let i = initIdx + 1; i < events.length; i++) {
    const e = events[i];
    if (e.type === "trade-closed" && Number.isFinite(e.pnl)) {
      realized += e.pnl;
      closed += 1;
    }
  }
  const equity = init.startingBalance + realized;
  const returnPct = (realized / init.startingBalance) * 100;
  return {
    initialized: true,
    startingBalance: init.startingBalance,
    currency: init.currency ?? "USD",
    realizedPnl: round(realized, 2),
    equity: round(equity, 2),
    returnPct: round(returnPct, 2),
    closedTrades: closed,
    openTrades: openPositions,
  };
}

function round(x: number, d: number): number {
  const p = 10 ** d;
  return Math.round(x * p) / p;
}

// Build a cumulative P&L series from closed trades, ordered by exit time.
function buildCumulativePnl(trades: Trip[]): Array<{ t: number; cum: number }> {
  const sorted = trades
    .filter((t) => Number.isFinite(t.pnl) && t.exitAt)
    .slice()
    .sort((a, b) => Date.parse(a.exitAt) - Date.parse(b.exitAt));
  let cum = 0;
  return sorted.map((t) => {
    cum += t.pnl;
    return { t: Date.parse(t.exitAt), cum };
  });
}

// Minimal no-dep SVG line chart. Server-rendered.
function SparklinePnl({ series, width = 1040, height = 180 }: { series: Array<{ t: number; cum: number }>; width?: number; height?: number }) {
  if (series.length < 2) {
    return (
      <div style={{ color: "#888", fontSize: 12, padding: 12, border: "1px dashed #333" }}>
        Need at least 2 closed trades to render equity curve.
      </div>
    );
  }
  const pad = 24;
  const xs = series.map((p) => p.t);
  const ys = series.map((p) => p.cum);
  const xMin = Math.min(...xs);
  const xMax = Math.max(...xs);
  const yMin = Math.min(...ys, 0);
  const yMax = Math.max(...ys, 0);
  const xSpan = Math.max(1, xMax - xMin);
  const ySpan = Math.max(1e-9, yMax - yMin);
  const xOf = (t: number) => pad + ((t - xMin) / xSpan) * (width - 2 * pad);
  const yOf = (v: number) => height - pad - ((v - yMin) / ySpan) * (height - 2 * pad);
  const d = series.map((p, i) => `${i === 0 ? "M" : "L"} ${xOf(p.t).toFixed(1)} ${yOf(p.cum).toFixed(1)}`).join(" ");
  const zeroY = yOf(0);
  const last = series[series.length - 1];
  const lineColor = last.cum >= 0 ? "#6c6" : "#c66";
  return (
    <svg width={width} height={height} role="img" aria-label="Cumulative P&L equity curve">
      <rect x={0} y={0} width={width} height={height} fill="#0b0b0b" stroke="#222" />
      <line x1={pad} x2={width - pad} y1={zeroY} y2={zeroY} stroke="#333" strokeDasharray="3 3" />
      <path d={d} fill="none" stroke={lineColor} strokeWidth={1.5} />
      <text x={pad} y={pad - 6} fill="#888" fontSize={10} fontFamily="ui-monospace, monospace">
        {`min ${yMin.toFixed(2)}  ·  max ${yMax.toFixed(2)}  ·  last ${last.cum.toFixed(2)}`}
      </text>
    </svg>
  );
}

// Minimal no-dep SVG bar chart for best OOS Sharpe per run.
function SharpeBars({ runs, width = 1040, height = 180 }: { runs: Run[]; width?: number; height?: number }) {
  const points = runs
    .map((r) => ({
      runId: r.runId,
      ts: r.ts,
      best: r.results?.length ? Math.max(...r.results.map((x) => x.test?.sharpe ?? 0)) : null,
    }))
    .filter((p): p is { runId: string; ts: string; best: number } => p.best != null && Number.isFinite(p.best));
  if (points.length === 0) {
    return (
      <div style={{ color: "#888", fontSize: 12, padding: 12, border: "1px dashed #333" }}>
        No backtest runs with OOS Sharpe available.
      </div>
    );
  }
  const pad = 24;
  const yMax = Math.max(1, ...points.map((p) => p.best));
  const yMin = Math.min(0, ...points.map((p) => p.best));
  const ySpan = Math.max(1e-9, yMax - yMin);
  const barW = Math.max(4, (width - 2 * pad) / points.length - 2);
  const yOf = (v: number) => height - pad - ((v - yMin) / ySpan) * (height - 2 * pad);
  const zeroY = yOf(0);
  return (
    <svg width={width} height={height} role="img" aria-label="Best OOS Sharpe per run">
      <rect x={0} y={0} width={width} height={height} fill="#0b0b0b" stroke="#222" />
      <line x1={pad} x2={width - pad} y1={zeroY} y2={zeroY} stroke="#333" strokeDasharray="3 3" />
      {points.map((p, i) => {
        const x = pad + i * ((width - 2 * pad) / points.length) + 1;
        const y = p.best >= 0 ? yOf(p.best) : zeroY;
        const h = Math.abs(yOf(p.best) - zeroY);
        const color = p.best >= 1 ? "#6c6" : p.best >= 0 ? "#cc6" : "#c66";
        return <rect key={p.runId + i} x={x} y={y} width={barW} height={h} fill={color} />;
      })}
      <text x={pad} y={pad - 6} fill="#888" fontSize={10} fontFamily="ui-monospace, monospace">
        {`${points.length} runs  ·  best ${Math.max(...points.map((p) => p.best)).toFixed(2)}  ·  worst ${Math.min(...points.map((p) => p.best)).toFixed(2)}`}
      </text>
    </svg>
  );
}

// Account header: starting $, current equity, P&L (abs + %), open positions.
function AccountHeader({ snap }: { snap: AccountSnapshot }) {
  if (!snap.initialized) {
    return (
      <div style={{ border: "1px dashed #333", padding: 16, marginBottom: 32, color: "#888" }}>
        No account initialized yet. Run{" "}
        <code>node research/paper-trading/src/cli.mjs account-init --balance 10000</code>{" "}
        to start tracking a hypothetical ledger. Not live money.
      </div>
    );
  }
  const sign = snap.realizedPnl >= 0 ? "+" : "";
  const pnlColor = snap.realizedPnl >= 0 ? "#6c6" : "#c66";
  const cell = { flex: 1, minWidth: 140 };
  const label = { color: "#888", fontSize: 11, textTransform: "uppercase" as const, letterSpacing: 0.5 };
  const value = { fontSize: 22, fontWeight: 600 as const, color: "#eee" };
  return (
    <div
      style={{
        border: "1px solid #222",
        background: "#0b0b0b",
        padding: 20,
        marginBottom: 32,
        display: "flex",
        gap: 24,
        flexWrap: "wrap",
      }}
    >
      <div style={cell}>
        <div style={label}>Starting balance</div>
        <div style={value}>${snap.startingBalance.toFixed(2)}</div>
        <div style={{ color: "#666", fontSize: 11 }}>{snap.currency}</div>
      </div>
      <div style={cell}>
        <div style={label}>Current equity</div>
        <div style={value}>${snap.equity.toFixed(2)}</div>
      </div>
      <div style={cell}>
        <div style={label}>Realized P&amp;L</div>
        <div style={{ ...value, color: pnlColor }}>
          {sign}${snap.realizedPnl.toFixed(2)}
        </div>
        <div style={{ color: pnlColor, fontSize: 11 }}>
          {sign}
          {snap.returnPct.toFixed(2)}%
        </div>
      </div>
      <div style={cell}>
        <div style={label}>Trades</div>
        <div style={value}>
          {snap.closedTrades}
          <span style={{ color: "#666", fontSize: 14 }}> closed</span>
        </div>
        <div style={{ color: "#666", fontSize: 11 }}>{snap.openTrades} open</div>
      </div>
    </div>
  );
}

// Today's watchlist panel.
function WatchlistPanel({ entry }: { entry: WatchlistEntry | null }) {
  if (!entry) {
    return (
      <div style={{ color: "#888", fontSize: 12, padding: 12, border: "1px dashed #333" }}>
        No watchlist generated yet. Run{" "}
        <code>node research/paper-trading/src/cli.mjs watchlist-build</code>.
      </div>
    );
  }
  return (
    <div>
      <p style={{ color: "#888", fontSize: 11, marginTop: 0 }}>
        {entry.date} · {entry.fetched ?? 0}/{entry.universeSize ?? 0} fetched ·{" "}
        {entry.survivors ?? 0} survivors
      </p>
      {entry.topN.length === 0 ? (
        <p style={{ color: "#888" }}>Empty topN. Adjust universe or liquidity floor.</p>
      ) : (
        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12 }}>
          <thead>
            <tr style={{ textAlign: "left", borderBottom: "1px solid #333" }}>
              <th style={{ padding: 6 }}>Symbol</th>
              <th>Score</th>
              <th>Last close</th>
              <th>As of</th>
              <th>Reasons</th>
            </tr>
          </thead>
          <tbody>
            {entry.topN.map((r) => (
              <tr key={r.symbol} style={{ borderBottom: "1px solid #222" }}>
                <td style={{ padding: 6, fontWeight: 600 }}>{r.symbol}</td>
                <td>{r.score.toFixed(2)}</td>
                <td>${r.lastClose.toFixed(2)}</td>
                <td style={{ color: "#666" }}>{r.lastDate}</td>
                <td style={{ color: "#aaa" }}>{r.reasons.join(" · ") || "(baseline)"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}

// Open shadow positions (research blotter, not live).
function OpenPositions({ open }: { open: ShadowRec[] }) {
  if (open.length === 0) {
    return (
      <p style={{ color: "#888", fontSize: 12 }}>
        No open shadow positions. All shadow trades are hypothetical — there is no broker.
      </p>
    );
  }
  return (
    <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12 }}>
      <thead>
        <tr style={{ textAlign: "left", borderBottom: "1px solid #333" }}>
          <th style={{ padding: 6 }}>Symbol</th>
          <th>Side</th>
          <th>Qty</th>
          <th>Entry</th>
          <th>Stop</th>
          <th>Target</th>
          <th>Setup</th>
          <th>Opened</th>
        </tr>
      </thead>
      <tbody>
        {open.map((r) => (
          <tr key={r.shadowId} style={{ borderBottom: "1px solid #222" }}>
            <td style={{ padding: 6, fontWeight: 600 }}>{r.symbol}</td>
            <td style={{ color: r.side === "BUY" ? "#6c6" : "#c66" }}>{r.side}</td>
            <td>{r.qty}</td>
            <td>${r.entry.toFixed(2)}</td>
            <td>{r.stop != null ? `$${r.stop.toFixed(2)}` : ""}</td>
            <td>{r.target != null ? `$${r.target.toFixed(2)}` : ""}</td>
            <td style={{ color: "#aaa" }}>{r.setup ?? ""}</td>
            <td style={{ color: "#666" }}>{(r.openedAt ?? r.entryDate ?? "").slice(0, 10)}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

// Auto-promoter decision panel — shows the latest promotion report.
// Three possible visual states:
//   1. No report on disk (panel invites user to run it)
//   2. Report with promoted trades (primary view — table of plans)
//   3. Report with only rejections (secondary view — explanations)
function PromotionsPanel({ report }: { report: PromotionReport | null }) {
  if (!report) {
    return (
      <p style={{ color: "#888", fontSize: 12 }}>
        No auto-promote runs yet. The nightly cron will start recording decisions
        to <code>journal/promotions.jsonl</code>.
      </p>
    );
  }
  const modeLabel = report.dryRun ? "DRY RUN" : "LIVE";
  const modeColor = report.dryRun ? "#cc6" : "#6c6";
  return (
    <div>
      <p style={{ color: "#888", fontSize: 12, marginTop: 0 }}>
        Run: <span style={{ color: "#ccc" }}>{report.date}</span>{" "}
        <span style={{ color: modeColor }}>[{modeLabel}]</span> ·{" "}
        Considered <span style={{ color: "#ccc" }}>{report.symbolsConsidered}</span> symbols ·{" "}
        Equity <span style={{ color: "#ccc" }}>${report.equity?.toFixed(2) ?? "?"}</span>
        {report.watchlistDate ? <> · Watchlist <span style={{ color: "#ccc" }}>{report.watchlistDate}</span></> : null}
      </p>
      {report.promoted.length > 0 ? (
        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12, marginBottom: 16 }}>
          <thead>
            <tr style={{ textAlign: "left", borderBottom: "1px solid #333" }}>
              <th style={{ padding: 6 }}>Symbol</th>
              <th>Setup</th>
              <th>Strategy</th>
              <th>Entry</th>
              <th>Stop</th>
              <th>Target</th>
              <th>Qty</th>
              <th>R:R</th>
              <th>Shadow</th>
            </tr>
          </thead>
          <tbody>
            {report.promoted.map((p, i) => {
              const rr =
                p.plan.entry !== p.plan.stop
                  ? (p.plan.target - p.plan.entry) / (p.plan.entry - p.plan.stop)
                  : 0;
              return (
                <tr key={`${p.shadowId ?? p.symbol}-${i}`} style={{ borderBottom: "1px solid #222" }}>
                  <td style={{ padding: 6, fontWeight: 600 }}>{p.symbol}</td>
                  <td style={{ color: "#aaa" }}>{p.setup}</td>
                  <td style={{ color: "#888" }}>{p.strategy ?? ""}</td>
                  <td>${p.plan.entry.toFixed(2)}</td>
                  <td>${p.plan.stop.toFixed(2)}</td>
                  <td>${p.plan.target.toFixed(2)}</td>
                  <td>{p.plan.qty}</td>
                  <td style={{ color: "#6c6" }}>{rr.toFixed(2)}R</td>
                  <td style={{ color: "#666", fontSize: 10 }}>
                    {p.shadowId ? p.shadowId.slice(0, 8) : "(dry-run)"}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      ) : (
        <p style={{ color: "#888", fontSize: 12, marginBottom: 16 }}>
          No trades promoted on this run.
        </p>
      )}
      {report.rejected.length > 0 && (
        <details style={{ marginBottom: 8 }}>
          <summary style={{ cursor: "pointer", color: "#888", fontSize: 12 }}>
            Rejected ({report.rejected.length})
          </summary>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 11, marginTop: 8 }}>
            <thead>
              <tr style={{ textAlign: "left", borderBottom: "1px solid #222", color: "#666" }}>
                <th style={{ padding: 4 }}>Symbol</th>
                <th>Setup</th>
                <th>Stage</th>
                <th>Reason</th>
              </tr>
            </thead>
            <tbody>
              {report.rejected.map((r, i) => (
                <tr key={`${r.symbol}-${i}`} style={{ borderBottom: "1px solid #1a1a1a" }}>
                  <td style={{ padding: 4, color: "#aaa" }}>{r.symbol}</td>
                  <td style={{ color: "#888" }}>{r.setup ?? "-"}</td>
                  <td style={{ color: "#666" }}>{r.stage ?? "-"}</td>
                  <td style={{ color: "#888" }}>{r.reason}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </details>
      )}
      {report.skipped.length > 0 && (
        <details>
          <summary style={{ cursor: "pointer", color: "#888", fontSize: 12 }}>
            Skipped ({report.skipped.length})
          </summary>
          <ul style={{ color: "#888", fontSize: 11, margin: "8px 0 0 16px" }}>
            {report.skipped.map((s, i) => (
              <li key={`${s.symbol}-${i}`}>
                <code>{s.symbol}</code>
                {s.setup ? ` (${s.setup})` : ""}: {s.reason}
              </li>
            ))}
          </ul>
        </details>
      )}
      {report.errors.length > 0 && (
        <div style={{ marginTop: 12, padding: 8, border: "1px solid #442", background: "#1a1005", fontSize: 11 }}>
          <div style={{ color: "#c66", marginBottom: 4 }}>Errors ({report.errors.length}):</div>
          <ul style={{ color: "#caa", margin: "0 0 0 16px" }}>
            {report.errors.map((e, i) => <li key={i}>{e}</li>)}
          </ul>
        </div>
      )}
    </div>
  );
}

// Agent activity feed — last N LLM calls from journal/llm-usage.jsonl.
function AgentFeed({ rows }: { rows: LlmUsageRow[] }) {
  if (rows.length === 0) {
    return (
      <p style={{ color: "#888", fontSize: 12 }}>
        No agent activity logged yet. Runs are recorded to{" "}
        <code>journal/llm-usage.jsonl</code>.
      </p>
    );
  }
  return (
    <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12 }}>
      <thead>
        <tr style={{ textAlign: "left", borderBottom: "1px solid #333" }}>
          <th style={{ padding: 6 }}>Time</th>
          <th>Agent</th>
          <th>Tier</th>
          <th>Mode</th>
          <th>Tokens</th>
          <th>Status</th>
        </tr>
      </thead>
      <tbody>
        {rows.map((r, i) => {
          const inTok = r.tokensIn ?? 0;
          const outTok = r.tokensOut ?? 0;
          const mode = r.stub ? "stub" : r.error ? "error" : "live";
          const modeColor = r.stub ? "#888" : r.error ? "#c66" : "#6c6";
          return (
            <tr key={`${r.ts}-${i}`} style={{ borderBottom: "1px solid #222" }}>
              <td style={{ padding: 6, color: "#666" }}>{r.ts.slice(0, 19)}</td>
              <td>{r.agent}</td>
              <td style={{ color: "#aaa" }}>{r.tier}</td>
              <td style={{ color: modeColor }}>{mode}</td>
              <td style={{ color: "#aaa" }}>
                {inTok}↓ {outTok}↑
              </td>
              <td style={{ color: "#888" }}>{r.error ?? r.stopReason ?? ""}</td>
            </tr>
          );
        })}
      </tbody>
    </table>
  );
}

// Read the last watchlist entry from the JSONL log. Server-side, O(file).
async function readLatestWatchlistEntry(): Promise<WatchlistEntry | null> {
  const all = await readJsonl<WatchlistEntry>("watchlist.jsonl");
  return all.length ? all[all.length - 1] : null;
}

// Read the last promotion report from the JSONL log. Server-side, O(file).
async function readLatestPromotionReport(): Promise<PromotionReport | null> {
  const all = await readJsonl<PromotionReport>("promotions.jsonl");
  return all.length ? all[all.length - 1] : null;
}

export default async function ResearchPage() {
  const runs = (await readJsonl<Run>("runs.jsonl")).slice(-20).reverse();
  const trades = await readJsonl<Trip>("manual-trades.jsonl");
  const accountEvents = await readJsonl<AccountEvent>("account.jsonl");
  const shadows = await readJsonl<ShadowRec>("shadow-book.jsonl");
  const usageRows = (await readJsonl<LlmUsageRow>("llm-usage.jsonl")).slice(-20).reverse();
  const latestWatchlist = await readLatestWatchlistEntry();
  const latestPromotion = await readLatestPromotionReport();

  const openPositions = shadows.filter((s) => s.status === "open");
  const accountSnap = reduceAccount(accountEvents, openPositions.length);

  const totalPnl = trades
    .filter((t) => "pnl" in t)
    .reduce((s, t) => s + (t.pnl ?? 0), 0);

  const equity = buildCumulativePnl(trades);

  return (
    <div style={{ maxWidth: 1100, margin: "40px auto", padding: 24, fontFamily: "ui-monospace, SFMono-Regular, monospace" }}>
      <h1 style={{ fontSize: 24, marginBottom: 4 }}>Paper-trading research dashboard</h1>
      <p style={{ color: "#888", marginTop: 0, marginBottom: 32 }}>
        Read-only. No trade entry. Paper/simulation only.
      </p>

      <AccountHeader snap={accountSnap} />

      <section style={{ marginBottom: 40 }}>
        <h2 style={{ fontSize: 18 }}>Today&apos;s watchlist (screener-picked)</h2>
        <WatchlistPanel entry={latestWatchlist} />
      </section>

      <section style={{ marginBottom: 40 }}>
        <h2 style={{ fontSize: 18 }}>Last night&apos;s promotions (auto-promoter)</h2>
        <PromotionsPanel report={latestPromotion} />
      </section>

      <section style={{ marginBottom: 40 }}>
        <h2 style={{ fontSize: 18 }}>Open shadow positions</h2>
        <OpenPositions open={openPositions} />
      </section>

      <section style={{ marginBottom: 40 }}>
        <h2 style={{ fontSize: 18 }}>Cumulative P&amp;L (manual journal)</h2>
        <SparklinePnl series={equity} />
      </section>

      <section style={{ marginBottom: 40 }}>
        <h2 style={{ fontSize: 18 }}>Agent activity (last 20 LLM calls)</h2>
        <AgentFeed rows={usageRows} />
      </section>

      <section style={{ marginBottom: 40 }}>
        <h2 style={{ fontSize: 18 }}>Best OOS Sharpe by run</h2>
        <SharpeBars runs={runs.slice().reverse()} />
      </section>

      <section style={{ marginBottom: 40 }}>
        <h2 style={{ fontSize: 18 }}>Recent backtest runs</h2>
        {runs.length === 0 ? (
          <p style={{ color: "#888" }}>No runs yet. Execute the CLI to generate data.</p>
        ) : (
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12 }}>
            <thead>
              <tr style={{ textAlign: "left", borderBottom: "1px solid #333" }}>
                <th style={{ padding: 6 }}>Time</th>
                <th>Kind</th>
                <th>Symbol</th>
                <th>Run ID</th>
                <th>Best OOS Sharpe</th>
              </tr>
            </thead>
            <tbody>
              {runs.map((r) => {
                const bestOos = r.results?.length
                  ? Math.max(...r.results.map((x) => x.test?.sharpe ?? 0))
                  : null;
                return (
                  <tr key={r.runId} style={{ borderBottom: "1px solid #222" }}>
                    <td style={{ padding: 6 }}>{new Date(r.ts).toISOString().slice(0, 19)}</td>
                    <td>{r.kind}</td>
                    <td>{r.symbol || ""}</td>
                    <td style={{ color: "#666" }}>{r.runId.slice(0, 8)}</td>
                    <td>{bestOos?.toFixed(2) ?? ""}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </section>

      <section>
        <h2 style={{ fontSize: 18 }}>Personal trade log</h2>
        <p style={{ color: "#888" }}>
          {trades.length} entries · total P&amp;L {totalPnl >= 0 ? "+" : ""}
          {totalPnl.toFixed(2)}
        </p>
        {trades.length === 0 ? (
          <p style={{ color: "#888" }}>
            Log trades via <code>node research/paper-trading/src/cli.mjs log ...</code>
          </p>
        ) : (
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12 }}>
            <thead>
              <tr style={{ textAlign: "left", borderBottom: "1px solid #333" }}>
                <th style={{ padding: 6 }}>Time</th>
                <th>Symbol</th>
                <th>Side</th>
                <th>Setup</th>
                <th>Emotion</th>
                <th>P&amp;L</th>
              </tr>
            </thead>
            <tbody>
              {trades.slice(-50).reverse().map((t, i) => (
                <tr key={i} style={{ borderBottom: "1px solid #222" }}>
                  <td style={{ padding: 6 }}>{(t as Trip).exitAt?.slice(0, 16) ?? ""}</td>
                  <td>{t.symbol}</td>
                  <td>{(t as Trip).direction}</td>
                  <td>{(t as Trip).setup || ""}</td>
                  <td>{(t as Trip).emotion || ""}</td>
                  <td style={{ color: ((t as Trip).pnl ?? 0) >= 0 ? "#6c6" : "#c66" }}>
                    {(t as Trip).pnl?.toFixed(2) ?? ""}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </section>
    </div>
  );
}
